//! Post-layout corrections over vellora's own box model.
//!
//! These passes operate only on [`LaidOutBox`], after Blitz has already produced
//! computed layout. Keeping them outside `blitz_engine` prevents browser-compat
//! policy from crowding the module that owns upstream Blitz contact.

use crate::blitz_engine::{LaidOutBox, VisualRect};

// `normalize_painted_table_cell_text_baselines` (a constant 2 px raise of the text of painted
// table rows, a corpus compensator for raw Blitz's collapsed-row drift) was retired in Phase C
// step 02 together with that drift: `blitz_engine::compensate_collapsed_borders` lays collapsed
// tables out at Chrome's row pitch, and the raise then put those rows' text 2 px above Chrome's
// (`tests/text_baseline.rs`).

/// Give `width: <percentage>` cells of auto-layout tables their share of the row.
/// Blitz 0.3.0-beta.4 drops a percentage cell width to `auto` unless the table
/// uses the fixed layout, where it resolves the percentage itself (blitz-dom
/// `layout/table.rs`, `collect_table_cells` / `percent_track`) the way Chrome
/// does; so `table-layout: fixed` tables are left alone (port step 03; Chrome
/// probe in `tests/layout_fidelity.rs`).
///
/// Every table is visited, nested ones included, outer before inner (document order); each
/// visit adjusts only that table's own rows. Until port step 10-spark the loop jumped past a
/// table's subtree, so a table nested in another one was never adjusted: every table of
/// `oss-postmark-receipt` (one layout table holds the document) kept Blitz's widths.
pub(crate) fn normalize_table_percent_widths(boxes: &mut [LaidOutBox]) {
    for i in 0..boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && !boxes[i].table_layout_fixed {
            let end = subtree_end_by_depth(boxes, i);
            normalize_table_percent_widths_in_range(boxes, i, end);
        }
    }
}

/// Hand an auto-layout table's spare width to its columns in proportion to their max-content
/// widths, as Chrome does, instead of Blitz's equal share per column.
///
/// BLITZ BUG COMPENSATION (Phase C step 03, 2026-10-27; delete when Blitz fixes it, see below).
/// Blitz 0.3.0-beta.4 lays a `table-layout: auto` table out as a CSS grid whose every column
/// track is `auto` (blitz-dom 0.3.0-beta.4 `src/layout/table.rs` 249-255: percentage columns
/// become `auto`; 293-297: `remaining_column` is `auto` unless the layout is fixed), and Taffy
/// 0.15.0's "stretch auto tracks" step then splits the free space EQUALLY between auto tracks
/// (taffy 0.15.0 `src/compute/grid/track_sizing.rs` 1415-1442, `extra_space_per_auto_track =
/// free_space / num_auto_tracks`). Browsers distribute a table's excess width over its auto
/// columns in proportion to their max-content widths (CSS Tables 3 "distributing excess width
/// to columns"; Chrome's `TableLayoutAlgorithmAuto` / LayoutNG table column distribution).
/// Repro (Chrome for Testing 155.0.8059.85, local macOS, 2026-10-27; `fidelity/gate/snapshots/
/// 2026-10-27/c03/pinc/`): the invoice items table (`width: 100%`, 673 px, four auto columns) has
/// max-content widths 267.922 / 53.328 / 104.172 / 95.297 px (the same table with `width:
/// max-content`); Chrome lays it out at 346.266 / 68.922 / 134.625 / 123.188 = each times
/// 673 / 520.719; raw Blitz at 306 / 92 / 142 / 133 = each plus ~38 px (152.3 / 4). The canary
/// `raw_blitz_tests::blitz_still_shares_auto_table_excess_width_equally` asserts Blitz's
/// numbers and fails when Blitz distributes like Chrome.
///
/// Scope: only when every column is wider than its max-content width in Blitz's layout (the
/// excess case: no cell wraps a line, so moving and resizing the laid-out cells is exact) and
/// every cell's max-content width is known ([`LaidOutBox::max_content_width`]: no specified
/// widths, no nested tables, no inline boxes); every row has one cell per column; no colspan,
/// no percentage width (that is [`normalize_table_percent_widths`]); not `table-layout: fixed`.
/// The gaps between cells (`border-spacing`) are kept.
///
/// Until this step this pass was a heuristic (`compact_columns`: right-aligned columns at 1.25 x
/// their text width, the rest scaled), which put the invoice's QTD. column 6 px right of Chrome
/// at the 673 px layout width (24 px right of raw Blitz's -17.9). The layer keeps its historical
/// name `auto_table_compact_columns` (fidelity tooling keys on it).
///
/// WHEN BLITZ FIXES IT: delete this pass (and its `LAYOUT_NORMALIZE_PASSES` entry),
/// `LaidOutBox::max_content_width` with `blitz_engine::cell_max_content_width` /
/// `block_max_content_width`, and the canary; keep `tests/layout_fidelity.rs`'s Chrome-number
/// table tests, which must then pass on Blitz's own layout.
pub(crate) fn normalize_auto_table_compact_columns(boxes: &mut [LaidOutBox]) {
    for i in 0..boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && !boxes[i].table_layout_fixed {
            let end = subtree_end_by_depth(boxes, i);
            distribute_auto_table_excess(boxes, i, end);
        }
    }
}

