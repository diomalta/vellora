//! Debug layout dump model (fidelity tooling only — see [`crate::debug_layout_dump`]).
//!
//! Everything here is reached ONLY through [`DumpCapture`], the non-production
//! [`LayoutObserver`]; the render path passes `NoObserver`, so none of this runs
//! in (or can change the bytes of) a normal render. This module imports NO Blitz
//! type: the single Blitz contact is
//! [`BlitzSnapshot::capture`](crate::blitz_engine::BlitzSnapshot::capture) in
//! `blitz_engine.rs`, which copies the laid-out tree into the owned [`RawTree`]
//! below. Keying by source-DOM path, the Blitz-tree layers (`B0`, `N0`), their
//! raw Parley text runs, vellora's box layers (`L0` + one per pass), the
//! pagination trace (`P`) and the JSON writer ([`json`]) all work on owned data.
//! Not a stable API; consumed by `fidelity/layout-diff/`.

pub mod json;

use std::collections::HashMap;

use crate::blitz_engine::{BlitzSnapshot, LaidOutBox, LayoutObserver};
use crate::pagination::PaginationTrace;

// ---------------------------------------------------------------------------
// Raw capture (filled by `blitz_engine.rs`, the only Blitz-touching part).
// ---------------------------------------------------------------------------

/// Owned copy of a laid-out Blitz document: every node reachable from the
/// document node through DOM children, `::before`/`::after` and Blitz's
/// `layout_children`, plus the Parley runs of every inline root.
#[derive(Debug, Clone, Default)]
pub(crate) struct RawTree {
    pub document: usize,
    pub root_element: usize,
    pub nodes: Vec<RawNode>,
    pub runs: Vec<RawRun>,
}

#[derive(Debug, Clone)]
pub(crate) struct RawNode {
    pub id: usize,
    /// `document`, `element`, `anonymous`, `text` or `comment`.
    pub kind: &'static str,
    pub tag: Option<String>,
    pub id_attr: Option<String>,
    pub class_attr: Option<String>,
    pub parent: Option<usize>,
    /// DOM children, in order.
    pub children: Vec<usize>,
    pub layout_parent: Option<usize>,
    /// `Node::containing_block()`: the box this node's layout location is
    /// relative to (`oof_containing_block` for an out-of-flow box Taffy hoisted
    /// to its containing block, else the layout parent).
    pub containing_block: Option<usize>,
    /// Blitz's layout children (incl. anonymous blocks), when it has computed them.
    pub layout_children: Option<Vec<usize>>,
    pub before: Option<usize>,
    pub after: Option<usize>,
    pub inline_root: bool,
    pub display_outside: Option<String>,
    pub display_inside: Option<String>,
    /// `None` for nodes without Blitz layout data (text, comments).
    pub layout: Option<RawLayout>,
    /// Inline roots: the full text Blitz shaped.
    pub inline_text: Option<String>,
    /// Inline roots: Blitz's block-axis offset of the line boxes (`align-content`,
    /// e.g. a table cell's `vertical-align`), which Blitz's own painter adds.
    pub block_offset: f64,
}

/// Parent-relative layout of one node: rounded `final_layout` (what both vellora's
/// walk and Blitz's painter read) and `unrounded_layout` (Taffy before rounding).
#[derive(Debug, Clone, Copy)]
pub(crate) struct RawLayout {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub ux: f64,
    pub uy: f64,
    pub uwidth: f64,
    pub uheight: f64,
    /// `[top, right, bottom, left]`.
    pub border: [f64; 4],
    pub padding: [f64; 4],
}

/// One Parley glyph run as Blitz laid it out (no vellora reader compensation).
#[derive(Debug, Clone)]
pub(crate) struct RawRun {
    pub owner: usize,
    pub brush: usize,
    pub line_index: usize,
    pub glyph_count: usize,
    pub text: String,
    pub font_size: f32,
    pub ascent: f32,
    pub descent: f32,
    pub line_baseline: f32,
    pub line_top: f32,
    pub line_bottom: f32,
    pub face: &'static str,
    /// `GlyphRun::offset()` / `baseline()`, relative to the inline root's content box
    /// (before `block_offset`).
    pub offset: f64,
    pub baseline: f64,
    /// Sum of the run's glyph advances.
    pub advance: f64,
}

