//! Deeply nested and adversarial input (port step 09, review blocker).
//!
//! A stack overflow is not a panic: `catch_unwind` cannot turn it into a rejected promise, so
//! it kills the whole Node process (20 000 nested `@media all {` exited with SIGILL through
//! the napi addon at port step 08). Everything that reads user input before the nesting-depth
//! gate (`validation::validate_nesting_depth`, SEC-1) must therefore neither recurse per
//! nesting level nor cost more than linear time. These tests run that code on a thread with a
//! deliberately small stack, so any per-level recursion overflows here, and they compare the
//! time of two input sizes, so a quadratic scan fails here.
//!
//! Each test runs one worker thread at a time and takes the minimum of three runs for its
//! timing ratios; the bounds are generous (a linear cost grows ~4x for 4x the input, the
//! quadratic scans this step removed ~16x).

use std::time::{Duration, Instant};

use vellora_core::{break_css, page_css, validation, RenderOptions, VelloraError};

const DEPTH: usize = 200_000;
/// A walk that recursed once per nesting level overflows this in a few thousand levels.
const SMALL_STACK: usize = 256 * 1024;

fn on_stack<T: Send + 'static>(stack: usize, f: impl FnOnce() -> T + Send + 'static) -> T {
    std::thread::Builder::new()
        .stack_size(stack)
        .spawn(f)
        .expect("spawn")
        .join()
        .expect("no panic")
}

fn css_doc(css: &str) -> String {
    format!(
        "<!DOCTYPE html><html><head><style>{css}</style></head><body><p>x</p>\
         <p class=\"deep\">y</p></body></html>"
    )
}

/// Block kinds nested `n` deep around an `@page` rule and a break rule.
struct Kind {
    name: &'static str,
    open: &'static str,
    close: &'static str,
    /// The `@page` margin and the `.deep` forced break inside the nest apply (page_css and
    /// break_css enter these blocks).
    entered_by_page_css: bool,
    entered_by_break_css: bool,
}

const KINDS: &[Kind] = &[
    Kind {
        name: "@media",
        open: "@media all { ",
        close: "}",
        entered_by_page_css: true,
        entered_by_break_css: true,
    },
    Kind {
        name: "@layer",
        open: "@layer a { ",
        close: "}",
        entered_by_page_css: true,
        entered_by_break_css: false,
    },
    Kind {
        name: "anonymous @layer",
        open: "@layer { ",
        close: "}",
        entered_by_page_css: true,
        entered_by_break_css: false,
    },
    Kind {
        name: "@media + @layer",
        open: "@media print { @layer b { ",
        close: "} }",
        entered_by_page_css: true,
        entered_by_break_css: false,
    },
    Kind {
        name: "@supports",
        open: "@supports (display: block) { ",
        close: "}",
        entered_by_page_css: false,
        entered_by_break_css: false,
    },
    Kind {
        name: "@container",
        open: "@container (min-width: 1px) { ",
        close: "}",
        entered_by_page_css: false,
        entered_by_break_css: false,
    },
    Kind {
        name: "@document",
        open: "@document url(x) { ",
        close: "}",
        entered_by_page_css: false,
        entered_by_break_css: false,
    },
    Kind {
        name: "CSS nesting",
        open: "a { ",
        close: "}",
        entered_by_page_css: false,
        entered_by_break_css: false,
    },
];

fn nested_css(kind: &Kind, depth: usize) -> String {
    css_doc(&format!(
        "{}@page {{ margin: 7mm }} .deep {{ break-before: page }}{} p {{ margin: 0 }}",
        kind.open.repeat(depth),
        kind.close.repeat(depth)
    ))
}

/// Every reader of user input that runs before the nesting-depth gate (and `parse_page_box`,
/// which runs right after it, on the same text).
fn pre_gate_scans(html: &str) -> (Result<(), VelloraError>, f64, Vec<String>) {
    let css = validation::validate_css(html);
    let page = page_css::parse_page_box(html);
    let breaks = break_css::parse_break_rules(html);
    let read = breaks
        .page_before
        .into_iter()
        .map(|rule| rule.selector)
        .collect();
    (css, page.margin_left, read)
}

