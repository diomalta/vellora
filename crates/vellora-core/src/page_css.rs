//! `@page` rules: page size, page margins and the `@top-center` / `@bottom-center` margin
//! boxes, cascaded per page (CSS Paged Media 3, "Cascading in the page context").
//!
//! Stylo does NOT retain CSS Paged Media margin boxes or page-context counters
//! (no Gecko/Servo engine does), so vellora runs its OWN small pass over the
//! source stylesheet to extract them.
//!
//! Every `@page` rule of every `<style>` element is read, in source order (port step 06; before
//! it, only the FIRST rule was read, whatever its selector). Each page gets the declarations of
//! the rules that match it, ordered like the element cascade: `!important` first, then cascade
//! layer (`@layer`; unlayered rules win over layered ones), then page-selector specificity, then
//! source order. Chrome 155 verified every rule below (`fidelity/baselines/port/06-page-rules`,
//! `attachments/chrome-probes-page-rules.json`):
//!
//! - Selectors: none (every page), `:first` (page 1), `:left` / `:right` (page 1 is a right page
//!   when the root element's `direction` is `ltr`, a left page when it is `rtl`), `:blank` (never:
//!   vellora generates no blank pages), and a page name (never: vellora does not implement the
//!   `page` property). A rule whose selector does not parse (`:nth(1)`, `:bogus`) is dropped.
//!   Specificity is (page name, `:first`/`:blank` count, `:left`/`:right` count).
//! - `@page` inside `@media` applies when the media query list names `print` or `all`; a query
//!   with a media feature is not evaluated and does not match. `@layer` blocks and statements
//!   order the cascade layers. Other at-rules (`@supports`, …) are skipped with their contents.
//! - Page declarations: `size`, `margin`, `margin-top/right/bottom/left`, and the text
//!   properties of the page context (`font*`, `color`, …), which the margin boxes inherit.
//! - Margin boxes: `content` and the same text properties, cascaded per box like the page's own.
//!
//! Blitz lays the document out once, at one width, so every page must have the same content
//! width (page width minus left and right margins). [`varying_width_rule`] finds the rule that
//! breaks it; the strict gate rejects that document as `css:page-varying-width`.

use std::sync::Arc;

/// 1 CSS px at 96dpi. Conversions: 1in = 96px = 25.4mm = 72pt.
const PX_PER_MM: f64 = 96.0 / 25.4;
const PX_PER_PT: f64 = 96.0 / 72.0;
const PX_PER_IN: f64 = 96.0;

/// Chromium print-compatible A4 in CSS px.
///
/// Chromium's `page.pdf({ format: "A4" })` emits a MediaBox of roughly
/// 594.96 x 841.92 pt. Use the same canonical named-size values for `size: A4`
/// so Vellora and the browser reference rasterize to the same page grid. Authors
/// who need exact physical dimensions can still specify `size: 210mm 297mm`.
const A4_W: f64 = 594.96 / 0.75;
const A4_H: f64 = 841.92 / 0.75;
/// US Letter in CSS px (8.5in x 11in).
const LETTER_W: f64 = 8.5 * PX_PER_IN;
const LETTER_H: f64 = 11.0 * PX_PER_IN;

/// Text properties of the page context and of a margin box that vellora lays out with the margin
/// box text (they inherit from the root element into the page context, and from there into the
/// margin boxes). Box properties (`border`, `padding`, `background`, …) of margin boxes are not
/// drawn.
const TEXT_PROPERTIES: &[&str] = &[
    "color",
    "font",
    "font-family",
    "font-size",
    "font-stretch",
    "font-style",
    "font-variant",
    "font-variant-caps",
    "font-weight",
    "letter-spacing",
    "line-height",
    "text-transform",
    "word-spacing",
];

/// Which page margin box a content template belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MarginBox {
    TopCenter,
    BottomCenter,
}

/// One cascaded declaration (`property: value`, `!important` already applied).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Declaration {
    pub property: String,
    pub value: String,
}

/// A running header/footer of one page, parsed from a margin-box at-rule's `content:`
/// declaration, with the text properties it is laid out with.
#[derive(Debug, Clone)]
pub struct MarginContent {
    pub which: MarginBox,
    /// Ordered template parts; `counter(page)`/`counter(pages)` resolve later.
    pub parts: Vec<ContentPart>,
    /// Text declarations of the page context (`@page { font-size: … }`), in cascade order.
    pub page_style: Vec<Declaration>,
    /// Text declarations of the margin box itself, in cascade order.
    pub box_style: Vec<Declaration>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContentPart {
    /// A literal string from a quoted token.
    Literal(String),
    /// `counter(page)` — resolved to the 1-based current page number.
    CounterPage,
    /// `counter(pages)` — resolved to the total page count.
    CounterPages,
}

/// The resolved `@page` box of one page.
#[derive(Debug, Clone)]
pub struct PageBox {
    /// Page size in CSS px.
    pub width: f64,
    pub height: f64,
    /// Margins in CSS px (top, right, bottom, left).
    pub margin_top: f64,
    pub margin_right: f64,
    pub margin_bottom: f64,
    pub margin_left: f64,
    /// Running header/footer templates.
    pub margins_content: Vec<MarginContent>,
    /// Every `@page` rule of the document, for [`PageBox::for_page`].
    sheet: Arc<PageSheet>,
}

impl PageBox {
    /// Usable content rectangle width (page width minus left/right margins).
    pub fn content_width(&self) -> f64 {
        self.width - self.margin_left - self.margin_right
    }
    /// Usable content rectangle height (page height minus top/bottom margins).
    pub fn content_height(&self) -> f64 {
        self.height - self.margin_top - self.margin_bottom
    }

    /// Default A4 with 16mm margins and no running content.
    pub fn default_a4() -> Self {
        let m = 16.0 * PX_PER_MM;
        PageBox {
            width: A4_W,
            height: A4_H,
            margin_top: m,
            margin_right: m,
            margin_bottom: m,
            margin_left: m,
            margins_content: Vec::new(),
            sheet: Arc::new(PageSheet::default()),
        }
    }