// ---------------------------------------------------------------------------
// Dump model.
// ---------------------------------------------------------------------------

/// Owned snapshot of every layout stage of one document. Produced by
/// [`crate::debug_layout_dump`]; consumed by `fidelity/layout-diff/`. Not a
/// stable API.
#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct LayoutDump {
    /// Viewport handed to Blitz: the @page content box TRUNCATED to whole CSS px
    /// (`content_width_px as u32` in `resolve_and_walk`).
    pub viewport_width_px: u32,
    pub viewport_height_px: u32,
    /// The resolved `@page` box (its untruncated content box is width - margins).
    pub page: crate::page_css::PageBox,
    /// Media type Blitz evaluated the stylesheets against. `build_document` never
    /// sets `DocumentConfig::media_type`, so this is Blitz's default, `screen`.
    pub media_type: &'static str,
    /// `true` only for the source-HTML dump ([`DumpCapture::source_html`],
    /// fidelity layer `N0`). Since port step 05 there is no HTML pre-pass, so
    /// both dumps lay out the input as given (JSON `html_normalize`: `"skipped"`
    /// here, `"removed"` otherwise).
    pub source_html: bool,
    /// Every node seen in the DOM walk or in Blitz's layout tree.
    pub nodes: Vec<DumpNode>,
    /// `B0`: Blitz's own layout tree, walked through `layout_children` (which
    /// includes anonymous blocks and `::before`/`::after` boxes) from the root
    /// element. Each box is placed the way Blitz's painter places it: its
    /// `final_layout` (and `unrounded_layout`) location added to the origin of its
    /// `containing_block` (port step 05; before, every box was accumulated under
    /// its layout parent, which put out-of-flow boxes hoisted to an ancestor
    /// containing block at the wrong place).
    pub blitz_tree: Vec<DumpBlitzBox>,
    /// Text of the `B0` tree: every Parley run of every inline root in it
    /// (anonymous blocks and pseudo-elements included), positioned the way
    /// Blitz's own painter places it — content box of the layout-tree box +
    /// `block_offset` + the run's raw `offset()`/`baseline()` — i.e. BEFORE any
    /// vellora reader compensation. In the source-HTML dump this is `N0` text.
    pub blitz_runs: Vec<DumpBlitzRun>,
    /// `L0` (vellora's box walk, before any pass: Blitz's box tree in layout
    /// order with each table's row structure re-inserted, positioned through the
    /// containing-block chain; since port step 05 it includes anonymous blocks and
    /// `::before`/`::after` boxes and no longer text nodes or non-atomic inline
    /// elements, see `blitz_engine::LaidOutBox`), then one layer per
    /// [`crate::blitz_engine::LAYOUT_NORMALIZE_PASSES`] entry, in order. Box `i`
    /// of every layer is the same node: passes never add, drop, or reorder boxes
    /// (checked, see `layer_order_violations`).
    pub layers: Vec<DumpLayer>,
    /// Metadata per text run, aligned to `(box_index, run_index)` of the layers.
    pub runs: Vec<DumpRunMeta>,
    /// L0 box indices whose Parley runs could not be re-aligned to the walk's
    /// runs (metadata omitted for them; expected empty).
    pub run_meta_mismatches: Vec<usize>,
    /// Layers whose box node-id sequence differs from `L0` (expected empty).
    pub layer_order_violations: Vec<String>,
    /// `P`: what pagination did with the final layer (fragments, gaps, cursor,
    /// pages). `None` for the source-HTML dump, which is not what `render`
    /// paginates.
    pub pagination: Option<PaginationTrace>,
}

#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct DumpNode {
    pub node_id: usize,
    /// `element`, `anonymous`, `pseudo`, `text`, `comment`, or `document`.
    pub kind: &'static str,
    pub tag: Option<String>,
    pub id_attr: Option<String>,
    pub class_attr: Option<String>,
    /// Stable key in the SOURCE DOM, e.g. `html>body:nth-child(2)>div:nth-child(1)`.
    /// `:nth-child(k)` counts element siblings (CSS semantics), so keys equal the
    /// browser's for the same input. Nodes without a source counterpart end in a
    /// `::`/`#` segment (`::blitz-anon(j)`, `::before`, `::after`, `#text`).
    pub dom_path: String,
    pub parent: Option<usize>,
    pub layout_parent: Option<usize>,
    pub inline_root: bool,
    pub display_outside: Option<String>,
    pub display_inside: Option<String>,
}

