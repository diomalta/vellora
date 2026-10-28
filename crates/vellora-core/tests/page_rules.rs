//! `@page` rules in cascade order (port step 06, `page_css`): every rule of every `<style>`
//! element, `:first` / `:left` / `:right`, cascade layers, `!important`, `@media print`, and the
//! `@top-center` / `@bottom-center` margin boxes laid out with their cascaded text properties.
//!
//! Chrome-verified: every document below was printed by Google Chrome 155.0.8059.85 (local macOS
//! arm64, 2026-10-21, INDICATIVE) through `fidelity/lib/chrome-reference.mjs` (puppeteer-core
//! `page.pdf`, print media, the bundled Liberation fonts injected as `@font-face`), and its words
//! read with PyMuPDF 1.28.2 character origins (`fidelity/oracles/py/words.py`: pen x of the first
//! glyph and baseline, PDF pt, top-left origin). The HTML, Chrome's words and vellora's are in
//! `fidelity/baselines/port/06-page-rules/attachments/chrome-probes-page-rules.json`. Chrome
//! snaps a margin box's baseline to whole device pixels (0.75 pt); vellora and WeasyPrint do
//! not, hence the tolerance of one pixel.
//!
//! Chrome loads an `@font-face` only when an element uses it, so the probes that name a face in a
//! margin box also use it in the body (`LOAD`): otherwise Chrome prints the box in its fallback
//! face, or not at all.

use vellora_core::{blitz_engine, page_css, pagination, validation, VelloraError};

/// Tolerance (pt) on both axes: one CSS px. Chrome snaps a margin box's baseline to whole device
/// px and places its line with up to 0.6 pt of quantization horizontally (largest |dx| of the 37
/// footer probes: 0.60 pt, `Liberation Sans` 8pt in a 15 mm-margin page); body text is within
/// 0.35 pt.
const TOL_PT: f64 = 0.75;
const PT_PER_PX: f64 = 0.75;
const FOOTER: &str = "content: \"Página \" counter(page) \" de \" counter(pages);";
/// Body text that makes Chrome load every bundled face a margin box may name.
const LOAD: &str = "<p>Corpo <span style=\"font-family: 'Liberation Sans'\">sans</span> \
     <span style=\"font-family: 'Liberation Serif'\">serif</span> \
     <span style=\"font-family: 'Liberation Mono'\">mono</span> \
     <b style=\"font-family: 'Liberation Sans'\">sansb</b></p>";
const THREE_PAGES: &str = "<div style=\"height: 50px\">pagina um</div>\
     <div style=\"break-before: page; height: 50px\">pagina dois</div>\
     <div style=\"break-before: page; height: 50px\">pagina tres</div>";