fn distribute_auto_table_excess(boxes: &mut [LaidOutBox], table_idx: usize, end: usize) {
    let table_depth = boxes[table_idx].depth;
    let mut rows: Vec<Vec<usize>> = Vec::new();
    let mut i = table_idx + 1;
    while i < end {
        match boxes[i].tag.as_deref() {
            Some("table") if boxes[i].depth > table_depth => {
                i = subtree_end_by_depth(boxes, i).min(end);
            }
            Some("tr") => {
                let row_end = subtree_end_by_depth(boxes, i).min(end);
                let cell_depth = boxes[i].depth + 1;
                let mut cells: Vec<usize> = (i + 1..row_end)
                    .filter(|idx| {
                        boxes[*idx].depth == cell_depth
                            && matches!(boxes[*idx].tag.as_deref(), Some("td" | "th"))
                    })
                    .collect();
                cells.sort_by(|a, b| boxes[*a].x.total_cmp(&boxes[*b].x));
                rows.push(cells);
                i = row_end;
            }
            _ => i += 1,
        }
    }
    let Some(columns) = rows.first().map(Vec::len) else {
        return;
    };
    if columns < 2
        || rows.iter().any(|row| row.len() != columns)
        || rows.iter().flatten().any(|idx| {
            let b = &boxes[*idx];
            b.colspan != 1 || b.width_pct_hint.is_some() || b.max_content_width.is_none()
        })
    {
        return;
    }
    // Column geometry from the first row; every row must agree (one grid).
    let first = &rows[0];
    let lefts: Vec<f64> = first.iter().map(|idx| boxes[*idx].x).collect();
    let widths: Vec<f64> = first.iter().map(|idx| boxes[*idx].width).collect();
    if rows.iter().any(|row| {
        row.iter().enumerate().any(|(c, idx)| {
            (boxes[*idx].x - lefts[c]).abs() > 0.5 || (boxes[*idx].width - widths[c]).abs() > 0.5
        })
    }) {
        return;
    }
    let mut max_content = vec![0.0_f64; columns];
    for row in &rows {
        for (c, idx) in row.iter().enumerate() {
            max_content[c] = max_content[c].max(boxes[*idx].max_content_width.unwrap_or(0.0));
        }
    }
    // The excess case only: Blitz gave every column at least its max-content width.
    if (0..columns).any(|c| widths[c] + 0.5 < max_content[c]) {
        return;
    }
    let total_max: f64 = max_content.iter().sum();
    let total_width: f64 = widths.iter().sum();
    let excess = total_width - total_max;
    // Taffy rounds each column to whole px and the max-content widths are unrounded, so up to
    // 0.5 px per column of "excess" is rounding, not spare width: a shrink-to-fit table
    // (`width: auto`) has none (WPT css/css-tables/baseline-empty-cell-001.html moved its
    // inner border by 1 px when the threshold was 0.5 px for the whole table).
    if total_max <= 0.0 || excess <= 0.5 * columns as f64 + 0.5 {
        return;
    }
    let targets: Vec<f64> = max_content
        .iter()
        .map(|m| m + excess * m / total_max)
        .collect();
    let gaps: Vec<f64> = (1..columns)
        .map(|c| lefts[c] - (lefts[c - 1] + widths[c - 1]))
        .collect();
    for row in rows {
        let mut cursor = lefts[0];
        for (c, idx) in row.into_iter().enumerate() {
            if c > 0 {
                cursor += gaps[c - 1];
            }
            adjust_subtree_inline_geometry(boxes, idx, cursor, targets[c]);
            cursor += targets[c];
        }
    }
}