#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct DumpBlitzBox {
    pub node_id: usize,
    pub depth: usize,
    /// Border box, absolute document CSS px, from the ROUNDED `final_layout`
    /// (what vellora's walk reads).
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    /// Same box from `unrounded_layout` (Taffy output before `round_layout`).
    pub ux: f64,
    pub uy: f64,
    pub uwidth: f64,
    pub uheight: f64,
    /// `[top, right, bottom, left]` border / padding widths (final layout).
    pub border: [f64; 4],
    pub padding: [f64; 4],
    /// For inline roots: the text Blitz shaped for this box (first 240 chars).
    pub inline_text: Option<String>,
}

/// One raw Blitz/Parley text run of the `B0`/`N0` tree (see
/// [`LayoutDump::blitz_runs`]).
#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct DumpBlitzRun {
    /// Inline root owning the run (a `blitz_tree` box).
    pub owner_node_id: usize,
    /// Node whose computed style shaped the run.
    pub brush_node_id: usize,
    pub line_index: usize,
    pub text: String,
    pub font_size: f32,
    pub ascent: f32,
    pub descent: f32,
    pub face: &'static str,
    pub glyph_count: usize,
    /// Baseline origin, absolute document CSS px (Blitz painter placement).
    pub origin_x: f64,
    pub origin_y: f64,
    /// Sum of the run's glyph advances (CSS px).
    pub advance: f64,
    /// The raw parts of the origin: `GlyphRun::offset()`/`baseline()` relative to
    /// the owner's content box, and the owner's `block_offset` (already in `origin_y`).
    pub offset: f64,
    pub baseline: f64,
    pub block_offset: f64,
}

#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct DumpLayer {
    /// `L0`, or the `LAYOUT_NORMALIZE_PASSES` name of the pass just applied.
    pub name: String,
    pub boxes: Vec<DumpBox>,
}

#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct DumpBox {
    pub node_id: usize,
    pub depth: usize,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    /// Blitz's resolved vertical margins (each box's own; pagination keeps a
    /// fragment's leading margin after a forced break).
    pub margin_top: f64,
    pub margin_bottom: f64,
    pub runs: Vec<DumpRunGeom>,
}

#[doc(hidden)]
#[derive(Debug, Clone, Copy)]
pub struct DumpRunGeom {
    /// Baseline origin, absolute document CSS px.
    pub origin_x: f64,
    pub origin_y: f64,
    /// Sum of the run's glyph advances (CSS px).
    pub advance: f64,
}

#[doc(hidden)]
#[derive(Debug, Clone)]
pub struct DumpRunMeta {
    pub box_index: usize,
    pub run_index: usize,
    /// Inline root owning the run.
    pub owner_node_id: usize,
    /// Node whose computed style shaped the run (e.g. a `<span>`).
    pub brush_node_id: usize,
    pub line_index: usize,
    /// Source text the run's glyph clusters cover.
    pub text: String,
    pub font_size: f32,
    /// Parley run metrics (CSS px).
    pub ascent: f32,
    pub descent: f32,
    /// Parley line metrics, relative to the inline root's content box.
    pub line_baseline: f32,
    pub line_top: f32,
    pub line_bottom: f32,
    /// Bundled face file name, else `custom-or-unknown`.
    pub face: &'static str,
    pub glyph_count: usize,
}

// ---------------------------------------------------------------------------
// The observer.
// ---------------------------------------------------------------------------

/// The debug-dump [`LayoutObserver`] (see [`crate::debug_layout_dump`]).
#[doc(hidden)]
#[derive(Default)]
pub struct DumpCapture {
    source_html: bool,
    viewport_px: (u32, u32),
    nodes: Vec<DumpNode>,
    blitz_tree: Vec<DumpBlitzBox>,
    blitz_runs: Vec<DumpBlitzRun>,
    layers: Vec<DumpLayer>,
    runs: Vec<DumpRunMeta>,
    run_meta_mismatches: Vec<usize>,
    layer_order_violations: Vec<String>,
}

