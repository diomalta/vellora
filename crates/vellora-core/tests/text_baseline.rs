//! Text baselines against Chrome (port step `04-block-offset`).
//!
//! Every expected number below was measured in Chrome on the same HTML (Chrome
//! 155.0.8059.85, local macOS, so INDICATIVE; 2026-10-21) with the fidelity
//! reference setup (`fidelity/lib/chrome-reference.mjs`: print media, the bundled
//! Liberation/DejaVu faces injected as `@font-face`), at the viewport vellora
//! hands Blitz (A4 minus 2 x 18 mm = 657.64 px, truncated to 657 px).
//!
//! - Layout baselines (CSS px, document coordinates): the bottom edge of a
//!   zero-size inline-block injected as the element's first child after load
//!   (an inline-block without in-flow line boxes sits on the baseline, CSS 2.2
//!   §10.8.1).
//! - PDF baselines (pt from the page top): the PyMuPDF span origins of Chrome's
//!   `page.pdf()` of the same HTML (the oracles' print path). Chrome places the
//!   18 mm page margin at 68 CSS px = 51.0 pt; vellora at 51.024 pt.
//!
//! Probe HTML and raw numbers:
//! `fidelity/baselines/port/04-block-offset/attachments/chrome-probes-text-baseline.json`.

use vellora_core::{blitz_engine, page_css, render, RenderOptions};

fn opts() -> RenderOptions {
    RenderOptions {
        title: Some("Text baseline regression".to_string()),
        creation_date: Some((2026, 10, 21)),
        ..Default::default()
    }
}

fn lay_out(html: &str) -> blitz_engine::LaidOutDoc {
    let pb = page_css::parse_page_box(html);
    blitz_engine::validate_then_lay_out(
        html,
        vellora_core::validation::denied_elements(),
        pb.layout_content_width(),
        pb.content_height(),
        &std::collections::HashMap::new(),
        None,
        &[],
    )
    .unwrap_or_else(|_| panic!("probe is in the supported subset"))
}

/// Final pre-pagination baseline (`origin_y`) of the run whose text is `text`.
fn baseline_of(doc: &blitz_engine::LaidOutDoc, text: &str) -> f64 {
    doc.boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|run| {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            run.text.get(start..end).map(str::trim) == Some(text)
        })
        .unwrap_or_else(|| panic!("no text run {text:?}"))
        .origin_y
}

fn assert_baseline(doc: &blitz_engine::LaidOutDoc, text: &str, chrome: f64, tol: f64) {
    let got = baseline_of(doc, text);
    assert!(
        (got - chrome).abs() <= tol,
        "{text:?}: vellora baseline {got} px, Chrome {chrome} px (tolerance {tol})"
    );
}

/// Text y (pt from the page top) of every text object of page 1, in content
/// order. krilla writes `q 1 0 0 -1 0 H cm` (top-left origin) and then one
/// `1 0 0 -1 x y Tm` per glyph run, so `y` is the baseline from the top.
fn pdf_text_baselines_pt(pdf: &[u8]) -> Vec<f64> {
    let doc = lopdf::Document::load_mem(pdf).expect("lopdf parses output");
    let (_, page_id) = doc.get_pages().into_iter().next().expect("page 1");
    let content = doc.get_and_decode_page_content(page_id).expect("content");
    let num = |o: &lopdf::Object| match o {
        lopdf::Object::Real(v) => *v as f64,
        lopdf::Object::Integer(v) => *v as f64,
        other => panic!("not a number: {other:?}"),
    };
    content
        .operations
        .iter()
        .filter(|op| op.operator == "Tm")
        .map(|op| {
            assert_eq!(num(&op.operands[3]), -1.0, "Tm keeps the top-left flip");
            num(&op.operands[5])
        })
        .collect()
}

/// Cells without paint of their own (written when the `painted_table_cell_text_baselines`
/// 2 px raise of painted rows existed; retired in Phase C step 02).
const CELL_VALIGN: &str = r#"<!DOCTYPE html><html><head><style>@page { size: A4; margin: 18mm; } body { margin: 0; font-family: "Liberation Sans"; font-size: 12px; } table { border-collapse: separate; border-spacing: 0; } td { height: 60px; width: 100px; padding: 4px; }</style></head><body><table><tr><td id="top" style="vertical-align: top">TOP</td><td id="mid" style="vertical-align: middle">MID</td><td id="bot" style="vertical-align: bottom">BOT</td><td id="dflt">DFLT</td></tr></table></body></html>"#;

