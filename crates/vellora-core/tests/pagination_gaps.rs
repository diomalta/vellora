//! The pagination gap model (`phaseb/01-pagination-gaps`): fragments keep the
//! gaps of Blitz's continuous flow (margins already collapsed, CSS 2.2 §8.3.1),
//! and page starts follow CSS Fragmentation 3 §5.2 (page 1 keeps the document's
//! leading offset; margins adjoining an unforced break truncate; margins after a
//! forced break are kept).
//!
//! Chrome-verified: every HTML document below was printed by Google Chrome
//! 155.0.8059.85 (local macOS arm64, 2026-10-21, INDICATIVE) through
//! `fidelity/lib/chrome-reference.mjs` (puppeteer-core `page.pdf`, print media,
//! the bundled Liberation fonts injected as `@font-face`), and the word boxes of
//! its PDF read with poppler `pdftotext -bbox` 26.06.0. The numbers quoted per
//! test are Chrome's word `yMin` in pt (1 CSS px = 0.75 pt); for lines of the same
//! font and size a `yMin` difference equals the baseline difference this file
//! asserts on vellora's text-run origins. The same documents rendered by vellora
//! at this commit give the same differences (constant per-document offset of the
//! glyph boxes only).

use vellora_core::pdf::PdfPage;
use vellora_core::{blitz_engine, page_css, pagination, validation};

/// The geometry every Chrome probe used (no UA margins on `p`).
const BASE: &str = "body { margin: 0; font-family: \"Liberation Serif\"; font-size: 16px; \
                    line-height: 20px; } p { margin: 0; }";
/// A 300 × 300 px page with 20 px margins: a 260 px content box, so 12 lines of
/// 20 px plus a little fill page 1.
const SMALL_PAGE: &str = "@page { size: 300px 300px; margin: 20px; }";
/// Baselines that should coincide may differ by Blitz's whole-px rounding.
const TOL: f64 = 0.5;

fn doc(css: &str, body: &str) -> String {
    format!("<!DOCTYPE html><html><head><style>{css}</style></head><body>{body}</body></html>")
}

fn lines(n: usize) -> String {
    (1..=n).map(|i| format!("<p>L{i:02}</p>")).collect()
}

fn rows(n: usize) -> String {
    (1..=n)
        .map(|i| format!("<tr><td>R{i:02}</td></tr>"))
        .collect()
}

/// The render path's layout + pagination (validate, lay out against the @page
/// content box, paginate).
fn paginate(html: &str) -> pagination::Paginated {
    let page_box = page_css::parse_page_box(html);
    let laid_out = blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        page_box.layout_content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");
    pagination::paginate(&laid_out, &page_box)
}

/// (0-based page, page-local baseline y) of the run whose text is `text`.
fn at(paginated: &pagination::Paginated, text: &str) -> (usize, f64) {
    let hits: Vec<(usize, f64)> = paginated
        .pages
        .iter()
        .enumerate()
        .flat_map(|(i, page): (usize, &PdfPage)| {
            page.text_runs
                .iter()
                .filter(|run| run.text.trim() == text)
                .map(move |run| (i, run.origin_y))
        })
        .collect();
    assert_eq!(hits.len(), 1, "{text:?} placed once: {hits:?}");
    hits[0]
}

fn assert_px(actual: f64, expected: f64, what: &str) {
    assert!(
        (actual - expected).abs() <= TOL,
        "{what}: {actual} px, Chrome {expected} px"
    );
}

#[test]
fn a_flattened_wrapper_child_keeps_the_collapsed_flow_gap() {
    // The notification fixture's mechanism: the last <p> of a flattened wrapper
    // (margin-bottom 11pt) followed by a block with margin-top 32pt. The margins
    // collapse to 32pt; Phase A's model applied only the 11pt margin-bottom and
    // lifted everything below by ~28 px. Chrome: Alpha 45.56, Bravo 71.81,
    // Charlie 118.31, Delta 133.31 pt.
    let html = doc(
        &format!(
            "@page {{ size: A4; margin: 16mm; }} {BASE} .body p {{ margin: 0 0 11pt 0; }} \
             .sig {{ margin-top: 32pt; }}"
        ),
        "<div class=\"body\"><p>Alpha</p><p>Bravo</p></div>\
         <div class=\"sig\"><p>Charlie</p><p>Delta</p></div>",
    );
    let p = paginate(&html);
    let (alpha, bravo, charlie, delta) = (
        at(&p, "Alpha").1,
        at(&p, "Bravo").1,
        at(&p, "Charlie").1,
        at(&p, "Delta").1,
    );
    assert_px(bravo - alpha, 26.25 / 0.75, "Bravo - Alpha");
    assert_px(
        charlie - bravo,
        46.5 / 0.75,
        "Charlie - Bravo (32pt collapsed margin)",
    );
    assert_px(delta - charlie, 15.0 / 0.75, "Delta - Charlie");
}