fn min_of_three(mut f: impl FnMut()) -> Duration {
    (0..3)
        .map(|_| {
            let started = Instant::now();
            f();
            started.elapsed()
        })
        .min()
        .expect("three runs")
}

#[test]
fn css_scanners_read_200k_nested_blocks_on_a_small_stack() {
    let mm7 = 7.0 * 96.0 / 25.4;
    for kind in KINDS {
        let html = nested_css(kind, DEPTH);
        let started = Instant::now();
        let (css, margin_left, page_before) = on_stack(SMALL_STACK, move || pre_gate_scans(&html));
        let elapsed = started.elapsed();
        assert_eq!(css, Ok(()), "{}", kind.name);
        assert_eq!(
            (margin_left - mm7).abs() < 1e-9,
            kind.entered_by_page_css,
            "{}: margin-left {margin_left}",
            kind.name
        );
        assert_eq!(
            page_before == vec![".deep".to_string()],
            kind.entered_by_break_css,
            "{}: {page_before:?}",
            kind.name
        );
        // Generous (debug build): the recursive @page walk took 1.3 s for 10 000 levels in a
        // release build, and overflowed this stack long before 200 000.
        assert!(
            elapsed < Duration::from_secs(30),
            "{}: {elapsed:?}",
            kind.name
        );
    }
}

#[test]
fn css_scanners_cost_linear_time_in_the_nesting_depth() {
    for kind in KINDS {
        let small = nested_css(kind, DEPTH / 4);
        let large = nested_css(kind, DEPTH);
        let t_small = min_of_three(|| {
            pre_gate_scans(&small).0.expect("in subset");
        });
        let t_large = min_of_three(|| {
            pre_gate_scans(&large).0.expect("in subset");
        });
        assert!(
            t_large < t_small * 9 + Duration::from_millis(50),
            "{}: {} -> {t_small:?}, {} -> {t_large:?}",
            kind.name,
            DEPTH / 4,
            DEPTH
        );
    }
}

/// Other inputs that were quadratic in a pre-gate scanner before port step 09.
fn adversarial(which: &str, n: usize) -> String {
    match which {
        // validation: an unterminated string of escaped quotes in a `style` attribute.
        "escaped quotes" => format!("<p style='content: \"{}'>x</p>", "\\\"".repeat(n)),
        // break_css: a prelude with leading white space and many `;`.
        "white space + ;" => css_doc(&format!("{}a{}", " ".repeat(n), ";".repeat(n))),
        // page_css: many cascade layers, many margin box names, text before many `@`.
        "layers" => css_doc(
            &(0..n / 8)
                .map(|i| format!("@layer l{i} {{ }}"))
                .collect::<String>(),
        ),
        "margin box names" => css_doc(&format!(
            "@page :first {{ {} }}",
            (0..n / 8)
                .map(|i| format!("@b{i} {{ content: 'x' }}"))
                .collect::<String>()
        )),
        "text before @" => css_doc(&format!("@page {{ {}x{} }}", " ".repeat(n), "@".repeat(n))),
        _ => unreachable!(),
    }
}

#[test]
fn other_adversarial_css_costs_linear_time() {
    for which in [
        "escaped quotes",
        "white space + ;",
        "layers",
        "margin box names",
        "text before @",
    ] {
        let small = adversarial(which, 50_000);
        let large = adversarial(which, 200_000);
        let t_small = min_of_three(|| {
            let _ = on_stack(SMALL_STACK, {
                let html = small.clone();
                move || pre_gate_scans(&html).1
            });
        });
        let t_large = min_of_three(|| {
            let _ = on_stack(SMALL_STACK, {
                let html = large.clone();
                move || pre_gate_scans(&html).1
            });
        });
        assert!(
            t_large < t_small * 9 + Duration::from_millis(50),
            "{which}: 50 000 -> {t_small:?}, 200 000 -> {t_large:?}"
        );
    }
}

