//! Multi-column containers broken across pages (CSS Multi-column Layout 1 §8.2, "overflow due
//! to page size"; issue #52): the columns that do not fit on a page continue on the next page,
//! one row of columns per page, each as tall as the room its page leaves; the last row is
//! balanced. Through `debug_paginate`, the render path's layout and pagination (with the
//! relayout that places the rows where the paginator puts the container).

use vellora_core::{debug_paginate, RenderOptions};

type Rect = (f64, f64, f64, f64);

/// Per page, `(x, y, width, height)` of the rects of `color`.
fn rects(html: &str, color: [u8; 3]) -> Vec<Vec<Rect>> {
    let paginated = debug_paginate(html.as_bytes(), &RenderOptions::default()).expect("renders");
    paginated
        .pages
        .iter()
        .map(|page| {
            page.rects
                .iter()
                .filter(|r| r.color == color)
                .map(|r| (r.x, r.y, r.width, r.height))
                .collect()
        })
        .collect()
}

fn approx(a: f64, b: f64) -> bool {
    (a - b).abs() < 0.01
}

/// The colour of block `i` (distinct per block, so the rect merge never joins two).
fn color(i: usize) -> [u8; 3] {
    [0, 100 + i as u8, 0]
}

/// `n` blocks `h` px tall, block `i` filled with [`color`]`(i)`.
fn blocks(n: usize, h: usize) -> String {
    (0..n)
        .map(|i| {
            let [r, g, b] = color(i);
            format!("<div style=\"height: {h}px; background: rgb({r}, {g}, {b})\"></div>")
        })
        .collect()
}

const PAGE: &str = "<style>@page { size: 400px 300px; margin: 0 } body { margin: 0 } \
                    .mc { columns: 2; column-gap: 0 }</style>";

/// Which page and `(x, y)` block `i` is printed at (exactly one rect).
fn place(html: &str, i: usize) -> (usize, f64, f64) {
    let per_page = rects(html, color(i));
    let found: Vec<(usize, Rect)> = per_page
        .iter()
        .enumerate()
        .flat_map(|(p, rs)| rs.iter().map(move |r| (p, *r)))
        .collect();
    assert_eq!(found.len(), 1, "block {i}: {found:?}");
    let (page, r) = found[0];
    (page, r.0, r.1)
}

#[test]
fn a_container_longer_than_a_page_fills_the_columns_of_each_page_in_turn() {
    // 20 blocks of 50 px (1000 px) in two columns on 300 px pages. Page 1: blocks 0-5 in
    // column 1, 6-11 in column 2 (each column 300 px, the room of the page). Page 2: the 8
    // blocks left, balanced: 12-15 in column 1, 16-19 in column 2. Before issue #52 the
    // container was balanced to 500 px columns and cut through both of them at 300 px.
    let html = format!("{PAGE}<div class=\"mc\">{}</div>", blocks(20, 50));
    for i in 0..20 {
        let (page, x, y) = place(&html, i);
        let (want_page, col, row) = match i {
            0..=5 => (0, 0, i),
            6..=11 => (0, 1, i - 6),
            12..=15 => (1, 0, i - 12),
            _ => (1, 1, i - 16),
        };
        assert_eq!(page, want_page, "block {i} page");
        assert!(approx(x, 200.0 * col as f64), "block {i} x {x}");
        assert!(approx(y, 50.0 * row as f64), "block {i} y {y}");
    }
}

#[test]
fn what_follows_the_container_goes_below_its_last_row() {
    let after = "<div style=\"height: 20px; background: rgb(0, 0, 255)\"></div>";
    let html = format!("{PAGE}<div class=\"mc\">{}</div>{after}", blocks(20, 50));
    let blue = rects(&html, [0, 0, 255]);
    assert_eq!(blue.len(), 2, "two pages");
    assert!(blue[0].is_empty(), "{blue:?}");
    assert_eq!(blue[1].len(), 1, "{blue:?}");
    assert!(approx(blue[1][0].1, 200.0), "{blue:?}");
}

#[test]
fn the_first_row_takes_the_room_below_the_content_before_the_container() {
    // A 100 px block first: page 1 leaves 200 px, so columns 1-2 take 4 blocks each; the 12
    // left fill page 2's 300 px columns (6 + 6, balanced to exactly the page).
    let html = format!(
        "{PAGE}<div style=\"height: 100px\"></div><div class=\"mc\">{}</div>",
        blocks(20, 50)
    );
    for i in 0..20 {
        let (page, x, y) = place(&html, i);
        let (want_page, col, top) = match i {
            0..=3 => (0, 0, 100.0 + 50.0 * i as f64),
            4..=7 => (0, 1, 100.0 + 50.0 * (i - 4) as f64),
            8..=13 => (1, 0, 50.0 * (i - 8) as f64),
            _ => (1, 1, 50.0 * (i - 14) as f64),
        };
        assert_eq!(page, want_page, "block {i} page");
        assert!(approx(x, 200.0 * col as f64), "block {i} x {x}");
        assert!(approx(y, top), "block {i} y {y} != {top}");
    }
}

