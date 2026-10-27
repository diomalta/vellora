# Upstream draft: collapsed-border table cells are sized with their own borders (Blitz)

Status: **DRAFT, NOT SUBMITTED.** Nothing here has been posted. Submitting it needs the user's approval.
Phase C step 1 (`phasec/01-drift-cause`, from `phaseb/10-final-verify` `af1bd4f`), 2026-10-27.

Environment for every number in this file: darwin 27.0.0 arm64 (macOS 27.0.1, Apple M5 Pro),
Node v22.23.2, rustc 1.96.0, Chrome for Testing 155.0.8059.85 (`node fidelity/wpt/install-chrome.mjs`),
blitz-dom 0.3.0-beta.4 (crates.io) and Blitz git `2003ba5` (the published pin, built from
`8009f96` `feat/fidelity-oracles`). Local macOS, so the numbers are INDICATIVE.

## What it explains in the corpus (CONFIRMED, tip run copy `20261023T004510Z`)

Per box, raw Blitz (layout-diff `N0`, unrounded) against Chrome's continuous flow. Command:
`python3 attribution.py <tip copy>/layout-diff boleto notification invoice danfe receipt boleto-febraban`
(writes `results/corpus-attribution.json`). Text boxes and line boxes have dh 0 everywhere; every
height error is in tables.

| fixture | collapsed tables: N0 dh per row | sum of table dh | N0 dy of the last flow box |
|---|---|---|---|
| boleto | +2.04..+2.06 (cells `border: 0.5px` → 1 px), banco-head −1.97 ×2 | +28.92 | +29.00 |
| notification | `.deadline-table` +2.01 (3 rows, `border: 1px`) | +6.02 | +6.33 |
| receipt | items table +1.33 (7 rows) | +9.64 | +9.91 |
| invoice | header table +2.13 (1 row) | +3.20 | +3.26 |
| danfe | +1.0 (rows with a fixed `height`, `0.5pt` borders; mechanism HYPOTHESIS, see note) | see note | +13.69 |
| boleto-febraban | +0.86..+1.7 | | |

- In boleto and notification the sum of the table height deltas is the drift at the bottom of the
  flow, within 0.3 px. Every box before the first collapsed table has dy ≈ 0 and every box after
  it carries the accumulated sum. This is the "error grows down the page".
- danfe's tables sit inside positioned bands, so their dh do not add up to the bottom dy linearly
  (UNVERIFIED which bands absorb it). The +1.0 px per row is HYPOTHESIS: two variants below give
  +1 per row (`collapse_b1_tr_height48`, `collapse_first_cell_borderless`); danfe was matched to the
  first by reading its CSS (`tr.h085` heights), not by measurement.

## Minimal repro (CONFIRMED, both engines measured)

`variants.mjs` generates the documents in `repro/`: 400 px table, `td { padding: 8px }`, Liberation
Serif 10 pt, `line-height: 20px`, so the cell content-plus-padding is 36 px.

```
node chrome.mjs <repo> "<CfT 155 path>" repro             # → repro/chrome.json (moved to results/)
python3 blitz.py <repo>/target/release/examples/layout_dump repro results/blitz-beta4.json beta4
python3 blitz.py /tmp/c01/pin/target/release/examples/layout_dump repro results/blitz-pin.json pin2003ba5
python3 show.py results/<engine>.json t,c0a,c1a,c2a,after  # → results/summary.txt
```

The pin binary: `git archive 8009f96 | tar -x -C /tmp/c01/pin` and then, in that directory,
`cargo build --release --offline -p vellora-core --example layout_dump`. `blitz.py` writes its
intermediate dumps to `/tmp/c01/`.

Cell y / height (px). `t` is the table; `after` is the block after it.

