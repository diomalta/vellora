//! Focused layout-fidelity regressions for visual organization details:
//! table header bands, bordered cells, rounded badges, key-value rows, party
//! blocks, and totals.

use vellora_core::{
    blitz_engine::{self, ImageFormat},
    page_css, pagination, render, RenderOptions,
};

const INVOICE: &str = include_str!("fixtures/invoice.html");
const LIBERATION_SERIF_REGULAR: &[u8] = include_bytes!("../src/fonts/LiberationSerif-Regular.ttf");
const LIBERATION_MONO_REGULAR: &[u8] = include_bytes!("../src/fonts/LiberationMono-Regular.ttf");

fn opts() -> RenderOptions {
    RenderOptions {
        title: Some("Layout fidelity regression".to_string()),
        creation_date: Some((2026, 6, 25)),
        ..Default::default()
    }
}

fn lay_out_for_render(html: &str) -> (blitz_engine::LaidOutDoc, page_css::PageBox) {
    let pb = page_css::parse_page_box(html);
    let laid = blitz_engine::validate_then_lay_out(
        html,
        vellora_core::validation::denied_elements(),
        pb.content_width(),
        pb.content_height(),
        &std::collections::HashMap::new(),
        None,
        &[],
    )
    .unwrap_or_else(|_| panic!("fixture is in the supported subset"));
    (laid, pb)
}

fn run_width(run: &vellora_core::blitz_engine::TextRun) -> f64 {
    run.glyphs.iter().map(|g| g.advance as f64).sum()
}

fn first_pdf_media_box_size(bytes: &[u8]) -> (f32, f32) {
    let doc = lopdf::Document::load_mem(bytes).expect("lopdf parses output");
    let (_, page_id) = doc
        .get_pages()
        .into_iter()
        .next()
        .expect("PDF has a first page");
    let dict = doc.get_dictionary(page_id).expect("page dictionary");
    let media_box = dict
        .get(b"MediaBox")
        .expect("page has MediaBox")
        .as_array()
        .expect("MediaBox is an array");
    let read = |idx: usize| {
        media_box[idx]
            .as_float()
            .unwrap_or(media_box[idx].as_i64().unwrap_or(0) as f32)
    };
    (read(2) - read(0), read(3) - read(1))
}

fn text_run_covered_range(run: &vellora_core::blitz_engine::TextRun) -> Option<(usize, usize)> {
    let start = run.glyphs.iter().map(|g| g.text_start).min()?;
    let end = run.glyphs.iter().map(|g| g.text_end).max()?;
    Some((start, end))
}

fn text_run_for_range<'a>(
    doc: &'a vellora_core::blitz_engine::LaidOutDoc,
    source: &str,
    covered_range: (usize, usize),
) -> &'a vellora_core::blitz_engine::TextRun {
    doc.boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|run| {
            run.text.as_str() == source && text_run_covered_range(run) == Some(covered_range)
        })
        .unwrap_or_else(|| {
            panic!("missing text run for source {source:?} covering {covered_range:?}")
        })
}

fn text_run_containing<'a>(
    doc: &'a vellora_core::blitz_engine::LaidOutDoc,
    needle: &str,
) -> &'a vellora_core::blitz_engine::TextRun {
    doc.boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|run| run.text.contains(needle))
        .unwrap_or_else(|| panic!("missing text run containing {needle:?}"))
}

#[test]
fn serif_generic_uses_bundled_serif_face() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: serif; font-size: 12pt; }
    </style></head><body>
        <p>Serif body text</p>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let run = text_run_containing(&laid, "Serif body text");
    assert_eq!(
        run.font_data.as_slice(),
        LIBERATION_SERIF_REGULAR,
        "CSS serif generic should resolve to bundled Liberation Serif regular, not the sans stack"
    );
}

#[test]
fn monospace_generic_uses_bundled_mono_face() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: monospace; font-size: 12pt; }
    </style></head><body>
        <p>000123456789</p>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let run = text_run_containing(&laid, "000123456789");
    assert_eq!(
        run.font_data.as_slice(),
        LIBERATION_MONO_REGULAR,
        "CSS monospace generic should resolve to bundled Liberation Mono regular, not the sans stack"
    );
}

// Chrome 155.0.8059.85 (print media, bundled fonts, 2026-10-21; probe in
// fidelity/baselines/port/02-delete-noop-passes/attachments/chrome-probes-noop-passes.json):
// the <td> border box equals the <table> border box, (0, 0, 300, 15). Blitz
// 0.3.0-beta.4 lays a borderless collapsed table out without any inset; the
// pin-era `collapsed_table_medium_border_insets` workaround is gone (port step 02).
#[test]
fn collapsed_borderless_table_does_not_keep_medium_border_inset() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; font-size: 10pt; }
        table { width: 300px; border-collapse: collapse; }
        td { padding: 0; border: 0 none transparent; }
    </style></head><body>
        <table><tr><td>Cell text</td></tr></table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let table = laid
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table exists");
    let cell = laid
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("td"))
        .expect("cell exists");

    assert!(
        (cell.y - table.y).abs() <= 0.5,
        "collapsed borderless table should not keep a synthetic medium top border inset, table_y={}, cell_y={}, table_h={}, cell_h={}",
        table.y,
        cell.y,
        table.height,
        cell.height
    );
    assert!(
        ((table.y + table.height) - (cell.y + cell.height)).abs() <= 0.5,
        "collapsed borderless table should not keep a synthetic medium bottom border inset, table=({}, {}), cell=({}, {})",
        table.y,
        table.height,
        cell.y,
        cell.height
    );
}

fn cell_inline_band_for_table(
    laid: &vellora_core::blitz_engine::LaidOutDoc,
    table_idx: usize,
) -> (f64, f64) {
    let depth = laid.boxes[table_idx].depth;
    let mut cell_left = f64::INFINITY;
    let mut cell_right = f64::NEG_INFINITY;
    let mut j = table_idx + 1;
    while j < laid.boxes.len() && laid.boxes[j].depth > depth {
        if matches!(laid.boxes[j].tag.as_deref(), Some("td" | "th")) {
            cell_left = cell_left.min(laid.boxes[j].x);
            cell_right = cell_right.max(laid.boxes[j].x + laid.boxes[j].width);
        }
        j += 1;
    }
    (cell_left, cell_right)
}

#[test]
fn invoice_borderless_collapsed_header_cells_reach_table_inline_edges() {
    // The invoice header (table.header) is a width:100% border-collapse table
    // with no border. Chrome 155.0.8059.85 (layout-diff snapshot of the invoice,
    // run 20261021T093020Z) puts its two cells flush with the table: left and
    // right inset 0. The pin-era Blitz inset the cells ~3px each side (a
    // synthetic "medium" border); Blitz 0.3.0-beta.4 does not, so the
    // `collapsed_table_medium_border_insets_x` workaround is gone (port step 02).
    // The header is the first <table> in document order and contains the brand.
    let (laid, _pb) = lay_out_for_render(INVOICE);

    let header_idx = (0..laid.boxes.len())
        .find(|&i| laid.boxes[i].tag.as_deref() == Some("table"))
        .expect("invoice has a table");
    let table_x = laid.boxes[header_idx].x;
    let table_right = table_x + laid.boxes[header_idx].width;
    let (cell_left, cell_right) = cell_inline_band_for_table(&laid, header_idx);

    assert!(
        (cell_left - table_x).abs() <= 0.5,
        "header cells should reach the table left edge, table_x={table_x}, cell_left={cell_left}"
    );
    assert!(
        (table_right - cell_right).abs() <= 0.5,
        "header cells should reach the table right edge, table_right={table_right}, cell_right={cell_right}"
    );
}

