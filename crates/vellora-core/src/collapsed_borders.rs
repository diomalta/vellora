//! The collapsing border model (CSS 2.1 §17.6.2) on plain data, for the collapsed-border
//! compensation in [`crate::blitz_engine`] (`compensate_collapsed_borders`, which carries the
//! description of the Blitz bug it works around and when to delete it).
//!
//! No Blitz, Stylo or Taffy type appears here: `blitz_engine` reads the computed borders of a
//! `border-collapse: collapse` table, its row groups, rows and cells into a [`TableGrid`], and
//! [`resolve`] returns, per grid edge, the border that wins the conflict (§17.6.2.1), folded
//! per cell side. The compensation then lays the table out in the *separated* model with
//! `border-spacing: 0`, which Blitz 0.3.0-beta.4 lays out like Chrome 155, giving each box on
//! either side of a resolved edge a share of it ([`ResolvedCell::border_widths`],
//! [`table_border_widths`]). That is Chrome's geometry for the collapsed model (CSS 2.1
//! §17.6.2): the full width of every grid line lies between the rows / columns it separates, so
//! the row pitch is content + one collapsed border and every cell's content box is where
//! Chrome's is (repro `collapse_b1`: Chrome table 112, content of row k at 9 + 37 k).
//!
//! Chrome splits each edge exactly in half (cell boxes at y 0.5 / 37.5 / 74.5 for a 1 px edge).
//! Here the box above / to the left of a line takes `ceil(W / 2)` and the one below / to the
//! right `floor(W / 2)`, whole px (Stylo snaps border widths to whole px): Taffy rounds a box's
//! border and padding separately against its cumulative position
//! (`round(c + border) - round(c)`, `round(c + padding) - round(c)`, taffy 0.15
//! `compute/mod.rs` `round_layout_inner`), so a half-px border share put the content of some
//! cells of a row 1 px below the others (receipt items rows, layout-diff 2026-10-27). The split
//! moves only the cell box edges (by 0.5 px for an odd width: backgrounds, the paint origin),
//! never the content or the pitch.
//!
//! Modelled: per-edge conflict resolution between cells, rows, row groups and the table
//! (`hidden` wins; `none` loses; wider wins; then by style, `double`, `solid`, `dashed`,
//! `dotted`, `ridge`, `outset`, `groove`, `inset` in that order; then cell over row over row
//! group over table; then the border offered first, i.e. the one further up and left in an LTR
//! table), row and column spans, holes in the grid, RTL tables (resolved in logical columns:
//! the caller swaps physical left / right with [`mirrored`]).
//!
//! Not modelled (stated, not handled): `<col>`/`<colgroup>` borders; vertical writing modes; a spanning cell whose units along one
//! side resolve to different borders (the side takes the widest unit's border for both layout
//! and paint); Chrome's exact choice of the table's left/right outer width (CSS 2.1 takes the
//! first row's cells; here the widest edge of the whole column line, UNVERIFIED against Chrome
//! for a non-uniform left/right edge); collapsed-border painting details (corner joins are
//! overlapping rectangles; `dashed` / `dotted` edges are painted as segments along each cell's
//! painted rect ([`crate::border_pattern`], Phase C step 04), every other style solid).

/// A border style, ordered by conflict-resolution priority (CSS 2.1 §17.6.2.1 rule 3):
/// `Inset` lowest, `Double` highest. `None` and `Hidden` are handled before the order is used.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) enum EdgeStyle {
    None,
    Inset,
    Groove,
    Outset,
    Ridge,
    Dotted,
    Dashed,
    Solid,
    Double,
    Hidden,
}

/// One computed border side: used width in CSS px (already snapped by Stylo), style, and its
/// opaque sRGB color (`None`: nothing paintable, e.g. fully transparent).
#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct EdgeBorder {
    pub width: f64,
    pub style: EdgeStyle,
    pub color: Option<[u8; 3]>,
}

impl EdgeBorder {
    pub(crate) const NONE: EdgeBorder = EdgeBorder {
        width: 0.0,
        style: EdgeStyle::None,
        color: None,
    };

    /// The width this border occupies in the collapsed model (`none`/`hidden` take none).
    pub(crate) fn used_width(&self) -> f64 {
        match self.style {
            EdgeStyle::None | EdgeStyle::Hidden => 0.0,
            _ => self.width.max(0.0),
        }
    }
}

