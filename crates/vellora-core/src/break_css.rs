//! Focused reader for the CSS Fragmentation properties the paginator honours:
//! `break-inside: avoid`, `break-before: page` and `break-after: page`, plus their
//! legacy `page-break-inside` / `page-break-before` / `page-break-after` aliases.
//!
//! Stylo only implements these longhands for the Gecko engine (`engine =
//! "gecko"` in its `longhands.toml`), so the Servo-mode style system Blitz uses
//! drops them and they never reach the computed style. Like `page_css`, vellora
//! reads them itself: this module collects the selectors of top-level
//! `<style>` rules that declare them, `blitz_engine` resolves those selectors
//! against the parsed document with Stylo's own selector matching, and the
//! paginator reads the resulting per-box flags. Inline `style="…"` declarations
//! are read per element by [`declares`].
//!
//! The rules inside `@media` blocks are read too, with the chain of `@media`
//! blocks each one sits in ([`BreakRules::media`]); `blitz_engine` evaluates
//! those query lists with Stylo against the device that styled the document
//! (`media_query_matches`, port step 09), so a break rule applies exactly when
//! the style rules next to it do. Port step 07 evaluated them here with
//! `page_css`'s media-type-only reader, which treats any query with a media
//! feature as not matching: inside one `@media print and (min-width: 1px)` block
//! the styles applied and `break-before: page` did not (Chrome 155 breaks).
//! Rules nested in other at-rules (`@supports`, `@layer`, `@page`, …) are
//! skipped; `@page` is read by `page_css`.

/// Selectors whose matched elements carry a fragmentation hint.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct BreakRules {
    /// Selector lists declaring `break-inside: avoid` (or `avoid-page`).
    pub avoid_inside: Vec<BreakRule>,
    /// Selector lists declaring a forced break before the element.
    pub page_before: Vec<BreakRule>,
    /// Selector lists declaring `text-wrap-style: balance` (or `text-wrap: balance`), and those
    /// declaring any other `text-wrap-style` (or a `text-wrap` without `balance`). Stylo parses
    /// `text-wrap-style` and the `text-wrap` shorthand for Gecko only (`engine = "gecko"`), so
    /// `blitz_engine::balance_text_wrap` reads them from here (Phase C step 04).
    pub wrap_balance: Vec<BreakRule>,
    pub wrap_unbalance: Vec<BreakRule>,
    /// Selector lists declaring a forced break after the element (Phase C step 04).
    pub page_after: Vec<BreakRule>,
    /// Selector lists declaring the `page` property (CSS Page 3 §4.1, named pages), in source
    /// order, with the declared name (`None` for `auto`). Phase C step 04.
    pub page_names: Vec<(BreakRule, Option<String>)>,
    /// Selector lists declaring `writing-mode`, in source order, with whether it is vertical.
    /// Stylo computes `writing-mode` only behind the `layout.writing-mode.enabled` pref
    /// (stylo 0.22.0 `properties/longhands.toml` `[writing-mode] servo_pref`), off in Blitz, so
    /// the computed style always says `horizontal-tb`; named-page breaks need the declared value
    /// to find orthogonal flows ([`resolve_named_page_breaks`]). Phase C step 04.
    pub writing_modes: Vec<(BreakRule, bool)>,
    /// Every `@media` block a rule was read in, in the order they open (an
    /// enclosing block comes before the blocks inside it).
    pub media: Vec<MediaBlock>,
}

/// One rule's selector list and the innermost `@media` block it sits in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BreakRule {
    pub selector: String,
    /// Index into [`BreakRules::media`]; `None` for a top-level rule.
    pub media: Option<usize>,
}

/// An `@media` block: its media query list and the block it sits in.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MediaBlock {
    pub query: String,
    pub parent: Option<usize>,
}

impl BreakRules {
    /// The selector lists (`avoid_inside`, `page_before`, `page_after`) of the rules whose
    /// every enclosing `@media` block matches, `matches` evaluating one media
    /// query list. Each distinct query text is evaluated once, and a block
    /// inside a block that does not match is not evaluated (linear in the
    /// number of blocks, whatever their nesting).
    pub fn applicable(
        &self,
        matches: impl FnMut(&str) -> bool,
    ) -> (Vec<&str>, Vec<&str>, Vec<&str>) {
        self.selected(&self.media_applies(matches))
    }

    /// The `(wrap_balance, wrap_unbalance)` selector lists whose `@media` blocks all match, like
    /// [`BreakRules::applicable`].
    pub fn applicable_wrap(&self, matches: impl FnMut(&str) -> bool) -> (Vec<&str>, Vec<&str>) {
        let applies = self.media_applies(matches);
        (
            select_rules(&self.wrap_balance, &applies),
            select_rules(&self.wrap_unbalance, &applies),
        )
    }

