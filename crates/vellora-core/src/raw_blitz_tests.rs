//! Tests of the fidelity-only raw-Blitz render ([`crate::debug_render_raw_blitz`]): what it turns
//! off (the walk's reader compensations, the `layout_normalize` passes, the paginator) and what
//! it keeps (Blitz's layout as its painter places it, the gates, the parser choice).

use crate::blitz_engine::{DocumentSyntax, LaidOutDoc, NoObserver, RawBlitz};
use crate::{
    debug_layout_dump, debug_render_raw_blitz, debug_render_xhtml, pagination, render,
    validate_and_lay_out, RenderOptions,
};

/// The raw-Blitz layout ([`debug_render_raw_blitz`]'s): `validate_and_lay_out` with the
/// [`RawBlitz`] observer.
fn raw_layout(html: &str) -> (LaidOutDoc, crate::page_css::PageBox) {
    validate_and_lay_out(
        html.as_bytes(),
        &RenderOptions::default(),
        DocumentSyntax::Html,
        &mut RawBlitz,
    )
    .unwrap_or_else(|e| panic!("lays out: {e}"))
}

/// `(text, origin_x, origin_y)` of every text run of a layout.
fn runs_of(doc: &LaidOutDoc) -> Vec<(String, f64, f64)> {
    doc.boxes
        .iter()
        .flat_map(|b| &b.text_runs)
        .map(|run| {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            (run.text[start..end].to_string(), run.origin_x, run.origin_y)
        })
        .collect()
}