    /// The page box of page `index` (0-based). `rtl` is the root element's direction: it decides
    /// whether page 1 is a right page (`ltr`) or a left page (`rtl`). Without `:first`, `:left`
    /// or `:right` rules every page is this box (a clone, so callers may edit the fields of the
    /// box they paginate with).
    pub fn for_page(&self, index: usize, rtl: bool) -> PageBox {
        if !self.sheet.has_page_pseudo_classes() {
            return self.clone();
        }
        self.sheet.resolve(PageSide::of(index, rtl), &self.sheet)
    }
}

/// Parse every `@page` rule of the document's `<style>` elements and resolve page 1 (a right
/// page). Falls back to A4/16mm for everything no rule sets.
pub fn parse_page_box(html: &str) -> PageBox {
    let sheet = Arc::new(PageSheet::parse(html));
    sheet.resolve(PageSide::of(0, false), &sheet)
}

/// Byte offset (in `html`) of the `@page` rule that gives pages different content widths, if any
/// (see the module docs). Every combination of `:first` and `:left`/`:right` is resolved, so the
/// result does not depend on the page count.
pub fn varying_width_rule(html: &str) -> Option<usize> {
    let sheet = PageSheet::parse(html);
    if !sheet.has_page_pseudo_classes() {
        return None;
    }
    let sides = [
        PageSide {
            first: true,
            left: false,
        },
        PageSide {
            first: true,
            left: true,
        },
        PageSide {
            first: false,
            left: false,
        },
        PageSide {
            first: false,
            left: true,
        },
    ];
    let empty = Arc::new(PageSheet::default());
    let widths: Vec<f64> = sides
        .iter()
        .map(|side| sheet.resolve(*side, &empty).content_width())
        .collect();
    if widths.iter().all(|w| (w - widths[0]).abs() < 1e-6) {
        return None;
    }
    // The universal rules alone give the base width; the culprit is the first rule (source
    // order) with a page pseudo-class that sets a width-affecting property for a page whose
    // width differs from it.
    let base = sheet
        .universal_only()
        .resolve(sides[0], &empty)
        .content_width();
    let differing: Vec<PageSide> = sides
        .iter()
        .zip(&widths)
        .filter(|(_, w)| (*w - base).abs() >= 1e-6)
        .map(|(side, _)| *side)
        .collect();
    sheet
        .rules
        .iter()
        .filter(|rule| rule.has_page_pseudo_class())
        .find(|rule| {
            rule.declarations.iter().any(|d| {
                matches!(
                    d.property.as_str(),
                    "size" | "margin" | "margin-left" | "margin-right"
                )
            }) && differing
                .iter()
                .any(|side| rule.match_specificity(*side).is_some())
        })
        .or_else(|| sheet.rules.iter().find(|rule| rule.has_page_pseudo_class()))
        .map(|rule| rule.offset)
}

// ---------------------------------------------------------------------------------------------
// The parsed sheet and its per-page cascade.
// ---------------------------------------------------------------------------------------------

/// Which page a rule is matched against: page 1 or not, left or right.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct PageSide {
    first: bool,
    left: bool,
}

impl PageSide {
    fn of(index: usize, rtl: bool) -> Self {
        // Page 1 is a right page in a left-to-right page progression (css-page-3, "Spread
        // pseudo-classes"), so even indexes are right pages there.
        let right = index.is_multiple_of(2) != rtl;
        PageSide {
            first: index == 0,
            left: !right,
        }
    }
}

#[derive(Debug, Clone, Default, PartialEq)]
struct RawDeclaration {
    property: String,
    value: String,
    important: bool,
}

#[derive(Debug, Clone, Default, PartialEq)]
struct PageSelector {
    /// A page type name (`@page wide`): never matches (no `page` property support).
    named: bool,
    first: u32,
    blank: u32,
    left: u32,
    right: u32,
}

impl PageSelector {
    fn specificity(&self) -> (u32, u32, u32) {
        (
            u32::from(self.named),
            self.first + self.blank,
            self.left + self.right,
        )
    }

    fn matches(&self, side: PageSide) -> bool {
        !self.named
            && self.blank == 0
            && (self.first == 0 || side.first)
            && (self.left == 0 || side.left)
            && (self.right == 0 || !side.left)
    }

    fn has_pseudo_class(&self) -> bool {
        self.first + self.blank + self.left + self.right > 0
    }
}

#[derive(Debug, Clone, PartialEq)]
struct PageRule {
    /// Byte offset of the rule's `@page` in the source HTML.
    offset: usize,
    selectors: Vec<PageSelector>,
    /// Cascade layer rank: position of the layer in layer order; unlayered = `u32::MAX`.
    layer: u32,
    declarations: Vec<RawDeclaration>,
    /// `(margin box name, declarations)`; names are lowercased (`bottom-center`).
    margin_boxes: Vec<(String, Vec<RawDeclaration>)>,
}

impl PageRule {
    /// The specificity this rule applies with on `side` (its most specific matching selector).
    fn match_specificity(&self, side: PageSide) -> Option<(u32, u32, u32)> {
        self.selectors
            .iter()
            .filter(|s| s.matches(side))
            .map(PageSelector::specificity)
            .max()
    }

    fn has_page_pseudo_class(&self) -> bool {
        self.selectors.iter().any(PageSelector::has_pseudo_class)
    }
}

#[derive(Debug, Clone, Default)]
struct PageSheet {
    /// Every valid `@page` rule, in source order.
    rules: Vec<PageRule>,
}

/// What a cascaded declaration applies to.
#[derive(Clone, Copy)]
enum Target<'a> {
    Page,
    MarginBox(&'a str),
}

impl PageSheet {
    fn parse(html: &str) -> Self {
        let mut builder = SheetBuilder::default();
        for region in crate::css_scan::style_blocks(html) {
            let css = blank_comments(&region.text);
            builder.walk(&css, region.offset);
        }
        PageSheet {
            rules: builder.rules,
        }
    }

    fn has_page_pseudo_classes(&self) -> bool {
        self.rules.iter().any(PageRule::has_page_pseudo_class)
    }

    fn universal_only(&self) -> PageSheet {
        PageSheet {
            rules: self
                .rules
                .iter()
                .filter(|rule| !rule.has_page_pseudo_class())
                .cloned()
                .collect(),
        }
    }

