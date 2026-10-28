//! vellora's own pagination layer.
//!
//! Blitz/Taffy produce ONE continuous flow. This pass consumes that laid-out
//! tree (absolute document coordinates) and slices it into ordered pages
//! against the `@page` content box, repeating `<thead>` on table continuation
//! pages, never splitting a row, keeping the totals block once, and resolving
//! `counter(page)`/`counter(pages)` for the running footer. Coordinates emitted
//! into the display list are PAGE-LOCAL.
//!
//! **Gap model (slice, not re-stack).** Blitz has already collapsed margins
//! (CSS 2.2 §8.3.1) in its continuous flow, so the space between two fragments
//! on one page is their flow distance, never a re-derived margin: every page
//! maps flow y to page-local y by ONE translation (`shift`), set where the page
//! starts and kept for every fragment placed on it. Where a page starts follows
//! CSS Fragmentation 3 §5.2: page 1 keeps the document's leading offset (body
//! margin/padding, the first box's margin, a relative `top:`), margins adjoining
//! an unforced break truncate to zero, and margins after a forced break are
//! kept. A repeated `<thead>` band takes its flow height plus the flow spacing to
//! the first body row (border-spacing). Chrome-verified in
//! `tests/pagination_gaps.rs`.

use std::collections::{HashMap, HashSet, VecDeque};

use crate::blitz_engine::{ImageRun, LaidOutBox, LaidOutDoc};
use crate::page_css::{resolve_content, MarginBox, PageBox};
use crate::pdf::{FilledRect, MarginText, PdfPage, RoundedStroke};

/// The result of pagination: ready-to-emit pages plus a small report used by
/// tests/assertions (page count, per-page footer text, thead-repeat flags).
pub struct Paginated {
    pub pages: Vec<PdfPage>,
    pub report: PaginationReport,
}

#[derive(Debug, Default, Clone)]
pub struct PaginationReport {
    pub page_count: usize,
    /// Resolved running-footer text per page (1-based index 0 = page 1).
    pub footers: Vec<String>,
    /// True for each page that carries at least one repeated table `<thead>` band.
    pub thead_repeated: Vec<bool>,
    /// Whether the oversize-row branch was taken.
    pub oversize_hit: bool,
}

/// How far (capped by the bottom page margin, so nothing is painted past the
/// physical page) a block may overflow the box that contains it and still be
/// fitted against that box (`fit_height`); what the fragment paints must also
/// stay above a drawn `@bottom-center` line (`band_fit_height`, port step 10).
/// It was also the table-row fit tolerance until Phase C step 03 (see
/// [`TABLE_ROW_FIT_SLACK_PX`]).
const TABLE_ROW_BREAK_TOLERANCE_PX: f64 = 12.0;
/// How far a table row (or a keep-together row group) may end past the content
/// box and still stay on the page. vellora's boxes are whole px (Taffy rounds
/// them) where Chrome's are 1/64 px, so a row Chrome ends exactly at the page
/// end can end up to 0.5 px lower here.
///
/// It was 12 px (the shared `TABLE_ROW_BREAK_TOLERANCE_PX`) to absorb the row
/// drift of Blitz's collapsed-border bug and its unquantised lengths; with both
/// corrected (`blitz_engine::compensate_collapsed_borders`,
/// `blitz_engine::snap_lengths_to_layout_unit`) rows have Chrome's pitch, and
/// 12 px kept text-stress-ptbr's June `<tbody>` (`break-inside: avoid`, ending
/// 11 px past the content box at 1005 / 994.06 px) on page 3 where Chrome 155
/// moves it to page 4 (layout-diff + pdf-probe, Phase C step 03, 2026-10-27:
/// 721 words of pages 3-6 unpaired).
const TABLE_ROW_FIT_SLACK_PX: f64 = 0.5;
/// How far apart (px) two same-paint rects of one band may be and still be drawn as ONE rect
/// by [`merge_adjacent_rects`]: rects that touch (or overlap by up to 0.5 px) within this
/// sub-pixel epsilon. Chrome paints such rects as one seamless area; drawing them as two leaves an
/// anti-aliased seam at vellora's fractional page offsets in some PDF rasterizers. A real gap is
/// never bridged, so the background between them shows as it does in Chrome.
///
/// Was 4 px (`RECT_MERGE_TOLERANCE_PX`, "Refine PDF visual chrome", 2026-06), which drew two
/// black WPT stripes 2 px apart as one 42 px rect (30 head / 14 pin WPT passes lost at port link
/// 01, `fidelity/gate/snapshots/2026-10-22/wpt-raw/`). Over the corpus, oracle fixtures,
/// layout-diff and probe suite (trace of every merge, 2026-10-22) the merged gaps are exactly
/// 0, 1 or 2 px, so any epsilon below 1 px gives the same display list; the 1 and 2 px gaps are
/// no longer bridged (port step `10-rects`, `fidelity/baselines/port/README.md`).
const RECT_MERGE_EPSILON_PX: f64 = 0.05;

/// Debug/fidelity trace of [`paginate`]'s decisions (fidelity layer `P`, read by
/// `fidelity/layout-diff/`). Filled only by [`paginate_traced`] with `Some`; the
/// render path passes `None`, so it never exists there. Not a stable API.
#[doc(hidden)]
#[derive(Debug, Clone, Default)]
pub struct PaginationTrace {
    /// One record per fragment placed on a page, in placement order.
    pub placements: Vec<FragmentPlacement>,
    /// Keep-together groups split back into their members (each member is then
    /// placed, and recorded, on its own).
    pub groups_split: usize,
    pub page_count: usize,
}

/// Where one fragment landed. Flow coordinates (`top`/`bottom`) are Blitz's
/// continuous-flow CSS px; `placed_top` is the page-local CSS px (content-box
/// origin, before the `@page` margin is added) that `top` was moved to.
#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct FragmentPlacement {
    /// `block` (a top-level box or a flattened wrapper's child), `row` (a table
    /// row), `group` (a `break-inside: avoid` group placed whole), or the
    /// `oversize-` prefixed variant when the fragment did not fit an empty page.
    pub kind: &'static str,
    /// Node ids of the fragment's boxes, in document order (the first is its root).
    pub node_ids: Vec<usize>,
    pub root_tag: Option<String>,
    /// Table root of a row/group fragment.
    pub table_id: Option<usize>,
    /// Flow span (min top, max bottom of its boxes; cells only for rows).
    pub top: f64,
    pub bottom: f64,
    /// The flow gap from this fragment's bottom to the NEXT placed fragment's
    /// top (filled in when that one is placed; 0 for the last placement).
    pub trailing_gap: f64,
    /// Source of `trailing_gap`: `flow-gap` once the next fragment is placed,
    /// `none` for the last placement.
    pub gap_source: &'static str,
    /// 0-based page index.
    pub page: usize,
    /// Why this fragment opened a new page: `forced-break`, `overflow`,
    /// `oversize` (it did not fit an empty page), `after-oversize` (the
    /// previous fragment was oversize and closed its page), or
    /// `forced-break-blank` (monolithic content that did not fit under the margin
    /// kept after a forced break left that page blank, port step 10); `None` when it
    /// continued the current page (or was the very first fragment).
    pub new_page: Option<&'static str>,
    /// Used height of the page before this fragment (and before its gap).
    pub cursor_before: f64,
    /// The gap this fragment asked for: its flow top minus the previous placed
    /// fragment's flow bottom (`flow-gap`), or minus the flow origin for the
    /// first placement (`flow-origin`).
    pub pending_gap: f64,
    pub pending_gap_source: &'static str,
    /// The space actually added above it (above its repeated `<thead>` band, if
    /// one is injected), and why: `applied` (the flow gap, kept on the page),
    /// `none` (flow gap 0), `page-origin` (page 1: the document's leading
    /// offset is kept), `page-start` (unforced break: adjoining margins
    /// truncate to 0), `forced-break-margin` (forced break: the margin after it
    /// is kept, CSS Fragmentation 3 §5.2), `out-of-order` (its flow position lies
    /// above the page top, so it follows the previous fragment).
    pub gap_applied: f64,
    pub gap_note: &'static str,
    /// A repeated `<thead>` band injected right above this fragment (it sits at
    /// `placed_top - height`).
    pub header_injected: Option<InjectedHeader>,
    /// Page-local y the fragment's `top` was placed at.
    pub placed_top: f64,
}

/// A table's `<thead>` band as injected above a row (trace only).
#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct InjectedHeader {
    pub table_id: usize,
    /// Node ids of the band's boxes, in document order.
    pub node_ids: Vec<usize>,
    /// Flow top of the band and its height, which includes the flow spacing
    /// down to the first body row (so the row sits at `top + height`).
    pub top: f64,
    pub height: f64,
}

impl InjectedHeader {
    fn new(table_id: usize, header: &TableHeader) -> Self {
        Self {
            table_id,
            node_ids: header.boxes.iter().map(|b| b.node_id).collect(),
            top: header.top,
            height: header.height,
        }
    }
}

