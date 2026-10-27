# Phase B port chain: `fidelity/baselines/port/`

Every Phase B port step is measured by the fidelity gate (`fidelity/gate/`, rules and tolerances
in `fidelity/ACCEPTANCE.md` section 8) against the step before it. Local macOS runs with local
Chrome are **INDICATIVE**; the pinned Linux Chrome-for-Testing run is a DESIGN TARGET (not wired).

## Chain convention

- A port step `NN-name` (two-digit ordinal + kebab-case name, e.g. `01-text-block-offset`) writes
  `fidelity/baselines/port/NN-name/` and is gated against the step directly before it. The head of
  the chain, `00-start`, is gated against `fidelity/baselines/beta4-gated`. Full chain:
  `pin` (Phase A, Blitz pin `2003ba5`) → `beta4` (Phase A, mechanical bump to 0.3.0-beta.4) →
  `beta4-gated` (hardened-gate re-baseline) → `port/00-start` → `port/01-…` → …
- **Chain head** (the `--head` default of `fidelity/gate/run.mjs` and `fidelity/run-all.mjs
  --gate`, read from this line by `gate/debt.mjs chainHead`): `port/00-start`. Every run is
  gated against the previous link AND against this head (GATE-H1): an item worse than the head
  beyond its tolerance passes only as a class-`a` acceptance of the current step or a
  `DEBT.json` entry within its ceiling ("Head ratchet and debt ledger" below).
- One step, one gated run, one baseline:

  ```sh
  export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
  # The ledger base (rule iii) defaults to DEBT.json at `git merge-base HEAD main` since
  # 2026-10-22 (I2; absent there = first population, exempt from the count and sum rule); pass
  # --debt-base <file> only where that merge base cannot be determined (e.g. a clone without main).
  # Chrome is PINNED (since 2026-10-27): local stable Chrome auto-updated to 156.0.8078.4, which
  # would mix a Chrome major change into the gate. Install Chrome for Testing 155.0.8059.85 per
  # checkout (fidelity/.cache/chrome, gitignored) and pass it with --chrome (the path below is
  # the one the 10-repro run recorded, repro-10/repro-10-summary.json):
  node fidelity/wpt/install-chrome.mjs
  node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/<previous step> \
    --step <NN-name> \
    --chrome "fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" \
    --chrome-from ~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5/wpt/results.json \
    --tools-image vellora-fidelity-tools:baseline-beta4 \
    --out fidelity/results/run-all/<NN-name> [--accept accepted.json]
  # Defaults: --head = the Chain head above (port/00-start), --debt = baselines/port/DEBT.json,
  # --pin = baselines/pin (pin view, reported). A merge to main adds --main ((c) items gate).
  # exit 0 = PASS (previous link AND head). The same evaluation over an existing run, no re-run:
  #   node fidelity/gate/run.mjs --baseline fidelity/baselines/port/<previous step> \
  #     --run fidelity/results/run-all/<NN-name> --step <NN-name> [--accept accepted.json]
  # Then commit the run as the next link (--name takes no "/", so --root carries port/):
  node fidelity/gate/write-baseline.mjs --run fidelity/results/run-all/<NN-name> \
    --root fidelity/baselines/port --name <NN-name> [--accept accepted.json] \
    [--attach <report>=<name>]...
  ```

  `--step` names the step the run measures (an entry may close at its `closesAt` step, rule iii;
  the head comparison merges the declarations of the links up to it, I4). Rule iii runs on every
  gated run (I2, 2026-10-22): the base is `--debt-base` or DEBT.json at `git merge-base HEAD main`,
  and a base that cannot be determined REFUSES the gate. A NEW ledger key must satisfy the relaxed
  (b) rule and GATE-D7 (tied to the run's head item, I3).
- **Merge rule.** The step merges only when its gate is PASS against the previous link AND the
  chain head. A chain step is never written with `--force`: `manifest.json
  gate.writtenDespiteVerdict` must be `false` and `gate.baseline` must name the previous step. A
  value worse beyond its tolerance (against the previous link or the head) passes only as one of:
  - an `acceptedRegressions` entry of the step with `class: "a"` (`--accept`: key, `after`, class,
    reason, evidence) that PROVES the OLD value was wrong: a WPT false pass, or an oracle artefact
    shown on the same PDFs by an independent measurement (GATE-A1 (a));
  - a `DEBT.json` entry (class b, compensating drift with a committed layer vector, within its
    ceiling; GATE-A1 (b), GATE-D1…D7), never an acceptance (`readAcceptances` refuses any class
    other than `a`);
  - a `declaredRejections` entry for a new strict-gate rejection: WPT tests moving to
    `unsupported`, verdict rows becoming `strict gate rejected: <feature>`, measured rows becoming
    NOT-RUN (GATE-A2).

  An OLD value that was correct (for example lost text) blocks the merge. The writer copies
  `acceptedRegressions` and `declaredRejections` into `manifest.json`, and the step's commit
  message lists them. Entries without `class`, from steps 01–06, still reproduce the
  link-to-link verdicts they were written for. They do not cover anything against the head.
  The run's code-checks step must be green (GATE-C1: `cargo test --workspace`,
  `npm run test:ts`, `npm run lint`, `npm --prefix fidelity test`).
- **Older baselines.** Comparisons of the same run against older links (`beta4`, `pin`, …) are
  post-hoc: `node fidelity/gate/run.mjs --baseline fidelity/baselines/<old> --run <run dir> --out
  <run dir>/gate-vs-<old>`, then `--attach` the reports (`attachments/gate-report-vs-<old>.*`).
- **PDF bytes** may change when a step changes layout on purpose; they are not ratcheted. DET-1
  (two renders of one input are byte-identical) is a verdict row and must keep passing.
- **Chrome WPT data.** Chrome's WPT outcomes and ink signatures do not depend on vellora:
  `--chrome-from` reuses an earlier `results.json` when the WPT commit, `HARNESS_SEMANTICS` and the
  comparison settings are identical (`chromeReuseMismatch` in `fidelity/wpt/lib/provenance.mjs`,
  checked by `wpt/run.mjs`, which refuses a mismatch). If the harness or the WPT pin changes, run
  Chrome live once (`--wpt-chrome`) and keep that run's `wpt/results.json` as the new reuse source.
- **Run copies.** `fidelity/results/` is gitignored: copy each step's run directory to
  `~/Repositories/vellora-fidelity-runs/run-all-<NN-name>-<runId>[-<engine>-vellora-<sha>]` so
  later steps can re-gate or reuse it (since 2026-10-27; never `~/.cache`). Loss event (CONFIRMED
  2026-10-27): `~/.cache/vellora-fidelity` and every run copy in it disappeared between 2026-10-23
  and 2026-10-27, so the `~/.cache/...` paths cited by the sections below no longer exist; the only
  surviving run copy is `run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5`. Its
  `wpt/results.json` (Chrome outcomes for 8046 of 8047 tests, raw-Blitz outcomes for all 8047) is
  the `--chrome-from` source from then on, with `--tools-image vellora-fidelity-tools:baseline-beta4`
  (the image was rebuilt from `fidelity/oracles/docker/tools.Dockerfile`, new id
  `sha256:c405e06c653a...`; equivalence with the lost image `sha256:6b648b83...` is CONFIRMED on
  this corpus by the reproducibility run `20261027T130144Z`,
  `fidelity/gate/snapshots/2026-10-27/repro-10/README.md`: 71/71 product PDFs and 10/10 WeasyPrint
  PDFs byte-identical, oracle verdicts, WPT outcomes 8047/8047 and gate counts identical). The
  veraPDF image `verapdf/cli:v1.30.3` was also lost and was re-pulled by digest (same id
  `sha256:45b2f7cd...`).
- **Committed-data check.** `fidelity/gate/test/committed-canary.test.mjs` re-checks `00-start`
  (integrity, PASS vs `beta4-gated`, no `--force`); a new link should add the same assertion
  against its predecessor. `fidelity/gate/test/head-chain.test.mjs` re-checks the head ratchet
  and the pin view on the committed links with the ledger they were gated with (empty; DEBT.json
  was first populated on 2026-10-27, `fidelity/gate/snapshots/2026-10-27/10-debt/`), and `07` against `06` with `--head port/00-start` gives the counts in "Head ratchet
  and debt ledger" below. A new link should add its own head and pin counts there.
- **pdf-probe semantics.** Since 2026-10-21 every link's gated pdf-probe section
  (`pdf-probe/<fixture>.json`) is semantics 2 ("pdf-probe v2 re-score" below); the gate refuses
  to compare it with a semantics-1 section, so a new link is gated with v2 only. The v1 sections
  the links 00-start to 07 were gated with are kept under `attachments/pdf-probe-v1/` and their
  `acceptedRegressions` (v1 keys) are history; the committed-canary test reproduces those
  verdicts on the v1 sections.
  The pair keys name Chrome words, so the gate REFUSES a pdf-probe comparison whose Chrome
  reference words differ (`reference.chromeWordsSha256`): a deliberate change of a fixture's
  template (or of Chrome) needs the previous link re-measured with it before the next link is gated.

## `00-start`: beta.4 + whitespace test fix + reader fix + hardened oracles

Branch `phaseb/stage1` at `5099808` = `feat/blitz-beta4-port` (`dd2c22f`) merged `--no-ff` with
`phaseb/gate` (`d0d7bb7`, hardened gate) and `phaseb/text-hook` (`4804026`, slim layout-dump hook,
Chrome-verified rewrite of the stale whitespace test, padded-inline-root `read_text_runs` fix).
The run measured that tree with 0 dirty entries.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T074902Z` (2026-10-21 07:49:02Z to 07:58:05Z), 20/20 steps ok, run-all exit 0 |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/beta4-gated --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/s1c-00-start` |
| OS / CPU | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| Chrome | Google Chrome 155.0.8059.85 (local) |
| Blitz | blitz-dom 0.3.0-beta.4 (crates.io) |
| tools image | `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…` (same image as `pin`, `beta4`, `beta4-gated`) |
| WPT | `9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba` exact pin, 8047 reftests + 239 crashtests |
| run copy | `~/.cache/vellora-fidelity/run-all-s1c-00-start-20261021T074902Z` |

**Chrome reuse check (CONFIRMED before the run).** The `--chrome-from` file (Phase A beta.4 run
`20261021T054809Z-blitz-0.3.0-beta.4-vellora-dc535e7`) has WPT commit `9d8aceec…` (= the pin),
harness semantics 2 (= current `HARNESS_SEMANTICS`) and comparison settings
`{"semantics":2,"chainReferences":false,"inlineCss":true,"raster":{"tool":"pdftocairo","dpi":96,"antialias":true}}`,
identical to the hardened harness's (`chromeReuseMismatch` → `null` against the hardened run
`20261021T072135Z`); it covers the same 8047 tests, 8046 with a Chrome outcome, 8044 with Chrome
ink signatures, Chrome/155.0.8059.85. No reftest in it hit the `EISDIR` case the hardened
`prepare.mjs` now handles.

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `beta4-gated` (previous link, in-run gate: `gate-report.{json,md}`) | **PASS** | improvement 13, gating 0, unchanged 15466 |
| `beta4` (Phase A; `attachments/gate-report-vs-beta4.*`) | **PASS** | newly-measured 1, added 13, improvement 13, not-comparable 6, gating 0, unchanged 10839 |
| `pin` (Phase A; `attachments/gate-report-vs-pin.*`) | FAIL (expected: the known beta.4 losses) | 89 gating = 53 WPT clean-pass regressions + 36 value/status regressions; improvement 353, reported 102, changed 9, newly-measured 1, added 13, not-comparable 10 |

- **vs `beta4-gated`**: the only changes are 13 WPT `css/css-text` tests fail → pass (pass 421 →
  434, clean 178 → 182): 4 clean (`word-break/word-break-break-all-inline-00{2,3,5,6}`) and 9
  flagged (`shaping/shaping-00{0,4,5,6,7}`, `shaping-01{2,3}`, `shaping_lig-000`: webfont not
  supplied + ink displaced vs Chrome; `text-encoding/shaping-tatweel-002`: webfont not supplied).
  The 9 flagged ones were passes at the pin and lost at beta.4; the 4 clean ones failed at both
  the pin and beta.4. The code checks went red → green: `beta4-gated` recorded `cargo test` red
  (`mixed_weight_inline_siblings_advance_by_the_first_run_width`), this run has all 4 green (code
  checks are absolute, so the gate lists only failures, not this recovery).
- **vs `beta4`**: the previous single gating item (`code|cargo-test`) is gone; the rest is
  `beta4-gated`'s own report (DANFE-B1 oracles:barcode newly measured → FAIL, 13 LET/TXT-B1/canary
  rows added, 6 not comparable) plus the 13 WPT improvements.
- **vs `pin`**: item for item identical to `beta4-gated/attachments/gate-report-vs-pin.json`
  except `code|cargo-test` (gone) and the 13 WPT tests (9 `reported` flagged-pass losses gone, 4
  improvements added). The 36 non-WPT regressions are unchanged, among them notification REF-W
  max/p95 3.60/3.48 → 8.54/8.42 mm, invoice 2.44/1.78 → 3.91/3.78 mm, BOL-X1 13 → 11, DANFE-X1
  24 → 22, DANFE-F4c segments 3 → 2, DANFE-F11 glyphs 3511 → 3472, DANFE-M1 bottom excess 8.55 →
  24.72 mm. These are what the port steps must win back.

### Text rows and the whitespace fix

No text row changed: every non-WPT metric (15466 unchanged items vs `beta4-gated`) has the same
value, the verdict totals are identical (all: PASS 128 / FAIL 55 / WARN 4 / NOT-RUN 3; excluding
diagnostic variants: 109 / 47 / 4 / 3), and all 29 `vellora.pdf` files of the run (6 corpus, 6
corpus PDF/A-2b, 8 legacy-fixture plain + PDF/A-2b, 9 layout-diff renders) are byte-identical to
the same files of the `beta4-gated` run (`attachments/pdf-identity-vs-beta4-gated.json`, sha256 per
path; CONFIRMED). The whitespace change of `phaseb/text-hook` was a test correction (Chrome 155
keeps the space in "LTDA — CNPJ", and so does Blitz 0.3.0-beta.4; the pin dropped it), not a
render change; BOL-X1 13 → 11 and DANFE-X1/F4c/F11 stay at their beta.4 values because they are
not whitespace losses (`phaseb/text-hook` evidence: off-page right-aligned values clipped by
pdftotext after `fixed_table_widths`, and an emitter cell narrowed by `fixed_table_widths`).

### Other values recorded (CONFIRMED, this run)

- WPT at the pin: pass 2742 / 8047 (34.07 %), clean 2217 (27.55 %), pass-blank 37, fail 4400,
  unsupported 867, skip 1, error 0, timeout 0; ink check 209 ink-missing + 98 ink-displaced of
  2742 passes (reused Chrome data). Crashtests: 239/239 ok.
- Canaries: 38 rows, 30 detection canaries all caught, 8 measurement-only.
- REF-W max/p95 (mm): invoice 3.91/3.78, notification 8.54/8.42, boleto 4.64/2.48, receipt
  101.15/4.06, danfe 45.69/33.25, text-stress-ptbr 101.6/97.36, boleto-febraban 120.78/83.01.
- layout-diff: the only check failures are the 5 allowlisted ones (receipt ×3: html_normalize
  wraps a `<div>` inside `<p>`; oss-postmark-receipt ×2: XHTML doctype parsed as XML), each with
  its expiry condition in `fidelity/layout-diff/expected-check-failures.json`.
- `acceptedRegressions: []`.

## `01-pagination-gaps`: flow gaps, CSS Fragmentation page starts, anonymous-block walk offset

