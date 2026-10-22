# WPT lost passes at 09: raw-Blitz attribution (2026-10-22)

Branch `phaseb/10-wptraw`. Evidence route for WPT items, which have no layer vector: every test
that is a pass in the pin or the head (`port/00-start`) expectations and not a pass in
`port/09-review-fixes` was rendered again with raw Blitz layout (`run.mjs --raw`,
`fidelity/wpt/README.md` "Raw-Blitz mode") and joined with the committed chain, Chrome and Blitz's
own runner. Local macOS run, **INDICATIVE**.

| field | value |
|---|---|
| date | 2026-10-22 |
| build | `98368b3` (product render = `phaseb/10-base` `9b6caa2`: `crates/` and `packages/` render code unchanged, goldens and byte tests green) |
| host | darwin arm64, macOS 27.0.1, Apple M5 Pro; Node v22.23.2; rustc 1.96.0 |
| WPT | `9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba` (pinned) |
| Chrome | 155.0.8059.85, reused with `--chrome-from` the 09 run copy |
| raw run | `node fidelity/wpt/run.mjs --raw --filter '^(<165 tests>)$' --expectations none --upstream none --keep-pdf --artifacts all --chrome-from ~/.cache/vellora-fidelity/run-all-09-review-fixes-20261021T205223Z/wpt/results.json --out ~/.cache/vellora-fidelity/wpt-raw-10base-98368b3-20261022` |
| table | `node fidelity/gate/wpt-raw-table.mjs` (command in `wpt-raw-table.md`) |

Files: `wpt-raw-table.md` / `.json` (per test: chain outcomes pin, beta4, 00..09, link where the
pass was lost, `outcome`, `rawOutcome`, how raw fails, page counts, Chrome, Blitz runner, class),
`raw-run-outcomes.json` (the run's `outcomes.json`: `results` and `rawOutcomes` of the 165 tests;
its `rawMode` string predates the "no display-list rect merge" wording, the render is the same),
`raw-run-summary.json`.

## Sanity (CONFIRMED)

- The product `outcome` of all 165 tests in this run equals the committed 09 expectation
  (`outcomeEqualsSubject` 165/165): the build measures 09's render.
- Product x raw: `fail` x `fail` 131, `fail` x `pass` 34.
- Views (same sets as the 09 gate reports, `ledger-09/`): pin clean 46 (+ 10 rejections the raw
  route does not judge), head clean 38, flagged passes lost: pin 98, head 5; 165 distinct tests.

## Candidates

| view | tests | a | b | c |
|---|---|---|---|---|
| pin (clean, gating) | 46 | 3 | 29 | 14 |
| head (clean, gating) | 38 | 1 | 7 | 30 |
| pin-flagged (reported) | 98 | 28 | 68 | 2 |
| head-flagged (reported) | 5 | 1 | 2 | 2 |

Rule (`rawCandidateClass`, fidelity/wpt/lib/raw.mjs): Chrome fails the reftest -> (a); raw not a
pass -> (b); raw pass and product not -> (c). Candidates, not gate verdicts.

## Findings (clean views)

1. **(c), 30 tests, owner vellora `pagination::merge_adjacent_rects` (CONFIRMED by ablation).**
   `line-height-{006,007,017,018,028,029,039,040,050,051,058,061,062,083,084,105,106,112}`,
   `{,max-,min-}height-{061,062,072,073}` (all head; 14 also pin). The first raw run
   (`~/.cache/vellora-fidelity/wpt-raw-10base-20261022T2245Z`, raw render still merging rects)
   produced byte-identical PDFs to the product for these tests and failed them; dropping only the
   merge from the raw render (`98368b3`) flips exactly 33 tests raw `fail` -> `pass` (these 30, the
   2 head-flagged `line-height-07{2,3}`, and pin-flagged `position-relative-nested-001`). The merge
   joins same-colour rects up to 4 px apart (`RECT_MERGE_TOLERANCE_PX`): the tests draw two black
   stripes 2 px apart, the product draws one 42 px rect and the 2 px gap disappears. All lost at
   link 01; Blitz's own runner passes them. Why they passed at 00-start is not known yet; the check
   is a layout dump + display list of `line-height-006.xht` at `659db88` vs `8290b06`.
