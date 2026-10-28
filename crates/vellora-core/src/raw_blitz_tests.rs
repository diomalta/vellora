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
    // The XML parse is selectable (here equal to the XHTML render) and deterministic. A zero
    // page margin: the product snaps text baselines to whole page px
    // (`pagination::snap_baseline_to_page_px`), which a fractional default margin would move.
    let xhtml = r#"<html xmlns="http://www.w3.org/1999/xhtml"><head><style>@page { margin: 0 }</style></head><body><p>a<br/>b</p></body></html>"#;
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
    // Two black stripes 2 px apart (WPT css/CSS2/linebox/line-height-006.xht): both renders keep
    // Blitz's two boxes, as Chrome paints them. Until port step 10-rects the product display list
    // merged them into one 42 px rect (`merge_adjacent_rects`, then a 4 px gap tolerance).
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
        vec![(8.0, 20.0), (30.0, 20.0)]
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

// ---------------------------------------------------------------------------------------------
// The collapsed-border compensation (`blitz_engine::compensate_collapsed_borders`) and its
// canary. Variants of `fidelity/upstream-drafts/blitz-collapsed-cell-border-measure/variants.mjs`;
// Chrome numbers from its `results/summary.txt` (Chrome for Testing 155.0.8059.85, print media,
// 2026-10-27).
// ---------------------------------------------------------------------------------------------

