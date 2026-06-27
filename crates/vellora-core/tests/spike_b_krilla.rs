//! SPIKE B — prove krilla emits a one-page PDF with POSITIONED Parley glyph
//! runs, a SUBSET font, selectable text (ToUnicode), and a `%PDF-` header.
//!
//! Feasibility gate: if these hold, D4 (krilla page-by-page) and D5
//! (selectable real glyph runs, never rasterized) are de-risked.

use vellora_core::blitz_engine;
use vellora_core::pdf::{self, DocMeta, PdfPage};

/// Lay out a tiny HTML snippet through Blitz and collect its text runs onto a
/// single PDF page, so SPIKE B exercises the REAL Blitz->krilla glyph path.
fn one_page_from(html: &str) -> Vec<u8> {
    let doc = blitz_engine::lay_out(html);
    let text_runs: Vec<_> = doc
        .boxes
        .iter()
        .flat_map(|b| b.text_runs.iter().cloned())
        .collect();
    assert!(!text_runs.is_empty(), "spike needs at least one text run");

    let page = PdfPage {
        width_px: blitz_engine::A4_WIDTH_PX,
        height_px: blitz_engine::A4_HEIGHT_PX,
        rects: Vec::new(),
        rounded_strokes: Vec::new(),
        images: Vec::new(),
        text_runs,
        margin_texts: Vec::new(),
    };
    let meta = DocMeta {
        title: Some("Spike B".to_string()),
        creation_date: Some((2026, 6, 23)),
        pdfa: None,
    };
    pdf::emit(&[page], &meta).expect("krilla emit succeeds")
}

#[test]
fn emits_valid_pdf_with_header() {
    let bytes = one_page_from(
        r#"<!DOCTYPE html><html><body style="margin:0">
            <p style="font-size:24px">Spike Bravo glyph run 123</p>
        </body></html>"#,
    );

    assert!(bytes.len() > 400, "non-trivial PDF: {} bytes", bytes.len());
    assert!(
        bytes.starts_with(b"%PDF-"),
        "PDF must start with %PDF- header"
    );
    let tail = &bytes[bytes.len().saturating_sub(64)..];
    assert!(
        tail.windows(5).any(|w| w == b"%%EOF"),
        "PDF must end with %%EOF trailer"
    );
}

#[test]
fn has_exactly_one_page() {
    let bytes = one_page_from(
        r#"<!DOCTYPE html><html><body style="margin:0">
            <p style="font-size:18px">One page only</p>
        </body></html>"#,
    );
    let doc = lopdf::Document::load_mem(&bytes).expect("lopdf parses output");
    assert_eq!(doc.get_pages().len(), 1, "exactly one PDF page");
}

#[test]
fn text_is_selectable_via_tounicode() {
    let bytes = one_page_from(
        r#"<!DOCTYPE html><html><body style="margin:0">
            <p style="font-size:20px">Searchable Lorem Ipsum</p>
        </body></html>"#,
    );

    let text = pdf_extract::extract_text_from_mem(&bytes).expect("text extraction works");
    // If text is rasterized, extraction returns nothing useful. ToUnicode
    // makes these words recoverable.
    assert!(
        text.contains("Searchable") || text.contains("Lorem") || text.contains("Ipsum"),
        "extracted text should contain the source words, got: {text:?}"
    );
}

#[test]
fn font_is_embedded_and_subset() {
    let bytes = one_page_from(
        r#"<!DOCTYPE html><html><body style="margin:0">
            <p style="font-size:16px">abc</p>
        </body></html>"#,
    );
    let doc = lopdf::Document::load_mem(&bytes).expect("lopdf parses output");

    // A subset embedded font has a FontFile/FontFile2/FontFile3 stream in a
    // FontDescriptor, and krilla tags subsets with a 6-letter prefix + '+'.
    let mut found_embedded_font = false;
    let mut found_subset_prefix = false;
    for (_, obj) in doc.objects.iter() {
        if let Ok(dict) = obj.as_dict() {
            if dict.has(b"FontFile") || dict.has(b"FontFile2") || dict.has(b"FontFile3") {
                found_embedded_font = true;
            }
            if let Ok(base) = dict.get(b"BaseFont").and_then(|o| o.as_name()) {
                // Subset font names look like "ABCDEF+FamilyName".
                if base.len() > 7 && base.get(6) == Some(&b'+') {
                    found_subset_prefix = true;
                }
            }
        }
    }
    assert!(
        found_embedded_font,
        "an embedded font stream must be present"
    );
    assert!(
        found_subset_prefix,
        "embedded font must be a subset (ABCDEF+ name prefix)"
    );
}
