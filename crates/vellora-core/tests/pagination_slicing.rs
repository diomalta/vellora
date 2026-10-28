//! Oversize-fragment slicing (Phase C step 03, `pagination::slice_oversize`): a fragment taller
//! than an empty page is cut between line boxes / boxes / table rows instead of being placed
//! whole past the page edge. Every expectation is Chrome 155.0.8059.85's print of the same
//! document (puppeteer `page.pdf`, A4 `preferCSSPageSize`, bundled Liberation fonts), measured
//! with the probe suite `fidelity/layout-diff/probes/table-frag-c03.json` on 2026-10-27
//! (`node fidelity/layout-diff/probe-suite.mjs --suite <that file>`): which line or row starts
//! each page, and that every word is printed exactly once.

use vellora_core::pdf::FilledRect;
use vellora_core::{blitz_engine, page_css, pagination, validation};

const HEAD: &str = "@page { size: A4; margin: 10mm } body { margin: 0; font-family: \
                    \"Liberation Sans\"; font-size: 16px; line-height: 20px; } p { margin: 0 }";
const TOL: f64 = 0.5;

fn doc(css: &str, body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>{HEAD} {css}</style></head><body>{body}</body></html>"
    )
}

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

/// Every drawn line: (0-based page, the text its glyphs cover, page-local baseline px).
fn lines(p: &pagination::Paginated) -> Vec<(usize, String, f64)> {
    p.pages
        .iter()
        .enumerate()
        .flat_map(|(i, page)| {
            page.text_runs.iter().filter_map(move |run| {
                let start = run.glyphs.iter().map(|g| g.text_start).min()?;
                let end = run.glyphs.iter().map(|g| g.text_end).max()?;
                Some((i, run.text[start..end].trim().to_string(), run.origin_y))
            })
        })
        .collect()
}

/// (page, baseline) of the one line whose text is `text`.
fn at(p: &pagination::Paginated, text: &str) -> (usize, f64) {
    let hits: Vec<(usize, f64)> = lines(p)
        .into_iter()
        .filter(|(_, t, _)| t == text)
        .map(|(page, _, y)| (page, y))
        .collect();
    assert_eq!(hits.len(), 1, "{text:?} drawn once: {hits:?}");
    hits[0]
}

/// Every line lies inside its page box (nothing emitted past the page edge).
fn assert_all_on_page(p: &pagination::Paginated) {
    for (i, page) in p.pages.iter().enumerate() {
        for run in &page.text_runs {
            assert!(
                (0.0..=page.height_px).contains(&run.origin_y),
                "page {i}: a run at {} px is off the page",
                run.origin_y
            );
        }
    }
}

/// `(first line, last line)` of every page, by baseline.
fn page_bounds(p: &pagination::Paginated) -> Vec<(String, String)> {
    let all = lines(p);
    (0..p.pages.len())
        .map(|i| {
            let mut on: Vec<&(usize, String, f64)> = all.iter().filter(|l| l.0 == i).collect();
            on.sort_by(|a, b| a.2.total_cmp(&b.2));
            (
                on.first().map(|l| l.1.clone()).unwrap_or_default(),
                on.last().map(|l| l.1.clone()).unwrap_or_default(),
            )
        })
        .collect()
}

fn rects_of(p: &pagination::Paginated, page: usize, color: [u8; 3]) -> Vec<&FilledRect> {
    p.pages[page]
        .rects
        .iter()
        .filter(|r| r.color == color)
        .collect()
}