fn doc(css: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>{css} body {{ margin: 0; \
         font-family: \"Liberation Serif\"; font-size: 11pt; }}</style></head><body>{body}</body></html>"
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

/// (x, baseline) in pt of the first glyph run of page `page`'s margin box whose text is `text`.
fn margin_origin(p: &pagination::Paginated, page: usize, text: &str) -> (f64, f64) {
    let mt = p.pages[page]
        .margin_texts
        .iter()
        .find(|mt| mt.text == text)
        .unwrap_or_else(|| {
            panic!(
                "page {} has no margin box {text:?}: {:?}",
                page + 1,
                p.pages[page]
                    .margin_texts
                    .iter()
                    .map(|mt| &mt.text)
                    .collect::<Vec<_>>()
            )
        });
    let run = mt.runs.first().expect("shaped");
    (run.origin_x * PT_PER_PX, run.origin_y * PT_PER_PX)
}

/// (x, baseline) in pt of the body run whose text is `text` on page `page`.
fn body_origin(p: &pagination::Paginated, page: usize, text: &str) -> (f64, f64) {
    let run = p.pages[page]
        .text_runs
        .iter()
        .find(|r| r.text.trim() == text)
        .unwrap_or_else(|| panic!("{text:?} on page {}", page + 1));
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
fn a_second_universal_rule_adds_its_margin_box() {
    // The notification fixture's pattern: page size and margins in one rule, the footer in a
    // second one. Until step 06 only the first rule was read and the footer was lost.
    let html = doc(
        &format!(
            "@page {{ size: A4; margin: 16mm; }} @page {{ @bottom-center {{ {FOOTER} \
             font-family: \"Liberation Serif\"; }} }}"
        ),
        "<p>Primeira linha do corpo.</p>",
    );
    let p = paginate(&html);
    assert_eq!(p.report.footers, vec!["Página 1 de 1".to_string()]);
    // Chrome: "Página" at (264.96, 822.75) pt, 12 pt Liberation Serif, black.
    assert_at(
        margin_origin(&p, 0, "Página 1 de 1"),
        (264.96, 822.75),
        "footer",
    );
    let run = &p.pages[0].margin_texts[0].runs[0];
    assert_eq!(run.font_size, 16.0, "CSS initial font-size (Chrome 12 pt)");
    assert_eq!(
        run.color,
        [0, 0, 0],
        "inherited root colour (Chrome #000000)"
    );
    // Chrome: body "Primeira" at (45.0, 66.0) pt.
    assert_at(
        body_origin(&p, 0, "Primeira linha do corpo."),
        (45.0, 66.0),
        "body",
    );
}

#[test]
fn later_universal_declarations_override_earlier_ones() {
    // Chrome: "Primeira" at (28.5, 105.75) pt: margin 10 mm, then margin-top 30 mm.
    let html = doc(
        "@page { size: A4; margin: 10mm; } @page { margin-top: 30mm; }",
        "<p>Primeira linha do corpo.</p>",
    );
    assert_at(
        body_origin(&paginate(&html), 0, "Primeira linha do corpo."),
        (28.5, 105.75),
        "body",
    );
}

#[test]
fn first_page_margin_top_applies_to_page_one_only() {
    // WPT css/css-page/page-size-006 pattern. Chrome: "pagina um" baseline 123.0 pt (40 mm
    // top margin); "pagina dois"/"tres" 38.25 pt (10 mm); x 28.5 pt on every page.
    for css in [
        "@page { size: A4; margin: 10mm; } @page :first { margin-top: 40mm; }",
        // `:first` (0,1,0) beats a later universal rule (0,0,0).
        "@page :first { margin-top: 40mm; } @page { size: A4; margin: 10mm; }",
    ] {
        let p = paginate(&doc(css, THREE_PAGES));
        assert_eq!(p.report.page_count, 3, "{css}");
        assert_at(body_origin(&p, 0, "pagina um"), (28.5, 123.0), css);
        assert_at(body_origin(&p, 1, "pagina dois"), (28.5, 38.25), css);
        assert_at(body_origin(&p, 2, "pagina tres"), (28.5, 38.25), css);
    }
}

#[test]
fn first_page_size_may_differ_in_height() {
    // Chrome: page 1 594.96 x 841.92 pt (210 x 297 mm), pages 2-3 594.96 x 425.04 pt (210 x
    // 150 mm). vellora sizes 210 mm as 595.28 pt (Chrome rounds its width); the heights agree.
    let p = paginate(&doc(
        "@page { size: 210mm 150mm; margin: 10mm; } @page :first { size: 210mm 297mm; }",
        THREE_PAGES,
    ));
    let heights: Vec<f64> = p.pages.iter().map(|pg| pg.height_px * PT_PER_PX).collect();
    for (got, chrome) in heights.iter().zip([841.92, 425.04, 425.04]) {
        assert!((got - chrome).abs() < 0.2, "page heights {heights:?}");
    }
}

#[test]
fn left_and_right_pages_alternate_from_a_right_first_page() {
    // Page 1 is a right page (left-to-right progression). Chrome, mirrored margins: x 28.5,
    // 84.75, 28.5 pt; vertical: baselines 66.75, 123.0, 66.75 pt.
    let p = paginate(&doc(
        "@page { size: A4; margin: 10mm; } @page :left { margin-left: 30mm; margin-right: 10mm; } \
         @page :right { margin-left: 10mm; margin-right: 30mm; }",
        THREE_PAGES,
    ));
    assert_at(
        body_origin(&p, 0, "pagina um"),
        (28.5, 38.25),
        "right page 1",
    );
    assert_at(
        body_origin(&p, 1, "pagina dois"),
        (84.75, 38.25),
        "left page 2",
    );
    assert_at(
        body_origin(&p, 2, "pagina tres"),
        (28.5, 38.25),
        "right page 3",
    );
    let p = paginate(&doc(
        "@page { size: A4; margin: 10mm; } @page :left { margin-top: 40mm; } \
         @page :right { margin-top: 20mm; }",
        THREE_PAGES,
    ));
    assert_at(
        body_origin(&p, 0, "pagina um"),
        (28.5, 66.75),
        "right page 1",
    );
    assert_at(
        body_origin(&p, 1, "pagina dois"),
        (28.5, 123.0),
        "left page 2",
    );
    assert_at(
        body_origin(&p, 2, "pagina tres"),
        (28.5, 66.75),
        "right page 3",
    );
}

#[test]
fn an_rtl_root_makes_page_one_a_left_page() {
    // Right-to-left page progression (css-page-3 "Spread pseudo-classes"). Chrome, `<html
    // dir="rtl">`: baselines 123.0 (left: 40 mm), 66.75 (right: 20 mm), 123.0 pt.
    let html = doc(
        "@page { size: A4; margin: 10mm; } @page :left { margin-top: 40mm; } \
         @page :right { margin-top: 20mm; }",
        THREE_PAGES,
    )
    .replacen("<html>", "<html dir=\"rtl\">", 1);
    let p = paginate(&html);
    for (page, text, chrome) in [
        (0, "pagina um", 123.0),
        (1, "pagina dois", 66.75),
        (2, "pagina tres", 123.0),
    ] {
        let baseline = body_origin(&p, page, text).1;
        assert!(
            (baseline - chrome).abs() <= TOL_PT,
            "{text}: {baseline:.2} pt, Chrome {chrome} pt"
        );
    }
}

#[test]
fn blank_named_and_invalid_selectors_never_match() {
    // Chrome: "Primeira"/"pagina" at (28.5, 49.5)/(28.5, 38.25) pt — the 10 mm margins only.
    for (css, body, text, chrome) in [
        (
            "@page { size: A4; margin: 10mm; } @page wide { margin: 40mm; }",
            "<p>Primeira linha do corpo.</p>",
            "Primeira linha do corpo.",
            (28.5, 49.5),
        ),
        (
            "@page { size: A4; margin: 10mm; } @page :nth(1) { margin: 40mm; } \
             @page :bogus { margin: 40mm; }",
            "<p>Primeira linha do corpo.</p>",
            "Primeira linha do corpo.",
            (28.5, 49.5),
        ),
        (
            "@page { size: A4; margin: 10mm; } @page :blank { margin: 40mm; }",
            THREE_PAGES,
            "pagina um",
            (28.5, 38.25),
        ),
    ] {
        assert_at(
            body_origin(&paginate(&doc(css, body)), 0, text),
            chrome,
            css,
        );
    }
}

#[test]
fn layers_important_and_media_order_the_cascade() {
    for (css, chrome) in [
        // `@layer l2, l1;`: l1 is the later layer and wins. Chrome (84.75, 105.75) pt: 30 mm.
        (
            "@layer l2, l1; @layer l1 { @page { size: A4; margin: 30mm; } } \
             @layer l2 { @page { size: A4; margin: 0; } }",
            (84.75, 105.75),
        ),
        // An unlayered rule beats a layered one. Chrome (28.5, 49.5) pt: 10 mm.
        (
            "@page { size: A4; margin: 10mm; } @layer l1 { @page { margin: 30mm; } }",
            (28.5, 49.5),
        ),
        // `!important` beats `:first`'s higher specificity. Chrome (28.5, 49.5) pt.
        (
            "@page { size: A4; margin: 10mm !important; } @page :first { margin: 30mm; }",
            (28.5, 49.5),
        ),
        // `@media print` applies, `@media screen` does not. Chrome (28.5, 105.75) pt.
        (
            "@page { size: A4; margin: 10mm; } @media print { @page { margin-top: 30mm; } } \
             @media screen { @page { margin-top: 60mm; } }",
            (28.5, 105.75),
        ),
    ] {
        let html = doc(css, "<p>layer</p>");
        assert_at(body_origin(&paginate(&html), 0, "layer"), chrome, css);
    }
}

#[test]
fn first_page_margin_box_cascades_separately() {
    let footer = format!(
        "@page {{ size: A4; margin: 16mm; @bottom-center {{ {FOOTER} font-family: \"Liberation Serif\"; }} }}"
    );
    // `content: none` on :first: Chrome prints no footer on page 1, "Página 2 de 3" at
    // (264.96, 822.75) pt on page 2.
    let p = paginate(&doc(
        &format!("{footer} @page :first {{ @bottom-center {{ content: none; }} }}"),
        THREE_PAGES,
    ));
    assert!(p.pages[0].margin_texts.is_empty());
    assert_eq!(p.report.footers[0], "");
    assert_at(
        margin_origin(&p, 1, "Página 2 de 3"),
        (264.96, 822.75),
        "page 2",
    );
    // Another string on :first. Chrome: "Capa" at (285.13, 822.75) pt.
    let p = paginate(&doc(
        &format!("{footer} @page :first {{ @bottom-center {{ content: \"Capa\"; }} }}"),
        THREE_PAGES,
    ));
    assert_at(margin_origin(&p, 0, "Capa"), (285.13, 822.75), "cover");
    assert_at(
        margin_origin(&p, 2, "Página 3 de 3"),
        (264.96, 822.75),
        "page 3",
    );
    // A page-context property on :first. Chrome: page 1 "P 1" 7.5 pt at (292.7, 822.0);
    // pages 2-3 12 pt at (289.84, 822.75).
    let p = paginate(&doc(
        "@page { size: A4; margin: 16mm; @bottom-center { content: \"P \" counter(page); \
         font-family: \"Liberation Serif\"; } } @page :first { font-size: 10px; }",
        THREE_PAGES,
    ));
    assert_at(margin_origin(&p, 0, "P 1"), (292.7, 822.0), "page 1");
    assert_at(margin_origin(&p, 1, "P 2"), (289.84, 822.75), "page 2");
    assert_eq!(p.pages[0].margin_texts[0].runs[0].font_size, 10.0);
}

#[test]
fn margin_boxes_inherit_from_the_page_context_and_the_root() {
    // The page context inherits from the root element; margin boxes from the page context.
    // Chrome: html { Liberation Sans 10px rgb(200,0,0) } -> footer 7.5 pt #c80000 at
    // (274.31, 822.0); @page { font-size: 20px; color: rgb(0,128,0) } -> 15 pt #008000 at
    // (287.94, 824.25); @bottom-center { "Liberation Sans", Arial, sans-serif; 8pt } (the
    // text-stress-ptbr fixture's box) -> 7.99 pt at (273.33, 819.75).
    let p = paginate(&doc(
        &format!(
            "@page {{ size: A4; margin: 16mm; @bottom-center {{ {FOOTER} }} }} \
             html {{ font-family: \"Liberation Sans\"; font-size: 10px; color: rgb(200, 0, 0); }}"
        ),
        LOAD,
    ));
    assert_at(
        margin_origin(&p, 0, "Página 1 de 1"),
        (274.31, 822.0),
        "root",
    );
    let run = &p.pages[0].margin_texts[0].runs[0];
    assert_eq!((run.font_size, run.color), (10.0, [200, 0, 0]));

    let p = paginate(&doc(
        "@page { size: A4; margin: 16mm; font-size: 20px; color: rgb(0, 128, 0); \
         @bottom-center { content: \"P \" counter(page); font-family: \"Liberation Serif\"; } }",
        "<p>ctx</p>",
    ));
    assert_at(
        margin_origin(&p, 0, "P 1"),
        (287.94, 824.25),
        "page context",
    );
    let run = &p.pages[0].margin_texts[0].runs[0];
    assert_eq!((run.font_size, run.color), (20.0, [0, 128, 0]));

    let p = paginate(&doc(
        &format!(
            "@page {{ size: A4; margin: 16mm 15mm 18mm 15mm; @bottom-center {{ {FOOTER} \
             font-family: \"Liberation Sans\", Arial, sans-serif; font-size: 8pt; }} }}"
        ),
        LOAD,
    ));
    assert_at(
        margin_origin(&p, 0, "Página 1 de 1"),
        (273.33, 819.75),
        "box declarations",
    );
}

#[test]
fn margin_box_line_is_centred_in_the_page_area_and_the_margin_band() {
    // (family, font-size px, bottom margin mm, Chrome "Página" x, Chrome baseline) in pt. The
    // baseline sits (ascent - descent) / 2 below the band centre (Chrome snaps it to whole px).
    const GRID: &[(&str, f64, f64, f64, f64)] = &[
        ("Liberation Mono", 8.0, 16.0, 274.04, 821.25),
        ("Liberation Mono", 8.0, 30.0, 274.04, 801.0),
        ("Liberation Mono", 10.0, 16.0, 268.18, 821.25),
        ("Liberation Mono", 10.0, 30.0, 268.18, 801.0),
        ("Liberation Mono", 12.0, 16.0, 262.35, 821.25),
        ("Liberation Mono", 12.0, 30.0, 262.35, 801.75),
        ("Liberation Mono", 16.0, 16.0, 250.64, 822.0),
        ("Liberation Mono", 16.0, 30.0, 250.64, 802.5),
        ("Liberation Mono", 24.0, 16.0, 227.24, 824.25),
        ("Liberation Mono", 24.0, 30.0, 227.24, 804.0),
        ("Liberation Mono", 32.0, 16.0, 203.85, 825.75),
        ("Liberation Mono", 32.0, 30.0, 203.85, 805.5),
        ("Liberation Sans", 8.0, 16.0, 278.94, 821.25),
        ("Liberation Sans", 8.0, 30.0, 278.94, 801.0),
        ("Liberation Sans", 10.0, 16.0, 274.31, 822.0),
        ("Liberation Sans", 10.0, 30.0, 274.31, 801.75),
        ("Liberation Sans", 12.0, 16.0, 269.67, 822.0),
        ("Liberation Sans", 12.0, 30.0, 269.67, 802.5),
        ("Liberation Sans", 16.0, 16.0, 260.43, 822.75),
        ("Liberation Sans", 16.0, 30.0, 260.43, 803.25),
        ("Liberation Sans", 24.0, 16.0, 241.9, 825.0),
        ("Liberation Sans", 24.0, 30.0, 241.9, 805.5),
        ("Liberation Sans", 32.0, 16.0, 223.39, 827.25),
        ("Liberation Sans", 32.0, 30.0, 223.39, 807.0),
        ("Liberation Serif", 8.0, 16.0, 281.2, 821.25),
        ("Liberation Serif", 8.0, 30.0, 281.2, 801.0),
        ("Liberation Serif", 10.0, 16.0, 277.15, 822.0),
        ("Liberation Serif", 10.0, 30.0, 277.15, 801.75),
        ("Liberation Serif", 12.0, 16.0, 273.08, 822.0),
        ("Liberation Serif", 12.0, 30.0, 273.08, 801.75),
        ("Liberation Serif", 16.0, 16.0, 264.96, 822.75),
        ("Liberation Serif", 16.0, 30.0, 264.96, 803.25),
        ("Liberation Serif", 24.0, 16.0, 248.72, 825.0),
        ("Liberation Serif", 24.0, 30.0, 248.72, 804.75),
        ("Liberation Serif", 32.0, 16.0, 232.48, 827.25),
        ("Liberation Serif", 32.0, 30.0, 232.48, 807.0),
    ];
    for &(family, size, bottom, x, baseline) in GRID {
        let html = doc(
            &format!(
                "@page {{ size: A4; margin: 16mm 16mm {bottom}mm 16mm; @bottom-center {{ {FOOTER} \
                 font-family: \"{family}\"; font-size: {size}px; }} }}"
            ),
            LOAD,
        );
        let p = paginate(&html);
        assert_at(
            margin_origin(&p, 0, "Página 1 de 1"),
            (x, baseline),
            &format!("{family} {size}px, bottom margin {bottom}mm"),
        );
    }
    // @top-center, 20 mm top margin. Chrome: "Cabeçalho" 12px at (275.09, 30.75), 16px at
    // (267.63, 32.25).
    for (size, chrome) in [(12.0, (275.09, 30.75)), (16.0, (267.63, 32.25))] {
        let html = doc(
            &format!(
                "@page {{ size: A4; margin: 20mm 16mm; @top-center {{ content: \"Cabeçalho \" \
                 counter(page); font-family: \"Liberation Serif\"; font-size: {size}px; }} }}"
            ),
            LOAD,
        );
        assert_at(
            margin_origin(&paginate(&html), 0, "Cabeçalho 1"),
            chrome,
            "top",
        );
    }
    // Asymmetric margins (40 mm left, 10 mm right): the centre moves 15 mm right. Chrome
    // (307.63, 822.75).
    let html = doc(
        &format!(
            "@page {{ size: A4; margin: 16mm 10mm 16mm 40mm; @bottom-center {{ {FOOTER} \
             font-family: \"Liberation Serif\"; }} }}"
        ),
        "<p>Primeira linha do corpo.</p>",
    );
    assert_at(
        margin_origin(&paginate(&html), 0, "Página 1 de 1"),
        (307.63, 822.75),
        "asymmetric",
    );
}

#[test]
fn a_rule_that_changes_the_content_width_is_rejected_at_its_source() {
    // Blitz lays the document out once, at one width: `:first`/`:left`/`:right` may change the
    // page height and the vertical margins (above), not the content width.
    let html = "<!DOCTYPE html><html><head><style>\n@page { margin: 0 }\n  @page :first { margin: 1cm }\n</style></head><body><p>x</p></body></html>";
    match validation::validate(html) {
        Err(VelloraError::Unsupported(d)) => {
            assert_eq!(d.feature, "css:page-varying-width");
            assert_eq!(
                (d.line, d.col),
                (Some(3), Some(3)),
                "points at the :first rule"
            );
        }
        other => panic!("expected css:page-varying-width, got {other:?}"),
    }
    let rendered = vellora_core::render(html.as_bytes(), &Default::default());
    assert!(
        matches!(&rendered, Err(VelloraError::Unsupported(d)) if d.feature == "css:page-varying-width"),
        "render rejects it too"
    );
    // Mirrored left/right margins keep the width: accepted.
    validation::validate(
        "<!DOCTYPE html><html><head><style>@page { margin: 10mm } @page :left { margin-left: 30mm; \
         margin-right: 10mm } @page :right { margin-left: 10mm; margin-right: 30mm }</style></head>\
         <body><p>x</p></body></html>",
    )
    .expect("equal content widths");
}