fn normalize_table_percent_widths_in_range(boxes: &mut [LaidOutBox], table_idx: usize, end: usize) {
    let table_depth = boxes[table_idx].depth;
    let mut rows: Vec<Vec<usize>> = Vec::new();
    let mut i = table_idx + 1;
    while i < end {
        match boxes[i].tag.as_deref() {
            Some("table") if boxes[i].depth > table_depth => {
                i = subtree_end_by_depth(boxes, i).min(end);
            }
            Some("tr") => {
                let row_end = subtree_end_by_depth(boxes, i).min(end);
                let cell_depth = boxes[i].depth + 1;
                let cells: Vec<usize> = (i + 1..row_end)
                    .filter(|idx| {
                        boxes[*idx].depth == cell_depth
                            && matches!(boxes[*idx].tag.as_deref(), Some("td" | "th"))
                    })
                    .collect();
                rows.push(cells);
                i = row_end;
            }
            _ => i += 1,
        }
    }
    if !rows
        .iter()
        .flatten()
        .any(|idx| boxes[*idx].width_pct_hint.is_some())
    {
        return;
    }
    if normalize_column_percent_widths(boxes, &rows) {
        return;
    }
    for cells in &rows {
        normalize_row_percent_widths(boxes, cells);
    }
}

/// The column form of [`normalize_table_percent_widths`]: a percentage `width` on any
/// single-column cell sizes that cell's whole COLUMN, so every row of the table (the
/// `<thead>` row included) gets the same column edges. CSS 2.2 §17.5.2.2 step 1 / CSS Tables 3
/// "column percentage": a column's percentage is the largest percentage of its cells.
///
/// Issue #75: the row form only resized rows holding a percentage cell, so a `width: 50%`
/// set on body cells alone (`td.desc`, no width on the `<th>`) left the header row on Blitz's
/// auto widths and its labels drifted off their columns. Chrome for Testing (Playwright
/// Chromium, viewport 657 px, bundled Liberation fonts, 2026-11-03; repro of the issue in
/// `tests/layout_fidelity.rs` `percent_width_on_body_cells_sizes_the_header_row_too`): header
/// and body cells share x 0 / 328.5 / 386.75 / 506.73 and widths 328.5 / 58.25 / 119.98 /
/// 150.27 px.
///
/// The column grid is Blitz's own (a table is a CSS grid there, so the cells of one column
/// share their left edge; blitz-dom 0.3.0-beta.4 `layout/table.rs` `build_table_context`).
/// A percentage resolves against the sum of the column widths, so `border-spacing` gaps are
/// kept and excluded from the base (Chrome, same probe with `border-collapse: separate;
/// border-spacing: 4px`: the 50 % column is (657 - 5 * 4) / 2 = 318.5 px wide). The width left
/// over goes to the other columns in proportion to their max-content widths when those are
/// known and fit (CSS Tables 3 "distributing excess width to columns"; the probe's 58.25 /
/// 119.98 / 150.27 is 328.5 px split as 35.7 : 73.5 : 92.0, the columns' max-content widths),
/// else in proportion to Blitz's widths, as the row form does.
///
/// Returns `false`, changing nothing, when the grid cannot be read this way: a percentage on a
/// cell spanning several columns, or a column no single-column cell sits in. The caller then
/// falls back to the row form.
fn normalize_column_percent_widths(boxes: &mut [LaidOutBox], rows: &[Vec<usize>]) -> bool {
    let cells: Vec<usize> = rows.iter().flatten().copied().collect();
    if cells
        .iter()
        .any(|idx| boxes[*idx].colspan > 1 && boxes[*idx].width_pct_hint.is_some())
    {
        return false;
    }
    // Column lines: the distinct left edges of the cells.
    let mut lefts: Vec<f64> = cells.iter().map(|idx| boxes[*idx].x).collect();
    lefts.sort_by(f64::total_cmp);
    lefts.dedup_by(|b, a| (*b - *a).abs() < 0.5);
    let columns = lefts.len();
    if columns < 2 {
        return false;
    }
    let column_of = |x: f64| lefts.iter().position(|l| (x - l).abs() < 0.5);

    let mut rights: Vec<Option<f64>> = vec![None; columns];
    let mut percents: Vec<Option<f64>> = vec![None; columns];
    // `Some(None)`: a cell of the column has no known max-content width.
    let mut max_content: Vec<Option<f64>> = vec![Some(0.0); columns];
    for &idx in &cells {
        let b = &boxes[idx];
        let Some(c) = column_of(b.x) else {
            return false;
        };
        if b.colspan > 1 {
            continue;
        }
        let right = b.x + b.width;
        rights[c] = Some(rights[c].map_or(right, |r: f64| r.min(right)));
        if let Some(pct) = b.width_pct_hint {
            percents[c] = Some(percents[c].map_or(pct, |p: f64| p.max(pct)));
        }
        max_content[c] = match (max_content[c], b.max_content_width) {
            (Some(m), Some(w)) => Some(m.max(w)),
            _ => None,
        };
    }
    let Some(rights) = rights.into_iter().collect::<Option<Vec<f64>>>() else {
        return false;
    };
    let widths: Vec<f64> = (0..columns).map(|c| rights[c] - lefts[c]).collect();
    if widths.iter().any(|w| *w <= 0.0) || (1..columns).any(|c| lefts[c] + 0.5 < rights[c - 1]) {
        return false;
    }
    let base: f64 = widths.iter().sum();
    let explicit: f64 = percents.iter().flatten().map(|pct| base * pct).sum();
    // Percentages that over-subscribe the table are left to Blitz, as in the row form.
    if explicit > base + 0.01 {
        return true;
    }

    let flexible: Vec<usize> = (0..columns).filter(|c| percents[*c].is_none()).collect();
    let flexible_width = base - explicit;
    let known_max: Option<Vec<f64>> = flexible.iter().map(|c| max_content[*c]).collect();
    let weights: Vec<f64> = match known_max {
        Some(m) if m.iter().sum::<f64>() > 0.0 && m.iter().sum::<f64>() <= flexible_width => m,
        _ => flexible.iter().map(|c| widths[*c]).collect(),
    };
    let weight_sum: f64 = weights.iter().sum();
    let mut targets: Vec<f64> = widths.clone();
    for (c, pct) in percents.iter().enumerate() {
        if let Some(pct) = pct {
            targets[c] = base * pct;
        }
    }
    for (k, &c) in flexible.iter().enumerate() {
        targets[c] = if weight_sum > 0.0 {
            flexible_width * weights[k] / weight_sum
        } else {
            flexible_width / flexible.len() as f64
        };
    }

    let mut new_lefts = Vec::with_capacity(columns);
    let mut cursor = lefts[0];
    for c in 0..columns {
        if c > 0 {
            cursor += lefts[c] - rights[c - 1];
        }
        new_lefts.push(cursor);
        cursor += targets[c].max(0.0);
    }
    for &idx in &cells {
        let Some(c) = column_of(boxes[idx].x) else {
            continue;
        };
        let last = (c + boxes[idx].colspan.max(1) - 1).min(columns - 1);
        let width = new_lefts[last] + targets[last].max(0.0) - new_lefts[c];
        adjust_subtree_inline_geometry(boxes, idx, new_lefts[c], width.max(0.0));
    }
    true
}