#[test]
fn page_one_keeps_the_leading_offset() {
    // Chrome, First on page 1: 15.56 pt without an offset; 38.06 pt with body
    // margin 8 px + body padding-top 10 px + first-child margin-top 12 px (30 px);
    // 21.56 pt with the UA body margin (8 px). Phase A placed the first fragment
    // at the content-box top in every case.
    let first = |css: &str, body: &str| at(&paginate(&doc(css, body)), "First");
    let reference = first(&format!("{SMALL_PAGE} {BASE}"), "<p>First</p><p>Second</p>");
    let offset = first(
        &format!(
            "{SMALL_PAGE} {BASE} body {{ margin: 8px; padding-top: 10px; }} \
             .first {{ margin-top: 12px; }}"
        ),
        "<p class=\"first\">First</p><p>Second</p>",
    );
    let ua_margin = first(
        &format!(
            "{SMALL_PAGE} body {{ font-family: \"Liberation Serif\"; font-size: 16px; \
             line-height: 20px; }} p {{ margin: 0; }}"
        ),
        "<p>First</p><p>Second</p>",
    );
    assert_eq!((reference.0, offset.0, ua_margin.0), (0, 0, 0));
    assert_px(
        offset.1 - reference.1,
        (38.06 - 15.56) / 0.75,
        "body margin+padding+margin",
    );
    assert_px(
        ua_margin.1 - reference.1,
        (21.56 - 15.56) / 0.75,
        "UA body margin",
    );
}

#[test]
fn a_relative_offset_on_the_first_block_is_kept_and_may_overlap() {
    // Chrome: First (in a `position: relative; top: 20px` block) and Second both
    // at 30.56 pt, 15 pt (20 px) below an unshifted first line (15.56 pt): the
    // relative offset moves First onto Second's flow position.
    let reference = at(
        &paginate(&doc(&format!("{SMALL_PAGE} {BASE}"), "<p>First</p>")),
        "First",
    );
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} .lead {{ position: relative; top: 20px; }}"),
        "<div class=\"lead\"><p>First</p></div><p>Second</p>",
    ));
    assert_px(
        at(&p, "First").1 - reference.1,
        20.0,
        "First (relative top)",
    );
    assert_px(at(&p, "Second").1 - reference.1, 20.0, "Second (flow)");
}

#[test]
fn margins_after_a_forced_break_are_kept() {
    // CSS Fragmentation 3 §5.2. Chrome: One p1 15.56; Two p2 45.56 (its own 40 px
    // margin-top); Five p3 23.06 (its 10 px margin-top; Four's 30 px
    // margin-bottom before the break is truncated); Six p4 34.31 (25 px = the
    // section's 25 px collapsed with its first child's 10 px).
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} {BASE} .two {{ margin-top: 40px; break-before: page; }} \
             .four {{ margin-bottom: 30px; }} .five {{ margin-top: 10px; break-before: page; }} \
             section {{ margin-top: 25px; break-before: page; }} section p {{ margin-top: 10px; }}"
        ),
        "<p>One</p><p class=\"two\">Two</p><p>Three</p><p class=\"four\">Four</p>\
         <p class=\"five\">Five</p><section><p>Six</p></section>",
    ));
    assert_eq!(p.report.page_count, 4);
    let one = at(&p, "One");
    assert_eq!(one.0, 0);
    let two = at(&p, "Two");
    let five = at(&p, "Five");
    let six = at(&p, "Six");
    assert_eq!((two.0, five.0, six.0), (1, 2, 3));
    assert_px(two.1 - one.1, 40.0, "Two after the forced break");
    assert_px(at(&p, "Three").1 - two.1, 20.0, "Three");
    assert_px(five.1 - one.1, 10.0, "Five after the forced break");
    assert_px(six.1 - one.1, 25.0, "Six after the forced break");
}

