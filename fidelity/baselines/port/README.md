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
- One step, one gated run, one baseline:

  ```sh
  export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
  node fidelity/run-all.mjs --gate --baseline fidelity/baselines/port/<previous step> \
    --chrome-from <wpt results.json> --tools-image vellora-fidelity-tools:baseline-beta4 \
    --out fidelity/results/run-all/<NN-name> [--accept accepted.json]
  # exit 0 = PASS. Then commit the run as the next link (--name takes no "/", so --root carries port/):
  node fidelity/gate/write-baseline.mjs --run fidelity/results/run-all/<NN-name> \
    --root fidelity/baselines/port --name <NN-name> [--accept accepted.json] \
    [--attach <report>=<name>]...
  ```

- **Merge rule.** The step merges only when its gate is PASS. A chain step is never written with
  `--force`: `manifest.json gate.writtenDespiteVerdict` must be `false` and
  `gate.baseline` must name the previous step. A value that gets worse beyond its tolerance passes
  only as an `acceptedRegressions` entry (`--accept`: key, `after`, reason, evidence) that PROVES
  the old value was wrong (false pass, oracle artefact) with Chrome + WeasyPrint consensus or WPT
  reference analysis (GATE-A1); the writer copies the list into `manifest.json`, and the same list
  goes into the step's commit message. The run's code-checks step must be green (GATE-C1:
  `cargo test --workspace`, `npm run test:ts`, `npm run lint`, `npm --prefix fidelity test`).
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
  `~/.cache/vellora-fidelity/run-all-<NN-name>-<runId>` so later steps can re-gate or reuse it.
- **Committed-data check.** `fidelity/gate/test/committed-canary.test.mjs` re-checks `00-start`
  (integrity, PASS vs `beta4-gated`, no `--force`); a new link should add the same assertion
  against its predecessor.

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
- **Layer proof.** In this run, every layout-diff text run's final-layer y equals raw Blitz's B0
  placement, or B0 − 2 px (the kept pass). No other vellora layer moves text y.

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