#[test]
fn a_bordered_box_taller_than_a_page_is_sliced_like_chrome() {
    // Chrome: P1-P50 on page 1, P51 at the page-2 top (no border or padding repeated there),
    // "After" below the box on page 2.
    let ps: String = (1..=70).map(|i| format!("<p>P{i}</p>")).collect();
    let html = doc(
        ".b{border:3px solid #000;padding:10px;margin:15px 0;background:#fee}",
        &format!("<div class=\"b\">{ps}</div><p>After</p>"),
    );
    let p = paginate(&html);
    assert_eq!(p.report.page_count, 2);
    assert_all_on_page(&p);
    assert_eq!(at(&p, "P50").0, 0);
    assert_eq!(at(&p, "P51").0, 1);
    assert_eq!(at(&p, "After").0, 1);
    // P1 sits 15 + 3 + 10 px below the content top; P51 right at it.
    let (_, p1) = at(&p, "P1");
    let (_, p51) = at(&p, "P51");
    assert!((p51 - (p1 - 28.0)).abs() <= TOL, "P51 at {p51}, P1 at {p1}");
    // The background runs to the content-box bottom on page 1 (Chrome stretches a broken box to
    // the page end) and starts at the content-box top on page 2.
    let page = &p.pages[0];
    let content_bottom = page.height_px - 10.0 * 96.0 / 25.4;
    let content_top = 10.0 * 96.0 / 25.4;
    let bg_1 = rects_of(&p, 0, [255, 238, 238]);
    assert!(
        bg_1.iter()
            .any(|r| (r.y + r.height - content_bottom).abs() <= TOL),
        "page-1 background ends at the content bottom: {:?}",
        bg_1.iter().map(|r| (r.y, r.height)).collect::<Vec<_>>()
    );
    let bg_2 = rects_of(&p, 1, [255, 238, 238]);
    assert!(
        bg_2.iter().any(|r| (r.y - content_top).abs() <= TOL),
        "page-2 background starts at the content top: {:?}",
        bg_2.iter().map(|r| (r.y, r.height)).collect::<Vec<_>>()
    );
    // The top border is drawn once (page 1), the bottom border once (page 2).
    let wide_black = |page: usize| -> Vec<f64> {
        rects_of(&p, page, [0, 0, 0])
            .into_iter()
            .filter(|r| r.width > 100.0)
            .map(|r| r.y)
            .collect()
    };
    assert_eq!(wide_black(0).len(), 1, "{:?}", wide_black(0));
    assert_eq!(wide_black(1).len(), 1, "{:?}", wide_black(1));
    assert!(
        wide_black(1)[0] > content_top + 1.0,
        "no border at the page-2 top"
    );
}

#[test]
fn orphans_and_widows_two_move_the_cut_like_chrome() {
    let l: Vec<String> = (1..=51).map(|i| format!("L{i:03}")).collect();
    let q = ["Q1", "Q2", "Q3", "Q4"].join("<br>");
    let body = |first: usize| {
        format!(
            "<div class=\"w\"><p>{}</p><p>{q}</p><p>{}</p></div>",
            l[..first].join("<br>"),
            l[..40].join("<br>")
        )
    };
    // 49 lines + Q1-Q3 would fit: 1 widow, so Chrome pulls Q3 over too (2 + 2).
    let widows = paginate(&doc(".w{background:#eee}", &body(49)));
    assert_eq!(page_bounds(&widows)[0].1, "Q2");
    assert_eq!(at(&widows, "Q3").0, 1);
    // 51 lines + Q1 would fit: 1 orphan, so the paragraph moves whole.
    let orphans = paginate(&doc(".w{background:#eee}", &body(51)));
    assert_eq!(page_bounds(&orphans)[0].1, "L051");
    assert_eq!(at(&orphans, "Q1").0, 1);
    for p in [&widows, &orphans] {
        assert_eq!(p.report.page_count, 2);
        assert_all_on_page(p);
    }
}

#[test]
fn a_table_row_that_fits_a_page_moves_whole_like_chrome() {
    // Twenty rows of a 7-line cell: row 7 has room for 6 of its lines on page 1, yet Chrome moves
    // it whole (rows 1-6 / 7-12 / 13-18 / 19-20). A thead-less table is one block fragment.
    let rows: String = (1..=20)
        .map(|i| {
            let cell: Vec<String> = (1..=7).map(|k| format!("S{i}l{k}")).collect();
            format!("<tr><td>{}</td><td>T{i}</td></tr>", cell.join("<br>"))
        })
        .collect();
    let p = paginate(&doc(
        "td { border: 1px solid #000; padding: 3px }",
        &format!("<table>{rows}</table>"),
    ));
    assert_eq!(p.report.page_count, 4);
    assert_all_on_page(&p);
    let bounds = page_bounds(&p);
    for (page, first) in [(0, "S1l1"), (1, "S7l1"), (2, "S13l1"), (3, "S19l1")] {
        assert_eq!(bounds[page].0, first, "{bounds:?}");
    }
    for (text, page) in [("S6l7", 0), ("S12l7", 1), ("S18l7", 2), ("S20l7", 3)] {
        assert_eq!(at(&p, text).0, page, "{text}");
    }
}

