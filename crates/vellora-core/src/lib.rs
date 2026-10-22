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
pub mod break_css;
pub mod css_scan;
mod fonts;
#[doc(hidden)]
pub mod layout_dump;
mod layout_normalize;
pub mod page_css;
pub mod pagination;
pub mod pdf;
#[cfg(test)]
mod raw_blitz_tests;
pub mod validation;

pub use pdf::{DocMeta, PdfAProfile};
pub use validation::{Diagnostic, VelloraError};

/// Options accepted by [`render`] (current surface). Producer is fixed to
/// `vellora`; only the document title and a deterministic creation date are
/// caller-supplied. The napi binding records this `(bytes, opts)`
/// contract verbatim.
#[derive(Clone, Default)]
pub struct RenderOptions {
    /// Document title written to the PDF info dictionary.
    pub title: Option<String>,
    /// Optional archival output profile.
    pub pdfa: Option<PdfAProfile>,
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
    render_as(html_bytes, opts, blitz_engine::DocumentSyntax::Html)
}

/// Fidelity tooling ONLY (`fidelity/wpt/`, through `examples/xhtml_render.rs`), never the
/// render path: [`render`] with the document parsed by blitz-html's XML parser (xml5ever)
/// instead of the HTML parser. WPT serves `.xht`/`.xhtml` files as `application/xhtml+xml`, so
/// Chrome, the reference engine, parses them as XML; the WPT harness renders those files here so
/// both engines see the same DOM. vellora's own input is HTML (`renderPdf(html)`), and
/// [`render`] parses every document as HTML whatever its doctype (port step 08). Not a stable
/// API.
#[doc(hidden)]
pub fn debug_render_xhtml(
    html_bytes: &[u8],
    opts: &RenderOptions,
) -> Result<Vec<u8>, VelloraError> {
    render_as(html_bytes, opts, blitz_engine::DocumentSyntax::Xml)
}

/// Fidelity tooling ONLY (`fidelity/wpt/run.mjs --raw`, through `examples/xhtml_render.rs`),
/// never the render path: a PDF of Blitz's own layout WITHOUT vellora's layout corrections, the
/// render-level analogue of the layout-diff `B0` layer. It is [`render`]'s pipeline with:
///
/// - the box walk's reader compensations off (the inline padding-right advance Blitz's painter
///   does not make) and none of the `layout_normalize` passes;
/// - no display-list rect merge (`merge_adjacent_rects` joins same-colour rects up to 4 px
///   apart);
/// - [`pagination::paginate_flat`] instead of [`pagination::paginate`]: Blitz has no paginator,
///   so the flow is cut into page-tall bands with no break decisions, no `<thead>` repeat and no
///   margin boxes (page 1 is the flow verbatim, what a viewport screenshot shows).
///
/// Kept, because they are Blitz's input or the reading of its layout rather than corrections of
/// it: the same validation gates (a rejected document is rejected here too), the `@page` box
/// (page size and margins; Blitz's viewport is its content box), print media, the parser
/// (`xml` selects the XML parse of [`debug_render_xhtml`]), fonts, images, the box walk's
/// placement of boxes and runs (Blitz's painter's: containing-block origins, `block_offset`) and
/// the PDF emit. Not a stable API.
#[doc(hidden)]
pub fn debug_render_raw_blitz(
    html_bytes: &[u8],
    opts: &RenderOptions,
    xml: bool,
) -> Result<Vec<u8>, VelloraError> {
    let syntax = if xml {
        blitz_engine::DocumentSyntax::Xml
    } else {
        blitz_engine::DocumentSyntax::Html
    };
    let (laid_out, page_box) =
        validate_and_lay_out(html_bytes, opts, syntax, &mut blitz_engine::RawBlitz)?;
    emit(&pagination::paginate_flat(&laid_out, &page_box), opts)
}