    /// Whether each `@media` block of [`BreakRules::media`] applies (see [`BreakRules::applicable`]).
    pub fn media_applies(&self, mut matches: impl FnMut(&str) -> bool) -> Vec<bool> {
        let mut by_query: std::collections::HashMap<&str, bool> = std::collections::HashMap::new();
        let mut applies: Vec<bool> = Vec::with_capacity(self.media.len());
        for block in &self.media {
            // A block's parent opened before it, so it is already decided.
            let inside = block.parent.is_none_or(|parent| applies[parent]);
            let applied = inside
                && *by_query
                    .entry(block.query.as_str())
                    .or_insert_with(|| matches(&block.query));
            applies.push(applied);
        }
        applies
    }

    /// The selector lists (`avoid_inside`, `page_before`, `page_after`) of the rules whose
    /// `@media` blocks apply (`applies` from [`BreakRules::media_applies`]).
    pub fn selected<'a>(&'a self, applies: &[bool]) -> (Vec<&'a str>, Vec<&'a str>, Vec<&'a str>) {
        let select = |rules: &'a [BreakRule]| -> Vec<&'a str> {
            rules
                .iter()
                .filter(|rule| rule.media.is_none_or(|block| applies[block]))
                .map(|rule| rule.selector.as_str())
                .collect()
        };
        (
            select(&self.avoid_inside),
            select(&self.page_before),
            select(&self.page_after),
        )
    }

    /// The `writing-mode` declarations whose `@media` blocks apply, in source order:
    /// `(selector, vertical)`.
    pub fn writing_modes<'a>(&'a self, applies: &[bool]) -> Vec<(&'a str, bool)> {
        self.writing_modes
            .iter()
            .filter(|(rule, _)| rule.media.is_none_or(|block| applies[block]))
            .map(|(rule, vertical)| (rule.selector.as_str(), *vertical))
            .collect()
    }

    /// The `page` declarations whose `@media` blocks apply, in source order: `(selector, name)`,
    /// `None` for `page: auto`.
    pub fn page_names<'a>(&'a self, applies: &[bool]) -> Vec<(&'a str, Option<&'a str>)> {
        self.page_names
            .iter()
            .filter(|(rule, _)| rule.media.is_none_or(|block| applies[block]))
            .map(|(rule, name)| (rule.selector.as_str(), name.as_deref()))
            .collect()
    }
}

/// The `page` property declared in one declaration block: `Some(Some(name))` for a page name,
/// `Some(None)` for `auto`, `None` when the block does not declare it (or declares an invalid
/// value). The last declaration wins. CSS Page 3 §4.1: `page: auto | <custom-ident>`.
pub fn declared_page(block: &str) -> Option<Option<String>> {
    let mut out = None;
    for decl in block.split(';') {
        let Some((prop, value)) = decl.split_once(':') else {
            continue;
        };
        if !prop.trim().eq_ignore_ascii_case("page") {
            continue;
        }
        let value = value.split('!').next().unwrap_or_default().trim();
        if value.eq_ignore_ascii_case("auto") {
            out = Some(None);
        } else if is_custom_ident(value) {
            out = Some(Some(value.to_string()));
        }
    }
    out
}

/// The `writing-mode` declared in one declaration block: `Some(true)` for a vertical mode
/// (`vertical-rl`, `vertical-lr`, `sideways-rl`, `sideways-lr`, the legacy `tb`, `tb-rl`),
/// `Some(false)` for a horizontal one (`horizontal-tb`, legacy `lr`, `lr-tb`, `rl`, `rl-tb`),
/// `None` when not declared. The last declaration wins.
pub fn declared_writing_mode(block: &str) -> Option<bool> {
    let mut out = None;
    for decl in block.split(';') {
        let Some((prop, value)) = decl.split_once(':') else {
            continue;
        };
        if !prop.trim().eq_ignore_ascii_case("writing-mode") {
            continue;
        }
        let value = value
            .split('!')
            .next()
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase();
        match value.as_str() {
            "vertical-rl" | "vertical-lr" | "sideways-rl" | "sideways-lr" | "tb" | "tb-rl" => {
                out = Some(true)
            }
            "horizontal-tb" | "lr" | "lr-tb" | "rl" | "rl-tb" => out = Some(false),
            _ => {}
        }
    }
    out
}

/// A plain CSS identifier (no escapes) that may name a page: not a CSS-wide keyword.
fn is_custom_ident(value: &str) -> bool {
    let mut chars = value.chars();
    let first_ok = match chars.next() {
        Some('-') => true,
        Some(c) => c.is_ascii_alphabetic() || c == '_' || !c.is_ascii(),
        None => false,
    };
    first_ok
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || !c.is_ascii())
        && ![
            "initial",
            "inherit",
            "unset",
            "revert",
            "revert-layer",
            "default",
        ]
        .iter()
        .any(|kw| value.eq_ignore_ascii_case(kw))
}

