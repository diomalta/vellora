# Real-document corpus (fidelity area A3)

Spec-derived and permissively licensed documents that make native fidelity measurable by third-party
oracles, plus the acceptance criteria they are judged against ([`../ACCEPTANCE.md`](../ACCEPTANCE.md)).
Provenance, hashes and licences: [`SOURCES.md`](SOURCES.md) / [`sources.json`](sources.json).
Latest INDICATIVE run: [`RESULTS.md`](RESULTS.md).

## Fixtures (under the repo-root `fixtures/`)

| Fixture | What it is | Data |
|---|---|---|
| `boleto-febraban/` | Boleto de pagamento (Recibo do Pagador + Ficha de Compensação) from BCB Carta-Circular 2.926 / Circular 3.598 and the CAIXA SIGCB manual; ITF barcode drawn as CSS bars at the mandated 103 × 13 mm | `data.json` (spec geometry), `data.px-grid.json` (DIAGNOSTIC: 1 px / 3 px bars, 107.16 mm) |
| `danfe/` | DANFE retrato, folhas soltas, laser, from MOC 7.0 Anexo II; CODE-128C of the chave drawn as CSS bars with a 1 CSS px module | `data.json` |
| `text-stress-ptbr/` | Self-authored text stress: pt-BR diacritics, U+2212, ligature candidates, long words, mixed weights, 132-row multi-page statement with repeated `<thead>` and `break-inside: avoid` month groups | `data.json` |
| `oss-sparksuite-invoice/` | sparksuite/simple-html-invoice-template (MIT), minimal adaptation | `data.json`, `LICENSE`, `NOTICE.md` |
| `oss-postmark-receipt/` | Postmark "receipt" e-mail template (MIT), minimal adaptation | `data.json`, `LICENSE`, `NOTICE.md` |

These directories are **not** consumed by `npm test`, the examples or the visual scripts: every
existing consumer (`packages/test-harness/src/fixtures.ts`, `scripts/render-visual-fixtures.mjs`,
`benchmarks/visual-fidelity.mjs`, `packages/vellora/test/*`) uses an explicit id list
(`invoice`, `receipt`, `boleto`, `notification`, `invoice-broken`), CONFIRMED by reading them.
All five render through `renderPdf(..., { strict: true })` without a strict-gate rejection, so no
fixture had to be adapted to the subset or kept as expected-unsupported. Silent mis-renders that the
gate accepts are what the criteria measure.

`data*.json` of the three self-authored fixtures are **derived**: edit `inputs/*.json` and run
`node fidelity/corpus/build-fixtures.mjs` (the node tests fail on drift).

