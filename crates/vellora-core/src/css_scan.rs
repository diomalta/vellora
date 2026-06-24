//! Extract the document's CSS regions from raw HTML so the subset gate and the
//! `@page` reader scan ONLY actual CSS — `<style>…</style>` element text and
//! `style="…"` attribute values — never body text or arbitrary attributes.
//!
//! Scanning raw HTML wholesale produces false rejections (prose like
//! `<p>Status: transition: done</p>` looks like a denied declaration) and a
//! mis-parsed `@page` (a literal `@page { … }` in body text hijacks the page
//! box). Restricting to these regions fixes both classes (F1/RUST-5/F5/R6).
//!
//! Each region is returned as `(byte_offset_in_html, text)` so a caller can map
//! a match back to a 1-based source line/column in the ORIGINAL document.

/// A CSS region: the byte offset where `text` starts in the original HTML, and
/// the (un-lowercased) CSS text itself.
#[derive(Debug, Clone)]
pub struct CssRegion {
    pub offset: usize,
    pub text: String,
}

/// Collect every CSS region: the contents of each `<style>…</style>` element
/// plus every `style="…"`/`style='…'` attribute value, in source order.
pub fn css_regions(html: &str) -> Vec<CssRegion> {
    let mut regions = style_blocks(html);
    regions.extend(style_attrs(html));
    regions.sort_by_key(|r| r.offset);
    regions
}

/// Just the `<style>…</style>` element bodies, in source order. The `@page`
/// reader scans only these (a page rule lives in a stylesheet, never inline).
pub fn style_blocks(html: &str) -> Vec<CssRegion> {
    let lower = html.to_ascii_lowercase();
    let bytes = lower.as_bytes();
    let mut out = Vec::new();
    let mut search = 0usize;
    while let Some(rel) = lower[search..].find("<style") {
        let tag_start = search + rel;
        // Ensure a real tag boundary after `<style` (space, >, or /).
        let after = bytes.get(tag_start + 6).copied();
        if !matches!(
            after,
            Some(b' ') | Some(b'>') | Some(b'/') | Some(b'\t') | Some(b'\n') | Some(b'\r')
        ) {
            search = tag_start + 6;
            continue;
        }
        // Find the end of the opening tag.
        let open_end = match lower[tag_start..].find('>') {
            Some(p) => tag_start + p + 1,
            None => break,
        };
        // Content runs until the matching </style>.
        let content_start = open_end;
        let close = match lower[content_start..].find("</style") {
            Some(p) => content_start + p,
            None => break,
        };
        out.push(CssRegion {
            offset: content_start,
            text: html[content_start..close].to_string(),
        });
        // Advance past </style ...>.
        search = match lower[close..].find('>') {
            Some(p) => close + p + 1,
            None => close + 7,
        };
    }
    out
}

/// Every `style="…"` / `style='…'` attribute value, in source order.
fn style_attrs(html: &str) -> Vec<CssRegion> {
    let lower = html.to_ascii_lowercase();
    let bytes = lower.as_bytes();
    let mut out = Vec::new();
    let mut search = 0usize;
    while let Some(rel) = lower[search..].find("style") {
        let name_start = search + rel;
        // Require an attribute boundary before `style` (whitespace or quote/
        // tag-open punctuation), so `style` inside another word/value is skipped.
        let before = if name_start == 0 {
            None
        } else {
            Some(bytes[name_start - 1])
        };
        let boundary = matches!(
            before,
            None | Some(b' ') | Some(b'\t') | Some(b'\n') | Some(b'\r') | Some(b'"') | Some(b'\'')
        );
        // After `style` we want optional space then `=` then a quote.
        let mut k = name_start + 5;
        while k < bytes.len() && matches!(bytes[k], b' ' | b'\t' | b'\n' | b'\r') {
            k += 1;
        }
        if boundary && bytes.get(k).copied() == Some(b'=') {
            k += 1;
            while k < bytes.len() && matches!(bytes[k], b' ' | b'\t' | b'\n' | b'\r') {
                k += 1;
            }
            if let Some(quote @ (b'"' | b'\'')) = bytes.get(k).copied() {
                let value_start = k + 1;
                if let Some(end_rel) = lower[value_start..].find(quote as char) {
                    let value_end = value_start + end_rel;
                    out.push(CssRegion {
                        offset: value_start,
                        text: html[value_start..value_end].to_string(),
                    });
                    search = value_end + 1;
                    continue;
                }
            }
        }
        search = name_start + 5;
    }
    out
}