/// The selectors of `rules` whose `@media` block applies.
fn select_rules<'a>(rules: &'a [BreakRule], applies: &[bool]) -> Vec<&'a str> {
    rules
        .iter()
        .filter(|rule| rule.media.is_none_or(|block| applies[block]))
        .map(|rule| rule.selector.as_str())
        .collect()
}

/// Which fragmentation hints one declaration block carries.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BreakHints {
    pub avoid_inside: bool,
    pub page_before: bool,
    /// `Some(true)`: `text-wrap-style: balance` (or `text-wrap` with `balance`); `Some(false)`:
    /// another `text-wrap-style`, or a `text-wrap` without `balance` (the shorthand resets the
    /// style to `auto`); `None`: neither property.
    pub wrap_balance: Option<bool>,
    pub page_after: bool,
}

/// Turn every forced break AFTER a box into a forced break BEFORE the box that follows it, the
/// form the paginator reads (`LaidOutBox::break_before_page`). CSS Fragmentation 3 §3.1: a
/// `break-after` value applies to the break between the box and its next sibling, and §4.1 (class
/// A break points): a forced break on the last child propagates to its parent's break after, so
/// the break lands before the parent's next sibling. A forced break after the last box of the
/// document makes no page (Chrome 155 prints no trailing blank page for
/// `<p style="page-break-after: always">` as the body's last child).
///
/// A sibling laid out beside the box (the other items of a row flex line, the next cells of a
/// grid row) cannot start a page of its own: the break goes after the whole row, before the
/// first sibling that starts below the box, or to the parent when no sibling does. Chrome 155
/// propagates `break-after: page` on a row flex item to its flex line (WPT css/css-break/flexbox/
/// multi-line-row-flex-fragmentation-082c-print.html; css-flexbox-1 §12 "Flex Layout
/// Fragmentation").
///
/// `boxes` is the walk's depth-ordered pre-order list (a box's descendants follow it with a
/// greater `depth`). The list is read back to front, so a child's propagated break reaches its
/// parent before the parent is visited. Each box is visited once, its parent comes from one
/// forward pass and its next in-flow sibling is remembered per depth.
pub fn resolve_break_after(boxes: &mut [crate::blitz_engine::LaidOutBox]) {
    if !boxes.iter().any(|b| b.break_after_page) {
        return;
    }
    let mut stack: Vec<usize> = Vec::new();
    let parent: Vec<Option<usize>> = (0..boxes.len())
        .map(|i| {
            while stack
                .last()
                .is_some_and(|&j| boxes[j].depth >= boxes[i].depth)
            {
                stack.pop();
            }
            let parent = stack.last().copied();
            stack.push(i);
            parent
        })
        .collect();
    // next_at[d]: index of the box at depth d that follows the box being visited, at the same
    // depth and within the same parent (reset when the walk climbs above depth d).
    let mut next_at: Vec<Option<usize>> = Vec::new();
    // next_sibling[i]: the next in-flow sibling of box i (filled when i is visited).
    let mut next_sibling: Vec<Option<usize>> = vec![None; boxes.len()];
    // `b` sits beside `a` on the inline axis (no horizontal overlap) and starts above a's bottom.
    let beside = |a: &crate::blitz_engine::LaidOutBox, b: &crate::blitz_engine::LaidOutBox| {
        const EPS: f64 = 0.5;
        b.y < a.y + a.height - EPS && (b.x >= a.x + a.width - EPS || b.x + b.width <= a.x + EPS)
    };
    for i in (0..boxes.len()).rev() {
        let depth = boxes[i].depth;
        if next_at.len() <= depth {
            next_at.resize(depth + 1, None);
        }
        // Boxes deeper than this one belong to its subtree (or to an earlier sibling's, already
        // left): they are no siblings of anything visited from here on.
        next_at.truncate(depth + 1);
        let next = next_at[depth];
        // CSS Fragmentation 3 §3.1: the break properties apply to block-level boxes in the
        // normal flow. An inline-level (atomic inline) or absolutely positioned box neither
        // forces a break nor takes one: Chrome 155 prints `One <span style="display:
        // inline-block; break-after: page">IB</span> Two` on one page, and keeps an absolutely
        // positioned sibling after a `break-after: page` box on the box's page (probes
        // `fidelity/gate/snapshots/2026-10-28/c04-frag/probes/break-after.py`, 2026-10-28).
        let in_flow = !boxes[i].out_of_flow && !boxes[i].atomic_inline;
        if !in_flow {
            boxes[i].break_after_page = false;
            continue;
        }
        next_sibling[i] = next;
        if boxes[i].break_after_page {
            let mut target = next;
            while let Some(j) = target.filter(|&j| beside(&boxes[i], &boxes[j])) {
                target = next_sibling[j];
            }
            match target {
                Some(j) => boxes[j].break_before_page = true,
                None => {
                    // Last child: propagate to the parent (the nearest earlier box one level up).
                    if let Some(parent) = parent[i] {
                        boxes[parent].break_after_page = true;
                    }
                }
            }
        }
        next_at[depth] = Some(i);
    }
}

