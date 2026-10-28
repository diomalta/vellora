//! The single internal module that touches Blitz.
//!
//! Per ARCHITECTURE.md ("isolate all Blitz contact behind a single internal
//! module so upstream API breaks touch one file") this is the ONLY place in
//! `vellora-core` that imports Blitz types. Everything above it consumes the
//! small, owned types defined here (`LaidOutDoc`, `LaidOutBox`, `TextRun`,
//! `Glyph`) and never sees a Blitz/Parley/Taffy type directly.

use base64::Engine as _;
use blitz_dom::{BaseDocument, DocumentConfig, NodeData, NodeId};
use blitz_html::DocumentHtmlParser;
use blitz_traits::shell::{ColorScheme, Viewport};
use html5ever::tendril::TendrilSink as _;
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
    /// Table cells only: Blitz's own max-content inline size of the cell's border box
    /// ([`cell_max_content_width`]), `None` for non-cells and for cells whose content it does
    /// not cover (a specified width, a nested table, a replaced or flex/grid box). Read by the
    /// auto-table column pass (`layout_normalize::normalize_auto_table_compact_columns`).
    pub max_content_width: Option<f64>,
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
    /// Whether this box is an atomic inline-level box (`inline-block`, `inline-flex`,
    /// `inline-grid`, `inline-table`): it sits in one line box of its parent and is monolithic
    /// for fragmentation (CSS Fragmentation 3 §4.1; Chrome 155 never breaks inside one). Read by
    /// pagination's oversize-fragment slicer (Phase C step 03).
    pub atomic_inline: bool,
    /// Whether the box clips its content in the block direction (`overflow-y` other than
    /// `visible`). vellora paints overflow unclipped; the oversize-fragment slicer clips the
    /// descendants of such a box to its border box so the overflow makes no pages of its own
    /// (Chrome 155: WPT css/css-page/monolithic-overflow-028, Phase C step 03).
    pub clips_overflow: bool,
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
    /// The extent of the run's line box around its baseline (CSS px): the line box spans
    /// `origin_y - line_above ..= origin_y + line_below` (Parley `LineMetrics::block_min_coord` /
    /// `block_max_coord`). Relative to the baseline so every pass that moves `origin_y` moves the
    /// line with it. Read by pagination (Phase C step 03): a line box is monolithic, a page break
    /// falls between lines, never through one (CSS Fragmentation 3 §4.1, class B break points).
    pub line_above: f64,
    pub line_below: f64,
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
    let mut doc = build_document_with(&html, ctx.font_ctx.clone(), DocumentSyntax::Html, None);
    let viewport = Viewport::new(100_000, 1000, 1.0, ColorScheme::Light);
    doc.set_viewport(viewport);
    doc.resolve(0.0);
    let base: &BaseDocument = &doc;

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
            let mut runs = read_text_runs(base, node, x, y, &mut face_cache, true);
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
    let doc = build_document(html, &[], DocumentSyntax::Html);
    find_denied_in_document(&doc, denied)
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
///
/// Past [`PARSE_DEPTH_LIMIT`] the parse stops early and the value is a lower bound (see
/// [`NestingDepth`]).
pub fn max_nesting_depth(html: &str) -> usize {
    max_nesting_depth_as(html, DocumentSyntax::Html).depth
}

/// The element nesting depth the depth gate measured.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct NestingDepth {
    pub depth: usize,
    /// `false` when the HTML parse stopped early because an element went deeper than
    /// [`PARSE_DEPTH_LIMIT`]; `depth` is then a lower bound of the depth at that point.
    pub exact: bool,
}

/// How deep the depth gate lets html5ever nest elements before it stops parsing: Blink's
/// `HTMLConstructionSite::kMaximumHTMLParserDOMTreeDepth` (512; Chromium
/// `third_party/blink/renderer/core/html/parser/html_construction_site.h`, read 2026-10-21).
///
/// Why stop at all (port step 09): html5ever 0.40.1 checks "has a `p` element in button scope"
/// for every `<div>`, `<p>`, `<section>`, … start tag by walking the whole stack of open
/// elements (`tree_builder/mod.rs` `in_scope`), so `n` nested `<div>`s cost O(n²) (CONFIRMED:
/// 25 000 → 1.3 s, 50 000 → 5.3 s through the napi addon at step 08). Blink keeps its stack
/// bounded instead: past 512 open elements it inserts new nodes as siblings
/// (`HTMLConstructionSite::Attach`), so Chrome builds a different tree for such input anyway.
/// The gate rejects anything deeper than [`crate::validation::MAX_NESTING_DEPTH`] (192), well
/// below this limit, so stopping here changes the outcome only for a document whose parse puts
/// an element deeper than 512 and whose adoption-agency or foster-parenting moves later bring
/// every element back to 192 or less: that document is rejected now.
pub(crate) const PARSE_DEPTH_LIMIT: usize = 512;

/// [`max_nesting_depth`] of the DOM `syntax` builds (the fidelity-only XHTML render,
/// [`crate::debug_render_xhtml`], measures the tree it lays out).
pub(crate) fn max_nesting_depth_as(html: &str, syntax: DocumentSyntax) -> NestingDepth {
    let doc = match syntax {
        DocumentSyntax::Html => {
            let mut doc = BaseDocument::new(document_config(crate::fonts::build_font_context(&[])));
            if let Some(depth) = parse_html_depth_bounded(&mut doc, html, PARSE_DEPTH_LIMIT) {
                return NestingDepth {
                    depth,
                    exact: false,
                };
            }
            doc
        }
        // The XML parse (fidelity tooling only) has no scope walks to bound.
        _ => build_document(html, &[], syntax),
    };
    NestingDepth {
        depth: element_depth(&doc),
        exact: true,
    }
}

/// [`parse_into`]'s HTML parse with the elements' depth followed as they are inserted: the
/// input is fed in chunks and the parse stops after the first chunk that put an element deeper
/// than `limit` (see [`PARSE_DEPTH_LIMIT`]), returning that element depth. `None`: the whole
/// document was parsed, into exactly the DOM [`parse_into`] builds (the sink only observes).
fn parse_html_depth_bounded(doc: &mut BaseDocument, html: &str, limit: usize) -> Option<usize> {
    /// Bytes per chunk: html5ever's own `read_from` reads 4 KiB at a time.
    const CHUNK: usize = 4096;
    let mut mutr = doc.mutate();
    let sink = DepthProbe {
        inner: DocumentHtmlParser::new(&mut mutr),
        depths: std::cell::RefCell::new(std::collections::HashMap::new()),
        deepest: std::cell::Cell::new(0),
    };
    let mut parser = html5ever::parse_document(sink, html_parse_opts());
    let mut start = 0;
    while start < html.len() {
        let mut end = (start + CHUNK).min(html.len());
        while !html.is_char_boundary(end) {
            end += 1;
        }
        parser.process(html5ever::tendril::StrTendril::from_slice(
            &html[start..end],
        ));
        start = end;
        // The document node is depth 0 and the root element 1, so an element's DOM nesting
        // depth (the root element's is 0) is its recorded depth minus one.
        let deepest = parser.tokenizer.sink.sink.deepest.get().saturating_sub(1);
        if deepest > limit {
            return Some(deepest);
        }
    }
    parser.finish();
    drop(mutr);
    None
}

/// A transparent `TreeSink` over blitz-html's [`DocumentHtmlParser`] that records the depth of
/// every node it inserts (the document is 0): a child is one deeper than its parent, a node
/// inserted before a sibling is as deep as that sibling. Subtrees that the tree builder moves
/// later (`reparent_children`, the adoption agency's re-appends) keep the depth they were
/// inserted at; the record is only read against [`PARSE_DEPTH_LIMIT`].
struct DepthProbe<'m, 'doc> {
    inner: DocumentHtmlParser<'m, 'doc>,
    /// Recorded depth per node (lookup only, never iterated).
    depths: std::cell::RefCell<std::collections::HashMap<NodeId, usize>>,
    /// The deepest recorded depth so far.
    deepest: std::cell::Cell<usize>,
}

impl DepthProbe<'_, '_> {
    fn depth_of(&self, id: NodeId) -> usize {
        self.depths.borrow().get(&id).copied().unwrap_or(0)
    }

    fn record(&self, id: NodeId, depth: usize) {
        self.depths.borrow_mut().insert(id, depth);
        if depth > self.deepest.get() {
            self.deepest.set(depth);
        }
    }
}

impl html5ever::tree_builder::TreeSink for DepthProbe<'_, '_> {
    type Handle = NodeId;
    type Output = ();
    type ElemName<'a>
        = <DocumentHtmlParser<'static, 'static> as html5ever::tree_builder::TreeSink>::ElemName<'a>
    where
        Self: 'a;

    fn finish(self) -> Self::Output {
        self.inner.finish()
    }
    fn parse_error(&self, msg: std::borrow::Cow<'static, str>) {
        self.inner.parse_error(msg)
    }
    fn get_document(&self) -> NodeId {
        self.inner.get_document()
    }
    fn elem_name<'a>(&'a self, target: &'a NodeId) -> Self::ElemName<'a> {
        self.inner.elem_name(target)
    }
    fn create_element(
        &self,
        name: html5ever::QualName,
        attrs: Vec<html5ever::Attribute>,
        flags: html5ever::tree_builder::ElementFlags,
    ) -> NodeId {
        self.inner.create_element(name, attrs, flags)
    }
    fn create_comment(&self, text: html5ever::tendril::StrTendril) -> NodeId {
        self.inner.create_comment(text)
    }
    fn create_pi(
        &self,
        target: html5ever::tendril::StrTendril,
        data: html5ever::tendril::StrTendril,
    ) -> NodeId {
        self.inner.create_pi(target, data)
    }
    fn append(&self, parent: &NodeId, child: html5ever::tree_builder::NodeOrText<NodeId>) {
        if let html5ever::tree_builder::NodeOrText::AppendNode(id) = &child {
            self.record(*id, self.depth_of(*parent) + 1);
        }
        self.inner.append(parent, child)
    }
    fn append_based_on_parent_node(
        &self,
        element: &NodeId,
        prev_element: &NodeId,
        child: html5ever::tree_builder::NodeOrText<NodeId>,
    ) {
        if let html5ever::tree_builder::NodeOrText::AppendNode(id) = &child {
            // Inserted before `element` or appended to `prev_element`: record the deeper.
            let depth = self
                .depth_of(*element)
                .max(self.depth_of(*prev_element) + 1);
            self.record(*id, depth);
        }
        self.inner
            .append_based_on_parent_node(element, prev_element, child)
    }
    fn append_doctype_to_document(
        &self,
        name: html5ever::tendril::StrTendril,
        public_id: html5ever::tendril::StrTendril,
        system_id: html5ever::tendril::StrTendril,
    ) {
        self.inner
            .append_doctype_to_document(name, public_id, system_id)
    }
    fn mark_script_already_started(&self, node: &NodeId) {
        self.inner.mark_script_already_started(node)
    }
    fn pop(&self, node: &NodeId) {
        self.inner.pop(node)
    }
    fn get_template_contents(&self, target: &NodeId) -> NodeId {
        let contents = self.inner.get_template_contents(target);
        self.record(contents, self.depth_of(*target) + 1);
        contents
    }
    fn same_node(&self, x: &NodeId, y: &NodeId) -> bool {
        self.inner.same_node(x, y)
    }
    fn set_quirks_mode(&self, mode: html5ever::tree_builder::QuirksMode) {
        self.inner.set_quirks_mode(mode)
    }
    fn append_before_sibling(
        &self,
        sibling: &NodeId,
        new_node: html5ever::tree_builder::NodeOrText<NodeId>,
    ) {
        if let html5ever::tree_builder::NodeOrText::AppendNode(id) = &new_node {
            self.record(*id, self.depth_of(*sibling));
        }
        self.inner.append_before_sibling(sibling, new_node)
    }
    fn add_attrs_if_missing(&self, target: &NodeId, attrs: Vec<html5ever::Attribute>) {
        self.inner.add_attrs_if_missing(target, attrs)
    }
    fn associate_with_form(
        &self,
        target: &NodeId,
        form: &NodeId,
        nodes: (&NodeId, Option<&NodeId>),
    ) {
        self.inner.associate_with_form(target, form, nodes)
    }
    fn remove_from_parent(&self, target: &NodeId) {
        self.inner.remove_from_parent(target)
    }
    fn reparent_children(&self, node: &NodeId, new_parent: &NodeId) {
        self.inner.reparent_children(node, new_parent)
    }
    fn is_mathml_annotation_xml_integration_point(&self, handle: &NodeId) -> bool {
        self.inner
            .is_mathml_annotation_xml_integration_point(handle)
    }
    fn set_current_line(&self, line_number: u64) {
        self.inner.set_current_line(line_number)
    }
    fn allow_declarative_shadow_roots(&self, intended_parent: &NodeId) -> bool {
        self.inner.allow_declarative_shadow_roots(intended_parent)
    }
    fn attach_declarative_shadow(
        &self,
        location: &NodeId,
        template: &NodeId,
        attrs: &[html5ever::Attribute],
    ) -> bool {
        self.inner
            .attach_declarative_shadow(location, template, attrs)
    }
    fn maybe_clone_an_option_into_selectedcontent(&self, option: &NodeId) {
        self.inner
            .maybe_clone_an_option_into_selectedcontent(option)
    }
}

