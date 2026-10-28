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
    /// applies before this element; also set on the box that follows one with a forced break
    /// after it ([`crate::break_css::resolve_break_after`], Phase C step 04).
    pub break_before_page: bool,
    /// A forced page break (`break-after: page`, `page-break-after: always`) applies after this
    /// element (or after its last child, propagated). Read only by
    /// [`crate::break_css::resolve_break_after`], which moves it onto the next box.
    pub break_after_page: bool,
    /// A forced column break (`break-before: column`) applies before this element; also set on
    /// the box after one with `break-after: column`
    /// ([`crate::break_css::resolve_column_break_after`]). Read only by the multi-column layout
    /// ([`crate::multicol`], Phase C step 05): outside a multi-column container it has no effect.
    pub break_before_column: bool,
    /// `break-after: column` applies after this element (moved onto the next box, see
    /// [`LaidOutBox::break_before_column`]).
    pub break_after_column: bool,
    /// `break-before: avoid` / `break-after: avoid` (or `avoid-column`) applies to this element.
    /// Read only by the column breaks of [`crate::multicol`] (Phase C step 05).
    pub break_before_avoid: bool,
    pub break_after_avoid: bool,
    /// Whether the box is absolutely positioned (`position: absolute | fixed`): out of the
    /// normal flow, so it takes no forced break from the box before it
    /// ([`crate::break_css::resolve_break_after`]).
    pub out_of_flow: bool,
    /// Whether the box is floated (`float` other than `none`).
    pub floated: bool,
    /// The `writing-mode` the element declares (`Some(true)` vertical, `Some(false)`
    /// horizontal, `None` when nothing declares it; read by vellora, see
    /// [`crate::break_css::BreakRules::writing_modes`]). A box whose writing mode is orthogonal
    /// to its parent's is monolithic for named-page breaks
    /// ([`crate::break_css::resolve_named_page_breaks`]).
    pub writing_mode_vertical: Option<bool>,
    /// The page name the element declares (`page: <custom-ident>`, CSS Page 3 §4.1); `None`
    /// for `page: auto` and when nothing declares it. Read by
    /// [`crate::break_css::resolve_named_page_breaks`] (Phase C step 04).
    pub page_name: Option<String>,
    /// Whether this box is an atomic inline-level box (`inline-block`, `inline-flex`,
    /// `inline-grid`, `inline-table`): it sits in one line box of its parent and is monolithic
    /// for fragmentation (CSS Fragmentation 3 §4.1; Chrome 155 never breaks inside one). Read by
    /// pagination's oversize-fragment slicer (Phase C step 03).
    pub atomic_inline: bool,
    /// For an atomic inline: the top and bottom of the line box it sits on, relative to its own
    /// border-box top (`y`), so they move with the box. A line box is monolithic (CSS
    /// Fragmentation 3 §4.1): the column breaks of [`crate::multicol`] keep it whole (Phase C
    /// step 06: a ruby line holds two atomic inlines, the annotation above the base, which no
    /// break may part; Chrome 155, WPT css/css-break/ruby-003).
    pub line_span: Option<(f64, f64)>,
    /// Whether the box has size containment (`contain: size`, `strict`): monolithic for the
    /// column breaks of [`crate::multicol`] (Phase C step 05).
    pub contain_size: bool,
    /// The box's `orphans` and `widows` (inherited; `None`: the initial value, 2). Set only on
    /// the boxes of a multi-column container ([`crate::multicol`], Phase C step 05), the only
    /// reader; the page slicer keeps 2.
    pub orphans: Option<u32>,
    pub widows: Option<u32>,
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
    /// The CSS painting-order layer of the box that paints it ([`paint_tier`]).
    pub tier: u8,
    /// [`paint_stack`]: in [`PAINT_TIER_POSITIONED`], the tree order of the positioned box it
    /// paints with (`0` outside that tier).
    pub stack: u32,
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
    /// An inline `<svg>` element's content ([`ImageRun::svg`]); `data` holds the serialized
    /// source it was parsed from ([`inline_svg_source`]).
    Svg,
}

/// An image in document coordinates: a raster `<img>`, or an inline `<svg>` drawn as vectors.
#[derive(Debug, Clone)]
pub struct ImageRun {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub format: ImageFormat,
    pub data: std::sync::Arc<Vec<u8>>,
    /// [`ImageFormat::Svg`] only: the parsed SVG ([`crate::svg::parse`]), sized to this run's
    /// box (the serialized root carries `width`/`height` equal to it).
    pub svg: Option<std::sync::Arc<usvg::Tree>>,
    /// The painting-order layer and positioned-box order of the box it is the content of
    /// ([`paint_tier`], [`paint_stack`]): the emitter draws an image over the rects of its own
    /// layer (and, in the positioned layer, of the positioned boxes before it in tree order) and
    /// under the later ones (`pdf::emit`).
    pub tier: u8,
    pub stack: u32,
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
    /// The `text-decoration` lines painted with this run ([`run_decorations`]), relative to its
    /// origin so every pass that moves the run moves them.
    pub decorations: Vec<TextDecoration>,
}

/// One `text-decoration` line of a [`TextRun`] (Phase C step 04, [`crate::text_decoration`]):
/// a filled rect at `origin_x + x .. + width`, `origin_y + top .. + height` (CSS px).
#[derive(Debug, Clone, PartialEq)]
pub struct TextDecoration {
    pub x: f64,
    pub width: f64,
    pub top: f64,
    pub height: f64,
    /// sRGB color (r,g,b) 0..=255: the decorating box's `text-decoration-color`.
    pub color: [u8; 3],
    /// A line-through, painted over the glyphs; underlines and overlines go under them.
    pub over_text: bool,
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
    /// The canvas background ([`canvas_background`]): the root element's background colour,
    /// else the HTML `<body>`'s (CSS Backgrounds 3 §2.11.2). Pagination fills every page's page
    /// area with it; the element it came from paints no background of its own.
    pub canvas_background: Option<[u8; 3]>,
    /// Whether the root element generates a box. A `display: none` root prints blank pages:
    /// no canvas and no `@page` background either (Chrome 155, WPT
    /// css/css-page/root-element-display-none-print.html, `@page { background: hotpink }`).
    pub root_rendered: bool,
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
    // Defence in depth for the SVG image-source gate (`find_external_svg_image`): the margin
    // text is escaped and the `@page` declarations come from a `<style>` element's raw text,
    // which cannot hold `</style`, so no element can be injected here; if one ever were, Blitz's
    // `resolve` below must not parse an SVG that reads a host file.
    if find_external_svg_image(&doc).is_some() {
        return requests.iter().map(|_| None).collect();
    }
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
            let (x, y) = box_origin(base, id, &mut origins, true);
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
    /// The element's tag as the source spells it, lowercased: `"img"`, or `"image"` /
    /// `"feimage"` for an inline SVG's image source ([`find_external_svg_image`]).
    pub tag: &'static str,
    /// 1-based ordinal of this element among all elements of `tag` in document order.
    pub occurrence: usize,
    /// Total `<img>` count in the parsed DOM (locator degrades to `None` on a
    /// source/DOM count mismatch, exactly like [`DeniedElement::dom_total`]).
    pub dom_total: usize,
    /// Why resolution failed (folded into the diagnostic hint).
    pub reason: &'static str,
}

