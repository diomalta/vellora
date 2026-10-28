# Phase C step 06: forced column breaks in document order (branch phasec/06-col-breaks)

Target: `wpt|css/css-break/flexbox/multi-line-row-flex-fragmentation-045.html`. It passed at the
pin and at 10-integration and was lost when multicol landed (a17ee21, step 05).

All numbers below are INDICATIVE. Environment: local macOS 27.0.1 arm64 (Apple M5 Pro), Node v22.23.2,
rustc 1.96.0, Chrome for Testing 155.0.8059.85, Blitz crates.io 0.3.0-beta.4, WPT checkout
9d8aceec with css/css-multicol added to the sparse checkout. Date: 2026-10-28. No gated run was
made here; the gated run belongs to the merge step.

## Cause (CONFIRMED)

In 045 each of the five 20 px items sits on a flex line of its own in a 20 px column. Every item
has `margin-top: -100px` and `height: 100px`, so each line is 0 px tall and all five lines start
at the container's content top. Every item has `break-before: column`.

Before this step, `pagination::fragment_columns` found forced breaks only by flow y: the box's
border-box top had to lie below the column top. Each item's border box starts 100 px *above* the
column top, so no break was found and all five items stayed in column 1. The step-05 label
"parallel flows" was wrong for this case: these are lines one after another that start at the
same y, not flows side by side.

Chrome 155's screen-mode client rects (probe `p4-045.html`) put item k in column k, at x 8 + 20k, each 100 px
above its column top. This is a 100x100 green square over the red box. Two more probes
(`p1-line.html`, `p3-block.html`) show:
- a forced break on the second item of a row flex line moves the whole line;
- a negative margin after a forced break is kept, in block flow too.

## Change

A forced column break is also taken in **document order**. This applies when:
- the forced box does not start below the column top;
- content before its flex line, in document order, starts above the break;
- the box's break has not been taken already.

The break position is the line's top with any negative top margin taken back out, and never
above the column top. The continuation starts with the forced box's flex line and every box after
it in document order. Those boxes move whole (`split_fragment`'s `tail_from`), keeping their
offset from the break, so a negative margin after the break is kept (CSS Fragmentation 3 §5.2).
Such a column may start at the same flow y as the previous one. Each such break moves at least
one box out of the column, and `MAX_COLUMNS` still caps the work.

Breaks that start below the column top keep the old cut by flow y. A first version moved the boxes
after those breaks whole too, and it lost multi-line-column-flex-fragmentation-029/032 and
multi-line-row-flex-fragmentation-044, so that was narrowed.

Page slicing is unchanged: `slice_oversize` passes `tail_from = None` and `find_cut` was not
touched. Blitz contact, the strict gate, the lint rules and `RULE_ID_TO_CORE_FEATURE` are
untouched. This is not a Blitz bug: Blitz has no multicol at all, and the existing raw canary
`blitz_still_lays_multicol_out_in_one_column` covers that.

## Results

| check | command | result |
|---|---|---|
| css/css-break + css/css-multicol | `node fidelity/wpt/run.mjs css/css-multicol css/css-break --chrome <CfT 155> --expectations none --upstream none --offline`, then the after run with `--chrome-from <before>/results.json` | before (1ae3508, run 20261028T072245Z): css-break 371, css-multicol 122. After (ab07a00, run 20261028T074002Z): 372 / 122. Gained 045 only, 0 lost, 0 other outcome changes. |
| default suites (gated set) | `node fidelity/wpt/run.mjs --raw --chrome-from <c05 run copy 20261028T062527Z>/wpt/results.json --expectations none` | 4414 -> 4415 (run 20261028T074010Z-…-ab07a00). Gained 045 only, 0 lost, 0 other outcome changes over 8047 tests. |
| 9 fixtures | layout_dump twice per fixture, in separate processes (c03-verify-det/det.mjs) | 9/9 byte-identical to each other and to the c05 run copy's vellora.pdf |
| DET-1 on multicol inputs | renderPdf strict, twice, in separate processes | 13/13 byte-identical (045, column-flex 032/054/055/058, the probes, c05's detmc set; transform-018 is rejected `css:transform`, as before) |
| perf (renderPdf, median of 5) | c05-multicol/perf/perf.mjs | forced-1000: 108.2 ms (c05: 106.1). The other rows are within 1 ms of c05, with identical bytes. |

A first version, in which every forced break moved its followers whole, measured
css/css-break 371 -> 369 (+045; -column-029, -column-032, -row-044). An intermediate version with
no record of taken breaks lost column-032: the box whose own break had started column 2 fired again.

New tests (`crates/vellora-core/tests/multicol.rs`) pin Chrome's screen-mode client rects:
- `forced_breaks_at_one_flow_y_each_start_a_column` (045);
- `a_forced_break_in_flow_order_takes_the_whole_flex_line` (p1);
- `a_negative_margin_after_a_forced_break_is_kept_in_block_flow` (p3);
- `many_forced_breaks_at_one_flow_y_stop_at_the_column_cap` (3000 breaks at one y end within the
  cap).

## Still not modelled

- Unforced breaks per parallel flow, that is, each item of a row flex line or each line of a
  column flex container breaking on its own. There is still one cut per column.
- A break taken in document order inside a multi-line *column* flex container also moves the later
  lines whole (they are parallel flows there). No test in the two directories exercises this.
- The probes measure screen layout (`getClientRects`), not Chrome's print output. The print
  evidence is the WPT harness pass of 045.
- HYPOTHESIS, not measured: the document-order rule only counts *boxes* as content before the
  line. If the only content before it is the container's own inline text (line boxes owned by an
  ancestor), it does not fire. The flow-y rule still covers the usual case.
- Not checked: whether a `break-before: page` version of 045 exists among the `-print` flexbox
  tests. The page path was not changed.
- A positive margin after a break below the column top is still dropped. That is the
  pre-step-06 behaviour; it was not re-measured.

Run store (outside the repo): `<run store>/c06-colbreaks/` holds before, after1-3, default1,
final-dirs, final-default, det, detmc, probe, perf-c06.txt and tools.