/// Maximum element nesting depth of a parsed document (root element 0), with an explicit stack.
fn element_depth(base: &BaseDocument) -> usize {
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
fn build_document(html: &str, custom: &[Vec<u8>], syntax: DocumentSyntax) -> BaseDocument {
    build_document_with(html, crate::fonts::build_font_context(custom), syntax, None)
}

/// Which parser builds a document's DOM (port step 08).
///
/// vellora's input is an HTML string: the public API is `renderPdf(html)`, and the optional
/// Chromium engine and the fidelity references load it as `text/html`. A browser parses
/// `text/html` with the HTML parser whatever the doctype, so every document vellora renders is
/// parsed with [`DocumentSyntax::Html`]: the body, the margin-box documents and the parse-only
/// helpers.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum DocumentSyntax {
    /// html5ever's HTML tree builder (WHATWG HTML parsing), for every render.
    Html,
    /// blitz-html's XML parser (xml5ever). Reached only through the fidelity tooling's
    /// [`crate::debug_render_xhtml`]: WPT `.xht` files are served as `application/xhtml+xml`,
    /// so Chrome parses them as XML. Never on the render path.
    Xml,
    /// Tests only: blitz-html's `HtmlDocument::from_html` (content sniffing), the parser of every
    /// render up to port step 07. The tests use it to prove that an HTML-sniffed document's PDF
    /// is byte-identical to step 07's and to reproduce step 07's XHTML-doctype text loss.
    #[cfg(test)]
    BlitzSniffed,
}

/// The `ParseOpts` of blitz-html 0.3.0-beta.4's HTML branch (`src/html_sink.rs`,
/// `DocumentHtmlParser::parse_into_mutator`), copied field by field so a `<!DOCTYPE html>`
/// document gets exactly the DOM `HtmlDocument::from_html` built before this step. `quirks_mode`
/// is only the tree builder's initial mode: a doctype still makes html5ever call
/// `TreeSink::set_quirks_mode`, which blitz-html's sink stores and Blitz never reads (Stylo runs
/// in no-quirks mode, blitz-dom `stylo.rs` `quirks_mode()` and `document.rs` `Stylist::new`).
fn html_parse_opts() -> html5ever::ParseOpts {
    use html5ever::tokenizer::TokenizerOpts;
    use html5ever::tree_builder::{QuirksMode, TreeBuilderOpts};
    html5ever::ParseOpts {
        tokenizer: TokenizerOpts::default(),
        tree_builder: TreeBuilderOpts {
            exact_errors: false,
            scripting_enabled: false,
            iframe_srcdoc: false,
            drop_doctype: true,
            quirks_mode: QuirksMode::NoQuirks,
        },
    }
}

/// Parse `html` into the empty document `doc` with `syntax`'s parser.
///
/// The HTML branch is blitz-html's own, minus its content sniffing:
/// `HtmlDocument::from_html` (`DocumentHtmlParser::parse_into_mutator`) switches to xml5ever when
/// the input starts with `<?xml`, when its first line is a DOCTYPE containing `XHTML`/`xhtml`, or
/// when the root `<html>` declares `xmlns="http://www.w3.org/1999/xhtml"`. In XML `<br>` is not
/// void, so the text after it became the `<br>`'s content and was never drawn (the
/// `oss-postmark-receipt` loss, XHTML 1.0 Transitional doctype).
///
/// `html5ever` is pinned to the version blitz-html resolves (`=0.40.1`, Cargo.toml).
/// `DocumentHtmlParser` implements blitz-html's `html5ever::TreeSink`, so the
/// `parse_document(DocumentHtmlParser::new(..), ..)` call below only compiles while both crates
/// use the same html5ever (`tests/html_parse.rs` also checks `Cargo.lock`).
fn parse_into(doc: &mut BaseDocument, html: &str, syntax: DocumentSyntax) {
    let mut mutr = doc.mutate();
    match syntax {
        DocumentSyntax::Html => {
            html5ever::parse_document(DocumentHtmlParser::new(&mut mutr), html_parse_opts())
                .from_utf8()
                .read_from(&mut html.as_bytes())
                .expect("reading an in-memory byte slice cannot fail");
        }
        DocumentSyntax::Xml => DocumentHtmlParser::parse_xml_into_mutator(&mut mutr, html),
        // `HtmlDocument::from_html` is `BaseDocument::new(config)`, then this, then dropping the
        // mutator (blitz-html `html_document.rs` `parse_with`).
        #[cfg(test)]
        DocumentSyntax::BlitzSniffed => DocumentHtmlParser::parse_into_mutator(&mut mutr, html),
    }
    // Dropping the mutator flushes the parsed tree into the document (stylesheets, ids), as
    // blitz-html's `HtmlDocument::parse_with` does.
    drop(mutr);
}

/// The CSS media type every document is styled for (port step 07): vellora renders paged
/// output, so `@media print` rules apply and `@media screen` rules do not, as in Chrome's print
/// path (the optional Chromium engine's `--print-to-pdf`, the fidelity references'
/// `emulateMediaType("print")`). Reported by the layout dump.
pub(crate) const DOCUMENT_MEDIA_TYPE: &str = "print";

fn document_media_type() -> blitz_dom::MediaType {
    blitz_dom::MediaType::print()
}

/// [`build_document`] with an explicit font context (the layout path keeps a clone of it for
/// the margin boxes, [`PageContext`]).
///
/// `viewport`: the layout viewport ([`layout_viewport`]) when the document is laid out by
/// [`resolve_and_walk`], so its Stylo device is built for that viewport from the start: the
/// collapsed-border compensation styles the document ([`BaseDocument::resolve_stylist`]) before
/// `resolve`, and only `resolve` flushes a queued viewport change into the device.
fn build_document_with(
    html: &str,
    font_ctx: parley::FontContext,
    syntax: DocumentSyntax,
    viewport: Option<Viewport>,
) -> BaseDocument {
    let mut doc = BaseDocument::new(DocumentConfig {
        viewport,
        ..document_config(font_ctx)
    });
    parse_into(&mut doc, html, syntax);
    doc
}

/// The configuration of every Blitz document vellora builds.
fn document_config(font_ctx: parley::FontContext) -> DocumentConfig {
    DocumentConfig {
        base_url: Some("https://vellora.local/".to_string()),
        // Self-contained, deterministic fonts: bundled faces with system-font
        // discovery off (see `crate::fonts`). This is what removes the
        // `libfontconfig` runtime dependency and makes output machine-independent.
        font_ctx: Some(font_ctx),
        // Blitz's default is `screen`. In Servo mode Stylo reads the media type only to
        // evaluate media query lists (stylo 0.22 `media_queries/media_list.rs`), so this
        // changes which `@media` rules cascade and nothing else. Blitz builds every
        // `<style>` sheet with an empty media list, so a `<style media="…">` attribute is
        // still not evaluated.
        media_type: Some(document_media_type()),
        ..Default::default()
    }
}

/// The HTML `<table cellspacing>` and `<table cellpadding>` presentational hints, which Blitz
/// 0.3.0-beta.4 does not synthesize (blitz-dom `stylo.rs`
/// `synthesize_presentational_hints_for_legacy_attributes` maps no table attribute but
/// `width`/`height`/`align`/`bgcolor`), as a user-agent sheet with one rule per distinct
/// attribute value (<https://html.spec.whatwg.org/multipage/rendering.html#tables-2>):
///
/// - `cellspacing` maps to the pixel length property `border-spacing` of the table:
///   `table[cellspacing="<value>"] { border-spacing: <n>px }`;
/// - `cellpadding` maps to the pixel length properties `padding-*` of the table's own cells:
///   `table[cellpadding="<value>"] > thead|tbody|tfoot > tr > td|th` (and
///   `> tr >` for the XML parse, where no `tbody` is inserted) `{ padding: <n>px }`.
///
/// `<n>` comes from the HTML rules for parsing non-negative integers (Stylo's
/// `parse_unsigned_integer`, the "pixel length" mapping); a value that does not parse maps to
/// nothing, as in the spec.
///
/// Why it matters since beta.4 (port step `10-spark`): beta.4 applies `border-spacing` at the
/// table's edges as well as between cells (blitz-dom 0.3.0-beta.4 `layout/table.rs`: the
/// `style.gap` block adds the spacing to the table's padding on all four sides), where the pin
/// 2003ba5 used it only as the grid gap (its `layout/table.rs` `style.gap`). So the UA default
/// `table { border-spacing: 2px }` now insets every cell of a `cellspacing="0"` table by 2 px
/// per side and adds 2 px per row (the `oss-sparksuite-invoice` outer table: 25 words of
/// right-aligned text 3.23 pt left of Chrome). `cellpadding` replaces the UA
/// `td { padding: 1px }` of cells the author does not pad (the `oss-postmark-receipt` layout
/// tables).
///
/// Cascade level: a presentational hint sits above the UA sheet and below every author rule.
/// A UA sheet appended after Blitz's default one gives the same result for these properties: it
/// beats the default `table` / `td, th` rules (higher specificity, later in the same origin) and
/// loses to any author rule, whatever its specificity. Rules are emitted in sorted order, so the
/// sheet is a pure function of the document. `None` when no table carries either attribute.
fn table_spacing_hints_css(doc: &BaseDocument) -> Option<String> {
    use std::collections::BTreeMap;
    let (mut spacing, mut padding) = (BTreeMap::new(), BTreeMap::new());
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        if let Some(el) = node.data.downcast_element() {
            if el.name.local == blitz_dom::local_name!("table") {
                for attr in el.attrs() {
                    let into = match &*attr.name.local {
                        "cellspacing" => &mut spacing,
                        "cellpadding" => &mut padding,
                        _ => continue,
                    };
                    if let Ok(px) = style::servo::attr::parse_unsigned_integer(attr.value.chars()) {
                        into.insert(attr.value.to_string(), px);
                    }
                }
            }
        }
        stack.extend(node.children.iter().copied());
    }
    if spacing.is_empty() && padding.is_empty() {
        return None;
    }
    let mut css = String::new();
    for (value, px) in &spacing {
        css.push_str(&format!(
            "table[cellspacing=\"{}\"] {{ border-spacing: {px}px; }}\n",
            css_string_body(value)
        ));
    }
    for (value, px) in &padding {
        let t = format!("table[cellpadding=\"{}\"]", css_string_body(value));
        let selectors: Vec<String> = ["thead > ", "tbody > ", "tfoot > ", ""]
            .iter()
            .flat_map(|group| ["td", "th"].map(|cell| format!("{t} > {group}tr > {cell}")))
            .collect();
        css.push_str(&format!(
            "{} {{ padding: {px}px; }}\n",
            selectors.join(", ")
        ));
    }
    Some(css)
}

