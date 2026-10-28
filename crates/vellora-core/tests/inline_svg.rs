//! Inline `<svg>` (Phase C step 06): laid out by Blitz as a replaced box, painted by vellora as
//! PDF vector content (`src/svg.rs`, krilla-svg) into its content box; any SVG image source that
//! is not a `data:` URL is rejected before Blitz parses the SVG (`image:unresolved`).

use vellora_core::{render, PdfAProfile, RenderOptions, VelloraError};

fn opts() -> RenderOptions {
    RenderOptions {
        title: Some("inline svg".to_string()),
        creation_date: Some((2026, 10, 28)),
        ..Default::default()
    }
}

fn page(body: &str) -> String {
    format!(
        r#"<!DOCTYPE html><html><head><style>@page {{ size: 800px 600px; margin: 0; }}
        body {{ margin: 0; font-family: sans-serif; }}</style></head><body>{body}</body></html>"#
    )
}

fn text_of(pdf: &[u8]) -> String {
    pdf_extract::extract_text_from_mem(pdf).expect("extract text")
}

/// The SVG's `<text>` is embedded as extractable text (krilla-svg `embed_text`), drawn with the
/// bundled fonts the SVG font database holds; the shapes add vector content. krilla-svg places
/// each glyph on its own (usvg lays the glyphs out), so `pdf-extract` 0.12 reads "S V G W O R D";
/// poppler's `pdftotext` and PyMuPDF read "SVGWORD" (Phase C step 06, 2026-10-28).
#[test]
fn inline_svg_text_and_shapes_are_painted() {
    let svg = r##"<svg width="200" height="60"><rect width="200" height="60" fill="#0a0"/>
        <text x="10" y="40" font-size="20">SVGWORD</text></svg>"##;
    let with = render(page(svg).as_bytes(), &opts()).expect("renders");
    let letters: String = text_of(&with).split_whitespace().collect();
    assert!(letters.contains("SVGWORD"), "svg text is extractable");
    let without = render(page("").as_bytes(), &opts()).expect("renders");
    assert!(with.len() > without.len() + 200, "the svg adds content");
    // The body has no HTML text, so every font comes from the SVG `<text>`: the bundled
    // Liberation Sans (the inherited `sans-serif`), never a host font.
    let doc = lopdf::Document::load_mem(&with).expect("parses");
    let fonts: Vec<String> = doc
        .objects
        .values()
        .filter_map(|o| o.as_dict().ok())
        .filter_map(|d| d.get(b"BaseFont").ok())
        .filter_map(|n| n.as_name().ok())
        .map(|n| String::from_utf8_lossy(n).into_owned())
        .collect();
    assert!(
        !fonts.is_empty() && fonts.iter().all(|f| f.contains("Liberation")),
        "fonts: {fonts:?}"
    );
}

/// DET-1: the same inline SVG renders to the same bytes.
#[test]
fn inline_svg_render_is_deterministic() {
    let html = page(
        r##"<svg viewBox="0 0 10 10" width="100"><defs><linearGradient id="g">
        <stop offset="0" stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient>
        </defs><circle cx="5" cy="5" r="4" fill="url(#g)" stroke="currentColor"/>
        <text x="1" y="9" font-size="3">det</text></svg>"##,
    );
    let a = render(html.as_bytes(), &opts()).expect("renders");
    let b = render(html.as_bytes(), &opts()).expect("renders");
    assert_eq!(a, b);
}

/// An inline SVG renders under PDF/A-2b too (krilla validates the emitted content).
#[test]
fn inline_svg_renders_as_pdfa_2b() {
    let html = page(
        r##"<svg width="50" height="50"><rect width="50" height="50" fill="#00f" opacity="0.5"/>
        <text x="5" y="30">A</text></svg>"##,
    );
    let pdf = render(
        html.as_bytes(),
        &RenderOptions {
            pdfa: Some(PdfAProfile::A2B),
            ..opts()
        },
    )
    .expect("renders as PDF/A-2b");
    assert!(pdf.starts_with(b"%PDF-"));
}

fn rejection(body: &str) -> vellora_core::validation::Diagnostic {
    match render(page(body).as_bytes(), &opts()) {
        Err(VelloraError::Unsupported(d)) => d,
        other => panic!("expected a rejection, got {other:?}"),
    }
}

/// SEC: an SVG image source that is not a data: URL is rejected (never read from the host), with
/// the `<img>` feature and a located diagnostic: an absolute path, a relative path, an
/// `xlink:href`, a fragment, a URL, and `<feImage>`.
#[test]
fn non_data_svg_image_sources_reject_before_any_read() {
    for (body, line_tag) in [
        (
            r#"<svg width="10" height="10"><image href="/etc/hosts" width="10" height="10"/></svg>"#,
            "image",
        ),
        (
            r#"<svg width="10" height="10"><image xlink:href="logo.png" width="10" height="10"/></svg>"#,
            "image",
        ),
        (r##"<svg><image href="#x"/></svg>"##, "image"),
        (
            r#"<svg><image href="https://example.invalid/a.png"/></svg>"#,
            "image",
        ),
        (
            r#"<svg><filter id="f"><feImage href="a.png"/></filter></svg>"#,
            "feImage",
        ),
    ] {
        let d = rejection(body);
        assert_eq!(d.feature, "image:unresolved", "{body}");
        assert_eq!(d.line, Some(2), "{body}");
        assert!(d.hint.contains(line_tag), "{body}: {}", d.hint);
        assert!(d.hint.contains("data: URL"), "{}", d.hint);
    }
}

/// A data: URL image source (even an undecodable one, which usvg skips without a path lookup),
/// an empty `href` and a missing one all render.
#[test]
fn data_empty_and_missing_svg_image_sources_render() {
    const PNG: &str = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";
    for body in [
        format!(
            r#"<svg width="10" height="10"><image href="{PNG}" width="10" height="10"/></svg>"#
        ),
        r#"<svg><image href="data:image/png;base64,%%%"/></svg>"#.to_string(),
        r#"<svg><image href=""/></svg>"#.to_string(),
        r#"<svg><image/></svg>"#.to_string(),
    ] {
        render(page(&body).as_bytes(), &opts()).unwrap_or_else(|e| panic!("{body}: {e:?}"));
    }
}

/// An HTML `<image>` outside SVG is parsed as `<img>` (HTML parsing rules), so the SVG gate does
/// not apply to it; the `<img>` resolution does.
#[test]
fn an_html_image_element_is_an_img() {
    let d = rejection(r#"<image src="a.png" style="width:10px;height:10px">"#);
    assert_eq!(d.feature, "image:unresolved");
    assert!(d.hint.starts_with("<img>"), "{}", d.hint);
}
