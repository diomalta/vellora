//! Every document is parsed as HTML (port step 08), whatever its doctype or prolog.
//!
//! Before this step blitz-html 0.3.0-beta.4's `HtmlDocument::from_html` sniffed the input and
//! parsed it with xml5ever when it started with `<?xml`, when its first line was a DOCTYPE
//! containing `XHTML`, or when the root `<html>` declared the XHTML namespace. In XML `<br>` is not
//! void, so the text after it was never drawn. vellora's input is a `text/html` string and Chrome
//! parses `text/html` with the HTML parser.
//!
//! Chrome-verified: every document below was printed by Google Chrome 155.0.8059.85 (local macOS
//! arm64, 2026-10-21, INDICATIVE) through `fidelity/lib/chrome-reference.mjs` (puppeteer-core
//! `page.setContent` = the HTML parser, `page.pdf`, print media, the bundled Liberation fonts
//! injected as `@font-face`), its words read with PyMuPDF character origins (pen x of the first
//! glyph and baseline, PDF pt, top-left origin). The HTML, Chrome's words, `document.compatMode`,
//! Chrome's element boxes and vellora's words are in
//! `fidelity/baselines/port/08-html-parse/attachments/chrome-probes-html-parse.json`. vellora's
//! words sit 0.31 pt left of and above Chrome's on both axes (Chrome snaps the 20 mm page margin
//! to whole device pixels, as in `tests/media_print.rs`), hence the tolerance of one CSS px.

use vellora_core::{blitz_engine, page_css, pagination, validation, RenderOptions};

const TOL_PT: f64 = 0.75;
const PT_PER_PX: f64 = 0.75;

const STYLE: &str = "<style>@page { size: A4; margin: 20mm; } body { margin: 0; font-family: \
                     \"Liberation Sans\"; font-size: 16px; line-height: 20px; } p { margin: 0 0 \
                     10px 0; }</style>";
const XHTML_T: &str = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \
                       \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">";
const XHTML_S: &str = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \
                       \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">";
const PROLOG: &str = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
const XMLNS: &str = "<html xmlns=\"http://www.w3.org/1999/xhtml\">";

/// The probes' document starts (`make_probes.mjs` in the step-08 evidence), with Chrome's
/// `document.compatMode` for each.
fn prologues() -> Vec<(&'static str, String, &'static str)> {
    vec![
        ("html5", "<!DOCTYPE html>\n<html>".to_string(), "CSS1Compat"),
        (
            "xhtml_transitional",
            format!("{XHTML_T}\n{XMLNS}"),
            "CSS1Compat",
        ),
        ("xhtml_strict", format!("{XHTML_S}\n{XMLNS}"), "CSS1Compat"),
        (
            "xml_prolog_strict",
            format!("{PROLOG}\n{XHTML_S}\n{XMLNS}"),
            "CSS1Compat",
        ),
        (
            "xml_prolog_only",
            format!("{PROLOG}\n{XMLNS}"),
            "BackCompat",
        ),
        ("root_xmlns", XMLNS.to_string(), "BackCompat"),
    ]
}

fn document(start: &str, body: &str) -> String {
    format!("{start}<head><meta charset=\"utf-8\"/><title>t</title>{STYLE}</head>{body}</html>")
}

const BR_BODY: &str = "<body><p>Thanks for using Product.<br>The Product team</p><p>1234 Street \
                       Rd.<br>Suite 1234<br/>Tail line</p></body>";

