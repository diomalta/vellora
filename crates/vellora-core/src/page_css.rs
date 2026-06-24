//! Focused reader for the `@page` rule (size, margins, and margin-box content).
//!
//! Stylo does NOT retain CSS Paged Media margin boxes or page-context counters
//! (no Gecko/Servo engine does), so vellora runs its OWN small pass over the
//! source stylesheet to extract them (design Risk: "@page margin-box support").
//! The `@page` rule in our document subset is narrow and well-shaped, so a
//! focused parse is simpler and more testable than a general CSS tokenizer.

/// 1 CSS px at 96dpi. Conversions: 1in = 96px = 25.4mm = 72pt.
const PX_PER_MM: f64 = 96.0 / 25.4;
const PX_PER_PT: f64 = 96.0 / 72.0;
const PX_PER_IN: f64 = 96.0;

/// A4 in CSS px (210mm x 297mm).
const A4_W: f64 = 210.0 * PX_PER_MM;
const A4_H: f64 = 297.0 * PX_PER_MM;
/// US Letter in CSS px (8.5in x 11in).
const LETTER_W: f64 = 8.5 * PX_PER_IN;
const LETTER_H: f64 = 11.0 * PX_PER_IN;

/// Which page margin box a content template belongs to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MarginBox {
    TopCenter,
    BottomCenter,
}

/// A running header/footer content template (e.g. the page-number footer),
/// parsed from a margin-box at-rule's `content:` declaration.
#[derive(Debug, Clone)]
pub struct MarginContent {
    pub which: MarginBox,
    /// Ordered template parts; `counter(page)`/`counter(pages)` resolve later.
    pub parts: Vec<ContentPart>,
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

/// The resolved `@page` box.
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
        }
    }
}

/// Parse the first `@page { ... }` rule out of the document's inline CSS.
/// Falls back to A4/16mm when absent or unparseable.
pub fn parse_page_box(html: &str) -> PageBox {
    let mut page = PageBox::default_a4();

    let css = match extract_at_page_block(html) {
        Some(block) => block,
        None => return page,
    };

    // The block can contain plain declarations AND nested margin-box at-rules.
    // Split nested `@... { ... }` out first, parse them, then the remainder is
    // the page's own declarations.
    let (declarations, margin_rules) = split_margin_boxes(&css);

    for (prop, value) in parse_declarations(&declarations) {
        match prop.as_str() {
            "size" => apply_size(&mut page, &value),
            "margin" => apply_margin_shorthand(&mut page, &value),
            "margin-top" => page.margin_top = length_px(&value).unwrap_or(page.margin_top),
            "margin-right" => page.margin_right = length_px(&value).unwrap_or(page.margin_right),
            "margin-bottom" => page.margin_bottom = length_px(&value).unwrap_or(page.margin_bottom),
            "margin-left" => page.margin_left = length_px(&value).unwrap_or(page.margin_left),
            _ => {}
        }
    }

    for (name, body) in margin_rules {
        if let Some(which) = margin_box_name(&name) {
            for (prop, value) in parse_declarations(&body) {
                if prop == "content" {
                    page.margins_content.push(MarginContent {
                        which,
                        parts: parse_content_template(&value),
                    });
                }
            }
        }
    }

    page
}

/// Extract the body between the braces of the first well-formed `@page` rule.
/// Scans ONLY `<style>` element CSS (never body text or attributes), so a
/// literal `@page { … }` in prose cannot hijack the page box (F5/R6). If the
/// first `@page` match has an unbalanced brace block, the scan continues to a
/// later well-formed `@page` rather than silently falling back to A4.
fn extract_at_page_block(html: &str) -> Option<String> {
    for region in crate::css_scan::style_blocks(html) {
        let css = &region.text;
        let lower = css.to_ascii_lowercase();
        let bytes = css.as_bytes();
        let mut search = 0usize;
        while let Some(rel) = lower[search..].find("@page") {
            let at = search + rel;
            let open_rel = match lower[at..].find('{') {
                Some(p) => p,
                None => break,
            };
            let start = at + open_rel + 1;
            // Balance braces (the @page block contains nested margin-box braces).
            let mut depth = 1i32;
            let mut i = start;
            let mut closed = None;
            while i < bytes.len() {
                match bytes[i] {
                    b'{' => depth += 1,
                    b'}' => {
                        depth -= 1;
                        if depth == 0 {
                            closed = Some(i);
                            break;
                        }
                    }
                    _ => {}
                }
                i += 1;
            }
            match closed {
                Some(end) => return Some(css[start..end].to_string()),
                // Unbalanced: skip this spurious `@page` and look for a later one.
                None => search = at + 5,
            }
        }
    }
    None
}