/// `value` as the body of a double-quoted CSS string: `"`, `\` and every control character are
/// written as hex escapes (CSS Syntax 3 §2.1 / §4.3.7), everything else verbatim.
fn css_string_body(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for c in value.chars() {
        if c == '"' || c == '\\' || c.is_control() {
            out.push_str(&format!("\\{:x} ", c as u32));
        } else {
            out.push(c);
        }
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Collapsed-border compensation (Phase C step 02). A WORKAROUND FOR A BLITZ BUG: delete it when
// Blitz fixes the bug (see the comment on `compensate_collapsed_borders`).
// ---------------------------------------------------------------------------------------------

/// What [`compensate_collapsed_borders`] changed in one document: the tables it re-laid out and
/// the resolved collapsed borders their cells paint. Lookup-only (never iterated, so no output
/// order depends on the maps' order; DET-1).
#[derive(Default)]
struct CollapsedBorders {
    /// Authored `border-collapse: collapse` tables whose computed style is now
    /// `separate` / `border-spacing: 0` with whole-px shares of its outer edges as borders.
    tables: std::collections::HashSet<NodeId>,
    /// The cells of those tables, with their resolved edges (physical sides).
    cells: std::collections::HashMap<NodeId, CompensatedCell>,
    /// Per compensated table, in DOM order: its cells with their grid rows `(cell, first row,
    /// end row)` (exclusive end, clamped to the grid), for [`collapsed_row_lines`].
    grids: Vec<Vec<(NodeId, usize, usize)>>,
}

/// One cell of a compensated table.
#[derive(Clone, Copy)]
struct CompensatedCell {
    resolved: crate::collapsed_borders::ResolvedCell,
    /// The top and bottom grid lines of the cell's rows, relative to its table's border box
    /// (laid out, [`collapsed_row_lines`]): where its horizontal edges are painted. Blitz does
    /// not stretch a cell with a specified `height` to its row (a Taffy grid item with a
    /// definite height), while Chrome's cell always spans its row (WPT
    /// `css-tables/height-distribution/td-different-subpixel-padding-in-same-row.html`), so the
    /// cell's own box is not the row. `None` until computed.
    lines: Option<(f64, f64)>,
}

/// The grid lines of every compensated cell's rows, from the laid-out cells: a row's top line is
/// the top of the highest cell starting in it, the last line the bottom of the lowest cell
/// ending there. Relative to the table (a cell's location is relative to its table).
fn collapsed_row_lines(doc: &BaseDocument, collapsed: &mut CollapsedBorders) {
    for grid in &collapsed.grids {
        let rows = grid.iter().map(|&(_, _, r1)| r1).max().unwrap_or(0);
        let mut tops = vec![f64::INFINITY; rows + 1];
        let mut bottom = f64::NEG_INFINITY;
        for &(id, r0, r1) in grid {
            let Some(node) = doc.get_node(id).filter(|n| node_has_layout_data(n)) else {
                continue;
            };
            let layout = node.final_layout();
            let (y, h) = (layout.location.y as f64, layout.size.height as f64);
            tops[r0] = tops[r0].min(y);
            if r1 == rows {
                bottom = bottom.max(y + h);
            }
        }
        if bottom.is_finite() {
            tops[rows] = bottom;
        }
        for &(id, r0, r1) in grid {
            let (top, end) = (tops[r0], tops[r1]);
            if let Some(cell) = collapsed.cells.get_mut(&id) {
                if top.is_finite() && end.is_finite() && end >= top {
                    cell.lines = Some((top, end));
                }
            }
        }
    }
}

/// EMULATES CHROME'S LAYOUTUNIT: Chrome lays boxes out in fixed point (1/64 CSS px) and Blitz in
/// unquantised f32, so every mm / pt / em length is a few hundredths of a px longer in Blitz and
/// the difference accumulates down a document. This is not a CSS-spec bug of Blitz (the spec does
/// not fix a precision); it is the reference browser's arithmetic, which vellora's geometry
/// targets. Remove it if Blitz starts quantising lengths itself (the canary below fails) or if
/// vellora stops targeting Chrome's geometry.
///
/// Evidence (CONFIRMED, Phase C step 03, 2026-10-27; repro set
/// `fidelity/gate/snapshots/2026-10-27/c03/layoutunit/lu-repro/`, Chrome for Testing 155.0.8059.85
/// getBoundingClientRect vs the raw Blitz 0.3.0-beta.4 tree):
/// - Blitz hands Stylo's px lengths to Taffy as they are: stylo_taffy 0.3.0-beta.4
///   `src/convert.rs` 85-93 (`length_percentage`: `length(len.px())`), 99-109 (`dimension`),
///   169 (`margin`); and line heights to Parley as they are: blitz-dom 0.3.0-beta.4
///   `src/stylo_to_parley.rs` 409-411 (`Number` -> `FontSizeRelative`, `Length` -> `Absolute`).
/// - Chrome (Chromium `layout_unit.h` / `computed_style.cc`, cited in [`crate::layout_unit`]):
///   lengths are `LayoutUnit(px)`, truncated toward zero; `line-height: <number>` is
///   `LayoutUnit(n * FromFloatRound(font-size))`, a fixed line height `FromFloatRound(px)`;
///   `border-spacing` is whole px, truncated (measured only; the Blink source was not read).
/// - Repro numbers, Chrome vs Blitz: `padding: 1mm 0` around 10 px: 17.53125 vs 17.5591;
///   `margin-bottom: -1mm`: next box at 16.234375 vs 16.2205; `height: 10.1mm` 38.171875 vs
///   38.1732; `font-size: 8.5pt; line-height: 1.35` one line 15.28125 vs 15.2930;
///   `font-size: 11.34px; line-height: 1.35` 15.3125 vs 15.3141; `border-spacing: 1.5mm` cells
///   at y 5 / 25 / 45 vs 5.67 / 21.34 / 37.01. Corpus: text-stress-ptbr `table.extrato` rows
///   (`padding: 1mm 1.5mm`, 8.5pt x 1.35, a 0.2mm = 1 px bottom border) are 23.8125 px in Chrome
///   and 23.8520 in Blitz, +0.0395 px a row = padding 0.0278 + line height 0.0117, about 1.5 px
///   by the end of a page, which put its words 1-2 px below Chrome's on pages 2-7 (the 127
///   previous-link I1 items of the c02 gate).
///
/// What is snapped, per element (and its eager pseudo-elements), on the computed style after the
/// cascade and before layout: pure-length `padding-*`, `margin-*`, `height`, `min-height`,
/// `max-height`, `top`/`right`/`bottom`/`left`, `row-gap`/`column-gap` (truncated to 1/64 px),
/// `line-height` (as above, turned into a length), `border-spacing` (whole px).
///
/// Inline sizes (`width`, `min-width`, `max-width`) are NOT snapped, although Chrome truncates
/// them too (`width: 74mm` is 279.671875 px): Chrome also measures text in LayoutUnit for line
/// breaking and Parley does not, so a narrower box alone made text that exactly fits wrap (an
/// ungated WPT run of the first version, 2026-10-27, lost 4 clean passes, all `width: <n>ch`
/// boxes holding n monospace characters: css-text `line-break-loose-hyphens-002`,
/// `text-align-match-parent-05`, `word-break-break-all-062`, `word-break-keep-all-063`).
/// Truncating a padding, margin or gap only widens the content box, so those never add a wrap.
///
/// Not modelled: percentages and `calc()` with a percentage (Chrome truncates the RESOLVED length,
/// e.g. `width: 33.333%` of 800 is 266.65625, Taffy resolves them unquantised), `text-indent`,
/// `flex-basis`, intrinsic sizes (text advances, images), `line-height: normal` (equal already:
/// 12 px for 8.5pt in both). Border widths are not touched: Stylo already snaps them to whole px
/// like Chrome (0.2mm / 0.3mm / 0.4mm -> 1, 1.5mm -> 5, 1.5px -> 1 in both).
///
/// Style sharing is kept: a computed style shared by many elements is snapped once (memo keyed by
/// the `Arc` address, holding the old `Arc` so the address cannot be reused; lookup only, never
/// iterated: DET-1). A style with nothing to snap is left as it is.
///
/// WHEN THIS GOES, DELETE: this function, `snap_computed_lengths`, `snap_lp`, `src/layout_unit.rs`
/// (and its `mod` line in `lib.rs`), its call in [`resolve_and_walk`], the canary
/// `blitz_still_lays_lengths_out_unquantised` (`src/raw_blitz_tests.rs`), which fails as soon as
/// raw Blitz lays the `padding: 1mm` repro out at Chrome's 17.53125, and the
/// `layout_unit_snapping_*` tests there.
fn snap_lengths_to_layout_unit(doc: &mut BaseDocument) {
    use style::servo_arc::Arc;
    type Memo = std::collections::HashMap<
        *const style::properties::ComputedValues,
        (
            Arc<style::properties::ComputedValues>,
            Option<Arc<style::properties::ComputedValues>>,
        ),
    >;
    let mut memo: Memo = std::collections::HashMap::new();
    let mut snapped = |old: &Arc<style::properties::ComputedValues>| {
        let entry = memo
            .entry(&**old as *const style::properties::ComputedValues)
            .or_insert_with(|| {
                let new = snap_computed_lengths(old).map(Arc::new);
                (old.clone(), new)
            });
        entry.1.clone()
    };
    let mut ids = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        ids.push(id);
        stack.extend(node.children.iter().rev().copied());
    }
    for id in ids {
        let Some(node) = doc.get_node_mut(id) else {
            continue;
        };
        let Some(data) = node.try_stylo_element_data_mut() else {
            continue;
        };
        let Some(mut element) = data.get_mut() else {
            continue;
        };
        if let Some(primary) = element.styles.primary.as_mut() {
            if let Some(new) = snapped(primary) {
                *primary = new;
            }
        }
        let pseudos: Vec<_> = element
            .styles
            .pseudos
            .as_array()
            .iter()
            .enumerate()
            .filter_map(|(i, style)| style.as_ref().map(|s| (i, s.clone())))
            .collect();
        for (i, old) in pseudos {
            if let Some(new) = snapped(&old) {
                let pseudo = style::selector_parser::PseudoElement::from_eager_index(i);
                element.styles.pseudos.set(&pseudo, new);
            }
        }
    }
}

/// BLITZ BUG COMPENSATION (blitz-dom 0.3.0-beta.4): a `::before`/`::after` with `display:
/// table-column` or `table-column-group` renders its `content`.
///
/// - Spec: CSS 2.1 §17.2.1 rule 1 ("Remove irrelevant boxes"): the children of a `table-column`
///   box are treated as `display: none`, and so are the non-column children of a
///   `table-column-group`; outside a table the column is wrapped in an anonymous table, which
///   paints nothing without cells. So such a pseudo-element shows neither its text nor its
///   background. Chrome 155 passes WPT `css/CSS2/generated-content/{after,before}-content-display-
///   {012,013}` (one "Filler text", no red).
/// - Blitz: `layout/construct.rs` 589-595 (cargo registry source of blitz-dom 0.3.0-beta.4):
///   internal table displays outside a table "are laid out as flow containers" ("Blitz does not
///   yet generate anonymous table wrapper boxes"); the pseudo's text node, created by
///   `flush_pseudo_elements` (same file, 676-735) from the style's `content`, is laid out and
///   painted. Repro `div:after { content: ". FAIL"; display: table-column-group; font-size: 2em;
///   background: red }` around "Filler text": raw Blitz lays ". FAIL" out at 32 px next to it;
///   Chrome draws nothing (the four WPT tests above, raw outcome fail, pin 2003ba5 pass).
/// - Correction, between the cascade and box construction: such an eager pseudo-element style is
///   replaced by a copy with `display: none`, so Blitz builds no box for it (equal geometry: the
///   anonymous table Chrome builds around a lone column is empty). Only pseudo-elements: a real
///   `<col>`/`<colgroup>` (or any element with those displays) is left to Blitz, which reads
///   columns inside tables for their widths (`layout/table.rs` 444-505).
///
/// WHEN BLITZ FIXES THIS, DELETE this function, its call in [`resolve_and_walk`], the canary
/// `blitz_still_renders_table_column_pseudo_content` (`src/raw_blitz_tests.rs`), which fails as
/// soon as raw Blitz stops laying the repro's ". FAIL" out, and the test
/// `table_column_pseudo_compensation_renders_nothing` there.
fn hide_table_column_pseudos(doc: &mut BaseDocument) {
    use style::values::specified::box_::DisplayInside;
    let is_column = |values: &style::properties::ComputedValues| {
        matches!(
            values.clone_display().inside(),
            DisplayInside::TableColumn | DisplayInside::TableColumnGroup
        )
    };
    let mut ids = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        ids.push(id);
        stack.extend(node.children.iter().rev().copied());
    }
    for id in ids {
        let Some(node) = doc.get_node_mut(id) else {
            continue;
        };
        let Some(data) = node.try_stylo_element_data_mut() else {
            continue;
        };
        let Some(mut element) = data.get_mut() else {
            continue;
        };
        let columns: Vec<_> = element
            .styles
            .pseudos
            .as_array()
            .iter()
            .enumerate()
            .filter_map(|(i, style)| {
                style
                    .as_ref()
                    .filter(|s| is_column(s))
                    .map(|s| (i, s.clone()))
            })
            .collect();
        for (i, old) in columns {
            let mut values = (*old).clone();
            values
                .mutate_box()
                .set_display(style::values::computed::Display::None);
            let pseudo = style::selector_parser::PseudoElement::from_eager_index(i);
            element
                .styles
                .pseudos
                .set(&pseudo, style::servo_arc::Arc::new(values));
        }
    }
}

