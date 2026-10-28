//! Where Chromium's print path puts the laid-out content on the page, and how wide it lays it
//! out (Phase C step 03, `PageBox::layout_content_width` / `PageBox::content_origin`).
//!
//! Expected numbers: Chrome for Testing 155.0.8059.85 (local macOS arm64, INDICATIVE;
//! 2026-10-27), the fidelity reference print path (`fidelity/lib/chrome-reference.mjs`,
//! `page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true })`, bundled
//! faces). Probe: `@page { size: <S>; margin: <M> } html, body { margin: 0 }` with a 10 px tall
//! full-width `<div style="background:#f00">` first, then right-aligned text; PyMuPDF
//! `get_drawings()` rect of the bar and character origins, pt x 4/3. For every case the bar is
//! `[round(ml), round(ml) + ceil(W - ml - mr)]` with `W` the AUTHORED page width (210 mm for
//! `size: A4`, not its 594.96 pt MediaBox), its top `round(mt)`, and right-aligned text ends
//! at the bar's right edge. `rtl` root: the bar's right edge is `W - round(mr)`.
//! Before this step vellora laid out at `floor(MediaBox W - ml - mr)` from the exact margins.

use vellora_core::page_css;

fn page(size: &str, margin: &str) -> page_css::PageBox {
    page_css::parse_page_box(&format!(
        "<html><head><style>@page {{ size: {size}; margin: {margin}; }}</style></head></html>"
    ))
}

/// (size, margin, Chrome bar left px, Chrome bar right px, Chrome bar top px), ltr root.
const LTR: &[(&str, &str, f64, f64, f64)] = &[
    ("A4", "16mm", 60.0, 733.0, 60.0),
    ("A4", "15mm", 57.0, 738.0, 57.0),
    ("A4", "10mm", 38.0, 757.0, 38.0),
    ("A4", "5mm", 19.0, 775.0, 19.0),
    ("A4", "2.5mm", 9.0, 784.0, 9.0),
    ("A4", "0.42cm", 16.0, 778.0, 16.0),
    ("A4", "60px", 60.0, 734.0, 60.0),
    ("A4", "60.5px", 61.0, 734.0, 61.0),
    ("A4", "56.5px", 57.0, 738.0, 57.0),
    ("A4", "56.7px", 57.0, 738.0, 57.0),
    ("A4", "57.4px", 57.0, 736.0, 57.0),
    ("A4", "0", 0.0, 794.0, 0.0),
    ("200mm 280mm", "15mm", 57.0, 700.0, 57.0),
    ("letter", "16mm", 60.0, 756.0, 60.0),
    ("A4 landscape", "15mm", 57.0, 1067.0, 57.0),
    ("700.3px 900.6px", "20.4px", 20.0, 680.0, 20.0),
    ("A4", "16mm 15mm 18mm 15mm", 57.0, 738.0, 60.0),
    ("A4", "0.42cm 0.25cm 0.2cm 0.25cm", 9.0, 784.0, 16.0),
];

#[test]
fn layout_width_and_origin_are_chromes_whole_px_print_box() {
    for &(size, margin, left, right, top) in LTR {
        let pb = page(size, margin);
        let (x, y) = pb.content_origin(false);
        assert_eq!(
            (x, y, x + pb.layout_content_width()),
            (left, top, right),
            "{size} / {margin}: vellora (left, top, right) vs Chrome"
        );
    }
}

#[test]
fn an_rtl_root_anchors_the_layout_to_the_right_margin_like_chrome() {
    // Chrome: bar 36.703..755.703 (A4 10 mm), 60.703..733.703 (A4 16 mm), 37..778 (letter
    // 10 mm), 55.906..698.906 (200 x 280 mm, 15 mm). Chrome snaps the fractional part to 1/64 px
    // (0.7008 -> 0.703125), hence the 0.005 px tolerance.
    for (size, margin, left, right) in [
        ("A4", "10mm", 36.703, 755.703),
        ("A4", "16mm", 60.703, 733.703),
        ("letter", "10mm", 37.0, 778.0),
        ("200mm 280mm", "15mm", 55.906, 698.906),
    ] {
        let pb = page(size, margin);
        let (x, _) = pb.content_origin(true);
        let r = x + pb.layout_content_width();
        assert!(
            (x - left).abs() < 0.005 && (r - right).abs() < 0.005,
            "{size} / {margin} rtl: vellora {x}..{r}, Chrome {left}..{right}"
        );
    }
}

#[test]
fn the_exact_content_box_is_unchanged() {
    // `content_width` stays the exact box (the `css:page-varying-width` check compares it);
    // only the layout width and the origin are Chrome's whole px.
    let pb = page("A4", "16mm");
    assert!((pb.content_width() - (594.96 / 0.75 - 2.0 * 16.0 * 96.0 / 25.4)).abs() < 1e-9);
    assert_eq!(pb.layout_content_width(), 673.0);
}
