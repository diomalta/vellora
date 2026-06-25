//! The single internal module that touches Blitz.
//!
//! Per ARCHITECTURE.md ("isolate all Blitz contact behind a single internal
//! module so upstream API breaks touch one file") this is the ONLY place in
//! `vellora-core` that imports Blitz types. Everything above it consumes the
//! small, owned types defined here (`LaidOutDoc`, `LaidOutBox`, `TextRun`,
//! `Glyph`) and never sees a Blitz/Parley/Taffy type directly.

use base64::Engine as _;
use blitz_dom::{BaseDocument, DocumentConfig};
use blitz_html::HtmlDocument;
use blitz_traits::shell::{ColorScheme, Viewport};
use style::computed_values::table_layout::T as TableLayout;

/// A4 width in CSS px at 96dpi (210mm). Used as the layout viewport width so
/// Taffy resolves percentage/`width:100%` boxes against a page-shaped canvas.
pub const A4_WIDTH_PX: f64 = 793.7008;
/// A4 height in CSS px at 96dpi (297mm). The viewport is tall so the whole
/// single-flow document lays out; OUR pagination slices it afterwards.
pub const A4_HEIGHT_PX: f64 = 1122.5197;

/// One positioned box read out of Blitz's laid-out tree.
///
/// Coordinates are **absolute document coordinates** in CSS px (top-left
/// origin), already accumulated down the parent chain — pagination consumes
/// these directly.
#[derive(Debug, Clone)]
pub struct LaidOutBox {
    pub node_id: usize,
    pub tag: Option<String>,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub margin_top: f64,
    pub margin_bottom: f64,
    /// Explicit computed `width: <percentage>` hint from CSS. Blitz currently
    /// loses this in some auto table layout cases; we keep the hint so the
    /// post-walk table pass can preserve browser-like column proportions.
    pub width_pct_hint: Option<f64>,
    /// Whether this box is a table with `table-layout: fixed`.
    pub table_layout_fixed: bool,
    /// Table-cell span in columns. Non-cell boxes use `1`.
    pub colspan: usize,
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
    let doc = build_document(html);
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
    let doc = build_document(html);
    let base: &BaseDocument = doc.as_ref();
    let root_id = base.root_element().id;
    let mut max_depth = 0usize;
    // (node_id, depth-of-this-node-counting-only-elements).
    let mut stack: Vec<(usize, usize)> = vec![(root_id, 0)];
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

/// Build a parsed Blitz document (parse only; no style/layout yet).
fn build_document(html: &str) -> HtmlDocument {
    HtmlDocument::from_html(
        html,
        DocumentConfig {
            base_url: Some("https://vellora.local/".to_string()),
            // Self-contained, deterministic fonts: bundled faces with system-font
            // discovery off (see `crate::fonts`). This is what removes the
            // `libfontconfig` runtime dependency and makes output machine-independent.
            font_ctx: Some(crate::fonts::build_font_context()),
            ..Default::default()
        },
    )
}

fn walk_for_denied(
    base: &BaseDocument,
    node_id: usize,
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

/// Normalize browser-compatible mixed-flow table cells, then parse + style +
/// layout + text in one call. Owns and drops the `!Send` `BaseDocument`
/// entirely within this function (lifetime contract).
pub fn lay_out(html: &str) -> LaidOutDoc {
    let normalized = crate::html_normalize::normalize_table_cell_mixed_flow(html);
    let doc = build_document(&normalized);
    // Standalone/test helper: lay out against the full A4 width. The render path
    // uses `validate_then_lay_out` with the real @page content width.
    resolve_and_walk(doc, A4_WIDTH_PX, A4_HEIGHT_PX)
}

/// Normalize browser-compatible mixed-flow table cells, then parse one Blitz
/// document, run the subset-validation walk over that single parsed tree, and
/// only if it passes, resolve + walk into a [`LaidOutDoc`]. The `denied`
/// allowlist is supplied by the validation gate.
///
/// Returns `Err(DeniedElement)` for the first out-of-subset element; the caller
/// turns it into a located diagnostic.
pub fn validate_then_lay_out(
    html: &str,
    denied: &[&str],
    content_width_px: f64,
    content_height_px: f64,
) -> Result<LaidOutDoc, DeniedElement> {
    let normalized = crate::html_normalize::normalize_table_cell_mixed_flow(html);
    let doc = build_document(&normalized);
    // Validate and lay out the same Blitz parse. The table-cell normalizer may
    // parse/serialize HTML before this point, but there is still one Blitz tree
    // shared by validation and layout.
    if let Some(found) = find_denied_in_document(doc.as_ref(), denied) {
        return Err(found);
    }
    Ok(resolve_and_walk(doc, content_width_px, content_height_px))
}

/// Resolve style+layout on a parsed document and read it into a `LaidOutDoc`.
///
/// `content_width_px` is the @page CONTENT width (page width minus left/right
/// margins) — the box the document flows into. Laying out against the full page
/// width instead would make `width:100%` boxes overflow once pagination offsets
/// them by the left margin (the clipped-last-column bug).
fn resolve_and_walk(
    mut doc: HtmlDocument,
    content_width_px: f64,
    content_height_px: f64,
) -> LaidOutDoc {
    let viewport = Viewport::new(
        content_width_px as u32,
        content_height_px.max(0.0) as u32,
        1.0,
        ColorScheme::Light,
    );
    doc.as_mut().set_viewport(viewport);
    doc.as_mut().resolve(0.0);

    let base: &BaseDocument = doc.as_ref();
    let mut boxes = Vec::new();
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
    walk(base, root_id, 0.0, 0.0, 0, &mut boxes, &mut face_cache);
    crate::layout_normalize::normalize_vertical_margin_collapse(&mut boxes);
    crate::layout_normalize::normalize_fixed_table_widths(&mut boxes);
    crate::layout_normalize::normalize_table_percent_widths(&mut boxes);

    let content_height = base.root_element().final_layout.size.height as f64;

    LaidOutDoc {
        boxes,
        viewport_width: content_width_px,
        viewport_height: content_height_px,
        content_height,
    }
}

/// Recursively read the laid-out tree, accumulating parent-relative
/// `final_layout` offsets into absolute document coordinates.
fn walk(
    base: &BaseDocument,
    node_id: usize,
    parent_x: f64,
    parent_y: f64,
    depth: usize,
    out: &mut Vec<LaidOutBox>,
    face_cache: &mut std::collections::HashMap<u64, std::sync::Arc<Vec<u8>>>,
) {
    let node = match base.get_node(node_id) {
        Some(n) => n,
        None => return,
    };

    let layout = &node.final_layout;
    let abs_x = parent_x + layout.location.x as f64;
    let abs_y = parent_y + layout.location.y as f64;

    let tag = node
        .data
        .downcast_element()
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
    let text_runs = read_text_runs(base, node, content_x, content_y, face_cache);
    let (visual_rects, rounded_borders) = read_visuals(node, abs_x, abs_y);
    let image_runs = read_image_runs(node, content_x, content_y, content_width, content_height);

    out.push(LaidOutBox {
        node_id,
        tag,
        x: abs_x,
        y: abs_y,
        width: layout.size.width as f64,
        height: layout.size.height as f64,
        margin_top: layout.margin.top as f64,
        margin_bottom: layout.margin.bottom as f64,
        width_pct_hint: width_percentage_hint(node),
        table_layout_fixed: table_layout_fixed(node),
        colspan: colspan(node),
        depth,
        text_runs,
        visual_rects,
        rounded_borders,
        image_runs,
    });

    for &child in &node.children {
        walk(base, child, abs_x, abs_y, depth + 1, out, face_cache);
    }
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
    let layout = &node.final_layout;
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

fn read_image_runs(
    node: &blitz_dom::Node,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
) -> Vec<ImageRun> {
    let is_img = node
        .data
        .downcast_element()
        .is_some_and(|el| el.name.local.as_ref().eq_ignore_ascii_case("img"));
    if !is_img || width <= 0.0 || height <= 0.0 || !width.is_finite() || !height.is_finite() {
        return Vec::new();
    }

    let Some(src) = node.attr(blitz_dom::local_name!("src")) else {
        return Vec::new();
    };
    let Some((format, data)) = parse_image_data_url(src) else {
        return Vec::new();
    };

    vec![ImageRun {
        x,
        y,
        width,
        height,
        format,
        data: std::sync::Arc::new(data),
    }]
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
    let mut runs = Vec::new();

    for line in layout.lines() {
        let total_inline_padding_px: f64 = line
            .items()
            .filter_map(|item| match item {
                parley::PositionedLayoutItem::GlyphRun(gr) => {
                    Some(inline_padding_right_px(base, gr.style().brush.id))
                }
                _ => None,
            })
            .sum();
        let mut consumed_by_run: std::collections::HashMap<(usize, usize, usize), usize> =
            std::collections::HashMap::new();
        let mut inline_advance_adjust_px =
            line_alignment_adjust_px(base, node.id, total_inline_padding_px);
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
            let padding_right_px = inline_padding_right_px(base, style.brush.id);

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

            if glyphs.is_empty() {
                continue;
            }

            runs.push(TextRun {
                text: source.clone(),
                font_data,
                font_index,
                font_size,
                origin_x: abs_x + glyph_run.offset() as f64 + inline_advance_adjust_px,
                origin_y: abs_y + glyph_run.baseline() as f64,
                glyphs,
                color,
            });
            inline_advance_adjust_px += padding_right_px;
        }
    }

    runs
}

/// Blitz's inline layout currently exposes glyph positions without advancing
/// following glyph runs by inline `padding-right` on styled spans. The computed
/// style is still attached to the run's brush node, so compensate absolute
/// padding here until upstream starts including it in `GlyphRun::offset()`.
fn inline_padding_right_px(base: &BaseDocument, node_id: usize) -> f64 {
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

fn line_alignment_adjust_px(base: &BaseDocument, node_id: usize, total_padding_px: f64) -> f64 {
    base.get_node(node_id)
        .and_then(|n| n.primary_styles())
        .map(|styles| {
            use style::values::specified::TextAlignKeyword;

            match styles.clone_text_align() {
                TextAlignKeyword::Right | TextAlignKeyword::End | TextAlignKeyword::MozRight => {
                    -total_padding_px
                }
                TextAlignKeyword::Center | TextAlignKeyword::MozCenter => -total_padding_px / 2.0,
                _ => 0.0,
            }
        })
        .unwrap_or(0.0)
}

/// Resolve the computed text color for a styled node into sRGB bytes.
fn brush_color(base: &BaseDocument, node_id: usize) -> [u8; 3] {
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
