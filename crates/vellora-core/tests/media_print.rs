//! Documents are styled for print media (port step 07): Blitz's `DocumentConfig::media_type` is
//! `print`, so `@media print` rules cascade and `@media screen` rules do not, and vellora's own
//! fragmentation reader (`break_css`) reads the `break-*` rules of `@media` blocks, whose query
//! lists Stylo evaluates like those of the style rules (port step 09; media features included).
//!
//! Chrome-verified: every document below was printed by Google Chrome 155.0.8059.85 (local macOS
//! arm64, 2026-10-21, INDICATIVE) through `fidelity/lib/chrome-reference.mjs` (puppeteer-core
//! `page.pdf`, print media, the bundled Liberation fonts injected as `@font-face`), and its words
//! read with PyMuPDF character origins (pen x of the first glyph and baseline, PDF pt, top-left
//! origin). The optional Chromium engine (`@vellora/engine-chromium`, `--print-to-pdf`) prints
//! the same media-dependent results. The HTML, Chrome's words and vellora's (step 06 and this
//! step) are in `fidelity/baselines/port/07-media-print/attachments/chrome-probes-media-print.json`.
//! Body text sits 0.31 pt left of and above Chrome's on both axes (Chrome snaps the 20 mm page
//! margin to whole device pixels), hence the tolerance of one CSS px.

use vellora_core::{blitz_engine, page_css, pagination, validation};

const TOL_PT: f64 = 0.75;
const PT_PER_PX: f64 = 0.75;

fn doc(css: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>@page {{ size: A4; margin: \
         20mm; }} body {{ margin: 0; font-family: \"Liberation Sans\"; font-size: 16px; \
         line-height: 20px; }} {css}</style></head><body>{body}</body></html>"
    )
}

/// The render path's gate, layout and pagination.
fn paginate(html: &str) -> pagination::Paginated {
    validation::validate_css(html).expect("in the subset");
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

fn find_run<'a>(
    p: &'a pagination::Paginated,
    page: usize,
    text: &str,
) -> Option<&'a blitz_engine::TextRun> {
    p.pages
        .get(page)?
        .text_runs
        .iter()
        .find(|r| r.text.trim() == text)
}

/// (x, baseline) in pt of the body run whose text is `text` on page `page` (0-based).
fn body_origin(p: &pagination::Paginated, page: usize, text: &str) -> (f64, f64) {
    let run = find_run(p, page, text).unwrap_or_else(|| {
        panic!(
            "{text:?} not on page {}: {:?}",
            page + 1,
            p.pages
                .iter()
                .map(|pg| pg
                    .text_runs
                    .iter()
                    .map(|r| r.text.trim())
                    .collect::<Vec<_>>())
                .collect::<Vec<_>>()
        )
    });
    (run.origin_x * PT_PER_PX, run.origin_y * PT_PER_PX)
}

fn assert_at(actual: (f64, f64), chrome: (f64, f64), what: &str) {
    assert!(
        (actual.0 - chrome.0).abs() <= TOL_PT && (actual.1 - chrome.1).abs() <= TOL_PT,
        "{what}: vellora ({:.2}, {:.2}) pt, Chrome ({:.2}, {:.2}) pt",
        actual.0,
        actual.1,
        chrome.0,
        chrome.1
    );
}

#[test]
fn media_print_rules_apply_and_media_screen_rules_do_not() {
    let p = paginate(&doc(
        ".a { margin-top: 10px; } @media print { .a { margin-top: 50px; } } \
         @media screen { .a { margin-top: 120px; } }",
        "<div class=\"a\">Alpha</div>",
    ));
    // Chrome: "Alpha" at (57.00, 105.75) pt: 20 mm + the print margin-top 50 px. Step 06
    // (screen media) printed it at baseline 157.94 pt (margin-top 120 px).
    assert_at(body_origin(&p, 0, "Alpha"), (57.00, 105.75), "print margin");
}

#[test]
fn display_none_follows_the_print_medium() {
    let p = paginate(&doc(
        "@media screen { .p { display: none; } } @media print { .s { display: none; } }",
        "<div class=\"p\">PrintOnly</div><div class=\"s\">ScreenOnly</div><div>Tail</div>",
    ));
    // Chrome prints "PrintOnly" at (57.00, 68.25) and "Tail" at (57.00, 83.25) pt, no
    // "ScreenOnly". Step 06 printed "ScreenOnly" and no "PrintOnly".
    assert!(find_run(&p, 0, "ScreenOnly").is_none(), "screen-only text");
    assert_at(body_origin(&p, 0, "PrintOnly"), (57.00, 68.25), "PrintOnly");
    assert_at(body_origin(&p, 0, "Tail"), (57.00, 83.25), "Tail");
}

