//! Paint order of the display list (vellora's painter, not Blitz): CSS 2.1 Appendix E paints the
//! backgrounds and borders of block-level boxes (step 4) before inline-level content (step 7),
//! where an atomic inline (`inline-block`, `inline-table`, ...) is painted as a whole. So a later
//! block's background never covers an earlier atomic inline's. Chrome 155: WPT
//! `css/CSS2/normal-flow/inline-table-zorder-001.xht` (green inline-table, then a block with a
//! red background pulled over it by `margin-top: -2em`: all green).

use vellora_core::{blitz_engine, page_css, pagination, validation};

/// The WPT test's markup (16 px font: 2em = 32 px squares at the body's 8 px margin).
const ZORDER: &str = r#"<!DOCTYPE html><html><head><style>
div { width: 2em; height: 2em; }
span { display: inline-table; vertical-align: top; width: 2em; height: 2em; background: green; }
div#after { margin-top: -2em; background: red; }
</style></head><body><div><span>&#160;</span></div><div id="after">&#160;</div></body></html>"#;

/// The fill colours of page 1's rects, in paint order.
fn page_rects(html: &str) -> Vec<[u8; 3]> {
    let page_box = page_css::parse_page_box(html);
    let doc = blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        page_box.layout_content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");
    pagination::paginate(&doc, &page_box).pages[0]
        .rects
        .iter()
        .map(|r| r.color)
        .collect()
}

#[test]
fn an_inline_table_paints_over_a_later_blocks_background() {
    let rects = page_rects(ZORDER);
    let green = rects.iter().position(|c| *c == [0, 128, 0]);
    let red = rects.iter().position(|c| *c == [255, 0, 0]);
    let (Some(green), Some(red)) = (green, red) else {
        panic!("both backgrounds are painted: {rects:?}");
    };
    assert!(
        green > red,
        "green inline-table after the red block: {rects:?}"
    );
}

/// Block backgrounds keep their order among themselves: a later block still covers an earlier
/// overlapping block (same markup, the span a plain block).
#[test]
fn a_later_block_still_paints_over_an_earlier_block() {
    let rects = page_rects(&ZORDER.replace("display: inline-table", "display: block"));
    let green = rects.iter().position(|c| *c == [0, 128, 0]);
    let red = rects.iter().position(|c| *c == [255, 0, 0]);
    assert!(green < red, "red block after the green one: {rects:?}");
}
