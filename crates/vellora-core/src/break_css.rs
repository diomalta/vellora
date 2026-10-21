//! Focused reader for the CSS Fragmentation properties the paginator honours:
//! `break-inside: avoid` and `break-before: page`, plus their legacy
//! `page-break-inside` / `page-break-before` aliases.
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
//! Documents are styled for print media (port step 07, `blitz_engine`), so the
//! rules of an `@media` block whose query list matches print are read too, with
//! the evaluator `page_css` uses for `@page` rules (`page_css::media_matches`:
//! the media type only; a query with a media feature does not match). Rules
//! nested in other at-rules (`@supports`, `@layer`, `@page`, …) are skipped;
//! `@page` is read by `page_css`.

/// Selectors whose matched elements carry a fragmentation hint.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct BreakRules {
    /// Selector lists declaring `break-inside: avoid` (or `avoid-page`).
    pub avoid_inside: Vec<String>,
    /// Selector lists declaring a forced break before the element.
    pub page_before: Vec<String>,
}

/// Which fragmentation hints one declaration block carries.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct BreakHints {
    pub avoid_inside: bool,
    pub page_before: bool,
}

/// Collect the break rules declared in the document's `<style>` elements.
pub fn parse_break_rules(html: &str) -> BreakRules {
    let mut rules = BreakRules::default();
    for region in crate::css_scan::style_blocks(html) {
        let css = strip_comments(&region.text);
        for (selector, body) in top_level_rules(&css) {
            let hints = declares(&body);
            if hints.avoid_inside {
                rules.avoid_inside.push(selector.clone());
            }
            if hints.page_before {
                rules.page_before.push(selector);
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
            _ => {}
        }
    }
    hints
}

/// Split a stylesheet into its qualified rules `(selector, body)` in source
/// order: the top-level ones and those of every `@media` block whose query list
/// matches the print medium (`page_css::media_matches`, the evaluator `@page`
/// rules use; port step 07). Every other at-rule is skipped together with its
/// block. A matching `@media` block is entered in place (a counter, no
/// recursion), so its nesting depth never touches the stack.
fn top_level_rules(css: &str) -> Vec<(String, String)> {
    let bytes = css.as_bytes();
    let mut out = Vec::new();
    let mut i = 0;
    let mut prelude_start = 0;
    // `@media` blocks entered and not closed yet.
    let mut open_media = 0usize;
    while i < bytes.len() {
        match bytes[i] {
            b'{' => {
                let prelude = css[prelude_start..i].trim();
                if let Some(at_rule) = prelude.strip_prefix('@') {
                    let name_len = at_rule
                        .find(|c: char| !(c.is_ascii_alphanumeric() || c == '-'))
                        .unwrap_or(at_rule.len());
                    let (name, query) = at_rule.split_at(name_len);
                    if name.eq_ignore_ascii_case("media") && crate::page_css::media_matches(query) {
                        open_media += 1;
                        i += 1;
                        prelude_start = i;
                        continue;
                    }
                }
                let end = block_end(bytes, i + 1);
                if !prelude.is_empty() && !prelude.starts_with('@') {
                    let body_end = end.saturating_sub(1).max(i + 1);
                    out.push((prelude.to_string(), css[i + 1..body_end].to_string()));
                }
                i = end;
                prelude_start = end;
            }
            b'}' if open_media > 0 => {
                open_media -= 1;
                i += 1;
                prelude_start = i;
            }
            b';' if css[prelude_start..i].trim_start().starts_with('@') => {
                i += 1;
                prelude_start = i;
            }
            b'"' | b'\'' => i = string_end(bytes, i),
            _ => i += 1,
        }
    }
    out
}

/// Index just past the `}` closing the block whose body starts at `start`
/// (or the end of input when the block is unterminated).
fn block_end(bytes: &[u8], start: usize) -> usize {
    let mut depth = 1i32;
    let mut i = start;
    while i < bytes.len() {
        match bytes[i] {
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return i + 1;
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
    bytes.len()
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

    #[test]
    fn collects_avoid_and_before_selectors() {
        let rules = parse_break_rules(&page(
            "tbody.meal { break-inside: avoid; } h2, .start { break-before: page }",
        ));
        assert_eq!(rules.avoid_inside, vec!["tbody.meal"]);
        assert_eq!(rules.page_before, vec!["h2, .start"]);
    }

    #[test]
    fn reads_legacy_aliases_and_important() {
        let rules = parse_break_rules(&page(
            ".a { page-break-inside: avoid !important } .b { page-break-before: always }",
        ));
        assert_eq!(rules.avoid_inside, vec![".a"]);
        assert_eq!(rules.page_before, vec![".b"]);
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
        assert_eq!(rules.avoid_inside, vec![".d"]);
    }

    #[test]
    fn reads_media_blocks_that_match_print_in_source_order() {
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
        assert_eq!(
            rules.page_before,
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
        );
        assert_eq!(rules.avoid_inside, vec![".pi"]);
    }

    #[test]
    fn deeply_nested_media_blocks_do_not_recurse() {
        let depth = 200_000;
        let css = format!(
            "{}.deep {{ break-before: page }}{} .after {{ break-before: page }}",
            "@media all { ".repeat(depth),
            "}".repeat(depth)
        );
        assert_eq!(
            parse_break_rules(&page(&css)).page_before,
            vec![".deep", ".after"]
        );
    }

    #[test]
    fn an_unterminated_media_block_keeps_its_rules() {
        let rules = parse_break_rules(&page("@media print { .p { break-before: page }"));
        assert_eq!(rules.page_before, vec![".p"]);
    }

    #[test]
    fn comment_markers_inside_strings_are_not_comments() {
        let rules = parse_break_rules(&page(
            ".c { content: \"/*\" } .pb { break-before: page } /* .x { break-before: page } */",
        ));
        assert_eq!(rules.page_before, vec![".pb"]);
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
}