/// Why the gate on the parsed document refused it, before Blitz built any box.
pub enum GateRejection {
    /// An element outside the subset (`element:<tag>`).
    Element(DeniedElement),
    /// An inline SVG image source that is not a `data:` URL ([`find_external_svg_image`],
    /// `image:unresolved`).
    Image(UnresolvedImage),
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

/// One computed-style edit of [`float_avoidance_fixups`].
#[derive(Debug, Clone, Copy, PartialEq)]
enum FloatFixup {
    /// `clear` for a block-level formatting-context root laid out beside a float it does not
    /// fit beside.
    Clear(style::computed_values::clear::T),
    /// The new `margin-top` (px) of a float placed over its own no-wrap line.
    MarginTop(f32),
}

/// An absolute (document px) rectangle `[x0, y0, x1, y1]`.
type AbsRect = [f64; 4];

fn overlap(a: AbsRect, b: AbsRect) -> bool {
    a[2].min(b[2]) - a[0].max(b[0]) > OVERLAP_EPSILON_PX
        && a[3].min(b[3]) - a[1].max(b[1]) > OVERLAP_EPSILON_PX
}

/// Overlaps up to this much are rounding, not a misplaced box.
const OVERLAP_EPSILON_PX: f64 = 0.5;

/// The style edits that move two kinds of box out of a float the way Chrome 155 does, read off a
/// laid-out document. Each compensates a bug of the crates.io Blitz 0.3.0-beta.4 stack; the
/// raw-Blitz canaries `blitz_still_overlaps_a_wide_table_with_a_float` and
/// `blitz_still_places_a_float_over_its_nowrap_line` (`raw_blitz_tests.rs`) fail when it is
/// fixed, and then the corresponding half of this function, its [`FloatFixup`] variant and the
/// canary are deleted (both gone: also the second `resolve` in [`resolve_and_walk`]).
///
/// 1. A block-level box that establishes an independent formatting context (a table, a
///    `flow-root`, a flex or grid container, a block with non-visible `overflow`) must not overlap
///    the margin box of a float of its formatting context; one that does not fit beside the float
///    moves down (CSS 2.2 §9.5). TAFFY BUG (taffy 0.15.0 `src/compute/block.rs` 1297-1309): the
///    fit loop tests the box's specified `width` or, for `width: auto`, the slot's own
///    `stretch_width`, which always fits, so the first slot beside the float is taken whatever
///    the box's laid-out width. Repro (WPT css/CSS2/floats/floats-wrap-bfc-003-left-table.xht): a
///    300 px table cell holding a 100x100 left float and a table whose content is a 250 px
///    inline-block: Taffy puts the inner table at x = 100 beside the float (its 250 px overflow
///    the cell by 50 px) and the cell is 100 px tall; Chrome puts it below the float, y = 100,
///    cell 150 px tall. Detected: the box's border box leaves the band its containing block's
///    content box keeps free of the floats of its formatting context beside it. Edit: `clear`
///    toward the side(s) of those floats. Inexact when
///    Chrome would find room beside a later, narrower float on that side (it takes the first slot
///    that fits; `clear` goes below all of them); no WPT test or fixture measured here does that.
/// 2. A float may not overlap the inline content of the line box it is placed beside; one that
///    does not fit beside the content before it goes below that line (CSS 2.2 §9.5.1 rules 6-8).
///    BLITZ BUG (blitz-dom 0.3.0-beta.4 `src/layout/inline.rs` 722-765): the float is placed at
///    the current line's top (`min_y = state.line_y()`, 749) in a slot that only avoids other
///    floats, whatever Parley has already put on that line. Repro (WPT
///    css/CSS2/floats/float-nowrap-1.html): a 10ch `white-space: nowrap` div with the 35ch text
///    `Some text that overflows my parent.` and then a 5ch right float: Blitz puts the float at
///    the line's top (y = 0 in the div), over the text; Chrome puts it below the line (y = 15).
///    Edit: `margin-top` grown by the distance to the line's bottom, which lays the float's border
///    box exactly there. Only for inline roots with `text-wrap-mode: nowrap` (`white-space:
///    nowrap | pre`), or lines that end their paragraph (or at a forced break) and have no wrap
///    opportunity after the float (Phase C step 07: an unbreakable word or a `nowrap` span after
///    it, WPT css/CSS2/text/white-space-processing-048.xht and css/CSS2/floats/float-nowrap-3.html,
///    whose references [`trailing_float_wraps`] lays out), and only when the float's margin box
///    overlaps a glyph run that precedes the float on its line. That is Chrome 155's rule: the float stays on the line when the
///    content before it plus its margin box fit in the line's free width, whatever follows it.
///    Measured in Chrome for Testing 155.0.8059.85 (2026-10-28, 10ch nowrap div, ch 9.633 px):
///    `Some <float 5ch>text that overflows my parent.` (WPT float-nowrap-8) keeps the float at
///    y = 0; `S<float 5ch>ome text…` (float-nowrap-7) y = 0; a 30ch line `Hello world <float
///    5ch>and more text that overflows the box by far` y = 0; `Somex<float 6ch> text` y = 20
///    (below); a float that starts its line stays (float-nowrap-1-notref.html), even a 12ch one
///    wider than the line. Collapsible spaces before the float do not count (`Some <float 6ch>`
///    stays: 4ch + 6ch fit), preserved ones do (`white-space: pre`, and `&nbsp;`: below). In
///    Blitz's layout of `Some <float>text` the glyph runs are `Some` and ` text` (the collapsed
///    space after the float's inline box), so the runs before the float already leave that
///    space out (measured on the same repros). Gecko's rule tests every glyph run of
///    the unbreakable line (float-nowrap-1..8 encode it), so vellora fails float-nowrap-7 and -8
///    exactly as Chrome 155 does. The grown margin also narrows that line for the content after
///    the float, which changes nothing on a line that cannot wrap after the float but would
///    re-break one that can (Chrome does not narrow it), so those lines keep Blitz's placement. Not handled
///    (same before and after this rule): a LEFT float that does not fit. Blitz shifts the whole
///    line, the text before the float included, right of the float at the line's top, so no run
///    overlaps it; Chrome 155 puts it below the line with the text at x = 0 (`Some text
///    <left float 5ch>that…` in 10ch: float y = 20). A left float that fits matches Chrome
///    (float at (0, 0), text from x = 5ch).
fn float_avoidance_fixups(base: &BaseDocument) -> Vec<(NodeId, FloatFixup)> {
    let mut geometry = FloatGeometry::default();
    let root = base.root_element().id;
    collect_float_geometry(base, root, root, 0, &mut geometry);
    let mut fixups = Vec::new();
    for root in &geometry.bfc_roots {
        let rect = root.border_rect;
        // The floats of its formatting context beside its top edge, and the band they leave it
        // in its containing block. A side without such a float keeps the containing block's
        // edge, moved out by a negative margin on that side (which lets the border box out of
        // the containing block, as in Taffy's own fit test). Floats that start lower are not
        // this bug: Taffy keeps the box in the slot at its top whatever its height (WPT
        // css/CSS2/floats/new-fc-relayout.html), and `clear` would move it below them, so they
        // are left alone.
        let (mut left, mut right) = (false, false);
        let mut band_x0 = root.container[0] + root.margin_x[0].min(0.0);
        let mut band_x1 = root.container[1] - root.margin_x[1].min(0.0);
        let beside = |f: &&FloatBox| {
            f.bfc == root.bfc
                && f.margin_rect[1] <= rect[1] + OVERLAP_EPSILON_PX
                && rect[1] + OVERLAP_EPSILON_PX < f.margin_rect[3]
        };
        for float in geometry.floats.iter().filter(beside) {
            if float.left {
                left = true;
                band_x0 = band_x0.max(float.margin_rect[2]);
            } else {
                right = true;
                band_x1 = band_x1.min(float.margin_rect[0]);
            }
        }
        if rect[0] >= band_x0 - OVERLAP_EPSILON_PX && rect[2] <= band_x1 + OVERLAP_EPSILON_PX {
            continue;
        }
        use style::computed_values::clear::T as Clear;
        let clear = match (left, right) {
            (true, true) => Clear::Both,
            (true, false) => Clear::Left,
            (false, true) => Clear::Right,
            (false, false) => continue,
        };
        fixups.push((root.id, FloatFixup::Clear(clear)));
    }
    for float in &geometry.floats {
        let Some(lines) = float.lines.as_ref() else {
            continue;
        };
        let top = float.margin_rect[1];
        let float_id = float.id.as_u64();
        let Some((line, at)) = lines.iter().find_map(|line| {
            let at = line.boxes.iter().find(|b| b.1 == float_id)?.0;
            Some((line, at))
        }) else {
            continue;
        };
        // Chrome's rule: only the glyph runs before the float on its line count. A float that
        // starts its line has none and keeps its place; text after the float may run under it.
        let line_rect = |run: &LineRun| [run.x0, line.top, run.x1, line.bottom];
        // On a line that can wrap, only when nothing after the float can: no wrap opportunity
        // in the runs after it, and the line ends its paragraph or at a forced break, so the
        // edit cannot re-break the line (WPT css/CSS2/text/white-space-processing-048.xht,
        // css/CSS2/floats/float-nowrap-3.html: a right float inside an inline, before the rest
        // of an unbreakable word or of a `nowrap` span; Chrome 155 puts it below the line).
        let unbreakable_after = float.root_nowrap
            || (line.ends_paragraph && !line.runs.iter().any(|run| run.at > at && run.breakable));
        if unbreakable_after
            && line
                .runs
                .iter()
                .filter(|run| run.at < at)
                .map(line_rect)
                .any(|run| overlap(run, float.margin_rect))
        {
            let grown = float.margin_top + (line.bottom - top);
            fixups.push((float.id, FloatFixup::MarginTop(grown as f32)));
        }
    }
    fixups
}

/// What [`float_avoidance_fixups`] reads off the laid-out tree.
#[derive(Default)]
struct FloatGeometry {
    floats: Vec<FloatBox>,
    bfc_roots: Vec<BfcRootBox>,
    /// The [`box_origin`] memo.
    origins: std::collections::HashMap<NodeId, (f64, f64)>,
}

/// An in-flow block-level box that establishes an independent formatting context.
struct BfcRootBox {
    id: NodeId,
    /// The root of the block formatting context the box is laid out in.
    bfc: NodeId,
    border_rect: AbsRect,
    /// `[x0, x1]` of its containing block's content box.
    container: [f64; 2],
    /// Its left and right margins.
    margin_x: [f64; 2],
}

struct FloatBox {
    id: NodeId,
    /// The root of the block formatting context the float is placed in.
    bfc: NodeId,
    left: bool,
    margin_rect: AbsRect,
    margin_top: f64,
    /// The lines of the float's inline root (`None` for a float that is not laid out by one).
    lines: Option<Vec<LineGeometry>>,
    /// Whether that inline root cannot wrap (`text-wrap-mode: nowrap`).
    root_nowrap: bool,
}

/// A glyph run of a [`LineGeometry`].
struct LineRun {
    /// Its item index on the line.
    at: usize,
    x0: f64,
    x1: f64,
    /// It has a soft wrap opportunity before its last non-white-space character: collapsible
    /// or preserved-breakable white space in a run whose `text-wrap-mode` is `wrap`.
    breakable: bool,
}

struct LineGeometry {
    top: f64,
    bottom: f64,
    /// Each glyph run on the line.
    runs: Vec<LineRun>,
    /// The line ends its paragraph (the inline content, or a forced break).
    ends_paragraph: bool,
    /// `(item index, node id)` of each inline box (atomic inline, float, out-of-flow box).
    boxes: Vec<(usize, u64)>,
}

fn collect_float_geometry(
    base: &BaseDocument,
    id: NodeId,
    bfc: NodeId,
    depth: usize,
    geometry: &mut FloatGeometry,
) {
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    // The DOM depth is gated before layout (SEC-1); this bounds the walk the same way.
    if depth > 4096 {
        return;
    }
    let Some(node) = base.get_node(id) else {
        return;
    };
    let parent_inside = node.primary_styles().map(|s| s.clone_display().inside());
    let content_x_range = if node_has_layout_data(node) {
        let (x, _) = box_origin(base, id, &mut geometry.origins, false);
        let l = node.final_layout();
        let x0 = x + (l.border.left + l.padding.left) as f64;
        let x1 = x + (l.size.width - l.border.right - l.padding.right) as f64;
        [x0, x1.max(x0)]
    } else {
        [f64::NEG_INFINITY, f64::INFINITY]
    };
    let children: Vec<NodeId> = node
        .layout_children
        .borrow()
        .as_ref()
        .map(|c| c.iter().copied().collect())
        .unwrap_or_default();
    for child_id in children {
        let Some(child) = base.get_node(child_id).filter(|n| node_has_layout_data(n)) else {
            continue;
        };
        let Some(styles) = child.primary_styles() else {
            collect_float_geometry(base, child_id, bfc, depth + 1, geometry);
            continue;
        };
        let display = styles.clone_display();
        let floated = !matches!(styles.clone_float(), style::computed_values::float::T::None);
        let out_of_flow = styles.clone_position().is_absolutely_positioned();
        let overflow_clips = !matches!(
            styles.clone_overflow_y(),
            style::values::computed::Overflow::Visible | style::values::computed::Overflow::Clip
        );
        let inside = display.inside();
        let establishes_bfc = floated
            || out_of_flow
            || (inside != DisplayInside::Flow && !child.is_anonymous())
            || overflow_clips
            || matches!(
                parent_inside,
                Some(DisplayInside::Flex | DisplayInside::Grid)
            );
        let (x, y) = box_origin(base, child_id, &mut geometry.origins, false);
        let layout = child.final_layout();
        let (w, h) = (layout.size.width as f64, layout.size.height as f64);
        if floated && !out_of_flow {
            let m = layout.margin;
            let left = matches!(styles.clone_float(), style::computed_values::float::T::Left);
            let nowrap = node.flags.is_inline_root()
                && node.primary_styles().is_some_and(|s| {
                    s.clone_text_wrap_mode() == style::computed_values::text_wrap_mode::T::Nowrap
                });
            geometry.floats.push(FloatBox {
                id: child_id,
                bfc,
                left,
                margin_rect: [
                    x - m.left as f64,
                    y - m.top as f64,
                    x + w + m.right as f64,
                    y + h + m.bottom as f64,
                ],
                margin_top: m.top as f64,
                lines: node
                    .flags
                    .is_inline_root()
                    .then(|| inline_root_lines(base, node, &mut geometry.origins))
                    .flatten(),
                root_nowrap: nowrap,
            });
        } else if !out_of_flow
            && display.outside() == DisplayOutside::Block
            && !child.is_anonymous()
            && (inside != DisplayInside::Flow || overflow_clips)
        {
            geometry.bfc_roots.push(BfcRootBox {
                id: child_id,
                bfc,
                border_rect: [x, y, x + w, y + h],
                container: content_x_range,
                margin_x: [layout.margin.left as f64, layout.margin.right as f64],
            });
        }
        drop(styles);
        let child_bfc = if establishes_bfc { child_id } else { bfc };
        collect_float_geometry(base, child_id, child_bfc, depth + 1, geometry);
    }
}

/// The line boxes of an inline root, absolute, with their glyph runs' horizontal extents.
fn inline_root_lines(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    origins: &mut std::collections::HashMap<NodeId, (f64, f64)>,
) -> Option<Vec<LineGeometry>> {
    let text = node.data.downcast_element()?.inline_layout_data.as_ref()?;
    let (x, y) = box_origin(base, node.id, origins, false);
    let layout = node.final_layout();
    let content_x = x + (layout.border.left + layout.padding.left) as f64;
    let content_y = y + (layout.border.top + layout.padding.top) as f64 + text.block_offset as f64;
    Some(
        text.layout
            .lines()
            .map(|line| {
                let metrics = line.metrics();
                let mut runs = Vec::new();
                let mut boxes = Vec::new();
                for (at, item) in line.items().enumerate() {
                    match item {
                        parley::PositionedLayoutItem::GlyphRun(run) => runs.push(LineRun {
                            at,
                            x0: content_x + run.offset() as f64,
                            x1: content_x + (run.offset() + run.advance()) as f64,
                            breakable: run_breakable(base, &text.text, &run),
                        }),
                        parley::PositionedLayoutItem::InlineBox(ibox) => boxes.push((at, ibox.id)),
                    }
                }
                LineGeometry {
                    top: content_y + metrics.block_min_coord as f64,
                    bottom: content_y + metrics.block_max_coord as f64,
                    runs,
                    boxes,
                    ends_paragraph: matches!(
                        line.break_reason(),
                        parley::BreakReason::Explicit | parley::BreakReason::None
                    ),
                }
            })
            .collect(),
    )
}

/// [`LineRun::breakable`] of a positioned glyph run of an inline root whose text is `source`.
fn run_breakable(
    base: &BaseDocument,
    source: &str,
    run: &parley::GlyphRun<'_, blitz_dom::node::TextBrush>,
) -> bool {
    let wraps = base
        .get_node(run.style().brush.id)
        .and_then(|n| n.primary_styles())
        .is_some_and(|s| {
            s.clone_text_wrap_mode() == style::computed_values::text_wrap_mode::T::Wrap
        });
    wraps
        && source
            .get(run.run().text_range())
            .is_some_and(|text| text.trim_end().contains(char::is_whitespace))
}

fn apply_float_fixups(doc: &mut BaseDocument, fixups: &[(NodeId, FloatFixup)]) {
    use style::values::computed::{Length, LengthPercentage, Margin};
    for &(id, fixup) in fixups {
        mutate_primary_style(doc, id, |values| match fixup {
            FloatFixup::Clear(clear) => values.mutate_box().set_clear(clear),
            FloatFixup::MarginTop(px) => {
                values
                    .mutate_margin()
                    .set_margin_top(Margin::LengthPercentage(LengthPercentage::new_length(
                        Length::new(px),
                    )))
            }
        });
    }
}

/// One edit of [`zero_width_float_margins`]: the box, its new left and right margins (px; `None`
/// keeps one), and the horizontal shift (px) the walk applies to it and its subtree.
type ZeroWidthFloatEdit = (NodeId, [Option<f32>; 2], f64);

/// The margin edits and shifts that place a formatting-context root beside zero-width floats as
/// Chrome 155 does, read off a laid-out document. Compensates a TAFFY BUG of the crates.io Blitz
/// 0.3.0-beta.4 stack; the raw-Blitz canary `blitz_still_clamps_a_negative_margin_at_a_zero_width_float`
/// (`raw_blitz_tests.rs`) fails when it is fixed, and then this function,
/// [`ZeroWidthFloatEdit`], their use in [`resolve_and_walk`] (the margin edit and the walk's
/// `shifted` origins), the canary and `zero_width_floats_do_not_clamp_negative_margins` are
/// deleted.
///
/// A block-level box that establishes a formatting context is placed in a layout opportunity
/// beside the floats; Blink's test for "beside a float" is whether the opportunity's edge moved
/// in from the containing block's content edge (`LayoutNewFormattingContext` in Chromium
/// `third_party/blink/renderer/core/layout/block_layout_algorithm.cc`: `has_floats_on_line_left =
/// opportunity.rect.LineStartOffset() != origin_offset.line_offset`; only then are negative
/// margins clamped to 0), so a zero-width float at the content edge changes nothing and the
/// box's negative margins apply. TAFFY BUG (taffy 0.15.0 `src/compute/float.rs` 516-518 records a
/// zero-width float in the segments it spans, `has_float[slot] = true`, deliberately, and
/// `find_bfc_slot` 711-727 then clamps a negative margin on that side at the float's edge). Repro
/// (WPT css/CSS2/floats/zero-width-floats.html): a 100 px block at x = 58 holding a 0x50 left
/// float, a 0x150 right float (`clear: left`) and an `overflow: hidden` box with `margin: 0
/// -50px`: Taffy lays the box out at x = 58..208, Chrome for Testing 155.0.8059.85 (2026-10-28)
/// at 8..208. Measured on 14 variants (c07-pin-b/zw in the run store): the margin applies past a
/// zero-width float on either side (`left0 margin-left -50`: Chrome 8..158; `right0 margin 0
/// -50px`: 8..208) and is clamped by a float 1 px wide or wider.
///
/// Edit, for a root whose top segment Taffy flags with zero-width floats only on a side where its
/// margin is negative, and when no float wider than 0 is beside its border box over its whole
/// height (Chrome then sees no float at all): the negative margin of the clamped side moves to the
/// other side's margin (an `auto` width then stretches to Chrome's width; a specified width keeps
/// its width), and the walk shifts the box and its subtree by that margin, onto Chrome's x. Only
/// for left-to-right roots whose two margins are lengths or percentages. Not handled: zero-width
/// floats clamping both sides, an absolutely positioned descendant whose containing block is
/// outside the root (it is not shifted), and the opportunity Taffy misses when a float wider
/// than 0 starts below the root's top (WPT zero-width-floats-positioning.tentative.html: Chrome
/// narrows the root to avoid it, Taffy does not).
fn zero_width_float_margins(
    base: &BaseDocument,
    skip: &std::collections::HashSet<NodeId>,
) -> Vec<ZeroWidthFloatEdit> {
    use style::values::computed::Margin;
    let mut geometry = FloatGeometry::default();
    let root = base.root_element().id;
    collect_float_geometry(base, root, root, 0, &mut geometry);
    let zero = |f: &FloatBox| (f.margin_rect[2] - f.margin_rect[0]).abs() <= 1e-3;
    let mut edits = Vec::new();
    for bfc_root in &geometry.bfc_roots {
        if skip.contains(&bfc_root.id) {
            continue;
        }
        let Some(node) = base.get_node(bfc_root.id) else {
            continue;
        };
        let Some(styles) = node.primary_styles() else {
            continue;
        };
        if styles.get_inherited_box().clone_direction() != style::computed_values::direction::T::Ltr
        {
            continue;
        }
        let basis = style::values::computed::Length::new(
            (bfc_root.container[1] - bfc_root.container[0]) as f32,
        );
        let resolve = |m: Margin| match m {
            Margin::LengthPercentage(lp) => Some(f64::from(lp.resolve(basis).px())),
            _ => None,
        };
        let (Some(ml), Some(mr)) = (
            resolve(styles.clone_margin_left()),
            resolve(styles.clone_margin_right()),
        ) else {
            continue;
        };
        let auto_width = matches!(
            styles.clone_width(),
            style::values::generics::length::GenericSize::Auto
        );
        drop(styles);
        let rect = bfc_root.border_rect;
        // Taffy's view: the floats of the segment at the root's top.
        let at_top = |f: &FloatBox| {
            f.margin_rect[1] <= rect[1] + OVERLAP_EPSILON_PX
                && rect[1] + OVERLAP_EPSILON_PX < f.margin_rect[3]
        };
        // Chrome's view: every float beside the border box.
        let beside = |f: &FloatBox| {
            f.margin_rect[1] < rect[3] - OVERLAP_EPSILON_PX
                && rect[1] + OVERLAP_EPSILON_PX < f.margin_rect[3]
        };
        let floats: Vec<&FloatBox> = geometry
            .floats
            .iter()
            .filter(|f| f.bfc == bfc_root.bfc)
            .collect();
        let beside_root: Vec<&FloatBox> = floats.iter().copied().filter(|f| beside(f)).collect();
        if beside_root.iter().any(|f| !zero(f)) {
            continue;
        }
        let at_edge = |f: &FloatBox| {
            let x = f.margin_rect[if f.left { 0 } else { 2 }];
            let edge = bfc_root.container[if f.left { 0 } else { 1 }];
            (x - edge).abs() <= OVERLAP_EPSILON_PX
        };
        if beside_root.iter().any(|f| !at_edge(f)) {
            continue;
        }
        let top: Vec<&FloatBox> = floats.iter().copied().filter(|f| at_top(f)).collect();
        let left = ml < 0.0 && top.iter().any(|f| f.left);
        let right = mr < 0.0 && top.iter().any(|f| !f.left);
        let edit = match (left, right) {
            (true, false) if auto_width => ([Some(0.0), Some((ml + mr) as f32)], ml),
            (true, false) => ([None, None], ml),
            (false, true) if auto_width => ([Some((ml + mr) as f32), Some(0.0)], -mr),
            _ => continue,
        };
        edits.push((bfc_root.id, edit.0, edit.1));
    }
    edits
}

/// Local name of the element [`trailing_float_wraps`] moves the trailing floats of a line into.
const FLOAT_RUN_TAG: &str = "vellora-float-run";

/// The floats to move below their line, read off a laid-out document: `(parent, first float)`
/// for each run of trailing floats, in the order found. Compensates a BLITZ BUG of the crates.io
/// Blitz 0.3.0-beta.4 stack; the raw-Blitz canary `blitz_still_places_a_float_beside_a_line_it_does_not_fit`
/// (`raw_blitz_tests.rs`) fails when it is fixed, and then this function, [`FLOAT_RUN_TAG`],
/// [`wrap_trailing_floats`], their call in [`resolve_and_walk`], the canary and the
/// `trailing_floats_*` tests are deleted.
///
/// A float that does not fit beside the content already on its line goes below that line
/// (CSS 2.2 §9.5.1 rules 6-8 and §9.5: the float is placed as high as possible but not beside a
/// line it does not fit on). BLITZ BUG (blitz-dom 0.3.0-beta.4 `src/layout/inline.rs` 722-765):
/// the float is placed at the current line's top (`min_y = state.line_y()`, 749) in a slot that
/// only avoids other floats; Parley's `advance` (the content before the float, parley 0.12.0
/// `src/layout/line_break.rs` 1079-1083) is not used, and the line is then moved beside the float
/// (`set_line_x`, 757-760), the content before the float with it. Repro (WPT
/// css/CSS2/floats/floats-placement-vertical-003.xht, font-size 5px, body 100 px wide): `H` then a
/// 100x100 left float: Blitz puts the float at the line's top (y = 8) and `H` at x = 108, past the
/// body; Chrome for Testing 155.0.8059.85 (2026-10-28) puts the float below the line (y = 14) and
/// `H` at x = 8. A right float is placed over the text (`HHH` + a 95 px right float in 100 px:
/// Blitz y = 8, Chrome y = 20), and so is a float after the last line of a wrapped paragraph.
///
/// Edit: when nothing in-flow follows the float in its inline formatting context (only white
/// space, comments and other floats until its end), every child of the float's parent BEFORE the
/// float moves into a new `display: block` element, the parent's first child (styled by
/// [`anonymous_element`]: inherited properties only, so the moved content keeps its line layout:
/// `text-align`, `line-height`, `white-space` and the fonts are inherited). The parent then has a
/// block-level child, and Blitz lays each of its floats out as a block-level box after the
/// preceding block (blitz-dom 0.3.0-beta.4 `src/layout/construct.rs` 840-848 pushes a float as a
/// block-level child of a container that has block children), that is at the bottom of the
/// float's line, which is the last one; the floats after it go below it too (CSS 2.2 §9.5.1 rule
/// 5): the layout Chrome gives. Floats before it stay in the moved inline content, at their
/// line's top. "Fits" is Chrome's test: the content before the float on its line (its trailing
/// collapsible white space left out) plus the float's margin box is not wider than the line's
/// room beside the earlier floats of the formatting context. A float that starts its line is
/// left alone (it always stays there, measured). Not handled (Blitz's placement kept): a float
/// followed by in-flow content on its line (Chrome keeps that content on the line and the float
/// below it: `H <100px float> tx`, Chrome `tx` at x = 20 on line 1, float y = 20) unless the
/// no-wrap edit of [`float_avoidance_fixups`] applies, a float inside an inline element, a
/// float followed by an absolutely positioned box, and a parent with a `::before` / `::after`
/// box (it would be split from the moved content). The floats the no-wrap edit moves keep it.
fn trailing_float_wraps(
    base: &BaseDocument,
    skip: &std::collections::HashSet<NodeId>,
) -> Vec<(NodeId, NodeId)> {
    use style::computed_values::white_space_collapse::T as Collapse;
    let mut geometry = FloatGeometry::default();
    let root = base.root_element().id;
    collect_float_geometry(base, root, root, 0, &mut geometry);
    let mut wraps = Vec::new();
    let mut taken = std::collections::HashSet::new();
    for (index, float) in geometry.floats.iter().enumerate() {
        if skip.contains(&float.id) || taken.contains(&float.id) {
            continue;
        }
        let Some(root_id) = float_inline_root(base, float.id) else {
            continue;
        };
        let parent = root_id;
        let Some(root_node) = base.get_node(root_id) else {
            continue;
        };
        let Some(text) = root_node
            .data
            .downcast_element()
            .and_then(|el| el.inline_layout_data.as_ref())
        else {
            continue;
        };
        let collapses = root_node
            .primary_styles()
            .is_some_and(|s| s.clone_white_space_collapse() == Collapse::Collapse);
        let float_id = float.id.as_u64();
        let Some((line, at)) = text.layout.lines().find_map(|line| {
            let at = line.items().position(
                |item| matches!(item, parley::PositionedLayoutItem::InlineBox(b) if b.id == float_id),
            )?;
            Some((line, at))
        }) else {
            continue;
        };
        // The content before the float on its line.
        let (mut width, mut trailing) = (0.0f64, 0.0f64);
        for item in line.items().take(at) {
            match item {
                parley::PositionedLayoutItem::GlyphRun(glyph_run) => {
                    for cluster in glyph_run.run().clusters() {
                        let advance = f64::from(cluster.advance());
                        width += advance;
                        let space = text.text.get(cluster.text_range()).is_some_and(|s| {
                            !s.is_empty() && s.chars().all(|c| matches!(c, ' ' | '\t' | '\n'))
                        });
                        trailing = if space && collapses {
                            trailing + advance
                        } else {
                            0.0
                        };
                    }
                }
                parley::PositionedLayoutItem::InlineBox(ibox) => {
                    if ibox.kind == parley::InlineBoxKind::InFlow {
                        width += f64::from(ibox.width);
                        trailing = 0.0;
                    }
                }
            }
        }
        let before = width - trailing;
        if before <= OVERLAP_EPSILON_PX {
            continue;
        }
        // The line's room at its top beside the floats placed before this one.
        let (_, top) = box_origin(base, root_id, &mut std::collections::HashMap::new(), false);
        let layout = root_node.final_layout();
        let line_top = top
            + f64::from(layout.border.top + layout.padding.top + text.block_offset)
            + f64::from(line.metrics().block_min_coord);
        let (rx, _) = box_origin(base, root_id, &mut std::collections::HashMap::new(), false);
        let mut x0 = rx + f64::from(layout.border.left + layout.padding.left);
        let mut x1 = rx + f64::from(layout.size.width - layout.border.right - layout.padding.right);
        for earlier in &geometry.floats[..index] {
            if earlier.bfc != float.bfc
                || !(earlier.margin_rect[1] <= line_top + OVERLAP_EPSILON_PX
                    && line_top + OVERLAP_EPSILON_PX < earlier.margin_rect[3])
            {
                continue;
            }
            if earlier.left {
                x0 = x0.max(earlier.margin_rect[2]);
            } else {
                x1 = x1.min(earlier.margin_rect[0]);
            }
        }
        let float_width = float.margin_rect[2] - float.margin_rect[0];
        if before + float_width <= (x1 - x0) + OVERLAP_EPSILON_PX {
            continue;
        }
        let Some(run) = trailing_float_run(base, parent, float.id) else {
            continue;
        };
        taken.extend(run.iter().copied());
        wraps.push((parent, float.id));
    }
    wraps
}

/// The DOM parent of float `id` when that parent is the inline formatting context root the
/// float is laid out in (has it among its inline boxes) and has no `::before` / `::after` box.
/// In a block container with block-level children Blitz never lays a float out inline (its
/// anonymous-block split pushes every float as a block-level child, blitz-dom 0.3.0-beta.4
/// `src/layout/construct.rs` 840-848).
fn float_inline_root(base: &BaseDocument, id: NodeId) -> Option<NodeId> {
    let parent = base.get_node(id)?.parent?;
    let node = base.get_node(parent)?;
    if node.before().is_some() || node.after().is_some() {
        return None;
    }
    node.data
        .downcast_element()
        .and_then(|el| el.inline_layout_data.as_ref())
        .is_some_and(|t| t.layout.inline_boxes().any(|b| b.id == id.as_u64()))
        .then_some(parent)
}

/// `float` and the DOM siblings after it that [`trailing_float_wraps`] moves with it, or `None`
/// when in-flow content follows it in its inline formatting context.
fn trailing_float_run(base: &BaseDocument, parent: NodeId, float: NodeId) -> Option<Vec<NodeId>> {
    use style::values::specified::box_::DisplayOutside;
    let children = &base.get_node(parent)?.children;
    let start = children.iter().position(|&c| c == float)?;
    let mut run = Vec::new();
    for &id in &children[start..] {
        let node = base.get_node(id)?;
        match &node.data {
            NodeData::Text(t) if t.content.chars().all(char::is_whitespace) => run.push(id),
            NodeData::Comment { .. } => run.push(id),
            NodeData::Element(_) => {
                let styles = node.primary_styles()?;
                if styles.clone_position().is_absolutely_positioned() {
                    return None;
                }
                let display = styles.clone_display();
                if display == style::values::computed::Display::None
                    || !matches!(styles.clone_float(), style::computed_values::float::T::None)
                {
                    run.push(id);
                } else if display.outside() == DisplayOutside::Block {
                    break;
                } else {
                    return None;
                }
            }
            _ => return None,
        }
    }
    Some(run)
}

/// For each run [`trailing_float_wraps`] found, moves the children of its parent before the run
/// into a new [`FLOAT_RUN_TAG`] block, their parent's first child: the run's floats become
/// block-level children after it.
fn wrap_trailing_floats(doc: &mut BaseDocument, wraps: &[(NodeId, NodeId)]) {
    for &(parent, float) in wraps {
        if trailing_float_run(doc, parent, float).is_none() {
            continue;
        }
        let Some(before) = doc.get_node(parent).and_then(|n| {
            let at = n.children.iter().position(|&c| c == float)?;
            Some(n.children[..at].to_vec())
        }) else {
            continue;
        };
        let Some(wrapper) = anonymous_element(
            doc,
            parent,
            blitz_dom::LocalName::from(FLOAT_RUN_TAG),
            style::values::computed::Display::Block,
        ) else {
            continue;
        };
        for &id in &before {
            if let Some(node) = doc.get_node_mut(id) {
                node.parent = Some(wrapper);
            }
        }
        if let Some(node) = doc.get_node_mut(wrapper) {
            node.children = before.iter().copied().collect();
        }
        if let Some(node) = doc.get_node_mut(parent) {
            node.children
                .splice(0..before.len(), std::iter::once(wrapper));
        }
    }
}

/// How many times [`inline_block_baseline_shifts`] is re-run on the re-laid-out document: an
/// inline-block whose last line holds another corrected inline-block moves once that one has,
/// so each round settles one more level of nesting. Deeper nestings keep the last round's
/// placement.
const INLINE_BLOCK_BASELINE_ROUNDS: usize = 3;

/// The `vertical-align` raise (px) that puts each inline-block on its line at Chrome 155's
/// baseline, read off a laid-out document; empty when every inline-block already sits there.
/// Compensates a TAFFY BUG of the crates.io Blitz 0.3.0-beta.4 stack; the raw-Blitz canary
/// `blitz_still_aligns_an_inline_block_on_its_first_line` (`raw_blitz_tests.rs`) fails when it is
/// fixed, and then this function, [`chrome_last_baseline`], [`INLINE_BLOCK_BASELINE_ROUNDS`],
/// their loop in [`resolve_and_walk`], the canary and the `inline_block_baseline_*` tests are
/// deleted.
///
/// An inline-block's baseline is the baseline of its LAST line box in normal flow (CSS 2.2
/// §10.8.1; css-align-3 §9.1 `baseline-source: auto`), and blitz-dom asks for it
/// (`src/layout/inline.rs` 449-451: `output.baselines.last.or(output.baselines.first)`), but a
/// block container laid out by Taffy only ever reports its FIRST baseline (taffy 0.15.0
/// `src/compute/block.rs` 758, `Baselines::from_first(first_baseline)`, set at 1687-1701 from the
/// first in-flow child that has one). So every inline-block whose content is block-level (two
/// `<p>`s, a `<div>` per row) sits on its first line instead of its last. Repro (Chrome for
/// Testing 155.0.8059.85, 2026-10-28, 16px/20px monospace, c07-pin-b/baseline in the run store):
/// `<div><span style="display:inline-block"><p>AA</p><p>BB</p></span> XX</div>`: Chrome puts XX
/// on BB's line (both tops y = 28), Blitz on AA's (y = 8). WPT
/// css/CSS2/linebox/baseline-block-with-overflow-001.html fails on the same bug, plus Chrome's
/// rule for a descendant scroll container below.
///
/// Chrome's last baseline ([`chrome_last_baseline`]), measured on the same build: the in-flow
/// children are searched from the last one back (floats and absolutely positioned boxes skipped,
/// a child without a baseline, such as an empty block, skipped); an inline formatting context
/// gives its last line's baseline (Blitz's own rule for it, the trailing empty line after a
/// forced break left out); a block-level scroll container (`overflow` other than `visible` /
/// `clip`) gives its bottom MARGIN edge, not its content (a 30 px `overflow: hidden` div with
/// `margin-bottom: 10px` after a 20 px line: baseline at 68, WPT section 5: 310 = 250 + 30 + 30);
/// a `display: table` child is skipped (Chrome aligned with the line before it). A flex or grid
/// child, or any other display, stops the search and the inline-block keeps Blitz's placement
/// (Chrome used the flex container's first line; not modelled). An inline-block with no
/// baseline sits on its bottom margin edge, as in Blitz.
///
/// Edit: `vertical-align` (Stylo's `baseline-shift`) raised by the difference between that
/// baseline and the one Blitz used, which moves the box exactly as the right baseline would
/// (its ascent and descent in the line box are the same). Only for `vertical-align: baseline`
/// or `<length>` / `<percentage>` (Chrome measured: a 10px raise adds to the last baseline);
/// `sub` / `super` and the line-relative keywords are left alone (`super` also uses the last
/// baseline in Chrome, but Parley decides its amount). Not applied to an inline-block that is
/// itself a scroll container, is layout-contained or has `baseline-source: first` (Blitz is
/// right there), nor to ruby's boxes ([`lay_out_ruby`] sets their raise) or form controls.
fn inline_block_baseline_shifts(
    base: &BaseDocument,
    author_raises: &mut std::collections::HashMap<NodeId, f64>,
) -> Vec<(NodeId, f32)> {
    let mut shifts = Vec::new();
    let mut stack = vec![(base.root_element().id, 0usize)];
    while let Some((id, depth)) = stack.pop() {
        // The DOM depth is gated before layout (SEC-1); this bounds the walk the same way.
        if depth > 4096 {
            continue;
        }
        let Some(node) = base.get_node(id) else {
            continue;
        };
        if let Some(text) = node
            .data
            .downcast_element()
            .and_then(|el| el.inline_layout_data.as_ref())
        {
            for line in text.layout.lines() {
                let line_baseline = f64::from(line.metrics().baseline);
                for item in line.items() {
                    let parley::PositionedLayoutItem::InlineBox(ibox) = item else {
                        continue;
                    };
                    if ibox.kind != parley::InlineBoxKind::InFlow {
                        continue;
                    }
                    let child_id = NodeId::from_u64(ibox.id);
                    let Some(child) = base.get_node(child_id) else {
                        continue;
                    };
                    let Some(raise) = inline_block_raise(child) else {
                        continue;
                    };
                    // The author's raise, read before this function's first edit of the box.
                    let author = *author_raises.entry(child_id).or_insert(raise);
                    let layout = child.unrounded_layout();
                    let Some(chrome) = chrome_last_baseline(base, child, depth + 1) else {
                        continue;
                    };
                    // `None`: no baseline, the box's bottom margin edge sits on the line's.
                    let chrome =
                        chrome.unwrap_or(f64::from(layout.size.height + layout.margin.bottom));
                    // The baseline Blitz aligned (px below the box's border-box top): the line's,
                    // less the current raise.
                    let used = line_baseline - f64::from(ibox.y + layout.margin.top) - raise;
                    let wanted = author + chrome - used;
                    if (wanted - raise).abs() > BASELINE_EPSILON_PX {
                        shifts.push((child_id, wanted as f32));
                    }
                }
            }
        }
        if let Some(children) = node.layout_children.borrow().as_ref() {
            stack.extend(children.iter().rev().map(|&c| (c, depth + 1)));
        }
    }
    shifts
}

/// Baseline differences up to this much are float rounding, not a misplaced box.
const BASELINE_EPSILON_PX: f64 = 0.01;

/// The current `vertical-align` raise (px) of an inline-block [`inline_block_baseline_shifts`]
/// corrects, or `None` for a box it leaves alone.
fn inline_block_raise(node: &blitz_dom::Node) -> Option<f64> {
    use style::values::computed::{BaselineSource, Contain, Overflow};
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    let element = node.data.downcast_element()?;
    let local = element.name.local.as_ref();
    if matches!(local, "rt" | "button" | "input" | "select" | "textarea") || local == RUBY_BASE_TAG
    {
        return None;
    }
    let styles = node.primary_styles()?;
    let display = styles.clone_display();
    if display.outside() != DisplayOutside::Inline || display.inside() != DisplayInside::FlowRoot {
        return None;
    }
    let b = styles.get_box();
    if matches!(b.clone_baseline_source(), BaselineSource::First)
        || b.clone_contain().contains(Contain::LAYOUT)
        || !matches!(
            styles.clone_overflow_y(),
            Overflow::Visible | Overflow::Clip
        )
    {
        return None;
    }
    baseline_raise(&styles)
}

/// Chrome 155's last baseline of a laid-out block container (px below its border-box top), the
/// search [`inline_block_baseline_shifts`] documents: `Some(None)` when it has none, `None`
/// when the search meets a box it does not model.
fn chrome_last_baseline(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    depth: usize,
) -> Option<Option<f64>> {
    use style::values::computed::{Contain, Overflow};
    use style::values::specified::box_::DisplayInside;
    if depth > 4096 {
        return None;
    }
    if node
        .primary_styles()
        .is_some_and(|s| s.clone_contain().contains(Contain::LAYOUT))
    {
        return Some(None);
    }
    if let Some(text) = node
        .data
        .downcast_element()
        .and_then(|el| el.inline_layout_data.as_ref())
    {
        // Blitz's own last baseline of an inline formatting context (blitz-dom 0.3.0-beta.4
        // `src/layout/inline.rs` 838-839 and 851-864, 1104-1114).
        if text.text.is_empty() && text.layout.inline_boxes().len() == 0 {
            return Some(None);
        }
        let count = text.layout.len();
        let mut last = count.checked_sub(1);
        if count >= 2 {
            if let (Some(prev), Some(end)) =
                (text.layout.get(count - 2), text.layout.get(count - 1))
            {
                if prev.break_reason() == parley::BreakReason::Explicit
                    && end.text_range().is_empty()
                    && end.items().next().is_none()
                {
                    last = Some(count - 2);
                }
            }
        }
        let layout = node.unrounded_layout();
        let top = f64::from(layout.border.top + layout.padding.top + text.block_offset);
        return Some(
            last.and_then(|i| text.layout.get(i))
                .map(|line| top + f64::from(line.metrics().baseline)),
        );
    }
    let children: Vec<NodeId> = node
        .layout_children
        .borrow()
        .as_ref()
        .map(|c| c.iter().copied().collect())
        .unwrap_or_default();
    for &child_id in children.iter().rev() {
        let Some(child) = base.get_node(child_id).filter(|n| node_has_layout_data(n)) else {
            continue;
        };
        let Some(styles) = child.primary_styles() else {
            continue;
        };
        if styles.clone_position().is_absolutely_positioned()
            || !matches!(styles.clone_float(), style::computed_values::float::T::None)
        {
            continue;
        }
        let inside = styles.clone_display().inside();
        let scroll = !matches!(
            styles.clone_overflow_y(),
            Overflow::Visible | Overflow::Clip
        );
        drop(styles);
        let layout = child.unrounded_layout();
        let top = f64::from(layout.location.y);
        match inside {
            DisplayInside::Flow | DisplayInside::FlowRoot if scroll => {
                return Some(Some(
                    top + f64::from(layout.size.height + layout.margin.bottom),
                ));
            }
            DisplayInside::Flow | DisplayInside::FlowRoot => {
                if let Some(baseline) = chrome_last_baseline(base, child, depth + 1)? {
                    return Some(Some(top + baseline));
                }
            }
            DisplayInside::Table => {}
            _ => return None,
        }
    }
    Some(None)
}

fn apply_baseline_shifts(doc: &mut BaseDocument, shifts: &[(NodeId, f32)]) {
    use style::values::computed::{AlignmentBaseline, BaselineShift, Length, LengthPercentage};
    for &(id, px) in shifts {
        mutate_primary_style(doc, id, |values| {
            let b = values.mutate_box();
            b.set_alignment_baseline(AlignmentBaseline::Baseline);
            b.set_baseline_shift(BaselineShift::Length(LengthPercentage::new_length(
                Length::new(px),
            )));
        });
    }
}

/// Local name of the element vellora wraps each ruby base in ([`wrap_ruby_bases`]): Chrome's
/// anonymous ruby-base box, made a real (unstyled) element so it can be laid out and measured.
const RUBY_BASE_TAG: &str = "vellora-ruby-base";

/// vellora's UA rules for ruby (Phase C step 06, [`crate::ruby`]). Blitz 0.3.0-beta.4 lays ruby
/// out as plain inlines (Stylo 0.22.0 in servo mode drops `display: ruby` / `ruby-text`, see
/// the `crate::ruby` module docs), so a ruby column is built from two atomic inlines: the base
/// wrapper and the `<rt>`, placed by [`lay_out_ruby`]. Author rules win over these (an author
/// `rt { display: none }` hides the annotation, as in Chrome). `white-space: nowrap`: Chrome 155
/// keeps a ruby on one line (`p2.html` d11: a 113 px ruby whose first column fits after "aaa"
/// moves to the next line whole) and never parts a base from its annotation.
const RUBY_UA_CSS: &str = "ruby { white-space: nowrap; }\n\
     ruby > vellora-ruby-base, ruby > rt { display: inline-block; text-indent: 0; }";

/// Wraps the base of every ruby column in a [`RUBY_BASE_TAG`] element before the cascade: the
/// children of a `<ruby>` since the previous `<rt>` (or its start) become the base of the next
/// `<rt>`. That is Chrome 155's pairing (`p2.html` d4: `<rb>A</rb><rb>BBBB</rb><rt>x</rt><rt>yy
/// </rt>` gives one column "A BBBB" / "x" and a base-less one / "yy"; `<rb>` pairs nothing). The
/// white space around a base goes into its wrapper, whose line trims it (Chrome drops the white
/// space between a base and its annotation). Content after the last `<rt>` is left as it is, and
/// a ruby without `<rt>` is not touched. Returns the `(base wrapper, rt)` pairs, in tree order.
fn wrap_ruby_bases(doc: &mut BaseDocument) -> Vec<(NodeId, NodeId)> {
    let is_html = |doc: &BaseDocument, id: NodeId, tag: &str| {
        doc.get_node(id)
            .and_then(|n| n.data.downcast_element())
            .is_some_and(|el| el.name.ns == blitz_dom::ns!(html) && &*el.name.local == tag)
    };
    let mut rubies = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        if is_html(doc, id, "ruby") {
            rubies.push(id);
        }
        stack.extend(node.children.iter().rev().copied());
    }
    let mut pairs = Vec::new();
    for ruby in rubies {
        let children = doc
            .get_node(ruby)
            .map(|n| n.children.clone())
            .unwrap_or_default();
        if !children.iter().any(|&c| is_html(doc, c, "rt")) {
            continue;
        }
        let mut pending: Vec<NodeId> = Vec::new();
        for child in children {
            if !is_html(doc, child, "rt") {
                pending.push(child);
                continue;
            }
            let mut mutator = doc.mutate();
            let name = blitz_dom::QualName::new(
                None,
                blitz_dom::ns!(html),
                blitz_dom::LocalName::from(RUBY_BASE_TAG),
            );
            let wrapper = mutator.create_element(name, Vec::new());
            mutator.insert_nodes_before(child, &[wrapper]);
            mutator.append_children(wrapper, &pending);
            drop(mutator);
            pairs.push((wrapper, child));
            pending.clear();
        }
    }
    pairs
}

