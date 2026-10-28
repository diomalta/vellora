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