#[test]
fn invoice_compact_collapsed_table_cells_reach_left_inline_edge() {
    // The items table is a width:100% border-collapse table with >=3 auto columns,
    // re-flowed by the compact-columns pass, whose cursor anchors at the leftmost
    // cell. Chrome 155.0.8059.85 (layout-diff snapshot of the invoice, run
    // 20261021T093020Z) puts the first column flush with the table (left inset 0).
    // At Blitz 0.3.0-beta.4 the cells already start there, without the removed
    // `collapsed_table_medium_border_insets_x` translation (port step 02).
    let (laid, _pb) = lay_out_for_render(INVOICE);

    // The items table = the border-collapse table with the most cells (>=3 cols).
    let items_idx = (0..laid.boxes.len())
        .filter(|&i| {
            laid.boxes[i].tag.as_deref() == Some("table") && laid.boxes[i].table_border_collapse
        })
        .max_by_key(|&i| {
            let depth = laid.boxes[i].depth;
            (i + 1..laid.boxes.len())
                .take_while(|&j| laid.boxes[j].depth > depth)
                .filter(|&j| matches!(laid.boxes[j].tag.as_deref(), Some("td" | "th")))
                .count()
        })
        .expect("invoice has a border-collapse table");
    let table_x = laid.boxes[items_idx].x;
    let (cell_left, _cell_right) = cell_inline_band_for_table(&laid, items_idx);

    assert!(
        (cell_left - table_x).abs() <= 0.5,
        "items cells should reach the table left edge, table_x={table_x}, cell_left={cell_left}"
    );
}

#[test]
fn painted_table_row_text_baseline_is_raised_without_document_specific_selectors() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; font-size: 10pt; }
        table { width: 300px; border-collapse: collapse; margin: 0 0 20px; }
        td { padding: 8px; border: 0 none transparent; }
        .painted td { border-bottom: 1px solid #ccc; }
    </style></head><body>
        <table class="plain"><tr><td>Plain cell</td></tr></table>
        <table class="painted"><tr><td>Painted cell</td></tr></table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let plain = text_run_containing(&laid, "Plain cell");
    let painted = text_run_containing(&laid, "Painted cell");
    let cell_for = |run: &vellora_core::blitz_engine::TextRun| {
        laid.boxes
            .iter()
            .find(|b| {
                b.tag.as_deref() == Some("td")
                    && run.origin_x >= b.x
                    && run.origin_x <= b.x + b.width
                    && run.origin_y >= b.y
                    && run.origin_y <= b.y + b.height
            })
            .expect("text run should remain inside its table cell")
    };
    let plain_gap = plain.origin_y - cell_for(plain).y;
    let painted_gap = painted.origin_y - cell_for(painted).y;

    assert!(
        painted_gap <= plain_gap - 1.0,
        "painted table rows should raise text baselines by a generic cell-paint rule, got plain_gap={plain_gap}, painted_gap={painted_gap}"
    );
}

#[test]
fn table_header_background_lowers_to_pdf_rects() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: #2f5d8a; color: white; padding: 8px; }
        td { padding: 8px; }
    </style></head><body>
        <table><thead><tr><th>HEADER BAND</th></tr></thead><tbody><tr><td>Body</td></tr></tbody></table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    assert!(
        paginated.pages[0]
            .rects
            .iter()
            .any(|r| { r.color == [47, 93, 138] && r.width > 100.0 && r.height > 10.0 }),
        "expected a filled table-header background rect, got {:?}",
        paginated.pages[0]
            .rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn table_header_background_merges_across_adjacent_cells() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 420px; }
        th { background: #2f5d8a; color: white; padding: 8px; }
    </style></head><body>
        <table>
            <thead><tr><th>ITEM</th><th>QTD.</th><th>PRECO UNIT.</th><th>TOTAL</th></tr></thead>
            <tbody><tr><td>Body</td><td>1</td><td>R$ 1,00</td><td>R$ 1,00</td></tr></tbody>
        </table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let header_rects: Vec<_> = paginated.pages[0]
        .rects
        .iter()
        .filter(|r| r.color == [47, 93, 138] && r.height > 10.0)
        .collect();
    assert_eq!(
        header_rects.len(),
        1,
        "adjacent header cell backgrounds should merge into one band, got {:?}",
        header_rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
    assert!(
        header_rects[0].width > 300.0,
        "merged header band should cover the table width, got {:?}",
        (header_rects[0].x, header_rects[0].width)
    );
}

#[test]
fn table_header_background_resolves_css_variables_to_pdf_rects() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        :root { --accent: #2f5d8a; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th { background: var(--accent); color: white; padding: 8px; }
        td { padding: 8px; }
    </style></head><body>
        <table><thead><tr><th>HEADER BAND</th></tr></thead><tbody><tr><td>Body</td></tr></tbody></table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    assert!(
        paginated.pages[0]
            .rects
            .iter()
            .any(|r| { r.color == [47, 93, 138] && r.width > 100.0 && r.height > 10.0 }),
        "expected CSS variable background to become a filled rect, got {:?}",
        paginated.pages[0]
            .rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn a4_pdf_media_box_matches_chromium_print_a4_dimensions() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 16mm; }
        body { margin: 0; font-family: sans-serif; }
    </style></head><body>Documento</body></html>"#;

    let bytes = render(html.as_bytes(), &opts()).expect("render succeeds");
    let (width_pt, height_pt) = first_pdf_media_box_size(&bytes);

    assert!(
        (width_pt - 594.96).abs() <= 0.06,
        "A4 PDF width should match Chromium print output, got {width_pt}"
    );
    assert!(
        (height_pt - 841.92).abs() <= 0.06,
        "A4 PDF height should match Chromium print output, got {height_pt}"
    );
}

#[test]
fn right_aligned_table_text_ends_at_cell_content_edge() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; font-size: 10pt; }
        table { width: 260px; border-collapse: collapse; }
        td { padding: 8px 12px; }
        td.num { text-align: right; white-space: nowrap; }
    </style></head><body>
        <table><tr><td>Descricao</td><td class="num">40</td></tr></table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let numeric_cell = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .nth(1)
        .expect("numeric cell exists");
    let value = text_run_containing(&laid, "40");
    let value_right = value.origin_x + run_width(value);
    let expected_right = numeric_cell.x + numeric_cell.width - 12.0;

    assert!(
        (value_right - expected_right).abs() <= 1.0,
        "right-aligned text should end at cell content edge, got value_right={value_right}, expected_right={expected_right}, cell=({}, {})",
        numeric_cell.x,
        numeric_cell.width
    );
}

