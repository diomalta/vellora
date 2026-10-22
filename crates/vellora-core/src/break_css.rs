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
    /// The selector lists (`avoid_inside`, `page_before`) of the rules whose
    /// every enclosing `@media` block matches, `matches` evaluating one media
    /// query list. Each distinct query text is evaluated once, and a block
    /// inside a block that does not match is not evaluated (linear in the
    /// number of blocks, whatever their nesting).
    pub fn applicable<'a>(
        &'a self,
        mut matches: impl FnMut(&str) -> bool,
    ) -> (Vec<&'a str>, Vec<&'a str>) {
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
        let select = |rules: &'a [BreakRule]| -> Vec<&'a str> {
            rules
                .iter()
                .filter(|rule| rule.media.is_none_or(|block| applies[block]))
                .map(|rule| rule.selector.as_str())
                .collect()
        };
        (select(&self.avoid_inside), select(&self.page_before))
    }
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
        for (selector, body, media) in top_level_rules(&css, &mut rules.media) {
            let hints = declares(&body);
            if hints.avoid_inside {
                rules.avoid_inside.push(BreakRule {
                    selector: selector.clone(),
                    media,
                });
            }
            if hints.page_before {
                rules.page_before.push(BreakRule { selector, media });
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
        rules.applicable(crate::page_css::media_matches)
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
