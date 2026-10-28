//! Dashed and dotted borders reach the page as segments (Phase C step 04,
//! `src/border_pattern.rs`, which holds the Chrome measurements and the unit tests of the
//! dash rule). These tests check the wiring: separated borders (`read_visuals`) and the
//! collapsed-border compensation (`collapsed_borders::ResolvedCell::paint_rects`), on the
//! paginated display list.
//!
//! Chrome for Testing 155.0.8059.85 (local macOS arm64, INDICATIVE; 2026-10-28), PyMuPDF
//! `get_drawings()` x 4/3 of the reference print: a `300 x 60` content box with
//! `border: 1px dashed #000` (border box 302 x 62) paints 61 dashes of 3 px on the top side
//! (gap 1.983) and 13 on the left (gap 1.917); the danfe product rows (`border-collapse:
//! collapse`, `border-bottom: 0.5pt dashed`, used width 1 px) paint 3 px dashes along each
//! cell.

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
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 10mm }} \
         body {{ margin: 0 }} {css}</style></head><body>{body}</body></html>"
    )
}

fn of_color(p: &pagination::Paginated, color: [u8; 3]) -> Vec<&FilledRect> {
    p.pages[0]
        .rects
        .iter()
        .filter(|r| r.color == color)
        .collect()
}

#[test]
fn a_dashed_box_paints_chromes_dashes_on_every_side() {
    let html = doc(
        "div { width: 300px; height: 60px; border: 1px dashed #c00 }",
        "<div>a</div>",
    );
    let p = paginate(&html);
    let red = of_color(&p, [0xcc, 0, 0]);
    let top: Vec<_> = red
        .iter()
        .filter(|r| r.height == 1.0 && (r.y - 38.0).abs() < 0.01)
        .collect();
    let left: Vec<_> = red
        .iter()
        .filter(|r| r.width == 1.0 && (r.x - 38.0).abs() < 0.01)
        .collect();
    assert_eq!(top.len(), 61, "top side: Chrome's 61 dashes");
    assert!(top.iter().all(|r| (r.width - 3.0).abs() < 1e-9));
    assert_eq!(left.len(), 13, "left side: Chrome's 13 dashes");
    // 61 + 61 + 13 + 13 sides, and nothing merged back into a solid line.
    assert_eq!(red.len(), 148);
    let first_gap = top[1].x - (top[0].x + top[0].width);
    assert!((first_gap - 1.983).abs() < 0.001, "gap {first_gap}");
}

#[test]
fn a_dotted_side_paints_square_dots() {
    let html = doc(
        "div { width: 300px; height: 60px; border-bottom: 2px dotted #00c }",
        "<div>a</div>",
    );
    let p = paginate(&html);
    let dots = of_color(&p, [0, 0, 0xcc]);
    // 300 px, dot 2, nominal gap 2: 75 dots (gap 2.027) or 76 (gap 1.973) -> 76.
    assert_eq!(dots.len(), 76);
    assert!(dots.iter().all(|r| r.width == 2.0 && r.height == 2.0));
}

#[test]
fn solid_and_unstyled_sides_stay_one_rect() {
    let html = doc(
        "div { width: 300px; height: 60px; border: 1px solid #c00; border-bottom-style: double }",
        "<div>a</div>",
    );
    let p = paginate(&html);
    assert_eq!(of_color(&p, [0xcc, 0, 0]).len(), 4);
}

#[test]
fn a_collapsed_tables_dashed_row_edges_paint_dashes_per_cell() {
    let html = doc(
        "table { border-collapse: collapse; width: 400px } \
         td { border-bottom: 1px dashed #c00; border-right: 1px solid #00c; padding: 4px }",
        "<table><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>",
    );
    let p = paginate(&html);
    let red = of_color(&p, [0xcc, 0, 0]);
    assert!(
        red.len() > 40,
        "dashed row edges are segments, not two solid lines per row: {} rects",
        red.len()
    );
    assert!(red.iter().all(|r| r.height == 1.0 && r.width <= 3.0 + 1e-9));
    // The solid column edges stay one rect per cell side.
    assert!(of_color(&p, [0, 0, 0xcc]).iter().all(|r| r.height > 3.0));
}