/// One repro variant: a 400 px table of `rows` rows x 2 cells (`td { padding: 8px }`, 20 px
/// lines, so 36 px of cell content box), extra CSS `css`, then a block after it.
fn collapse_variant(css: &str, rows: usize) -> String {
    let body: String = (0..rows)
        .map(|i| format!("<tr><td>a{i}</td><td>b{i}</td></tr>"))
        .collect();
    format!(
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><style>\
         @page {{ size: A4; margin: 16mm; }} body {{ margin: 0; font-family: \"Liberation Serif\"; \
         font-size: 10pt; line-height: 20px; }} table {{ width: 400px; }} td {{ padding: 8px; }} \
         {css}</style></head><body><table><tbody>{body}</tbody></table><div>after</div></body></html>"
    )
}

/// `(table y, table height, [first-column cell (y, height)], y of the block after the table)`.
fn table_geometry(doc: &LaidOutDoc) -> (f64, f64, Vec<(f64, f64)>, f64) {
    let table = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table box");
    let cells: Vec<(f64, f64)> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .step_by(2)
        .map(|b| (b.y, b.height))
        .collect();
    let after = doc
        .boxes
        .iter()
        .rfind(|b| b.tag.as_deref() == Some("div"))
        .expect("after box");
    (table.y, table.height, cells, after.y)
}

fn product_layout(html: &str) -> LaidOutDoc {
    validate_and_lay_out(
        html.as_bytes(),
        &RenderOptions::default(),
        DocumentSyntax::Html,
        &mut NoObserver,
    )
    .unwrap_or_else(|e| panic!("lays out: {e}"))
    .0
}

/// CANARY of the collapsed-border compensation: raw Blitz still lays the `collapse_b1` repro
/// out 118 px tall (cells at y 1 / 40 / 79, 38 tall) where Chrome 155 makes it 112 px (cells at
/// 0.5 / 37.5 / 74.5, 37 tall). When this fails, Blitz has changed its collapsed-border layout:
/// the compensation now distorts tables instead of correcting them and must be deleted.
#[test]
fn blitz_still_lays_collapsed_rows_out_two_borders_too_tall() {
    let html = collapse_variant(
        "table{border-collapse:collapse} td{border:1px solid #000}",
        3,
    );
    let (raw, _) = raw_layout(&html);
    let geometry = table_geometry(&raw);
    assert_eq!(
        geometry,
        (
            0.0,
            118.0,
            vec![(1.0, 38.0), (40.0, 38.0), (79.0, 38.0)],
            118.0
        ),
        "\n\nBLITZ CHANGED ITS `border-collapse: collapse` LAYOUT. Raw Blitz no longer lays the \
         collapse_b1 repro out 118 px tall (cells at y 1 / 40 / 79, 38 tall; Chrome 155: 112 px, \
         cells at 0.5 / 37.5 / 74.5, 37 tall), the bug the collapsed-border compensation works \
         around (blitz-dom 0.3.0-beta.4 src/layout/table.rs 638-642, 814-822, 369-411). If Blitz \
         now matches Chrome, DELETE the compensation: in crates/vellora-core/src/blitz_engine.rs \
         `compensate_collapsed_borders`, `CollapsedBorders`, `collapsed_table_grid`, \
         `collect_table_part`, `GridCollect`, `edge_borders`, `edge_style`, `set_border_widths`, \
         `mutate_primary_style`, `TableColumnCursor`, `CompensatedCell`, `collapsed_row_lines`, \
         the `collapsed` field of `WalkSink` and its uses in `push_box` / `read_visuals`, the \
         `resolve_stylist` + compensation call in `resolve_and_walk`; the module \
         src/collapsed_borders.rs (and its `mod` line in lib.rs); the `collapsed` straddle \
         handling of `adjust_visual_inline_geometry` in src/layout_normalize.rs; this canary and \
         the `collapsed_border_compensation_*` tests in src/raw_blitz_tests.rs. \
         `cell_height_as_minimum` is called from the compensation: if its canary \
         `blitz_still_fixes_a_cell_to_its_specified_height` still passes, keep that correction. \
         Then re-measure with fidelity/layout-diff before trusting either layout.\n"
    );
}

/// The compensation against Chrome 155 on every repro variant: table height, first-column
/// cells' y / height (Chrome's are fractional 0.5 px halves; vellora's boxes are Taffy-rounded,
/// so within 0.5 px, never accumulating), and the block after the table (exact).
#[test]
fn collapsed_border_compensation_gives_chromes_rows() {
    let b1 = "table{border-collapse:collapse} td{border:1px solid #000}";
    let rows3 = |ys: [f64; 3], h: [f64; 3]| vec![(ys[0], h[0]), (ys[1], h[1]), (ys[2], h[2])];
    // (variant, css, rows, Chrome table height, Chrome first-column cell (y, h) per row).
    type Case = (&'static str, String, usize, f64, Vec<(f64, f64)>);
    let cases: Vec<Case> = vec![
        (
            "collapse_b1",
            b1.into(),
            3,
            112.0,
            rows3([0.5, 37.5, 74.5], [37.0; 3]),
        ),
        (
            "collapse_b1_10rows",
            b1.into(),
            10,
            371.0,
            (0..10).map(|i| (0.5 + 37.0 * i as f64, 37.0)).collect(),
        ),
        (
            "collapse_b0",
            "table{border-collapse:collapse} td{border:0}".into(),
            3,
            108.0,
            rows3([0.0, 36.0, 72.0], [36.0; 3]),
        ),
        (
            "collapse_b2",
            "table{border-collapse:collapse} td{border:2px solid #000}".into(),
            3,
            116.0,
            rows3([1.0, 39.0, 77.0], [38.0; 3]),
        ),
        (
            "collapse_b05",
            "table{border-collapse:collapse} td{border:0.5px solid #000}".into(),
            3,
            112.0,
            rows3([0.5, 37.5, 74.5], [37.0; 3]),
        ),
        (
            "collapse_b1_tbonly",
            "table{border-collapse:collapse} \
             td{border-top:1px solid #000;border-bottom:1px solid #000}"
                .into(),
            3,
            112.0,
            rows3([0.5, 37.5, 74.5], [37.0; 3]),
        ),
        (
            "collapse_first_cell_borderless",
            format!("{b1} tr:first-child td:first-child{{border:0}}"),
            3,
            112.0,
            rows3([0.5, 37.5, 74.5], [37.0; 3]),
        ),
        (
            "collapse_table_border2_cells_none",
            "table{border-collapse:collapse;border-bottom:2px solid #000} td{border:0}".into(),
            3,
            110.0,
            rows3([0.0, 36.0, 72.0], [36.0, 36.0, 37.0]),
        ),
        (
            "collapse_b1_tr_height48",
            format!("{b1} tr{{height:48px}}"),
            3,
            145.0,
            rows3([0.5, 48.5, 96.5], [48.0; 3]),
        ),
        (
            "collapse_b1_lronly",
            "table{border-collapse:collapse} \
             td{border-left:1px solid #000;border-right:1px solid #000}"
                .into(),
            3,
            108.0,
            rows3([0.0, 36.0, 72.0], [36.0; 3]),
        ),
        (
            "separate_s0_b1",
            "table{border-collapse:separate;border-spacing:0} td{border:1px solid #000}".into(),
            3,
            114.0,
            rows3([0.0, 38.0, 76.0], [38.0; 3]),
        ),
    ];
    for (name, css, rows, chrome_height, chrome_cells) in &cases {
        let doc = product_layout(&collapse_variant(css, *rows));
        let (table_y, height, cells, after) = table_geometry(&doc);
        assert_eq!((table_y, height), (0.0, *chrome_height), "{name}: table");
        assert_eq!(after, *chrome_height, "{name}: block after the table");
        assert_eq!(cells.len(), chrome_cells.len(), "{name}");
        for (i, ((y, h), (cy, ch))) in cells.iter().zip(chrome_cells).enumerate() {
            assert!(
                (y - cy).abs() <= 0.5 && (y + h - (cy + ch)).abs() <= 0.5,
                "{name} row {i}: vellora {y}/{h}, Chrome {cy}/{ch}"
            );
        }
    }
}

/// The compensated table paints each resolved edge once, full width, centred on the grid line:
/// `collapse_b1` gets 4 horizontal 1 px lines (y 0..1, 37..38, 74..75, 111..112 in Chrome's
/// geometry; vellora's sit on the rounded cell boxes, within 0.5 px), one per column each, and
/// 3 vertical ones per row, and the table paints no border of its own.
#[test]
fn collapsed_border_compensation_paints_each_edge_once() {
    let html = collapse_variant(
        "table{border-collapse:collapse} td{border:1px solid #000}",
        3,
    );
    let doc = product_layout(&html);
    let rects: Vec<&crate::blitz_engine::VisualRect> = doc
        .boxes
        .iter()
        .flat_map(|b| &b.visual_rects)
        .filter(|r| r.color == [0, 0, 0])
        .collect();
    let mut horizontal: Vec<f64> = rects
        .iter()
        .filter(|r| r.height == 1.0 && r.width > 1.0)
        .map(|r| r.y)
        .collect();
    let vertical = rects
        .iter()
        .filter(|r| r.width == 1.0 && r.height > 1.0)
        .count();
    assert_eq!(horizontal.len(), 8, "{rects:?}");
    assert_eq!(vertical, 9, "{rects:?}");
    horizontal.sort_by(f64::total_cmp);
    horizontal.dedup();
    assert_eq!(horizontal.len(), 4, "{rects:?}");
    for (line, chrome) in horizontal.iter().zip([0.0, 37.0, 74.0, 111.0]) {
        assert!(
            (line - chrome).abs() <= 0.5,
            "row line at {line}, Chrome {chrome}"
        );
    }
    let table = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table");
    assert!(table.visual_rects.is_empty());
    assert!(
        table.table_border_collapse,
        "the authored border-collapse is reported"
    );
}

/// An RTL collapsed table: the grid is resolved in logical columns, so the physical outer right
/// edge (the first column's) is painted, and every edge once (WPT
/// `css-tables/row-margin-border-padding.html`, which lost its pass when the right edge was
/// never painted).
#[test]
fn collapsed_border_compensation_paints_rtl_tables_on_both_outer_edges() {
    let ltr = collapse_variant(
        "table{border-collapse:collapse} td{border:2px solid #000}",
        2,
    );
    let rtl = ltr.replace("<table>", "<table dir=\"rtl\">");
    let verticals = |html: &str| -> Vec<f64> {
        let doc = product_layout(html);
        let mut xs: Vec<f64> = doc
            .boxes
            .iter()
            .flat_map(|b| &b.visual_rects)
            .filter(|r| r.color == [0, 0, 0] && r.width == 2.0 && r.height > 2.0)
            .map(|r| r.x)
            .collect();
        xs.sort_by(f64::total_cmp);
        xs
    };
    let (l, r) = (verticals(&ltr), verticals(&rtl));
    // 3 vertical lines (left, middle, right) x 2 rows in both directions, the outer ones at the
    // same x (the middle one follows the mirrored columns' widths).
    assert_eq!(l.len(), 6, "{l:?}");
    assert_eq!(r.len(), 6, "{r:?}");
    assert_eq!(
        (l[0], l[1], l[4], l[5]),
        (r[0], r[1], r[4], r[5]),
        "ltr {l:?} vs rtl {r:?}"
    );
}

/// Cells with a specified `height` are not stretched to their row by Blitz (Chrome's always
/// span it): the bottom edge is still painted on the row's bottom line, one unbroken line (WPT
/// `css-tables/height-distribution/td-different-subpixel-padding-in-same-row.html`).
#[test]
fn collapsed_border_compensation_paints_on_the_row_lines_not_the_cell_boxes() {
    let html = "<!DOCTYPE html><html><head><style>@page { size: A4; margin: 0 } \
        td { width: 20px; height: 20px } table { border: 2px solid #000; \
        border-collapse: collapse }</style></head><body><table><tr>\
        <td style=\"padding: 1px 2px\"></td><td style=\"padding: 2px\"></td>\
        <td style=\"padding: 3px 2px\"></td></tr></table></body></html>";
    let doc = product_layout(html);
    let table = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table");
    let bottoms: Vec<f64> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .flat_map(|b| &b.visual_rects)
        .filter(|r| r.height == 2.0 && r.width > 2.0 && r.y > table.y + 2.0)
        .map(|r| r.y + r.height)
        .collect();
    assert_eq!(bottoms.len(), 3, "{bottoms:?}");
    assert!(
        bottoms
            .iter()
            .all(|b| (b - (table.y + table.height)).abs() < 1e-9),
        "every cell's bottom edge ends on the table's bottom: {bottoms:?}, table {} + {}",
        table.y,
        table.height
    );
}

/// The cell-height repro of `blitz_engine::cell_height_as_minimum`: a 3-line cell
/// (`line-height: 20px`) with `height: 30px; padding: 2px` (border-box). Chrome 155 (CfT
/// 155.0.8059.85, print media, 2026-10-27): table, cells and row 64 px.
fn cell_height_repro(collapse: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 0 }} * {{ box-sizing: \
         border-box }} body {{ margin: 0; font-family: \"Liberation Serif\"; font-size: 10pt; \
         line-height: 20px }} table {{ width: 400px; border-collapse: {collapse}; border-spacing: \
         0 }} td {{ height: 30px; padding: 2px; vertical-align: top }}</style></head><body><table>\
         <tr><td>line one<br>line two<br>line three</td><td>x</td></tr></table><div>after</div>\
         </body></html>"
    )
}

/// CANARY of `blitz_engine::cell_height_as_minimum`: raw Blitz still lays the cell-height repro
/// out 30 px tall (its specified height) where Chrome 155 grows it to its 64 px of content.
#[test]
fn blitz_still_fixes_a_cell_to_its_specified_height() {
    let (raw, _) = raw_layout(&cell_height_repro("separate"));
    let (_, height, cells, after) = table_geometry(&raw);
    assert_eq!(
        (height, cells, after),
        (30.0, vec![(0.0, 30.0)], 30.0),
        "\n\nBLITZ CHANGED HOW IT SIZES A TABLE CELL WITH A SPECIFIED `height`: raw Blitz no longer \
         lays the repro cell out at its 30 px height (Chrome 155: 64 px, the cell grows with its \
         content; blitz-dom 0.3.0-beta.4 src/layout/table.rs 722-728 kept the height as a fixed \
         size). If Blitz now matches Chrome, DELETE `cell_height_as_minimum` and its call in \
         `compensate_collapsed_borders` (crates/vellora-core/src/blitz_engine.rs), this canary and \
         `collapsed_border_compensation_grows_a_cell_past_its_specified_height`, then re-measure \
         with fidelity/layout-diff.\n"
    );
}

/// The correction against Chrome on the repro, in a collapsed table (the scope of the
/// correction), cells with a 1 px border: Chrome 155 table 66 px (cells at 0.5, 65 tall; the
/// block after at 66; same Chrome and date as above).
#[test]
fn collapsed_border_compensation_grows_a_cell_past_its_specified_height() {
    let html = cell_height_repro("collapse").replace(
        "vertical-align: top",
        "vertical-align: top; border: 1px solid #000",
    );
    let doc = product_layout(&html);
    let (_, height, _, after) = table_geometry(&doc);
    assert_eq!((height, after), (66.0, 66.0));
}

/// The LayoutUnit repro of `blitz_engine::snap_lengths_to_layout_unit`: 64 blocks with `block`
/// as their style, each holding a 10 px box (when `inner`) or the text "Ab", then a `<section>`
/// marker. 64 makes a 1/64 px difference per block a whole px at the marker, so the
/// Taffy-rounded boxes show it.
fn layout_unit_repro(block: &str, inner: bool) -> String {
    let child = if inner {
        "<div style=\"height:10px\"></div>"
    } else {
        "Ab"
    };
    let blocks: String = (0..64)
        .map(|_| format!("<div style=\"{block}\">{child}</div>"))
        .collect();
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 0 }} body {{ margin: 0; \
         font-family: \"Liberation Sans\"; font-size: 10pt }}</style></head><body>{blocks}\
         <section>end</section></body></html>"
    )
}

fn section_y(doc: &LaidOutDoc) -> f64 {
    doc.boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("section"))
        .expect("section box")
        .y
}

