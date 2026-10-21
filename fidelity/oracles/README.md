# External PDF oracles (`fidelity/oracles/`)

Third-party tools judge a vellora PDF instead of our own code: **qpdf** (PDF validity), **veraPDF**
(PDF/A-2B), **three independent text extractors** (poppler `pdftotext`, pdfminer.six, PyMuPDF)
checked against Chrome's print-media text, **two barcode decoders** (zxing-cpp, zbar) plus the
BCB/FEBRABAN check digits, and **WeasyPrint as a second layout reference** next to Chrome.

Phase A scope: measure and attribute. Nothing here changes how vellora renders, and nothing gates a
merge yet (per-class thresholds belong in `fidelity/ACCEPTANCE.md`).

## Run it

```bash
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"   # Node 22 (.nvmrc)
npm ci && npm run build                                      # vellora native addon + TS

# Python oracles (host): Python 3.12 venv, hash-locked
uv venv fidelity/.venv --python 3.12
uv pip install --python fidelity/.venv/bin/python --require-hashes -r fidelity/oracles/requirements.txt

# Node deps of the oracles (puppeteer-core only; never downloads a browser)
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity/oracles ci

# Linux tools image (qpdf, zbarimg, WeasyPrint) and the official veraPDF image
docker build -f fidelity/oracles/docker/tools.Dockerfile -t vellora-fidelity-tools:local fidelity/oracles/docker
docker pull --platform linux/amd64 verapdf/cli:v1.30.3@sha256:d565095c67a083e693aebf7d1a15784007370571053fc1aa5b502665b9a78f9c

# All oracles x 4 fixtures x {plain, pdfa: "PDF/A-2b"} + canaries -> fidelity/results/oracles/<run-id>/
node fidelity/oracles/run-fixtures.mjs

# One PDF
node fidelity/oracles/run.mjs --pdf out.pdf --html templated.html --class boleto \
  --expect expect.json --pdfa PDF/A-2b --out /tmp/oracle-run

# Self-tests (node:test; NOT picked up by the root vitest, which only globs packages/*)
cd fidelity/oracles && node --test                                 # unit tests
cd fidelity/oracles && VELLORA_ORACLE_INTEGRATION=1 node --test    # + real tools / real render
```

`--html` is the final HTML the PDF was rendered from (templated, images inlined). Chrome and
WeasyPrint render that same HTML with vellora's bundled Liberation fonts injected as `@font-face`
data URLs (`lib/html-prep.mjs`; the alias table is a copy of `benchmarks/visual-fidelity.mjs` with a
drift test, because importing that module runs its harness). `--pdfa` means "this PDF claims PDF/A-2b"
(veraPDF must pass); `--no-pdfa` means it does not (veraPDF is then a negative control and must
fail); neither means report-only. `--expect` takes
`{ "barcode": { "digits": "<44>" }, "linhaDigitavel": "<47 digits>" }`.

To score another build (for example the Blitz beta.4 research branch) without rebuilding here, set
`VELLORA_ORACLE_SUBJECT_MODULE=/abs/path/to/packages/vellora/dist/index.js` (and optionally
`VELLORA_ORACLE_SUBJECT_LABEL`). Templating still uses this checkout, so both builds get
byte-identical HTML. The swap is recorded in `environment.vellora.subject`.

## Pins and install routes

| Tool | Pinned version | Route | Why this route |
|---|---|---|---|
| qpdf | 12.2.0 (Debian `qpdf=12.2.0-1`) | `QPDF_BIN` / `qpdf` on PATH first, else tools image | The real CLI and its documented exit codes (0 ok, 2 errors, 3 warnings). pikepdf bundles libqpdf, not the CLI. |
| veraPDF | 1.30.3, `verapdf/cli@sha256:d565…f9c` | official Docker image, `--flavour 2b --format json` | Java is not installed on the host. The image is amd64-only, so it runs emulated on Apple Silicon (recorded as `emulated`). The bundled `cli-1.30.3.jar` contains `org.verapdf:parser` (the greenfield parser) and no PDFBox classes (checked 2026-10-21). |
| pdftotext | poppler 26.06.0 (host) | `PDFTOTEXT_BIN` / PATH | Already installed. Version recorded per run. |
| pdfminer.six | 20260107 | `fidelity/.venv` | Pure-Python extractor; shares no code with poppler or MuPDF. |
| PyMuPDF | 1.28.2 | `fidelity/.venv` | Third extractor and the word-anchor source. 2.0 came out 2026-10-19, a day before this pin was chosen, so it was not adopted. |
| zxing-cpp | 3.1.1 | `fidelity/.venv` | Decoder #1 (ITF). |
| zbar | 0.23.93 (Debian `zbar-tools=0.23.93-8`) | tools image | Decoder #2 (`-Sdisable -Si25.enable`). No host install. |
| WeasyPrint | 70.0 | tools image (Pango 1.56.3, HarfBuzz 10.2.0) | Pango is not installed on the host. Docker keeps it off the host and makes the CI route identical. |
| Chrome | local 155.0.8059.85 (INDICATIVE) | `puppeteer-core@25.15.0`, explicit `executablePath` | Override with `VELLORA_ORACLE_CHROME`. |