Branch `phaseb/01-pagination-gaps` (from `phaseb/stage1` `659db88`), code commit `8290b06`:
`crates/vellora-core/src/pagination.rs` places every fragment of a page at its Blitz flow position
(one flow→page translation per page) instead of re-stacking fragments with the previous one's Blitz
`margin_bottom`; page starts follow css-break-3 §5.2 (page 1 keeps the leading offset, unforced
break → page top, forced break → the fragment's leading margin kept); repeated `<thead>` bands
include the border-spacing down to the first row; rows of a `border-collapse: collapse` table abut
(CSS 2.2 §17.6.2; Blitz leaves 1 px); a fragment out of flow order (a `<tfoot>` written first)
follows the previous one; an overflow of ≤ 12 px (capped by the bottom page margin) of the box
containing a fragment does not count in the fit tests (DESIGN TARGET, absorbs Blitz's taller
layout); the `dropped-to-fit` rule is gone. `blitz_engine.rs` adds the offset of the Blitz
anonymous block between a DOM parent and an in-flow child. New Chrome-verified tests:
`crates/vellora-core/tests/pagination_gaps.rs` (13; Chrome numbers in
`attachments/chrome-probes-pagination-gaps.txt`, HTML in `chrome-probes-pagination-gaps-html.json`).

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T093020Z` (2026-10-21 09:30:20Z), 20/20 steps ok, run-all exit 3 (gate FAIL before acceptances), git `8290b06` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/00-start --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/01-pagination-gaps`, then `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/00-start --run fidelity/results/run-all/01-pagination-gaps --accept fidelity/results/run-all/01-pagination-gaps/accepted.json --out fidelity/results/run-all/01-pagination-gaps/gate` |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-01-pagination-gaps-20261021T093020Z` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/00-start` (previous link; `gate-report.{json,md}`) | **PASS** with 150 `acceptedRegressions` | improvement 1438, accepted 150, reported 3, changed 1, gating 0, unchanged 13887 |
| `port/00-start` without acceptances (`attachments/gate-report-without-acceptances.*`) | FAIL | the same 150 items gating |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 110 gating (the accepted families; beta4 has no corpus pdf-probe) |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 100 gating, improvement 712 |

Values that moved (before → after, CONFIRMED, gate report):

| oracle | before → after |
|---|---|
| notification LET-1 worstMm (the step's target) | 8.54 → **0.75** (FAIL → PASS; pin 3.60) |
| notification REF-W max / p95 mm | 8.54 / 8.42 → **1.63 / 1.07** (better than the pin's 3.60 / 3.48) |
| text-stress-ptbr TXT-R1 worstMm | 11.86 → **0.94** (FAIL → PASS) |
| receipt REF-W p95 mm | 4.06 → 2.03 (max 101.15 unchanged) |
| boleto-febraban REF-W max / p95 mm | 120.78 / 83.01 → 86.19 / 36.73 (the ficha now sits where the 175 mm recibo ends) |
| DANFE-L1a…d posErrMm | 1.56 / 3.15 / 4.71 / 5.96 → 1.03 / 2.62 / 4.18 / 5.43 (L1b FAIL → PASS) |
| pdf-probe words improved | boleto-febraban 188, danfe 431, notification 120, receipt 111, text-stress-ptbr 165, oss-sparksuite 28 |
| WPT pass / clean (8047 reftests) | 2742 / 2217 (34.07 % / 27.55 %) → **3073 / 2503 (38.19 % / 31.10 %)**: +303 clean, +62 flagged, −31 clean (accepted), −3 flagged (reported); css/CSS2/pagination 19/17 → 33/31, css-break 101/73 → 104/75, css-page 63/47 → 64/49, margin-padding-clear 409/396 → 511/496, positioning 175/173 → 298/272, borders 332/302 → 377/348 |
| unchanged | every REF-P/page count (invoice 3, receipt 2, boleto 1, notification 1, boleto-febraban 1, danfe 2 vs 1, text-stress 8 vs 7, sparksuite 1, postmark 1 vs 2), TXT-B1, LET-2, BOL-*, invoice/boleto REF-W, crashtests 239/239 ok, canaries 30/30 caught, DET-1/DET-2 PASS, layout-diff checks (only the 5 allowlisted failures) |

Verdict totals: all PASS 128 → 131, FAIL 55 → 52 (WARN 4, NOT-RUN 3); excluding diagnostic variants
109 → 112, 47 → 44. PDF bytes change on purpose (layout moves); DET-1/DET-2 keep passing.

### `acceptedRegressions` (150; reasons and evidence verbatim in `manifest.json`, data in `attachments/accepted-evidence.json`)

- **30 WPT clean passes, `wpt-false-pass-rect-merge`** (`css/CSS2/linebox/line-height-0{06,07,17,18,28,29,39,40,50,51,58,61,62,83,84}`, `-105/106/112`; `css/CSS2/normal-flow/{,max-,min-}height-0{61,62,72,73}`): false passes. The old paginator stacked the two side-by-side stripes of the test AND the two inline `<img>`s of the reference (a flattened wrapper) one under the other, so both rendered the same wrong picture (maxDifference 0; ink bbox bottom 225–321 px vs Chrome's 145–337 px, or half of Chrome's ink). Now the test matches Chrome's geometry; the only differing pixels are one solid 2–4 px × stripe-height rectangle (192 = 2×96, 1152 = 4×288, …) — the real gap between the stripes that `merge_adjacent_rects` (`RECT_MERGE_TOLERANCE_PX` 4) fills in the test's two background rects, while the reference's stripes are images. Two flagged tests of the family (`line-height-072/073`) are reported, not gated.
- **1 WPT clean pass, `wpt-two-errors-cancelling`** (`css/CSS2/floats/zero-width-floats.html`): raw Blitz places the BFC box beside zero-width floats 200 px too low (y 250; Chrome 42) and the old paginator ignored both that position and the second box's `top: -100px`, which happened to draw the square. Not a false pass of the same kind: judge it as two cancelling errors (follow-up: Blitz float/BFC placement).
- **117 pdf-probe words, `pdf-probe-compensating-drift`** (notification 77, oss-sparksuite-invoice 18, danfe 22): each word was near Chrome only because the old paginator's drift cancelled a pre-pagination error. layout-diff proves it per layer: the new layer P adds 0 px on page 1 (P == final layer for every run and box), the old P moved the notification's tail by −6.67 px (signature −28.2 px), dropped sparksuite's 8 px UA body margin (Chrome and WeasyPrint keep it: title baseline 93.75 / 95.43 pt vs old 86.02 pt) and pushed the DANFE below table 3 down 2 px (Chrome's table 4 at y 232.73, now 233.0, old 235.0; old P regressed 345 boxes). The residuals are raw-Blitz heights (notification deadline table +6.5 px at N0, sparksuite rows +8…+18 px, DANFE cell text). danfe `0,00#k` dx/dy items are a pdf-probe occurrence-pairing artefact (pdftotext reorders identical tokens; by position each is 1.5 pt closer to Chrome).
- **2 values, `value-compensating-drift`**: DANFE-M1 excessB 24.724 → 25.232 mm (page 1's bottom margin grows by the removed 2 px; the excess is the shared 2-page split), INV-R1 (sparksuite) 2.74 → 3.09 mm (worst anchor moves from the title, fixed by +2.12 mm, to "Total: $385.00", which the old −8 px had hidden).
- Reported, not gating: `css/css-page/page-name-orthogonal-writing-002-print.html` (flagged pass → fail: the test renders 1 page, the reference now 2; the old paginator's `dropped-to-fit` rule kept the reference's second block on page 1 by dropping a 95 904 px flow gap; the test needs named-page breaks vellora does not implement) and `css/css-break/overflowed-abs-pos-with-percentage-height-print.html` (pass-blank → fail: test 2 pages vs reference 1 since `dropped-to-fit` is gone; Chrome's own outcome is pass-blank).

The `committed-canary` self-test now also asserts that `01-pagination-gaps` FAILs against `00-start`
without acceptances (exactly the 150 accepted keys gate) and PASSes with them.

## `02-delete-noop-passes`: remove three layout_normalize passes Blitz beta.4 made wrong

Branch `phaseb/02-delete-noop-passes` (from `phaseb/01-pagination-gaps` `8bc8adf`), code commit
`6e5cb8d`: `normalize_vertical_margin_collapse`, `normalize_collapsed_table_medium_border_insets`
and `normalize_collapsed_table_medium_border_insets_x` (and their helpers) are deleted from
`layout_normalize.rs` and `LAYOUT_NORMALIZE_PASSES`. The render path and the layout dump now run 4
passes (`painted_table_cell_text_baselines`, `fixed_table_widths`, `table_percent_widths`,
`auto_table_compact_columns`). New Chrome-verified tests in `crates/vellora-core/tests/layout_fidelity.rs`:
`adjacent_block_margins_collapse_without_whitespace_between_siblings` and
`collapsed_table_keeps_half_its_outer_border_around_the_cells`. Both fail with the old passes
(gap 10 instead of 40; insets 0 instead of 4). The kept browser-behaviour tests are still green
with and without the passes.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T102146Z` (2026-10-21 10:21:46Z), 20/20 steps ok, run-all exit 0 (gate PASS), git `6e5cb8d` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/01-pagination-gaps --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/02-delete-noop-passes` |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-02-delete-noop-passes-20261021T102146Z`; scratch evidence data (captured WPT inputs, dumps, both `layout_dump` binaries): `~/.cache/vellora-fidelity/step02-delete-noop-passes-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/01-pagination-gaps` (previous link; `gate-report.{json,md}`) | **PASS**, `acceptedRegressions: []` | improvement 3, gating 0, unchanged 15476 |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 110 gating, the same keys as `01-pagination-gaps`' post-hoc report; improvement 637 → 640 |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 100 gating, the same keys as `01`'s; improvement 712 → 715 |

- **WPT**: pass 3073 → 3076, clean 2503 → 2506 (38.19 % / 31.10 % → 38.23 % / 31.14 %). Three tests
  go fail → clean pass: `css/CSS2/box-display/multiple-block-in-inlines-margins-collapse.html`,
  `css/CSS2/margin-padding-clear/margin-collapse-101.xht`, `-105.xht`. No pass is lost.
- **Everything else is unchanged.** All 29 `vellora*.pdf` files of the run are byte-identical to
  the step-01 run's (`attachments/pdf-identity-vs-01-pagination-gaps.json`). For every layout-diff
  fixture, the final pre-pagination layer, every common layer, the Blitz tree and the pagination
  trace equal step 01's (`attachments/layout-dump-identity-vs-01-pagination-gaps.json`). Verdict
  totals are 131 / 52 / 4 / 3 (excluding diagnostic variants: 112 / 44 / 4 / 3). Canaries 30/30
  caught, crashtests 239/239 ok, code checks green, layout-diff check failures limited to the 5
  allowlisted ones.

### Re-verification before deleting (CONFIRMED, 2026-10-21, same env)

- **Corpus** (`attachments/corpus-layer-identity.json`): on the full dumps of the 9 layout-diff
  fixtures of the step-01 run, each of the three passes changes 0 boxes and 0 runs. This covers
  every box, not only the ones matched to Chrome.
- **WPT** (`attachments/wpt-removed-passes.json`): the passes are *not* no-ops on WPT. A recording
  bridge (scratch shim for `wpt/run.mjs --vellora`) captured the 10 592 distinct render inputs.
  Dumped with the step-01 `layout_dump`, `vertical_margin_collapse` fires on 136 inputs and the two
  inset passes on 16 each; 865 inputs are unsupported and cannot be dumped. Deleting the passes
  changes the PDF of exactly those 152 inputs and of no other one.
- **Are those firings right? Measured against Chrome** on the same prepared HTML (layout-diff's
  Chrome snapshot, bundled fonts):
  - `vertical_margin_collapse` subtracts min(margin-bottom, margin-top) from a gap Blitz has already
    collapsed. It fires only when two collapsible-tag siblings have no whitespace text between them.
    It touches 201 sibling pairs:
    - 153: Blitz's gap equalled Chrome's (±0.5 px) and the pass broke it
    - 20: the pass moved the gap further from Chrome's
    - 6: closer to Chrome's without reaching it (display: table-* divs with negative gaps)
    - 22: no Chrome box to compare (html_normalize wrappers)
    - 0: the pass produced Chrome's gap
  - The inset passes set 95 cell-to-table edge insets of 2..4.5 px to 0. Chrome's inset at those
    edges is never 0: it is 1 to 110 px. For a real collapsed border it is half the outer border
    (CSS 2.2 §17.6.2).
  - layout-diff's absolute per-layer stats on the same 152 inputs:
    - inset (y) pass: boxes 3 improved / 23 worsened
    - inset (x) pass: boxes 4 / 16
    - margin pass: boxes 153 / 83, runs 392 / 278

    The margin pass's apparent improvements are compensating drift: where the pass wrongly lifts a
    block that an earlier Blitz error placed too low, the block ends up closer to Chrome.
- Chrome probe numbers for the tests: `attachments/chrome-probes-noop-passes.json`. The scratch
  drivers are kept as text (`attachments/scratch-*.mjs.txt`; not part of the repo).

The `committed-canary` self-test asserts that `02-delete-noop-passes` PASSes against
`01-pagination-gaps` with no acceptances and that its only non-unchanged items are the 3 WPT
improvements.

## `03-table-passes`: alignment-aware table text, `fixed_table_widths` deleted

Branch `phaseb/03-table-passes` (from `phaseb/02-delete-noop-passes` `abc80c1`), code commit
`5ce90be`. In `layout_normalize.rs`:

- `adjust_subtree_inline_geometry` moves a resized cell's own text by the left-edge change plus the
  share of the width change its computed `text-align` gives it (left 0, center half, right all;
  `start`/`end` resolved against `direction`). `LaidOutBox.text_align_right` becomes
  `text_align: InlineAlign`.
- `normalize_fixed_table_widths` is deleted (with `LaidOutBox.rowspan`, which only it used).
- `normalize_table_percent_widths` skips `table-layout: fixed` tables.
- `normalize_auto_table_compact_columns` is kept.

The render path and the layout dump now run 3 passes: `painted_table_cell_text_baselines`,
`table_percent_widths`, `auto_table_compact_columns`. The new and rewritten tests in
`crates/vellora-core/tests/layout_fidelity.rs` cite Chrome's numbers
(`attachments/chrome-probes-table-passes.json`).

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T114420Z` (2026-10-21 11:44:20Z), 20/20 steps ok, run-all exit 3 (gate FAIL before acceptances), git `5ce90be` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/02-delete-noop-passes --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/03-table-passes`, then `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/02-delete-noop-passes --run fidelity/results/run-all/03-table-passes --accept <accepted.json> --out fidelity/results/run-all/03-table-passes/gate` |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-03-table-passes-20261021T114420Z`. Ablation runs, binaries, diffs, `accepted.json` and scratch drivers: `~/.cache/vellora-fidelity/step03-table-passes-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/02-delete-noop-passes` (previous link; `gate-report.{json,md}`) | **PASS** with 40 `acceptedRegressions` | improvement 1529, accepted 40, gating 0, unchanged 13910 |
| `port/02-delete-noop-passes` without acceptances (`attachments/gate-report-without-acceptances.*`) | FAIL | the same 40 items gate |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 110 gating; improvement 640 → 881 |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 100 → 74 gating; improvement 715 → 761 |

Values that moved (before → after, CONFIRMED, gate report):

| oracle | before → after |
|---|---|
| invoice REF-W max / p95 mm (step target: price/total columns) | 3.91 / 3.78 → **2.81 / 2.78** (pin 2.44 / 1.78) |
| danfe REF-W max / p95 mm | 45.66 / 33.22 → **4.71 / 3.43** |
| boleto-febraban REF-W max / p95 mm (and `.px-grid`) | 86.19 / 36.73 → **7.94 / 2.63**; BOL-R1 worstMm 86.02 → 4.8 |
| text-stress-ptbr REF-W max / p95 mm | 101.6 / 97.36 → 96.73 / 95.96 |
| BOL-X1 / BOL-X2 (pdftotext) found, both boleto-febraban variants | 11 → **16** of 16 (pin 13); BOL-B2 printed text found 0 → 1 |
| DANFE-X1 found / DANFE-X2 pdftotext, pdfminer | 22 → **26** of 26 (pin 24) / 22 → 26, 25 → 26 |
| DANFE-F4c segments / DANFE-F11 glyphs | 2 → 3 / 3472 → 3511 (the pin's values) |
| DANFE-B1 Code 128 decodes + validates (corpus and zxing/zbar oracle) / DANFE-B5 excess | FAIL → PASS / 2.6077 → 0 mm |
| EXT-2 pdftotext missing/extra | boleto-febraban 12/8 → 0/0, danfe 15/10 → 0/0, text-stress 82/50 → 0/9 |
| pdf-probe words improved | invoice 182, boleto-febraban 112, danfe 392, text-stress-ptbr 779 |
| WPT pass / clean (8047 reftests) | 3076 / 2506 → **3077 / 2507** (38.24 % / 31.15 %): `css/CSS2/tables/fixed-table-layout-026.xht` fail → clean pass; no other outcome changes |
| unchanged | notification (meta-table untouched: 2 columns, no compact; deadline table already fixed by `table_percent_widths`), receipt, boleto, sparksuite, postmark; every page count; LET-*, TXT-B1, DANFE-M1; crashtests 239/239 ok; canaries 30/30 caught; DET-1/DET-2 PASS; layout-diff check failures limited to the 5 allowlisted ones |

Verdict totals: all PASS 131 → 143, FAIL 52 → 36, WARN 4 → 8, NOT-RUN 3; excluding diagnostic
variants 112 → 121, 44 → 32, 4 → 7, 3. The extra WARNs are EXT-2 rows going FAIL → WARN.

### How each pass was decided (ablation, `attachments/ablation-table-passes.json`)

Each variant was a full `run-all --gate` run against `02-delete-noop-passes` (same environment):

| variant | gate vs 02 (no acceptances) | invoice REF-W max | WPT pass / clean |
|---|---|---|---|
| V1: alignment fix, both passes kept | improvement 536, regression 38 | 2.81 | 3076 / 2506 |
| V3: V1 − `fixed_table_widths` | improvement 1528, regression 40 | 2.81 | 3076 / 2506 |
| V4: V3 − `auto_table_compact_columns` | improvement 1489, regression 79 (+ red cargo test) | **5.14** | 3076 / 2506 |
| final: V3 + percent pass skips fixed tables | improvement 1529, regression 40 | 2.81 | 3077 / 2507 |

- **`auto_table_compact_columns`: kept.** It only fires on the invoice in the corpus. Deleting it
  moves invoice REF-W max 2.81 → 5.14 mm (worse than step 02's 3.91) and makes 111 invoice
  pdf-probe words worse with none better, and changes no WPT outcome or table-suite pixel count.
  With the alignment fix the pass improves 70 invoice runs and regresses none (layout-diff layer
  effects; step 02: 35 better / 70 worse). The pass is a heuristic: Chrome gives the spare width of
  an auto table to the columns in proportion to their max-content widths (CONFIRMED on the
  invoice, `compact_aligned` and `short_numeric_columns` probes, scale factors 1.29 / 1.475 /
  1.374); raw Blitz gives every auto column an equal share (HYPOTHESIS: Taffy's auto-track
  stretch, the table is a grid in blitz-dom). The tests pin its column boxes near Chrome's, not
  its text.
- **`fixed_table_widths`: deleted (net harmful).** It split every `table-layout: fixed` table into
  equal tracks. Blitz 0.3.0-beta.4 implements CSS 2.2 §17.5.2.1 itself and matches Chrome exactly
  on `<col>` widths (60 / 220 / 120 px; the pass gave 133.33 × 3) and first-row widths (88 / 156 /
  156). Deleting it improves 1465 pdf-probe words and the DANFE/BOL rows above. On WPT the
  table-suite differing pixels drop 4 656 441 → 4 567 081 (V1 → V3). `fixed-table-layout-003a*–d*`
  go from 1 600–4 300 to 8–21 px. `003e*/f*` and `025`/`027`–`031` get worse (e.g. 025: 5 000 →
  8 800 px; outcomes stay fail).
- **`table_percent_widths`: kept, now auto tables only.** Re-checked: Blitz still turns `%` cell
  and `<col>` widths into `auto` in auto tables (blitz-dom `layout/table.rs`,
  `build_table_context` / `collect_table_cells`). The notification deadline table needs the pass
  (value cell x error 65.5 px → 0.13 px). In fixed tables Blitz resolves `%` itself and matches
  Chrome (108 / 146 / 146); the pass re-split them (100 / 150 / 150). Skipping fixed tables turns
  `fixed-table-layout-026` into a clean pass and lowers 025/028/030/031 (e.g. 028 6 000 → 2 000
  px); 027 rises 6 400 → 7 400 px. The corpus has no `%` width in a fixed table.

### `acceptedRegressions` (40; reasons and evidence in `manifest.json`, per-item data in `attachments/accepted-evidence.json`)

All 40 are pdf-probe words.

- **16 `pdf-probe-pairing-artefact`** (oracle artefacts). The gate pairs the k-th occurrence of a
  token on each side.
  - **danfe** `1#1 dx`, `DA#3 dx/dy`, `da#1 dy`, `da#2 dx/dy`: the vellora word order changed, so
    old and new compare different Chrome words. By position (nearest same-text Chrome word on the
    page) each moved closer to Chrome or changed by less than 1 pt (e.g. `da#2` 25.41 → 2.96 pt,
    `1#1` 32.79 → 2.21 pt, `DA#3` 0.36 → 1.11 pt).
  - **danfe** `000#12 dy`: the old pdftotext order of the item rows was scrambled. The same row
    against the same Chrome word has dy 16.09 pt in both runs; only its x moved, −122.2 → +2.99 pt.
  - **text-stress-ptbr** `débito#6/#10/#13/#16`, `crédito#3/#5/#6`, `Documento#6`, `Saldo#8`:
    vellora has 8 pages and Chrome 7, so these occurrences pair with words of other rows.
    Against the Chrome column they belong to, all moved closer: `crédito` +36.65 → −0.23 pt,
    `débito` +36.66 → −0.21, `Documento` −88.42 → −0.17, `Saldo` −19.07 → −0.95.
- **24 `coincidental-match-of-wrong-geometry`**. These are DANFE header-cell words in the collapsed
  fixed tables 5, 7 and 14 (`INSCRIÇÃO ESTADUAL DO SUBST. TRIB.`, `CNPJ`, `DATA DA EMISSÃO`,
  `DATA DA SAÍDA`, `HORA DA SAÍDA` and their values, the second `CNPJ/CPF` block); |dx| goes from
  0.07–5.84 pt to 1.83–7.69 pt.
  - The old position came from the equal tracks of the deleted pass. They were wrong by
    construction (they ignore the `<col>` widths Chrome honours) and landed near Chrome's edges here
    only by arithmetic (table 5: `<col>` 6.86 / 6.86 / 6.78 cm vs equal 6.83 cm).
  - The new position is raw Blitz: layout-diff L0 dx equals the final-layer dx for every one of
    these runs.
  - The residual is a separate Blitz defect. It lays each collapsed border out as a whole-width
    gutter between `<col>`-length tracks, so cells drift right per column and overflow the table
    (DANFE table 7: Chrome td x 0.5 / 466.16 / 667.59, Blitz +0.50 / +4.84 / +6.41 px).
  - **These 24 do not fit the merge rule's literal "false pass / oracle artefact" wording**: the
    old value was closer to Chrome, for a wrong reason. They are listed for the orchestrator to
    decide, like step 01's `pdf-probe-compensating-drift` items.

The `committed-canary` self-test asserts that `03-table-passes` FAILs against `02-delete-noop-passes`
without acceptances (exactly the 40 accepted keys gate), PASSes with them, and that invoice REF-W
max, BOL-X1, DANFE-X1 and `fixed-table-layout-026` improve.

## `04-block-offset`: Blitz's `block_offset` read, constant 4 px PDF text raise removed

Branch `phaseb/04-block-offset` (from `phaseb/03-table-passes` `52b915e`), code commit `8e4face`:

- `blitz_engine::read_text_runs` places every glyph run where Blitz's own painter does: content box
  + `TextLayout::block_offset` + `GlyphRun::baseline()` (blitz-paint 0.3.0-beta.4 `render.rs`
  `draw_inline_layout`). `block_offset` carries a table cell's `vertical-align` (stylo_taffy
  `table_cell_vertical_align` maps it to `align-content`) and a block's `align-content` (blitz-dom
  `layout/inline.rs`). Before, every vertically aligned cell drew its text at the cell top.
- `pdf.rs` draws each run on its layout baseline. `TEXT_BASELINE_COMPENSATION_PX` (a constant 4 px =
  3 pt raise of every glyph run) is deleted. There was no baseline bug to fix at the source: Parley's
  line baseline is already Chrome's.
- `normalize_painted_table_cell_text_baselines` is **kept** (ablation below). Its test now says it
  pins a compensating heuristic, not browser behaviour.
- New Chrome-verified tests in `crates/vellora-core/tests/text_baseline.rs` (5; red on the step-03
  code except the layout-baseline one, which pins that Parley's baselines already match Chrome).
  The Chrome numbers are in `attachments/chrome-probes-text-baseline.json`.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T125346Z` (2026-10-21 12:53:46Z), 20/20 steps ok, run-all exit 3 (gate FAIL before acceptances), git `8e4face` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/03-table-passes --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/04-block-offset`, then `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/03-table-passes --run fidelity/results/run-all/04-block-offset --accept <accepted.json> --out fidelity/results/run-all/04-block-offset/gate` (exit 0) |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-04-block-offset-20261021T125346Z`. The ablation runs (A/B/C), the `layout_dump` binaries of every variant, the probe HTML, the Chrome PDFs and `accepted.json`: `~/.cache/vellora-fidelity/step04-block-offset-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/03-table-passes` (previous link; `gate-report.{json,md}`) | **PASS** with 2587 `acceptedRegressions` | improvement 733, accepted 2587, gating 0, unchanged 12193, withinTolerance 1 |
| `port/03-table-passes` without acceptances (`attachments/gate-report-without-acceptances.*`) | FAIL | the same 2587 items gate |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 546 gating (03: 110); improvement 1314 (03: 881) |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 76 gating (03: 74: + DANFE-L1a…d, − invoice REF-W max, − `floats-142`); improvement 981 (03: 761) |

Values that moved (before → after, CONFIRMED, gate report):

| oracle | before → after |
|---|---|
| WPT pass / clean (8047 reftests) | 3077 / 2507 (38.24 % / 31.15 %) → **3303 / 2732 (41.05 % / 33.95 %)**: 227 fail → pass, 1 clean pass lost (accepted, below). css/CSS2/linebox 29/27 → 125/123, tables 21/18 → 53/50, normal-flow 396/373 → 415/391, positioning 298/272 → 315/289, css-text 443/193 → 464/214, CSS2/text 223/215 → 237/229, floats-clear 30/25 → 39/34, fonts 121 → 127, borders 377/348 → 383/354, margin-padding-clear 513/498 → 517/502, colors 7 → 9 |
| invoice REF-W max / p95 mm | 2.81 / 2.78 → **2.53 / 2.51** |
| boleto-febraban (and `.px-grid`) REF-W max / p95 mm; BOL-R1 worstMm | 7.94 / 2.63 → **2.31 / 1.95**; 4.8 → 1.82 |
| text-stress-ptbr TXT-R1 worstMm | 0.94 → 0.38 |
| DANFE-M1 excessB mm | 25.232 → 24.173 |
| pdf-probe words improved | invoice 283, boleto-febraban 115, text-stress-ptbr 46, boleto 25, danfe 22, notification 5 |
| accepted (worse) | notification LET-1 PASS → **FAIL** 0.75 → 1.81 mm; DANFE-L1b PASS → **FAIL**; DANFE-L1a…d posErrMm +1.06 mm each; REF-W max/p95 danfe 4.71/3.43 → 5.42/4.49, notification 1.63/1.07 → 1.81/1.70, boleto p95 2.40 → 2.58, receipt p95 2.03 → 2.55, text-stress 96.73/95.96 → 97.79/97.02; INV-R1 sparksuite 3.09 → 4.15, postmark 9.20 → 10.26; 2569 pdf-probe words |
| unchanged | every page count (REF-P etc.), LET-2, TXT-B1, BOL-X/DANFE-X/EXT-2 counts, barcode decodes, crashtests 239/239 ok, canaries 30/30 caught, DET-1/DET-2 PASS, code checks green, layout-diff check failures limited to the 5 allowlisted ones |

Verdict totals: all PASS 143 → 141, FAIL 36 → 38, WARN 8, NOT-RUN 3; excluding diagnostic variants
121 → 119, 32 → 34, 7, 3. The two new FAILs are LET-1 (notification) and DANFE-L1b. PDF bytes change
on purpose. The clean-commit run and the dirty ablation run B (same code) produced byte-identical
`vellora*.pdf` files, 29/29 (`attachments/pdf-identity-vs-ablation-B.json`).

**The REF-W distribution got better in its body and worse in its tail** (layout oracle, Chrome +
WeasyPrint tol-2 consensus words; subject error in pt, `attachments/ablation-block-offset.json`):

| fixture | median dy | mean \|dy\| | p50 | p95 | max |
|---|---|---|---|---|---|
| invoice | −3.46 → −0.46 | 3.21 → 1.00 | 3.75 → 1.42 | 7.87 → 7.11 | 7.96 → 7.16 |
| notification | −2.70 → +0.30 | 2.45 → 1.94 | 2.72 → 0.50 | 3.04 → 4.82 | 4.62 → 5.14 |
| receipt | −3.04 → −0.04 | 3.12 → 1.95 | 3.44 → 1.00 | 5.75 → 7.22 | 286.72 → 286.91 |
| boleto-febraban | −2.85 → +0.15 | 3.18 → 1.83 | 3.52 → 2.78 | 7.45 → 5.54 | 22.50 → 6.55 |
| boleto | −1.27 → +1.73 | 2.80 → 2.95 | 2.63 → 2.57 | 6.79 → 7.32 | 13.16 → 13.16 |
| danfe | +1.42 → +4.42 | 3.19 → 4.56 | 3.62 → 4.84 | 9.71 → 12.73 | 13.37 → 15.38 |

Before this step, text was 3 pt above its layout position everywhere. Where the layout was right,
this put the median about 3 pt above Chrome: invoice, notification, receipt, boleto-febraban.
Where raw Blitz placed boxes too low, the raise hid part of that drift: the lower half of the
notification, the DANFE, and the boleto tails. Now each word sits at its layout position, so
those boxes show their real error.

### Root cause of `TEXT_BASELINE_COMPENSATION_PX` (CONFIRMED, `attachments/chrome-probes-text-baseline.json`)

- **Parley's layout baseline is Chrome's.** The probe covers 7 bundled face/size/`line-height`
  forms: normal, number, length, 0, Liberation Sans/Serif/Mono, DejaVu Sans. The layout baselines
  are within 0.31 px of Chrome's DOM baselines, and the residual is Blink rounding ascent and
  descent to whole px.
- **The raise was the only error.** With the 4 px raise, every one of these PDF baselines sat
  2.976 pt above Chrome's print baseline. Without it they sit +0.024 pt (Chrome puts the 18 mm
  margin at 68 px = 51.0 pt).
- **WPT Ahem tests show the same 4 px.** `css/CSS2/linebox/line-height-002.xht` failed by 160 px,
  which is 2 glyphs × 20 px × 4 px. It now passes; css/CSS2/linebox passes went 29 → 125.
- **Where the constant came from.** It was introduced in `ab65dfd` (Blitz pin era). In the pin run
  `20261021T054154Z`, with the raise applied, the notification's PDF words (PyMuPDF baselines vs
  Chrome) clustered at 0.0 pt (72 words; median −1.15 pt). The paginated text then sat about 3 pt
  low and the raise cancelled it. Steps 01–03 removed that drift, and the constant was left
  over-correcting.
- **`block_offset`.** On the step-03 code, cells with `vertical-align: middle` or `bottom` and
  `align-content: center` or `end` drew their text at the top of the box, 23–64 px off. Now they
  are exact (TOP/MID/BOT/DFLT 15/38/61/38 px; `align-content` 14/132/250 px).

### pdf-probe measures bbox tops, and the producers' `/Ascent` differs (CONFIRMED, `attachments/font-descriptor-ascent.txt`, `pdftotext-bbox-baselines-probe.txt`)

- **What pdf-probe measures.** Its y is poppler `pdftotext -bbox` yMin, which is baseline − `/Ascent` × size.
- **What each producer writes as `/Ascent`.**
  - krilla 0.8.2 writes OS/2 `sTypoAscender`: Liberation Sans 728, Serif 693, Serif Bold 677 (per 1000 em).
  - Chrome writes the hhea ascender: 905 and 891.
- **Effect on every pdf-probe dy (steps 00–04).** Each one carries +(A_chrome − A_krilla) × size:
  +2.12 pt for 12 pt Liberation Sans, +1.08 pt for 5.5 pt Serif. Before this step, that term and
  the −3 pt raise largely cancelled, so pdf-probe looked better than the true baselines.
- **The artefact-free check.** On the probe, the two PDFs' PyMuPDF baselines agree to 0.024 pt and
  their yMax (descent) values agree to 0.006 pt, while their yMin values differ by +2.15 pt.
- **What the evidence uses instead.** Every pdf-probe acceptance below compares PyMuPDF span origins
  (true baselines) of the same two PDFs. Follow-up: pdf-probe should compare baselines (or yMax).

### `painted_table_cell_text_baselines`: kept (ablation, `attachments/ablation-block-offset.json`)

Each variant was a full `run-all --gate` against `03-table-passes` (same environment):

| variant | gate vs 03 (no acceptances) | WPT pass / clean | REF-W p95 mm danfe / boleto / boleto-febraban / invoice |
|---|---|---|---|
| A: `block_offset` only | improvement 30, regression 28 (+1 lint failure: unformatted test) | 3077 / 2507 | 3.60 / 1.87 / 2.12 / 2.78 |
| B (= final): A − 4 px raise | improvement 733, regression 2587 | 3303 / 2732 | 4.49 / 2.58 / 1.95 / 2.51 |
| C: B − painted pass | improvement 470, regression 2762 | 3310 / 2739 | 4.91 / 3.11 / 2.17 / 2.54 |

- **Why the pass is not redundant with `block_offset`.** Chrome puts the text of a painted cell and
  an unpainted cell at the same offset, 20 px (probe `painted_row`). So the 2 px raise is wrong for
  in-box placement. In the corpus, though, it offsets raw Blitz row drift of painted table rows: the
  invoice items table box is +2.09 px at N0, with its text +0.19 px relative to the box.
- **Why it stays.** Removing it gains 7 WPT passes (margin-collapse-106/155,
  white-space-normal-001/002, white-space-collapsing-bidi-003, ws-break-spaces-applies-to-012/013).
  It costs the REF-W values above and 175 more gating items. Retire it together with the drift fix.
- **Layer proof (corrected 2026-10-22).** This bullet used to end "No other vellora layer moves
  text y". That is wrong. The first half holds: every layout-diff text run's last
  layout_normalize layer (`auto_table_compact_columns`) has y equal to B0, or to B0 − 2 px (the
  kept pass), on all 9 fixtures. But pagination's P layer, measured after that last pass, moves
  y too. CONFIRMED by re-measuring the step-04 run copy
  `~/.cache/vellora-fidelity/run-all-04-block-offset-20261021T125346Z` with
  `node fidelity/gate/layer-vector.mjs --run <run copy> --summary --anchor "notification:Gerente do Departamento"`
  (darwin 27.0.0 arm64, Node v22.23.2; written 2026-10-21, reproduced byte for byte 2026-10-22;
  committed as `fidelity/gate/snapshots/2026-10-21/ledger/step04-run-level-summary.json`).
  Text runs where P's y differs from the last pass's y, out of all runs in the fixture:

  | fixture | P ≠ last pass (y) | last pass = B0 / B0 − 2 px | N0 = B0 = L0 |
  |---|---|---|---|
  | boleto | **13 / 78** | 5 / 73 | 78 / 78 |
  | boleto-febraban | **60 / 98** | 5 / 93 | 98 / 98 |
  | receipt | **36 / 56** | 29 / 27 | 56 / 56 |
  | text-stress-ptbr | **364 / 779** | 59 / 720 | 779 / 779 |
  | danfe, invoice, notification, oss-sparksuite-invoice | 0 (318, 210, 35, 22 runs) | 7/311, 20/190, 29/6, 13/9 | all |
  | oss-postmark-receipt | 0 / 44 | 44 / 0 | N0 n/a on all 44 (no aligned raw run while `html_normalize` existed) |

  Every P move is larger than layout-diff's 0.5 px tolerance (`pMovesBeyondTolY` = the same
  counts). At step 07 (`step07-run-level-summary.json`, run copy `…-07-media-print-20261021T162148Z`)
  the counts are the same, except that receipt is 36 / 60 and postmark has no aligned runs. The
  earlier "60/98 boleto-febraban, 13/78 boleto, 36/60 receipt" figures came from step 07; at step
  04 receipt is 36 / 56. The step's own target is unaffected: LET-1's anchor "Gerente do
  Departamento de Cobrança" (notification) has dy +6.516 px in every layer: N0 = B0 = L0 = each
  pass = P. The same command on the step-03 run copy (`…-03-table-passes-20261021T114420Z`,
  2026-10-22) gives the identical vector. So the LET-1 change at this step (0.75 → 1.81 mm) moved
  no layout layer of that anchor (CONFIRMED). That it comes from removing the constant 4 px PDF
  text raise, the step's only PDF-stage change, is a HYPOTHESIS that was not measured separately.

### `acceptedRegressions` (2587; per-item numbers in `attachments/accepted-evidence.json`)

The builder, `attachments/scratch-build-accepted.py.txt`, gives each gating item one label. Only the
first three labels fit GATE-A1's literal wording ("the old value was an oracle artefact"):

| label | n | fits the literal rule? | what it is |
|---|---|---|---|
| `pdf-probe-ascent-artefact` | 697 | yes | the word's true baseline (PyMuPDF) did not get worse beyond 1 pt; only pdftotext's yMin did (ascent term above) |
| `pdf-probe-pairing-artefact` | 11 | yes | the k-th-occurrence pair is another word instance (paired Chrome word > 20 pt away horizontally in both runs, e.g. body `débito` vs header `Débito`) |
| `wpt-subpixel-raster-artefact` | 1 | yes | `css/CSS2/linebox/inline-formatting-context-001.xht`: 1 differing pixel (maxDifference 3) at a glyph-run boundary; Chrome 155 fails the same reftest in the same harness (78 px, maxDifference 64); the old pass drew test and reference 4 px above Chrome (ink bbox top 14 vs Chrome 19, now 18) |
| `compensating-drift` | 672 words + 17 value/status rows | **no** | the old value was the layout error minus the removed 3 pt raise (two errors cancelling); the word or anchor now sits at its laid-out and paginated baseline; old baseline < 5 pt off Chrome |
| `misplaced-word-uniform-shift` | 1189 | **no** | the old baseline was already ≥ 5 pt off Chrome (text-stress-ptbr 736: rows displaced by its 8-vs-7 page breaks, e.g. page 3 `10/04/2026 Compra no débito …` at 422.8 pt vs Chrome 150.6 pt), moved by exactly the removed raise (+ `block_offset`) |

- **The 5 pt split is a triage aid.** It separates words that looked right before from words already
  visibly off. It is not a rule claim.
- **Per fixture.**
  - ascent artefacts: invoice 148, notification 147, text-stress 198, danfe 101, boleto-febraban 33,
    receipt 30, boleto 29, sparksuite 11.
  - compensating-drift words: danfe 176, boleto-febraban 109, boleto 99, notification 90,
    text-stress 82, postmark 48, receipt 44, sparksuite 24.
  - misplaced words: text-stress 736, danfe 264, boleto 89, postmark 89, sparksuite 11.
  - pairing artefacts: text-stress 7, danfe 2, receipt 2.
- **The 17 value/status rows, all `compensating-drift`:**
  - notification LET-1, status PASS → FAIL and worstMm 0.75 → 1.81. The worst anchor, "Gerente do
    Departamento de Cobrança", is +6.516 px below Chrome already in raw Blitz on the source HTML
    (layout-diff N0). Its box sits at the same offset, and B0 = L0 = every pass = P.
  - DANFE-L1b, status PASS → FAIL, and DANFE-L1a…d posErrMm, each +1.06 mm.
  - REF-W max/p95 of danfe, notification, boleto (p95), receipt (p95) and text-stress (page-break
    dominated).
  - INV-R1 of sparksuite and postmark, each +1.06 mm.
- **Same family as steps 01 and 03.** The 1861 words and 17 rows are of the same kind as step 01's
  119 `pdf-probe-compensating-drift` items and step 03's 24
  `coincidental-match-of-wrong-geometry` items. The orchestrator decides on them. The fallback
  without them is ablation A (`block_offset` only): its gate shows 28 regressions (18 DANFE header
  words, 4 postmark values, 1 DANFE REF-W p95 — all compensating drift — and 5 boleto words, which
  are ascent artefacts).
- **Commit message.** This step's commit message lists every non-pdf-probe accepted key and the
  per-label × per-fixture counts of the 2569 words, not 2569 lines. The full list is in
  `manifest.json`.

Other findings, measured in this step:

- **Blitz `<br>` in a table cell adds 1 px per line.** At 12 px with line-height 1.5 the line pitch
  is 19 px instead of 18; with `normal` it is 15 instead of 14. Wrapped lines in cells and `<br>` in
  divs are exact (probes `cell_lines_*`, `lines_*`). This is a candidate source of the row drift.
- **postmark.** Chrome and WeasyPrint disagree by about 22 pt on its table values, and vellora's new
  position matches WeasyPrint within 0.5 pt. postmark has no REF-W consensus.

The `committed-canary` self-test asserts that `04-block-offset` FAILs against `03-table-passes`
without acceptances (exactly the 2587 accepted keys gate), PASSes with them, and checks the label
counts. It also checks that `line-height-002`, invoice REF-W max and boleto-febraban REF-W max
improve, and that LET-1 0.75 → 1.81 is an accepted item.

## `05-walk-rewrite`: the box walk follows Blitz's box tree; `html_normalize` deleted

Branch `phaseb/05-walk-rewrite` (from `phaseb/04-block-offset` `b3bf9a9`), code commit `e9dc7e4`.

- **The walk reads Blitz's box tree, not DOM children** (`blitz_engine::walk_box`). It iterates
  `Node::layout_children` in layout order, so it now visits Blitz's anonymous block boxes (text next
  to a block child, a `<td>` holding text and a `<div>`, the body's own text) and block
  `::before`/`::after` boxes. Text nodes and non-atomic inline elements (`<span>`, `<b>`) no longer
  get a box: their text is in the runs of the inline root that shaped it. Tables keep their DOM row
  structure: row groups and rows have no Blitz layout, so `walk_table` re-inserts them as zero-size
  boxes above their cells, as before. Pagination and the table passes need them.
- **Every box is placed through `Node::containing_block()`** (`box_origin`: its location plus the
  containing block's origin, which is Blitz's `absolute_position` without scroll). Absolutely
  positioned and fixed boxes therefore sit on their containing block. `anonymous_block_offset`
  (step 01) is gone.
- **`html_normalize` is deleted**, together with html5ever 0.39 and markup5ever_rcdom (the
  duplicate html5ever 0.39 stack leaves `Cargo.lock`). It was the HTML pre-pass that wrapped inline
  runs in `<div>`s and re-serialized the document. The render path now lays out the input as given.
- **pagination**: when the body's in-flow content is all inline-level, the body is its own inline
  root and its text sits on the body box. Pagination fragments the body's children, so that text
  was dropped. The body is now one block fragment, without its own background and borders (see
  "body background" below).
- `<img>` diagnostics take the DOM ordinal from a DOM preorder pass and keep the unresolved image
  that comes first in the DOM, because the walk no longer visits every element.
- New Chrome-verified tests: `crates/vellora-core/tests/walk.rs` (9; Chrome numbers in
  `attachments/chrome-probes-walk.json`, probe HTML included). Rewritten: `tests/layout_dump.rs`
  (wrapper tests → anonymous blocks, N0 = B0, B0/L0 abspos), `tests/pagination_edges.rs` (no
  `<span>` box), `tests/image_resources.rs` (a hidden `<img>` still counts toward the located
  occurrence). On the step-04 binary (`layout_dump-B`, `attachments/scratch-oldruns.py.txt`) these
  probes fail as follows:
  - the abspos span is at 58, 61 instead of 48, 35;
  - the ICB boxes are at 208, 120 and 308, 30 instead of 200, 100 and 300, 10;
  - "BEFORE" is never drawn;
  - "Volte sempre." is at x 8, 16 px, instead of 167.234, 13.333 px.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T142201Z` (2026-10-21 14:22:01Z), 20/20 steps ok, run-all exit 3 (gate FAIL before acceptances), git `e9dc7e4` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/04-block-offset --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/05-walk-rewrite`, then `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/04-block-offset --run fidelity/results/run-all/05-walk-rewrite --accept <accepted.json> --out fidelity/results/run-all/05-walk-rewrite/gate` (exit 0) |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-05-walk-rewrite-20261021T142201Z`. The ablation run, the floats-feature WPT run, the probe HTML and Chrome PDFs, `accepted.json` and the scratch drivers: `~/.cache/vellora-fidelity/step05-walk-rewrite-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/04-block-offset` (previous link; `gate-report.{json,md}`) | **PASS** with 18 `acceptedRegressions` | improvement 444, accepted 18, reported 26, changed 10, gating 0, unchanged 15008 |
| `port/04-block-offset` without acceptances (`attachments/gate-report-without-acceptances.*`) | FAIL | the same 18 items gate |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 533 gating (04: 546); improvement 1727 (04: 1314) |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 63 gating (04: 76); improvement 1322 (04: 981) |

Values that moved (before → after, CONFIRMED, gate report):

| oracle | before → after |
|---|---|
| WPT pass / clean (8047 reftests) | 3303 / 2732 (41.05 % / 33.95 %) → **3665 / 3107 (45.54 % / 38.61 %)**: 367 fail → clean, 15 fail → flagged, 12 pass-blank → clean, 5 flagged → clean; lost: 9 clean (accepted, below), 26 flagged (reported, below) |
| WPT per suite (pass / clean) | generated-content 43/38 → 82/78, positioning 315/289 → 361/359, abspos 0/0 → 2/2, visuren 3/3 → 6/6, box-display 53/52 → 65/65, normal-flow 415/391 → 431/405, tables 53/50 → 77/74, css-text 464/214 → 630/377, CSS2/text 237/229 → 247/238, css-break 104/75 → 115/81, css-page 64/49 → 71/55, css-tables 38/29 → 47/38, margin-padding-clear 517/502 → 525/508, fonts 127 → 135, colors 9 → 10, linebox 125/123 → 126/124, visudet 14/8 → 14/9, visufx 1 → 2; floats 19/17 → 19/16, floats-clear 39/34 → 38/33, backgrounds 176/67 → 175/67 |
| receipt REF-W max / p95 mm (step target: `p.thanks`) | 101.22 / 2.55 → **1.37 / 0.70** |
| pdf-probe words improved | receipt 40 |
| accepted (worse) | 6 WPT false passes; 3 WPT float tests; oss-postmark-receipt INV-X1/INV-X2 PASS → FAIL (found 6 → 5), EXT-2 missing pdftotext 38 → 39, pdfminer 2 → 11, pymupdf 40 → 41 |
| unchanged | every other corpus and oracle value. 23 of the 29 `vellora*.pdf` files are byte-identical to step 04's (`attachments/pdf-identity-vs-04-block-offset.json`): only receipt and postmark changed. Invoice (35 wrappers) and boleto (24) are identical bytes: Blitz's anonymous blocks lay out exactly like html_normalize's `<div>`s. Also unchanged: crashtests 239/239 ok, canaries 30/30 caught, DET-1/DET-2 PASS, code checks green |

Verdict totals: all PASS 141 → 139, FAIL 38 → 40, WARN 8, NOT-RUN 3; excluding diagnostic variants
119 → 117, 34 → 36, 7, 3. The two new FAILs are postmark INV-X1 and INV-X2.

### `layout_children`, not `paint_children` (probe, `attachments/blitz-tree-probe-paint-vs-layout.txt`)

The probe walks one document three ways (DOM children, `layout_children`, and `paint_children`
plus stacking-context hoisted children) and prints every node's origin next to
`Node::absolute_position(0, 0)`. All CONFIRMED, Blitz 0.3.0-beta.4:

- **Positions.** Summing down `paint_children` gives `absolute_position` for every box. Summing
  down DOM children or `layout_children` puts out-of-flow boxes at the wrong place:
  - an abspos span inside a non-positioned `<p>`: DOM/layout 58, 61 vs paint/abs 48, 35 (Chrome 48, 35);
  - a box with no positioned ancestor: 208, 130 vs 200, 100 (Chrome 200, 100).
- **Structure.** `paint_children` cannot be the box list's skeleton:
  - it lists a box whose containing block is the initial containing block under `<html>`, a
    sibling of `<body>`, and pagination only fragments the body's children;
  - it leaves a `z-index: 2` box out entirely: the box is only in the root's stacking-context
    list.
- **Choice.** The walk iterates `layout_children` and takes each position from the
  containing-block chain. That gives paint's positions with layout's structure.
- **Paint order does not reach the PDF from this list.** `pagination` sorts the filled rects by
  (y, x) and the emitter draws all rects, then images, strokes and text. Box order only breaks
  ties. Real z-order is a follow-up.

### Fidelity layers after this step (`fidelity/layout-diff/README.md`, "Since port step 05")

- **`L0`** is the box walk: anonymous and pseudo-element boxes are in it, text nodes and
  `<span>`s are out, and table rows are re-inserted. layout-diff lists L0 anonymous boxes as
  "Blitz anonymous block (no source node)", so they do not fail `dom_key_alignment`.
- **`B0`** boxes and text are placed the way Blitz's painter places them: each box's location is
  added to its `containing_block`'s origin (`RawNode.containing_block`). Before, every box was
  accumulated under its layout parent.
- **`N0`** (`--no-html-normalize`) equals B0 by construction. JSON `html_normalize` is
  `"skipped"` for N0 and `"removed"` for the render-path dump; wrappers are 0/0 and `synthetic` is
  always false.
- **Allowlist (`fidelity/layout-diff/expected-check-failures.json`).**
  - Expired and removed: receipt `normalize_wrappers_located`, `normalize_dom_roundtrip` and
    `dom_key_alignment` (the hoist), and postmark `normalize_dom_roundtrip`.
  - Added: postmark `dom_key_alignment`. The render DOM is now blitz-html's XML parse of the
    XHTML-doctype source (`table>tr`, no `tbody`), the same root cause as the kept
    `source_dom_keys_vs_chromium`. Until step 04 it passed only because html_normalize
    re-serialized this document and Blitz re-parsed it as HTML.
- **Phase A baselines.** `pin` and `beta4` predate the allowlist, so `gate/snapshot.mjs` classifies
  them with a frozen copy of it (`expected-check-failures-phase-a.json`, the list as committed
  from 00-start to 04). Their classification therefore does not change with the live list.

### `acceptedRegressions` (18; per-item numbers in `attachments/accepted-evidence.json`)

| label | n | fits the literal rule? | what it is |
|---|---|---|---|
| `wpt-false-pass` | 6 | yes | the old test equalled its reference (maxDifference 0) but not Chrome's rendering of the test (ink bbox / colour bins / page count from the reused Chrome data) |
| `html-normalize-compensation` | 12 | **no** | the old value matched Chrome only because html_normalize rewrote the document; without the rewrite, a raw Blitz defect shows |

**`wpt-false-pass` (6).** Old ink is test = reference, compared with Chrome's ink of the test.

| test | old ink vs Chrome's | why old test and reference matched |
|---|---|---|
| `css/CSS2/floats-clear/floats-153.xht` | bbox [8, 18, 287, 33] vs [8, 19, 287, 98] | the green PASS was in neither old render. Now the reference draws it (the walk reads the body's anonymous block), and the test still does not (Blitz places the float at x −70) |
| `css/CSS2/floats/floats-placement-vertical-003.xht` | yellow at y 142–172 vs 113–143 | same picture 29 px off Chrome |
| `css/CSS2/floats/floats-placement-vertical-004.xht` | [8, 8, 107, 212] vs [8, 8, 207, 113] | stacked instead of side by side. bboxShift is exactly 100 px, one below the ink-displaced flag threshold |
| `css/CSS2/linebox/baseline-block-with-overflow-001.html` | [8, 8, 37, 415] vs [8, 8, 64, 329] | html_normalize put each `XX` on its own line. The new test equals Chrome's bbox exactly |
| `css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | 64866 px vs 42826 px, different colour bins | vellora ignores multicol and floats, so the test's float rendered as the reference's plain block. Pictures: `attachments/flex-fragmented-old-{test,ref}.png` (identical) |
| `css/css-page/monolithic-overflow-014-print.html` | 2 pages vs 4 | both sides printed 2 pages |

**`html-normalize-compensation` (12): needs the orchestrator's decision, like the
non-literal families of steps 01, 03 and 04.**

- **3 WPT float tests**: `css/CSS2/floats-clear/floats-132.xht`,
  `css/css-text/text-indent/below-float.html` and `below-float2.html`.
  - The old passes matched Chrome (ink bbox within 1 px).
  - html_normalize wrapped the text next to a floated `<div>` in an inserted `<div>`. That turned
    the inline formatting context into a block container.
  - Without the rewrite, Blitz 0.3.0-beta.4 lays the float out inside the inline formatting
    context and ignores it for the line. In floats-132 the float sits at location (0, −4) under
    the unwrapped text.
  - Enabling blitz-dom's `floats` feature does NOT restore these three (CONFIRMED,
    `attachments/wpt-experiment-floats-feature.json`).
- **9 oss-postmark-receipt rows**: INV-X1 and INV-X2 status and found counts, plus EXT-2 missing
  per extractor.
  - The template's first line is an XHTML 1.0 doctype, so blitz-html parses it as XML
    (`html_sink.rs:92-99`). In XML `<br>` is not void, so the text after each of the template's 3
    `<br>` becomes the `<br>`'s content and is not drawn: "The [Product Name] team",
    "1234 Street Rd." and "Suite 1234".
  - The extra pdfminer misses (2 → 11) are exactly these 7 tokens (pdfminer also reads text that
    lies off the page). "Download as PDF" is drawn now; it was missing before.
  - Chrome parses text/html as HTML. Until step 04, html_normalize happened to change this
    document (1 wrapper), and its re-serialization made Blitz re-parse it as HTML.
  - **This is a real fidelity loss on XHTML-doctype HTML.** XHTML-doctype documents that
    html_normalize did not change were already parsed as XML before this step. The parse-mode
    decision is a follow-up: HTML for every text/html input diverges from Chrome on WPT `.xht`
    files, which Chrome loads as XML.
  - **Retired by `08-html-parse`.** The orchestrator rejected these 9 as real text loss. Step 08
    parses every document as HTML; the 9 rows return to their step-04 values and the postmark
    PDFs are byte-identical to step 04's (section `08-html-parse` below).

**Fallback if the 12 are rejected: ablation "walk only" (`attachments/ablation-walk-only-*`).**
It is `e9dc7e4` with html_normalize restored. Its gate against 04, run 2026-10-21 in the same
environment:

- WPT pass/clean is 3303/2732 → 3649/3097, losing only `floats-153` (the false pass above).
- No corpus value changes, so the receipt keeps REF-W max 101.22 mm.
- Its other gating items are ablation artefacts: red cargo tests written for the deletion, and
  layout-diff key checks, because that build does not mark html_normalize's wrappers in the dump.

Against the walk-only ablation, deleting html_normalize is worth:

- WPT clean: +18 gained (17 fail → clean, 1 flagged → clean), −8 lost (the 5 false passes above
  other than `floats-153`, and the 3 float tests), so 3097 → 3107;
- receipt REF-W max: 101.22 → 1.37 mm;
- postmark: the losses above.

### Other changes and checks

- **26 flagged passes → fail** (reported, not gated):
  - `css/CSS2/positioning/{bottom,position}-applies-to-*` (24),
    `box-display/containing-block-023` and `backgrounds/background-position-002`.
  - The tests now draw their positioned square where Chrome does. Their references draw it as a
    CSS `background-image`, which vellora does not paint.
  - Before, both sides lacked the square (ink-missing flag).
- **9 pass-blank → fail** ("changed", not gated), e.g. `normal-flow/inline-table-width-*`,
  `css-text/boundary-shaping/*`: the walk now draws text that both sides used to lose.
- **Body background: CONFIRMED still not painted.** The body box is never part of a fragment. The
  new inline-root body fragment also leaves out the body's own rects on purpose: CSS 2.2 §14.2
  propagates the root/body background to the canvas, and pagination does not model that. Body
  text is drawn now, both as an anonymous block and as an inline root (`tests/walk.rs`).
- **Block `::before` in an otherwise inline container** (probe `before_block` in
  `chrome-probes-walk.json`):
  - "BEFORE" is now drawn where Chrome draws it (8 / 23).
  - Blitz lays the `::before` out as an inline-level box, so the container's text stays on the
    first line (vellora "mix content" at 74 / 23; Chrome 8 / 43). This is raw Blitz.

The `committed-canary` self-test asserts that `05-walk-rewrite` FAILs against `04-block-offset`
without acceptances (exactly the 18 accepted keys gate), PASSes with them, and checks the label
counts. It also checks that receipt REF-W max (101.22 → 1.37) and the WPT tests
`generated-content/before-inheritable-001`, `positioning/abspos-containing-block-001` and
`box-display/anonymous-box-generation-001` improve.

## `06-page-rules`: every `@page` rule cascaded per page; margin boxes laid out by Blitz

Branch `phaseb/06-page-rules` (from `phaseb/05-walk-rewrite` `2fd9576`), code commit `c9fe9f5`.

- **Before this step `page_css` read only the FIRST `@page` rule**, whatever its selector. The
  notification fixture declares its footer in a second universal rule, so the footer was never
  drawn; a leading `@page :first { … }` applied to every page. Comments were not stripped either:
  `/* … */ size: 1234px` was read as the property `/* … */ size` and dropped.
- **`page_css` now reads every `@page` rule of every `<style>` element** and cascades them per
  page like the element cascade: `!important`, then cascade layer (`@layer` statements and
  blocks; unlayered rules beat layered ones, reversed for `!important`), then page-selector
  specificity (page name, `:first`/`:blank`, `:left`/`:right`), then source order.
  - Selectors. Universal and `:first`. `:left`/`:right`: page 1 is a right page, or a left page
    when the root's `direction` is `rtl`. `:blank` never matches (vellora makes no blank pages),
    and neither do page names (no `page` property). A rule whose selector does not parse
    (`:nth(1)`, `:bogus`) is dropped.
  - `@page` inside `@media print`/`all` applies. A media query with a feature is not evaluated
    and does not match. Other at-rules (`@supports`, …) are skipped.
  - Comments, strings, escapes and parentheses are respected. The content template no longer
    skips the character after a closing quote, so `"P"counter(page)` keeps its counter.
- **pagination** resolves each page's box (`PageBox::for_page`): page height, vertical margins
  and margin boxes may differ per page. The layout viewport is page 1's.
- **Strict gate: `css:page-varying-width`.** Blitz lays the document out once, at one width. A
  `:first`/`:left`/`:right` rule that gives pages different content widths (page width minus left
  and right margins) is rejected at its source position (`page_css::varying_width_rule`, scanned
  by `validation::validate_css`; it checks all four `:first` × left/right combinations, so the
  result does not depend on the page count). Mirrored margins with the same sum pass. No lint
  rule maps to it, like `css:transform` and `css:filter`.
- **Margin boxes are laid out by Blitz.** `blitz_engine::lay_out_margin_texts` builds one small
  second document per render. Its root carries the page context's inherited values: the root
  element's computed text properties (CSS Paged Media 3: the page context inherits from the root),
  then the `@page` text declarations, then the margin box's own (`font*`, `color`,
  `letter-spacing`, `word-spacing`, `text-transform`, `line-height`). It is laid out with the
  document's own font context (a clone kept in `LaidOutDoc::page_context`). pagination places
  each line the way Chrome does:
  - centred in the page area (between the left and right page margins);
  - vertically centred in the margin band (UA `vertical-align: middle`), so the baseline sits
    (ascent − descent) / 2 below the band centre whatever the line height;
  - glyph runs are emitted like body text and share the body's `Arc` of a face, so each face is
    embedded once.

  Before this step the footer was drawn at 9 px in a sampled body face, grey `#3c3c3c`, its
  baseline at the band centre, centred on the page with an estimated width. A document without
  any body text still gets no margin box, as in Chrome (probe `empty_body_footer`).
- **WPT harness** (`fidelity/wpt/lib/prepare.mjs`). The UA page box (print `size: 5in 3in;
  margin: 0.5in`, screen 800 × 600 / 0) is now injected as `@layer vellora-ua-page { @page { … } }`
  before the author styles. It used to be merged into the start of the first author `@page`
  block, which broke as soon as that block was `@page :first`. The first layer loses to every
  author rule, layered ones included (`layers-001` needs that). No `HARNESS_SEMANTICS` bump: the
  comparison semantics and the Chrome side are unchanged.
- New Chrome-verified tests: `crates/vellora-core/tests/page_rules.rs` (12) and unit tests in
  `page_css.rs` (9). `tests/pipeline.rs::each_face_is_embedded_exactly_once_across_pages` now
  counts the footer's face too.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T153752Z` (2026-10-21 15:37:52Z), 20/20 steps ok, run-all exit 3 (gate FAIL before acceptances), git `c9fe9f5` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/05-walk-rewrite --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/06-page-rules`, then `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/05-walk-rewrite --run fidelity/results/run-all/06-page-rules --accept fidelity/results/run-all/06-page-rules/accepted.json --out fidelity/results/run-all/06-page-rules/gate` (exit 0) |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-06-page-rules-20261021T153752Z`. Probes (HTML, Chrome and vellora PDFs), WPT page-size checks, `accepted.json` and the scratch drivers: `~/.cache/vellora-fidelity/step06-page-rules-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/05-walk-rewrite` (previous link; `gate-report.{json,md}`) | **PASS** with 13 `acceptedRegressions` | improvement 37, accepted 13, reported 1, changed 10, gating 0, unchanged 15444 |
| `port/05-walk-rewrite` without acceptances (`attachments/gate-report-without-acceptances.*`) | FAIL | the same 13 items gate |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 533 gating (05: 533); improvement 1754 (05: 1727) |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 63 gating (05: 63); improvement 1326 (05: 1322) |

Values that moved (before → after, CONFIRMED, gate report):

| oracle | before → after |
|---|---|
| notification EXT-2 (the step's target) | the footer "Página 1 de 1" is drawn: margin-box runs absent 1 → 0 in all three extractors. pdfminer.six and PyMuPDF WARN → PASS. pdftotext stays WARN for its pre-existing reorder of the right-aligned "São Paulo, 22/06/2026" (the same 3 tokens at step 05) |
| receipt EXT-2 | WARN → **PASS**: pdftotext no longer reorders "Café Espresso Duplo". Only the footer changed in this PDF; HYPOTHESIS: the old 6.75 pt footer changed pdftotext's block order |
| boleto REF-W max / p95 mm | 4.64 / 2.58 → **2.62 / 2.36** (its max was the footer "1": dx −12.6 pt) |
| receipt REF-W max mm | 1.37 → **0.77** (its max was the footer "1": dy −3.8 pt) |
| notification REF-W max / p95 mm | 1.81 / 1.70 → 1.81 / 1.70. The footer "1" and the 9 body "de" are now scorable: consensus words 235 → 245 |
| pdf-probe words improved (all footer words) | invoice 12, text-stress-ptbr 8, receipt 6, boleto 3; e.g. boleto "1" \|dx\| 20.59 → 0.11 pt, receipt "Página" 11.23 → 0.11 pt |
| WPT pass / clean (8047 reftests) | 3665 / 3107 → 3664 / 3107 (45.54 % / 38.61 % → 45.53 % / 38.61 %). css-page 71 / 55 → 70 / 55; fail 97 → 88, unsupported 56 → 66. Transitions: 1 fail → clean (`page-size-006`, `:first { margin-top }`), 1 clean → fail (`page-size-015`, accepted), 1 flagged → fail (`page-name-001`, reported), 10 fail → unsupported (`css:page-varying-width`: `pseudo-first-margin-001…004`, `page-size-004/005/009`, `page-margin-007`, `layers-003/004`). No other suite changed |
| unchanged | every other corpus and oracle value: invoice REF-W 2.53 / 2.51 mm, notification LET-1 1.81 mm, LET-2/3, REF-P, TXT-B1, BOL-*, DANFE-*, INV-*. 14 of the 29 `vellora*.pdf` files are byte-identical to step 05's (`attachments/pdf-identity-vs-05-walk-rewrite.json`). The 15 that changed are the renders of the 5 documents with margin boxes (invoice, receipt, boleto, notification, text-stress-ptbr). Also unchanged: crashtests 239/239 ok, canaries 30/30 caught, DET-1/DET-2 PASS, code checks green |

Verdict totals: all PASS 139 → 140, FAIL 40, WARN 8 → 7, NOT-RUN 3; excluding diagnostic variants
117 → 118, 36, 7 → 6, 3. The new PASS is receipt EXT-2.

### Chrome probes (`attachments/chrome-probes-page-rules.json`)

72 probes, Chrome 155 through the shared reference print path, words from PyMuPDF character
origins. All CONFIRMED. Leaving out the 4 Chrome fallback-face probes (below), every paired word
of every probe is within 0.72 pt of Chrome horizontally and 0.35 pt vertically. The 0.72 pt is
the right-aligned body text of the `rtl` probe; margin-box words are within 0.60 pt.

- **Cascade** (body positions): later universal declarations override property by property;
  `:first` applies to page 1 only and beats a later universal rule; `:left`/`:right` alternate
  from a right first page, or from a left one for `<html dir="rtl">`; `:blank`, page names and
  invalid selectors never match; `@layer` order applies, and an unlayered rule beats a layered
  one; `!important` beats specificity; `@media print` applies and `@media screen` does not; a
  `:first` page may be taller (pages 841.92 vs 425.04 pt).
- **The same probes on the step-05 build**, for example: no footer for the notification pattern;
  `first_margin_top` page 1 at 38.1 pt (Chrome 123.0); `first_specificity` at x 45.35 pt (Chrome
  28.5), because the `:first` rule and its default 16 mm horizontal margins applied to every page.
- **Margin boxes**:
  - a 36-cell grid: 3 faces × 6 sizes (8–32 px) × 2 bottom margins (16, 30 mm);
  - `@top-center`;
  - asymmetric margins;
  - inheritance from the page context and the root;
  - `:first` content (`none`, another string) and a `:first` font size;
  - margin-box declarations (the text-stress-ptbr box).

  Chrome snaps the baseline to whole device pixels; vellora, like WeasyPrint, does not.
- **What Chrome inherits.** Font family, size and colour of the page context come from the root
  element (`html { 10px Liberation Sans rgb(200,0,0) }` → footer 7.5 pt `#c80000`). The root's
  `line-height` does not move the baseline (the line box is centred).
- **Chrome probe artefact.** Chrome loads an `@font-face` only when an element uses it. A face
  named only in a margin box prints in Chrome's system fallback (Times-Roman, Helvetica), or not
  at all (`declared_sans_8pt`). `probes2` repeats those probes with the faces used by body spans.
  The fixtures' Chrome references print their default-face footers in system Times-Roman.
  vellora uses Liberation Serif (the CSS initial `serif`), which has the same advances, so the
  footer words land within 0.1 pt.

### `acceptedRegressions` (13; per-item numbers in `attachments/accepted-evidence.json`)

Both labels fit GATE-A1's literal wording.

**`pdf-probe-pairing-artefact` (12):** text-stress-ptbr "de" #33, #61, #87, #115, #155 and #168,
dx and dy each. pdf-probe pairs the k-th "de" of vellora's PDF with the k-th of Chrome's.
- In each of these pairs, vellora's word is the FOOTER "de" of page 2–7, at (306.55, 813.58) pt.
  The Chrome word it is paired with is a BODY "de", at (104.13, 269–542) or (301.72, 81.70) pt.
  vellora prints 8 pages against Chrome's 7, and the extractor emits the footers at other
  occurrence positions.
- The change, \|dx\| +1.78 pt and \|dy\| +2.08 pt, is the footer moving to where Chrome prints it.
  Compared by position with Chrome's footer "de" on the same page, at (307.12, 812.51), \|dx\| went
  2.35 → 0.57 pt and \|dy(yMin)\| 1.02 → 1.07 pt. yMin carries each producer's declared ascent
  (step 04).
- The PyMuPDF baseline of the 8pt Liberation Sans footer is 819.75 pt in Chrome and 819.41 pt in
  vellora.
- The correctly paired page-1 "de" (#8) is among the improvements: \|dx\| 2.35 → 0.57.

**`wpt-false-pass` (1): `css/css-page/page-size-015-print.tentative.html`.**
- Chrome prints the test and the reference at 540 × 432 pt (7.5in × 6in, from the tentative
  `@page` `width`/`height` descriptors).
- Old vellora printed both at 360 × 216 pt, the 5in × 3in UA box: the comment in front of the
  test's `size: 1234px` hid the declaration, and the reference has no `size`. This was measured
  with the step-05 addon (sha256 `0211dcfb…`, the addon of run 20261021T142201Z) and the
  step-05 harness injection.
- Now the test honours `size: 1234px` (925.5 × 925.5 pt, CSS Paged Media 3). vellora does not
  implement the `width`/`height` descriptors.

**Reported, not gated: `css/css-page/page-name-001-print.html`** (flagged pass →
fail). It was flagged ink-missing: vellora's ink was 139 px against Chrome's 4453 px, because
Chrome draws the root's 5 px border and vellora does not.
- Chrome and old vellora print the test at 144 × 216 pt.
- Old vellora got that size because it applied the first rule, `@page a { size: 2in 3in }`, to
  every page whatever its name.
- Now page names never match, because vellora has no `page` property, and the test prints at
  the 360 × 216 pt UA size.

The `committed-canary` self-test asserts that `06-page-rules` FAILs against `05-walk-rewrite`
without acceptances (exactly the 13 accepted keys gate), PASSes with them, checks the label
counts, and checks the targets: notification EXT-2 per extractor, receipt EXT-2, boleto and
receipt REF-W max, and `page-size-006`.

## `07-media-print`: documents are styled for print media

Branch `phaseb/07-media-print` (from `phaseb/06-page-rules` `d8b86c6`), code commit `deb60b5`.

- **Before this step Blitz styled every document for `screen`.** vellora never set
  `DocumentConfig::media_type`, so `@media screen` rules cascaded and `@media print` rules did not:
  the opposite of Chrome's print path (the optional Chromium engine's `--print-to-pdf` and the
  fidelity references' `emulateMediaType("print")`).
- **`blitz_engine` builds every document with `media_type = print`**: body, margin boxes and the
  parse-only helpers. In Servo mode Stylo reads the media type only to evaluate media query
  lists, so this changes which `@media` rules cascade and nothing else. The layout dump reports
  `print` (`blitz_engine::DOCUMENT_MEDIA_TYPE`).
- **`break_css` reads the `break-*`/`page-break-*` rules of an `@media` block whose query matches
  print**, with `page_css`'s evaluator (media type only; a query with a feature does not match).
  Before, every `@media` block was skipped, so `@media print { .x { page-break-before: always } }`
  was lost.
- New Chrome 155-verified tests: `crates/vellora-core/tests/media_print.rs` (8). They cover:
  - `@media print`/`screen`, `not`/`only`/`all` and `display` toggles;
  - the page context inheriting the root's `@media print` styles;
  - `break-before`, `page-break-before` and `break-inside` inside `@media print`.

  Body text is within 0.31 pt of Chrome on both axes. On the step-06 build the same probes
  printed the screen variants and ignored the print breaks.
- Follow-ups, not changed here:
  - Blitz ignores the `media` attribute of `<style>` (empty `MediaList`).
  - Stylo evaluates media features against the `@page` content box, while Chrome uses its own
    print page.
  - `break_css` treats a query with a feature as not matching, while Stylo evaluates it.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T162148Z` (2026-10-21 16:21:48Z), 20/20 steps ok, git `deb60b5` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/06-page-rules --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/07-media-print`, then `node fidelity/gate/write-baseline.mjs --run fidelity/results/run-all/07-media-print --root fidelity/baselines/port --name 07-media-print --attach …` |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-07-media-print-20261021T162148Z` |
| written by | the orchestrator. The step agent hit the session limit after its gated run and before it wrote this baseline. The run, the commit and the gate verdict are the agent's, unchanged |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/06-page-rules` (previous link; `gate-report.{json,md}`) | **PASS**, no `acceptedRegressions` | gating 0, unchanged 15513 |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 533 gating (06: 533); improvement 1754 (06: 1754) |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 63 gating (06: 63); improvement 1326 (06: 1326) |

**Nothing measurable moved.** The corpus has three `@media` queries: `only screen and
(max-width: 500px)`, `only screen and (max-width: 600px)` (twice) and `(prefers-color-scheme: dark)`.
None of them changed a render, which the byte identity below proves; the WPT ratchet shows no
transition either. HYPOTHESIS for the screen rules: before this step the media type matched, but
the content boxes are wider than 600 px, so they did not apply then and do not apply now.
- All 38 `vellora*.pdf` files of the run (corpus, oracles and canaries; Chrome and WeasyPrint
  references excluded) are byte-identical to step 06's
  (`attachments/pdf-identity-vs-06-page-rules.json`).
- WPT pass / clean stays at 3664 / 3107 (45.53 % / 38.61 %), with no transitions.
- Verdict totals excluding diagnostic variants stay at PASS 118, FAIL 36, WARN 6, NOT-RUN 3.
- The step is kept for correctness against Chrome's print path, proven by `media_print.rs`. No
  oracle shows it.

The `committed-canary` self-test asserts that `07-media-print` PASSes against `06-page-rules`
with no acceptances and no changed item.

## `08-html-parse`: every document is parsed as HTML

Branch `phaseb/08-html-parse` (from `phaseb/07-media-print` `2c3a7bd`), code commit `14dc2b1`.

- **Before this step blitz-html chose the parser by sniffing the content.** blitz-html
  0.3.0-beta.4 `HtmlDocument::from_html` (`DocumentHtmlParser::parse_into_mutator`,
  `src/html_sink.rs` lines 91-99) used xml5ever when the input started with `<?xml`, when its
  first line was a DOCTYPE containing `XHTML`/`xhtml`, or when the root `<html>` declared
  `xmlns="http://www.w3.org/1999/xhtml"`. In XML `<br>` is not void, so the text after it became
  the `<br>`'s content and was never drawn. vellora's input is a `text/html` string
  (`renderPdf(html)`; `@vellora/engine-chromium` loads it from an `index.html` file and the
  fidelity references with `page.setContent`), and Chrome parses `text/html` with the HTML parser
  whatever the doctype.
- **`blitz_engine` now parses every document as HTML**: the body, the margin-box documents and
  the parse-only helpers (depth gate, denied-element walk). `parse_into` builds each
  `BaseDocument` with the same `DocumentConfig` and runs `html5ever::parse_document` with
  blitz-html's `DocumentHtmlParser` sink and blitz-html's HTML-branch `ParseOpts`, copied field
  by field (`html_parse_opts`). `HtmlDocument` cannot be built from a `BaseDocument` (private
  field, no constructor), so the module holds `BaseDocument` directly. The input string is not
  modified.
- **html5ever is pinned to `=0.40.1`**, the version blitz-html resolves (`Cargo.lock` has one
  html5ever). `parse_document(DocumentHtmlParser::new(..), ..)` only compiles while both crates
  link the same html5ever, because the sink implements blitz-html's `TreeSink`.
  `tests/html_parse.rs::html5ever_is_the_one_blitz_html_resolves` also checks `Cargo.lock`.
- **The XML parse stays reachable for fidelity tooling only.** `DocumentSyntax::Xml` is used by
  `vellora_core::debug_render_xhtml` (`#[doc(hidden)]`, next to `debug_layout_dump`), which the
  new `examples/xhtml_render.rs` runs for the WPT harness (below). `renderPdf`, `@vellora/native`
  and the CLI cannot reach it.
- New tests:
  - `crates/vellora-core/tests/html_parse.rs` (7). They cover text after `<br>` under six document
    starts at Chrome's positions, the public `render`, the image-only line (no-quirks match and
    the quirks known gap), the raw postmark template, the fidelity XML path, and the html5ever pin.
  - `blitz_engine.rs` unit tests (3): DOM identity with the step-07 parser for HTML-sniffed
    input, `<br>` void under the HTML parse, and html5ever's document mode against Blitz's.
  - `lib.rs` unit tests (2): byte-identical PDFs to the step-07 parser for HTML-sniffed input,
    and the postmark loss reproduced with the step-07 parser.

    The step-07 parser is kept as a `#[cfg(test)]` `DocumentSyntax::BlitzSniffed`.
  - `fidelity/wpt/test/xhtml-bridge.test.mjs` (7).

  On the step-07 parser (a temporary env toggle in a scratch build, reverted before the commit)
  4 of the 7 `html_parse.rs` tests fail. The two image-line tests and the Cargo.lock test pass on
  both.

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T191737Z` (2026-10-21 19:17:37Z), 20/20 steps ok, run-all exit 0 (gate PASS), git `14dc2b1` 0 dirty |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/07-media-print --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/08-html-parse` |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz-dom/blitz-html 0.3.0-beta.4, html5ever 0.40.1, xml5ever 0.40.0; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-08-html-parse-20261021T191737Z`. The two WPT measurement runs, the census, the probes (HTML, Chrome and vellora PDFs, `dom.json`) and the scratch drivers: `~/.cache/vellora-fidelity/step08-html-parse-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/07-media-print` (previous link; `gate-report.{json,md}`) | **PASS**, `acceptedRegressions: []` | improvement 9, changed 1, gating 0, unchanged 15504 |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 524 gating (07: 533): exactly the 9 postmark rows are gone, nothing new |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 56 gating (07: 63): 7 postmark rows gone, nothing new |
| `port/04-block-offset` (post-hoc, extra: `attachments/gate-report-vs-04-block-offset.*`) | FAIL | 21 gating: step 05's 9 accepted WPT items and step 06's 12 accepted pdf-probe items. **No postmark item differs from step 04** |

Values that moved (before → after, CONFIRMED, gate report):

| oracle (oss-postmark-receipt) | 07 → 08 | step 04 |
|---|---|---|
| INV-X1 status / found | FAIL 5/6 → **PASS 6/6** | PASS 6/6 |
| INV-X2 found pdftotext / pypdf / pdfminer | 5 / 5 / 5 → **6 / 6 / 6** (PASS) | 6 / 6 / 6 |
| EXT-2 missing pdftotext / pdfminer.six / PyMuPDF | 39 / 11 / 41 → **38 / 2 / 40** | 38 / 2 / 40 |
| pdf-probe pairs (`changed`, reported) | 136 → 137 aligned: 133 pairs identical, "The [Product Name] team" (4) pairs again, "Download as PDF" (3) no longer pairs (below) | 137 |
| REF-P / REF-W / INV-R1 | unchanged: 1 page vs Chrome 2 (WeasyPrint 2) / NOT-RUN / 10.26 mm | the same |

Verdict totals: all PASS 140 → 142, FAIL 40 → 38, WARN 7, NOT-RUN 3; excluding diagnostic
variants 118 → 120, 36 → 34, 6, 3. The two new PASSes are postmark INV-X1 and INV-X2.

### What did not move, and the postmark tail

- **PDF bytes** (`attachments/pdf-identity-vs-07-media-print.json`): 44 of the 47 vellora PDFs
  are byte-identical to step 07's. They cover the corpus, the oracles including canaries, and
  layout-diff. The 3 that differ are postmark's plain, PDF/A-2b and layout-diff renders, and all
  3 are **byte-identical to step 04's** (`postmarkVsStep04`, sha256 `7ee04b03…` for the plain
  render). Every `<!DOCTYPE html>` document therefore renders exactly as before. The `lib.rs`
  unit test proves the same per document against the step-07 parser.
- WPT pass / clean stays at 3664 / 3107 (45.53 % / 38.61 %) with no transitions. Also unchanged:
  crashtests 239/239 ok, canaries 30/30 caught, DET-1/DET-2 PASS, code checks green.
- **REF-W stays NOT-RUN for a reference-side reason.** Chrome and WeasyPrint never agree on a
  word's y within 2 pt for this template: 0 of 114 matched words, while 76 agree on x. So REF-W
  has no consensus word to score.
- **REF-P stays 1 vs 2, and the tail is drawn below the page edge.** This is a pre-existing
  pagination defect, unchanged since step 04.
  - The template body is one layout table, 1518 px tall. vellora's paginator places it whole on
    page 1 (layout dump pagination trace: one `oversize-block`, bottom 1518 px), where Chrome
    breaks it onto page 2.
  - pdfminer.six reads the tail where vellora draws it (`Suite 1234` at 1103.65 pt on an
    841.92 pt page). pdftotext and PyMuPDF clip it: those are their 38 / 40 missing tokens, from
    "Download as PDF" to "Suite 1234".
  - Against step 07, "Download as PDF" (3 tokens) moves from top 826.62 pt (inside the bottom
    margin band, visible) to 846.12 pt (below the page edge). The restored line "The [Product
    Name] team" sits above it. This is where step 04 drew it too.
  - The text is in the PDF and was not lost by this step. It is not visible either, as at step 04.
    Follow-up: fragment an oversize layout table across pages.

### WPT `.xht` nodes (`attachments/xht-parse-measurement.json`)

WPT serves `.xht`/`.xhtml`/`.xml` as `application/xhtml+xml` (`fidelity/wpt/lib/chrome.mjs`), so
Chrome parses them as XML. The 8047 reftests have 10906 distinct nodes (tests and references,
prepared HTML):

- 5000 `.html` nodes, none of which blitz-html's sniff sent to XML at step 07;
- 5906 `.xht` nodes: 5756 sniffed as XML by their XHTML doctype, 134 by an `<?xml` prolog and
  9 by a leading `<html xmlns>`. The other 7 start with `<!DOCTYPE html>` and were parsed as
  HTML at step 07.

5746 tests have a node that was parsed as XML at step 07.

- **(b) every node through the product's HTML parse** (measured on the step-08 core with the
  step-07 harness, `--xhtml-parser html` today):
  - 1518 pass → fail (1474 clean, 44 flagged), 175 fail → pass, 2 pass-blank → fail;
  - pass 3664 → 2321.
  - Every one of the 1695 changed tests has a node parsed as XML at step 07, and an `.xht` node
    with a CDATA section (`xhtmlHazards`; 6 of them also have a self-closing non-void
    element). In a `<style>`, the HTML parse hands the CSS parser `<![CDATA[`, whose `[` opens a
    simple block that runs to the matching `]`. The rules wrapped in it are dropped (CONFIRMED on
    a probe: an `.xht`-style sheet of `body`, `.a`, `.b` rules lost all three under the HTML parse
    and applied all three under the XML parse). That measures the HTML parser on input Chrome
    never parses as HTML.
- **(a) XML parse for the XML-served nodes**, chosen: 0 transitions, 8047 unchanged (also in the
  gated run).
  - The only nodes whose parser differs from step 07 are the 7 sniff misses, now XML as in
    Chrome. Their 5 tests keep their outcome (`left`/`right-offset-position-fixed-001` pass,
    `abspos-inline-008` and `table-vertical-align-baseline-008/009` fail; Chrome passes all 5).
  - The two table tests' differing pixels go from 10000 to 68400 and 41700. HYPOTHESIS: Blitz
    lays out the XML DOM's `table>tr` (no implied `tbody`) differently.
- **How (a) is wired.** `fidelity/wpt/lib/vellora-render.mjs` passes
  `_bridge: lib/xhtml-bridge.mjs` to the usual `renderPdf(..., { strict: true, fonts, images,
  baseUrl })` call for an XML-served node. So templating, the strict orchestration and the
  diagnostic mapping are the product's.
  - The bridge spawns one `xhtml_render` process per render. That example binary reads a
    `VXR1` record stream on stdin and runs `debug_render_xhtml` on an 8 MiB-stack thread (the
    libuv stack of the napi binding).
  - It returns the PDF, or the napi binding's error fields (`feature/line/col/hint`,
    `profile/errors`, or the panic message).
  - It re-raises a fatal signal in the worker (crash parity), and exits when orphaned.
  - `wpt/run.mjs` builds the binary in the measured checkout (`--xhtml-render <bin>` overrides
    it) and records `config.xmlServedNodes`.
- **`HARNESS_SEMANTICS` stays 2.** It versions the verdict rules for a given rendering
  (`lib/provenance.mjs`). This change alters vellora's renderings of 7 nodes and the Chrome side
  is untouched, so `--chrome-from` reuse stays valid. `xmlServedNodes` is not part of
  `comparisonConfig`.
- Crashtests (239) are all `.html`; `crash-worker.mjs` does not use the bridge.

### Document mode (finding; Chrome probes, `attachments/chrome-probes-html-parse.json`)

- **html5ever picks Chrome's mode** (unit test `html5ever_picks_chromes_document_mode_and_blitz_ignores_it`):
  - no-quirks for `<!DOCTYPE html>` and XHTML 1.0 Strict;
  - limited-quirks for XHTML 1.0 Transitional;
  - quirks with no doctype (`<html xmlns>` alone, or an `<?xml` prolog alone).

  Chrome 155's `document.compatMode` is CSS1Compat for the first three and BackCompat for the
  last two. It is the same after `page.setContent` and after a `file://` load.
- **Blitz ignores the mode.** blitz-html's sink stores it in `DocumentHtmlParser::quirks_mode`
  (`html_sink.rs` line 296), and nothing reads it. blitz-dom builds its Stylist with
  `QuirksMode::NoQuirks` (`document.rs` line 444) and returns `NoQuirks` from
  `TDocument::quirks_mode` (`stylo.rs` line 249).
- **Measured gap: an image-only line** (20 px image, `line-height: 20px`).
  - Chrome's line box is 25 px in no-quirks mode and 20 px in limited-quirks and quirks mode (the
    Quirks Mode Standard's line height calculation quirk).
  - "After" sits at 102.00 pt and 98.25 pt respectively.
  - vellora prints 101.69 pt in every mode: 3.44 pt below Chrome in the limited-quirks and quirks
    documents. `html_parse.rs::image_only_line_ignores_the_quirks_line_height_rule_known_gap`
    pins today's value.
  - Not fixable in `blitz_engine.rs`: Blitz exposes no quirks mode. The postmark template has no
    `<img>`.
- **Text probes.** In the 6 `br_*` probes (all six document starts), vellora draws all 14 of
  Chrome's words within 0.31 pt on both axes. Chrome snaps the 20 mm margin to device pixels.
  The step-07 parser drew 7 of 14 in the 5 XML-sniffed starts: "The Product team", "Suite
  1234" and "Tail line" were lost, and the second paragraph moved up 15.31 pt.

### Other changes

- **layout-diff allowlist**: the two oss-postmark-receipt entries
  (`source_dom_keys_vs_chromium`, `dom_key_alignment`) expired as their expiry condition said
  ("when vellora parses text/html input as HTML regardless of an XHTML doctype"). They are
  removed, and `expected-check-failures.json` is now empty. The frozen Phase A copy is unchanged.
- `fidelity/wpt/README.md`: pipeline step 3 describes the XML-served nodes. The known-gap bullet
  that said vellora parsed `.xht` as HTML is corrected: it was wrong before this step too. A
  document-mode gap is added.
- `COMPATIBILITY.md` has no row about parsing (it is generated from `validation.rs`'s
  denylists), so it is unchanged.

### Retires step 05's 9 postmark acceptances

Step 05 accepted 9 oss-postmark-receipt rows as `html-normalize-compensation`. They are INV-X1
status and found, INV-X2 status and found per extractor, and EXT-2 missing per extractor. The
orchestrator rejected that acceptance as real text loss. This step retires them: all 9 are back
at their step-04 values without any `acceptedRegressions` entry. The 3 WPT float tests of the
same label stay as step 05 recorded them (a Blitz float defect, unrelated to parsing).

Follow-ups (not changed here):

- fragment an oversize layout table across pages (postmark REF-P 1 vs 2, its clipped tail);
- quirks and limited-quirks mode in Blitz (upstream);
- a COMPATIBILITY row on HTML parsing and the no-quirks gap (via `scripts/gen-compatibility.mjs`);
- the XML-DOM table layout of `table-vertical-align-baseline-008/009`;
- vellora's own source scanners (`page_css`, presumably `break_css` too) do not unwrap a CDATA
  section. Under the XML parse an author `@page { margin: 0 }` inside `<![CDATA[ … ]]>` is not
  applied, while the element rules of the same sheet are (CONFIRMED on the probe above: `.a` at
  x 120.35 pt, i.e. the default 16 mm page margin + 75 pt, against 75.00 pt without the CDATA
  markers; `scratch/cdata-check.mjs` in the evidence directory). This was the case at step 07 too,
  and it affects only XML-served WPT nodes.

The `committed-canary` self-test asserts that `08-html-parse` PASSes against `07-media-print`
with no acceptances, and that its only non-unchanged items are the 9 postmark improvements
(values above) and the pdf-probe pairing change. It also asserts that no WPT item moves and that
no postmark item differs from `04-block-offset`.

## `09-review-fixes`: the Phase B review findings on steps 07-08

Branch `phaseb/09-review-fixes` (from `phaseb/08-html-parse` `f9476ea`). Six fixes, one commit
each, then the baseline (`a3f7c90`); the gated run was taken at the last fix commit `6176d39`.

| commit | fix |
|---|---|
| `5d1f4af` | 1. No recursion or quadratic scan on user input before the depth gate (review BLOCKER) |
| `7e3eaff` | 2. Margins kept after a forced break collapse with their signs (CSS 2.2 §8.3.1) |
| `01c4e86` | 3. `break-*` rules inside `@media` follow Stylo's media evaluation |
| `717d17d` | 4. Inline padding compensation on the physical side (`text_align_right` deleted) |
| `ad3a08e` | 5. Forced-break fragments and the fit allowance stay off the bottom band |
| `6176d39` | 6. Tests assert visibility where text is visible; two off-page gaps pinned |

| field | value (CONFIRMED, `manifest.json`) |
|---|---|
| run | `20261021T205223Z` (2026-10-21 20:52:23Z), 20/20 steps ok, run-all exit 0 (gate PASS), git `6176d39` 0 dirty, addon sha256 `33ac35a7…` |
| command | `node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/08-html-parse --chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json --tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/09-review-fixes` |
| env | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro; node v22.23.2; rustc 1.96.0; Chrome 155.0.8059.85 (local, INDICATIVE); blitz 0.3.0-beta.4; tools image `vellora-fidelity-tools:baseline-beta4` `sha256:6b648b83…`; WPT `9d8aceec…` |
| run copy | `~/.cache/vellora-fidelity/run-all-09-review-fixes-20261021T205223Z`. Probe HTML, Chrome and vellora PDFs, the per-commit addons and the scratch drivers (`probe-deep.mjs`, `probe_words.py`): `~/.cache/vellora-fidelity/step09-review-fixes-evidence-20261021` |

### Gate results

| gated against | verdict | counts |
|---|---|---|
| `port/08-html-parse` (previous link; `gate-report.{json,md}`) | **PASS**, `acceptedRegressions: []` | gating 0, unchanged 15521, no improvement, no change |
| `beta4` (post-hoc, `attachments/gate-report-vs-beta4.*`) | FAIL | 524 gating, the same items as step 08's report (the two reports differ only in their header) |
| `pin` (post-hoc, `attachments/gate-report-vs-pin.*`) | FAIL (known beta.4 losses) | 56 gating, the same items as step 08's report |

- **PDF bytes** (`attachments/pdf-identity-vs-08-html-parse.json`): all 47 vellora PDFs (corpus,
  oracles including canaries, layout-diff) are byte-identical to step 08's.
- WPT pass / clean 3664 / 3107 (45.53 % / 38.61 %), no transition; crashtests 239/239 ok;
  canaries 30/30 caught; verdicts PASS 142, FAIL 38, WARN 7, NOT-RUN 3 (as step 08); code checks
  (cargo test, vitest, lint, fidelity test) green.
- Why nothing moved (inferred from the byte identity, not checked input by input): no corpus document or WPT reftest has a negative margin collapsing across a
  forced break, a `break-*` rule inside a feature media query, an RTL line with a padded inline,
  a fragment that does not fit under its kept forced-break margin, or nesting deep enough to
  reach the old recursion. The corpus footers sit in 16-18 mm bottom margins, so fix 5's
  allowance cap does not bind there (HYPOTHESIS from the margin sizes, consistent with the PDF
  identity). The fixes are covered by the Chrome-probed tests below.

### Chrome probes (`attachments/chrome-probes-review-fixes.json`)

Chrome 155.0.8059.85, local macOS, INDICATIVE, 2026-10-21, through the shared reference print path
(`fidelity/lib/chrome-reference.mjs`); words read with PyMuPDF (pen x and baseline in PDF pt,
top-left origin; PyMuPDF does not report text whose origin is outside the page). vellora through
the napi addon built at f9476ea (step 08) and at the commit of each fix. 37 probes.

**Fix 1** (`attachments/deep-input-timings.json`; one child process per render, release addons,
same env). The sheet walk of `page_css` (it runs in `validate_css`, before the SEC-1 depth gate)
recursed into each matching `@media` and each `@layer` block and re-scanned it. It is now one pass
with an explicit frame stack. The audit of the other pre-gate scanners fixed
`strip_css_comments_and_strings` (escaped quotes), `split_block`, `break_css::top_level_rules`,
and the depth gate's own parse. That parse stops once an element is inserted deeper than 512,
Blink's `kMaximumHTMLParserDOMTreeDepth`: html5ever's scope checks are O(depth) per start tag.

| input | step 08 | step 09 |
|---|---|---|
| nested `@media all {` x5 000 / x10 000 | 499 / 1680 ms | 11 / 10 ms |
| nested `@media all {` x20 000 / x200 000 | **SIGILL** (Node process killed) | 16 / 160 ms, PDF |
| nested `@layer a {` x20 000 / x200 000 | **SIGILL** | 15 / 130 ms, PDF |
| nested anonymous `@layer {` x200 000 | **SIGILL** | 99 ms, PDF |
| `@supports` / `@container` / `@document` / CSS nesting x200 000 | 112 / 129 / 58 / 59 ms | 113 / 125 / 55 / 59 ms |
| `@page` nested x200 000 | 23 ms | 24 ms |
| unterminated `"` + `\"` x25 000 / x50 000 in `style=` | 445 / 1483 ms | 2 / 2 ms (x200 000: 5 ms) |
| nested `<div>` x25 000 / x50 000 | 1589 / 7070 ms, `max-nesting-depth` | 3 / 2 ms, `max-nesting-depth` (x200 000: 3 ms) |
| nested `<span>` x200 000 | 55 ms, `max-nesting-depth` | 2 ms, `max-nesting-depth` |
| 20 000 / 40 000 flat `@layer` blocks | 349 / 1953 ms | 17 / 46 ms |
| 20 000 / 40 000 margin-box names in `@page` | 827 / 4127 ms | 16 / 31 ms |
| 50 000 / 100 000-space prelude + `;` (break_css) | 1612 / 5061 ms | 3 / 3 ms |

Tests: `tests/deep_input.rs` (each at-rule kind and five element nests at depth 200 000 on a
256 KiB stack, linear growth 50k vs 200k, the full render on the 8 MiB napi stack);
`packages/native/test/deep-input.test.ts` (real addon in a child process: a PDF or a located
`VelloraUnsupportedError`, never a signal). Differential tests keep the old walk and the old
string stripper under `#[cfg(test)]` and check identical output on generated inputs.
`CLAUDE.md` now says what `validate_css` and the depth gate run, plus an invariant bullet.

**Fix 2.** 300 x 300 px page; baseline of "Two" on page 2 in pt (Chrome / step 08 / now):

| probe | margins in the chain | Chrome | step 08 | now |
|---|---|---|---|---|
| `m_posneg` (the review's probe) | section 25 px, p -10 px | 37.50 | 45.00 | 37.50 |
| `m_pospos` | 25, 10 | 45.00 | 45.00 | 45.00 |
| `m_allneg` | -10, -5 | 18.75 | 26.25 | 18.75 |
| `m_chain` | 30, -20, 15, -4 | 33.75 | 48.75 | 33.75 |
| `m_negroot_pos_child` | -12, 40 | 47.25 | 56.25 | 47.25 |
| `m_dropped` | empty 40 / -15, next 5 | 45.00 | 56.25 | 45.00 |
| `m_dropped_neg` | empty -6 / 30, next -20 | 33.75 | 48.75 | 33.75 |
| `m_wrapper` | flattened wrapper 30, child -18 | 35.25 | 48.75 | 35.25 |

Every probe matches Chrome to 0.00 pt. `tests/pagination_gaps.rs`.

**Fix 3.** A4, 10 mm. `break_css` returns each rule with its chain of `@media` preludes, and
`blitz_engine::media_query_matches` evaluates them with Stylo's `MediaList::parse`/`evaluate` on
the device that styled the document.

- `print and (min-width: 1px)`, nested `print { (min-width: 10px) }`, `(orientation: portrait)`,
  `(min-width: 600px)`: Chrome 2 pages, step 08 1 page, now 2 pages; "SecondPage" at (28.35,
  39.60) on page 2 vs Chrome (28.50, 39.75).
- `(max-width: 1px)`, nested `(max-width: 10px)`, `not print and (min-width: 1px)`, a feature
  query around `break-inside: avoid`: 1 page in Chrome, step 08 and now.
- Residuals, pinned in `tests/media_print.rs`:
  - `f3_width_750`: Chrome 2 pages, vellora 1 page. Stylo's viewport is the 718 px content box,
    so the style rule is off too (pre-existing, now consistent between styles and breaks).
  - `f3_page_in_feature`: KNOWN GAP. `@page { margin-top: 40mm }` inside `@media print and
    (min-width: 1px)`: Chrome "First" at 124.50 pt, vellora 39.60 pt. `page_css` keeps the
    media-type-only reader for `@page`, because Stylo measures features against the viewport
    the `@page` box decides (circular).

**Fix 4.** "Aaa <span>Bbb</span> Ccc" in a 400 px div, span padding-right 20 px and padding-left
7 px; word x in pt (Chrome / step 08 / now):

| probe | Chrome | step 08 | now |
|---|---|---|---|
| `r_rtl_start` | 244.27 271.84 309.84 | 264.37 286.69 324.69 | 249.37 271.69 309.69 |
| `r_rtl_end` | 28.50 56.07 94.08 | 13.35 35.66 73.67 | 28.35 50.66 88.67 |
| `r_rtl_root_start` | 487.79 510.12 548.12 | 502.12 524.44 562.44 | 487.12 509.44 547.44 |

`r_rtl_right`, `r_rtl_left`, `r_ltr_end`, `r_ltr_start`: unchanged (keyword path). The
remaining 5.1-5.4 pt on "Aaa" of `r_rtl_start` and on "Bbb"/"Ccc" of `r_rtl_end` is a
pre-existing gap that the ltr rows share: a span's padding-left does not move the runs (pinned in
`tests/text_probes.rs`).

**Fix 5.** 300 x 300 px page, 20 px margins. On a page opened by a forced break the kept margin
is truncated to the room the fragment leaves (`min(margin, fit_limit - header_h - fit_h)`). The
DESIGN TARGET overflow allowance (up to 12 px) is also capped by the free space above a drawn
`@bottom-center` line. These are intended divergences from Chrome, which instead leaves a blank
page and moves monolithic content on, or fragments the box:

| probe | Chrome | step 08 | now |
|---|---|---|---|
| `f5_line_big_margin` (line under a 250 px margin) | 3 pages, "Two" top of page 3 | page 2, baseline 213.75 pt (line box 10 px into the bottom band) | page 2, baseline 206.25 pt (inside the content box) |
| `f5_img_partial` (240 px image under 40 px) | 3 pages, image on page 3 | image 40-280 px on page 2 | image 20-260 px on page 2 |
| `f5_table_partial` (table, margin 120 px) | 3 pages, margin 120 kept, rows split to page 3 | 2 pages, T01 at 116.25 pt, last row 260-280 px | 2 pages, margin 100 px, T01 at 101.25 pt, last row 240-260 px |
| `f5_allowance_footer` (11 px overflow, 16 px footer in a 20 px band) | 2 pages | 1 page, box 6 px into the footer line | 2 pages, "Tail" on page 2 |
| `f5_allowance_nofooter` (same, no footer) | 2 pages | 1 page | 1 page (allowance kept, DESIGN TARGET) |

`f5_ref`, `f5_box_partial`, `f5_lines_partial`: unchanged. `tests/pagination_gaps.rs`.

**Fix 6.** `lib.rs` `…_html_parse_emits_it` and `tests/html_parse.rs`
`postmark_receipt_emits_the_text_after_each_br` were named "draws" but only checked that the runs
exist. They now assert that "The [Product Name] team" and all three "[Product Name]" runs have
their origin inside the page box (and, in `lib.rs`, that the two tail lines do not). Two KNOWN
GAPS are pinned, so a future fragmentation fix must update them:

- `g_postmark_raw`, `html_parse.rs::postmark_receipt_draws_its_layout_table_tail_off_page_known_gap`:
  the raw template's oversize layout table is placed whole on page 1. "1234 Street Rd." and
  "Suite 1234" are emitted at baselines 1038.60 / 1054.35 pt, below the 841.92 pt page edge.
  Chrome: 2 pages (161 words, 124 + 37), the two lines on page 2 at 225.75 / 241.50 pt. vellora:
  1 page, 121 words visible.
- `g_inline_body`, `pagination_gaps.rs::an_inline_only_body_draws_its_lines_past_page_1_off_page_known_gap`:
  120 `<br>`-separated lines in an inline-only body are one fragment. All 120 runs are emitted on
  1 page, and Line055-Line120 (66) sit below the page edge. Chrome: 3 pages, lines 1-52 / 53-104 /
  105-120. With `<p>`s (`g_p_body`) vellora prints Chrome's 3 pages (asserted).

Follow-ups (not changed here): fragment an oversize block or layout table and an inline-only
line box across pages (the two pinned gaps); evaluate `@page` inside feature media queries
(needs the page box before Stylo's viewport); a span's `padding-left` on its runs; Chrome's
blank-page placement of monolithic content under a forced-break margin.

## pdf-probe v2 re-score (2026-10-21, branch `phaseb/oracle-v2`)

GATE-P1 now measures pdf-probe semantics 2 (`fidelity/layout-diff/README.md`, "pdf-probe v2"):
PyMuPDF baselines instead of pdftotext bbox tops (D1), position pairs keyed by the Chrome word
instead of k-th occurrence pairs (D2), and unpaired words recorded and gated (D3). Every committed
link was re-scored OFFLINE from the PDFs of the run it was written from; no other value of any
baseline changed (CONFIRMED: every manifest equals its previous version except `files` and the new
`pdfProbeRescore` block).

**Where the sections live (decision).**

- `pdf-probe/<fixture>.json` is the v2 section, the one the gate compares and the writer writes
  for new runs.
- The v1 files a link was gated with moved byte for byte to `attachments/pdf-probe-v1/` (same
  sha256; only the `manifest.files` keys were renamed). Moving keeps one meaning for the gated
  location (current semantics) in the writer, the loader and the gate, while the history stays
  verifiable: `loadBaselineDir(dir, { pdfProbe: "v1" })` reads it, and
  `committed-canary.test.mjs` reproduces every historical verdict (150 / 40 / 2587 / 18 / 13
  accepted keys) on it.
- Phase A `beta4` keeps its v1 in `layout-diff-ab/` (unchanged). `pin` had no pdf-probe section.
- `acceptedRegressions` are unchanged. Their pdf-probe keys are v1 keys and match no v2 item; the
  debt ledger supersedes them.

**Gate rules of v2 beyond "|dx|, |dy| may not grow" (DESIGN TARGET; the orchestrator may reverse any).**

- A Chrome word that loses its vellora partner gates twice: its `…|pairing` item and the fixture's
  `unpaired-chrome` count.
- `unpaired-vellora` (words Chrome does not print where vellora does) gates too. At step 05 it
  fires on postmark's newly drawn "Download as PDF" (0 → 3), which may be progress: no Chrome word
  lies within 36 pt of it.
- A fixture the baseline measured and the run lacks is `removed` (gates); v1 ignored it.
- The text key is case-sensitive (v1 lower-cased): a text-transform difference makes the words
  unpaired instead of measured.
- Near the bound: step 04's postmark "The [Product Name] team" paired at dy 35.1 pt, 0.9 pt inside
  the 36 pt bound; a small worsening of such a word reads as a lost pairing.
- `withinTolerance` counts every sub-tolerance change of a v2 pair (v1 counted none, D4).

**How (per link, recorded in `manifest.json pdfProbeRescore`).**
`node fidelity/gate/rescore-pdf-probe.mjs --baseline fidelity/baselines/<link> --run
~/.cache/vellora-fidelity/<run copy>`, 2026-10-21 ~20:10Z, darwin 27.0.0 arm64, Node v22.23.2,
Python 3.12.13, PyMuPDF 1.28.2 (local, INDICATIVE). Before writing, the script checks (all CONFIRMED):

- the run copy's `summary.json` sha256 equals the manifest's source (11/11 links);
- the run's own v1 `pdf-probe.json`, re-compacted, equals the committed v1 section for every
  fixture (10 links; pin had none), so these are the PDFs the link measured;
- integrity before and after, and (gate schema) no file outside `manifest.files`.

After the re-score, a fresh `layout-diff/run.mjs` + `pdf-probe.mjs` run of this branch (the step-07
crates, a new render and a new Chrome 155 print) reproduced all 9 committed `07-media-print` v2
sections exactly (compacted JSON equal; CONFIRMED 2026-10-21), so the next link's pdf-probe gate
compares like with like.

**Missing inputs (CONFIRMED).**

- `pin`: its run kept the PDFs of invoice and notification only; boleto, boleto-febraban, danfe,
  oss-postmark-receipt, oss-sparksuite-invoice, receipt and text-stress-ptbr are recorded as
  missing. pin's v2 section covered the 2 fixtures. **Since 2026-10-22 (`phaseb/10-pin`, merged
  on `phaseb/10-integrate`) it covers all 9**: the 7 missing pairs come from an `--inputs`
  mapping (vellora re-rendered by the pin source's `layout_dump`, the chain's Chrome PDFs;
  `manifest.pdfProbeRescore.inputMap`), see "Integration" below.
- `beta4`: its v1 section came from a Phase A A/B probe whose PDFs no run copy kept
  (`run-all-beta4-20261021T054809Z/layout-diff/*/run-all/` has no PDFs). The PDFs of the
  `beta4-gated` run stand in, for beta4's 4 fixtures only, recorded as `source.substitute` with the
  evidence: every v1 pair of that run equals beta4's A/B probe (boleto 254, invoice 541,
  notification 244, receipt 151 pairs, 0 differing) and `beta4-gated/README.md` records
  byte-identical corpus PDFs. Without the stand-in, every comparison against beta4 would be refused.

**v2 gate of the chain** (`fidelity/layout-diff/snapshots/2026-10-21/pdf-probe-v2/rescore-report.json`,
`node fidelity/gate/pdf-probe-rescore-report.mjs`; gating = gating pdf-probe items, each link's
own v1-era acceptances applied, which match no v2 key):

| link | vs previous link: gating (per fixture) | v1 pdf-probe items accepted then | vs 00-start: gating |
|---|---|---|---|
| beta4 vs pin | 619 (invoice 394, notification 225) | — (pin had no pdf-probe) | — |
| beta4-gated vs beta4 | 0 (5 fixtures not comparable) | — | — |
| 00-start vs beta4-gated | 0, no item at all (identical PDFs) | 0 | 0 |
| 01-pagination-gaps | 55 (danfe 41 dy, sparksuite 14 dy); 749 improvements, 153 boleto-febraban words newly paired | 117 | 55 |
| 02-delete-noop-passes | 0, no item at all (identical PDFs) | 0 | 55 |
| 03-table-passes | 84 (danfe 36, text-stress-ptbr 48 incl. 16 lost pairings); 653 newly paired | 40 | 134 |
| 04-block-offset | 1403 (danfe 442, text-stress-ptbr 314, boleto 231, postmark 138, boleto-febraban 109, notification 90, receipt 44, sparksuite 35); 1401 improvements | 2569 | 946 |
| 05-walk-rewrite | 6: postmark "The [Product Name] team" lost (4 pairings), unpaired-chrome 42 → 46, unpaired-vellora 0 → 3 | 0 (v1: a non-gating "changed") | 922 |
| 06-page-rules | 0; 81 improvements | 12 | 922 |
| 07-media-print | 0, no item at all (identical PDFs) | 0 | 922 (danfe 295, boleto 231, postmark 140, text-stress-ptbr 122, notification 77, boleto-febraban 39, sparksuite 18) |
| 08-html-parse (re-scored 2026-10-22) | 0; postmark "The [Product Name] team" pairs again (4 newly measured), unpaired-chrome 46 → 42, unpaired-vellora 3 → 0 (see below) | 0 | 920 (postmark 138, others as 07) |
| 09-review-fixes (re-scored 2026-10-22) | 0, no item at all (identical PDFs) | 0 | 920 (as 08) |

**08 and 09 (2026-10-22, branch `phaseb/10-base`).** Both links were written after the re-score
above, with v1 sections, and were re-scored the same way: `node fidelity/gate/rescore-pdf-probe.mjs
--baseline fidelity/baselines/port/<link> --run ~/.cache/vellora-fidelity/<run copy>` with
`run-all-08-html-parse-20261021T191737Z` and `run-all-09-review-fixes-20261021T205223Z`
(darwin 27.0.0 arm64, Node v22.23.2, Python 3.12.13, PyMuPDF 1.28.2; INDICATIVE). CONFIRMED for
both: summary.json sha256 equals the manifest source; the run's v1 probe equals the committed v1
section for all 9 fixtures; the 9 v1 files are byte-identical in `attachments/pdf-probe-v1/`; the
manifest differs from its previous version only in `files` and `pdfProbeRescore`; integrity ok.
The table rows come from `node fidelity/gate/pdf-probe-rescore-report.mjs --out
fidelity/layout-diff/snapshots/2026-10-22/pdf-probe-v2/rescore-report.json` (its CHAIN now ends at
09; the gating counts of 00..07 equal the 2026-10-21 report, only the within-tolerance
bookkeeping added since by D4 differs). Caveat on 08: unpaired-vellora 3 → 0 reads as an
improvement, but postmark's 3 "Download as PDF" words are not gone; they now lie below the page
edge of vellora's single page, where the v2 word list does not see them. An off-page word is
not gated yet (INTEGRATION-TODO item 2).

**Regenerated under the 10-gate rules (2026-10-22, branch `phaseb/10-integrate`).** The same
command now writes the 2026-10-22 report with the merged rules (I1 sign-crossing, the off-page
rule) and the complete pin (9 v2 fixtures, `--inputs` mapping; see "Integration" below), so the
table above is the record of the pre-10-gate rules. Gating per link vs the previous link: beta4
vs pin 619 → 964 (the pin's 7 added fixtures: boleto and receipt measured, 5 `removed fixture`
items because beta4 has 4 fixtures), 01 55 → 168, 03 84 → 230, 04 1403 → 1632, 05 6, 08 0 → 7
(the 7 newly off-page postmark words, see "Gate fixes"), the others 0; vs 00-start: 01/02 168,
03 392, 04 1368, 05…07 1344, 08/09 1342. 168 / 230 / 1632 are the I1 re-judge that
`committed-canary.test.mjs` asserts. The `accepted` section is unchanged. The generator's
section identity check now leaves out the committed `offPage` record (as backfill-off-page.mjs
does); before, it refused every backfilled link.

**The v1-accepted pdf-probe words under v2.** Each v1 key is mapped to the vellora word it named
(the run copy's v1 `pdf-probe.json`), then to the PyMuPDF word with the same page, text and x
whose baseline is within 1.2 em below the pdftotext box top, then to its v2 pair; that pair's |d|
on the accepted axis is compared with the same Chrome word's pair in the previous link and in
00-start. improved / worse = |d| changed by more than 1 pt; within = at most 1 pt (v2: unchanged);
unpaired = no v2 pair in the link (after) or in the compared link (before); unmapped = no single
PyMuPDF word (pdftotext and PyMuPDF split words differently).

| link · label | n | vs previous: improved / within / worse / unpaired / unmapped | vs 00-start: improved / within / worse / unpaired / unmapped |
|---|---|---|---|
| 01 · pdf-probe-compensating-drift | 117 | 63 / 19 / 18 (sparksuite 14, danfe 4) / 6 / 11 | = previous |
| 03 · pdf-probe-pairing-artefact | 16 | 1 / 4 / 0 / 11 / 0 | 1 / 3 / 1 / 11 / 0 |
| 03 · coincidental-match-of-wrong-geometry | 24 | 0 / 0 / 24 / 0 / 0 | 0 / 0 / 24 / 0 / 0 |
| 04 · pdf-probe-ascent-artefact | 697 | 472 / 211 / 0 / 0 / 14 | 493 / 138 / 16 (danfe) / 36 / 14 |
| 04 · compensating-drift (words) | 672 | 0 / 0 / 660 / 0 / 12 | 70 / 0 / 421 / 169 / 12 |
| 04 · misplaced-word-uniform-shift | 1189 | 51 / 0 / 640 / 496 / 2 | 21 / 0 / 379 / 787 / 2 |
| 04 · pdf-probe-pairing-artefact | 11 | 4 / 0 / 0 / 7 / 0 | 2 / 0 / 0 / 9 / 0 |
| 06 · pdf-probe-pairing-artefact | 12 | 12 / 0 / 0 / 0 / 0 | 12 / 0 / 0 / 0 / 0 |

Reading it (CONFIRMED from the numbers above; the per-fixture split is in the report):

- **D1 was real**: none of step 04's 697 ascent artefacts is worse beyond 1 pt against step 03;
  472 are better by more than 1 pt.
- **Step 01's compensating drift was mostly an oracle artefact**: 82 of 117 are not worse (63
  better), 18 are still worse beyond 1 pt (14 sparksuite, 4 danfe).
- **D2 was real**: step 06's 12 pairing artefacts all improved; step 03's and 04's are unchanged,
  improved or unpaired (a v1 pair across rows or pages), with one word worse against 00-start.
- **The remaining debt is real and gated now**: step 03's 24 coincidental matches, step 04's 660
  compensating-drift words and 640 misplaced words are worse beyond 1 pt under v2.
- **Against 00-start the latest link (07) is worse on 922 v2 items** (the accumulated drift of D4
  is visible this way, not by link-to-link tolerance).

**Latest link (07) per fixture, v1 → v2** (pairs; unpaired vellora / Chrome; worst / median
|dx| and |dy| in pt; v1 counts same-page pairs, its "unpaired" = words − pairs):

| fixture | v1 | v2 |
|---|---|---|
| boleto | 254; 0/0; dx 1.66/1.09; dy 21.61/8.70 | 297; 0/0; dx 1.67/0.76; dy 19.85/7.85 |
| boleto-febraban | 315; 0/0; dx 4.68/0.85; dy 7.91/1.74 | 315; 0/0; dx 4.68/0.85; dy 6.67/1.42 |
| danfe | 590 (40 cross-page); 0/0; dx 505.14/2.45; dy 42.29/9.07 | 590; 40/40; dx 11.05/2.45; dy 17.82/7.15 |
| invoice | 541; 0/0; dx 7.08/0.35; dy 3.54/0.63 | 541; 0/0; dx 7.08/0.35; dy 2.65/1.15 |
| notification | 248; 0/0; dx 0.72/0.35; dy 7.85/2.52 | 248; 0/0; dx 0.75/0.35; dy 5.60/0.35 |
| oss-postmark-receipt | 133 (3 cross-page); 0/39; dx 9.97/0.97; dy 37.22/10.84 | 134; 3/46; dx 9.97/0.97; dy 35.10/8.85 |
| oss-sparksuite-invoice | 46; 0/0; dx 3.23/3.22; dy 13.90/4.90 | 46; 0/0; dx 3.23/3.22; dy 11.77/2.77 |
| receipt | 151; 0/0; dx 0.95/0.23; dy 4.38/1.95 | 151; 0/0; dx 0.95/0.23; dy 2.60/0.35 |
| text-stress-ptbr | 1113 (707 cross-page); 20/7; dx 375.18/0.22; dy 731.88/240.36 | 751; 1095/1082; dx 35.66/0.24; dy 34.15/3.35 |

v1's worst values of hundreds of pt were pairs of different instances; text-stress-ptbr (8 pages
vs 7) leaves 1082 of Chrome's 1833 words without a partner within 36 pt on the same page, which
v1 hid as cross-page or mis-paired pairs.

## Head ratchet and debt ledger (2026-10-21/22, branch `phaseb/oracle-v2-ledger`)

Gating only against the previous link let sub-tolerance worsening pile up (critic finding D4).
Since this branch every gate run also compares against the **Chain head** (`port/00-start`,
GATE-H1). An item worse than the head beyond its tolerance passes only as a class-`a`
acceptance of the current step, a declaration (GATE-A2), or an entry in `DEBT.json` that stays
within its ceiling (GATE-D1…D7). `DEBT.json` is the empty `vellora-fidelity/debt/1` ledger. The
only worked entry is a test fixture (`fidelity/gate/test/data/debt-example.json`, DANFE
"NOME/RAZÃO" at step 07: raw Blitz +3.656 px, painted pass −2 px, run 2.213 px). Real entries
have not been written yet.

**Post-hoc evaluation of step 07 (no re-render).** CONFIRMED, asserted in
`fidelity/gate/test/head-chain.test.mjs`. Reports are in
`fidelity/gate/snapshots/2026-10-21/ledger/`. Local macOS, INDICATIVE. Commands as recorded in
the reports:
`node fidelity/gate/run.mjs --baseline fidelity/baselines/port/06-page-rules --run fidelity/baselines/port/07-media-print --accept fidelity/baselines/port/07-media-print/manifest.json --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from ~/.cache/vellora-fidelity/run-all-07-media-print-20261021T162148Z --step 07-media-print`,
then `node fidelity/gate/ledger-candidates.mjs …` (command in `ledger-candidates.md`).

Pin view here and in the candidate table below: the 2-fixture pin (invoice, notification) under
the pre-10-gate rules; the complete pin under the merged rules is in "Integration" below.

| view | gating | by check |
|---|---|---|
| 07 vs 06 (previous link) | 0 | – |
| 07 vs head 00-start | **985** (FAIL) | pdf-probe 922, WPT regression 38, WPT rejection 10 (step 06's undeclared `css:page-varying-width`), value 13, status 2 |
| 07 vs pin (shipped main), pin view | 213 (c), merge to main BLOCKED | pdf-probe 140, WPT 56, value 15, status 2 |

None of the 985 head items is covered: the ledger is empty, and 07's manifest has no class-`a`
acceptance. Legacy acceptances from steps 01–06, which carry no `class`, do not count against
the head. All 13 gate canaries (GATE-K2) are caught on this evaluation.

**Candidate classes** (`ledger-candidates.mjs`). These are candidates, not verdicts: an item is
covered only once a class-`a` acceptance or a DEBT entry is committed.

| candidate | head view (985) | pin view (213) |
|---|---|---|
| (b) layer vector on which the relaxed rule can hold | 616 | 133 |
| (b) one page-scoped entry (rule vi; text-stress-ptbr) | 122 | 0 |
| (a) artefact label or WPT page-count difference | 37 | 19 |
| declare (strict-gate rejection) | 10 | 10 |
| (c) lost text, or vellora worse than raw Blitz | 15 | 14 |
| none: no evidence for (a) or (b) yet | 185 | 37 |

**No possible (a)/(b) classification yet**: 200 head items, 51 pin items.

- **(c), head**: all 15 are oss-postmark-receipt text lost at step 05 (the XHTML doctype is
  parsed as XML, which drops the text after each `<br>`). That covers INV-X1/X2 PASS → FAIL,
  their `found` counts 6 → 5, the EXT-2 `missing` counts, 4 lost Chrome words ("The [Product
  Name] team"), and unpaired-chrome 42 → 46 and unpaired-vellora 0 → 3. The OLD value was
  right, so these block the merge until the text is restored.
- **(c), pin**: the 9 postmark corpus and EXT-2 rows above (not its words), plus 5 invoice
  words on page 3 ("Total a pagar R$ 50.724,90"). For those words |run| 3.533 px > |N0| 1.984 px: vellora's layers made them worse
  than raw Blitz.
- **none, head**:
  - 134 postmark words: layout-diff aligned no text run, so there is no layer vector.
  - 44 boleto words: they map to no layout-diff run.
  - 6 aggregate metrics with no per-item vector yet: DANFE-L1a…d `posErrMm`, and INV-R1
    `worstMm` for postmark and sparksuite.
  - WPT `css/CSS2/floats/zero-width-floats.html` (pass → fail, step 01 "two errors
    cancelling"). WPT tests have no layer vector.
- **none, pin**: 27 WPT pass → fail with no artefact evidence (the old render's page count
  equals Chrome's), DANFE-M1 `excessB` 8.552 → 24.173, DANFE-L1a…d, invoice REF-W p95 1.78 →
  2.51 mm, invoice EXT-2 pdfminer status, postmark INV-R1, and 2 invoice words.

**The same views at 09-review-fixes (2026-10-22, branch `phaseb/10-base`).** After 08 and 09 were
re-scored to v2 (above), 09 was gated post-hoc against 08 (reports, commands and the 09 run-level
layer summary in `fidelity/gate/snapshots/2026-10-22/ledger-09/`; darwin 27.0.0 arm64, Node
v22.23.2, INDICATIVE). As for 07, `--run` is the committed baseline: the raw run copy still
carries its v1 `pdf-probe.json`, so `--run <run copy>` is REFUSED (baseline 2, run 1; CONFIRMED).
Before the re-score, 08 and 09 were v1 while 00-start was v2, so the head comparison was refused
too (CONFIRMED: v1 09 vs v2 00-start is REFUSED). Counts are asserted in `head-chain.test.mjs`.

Pin view in these two tables: the 2-fixture pin under the pre-10-gate rules (see "Integration").

| view | 07 | 09 | by check at 09 |
|---|---|---|---|
| vs previous link | 0 | 0 (no item changed) | – |
| vs head 00-start | 985 | **974** (FAIL) | pdf-probe 920, WPT regression 38, WPT rejection 10, value 6, status 0 |
| vs pin, pin view (c) | 213 | **206**, merge to main BLOCKED | pdf-probe 140, WPT 56, value 10, status 0 |

| candidate | head 07 | head 09 | pin 07 | pin 09 |
|---|---|---|---|---|
| (b) layer vector | 616 | 752 | 133 | 133 |
| (b) page-scoped | 122 | 122 | 0 | 0 |
| (a) | 37 | 37 | 19 | 19 |
| declare | 10 | 10 | 10 | 10 |
| (c) | 15 | 0 | 14 | 7 |
| none | 185 | 53 | 37 | 37 |

- Head: the 15 postmark (c) items left with the HTML-only parse. The 4 Chrome words "The
  [Product Name] team" pair again, at dy 35.1 pt against the head's 32.1 pt, so they come back
  as 4 `dy` items (b). The 134 postmark words that had no layer vector at 07 now align to
  layout-diff runs and are (b) candidates (postmark: b 136, none 3).
- Pin (c): 5 invoice page-3 words (unchanged) and 2 postmark EXT-2 rows, `missing.pdftotext`
  35 → 38 and `missing.pymupdf` 37 → 40. The 3 extra missing tokens are "Download as PDF".
  CONFIRMED from the run copies' oracle `result.json`: the only tokens missing at 09 and not at
  pin are "Download" and "as". Those words lie below the page edge of vellora's single page
  (section 08). ledger-candidates still labels these 2 rows with the step-05 XML-parse reason.
  That label is now stale; the cause is the off-page tail.

**How a step uses this**: the chain convention above (`--head`, `--step`; `--debt-base` only
where the merge base with main cannot be determined). Add the step's head and pin counts to
`head-chain.test.mjs`. A DEBT entry (schema debt/2 since 2026-10-22) is written from a committed
vector (`node fidelity/gate/layer-vector.mjs --run <run copy> --keys-from <gate-report.json> --out
<committed file>`), one key record per item: `measured` = the head item's signed `after`,
`ceiling` at most |measured| + the metric's resolution (pdf-probe 0.01 pt; counts 0),
`layerVectorRef` = `"<repo-relative --out file>#<item key>"`. It must satisfy the relaxed (b)
rule and GATE-D7. Then `node fidelity/gate/debt.mjs check --base <ledger at merge base> --step
<NN-name> --report <gate-report.json>` must be clean (without `--report` every new key fails
GATE-D7: it has no head item to be tied to).

## Gate fixes (2026-10-22, branch `phaseb/10-gate`)

Gate gaps found by the Phase B reviews (I1–I5 and the step-08 verifier). One commit per fix; every
rule change has a GATE-K2 canary (`gate/canaries.mjs`) and a self-test that shows it uncaught when
the rule is broken (`gate/test/canaries.test.mjs`). Numbers: committed baselines, local macOS,
INDICATIVE.

- **I1, a word that crosses Chrome.** `comparePdfProbeV2` judged dx/dy by \|after\| − \|before\|
  only, so 0.35 → −1.15 pt passed. A sign flip that ends more than 1 pt from Chrome now
  regresses; one that ends within 1 pt is within-tolerance, never "better". The task's
  sign-agnostic formula also gated same-side improvements (−20.49 → −1.19 pt: 557 of 979 such
  items of 09 vs 00-start, 283 of 322 vs pin), so only crossings gate (GATE-P1). The head views
  grow by the crossings: 07 985 → 1407, 09 974 → 1396; pin (c) 07 213 → 252, 09 206 → 245 (all
  pdf-probe; asserted in `head-chain.test.mjs`).
- **I2, rule iii without `--debt-base`.** The ledger base now defaults to `DEBT.json` at
  `git merge-base HEAD main` (absent = first population); a base that cannot be determined
  REFUSES the gate, and `run-all --gate` refuses before it starts. CONFIRMED on this branch:
  "DEBT.json absent at merge-base a8b126d8a133 (HEAD, main): first population".
- **I3, ledger schema `debt/2` and GATE-D7 at entry.** An entry groups keys that share owner,
  compensators, closesAt and introducedBy; each key carries `{ key, tolClass, headValue,
  ceiling, measured, layerVectorRef }`. Rules ii and iii apply per key. A new key must be an
  item of the head comparison; its `measured` must be the run's value, its `ceiling` at most
  \|measured\| + the metric's resolution (pdf-probe 0.01 pt), and its vector's `run` converted
  to the gate's unit must equal `measured` (before, a ceiling of 99 passed). `DEBT.json` and the
  worked example are migrated; debt/1 files are read by migration (`measured: null`, so a key
  entered from one fails GATE-D7).
- **I4, declarations carry forward.** The head comparison merges the `declaredRejections` of
  every link from the head (exclusive) to the current step (inclusive); the pin view those of
  every link up to the current step (`gate/declarations.mjs`). Step 06's manifest predates the
  field and is history, so its declaration of the 10 `css:page-varying-width` WPT rejections is
  in `declared-rejections.json` (`step: "06-page-rules"`; the test list is the rejection set of
  06 vs 05 and of the 09 head view; CONFIRMED that the step-07 run copy's `wpt/results.json`
  records `cause.feature` `css:page-varying-width` for exactly these 10). Result: head 07
  1407 → 1397, 09 1396 → 1386; pin (c) 07 252 → 242, 09 245 → 235, declared 10 (post-hoc
  `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/08-html-parse --run
  fidelity/baselines/port/09-review-fixes --accept fidelity/baselines/port/09-review-fixes/manifest.json
  --step 09-review-fixes --layout-from <09 run copy>`, 2026-10-22).
- **EXT-2 missing-token SET.** The value ratchet compared the COUNT of missing tokens per
  extractor, so at step 08 three tokens that left the page and four that came back passed
  (`missing.pdftotext` 39 → 38, an "improvement"). Now every token missing more often than in
  the baseline gates on its own key. The verdicts carry `missingTokens` (the text oracle now
  records the full `missingAll` list); the committed baselines 00-start, 07, 08, 09 and pin gained
  `ext2-tokens.json`, backfilled from their run copies' `oracles/*/<fixture>/plain/result.json`
  (`node fidelity/gate/backfill-ext2-tokens.mjs --baseline <dir> --run <run copy>`; refused
  unless the run's `summary.json` is the manifest's source and every EXT-2 value string equals the
  one derived from the record). Lists truncated at 40 are not comparable and fall back to the
  count: 00-start and pin text-stress-ptbr pdftotext (82 and 78 tokens), 07 postmark pymupdf (41).
  CONFIRMED on the committed data: 08 vs 07 now gates exactly "Download", "as" and a second "PDF"
  in pdftotext (the history loader, `ext2Tokens: false`, still passes it); 09 vs 08 and 09 vs
  00-start have no token item; 09 vs pin adds the same 3 tokens in pdftotext and pymupdf. Head
  07 1397 → 1409 and pin (c) 07 242 → 254 (the 12 postmark tokens the XML parse lost), 09 235 →
  241.
- **Off-page text.** Which oracle sees text drawn outside the MediaBox (CONFIRMED 2026-10-22 on
  the step-09 postmark `vellora.pdf` of the run copy: "Download as PDF" at 855.6 pt and the tail
  down to 1111.3 pt, page height 841.92 pt): PyMuPDF's page words (pdf-probe v2, REF-W) and
  `get_text("text")` (EXT-2 pymupdf) do NOT (MuPDF clips to the page; 138 words inside, 40 off),
  poppler `pdftotext` 26.06.0 does NOT, pdfminer.six 20260107 DOES. So EXT-2 pdfminer.six passes
  with the text off the page, and pdf-probe read the step-08 move as unpaired-vellora 3 → 0, an
  improvement. `words.py` now also lists `offPage` words (unclipped, origin outside the page;
  `words` unchanged, byte-identical on that PDF), pdf-probe v2 sections carry `offPage`, and the
  gate ratchets vellora's per text (a newly off-page word gates; ACCEPTANCE GATE-P1). Every
  committed link (00-start … 09, beta4-gated, beta4) and pin was backfilled with
  `node fidelity/gate/backfill-off-page.mjs --baseline <dir> --run <run copy>` (refused unless
  the run's PDFs reproduce the committed section exactly; all did). Off-page vellora words:
  postmark 40 at 00-start…04, 32 at 05–07, 40 at 08–09; boleto-febraban 4 at beta4-gated…02, 0
  from 03. 08 vs 07 now gates 7 off-page words ("Download", "as", a second "PDF", "1234" ×2,
  "Street", "Rd.", "Suite"); 09 vs 08 and 09 vs 00-start none (the head already drew the same 40
  off the page: postmark printed 1 page vs Chrome's 2 before the chain, Phase C priority zero).
  Canaries: GATE-K2 (an unpaired vellora word moved into the off-page record) and a pdf-probe
  detection canary on the committed notification PDFs (one krilla glyph run moved 804 pt down:
  4 page words gone, 4 new off-page words, the off-page item gates).
- **WPT (b) route (GATE-A3).** WPT items have no layer vector. A pass → fail item is (a) when the
  old pass was false (old test render = reference ≠ Chrome by ink or page count), (b) when a
  raw-Blitz render of the same test fails the same way (owner upstream; a DEBT key carrying
  `rawOutcome`, owner `blitz:*`, tied to the run by GATE-D7), else (c). The field is
  `wpt/results.json` `tests[i].rawOutcome` (`outcomes.json` `rawOutcomes`), written by the
  raw-Blitz WPT mode built on `phaseb/10-wptraw` (`gate/wpt-route.mjs`; synthetic tests in
  `gate/test/wpt-route.test.mjs`). Merged on `phaseb/10-integrate` (2026-10-22): a run gated with
  `run-all.mjs --gate --raw` records it for every WPT test; a run without `--raw` does not, and
  its WPT pass → fail items stay (c) (see "Integration").
- **Probe fixtures.** Step 09's 37 Chrome probes are a pdf-probe v2 suite run by `run-all`
  (step `pdf-probe-suite`, `fidelity/layout-diff/probe-suite.mjs`, data
  `fidelity/layout-diff/probes/review-fixes-09.json`; fixtures `probe-<id>`, Chrome references
  printed at run time through `fidelity/lib/chrome-reference.mjs`). They are new rows: a gate of
  the next run against 09 reads them as newly measured, and they ratchet from the next committed
  baseline on. CONFIRMED that the suite catches what the gate missed at step 09: gating the f5
  probes of the step-09 evidence PDFs from the step-08 build to the fix-5 build fails on
  f5_table_partial (dy 0 → −15 pt on 7 rows) and f5_allowance_footer ("Tail" unpaired) and passes
  the other six (details: `fidelity/layout-diff/README.md`, "Probe fixtures"). The head and pin
  views cannot see the probes until someone renders them with those builds' addons.
- **The views at 09 under all of the above** (post-hoc, no re-render; report in
  `fidelity/gate/snapshots/2026-10-22/gate-fixes/`; darwin 27.0.0 arm64, Node v22.23.2,
  INDICATIVE): `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/08-html-parse --run
  fidelity/baselines/port/09-review-fixes --accept fidelity/baselines/port/09-review-fixes/manifest.json
  --step 09-review-fixes --layout-from <09 run copy>`. Previous link: 0 gating. Head 00-start:
  1386 gating (pdf-probe 1342, WPT regression 38, value 6) plus 10 declared. Pin view: (c) 241
  (pdf-probe 179, WPT 46, value 16), declared 10; merge to main BLOCKED. 20/20 gate canaries
  caught; ledger base "DEBT.json absent at merge-base a8b126d8a133: first population".

## Integration (2026-10-22, branch `phaseb/10-integrate`)

`phaseb/10-base` + `phaseb/10-gate` + `phaseb/10-pin` + `phaseb/10-crates` + `phaseb/10-wptraw`,
each merged with `--no-ff`. Local macOS (darwin 27.0.0 arm64, Node v22.23.2, Python 3.12.13,
PyMuPDF 1.28.2); INDICATIVE.

**The complete pin.** `baselines/pin` was taken from `phaseb/10-pin` (pdf-probe v2 for all 9
fixtures) and backfilled again for the 10-gate records: `node fidelity/gate/backfill-off-page.mjs
--baseline fidelity/baselines/pin --run ~/.cache/vellora-fidelity/run-all-pin-20261021T054154Z
--inputs ~/.cache/vellora-fidelity/pin-v2-render-20261022/inputs.json` (`--inputs` added here,
same rules as `rescore-pdf-probe.mjs --inputs`: sha256-checked, and the mapped PDFs must reproduce
the committed section exactly) and `node fidelity/gate/backfill-ext2-tokens.mjs` on the same run.
Off-page vellora words at the pin: boleto-febraban 6, postmark 37, the others 0. Integrity ok.

**Product render = 10-crates (CONFIRMED).** At the merged tip (build of `fba1346`), `node
fidelity/run-all.mjs --only corpus,oracles-fixtures,oracles-corpus,layout-diff,pdf-probe,pdf-probe-suite`
wrote 34 vellora PDFs (corpus 6, oracles 19, layout-diff 9) byte-identical (sha256) to the
`run-all-10-crates-20261022T225719Z` run copy's; the default WPT suites (8047 reftests) give the
same product outcome for 8047/8047. The raw render follows 10-wptraw's definition: `raw_blitz_tests`
5/5, and the 165 tests of `wpt-raw-10base-98368b3-20261022` reproduce `outcome` and `rawOutcome`.
Run copies: `~/.cache/vellora-fidelity/run-all-merged-render-check-20261022/` and
`~/.cache/vellora-fidelity/wpt-full-10integrate-20261022/` (the latter also holds a filtered
`run-all.mjs --only wpt --raw --baseline …/09-review-fixes` check: 10/10 tests carry `rawOutcome`
in `results.json`, `outcomes.json` has `rawMode` and 10 `rawOutcomes`).

**09 vs 08 post-hoc under the merged rules with the complete pin** (reports, candidates and
`merged-09-summary.json` in `fidelity/gate/snapshots/2026-10-22/merged-09/`; commands in the
summary; asserted in `head-chain.test.mjs`):

| view | result | by kind |
|---|---|---|
| vs 08 (previous link) | 0 gating | – |
| vs head 00-start | **1386** gating + 10 declared (FAIL) | pdf-probe dy 1125, dx 202, pairing 15; WPT 38; value 6 (DANFE-L1a…d `posErrMm`, INV-R1 `worstMm` postmark and sparksuite) |
| vs pin, pin view | **(c) 1140** + 10 declared, merge to main BLOCKED | pdf-probe dy 771, dx 283, pairing 21, off-page 3; WPT 46; value 16 (EXT-2 tokens 6, EXT-2 counts 2, DANFE-L1a…d 4, DANFE-M1, REF-W p95, EXT-2 pdfminer status, INV-R1) |

On the 2-fixture pin under the pre-10-gate rules this view was 206; under the old rules on the
complete pin 809 (`snapshots/2026-10-22/pin-v2/`); on the 2-fixture pin under the 10-gate rules
241 (`snapshots/2026-10-22/gate-fixes/`). The `--baseline pin --main` report agrees (pin view
1140 + 10 declared; its 1150 previous-link gating counts the 10 rejections, which only the
current step's declarations cover there). Before this branch it reported 1150 (c) and 0 declared:
`chainDeclarations` carried nothing to the pin view when the previous link was not a port step;
fixed in `gate/declarations.mjs`.

**Candidate classes** (`ledger-candidates.mjs`, now with `--raw-wpt
~/.cache/vellora-fidelity/wpt-raw-10base-98368b3-20261022/results.json`):

| candidate | head (1386) | pin (1140) |
|---|---|---|
| (b) layer vector / raw Blitz fails the same way | 1154 (pdf-probe 1147, WPT 7) | 934 (pdf-probe 903, WPT 31) |
| (b) page-scoped (text-stress-ptbr) | 144 | 89 |
| (a) old pass proven false | 1 (WPT) | 1 (WPT) |
| (c) | **30** (WPT) | **57** |
| none | 57 | 59 |

The old "declare 10" row is gone because I4 carries step 06's declaration (the items are
`declared`, not candidates), not because 10 items went away. Two classifier changes move rows:

- **WPT (a) needs GATE-A1 evidence.** Before, a step 01–06 chain label (`wpt-false-pass-rect-merge`
  …) alone made a WPT item (a): head 37, pin 19. GATE-A1 says legacy acceptances do not count
  against the head, and GATE-A3's (a) is an old pass shown false by ink or page count. With the
  old run's records and the raw-Blitz outcomes the classes equal `snapshots/2026-10-22/wpt-raw/`
  exactly: head a 1 / b 7 / c 30, pin a 1 / b 31 / c 14. The 30 head (c) are the
  line-height-*/{,max-,min-}height-06x/07x tests whose pass raw Blitz keeps and
  `pagination::merge_adjacent_rects` breaks (ablation, `phaseb/10-wptraw`).
- **Lost text is c.** Newly off-page text (`pdf-probe|<fx>|off-page|<text>`) and newly missing
  tokens (`…|missingTokens.<extractor>|<token>`) are (c); an EXT-2 count row of a fixture with
  newly off-page text names that cause instead of the stale step-05 XML-parse label.

Pin (c) 57: WPT 14 (the merge_adjacent_rects class); sparksuite p1 dx 25 (−0.23 → −3.23 pt, the
beta.4 bump, |run| > |N0|); invoice p3 "Total a pagar R$ 50.724,90" dy 5 (+1.10 → −2.65 pt at 09;
`phaseb/10-crates` moves them to −1.15 pt); postmark "Download as PDF" newly off-page 3, its 6
EXT-2 tokens (pdftotext, pymupdf) and the 2 EXT-2 count rows (35 → 38, 37 → 40); postmark
`[Product#1` / `Name]#1` pairing 2 (a key swap per `phaseb/10-pin`, not lost text: an (a) path is
missing). Head none 57: boleto 44 dy (no layout-diff run for the Chrome word), text-stress-ptbr 5
and postmark 2 dy (same reason), DANFE-L1a…d and the 2 INV-R1 (no per-anchor vector). No WPT
item is none any more: `css/CSS2/floats/zero-width-floats.html` (none before, "two errors
cancelling") is (b), raw Blitz fails it the same way.

**For the next link.** Gate with `node fidelity/run-all.mjs --gate --raw …` so every WPT item
carries `rawOutcome` (the wpt step takes about twice as long: 52.9 s → 106.8 s for the default
suites, `fidelity/wpt/README.md` "Raw-Blitz mode"), then run `ledger-candidates.mjs` with
`--raw-wpt <run>/wpt/results.json` and the old runs' `--head-wpt` / `--pin-wpt`.

## `10-rects`: `merge_adjacent_rects` joins only touching rects (2026-10-22, branch `phaseb/10-rects`)

Not a baseline yet (integration-3 writes baseline 10). Local macOS, INDICATIVE: darwin 27.0.0 arm64
(macOS 27.0.1, Apple M5 Pro), Node v22.23.2, rustc 1.96.0, Chrome 155.0.8059.85, blitz-dom
0.3.0-beta.4, WPT `9d8aceec`, PyMuPDF 1.28.2.

**Change.** `pagination::merge_adjacent_rects` drew same-colour rects of one band up to
`RECT_MERGE_TOLERANCE_PX` = 4 px apart as one rect (added in `66aa59d` "Refine PDF visual chrome",
for collapsed `<th>` backgrounds forming one band). It now merges only rects that touch:
−0.5 px ≤ gap ≤ `RECT_MERGE_EPSILON_PX` = 0.05 px. A real gap is never bridged.

**Why the 30 head WPT tests passed at 00-start (CONFIRMED).** `layout_dump --pdf` built from
`659db88` (00-start) and `8290b06` (01) on `css/CSS2/linebox/line-height-006.xht` and its reference
(Ahem, the reference's image supplied):

| build | test rects (x, y, w × h, px) | reference images (x, y) |
|---|---|---|
| `659db88` | (68.47, 94.47, 20 × 96), (90.47, 190.47, 20 × 96): stacked | (68.47, 94.47), (90.47, 190.47): stacked |
| `8290b06` | (68.47, 110.47, 42 × 96): side by side, then merged | (68.47, 110.47), (90.47, 110.47) |

At 00-start the test and the reference were drawn the same wrong way (the old paginator re-stacked
fragments), so they compared equal: a false pass. The merge did not apply because the two y
differed. From 01 on the stripes sit side by side and the merge filled the 2 px gap between them.
This is display-list evidence. It is not GATE-A1's ink-flag or page-count evidence, but the
question is moot because the tests now pass.

**What the 4 px tolerance bridged (CONFIRMED).** Every merge was traced during `corpus`,
`oracles-fixtures`, `layout-diff` and `pdf-probe-suite` (temporary `eprintln`, not committed;
logs in `~/.cache/vellora-fidelity/rects-merge-evidence-20261022/trace-logs/`). The gaps were
exactly 0 px (3545 merges), 1 px (900) or 2 px (26). Nothing fell strictly between 0 and 1 px or
between 1 and 2 px, so any epsilon below 1 px gives the same display list.

- **1 px gaps.** Black or grey 1 px border segments of `border-collapse: collapse` tables
  (boleto-febraban, danfe, the legacy boleto and invoice fixtures). Blitz 0.3.0-beta.4 draws
  each cell's own borders, with a doubled 1 px line at every junction, where Chrome draws one
  line. The old merge closed the 1 px notch of the horizontal line between the doubled verticals,
  but only in some rows: at boleto-febraban y 73.9 the vertical rects sort between the segments
  and they were never merged. Now that notch is open in every row. It is 1 px² at 8× zoom, inside
  an already-doubled junction.
- **2 px gaps.** oss-sparksuite-invoice (heading band 35 px, 1 px hairlines) and
  oss-postmark-receipt (hairlines). These are Blitz's default 2 px `border-spacing` in tables
  marked `cellspacing="0"`. blitz-dom 0.3.0-beta.4 has no `cellspacing` presentational hint:
  `stylo.rs` `synthesize_presentational_hints_for_legacy_attributes` maps `align`, `width`,
  `height`, `hspace`, `vspace`, `border` (img), `bgcolor` and `hidden`, but not `cellspacing`, and
  `layout/table.rs` reads only `border-spacing`. Chrome draws the sparksuite heading cells
  touching (96 + 359 = 455 px). vellora drew 325 + **2** + 270 px and the merge hid the slit in
  the paint only. Now the 2 px slit shows (8× raster: 237 → 255 over 2 px). The cell geometry was
  wrong before and after the change.
- **Seam guard kept.** Touching same-colour rects still merge.
  `table_header_background_merges_across_adjacent_cells` still passes: collapsed `<th>` cells
  touch at beta.4, gap 0.

**Gate** (run `20261023T000308Z`, build `1981837`; copy
`~/.cache/vellora-fidelity/run-all-10-rects-20261023T000308Z`, with ledger candidates):
`node fidelity/run-all.mjs --gate --raw --baseline fidelity/baselines/port/09-review-fixes
--chrome-from ~/.cache/vellora-fidelity/run-all-beta4-20261021T054809Z/wpt/results.json
--tools-image vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/10-rects`.

The verdict is FAIL, from the head and pin views only:

- **Previous link (09): 0 gating.** Improvement 41, within-tolerance 4, gate canaries 20/20.
  - The improvements are 36 WPT fail → pass and invoice p3 dy −2.65 → −1.15 pt ×5 (10-crates).
  - The 36 WPT are the 30 head tests, plus `line-height-069/072/073/094/095/102`.
  - The 4 within-tolerance items are receipt dy −1.15 → 0.35 pt (10-crates).
- **Head view: 1386 → 1356 gating** (10 declared). The 30 gone are exactly the 30 WPT (c) tests.
  No item was added and no value changed. WPT went 38 → 8; pdf-probe and values are unchanged.
- **Pin view: (c) 1140 → 1122** (10 declared).
  - The 14 WPT of the merge class are gone (WPT 46 → 32).
  - The 4 receipt dy items are gone, from 10-crates.
  - The 5 invoice p3 dy items now read −1.15 pt (10-crates).
- **Candidates** (`ledger-candidates.mjs --raw-wpt` the run):
  - head: a 1, b 1154, b-page 144, **c 0** (was 30), none 57;
  - pin: a 1, b 935, b-page 89, **c 38** (was 57), none 59.
- **WPT outcome × rawOutcome** (8047): pass×pass 3646 → 3682, fail×pass 111 → 75.
  `position-relative-nested-001` is still product fail × raw pass, pin-flagged. A different vellora
  layer owns it: 20000 px differ, a 100 × 200 box (HYPOTHESIS, not investigated).
- **Render scope.** Against the 10-crates render copy (`run-all-merged-render-check-20261022`),
  45 of 66 vellora PDFs are byte-identical. The 21 that differ are exactly the fixtures with 1 or
  2 px merges. In every one, page count and words (text + bbox, PyMuPDF) are identical; only the
  fills differ (fill area: danfe −211 px², sparksuite −148 px²).

**For the next phase.** The 2 px sparksuite and postmark slits come from the missing
`cellspacing` hint, which also misplaces the text. A throwaway experiment (not committed)
rendered both fixtures with a zero-specificity emulation injected,
`:where(table[cellspacing="0"]) { border-spacing: 0px }`, and paired words with Chrome by text
(indicative, not pdf-probe; `cellspacing-experiment/` in the evidence copy):

| fixture | without the hint | with the hint |
|---|---|---|
| sparksuite \|dx\| median | 3.22 pt | 1.72 pt |
| sparksuite \|dy\| p95 | 11.92 pt | 1.58 pt |
| postmark \|dy\| median | 9.05 pt | 1.55 pt |
| postmark \|dy\| p95 | 35.24 pt | 8.24 pt |

With the hint, the sparksuite heading cells touch again and are drawn as one band. HYPOTHESIS:
the pin-view sparksuite dx 25 item (−0.23 → −3.23 pt) shares this root cause. Settling it needs
the hint in the core (for example a user-agent-origin rule per distinct `cellspacing` value,
through `blitz_engine.rs`), gated as its own link. `cellpadding` has the same gap in Blitz.

## Debt population and the 10-integration gate (2026-10-27, branch `phaseb/10-debt`): baseline 10 NOT written

Post-hoc re-gate (no render) of the surviving 10-tip run copy
(`run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5`, phaseb/10-tip a293cf5)
with the first population of `DEBT.json` and the step's class-a acceptances
(`fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json`: the 3 of 10-spark, re-checked on the
10-tip PDFs, plus the WPT false pass `monolithic-overflow-014`). Local macOS, INDICATIVE.

- vs `09-review-fixes`: gating 0. Head vs `00-start`: gating **145** (debt 1024, accepted 4,
  declared 10). Pin: (a) 1, (b) 641, (c) 217. Gate canaries 20/20. Verdict FAIL, so
  `10-integration` is not written.
- `DEBT.json`: 26 entries, 1024 keys (1014 pdf-probe words, DANFE-L1a-c `posErrMm`, 7 WPT
  raw-Blitz fails), every owner `blitz:*`, built by `fidelity/gate/debt-populate.mjs` from that
  one run and the committed vectors of the snapshot. The 53 round-2 "none" items got vectors from
  two `layer-vector.mjs` extensions (page-1 geometry fallback; `--spec-anchor` for DANFE-L1).
- The 145 that block: `DANFE-L1d posErrMm` (its only layer step is P -> run +0.626 px, Chrome's
  DOM-vs-PDF offset, above the 0.5 px position-mm run tolerance) and 144 text-stress-ptbr words
  on pages 2-7 (8 pages vs Chrome 7: rule vi needs a page-scoped entry, which GATE-D7 refuses
  because `TXT-P1 pageDelta` is unchanged vs the head). Both need a rule decision or a pagination
  fix; neither is hidden in the ledger.
- Numbers, commands, residual and the pin classification:
  `fidelity/gate/snapshots/2026-10-27/10-debt/README.md`.

## `10-integration`: baseline 10 written (2026-10-27, branch `phaseb/10-final`)

Link `port/10-integration`, gated against `port/09-review-fixes`. No re-render: every number is
from ONE run, `20261023T004510Z` (phaseb/10-tip a293cf5 = 10-rects + 10-spark + 10-crates on Blitz
0.3.0-beta.4 from crates.io; `run-all --gate --raw`, 2026-10-23, Chrome 155.0.8059.85), re-gated
post hoc on 2026-10-27 with the step's class-a acceptances and the re-populated `DEBT.json`.
Environment of run and re-gate: darwin 27.0.0 arm64 (macOS 27.0.1, Apple M5 Pro), Node v22.23.2,
rustc 1.96.0, PyMuPDF 1.28.2; local macOS, INDICATIVE. `<RUN>` =
`~/Repositories/vellora-fidelity-runs/run-all-10-tip-20261023T004536Z-blitz-0.3.0-beta.4-vellora-a293cf5`
(the copy's directory carries `004536Z`; its `summary.json` `runId` is `004510Z`, CONFIRMED by
the 10-verify agent). Full numbers, commands and the item-by-item diff against 10-debt:
`fidelity/gate/snapshots/2026-10-27/10-final/README.md`.

```
node fidelity/gate/run.mjs --baseline fidelity/baselines/port/09-review-fixes --run <RUN> \
  --accept fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json \
  --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from <RUN> \
  --debt fidelity/baselines/port/DEBT.json --step 10-integration --out <scratch>/regate
# exit 0: PASS
```

**Baseline source.** `write-baseline.mjs` reads the verdict from the run's `gate/gate-report.json`
and refuses a FAIL without `--force`; the tip copy's own report is the 2026-10-23 run-all gate (vs
09, no acceptances, no ledger: FAIL raw). The baseline is therefore written from the derived copy
`~/Repositories/vellora-fidelity-runs/run-all-10-integration-20261023T004510Z-regate-20261027-blitz-0.3.0-beta.4-vellora-a293cf5`
= the tip copy with `gate/gate-report.{json,md}` replaced by the re-gate above (the run-all report
kept beside it and attached as `attachments/gate-report-run-all-vs-09-raw.md`). `diff -rq` of the
two copies: only those `gate/` files (CONFIRMED 2026-10-27). Re-writing the baseline into a scratch
root reproduces every file except `manifest.json` `command`/`date` (CONFIRMED 2026-10-27).

### Gate results (CONFIRMED, `10-integration/gate-report.{json,md}`)

| view | result |
|---|---|
| vs `09-review-fixes` | **gating 0**: improvement 93, added 5, within-tolerance 327, newly-measured 39, accepted 3, unchanged 14486 |
| head vs `port/00-start` | **gating 0**: debt 1169, accepted 4, declared 10; 3 flagged WPT passes lost, reported, not gating (GATE-W1: `background-position-002`, `page-name-001-print`, `page-name-orthogonal-writing-002-print`) |
| pin view vs `baselines/pin` | (a) 1, (b) 693, (c) 165, declared 10: merge to main BLOCKED |
| ledger | 27 entries, 1026 keys (+144 listed scope keys), 0 problems; base: no DEBT.json at the merge base with main = first population |
| gate canaries (GATE-K2) | 22/22 caught (23/23 after the verify fix of GATE-D6b, phaseb/10-final-verify; report otherwise identical: `fidelity/gate/snapshots/2026-10-27/10-final/README.md`) |

**What changed since 09** (the 10-rects, 10-spark and 10-crates product changes, each described
in its section above; the gate's own breakdown of this re-gate):

- Improvements 93: WPT 45 fail → pass (the 10-rects run alone had 36 vs 09, section above; which
  later change owns the other 9 is not attributed here, UNVERIFIED); pdf-probe words
  sparksuite 25, postmark 9, invoice 5 (p3 dy −2.65 → −1.15 pt, 10-crates); values: INV-R1
  postmark and sparksuite FAIL → PASS (`worstMm` 10.26 → 0.18 and 4.15 → 0.61), postmark EXT-2
  missing tokens pdftotext 38 → 35, PyMuPDF 40 → 37, invoice REF-W `maxMm` 2.53 → 1.68 and `p95Mm`
  2.51 → 1.55, invoice EXT-2 pdfminer.six status 2 → 3.
- Within tolerance 327 (listed, not gating): postmark 235, sparksuite 67, invoice 21, receipt 4.
- Newly measured 39: the 37 `pdf-probe-suite` probe fixtures (`probe-*`, first gated in this run;
  09 has no `probe-*` pdf-probe section, CONFIRMED by listing `09-review-fixes/pdf-probe/`) and
  postmark `[Product#1` / `Name]#1` (now paired, dx −0.90 dy −0.15 pt). Added 5: gate canaries.

**Class-a acceptances** (`fidelity/gate/snapshots/2026-10-27/10-debt/accepted.json`, 4, each with
its re-check on the tip PDFs): the 3 of 10-spark (postmark `[Product#2` and `Name]#2` pairing:
Chrome's white `text-shadow` copy, which vellora does not draw, was the old partner; postmark
`unpaired-vellora` 0 → 3: "Download as PDF" was drawn below the page at 09 and is now on page 1),
counted vs 09 and vs the head; and the WPT false pass `css/css-page/monolithic-overflow-014-print.html`,
head view only.

### DEBT.json (27 entries, 1026 keys + 144 listed scope keys)

Re-populated from exactly this run with the committed inputs (command in
`fidelity/gate/snapshots/2026-10-27/10-debt/README.md`; output `27 entries, 1026 keys (1025 covered
records + 1 page metric), 144 listed scope keys; residual 0`). By tolerance class: pdf-probe-pt
1014, WPT count 7, position-mm 4 (DANFE-L1a-d `posErrMm`), page-delta 1. By owner layer (keys):
`blitz:text-position-dy` 847, `blitz:text-position-dx` 167, `blitz:wpt-raw-fail` 7,
`blitz:block-offset` 4, `vellora:pagination` 1 (the page-scope entry, `closesAt` `11-pagination`,
Phase C). By `introducedBy` (entries / keys): `04-block-offset` 16 / 734, `03-table-passes` 4 / 156,
`01-pagination-gaps` 6 / 131, `05-walk-rewrite` 1 / 5. Against the 10-debt ledger (26 / 1024): 25
entries byte-identical, `DEBT-10-danfe-1` gains DANFE-L1d (rule ii), and
`DEBT-10-text-stress-ptbr-page-scope` is new (rule i). Owner text: since 10-spark, N0 includes
vellora's `<table cellspacing>`/`cellpadding` user-agent sheet
(`blitz_engine::table_spacing_hints_css`); `debt-populate.mjs` names it for the fixtures whose source
uses those attributes (`oss-postmark-receipt`, `oss-sparksuite-invoice`, `probe-g_postmark_raw`;
none of them has a DEBT key, so no committed owner text changed).

### The two rule changes (orchestrator decisions, 2026-10-27; ACCEPTANCE.md GATE-D6b, GATE-D7)

- **(i) Listed page scope (GATE-D6b, rule vi′).** A page-scoped entry may bind a page metric whose
  measured value equals its head value, on the page-scope route only; ceiling = the current page
  delta; it scopes out only its listed per-word keys on pages ≥ 2 of that fixture while the delta
  is ≥ 1. Used once: `text-stress-ptbr|TXT-P1|corpus||criterion#1|pageDelta` (head 1 = run 1;
  vellora 8 pages, Chrome 7), 144 listed words (94 dy, 35 dx, 15 pairing; introduced by
  03-table-passes 65, 04-block-offset 79). Lost-text check of the 15 pairing items: displaced, not
  lost (`10-final/lost-text-text-stress-ptbr.json`). Canaries: page delta 1 → 2 gates; a page-1
  word worsening beyond tolerance gates; page delta 0 compares the listed word again.
- **(ii) One vector run tolerance (GATE-D7).** `gate/tolerances.mjs` `VECTOR_RUN_TOLERANCE_PX` =
  the pdf-probe word tolerance 1 pt = 1.333 px for both pdf-probe-pt and position-mm vectors
  (position-mm was 0.5 px). Measurement (CONFIRMED, `node
  fidelity/gate/snapshots/2026-10-27/10-final/scripts/run_p_spread.mjs .`, 2026-10-27, on the
  committed 10-debt head vectors): run − P over the 459 mapped danfe page-1 words, dy median
  +0.557, range −0.284..+1.113 px; max |run − P| over 7 fixtures and both axes 1.233 px (danfe dx),
  + 0.013 px resolution = 1.246 px < 1.333 px, so the pdf-probe value covers it and is kept as the
  single value. Added with it: the relaxed (b) rule also requires |P| ≤ |N0| + 0.5 px, so the wider
  run tolerance cannot absorb a layout-layer worsening (refuses none of the 1014 committed word
  keys). Classification change: exactly one key, `danfe|DANFE-L1d|corpus||criterion#1|posErrMm`
  (head residual → DEBT, pin c → b). Canaries on the DANFE-L1d vector: a +0.6 px layout-layer step
  stays (c), named or not; a +1.5 px P → run step gates.

Effect, item by item vs the 10-debt re-gate (CONFIRMED): head exactly 145 `head-regression → debt`
(DANFE-L1d + the 144 text-stress-ptbr words on pages ≥ 2 = the 10-debt residual), nothing else; vs
09 nothing; pin 52 `c → b` (DANFE-L1d + 51 page-scope words that are head items), so pin (b)
641 → 693 and (c) 217 → 165.

### Loss event and reproducibility

`~/.cache/vellora-fidelity` (every older run copy), the tools image and the veraPDF image were lost
between 2026-10-23 and 2026-10-27 (chain convention above). The tools image was rebuilt from
`fidelity/oracles/docker/tools.Dockerfile` (`sha256:c405e06c653a...`); veraPDF `verapdf/cli:v1.30.3`
was re-pulled by digest (same id `sha256:45b2f7cd...`). Tools-image equivalence is now CONFIRMED on
this corpus by the reproducibility run `20261027T130144Z`
(`fidelity/gate/snapshots/2026-10-27/repro-10/README.md`, copy
`~/Repositories/vellora-fidelity-runs/run-all-10-repro-20261027T130144Z`): 71/71 product PDFs
byte-identical, oracle verdicts, WPT outcomes 8047/8047 and gate counts identical. Chain convention
gains `--chrome` pinned to Chrome for Testing 155.0.8059.85 (`node fidelity/wpt/install-chrome.mjs`;
local stable Chrome is now 156.0.8078.4).

### Known failures that become the floor

- Off-page vellora words (GATE-P1 counts): `probe-g_inline_body` 66 (vellora 1 page, Chrome 3),
  `probe-g_postmark_raw` 23 (vellora 1, Chrome 2). Newly measured at this link: 09 has no `probe-*`
  pdf-probe section, so there is no earlier number to compare with (CONFIRMED). Postmark: 37
  (09: 40; −3 = "Download as PDF").
- Postmark "Download as PDF": vellora page 1 (baseline 815.85 pt on 841.92 pt), Chrome page 2 (the
  layout table is not fragmented; Phase C).
- 3 flagged WPT passes lost vs the head (reported, not gating; listed above).

### What blocks main (pin view (c) 165, `10-final/pin-classification.json`)

Re-counted after rules (i) and (ii) (before: b-provable 103, page-scope 89, c 17, none 8 = 217):

- **b-provable 103** (not entered: the ledger is head debt, GATE-D1, and these are not worse than
  the head): 26 WPT raw-Blitz fails; danfe 41 (26 dx, 15 dy), invoice 35 dx, boleto-febraban 1 dx.
- **page-scope 38**: text-stress-ptbr words on pages ≥ 2 worse than the pin but not than the head
  (29 dy, 4 dx, 5 pairing), so not listed in the scope; closes with pagination (Phase C).
- **c 16**: `oss-sparksuite-invoice` p1 dx −0.23 → −1.73 pt (`Invoice#1`, `#:#1`, `123#1`,
  `Created:#1`, `January#1`, `1,#1`, `2023#1`, `Due:#1`, `February#1`, `1,#2`, `2023#2`,
  `Acme#1`, `Corp.#1`, `John#1`, `Doe#1`, `john@example.com#1`): relaxed (b) fails (|run| 2.307 px >
  |N0| 0). HYPOTHESIS: a right- vs left-aligned Chrome DOM → PDF offset; not measured.
  DANFE-L1d left this group (rule ii).
- **none 8** (no usable vector): `danfe|DANFE-M1|…|excessB` 8.552 → 24.173 (no vector);
  invoice `p2|QTD.#1` and `p3|QTD.#1` dx 1.21 → 4.42 pt (not mapped); invoice p3 `Total#1`, `a#1`,
  `pagar#1`, `R$#14`, `50.724,90#1` dy 1.1 → −1.15 pt (|run − P| 3.52 px > 1.333 px: the vector does
  not describe the PDF). Rule (ii) changed none of these 8.