/// CANARY of the LayoutUnit snapping: raw Blitz still lays `padding: 1mm 0` out unquantised
/// (17.5591 px a block: the marker after 64 blocks at round(1123.78) = 1124) where Chrome 155
/// truncates 1mm to 3.765625 px (17.53125 a block, marker at 1122). When this fails, Blitz
/// quantises lengths itself and the snapping is applied on top of it.
#[test]
fn blitz_still_lays_lengths_out_unquantised() {
    let (raw, _) = raw_layout(&layout_unit_repro("padding:1mm 0", true));
    assert_eq!(
        section_y(&raw),
        1124.0,
        "\n\nBLITZ CHANGED HOW IT RESOLVES LENGTHS: raw Blitz no longer lays 64 blocks of \
         `padding: 1mm 0` around 10 px out at 64 x 17.5591 px (marker at 1124). Chrome 155 lays \
         them out at 64 x 17.53125 = 1122 (1mm truncated to 1/64 px, LayoutUnit). If Blitz now \
         quantises lengths like Chrome, DELETE the LayoutUnit snapping: in \
         crates/vellora-core/src/blitz_engine.rs `snap_lengths_to_layout_unit`, \
         `snap_computed_lengths`, `snap_lp` and its call in `resolve_and_walk`; the module \
         src/layout_unit.rs (and its `mod` line in lib.rs); this canary and the \
         `layout_unit_snapping_*` tests in src/raw_blitz_tests.rs. Then re-measure with \
         fidelity/layout-diff and the repro set fidelity/gate/snapshots/2026-10-27/c03/layoutunit/lu-repro.\n"
    );
}

/// The snapping against Chrome 155 (CfT 155.0.8059.85, print media, 2026-10-27; repro set
/// fidelity/gate/snapshots/2026-10-27/c03/layoutunit/lu-repro): the marker after 64 blocks is at 64 x
/// Chrome's per-block height, a whole px here; raw Blitz's marker for contrast.
#[test]
fn layout_unit_snapping_gives_chromes_lengths() {
    // (block style, has a 10 px child, Chrome's block pitch, raw Blitz's marker y)
    let cases: [(&str, bool, f64, f64); 5] = [
        ("padding:1mm 0", true, 17.53125, 1124.0),
        ("font-size:8.5pt;line-height:1.35", false, 15.28125, 979.0),
        ("height:20px;margin-bottom:-1mm", false, 16.234375, 1038.0),
        ("height:10.1mm", false, 38.171875, 2443.0),
        ("font-size:11.34px;line-height:1.35", false, 15.3125, 980.0),
    ];
    for (block, inner, pitch, raw_y) in cases {
        let html = layout_unit_repro(block, inner);
        let product = section_y(&product_layout(&html));
        assert_eq!(product, 64.0 * pitch, "{block}: product marker");
        let (raw, _) = raw_layout(&html);
        assert_eq!(section_y(&raw), raw_y, "{block}: raw Blitz marker");
    }
}

