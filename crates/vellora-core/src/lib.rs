//! vellora-core — the Rust rendering core.
//!
//! Drives Blitz headless (parse via html5ever -> Stylo cascade -> Taffy layout
//! -> Parley text) into a laid-out tree, runs OUR pagination layer on top, and
//! emits a PDF via krilla. All Blitz contact is funneled through
//! [`blitz_engine`] so upstream churn touches one file.
//!
//! # Established core API surface (stable contract)
//!
//! The napi binding wraps this core without re-specifying it. The stable
//! surface is:
//!
//! - **Entry point**: [`render`]`(html_bytes: &[u8], opts: &`[`RenderOptions`]`)
//!   -> Result<Vec<u8>, `[`VelloraError`]`>`.
//!   - `html_bytes` is always *content* (UTF-8), never a file path.
//!   - Output `Vec<u8>` is the complete PDF byte stream.
//! - **Options** ([`RenderOptions`], current surface): `title`, `creation_date`
//!   `(year, month, day)`, caller-supplied `images` + `base_url` (`<img>` source
//!   resolution), and `fonts` (custom faces). Producer is fixed to `"vellora"`;
//!   the creation date is caller-supplied and never wall-clock.
//! - **Send-in / Send-out & lifetime**: inputs and outputs are `Send`; the
//!   `!Send` Blitz `BaseDocument` is created, used, and dropped entirely within
//!   the single synchronous [`render`] call and never escapes it.
//!   This is what lets the napi binding call [`render`] on the libuv pool.
//! - **Located-diagnostic shape** ([`VelloraError::Unsupported`] carries a
//!   [`Diagnostic`]): serialized across the napi boundary as
//!   `{ feature: string, line: number | null, col: number | null, hint: string }`.
//!   `line`/`col` are nullable because Blitz parses with html5ever's default
//!   tokenizer (no per-node source positions); the gate recovers them from the
//!   source when possible, else leaves them `null`. The Rust `VelloraError` here
//!   is distinct from the TS `VelloraUnsupportedError` that the `vellora`
//!   package reconstructs from this diagnostic — same name by intent, not type.

pub mod blitz_engine;
pub mod css_scan;
mod fonts;
mod html_normalize;
mod layout_normalize;
pub mod page_css;
pub mod pagination;
pub mod pdf;
pub mod validation;

pub use pdf::DocMeta;
pub use validation::{Diagnostic, VelloraError};

/// Options accepted by [`render`] (current surface). Producer is fixed to
/// `vellora`; only the document title and a deterministic creation date are
/// caller-supplied. The napi binding records this `(bytes, opts)`
/// contract verbatim.
#[derive(Clone, Default)]
pub struct RenderOptions {
    /// Document title written to the PDF info dictionary.
    pub title: Option<String>,
    /// Deterministic creation date `(year, month, day)`; never wall-clock.
    pub creation_date: Option<(u16, u8, u8)>,
    /// Caller-supplied image bytes keyed by an `<img>`'s `src` string. An `<img>`
    /// whose `src` is not a `data:` URL is resolved by looking up this map (its key
    /// optionally normalized against [`base_url`](Self::base_url)); the format is
    /// detected from the bytes. Resolution performs no network/filesystem access.
    pub images: std::collections::HashMap<String, Vec<u8>>,
    /// Optional base URL used ONLY to normalize a relative `<img>` `src` into the
    /// [`images`](Self::images) lookup key (WHATWG URL join). Never fetched.
    pub base_url: Option<String>,
    /// Caller-supplied font faces (raw TTF/OTF bytes), each registered into the
    /// deterministic font context AFTER the bundled faces, in this order. A face's
    /// family/weight/style are read from the font's own tables, so a document
    /// reaches it by naming its intrinsic family in CSS. Custom faces never
    /// override the CSS generics; an unparseable blob rejects the render
    /// (`font:invalid`). Registration performs no network/filesystem/system-font
    /// access. See `fonts::build_font_context`.
    pub fonts: Vec<Vec<u8>>,
}

/// The stable render entry point. Takes `Send` inputs and returns `Send`
/// outputs; the `!Send` Blitz `BaseDocument` never escapes this call.
///
/// Pipeline: validate (strict gate) -> Blitz layout -> vellora pagination ->
/// krilla PDF emit. Returns the PDF bytes or a [`VelloraError`].
pub fn render(html_bytes: &[u8], opts: &RenderOptions) -> Result<Vec<u8>, VelloraError> {
    let html = std::str::from_utf8(html_bytes)
        .map_err(|e| VelloraError::Render(format!("input is not valid UTF-8: {e}")))?;

    // 1a) CSS subset gate: a cheap byte scan, no HTML parse.
    validation::validate_css(html)?;

    // 1a') Depth gate: reject pathologically deep nesting BEFORE the recursive
    // resolve/layout/walk, which would otherwise overflow the worker-thread stack
    // and ABORT the process. Uses an explicit-stack measure, not recursion.
    validation::validate_nesting_depth(html)?;

    // 1a'') Font gate: reject a caller `fonts` blob that is not a usable font
    // face BEFORE layout. Option-level failure (no DOM node), so the diagnostic
    // carries no line/col. `build_font_context` itself stays lenient — this is
    // the single enforcement point, mirroring the `<img>` resolution reject.
    if let Some(index) = fonts::first_unparseable_font(&opts.fonts) {
        let diagnostic = validation::font_diagnostic(index);
        return Err(VelloraError::Unsupported(diagnostic));
    }

    // 2) @page box (size/margins + running header/footer templates).
    let page_box = page_css::parse_page_box(html);

    // 1b + 3) Single parse shared by the element gate AND layout (cost
    // model): parse once, walk the parsed tree for out-of-subset elements
    // BEFORE layout, then resolve + read the layout tree from that same parse.
    let laid_out = blitz_engine::validate_then_lay_out(
        html,
        validation::denied_elements(),
        page_box.content_width(),
        page_box.content_height(),
        &opts.images,
        opts.base_url.as_deref(),
        &opts.fonts,
    )
    .map_err(|found| VelloraError::Unsupported(validation::element_diagnostic(&found, html)))?;

    // Reject a renderable <img> whose source could not be resolved to image
    // bytes (missing `images` entry, remote/unknown-scheme URL, or unsupported
    // bytes). Carried as data on the laid-out doc so the gate + geometry helpers
    // stay lenient; only this entry point enforces the reject.
    if let Some(unresolved) = &laid_out.unresolved_image {
        return Err(VelloraError::Unsupported(validation::image_diagnostic(
            unresolved, html,
        )));
    }

    // 4) vellora pagination: page breaking + thead repeat + counters.
    let paginated = pagination::paginate(&laid_out, &page_box);

    // 5) krilla: emit the paginated display list to PDF bytes.
    let meta = DocMeta {
        title: opts.title.clone(),
        creation_date: opts.creation_date,
    };
    pdf::emit(&paginated.pages, &meta).map_err(VelloraError::Render)
}

/// Returns the crate name. Retained from the initial scaffold so existing
/// smoke tests (and the napi binding) keep linking.
pub fn name() -> &'static str {
    "vellora-core"
}

#[cfg(test)]
mod tests {
    use super::name;

    #[test]
    fn name_is_stable() {
        assert_eq!(name(), "vellora-core");
    }
}
