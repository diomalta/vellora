//! The box walk against Chrome (port step `05-walk-rewrite`).
//!
//! vellora reads Blitz's box tree (`layout_children`: anonymous blocks and
//! `::before`/`::after` boxes included) and places every box through Blitz's
//! containing-block chain (`Node::containing_block`), instead of walking DOM
//! children and summing DOM-parent offsets. Before this step the DOM walk never
//! read the text of an anonymous block (the body's own text, text next to a
//! block child), never visited a block `::before`, and placed an absolutely
//! positioned box relative to its DOM parent instead of its containing block;
//! the `html_normalize` pre-pass papered over the first case by inserting
//! `<div>` wrappers, which broke `<p>` content (a `<div>` cannot live in a `<p>`).
//!
//! Every expected number below was measured in Chrome on the same HTML (Chrome
//! 155.0.8059.85, local macOS, so INDICATIVE; 2026-10-21) with the fidelity
//! reference setup (`fidelity/lib/chrome-reference.mjs`: print media, the bundled
//! Liberation/DejaVu faces injected as `@font-face`), at the viewport vellora
//! hands Blitz (A4 minus 2 x 18 mm = 657.64 px, truncated to 657 px):
//!
//! - boxes: `getBoundingClientRect()` of the element (CSS px, document
//!   coordinates);
//! - baselines: the bottom of a zero-size inline-block inserted right before the
//!   text node (CSS 2.2 §10.8.1), x: the text's `Range.getClientRects()`;
//! - `::before` text (not in the DOM): the PyMuPDF span origin of Chrome's
//!   `page.pdf()`, minus the 68 px (51 pt) page margin Chrome prints.
//!
//! Probe HTML and raw numbers:
//! `fidelity/baselines/port/05-walk-rewrite/attachments/chrome-probes-walk.json`.

use vellora_core::{blitz_engine, page_css, pagination};

/// The probe documents: one style block and one body, exactly as measured.
fn probe(style: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>\n@page {{ size: A4; margin: 18mm; }}\n\
         body {{ margin: 8px; font: 16px/20px \"Liberation Sans\"; color: #000; }}\n\
         {style}\n</style></head><body>{body}</body></html>"
    )
}

fn lay_out(html: &str) -> blitz_engine::LaidOutDoc {
    let pb = page_css::parse_page_box(html);
    blitz_engine::validate_then_lay_out(
        html,
        vellora_core::validation::denied_elements(),
        pb.content_width(),
        pb.content_height(),
        &std::collections::HashMap::new(),
        None,
        &[],
    )
    .unwrap_or_else(|_| panic!("probe is in the supported subset"))
}

fn run_text(run: &blitz_engine::TextRun) -> &str {
    let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
    let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
    run.text.get(start..end).map(str::trim).unwrap_or("")
}

/// The final pre-pagination run whose (trimmed) text is `text`.
fn run<'a>(doc: &'a blitz_engine::LaidOutDoc, text: &str) -> &'a blitz_engine::TextRun {
    doc.boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|r| run_text(r) == text)
        .unwrap_or_else(|| {
            let all: Vec<&str> = doc
                .boxes
                .iter()
                .flat_map(|b| b.text_runs.iter())
                .map(run_text)
                .collect();
            panic!("no text run {text:?}; runs: {all:?}")
        })
}

/// The box owning the run whose text is `text`.
fn owner<'a>(doc: &'a blitz_engine::LaidOutDoc, text: &str) -> &'a blitz_engine::LaidOutBox {
    doc.boxes
        .iter()
        .find(|b| b.text_runs.iter().any(|r| run_text(r) == text))
        .unwrap_or_else(|| panic!("no box owns {text:?}"))
}

fn near(got: f64, chrome: f64, tol: f64) -> bool {
    (got - chrome).abs() <= tol
}

fn assert_run_at(doc: &blitz_engine::LaidOutDoc, text: &str, chrome: (f64, f64)) {
    let r = run(doc, text);
    assert!(
        near(r.origin_x, chrome.0, 0.5) && near(r.origin_y, chrome.1, 0.5),
        "{text:?}: vellora ({}, {}), Chrome {chrome:?}",
        r.origin_x,
        r.origin_y
    );
}

fn assert_box(b: &blitz_engine::LaidOutBox, chrome: (f64, f64, f64, f64), what: &str) {
    assert!(
        near(b.x, chrome.0, 0.5)
            && near(b.y, chrome.1, 0.5)
            && near(b.width, chrome.2, 0.5)
            && near(b.height, chrome.3, 0.5),
        "{what}: vellora ({}, {}, {}x{}), Chrome {chrome:?}",
        b.x,
        b.y,
        b.width,
        b.height
    );
}

