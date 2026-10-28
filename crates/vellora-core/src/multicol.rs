//! Multi-column layout (CSS Multi-column Layout 1; Phase C step 05).
//!
//! Blitz 0.3.0-beta.4 / Taffy 0.15.0 have no multi-column layout: a `columns` / `column-count` /
//! `column-width` container is laid out as one block, its content running the full width (Stylo
//! computes the properties, nothing reads them; raw-Blitz canary `raw_blitz_tests.rs`
//! `blitz_still_lays_multicol_out_in_one_column`). vellora lays the container out in two parts:
//!
//! 1. `blitz_engine` (the only Blitz contact) narrows the container's content box to one column
//!    width before layout ([`column_geometry`] decides the column count and width, §3.4; a
//!    shrink-to-fit container is first widened to N columns of its content's width), so Blitz
//!    lays the content out as one tall column, and, for a container whose height Blitz would size
//!    to its content, gives it the balanced column height ([`balanced_height`]) so what follows
//!    the container is laid out below the columns;
//! 2. this module (no Blitz types) cuts that one tall column into columns with the paginator's
//!    slicer ([`crate::pagination::fragment_columns`]: break points between lines and boxes,
//!    truncation of the space at a break, forced `break-before/after: column` (also taken in
//!    document order where a cut by flow y cannot separate the boxes: step 06,
//!    [`crate::pagination::fragment_columns`]), `break-before/after: avoid`, `orphans` / `widows` as declared, `contain: size` boxes monolithic, sliced
//!    box decorations) and moves each column into place, side by side, each edge rounded as
//!    Taffy rounds it ([`apply`]). Absolutely positioned boxes take no part in the breaks: those
//!    positioned against the container (or above it) stay where Blitz put them; the others are
//!    placed in their containing block's column fragments.
//!
//! Balancing ([`balance`]) is the least column height (to 1/64 px) at which the content takes at
//! most N columns without overflowing one, never less than its tallest unbreakable piece.
//!
//! Every map here (`HashMap` / `HashSet`) is lookup-only: no output order depends on iterating
//! one (DET-1).
//!
//! Not modelled (documented in COMPATIBILITY.md): `column-span: all` (the spanner stays in the
//! column flow), `column-rule` (not painted), a multi-column container inside another one (laid
//! out in one column), a multi-column container that is itself broken across pages (its columns
//! are fragmented by the paginator as one block), vertical writing modes, and unforced breaks
//! in parallel flows (row flex items, the lines of a column flex container, table cells): one
//! cut for the whole column, where Chrome breaks each flow on its own.

use std::collections::{HashMap, HashSet};

use crate::blitz_engine::LaidOutBox;
use crate::pagination::fragment_columns;

/// The used column count and width of a multi-column container (CSS Multi-column Layout 1
/// §3.4, "The pseudo-algorithm"): `available` is the container's content-box width, `count`
/// its `column-count` (`None` = `auto`), `width` its `column-width` (`None` = `auto`), `gap`
/// its used `column-gap`. Returns `(N, W)`, or `None` when both are `auto` (not a multi-column
/// container). The width is truncated to Chrome's layout unit (1/64 px), as Blink computes it.
pub(crate) fn column_geometry(
    available: f64,
    count: Option<u32>,
    width: Option<f64>,
    gap: f64,
) -> Option<(usize, f64)> {
    let u = available.max(0.0);
    let (n, w) = match (count, width) {
        (None, None) => return None,
        (Some(count), None) => {
            let n = count.max(1) as f64;
            (n, ((u - (n - 1.0) * gap) / n).max(0.0))
        }
        (None, Some(width)) => {
            let n = ((u + gap) / (width + gap)).floor().max(1.0);
            (n, ((u + gap) / n - gap).max(0.0))
        }
        (Some(count), Some(width)) => {
            let n = (count.max(1) as f64).min(((u + gap) / (width + gap)).floor().max(1.0));
            (n, ((u + gap) / n - gap).max(0.0))
        }
    };
    let n = if n.is_finite() { n as usize } else { 1 };
    Some((n.max(1), (w * 64.0).floor() / 64.0))
}