    /// Cascade the declarations of every rule matching `side` into a page box.
    fn resolve(&self, side: PageSide, sheet: &Arc<PageSheet>) -> PageBox {
        // (important, layer key, specificity, rule order, declaration order): ascending, so the
        // winning declaration is applied last. Important declarations reverse the layer order.
        type Key = (bool, u32, (u32, u32, u32), usize, usize);
        let mut entries: Vec<(Key, Target<'_>, &RawDeclaration)> = Vec::new();
        for (order, rule) in self.rules.iter().enumerate() {
            let Some(specificity) = rule.match_specificity(side) else {
                continue;
            };
            let key = |important: bool, index: usize| -> Key {
                let layer = if important {
                    u32::MAX - rule.layer
                } else {
                    rule.layer
                };
                (important, layer, specificity, order, index)
            };
            for (index, d) in rule.declarations.iter().enumerate() {
                entries.push((key(d.important, index), Target::Page, d));
            }
            for (name, declarations) in &rule.margin_boxes {
                // Only the boxes vellora draws are cascaded (the others are rejected by the
                // strict gate, `css:page-margin-box`, or are not margin boxes at all). Skipping
                // them here keeps `boxes` below at two slots: before port step 09 every distinct
                // name got a slot found by a linear search, O(names²).
                if margin_box_name(name).is_none() {
                    continue;
                }
                for (index, d) in declarations.iter().enumerate() {
                    entries.push((key(d.important, index), Target::MarginBox(name), d));
                }
            }
        }
        entries.sort_by_key(|(key, _, _)| *key);

        let mut page = PageBox::default_a4();
        page.sheet = sheet.clone();
        let mut page_style: Vec<Declaration> = Vec::new();
        // (box name, content value, text declarations), in first-seen order.
        let mut boxes: Vec<(String, Option<String>, Vec<Declaration>)> = Vec::new();
        for (_, target, d) in entries {
            match target {
                Target::Page => match d.property.as_str() {
                    "size" => apply_size(&mut page, &d.value),
                    "margin" => apply_margin_shorthand(&mut page, &d.value),
                    "margin-top" => {
                        page.margin_top = length_px(&d.value).unwrap_or(page.margin_top)
                    }
                    "margin-right" => {
                        page.margin_right = length_px(&d.value).unwrap_or(page.margin_right)
                    }
                    "margin-bottom" => {
                        page.margin_bottom = length_px(&d.value).unwrap_or(page.margin_bottom)
                    }
                    "margin-left" => {
                        page.margin_left = length_px(&d.value).unwrap_or(page.margin_left)
                    }
                    p if TEXT_PROPERTIES.contains(&p) => set_declaration(&mut page_style, d),
                    _ => {}
                },
                Target::MarginBox(name) => {
                    let slot = match boxes.iter().position(|(n, _, _)| n == name) {
                        Some(i) => i,
                        None => {
                            boxes.push((name.to_string(), None, Vec::new()));
                            boxes.len() - 1
                        }
                    };
                    if d.property == "content" {
                        boxes[slot].1 = Some(d.value.clone());
                    } else if TEXT_PROPERTIES.contains(&d.property.as_str()) {
                        set_declaration(&mut boxes[slot].2, d);
                    }
                }
            }
        }
        for (name, content, box_style) in boxes {
            let (Some(which), Some(content)) = (margin_box_name(&name), content) else {
                continue;
            };
            let parts = parse_content_template(&content);
            if parts.is_empty() {
                continue;
            }
            page.margins_content.push(MarginContent {
                which,
                parts,
                page_style: page_style.clone(),
                box_style,
            });
        }
        page
    }
}

/// Apply a cascaded text declaration: it replaces an earlier one of the same property and moves
/// to the end, so re-emitting the list in order reproduces the cascade (shorthands included).
fn set_declaration(list: &mut Vec<Declaration>, d: &RawDeclaration) {
    list.retain(|existing| existing.property != d.property);
    list.push(Declaration {
        property: d.property.clone(),
        value: d.value.clone(),
    });
}

// ---------------------------------------------------------------------------------------------
// Stylesheet walk.
// ---------------------------------------------------------------------------------------------

/// Cascade layers, as a tree: a layer is a node under its parent layer, the root (node 0) is
/// "unlayered". A layer's rank is its position in layer order, which is the order in which the
/// layers are first named (`@layer` statement or block), whatever their nesting.
///
/// Port step 09: the layers used to be a list of dotted names (`a.a.a…`) searched linearly, so
/// `n` layers cost O(n²) time and `n` nested layers O(n²) memory. A dotted name is the path of
/// its `.`-separated segments, so two names are equal exactly when their paths are: the tree
/// gives every layer the rank the dotted list gave it.
struct LayerTree {
    /// `(parent node, segment)` → node.
    children: std::collections::HashMap<(u32, String), u32>,
    /// Rank of each node (index = node id) once the layer is named; `None` for a node that only
    /// exists as the prefix of a dotted name (`a` in `@layer a.b`).
    ranks: Vec<Option<u32>>,
    next_rank: u32,
}

impl Default for LayerTree {
    fn default() -> Self {
        LayerTree {
            children: std::collections::HashMap::new(),
            ranks: vec![None],
            next_rank: 0,
        }
    }
}

impl LayerTree {
    /// The unlayered root.
    const ROOT: u32 = 0;

    fn new_node(&mut self) -> u32 {
        self.ranks.push(None);
        u32::try_from(self.ranks.len() - 1).unwrap_or(u32::MAX)
    }

    /// The node of the (possibly dotted) layer `name` inside `parent`, created on first sight.
    fn node(&mut self, parent: u32, name: &str) -> u32 {
        name.split('.').fold(parent, |node, segment| {
            let key = (node, segment.to_string());
            if let Some(&child) = self.children.get(&key) {
                return child;
            }
            let child = self.new_node();
            self.children.insert(key, child);
            child
        })
    }

    /// A new anonymous layer (`@layer { … }`): every one is distinct, so it has no key.
    fn anonymous(&mut self) -> u32 {
        self.new_node()
    }

