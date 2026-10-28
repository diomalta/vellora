//! Multi-column layout (Phase C step 05, `vellora_core::multicol` via `blitz_engine`): the
//! geometry Chrome for Testing 155.0.8059.85 prints for the WPT tests the step was measured on
//! (2026-10-28, `fidelity/gate/snapshots/2026-10-28/c05-multicol/README.md`). Each test's markup
//! is the WPT test's, the items recoloured so the display-list rect merge does not join them.

use vellora_core::{blitz_engine, page_css, pagination, validation};

/// `(x, y, width, height)` of page 1's rects of `color`, in CSS px (the 800x600 px page of the
/// WPT harness, margin 0).
fn rects_of(html: &str, color: [u8; 3]) -> Vec<(f64, f64, f64, f64)> {
    let html = format!("<style>@page {{ size: 800px 600px; margin: 0 }}</style>{html}");
    let page_box = page_css::parse_page_box(&html);
    let doc = blitz_engine::validate_then_lay_out(
        &html,
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
        .filter(|r| r.color == color)
        .map(|r| (r.x, r.y, r.width, r.height))
        .collect()
}

/// `(text, x, baseline y)` of every text run on page 1.
fn runs(html: &str) -> Vec<(String, f64, f64)> {
    let html = format!("<style>@page {{ size: 800px 600px; margin: 0 }}</style>{html}");
    let page_box = page_css::parse_page_box(&html);
    let doc = blitz_engine::validate_then_lay_out(
        &html,
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
        .text_runs
        .iter()
        .map(|run| {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            (
                run.text[start..end].trim().to_string(),
                run.origin_x,
                run.origin_y,
            )
        })
        .filter(|(text, _, _)| !text.is_empty())
        .collect()
}

const G1: [u8; 3] = [0, 128, 0];
const G2: [u8; 3] = [0, 128, 1];
const G3: [u8; 3] = [0, 128, 2];

fn approx(a: f64, b: f64) -> bool {
    (a - b).abs() < 0.01
}

/// WPT css/css-break/flexbox/multi-line-column-flex-fragmentation-058: three 100 px column flex
/// items with a 100 px `row-gap` in three 33.33 px columns. Each gap is suppressed at the break
/// (csswg-drafts#11520), so each column starts with an item; Chrome prints the items at x
/// 8-41, 41-75 and 75-108 px (6-30.75 / 30.75-56.25 / 56.25-81 pt): Taffy's rounding of each
/// column's own position, not the first column's width moved.
#[test]
fn three_columns_take_one_item_each_at_chromes_pixel_edges() {
    let html = r#"<style>
      .multicol { columns: 3; column-fill: auto; column-gap: 0px; width: 100px; height: 100px;
                  background: red; }
      .flex { display: flex; flex-direction: column; flex-wrap: wrap; row-gap: 100px; }
      .flex > div { height: 100px; }
    </style><div class="multicol"><div class="flex">
      <div style="background:#008000"></div><div style="background:#008001"></div>
      <div style="background:#008002"></div></div></div>"#;
    let (a, b, c) = (rects_of(html, G1), rects_of(html, G2), rects_of(html, G3));
    assert_eq!(a.len(), 1, "{a:?}");
    assert_eq!(b.len(), 1, "{b:?}");
    assert_eq!(c.len(), 1, "{c:?}");
    let top = a[0].1;
    for (r, x0, x1) in [(a[0], 8.0, 41.0), (b[0], 41.0, 75.0), (c[0], 75.0, 108.0)] {
        assert!(
            approx(r.0, x0) && approx(r.0 + r.2, x1),
            "x {r:?} != {x0}-{x1}"
        );
        assert!(approx(r.1, top) && approx(r.3, 100.0), "y {r:?}");
    }
}

/// WPT ...-055: items 95 and 90 px with a 10 px `row-gap` in two 50 px columns of a 100 px
/// `column-fill: auto` container. The gap is split by the column break and suppressed: the
/// second item starts at column 2's top (Chrome: 0-90 px there).
#[test]
fn a_gap_split_by_a_column_break_is_suppressed() {
    let html = r#"<style>
      .multicol { columns: 2; column-fill: auto; width: 100px; column-gap: 0px; height: 100px; }
      .flex { display: flex; flex-direction: column; flex-wrap: wrap; row-gap: 10px; }
    </style><div class="multicol"><div class="flex">
      <div style="height:95px; background:#008000"></div>
      <div style="height:90px; background:#008001"></div></div></div>"#;
    let (a, b) = (rects_of(html, G1), rects_of(html, G2));
    assert_eq!((a.len(), b.len()), (1, 1), "{a:?} {b:?}");
    assert!(
        approx(a[0].0, 8.0) && approx(a[0].2, 50.0) && approx(a[0].3, 95.0),
        "{a:?}"
    );
    assert!(approx(b[0].0, 58.0) && approx(b[0].2, 50.0), "{b:?}");
    assert!(
        approx(b[0].1, a[0].1) && approx(b[0].3, 90.0),
        "{a:?} {b:?}"
    );
}

/// WPT ...-054: `break-before: column` on the second item starts it at column 2's top, the
/// gap before it suppressed; an absolutely positioned child of the (relative) container is
/// positioned against the container, not in a column (`left: 50px; top: 90px`).
#[test]
fn a_forced_column_break_and_an_abspos_against_the_container() {
    let html = r#"<style>
      .multicol { position: relative; columns: 2; column-fill: auto; width: 100px;
                  column-gap: 0px; height: 100px; }
      .flex { display: flex; flex-direction: column; flex-wrap: wrap; row-gap: 10px; }
      .abspos { position: absolute; width: 50px; height: 10px; left: 50px; top: 90px;
                background: #008002; }
    </style><div class="multicol"><div class="flex">
      <div style="height:100px; background:#008000"></div>
      <div style="break-before: column; height: 90px; background:#008001"></div></div>
      <div class="abspos"></div></div>"#;
    let (a, b, c) = (rects_of(html, G1), rects_of(html, G2), rects_of(html, G3));
    assert_eq!((a.len(), b.len(), c.len()), (1, 1, 1), "{a:?} {b:?} {c:?}");
    let top = a[0].1;
    assert!(approx(a[0].0, 8.0) && approx(a[0].3, 100.0), "{a:?}");
    assert!(
        approx(b[0].0, 58.0) && approx(b[0].1, top) && approx(b[0].3, 90.0),
        "{b:?}"
    );
    assert!(approx(c[0].0, 58.0) && approx(c[0].1, top + 90.0), "{c:?}");
}

/// A content-sized container is balanced: seven `<br>` lines in four columns are 2-2-2-1
/// (Chrome 155; orphans and widows, 2, are relaxed where no break keeps them), and what follows
/// the container is laid out below its two-line columns.
#[test]
fn a_content_sized_container_balances_its_lines() {
    let html = r#"<style>div { font: 20px/26px serif; width: 460px; columns: 4; column-gap: 20px; }
      p { margin: 0; font: 20px/26px serif }</style><div>1<br>2<br>3<br>4<br>5<br>6<br>7</div><p>after</p>"#;
    let runs = runs(html);
    let at = |t: &str| {
        runs.iter()
            .find(|(text, _, _)| text == t)
            .map(|(_, x, y)| (*x, *y))
            .unwrap_or_else(|| panic!("{t} in {runs:?}"))
    };
    let (x1, y1) = at("1");
    let pitch = (460.0 - 3.0 * 20.0) / 4.0 + 20.0;
    for (i, t) in ["1", "2", "3", "4", "5", "6", "7"].iter().enumerate() {
        let (x, y) = at(t);
        let column = (i / 2) as f64;
        assert!((x - (x1 + column * pitch)).abs() < 1.0, "{t} x {x}");
        assert!(approx(y, y1 + 26.0 * (i % 2) as f64), "{t} y {y}");
    }
    let (_, after) = at("after");
    assert!(approx(after, y1 + 2.0 * 26.0), "after at {after}");
}

/// `column-fill: auto` with a content-sized height fills one column (Chrome 155, WPT
/// css/css-break/widows-orphans-017).
#[test]
fn column_fill_auto_with_an_auto_height_fills_one_column() {
    let html = r#"<style>div { font: 20px/26px serif; width: 460px; columns: 4; column-fill: auto; }
      </style><div>1<br>2<br>3</div>"#;
    let runs = runs(html);
    let xs: Vec<f64> = runs.iter().map(|(_, x, _)| *x).collect();
    assert!(xs.windows(2).all(|w| approx(w[0], w[1])), "{runs:?}");
}