/// `lp` truncated to 1/64 px when it is a pure length and not on a step already.
fn snap_lp(
    lp: &style::values::computed::LengthPercentage,
) -> Option<style::values::computed::LengthPercentage> {
    use style::values::computed::{Length, LengthPercentage};
    let px = f64::from(lp.to_length()?.px());
    let snapped = crate::layout_unit::truncate(px);
    (snapped != px).then(|| LengthPercentage::new_length(Length::new(snapped as f32)))
}

/// A copy of `values` with its lengths snapped ([`snap_lengths_to_layout_unit`]), or `None` when
/// nothing changes.
fn snap_computed_lengths(
    values: &style::properties::ComputedValues,
) -> Option<style::properties::ComputedValues> {
    use style::values::computed::{
        length::NonNegativeLengthPercentageOrNormal as Gap, BorderSpacing, Inset, LineHeight,
        Margin, MaxSize, NonNegativeLength, Size,
    };
    use style::values::generics::NonNegative;
    let mut out: Option<style::properties::ComputedValues> = None;
    let mut edit = |f: &mut dyn FnMut(&mut style::properties::ComputedValues)| {
        f(out.get_or_insert_with(|| values.clone()))
    };
    let nn = |lp: &NonNegative<_>| snap_lp(&lp.0).map(NonNegative);
    let size = |s: &Size| match s {
        Size::LengthPercentage(lp) => nn(lp).map(Size::LengthPercentage),
        _ => None,
    };
    let max = |s: &MaxSize| match s {
        MaxSize::LengthPercentage(lp) => nn(lp).map(MaxSize::LengthPercentage),
        _ => None,
    };
    let margin = |m: &Margin| match m {
        Margin::LengthPercentage(lp) => snap_lp(lp).map(Margin::LengthPercentage),
        _ => None,
    };
    let inset = |m: &Inset| match m {
        Inset::LengthPercentage(lp) => snap_lp(lp).map(Inset::LengthPercentage),
        _ => None,
    };
    let gap = |g: &Gap| match g {
        Gap::LengthPercentage(lp) => nn(lp).map(Gap::LengthPercentage),
        _ => None,
    };

    let padding = values.get_padding();
    let p = [
        nn(&padding.padding_top),
        nn(&padding.padding_right),
        nn(&padding.padding_bottom),
        nn(&padding.padding_left),
    ];
    if p.iter().any(Option::is_some) {
        edit(&mut |v| {
            let s = v.mutate_padding();
            if let Some(x) = p[0].clone() {
                s.set_padding_top(x);
            }
            if let Some(x) = p[1].clone() {
                s.set_padding_right(x);
            }
            if let Some(x) = p[2].clone() {
                s.set_padding_bottom(x);
            }
            if let Some(x) = p[3].clone() {
                s.set_padding_left(x);
            }
        });
    }

    let m = values.get_margin();
    let m = [
        margin(&m.margin_top),
        margin(&m.margin_right),
        margin(&m.margin_bottom),
        margin(&m.margin_left),
    ];
    if m.iter().any(Option::is_some) {
        edit(&mut |v| {
            let s = v.mutate_margin();
            if let Some(x) = m[0].clone() {
                s.set_margin_top(x);
            }
            if let Some(x) = m[1].clone() {
                s.set_margin_right(x);
            }
            if let Some(x) = m[2].clone() {
                s.set_margin_bottom(x);
            }
            if let Some(x) = m[3].clone() {
                s.set_margin_left(x);
            }
        });
    }

    let pos = values.get_position();
    // Block-axis sizes only: see "Inline sizes" in [`snap_lengths_to_layout_unit`].
    let sizes = [size(&pos.height), size(&pos.min_height)];
    let maxes = [max(&pos.max_height)];
    let insets = [
        inset(&pos.top),
        inset(&pos.right),
        inset(&pos.bottom),
        inset(&pos.left),
    ];
    let gaps = [gap(&pos.row_gap), gap(&pos.column_gap)];
    if sizes.iter().any(Option::is_some)
        || maxes.iter().any(Option::is_some)
        || insets.iter().any(Option::is_some)
        || gaps.iter().any(Option::is_some)
    {
        edit(&mut |v| {
            let s = v.mutate_position();
            if let Some(x) = sizes[0].clone() {
                s.set_height(x);
            }
            if let Some(x) = sizes[1].clone() {
                s.set_min_height(x);
            }
            if let Some(x) = maxes[0].clone() {
                s.set_max_height(x);
            }
            if let Some(x) = insets[0].clone() {
                s.set_top(x);
            }
            if let Some(x) = insets[1].clone() {
                s.set_right(x);
            }
            if let Some(x) = insets[2].clone() {
                s.set_bottom(x);
            }
            if let Some(x) = insets[3].clone() {
                s.set_left(x);
            }
            if let Some(x) = gaps[0].clone() {
                s.set_row_gap(x);
            }
            if let Some(x) = gaps[1].clone() {
                s.set_column_gap(x);
            }
        });
    }

    let spacing = values.get_inherited_table().clone_border_spacing();
    let (h, w) = (
        f64::from(spacing.0.width().0.px()),
        f64::from(spacing.0.height().0.px()),
    );
    let (sh, sw) = (
        crate::layout_unit::border_spacing(h),
        crate::layout_unit::border_spacing(w),
    );
    if sh != h || sw != w {
        let new = BorderSpacing::new(
            NonNegativeLength::new(sh as f32),
            NonNegativeLength::new(sw as f32),
        );
        edit(&mut |v| v.mutate_inherited_table().set_border_spacing(new));
    }

    let font = values.get_font();
    let line_height = match font.line_height {
        LineHeight::Number(n) => Some(crate::layout_unit::line_height_for_number(
            f64::from(font.font_size.used_size.0.px()),
            f64::from(n.0),
        )),
        LineHeight::Length(l) => {
            let px = f64::from(l.0.px());
            Some(crate::layout_unit::round(px)).filter(|s| *s != px)
        }
        LineHeight::Normal => None,
    };
    if let Some(px) = line_height {
        edit(&mut |v| {
            v.mutate_font()
                .set_line_height(LineHeight::Length(NonNegativeLength::new(px as f32)))
        });
    }
    out
}