/// Named pages (CSS Page 3 §4.1, "Using named pages"; Phase C step 04): a forced page break
/// goes between two adjacent in-flow siblings when the END page value of the first differs
/// from the START page value of the second, set as `break_before_page` on the second. A box's
/// used page value is its own `page` name or, for `auto`, its parent's (the root's is the empty
/// name); its start (end) page value is the start (end) value of its first (last) in-flow child,
/// or its used value when it has none. Only block-level boxes in the normal flow take part:
/// floated, absolutely positioned and atomic inline boxes and orthogonal flows, and everything
/// inside them, neither
/// carry nor separate a page name, and a sibling laid out beside the box (a flex row) is no
/// break point (as in [`resolve_break_after`]). Only the breaks are implemented: a named
/// `@page` rule still does not apply to its pages (`page_css`).
///
/// Measured against Chrome for Testing 155.0.8059.85 with the WPT css/css-page/page-name-*
/// tests (their page counts are in the run's `chrome.comparisons`): e.g. `<div page:a>`,
/// `<div page:b><div page:c><div abspos>b</div><div page:x>c</div></div></div>` prints 2 pages
/// (page-name-propagated-004), `<div page:a>a</div><div page:c><div display:none></div></div>
/// <div page:b>` 3 (page-name-display-none-child: the middle page is empty).
pub fn resolve_named_page_breaks(boxes: &mut [crate::blitz_engine::LaidOutBox]) {
    if !boxes.iter().any(|b| b.page_name.is_some()) {
        return;
    }
    let n = boxes.len();
    let mut stack: Vec<usize> = Vec::new();
    let parent: Vec<Option<usize>> = (0..n)
        .map(|i| {
            while stack
                .last()
                .is_some_and(|&j| boxes[j].depth >= boxes[i].depth)
            {
                stack.pop();
            }
            let parent = stack.last().copied();
            stack.push(i);
            parent
        })
        .collect();
    // Forward: whether the box takes part, and its used page value (an index into `boxes`
    // whose `page_name` it uses, `None` for the root's empty name).
    let mut takes_part = vec![false; n];
    let mut used: Vec<Option<usize>> = vec![None; n];
    // `writing-mode` is inherited: the declared value, else the parent's (horizontal at the root).
    let mut vertical = vec![false; n];
    for i in 0..n {
        let b = &boxes[i];
        vertical[i] = b
            .writing_mode_vertical
            .unwrap_or_else(|| parent[i].is_some_and(|p| vertical[p]));
        let inside = parent[i].is_none_or(|p| takes_part[p]);
        // An orthogonal flow (a writing mode perpendicular to the parent's) is monolithic: Chrome
        // 155 prints `<div style="writing-mode: horizontal-tb">` holding `page: a` / `page: b`
        // children inside a vertical-rl root on one page (WPT css/css-page/
        // page-name-orthogonal-writing-001/003-print).
        let orthogonal = parent[i].is_some_and(|p| vertical[p] != vertical[i]);
        takes_part[i] = inside && !b.out_of_flow && !b.floated && !b.atomic_inline && !orthogonal;
        used[i] = if b.page_name.is_some() {
            Some(i)
        } else {
            parent[i].and_then(|p| used[p])
        };
    }
    let name = |boxes: &[crate::blitz_engine::LaidOutBox], at: Option<usize>| {
        at.and_then(|i| boxes[i].page_name.clone())
    };
    // Back to front: first/last in-flow child, so start/end values are final before the parent.
    let mut first_child: Vec<Option<usize>> = vec![None; n];
    let mut last_child: Vec<Option<usize>> = vec![None; n];
    let mut next_sibling: Vec<Option<usize>> = vec![None; n];
    let mut start: Vec<Option<String>> = vec![None; n];
    let mut end: Vec<Option<String>> = vec![None; n];
    for i in (0..n).rev() {
        if !takes_part[i] {
            continue;
        }
        start[i] = first_child[i].map_or_else(|| name(boxes, used[i]), |c| start[c].clone());
        end[i] = last_child[i].map_or_else(|| name(boxes, used[i]), |c| end[c].clone());
        if let Some(p) = parent[i] {
            next_sibling[i] = first_child[p];
            if last_child[p].is_none() {
                last_child[p] = Some(i);
            }
            first_child[p] = Some(i);
        }
    }
    let beside = |a: &crate::blitz_engine::LaidOutBox, b: &crate::blitz_engine::LaidOutBox| {
        const EPS: f64 = 0.5;
        b.y < a.y + a.height - EPS && (b.x >= a.x + a.width - EPS || b.x + b.width <= a.x + EPS)
    };
    for i in 0..n {
        if let Some(j) = next_sibling[i] {
            if end[i] != start[j] && !beside(&boxes[i], &boxes[j]) {
                boxes[j].break_before_page = true;
            }
        }
    }
}