/// Where a border comes from, by priority (§17.6.2.1 rule 4): a cell's border beats its row's,
/// which beats its row group's, which beats the table's.
#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
enum Origin {
    Table,
    RowGroup,
    Row,
    Cell,
}

/// Side indexes of every `[_; 4]` here.
pub(crate) const TOP: usize = 0;
pub(crate) const RIGHT: usize = 1;
pub(crate) const BOTTOM: usize = 2;
pub(crate) const LEFT: usize = 3;

/// A cell of the grid: its origin slot, spans (clamped to the grid by [`resolve`]) and its own
/// four computed borders `[top, right, bottom, left]`.
#[derive(Clone, Debug)]
pub(crate) struct GridCell {
    pub row: usize,
    pub col: usize,
    pub rowspan: usize,
    pub colspan: usize,
    pub sides: [EdgeBorder; 4],
}

/// A row group spanning rows `first_row..end_row`, with its own borders.
#[derive(Clone, Debug)]
pub(crate) struct GridRowGroup {
    pub first_row: usize,
    pub end_row: usize,
    pub sides: [EdgeBorder; 4],
}

/// A collapsed table as plain data. Cells are in grid order (rows top to bottom, each row's
/// cells left to right: the order Blitz places them in), which is what the "further up and
/// left wins" tie-break relies on.
#[derive(Clone, Debug)]
pub(crate) struct TableGrid {
    pub rows: usize,
    pub cols: usize,
    pub table: [EdgeBorder; 4],
    /// One entry per row: the row's own borders.
    pub row_borders: Vec<[EdgeBorder; 4]>,
    pub groups: Vec<GridRowGroup>,
    pub cells: Vec<GridCell>,
}

/// One cell after resolution: the winning border of each side (the widest of the side's grid
/// units) and whether this cell paints that side (each grid edge is painted once: by the cell
/// below / to the right of it, else by the cell above / to the left).
#[derive(Clone, Copy, Debug, PartialEq)]
pub(crate) struct ResolvedCell {
    pub sides: [EdgeBorder; 4],
    pub paints: [bool; 4],
}

/// `sides` with left and right swapped: physical sides of an RTL table <-> the grid's logical
/// (start / end) columns.
pub(crate) fn mirrored<T: Copy>(sides: [T; 4]) -> [T; 4] {
    [sides[TOP], sides[LEFT], sides[BOTTOM], sides[RIGHT]]
}

impl ResolvedCell {
    /// The cell with left and right swapped ([`mirrored`]).
    pub(crate) fn mirrored(&self) -> ResolvedCell {
        ResolvedCell {
            sides: mirrored(self.sides),
            paints: mirrored(self.paints),
        }
    }

    /// The cell's border widths for layout (physical sides): its share of each resolved
    /// edge, [`lower_share`] of its top and left edges and [`upper_share`] of its bottom and
    /// right ones (the module comment says why not exact halves).
    pub(crate) fn border_widths(&self) -> [f64; 4] {
        let w = self.sides.map(|side| side.used_width());
        [
            lower_share(w[TOP]),
            upper_share(w[RIGHT]),
            upper_share(w[BOTTOM]),
            lower_share(w[LEFT]),
        ]
    }

    /// The rectangles that paint this cell's owned sides, given its border box
    /// `(x, y, width, height)` laid out with [`Self::border_widths`]: each edge's full width
    /// over its grid line (the cell's share inside the box, the rest outside), horizontal
    /// edges extended over the vertical lines so the corners close.
    /// `(x, y, width, height, color)`.
    pub(crate) fn paint_rects(
        &self,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    ) -> Vec<(f64, f64, f64, f64, [u8; 3])> {
        let w = self.sides.map(|side| side.used_width());
        let mut out = Vec::new();
        let mut push = |side: usize, rect: (f64, f64, f64, f64)| {
            if !self.paints[side] || w[side] <= 0.0 {
                return;
            }
            if let Some(color) = self.sides[side].color {
                if rect.2 > 0.0 && rect.3 > 0.0 {
                    let style = match self.sides[side].style {
                        EdgeStyle::Dashed => crate::border_pattern::LineStyle::Dashed,
                        EdgeStyle::Dotted => crate::border_pattern::LineStyle::Dotted,
                        _ => crate::border_pattern::LineStyle::Solid,
                    };
                    let horizontal = side == TOP || side == BOTTOM;
                    for (x, y, w, h) in
                        crate::border_pattern::side_rects(style, w[side], rect, horizontal)
                    {
                        out.push((x, y, w, h, color));
                    }
                }
            }
        };
        let own = self.border_widths();
        let (left, right) = (
            x - (w[LEFT] - own[LEFT]),
            x + width + (w[RIGHT] - own[RIGHT]),
        );
        let (top, bottom) = (
            y - (w[TOP] - own[TOP]),
            y + height + (w[BOTTOM] - own[BOTTOM]),
        );
        push(TOP, (left, top, right - left, w[TOP]));
        push(RIGHT, (x + width - own[RIGHT], top, w[RIGHT], bottom - top));
        push(
            BOTTOM,
            (left, y + height - own[BOTTOM], right - left, w[BOTTOM]),
        );
        push(LEFT, (left, top, w[LEFT], bottom - top));
        out
    }
}

