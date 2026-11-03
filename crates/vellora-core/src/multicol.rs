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
//! A container whose content crosses the end of its page is laid out again in rows of columns,
//! one per page ([`PageRows`], issue #52; CSS Multi-column Layout 1 §8.2): each row is as tall
//! as the room its page leaves, placed below the previous row in the flow so that the
//! paginator's cut at the page end falls between two rows, and only the last row is balanced.
//!
//! Not modelled (documented in COMPATIBILITY.md): `column-span: all` (the spanner stays in the
//! column flow), `column-rule` (not painted), a multi-column container inside another one (laid
//! out in one column), a container that fits a page but not the rest of the current one (moved
//! whole to the next page by the paginator, as any block), vertical writing modes, and unforced breaks
//! in parallel flows (row flex items, the lines of a column flex container, table cells): one
//! cut for the whole column, where Chrome breaks each flow on its own.

use std::collections::{HashMap, HashSet};

use crate::blitz_engine::LaidOutBox;
use crate::pagination::{fragment_columns, fragment_columns_by, ColumnPiece, MAX_COLUMNS};

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
    /// Where the container's content starts on the printed pages, when it is broken across
    /// pages ([`PageRows`]); `None`: laid out as one row of columns.
    pub pages: Option<PageRows>,
}

/// Where a multi-column container's content box is after its columns are laid out
/// ([`apply`]), for [`crate::pagination::multicol_pages`].
#[derive(Debug, Clone)]
pub struct MulticolExtent {
    /// The container's node id ([`LaidOutBox::node_id`]).
    pub node_id: usize,
    /// Its content-box top below its border-box top (border and padding), px.
    pub content_offset: f64,
    /// Its content-box height (the summed rows when it is broken across pages), px.
    pub content_height: f64,
    /// Laid out in rows of columns, one per page ([`PageRows`]).
    pub paged: bool,
}

/// The [`PageRows`] of every multi-column container broken across pages, by container node id
/// ([`LaidOutBox::node_id`]); empty for a document laid out without pages (every container one
/// row of columns). Lookup only (DET-1).
pub type PagingHints = HashMap<usize, PageRows>;

/// The pages a multi-column container broken across pages flows into (CSS Multi-column Layout 1
/// §8.2, "overflow due to page size": the columns that do not fit on a page move to the next
/// page; issue #52). Each page holds one row of the container's columns, as tall as the room the
/// page leaves; the content runs through the columns of the first row, then of the next, and
/// the last row is balanced (`column-fill: balance`; CSS Multi-column Layout 1 §7.1: "in
/// continuous contexts ... balanced"; in fragmented contexts only the last fragment is).
///
/// Where the container lands on its pages is the paginator's result, which depends on this
/// layout: `crate::validate_and_lay_out` lays the document out, paginates it, reads the
/// container's page and its content-box top there, and lays it out again with these rows when
/// the container crosses the end of its page ([`crate::pagination::multicol_pages`]).
#[derive(Debug, Clone, PartialEq)]
pub struct PageRows {
    /// The room (px) from the container's content-box top to the end of its first page.
    pub first: f64,
    /// The content-box heights of the pages after it, in order. Past the end the last two
    /// alternate (`:left` / `:right` pages).
    pub next: Vec<f64>,
}

impl PageRows {
    /// The room of row `row` (0: the first page's).
    pub(crate) fn room(&self, row: usize) -> f64 {
        if row == 0 {
            return self.first;
        }
        let n = self.next.len();
        if n == 0 {
            return self.first;
        }
        let i = row - 1;
        if i < n {
            self.next[i]
        } else {
            let k = n.min(2);
            self.next[n - k + (i - (n - k)) % k]
        }
    }
}

/// The columns of a laid-out container: column `k` is in row `min(k / per_row, last row)`, at
/// column index `k - row * per_row` across, and as tall as its row. Unbroken containers have one
/// row of `MAX_COLUMNS` (so overflow columns continue across); a container broken across pages
/// one row per page ([`PageRows`]).
struct Grid {
    /// `(top, height)` of every row: the flow y its columns are placed at and their height.
    rows: Vec<(f64, f64)>,
    per_row: usize,
    /// The stitched start of every row (the summed heights of all the columns before it).
    starts: Vec<f64>,
}

