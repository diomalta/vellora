# Phase C step 03: Chrome's LayoutUnit and whole-px text baselines

Branch `phasec/03-layoutunit` from `phasec/02-verify` (9e06be6). Local macOS arm64 (Apple M5 Pro),
Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85, 2026-10-27: every number here is
INDICATIVE (not CI).

## Causes (CONFIRMED by measurement)

1. **LayoutUnit.** Chrome lays boxes out in 1/64 px fixed point; Blitz 0.3.0-beta.4 in unquantised
   f32. Repro set `lu-repro/` (`variants.mjs`, `chrome.mjs` -> `chrome.json`, `blitz.py` ->
   `raw-blitz-vs-chrome.txt` / `product-vs-chrome.txt`). The text-stress-ptbr `table.extrato` row
   is 23.8125 px in Chrome and 23.8520 in Blitz: +0.0395 px a row = `padding: 1mm` x 2 (3.7795 ->
   3.765625, +0.0278) + `line-height: 1.35` at 8.5pt (15.2930 -> 15.28125, +0.0117). That settles
   the "remaining ~0.01 px" of c02: it is the line height (Chrome:
   `LayoutUnit(1.35 * FromFloatRound(font-size))`, truncated). Also measured: negative margins
   truncate toward zero (-1mm -> -3.765625), `line-height: 135%` / px / em is `FromFloatRound`,
   the font size is rounded first (11.34px x 1.35 -> 15.3125), `border-spacing: 1.5mm` is 5 whole
   px, borders already match (Stylo snaps them), percentages are truncated after resolution (not
   modelled), `line-height: normal` already matches.
2. **Row fit tolerance.** With rows at Chrome's pitch, pagination's 12 px table-row fit tolerance
   (a drift absorber from before the compensations) kept text-stress' June `<tbody>`
   (`break-inside: avoid`, ending at 1005 / 994.06 px) on page 3; Chrome moves it to page 4
   (721 words unpaired on pages 3-6). Now 0.5 px (`TABLE_ROW_FIT_SLACK_PX`).
3. **Whole-px baselines.** Chrome prints every text baseline on a whole CSS px of the page
   (8/9 fixtures, 100 % of words; `baseline-snap/` repro: plain, `overflow: hidden`, cells, a
   0.42cm margin, a danfe-like table, the `rounded_badge` test HTML). vellora's baselines were
   whole px of the content box, so a 16mm (60.4724 px) top margin put every word +0.47 px
   (0.35 pt) low; a line Taffy rounded 1 px low then ended at 1.1 pt (> the 1 pt tolerance):
   every one of the 127 previous-link regressions and the invoice/receipt/notification head items
   ended at +1.1 / +1.85 pt = 0.35 pt + 1 or 2 px. danfe is the exception (Chrome glyphs ~0.1 %
   smaller, fractional baselines: HYPOTHESIS, Chrome scales that page to fit; not modelled).

## Product changes

- `blitz_engine::snap_lengths_to_layout_unit` (+ `src/layout_unit.rs`), with the comment, the
  raw-Blitz canary `blitz_still_lays_lengths_out_unquantised` and `layout_unit_snapping_*` tests.
  Inline sizes are not snapped (an ungated WPT run lost 4 clean `width: <n>ch` passes when they
  were; reason in the comment).
- `pagination::TABLE_ROW_FIT_SLACK_PX` 0.5 (was the shared 12 px); page-1 origin rule no longer
  places a first fragment whose flow top is past the page end off the page.
- `pagination::snap_baseline_to_page_px` for body and margin-box text (not the raw render);
  `tests/baseline_snap.rs` pins Chrome's numbers.

## Iteration (layout-diff + pdf-probe, `node fidelity/layout-diff/run.mjs` / `pdf-probe.mjs`)

| state | regressions vs 10-integration | vs 00-start (all DEBT-covered except text-stress) |
|---|---|---|
| 9e06be6 (c02-tip) | 127 (text-stress) | 257 raw |
| + LayoutUnit | 48 (text-stress, June tbody moved page) | 71 |
| + row slack 0.5 | 1 (text-stress p3 `de#18`, +1.1 pt) | 40 |
| + whole-px baselines | 0 | 11 (danfe dx, DEBT-covered) |

Probe suite: page counts and pairs unchanged on all 37 probes, median |dy| 0.15 -> 0 pt. WPT
(ungated, `--chrome-from` the 10-tip copy): per-test outcomes identical to c02-tip (3769 pass;
vs 10-integration 0 clean passes lost, 17 flagged, 77 improvements). DET-1: 9 fixtures x 4
renders (3 concurrent + 1) byte-identical.

Gated run and item-by-item classes: see the section below (added after the run).