/// The share of a `width` px edge taken by the box below / to the right of its grid line.
pub(crate) fn lower_share(width: f64) -> f64 {
    (width / 2.0).floor()
}

/// The share of a `width` px edge taken by the box above / to the left of its grid line.
pub(crate) fn upper_share(width: f64) -> f64 {
    width - lower_share(width)
}

/// The table's border widths for layout (physical sides) from its outer edge widths
/// ([`Resolved::table_edges`], physical): the table is above its top line and left of its left
/// line, below its bottom line and right of its right line.
pub(crate) fn table_border_widths(edges: [f64; 4]) -> [f64; 4] {
    [
        upper_share(edges[TOP]),
        lower_share(edges[RIGHT]),
        lower_share(edges[BOTTOM]),
        upper_share(edges[LEFT]),
    ]
}

/// The resolution of one table.
#[derive(Clone, Debug)]
pub(crate) struct Resolved {
    /// The widest resolved edge on each outer grid line `[top, right, bottom, left]` (in the
    /// grid's columns; [`table_border_widths`] gives the table's share).
    pub table_edges: [f64; 4],
    /// One entry per [`TableGrid::cells`] entry, same order.
    pub cells: Vec<ResolvedCell>,
    /// Whether any edge of the table has a non-zero width. When none has, Blitz's collapsed
    /// layout is already Chrome's (repro `collapse_b0`: 108 px in both) and nothing is changed.
    pub any_border: bool,
}

/// Whether `new` (from `new_origin`) wins over the current winner `old`. Ties keep `old`, the
/// border offered first (further up and left: [`resolve`] offers cells in grid order).
fn beats(new: &EdgeBorder, new_origin: Origin, old: &EdgeBorder, old_origin: Origin) -> bool {
    if old.style == EdgeStyle::Hidden {
        return false;
    }
    if new.style == EdgeStyle::Hidden {
        return true;
    }
    if new.style == EdgeStyle::None {
        return false;
    }
    if old.style == EdgeStyle::None {
        return true;
    }
    let (nw, ow) = (new.used_width(), old.used_width());
    if nw != ow {
        return nw > ow;
    }
    if new.style != old.style {
        return new.style > old.style;
    }
    new_origin > old_origin
}

struct Edges {
    cols: usize,
    /// Horizontal grid units: `(rows + 1) * cols`, row line `r`, column `c`.
    h: Vec<(EdgeBorder, Origin)>,
    /// Vertical grid units: `rows * (cols + 1)`, row `r`, column line `c`.
    v: Vec<(EdgeBorder, Origin)>,
}

impl Edges {
    fn offer_h(&mut self, line: usize, col: usize, border: EdgeBorder, origin: Origin) {
        let slot = &mut self.h[line * self.cols + col];
        if beats(&border, origin, &slot.0, slot.1) {
            *slot = (border, origin);
        }
    }

    fn offer_v(&mut self, row: usize, line: usize, border: EdgeBorder, origin: Origin) {
        let slot = &mut self.v[row * (self.cols + 1) + line];
        if beats(&border, origin, &slot.0, slot.1) {
            *slot = (border, origin);
        }
    }

    fn h(&self, line: usize, col: usize) -> EdgeBorder {
        self.h[line * self.cols + col].0
    }

    fn v(&self, row: usize, line: usize) -> EdgeBorder {
        self.v[row * (self.cols + 1) + line].0
    }
}