#[test]
fn three_pages_of_columns() {
    // 30 blocks of 50 px: pages 1 and 2 hold 12 each (6 per column), page 3 the last 6 (3 + 3).
    let html = format!("{PAGE}<div class=\"mc\">{}</div>", blocks(30, 50));
    for i in 0..30 {
        let (page, x, y) = place(&html, i);
        let (want_page, k) = (i.min(24) / 12, i % 12);
        let (col, row) = if want_page < 2 {
            (k / 6, k % 6)
        } else {
            ((i - 24) / 3, (i - 24) % 3)
        };
        assert_eq!(page, want_page, "block {i} page");
        assert!(approx(x, 200.0 * col as f64), "block {i} x {x}");
        assert!(approx(y, 50.0 * row as f64), "block {i} y {y}");
    }
}

#[test]
fn a_container_that_fits_its_page_is_laid_out_as_before() {
    // 10 blocks (500 px) balance to 250 px columns: one page, unchanged.
    let html = format!("{PAGE}<div class=\"mc\">{}</div>", blocks(10, 50));
    for i in 0..10 {
        let (page, x, y) = place(&html, i);
        assert_eq!(page, 0);
        assert!(approx(x, 200.0 * (i / 5) as f64), "block {i} x {x}");
        assert!(approx(y, 50.0 * (i % 5) as f64), "block {i} y {y}");
    }
}

#[test]
fn a_fixed_height_container_continues_on_the_next_page_up_to_its_height() {
    // `height: 500px`, `column-fill: auto`: page 1 rows are 300 px, page 2 the 200 px left;
    // 20 blocks fill 6 + 6 on page 1 and 4 + 4 on page 2.
    let html = format!(
        "{PAGE}<div class=\"mc\" style=\"height: 500px; column-fill: auto\">{}</div>",
        blocks(20, 50)
    );
    for i in 0..20 {
        let (page, x, y) = place(&html, i);
        let (want_page, col, row) = match i {
            0..=5 => (0, 0, i),
            6..=11 => (0, 1, i - 6),
            12..=15 => (1, 0, i - 12),
            _ => (1, 1, i - 16),
        };
        assert_eq!(page, want_page, "block {i} page");
        assert!(approx(x, 200.0 * col as f64), "block {i} x {x}");
        assert!(approx(y, 50.0 * row as f64), "block {i} y {y}");
    }
}

#[test]
fn the_container_background_and_outline_continue_on_each_page() {
    let html = format!(
        "{PAGE}<div class=\"mc\" style=\"background: rgb(255, 0, 0); outline: 2px solid \
         rgb(0, 0, 0)\">{}</div>",
        blocks(20, 50)
    );
    let red = rects(&html, [255, 0, 0]);
    assert_eq!(red.len(), 2);
    let paginated = debug_paginate(html.as_bytes(), &RenderOptions::default()).expect("renders");
    for page in &paginated.pages {
        assert_eq!(page.outlines.len(), 4, "an outline around each fragment");
    }
}

#[test]
fn rendering_is_deterministic() {
    let html = format!(
        "{PAGE}<div style=\"height: 70px\"></div><div class=\"mc\">{}</div><p>after</p>",
        blocks(33, 37)
    );
    let a = vellora_core::render(html.as_bytes(), &RenderOptions::default()).expect("renders");
    let b = vellora_core::render(html.as_bytes(), &RenderOptions::default()).expect("renders");
    assert_eq!(a, b);
}

#[test]
fn lines_of_text_continue_in_the_columns_of_the_next_page() {
    // 60 lines of 20 px in two columns on 300 px pages: 15 lines per column on page 1, the 30
    // left balanced 15 + 15 on page 2. Every line on its page, none cut, none below the page end.
    let lines: String = (0..60).map(|i| format!("L{i}<br>")).collect();
    let html = format!(
        "{PAGE}<div class=\"mc\" style=\"font: 16px/20px 'Liberation Sans'\">{lines}</div>"
    );
    let paginated = debug_paginate(html.as_bytes(), &RenderOptions::default()).expect("renders");
    assert_eq!(paginated.pages.len(), 2);
    let mut seen = Vec::new();
    for (p, page) in paginated.pages.iter().enumerate() {
        for run in &page.text_runs {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            let text = run.text[start..end].trim().to_string();
            if text.is_empty() {
                continue;
            }
            assert!(
                run.origin_y > 0.0 && run.origin_y < 300.0,
                "{text} at {}",
                run.origin_y
            );
            seen.push((text, p, run.origin_x >= 200.0));
        }
    }
    for i in 0..60 {
        let want = (format!("L{i}"), i / 30, (i % 30) >= 15);
        assert!(seen.contains(&want), "{want:?} not in {seen:?}");
    }
}
