//! `break-inside: avoid` and `break-before: page` (CSS Fragmentation 3) as the
//! paginator honours them: on items-table `<tbody>` groups, items tables,
//! flattened wrappers and top-level blocks, from `<style>` rules, inline
//! `style`, and the legacy `page-break-*` aliases.

use vellora_core::pdf::PdfPage;
use vellora_core::{blitz_engine, page_css, pagination};

/// A short page so a handful of rows already crosses a page boundary.
const SHORT_PAGE: &str = "@page { size: 210mm 120mm; margin: 10mm; }";

fn paginate(html: &str) -> pagination::Paginated {
    let doc = blitz_engine::lay_out(html);
    let page_box = page_css::parse_page_box(html);
    pagination::paginate(&doc, &page_box)
}

fn pages_with(paginated: &pagination::Paginated, needle: &str) -> Vec<usize> {
    paginated
        .pages
        .iter()
        .enumerate()
        .filter(|(_, page)| page_has(page, needle))
        .map(|(i, _)| i)
        .collect()
}

fn page_has(page: &PdfPage, needle: &str) -> bool {
    page.text_runs.iter().any(|run| run.text.contains(needle))
}

fn first_text(page: &PdfPage) -> String {
    page.text_runs
        .iter()
        .min_by(|a, b| a.origin_y.total_cmp(&b.origin_y))
        .map(|run| run.text.to_string())
        .unwrap_or_default()
}

/// An items table with `groups` tbody groups of `rows` rows each, labelled
/// `[G<g>R<r>]`, plus the given extra CSS.
fn grouped_table(css: &str, groups: usize, rows: usize) -> String {
    let mut body = String::new();
    for g in 1..=groups {
        body.push_str("<tbody class=\"meal\">");
        for r in 1..=rows {
            body.push_str(&format!("<tr><td>[G{g}R{r}]</td><td>item</td></tr>"));
        }
        body.push_str("</tbody>");
    }
    format!(
        "<!DOCTYPE html><html><head><style>{SHORT_PAGE} body {{ font-size: 14px; }} \
         td {{ padding: 4px; }} {css}</style></head><body>\
         <table><thead><tr><th>Food</th><th>Qty</th></tr></thead>{body}</table>\
         </body></html>"
    )
}

/// Indexes of groups whose rows land on more than one page.
fn split_groups(paginated: &pagination::Paginated, groups: usize, rows: usize) -> Vec<usize> {
    (1..=groups)
        .filter(|g| {
            let mut pages: Vec<usize> = (1..=rows)
                .flat_map(|r| pages_with(paginated, &format!("[G{g}R{r}]")))
                .collect();
            pages.sort_unstable();
            pages.dedup();
            pages.len() > 1
        })
        .collect()
}

#[test]
fn without_hints_a_tbody_group_crosses_a_page_boundary() {
    let paginated = paginate(&grouped_table("", 8, 4));
    assert!(paginated.report.page_count > 1);
    assert!(
        !split_groups(&paginated, 8, 4).is_empty(),
        "control: the fixture must split some group when nothing asks it not to"
    );
}

#[test]
fn break_inside_avoid_keeps_every_tbody_group_on_one_page() {
    let paginated = paginate(&grouped_table("tbody.meal { break-inside: avoid; }", 8, 4));
    assert!(paginated.report.page_count > 1);
    assert_eq!(split_groups(&paginated, 8, 4), Vec::<usize>::new());
    for (i, page) in paginated.pages.iter().enumerate() {
        assert!(
            page_has(page, "Food"),
            "page {} repeats the table header",
            i + 1
        );
    }
}

#[test]
fn legacy_page_break_inside_avoid_is_honoured() {
    let paginated = paginate(&grouped_table("tbody { page-break-inside: avoid }", 8, 4));
    assert_eq!(split_groups(&paginated, 8, 4), Vec::<usize>::new());
}

#[test]
fn a_group_taller_than_a_page_falls_back_to_rows_without_losing_any() {
    let paginated = paginate(&grouped_table("tbody.meal { break-inside: avoid; }", 1, 40));
    assert!(
        paginated.report.page_count > 1,
        "40 rows cannot fit one short page"
    );
    for r in 1..=40 {
        assert_eq!(
            pages_with(&paginated, &format!("[G1R{r}]")).len(),
            1,
            "row {r} is placed exactly once"
        );
    }
    for (i, page) in paginated.pages.iter().enumerate() {
        assert!(
            page_has(page, "Food"),
            "page {} repeats the table header",
            i + 1
        );
    }
}