/// text-stress-ptbr's `table.extrato` row (`padding: 1mm 1.5mm`, 8.5pt x 1.35, a 0.2mm bottom
/// border, collapsed): Chrome 155 rows 23.8125 px apart, a 10-row table 238.125 px (raw Blitz
/// 0.3.0-beta.4 with the collapsed-border compensation: 238.5202); 64 rows end at 64 x 23.8125
/// = 1524.
#[test]
fn layout_unit_snapping_gives_chromes_extrato_row_pitch() {
    let rows: String = (0..64).map(|i| format!("<tr><td>R{i}</td></tr>")).collect();
    let html = format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 0 }} body {{ margin: 0; \
         font-family: \"Liberation Sans\"; font-size: 10pt }} table {{ width: 100%; \
         border-collapse: collapse; table-layout: fixed; font-size: 8.5pt; line-height: 1.35 }} \
         td {{ border-bottom: 0.2mm solid #ccc; padding: 1mm 1.5mm; vertical-align: top }}\
         </style></head><body><table>{rows}</table><section>end</section></body></html>"
    );
    assert_eq!(section_y(&product_layout(&html)), 1524.0);
}

/// `border-spacing: 1.5mm` is 5 whole px in Chrome 155 (cells at y 5 / 25 / 45 with 15 px rows;
/// Blitz keeps a separated cell's `height: 10px` fixed, so its rows are 10 px: the cell-height
/// bug, outside the snapping's scope); the spacing itself must be 5.
#[test]
fn layout_unit_snapping_truncates_border_spacing_to_whole_px() {
    let html = "<!DOCTYPE html><html><head><style>@page { size: A4; margin: 0 } body { margin: 0; \
         font-family: \"Liberation Sans\"; font-size: 10pt } table { border-spacing: 1.5mm } td { \
         padding: 0; height: 10px }</style></head><body><table><tr><td>a</td></tr><tr><td>b</td>\
         </tr><tr><td>c</td></tr></table></body></html>";
    let doc = product_layout(html);
    let ys: Vec<f64> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .map(|b| b.y)
        .collect();
    assert_eq!(ys, vec![5.0, 20.0, 35.0]);
}

/// The auto-table excess repro of `layout_normalize::normalize_auto_table_compact_columns`: a
/// `width: 100%` auto-layout table of four auto columns on A4 at 18 mm (layout width 658 px).
/// Chrome 155 (CfT 155.0.8059.85, print media, 2026-10-27): max-content 233.422 / 34.828 /
/// 39.266 / 92.641 px (the table at `width: max-content`, 400.156 px), columns 383.828 / 57.266
/// / 64.563 / 152.344 = each times 658 / 400.156; its PDF starts "40" at 461.828 - 68 = 393.83.
const AUTO_TABLE_EXCESS: &str = "<!DOCTYPE html><html><head><style>@page { size: A4; margin: \
    18mm } body { margin: 0; font-family: \"Liberation Sans\"; font-size: 10pt } table { width: \
    100%; border-spacing: 0 } td { padding: 4px 10px }</style></head><body><table><tr><td>Suporte \
    de fixacao em aluminio A20</td><td>40</td><td>UN</td><td>R$ 1.300,00</td></tr></table>\
    </body></html>";

fn cell_widths(doc: &LaidOutDoc) -> Vec<f64> {
    let mut cells: Vec<_> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .collect();
    cells.sort_by(|a, b| a.x.total_cmp(&b.x));
    cells.iter().map(|b| b.width).collect()
}

/// CANARY of `layout_normalize::normalize_auto_table_compact_columns`: raw Blitz still gives
/// every auto column of [`AUTO_TABLE_EXCESS`] an equal share of the spare width (each column
/// its max-content width plus the same ~64.5 px) where Chrome 155 shares it in proportion to
/// max-content (383.828 / 57.266 / 64.563 / 152.344).
#[test]
fn blitz_still_shares_auto_table_excess_width_equally() {
    let (raw, _) = raw_layout(AUTO_TABLE_EXCESS);
    assert_eq!(
        cell_widths(&raw),
        vec![298.0, 99.0, 104.0, 157.0],
        "\n\nBLITZ CHANGED ITS AUTO TABLE COLUMN DISTRIBUTION. Raw Blitz no longer lays the \
         AUTO_TABLE_EXCESS repro out at 298 / 99 / 104 / 157 px (an equal share of the spare \
         width per auto column; Chrome 155: 383.828 / 57.266 / 64.563 / 152.344, in proportion \
         to max-content), the bug normalize_auto_table_compact_columns works around (blitz-dom \
         0.3.0-beta.4 src/layout/table.rs 249-255 and 293-297 make every column an `auto` \
         track; taffy 0.15.0 src/compute/grid/track_sizing.rs 1415-1442 stretches auto tracks \
         equally). If Blitz now matches Chrome, DELETE the compensation: in \
         crates/vellora-core/src/layout_normalize.rs `normalize_auto_table_compact_columns` and \
         `distribute_auto_table_excess` (and the `auto_table_compact_columns` entry of \
         `LAYOUT_NORMALIZE_PASSES` in src/blitz_engine.rs); in src/blitz_engine.rs \
         `LaidOutBox::max_content_width`, `cell_max_content_width`, `block_max_content_width`; \
         this canary and `auto_table_compensation_gives_chromes_columns`. Keep the Chrome-number \
         tests in tests/layout_fidelity.rs: they must then pass on Blitz's own layout. Then \
         re-measure with fidelity/layout-diff before trusting either layout.\n"
    );
}

/// The compensation against Chrome 155 on [`AUTO_TABLE_EXCESS`]: every column within 0.5 px.
#[test]
fn auto_table_compensation_gives_chromes_columns() {
    let widths = cell_widths(&product_layout(AUTO_TABLE_EXCESS));
    let chrome = [383.828, 57.266, 64.563, 152.344];
    assert!(
        widths
            .iter()
            .zip(chrome)
            .all(|(got, want)| (got - want).abs() <= 0.5),
        "vellora {widths:?}, Chrome {chrome:?}"
    );
}

/// WPT css/CSS2/floats/floats-wrap-bfc-003-left-table.xht without its XHTML wrapper: a 300 px
/// cell holding a 100x100 left float, then a table (a formatting-context root) whose content is
/// a 250 px inline-block, which does not fit beside the float.
const BFC_TABLE_BESIDE_FLOAT: &str = r#"<!DOCTYPE html><html><head><style>
    table { margin: 0; border-spacing: 0; } td { padding: 0; }
    span { display: inline-block; vertical-align: bottom; }
    </style></head><body>
    <table width="300" style="background: aqua"><tbody><tr><td>
    <div style="float:left; background:blue; width: 100px; height: 100px"></div>
    <table style="background: yellow"><tbody><tr><td>
    <span style="width: 250px; height: 50px; background: purple"></span>
    </td></tr></tbody></table>
    </td></tr></tbody></table></body></html>"#;