/// Text with every reader compensation (inline padding-right on a left- and a right-aligned
/// line), an anonymous block and a `block_offset` cell, plus an auto-layout table the normalize
/// passes resize (a percentage cell, three compact columns, a painted cell).
const RAW_PROBE: &str = r#"<!DOCTYPE html><html><head><style>
    @page { size: A4; margin: 18mm; }
    body { font-family: sans-serif; font-size: 12px; }
    .label { padding-right: 24px; color: #666; }
    .right { width: 320px; text-align: right; }
    td { border: 1px solid #000; }
    </style></head><body>
    <div>plain text line</div>
    <div><span class="label">LABEL</span><span>VALUE</span></div>
    <div class="right"><span class="label">Numero</span>INV-2026-00417</div>
    <section>lead <b>bold</b><p>para</p></section>
    <table style="width:100%"><tr><td style="width:70%;background:#eee">wide</td>
    <td>a</td><td>b</td><td>c</td></tr></table>
    <table><tr><td style="height:60px;vertical-align:middle">MID</td></tr></table>
    </body></html>"#;

#[test]
fn raw_blitz_layout_is_the_dump_b0_text_and_l0_boxes() {
    let dump = debug_layout_dump(RAW_PROBE.as_bytes(), &RenderOptions::default()).expect("dump");
    let (raw, _) = raw_layout(RAW_PROBE);
    // Text: every run where Blitz's painter puts it (the dump's raw `B0` runs), none of the
    // walk's compensations.
    let runs = runs_of(&raw);
    assert_eq!(runs.len(), dump.blitz_runs.len());
    for (text, x, y) in &runs {
        assert!(
            dump.blitz_runs.iter().any(|b| &b.text == text
                && (b.origin_x - x).abs() < 1e-9
                && (b.origin_y - y).abs() < 1e-9),
            "raw run {text:?} at ({x}, {y}) is not a B0 run: {:?}",
            dump.blitz_runs
        );
    }
    // Boxes: the walk's `L0` layer, before any normalize pass.
    let l0 = &dump.layers[0];
    assert_eq!(l0.name, "L0");
    assert_eq!(raw.boxes.len(), l0.boxes.len());
    for (r, d) in raw.boxes.iter().zip(&l0.boxes) {
        assert_eq!(
            (r.node_id, r.x, r.y, r.width, r.height),
            (d.node_id, d.x, d.y, d.width, d.height)
        );
    }
    // The probe exercises what raw turns off: the passes resize a box, and the product walk
    // moves the padded runs by the 24 px padding (right after it, or left on a right-aligned
    // line), while text without a compensation is where raw has it.
    let last = dump.layers.last().expect("layers");
    assert_ne!(last.name, "L0");
    assert!(l0
        .boxes
        .iter()
        .zip(&last.boxes)
        .any(|(a, b)| a.width != b.width || a.x != b.x));
    let (product, _) = validate_and_lay_out(
        RAW_PROBE.as_bytes(),
        &RenderOptions::default(),
        DocumentSyntax::Html,
        &mut NoObserver,
    )
    .expect("lays out");
    let product_runs = runs_of(&product);
    let moved = |t: &str| {
        let p = product_runs.iter().find(|r| r.0 == t).expect("product run");
        let r = runs.iter().find(|r| r.0 == t).expect("raw run");
        (p.1 - r.1, p.2 - r.2)
    };
    assert_eq!(moved("plain text line"), (0.0, 0.0));
    assert!(
        (moved("VALUE").0 - 24.0).abs() < 1e-9,
        "{:?}",
        moved("VALUE")
    );
    assert!(
        (moved("Numero").0 + 24.0).abs() < 1e-9,
        "{:?}",
        moved("Numero")
    );
}

#[test]
fn raw_blitz_render_equals_the_product_render_without_corrections_or_breaks() {
    // Nothing to correct and one page: the raw render is the product render, byte for byte.
    let html = r#"<!DOCTYPE html><html><head><style>@page { size: 800px 600px; margin: 0 }
        body { font-family: sans-serif; margin: 8px } .box { width: 100px; height: 100px;
        background: green }</style></head><body><p>Test passes if there is a green square.</p>
        <div class="box"></div></body></html>"#;
    let opts = RenderOptions::default();
    let product = render(html.as_bytes(), &opts).expect("renders");
    let raw = debug_render_raw_blitz(html.as_bytes(), &opts, false).expect("raw");
    assert_eq!(product, raw);
    // The XML parse is selectable (here equal to the XHTML render) and deterministic.
    let xhtml = r#"<html xmlns="http://www.w3.org/1999/xhtml"><body><p>a<br/>b</p></body></html>"#;
    let a = debug_render_raw_blitz(xhtml.as_bytes(), &opts, true).expect("raw xml");
    let b = debug_render_raw_blitz(xhtml.as_bytes(), &opts, true).expect("raw xml");
    assert_eq!(a, b);
    assert_eq!(
        a,
        debug_render_xhtml(xhtml.as_bytes(), &opts).expect("xhtml")
    );
    // The same gates: a document the product rejects is rejected raw too.
    let denied = r#"<html><body><iframe src="x"></iframe></body></html>"#;
    assert!(render(denied.as_bytes(), &opts).is_err());
    assert!(debug_render_raw_blitz(denied.as_bytes(), &opts, false).is_err());
}

#[test]
fn flat_pagination_cuts_the_flow_into_page_bands() {
    // Page content box 200 x 100 px. A forced break, a keep-together block and a header margin
    // box: flat pagination honours none of them.
    let html = r#"<!DOCTYPE html><html><head><style>@page { size: 240px 140px; margin: 20px;
        @top-center { content: "HEAD" } } body { margin: 0; font-family: sans-serif;
        font-size: 10px; line-height: 10px } .tall { height: 250px; background: #00f }
        .avoid { break-inside: avoid } .brk { break-before: page }</style></head><body>
        <div class="tall"></div><div class="avoid">first</div>
        <div class="brk">second</div></body></html>"#;
    let (doc, page_box) = raw_layout(html);
    let flat = pagination::paginate_flat(&doc, &page_box);
    // Flow 0..250 blue, "first" on 250..260, "second" on 260..270: three bands of 100 px.
    assert_eq!(flat.pages.len(), 3);
    assert_eq!(flat.report.page_count, 3);
    let blue: Vec<Vec<(f64, f64)>> = flat
        .pages
        .iter()
        .map(|p| {
            p.rects
                .iter()
                .filter(|r| r.color == [0, 0, 255])
                .map(|r| (r.y, r.height))
                .collect()
        })
        .collect();
    // Clipped into each band, page-local (+20 px top margin).
    assert_eq!(
        blue,
        vec![vec![(20.0, 100.0)], vec![(20.0, 100.0)], vec![(20.0, 50.0)]]
    );
    let texts: Vec<Vec<String>> = flat
        .pages
        .iter()
        .map(|p| {
            p.text_runs
                .iter()
                .map(|r| {
                    let start = r.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
                    let end = r.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
                    r.text[start..end].trim().to_string()
                })
                .collect()
        })
        .collect();
    assert_eq!(
        texts,
        vec![
            vec![],
            vec![],
            vec!["first".to_string(), "second".to_string()]
        ]
    );
    assert!(flat.pages.iter().all(|p| p.margin_texts.is_empty()));
    // The product paginator does honour them (the probe is not trivially flat).
    let product = pagination::paginate(&doc, &page_box);
    let product_texts: Vec<usize> = product.pages.iter().map(|p| p.text_runs.len()).collect();
    assert_ne!(product_texts, vec![0, 0, 2], "{product_texts:?}");
    assert!(product.pages.iter().any(|p| !p.margin_texts.is_empty()));
}

#[test]
fn flat_pagination_keeps_same_colour_rects_apart() {
    // Two black stripes 2 px apart (WPT css/CSS2/linebox/line-height-006.xht): the product
    // display list merges them into one 42 px rect (`merge_adjacent_rects`, 4 px tolerance);
    // the raw render keeps Blitz's two boxes.
    let html = r#"<!DOCTYPE html><html><head><style>@page { size: 800px 600px; margin: 0 }
        body { margin: 8px } div { position: relative; width: 20px; height: 96px }
        #a, #b { background: black } #b { position: absolute; left: 22px; top: 0 }</style>
        </head><body><div><div id="a"></div><div id="b"></div></div></body></html>"#;
    let (doc, page_box) = raw_layout(html);
    let black = |pages: &[crate::pdf::PdfPage]| -> Vec<(f64, f64)> {
        pages[0]
            .rects
            .iter()
            .filter(|r| r.color == [0, 0, 0])
            .map(|r| (r.x, r.width))
            .collect()
    };
    assert_eq!(
        black(&pagination::paginate_flat(&doc, &page_box).pages),
        vec![(8.0, 20.0), (30.0, 20.0)]
    );
    assert_eq!(
        black(&pagination::paginate(&doc, &page_box).pages),
        vec![(8.0, 42.0)]
    );
}

#[test]
fn flat_pagination_caps_the_page_count() {
    let html = r#"<!DOCTYPE html><html><head><style>@page { size: 200px 100px; margin: 0 }
        body { margin: 0 }</style></head><body><div style="height: 1000000px"></div>
        <p>end</p></body></html>"#;
    let (doc, page_box) = raw_layout(html);
    let flat = pagination::paginate_flat(&doc, &page_box);
    assert_eq!(flat.pages.len(), 200);
}
