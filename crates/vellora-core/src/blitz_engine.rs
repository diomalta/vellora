//! The single internal module that touches Blitz.
//!
//! Per ARCHITECTURE.md ("isolate all Blitz contact behind a single internal
//! module so upstream API breaks touch one file") this is the ONLY place in
//! `vellora-core` that imports Blitz types. Everything above it consumes the
//! small, owned types defined here (`LaidOutDoc`, `LaidOutBox`, `TextRun`,
//! `Glyph`) and never sees a Blitz/Parley/Taffy type directly.

use base64::Engine as _;
use blitz_dom::{BaseDocument, DocumentConfig, NodeData, NodeId};
use blitz_html::HtmlDocument;
use blitz_traits::shell::{ColorScheme, Viewport};
use style::computed_values::border_collapse::T as BorderCollapse;
use style::computed_values::table_layout::T as TableLayout;

/// Chromium print-compatible A4 width in CSS px. Used as the layout viewport
/// width so Taffy resolves percentage/`width:100%` boxes against a page-shaped
/// canvas.
pub const A4_WIDTH_PX: f64 = 594.96 / 0.75;
/// Chromium print-compatible A4 height in CSS px. The viewport is tall so the
/// whole single-flow document lays out; OUR pagination slices it afterwards.
pub const A4_HEIGHT_PX: f64 = 841.92 / 0.75;

/// One positioned box read out of Blitz's laid-out tree.
///
/// Coordinates are **absolute document coordinates** in CSS px (top-left
/// origin): each box's `final_layout` location added up its chain of
/// containing blocks (Blitz's `Node::containing_block`, the box its location is
/// relative to) — pagination consumes these directly.
///
/// The list is Blitz's box tree in layout order (see [`walk_box`]): elements
/// that generate a box, Blitz's anonymous block boxes and `::before`/`::after`
/// boxes (`tag: None` for both), with each table's DOM row structure
/// (`thead`/`tbody`/`tfoot`/`tr`, zero-size) re-inserted above its cells. Text
/// nodes and non-atomic inline elements generate no box: their text is in the
/// glyph runs of the inline root that shaped it.
#[derive(Debug, Clone)]
pub struct LaidOutBox {
    pub node_id: usize,
    /// Element tag name; `None` for Blitz's anonymous block boxes and
    /// `::before`/`::after` pseudo-element boxes (no element of their own).
    pub tag: Option<String>,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub margin_top: f64,
    pub margin_bottom: f64,
    /// Explicit computed `width: <percentage>` hint from CSS. Blitz 0.3.0-beta.4
    /// turns a percentage cell or `<col>` width into `auto` unless the table uses
    /// the fixed layout (blitz-dom `layout/table.rs`, `build_table_context` and
    /// `collect_table_cells`); we keep the hint so the post-walk table pass can
    /// preserve browser-like column proportions.
    pub width_pct_hint: Option<f64>,
    /// Whether this box is a table with `table-layout: fixed`.
    pub table_layout_fixed: bool,
    /// Whether this box computes `border-collapse: collapse`.
    pub table_border_collapse: bool,
    /// Where this box's line boxes sit on the inline axis: computed `text-align`,
    /// with `start`/`end` resolved against `direction` (see [`InlineAlign`]).
    pub text_align: InlineAlign,
    /// Table-cell span in columns. Non-cell boxes use `1`.
    pub colspan: usize,
    /// `break-inside: avoid` (or the legacy `page-break-inside: avoid`) applies
    /// to this element, from a `<style>` rule or its inline `style`.
    pub break_inside_avoid: bool,
    /// A forced page break (`break-before: page`, `page-break-before: always`)
    /// applies before this element.
    pub break_before_page: bool,
    /// Depth in the tree (0 = root). Useful for debugging/asserts.
    pub depth: usize,
    /// If this node is an inline root, the shaped text it owns.
    pub text_runs: Vec<TextRun>,
    /// Visual box fragments owned by this node: backgrounds and visible borders.
    pub visual_rects: Vec<VisualRect>,
    /// Rounded border outlines owned by this node.
    pub rounded_borders: Vec<RoundedBorder>,
    /// Raster images owned by this node.
    pub image_runs: Vec<ImageRun>,
}

/// Physical inline-axis alignment of a box's line boxes, from its computed
/// `text-align` (CSS Text 3 §6.1): `left`/`right`/`center` as written, `start` and
/// `end` resolved against the box's `direction`, and `justify` treated as its
/// last-line alignment (`text-align-last: auto` = `start`), the only line a
/// one-line cell has. A post-layout pass that changes a box's width without
/// re-running inline layout moves the box's text by this alignment: `Left` by 0,
/// `Center` by half the width change, `Right` by all of it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InlineAlign {
    Left,
    Center,
    Right,
}

impl InlineAlign {
    /// How far a line aligned this way moves when its box's content width
    /// changes by `width_change` (left edge fixed).
    pub fn shift_for_width_change(self, width_change: f64) -> f64 {
        match self {
            InlineAlign::Left => 0.0,
            InlineAlign::Center => width_change / 2.0,
            InlineAlign::Right => width_change,
        }
    }
}

/// A solid visual rectangle in document coordinates.
#[derive(Debug, Clone)]
pub struct VisualRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    /// sRGB color (r,g,b) 0..=255, alpha composited over white.
    pub color: [u8; 3],
}

/// A rounded, uniform border outline in document coordinates.
#[derive(Debug, Clone)]
pub struct RoundedBorder {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub radius_x: f64,
    pub radius_y: f64,
    pub stroke_width: f64,
    /// sRGB color (r,g,b) 0..=255, alpha composited over white.
    pub color: [u8; 3],
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ImageFormat {
    Png,
    Jpeg,
    Gif,
    Webp,
}

/// A raster image in document coordinates.
#[derive(Debug, Clone)]
pub struct ImageRun {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub format: ImageFormat,
    pub data: std::sync::Arc<Vec<u8>>,
}

/// A shaped run of text (one Parley run within one line), with the glyphs and
/// font bytes needed for selectable PDF text emission.
#[derive(Debug, Clone)]
pub struct TextRun {
    /// The source text this run covers (for ToUnicode + assertions). Shared
    /// (refcounted) across the runs of one inline root, not copied per run.
    pub text: std::sync::Arc<String>,
    /// Raw font bytes (the face) — handed straight to krilla `Font::new`.
    pub font_data: std::sync::Arc<Vec<u8>>,
    /// Index of the face within a font collection.
    pub font_index: u32,
    pub font_size: f32,
    /// Baseline origin in absolute document coordinates (CSS px).
    pub origin_x: f64,
    pub origin_y: f64,
    pub glyphs: Vec<Glyph>,
    /// sRGB color (r,g,b) 0..=255.
    pub color: [u8; 3],
}

/// One positioned glyph. Offsets/advances are in font units already divided by
/// the run's font size is NOT done here — we keep raw px advances and let the
/// emitter normalize, mirroring krilla's `KrillaGlyph` contract.
#[derive(Debug, Clone)]
pub struct Glyph {
    pub id: u32,
    /// Advance in px (un-normalized).
    pub advance: f32,
    pub x_offset: f32,
    pub y_offset: f32,
    /// Byte range in the run's `text` for this glyph cluster (ToUnicode).
    pub text_start: usize,
    pub text_end: usize,
}

/// The fully laid-out document: a flat list of positioned boxes in document
/// order, plus the page-shaped viewport it was laid out against.
pub struct LaidOutDoc {
    pub boxes: Vec<LaidOutBox>,
    pub viewport_width: f64,
    pub viewport_height: f64,
    /// Total content height (root element height) in CSS px.
    pub content_height: f64,
    /// The first renderable `<img>` (document order) whose `src` could not be
    /// resolved to image bytes, if any. Carried as data so the validation gate
    /// and standalone layout helpers stay lenient (they ignore it); only the
    /// `render` entry point turns it into a rejection.
    pub unresolved_image: Option<UnresolvedImage>,
    /// What the `@page` context inherits from the root element, for the margin boxes.
    pub page_context: PageContext,
}

/// The page context of a laid-out document (CSS Paged Media 3: "The page context inherits from
/// the root element", and the page-margin boxes inherit from the page context; Chrome 155 does
/// both, `fidelity/baselines/port/06-page-rules`). Carries the root element's computed text
/// properties and the document's font context, so [`lay_out_margin_texts`] shapes margin-box
/// text with the same fonts and the same style system as the body. Opaque outside this module.
pub struct PageContext {
    /// `property: value;` declarations of the root element's computed text properties.
    root_css: String,
    /// Whether the root element's `direction` is `rtl` (page 1 is then a left page).
    pub rtl: bool,
    /// A clone of the font context the document was laid out with (same faces, same Blobs).
    font_ctx: parley::FontContext,
}

/// The root element's inherited text properties the page context copies (serialized computed
/// values, re-parsed by Stylo in the margin-box document).
const PAGE_CONTEXT_PROPERTIES: &[(&str, style::properties::LonghandId)] = {
    use style::properties::LonghandId as L;
    &[
        ("color", L::Color),
        ("font-family", L::FontFamily),
        ("font-size", L::FontSize),
        ("font-style", L::FontStyle),
        ("font-weight", L::FontWeight),
        ("letter-spacing", L::LetterSpacing),
        ("line-height", L::LineHeight),
        ("text-transform", L::TextTransform),
        ("word-spacing", L::WordSpacing),
    ]
};

fn page_context_of(base: &BaseDocument, font_ctx: parley::FontContext) -> PageContext {
    use style::computed_values::direction::T as Direction;
    use style::properties::PropertyDeclarationId;

    let root = base.root_element();
    let mut root_css = String::new();
    let mut rtl = false;
    if let Some(styles) = root.primary_styles() {
        for (name, id) in PAGE_CONTEXT_PROPERTIES {
            let value = styles.computed_value_to_string(PropertyDeclarationId::Longhand(*id));
            if !value.is_empty() {
                root_css.push_str(&format!("{name}: {value}; "));
            }
        }
        rtl = matches!(styles.clone_direction(), Direction::Rtl);
    }
    PageContext {
        root_css,
        rtl,
        font_ctx,
    }
}

/// One margin box to lay out: its text and the cascaded text declarations of the page context
/// and of the box.
pub struct MarginRequest<'a> {
    pub text: &'a str,
    pub page_style: &'a [crate::page_css::Declaration],
    pub box_style: &'a [crate::page_css::Declaration],
}