| variant | Chrome 155 rows (y/h) | Chrome table h | Blitz beta.4 rows | Blitz table h | per row |
|---|---|---|---|---|---|
| `collapse_b1` (`td {border:1px}`) | 0.5/37, 37.5/37, 74.5/37 | 112 | 1/38, 40/38, 79/38 | 118 | **+2** |
| `collapse_b1_10rows` | pitch 37 | 371 | pitch 39 | 391 | **+2** (×10 = +20) |
| `collapse_b2` (`2px`) | 1/38, 39/38, 77/38 | 116 | 2/40, 44/40, 86/40 | 128 | **+4** |
| `collapse_b05` (`0.5px`) | as b1 | 112 | as b1 | 118 | +2 |
| `collapse_b1_tbonly` (top+bottom only) | as b1 | 112 | as b1 | 118 | +2 |
| `collapse_b0` | 0/36, 36/36, 72/36 | 108 | identical | 108 | 0 |
| `separate_s0_b1` (`border-spacing:0`) | 0/38, 38/38, 76/38 | 114 | identical | 114 | 0 |
| `separate_s0_b0` | pitch 36 | 108 | identical | 108 | 0 |
| `collapse_first_cell_borderless` | as b1 | 112 | 0/38, 38/38, 76/38 | 114 | +1 |
| `collapse_table_border2_cells_none` | rows at 0/36/72, last 37 tall | 110 | rows at 0/36/72, 36 tall | 108 | table border lost (−2) |
| `collapse_b1_tr_height48` (`tr {height:48px}`) | 0.5/48, 48.5/48, 96.5/48 | 145 | 1/48, 50/48, 99/48 | 148 | +1 |
| `collapse_b1_lronly` (left+right only) | 0/36, 36/36, 72/36 | 108 | identical | 108 | 0 (predicted by the cause below: no vertical border in the measure, gutter 0) |

- The separated model is exact, so the error is specific to `border-collapse: collapse`.
- Text: row 0's text line is exact against Chrome; each later row's text is +2 px per row
  (`textTop` in the JSON; Chrome's value is the glyph content-area top, so compare differences
  against the `separate_s0_b1` row, which is exact in both).
- **Blitz 2003ba5 gives the same cell rects as beta.4 on every variant except
  `collapse_b1_tr_height48` and `collapse_b1_lronly`.** In the first, the pin ignores `tr { height }`
  (38 px rows), and beta.4 honours it but adds the 1 px gutter. In the second, the pin uses a 3 px
  (`medium`) gutter for the `border-style: none` sides (table 120); beta.4's `side_width` (table.rs
  137-166) fixed that. So **beta.4 did not introduce the collapsed-row drift**. The
  published vellora hid it with compensating layers: the 4 px PDF text raise removed in port step
  04 (`baselines/port/README.md`, "Where raw Blitz placed boxes too low, the raise hid part of that
  drift") and the pin-era pagination row stacking. That history comes from the README; it was not
  re-measured here.

## Cause (CONFIRMED: source read + measurement)

blitz-dom 0.3.0-beta.4, `src/layout/table.rs`:

1. **Lines 638-642.** In the collapsed model, the cell's border is zeroed on the *grid-item*
   style that Blitz hands Taffy (`cells[i].style`, returned by `get_grid_child_style`, line 840).
2. **Lines 369-399 and 404-411.** The gutters are the table's `gap`, set to the *first* cell's
   max border width. The table's own `border` is then replaced by that gap.
3. **Lines 814-822, `TableTreeWrapper::compute_child_layout`.** This calls
   `self.doc.compute_child_layout(cell)`. The cell's own block algorithm then reads its container
   style from `get_core_container_style` (`src/layout/mod.rs` 650-664 →
   `node.layout_style[_in]()`). That is stylo_taffy's wrapper (`stylo_taffy` `src/wrapper.rs`
   319, `fn border`), which still has the cell's full computed borders. So the size the grid
   measures for the track is content + padding + **both** borders (38 px). The cell's final
   `Layout` gets `border: 0` from the grid-item style: the dump shows `border [0,0,0,0]`, h 38.
   That is why the text is not pushed down, only the row is taller.
4. The row pitch is therefore `H + 2B` (track) `+ B` (gutter) = `H + 3B`. Chrome is `H + B`.
   That gives +2B per row and +2B on the table: 118 vs 112 at 1 px, 128 vs 116 at 2 px.

Secondary defects in the same model, visible in the corpus (boleto banco-head −1.97 px ×2) and in
the variants:

- Table line 404-411: the table's own border is overwritten by the first-cell gap. A collapsed
  table with `border-bottom: 2px` and borderless cells loses its 2 px.
- Line 387: the gutter width comes from the first cell only. A borderless first cell makes the
  gutter 0 while the other cells still measure with their borders (+1 per row at 1 px).