/// Split nested `@name { body }` margin-box rules from the plain declarations.
fn split_margin_boxes(block: &str) -> (String, Vec<(String, String)>) {
    let bytes = block.as_bytes();
    let mut plain = String::new();
    let mut rules = Vec::new();
    let mut i = 0;
    // Start of the current run of plain (non-at-rule) text. All split
    // boundaries (`@`, `{`, `}`) are ASCII, so every boundary index falls on a
    // char boundary and `&block[plain_start..i]` is always a valid UTF-8 slice
    // — UTF-8-clean, unlike a per-byte `as char` cast (F4/SEC-5).
    let mut plain_start = 0;
    while i < bytes.len() {
        if bytes[i] == b'@' {
            // Flush the plain run that precedes this at-rule.
            plain.push_str(&block[plain_start..i]);
            // Read the at-rule name up to '{'.
            let name_start = i;
            let mut j = i;
            while j < bytes.len() && bytes[j] != b'{' {
                j += 1;
            }
            if j >= bytes.len() {
                // Unterminated inner at-rule (no `{`). The pre-`@` plain run was
                // already flushed above; mark it consumed so the final flush at
                // the end of this function does not re-emit it (RUST-DIFF-3).
                plain_start = i;
                break;
            }
            let name = block[name_start..j].trim().to_string();
            // Read the balanced body.
            let body_start = j + 1;
            let mut depth = 1i32;
            let mut k = body_start;
            while k < bytes.len() && depth > 0 {
                match bytes[k] {
                    b'{' => depth += 1,
                    b'}' => depth -= 1,
                    _ => {}
                }
                k += 1;
            }
            let body = block[body_start..k.saturating_sub(1)].to_string();
            rules.push((name, body));
            i = k;
            plain_start = k;
        } else {
            i += 1;
        }
    }
    plain.push_str(&block[plain_start..i]);
    (plain, rules)
}

/// Parse a flat list of `prop: value;` declarations.
fn parse_declarations(block: &str) -> Vec<(String, String)> {
    let mut out = Vec::new();
    for decl in block.split(';') {
        let decl = decl.trim();
        if decl.is_empty() {
            continue;
        }
        if let Some((prop, value)) = decl.split_once(':') {
            out.push((prop.trim().to_ascii_lowercase(), value.trim().to_string()));
        }
    }
    out
}

fn margin_box_name(name: &str) -> Option<MarginBox> {
    let n = name.to_ascii_lowercase();
    if n.contains("@top-center") {
        Some(MarginBox::TopCenter)
    } else if n.contains("@bottom-center") {
        Some(MarginBox::BottomCenter)
    } else {
        None
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
        // (a, a)` arm would silently produce a 297mm SQUARE page (RUST-DIFF-2 /
        // INV-4 / EDGE-3). This also closes the unknown-unit slot-shift for free.
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
    // shorthand t=20 r=30 b=40 l=30 (RUST-DIFF-2 / INV-4).
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
    // Returning None drops the token and keeps the existing dimension (SEC-6).
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
fn parse_content_template(value: &str) -> Vec<ContentPart> {
    let mut parts = Vec::new();
    let chars: Vec<char> = value.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if c == '"' || c == '\'' {
            let quote = c;
            i += 1;
            let mut lit = String::new();
            while i < chars.len() && chars[i] != quote {
                lit.push(chars[i]);
                i += 1;
            }
            i += 1; // closing quote
            i += 1; // closing quote
            parts.push(ContentPart::Literal(lit));
        } else if chars[i..]
            .iter()
            .collect::<String>()
            .to_ascii_lowercase()
            .starts_with("counter(")
        {
            // Consume up to ')'. Stay in CHAR units: `close` is the char count
            // to the closing paren (not a byte offset) so a multibyte char
            // inside the counter() arguments cannot desync `i` (R7/SEC-3).
            let close = chars[i..]
                .iter()
                .position(|c| *c == ')')
                .unwrap_or(chars.len() - i);
            let inner: String = chars[i + 8..i + close]
                .iter()
                .collect::<String>()
                .trim()
                .to_ascii_lowercase();
            if inner == "pages" {
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

    #[test]
    fn split_margin_boxes_keeps_plain_region_utf8_clean() {
        // F4/SEC-5 (TQ-NEW-2): a non-ASCII char in the PLAIN-declaration region —
        // the path the buggy per-byte `as char` cast actually processed — must
        // round-trip cleanly. The earlier integration test only put the multibyte
        // char inside a margin-box body, which uses UTF-8-safe slicing and was
        // never broken; this drives the real `plain` accumulation path.
        let (plain, rules) =
            split_margin_boxes(" /* café */ margin: 10px; @bottom-center { content: \"x\"; } ");
        assert!(
            plain.contains("café"),
            "plain declarations must be UTF-8 clean (not `cafÃ©`), got {plain:?}"
        );
        assert!(
            !plain.contains("Ã"),
            "no mojibake from a per-byte `as char` cast, got {plain:?}"
        );
        assert_eq!(rules.len(), 1, "the @bottom-center rule is split out");
    }

    #[test]
    fn split_margin_boxes_does_not_duplicate_plain_before_unterminated_at_rule() {
        // RUST-DIFF-3: when an inner at-rule has no `{` (unterminated), the pre-`@`
        // plain run must be emitted exactly ONCE. Pre-fix the early break left
        // `plain_start` unchanged, so the final flush re-emitted the span (e.g.
        // ` color: red;  color: red; `).
        let (plain, rules) = split_margin_boxes(" color: red; @top-center color ");
        assert_eq!(
            plain, " color: red; ",
            "plain text before an unterminated inner at-rule is emitted once"
        );
        assert!(
            rules.is_empty(),
            "an unterminated inner at-rule yields no margin rule, got {rules:?}"
        );
    }
}