/// A margin box's text as Blitz laid it out on one line: glyph runs relative to the top-left
/// corner of its line box, the line's width (max-content) and height.
pub struct MarginLayout {
    pub runs: Vec<TextRun>,
    pub width: f64,
    pub height: f64,
}

/// Lay out every requested margin-box text in ONE small Blitz document whose root carries the
/// page context's inherited values (`PageContext::root_css`), each box a max-content,
/// non-wrapping block under a page-context block. Stylo parses the declarations and Parley shapes
/// the text exactly like body text, with the document's own font context.
pub fn lay_out_margin_texts(
    ctx: &PageContext,
    requests: &[MarginRequest<'_>],
) -> Vec<Option<MarginLayout>> {
    if requests.is_empty() {
        return Vec::new();
    }
    let declarations = |list: &[crate::page_css::Declaration]| {
        list.iter()
            .map(|d| format!("{}: {};", d.property, d.value))
            .collect::<Vec<_>>()
            .join(" ")
    };
    let mut css = format!(
        "html {{ {} }} body {{ margin: 0; }} div {{ margin: 0; padding: 0; border: 0; }} \
         .vellora-margin {{ display: block; white-space: nowrap; width: max-content; }}",
        ctx.root_css
    );
    let mut body = String::new();
    for (i, request) in requests.iter().enumerate() {
        css.push_str(&format!(
            " .vellora-page-{i} {{ {} }} .vellora-box-{i} {{ {} }}",
            declarations(request.page_style),
            declarations(request.box_style)
        ));
        let text = request
            .text
            .replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;");
        body.push_str(&format!(
            "<div class=\"vellora-page-{i}\"><div class=\"vellora-margin vellora-box-{i}\">{text}</div></div>"
        ));
    }
    let html =
        format!("<!DOCTYPE html><html><head><style>{css}</style></head><body>{body}</body></html>");
    let mut doc = build_document_with(&html, ctx.font_ctx.clone());
    let viewport = Viewport::new(100_000, 1000, 1.0, ColorScheme::Light);
    doc.as_mut().set_viewport(viewport);
    doc.as_mut().resolve(0.0);
    let base: &BaseDocument = doc.as_ref();

    let mut boxes: Vec<Option<NodeId>> = vec![None; requests.len()];
    let mut stack = vec![base.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = base.get_node(id) else {
            continue;
        };
        if let Some(class) = node.attr(blitz_dom::local_name!("class")) {
            if let Some(i) = class
                .split_whitespace()
                .find_map(|c| c.strip_prefix("vellora-box-"))
                .and_then(|i| i.parse::<usize>().ok())
            {
                if let Some(slot) = boxes.get_mut(i) {
                    *slot = Some(id);
                }
            }
        }
        stack.extend(node.children.iter().copied());
    }

    let mut face_cache = std::collections::HashMap::new();
    let mut origins = std::collections::HashMap::new();
    boxes
        .into_iter()
        .map(|id| {
            let id = id?;
            let node = base.get_node(id)?;
            let (x, y) = box_origin(base, id, &mut origins);
            let mut runs = read_text_runs(base, node, x, y, &mut face_cache);
            if runs.is_empty() {
                return None;
            }
            for run in &mut runs {
                run.origin_x -= x;
                run.origin_y -= y;
            }
            let size = node.final_layout().size;
            Some(MarginLayout {
                runs,
                width: size.width as f64,
                height: size.height as f64,
            })
        })
        .collect()
}

/// A renderable `<img>` whose `src` could not be resolved to supported image
/// bytes. Mirrors [`DeniedElement`] so the source locator can pinpoint it.
pub struct UnresolvedImage {
    /// 1-based ordinal of this `<img>` among all `<img>` in document order.
    pub occurrence: usize,
    /// Total `<img>` count in the parsed DOM (locator degrades to `None` on a
    /// source/DOM count mismatch, exactly like [`DeniedElement::dom_total`]).
    pub dom_total: usize,
    /// Why resolution failed (folded into the diagnostic hint).
    pub reason: &'static str,
}

/// A denied element located during the immutable validation walk.
pub struct DeniedElement {
    /// Lowercased tag name (e.g. `"script"`).
    pub tag: String,
    /// 1-based ordinal of this tag among same-named tags (for source location).
    pub occurrence: usize,
    /// Total count of this tag in the parsed DOM. When this differs from the
    /// number of `<tag` boundaries in the source, html5ever reparented/injected
    /// elements (e.g. a denied tag fostered out of table context), so the
    /// ordinal cannot be trusted to map to the same source occurrence and the
    /// locator degrades to `None` rather than pointing at the wrong element.
    pub dom_total: usize,
}

/// Parse the HTML once and walk the tree IMMUTABLY looking for the first denied
/// element in document order (subset-validation). Returns `None` if all
/// elements are in-subset. This reuses Blitz's parse and never mutates the tree.
///
/// Standalone helper kept for direct gate tests; the render path uses
/// [`validate_then_lay_out`], which parses ONCE and reuses that parse for both
/// validation and layout (the cost model).
pub fn find_denied_element(html: &str, denied: &[&str]) -> Option<DeniedElement> {
    let doc = build_document(html, &[]);
    let base: &BaseDocument = doc.as_ref();
    find_denied_in_document(base, denied)
}

/// Walk an already-parsed document for the first denied element (no parse).
fn find_denied_in_document(base: &BaseDocument, denied: &[&str]) -> Option<DeniedElement> {
    let mut counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    let root_id = base.root_element().id;
    let mut found: Option<DeniedElement> = None;
    walk_for_denied(base, root_id, denied, &mut counts, &mut found);
    found.map(|mut d| {
        // Total DOM occurrences of this tag, so the source locator can detect a
        // reparent-induced ordinal mismatch and degrade to None.
        d.dom_total = count_tag_in_document(base, &d.tag);
        d
    })
}

/// Count every element of `tag` in the parsed DOM (explicit stack, no recursion).
fn count_tag_in_document(base: &BaseDocument, tag: &str) -> usize {
    let root_id = base.root_element().id;
    let mut total = 0usize;
    let mut stack = vec![root_id];
    while let Some(node_id) = stack.pop() {
        let node = match base.get_node(node_id) {
            Some(n) => n,
            None => continue,
        };
        if let Some(el) = node.data.downcast_element() {
            let local: &str = &el.name.local;
            if local.eq_ignore_ascii_case(tag) {
                total += 1;
            }
        }
        for child in node.children.iter().copied() {
            stack.push(child);
        }
    }
    total
}

/// Maximum element nesting depth in the parsed tree, measured with an EXPLICIT
/// stack (never native recursion) so a pathologically deep document cannot
/// overflow the worker-thread stack here. Parses once; the depth gate
/// ([`crate::validation`]) calls this BEFORE any recursive resolve/layout/walk,
/// rejecting over-deep input cleanly instead of letting Stylo/Taffy/our own walk
/// abort the process. Element depth only (text nodes are not counted).
pub fn max_nesting_depth(html: &str) -> usize {
    let doc = build_document(html, &[]);
    let base: &BaseDocument = doc.as_ref();
    let root_id = base.root_element().id;
    let mut max_depth = 0usize;
    // (node_id, depth-of-this-node-counting-only-elements).
    let mut stack: Vec<(NodeId, usize)> = vec![(root_id, 0)];
    while let Some((node_id, depth)) = stack.pop() {
        let node = match base.get_node(node_id) {
            Some(n) => n,
            None => continue,
        };
        let child_depth = if node.data.downcast_element().is_some() {
            if depth > max_depth {
                max_depth = depth;
            }
            depth + 1
        } else {
            depth
        };
        for child in node.children.iter().copied() {
            stack.push((child, child_depth));
        }
    }
    max_depth
}

/// Build a parsed Blitz document (parse only; no style/layout yet). `custom`
/// carries caller-supplied font faces registered alongside the bundled ones; the
/// parse-only/geometry helpers pass `&[]` (they never measure text), only the
/// layout path threads `opts.fonts`.
fn build_document(html: &str, custom: &[Vec<u8>]) -> HtmlDocument {
    build_document_with(html, crate::fonts::build_font_context(custom))
}

/// [`build_document`] with an explicit font context (the layout path keeps a clone of it for
/// the margin boxes, [`PageContext`]).
fn build_document_with(html: &str, font_ctx: parley::FontContext) -> HtmlDocument {
    HtmlDocument::from_html(
        html,
        DocumentConfig {
            base_url: Some("https://vellora.local/".to_string()),
            // Self-contained, deterministic fonts: bundled faces with system-font
            // discovery off (see `crate::fonts`). This is what removes the
            // `libfontconfig` runtime dependency and makes output machine-independent.
            font_ctx: Some(font_ctx),
            ..Default::default()
        },
    )
}

fn walk_for_denied(
    base: &BaseDocument,
    node_id: NodeId,
    denied: &[&str],
    counts: &mut std::collections::HashMap<String, usize>,
    found: &mut Option<DeniedElement>,
) {
    if found.is_some() {
        return;
    }
    let node = match base.get_node(node_id) {
        Some(n) => n,
        None => return,
    };
    if let Some(el) = node.data.downcast_element() {
        let tag = el.name.local.to_string().to_ascii_lowercase();
        let n = counts.entry(tag.clone()).or_insert(0);
        *n += 1;
        if denied.iter().any(|d| *d == tag) {
            *found = Some(DeniedElement {
                tag,
                occurrence: *n,
                // Filled in by `find_denied_in_document` after the walk.
                dom_total: 0,
            });
            return;
        }
    }
    for child in node.children.iter().copied() {
        walk_for_denied(base, child, denied, counts, found);
        if found.is_some() {
            return;
        }
    }
}

/// Parse + style + layout + text in one call. Owns and drops the `!Send`
/// `BaseDocument` entirely within this function (lifetime contract).
pub fn lay_out(html: &str) -> LaidOutDoc {
    let breaks = crate::break_css::parse_break_rules(html);
    let font_ctx = crate::fonts::build_font_context(&[]);
    let doc = build_document_with(html, font_ctx.clone());
    // Standalone/test helper: lay out against the full A4 width with no caller
    // images (an unresolved `<img>` is recorded on the doc but not enforced here).
    // The render path uses `validate_then_lay_out` with the real @page content width.
    resolve_and_walk(
        doc,
        A4_WIDTH_PX,
        A4_HEIGHT_PX,
        &std::collections::HashMap::new(),
        None,
        &breaks,
        font_ctx,
        &mut NoObserver,
    )
}

/// Parse one Blitz document, run the subset-validation walk over that single
/// parsed tree, and only if it passes, resolve + walk into a [`LaidOutDoc`]. The
/// `denied` allowlist is supplied by the validation gate. The input is laid out
/// exactly as given: there is no HTML pre-pass (port step 05 deleted
/// `html_normalize`, whose synthetic `<div>` wrappers stood in for the anonymous
/// blocks the walk did not read).
///
/// Returns `Err(DeniedElement)` for the first out-of-subset element; the caller
/// turns it into a located diagnostic.
pub fn validate_then_lay_out(
    html: &str,
    denied: &[&str],
    content_width_px: f64,
    content_height_px: f64,
    images: &std::collections::HashMap<String, Vec<u8>>,
    base_url: Option<&str>,
    fonts: &[Vec<u8>],
) -> Result<LaidOutDoc, DeniedElement> {
    validate_then_lay_out_observed(
        html,
        denied,
        content_width_px,
        content_height_px,
        images,
        base_url,
        fonts,
        &mut NoObserver,
    )
}

/// [`validate_then_lay_out`] with a [`LayoutObserver`] hooked onto each layout
/// stage. The render path passes [`NoObserver`] (every hook is a no-op that
/// monomorphizes away); only the debug layout dump passes a real observer.
#[allow(clippy::too_many_arguments)]
pub(crate) fn validate_then_lay_out_observed<O: LayoutObserver>(
    html: &str,
    denied: &[&str],
    content_width_px: f64,
    content_height_px: f64,
    images: &std::collections::HashMap<String, Vec<u8>>,
    base_url: Option<&str>,
    fonts: &[Vec<u8>],
    observer: &mut O,
) -> Result<LaidOutDoc, DeniedElement> {
    let breaks = crate::break_css::parse_break_rules(html);
    let font_ctx = crate::fonts::build_font_context(fonts);
    let doc = build_document_with(html, font_ctx.clone());
    // Validate and lay out the same Blitz parse: one tree shared by validation
    // and layout.
    if let Some(found) = find_denied_in_document(doc.as_ref(), denied) {
        return Err(found);
    }
    Ok(resolve_and_walk(
        doc,
        content_width_px,
        content_height_px,
        images,
        base_url,
        &breaks,
        font_ctx,
        observer,
    ))
}

/// A named post-layout pass over the walked boxes.
pub(crate) type LayoutPass = (&'static str, fn(&mut [LaidOutBox]));

/// vellora's post-layout correction passes ([`crate::layout_normalize`]) in the
/// exact order the render path applies them. Single source of truth: the render
/// path iterates this list and the debug layout dump names each snapshot layer
/// after it, so the dumped layer names cannot drift from the passes that ran.
pub(crate) const LAYOUT_NORMALIZE_PASSES: &[LayoutPass] = &[
    (
        "painted_table_cell_text_baselines",
        crate::layout_normalize::normalize_painted_table_cell_text_baselines,
    ),
    (
        "table_percent_widths",
        crate::layout_normalize::normalize_table_percent_widths,
    ),
    (
        "auto_table_compact_columns",
        crate::layout_normalize::normalize_auto_table_compact_columns,
    ),
];

/// Hooks onto the layout stages of [`resolve_and_walk`]. Every method defaults to
/// a no-op; the render path uses [`NoObserver`], so production behavior and PDF
/// bytes are unchanged. The debug layout dump
/// ([`crate::layout_dump::DumpCapture`]) is the only real implementation. No
/// Blitz type crosses this trait: `after_walk` gets a [`BlitzSnapshot`], whose
/// only operation is an owned, Blitz-free copy of the laid-out tree.
pub(crate) trait LayoutObserver {
    /// After the box walk, before any normalize pass (layer `L0`).
    fn after_walk(
        &mut self,
        _blitz: &BlitzSnapshot<'_>,
        _boxes: &[LaidOutBox],
        _viewport: (u32, u32),
    ) {
    }
    /// After each named pass of [`LAYOUT_NORMALIZE_PASSES`].
    fn after_pass(&mut self, _name: &'static str, _boxes: &[LaidOutBox]) {}
}

/// The production observer: observes nothing.
pub(crate) struct NoObserver;

impl LayoutObserver for NoObserver {}

/// Resolve style+layout on a parsed document and read it into a `LaidOutDoc`.
///
/// `content_width_px` is the @page CONTENT width (page width minus left/right
/// margins) — the box the document flows into. Laying out against the full page
/// width instead would make `width:100%` boxes overflow once pagination offsets
/// them by the left margin (the clipped-last-column bug). `font_ctx` is a clone of
/// the context `doc` was built with, kept for the margin boxes ([`PageContext`]).
#[allow(clippy::too_many_arguments)]
fn resolve_and_walk<O: LayoutObserver>(
    mut doc: HtmlDocument,
    content_width_px: f64,
    content_height_px: f64,
    images: &std::collections::HashMap<String, Vec<u8>>,
    base_url: Option<&str>,
    breaks: &crate::break_css::BreakRules,
    font_ctx: parley::FontContext,
    observer: &mut O,
) -> LaidOutDoc {
    let viewport_px = (content_width_px as u32, content_height_px.max(0.0) as u32);
    let viewport = Viewport::new(viewport_px.0, viewport_px.1, 1.0, ColorScheme::Light);
    doc.as_mut().set_viewport(viewport);
    doc.as_mut().resolve(0.0);

    let base: &BaseDocument = doc.as_ref();
    let break_targets = BreakTargets {
        avoid_inside: matched_nodes(base, &breaks.avoid_inside),
        page_before: matched_nodes(base, &breaks.page_before),
    };
    let mut boxes = Vec::new();
    // Resolves each <img> source to bytes during the walk and records the first
    // renderable-but-unresolved <img> in document order.
    let mut img_resolve = ImageResolve {
        images,
        base_url,
        img_ordinal: img_ordinals(base),
        first_unresolved: None,
    };
    // Dedup font-face bytes across the whole walk: each distinct face (keyed by
    // its font Blob id) is materialized into one `Arc<Vec<u8>>` shared by every
    // run drawn from it, so krilla's per-face cache hits once per face. The id
    // is a process-global allocation-order counter, not a content hash; dedup
    // correctness relies on fontique handing back clones of the same Blob (stable
    // id) for a face WITHIN a single FontContext. This key is valid only within
    // this one walk — never persist, serialize, or compare it across renders.
    let mut face_cache: std::collections::HashMap<u64, std::sync::Arc<Vec<u8>>> =
        std::collections::HashMap::new();
    let root_id = base.root_element().id;
    // Scope the sink so its `&mut` borrows of `boxes`/`img_resolve` are released
    // before the post-walk normalize passes (which re-borrow `boxes`) and before
    // we read `img_resolve.first_unresolved` below.
    {
        let mut sink = WalkSink {
            out: &mut boxes,
            face_cache: &mut face_cache,
            img: &mut img_resolve,
            breaks: &break_targets,
            origins: std::collections::HashMap::new(),
        };
        walk_box(base, root_id, 0, &mut sink);
    }
    observer.after_walk(&BlitzSnapshot { base }, &boxes, viewport_px);
    // Post-layout corrections, in `LAYOUT_NORMALIZE_PASSES` order.
    for &(name, pass) in LAYOUT_NORMALIZE_PASSES {
        pass(&mut boxes);
        observer.after_pass(name, &boxes);
    }

    let content_height = base.root_element().final_layout().size.height as f64;

    // Pair the first unresolved <img> with the DOM total so the source locator can
    // pinpoint it (degrading to None on a source/DOM count mismatch).
    let unresolved_image =
        img_resolve
            .first_unresolved
            .map(|(occurrence, reason)| UnresolvedImage {
                occurrence,
                dom_total: count_tag_in_document(base, "img"),
                reason,
            });

    LaidOutDoc {
        boxes,
        viewport_width: content_width_px,
        viewport_height: content_height_px,
        content_height,
        unresolved_image,
        page_context: page_context_of(base, font_ctx),
    }
}

/// Mutable sinks threaded through the layout walk, bundled to keep the walk's
/// arity small: the output boxes, the per-face byte cache, image resolution, and
/// the memo of absolute border-box origins ([`box_origin`]).
struct WalkSink<'a, 'img> {
    out: &'a mut Vec<LaidOutBox>,
    face_cache: &'a mut std::collections::HashMap<u64, std::sync::Arc<Vec<u8>>>,
    img: &'a mut ImageResolve<'img>,
    breaks: &'a BreakTargets,
    /// Absolute border-box origin per node, filled by [`box_origin`]. Lookup
    /// only: the walk's output order never depends on iterating this map.
    origins: std::collections::HashMap<NodeId, (f64, f64)>,
}

/// Node ids matched by the stylesheet's fragmentation rules
/// (see [`crate::break_css`]).
struct BreakTargets {
    avoid_inside: std::collections::HashSet<NodeId>,
    page_before: std::collections::HashSet<NodeId>,
}

/// Resolve each selector list with Stylo's selector matching. A selector Stylo
/// cannot parse matches nothing, exactly as the browser drops that rule.
fn matched_nodes(base: &BaseDocument, selectors: &[String]) -> std::collections::HashSet<NodeId> {
    selectors
        .iter()
        .filter_map(|selector| base.query_selector_all(selector).ok())
        .flatten()
        .collect()
}

/// Read one box of Blitz's box tree and, recursively, its layout children.
///
/// The walk follows Blitz's layout tree (`Node::layout_children`), not the DOM:
/// that is where Blitz keeps the anonymous block boxes it wraps around inline
/// content next to block siblings (`text<p>…</p>text`, a `<td>` holding text and
/// a `<div>`, the body's own text) and block-level `::before`/`::after` boxes,
/// which a DOM-children walk never visits (their text was lost). The order is
/// Blitz's layout order (DOM order with those boxes in place); out-of-flow boxes
/// stay under their layout parent, so pagination still meets them among the
/// body's children.
///
/// Positions come from Blitz's positioning chain instead of the walk path: a
/// box's `final_layout.location` is relative to the border box of
/// `Node::containing_block()` (the `oof_containing_block` of an absolutely
/// positioned or fixed box hoisted to its containing block by Taffy, else the
/// layout parent, anonymous blocks included), see [`box_origin`]. Summing DOM
/// (or layout) parents instead put an absolutely positioned box inside a
/// non-positioned `<p>` 10/26 px off (Chrome 155 and `Node::absolute_position`:
/// 48,35; parent sum 58,61) and added the body offset to a box whose containing
/// block is the initial containing block (`tests/walk.rs`).
///
/// Why `layout_children` and not `paint_children` (Blitz's paint order): a
/// probe of Blitz 0.3.0-beta.4 (`fidelity/baselines/port/05-walk-rewrite`) found
/// that `paint_children` moves an out-of-flow box under its containing block
/// (for the initial containing block that is `<html>`, a sibling of `<body>`, so
/// pagination, which fragments the body's children, would drop it) and leaves
/// boxes with a non-zero `z-index` out entirely (they live in the stacking
/// context's list). Positions summed along `paint_children` equal
/// [`box_origin`]'s for every box of the probe. Paint order itself does not
/// reach the PDF from this list: `pagination` sorts the filled rects by
/// position and the emitter draws all rects, then images, strokes, text.
///
/// Tables are the exception to "layout tree only": Blitz lays out a table's
/// cells as direct layout children of the table (rows and row groups are not
/// layout boxes), while pagination (`<thead>` repetition, row fragments) and
/// the table passes need the row structure, so [`walk_table`] re-inserts it.
fn walk_box(base: &BaseDocument, node_id: NodeId, depth: usize, sink: &mut WalkSink) {
    let Some(node) = base.get_node(node_id) else {
        return;
    };
    let (abs_x, abs_y) = box_origin(base, node_id, &mut sink.origins);
    push_box(base, node, abs_x, abs_y, depth, sink);

    if node.flags.is_table_root() {
        walk_table(base, node, (abs_x, abs_y), depth + 1, sink);
        return;
    }
    let children: Vec<NodeId> = node
        .layout_children
        .borrow()
        .as_ref()
        .map(|c| c.iter().copied().collect())
        .unwrap_or_default();
    for child in children {
        walk_box(base, child, depth + 1, sink);
    }
}

/// The children of a table root: its DOM row groups and rows as zero-size
/// structural boxes at the table's origin (Blitz gives them no layout, CONFIRMED
/// by the step-05 probe: no `layout_parent`, zero `final_layout`), each cell
/// under its row, then whatever else Blitz lists as the table's layout children
/// (`::before`/`::after`, out-of-flow boxes not reached through a row).
fn walk_table(
    base: &BaseDocument,
    table: &blitz_dom::Node,
    table_origin: (f64, f64),
    depth: usize,
    sink: &mut WalkSink,
) {
    let laid_out: Vec<NodeId> = table
        .layout_children
        .borrow()
        .as_ref()
        .map(|c| c.iter().copied().collect())
        .unwrap_or_default();
    let laid_out_set: std::collections::HashSet<NodeId> = laid_out.iter().copied().collect();
    let mut emitted: std::collections::HashSet<NodeId> = std::collections::HashSet::new();
    if let Some(before) = table.before().filter(|id| laid_out_set.contains(id)) {
        walk_box(base, before, depth, sink);
        emitted.insert(before);
    }
    for &child in &table.children {
        walk_table_part(
            base,
            child,
            table_origin,
            depth,
            &laid_out_set,
            &mut emitted,
            sink,
        );
    }
    for child in laid_out {
        if !emitted.contains(&child) {
            walk_box(base, child, depth, sink);
        }
    }
}

/// One DOM child of a table (or of one of its row groups/rows): a cell or an
/// out-of-flow box Blitz laid out is walked as a box; any other element (row
/// group, row, `display: contents` wrapper, caption, column) becomes a zero-size
/// structural box at its DOM parent's origin, and row groups/rows recurse.
fn walk_table_part(
    base: &BaseDocument,
    node_id: NodeId,
    parent_origin: (f64, f64),
    depth: usize,
    laid_out: &std::collections::HashSet<NodeId>,
    emitted: &mut std::collections::HashSet<NodeId>,
    sink: &mut WalkSink,
) {
    if laid_out.contains(&node_id) {
        if emitted.insert(node_id) {
            walk_box(base, node_id, depth, sink);
        }
        return;
    }
    let Some(node) = base.get_node(node_id) else {
        return;
    };
    if !node.is_element() {
        return;
    }
    let location = node.final_layout().location;
    let origin = (
        parent_origin.0 + location.x as f64,
        parent_origin.1 + location.y as f64,
    );
    push_box(base, node, origin.0, origin.1, depth, sink);
    let groups_rows = node.primary_styles().is_some_and(|styles| {
        use style::values::specified::box_::DisplayInside;
        matches!(
            styles.clone_display().inside(),
            DisplayInside::TableRowGroup
                | DisplayInside::TableHeaderGroup
                | DisplayInside::TableFooterGroup
                | DisplayInside::TableRow
                | DisplayInside::Contents
        )
    });
    if groups_rows {
        for &child in &node.children {
            walk_table_part(base, child, origin, depth + 1, laid_out, emitted, sink);
        }
    }
}

/// Absolute border-box origin of `node_id` (document CSS px): its
/// `final_layout.location` plus the origin of its `Node::containing_block()`,
/// up to the document node. This is Blitz's own `Node::absolute_position(0, 0)`
/// without scroll offsets (a laid-out document never scrolls here), summed in
/// `f64` from the root down, memoised per node.
fn box_origin(
    base: &BaseDocument,
    node_id: NodeId,
    memo: &mut std::collections::HashMap<NodeId, (f64, f64)>,
) -> (f64, f64) {
    let mut chain = Vec::new();
    let mut origin = (0.0, 0.0);
    let mut current = Some(node_id);
    while let Some(id) = current {
        if let Some(&known) = memo.get(&id) {
            origin = known;
            break;
        }
        let Some(node) = base.get_node(id) else {
            break;
        };
        chain.push(id);
        current = node.containing_block();
    }
    for id in chain.into_iter().rev() {
        if let Some(node) = base.get_node(id).filter(|n| node_has_layout_data(n)) {
            let location = node.final_layout().location;
            origin = (origin.0 + location.x as f64, origin.1 + location.y as f64);
        }
        memo.insert(id, origin);
    }
    origin
}

/// Read one box (border-box origin `abs_x`/`abs_y`) into the output list.
fn push_box(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    abs_x: f64,
    abs_y: f64,
    depth: usize,
    sink: &mut WalkSink,
) {
    let node_id = node.id;
    // Blitz 0.3.0-beta.4: `Node::final_layout()` PANICS for node kinds that
    // carry no layout data (text and comment nodes). The walk only reaches
    // boxes, but keep the zero layout as the guard.
    let zero_layout;
    let layout = if node_has_layout_data(node) {
        node.final_layout()
    } else {
        zero_layout = Default::default();
        &zero_layout
    };

    // Anonymous block boxes and pseudo-element boxes are `AnonymousBlock` nodes
    // carrying a placeholder `div` name; they are not elements.
    let tag = (!node.is_anonymous())
        .then(|| node.data.downcast_element())
        .flatten()
        .map(|el| el.name.local.to_string());

    let content_x = abs_x + layout.border.left as f64 + layout.padding.left as f64;
    let content_y = abs_y + layout.border.top as f64 + layout.padding.top as f64;
    let content_width = (layout.size.width as f64
        - layout.border.left as f64
        - layout.border.right as f64
        - layout.padding.left as f64
        - layout.padding.right as f64)
        .max(0.0);
    let content_height = (layout.size.height as f64
        - layout.border.top as f64
        - layout.border.bottom as f64
        - layout.padding.top as f64
        - layout.padding.bottom as f64)
        .max(0.0);
    let text_runs = read_text_runs(base, node, content_x, content_y, sink.face_cache);
    let (visual_rects, rounded_borders) = read_visuals(node, abs_x, abs_y);
    let image_runs = resolve_image_runs(
        node,
        content_x,
        content_y,
        content_width,
        content_height,
        sink.img,
    );

    let inline_breaks = node
        .attr(blitz_dom::local_name!("style"))
        .map(crate::break_css::declares)
        .unwrap_or_default();

    sink.out.push(LaidOutBox {
        // Blitz 0.3.0-beta.4 ids are versioned `NodeId(u64)` (slot index + version)
        // instead of `usize` slab keys. Consumers only compare ids for equality, so
        // the raw u64 is carried as our owned `usize` id.
        node_id: node_id.as_u64() as usize,
        tag,
        x: abs_x,
        y: abs_y,
        width: layout.size.width as f64,
        height: layout.size.height as f64,
        margin_top: layout.margin.top as f64,
        margin_bottom: layout.margin.bottom as f64,
        width_pct_hint: width_percentage_hint(node),
        table_layout_fixed: table_layout_fixed(node),
        table_border_collapse: table_border_collapse(node),
        text_align: inline_align(node),
        colspan: colspan(node),
        break_inside_avoid: inline_breaks.avoid_inside
            || sink.breaks.avoid_inside.contains(&node_id),
        break_before_page: inline_breaks.page_before || sink.breaks.page_before.contains(&node_id),
        depth,
        text_runs,
        visual_rects,
        rounded_borders,
        image_runs,
    });
}

/// Whether `node` carries Blitz layout data (element, anonymous block, or the
/// document node), i.e. whether `Node::final_layout()` is callable without
/// panicking under Blitz 0.3.0-beta.4.
fn node_has_layout_data(node: &blitz_dom::Node) -> bool {
    matches!(
        node.data,
        NodeData::Element(_) | NodeData::AnonymousBlock(_) | NodeData::Document(_)
    )
}

fn width_percentage_hint(node: &blitz_dom::Node) -> Option<f64> {
    let styles = node.primary_styles()?;
    match styles.get_position().clone_width() {
        style::values::generics::length::Size::LengthPercentage(width) => match width.0.unpack() {
            style::values::computed::length_percentage::Unpacked::Percentage(pct) => {
                let value = pct.0 as f64;
                (value > 0.0 && value <= 1.0).then_some(value)
            }
            _ => None,
        },
        _ => None,
    }
}

fn table_layout_fixed(node: &blitz_dom::Node) -> bool {
    node.primary_styles()
        .is_some_and(|styles| matches!(styles.clone_table_layout(), TableLayout::Fixed))
}

fn table_border_collapse(node: &blitz_dom::Node) -> bool {
    node.primary_styles()
        .is_some_and(|styles| matches!(styles.clone_border_collapse(), BorderCollapse::Collapse))
}

/// The box's computed `text-align` as a physical side ([`InlineAlign`]). Blitz
/// hands the same keyword to Parley (`stylo_to_parley::text_align`, blitz-dom
/// 0.3.0-beta.4), which resolves `start`/`end` against the paragraph direction.
fn inline_align(node: &blitz_dom::Node) -> InlineAlign {
    use style::computed_values::direction::T as Direction;
    use style::values::specified::TextAlignKeyword;

    let Some(styles) = node.primary_styles() else {
        return InlineAlign::Left;
    };
    let rtl = matches!(styles.clone_direction(), Direction::Rtl);
    let (start, end) = if rtl {
        (InlineAlign::Right, InlineAlign::Left)
    } else {
        (InlineAlign::Left, InlineAlign::Right)
    };
    match styles.clone_text_align() {
        TextAlignKeyword::Left | TextAlignKeyword::MozLeft => InlineAlign::Left,
        TextAlignKeyword::Right | TextAlignKeyword::MozRight => InlineAlign::Right,
        TextAlignKeyword::Center | TextAlignKeyword::MozCenter => InlineAlign::Center,
        TextAlignKeyword::Start | TextAlignKeyword::Justify => start,
        TextAlignKeyword::End => end,
    }
}

/// Whether computed `text-align` is right/end (direction not considered). Only
/// the inline padding-right compensation of [`read_text_runs`] uses it.
fn text_align_right(node: &blitz_dom::Node) -> bool {
    node.primary_styles().is_some_and(|styles| {
        use style::values::specified::TextAlignKeyword;

        matches!(
            styles.clone_text_align(),
            TextAlignKeyword::Right | TextAlignKeyword::End | TextAlignKeyword::MozRight
        )
    })
}

fn colspan(node: &blitz_dom::Node) -> usize {
    node.attr(blitz_dom::local_name!("colspan"))
        .and_then(|value| value.parse::<usize>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(1)
        .min(1000)
}

/// Read paintable box visuals out of Blitz's computed style/layout, while
/// keeping Blitz/Stylo/Taffy types sealed inside this module.
fn read_visuals(
    node: &blitz_dom::Node,
    abs_x: f64,
    abs_y: f64,
) -> (Vec<VisualRect>, Vec<RoundedBorder>) {
    let styles = match node.primary_styles() {
        Some(styles) => styles,
        None => return (Vec::new(), Vec::new()),
    };
    // Only styled (element-like) nodes reach here, and those always carry layout
    // data, so `final_layout()` cannot hit its text/comment-node panic.
    let layout = node.final_layout();
    let width = layout.size.width as f64;
    let height = layout.size.height as f64;
    if width <= 0.0 || height <= 0.0 {
        return (Vec::new(), Vec::new());
    }

    let mut rects = Vec::new();
    let mut rounded_borders = Vec::new();
    let current_color = styles.clone_color();
    let background_color = styles
        .get_background()
        .background_color
        .resolve_to_absolute(&current_color);
    if let Some(color) = absolute_color_to_srgb(background_color) {
        rects.push(VisualRect {
            x: abs_x,
            y: abs_y,
            width,
            height,
            color,
        });
    }

    let border = styles.get_border();
    if let Some(outline) =
        read_uniform_rounded_border(border, &current_color, abs_x, abs_y, width, height)
    {
        rounded_borders.push(outline);
        return (rects, rounded_borders);
    }

    let sides = [
        BorderSide {
            style: border.border_top_style,
            width: border.border_top_width.0.to_f64_px(),
            color: border.border_top_color.resolve_to_absolute(&current_color),
            rect: (abs_x, abs_y, width, border.border_top_width.0.to_f64_px()),
        },
        BorderSide {
            style: border.border_right_style,
            width: border.border_right_width.0.to_f64_px(),
            color: border
                .border_right_color
                .resolve_to_absolute(&current_color),
            rect: (
                abs_x + width - border.border_right_width.0.to_f64_px(),
                abs_y,
                border.border_right_width.0.to_f64_px(),
                height,
            ),
        },
        BorderSide {
            style: border.border_bottom_style,
            width: border.border_bottom_width.0.to_f64_px(),
            color: border
                .border_bottom_color
                .resolve_to_absolute(&current_color),
            rect: (
                abs_x,
                abs_y + height - border.border_bottom_width.0.to_f64_px(),
                width,
                border.border_bottom_width.0.to_f64_px(),
            ),
        },
        BorderSide {
            style: border.border_left_style,
            width: border.border_left_width.0.to_f64_px(),
            color: border.border_left_color.resolve_to_absolute(&current_color),
            rect: (abs_x, abs_y, border.border_left_width.0.to_f64_px(), height),
        },
    ];

    for side in sides {
        if side.width <= 0.0 || side.style.none_or_hidden() {
            continue;
        }
        let Some(color) = absolute_color_to_srgb(side.color) else {
            continue;
        };
        let (x, y, width, height) = side.rect;
        if width > 0.0 && height > 0.0 {
            rects.push(VisualRect {
                x,
                y,
                width,
                height,
                color,
            });
        }
    }

    (rects, rounded_borders)
}

fn read_uniform_rounded_border(
    border: &style::properties::style_structs::Border,
    current_color: &style::color::AbsoluteColor,
    abs_x: f64,
    abs_y: f64,
    width: f64,
    height: f64,
) -> Option<RoundedBorder> {
    let top_w = border.border_top_width.0.to_f64_px();
    let right_w = border.border_right_width.0.to_f64_px();
    let bottom_w = border.border_bottom_width.0.to_f64_px();
    let left_w = border.border_left_width.0.to_f64_px();
    if top_w <= 0.0
        || (top_w - right_w).abs() > 0.01
        || (top_w - bottom_w).abs() > 0.01
        || (top_w - left_w).abs() > 0.01
    {
        return None;
    }

    let style = border.border_top_style;
    if style.none_or_hidden()
        || border.border_right_style != style
        || border.border_bottom_style != style
        || border.border_left_style != style
    {
        return None;
    }

    let top_color = border.border_top_color.resolve_to_absolute(current_color);
    let right_color = border.border_right_color.resolve_to_absolute(current_color);
    let bottom_color = border
        .border_bottom_color
        .resolve_to_absolute(current_color);
    let left_color = border.border_left_color.resolve_to_absolute(current_color);
    let color = absolute_color_to_srgb(top_color)?;
    if absolute_color_to_srgb(right_color) != Some(color)
        || absolute_color_to_srgb(bottom_color) != Some(color)
        || absolute_color_to_srgb(left_color) != Some(color)
    {
        return None;
    }

    let radii = [
        resolve_radius(&border.border_top_left_radius, width, height),
        resolve_radius(&border.border_top_right_radius, width, height),
        resolve_radius(&border.border_bottom_right_radius, width, height),
        resolve_radius(&border.border_bottom_left_radius, width, height),
    ];
    let (rx, ry) = radii[0];
    if rx <= 0.0
        || ry <= 0.0
        || radii
            .iter()
            .any(|(x, y)| (*x - rx).abs() > 0.01 || (*y - ry).abs() > 0.01)
    {
        return None;
    }

    Some(RoundedBorder {
        x: abs_x,
        y: abs_y,
        width,
        height,
        radius_x: rx.min(width / 2.0),
        radius_y: ry.min(height / 2.0),
        stroke_width: top_w,
        color,
    })
}

fn resolve_radius(
    radius: &style::values::computed::BorderCornerRadius,
    width: f64,
    height: f64,
) -> (f64, f64) {
    let resolve_w = style::values::computed::CSSPixelLength::new(width as f32);
    let resolve_h = style::values::computed::CSSPixelLength::new(height as f32);
    (
        radius.0.width.0.resolve(resolve_w).px() as f64,
        radius.0.height.0.resolve(resolve_h).px() as f64,
    )
}

struct BorderSide {
    style: style::values::specified::BorderStyle,
    width: f64,
    color: style::color::AbsoluteColor,
    rect: (f64, f64, f64, f64),
}

/// Convert Stylo absolute colors to opaque sRGB. krilla currently receives
/// solid rectangles only, so translucent CSS colors are composited over white.
fn absolute_color_to_srgb(color: style::color::AbsoluteColor) -> Option<[u8; 3]> {
    let srgb = color.to_color_space(style::color::ColorSpace::Srgb);
    let comps = srgb.raw_components();
    let alpha = comps[3].clamp(0.0, 1.0);
    if alpha <= 0.0 {
        return None;
    }

    let channel = |component: f32| -> u8 {
        let over_white = component.clamp(0.0, 1.0) * alpha + (1.0 - alpha);
        (over_white * 255.0).round().clamp(0.0, 255.0) as u8
    };

    Some([channel(comps[0]), channel(comps[1]), channel(comps[2])])
}

/// Image-source resolution state threaded through the layout walk. Holds the
/// caller's `images` map + optional `base_url`, the DOM ordinal of every `<img>`
/// (for the source locator), and records the FIRST renderable-but-unresolved
/// `<img>` in document order.
struct ImageResolve<'a> {
    images: &'a std::collections::HashMap<String, Vec<u8>>,
    base_url: Option<&'a str>,
    /// 1-based ordinal of each `<img>` among all `<img>` elements in DOM
    /// preorder ([`img_ordinals`]). The box walk visits only rendered boxes, in
    /// layout order, so it cannot count them itself.
    img_ordinal: std::collections::HashMap<NodeId, usize>,
    first_unresolved: Option<(usize, &'static str)>,
}

impl ImageResolve<'_> {
    /// Keep the unresolved `<img>` that comes first in the DOM (layout order may
    /// differ: `order`, `<thead>` laid out first).
    fn record_unresolved(&mut self, occurrence: usize, reason: &'static str) {
        if self
            .first_unresolved
            .is_none_or(|(first, _)| occurrence < first)
        {
            self.first_unresolved = Some((occurrence, reason));
        }
    }
}

/// DOM-preorder ordinal (1-based) of every `<img>` element, the same order as
/// [`count_tag_in_document`]'s total and the source locator's `<img` scan.
fn img_ordinals(base: &BaseDocument) -> std::collections::HashMap<NodeId, usize> {
    let mut ordinals = std::collections::HashMap::new();
    let mut stack = vec![base.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = base.get_node(id) else {
            continue;
        };
        if node.data.downcast_element().is_some_and(|el| {
            let local: &str = &el.name.local;
            local.eq_ignore_ascii_case("img")
        }) && !node.is_anonymous()
        {
            let next = ordinals.len() + 1;
            ordinals.insert(id, next);
        }
        stack.extend(node.children.iter().rev().copied());
    }
    ordinals
}

/// Resolve a node's `<img>` source to drawable image bytes.
///
/// Resolution order: inline `data:` URL (decoded in place) → lookup of the
/// `base_url`-normalized `src` in the caller's `images` map (format sniffed from
/// the bytes). A renderable `<img>` whose source does not resolve records an
/// unresolved marker (the `render` entry point turns the first one into a
/// rejection) and draws nothing. A non-renderable (zero or non-finite-sized) or
/// src-less `<img>` is skipped silently — it would draw nothing regardless.
fn resolve_image_runs(
    node: &blitz_dom::Node,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    state: &mut ImageResolve,
) -> Vec<ImageRun> {
    let is_img = node.data.downcast_element().is_some_and(|el| {
        // markup5ever 0.40's `LocalName` has several `AsRef` impls, so name
        // the `&str` view explicitly (same idiom as `count_tag_in_document`).
        let local: &str = &el.name.local;
        local.eq_ignore_ascii_case("img")
    });
    if !is_img {
        return Vec::new();
    }
    // The DOM ordinal the source locator expects (every <img> counts, rendered
    // or not).
    let Some(&occurrence) = state.img_ordinal.get(&node.id) else {
        return Vec::new();
    };

    if width <= 0.0 || height <= 0.0 || !width.is_finite() || !height.is_finite() {
        return Vec::new();
    }
    let Some(src) = node.attr(blitz_dom::local_name!("src")) else {
        return Vec::new();
    };
    // A missing-or-empty source has no key to resolve, so treat it the same as a
    // src-less <img>: skip silently rather than reject with an unactionable
    // "supply via images" hint (there is nothing to supply).
    if src.trim().is_empty() {
        return Vec::new();
    }

    // 1) Inline data: URL — decode in place (unchanged behavior).
    if let Some((format, data)) = parse_image_data_url(src) {
        return vec![ImageRun {
            x,
            y,
            width,
            height,
            format,
            data: std::sync::Arc::new(data),
        }];
    }
    // A `data:` URL that failed to parse (unsupported MIME, non-base64, or corrupt
    // payload) must NOT fall through to the images-map lookup — its key would be the
    // whole data URL and the "no matching images entry" hint would misdirect. Reject
    // with an actionable reason instead.
    if src.trim_start().starts_with("data:") {
        state.record_unresolved(
            occurrence,
            "unsupported or malformed data: URL — only base64-encoded PNG/JPEG/GIF/WebP are supported",
        );
        return Vec::new();
    }

    // 2) Look up the (base_url-normalized) src in the caller-provided images map.
    let key = resolve_image_key(state.base_url, src);
    let Some(bytes) = state.images.get(&key) else {
        state.record_unresolved(
            occurrence,
            "no matching `images` entry for its `src` — supply the bytes via the `images` render \
             option (optionally with `baseUrl`)",
        );
        return Vec::new();
    };
    let Some(format) = sniff_image_format(bytes) else {
        state.record_unresolved(
            occurrence,
            "the supplied bytes are not a recognized PNG/JPEG/GIF/WebP image",
        );
        return Vec::new();
    };
    vec![ImageRun {
        x,
        y,
        width,
        height,
        format,
        data: std::sync::Arc::new(bytes.clone()),
    }]
}

/// Normalize a relative `<img>` `src` into the `images` lookup key. With a
/// `base_url`, joins via WHATWG URL semantics (an absolute `src` joins to itself);
/// without one — or if the join fails — the trimmed `src` is the key verbatim. No
/// network or filesystem access occurs; this only builds a string.
fn resolve_image_key(base_url: Option<&str>, src: &str) -> String {
    let src = src.trim();
    match base_url {
        Some(base) => match url::Url::parse(base).and_then(|b| b.join(src)) {
            Ok(joined) => joined.to_string(),
            Err(_) => src.to_string(),
        },
        None => src.to_string(),
    }
}

/// Detect a raster image format from its leading magic bytes. Returns `None` for
/// bytes that are not one of the four supported formats (PNG/JPEG/GIF/WebP).
pub fn sniff_image_format(bytes: &[u8]) -> Option<ImageFormat> {
    if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) {
        return Some(ImageFormat::Png);
    }
    if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return Some(ImageFormat::Jpeg);
    }
    if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        return Some(ImageFormat::Gif);
    }
    if bytes.len() >= 12 && bytes.starts_with(b"RIFF") && &bytes[8..12] == b"WEBP" {
        return Some(ImageFormat::Webp);
    }
    None
}