The tools image base is pinned by its multi-arch index digest. Every apt package is pinned to an exact
Debian version (a mirror update fails the build instead of changing an oracle). Python wheels are
hash-locked. Each result records the image ID and the sha256 of the recipe (Dockerfile + lock).

**WeasyPrint version.** `benchmarks/` pins 62.3, but that pin is for a throughput benchmark. This
layout oracle uses 70.0 (2026-09-08). Changelog items from 63.0 to 70.0 that matter here, read
2026-10-21: colspan cell-width rounding (#2842), harmonized table page breaks (#2877), collapsed
borders with footers (#2873), font ascent/descent fix (64.1, #2368), line-break point fixes (70.0,
#2614/#2803), and security fixes in 68–70. I found no item that regresses margin boxes,
letter-spacing or `text-transform`. Re-check the changelog before moving the pin.

## What each oracle reports

Every oracle returns `{ oracle, status, tool versions, ... }` with status `pass`, `warn`, `fail`,
`info`, `not-run` (with a `reason`) or `skipped` (with a `reason`). A tool that cannot run is
reported as `not-run`. It is never dropped silently.

- **qpdf** (`lib/qpdf.mjs`): `--check`, `--show-xref` and `--show-npages`. There is also an
  independent xref check that re-reads the bytes at every uncompressed offset and requires
  `N G obj` there.
- **veraPDF** (`lib/verapdf.mjs`): PDF/A-2B. Failed rules are reported with their ISO 19005-2
  clause and test number. A plain render failing PDF/A-2B counts as a *pass* of the negative control.
- **text** (`lib/text.mjs`, `lib/tokens.mjs`): the expected text is Chrome's
  `document.body.innerText` under emulated print media, NFC-normalized with whitespace collapsed
  (deliberately not NFKC). Each extractor's tokens are aligned with a character-weighted LCS and
  split into in-order, boundary-only (word-split/merge differences such as letter-spaced digits
  or a wrap after a hyphen), reordered, missing and extra. **Attribution:** every extractor also
  reads Chrome's own PDF of the same HTML. A token an extractor drops or adds for both PDFs is
  *explained*, and only *subject-only* tokens count against vellora. Tokens that appear in
  Chrome's PDF but not in innerText and are missing from vellora (paginator-generated content such
  as `@page` margin boxes) are reported as `controlGeneratedAbsentFromSubject`. **Copy-paste:**
  ligature presentation forms (U+FB00–FB06), nonspacing marks (NFD), U+FFFD, private-use and
  control characters, plus every expected word with diacritics or `ff`/`fi`/`fl` must appear
  verbatim. Verdict: `fail` = subject-only missing tokens or a subject-only copy-paste defect;
  `warn` = subject-only extra/reordered tokens or absent generated content.
- **barcode** (`lib/barcode.mjs`, `lib/febraban.mjs`): `pdftoppm -r 300 -gray`, then ITF decoding
  with zxing-cpp and zbar, compared with `--expect` digits. Any 44-digit decode is validated
  against the BCB/FEBRABAN rules. For boletos, the printed barcode and linha digitável (from
  `--expect` and from the PDF text) are DV-checked as **document data**. A failure there is a
  finding about the data, not about rendering. Implemented from primary sources cited in the code:
  BCB Carta-Circular nº 2926 (24/07/2000), Anexo, items 01.b.II and 01.b.V Nota 1 (layout and the
  mod-11 general DV), and Banco Santander "Código de Barras – Cobrança" v36 (Abril 2025) for the
  mod-10 field DVs and test vectors. UNVERIFIED ASSUMPTION: the Santander mod-10 rule applies to
  every bank, since the FEBRABAN cobrança specification itself was not obtained. Not implemented:
  arrecadação (leading `8`), reported as not applicable; DANFE Code 128, reported as `not-run`.
- **layout-consensus** (`lib/layout.mjs`, `lib/consensus.mjs`, `py/words.py`): word anchors are
  the pen origin x of the first glyph and the baseline y (PyMuPDF `rawdict`). Box tops are not
  used, because they come from producer-declared font ascents (see
  `benchmarks/geometry-fidelity.mjs`). A word occurrence is matched across Chrome, WeasyPrint and
  vellora only when all three have the same count of that text. Count mismatches and page
  mismatches go to explicit buckets. At tol ∈ {0.5, 1, 2, 4} pt, a word where Chrome and
  WeasyPrint agree (max(|dx|,|dy|) ≤ tol) is **consensus**, and vellora's delta is scored against
  their midpoint. Otherwise it is **disputed** and not scored. Per-axis consensus (x-only, y-only)
  is also reported, because vertical drift accumulates down a page and would otherwise hide x
  agreement. Status is `info` until acceptance thresholds exist.

## Trust: canaries

`fidelity/README.md`: an oracle is only trusted after it has been shown to catch a deliberately
broken input. `run-fixtures.mjs` runs these on every invocation (`--no-canaries` to skip) and
computes `caught` from the oracle's own output:

| Oracle | Broken input | Must report |
|---|---|---|
| qpdf | `startxref` shifted by 17 bytes; file truncated to 60 % | status ≠ pass |
| veraPDF | every plain-mode fixture render (no PDF/A claims) | non-compliant |
| text (×3 extractors) | fixture re-rendered with one body word replaced by a marker, scored against the original references | the word is subject-only missing and the marker subject-only extra |
| copy-paste (×3) | U+FB01 written into the text; NFD accents in the text | `copyPaste.pass === false` |
| barcode | valid ITF (Santander example, pixel-aligned modules); same with a wrong DV | pass; decoded but rejected by the mod-11 check |
| layout-consensus | notification re-rendered with the body translated by +6 pt | median signed dx shifts by 6 ± 1 pt |

Two rows are measurements, not pass/fail canaries. The Chrome render of the copy-paste canaries
shows what a browser keeps for the same input. The 0.254 mm (0.96 CSS px) ITF modules test whether
an engine keeps sub-pixel bars.

## Output

`fidelity/results/oracles/<run-id>/` (gitignored): `<fixture>/<mode>/{vellora.pdf,result.json}`,
`<fixture>/reference/{chrome.pdf,chrome-innertext.txt,weasyprint.pdf,weasyprint.json}`,
`canaries/`, and `summary.json`. Every record carries `environment` (date from `date -u`,
OS/kernel without host name, CPU, Node, rustc, Chrome, Docker, poppler, Python packages, image IDs),
the exact `command`, input sha256s, and `deterministic` (two renders compared byte-for-byte).
Paths are rewritten to `<repo>/…` and `~/…`. Committed snapshots of reviewed runs live in
`reports/`.

## CI design (DESIGN TARGET, not wired)

Linux runner, Node 22, `npm ci && npm run build`. Chrome for Testing is pinned with
`npx @puppeteer/browsers@3.2.5 install chrome@155.0.8059.84 --path fidelity/.cache/chrome` (the
closest CfT build to the local 155.0.8059.85; CfT has no `.85`) and passed through
`VELLORA_ORACLE_CHROME`. Use `apt-get install qpdf` or the tools image. Build the tools image
from this Dockerfile (amd64 resolves from the same index digest). veraPDF runs natively on amd64.
Then `node fidelity/oracles/run-fixtures.mjs`, upload `fidelity/results/oracles/`, and diff
`summary.json` against `fidelity/baselines/`.

## Known gaps

- Local results are indicative: macOS arm64, branded Chrome 155.0.8059.85, veraPDF under amd64
  emulation.
- Chrome's `@page` margin boxes, with no font-family set on the root, fall back to a system
  serif. WeasyPrint uses DejaVu Serif from the image. Footer words are therefore usually
  *disputed*, which is the correct outcome.
- Absolute-position consensus loses coverage below the first place where the two references
  break or wrap differently (invoice page 3, boleto footer). Per-axis numbers mitigate this, but
  line-relative consensus is not implemented.
- The fixture boleto prints its barcode as text, so the barcode oracle fails the fixture
  expectation by design. The decoders are proven on the ITF canary instead.
- Only ITF symbols are decoded. Code 128 (DANFE) and arrecadação DV rules are not implemented.
