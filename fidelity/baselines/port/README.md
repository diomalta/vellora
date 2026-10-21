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