/// Makes every inline `<ruby>` that [`wrap_ruby_bases`] built columns in an inline-block (in
/// its computed style, between the cascade and layout), with no `text-indent` of its own: an
/// atomic inline, so the line breaker never parts its columns. Chrome 155 keeps a ruby on one
/// line (`p2.html` d11); Parley 0.12.0 breaks between two inline boxes whatever the
/// `white-space` of the text around them (`parley-0.12.0/src/layout/line_break.rs:1097-1104`:
/// the wrap mode is the line state's, set by the last text run).
fn ruby_containers_atomic(doc: &mut BaseDocument, pairs: &[(NodeId, NodeId)]) {
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    let mut rubies: Vec<NodeId> = Vec::new();
    for &(base_id, _) in pairs {
        if let Some(ruby) = doc.get_node(base_id).and_then(|n| n.parent) {
            if !rubies.contains(&ruby) {
                rubies.push(ruby);
            }
        }
    }
    for ruby in rubies {
        let inline = doc
            .get_node(ruby)
            .and_then(|n| n.primary_styles())
            .is_some_and(|s| {
                let d = s.clone_display();
                d.outside() == DisplayOutside::Inline && d.inside() == DisplayInside::Flow
            });
        if inline {
            mutate_primary_style(doc, ruby, |values| {
                values
                    .mutate_box()
                    .set_display(style::values::computed::Display::InlineBlock);
                values
                    .mutate_inherited_text()
                    .set_text_indent(style::values::computed::TextIndent::zero());
            });
        }
    }
}

/// The last-line baseline of inline root `node` below its border-box top, and the em box
/// ([`crate::ruby::em_box`]) of its content around that baseline: each glyph run that is not
/// all white space, each in-flow atomic inline's border box (Blink `ComputeEmHeight`).
fn ruby_inline_metrics(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    fonts: &mut std::collections::HashMap<u64, Option<crate::ruby::FontVMetrics>>,
) -> (Option<f64>, crate::ruby::EmBox) {
    let Some(text) = node
        .data
        .downcast_element()
        .and_then(|el| el.inline_layout_data.as_ref())
    else {
        return (None, None);
    };
    let Some(last) = text.layout.lines().last() else {
        return (None, None);
    };
    let baseline = f64::from(last.metrics().baseline);
    let mut em = None;
    for line in text.layout.lines() {
        for item in line.items() {
            match item {
                parley::PositionedLayoutItem::GlyphRun(glyph_run) => {
                    let run = glyph_run.run();
                    if text
                        .text
                        .get(run.text_range())
                        .is_none_or(|s| s.chars().all(char::is_whitespace))
                    {
                        continue;
                    }
                    let font = run.font();
                    let metrics = fonts.entry(font.data.id()).or_insert_with(|| {
                        crate::ruby::font_vmetrics(font.data.as_ref(), font.index)
                    });
                    if let Some(metrics) = metrics {
                        let (a, d) = crate::ruby::em_box(metrics, f64::from(run.font_size()));
                        let shift = f64::from(glyph_run.baseline()) - baseline;
                        em = crate::ruby::unite(em, Some((a - shift, d + shift)));
                    }
                }
                parley::PositionedLayoutItem::InlineBox(ibox) => {
                    if ibox.kind != parley::InlineBoxKind::InFlow {
                        continue;
                    }
                    let Some(child) = base.get_node(NodeId::from_u64(ibox.id)) else {
                        continue;
                    };
                    let layout = child.unrounded_layout();
                    let top = f64::from(ibox.y + layout.margin.top);
                    let bottom = top + f64::from(layout.size.height);
                    em = crate::ruby::unite(em, Some((baseline - top, bottom - baseline)));
                }
            }
        }
    }
    let layout = node.unrounded_layout();
    let content_top = layout.border.top + layout.padding.top + text.block_offset;
    (Some(f64::from(content_top) + baseline), em)
}

/// The line of its inline-root ancestor that atomic inline `id` sits on: `(inline root, line
/// index)` and that line box's ascent and descent around its baseline.
fn containing_line(base: &BaseDocument, id: NodeId) -> Option<((NodeId, usize), (f64, f64))> {
    let mut at = base.get_node(id)?.parent;
    while let Some(parent) = at {
        let node = base.get_node(parent)?;
        if let Some(text) = node
            .data
            .downcast_element()
            .and_then(|el| el.inline_layout_data.as_ref())
        {
            for (index, line) in text.layout.lines().enumerate() {
                let holds = line.items().any(|item| {
                    matches!(item, parley::PositionedLayoutItem::InlineBox(b) if b.id == id.as_u64())
                });
                if holds {
                    let m = line.metrics();
                    return Some((
                        (parent, index),
                        (
                            f64::from(m.baseline - m.block_min_coord),
                            f64::from(m.block_max_coord - m.baseline),
                        ),
                    ));
                }
            }
            return None;
        }
        at = node.parent;
    }
    None
}

/// Lays out the ruby columns [`wrap_ruby_bases`] built (Phase C step 06, [`crate::ruby`]), on
/// the layout just resolved: measures each base wrapper and `<rt>`, computes Chrome's placement
/// ([`crate::ruby::place`]) and writes it into their computed styles (margins, and the `<rt>`'s
/// `vertical-align` length). Returns whether anything was edited; the caller then lays the
/// document out once more. A column whose `<rt>` is not an inline-block (an author `display`)
/// or whose two boxes are not on one line is left as laid out.
///
/// The em boxes of a line are united from this layout's lines; the edits change only the
/// columns' widths (to `max(base, annotation)`, never wider than before), so a line can take
/// more content in the second layout. The columns keep the em boxes of their first-layout line
/// (UNVERIFIED for lines whose rubies' em boxes differ and whose breaks move).
fn lay_out_ruby(doc: &mut BaseDocument, pairs: &[(NodeId, NodeId)]) -> bool {
    use style::values::specified::box_::{Display, DisplayInside, DisplayOutside};
    let base: &BaseDocument = doc;
    let inline_block = |id: NodeId| {
        base.get_node(id)
            .and_then(|n| n.primary_styles())
            .is_some_and(|s| {
                let d: Display = s.clone_display();
                d.outside() == DisplayOutside::Inline && d.inside() == DisplayInside::FlowRoot
            })
    };
    // Lookup only (DET-1): keyed by font blob id, never iterated.
    let mut fonts = std::collections::HashMap::new();
    let mut columns = Vec::new();
    let mut placed = Vec::new();
    for &(base_id, rt_id) in pairs {
        if !inline_block(base_id) || !inline_block(rt_id) {
            continue;
        }
        let (Some(base_node), Some(rt_node)) = (base.get_node(base_id), base.get_node(rt_id))
        else {
            continue;
        };
        // The base's line metrics (an empty base's em box), and the line the ruby sits on: the
        // columns of one line share their em boxes. The `<rt>` need not be on the base's line
        // yet: it advances nothing once placed.
        let Some((base_line, line_metrics)) = containing_line(base, base_id) else {
            continue;
        };
        let line = base_node
            .parent
            .filter(|&ruby| inline_block(ruby))
            .and_then(|ruby| containing_line(base, ruby))
            .map_or(base_line, |(line, _)| line);
        let (_, base_em) = ruby_inline_metrics(base, base_node, &mut fonts);
        let (rt_baseline, annotation_em) = ruby_inline_metrics(base, rt_node, &mut fonts);
        let base_layout = base_node.unrounded_layout();
        let rt_layout = rt_node.unrounded_layout();
        let annotation_height = f64::from(rt_layout.size.height);
        columns.push(crate::ruby::Column {
            line: (raw_id(line.0), line.1),
            base_width: f64::from(base_layout.size.width),
            annotation_width: f64::from(rt_layout.size.width),
            base_em,
            line_metrics,
            annotation_em,
            annotation_height,
            annotation_baseline: rt_baseline.unwrap_or(annotation_height),
        });
        // The `<rt>` sits on the side of its base the line breaker put it on: after it, or
        // before it when the line runs right to left. Read off the layout, not `direction`:
        // Parley 0.12.0 keeps the inline boxes of a `dir=rtl` ruby in logical order, left to
        // right (measured, `ruby-bidi-004`'s first ruby).
        let rtl = rt_layout.location.x < base_layout.location.x
            && containing_line(base, rt_id).is_some_and(|(l, _)| l == base_line);
        placed.push((base_id, rt_id, rtl));
    }
    let edits = crate::ruby::place(&columns);
    for (&(base_id, rt_id, rtl), edit) in placed.iter().zip(&edits) {
        set_margins(
            doc,
            base_id,
            [
                None,
                Some(edit.base_margin.1),
                None,
                Some(edit.base_margin.0),
            ],
        );
        let (left, right) = if rtl {
            (edit.annotation_margin_x.1, edit.annotation_margin_x.0)
        } else {
            edit.annotation_margin_x
        };
        set_margins(
            doc,
            rt_id,
            [
                Some(edit.annotation_margin_y.0),
                Some(right),
                Some(edit.annotation_margin_y.1),
                Some(left),
            ],
        );
        let raise = edit.annotation_raise;
        mutate_primary_style(doc, rt_id, |values| {
            use style::values::computed::{Length, LengthPercentage};
            let b = values.mutate_box();
            b.set_alignment_baseline(style::values::computed::AlignmentBaseline::Baseline);
            b.set_baseline_shift(style::values::computed::BaselineShift::Length(
                LengthPercentage::new_length(Length::new(raise as f32)),
            ));
        });
    }
    !placed.is_empty()
}

/// Sets the given margins (`[top, right, bottom, left]`, px; `None` keeps one) of `id`'s
/// computed style.
fn set_margins(doc: &mut BaseDocument, id: NodeId, px: [Option<f64>; 4]) {
    use style::values::computed::{Length, LengthPercentage, Margin};
    let margin =
        |px: f64| Margin::LengthPercentage(LengthPercentage::new_length(Length::new(px as f32)));
    mutate_primary_style(doc, id, |values| {
        let m = values.mutate_margin();
        if let Some(px) = px[0] {
            m.set_margin_top(margin(px));
        }
        if let Some(px) = px[1] {
            m.set_margin_right(margin(px));
        }
        if let Some(px) = px[2] {
            m.set_margin_bottom(margin(px));
        }
        if let Some(px) = px[3] {
            m.set_margin_left(margin(px));
        }
    });
}

/// A multi-column container found in the cascade ([`multicol_containers`]), with its column
/// geometry ([`multicol_geometry`]) and its `column-fill` (read by vellora, see
/// [`crate::break_css::BreakRules::column_fill`]).
struct MulticolNode {
    id: NodeId,
    fill_auto: bool,
    /// Its height was sized by its content (`height: auto`) before vellora gave it the balanced
    /// column height ([`lay_out_multicol`]).
    auto_height: bool,
    count: usize,
    column_width: f64,
    gap: f64,
}

/// The content-box width of `node`'s unrounded layout.
fn content_box_width(node: &blitz_dom::Node) -> f64 {
    let layout = node.unrounded_layout();
    f64::from(
        layout.size.width
            - layout.border.left
            - layout.border.right
            - layout.padding.left
            - layout.padding.right,
    )
    .max(0.0)
}

/// The column count, width and gap of a multi-column container from its computed style, or
/// `None` for an element that is not one: `column-count` and `column-width` both `auto`, or a
/// box that is not a block container (CSS Multi-column Layout 1 §2: flex, grid and table boxes
/// and plain inlines are not). `available` is the container's content-box width;
/// `column-gap: normal` is `1em` (§4.1).
fn multicol_geometry(
    styles: &style::properties::ComputedValues,
    available: f64,
) -> Option<(usize, f64, f64)> {
    use style::values::generics::column::ColumnCount;
    use style::values::generics::length::{LengthPercentageOrAuto, LengthPercentageOrNormal};
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    let display = styles.get_box().display;
    let block_container = matches!(
        display.inside(),
        DisplayInside::Flow | DisplayInside::FlowRoot
    ) && matches!(
        display.outside(),
        DisplayOutside::Block | DisplayOutside::Inline
    ) && !display.is_inline_flow();
    if !block_container {
        return None;
    }
    let column = styles.get_column();
    let count = match column.column_count {
        ColumnCount::Integer(n) => Some(n.0.max(1) as u32),
        ColumnCount::Auto => None,
    };
    let width = match &column.column_width {
        LengthPercentageOrAuto::LengthPercentage(l) => Some(f64::from(l.0.px())),
        LengthPercentageOrAuto::Auto => None,
    };
    let gap = match &styles.get_position().column_gap {
        LengthPercentageOrNormal::LengthPercentage(lp) => f64::from(
            lp.0.resolve(style::values::computed::Length::new(available as f32))
                .px(),
        ),
        LengthPercentageOrNormal::Normal => {
            f64::from(styles.get_font().font_size.computed_size().px())
        }
    };
    let (count, column_width) = crate::multicol::column_geometry(available, count, width, gap)?;
    Some((count, column_width, gap))
}

