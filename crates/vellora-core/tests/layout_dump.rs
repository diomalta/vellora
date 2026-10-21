//! The debug layout dump (`vellora_core::debug_layout_dump`, used only by
//! `fidelity/layout-diff/`) must observe the render path without changing it:
//! its final layer is exactly the box list `render` paginates, its layers are
//! the named normalize passes in render order, keys follow the SOURCE DOM even
//! when html_normalize inserts wrappers, and calling it leaves PDF bytes alone.

use vellora_core::page_css;
use vellora_core::{blitz_engine, debug_layout_dump, render, validation, RenderOptions};

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
