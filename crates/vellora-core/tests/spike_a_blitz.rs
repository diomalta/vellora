//! SPIKE A — prove Blitz drives parse -> Stylo -> Taffy -> Parley and yields a
//! laid-out tree with POSITIONED boxes and shaped text runs.
//!
//! Feasibility gate: if these assertions hold, D1 (reuse Blitz for
//! parse/style/layout/text) and D5 (real Parley glyph runs) are de-risked.

use vellora_core::blitz_engine;

const INVOICE: &str = include_str!("fixtures/invoice.html");

#[test]
fn small_html_lays_out_with_positioned_boxes() {
    let html = r#"<!DOCTYPE html><html><head><style>
        body { margin: 0; }
        .box { width: 200px; height: 80px; background: #eee; }
        p { font-size: 16px; color: #102030; }
    </style></head><body>
        <div class="box">Hello</div>
        <p>The quick brown fox jumps over the lazy dog.</p>
    </body></html>"#;

    let doc = blitz_engine::lay_out(html);

    assert!(!doc.boxes.is_empty(), "expected a non-empty layout tree");

    let boxdiv = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("div"))
        .expect("div box present");
    assert!(
        (boxdiv.width - 200.0).abs() < 1.0,
        "div width should be ~200px, got {}",
        boxdiv.width
    );
    assert!(
        (boxdiv.height - 80.0).abs() < 1.0,
        "div height should be ~80px, got {}",
        boxdiv.height
    );

    let para = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("p"))
        .expect("p box present");
    assert!(
        para.y >= 80.0,
        "paragraph should be below the 80px box, y = {}",
        para.y
    );
    assert!(para.width > 0.0 && para.height > 0.0, "p has real size");

    // F6: the declared `color: #102030` must reach the shaped run. A positive
    // color assertion catches a Stylo-access-path regression that would silently
    // drop computed styles and fall back to black `[0,0,0]` (brush_color).
    let para_run = para
        .text_runs
        .iter()
        .find(|r| r.text.contains("quick brown fox"))
        .expect("paragraph text run present");
    assert_eq!(
        para_run.color,
        [0x10, 0x20, 0x30],
        "p run color must be the declared #102030, not a silent black fallback"
    );
}

#[test]
fn text_runs_carry_glyphs_font_and_position() {
    let html = r#"<!DOCTYPE html><html><body style="margin:0">
        <p style="font-size:20px">Selectable text run</p>
    </body></html>"#;

    let doc = blitz_engine::lay_out(html);

    let runs: Vec<_> = doc.boxes.iter().flat_map(|b| b.text_runs.iter()).collect();
    assert!(!runs.is_empty(), "expected at least one shaped text run");

    let run = runs
        .iter()
        .find(|r| r.text.contains("Selectable"))
        .expect("our text run is present");

    assert!(!run.glyphs.is_empty(), "run must carry glyphs");
    assert!(!run.font_data.is_empty(), "run must carry raw font bytes");
    assert!(run.font_size > 0.0, "run must carry a font size");

    assert!(
        run.origin_x.is_finite() && run.origin_y.is_finite(),
        "run origin must be finite"
    );
    assert!(run.origin_y > 0.0, "baseline should be below the top edge");

    let total_advance: f32 = run.glyphs.iter().map(|g| g.advance).sum();
    assert!(total_advance > 0.0, "glyph advances must sum to > 0");

    // Cluster byte-ranges map back into the source text (ToUnicode basis).
    for g in &run.glyphs {
        assert!(
            g.text_end <= run.text.len() && g.text_start <= g.text_end,
            "glyph cluster byte-range must be valid within the source text"
        );
    }
}

#[test]
fn invoice_fixture_lays_out_fully() {
    let doc = blitz_engine::lay_out(INVOICE);

    assert!(
        doc.boxes.len() > 100,
        "invoice should produce many boxes, got {}",
        doc.boxes.len()
    );

    assert!(
        doc.content_height > blitz_engine::A4_HEIGHT_PX,
        "invoice content height ({}) should exceed one A4 page ({})",
        doc.content_height,
        blitz_engine::A4_HEIGHT_PX
    );

    let tables: Vec<_> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("table"))
        .collect();
    assert!(tables.len() >= 3, "header, parties, items, totals tables");

    // thead rows lay out (basis for fragmentation header repeat).
    let theads: Vec<_> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("thead"))
        .collect();
    assert!(!theads.is_empty(), "items table has a <thead>");

    let all_text: String = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .map(|r| r.text.as_str())
        .collect::<Vec<_>>()
        .join(" ");
    assert!(
        all_text.contains("SKU WX-A20") || all_text.contains("SKU FS-M8"),
        "line-item rows should be shaped as text"
    );
    assert!(
        all_text.contains("R$"),
        "money cells should be shaped as text"
    );
    assert!(
        all_text.contains("pagar"),
        "totals labels should be shaped as text"
    );
}

#[test]
fn layout_is_deterministic() {
    let a = blitz_engine::lay_out(INVOICE);
    let b = blitz_engine::lay_out(INVOICE);
    assert_eq!(a.boxes.len(), b.boxes.len(), "same number of boxes");
    for (x, y) in a.boxes.iter().zip(b.boxes.iter()) {
        assert_eq!(x.node_id, y.node_id);
        assert!((x.x - y.x).abs() < 1e-6, "x stable");
        assert!((x.y - y.y).abs() < 1e-6, "y stable");
        assert!((x.width - y.width).abs() < 1e-6, "width stable");
        assert!((x.height - y.height).abs() < 1e-6, "height stable");
    }
}