/// One multi-column container, as `blitz_engine` laid it out (the content box already one
/// column wide).
#[derive(Debug, Clone)]
pub(crate) struct Multicol {
    /// The container's node id ([`LaidOutBox::node_id`]).
    pub node_id: usize,
    /// Used column count and width ([`column_geometry`]) and `column-gap` (px).
    pub count: usize,
    pub column_width: f64,
    pub gap: f64,
    /// The container's content-box top (absolute flow y).
    pub content_top: f64,
    /// The column height: the container's content-box height when it is definite (`height`
    /// set, or the balanced height `blitz_engine` gave a content-sized container).
    pub height: f64,
    /// `column-fill: auto` (fill each column to `height`; else `balance`).
    pub fill_auto: bool,
    /// The container's height was sized by its content (`height: auto`; `blitz_engine` set the
    /// balanced height).
    pub content_sized: bool,
    /// `direction: rtl`: the first column is the right-most one.
    pub rtl: bool,
    /// Absolutely positioned boxes of the subtree whose containing block is the container or an
    /// ancestor of it: they are positioned against the container, not in a column (CSS
    /// Multi-column Layout 1 §2; Chrome 155, WPT css/css-break/flexbox/
    /// multi-line-column-flex-fragmentation-054: an abspos child of a `position: relative`
    /// container covers column 2 at `left: 50px`). Each stays where it was laid out, with its
    /// subtree.
    pub positioned_outside: HashSet<usize>,
    /// The containing block (node id) of every other absolutely positioned box of the subtree:
    /// such a box is positioned in its containing block's fragments ([`apply`]).
    pub positioned_cb: HashMap<usize, usize>,
    /// The declared (inherited) `orphans` and `widows` of the subtree's boxes that have one
    /// (`None`: the initial value, 2).
    pub orphans_widows: HashMap<usize, (Option<u32>, Option<u32>)>,
    /// The unrounded absolute left and right edges of every box of the subtree (Taffy's
    /// `unrounded_layout`). A box moved to column `k` gets the edges Taffy's rounding would give
    /// it there (`round(edge + k * pitch)`), not its column-1 edges moved by a rounded offset:
    /// three 33.33 px columns are 33, 34 and 33 px wide in Chrome 155 (WPT
    /// multi-line-column-flex-fragmentation-058) and in Taffy's rounding.
    pub unrounded_x: HashMap<usize, (f64, f64)>,
}

/// The flow of a multi-column container's subtree (`subtree[0]` is the container): a stand-in
/// root for the container (no paint, spanning the content box from `content_top`) followed by
/// every box that flows in its columns, in order. The boxes left out (the container and the
/// [`Multicol::positioned_outside`] subtrees) are returned apart, and so are the absolutely
/// positioned subtrees whose containing block is inside the columns: they take no part in the
/// column breaks (they are out of flow) and are placed in their containing block's fragments
/// ([`apply`]). They do count for the balancing: `balanced` is the flow with them in place.
struct Split {
    flow: Vec<LaidOutBox>,
    balanced: Vec<LaidOutBox>,
    kept: Vec<LaidOutBox>,
    positioned: Vec<Vec<LaidOutBox>>,
}

fn split_flow(subtree: &[LaidOutBox], mc: &Multicol) -> Split {
    // The container's own line boxes (an inline root's text) flow in its columns too.
    let mut root = subtree[0].clone();
    root.visual_rects.clear();
    root.rounded_borders.clear();
    root.break_inside_avoid = false;
    root.break_before_page = false;
    root.break_before_column = false;
    root.y = mc.content_top;
    if let Some(&(orphans, widows)) = mc.orphans_widows.get(&root.node_id) {
        root.orphans = orphans;
        root.widows = widows;
    }
    let mut flow = vec![root];
    let mut balanced = flow.clone();
    let mut kept = Vec::new();
    let mut positioned: Vec<Vec<LaidOutBox>> = Vec::new();
    // The depth of the out-of-flow subtree being copied, and whether it stays outside.
    let mut inside: Option<(usize, bool)> = None;
    for b in &subtree[1..] {
        if let Some((_, outside)) = inside.filter(|&(depth, _)| b.depth > depth) {
            if outside {
                kept.push(b.clone());
            } else if let Some(last) = positioned.last_mut() {
                last.push(b.clone());
                balanced.push(b.clone());
            }
            continue;
        }
        inside = None;
        if mc.positioned_outside.contains(&b.node_id) {
            inside = Some((b.depth, true));
            kept.push(b.clone());
            continue;
        }
        if b.out_of_flow {
            inside = Some((b.depth, false));
            positioned.push(vec![b.clone()]);
            balanced.push(b.clone());
            continue;
        }
        let mut b = b.clone();
        if let Some(&(orphans, widows)) = mc.orphans_widows.get(&b.node_id) {
            b.orphans = orphans;
            b.widows = widows;
        }
        balanced.push(b.clone());
        flow.push(b);
    }
    for list in [&mut flow, &mut balanced] {
        let lines = list[0]
            .text_runs
            .iter()
            .map(|run| run.origin_y + run.line_below)
            .chain(list[0].image_runs.iter().map(|img| img.y + img.height));
        let bottom = list
            .iter()
            .skip(1)
            .map(|b| b.y + b.height)
            .chain(lines)
            .fold(mc.content_top, f64::max);
        list[0].height = bottom - mc.content_top;
    }
    Split {
        flow,
        balanced,
        kept,
        positioned,
    }
}