/// Collect the break rules declared in the document's `<style>` elements.
pub fn parse_break_rules(html: &str) -> BreakRules {
    let mut rules = BreakRules::default();
    for region in crate::css_scan::style_blocks(html) {
        let css = strip_comments(&region.text);
        for (selector, body, media) in top_level_rules(&css, &mut rules.media) {
            let hints = declares(&body);
            if hints.avoid_inside {
                rules.avoid_inside.push(BreakRule {
                    selector: selector.clone(),
                    media,
                });
            }
            if hints.page_before {
                rules.page_before.push(BreakRule {
                    selector: selector.clone(),
                    media,
                });
            }
            match hints.wrap_balance {
                Some(true) => rules.wrap_balance.push(BreakRule {
                    selector: selector.clone(),
                    media,
                }),
                Some(false) => rules.wrap_unbalance.push(BreakRule {
                    selector: selector.clone(),
                    media,
                }),
                None => {}
            }
            if hints.page_after {
                rules.page_after.push(BreakRule {
                    selector: selector.clone(),
                    media,
                });
            }
            if let Some(vertical) = declared_writing_mode(&body) {
                rules.writing_modes.push((
                    BreakRule {
                        selector: selector.clone(),
                        media,
                    },
                    vertical,
                ));
            }
            if let Some(name) = declared_page(&body) {
                rules.page_names.push((BreakRule { selector, media }, name));
            }
        }
    }
    rules
}

/// Read the fragmentation hints out of one declaration block (a rule body or an
/// inline `style` attribute value). The last declaration of a property wins, as
/// in the cascade within a single block.
pub fn declares(block: &str) -> BreakHints {
    let mut hints = BreakHints::default();
    let mut line_clamp = false;
    for decl in block.split(';') {
        let Some((prop, value)) = decl.split_once(':') else {
            continue;
        };
        let prop = prop.trim().to_ascii_lowercase();
        let value = value.to_ascii_lowercase();
        let value = value.split('!').next().unwrap_or_default().trim();
        match prop.as_str() {
            "break-inside" | "page-break-inside" => {
                hints.avoid_inside = matches!(value, "avoid" | "avoid-page");
            }
            "break-before" => {
                hints.page_before = matches!(
                    value,
                    "page" | "always" | "left" | "right" | "recto" | "verso"
                );
            }
            "page-break-before" => {
                hints.page_before = matches!(value, "always" | "left" | "right");
            }
            // Blitz does not clamp (`line-clamp` is Gecko-only in Stylo 0.22.0), so a clamped
            // block is not balanced either (`blitz_engine::balance_text_wrap`; WPT
            // `text-wrap-balance-line-clamp-001.html`).
            "line-clamp" | "-webkit-line-clamp" => {
                line_clamp = !matches!(value, "none" | "initial" | "unset" | "revert");
            }
            "text-wrap" | "text-wrap-style" => {
                // `inherit`/`unset` (an inherited property)/`revert*` defer to the parent.
                hints.wrap_balance =
                    if matches!(value, "inherit" | "unset" | "revert" | "revert-layer") {
                        None
                    } else {
                        Some(value.split_ascii_whitespace().any(|v| v == "balance"))
                    };
            }
            // The same values as `break-before` (CSS Fragmentation 3 §3.1; the legacy alias maps
            // `always` to `page`, §3.4). Chrome 155 starts the next sibling on a new page for
            // `page-break-after: always` (WPT css/CSS2/pagination reference files).
            "break-after" => {
                hints.page_after = matches!(
                    value,
                    "page" | "always" | "left" | "right" | "recto" | "verso"
                );
            }
            "page-break-after" => {
                hints.page_after = matches!(value, "always" | "left" | "right");
            }
            _ => {}
        }
    }
    if line_clamp {
        hints.wrap_balance = Some(false);
    }
    hints
}

