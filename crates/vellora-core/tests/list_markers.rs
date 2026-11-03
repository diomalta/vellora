//! Outside list markers (issue #73): `list-style-position: outside` (the default) paints the
//! `<ul>` bullet / `<ol>` number where Chrome does. Before the fix the walk never read Blitz's
//! separate outside-marker layout, so every default `<li>` lost its marker.
//!
//! Reference: Chrome 153.0.8010.12 print-to-PDF of `fixtures/list-markers/outside.html` with
//! `font-family: sans-serif` rewritten to the bundled Liberation Sans `@font-face` on the Chrome
//! side only, positions read with `pdftotext -bbox` (pt, converted to px x 4/3). Chrome paints a
//! disc / square marker as a shape, not text, so only string markers (`1.`, `a.`) have a Chrome
//! x; for those the marker's first glyph sits at 16.652343 pt = 22.203 px, its baseline is the
//! first line's, and the item's padding / border do not move it.

use vellora_core::{blitz_engine, page_css, render, validation, RenderOptions};

const OUTSIDE: &str = include_str!("fixtures/list-markers/outside.html");

/// Chrome vs vellora tolerance for a marker's x (CSS px). Measured |dx| <= 0.01 px.
const CHROME_TOL_PX: f64 = 0.5;

fn lay_out_like_render(html: &str) -> blitz_engine::LaidOutDoc {
    let page_box = page_css::parse_page_box(html);
    blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        page_box.layout_content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("fixture lays out")
}

/// Every run as (source text its glyphs cover, x, baseline y), in walk order.
fn runs(doc: &blitz_engine::LaidOutDoc) -> Vec<(String, f64, f64)> {
    doc.boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .map(|run| {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            (run.text[start..end].to_string(), run.origin_x, run.origin_y)
        })
        .collect()
}

/// The marker run on the same baseline as the content run `content`, and that content run.
fn marker_beside(
    runs: &[(String, f64, f64)],
    content: &str,
) -> ((String, f64, f64), (String, f64, f64)) {
    let text = runs
        .iter()
        .find(|(t, _, _)| t == content)
        .unwrap_or_else(|| panic!("no run {content:?} in {runs:?}"))
        .clone();
    let marker = runs
        .iter()
        .find(|(t, x, y)| t != content && (y - text.2).abs() < 0.01 && *x != text.1)
        .unwrap_or_else(|| panic!("no marker on the baseline of {content:?} in {runs:?}"))
        .clone();
    (marker, text)
}

#[test]
fn string_markers_sit_where_chrome_paints_them() {
    let runs = runs(&lay_out_like_render(OUTSIDE));
    // (content run, expected marker, Chrome x of the marker in px)
    let chrome_marker_x = 16.652343 * 4.0 / 3.0;
    for (content, marker_text, chrome_x) in [
        ("default (outside) decimal", "1.", chrome_marker_x),
        ("second item", "2.", chrome_marker_x),
        // The item's own padding-left and border-left do not move the marker.
        ("padded", "1.", chrome_marker_x),
        // A block child: the marker sits on the paragraph's first baseline.
        ("block child", "1.", chrome_marker_x),
        ("alpha", "a.", chrome_marker_x),
        // 24pt: the marker is shaped at the item's font size (Chrome x 3.316406 pt).
        ("big", "1.", 3.316406 * 4.0 / 3.0),
    ] {
        // A content run may repeat (`second item` is in the `<ul>` too): one of them carries it.
        let x = runs
            .iter()
            .filter(|(t, _, _)| t == content)
            .find_map(|(_, _, y)| {
                runs.iter()
                    .find(|(t, _, my)| t == marker_text && (my - y).abs() < 0.01)
                    .map(|(_, x, _)| *x)
            })
            .unwrap_or_else(|| panic!("no {marker_text:?} beside {content:?}: {runs:?}"));
        assert!(
            (x - chrome_x).abs() <= CHROME_TOL_PX,
            "{content:?}: marker {marker_text:?} at x {x}, Chrome {chrome_x}"
        );
    }
}

#[test]
fn bullet_markers_paint_left_of_the_content_on_its_baseline() {
    let runs = runs(&lay_out_like_render(OUTSIDE));
    for (content, bullet) in [("default (outside) disc", "•"), ("square", "▪")] {
        let (marker, text) = marker_beside(&runs, content);
        assert_eq!(marker.0, bullet, "{content:?}: {runs:?}");
        assert!(
            marker.1 < text.1,
            "{content:?}: marker {marker:?} not left of {text:?}"
        );
    }
    // Inside markers are part of the line (unchanged); `none` paints no marker.
    assert!(
        runs.iter().any(|(t, _, _)| t == "• "),
        "inside disc lost: {runs:?}"
    );
    let none = runs.iter().find(|(t, _, _)| t == "no marker").expect("run");
    assert!(
        !runs
            .iter()
            .any(|(t, _, y)| t != "no marker" && (y - none.2).abs() < 0.01),
        "list-style-type: none painted a marker: {runs:?}"
    );
}

#[test]
fn rtl_markers_sit_past_the_item_end_edge() {
    let runs = runs(&lay_out_like_render(OUTSIDE));
    let (marker, text) = marker_beside(&runs, "abc");
    assert_eq!(marker.0, "1.");
    // Chrome 153: the marker starts one space (4.445 px at 16 px) past the item's right edge
    // (`<ol dir=rtl style="width:400px">` puts the item at 0..400 px).
    assert!(
        (marker.1 - (400.0 + 4.445)).abs() <= CHROME_TOL_PX,
        "rtl marker at x {}, text {text:?}",
        marker.1
    );
}

#[test]
fn the_pdf_carries_the_markers() {
    let pdf = render(OUTSIDE.as_bytes(), &RenderOptions::default()).expect("render");
    let text = pdf_extract::extract_text_from_mem(&pdf).expect("extract text");
    for needle in ["1.", "2.", "a.", "•", "▪"] {
        assert!(
            text.contains(needle),
            "{needle:?} missing from the PDF text:\n{text}"
        );
    }
    assert!(
        text.matches('•').count() >= 3,
        "expected two outside discs and one inside disc:\n{text}"
    );
}
