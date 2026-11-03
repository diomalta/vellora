//! `font-style: italic` / `oblique`, `<em>` and `<i>` select the bundled slanted faces (issue #74).
//!
//! Chrome's print path draws these with a real italic face (its PDF lists Helvetica-Oblique and
//! Times-Italic next to the upright faces). vellora bundles every Liberation family complete
//! (regular, bold, italic, bold italic; `src/fonts.rs`), so the embedded PDF fonts must name the
//! italic faces, and `<b><i>` must keep its weight (bold italic, not the regular-weight italic).

use std::collections::BTreeSet;
use vellora_core::{render, RenderOptions};

fn opts() -> RenderOptions {
    RenderOptions {
        title: Some("font-style".to_string()),
        creation_date: Some((2026, 11, 3)),
        ..Default::default()
    }
}

fn doc(body: &str) -> String {
    format!(
        r#"<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            @page {{ size: A4; margin: 10mm; }}
            body {{ margin: 0; font-family: sans-serif; font-size: 14pt; }}
        </style></head><body>{body}</body></html>"#
    )
}

/// PostScript names of the fonts embedded in `pdf`, without the `ABCDEF+` subset tag.
fn embedded_fonts(pdf: &[u8]) -> BTreeSet<String> {
    let doc = lopdf::Document::load_mem(pdf).expect("valid PDF");
    doc.objects
        .values()
        .filter_map(|obj| obj.as_dict().ok())
        .filter(|d| d.has(b"FontFile") || d.has(b"FontFile2") || d.has(b"FontFile3"))
        .filter_map(|d| d.get(b"FontName").and_then(|o| o.as_name()).ok())
        .map(|name| {
            let name = String::from_utf8_lossy(name).into_owned();
            match name.split_once('+') {
                Some((tag, rest)) if tag.len() == 6 => rest.to_string(),
                _ => name,
            }
        })
        .collect()
}

fn fonts_of(body: &str) -> BTreeSet<String> {
    embedded_fonts(&render(doc(body).as_bytes(), &opts()).expect("render succeeds"))
}

fn set(names: &[&str]) -> BTreeSet<String> {
    names.iter().map(|n| n.to_string()).collect()
}

/// The issue's reproduction: every slanted line embeds an italic face next to the upright one.
#[test]
fn issue_74_repro_embeds_the_italic_faces() {
    let fonts = fonts_of(
        r#"<p>normal sans-serif</p>
        <p style="font-style: italic">font-style: italic (sans-serif)</p>
        <p style="font-style: oblique">font-style: oblique (sans-serif)</p>
        <p><em>&lt;em&gt; element</em> and <i>&lt;i&gt; element</i></p>
        <p style="font-family: serif; font-style: italic">font-style: italic (serif)</p>"#,
    );
    assert_eq!(
        fonts,
        set(&[
            "LiberationSans",
            "LiberationSans-Italic",
            "LiberationSerif-Italic"
        ]),
        "embedded fonts"
    );
}

#[test]
fn italic_selects_the_italic_face_of_each_generic() {
    for (family, upright, italic) in [
        ("sans-serif", "LiberationSans", "LiberationSans-Italic"),
        ("serif", "LiberationSerif", "LiberationSerif-Italic"),
        ("monospace", "LiberationMono", "LiberationMono-Italic"),
    ] {
        let style = format!("font-family: {family}");
        assert_eq!(
            fonts_of(&format!(r#"<p style="{style}">upright</p>"#)),
            set(&[upright]),
            "{family} upright"
        );
        for slant in [
            "italic",
            "oblique",
            "oblique 14deg",
            "oblique 30deg",
            "oblique 90deg",
        ] {
            assert_eq!(
                fonts_of(&format!(
                    r#"<p style="{style}; font-style: {slant}">slanted</p>"#
                )),
                set(&[italic]),
                "{family} font-style: {slant}"
            );
        }
    }
}

/// Chrome 153 (headless `page.pdf`, the bundled faces as `@font-face`, 2026-11-03) draws an
/// oblique angle below 14deg, zero or negative with the upright face, unsheared; vellora does the
/// same (`blitz_engine::match_oblique_like_chrome`).
#[test]
fn small_and_negative_oblique_angles_stay_upright_as_in_chrome() {
    for slant in [
        "oblique 0deg",
        "oblique 10deg",
        "oblique 13.9deg",
        "oblique -14deg",
        "oblique -30deg",
    ] {
        assert_eq!(
            fonts_of(&format!(r#"<p style="font-style: {slant}">slanted</p>"#)),
            set(&["LiberationSans"]),
            "font-style: {slant}"
        );
    }
}

/// The oblique match applies to generated content and inherited styles too.
#[test]
fn oblique_reaches_pseudo_elements_and_descendants() {
    assert_eq!(
        fonts_of(
            r#"<style>.o { font-style: oblique } .o::before { content: "antes " }</style>
            <div class="o"><p><span>herdado</span></p></div>"#
        ),
        set(&["LiberationSans-Italic"]),
    );
}

/// CSS font matching weighs `font-style` before `font-weight` (CSS Fonts 4 §5.2): without a bold
/// italic face, `<b><i>` would fall to the regular-weight italic and lose its bold.
#[test]
fn bold_italic_keeps_the_weight() {
    for (family, face) in [
        ("sans-serif", "LiberationSans-BoldItalic"),
        ("serif", "LiberationSerif-BoldItalic"),
        ("monospace", "LiberationMono-BoldItalic"),
    ] {
        assert_eq!(
            fonts_of(&format!(
                r#"<p style="font-family: {family}"><b><i>bold italic</i></b></p>"#
            )),
            set(&[face]),
            "{family} bold italic"
        );
    }
}

/// `font-style: normal` inside an italic ancestor returns to the upright face.
#[test]
fn normal_inside_italic_is_upright() {
    assert_eq!(
        fonts_of(r#"<p><em>slanted <span style="font-style: normal">upright</span></em></p>"#),
        set(&["LiberationSans", "LiberationSans-Italic"]),
    );
}

#[test]
fn italic_render_is_byte_stable() {
    let html = doc("<p><em>itálico</em> e <b><i>negrito itálico</i></b></p>");
    let a = render(html.as_bytes(), &opts()).unwrap();
    let b = render(html.as_bytes(), &opts()).unwrap();
    assert_eq!(a, b, "same input must give byte-identical PDFs");
}