fn normalize_row_percent_widths(boxes: &mut [LaidOutBox], cells: &[usize]) {
    if cells.len() < 2 || !cells.iter().any(|idx| boxes[*idx].width_pct_hint.is_some()) {
        return;
    }

    let row_left = cells
        .iter()
        .map(|idx| boxes[*idx].x)
        .fold(f64::INFINITY, f64::min);
    let row_right = cells
        .iter()
        .map(|idx| boxes[*idx].x + boxes[*idx].width)
        .fold(f64::NEG_INFINITY, f64::max);
    let row_width = row_right - row_left;
    if !row_width.is_finite() || row_width <= 0.0 {
        return;
    }

    let explicit_width: f64 = cells
        .iter()
        .filter_map(|idx| boxes[*idx].width_pct_hint)
        .map(|pct| row_width * pct)
        .sum();
    // Percentages that over-subscribe the row are left to Blitz. Exactly 100% is not
    // over-subscribed (port step 10-spark): `oss-postmark-receipt`'s `width="80%"` /
    // `width="20%"` rows are Chrome's 384 / 96 px, and the `>=` this replaced left them at
    // Blitz's 401 / 79 px (its "Total" label 17.5 px right of Chrome).
    if explicit_width > row_width + 0.01 {
        return;
    }

    let flexible_cells: Vec<usize> = cells
        .iter()
        .copied()
        .filter(|idx| boxes[*idx].width_pct_hint.is_none())
        .collect();
    let flexible_current_width: f64 = flexible_cells.iter().map(|idx| boxes[*idx].width).sum();
    let flexible_width = row_width - explicit_width;

    let mut cursor = row_left;
    for &idx in cells {
        let target_width = if let Some(pct) = boxes[idx].width_pct_hint {
            row_width * pct
        } else if flexible_cells.is_empty() {
            boxes[idx].width
        } else if flexible_current_width > 0.0 {
            flexible_width * (boxes[idx].width / flexible_current_width)
        } else {
            flexible_width / flexible_cells.len() as f64
        };
        let target_width = target_width.max(0.0);
        adjust_subtree_inline_geometry(boxes, idx, cursor, target_width);
        cursor += target_width;
    }
}