#[test]
fn not_print_does_not_match_and_not_screen_does() {
    let p = paginate(&doc(
        "@media not print { .a { margin-top: 100px; } } \
         @media not screen { .a { margin-left: 40px; } }",
        "<div class=\"a\">Alpha</div>",
    ));
    // Chrome: (87.00, 68.25) pt, margin-left 40 px only. Step 06: (56.69, 142.94).
    assert_at(
        body_origin(&p, 0, "Alpha"),
        (87.00, 68.25),
        "not print / not screen",
    );
}

#[test]
fn all_and_only_print_match_and_only_screen_does_not() {
    let p = paginate(&doc(
        "@media all { .a { margin-top: 30px; } } @media only print { .a { margin-left: 25px; } } \
         @media only screen { .a { margin-left: 200px; } }",
        "<div class=\"a\">Alpha</div>",
    ));
    // Chrome: (75.75, 90.75) pt, margin-top 30 px and margin-left 25 px. Step 06: x 206.69.
    assert_at(
        body_origin(&p, 0, "Alpha"),
        (75.75, 90.75),
        "all / only print",
    );
}

#[test]
fn the_page_context_inherits_the_roots_print_styles() {
    // The margin-box document is built with the same media type, and the page context
    // inherits the root's computed values, which now include its `@media print` rule.
    let p = paginate(&doc(
        "@page { @bottom-center { content: \"Rodape \" counter(page); } } \
         @media print { html { font-size: 20px; color: rgb(0, 0, 200); \
         font-family: \"Liberation Serif\"; } }",
        "<div>Corpo <span style=\"font-family: 'Liberation Serif'\">serif</span></div>",
    ));
    let footer = p.pages[0]
        .margin_texts
        .iter()
        .find(|mt| mt.text == "Rodape 1")
        .expect("footer");
    let run = footer.runs.first().expect("shaped");
    // Chrome: "Rodape" 15 pt (20 px) Liberation Serif, #0000c8. Step 06: 12 pt black.
    assert_eq!(run.font_size, 20.0);
    assert_eq!(run.color, [0, 0, 200]);
    // The body line is two runs: "Corpo " in Liberation Sans, then the "serif" span.
    let body = &p.pages[0].text_runs;
    assert_eq!(body.len(), 2);
    assert!(body.iter().all(|r| r.color == [0, 0, 200]));
    assert_ne!(body[0].font_data, body[1].font_data);
    assert_eq!(
        run.font_data, body[1].font_data,
        "footer face = the body span's Liberation Serif"
    );
    // Chrome: baseline 819.00 pt; the line "Rodape 1" spans 269.43..326.50 pt, its centre
    // 0.49 pt right of the page centre (297.48 pt). vellora: baseline 818.45 pt, centre 0.33 pt
    // left of it (the step-06 margin-box centring). Both centre the line within one px.
    let baseline = run.origin_y * PT_PER_PX;
    assert!(
        (baseline - 819.00).abs() <= TOL_PT,
        "baseline {baseline:.2}"
    );
    let left = footer.runs.first().unwrap().origin_x;
    let last = footer.runs.last().unwrap();
    let right = last.origin_x + last.glyphs.iter().map(|g| g.advance as f64).sum::<f64>();
    let centre = (left + right) / 2.0 * PT_PER_PX;
    assert!(
        (centre - 594.96 / 2.0).abs() <= TOL_PT,
        "centre {centre:.2}"
    );
}

#[test]
fn break_before_inside_media_print_forces_a_page() {
    let p = paginate(&doc(
        "@media print { .brk { break-before: page; } } \
         @media screen { .nobrk { break-before: page; } }",
        "<div>One</div><div class=\"nobrk\">Two</div><div class=\"brk\">Three</div>",
    ));
    // Chrome: 2 pages; "One" (57.00, 68.25) and "Two" (57.00, 83.25) on page 1, "Three"
    // (57.00, 68.25) on page 2. Step 06: 1 page.
    assert_eq!(p.pages.len(), 2);
    assert_at(body_origin(&p, 0, "One"), (57.00, 68.25), "One");
    assert_at(body_origin(&p, 0, "Two"), (57.00, 83.25), "Two");
    assert_at(body_origin(&p, 1, "Three"), (57.00, 68.25), "Three");
}

#[test]
fn legacy_page_break_before_inside_media_print_forces_a_page() {
    let p = paginate(&doc(
        "@media print { .brk { page-break-before: always; } }",
        "<div>One</div><div class=\"brk\">Two</div>",
    ));
    // Chrome: 2 pages, "Two" at (57.00, 68.25) pt on page 2. Step 06: 1 page.
    assert_eq!(p.pages.len(), 2);
    assert_at(body_origin(&p, 1, "Two"), (57.00, 68.25), "Two");
}

