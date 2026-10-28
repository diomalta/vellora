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
| `gate/` | The value ratchet: snapshot loaders, metric parser, tolerances, comparator, report, baseline writer, code-checks step; the head ratchet and debt ledger (`debt.mjs`, `baselines/port/DEBT.json`), the gate's own canaries (`canaries.mjs`), per-item layer vectors (`layer-vector.mjs`, packs in `gate/data/`), ledger candidates (`ledger-candidates.mjs`); self-tests. |
| `baselines/` | Committed baselines the gate compares against (`pin/`: Phase A shape, the published v0.2.0; `port/NN-name/`: the Phase B/C port chain, each step gated against the previous one, convention in `baselines/port/README.md`) and `wpt/<engine>.json` expectations. Only the keep-latest set is committed (`scripts/prune-evidence.mjs`; see "Committed evidence" below). |
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
fixture, and the probe fixture suite (`pdf-probe-suite`: `layout-diff/probes/`, small pagination /
@page / RTL documents the corpus never exercises, as pdf-probe v2 fixtures `probe-<id>`; since
2026-10-22); then writes `results/run-all/<run-id>/summary.json` and `summary.md`: environment, exact
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

# both commands ALSO gate against the chain head (--head, default port/00-start, named in
# baselines/port/README.md) with the debt ledger (--debt, default baselines/port/DEBT.json;
# rule iii checks its transition from the base: --debt-base, else DEBT.json at `git merge-base HEAD
# main`, else the frozen ledger the committed pointer baselines/port/DEBT-BASE.json names), run the
# gate's own canaries and report the pin view (--pin, default baselines/pin). A merge to main adds
# --main. An explicit base, e.g. main's ledger (absent there: the pointer's frozen ledger applies):
git show main:fidelity/baselines/port/DEBT.json > /tmp/debt-base.json
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/<previous> --run <run> \
  --step <NN-name> --debt-base /tmp/debt-base.json [--accept accepted.json]
node fidelity/gate/debt.mjs check --base /tmp/debt-base.json --step <NN-name>   # ledger only

# evidence for a DEBT.json entry: per-item layer vectors of the head-gating items of a report
node fidelity/gate/layer-vector.mjs --run <run-all dir> --keys-from <gate-report.json> --out v.json
node fidelity/gate/ledger-candidates.mjs --report <gate-report.json> --layout-from <run-all dir> \
  --head-wpt <head run wpt/results.json> --pin-wpt <pin run wpt/results.json> --out <dir>

# commit the run as the next baseline (refuses a FAIL/REFUSED gate unless --force, recorded)
node fidelity/gate/write-baseline.mjs --run fidelity/results/run-all/<id> --name <step> [--accept accepted.json]
```

What it compares (rules and tolerances with rationale: `ACCEPTANCE.md` section 8):

- **Values, not only statuses.** One parser (`gate/metrics.mjs`) turns every verdict into metrics
  on BOTH sides (the Phase A baselines only carry value strings): REF-W max/p95 (mm), REF-R worst
  anchor (mm), page-count deltas, required-string counts per extractor, EXT-2 missing/extra per
  extractor, DANFE/BOL geometry excess outside the spec window, segments/glyphs, LET-1 (mm),
  LET-2, TXT-B1, and per-word pdf-probe dx/dy (pt; semantics 2: baselines, position pairs keyed
  by the Chrome word, unpaired words counted; a section of another semantics is REFUSED). Each
  metric has a tolerance class.
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
  "after": <accepted value>, "class": "a", "reason": "...", "evidence": "..." }],
  "declaredRejections": [{ "feature": "css:…", "reason": "...", "evidence": "...", "tests"?: […] }] }`.
  Acceptances only for regressions PROVEN to correct a wrong old value (class a: false pass, oracle
  artefact; GATE-A1); compensating drift (class b) goes into `baselines/port/DEBT.json` with a
  layer vector, never here. Declarations for new strict-gate rejections (GATE-A2). The writer
  copies both lists into the new baseline's `manifest.json`.
- **Head ratchet** (GATE-H1, D4): an item worse than the chain head beyond tolerance gates unless a
  class-a acceptance or declaration of the step, or a `DEBT.json` entry within its ceiling (rules
  i–vi, GATE-D*), covers it. Within-tolerance worsening against the previous link is listed and
  counted, never "unchanged"; lost flagged WPT passes are counted in the headline (D6).
- **Pin view** (GATE-H3): every item worse than the shipped main classed (a)/(b)/(c); `--main`
  makes (c) gate.

