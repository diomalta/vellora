//! Regression tests for the table-row pagination correctness bugs
//! (R1 row-span collapse, R2 missing first-page header, R3 header repetition
//! stopping partway, TQ-4 content-level invariants). Each of these FAILS against
//! the pre-fix paginator (which collapsed every <tr> fragment to the table top,
//! inflating per-row heights → ~30 pages with off-page text and a missing/
//! intermittent header) and PASSES after deriving row spans from <td>/<th>
//! cells and re-injecting the header on every table page.

use vellora_core::pagination;
use vellora_core::{blitz_engine, page_css};

const INVOICE: &str = include_str!("fixtures/invoice.html");

/// True if a page carries the items-table column header labels.
fn has_header(page: &vellora_core::pdf::PdfPage) -> bool {
    page.text_runs.iter().any(|r| r.text.contains("QTD."))
        && page.text_runs.iter().any(|r| r.text.contains("TOTAL"))
}

/// True if a page carries at least one tbody line-item row (every item has a
/// "SKU " marker in its description cell).
fn has_item_row(page: &vellora_core::pdf::PdfPage) -> bool {
    page.text_runs.iter().any(|r| r.text.contains("SKU "))
}

#[test]
fn invoice_paginates_into_a_sane_page_count() {
    // R1: a 35-row invoice on an A4 page (~1001px usable, ~55px rows → ~17
    // rows/page) must NOT explode into dozens of pages. Pre-fix this was 30.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);
    let n = paginated.report.page_count;
    assert!(
        (2..8).contains(&n),
        "invoice should paginate into a small, sane page count, got {n}"
    );

    // Roughly floor(usable_h / row_height) rows per page: with ~35 rows and the
    // ~1001px usable height, that lands around 3 pages — never tens of pages.
    let usable = pb.content_height();
    assert!(usable > 0.0);
}

#[test]
fn every_page_keeps_all_content_within_the_page_box() {
    // R1: the cumulative-span bug pushed text origins far past the page bottom
    // (origin_y > page height on later pages). Assert every emitted text-run
    // origin AND every box extent lies within [0, page height] on EVERY page.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);

    for (i, page) in paginated.pages.iter().enumerate() {
        let h = page.height_px;
        for r in &page.text_runs {
            assert!(
                r.origin_y >= 0.0 && r.origin_y <= h,
                "page {} text origin_y={:.1} out of page bounds [0,{:.1}]",
                i + 1,
                r.origin_y,
                h
            );
        }
        for b in &page.rects {
            assert!(
                b.y >= 0.0 && b.y + b.height <= h + 0.5,
                "page {} rect [{:.1}..{:.1}] out of page bounds [0,{:.1}]",
                i + 1,
                b.y,
                b.y + b.height,
                h
            );
        }
    }
}

#[test]
fn every_table_page_carries_the_header_labels() {
    // R2 + R3: the header must lead the table's FIRST page and EVERY continuation
    // page. Pre-fix the header was missing on page 1 and stopped repeating
    // partway through. Assert on the actual emitted header TEXT, not a flag.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);

    let mut table_pages = 0;
    for (i, page) in paginated.pages.iter().enumerate() {
        if has_item_row(page) {
            table_pages += 1;
            assert!(
                has_header(page),
                "page {} carries items-table rows but is missing the header labels",
                i + 1
            );
        }
    }
    assert!(
        table_pages >= 2,
        "the invoice items table should span at least two pages, got {table_pages}"
    );
}

#[test]
fn totals_block_appears_exactly_once_on_the_last_table_page() {
    // TQ-4: the totals block ("Total a pagar") must be kept once — not repeated
    // across continuation pages, and present on exactly one page.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);

    let totals_pages: Vec<usize> = paginated
        .pages
        .iter()
        .enumerate()
        .filter(|(_, p)| p.text_runs.iter().any(|r| r.text.contains("Total a pagar")))
        .map(|(i, _)| i)
        .collect();
    assert_eq!(
        totals_pages.len(),
        1,
        "totals block must appear on exactly one page, found on {totals_pages:?}"
    );
    // And it lands on the last page that still carries items-table rows.
    let last_table_page = paginated
        .pages
        .iter()
        .enumerate()
        .filter(|(_, p)| has_item_row(p))
        .map(|(i, _)| i)
        .next_back()
        .expect("at least one table page");
    assert_eq!(
        totals_pages[0], last_table_page,
        "totals appear on the last table page"
    );
}

#[test]
fn no_item_row_is_split_across_two_pages() {
    // R1/TQ-4: each line item's SKU code is unique, so a given SKU must appear on
    // exactly one page (a row is never split). Pre-fix the inflated row heights
    // still kept rows whole, but this pins the invariant against future regressions.
    let doc = blitz_engine::lay_out(INVOICE);
    let pb = page_css::parse_page_box(INVOICE);
    let paginated = pagination::paginate(&doc, &pb);

    use std::collections::HashMap;
    let mut sku_pages: HashMap<String, Vec<usize>> = HashMap::new();
    for (i, page) in paginated.pages.iter().enumerate() {
        for run in &page.text_runs {
            if let Some(pos) = run.text.find("SKU ") {
                let code: String = run.text[pos..]
                    .chars()
                    .take_while(|c| !c.is_whitespace() || *c == ' ')
                    .collect::<String>()
                    .trim()
                    .to_string();
                let entry = sku_pages.entry(code).or_default();
                if !entry.contains(&i) {
                    entry.push(i);
                }
            }
        }
    }
    for (code, pages) in &sku_pages {
        assert_eq!(
            pages.len(),
            1,
            "item {code:?} appears on multiple pages {pages:?} (a row was split)"
        );
    }
}

#[test]
fn first_page_table_header_sits_below_preceding_content() {
    // The <thead> band was injected at the page content-top (y=0) even on the
    // table's FIRST page, so it overlapped the title/intro that precede the table.
    // The header must sit BELOW preceding content (greater top-left y) — at the
    // table's actual start — not at the page top. (On a continuation page the
    // cursor is 0, so injecting at the cursor still lands it at the top.)
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        table { width: 100%; }
    </style></head><body>
        <h1>DOCTITLE</h1>
        <table>
          <thead><tr><th>COLHDR</th><th>X</th></tr></thead>
          <tbody><tr><td>row-a</td><td>1</td></tr></tbody>
        </table>
    </body></html>"#;
    let doc = blitz_engine::lay_out(html);
    let pb = page_css::parse_page_box(html);
    let paginated = pagination::paginate(&doc, &pb);
    let page0 = &paginated.pages[0];

    let title_y = page0
        .text_runs
        .iter()
        .find(|r| r.text.contains("DOCTITLE"))
        .map(|r| r.origin_y)
        .expect("title present on page 0");
    let header_y = page0
        .text_runs
        .iter()
        .find(|r| r.text.contains("COLHDR"))
        .map(|r| r.origin_y)
        .expect("table header present on page 0");

    assert!(
        header_y > title_y,
        "table header (y={header_y}) must sit BELOW the title (y={title_y}), not overlap it at the page top"
    );
}