/// The multi-column containers of the document, outermost only (one inside another is laid out
/// in one column, a documented limit of [`crate::multicol`]), with their column geometry from
/// the current layout.
fn multicol_containers(
    doc: &BaseDocument,
    column_fill: &std::collections::HashMap<NodeId, bool>,
) -> Vec<MulticolNode> {
    use style::values::generics::length::GenericSize;
    let mut out = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        let found = node
            .primary_styles()
            .filter(|_| node_has_layout_data(node))
            .and_then(|styles| {
                let available = content_box_width(node);
                let (count, column_width, gap) = multicol_geometry(&styles, available)?;
                let fill_auto = node
                    .attr(blitz_dom::local_name!("style"))
                    .and_then(|block| crate::break_css::declares(block).column_fill_auto)
                    .or_else(|| column_fill.get(&id).copied())
                    .unwrap_or(false);
                Some(MulticolNode {
                    id,
                    fill_auto,
                    auto_height: matches!(styles.get_position().height, GenericSize::Auto),
                    count,
                    column_width,
                    gap,
                })
            });
        if let Some(found) = found {
            out.push(found);
            continue;
        }
        // DOM children in reverse so the stack pops them in document order.
        for &child in node.children.iter().rev() {
            stack.push(child);
        }
    }
    out
}

/// Lay the multi-column containers out one column wide (see [`crate::multicol`]): each
/// container's content box is narrowed to its column width by moving the difference into its
/// inline-end padding, so its border box (its background), its padding box (which positions its
/// absolutely positioned children) and the layout around it are unchanged; a content-sized
/// (`height: auto`) container then gets its balanced column height
/// ([`crate::multicol::balanced_height`]), so what follows it is laid out below its columns.
/// Each step is a computed-style edit and a full re-layout, as [`apply_float_fixups`].
///
/// Not a Blitz-bug compensation: Blitz 0.3.0-beta.4 has no multi-column layout (Stylo computes
/// `column-count` / `column-width`, which blitz-dom and Taffy 0.15.0 never read). CANARY:
/// `raw_blitz_tests.rs` `blitz_still_lays_multicol_out_in_one_column` fails when Blitz lays
/// columns out itself; then delete this function, [`crate::multicol`] and their tests.
fn lay_out_multicol(
    doc: &mut BaseDocument,
    column_fill: &std::collections::HashMap<NodeId, bool>,
    lines: &LineRules,
) -> Vec<MulticolNode> {
    use style::values::computed::{Length, LengthPercentage, MaxSize, Size};
    let px = |v: f64| {
        style::values::generics::NonNegative(LengthPercentage::new_length(Length::new(v as f32)))
    };
    let mut containers = multicol_containers(doc, column_fill);
    if containers.is_empty() {
        return containers;
    }
    for mc in &mut containers {
        let Some(node) = doc.get_node(mc.id) else {
            continue;
        };
        let layout = *node.unrounded_layout();
        let Some(styles) = node.primary_styles() else {
            continue;
        };
        let rtl = styles.clone_direction() == style::computed_values::direction::T::Rtl;
        let available = content_box_width(node);
        // A shrink-to-fit container (`width: auto` on an absolutely positioned, floated or
        // inline-block box) was sized to its content's width as one column; its columns are
        // each that wide (CSS Multi-column Layout 1 §3.4 with the intrinsic sizes of Blink's
        // multicol: N columns of the content's size, plus the gaps), capped by its containing
        // block's content box.
        let shrink_to_fit = matches!(
            styles.get_position().width,
            style::values::generics::length::GenericSize::Auto
        ) && (styles.clone_position().is_absolutely_positioned()
            || !matches!(styles.clone_float(), style::computed_values::float::T::None)
            || styles.get_box().display.outside()
                == style::values::specified::box_::DisplayOutside::Inline);
        let column_count = match styles.get_column().column_count {
            style::values::generics::column::ColumnCount::Integer(n) => Some(n.0.max(1) as u32),
            style::values::generics::column::ColumnCount::Auto => None,
        };
        let content = match column_count {
            Some(n) if shrink_to_fit => {
                let wanted = f64::from(n) * available + f64::from(n - 1) * mc.gap;
                let frame = f64::from(layout.size.width) - available;
                let cap = node
                    .containing_block()
                    .and_then(|cb| doc.get_node(cb))
                    .filter(|cb| node_has_layout_data(cb))
                    .map_or(f64::INFINITY, |cb| content_box_width(cb) - frame);
                wanted.min(cap).max(available)
            }
            _ => available,
        };
        drop(styles);
        if content != available {
            if let Some((count, width, gap)) = node
                .primary_styles()
                .and_then(|styles| multicol_geometry(&styles, content))
            {
                mc.count = count;
                mc.column_width = width;
                mc.gap = gap;
            }
        }
        let extra = (content - mc.column_width).max(0.0);
        let border_box = f64::from(layout.size.width) + (content - available);
        let end_padding = f64::from(if rtl {
            layout.padding.left
        } else {
            layout.padding.right
        });
        let column_width = mc.column_width;
        mutate_primary_style(doc, mc.id, |values| {
            let border_sizing = values.get_position().box_sizing
                == style::computed_values::box_sizing::T::BorderBox;
            let padding = px(end_padding + extra);
            if rtl {
                values.mutate_padding().set_padding_left(padding);
            } else {
                values.mutate_padding().set_padding_right(padding);
            }
            let width = if border_sizing {
                border_box
            } else {
                column_width
            };
            let position = values.mutate_position();
            position.set_width(Size::LengthPercentage(px(width)));
            position.set_min_width(Size::Auto);
            position.set_max_width(MaxSize::None);
        });
    }
    doc.set_incremental_layout(false);
    doc.resolve(0.0);

    // The balanced height of each content-sized container, from its one-column layout.
    let balanced: Vec<(NodeId, f64)> = containers
        .iter()
        .filter(|mc| mc.auto_height)
        .filter_map(|mc| {
            let subtree = walk_subtree(doc, mc.id);
            let spec = multicol_spec(doc, mc, &subtree, lines)?;
            Some((
                mc.id,
                crate::multicol::balanced_height(&subtree, &spec, mc.fill_auto),
            ))
        })
        .collect();
    if balanced.is_empty() {
        return containers;
    }
    for &(id, height) in &balanced {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        let layout = *node.unrounded_layout();
        let frame = f64::from(
            layout.border.top + layout.border.bottom + layout.padding.top + layout.padding.bottom,
        );
        mutate_primary_style(doc, id, |values| {
            let border_sizing = values.get_position().box_sizing
                == style::computed_values::box_sizing::T::BorderBox;
            let h = if border_sizing {
                height + frame
            } else {
                height
            };
            values
                .mutate_position()
                .set_height(Size::LengthPercentage(px(h)));
        });
    }
    doc.resolve(0.0);
    containers
}

/// The laid-out subtree of `id` as the render walk reads it (absolute coordinates, `id` first),
/// for the balancing of [`lay_out_multicol`]: a throwaway walk, no break rules, no images.
fn walk_subtree(doc: &BaseDocument, id: NodeId) -> Vec<LaidOutBox> {
    let mut out = Vec::new();
    let mut face_cache = std::collections::HashMap::new();
    let images = std::collections::HashMap::new();
    let mut img = ImageResolve {
        images: &images,
        base_url: None,
        img_ordinal: std::collections::HashMap::new(),
        first_unresolved: None,
    };
    let breaks = BreakTargets::default();
    let collapsed = CollapsedBorders::default();
    let mut sink = WalkSink {
        out: &mut out,
        face_cache: &mut face_cache,
        img: &mut img,
        breaks: &breaks,
        origins: std::collections::HashMap::new(),
        reader_compensations: true,
        collapsed: &collapsed,
        tiers: std::collections::HashMap::new(),
        stacks: std::collections::HashMap::new(),
        canvas_source: None,
        svg_fonts: None,
        line_spans: std::collections::HashMap::new(),
    };
    walk_box(doc, id, 0, &mut sink);
    out
}

/// The unrounded absolute x of `id`'s border box: Taffy's `unrounded_layout` locations summed up
/// its containing-block chain (the chain [`box_origin`] sums the rounded ones of).
fn unrounded_abs_x(doc: &BaseDocument, id: NodeId) -> f64 {
    let mut x = 0.0_f64;
    let mut current = Some(id);
    while let Some(cur) = current {
        let Some(n) = doc.get_node(cur) else {
            break;
        };
        if node_has_layout_data(n) {
            x += f64::from(n.unrounded_layout().location.x);
        }
        current = n.containing_block();
    }
    x
}

/// The `orphans` / `widows` declarations of the document
/// ([`crate::break_css::BreakRules::orphans`], inline `style` included), resolved per element
/// with inheritance (both inherit).
#[derive(Default)]
struct LineRules {
    orphans: std::collections::HashMap<NodeId, u32>,
    widows: std::collections::HashMap<NodeId, u32>,
}

impl LineRules {
    fn new(base: &BaseDocument, orphans: &[(&str, u32)], widows: &[(&str, u32)]) -> Self {
        let matched = |rules: &[(&str, u32)]| {
            let mut out = std::collections::HashMap::new();
            for (selector, value) in rules {
                if let Ok(nodes) = base.query_selector_all(selector) {
                    for node in nodes {
                        out.insert(node, *value);
                    }
                }
            }
            out
        };
        Self {
            orphans: matched(orphans),
            widows: matched(widows),
        }
    }

    /// `orphans` (`true`) or `widows` of `id`: its own declaration (inline `style` first), else
    /// its nearest ancestor's; `None` when nothing declares it (the initial value, 2).
    fn inherited(&self, doc: &BaseDocument, id: NodeId, orphans: bool) -> Option<u32> {
        let map = if orphans { &self.orphans } else { &self.widows };
        let mut current = Some(id);
        while let Some(cur) = current {
            let node = doc.get_node(cur)?;
            let inline = node
                .attr(blitz_dom::local_name!("style"))
                .and_then(|block| {
                    let hints = crate::break_css::declares(block);
                    if orphans {
                        hints.orphans
                    } else {
                        hints.widows
                    }
                });
            if let Some(value) = inline.or_else(|| map.get(&cur).copied()) {
                return Some(value);
            }
            current = node.parent;
        }
        None
    }
}

/// Whether `node` is `ancestor` or one of its DOM descendants.
fn is_dom_descendant(doc: &BaseDocument, node: NodeId, ancestor: NodeId) -> bool {
    let mut current = Some(node);
    while let Some(id) = current {
        if id == ancestor {
            return true;
        }
        current = doc.get_node(id).and_then(|n| n.parent);
    }
    false
}