/// Split a stylesheet into its qualified rules `(selector, body, @media block)`
/// in source order: the top-level ones and those of every `@media` block, each
/// with the innermost block it sits in (appended to `media`; the query lists
/// are evaluated later, see [`BreakRules::applicable`]). Every other at-rule is
/// skipped together with its block. An `@media` block is entered in place (a
/// stack of open blocks, no recursion), so its nesting depth never touches the
/// native stack.
fn top_level_rules(css: &str, media: &mut Vec<MediaBlock>) -> Vec<(String, String, Option<usize>)> {
    let bytes = css.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    let mut prelude_start = 0;
    // `@media` blocks entered and not closed yet (indexes into `media`).
    let mut open_media: Vec<usize> = Vec::new();
    while i < bytes.len() {
        match bytes[i] {
            b'{' => {
                let prelude = css[prelude_start..i].trim();
                if let Some(at_rule) = prelude.strip_prefix('@') {
                    let name_len = at_rule
                        .find(|c: char| !(c.is_ascii_alphanumeric() || c == '-'))
                        .unwrap_or(at_rule.len());
                    let (name, query) = at_rule.split_at(name_len);
                    if name.eq_ignore_ascii_case("media") {
                        media.push(MediaBlock {
                            query: query.trim().to_string(),
                            parent: open_media.last().copied(),
                        });
                        open_media.push(media.len() - 1);
                        i += 1;
                        prelude_start = i;
                        continue;
                    }
                }
                let (end, closed) = block_end(bytes, i + 1);
                if !prelude.is_empty() && !prelude.starts_with('@') {
                    // The body runs to the `}` that closes it, or to the end of the sheet when the
                    // rule is never closed: CSS Syntax 3 closes every open block at EOF and keeps
                    // its declarations (Chrome 155 breaks before `p.b { break-before: page` with
                    // no `}`). Before port step 10 the body always stopped one byte short of
                    // `end`, which dropped the last byte of an unclosed rule (`page` read as
                    // `pag`) and panicked when that byte was inside a multibyte character
                    // (`p{é`: "end byte index N is not a char boundary").
                    let body_end = if closed { end - 1 } else { end };
                    out.push((
                        prelude.to_string(),
                        css[i + 1..body_end].to_string(),
                        open_media.last().copied(),
                    ));
                }
                i = end;
                prelude_start = end;
            }
            b'}' if !open_media.is_empty() => {
                open_media.pop();
                i += 1;
                prelude_start = i;
            }
            b';' if {
                // Drop the prelude's leading white space for good (every reader of the
                // prelude trims it): re-trimming it at every `;` cost O(n²) on
                // `<white space>a;;;…` (port step 09).
                let rest = &css[prelude_start..i];
                prelude_start = i - rest.trim_start().len();
                bytes[prelude_start] == b'@'
            } =>
            {
                i += 1;
                prelude_start = i;
            }
            b'"' | b'\'' => i = string_end(bytes, i),
            _ => i += 1,
        }
    }
    out
}

/// Index just past the `}` closing the block whose body starts at `start` and `true`, or the end
/// of input and `false` when the block is never closed. Either index is a char boundary of the
/// text `bytes` comes from (`}` is ASCII).
fn block_end(bytes: &[u8], start: usize) -> (usize, bool) {
    let mut depth = 1i32;
    let mut i = start;
    while i < bytes.len() {
        match bytes[i] {
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return (i + 1, true);
                }
            }
            b'"' | b'\'' => {
                i = string_end(bytes, i);
                continue;
            }
            _ => {}
        }
        i += 1;
    }
    (bytes.len(), false)
}

/// Index just past a quoted string starting at `start`, honouring `\` escapes.
fn string_end(bytes: &[u8], start: usize) -> usize {
    let quote = bytes[start];
    let mut i = start + 1;
    while i < bytes.len() {
        match bytes[i] {
            b'\\' => i += 2,
            b if b == quote => return i + 1,
            b'\n' => return i,
            _ => i += 1,
        }
    }
    bytes.len()
}