// Chrome 155.0.8059.85 (print media, bundled Liberation fonts, viewport 672 px =
// the A4 content width at 16 mm margins, 2026-10-21; probe `short_numeric_columns`
// in fidelity/baselines/port/03-table-passes/attachments/chrome-probes-table-passes.json):
// the four columns are 324.50 / 73.30 / 143.19 / 131.02 px, description ratio 0.483,
// quantity ratio 0.109. Chrome hands the spare width out in proportion to each
// column's max-content width; Blitz 0.3.0-beta.4 gives every auto column an equal
// share (282 / 99 / 150 / 141 px: ratios 0.420 / 0.147). The
// `auto_table_compact_columns` heuristic narrows the right-aligned columns
// (336.95 / 84.00 / 131.08 / 119.97: 0.501 / 0.125). This test pins that the
// column BOXES stay within 0.025 of Chrome's ratios, which raw Blitz misses; it
// does not claim the heuristic is right: in this table the quantity text ends
// 22.8 px right of Chrome's with the pass and 17.2 px left of it without.
#[test]
fn auto_table_keeps_short_numeric_columns_near_chromes_widths() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 16mm; }
        body { margin: 0; font-family: "Liberation Sans"; font-size: 10.5pt; line-height: 1.45; }
        table { width: 100%; border-collapse: collapse; }
        th {
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 2.6mm 3mm;
        }
        th.num { text-align: right; }
        td {
            padding: 2.2mm 3mm;
            font-size: 10pt;
            vertical-align: top;
        }
        td.num {
            text-align: right;
            white-space: nowrap;
        }
        .sku { display: block; font-size: 8pt; }
    </style></head><body>
        <table>
            <thead><tr><th>Item</th><th class="num">Qtd.</th><th class="num">Preco unit.</th><th class="num">Total</th></tr></thead>
            <tbody>
                <tr>
                    <td>Suporte de fixacao em aluminio A20<span class="sku">SKU WX-A20</span></td>
                    <td class="num">40</td>
                    <td class="num">R$ 32,50</td>
                    <td class="num">R$ 1.300,00</td>
                </tr>
            </tbody>
        </table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let first_row_cells: Vec<_> = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .take(4)
        .collect();
    assert_eq!(
        first_row_cells.len(),
        4,
        "expected four body cells, got {first_row_cells:?}"
    );
    let row_left = first_row_cells
        .iter()
        .map(|cell| cell.x)
        .fold(f64::INFINITY, f64::min);
    let row_right = first_row_cells
        .iter()
        .map(|cell| cell.x + cell.width)
        .fold(f64::NEG_INFINITY, f64::max);
    let row_width = row_right - row_left;
    let description_ratio = first_row_cells[0].width / row_width;
    let quantity_ratio = first_row_cells[1].width / row_width;

    assert!(
        (description_ratio - 0.483).abs() <= 0.025,
        "description column should stay near Chrome's ratio 0.483, got ratio={description_ratio:.3}; cells={:?}",
        first_row_cells
            .iter()
            .map(|cell| (cell.x, cell.width))
            .collect::<Vec<_>>()
    );
    assert!(
        (quantity_ratio - 0.109).abs() <= 0.025,
        "short quantity column should stay near Chrome's ratio 0.109, got ratio={quantity_ratio:.3}; cells={:?}",
        first_row_cells
            .iter()
            .map(|cell| (cell.x, cell.width))
            .collect::<Vec<_>>()
    );
}

// Chrome 155.0.8059.85 (print media, bundled Liberation fonts, viewport 672 px,
// 2026-10-21; probe `invoice_test_fixture` in
// fidelity/baselines/port/03-table-passes/attachments/chrome-probes-table-passes.json)
// starts the quantity column of this invoice at 348.23 of 672 px: ratio 0.518.
// Raw Blitz 0.3.0-beta.4 starts it at 307 (0.457, equal share of the spare width
// per auto column); `auto_table_compact_columns` moves it to 341.58 (0.508).
#[test]
fn auto_table_starts_invoice_quantity_column_near_chrome() {
    let (laid, _pb) = lay_out_for_render(INVOICE);
    let item_run = text_run_containing(&laid, "Suporte");
    let item_cell = laid
        .boxes
        .iter()
        .find(|b| {
            b.tag.as_deref() == Some("td")
                && item_run.origin_x >= b.x
                && item_run.origin_x <= b.x + b.width
                && item_run.origin_y >= b.y
                && item_run.origin_y <= b.y + b.height
        })
        .expect("first invoice item cell exists");
    let mut first_row_cells: Vec<_> = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td") && (b.y - item_cell.y).abs() <= 0.5)
        .collect();
    first_row_cells.sort_by(|a, b| a.x.total_cmp(&b.x));
    assert_eq!(
        first_row_cells.len(),
        4,
        "expected four body cells, got {first_row_cells:?}"
    );
    let row_left = first_row_cells
        .iter()
        .map(|cell| cell.x)
        .fold(f64::INFINITY, f64::min);
    let row_right = first_row_cells
        .iter()
        .map(|cell| cell.x + cell.width)
        .fold(f64::NEG_INFINITY, f64::max);
    let row_width = row_right - row_left;
    let quantity_start_ratio = (first_row_cells[1].x - row_left) / row_width;

    assert!(
        (quantity_start_ratio - 0.518).abs() <= 0.02,
        "quantity column should begin near Chrome's ratio 0.518, got ratio={quantity_start_ratio:.3}; cells={:?}",
        first_row_cells
            .iter()
            .map(|cell| (cell.x, cell.width))
            .collect::<Vec<_>>()
    );
}

// Chrome 155.0.8059.85 (print media, bundled Liberation fonts, viewport 657 px =
// the A4 content width at 18 mm margins, 2026-10-21; probe `compact_aligned` in
// fidelity/baselines/port/03-table-passes/attachments/chrome-probes-table-passes.json):
// columns 344.38 / 68.83 / 107.09 / 136.70 px (in proportion to max-content). In
// every cell the line sits where its `text-align` puts it in the cell's content
// box (padding 10 px): right-aligned "40" ends at 403.20 = 413.20 - 10, the
// centred "UN" is centred on 466.75, the `<th>` "Descricao" (centred by the UA
// `th` rule) on 172.19, and "R$ 1.300,00" ends at 647.00. vellora's
// `auto_table_compact_columns` pass gives the columns other widths (a heuristic,
// see the test above), so this test checks the same relation against vellora's
// post-pass cells, plus Chrome's absolute 647.00 for the last column, whose right
// edge both engines share. Before port step 03 the pass moved each cell's text by
// the left-edge change only: "40" ended at 409.4 instead of 392.0, "UN" sat 7.5 px
// off centre and the header 16.7 px off.
#[test]
fn compact_columns_keep_each_line_where_its_text_align_puts_it() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: "Liberation Sans"; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 4px 10px; }
        .num { text-align: right; white-space: nowrap; }
        .mid { text-align: center; }
    </style></head><body>
        <table>
            <thead><tr><th>Descricao</th><th class="num">Qtd.</th><th>Unidade</th><th class="num">Total</th></tr></thead>
            <tbody>
                <tr><td>Suporte de fixacao em aluminio A20</td><td class="num">40</td><td class="mid">UN</td><td class="num">R$ 1.300,00</td></tr>
                <tr><td>Parafuso sextavado</td><td class="num">125</td><td class="mid">CX</td><td class="num">R$ 87,50</td></tr>
            </tbody>
        </table>
    </body></html>"#;
    const PADDING: f64 = 10.0;

    let (laid, _pb) = lay_out_for_render(html);
    let owner = |needle: &str| {
        laid.boxes
            .iter()
            .find(|b| {
                matches!(b.tag.as_deref(), Some("td" | "th"))
                    && b.text_runs.iter().any(|r| r.text.contains(needle))
            })
            .unwrap_or_else(|| panic!("missing cell containing {needle:?}"))
    };
    let span = |needle: &str| {
        let run = text_run_containing(&laid, needle);
        (run.origin_x, run.origin_x + run_width(run))
    };

    for needle in ["Qtd.", "40", "125", "Total", "R$ 1.300,00", "R$ 87,50"] {
        let cell = owner(needle);
        let (_, right) = span(needle);
        let content_right = cell.x + cell.width - PADDING;
        assert!(
            (right - content_right).abs() <= 1.0,
            "right-aligned {needle:?} should end at its cell's content edge {content_right:.2}, got {right:.2}"
        );
    }
    for needle in ["Descricao", "Unidade", "UN", "CX"] {
        let cell = owner(needle);
        let (left, right) = span(needle);
        let centre = cell.x + cell.width / 2.0;
        assert!(
            ((left + right) / 2.0 - centre).abs() <= 1.0,
            "centred {needle:?} should be centred on {centre:.2}, got {:.2}",
            (left + right) / 2.0
        );
    }
    let (_, total_right) = span("R$ 1.300,00");
    assert!(
        (total_right - 647.0).abs() <= 1.0,
        "last column's value should end where Chrome ends it (647.00), got {total_right:.2}"
    );
}

