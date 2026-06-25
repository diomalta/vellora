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
    }
}

fn lay_out_for_render(html: &str) -> (blitz_engine::LaidOutDoc, page_css::PageBox) {
    let pb = page_css::parse_page_box(html);
    let laid = blitz_engine::validate_then_lay_out(
        html,
        vellora_core::validation::denied_elements(),
        pb.content_width(),
        pb.content_height(),
    )
    .unwrap_or_else(|_| panic!("fixture is in the supported subset"));
    (laid, pb)
}

fn run_width(run: &vellora_core::blitz_engine::TextRun) -> f64 {
    run.glyphs.iter().map(|g| g.advance as f64).sum()
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

#[test]
fn fixed_table_layout_colspans_preserve_equal_tracks() {
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
    let first_row_wide = cells[0];
    let first_row_last = cells[1];
    let second_row = &cells[2..];

    assert!(
        (first_row_wide.width - 300.0).abs() <= 1.0,
        "colspan=3 should occupy three fixed 100px tracks, got width={}",
        first_row_wide.width
    );
    assert!(
        (first_row_last.width - 100.0).abs() <= 1.0,
        "last cell should occupy one fixed 100px track, got width={}",
        first_row_last.width
    );
    for (idx, cell) in second_row.iter().enumerate() {
        assert!(
            (cell.width - 100.0).abs() <= 1.0,
            "second row cell {idx} should occupy one fixed 100px track, got width={}",
            cell.width
        );
    }
    assert!(
        (first_row_last.x - (first_row_wide.x + first_row_wide.width)).abs() <= 1.0,
        "fixed tracks should keep adjacent colspan cells flush, wide=({}, {}), last=({}, {})",
        first_row_wide.x,
        first_row_wide.width,
        first_row_last.x,
        first_row_last.width
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