/// Remove `/* … */` comments outside strings (an unterminated comment runs to
/// the end), so `content: "/*"` does not swallow the rules after it.
fn strip_comments(css: &str) -> String {
    let bytes = css.as_bytes();
    let mut out = String::with_capacity(css.len());
    let mut i = 0;
    let mut kept = 0;
    while i < bytes.len() {
        match bytes[i] {
            b'"' | b'\'' => i = string_end(bytes, i),
            b'/' if bytes.get(i + 1) == Some(&b'*') => {
                out.push_str(&css[kept..i]);
                i = match css[i + 2..].find("*/") {
                    Some(end) => i + 2 + end + 2,
                    None => bytes.len(),
                };
                kept = i;
            }
            _ => i += 1,
        }
    }
    out.push_str(&css[kept.min(css.len())..]);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn page(css: &str) -> String {
        format!("<html><head><style>{css}</style></head><body></body></html>")
    }

    /// The selectors that apply when `@media` queries are evaluated for print by media type
    /// only (`page_css::media_matches`, the evaluator of port step 07): the parse-level tests
    /// below use it; the render path evaluates with Stylo (`blitz_engine`).
    fn by_type(rules: &BreakRules) -> (Vec<&str>, Vec<&str>) {
        let (avoid, before, _) = rules.applicable(crate::page_css::media_matches);
        (avoid, before)
    }

    #[test]
    fn collects_avoid_and_before_selectors() {
        let rules = parse_break_rules(&page(
            "tbody.meal { break-inside: avoid; } h2, .start { break-before: page }",
        ));
        assert_eq!(by_type(&rules), (vec!["tbody.meal"], vec!["h2, .start"]));
        assert!(rules.media.is_empty());
    }

    #[test]
    fn reads_legacy_aliases_and_important() {
        let rules = parse_break_rules(&page(
            ".a { page-break-inside: avoid !important } .b { page-break-before: always }",
        ));
        assert_eq!(by_type(&rules), (vec![".a"], vec![".b"]));
    }

    #[test]
    fn ignores_auto_values_and_later_overrides() {
        let rules = parse_break_rules(&page(
            ".a { break-inside: auto } .b { break-inside: avoid; break-inside: auto } .c { break-before: avoid }",
        ));
        assert!(rules.avoid_inside.is_empty());
        assert!(rules.page_before.is_empty());
    }

    #[test]
    fn skips_rules_inside_at_rules_and_comments() {
        let rules = parse_break_rules(&page(
            "@page { margin: 10mm; @bottom-center { content: \"{x}\"; } } \
             @media screen { .m { break-inside: avoid } } \
             @import \"x.css\"; \
             /* .c { break-inside: avoid } */ \
             .d { content: \"}\"; break-inside: avoid }",
        ));
        assert_eq!(by_type(&rules).0, vec![".d"]);
    }

    #[test]
    fn reads_media_blocks_in_source_order_with_their_chains() {
        let rules = parse_break_rules(&page(
            ".a { break-before: page } \
             @media print { .p { break-before: page } .pi { break-inside: avoid } } \
             @media screen { .s { break-before: page } } \
             @MEDIA ALL { .all { break-before: page } } \
             @media only print, tv { .only { break-before: page } } \
             @media not screen { .ns { break-before: page } } \
             @media not print { .np { break-before: page } } \
             @media print and (min-width: 1px) { .feature { break-before: page } } \
             @media print { @media all { .nested { break-before: page } } \
             @supports (display: grid) { .sup { break-before: page } } .after-sup { break-before: page } } \
             @media print{.tight{page-break-before:always}} \
             .z { break-before: page }",
        ));
        // By media type only, as at port step 07: the feature query does not match.
        assert_eq!(
            by_type(&rules),
            (
                vec![".pi"],
                vec![
                    ".a",
                    ".p",
                    ".all",
                    ".only",
                    ".ns",
                    ".nested",
                    ".after-sup",
                    ".tight",
                    ".z"
                ]
            )
        );
        // Every rule keeps its block chain; the queries reach the evaluator verbatim.
        let all = rules.applicable(|_| true).1;
        assert_eq!(
            all,
            vec![
                ".a",
                ".p",
                ".s",
                ".all",
                ".only",
                ".ns",
                ".np",
                ".feature",
                ".nested",
                ".after-sup",
                ".tight",
                ".z"
            ]
        );
        let queries: Vec<&str> = rules.media.iter().map(|m| m.query.as_str()).collect();
        assert_eq!(
            queries,
            vec![
                "print",
                "screen",
                "ALL",
                "only print, tv",
                "not screen",
                "not print",
                "print and (min-width: 1px)",
                "print",
                "all",
                "print"
            ]
        );
        assert_eq!(
            rules.media[8].parent,
            Some(7),
            "@media all sits in @media print"
        );
        let only_features = rules.applicable(|q| q.contains('(')).1;
        assert_eq!(only_features, vec![".a", ".feature", ".z"]);
    }

    #[test]
    fn a_block_inside_a_block_that_does_not_match_is_not_evaluated() {
        let rules = parse_break_rules(&page(
            "@media screen { @media print { .x { break-before: page } } } \
             @media print { @media print { .y { break-before: page } } }",
        ));
        let mut asked = Vec::new();
        let applied = rules
            .applicable(|q| {
                asked.push(q.to_string());
                q == "print"
            })
            .1;
        assert_eq!(applied, vec![".y"]);
        // "print" is evaluated once for the three blocks that ask, "screen" once.
        assert_eq!(asked, vec!["screen", "print"]);
    }

    #[test]
    fn deeply_nested_media_blocks_do_not_recurse() {
        let depth = 200_000;
        let css = format!(
            "{}.deep {{ break-before: page }}{} .after {{ break-before: page }}",
            "@media all { ".repeat(depth),
            "}".repeat(depth)
        );
        let rules = parse_break_rules(&page(&css));
        assert_eq!(rules.media.len(), depth);
        assert_eq!(by_type(&rules).1, vec![".deep", ".after"]);
    }

    #[test]
    fn an_unterminated_media_block_keeps_its_rules() {
        let rules = parse_break_rules(&page("@media print { .p { break-before: page }"));
        assert_eq!(by_type(&rules).1, vec![".p"]);
    }

    #[test]
    fn an_unclosed_last_rule_keeps_its_last_byte() {
        // Port step 10: the body stopped one byte short of the end of the sheet, so `page`
        // was read as `pag` (Chrome 155 breaks before `.b`, probe x_unclosed_last_rule).
        let rules = parse_break_rules(&page("p { margin: 0 } p.b { break-before: page"));
        assert_eq!(by_type(&rules).1, vec!["p.b"]);
        let rules = parse_break_rules(&page(".a { break-inside: avoid"));
        assert_eq!(by_type(&rules).0, vec![".a"]);
        let rules = parse_break_rules(&page("@media print { .m { break-before: page"));
        assert_eq!(by_type(&rules).1, vec![".m"]);
        // A rule closed at the end of the sheet keeps reading its body without the `}`.
        let rules = parse_break_rules(&page(".c { break-before: page }"));
        assert_eq!(by_type(&rules).1, vec![".c"]);
        let rules = parse_break_rules(&page(".e {"));
        assert!(rules.page_before.is_empty() && rules.avoid_inside.is_empty());
    }

    #[test]
    fn an_unclosed_rule_ending_in_a_multibyte_character_does_not_panic() {
        // Port step 10: `css[i + 1..end - 1]` cut inside the last character ("end byte index
        // N is not a char boundary"), which reached the napi caller as an unlocated
        // "render panicked" error (the 09 verifier's hostile-input run).
        for css in [
            "p{\u{e9}",
            "p{\u{1f600}",
            "p { color: red; font-family: Caf\u{e9}",
            "@media print { p { content: \"\u{e9}",
            "p.b { break-before: page; font-family: Caf\u{e9}",
        ] {
            let rules = parse_break_rules(&page(css));
            assert_eq!(
                by_type(&rules).1.contains(&"p.b"),
                css.starts_with("p.b"),
                "{css:?}"
            );
        }
    }

    #[test]
    fn comment_markers_inside_strings_are_not_comments() {
        let rules = parse_break_rules(&page(
            ".c { content: \"/*\" } .pb { break-before: page } /* .x { break-before: page } */",
        ));
        assert_eq!(by_type(&rules).1, vec![".pb"]);
    }

    #[test]
    fn collects_break_after_and_its_legacy_alias() {
        let rules = parse_break_rules(&page(
            ".a { break-after: page } .b { page-break-after: always } \
             .c { break-after: avoid } .d { page-break-after: auto } \
             @media screen { .s { break-after: page } } .e { break-after: page; break-after: auto }",
        ));
        let (_, before, after) = rules.applicable(crate::page_css::media_matches);
        assert!(before.is_empty());
        assert_eq!(after, vec![".a", ".b"]);
        assert!(declares("PAGE-BREAK-AFTER: Always").page_after);
        assert!(!declares("break-after: column").page_after);
        assert!(!declares("page-break-after: always").page_before);
    }

    #[test]
    fn important_is_read_in_any_case_and_spacing() {
        assert!(declares("break-inside: AVOID !IMPORTANT").avoid_inside);
        assert!(declares("break-inside: avoid ! important").avoid_inside);
    }

    #[test]
    fn inline_declarations_are_read() {
        let hints = declares("color: red; BREAK-INSIDE: Avoid; break-before:page");
        assert!(hints.avoid_inside);
        assert!(hints.page_before);
        assert_eq!(declares("color: red"), BreakHints::default());
    }

    #[test]
    fn text_wrap_balance_is_read_from_the_shorthand_and_the_longhand() {
        assert_eq!(declares("text-wrap: balance").wrap_balance, Some(true));
        assert_eq!(declares("text-wrap: wrap balance").wrap_balance, Some(true));
        assert_eq!(
            declares("TEXT-WRAP-STYLE: Balance").wrap_balance,
            Some(true)
        );
        assert_eq!(declares("text-wrap: wrap").wrap_balance, Some(false));
        assert_eq!(
            declares("text-wrap-style: pretty").wrap_balance,
            Some(false)
        );
        assert_eq!(declares("text-wrap: inherit").wrap_balance, None);
        assert_eq!(declares("color: red").wrap_balance, None);
        // Blitz does not clamp, so a clamped block is not balanced.
        assert_eq!(
            declares("text-wrap: balance; -webkit-line-clamp: 2").wrap_balance,
            Some(false)
        );
        let rules = parse_break_rules(
            "<style>p { text-wrap: balance } .x { text-wrap-style: auto } \
             @media print { h1 { text-wrap: balance } }</style>",
        );
        let (balance, unbalance) = rules.applicable_wrap(|_| true);
        assert_eq!((balance, unbalance), (vec!["p", "h1"], vec![".x"]));
        let (balance, _) = rules.applicable_wrap(|_| false);
        assert_eq!(balance, vec!["p"]);
    }
}