    /// The rank of `node`, given on its first naming (layer order = order of first appearance).
    fn rank(&mut self, node: u32) -> u32 {
        let slot = &mut self.ranks[node as usize];
        *slot.get_or_insert_with(|| {
            let rank = self.next_rank.min(u32::MAX - 1);
            self.next_rank = self.next_rank.saturating_add(1);
            rank
        })
    }
}

#[derive(Default)]
struct SheetBuilder {
    rules: Vec<PageRule>,
    layers: LayerTree,
}

/// A block the sheet walk is inside of (a matching `@media` or an `@layer` block): its cascade
/// layer rank (`u32::MAX` unlayered) and layer node.
#[derive(Clone, Copy)]
struct Frame {
    layer: u32,
    layer_node: u32,
}

impl SheetBuilder {
    /// Walk the rules of one CSS text (comments blanked); `base` maps a text offset back to the
    /// HTML.
    ///
    /// One linear pass with an explicit stack of the blocks it is inside of (port step 09): a
    /// matching `@media` block or an `@layer` block pushes a [`Frame`] and the walk continues
    /// inside it; the `}` that closes it pops it. Every other block (`@page`, a style rule, an
    /// `@supports`, a non-matching `@media`, …) is skipped with one forward scan. Before this
    /// step the walk recursed into each `@media`/`@layer` block and re-scanned it to find its
    /// end, so nesting cost O(depth²) time and native stack per level: 20 000 nested
    /// `@media all {` aborted the Node process through the napi addon (SIGILL, stack overflow,
    /// which `catch_unwind` cannot catch), and this walk runs in `validate_css`, before the
    /// nesting-depth gate (SEC-1).
    fn walk(&mut self, css: &str, base: usize) {
        let bytes = css.as_bytes();
        let unlayered = Frame {
            layer: u32::MAX,
            layer_node: LayerTree::ROOT,
        };
        let mut frames: Vec<Frame> = Vec::new();
        let mut i = 0;
        while i < bytes.len() {
            let c = bytes[i];
            if c == b'}' {
                frames.pop();
                i += 1;
                continue;
            }
            if c.is_ascii_whitespace() || c == b';' {
                i += 1;
                continue;
            }
            if css[i..].starts_with("<!--") {
                i += 4;
                continue;
            }
            if css[i..].starts_with("-->") {
                i += 3;
                continue;
            }
            let frame = frames.last().copied().unwrap_or(unlayered);
            // A statement (an at-rule or a stray prelude) ended by the `}` that closes the
            // enclosing block leaves that `}` to pop the block.
            let after_statement = |stop: usize| if bytes[stop] == b'}' { stop } else { stop + 1 };
            if c == b'@' {
                let name_end = ident_end(bytes, i + 1);
                let name = css[i + 1..name_end].to_ascii_lowercase();
                let Some((stop, is_block)) = find_prelude_end(bytes, name_end) else {
                    return;
                };
                let prelude = css[name_end..stop].trim();
                if !is_block {
                    if name == "layer" {
                        for layer_part in prelude.split(',') {
                            let part = layer_part.trim();
                            if !part.is_empty() {
                                let node = self.layers.node(frame.layer_node, part);
                                self.layers.rank(node);
                            }
                        }
                    }
                    i = after_statement(stop);
                    continue;
                }
                match name.as_str() {
                    "media" if media_matches(prelude) => {
                        frames.push(frame);
                        i = stop + 1;
                    }
                    "layer" => {
                        let node = if prelude.is_empty() {
                            self.layers.anonymous()
                        } else {
                            self.layers.node(frame.layer_node, prelude)
                        };
                        frames.push(Frame {
                            layer: self.layers.rank(node),
                            layer_node: node,
                        });
                        i = stop + 1;
                    }
                    _ => {
                        let end = find_block_end(bytes, stop).unwrap_or(bytes.len());
                        if name == "page" {
                            let block = &css[stop + 1..end.min(bytes.len())];
                            if let Some(rule) =
                                parse_page_rule(prelude, block, base + i, frame.layer)
                            {
                                self.rules.push(rule);
                            }
                        }
                        i = end + 1;
                    }
                }
                continue;
            }
            // A qualified (style) rule: skip its selector and block.
            let Some((stop, is_block)) = find_prelude_end(bytes, i) else {
                return;
            };
            if !is_block {
                i = after_statement(stop);
                continue;
            }
            i = find_block_end(bytes, stop).unwrap_or(bytes.len()) + 1;
        }
    }
}

/// `@media` query list evaluated for a paged (print) medium: a query matches when its media type
/// is `print` or `all` (or is omitted) and it has no media feature (features are not evaluated);
/// `not` negates a query without features. Shared with `break_css` (port step 07), so both
/// vellora CSS readers agree with each other; Blitz's own cascade evaluates media features too.
pub(crate) fn media_matches(prelude: &str) -> bool {
    prelude.split(',').any(|query| {
        let lower = query.trim().to_ascii_lowercase();
        if lower.contains('(') {
            return false;
        }
        let mut words: Vec<&str> = lower.split_whitespace().collect();
        let negate = words.first() == Some(&"not");
        if negate || words.first() == Some(&"only") {
            words.remove(0);
        }
        let matches = match words.as_slice() {
            [] => !negate,
            [ty] => matches!(*ty, "print" | "all"),
            _ => return false,
        };
        matches != negate
    })
}

/// Parse one `@page` rule; `None` when its selector list is invalid (the rule is dropped).
fn parse_page_rule(prelude: &str, block: &str, offset: usize, layer: u32) -> Option<PageRule> {
    let selectors = parse_page_selectors(prelude)?;
    let (declarations, nested) = split_block(block);
    let margin_boxes = nested
        .into_iter()
        .filter_map(|(name, body)| {
            let name = name.trim().to_ascii_lowercase();
            let name = name.strip_prefix('@')?.trim().to_string();
            Some((name, split_block(&body).0))
        })
        .collect();
    Some(PageRule {
        offset,
        selectors,
        layer,
        declarations,
        margin_boxes,
    })
}

/// `<page-selector-list>`: comma-separated `<ident>? <pseudo-page>*` (no white space inside a
/// selector), pseudo-pages `:first`, `:left`, `:right`, `:blank` (ASCII case-insensitive). An
/// empty prelude is the universal selector.
fn parse_page_selectors(prelude: &str) -> Option<Vec<PageSelector>> {
    if prelude.trim().is_empty() {
        return Some(vec![PageSelector::default()]);
    }
    prelude
        .split(',')
        .map(|selector| {
            let s = selector.trim();
            if s.is_empty() || s.contains(|c: char| c.is_whitespace()) {
                return None;
            }
            let mut parts = s.split(':');
            let name = parts.next().unwrap_or("");
            let mut out = PageSelector {
                named: !name.is_empty(),
                ..PageSelector::default()
            };
            if !name.is_empty() && !is_ident(name) {
                return None;
            }
            for pseudo in parts {
                match pseudo.to_ascii_lowercase().as_str() {
                    "first" => out.first += 1,
                    "blank" => out.blank += 1,
                    "left" => out.left += 1,
                    "right" => out.right += 1,
                    _ => return None,
                }
            }
            Some(out)
        })
        .collect()
}

fn is_ident(s: &str) -> bool {
    let mut chars = s.chars();
    match chars.next() {
        Some(c) if c.is_alphabetic() || c == '_' || c == '-' || !c.is_ascii() => {}
        _ => return false,
    }
    chars.all(|c| c.is_alphanumeric() || c == '_' || c == '-' || !c.is_ascii())
}

/// Split a declaration block into its declarations and its nested `@name { body }` at-rules
/// (margin boxes). Strings, escapes and parentheses are respected, so `content: "a;b}"` is one
/// declaration.
fn split_block(block: &str) -> (Vec<RawDeclaration>, Vec<(String, String)>) {
    let bytes = block.as_bytes();
    let mut declarations = Vec::new();
    let mut nested = Vec::new();
    let mut i = 0;
    let mut start = 0;
    let mut depth = 0i32;
    // Whether `block[start..i]` holds non-white-space text, i.e. `!block[start..i].trim()
    // .is_empty()`, kept as the walk goes: re-trimming that slice at every `@` cost O(n²) on
    // `x@@@…` (port step 09).
    let mut content = false;
    while i < bytes.len() {
        let at_rule_start = bytes[i] == b'@' && depth == 0 && !content;
        if !content && block.is_char_boundary(i) {
            content = block[i..]
                .chars()
                .next()
                .is_some_and(|c| !c.is_whitespace());
        }
        match bytes[i] {
            b'"' | b'\'' => {
                i = skip_string(bytes, i);
                continue;
            }
            b'\\' => {
                i += 2;
                continue;
            }
            b'(' => depth += 1,
            b')' => depth = (depth - 1).max(0),
            b'@' if at_rule_start => {
                // A nested at-rule: name up to `{` (or `;` for a statement), then its block.
                let Some((stop, is_block)) = find_prelude_end(bytes, i) else {
                    return (declarations, nested);
                };
                if is_block {
                    let end = find_block_end(bytes, stop).unwrap_or(bytes.len());
                    nested.push((
                        block[i..stop].to_string(),
                        block[stop + 1..end.min(bytes.len())].to_string(),
                    ));
                    i = end + 1;
                } else {
                    i = stop + 1;
                }
                start = i.min(bytes.len());
                content = false;
                continue;
            }
            b';' if depth == 0 => {
                push_declaration(&mut declarations, &block[start..i]);
                start = i + 1;
                content = false;
            }
            b'{' if depth == 0 => {
                // A stray block inside the declarations: skip it with the text before it.
                let end = find_block_end(bytes, i).unwrap_or(bytes.len());
                i = end + 1;
                start = i.min(bytes.len());
                content = false;
                continue;
            }
            _ => {}
        }
        i += 1;
    }
    if start < bytes.len() {
        push_declaration(&mut declarations, &block[start..]);
    }
    (declarations, nested)
}

fn push_declaration(out: &mut Vec<RawDeclaration>, text: &str) {
    let Some((property, value)) = text.split_once(':') else {
        return;
    };
    let property = property.trim().to_ascii_lowercase();
    if property.is_empty() || property.contains(|c: char| c.is_whitespace()) {
        return;
    }
    let mut value = value.trim().to_string();
    let mut important = false;
    if let Some(bang) = value.rfind('!') {
        if value[bang + 1..].trim().eq_ignore_ascii_case("important") {
            important = true;
            value = value[..bang].trim_end().to_string();
        }
    }
    if value.is_empty() {
        return;
    }
    out.push(RawDeclaration {
        property,
        value,
        important,
    });
}

/// Replace every `/* … */` comment with spaces (byte offsets preserved); strings are kept.
fn blank_comments(css: &str) -> String {
    let bytes = css.as_bytes();
    let mut out = String::with_capacity(css.len());
    let mut i = 0;
    let mut copied = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'"' | b'\'' => i = skip_string(bytes, i),
            b'\\' => i += 2,
            b'/' if bytes.get(i + 1) == Some(&b'*') => {
                out.push_str(&css[copied..i]);
                let end = css[i + 2..]
                    .find("*/")
                    .map_or(bytes.len(), |p| i + 2 + p + 2);
                // Spaces for ASCII bytes, and for every byte of a multibyte char, keep offsets.
                out.extend(std::iter::repeat_n(' ', end - i));
                i = end;
                copied = end;
            }
            _ => i += 1,
        }
    }
    if copied < bytes.len() {
        out.push_str(&css[copied.min(bytes.len())..]);
    }
    out
}