/// `(x, y)` of the inner table relative to the outer one, and the outer table's height.
fn bfc_table_geometry(doc: &LaidOutDoc) -> (f64, f64, f64) {
    let tables: Vec<_> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("table"))
        .collect();
    let (outer, inner) = (tables[0], tables[1]);
    (inner.x - outer.x, inner.y - outer.y, outer.height)
}

/// CANARY of the first half of `blitz_engine::float_avoidance_fixups`: raw Blitz (Taffy 0.15.0)
/// still lays the table of [`BFC_TABLE_BESIDE_FLOAT`] out beside the float, at (100, 0) in a
/// 100 px tall outer table, where Chrome 155 moves it below the float, (0, 100) in a 150 px one.
#[test]
fn blitz_still_overlaps_a_wide_table_with_a_float() {
    let (raw, _) = raw_layout(BFC_TABLE_BESIDE_FLOAT);
    assert_eq!(
        bfc_table_geometry(&raw),
        (100.0, 0.0, 100.0),
        "\n\nTAFFY CHANGED HOW IT FITS A FORMATTING-CONTEXT ROOT BESIDE A FLOAT. Raw Blitz no \
         longer puts the BFC_TABLE_BESIDE_FLOAT table at (100, 0) beside the float in a 100 px \
         outer table (Chrome 155: (0, 100), 150 px), the bug float_avoidance_fixups works \
         around (taffy 0.15.0 src/compute/block.rs 1297-1309 tests an auto-width box against \
         the slot's own stretch width, so the first slot always fits). If Blitz now matches \
         Chrome, DELETE in crates/vellora-core/src/blitz_engine.rs the BFC half of \
         `float_avoidance_fixups` (`bfc_roots`, `BfcRootBox`, `FloatFixup::Clear`), this canary \
         and `float_avoidance_moves_a_wide_table_below_the_float`; with the other half gone too, \
         also the second `resolve` in `resolve_and_walk`. Then re-measure css/CSS2/floats with \
         fidelity/wpt before trusting either layout.\n"
    );
}

/// The compensation against Chrome 155 on [`BFC_TABLE_BESIDE_FLOAT`].
#[test]
fn float_avoidance_moves_a_wide_table_below_the_float() {
    assert_eq!(
        bfc_table_geometry(&product_layout(BFC_TABLE_BESIDE_FLOAT)),
        (0.0, 100.0, 150.0)
    );
}

/// WPT css/CSS2/floats/float-nowrap-1.html: a 10ch no-wrap line of 35ch, then a 5ch right float.
const FLOAT_AFTER_NOWRAP_TEXT: &str = r#"<!DOCTYPE html><html><head><style>
    div { width: 10ch; white-space: nowrap; font-family: monospace; }
    span { float: right; width: 5ch; height: 5ch; background: blue; }
    </style></head><body><div>
    Some text that overflows my parent.
    <span></span>
    </div></body></html>"#;

/// The float's top relative to the div's, and the div's (one-line) height.
fn nowrap_float_geometry(doc: &LaidOutDoc) -> (f64, f64) {
    let div = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("div"))
        .expect("div");
    let span = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("span"))
        .expect("span");
    (span.y - div.y, div.height)
}

/// CANARY of the second half of `blitz_engine::float_avoidance_fixups`: raw Blitz still places
/// the float of [`FLOAT_AFTER_NOWRAP_TEXT`] at its line's top, over the text, where Chrome 155
/// places it below the line (its top at the div's one-line height).
#[test]
fn blitz_still_places_a_float_over_its_nowrap_line() {
    let (raw, _) = raw_layout(FLOAT_AFTER_NOWRAP_TEXT);
    let (float_top, line_height) = nowrap_float_geometry(&raw);
    assert!(line_height > 0.0);
    assert_eq!(
        float_top, 0.0,
        "\n\nBLITZ CHANGED WHERE IT PLACES A FLOAT AFTER LINE CONTENT. Raw Blitz no longer puts \
         the FLOAT_AFTER_NOWRAP_TEXT float at its line's top (it is now {float_top} px below \
         the div's top; Chrome 155: {line_height}, below the line), the bug \
         float_avoidance_fixups works around (blitz-dom 0.3.0-beta.4 src/layout/inline.rs \
         722-765 places a float at `state.line_y()` whatever Parley has put on that line). If \
         Blitz now matches Chrome, DELETE in crates/vellora-core/src/blitz_engine.rs the no-wrap \
         half of `float_avoidance_fixups` (`nowrap_lines`, `LineGeometry`, `inline_root_lines`, \
         `FloatFixup::MarginTop`), this canary and \
         `float_avoidance_moves_a_float_below_its_nowrap_line`; with the other half gone too, \
         also the second `resolve` in `resolve_and_walk`. Then re-measure css/CSS2/floats with \
         fidelity/wpt before trusting either layout.\n"
    );
}

/// The compensation against Chrome 155 on [`FLOAT_AFTER_NOWRAP_TEXT`]: the float's top on the
/// line's bottom.
#[test]
fn float_avoidance_moves_a_float_below_its_nowrap_line() {
    let (float_top, line_height) = nowrap_float_geometry(&product_layout(FLOAT_AFTER_NOWRAP_TEXT));
    assert!(line_height > 0.0);
    assert_eq!(float_top, line_height);
}

/// The no-wrap edit leaves a float that starts its line where Blitz put it (WPT
/// float-nowrap-1-notref.html, the mismatch reference of float-nowrap-1), and the BFC edit leaves
/// a formatting-context root that fits beside the float.
#[test]
fn float_avoidance_leaves_boxes_that_fit() {
    let leading = FLOAT_AFTER_NOWRAP_TEXT.replace(
        "Some text that overflows my parent.\n    <span></span>",
        "<span></span>\n    Some text that overflows my parent.",
    );
    assert_ne!(leading, FLOAT_AFTER_NOWRAP_TEXT);
    assert_eq!(nowrap_float_geometry(&product_layout(&leading)).0, 0.0);
    let narrow = BFC_TABLE_BESIDE_FLOAT.replace("width: 250px", "width: 150px");
    let (x, y, _) = bfc_table_geometry(&product_layout(&narrow));
    assert_eq!((x, y), (100.0, 0.0));
}