/// The render path's gate, layout and pagination.
fn paginate(html: &str) -> pagination::Paginated {
    validation::validate_css(html).expect("in the subset");
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

/// Every drawn run of page 1 as (source text it covers, x pt, baseline pt).
fn runs(p: &pagination::Paginated) -> Vec<(String, f64, f64)> {
    p.pages[0]
        .text_runs
        .iter()
        .map(|run| {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            (
                run.text[start..end].trim().to_string(),
                run.origin_x * PT_PER_PX,
                run.origin_y * PT_PER_PX,
            )
        })
        .collect()
}

fn assert_line(runs: &[(String, f64, f64)], text: &str, chrome: (f64, f64), what: &str) {
    let (_, x, y) = runs
        .iter()
        .find(|(t, _, _)| t == text)
        .unwrap_or_else(|| panic!("{what}: {text:?} is not drawn: {runs:?}"));
    assert!(
        (x - chrome.0).abs() <= TOL_PT && (y - chrome.1).abs() <= TOL_PT,
        "{what} {text:?}: vellora ({x:.2}, {y:.2}) pt, Chrome ({:.2}, {:.2}) pt",
        chrome.0,
        chrome.1
    );
}

#[test]
fn text_after_br_is_drawn_where_chrome_draws_it_whatever_the_doctype() {
    // Chrome prints the same five lines for all six document starts: (57.00, 68.25), (57.00,
    // 83.25), then the second paragraph 10 px lower at 105.75, 120.75, 135.75 pt (14 words).
    // Step 07 (xml5ever for all but html5) drew only "Thanks for using Product." and "1234 Street
    // Rd." for those five.
    for (name, start, _) in prologues() {
        let p = paginate(&document(&start, BR_BODY));
        let runs = runs(&p);
        assert_eq!(p.pages.len(), 1, "{name}");
        assert_line(&runs, "Thanks for using Product.", (57.00, 68.25), name);
        assert_line(&runs, "The Product team", (57.00, 83.25), name);
        assert_line(&runs, "1234 Street Rd.", (57.00, 105.75), name);
        assert_line(&runs, "Suite 1234", (57.00, 120.75), name);
        assert_line(&runs, "Tail line", (57.00, 135.75), name);
        assert_eq!(runs.len(), 5, "{name}: {runs:?}");
    }
}

#[test]
fn xhtml_doctype_document_renders_its_text_through_the_public_render() {
    // The same through `vellora_core::render` and an independent text extractor: every word of
    // Chrome's PDF is in vellora's.
    let start = format!("{XHTML_T}\n{XMLNS}");
    let pdf = vellora_core::render(
        document(&start, BR_BODY).as_bytes(),
        &RenderOptions::default(),
    )
    .expect("renders");
    let text = pdf_extract::extract_text_from_mem(&pdf).expect("extract text");
    for line in [
        "Thanks for using Product.",
        "The Product team",
        "1234 Street Rd.",
        "Suite 1234",
        "Tail line",
    ] {
        assert!(text.contains(line), "{line:?} missing from {text:?}");
    }
}

const PNG_20: &str = "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAIAAAAC64paAAAAG0lEQVR4nGM4w8BANiJf56jm\
                      Uc2jmkc1U0UzAPWMPtBewCaJAAAAAElFTkSuQmCC";

fn image_line_body() -> String {
    format!(
        "<body><div>Before</div><div><img src=\"data:image/png;base64,{PNG_20}\" width=\"20\" \
         height=\"20\"></div><div>After</div></body>"
    )
}

#[test]
fn image_only_line_matches_chrome_in_no_quirks_documents() {
    // A line holding only a 20 px image: in no-quirks mode Chrome's line box keeps the strut
    // (line-height 20 px, image on the baseline), so the div is 25 px tall and "After" sits at
    // (57.00, 102.00) pt. vellora 56.69 / 101.69.
    for (name, start, mode) in prologues() {
        if mode != "CSS1Compat" || name == "xhtml_transitional" {
            continue;
        }
        let runs = runs(&paginate(&document(&start, &image_line_body())));
        assert_line(&runs, "Before", (57.00, 68.25), name);
        assert_line(&runs, "After", (57.00, 102.00), name);
    }
}

#[test]
fn image_only_line_ignores_the_quirks_line_height_rule_known_gap() {
    // GAP (port step 08 finding, not fixed): html5ever puts the XHTML 1.0 Transitional document
    // in limited-quirks mode and the doctype-less ones in quirks mode, as Chrome does
    // (`document.compatMode` CSS1Compat / BackCompat). In both modes Chrome applies the Quirks
    // Mode Standard's line height calculation quirk: the image-only line is 20 px, not 25 px,
    // and "After" sits at 98.25 pt. Blitz 0.3.0-beta.4 styles and lays out every document in
    // no-quirks mode (blitz-dom `document.rs` `Stylist::new(.., QuirksMode::NoQuirks)`,
    // `stylo.rs` `TDocument::quirks_mode`), so vellora keeps the no-quirks 101.69 pt, 3.44 pt
    // below Chrome. This test pins today's value; it fails when Blitz honours the quirk.
    for (name, start, _) in prologues() {
        if !matches!(
            name,
            "xhtml_transitional" | "xml_prolog_only" | "root_xmlns"
        ) {
            continue;
        }
        let runs = runs(&paginate(&document(&start, &image_line_body())));
        assert_line(&runs, "Before", (57.00, 68.25), name);
        assert_line(&runs, "After", (57.00, 102.00), name); // Chrome: (57.00, 98.25)
    }
}

/// The `oss-postmark-receipt` corpus template, rendered raw (its template tags stay literal text).
const POSTMARK: &str = include_str!("../../../fixtures/oss-postmark-receipt/index.html");

/// Every glyph run of the render: (0-based page, trimmed source text, origin x and y in pt,
/// whether the origin lies inside the page box).
fn emitted(p: &pagination::Paginated) -> Vec<(usize, String, f64, f64, bool)> {
    p.pages
        .iter()
        .enumerate()
        .flat_map(|(i, page)| {
            page.text_runs.iter().map(move |run| {
                let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
                let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
                let on_page = (0.0..=page.width_px).contains(&run.origin_x)
                    && (0.0..=page.height_px).contains(&run.origin_y);
                (
                    i,
                    run.text[start..end].trim().to_string(),
                    run.origin_x * 0.75,
                    run.origin_y * 0.75,
                    on_page,
                )
            })
        })
        .collect()
}

#[test]
fn postmark_receipt_emits_the_text_after_each_br() {
    // The corpus loss of port steps 05-07 (INV-X1/X2 found 6 -> 5, "[Product Name]" 2 of 3): the
    // template's first line is an XHTML 1.0 Transitional doctype, so blitz-html parsed it as XML
    // and dropped the text after its three `<br>`. The step-07 parse is reproduced in
    // `src/lib.rs` `step07_parser_loses_the_postmark_text_after_br_and_the_html_parse_emits_it`.
    // "Emits": the text is in the PDF; two of the three lines are below the page edge (the known
    // gap below). Before port step 09 this test was named "draws" and checked existence only.
    let runs = emitted(&paginate(POSTMARK));
    for text in ["The [Product Name] team", "1234 Street Rd.", "Suite 1234"] {
        assert!(
            runs.iter().any(|(_, t, ..)| t == text),
            "{text:?} not emitted: {runs:?}"
        );
    }
    // Visible: the first line after a <br>, and all three "[Product Name]" occurrences.
    assert!(
        runs.iter()
            .any(|(_, t, .., on_page)| t == "The [Product Name] team" && *on_page),
        "{runs:?}"
    );
    let product_name: Vec<bool> = runs
        .iter()
        .filter(|(_, t, ..)| t.contains("[Product Name]"))
        .map(|(.., on_page)| *on_page)
        .collect();
    assert_eq!(product_name, [true, true, true], "{runs:?}");
}

#[test]
fn postmark_receipt_draws_its_layout_table_tail_off_page_known_gap() {
    // KNOWN GAP (port step 08 finding, pinned at step 09): the template's body is one layout
    // table taller than a page. vellora places it whole on page 1 (an `oversize-block`), so its
    // tail is emitted below the 841.92 pt page edge: in the PDF, never visible. Chrome 155
    // breaks the table: 2 pages, "1234 Street Rd." and "Suite 1234" on page 2 at baselines
    // 225.75 and 241.50 pt (probe g_postmark_raw, fidelity/baselines/port/09-review-fixes).
    // A fix that fragments the table must update this test.
    let p = paginate(POSTMARK);
    assert_eq!(p.pages.len(), 1, "Chrome prints 2 pages");
    let runs = emitted(&p);
    for (text, at_pt) in [("1234 Street Rd.", 1038.60), ("Suite 1234", 1054.35)] {
        let (page, _, _, y, on_page) = runs
            .iter()
            .find(|(_, t, ..)| t == text)
            .unwrap_or_else(|| panic!("{text:?} emitted"));
        assert_eq!(*page, 0, "{text}");
        assert!(!on_page, "{text} is below the page edge");
        assert!((y - at_pt).abs() <= 0.75, "{text} baseline {y:.2} pt");
    }
}

#[test]
fn the_fidelity_xhtml_render_keeps_the_xml_parse() {
    // `debug_render_xhtml` (WPT `.xht` nodes only, `fidelity/wpt/lib/xhtml-bridge.mjs`) parses
    // with xml5ever, as Chrome parses a file served as application/xhtml+xml: a CDATA section
    // is plain text there, and `<br>` is not void, so "tail" is the br's content and not drawn.
    let html = format!(
        "{XHTML_T}\n{XMLNS}<head><style><![CDATA[ p {{ margin: 0 }} ]]></style></head>\
         <body><p>head<br>tail</br></p></body></html>"
    );
    let opts = RenderOptions::default();
    let xml = vellora_core::debug_render_xhtml(html.as_bytes(), &opts).expect("renders");
    let html_pdf = vellora_core::render(html.as_bytes(), &opts).expect("renders");
    let xml_text = pdf_extract::extract_text_from_mem(&xml).expect("extract");
    let html_text = pdf_extract::extract_text_from_mem(&html_pdf).expect("extract");
    assert!(
        xml_text.contains("head") && !xml_text.contains("tail"),
        "{xml_text:?}"
    );
    assert!(
        html_text.contains("head") && html_text.contains("tail"),
        "{html_text:?}"
    );
}

#[test]
fn html5ever_is_the_one_blitz_html_resolves() {
    // `blitz_engine` drives html5ever with blitz-html's sink. The call only compiles while both
    // crates link the same html5ever; this test names the version so a bump reads clearly.
    let manifest = env!("CARGO_MANIFEST_DIR");
    let lock = std::fs::read_to_string(format!("{manifest}/../../Cargo.lock")).expect("Cargo.lock");
    let versions: Vec<&str> = lock
        .split("[[package]]")
        .filter(|p| p.lines().any(|l| l.trim() == "name = \"html5ever\""))
        .filter_map(|p| p.lines().find_map(|l| l.trim().strip_prefix("version = ")))
        .collect();
    assert_eq!(versions, ["\"0.40.1\""], "html5ever packages in Cargo.lock");
    let toml = std::fs::read_to_string(format!("{manifest}/Cargo.toml")).expect("Cargo.toml");
    assert!(
        toml.contains("html5ever = \"=0.40.1\""),
        "vellora-core pins html5ever =0.40.1"
    );
    let blitz_html = lock
        .split("[[package]]")
        .find(|p| p.lines().any(|l| l.trim() == "name = \"blitz-html\""))
        .expect("blitz-html in Cargo.lock");
    // A bare name in a lock dependency list means the only version of that package.
    assert!(
        blitz_html.contains("\"html5ever\","),
        "blitz-html -> html5ever: {blitz_html}"
    );
}
