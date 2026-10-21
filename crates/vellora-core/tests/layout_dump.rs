//! The debug layout dump (`vellora_core::debug_layout_dump`, used only by
//! `fidelity/layout-diff/`) must observe the render path without changing it:
//! its final layer is exactly the box list `render` paginates, its layers are
//! the named normalize passes in render order, keys follow the SOURCE DOM even
//! when html_normalize inserts wrappers, and calling it leaves PDF bytes alone.
//! The source-HTML variant (`debug_layout_dump_source_html`, fidelity layer
//! `N0`) skips html_normalize so the tooling can tell its effect apart from
//! Blitz's own layout.
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
        page_box.content_width(),
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
    assert_eq!(dump.viewport_width_px, page_box.content_width() as u32);
}

#[test]
fn layers_are_l0_then_every_named_pass_in_order() {
    let dump = debug_layout_dump(INVOICE.as_bytes(), &opts()).expect("dump");
    let names: Vec<&str> = dump.layers.iter().map(|l| l.name.as_str()).collect();
    assert_eq!(
        names,
        [
            "L0",
            "vertical_margin_collapse",
            "collapsed_table_medium_border_insets",
            "painted_table_cell_text_baselines",
            "fixed_table_widths",
            "table_percent_widths",
            "auto_table_compact_columns",
            "collapsed_table_medium_border_insets_x",
        ]
    );
    assert!(!dump.blitz_tree.is_empty());
    assert_eq!(dump.media_type, "screen");
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
fn keys_follow_the_source_dom_through_normalize_wrappers() {
    // html_normalize wraps the inline run "lead <b>bold</b>" (next to a block
    // child) in a synthetic <div>. The source DOM has <b> as the 1st and <p> as
    // the 2nd element child of the section; keys must say so.
    let html = "<!DOCTYPE html><html><head></head><body>\
        <section id=\"s\">lead <b>bold</b><p class=\"para\">para</p></section>\
        </body></html>";
    let dump = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    assert_eq!(dump.normalize_wrappers_recorded, 1);
    assert_eq!(dump.normalize_wrappers_located, 1);
    let path_of = |tag: &str| {
        dump.nodes
            .iter()
            .find(|n| n.tag.as_deref() == Some(tag) && !n.synthetic)
            .map(|n| n.dom_path.clone())
            .unwrap_or_default()
    };
    assert_eq!(
        path_of("b"),
        "html>body:nth-child(2)>section:nth-child(1)>b:nth-child(1)"
    );
    assert_eq!(
        path_of("p"),
        "html>body:nth-child(2)>section:nth-child(1)>p:nth-child(2)"
    );
    let wrapper = dump.nodes.iter().find(|n| n.synthetic).expect("wrapper");
    assert_eq!(
        wrapper.dom_path,
        "html>body:nth-child(2)>section:nth-child(1)>::vellora-wrapper(1)"
    );
    let section = dump
        .nodes
        .iter()
        .find(|n| n.id_attr.as_deref() == Some("s"))
        .expect("section");
    assert_eq!(section.tag.as_deref(), Some("section"));
}

fn path_of_tag(dump: &layout_dump::LayoutDump, tag: &str) -> String {
    dump.nodes
        .iter()
        .find(|n| n.tag.as_deref() == Some(tag) && !n.synthetic && n.kind == "element")
        .map(|n| n.dom_path.clone())
        .unwrap_or_default()
}

#[test]
fn source_html_dump_skips_normalize_and_keys_blitz_anonymous_blocks() {
    // Same input as above. Without html_normalize, Blitz itself wraps the inline
    // run "lead <b>bold</b>" in an ANONYMOUS block: it exists only in Blitz's
    // layout tree (layout_children) and is keyed `::blitz-anon(j)` under its
    // layout parent. Source-DOM keys of real elements match the normalized dump.
    let html = "<!DOCTYPE html><html><head></head><body>\
        <section id=\"s\">lead <b>bold</b><p class=\"para\">para</p></section>\
        </body></html>";
    let normalized = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    let source = debug_layout_dump_source_html(html.as_bytes(), &opts()).expect("source dump");
    assert!(normalized.html_normalize_applied);
    assert!(!source.html_normalize_applied);
    assert_eq!(source.normalize_wrappers_recorded, 0);
    assert!(source.nodes.iter().all(|n| !n.synthetic));
    for tag in ["section", "b", "p"] {
        assert_eq!(
            path_of_tag(&source, tag),
            path_of_tag(&normalized, tag),
            "{tag}"
        );
    }
    let section = "html>body:nth-child(2)>section:nth-child(1)";
    let anon: Vec<&str> = source
        .nodes
        .iter()
        .filter(|n| n.kind == "anonymous")
        .map(|n| n.dom_path.as_str())
        .collect();
    assert!(
        anon.contains(&format!("{section}>::blitz-anon(1)").as_str()),
        "anonymous blocks: {anon:?}"
    );
    // Every anonymous node is a box of Blitz's own layout tree.
    for node in source.nodes.iter().filter(|n| n.kind == "anonymous") {
        assert!(source.blitz_tree.iter().any(|b| b.node_id == node.node_id));
    }
}

#[test]
fn wrapper_hoisted_out_of_a_paragraph_is_detected() {
    // CHARACTERIZATION of a production html_normalize defect (Phase B): inside a
    // <p> with a display:block child, html_normalize wraps the trailing inline run
    // in a <div>, but <div> cannot live in <p>, so Blitz's HTML parser closes the
    // <p> before it when re-parsing the serialized output. The wrapper is then not
    // where it was recorded, and later siblings' keys shift. The dump must SAY so
    // (recorded != located) instead of silently mis-keying, and the source-HTML
    // dump keeps the true source keys. When html_normalize stops producing
    // non-round-tripping HTML, recorded == located and this test must be updated.
    let html = "<!DOCTYPE html><html><head><style>.big { display: block }</style></head>\
        <body><p class=\"thanks\"><span class=\"big\">Thanks!</span> note</p>\
        <footer class=\"fine\">fine print</footer></body></html>";
    let normalized = debug_layout_dump(html.as_bytes(), &opts()).expect("dump");
    let source = debug_layout_dump_source_html(html.as_bytes(), &opts()).expect("source dump");
    assert_eq!(normalized.normalize_wrappers_recorded, 1);
    assert_eq!(normalized.normalize_wrappers_located, 0);
    assert_eq!(
        path_of_tag(&source, "footer"),
        "html>body:nth-child(2)>footer:nth-child(2)"
    );
    assert_ne!(
        path_of_tag(&normalized, "footer"),
        path_of_tag(&source, "footer")
    );
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
    // vertical-align: middle -> Blitz block_offset, which the walk drops.
    let mid = blitz_run(&dump, "MID");
    assert!(mid.block_offset > 1.0, "{}", mid.block_offset);
    let (_, mid_y) = l0_run(&dump, "MID");
    assert!((mid_y - (mid.origin_y - mid.block_offset)).abs() < 0.01);
}

#[test]
fn source_dump_text_includes_anonymous_block_runs_the_walk_drops() {
    let source = debug_layout_dump_source_html(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    let lead = blitz_run(&source, "lead ");
    let owner = source
        .nodes
        .iter()
        .find(|n| n.node_id == lead.owner_node_id)
        .expect("owner node");
    assert_eq!(owner.kind, "anonymous");
    assert_eq!(
        owner.dom_path,
        "html>body:nth-child(2)>section:nth-child(4)>::blitz-anon(1)"
    );
    // Without html_normalize's wrapper, vellora's DOM-children walk never reads it.
    assert!(l0_runs(&source).iter().all(|(t, _, _)| t != "lead "));
    // With the wrapper (render path) the walk reads it where Blitz placed it.
    let dump = debug_layout_dump(TEXT_PROBE.as_bytes(), &opts()).expect("dump");
    assert_eq!(l0_run(&dump, "lead "), (lead.origin_x, lead.origin_y));
}

#[test]
fn pagination_trace_is_consistent_with_paginate() {
    let dump = debug_layout_dump(INVOICE.as_bytes(), &opts()).expect("dump");
    let trace = dump.pagination.as_ref().expect("pagination trace");
    let page_box = page_css::parse_page_box(INVOICE);
    let laid_out = blitz_engine::validate_then_lay_out(
        INVOICE,
        validation::denied_elements(),
        page_box.content_width(),
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
            let dy = offset + page_box.margin_top;
            for id in &ids {
                for run in &boxes[id].text_runs {
                    let y = run.origin_y + dy;
                    let x = run.origin_x + page_box.margin_left;
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
        page_box.content_width(),
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