fn nested_elements(open: &str, n: usize) -> String {
    format!(
        "<!DOCTYPE html><html><body>{}x</body></html>",
        open.repeat(n)
    )
}

const ELEMENT_NESTS: &[&str] = &[
    "<div>",
    "<span>",
    "<b><div>",
    "<section>",
    "<table><tr><td>",
];

#[test]
fn the_depth_gate_rejects_200k_nested_elements_on_a_small_stack() {
    for open in ELEMENT_NESTS {
        let html = nested_elements(open, DEPTH);
        let started = Instant::now();
        let result = on_stack(SMALL_STACK, move || {
            validation::validate_nesting_depth(&html)
        });
        let elapsed = started.elapsed();
        match result {
            Err(VelloraError::Unsupported(d)) => {
                assert_eq!(d.feature, "max-nesting-depth", "{open}");
                assert!(d.hint.contains("at least"), "{open}: {}", d.hint);
            }
            other => panic!("{open}: {other:?}"),
        }
        // html5ever's scope walk made 200 000 nested <div>s take about a minute and a half
        // (release) before port step 09.
        assert!(elapsed < Duration::from_secs(30), "{open}: {elapsed:?}");
    }
}

#[test]
fn the_depth_gate_costs_linear_time_in_the_nesting_depth() {
    for open in ELEMENT_NESTS {
        let small = nested_elements(open, DEPTH / 4);
        let large = nested_elements(open, DEPTH);
        let t_small = min_of_three(|| {
            validation::validate_nesting_depth(&small).expect_err("too deep");
        });
        let t_large = min_of_three(|| {
            validation::validate_nesting_depth(&large).expect_err("too deep");
        });
        assert!(
            t_large < t_small * 9 + Duration::from_millis(50),
            "{open}: {} -> {t_small:?}, {} -> {t_large:?}",
            DEPTH / 4,
            DEPTH
        );
    }
    // Below the parse limit the gate still parses the whole document: a document that nests
    // 511 deep and then repeats a scope-walking tag pays 511 steps per tag, linearly.
    let hover = |n: usize| {
        format!(
            "<!DOCTYPE html><body>{}{}",
            "<div>".repeat(510),
            "<p>x</p>".repeat(n)
        )
    };
    let (small, large) = (hover(5_000), hover(20_000));
    let t_small = min_of_three(|| {
        validation::validate_nesting_depth(&small).expect_err("too deep");
    });
    let t_large = min_of_three(|| {
        validation::validate_nesting_depth(&large).expect_err("too deep");
    });
    assert!(
        t_large < t_small * 9 + Duration::from_millis(50),
        "511 deep + <p>: 5 000 -> {t_small:?}, 20 000 -> {t_large:?}"
    );
}

/// The whole render path on the 8 MiB stack the napi binding runs on (libuv's thread pool):
/// every kind of 200 000-deep block renders a PDF or is rejected with a located diagnostic.
#[test]
fn the_render_path_survives_200k_nested_blocks_and_elements() {
    const NAPI_STACK: usize = 8 * 1024 * 1024;
    let mut inputs: Vec<(String, String)> = KINDS
        .iter()
        .map(|kind| (kind.name.to_string(), nested_css(kind, DEPTH)))
        .collect();
    for open in ELEMENT_NESTS {
        inputs.push((open.to_string(), nested_elements(open, DEPTH)));
    }
    for (name, html) in inputs {
        let started = Instant::now();
        let result = on_stack(NAPI_STACK, move || {
            vellora_core::render(html.as_bytes(), &RenderOptions::default())
        });
        match result {
            Ok(pdf) => assert!(pdf.starts_with(b"%PDF-"), "{name}"),
            Err(VelloraError::Unsupported(d)) => {
                assert_eq!(d.feature, "max-nesting-depth", "{name}: {d:?}")
            }
            Err(other) => panic!("{name}: {other:?}"),
        }
        assert!(
            started.elapsed() < Duration::from_secs(60),
            "{name}: {:?}",
            started.elapsed()
        );
    }
}