impl LayoutObserver for DumpCapture {
    fn after_walk(
        &mut self,
        blitz: &BlitzSnapshot<'_>,
        boxes: &[LaidOutBox],
        viewport: (u32, u32),
    ) {
        self.viewport_px = viewport;
        let raw = blitz.capture();
        let index: HashMap<usize, &RawNode> = raw.nodes.iter().map(|n| (n.id, n)).collect();
        let mut nodes = dump_dom_nodes(&raw, &index);
        let (tree, runs) = dump_blitz_tree(&raw, &index, &mut nodes);
        self.blitz_tree = tree;
        self.blitz_runs = runs;
        self.nodes = nodes;
        let (metas, mismatches) = dump_run_meta(&raw, boxes);
        self.runs = metas;
        self.run_meta_mismatches = mismatches;
        self.layers.push(dump_layer("L0", boxes));
    }

    fn after_pass(&mut self, name: &'static str, boxes: &[LaidOutBox]) {
        let layer = dump_layer(name, boxes);
        let same_order = self.layers.first().is_some_and(|l0| {
            l0.boxes.len() == layer.boxes.len()
                && l0
                    .boxes
                    .iter()
                    .zip(&layer.boxes)
                    .all(|(a, b)| a.node_id == b.node_id)
        });
        if !same_order {
            self.layer_order_violations.push(name.to_string());
        }
        self.layers.push(layer);
    }
}

impl DumpCapture {
    /// The source-HTML capture (fidelity layer `N0`: Blitz on the source HTML).
    /// Since port step 05 deleted the HTML pre-pass this lays out exactly what
    /// the default capture does; only the JSON marks it as the source layer.
    pub fn source_html() -> Self {
        Self {
            source_html: true,
            ..Self::default()
        }
    }

    /// Whether this is the source-HTML (`N0`) capture.
    pub fn is_source_html(&self) -> bool {
        self.source_html
    }

    pub(crate) fn finish(
        self,
        page: crate::page_css::PageBox,
        pagination: Option<PaginationTrace>,
    ) -> LayoutDump {
        LayoutDump {
            viewport_width_px: self.viewport_px.0,
            viewport_height_px: self.viewport_px.1,
            page,
            media_type: "screen",
            source_html: self.source_html,
            nodes: self.nodes,
            blitz_tree: self.blitz_tree,
            blitz_runs: self.blitz_runs,
            layers: self.layers,
            runs: self.runs,
            run_meta_mismatches: self.run_meta_mismatches,
            layer_order_violations: self.layer_order_violations,
            pagination,
        }
    }
}

// ---------------------------------------------------------------------------
// Builders (pure functions over owned data).
// ---------------------------------------------------------------------------

fn dump_layer(name: &str, boxes: &[LaidOutBox]) -> DumpLayer {
    DumpLayer {
        name: name.to_string(),
        boxes: boxes
            .iter()
            .map(|b| DumpBox {
                node_id: b.node_id,
                depth: b.depth,
                x: b.x,
                y: b.y,
                width: b.width,
                height: b.height,
                margin_top: b.margin_top,
                margin_bottom: b.margin_bottom,
                runs: b
                    .text_runs
                    .iter()
                    .map(|r| DumpRunGeom {
                        origin_x: r.origin_x,
                        origin_y: r.origin_y,
                        advance: r.glyphs.iter().map(|g| g.advance as f64).sum(),
                    })
                    .collect(),
            })
            .collect(),
    }
}

fn dump_node(node: &RawNode, kind: &'static str, dom_path: String) -> DumpNode {
    DumpNode {
        node_id: node.id,
        kind,
        tag: node.tag.clone(),
        id_attr: node.id_attr.clone(),
        class_attr: node.class_attr.clone(),
        dom_path,
        parent: node.parent,
        layout_parent: node.layout_parent,
        inline_root: node.inline_root,
        display_outside: node.display_outside.clone(),
        display_inside: node.display_inside.clone(),
    }
}