fn parse_image_data_url(src: &str) -> Option<(ImageFormat, Vec<u8>)> {
    let src = src.trim();
    let data_url = src.strip_prefix("data:")?;
    let (metadata, payload) = data_url.split_once(',')?;
    let mut parts = metadata.split(';');
    let mime = parts.next()?.trim().to_ascii_lowercase();
    if !parts.any(|part| part.trim().eq_ignore_ascii_case("base64")) {
        return None;
    }
    let format = match mime.as_str() {
        "image/png" => ImageFormat::Png,
        "image/jpeg" | "image/jpg" => ImageFormat::Jpeg,
        "image/gif" => ImageFormat::Gif,
        "image/webp" => ImageFormat::Webp,
        _ => return None,
    };
    let compact_payload: String = payload
        .chars()
        .filter(|c| !c.is_ascii_whitespace())
        .collect();
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(compact_payload)
        .ok()?;
    Some((format, bytes))
}

/// Read Parley glyph runs out of an inline-root node (real glyph runs, not
/// rasterized). Mirrors `blitz-paint`'s `text.rs` access path and krilla's
/// `parley.rs` example for cluster->byte-range mapping.
///
/// `abs_x`/`abs_y` are the node's content-box origin. The line boxes start
/// `TextLayout::block_offset` below it: Blitz stores there the block-axis
/// alignment of the lines inside the content box (`align-content`, which a
/// table cell's `vertical-align: middle | bottom` maps to; blitz-dom
/// 0.3.0-beta.4 `layout/inline.rs` and stylo_taffy `table_cell_vertical_align`),
/// and its own painter draws the glyph runs at content box + `block_offset` +
/// `GlyphRun::baseline()` (blitz-paint 0.3.0-beta.4 `render.rs`
/// `draw_inline_layout`). Inline boxes (atomic inlines) already carry it in
/// their `final_layout.location`, so only the glyph runs need it here.
fn read_text_runs(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    abs_x: f64,
    abs_y: f64,
    face_cache: &mut std::collections::HashMap<u64, std::sync::Arc<Vec<u8>>>,
) -> Vec<TextRun> {
    if !node.flags.is_inline_root() {
        return Vec::new();
    }
    let element = match node.data.downcast_element() {
        Some(el) => el,
        None => return Vec::new(),
    };
    let text_layout = match element.inline_layout_data.as_ref() {
        Some(tl) => tl,
        None => return Vec::new(),
    };

    // Share this inline root's source string across all its runs (refcount
    // bump, not a byte copy per run); glyph byte-ranges index into it.
    let source = std::sync::Arc::new(text_layout.text.clone());
    let layout = &text_layout.layout;
    let line_box_top = abs_y + text_layout.block_offset as f64;
    let mut runs = Vec::new();

    for line in layout.lines() {
        let mut consumed_by_run: std::collections::HashMap<(usize, usize, usize), usize> =
            std::collections::HashMap::new();
        let line_padding_right_px = if text_align_right(node) {
            let mut paddings: Vec<f64> = line
                .items()
                .filter_map(|item| match item {
                    parley::PositionedLayoutItem::GlyphRun(gr) => {
                        Some(run_padding_right_px(base, node.id, gr.style().brush.id))
                    }
                    _ => None,
                })
                .collect();
            paddings.pop();
            paddings.into_iter().sum()
        } else {
            0.0
        };
        let mut inline_advance_adjust_px = -line_padding_right_px;
        for item in line.items() {
            let glyph_run = match item {
                parley::PositionedLayoutItem::GlyphRun(gr) => gr,
                _ => continue,
            };
            let run = glyph_run.run();
            let font = run.font();
            let font_size = run.font_size();

            // Raw font bytes for krilla. parley 0.10 exposes the face blob via
            // `font.data` (a Blob<u8>) and `font.index`. Materialize each distinct
            // face once (keyed by the Blob's process-global allocation-order id,
            // NOT a content hash) and share the Arc across runs so the emitter's
            // per-face cache hits once per face. See the FontContext-scoped
            // invariant note at `resolve_and_walk`.
            let font_data = face_cache
                .entry(font.data.id())
                .or_insert_with(|| std::sync::Arc::new(font.data.as_ref().to_vec()))
                .clone();
            let font_index = font.index;

            let style = glyph_run.style();
            let color = brush_color(base, style.brush.id);
            let padding_right_px = run_padding_right_px(base, node.id, style.brush.id);

            let glyphs = take_run_glyphs(&glyph_run, &mut consumed_by_run);
            if glyphs.is_empty() {
                continue;
            }

            runs.push(TextRun {
                text: source.clone(),
                font_data,
                font_index,
                font_size,
                origin_x: abs_x + glyph_run.offset() as f64 + inline_advance_adjust_px,
                origin_y: line_box_top + glyph_run.baseline() as f64,
                glyphs,
                color,
            });
            inline_advance_adjust_px += padding_right_px;
        }
    }

    runs
}