/// [`render`] with the parser chosen by `syntax` ([`blitz_engine::DocumentSyntax::Html`] for
/// every product render).
fn render_as(
    html_bytes: &[u8],
    opts: &RenderOptions,
    syntax: blitz_engine::DocumentSyntax,
) -> Result<Vec<u8>, VelloraError> {
    let (laid_out, page_box) =
        validate_and_lay_out(html_bytes, opts, syntax, &mut blitz_engine::NoObserver)?;

    // 4) vellora pagination: page breaking + thead repeat + counters.
    let paginated = pagination::paginate(&laid_out, &page_box);

    // 5) krilla: emit the paginated display list to PDF bytes.
    emit(&paginated, opts)
}

/// Step 5 of [`render`]: the paginated display list to PDF bytes (krilla).
fn emit(paginated: &pagination::Paginated, opts: &RenderOptions) -> Result<Vec<u8>, VelloraError> {
    let meta = DocMeta {
        title: opts.title.clone(),
        creation_date: opts.creation_date,
        pdfa: opts.pdfa,
    };
    pdf::emit(&paginated.pages, &meta).map_err(|err| match err {
        pdf::PdfEmitError::Conformance { profile, errors } => VelloraError::Conformance {
            profile: profile.as_str().to_string(),
            errors,
        },
        pdf::PdfEmitError::Render(message) => VelloraError::Render(message),
    })
}

/// Debug/fidelity tooling ONLY (`fidelity/layout-diff/`), never the render path:
/// runs exactly [`render`]'s validation + layout sequence (same function, same
/// gates, same errors) with an observer that snapshots vellora's box list at
/// every layout stage — Blitz's own layout tree and raw text runs (`B0`), the box
/// walk (`L0`), and after each named `layout_normalize` pass — keyed by stable
/// source-DOM paths, then traces [`pagination::paginate`] over the final layer
/// (`P`: fragments, gaps, cursor, pages). Stops before PDF emit. Not a stable
/// API; the shape may change freely. Model and JSON: [`layout_dump`].
#[doc(hidden)]
pub fn debug_layout_dump(
    html_bytes: &[u8],
    opts: &RenderOptions,
) -> Result<layout_dump::LayoutDump, VelloraError> {
    let mut capture = layout_dump::DumpCapture::default();
    let (laid_out, page_box) = validate_and_lay_out(
        html_bytes,
        opts,
        blitz_engine::DocumentSyntax::Html,
        &mut capture,
    )?;
    // Fidelity layer `P`: the same `paginate` the render path runs (`paginate`
    // is `paginate_traced(.., None)`), here with a trace of every placement.
    let mut trace = pagination::PaginationTrace::default();
    let _ = pagination::paginate_traced(&laid_out, &page_box, Some(&mut trace));
    Ok(capture.finish(page_box, Some(trace)))
}

/// The source-HTML dump (fidelity layer `N0`, "Blitz on the source HTML"):
/// [`debug_layout_dump`] without the pagination layer, marked as a source dump.
///
/// It existed to separate vellora's former `html_normalize` HTML pre-pass from
/// Blitz's own layout. Port step 05 deleted that pre-pass (the box walk now
/// reads Blitz's anonymous blocks itself), so the render path lays out the input
/// exactly as given and this dump's Blitz tree equals [`debug_layout_dump`]'s
/// by construction. Debug/fidelity tooling ONLY, and NOT dead code (audited at
/// port step 10). Its readers:
///
/// - `examples/layout_dump.rs --no-html-normalize` calls it, and
///   `fidelity/layout-diff/run.mjs` writes its output as `vellora-dump-source.json`;
///   `fidelity/layout-diff/lib/vellora-model.mjs` loads that file as layer `N0` and
///   refuses it unless its JSON `html_normalize` reads `"skipped"`
///   (see `layout_dump/json.rs`);
/// - `fidelity/gate/layer-vector.mjs` takes each item's `N0` value from it for the
///   relaxed GATE-A1 (b) rule `|run| <= |N0|` (`fidelity/ACCEPTANCE.md`), the
///   evidence a `DEBT.json` entry carries;
/// - layout-diff's source-DOM check `source_dom_keys_vs_chromium`.
///
/// Removing it removes the raw-Blitz reference of the debt ledger.
#[doc(hidden)]
pub fn debug_layout_dump_source_html(
    html_bytes: &[u8],
    opts: &RenderOptions,
) -> Result<layout_dump::LayoutDump, VelloraError> {
    let mut capture = layout_dump::DumpCapture::source_html();
    let (_laid_out, page_box) = validate_and_lay_out(
        html_bytes,
        opts,
        blitz_engine::DocumentSyntax::Html,
        &mut capture,
    )?;
    // The source layer stops before pagination (layer `P` is in the main dump).
    Ok(capture.finish(page_box, None))
}