#[test]
fn margins_kept_after_a_forced_break_collapse_with_their_signs() {
    // CSS 2.2 §8.3.1: the collapsed margin is the largest positive margin plus the most
    // negative one (port step 09; before it the paginator kept the largest positive margin
    // only). Chrome 155 (fidelity/baselines/port/09-review-fixes, attachments/
    // chrome-probes-review-fixes.json, probes m_*): "One" p1 26.25 pt, "Two" on p2 at the pt
    // below; the px offset is (pt - 26.25) / 0.75. The step-08 build is in the comment.
    let cases: &[(&str, &str, &str, f64)] = &[
        (
            // 25 + (-10). Step 08: 25 px.
            "positive root, negative child",
            "section { margin-top: 25px; break-before: page } section p { margin-top: -10px }",
            "<p>One</p><section><p>Two</p></section>",
            (37.5 - 26.25) / 0.75,
        ),
        (
            // -10 (the most negative; the line rises into the top page margin). Step 08: 0.
            "all negative",
            "section { margin-top: -10px; break-before: page } section p { margin-top: -5px }",
            "<p>One</p><section><p>Two</p></section>",
            (18.75 - 26.25) / 0.75,
        ),
        (
            // max(30, 15) + min(-20, -4) = 10. Step 08: 30 px.
            "nested chain",
            ".a { margin-top: 30px; break-before: page } .b { margin-top: -20px } \
             .c { margin-top: 15px } .d { margin-top: -4px }",
            "<p>One</p><div class=\"a\"><div class=\"b\"><div class=\"c\"><p class=\"d\">Two</p>\
             </div></div></div>",
            (33.75 - 26.25) / 0.75,
        ),
        (
            // 40 + (-12). Step 08: 40 px.
            "negative root, positive child",
            "section { margin-top: -12px; break-before: page } section p { margin-top: 40px }",
            "<p>One</p><section><p>Two</p></section>",
            (47.25 - 26.25) / 0.75,
        ),
        (
            // An empty block's margins collapse through it: max(40, 5) + (-15). Step 08: 40 px.
            "through a dropped block",
            ".empty { margin-top: 40px; margin-bottom: -15px; break-before: page } \
             .next { margin-top: 5px }",
            "<p>One</p><div class=\"empty\"></div><p class=\"next\">Two</p>",
            (45.0 - 26.25) / 0.75,
        ),
        (
            // 30 + min(-6, -20). Step 08: 30 px.
            "through a dropped block, negative next",
            ".empty { margin-top: -6px; margin-bottom: 30px; page-break-before: always } \
             .next { margin-top: -20px }",
            "<p>One</p><div class=\"empty\"></div><p class=\"next\">Two</p>",
            (33.75 - 26.25) / 0.75,
        ),
        (
            // A flattened wrapper's margin collapses with its first child's: 30 + (-18).
            // Step 08: 30 px.
            "flattened wrapper",
            ".w { margin-top: 30px; break-before: page } .w p:first-child { margin-top: -18px }",
            "<p>One</p><div class=\"w\"><p>Two</p><p>Three</p></div>",
            (35.25 - 26.25) / 0.75,
        ),
    ];
    for (what, css, body, expected) in cases {
        let p = paginate(&doc(&format!("{SMALL_PAGE} {BASE} {css}"), body));
        let (one, two) = (at(&p, "One"), at(&p, "Two"));
        assert_eq!((one.0, two.0), (0, 1), "{what}");
        assert_px(two.1 - one.1, *expected, what);
    }
}

/// A 240 px tall PNG (20 x 20 px source), monolithic.
const TALL_IMAGE: &str = "<img src=\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64\
                          paAAAAG0lEQVR4nGM4w8BANiJf56jmUc2jmkc1U0UzAPWMPtBewCaJAAAAAElFTkSuQmCC\">";

