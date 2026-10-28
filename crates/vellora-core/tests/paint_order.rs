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

/// Page 1's rects and images in the order `pdf::emit` draws them: `("rect", colour)` or
/// `("image", [0, 0, 0])`.
fn paint_sequence(html: &str) -> Vec<(&'static str, [u8; 3])> {
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
    let pages = pagination::paginate(&doc, &page_box).pages;
    let page = &pages[0];
    vellora_core::pdf::paint_sequence(page)
        .into_iter()
        .map(|item| match item {
            vellora_core::pdf::PaintItem::Rect(i) => ("rect", page.rects[i].color),
            vellora_core::pdf::PaintItem::Image(_) => ("image", [0, 0, 0]),
        })
        .collect()
}

/// The markup of WPT css/CSS2/normal-flow/inline-replaced-width-009 (`svg_style` empty),
/// inline-block-replaced-width-008 (`display: inline-block`) and
/// css/CSS2/positioning/absolute-replaced-width-003c (`position: absolute` on both): a red
/// inline `<svg>`, then a green box that is `position: relative` (pulled over the SVG by
/// `bottom: 300px`) or `position: absolute` (at its static position, over the SVG).
fn svg_under_green(svg_style: &str, green: &str) -> String {
    format!(
        r#"<!DOCTYPE html><html><head><style>
        div {{ height: 300px; width: 600px; }}
        svg {{ vertical-align: top; {svg_style} }}
        div#green {{ background-color: green; height: 300px; width: 300px; {green} }}
        </style></head><body><div>
        <svg xmlns="http://www.w3.org/2000/svg" height="300"><rect width="600" height="300" fill="red"/></svg>
        <div id="green"></div></div></body></html>"#
    )
}

/// Chrome 155 passes all three WPT tests: the later positioned green box paints over the SVG
/// (CSS 2.2 Appendix E: positioned boxes after in-flow inline content, and among themselves in
/// tree order; `blitz_engine::paint_stack`). The emitter used to draw every image after every
/// rect of the page.
#[test]
fn a_later_positioned_box_paints_over_an_svg() {
    for (svg, green) in [
        ("", "position: relative; bottom: 300px;"),
        (
            "display: inline-block;",
            "position: relative; bottom: 300px;",
        ),
        ("position: absolute;", "position: absolute;"),
    ] {
        let seq = paint_sequence(&svg_under_green(svg, green));
        let image = seq.iter().position(|p| p.0 == "image");
        let green_rect = seq.iter().position(|p| *p == ("rect", [0, 128, 0]));
        let (Some(image), Some(green_rect)) = (image, green_rect) else {
            panic!("the SVG and the green box are painted ({svg} / {green}): {seq:?}");
        };
        assert!(image < green_rect, "{svg} / {green}: {seq:?}");
    }
}

/// An in-flow SVG paints over the in-flow blocks and under every positioned box, even an
/// earlier one; a positioned SVG paints over the positioned boxes before it in tree order. With
/// no positioned box on the page the image follows every rect, as before.
#[test]
fn images_keep_their_layer_against_positioned_and_in_flow_rects() {
    let html = r#"<!DOCTYPE html><html><head><style>
        #a { position: absolute; top: 0; left: 0; width: 50px; height: 50px; background: #0000ff; }
        #b { height: 50px; background: #00ff00; }
        </style></head><body><div id="a"></div><div id="b"></div>
        <svg width="40" height="40"><rect width="40" height="40" fill="red"/></svg>
        <svg width="40" height="40" style="position: absolute; top: 0; left: 0"><rect width="40" height="40" fill="red"/></svg>
        </body></html>"#;
    let seq = paint_sequence(html);
    let at = |item: (&'static str, [u8; 3])| seq.iter().position(|p| *p == item).unwrap();
    let images: Vec<usize> = (0..seq.len()).filter(|&i| seq[i].0 == "image").collect();
    assert_eq!(images.len(), 2, "{seq:?}");
    let (blue, lime) = (at(("rect", [0, 0, 255])), at(("rect", [0, 255, 0])));
    assert!(lime < images[0] && images[0] < blue, "{seq:?}");
    assert!(blue < images[1], "{seq:?}");

    let plain = paint_sequence(
        r#"<!DOCTYPE html><html><body><div style="height: 20px; background: #00ff00"></div>
        <svg width="40" height="40"><rect width="40" height="40" fill="red"/></svg>
        <div style="height: 20px; background: #0000ff"></div></body></html>"#,
    );
    assert_eq!(plain.last().map(|p| p.0), Some("image"), "{plain:?}");
}