#[test]
fn right_aligned_inline_padding_keeps_line_right_edge_stable() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 16mm; }
        body { margin: 0; font-family: sans-serif; font-size: 10pt; }
        .meta { width: 288px; text-align: right; }
        .label { padding-right: 6mm; color: #5b6472; }
    </style></head><body>
        <div class="meta"><span class="label">Número</span>INV-2026-00417</div>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let meta = laid
        .boxes
        .iter()
        .find(|b| {
            b.tag.as_deref() == Some("div")
                && b.text_runs
                    .iter()
                    .any(|run| run.text.contains("INV-2026-00417"))
        })
        .expect("right-aligned metadata line exists");
    let text_right = meta
        .text_runs
        .iter()
        .map(|run| run.origin_x + run_width(run))
        .fold(f64::NEG_INFINITY, f64::max);
    let box_right = meta.x + meta.width;

    assert!(
        (text_right - box_right).abs() <= 1.0,
        "right-aligned inline padding should preserve the line right edge, got text_right={text_right}, box_right={box_right}, runs={:?}",
        meta.text_runs
            .iter()
            .map(|run| (run.text.as_str(), run.origin_x, run.origin_x + run_width(run)))
            .collect::<Vec<_>>()
    );
}

#[test]
fn percentage_table_cell_width_preserves_column_proportion() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: serif; font-size: 11pt; }
        table { width: 600px; border-collapse: collapse; }
        td { border: 1px solid #ccc; padding: 6pt 8pt; }
        td.k { width: 38%; font-weight: bold; }
    </style></head><body>
        <table>
            <tr><td class="k">Valor em aberto</td><td>R$ 4.875,50</td></tr>
            <tr><td class="k">Vencimento original</td><td>15/05/2026</td></tr>
        </table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let cells: Vec<_> = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .collect();
    assert!(
        cells.len() >= 2,
        "expected at least one two-cell row, got {cells:?}"
    );
    let first = cells[0];
    let second = cells[1];
    let row_width = second.x + second.width - first.x;
    let first_ratio = first.width / row_width;

    assert!(
        (first_ratio - 0.38).abs() < 0.02,
        "first cell should keep its CSS 38% width, got ratio {first_ratio:.3}; cells={:?}",
        cells
            .iter()
            .map(|c| (c.x, c.width, c.width_pct_hint))
            .collect::<Vec<_>>()
    );
    assert!(
        (second.x - (first.x + first.width)).abs() < 0.5,
        "second cell should begin at the corrected first-cell edge, got first={:?} second={:?}",
        (first.x, first.width),
        (second.x, second.width)
    );
}

// Chrome 155.0.8059.85, print media, bundled Liberation fonts (the shared
// fidelity/lib/chrome-reference.mjs setup), viewport 657 px = the A4 content width
// at 18 mm margins, 2026-10-21; numbers in fidelity/baselines/port/03-table-passes/
// attachments/chrome-probes-table-passes.json (`percent_aligned`): the 38 % cells
// are 228 px wide, the value cells x 228 w 372; the right-aligned "R$ 4.875,50"
// ends at 592.00 (cell right 600 - padding 8) and the centred "15/05/2026" starts
// at 377.31 (centre 414.0 = centre of the 236..592 content box). Blitz
// 0.3.0-beta.4 turns a % cell width into `auto` in an auto-layout table
// (blitz-dom layout/table.rs `collect_table_cells`), so `table_percent_widths`
// resizes these cells. Their text has to follow its alignment; moving it by the
// cell's left-edge change alone put the value at 495.5 and the date at 329.0.
const PERCENT_ALIGNED: &str = r#"<!DOCTYPE html><html><head><style>
    @page { size: A4; margin: 18mm; }
    body { margin: 0; font-family: "Liberation Sans"; font-size: 11pt; }
    table { width: 600px; border-collapse: collapse; }
    td { padding: 6px 8px; }
    td.k { width: 38%; }
    td.v { text-align: right; }
    td.c { text-align: center; }
</style></head><body>
    <table>
        <tr><td class="k">Valor em aberto</td><td class="v">R$ 4.875,50</td></tr>
        <tr><td class="k">Vencimento original</td><td class="c">15/05/2026</td></tr>
    </table>
</body></html>"#;

#[test]
fn percent_width_pass_moves_right_and_centre_aligned_text_with_the_cell() {
    let (laid, _pb) = lay_out_for_render(PERCENT_ALIGNED);
    let cells: Vec<_> = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .collect();
    assert_eq!(cells.len(), 4, "expected two two-cell rows, got {cells:?}");
    for row in cells.chunks(2) {
        assert!(
            (row[0].width - 228.0).abs() <= 1.0
                && (row[1].x - 228.0).abs() <= 1.0
                && (row[1].width - 372.0).abs() <= 1.0,
            "cells should take Chrome's 228 / 372 px split, got {:?}",
            row.iter().map(|c| (c.x, c.width)).collect::<Vec<_>>()
        );
    }

    let value = text_run_containing(&laid, "R$ 4.875,50");
    let value_right = value.origin_x + run_width(value);
    assert!(
        (value_right - 592.0).abs() <= 1.0,
        "right-aligned value should end where Chrome ends it (592.00), got {value_right}"
    );
    let date = text_run_containing(&laid, "15/05/2026");
    assert!(
        (date.origin_x - 377.31).abs() <= 1.0,
        "centred date should start where Chrome starts it (377.31), got {}",
        date.origin_x
    );
}

// Chrome 155.0.8059.85 (print media, bundled Liberation fonts, viewport 657 px,
// 2026-10-21; probe `fixed_percent` in
// fidelity/baselines/port/03-table-passes/attachments/chrome-probes-table-passes.json):
// in a 400 px fixed table a first-row `width: 25%` cell with 4 px side padding
// takes 108 px (25 % of 400 plus the padding; CSS 2.2 §17.5.2.1) and the two auto
// columns 146 px each. Blitz 0.3.0-beta.4 resolves percentages itself in the fixed
// layout (blitz-dom layout/table.rs `percent_track`) and lands exactly there, so
// `table_percent_widths` leaves fixed tables alone; it used to re-split this row
// to 100 / 150 / 150 (WPT css/CSS2/tables/fixed-table-layout-026.xht went fail ->
// pass when the pass stopped doing so, port step 03).
#[test]
fn percent_width_pass_leaves_fixed_tables_to_blitz() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: "Liberation Sans"; font-size: 9pt; }
        table { width: 400px; table-layout: fixed; border-collapse: collapse; }
        td { padding: 2px 4px; }
        td.k { width: 25%; }
        td.num { text-align: right; }
    </style></head><body>
        <table>
            <tr><td class="k">Data</td><td>Historico</td><td class="num">Valor</td></tr>
            <tr><td>01/06</td><td>Tarifa</td><td class="num">12,00</td></tr>
        </table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let cells: Vec<_> = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .collect();
    assert_eq!(
        cells.len(),
        6,
        "expected two three-cell rows, got {cells:?}"
    );
    for row in cells.chunks(3) {
        for (cell, (x, width)) in row
            .iter()
            .zip([(0.0, 108.0), (108.0, 146.0), (254.0, 146.0)])
        {
            assert!(
                (cell.x - x).abs() <= 0.5 && (cell.width - width).abs() <= 0.5,
                "cell should keep Chrome's fixed column ({x}, {width}), got ({}, {})",
                cell.x,
                cell.width
            );
        }
    }
}