#[test]
fn what_does_not_fit_under_a_forced_break_margin_moves_on_like_chrome() {
    // Port step 10 (probes f5_line_big_margin, f5_img_partial, f5_table_partial; Chrome 155,
    // 2026-10-22, the shared reference path, PyMuPDF baselines in pt). Chrome keeps the whole
    // margin after a forced break and moves what does not fit under it: a table between its
    // rows, monolithic content (a line, an image) whole to the next page, leaving the forced
    // page blank. Step 08 placed the fragment under the whole margin, past the content box;
    // step 09 truncated the margin to the room the fragment left (a placement Chrome never
    // makes).
    //
    // A 20 px line under a 250 px margin: Chrome Two at the top of page 3 (26.25 pt), Three
    // below it (41.25 pt), page 2 blank. Step 09: Two on page 2 at 206.25 pt.
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} .x {{ margin-top: 250px; break-before: page }}"),
        "<p>One</p><p class=\"x\">Two</p><p>Three</p>",
    ));
    let (one, two, three) = (at(&p, "One"), at(&p, "Two"), at(&p, "Three"));
    assert_eq!(p.report.page_count, 3);
    assert!(p.pages[1].text_runs.is_empty(), "page 2 is blank");
    assert_eq!((two.0, three.0), (2, 2));
    assert_px(two.1, one.1, "Two at the page-3 top");
    assert_px(three.1 - two.1, 20.0, "Three right below");

    // A 240 px image under a 40 px margin: Chrome puts it at the top of page 3 and After at
    // 206.25 pt below it. Step 09: the image on page 2 under a 20 px margin, After at the
    // page-3 top.
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} {BASE} .x {{ margin-top: 40px; break-before: page }} \
             img {{ display: block; width: 100px; height: 240px }}"
        ),
        &format!("<p>One</p><div class=\"x\">{TALL_IMAGE}</div><p>After</p>"),
    ));
    assert_eq!(p.report.page_count, 3);
    assert!(p.pages[1].images.is_empty() && p.pages[1].text_runs.is_empty());
    let image = &p.pages[2].images[0];
    // Page-local px include the 20 px top page margin.
    assert_px(image.y - 20.0, 0.0, "image at the page-3 top");
    let after = at(&p, "After");
    assert_eq!(after.0, 2);
    assert_px(
        after.1 - one.1,
        240.0,
        "After below the image (Chrome 206.25 pt)",
    );

    // A 160 px table (one block fragment: no <thead>) under a 120 px margin: Chrome keeps the
    // 120 px, T01-T07 on page 2 at 116.25-206.25 pt, T08 at the top of page 3. Step 09: margin
    // 100 px, all eight rows on page 2 (T01 at 101.25 pt).
    let rows: String = (1..=8)
        .map(|i| format!("<tr><td>T{i:02}</td></tr>"))
        .collect();
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} {BASE} table {{ margin-top: 120px; break-before: page; \
             border-collapse: collapse }} td {{ padding: 0 }} tr {{ break-inside: avoid }}"
        ),
        &format!("<p>One</p><table><tbody>{rows}</tbody></table>"),
    ));
    assert_eq!(p.report.page_count, 3);
    let (t01, t07, t08) = (at(&p, "T01"), at(&p, "T07"), at(&p, "T08"));
    assert_eq!((t01.0, t07.0, t08.0), (1, 1, 2));
    assert_px(t01.1 - one.1, 120.0, "T01 under the whole 120 px margin");
    assert_px(t07.1 - one.1, 240.0, "T07 at 206.25 pt");
    assert_px(t08.1, one.1, "T08 at the page-3 top");
}

#[test]
fn a_multi_line_block_under_a_forced_break_margin_is_truncated_known_gap() {
    // KNOWN GAP (port step 10, probe s10_para_big_margin): a paragraph of three lines under a
    // 250 px forced-break margin. Chrome 155 moves it to page 3 (Two / Two2 / Two3 at 26.25 /
    // 41.25 / 56.25 pt, Three at 71.25 pt, page 2 blank). vellora fragments neither by line nor
    // moves a block that has break points inside it, so the margin is truncated to the room the
    // block leaves (step 09's rule): Two at 176.25 pt on page 2, Three at the page-3 top.
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} .x {{ margin-top: 250px; break-before: page }}"),
        "<p>One</p><p class=\"x\">Two<br>Two2<br>Two3</p><p>Three</p>",
    ));
    // The three lines are runs of one inline root (they share its source string): the first
    // line is the paragraph's topmost run.
    let two = p
        .pages
        .iter()
        .enumerate()
        .flat_map(|(i, page)| {
            page.text_runs
                .iter()
                .filter(|run| run.text.contains("Two2"))
                .map(move |run| (i, run.origin_y))
        })
        .min_by(|a, b| a.1.total_cmp(&b.1))
        .expect("the paragraph is placed");
    let (one, three) = (at(&p, "One"), at(&p, "Three"));
    assert_eq!(two.0, 1, "Chrome: page 3");
    assert_px(
        two.1 - one.1,
        200.0,
        "Two, margin 250 truncated to 200 (Chrome 26.25 pt, page 3)",
    );
    assert_eq!(three.0, 2);
    assert_px(three.1, one.1, "Three at the page-3 top (Chrome 71.25 pt)");
}

