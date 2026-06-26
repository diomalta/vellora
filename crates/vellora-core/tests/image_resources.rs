//! Image source resolution: an `<img>`'s `src` resolved to bytes from the
//! `images` option (and `baseUrl` key-normalization) or an inline `data:` URL,
//! the magic-byte format sniff, and the located rejection for an unresolvable
//! source. The decode/draw lowering itself is covered in `layout_fidelity`.

use std::collections::HashMap;

use vellora_core::blitz_engine::{self, sniff_image_format, ImageFormat, LaidOutDoc};
use vellora_core::{page_css, pagination, render, validation, RenderOptions, VelloraError};

/// The bundled invoice logo (a real PNG) used as caller-supplied image bytes.
const LOGO_PNG: &[u8] = include_bytes!("fixtures/logo.png");
/// A 1x1 transparent PNG as a base64 `data:` URL payload.
const DATA_URL_PNG: &str = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==";

fn opts(images: HashMap<String, Vec<u8>>, base_url: Option<&str>) -> RenderOptions {
    RenderOptions {
        title: Some("image resources".to_string()),
        creation_date: Some((2026, 6, 26)),
        images,
        base_url: base_url.map(str::to_string),
    }
}

fn doc_with_img(src: &str) -> String {
    format!(
        r#"<!DOCTYPE html><html><head><style>
            @page {{ size: A4; margin: 10mm; }}
            body {{ margin: 0; }}
            img {{ width: 32px; height: 32px; }}
        </style></head><body><img src="{src}" alt="logo" /></body></html>"#
    )
}

fn map(entries: &[(&str, &[u8])]) -> HashMap<String, Vec<u8>> {
    entries
        .iter()
        .map(|(k, v)| ((*k).to_string(), (*v).to_vec()))
        .collect()
}

/// Lay out with the supplied images and return the single drawn image run, if any.
fn first_image_format(
    html: &str,
    images: HashMap<String, Vec<u8>>,
    base_url: Option<&str>,
) -> Option<ImageFormat> {
    let pb = page_css::parse_page_box(html);
    let laid: LaidOutDoc = blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        pb.content_width(),
        pb.content_height(),
        &images,
        base_url,
    )
    .unwrap_or_else(|_| panic!("fixture is in the supported subset"));
    let paginated = pagination::paginate(&laid, &pb);
    paginated
        .pages
        .iter()
        .flat_map(|p| p.images.iter())
        .map(|img| img.format)
        .next()
}

#[test]
fn sniff_detects_each_supported_format_and_rejects_others() {
    assert_eq!(
        sniff_image_format(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]),
        Some(ImageFormat::Png)
    );
    assert_eq!(
        sniff_image_format(&[0xFF, 0xD8, 0xFF, 0xE0, 0x00]),
        Some(ImageFormat::Jpeg)
    );
    assert_eq!(sniff_image_format(b"GIF89a....."), Some(ImageFormat::Gif));
    assert_eq!(sniff_image_format(b"GIF87a....."), Some(ImageFormat::Gif));
    assert_eq!(
        sniff_image_format(b"RIFF\0\0\0\0WEBPVP8 "),
        Some(ImageFormat::Webp)
    );
    assert_eq!(sniff_image_format(LOGO_PNG), Some(ImageFormat::Png));
    assert_eq!(sniff_image_format(b"not an image"), None);
    assert_eq!(sniff_image_format(&[]), None);
    // RIFF container that is not WEBP must not be mistaken for one.
    assert_eq!(sniff_image_format(b"RIFF\0\0\0\0WAVEfmt "), None);
}

#[test]
fn images_map_hit_renders_the_image() {
    let html = doc_with_img("logo.png");
    let format = first_image_format(&html, map(&[("logo.png", LOGO_PNG)]), None);
    assert_eq!(
        format,
        Some(ImageFormat::Png),
        "the mapped logo should draw"
    );

    let bytes = render(html.as_bytes(), &opts(map(&[("logo.png", LOGO_PNG)]), None))
        .expect("render succeeds with the image supplied");
    assert!(bytes.starts_with(b"%PDF-"));
}

#[test]
fn format_comes_from_bytes_not_the_key_extension() {
    // The key ends in `.jpg` but the bytes are PNG: the sniffed format wins.
    let html = doc_with_img("logo.jpg");
    let format = first_image_format(&html, map(&[("logo.jpg", LOGO_PNG)]), None);
    assert_eq!(format, Some(ImageFormat::Png));
}

#[test]
fn base_url_normalizes_a_relative_src_to_the_lookup_key() {
    let html = doc_with_img("logo.png");
    let key = "https://example.test/assets/logo.png";
    let format = first_image_format(
        &html,
        map(&[(key, LOGO_PNG)]),
        Some("https://example.test/assets/"),
    );
    assert_eq!(
        format,
        Some(ImageFormat::Png),
        "relative src joins base_url"
    );
}

#[test]
fn inline_data_url_still_renders_without_images() {
    let html = doc_with_img(DATA_URL_PNG);
    let format = first_image_format(&html, HashMap::new(), None);
    assert_eq!(format, Some(ImageFormat::Png));

    let bytes = render(html.as_bytes(), &opts(HashMap::new(), None))
        .expect("data: URL needs no images map");
    assert!(bytes.starts_with(b"%PDF-"));
}