/// A fragmentable unit: a top-level flow item, or a single table row. Each
/// carries its absolute Y span so the breaker can place it on a page.
struct Fragment {
    /// Boxes belonging to this fragment (absolute coords).
    boxes: Vec<LaidOutBox>,
    top: f64,
    bottom: f64,
    /// Bottom of the box that contains the fragment's content in the flow: its
    /// root's border box, or, for a child of a flattened wrapper, no lower than
    /// the wrapper's border box. Content below it is overflow, which does not
    /// push the flow. When the overflow is small (at most
    /// `TABLE_ROW_BREAK_TOLERANCE_PX`, capped by the bottom page margin; the
    /// painted part never reaches a drawn `@bottom-center` line, port step 10) the fit
    /// tests use this edge instead of `bottom` (`fit_height`): Blitz
    /// 0.3.0-beta.4 lays some content out taller than Chrome (the
    /// boleto-febraban ficha's table is +9.45 px in the raw Blitz layer), so a
    /// fixed-height box Chrome fills exactly overflows by a few px here, and
    /// that drift must not push the overflowing tail onto a page of its own.
    /// DESIGN TARGET, not Chrome behaviour (Chrome fragments real overflow
    /// across pages); a larger overflow is fitted as is.
    contained_bottom: f64,
    /// The margin kept above this fragment when a forced break puts it at the
    /// top of a page (CSS Fragmentation 3 §5.2: "margins after the break are
    /// preserved"): the margins that collapse into its top edge (see
    /// [`leading_margin`]), including those of an ancestor whose forced break
    /// moved onto this fragment and of dropped fragments it collapses through.
    break_margin: CollapsedMargin,
    /// Root table node for table-row/header fragments.
    table_id: Option<usize>,
    /// If this fragment is a `<thead>`, its boxes get repeated for that table.
    is_thead: bool,
    /// A forced page break (`break-before: page`) precedes this fragment.
    break_before: bool,
    /// For a `break-inside: avoid` group (a `<tbody>`, an items table, or a
    /// wrapper that would otherwise be flattened): the fragments it would have
    /// been split into. Kept so a group taller than an empty page falls back to
    /// them — `avoid` is a preference, never a reason to overflow the page.
    members: Vec<Fragment>,
}

struct TableHeader {
    boxes: Vec<LaidOutBox>,
    top: f64,
    /// Band height PLUS the flow spacing down to the table's first body
    /// fragment (border-spacing): a body row placed right under the band sits
    /// `height` below the band's top, as in the flow. Chrome 155 repeats the band
    /// at the top of a continuation page and puts the row the same distance
    /// below it (`tests/pagination_gaps.rs`, f1).
    height: f64,
}

/// How the current (still empty) page began; decides where its first
/// fragment goes (CSS Fragmentation 3 §5.2).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum PageStart {
    /// Page 1 before anything was placed: the flow is kept verbatim, so the
    /// document's leading offset (body margin/padding, the first box's margin,
    /// a relative `top:`) stays above the first fragment.
    Origin,
    /// After a forced break: the margin after the break is kept.
    Forced,
    /// After an unforced break (overflow, oversize): adjoining margins
    /// truncate to zero, the fragment starts at the page top.
    Unforced,
}

/// Paginate a laid-out document against the `@page` box.
pub fn paginate(doc: &LaidOutDoc, page_box: &PageBox) -> Paginated {
    paginate_traced(doc, page_box, None)
}