#[test]
fn an_empty_box_rest_after_a_forced_break_is_not_carried_known_gap() {
    // KNOWN GAP (pre-existing at steps 08 and 09, probe f5_box_partial): a 200 px box holding
    // one line under a 100 px forced-break margin. Chrome 155 fragments the box: TopLine at
    // 101.25 pt on page 2, the box's empty 40 px rest on page 3, After below it at 56.25 pt.
    // vellora places the line (a flattened wrapper's child) and moves After to the page-3 top
    // (26.25 pt).
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} {BASE} .x {{ margin-top: 100px; break-before: page; height: 200px }}"
        ),
        "<p>One</p><div class=\"x\"><p>TopLine</p></div><p>After</p>",
    ));
    let (one, top_line, after) = (at(&p, "One"), at(&p, "TopLine"), at(&p, "After"));
    assert_eq!((top_line.0, after.0), (1, 2));
    assert_px(top_line.1 - one.1, 100.0, "TopLine as Chrome (101.25 pt)");
    assert_px(after.1, one.1, "After at the page-3 top (Chrome 56.25 pt)");
}

#[test]
fn the_overflow_allowance_never_reaches_a_drawn_footer() {
    // The DESIGN TARGET allowance of `a_small_overflow_of_a_fixed_height_box_stays_on_its_page`
    // (a child overflowing its fixed-height box by up to 12 px is fitted against the box) never
    // lets what a fragment PAINTS reach a drawn `@bottom-center` line (port step 10; step 09
    // capped the allowance itself, which also moved an overflowing box that paints nothing
    // there). Here a 16 px footer line sits centred in the 20 px bottom margin: 2 px of room.
    let body = |tail_css: &str| {
        format!(
            "<div class=\"box\">{}<div class=\"tail\" style=\"{tail_css}\">Tail</div></div>",
            lines(12)
        )
    };
    let css = |page: &str| {
        format!(
            "{page} {BASE} .box {{ height: 255px; }} .tail {{ height: 26px; }} \
             @page {{ @bottom-center {{ content: \"Foot\"; font-size: 16px; line-height: 16px }} }}"
        )
    };
    // The tail box (240-266 px) overflows the box by 11 px, but only its text line (240-260
    // px) paints: Chrome 155 (probe f5_allowance_footer) prints Tail on page 1 at 206.25 pt,
    // as step 08 did; step 09 moved it to page 2. Chrome also carries the empty 6 px rest of
    // the tail box onto a second page (2 pages, Foot on both); vellora prints 1 (KNOWN GAP,
    // page count only).
    let p = paginate(&doc(&css(SMALL_PAGE), &body("")));
    let (l01, tail) = (at(&p, "L01"), at(&p, "Tail"));
    assert_eq!(tail.0, 0, "Tail on page 1 like Chrome");
    assert_px(tail.1 - l01.1, 240.0, "Tail at 206.25 pt");
    assert_eq!(p.report.page_count, 1, "Chrome: 2 pages");
    // With a background the tail paints 240-266 px, 4 px past the room above the footer line:
    // it moves to page 2 rather than paint over the footer. Chrome 155 (probe
    // s10_allowance_footer_bg) fragments the box instead: Tail on page 1 at 206.25 pt, its
    // background cut at the content box (KNOWN GAP: vellora does not fragment boxes).
    let p = paginate(&doc(&css(SMALL_PAGE), &body("background: #ccc")));
    let (l01, tail) = (at(&p, "L01"), at(&p, "Tail"));
    assert_eq!(tail.0, 1, "Chrome: page 1");
    assert_px(
        tail.1,
        l01.1,
        "Tail at the page-2 top (Chrome 206.25 pt, page 1)",
    );
    assert_eq!(p.report.footers, vec!["Foot", "Foot"]);
    // DESIGN TARGET: with a 60 px bottom margin the line leaves 22 px, more than the 12 px
    // allowance, and the painted tail stays on page 1 as without a footer (same 260 px
    // content box).
    let p = paginate(&doc(
        &css("@page { size: 300px 340px; margin: 20px 20px 60px; }"),
        &body("background: #ccc"),
    ));
    assert_eq!(p.report.page_count, 1);
    assert_eq!(at(&p, "Tail").0, 0);
}

