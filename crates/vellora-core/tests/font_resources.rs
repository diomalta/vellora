//! Custom font registration: a caller-supplied `fonts` face registers into the
//! deterministic context and is reachable by its intrinsic embedded family name,
//! custom faces never repoint the CSS generics, an unreferenced face leaves
//! output byte-identical, and an unparseable blob rejects with `font:invalid`.
//!
//! The "custom" face is DejaVu Sans Mono — a DejaVu family the bundled context
//! does NOT register (only DejaVu Sans is), covered by the already-vendored
//! `fonts/LICENSE-DejaVu.txt`, so it adds no new license obligation.

use vellora_core::{render, RenderOptions, VelloraError};

/// DejaVu Sans Mono (family "DejaVu Sans Mono", NOT in the bundled set). Shared
/// test asset under the repo-root `fixtures/` (also used by the TS test-harness).
const DEJAVU_MONO: &[u8] = include_bytes!(concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../fixtures/fonts/DejaVuSansMono.ttf"
));

fn opts(fonts: Vec<Vec<u8>>) -> RenderOptions {
    RenderOptions {
        title: Some("font resources".to_string()),
        creation_date: Some((2026, 6, 26)),
        fonts,
        ..Default::default()
    }
}

/// A document whose body text is shaped with a CSS `font-family`.
fn doc(font_family: &str) -> String {
    format!(
        r#"<!DOCTYPE html><html><head><style>
            @page {{ size: A4; margin: 10mm; }}
            body {{ margin: 0; }}
            p {{ font-family: {font_family}; font-size: 16px; }}
        </style></head><body><p>Sphinx of black quartz, judge my vow 0123456789</p></body></html>"#
    )
}

fn render_ok(html: &str, fonts: Vec<Vec<u8>>) -> Vec<u8> {
    render(html.as_bytes(), &opts(fonts)).expect("render succeeds")
}

#[test]
fn custom_face_becomes_addressable_and_changes_output() {
    // The same document, naming a family the bundled set does NOT provide.
    let html = doc(r#""DejaVu Sans Mono""#);
    // Without the face: the family falls back to a bundled face.
    let fallback = render_ok(&html, vec![]);
    // With the face supplied: the text shapes with DejaVu Sans Mono.
    let custom = render_ok(&html, vec![DEJAVU_MONO.to_vec()]);
    assert_ne!(
        fallback, custom,
        "supplying the named custom face must change the rendered bytes"
    );
}

#[test]
fn two_renders_with_fonts_are_byte_identical() {
    let html = doc(r#""DejaVu Sans Mono""#);
    let a = render_ok(&html, vec![DEJAVU_MONO.to_vec()]);
    let b = render_ok(&html, vec![DEJAVU_MONO.to_vec()]);
    assert_eq!(
        a, b,
        "identical html/opts (incl. fonts) must be byte-identical"
    );
}

#[test]
fn unreferenced_custom_font_does_not_change_output() {
    // A document that names NO custom family: the supplied face is inert.
    let html = doc("sans-serif");
    let without = render_ok(&html, vec![]);
    let with = render_ok(&html, vec![DEJAVU_MONO.to_vec()]);
    assert_eq!(
        without, with,
        "an unreferenced custom face must leave output byte-identical (additive feature)"
    );
}

#[test]
fn generic_family_stays_bundled() {
    // `sans-serif` must keep resolving to the bundled sans even when a custom mono
    // face is present (custom faces never repoint a generic).
    let html = doc("sans-serif");
    let bundled = render_ok(&html, vec![]);
    let with_custom = render_ok(&html, vec![DEJAVU_MONO.to_vec()]);
    assert_eq!(
        bundled, with_custom,
        "custom faces must not repoint generics"
    );
}

#[test]
fn unparseable_font_rejects_with_located_diagnostic() {
    let html = doc("sans-serif");
    let err = render(html.as_bytes(), &opts(vec![vec![0x00, 0x01, 0x02, 0x03]]))
        .expect_err("a non-font blob must reject");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "font:invalid");
            // Option-level failure: no DOM node, so no source location.
            assert_eq!(d.line, None);
            assert_eq!(d.col, None);
            assert!(
                d.hint.contains("fonts[0]"),
                "hint names the offending index: {}",
                d.hint
            );
        }
        other => panic!("expected Unsupported(font:invalid), got {other:?}"),
    }
}

#[test]
fn first_invalid_font_among_valid_is_reported_by_index() {
    let html = doc("sans-serif");
    // A valid face followed by garbage: the reject names index 1.
    let err = render(
        html.as_bytes(),
        &opts(vec![DEJAVU_MONO.to_vec(), vec![0xde, 0xad, 0xbe, 0xef]]),
    )
    .expect_err("the second, unparseable face must reject");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "font:invalid");
            assert!(
                d.hint.contains("fonts[1]"),
                "hint names index 1: {}",
                d.hint
            );
        }
        other => panic!("expected Unsupported(font:invalid), got {other:?}"),
    }
}