#[test]
fn break_before_page_starts_a_fresh_page_without_a_leading_blank() {
    let html = format!(
        "<!DOCTYPE html><html><head><style>{SHORT_PAGE} .v {{ break-before: page; }}</style></head><body>\
         <h2 class=\"v\">Weekdays</h2><p>Monday to Friday</p>\
         <h2 class=\"v\">Weekend</h2><p>Saturday and Sunday</p>\
         </body></html>"
    );
    let paginated = paginate(&html);
    assert_eq!(paginated.report.page_count, 2);
    assert_eq!(pages_with(&paginated, "Weekdays"), vec![0]);
    assert_eq!(pages_with(&paginated, "Weekend"), vec![1]);
    assert!(first_text(&paginated.pages[1]).contains("Weekend"));
}

#[test]
fn inline_and_legacy_break_before_are_honoured() {
    let html = format!(
        "<!DOCTYPE html><html><head><style>{SHORT_PAGE}</style></head><body>\
         <p>Intro</p>\
         <p style=\"break-before: page\">Second</p>\
         <p style=\"page-break-before: always\">Third</p>\
         </body></html>"
    );
    let paginated = paginate(&html);
    assert_eq!(paginated.report.page_count, 3);
    assert_eq!(pages_with(&paginated, "Second"), vec![1]);
    assert_eq!(pages_with(&paginated, "Third"), vec![2]);
}

#[test]
fn break_before_on_a_tbody_starts_its_rows_on_a_new_page_with_the_header() {
    let paginated = paginate(&grouped_table(
        "tbody.meal + tbody.meal { break-before: page; }",
        3,
        2,
    ));
    assert_eq!(paginated.report.page_count, 3);
    for g in 1..=3 {
        assert_eq!(pages_with(&paginated, &format!("[G{g}R1]")), vec![g - 1]);
        assert!(page_has(&paginated.pages[g - 1], "Food"));
    }
}

#[test]
fn break_inside_avoid_keeps_a_wrapper_section_together() {
    let filler: String = (1..=9).map(|i| format!("<p>Filler {i}</p>")).collect();
    let section: String = (1..=5).map(|i| format!("<p>Kept {i}</p>")).collect();
    let html = |css: &str| {
        format!(
            "<!DOCTYPE html><html><head><style>{SHORT_PAGE} p {{ margin: 0 0 10px; font-size: 16px; }} {css}</style></head><body>\
             {filler}<section class=\"keep\"><h3>Together</h3>{section}</section>\
             </body></html>"
        )
    };
    let pages_of_kept = |paginated: &pagination::Paginated| {
        let mut pages: Vec<usize> = (1..=5)
            .flat_map(|i| pages_with(paginated, &format!("Kept {i}")))
            .chain(pages_with(paginated, "Together"))
            .collect();
        pages.sort_unstable();
        pages.dedup();
        pages
    };

    let control = paginate(&html(""));
    assert!(
        pages_of_kept(&control).len() > 1,
        "control: the section straddles a page boundary when nothing asks it not to"
    );
    let kept = paginate(&html(".keep { break-inside: avoid; }"));
    assert_eq!(pages_of_kept(&kept).len(), 1);
}

#[test]
fn an_unparseable_selector_matches_nothing_and_does_not_fail_the_render() {
    let paginated = paginate(&grouped_table("tbody:::nope { break-inside: avoid }", 8, 4));
    assert!(paginated.report.page_count > 1);
}

#[test]
fn an_empty_break_div_still_forces_its_page_break() {
    for markup in [
        "<p>One</p><div class=\"pb\"></div><p>Two</p>",
        "<section><p>One</p><div class=\"pb\"></div><p>Two</p></section>",
    ] {
        let html = format!(
            "<!DOCTYPE html><html><head><style>{SHORT_PAGE} .pb {{ page-break-before: always; }}</style></head><body>{markup}</body></html>"
        );
        let paginated = paginate(&html);
        assert_eq!(paginated.report.page_count, 2, "{markup}");
        assert_eq!(pages_with(&paginated, "One"), vec![0], "{markup}");
        assert_eq!(pages_with(&paginated, "Two"), vec![1], "{markup}");
    }
}