#[test]
fn a_nested_table_header_repeats_on_the_continuation_like_chrome() {
    // One layout table holding an intro and a 70-row table with a <thead>: Chrome breaks after
    // N41 and repeats HeadA/HeadB at the top of page 2, N42 right under it.
    let rows: String = (1..=70)
        .map(|i| format!("<tr><td>N{i}</td><td>V{i}</td></tr>"))
        .collect();
    let p = paginate(&doc(
        "",
        &format!(
            "<table style=\"background:#eef\"><tr><td><p>Intro</p><table><thead><tr><th>HeadA\
             </th><th>HeadB</th></tr></thead><tbody>{rows}</tbody></table></td></tr></table>"
        ),
    ));
    assert_eq!(p.report.page_count, 2);
    assert_all_on_page(&p);
    let heads: Vec<(usize, f64)> = lines(&p)
        .into_iter()
        .filter(|(_, t, _)| t == "HeadA")
        .map(|(page, _, y)| (page, y))
        .collect();
    assert_eq!(heads.iter().map(|h| h.0).collect::<Vec<_>>(), [0, 1]);
    assert_eq!(at(&p, "N41").0, 0);
    let (page, n42) = at(&p, "N42");
    assert_eq!(page, 1);
    // N42 sits one header row below the repeated header, as N1 below the first one.
    let (_, n1) = at(&p, "N1");
    assert!(
        ((n42 - heads[1].1) - (n1 - heads[0].1)).abs() <= TOL,
        "N42 {n42} under HeadA {}; N1 {n1} under HeadA {}",
        heads[1].1,
        heads[0].1
    );
    assert_eq!(at(&p, "N70").0, 1);
}

#[test]
fn a_painted_box_many_pages_tall_continues_on_every_page_like_chrome() {
    // A 1000 px box with a background and border on 200 px pages: Chrome prints 6 pages, the
    // box on pages 1-6 and "after" on page 6.
    let html = "<!DOCTYPE html><html><head><style>@page { size: 600px 240px; margin: 20px } \
                body{margin:0;font-family:\"Liberation Sans\"}</style></head><body><div \
                style=\"height:1000px;background:#cde;border:4px solid #a00\">huge</div><p>after\
                </p></body></html>";
    let p = paginate(html);
    assert_eq!(p.report.page_count, 6);
    assert_eq!(at(&p, "huge").0, 0);
    assert_eq!(at(&p, "after").0, 5);
    for page in 0..6 {
        assert!(
            !rects_of(&p, page, [204, 221, 238]).is_empty(),
            "page {page} carries the box background"
        );
    }
}

#[test]
fn a_continuation_that_paints_nothing_is_dropped_design_target() {
    // DESIGN TARGET, not Chrome: Chrome prints a 5000 px empty div on 200 px pages as 25 pages
    // (24 blank), "after" on page 26. vellora drops a continuation with nothing to paint, so the
    // empty part of the box makes no blank page (`pagination::split_fragment`).
    let html = "<!DOCTYPE html><html><head><style>@page { size: 600px 240px; margin: 20px } \
                body{margin:0;font-family:\"Liberation Sans\"}</style></head><body><div \
                style=\"height:5000px\">huge</div><p>after</p></body></html>";
    let p = paginate(html);
    assert_eq!(p.report.page_count, 2, "Chrome: 26");
    assert_eq!(at(&p, "after").0, 1);
}

/// The WPT print page (`fidelity/wpt`: 5in × 3in, 0.5in margins) and the boxes of the
/// css/CSS2/pagination tests: 1in blue squares.
const WPT_PAGE: &str = "@page { size:5in 3in; margin:0.5in; } body { margin: 8px; font-family: \
                        \"Liberation Sans\" } p { height: 1in; width: 1in; margin:0; \
                        background-color:blue; }";

fn wpt(css: &str, body: &str) -> String {
    format!("<!DOCTYPE html><html><head><style>{WPT_PAGE} {css}</style></head><body>{body}</body></html>")
}

/// Every page's lines, top to bottom, as text.
fn texts(p: &pagination::Paginated) -> Vec<Vec<String>> {
    let all = lines(p);
    (0..p.pages.len())
        .map(|i| {
            let mut on: Vec<&(usize, String, f64)> = all.iter().filter(|l| l.0 == i).collect();
            on.sort_by(|a, b| a.2.total_cmp(&b.2));
            on.into_iter().map(|l| l.1.clone()).collect()
        })
        .collect()
}

#[test]
fn a_break_inside_avoid_box_taller_than_a_page_starts_a_fresh_page_like_chrome() {
    // WPT css/CSS2/pagination/block-page-break-inside-avoid-15: two 2.5in `avoid` boxes after a
    // 1in box on 2in pages. Chrome (its reference: `page-break-before: always`) moves each to a
    // fresh page and cuts it there: 5 pages, "1" / "2" / (rest of 2) / "4" / (rest of 4).
    let p = paginate(&wpt(
        ".test { page-break-inside:avoid; height:2.5in; }",
        "<p>1</p><p class=\"test\">2</p><p class=\"test\">4</p>",
    ));
    assert_eq!(texts(&p), [vec!["1"], vec!["2"], vec![], vec!["4"], vec![]]);
}