/// [`paginate`] that, given `Some(trace)`, also records every placement decision
/// (fidelity layer `P`). Debug/fidelity tooling only: the trace is write-only
/// here, so its presence cannot change the pages (the render path passes `None`).
#[doc(hidden)]
pub fn paginate_traced(
    doc: &LaidOutDoc,
    page_box: &PageBox,
    mut trace: Option<&mut PaginationTrace>,
) -> Paginated {
    // Each page's own `@page` box (`:first`, `:left`/`:right` rules may give pages different
    // heights and margins; the content width is the same on every page, see
    // `page_css::varying_width_rule`).
    let mut geometry = PageGeometry::new(page_box, doc.page_context.rtl);

    let fragments = build_fragments(doc);

    let headers = table_headers_by_id(&fragments);

    // Phase one: break fragments into page slices.
    let mut page_slices: Vec<Vec<LaidOutBox>> = Vec::new();
    let mut current: Vec<LaidOutBox> = Vec::new();
    // Page-local y = flow y + `shift` for every fragment of the current page; set
    // by the page's first fragment (see `PageStart`), so the flow gaps between
    // the fragments of one page are kept exactly (margins already collapsed by
    // Blitz, negative/overlapping gaps and relative offsets included).
    let mut shift = 0.0_f64;
    let mut page_start = PageStart::Origin;
    // Used height on the current page (the bottom of the last placed fragment).
    let mut cursor = 0.0_f64;
    let mut thead_repeated: Vec<bool> = Vec::new();
    let mut oversize_hit = false;
    // Trace only: the flow bottom of the last placed fragment (to report the
    // flow gap each fragment asked for), and whether an oversize fragment closed
    // the previous page (never read by layout).
    let mut prev_flow_bottom: Option<f64> = None;
    let mut page_closed_by_oversize = false;
    // Tracks whether the current page already carries the header band. Reset on
    // every page break and re-set whenever a tbody row injects the header, so the
    // header leads the table-start page AND every continuation page —
    // including the oversize-branch page — exactly once each.
    let mut headers_on_current: HashSet<usize> = HashSet::new();

    let push_page = |current: &mut Vec<LaidOutBox>,
                     page_slices: &mut Vec<Vec<LaidOutBox>>,
                     thead_repeated: &mut Vec<bool>,
                     repeated: bool| {
        page_slices.push(std::mem::take(current));
        thead_repeated.push(repeated);
    };

    let mut queue: VecDeque<Fragment> = fragments.into();
    while let Some(frag) = queue.pop_front() {
        if frag.is_thead {
            // The header is emitted inline as part of its table's first page and
            // re-injected on continuations; skip standalone placement here.
            continue;
        }
        let frag_height = frag.bottom - frag.top;
        let table_header = frag.table_id.and_then(|table_id| headers.get(&table_id));
        let is_table_row = frag.is_row();
        // The fit limit of the page the fragment is tried on (re-read after every page break).
        let mut fit_limit = geometry.fit_limit(page_slices.len(), is_table_row);
        // How far content may overflow the box that contains it and still be
        // fitted against that box: the row drift allowance, but never past the
        // physical page (the bottom page margin).
        let overflow_allowance = TABLE_ROW_BREAK_TOLERANCE_PX
            .min(geometry.page(page_slices.len()).margin_bottom.max(0.0));
        // The height the fit tests use: a small overflow of the box that
        // contains the fragment does not count (see `Fragment::contained_bottom`),
        // and what the fragment paints never reaches a drawn `@bottom-center` line:
        // its painted bottom must stay within the free space above that line
        // (`band_fit_height`). Port step 10: step 09 capped the allowance itself by
        // that space, which also moved an overflowing box that paints nothing there
        // (probe f5_allowance_footer: Chrome 155 and step 08 keep "Tail" on page 1).
        let fit_h = fit_height(&frag, overflow_allowance).max(band_fit_height(
            &frag,
            geometry.bottom_box_clearance(page_slices.len(), doc),
            fit_limit - geometry.page(page_slices.len()).content_height(),
        ));

        // A keep-together group that cannot fit even on an empty page is split
        // back into its parts (the forced break, if any, moves to the first).
        // A forced break inside the group also splits it: a forced break wins
        // over `avoid` (CSS Fragmentation 3, §4.4).
        let group_header_h = table_header.map(|header| header.height).unwrap_or(0.0);
        let forced_break_inside = frag.members.iter().skip(1).any(has_forced_break);
        if !frag.members.is_empty() && (fit_h + group_header_h > fit_limit || forced_break_inside) {
            let break_before = frag.break_before;
            let break_margin = frag.break_margin;
            let mut members = frag.members;
            if let Some(first) = members.first_mut() {
                first.break_before |= break_before;
                first.break_margin = first.break_margin.collapse(break_margin);
            }
            for member in members.into_iter().rev() {
                queue.push_front(member);
            }
            if let Some(t) = trace.as_deref_mut() {
                t.groups_split += 1;
            }
            continue;
        }

        // Trace only: why (if at all) this fragment opens a new page, and the
        // flow gap it asks for.
        let mut new_page: Option<&'static str> =
            std::mem::take(&mut page_closed_by_oversize).then_some("after-oversize");
        let (pending_gap, pending_gap_source) = match prev_flow_bottom {
            Some(bottom) => (frag.top - bottom, "flow-gap"),
            None => (frag.top, "flow-origin"),
        };

        // A forced break starts this fragment on a fresh page. There is no
        // blank page before the first content: a break before it is not a valid
        // break point, so page 1 keeps its origin.
        if frag.break_before {
            if !current.is_empty() {
                push_page(
                    &mut current,
                    &mut page_slices,
                    &mut thead_repeated,
                    !headers_on_current.is_empty(),
                );
                cursor = 0.0;
                headers_on_current.clear();
                page_start = PageStart::Forced;
                new_page = Some("forced-break");
                fit_limit = geometry.fit_limit(page_slices.len(), is_table_row);
            } else if page_start == PageStart::Unforced {
                // An oversize fragment closed the previous page; the break
                // requested here is still a forced one.
                page_start = PageStart::Forced;
            }
        }

        // Oversized single fragment (e.g. a row taller than an empty page):
        // own page, then terminate that fragment (never split mid-row). The
        // fragment is placed in full and bleeds past the page box — krilla does
        // not clip to the media box, so over-height content is emitted, not
        // trimmed. A future clip pass would live in pdf::emit.
        let oversize = fit_h > fit_limit;
        if oversize && !current.is_empty() {
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                !headers_on_current.is_empty(),
            );
            cursor = 0.0;
            headers_on_current.clear();
            page_start = PageStart::Unforced;
            new_page = Some("oversize");
            fit_limit = geometry.fit_limit(page_slices.len(), is_table_row);
        }

        // A table fragment entering a page without its header (table start OR a
        // continuation page) gets the header band injected right above it.
        let header_for = |headers_on_current: &HashSet<usize>| match (frag.table_id, table_header) {
            (Some(table_id), Some(header)) if !headers_on_current.contains(&table_id) => {
                Some((table_id, header))
            }
            _ => None,
        };

        // Where the fragment goes if it stays on the current page: its flow
        // position. A row whose table starts on this page sits right under its
        // header band, which is placed at the band's own flow position. (Rows of a
        // `border-collapse: collapse` table abut in the flow itself since Phase C
        // step 02, `blitz_engine::compensate_collapsed_borders`; the gap drop that
        // stood in for that, `collapsed-rows`, is gone.)
        // A fragment whose flow position lies above the top of the current page
        // comes out of flow order (DOM order is not always flow order: Blitz
        // lays a `<tfoot>` written before the body out at the table bottom); the
        // page translation cannot place it, so it follows the previous fragment
        // (`out-of-order`).
        let continuing = !current.is_empty();
        let mid_page = continuing.then(|| {
            let header_h = header_for(&headers_on_current).map_or(0.0, |(_, header)| header.height);
            let (top, note) = if let Some((_, header)) = header_for(&headers_on_current) {
                (header.top + shift + header.height, None)
            } else {
                (frag.top + shift, None)
            };
            if top - header_h < 0.0 {
                (cursor + header_h, Some("out-of-order"))
            } else {
                (top, note)
            }
        });

        // Does the fragment fit in the rest of the page there? Otherwise the
        // whole fragment moves to the next page (rows never split); the margins
        // adjoining that unforced break truncate, so nothing of the gap moves
        // with it.
        if mid_page.is_some_and(|(top, _)| top + fit_h > fit_limit) {
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                !headers_on_current.is_empty(),
            );
            cursor = 0.0;
            headers_on_current.clear();
            page_start = PageStart::Unforced;
            new_page = Some("overflow");
            fit_limit = geometry.fit_limit(page_slices.len(), is_table_row);
        }

        // A fragment that opens a page after a forced break but does not fit under the
        // margin kept after that break (CSS Fragmentation 3 §5.2), while it fits the page
        // without it (port step 10; probes f5_*, Chrome 155):
        // - a table without a `<thead>` (one block fragment) is split between its rows,
        //   the first row keeping the break and the margin: Chrome keeps the margin and
        //   moves the rows that do not fit to the next page;
        // - monolithic content (one line of text, or one image) moves to the next page,
        //   leaving the forced page blank, as Chrome does (the margin truncates at that
        //   unforced break);
        // - anything else (several lines or boxes, which Chrome fragments between its
        //   lines and vellora cannot) keeps step 09's placement: the margin is truncated
        //   to the room the fragment leaves (KNOWN GAP, `tests/pagination_gaps.rs`).
        if current.is_empty() && page_start == PageStart::Forced && !oversize {
            let header_h = header_for(&headers_on_current).map_or(0.0, |(_, header)| header.height);
            let margin = frag.break_margin.value();
            if margin > 0.0 && header_h + margin + fit_h > fit_limit {
                if let Some(rows) = table_rows_of(&frag) {
                    let mut rows = rows;
                    if let Some(first) = rows.first_mut() {
                        first.break_before = true;
                        first.break_margin = frag.break_margin;
                    }
                    for row in rows.into_iter().rev() {
                        queue.push_front(row);
                    }
                    if let Some(t) = trace.as_deref_mut() {
                        t.groups_split += 1;
                    }
                    continue;
                }
                if is_monolithic(&frag) {
                    push_page(&mut current, &mut page_slices, &mut thead_repeated, false);
                    cursor = 0.0;
                    page_start = PageStart::Unforced;
                    new_page = Some("forced-break-blank");
                    fit_limit = geometry.fit_limit(page_slices.len(), is_table_row);
                }
            }
        }

        let header = header_for(&headers_on_current);
        let header_h = header.map_or(0.0, |(_, header)| header.height);
        let (placed_top, gap_note) = match mid_page {
            Some((top, note)) if !current.is_empty() => {
                let gap = top - header_h - cursor;
                (
                    top,
                    note.unwrap_or(if gap == 0.0 { "none" } else { "applied" }),
                )
            }
            _ => match page_start {
                // Page 1: the flow verbatim (`shift` 0), leading offset kept.
                // When the first fragment would fit at the page top but not below
                // that offset (its flow position is past the page end, e.g. a
                // `<tfoot>` written first and laid out last), it starts at the
                // page top instead: the fragment model cannot leave page 1
                // holding only the offset. A first fragment that does not fit
                // at the top either keeps the offset (it overflows either way),
                // unless that offset is itself past the page end: then it starts
                // at the page top too, so it is never placed off the page (the
                // `<tfoot>` guard in `tests/pagination_gaps.rs`, which the 12 px
                // row fit slack used to satisfy, Phase C step 03).
                PageStart::Origin
                    if frag.top + fit_h <= fit_limit
                        || (header_h + fit_h > fit_limit && frag.top < fit_limit) =>
                {
                    (frag.top.max(header_h), "page-origin")
                }
                PageStart::Origin => (header_h, "page-start"),
                // The margin after a forced break is kept (CSS Fragmentation 3 §5.2). A table
                // or monolithic content that does not fit under it was split or moved on above
                // (port step 10); what is left here is a block with break points inside it,
                // which Chrome fragments between its lines and vellora cannot: its margin is
                // truncated to the room it leaves, so it never runs into the bottom margin
                // band (port step 09's rule, KNOWN GAP, `tests/pagination_gaps.rs`).
                PageStart::Forced => {
                    let room = (fit_limit - header_h - fit_h).max(0.0);
                    (
                        frag.break_margin.value().min(room) + header_h,
                        "forced-break-margin",
                    )
                }
                PageStart::Unforced => (header_h, "page-start"),
            },
        };
        let cursor_before = cursor;
        shift = placed_top - frag.top;

        let mut header_injected = None;
        if let Some((table_id, header)) = header {
            let mut header_boxes = reposition(&header.boxes, header.top, placed_top - header_h);
            current.append(&mut header_boxes);
            headers_on_current.insert(table_id);
            header_injected = Some(InjectedHeader::new(table_id, header));
        }

        if let Some(t) = trace.as_deref_mut() {
            if let Some(previous) = t.placements.last_mut() {
                previous.trailing_gap = pending_gap;
                previous.gap_source = pending_gap_source;
            }
            t.placements.push(placement_record(
                &frag,
                PlacementState {
                    oversize,
                    page: page_slices.len(),
                    new_page,
                    cursor_before,
                    pending_gap,
                    pending_gap_source,
                    gap_applied: placed_top - header_h - cursor_before,
                    gap_note,
                    header_injected,
                    placed_top,
                },
            ));
        }
        let mut placed = reposition(&frag.boxes, frag.top, placed_top);
        current.append(&mut placed);
        cursor = placed_top + frag_height;
        prev_flow_bottom = Some(frag.bottom);

        if oversize {
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                !headers_on_current.is_empty(),
            );
            cursor = 0.0;
            headers_on_current.clear();
            page_start = PageStart::Unforced;
            oversize_hit = true;
            page_closed_by_oversize = true;
        }
    }

    if !current.is_empty() {
        push_page(
            &mut current,
            &mut page_slices,
            &mut thead_repeated,
            !headers_on_current.is_empty(),
        );
    }

    // Pagination always emits at least one page (blank if no content).
    if page_slices.is_empty() {
        page_slices.push(Vec::new());
        thead_repeated.push(false);
    }

    let total = page_slices.len();
    if let Some(t) = trace {
        t.page_count = total;
    }

    // Phase two: build PdfPages, resolving running header/footer counters now
    // that the total page count is known.
    let page_boxes: Vec<PageBox> = (0..total).map(|i| geometry.page(i).clone()).collect();
    let mut margin_texts = build_margin_texts(doc, &page_boxes);
    let mut pages = Vec::with_capacity(total);
    let mut footers = Vec::with_capacity(total);
    for (i, slice) in page_slices.into_iter().enumerate() {
        let page = &page_boxes[i];
        let (rects, rounded_strokes, images, text_runs) =
            lower_to_display_list(slice, page.margin_left, page.margin_top);

        // Keep `report.footers` in lock-step with what is actually emitted: a
        // footer string is only recorded when its `MarginText` was produced.
        let page_margin_texts = std::mem::take(&mut margin_texts[i]);
        let footer_text = page_margin_texts
            .iter()
            .find(|(which, _)| *which == MarginBox::BottomCenter)
            .map(|(_, mt)| mt.text.clone())
            .unwrap_or_default();
        footers.push(footer_text);

        pages.push(PdfPage {
            width_px: page.width,
            height_px: page.height,
            rects,
            rounded_strokes,
            images,
            text_runs,
            margin_texts: page_margin_texts.into_iter().map(|(_, mt)| mt).collect(),
        });
    }

    Paginated {
        report: PaginationReport {
            page_count: total,
            footers,
            thead_repeated,
            oversize_hit,
        },
        pages,
    }
}