#[test]
fn break_inside_avoid_follows_the_print_medium() {
    const KEPT: &str = "<div>Kone</div><div>Ktwo</div><div>Kthree</div><div>Kfour</div>\
                        <div>Kfive</div>";
    // The kept block (5 lines of 20 px) starts 900 px down a 971.34 px page area.
    let print = paginate(&doc(
        "@media print { .keep { break-inside: avoid; } } \
         @media screen { .keep2 { break-inside: avoid; } }",
        &format!("<div style=\"height: 900px\">Filler</div><div class=\"keep\">{KEPT}</div>"),
    ));
    // Chrome: the whole block moves to page 2, "Kone" (57.00, 68.25) .. "Kfive" (57.00, 128.25).
    // Step 06 split it after "Kthree".
    assert_eq!(print.pages.len(), 2);
    assert_at(body_origin(&print, 1, "Kone"), (57.00, 68.25), "Kone");
    assert_at(body_origin(&print, 1, "Kfive"), (57.00, 128.25), "Kfive");

    let screen = paginate(&doc(
        "@media screen { .keep2 { break-inside: avoid; } }",
        &format!("<div style=\"height: 900px\">Filler</div><div class=\"keep2\">{KEPT}</div>"),
    ));
    // Chrome: the screen-only hint does not apply: "Kthree" (57.00, 773.25) on page 1,
    // "Kfour" (57.00, 68.25) on page 2.
    assert_at(body_origin(&screen, 0, "Kthree"), (57.00, 773.25), "Kthree");
    assert_at(body_origin(&screen, 1, "Kfour"), (57.00, 68.25), "Kfour");
}

/// The port-step-09 probes (`fidelity/baselines/port/09-review-fixes/attachments/
/// chrome-probes-review-fixes.json`, probes `f3_*`): A4, 10 mm margins, Liberation Serif.
fn probe(css: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 10mm }} body {{ margin: 0; \
         font-family: \"Liberation Serif\"; font-size: 16px; line-height: 20px; }} p {{ margin: \
         0; }} {css}</style></head><body>{body}</body></html>"
    )
}

#[test]
fn break_rules_follow_stylos_evaluation_of_media_features() {
    // Port step 09: `break_css` hands every `@media` block chain to Stylo
    // (`blitz_engine::media_query_matches`) instead of treating any query with a media feature
    // as not matching. Chrome 155: the target line is at (28.50, 39.75) pt on page 2 when the
    // query matches, at (28.50, 54.75) pt on page 1 when it does not. The step-08 build kept
    // every target on page 1.
    let cases: &[(&str, &str, &str, bool)] = &[
        (
            "print and a matching feature",
            "@media print and (min-width: 1px) { .gone { display: none } .brk { break-before: page } }",
            "<p>First</p><p class=\"gone\">GoneText</p><p class=\"brk\">SecondPage</p>",
            true,
        ),
        (
            "a feature inside @media print",
            "@media print { @media (min-width: 10px) { .brk { break-before: page; color: rgb(200, 0, 0) } } }",
            "<p>First</p><p class=\"brk\">SecondPage</p>",
            true,
        ),
        (
            "orientation",
            "@media (orientation: portrait) { .brk { page-break-before: always } }",
            "<p>First</p><p class=\"brk\">SecondPage</p>",
            true,
        ),
        (
            "a width the content box passes",
            "@media (min-width: 600px) { .brk { break-before: page; color: rgb(200, 0, 0) } }",
            "<p>First</p><p class=\"brk\">SecondPage</p>",
            true,
        ),
        (
            "a feature inside @media print that fails",
            "@media print { @media (max-width: 10px) { .brk { break-before: page } } }",
            "<p>First</p><p class=\"brk\">SamePage</p>",
            false,
        ),
        (
            "not print and a feature",
            "@media not print and (min-width: 1px) { .brk { break-before: page } }",
            "<p>First</p><p class=\"brk\">SamePage</p>",
            false,
        ),
    ];
    for (what, css, body, breaks) in cases {
        let p = paginate(&probe(css, body));
        if *breaks {
            assert_eq!(p.pages.len(), 2, "{what}");
            assert_at(body_origin(&p, 1, "SecondPage"), (28.50, 39.75), what);
        } else {
            assert_eq!(p.pages.len(), 1, "{what}");
            assert_at(body_origin(&p, 0, "SamePage"), (28.50, 54.75), what);
        }
    }
    // A failing feature keeps the block's styles off as well (Chrome: "ShownText" at 54.75 pt).
    let p = paginate(&probe(
        "@media print and (max-width: 1px) { .gone { display: none } .brk { break-before: page } }",
        "<p>First</p><p class=\"gone\">ShownText</p><p class=\"brk\">SamePage</p>",
    ));
    assert_eq!(p.pages.len(), 1);
    assert_at(body_origin(&p, 0, "ShownText"), (28.50, 54.75), "ShownText");
    assert_at(body_origin(&p, 0, "SamePage"), (28.50, 69.75), "SamePage");
}