/// The [`crate::multicol::Multicol`] of a laid-out container: its column geometry, content-box
/// top and height from Blitz's final layout, the absolutely positioned boxes positioned against
/// it or an ancestor, and the unrounded edges of its subtree. `boxes` holds the walked container
/// box (the render walk, or [`walk_subtree`]).
fn multicol_spec(
    doc: &BaseDocument,
    mc: &MulticolNode,
    boxes: &[LaidOutBox],
    lines: &LineRules,
) -> Option<crate::multicol::Multicol> {
    let node = doc.get_node(mc.id)?;
    let layout = *node.final_layout();
    let raw = mc.id.as_u64() as usize;
    let top = boxes.iter().find(|b| b.node_id == raw)?.y;
    let content_top = top + f64::from(layout.border.top + layout.padding.top);
    let height = f64::from(
        layout.size.height
            - layout.border.top
            - layout.border.bottom
            - layout.padding.top
            - layout.padding.bottom,
    )
    .max(0.0);
    let rtl = node
        .primary_styles()
        .is_some_and(|s| s.clone_direction() == style::computed_values::direction::T::Rtl);
    let mut positioned_outside = std::collections::HashSet::new();
    let mut positioned_cb = std::collections::HashMap::new();
    let mut orphans_widows = std::collections::HashMap::new();
    let mut unrounded_x = std::collections::HashMap::new();
    let mut stack = vec![mc.id];
    while let Some(id) = stack.pop() {
        let Some(n) = doc.get_node(id) else {
            continue;
        };
        if node_has_layout_data(n) {
            let x = unrounded_abs_x(doc, id);
            let w = f64::from(n.unrounded_layout().size.width);
            unrounded_x.insert(id.as_u64() as usize, (x, x + w));
        }
        let declared = (
            lines.inherited(doc, id, true),
            lines.inherited(doc, id, false),
        );
        if declared != (None, None) {
            orphans_widows.insert(id.as_u64() as usize, declared);
        }
        if id != mc.id && is_out_of_flow(n) {
            // Positioned against the container or an ancestor of it: not in a column.
            let in_columns = n
                .containing_block()
                .is_some_and(|cb| cb != mc.id && is_dom_descendant(doc, cb, mc.id));
            if !in_columns {
                positioned_outside.insert(id.as_u64() as usize);
            } else if let Some(cb) = n.containing_block() {
                positioned_cb.insert(id.as_u64() as usize, cb.as_u64() as usize);
            }
        }
        if let Some(children) = n.layout_children.borrow().as_ref() {
            stack.extend(children.iter().copied());
        }
    }
    Some(crate::multicol::Multicol {
        node_id: raw,
        count: mc.count,
        column_width: mc.column_width,
        gap: mc.gap,
        content_top,
        height,
        fill_auto: mc.fill_auto,
        content_sized: mc.auto_height,
        rtl,
        positioned_outside,
        positioned_cb,
        orphans_widows,
        unrounded_x,
    })
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

/// Chromium's cap on the lines it balances (MDN `text-wrap` "balance": "six or less for
/// Chromium"; the constant `kMaxLinesForBalance` used in Blink's `paragraph_line_breaker.cc` was
/// not read: UNVERIFIED value).
const MAX_LINES_FOR_BALANCE: usize = 6;

/// BLITZ GAP COMPENSATION (blitz-dom 0.3.0-beta.4 + stylo 0.22.0): `text-wrap: balance` is
/// ignored, lines are filled greedily.
///
/// - Spec: CSS Text 4 §6.1 `text-wrap-style: balance`: line breaks are chosen so the remaining
///   space is balanced across the lines of the block. Chrome 155 (Blink
///   `ParagraphLineBreaker::AttemptParagraphBalancing`, `paragraph_line_breaker.cc`) bisects the
///   available width for the narrowest one that keeps the greedy line count, then lays the lines
///   out at that width; alignment stays within the full line box (WPT
///   `css/css-text/white-space/text-wrap-balance-align-001.html` passes in Chrome).
/// - Blitz: Stylo parses `text-wrap-style` and the `text-wrap` shorthand for Gecko only (stylo
///   0.22.0 `properties/longhands.toml` 4008-4014 and `properties/shorthands.toml` 551-554:
///   `engine = "gecko"`), so the declaration is dropped and Blitz breaks every line with the full
///   width (`layout/inline.rs` 666-668 / 677-683 of blitz-dom 0.3.0-beta.4). Repro (WPT
///   `text-wrap-balance-text-indent-001.html`): Ahem 10 px, `width: 10ch`, `text-indent: 5ch`,
///   "01 34 6 89 12 3 56": Blitz lines "01 34 " / "6 89 12 3 " / "56", Chrome "01" / "34 6 89" /
///   "12 3 56" (the greedy count 3 at a 70 px width).
/// - Correction, after layout: the declarations are read by vellora (`break_css`, selectors
///   matched with Stylo; an inline `style` wins, an element inherits its parent's decision); for
///   each such inline root, the Parley layout is re-broken at the narrowest width (bisected to
///   1/64 px) that keeps its line count, then left-aligned again. Only when nothing else would
///   move: an ltr root whose lines are all physically left-aligned, with 2 to
///   [`MAX_LINES_FOR_BALANCE`] lines, no inline boxes, no forced break, no emergency (in-word)
///   break, every line at the same inline offset and width, Blitz's breaks equal to a plain
///   full-width re-break, no floated element anywhere in the document (Chrome leaves a paragraph
///   beside a float unbalanced: WPT `text-wrap-balance-float-006.html`), no `line-clamp` (Blitz
///   does not clamp), and the re-broken lines keep every baseline (else the original layout is
///   kept). Box sizes are untouched (same line count, same line heights).
///
/// WHEN BLITZ SUPPORTS `text-wrap: balance`, DELETE this function, `rebalance_layout`,
/// `MAX_LINES_FOR_BALANCE`, its call in [`resolve_and_walk`], the `wrap_*` parts of
/// `src/break_css.rs`, the canary `blitz_still_wraps_balanced_text_greedily`
/// (`src/raw_blitz_tests.rs`) and the `balance_*` tests there.
fn balance_text_wrap(doc: &mut BaseDocument, breaks: &crate::break_css::BreakRules) {
    let (balance, unbalance) = {
        let device = doc.stylist_device();
        breaks.applicable_wrap(|query| media_query_matches(device, query))
    };
    let base: &BaseDocument = doc;
    let balance = matched_nodes(base, &balance);
    let unbalance = matched_nodes(base, &unbalance);
    let mut roots = Vec::new();
    let mut has_float = false;
    let mut stack = vec![(base.root_element().id, false)];
    while let Some((id, inherited)) = stack.pop() {
        let Some(node) = base.get_node(id) else {
            continue;
        };
        has_float |= node
            .primary_styles()
            .is_some_and(|s| !matches!(s.clone_float(), style::computed_values::float::T::None));
        let inline = node
            .attr(blitz_dom::local_name!("style"))
            .and_then(|s| crate::break_css::declares(s).wrap_balance);
        let on = inline.unwrap_or(match (balance.contains(&id), unbalance.contains(&id)) {
            (true, false) => true,
            (false, true) | (true, true) => false,
            (false, false) => inherited,
        });
        if on && node.flags.is_inline_root() {
            roots.push(id);
        }
        let layout_children: Vec<NodeId> = node
            .layout_children
            .borrow()
            .as_ref()
            .map(|c| c.iter().copied().collect())
            .unwrap_or_default();
        let mut children: Vec<NodeId> = node.children.iter().copied().collect();
        children.extend(
            layout_children
                .into_iter()
                .filter(|c| !node.children.contains(c)),
        );
        stack.extend(children.into_iter().rev().map(|c| (c, on)));
    }
    if has_float {
        return;
    }
    for id in roots {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        if !matches!(inline_align(node), InlineAlign::Left)
            || node.primary_styles().is_none_or(|s| {
                matches!(
                    s.clone_direction(),
                    style::computed_values::direction::T::Rtl
                ) || matches!(
                    s.clone_text_align(),
                    style::values::specified::TextAlignKeyword::Justify
                ) || !matches!(
                    s.clone_text_wrap_mode(),
                    style::computed_values::text_wrap_mode::T::Wrap
                )
            })
        {
            continue;
        }
        let Some(node) = doc.get_node_mut(id) else {
            continue;
        };
        let Some(text_layout) = node
            .data
            .downcast_element_mut()
            .and_then(|el| el.inline_layout_data.as_mut())
        else {
            continue;
        };
        if let Some(balanced) = rebalance_layout(&text_layout.layout) {
            text_layout.layout = balanced;
        }
    }
}

/// `layout` re-broken at the narrowest width that keeps its line count ([`balance_text_wrap`]),
/// or `None` when it does not qualify or would move a line.
fn rebalance_layout<B: parley::Brush>(layout: &parley::Layout<B>) -> Option<parley::Layout<B>> {
    let lines: Vec<parley::LineMetrics> = layout.lines().map(|l| *l.metrics()).collect();
    let n = lines.len();
    if !(2..=MAX_LINES_FOR_BALANCE).contains(&n)
        || layout.inline_boxes().len() > 0
        || layout.is_rtl()
        || layout
            .lines()
            .any(|l| l.break_reason() == parley::BreakReason::Explicit)
    {
        return None;
    }
    let first = lines[0];
    if lines.iter().any(|m| {
        m.inline_min_coord != first.inline_min_coord || m.inline_max_coord != first.inline_max_coord
    }) || first.inline_min_coord != 0.0
    {
        return None;
    }
    let full = first.inline_max_coord;
    let ranges = |l: &parley::Layout<B>| -> Vec<std::ops::Range<usize>> {
        l.lines().map(|line| line.text_range()).collect()
    };
    // Blitz's own breaking must be what a plain full-width break gives (no float shortened a
    // line, nothing else placed one): else the layout is left alone.
    let mut replay = layout.clone();
    replay.break_all_lines(Some(full));
    if ranges(&replay) != ranges(layout) {
        return None;
    }
    let emergency = |l: &parley::Layout<B>| {
        l.lines()
            .any(|line| line.break_reason() == parley::BreakReason::Emergency)
    };
    if emergency(layout) {
        return None;
    }
    // A width qualifies when it keeps `n` lines without breaking inside a word (Chrome keeps
    // "CONTROLLING" whole under `overflow-wrap: break-word`: WPT
    // `text-wrap-balance-overflow-001.html`).
    let qualifies = |width: f32| {
        let mut probe = layout.clone();
        probe.break_all_lines(Some(width));
        probe.len() <= n && !emergency(&probe)
    };
    // The narrowest qualifying width: `upper` always qualifies, `lower` never.
    let (mut lower, mut upper) = (0.0f32, full);
    const EPSILON: f32 = 1.0 / 64.0;
    while lower + EPSILON < upper {
        let mid = (lower + upper) / 2.0;
        if !qualifies(mid) {
            lower = mid;
        } else {
            upper = mid;
        }
    }
    if upper >= full {
        return None;
    }
    let mut balanced = layout.clone();
    balanced.break_all_lines(Some(upper));
    balanced.align(parley::Alignment::Left, parley::AlignmentOptions::default());
    let same_lines = balanced.len() == n
        && balanced
            .lines()
            .zip(&lines)
            .all(|(l, m)| l.metrics().baseline == m.baseline && l.metrics().offset == m.offset);
    same_lines.then_some(balanced)
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

/// Blitz bug compensation (Phase C step 06): the anonymous table objects of CSS 2.2 §17.2.1 and
/// the table wrapper box of §17.4, which blitz-dom 0.3.0-beta.4 does not build.
///
/// - Blitz: `collect_table_cells` (`layout/table.rs` in the cargo registry source of blitz-dom
///   0.3.0-beta.4) keeps a table's row groups, rows and cells only. A non-element child (text)
///   is dropped at 531-533 (`if !node.is_element() { return; }`), and an element child whose
///   display is `Flow | FlowRoot | Flex | Grid` is dropped at 738-748 ("Probably a table
///   caption: ignore"). `display: table-caption` computes to outside `TableCaption`, inside
///   `Flow` (stylo 0.22.0 `values/specified/box.rs` 258-259), so a caption takes that arm too.
///   `layout/construct.rs` 589-595 says it: "Blitz does not yet generate anonymous table wrapper
///   boxes". Neither child is in the table's layout children (`build_table_context`, 413-417), so
///   Taffy never lays it out: it keeps a 0x0 layout and paints nothing.
/// - Repro (raw canary `blitz_still_drops_table_captions_and_non_cell_children`,
///   `src/raw_blitz_tests.rs`): `<div style="display:table"><div style="display:table-caption;
///   height:30px">C</div><div style="height:40px">D</div></div>`: raw Blitz lays both children out
///   0x0 and the table 0 px tall; Chrome 155 draws the caption (30 px) above an anonymous row
///   holding D (40 px), 70 px in all. WPT css/css-break/table/caption-margin-002 / -005 and
///   monolithic-overflow-001.tentative fail on it (Chrome passes all three; they passed while
///   vellora had no multi-column layout only because the one-column render covered the red).
/// - Correction, between the cascade and box construction, in the DOM Blitz builds its boxes
///   from (every node keeps its computed style; the new nodes get the anonymous-box style, the
///   parent's inherited properties and initial values for the rest, §17.2.1):
///   1. [`wrap_table_children`]: a run of consecutive children of a table or row group that are
///      not proper table children (§17.2.1 rule 2) goes into a new anonymous `table-row`, and a
///      run of consecutive children of a row that are not cells into a new anonymous
///      `table-cell`. White space between them stays in the run; white space next to a proper
///      child stays where it is (Blitz drops it, §17.2.1 rule 1).
///   2. [`wrap_table_captions`]: a table with in-flow captions gets a new wrapper box in its
///      place (§17.4): a block formatting context holding the `caption-side: top` captions, the
///      table, then the `bottom` ones, each side in document order. The wrapper takes the
///      table's margins, `position` and offsets, `z-index`, `float` and `clear`; the table keeps
///      the rest. Its width is the table's: a percentage width moves to the wrapper (the table
///      then fills it), else the wrapper shrinks to fit (`fit-content`) and the table is at least
///      as wide as it. An auto-width caption takes the wrapper's width without widening it.
///
///   The selector-derived sets of the render (break rules, `column-fill`, `orphans` / `widows`)
///   are matched before this, on the source DOM, so the new nodes match no rule
///   ([`resolve_and_walk`]). The new nodes are `div` (wrapper), `tr` and `td` elements with no
///   attributes: vellora's table passes read rows and cells by tag.
/// - Not modelled: a caption's min-content inline size widening the table (CSS Tables 3 §3.9:
///   an auto-width caption never widens it here), the missing-parent rule (§17.2.1 rule 3: rows
///   and cells outside a table stay as Blitz lays them out), `display: contents` children of a
///   table, and an `inline-table`'s baseline (its wrapper is an `inline-block`).
///
/// The table's break properties and page name move to its wrapper
/// ([`BreakTargets::move_to_wrapper`]).
///
/// WHEN BLITZ FIXES THIS, DELETE this function, [`wrap_table_children`],
/// [`wrap_table_captions`], [`anonymous_element`], [`flow_root_display`],
/// [`BreakTargets::move_to_wrapper`], their call in [`resolve_and_walk`] (and the early selector
/// matching kept for it there), the canary
/// `blitz_still_drops_table_captions_and_non_cell_children` (`src/raw_blitz_tests.rs`), which
/// fails as soon as raw Blitz lays either child out, and the tests
/// `anonymous_table_objects_*` there; then re-run WPT css/css-tables, css/CSS2/tables and
/// css/css-break.
fn build_anonymous_table_objects(doc: &mut BaseDocument) -> Vec<(NodeId, NodeId)> {
    use style::values::specified::box_::DisplayInside;
    let mut tables = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        if node.is_element()
            && node
                .primary_styles()
                .is_some_and(|s| s.clone_display().inside() == DisplayInside::Table)
        {
            tables.push(id);
        }
        stack.extend(node.children.iter().rev().copied());
    }
    let mut wrappers = Vec::new();
    for table in tables {
        wrap_table_children(doc, table, TablePart::Table);
        if let Some(wrapper) = wrap_table_captions(doc, table) {
            wrappers.push((wrapper, table));
        }
    }
    wrappers
}

/// The table box a child belongs to, for [`wrap_table_children`].
#[derive(Clone, Copy, PartialEq, Eq)]
enum TablePart {
    Table,
    RowGroup,
    Row,
}

/// How [`wrap_table_children`] treats one child of a [`TablePart`].
#[derive(Clone, Copy, PartialEq, Eq)]
enum TableChild {
    /// A box Blitz reads in this part (a row group or row of a table, a row of a row group, a
    /// cell of a row), or a caption of a table (left to [`wrap_table_captions`]).
    Proper,
    /// No box of its own here: white space, a comment, `display: none`, an absolutely
    /// positioned box (Blitz lays those out as the table's out-of-flow children), `display:
    /// contents` (Blitz reads through it), a column, a misparented row group, row or caption.
    Ignored,
    /// Anything else: wrapped (§17.2.1 rule 2).
    Misparented,
}

fn classify_table_child(node: &blitz_dom::Node, part: TablePart) -> TableChild {
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    if let blitz_dom::NodeData::Text(text) = &node.data {
        return if text.content.chars().all(|c| c.is_ascii_whitespace()) {
            TableChild::Ignored
        } else {
            TableChild::Misparented
        };
    }
    if !node.is_element() {
        return TableChild::Ignored;
    }
    let Some(styles) = node.primary_styles() else {
        return TableChild::Ignored;
    };
    let display = styles.clone_display();
    if display.outside() == DisplayOutside::None
        || display.inside() == DisplayInside::Contents
        || styles.clone_position().is_absolutely_positioned()
    {
        return TableChild::Ignored;
    }
    let inside = display.inside();
    if matches!(
        inside,
        DisplayInside::TableColumn | DisplayInside::TableColumnGroup
    ) {
        return TableChild::Ignored;
    }
    let proper = match part {
        TablePart::Table => {
            matches!(
                inside,
                DisplayInside::TableRowGroup
                    | DisplayInside::TableHeaderGroup
                    | DisplayInside::TableFooterGroup
                    | DisplayInside::TableRow
            ) || display.outside() == DisplayOutside::TableCaption
        }
        TablePart::RowGroup => inside == DisplayInside::TableRow,
        TablePart::Row => inside == DisplayInside::TableCell,
    };
    if proper {
        return TableChild::Proper;
    }
    // A row group, row or caption where it is not a proper child (a row group in a row group or
    // a row, a row in a row, a caption in either) would get an anonymous table of its own
    // (§17.2.1 rule 3, not modelled): left out, as Blitz leaves it (Chrome 155 paints nothing for
    // the empty ones of WPT css/CSS2/tables/empty-cells-applies-to-008..011 and -017).
    let internal = matches!(
        inside,
        DisplayInside::TableRowGroup
            | DisplayInside::TableHeaderGroup
            | DisplayInside::TableFooterGroup
            | DisplayInside::TableRow
    ) || display.outside() == DisplayOutside::TableCaption;
    if internal {
        TableChild::Ignored
    } else {
        TableChild::Misparented
    }
}

/// §17.2.1 rule 2 for one table, row group or row (see [`build_anonymous_table_objects`]):
/// each run of misparented children goes into a new anonymous row (in a table or row group,
/// whose own misparented children then go into anonymous cells) or cell (in a row). Recurses into
/// the row groups and rows. A part with no misparented child is left as it is.
fn wrap_table_children(doc: &mut BaseDocument, parent: NodeId, part: TablePart) {
    use style::values::specified::box_::DisplayInside;
    let Some(node) = doc.get_node(parent) else {
        return;
    };
    let children: Vec<NodeId> = node.children.iter().copied().collect();
    let kinds: Vec<TableChild> = children
        .iter()
        .map(|&id| {
            doc.get_node(id)
                .map_or(TableChild::Ignored, |c| classify_table_child(c, part))
        })
        .collect();
    // The proper children's own parts, wrapped after this level.
    let mut parts = Vec::new();
    if part != TablePart::Row {
        for (&id, &kind) in children.iter().zip(&kinds) {
            if kind != TableChild::Proper {
                continue;
            }
            let inside = doc
                .get_node(id)
                .and_then(|n| n.primary_styles().map(|s| s.clone_display().inside()));
            match inside {
                Some(
                    DisplayInside::TableRowGroup
                    | DisplayInside::TableHeaderGroup
                    | DisplayInside::TableFooterGroup,
                ) => parts.push((id, TablePart::RowGroup)),
                Some(DisplayInside::TableRow) => parts.push((id, TablePart::Row)),
                _ => {}
            }
        }
    }
    if kinds.contains(&TableChild::Misparented) {
        let (local, display, inner) = match part {
            TablePart::Row => (
                blitz_dom::local_name!("td"),
                style::values::computed::Display::TableCell,
                None,
            ),
            TablePart::Table | TablePart::RowGroup => (
                blitz_dom::local_name!("tr"),
                style::values::computed::Display::TableRow,
                Some(TablePart::Row),
            ),
        };
        let mut out = Vec::with_capacity(children.len());
        let mut run: Vec<NodeId> = Vec::new();
        // Ignored children after the open run: they join it if another misparented child
        // follows, else they stay outside.
        let mut pending: Vec<NodeId> = Vec::new();
        let mut wrappers = Vec::new();
        let flush = |doc: &mut BaseDocument,
                     out: &mut Vec<NodeId>,
                     run: &mut Vec<NodeId>,
                     wrappers: &mut Vec<NodeId>| {
            if run.is_empty() {
                return;
            }
            if let Some(anon) = anonymous_element(doc, parent, local.clone(), display) {
                for &child in run.iter() {
                    if let Some(c) = doc.get_node_mut(child) {
                        c.parent = Some(anon);
                    }
                }
                if let Some(a) = doc.get_node_mut(anon) {
                    a.children = run.drain(..).collect();
                }
                out.push(anon);
                wrappers.push(anon);
            } else {
                out.append(run);
            }
        };
        for (&id, &kind) in children.iter().zip(&kinds) {
            match kind {
                TableChild::Misparented => {
                    run.append(&mut pending);
                    run.push(id);
                }
                TableChild::Ignored if !run.is_empty() => pending.push(id),
                _ => {
                    flush(doc, &mut out, &mut run, &mut wrappers);
                    out.append(&mut pending);
                    out.push(id);
                }
            }
        }
        flush(doc, &mut out, &mut run, &mut wrappers);
        out.append(&mut pending);
        if let Some(n) = doc.get_node_mut(parent) {
            n.children = out.into_iter().collect();
        }
        if let Some(inner) = inner {
            for anon in wrappers {
                wrap_table_children(doc, anon, inner);
            }
        }
    }
    for (id, part) in parts {
        wrap_table_children(doc, id, part);
    }
}

/// §17.4 for one table (see [`build_anonymous_table_objects`]): a wrapper box in the table's
/// place holds its in-flow captions and the table. A table without captions is left as it is.
fn wrap_table_captions(doc: &mut BaseDocument, table: NodeId) -> Option<NodeId> {
    use style::computed_values::caption_side::T as CaptionSide;
    use style::values::computed::{Display, LengthPercentage, Size};
    use style::values::generics::length::{GenericMargin, GenericSize};
    use style::values::generics::NonNegative;
    use style::values::specified::box_::DisplayOutside;
    let node = doc.get_node(table)?;
    let parent = node.parent?;
    let (mut top, mut bottom) = (Vec::new(), Vec::new());
    for &child in &node.children {
        let Some(styles) = doc.get_node(child).and_then(|c| c.primary_styles()) else {
            continue;
        };
        if styles.clone_display().outside() != DisplayOutside::TableCaption
            || styles.clone_position().is_absolutely_positioned()
        {
            continue;
        }
        match styles.clone_caption_side() {
            CaptionSide::Bottom => bottom.push(child),
            _ => top.push(child),
        }
    }
    if top.is_empty() && bottom.is_empty() {
        return None;
    }
    let table_style = node.primary_styles().map(|s| (**s).clone())?;
    let inline = table_style.clone_display().outside() == DisplayOutside::Inline;
    let percent_width = match &table_style.get_position().width {
        GenericSize::LengthPercentage(NonNegative(lp)) if lp.has_percentage() => Some(lp.clone()),
        _ => None,
    };
    let wrapper = anonymous_element(
        doc,
        table,
        blitz_dom::local_name!("div"),
        if inline {
            Display::InlineBlock
        } else {
            flow_root_display()
        },
    )?;
    // The wrapper takes the table's outer properties.
    let t = &table_style;
    mutate_primary_style(doc, wrapper, |v| {
        *v.mutate_margin() = t.get_margin().clone();
        let b = v.mutate_box();
        b.set_position(t.clone_position());
        b.set_float(t.clone_float());
        b.set_clear(t.clone_clear());
        let p = v.mutate_position();
        p.set_top(t.clone_top());
        p.set_right(t.clone_right());
        p.set_bottom(t.clone_bottom());
        p.set_left(t.clone_left());
        p.set_z_index(t.clone_z_index());
        p.set_width(match &percent_width {
            Some(lp) => Size::LengthPercentage(NonNegative(lp.clone())),
            None => Size::FitContent,
        });
    });
    // The table keeps the rest, in flow at the wrapper's content edge.
    mutate_primary_style(doc, table, |v| {
        let zero = GenericMargin::LengthPercentage(LengthPercentage::new_length(
            style::values::computed::Length::new(0.0),
        ));
        let m = v.mutate_margin();
        m.set_margin_top(zero.clone());
        m.set_margin_right(zero.clone());
        m.set_margin_bottom(zero.clone());
        m.set_margin_left(zero);
        let b = v.mutate_box();
        b.set_position(style::computed_values::position::T::Static);
        b.set_float(style::computed_values::float::T::None);
        b.set_clear(style::computed_values::clear::T::None);
        if inline {
            b.set_display(Display::Table);
        }
        let p = v.mutate_position();
        if percent_width.is_some() {
            p.set_width(Size::LengthPercentage(NonNegative(
                LengthPercentage::hundred_percent(),
            )));
        } else if matches!(p.min_width, GenericSize::Auto) {
            p.set_min_width(Size::LengthPercentage(NonNegative(
                LengthPercentage::hundred_percent(),
            )));
        }
    });
    // An auto-width caption fills the wrapper without widening it: no inline size of its own,
    // a minimum of the wrapper's content width less its own margins, borders and padding.
    for &caption in top.iter().chain(&bottom) {
        mutate_primary_style(doc, caption, |v| {
            if !matches!(v.get_position().width, GenericSize::Auto) {
                return;
            }
            let length =
                |px: f32| LengthPercentage::new_length(style::values::computed::Length::new(px));
            let margin = |m: &style::values::computed::Margin| match m {
                GenericMargin::LengthPercentage(lp) => lp.clone(),
                _ => length(0.0),
            };
            let (border_left, border_right) = {
                let b = v.get_border();
                (
                    if b.border_left_style.none_or_hidden() {
                        0.0
                    } else {
                        b.border_left_width.0.to_f32_px()
                    },
                    if b.border_right_style.none_or_hidden() {
                        0.0
                    } else {
                        b.border_right_width.0.to_f32_px()
                    },
                )
            };
            let edges = [
                margin(&v.get_margin().margin_left),
                margin(&v.get_margin().margin_right),
                v.get_padding().padding_left.0.clone(),
                v.get_padding().padding_right.0.clone(),
                length(border_left),
                length(border_right),
            ];
            let min = LengthPercentage::hundred_percent_minus_list(
                &edges.iter().collect::<Vec<_>>(),
                style_traits::values::specified::AllowedNumericType::NonNegative,
            );
            let p = v.mutate_position();
            p.set_width(Size::LengthPercentage(NonNegative(length(0.0))));
            p.set_min_width(Size::LengthPercentage(NonNegative(min)));
        });
    }
    // The tree: the wrapper in the table's place, holding top captions, table, bottom captions.
    let parent_node = doc.get_node_mut(parent)?;
    for slot in parent_node.children.iter_mut() {
        if *slot == table {
            *slot = wrapper;
        }
    }
    let captions: std::collections::HashSet<NodeId> = top.iter().chain(&bottom).copied().collect();
    if let Some(t) = doc.get_node_mut(table) {
        t.children.retain(|c| !captions.contains(c));
        t.parent = Some(wrapper);
    }
    let held: Vec<NodeId> = top
        .iter()
        .copied()
        .chain([table])
        .chain(bottom.iter().copied())
        .collect();
    for &id in &held {
        if id != table {
            if let Some(c) = doc.get_node_mut(id) {
                c.parent = Some(wrapper);
            }
        }
    }
    if let Some(w) = doc.get_node_mut(wrapper) {
        w.parent = Some(parent);
        w.children = held.into_iter().collect();
    }
    Some(wrapper)
}

/// `display: flow-root`, parsed by Stylo (its servo build has no `Display::FlowRoot` constant).
fn flow_root_display() -> style::values::computed::Display {
    use style::context::QuirksMode;
    use style::parser::Parse;
    use style::stylesheets::{CssRuleType, Origin, UrlExtraData};
    let url = url::Url::parse("about:blank").expect("about:blank is a valid URL");
    let url_data = UrlExtraData::from(url);
    let context = style::parser::ParserContext::new(
        Origin::UserAgent,
        &url_data,
        Some(CssRuleType::Style),
        style_traits::ParsingMode::DEFAULT,
        QuirksMode::NoQuirks,
        Default::default(),
        None,
        None,
        Default::default(),
    );
    let mut input = cssparser::Parser::new("flow-root");
    style::values::specified::Display::parse(&context, &mut input)
        .unwrap_or(style::values::computed::Display::Block)
}

/// A new element node for an anonymous box (see [`build_anonymous_table_objects`]): an HTML
/// `local` element with no attributes, `parent`'s child in the tree (the caller places it among
/// the children), styled as CSS 2.2 §17.2.1 styles an anonymous table box: `parent`'s inherited
/// properties, the initial value of every other property, and `display`. Its style is final:
/// the cascade has run, nothing restyles it (Blitz restyles damaged nodes only).
fn anonymous_element(
    doc: &mut BaseDocument,
    parent: NodeId,
    local: blitz_dom::LocalName,
    display: style::values::computed::Display,
) -> Option<NodeId> {
    let parent_style = doc.get_node(parent)?.primary_styles()?.clone();
    let in_document = doc
        .get_node(parent)?
        .flags
        .contains(blitz_dom::node::NodeFlags::IS_IN_DOCUMENT);
    let style = {
        let device = doc.stylist_device();
        let mut builder = style::properties::StyleBuilder::for_inheritance(
            device,
            None,
            Some(&parent_style),
            None,
        );
        builder.set_display(display);
        builder.build()
    };
    let id = doc.create_node(blitz_dom::NodeData::Element(Box::new(
        blitz_dom::ElementData::new(
            blitz_dom::QualName::new(None, blitz_dom::ns!(html), local),
            Vec::new(),
        ),
    )));
    let node = doc.get_node_mut(id)?;
    node.parent = Some(parent);
    if in_document {
        node.flags
            .insert(blitz_dom::node::NodeFlags::IS_IN_DOCUMENT);
    }
    let data = node.try_stylo_element_data_mut()?;
    let mut element = data.ensure_init_mut();
    element.styles.primary = Some(style);
    element.set_restyled();
    Some(id)
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

/// How a computed border style paints ([`crate::border_pattern`]): `dashed` and `dotted` as
/// segments, every other visible style solid.
fn line_style(style: style::values::specified::BorderStyle) -> crate::border_pattern::LineStyle {
    use crate::border_pattern::LineStyle;
    use style::values::specified::BorderStyle as B;
    match style {
        B::Dashed => LineStyle::Dashed,
        B::Dotted => LineStyle::Dotted,
        _ => LineStyle::Solid,
    }
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
        &[],
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
) -> Result<LaidOutDoc, GateRejection> {
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
) -> Result<LaidOutDoc, GateRejection> {
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
        return Err(GateRejection::Element(found));
    }
    // Before `resolve`: Blitz parses each inline SVG while it builds the boxes, and that parse
    // reads a non-`data:` image source from the host filesystem.
    if let Some(found) = find_external_svg_image(&doc) {
        return Err(GateRejection::Image(found));
    }
    Ok(resolve_and_walk(
        doc,
        content_width_px,
        content_height_px,
        images,
        base_url,
        fonts,
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
    fonts: &[Vec<u8>],
    breaks: &crate::break_css::BreakRules,
    font_ctx: parley::FontContext,
    observer: &mut O,
) -> LaidOutDoc {
    let (viewport, viewport_px) = layout_viewport(content_width_px, content_height_px);
    // The document was built with this viewport (`build_document_with`), so no device change
    // is queued here; kept so a document built otherwise still lays out against it.
    doc.set_viewport(viewport);
    // Ruby (no ruby layout in Blitz, see `crate::ruby`): each base wrapped before the cascade,
    // the columns placed after the first layout (`lay_out_ruby`). Off in the raw-Blitz render.
    let ruby_pairs = if O::VELLORA_CORRECTIONS {
        let pairs = wrap_ruby_bases(&mut doc);
        if !pairs.is_empty() {
            doc.add_user_agent_stylesheet(blitz_dom::UserAgentStylesheet::parse(RUBY_UA_CSS));
        }
        pairs
    } else {
        Vec::new()
    };
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
    // The selector-derived sets are matched on the source DOM, before
    // `build_anonymous_table_objects` adds its anonymous nodes (they match no rule) and moves
    // children under them; the raw-Blitz render matches them after layout, below.
    let mut early_matches = None;
    let mut collapsed = if O::VELLORA_CORRECTIONS {
        doc.resolve_stylist(0.0);
        let mut matches = match_break_selectors(&mut doc, breaks);
        for (wrapper, table) in build_anonymous_table_objects(&mut doc) {
            matches.targets.move_to_wrapper(&doc, wrapper, table);
        }
        early_matches = Some(matches);
        snap_lengths_to_layout_unit(&mut doc);
        size_svgs_like_chrome(&mut doc);
        hide_table_column_pseudos(&mut doc);
        ruby_containers_atomic(&mut doc, &ruby_pairs);
        compensate_collapsed_borders(&mut doc)
    } else {
        CollapsedBorders::default()
    };
    doc.resolve(0.0);
    if !ruby_pairs.is_empty() && lay_out_ruby(&mut doc, &ruby_pairs) {
        // Non-incremental, as for the float fix-ups below: the style edits are invisible to
        // Blitz's damage tracking.
        doc.set_incremental_layout(false);
        doc.resolve(0.0);
    }
    // Multi-column containers (no multi-column layout in Blitz): laid out one column wide, the
    // content-sized ones given their balanced height (`lay_out_multicol`); the columns are cut
    // after the walk (`crate::multicol::apply`). Off in the raw-Blitz render.
    let (multicols, line_rules) = match early_matches.as_mut() {
        Some(matches) => {
            let lines = std::mem::take(&mut matches.line_rules);
            let found = lay_out_multicol(&mut doc, &matches.column_fill, &lines);
            (found, lines)
        }
        None => (Vec::new(), LineRules::default()),
    };
    // Floats Blitz/Taffy let overlap what Chrome moves out of their way (two Blitz bugs, see
    // `float_avoidance_fixups`): read off this layout, written into the computed styles, and
    // laid out once more. Off in the raw-Blitz render.
    // Formatting-context roots Taffy keeps inside zero-width floats (a Taffy bug, see
    // `zero_width_float_margins`): their margins edited here, the horizontal shift applied by
    // the walk (`shifted`).
    let mut shifted: Vec<(NodeId, f64)> = Vec::new();
    if O::VELLORA_CORRECTIONS {
        let fixups = float_avoidance_fixups(&doc);
        // Floats the no-wrap fix-up already moves keep that edit, and roots the `clear` edit
        // moves keep theirs.
        let edited: std::collections::HashSet<NodeId> = fixups.iter().map(|f| f.0).collect();
        let wraps = trailing_float_wraps(&doc, &edited);
        let zero_width = zero_width_float_margins(&doc, &edited);
        if !fixups.is_empty() || !wraps.is_empty() || !zero_width.is_empty() {
            apply_float_fixups(&mut doc, &fixups);
            wrap_trailing_floats(&mut doc, &wraps);
            for &(id, [left, right], dx) in &zero_width {
                set_margins(
                    &mut doc,
                    id,
                    [None, right.map(f64::from), None, left.map(f64::from)],
                );
                shifted.push((id, dx));
            }
            // Non-incremental: the edits are invisible to Blitz's damage tracking, so the whole
            // tree is re-constructed and re-laid out (their styles, edited ones included, are
            // kept; the style pass has nothing to restyle).
            doc.set_incremental_layout(false);
            doc.resolve(0.0);
        }
    }
    // Inline-blocks Blitz aligns on their first line where Chrome uses the last (a Taffy bug,
    // see `inline_block_baseline_shifts`): their `vertical-align` raise edited and the document
    // laid out again, once per nesting level. Off in the raw-Blitz render.
    if O::VELLORA_CORRECTIONS {
        // Lookup only (DET-1): never iterated.
        let mut author_raises = std::collections::HashMap::new();
        for _ in 0..INLINE_BLOCK_BASELINE_ROUNDS {
            let shifts = inline_block_baseline_shifts(&doc, &mut author_raises);
            if shifts.is_empty() {
                break;
            }
            apply_baseline_shifts(&mut doc, &shifts);
            doc.set_incremental_layout(false);
            doc.resolve(0.0);
        }
    }
    collapsed_row_lines(&doc, &mut collapsed);
    // `text-wrap: balance` (not in Blitz's style system): re-break the lines it applies to.
    // Off in the raw-Blitz render.
    if O::VELLORA_CORRECTIONS {
        balance_text_wrap(&mut doc, breaks);
    }

    let break_targets = match early_matches {
        Some(matches) => matches.targets,
        None => match_break_selectors(&mut doc, breaks).targets,
    };
    let base: &BaseDocument = &doc;
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
    let canvas = canvas_background(base);
    let svg_fonts = SvgFonts::new(fonts);
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
            tiers: std::collections::HashMap::new(),
            stacks: std::collections::HashMap::new(),
            canvas_source: canvas.map(|(id, _)| id),
            svg_fonts: Some(&svg_fonts),
            line_spans: std::collections::HashMap::new(),
        };
        // The walk reads every box's position through `box_origin`'s memo: a shifted box's
        // entry, seeded here in tree order, moves its subtree with it.
        for &(id, dx) in &shifted {
            let (x, y) = box_origin(base, id, &mut sink.origins, sink.reader_compensations);
            sink.origins.insert(id, (x + dx, y));
        }
        walk_box(base, root_id, 0, &mut sink);
    }
    crate::break_css::resolve_break_after(&mut boxes);
    crate::break_css::resolve_column_break_after(&mut boxes);
    // The columns of every multi-column container (`lay_out_multicol` laid them out as one).
    if !multicols.is_empty() {
        let specs: Vec<crate::multicol::Multicol> = multicols
            .iter()
            .filter_map(|mc| multicol_spec(base, mc, &boxes, &line_rules))
            .collect();
        crate::multicol::apply(&mut boxes, &specs);
    }
    crate::break_css::resolve_named_page_breaks(&mut boxes);
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
                tag: "img",
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
        canvas_background: canvas.map(|(_, color)| color),
        root_rendered: root_rendered(base),
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
    /// The [`paint_tier`] memo. Lookup only, like `origins`.
    tiers: std::collections::HashMap<NodeId, u8>,
    /// [`paint_stack`]'s record: each positioned box of [`PAINT_TIER_POSITIONED`] walked so far,
    /// numbered from 1 in walk (tree) order. Lookup only, like `origins`.
    stacks: std::collections::HashMap<NodeId, u32>,
    /// The element whose background is the canvas background ([`canvas_background`]); its
    /// own box paints no background.
    canvas_source: Option<NodeId>,
    /// The fonts inline SVGs are parsed with ([`inline_svg_run`]); `None` in a throwaway walk
    /// ([`walk_subtree`]), which records each SVG's box without parsing it.
    svg_fonts: Option<&'a SvgFonts<'a>>,
    /// [`atomic_line_span`]'s memo: the absolute line-box span of every inline box of each
    /// inline root read so far (`None` for the roots themselves, once read). Lookup only.
    line_spans: std::collections::HashMap<NodeId, Option<(f64, f64)>>,
}

/// Node ids matched by the stylesheet's fragmentation rules
/// (see [`crate::break_css`]).
#[derive(Default)]
struct BreakTargets {
    avoid_inside: std::collections::HashSet<NodeId>,
    page_before: std::collections::HashSet<NodeId>,
    page_after: std::collections::HashSet<NodeId>,
    /// `break-before: column` / `break-after: column` from the stylesheet (Phase C step 05).
    column_before: std::collections::HashSet<NodeId>,
    column_after: std::collections::HashSet<NodeId>,
    /// `break-before: avoid` / `break-after: avoid` from the stylesheet (Phase C step 05).
    avoid_before: std::collections::HashSet<NodeId>,
    avoid_after: std::collections::HashSet<NodeId>,
    /// The `page` value each matched node gets from the stylesheet (`None` = `auto`).
    page_names: std::collections::HashMap<NodeId, Option<String>>,
    /// The `writing-mode` each matched node gets from the stylesheet (`true` = vertical).
    writing_modes: std::collections::HashMap<NodeId, bool>,
    /// Tables whose break properties (and page name) moved to their caption wrapper
    /// ([`BreakTargets::move_to_wrapper`]): their own inline `style` breaks are not read.
    moved_to_wrapper: std::collections::HashSet<NodeId>,
}

impl BreakTargets {
    /// A table's `break-before/after/inside` and `page` apply to its wrapper box once it has
    /// one ([`wrap_table_captions`]; CSS 2.2 §17.4: the wrapper is the table's outer box, and
    /// Chrome 155 keeps a `break-inside: avoid` table's caption with it, WPT
    /// css/CSS2/pagination/table-page-break-inside-avoid-7-print): the stylesheet matches and
    /// the inline `style` declarations of `table` move to `wrapper`.
    fn move_to_wrapper(&mut self, doc: &BaseDocument, wrapper: NodeId, table: NodeId) {
        let inline = doc
            .get_node(table)
            .and_then(|n| n.attr(blitz_dom::local_name!("style")))
            .map(|block| {
                (
                    crate::break_css::declares(block),
                    crate::break_css::declared_page(block),
                )
            });
        let (declared, page) = inline.unwrap_or_default();
        for (set, inline) in [
            (&mut self.avoid_inside, declared.avoid_inside),
            (&mut self.page_before, declared.page_before),
            (&mut self.page_after, declared.page_after),
            (&mut self.column_before, declared.column_before),
            (&mut self.column_after, declared.column_after),
            (&mut self.avoid_before, declared.avoid_before),
            (&mut self.avoid_after, declared.avoid_after),
        ] {
            if set.remove(&table) || inline {
                set.insert(wrapper);
            }
        }
        if let Some(name) = page.or_else(|| self.page_names.remove(&table)) {
            self.page_names.insert(wrapper, name);
        }
        self.page_names.remove(&table);
        self.moved_to_wrapper.insert(table);
    }
}

/// Every node set the render matches with selectors from vellora's own reading of the
/// stylesheets ([`crate::break_css::BreakRules`]): the break targets, `column-fill` and the
/// `orphans` / `widows` rules. They depend on the DOM and the styled device only, not on layout.
struct BreakSelectorMatches {
    targets: BreakTargets,
    column_fill: std::collections::HashMap<NodeId, bool>,
    line_rules: LineRules,
}

fn match_break_selectors(
    doc: &mut BaseDocument,
    breaks: &crate::break_css::BreakRules,
) -> BreakSelectorMatches {
    // The break rules inside `@media` blocks apply when Stylo's evaluation of those blocks, on
    // the device that just styled the document, matches (port step 09).
    let media_applies = {
        let device = doc.stylist_device();
        breaks.media_applies(|query| media_query_matches(device, query))
    };
    let (avoid_inside, page_before, page_after) = breaks.selected(&media_applies);
    let (column_before, column_after, fill) = breaks.column_rules(&media_applies);
    let (avoid_before, avoid_after) = breaks.avoid_rules(&media_applies);
    let (orphans, widows) = breaks.orphans_widows(&media_applies);
    let base: &BaseDocument = doc;
    BreakSelectorMatches {
        targets: BreakTargets {
            avoid_inside: matched_nodes(base, &avoid_inside),
            page_before: matched_nodes(base, &page_before),
            page_after: matched_nodes(base, &page_after),
            column_before: matched_nodes(base, &column_before),
            column_after: matched_nodes(base, &column_after),
            avoid_before: matched_nodes(base, &avoid_before),
            avoid_after: matched_nodes(base, &avoid_after),
            page_names: matched_page_names(base, &breaks.page_names(&media_applies)),
            writing_modes: matched_writing_modes(base, &breaks.writing_modes(&media_applies)),
            moved_to_wrapper: Default::default(),
        },
        column_fill: matched_column_fill(base, &fill),
        line_rules: LineRules::new(base, &orphans, &widows),
    }
}

/// The declared `writing-mode` of every node a rule matches (later rule wins, as
/// [`matched_page_names`]).
fn matched_writing_modes(
    base: &BaseDocument,
    rules: &[(&str, bool)],
) -> std::collections::HashMap<NodeId, bool> {
    let mut out = std::collections::HashMap::new();
    for (selector, vertical) in rules {
        if let Ok(nodes) = base.query_selector_all(selector) {
            for node in nodes {
                out.insert(node, *vertical);
            }
        }
    }
    out
}

/// The `column-fill` of every node a rule matches (`true` = `auto`; the later rule wins, as
/// [`matched_page_names`]; an inline `style` wins over every rule, see `multicol_containers`).
fn matched_column_fill(
    base: &BaseDocument,
    rules: &[(&str, bool)],
) -> std::collections::HashMap<NodeId, bool> {
    let mut out = std::collections::HashMap::new();
    for (selector, auto) in rules {
        if let Ok(nodes) = base.query_selector_all(selector) {
            for node in nodes {
                out.insert(node, *auto);
            }
        }
    }
    out
}

/// The `page` value of every node a `page` rule matches. The later rule wins, in source order
/// (specificity is not compared: UNVERIFIED ASSUMPTION that documents naming pages do not rely
/// on it; an inline `style` still wins over every rule, see `push_box`).
fn matched_page_names(
    base: &BaseDocument,
    rules: &[(&str, Option<&str>)],
) -> std::collections::HashMap<NodeId, Option<String>> {
    let mut out = std::collections::HashMap::new();
    for (selector, name) in rules {
        if let Ok(nodes) = base.query_selector_all(selector) {
            for node in nodes {
                out.insert(node, name.map(str::to_string));
            }
        }
    }
    out
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
    let (abs_x, abs_y) = box_origin(base, node_id, &mut sink.origins, sink.reader_compensations);
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
///
/// With `compensate` (every render but the raw-Blitz one) each in-flow box also moves by the
/// `position: relative` offsets of the non-atomic inline elements it sits in
/// ([`inline_ancestor_relative_offset`], a Blitz gap), and its descendants inherit that through
/// the memo.
fn box_origin(
    base: &BaseDocument,
    node_id: NodeId,
    memo: &mut std::collections::HashMap<NodeId, (f64, f64)>,
    compensate: bool,
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
            if compensate && !is_out_of_flow(node) {
                let (dx, dy) =
                    inline_ancestor_relative_offset(base, node.parent, node.containing_block());
                origin = (origin.0 + dx, origin.1 + dy);
            }
        }
        memo.insert(id, origin);
    }
    origin
}