/// Key every DOM node by its SOURCE-DOM path (see [`DumpNode::dom_path`]).
fn dump_dom_nodes(raw: &RawTree, index: &HashMap<usize, &RawNode>) -> Vec<DumpNode> {
    let Some(root) = index.get(&raw.document) else {
        return Vec::new();
    };
    let mut out = vec![dump_node(root, "document", "#document".to_string())];
    let mut stack: Vec<(usize, String)> = vec![(root.id, String::new())];
    while let Some((id, path)) = stack.pop() {
        let Some(node) = index.get(&id) else {
            continue;
        };
        let mut element_k = 0usize;
        let mut next: Vec<(usize, String)> = Vec::new();
        for &child in &node.children {
            let Some(child_node) = index.get(&child) else {
                continue;
            };
            let kind = child_node.kind;
            match kind {
                "element" | "anonymous" => {
                    element_k += 1;
                    let tag = child_node.tag.clone().unwrap_or_default();
                    let child_path = if path.is_empty() {
                        tag
                    } else {
                        format!("{path}>{tag}:nth-child({element_k})")
                    };
                    out.push(dump_node(child_node, kind, child_path.clone()));
                    next.push((child, child_path));
                }
                "text" => out.push(dump_node(child_node, kind, format!("{path}>#text"))),
                _ => out.push(dump_node(child_node, kind, format!("{path}>#{kind}"))),
            }
        }
        if !path.is_empty() {
            for (pseudo, name) in [(node.before, "before"), (node.after, "after")] {
                if let Some(pseudo_node) = pseudo.and_then(|p| index.get(&p)) {
                    out.push(dump_node(pseudo_node, "pseudo", format!("{path}>::{name}")));
                }
            }
        }
        stack.extend(next.into_iter().rev());
    }
    out
}

/// Absolute border-box origin of `id` as Blitz's painter places it: its layout
/// location plus the origin of its `containing_block` (`Node::absolute_position`
/// without scroll offsets), as `[x, y, unrounded x, unrounded y]`, memoised.
fn painter_origin(
    index: &HashMap<usize, &RawNode>,
    id: usize,
    memo: &mut HashMap<usize, [f64; 4]>,
) -> [f64; 4] {
    let mut chain = Vec::new();
    let mut origin = [0.0; 4];
    let mut current = Some(id);
    while let Some(c) = current {
        if let Some(known) = memo.get(&c) {
            origin = *known;
            break;
        }
        let Some(node) = index.get(&c) else {
            break;
        };
        chain.push(c);
        current = node.containing_block;
    }
    for c in chain.into_iter().rev() {
        if let Some(l) = index.get(&c).and_then(|n| n.layout) {
            origin = [
                origin[0] + l.x,
                origin[1] + l.y,
                origin[2] + l.ux,
                origin[3] + l.uy,
            ];
        }
        memo.insert(c, origin);
    }
    origin
}