// Chrome 155.0.8059.85 (print media, viewport 657 px, 2026-10-21; probe
// `fixed_colspans` in fidelity/baselines/port/03-table-passes/attachments/
// chrome-probes-table-passes.json) gives the four fixed tracks 99.75 px border
// boxes: row 1 (0.5, 299.25) + (299.75, 99.75), row 2 (0.5 | 100.25 | 200.0 |
// 299.75, 99.75 each). Widths come from the table width alone, so the generic
// `sans-serif` face (system Helvetica in Chrome) does not matter here. Blitz
// 0.3.0-beta.4 implements CSS 2.2 §17.5.2.1 itself (blitz-dom layout/table.rs
// `build_table_context`: `minmax(0, 1fr)` tracks); it lays each collapsed border
// out as a whole-width gutter (the table's `gap`) where Chrome splits it between
// the neighbours (§17.6.2), so a cell edge may sit up to one 1 px border (plus
// rounding) away from Chrome's: tolerance 2 px. The pin-era `fixed_table_widths`
// pass forced 100 px tracks; it is gone (port step 03).
#[test]
fn fixed_table_layout_colspans_span_chromes_equal_tracks() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; font-size: 9pt; }
        table { width: 400px; table-layout: fixed; border-collapse: collapse; }
        td { border: 1px solid #555; padding: 4px 8px; }
    </style></head><body>
        <table>
            <tr><td colspan="3">Local de pagamento</td><td>Vencimento</td></tr>
            <tr><td>Data</td><td>Número</td><td>Espécie</td><td>Valor</td></tr>
        </table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let cells: Vec<_> = laid
        .boxes
        .iter()
        .filter(|b| b.tag.as_deref() == Some("td"))
        .collect();
    assert_eq!(cells.len(), 6, "expected six table cells, got {cells:?}");

    let chrome = [
        (0.5, 299.25),
        (299.75, 99.75),
        (0.5, 99.75),
        (100.25, 99.75),
        (200.0, 99.75),
        (299.75, 99.75),
    ];
    for (idx, (cell, (x, width))) in cells.iter().zip(chrome).enumerate() {
        assert!(
            (cell.x - x).abs() <= 2.0 && (cell.width - width).abs() <= 2.0,
            "cell {idx} should sit on Chrome's fixed track ({x}, {width}), got ({}, {})",
            cell.x,
            cell.width
        );
    }
    // The colspan=3 cell ends exactly where the third track ends.
    let wide_right = cells[0].x + cells[0].width;
    let third_right = cells[4].x + cells[4].width;
    assert!(
        (wide_right - third_right).abs() <= 0.5,
        "colspan=3 should end with the third track, got {wide_right} vs {third_right}"
    );
}

// Chrome 155.0.8059.85 (print media, bundled Liberation fonts, viewport 657 px,
// 2026-10-21; probes `fixed_cols` and `fixed_cells` in
// fidelity/baselines/port/03-table-passes/attachments/chrome-probes-table-passes.json):
// a 400 px fixed table takes the `<col>` widths 60 / 220 and gives the rest (120)
// to the auto column; without `<col>`s, a first-row `width: 80px` cell with 4 px
// side padding takes 88 px and the two auto columns split the rest, 156 each
// (CSS 2.2 §17.5.2.1). The right-aligned "Valor" ends at 396.0 (400 - padding 4).
// Blitz 0.3.0-beta.4 lays both out exactly so. The removed `fixed_table_widths`
// pass split every fixed table into equal tracks (133.33 px here), which broke
// the DANFE / boleto / bank-statement grids that are built from `<col>` widths.
#[test]
fn fixed_table_layout_takes_col_and_first_row_cell_widths() {
    let cols = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: "Liberation Sans"; font-size: 9pt; }
        table { width: 400px; table-layout: fixed; border-collapse: collapse; }
        td { padding: 2px 4px; }
        td.num { text-align: right; }
    </style></head><body>
        <table>
            <colgroup><col style="width: 60px"><col style="width: 220px"><col></colgroup>
            <tr><td>Data</td><td>Historico</td><td class="num">Valor</td></tr>
            <tr><td>01/06</td><td>Tarifa</td><td class="num">12,00</td></tr>
        </table>
    </body></html>"#;
    let first_row_cells = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: "Liberation Sans"; font-size: 9pt; }
        table { width: 400px; table-layout: fixed; border-collapse: collapse; }
        td { padding: 2px 4px; }
    </style></head><body>
        <table>
            <tr><td style="width: 80px">Data</td><td>Historico</td><td>Valor</td></tr>
            <tr><td>01/06</td><td>Tarifa bancaria</td><td>12,00</td></tr>
        </table>
    </body></html>"#;

    for (html, chrome) in [
        (cols, [(0.0, 60.0), (60.0, 220.0), (280.0, 120.0)]),
        (
            first_row_cells,
            [(0.0, 88.0), (88.0, 156.0), (244.0, 156.0)],
        ),
    ] {
        let (laid, _pb) = lay_out_for_render(html);
        let cells: Vec<_> = laid
            .boxes
            .iter()
            .filter(|b| b.tag.as_deref() == Some("td"))
            .collect();
        assert_eq!(
            cells.len(),
            6,
            "expected two three-cell rows, got {cells:?}"
        );
        for row in cells.chunks(3) {
            for (cell, (x, width)) in row.iter().zip(chrome) {
                assert!(
                    (cell.x - x).abs() <= 0.5 && (cell.width - width).abs() <= 0.5,
                    "cell should take Chrome's fixed column ({x}, {width}), got ({}, {})",
                    cell.x,
                    cell.width
                );
            }
        }
    }

    let (laid, _pb) = lay_out_for_render(cols);
    let valor = text_run_containing(&laid, "Valor");
    let valor_right = valor.origin_x + run_width(valor);
    assert!(
        (valor_right - 396.0).abs() <= 1.0,
        "right-aligned header should end where Chrome ends it (396.0), got {valor_right}"
    );
}

#[test]
fn adjacent_block_vertical_margins_collapse() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; font-size: 12px; }
        .first { margin: 0 0 20px 0; }
        .second { margin: 30px 0 0 0; }
    </style></head><body>
        <div class="first">Primeiro bloco</div>
        <div class="second">Segundo bloco</div>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let first = laid
        .boxes
        .iter()
        .find(|b| {
            b.tag.as_deref() == Some("div")
                && b.text_runs
                    .iter()
                    .any(|run| run.text.contains("Primeiro bloco"))
        })
        .expect("first block exists");
    let second = laid
        .boxes
        .iter()
        .find(|b| {
            b.tag.as_deref() == Some("div")
                && b.text_runs
                    .iter()
                    .any(|run| run.text.contains("Segundo bloco"))
        })
        .expect("second block exists");
    let gap = second.y - (first.y + first.height);

    assert!(
        (gap - 30.0).abs() <= 1.0,
        "adjacent margins should collapse to max(20, 30), got gap={gap}, first=({}, {}, mt={}, mb={}), second=({}, {}, mt={}, mb={})",
        first.y,
        first.height,
        first.margin_top,
        first.margin_bottom,
        second.y,
        second.height,
        second.margin_top,
        second.margin_bottom
    );
}

fn block_with_text<'a>(
    laid: &'a vellora_core::blitz_engine::LaidOutDoc,
    tag: &str,
    text: &str,
) -> &'a vellora_core::blitz_engine::LaidOutBox {
    laid.boxes
        .iter()
        .find(|b| {
            b.tag.as_deref() == Some(tag) && b.text_runs.iter().any(|run| run.text.contains(text))
        })
        .unwrap_or_else(|| panic!("no <{tag}> holding {text:?}"))
}