/// Paint tier of a floated box (and its subtree): CSS 2.2 Appendix E step 5, above the
/// backgrounds of in-flow, non-positioned blocks (step 4).
pub const PAINT_TIER_FLOAT: u8 = 1;
/// Paint tier of a positioned box with `z-index: auto | 0 | positive` (and its subtree):
/// Appendix E steps 8-9, above floats and in-flow content.
pub const PAINT_TIER_POSITIONED: u8 = 2;

/// The painting-order layer of `node_id`'s backgrounds and borders (CSS 2.2 Appendix E,
/// coarsened to three tiers): 0 for in-flow non-positioned boxes, [`PAINT_TIER_FLOAT`] inside a
/// float, [`PAINT_TIER_POSITIONED`] inside a positioned box whose `z-index` is not negative; the
/// highest tier of the box and its DOM ancestors, since a float or a positioned box paints its
/// whole subtree at its own step. The emitter sorts rects by tier first
/// (`pagination::merge_adjacent_rects`), so a later-tier box paints over an earlier-tier one
/// wherever they sit; within a tier the existing position order stands (not Appendix E's tree
/// order, and negative `z-index` and nested stacking contexts are not modelled). Not a Blitz bug
/// (Blitz's own painter orders by stacking context; vellora's emitter had no order at all), so
/// no raw canary: `raw_blitz_tests.rs` `positioned_boxes_paint_over_floats` pins it, WPT
/// css/CSS2/abspos/between-float-and-text.html
/// measures it.
fn paint_tier(
    base: &BaseDocument,
    node_id: NodeId,
    memo: &mut std::collections::HashMap<NodeId, u8>,
) -> u8 {
    let mut chain = Vec::new();
    let mut tier = 0;
    let mut current = Some(node_id);
    while let Some(id) = current {
        if let Some(&known) = memo.get(&id) {
            tier = known;
            break;
        }
        let Some(node) = base.get_node(id) else {
            break;
        };
        chain.push(id);
        current = node.parent.or_else(|| node.layout_parent.get());
    }
    for id in chain.into_iter().rev() {
        let own = base
            .get_node(id)
            .and_then(|n| n.primary_styles())
            .map_or(0, |styles| {
                let positioned =
                    styles.clone_position() != style::computed_values::position::T::Static;
                let z_negative = match styles.get_position().z_index {
                    style::values::generics::position::ZIndex::Integer(z) => z < 0,
                    _ => false,
                };
                if positioned && !z_negative {
                    PAINT_TIER_POSITIONED
                } else if !matches!(styles.clone_float(), style::computed_values::float::T::None) {
                    PAINT_TIER_FLOAT
                } else {
                    0
                }
            });
        tier = tier.max(own);
        memo.insert(id, tier);
    }
    tier
}

/// The order, within [`PAINT_TIER_POSITIONED`], of the positioned box `node` paints with: CSS 2.2
/// Appendix E step 8 paints the positioned descendants of a stacking context (`z-index: auto |
/// 0`) in tree order, each one whole (its backgrounds, then its content) as if it were a
/// stacking context, so a later positioned box paints over an earlier one and over its images,
/// wherever they sit. `tier` is `node`'s [`paint_tier`]; `0` outside the positioned tier. A
/// positioned box of the tier gets the next number when the walk (tree order, ancestors first)
/// reaches it; any other box paints with its nearest such ancestor. Positive `z-index` order
/// and nested stacking contexts are not modelled (as in [`paint_tier`]).
///
/// Measured: Chrome for Testing 155.0.8059.85 (2026-10-28) passes WPT
/// css/CSS2/positioning/absolute-replaced-width-003a/b/c (an absolutely positioned red inline
/// `<svg>` under a later absolutely positioned green box) and
/// css/CSS2/normal-flow/inline-replaced-width-009 / inline-block-replaced-width-008 (an in-flow
/// red `<svg>` under a later `position: relative` green box). With inline SVG painted (Phase C
/// step 06) vellora failed all five, drawing every image after every rect of the page. Not a
/// Blitz bug (the display list is vellora's painter), so no raw canary: `tests/paint_order.rs`.
fn paint_stack(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    tier: u8,
    stacks: &mut std::collections::HashMap<NodeId, u32>,
) -> u32 {
    if tier != PAINT_TIER_POSITIONED {
        return 0;
    }
    let own = node.primary_styles().is_some_and(|styles| {
        styles.clone_position() != style::computed_values::position::T::Static
            && !matches!(
                styles.get_position().z_index,
                style::values::generics::position::ZIndex::Integer(z) if z < 0
            )
    });
    if own {
        let next = stacks.len() as u32 + 1;
        return *stacks.entry(node.id).or_insert(next);
    }
    let mut current = node.parent.or_else(|| node.layout_parent.get());
    while let Some(id) = current {
        if let Some(&n) = stacks.get(&id) {
            return n;
        }
        current = base
            .get_node(id)
            .and_then(|n| n.parent.or_else(|| n.layout_parent.get()));
    }
    0
}

fn is_out_of_flow(node: &blitz_dom::Node) -> bool {
    node.primary_styles()
        .is_some_and(|styles| styles.clone_position().is_absolutely_positioned())
}