- With a row `height`, the gutter is added on top of the specified height. Chrome's row height
  includes the collapsed border (+B per row).

Upstream `main` at `fe33b778baaef5375d941c8a4f491f62cbd31d30` (committed 2026-10-27T13:05:24Z;
read-only `gh api repos/DioxusLabs/blitz/contents/packages/blitz-dom/src/layout/table.rs`,
2026-10-27, CONFIRMED): the same code, shifted by one line. Cell border zeroing is at 639-642, the
table border override at 406, and `compute_child_layout` (816-824) still delegates to
`self.doc.compute_child_layout` without overriding the style. So it is not fixed after beta.4. Related open items (read-only GitHub API, 2026-10-27): #386 "Bug: border-collapse
rendered incorrectly" (open), #422 (open PR; fixes the table-border offset part of #386), #504
(phantom 3 px grid / per-edge colours), #1112 (open PR: keep cells' borders when the grid has no
width). In what was read, none of them names the measure-with-own-borders path (UNVERIFIED: search
terms `border-collapse`, `collapse row height`, first 10-20 results).

## Fix route: (B), upstream only

- **(A) excluded.** No UA default or presentational hint produces this geometry. It is the
  collapsed-model algorithm, and author `td { border }` rules win over any UA rule.
- **(C) not attempted in this step.** A vellora pass would have to re-flow everything below each
  collapsed table: shrink each row by the measured excess, then shift every following box,
  including floats and positioned bands such as danfe's. It would also have to reproduce Chrome's
  half-border model, which Blitz's first-cell gutter does not have (see
  `collapse_first_cell_borderless`). And it interacts with two existing compensators that would
  have to be retired in the same change:
  - pagination's `collapsed_table` gap drop (`pagination.rs` `Fragment::collapsed_table`,
    `tests/pagination_gaps.rs` f2: Chrome pitch 21 vs Blitz flow 23)
  - `painted_table_cell_text_baselines` (port step 04: "retire it together with the drift fix")

  A pass that only improves corpus medians is the kind the port has been deleting.
- **Suggested upstream change (DESIGN TARGET, untested).** In `TableTreeWrapper::compute_child_layout`,
  lay a collapsed-model cell out with its border replaced by the grid-item style's (zero), or by
  half the resolved collapsed edge widths. Also keep the table's own border in the
  collapsed-border resolution instead of overwriting it with the first cell's.

## Draft issue text (NOT SUBMITTED)

> **Title:** `border-collapse: collapse`: each table row is 2× the border width taller than in Chrome
>
> In the collapsed border model every row is `2 × border-width` px taller than in Chrome 155
> (only Chrome was measured),
> so content below a table drifts down by `2 × B × rows`.
>
> ```html
> <style>
>   body { margin: 0; font: 13.333px/20px serif }
>   table { width: 400px; border-collapse: collapse }
>   td { padding: 8px; border: 1px solid #000 }
> </style>
> <table>
>   <tr><td>a0</td><td>b0</td></tr>
>   <tr><td>a1</td><td>b1</td></tr>
>   <tr><td>a2</td><td>b2</td></tr>
> </table>
> <div>after</div>
> ```
>
> Chrome 155: cells at y 0.5 / 37.5 / 74.5, height 37, table height 112, `after` at 112.
> Blitz 0.3.0-beta.4: cells at y 1 / 40 / 79, height 38, table height 118, `after` at 118.
> With `border: 2px` the table is 116 in Chrome and 128 in Blitz. With `border-collapse: separate;
> border-spacing: 0` both engines agree (114).
>
> Cause: `layout/table.rs` zeroes the cell border only on the grid-item style given to Taffy. But
> `TableTreeWrapper::compute_child_layout` → `doc.compute_child_layout(cell)` sizes the cell with
> its own stylo style (`get_core_container_style` → `layout_style()`), which still has the
> borders. So the row track is `content + 2B`, and the gutter (`gap` = B) is added on top. The
> cell's final `Layout.border` is 0, so the text is not offset, only the rows grow.
>
> Related: #386, #422, #504, #1112. Also observed: a collapsed table's own border is replaced by
> the first cell's gutter (`border-bottom: 2px` on the table with borderless cells is lost), and with
> `tr { height: 48px }` the gutter is added on top of the row height (Chrome: 48 px pitch, Blitz 49).
