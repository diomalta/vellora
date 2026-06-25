//! vellora's own pagination layer.
//!
//! Blitz/Taffy produce ONE continuous flow. This pass consumes that laid-out
//! tree (absolute document coordinates) and slices it into ordered pages
//! against the `@page` content box, repeating `<thead>` on table continuation
//! pages, never splitting a row, keeping the totals block once, and resolving
//! `counter(page)`/`counter(pages)` for the running footer. Coordinates emitted
//! into the display list are PAGE-LOCAL.

use crate::blitz_engine::{LaidOutBox, LaidOutDoc};
use crate::page_css::{resolve_content, MarginBox, PageBox};
use crate::pdf::{FilledRect, MarginText, PdfPage};

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
    /// True for each page that carries the items-table `<thead>` header band
    /// (the table-start page and every continuation page alike).
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

/// A fragmentable unit: a top-level flow item, or a single table row. Each
/// carries its absolute Y span so the breaker can place it on a page.
struct Fragment {
    /// Boxes belonging to this fragment (absolute coords).
    boxes: Vec<LaidOutBox>,
    top: f64,
    bottom: f64,
    trailing_gap: f64,
    /// If this fragment is a `<thead>`, its boxes get repeated on continuation.
    is_thead: bool,
}

/// Paginate a laid-out document against the `@page` box.
pub fn paginate(doc: &LaidOutDoc, page_box: &PageBox) -> Paginated {
    let usable_h = page_box.content_height();
    let margin_l = page_box.margin_left;
    let margin_t = page_box.margin_top;

    let fragments = build_fragments(doc);
    let table_row_fit_limit = usable_h + TABLE_ROW_BREAK_TOLERANCE_PX;

    // Find the items-table thead so it can be repeated on continuation pages.
    let thead_boxes: Vec<LaidOutBox> = fragments
        .iter()
        .find(|f| f.is_thead)
        .map(|f| f.boxes.clone())
        .unwrap_or_default();
    // The header row's true top/bottom come from its <th> cells (the wrapper
    // boxes are height-0 at the table top); height is the cell band, not 0.
    let (thead_top, thead_bottom) = row_span(&thead_boxes);
    let thead_height = (thead_bottom - thead_top).max(0.0);

    // Phase one: break fragments into page slices.
    let mut page_slices: Vec<Vec<LaidOutBox>> = Vec::new();
    let mut current: Vec<LaidOutBox> = Vec::new();
    let mut cursor = 0.0_f64; // used height on the current page
    let mut thead_repeated: Vec<bool> = Vec::new();
    let mut oversize_hit = false;
    let mut pending_gap = 0.0_f64;
    // Tracks whether the current page already carries the header band. Reset on
    // every page break and re-set whenever a tbody row injects the header, so the
    // header leads the table-start page AND every continuation page —
    // including the oversize-branch page — exactly once each.
    let mut header_on_current = false;

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
    let inject_header = |current: &mut Vec<LaidOutBox>, cursor: &mut f64| {
        let mut header = reposition(&thead_boxes, thead_top, *cursor);
        current.append(&mut header);
        *cursor += thead_height;
    };

    for frag in &fragments {
        if frag.is_thead {
            // The header is emitted inline as part of its table's first page and
            // re-injected on continuations; skip standalone placement here.
            continue;
        }
        let frag_height = frag.bottom - frag.top;
        let is_table_row = frag.is_row() && !thead_boxes.is_empty();
        let fit_limit = if is_table_row {
            table_row_fit_limit
        } else {
            usable_h
        };

        // A table row that lands on a page without the header yet needs the
        // header band placed above it; account for its height in the fit test so
        // the header is never stranded at the bottom of a page.
        let header_needed = is_table_row && !header_on_current;
        let lead_h = if header_needed { thead_height } else { 0.0 };
        let mut page_gap = if current.is_empty() { 0.0 } else { pending_gap };
        if page_gap > 0.0
            && cursor + frag_height + lead_h + page_gap > fit_limit
            && cursor + frag_height + lead_h <= fit_limit
        {
            page_gap = 0.0;
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
                    header_on_current,
                );
            }
            cursor = 0.0;
            header_on_current = false;
            // Even an oversize table row keeps its header band on its own page.
            if is_table_row {
                inject_header(&mut current, &mut cursor);
                header_on_current = true;
            }
            let mut placed = reposition(&frag.boxes, frag.top, cursor);
            current.append(&mut placed);
            push_page(
                &mut current,
                &mut page_slices,
                &mut thead_repeated,
                header_on_current,
            );
            cursor = 0.0;
            header_on_current = false;
            oversize_hit = true;
            pending_gap = frag.trailing_gap;
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
                header_on_current,
            );
            cursor = 0.0;
            header_on_current = false;
            page_gap = 0.0;
        }

        let page_gap = if current.is_empty() { 0.0 } else { page_gap };
        cursor += page_gap;

        // A table row entering a page without the header (table start OR a
        // continuation page) gets the header band re-injected at the top first.
        if is_table_row && !header_on_current {
            inject_header(&mut current, &mut cursor);
            header_on_current = true;
        }

        let mut placed = reposition(&frag.boxes, frag.top, cursor);
        current.append(&mut placed);
        cursor += frag_height;
        pending_gap = frag.trailing_gap;
    }

    if !current.is_empty() {
        push_page(
            &mut current,
            &mut page_slices,
            &mut thead_repeated,
            header_on_current,
        );
    }

    // Pagination always emits at least one page (blank if no content).
    if page_slices.is_empty() {
        page_slices.push(Vec::new());
        thead_repeated.push(false);
    }

    let total = page_slices.len();

    // Phase two: build PdfPages, resolving running header/footer counters now
    // that the total page count is known.
    let mut pages = Vec::with_capacity(total);
    let mut footers = Vec::with_capacity(total);
    for (i, slice) in page_slices.into_iter().enumerate() {
        let page_num = i + 1;
        let (rects, text_runs) = lower_to_display_list(slice, margin_l, margin_t);

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

        if is_items_table {
            // Emit a thead fragment + one fragment per tbody <tr>.
            emit_table_fragments(subtree, &mut fragments);
        } else {
            let (top, bottom) = span(subtree);
            fragments.push(Fragment {
                boxes: subtree.to_vec(),
                top,
                bottom,
                trailing_gap: b.margin_bottom,
                is_thead: false,
            });
        }

        i = subtree_end;
    }

    fragments
}

/// Break a table subtree into a thead fragment and per-row fragments.
fn emit_table_fragments(subtree: &[LaidOutBox], out: &mut Vec<Fragment>) {
    // Group boxes by their nearest enclosing <tr>/<thead>.
    let mut j = 0;
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
                out.push(Fragment {
                    boxes: group.to_vec(),
                    top,
                    bottom,
                    trailing_gap: 0.0,
                    is_thead: tag == "thead",
                });
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
            for run in &mut nb.text_runs {
                run.origin_y += dy;
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
) -> (Vec<FilledRect>, Vec<crate::blitz_engine::TextRun>) {
    // `boxes` are already owned (deep-cloned by `reposition`); move the runs out
    // and shift their origins in place rather than cloning each one again.
    let mut rects = Vec::new();
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
        for mut r in b.text_runs {
            r.origin_x += margin_l;
            r.origin_y += margin_t;
            runs.push(r);
        }
    }
    (rects, runs)
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