/// A table cell's `vertical-align` reaches Blitz as `align-content` and Blitz
/// stores the resulting line offset in `TextLayout::block_offset`; its painter
/// adds it to every glyph run. vellora's reader used to drop it, so every cell's
/// text sat at the top of the cell (step-03 build: 15 px for all four).
///
/// Chrome: TOP 15, MID 38, BOT 61, DFLT 38 (a `td` inherits `vertical-align:
/// middle` from the UA `tbody` rule). Each cell is 68 px tall (60 px height +
/// 2 x 4 px padding); the line box is 14 px (ascent 11).
#[test]
fn table_cell_vertical_align_places_the_text_where_chrome_does() {
    let doc = lay_out(CELL_VALIGN);
    assert_baseline(&doc, "TOP", 15.0, 0.5);
    assert_baseline(&doc, "MID", 38.0, 0.5);
    assert_baseline(&doc, "BOT", 61.0, 0.5);
    assert_baseline(&doc, "DFLT", 38.0, 0.5);
}

/// The same cells in the PDF: Chrome's print baselines 62.25 (TOP), 79.5 (MID),
/// 96.75 (BOT), 79.5 (DFLT) pt.
#[test]
fn table_cell_vertical_align_reaches_the_pdf_like_chrome_print() {
    let pdf = render(CELL_VALIGN.as_bytes(), &opts()).expect("render");
    let got = pdf_text_baselines_pt(&pdf);
    let chrome = [62.25, 79.5, 96.75, 79.5];
    assert_eq!(got.len(), chrome.len(), "one text object per cell: {got:?}");
    for (g, c) in got.iter().zip(chrome) {
        assert!(
            (g - c).abs() <= 0.1,
            "PDF baseline {g} pt vs Chrome {c} pt (all: {got:?})"
        );
    }
}

/// `align-content` on a block container (css-align-3 §5.4, Chrome since 123)
/// is the same Blitz `block_offset`. Chrome: start 14, center 132, end 250
/// (80 px tall boxes with a 1 px border, 4 px apart, 14 px text).
#[test]
fn align_content_on_a_block_container_moves_its_lines_like_chrome() {
    let html = r#"<!DOCTYPE html><html><head><style>@page { size: A4; margin: 18mm; } body { margin: 0; font-family: "Liberation Sans"; font-size: 14px; } div { height: 80px; border: 1px solid #000; margin-bottom: 4px; }</style></head><body><div id="ac_start">start</div><div id="ac_center" style="align-content: center">center</div><div id="ac_end" style="align-content: end">end</div></body></html>"#;
    let doc = lay_out(html);
    assert_baseline(&doc, "start", 14.0, 0.5);
    assert_baseline(&doc, "center", 132.0, 0.5);
    assert_baseline(&doc, "end", 250.0, 0.5);
}

const BASELINES: &str = r#"<!DOCTYPE html><html><head><style>@page { size: A4; margin: 18mm; } body { margin: 0; } div, p { margin: 0; }</style></head><body><div id="a" style="font: 16px 'Liberation Sans'">Hxg sans 16 normal</div><div id="b" style="font: 13.3333px/1.45 'Liberation Sans'">Hxg sans 10pt 1.45</div><div id="c" style="font: bold 24px/30px 'Liberation Serif'">Hxg serif 24/30</div><div id="d" style="font: 12px/1.2 'Liberation Mono'">Hxg mono 12 1.2</div><div id="e" style="font: 12px/2 'DejaVu Sans'">Hxg dejavu 12 x2</div><div id="f" style="font: 40px/1 'Liberation Sans'">Hxg 40/1</div><div id="g" style="font: 10px/0 'Liberation Sans'; padding-top: 20px">Hxg 10/0</div></body></html>"#;

/// Parley's line baseline already is Chrome's for every bundled face, size and
/// `line-height` form (normal, number, length, 0): Chrome 14, 32, 60.3125,
/// 77.3125, 97.703, 139.703, 168.703 px. The residual (|d| <= 0.31 px) is Blink
/// rounding the font ascent/descent to whole px.
#[test]
fn layout_baseline_matches_chrome_for_each_bundled_face_and_line_height() {
    let doc = lay_out(BASELINES);
    for (text, chrome) in [
        ("Hxg sans 16 normal", 14.0),
        ("Hxg sans 10pt 1.45", 32.0),
        ("Hxg serif 24/30", 60.3125),
        ("Hxg mono 12 1.2", 77.3125),
        ("Hxg dejavu 12 x2", 97.703),
        ("Hxg 40/1", 139.703),
        ("Hxg 10/0", 168.703),
    ] {
        assert_baseline(&doc, text, chrome, 0.35);
    }
}