/// Steps 1-3 of [`render`] (validation gates, `@page` box, Blitz layout +
/// normalize passes, unresolved-image reject), shared verbatim by
/// [`debug_layout_dump`] so the dump can never drift from what `render`
/// paginates. `observer` is [`blitz_engine::NoObserver`] on the render path; `syntax` is
/// [`blitz_engine::DocumentSyntax::Html`] everywhere except [`debug_render_xhtml`].
fn validate_and_lay_out<O: blitz_engine::LayoutObserver>(
    html_bytes: &[u8],
    opts: &RenderOptions,
    syntax: blitz_engine::DocumentSyntax,
    observer: &mut O,
) -> Result<(blitz_engine::LaidOutDoc, page_css::PageBox), VelloraError> {
    let html = std::str::from_utf8(html_bytes)
        .map_err(|e| VelloraError::Render(format!("input is not valid UTF-8: {e}")))?;

    // 1a) CSS subset gate: linear byte scans and the `@page` sheet walk, no HTML parse. It
    // runs before the depth gate, so nothing in it may recurse per nesting level
    // (`tests/deep_input.rs`).
    validation::validate_css(html)?;

    // 1a') Depth gate: reject pathologically deep nesting BEFORE the recursive
    // resolve/layout/walk, which would otherwise overflow the worker-thread stack
    // and ABORT the process. Uses an explicit-stack measure, not recursion.
    validation::validate_nesting_depth_as(html, syntax)?;

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
    let laid_out = blitz_engine::validate_then_lay_out_observed(
        html,
        validation::denied_elements(),
        page_box.content_width(),
        page_box.content_height(),
        &opts.images,
        opts.base_url.as_deref(),
        &opts.fonts,
        syntax,
        observer,
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

    Ok((laid_out, page_box))
}

/// Returns the crate name. Retained from the initial scaffold so existing
/// smoke tests (and the napi binding) keep linking.
pub fn name() -> &'static str {
    "vellora-core"
}

#[cfg(test)]
mod tests {
    use super::blitz_engine::DocumentSyntax;
    use super::{name, render_as, validate_and_lay_out, RenderOptions};

    #[test]
    fn name_is_stable() {
        assert_eq!(name(), "vellora-core");
    }

    /// Every glyph run the pages emit: its source substring (trimmed) and whether its origin
    /// lies inside its page box (a run below the page edge is in the PDF but never visible).
    fn emitted_runs(html: &str, syntax: DocumentSyntax) -> Vec<(String, bool)> {
        let opts = RenderOptions::default();
        let (laid_out, page_box) = validate_and_lay_out(
            html.as_bytes(),
            &opts,
            syntax,
            &mut super::blitz_engine::NoObserver,
        )
        .unwrap_or_else(|e| panic!("lays out: {e}"));
        let paginated = super::pagination::paginate(&laid_out, &page_box);
        let mut out = Vec::new();
        for page in &paginated.pages {
            for run in &page.text_runs {
                let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
                let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
                let on_page = (0.0..=page.width_px).contains(&run.origin_x)
                    && (0.0..=page.height_px).contains(&run.origin_y);
                out.push((run.text[start..end].trim().to_string(), on_page));
            }
        }
        out
    }

