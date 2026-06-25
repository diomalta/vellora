//! End-to-end core pipeline tests: HTML -> validated -> laid out -> paginated
//! -> PDF, against the multi-page invoice fixture.

use vellora_core::page_css::{self, ContentPart};
use vellora_core::pagination;
use vellora_core::{blitz_engine, render, RenderOptions};

const INVOICE: &str = include_str!("fixtures/invoice.html");

/// The bottom-center running footer of a parsed `@page` box (test helper).
fn bottom_center(pb: &page_css::PageBox) -> &page_css::MarginContent {
    pb.margins_content
        .iter()
        .find(|m| matches!(m.which, page_css::MarginBox::BottomCenter))
        .expect("bottom-center footer present")
}

fn opts() -> RenderOptions {
    RenderOptions {
        title: Some("Fatura INV-2026-00417".to_string()),
        creation_date: Some((2026, 6, 23)),
    }
}

fn all_layout_text(doc: &vellora_core::blitz_engine::LaidOutDoc) -> String {
    let mut text = String::new();
    for run in doc.boxes.iter().flat_map(|b| b.text_runs.iter()) {
        text.push_str(run.text.as_ref());
        text.push('\n');
    }
    text
}

fn dump_layout(doc: &vellora_core::blitz_engine::LaidOutDoc) -> String {
    let mut out = String::new();
    for b in &doc.boxes {
        let runs: Vec<String> = b
            .text_runs
            .iter()
            .map(|r| {
                let glyphs: Vec<String> = r
                    .glyphs
                    .iter()
                    .map(|g| {
                        format!(
                            "{}..{} x={:.1} adv={:.1}",
                            g.text_start, g.text_end, g.x_offset, g.advance
                        )
                    })
                    .collect();
                format!(
                    "{:?} origin=({:.1},{:.1}) glyphs=[{}]",
                    r.text,
                    r.origin_x,
                    r.origin_y,
                    glyphs.join(", ")
                )
            })
            .collect();
        out.push_str(&format!(
            "depth={} tag={:?} x={:.1} y={:.1} w={:.1} h={:.1} runs={:?}\n",
            b.depth, b.tag, b.x, b.y, b.width, b.height, runs
        ));
    }
    out
}

fn text_run_covered_range(run: &vellora_core::blitz_engine::TextRun) -> Option<(usize, usize)> {
    let start = run.glyphs.iter().map(|g| g.text_start).min()?;
    let end = run.glyphs.iter().map(|g| g.text_end).max()?;
    Some((start, end))
}

fn text_run_ranges(
    doc: &vellora_core::blitz_engine::LaidOutDoc,
    source: &str,
) -> Vec<(usize, usize)> {
    let ranges: Vec<_> = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .filter(|run| run.text.as_str() == source)
        .filter_map(text_run_covered_range)
        .collect();
    if ranges.is_empty() {
        panic!(
            "missing text runs for source {source:?}\n{}",
            dump_layout(doc)
        );
    }
    ranges
}

fn text_run_x_for_range(
    doc: &vellora_core::blitz_engine::LaidOutDoc,
    source: &str,
    covered_range: (usize, usize),
) -> f64 {
    text_run_for_range(doc, source, covered_range).origin_x
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
            panic!(
                "missing text run for source {source:?} covering {covered_range:?}\n{}",
                dump_layout(doc)
            )
        })
}

#[test]
fn page_css_parses_at_page_size_margins_and_footer() {
    let pb = page_css::parse_page_box(INVOICE);
    assert!((pb.width - 793.7).abs() < 1.0, "A4 width, got {}", pb.width);
    assert!(
        (pb.height - 1122.5).abs() < 1.0,
        "A4 height, got {}",
        pb.height
    );
    assert!((pb.margin_top - 60.47).abs() < 1.0, "16mm top margin");
    let footer = bottom_center(&pb);
    assert!(footer.parts.contains(&ContentPart::CounterPage));
    assert!(footer.parts.contains(&ContentPart::CounterPages));
    assert!(footer
        .parts
        .iter()
        .any(|p| matches!(p, ContentPart::Literal(l) if l.contains("Página"))));
}