/// Fidelity tooling ONLY ([`crate::debug_render_raw_blitz`]), never the render path: Blitz's one
/// continuous flow cut into page-tall bands with no fragmentation logic, the "raw" counterpart of
/// [`paginate`]. Blitz has no paginator, so the raw render cannot drop pagination; it replaces it
/// with the plainest one. Page `i` shows the flow band `[start_i, start_i + content_height_i)` of
/// page `i`'s own `@page` box (`start_0 = 0`, so page 1 is the flow verbatim, exactly what a
/// viewport screenshot shows), translated to the page's content box. Nothing is moved, repeated
/// or kept together: no break rules (`break-*`), no `<thead>` repeat, no fit tolerance, no margin
/// boxes, and no display-list rect merge (`merge_adjacent_rects`). A background or border rect is
/// clipped into every band it crosses; a text run goes to the band of its baseline, an image or
/// rounded border to the band of its top. Content above the flow origin stays on page 1.
#[doc(hidden)]
pub fn paginate_flat(doc: &LaidOutDoc, page_box: &PageBox) -> Paginated {
    let mut geometry = PageGeometry::new(page_box, doc.page_context.rtl);
    let mut bands: Vec<(f64, f64)> = Vec::new();
    // The band index of flow y, growing the page list as far as `y` reaches.
    // Past `FLAT_MAX_PAGES` bands, content stays on the last page, below its edge (a document
    // millions of px tall must not allocate a page per band).
    const FLAT_MAX_PAGES: usize = 200;
    let band_of = |y: f64, geometry: &mut PageGeometry, bands: &mut Vec<(f64, f64)>| {
        if bands.is_empty() {
            bands.push((0.0, geometry.page(0).content_height().max(1.0)));
        }
        if !y.is_finite() || y < 0.0 {
            return 0;
        }
        loop {
            if let Some(i) = bands
                .iter()
                .position(|&(top, bottom)| y >= top && y < bottom)
            {
                return i;
            }
            if bands.len() >= FLAT_MAX_PAGES {
                return bands.len() - 1;
            }
            let top = bands.last().map_or(0.0, |&(_, bottom)| bottom);
            let height = geometry.page(bands.len()).content_height().max(1.0);
            bands.push((top, top + height));
        }
    };
    struct Lists {
        rects: Vec<FilledRect>,
        strokes: Vec<RoundedStroke>,
        images: Vec<ImageRun>,
        runs: Vec<crate::blitz_engine::TextRun>,
    }
    let mut lists: Vec<Lists> = Vec::new();
    fn list(lists: &mut Vec<Lists>, i: usize) -> &mut Lists {
        while lists.len() <= i {
            lists.push(Lists {
                rects: Vec::new(),
                strokes: Vec::new(),
                images: Vec::new(),
                runs: Vec::new(),
            });
        }
        &mut lists[i]
    }
    for b in &doc.boxes {
        for rect in &b.visual_rects {
            let first = band_of(rect.y, &mut geometry, &mut bands);
            let last = band_of(
                (rect.y + rect.height).max(rect.y) - 1e-6,
                &mut geometry,
                &mut bands,
            )
            .max(first);
            for (i, &(top, bottom)) in bands.iter().enumerate().take(last + 1).skip(first) {
                let y0 = if i == first { rect.y } else { top };
                let y1 = if i == last {
                    rect.y + rect.height
                } else {
                    bottom
                };
                list(&mut lists, i).rects.push(FilledRect {
                    x: rect.x,
                    y: y0 - top,
                    width: rect.width,
                    height: (y1 - y0).max(0.0),
                    color: rect.color,
                });
            }
        }
        for border in &b.rounded_borders {
            let i = band_of(border.y, &mut geometry, &mut bands);
            let top = bands[i].0;
            list(&mut lists, i).strokes.push(RoundedStroke {
                x: border.x,
                y: border.y - top,
                width: border.width,
                height: border.height,
                radius_x: border.radius_x,
                radius_y: border.radius_y,
                stroke_width: border.stroke_width,
                color: border.color,
            });
        }
        for image in &b.image_runs {
            let i = band_of(image.y, &mut geometry, &mut bands);
            let mut image = image.clone();
            image.y -= bands[i].0;
            list(&mut lists, i).images.push(image);
        }
        for run in &b.text_runs {
            let i = band_of(run.origin_y, &mut geometry, &mut bands);
            let mut run = run.clone();
            run.origin_y -= bands[i].0;
            list(&mut lists, i).runs.push(run);
        }
    }
    let total = lists.len().max(1);
    list(&mut lists, total - 1);
    let mut pages = Vec::with_capacity(total);
    for (i, l) in lists.into_iter().enumerate() {
        let page = geometry.page(i).clone();
        let (ml, mt) = (page.margin_left, page.margin_top);
        let rects = l
            .rects
            .into_iter()
            .map(|r| FilledRect {
                x: r.x + ml,
                y: r.y + mt,
                ..r
            })
            .collect();
        let rounded_strokes = l
            .strokes
            .into_iter()
            .map(|s| RoundedStroke {
                x: s.x + ml,
                y: s.y + mt,
                ..s
            })
            .collect();
        let images = l
            .images
            .into_iter()
            .map(|mut im| {
                im.x += ml;
                im.y += mt;
                im
            })
            .collect();
        let text_runs = l
            .runs
            .into_iter()
            .map(|mut r| {
                r.origin_x += ml;
                r.origin_y += mt;
                r
            })
            .collect();
        pages.push(PdfPage {
            width_px: page.width,
            height_px: page.height,
            // Not `merge_adjacent_rects`: the raw render draws Blitz's boxes one rect each.
            rects,
            rounded_strokes,
            images,
            text_runs,
            margin_texts: Vec::new(),
        });
    }
    Paginated {
        report: PaginationReport {
            page_count: total,
            footers: vec![String::new(); total],
            thead_repeated: vec![false; total],
            oversize_hit: false,
        },
        pages,
    }
}

/// The placement-time facts of one [`FragmentPlacement`] (trace only).
struct PlacementState {
    oversize: bool,
    page: usize,
    new_page: Option<&'static str>,
    cursor_before: f64,
    pending_gap: f64,
    pending_gap_source: &'static str,
    gap_applied: f64,
    gap_note: &'static str,
    header_injected: Option<InjectedHeader>,
    placed_top: f64,
}

fn placement_record(frag: &Fragment, state: PlacementState) -> FragmentPlacement {
    let kind = match (frag.members.is_empty(), frag.is_row(), state.oversize) {
        (false, _, false) => "group",
        (false, _, true) => "oversize-group",
        (true, true, false) => "row",
        (true, true, true) => "oversize-row",
        (true, false, false) => "block",
        (true, false, true) => "oversize-block",
    };
    FragmentPlacement {
        kind,
        node_ids: frag.boxes.iter().map(|b| b.node_id).collect(),
        root_tag: frag.boxes.first().and_then(|b| b.tag.clone()),
        table_id: frag.table_id,
        top: frag.top,
        bottom: frag.bottom,
        // Filled in when the next fragment is placed (its `pending_gap`).
        trailing_gap: 0.0,
        gap_source: "none",
        page: state.page,
        new_page: state.new_page,
        cursor_before: state.cursor_before,
        pending_gap: state.pending_gap,
        pending_gap_source: state.pending_gap_source,
        gap_applied: state.gap_applied,
        gap_note: state.gap_note,
        header_injected: state.header_injected,
        placed_top: state.placed_top,
    }
}

fn table_headers_by_id(fragments: &[Fragment]) -> HashMap<usize, TableHeader> {
    let mut headers = HashMap::new();
    collect_table_headers(fragments, &mut headers);
    headers
}

/// Collect every `<thead>` band, including those inside keep-together groups
/// (whose rows need the band if the group falls back to its parts). The band's
/// height reaches down to the flow top of the table's first body fragment, so
/// the flow spacing between band and row (border-spacing) comes with it.
fn collect_table_headers(fragments: &[Fragment], out: &mut HashMap<usize, TableHeader>) {
    for (i, fragment) in fragments.iter().enumerate() {
        collect_table_headers(&fragment.members, out);
        if !fragment.is_thead {
            continue;
        }
        let Some(table_id) = fragment.table_id else {
            continue;
        };
        let (top, bottom) = row_span(&fragment.boxes);
        let band_bottom = fragments[i + 1..]
            .iter()
            .find(|next| next.table_id == Some(table_id) && !next.is_thead)
            .map_or(bottom, |next| next.top);
        out.insert(
            table_id,
            TableHeader {
                boxes: fragment.boxes.clone(),
                top,
                height: (band_bottom - top).max(0.0),
            },
        );
    }
}

impl Fragment {
    fn is_row(&self) -> bool {
        self.boxes
            .first()
            .and_then(|b| b.tag.as_deref())
            .map(|t| t == "tr")
            .unwrap_or(false)
    }
}

