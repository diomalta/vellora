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
| pin (clean, gating) | 46 | 1 | 31 | 14 |
| head (clean, gating) | 38 | 1 | 7 | 30 |
| pin-flagged (reported) | 98 | 65 | 32 | 1 |
| head-flagged (reported) | 5 | 5 | 0 | 0 |

Rule (`rawCandidateClass`, fidelity/wpt/lib/raw.mjs), evaluated per view: (a) when the view's OLD
pass is proven false in the GATE-A1 sense, test = reference != Chrome by ink (the old
expectations flag it `ink-missing-vs-chrome` / `ink-displaced-vs-chrome`) or by page count (the
old run's test page count != Chrome's, read from the pin / 00-start run copies, `--old-run`);
else (b) when raw is not a pass; else (c) when raw passes. Candidates, not gate verdicts. The
`chrome` column (Chrome's verdict on its own reftest) is supporting evidence only.

## Findings (clean views)

1. **(c), 30 tests, owner vellora `pagination::merge_adjacent_rects` (CONFIRMED by ablation).**
   `line-height-{006,007,017,018,028,029,039,040,050,051,058,061,062,083,084,105,106,112}`,
   `{,max-,min-}height-{061,062,072,073}` (all head; 14 also pin). The first raw run
   (`~/.cache/vellora-fidelity/wpt-raw-10base-20261022T2245Z`, built from `9238743`, raw render
   still merging rects) produced PDFs byte-identical to the product for these tests and failed
   them; dropping only the merge from the raw render flips exactly 33 tests raw `fail` -> `pass`
   (these 30, the head-flagged `line-height-07{2,3}` and the pin-flagged
   `position-relative-nested-001`). The merge joins same-colour rects up to 4 px apart
   (`RECT_MERGE_TOLERANCE_PX`): these tests draw two black stripes 2 px apart, the product draws one
   42 px rect and the 2 px gap disappears (`crates/vellora-core/src/raw_blitz_tests.rs`,
   `flat_pagination_keeps_same_colour_rects_apart`). All lost at link 01; Blitz's own runner
   passes them. Why they passed at 00-start is not known yet; the check is the display list of
   `line-height-006.xht` at `659db88` (00-start) vs `8290b06` (01).
2. **(b), Blitz bump: 26 pin tests lost at pin -> beta4.** Raw fails all 26; in 22 of them the PDFs
   are byte-identical to the product (18) or the diff is the same (4), so vellora's corrections
   play no part at beta.4. Blitz's own runner also fails 16 (`*-content-display-01[23]`,
   `block-in-inline-float-between-001`, `inline-table-zorder-001`,
   `float-inside-inline-between-blocks-1`, `multi-line-column-flex-fragmentation-05{4,5,8}`,
   `ruby-003`, `text-align-end-006`, `text-justify-and-trailing-spaces-00{3,4}`,
   `text-wrap-balance-text-indent-001`, `hanging-punctuation-first-002`): the strongest
   upstream-owned candidates. It passes 10 (`clear-applies-to-009`, `clear-float-005`,
   `float-in-inline-anonymous-block-with-overflow-hidden`, `between-float-and-text`,
   `float-nowrap-2`, `float-nowrap-8`, `floats-placement-vertical-001a`,
   `tab-size-integer-00{1,2,3}`); it builds blitz-dom with `floats` and tolerates small differences
   (dify). The float ones are (b) only relative to vellora's build without `floats` (the pin's
   build had none either: blitz-dom `2003ba5` keeps `floats` out of its default features,
   CONFIRMED in its Cargo.toml, and vellora builds `default-features = false`).
   `tab-size-integer-*` differ by 26 px at max 119 (HYPOTHESIS: anti-aliasing or a sub-pixel tab
   stop). Chrome fails its own reftest for `float-nowrap-8`, `floats-placement-vertical-001a` and
   `hanging-punctuation-first-002`, but their pin passes were clean, 1 page like Chrome's, so they
   are not (a). UNVERIFIED: whether a pin-era pass came from Blitz alpha.5 itself or from a vellora
   layer removed since; there is no raw render at the pin.
3. **(b), walk rewrite: 5 screen tests lost at link 05 (all head, 4 also pin).** `floats-153`,
   `floats-placement-vertical-00{3,4}`, `baseline-block-with-overflow-001`,
   `flex-fragmented-with-float-descendant-001`; Blitz's own runner fails all 5. Step 05 made the
   walk read Blitz's box tree the way Blitz's painter does, and raw keeps that walk and fails, so
   the 00-start passes came from the old DOM-children walk and Blitz's own layout fails these
   tests.
4. **(b), `zero-width-floats.html` (lost at link 01; pin and head).** Raw PDF byte-identical to
   the product; Blitz's own runner fails it as well (with `floats`). The 00-start pass came from
   the re-stacking paginator that link 01 replaced: Blitz's flow, drawn verbatim, puts one green
   box at y 250 and none at the top.
5. **(b), `inline-formatting-context-001.xht` (head only, lost at link 04).** Raw fails with the
   same diff (1 px at max 3). Chrome fails its own reftest and Blitz's runner passes it (dify
   tolerance); the 00-start pass was clean, so it is not (a).
6. **(a), `monolithic-overflow-014-print.html` (pin and head, lost at link 05).** The old passes
   were false by page count: 2 pages at the pin and at 00-start, 4 in Chrome. At 09 the product
   still prints 2:2 and fails; the raw render (flat pagination) prints 4:1.

## Limits

- Raw keeps the strict gates, the `@page` box, print media, the parser, fonts, images, the box
  walk's placement and painting model (all fills, then strokes, images, text; alpha over white),
  and krilla emit. A defect in those shows up as (b). The walk's placement equals the layout-dump
  `B0`/`L0` layers on the core test probe only.
- Print-mode (b) is weak (flat pagination); print-mode (c) is strong.
- (b) is relative to vellora's Blitz build (`default-features = false`, no `floats`).
- The 10 pin-view rejections (`css:page-varying-width`) are not judged here (same gates in raw).