#[test]
fn an_inline_only_body_draws_its_lines_past_page_1_off_page_known_gap() {
    // KNOWN GAP (review of port step 08, pinned at step 09): a body whose in-flow content is all
    // inline is one block fragment (the body is the inline root, see `build_fragments`), so its
    // lines past page 1 are emitted below the page edge: in the PDF, never visible, silently.
    // Chrome 155 paginates by line: 3 pages, Line001-052 / Line053-104 / Line105-120 (probe
    // g_inline_body). With the same lines as <p>s vellora prints Chrome's 3 pages (g_p_body).
    // A fix that fragments inline content by line box must update this test.
    let page = "@page { size: A4; margin: 10mm; }";
    let numbered: Vec<String> = (1..=120).map(|i| format!("Line{i:03}")).collect();
    let inline = paginate(&doc(&format!("{page} {BASE}"), &numbered.join("<br>")));
    assert_eq!(inline.report.page_count, 1, "Chrome prints 3 pages");
    let page_1 = &inline.pages[0];
    // The runs of one inline root share its source string; each covers its glyphs' range.
    let line_of = |run: &vellora_core::blitz_engine::TextRun| {
        let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
        let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
        run.text[start..end].trim().to_string()
    };
    let off_page: Vec<(String, f64)> = page_1
        .text_runs
        .iter()
        .filter(|run| run.origin_y > page_1.height_px)
        .map(|run| (line_of(run), run.origin_y * 0.75))
        .collect();
    assert_eq!(page_1.text_runs.len(), 120, "every line is emitted");
    // Line055 is the first baseline below the 1122.56 px (841.92 pt) page edge.
    assert_eq!(off_page.len(), 66, "Line055-Line120 are off the page");
    assert_eq!(off_page[0].0, "Line055");
    // 849.75 pt since Phase C step 03 (849.60 before): the content origin is Chrome's whole-px
    // round(10 mm) = 38 px, no longer 37.795 (`PageBox::content_origin`).
    assert!((off_page[0].1 - 849.75).abs() < 0.01, "{}", off_page[0].1);

    let paragraphs: String = numbered.iter().map(|l| format!("<p>{l}</p>")).collect();
    let blocks = paginate(&doc(&format!("{page} {BASE}"), &paragraphs));
    assert_eq!(blocks.report.page_count, 3);
    for (text, page_index) in [
        ("Line052", 0),
        ("Line053", 1),
        ("Line104", 1),
        ("Line105", 2),
    ] {
        let (page, y) = at(&blocks, text);
        assert_eq!(page, page_index, "{text}");
        assert!(y < blocks.pages[page].height_px, "{text} on its page");
    }
}

#[test]
fn margins_adjoining_an_unforced_break_truncate() {
    // Twelve 20 px lines (240 px), then a line with margin-top 40 px: it does
    // not fit the 260 px page, moves to page 2 and loses its margin. Chrome:
    // L01 p1 15.56; Next p2 15.56 (page top); After p2 53.06 (Next + 20 px line
    // + its own 30 px margin-top).
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} {BASE} .next {{ margin-top: 40px; }} .after {{ margin-top: 30px; }}"
        ),
        &format!(
            "{}<p class=\"next\">Next</p><p class=\"after\">After</p>",
            lines(12)
        ),
    ));
    assert_eq!(p.report.page_count, 2);
    let l01 = at(&p, "L01");
    let l12 = at(&p, "L12");
    let next = at(&p, "Next");
    assert_eq!((l12.0, next.0), (0, 1));
    assert_px(next.1, l01.1, "Next at the page-2 top");
    assert_px(at(&p, "After").1 - next.1, (53.06 - 15.56) / 0.75, "After");
}

#[test]
fn a_block_whose_margin_does_not_fit_moves_whole_to_the_next_page() {
    // The line itself would fit after twelve lines (240 + 20 <= 260 px) but not
    // with its 15 px margin-top. Phase A dropped the margin to keep it on page 1;
    // Chrome moves it: Edge p2 15.56, Tail p2 30.56.
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} .edge {{ margin-top: 15px; }}"),
        &format!("{}<p class=\"edge\">Edge</p><p>Tail</p>", lines(12)),
    ));
    let l01 = at(&p, "L01");
    let edge = at(&p, "Edge");
    assert_eq!(edge.0, 1);
    assert_px(edge.1, l01.1, "Edge at the page-2 top");
    assert_px(at(&p, "Tail").1 - edge.1, 20.0, "Tail");
}