/// Glyph-run -> line-run cluster key: `(run index, text range start, text range end)`.
type RunClusterKey = (usize, usize, usize);

/// The glyphs of one positioned glyph run, read from its Parley run's visual
/// clusters (for the cluster -> source-byte ranges ToUnicode needs). A run split
/// into several glyph runs on one line is consumed in order: `consumed_by_run`
/// (reset per line) counts the glyphs already taken from each run. Shared by
/// [`read_text_runs`] and the debug dump capture so both read identical runs.
fn take_run_glyphs<B: parley::Brush>(
    glyph_run: &parley::GlyphRun<'_, B>,
    consumed_by_run: &mut std::collections::HashMap<RunClusterKey, usize>,
) -> Vec<Glyph> {
    let run = glyph_run.run();
    let key = {
        let range = run.text_range();
        (run.index(), range.start, range.end)
    };
    let consumed = consumed_by_run.entry(key).or_insert(0);
    let glyph_count = glyph_run.glyphs().count();
    let mut glyphs = Vec::new();
    for (g, range) in run
        .visual_clusters()
        .flat_map(|cluster| {
            let range = cluster.text_range();
            cluster.glyphs().map(move |glyph| (glyph, range.clone()))
        })
        .skip(*consumed)
        .take(glyph_count)
    {
        glyphs.push(Glyph {
            id: g.id,
            advance: g.advance,
            x_offset: g.x,
            y_offset: g.y,
            text_start: range.start,
            text_end: range.end,
        });
    }
    *consumed += glyph_count;
    glyphs
}