#[test]
fn synthetic_at_page_drives_usable_rect() {
    // @page size/margins -> usable content rectangle.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: 400px 600px; margin: 50px; }
    </style></head><body><p>x</p></body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert_eq!(pb.width, 400.0);
    assert_eq!(pb.height, 600.0);
    assert_eq!(pb.content_width(), 300.0);
    assert_eq!(pb.content_height(), 500.0);
}

#[test]
fn counter_template_survives_multibyte_argument() {
    // A multibyte char
    // inside counter(...) must not desync the char-indexed cursor and drop the
    // trailing literal. The earlier `counter(pàge) " end"` input was too weak —
    // a single 2-byte char overshoots by exactly 1 char, landing harmlessly on
    // the SPACE before the literal, so the buggy byte-offset code STILL produced
    // the correct parts. Here we use FIVE `à` chars (a 5-char overshoot) with NO
    // whitespace cushion before the literal, so the byte-offset bug overruns into
    // and past the literal — and we pin the FULL parts vector so both the counter
    // resolution and the exact surviving literal are asserted.
    let html = "<!DOCTYPE html><html><head><style>\
        @page { @bottom-center { content: counter(pàààààge)\"END\"; } }\
        </style></head><body><p>x</p></body></html>";
    let pb = page_css::parse_page_box(html);
    let footer = bottom_center(&pb);
    assert_eq!(
        footer.parts,
        vec![
            ContentPart::CounterPage,
            ContentPart::Literal("END".to_string()),
        ],
        "multibyte counter arg must resolve to CounterPage with the exact trailing literal, got {:?}",
        footer.parts
    );

    // Second case: a multibyte counter arg followed by a SECOND counter token, to
    // catch a desync that corrupts a following token rather than a literal.
    let html2 = "<!DOCTYPE html><html><head><style>\
        @page { @bottom-center { content: counter(pàààge) \"/\" counter(pages); } }\
        </style></head><body><p>x</p></body></html>";
    let pb2 = page_css::parse_page_box(html2);
    let footer2 = bottom_center(&pb2);
    assert_eq!(
        footer2.parts,
        vec![
            ContentPart::CounterPage,
            ContentPart::Literal("/".to_string()),
            ContentPart::CounterPages,
        ],
        "a following counter(pages) must still parse after a multibyte arg, got {:?}",
        footer2.parts
    );
}

#[test]
fn at_page_block_with_non_ascii_declarations_is_utf8_clean() {
    // A non-ASCII char in the @page block's plain declarations must not
    // be mojibaked by a per-byte `as char` cast. The footer literal "Pàg " must
    // round-trip its multibyte `à` through split_margin_boxes -> the parsed parts.
    let html = "<!DOCTYPE html><html><head><style>\
        @page { margin: 10px; @bottom-center { content: \"Pàg \" counter(page); } }\
        </style></head><body><p>x</p></body></html>";
    let pb = page_css::parse_page_box(html);
    let footer = bottom_center(&pb);
    assert!(
        footer
            .parts
            .iter()
            .any(|p| matches!(p, ContentPart::Literal(l) if l == "Pàg ")),
        "multibyte literal is UTF-8 clean, got {:?}",
        footer.parts
    );
    // The 10px margin (plain declaration alongside the margin-box) still parses.
    assert!(
        (pb.margin_top - 10.0).abs() < 1e-6,
        "plain decl still parsed"
    );
}

#[test]
fn at_page_size_with_overflowing_length_falls_back() {
    // `1e400px` parses to f64::INFINITY; the finiteness guard must drop the
    // token so no infinite dimension propagates into pagination/krilla. With a
    // single overflowing token the size keeps its A4 default.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: 1e400px; }
    </style></head><body><p>x</p></body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert!(
        pb.width.is_finite() && pb.height.is_finite(),
        "dimensions must stay finite, got {}x{}",
        pb.width,
        pb.height
    );
    assert!(
        (pb.width - 793.7).abs() < 1.0,
        "infinite size token dropped -> A4 default, got {}",
        pb.width
    );
}