#[test]
fn adjacent_block_margins_collapse_without_whitespace_between_siblings() {
    // Siblings with no whitespace text between them. Blitz 0.3.0-beta.4 already
    // collapses the margins; the removed `vertical_margin_collapse` pass then
    // subtracted min(margin-bottom, margin-top) a second time (gap 10, not 40).
    // Chrome 155.0.8059.85, print media, bundled fonts, 2026-10-21 (probe
    // `margins_without_whitespace` in fidelity/baselines/port/02-delete-noop-passes/
    // attachments/chrome-probes-noop-passes.json): border boxes a (0, 0, 657, 14),
    // b (0, 54, 657, 14), c (0, 118, 657, 14), h2 (0, 152, 657, 21),
    // p (0, 188, 657, 14), i.e. gaps 40, 50, 20, 15 = the larger margin each time.
    let html = r#"<!DOCTYPE html><html><head><style>@page { size: A4; margin: 18mm; } body { margin: 0; font-family: sans-serif; font-size: 12px; } .a { margin: 0 0 40px 0; } .b { margin: 30px 0 0 0; } .c { margin: 50px 0 0 0; } h2 { font-size: 18px; margin: 20px 0 15px 0; } p { margin: 12px 0 0 0; }</style></head><body><div id="a" class="a">Primeiro</div><div id="b" class="b">Segundo</div><div id="c" class="c">Terceiro</div><h2 id="h">Titulo</h2><p id="p">Paragrafo</p></body></html>"#;
    let (laid, _pb) = lay_out_for_render(html);
    let ys: Vec<(f64, f64)> = [
        ("div", "Primeiro"),
        ("div", "Segundo"),
        ("div", "Terceiro"),
        ("h2", "Titulo"),
        ("p", "Paragrafo"),
    ]
    .iter()
    .map(|(tag, text)| {
        let b = block_with_text(&laid, tag, text);
        (b.y, b.y + b.height)
    })
    .collect();
    let chrome_tops = [0.0, 54.0, 118.0, 152.0, 188.0];
    for (i, ((top, _), chrome)) in ys.iter().zip(chrome_tops).enumerate() {
        assert!(
            (top - chrome).abs() <= 0.5,
            "box {i} top {top} vs Chrome {chrome}; all (top, bottom): {ys:?}"
        );
    }
    let gaps: Vec<f64> = ys.windows(2).map(|w| w[1].0 - w[0].1).collect();
    for (gap, chrome) in gaps.iter().zip([40.0, 50.0, 20.0, 15.0]) {
        assert!(
            (gap - chrome).abs() <= 0.5,
            "collapsed gaps {gaps:?} vs Chrome [40, 50, 20, 15]"
        );
    }
}

#[test]
fn collapsed_table_keeps_half_its_outer_border_around_the_cells() {
    // A collapsed table whose own 8px border wins over the cells' 4px borders:
    // the table's border box holds half the outer collapsed border (CSS 2.2
    // §17.6.2), so every edge cell sits 4px inside it. Blitz 0.3.0-beta.4 does
    // this; the removed `collapsed_table_medium_border_insets` (block axis) and
    // `_x` (inline axis: stretch for < 3 columns, shift for >= 3) passes took
    // the 2..4.5px inset for a synthetic "medium" border and removed it.
    // Chrome 155.0.8059.85, print media, bundled fonts, 2026-10-21 (probe
    // `collapsed_table_border`, same attachment): table#two (0, 0, 300, 30),
    // td Um (4, 4, 131.72, 22), td Dois (135.72, 4, 160.28, 22); table#three
    // (0, 50, 450, 48), first cell (4, 54), last cell right edge 446, bottom 94.
    // Only the edge insets are asserted: Blitz still lays the inner collapsed
    // borders and the row heights out differently (rows 22 vs 20 px, 4px between
    // rows), a separate follow-up.
    let html = r##"<!DOCTYPE html><html><head><style>@page { size: A4; margin: 18mm; } body { margin: 0; font-family: sans-serif; font-size: 12px; } table { border-collapse: collapse; border: 8px solid #0cc; margin: 0 0 20px 0; } td { border: 4px solid #000; padding: 0; } #two { width: 300px; } #three { width: 450px; }</style></head><body><table id="two"><tr><td id="t2a">Um</td><td id="t2b">Dois</td></tr></table><table id="three"><tr><td id="t3a">Um</td><td id="t3b">Dois</td><td id="t3c">Tres</td></tr><tr><td id="t3d">Quatro</td><td id="t3e">Cinco</td><td id="t3f">Seis</td></tr></table></body></html>"##;
    let (laid, _pb) = lay_out_for_render(html);
    let tables: Vec<usize> = (0..laid.boxes.len())
        .filter(|&i| laid.boxes[i].tag.as_deref() == Some("table"))
        .collect();
    assert_eq!(tables.len(), 2, "two tables");
    for &t in &tables {
        let table = &laid.boxes[t];
        let depth = table.depth;
        let cells: Vec<&vellora_core::blitz_engine::LaidOutBox> = laid.boxes[t + 1..]
            .iter()
            .take_while(|b| b.depth > depth)
            .filter(|b| b.tag.as_deref() == Some("td"))
            .collect();
        let left = cells.iter().map(|c| c.x).fold(f64::INFINITY, f64::min);
        let right = cells
            .iter()
            .map(|c| c.x + c.width)
            .fold(f64::NEG_INFINITY, f64::max);
        let top = cells.iter().map(|c| c.y).fold(f64::INFINITY, f64::min);
        let bottom = cells
            .iter()
            .map(|c| c.y + c.height)
            .fold(f64::NEG_INFINITY, f64::max);
        let insets = [
            left - table.x,
            top - table.y,
            table.x + table.width - right,
            table.y + table.height - bottom,
        ];
        for inset in insets {
            assert!(
                (inset - 4.0).abs() <= 0.5,
                "table {} (x {}, y {}, w {}, h {}): cell insets [left, top, right, bottom] {insets:?}, Chrome [4, 4, 4, 4]",
                cells.len(),
                table.x,
                table.y,
                table.width,
                table.height
            );
        }
    }
}