/// The inline padding-right compensation of one glyph run: the padding of the
/// INLINE element that styled it. A run styled by the inline root itself (text
/// directly inside the block/cell, e.g. `<td style="padding:4px">Total <b>9</b>`)
/// gets none: the root's padding is its content-box inset, already applied once
/// by the walk, and Chrome advances the following run by nothing (CONFIRMED,
/// `tests/fixtures/text-probes/whitespace.html`, td-leading-trailing).
fn run_padding_right_px(base: &BaseDocument, inline_root: NodeId, brush: NodeId) -> f64 {
    if brush == inline_root {
        0.0
    } else {
        inline_padding_right_px(base, brush)
    }
}

/// Blitz's inline layout currently exposes glyph positions without advancing
/// following glyph runs by inline `padding-right` on styled spans. The computed
/// style is still attached to the run's brush node, so compensate absolute
/// padding here until upstream starts including it in `GlyphRun::offset()`.
fn inline_padding_right_px(base: &BaseDocument, node_id: NodeId) -> f64 {
    base.get_node(node_id)
        .and_then(|n| n.primary_styles())
        .map(|styles| {
            let padding = styles.get_padding();
            match padding.padding_right.0.unpack() {
                style::values::computed::length_percentage::Unpacked::Length(len) => {
                    len.px() as f64
                }
                style::values::computed::length_percentage::Unpacked::Percentage(_) => 0.0,
                style::values::computed::length_percentage::Unpacked::Calc(_) => 0.0,
            }
        })
        .unwrap_or(0.0)
}