/// WPT css/CSS2/abspos/between-float-and-text.html: an absolutely positioned green square and a
/// red float laid out at the same place; Chrome paints the positioned box over the float.
#[test]
fn positioned_boxes_paint_over_floats() {
    let html = r#"<!DOCTYPE html><html><body>
        <div style="line-height:20px; margin-top:-20px;">&nbsp;
        <div style="position:absolute; width:200px; height:200px; background:green;"></div>
        <div style="float:left; margin-top:20px; width:200px; height:200px; background:red;"></div>
        </div></body></html>"#;
    let doc = product_layout(html);
    let tier_of = |color: [u8; 3]| {
        doc.boxes
            .iter()
            .flat_map(|b| &b.visual_rects)
            .find(|r| r.color == color)
            .map(|r| (r.tier, r.x, r.y))
            .expect("rect")
    };
    let (green, red) = (tier_of([0, 128, 0]), tier_of([255, 0, 0]));
    assert_eq!((green.1, green.2), (red.1, red.2), "same place");
    assert_eq!(green.0, crate::blitz_engine::PAINT_TIER_POSITIONED);
    assert_eq!(red.0, crate::blitz_engine::PAINT_TIER_FLOAT);
}

/// Text and a float inside relatively positioned `display: inline` elements (left 100px, then
/// left 100px + top 10px), each in its own div.
const RELATIVE_INLINE: &str = r#"<!DOCTYPE html><html><head><style>
    body { margin: 0; font-family: sans-serif; font-size: 16px; }
    .rel { position: relative; left: 100px; }
    </style></head><body>
    <div id="a"><span class="rel">rel</span></div>
    <div id="b"><span class="rel" style="top: 10px"><span id="f" style="float: left;
    width: 50px; height: 20px; background: blue"></span>txt</span></div>
    </body></html>"#;

/// `(x, y)` of the `rel` run, of the `txt` run and of the float, each relative to its div.
fn relative_inline_geometry(doc: &LaidOutDoc) -> [(f64, f64); 3] {
    let divs: Vec<_> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("div"))
        .collect();
    let run = |text: &str| {
        runs_of(doc)
            .into_iter()
            .find(|(t, _, _)| t.trim() == text)
            .unwrap_or_else(|| panic!("{text} run"))
    };
    let float = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("span") && b.width == 50.0)
        .expect("float");
    let (_, rel_x, rel_y) = run("rel");
    let (_, txt_x, txt_y) = run("txt");
    [
        (rel_x - divs[0].x, rel_y - divs[0].y),
        (txt_x - divs[1].x, txt_y - divs[1].y),
        (float.x - divs[1].x, float.y - divs[1].y),
    ]
}

/// CANARY of `blitz_engine::inline_ancestor_relative_offset`: raw Blitz still lays the content
/// of the relatively positioned inline `<span>`s of [`RELATIVE_INLINE`] out where it would be
/// without the offset: `rel` at x 0, the float at (0, 0) and `txt` right of it (x 50).
#[test]
fn blitz_still_ignores_relative_offset_of_inline_elements() {
    let raw = relative_inline_geometry(&raw_layout(RELATIVE_INLINE).0);
    let unmoved = [raw[0].0, raw[1].0, raw[2].0, raw[2].1];
    assert_eq!(
        unmoved,
        [0.0, 50.0, 0.0, 0.0],
        "\n\nBLITZ CHANGED HOW IT LAYS OUT RELATIVELY POSITIONED INLINE ELEMENTS. Raw Blitz no \
         longer lays the RELATIVE_INLINE text and float out unmoved by their `position: \
         relative` <span>s (now {raw:?}, relative to each div), the gap \
         inline_ancestor_relative_offset fills (blitz-dom 0.3.0-beta.4 src/layout/inline.rs \
         1059-1081 applies `inset_offset` to an atomic inline box's own location only). If \
         Blitz now moves that content itself, DELETE in crates/vellora-core/src/blitz_engine.rs \
         `inline_ancestor_relative_offset`, `is_out_of_flow`, the `compensate` parameter of \
         `box_origin` and the relative offset in `read_text_runs`, this canary and \
         `relative_inline_compensation_moves_text_and_floats`. Then re-measure \
         css/CSS2/visuren and css/CSS2/normal-flow with fidelity/wpt.\n"
    );
}

/// The compensation: every piece of content moves by its spans' offsets (CSS 2.2 §9.4.3).
#[test]
fn relative_inline_compensation_moves_text_and_floats() {
    let raw = relative_inline_geometry(&raw_layout(RELATIVE_INLINE).0);
    let product = relative_inline_geometry(&product_layout(RELATIVE_INLINE));
    let moved: Vec<(f64, f64)> = product
        .iter()
        .zip(&raw)
        .map(|(p, r)| (p.0 - r.0, p.1 - r.1))
        .collect();
    assert_eq!(moved, vec![(100.0, 0.0), (100.0, 10.0), (100.0, 10.0)]);
}

/// The second layout of `float_avoidance_fixups` keeps the computed-style compensations made
/// before the first one: a document with the `collapse_b1` table (collapsed-border compensation
/// and LayoutUnit snapping) and a float the no-wrap edit moves still gets Chrome's table rows
/// (`collapsed_border_compensation_gives_chromes_rows`) after the re-layout the float triggers.
#[test]
fn float_avoidance_relayout_keeps_the_earlier_style_compensations() {
    let html = collapse_variant(
        "table{border-collapse:collapse} td{border:1px solid #000} \
         .nw{width:10ch;white-space:nowrap;font-family:monospace;line-height:normal} \
         .nw span{float:right;width:5ch;height:5ch;background:blue}",
        3,
    )
    .replace(
        "<div>after</div>",
        "<div>after</div><div class=\"nw\">Some text that overflows my parent. <span></span></div>",
    );
    let doc = product_layout(&html);
    let table = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table");
    let cells: Vec<(f64, f64)> = doc
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .step_by(2)
        .map(|b| (b.y - table.y, b.height))
        .collect();
    assert_eq!(table.height, 112.0, "Chrome's collapse_b1 table height");
    for ((y, h), (cy, ch)) in cells.iter().zip([(0.5, 37.0), (37.5, 37.0), (74.5, 37.0)]) {
        assert!(
            (y - cy).abs() <= 0.5 && (y + h - (cy + ch)).abs() <= 0.5,
            "{cells:?}"
        );
    }
    // The float edit applied, so the second layout ran.
    let div = doc
        .boxes
        .iter()
        .rfind(|b| b.tag.as_deref() == Some("div"))
        .expect("div");
    let span = doc
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("span"))
        .expect("float");
    assert!(div.height > 0.0);
    assert_eq!(span.y - div.y, div.height, "float below its line");
}

/// The table-column pseudo-element repro of `blitz_engine::hide_table_column_pseudos` (WPT
/// `css/CSS2/generated-content/after-content-display-012.xht` plus a `table-column` `::before`).
const TABLE_COLUMN_PSEUDOS: &str = r#"<!DOCTYPE html><html><head><style>
    div::after { background-color: red; color: yellow; content: ". FAIL"; display: table-column-group; font-size: 2em; }
    span::before { content: "COL"; display: table-column; }
    </style></head><body><div>Filler text</div><span>x</span></body></html>"#;

