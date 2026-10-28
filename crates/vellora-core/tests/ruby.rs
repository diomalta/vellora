//! Ruby layout (Phase C step 06, `vellora_core::ruby` via `blitz_engine`): the geometry Chrome
//! for Testing 155.0.8059.85 lays out (2026-10-28, local macOS, print media, measured with
//! `getBoundingClientRect` on the same markup; the probes and the script are recorded in
//! `fidelity/gate/snapshots/2026-10-28/c06-ruby/README.md`).

use vellora_core::{blitz_engine, page_css, pagination, validation, RenderOptions};

/// `(x, y, width, height)` in CSS px.
type Rect = (f64, f64, f64, f64);

/// Page 1 of `html`: its rects and its text runs.
struct Page {
    rects: Vec<([u8; 3], Rect)>,
    /// `(trimmed text, x, baseline y, advance)`.
    runs: Vec<(String, f64, f64, f64)>,
}

fn page(html: &str) -> Page {
    let html =
        format!("<!DOCTYPE html><style>@page {{ size: 800px 600px; margin: 0 }}</style>{html}");
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
    let page = pagination::paginate(&doc, &page_box).pages.remove(0);
    Page {
        rects: page
            .rects
            .iter()
            .map(|r| (r.color, (r.x, r.y, r.width, r.height)))
            .collect(),
        runs: page
            .text_runs
            .iter()
            .filter_map(|run| {
                let start = run.glyphs.iter().map(|g| g.text_start).min()?;
                let end = run.glyphs.iter().map(|g| g.text_end).max()?;
                let advance: f64 = run.glyphs.iter().map(|g| f64::from(g.advance)).sum();
                let text = run.text[start..end].trim().to_string();
                Some((text, run.origin_x, run.origin_y, advance))
            })
            .collect(),
    }
}

/// `(x, y, width, height)` of the page's rects of `color`, in CSS px.
fn rects(page: &Page, color: [u8; 3]) -> Vec<Rect> {
    page.rects
        .iter()
        .filter(|r| r.0 == color)
        .map(|r| r.1)
        .collect()
}

/// `(x, baseline y, advance)` of the page's run whose trimmed text is `text`.
fn run(page: &Page, text: &str) -> (f64, f64, f64) {
    page.runs
        .iter()
        .find(|r| r.0 == text)
        .map(|r| (r.1, r.2, r.3))
        .unwrap_or_else(|| panic!("no run {text:?} in {:?}", page.runs))
}

const GREEN: [u8; 3] = [0, 128, 0];
const RED: [u8; 3] = [255, 0, 0];

/// WPT css/css-break/ruby-003's ruby (an inline-block base, an inline-block annotation), without
/// and with its one-column `column-fill: auto` container. Chrome: the annotation 50 px block
/// right on top of the base one (8,128 and 8,178), the line 104 px tall (50 + 50 + the 4 px strut
/// descent); in the 60 px column the whole line stays in it, overflowing (8,50 and 8,100).
#[test]
fn an_atomic_annotation_sits_right_on_top_of_its_base_and_its_line_stays_whole_in_a_column() {
    let ruby = r#"<ruby>
        <div class="ib"></div>
        <rt>
          <div class="ib"></div>
        </rt>
      </ruby>"#;
    let style = "<style>.ib { display: inline-block; width: 100px; height: 50px; \
                 background: rgb(0,128,0); }</style>";
    let flow = page(&format!(
        "{style}<div style=\"height:120px\"></div>\
         <div style=\"width:100px; background:rgb(255,0,0)\">{ruby}</div>"
    ));
    assert_eq!(
        rects(&flow, GREEN),
        vec![(8.0, 128.0, 100.0, 50.0), (8.0, 178.0, 100.0, 50.0)]
    );
    assert_eq!(rects(&flow, RED), vec![(8.0, 128.0, 100.0, 104.0)]);

    let columns = page(&format!(
        "{style}<div style=\"height:42px\"></div>\
         <div style=\"columns:1; width:100px; column-fill:auto; height:60px; \
         background:rgb(255,0,0)\">{ruby}</div>"
    ));
    assert_eq!(
        rects(&columns, GREEN),
        vec![(8.0, 50.0, 100.0, 50.0), (8.0, 100.0, 100.0, 50.0)]
    );
}