/// COMPENSATES A BLITZ BUG: Blitz lays out `border-collapse: collapse` tables taller than
/// Chrome. Remove this compensation when Blitz fixes it.
///
/// The bug (CONFIRMED by source read and measurement, Phase C step 01, 2026-10-27): blitz-dom
/// 0.3.0-beta.4 `src/layout/table.rs`
/// - 638-642: in the collapsed model the cell's border is zeroed only on the grid-item style
///   handed to Taffy (`get_grid_child_style`, 840);
/// - 814-822: `TableTreeWrapper::compute_child_layout` sizes the cell with
///   `doc.compute_child_layout(cell)`, whose block layout reads the cell's own computed style
///   (`src/layout/mod.rs` 650-664 -> stylo_taffy 0.3.0-beta.4 `src/wrapper.rs` 319 `fn border`)
///   with its FULL borders, so each row track is content + both borders;
/// - 369-411: the collapsed border is then added again as the grid gap (taken from the FIRST
///   cell's borders only), and the table's own border is overwritten by that gap.
///
/// So every row is 2 x border-width taller than in Chrome and the error accumulates down the
/// page; a collapsed table's own border is lost; a borderless first cell drops the gutter; the
/// gutter is added on top of a specified `tr` height. Upstream `main` at `fe33b778` (checked
/// 2026-10-27, read-only) still has the same code (lines 639-642, 406, 816-824); the published
/// pin `2003ba5` has it too. Repro: `fidelity/upstream-drafts/blitz-collapsed-cell-border-measure`,
/// variant `collapse_b1` (`td { border: 1px solid; padding: 8px }`, 3 rows): Chrome 155 table
/// 112 px, cells at y 0.5 / 37.5 / 74.5, 37 tall; Blitz 0.3.0-beta.4 table 118 px, cells at
/// y 1 / 40 / 79, 38 tall.
///
/// The compensation corrects Blitz's INPUT, never the user's HTML (strict mode still passes the
/// HTML through unchanged): after the cascade and before layout it rewrites the computed style
/// of each such table into the separated model, which Blitz lays out exactly like Chrome
/// (`separate_s0_b1`: 114 px in both). The table becomes `border-collapse: separate;
/// border-spacing: 0; padding: 0` and the table and each cell get a whole-px share of each
/// resolved edge around them as their border (CSS 2.1 §17.6.2; conflict resolution, the split
/// and what is not modelled in [`crate::collapsed_borders`]). That is Chrome's collapsed row
/// pitch and content placement. [`read_visuals`] then paints each resolved edge at full width
/// over its grid line, and the table's own border not at all. Off in the raw-Blitz render ([`RawBlitz`]).
///
/// WHEN BLITZ FIXES THIS, DELETE: this function, [`CollapsedBorders`], `collapsed_table_grid`,
/// `edge_borders`, `edge_style`, `set_border_widths`, `mutate_primary_style`,
/// `TableColumnCursor`, `CompensatedCell`, `collapsed_row_lines`, `collect_table_part`,
/// `GridCollect`, the `collapsed` field of [`WalkSink`] and its uses in [`push_box`] and
/// [`read_visuals`], the `resolve_stylist` + compensation calls in [`resolve_and_walk`], the
/// module `src/collapsed_borders.rs` (and its `mod` line in `lib.rs`), the `collapsed` straddle
/// handling of `layout_normalize::adjust_visual_inline_geometry`, the canary test
/// `blitz_still_lays_collapsed_rows_out_two_borders_too_tall` (`src/raw_blitz_tests.rs`), which
/// fails as soon as raw Blitz stops producing the bug, and the `collapsed_border_compensation_*`
/// tests there. [`cell_height_as_minimum`] is called from here: if its own canary still passes
/// then, keep that correction (re-scoped to collapsed tables) rather than deleting it with this.
fn compensate_collapsed_borders(doc: &mut BaseDocument) -> CollapsedBorders {
    use style::values::specified::box_::DisplayInside;
    let mut out = CollapsedBorders::default();
    // Collapsed tables in DOM order.
    let mut tables = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        if let Some(styles) = node.primary_styles() {
            if styles.clone_display().inside() == DisplayInside::Table
                && matches!(styles.clone_border_collapse(), BorderCollapse::Collapse)
            {
                tables.push(id);
            }
        }
        stack.extend(node.children.iter().rev().copied());
    }
    for table in tables {
        let Some((grid, cell_ids, rtl)) = collapsed_table_grid(doc, table) else {
            continue;
        };
        let resolved = crate::collapsed_borders::resolve(&grid);
        if !resolved.any_border {
            continue;
        }
        // Back from the grid's logical columns to physical sides (an RTL table's first column
        // is on the right).
        let physical = |sides: [f64; 4]| {
            if rtl {
                crate::collapsed_borders::mirrored(sides)
            } else {
                sides
            }
        };
        let table_widths =
            crate::collapsed_borders::table_border_widths(physical(resolved.table_edges));
        mutate_primary_style(doc, table, |values| {
            use style::values::computed::{BorderSpacing, NonNegativeLengthPercentage};
            use style::Zero as _;
            set_border_widths(values.mutate_border(), table_widths);
            let table_style = values.mutate_inherited_table();
            table_style.set_border_collapse(BorderCollapse::Separate);
            table_style.set_border_spacing(BorderSpacing::zero());
            // CSS 2.1 §17.6.2: in the collapsing model a table has no padding.
            let padding = values.mutate_padding();
            padding.set_padding_top(NonNegativeLengthPercentage::zero());
            padding.set_padding_right(NonNegativeLengthPercentage::zero());
            padding.set_padding_bottom(NonNegativeLengthPercentage::zero());
            padding.set_padding_left(NonNegativeLengthPercentage::zero());
        });
        let mut rows = Vec::with_capacity(cell_ids.len());
        for ((cell, resolved_cell), grid_cell) in
            cell_ids.iter().zip(&resolved.cells).zip(&grid.cells)
        {
            let resolved_cell = if rtl {
                resolved_cell.mirrored()
            } else {
                *resolved_cell
            };
            let widths = resolved_cell.border_widths();
            mutate_primary_style(doc, *cell, |values| {
                set_border_widths(values.mutate_border(), widths);
                cell_height_as_minimum(values);
            });
            out.cells.insert(
                *cell,
                CompensatedCell {
                    resolved: resolved_cell,
                    lines: None,
                },
            );
            let r0 = grid_cell.row.min(grid.rows);
            let r1 = (grid_cell.row + grid_cell.rowspan.max(1)).min(grid.rows);
            rows.push((*cell, r0, r1.max(r0)));
        }
        out.grids.push(rows);
        out.tables.insert(table);
    }
    out
}

/// COMPENSATES A SECOND BLITZ BUG, in the cells of the tables [`compensate_collapsed_borders`]
/// re-lays out: Blitz gives a table cell's specified `height` as a FIXED size, where it is the
/// cell's minimum (CSS 2.1 §17.5.3: the row is as tall as its tallest cell's content; Chrome
/// grows the cell). Remove this when Blitz fixes it.
///
/// The bug (CONFIRMED, Phase C step 02, 2026-10-27): blitz-dom 0.3.0-beta.4
/// `src/layout/table.rs` `collect_table_cells` resets the grid-item style's `size.width` to
/// `auto` (728) but keeps `size.height` (722-728), so Taffy sizes the cell to it and the
/// overflowing content is ignored by the row. Upstream `main` `fe33b778` (read-only, 2026-10-27)
/// has the same code (723-729). Repro (`* { box-sizing: border-box }`, `td { height: 30px;
/// padding: 2px }`, a 3-line cell at `line-height: 20px`): Chrome 155 row and table 64 px,
/// Blitz 0.3.0-beta.4 30 px. In the corpus: the danfe `tr.cabecalho td { height: 3.92cm }`
/// header (Chrome cell 150.625 px, Blitz 148.16 px), which lifted everything below it by
/// 2.47 px once the 2 px text raise that hid it was retired.
///
/// The correction moves a length `height` into `min-height` (the larger of the two) and sets
/// `height: auto`, so Taffy grows the cell with its content and still honours the height as a
/// minimum. Scope: only the cells of compensated (collapsed, bordered) tables; whether the
/// separated model needs it too is UNVERIFIED (the same Blitz code path, not measured here).
/// Percentage heights are left as they are.
///
/// WHEN BLITZ FIXES THIS, DELETE this function, its call in [`compensate_collapsed_borders`]
/// and the canary `blitz_still_fixes_a_cell_to_its_specified_height` (`src/raw_blitz_tests.rs`).
fn cell_height_as_minimum(values: &mut style::properties::ComputedValues) {
    use style::values::generics::length::Size;
    let length_px = |size: &style::values::computed::Size| match size {
        Size::LengthPercentage(lp) => lp.0.to_length().map(|l| l.px()),
        _ => None,
    };
    let height = values.get_position().clone_height();
    let Some(height_px) = length_px(&height) else {
        return;
    };
    let min = values.get_position().clone_min_height();
    let keep_min = match &min {
        Size::Auto => false,
        other => length_px(other).is_none_or(|m| m >= height_px),
    };
    let position = values.mutate_position();
    if !keep_min {
        position.set_min_height(height);
    }
    position.set_height(Size::Auto);
}

/// `[top, right, bottom, left]` border widths (CSS px) on a computed border struct, as solid
/// borders (Stylo/Taffy give a `none` side no width; the style is otherwise only read by
/// vellora's painter, which paints compensated tables from the resolved edges instead).
fn set_border_widths(border: &mut style::properties::style_structs::Border, px: [f64; 4]) {
    use style::values::computed::{Au, BorderSideWidth};
    use style::values::specified::BorderStyle;
    let side = |w: f64| {
        let style = if w > 0.0 {
            BorderStyle::Solid
        } else {
            BorderStyle::None
        };
        (BorderSideWidth(Au::from_f64_px(w)), style)
    };
    let (w, s) = side(px[0]);
    border.set_border_top_width(w);
    border.set_border_top_style(s);
    let (w, s) = side(px[1]);
    border.set_border_right_width(w);
    border.set_border_right_style(s);
    let (w, s) = side(px[2]);
    border.set_border_bottom_width(w);
    border.set_border_bottom_style(s);
    let (w, s) = side(px[3]);
    border.set_border_left_width(w);
    border.set_border_left_style(s);
}

/// Replace `id`'s primary computed style by a modified copy. The copy is a new `Arc`: Stylo
/// shares computed styles between elements (style sharing), so the shared one is never touched.
fn mutate_primary_style(
    doc: &mut BaseDocument,
    id: NodeId,
    f: impl FnOnce(&mut style::properties::ComputedValues),
) {
    let Some(node) = doc.get_node_mut(id) else {
        return;
    };
    let Some(data) = node.try_stylo_element_data_mut() else {
        return;
    };
    let Some(mut element) = data.get_mut() else {
        return;
    };
    let Some(primary) = element.styles.primary.as_mut() else {
        return;
    };
    let mut values = (**primary).clone();
    f(&mut values);
    *primary = style::servo_arc::Arc::new(values);
}

/// A computed border style as a [`crate::collapsed_borders::EdgeStyle`].
fn edge_style(style: style::values::specified::BorderStyle) -> crate::collapsed_borders::EdgeStyle {
    use crate::collapsed_borders::EdgeStyle as E;
    use style::values::specified::BorderStyle as B;
    match style {
        B::Hidden => E::Hidden,
        B::None => E::None,
        B::Inset => E::Inset,
        B::Groove => E::Groove,
        B::Outset => E::Outset,
        B::Ridge => E::Ridge,
        B::Dotted => E::Dotted,
        B::Dashed => E::Dashed,
        B::Solid => E::Solid,
        B::Double => E::Double,
    }
}

