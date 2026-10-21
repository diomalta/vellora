# vellora fidelity oracles

Tooling that makes native-renderer fidelity **measurable and checkable by third parties**
(WPT, Chromium, WeasyPrint, veraPDF, qpdf, barcode decoders, independent text extractors)
instead of by our own eyes. Private, unpublished, and not a root workspace member — like
`benchmarks/`, its browser and Python dependencies never reach a published package.

## Layout and ownership

| Directory | Owns |
|---|---|
| `wpt/` | WPT reftest runner over the vellora pipeline (pinned WPT commit, sparse checkout into `.cache/`). |
| `layout-diff/` | Per-box layout-tree diff: Chromium print-media DOMSnapshot vs raw Blitz vs post-normalize boxes; first-divergence report. |
| `oracles/` | External PDF oracles: veraPDF, qpdf, barcode decode, three text extractors, WeasyPrint second layout oracle. |
| `corpus/` | Real-document corpus (boleto, DANFE, text stress, OSS invoice/receipt under `fixtures/`) and its spec-derived checks. |
| `baselines/` | Committed baseline results (JSON) that the merge ratchet compares against. |
| `ACCEPTANCE.md` | Per-document-class acceptance criteria, each traced to a primary source. |
| `run-all.mjs`, `combine/` | Single entry point over all four areas and the combined summary (integration). |

Generated output goes to `results/` and downloaded inputs to `.cache/`; both are gitignored.

## Run everything

```sh
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"     # Node 22 (.nvmrc)
npm ci && npm run build                                        # real native addon
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity ci             # layout-diff (puppeteer-core)
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity/wpt ci
PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix fidelity/oracles ci
uv venv fidelity/.venv --python 3.12                           # ONE venv shared by oracles + corpus:
uv pip install --python fidelity/.venv/bin/python --require-hashes -r fidelity/oracles/requirements.txt
uv pip install --python fidelity/.venv/bin/python -r fidelity/corpus/requirements.txt
docker build -f fidelity/oracles/docker/tools.Dockerfile -t vellora-fidelity-tools:local fidelity/oracles/docker
docker pull --platform linux/amd64 verapdf/cli:v1.30.3@sha256:d565095c67a083e693aebf7d1a15784007370571053fc1aa5b502665b9a78f9c
node fidelity/wpt/fetch-wpt.mjs                                # WPT at the pin

npm --prefix fidelity test                                     # every area's node --test self-tests
node fidelity/run-all.mjs                                      # or: npm --prefix fidelity run all
```

`run-all.mjs` runs the WPT default suites (ratchet against `baselines/wpt/`), the corpus, the
oracles over the legacy fixtures and over every corpus PDF (plus a PDF/A-2b render of each), and
layout-diff over every measured fixture, then writes `results/run-all/<run-id>/summary.json` and
`summary.md`: environment, exact commands and exit codes, per-fixture per-oracle verdicts keyed by
`ACCEPTANCE.md` criterion IDs, per-WPT-directory pass rates. A missing prerequisite is reported by
the preflight and turns into `not-run` with its reason. Options are in the script header
(`--chrome`, `--wpt-chrome`, `--only`, `--skip`, `--wpt-arg`, `--tools-image`, `--gate`).
Rebuild the tools image whenever `oracles/docker/` changes: the runner records the image ID, and
an older image under the same tag is not detected.

## Rules

- Every number records environment (OS, CPU, Node, Rust, Chrome, tool versions), command and date.
- Claims are labelled CONFIRMED / UNVERIFIED ASSUMPTION / HYPOTHESIS / DESIGN TARGET.
- An oracle is only trusted after it has been shown to catch a deliberately broken input.
- Local macOS runs are indicative; the pinned Linux CI run is authoritative.
