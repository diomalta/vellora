//! Post-layout corrections over vellora's own box model.
//!
//! These passes operate only on [`LaidOutBox`], after Blitz has already produced
//! computed layout. Keeping them outside `blitz_engine` prevents browser-compat
//! policy from crowding the module that owns upstream Blitz contact.

use crate::blitz_engine::{InlineAlign, LaidOutBox, VisualRect};

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

pub(crate) fn normalize_auto_table_compact_columns(boxes: &mut [LaidOutBox]) {
    let mut i = 0;
    while i < boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && !boxes[i].table_layout_fixed {
            let end = subtree_end_by_depth(boxes, i);
            normalize_auto_table_compact_columns_in_range(boxes, i, end);
            i = end;
        } else {
            i += 1;
        }
    }
}

fn normalize_auto_table_compact_columns_in_range(
    boxes: &mut [LaidOutBox],
    table_idx: usize,
    end: usize,
) {
    let table_depth = boxes[table_idx].depth;
    let mut rows: Vec<Vec<usize>> = Vec::new();
    let mut column_count = 0usize;
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
                let row_columns = cells.iter().map(|idx| boxes[*idx].colspan).sum();
                column_count = column_count.max(row_columns);
                rows.push(cells);
                i = row_end;
            }
            _ => i += 1,
        }
    }

    if column_count < 3
        || rows.is_empty()
        || rows
            .iter()
            .flatten()
            .any(|idx| boxes[*idx].colspan != 1 || boxes[*idx].width_pct_hint.is_some())
    {
        return;
    }

    let mut row_left = f64::INFINITY;
    let mut row_right = f64::NEG_INFINITY;
    for row in &rows {
        if row.len() != column_count {
            return;
        }
        for &idx in row {
            row_left = row_left.min(boxes[idx].x);
            row_right = row_right.max(boxes[idx].x + boxes[idx].width);
        }
    }
    let row_width = row_right - row_left;
    if !row_width.is_finite() || row_width <= 0.0 {
        return;
    }

    let mut compact = vec![false; column_count];
    let mut min_widths = vec![0.0; column_count];
    let mut current_widths = vec![0.0; column_count];
    for row in &rows {
        for (column, &idx) in row.iter().enumerate() {
            current_widths[column] = f64::max(current_widths[column], boxes[idx].width);
            compact[column] |= boxes[idx].text_align == InlineAlign::Right;
            min_widths[column] = f64::max(min_widths[column], intrinsic_cell_width(&boxes[idx]));
        }
    }

    let compact_count = compact.iter().filter(|&&is_compact| is_compact).count();
    if compact_count == 0 || compact_count == column_count {
        return;
    }

    let mut target_widths = current_widths.clone();
    let mut compact_total = 0.0;
    let compact_floor = row_width / (column_count as f64 * 2.0);
    for column in 0..column_count {
        if compact[column] {
            let target = (min_widths[column] * 1.25)
                .max(compact_floor)
                .min(current_widths[column])
                .max(min_widths[column]);
            target_widths[column] = target;
            compact_total += target;
        }
    }

    let flexible_columns: Vec<usize> = (0..column_count)
        .filter(|column| !compact[*column])
        .collect();
    let flexible_total = row_width - compact_total;
    if flexible_total <= 0.0 || flexible_columns.is_empty() {
        return;
    }
    let current_flexible_total: f64 = flexible_columns
        .iter()
        .map(|column| current_widths[*column])
        .sum();
    for &column in &flexible_columns {
        target_widths[column] = if current_flexible_total > 0.0 {
            flexible_total * (current_widths[column] / current_flexible_total)
        } else {
            flexible_total / flexible_columns.len() as f64
        };
    }

    for row in rows {
        let mut cursor = row_left;
        for (column, idx) in row.into_iter().enumerate() {
            adjust_subtree_inline_geometry(boxes, idx, cursor, target_widths[column]);
            cursor += target_widths[column];
        }
    }
}

fn intrinsic_cell_width(cell: &LaidOutBox) -> f64 {
    let text_width = cell
        .text_runs
        .iter()
        .map(text_run_width)
        .fold(0.0_f64, f64::max);
    if text_width <= 0.0 {
        return cell.width;
    }

    let left_gap = cell
        .text_runs
        .iter()
        .map(|run| run.origin_x - cell.x)
        .filter(|gap| gap.is_finite() && *gap >= 0.0)
        .fold(f64::INFINITY, f64::min);
    let right_gap = cell
        .text_runs
        .iter()
        .map(|run| cell.x + cell.width - (run.origin_x + text_run_width(run)))
        .filter(|gap| gap.is_finite() && *gap >= 0.0)
        .fold(f64::INFINITY, f64::min);
    let padding = if cell.text_align == InlineAlign::Right {
        right_gap
    } else {
        left_gap
    };
    let padding = if padding.is_finite() { padding } else { 0.0 };
    text_width + padding * 2.0
}

fn text_run_width(run: &crate::blitz_engine::TextRun) -> f64 {
    run.glyphs.iter().map(|glyph| glyph.advance as f64).sum()
}

fn normalize_table_percent_widths_in_range(boxes: &mut [LaidOutBox], table_idx: usize, end: usize) {
    let table_depth = boxes[table_idx].depth;
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
                normalize_row_percent_widths(boxes, &cells);
                i = row_end;
            }
            _ => i += 1,
        }
    }
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