Self-tests: `gate/test/` (synthetic regression, synthetic accepted regression, every rule, and a
real canary on committed data: the chain head `baselines/port/00-start` (the beta.4 bump) against
`baselines/pin` must flag notification REF-W 3.60 → 8.54 mm, invoice 2.44 → 3.91 mm and 53 WPT
clean-pass regressions; every kept baseline must pass its sha256 integrity check; the latest link
`port/12-phase-c-final` must PASS against `port/11-phase-c` (8 improvements, nothing gating even
without its 13 carried class-a acceptances), with the link-to-link counts of its `manifest.json`
(`committed-canary.test.mjs`), and, evaluated in process with the committed `DEBT.json`, its
`DEBT-BASE.json` base and `--main`, give the c07 contract re-gate's head (gating 0, debt 1,
accepted 5, declared 10) and pin ((a) 5, (b) 1, (c) 0) counts (`head-chain.test.mjs`); the Phase
A baseline `pin`, which predates the layout-diff allowlist, is classified with its frozen copy
`layout-diff/expected-check-failures-phase-a.json`). Reports copied into a baseline (`gate-report.*`, `--attach`) get the same
`<repo>`/`~` path rewrite as the files the writer generates (`gate/test/write-baseline.test.mjs`).
Every DEBT rule, the relaxed (b) rule and the pin view have a planted self-test (`debt.test.mjs`);
layer vectors are checked on committed packs (`layer-vector.test.mjs`); the keep-latest prune rule
on a planted tree (`prune-evidence.test.mjs`). Until 2026-10-28 the committed-data tests also
replayed every link 01 … 10 against its predecessor (and beta4, beta4-gated) and the
head / pin counts of 07 and 09; those checks were deleted with the links (archive below).

## Committed evidence

Only the evidence the gate reads going forward and the evidence the published claims cite is
committed. `node fidelity/scripts/prune-evidence.mjs --keep-latest` (dry run; `--apply` deletes)
keeps `baselines/pin/`, the `baselines/port/` files (`README.md`, `DEBT.json`, `DEBT-BASE.json`,
`declared-rejections.json`), the chain head, the latest link and the link it was gated against
(its `manifest.json gate.baseline`), the latest engine's `baselines/wpt/<engine>.json`, the gate
snapshot directory holding the ledger `DEBT-BASE.json` names, and every snapshot path
`docs/assets/fidelity/manifest.json` or a published docs page (`docs/**/*.md`) cites; it deletes every other baseline, link and gate
snapshot and all of `layout-diff/snapshots/`, `combine/snapshots/`, `oracles/reports/` and
`upstream-drafts/`. Run it after a new link and its snapshot are committed.

The 2026-10-28 prune removed the intermediate links `port/01` … `port/09`, `beta4/`,
`beta4-gated/`, `baselines/wpt/blitz-2003ba5fc2d8.json` (byte-identical to the kept
`baselines/pin/wpt/expectations-blitz-2003ba5fc2d8.json`), the dated snapshots of 2026-10-21,
2026-10-22, 2026-10-27 and the 2026-10-28 steps before c06, and the four roots above. Paths to
them in READMEs, source comments, `DEBT.json` evidence strings and acceptance evidence are not in
this tree: everything is at the git tag **`fidelity-archive-2026-10-28`**, commit
**`b5c95460eebedcc86a6dce3c0e262a940b0a8c27`** (`git show fidelity-archive-2026-10-28:<path>`,
or `git archive fidelity-archive-2026-10-28 fidelity | tar -x -C <dir>`).

The Phase C 07 prune (after `port/12-phase-c-final` and the c07 snapshot were committed) removed
`port/10-integration` and the snapshots `2026-10-28/c06/`, `c06-docs/` and `c07-pin-b/`. They are
at the git tag **`fidelity-archive-2026-10-28-c07`**, commit
**`99b05156e0ea7c69d7ec9b8f80bd9f2797170c9a`**.

## Canaries

`oracles/run-fixtures.mjs` runs 42 canary rows on every invocation; `summary.json canaryCounts`
splits them: **34 detection canaries** (4 qpdf structural, 2 veraPDF PDF/A rule breakers, 9 text
extractor, 6 copy-paste, 4 ITF, 4 Code 128, 1 layout-consensus, 4 pdf-probe v2: +6 pt shift, one
word deleted, one glyph run moved 2 pt, /Ascent rewritten that must NOT be flagged; since
2026-10-21, 30/38 before; a 5th pdf-probe canary since 2026-10-22, one glyph run moved below the
MediaBox, so 35 detection canaries in 43 rows), each must be caught, and **8
measurement-only rows** (`caught: null`: the 6 Chrome renders of the copy-paste canaries and the 2
sub-CSS-px ITF renders), which show a behaviour and test no oracle. Phase A manifests said "24
caught / 8 measurement-only" (24 detection canaries then) while `oracles/README.md` said "two rows
are measurements"; both counts now come from `canaryCounts`.

The gate's own rules have **32 more detection canaries** (2026-10-27; `gate/canaries.mjs`, GATE-K2), run on
every gate evaluation and planted into the snapshots being gated: sub-tolerance creep only the head
ratchet sees, WPT fail → unsupported, a verdict row → `strict gate rejected` and → NOT-RUN, a lost
flagged pass (counted, not gating), DEBT rules i/ii, iii, iv, v, vi, the relaxed (b) rule, a
misaligned layer-vector mapping and a planted pass step. They are listed in the gate report; an
uncaught one is an absolute failure. `gate/test/canaries.test.mjs` breaks each rule on purpose and
asserts that its canary is then uncaught.

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
- A snapshot of the Phase A run (`combine/snapshots/2026-10-21/`, local macOS, INDICATIVE) is at
  the archive tag `fidelity-archive-2026-10-28` (b5c9546), not in this tree.