#[test]
fn the_body_margin_is_not_repeated_on_a_continuation_page() {
    // body margin 8 px, lines of 20 px with margin-bottom 10 px. Chrome: L01 p1
    // 21.56 (8 px down), L08 p1 179.06 (30 px pitch), L09 p2 15.56 (page top),
    // L10 p2 38.06. Phase A dropped the 8 px on page 1, so L09 still fitted there.
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} body {{ margin: 8px; font-family: \"Liberation Serif\"; \
             font-size: 16px; line-height: 20px; }} p {{ margin: 0 0 10px 0; }}"
        ),
        &lines(10),
    ));
    let reference = at(
        &paginate(&doc(&format!("{SMALL_PAGE} {BASE}"), "<p>L01</p>")),
        "L01",
    );
    let (l01, l08, l09, l10) = (at(&p, "L01"), at(&p, "L08"), at(&p, "L09"), at(&p, "L10"));
    assert_eq!((l08.0, l09.0), (0, 1));
    assert_px(l01.1 - reference.1, 8.0, "L01 below the body margin");
    assert_px(l08.1 - l01.1, (179.06 - 21.56) / 0.75, "L08");
    assert_px(l09.1, reference.1, "L09 at the page-2 top");
    assert_px(l10.1 - l09.1, 30.0, "L10");
}

#[test]
fn separate_border_rows_keep_their_spacing_and_the_header_repeats_at_the_top() {
    // border-spacing 6 px. Chrome: Intro 15.56, Head 35.06, R01 54.56 ... R08
    // 191.06 on page 1 (26 px pitch); page 2: Head 15.56 (page top), R09 35.06.
    // Phase A dropped the spacing (20 px pitch) and pulled R09-R11 onto page 1.
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} table {{ border-spacing: 6px; }} td, th {{ padding: 0; }}"),
        &format!(
            "<p>Intro</p><table><thead><tr><th>Head</th></tr></thead><tbody>{}</tbody></table>",
            rows(14)
        ),
    ));
    let intro = at(&p, "Intro");
    let (r01, r08, r09) = (at(&p, "R01"), at(&p, "R08"), at(&p, "R09"));
    assert_eq!((r08.0, r09.0), (0, 1));
    assert_px(r01.1 - intro.1, (54.56 - 15.56) / 0.75, "R01");
    assert_px(r08.1 - r01.1, (191.06 - 54.56) / 0.75, "R08 (26 px pitch)");
    let head_p2: Vec<f64> = p.pages[1]
        .text_runs
        .iter()
        .filter(|run| run.text.trim() == "Head")
        .map(|run| run.origin_y)
        .collect();
    assert_eq!(head_p2.len(), 1, "the header repeats on page 2");
    assert_px(
        r09.1 - head_p2[0],
        (35.06 - 15.56) / 0.75,
        "R09 under the repeated header",
    );
    assert_px(
        r09.1 - intro.1,
        (35.06 - 15.56) / 0.75,
        "header band at the page-2 top",
    );
}

#[test]
fn collapsed_border_rows_abut() {
    // CSS 2.2 §17.6.2: no spacing between the cells of a collapsed-border table.
    // Chrome: 21 px pitch (20 px rows sharing 1 px borders), R10 last on page 1,
    // R11 first on page 2. Raw Blitz 0.3.0-beta.4 does not share the borders (22 px
    // cells) and leaves a further 1 px flow gap between rows (23 px pitch); since
    // Phase C step 02 the collapsed-border compensation
    // (`blitz_engine::compensate_collapsed_borders`) lays the rows out at Chrome's
    // pitch, and pagination keeps the flow (its `collapsed_table` gap drop is gone).
    let p = paginate(&doc(
        &format!(
            "{SMALL_PAGE} {BASE} table {{ border-collapse: collapse; }} \
             td, th {{ padding: 0; border: 1px solid #555; }}"
        ),
        &format!(
            "<p>Intro</p><table><thead><tr><th>Head</th></tr></thead><tbody>{}</tbody></table>\
             <p>After</p>",
            rows(14)
        ),
    ));
    let (r01, r02, r10, r11) = (at(&p, "R01"), at(&p, "R02"), at(&p, "R10"), at(&p, "R11"));
    assert_eq!((r10.0, r11.0), (0, 1));
    assert_px(r02.1 - r01.1, 21.0, "row pitch");
    assert_px(r10.1 - r01.1, 9.0 * 21.0, "R10");
}