/// `B0`: Blitz's own layout tree, plus its raw text runs. Anonymous blocks (absent
/// from the DOM) are appended to `nodes`, keyed under their layout parent.
fn dump_blitz_tree(
    raw: &RawTree,
    index: &HashMap<usize, &RawNode>,
    nodes: &mut Vec<DumpNode>,
) -> (Vec<DumpBlitzBox>, Vec<DumpBlitzRun>) {
    let mut path_of: HashMap<usize, String> = nodes
        .iter()
        .map(|n| (n.node_id, n.dom_path.clone()))
        .collect();
    let mut runs_of: HashMap<usize, Vec<&RawRun>> = HashMap::new();
    for run in &raw.runs {
        runs_of.entry(run.owner).or_default().push(run);
    }
    let mut anon_count: HashMap<Option<usize>, usize> = HashMap::new();
    let mut origins: HashMap<usize, [f64; 4]> = HashMap::new();
    let mut out = Vec::new();
    let mut text = Vec::new();
    // (node, depth): layout-tree order; positions from the containing-block chain.
    let mut stack: Vec<(usize, usize)> = vec![(raw.root_element, 0)];
    while let Some((id, depth)) = stack.pop() {
        let Some(node) = index.get(&id) else {
            continue;
        };
        let Some(l) = node.layout else {
            continue;
        };
        let [x, y, ux, uy] = painter_origin(index, id, &mut origins);
        if !path_of.contains_key(&id) {
            let parent = node.layout_parent;
            let parent_path = parent
                .and_then(|p| path_of.get(&p).cloned())
                .unwrap_or_else(|| "?".into());
            let j = anon_count.entry(parent).or_insert(0);
            *j += 1;
            let path = format!("{parent_path}>::blitz-anon({j})");
            nodes.push(dump_node(node, node.kind, path.clone()));
            path_of.insert(id, path);
        }
        // Blitz's painter places an inline root's text at its content box
        // (final_layout border + padding) plus `block_offset`, then each glyph run
        // at its own offset/baseline (blitz-paint `render_element` +
        // `draw_inline_layout` + `stroke_text`).
        let content_x = x + l.border[3] + l.padding[3];
        let content_y = y + l.border[0] + l.padding[0];
        for run in runs_of.get(&id).into_iter().flatten() {
            text.push(DumpBlitzRun {
                owner_node_id: id,
                brush_node_id: run.brush,
                line_index: run.line_index,
                text: run.text.clone(),
                font_size: run.font_size,
                ascent: run.ascent,
                descent: run.descent,
                face: run.face,
                glyph_count: run.glyph_count,
                origin_x: content_x + run.offset,
                origin_y: content_y + node.block_offset + run.baseline,
                advance: run.advance,
                offset: run.offset,
                baseline: run.baseline,
                block_offset: node.block_offset,
            });
        }
        out.push(DumpBlitzBox {
            node_id: id,
            depth,
            x,
            y,
            width: l.width,
            height: l.height,
            ux,
            uy,
            uwidth: l.uwidth,
            uheight: l.uheight,
            border: l.border,
            padding: l.padding,
            inline_text: node
                .inline_text
                .as_ref()
                .map(|t| t.chars().take(240).collect()),
        });
        if let Some(children) = &node.layout_children {
            for &child in children.iter().rev() {
                stack.push((child, depth + 1));
            }
        }
    }
    (out, text)
}

/// Re-align each L0 inline root's raw Parley runs (captured in EXACTLY
/// `read_text_runs`'s iteration and skip order) with the walk's `TextRun`s. A box
/// whose counts disagree is reported in the mismatch list instead.
fn dump_run_meta(raw: &RawTree, boxes: &[LaidOutBox]) -> (Vec<DumpRunMeta>, Vec<usize>) {
    let mut runs_of: HashMap<usize, Vec<&RawRun>> = HashMap::new();
    for run in &raw.runs {
        runs_of.entry(run.owner).or_default().push(run);
    }
    let mut out = Vec::new();
    let mut mismatches = Vec::new();
    for (box_index, b) in boxes.iter().enumerate() {
        if b.text_runs.is_empty() {
            continue;
        }
        let metas = runs_of.get(&b.node_id).map(Vec::as_slice).unwrap_or(&[]);
        let aligned = metas.len() == b.text_runs.len()
            && metas
                .iter()
                .zip(&b.text_runs)
                .all(|(m, r)| m.glyph_count == r.glyphs.len());
        if !aligned {
            mismatches.push(box_index);
            continue;
        }
        for (run_index, (meta, run)) in metas.iter().zip(&b.text_runs).enumerate() {
            let start = run.glyphs.iter().map(|g| g.text_start).min().unwrap_or(0);
            let end = run.glyphs.iter().map(|g| g.text_end).max().unwrap_or(0);
            out.push(DumpRunMeta {
                box_index,
                run_index,
                owner_node_id: b.node_id,
                brush_node_id: meta.brush,
                line_index: meta.line_index,
                text: run.text.get(start..end).unwrap_or("").to_string(),
                font_size: meta.font_size,
                ascent: meta.ascent,
                descent: meta.descent,
                line_baseline: meta.line_baseline,
                line_top: meta.line_top,
                line_bottom: meta.line_bottom,
                face: meta.face,
                glyph_count: meta.glyph_count,
            });
        }
    }
    (out, mismatches)
}