#[test]
fn width_features_see_the_content_box_for_styles_and_breaks_alike_known_gap() {
    // KNOWN GAP (port step 07 follow-up, unchanged): Stylo evaluates `width` against the layout
    // viewport, which vellora sets to the @page content box (210 mm - 2 x 10 mm = 718.1 px);
    // Chrome 155 evaluates it against its own print page and matches `(min-width: 750px)` (2
    // pages, "Width750" at (28.50, 39.75) pt on page 2). What port step 09 guarantees is that the
    // break rule and the style rule of one block agree: both off here (black, page 1), both on
    // at 600 px.
    let p = paginate(&probe(
        "@media (min-width: 750px) { .brk { break-before: page; color: rgb(200, 0, 0) } }",
        "<p>First</p><p class=\"brk\">Width750</p>",
    ));
    assert_eq!(p.pages.len(), 1, "Chrome prints 2 pages");
    let run = find_run(&p, 0, "Width750").expect("on page 1");
    assert_eq!(run.color, [0, 0, 0], "the style rule does not apply either");
    let p = paginate(&probe(
        "@media (min-width: 600px) { .brk { break-before: page; color: rgb(200, 0, 0) } }",
        "<p>First</p><p class=\"brk\">Width600</p>",
    ));
    assert_eq!(p.pages.len(), 2);
    assert_eq!(
        find_run(&p, 1, "Width600").expect("on page 2").color,
        [200, 0, 0]
    );
}

#[test]
fn page_rules_inside_a_feature_query_are_not_evaluated_known_gap() {
    // KNOWN GAP: `page_css` reads `@page` inside `@media` by media type only, because the page
    // box decides the layout viewport that Stylo evaluates features against (page size ->
    // viewport -> query is circular). Chrome 155 applies `margin-top: 40mm` here: "First" at
    // (28.50, 124.50) pt. vellora keeps the 10 mm margin: 39.75 pt.
    let p = paginate(&probe(
        "@media print and (min-width: 1px) { @page { margin-top: 40mm } }",
        "<p>First</p>",
    ));
    assert_at(
        body_origin(&p, 0, "First"),
        (28.50, 39.75),
        "First (Chrome 124.50 pt)",
    );
}

/// The 09 verifier's probes `x_unclosed_last_rule` and `x_unclosed_last_rule_nonascii`: a
/// stylesheet that ends inside its last rule (no `}` before `</style>`).
fn unclosed_last_rule(last: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: 300px 300px; margin: 20px; }} body {{ \
         margin: 0; font-family: \"Liberation Serif\"; font-size: 16px; line-height: 20px; }} p \
         {{ margin: 0; }} p.b {{ {last}</style></head><body><p>One</p><p class=\"b\">Two</p>\
         </body></html>"
    )
}

#[test]
fn an_unclosed_last_rule_keeps_its_forced_break() {
    // CSS Syntax 3 closes the open block at the end of the sheet. Chrome 155 (2026-10-22, the
    // shared reference path): 2 pages, "One" at (15.00, 26.25) on page 1 and "Two" at
    // (15.00, 26.25) on page 2. Steps 08 and 09 read `page` as `pag` (the body stopped one
    // byte short) and printed "Two" on page 1 at 41.25 pt; the non-ASCII variant panicked in
    // `break_css` ("end byte index 192 is not a char boundary").
    for last in [
        "break-before: page",
        "break-before: page; font-family: Caf\u{e9}",
    ] {
        let html = unclosed_last_rule(last);
        let p = paginate(&html);
        assert_eq!(p.pages.len(), 2, "{last}: Chrome prints 2 pages");
        assert_at(body_origin(&p, 0, "One"), (15.00, 26.25), "One");
        assert_at(body_origin(&p, 1, "Two"), (15.00, 26.25), "Two");
        let pdf = vellora_core::render(html.as_bytes(), &Default::default())
            .unwrap_or_else(|e| panic!("{last}: {e:?}"));
        assert!(pdf.starts_with(b"%PDF-"));
    }
}

#[test]
fn a_stylesheet_ending_inside_a_multibyte_character_renders() {
    // The 09 verifier's smallest panic inputs (unlocated "render panicked" through the addon).
    for html in [
        "<style>p{\u{e9}</style>".to_string(),
        "<style>p{\u{1f600}</style".to_string(),
        "<style>p { color: red; font-family: Caf\u{e9}</style><p>x</p>".to_string(),
    ] {
        let pdf = vellora_core::render(html.as_bytes(), &Default::default())
            .unwrap_or_else(|e| panic!("{html:?}: {e:?}"));
        assert!(pdf.starts_with(b"%PDF-"), "{html:?}");
    }
}