/// An absolutely positioned `<span>` inside a non-positioned `<p>` inside a
/// `position: relative` box: Blitz positions it against that box (its containing
/// block); the DOM walk added the `<p>`'s offset again (58, 61). Chrome: the
/// span's border box 48, 35, 50 x 20, its "x" at x 48 / baseline 50; "para" at
/// x 18 / baseline 71; the next block's "after" at x 8 / baseline 117.
#[test]
fn abspos_box_sits_on_its_containing_block_not_its_dom_parent() {
    let doc = lay_out(&probe(
        ".rel { position: relative; margin-top: 30px; padding: 10px; background: #eee; }\n\
         .abs { position: absolute; top: 5px; left: 40px; width: 50px; height: 20px; background: #0a0; }",
        r#"<div class="rel" id="rel"><p id="p">para <span class="abs" id="abs">x</span></p></div><div id="after">after</div>"#,
    ));
    let abs = owner(&doc, "x");
    assert_eq!(abs.tag.as_deref(), Some("span"));
    assert_box(abs, (48.0, 35.0, 50.0, 20.0), "span.abs");
    let bg = abs
        .visual_rects
        .first()
        .expect("the abspos background is read");
    assert_eq!((bg.x, bg.y, bg.width, bg.height), (48.0, 35.0, 50.0, 20.0));
    assert_run_at(&doc, "x", (48.0, 50.0));
    assert_run_at(&doc, "para", (18.0, 71.0));
    assert_run_at(&doc, "after", (8.0, 117.0));
}

/// Absolutely positioned boxes with no positioned ancestor use the initial
/// containing block, so neither the body margin nor the preceding flow is
/// added; one of them has `z-index: 2` (Blitz lists it only in the root's
/// stacking context, not in any `paint_children`, so a paint-order walk would
/// miss it). Chrome: 200, 100, 30 x 30 and 300, 10, 10 x 10. Both reach the
/// page at those positions plus the 18 mm page margins (Chrome prints them at
/// the same page offsets).
#[test]
fn abspos_against_the_initial_containing_block_and_z_index_reach_the_page() {
    let html = probe(
        "h1 { margin: 20px 0; font-size: 20px; line-height: 24px; }\n\
         .abs2 { position: absolute; top: 100px; left: 200px; width: 30px; height: 30px; background: #00f; }\n\
         .z { position: absolute; z-index: 2; top: 10px; left: 300px; width: 10px; height: 10px; background: #f00; }",
        r#"<h1 id="h">Title</h1><div id="d">flow</div><div class="abs2" id="abs2"></div><div class="z" id="z"></div>"#,
    );
    let doc = lay_out(&html);
    let colored = |color: [u8; 3]| {
        doc.boxes
            .iter()
            .find(|b| b.visual_rects.iter().any(|r| r.color == color))
            .unwrap_or_else(|| panic!("a box painted {color:?}"))
    };
    assert_box(colored([0, 0, 255]), (200.0, 100.0, 30.0, 30.0), "div.abs2");
    assert_box(colored([255, 0, 0]), (300.0, 10.0, 10.0, 10.0), "div.z");
    assert_run_at(&doc, "Title", (8.0, 39.0));
    assert_run_at(&doc, "flow", (8.0, 79.0));

    let pb = page_css::parse_page_box(&html);
    let pages = pagination::paginate(&doc, &pb).pages;
    assert_eq!(pages.len(), 1);
    for (color, (x, y)) in [([0, 0, 255], (200.0, 100.0)), ([255, 0, 0], (300.0, 10.0))] {
        assert!(
            pages[0].rects.iter().any(|r| r.color == color
                && near(r.x, x + pb.margin_left, 0.01)
                && near(r.y, y + pb.margin_top, 0.01)),
            "{color:?} box not on the page at ({x}, {y}) + margins"
        );
    }
}

/// `right`/`bottom` insets resolve against the containing block's padding box.
/// Chrome: the `.br` box at 280, 107, 40 x 20 (its text baseline 122).
#[test]
fn abspos_bottom_right_resolves_against_the_relative_container() {
    let doc = lay_out(&probe(
        ".box { position: relative; width: 300px; height: 120px; margin: 10px 20px; border: 2px solid #000; }\n\
         .br { position: absolute; right: 10px; bottom: 5px; width: 40px; height: 20px; background: #0a0; }",
        r#"<div class="box" id="box"><div id="inflow">in flow</div><div class="br" id="br">br</div></div>"#,
    ));
    assert_box(owner(&doc, "br"), (280.0, 107.0, 40.0, 20.0), "div.br");
    assert_run_at(&doc, "br", (280.0, 122.0));
    assert_run_at(&doc, "in flow", (30.0, 27.0));
}

