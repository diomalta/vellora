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
//! - **Options** ([`RenderOptions`], current surface): `title: Option<String>` and
//!   `creation_date: Option<(year, month, day)>`. Producer is fixed to
//!   `"vellora"`; the creation date is caller-supplied and never wall-clock.
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
    )
    .map_err(|found| VelloraError::Unsupported(validation::element_diagnostic(&found, html)))?;

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
