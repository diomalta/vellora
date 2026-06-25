//! Post-layout corrections over vellora's own box model.
//!
//! These passes operate only on [`LaidOutBox`], after Blitz has already produced
//! computed layout. Keeping them outside `blitz_engine` prevents browser-compat
//! policy from crowding the module that owns upstream Blitz contact.

use crate::blitz_engine::{LaidOutBox, VisualRect};

pub(crate) fn normalize_vertical_margin_collapse(boxes: &mut [LaidOutBox]) {
    if boxes.is_empty() {
        return;
    }
    let end = boxes.len();
    normalize_vertical_margin_collapse_in_range(boxes, 0, end);
}

fn normalize_vertical_margin_collapse_in_range(
    boxes: &mut [LaidOutBox],
    parent_idx: usize,
    end: usize,
) {
    let child_depth = boxes[parent_idx].depth + 1;
    let mut previous_child: Option<usize> = None;
    let mut cumulative_shift = 0.0;
    let mut i = parent_idx + 1;

    while i < end {
        if boxes[i].depth != child_depth {
            i += 1;
            continue;
        }

        if let Some(prev) = previous_child {
            cumulative_shift += sibling_margin_collapse_amount(&boxes[prev], &boxes[i]);
        }
        if cumulative_shift > 0.0 {
            shift_subtree_y(boxes, i, -cumulative_shift);
        }

        let child_end = subtree_end_by_depth(boxes, i).min(end);
        normalize_vertical_margin_collapse_in_range(boxes, i, child_end);
        previous_child = Some(i);
        i = child_end;
    }
}

fn sibling_margin_collapse_amount(previous: &LaidOutBox, current: &LaidOutBox) -> f64 {
    if !is_margin_collapsible_block(previous) || !is_margin_collapsible_block(current) {
        return 0.0;
    }
    let bottom = previous.margin_bottom.max(0.0);
    let top = current.margin_top.max(0.0);
    if bottom <= 0.0 || top <= 0.0 {
        return 0.0;
    }
    bottom.min(top)
}

fn is_margin_collapsible_block(b: &LaidOutBox) -> bool {
    matches!(
        b.tag.as_deref(),
        Some(
            "address"
                | "article"
                | "aside"
                | "blockquote"
                | "div"
                | "footer"
                | "h1"
                | "h2"
                | "h3"
                | "h4"
                | "h5"
                | "h6"
                | "header"
                | "main"
                | "p"
                | "section"
        )
    )
}

fn shift_subtree_y(boxes: &mut [LaidOutBox], root_idx: usize, dy: f64) {
    if dy == 0.0 {
        return;
    }
    let end = subtree_end_by_depth(boxes, root_idx);
    for b in &mut boxes[root_idx..end] {
        b.y += dy;
        for rect in &mut b.visual_rects {
            rect.y += dy;
        }
        for border in &mut b.rounded_borders {
            border.y += dy;
        }
        for run in &mut b.text_runs {
            run.origin_y += dy;
        }
        for image in &mut b.image_runs {
            image.y += dy;
        }
    }
}

pub(crate) fn normalize_fixed_table_widths(boxes: &mut [LaidOutBox]) {
    let mut i = 0;
    while i < boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && boxes[i].table_layout_fixed {
            let end = subtree_end_by_depth(boxes, i);
            normalize_fixed_table_widths_in_range(boxes, i, end);
            i = end;
        } else {
            i += 1;
        }
    }
}

fn normalize_fixed_table_widths_in_range(boxes: &mut [LaidOutBox], table_idx: usize, end: usize) {
    let table_depth = boxes[table_idx].depth;
    let table_x = boxes[table_idx].x;
    let table_width = boxes[table_idx].width;
    if !table_width.is_finite() || table_width <= 0.0 {
        return;
    }

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

    if column_count < 2 {
        return;
    }

    let track_width = table_width / column_count as f64;
    for cells in rows {
        let mut column = 0usize;
        for idx in cells {
            let span = boxes[idx].colspan.min(column_count - column).max(1);
            let target_x = table_x + track_width * column as f64;
            let target_width = track_width * span as f64;
            adjust_subtree_inline_geometry(boxes, idx, target_x, target_width);
            column += span;
            if column >= column_count {
                break;
            }
        }
    }
}

pub(crate) fn normalize_table_percent_widths(boxes: &mut [LaidOutBox]) {
    let mut i = 0;
    while i < boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") {
            let end = subtree_end_by_depth(boxes, i);
            normalize_table_percent_widths_in_range(boxes, i, end);
            i = end;
        } else {
            i += 1;
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
            compact[column] |= boxes[idx].text_align_right;
            min_widths[column] = f64::max(min_widths[column], intrinsic_cell_width(&boxes[idx]));
        }
    }

    let compact_count = compact.iter().filter(|&&is_compact| is_compact).count();
    if compact_count == 0 || compact_count == column_count {
        return;
    }

    let mut target_widths = current_widths.clone();
    let mut compact_total = 0.0;
    for column in 0..column_count {
        if compact[column] {
            let target = (min_widths[column] * 1.25)
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
    let padding = if cell.text_align_right {
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
    if explicit_width >= row_width {
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
        let is_root = offset == 0;
        adjust_visual_inline_geometry(&mut b.visual_rects, old_x, old_width, dx, dw);
        for border in &mut b.rounded_borders {
            border.x += dx;
            if is_root {
                border.width = (border.width + dw).max(0.0);
            }
        }
        for run in &mut b.text_runs {
            run.origin_x += dx;
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

fn adjust_visual_inline_geometry(
    rects: &mut [VisualRect],
    old_x: f64,
    old_width: f64,
    dx: f64,
    dw: f64,
) {
    let old_right = old_x + old_width;
    for rect in rects {
        let is_full_width = (rect.x - old_x).abs() < 0.5 && (rect.width - old_width).abs() < 0.5;
        let is_right_edge = (rect.x + rect.width - old_right).abs() < 0.5;
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
