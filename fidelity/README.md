# vellora fidelity oracles

Tooling that makes native-renderer fidelity **measurable and checkable by third parties**
(WPT, Chromium, WeasyPrint, veraPDF, qpdf, barcode decoders, independent text extractors)
instead of by our own eyes. Private, unpublished, and not a root workspace member — like
`benchmarks/`, its browser and Python dependencies never reach a published package.

## Layout and ownership

| Directory | Owns |
|---|---|
| `wpt/` | WPT reftest runner over the vellora pipeline (pinned WPT commit, sparse checkout into `.cache/`), the WPT crashtest panic oracle (`crashtests.mjs`) and the crates.io-Blitz → upstream-run map (`lib/upstream-map.mjs`). |
| `layout-diff/` | Per-box layout-tree diff: Chromium print-media DOMSnapshot vs raw Blitz vs post-normalize boxes; first-divergence report; `pdf-probe.mjs` (PDF words vs Chrome's PDF); `expected-check-failures.json` (allowlist). |
| `oracles/` | External PDF oracles: veraPDF, qpdf, barcode decode (ITF + Code 128), three text extractors, WeasyPrint second layout oracle, canaries. |
| `corpus/` | Real-document corpus (boleto, DANFE, text stress, OSS invoice/receipt under `fixtures/`) and its spec-derived checks. |
| `lib/chrome-reference.mjs` | THE Chromium reference setup: one font alias table + one puppeteer-core print path, used by corpus, oracles and layout-diff. |
| `gate/` | The value ratchet: snapshot loaders, metric parser, tolerances, comparator, report, baseline writer, code-checks step, self-tests. |
| `baselines/` | Committed baselines the gate compares against (`pin/`, `beta4/`: Phase A shape; `<name>/` written by `gate/write-baseline.mjs`: gate shape; `port/NN-name/`: the Phase B port chain, each step gated against the previous one, convention in `baselines/port/README.md`) and `wpt/<engine>.json` expectations. |
| `ACCEPTANCE.md` | Per-document-class acceptance criteria, each traced to a primary source, plus the gate rules and tolerances (section 8). |
| `run-all.mjs`, `combine/` | Single entry point over every area, the combined summary, and the LET-*/TXT-B1 evaluation (`combine/letter.mjs`). |

Generated output goes to `results/` and downloaded inputs to `.cache/`; both are gitignored.

## Run everything

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"     # Node 22 (.nvmrc)
npm ci && npm run build                                        # real native addon
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity ci             # puppeteer-core for lib/, layout-diff, corpus
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity/wpt ci
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity/oracles ci
uv venv fidelity/.venv --python 3.12                           # ONE venv shared by oracles + corpus:
uv pip install --python fidelity/.venv/bin/python --require-hashes -r fidelity/oracles/requirements.txt
uv pip install --python fidelity/.venv/bin/python -r fidelity/corpus/requirements.txt
docker build -f fidelity/oracles/docker/tools.Dockerfile -t vellora-fidelity-tools:local fidelity/oracles/docker
docker pull --platform linux/amd64 verapdf/cli:v1.30.3@sha256:d565095c67a083e693aebf7d1a15784007370571053fc1aa5b502665b9a78f9c
node fidelity/wpt/fetch-wpt.mjs                                # WPT at the pin

npm --prefix fidelity test                                     # every area's node --test self-tests
node fidelity/run-all.mjs                                      # measure only
```

`run-all.mjs` runs, each as its own process: the repo's own tests and lint (`code-checks`), the WPT
default suites, the 239 WPT crashtests, the corpus, the oracles over the legacy fixtures and over
every corpus PDF (plus a PDF/A-2b render of each), layout-diff and pdf-probe over every measured
fixture; then writes `results/run-all/<run-id>/summary.json` and `summary.md`: environment, exact
commands and exit codes, per-fixture per-oracle verdicts keyed by `ACCEPTANCE.md` criterion IDs
(incl. LET-1/2/3 and TXT-B1), per-WPT-directory pass rates, canary counts and code checks. A
missing prerequisite is reported by the preflight and turns into `not-run` with its reason. Options
are in the script header (`--chrome`, `--wpt-chrome`, `--chrome-from`, `--only`, `--skip`,
`--wpt-arg`, `--tools-image`, `--gate`, `--baseline`, `--accept`). Rebuild the tools image whenever
`oracles/docker/` changes: the runner records the image ID, and an older image under the same tag
is not detected.

## The gate (merge rule of Phase B)

```sh
# Chrome's WPT outcomes do not depend on vellora: reuse a run's results.json (same WPT commit and
# comparison settings), or pass --wpt-chrome for a live Chrome oracle (about 9 more minutes).
node fidelity/run-all.mjs --gate --baseline fidelity/baselines/<previous step> \
  --chrome-from <earlier run>/wpt/results.json [--accept accepted.json]
# exit 0 PASS, 3 FAIL (regression beyond tolerance or an absolute failure), 2 REFUSED (not
# comparable / missing ink data), 1 a step crashed. Report: <out>/gate/gate-report.{md,json}

# the same comparison over an existing run directory (no re-run), e.g. against another baseline
node fidelity/gate/run.mjs --baseline fidelity/baselines/pin --run fidelity/results/run-all/<id>

# commit the run as the next baseline (refuses a FAIL/REFUSED gate unless --force, recorded)
node fidelity/gate/write-baseline.mjs --run fidelity/results/run-all/<id> --name <step> [--accept accepted.json]
```

What it compares (rules and tolerances with rationale: `ACCEPTANCE.md` section 8):

- **Values, not only statuses.** One parser (`gate/metrics.mjs`) turns every verdict into metrics
  on BOTH sides (the Phase A baselines only carry value strings): REF-W max/p95 (mm), REF-R worst
  anchor (mm), page-count deltas, required-string counts per extractor, EXT-2 missing/extra per
  extractor, DANFE/BOL geometry excess outside the spec window, segments/glyphs, LET-1 (mm),
  LET-2, TXT-B1, and per-word pdf-probe dx/dy (pt). Each metric has a tolerance class.
- **WPT**: per-test outcomes; a lost CLEAN pass gates, a lost FLAGGED pass is reported; a test
  that starts to error gates; comparison is refused unless both sides carry the same Chrome ink
  data (`inkCheck`). `wpt/run.mjs` writes `outcomes.json` on every run for this, and refuses
  `--update-expectations` without ink data.
- **Crashtests** (WPT-3): ok → panic/crash/timeout gates.
- **Absolute**: red code checks, an uncaught detection canary, a layout-diff check failure not
  in `layout-diff/expected-check-failures.json`, an expired allowlist entry, a crashed step.
- **Complete or refused**: `--gate` runs every step (no `--only`/`--skip`/`--no-canaries`, no
  narrowed WPT); a section the baseline measured but the run lacks, or a run without code checks,
  canaries or crashtests, makes the verdict REFUSED (exit 2), never an empty PASS.
- **acceptedRegressions**: `{ "acceptedRegressions": [{ "key": "<metric key from gate-report>",
  "after": <accepted value>, "reason": "...", "evidence": "..." }] }`. Only for regressions PROVEN
  to correct a wrong old value (false pass, oracle artefact) with Chrome + WeasyPrint consensus or
  WPT reference analysis; the writer copies them into the new baseline's `manifest.json`.

Self-tests: `gate/test/` (synthetic regression, synthetic accepted regression, every rule, and a
real canary on committed data: `baselines/beta4` against `baselines/pin` must flag notification
REF-W 3.60 → 8.54 mm, invoice 2.44 → 3.91 mm and 53 WPT clean-pass regressions; and the head of
the port chain, `baselines/port/00-start`, must pass its sha256 integrity check and PASS against
`baselines/beta4-gated`; `baselines/port/01-pagination-gaps` must FAIL against `00-start` on
exactly its 150 `acceptedRegressions` and PASS with them; `02-delete-noop-passes` must PASS against
`01` with none; `03-table-passes`, `04-block-offset` and `05-walk-rewrite` must FAIL against their
predecessor on exactly their 40, 2587 and 18 and PASS with them; the Phase A baselines `pin`/`beta4`,
which predate the layout-diff allowlist, are classified with its frozen copy
`layout-diff/expected-check-failures-phase-a.json`). Reports copied into a baseline (`gate-report.*`, `--attach`) get the same
`<repo>`/`~` path rewrite as the files the writer generates (`gate/test/write-baseline.test.mjs`).

## Canaries

`oracles/run-fixtures.mjs` runs 38 canary rows on every invocation; `summary.json canaryCounts`
splits them: **30 detection canaries** (4 qpdf structural, 2 veraPDF PDF/A rule breakers, 9 text
extractor, 6 copy-paste, 4 ITF, 4 Code 128, 1 layout-consensus), each must be caught, and **8
measurement-only rows** (`caught: null`: the 6 Chrome renders of the copy-paste canaries and the 2
sub-CSS-px ITF renders), which show a behaviour and test no oracle. Phase A manifests said "24
caught / 8 measurement-only" (24 detection canaries then) while `oracles/README.md` said "two rows
are measurements"; both counts now come from `canaryCounts`.

## Reference parity (one Chrome setup)

`lib/chrome-reference.mjs` holds the only font alias table and print path. Before 2026-10-21 the
oracles' and layout-diff's tables lacked Helvetica, so Chromium drew `oss-postmark-receipt`
("Nunito Sans", Helvetica, Arial) with SYSTEM Helvetica (layout-diff input parity failed and the
oracles' Chrome-referenced verdicts carried a caveat), and the corpus printed with the Chrome CLI.
Every family maps to the same Liberation files vellora embeds; the drift tests check that the table
stays a superset of `benchmarks/visual-fidelity.mjs`.

## Rules

- Every number records environment (OS, CPU, Node, Rust, Chrome, tool versions), command and date.
- Claims are labelled CONFIRMED / UNVERIFIED ASSUMPTION / HYPOTHESIS / DESIGN TARGET.
- An oracle is only trusted after it has been shown to catch a deliberately broken input.
- Local macOS runs are indicative; the pinned Linux CI run is authoritative.
- A committed snapshot of the Phase A run is in `combine/snapshots/2026-10-21/` (local macOS,
  INDICATIVE).