/// Resolve the computed text color for a styled node into sRGB bytes.
fn brush_color(base: &BaseDocument, node_id: NodeId) -> [u8; 3] {
    base.get_node(node_id)
        .and_then(|n| n.primary_styles())
        .map(|styles| {
            // Convert the computed color into sRGB and read its raw rgba
            // components (0..=1). Mirrors Blitz's own `ToColorColor` helper.
            let srgb = styles
                .clone_color()
                .to_color_space(style::color::ColorSpace::Srgb);
            let comps = srgb.raw_components();
            [
                (comps[0] * 255.0).round().clamp(0.0, 255.0) as u8,
                (comps[1] * 255.0).round().clamp(0.0, 255.0) as u8,
                (comps[2] * 255.0).round().clamp(0.0, 255.0) as u8,
            ]
        })
        .unwrap_or([0, 0, 0])
}

// ===========================================================================
// Debug layout dump capture point (fidelity tooling only — see
// `crate::debug_layout_dump` and `crate::layout_dump`).
//
// Reached ONLY through `LayoutObserver::after_walk` of a non-production observer;
// the render path passes `NoObserver`, which never calls `capture`. This is the
// whole Blitz-touching part of the dump: one read of the laid-out tree into the
// owned, Blitz-free `crate::layout_dump::RawTree`. Keying, layers, alignment and
// serialization live in `crate::layout_dump`, which imports no Blitz type.
// ===========================================================================