/// The PDF draws each glyph run on its layout baseline. The former constant
/// 4 px raise (`pdf.rs` `TEXT_BASELINE_COMPENSATION_PX`) put every one of these
/// 2.976 pt above Chrome's print baseline (step-03 build, same probe); WPT Ahem
/// tests showed the same 4 px (`css/CSS2/linebox/line-height-002.xht`: 160
/// differing px = 2 glyphs x 20 px x 4 px). Chrome's PDF baselines: 61.5, 75.0,
/// 96.0, 108.75, 124.5, 156.0, 177.75 pt.
#[test]
fn pdf_text_baseline_is_the_layout_baseline_like_chrome_print() {
    let pdf = render(BASELINES.as_bytes(), &opts()).expect("render");
    let got = pdf_text_baselines_pt(&pdf);
    let chrome = [61.5, 75.0, 96.0, 108.75, 124.5, 156.0, 177.75];
    assert_eq!(got.len(), chrome.len(), "one text object per line: {got:?}");
    for (g, c) in got.iter().zip(chrome) {
        assert!(
            (g - c).abs() <= 0.1,
            "PDF baseline {g} pt vs Chrome {c} pt (all: {got:?})"
        );
    }
}

/// A 4-row table on a 300 px page whose row `row` (0-based) has `border-top: W px` (port step
/// 10, the shape of the invoice "Total a pagar" row).
fn bordered_row_table(collapse: &str, w: u32, row: usize) -> String {
    let rows: String = ["Aaa", "Bbb", "Ccc", "Ddd"]
        .iter()
        .enumerate()
        .map(|(i, t)| {
            let class = if i == row { " class=\"g\"" } else { "" };
            format!("<tr{class}><td>{t}</td></tr>")
        })
        .collect();
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: 300px 300px; margin: 20px; }} body {{ \
         margin: 0; font-family: \"Liberation Serif\"; font-size: 16px; line-height: 20px; }} \
         table {{ border-collapse: {collapse}; border-spacing: 0 }} td {{ padding: 0 }} tr.g td \
         {{ border-top: {w}px solid #000 }}</style></head><body><table>{rows}</table></body></html>"
    )
}

#[test]
fn a_collapsed_top_border_row_puts_its_text_below_the_border_like_chrome() {
    // Chrome 155 (2026-10-22, the shared reference path, PyMuPDF origins): Aaa 26.25, Bbb 41.25,
    // Ccc 41.25 + 15 + 0.75 W, Ddd Ccc + 15 pt. Raw Blitz 0.3.0-beta.4 counts a collapsed border
    // in the row height but does not move the bordered cell's text below it (Ccc W px above
    // Chrome), and step 09's `painted_table_cell_text_baselines` raised the row 2 px more. Since
    // Phase C step 02 the collapsed-border compensation (`blitz_engine::compensate_collapsed_borders`)
    // gives the cells half of each collapsed edge as their border, as Chrome does, and the raise
    // is retired: every row is at Chrome's baseline for every W.
    for (w, chrome_ccc) in [(1u32, 57.0), (4, 59.25), (8, 62.25)] {
        let pdf = render(bordered_row_table("collapse", w, 2).as_bytes(), &opts()).expect("render");
        let got = pdf_text_baselines_pt(&pdf);
        let chrome = [26.25, 41.25, chrome_ccc, chrome_ccc + 15.0];
        assert_eq!(got.len(), 4, "{got:?}");
        for (i, (g, c)) in got.iter().zip(chrome).enumerate() {
            assert!(
                (g - c).abs() <= 0.1,
                "W {w} row {}: {g} pt, Chrome {c} pt (all {got:?})",
                i + 1
            );
        }
    }
    // The first row of a collapsed table (Chrome Aaa 29.25 pt: below the 4 px border) and a
    // separated table (Chrome row 3 at 59.25 pt) are at Chrome's baselines too.
    let pdf = render(bordered_row_table("collapse", 4, 0).as_bytes(), &opts()).expect("render");
    let first = pdf_text_baselines_pt(&pdf)[0];
    assert!((first - 29.25).abs() <= 0.1, "first row {first} pt");
    let pdf = render(bordered_row_table("separate", 4, 2).as_bytes(), &opts()).expect("render");
    let separate = pdf_text_baselines_pt(&pdf)[2];
    assert!((separate - 59.25).abs() <= 0.1, "separate {separate} pt");
}
