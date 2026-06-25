//! Targeted pagination + layout edge tests (exact-fill,
//! oversize row, blank page).

use vellora_core::blitz_engine;
use vellora_core::page_css::{self, PageBox};
use vellora_core::pagination;

/// Build a page box with an explicit usable height for deterministic breaking.
fn page(width: f64, height: f64, margin: f64) -> PageBox {
    let mut pb = PageBox::default_a4();
    pb.width = width;
    pb.height = height;
    pb.margin_top = margin;
    pb.margin_right = margin;
    pb.margin_bottom = margin;
    pb.margin_left = margin;
    pb.margins_content.clear();
    pb
}

#[test]
fn each_element_type_yields_a_positioned_box() {
    // block/inline/table/img/text each produce a positioned box.
    let html = r#"<!DOCTYPE html><html><body style="margin:0">
        <div style="width:100px;height:30px">block</div>
        <p><span>inline</span> text</p>
        <table style="width:200px"><tr><td>cell</td></tr></table>
        <img src="x" style="width:40px;height:40px" />
    </body></html>"#;
    let doc = blitz_engine::lay_out(html);
    for tag in ["div", "p", "span", "table", "td", "img"] {
        let b = doc
            .boxes
            .iter()
            .find(|b| b.tag.as_deref() == Some(tag))
            .unwrap_or_else(|| panic!("{tag} box present"));
        assert!(
            b.width >= 0.0 && b.height >= 0.0 && b.x.is_finite() && b.y.is_finite(),
            "{tag} box is positioned with a real rectangle"
        );
    }
    let has_text = doc.boxes.iter().any(|b| !b.text_runs.is_empty());
    assert!(has_text, "at least one shaped text run");
}

#[test]
fn content_fitting_one_page_emits_no_trailing_blank() {
    let html = r#"<!DOCTYPE html><html><body style="margin:0">
        <p style="font-size:12px">short</p>
    </body></html>"#;
    let doc = blitz_engine::lay_out(html);
    let pb = page(800.0, 1000.0, 20.0);
    let paginated = pagination::paginate(&doc, &pb);
    assert_eq!(
        paginated.report.page_count, 1,
        "single page, no trailing blank"
    );
}

#[test]
fn oversize_row_gets_its_own_page_and_terminates() {
    // a single fragment taller than a full usable page is placed on
    // its own page (clipped), never split, and pagination terminates.
    let big = 5000;
    let html = format!(
        r#"<!DOCTYPE html><html><body style="margin:0">
            <div style="height:{big}px">huge</div>
            <p>after</p>
        </body></html>"#
    );
    let doc = blitz_engine::lay_out(&html);
    // Usable height (200px) is far smaller than the 5000px block.
    let pb = page(600.0, 240.0, 20.0);
    let paginated = pagination::paginate(&doc, &pb);

    assert!(paginated.report.oversize_hit, "oversize branch taken");
    // Bounded page count (no unbounded emission): the huge block is one page,
    // plus surrounding content -> a small finite number.
    assert!(
        paginated.report.page_count <= 4,
        "pagination terminates with a bounded page count, got {}",
        paginated.report.page_count
    );
}

#[test]
fn oversize_top_level_block_ignores_surrounding_whitespace_fragments() {
    // Pretty-printed HTML creates top-level whitespace text nodes around the
    // real body child. Those nodes must not become blank pages when the real
    // block is taller than the usable page.
    let html = r#"<!DOCTYPE html><html><body style="margin:0">

            <div style="height:500px">huge</div>

        </body></html>"#;
    let doc = blitz_engine::lay_out(html);
    let pb = page(600.0, 240.0, 20.0);
    let paginated = pagination::paginate(&doc, &pb);

    assert!(paginated.report.oversize_hit, "oversize branch taken");
    assert_eq!(
        paginated.report.page_count, 1,
        "whitespace-only fragments must not create blank pages"
    );
    assert!(
        paginated.pages[0]
            .text_runs
            .iter()
            .any(|run| run.text.contains("huge")),
        "the real oversize block should be on the only emitted page"
    );
}

#[test]
fn transparent_top_level_wrapper_breaks_between_child_blocks() {
    // A common document shape wraps the whole page body in a centering/layout
    // div. If that wrapper has no own paint/text, pagination should split its
    // block children rather than treating the wrapper as one indivisible
    // oversize fragment.
    let html = r#"<!DOCTYPE html><html><body style="margin:0">
        <div style="width:300px">
            <section style="height:140px">first block</section>
            <section style="height:140px">second block</section>
        </div>
    </body></html>"#;
    let doc = blitz_engine::lay_out(html);
    let pb = page(600.0, 240.0, 20.0);
    let paginated = pagination::paginate(&doc, &pb);

    assert_eq!(
        paginated.report.page_count, 2,
        "transparent wrapper children should paginate as separate fragments"
    );
    assert!(
        paginated.pages[0]
            .text_runs
            .iter()
            .any(|run| run.text.contains("first block")),
        "first block should be on page 1"
    );
    assert!(
        paginated.pages[1]
            .text_runs
            .iter()
            .any(|run| run.text.contains("second block")),
        "second block should be on page 2"
    );
}

#[test]
fn no_renderable_content_yields_one_blank_page() {
    let doc = blitz_engine::lay_out("<!DOCTYPE html><html></html>");
    let pb = page(600.0, 800.0, 20.0);
    let paginated = pagination::paginate(&doc, &pb);
    assert_eq!(paginated.report.page_count, 1, "exactly one blank page");
}

#[test]
fn empty_body_footer_report_is_in_lockstep_with_emission() {
    // A whitespace-only document with a @bottom-center footer has no body
    // font to shape the footer with, so no MarginText is emitted. The reported
    // footer string must then be empty too — report and output must agree.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { @bottom-center { content: "Page " counter(page) " of " counter(pages); } }
    </style></head><body>   </body></html>"#;
    let doc = blitz_engine::lay_out(html);
    let pb = page_css::parse_page_box(html);
    let paginated = pagination::paginate(&doc, &pb);

    assert_eq!(paginated.report.page_count, 1);
    let page0 = &paginated.pages[0];
    // No footer was rendered (no body font), so none was reported either.
    assert!(
        page0.margin_texts.is_empty(),
        "no margin text emitted for a font-less page"
    );
    assert!(
        paginated.report.footers[0].is_empty(),
        "reported footer must be empty when none is emitted, got {:?}",
        paginated.report.footers[0]
    );
}

#[test]
fn validation_does_not_double_parse_or_mutate_tree() {
    // validate over an in-subset doc leaves it parseable and the
    // gate is a single traversal (no panic, deterministic). We assert it twice
    // reports identically and that layout afterwards still succeeds.
    let html = r#"<!DOCTYPE html><html><head><style>@page{size:A4}</style></head>
        <body><p>ok</p></body></html>"#;
    assert!(vellora_core::validation::validate(html).is_ok());
    assert!(vellora_core::validation::validate(html).is_ok());
    let doc = blitz_engine::lay_out(html);
    assert!(
        !doc.boxes.is_empty(),
        "tree still lays out after validation"
    );
}

#[test]
fn at_page_size_drives_usable_rect_synthetic() {
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: 500px 700px; margin: 25px 30px; }
    </style></head><body><p>x</p></body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert_eq!(pb.width, 500.0);
    assert_eq!(pb.height, 700.0);
    assert_eq!(pb.margin_top, 25.0);
    assert_eq!(pb.margin_left, 30.0);
    assert_eq!(pb.content_width(), 500.0 - 60.0);
    assert_eq!(pb.content_height(), 700.0 - 50.0);
}