/// The column height of a `column-fill: balance` container: the least height (to 1/64 px) at
/// which its flow takes at most `count` columns, capped by `limit` (a definite height; the
/// content then fills columns of that height). A flow that needs more than `count` columns at
/// any height (forced breaks) gets its full height.
fn balance(flow: &[LaidOutBox], top: f64, count: usize, limit: Option<f64>) -> f64 {
    let full = flow[0].height.max(0.0);
    let cap = limit.map_or(full, |l| l.min(full));
    // A height works when the flow takes at most `count` columns and none of them overflows
    // (a line or other monolithic content taller than the room left moves to the next column;
    // Taffy's whole-px boxes count to the 1/64 px).
    let works = |height: f64| {
        let pieces = fragment_columns(flow.to_vec(), top, height);
        pieces.len() <= count && pieces.iter().all(|p| p.extent() <= height + 1.0 / 64.0)
    };
    if count <= 1 || !works(cap) {
        return limit.unwrap_or(full);
    }
    let mut lo = (full / count as f64)
        .max(crate::pagination::tallest_unbreakable(flow))
        .min(cap);
    let mut hi = cap;
    if works(lo) {
        hi = lo;
    }
    while hi - lo > 1.0 / 64.0 {
        let mid = (lo + hi) / 2.0;
        if works(mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    (hi * 64.0).ceil() / 64.0
}

/// The balanced column height of a multi-column container whose height is sized by its content
/// (`blitz_engine` sets it as the container's height before the final layout). `subtree` is the
/// container's laid-out subtree with its content one column wide.
///
/// With `column-fill: auto` the columns are not balanced: a content-sized container keeps all of
/// its content in the first column (Chrome 155: WPT css/css-break/widows-orphans-017, "an
/// auto-height multicolumn container with column-fill: auto" fills one column).
pub(crate) fn balanced_height(subtree: &[LaidOutBox], mc: &Multicol, fill_auto: bool) -> f64 {
    let split = split_flow(subtree, mc);
    if fill_auto {
        return split.flow[0].height.max(0.0);
    }
    // Absolutely positioned boxes in the columns count (Chrome 155 makes a two-column
    // container 200 px tall for two 100 px blocks and a 100 px abspos after them, WPT
    // css/css-break/out-of-flow-in-multicolumn-094).
    balance(&split.balanced, mc.content_top, mc.count, None)
}

/// Lay every multi-column container of `boxes` out in columns (see the module comment). Each
/// container's subtree is replaced by the container, its columns' boxes (column order) and the
/// boxes positioned against it. Containers nested inside another one are left as they are.
pub(crate) fn apply(boxes: &mut Vec<LaidOutBox>, containers: &[Multicol]) {
    if containers.is_empty() {
        return;
    }
    let by_id: HashMap<usize, &Multicol> = containers.iter().map(|m| (m.node_id, m)).collect();
    let mut out = Vec::with_capacity(boxes.len());
    let mut i = 0;
    while i < boxes.len() {
        let Some(mc) = by_id.get(&boxes[i].node_id) else {
            out.push(boxes[i].clone());
            i += 1;
            continue;
        };
        let end = subtree_end(boxes, i);
        let subtree = &boxes[i..end];
        let Split {
            flow,
            balanced,
            kept,
            positioned,
        } = split_flow(subtree, mc);
        let height = if mc.fill_auto {
            mc.height
        } else {
            balance(&balanced, mc.content_top, mc.count, Some(mc.height))
        };
        let pieces = fragment_columns(flow, mc.content_top, height);
        let tops: Vec<f64> = pieces.iter().map(|p| p.flow_top).collect();
        // One container box: its own paint, and its own line boxes gathered from every column.
        let mut container = subtree[0].clone();
        container.text_runs.clear();
        container.image_runs.clear();
        let mut columns = Vec::new();
        // Each column's boxes in flow coordinates (where the containing blocks are found).
        let placed_flow: Vec<Vec<LaidOutBox>> = pieces.iter().map(|p| p.boxes.clone()).collect();
        for (k, piece) in pieces.into_iter().enumerate() {
            let mut placed = place_column(piece.boxes, piece.flow_top, k, mc);
            if !placed.is_empty() {
                let root = placed.remove(0);
                container.text_runs.extend(root.text_runs);
                container.image_runs.extend(root.image_runs);
            }
            columns.extend(placed);
        }
        // An absolutely positioned box whose containing block is inside the columns takes no
        // part in the column breaks; it is positioned in its containing block's fragments
        // (CSS Fragmentation 3 §2: the fragments of a box stitched together give the layout of
        // the unfragmented box). Its offset in the unfragmented containing block is read on the
        // stitched column axis (column k covers `k * height ..`; the containing block starts
        // where its first fragment is) and the box is sliced where it crosses a column end
        // (Chrome 155: a `top: 20px` abspos child of a relative flex container whose next line
        // moved to column 2 stays in column 1, WPT css/css-break/flexbox/
        // multi-line-row-flex-fragmentation-018; a tall one continues in the next column).
        let mut first_seen: HashMap<usize, (usize, f64)> = HashMap::new();
        for (k, boxes) in placed_flow.iter().enumerate() {
            for b in boxes {
                first_seen.entry(b.node_id).or_insert((k, b.y));
            }
        }
        for subtree in positioned {
            let (k0, cb_y) = mc
                .positioned_cb
                .get(&subtree[0].node_id)
                .and_then(|cb| first_seen.get(cb))
                .copied()
                .unwrap_or((0, mc.content_top));
            // A content-sized container makes no overflow columns for them: they overflow its
            // last column (WPT css/css-break/out-of-flow-in-multicolumn-084); a fixed-height one
            // continues them in overflow columns, as its flow (-002).
            let last = if mc.content_sized {
                mc.count.max(tops.len()) - 1
            } else {
                crate::pagination::MAX_COLUMNS - 1
            };
            columns.extend(place_positioned(subtree, &tops, k0, cb_y, height, last, mc));
        }
        out.push(container);
        out.extend(columns);
        out.extend(kept);
        i = end;
    }
    *boxes = out;
}

/// The boxes of column `k`, moved from the flow to the column: up by the column's flow top, and
/// across by `k` column pitches (left-most first, right-most first in RTL), each edge rounded
/// as Taffy rounds it ([`Multicol::unrounded_x`]); `flow_top` is the flow y of the column's top.
/// For a column piece the first box is the moved stand-in root (the container's own line boxes
/// in this column).
fn place_column(boxes: Vec<LaidOutBox>, flow_top: f64, k: usize, mc: &Multicol) -> Vec<LaidOutBox> {
    let dy = mc.content_top - flow_top;
    let pitch = mc.column_width + mc.gap;
    let dx = if mc.rtl { -pitch } else { pitch } * k as f64;
    boxes
        .into_iter()
        .map(|mut b| {
            let (ul, ur) = mc
                .unrounded_x
                .get(&b.node_id)
                .copied()
                .unwrap_or((b.x, b.x + b.width));
            let dl = (ul + dx).round() - ul.round();
            let dr = (ur + dx).round() - ur.round();
            let (left, right) = (b.x, b.x + b.width);
            // An x on the box's right half moves with its right edge, else with its left edge
            // (a right border, a background's right edge).
            let mid = (left + right) / 2.0;
            let shift = |x: f64| if x > mid + 1e-6 { dr } else { dl };
            b.x += dl;
            b.width = (b.width + dr - dl).max(0.0);
            b.y += dy;
            for rect in &mut b.visual_rects {
                let (x0, x1) = (rect.x, rect.x + rect.width);
                rect.x = x0 + shift(x0);
                rect.width = (x1 + shift(x1) - rect.x).max(0.0);
                rect.y += dy;
            }
            for border in &mut b.rounded_borders {
                let (x0, x1) = (border.x, border.x + border.width);
                border.x = x0 + shift(x0);
                border.width = (x1 + shift(x1) - border.x).max(0.0);
                border.y += dy;
            }
            for run in &mut b.text_runs {
                run.origin_x += dl;
                run.origin_y += dy;
            }
            for image in &mut b.image_runs {
                image.x += dl;
                image.y += dy;
            }
            b
        })
        .collect()
}

/// An absolutely positioned subtree placed in its containing block's fragments (see [`apply`]):
/// the containing block's first fragment is in column `k0`, where its top has flow y `cb_y`
/// (column `k` maps flow `tops[k]` to its top); columns are `height` tall. Nothing goes past
/// column `last`: what reaches below it overflows that column.
fn place_positioned(
    subtree: Vec<LaidOutBox>,
    tops: &[f64],
    k0: usize,
    cb_y: f64,
    height: f64,
    last: usize,
    mc: &Multicol,
) -> Vec<LaidOutBox> {
    // Stitched offset of the containing block's top: whole columns before its own, plus where
    // it starts in its column.
    let cb_stitched = k0 as f64 * height + (cb_y - tops.get(k0).copied().unwrap_or(cb_y));
    // The flow y the top of stitched column k maps from, for this subtree.
    let column_flow_top = |k: usize| cb_y + (k as f64 * height - cb_stitched);
    // The subtree's top: a descendant can start above its root (an absolutely positioned child
    // placed above a zero-height parent, WPT css/css-break/out-of-flow-in-multicolumn-013).
    let top = subtree.iter().map(|b| b.y).fold(f64::INFINITY, f64::min);
    if height <= 0.0 || !top.is_finite() {
        return place_column(subtree, column_flow_top(k0), k0, mc);
    }
    let stitched = cb_stitched + (top - cb_y);
    let mut k = ((stitched / height).floor().max(0.0) as usize).min(last);
    let mut out = Vec::new();
    let mut rest = subtree;
    loop {
        let flow_top = column_flow_top(k);
        let end = flow_top + height;
        if k >= last {
            out.extend(place_column(rest, flow_top, k, mc));
            break;
        }
        match crate::pagination::split_boxes_at(rest, end) {
            (head, Some(tail)) if k < last => {
                out.extend(place_column(head, flow_top, k, mc));
                rest = tail;
                k += 1;
            }
            (head, _) => {
                out.extend(place_column(head, flow_top, k, mc));
                break;
            }
        }
    }
    out
}

/// Index just past the subtree rooted at `start` (the next box whose depth is not greater).
fn subtree_end(boxes: &[LaidOutBox], start: usize) -> usize {
    let depth = boxes[start].depth;
    let mut k = start + 1;
    while k < boxes.len() && boxes[k].depth > depth {
        k += 1;
    }
    k
}

#[cfg(test)]
mod tests {
    use super::column_geometry;

    #[test]
    fn column_geometry_follows_the_multicol_pseudo_algorithm() {
        // column-count only: N = count, W = (U - (N-1) gap) / N.
        assert_eq!(column_geometry(100.0, Some(2), None, 0.0), Some((2, 50.0)));
        // 100 / 3 = 33.33.. truncated to 1/64 px.
        assert_eq!(
            column_geometry(100.0, Some(3), None, 0.0),
            Some((3, 2133.0 / 64.0))
        );
        assert_eq!(column_geometry(100.0, Some(2), None, 20.0), Some((2, 40.0)));
        // column-width only: N = floor((U + gap) / (width + gap)), W = (U + gap) / N - gap.
        assert_eq!(
            column_geometry(300.0, None, Some(100.0), 10.0),
            Some((2, 145.0))
        );
        assert_eq!(
            column_geometry(50.0, None, Some(100.0), 10.0),
            Some((1, 50.0))
        );
        // both: N = min(count, the column-width count).
        assert_eq!(
            column_geometry(300.0, Some(5), Some(100.0), 10.0),
            Some((2, 145.0))
        );
        assert_eq!(
            column_geometry(300.0, Some(1), Some(50.0), 0.0),
            Some((1, 300.0))
        );
        // neither: not a multi-column container.
        assert_eq!(column_geometry(300.0, None, None, 10.0), None);
    }
}
