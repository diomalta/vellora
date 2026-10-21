//! vellora's own pagination layer.
//!
//! Blitz/Taffy produce ONE continuous flow. This pass consumes that laid-out
//! tree (absolute document coordinates) and slices it into ordered pages
//! against the `@page` content box, repeating `<thead>` on table continuation
//! pages, never splitting a row, keeping the totals block once, and resolving
//! `counter(page)`/`counter(pages)` for the running footer. Coordinates emitted
//! into the display list are PAGE-LOCAL.

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

/// Browser-print engines make page-break decisions after fractional layout and
/// font fallback. Our deterministic bundled font can push a table row a few px
/// past the content-box bottom even when Chromium keeps the same row on the
/// page, leaving a visibly under-filled page. Keep this tolerance small and
/// table-row-only so it absorbs metric drift without pulling another full row.
const TABLE_ROW_BREAK_TOLERANCE_PX: f64 = 12.0;
const RECT_MERGE_TOLERANCE_PX: f64 = 4.0;

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
    /// This fragment's own trailing gap (the gap requested before the NEXT one).
    pub trailing_gap: f64,
    /// Which rule produced `trailing_gap` (see `Fragment::gap_source`).
    pub gap_source: &'static str,
    /// 0-based page index.
    pub page: usize,
    /// Why this fragment opened a new page: `forced-break`, `overflow`,
    /// `oversize` (it did not fit an empty page), or `after-oversize` (the
    /// previous fragment was oversize and closed its page); `None` when it
    /// continued the current page (or was the very first fragment).
    pub new_page: Option<&'static str>,
    /// Used height of the page before this fragment (and before its gap).
    pub cursor_before: f64,
    /// The previous fragment's trailing gap and its source, i.e. the gap this
    /// fragment asked for.
    pub pending_gap: f64,
    pub pending_gap_source: &'static str,
    /// The gap actually added above it, and why it differs from `pending_gap`:
    /// `applied`, `none` (nothing pending), `page-start` (gaps vanish at a page
    /// top), `dropped-to-fit` (the fragment fits only without the gap).
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
    /// Flow top of the band and its height.
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
    trailing_gap: f64,
    /// Which rule set `trailing_gap` (debug trace only; never read by layout):
    /// `margin-bottom` (the root box's Blitz margin), `margin-bottom+wrapper` /
    /// `wrapper-margin-bottom` (plus / only a flattened wrapper's own margin, see
    /// `emit_wrapper_child_fragments`), `flow-gap` (next fragment's flow top −
    /// this bottom, when the gap was 0), `group-gap` (inherited from a
    /// keep-together group), `none` (table parts).
    gap_source: &'static str,
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
    height: f64,
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
    let usable_h = page_box.content_height();
    let margin_l = page_box.margin_left;
    let margin_t = page_box.margin_top;

    let fragments = build_fragments(doc);
    let table_row_fit_limit = usable_h + TABLE_ROW_BREAK_TOLERANCE_PX;

    let headers = table_headers_by_id(&fragments);

    // Phase one: break fragments into page slices.
    let mut page_slices: Vec<Vec<LaidOutBox>> = Vec::new();
    let mut current: Vec<LaidOutBox> = Vec::new();
    let mut cursor = 0.0_f64; // used height on the current page
    let mut thead_repeated: Vec<bool> = Vec::new();
    let mut oversize_hit = false;
    let mut pending_gap = 0.0_f64;
    // Trace only: the source of `pending_gap`, and whether an oversize fragment
    // closed the previous page (never read by layout).
    let mut pending_gap_source: &'static str = "none";
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

    // Inject the repeated <thead> band at the CURRENT cursor — the table's start
    // on this page — not at the page top. On a continuation page the cursor is 0
    // (page top, the desired place), but on the table's FIRST page the cursor sits
    // below the title/intro, so injecting at 0 would overlap that preceding content.
    let inject_header = |current: &mut Vec<LaidOutBox>, cursor: &mut f64, header: &TableHeader| {
        let mut header_boxes = reposition(&header.boxes, header.top, *cursor);
        current.append(&mut header_boxes);
        *cursor += header.height;
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
        let fit_limit = if is_table_row {
            table_row_fit_limit
        } else {
            usable_h
        };

        // A table row that lands on a page without the header yet needs the
        // header band placed above it; account for its height in the fit test so
        // the header is never stranded at the bottom of a page.
        let header_needed = is_table_row
            && table_header.is_some()
            && frag
                .table_id
                .is_some_and(|table_id| !headers_on_current.contains(&table_id));
        let lead_h = if header_needed {
            table_header.map(|header| header.height).unwrap_or(0.0)
        } else {
            0.0
        };

        // A keep-together group that cannot fit even on an empty page is split
        // back into its parts (the forced break, if any, moves to the first).
        // A forced break inside the group also splits it: a forced break wins
        // over `avoid` (CSS Fragmentation 3, §4.4).
        let group_header_h = table_header.map(|header| header.height).unwrap_or(0.0);
        let forced_break_inside = frag.members.iter().skip(1).any(has_forced_break);
        if !frag.members.is_empty()
            && (frag_height + group_header_h > fit_limit || forced_break_inside)
        {
            let break_before = frag.break_before;
            let mut members = frag.members;
            if let Some(first) = members.first_mut() {
                first.break_before |= break_before;
            }
            for member in members.into_iter().rev() {
                queue.push_front(member);
            }
            if let Some(t) = trace.as_deref_mut() {
                t.groups_split += 1;
            }
            continue;
        }

        // Trace only: why (if at all) this fragment opens a new page.
        let mut new_page: Option<&'static str> =
            std::mem::take(&mut page_closed_by_oversize).then_some("after-oversize");

        // A forced break starts this fragment on a fresh page.
        if frag.break_before && !current.is_empty() {
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                !headers_on_current.is_empty(),
            );
            cursor = 0.0;
            headers_on_current.clear();
            new_page = Some("forced-break");
        }

        let mut page_gap = if current.is_empty() { 0.0 } else { pending_gap };
        let mut gap_note = if current.is_empty() {
            "page-start"
        } else {
            "applied"
        };
        if page_gap > 0.0
            && cursor + frag_height + lead_h + page_gap > fit_limit
            && cursor + frag_height + lead_h <= fit_limit
        {
            page_gap = 0.0;
            gap_note = "dropped-to-fit";
        }

        // Oversized single fragment (e.g. a row taller than an empty page):
        // own page, then terminate that fragment (never split mid-row). The
        // fragment is placed in full and bleeds past the page box — krilla does
        // not clip to the media box, so over-height content is emitted, not
        // trimmed. A future clip pass would live in pdf::emit.
        if frag_height + lead_h + page_gap > fit_limit && (frag_height > fit_limit || lead_h == 0.0)
        {
            if !current.is_empty() {
                push_page(
                    &mut current,
                    &mut page_slices,
                    &mut thead_repeated,
                    !headers_on_current.is_empty(),
                );
                new_page = Some("oversize");
            }
            cursor = 0.0;
            headers_on_current.clear();
            // Even an oversize table row keeps its header band on its own page.
            let mut header_injected = None;
            if let (Some(table_id), Some(header)) = (frag.table_id, table_header) {
                inject_header(&mut current, &mut cursor, header);
                headers_on_current.insert(table_id);
                header_injected = Some(InjectedHeader::new(table_id, header));
            }
            if let Some(t) = trace.as_deref_mut() {
                t.placements.push(placement_record(
                    &frag,
                    PlacementState {
                        oversize: true,
                        page: page_slices.len(),
                        new_page,
                        cursor_before: 0.0,
                        pending_gap,
                        pending_gap_source,
                        gap_applied: 0.0,
                        gap_note: "page-start",
                        header_injected,
                        placed_top: cursor,
                    },
                ));
            }
            let mut placed = reposition(&frag.boxes, frag.top, cursor);
            current.append(&mut placed);
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                !headers_on_current.is_empty(),
            );
            cursor = 0.0;
            headers_on_current.clear();
            oversize_hit = true;
            pending_gap = frag.trailing_gap;
            pending_gap_source = frag.gap_source;
            page_closed_by_oversize = true;
            continue;
        }

        // Does the fragment (plus any header it needs) fit in the remaining
        // space on the current page?
        if cursor + frag_height + lead_h + page_gap > fit_limit && !current.is_empty() {
            // Move whole fragment to next page (rows never split).
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                !headers_on_current.is_empty(),
            );
            cursor = 0.0;
            headers_on_current.clear();
            page_gap = 0.0;
            new_page = Some("overflow");
        }

        let page_gap = if current.is_empty() { 0.0 } else { page_gap };
        if current.is_empty() {
            gap_note = "page-start";
        }
        let cursor_before = cursor;
        cursor += page_gap;

        // A table row entering a page without the header (table start OR a
        // continuation page) gets the header band re-injected at the top first.
        let mut header_injected = None;
        if let (Some(table_id), Some(header)) = (frag.table_id, table_header) {
            if !headers_on_current.contains(&table_id) {
                inject_header(&mut current, &mut cursor, header);
                headers_on_current.insert(table_id);
                header_injected = Some(InjectedHeader::new(table_id, header));
            }
        }

        if let Some(t) = trace.as_deref_mut() {
            t.placements.push(placement_record(
                &frag,
                PlacementState {
                    oversize: false,
                    page: page_slices.len(),
                    new_page,
                    cursor_before,
                    pending_gap,
                    pending_gap_source,
                    gap_applied: page_gap,
                    gap_note: if pending_gap == 0.0 { "none" } else { gap_note },
                    header_injected,
                    placed_top: cursor,
                },
            ));
        }
        let mut placed = reposition(&frag.boxes, frag.top, cursor);
        current.append(&mut placed);
        cursor += frag_height;
        pending_gap = frag.trailing_gap;
        pending_gap_source = frag.gap_source;
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
    let mut pages = Vec::with_capacity(total);
    let mut footers = Vec::with_capacity(total);
    for (i, slice) in page_slices.into_iter().enumerate() {
        let page_num = i + 1;
        let (rects, rounded_strokes, images, text_runs) =
            lower_to_display_list(slice, margin_l, margin_t);

        // Resolve and place running header/footer margin-box content. Keep
        // `report.footers` in lock-step with what is actually emitted: a footer
        // string is only recorded when its `MarginText` was actually produced
        // (build_margin_text returns None when there is no body font to shape
        // with, e.g. an empty document), so a reported footer always
        // corresponds to a rendered one.
        let mut margin_texts = Vec::new();
        let mut footer_text = String::new();
        for mc in &page_box.margins_content {
            let resolved = resolve_content(&mc.parts, page_num, total);
            if let Some(mt) = build_margin_text(&resolved, mc.which, page_box, doc) {
                if mc.which == MarginBox::BottomCenter {
                    footer_text = resolved.clone();
                }
                margin_texts.push(mt);
            }
        }
        footers.push(footer_text);

        pages.push(PdfPage {
            width_px: page_box.width,
            height_px: page_box.height,
            rects,
            rounded_strokes,
            images,
            text_runs,
            margin_texts,
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
        trailing_gap: frag.trailing_gap,
        gap_source: frag.gap_source,
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
/// (whose rows need the band if the group falls back to its parts).
fn collect_table_headers(fragments: &[Fragment], out: &mut HashMap<usize, TableHeader>) {
    for fragment in fragments {
        collect_table_headers(&fragment.members, out);
        if !fragment.is_thead {
            continue;
        }
        let Some(table_id) = fragment.table_id else {
            continue;
        };
        let (top, bottom) = row_span(&fragment.boxes);
        out.insert(
            table_id,
            TableHeader {
                boxes: fragment.boxes.clone(),
                top,
                height: (bottom - top).max(0.0),
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
            emit_wrapper_child_fragments(subtree, b.margin_bottom, &mut parts);
        }

        if splittable && !b.break_inside_avoid {
            if b.break_before_page {
                if let Some(first) = parts.iter_mut().find(|part| !part.is_thead) {
                    first.break_before = true;
                }
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
                trailing_gap: b.margin_bottom,
                gap_source: "margin-bottom",
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

/// Compute inter-fragment gaps and drop fragments with nothing to paint, at
/// every level: a keep-together group's members get the same treatment so a
/// group that falls back to its parts keeps the spacing it would have had
/// without `avoid`, and its last member inherits the group's trailing gap. A
/// dropped fragment's forced break (an empty `<div>` with
/// `page-break-before: always`) moves to the next kept fragment.
fn finalize_fragments(fragments: &mut Vec<Fragment>) {
    apply_inter_fragment_gaps(fragments);
    for fragment in fragments.iter_mut() {
        if fragment.members.is_empty() {
            continue;
        }
        finalize_fragments(&mut fragment.members);
        let group_gap = fragment.trailing_gap;
        if let Some(last) = fragment.members.last_mut() {
            if last.trailing_gap == 0.0 {
                last.trailing_gap = group_gap;
                last.gap_source = "group-gap";
            }
        }
    }
    let mut carried_break = false;
    fragments.retain_mut(|fragment| {
        if !fragment_has_renderables(fragment) {
            carried_break |= fragment.break_before;
            return false;
        }
        fragment.break_before |= carried_break;
        carried_break = false;
        true
    });
}

/// Whether a fragment, or any fragment nested in it, starts with a forced break.
fn has_forced_break(fragment: &Fragment) -> bool {
    fragment.break_before || fragment.members.iter().any(has_forced_break)
}

fn apply_inter_fragment_gaps(fragments: &mut [Fragment]) {
    if fragments.len() < 2 {
        return;
    }

    for i in 0..fragments.len() - 1 {
        if fragments[i].trailing_gap > 0.0 || !fragment_has_renderables(&fragments[i]) {
            continue;
        }
        let Some(next_i) =
            ((i + 1)..fragments.len()).find(|idx| fragment_has_renderables(&fragments[*idx]))
        else {
            continue;
        };
        let current_is_table_part = fragments[i].is_thead || fragments[i].is_row();
        let next_is_table_part = fragments[next_i].is_thead || fragments[next_i].is_row();
        if current_is_table_part && next_is_table_part {
            continue;
        }
        fragments[i].trailing_gap = (fragments[next_i].top - fragments[i].bottom).max(0.0);
        fragments[i].gap_source = "flow-gap";
    }
}

fn fragment_has_renderables(fragment: &Fragment) -> bool {
    fragment.boxes.iter().any(|b| {
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

fn emit_wrapper_child_fragments(
    subtree: &[LaidOutBox],
    wrapper_trailing_gap: f64,
    out: &mut Vec<Fragment>,
) {
    let root_depth = subtree[0].depth;
    let child_depth = root_depth + 1;
    let before = out.len();
    let mut carried_break = false;
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

        let break_before = child_root.break_before_page || carried_break;
        carried_break = false;
        if child_is_items_table {
            let start = out.len();
            emit_table_fragments(child, out);
            if break_before {
                if let Some(first) = out[start..].iter_mut().find(|part| !part.is_thead) {
                    first.break_before = true;
                }
            }
        } else if fragment_has_renderables(&Fragment {
            boxes: child.to_vec(),
            top: 0.0,
            bottom: 0.0,
            trailing_gap: 0.0,
            gap_source: "none",
            table_id: None,
            is_thead: false,
            break_before: false,
            members: Vec::new(),
        }) {
            let (top, bottom) = span(child);
            out.push(Fragment {
                boxes: child.to_vec(),
                top,
                bottom,
                trailing_gap: child_root.margin_bottom,
                gap_source: "margin-bottom",
                table_id: None,
                is_thead: false,
                break_before,
                members: Vec::new(),
            });
        } else {
            carried_break = break_before;
        }
        j = child_end;
    }

    if out.len() > before && wrapper_trailing_gap > 0.0 {
        if let Some(last) = out.last_mut() {
            let own_gap = last.trailing_gap;
            last.trailing_gap += wrapper_trailing_gap;
            last.gap_source = if own_gap == 0.0 {
                "wrapper-margin-bottom"
            } else {
                "margin-bottom+wrapper"
            };
        }
    }
}

/// Break a table subtree into a thead fragment and per-row fragments. A
/// `<tbody>` marked `break-inside: avoid` becomes one group fragment over its
/// rows; a forced break on a `<tbody>` or `<tr>` lands on its first row.
fn emit_table_fragments(subtree: &[LaidOutBox], out: &mut Vec<Fragment>) {
    let table_id = subtree.first().map(|b| b.node_id);
    emit_table_parts(subtree, table_id, out);
}

fn emit_table_parts(subtree: &[LaidOutBox], table_id: Option<usize>, out: &mut Vec<Fragment>) {
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
                    trailing_gap: 0.0,
                    gap_source: "none",
                    table_id,
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
                emit_table_parts(&subtree[j + 1..end], table_id, &mut rows);
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
                        trailing_gap: 0.0,
                        gap_source: "none",
                        table_id,
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
            r.origin_y += margin_t;
            runs.push(r);
        }
    }
    (merge_adjacent_rects(rects), rounded_strokes, images, runs)
}

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
                && (-0.5..=RECT_MERGE_TOLERANCE_PX).contains(&gap)
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

/// Build a running-header/footer `MarginText` centered in the top/bottom margin
/// band. The string is shaped by krilla's `draw_text` against the borrowed body
/// font, so glyphs + ToUnicode are correct (the footer is selectable). Width is
/// estimated for centering from an average glyph advance.
fn build_margin_text(
    text: &str,
    which: MarginBox,
    page_box: &PageBox,
    doc: &LaidOutDoc,
) -> Option<MarginText> {
    if text.is_empty() {
        return None;
    }
    // Borrow a font face from any body run; without one (truly empty document)
    // there is no font to shape the footer with.
    let sample = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|r| !r.glyphs.is_empty())?;

    let font_size = 9.0_f32;
    // Estimate centered X from an average advance per char (good enough for a
    // centered single-line label; exact width needs a shaper we run at emit).
    let avg_advance = {
        let total: f32 = sample.glyphs.iter().map(|g| g.advance).sum();
        let per = total / sample.glyphs.len().max(1) as f32;
        (per / sample.font_size) * font_size
    };
    let est_w = avg_advance as f64 * text.chars().count() as f64;
    let x = ((page_box.width - est_w) / 2.0).max(page_box.margin_left);
    let y = match which {
        MarginBox::BottomCenter => page_box.height - page_box.margin_bottom / 2.0,
        MarginBox::TopCenter => page_box.margin_top / 2.0,
    };

    Some(MarginText {
        text: text.to_string(),
        origin_x: x,
        origin_y: y,
        font_size,
        font_data: sample.font_data.clone(),
        font_index: sample.font_index,
        color: [60, 60, 60],
    })
}