/// Text ruby, Liberation Serif 20 px (annotation 10 px). Chrome, first line of the document:
/// base baseline 26 (glyph box top 8), annotation baseline 8 (glyph box top -1), the line box
/// 31 px tall instead of 23: the annotation's em box (8 + 2) right on top of the base's (16 + 4).
/// With `line-height: 3` (60 px) it fits in the leading: the line keeps its 60 px.
#[test]
fn a_text_annotation_sits_on_the_base_em_box_and_grows_the_line_only_past_its_leading() {
    let p = page(
        r#"<style>body { margin: 0; font: 20px "Liberation Serif" }</style>
        <div>xx <ruby>base<rt>an</rt></ruby> yy</div>
        <div style="background: rgb(0,0,255); height: 10px"></div>
        <div style="line-height: 3">xx <ruby>bbbb<rt>aa</rt></ruby> yy</div>
        <div style="background: rgb(0,0,254); height: 10px"></div>"#,
    );
    let (base_x, base_y, base_w) = run(&p, "base");
    let (an_x, an_y, an_w) = run(&p, "an");
    assert_eq!((base_y, an_y), (26.0, 8.0));
    assert!(
        ((base_x + base_w / 2.0) - (an_x + an_w / 2.0)).abs() < 1.0,
        "centred"
    );
    // 31 px line, 10 px block.
    assert_eq!(rects(&p, [0, 0, 255]), vec![(0.0, 31.0, 800.0, 10.0)]);
    // Chrome: the 60 px line keeps its height; base baseline 19 + 18 below its top.
    assert_eq!(rects(&p, [0, 0, 254]), vec![(0.0, 101.0, 800.0, 10.0)]);
    let (_, bbbb_y, _) = run(&p, "bbbb");
    let (_, aa_y, _) = run(&p, "aa");
    assert_eq!((bbbb_y - 41.0, bbbb_y - aa_y), (37.0, 18.0));
}

/// Chrome 155's pairing: each `<rt>` takes the content since the previous one as its base
/// (`<rb>` pairs nothing), so `<rb>A</rb><rb>BBBB</rb><rt>x</rt><rt>yy</rt>` is one column
/// "A BBBB" / "x" (Chrome: annotation box 25-92.81) and a base-less one "yy" (92.81-102.81),
/// followed by " yy" at 102.81. `<rp>` is not rendered.
#[test]
fn each_rt_pairs_with_the_content_since_the_previous_one() {
    let p = page(
        r#"<style>body { margin: 0; font: 20px "Liberation Serif" }</style>
        <div>xx <ruby><rb>A</rb><rb>BBBB</rb><rt>x</rt><rt>yy</rt></ruby> zz</div>
        <div>xx <ruby>A<rp>(</rp><rt>q</rt><rp>)</rp></ruby> zz</div>"#,
    );
    let (x_x, _, x_w) = run(&p, "x");
    assert!(
        ((x_x + x_w / 2.0) - (25.0 + 92.81) / 2.0).abs() < 1.0,
        "{x_x} {x_w}"
    );
    let (yy_x, _, _) = run(&p, "yy");
    assert!((yy_x - 92.81).abs() < 1.0, "{yy_x}");
    let (zz_x, _, _) = run(&p, "zz");
    assert!((zz_x - 102.81).abs() < 1.5, "{zz_x}");
    assert!(p.runs.iter().all(|r| !r.0.contains('(')), "{:?}", p.runs);
}

/// Chrome 155 keeps a ruby on one line: `aaa <ruby>bbbbbb<rt>x</rt>cccccc<rt>y</rt></ruby> dd`
/// in 120 px puts the whole 113 px ruby on line 2 (both bases at x 0 and 60), "dd" on line 3.
#[test]
fn a_ruby_is_never_broken_between_its_columns() {
    let p = page(
        r#"<style>body { margin: 0; font: 20px "Liberation Serif" }</style>
        <div style="width: 120px">aaa <ruby>bbbbbb<rt>x</rt>cccccc<rt>y</rt></ruby> dd</div>"#,
    );
    let (b_x, b_y, _) = run(&p, "bbbbbb");
    let (c_x, c_y, _) = run(&p, "cccccc");
    let (_, a_y, _) = run(&p, "aaa");
    assert_eq!((b_x, b_y), (0.0, c_y));
    assert!((c_x - 60.0).abs() < 0.5, "{c_x}");
    assert!(b_y > a_y);
}

/// DET-1: the ruby pass (font tables read per face, lookup-only maps) renders the same bytes
/// twice.
#[test]
fn ruby_renders_byte_identically() {
    let html = r#"<html><body style="font: 20px 'Liberation Serif'">
        <p>xx <ruby>漢<rt>kan</rt>字<rt>ji</rt></ruby> <ruby dir="rtl">ab<rt>c</rt></ruby>
        <ruby><span style="display:inline-block;width:40px;height:30px"></span><rt>wide annotation</rt></ruby></p>
        </body></html>"#;
    let a = vellora_core::render(html.as_bytes(), &RenderOptions::default()).expect("renders");
    let b = vellora_core::render(html.as_bytes(), &RenderOptions::default()).expect("renders");
    assert_eq!(a, b);
}