#[test]
fn missing_images_key_rejects_with_located_diagnostic() {
    let html = doc_with_img("logo.png");
    let err = render(html.as_bytes(), &opts(HashMap::new(), None))
        .expect_err("an unresolved <img> must reject");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "image:unresolved");
            assert!(d.line.is_some(), "the <img> position should be located");
        }
        other => panic!("expected image:unresolved, got {other:?}"),
    }
}

#[test]
fn remote_url_with_no_matching_key_rejects_without_fetching() {
    let html = doc_with_img("https://cdn.test/logo.png");
    let err = render(html.as_bytes(), &opts(HashMap::new(), None))
        .expect_err("a remote src with no images entry rejects");
    match err {
        VelloraError::Unsupported(d) => assert_eq!(d.feature, "image:unresolved"),
        other => panic!("expected image:unresolved, got {other:?}"),
    }
}

#[test]
fn unsupported_or_corrupt_bytes_reject() {
    let html = doc_with_img("logo.png");
    let err = render(
        html.as_bytes(),
        &opts(map(&[("logo.png", b"definitely not an image")]), None),
    )
    .expect_err("unrecognized bytes reject");
    match err {
        VelloraError::Unsupported(d) => assert_eq!(d.feature, "image:unresolved"),
        other => panic!("expected image:unresolved, got {other:?}"),
    }
}

#[test]
fn a_hidden_unresolvable_image_does_not_reject() {
    // A non-renderable (display:none → zero-size) <img> draws nothing regardless,
    // so an unresolvable src must NOT reject the document.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 10mm; }
        img { display: none; }
    </style></head><body><img src="missing.png" alt="hidden" /><p>ok</p></body></html>"#;
    let bytes = render(html.as_bytes(), &opts(HashMap::new(), None))
        .expect("a hidden image must not reject");
    assert!(bytes.starts_with(b"%PDF-"));
}

#[test]
fn two_renders_with_the_same_images_are_byte_identical() {
    let html = doc_with_img("logo.png");
    let a = render(html.as_bytes(), &opts(map(&[("logo.png", LOGO_PNG)]), None)).unwrap();
    let b = render(html.as_bytes(), &opts(map(&[("logo.png", LOGO_PNG)]), None)).unwrap();
    assert_eq!(a, b, "image resolution must be deterministic");
}

#[test]
fn unsupported_or_malformed_data_url_rejects_with_an_actionable_reason() {
    // An unsupported MIME (SVG) or corrupt base64 in a data: URL must NOT misreport
    // as a missing `images` entry — it is an inline image the caller already supplied.
    for src in [
        "data:image/svg+xml;base64,PHN2Zy8+",
        "data:image/png;base64,@@@not-base64@@@",
        "data:image/png,raw-not-base64",
    ] {
        let html = doc_with_img(src);
        match render(html.as_bytes(), &opts(HashMap::new(), None)) {
            Err(VelloraError::Unsupported(d)) => {
                assert_eq!(d.feature, "image:unresolved", "for {src}");
                assert!(
                    d.hint.contains("data:"),
                    "hint should point at the data: URL, got: {} (for {src})",
                    d.hint
                );
            }
            other => panic!("expected image:unresolved for {src}, got {other:?}"),
        }
    }
}

#[test]
fn unresolved_image_diagnostic_pinpoints_the_exact_line_and_column() {
    // The `<img` opens at line 2, column 7 (after `<body>`); lock the exact location.
    let html = "<!DOCTYPE html><html><head><style>img{width:9px;height:9px}</style></head>\n<body><img src=\"x.png\"></body></html>";
    let err = render(html.as_bytes(), &opts(HashMap::new(), None)).expect_err("unresolved rejects");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "image:unresolved");
            assert_eq!((d.line, d.col), (Some(2), Some(7)));
        }
        other => panic!("expected image:unresolved, got {other:?}"),
    }
}

#[test]
fn recognized_but_undecodable_bytes_fail_the_render_without_silent_omit() {
    // Bytes carrying a valid PNG signature but truncated past the header PASS the
    // magic-byte sniff, so they surface as a downstream decode failure
    // (`VelloraError::Render`) rather than `image:unresolved`. The image is never
    // silently omitted either way.
    let truncated_png: &[u8] = &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    let html = doc_with_img("logo.png");
    let err = render(
        html.as_bytes(),
        &opts(map(&[("logo.png", truncated_png)]), None),
    )
    .expect_err("undecodable bytes must fail the render");
    assert!(
        matches!(err, VelloraError::Render(_)),
        "expected a render error for undecodable-but-recognized bytes, got {err:?}"
    );
}

#[test]
fn empty_src_is_skipped_not_rejected() {
    // An empty/whitespace `src` has no key to resolve; treat it like a src-less
    // <img> (skip), consistent and not a misleading reject.
    let html = doc_with_img("   ");
    let bytes =
        render(html.as_bytes(), &opts(HashMap::new(), None)).expect("an empty src must not reject");
    assert!(bytes.starts_with(b"%PDF-"));
}

#[test]
fn the_first_unresolved_image_in_document_order_is_reported() {
    let html = "<!DOCTYPE html><html><head><style>img{width:9px;height:9px}</style></head>\n<body><img src=\"first.png\">\n<img src=\"second.png\"></body></html>";
    let err = render(html.as_bytes(), &opts(HashMap::new(), None)).expect_err("rejects");
    match err {
        // The first <img> is on line 2; the diagnostic must point there, not line 3.
        VelloraError::Unsupported(d) => assert_eq!(d.line, Some(2)),
        other => panic!("expected image:unresolved, got {other:?}"),
    }
}