/// The text of every text run of a layout.
fn run_texts(doc: &LaidOutDoc) -> Vec<String> {
    runs_of(doc).into_iter().map(|(text, _, _)| text).collect()
}

/// CANARY of `blitz_engine::hide_table_column_pseudos`: raw Blitz still lays out the `content`
/// of a `::before`/`::after` with `display: table-column(-group)`, which CSS 2.1 §17.2.1 and
/// Chrome 155 never render.
#[test]
fn blitz_still_renders_table_column_pseudo_content() {
    let (raw, _) = raw_layout(TABLE_COLUMN_PSEUDOS);
    assert_eq!(
        run_texts(&raw),
        ["Filler text", ". FAIL", "x", "COL"],
        "\n\nBLITZ CHANGED HOW IT BUILDS A `display: table-column(-group)` PSEUDO-ELEMENT: raw \
         Blitz no longer lays out its `content` (blitz-dom 0.3.0-beta.4 src/layout/construct.rs \
         589-595 laid internal table displays outside a table out as flow containers). If Blitz \
         now renders nothing for them, like Chrome 155, DELETE `hide_table_column_pseudos` and \
         its call in `resolve_and_walk` (crates/vellora-core/src/blitz_engine.rs), this canary \
         and `table_column_pseudo_compensation_renders_nothing`, then re-run the WPT \
         generated-content directory.\n"
    );
}

/// The compensation: neither pseudo-element is laid out, the rest is untouched.
#[test]
fn table_column_pseudo_compensation_renders_nothing() {
    let doc = product_layout(TABLE_COLUMN_PSEUDOS);
    assert_eq!(run_texts(&doc), ["Filler text", "x"]);
}

/// The rtl line-end white-space repros of `blitz_engine::rtl_line_end_whitespace`, both with ltr
/// letters in an rtl block (Liberation Mono, 0.6 em advances): a right-aligned line that breaks
/// after a space (25 px: 15 px a character, 300 px = 20 characters, so the first line is
/// "REF REF REF REF REF " with its space), and the `pre-wrap` justified line of WPT
/// `css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` (20 px: 12.002 px a
/// character, `width: 7ch`).
const RTL_LINE_END_RIGHT: &str = r#"<!DOCTYPE html><html><body style="margin: 0">
    <div style="direction: rtl; width: 20ch; font: 25px/1 'Liberation Mono'">REF REF REF REF REF REF</div>
    </body></html>"#;
const RTL_LINE_END_JUSTIFY: &str = r#"<!DOCTYPE html><html><body style="margin: 0">
    <div style="width: 7ch; font: 20px 'Liberation Mono'; margin-left: 20px; direction: rtl; white-space: pre-wrap; text-align: justify"><span>XX XX </span><span>XXX</span></div>
    </body></html>"#;

/// `(text, x)` of the runs of the first line (the smallest baseline) of a layout.
fn first_line(doc: &LaidOutDoc) -> Vec<(String, f64)> {
    let runs = runs_of(doc);
    let y = runs.iter().map(|r| r.2).fold(f64::INFINITY, f64::min);
    let mut line: Vec<(String, f64)> = runs
        .into_iter()
        .filter(|r| (r.2 - y).abs() < 1e-6)
        .map(|(text, x, _)| (text, (x * 1000.0).round() / 1000.0))
        .collect();
    line.sort_by(|a, b| a.1.total_cmp(&b.1));
    line
}

/// CANARY of `blitz_engine::rtl_line_end_whitespace`: raw Blitz (Parley 0.12) still keeps the
/// space that ends an rtl line inside its ltr run, at the run's right end and not hanging.
#[test]
fn blitz_still_keeps_rtl_line_end_space_in_its_ltr_run() {
    let right = first_line(&raw_layout(RTL_LINE_END_RIGHT).0);
    let justify = first_line(&raw_layout(RTL_LINE_END_JUSTIFY).0);
    assert_eq!(
        (right, justify),
        (
            vec![("REF REF REF REF REF ".to_string(), 0.0)],
            vec![("XX XX ".to_string(), 20.0)]
        ),
        "\n\nPARLEY CHANGED HOW IT ENDS AN RTL LINE: the space that ends the line no longer stays \
         in its ltr run at the run's right end (parley 0.12.0 src/layout/line_break.rs 1896-1902 \
         and src/layout/data.rs 497-500: UAX #9 L1 is not applied per line). If Parley now \
         applies L1 (and P1 at forced breaks) like Chrome 155, DELETE `rtl_line_end_whitespace`, \
         its call and the `line_runs` rtl flags in `read_text_runs` \
         (crates/vellora-core/src/blitz_engine.rs), this canary and the \
         `rtl_line_end_whitespace_*` tests, then re-run the WPT css-text directory.\n"
    );
}

/// The compensation, right-aligned (`start` in rtl): the space moves to the left end and hangs,
/// the letters end at the right edge (Chrome 155 on the WPT `text-align-end-ref-006` page:
/// letters at 25..300 of the 300 px line, its trailing space not drawn inside).
#[test]
fn rtl_line_end_whitespace_right_aligned_hangs_on_the_left() {
    assert_eq!(
        first_line(&product_layout(RTL_LINE_END_RIGHT)),
        [
            (" ".to_string(), 0.0),
            ("REF REF REF REF REF".to_string(), 15.002)
        ]
    );
}

/// The compensation, justified: the trailing space hangs left of the line (x 8 = 20 - 12) and
/// the one separator left takes all the free space (36.006 px), so the letters sit at both edges
/// like Chrome 155 (WPT `text-justify-and-trailing-spaces-003`: "XX" at 20..44 and 80..104).
#[test]
fn rtl_line_end_whitespace_justified_spreads_over_the_inner_separator() {
    let doc = product_layout(RTL_LINE_END_JUSTIFY);
    assert_eq!(
        first_line(&doc),
        [(" ".to_string(), 7.998), ("XX XX".to_string(), 20.0)]
    );
    let inner = doc
        .boxes
        .iter()
        .flat_map(|b| &b.text_runs)
        .find(|r| r.glyphs.len() == 5)
        .and_then(|r| {
            r.glyphs
                .iter()
                .find(|g| &r.text[g.text_start..g.text_end] == " ")
        })
        .map(|g| g.advance)
        .expect("the inner space of \"XX XX\"");
    assert!((inner - 36.006).abs() < 0.01, "inner separator {inner}");
}