/// Decompose the laid-out tree into ordered fragmentation units:
/// each `<tr>` of the items table is its own row fragment; the items `<thead>`
/// is a header fragment; every other top-level body child (including a trailing
/// thead-less totals table) is one block fragment.
fn build_fragments(doc: &LaidOutDoc) -> Vec<Fragment> {
    // Identify the body's direct children (top-level flow), in document order.
    let body = doc.boxes.iter().find(|b| b.tag.as_deref() == Some("body"));
    let body_id = body.map(|b| b.node_id);
    let body_depth = body.map(|b| b.depth).unwrap_or(0);

    let mut fragments = Vec::new();

    // A body whose in-flow content is all inline-level is itself the inline root:
    // Blitz shapes its text into the body box (there is no anonymous block to
    // carry it), and its children in the box list are only the boxes embedded in
    // those lines (atomic inlines, out-of-flow and floated boxes). Fragmenting the
    // body's children alone dropped that text (`tests/walk.rs`); the whole body
    // is one block fragment instead. The body's own background and borders stay
    // out of it: CSS 2.2 §14.2 propagates the body background to the canvas,
    // which pagination does not model (a separate change).
    if let Some(body_index) = doc
        .boxes
        .iter()
        .position(|b| b.tag.as_deref() == Some("body") && !b.text_runs.is_empty())
    {
        let end = subtree_end(&doc.boxes, body_index);
        let mut subtree = doc.boxes[body_index..end].to_vec();
        subtree[0].visual_rects.clear();
        subtree[0].rounded_borders.clear();
        let (top, bottom) = span(&subtree);
        let body = &doc.boxes[body_index];
        fragments.push(Fragment {
            top,
            bottom,
            contained_bottom: bottom.min(box_bottom(body)),
            break_margin: leading_margin(&subtree),
            table_id: None,
            is_thead: false,
            break_before: body.break_before_page,
            members: Vec::new(),
            boxes: subtree,
        });
        finalize_fragments(&mut fragments);
        return fragments;
    }

    // Walk the flat box list. For tables, break into rows; otherwise treat each
    // top-level body child subtree as one fragment.
    let boxes = &doc.boxes;
    let n = boxes.len();
    let mut i = 0;
    while i < n {
        let b = &boxes[i];
        let is_top_level = b.depth == body_depth + 1 && Some(b.node_id) != body_id;
        if !is_top_level {
            i += 1;
            continue;
        }

        // Determine the extent of this subtree (all following boxes deeper).
        let subtree_end = subtree_end(boxes, i);
        let subtree = &boxes[i..subtree_end];

        // The items table is the one carrying a <thead> — its rows are the only
        // fragmentation units that get header repetition. Every other top-level
        // child (including a trailing thead-less totals table) is one block
        // fragment; classification is structural, never natural-language text
        // (no locale coupling).
        let is_items_table = b.tag.as_deref() == Some("table")
            && subtree.iter().any(|x| x.tag.as_deref() == Some("thead"));

        let splittable = is_items_table || should_flatten_transparent_wrapper(b, subtree);
        let mut parts = Vec::new();
        if is_items_table {
            // A thead fragment + one fragment per tbody <tr> (or per
            // `break-inside: avoid` tbody group).
            emit_table_fragments(subtree, &mut parts);
        } else if splittable {
            emit_wrapper_child_fragments(subtree, &mut parts);
        }

        if splittable && !b.break_inside_avoid {
            if b.break_before_page {
                move_forced_break_to_first_part(&mut parts, leading_margin(subtree));
            }
            fragments.append(&mut parts);
        } else {
            // One block fragment. An items table or wrapper marked
            // `break-inside: avoid` keeps its split as the fallback members.
            let (top, bottom) = span(subtree);
            fragments.push(Fragment {
                boxes: subtree.to_vec(),
                top,
                bottom,
                contained_bottom: bottom.min(box_bottom(b)),
                break_margin: leading_margin(subtree),
                table_id: None,
                is_thead: false,
                break_before: b.break_before_page,
                members: parts,
            });
        }

        i = subtree_end;
    }

    finalize_fragments(&mut fragments);
    fragments
}

/// A forced break on a split container (items table, flattened wrapper)
/// lands on its first body part, which also keeps the container's own
/// leading margin (the two collapse into the margin after the break).
fn move_forced_break_to_first_part(parts: &mut [Fragment], container_margin: CollapsedMargin) {
    if let Some(first) = parts.iter_mut().find(|part| !part.is_thead) {
        first.break_before = true;
        first.break_margin = first.break_margin.collapse(container_margin);
    }
}

/// Drop fragments with nothing to paint, at every level (a keep-together
/// group's members get the same treatment so a group that falls back to its
/// parts places exactly what it would have placed without `avoid`). A dropped
/// fragment's forced break (an empty `<div>` with `page-break-before: always`)
/// moves to the next kept fragment, with the dropped fragment's margins (they
/// collapse through it into the next one). No gap is computed here: gaps are
/// the flow distance between placed fragments (see the module docs).
fn finalize_fragments(fragments: &mut Vec<Fragment>) {
    for fragment in fragments.iter_mut() {
        if !fragment.members.is_empty() {
            finalize_fragments(&mut fragment.members);
        }
    }
    let mut carried_break: Option<CollapsedMargin> = None;
    fragments.retain_mut(|fragment| {
        if !fragment_has_renderables(fragment) {
            if fragment.break_before || carried_break.is_some() {
                let margin = carried_break
                    .unwrap_or_default()
                    .collapse(dropped_margin(fragment));
                carried_break = Some(margin);
            }
            return false;
        }
        if let Some(margin) = carried_break.take() {
            fragment.break_before = true;
            fragment.break_margin = fragment.break_margin.collapse(margin);
        }
        true
    });
}

/// Adjoining vertical margins collapsed into one (CSS 2.2 §8.3.1): "the
/// maximum of the adjoining margins" when all are positive, "the absolute
/// maximum of the negative adjoining margins is deducted from the maximum of
/// the positive adjoining margins" otherwise. Kept as the two parts, so
/// collapsing more margins in later (an ancestor's, a dropped fragment's) is
/// exact whatever the order.
///
/// Before port step 09 the paginator kept only the largest positive margin, so
/// a forced break before `section { margin-top: 25px }` whose first `<p>` has
/// `margin-top: -10px` kept 25 px where Chrome 155 keeps 15 px
/// (`tests/pagination_gaps.rs`).
#[derive(Debug, Clone, Copy, Default, PartialEq)]
struct CollapsedMargin {
    /// The largest positive margin (0 when none is positive).
    positive: f64,
    /// The most negative margin (0 when none is negative).
    negative: f64,
}

impl CollapsedMargin {
    fn of(margin: f64) -> Self {
        CollapsedMargin {
            positive: margin.max(0.0),
            negative: margin.min(0.0),
        }
    }

    fn with(self, margin: f64) -> Self {
        self.collapse(Self::of(margin))
    }

    fn collapse(self, other: Self) -> Self {
        CollapsedMargin {
            positive: self.positive.max(other.positive),
            negative: self.negative.min(other.negative),
        }
    }

    /// The collapsed margin's width (negative when the negative part wins).
    fn value(self) -> f64 {
        self.positive + self.negative
    }
}

/// The margins of a fragment with nothing to paint, which collapse through it
/// (CSS 2.2 §8.3.1: its top and bottom margins adjoin) into the next
/// fragment's leading margin.
fn dropped_margin(fragment: &Fragment) -> CollapsedMargin {
    fragment
        .boxes
        .first()
        .map_or(CollapsedMargin::default(), |root| {
            fragment
                .break_margin
                .with(root.margin_top)
                .with(root.margin_bottom)
        })
}

/// The margin kept above a subtree placed right after a forced break (CSS
/// Fragmentation 3 §5.2: "margins after the break are preserved"): the
/// margin-top of the subtree root collapsed with those of its chain of first
/// element children that start at the same flow y, i.e. whose top margins
/// collapse with the root's (CSS 2.2 §8.3.1; Blitz reports each box's OWN
/// margin and places a collapsed-through child at its parent's y). Chrome 155
/// keeps 25 px for `<section style="margin-top:25px"><p style="margin-top:10px">`
/// and 15 px with `margin-top:-10px` on the `<p>` (`tests/pagination_gaps.rs`).
fn leading_margin(subtree: &[LaidOutBox]) -> CollapsedMargin {
    let Some(root) = subtree.first() else {
        return CollapsedMargin::default();
    };
    let mut margin = CollapsedMargin::of(root.margin_top);
    let mut depth = root.depth + 1;
    for b in &subtree[1..] {
        if b.depth < depth {
            break;
        }
        if b.depth > depth || b.tag.is_none() {
            // A text node (whitespace between tags paints nothing and does not
            // separate margins) or something below an element we did not take.
            continue;
        }
        if (b.y - root.y).abs() > 0.5 {
            break;
        }
        margin = margin.with(b.margin_top);
        depth += 1;
    }
    margin
}

/// Bottom edge of a box's border box in flow coordinates.
fn box_bottom(b: &LaidOutBox) -> f64 {
    b.y + b.height
}

/// The height the fit tests use: up to `contained_bottom` when the fragment
/// overflows its containing box by at most `allowance`, else its full span
/// (see `Fragment::contained_bottom`).
fn fit_height(fragment: &Fragment, allowance: f64) -> f64 {
    let overflow = fragment.bottom - fragment.contained_bottom;
    let bottom = if overflow > 0.0 && overflow <= allowance {
        fragment.contained_bottom
    } else {
        fragment.bottom
    };
    (bottom - fragment.top).max(0.0)
}

/// Descent below the baseline assumed for a text run's ink (UNVERIFIED ASSUMPTION: the bundled
/// Liberation faces descend 0.212-0.216 em and DejaVu 0.236 em by their `hhea` metrics; the
/// shaped runs carry no line box, so the band test uses this bound).
const TEXT_INK_DESCENT_EM: f64 = 0.25;

