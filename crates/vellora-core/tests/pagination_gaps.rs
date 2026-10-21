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
        page_box.content_width(),
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
    // R11 first on page 2. Blitz 0.3.0-beta.4 does not share the borders (22 px
    // cells) and leaves a further 1 px flow gap between rows; pagination drops
    // that gap (rows abut), so the pitch is the 22 px cell height.
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
    assert_px(
        r02.1 - r01.1,
        22.0,
        "row pitch = Blitz cell height, no flow gap",
    );
    assert_px(r10.1 - r01.1, 9.0 * 22.0, "R10");
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