#[test]
fn a_group_that_falls_back_keeps_the_spacing_it_would_have_without_avoid() {
    let with_after = |css: &str| {
        grouped_table(css, 1, 40).replace(
            "</table>",
            "</table><p style=\"margin-top: 24px\">After</p>",
        )
    };
    let after_y = |html: &str| {
        let paginated = paginate(html);
        let last = paginated.pages.last().expect("pages");
        last.text_runs
            .iter()
            .find(|run| run.text.contains("After"))
            .map(|run| run.origin_y)
            .expect("After is on the last page")
    };
    let plain = after_y(&with_after(""));
    let kept = after_y(&with_after("tbody.meal { break-inside: avoid; }"));
    assert!(
        (plain - kept).abs() < 0.01,
        "After at {kept} with avoid, {plain} without"
    );
}

#[test]
fn a_forced_break_inside_an_avoid_group_wins() {
    let paginated = paginate(&grouped_table(
        "table { break-inside: avoid; } tbody.meal + tbody.meal { break-before: page; }",
        2,
        2,
    ));
    assert_eq!(paginated.report.page_count, 2);
    assert_eq!(pages_with(&paginated, "[G1R1]"), vec![0]);
    assert_eq!(pages_with(&paginated, "[G2R1]"), vec![1]);
}

/// `break-after: page` / `page-break-after: always` (Phase C step 04): the box after it starts a
/// new page, from a `<style>` rule, inline `style`, inside a flattened wrapper and between table
/// row groups; a forced break after the last box makes no trailing page; a break after a last
/// child propagates to its parent (CSS Fragmentation 3 §3.1). Chrome 155.0.8059.85 prints the WPT
/// css/CSS2/pagination references that use `page-break-after: always` this way.
#[test]
fn break_after_page_starts_the_next_box_on_a_fresh_page() {
    let doc = |css: &str, body: &str| {
        format!(
            "<!DOCTYPE html><html><head><style>{SHORT_PAGE} {css}</style></head><body>{body}</body></html>"
        )
    };
    let rule = paginate(&doc(
        ".end { break-after: page; }",
        "<h2 class=\"end\">Weekdays</h2><p>Monday</p><p>Tuesday</p>",
    ));
    assert_eq!(rule.report.page_count, 2);
    assert_eq!(pages_with(&rule, "Weekdays"), vec![0]);
    assert_eq!(pages_with(&rule, "Monday"), vec![1]);
    assert_eq!(pages_with(&rule, "Tuesday"), vec![1]);

    let inline = paginate(&doc(
        "",
        "<p style=\"page-break-after: always\">One</p><p>Two</p><p style=\"break-after: page\">Three</p>",
    ));
    assert_eq!(inline.report.page_count, 2, "no trailing blank page");
    assert_eq!(pages_with(&inline, "Two"), vec![1]);
    assert_eq!(pages_with(&inline, "Three"), vec![1]);

    let wrapped = paginate(&doc(
        "",
        "<div><p>Alpha</p><p style=\"break-after: page\">Beta</p><p>Gamma</p></div>",
    ));
    assert_eq!(wrapped.report.page_count, 2);
    assert_eq!(pages_with(&wrapped, "Beta"), vec![0]);
    assert_eq!(pages_with(&wrapped, "Gamma"), vec![1]);

    let propagated = paginate(&doc(
        "",
        "<section><p>First</p><p style=\"break-after: page\">Last child</p></section><p>Next</p>",
    ));
    assert_eq!(propagated.report.page_count, 2);
    assert_eq!(pages_with(&propagated, "Last child"), vec![0]);
    assert_eq!(pages_with(&propagated, "Next"), vec![1]);

    let groups = paginate(&grouped_table(
        "tbody.meal:first-of-type { break-after: page; }",
        2,
        2,
    ));
    assert_eq!(groups.report.page_count, 2);
    assert_eq!(pages_with(&groups, "[G1R2]"), vec![0]);
    assert_eq!(pages_with(&groups, "[G2R1]"), vec![1]);

    let avoid = paginate(&doc(
        ".x { break-after: avoid; }",
        "<p class=\"x\">A</p><p>B</p>",
    ));
    assert_eq!(avoid.report.page_count, 1);

    // Chrome 155 (probes fidelity/gate/snapshots/2026-10-28/c04-frag/probes/break-after.py): an empty
    // block after the break still opens page 2; an inline-block's break-after is ignored; an
    // absolutely positioned sibling stays on the break's page.
    let empty_next = paginate(&doc(
        "",
        "<p style=\"break-after: page\">One</p><div></div>",
    ));
    assert_eq!(empty_next.report.page_count, 2);
    let inline_block = paginate(&doc(
        "",
        "<p>One <span style=\"display: inline-block; break-after: page\">IB</span> Two</p><p>Three</p>",
    ));
    assert_eq!(inline_block.report.page_count, 1);
    let abspos = paginate(&doc(
        "",
        "<div style=\"position: relative\"><p style=\"break-after: page\">One</p>\
         <div style=\"position: absolute; top: 0; left: 200px\">Abs</div><p>Two</p></div>",
    ));
    assert_eq!(abspos.report.page_count, 2);
    assert_eq!(pages_with(&abspos, "Abs"), vec![0]);
    assert_eq!(pages_with(&abspos, "Two"), vec![1]);
}