    /// The `oss-postmark-receipt` corpus template (XHTML 1.0 Transitional doctype, three `<br>`
    /// followed by text), rendered raw: its template tags stay literal text, which changes
    /// nothing about how the `<br>`s parse.
    const POSTMARK: &str = include_str!("../../../fixtures/oss-postmark-receipt/index.html");
    const AFTER_BR: [&str; 3] = ["The [Product Name] team", "1234 Street Rd.", "Suite 1234"];

    #[test]
    fn step07_parser_loses_the_postmark_text_after_br_and_the_html_parse_emits_it() {
        // Up to port step 07 every render used blitz-html's sniffing `HtmlDocument::from_html`:
        // this template's XHTML doctype sent it to xml5ever, where `<br>` is not void and the
        // text after it became the `<br>`'s content, never drawn (step 05's INV-X1/X2 6 -> 5).
        let old = emitted_runs(POSTMARK, DocumentSyntax::BlitzSniffed);
        let new = emitted_runs(POSTMARK, DocumentSyntax::Html);
        for text in AFTER_BR {
            assert!(
                !old.iter().any(|(t, _)| t.contains(text)),
                "the step-07 parse emitted {text:?}"
            );
            assert!(
                new.iter().any(|(t, _)| t == text),
                "the HTML parse lost {text:?}: {new:?}"
            );
        }
        // Emitted is not visible (port step 09, review of step 08): the HTML parse draws "The
        // [Product Name] team" on page 1, but the oversize layout table is placed whole, so
        // "1234 Street Rd." and "Suite 1234" sit below the page edge (Chrome 155 breaks the
        // table onto page 2). Pinned in `tests/html_parse.rs` as a known gap.
        let visible = |text: &str| new.iter().any(|(t, on_page)| t == text && *on_page);
        assert!(visible(AFTER_BR[0]), "{new:?}");
        assert!(!visible(AFTER_BR[1]) && !visible(AFTER_BR[2]), "{new:?}");
    }

    #[test]
    fn html_sniffed_documents_render_byte_identical_to_the_step07_parser() {
        // Every document blitz-html's sniff already parsed as HTML (`<!DOCTYPE html>`, no
        // doctype, an `<html>` without the XHTML namespace) renders exactly the PDF of step 07.
        let documents = [
            "<!DOCTYPE html><html><head><style>@page { size: A4; margin: 20mm; } body { margin: 0; \
             font-family: \"Liberation Sans\"; font-size: 16px; line-height: 20px; } p { margin: 0 \
             0 10px 0; }</style></head><body><p>Thanks for using Product.<br>The Product \
             team</p><p>1234 Street Rd.<br>Suite 1234<br/>Tail line</p></body></html>",
            "<!DOCTYPE html><html><head><style>table { border-collapse: collapse } td { border: \
             1px solid #000; padding: 4px }</style></head><body><table><thead><tr><th>A</th>\
             <th>B</th></tr></thead><tr><td>1</td><td>2</td></tr></table></body></html>",
            "<p>no doctype<br>second line</p><div>block</div>",
            "<!DOCTYPE html>\n<html xmlns=\"http://www.w3.org/1999/xhtml\"><body><p>a<br>b</p>\
             </body></html>",
        ];
        let opts = RenderOptions::default();
        for html in documents {
            let new = render_as(html.as_bytes(), &opts, DocumentSyntax::Html);
            let old = render_as(html.as_bytes(), &opts, DocumentSyntax::BlitzSniffed);
            assert_eq!(new.as_ref().ok(), old.as_ref().ok(), "{html}");
            assert!(new.is_ok(), "{html}");
        }
    }
}
