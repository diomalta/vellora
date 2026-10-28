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

## The gated run (one), 8a7c686

`node fidelity/run-all.mjs --gate --main --raw --chrome <CfT 155.0.8059.85> --baseline
fidelity/baselines/port/10-integration --chrome-from <10-tip copy>/wpt/results.json --tools-image
vellora-fidelity-tools:baseline-beta4 --out fidelity/results/run-all/c03-lu`: runId
20261028T004705Z, exit 3, 0 steps errored, oracle canaries 35/35. Durable copy:
`~/Repositories/vellora-fidelity-runs/run-all-c03-lu-20261028T004705Z-blitz-0.3.0-beta.4-vellora-8a7c686`.

Its own gate (`gate-report-c03-run.json.gz`) carries the 9e06be6 ledger, whose `measured` values
are the c02 run's: 169 GATE-D7 problems (the expected stale-ledger failure). Post-hoc, no re-render:

1. `gate/run.mjs ... --debt <empty ledger> --step 12-layoutunit --contract` ->
   `gate-report-c03-nodebt.json.gz`: vs 10-integration **0 regressions**; head 22 = 8 WPT + 11
   danfe dx + 3 postmark artefacts; pin (c) 98.
2. Ledger shrink (only shrink): every DEBT key that is no longer a head-gating item is removed with
   a `closed[]` record (169), the rest keep their entry with `measured` = the run's value and a
   ceiling never raised: 10 entries / 180 keys -> **2 entries / 11 keys** (danfe dx). The c02
   ledger is frozen in `../c02/DEBT-c02.json`. Rule iii tension (unchanged from c02, needs the
   user's decision): `debt.mjs check --base ../c02/DEBT-c02.json` lists the 169 removals as
   "removed before its closesAt"; against the configured base (main, no ledger) 0 problems.
3. `gate/run.mjs ... --step 12-layoutunit --accept ../../2026-10-22/10-spark/accepted.json
   --contract` -> `gate-report-c03-contract.{json.gz,md}` (the shrunk ledger, the 3 class-a
   postmark acceptances of step 10): gating 88 = pin (c) 87 + contract pages 1; vs 10-integration
   0 regressions (improvement 2362, within-tolerance 527, 17 flagged WPT passes lost, reported);
   head: head-regression 8, debt 11, accepted 3; ledger no problem; gate canaries 29/29.

### Exit contract

| condition | c02-tip | c03 |
|---|---|---|
| (1) pin `--main` (c) = 0 | 193 | **87**: invoice dx 37 (b-provable 35, none 2: p2/p3 `QTD.`), WPT 32 (b-provable 26, b 5, none 1), sparksuite dx 16 (c), danfe dx 2 (b-provable) |
| (2) doc aggregate >= pin | MET 9/9 | MET 9/9 (`doc-aggregate-c03.json`; text-stress median 0.40 -> 0.08 mm) |
| (3) pages == Chrome | 8/9 | 8/9 (oss-postmark-receipt 1 vs 2) |
| (4) previous-link ratchets | 127 + 88 head | **0** vs 10-integration; head 8 (WPT: 7 fail the same way in raw Blitz, GATE-A3 b; `monolithic-overflow-014-print` does not) |

Every pin (c) item left is horizontal (dx) or WPT: no dy item remains.

### The 127 and the 88, item by item (`c02-items-by-class.json`)

The 127 previous-link regressions (all text-stress-ptbr dy, c02 +1.1 / +1.85 / +1.03 pt) now:
109 at 0 pt, 17 at -0.75 pt, 1 at +0.75 pt; gate class improvement 110, within-tolerance 5, no
item (equal to the 10-integration value within 1e-9) 12; none gates. Cause class: LayoutUnit row
pitch (all) + whole-px baselines (all) + the June `<tbody>` page move (the p4-p6 words, through
the 12 px row slack once the rows were right).

The 88 head items: text-stress 50, receipt 14, invoice 13 -> all |dy| <= 1 pt (0 or -0.75), no
head item; postmark 3 -> accepted (class a of step 10, `10-spark/accepted.json`); WPT 8 -> still
fail, raw Blitz fails the same way (`rawOutcome` fail at this commit): `floats-153`,
`floats-placement-vertical-003/-004`, `zero-width-floats`, `baseline-block-with-overflow-001`,
`inline-formatting-context-001`, `flex-fragmented-with-float-descendant-001`,
`monolithic-overflow-014-print` (raw page counts [4,1] vs product [2,2]: not the same failure).