#[test]
fn overflow_of_a_fixed_height_box_moves_on_when_it_is_large() {
    // A 250 px box with fourteen 20 px lines: L14 (260-280 px) overflows the box
    // by 30 px and the page. Chrome fragments the overflow: L13 p1 195.56, L14 p2
    // 15.56 (page top).
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} .box {{ height: 250px; }}"),
        &format!("<div class=\"box\">{}</div>", lines(14)),
    ));
    let (l01, l13, l14) = (at(&p, "L01"), at(&p, "L13"), at(&p, "L14"));
    assert_eq!((l13.0, l14.0), (0, 1));
    assert_px(l14.1, l01.1, "L14 at the page-2 top");
}

#[test]
fn a_small_overflow_of_a_fixed_height_box_stays_on_its_page() {
    // DESIGN TARGET (see `Fragment::contained_bottom`): a 255 px box whose last
    // child (26 px, 240-266 px) overflows the box by 11 px and the 260 px page by
    // 6 px is fitted against the box, so it stays on page 1. Chrome puts the
    // Tail text on page 1 too (195.56 pt, right after L12 at 180.56 pt) and
    // carries only the empty 6 px rest of the child onto a second, blank page;
    // vellora emits no blank page. The allowance exists for Blitz's taller
    // layout (the boleto-febraban barcode zone overflows its 105 mm ficha by
    // 10 px in Blitz, not in Chrome).
    let p = paginate(&doc(
        &format!("{SMALL_PAGE} {BASE} .box {{ height: 255px; }} .tail {{ height: 26px; }}"),
        &format!(
            "<div class=\"box\">{}<div class=\"tail\">Tail</div></div>",
            lines(12)
        ),
    ));
    assert_eq!(p.report.page_count, 1);
    let (l12, tail) = (at(&p, "L12"), at(&p, "Tail"));
    assert_eq!(tail.0, 0);
    assert_px(tail.1 - l12.1, 20.0, "Tail");
}

#[test]
fn an_inline_level_box_after_a_block_is_read_inside_its_anonymous_block() {
    // Blitz wraps the inline-block in an anonymous block after the <p>; its
    // `final_layout` is relative to that block, which the DOM-children walk
    // used to skip (it read the inline-block at the <p>'s own top, y 0, and the
    // old paginator's re-stacking hid it). Chrome: Para 15.56 pt, Inline 42.56 pt
    // (36 px lower: the 20 px line + the <p>'s 16 px margin-bottom).
    let html = doc(
        &format!(
            "{SMALL_PAGE} {BASE} p {{ margin: 0 0 16px 0; }} .ib {{ display: inline-block; }}"
        ),
        "<p>Para</p><div class=\"ib\">Inline</div>",
    );
    let laid_out = blitz_engine::lay_out(&html);
    let inline_block = laid_out
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("div"))
        .expect("the inline-block box");
    assert_px(inline_block.y, 36.0, "walk y of the inline-block");
    let p = paginate(&html);
    assert_px(
        at(&p, "Inline").1 - at(&p, "Para").1,
        (42.56 - 15.56) / 0.75,
        "Inline - Para",
    );
}

#[test]
fn a_tfoot_written_first_does_not_leave_the_page() {
    // Regression guard (not Chrome-verified): Blitz lays a <tfoot> written before
    // the body out at the table bottom, so in DOM order its row comes first with
    // a flow top past the page end. It must neither be placed at that flow
    // position nor pull the body rows above the page top.
    let html = doc(
        "@page { size: 5in 3in; margin: 0.5in; } body { font-family: \"Liberation Serif\"; \
         font-size: 16px; } div.blk { height: 1in; width: 1in; }",
        "<table border=\"1\"><tfoot><tr><td><div class=\"blk\">Foot</div></td></tr></tfoot>\
         <thead><tr><td><div class=\"blk\">Head</div></td></tr></thead>\
         <tbody style=\"page-break-inside: avoid\"><tr><td><div class=\"blk\">Body1</div>\
         <div class=\"blk\">Body2</div></td></tr></tbody></table>",
    );
    let p = paginate(&html);
    for (i, page) in p.pages.iter().enumerate() {
        for run in &page.text_runs {
            assert!(
                run.origin_y > 0.0 && run.origin_y < page.height_px,
                "page {} run {:?} at y {}",
                i + 1,
                run.text,
                run.origin_y
            );
        }
    }
    at(&p, "Foot");
    at(&p, "Body1");
}