/// Seeded generator of short, often malformed stylesheets over an alphabet that mixes the
/// bytes the CSS scanners branch on with multibyte characters (2-, 3- and 4-byte UTF-8), so
/// a scanner that slices at a byte offset it did not get from an ASCII delimiter panics here.
/// Port step 10: `break_css` sliced one byte short of the end of an unclosed last rule, and
/// `<style>p{é</style>` panicked ("end byte index N is not a char boundary"). The 09 verifier
/// found it with a fuzzer through the addon; no generator here had a non-ASCII byte.
fn non_ascii_sheets(seed: u64, count: usize) -> Vec<String> {
    const ALPHABET: &[&str] = &[
        "{",
        "}",
        ";",
        ":",
        "\"",
        "'",
        "\\",
        "/*",
        "*/",
        "(",
        ")",
        " ",
        "\n",
        "@media print ",
        "@media all and (min-width: 1px) ",
        "@page ",
        "@page :first ",
        "@layer a ",
        "@supports (display: block) ",
        "@bottom-center ",
        "p.b ",
        "break-before: page",
        "break-inside: avoid",
        "margin: 1cm",
        "content: ",
        "counter(page)",
        "font-family: Caf\u{e9}",
        "\u{e9}",
        "\u{a0}",
        "\u{20ac}",
        "\u{4e2d}\u{6587}",
        "\u{1f600}",
        "P\u{e1}gina ",
    ];
    let mut state = seed;
    let mut next = move || {
        state = state
            .wrapping_mul(6_364_136_223_846_793_005)
            .wrapping_add(1_442_695_040_888_963_407);
        (state >> 33) as usize
    };
    (0..count)
        .map(|_| {
            let len = next() % 24;
            (0..len)
                .map(|_| ALPHABET[next() % ALPHABET.len()])
                .collect()
        })
        .collect()
}

#[test]
fn css_scanners_never_panic_on_generated_non_ascii_sheets() {
    for (i, css) in non_ascii_sheets(20_261_022, 20_000).into_iter().enumerate() {
        // In a `<style>` element of a full document, in a bare one, and in a `style`
        // attribute (validation scans those regions too).
        let docs = [
            css_doc(&css),
            format!("<style>{css}</style>"),
            format!("<p style=\"{}\">x</p>", css.replace('"', "'")),
        ];
        for html in docs {
            let outcome = std::panic::catch_unwind(|| pre_gate_scans(&html));
            assert!(outcome.is_ok(), "case {i}: {html:?}");
        }
    }
}

/// The whole render path over a sample of the same sheets: a PDF or a located diagnostic,
/// never `VelloraError::Render` (an unlocated failure; a caught panic surfaces through the
/// napi binding as "render panicked").
#[test]
fn the_render_path_renders_or_locates_every_generated_non_ascii_sheet() {
    for (i, css) in non_ascii_sheets(7, 300).into_iter().enumerate() {
        let html = css_doc(&css);
        let outcome = std::panic::catch_unwind(|| {
            vellora_core::render(html.as_bytes(), &RenderOptions::default())
        });
        match outcome {
            Ok(Ok(pdf)) => assert!(pdf.starts_with(b"%PDF-"), "case {i}: {html:?}"),
            Ok(Err(VelloraError::Unsupported(d))) => {
                assert!(d.line.is_some(), "case {i}: {d:?}")
            }
            Ok(Err(other)) => panic!("case {i}: {html:?}: {other:?}"),
            Err(_) => panic!("case {i} panicked: {html:?}"),
        }
    }
}
