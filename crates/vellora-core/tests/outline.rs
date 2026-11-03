//! `outline` (CSS Basic User Interface 4 §5; issue #52): painted outside the border box, over the
//! content, around each fragment of a box broken across pages or columns.

use vellora_core::{blitz_engine, page_css, pagination, validation};

fn pages(html: &str) -> Vec<vellora_core::pdf::PdfPage> {
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
    pagination::paginate(&doc, &page_box).pages
}

type Rect = (f64, f64, f64, f64);

fn outlines(page: &vellora_core::pdf::PdfPage) -> Vec<Rect> {
    page.outlines
        .iter()
        .map(|r| (r.x, r.y, r.width, r.height))
        .collect()
}

/// The bounding box of `rects`.
fn bounds(rects: &[Rect]) -> Rect {
    let x0 = rects.iter().map(|r| r.0).fold(f64::INFINITY, f64::min);
    let y0 = rects.iter().map(|r| r.1).fold(f64::INFINITY, f64::min);
    let x1 = rects
        .iter()
        .map(|r| r.0 + r.2)
        .fold(f64::NEG_INFINITY, f64::max);
    let y1 = rects
        .iter()
        .map(|r| r.1 + r.3)
        .fold(f64::NEG_INFINITY, f64::max);
    (x0, y0, x1 - x0, y1 - y0)
}

fn approx(a: Rect, b: Rect) -> bool {
    (a.0 - b.0).abs() < 0.01
        && (a.1 - b.1).abs() < 0.01
        && (a.2 - b.2).abs() < 0.01
        && (a.3 - b.3).abs() < 0.01
}

const PAGE: &str = "<style>@page { size: 400px 300px; margin: 0 } body { margin: 0 }</style>";

#[test]
fn a_solid_outline_is_four_sides_outside_the_border_box() {
    let html = format!(
        "{PAGE}<div style=\"margin: 20px; width: 100px; height: 50px; border: 2px solid blue; \
         outline: 3px solid rgb(0, 128, 0)\"></div>"
    );
    let pages = pages(&html);
    let rects = outlines(&pages[0]);
    assert_eq!(rects.len(), 4, "{rects:?}");
    assert!(pages[0].outlines.iter().all(|r| r.color == [0, 128, 0]));
    // Border box 20,20 104x54, grown by the 3 px line.
    assert!(
        approx(bounds(&rects), (17.0, 17.0, 110.0, 60.0)),
        "{rects:?}"
    );
    for r in &rects {
        assert!(
            (r.2 - 3.0).abs() < 0.01 || (r.3 - 3.0).abs() < 0.01,
            "each side is 3 px thick: {r:?}"
        );
    }
}

#[test]
fn outline_offset_moves_the_line_out_and_a_negative_one_in() {
    let out = format!(
        "{PAGE}<div style=\"margin: 20px; width: 100px; height: 50px; \
         outline: 2px solid black; outline-offset: 5px\"></div>"
    );
    assert!(approx(
        bounds(&outlines(&pages(&out)[0])),
        (13.0, 13.0, 114.0, 64.0)
    ));
    let inside = format!(
        "{PAGE}<div style=\"margin: 20px; width: 100px; height: 50px; \
         outline: 2px solid black; outline-offset: -10px\"></div>"
    );
    assert!(approx(
        bounds(&outlines(&pages(&inside)[0])),
        (28.0, 28.0, 84.0, 34.0)
    ));
}

#[test]
fn no_outline_without_a_style_and_dashed_outlines_are_segments() {
    let none =
        format!("{PAGE}<div style=\"width: 100px; height: 50px; outline-width: 4px\"></div>");
    assert!(outlines(&pages(&none)[0]).is_empty());
    let dashed = format!(
        "{PAGE}<div style=\"width: 100px; height: 50px; outline: 2px dashed black\"></div>"
    );
    assert!(outlines(&pages(&dashed)[0]).len() > 4);
}

#[test]
fn the_outline_takes_no_room() {
    // The next block starts right below the first one's border box, outline or not.
    let html = format!(
        "{PAGE}<div style=\"height: 50px; outline: 10px solid black\"></div>\
         <div style=\"height: 20px; background: rgb(0, 0, 255)\"></div>"
    );
    let pages = pages(&html);
    let blue = pages[0]
        .rects
        .iter()
        .find(|r| r.color == [0, 0, 255])
        .expect("blue block");
    assert!((blue.y - 50.0).abs() < 0.01, "{}", blue.y);
}

#[test]
fn a_box_broken_across_pages_gets_an_outline_around_each_fragment() {
    // A 500 px box on 300 px pages: page 1 holds 0..300, page 2 the remaining 200 px.
    let html = format!(
        "{PAGE}<div style=\"margin-left: 20px; width: 100px; outline: 2px solid black\">\
         <div style=\"height: 250px; background: rgb(200, 0, 0)\"></div>\
         <div style=\"height: 250px; background: rgb(0, 0, 200)\"></div></div>"
    );
    let pages = pages(&html);
    assert_eq!(pages.len(), 2);
    let first = bounds(&outlines(&pages[0]));
    let second = bounds(&outlines(&pages[1]));
    assert_eq!(outlines(&pages[0]).len(), 4, "a closed rectangle on page 1");
    assert_eq!(outlines(&pages[1]).len(), 4, "a closed rectangle on page 2");
    assert!(approx(first, (18.0, -2.0, 104.0, 304.0)), "{first:?}");
    assert!(approx(second, (18.0, -2.0, 104.0, 254.0)), "{second:?}");
}

#[test]
fn an_overflow_clipping_ancestor_clips_the_outline() {
    // WPT css/css-ui/outline-023: the outline of a child that overflows an `overflow: hidden`
    // box is cut at that box's border box.
    let html = format!(
        "{PAGE}<div style=\"overflow: hidden; width: 100px; height: 100px\">\
         <div style=\"width: 110px; height: 110px; margin: -5px; outline: 3px solid blue\">\
         </div></div>"
    );
    let rects = outlines(&pages(&html)[0]);
    for r in &rects {
        assert!(
            r.0 >= -0.01 && r.1 >= -0.01 && r.0 + r.2 <= 100.01 && r.1 + r.3 <= 100.01,
            "{r:?}"
        );
    }
}

#[test]
fn outline_style_auto_is_not_painted() {
    let html = format!("{PAGE}<div style=\"width: 100px; height: 50px; outline: auto\"></div>");
    assert!(outlines(&pages(&html)[0]).is_empty());
}