/// Read-only view of the laid-out Blitz document handed to
/// [`LayoutObserver::after_walk`]. The document itself stays private to this
/// module: the only thing an observer can do with it is take an owned,
/// Blitz-free copy ([`BlitzSnapshot::capture`]).
pub(crate) struct BlitzSnapshot<'a> {
    base: &'a BaseDocument,
}

impl BlitzSnapshot<'_> {
    /// Owned copy of every node reachable from the document node through DOM
    /// children, `::before`/`::after` and Blitz's `layout_children` (which hold
    /// anonymous blocks), with its layout and, for inline roots, its Parley runs
    /// read exactly as [`read_text_runs`] reads them (same iteration and skip
    /// rule, via [`take_run_glyphs`]) but WITHOUT vellora's reader compensations:
    /// raw `GlyphRun::offset()`/`baseline()` and the root's `block_offset`.
    pub(crate) fn capture(&self) -> crate::layout_dump::RawTree {
        capture_raw_tree(self.base)
    }
}

fn raw_id(id: NodeId) -> usize {
    id.as_u64() as usize
}

fn capture_raw_tree(base: &BaseDocument) -> crate::layout_dump::RawTree {
    use crate::layout_dump::{RawLayout, RawNode, RawTree};

    let document = base.root_node().id;
    let mut nodes = Vec::new();
    let mut runs = Vec::new();
    let mut seen = std::collections::HashSet::new();
    let mut stack = vec![document];
    while let Some(id) = stack.pop() {
        if !seen.insert(id) {
            continue;
        }
        let Some(node) = base.get_node(id) else {
            continue;
        };
        let layout_children: Option<Vec<NodeId>> = node
            .layout_children
            .borrow()
            .as_ref()
            .map(|c| c.iter().copied().collect());
        stack.extend(node.children.iter().copied());
        stack.extend(node.before());
        stack.extend(node.after());
        stack.extend(layout_children.iter().flatten().copied());

        let kind = if id == document {
            "document"
        } else if node.is_anonymous() {
            "anonymous"
        } else if node.is_element() {
            "element"
        } else if node.is_text_node() {
            "text"
        } else {
            "comment"
        };
        let display = node.primary_styles().map(|s| s.clone_display());
        let text_layout = node
            .flags
            .is_inline_root()
            .then(|| node.data.downcast_element())
            .flatten()
            .and_then(|el| el.inline_layout_data.as_ref());
        let layout = node_has_layout_data(node).then(|| {
            let fl = node.final_layout();
            let ul = node.unrounded_layout();
            RawLayout {
                x: fl.location.x as f64,
                y: fl.location.y as f64,
                width: fl.size.width as f64,
                height: fl.size.height as f64,
                ux: ul.location.x as f64,
                uy: ul.location.y as f64,
                uwidth: ul.size.width as f64,
                uheight: ul.size.height as f64,
                border: [
                    fl.border.top,
                    fl.border.right,
                    fl.border.bottom,
                    fl.border.left,
                ]
                .map(f64::from),
                padding: [
                    fl.padding.top,
                    fl.padding.right,
                    fl.padding.bottom,
                    fl.padding.left,
                ]
                .map(f64::from),
            }
        });
        if let Some(tl) = text_layout {
            capture_raw_runs(raw_id(id), tl, &mut runs);
        }
        nodes.push(RawNode {
            id: raw_id(id),
            kind,
            tag: if node.is_text_node() {
                None
            } else {
                node.data
                    .downcast_element()
                    .map(|el| el.name.local.to_string())
            },
            id_attr: node.attr(blitz_dom::local_name!("id")).map(str::to_string),
            class_attr: node
                .attr(blitz_dom::local_name!("class"))
                .map(str::to_string),
            parent: node.parent.map(raw_id),
            children: node.children.iter().copied().map(raw_id).collect(),
            layout_parent: node.layout_parent.get().map(raw_id),
            containing_block: node.containing_block().map(raw_id),
            layout_children: layout_children.map(|c| c.into_iter().map(raw_id).collect()),
            before: node.before().map(raw_id),
            after: node.after().map(raw_id),
            inline_root: node.flags.is_inline_root(),
            display_outside: display.map(|d| format!("{:?}", d.outside())),
            display_inside: display.map(|d| format!("{:?}", d.inside())),
            layout,
            inline_text: text_layout.map(|tl| tl.text.clone()),
            block_offset: text_layout.map_or(0.0, |tl| tl.block_offset as f64),
        });
    }
    RawTree {
        document: raw_id(document),
        root_element: raw_id(base.root_element().id),
        nodes,
        runs,
    }
}