/// A `<thead>` repeats only when it is at most a quarter of the page's content height (Chrome
/// 155: 48 px repeats and 49 px does not on a 192 px content box, probes
/// fidelity/gate/snapshots/2026-10-28/c04-frag/probes/thead-repeat*.py); one that does not repeat is
/// placed once, in the flow, and a forced break after it starts the body on the next page (WPT
/// css/CSS2/pagination/rowgroup-page-break-inside-avoid-5-print-ref.html). Phase C step 04.
#[test]
fn a_header_taller_than_a_quarter_page_is_not_repeated() {
    let table = |head_h: u32, css: &str| {
        let rows: String = (1..=12)
            .map(|i| format!("<tr><td><div style=\"height: 40px\">R{i}.</div></td></tr>"))
            .collect();
        format!(
            "<!DOCTYPE html><html><head><style>@page {{ size: 5in 3in; margin: 0.5in; }} \
             body {{ margin: 0 }} table {{ border-spacing: 0 }} td {{ padding: 0 }} {css}</style></head><body>\
             <table><thead><tr><td><div style=\"height: {head_h}px\">HEAD</div></td></tr></thead>\
             <tbody>{rows}</tbody></table></body></html>"
        )
    };
    let heads = |p: &pagination::Paginated| pages_with(p, "HEAD");
    let small = paginate(&table(48, ""));
    assert!(small.report.page_count > 1);
    assert_eq!(heads(&small).len(), small.report.page_count);
    let tall = paginate(&table(49, ""));
    assert!(tall.report.page_count > 1);
    assert_eq!(heads(&tall), vec![0]);

    let after = |head_h: u32| {
        let p = paginate(&table(head_h, "thead { page-break-after: always }"));
        (pages_with(&p, "HEAD"), pages_with(&p, "R1."))
    };
    // Chrome: a repeating header's break-after is inert (R1 stays under it on page 1); a
    // header that does not repeat sits alone on page 1.
    assert_eq!(after(20).1, vec![0]);
    assert_eq!(after(60), (vec![0], vec![1]));
}

/// A `<tfoot>` written before the body is laid out (and paginated) after it, and a
/// `break-inside: avoid` `<tbody>` of one oversize row starts on a fresh page before it is cut
/// (Chrome 155, WPT css/CSS2/pagination/rowgroup-page-break-inside-avoid-4-print.html).
#[test]
fn a_tfoot_follows_the_body_and_a_one_row_avoid_group_moves_before_it_is_cut() {
    let html = "<!DOCTYPE html><html><head><style>@page { size: 5in 3in; margin: 0.5in; } \
                p { height: 1in; width: 1in; margin: 0; } .test { page-break-inside: avoid; }</style></head><body>\
                <table border=\"1\"><tfoot><tr><td><p>Foot</p></td></tr></tfoot>\
                <thead><tr><td><p>Head</p></td></tr></thead>\
                <tbody class=\"test\"><tr><td><p>Body1</p><p>Body2</p></td></tr></tbody></table>\
                </body></html>";
    let p = paginate(html);
    assert_eq!(p.report.page_count, 3);
    assert_eq!(pages_with(&p, "Head"), vec![0]);
    assert_eq!(pages_with(&p, "Body1"), vec![1]);
    assert_eq!(pages_with(&p, "Foot"), vec![2]);
}