/// Index just past the string that opens at `bytes[start]` (a quote); an unterminated string
/// ends at a newline or the end of the text (CSS Syntax 3, "consume a string token").
fn skip_string(bytes: &[u8], start: usize) -> usize {
    let quote = bytes[start];
    let mut i = start + 1;
    while i < bytes.len() {
        match bytes[i] {
            b'\\' => i += 2,
            b'\n' => return i,
            c if c == quote => return i + 1,
            _ => i += 1,
        }
    }
    bytes.len()
}

fn ident_end(bytes: &[u8], mut i: usize) -> usize {
    while i < bytes.len()
        && (bytes[i].is_ascii_alphanumeric() || bytes[i] == b'-' || bytes[i] == b'_')
    {
        i += 1;
    }
    i
}

/// The `{` that opens the block of the rule whose prelude starts at `from`, or the `;` that ends
/// a statement at-rule: `(index, is_block)`. Strings and parentheses are skipped.
fn find_prelude_end(bytes: &[u8], from: usize) -> Option<(usize, bool)> {
    let mut i = from;
    let mut depth = 0i32;
    while i < bytes.len() {
        match bytes[i] {
            b'"' | b'\'' => {
                i = skip_string(bytes, i);
                continue;
            }
            b'\\' => {
                i += 2;
                continue;
            }
            b'(' => depth += 1,
            b')' => depth = (depth - 1).max(0),
            b'{' if depth == 0 => return Some((i, true)),
            b';' if depth == 0 => return Some((i, false)),
            b'}' if depth == 0 => return Some((i, false)),
            _ => {}
        }
        i += 1;
    }
    None
}