/// One inline root's Parley runs, in [`read_text_runs`]'s order and skip rule.
fn capture_raw_runs(
    owner: usize,
    text_layout: &blitz_dom::node::TextLayout,
    out: &mut Vec<crate::layout_dump::RawRun>,
) {
    for (line_index, line) in text_layout.layout.lines().enumerate() {
        let line_metrics = line.metrics();
        let mut consumed_by_run = std::collections::HashMap::new();
        for item in line.items() {
            let parley::PositionedLayoutItem::GlyphRun(glyph_run) = item else {
                continue;
            };
            let glyphs = take_run_glyphs(&glyph_run, &mut consumed_by_run);
            if glyphs.is_empty() {
                continue;
            }
            let run = glyph_run.run();
            let metrics = run.font_metrics();
            let start = glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            out.push(crate::layout_dump::RawRun {
                owner,
                brush: raw_id(glyph_run.style().brush.id),
                line_index,
                glyph_count: glyphs.len(),
                text: text_layout.text.get(start..end).unwrap_or("").to_string(),
                font_size: run.font_size(),
                ascent: metrics.ascent,
                descent: metrics.descent,
                line_baseline: line_metrics.baseline,
                line_top: line_metrics.block_min_coord,
                line_bottom: line_metrics.block_max_coord,
                face: crate::fonts::bundled_face_name(run.font().data.as_ref())
                    .unwrap_or("custom-or-unknown"),
                offset: glyph_run.offset() as f64,
                baseline: glyph_run.baseline() as f64,
                advance: glyphs.iter().map(|g| g.advance as f64).sum(),
            });
        }
    }
}