#[test]
fn at_page_multi_token_size_with_one_overflow_does_not_collapse_to_square() {
    // A two-value `size` where ONE token overflows
    // must NOT drop the bad token and reinterpret the survivor as a square page.
    // `size: 1e400px 297mm` must fall back to the documented A4 default
    // (793.7 x 1122.5), NOT a 1122.5 x 1122.5 square.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: 1e400px 297mm; }
    </style></head><body><p>x</p></body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert!(
        pb.width.is_finite() && pb.height.is_finite(),
        "dimensions stay finite, got {}x{}",
        pb.width,
        pb.height
    );
    assert!(
        (pb.width - 793.7).abs() < 1.0 && (pb.height - 1122.5).abs() < 1.0,
        "one-overflow size must fall back to A4, not a 297mm square, got {}x{}",
        pb.width,
        pb.height
    );
    // Explicitly assert it did NOT collapse to a 297mm (~1122.5px) square.
    assert!(
        (pb.width - pb.height).abs() > 1.0,
        "must not be square, got {}x{}",
        pb.width,
        pb.height
    );
}

#[test]
fn at_page_margin_with_one_overflow_keeps_prior_margins() {
    // A four-value `margin` where ONE token overflows must be
    // abandoned wholesale (keep the 16mm A4 default) rather than dropping the bad
    // token and reindexing survivors (which would give t=20 r=30 b=40 l=30).
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { margin: 1e400px 20px 30px 40px; }
    </style></head><body><p>x</p></body></html>"#;
    let pb = page_css::parse_page_box(html);
    // 16mm A4 default ~ 60.47px; the slot-shifted bug would yield 20/30/40/30.
    let m = 16.0 * (96.0 / 25.4);
    for (side, got) in [
        ("top", pb.margin_top),
        ("right", pb.margin_right),
        ("bottom", pb.margin_bottom),
        ("left", pb.margin_left),
    ] {
        assert!(
            (got - m).abs() < 1.0,
            "{side} margin must keep the 16mm default ({m:.2}px), got {got}"
        );
    }
}

#[test]
fn invoice_paginates_into_multiple_pages() {
    // invoice paginates into N>1 pages.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);
    assert!(
        paginated.report.page_count > 1,
        "invoice should span multiple pages, got {}",
        paginated.report.page_count
    );
    // thead repeat flagged on at least one continuation page.
    assert!(
        paginated.report.thead_repeated.iter().any(|&r| r),
        "thead should repeat on a continuation page"
    );
}

#[test]
fn footer_reads_pagina_x_de_y() {
    // footer "Página 1 de N" on page 1, "Página N de N" on last.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);
    let n = paginated.report.page_count;
    assert!(n > 1);
    assert_eq!(
        paginated.report.footers[0],
        format!("Página 1 de {n}"),
        "page 1 footer"
    );
    assert_eq!(
        paginated.report.footers[n - 1],
        format!("Página {n} de {n}"),
        "last page footer"
    );
    for f in &paginated.report.footers {
        assert!(
            f.ends_with(&format!("de {n}")),
            "counter(pages)=={n} everywhere"
        );
    }
}

#[test]
fn render_emits_valid_multipage_pdf() {
    // full render produces a valid N-page PDF.
    let bytes = render(INVOICE.as_bytes(), &opts()).expect("render succeeds");
    assert!(bytes.starts_with(b"%PDF-"), "valid PDF header");
    let doc = lopdf::Document::load_mem(&bytes).expect("lopdf parses output");
    let pages = doc.get_pages().len();
    assert!(pages > 1, "multi-page PDF, got {pages}");

    // Media box matches A4 in pt (~595 x 842).
    for (_, page_id) in doc.get_pages() {
        let dict = doc.get_dictionary(page_id).unwrap();
        if let Ok(mb) = dict.get(b"MediaBox") {
            let arr = mb.as_array().unwrap();
            let w: f32 = arr[2]
                .as_float()
                .unwrap_or(arr[2].as_i64().unwrap_or(0) as f32);
            let h: f32 = arr[3]
                .as_float()
                .unwrap_or(arr[3].as_i64().unwrap_or(0) as f32);
            assert!((w - 595.0).abs() < 2.0, "A4 width in pt, got {w}");
            assert!((h - 842.0).abs() < 2.0, "A4 height in pt, got {h}");
        }
    }
}