#[test]
fn an_avoid_table_row_moves_to_the_next_page_then_is_cut_like_chrome() {
    // WPT css/CSS2/pagination/row-page-break-inside-avoid-2 (Chrome 155 print of the test,
    // 2026-10-27): row 1 on page 1; the `avoid` row 2 (two 1in squares, taller than the page with
    // its cell borders) starts page 2 and its last 2 px go to page 3.
    let p = paginate(&wpt(
        ".test { page-break-inside:avoid; }",
        "<table border=\"1\"><tbody><tr><td><p>1</p></td></tr><tr class=\"test\"><td><p>2</p>\
         <p>3</p></td></tr></tbody></table>",
    ));
    assert_eq!(texts(&p), [vec!["1"], vec!["2", "3"], vec![]]);
}

#[test]
fn a_forced_break_inside_an_avoid_row_group_wins_like_chrome() {
    // WPT css/CSS2/pagination/rowgroup-page-break-inside-avoid-8: a `break-before: page` row
    // inside a `break-inside: avoid` <tbody>: Chrome keeps row 1 on page 1 and starts row 2 on
    // page 2 (a forced break wins over avoid, CSS Fragmentation 3 §4.4).
    let p = paginate(&wpt(
        ".test { page-break-inside:avoid; } .bb { page-break-before:always; }",
        "1<table border=\"1\"><tbody class=\"test\"><tr><td><p>1</p></td></tr><tr class=\"bb\">\
         <td><p>2</p><p>2</p></td></tr></tbody></table>",
    ));
    assert_eq!(texts(&p), [vec!["1", "1"], vec!["2", "2"], vec![]]);
}

#[test]
fn a_clipped_overflow_makes_no_pages_of_its_own_like_chrome() {
    // WPT css/css-page/monolithic-overflow-028: an 8in `overflow-y: clip` box holding a 23in
    // child prints four pages in Chrome; the clipped 15in are not printed.
    let p = paginate(&wpt(
        "body { margin: 0; color: white }",
        "<div style=\"position:absolute; overflow-y:clip; width:100%; contain:size; height:8in; \
         background:red;\"><div style=\"height:23in; background:green;\">There should be four \
         green pages.</div></div>",
    ));
    assert_eq!(p.report.page_count, 4);
}

#[test]
fn a_box_one_page_tall_leaves_no_sliver_on_the_next_page() {
    // WPT css/css-page/subpixel-page-size-001: a 123.9 px box on a 123.9 px page. Blitz lays it
    // out 124 px tall; its last 0.1 px must not paint a red row on page 2 (Chrome fits it).
    let html = "<!DOCTYPE html><html><head><style>body { margin: 0; } @page { size: 400px \
                123.9px; margin: 0; }</style></head><body><div style=\"height:123.9px; \
                background:red;\">This page should not be printed.</div>There should be no red.\
                </body></html>";
    let p = paginate(html);
    assert_eq!(p.report.page_count, 2);
    assert!(rects_of(&p, 1, [255, 0, 0]).is_empty(), "no red on page 2");
}

#[test]
fn an_empty_box_that_fits_stays_and_the_next_box_starts_the_page_like_chrome() {
    // The reference of WPT css/css-break/flexbox/multi-line-row-flex-fragmentation-063: 0.5in
    // items separated by empty 0.2in divs in a bordered box. Item 3 does not fit page 1; the empty
    // div before it does and stays there (the latest break wins), so item 3 starts page 2 at the
    // top, as in Chrome's print of the test.
    let items: String = (1..=6)
        .map(|i| {
            let gap = if i < 5 {
                "<div class=\"gap\"></div>"
            } else {
                ""
            };
            format!("<div class=\"item\">{i}</div>{gap}")
        })
        .collect();
    let p = paginate(&wpt(
        "body { margin: 0 } .flexbox { border: 0.25in solid black; font-size: 0.25in; } .item \
         { contain: size; box-sizing: border-box; border: 4px solid purple; height: 0.5in; } \
         .gap { height: 0.2in; }",
        &format!(
            "<div style=\"height: 0.25in; background: gray;\"></div><div class=\"flexbox\">\
             {items}</div><div style=\"height: 0.25in; background: gray;\"></div>"
        ),
    ));
    assert_eq!(texts(&p)[0], ["1", "2"]);
    assert_eq!(texts(&p)[1], ["3", "4", "5"]);
    let (_, y1) = at(&p, "1");
    let (_, y3) = at(&p, "3");
    // Item 1 sits 0.25in (gray) + 0.25in (border) below the content top; item 3 at the top.
    assert!(
        (y1 - y3 - 48.0).abs() <= TOL,
        "item 3 at {y3}, item 1 at {y1}"
    );
}