/// The summed `position: relative` offset of the non-atomic inline elements (`display: inline`,
/// which generate no Blitz layout box) from `start` up its DOM parents, stopping at `stop` (the
/// box's containing block / the runs' inline root) or at the first element that is not a
/// non-atomic inline.
///
/// BLITZ GAP (blitz-dom 0.3.0-beta.4, crates.io): CSS 2.2 §9.4.3 moves a relatively positioned
/// box with all its content, and for an inline box that content is its text, its atomic inlines
/// and its floats. Blitz applies the inset of a relatively positioned box only to that box's own
/// layout location: `src/layout/inline.rs` 1059-1081 (`inset_offset` of an atomic inline box,
/// from that box's own `style.inset()`), and taffy 0.15.0's block layout for block boxes. A plain
/// `display: inline` element is no layout box (its text is Parley glyph runs of the inline root,
/// its floats and atomic inlines are placed by the inline root, `src/layout/inline.rs` 722-790
/// and 1047-1081), so nothing moves its content: in
/// `<div><span style="position:relative; left:100px">x</span></div>` raw Blitz lays `x` out at
/// the div's content-box left edge, 100 px left of where CSS 2.2 §9.4.3 (and Chrome 155, which
/// passes the WPT tests below) puts it. Repro: `raw_blitz_tests.rs` `RELATIVE_INLINE`; WPT
/// css/CSS2/visuren/float-inside-inline-between-blocks-1.html and
/// css/CSS2/normal-flow/block-in-inline-float-between-001.xht, whose reference floats `bbb` inside
/// a relative `<span>`: vellora drew it at x = 8 px, 100 px left of the test's (Blitz lays the
/// test's `<span>`, which holds blocks, out as a block box and moves it).
/// CANARY: `raw_blitz_tests.rs` `blitz_still_ignores_relative_offset_of_inline_elements` fails
/// when Blitz moves that content itself; then delete this function, its two call sites
/// ([`box_origin`]'s `compensate`, [`read_text_runs`]), that canary and
/// `relative_inline_compensation_moves_text_and_floats`.
///
/// Elements with their own Blitz layout box are not walked past: an inline element that contains
/// blocks becomes a block box in Blitz (its offset is already applied by Taffy), and it is the
/// containing block of what it holds, so `stop` ends the walk there. `left`/`right` percentages
/// resolve against `stop`'s content-box width (the containing block of a relatively positioned
/// inline is its block container); a `top`/`bottom` percentage counts as 0 (UNVERIFIED
/// ASSUMPTION: Chrome resolves it against a definite block-container height, which no WPT test or
/// fixture measured here exercises).
fn inline_ancestor_relative_offset(
    base: &BaseDocument,
    start: Option<NodeId>,
    stop: Option<NodeId>,
) -> (f64, f64) {
    use style::values::generics::position::GenericInset;
    use style::values::specified::box_::{DisplayInside, DisplayOutside};
    let basis = stop
        .and_then(|id| base.get_node(id))
        .filter(|n| node_has_layout_data(n))
        .map(|n| {
            let l = n.final_layout();
            (l.size.width - l.padding.left - l.padding.right - l.border.left - l.border.right)
                .max(0.0) as f64
        })
        .unwrap_or(0.0);
    let resolve = |inset: &style::values::computed::Inset, basis: f64| match inset {
        GenericInset::LengthPercentage(lp) => Some(
            lp.resolve(style::values::computed::Length::new(basis as f32))
                .px() as f64,
        ),
        _ => None,
    };
    let mut offset = (0.0, 0.0);
    let mut current = start;
    // Bounded like every other upward walk here: the DOM depth is gated (SEC-1).
    for _ in 0..4096 {
        let Some(id) = current else { break };
        if Some(id) == stop {
            break;
        }
        let Some(node) = base.get_node(id) else { break };
        if node.is_anonymous() || node.data.downcast_element().is_none() {
            break;
        }
        let Some(styles) = node.primary_styles() else {
            break;
        };
        let display = styles.clone_display();
        if display.outside() != DisplayOutside::Inline || display.inside() != DisplayInside::Flow {
            break;
        }
        if styles.clone_position() == style::computed_values::position::T::Relative {
            let position = styles.get_position();
            let rtl = styles.clone_direction() == style::computed_values::direction::T::Rtl;
            let left = resolve(&position.left, basis);
            let right = resolve(&position.right, basis).map(|r| -r);
            let dx = if rtl { right.or(left) } else { left.or(right) };
            let vertical = |inset: &style::values::computed::Inset| match inset {
                GenericInset::LengthPercentage(lp) => {
                    Some(lp.to_length().map_or(0.0, |l| l.px() as f64))
                }
                _ => None,
            };
            let top = vertical(&position.top);
            let bottom = vertical(&position.bottom).map(|b| -b);
            offset.0 += dx.unwrap_or(0.0);
            offset.1 += top.or(bottom).unwrap_or(0.0);
        }
        current = node.parent;
    }
    offset
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
    let (mut visual_rects, rounded_borders) = read_visuals(
        node,
        abs_x,
        abs_y,
        sink.collapsed,
        sink.canvas_source == Some(node_id),
    );
    let tier = paint_tier(base, node_id, &mut sink.tiers);
    let stack = paint_stack(base, node, tier, &mut sink.stacks);
    for rect in &mut visual_rects {
        rect.tier = tier;
        rect.stack = stack;
    }
    let mut image_runs = resolve_image_runs(
        node,
        content_x,
        content_y,
        content_width,
        content_height,
        sink.img,
    );
    image_runs.extend(inline_svg_run(
        base,
        node,
        content_x,
        content_y,
        content_width,
        content_height,
        sink.svg_fonts,
    ));
    for image in &mut image_runs {
        image.tier = tier;
        image.stack = stack;
    }

    let moved = sink.breaks.moved_to_wrapper.contains(&node_id);
    let inline_breaks = node
        .attr(blitz_dom::local_name!("style"))
        .filter(|_| !moved)
        .map(crate::break_css::declares)
        .unwrap_or_default();
    let floated = node.primary_styles().is_some_and(|styles| {
        !matches!(styles.clone_float(), style::computed_values::float::T::None)
    });

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
        // A float's `break-after` is ignored (Chrome 155: `<div style="float: left;
        // break-after: page">` before two paragraphs prints one page, probe ba-float-source in
        // fidelity/gate/snapshots/2026-10-28/c04-frag/probes/break-after.py); a float after a
        // break-after box still takes the break (probe ba-float-next).
        break_after_page: (inline_breaks.page_after || sink.breaks.page_after.contains(&node_id))
            && !floated,
        break_before_column: inline_breaks.column_before
            || sink.breaks.column_before.contains(&node_id),
        break_before_avoid: inline_breaks.avoid_before
            || sink.breaks.avoid_before.contains(&node_id),
        break_after_avoid: inline_breaks.avoid_after || sink.breaks.avoid_after.contains(&node_id),
        break_after_column: (inline_breaks.column_after
            || sink.breaks.column_after.contains(&node_id))
            && !floated,
        out_of_flow: node
            .primary_styles()
            .is_some_and(|styles| styles.clone_position().is_absolutely_positioned()),
        floated,
        writing_mode_vertical: node
            .attr(blitz_dom::local_name!("style"))
            .and_then(crate::break_css::declared_writing_mode)
            .or_else(|| sink.breaks.writing_modes.get(&node_id).copied()),
        page_name: node
            .attr(blitz_dom::local_name!("style"))
            .filter(|_| !moved)
            .and_then(crate::break_css::declared_page)
            .or_else(|| sink.breaks.page_names.get(&node_id).cloned())
            .flatten(),
        atomic_inline: atomic_inline(node),
        line_span: atomic_inline(node)
            .then(|| atomic_line_span(base, node_id, &mut sink.origins, &mut sink.line_spans))
            .flatten()
            .map(|(top, bottom)| (top - abs_y, bottom - abs_y)),
        orphans: None,
        widows: None,
        contain_size: node.primary_styles().is_some_and(|styles| {
            styles
                .clone_contain()
                .contains(style::values::computed::Contain::SIZE)
        }),
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
/// The absolute top and bottom of the line box atomic inline `id` sits on, in its inline-root
/// ancestor's layout. Each inline root's lines are read once, for all its inline boxes
/// (`memo`): a paragraph of N inline-blocks costs one pass over its lines, not N.
fn atomic_line_span(
    base: &BaseDocument,
    id: NodeId,
    origins: &mut std::collections::HashMap<NodeId, (f64, f64)>,
    memo: &mut std::collections::HashMap<NodeId, Option<(f64, f64)>>,
) -> Option<(f64, f64)> {
    if let Some(&span) = memo.get(&id) {
        return span;
    }
    let mut at = base.get_node(id)?.parent;
    let (root, text) = loop {
        let node = base.get_node(at?)?;
        if let Some(text) = node
            .data
            .downcast_element()
            .and_then(|el| el.inline_layout_data.as_ref())
        {
            break (node, text);
        }
        at = node.parent;
    };
    if memo.insert(root.id, None).is_some() {
        // Read already: `id` is not one of its inline boxes.
        memo.insert(id, None);
        return None;
    }
    let (_, y) = box_origin(base, root.id, origins, false);
    let layout = root.final_layout();
    let content_y = y + (layout.border.top + layout.padding.top) as f64 + text.block_offset as f64;
    for line in text.layout.lines() {
        let m = line.metrics();
        let span = (
            content_y + m.block_min_coord as f64,
            content_y + m.block_max_coord as f64,
        );
        for item in line.items() {
            if let parley::PositionedLayoutItem::InlineBox(ibox) = item {
                memo.insert(NodeId::from_u64(ibox.id), Some(span));
            }
        }
    }
    *memo.entry(id).or_insert(None)
}

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

/// The canvas background (CSS Backgrounds 3 §2.11.2, "The Canvas Background and the Root
/// Element" / "The Canvas Background and the HTML `<body>` Element"): the root element's
/// background colour when it is not transparent, else, for an `<html>` root, that of its first
/// `<body>` child. Returns the element it propagates from (whose own background is then not
/// painted: its used value is transparent) and the colour, composited over white like every
/// other colour here ([`absolute_color_to_srgb`]). Only the colour propagates: vellora paints
/// no background images.
///
/// Chrome 155 paints it over the page area of every page (the page box minus its margins, edges
/// on whole px), never into the page margins: repro `fidelity/gate/snapshots/2026-10-28/c04-paint/repro/bgmulti.html` (body
/// `#F2F4F6`, A4, `@page { margin: 10mm }`, two pages) fills x 38..756 / y 38..1085 px of both
/// pages and leaves the margins white; with `html { background: #9cf }` too, the page area is
/// `#9cf` and the body box paints its own `#ccc` (Phase C step 04).
/// Whether the root element generates a box (its `display` is not `none`).
fn root_rendered(base: &BaseDocument) -> bool {
    base.root_element()
        .primary_styles()
        .is_some_and(|s| !s.clone_display().is_none())
}

fn canvas_background(base: &BaseDocument) -> Option<(NodeId, [u8; 3])> {
    if !root_rendered(base) {
        return None;
    }
    fn own_background(node: &blitz_dom::Node) -> Option<[u8; 3]> {
        let styles = node.primary_styles()?;
        let color = styles
            .get_background()
            .background_color
            .resolve_to_absolute(&styles.clone_color());
        absolute_color_to_srgb(color)
    }
    let root = base.root_element();
    if let Some(color) = own_background(root) {
        return Some((root.id, color));
    }
    let is_element = |node: &blitz_dom::Node, tag: &str| {
        node.data.downcast_element().is_some_and(|el| {
            let local: &str = &el.name.local;
            local.eq_ignore_ascii_case(tag)
        })
    };
    if !is_element(root, "html") {
        return None;
    }
    let body = root
        .children
        .iter()
        .filter_map(|&id| base.get_node(id))
        .find(|child| is_element(child, "body"))?;
    own_background(body).map(|color| (body.id, color))
}

/// Read paintable box visuals out of Blitz's computed style/layout, while
/// keeping Blitz/Stylo/Taffy types sealed inside this module. `canvas_source`: the box's
/// background is the canvas background ([`canvas_background`]), so the box paints none.
fn read_visuals(
    node: &blitz_dom::Node,
    abs_x: f64,
    abs_y: f64,
    collapsed: &CollapsedBorders,
    canvas_source: bool,
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
    if let Some(color) = absolute_color_to_srgb(background_color).filter(|_| !canvas_source) {
        rects.push(VisualRect {
            x: abs_x,
            y: abs_y,
            width,
            height,
            color,
            tier: 0,
            stack: 0,
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
                tier: 0,
                stack: 0,
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

    // `horizontal`: the side runs along x (top, bottom); dashes and dots follow it.
    let sides = [
        BorderSide {
            horizontal: true,
            style: border.border_top_style,
            width: border.border_top_width.0.to_f64_px(),
            color: border.border_top_color.resolve_to_absolute(&current_color),
            rect: (abs_x, abs_y, width, border.border_top_width.0.to_f64_px()),
        },
        BorderSide {
            horizontal: false,
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
            horizontal: true,
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
            horizontal: false,
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
        let (_, _, width, height) = side.rect;
        if width > 0.0 && height > 0.0 {
            let style = line_style(side.style);
            for (x, y, width, height) in
                crate::border_pattern::side_rects(style, side.width, side.rect, side.horizontal)
            {
                rects.push(VisualRect {
                    x,
                    y,
                    width,
                    height,
                    color,
                    tier: 0,
                    stack: 0,
                });
            }
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
    horizontal: bool,
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

/// The SVG namespace html5ever puts the elements of an inline `<svg>` in.
const SVG_NS: &str = "http://www.w3.org/2000/svg";

/// Whether `node` is an element in the SVG namespace named `local` (ASCII case-insensitive).
fn is_svg_element(node: &blitz_dom::Node, local: &str) -> bool {
    node.data.downcast_element().is_some_and(|el| {
        let name: &str = &el.name.local;
        let ns: &str = &el.name.ns;
        ns == SVG_NS && name.eq_ignore_ascii_case(local)
    })
}

/// SECURITY GATE for inline SVG (Phase C step 06). Blitz 0.3.0-beta.4 parses every inline
/// `<svg>` with usvg 0.48.1 while it builds the boxes (blitz-dom `layout/construct.rs:460-477`,
/// `util.rs:157-164` `parse_svg_image`), with `usvg::Options { ..Default::default() }`, whose
/// image resolver reads any non-`data:` `href` of an `<image>` or `<feImage>` as a path on the
/// HOST filesystem, relative to the process's working directory when no `resources_dir` is set
/// (usvg 0.48.1 `parser/image.rs:85-114` `default_string_resolver`, `parser/options.rs:130-135`
/// `get_abs_path`; `parser/image.rs:288-302` and `parser/filter.rs:860` call it). Input HTML
/// could make the renderer read `/etc/hosts` or block on a FIFO. vellora cannot hand Blitz other
/// options, so any such source is rejected here, on the parsed DOM before `resolve`, as an
/// unresolved image (`image:unresolved`, the same rejection as an `<img>` whose source does not
/// resolve). vellora's own parse of the SVG ([`crate::svg::parse`]) resolves nothing either.
///
/// Accepted: no `href`, an empty `href` (usvg checks the path `""`, which never exists), and an
/// `href` that the `data-url` crate usvg uses parses as a data: URL (usvg then decodes it and
/// never falls through to the path resolver, even when the payload is bad). Images inside a
/// data: URL SVG are not checked: usvg parses nested SVGs with a resolver that loads no string
/// `href` (usvg 0.48.1 `parser/mod.rs:130-140`).
///
/// The first offending element in DOM order is returned, located like an `<img>`
/// ([`UnresolvedImage::tag`]).
///
/// WHEN BLITZ LETS CALLERS SET THE SVG PARSE OPTIONS (or stops resolving paths), DELETE: this
/// function, its call in [`validate_then_lay_out_observed`], the `image`/`feimage` branch of
/// `validation::image_diagnostic`, and the canary
/// `blitz_still_reads_svg_image_sources_from_the_host` (`src/raw_blitz_tests.rs`); then resolve
/// these sources from the caller's `images` like an `<img>`.
pub(crate) fn find_external_svg_image(base: &BaseDocument) -> Option<UnresolvedImage> {
    let mut counts = [0usize; 2];
    let mut stack = vec![base.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = base.get_node(id) else {
            continue;
        };
        stack.extend(node.children.iter().rev().copied());
        let Some(el) = node.data.downcast_element() else {
            continue;
        };
        let local: &str = &el.name.local;
        let (tag, slot) = if local.eq_ignore_ascii_case("image") {
            ("image", 0)
        } else if local.eq_ignore_ascii_case("feimage") {
            ("feimage", 1)
        } else {
            continue;
        };
        // Every element of the tag counts, as in `count_tag_in_document` and the source locator.
        counts[slot] += 1;
        // Any namespace: Blitz parses every element named `svg` as an SVG (blitz-dom
        // `layout/construct.rs:460`, by tag name only) and usvg accepts elements without a
        // namespace (usvg 0.48.1 `parser/svgtree/parse.rs:139`), so in the fidelity-only XML parse
        // an `<svg>` without `xmlns` would still have its images resolved. In the HTML parse an
        // `<image>` outside SVG is already an `<img>`, so nothing else is caught.
        let external = el.attrs().iter().any(|attr| {
            let name: &str = &attr.name.local;
            name == "href"
                && !attr.value.is_empty()
                && data_url::DataUrl::process(&attr.value).is_err()
        });
        if external {
            return Some(UnresolvedImage {
                tag,
                occurrence: counts[slot],
                dom_total: count_tag_in_document(base, tag),
                reason: "an inline SVG image source must be a data: URL — vellora never reads \
                         SVG image sources from the filesystem or the network, nor from the \
                         `images` option",
            });
        }
    }
    None
}

/// Whether an `<svg>` declares a `viewBox` Blitz parses as one (four numbers, width and height
/// positive: blitz-dom 0.3.0-beta.4 `node/svg.rs:40-52`), which gives it an intrinsic aspect
/// ratio.
fn svg_has_view_box(node: &blitz_dom::Node) -> bool {
    let Some(el) = node.data.downcast_element() else {
        return false;
    };
    let Some(attr) = el.attrs().iter().find(|attr| {
        let name: &str = &attr.name.local;
        name == "viewBox"
    }) else {
        return false;
    };
    let numbers: Vec<f64> = attr
        .value
        .split(|c: char| c.is_ascii_whitespace() || c == ',')
        .filter(|t| !t.is_empty())
        .map(|t| t.parse::<f64>())
        .collect::<Result<_, _>>()
        .unwrap_or_default();
    numbers.len() == 4
        && numbers[2] > 0.0
        && numbers[3] > 0.0
        && numbers.iter().all(|n| n.is_finite())
}

/// BLITZ BUG COMPENSATION (blitz-dom 0.3.0-beta.4, `svg` feature): the size of an inline `<svg>`
/// that declares no `viewBox`.
///
/// Such an SVG has no intrinsic aspect ratio, and no intrinsic size along an axis whose
/// `width`/`height` attribute is absent, so a `width: auto` box is 300 px wide and a
/// `height: auto` box 150 px tall (CSS 2.2 §10.3.2 and §10.6.2, the replaced-element default
/// object size; Chrome 155: `<svg><rect width="25" height="50"/></svg>` lays out 300x150,
/// `<svg width="40">` 40x150, `<svg style="width:60px">` 60x150, measured 2026-10-28 with
/// `c06-svg/scripts/chrome-rects.mjs`). Blitz instead uses usvg's resolved tree size, and always
/// reports an aspect ratio (blitz-dom `layout/mod.rs:407-430`, `node/svg.rs:197-205`): usvg sizes
/// an SVG without `viewBox` whose width or height is absent or a percentage to the bounding box
/// of its content (usvg 0.48.1 `parser/converter.rs:523-605`, `calculate_svg_bbox`), so Blitz
/// lays those three out 25x50, 40x100 and 60x120. The bounding box includes `<text>` measured
/// with the HOST fonts Blitz's usvg parse loads (blitz-dom `util.rs:42-50` `FONT_DB`), so the
/// uncompensated size is not even host-independent.
///
/// What is changed, on the computed style after the cascade and before layout: for every `<svg>`
/// (SVG namespace) without a valid `viewBox` ([`svg_has_view_box`]), a `width: auto` becomes
/// `300px` and a `height: auto` `150px`, plus the padding and border for `box-sizing:
/// border-box` (left `auto` when that padding is a percentage). A percentage `height` of an
/// in-flow SVG whose parent has `height: auto` is `auto` (CSS 2.2 §10.5) and gets the 150 px too
/// (Chrome: `<svg width="40" height="10%">` is 40x150, Blitz 40x10; `<svg width="100%"
/// height="100%">` holding a `<text>` is 784x150, Blitz takes the height from the text's box).
/// `min-*`/`max-*` still apply, as in Chrome. Not modelled: a percentage height against any other
/// indefinite containing block (a flex item, a percentage-height parent, an absolutely positioned
/// SVG's containing block), which Blitz keeps resolving through usvg's tree size; and flex/grid
/// stretching of an SVG's auto size, which a fixed length turns off.
///
/// WHEN THIS GOES, DELETE: this function, its call in [`resolve_and_walk`], and the canary
/// `blitz_still_sizes_an_svg_without_viewbox_to_its_content` (`src/raw_blitz_tests.rs`), which
/// fails as soon as raw Blitz lays `<svg><rect width="25" height="50"/></svg>` out at Chrome's
/// 300x150; keep the `inline_svg_*` size tests there (they hold Chrome's numbers).
fn size_svgs_like_chrome(doc: &mut BaseDocument) {
    use style::values::computed::{Length, LengthPercentage, Size};
    let mut edits: Vec<(NodeId, Option<f32>, Option<f32>)> = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        stack.extend(node.children.iter().copied());
        if !is_svg_element(node, "svg") || svg_has_view_box(node) {
            continue;
        }
        let Some(styles) = node.primary_styles() else {
            continue;
        };
        let position = styles.get_position();
        let border_box = position.box_sizing == style::computed_values::box_sizing::T::BorderBox;
        // The padding plus border of one axis, `None` when a padding is a percentage.
        let frame = |padding: [&style::values::computed::NonNegativeLengthPercentage; 2],
                     border: [&style::values::computed::BorderSideWidth; 2]| {
            if !border_box {
                return Some(0.0);
            }
            let mut sum = 0.0f32;
            for p in padding {
                sum += p.0.to_length()?.px();
            }
            for b in border {
                sum += b.0.to_f32_px();
            }
            Some(sum)
        };
        let pad = styles.get_padding();
        let border = styles.get_border();
        let width = matches!(position.width, Size::Auto)
            .then(|| {
                frame(
                    [&pad.padding_left, &pad.padding_right],
                    [&border.border_left_width, &border.border_right_width],
                )
            })
            .flatten()
            .map(|frame| 300.0 + frame);
        // A percentage height against a containing block whose height depends on its content
        // computes to `auto` (CSS 2.2 §10.5): an in-flow SVG whose parent has `height: auto`.
        let indefinite_percentage = matches!(&position.height, Size::LengthPercentage(lp) if lp.0.has_percentage())
            && !styles.clone_position().is_absolutely_positioned()
            && node
                .parent
                .and_then(|p| doc.get_node(p))
                .and_then(|p| p.primary_styles())
                .is_some_and(|p| matches!(p.get_position().height, Size::Auto));
        let height = (matches!(position.height, Size::Auto) || indefinite_percentage)
            .then(|| {
                frame(
                    [&pad.padding_top, &pad.padding_bottom],
                    [&border.border_top_width, &border.border_bottom_width],
                )
            })
            .flatten()
            .map(|frame| 150.0 + frame);
        if width.is_some() || height.is_some() {
            edits.push((id, width, height));
        }
    }
    let px = |v: f32| {
        Size::LengthPercentage(style::values::generics::NonNegative(
            LengthPercentage::new_length(Length::new(v)),
        ))
    };
    for (id, width, height) in edits {
        mutate_primary_style(doc, id, |values| {
            let position = values.mutate_position();
            if let Some(w) = width {
                position.set_width(px(w));
            }
            if let Some(h) = height {
                position.set_height(px(h));
            }
        });
    }
}

/// The font database of the inline SVGs of one render ([`crate::svg::font_db`] over the
/// caller's `fonts`), built on the first SVG only.
struct SvgFonts<'a> {
    custom: &'a [Vec<u8>],
    db: std::cell::OnceCell<std::sync::Arc<usvg::fontdb::Database>>,
}

impl<'a> SvgFonts<'a> {
    fn new(custom: &'a [Vec<u8>]) -> Self {
        Self {
            custom,
            db: std::cell::OnceCell::new(),
        }
    }

    fn db(&self) -> std::sync::Arc<usvg::fontdb::Database> {
        self.db
            .get_or_init(|| crate::svg::font_db(self.custom))
            .clone()
    }
}

/// The image run of an inline `<svg>` that Blitz laid out as a replaced box (its subtree parsed:
/// `ImageData::Svg`), drawn into the content box (`x`, `y`, `width`, `height`): the SVG's
/// viewport, as in Chrome. `fonts` `None` (a throwaway walk) records the box only. An SVG
/// with an empty box, or that usvg cannot parse, draws nothing.
fn inline_svg_run(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    fonts: Option<&SvgFonts>,
) -> Option<ImageRun> {
    use blitz_dom::node::{ImageData, SpecialElementData};
    let el = node.element_data()?;
    let SpecialElementData::Image(data) = &el.special_data else {
        return None;
    };
    if !matches!(**data, ImageData::Svg(_)) || !is_svg_element(node, "svg") {
        return None;
    }
    if !(width > 0.0 && height > 0.0 && width.is_finite() && height.is_finite()) {
        return None;
    }
    let (data, svg) = match fonts {
        Some(fonts) => {
            let source = inline_svg_source(base, node, width, height);
            let tree = crate::svg::parse(&source, fonts.db())?;
            (source.into_bytes(), Some(tree))
        }
        None => (Vec::new(), None),
    };
    Some(ImageRun {
        x,
        y,
        width,
        height,
        format: ImageFormat::Svg,
        data: std::sync::Arc::new(data),
        svg,
        tier: 0,
        stack: 0,
    })
}

/// An inline `<svg>` element serialized as a standalone SVG document for usvg, from the parsed
/// DOM (never from the input bytes): the elements, attributes and text of its subtree, in DOM
/// order, with
///
/// - `width`/`height` on the root replaced by the laid-out content box (`width`, `height`, CSS
///   px), which is the SVG viewport (a `viewBox` then maps into it with its
///   `preserveAspectRatio`; without one, user units are px, unscaled, as in Chrome);
/// - `xmlns` / `xmlns:xlink` declared on the root when the source does not;
/// - `font-family` / `font-size` on the root from the `<svg>` element's computed style when the
///   root does not set them (SVG text inherits them from the HTML, as in Chrome);
/// - every `currentColor` in an attribute value replaced by that element's computed `color`
///   (what Blitz's own serializer does, blitz-dom `node/serialize.rs:101-113`, `svg_source`,
///   which is crate-private).
///
/// Comments are dropped. Not carried over: author CSS of the HTML document that targets SVG
/// elements (e.g. `svg rect { fill: red }` in a page `<style>`); only the SVG's own attributes,
/// `style` attributes and `<style>` elements reach usvg.
pub(crate) fn inline_svg_source(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    width: f64,
    height: f64,
) -> String {
    let mut out = String::new();
    write_svg_node(base, node, true, width, height, &mut out);
    out
}

fn write_svg_node(
    base: &BaseDocument,
    node: &blitz_dom::Node,
    root: bool,
    width: f64,
    height: f64,
    out: &mut String,
) {
    use style_traits::ToCss as _;
    match &node.data {
        NodeData::Text(text) => escape_xml(&text.content, false, out),
        NodeData::Element(el) => {
            let name: &str = &el.name.local;
            out.push('<');
            out.push_str(name);
            let styles = node.primary_styles();
            let color = styles
                .as_ref()
                .map(|styles| styles.clone_color().to_css_string());
            let has = |wanted: &str| {
                el.attrs().iter().any(|attr| {
                    let local: &str = &attr.name.local;
                    attr_name(&attr.name) == wanted || (wanted == "xmlns" && local == "xmlns")
                })
            };
            if root {
                if !has("xmlns") {
                    out.push_str(" xmlns=\"");
                    out.push_str(SVG_NS);
                    out.push('"');
                }
                if !has("xmlns:xlink") {
                    out.push_str(" xmlns:xlink=\"http://www.w3.org/1999/xlink\"");
                }
                out.push_str(&format!(" width=\"{width}\" height=\"{height}\""));
                if let Some(styles) = styles.as_ref() {
                    let font = styles.get_font();
                    if !has("font-family") {
                        out.push_str(" font-family=\"");
                        escape_xml(&font.font_family.to_css_string(), true, out);
                        out.push('"');
                    }
                    if !has("font-size") {
                        out.push_str(&format!(
                            " font-size=\"{}\"",
                            font.font_size.computed_size().px()
                        ));
                    }
                }
            }
            for attr in el.attrs() {
                let full = attr_name(&attr.name);
                if root && (full == "width" || full == "height") {
                    continue;
                }
                out.push(' ');
                out.push_str(&full);
                out.push_str("=\"");
                match &color {
                    Some(color) if attr.value.contains("currentColor") => {
                        escape_xml(&attr.value.replace("currentColor", color), true, out)
                    }
                    _ => escape_xml(&attr.value, true, out),
                }
                out.push('"');
            }
            drop(styles);
            if node.children.is_empty() {
                out.push_str("/>");
                return;
            }
            out.push('>');
            for &child in &node.children {
                if let Some(child) = base.get_node(child) {
                    write_svg_node(base, child, false, width, height, out);
                }
            }
            out.push_str("</");
            out.push_str(name);
            out.push('>');
        }
        _ => {}
    }
}

/// An attribute's serialized name: `xlink:` / `xml:` / `xmlns:` prefixes for those namespaces,
/// the bare local name otherwise (the HTML fragment serialization's rule).
fn attr_name(name: &html5ever::QualName) -> String {
    let local: &str = &name.local;
    let ns: &str = &name.ns;
    match ns {
        "http://www.w3.org/1999/xlink" => format!("xlink:{local}"),
        "http://www.w3.org/XML/1998/namespace" => format!("xml:{local}"),
        "http://www.w3.org/2000/xmlns/" if local == "xmlns" => local.to_string(),
        "http://www.w3.org/2000/xmlns/" => format!("xmlns:{local}"),
        _ => local.to_string(),
    }
}

/// Escape `text` for XML character data (`attr` false) or a double-quoted attribute value.
fn escape_xml(text: &str, attr: bool, out: &mut String) {
    for c in text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' if attr => out.push_str("&quot;"),
            '\n' if attr => out.push_str("&#10;"),
            '\t' if attr => out.push_str("&#9;"),
            '\r' => out.push_str("&#13;"),
            c => out.push(c),
        }
    }
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
            svg: None,
            tier: 0,
            stack: 0,
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
        svg: None,
        tier: 0,
        stack: 0,
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
        let line_first_run = runs.len();
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
        let mut line_runs: Vec<(TextRun, bool)> = Vec::new();
        let mut line_has_inline_box = false;
        for item in line.items() {
            let glyph_run = match item {
                parley::PositionedLayoutItem::GlyphRun(gr) => gr,
                parley::PositionedLayoutItem::InlineBox(_) => {
                    line_has_inline_box = true;
                    continue;
                }
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
            let ascent_em = f64::from(run.font_metrics().ascent) / f64::from(font_size.max(1e-3));
            let root_shift = f64::from(glyph_run.baseline() - line_metrics.baseline);
            let decorations = run_decorations(base, style.brush.id, ascent_em, root_shift, &glyphs);

            // The runs of a relatively positioned inline element move with it (a Blitz gap,
            // see `inline_ancestor_relative_offset`); not in the raw-Blitz render.
            let (rel_x, rel_y) = if compensate {
                let brush = base.get_node(style.brush.id);
                let start = brush.and_then(|b| {
                    if b.data.downcast_element().is_some() {
                        Some(b.id)
                    } else {
                        b.parent
                    }
                });
                inline_ancestor_relative_offset(base, start, Some(node.id))
            } else {
                (0.0, 0.0)
            };

            line_runs.push((
                TextRun {
                    text: source.clone(),
                    font_data,
                    font_index,
                    font_size,
                    origin_x: abs_x + glyph_run.offset() as f64 + inline_advance_adjust_px + rel_x,
                    origin_y: line_box_top + glyph_run.baseline() as f64 + rel_y,
                    line_above: (glyph_run.baseline() - line_metrics.block_min_coord).max(0.0)
                        as f64,
                    line_below: (line_metrics.block_max_coord - glyph_run.baseline()).max(0.0)
                        as f64,
                    glyphs,
                    color,
                    decorations,
                },
                run.is_rtl(),
            ));
            inline_advance_adjust_px += padding_right_px;
        }
        if compensate && layout.is_rtl() && !line_has_inline_box {
            rtl_line_end_whitespace(node, &source, &line, &mut line_runs);
        }
        runs.extend(line_runs.into_iter().map(|(run, _)| run));
        // The spaces a line ends with are not decorated (Chrome 155 does not underline them).
        if let Some(last) = runs.get_mut(line_first_run..).and_then(|r| r.last_mut()) {
            trim_trailing_space_decorations(last);
        }
    }

    runs
}

/// BLITZ BUG COMPENSATION (parley 0.12.0, Blitz 0.3.0-beta.4's text engine): in a right-to-left
/// paragraph, white space that ends a line inside a left-to-right run stays at that run's visual
/// right end and does not hang.
///
/// - Spec: UAX #9 rule L1 resets white space at the end of each LINE to the paragraph level, so
///   in an rtl paragraph it sits at the visual left end of the line; CSS Text 3 §4.1.3 then hangs
///   it (collapsible spaces are removed; `pre-wrap` spaces hang, conditionally before a forced
///   break; `pre`/`break-spaces` keep it). UAX #9 P1 ends a paragraph at a forced break, so a
///   no-break space right before a `<br>` resolves to the paragraph direction too (N1/N2 with
///   `eos`). Chrome 155 does both (WPT `css/css-text/text-align/text-align-end-006.html`,
///   `css/css-text/text-justify/text-justify-and-trailing-spaces-003/004.html` pass in Chrome).
/// - Parley: `layout/line_break.rs` 1896-1902 and `layout/data.rs` 497-500 (cargo registry source
///   of parley 0.12.0): "We don't currently apply UAX #9 L1 (resetting trailing whitespace to
///   paragraph level)"; trailing white space only hangs when its run is at the paragraph level.
///   parley_engine 0.12.0 `bidi.rs` 52-150 resolves the whole inline text as ONE paragraph (L1
///   only before a separator inside it), so the no-break space before `\n` takes the level of the
///   ltr text after the break. Repros: `REF REF REF REF REF REF REF REF` (25 px Ahem, 300 px,
///   `direction: rtl`, ltr letters): Parley puts the line's space at x 275..300, letters 0..275,
///   Chrome letters 25..300; `XX XX ` (20 px monospace, 7ch = 84 px, rtl, `pre-wrap`,
///   justify): Parley stretches both spaces by 6 px (letters at 0 / 42), Chrome hangs the
///   trailing space at -12 and stretches the inner one to 36 px (letters at 0 / 60).
/// - Correction, per line of an rtl inline root without inline boxes, when the line's logically
///   last characters are spaces/tabs (or no-break spaces before a forced break or the end of the
///   text) inside a NON-rtl run: those glyphs move to the visual left end of the line; spaces and
///   tabs hang as above; the line is re-aligned the way Parley aligns an rtl line with that
///   hanging advance (`layout/alignment.rs` 69-146: offset `-hang`, then right / center / left
///   share of the free space, right-aligned on overflow, justification spread over the word
///   separators that do not hang). Off in the raw-Blitz render (`compensate`).
///
/// WHEN PARLEY APPLIES L1 PER LINE (and P1 at forced breaks), DELETE this function, its call and
/// the `line_runs` rtl flags in [`read_text_runs`], the canary
/// `blitz_still_keeps_rtl_line_end_space_in_its_ltr_run` (`src/raw_blitz_tests.rs`) and the
/// `rtl_line_end_whitespace_*` tests there.
fn rtl_line_end_whitespace<B: parley::Brush>(
    node: &blitz_dom::Node,
    source: &str,
    line: &parley::Line<'_, B>,
    runs: &mut Vec<(TextRun, bool)>,
) {
    use style::computed_values::white_space_collapse::T as Collapse;
    use style::values::specified::TextAlignKeyword as Align;
    let Some(styles) = node.primary_styles() else {
        return;
    };
    let metrics = line.metrics();
    if metrics.hanging_advance != 0.0 {
        return;
    }
    let break_reason = line.break_reason();
    let ends_paragraph = matches!(
        break_reason,
        parley::BreakReason::Explicit | parley::BreakReason::None
    );
    // The logically last characters of the line, after its forced break if any.
    let range = line.text_range();
    let Some(text) = source.get(range.clone()) else {
        return;
    };
    let body = text.trim_end_matches(['\n', '\r', '\u{2028}', '\u{2029}']);
    let body_end = range.start + body.len();
    let trail_start = range.start
        + body
            .trim_end_matches(|c: char| c == ' ' || c == '\t' || (ends_paragraph && c == '\u{a0}'))
            .len();
    if trail_start == body_end {
        return;
    }
    let in_trail = |g: &Glyph| g.text_start >= trail_start && g.text_end <= body_end;
    if runs
        .iter()
        .any(|(run, rtl)| *rtl && run.glyphs.iter().any(in_trail))
    {
        return; // Parley already resolved it to the paragraph level.
    }
    let Some(owner) = runs
        .iter()
        .position(|(run, _)| run.glyphs.iter().any(in_trail))
    else {
        return;
    };
    // The spaces/tabs after the last no-break space hang (CSS Text 3 §4.1.3).
    let hang_start = trail_start
        + source[trail_start..body_end]
            .trim_end_matches([' ', '\t'])
            .len();
    let is_separator = |run: &TextRun, g: &Glyph| {
        matches!(run.text.get(g.text_start..g.text_end), Some(" " | "\u{a0}"))
    };
    let is_hanging = |g: &Glyph| g.text_start >= hang_start && g.text_end <= body_end;

    let collapse = styles.clone_white_space_collapse();
    let wraps = matches!(
        styles.clone_text_wrap_mode(),
        style::computed_values::text_wrap_mode::T::Wrap
    );
    let avail = f64::from(metrics.inline_max_coord - metrics.inline_min_coord - metrics.indent);
    let natural_advance = f64::from(metrics.advance);

    // Parley's justification of this line (`alignment.rs` 126-144), to recover natural advances.
    let last_line = ends_paragraph;
    let align = styles.clone_text_align();
    let align_last = styles.clone_text_align_last();
    use style::values::specified::TextAlignLast as Last;
    let line_align = if last_line {
        match align_last {
            Last::Auto if align == Align::Justify => Align::Start,
            Last::Auto => align,
            Last::Start => Align::Start,
            Last::End => Align::End,
            Last::Left => Align::Left,
            Last::Right => Align::Right,
            Last::Center => Align::Center,
            Last::Justify => Align::Justify,
        }
    } else {
        align
    };
    let free = avail - natural_advance;
    let separators: usize = runs
        .iter()
        .map(|(run, _)| run.glyphs.iter().filter(|g| is_separator(run, g)).count())
        .sum();
    let old_extra = if line_align == Align::Justify && free > 0.0 && separators > 0 {
        free / separators as f64
    } else {
        0.0
    };
    let natural = |run: &TextRun, g: &Glyph| {
        f64::from(g.advance) - if is_separator(run, g) { old_extra } else { 0.0 }
    };

    let hang_natural: f64 = runs[owner]
        .0
        .glyphs
        .iter()
        .filter(|g| is_hanging(g))
        .map(|g| natural(&runs[owner].0, g))
        .sum();
    let hang = match collapse {
        Collapse::Collapse | Collapse::PreserveBreaks => hang_natural,
        Collapse::Preserve if wraps && !ends_paragraph => hang_natural,
        Collapse::Preserve if wraps => hang_natural.min((natural_advance - avail).max(0.0)),
        _ => 0.0,
    };
    // Parley's rtl alignment with that hanging advance (`alignment.rs` 69-146).
    let new_free = avail - natural_advance + hang;
    let hanging_separators = runs[owner]
        .0
        .glyphs
        .iter()
        .filter(|g| hang > 0.0 && is_hanging(g) && is_separator(&runs[owner].0, g))
        .count();
    let mut new_extra = 0.0;
    let offset = -hang
        + if new_free <= 0.0 {
            new_free
        } else {
            match line_align {
                Align::Justify if separators > hanging_separators => {
                    new_extra = new_free / (separators - hanging_separators) as f64;
                    0.0
                }
                Align::Left | Align::MozLeft | Align::End => 0.0,
                Align::Center | Align::MozCenter => new_free * 0.5,
                _ => new_free,
            }
        };

    // Line start in absolute coordinates, then every run re-placed in visual order with the
    // moved white space first; gaps between runs (vellora's inline padding) are kept.
    let Some(first_x) = runs.first().map(|(run, _)| run.origin_x) else {
        return;
    };
    let mut line_x = first_x - f64::from(metrics.offset) + offset;
    let run_width = |run: &TextRun| run.glyphs.iter().map(|g| f64::from(g.advance)).sum::<f64>();
    let gaps: Vec<f64> = runs
        .windows(2)
        .map(|w| w[1].0.origin_x - (w[0].0.origin_x + run_width(&w[0].0)))
        .collect();
    let old_widths: Vec<f64> = runs.iter().map(|(run, _)| run_width(run)).collect();
    let mut moved = runs[owner].0.clone();
    moved.glyphs.retain(|g| in_trail(g));
    runs[owner].0.glyphs.retain(|g| !in_trail(g));
    let restretch = |run: &mut TextRun, hanging_ok: bool| {
        let text = run.text.clone();
        for g in &mut run.glyphs {
            if matches!(text.get(g.text_start..g.text_end), Some(" " | "\u{a0}")) {
                let extra = if hanging_ok && hang > 0.0 && is_hanging(g) {
                    0.0
                } else {
                    new_extra
                };
                g.advance = (f64::from(g.advance) - old_extra + extra) as f32;
            }
        }
    };
    restretch(&mut moved, true);
    moved.origin_x = line_x;
    line_x += run_width(&moved);
    for (i, (run, _)) in runs.iter_mut().enumerate() {
        if i > 0 {
            line_x += gaps[i - 1];
        }
        restretch(run, false);
        run.origin_x = line_x;
        line_x += run_width(run);
    }
    // Decorations (phasec/04-paint, relative to each run's origin) follow the moved glyphs:
    // the moved line-end white space carries none (Chrome 155 decorates no line-end spaces,
    // see `trim_trailing_space_decorations`), and a whole-run decoration of a run whose
    // glyphs or advances changed is refitted to the run's new width.
    moved.decorations.clear();
    for ((run, _), old) in runs.iter_mut().zip(&old_widths) {
        let new = run_width(run);
        for d in &mut run.decorations {
            if d.x.abs() < 1e-6 && (d.width - old).abs() < 1e-6 {
                d.width = new;
            }
        }
        run.decorations.retain(|d| d.width > 0.0);
    }
    runs.retain(|(run, _)| !run.glyphs.is_empty());
    runs.insert(0, (moved, false));
}

/// The decorations in effect on text styled by `brush` ([`crate::text_decoration`] holds the
/// rules and the Chrome measurements): those of `brush` and of every ancestor up to the root,
/// except that none passes into an atomic inline (`inline-block` etc.), a float or an
/// absolutely positioned box from outside it (CSS Text Decoration 3 §2.1). Each line takes its
/// decorating box's font size, `text-decoration-color` and thickness; `ascent_em` is the run's
/// first-font ascent per em, scaled to the decorating box's font size. Every line covers the
/// run's advance (`glyphs`).
///
/// A line sits on its DECORATING box's baseline, which `vertical-align` on descendants does not
/// move (CSS 2.2 §16.3.1; WPT css/CSS2/text/text-decoration-va-length-001/002): a block-level
/// decorating box's baseline is the line's root baseline (`root_shift` = run baseline - line
/// baseline, px, down); an inline one's is the run's baseline moved back by the length
/// `vertical-align` of the boxes between the run and it ([`baseline_raise`]), or, when one of those
/// is a keyword, the root baseline moved by the decorating box's own chain up to the block; when
/// neither chain is all lengths, the run's baseline.
fn run_decorations(
    base: &BaseDocument,
    brush: NodeId,
    ascent_em: f64,
    root_shift: f64,
    glyphs: &[Glyph],
) -> Vec<TextDecoration> {
    use crate::text_decoration::{geometry, Kind};
    use style::computed_value_flags::ComputedValueFlags;
    use style::values::computed::text::TextDecorationLine;
    use style::values::generics::text::GenericTextDecorationLength;

    let parent = |n: &blitz_dom::Node| n.parent.and_then(|id| base.get_node(id));
    // The brush is the styled element of the run (Blitz `TextBrush::from_id`); a node without
    // styles defers to its parent.
    let mut node = base.get_node(brush);
    while let Some(n) = node.filter(|n| n.primary_styles().is_none()) {
        node = parent(n);
    }
    let Some(start) = node else {
        return Vec::new();
    };
    if !start.primary_styles().is_some_and(|s| {
        s.flags
            .contains(ComputedValueFlags::HAS_TEXT_DECORATION_LINES)
    }) {
        return Vec::new();
    }
    let width: f64 = glyphs.iter().map(|g| f64::from(g.advance)).sum();
    if width <= 0.0 {
        return Vec::new();
    }
    let is_inline = |n: &blitz_dom::Node| {
        use style::values::specified::box_::DisplayOutside;
        n.primary_styles()
            .is_some_and(|s| s.clone_display().outside() == DisplayOutside::Inline)
    };
    // The raise (px, up) of every inline box from `from` up to (not including) the first that
    // is `stop` or block-level; `None` if one of them is not a plain length.
    let chain_raise = |from: &blitz_dom::Node, stop: Option<NodeId>| -> Option<f64> {
        let mut raise = 0.0;
        let mut cur = Some(from);
        while let Some(c) = cur {
            if Some(c.id) == stop || !is_inline(c) {
                break;
            }
            raise += c
                .primary_styles()
                .map_or(Some(0.0), |s| baseline_raise(&s))?;
            cur = parent(c);
        }
        Some(raise)
    };
    let mut out = Vec::new();
    let mut node = Some(start);
    while let Some(n) = node {
        let Some(styles) = n.primary_styles() else {
            node = parent(n);
            continue;
        };
        // Where this box's baseline is, relative to the run's (px, down).
        let baseline = if n.id == start.id {
            0.0
        } else if !is_inline(n) {
            -root_shift
        } else if let Some(raise) = chain_raise(start, Some(n.id)) {
            raise
        } else if let Some(raise) = chain_raise(n, None) {
            -root_shift - raise
        } else {
            0.0
        };
        let text = styles.get_text();
        let lines = text.text_decoration_line;
        let color = absolute_color_to_srgb(
            text.text_decoration_color
                .resolve_to_absolute(&styles.clone_color()),
        );
        if let (false, Some(color)) = (lines.is_empty(), color) {
            let font_size = f64::from(styles.get_font().font_size.used_size.0.px());
            let thickness = match &text.text_decoration_thickness {
                GenericTextDecorationLength::LengthPercentage(lp) => Some(f64::from(
                    lp.resolve(style::values::computed::Length::new(font_size as f32))
                        .px(),
                )),
                GenericTextDecorationLength::Auto | GenericTextDecorationLength::FromFont => None,
            };
            for (flag, line) in [
                (TextDecorationLine::UNDERLINE, Kind::Underline),
                (TextDecorationLine::OVERLINE, Kind::Overline),
                (TextDecorationLine::LINE_THROUGH, Kind::LineThrough),
            ] {
                if lines.contains(flag) {
                    let (top, height) = geometry(line, font_size, ascent_em * font_size, thickness);
                    out.push(TextDecoration {
                        x: 0.0,
                        width,
                        top: baseline + top,
                        height,
                        color,
                        over_text: line == Kind::LineThrough,
                    });
                }
            }
        }
        // Nothing outside an atomic inline, a float or an absolutely positioned box decorates
        // its content.
        use style::computed_values::{float::T as Float, position::T as Position};
        let boundary = atomic_inline(n)
            || !matches!(styles.clone_float(), Float::None)
            || matches!(
                styles.clone_position(),
                Position::Absolute | Position::Fixed
            );
        if boundary {
            break;
        }
        node = parent(n);
    }
    out
}

/// How far `vertical-align` raises a box's baseline above its parent's (px, up): `baseline`
/// alignment with a length (or percentage of the box's `line-height`, as blitz-dom 0.3.0-beta.4
/// `stylo_to_parley::vertical_align` resolves it) shift; `None` for a keyword shift (`sub`,
/// `super`, `top`, ...) or another alignment, whose amount Parley decides.
fn baseline_raise(styles: &style::properties::ComputedValues) -> Option<f64> {
    use style::values::computed::{AlignmentBaseline, BaselineShift};
    let b = styles.get_box();
    if !matches!(b.clone_alignment_baseline(), AlignmentBaseline::Baseline) {
        return None;
    }
    match b.clone_baseline_shift() {
        BaselineShift::Length(lp) => {
            let font = styles.get_font();
            let font_size = font.font_size.used_size.0.px();
            let line_height = match font.line_height {
                style::values::computed::font::LineHeight::Normal => font_size * 1.2,
                style::values::computed::font::LineHeight::Number(n) => font_size * n.0,
                style::values::computed::font::LineHeight::Length(v) => v.0.px(),
            };
            Some(f64::from(
                lp.resolve(style::values::computed::Length::new(line_height))
                    .px(),
            ))
        }
        _ => None,
    }
}

/// Shortens the decorations of a line's last run by the advance of the white space it ends
/// with.
fn trim_trailing_space_decorations(run: &mut TextRun) {
    if run.decorations.is_empty() {
        return;
    }
    let trailing: f64 = run
        .glyphs
        .iter()
        .rev()
        .take_while(|g| {
            run.text
                .get(g.text_start..g.text_end)
                .is_some_and(|t| !t.is_empty() && t.chars().all(char::is_whitespace))
        })
        .map(|g| f64::from(g.advance))
        .sum();
    if trailing > 0.0 {
        for d in &mut run.decorations {
            d.width -= trailing;
        }
        run.decorations.retain(|d| d.width > 0.0);
    }
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

/// Test only (the raw-Blitz canaries of [`find_external_svg_image`]): `html` parsed by Blitz,
/// laid out when `resolve` (NO vellora gate or correction), and, for each `<svg>` Blitz parsed
/// into `ImageData::Svg` (DOM order), whether Blitz's own usvg tree holds any node. With
/// `resolve` false this is the document the gate inspects: no SVG may be parsed yet.
#[cfg(test)]
pub(crate) fn raw_blitz_svg_trees_have_content(html: &str, resolve: bool) -> Vec<bool> {
    use blitz_dom::node::{ImageData, SpecialElementData};
    let mut doc = build_document_with(
        html,
        crate::fonts::build_font_context(&[]),
        DocumentSyntax::Html,
        Some(layout_viewport(800.0, 600.0).0),
    );
    if resolve {
        doc.resolve(0.0);
    }
    let mut found = Vec::new();
    let mut stack = vec![doc.root_element().id];
    while let Some(id) = stack.pop() {
        let Some(node) = doc.get_node(id) else {
            continue;
        };
        stack.extend(node.children.iter().rev().copied());
        if let Some(el) = node.element_data() {
            if let SpecialElementData::Image(data) = &el.special_data {
                if let ImageData::Svg(svg) = &**data {
                    found.push(svg.tree.root().has_children());
                }
            }
        }
    }
    found
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