/// The four computed borders `[top, right, bottom, left]` of a styled element.
fn edge_borders(
    styles: &style::properties::ComputedValues,
) -> [crate::collapsed_borders::EdgeBorder; 4] {
    use style::values::computed::{Au, Color};
    let border = styles.get_border();
    let current = styles.clone_color();
    let side = |width: Au, style, color: &Color| crate::collapsed_borders::EdgeBorder {
        width: width.to_f64_px(),
        style: edge_style(style),
        color: absolute_color_to_srgb(color.resolve_to_absolute(&current)),
    };
    [
        side(
            border.border_top_width.0,
            border.border_top_style,
            &border.border_top_color,
        ),
        side(
            border.border_right_width.0,
            border.border_right_style,
            &border.border_right_color,
        ),
        side(
            border.border_bottom_width.0,
            border.border_bottom_style,
            &border.border_bottom_color,
        ),
        side(
            border.border_left_width.0,
            border.border_left_style,
            &border.border_left_color,
        ),
    ]
}

/// Column placement of cells as Blitz 0.3.0-beta.4 does it (`layout/table.rs` `ColumnCursor`:
/// dense auto-placement skipping columns still held by a rowspan from an earlier row).
#[derive(Default)]
struct TableColumnCursor {
    col: usize,
    num_columns: usize,
    rowspans: Vec<usize>,
}

impl TableColumnCursor {
    fn start_row(&mut self) {
        self.col = 0;
        for remaining in self.rowspans.iter_mut() {
            *remaining = remaining.saturating_sub(1);
        }
    }

    fn next_free(&mut self) -> usize {
        while self.rowspans.get(self.col).is_some_and(|r| *r > 0) {
            self.col += 1;
        }
        self.col
    }

    fn place(&mut self, colspan: usize, rowspan: usize) {
        let end = self.col + colspan;
        if self.rowspans.len() < end {
            self.rowspans.resize(end, 0);
        }
        for remaining in &mut self.rowspans[self.col..end] {
            *remaining = rowspan - 1;
        }
        self.col = end;
        self.num_columns = self.num_columns.max(end);
    }
}

/// The parts of a collapsed table, gathered by [`collapsed_table_grid`].
struct GridCollect {
    rows: Vec<[crate::collapsed_borders::EdgeBorder; 4]>,
    groups: Vec<crate::collapsed_borders::GridRowGroup>,
    cells: Vec<crate::collapsed_borders::GridCell>,
    ids: Vec<NodeId>,
    cursor: TableColumnCursor,
}

/// One DOM part of a collapsed table into `state` (Blitz's `collect_table_cells` structure).
/// `None` for a structure outside that model (a cell outside any row).
fn collect_table_part(doc: &BaseDocument, id: NodeId, state: &mut GridCollect) -> Option<()> {
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    let node = doc.get_node(id)?;
    if !node.is_element() {
        return Some(());
    }
    let Some(styles) = node.primary_styles() else {
        return Some(());
    };
    let display = styles.clone_display();
    if display.outside() == DisplayOutside::None
        || styles.clone_position().is_absolutely_positioned()
    {
        return Some(());
    }
    match display.inside() {
        DisplayInside::TableRowGroup
        | DisplayInside::TableHeaderGroup
        | DisplayInside::TableFooterGroup
        | DisplayInside::Contents => {
            let first_row = state.rows.len();
            for &child in &node.children {
                collect_table_part(doc, child, state)?;
            }
            if display.inside() != DisplayInside::Contents && state.rows.len() > first_row {
                state.groups.push(crate::collapsed_borders::GridRowGroup {
                    first_row,
                    end_row: state.rows.len(),
                    sides: edge_borders(&styles),
                });
            }
        }
        DisplayInside::TableRow => {
            state.rows.push(edge_borders(&styles));
            state.cursor.start_row();
            for &child in &node.children {
                collect_table_part(doc, child, state)?;
            }
        }
        DisplayInside::TableCell => {
            let row = state.rows.len().checked_sub(1)?;
            let colspan = node
                .attr(blitz_dom::local_name!("colspan"))
                .and_then(|v| v.parse::<u16>().ok())
                .unwrap_or(1)
                .max(1) as usize;
            let rowspan = node
                .attr(blitz_dom::local_name!("rowspan"))
                .and_then(|v| v.parse::<u16>().ok())
                .map(|v| v.clamp(1, 65534))
                .unwrap_or(1) as usize;
            let col = state.cursor.next_free();
            state.cursor.place(colspan, rowspan);
            state.cells.push(crate::collapsed_borders::GridCell {
                row,
                col,
                rowspan,
                colspan,
                sides: edge_borders(&styles),
            });
            state.ids.push(id);
        }
        _ => {}
    }
    Some(())
}

/// The grid of a collapsed table as Blitz 0.3.0-beta.4 builds it (`layout/table.rs`
/// `build_table_context` / `collect_table_cells`: header groups first, footer groups last,
/// `display: none` and absolutely positioned parts skipped, `display: contents` transparent),
/// with the computed borders of the table, its row groups, rows and cells, plus the cells'
/// node ids in grid order. `None` (the table is left as Blitz lays it out) for a structure
/// outside that model: a cell outside any row, or no cell at all.
fn collapsed_table_grid(
    doc: &BaseDocument,
    table: NodeId,
) -> Option<(crate::collapsed_borders::TableGrid, Vec<NodeId>, bool)> {
    use style::computed_values::direction::T as Direction;
    use style::values::specified::box_::DisplayInside;
    let node = doc.get_node(table)?;
    let table_styles = node.primary_styles()?.clone();
    let rtl = matches!(table_styles.clone_direction(), Direction::Rtl);
    let table_sides = edge_borders(&table_styles);
    let group_order = |id: NodeId| -> u8 {
        match doc
            .get_node(id)
            .and_then(|n| n.primary_styles().map(|s| s.clone_display().inside()))
        {
            Some(DisplayInside::TableHeaderGroup) => 0,
            Some(DisplayInside::TableFooterGroup) => 2,
            _ => 1,
        }
    };
    let mut state = GridCollect {
        rows: Vec::new(),
        groups: Vec::new(),
        cells: Vec::new(),
        ids: Vec::new(),
        cursor: TableColumnCursor::default(),
    };
    for order in 0..3 {
        for &child in &node.children {
            if group_order(child) == order {
                collect_table_part(doc, child, &mut state)?;
            }
        }
    }
    if state.cells.is_empty() {
        return None;
    }
    // The grid is resolved in logical columns (the first column is the start one, CSS 2.1
    // §17.6.2.1's "further to the left (ltr) / right (rtl)" tie-break): an RTL table's
    // physical left and right sides are swapped into it, and back by the caller.
    let logical = |sides: [crate::collapsed_borders::EdgeBorder; 4]| {
        if rtl {
            crate::collapsed_borders::mirrored(sides)
        } else {
            sides
        }
    };
    let mut grid = crate::collapsed_borders::TableGrid {
        rows: state.rows.len(),
        cols: state.cursor.num_columns,
        table: logical(table_sides),
        row_borders: state.rows.into_iter().map(logical).collect(),
        groups: state.groups,
        cells: state.cells,
    };
    for group in &mut grid.groups {
        group.sides = logical(group.sides);
    }
    for cell in &mut grid.cells {
        cell.sides = logical(cell.sides);
    }
    Some((grid, state.ids, rtl))
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
    let doc = build_document_with(
        html,
        font_ctx.clone(),
        DocumentSyntax::Html,
        Some(layout_viewport(A4_WIDTH_PX, A4_HEIGHT_PX).0),
    );
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
        DocumentSyntax::Html,
        &mut NoObserver,
    )
}