/// Merge of phasec/04-text with phasec/04-paint: the rtl line-end move carries the runs'
/// `text-decoration` lines with it. The hanging space is not underlined (Chrome 155 decorates
/// no line-end space) and the stretched run's underline spans its new width (no line is drawn
/// twice or past the glyphs).
#[test]
fn rtl_line_end_whitespace_moves_the_decorations_with_the_glyphs() {
    let underlined = RTL_LINE_END_JUSTIFY.replace(
        "text-align: justify\"",
        "text-align: justify; text-decoration: underline\"",
    );
    let doc = product_layout(&underlined);
    let y = runs_of(&doc)
        .iter()
        .map(|r| r.2)
        .fold(f64::INFINITY, f64::min);
    let line: Vec<_> = doc
        .boxes
        .iter()
        .flat_map(|b| &b.text_runs)
        .filter(|r| (r.origin_y - y).abs() < 1e-6)
        .collect();
    let space = line
        .iter()
        .find(|r| r.glyphs.len() == 1)
        .expect("the moved space");
    assert!(space.decorations.is_empty(), "{:?}", space.decorations);
    let word = line
        .iter()
        .find(|r| r.glyphs.len() == 5)
        .expect("\"XX XX\"");
    let width: f64 = word.glyphs.iter().map(|g| f64::from(g.advance)).sum();
    assert_eq!(word.decorations.len(), 1, "{:?}", word.decorations);
    let d = &word.decorations[0];
    assert!(
        d.x.abs() < 1e-6 && (d.width - width).abs() < 1e-6,
        "{d:?} vs {width}"
    );
}

/// The `text-wrap: balance` repro of `blitz_engine::balance_text_wrap`: WPT
/// `css/css-text/white-space/text-wrap-balance-text-indent-001.html` in Liberation Mono instead
/// of Ahem (every length is in `ch`, so the breaks are the same).
const BALANCE: &str = r#"<!DOCTYPE html><html><head><style>
    div { font: 10px 'Liberation Mono'; text-indent: 5ch; text-wrap: balance; width: 10ch; }
    </style></head><body><div>
      01
      34 6 89
      12 3 56
    </div></body></html>"#;

/// The text of each line (runs grouped by baseline, in order).
fn line_texts(doc: &LaidOutDoc) -> Vec<String> {
    let mut lines: Vec<(f64, String)> = Vec::new();
    for (text, _, y) in runs_of(doc) {
        match lines.iter_mut().find(|(ly, _)| (*ly - y).abs() < 1e-6) {
            Some((_, line)) => line.push_str(&text),
            None => lines.push((y, text)),
        }
    }
    lines.sort_by(|a, b| a.0.total_cmp(&b.0));
    lines.into_iter().map(|(_, text)| text).collect()
}

/// CANARY of `blitz_engine::balance_text_wrap`: raw Blitz still fills the lines of a
/// `text-wrap: balance` block greedily (Stylo 0.22.0 parses `text-wrap` for Gecko only).
#[test]
fn blitz_still_wraps_balanced_text_greedily() {
    assert_eq!(
        line_texts(&raw_layout(BALANCE).0),
        ["01 34 ", "6 89 12 3 ", "56"],
        "\n\nBLITZ CHANGED HOW IT BREAKS A `text-wrap: balance` BLOCK: raw Blitz no longer fills \
         the repro's lines greedily (stylo 0.22.0 properties/longhands.toml 4008-4014 and \
         shorthands.toml 551-554 made `text-wrap-style` / `text-wrap` Gecko-only). If Blitz now \
         balances like Chrome 155 (\"01\" / \"34 6 89\" / \"12 3 56\"), DELETE \
         `balance_text_wrap`, `rebalance_layout`, `MAX_LINES_FOR_BALANCE` and its call in \
         `resolve_and_walk` (crates/vellora-core/src/blitz_engine.rs), the `wrap_*` parts of \
         src/break_css.rs, this canary and the `balance_*` tests, then re-run the WPT \
         css-text/white-space directory.\n"
    );
}

/// The compensation gives Chrome 155's lines (the WPT reference: "01" / "34 6 89" / "12 3 56").
#[test]
fn balance_text_wrap_gives_chromes_lines() {
    assert_eq!(
        line_texts(&product_layout(BALANCE)),
        ["01 ", "34 6 89 ", "12 3 56"]
    );
}

/// Left alone: a right-aligned block (Chrome aligns in the full line box, Parley in the narrowed
/// one), a document with a float, and a block without `text-wrap: balance`.
#[test]
fn balance_text_wrap_skips_what_it_cannot_place_like_chrome() {
    let greedy = ["01 34 ", "6 89 12 3 ", "56"];
    let right = BALANCE.replace("width: 10ch;", "width: 10ch; text-align: right;");
    let float = BALANCE.replace("<body>", "<body><span style=\"float: right\">f</span>");
    let off = BALANCE.replace("text-wrap: balance;", "");
    assert_eq!(line_texts(&product_layout(&right)), greedy);
    // With Blitz's `floats` feature on (phasec/04-floats) the float is laid out beside the
    // block on its own baseline, so its run is a separate "line": drop it.
    let mut float_lines = line_texts(&product_layout(&float));
    float_lines.retain(|line| line != "f");
    assert_eq!(float_lines, greedy);
    assert_eq!(line_texts(&product_layout(&off)), greedy);
}

/// Two 20 px black blocks in a `columns: 2` container, 200 px wide.
const MULTICOL: &str = r#"<!DOCTYPE html><html><head><style>
    body { margin: 0 }
    #mc { columns: 2; column-gap: 0; width: 200px; }
    #mc p { margin: 0; height: 20px; background: #000; }
    </style></head><body><div id="mc"><p></p><p></p></div></body></html>"#;

/// CANARY of `blitz_engine::lay_out_multicol` / `crate::multicol`: blitz-dom 0.3.0-beta.4 and
/// Taffy 0.15.0 have no multi-column layout (Stylo computes `column-count`, nothing reads it), so
/// raw Blitz lays a `columns: 2` container out as one block: its blocks are stacked, each the
/// full 200 px wide. When this fails, Blitz lays columns out itself: delete
/// `lay_out_multicol`, `crate::multicol` and their call sites, and re-measure WPT css/css-multicol
/// and css/css-break.
#[test]
fn blitz_still_lays_multicol_out_in_one_column() {
    let blocks = |doc: &LaidOutDoc| -> Vec<(f64, f64, f64)> {
        doc.boxes
            .iter()
            .filter(|b| b.tag.as_deref() == Some("p"))
            .map(|b| (b.x, b.y, b.width))
            .collect()
    };
    let (raw, _) = raw_layout(MULTICOL);
    assert_eq!(blocks(&raw), vec![(0.0, 0.0, 200.0), (0.0, 20.0, 200.0)]);
    // vellora's layout of the same document: two 100 px columns, one block each.
    let (laid, _) = validate_and_lay_out(
        MULTICOL.as_bytes(),
        &RenderOptions::default(),
        DocumentSyntax::Html,
        &mut NoObserver,
    )
    .expect("lays out");
    assert_eq!(blocks(&laid), vec![(0.0, 0.0, 100.0), (100.0, 0.0, 100.0)]);
}
