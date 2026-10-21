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
