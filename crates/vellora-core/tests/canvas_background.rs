//! The canvas background (CSS Backgrounds 3 §2.11.2; Phase C step 04, `PageBox::page_area`,
//! `blitz_engine::canvas_background`, `pagination::paint_canvas`). Not a Blitz bug: vellora
//! paints from its own display list (it never links blitz-paint) and did not model the canvas,
//! so a body background was painted nowhere (postmark page 2 white where Chrome is grey).
//!
//! Expected numbers: Chrome for Testing 155.0.8059.85 (local macOS arm64, INDICATIVE;
//! 2026-10-28), the fidelity reference print path (`fidelity/lib/chrome-reference.mjs`,
//! `page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true })`), PyMuPDF
//! `get_drawings()` x 4/3 (repros `fidelity/gate/snapshots/2026-10-28/c04-paint/repro/bg*.html`):
//! - body `#F2F4F6`, A4, `@page { margin: 10mm }`, three 400 px boxes: two pages, each with
//!   one `#f2f4f6` rect x 38..756, y 38..1085 under the content; the margins stay white;
//! - `html { background: #9cf } body { background: #ccc; margin: 20px }`: the page area is
//!   `#99ccff` and the body box paints its own `#cccccc`.

use vellora_core::pdf::FilledRect;
use vellora_core::{blitz_engine, page_css, pagination, validation};

fn paginate(html: &str) -> pagination::Paginated {
    let page_box = page_css::parse_page_box(html);
    let laid_out = blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        page_box.content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");
    pagination::paginate(&laid_out, &page_box)
}

fn doc(css: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 10mm }} {css}</style>\
         </head><body>{body}</body></html>"
    )
}

fn edges(r: &FilledRect) -> (f64, f64, f64, f64) {
    (r.x, r.y, r.x + r.width, r.y + r.height)
}

const GREY: [u8; 3] = [0xf2, 0xf4, 0xf6];
const PAGE_AREA_A4_10MM: (f64, f64, f64, f64) = (38.0, 38.0, 756.0, 1085.0);

#[test]
fn a_body_background_fills_the_page_area_of_every_page_like_chrome() {
    let html = doc(
        "body { background-color: #F2F4F6; margin: 0 } \
         div { height: 400px; border: 1px solid #000; margin: 0 0 10px }",
        "<div>1</div><div>2</div><div>3</div>",
    );
    let p = paginate(&html);
    assert_eq!(p.report.page_count, 2, "Chrome prints two pages");
    for (i, page) in p.pages.iter().enumerate() {
        let canvas = &page.rects[0];
        assert_eq!(
            canvas.color, GREY,
            "page {i}: the canvas rect is painted first"
        );
        assert_eq!(
            edges(canvas),
            PAGE_AREA_A4_10MM,
            "page {i}: Chrome's page area"
        );
        let greys = page.rects.iter().filter(|r| r.color == GREY).count();
        assert_eq!(
            greys, 1,
            "page {i}: the body box paints no background of its own"
        );
    }
}

#[test]
fn the_root_background_wins_and_the_body_then_paints_its_own() {
    let html = doc(
        "html { background: #9cf } body { background: #ccc; margin: 20px } \
         p { margin: 0; height: 30px }",
        "<p>html blue body grey</p>",
    );
    let page_box = page_css::parse_page_box(&html);
    let laid_out = blitz_engine::validate_then_lay_out(
        &html,
        validation::denied_elements(),
        page_box.content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("lays out");
    assert_eq!(laid_out.canvas_background, Some([0x99, 0xcc, 0xff]));
    let body = laid_out
        .boxes
        .iter()
        .find(|b| b.tag.as_deref() == Some("body"))
        .expect("body box");
    assert!(
        body.visual_rects
            .iter()
            .any(|r| r.color == [0xcc, 0xcc, 0xcc]),
        "the body keeps its own background when the root's propagates"
    );
    let p = pagination::paginate(&laid_out, &page_box);
    assert_eq!(edges(&p.pages[0].rects[0]), PAGE_AREA_A4_10MM);
    assert_eq!(p.pages[0].rects[0].color, [0x99, 0xcc, 0xff]);
}

#[test]
fn no_background_paints_no_canvas() {
    let html = doc("body { margin: 0 }", "<p>plain</p>");
    let p = paginate(&html);
    assert!(
        p.pages[0].rects.is_empty(),
        "a transparent root and body paint nothing: {:?}",
        p.pages[0].rects.iter().map(edges).collect::<Vec<_>>()
    );
}

#[test]
fn a_transparent_body_background_does_not_propagate() {
    let html = doc(
        "body { background: rgba(0, 0, 0, 0); margin: 0 }",
        "<p>clear</p>",
    );
    let p = paginate(&html);
    assert!(p.pages[0].rects.is_empty());
}

#[test]
fn the_page_area_follows_each_pages_own_margins() {
    // `:first` gives page 1 other margins; every page's canvas follows its own page box.
    // Chrome (repro `bgfirst.html`): page 1 x 76..719, y 76..1047; page 2 the 10 mm area.
    let html = "<!DOCTYPE html><html><head><style>@page { size: A4; margin: 10mm } \
                @page :first { margin: 20mm } body { background: #eee; margin: 0 } \
                div { height: 600px }</style></head><body><div>1</div><div>2</div></body></html>";
    let p = paginate(html);
    assert_eq!(p.report.page_count, 2);
    assert_eq!(edges(&p.pages[0].rects[0]), (76.0, 76.0, 719.0, 1047.0));
    assert_eq!(edges(&p.pages[1].rects[0]), PAGE_AREA_A4_10MM);
}