/// The widest of `borders` (ties keep the first): the border a cell side spanning several
/// grid units takes.
fn widest(borders: impl Iterator<Item = EdgeBorder>) -> EdgeBorder {
    borders
        .fold(None::<EdgeBorder>, |best, b| match best {
            Some(best) if best.used_width() >= b.used_width() => Some(best),
            _ => Some(b),
        })
        .unwrap_or(EdgeBorder::NONE)
}

/// Resolve every edge of `grid` (CSS 2.1 §17.6.2.1) and fold the result per cell side.
pub(crate) fn resolve(grid: &TableGrid) -> Resolved {
    let (rows, cols) = (grid.rows, grid.cols);
    let mut edges = Edges {
        cols,
        h: vec![(EdgeBorder::NONE, Origin::Table); (rows + 1) * cols],
        v: vec![(EdgeBorder::NONE, Origin::Table); rows * (cols + 1)],
    };
    let mut occupied = vec![false; rows * cols];
    // Spans clamped to the grid: (row, col, row_end, col_end), exclusive ends.
    let spans: Vec<(usize, usize, usize, usize)> = grid
        .cells
        .iter()
        .map(|cell| {
            let (r0, c0) = (cell.row.min(rows), cell.col.min(cols));
            let r1 = (cell.row + cell.rowspan.max(1)).min(rows).max(r0);
            let c1 = (cell.col + cell.colspan.max(1)).min(cols).max(c0);
            (r0, c0, r1, c1)
        })
        .collect();

    // Offer order is the tie-break order: cells in grid order first, then rows, row groups and
    // the table (a lower origin never wins a tie against a higher one anyway).
    for (cell, &(r0, c0, r1, c1)) in grid.cells.iter().zip(&spans) {
        for r in r0..r1 {
            for c in c0..c1 {
                occupied[r * cols + c] = true;
            }
        }
        for c in c0..c1 {
            edges.offer_h(r0, c, cell.sides[TOP], Origin::Cell);
            edges.offer_h(r1, c, cell.sides[BOTTOM], Origin::Cell);
        }
        for r in r0..r1 {
            edges.offer_v(r, c0, cell.sides[LEFT], Origin::Cell);
            edges.offer_v(r, c1, cell.sides[RIGHT], Origin::Cell);
        }
    }
    for (r, sides) in grid.row_borders.iter().enumerate().take(rows) {
        for c in 0..cols {
            edges.offer_h(r, c, sides[TOP], Origin::Row);
            edges.offer_h(r + 1, c, sides[BOTTOM], Origin::Row);
        }
        edges.offer_v(r, 0, sides[LEFT], Origin::Row);
        edges.offer_v(r, cols, sides[RIGHT], Origin::Row);
    }
    for group in &grid.groups {
        let (first, end) = (group.first_row.min(rows), group.end_row.min(rows));
        if first >= end {
            continue;
        }
        for c in 0..cols {
            edges.offer_h(first, c, group.sides[TOP], Origin::RowGroup);
            edges.offer_h(end, c, group.sides[BOTTOM], Origin::RowGroup);
        }
        for r in first..end {
            edges.offer_v(r, 0, group.sides[LEFT], Origin::RowGroup);
            edges.offer_v(r, cols, group.sides[RIGHT], Origin::RowGroup);
        }
    }
    for c in 0..cols {
        edges.offer_h(0, c, grid.table[TOP], Origin::Table);
        edges.offer_h(rows, c, grid.table[BOTTOM], Origin::Table);
    }
    for r in 0..rows {
        edges.offer_v(r, 0, grid.table[LEFT], Origin::Table);
        edges.offer_v(r, cols, grid.table[RIGHT], Origin::Table);
    }

    let free = |r: usize, c: usize| r >= rows || c >= cols || !occupied[r * cols + c];
    let cells = spans
        .iter()
        .map(|&(r0, c0, r1, c1)| {
            if r0 >= r1 || c0 >= c1 {
                return ResolvedCell {
                    sides: [EdgeBorder::NONE; 4],
                    paints: [false; 4],
                };
            }
            let sides = [
                widest((c0..c1).map(|c| edges.h(r0, c))),
                widest((r0..r1).map(|r| edges.v(r, c1))),
                widest((c0..c1).map(|c| edges.h(r1, c))),
                widest((r0..r1).map(|r| edges.v(r, c0))),
            ];
            let paints = [
                true,
                (r0..r1).any(|r| free(r, c1)),
                (c0..c1).any(|c| free(r1, c)),
                true,
            ];
            ResolvedCell { sides, paints }
        })
        .collect();

    let max_width = |it: &mut dyn Iterator<Item = EdgeBorder>| {
        it.map(|b| b.used_width()).fold(0.0_f64, f64::max)
    };
    let table_edges = [
        max_width(&mut (0..cols).map(|c| edges.h(0, c))),
        max_width(&mut (0..rows).map(|r| edges.v(r, cols))),
        max_width(&mut (0..cols).map(|c| edges.h(rows, c))),
        max_width(&mut (0..rows).map(|r| edges.v(r, 0))),
    ];
    let any_border = edges
        .h
        .iter()
        .chain(edges.v.iter())
        .any(|(b, _)| b.used_width() > 0.0);
    Resolved {
        table_edges,
        cells,
        any_border,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const BLACK: Option<[u8; 3]> = Some([0, 0, 0]);

    fn solid(width: f64) -> EdgeBorder {
        EdgeBorder {
            width,
            style: EdgeStyle::Solid,
            color: BLACK,
        }
    }

    /// The repro grid (`fidelity/upstream-drafts/blitz-collapsed-cell-border-measure`,
    /// `variants.mjs`): 3 rows x 2 columns, every cell with `cell(row, col)` borders.
    fn grid(cell: impl Fn(usize, usize) -> [EdgeBorder; 4], table: [EdgeBorder; 4]) -> TableGrid {
        let mut cells = Vec::new();
        for row in 0..3 {
            for col in 0..2 {
                cells.push(GridCell {
                    row,
                    col,
                    rowspan: 1,
                    colspan: 1,
                    sides: cell(row, col),
                });
            }
        }
        TableGrid {
            rows: 3,
            cols: 2,
            table,
            row_borders: vec![[EdgeBorder::NONE; 4]; 3],
            groups: vec![GridRowGroup {
                first_row: 0,
                end_row: 3,
                sides: [EdgeBorder::NONE; 4],
            }],
            cells,
        }
    }

    /// The collapsed-table height for the repro: the table's top and bottom shares plus, per
    /// row, the cells' content box (36 px: 20 px line + 2 x 8 px padding) or the row's
    /// specified height, and the row's cells' shares. The cells of a row are as tall as its
    /// tallest cell (Chrome stretches them to the row).
    fn table_height(resolved: &Resolved, row_height: Option<f64>) -> f64 {
        let table = table_border_widths(resolved.table_edges);
        let mut height = table[TOP] + table[BOTTOM];
        for row in 0..3 {
            let tallest = resolved.cells[row * 2..row * 2 + 2]
                .iter()
                .map(|cell| {
                    let own = cell.border_widths();
                    36.0 + own[TOP] + own[BOTTOM]
                })
                .fold(0.0_f64, f64::max);
            height += row_height.map_or(tallest, |h| h.max(tallest));
        }
        height
    }

    // Chrome 155 numbers from `fidelity/upstream-drafts/blitz-collapsed-cell-border-measure/
    // results/summary.txt` (CfT 155.0.8059.85, 2026-10-27): table height, first cell y / h.

    #[test]
    fn uniform_cell_borders_give_chromes_rows() {
        // collapse_b1: t 112, first content at 9 (0.5 + 0.5 + 8), pitch 37; collapse_b2: t 116,
        // first content at 10, pitch 38.
        for (b, table, content, pitch) in [(1.0, 112.0, 9.0, 37.0), (2.0, 116.0, 10.0, 38.0)] {
            let r = resolve(&grid(|_, _| [solid(b); 4], [EdgeBorder::NONE; 4]));
            assert!(r.any_border);
            assert_eq!(table_height(&r, None), table, "border {b}");
            let own = r.cells[0].border_widths();
            let first = table_border_widths(r.table_edges)[TOP] + own[TOP] + 8.0;
            assert_eq!(first, content, "border {b}");
            assert_eq!(36.0 + own[TOP] + own[BOTTOM], pitch, "border {b}");
            // Whole px shares that add up to the edge.
            assert_eq!(
                own,
                [
                    b - (b / 2.0f64).ceil(),
                    (b / 2.0f64).ceil(),
                    (b / 2.0f64).ceil(),
                    b - (b / 2.0f64).ceil()
                ]
            );
        }
    }

    #[test]
    fn ten_rows_and_top_bottom_only_and_left_right_only() {
        // collapse_b1_tbonly: 112 (as b1); collapse_b1_lronly: 108 (no vertical border).
        let tb = resolve(&grid(
            |_, _| [solid(1.0), EdgeBorder::NONE, solid(1.0), EdgeBorder::NONE],
            [EdgeBorder::NONE; 4],
        ));
        assert_eq!(table_height(&tb, None), 112.0);
        let lr = resolve(&grid(
            |_, _| [EdgeBorder::NONE, solid(1.0), EdgeBorder::NONE, solid(1.0)],
            [EdgeBorder::NONE; 4],
        ));
        assert_eq!(table_height(&lr, None), 108.0);
        assert_eq!(lr.table_edges, [0.0, 1.0, 0.0, 1.0]);
        assert_eq!(table_border_widths(lr.table_edges), [0.0, 0.0, 0.0, 1.0]);
    }

    #[test]
    fn borderless_cells_change_nothing() {
        // collapse_b0: 108 in both engines; the compensation is skipped.
        let r = resolve(&grid(|_, _| [EdgeBorder::NONE; 4], [EdgeBorder::NONE; 4]));
        assert!(!r.any_border);
        assert_eq!(table_height(&r, None), 108.0);
    }

    #[test]
    fn a_borderless_first_cell_takes_its_neighbours_edges() {
        // collapse_first_cell_borderless: Chrome t 112, c0a 0.5 / 37 (Blitz 114: its gutter
        // comes from the first cell only).
        let r = resolve(&grid(
            |row, col| {
                if (row, col) == (0, 0) {
                    [EdgeBorder::NONE; 4]
                } else {
                    [solid(1.0); 4]
                }
            },
            [EdgeBorder::NONE; 4],
        ));
        assert_eq!(table_height(&r, None), 112.0);
        assert_eq!(r.table_edges[TOP], 1.0);
        // Its right and bottom edges are its neighbours' borders; its top and left the table's
        // outer edge, where no border was offered.
        assert_eq!(r.cells[0].sides[RIGHT].used_width(), 1.0);
        assert_eq!(r.cells[0].sides[BOTTOM].used_width(), 1.0);
        assert_eq!(r.cells[0].sides[TOP].used_width(), 0.0);
    }

    #[test]
    fn the_tables_own_border_is_kept() {
        // collapse_table_border2_cells_none: Chrome t 110, last row 37 tall (Blitz 108: the
        // table's border is overwritten by the first cell's gutter).
        let r = resolve(&grid(
            |_, _| [EdgeBorder::NONE; 4],
            [
                EdgeBorder::NONE,
                EdgeBorder::NONE,
                solid(2.0),
                EdgeBorder::NONE,
            ],
        ));
        assert!(r.any_border);
        assert_eq!(table_height(&r, None), 110.0);
        let last = r.cells[4].border_widths();
        assert_eq!(36.0 + last[TOP] + last[BOTTOM], 37.0);
    }

    #[test]
    fn a_row_height_includes_the_collapsed_border() {
        // collapse_b1_tr_height48: Chrome t 145, rows 48 apart (Blitz 148: gutter on top).
        let r = resolve(&grid(|_, _| [solid(1.0); 4], [EdgeBorder::NONE; 4]));
        assert_eq!(table_height(&r, Some(48.0)), 145.0);
    }

    #[test]
    fn conflict_resolution_follows_css21_17_6_2_1() {
        let dashed = |w| EdgeBorder {
            width: w,
            style: EdgeStyle::Dashed,
            color: Some([9, 9, 9]),
        };
        let hidden = EdgeBorder {
            width: 3.0,
            style: EdgeStyle::Hidden,
            color: BLACK,
        };
        // Wider wins over style; equal width: solid beats dashed; hidden beats everything.
        assert!(beats(&dashed(2.0), Origin::Cell, &solid(1.0), Origin::Cell));
        assert!(beats(&solid(1.0), Origin::Cell, &dashed(1.0), Origin::Cell));
        assert!(!beats(
            &dashed(1.0),
            Origin::Cell,
            &solid(1.0),
            Origin::Cell
        ));
        assert!(beats(&hidden, Origin::Table, &solid(5.0), Origin::Cell));
        assert!(!beats(&solid(5.0), Origin::Cell, &hidden, Origin::Table));
        // Same width and style: a cell's border beats its row's, a row's its table's.
        assert!(beats(&solid(1.0), Origin::Cell, &solid(1.0), Origin::Row));
        assert!(beats(&solid(1.0), Origin::Row, &solid(1.0), Origin::Table));
        // Full tie: the first offered (further up / left) stays.
        assert!(!beats(&solid(1.0), Origin::Cell, &solid(1.0), Origin::Cell));
        // `none` never wins; anything beats `none`.
        assert!(!beats(
            &EdgeBorder::NONE,
            Origin::Cell,
            &solid(0.0),
            Origin::Table
        ));
        assert!(beats(
            &solid(0.0),
            Origin::Table,
            &EdgeBorder::NONE,
            Origin::Cell
        ));

        // In a grid: the receipt's `tfoot tr.total td { border-top: 2px }` under a
        // `tbody td { border-bottom: 1px }` row resolves to 2 px; a hidden cell side removes
        // the edge.
        let r = resolve(&grid(
            |row, _| match row {
                1 => [
                    EdgeBorder::NONE,
                    EdgeBorder::NONE,
                    solid(1.0),
                    EdgeBorder::NONE,
                ],
                2 => [
                    solid(2.0),
                    EdgeBorder::NONE,
                    EdgeBorder::NONE,
                    EdgeBorder::NONE,
                ],
                _ => [EdgeBorder::NONE, EdgeBorder::NONE, hidden, EdgeBorder::NONE],
            },
            [solid(1.0); 4],
        ));
        assert_eq!(r.cells[2].sides[BOTTOM].used_width(), 2.0);
        assert_eq!(r.cells[4].sides[TOP].used_width(), 2.0);
        assert_eq!(r.cells[0].sides[BOTTOM].style, EdgeStyle::Hidden);
        assert_eq!(r.cells[2].sides[TOP].used_width(), 0.0);
    }

    #[test]
    fn spans_and_holes() {
        // 2 x 2 grid: a rowspan-2 cell on the left, one cell top right, a hole bottom right.
        let g = TableGrid {
            rows: 2,
            cols: 2,
            table: [EdgeBorder::NONE; 4],
            row_borders: vec![[EdgeBorder::NONE; 4]; 2],
            groups: Vec::new(),
            cells: vec![
                GridCell {
                    row: 0,
                    col: 0,
                    rowspan: 2,
                    colspan: 1,
                    sides: [solid(1.0); 4],
                },
                GridCell {
                    row: 0,
                    col: 1,
                    rowspan: 1,
                    colspan: 1,
                    sides: [solid(2.0); 4],
                },
            ],
        };
        let r = resolve(&g);
        // The spanning cell's right side is the widest of its two units (2 px from the
        // neighbour above, 1 px of its own below).
        assert_eq!(r.cells[0].sides[RIGHT].used_width(), 2.0);
        // It paints its right side (the hole has no cell to paint it); the top-right cell
        // paints its bottom over the hole and its right on the table edge.
        assert_eq!(r.cells[0].paints, [true, true, true, true]);
        assert_eq!(r.cells[1].paints, [true, true, true, true]);
        // A rowspan past the last row is clamped.
        let mut g2 = g.clone();
        g2.cells[0].rowspan = 9;
        assert_eq!(resolve(&g2).cells[0].sides[BOTTOM].used_width(), 1.0);
    }

    #[test]
    fn interior_edges_are_painted_once() {
        let r = resolve(&grid(|_, _| [solid(1.0); 4], [EdgeBorder::NONE; 4]));
        // Top-left cell: paints top and left; its right and bottom belong to the neighbours.
        assert_eq!(r.cells[0].paints, [true, false, false, true]);
        // Bottom-right cell: paints all four.
        assert_eq!(r.cells[5].paints, [true, true, true, true]);
        // Paint rects of the collapse_b1 top-left cell at its box (1, 1, w 200, h 37: the table
        // takes the whole 1 px of the outer lines): the top edge spans y 0..1, the left edge
        // x 0..1, as in Chrome.
        let rects = r.cells[0].paint_rects(1.0, 1.0, 200.0, 37.0);
        assert_eq!(rects.len(), 2);
        assert_eq!(rects[0], (0.0, 0.0, 201.0, 1.0, [0, 0, 0]));
        assert_eq!(rects[1], (0.0, 0.0, 1.0, 38.0, [0, 0, 0]));
    }
}