/// Index of the `}` closing the block whose `{` is at `open`; `None` when it never closes.
fn find_block_end(bytes: &[u8], open: usize) -> Option<usize> {
    let mut depth = 0i32;
    let mut i = open;
    while i < bytes.len() {
        match bytes[i] {
            b'"' | b'\'' => {
                i = skip_string(bytes, i);
                continue;
            }
            b'\\' => {
                i += 2;
                continue;
            }
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

// ---------------------------------------------------------------------------------------------
// Values.
// ---------------------------------------------------------------------------------------------

fn margin_box_name(name: &str) -> Option<MarginBox> {
    match name {
        "top-center" => Some(MarginBox::TopCenter),
        "bottom-center" => Some(MarginBox::BottomCenter),
        _ => None,
    }
}

fn apply_size(page: &mut PageBox, value: &str) {
    let v = value.trim().to_ascii_lowercase();
    let landscape = v.contains("landscape");
    let (mut w, mut h) = if v.contains("a4") {
        (A4_W, A4_H)
    } else if v.contains("letter") {
        (LETTER_W, LETTER_H)
    } else {
        // Explicit "WIDTH HEIGHT" lengths, e.g. "210mm 297mm". Parse ALL tokens
        // fallibly: if ANY token is non-finite/unknown-unit (e.g. an overflowing
        // `1e400px`), `length_px` returns None and the whole `size` declaration is
        // abandoned, keeping the documented default. `filter_map` would instead
        // DROP the bad token and shift survivors into the wrong slots — e.g.
        // `size: 1e400px 297mm` would collapse to `[297mm]` and the `[a] =>
        // (a, a)` arm would silently produce a 297mm SQUARE page. This also
        // closes the unknown-unit slot-shift for free.
        let nums: Option<Vec<f64>> = v.split_whitespace().map(length_px).collect();
        match nums.as_deref() {
            Some([a, b]) => (*a, *b),
            Some([a]) => (*a, *a),
            _ => (page.width, page.height),
        }
    };
    if landscape && w < h {
        std::mem::swap(&mut w, &mut h);
    }
    page.width = w;
    page.height = h;
}

fn apply_margin_shorthand(page: &mut PageBox, value: &str) {
    // All-or-nothing parse: a single non-finite/unknown-unit token abandons the
    // whole `margin` shorthand and keeps the prior margins, rather than dropping
    // the bad token and reindexing survivors into the wrong sides — e.g.
    // `margin: 1e400px 20px 30px 40px` must NOT silently become a 3-value
    // shorthand t=20 r=30 b=40 l=30.
    let vals: Option<Vec<f64>> = value.split_whitespace().map(length_px).collect();
    let (t, r, b, l) = match vals.as_deref() {
        Some([a]) => (*a, *a, *a, *a),
        Some([a, b]) => (*a, *b, *a, *b),
        Some([a, b, c]) => (*a, *b, *c, *b),
        Some([a, b, c, d]) => (*a, *b, *c, *d),
        _ => return,
    };
    page.margin_top = t;
    page.margin_right = r;
    page.margin_bottom = b;
    page.margin_left = l;
}

/// Convert a single CSS length token to CSS px. Supports mm, pt, in, px, cm.
fn length_px(token: &str) -> Option<f64> {
    let t = token.trim().to_ascii_lowercase();
    let (num_str, unit) = split_unit(&t)?;
    let n: f64 = num_str.parse().ok()?;
    // Reject `inf`/`infinity` and overflowing exponents (e.g. `1e400px`) that
    // f64::from_str saturates to infinity, so an attacker-controlled @page
    // length can never propagate an infinite page dimension into layout/krilla.
    // Returning None drops the token and keeps the existing dimension.
    if !n.is_finite() {
        return None;
    }
    Some(match unit.as_str() {
        "mm" => n * PX_PER_MM,
        "cm" => n * 10.0 * PX_PER_MM,
        "pt" => n * PX_PER_PT,
        "in" => n * PX_PER_IN,
        "px" | "" => n,
        _ => return None,
    })
}

fn split_unit(t: &str) -> Option<(String, String)> {
    let idx = t
        .find(|c: char| c.is_alphabetic() || c == '%')
        .unwrap_or(t.len());
    let num = &t[..idx];
    let unit = &t[idx..];
    if num.is_empty() {
        return None;
    }
    Some((num.to_string(), unit.to_string()))
}

/// Parse a `content` value like:  "Página " counter(page) " de " counter(pages)
/// `none` / `normal` (or a value with nothing drawable) give no parts: no margin box.
fn parse_content_template(value: &str) -> Vec<ContentPart> {
    let mut parts = Vec::new();
    let chars: Vec<char> = value.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c == '"' || c == '\'' {
            let (literal, next) = read_css_string(&chars, i);
            parts.push(ContentPart::Literal(literal));
            i = next;
        } else if chars[i..]
            .iter()
            .take(8)
            .collect::<String>()
            .eq_ignore_ascii_case("counter(")
        {
            // Consume up to ')'. Stay in CHAR units: `close` is the char count
            // to the closing paren (not a byte offset) so a multibyte char
            // inside the counter() arguments cannot desync `i`.
            let close = chars[i..]
                .iter()
                .position(|c| *c == ')')
                .unwrap_or(chars.len() - i);
            let inner: String = chars[(i + 8).min(i + close)..i + close]
                .iter()
                .collect::<String>()
                .trim()
                .to_ascii_lowercase();
            let counter = inner.split(',').next().unwrap_or("").trim();
            if counter == "pages" {
                parts.push(ContentPart::CounterPages);
            } else {
                parts.push(ContentPart::CounterPage);
            }
            i += close + 1;
        } else {
            i += 1;
        }
    }
    parts
}

/// The decoded CSS string opening at `chars[start]` (a quote) and the index just past it.
/// Escapes follow CSS Syntax 3: `\` + 1–6 hex digits (+ one optional white space) is that code
/// point, `\` + newline is a line continuation, `\` + any other char is that char.
fn read_css_string(chars: &[char], start: usize) -> (String, usize) {
    let quote = chars[start];
    let mut out = String::new();
    let mut i = start + 1;
    while i < chars.len() {
        let c = chars[i];
        if c == quote {
            return (out, i + 1);
        }
        if c == '\\' {
            i += 1;
            let Some(&next) = chars.get(i) else {
                break;
            };
            if next == '\n' {
                i += 1;
                continue;
            }
            if next.is_ascii_hexdigit() {
                let mut hex = String::new();
                while i < chars.len() && hex.len() < 6 && chars[i].is_ascii_hexdigit() {
                    hex.push(chars[i]);
                    i += 1;
                }
                if i < chars.len() && chars[i].is_whitespace() {
                    i += 1;
                }
                let cp = u32::from_str_radix(&hex, 16).unwrap_or(0xFFFD);
                out.push(match char::from_u32(cp) {
                    Some(ch) if cp != 0 => ch,
                    _ => '\u{FFFD}',
                });
                continue;
            }
            out.push(next);
            i += 1;
            continue;
        }
        out.push(c);
        i += 1;
    }
    (out, chars.len())
}

/// Resolve a margin-content template to a concrete string for a given page.
pub fn resolve_content(parts: &[ContentPart], page_num: usize, total: usize) -> String {
    let mut s = String::new();
    for part in parts {
        match part {
            ContentPart::Literal(l) => s.push_str(l),
            ContentPart::CounterPage => s.push_str(&page_num.to_string()),
            ContentPart::CounterPages => s.push_str(&total.to_string()),
        }
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    fn style(css: &str) -> String {
        format!(
            "<!DOCTYPE html><html><head><style>{css}</style></head><body><p>x</p></body></html>"
        )
    }

    #[test]
    fn split_block_keeps_declarations_utf8_clean() {
        // The sheet walk blanks comments before it splits blocks.
        let (declarations, nested) = split_block(&blank_comments(
            " /* café */ margin: 10px; @bottom-center { content: \"x\"; } ",
        ));
        assert_eq!(declarations.len(), 1, "{declarations:?}");
        assert_eq!(declarations[0].property, "margin");
        assert_eq!(nested.len(), 1, "the @bottom-center rule is split out");
        let blanked = blank_comments("/* café */ margin: 1px");
        assert_eq!(
            blanked.len(),
            "/* café */ margin: 1px".len(),
            "offsets preserved"
        );
        assert!(blanked.ends_with("margin: 1px"));
    }

    #[test]
    fn split_block_keeps_separators_inside_strings() {
        let (declarations, _) = split_block(r#"content: "a;b}" counter(page); color: red"#);
        assert_eq!(declarations.len(), 2, "{declarations:?}");
        assert_eq!(declarations[0].value, r#""a;b}" counter(page)"#);
    }

    #[test]
    fn unterminated_nested_at_rule_keeps_the_declarations_before_it() {
        let (declarations, nested) = split_block(" color: red; @top-center color ");
        assert_eq!(declarations.len(), 1);
        assert_eq!(declarations[0].value, "red");
        assert!(nested.is_empty(), "{nested:?}");
    }

    #[test]
    fn content_template_reads_adjacent_tokens_and_escapes() {
        // Before step 06 the parser skipped the character after every closing quote, which
        // dropped a `counter(` written right after a string.
        assert_eq!(
            parse_content_template(r#""P"counter(page)"/"counter(pages)"#),
            vec![
                ContentPart::Literal("P".into()),
                ContentPart::CounterPage,
                ContentPart::Literal("/".into()),
                ContentPart::CounterPages,
            ]
        );
        assert_eq!(
            parse_content_template(r#""P\E1 gina \"x\"""#),
            vec![ContentPart::Literal("Página \"x\"".into())]
        );
        assert!(parse_content_template("none").is_empty());
    }

    #[test]
    fn page_selectors_parse_like_css_page_3() {
        assert!(parse_page_selectors(":nth(1)").is_none());
        assert!(parse_page_selectors(":first :left").is_none());
        let s = parse_page_selectors("wide:first, :LEFT").expect("valid");
        assert_eq!(s[0].specificity(), (1, 1, 0));
        assert_eq!(s[1].specificity(), (0, 0, 1));
        assert!(
            !s[0].matches(PageSide {
                first: true,
                left: false
            }),
            "named never matches"
        );
    }

    #[test]
    fn later_universal_rules_override_property_by_property() {
        let pb = parse_page_box(&style(
            "@page { size: A4; margin: 10mm; } @page { margin-top: 30mm; @bottom-center { content: 'x'; } }",
        ));
        assert!((pb.margin_top - 30.0 * PX_PER_MM).abs() < 1e-9);
        assert!((pb.margin_left - 10.0 * PX_PER_MM).abs() < 1e-9);
        assert_eq!(pb.margins_content.len(), 1);
    }

    #[test]
    fn layers_and_important_order_the_cascade() {
        let pb = parse_page_box(&style(
            "@layer l2, l1; @layer l1 { @page { margin: 30mm } } @layer l2 { @page { margin: 0 } }",
        ));
        assert!(
            (pb.margin_top - 30.0 * PX_PER_MM).abs() < 1e-9,
            "{}",
            pb.margin_top
        );
        let pb = parse_page_box(&style(
            "@page { margin: 10mm } @layer l1 { @page { margin: 30mm } }",
        ));
        assert!(
            (pb.margin_top - 10.0 * PX_PER_MM).abs() < 1e-9,
            "unlayered wins"
        );
        let pb = parse_page_box(&style(
            "@page { margin: 10mm !important } @page :first { margin: 30mm }",
        ));
        assert!(
            (pb.margin_top - 10.0 * PX_PER_MM).abs() < 1e-9,
            "!important wins"
        );
    }

    #[test]
    fn media_print_applies_and_media_screen_does_not() {
        let pb = parse_page_box(&style(
            "@page { margin: 10mm } @media print { @page { margin-top: 30mm } } @media screen { @page { margin-top: 60mm } }",
        ));
        assert!(
            (pb.margin_top - 30.0 * PX_PER_MM).abs() < 1e-9,
            "{}",
            pb.margin_top
        );
    }

    #[test]
    fn varying_width_rule_points_at_the_rule_that_changes_the_width() {
        assert_eq!(
            varying_width_rule(&style("@page :first { margin-top: 40mm }")),
            None
        );
        assert_eq!(
            varying_width_rule(&style(
                "@page { margin: 10mm } @page :left { margin-left: 30mm; margin-right: 10mm } @page :right { margin-left: 10mm; margin-right: 30mm }"
            )),
            None,
            "mirrored margins keep the width"
        );
        let html = style("@page { margin: 0 } @page :first { margin: 1cm }");
        let at = varying_width_rule(&html).expect("rejected");
        assert!(html[at..].starts_with("@page :first"));
    }

    /// The sheet walk of port steps 06 to 08, verbatim but for names: it recursed into each
    /// matching `@media` and every `@layer` block, kept layers as dotted names in a list, and
    /// split `@page` blocks re-trimming the text before every `@`. Kept to prove that the
    /// single-pass walk reads every well-formed sheet exactly as it did.
    mod legacy {
        use super::super::{
            blank_comments, find_block_end, find_prelude_end, ident_end, media_matches,
            parse_page_selectors, push_declaration, skip_string, PageRule, RawDeclaration,
        };

        #[derive(Default)]
        struct SheetBuilder {
            rules: Vec<PageRule>,
            layers: Vec<String>,
            anonymous_layers: usize,
        }

        pub(super) fn parse(html: &str) -> Vec<PageRule> {
            let mut builder = SheetBuilder::default();
            for region in crate::css_scan::style_blocks(html) {
                let css = blank_comments(&region.text);
                builder.walk(&css, region.offset, u32::MAX, "");
            }
            builder.rules
        }

        impl SheetBuilder {
            fn layer_rank(&mut self, name: String) -> u32 {
                let index = match self.layers.iter().position(|l| *l == name) {
                    Some(i) => i,
                    None => {
                        self.layers.push(name);
                        self.layers.len() - 1
                    }
                };
                u32::try_from(index)
                    .unwrap_or(u32::MAX - 1)
                    .min(u32::MAX - 1)
            }

            fn walk(&mut self, css: &str, base: usize, layer: u32, layer_name: &str) {
                let bytes = css.as_bytes();
                let mut i = 0;
                while i < bytes.len() {
                    let c = bytes[i];
                    if c.is_ascii_whitespace() || c == b';' || c == b'}' {
                        i += 1;
                        continue;
                    }
                    if css[i..].starts_with("<!--") {
                        i += 4;
                        continue;
                    }
                    if css[i..].starts_with("-->") {
                        i += 3;
                        continue;
                    }
                    if c == b'@' {
                        let name_end = ident_end(bytes, i + 1);
                        let name = css[i + 1..name_end].to_ascii_lowercase();
                        let Some((stop, is_block)) = find_prelude_end(bytes, name_end) else {
                            return;
                        };
                        let prelude = css[name_end..stop].trim();
                        if !is_block {
                            if name == "layer" {
                                for layer_part in prelude.split(',') {
                                    let part = layer_part.trim();
                                    if !part.is_empty() {
                                        self.layer_rank(join_layer(layer_name, part));
                                    }
                                }
                            }
                            i = stop + 1;
                            continue;
                        }
                        let end = find_block_end(bytes, stop).unwrap_or(bytes.len());
                        let block = &css[stop + 1..end.min(bytes.len())];
                        match name.as_str() {
                            "page" => {
                                if let Some(rule) = parse_page_rule(prelude, block, base + i, layer)
                                {
                                    self.rules.push(rule);
                                }
                            }
                            "media" => {
                                if media_matches(prelude) {
                                    self.walk(block, base + stop + 1, layer, layer_name);
                                }
                            }
                            "layer" => {
                                let full = if prelude.is_empty() {
                                    self.anonymous_layers += 1;
                                    join_layer(
                                        layer_name,
                                        &format!("\u{0}anonymous{}", self.anonymous_layers),
                                    )
                                } else {
                                    join_layer(layer_name, prelude)
                                };
                                let rank = self.layer_rank(full.clone());
                                self.walk(block, base + stop + 1, rank, &full);
                            }
                            _ => {}
                        }
                        i = end + 1;
                        continue;
                    }
                    let Some((stop, is_block)) = find_prelude_end(bytes, i) else {
                        return;
                    };
                    if !is_block {
                        i = stop + 1;
                        continue;
                    }
                    i = find_block_end(bytes, stop).unwrap_or(bytes.len()) + 1;
                }
            }
        }

        fn join_layer(parent: &str, name: &str) -> String {
            if parent.is_empty() {
                name.to_string()
            } else {
                format!("{parent}.{name}")
            }
        }

        fn parse_page_rule(
            prelude: &str,
            block: &str,
            offset: usize,
            layer: u32,
        ) -> Option<PageRule> {
            let selectors = parse_page_selectors(prelude)?;
            let (declarations, nested) = split_block(block);
            let margin_boxes = nested
                .into_iter()
                .filter_map(|(name, body)| {
                    let name = name.trim().to_ascii_lowercase();
                    let name = name.strip_prefix('@')?.trim().to_string();
                    Some((name, split_block(&body).0))
                })
                .collect();
            Some(PageRule {
                offset,
                selectors,
                layer,
                declarations,
                margin_boxes,
            })
        }

        pub(super) fn split_block(block: &str) -> (Vec<RawDeclaration>, Vec<(String, String)>) {
            let bytes = block.as_bytes();
            let mut declarations = Vec::new();
            let mut nested = Vec::new();
            let mut i = 0;
            let mut start = 0;
            let mut depth = 0i32;
            while i < bytes.len() {
                match bytes[i] {
                    b'"' | b'\'' => {
                        i = skip_string(bytes, i);
                        continue;
                    }
                    b'\\' => {
                        i += 2;
                        continue;
                    }
                    b'(' => depth += 1,
                    b')' => depth = (depth - 1).max(0),
                    b'@' if depth == 0 && block[start..i].trim().is_empty() => {
                        let Some((stop, is_block)) = find_prelude_end(bytes, i) else {
                            return (declarations, nested);
                        };
                        if is_block {
                            let end = find_block_end(bytes, stop).unwrap_or(bytes.len());
                            nested.push((
                                block[i..stop].to_string(),
                                block[stop + 1..end.min(bytes.len())].to_string(),
                            ));
                            i = end + 1;
                        } else {
                            i = stop + 1;
                        }
                        start = i.min(bytes.len());
                        continue;
                    }
                    b';' if depth == 0 => {
                        push_declaration(&mut declarations, &block[start..i]);
                        start = i + 1;
                    }
                    b'{' if depth == 0 => {
                        let end = find_block_end(bytes, i).unwrap_or(bytes.len());
                        i = end + 1;
                        start = i.min(bytes.len());
                        continue;
                    }
                    _ => {}
                }
                i += 1;
            }
            if start < bytes.len() {
                push_declaration(&mut declarations, &block[start..]);
            }
            (declarations, nested)
        }
    }

    /// Deterministic generator of well-formed sheets (a fixed LCG, no randomness at run time).
    struct Sheets(u64);

    impl Sheets {
        fn next(&mut self) -> usize {
            self.0 = self
                .0
                .wrapping_mul(6_364_136_223_846_793_005)
                .wrapping_add(1_442_695_040_888_963_407);
            (self.0 >> 33) as usize
        }

        fn pick<'a>(&mut self, items: &[&'a str]) -> &'a str {
            items[self.next() % items.len()]
        }

        fn page_body(&mut self) -> String {
            let mut body = String::new();
            for _ in 0..self.next() % 4 {
                body.push_str(self.pick(&[
                    " margin: 10mm;",
                    " margin-top: 2cm !important;",
                    " size: A4 landscape;",
                    " size: 300px 200px;",
                    " font-size: 9pt;",
                    " color: red",
                    " margin-left : 1in ;",
                    "\u{a0}@top-center { content: \"T\" }",
                    " x@y: 1px;",
                    " content: \"a;b}\" counter(page);",
                    " @bottom-center { content: \"P\" counter(page) \" / \" counter(pages); font-size: 8px }",
                    " @bottom-right { content: \"R\" }",
                    " @top-center{content:'t';}",
                    " { stray } margin-bottom: 3mm;",
                ]));
            }
            body
        }

        fn sheet(&mut self, depth: usize) -> String {
            let mut css = String::new();
            for _ in 0..self.next() % 5 {
                let kind = self.next() % 12;
                let item = match kind {
                    0 | 1 => {
                        let selector = self.pick(&[
                            "",
                            ":first",
                            ":left",
                            ":right",
                            ":blank",
                            "wide",
                            ":first, :left",
                            ":nth(1)",
                            "wide:first",
                        ]);
                        format!("@page {selector} {{{} }}", self.page_body())
                    }
                    2 | 3 if depth < 5 => {
                        let query = self.pick(&[
                            "print",
                            "screen",
                            "all",
                            "not screen",
                            "print and (min-width: 1px)",
                            "only print, tv",
                            "",
                        ]);
                        format!("@media {query} {{ {} }}", self.sheet(depth + 1))
                    }
                    4 | 5 if depth < 5 => {
                        let name = self.pick(&["a", "b", "a.b", "c.d.e", "", "a . b", "b.a"]);
                        format!("@layer {name} {{ {} }}", self.sheet(depth + 1))
                    }
                    6 => format!("@layer {};", self.pick(&["a", "b, a", "a.b, c", "z.y.x"])),
                    7 if depth < 5 => {
                        format!("@supports (display: block) {{ {} }}", self.sheet(depth + 1))
                    }
                    8 => "p.x { color: red; content: \"}{;\" }".to_string(),
                    9 => "/* @page { margin: 1px } */ <!-- --> @import \"x.css\";".to_string(),
                    10 => "@font-face { font-family: x; src: url(\"a}.ttf\") }".to_string(),
                    _ => "div > p:is(.a, .b) { margin: 0 }".to_string(),
                };
                css.push_str(&item);
                css.push(' ');
            }
            css
        }
    }

    #[test]
    fn the_single_pass_walk_reads_well_formed_sheets_like_the_recursive_walk() {
        let mut sheets = Sheets(9);
        let mut compared = 0;
        let mut with_rules = 0;
        for _ in 0..3000 {
            let css = sheets.sheet(0);
            let second = sheets.sheet(0);
            let html = format!(
                "<!DOCTYPE html><html><head><style>{css}</style><style>{second}</style></head>\
                 <body><p>x</p></body></html>"
            );
            let old = legacy::parse(&html);
            let new = PageSheet::parse(&html).rules;
            assert_eq!(new, old, "{html}");
            compared += 1;
            with_rules += usize::from(!old.is_empty());
        }
        assert_eq!(compared, 3000);
        assert!(
            with_rules > 1000,
            "{with_rules} of the sheets have @page rules"
        );
        for block in [
            " x@@@@ margin: 1px; @top-center { content: 'a' } ",
            "  \u{a0}@bottom-center{content:\"b\"} margin: 2px",
            " (@x) @y { } margin: 3px; @z;",
            " a \\@ b; @top-center { } ",
        ] {
            assert_eq!(split_block(block), legacy::split_block(block), "{block:?}");
        }
    }

    /// Run `f` on a thread with a 256 KiB stack: a walk that recursed once per nesting level
    /// would overflow it at a few thousand levels.
    fn on_small_stack<T: Send + 'static>(f: impl FnOnce() -> T + Send + 'static) -> T {
        std::thread::Builder::new()
            .stack_size(256 * 1024)
            .spawn(f)
            .expect("spawn")
            .join()
            .expect("no panic")
    }

    #[test]
    fn deeply_nested_media_and_layer_blocks_do_not_recurse() {
        const DEPTH: usize = 200_000;
        let nest = |open: &str, close: &str| {
            style(&format!(
                "{}@page {{ margin: 7mm }}{} @page :first {{ margin-top: 9mm }}",
                open.repeat(DEPTH),
                close.repeat(DEPTH)
            ))
        };
        for (open, close) in [
            ("@media all { ", "}"),
            ("@layer a { ", "}"),
            ("@layer { ", "}"),
            ("@media print { @layer b { ", "} }"),
        ] {
            let html = nest(open, close);
            let started = std::time::Instant::now();
            let (pb, varying) =
                on_small_stack(move || (parse_page_box(&html), varying_width_rule(&html)));
            assert!(
                (pb.margin_left - 7.0 * PX_PER_MM).abs() < 1e-9,
                "{open}: the innermost @page applies ({})",
                pb.margin_left
            );
            assert!(
                (pb.margin_top - 9.0 * PX_PER_MM).abs() < 1e-9,
                "{open}: the unlayered rule after the nest applies ({})",
                pb.margin_top
            );
            assert_eq!(varying, None);
            // Generous: the recursive walk took 1.3 s for 10 000 levels (release build).
            assert!(
                started.elapsed() < std::time::Duration::from_secs(20),
                "{open}: {:?}",
                started.elapsed()
            );
        }
        // A `@layer` statement deep inside the nest orders the layers it names.
        let html = style(&format!(
            "{}@layer late, early; @layer early {{ @page {{ margin: 3mm }} }} \
             @layer late {{ @page {{ margin: 5mm }} }}{}",
            "@media print { ".repeat(DEPTH),
            "}".repeat(DEPTH)
        ));
        let pb = on_small_stack(move || parse_page_box(&html));
        assert!(
            (pb.margin_top - 3.0 * PX_PER_MM).abs() < 1e-9,
            "{}",
            pb.margin_top
        );
    }

    #[test]
    fn many_layers_and_margin_box_names_cost_linear_time() {
        // Before port step 09 each layer name was found by a linear search of the list, and
        // each margin box name by a linear search of the boxes cascaded so far: O(n²).
        let layers = |n: usize| {
            style(
                &(0..n)
                    .map(|i| format!("@layer l{i} {{ @page {{ margin: 1mm }} }}"))
                    .collect::<String>(),
            )
        };
        let boxes = |n: usize| {
            style(&format!(
                "@page :first {{ {} @bottom-center {{ content: 'x' }} }}",
                (0..n)
                    .map(|i| format!("@b{i} {{ content: 'x' }}"))
                    .collect::<String>()
            ))
        };
        for (what, make) in [
            ("layers", &layers as &dyn Fn(usize) -> String),
            ("boxes", &boxes),
        ] {
            let time = |n: usize| {
                let html = make(n);
                (0..3)
                    .map(|_| {
                        let started = std::time::Instant::now();
                        let pb = parse_page_box(&html);
                        assert!(pb.margin_top > 0.0);
                        let _ = varying_width_rule(&html);
                        started.elapsed()
                    })
                    .min()
                    .expect("three runs")
            };
            let small = time(5_000);
            let large = time(20_000);
            // Linear: ~4x for 4x the input; quadratic: ~16x.
            assert!(
                large < small * 9 + std::time::Duration::from_millis(50),
                "{what}: 5 000 -> {small:?}, 20 000 -> {large:?}"
            );
        }
    }
}