/// The fit height that keeps what the fragment paints (text, backgrounds, borders, images)
/// within `clearance` px below the content box, where a drawn `@bottom-center` line starts
/// (`PageGeometry::bottom_box_clearance`; infinite without one, then 0). `row_tolerance` is how
/// far the fit limit lies below the content box (the table-row drift tolerance, else 0).
fn band_fit_height(fragment: &Fragment, clearance: f64, row_tolerance: f64) -> f64 {
    if !clearance.is_finite() {
        return 0.0;
    }
    let ink_bottom = fragment
        .boxes
        .iter()
        .flat_map(|b| {
            let text = b
                .text_runs
                .iter()
                .filter(|r| !r.glyphs.is_empty())
                .map(|r| r.origin_y + TEXT_INK_DESCENT_EM * f64::from(r.font_size));
            let rects = b.visual_rects.iter().map(|r| r.y + r.height);
            let borders = b.rounded_borders.iter().map(|r| r.y + r.height);
            let images = b.image_runs.iter().map(|r| r.y + r.height);
            text.chain(rects).chain(borders).chain(images)
        })
        .fold(f64::NEG_INFINITY, f64::max);
    if !ink_bottom.is_finite() {
        return 0.0;
    }
    (ink_bottom - fragment.top - clearance + row_tolerance).max(0.0)
}

/// The rows a table placed as ONE block fragment (no `<thead>`, not `break-inside: avoid`)
/// splits into, when it has more than one; `None` for anything else.
fn table_rows_of(fragment: &Fragment) -> Option<Vec<Fragment>> {
    let root = fragment.boxes.first()?;
    if root.tag.as_deref() != Some("table")
        || root.break_inside_avoid
        || fragment.table_id.is_some()
        || !fragment.members.is_empty()
    {
        return None;
    }
    let mut parts = Vec::new();
    emit_table_fragments(&fragment.boxes, &mut parts);
    parts.retain(|part| !part.is_thead);
    finalize_fragments(&mut parts);
    (parts.len() > 1).then_some(parts)
}

/// Whether a fragment has no break point inside it: it paints one line of text or one image,
/// and nothing else that holds content.
fn is_monolithic(fragment: &Fragment) -> bool {
    let mut baselines: Vec<f64> = Vec::new();
    let mut images = 0usize;
    for b in &fragment.boxes {
        images += b.image_runs.len();
        for run in b.text_runs.iter().filter(|r| !r.glyphs.is_empty()) {
            if !baselines.iter().any(|y| (y - run.origin_y).abs() < 0.5) {
                baselines.push(run.origin_y);
            }
        }
    }
    baselines.len() + images == 1
}

/// Whether a fragment, or any fragment nested in it, starts with a forced break.
fn has_forced_break(fragment: &Fragment) -> bool {
    fragment.break_before || fragment.members.iter().any(has_forced_break)
}

fn fragment_has_renderables(fragment: &Fragment) -> bool {
    boxes_have_renderables(&fragment.boxes)
}

fn boxes_have_renderables(boxes: &[LaidOutBox]) -> bool {
    boxes.iter().any(|b| {
        !b.text_runs.is_empty()
            || !b.visual_rects.is_empty()
            || !b.rounded_borders.is_empty()
            || b.tag
                .as_deref()
                .is_some_and(|tag| is_renderable_flow_tag(tag) && b.width > 0.0 && b.height > 0.0)
    })
}

fn is_renderable_flow_tag(tag: &str) -> bool {
    !matches!(
        tag,
        "html" | "head" | "meta" | "title" | "style" | "script" | "body"
    )
}

fn should_flatten_transparent_wrapper(root: &LaidOutBox, subtree: &[LaidOutBox]) -> bool {
    let Some(tag) = root.tag.as_deref() else {
        return false;
    };
    if !matches!(tag, "div" | "main" | "section" | "article") {
        return false;
    }
    if !root.text_runs.is_empty()
        || !root.visual_rects.is_empty()
        || !root.rounded_borders.is_empty()
    {
        return false;
    }
    let child_depth = root.depth + 1;
    subtree.iter().skip(1).any(|b| {
        b.depth == child_depth
            && b.tag.as_deref().is_some_and(|child_tag| {
                !matches!(
                    child_tag,
                    "html" | "head" | "meta" | "title" | "style" | "script" | "body"
                )
            })
    })
}

/// One fragment per child of a flattened wrapper. The wrapper's own margins,
/// padding and the children's collapsed margins are all in the flow positions
/// (Blitz collapsed them), so nothing is added here: the gap between two
/// children, and between the last child and whatever follows the wrapper, is
/// their flow distance (the wrapper's margin is never counted twice).
fn emit_wrapper_child_fragments(subtree: &[LaidOutBox], out: &mut Vec<Fragment>) {
    let root_depth = subtree[0].depth;
    let child_depth = root_depth + 1;
    // A forced break (and the margins after it) carried over children with
    // nothing to paint onto the next child that has something.
    let mut carried_break: Option<CollapsedMargin> = None;
    let mut j = 1;
    while j < subtree.len() {
        if subtree[j].depth != child_depth {
            j += 1;
            continue;
        }

        let child_end = subtree_end(subtree, j);
        let child = &subtree[j..child_end];
        let child_root = &child[0];
        let child_is_items_table = child_root.tag.as_deref() == Some("table")
            && child.iter().any(|x| x.tag.as_deref() == Some("thead"));

        let own_break = child_root.break_before_page.then(|| leading_margin(child));
        let break_margin = match (own_break, carried_break.take()) {
            (None, None) => None,
            (a, b) => Some(a.unwrap_or_default().collapse(b.unwrap_or_default())),
        };
        if child_is_items_table {
            let start = out.len();
            emit_table_fragments(child, out);
            if let Some(margin) = break_margin {
                move_forced_break_to_first_part(&mut out[start..], margin);
            }
        } else if boxes_have_renderables(child) {
            let (top, bottom) = span(child);
            out.push(Fragment {
                boxes: child.to_vec(),
                top,
                bottom,
                contained_bottom: bottom
                    .min(box_bottom(child_root))
                    .min(box_bottom(&subtree[0])),
                break_margin: leading_margin(child).collapse(break_margin.unwrap_or_default()),
                table_id: None,
                is_thead: false,
                break_before: break_margin.is_some(),
                members: Vec::new(),
            });
        } else if let Some(margin) = break_margin {
            carried_break = Some(
                margin
                    .with(child_root.margin_top)
                    .with(child_root.margin_bottom),
            );
        }
        j = child_end;
    }
}

/// Break a table subtree into a thead fragment and per-row fragments. A
/// `<tbody>` marked `break-inside: avoid` becomes one group fragment over its
/// rows; a forced break on a `<tbody>` or `<tr>` lands on its first row.
fn emit_table_fragments(subtree: &[LaidOutBox], out: &mut Vec<Fragment>) {
    let table = TableRef {
        id: subtree.first().map(|b| b.node_id),
    };
    emit_table_parts(subtree, table, out);
}

/// The table a row/header fragment belongs to.
#[derive(Clone, Copy)]
struct TableRef {
    id: Option<usize>,
}

fn emit_table_parts(subtree: &[LaidOutBox], table: TableRef, out: &mut Vec<Fragment>) {
    // Group boxes by their nearest enclosing <tr>/<thead>.
    let mut j = 0;
    let mut pending_break_before = false;
    while j < subtree.len() {
        let b = &subtree[j];
        match b.tag.as_deref() {
            Some(tag @ ("thead" | "tr")) => {
                let end = subtree_end(subtree, j);
                let group = &subtree[j..end];
                // Blitz pre-alpha collapses the <thead>/<tr> wrapper boxes to the
                // table content-top (height 0, y == table top); only the <td>/<th>
                // cells carry the true row geometry. Derive the row span from the
                // cells so per-row fragment heights reflect ONLY that row, not the
                // whole table's accumulated bottom.
                let (top, bottom) = row_span(group);
                let is_thead = tag == "thead";
                out.push(Fragment {
                    boxes: group.to_vec(),
                    top,
                    bottom,
                    contained_bottom: bottom,
                    // Rows and row groups have no margins.
                    break_margin: CollapsedMargin::default(),
                    table_id: table.id,
                    is_thead,
                    break_before: !is_thead && (b.break_before_page || pending_break_before),
                    members: Vec::new(),
                });
                if !is_thead {
                    pending_break_before = false;
                }
                j = end;
            }
            Some("tbody") if b.break_inside_avoid => {
                let end = subtree_end(subtree, j);
                let mut rows = Vec::new();
                emit_table_parts(&subtree[j + 1..end], table, &mut rows);
                rows.retain(|row| !row.is_thead);
                if let Some(first) = rows.first_mut() {
                    first.break_before |= b.break_before_page || pending_break_before;
                    pending_break_before = false;
                }
                if rows.len() > 1 {
                    let top = rows.iter().map(|row| row.top).fold(f64::INFINITY, f64::min);
                    let bottom = rows
                        .iter()
                        .map(|row| row.bottom)
                        .fold(f64::NEG_INFINITY, f64::max);
                    let break_before = rows[0].break_before;
                    out.push(Fragment {
                        boxes: rows
                            .iter()
                            .flat_map(|row| row.boxes.iter().cloned())
                            .collect(),
                        top,
                        bottom,
                        contained_bottom: bottom,
                        break_margin: CollapsedMargin::default(),
                        table_id: table.id,
                        is_thead: false,
                        break_before,
                        members: rows,
                    });
                } else {
                    out.append(&mut rows);
                }
                j = end;
            }
            _ => {
                // Boxes that are not under a <thead>/<tr> (the <table>,
                // <tbody>/<tfoot> wrappers, etc.) carry no fragment today. They
                // are expected to be structural chrome with no renderable text;
                // assert that so a future change putting content on them (e.g.
                // a styled background, a <tfoot> cell) fails loudly in tests
                // rather than silently dropping its visual contribution.
                debug_assert!(
                    b.text_runs.is_empty(),
                    "dropped table-structure box {:?} carried text",
                    b.tag
                );
                if b.tag.as_deref() == Some("tbody") && b.break_before_page {
                    pending_break_before = true;
                }
                j += 1;
            }
        }
    }
}