/// [`validate_then_lay_out`] with a [`LayoutObserver`] hooked onto each layout
/// stage and the parser chosen by `syntax`. The render path passes
/// [`DocumentSyntax::Html`] and [`NoObserver`] (every hook is a no-op that
/// monomorphizes away); only the debug layout dump passes a real observer, and
/// only the fidelity-only XHTML render passes [`DocumentSyntax::Xml`].
#[allow(clippy::too_many_arguments)]
pub(crate) fn validate_then_lay_out_observed<O: LayoutObserver>(
    html: &str,
    denied: &[&str],
    content_width_px: f64,
    content_height_px: f64,
    images: &std::collections::HashMap<String, Vec<u8>>,
    base_url: Option<&str>,
    fonts: &[Vec<u8>],
    syntax: DocumentSyntax,
    observer: &mut O,
) -> Result<LaidOutDoc, DeniedElement> {
    let breaks = crate::break_css::parse_break_rules(html);
    let font_ctx = crate::fonts::build_font_context(fonts);
    let doc = build_document_with(
        html,
        font_ctx.clone(),
        syntax,
        Some(layout_viewport(content_width_px, content_height_px).0),
    );
    // Validate and lay out the same Blitz parse: one tree shared by validation
    // and layout.
    if let Some(found) = find_denied_in_document(&doc, denied) {
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
    /// Whether this layout runs vellora's own corrections on top of Blitz's layout: the reader
    /// compensations of the box walk ([`run_padding_right_px`]) and the
    /// [`LAYOUT_NORMALIZE_PASSES`]. `true` for every observer but [`RawBlitz`], the fidelity-only
    /// raw-Blitz render ([`crate::debug_render_raw_blitz`]). A constant, so the render path
    /// ([`NoObserver`]) compiles to exactly the code it had before the flag existed.
    const VELLORA_CORRECTIONS: bool = true;
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

/// Fidelity tooling ONLY ([`crate::debug_render_raw_blitz`], the WPT harness's `--raw` mode):
/// observes nothing and turns vellora's corrections off ([`LayoutObserver::VELLORA_CORRECTIONS`]),
/// so the walked boxes are Blitz's layout read the way Blitz's own painter places it (the
/// `B0`-equivalent of a render). Never on the render path.
pub(crate) struct RawBlitz;

impl LayoutObserver for RawBlitz {
    const VELLORA_CORRECTIONS: bool = false;
}

/// The layout viewport of a document flowing into a `content_width_px` x `content_height_px`
/// @page content box, and its size in whole px.
fn layout_viewport(content_width_px: f64, content_height_px: f64) -> (Viewport, (u32, u32)) {
    let viewport_px = (content_width_px as u32, content_height_px.max(0.0) as u32);
    (
        Viewport::new(viewport_px.0, viewport_px.1, 1.0, ColorScheme::Light),
        viewport_px,
    )
}

/// Resolve style+layout on a parsed document and read it into a `LaidOutDoc`.
///
/// `content_width_px` is the @page CONTENT width (page width minus left/right
/// margins) — the box the document flows into. Laying out against the full page
/// width instead would make `width:100%` boxes overflow once pagination offsets
/// them by the left margin (the clipped-last-column bug). `font_ctx` is a clone of
/// the context `doc` was built with, kept for the margin boxes ([`PageContext`]).
#[allow(clippy::too_many_arguments)]
fn resolve_and_walk<O: LayoutObserver>(
    mut doc: BaseDocument,
    content_width_px: f64,
    content_height_px: f64,
    images: &std::collections::HashMap<String, Vec<u8>>,
    base_url: Option<&str>,
    breaks: &crate::break_css::BreakRules,
    font_ctx: parley::FontContext,
    observer: &mut O,
) -> LaidOutDoc {
    let (viewport, viewport_px) = layout_viewport(content_width_px, content_height_px);
    // The document was built with this viewport (`build_document_with`), so no device change
    // is queued here; kept so a document built otherwise still lays out against it.
    doc.set_viewport(viewport);
    // Off in the raw-Blitz render: it is a vellora layer, not Blitz's layout.
    if O::VELLORA_CORRECTIONS {
        if let Some(css) = table_spacing_hints_css(&doc) {
            doc.add_user_agent_stylesheet(blitz_dom::UserAgentStylesheet::parse(&css));
        }
    }
    // The collapsed-border compensation (a Blitz bug workaround, see
    // `compensate_collapsed_borders`) edits computed styles between the cascade and layout:
    // style the document, edit, then `resolve` (whose own style pass then has nothing to
    // restyle) lays it out. Off in the raw-Blitz render.
    // Before it, Chrome's LayoutUnit quantisation of computed lengths (`snap_lengths_to_layout_unit`,
    // so `cell_height_as_minimum` copies a snapped height). Both off in the raw-Blitz render.
    let mut collapsed = if O::VELLORA_CORRECTIONS {
        doc.resolve_stylist(0.0);
        snap_lengths_to_layout_unit(&mut doc);
        hide_table_column_pseudos(&mut doc);
        compensate_collapsed_borders(&mut doc)
    } else {
        CollapsedBorders::default()
    };
    doc.resolve(0.0);
    collapsed_row_lines(&doc, &mut collapsed);

    // The break rules inside `@media` blocks apply when Stylo's evaluation of those blocks, on
    // the device that just styled the document, matches (port step 09).
    let (avoid_inside, page_before) = {
        let device = doc.stylist_device();
        breaks.applicable(|query| media_query_matches(device, query))
    };
    let base: &BaseDocument = &doc;
    let break_targets = BreakTargets {
        avoid_inside: matched_nodes(base, &avoid_inside),
        page_before: matched_nodes(base, &page_before),
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
            reader_compensations: O::VELLORA_CORRECTIONS,
            collapsed: &collapsed,
        };
        walk_box(base, root_id, 0, &mut sink);
    }
    observer.after_walk(&BlitzSnapshot { base }, &boxes, viewport_px);
    // Post-layout corrections, in `LAYOUT_NORMALIZE_PASSES` order (none in the raw-Blitz render).
    if O::VELLORA_CORRECTIONS {
        for &(name, pass) in LAYOUT_NORMALIZE_PASSES {
            pass(&mut boxes);
            observer.after_pass(name, &boxes);
        }
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
    /// Whether the text reader applies its compensations ([`run_padding_right_px`]); `false`
    /// only in the raw-Blitz render ([`RawBlitz`]).
    reader_compensations: bool,
    /// The tables and cells [`compensate_collapsed_borders`] re-laid out (empty in the
    /// raw-Blitz render).
    collapsed: &'a CollapsedBorders,
}

/// Node ids matched by the stylesheet's fragmentation rules
/// (see [`crate::break_css`]).
struct BreakTargets {
    avoid_inside: std::collections::HashSet<NodeId>,
    page_before: std::collections::HashSet<NodeId>,
}

/// Resolve each selector list with Stylo's selector matching. A selector Stylo
/// cannot parse matches nothing, exactly as the browser drops that rule.
fn matched_nodes(base: &BaseDocument, selectors: &[&str]) -> std::collections::HashSet<NodeId> {
    selectors
        .iter()
        .filter_map(|selector| base.query_selector_all(selector).ok())
        .flatten()
        .collect()
}

/// Whether the media query list `query` (an `@media` prelude) matches `device`, parsed and
/// evaluated by Stylo exactly as its cascade does for an `@media` rule: `MediaList::parse`
/// (an invalid query becomes `not all`) and `MediaList::evaluate` (media type, then the media
/// features against the device's viewport, no-quirks mode, no `@custom-media`). Pass the
/// document's own device (`BaseDocument::stylist_device`) so a break rule follows the very
/// evaluation that decided the style rules next to it.
fn media_query_matches(device: &style::device::Device, query: &str) -> bool {
    use style::context::QuirksMode;
    use style::stylesheets::{CssRuleType, CustomMediaEvaluator, Origin, UrlExtraData};

    // A media query list holds no URLs, so any base URL will do (as blitz-dom's own
    // `parse_transform_matrix` does).
    let url = url::Url::parse("about:blank").expect("about:blank is a valid URL");
    let url_data = UrlExtraData::from(url);
    let mut context = style::parser::ParserContext::new(
        Origin::Author,
        &url_data,
        Some(CssRuleType::Media),
        style_traits::ParsingMode::DEFAULT,
        QuirksMode::NoQuirks,
        Default::default(),
        None,
        None,
        Default::default(),
    );
    let mut input = cssparser::Parser::new(query);
    let list = style::media_queries::MediaList::parse(&mut context, &mut input);
    list.evaluate(
        device,
        QuirksMode::NoQuirks,
        &mut CustomMediaEvaluator::none(),
    )
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
    let text_runs = read_text_runs(
        base,
        node,
        content_x,
        content_y,
        sink.face_cache,
        sink.reader_compensations,
    );
    let (visual_rects, rounded_borders) = read_visuals(node, abs_x, abs_y, sink.collapsed);
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
        max_content_width: cell_max_content_width(node, base),
        table_layout_fixed: table_layout_fixed(node),
        // The authored value: a compensated table computes `separate` now.
        table_border_collapse: table_border_collapse(node)
            || sink.collapsed.tables.contains(&node_id),
        text_align: inline_align(node),
        colspan: colspan(node),
        break_inside_avoid: inline_breaks.avoid_inside
            || sink.breaks.avoid_inside.contains(&node_id),
        break_before_page: inline_breaks.page_before || sink.breaks.page_before.contains(&node_id),
        atomic_inline: atomic_inline(node),
        clips_overflow: node.primary_styles().is_some_and(|styles| {
            styles.clone_overflow_y() != style::values::computed::Overflow::Visible
        }),
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

/// The max-content inline size of a table cell's border box, measured the way Blitz measures
/// it when it sizes the table's column tracks (blitz-dom 0.3.0-beta.4 `layout/inline.rs`
/// 496-508: an inline root's max-content is Parley's `calculate_content_widths().max` plus its
/// padding and border; a block container's is the largest in-flow child contribution, the
/// child's max-content plus its horizontal margins, plus its own padding and border). `None`
/// for non-cells and for any content this does not model, so the column pass leaves that
/// table alone: a specified (non-`auto`) width anywhere in the cell, a nested table, a
/// replaced element, a flex or grid container, a float or an out-of-flow box.
fn cell_max_content_width(node: &blitz_dom::Node, base: &BaseDocument) -> Option<f64> {
    let display = node.primary_styles()?.clone_display();
    if display.inside() != style::values::specified::box_::DisplayInside::TableCell {
        return None;
    }
    block_max_content_width(base, node, 0)
}

fn block_max_content_width(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    depth: usize,
) -> Option<f64> {
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    // The cell's own subtree only; a deep tree is not a cell this pass needs.
    if depth > 32 || !node_has_layout_data(node) {
        return None;
    }
    let styles = node.primary_styles()?;
    let position = styles.get_position();
    if !position.clone_width().is_auto() {
        return None;
    }
    let display = styles.clone_display();
    // Blitz's anonymous block boxes carry their inline content's style (`display: inline`)
    // but are block boxes.
    if depth > 0
        && !node.is_anonymous()
        && (display.outside() != DisplayOutside::Block
            || !matches!(
                display.inside(),
                DisplayInside::Flow | DisplayInside::FlowRoot
            ))
    {
        return None;
    }
    if !matches!(styles.clone_float(), style::computed_values::float::T::None)
        || !matches!(
            styles.clone_position(),
            style::computed_values::position::T::Static
                | style::computed_values::position::T::Relative
        )
    {
        return None;
    }
    drop(styles);
    let layout = node.final_layout();
    let frame =
        (layout.padding.left + layout.padding.right + layout.border.left + layout.border.right)
            as f64;
    if node.flags.is_inline_root() {
        let text = node.data.downcast_element()?.inline_layout_data.as_ref()?;
        // Inline boxes (inline-block, images) size by their own algorithm: not modelled.
        if text.layout.inline_boxes().next().is_some() {
            return None;
        }
        return Some(f64::from(text.layout.calculate_content_widths().max) + frame);
    }
    let children: Vec<NodeId> = node
        .layout_children
        .borrow()
        .as_ref()
        .map(|c| c.iter().copied().collect())
        .unwrap_or_default();
    let mut widest = 0.0_f64;
    for child in children {
        let child = base.get_node(child)?;
        let contribution = block_max_content_width(base, child, depth + 1)?;
        let margin = child.final_layout().margin;
        widest = widest.max(contribution + (margin.left + margin.right) as f64);
    }
    Some(widest + frame)
}

fn table_layout_fixed(node: &blitz_dom::Node) -> bool {
    node.primary_styles()
        .is_some_and(|styles| matches!(styles.clone_table_layout(), TableLayout::Fixed))
}

/// Whether `node` computes an atomic inline-level display: `display-outside: inline` with an
/// inner display other than `flow` (`inline-block` is inline + flow-root, `inline-flex`,
/// `inline-grid`, `inline-table`). A plain `inline` element generates no box of its own here.
fn atomic_inline(node: &blitz_dom::Node) -> bool {
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    node.primary_styles().is_some_and(|styles| {
        let display = styles.clone_display();
        display.outside() == DisplayOutside::Inline && display.inside() != DisplayInside::Flow
    })
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
    collapsed: &CollapsedBorders,
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

    // A table of the collapsed-border compensation paints no border of its own (its outer
    // edges are resolved into its cells' edges); its cells paint their resolved edges, full
    // width, centred on the grid lines (`compensate_collapsed_borders`). `border-radius` does
    // not apply in the collapsing model.
    if collapsed.tables.contains(&node.id) {
        return (rects, rounded_borders);
    }
    if let Some(cell) = collapsed.cells.get(&node.id) {
        // The cell's rows, not its own box (see `CompensatedCell::lines`).
        let (top, height) = cell.lines.map_or((abs_y, height), |(top, bottom)| {
            let table_y = abs_y - layout.location.y as f64;
            (table_y + top, bottom - top)
        });
        for (x, y, width, height, color) in cell.resolved.paint_rects(abs_x, top, width, height) {
            rects.push(VisualRect {
                x,
                y,
                width,
                height,
                color,
            });
        }
        return (rects, rounded_borders);
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
///
/// `compensate` applies the inline padding-right compensation ([`run_padding_right_px`]), which
/// Blitz's painter does not do; it is `false` only in the raw-Blitz render ([`RawBlitz`]).
fn read_text_runs(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    abs_x: f64,
    abs_y: f64,
    face_cache: &mut std::collections::HashMap<u64, std::sync::Arc<Vec<u8>>>,
    compensate: bool,
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
    // A right-aligned line keeps its right edge, so the runs before an inline's padding-right
    // move left by it instead of the runs after it moving right. The side is the physical one
    // Parley aligned the line to: `start`/`end` resolved against `direction` ([`inline_align`],
    // port step 09; before it `end` always counted as right and `start` never did, so rtl text
    // was off by the padding, Chrome 155 `tests/text_probes.rs`).
    let right_aligned = inline_align(node) == InlineAlign::Right;
    let padding_right = |brush: NodeId| {
        if compensate {
            run_padding_right_px(base, node.id, brush)
        } else {
            0.0
        }
    };

    for line in layout.lines() {
        let line_metrics = line.metrics();
        let mut consumed_by_run: std::collections::HashMap<(usize, usize, usize), usize> =
            std::collections::HashMap::new();
        let line_padding_right_px = if right_aligned {
            let mut paddings: Vec<f64> = line
                .items()
                .filter_map(|item| match item {
                    parley::PositionedLayoutItem::GlyphRun(gr) => {
                        Some(padding_right(gr.style().brush.id))
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
            let padding_right_px = padding_right(style.brush.id);

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
                line_above: (glyph_run.baseline() - line_metrics.block_min_coord).max(0.0) as f64,
                line_below: (line_metrics.block_max_coord - glyph_run.baseline()).max(0.0) as f64,
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn documents_are_styled_for_print_media() {
        // Both the document's media type and the Stylo device that evaluates `@media` rules
        // (blitz-dom 0.3.0-beta.4 `make_device`) carry the configured type.
        let mut doc = build_document("<p>x</p>", &[], DocumentSyntax::Html);
        let base: &mut BaseDocument = &mut doc;
        assert_eq!(*base.media_type(), blitz_dom::MediaType::print());
        assert_eq!(
            base.stylist_device().media_type(),
            blitz_dom::MediaType::print()
        );
        assert_eq!(document_media_type(), blitz_dom::MediaType::print());
        assert_eq!(DOCUMENT_MEDIA_TYPE, "print");
    }

    /// The DOM as nested lines: node kind, element namespace + name + attributes, text.
    fn dom_lines(base: &BaseDocument) -> Vec<String> {
        let mut out = Vec::new();
        let mut stack = vec![(base.root_node().id, 0usize)];
        while let Some((id, depth)) = stack.pop() {
            let node = base.get_node(id).expect("node");
            let line = match &node.data {
                NodeData::Document(_) => "#document".to_string(),
                NodeData::Element(el) => {
                    let attrs: Vec<String> = el
                        .attrs()
                        .iter()
                        .map(|a| format!("{}={:?}", a.name.local, a.value))
                        .collect();
                    format!("<{}:{} {}>", el.name.ns, el.name.local, attrs.join(" "))
                }
                NodeData::Text(t) => format!("#text {:?}", t.content),
                NodeData::Comment { contents } => format!("#comment {contents:?}"),
                NodeData::AnonymousBlock(_) => "#anonymous".to_string(),
            };
            out.push(format!("{}{line}", "  ".repeat(depth)));
            for child in node.children.iter().rev() {
                stack.push((*child, depth + 1));
            }
        }
        out
    }

    const HTML_SNIFFED: &[&str] = &[
        "<!DOCTYPE html><html><head><style>p { margin: 0 }</style></head>\
         <body><p>a<br>b</p><table><tr><td>x</td></tr></table></body></html>",
        "<p>no doctype<br/>at all</p><div/>still in the div",
        "<!DOCTYPE html>\n<html xmlns=\"http://www.w3.org/1999/xhtml\"><body><br>tail</body></html>",
        "<!doctype html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\"><p>lowercase doctype</p>",
        "  <html xmlns=\"http://example.com/other\"><p>other namespace</p></html>",
    ];

    #[test]
    fn html_parse_builds_blitz_htmls_dom_for_every_document_it_sniffed_as_html() {
        // Port step 08 replaced `HtmlDocument::from_html` by html5ever with the same sink and
        // ParseOpts. For every input blitz-html's sniff sent to its HTML branch the DOM is
        // identical, so (same DocumentConfig, deterministic pipeline) the PDF is too.
        for html in HTML_SNIFFED {
            let new = build_document(html, &[], DocumentSyntax::Html);
            let old = build_document(html, &[], DocumentSyntax::BlitzSniffed);
            assert_eq!(dom_lines(&new), dom_lines(&old), "{html}");
        }
    }

    /// Documents the depth-bounded parse must build exactly like [`parse_into`]: multi-chunk
    /// input (a multibyte character across the 4 KiB chunk boundary), misnested formatting
    /// (adoption agency), foster-parented table text, templates and nesting near the limit.
    fn bounded_parse_samples() -> Vec<String> {
        let mut docs: Vec<String> = HTML_SNIFFED.iter().map(|s| s.to_string()).collect();
        docs.push(format!(
            "<!DOCTYPE html><p>{}é{}</p><div>{}</div>",
            "a".repeat(4095 - "<!DOCTYPE html><p>".len()),
            "ç".repeat(3000),
            "<span>x</span>".repeat(700)
        ));
        docs.push(
            "<b><i><div><p>aaa</b>bbb</i>ccc</p></div><table>stray<tr><td>x</td></tr>t</table>"
                .to_string(),
        );
        docs.push(
            "<template><div><p>in template</p></div></template><select><option>o</option></select>"
                .to_string(),
        );
        // Element depth = body (1) + the nest; the open tags of one repeat nest `per` deep.
        for (open, close, per) in [
            ("<div>", "</div>", 1),
            ("<span>", "</span>", 1),
            ("<p>", "", 1),
            ("<b><div>", "", 2),
        ] {
            for depth in [1, 191, 192, 193, 300, 511] {
                let n = depth / per;
                docs.push(format!(
                    "<!DOCTYPE html><body>{}x{}",
                    open.repeat(n),
                    close.repeat(n)
                ));
            }
        }
        docs
    }

    #[test]
    fn the_depth_bounded_parse_builds_the_same_dom_when_it_runs_to_the_end() {
        for html in bounded_parse_samples() {
            let mut bounded =
                BaseDocument::new(document_config(crate::fonts::build_font_context(&[])));
            assert_eq!(
                parse_html_depth_bounded(&mut bounded, &html, PARSE_DEPTH_LIMIT),
                None
            );
            let full = build_document(&html, &[], DocumentSyntax::Html);
            assert_eq!(
                dom_lines(&bounded),
                dom_lines(&full),
                "{}",
                &html[..html.len().min(200)]
            );
        }
    }

    #[test]
    fn the_depth_gate_is_exact_below_the_parse_limit_and_stops_past_it() {
        for html in bounded_parse_samples() {
            let full = element_depth(&build_document(&html, &[], DocumentSyntax::Html));
            assert!(full <= PARSE_DEPTH_LIMIT, "{full}");
            assert_eq!(
                max_nesting_depth_as(&html, DocumentSyntax::Html),
                NestingDepth {
                    depth: full,
                    exact: true
                },
                "{}",
                &html[..html.len().min(200)]
            );
        }
        for depth in [513, 600, 20_000] {
            let html = format!("<!DOCTYPE html><body>{}x", "<div>".repeat(depth));
            let measured = max_nesting_depth_as(&html, DocumentSyntax::Html);
            assert!(!measured.exact, "{depth}: {measured:?}");
            assert!(
                measured.depth > PARSE_DEPTH_LIMIT && measured.depth <= depth + 2,
                "{depth}: {measured:?}"
            );
        }
    }

    #[test]
    fn xhtml_doctype_br_is_void_under_the_html_parse() {
        // blitz-html's sniff parsed this as XML: the `<br>` swallowed "tail" (port step 05/07
        // `oss-postmark-receipt` loss). The HTML parse makes `<br>` void, as Chrome's text/html
        // parse does.
        let html = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \
                    \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n\
                    <html xmlns=\"http://www.w3.org/1999/xhtml\"><body><p>head<br>tail</p></body></html>";
        let new = dom_lines(&build_document(html, &[], DocumentSyntax::Html));
        let old = dom_lines(&build_document(html, &[], DocumentSyntax::BlitzSniffed));
        let br_line = |lines: &[String]| lines.iter().position(|l| l.contains(":br ")).unwrap();
        let depth = |l: &str| l.len() - l.trim_start().len();
        let (nb, ob) = (br_line(&new), br_line(&old));
        // HTML: "tail" is the br's next sibling; XML: it is the br's child.
        assert_eq!(depth(&new[nb + 1]), depth(&new[nb]), "{new:#?}");
        assert!(new[nb + 1].contains("\"tail\""), "{new:#?}");
        assert_eq!(depth(&old[ob + 1]), depth(&old[ob]) + 2, "{old:#?}");
        assert!(old[ob + 1].contains("\"tail\""), "{old:#?}");
    }

    /// The document mode html5ever's tree builder picks for `html` (it reports it through
    /// `TreeSink::set_quirks_mode`, which blitz-html's sink stores in `quirks_mode`).
    fn html5ever_quirks_mode(html: &str) -> html5ever::tree_builder::QuirksMode {
        let mut doc = BaseDocument::new(document_config(crate::fonts::build_font_context(&[])));
        let mut mutr = doc.mutate();
        let mut parser =
            html5ever::parse_document(DocumentHtmlParser::new(&mut mutr), html_parse_opts());
        parser.process(html5ever::tendril::StrTendril::from_slice(html));
        let mode = parser.tokenizer.sink.sink.quirks_mode.get();
        parser.finish();
        mode
    }

    #[test]
    fn html5ever_picks_chromes_document_mode_and_blitz_ignores_it() {
        use html5ever::tree_builder::QuirksMode;
        // Chrome 155 (fidelity/baselines/port/08-html-parse/attachments/chrome-probes-html-parse.json):
        // document.compatMode CSS1Compat for <!DOCTYPE html>, XHTML 1.0 Strict and XHTML 1.0
        // Transitional (limited-quirks reports CSS1Compat), BackCompat without a doctype.
        let t = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \
                 \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"><p>x</p>";
        let s = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \
                 \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\"><p>x</p>";
        assert_eq!(
            html5ever_quirks_mode("<!DOCTYPE html><p>x</p>"),
            QuirksMode::NoQuirks
        );
        assert_eq!(html5ever_quirks_mode(s), QuirksMode::NoQuirks);
        assert_eq!(html5ever_quirks_mode(t), QuirksMode::LimitedQuirks);
        assert_eq!(
            html5ever_quirks_mode("<html xmlns=\"http://www.w3.org/1999/xhtml\"><p>x</p></html>"),
            QuirksMode::Quirks
        );
        assert_eq!(
            html5ever_quirks_mode("<?xml version=\"1.0\"?>\n<html><p>x</p></html>"),
            QuirksMode::Quirks
        );
        // GAP (port step 08 finding): Blitz never reads that mode. blitz-dom 0.3.0-beta.4 builds
        // its Stylist with `QuirksMode::NoQuirks` (document.rs) and its `TDocument::quirks_mode`
        // returns `NoQuirks` (stylo.rs), so a limited-quirks or quirks document is styled and
        // laid out in no-quirks mode (see tests/html_parse.rs, the image-only line).
        let doc = build_document(t, &[], DocumentSyntax::Html);
        let root = doc.root_node();
        assert_eq!(
            style::dom::TDocument::quirks_mode(&root),
            style::context::QuirksMode::NoQuirks
        );
    }
}
