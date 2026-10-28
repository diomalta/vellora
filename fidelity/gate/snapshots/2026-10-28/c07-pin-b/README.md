# Phase C 07: the four pin (b) WPT keys fixed by rendering (2026-10-28)

Branch `phasec/07-pin-b`, from `phasec/06-verify` b81811a. Targets: the 4 pin (b) items of the c06
gate report, keys of the step-10 ledger entries `DEBT-10-wpt-1` / `DEBT-10-wpt-2`:

| key | ledger entry | pin | c06 product / raw | this branch |
|---|---|---|---|---|
| `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | DEBT-10-wpt-1 | pass | fail / fail | pass (7ea1685) |
| `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | DEBT-10-wpt-1 | pass | fail / fail | pass (356e0b1) |
| `wpt\|css/CSS2/floats/zero-width-floats.html` | DEBT-10-wpt-2 | pass | fail / fail | pass (86dbaa3) |
| `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | DEBT-10-wpt-1 | pass | fail / fail | pass, ink-flagged (8dbef1b) |

The fifth key of DEBT-10-wpt-1, `floats-placement-vertical-004.xht` (pin fails it), also passes
now (356e0b1). No gated run was made in this step; no `accepted.json`, `DEBT.json` or DEBT-BASE
change. The keys leave the ledger only through rule iii's fixed route at the merge step's shrink.

Every number below is from local macOS arm64, Node v22.23.2, rustc 1.96.0, Blitz crates.io
0.3.0-beta.4, Chrome for Testing 155.0.8059.85, WPT 9d8aceec, 2026-10-28, and is INDICATIVE.
Run store: `~/Repositories/vellora-fidelity-runs/c07-pin-b/` (probe inputs and renders, WPT and
fixture runs, scripts).

## The pin passes were coincidental (CONFIRMED by rendering with the v0.2.0 build)

`c07-pin-b/pin-v0.2.0` (`fidelity/wpt/run.mjs --vellora c05-probe/pin-src/... --xhtml-parser html`):
the pin passes all four, in each case because test and reference degraded the same way.
- floats-placement-vertical-003 and zero-width-floats: the pin built Blitz without its `floats`
  feature (Cargo.toml comment, c04), so every float was an in-flow block in test and reference.
- baseline-block-with-overflow-001: the pin laid every `.outer` inline-block out as a block
  (all `XX` at x = 8 under their box), so no baseline was ever compared.
- flex-fragmented-with-float-descendant-001: no floats and no columns at the pin.

## Causes and fixes (each a compensation with a code comment and a raw-Blitz canary)

1. **Inline-block last baseline** (`inline_block_baseline_shifts`). Taffy 0.15.0 block layout
   reports only a first baseline (`src/compute/block.rs` 758); blitz-dom asks for the last
   (`src/layout/inline.rs` 449-451). Chrome rule measured on 11 variants (`c07-pin-b/baseline`):
   last in-flow line, scroll-container child by its bottom margin edge, tables and empty blocks
   skipped, author raise added. Edit: `vertical-align` raise, re-laid out per nesting level.
   Canary `blitz_still_aligns_an_inline_block_on_its_first_line`.
2. **Float that does not fit beside its line's text** (`trailing_float_wraps`, plus the no-wrap
   edit of `float_avoidance_fixups` generalized). blitz-dom places the float at the line's top
   (`src/layout/inline.rs` 722-765). Chrome: below the line (`c07-pin-b/fl`, 8 variants). Edit:
   the content before trailing floats moves into a block so Blitz lays the floats out after it.
   Canary `blitz_still_places_a_float_beside_a_line_it_does_not_fit`.
3. **Zero-width float clamps a negative margin** (`zero_width_float_margins`). Taffy records
   zero-width floats as obstacles (`src/compute/float.rs` 516-518, 711-727); Blink only clamps
   when the opportunity edge moved (`block_layout_algorithm.cc`, `LayoutNewFormattingContext`).
   Measured on 14 variants (`c07-pin-b/zw`). Edit: margin moved to the other side, box and
   subtree shifted in the walk. Canary `blitz_still_clamps_a_negative_margin_at_a_zero_width_float`.
4. **Floats on several lines and lines with no room** (`float_max_content_caps`,
   `narrow_first_line_drops`). blitz-dom sums all floats into the max-content width
   (`src/layout/inline.rs` 538-582, 595) and uses a line slot whatever its width (678-685,
   699-711). Chrome (screen rects, `c07-pin-b/flexfrag`): flex item 114 px (Blitz 142), the
   reference's inline-block below the 506 px float in column 4 at (489, 41). Canaries
   `blitz_still_sums_floats_across_forced_line_breaks`,
   `blitz_still_lays_a_first_line_out_in_no_room_beside_a_float`.

## Whole-suite effect (`fidelity/wpt/run.mjs --raw --expectations none --chrome-from <10-tip>`)

Default suites, 8047 reftests, outcome diff against the c06 gated run
(`run-all-c06-tip-20261028T084519Z-...-7e6b028/wpt/results.json`): 4545 -> 4553 passes, 0 lost.
Gained: the 4 keys, floats-placement-vertical-004, inline-block-baseline-011,
break-at-end-container-edge-003, pre-wrap-float-001. Intermediate losses found and fixed before
commit: float-nowrap-3 and white-space-processing-048 (their references were laid out like Chrome
first; fix: the no-wrap edit now covers lines that cannot wrap after the float), border-color-001/006
and pre-float-001 (fixes: only floats placed before a block count; `white-space: pre` lines keep
their place, as in Chrome). Crashtests 239/239 ok.

Ink flags: of the 8 gained passes exactly one is flagged, flex-fragmented-with-float-descendant-001
(`ink-displaced-vs-chrome`, `bboxShift 426`, `missingFrac 0.128`); break-at-end-container-edge-003
and pre-wrap-float-001 are clean. vellora's test and reference both match Chrome's on-screen
layout (`getClientRects`: 4 column fragments, flex item 114 px, the float and the inline-block at
(489, 41)). Chrome's PRINT output of the test is anomalous: 96 pages, page 1 holding the first
two columns and 1 px slivers of the column fragments at y = 600, each later page another 1 px
sliver (`c07-pin-b/flexfrag/chrome-800x600/test.pdf`); vellora prints one page with all four
columns (overflow columns inline, as on screen) and paints no `outline`.

Diagnostic gate (not a gated run: c06 run copy with this branch's WPT results swapped in,
`c07-pin-b/diag-c06-fixtures-c07-wpt`, `gate/run.mjs --baseline port/11-phase-c --contract --accept
c06/accepted.json --step 16-phase-c-07-diag`): exit 0, PASS; pin view (a) 5, (b) 1, (c) 0. The
remaining (b) item is flex-fragmented-with-float-descendant-001: a clean pass at the pin and at
the 00-start head, now a flagged pass, "clean pass became suspect", covered by DEBT-10-wpt-1. So
that key cannot leave the ledger by rule iii's fixed route (its head comparison still gates); the
other three keys (and floats-placement-vertical-004) no longer appear in the pin view.

## 9 fixtures

`run-all --only corpus,layout-diff,pdf-probe,doc-aggregate,paint-probe --chrome <CfT 155>
--tools-image vellora-fidelity-tools:baseline-beta4` after each commit: 15/15 vellora PDFs
byte-identical to the c06 gated run; doc-aggregate and paint-probe values equal (only the Chrome
PDF hashes, command and paths differ).