/// Index just past the subtree rooted at `start` in the flat document-order box
/// list (the next box whose depth <= the start box's depth).
fn subtree_end(boxes: &[LaidOutBox], start: usize) -> usize {
    let base_depth = boxes[start].depth;
    let mut k = start + 1;
    while k < boxes.len() && boxes[k].depth > base_depth {
        k += 1;
    }
    k
}

/// Absolute Y span (min top, max bottom) of a set of boxes.
fn span(boxes: &[LaidOutBox]) -> (f64, f64) {
    let top = boxes.iter().map(|b| b.y).fold(f64::INFINITY, f64::min);
    let bottom = boxes
        .iter()
        .map(|b| b.y + b.height)
        .fold(f64::NEG_INFINITY, f64::max);
    if top.is_finite() {
        (top, bottom)
    } else {
        (0.0, 0.0)
    }
}

/// Absolute Y span of a table row/header group, derived from its `<td>`/`<th>`
/// cell boxes — the only boxes that carry real row geometry under Blitz pre-alpha
/// (the enclosing `<tr>`/`<thead>` wrapper boxes are pinned, height-0, to the
/// table content-top, so a naive [`span`] over the whole group collapses `top`
/// to the table top and makes per-row heights grow cumulatively). Falls back to
/// the full-group span when no cell box exists.
fn row_span(group: &[LaidOutBox]) -> (f64, f64) {
    let cells: Vec<&LaidOutBox> = group
        .iter()
        .filter(|b| matches!(b.tag.as_deref(), Some("td") | Some("th")))
        .collect();
    if cells.is_empty() {
        return span(group);
    }
    let top = cells.iter().map(|b| b.y).fold(f64::INFINITY, f64::min);
    let bottom = cells
        .iter()
        .map(|b| b.y + b.height)
        .fold(f64::NEG_INFINITY, f64::max);
    if top.is_finite() {
        (top, bottom)
    } else {
        span(group)
    }
}

/// Shift a fragment's boxes from absolute `from_top` to a new page-relative
/// `to_top`, preserving relative offsets (text-run origins move too).
fn reposition(boxes: &[LaidOutBox], from_top: f64, to_top: f64) -> Vec<LaidOutBox> {
    let dy = to_top - from_top;
    boxes
        .iter()
        .map(|b| {
            let mut nb = b.clone();
            nb.y += dy;
            for rect in &mut nb.visual_rects {
                rect.y += dy;
            }
            for border in &mut nb.rounded_borders {
                border.y += dy;
            }
            for run in &mut nb.text_runs {
                run.origin_y += dy;
            }
            for image in &mut nb.image_runs {
                image.y += dy;
            }
            nb
        })
        .collect()
}

/// A text baseline on the printed page: the nearest whole CSS px of the PAGE (top margin
/// included). Chrome prints every baseline there and vellora's layout does not: Blitz/Taffy
/// place a line's baseline on a whole px of the CONTENT box, which a fractional top page margin
/// (16mm = 60.4724 px) then moves off the page's px grid. Text only; boxes, borders and images
/// keep their positions (Chrome paints those at fractional positions). Used for body text
/// ([`lower_to_display_list`]) and the `@page` margin-box text ([`build_margin_texts`]); the
/// raw-Blitz render's flat pagination does not snap (Blitz's own placement).
///
/// Evidence (CONFIRMED, Phase C step 03, 2026-10-27, Chrome for Testing 155.0.8059.85, PyMuPDF
/// origins of the reference print): every word baseline of 8 of the 9 measured fixtures is a
/// whole px of the page (invoice 541/541, text-stress-ptbr 1833/1833, ...), and so is every line
/// of the repro set `fidelity/gate/snapshots/2026-10-27/c03/baseline-snap/` (plain blocks,
/// `overflow: hidden`, table cells, a 0.42cm margin, a danfe-like table), including lines whose
/// layout baseline drifts 0.3 px a block (`pad_16mm`: 71, 87, 102, 118, 134, 149; vellora
/// before this: 71.47, 87.47, ...; `tests/baseline_snap.rs`). vellora's words sat
/// frac(margin) = +0.47 px below Chrome's on every 16mm fixture, so a word whose line Taffy
/// rounded 1 px low ended 1.1 pt (> the 1 pt pdf-probe tolerance) from Chrome. The exception is
/// danfe, whose Chrome baselines are fractional with glyphs printed ~0.1 % smaller (9.987 vs
/// 9.996 pt): HYPOTHESIS, Chrome scales that page to fit, after snapping; not modelled.
///
/// Where Blink snaps (paint or page-margin rounding) was not read in its source: the rule here
/// is the measured outcome. Not a Blitz bug (Blitz has no paged output), so there is no raw-Blitz
/// canary; `tests/baseline_snap.rs` pins Chrome's numbers. Delete this (and those tests) only if
/// vellora stops targeting Chrome's print geometry.
fn snap_baseline_to_page_px(y: f64) -> f64 {
    y.round()
}

/// Lower a page's positioned boxes into a krilla display list: background fills
/// for boxes that declare a non-white background (header band etc.) and the
/// already-positioned text runs. X is offset by the left margin; the page-local
/// Y already starts at content top, so we add the top margin.
fn lower_to_display_list(
    boxes: Vec<LaidOutBox>,
    margin_l: f64,
    margin_t: f64,
) -> (
    Vec<FilledRect>,
    Vec<RoundedStroke>,
    Vec<ImageRun>,
    Vec<crate::blitz_engine::TextRun>,
) {
    // `boxes` are already owned (deep-cloned by `reposition`); move the runs out
    // and shift their origins in place rather than cloning each one again.
    let mut rects = Vec::new();
    let mut rounded_strokes = Vec::new();
    let mut images = Vec::new();
    let mut runs = Vec::new();
    for b in boxes {
        for rect in b.visual_rects {
            rects.push(FilledRect {
                x: rect.x + margin_l,
                y: rect.y + margin_t,
                width: rect.width,
                height: rect.height,
                color: rect.color,
            });
        }
        for border in b.rounded_borders {
            rounded_strokes.push(RoundedStroke {
                x: border.x + margin_l,
                y: border.y + margin_t,
                width: border.width,
                height: border.height,
                radius_x: border.radius_x,
                radius_y: border.radius_y,
                stroke_width: border.stroke_width,
                color: border.color,
            });
        }
        for mut image in b.image_runs {
            image.x += margin_l;
            image.y += margin_t;
            images.push(image);
        }
        for mut r in b.text_runs {
            r.origin_x += margin_l;
            r.origin_y = snap_baseline_to_page_px(r.origin_y + margin_t);
            runs.push(r);
        }
    }
    (merge_adjacent_rects(rects), rounded_strokes, images, runs)
}

/// Joins same-colour rects of one band (same `y` and height within 0.5 px) that touch
/// horizontally, within [`RECT_MERGE_EPSILON_PX`], into one rect. Rects with a real gap between
/// them stay apart.
fn merge_adjacent_rects(mut rects: Vec<FilledRect>) -> Vec<FilledRect> {
    rects.sort_by(|a, b| {
        a.y.partial_cmp(&b.y)
            .unwrap_or(std::cmp::Ordering::Equal)
            .then_with(|| a.x.partial_cmp(&b.x).unwrap_or(std::cmp::Ordering::Equal))
    });

    let mut merged: Vec<FilledRect> = Vec::new();
    for rect in rects {
        if let Some(prev) = merged.last_mut() {
            let gap = rect.x - (prev.x + prev.width);
            if prev.color == rect.color
                && (prev.y - rect.y).abs() <= 0.5
                && (prev.height - rect.height).abs() <= 0.5
                && (-0.5..=RECT_MERGE_EPSILON_PX).contains(&gap)
            {
                let right = (rect.x + rect.width).max(prev.x + prev.width);
                prev.width = right - prev.x;
                continue;
            }
        }
        merged.push(rect);
    }
    merged
}

/// The `@page` box of every page, resolved on first use (`PageBox::for_page`).
struct PageGeometry<'a> {
    base: &'a PageBox,
    rtl: bool,
    pages: Vec<PageBox>,
    /// [`PageGeometry::bottom_box_clearance`] of pages 1 to 3, once computed.
    clearances: [Option<f64>; 3],
}

impl<'a> PageGeometry<'a> {
    fn new(base: &'a PageBox, rtl: bool) -> Self {
        PageGeometry {
            base,
            rtl,
            pages: Vec::new(),
            clearances: [None; 3],
        }
    }

