//! Chrome-verified text: for the probe pages in `tests/fixtures/text-probes/`, the text of every
//! visual line and the x of each run vellora lays out must be what Chrome renders for the SAME
//! bytes. Reference: Chrome 155.0.8059.85, print media, the bundled Liberation faces injected as
//! `@font-face`, `font-family: sans-serif` rewritten to "Liberation Sans" on the Chrome side only
//! (vellora maps the generic to its bundled Liberation Sans). Method and evidence:
//! `fidelity/layout-diff/text-probe.mjs`, output
//! `fidelity/layout-diff/snapshots/2026-10-21/text-probe/` (local macOS run, INDICATIVE).
//!
//! These settle the Phase A whitespace contradiction (2026-10-21): Blitz 0.3.0-beta.4 + vellora's
//! reader keep every space Chrome renders — a space opening or closing a span, between elements,
//! a collapsed double space, a collapsed newline, a no-break space, the text of a padded cell —
//! and drop exactly the ones Chrome collapses. Chrome's coordinates are the x of the run's first
//! rendered glyph (a run that opens with a space starts at that space).

use vellora_core::{blitz_engine, page_css, render, validation, RenderOptions};

const MIXED_WEIGHT: &str = include_str!("fixtures/text-probes/mixed-weight.html");
const INLINE_PADDING: &str = include_str!("fixtures/text-probes/inline-padding.html");
const WHITESPACE: &str = include_str!("fixtures/text-probes/whitespace.html");

/// Chrome vs vellora tolerance for a run's x (CSS px). The probe measured |dx| <= 0.022 px.
const CHROME_TOL_PX: f64 = 0.5;

/// The render path's layout (same `@page` content width the probe's Chrome viewport used).
fn lay_out_like_render(html: &str) -> blitz_engine::LaidOutDoc {
    let page_box = page_css::parse_page_box(html);
    blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        page_box.content_width(),
        page_box.content_height(),
        &Default::default(),
        None,
        &[],
    )
    .ok()
    .expect("probe lays out")
}

struct Run {
    text: String,
    x: f64,
}

/// Visual lines: runs grouped by baseline, sorted by x; a run's text is the source substring its
/// glyph clusters cover (what the PDF's ToUnicode carries).
fn visual_lines(doc: &blitz_engine::LaidOutDoc) -> Vec<Vec<Run>> {
    let mut lines: Vec<(f64, Vec<Run>)> = Vec::new();
    for run in doc.boxes.iter().flat_map(|b| b.text_runs.iter()) {
        let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
        let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
        let item = Run {
            text: run.text[start..end].to_string(),
            x: run.origin_x,
        };
        match lines
            .iter_mut()
            .find(|(y, _)| (y - run.origin_y).abs() < 2.0)
        {
            Some((_, items)) => items.push(item),
            None => lines.push((run.origin_y, vec![item])),
        }
    }
    lines.sort_by(|a, b| a.0.total_cmp(&b.0));
    lines
        .into_iter()
        .map(|(_, mut items)| {
            items.sort_by(|a, b| a.x.total_cmp(&b.x));
            items
        })
        .collect()
}

/// A line's text as Chrome shows it (trailing whitespace hangs at a line end in Chrome).
fn line_text(line: &[Run]) -> String {
    line.iter()
        .map(|r| r.text.as_str())
        .collect::<String>()
        .trim_end()
        .to_string()
}

