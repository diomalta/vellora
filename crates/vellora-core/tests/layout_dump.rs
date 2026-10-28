//! The debug layout dump (`vellora_core::debug_layout_dump`, used only by
//! `fidelity/layout-diff/`) must observe the render path without changing it:
//! its final layer is exactly the box list `render` paginates, its layers are
//! the named normalize passes in render order, keys follow the SOURCE DOM (Blitz
//! anonymous blocks keyed under their layout parent), and calling it leaves PDF
//! bytes alone. The source-HTML variant (`debug_layout_dump_source_html`,
//! fidelity layer `N0`) once separated the `html_normalize` pre-pass from
//! Blitz's own layout; since port step 05 deleted that pre-pass it lays out
//! exactly what the render path does.
//!
//! Schema 2 adds the RAW Blitz/Parley text of the Blitz tree (`blitz_runs`: the
//! `B0`/`N0` text layers, before vellora's reader compensations) and the
//! pagination trace (`P`: every fragment placement of `paginate`).

use vellora_core::page_css;
use vellora_core::{
    blitz_engine, debug_layout_dump, debug_layout_dump_source_html, layout_dump, pagination,
    render, validation, RenderOptions,
};

const INVOICE: &str = include_str!("fixtures/invoice.html");

fn opts() -> RenderOptions {
    RenderOptions {
        title: Some("layout-dump".to_string()),
        creation_date: Some((2026, 6, 23)),
        ..Default::default()
    }
}

