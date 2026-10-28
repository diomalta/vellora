//! Percentage cells of auto-layout tables (`layout_normalize::normalize_table_percent_widths`)
//! against Chrome, port step 10-spark: a NESTED table's cells are adjusted too, a row whose
//! percentages sum to exactly 100% is adjusted, and a block exactly as wide as its cell (the
//! `oss-postmark-receipt` shape, `<td width="80%"><p style="text-align: right">Total</p></td>`)
//! resizes with it, so its right-aligned text ends where Chrome's does.
//!
//! Expected numbers: Chrome 155.0.8059.85 (local macOS, INDICATIVE; 2026-10-22), the fidelity
//! reference setup (print media, bundled faces), at the 657 px viewport vellora handed Blitz for
//! A4 minus 2 x 18 mm until Phase C step 03 (now 658 px, Chrome's print width; see
//! `assert_like_chrome`): cell boxes and the text's `Range.getClientRects()`. Probe and raw numbers:
//! `fidelity/gate/snapshots/2026-10-22/10-spark/chrome-pct-cells.{mjs,json}`.

use vellora_core::{blitz_engine, page_css};

fn probe(body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>\n@page {{ size: A4; margin: 18mm; }}\n\
         body {{ margin: 8px; font: 16px/20px \"Liberation Sans\"; color: #000; }}\n\
         table {{ width: 100%; }} p {{ margin: 0; }} .r {{ text-align: right; }}\n\
         </style></head><body>{body}</body></html>"
    )
}

const ROWS: &str = "<tr><td width=\"80%\"><p class=\"r\">Total</p></td>\
                    <td width=\"20%\"><p class=\"r\">$81.00</p></td></tr>\
                    <tr><td width=\"80%\"><span>Item</span></td>\
                    <td width=\"20%\" class=\"r\"><span>$9.00</span></td></tr>";

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

/// (left, right) of the run whose trimmed text is `text`.
fn run_span(doc: &blitz_engine::LaidOutDoc, text: &str) -> (f64, f64) {
    let run = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|r| {
            let s = r.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let e = r.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            r.text.get(s..e).map(str::trim) == Some(text)
        })
        .unwrap_or_else(|| panic!("no run {text:?}"));
    let w: f64 = run.glyphs.iter().map(|g| g.advance as f64).sum();
    (run.origin_x, run.origin_x + w)
}

fn assert_like_chrome(html: &str) {
    let doc = lay_out(html);
    // Chrome: the 80% cell is 8..521.6 and the 20% cell 521.6..650 in both rows; "Total"
    // ends at 521.6, "$81.00" and "$9.00" at 650, "Item" starts at 8. Phase C step 03: Chrome's
    // print PDF (155.0.8059.85, 68 px origin) has "Total" ending at 589.59, "$81.00" at 717.99,
    // "Item" starting at 76.0, i.e. the 658 px layout width (`PageBox::layout_content_width`);
    // the former 520.797 / 649 were a DOM at the 657 px viewport vellora then used.
    for (text, right) in [("Total", 521.6), ("$81.00", 650.0), ("$9.00", 650.0)] {
        let got = run_span(&doc, text).1;
        assert!(
            (got - right).abs() <= 0.6,
            "{text} ends at {got}, Chrome {right}"
        );
    }
    let item = run_span(&doc, "Item").0;
    assert!((item - 8.0).abs() <= 0.6, "Item starts at {item}");
}

#[test]
fn percent_cells_of_a_top_level_table_summing_to_100_percent() {
    assert_like_chrome(&probe(&format!(
        "<table cellspacing=\"0\" cellpadding=\"0\">{ROWS}</table>"
    )));
}

#[test]
fn percent_cells_of_a_nested_table() {
    assert_like_chrome(&probe(&format!(
        "<table cellspacing=\"0\" cellpadding=\"0\"><tr><td>\
         <table cellspacing=\"0\" cellpadding=\"0\">{ROWS}</table></td></tr></table>"
    )));
}