#[test]
fn invoice_header_background_lowers_to_pdf_rects() {
    let (laid, pb) = lay_out_for_render(INVOICE);
    let paginated = pagination::paginate(&laid, &pb);
    assert!(
        paginated
            .pages
            .iter()
            .flat_map(|page| page.rects.iter())
            .any(|r| r.color == [47, 93, 138] && r.width > 100.0 && r.height > 10.0),
        "expected invoice table header background rect, page-1 rects={:?}",
        paginated.pages[0]
            .rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn top_level_table_margin_before_items_header_is_preserved() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        table.parties { margin-bottom: 40px; }
        table.parties td { border: 1px solid #111; padding: 12px; }
        table.items th { background: #2f5d8a; color: white; padding: 8px; }
        table.items td { padding: 8px; }
    </style></head><body>
        <table class="parties"><tr><td>Party block</td></tr></table>
        <table class="items">
            <thead><tr><th>ITEM</th></tr></thead>
            <tbody><tr><td>Line item</td></tr></tbody>
        </table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let page = &paginated.pages[0];
    let party_bottom = page
        .rects
        .iter()
        .filter(|r| r.color == [17, 17, 17])
        .map(|r| r.y + r.height)
        .fold(f64::NEG_INFINITY, f64::max);
    let header_top = page
        .rects
        .iter()
        .filter(|r| r.color == [47, 93, 138])
        .map(|r| r.y)
        .fold(f64::INFINITY, f64::min);
    assert!(
        header_top - party_bottom >= 35.0,
        "expected table margin gap before items header, party_bottom={party_bottom}, header_top={header_top}, rects={:?}",
        page.rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn top_level_margin_top_between_blocks_is_preserved() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 10pt; margin: 0; }
        .first { height: 24px; }
        .second { margin-top: 30px; }
    </style></head><body>
        <div class="first">Before</div>
        <div class="second">After</div>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let before = paginated.pages[0]
        .text_runs
        .iter()
        .find(|r| r.text.contains("Before"))
        .expect("before text exists");
    let after = paginated.pages[0]
        .text_runs
        .iter()
        .find(|r| r.text.contains("After"))
        .expect("after text exists");

    let gap = after.origin_y - before.origin_y;
    assert!(
        gap >= 50.0,
        "margin-top on the following block should survive pagination repositioning; gap={gap}, before_y={}, after_y={}",
        before.origin_y,
        after.origin_y
    );
}

#[test]
fn table_cell_borders_lower_to_pdf_rects() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 240px; }
        td { border: 2px solid #555; padding: 8px; }
    </style></head><body>
        <table><tr><td>BORDERED CELL</td></tr></table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let border_rects: Vec<_> = paginated.pages[0]
        .rects
        .iter()
        .filter(|r| r.color == [85, 85, 85])
        .collect();
    assert!(
        border_rects
            .iter()
            .any(|r| r.height <= 2.5 && r.width > 100.0),
        "expected a horizontal border rect, got {:?}",
        border_rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
    assert!(
        border_rects
            .iter()
            .any(|r| r.width <= 2.5 && r.height > 10.0),
        "expected a vertical border rect, got {:?}",
        border_rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn rounded_badge_border_lowers_to_pdf_stroke() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border: 1px solid #2f5d8a;
            border-radius: 8px;
            color: #2f5d8a;
            font-weight: 700;
        }
    </style></head><body>
        <span class="badge">EM ABERTO</span>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let stroke = paginated.pages[0].rounded_strokes.iter().find(|s| {
        s.color == [47, 93, 138]
            && s.width > 40.0
            && s.height > 10.0
            && s.radius_x > 4.0
            && s.radius_y > 4.0
    });
    assert!(
        stroke.is_some(),
        "expected rounded badge border stroke, got {:?}",
        paginated.pages[0]
            .rounded_strokes
            .iter()
            .map(|s| (s.x, s.y, s.width, s.height, s.radius_x, s.radius_y, s.color))
            .collect::<Vec<_>>()
    );
    let stroke = stroke.unwrap();
    let text_run = paginated.pages[0]
        .text_runs
        .iter()
        .find(|r| r.text.contains("EM ABERTO"))
        .expect("badge text run exists");
    let text_mid_y = text_run.origin_y - text_run.font_size as f64 / 2.0;
    let stroke_mid_y = stroke.y + stroke.height / 2.0;
    assert!(
        (text_mid_y - stroke_mid_y).abs() <= 2.0,
        "badge text should be vertically centered inside rounded stroke; text_mid_y={text_mid_y}, stroke_mid_y={stroke_mid_y}, baseline={}, font_size={}, stroke=({}, {}, {}, {})",
        text_run.origin_y,
        text_run.font_size,
        stroke.x,
        stroke.y,
        stroke.width,
        stroke.height
    );
    let left_inset = text_run.origin_x - stroke.x;
    assert!(
        (10.0..=16.0).contains(&left_inset),
        "badge text should honor horizontal padding; left_inset={left_inset}, text_x={}, stroke_x={}",
        text_run.origin_x,
        stroke.x
    );

    let bytes = render(html.as_bytes(), &opts()).expect("render succeeds");
    assert!(bytes.starts_with(b"%PDF-"), "valid PDF header");
}

#[test]
fn data_url_png_image_lowers_to_pdf_image_run_and_xobject() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; }
        img { width: 24px; height: 16px; }
    </style></head><body>
        <img alt="pixel" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==" />
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    assert_eq!(
        paginated.pages[0].images.len(),
        1,
        "one embedded data-url image should be lowered"
    );
    let image = &paginated.pages[0].images[0];
    assert_eq!(image.format, ImageFormat::Png);
    assert!(
        (image.width - 24.0).abs() <= 0.5 && (image.height - 16.0).abs() <= 0.5,
        "image should preserve CSS dimensions, got {}x{}",
        image.width,
        image.height
    );

    let bytes = render(html.as_bytes(), &opts()).expect("render succeeds");
    let doc = lopdf::Document::load_mem(&bytes).expect("lopdf parses output");
    let has_image_xobject = doc.objects.values().any(|obj| {
        let subtype_is_image = |dict: &lopdf::Dictionary| {
            dict.get(b"Subtype")
                .and_then(|subtype| subtype.as_name())
                .is_ok_and(|name| name == b"Image")
        };
        obj.as_dict().ok().is_some_and(subtype_is_image)
            || obj
                .as_stream()
                .ok()
                .is_some_and(|stream| subtype_is_image(&stream.dict))
    });
    assert!(has_image_xobject, "PDF should contain an image XObject");
}

#[test]
fn right_aligned_key_value_keeps_label_gap_and_order() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        * { box-sizing: border-box; }
        body { font-family: sans-serif; font-size: 10pt; }
        .doc-meta { width: 260px; text-align: right; }
        .label { color: #5b6472; padding-right: 24px; }
        .value { font-weight: 600; }
    </style></head><body>
        <div class="doc-meta"><span class="label">Número</span><span class="value">INV-2026-00417</span></div>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let source = "NúmeroINV-2026-00417";
    let label_range = (0, "Número".len());
    let value_range = ("Número".len(), source.len());
    let label = text_run_for_range(&laid, source, label_range);
    let value = text_run_for_range(&laid, source, value_range);
    let label_end_x = label.origin_x + run_width(label);

    assert!(
        value.origin_x >= label_end_x + 20.0,
        "key-value value should sit after the label padding, label_end_x={label_end_x}, value_x={}",
        value.origin_x
    );
    assert!(
        (value.origin_y - label.origin_y).abs() <= 0.5,
        "key-value label and value should share a baseline, label_y={}, value_y={}",
        label.origin_y,
        value.origin_y
    );
}

#[test]
fn party_block_keeps_role_name_and_lines_in_vertical_order() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 10pt; }
        table.parties { width: 100%; border-collapse: collapse; }
        table.parties td { width: 50%; padding: 16px 20px; border: 1px solid #d7dce4; vertical-align: top; }
        .party-role { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.8px; color: #2f5d8a; margin-bottom: 8px; }
        .party-name { font-size: 11.5pt; font-weight: 600; margin-bottom: 6px; }
        .party-line { margin: 0; font-size: 9.5pt; color: #5b6472; }
    </style></head><body>
        <table class="parties"><tr><td>
            <div class="party-role">Emitente</div>
            <div class="party-name">Acme Widgets LON</div>
            <p class="party-line">Rua das Flores, 123</p>
        </td></tr></table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let role = text_run_containing(&laid, "EMITENTE");
    let name = text_run_containing(&laid, "Acme Widgets LON");
    let line = text_run_containing(&laid, "Rua das Flores");

    assert!(
        role.origin_y < name.origin_y && name.origin_y < line.origin_y,
        "party block text should stack role -> name -> line, got role_y={}, name_y={}, line_y={}",
        role.origin_y,
        name.origin_y,
        line.origin_y
    );
    assert!(
        (role.origin_x - name.origin_x).abs() <= 1.0
            && (name.origin_x - line.origin_x).abs() <= 1.0,
        "party block text should share the same content-left, got role_x={}, name_x={}, line_x={}",
        role.origin_x,
        name.origin_x,
        line.origin_x
    );
}

#[test]
fn party_block_table_stays_inside_page_content_box() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        * { box-sizing: border-box; }
        body { font-family: sans-serif; font-size: 10pt; margin: 0; }
        table.parties { width: 100%; border-collapse: collapse; }
        table.parties td {
            vertical-align: top;
            width: 50%;
            padding: 4mm 5mm;
            border: 0.4pt solid #d7dce4;
        }
        .party-role { font-size: 8.5pt; text-transform: uppercase; color: #2f5d8a; margin-bottom: 2mm; }
        .party-name { font-size: 11.5pt; font-weight: 700; margin-bottom: 1.5mm; }
        .party-line { margin: 0; font-size: 9.5pt; color: #5b6472; }
    </style></head><body>
        <table class="parties">
            <tr>
                <td>
                    <div class="party-role">Emitente</div>
                    <div class="party-name">Acme Widgets LON</div>
                    <p class="party-line">Rua das Flores, 123 - Sala 4B</p>
                </td>
                <td>
                    <div class="party-role">Destinatário</div>
                    <div class="party-name">Borges & Pinto Comércio Ltda.</div>
                    <p class="party-line">Avenida Central, 4500 - Conjunto 12</p>
                </td>
            </tr>
        </table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let content_right = pb.width - pb.margin_right;
    let border_right = paginated.pages[0]
        .rects
        .iter()
        .filter(|r| r.color == [215, 220, 228])
        .map(|r| r.x + r.width)
        .fold(f64::NEG_INFINITY, f64::max);

    assert!(
        border_right <= content_right + 0.5,
        "party table border should stay inside content box, border_right={border_right}, content_right={content_right}, rects={:?}",
        paginated.pages[0]
            .rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn page_content_height_drives_viewport_units() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { margin: 0; font-family: sans-serif; }
        .vh-box { width: 100%; height: 100vh; background: #2f5d8a; }
    </style></head><body>
        <div class="vh-box"></div>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    assert!(
        (laid.viewport_height - pb.content_height()).abs() <= 1.0,
        "layout viewport height should match the @page content height, viewport_height={}, content_height={}",
        laid.viewport_height,
        pb.content_height()
    );
    let vh_box = laid
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("div"))
        .expect("vh box is laid out");
    assert!(
        (vh_box.height - pb.content_height()).abs() <= 1.0,
        "100vh should resolve to the @page content height, box_height={}, content_height={}",
        vh_box.height,
        pb.content_height()
    );
}

#[test]
fn totals_table_keeps_values_to_the_right_and_grand_total_below_rule() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 10pt; }
        table.totals { width: 280px; border-collapse: collapse; margin-left: auto; }
        table.totals td { padding: 7px 12px; }
        table.totals td.label { color: #5b6472; text-align: right; }
        table.totals td.value { text-align: right; white-space: nowrap; }
        table.totals tr.grand td {
            border-top: 1px solid #2f5d8a;
            font-size: 12pt;
            font-weight: 700;
            color: #2f5d8a;
            padding-top: 12px;
        }
    </style></head><body>
        <table class="totals">
            <tr><td class="label">Subtotal</td><td class="value">R$ 14.901,70</td></tr>
            <tr class="grand"><td class="label">Total a pagar</td><td class="value">R$ 14.901,70</td></tr>
        </table>
    </body></html>"#;

    let (laid, pb) = lay_out_for_render(html);
    let paginated = pagination::paginate(&laid, &pb);
    let subtotal = text_run_containing(&laid, "Subtotal");
    let subtotal_value = text_run_containing(&laid, "R$ 14.901,70");
    let total = text_run_containing(&laid, "Total a pagar");

    assert!(
        subtotal_value.origin_x > subtotal.origin_x,
        "totals value should sit to the right of its label, label_x={}, value_x={}",
        subtotal.origin_x,
        subtotal_value.origin_x
    );
    assert!(
        total.origin_y > subtotal.origin_y,
        "grand-total row should sit below subtotal, subtotal_y={}, total_y={}",
        subtotal.origin_y,
        total.origin_y
    );
    assert!(
        paginated.pages[0]
            .rects
            .iter()
            .any(|r| r.color == [47, 93, 138] && r.height <= 2.0 && r.width > 200.0),
        "grand-total border rule should be lowered to a visible accent rect, rects={:?}",
        paginated.pages[0]
            .rects
            .iter()
            .map(|r| (r.x, r.y, r.width, r.height, r.color))
            .collect::<Vec<_>>()
    );
}

#[test]
fn totals_grand_label_stays_on_one_line_when_table_has_room() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 10pt; margin: 0; }
        table.totals { width: 70mm; border-collapse: collapse; margin-left: auto; }
        table.totals td { padding: 1.8mm 3mm; }
        table.totals td.label { color: #5b6472; text-align: right; }
        table.totals td.value { text-align: right; white-space: nowrap; }
        table.totals tr.grand td {
            border-top: 0.8pt solid #2f5d8a;
            font-size: 12pt;
            font-weight: 700;
            color: #2f5d8a;
            padding-top: 3mm;
        }
    </style></head><body>
        <table class="totals">
            <tr><td class="label">Subtotal</td><td class="value">R$ 14.901,70</td></tr>
            <tr><td class="label">Descontos</td><td class="value">R$ 0,00</td></tr>
            <tr class="grand"><td class="label">Total a pagar</td><td class="value">R$ 14.901,70</td></tr>
        </table>
    </body></html>"#;

    let (laid, _pb) = lay_out_for_render(html);
    let label = "Total a pagar";
    let label_runs: Vec<_> = laid
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .filter(|run| run.text.as_str() == label)
        .collect();
    let ranges: Vec<_> = label_runs
        .iter()
        .filter_map(|run| text_run_covered_range(run))
        .collect();

    assert_eq!(
        ranges,
        vec![(0, label.len())],
        "grand total label should stay in one text run, got ranges={ranges:?}, label_runs={:?}",
        label_runs
            .iter()
            .map(|run| (
                run.origin_x,
                run.origin_y,
                run_width(run),
                text_run_covered_range(run),
            ))
            .collect::<Vec<_>>()
    );
}

// Mirrors the boleto `.boleto` field grid: a `width:100%; table-layout:fixed;
// border-collapse:collapse` table whose 4-column grid carries both colspan and a
// `rowspan="4"` instruction cell. The three single-cell rows below the rowspan
// must skip the columns the rowspan still occupies and land in the rightmost
// column — not reset to column 0 (which overlaps the instruction cell).
// Chrome 155.0.8059.85 (print media, viewport 672 px, 2026-10-21; probe
// `boleto_rowspan_grid` in fidelity/baselines/port/03-table-passes/attachments/
// chrome-probes-table-passes.json) puts all four right-column cells at x 503.75.
// Blitz 0.3.0-beta.4 places them itself (`grid_auto_flow: RowDense` in blitz-dom
// layout/table.rs), at x 504, without the removed `fixed_table_widths` pass.
const BOLETO_ROWSPAN_GRID: &str = r#"<!DOCTYPE html><html><head><style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: sans-serif; font-size: 9pt; }
    table.boleto { width: 100%; border-collapse: collapse; table-layout: fixed; }
    table.boleto td { border: 0.5px solid #555; padding: 1mm 2mm 2mm 2mm; vertical-align: top; }
</style></head><body>
    <table class="boleto">
        <tr><td colspan="3">LocalPag</td><td class="right">Venc</td></tr>
        <tr><td>DataDoc</td><td>NumDoc</td><td>Especie</td><td class="right">NossoNum</td></tr>
        <tr><td colspan="3" rowspan="4">Instrucoes</td><td class="right">Desconto</td></tr>
        <tr><td class="right">Deducoes</td></tr>
        <tr><td class="right">Mora</td></tr>
        <tr><td class="right">ValorCobrado</td></tr>
    </table>
</body></html>"#;

#[test]
fn fixed_table_rowspan_continuation_cells_skip_occupied_columns() {
    let (laid, _pb) = lay_out_for_render(BOLETO_ROWSPAN_GRID);
    let table = laid
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("table"))
        .expect("table box present");
    let track = table.width / 4.0;
    let col3_x = table.x + 3.0 * track;

    let td_x = |text: &str| -> f64 {
        laid.boxes
            .iter()
            .find(|b| {
                b.tag.as_deref() == Some("td") && b.text_runs.iter().any(|r| r.text.contains(text))
            })
            .unwrap_or_else(|| panic!("missing td containing {text:?}"))
            .x
    };

    // The rowspan="4" instruction cell occupies columns 0..3 across these rows;
    // each continuation cell must therefore sit in column 3.
    for text in ["Deducoes", "Mora", "ValorCobrado"] {
        let x = td_x(text);
        assert!(
            (x - col3_x).abs() <= 1.0,
            "rowspan continuation cell {text:?} should land in column 3 (x≈{col3_x:.2}), got x={x:.2}"
        );
    }
}