#[test]
fn final_layer_is_exactly_what_render_lays_out() {
    let dump = debug_layout_dump(INVOICE.as_bytes(), &opts()).expect("dump");
    let page_box = page_css::parse_page_box(INVOICE);
    let laid_out = blitz_engine::validate_then_lay_out(
        INVOICE,
        validation::denied_elements(),
        page_box.layout_content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");

    let last = dump.layers.last().expect("layers");
    assert_eq!(last.boxes.len(), laid_out.boxes.len());
    for (dumped, real) in last.boxes.iter().zip(&laid_out.boxes) {
        assert_eq!(dumped.node_id, real.node_id);
        assert_eq!(
            (dumped.x, dumped.y, dumped.width, dumped.height),
            (real.x, real.y, real.width, real.height)
        );
        assert_eq!(dumped.runs.len(), real.text_runs.len());
        for (d, r) in dumped.runs.iter().zip(&real.text_runs) {
            assert_eq!((d.origin_x, d.origin_y), (r.origin_x, r.origin_y));
        }
    }
    assert!(dump.layer_order_violations.is_empty());
    assert!(dump.run_meta_mismatches.is_empty());
    assert_eq!(
        dump.viewport_width_px,
        page_box.layout_content_width() as u32
    );
}

#[test]
fn layers_are_l0_then_every_named_pass_in_order() {
    let dump = debug_layout_dump(INVOICE.as_bytes(), &opts()).expect("dump");
    let names: Vec<&str> = dump.layers.iter().map(|l| l.name.as_str()).collect();
    assert_eq!(
        names,
        ["L0", "table_percent_widths", "auto_table_compact_columns",]
    );
    assert!(!dump.blitz_tree.is_empty());
    assert_eq!(dump.media_type, "print");
}

#[test]
fn dumping_does_not_change_pdf_bytes() {
    let before = render(INVOICE.as_bytes(), &opts()).expect("render");
    let _ = debug_layout_dump(INVOICE.as_bytes(), &opts()).expect("dump");
    let after = render(INVOICE.as_bytes(), &opts()).expect("render");
    assert_eq!(before, after);
    let _ = debug_layout_dump_source_html(INVOICE.as_bytes(), &opts()).expect("source dump");
    let after_source = render(INVOICE.as_bytes(), &opts()).expect("render");
    assert_eq!(before, after_source);
}

#[test]
fn keys_follow_the_source_dom_and_anonymous_blocks_are_walked() {
    // Blitz wraps the inline run "lead <b>bold</b>" (next to a block child) in an
    // ANONYMOUS block: it exists only in Blitz's layout tree and is keyed
    // `::blitz-anon(j)` under its layout parent. Since port step 05 the box walk
    // reads it (layer L0 has it, with the run). The source DOM has <b> as the 1st
    // and <p> as the 2nd element child of the section; keys must say so.
    let html = "<!DOCTYPE html><html><head></head><body>\
        <section id=\"s\">lead <b>bold</b><p class=\"para\">para</p></section>\
        </body></html>";
    let dump = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    let section = "html>body:nth-child(2)>section:nth-child(1)";
    assert_eq!(path_of_tag(&dump, "b"), format!("{section}>b:nth-child(1)"));
    assert_eq!(path_of_tag(&dump, "p"), format!("{section}>p:nth-child(2)"));
    let anon = dump
        .nodes
        .iter()
        .find(|n| n.kind == "anonymous")
        .expect("anonymous block");
    assert_eq!(anon.dom_path, format!("{section}>::blitz-anon(1)"));
    // Every anonymous node is a box of Blitz's own layout tree, and of L0.
    for node in dump.nodes.iter().filter(|n| n.kind == "anonymous") {
        assert!(dump.blitz_tree.iter().any(|b| b.node_id == node.node_id));
        assert!(dump.layers[0]
            .boxes
            .iter()
            .any(|b| b.node_id == node.node_id));
    }
    let lead = dump
        .runs
        .iter()
        .find(|m| m.text == "lead ")
        .expect("the anonymous block's run is in L0");
    assert_eq!(lead.owner_node_id, anon.node_id);
}

fn path_of_tag(dump: &layout_dump::LayoutDump, tag: &str) -> String {
    dump.nodes
        .iter()
        .find(|n| n.tag.as_deref() == Some(tag) && n.kind == "element")
        .map(|n| n.dom_path.clone())
        .unwrap_or_default()
}

#[test]
fn source_html_dump_lays_out_exactly_what_the_render_path_does() {
    // There is no HTML pre-pass any more (port step 05 deleted html_normalize),
    // so the source-HTML dump (layer N0) and the render-path dump (B0) are the
    // same Blitz layout: same nodes, same keys, same boxes.
    let html = "<!DOCTYPE html><html><head></head><body>\
        <section id=\"s\">lead <b>bold</b><p class=\"para\">para</p></section>\
        </body></html>";
    let dump = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    let source = debug_layout_dump_source_html(html.as_bytes(), &opts()).expect("source dump");
    assert!(!dump.source_html);
    assert!(source.source_html);
    assert!(source.pagination.is_none());
    let keys = |d: &layout_dump::LayoutDump| -> Vec<(String, &'static str)> {
        d.nodes
            .iter()
            .map(|n| (n.dom_path.clone(), n.kind))
            .collect()
    };
    assert_eq!(keys(&source), keys(&dump));
    let boxes = |d: &layout_dump::LayoutDump| -> Vec<(f64, f64, f64, f64)> {
        d.blitz_tree
            .iter()
            .map(|b| (b.x, b.y, b.width, b.height))
            .collect()
    };
    assert_eq!(boxes(&source), boxes(&dump));
}

#[test]
fn text_after_a_block_span_stays_in_its_paragraph() {
    // The receipt's `p.thanks` shape: a display:block span inside a <p>, then
    // text. Blitz puts the text in an anonymous block of the <p>. html_normalize
    // used to wrap it in a <div>, which the HTML re-parse hoisted out of the <p>
    // (wrappers recorded 1, located 0; the footer re-keyed as nth-child(4)).
    let html = "<!DOCTYPE html><html><head><style>.big { display: block }</style></head>\
        <body><p class=\"thanks\"><span class=\"big\">Thanks!</span> note</p>\
        <footer class=\"fine\">fine print</footer></body></html>";
    let dump = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    assert_eq!(
        path_of_tag(&dump, "footer"),
        "html>body:nth-child(2)>footer:nth-child(2)"
    );
    let note = dump
        .runs
        .iter()
        .find(|m| m.text.trim() == "note")
        .expect("note run");
    let owner = dump
        .nodes
        .iter()
        .find(|n| n.node_id == note.owner_node_id)
        .expect("owner");
    assert_eq!(owner.kind, "anonymous");
    assert_eq!(
        owner.dom_path,
        "html>body:nth-child(2)>p:nth-child(1)>::blitz-anon(1)"
    );
}

/// Abspos box nested in a non-positioned `<p>` inside a relative container
/// (Chrome 155: 48, 35; `tests/walk.rs`).
const ABSPOS_PROBE: &str = "<!DOCTYPE html><html><head><style>\
    @page { size: A4; margin: 18mm; }\
    body { margin: 8px; font: 16px/20px \"Liberation Sans\"; }\
    .rel { position: relative; margin-top: 30px; padding: 10px; }\
    .abs { position: absolute; top: 5px; left: 40px; width: 50px; height: 20px; }\
    </style></head><body><div class=\"rel\"><p>para <span class=\"abs\" id=\"abs\">x</span></p></div>\
    </body></html>";

#[test]
fn b0_and_l0_place_an_abspos_box_on_its_containing_block() {
    // B0 places every box the way Blitz's painter does (location + origin of the
    // containing block); the walk (L0) reads the same position. Accumulating under
    // the layout parent put this box at 58, 61 in both layers before step 05.
    let dump = debug_layout_dump(ABSPOS_PROBE.as_bytes(), &opts()).expect("dump");
    let id = dump
        .nodes
        .iter()
        .find(|n| n.id_attr.as_deref() == Some("abs"))
        .expect("span")
        .node_id;
    let b0 = dump
        .blitz_tree
        .iter()
        .find(|b| b.node_id == id)
        .expect("B0 box");
    assert_eq!((b0.x, b0.y, b0.width, b0.height), (48.0, 35.0, 50.0, 20.0));
    let l0 = dump.layers[0]
        .boxes
        .iter()
        .find(|b| b.node_id == id)
        .expect("L0 box");
    assert_eq!((l0.x, l0.y), (b0.x, b0.y));
}
// ---------------------------------------------------------------------------
// Schema 2: raw Blitz text (B0/N0 text layers) and the pagination trace (P).
// ---------------------------------------------------------------------------

/// Probe covering every reader compensation the walk applies to Parley runs:
/// a padded inline span (left-aligned and right-aligned lines), an inline run
/// next to a block child (anonymous block in the source DOM), and a
/// vertically centred table cell (Blitz `block_offset`).
const TEXT_PROBE: &str = "<!DOCTYPE html><html><head><style>\
    @page { size: A4; margin: 18mm; }\
    body { font-family: sans-serif; font-size: 12px; }\
    .label { padding-right: 24px; color: #666; }\
    .value { font-weight: bold; }\
    .right { width: 320px; text-align: right; }\
    </style></head><body>\
    <div class=\"plain\">plain text line</div>\
    <div><span class=\"label\">LABEL</span><span class=\"value\">VALUE</span></div>\
    <div class=\"right\"><span class=\"label\">Número</span>INV-2026-00417</div>\
    <section id=\"s\">lead <b>bold</b><p class=\"para\">para</p></section>\
    <table><tr><td style=\"height:60px;vertical-align:middle\">MID</td></tr></table>\
    </body></html>";

/// `(text, origin_x, origin_y)` of every L0 run of a dump.
fn l0_runs(dump: &layout_dump::LayoutDump) -> Vec<(String, f64, f64)> {
    let l0 = &dump.layers[0];
    dump.runs
        .iter()
        .map(|meta| {
            let geom = l0.boxes[meta.box_index].runs[meta.run_index];
            (meta.text.clone(), geom.origin_x, geom.origin_y)
        })
        .collect()
}

fn blitz_run<'a>(dump: &'a layout_dump::LayoutDump, text: &str) -> &'a layout_dump::DumpBlitzRun {
    dump.blitz_runs
        .iter()
        .find(|r| r.text == text)
        .unwrap_or_else(|| panic!("no blitz run {text:?}: {:?}", dump.blitz_runs))
}

