//! Text baselines on the printed page against Chrome (Phase C step 03).
//!
//! Chrome for Testing 155.0.8059.85 prints every text baseline on a whole CSS px of the page
//! (PyMuPDF origins of `page.pdf()`, the fidelity reference print path; local macOS, so
//! INDICATIVE; 2026-10-27). Probe HTML, script and raw numbers:
//! `fidelity/gate/snapshots/2026-10-27/c03/layoutunit/baseline-snap/` (`chrome-baselines.mjs`,
//! `chrome-baselines.json`). The numbers below are those baselines in CSS px from the page top.

use vellora_core::pdf::PdfPage;
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

/// Page-1 baselines (CSS px from the page top) of the runs `L0`..`L<n-1>`.
fn baselines(html: &str, n: usize) -> Vec<f64> {
    let p = paginate(html);
    let page: &PdfPage = &p.pages[0];
    (0..n)
        .map(|i| {
            let text = format!("L{i}");
            page.text_runs
                .iter()
                .find(|run| run.text.trim() == text)
                .unwrap_or_else(|| panic!("no run {text}"))
                .origin_y
        })
        .collect()
}

fn page(css: &str) -> String {
    let lines: String = (0..6).map(|i| format!("<div>L{i}</div>")).collect();
    format!(
        "<!DOCTYPE html><html><head><style>@page{{size:A4;margin:16mm}}body{{margin:0;\
         font-family:\"Liberation Sans\";font-size:8.5pt;line-height:1.35}}{css}</style></head>\
         <body>{lines}</body></html>"
    )
}

/// `plain_16mm`: 8.5pt x 1.35 lines (15.28125 px apart in Chrome) under a 16mm (60.47 px) top
/// page margin.
#[test]
fn baselines_land_on_chromes_whole_px_under_a_fractional_page_margin() {
    assert_eq!(
        baselines(&page(""), 6),
        vec![71.0, 86.0, 102.0, 117.0, 132.0, 147.0]
    );
}

/// `pad_16mm`: the same lines, each block 0.3 px lower than the last (`padding-top: 0.3px`,
/// 0.296875 in Chrome), so the fractional part of the layout baseline varies line by line.
#[test]
fn baselines_land_on_chromes_whole_px_with_drifting_fractions() {
    assert_eq!(
        baselines(&page("div{padding-top:0.3px}"), 6),
        vec![71.0, 87.0, 102.0, 118.0, 134.0, 149.0]
    );
}
