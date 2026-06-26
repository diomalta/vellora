//! Post-layout corrections over vellora's own box model.
//!
//! These passes operate only on [`LaidOutBox`], after Blitz has already produced
//! computed layout. Keeping them outside `blitz_engine` prevents browser-compat
//! policy from crowding the module that owns upstream Blitz contact.

use crate::blitz_engine::{LaidOutBox, VisualRect};

const PAINTED_TABLE_CELL_TEXT_RAISE_PX: f64 = 2.0;

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
    shift_range_y(boxes, root_idx, end, dy);
}

fn shift_range_y(boxes: &mut [LaidOutBox], start: usize, end: usize, dy: f64) {
    if dy == 0.0 || start >= end {
        return;
    }
    for b in &mut boxes[start..end] {
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

fn shift_range_x(boxes: &mut [LaidOutBox], start: usize, end: usize, dx: f64) {
    if dx == 0.0 || start >= end {
        return;
    }
    for b in &mut boxes[start..end] {
        b.x += dx;
        for rect in &mut b.visual_rects {
            rect.x += dx;
        }
        for border in &mut b.rounded_borders {
            border.x += dx;
        }
        for run in &mut b.text_runs {
            run.origin_x += dx;
        }
        for image in &mut b.image_runs {
            image.x += dx;
        }
    }
}

pub(crate) fn normalize_collapsed_table_medium_border_insets(boxes: &mut [LaidOutBox]) {
    for i in 0..boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && boxes[i].table_border_collapse {
            let end = subtree_end_by_depth(boxes, i);
            normalize_collapsed_table_medium_border_inset(boxes, i, end);
        }
    }
}

fn normalize_collapsed_table_medium_border_inset(
    boxes: &mut [LaidOutBox],
    table_idx: usize,
    end: usize,
) {
    if table_has_visible_edge_border(&boxes[table_idx]) {
        return;
    }

    let table_depth = boxes[table_idx].depth;
    let table_y = boxes[table_idx].y;
    let table_bottom = boxes[table_idx].y + boxes[table_idx].height;
    let mut cells_top = f64::INFINITY;
    let mut cells_bottom = f64::NEG_INFINITY;
    let mut i = table_idx + 1;

    while i < end {
        match boxes[i].tag.as_deref() {
            Some("table") if boxes[i].depth > table_depth => {
                i = subtree_end_by_depth(boxes, i).min(end);
            }
            Some("td" | "th") => {
                cells_top = cells_top.min(boxes[i].y);
                cells_bottom = cells_bottom.max(boxes[i].y + boxes[i].height);
                i += 1;
            }
            _ => i += 1,
        }
    }

    if !cells_top.is_finite() || !cells_bottom.is_finite() {
        return;
    }

    let top_inset = cells_top - table_y;
    let bottom_inset = table_bottom - cells_bottom;
    if !is_fake_medium_border_inset(top_inset) || !is_fake_medium_border_inset(bottom_inset) {
        return;
    }

    let removed = top_inset + bottom_inset;
    shift_range_y(boxes, table_idx + 1, end, -top_inset);
    shrink_box_block_end(&mut boxes[table_idx], removed);

    let parent_end = containing_subtree_end(boxes, table_idx);
    shift_range_y(boxes, end, parent_end, -removed);
}

/// Horizontal twin of [`normalize_collapsed_table_medium_border_insets`]: Blitz
/// also insets a borderless collapsed table's cell content ~3px on each *inline*
/// edge (a synthetic "medium" border). The vertical pass only strips the block
/// edges; this expands the cell band back out to the table's inline box so left-
/// aligned text reaches the left edge and right-aligned text reaches the right
/// edge, matching Chromium. Must run before the column-distribution passes.
pub(crate) fn normalize_collapsed_table_medium_border_insets_x(boxes: &mut [LaidOutBox]) {
    for i in 0..boxes.len() {
        if boxes[i].tag.as_deref() == Some("table") && boxes[i].table_border_collapse {
            let end = subtree_end_by_depth(boxes, i);
            normalize_collapsed_table_medium_border_inset_x(boxes, i, end);
        }
    }
}

fn normalize_collapsed_table_medium_border_inset_x(
    boxes: &mut [LaidOutBox],
    table_idx: usize,
    end: usize,
) {
    if table_has_visible_edge_border(&boxes[table_idx]) || boxes[table_idx].table_layout_fixed {
        return;
    }

    let table_depth = boxes[table_idx].depth;
    let table_x = boxes[table_idx].x;
    let table_right = boxes[table_idx].x + boxes[table_idx].width;

    let mut cells: Vec<usize> = Vec::new();
    let mut cells_left = f64::INFINITY;
    let mut cells_right = f64::NEG_INFINITY;
    let mut column_count = 0usize;
    let mut any_percent_hint = false;
    let mut i = table_idx + 1;
    while i < end {
        match boxes[i].tag.as_deref() {
            Some("table") if boxes[i].depth > table_depth => {
                i = subtree_end_by_depth(boxes, i).min(end);
            }
            Some("tr") => {
                let row_end = subtree_end_by_depth(boxes, i).min(end);
                let cell_depth = boxes[i].depth + 1;
                let row_cells: Vec<usize> = (i + 1..row_end)
                    .filter(|&j| {
                        boxes[j].depth == cell_depth
                            && matches!(boxes[j].tag.as_deref(), Some("td" | "th"))
                    })
                    .collect();
                let mut row_columns = 0usize;
                for &j in &row_cells {
                    cells.push(j);
                    cells_left = cells_left.min(boxes[j].x);
                    cells_right = cells_right.max(boxes[j].x + boxes[j].width);
                    row_columns += boxes[j].colspan;
                    any_percent_hint |= boxes[j].width_pct_hint.is_some();
                }
                column_count = column_count.max(row_columns);
                i = row_end;
            }
            _ => i += 1,
        }
    }

    // Percent-width tables are re-flowed by `normalize_table_percent_widths`,
    // which sets explicit column widths from the source; leave their geometry to
    // that pass.
    if any_percent_hint {
        return;
    }

    if !cells_left.is_finite() || !cells_right.is_finite() {
        return;
    }
    let left_inset = cells_left - table_x;
    let right_inset = table_right - cells_right;
    if !is_fake_medium_border_inset(left_inset) || !is_fake_medium_border_inset(right_inset) {
        return;
    }

    if column_count >= 3 {
        // Auto/compact tables are re-flowed by `normalize_auto_table_compact_columns`,
        // whose cursor anchors at the inset `row_left`, shifting *every* column
        // right by the inset. A pure left translation removes that uniform shift
        // without touching column widths — a stretch would change them and amplify
        // the compact distribution mismatch (measured: PRECO/TOTAL drift right).
        shift_range_x(boxes, table_idx + 1, end, -left_inset);
        return;
    }

    let band = cells_right - cells_left;
    if !band.is_finite() || band <= 0.0 {
        return;
    }
    // Simple tables (e.g. the 2-column header) are squeezed *symmetrically* (left
    // edge pushed in, right edge pulled in); expand the cell band
    // [cells_left, cells_right] to fill the table inline box [table_x, table_right].
    let scale = (table_right - table_x) / band;

    // Each cell subtree is disjoint, so per-cell transforms are order-independent;
    // capture each cell's pre-transform geometry from immutable inputs.
    for &idx in &cells {
        let old_x = boxes[idx].x;
        let old_width = boxes[idx].width;
        let new_x = table_x + (old_x - cells_left) * scale;
        let new_width = old_width * scale;
        let right_aligned = boxes[idx].text_align_right;
        adjust_subtree_inline_geometry(boxes, idx, new_x, new_width);
        if right_aligned {
            // `adjust_subtree_inline_geometry` shifts text by the left-edge delta;
            // right-aligned text must track the right edge, so add the width delta.
            let dw = new_width - old_width;
            let cell_end = subtree_end_by_depth(boxes, idx);
            for b in &mut boxes[idx..cell_end] {
                for run in &mut b.text_runs {
                    run.origin_x += dw;
                }
            }
        }
    }
}

fn table_has_visible_edge_border(table: &LaidOutBox) -> bool {
    table
        .rounded_borders
        .iter()
        .any(|border| border.stroke_width > 0.0)
        || table.visual_rects.iter().any(|rect| {
            let table_bottom = table.y + table.height;
            let rect_bottom = rect.y + rect.height;
            let spans_inline_edge =
                (rect.x - table.x).abs() <= 0.5 && (rect.width - table.width).abs() <= 0.5;
            let is_edge_stroke = rect.height > 0.0
                && rect.height <= 6.0
                && ((rect.y - table.y).abs() <= 0.5 || (rect_bottom - table_bottom).abs() <= 0.5);
            spans_inline_edge && is_edge_stroke
        })
}

fn is_fake_medium_border_inset(value: f64) -> bool {
    (2.0..=4.5).contains(&value)
}

fn shrink_box_block_end(b: &mut LaidOutBox, amount: f64) {
    if amount <= 0.0 {
        return;
    }
    let old_height = b.height;
    b.height = (b.height - amount).max(0.0);
    for rect in &mut b.visual_rects {
        if (rect.y - b.y).abs() <= 0.5 && (rect.height - old_height).abs() <= 0.5 {
            rect.height = b.height;
        }
    }
    for border in &mut b.rounded_borders {
        if (border.y - b.y).abs() <= 0.5 && (border.height - old_height).abs() <= 0.5 {
            border.height = b.height;
        }
    }
}

pub(crate) fn normalize_painted_table_cell_text_baselines(boxes: &mut [LaidOutBox]) {
    let mut i = 0;
    while i < boxes.len() {
        if boxes[i].tag.as_deref() == Some("tr") {
            let row_end = subtree_end_by_depth(boxes, i);
            let cell_depth = boxes[i].depth + 1;
            let cells: Vec<usize> = (i + 1..row_end)
                .filter(|idx| {
                    boxes[*idx].depth == cell_depth
                        && matches!(boxes[*idx].tag.as_deref(), Some("td" | "th"))
                })
                .collect();
            if cells
                .iter()
                .any(|idx| table_cell_has_own_paint(&boxes[*idx]))
            {
                for idx in cells {
                    let cell_end = subtree_end_by_depth(boxes, idx).min(row_end);
                    shift_text_runs_y(boxes, idx, cell_end, -PAINTED_TABLE_CELL_TEXT_RAISE_PX);
                }
            }
            i = row_end;
        } else {
            i += 1;
        }
    }
}

fn table_cell_has_own_paint(cell: &LaidOutBox) -> bool {
    !cell.visual_rects.is_empty() || !cell.rounded_borders.is_empty()
}

fn shift_text_runs_y(boxes: &mut [LaidOutBox], start: usize, end: usize, dy: f64) {
    if dy == 0.0 || start >= end {
        return;
    }
    for b in &mut boxes[start..end] {
        for run in &mut b.text_runs {
            run.origin_y += dy;
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
    // Per-column occupancy: how many further rows a rowspan from above keeps the
    // column filled. Without this the column cursor resets to 0 every row, so a
    // single-cell continuation row under a `rowspan` lands back in column 0 and
    // overlaps the spanning cell instead of skipping to the first free column.
    let mut occupancy = vec![0usize; column_count];
    for cells in rows {
        let mut column = 0usize;
        for idx in cells {
            while column < column_count && occupancy[column] > 0 {
                column += 1;
            }
            if column >= column_count {
                break;
            }
            let span = boxes[idx].colspan.min(column_count - column).max(1);
            let rows_spanned = boxes[idx].rowspan.max(1);
            let target_x = table_x + track_width * column as f64;
            let target_width = track_width * span as f64;
            adjust_subtree_inline_geometry(boxes, idx, target_x, target_width);
            if rows_spanned > 1 {
                for slot in occupancy.iter_mut().skip(column).take(span) {
                    *slot = (*slot).max(rows_spanned);
                }
            }
            column += span;
        }
        // Consume one row of every active rowspan now that this row is placed.
        for slot in occupancy.iter_mut() {
            *slot = slot.saturating_sub(1);
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

fn containing_subtree_end(boxes: &[LaidOutBox], start: usize) -> usize {
    let depth = boxes[start].depth;
    let Some(parent_idx) = (0..start).rev().find(|idx| boxes[*idx].depth + 1 == depth) else {
        return boxes.len();
    };
    subtree_end_by_depth(boxes, parent_idx)
}

fn subtree_end_by_depth(boxes: &[LaidOutBox], start: usize) -> usize {
    let depth = boxes[start].depth;
    let mut end = start + 1;
    while end < boxes.len() && boxes[end].depth > depth {
        end += 1;
    }
    end
}