/// Inline content next to a block child lives in Blitz anonymous blocks; the
/// walk reads them (no element: `tag` `None`). Chrome baselines: "leading text"
/// 8 / 23, "inner para" 8 / 59, "trailing" 8 / 95 and "bold" 59.578 / 95.
#[test]
fn text_next_to_a_block_child_is_read_from_the_anonymous_blocks() {
    let doc = lay_out(&probe(
        "p { margin: 16px 0; }",
        r#"<div id="mixed">leading text<p id="mp">inner para</p>trailing <b id="b">bold</b></div>"#,
    ));
    assert_run_at(&doc, "leading text", (8.0, 23.0));
    assert_run_at(&doc, "inner para", (8.0, 59.0));
    assert_run_at(&doc, "trailing", (8.0, 95.0));
    assert_run_at(&doc, "bold", (59.578, 95.0));
    let anon = owner(&doc, "leading text");
    assert_eq!(anon.tag, None, "an anonymous block box is not an element");
    assert_box(anon, (8.0, 8.0, 641.0, 20.0), "anonymous block");
}

/// The body's own text after a block child (an anonymous block of the body)
/// is laid out, paginated and drawn. Chrome: "body text" at 8 / 43 (print PDF:
/// 57.0, 83.25 pt).
#[test]
fn the_bodys_own_text_is_drawn() {
    let html = probe("", r#"<div id="d">block</div>body text"#);
    let doc = lay_out(&html);
    assert_run_at(&doc, "body text", (8.0, 43.0));
    let pb = page_css::parse_page_box(&html);
    let pages = pagination::paginate(&doc, &pb).pages;
    assert!(
        pages[0]
            .text_runs
            .iter()
            .any(|r| run_text(r) == "body text" && near(r.origin_y, 43.0 + pb.margin_top, 0.5)),
        "the body's own text reaches page 1"
    );
}

/// A body holding only inline-level content is itself the inline root: its text
/// sits on the body box, not on an anonymous block, and pagination used to drop
/// it (it fragments the body's children). Chrome: "only inline" 8 / 23, "text"
/// 83.609 / 23 (print PDF: 57.0 / 68.25 and 113.707 / 68.25 pt), the
/// inline-block 116.516, 13, 20 x 10 and the abspos box 100, 60, 10 x 10.
#[test]
fn a_body_that_is_an_inline_root_reaches_the_page() {
    let html = probe(
        ".ib { display: inline-block; width: 20px; height: 10px; background: #0a0; }\n\
         .abs { position: absolute; top: 60px; left: 100px; width: 10px; height: 10px; background: #00f; }",
        r#"only inline <b id="b">text</b> <span class="ib" id="ib"></span><div class="abs" id="abs"></div>"#,
    );
    let doc = lay_out(&html);
    let body = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("body"))
        .expect("body");
    assert!(!body.text_runs.is_empty(), "the body shaped its own text");
    assert_run_at(&doc, "only inline", (8.0, 23.0));
    assert_run_at(&doc, "text", (83.609, 23.0));

    let pb = page_css::parse_page_box(&html);
    let pages = pagination::paginate(&doc, &pb).pages;
    assert_eq!(pages.len(), 1);
    for (text, (x, y)) in [("only inline", (8.0, 23.0)), ("text", (83.609, 23.0))] {
        assert!(
            pages[0].text_runs.iter().any(|r| run_text(r) == text
                && near(r.origin_x, x + pb.margin_left, 0.5)
                && near(r.origin_y, y + pb.margin_top, 0.5)),
            "{text:?} not on page 1 at Chrome's position"
        );
    }
    for (color, (x, y)) in [([0, 170, 0], (116.516, 13.0)), ([0, 0, 255], (100.0, 60.0))] {
        assert!(
            pages[0].rects.iter().any(|r| r.color == color
                && near(r.x, x + pb.margin_left, 0.5)
                && near(r.y, y + pb.margin_top, 0.5)),
            "{color:?} box not on page 1 at ({x}, {y}) + margins"
        );
    }
}