/// Move the cell at `root_idx` to `target_x` and give it `target_width`: the cell
/// and its subtree translate by the left-edge change `dx`, and only the cell's
/// own box (and its full-width / right-edge paint) takes the width change `dw`.
///
/// The cell's own text is not re-laid out, so its lines move the way a browser's
/// lines would in the resized cell: by `dx` plus the share of `dw` its computed
/// `text-align` gives them (left 0, center dw/2, right dw; CSS Text 3 §6.1). A
/// right-aligned value thus keeps ending at the cell's content edge (Chrome
/// 155.0.8059.85 probes in `tests/layout_fidelity.rs`, port step 03). Moving it
/// by `dx` alone, as before, slid it off that edge by `dw` (invoice price
/// columns +13.6 px vs Chrome at port step 02). Descendant boxes keep their
/// width, so their own text moves by `dx` only.
fn adjust_subtree_inline_geometry(
    boxes: &mut [LaidOutBox],
    root_idx: usize,
    target_x: f64,
    target_width: f64,
) {
    let old_x = boxes[root_idx].x;
    let old_width = boxes[root_idx].width;
    let dx = target_x - old_x;
    let dw = target_width - old_width;
    let end = subtree_end_by_depth(boxes, root_idx);

    for (offset, b) in boxes[root_idx..end].iter_mut().enumerate() {
        // A descendant exactly as wide as the cell (same left edge and width: an auto-width
        // block with no inline inset, e.g. postmark's `<td width="80%"><p>Total</p></td>`)
        // resizes with it, as the browser's would; a narrower one keeps its width.
        let is_root = offset == 0
            || ((b.x - old_x).abs() < 0.5
                && (b.width - old_width).abs() < 0.5
                && b.image_runs.is_empty()
                && !matches!(b.tag.as_deref(), Some("table" | "img")));
        adjust_visual_inline_geometry(
            &mut b.visual_rects,
            old_x,
            old_width,
            dx,
            dw,
            b.table_border_collapse,
        );
        for border in &mut b.rounded_borders {
            border.x += dx;
            if is_root {
                border.width = (border.width + dw).max(0.0);
            }
        }
        let text_dx = if is_root {
            dx + b.text_align.shift_for_width_change(dw)
        } else {
            dx
        };
        for run in &mut b.text_runs {
            run.origin_x += text_dx;
        }
        for image in &mut b.image_runs {
            image.x += dx;
            if is_root {
                image.width = (image.width + dw).max(0.0);
            }
        }
        b.x += dx;
        if is_root {
            b.width = target_width;
        }
    }
}

/// Move (and, for a rect spanning the box, resize) a box's visual rects with its new inline
/// geometry. `collapsed`: the box is a part of a `border-collapse: collapse` table, whose
/// cells paint their edges centred on the box edges (`blitz_engine::compensate_collapsed_borders`):
/// a rect straddling the box's left / right edge counts as on that edge.
fn adjust_visual_inline_geometry(
    rects: &mut [VisualRect],
    old_x: f64,
    old_width: f64,
    dx: f64,
    dw: f64,
    collapsed: bool,
) {
    let old_right = old_x + old_width;
    for rect in rects {
        let rect_right = rect.x + rect.width;
        let straddles = |edge: f64| collapsed && rect.x < edge && rect_right > edge;
        let on_left = (rect.x - old_x).abs() < 0.5 || straddles(old_x);
        let on_right = (rect_right - old_right).abs() < 0.5 || straddles(old_right);
        let is_full_width = if collapsed {
            on_left && on_right
        } else {
            (rect.x - old_x).abs() < 0.5 && (rect.width - old_width).abs() < 0.5
        };
        let is_right_edge = on_right;
        rect.x += dx;
        if is_full_width {
            rect.width = (rect.width + dw).max(0.0);
        } else if is_right_edge {
            rect.x += dw;
        }
    }
}

fn subtree_end_by_depth(boxes: &[LaidOutBox], start: usize) -> usize {
    let depth = boxes[start].depth;
    let mut end = start + 1;
    while end < boxes.len() && boxes[end].depth > depth {
        end += 1;
    }
    end
}