fn l0_run(dump: &layout_dump::LayoutDump, text: &str) -> (f64, f64) {
    l0_runs(dump)
        .into_iter()
        .find(|(t, _, _)| t == text)
        .map(|(_, x, y)| (x, y))
        .unwrap_or_else(|| panic!("no L0 run {text:?}"))
}

#[test]
fn blitz_runs_cover_every_inline_root_of_the_blitz_tree() {
    let dump = debug_layout_dump(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    // Every L0 run has a raw counterpart with the same owner and text, in order.
    for meta in &dump.runs {
        assert!(
            dump.blitz_runs
                .iter()
                .any(|r| r.owner_node_id == meta.owner_node_id
                    && r.text == meta.text
                    && r.glyph_count == meta.glyph_count),
            "L0 run {:?} has no raw Blitz run",
            meta.text
        );
    }
    // Every raw run is owned by a box of the Blitz tree.
    for run in &dump.blitz_runs {
        assert!(dump
            .blitz_tree
            .iter()
            .any(|b| b.node_id == run.owner_node_id));
    }
    // Text without any compensation is read identically by the walk and Blitz.
    let raw = blitz_run(&dump, "plain text line");
    assert_eq!(
        l0_run(&dump, "plain text line"),
        (raw.origin_x, raw.origin_y)
    );
    assert_eq!(raw.block_offset, 0.0);
}

#[test]
fn l0_text_differs_from_raw_blitz_by_the_reader_compensations() {
    let dump = debug_layout_dump(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    // Inline padding-right: Blitz (beta.4) does not advance the following run by
    // the span's 24 px padding; the walk adds it (`inline_padding_right_px`).
    let label = blitz_run(&dump, "LABEL");
    let value = blitz_run(&dump, "VALUE");
    assert!((value.origin_x - (label.origin_x + label.advance)).abs() < 0.01);
    let (value_x, _) = l0_run(&dump, "VALUE");
    assert!(
        (value_x - (value.origin_x + 24.0)).abs() < 0.01,
        "{value_x}"
    );
    // Right-aligned line: the walk instead moves the padded run left by 24 px.
    let numero = blitz_run(&dump, "Número");
    let (numero_x, _) = l0_run(&dump, "Número");
    assert!(
        (numero_x - (numero.origin_x - 24.0)).abs() < 0.01,
        "{numero_x}"
    );
    let inv = blitz_run(&dump, "INV-2026-00417");
    assert_eq!(l0_run(&dump, "INV-2026-00417").0, inv.origin_x);
    // vertical-align: middle -> Blitz block_offset. Since port step 04 the walk
    // reads it like Blitz's painter does (content box + block_offset + baseline),
    // so the centred cell's text is NOT a reader compensation any more.
    let mid = blitz_run(&dump, "MID");
    assert!(mid.block_offset > 1.0, "{}", mid.block_offset);
    let (_, mid_y) = l0_run(&dump, "MID");
    assert!(
        (mid_y - mid.origin_y).abs() < 0.01,
        "{mid_y} vs {}",
        mid.origin_y
    );
}

#[test]
fn walk_reads_anonymous_block_runs_where_blitz_places_them() {
    let dump = debug_layout_dump(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    let lead = blitz_run(&dump, "lead ");
    let owner = dump
        .nodes
        .iter()
        .find(|n| n.node_id == lead.owner_node_id)
        .expect("owner node");
    assert_eq!(owner.kind, "anonymous");
    assert_eq!(
        owner.dom_path,
        "html>body:nth-child(2)>section:nth-child(4)>::blitz-anon(1)"
    );
    // The box walk follows Blitz's layout tree (port step 05), so it reads the
    // anonymous block's run where Blitz placed it; the DOM-children walk did
    // not read it at all (html_normalize's wrapper stood in for it).
    assert_eq!(l0_run(&dump, "lead "), (lead.origin_x, lead.origin_y));
    let source = debug_layout_dump_source_html(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    assert_eq!(l0_run(&source, "lead "), (lead.origin_x, lead.origin_y));
}

#[test]
fn pagination_trace_is_consistent_with_paginate() {
    let dump = debug_layout_dump(INVOICE.as_bytes(), &opts()).expect("dump");
    let trace = dump.pagination.as_ref().expect("pagination trace");
    let page_box = page_css::parse_page_box(INVOICE);
    let laid_out = blitz_engine::validate_then_lay_out(
        INVOICE,
        validation::denied_elements(),
        page_box.layout_content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");
    let paginated = pagination::paginate(&laid_out, &page_box);
    assert_eq!(trace.page_count, paginated.report.page_count);
    assert!(trace.page_count >= 2, "invoice fixture paginates");

    // Placement arithmetic: gap then (optional) repeated header, then the fragment.
    let mut previous: Option<&pagination::FragmentPlacement> = None;
    for p in &trace.placements {
        let header = p.header_injected.as_ref().map_or(0.0, |h| h.height);
        assert!(
            (p.placed_top - (p.cursor_before + p.gap_applied + header)).abs() < 1e-9,
            "{p:?}"
        );
        if let Some(prev) = previous {
            assert!(p.page >= prev.page);
            assert_eq!(p.pending_gap, prev.trailing_gap);
            assert_eq!(p.pending_gap_source, prev.gap_source);
            if p.page == prev.page {
                let prev_end = prev.placed_top + (prev.bottom - prev.top);
                assert!((p.cursor_before - prev_end).abs() < 1e-9, "{p:?}");
            } else {
                assert!(p.new_page.is_some(), "{p:?}");
                assert_eq!(p.cursor_before, 0.0);
            }
        }
        previous = Some(p);
    }

    // Every text run the trace places lands on that page, shifted by the
    // placement offset (+ the @page margins added when lowering to the page).
    // A repeated <thead> band sits right above its fragment (`placed_top - height`).
    let boxes: std::collections::HashMap<usize, &blitz_engine::LaidOutBox> =
        laid_out.boxes.iter().map(|b| (b.node_id, b)).collect();
    let mut headers = 0;
    for p in &trace.placements {
        let page = &paginated.pages[p.page];
        let mut groups = vec![(p.node_ids.clone(), p.placed_top - p.top)];
        if let Some(h) = &p.header_injected {
            headers += 1;
            groups.push((h.node_ids.clone(), p.placed_top - h.height - h.top));
        }
        for (ids, offset) in groups {
            let (origin_x, origin_y) = page_box.content_origin(false);
            let dy = offset + origin_y;
            for id in &ids {
                for run in &boxes[id].text_runs {
                    let y = run.origin_y + dy;
                    let x = run.origin_x + origin_x;
                    assert!(
                        page.text_runs.iter().any(|r| (r.origin_y - y).abs() < 1e-6
                            && (r.origin_x - x).abs() < 1e-6
                            && r.glyphs.len() == run.glyphs.len()),
                        "run of node {id} not on page {} at ({x}, {y})",
                        p.page
                    );
                }
            }
        }
    }
    assert!(
        headers >= 2,
        "the invoice items <thead> is injected on each page"
    );
}

#[test]
fn pagination_trace_names_the_gap_source() {
    // The gap before a flattened wrapper's first child is the FLOW gap: the
    // previous fragment's margin-bottom (10 px) plus the wrapper's padding-top
    // (40 px). Phase A's model applied only the 10 px margin and lifted the child
    // 40 px above its flow top (pre-`phaseb/01-pagination-gaps` characterization);
    // now every fragment on page 1 sits at its flow position (drift 0).
    let html = "<!DOCTYPE html><html><head><style>\
        body { margin: 0; font-family: sans-serif; font-size: 12px; }\
        .a { margin-bottom: 10px; } .w { padding-top: 40px; } .w p { margin: 0; }\
        </style></head><body><div class=\"a\">A</div>\
        <div class=\"w\"><p>B</p><p>C</p></div></body></html>";
    let dump = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    let trace = dump.pagination.expect("trace");
    assert_eq!(trace.placements.len(), 3, "{:?}", trace.placements);
    let [a, b, c] = [
        &trace.placements[0],
        &trace.placements[1],
        &trace.placements[2],
    ];
    assert_eq!(
        b.top - a.bottom,
        50.0,
        "flow gap: margin-bottom + wrapper padding-top"
    );
    assert_eq!(
        (a.kind, a.gap_note, a.pending_gap_source),
        ("block", "page-origin", "flow-origin")
    );
    assert_eq!((a.gap_source, a.trailing_gap), ("flow-gap", 50.0));
    assert_eq!(
        (
            b.pending_gap_source,
            b.pending_gap,
            b.gap_applied,
            b.gap_note
        ),
        ("flow-gap", 50.0, 50.0, "applied")
    );
    assert_eq!(b.placed_top - b.top, 0.0);
    assert_eq!((c.gap_applied, c.gap_note), (0.0, "none"));
    assert_eq!((c.gap_source, c.trailing_gap), ("none", 0.0));
    assert_eq!(c.placed_top - c.top, 0.0);
    assert_eq!(c.page, 0);
}

#[test]
fn tracing_pagination_does_not_change_the_pages() {
    let page_box = page_css::parse_page_box(INVOICE);
    let laid_out = blitz_engine::validate_then_lay_out(
        INVOICE,
        validation::denied_elements(),
        page_box.layout_content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");
    let meta = vellora_core::DocMeta {
        title: Some("trace".into()),
        creation_date: Some((2026, 6, 23)),
        pdfa: None,
    };
    let plain = pagination::paginate(&laid_out, &page_box);
    let mut trace = pagination::PaginationTrace::default();
    let traced = pagination::paginate_traced(&laid_out, &page_box, Some(&mut trace));
    assert!(!trace.placements.is_empty());
    assert_eq!(
        vellora_core::pdf::emit(&plain.pages, &meta).ok(),
        vellora_core::pdf::emit(&traced.pages, &meta).ok()
    );
}

#[test]
fn json_schema_2_carries_text_and_pagination_layers() {
    let dump = debug_layout_dump(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    let json = layout_dump::json::to_json(&dump);
    assert!(json.starts_with("{\"schema\":\"vellora-layout-dump/2\""));
    assert!(json.contains("\"blitz_runs\":[{\"owner\":"));
    assert!(json.contains("\"block_offset\":"));
    assert!(json.contains("\"pagination\":{\"page_count\":1,"));
    assert!(json.contains("\"pending_gap_source\":\"flow-origin\""));
    assert!(json.contains("\"gap_note\":\"page-origin\""));
    let source = debug_layout_dump_source_html(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    let source_json = layout_dump::json::to_json(&source);
    assert!(source_json.ends_with(",\"pagination\":null}"));
    assert!(source_json.contains("\"text\":\"lead \""));
}