#[test]
fn rendered_text_is_selectable_and_contains_invoice_content() {
    // extracted text contains line items, totals, and page label.
    let bytes = render(INVOICE.as_bytes(), &opts()).unwrap();
    let text = pdf_extract::extract_text_from_mem(&bytes).expect("extract text");
    assert!(
        text.contains("WX-A20") || text.contains("SKU"),
        "line items present"
    );
    assert!(
        text.contains("pagar") || text.contains("Total"),
        "totals present"
    );
    assert!(text.contains("Página"), "page-number label present");
}

#[test]
fn inline_text_before_block_child_in_table_cell_survives_layout_and_pdf() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        td { border-bottom: 1px solid #ddd; padding: 8px; }
        .block { display: block !important; color: #666; font-size: 10px; }
    </style></head><body>
        <table><tr><td>
            EXPECTED PRIMARY TEXT
            <span class="block">secondary block span</span>
        </td></tr></table>
    </body></html>"#;

    let laid = blitz_engine::lay_out(html);
    let layout_text = all_layout_text(&laid);
    assert!(
        layout_text.contains("EXPECTED PRIMARY TEXT"),
        "layout text should include the anonymous inline text before the block child, got {layout_text:?}\n{}",
        dump_layout(&laid)
    );
    assert!(
        layout_text.contains("secondary block span"),
        "layout text should include the block span child, got {layout_text:?}"
    );

    let bytes = render(html.as_bytes(), &opts()).expect("render succeeds");
    let pdf_text = pdf_extract::extract_text_from_mem(&bytes).expect("extract text");
    assert!(
        pdf_text.contains("EXPECTED PRIMARY TEXT"),
        "PDF text should include the anonymous inline text before the block child, got {pdf_text:?}"
    );
    assert!(
        pdf_text.contains("secondary block span"),
        "PDF text should include the block span child, got {pdf_text:?}"
    );
}

#[test]
fn inline_text_after_block_child_in_table_cell_survives_layout_and_pdf() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        table { border-collapse: collapse; width: 100%; }
        td { border: 1px solid #ccc; padding: 8px; }
        .label { display: block; color: #666; font-size: 10px; text-transform: uppercase; }
        .value { color: #111; font-size: 14px; font-weight: bold; }
    </style></head><body>
        <table><tr><td>
            <span class="label">expected label</span>
            <span class="value">EXPECTED VALUE TEXT</span>
        </td></tr></table>
    </body></html>"#;

    let laid = blitz_engine::lay_out(html);
    let layout_text = all_layout_text(&laid);
    assert!(
        layout_text.contains("EXPECTED LABEL"),
        "layout text should include the transformed block label, got {layout_text:?}"
    );
    assert!(
        layout_text.contains("EXPECTED VALUE TEXT"),
        "layout text should include the inline value after the block child, got {layout_text:?}\n{}",
        dump_layout(&laid)
    );

    let bytes = render(html.as_bytes(), &opts()).expect("render succeeds");
    let pdf_text = pdf_extract::extract_text_from_mem(&bytes).expect("extract text");
    assert!(
        pdf_text.contains("EXPECTED LABEL"),
        "PDF text should include the transformed block label, got {pdf_text:?}"
    );
    assert!(
        pdf_text.contains("EXPECTED VALUE TEXT"),
        "PDF text should include the inline value after the block child, got {pdf_text:?}"
    );
}

#[test]
fn inline_text_after_block_child_in_div_survives_layout_and_pdf() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        .barcode { font-family: monospace; letter-spacing: 2px; }
        .label { display: block; color: #666; font-size: 10px; text-transform: uppercase; }
    </style></head><body>
        <div class="barcode">
            <span class="label">Código de Barras</span>
            999919990000012345699900001234567000004200
        </div>
    </body></html>"#;

    let laid = blitz_engine::lay_out(html);
    let layout_text = all_layout_text(&laid);
    assert!(
        layout_text.contains("CÓDIGO DE BARRAS"),
        "layout text should include the block label, got {layout_text:?}"
    );
    assert!(
        layout_text.contains("999919990000012345699900001234567000004200"),
        "layout text should include anonymous inline text after block child, got {layout_text:?}\n{}",
        dump_layout(&laid)
    );

    let bytes = render(html.as_bytes(), &opts()).expect("render succeeds");
    let pdf_text = pdf_extract::extract_text_from_mem(&bytes).expect("extract text");
    let compact_pdf_text: String = pdf_text.chars().filter(|c| !c.is_whitespace()).collect();
    assert!(
        compact_pdf_text.contains("999919990000012345699900001234567000004200"),
        "PDF text should include anonymous inline text after block child, got {pdf_text:?}"
    );
}

#[test]
fn inline_sibling_runs_advance_in_document_order() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        .label { padding-right: 24px; color: #666; }
        .value { font-weight: bold; }
    </style></head><body>
        <div><span class="label">LABEL</span><span class="value">VALUE</span></div>
        <div><span class="label">NUMBER</span>INV-2026-00417</div>
    </body></html>"#;

    let laid = blitz_engine::lay_out(html);
    assert_eq!(
        text_run_ranges(&laid, "LABELVALUE"),
        vec![(0, 5), (5, 10)],
        "span siblings should split the shared source text into non-overlapping glyph ranges\n{}",
        dump_layout(&laid)
    );
    assert_eq!(
        text_run_ranges(&laid, "NUMBERINV-2026-00417"),
        vec![(0, 6), (6, 20)],
        "anonymous inline text after a span must not duplicate the entire source text\n{}",
        dump_layout(&laid)
    );

    let label_x = text_run_x_for_range(&laid, "LABELVALUE", (0, 5));
    let value_x = text_run_x_for_range(&laid, "LABELVALUE", (5, 10));
    let number_x = text_run_x_for_range(&laid, "NUMBERINV-2026-00417", (0, 6));
    let invoice_x = text_run_x_for_range(&laid, "NUMBERINV-2026-00417", (6, 20));
    let label_run = text_run_for_range(&laid, "LABELVALUE", (0, 5));
    let label_width: f64 = label_run.glyphs.iter().map(|g| g.advance as f64).sum();
    assert!(
        value_x > label_x,
        "inline span sibling should be placed after label, got label_x={label_x}, value_x={value_x}\n{}",
        dump_layout(&laid)
    );
    assert!(
        value_x >= label_x + label_width + 20.0,
        "inline padding-right should add visible spacing before the next span, got label_end_x={}, value_x={value_x}\n{}",
        label_x + label_width,
        dump_layout(&laid)
    );
    assert!(
        invoice_x > number_x,
        "inline text sibling should be placed after label span, got number_x={number_x}, invoice_x={invoice_x}\n{}",
        dump_layout(&laid)
    );
}

#[test]
fn mixed_weight_inline_siblings_advance_by_the_first_run_width() {
    let first = "Acme Widgets Comércio LTDA";
    let second = "— CNPJ 12.345.678/0001-90";
    let source = format!("{first}{second}");
    let html = format!(
        r#"<!DOCTYPE html><html><head><style>
            body {{ font-family: sans-serif; font-size: 12px; }}
            table {{ border-collapse: collapse; width: 100%; }}
            td {{ padding: 4px; }}
            .strong {{ font-weight: bold; }}
        </style></head><body>
            <table><tr><td>
                <span class="strong">{first}</span><span> {second}</span>
            </td></tr></table>
        </body></html>"#
    );

    let laid = blitz_engine::lay_out(&html);
    let first_range = (0, first.len());
    let second_range = (first.len(), source.len());
    assert_eq!(
        text_run_ranges(&laid, &source),
        vec![first_range, second_range],
        "mixed-weight inline siblings should split into non-overlapping ranges\n{}",
        dump_layout(&laid)
    );

    let first_run = text_run_for_range(&laid, &source, first_range);
    let second_run = text_run_for_range(&laid, &source, second_range);
    let first_width: f64 = first_run.glyphs.iter().map(|g| g.advance as f64).sum();
    let first_end_x = first_run.origin_x + first_width;
    assert!(
        second_run.origin_x >= first_end_x - 0.5,
        "second span should start after the bold span, got first_end_x={first_end_x}, second_x={}\n{}",
        second_run.origin_x,
        dump_layout(&laid)
    );
}

#[test]
fn right_aligned_inline_padding_shifts_previous_run_left() {
    let html = r#"<!DOCTYPE html><html><head><style>
        body { font-family: sans-serif; font-size: 12px; }
        .right { width: 320px; text-align: right; }
        .label { padding-right: 24px; color: #666; }
    </style></head><body>
        <div class="right"><span class="label">Número</span>INV-2026-00417</div>
    </body></html>"#;

    let laid = blitz_engine::lay_out(html);
    let source = "NúmeroINV-2026-00417";
    let label_range = (0, "Número".len());
    let value_range = ("Número".len(), source.len());
    assert_eq!(
        text_run_ranges(&laid, source),
        vec![label_range, value_range],
        "right-aligned label/value should split into non-overlapping ranges\n{}",
        dump_layout(&laid)
    );

    let label_run = text_run_for_range(&laid, source, label_range);
    let value_run = text_run_for_range(&laid, source, value_range);
    let label_width: f64 = label_run.glyphs.iter().map(|g| g.advance as f64).sum();
    assert!(
        value_run.origin_x >= label_run.origin_x + label_width + 20.0,
        "right-aligned padding should create a gap before the value, got label_end_x={}, value_x={}\n{}",
        label_run.origin_x + label_width,
        value_run.origin_x,
        dump_layout(&laid)
    );
}

#[test]
fn rendered_font_is_embedded_and_subset() {
    // embedded subset font + metadata.
    let bytes = render(INVOICE.as_bytes(), &opts()).unwrap();
    let doc = lopdf::Document::load_mem(&bytes).unwrap();
    let mut subset = false;
    let mut embedded = false;
    for (_, obj) in doc.objects.iter() {
        if let Ok(d) = obj.as_dict() {
            if d.has(b"FontFile") || d.has(b"FontFile2") || d.has(b"FontFile3") {
                embedded = true;
            }
            if let Ok(base) = d.get(b"BaseFont").and_then(|o| o.as_name()) {
                if base.len() > 7 && base.get(6) == Some(&b'+') {
                    subset = true;
                }
            }
        }
    }
    assert!(embedded, "font embedded");
    assert!(subset, "font subset (ABCDEF+ prefix)");
}

#[test]
fn each_face_is_embedded_exactly_once_across_pages() {
    // The per-face dedup (face_cache keyed by Blob id in blitz_engine +
    // font_cache keyed by Arc ptr in pdf::emit) must embed each distinct face
    // ONCE, no matter how many runs/pages draw from it. If the Blob-id dedup
    // ever stopped hitting, the same multi-hundred-KB face would be embedded
    // per run and the embedding count would balloon past the face count.
    let bytes = render(INVOICE.as_bytes(), &opts()).unwrap();
    let doc = lopdf::Document::load_mem(&bytes).unwrap();
    let embeds = doc
        .objects
        .values()
        .filter_map(|obj| obj.as_dict().ok())
        .filter(|d| d.has(b"FontFile") || d.has(b"FontFile2") || d.has(b"FontFile3"))
        .count();

    // Distinct faces actually drawn in the laid-out invoice (regular + bold).
    use std::collections::HashSet;
    let laid = blitz_engine::lay_out(INVOICE);
    let faces: HashSet<(usize, u32)> = laid
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .map(|r| (std::sync::Arc::as_ptr(&r.font_data) as usize, r.font_index))
        .collect();

    assert!(!faces.is_empty(), "the invoice draws at least one face");
    assert_eq!(
        embeds,
        faces.len(),
        "expected exactly one embedded font stream per distinct face \
         ({} faces), got {embeds} embeds — per-face dedup regressed",
        faces.len()
    );
}

#[test]
fn metadata_is_deterministic() {
    // producer=vellora, supplied title + creation date recorded.
    let bytes = render(INVOICE.as_bytes(), &opts()).unwrap();
    let doc = lopdf::Document::load_mem(&bytes).unwrap();
    let info_id = doc
        .trailer
        .get(b"Info")
        .and_then(|o| o.as_reference())
        .expect("Info reference present");
    let info = doc.get_dictionary(info_id).expect("Info dict present");
    let producer = info
        .get(b"Producer")
        .and_then(|o| o.as_str())
        .map(|s| String::from_utf8_lossy(s).into_owned())
        .unwrap_or_default();
    assert!(
        producer.contains("vellora"),
        "producer is vellora, got {producer:?}"
    );
    let title = info
        .get(b"Title")
        .and_then(|o| o.as_str())
        .map(|s| String::from_utf8_lossy(s).into_owned())
        .unwrap_or_default();
    assert!(
        title.contains("INV-2026-00417"),
        "title recorded, got {title:?}"
    );
}

#[test]
fn render_is_byte_stable() {
    // two renders -> byte-identical PDF (deterministic).
    let a = render(INVOICE.as_bytes(), &opts()).unwrap();
    let b = render(INVOICE.as_bytes(), &opts()).unwrap();
    assert_eq!(a, b, "render is byte-stable");
}

#[test]
fn input_buffer_is_not_mutated() {
    // input bytes byte-identical before and after a render.
    let input = INVOICE.as_bytes().to_vec();
    let snapshot = input.clone();
    let _ = render(&input, &opts()).unwrap();
    assert_eq!(input, snapshot, "input buffer unchanged after render");
}

#[test]
fn out_of_subset_is_rejected_before_any_pdf() {
    // out-of-subset input -> error, no PDF.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; }
        .x { animation: spin 1s; }
    </style></head><body><div class="x">hi</div></body></html>"#;
    let err = render(html.as_bytes(), &opts()).unwrap_err();
    assert!(
        matches!(err, vellora_core::VelloraError::Unsupported(_)),
        "expected Unsupported, got {err:?}"
    );
}

#[test]
fn render_path_uses_single_shared_parse_for_validation_and_layout() {
    // the gate runs over the SAME parse used for layout (no second
    // HTML parse). `validate_then_lay_out` validates the parsed tree before
    // resolve; in-subset input flows straight to a laid-out tree.
    let clean = blitz_engine::validate_then_lay_out(
        "<!DOCTYPE html><html><body><p>ok</p></body></html>",
        vellora_core::validation::denied_elements(),
        657.6, // content width; irrelevant to this element-gate test
    );
    assert!(
        clean.is_ok(),
        "in-subset input lays out via the shared parse"
    );

    // Out-of-subset input is rejected by that same walk BEFORE layout.
    let denied = blitz_engine::validate_then_lay_out(
        "<!DOCTYPE html><html><body><script>x</script></body></html>",
        vellora_core::validation::denied_elements(),
        657.6, // content width; irrelevant to this element-gate test
    );
    match denied {
        Err(found) => assert_eq!(found.tag, "script"),
        Ok(_) => panic!("script should be rejected before layout"),
    }
}

#[test]
fn empty_document_yields_one_blank_page() {
    // pagination "at least one page" + pdf-output "empty doc valid one-page".
    let bytes = render(b"<!DOCTYPE html><html></html>", &opts()).unwrap();
    assert!(bytes.starts_with(b"%PDF-"));
    let doc = lopdf::Document::load_mem(&bytes).unwrap();
    assert_eq!(doc.get_pages().len(), 1, "exactly one blank page");
}
