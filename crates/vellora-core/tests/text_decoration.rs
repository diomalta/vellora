//! `text-decoration` lines reach the page (Phase C step 04; rules and Chrome measurements in
//! `src/text_decoration.rs`). These tests check the wiring on the paginated display list:
//! which runs carry which line, propagation from the decorating box, its colour and font
//! size, the boxes decorations do not enter, and the whole-px rects on the page.
//!
//! Chrome for Testing 155.0.8059.85 (local macOS arm64, INDICATIVE; 2026-10-28), PyMuPDF
//! `get_drawings()` x 4/3 of the reference print of
//! `fidelity/gate/snapshots/2026-10-28/c04-paint/repro/deco.html` and `deco2.html` (16 px
//! Liberation Sans, `@page { size: A4; margin: 10mm }`): a link's underline is a `#0000ee`
//! rect 1 px tall whose top is 1 px under the baseline; `<p style="text-decoration:
//! underline">` with a 30 px span: one 1 px line 1 px under the baseline for all of it; a
//! red underline under a blue span; nothing under an inline-block or a float.

use vellora_core::blitz_engine::TextRun;
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

fn doc(body: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>@page {{ size: A4; margin: 10mm }} \
         body {{ margin: 0; font: 16px \"Liberation Sans\" }}</style></head><body>{body}</body></html>"
    )
}

fn text_of(run: &TextRun) -> String {
    let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
    let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
    run.text[start..end].to_string()
}

/// Every run whose text contains `needle`, page 1.
fn runs<'a>(p: &'a pagination::Paginated, needle: &str) -> Vec<&'a TextRun> {
    p.pages[0]
        .text_runs
        .iter()
        .filter(|r| text_of(r).contains(needle))
        .collect()
}

#[test]
fn a_link_is_underlined_in_its_colour_one_px_under_the_whole_px_baseline() {
    let p = paginate(&doc(
        r#"<p><a href="https://example.com/">default link</a> plain</p>"#,
    ));
    let link = runs(&p, "default link");
    assert_eq!(link.len(), 1);
    let run = link[0];
    assert_eq!(run.origin_y.fract(), 0.0, "baselines are whole page px");
    assert_eq!(run.decorations.len(), 1, "{:?}", run.decorations);
    let d = &run.decorations[0];
    assert_eq!(
        (d.top, d.height, d.color, d.over_text),
        (1.0, 1.0, [0, 0, 0xee], false)
    );
    let advance: f64 = run.glyphs.iter().map(|g| f64::from(g.advance)).sum();
    assert!(
        (d.x, d.width) == (0.0, advance),
        "the line spans the run's advance"
    );
    // Chrome: 28.5 .. 85.88 pt = 38 .. 114.5 px.
    assert!((run.origin_x - 38.0).abs() < 0.01 && (advance - 76.5).abs() < 0.1);
    assert!(runs(&p, "plain")[0].decorations.is_empty());
}

#[test]
fn every_line_kind_lands_where_chrome_paints_it() {
    let p = paginate(&doc("<p style=\"text-decoration: overline\">over</p>\
         <p style=\"text-decoration: line-through\">strike</p>\
         <p style=\"font-size: 32px\"><u>big u</u></p>"));
    // 16 px Liberation Sans, ascent 14.48: overline -15 (1 px), line-through -5; 32 px
    // underline 3 px tall, top 2 px under the baseline.
    let over = &runs(&p, "over")[0].decorations;
    assert_eq!(
        (over[0].top, over[0].height, over[0].over_text),
        (-15.0, 1.0, false)
    );
    let strike = &runs(&p, "strike")[0].decorations;
    assert_eq!(
        (strike[0].top, strike[0].height, strike[0].over_text),
        (-5.0, 1.0, true)
    );
    let big = &runs(&p, "big u")[0].decorations;
    assert_eq!((big[0].top, big[0].height), (2.0, 3.0));
}

#[test]
fn a_propagated_line_takes_the_decorating_boxs_size_and_colour() {
    let p = paginate(&doc(
        "<p style=\"text-decoration: underline\">bold <span style=\"font-size: 30px\">tall</span> end</p>\
         <p style=\"text-decoration: underline red; color: green\">green <span style=\"color: blue\">blue</span></p>",
    ));
    let tall = &runs(&p, "tall")[0].decorations;
    assert_eq!(
        (tall[0].top, tall[0].height),
        (1.0, 1.0),
        "the 16 px paragraph's line, not a 30 px one (3 px, 2 px under)"
    );
    let blue = &runs(&p, "blue")[0].decorations;
    assert_eq!(blue[0].color, [0xff, 0, 0]);
}

#[test]
fn decorations_do_not_enter_inline_blocks_floats_or_abspos() {
    let p = paginate(&doc(
        "<p style=\"text-decoration: underline\">a <span style=\"display: inline-block\">ib</span> \
         <span style=\"float: right\">fl</span> <span style=\"position: absolute\">ab</span> z</p>",
    ));
    for inner in ["ib", "fl", "ab"] {
        assert!(
            runs(&p, inner)[0].decorations.is_empty(),
            "{inner} must not be underlined"
        );
    }
    assert_eq!(runs(&p, "z")[0].decorations.len(), 1);
}

#[test]
fn an_inline_blocks_own_decoration_still_applies_inside_it() {
    let p = paginate(&doc(
        "<p>x <span style=\"display: inline-block; text-decoration: underline\">ib</span></p>",
    ));
    assert_eq!(runs(&p, "ib")[0].decorations.len(), 1);
}

#[test]
fn the_spaces_a_line_ends_with_are_not_decorated() {
    // A 40 px box wraps "aaa bbb" after "aaa ": the first line's trailing space (if Parley
    // keeps a glyph for it) is not underlined.
    let p = paginate(&doc(
        "<p style=\"width: 40px; text-decoration: underline\">aaa bbb</p>",
    ));
    let first = runs(&p, "aaa")[0];
    let advance_no_space: f64 = first
        .glyphs
        .iter()
        .filter(|g| first.text[g.text_start..g.text_end].trim() != "")
        .map(|g| f64::from(g.advance))
        .sum();
    assert!(
        (first.decorations[0].width - advance_no_space).abs() < 1e-6,
        "line {} vs advance without the space {advance_no_space}",
        first.decorations[0].width
    );
}

#[test]
fn undecorated_text_carries_no_lines() {
    let p = paginate(&doc("<p>plain <b>bold</b> <a>no href</a></p>"));
    assert!(p.pages[0]
        .text_runs
        .iter()
        .all(|r| r.decorations.is_empty()));
}