2. **(b), Blitz bump (lost at pin -> beta4; 23 of the 26 pin tests lost there, the other 3 are
   (a)).** Raw fails, in 21 of the 23 with PDFs byte-identical to the product (17) or the same diff
   (4): vellora's corrections play no part at beta.4.
   Blitz's own runner also fails 15 of them (`*-content-display-01[23]`, `block-in-inline-float-
   between-001`, `inline-table-zorder-001`, `float-inside-inline-between-blocks-1`,
   `multi-line-column-flex-fragmentation-05{4,5,8}`, `ruby-003`, `text-align-end-006`,
   `text-justify-and-trailing-spaces-00{3,4}`, `text-wrap-balance-text-indent-001`): strongest
   upstream-owned candidates. Blitz's runner passes 8 (`clear-applies-to-009`, `clear-float-005`,
   `float-in-inline-anonymous-block-with-overflow-hidden`, `between-float-and-text`,
   `float-nowrap-2`, `tab-size-integer-00{1,2,3}`): it builds blitz-dom with `floats` and tolerates
   small differences (dify); the float ones are (b) only relative to vellora's build without
   `floats` (the pin's build had no `floats` either: blitz-dom `2003ba5` keeps `floats` out of its default
   features, CONFIRMED in its Cargo.toml, and vellora builds `default-features = false`),
   `tab-size-integer-*` differ by 26 px at max 119 (HYPOTHESIS: anti-aliasing / sub-pixel tab
   stop). UNVERIFIED: whether the pin-era pass came from Blitz alpha.5 itself or from a vellora
   layer removed since; there is no raw render at the pin.
3. **(b), walk rewrite (lost at link 05, 6 tests; all head, 5 also pin).** `floats-153`,
   `floats-placement-vertical-00{3,4}`, `baseline-block-with-overflow-001`,
   `flex-fragmented-with-float-descendant-001` (screen; Blitz's runner fails all 5) and
   `monolithic-overflow-014-print` (print). Step 05 made the walk read Blitz's box tree the way
   Blitz's painter does; raw keeps that walk and fails. So the 00-start passes came from the old
   DOM-children walk, and Blitz's own layout fails these tests. The print test is weak evidence:
   raw page counts 4:1 vs the product's 2:2 vs Chrome's 4:4, so flat pagination does not show
   who owns it; Blitz's runner (screen paint) passes it.
4. **(b), `zero-width-floats.html` (lost at link 01; pin and head).** Raw PDF byte-identical to the
   product; Blitz's own runner fails it as well (with `floats`). The 00-start pass came from the
   re-stacking paginator that link 01 replaced: Blitz's flow, drawn verbatim, puts one green box
   at y 250 and no box at the top.
5. **(a), 4 tests where Chrome fails the reftest itself**: `inline-formatting-context-001`
   (head, lost at 04, 1 px at max 3), `float-nowrap-8`, `floats-placement-vertical-001a`,
   `hanging-punctuation-first-002` (pin, lost at beta4). Chrome's test != Chrome's reference, so
   the old vellora pass (test = reference) cannot have matched Chrome on both nodes. To carry
   GATE-A1 (a) the entry still needs the ink or page-count comparison against Chrome named there.

## Limits

- Raw keeps the strict gates, the `@page` box, print media, the parser, fonts, images, the box
  walk's placement and painting model (all fills, then strokes, images, text; alpha over white),
  and krilla emit. A defect in those shows up as (b). The walk's placement equals the layout-dump
  `B0`/`L0` layers on the core test probe only.
- Print-mode (b) is weak (flat pagination); print-mode (c) is strong.
- (b) is relative to vellora's Blitz build (`default-features = false`, no `floats`).
- The 10 pin-view rejections (`css:page-varying-width`) are not judged here (same gates in raw).