impl Grid {
    fn new(rows: Vec<(f64, f64)>, per_row: usize) -> Grid {
        let mut starts = Vec::with_capacity(rows.len());
        let mut at = 0.0;
        for &(_, height) in &rows {
            starts.push(at);
            at += per_row as f64 * height;
        }
        Grid {
            rows,
            per_row,
            starts,
        }
    }

    fn row(&self, k: usize) -> usize {
        (k / self.per_row).min(self.rows.len() - 1)
    }

    fn height(&self, k: usize) -> f64 {
        self.rows[self.row(k)].1
    }

    /// Column `k`'s index across its row and the flow y its top is placed at.
    fn slot(&self, k: usize) -> (usize, f64) {
        let r = self.row(k);
        (k - r * self.per_row, self.rows[r].0)
    }

    /// Where column `k` starts on the stitched column axis (every column before it, whole).
    fn start(&self, k: usize) -> f64 {
        let r = self.row(k);
        self.starts[r] + (k - r * self.per_row) as f64 * self.rows[r].1
    }

    /// The column whose stretch of the stitched axis holds `stitched`.
    fn index_at(&self, stitched: f64) -> usize {
        let r = self
            .starts
            .iter()
            .rposition(|&start| start <= stitched)
            .unwrap_or(0);
        let height = self.rows[r].1;
        let within = if height > 0.0 {
            ((stitched - self.starts[r]) / height).floor().max(0.0) as usize
        } else {
            0
        };
        let within = if r + 1 < self.rows.len() {
            within.min(self.per_row - 1)
        } else {
            within
        };
        r * self.per_row + within
    }
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
    // The container's outline stays on the container box.
    root.outline = None;
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

/// The row heights of a container broken across pages ([`PageRows`]), or `None` when its content
/// fits the columns of its first page's room (it is laid out as one row, as before). `flow` is
/// the column flow the heights are worked out on (with its absolutely positioned boxes in place,
/// as for [`balance`]).
///
/// A content-sized container gets one row per page, each as tall as its page's room, until the
/// content runs out; its last row is balanced, or (`column-fill: auto`) as tall as its tallest
/// column. A fixed-height container's rows are the room of each page until its height is used
/// up (the last one takes what is left); only the last of them is balanced, and content past it
/// continues in overflow columns of that row.
fn page_rows(flow: &[LaidOutBox], mc: &Multicol) -> Option<Vec<f64>> {
    let pages = mc.pages.as_ref()?;
    let n = mc.count.max(1);
    let top = mc.content_top;
    let max_rows = (MAX_COLUMNS / n).max(1);
    if pages.room(0) <= CUT {
        return None;
    }
    let fixed: Option<Vec<f64>> = (!mc.content_sized).then(|| {
        let mut rows = Vec::new();
        let mut left = mc.height;
        loop {
            let h = pages.room(rows.len()).min(left).max(0.0);
            rows.push(h);
            left -= h;
            if left <= CUT || h <= CUT || rows.len() >= max_rows {
                break;
            }
        }
        rows
    });
    let last_row = fixed.as_ref().map_or(max_rows, Vec::len) - 1;
    let room = |r: usize| match &fixed {
        Some(rows) => rows[r.min(rows.len() - 1)],
        None => pages.room(r),
    };
    let filled = fragment_columns_by(flow.to_vec(), top, &|k| room((k / n).min(last_row)));
    let used = filled.len().div_ceil(n).clamp(1, last_row + 1);
    if used <= 1 {
        return None;
    }
    let last = used - 1;
    let mut heights: Vec<f64> = (0..last).map(room).collect();
    let cap = room(last);
    let tail = &filled[last * n..];
    let last_height = if let Some(rows) = &fixed {
        // Empty rows after the content keep the container's height on their pages.
        heights.extend(rows[last..].iter().copied());
        if !mc.fill_auto && last == rows.len() - 1 {
            heights.pop();
            Some(balance_last(flow, top, n, &heights, cap, tail))
        } else {
            None
        }
    } else if mc.fill_auto {
        Some(
            tail.iter()
                .map(ColumnPiece::extent)
                .fold(0.0, f64::max)
                .min(cap),
        )
    } else {
        Some(balance_last(flow, top, n, &heights, cap, tail))
    };
    heights.extend(last_height);
    Some(heights)
}

/// The least height (to 1/64 px) of the last row of a container broken across pages
/// ([`page_rows`]) at which the content left after the rows `before` takes at most `n` columns
/// without overflowing one, capped by `cap` (the room of its page); `tail` is that content cut
/// into columns `cap` tall.
fn balance_last(
    flow: &[LaidOutBox],
    top: f64,
    n: usize,
    before: &[f64],
    cap: f64,
    tail: &[ColumnPiece],
) -> f64 {
    let first = before.len() * n;
    let heights = |h: f64| {
        move |k: usize| {
            if k < first {
                before[k / n]
            } else {
                h
            }
        }
    };
    let works = |h: f64| {
        let pieces = fragment_columns_by(flow.to_vec(), top, &heights(h));
        pieces.len() <= first + n && pieces[first..].iter().all(|p| p.extent() <= h + CUT)
    };
    if !works(cap) {
        return cap;
    }
    let bottom = flow[0].y + flow[0].height;
    let rest = tail.first().map_or(0.0, |p| bottom - p.flow_top);
    let mut lo = (rest / n as f64)
        .max(
            tail.iter()
                .map(|p| crate::pagination::tallest_unbreakable(&p.boxes))
                .fold(0.0, f64::max),
        )
        .min(cap);
    let mut hi = cap;
    if works(lo) {
        hi = lo;
    }
    while hi - lo > CUT {
        let mid = (lo + hi) / 2.0;
        if works(mid) {
            hi = mid;
        } else {
            lo = mid;
        }
    }
    ((hi * 64.0).ceil() / 64.0).min(cap)
}

/// The precision of the column heights (Chrome's layout unit).
const CUT: f64 = 1.0 / 64.0;

/// The balanced column height of a multi-column container whose height is sized by its content
/// (`blitz_engine` sets it as the container's height before the final layout). `subtree` is the
/// container's laid-out subtree with its content one column wide.
///
/// With `column-fill: auto` the columns are not balanced: a content-sized container keeps all of
/// its content in the first column (Chrome 155: WPT css/css-break/widows-orphans-017, "an
/// auto-height multicolumn container with column-fill: auto" fills one column).
pub(crate) fn balanced_height(subtree: &[LaidOutBox], mc: &Multicol, fill_auto: bool) -> f64 {
    let split = split_flow(subtree, mc);
    // Broken across pages: the summed heights of its rows.
    if let Some(rows) = page_rows(&split.balanced, mc) {
        return rows.iter().sum();
    }
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
/// Returns where each container laid out in columns has its content box.
pub(crate) fn apply(boxes: &mut Vec<LaidOutBox>, containers: &[Multicol]) -> Vec<MulticolExtent> {
    let mut extents = Vec::new();
    if containers.is_empty() {
        return extents;
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
        let rows = page_rows(&balanced, mc);
        extents.push(MulticolExtent {
            node_id: mc.node_id,
            content_offset: mc.content_top - subtree[0].y,
            content_height: rows.as_ref().map_or(mc.height, |r| r.iter().sum()),
            paged: rows.is_some(),
        });
        let (pieces, grid) = match &rows {
            // Broken across pages: one row of columns per page, each placed below the one
            // before it in the flow, so the paginator's cut at the page end falls between rows.
            Some(heights) => {
                let n = mc.count.max(1);
                let mut at = mc.content_top;
                let mut placed = Vec::with_capacity(heights.len());
                for &h in heights {
                    placed.push((at, h));
                    at += h;
                }
                let grid = Grid::new(placed, n);
                let pieces = fragment_columns_by(flow, mc.content_top, &|k| grid.height(k));
                (pieces, grid)
            }
            None => {
                let height = if mc.fill_auto {
                    mc.height
                } else {
                    balance(&balanced, mc.content_top, mc.count, Some(mc.height))
                };
                let pieces = fragment_columns(flow, mc.content_top, height);
                (
                    pieces,
                    Grid::new(vec![(mc.content_top, height)], MAX_COLUMNS),
                )
            }
        };
        let tops: Vec<f64> = pieces.iter().map(|p| p.flow_top).collect();
        // One container box: its own paint, and its own line boxes gathered from every column.
        let mut container = subtree[0].clone();
        container.text_runs.clear();
        container.image_runs.clear();
        let mut columns = Vec::new();
        // Each column's boxes in flow coordinates (where the containing blocks are found).
        let placed_flow: Vec<Vec<LaidOutBox>> = pieces.iter().map(|p| p.boxes.clone()).collect();
        for (k, piece) in pieces.into_iter().enumerate() {
            let (col, top) = grid.slot(k);
            let mut placed = place_column(piece.boxes, piece.flow_top, col, top, mc);
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
            let last = match &rows {
                _ if !mc.content_sized => MAX_COLUMNS - 1,
                Some(heights) => (heights.len() * mc.count.max(1)).max(tops.len()) - 1,
                None => mc.count.max(tops.len()) - 1,
            };
            columns.extend(place_positioned(subtree, &tops, k0, cb_y, &grid, last, mc));
        }
        out.push(container);
        out.extend(columns);
        out.extend(kept);
        i = end;
    }
    *boxes = out;
    extents
}

/// The boxes of a column, moved from the flow to the column: from the column's flow top
/// (`flow_top`) to `top` (the container's content-box top, or for a container broken across
/// pages its row's top), and across by `k` column pitches (left-most first, right-most first in
/// RTL), each edge rounded as Taffy rounds it ([`Multicol::unrounded_x`]). For a column piece
/// the first box is the moved stand-in root (the container's own line boxes in this column).
fn place_column(
    boxes: Vec<LaidOutBox>,
    flow_top: f64,
    k: usize,
    top: f64,
    mc: &Multicol,
) -> Vec<LaidOutBox> {
    let dy = top - flow_top;
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
/// (column `k` maps flow `tops[k]` to its top); the columns are laid out on `grid`. Nothing
/// goes past column `last`: what reaches below it overflows that column.
fn place_positioned(
    subtree: Vec<LaidOutBox>,
    tops: &[f64],
    k0: usize,
    cb_y: f64,
    grid: &Grid,
    last: usize,
    mc: &Multicol,
) -> Vec<LaidOutBox> {
    // Stitched offset of the containing block's top: whole columns before its own, plus where
    // it starts in its column.
    let cb_stitched = grid.start(k0) + (cb_y - tops.get(k0).copied().unwrap_or(cb_y));
    // The flow y the top of stitched column k maps from, for this subtree.
    let column_flow_top = |k: usize| cb_y + (grid.start(k) - cb_stitched);
    let place = |boxes: Vec<LaidOutBox>, k: usize| {
        let (col, top) = grid.slot(k);
        place_column(boxes, column_flow_top(k), col, top, mc)
    };
    let height = grid.height(k0);
    // The subtree's top: a descendant can start above its root (an absolutely positioned child
    // placed above a zero-height parent, WPT css/css-break/out-of-flow-in-multicolumn-013).
    let top = subtree.iter().map(|b| b.y).fold(f64::INFINITY, f64::min);
    if height <= 0.0 || !top.is_finite() {
        return place(subtree, k0);
    }
    let stitched = cb_stitched + (top - cb_y);
    let mut k = grid.index_at(stitched).min(last);
    let mut out = Vec::new();
    let mut rest = subtree;
    loop {
        let end = column_flow_top(k) + grid.height(k);
        if k >= last {
            out.extend(place(rest, k));
            break;
        }
        match crate::pagination::split_boxes_at(rest, end) {
            (head, Some(tail)) if k < last => {
                out.extend(place(head, k));
                rest = tail;
                k += 1;
            }
            (head, _) => {
                out.extend(place(head, k));
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