/// A block `::before` is a box of its own (an `AnonymousBlock` node in Blitz)
/// with its background and its generated text. Chrome's print PDF: "BEFORE" at
/// 8 / 23 and "inner block" at 8 / 43; the `::before` box is 8, 8, 641 x 20
/// (`#mix` starts at 8 and `#inner` at 28).
#[test]
fn a_block_before_pseudo_element_is_drawn() {
    let doc = lay_out(&probe(
        ".mix::before { content: \"BEFORE\"; display: block; background: #ff0; }",
        r#"<div class="mix" id="mix"><div id="inner">inner block</div></div><div id="next">next</div>"#,
    ));
    assert_run_at(&doc, "BEFORE", (8.0, 23.0));
    assert_run_at(&doc, "inner block", (8.0, 43.0));
    assert_run_at(&doc, "next", (8.0, 63.0));
    let pseudo = owner(&doc, "BEFORE");
    assert_eq!(pseudo.tag, None);
    assert_box(pseudo, (8.0, 8.0, 641.0, 20.0), "::before");
    assert!(pseudo.visual_rects.iter().any(|r| r.color == [255, 255, 0]));
}

/// A table cell holding text, a block and more text (the case `html_normalize`
/// was written for) without any pre-pass. Chrome: "cell" 16 / 31, the `<div>`
/// box 16, 36, "block" 16 / 51, "after" 16 / 71.
#[test]
fn a_cell_mixing_text_and_a_block_reads_like_chrome() {
    let doc = lay_out(&probe(
        "table { border-spacing: 0; } td { padding: 8px; }",
        r#"<table id="t"><tr><td id="td">cell <div id="blk">block</div> after</td></tr></table>"#,
    ));
    assert_run_at(&doc, "cell", (16.0, 31.0));
    assert_run_at(&doc, "block", (16.0, 51.0));
    assert_run_at(&doc, "after", (16.0, 71.0));
    let blk = owner(&doc, "block");
    assert_eq!(blk.tag.as_deref(), Some("div"));
    assert!(near(blk.x, 16.0, 0.5) && near(blk.y, 36.0, 0.5));
    // The table's row structure is still in the box list, above its cell.
    let tags: Vec<&str> = doc.boxes.iter().filter_map(|b| b.tag.as_deref()).collect();
    let at = |t: &str| tags.iter().position(|x| *x == t).unwrap();
    assert!(at("table") < at("tbody") && at("tbody") < at("tr") && at("tr") < at("td"));
}

/// The receipt's `p.thanks`: a `display: block` span, then the note text. The
/// note stays inside the `<p>` (an anonymous block that inherits its centring,
/// 10 pt size and #444 colour). `html_normalize` wrapped it in a `<div>`, which
/// the HTML re-parse hoisted out of the `<p>`: the note lost those styles (x 8,
/// 16 px, black). Chrome: "Volte sempre." at x 167.234, baseline 71.781,
/// 13.333 px, rgb(68, 68, 68); the footer's "Fine print" baseline 125.797.
#[test]
fn text_after_a_block_span_inside_a_paragraph_keeps_the_paragraphs_styles() {
    let doc = lay_out(&probe(
        ".wrap { width: 400px; }\n\
         .thanks { text-align: center; font-size: 10pt; color: #444; margin-top: 8mm; }\n\
         .thanks .big { display: block; font-size: 13pt; font-weight: 700; color: #1a1a1a; margin-bottom: 2mm; }\n\
         footer { margin-top: 9mm; font-size: 8pt; }",
        "<div class=\"wrap\" id=\"wrap\"><p class=\"thanks\" id=\"thanks\">\n  \
         <span class=\"big\" id=\"big\">Obrigado pela sua compra!</span>\n  Volte sempre.\n</p>\n\
         <footer id=\"foot\">Fine print</footer></div>",
    ));
    let note = run(&doc, "Volte sempre.");
    assert!(near(note.origin_x, 167.234, 0.5), "{}", note.origin_x);
    assert!(near(note.origin_y, 71.781, 0.5), "{}", note.origin_y);
    assert!(
        near(note.font_size as f64, 13.333, 0.01),
        "{}",
        note.font_size
    );
    assert_eq!(note.color, [68, 68, 68]);
    assert_run_at(&doc, "Obrigado pela sua compra!", (95.797, 46.234));
    assert_run_at(&doc, "Fine print", (8.0, 125.797));
    // No element was inserted: the only <p> is the source one.
    assert_eq!(
        doc.boxes
            .iter()
            .filter(|b| b.tag.as_deref() == Some("p"))
            .count(),
        1
    );
}