## Commands (repo root, Node 22)

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
npm ci && npm run build                                   # real native addon (needed for renders)
uv venv --python 3.12 fidelity/.venv
uv pip install --python fidelity/.venv/bin/python -r fidelity/corpus/requirements.txt
node --test 'fidelity/corpus/test/*.test.mjs'             # spec worked examples, drift, consistency
node fidelity/corpus/build-fixtures.mjs --check           # derived data in sync with inputs
node fidelity/corpus/fetch-sources.mjs                    # re-download primary sources, verify sha256
node fidelity/corpus/audit-existing-boleto.mjs            # audit of the pre-existing fixtures/boleto
node fidelity/corpus/render-corpus.mjs                    # render + oracles -> fidelity/results/corpus/<ts>/
node fidelity/corpus/render-corpus.mjs --snapshot fidelity/corpus/RESULTS.md   # refresh the snapshot
```

`render-corpus.mjs` needs poppler (`pdftoppm`, `pdftotext`, `pdfinfo`, `pdffonts`, `pdfimages`) and a
Chrome binary (`VELLORA_CHROME`, default `/Applications/Google Chrome.app/...`; `--no-chrome` skips the
reference and marks reference criteria NOT-RUN). The Chromium reference is driven through the Chrome
CLI (`--headless=new --print-to-pdf`) rather than puppeteer-core, a deliberate deviation so the corpus
adds no npm dependency to `fidelity/package.json` (owned by another area). CI should pin a Chrome for
Testing build with `@puppeteer/browsers` and pass its path in `VELLORA_CHROME`.

## Files

| Path | Role |
|---|---|
| `lib/check-digits.mjs`, `lib/boleto.mjs`, `lib/itf.mjs`, `lib/code128c.mjs`, `lib/nfe.mjs` | Validators / encoders, each citing the spec section it implements |
| `lib/build.mjs`, `build-fixtures.mjs`, `inputs/*.json` | Derive fixture data (check digits, barcodes, totals, statement) |
| `lib/chrome-ref.mjs` | Chromium reference renderer with Liberation `@font-face` aliases |
| `lib/fixture-io.mjs`, `render-one.mjs` | Shared render options; child-process render for DET-2 |
| `render-corpus.mjs`, `corpus.json` | Runner + per-fixture criteria manifest |
| `decode_barcodes.py` | zxing-cpp decode of page rasters; ideal-raster ground truth + negative control |
| `measure_bars.py` | Bar geometry from the raster vs `data.json` (length, height, placement, edge error, quiet zones, cut line) |
| `font_sizes.py`, `pdf_probe.py` | pdfminer font sizes / positions; pypdf + pdfminer text; strict parse; ink box; money columns |
| `make_placeholder_logo.py` | Neutral CC0 logo used instead of an upstream brand logo |
| `fetch-sources.mjs`, `sources.json` | Reproducible download + sha256 check of the primary documents |

## Findings at this pin (2026-10-21, INDICATIVE local run; details in RESULTS.md)

- **CONFIRMED — whole-CSS-px snapping in both engines.** Every box edge vellora emits is a multiple of
  0.75 pt (1 CSS px) — seen in the PDF content stream of a bar probe — and `crates/vellora-core/src/pdf.rs`
  only scales px → pt by 0.75 without rounding (grep: no geometry rounding in `pdf.rs`,
  `layout_normalize.rs`, `pagination.rs`, `blitz_engine.rs`). The pinned Blitz rev `2003ba5` calls
  `taffy::round_layout` unconditionally in `blitz-dom/src/resolve.rs::resolve_layout`, and the
  `v0.3.0-beta.4` tag does the same (`round_layout` / `physicalise_and_round_layout`, read via the
  GitHub contents API). So this geometry loss is introduced by raw Blitz layout, not by vellora's
  post-layout passes. Chromium 155 shows the same class of snapping for backgrounds: neither engine
  decodes the spec-geometry ITF (X = 0.2543 mm: vellora 108 / Chrome 107 of 114 bars), both decode
  the px-grid variant (bar-edge error 0.021 mm vellora, 0.032 mm Chrome).
- **CONFIRMED — vellora layout losses the strict gate does not catch:** declared table column widths
  not honored (boleto/DANFE header cells at equal widths), the boleto recibo's fixed `height: 175mm`
  not honored (ficha top at 131.9 mm instead of 186 mm), the linha digitável drawn past the right page
  edge (pdftotext drops it, pypdf/pdfminer still extract it), the DANFE overflowing to a second page
  and its CODE-128C not decoding although its module is a whole CSS px, the sparksuite logo `<img>`
  silently not painted (0 image XObjects; strict render succeeded), and anchor drifts vs Chrome of
  11.2 mm (text stress, page 1), 11.5 mm (sparksuite) and 5.5 mm (Postmark). Causes are NOT
  attributed here (→ layout-diff area); HYPOTHESIS for the column widths and the recibo height:
  vellora's own table/pagination handling, since a minimal `height: 100mm` probe is honored.
- **CONFIRMED — what already works:** strict acceptance of all five documents, determinism (DET-1 and
  DET-2 under another TZ/LANG), all font-size minimums of the DANFE that could be located, money
  column right edges aligned to 0 mm spread, required text extraction for the text-stress, invoice
  and receipt documents in all three extractors.
- **Observed, cause unknown:** in a probe with 114 absolutely positioned bars, vellora painted one
  merged rectangle at the top of the page; with 3 absolutely positioned children it placed them
  correctly. Probe HTML is reproducible from `lib/itf.mjs` (not committed as a fixture).