fn describe(lines: &[Vec<Run>]) -> String {
    lines
        .iter()
        .enumerate()
        .map(|(i, l)| {
            let runs: Vec<String> = l
                .iter()
                .map(|r| format!("{:?}@{:.3}", r.text, r.x))
                .collect();
            format!("line {i}: {}", runs.join(" "))
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// `(line, run text, Chrome x)`: the run with exactly this text on that line starts where Chrome
/// draws its first glyph.
fn assert_runs_at_chrome_x(lines: &[Vec<Run>], expected: &[(usize, &str, f64)]) {
    for &(line, text, chrome_x) in expected {
        let run = lines[line]
            .iter()
            .find(|r| r.text == text)
            .unwrap_or_else(|| panic!("no run {text:?} on line {line}\n{}", describe(lines)));
        assert!(
            (run.x - chrome_x).abs() <= CHROME_TOL_PX,
            "run {text:?} on line {line}: vellora x {:.3}, Chrome x {chrome_x}\n{}",
            run.x,
            describe(lines)
        );
    }
}

/// The PDF's extracted text with whitespace runs collapsed. pdf-extract inserts its own space
/// between separately positioned runs (it reads "Alpha  Beta" where poppler's pdftotext reads
/// "Alpha Beta" for both vellora's and Chrome's PDF — see the probe's `pdftotext_raw`), so only
/// the collapsed form is compared here; the space GLYPH itself is asserted on the runs.
fn pdf_text_collapsed(html: &str) -> String {
    let opts = RenderOptions {
        creation_date: Some((2026, 6, 23)),
        ..Default::default()
    };
    let bytes = render(html.as_bytes(), &opts).expect("render");
    let text = pdf_extract::extract_text_from_mem(&bytes).expect("extract text");
    text.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[test]
fn mixed_weight_probe_matches_chrome() {
    let lines = visual_lines(&lay_out_like_render(MIXED_WEIGHT));
    let texts: Vec<String> = lines.iter().map(|l| line_text(l)).collect();
    assert_eq!(
        texts,
        ["Acme Widgets Comércio LTDA — CNPJ 12.345.678/0001-90"]
    );
    assert_runs_at_chrome_x(
        &lines,
        &[
            (0, "Acme Widgets Comércio LTDA", 12.0),
            (0, " — CNPJ 12.345.678/0001-90", 187.703),
        ],
    );
    // A real space glyph opens the second span's run (what the PDF's ToUnicode carries), with
    // Chrome's advance: the dash starts at Chrome's 191.031.
    let doc = lay_out_like_render(MIXED_WEIGHT);
    let run = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter())
        .find(|r| {
            r.glyphs
                .first()
                .is_some_and(|g| &r.text[g.text_start..g.text_end] == " ")
        })
        .expect("a run that opens with a space glyph");
    let space = &run.glyphs[0];
    assert!((run.origin_x + space.advance as f64 - 191.031).abs() <= CHROME_TOL_PX);
    assert!(pdf_text_collapsed(MIXED_WEIGHT).contains("LTDA — CNPJ 12.345.678/0001-90"));
}

/// Page-local x in pt of the first non-space glyph of each named run on page 1 (the render
/// path through pagination), i.e. what PyMuPDF reports as the word's x.
fn page_x_pt(html: &str, words: &[&str]) -> Vec<f64> {
    let page_box = page_css::parse_page_box(html);
    let laid_out = lay_out_like_render(html);
    let paginated = vellora_core::pagination::paginate(&laid_out, &page_box);
    words
        .iter()
        .map(|word| {
            let run = paginated.pages[0]
                .text_runs
                .iter()
                .find(|run| {
                    let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
                    let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
                    run.text[start..end].trim() == *word
                })
                .unwrap_or_else(|| panic!("{word:?} on page 1"));
            let leading_space: f64 = run
                .glyphs
                .iter()
                .take_while(|g| run.text[g.text_start..g.text_end].trim().is_empty())
                .map(|g| f64::from(g.advance))
                .sum();
            (run.origin_x + leading_space) * 0.75
        })
        .collect()
}

#[test]
fn rtl_start_and_end_align_the_inline_padding_like_chrome() {
    // Port step 09: the padding-right compensation of a right-aligned line follows the side
    // Parley aligned the line to (`text-align` with `start`/`end` resolved against `direction`),
    // not the keyword: `direction: rtl; text-align: start` is right-aligned, `end` left-aligned.
    // Chrome 155 (`fidelity/baselines/port/09-review-fixes/attachments/
    // chrome-probes-review-fixes.json`, probes r_*), x of "Aaa", "Bbb", "Ccc" in pt on an A4
    // page with 10 mm margins; `<span>Bbb</span>` has padding-right 20 px (and padding-left 7 px
    // in the first two). Step 08: rtl start (264.37, 286.69, 324.69), rtl end (13.35, 35.66,
    // 73.67), rtl root (502.12, 524.44, 562.44): every run off by the 15 pt padding.
    const TOL_PT: f64 = 0.75;
    // KNOWN GAP (unchanged, ltr too): a span's padding-LEFT does not move the runs (5.25 pt).
    const PADDING_LEFT_PT: f64 = 7.0 * 0.75;
    let probe = |align: &str, dir: &str, html_dir: &str, padding: &str| {
        format!(
            "<!DOCTYPE html><html{html_dir}><head><style>@page {{ size: A4; margin: 10mm }} \
             body {{ margin: 0; font-family: \"Liberation Serif\"; font-size: 16px; line-height: \
             20px; }} p {{ margin: 0; }} div {{ {align} width: 400px }} span {{ {padding} }}\
             </style></head><body><div{dir}>Aaa <span>Bbb</span> Ccc</div></body></html>"
        )
    };
    let both = "padding-right: 20px; padding-left: 7px";
    let cases: &[(&str, String, [f64; 3], [f64; 3])] = &[
        (
            "rtl start (right-aligned)",
            probe("text-align: start;", " dir=\"rtl\"", "", both),
            [244.27, 271.84, 309.84],
            [PADDING_LEFT_PT, 0.0, 0.0],
        ),
        (
            "rtl end (left-aligned)",
            probe("text-align: end;", " dir=\"rtl\"", "", both),
            [28.50, 56.07, 94.08],
            [0.0, -PADDING_LEFT_PT, -PADDING_LEFT_PT],
        ),
        (
            "ltr end (right-aligned, unchanged)",
            probe("text-align: end;", "", "", both),
            [244.27, 271.84, 309.84],
            [PADDING_LEFT_PT, 0.0, 0.0],
        ),
        (
            "rtl root, start",
            probe("", "", " dir=\"rtl\"", "padding-right: 20px"),
            [487.79, 510.12, 548.12],
            [0.0, 0.0, 0.0],
        ),
    ];
    for (what, html, chrome, gap) in cases {
        let x = page_x_pt(html, &["Aaa", "Bbb", "Ccc"]);
        for i in 0..3 {
            assert!(
                (x[i] - chrome[i] - gap[i]).abs() <= TOL_PT,
                "{what}: run {i} at {:.2} pt, Chrome {:.2} pt (+ known gap {:.2})",
                x[i],
                chrome[i],
                gap[i]
            );
        }
    }
}

#[test]
fn inline_padding_probe_matches_chrome() {
    let lines = visual_lines(&lay_out_like_render(INLINE_PADDING));
    let texts: Vec<String> = lines.iter().map(|l| line_text(l)).collect();
    assert_eq!(
        texts,
        ["LABELVALUE", "NUMBERINV-2026-00417", "NúmeroINV-2026-00417"]
    );
    // A span's padding-right (24 px) separates it from the next run, on a left-aligned line and
    // on a right-aligned one (where the padded label moves left instead).
    assert_runs_at_chrome_x(
        &lines,
        &[
            (0, "LABEL", 8.0),
            (0, "VALUE", 69.359),
            (1, "NUMBER", 8.0),
            (1, "INV-2026-00417", 84.016),
            (2, "Número", 173.906),
            (2, "INV-2026-00417", 240.594),
        ],
    );
}

#[test]
fn whitespace_probe_keeps_every_space_chrome_renders() {
    let lines = visual_lines(&lay_out_like_render(WHITESPACE));
    let texts: Vec<String> = lines.iter().map(|l| line_text(l)).collect();
    assert_eq!(
        texts,
        [
            "Alpha Beta",         // <b>Alpha</b><span> Beta</span>
            "Alpha Beta",         // <b>Alpha </b><span>Beta</span>
            "Alpha Beta",         // <b>Alpha</b> <i>Beta</i>
            "Alpha Beta",         // <span>Alpha </span><span> Beta</span> (collapsed)
            "Alpha Beta",         // newline + indent between spans (collapsed)
            "Alpha\u{a0}Beta",    // &nbsp;
            "LTDA — CNPJ 12.345", // <b>LTDA</b><span> — CNPJ</span> 12.345
            "Alpha Beta",         // <td>   Alpha  <b>Beta</b>   </td>
            "Total 9,00",         // right-aligned cell
            "Total 9,00",         // right-aligned padded block
            "alpha beta",         // wrapped: the break space hangs
            "gamma delta",
        ],
        "\n{}",
        describe(&lines)
    );
    assert_runs_at_chrome_x(
        &lines,
        &[
            (0, "Alpha", 8.0),
            (0, " Beta", 41.344),
            (1, "Alpha ", 8.0),
            (1, "Beta", 44.672),
            (2, "Alpha", 8.0),
            (2, "Beta", 44.688),
            (3, "Alpha ", 8.0),
            (3, "Beta", 42.031),
            (4, "Alpha", 8.0),
            (4, "Beta", 42.047),
            (5, "Alpha", 8.0),
            (5, "Beta", 42.047),
            (6, "LTDA", 8.0),
            (6, " — CNPJ", 39.109),
            (6, " 12.345", 89.125),
            (7, "Alpha ", 12.0),
            (8, "9,00", 188.641),
            (9, "9,00", 194.641),
            (10, "alpha beta ", 8.0),
            (11, "gamma delta", 8.0),
        ],
    );
    // Text styled by the padded inline ROOT itself (the cell / block, not an inline span): the
    // root's padding-right is its content-box inset, not an inline advance. Before the
    // `run_padding_right_px` fix the reader added it after the root's run: "Beta" +3.994 px, and
    // on right-aligned lines it pulled the preceding run left by the padding (−3.99 / −9.99 px;
    // `text-probe.before-fix.json`). Raw Blitz text (B0) was already at Chrome's x.
    assert_runs_at_chrome_x(
        &lines,
        &[
            (7, "Beta", 46.031),
            (8, "Total ", 159.953),
            (9, "Total ", 165.953),
        ],
    );
    // The PDF's extractable text keeps the same words in the same order.
    let text = pdf_text_collapsed(WHITESPACE);
    for expected in [
        "Alpha Beta",
        "LTDA — CNPJ 12.345",
        "Total 9,00",
        "alpha beta",
    ] {
        assert!(text.contains(expected), "{expected:?} not in {text:?}");
    }
}
