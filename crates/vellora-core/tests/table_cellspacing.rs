//! `<table cellspacing>` maps to `border-spacing` like in Chrome (port step `10-spark`).
//!
//! Blitz 0.3.0-beta.4 synthesizes no `cellspacing` presentational hint, and since beta.4 it
//! applies `border-spacing` at the table's edges too, so a `cellspacing="0"` table kept the UA
//! `border-spacing: 2px`: every cell 2 px in from each side and 2 px lower per row
//! (`oss-sparksuite-invoice`'s outer table). `blitz_engine::table_spacing_hints_css` supplies the
//! hint as a user-agent sheet.
//!
//! Every expected number was measured in Chrome on the same HTML (Chrome 155.0.8059.85, local
//! macOS, INDICATIVE; 2026-10-22) with the fidelity reference setup
//! (`fidelity/lib/chrome-reference.mjs`: print media, bundled faces as `@font-face`) at the
//! viewport vellora hands Blitz (A4 minus 2 x 18 mm, truncated to 657 px):
//! `getBoundingClientRect()` of each cell. Probe HTML and raw numbers:
//! `fidelity/gate/snapshots/2026-10-22/10-spark/chrome-cellspacing.json` (script alongside).

use vellora_core::{blitz_engine, page_css};

fn probe(style: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>\n@page {{ size: A4; margin: 18mm; }}\n\
         body {{ margin: 8px; font: 16px/20px \"Liberation Sans\"; color: #000; }}\n\
         {style}\n</style></head><body>{body}</body></html>"
    )
}

const ROWS: &str = "<tr><td id=\"xa\">A</td><td id=\"xb\">B</td></tr>\
                    <tr><td id=\"xc\">C</td><td id=\"xd\">D</td></tr>";

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

/// The cell holding the one-letter text `text` (the box owning that run): (x, y).
fn cell(doc: &blitz_engine::LaidOutDoc, text: &str) -> (f64, f64) {
    let b = doc
        .boxes
        .iter()
        .find(|b| {
            b.text_runs
                .iter()
                .any(|r| r.text.trim() == text && b.tag.as_deref() == Some("td"))
        })
        .unwrap_or_else(|| panic!("no td holding {text:?}"));
    (b.x, b.y)
}

fn assert_cells(style: &str, table: &str, chrome_a: (f64, f64), chrome_d: (f64, f64)) {
    let doc = lay_out(&probe(style, table));
    for (text, chrome) in [("A", chrome_a), ("D", chrome_d)] {
        let got = cell(&doc, text);
        assert!(
            (got.0 - chrome.0).abs() <= 0.5 && (got.1 - chrome.1).abs() <= 0.5,
            "{table}: cell {text} at {got:?}, Chrome {chrome:?}"
        );
    }
}

#[test]
fn no_cellspacing_keeps_the_ua_two_px_spacing() {
    // Chrome: A 10,10; D 23.5625,32 (border-spacing 2px).
    assert_cells(
        "td { padding: 0; }",
        &format!("<table>{ROWS}</table>"),
        (10.0, 10.0),
        (23.5625, 32.0),
    );
}

#[test]
fn cellspacing_zero_removes_the_spacing() {
    // Chrome: A 8,8; D 19.5625,28 (border-spacing 0px). Before 10-spark: A 10,10; D 23.56,32.
    assert_cells(
        "td { padding: 0; }",
        &format!("<table cellspacing=\"0\">{ROWS}</table>"),
        (8.0, 8.0),
        (19.5625, 28.0),
    );
}

#[test]
fn cellspacing_is_a_pixel_length() {
    // Chrome: "5" -> A 13,13; D 29.5625,38. " 7px" (leading space, trailing junk: the rules for
    // parsing non-negative integers) -> 7 px: A 15,15; D 33.5625,42.
    assert_cells(
        "td { padding: 0; }",
        &format!("<table cellspacing=\"5\">{ROWS}</table>"),
        (13.0, 13.0),
        (29.5625, 38.0),
    );
    assert_cells(
        "td { padding: 0; }",
        &format!("<table cellspacing=\" 7px\">{ROWS}</table>"),
        (15.0, 15.0),
        (33.5625, 42.0),
    );
}

#[test]
fn an_author_border_spacing_beats_cellspacing() {
    // Chrome: author `table { border-spacing: 3px }` over cellspacing="0": A 11,11; D 25.5625,34.
    assert_cells(
        "table { border-spacing: 3px; } td { padding: 0; }",
        &format!("<table cellspacing=\"0\">{ROWS}</table>"),
        (11.0, 11.0),
        (25.5625, 34.0),
    );
}

#[test]
fn a_nested_table_without_the_attribute_keeps_the_ua_spacing() {
    // Chrome: the inner table of a cellspacing="0" table: A 10,10; D 23.5625,32.
    assert_cells(
        "td { padding: 0; }",
        &format!(
            "<table cellspacing=\"0\"><tr><td id=\"o\"><table>{ROWS}</table></td></tr></table>"
        ),
        (10.0, 10.0),
        (23.5625, 32.0),
    );
}

#[test]
fn cellpadding_replaces_the_ua_cell_padding() {
    // Chrome, cellspacing="0" and no author padding: the UA `td { padding: 1px }` puts D at
    // 21.5625,30; cellpadding="0" at 19.5625,28; cellpadding="4" at 27.5625,36.
    assert_cells(
        "",
        &format!("<table cellspacing=\"0\">{ROWS}</table>"),
        (8.0, 8.0),
        (21.5625, 30.0),
    );
    assert_cells(
        "",
        &format!("<table cellspacing=\"0\" cellpadding=\"0\">{ROWS}</table>"),
        (8.0, 8.0),
        (19.5625, 28.0),
    );
    assert_cells(
        "",
        &format!("<table cellspacing=\"0\" cellpadding=\"4\">{ROWS}</table>"),
        (8.0, 8.0),
        (27.5625, 36.0),
    );
}

#[test]
fn an_author_padding_beats_cellpadding() {
    // Chrome: `.p td { padding: 5px }` over cellpadding="0": D at 29.5625,38.
    assert_cells(
        ".p td { padding: 5px; }",
        &format!("<table class=\"p\" cellspacing=\"0\" cellpadding=\"0\">{ROWS}</table>"),
        (8.0, 8.0),
        (29.5625, 38.0),
    );
}