    /// The free height between the bottom of page `index`'s content box and the top of the
    /// `@bottom-center` line drawn below it (that line is centred in the bottom margin band,
    /// [`build_margin_texts`]); unbounded when the page draws none. The line is laid out with
    /// provisional counters (page `index + 1` of `index + 1`): a margin box is one line that
    /// does not wrap, so its height does not depend on the digits. Like the box itself, it
    /// depends only on whether the page is the first and on its side (page n ≥ 3 is page n − 2).
    fn bottom_box_clearance(&mut self, index: usize, doc: &LaidOutDoc) -> f64 {
        let key = if index >= 3 {
            1 + (index - 1) % 2
        } else {
            index
        };
        if let Some(clearance) = self.clearances[key] {
            return clearance;
        }
        let page = self.page(key).clone();
        let clearance = page
            .margins_content
            .iter()
            .find(|mc| mc.which == MarginBox::BottomCenter)
            .filter(|_| has_body_text(doc))
            .and_then(|mc| {
                let text = resolve_content(&mc.parts, key + 1, key + 1);
                if text.trim().is_empty() {
                    return None;
                }
                let request = crate::blitz_engine::MarginRequest {
                    text: &text,
                    page_style: &mc.page_style,
                    box_style: &mc.box_style,
                };
                crate::blitz_engine::lay_out_margin_texts(&doc.page_context, &[request])
                    .into_iter()
                    .next()
                    .flatten()
            })
            .map_or(f64::INFINITY, |line| {
                ((page.margin_bottom - line.height) / 2.0).max(0.0)
            });
        self.clearances[key] = Some(clearance);
        clearance
    }

    /// The box of page `index` (0-based).
    fn page(&mut self, index: usize) -> &PageBox {
        while self.pages.len() <= index {
            let n = self.pages.len();
            // A page's box depends only on whether it is page 1 and on its side (left/right), so
            // page n ≥ 3 is page n − 2 again; this resolves at most three pages, not one cascade
            // of every `@page` rule per page (port step 09).
            let next = if n >= 3 {
                self.pages[n - 2].clone()
            } else {
                self.base.for_page(n, self.rtl)
            };
            self.pages.push(next);
        }
        &self.pages[index]
    }

    /// The height a fragment may take on page `index`: the page's content height, plus the row
    /// fit slack ([`TABLE_ROW_FIT_SLACK_PX`]) for a table row.
    fn fit_limit(&mut self, index: usize, is_table_row: bool) -> f64 {
        let usable_h = self.page(index).content_height();
        if is_table_row {
            usable_h + TABLE_ROW_FIT_SLACK_PX
        } else {
            usable_h
        }
    }
}

/// The running headers/footers of every page (`@top-center` / `@bottom-center`), laid out by
/// Blitz with their cascaded text properties ([`crate::blitz_engine::lay_out_margin_texts`]) and
/// placed like Chrome 155 places them (CSS Paged Media 3 §5.3, UA defaults `text-align: center`,
/// `vertical-align: middle`):
///
/// - horizontally, the line is centred in the page area (between the left and right page
///   margins, so asymmetric margins move it);
/// - vertically, the line box is centred in the margin band (the top or bottom page margin), so
///   the baseline sits (ascent − descent) / 2 below the band's centre whatever the line height.
///
/// Chrome snaps that baseline to whole device pixels (≤ 1 px), and so does vellora since Phase C
/// step 03 ([`snap_baseline_to_page_px`]: text-stress-ptbr's "Página n de 7", Chrome 1093 px,
/// vellora 1092.54 before); WeasyPrint does not.
/// A document without any shaped body text gets no margin text, as in Chrome (an empty body
/// prints no footer). Fonts are deduplicated against the body's faces so a face is embedded
/// once (`tests/pipeline.rs::each_face_is_embedded_exactly_once_across_pages`).
fn build_margin_texts(doc: &LaidOutDoc, pages: &[PageBox]) -> Vec<Vec<(MarginBox, MarginText)>> {
    let mut out: Vec<Vec<(MarginBox, MarginText)>> = (0..pages.len()).map(|_| Vec::new()).collect();
    if !has_body_text(doc) {
        return out;
    }
    let total = pages.len();
    // (page index, box, resolved text) per non-empty margin box, in page order.
    let mut wanted: Vec<(usize, &crate::page_css::MarginContent, String)> = Vec::new();
    for (i, page) in pages.iter().enumerate() {
        for mc in &page.margins_content {
            let text = resolve_content(&mc.parts, i + 1, total);
            if !text.trim().is_empty() {
                wanted.push((i, mc, text));
            }
        }
    }
    let requests: Vec<crate::blitz_engine::MarginRequest<'_>> = wanted
        .iter()
        .map(|(_, mc, text)| crate::blitz_engine::MarginRequest {
            text,
            page_style: &mc.page_style,
            box_style: &mc.box_style,
        })
        .collect();
    let layouts = crate::blitz_engine::lay_out_margin_texts(&doc.page_context, &requests);

    let body_faces: Vec<&std::sync::Arc<Vec<u8>>> = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .map(|r| &r.font_data)
        .collect();
    let mut faces: Vec<std::sync::Arc<Vec<u8>>> = Vec::new();
    for ((index, mc, text), layout) in wanted.into_iter().zip(layouts) {
        let Some(layout) = layout else {
            continue;
        };
        let page = &pages[index];
        let area_w = page.width - page.margin_left - page.margin_right;
        let x0 = page.margin_left + (area_w - layout.width) / 2.0;
        let (band_top, band_h) = match mc.which {
            MarginBox::TopCenter => (0.0, page.margin_top),
            MarginBox::BottomCenter => (page.height - page.margin_bottom, page.margin_bottom),
        };
        let y0 = band_top + (band_h - layout.height) / 2.0;
        let runs = layout
            .runs
            .into_iter()
            .map(|mut run| {
                run.origin_x += x0;
                run.origin_y = snap_baseline_to_page_px(run.origin_y + y0);
                run.font_data = shared_face(&run.font_data, &body_faces, &mut faces);
                run
            })
            .collect();
        out[index].push((mc.which, MarginText { text, runs }));
    }
    out
}

/// Whether the document shapes any body text: without it no margin box is drawn (Chrome prints
/// no footer for an empty body).
fn has_body_text(doc: &LaidOutDoc) -> bool {
    doc.boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .any(|r| !r.glyphs.is_empty())
}

/// The body's `Arc` of the same face bytes (or the first margin run's), so the PDF embeds each
/// face once: the margin-box document materializes its own copies of the bytes.
fn shared_face(
    data: &std::sync::Arc<Vec<u8>>,
    body: &[&std::sync::Arc<Vec<u8>>],
    seen: &mut Vec<std::sync::Arc<Vec<u8>>>,
) -> std::sync::Arc<Vec<u8>> {
    let same = |other: &std::sync::Arc<Vec<u8>>| {
        std::sync::Arc::ptr_eq(other, data) || (other.len() == data.len() && **other == **data)
    };
    if let Some(found) = body.iter().find(|f| same(f)) {
        return (*found).clone();
    }
    if let Some(found) = seen.iter().find(|f| same(f)) {
        return found.clone();
    }
    seen.push(data.clone());
    data.clone()
}

#[cfg(test)]
mod merge_tests {
    use super::*;

    fn rect(x: f64, width: f64) -> FilledRect {
        FilledRect {
            x,
            y: 10.0,
            width,
            height: 96.0,
            color: [0, 0, 0],
        }
    }

    fn spans(rects: Vec<FilledRect>) -> Vec<(f64, f64)> {
        merge_adjacent_rects(rects)
            .iter()
            .map(|r| (r.x, r.width))
            .collect()
    }

    #[test]
    fn touching_and_overlapping_same_colour_rects_merge() {
        assert_eq!(
            spans(vec![rect(8.0, 20.0), rect(28.0, 20.0)]),
            vec![(8.0, 40.0)]
        );
        assert_eq!(
            spans(vec![rect(8.0, 20.0), rect(27.5, 20.0)]),
            vec![(8.0, 39.5)]
        );
        assert_eq!(
            spans(vec![rect(8.0, 20.0), rect(28.03, 20.0)]),
            vec![(8.0, 40.03)]
        );
    }

    #[test]
    fn a_real_gap_is_never_bridged() {
        // WPT css/CSS2/linebox/line-height-006.xht: two stripes 2 px apart. The corpus's merged
        // gaps before port step 10-rects were exactly 1 and 2 px (collapsed-border segments,
        // `cellspacing` tables Blitz lays out with the default 2 px spacing).
        for gap in [0.1, 1.0, 2.0, 4.0] {
            assert_eq!(
                spans(vec![rect(8.0, 20.0), rect(28.0 + gap, 20.0)]),
                vec![(8.0, 20.0), (28.0 + gap, 20.0)],
                "gap {gap}"
            );
        }
    }

    #[test]
    fn different_colour_or_band_never_merges() {
        let mut other = rect(28.0, 20.0);
        other.color = [1, 0, 0];
        assert_eq!(spans(vec![rect(8.0, 20.0), other]).len(), 2);
        let mut lower = rect(28.0, 20.0);
        lower.y = 11.0;
        assert_eq!(spans(vec![rect(8.0, 20.0), lower]).len(), 2);
    }
}
