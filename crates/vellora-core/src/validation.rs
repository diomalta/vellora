//! Strict subset-validation gate.
//!
//! Walks the already-parsed Blitz tree IMMUTABLY before layout and rejects HTML
//! elements / CSS features outside vellora's documented subset. On the first
//! violation (document order) it returns a [`VelloraError::Unsupported`]
//! carrying the diagnostic contract `{ feature, line, col, hint }`.

use crate::blitz_engine;
use crate::css_scan;

/// The error type the render entry point returns. The `Unsupported` variant is
/// the Rust-side `VelloraUnsupportedError` that the napi binding
/// serializes across napi as `{ feature, line, col, hint }`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VelloraError {
    /// Input used a feature outside the documented subset.
    Unsupported(Diagnostic),
    /// The final PDF could not satisfy the requested conformance profile.
    Conformance {
        profile: String,
        errors: Vec<String>,
    },
    /// Rendering failed downstream (layout/pagination/PDF).
    Render(String),
}

impl std::fmt::Display for VelloraError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VelloraError::Unsupported(d) => write!(f, "{d}"),
            VelloraError::Conformance { profile, errors } => {
                let first = errors
                    .first()
                    .map(String::as_str)
                    .unwrap_or("unknown validation error");
                write!(f, "{profile} conformance failed: {first}")
            }
            VelloraError::Render(m) => write!(f, "render error: {m}"),
        }
    }
}

impl std::error::Error for VelloraError {}

/// Located diagnostic — the exact contract shape. `line`/`col` are
/// nullable because Blitz parses with html5ever's default tokenizer, which does
/// not retain per-node source positions; we recover them by locating the
/// element in the source when possible, else leave them `None`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    /// The unsupported feature (e.g. `"element:canvas"`, `"css:animation"`).
    pub feature: String,
    /// 1-based source line, when recoverable.
    pub line: Option<u32>,
    /// 1-based source column, when recoverable.
    pub col: Option<u32>,
    /// Actionable hint — always directs the author to `vellora fix`.
    pub hint: String,
}

impl std::fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let loc = match (self.line, self.col) {
            (Some(l), Some(c)) => format!(" at line {l}, column {c}"),
            (Some(l), None) => format!(" at line {l}"),
            _ => String::new(),
        };
        write!(
            f,
            "unsupported feature `{}`{}: {}",
            self.feature, loc, self.hint
        )
    }
}

const FIX_HINT: &str = "outside vellora's document subset; run `vellora fix`";

/// Maximum element nesting depth accepted before layout. Beyond this, the
/// recursive Stylo style resolution / Taffy layout / glyph walk would overflow
/// the worker-thread stack and ABORT the process (a stack overflow is fatal and
/// not catchable by `catch_unwind`). The strict gate rejects over-deep documents
/// here, BEFORE any recursion runs, so the napi "a single bad render can never
/// abort the process" guarantee holds.
///
/// The cap is deliberately conservative: the recursive Stylo/Taffy/walk pass
/// overflows a 2 MiB thread stack at roughly ~240 levels of nesting, so the cap
/// sits comfortably below that to keep a margin on the smallest realistic worker
/// stack. Real documents nest only a handful of levels deep, so this rejects
/// only pathological input (e.g. `"<div>".repeat(5000)`), never normal markup.
pub const MAX_NESTING_DEPTH: usize = 192;

/// HTML elements OUTSIDE the document subset. Block/inline/table/image/text
/// document elements are allowed; interactive, scripting, media, and embedded
/// content are not.
const DENIED_ELEMENTS: &[&str] = &[
    "script", "canvas", "video", "audio", "iframe", "object", "embed", "applet", "input", "button",
    "select", "textarea", "form", "marquee", "blink", "noscript",
];

/// CSS properties OUTSIDE the subset. The needle is the property name; the scan
/// only matches it at a property boundary (after `{`, `;`, or whitespace), so
/// in-subset properties that merely contain the needle as a substring (e.g.
/// `text-transform`, which contains `transform`) are NOT falsely flagged.
const DENIED_CSS_PROPERTIES: &[(&str, &str)] = &[
    ("animation", "css:animation"),
    ("transform", "css:transform"),
    ("transition", "css:transition"),
    ("filter", "css:filter"),
    ("backdrop-filter", "css:backdrop-filter"),
    ("perspective", "css:3d-transform"),
];

/// At-rules / values OUTSIDE the subset, matched as plain substrings (they have
/// no benign superstring in our subset).
const DENIED_CSS_TOKENS: &[(&str, &str)] = &[
    ("@keyframes", "css:keyframes"),
    ("display:grid", "css:grid"),
    ("display: grid", "css:grid"),
];

/// The HTML element denylist (subset complement). Exposed so the render path can
/// validate against the SAME parse it uses for layout (cost model).
pub fn denied_elements() -> &'static [&'static str] {
    DENIED_ELEMENTS
}

/// Validate the source HTML against the subset. Returns the first violation in
/// document order, or `Ok(())` if in-subset. This standalone API parses for the
/// element walk; the render path instead uses
/// [`blitz_engine::validate_then_lay_out`] to share ONE parse across validation
/// and layout (see [`validate_css`] + [`element_diagnostic`]).
pub fn validate(html: &str) -> Result<(), VelloraError> {
    // 1) Depth gate FIRST: reject over-deep nesting before any recursive walk
    // (the element walk below and downstream layout both recurse and would
    // overflow the stack → process abort on pathologically deep input).
    validate_nesting_depth(html)?;

    // 2) HTML element allowlist via an immutable walk of the parsed tree.
    if let Some(diag) = blitz_engine::find_denied_element(html, DENIED_ELEMENTS) {
        return Err(VelloraError::Unsupported(diag_for_element(&diag, html)));
    }

    // 3) CSS feature scan over the document's CSS regions (deterministic).
    validate_css(html)
}

/// CSS-only validation: a cheap byte scan of the source stylesheet, NO HTML
/// parse. Used by the render path so the only HTML parse is the layout parse.
pub fn validate_css(html: &str) -> Result<(), VelloraError> {
    match scan_css(html) {
        Some(diag) => Err(VelloraError::Unsupported(diag)),
        None => Ok(()),
    }
}

/// Reject documents whose element nesting exceeds [`MAX_NESTING_DEPTH`]. Runs on
/// an EXPLICIT-stack walk of the parsed tree (no native recursion), so it cannot
/// itself overflow, and must be called BEFORE the recursive layout walk so the
/// over-deep input is rejected cleanly instead of aborting the process.
pub fn validate_nesting_depth(html: &str) -> Result<(), VelloraError> {
    let depth = blitz_engine::max_nesting_depth(html);
    if depth > MAX_NESTING_DEPTH {
        return Err(VelloraError::Unsupported(Diagnostic {
            feature: "max-nesting-depth".to_string(),
            line: None,
            col: None,
            hint: format!(
                "document nests elements {depth} deep; the maximum is {MAX_NESTING_DEPTH}. \
                 Flatten deeply-nested markup before rendering."
            ),
        }));
    }
    Ok(())
}

/// Build the located diagnostic for a denied element discovered during the
/// shared validate-then-layout walk.
pub fn element_diagnostic(found: &blitz_engine::DeniedElement, html: &str) -> Diagnostic {
    diag_for_element(found, html)
}

/// Build the located diagnostic for a renderable `<img>` whose `src` could not be
/// resolved to image bytes. Reuses the same `<tag`-ordinal source locator as the
/// element gate. Unlike the subset gate, this is a runtime, options-dependent
/// failure (it depends on the caller's `images`/`baseUrl`), so it has no
/// `@vellora/lint` counterpart — lint sees only the HTML, not the supplied bytes,
/// so there is nothing to keep in sync in `RULE_ID_TO_CORE_FEATURE`.
pub fn image_diagnostic(found: &blitz_engine::UnresolvedImage, html: &str) -> Diagnostic {
    let (line, col) = locate_tag(html, "img", found.occurrence, found.dom_total);
    Diagnostic {
        feature: "image:unresolved".to_string(),
        // `reason` carries the full, case-specific guidance (a missing map entry, a
        // bad data: URL, or unrecognized bytes each need different advice), so the
        // hint just frames it rather than appending a one-size tail that would
        // misdirect (e.g. telling a data:-URL author to "supply via images").
        line,
        col,
        hint: format!("<img> source could not be resolved: {}", found.reason),
    }
}

/// Build the diagnostic for a caller-supplied `fonts` blob that did not register
/// as a usable font face (corrupt/truncated bytes, a non-font payload, or an
/// unsupported container). Unlike the element/image diagnostics this has NO
/// source location: the failure is in a render *option*, not a DOM node, so
/// `line`/`col` are `None` and the hint names the offending blob by its index.
/// Like `image_diagnostic` this is a runtime, options-dependent failure with no
/// `@vellora/lint` counterpart (lint sees only the HTML, never the `fonts`
/// bytes), so there is nothing to keep in sync in `RULE_ID_TO_CORE_FEATURE`.
pub fn font_diagnostic(index: usize) -> Diagnostic {
    Diagnostic {
        feature: "font:invalid".to_string(),
        line: None,
        col: None,
        hint: format!("fonts[{index}] is not a parseable font face — supply valid TTF/OTF bytes"),
    }
}

/// A denied element found by the engine walk: its tag + DOM document order.
fn diag_for_element(found: &blitz_engine::DeniedElement, html: &str) -> Diagnostic {
    let (line, col) = locate_tag(html, &found.tag, found.occurrence, found.dom_total);
    Diagnostic {
        feature: format!("element:{}", found.tag),
        line,
        col,
        hint: format!("<{}> is {}", found.tag, FIX_HINT),
    }
}

/// Scan ONLY the document's CSS regions (`<style>` element text + `style=`
/// attribute values) for denied CSS. Prose, attributes, and code samples are
/// never scanned, so a denied keyword appearing in body text is not a false
/// rejection. Reports the earliest-occurring violation in original
/// source order (deterministic). `best` carries the byte offset in the ORIGINAL
/// html so line/col map to the real document.
fn scan_css(html: &str) -> Option<Diagnostic> {
    let mut best: Option<(usize, &str)> = None;

    for region in css_scan::css_regions(html) {
        // Strip CSS comments AND quoted-string interiors (replaced with spaces
        // to preserve byte offsets) so `display:/*x*/grid` is still caught while
        // a denied word inside a string value — e.g.
        // `content: "see animation: details"` — is NOT falsely flagged.
        let stripped = strip_css_comments_and_strings(&region.text);
        let lower = stripped.to_ascii_lowercase();
        let bytes = lower.as_bytes();

        // Property-name matches, only at a property boundary.
        for (prop, feature) in DENIED_CSS_PROPERTIES {
            let mut start = 0;
            while let Some(rel) = lower[start..].find(prop) {
                let idx = start + rel;
                let before = if idx == 0 { None } else { Some(bytes[idx - 1]) };
                let after = bytes.get(idx + prop.len()).copied();
                let prop_boundary_before = matches!(
                    before,
                    None | Some(b'{')
                        | Some(b';')
                        | Some(b' ')
                        | Some(b'\t')
                        | Some(b'\n')
                        | Some(b'\r')
                        | Some(b'"')
                        | Some(b'\'')
                );
                // A property name is followed by optional space then `:`.
                let prop_boundary_after =
                    matches!(after, Some(b':') | Some(b' ') | Some(b'\t') | Some(b'\n'));
                if prop_boundary_before && prop_boundary_after {
                    consider(&mut best, region.offset + idx, feature);
                    break;
                }
                start = idx + prop.len();
            }
        }

        // Plain-token matches.
        for (token, feature) in DENIED_CSS_TOKENS {
            if let Some(idx) = lower.find(token) {
                consider(&mut best, region.offset + idx, feature);
            }
        }

        // `display` declaring `grid` with arbitrary whitespace around the colon
        // (e.g. `display : grid`) is the same violation as `display:grid`; catch
        // it via a normalized check the literal token list would otherwise miss.
        if let Some(idx) = find_display_grid(&lower) {
            consider(&mut best, region.offset + idx, "css:grid");
        }
    }

    let (idx, feature) = best?;
    let (line, col) = offset_to_line_col(html, idx);
    Some(Diagnostic {
        feature: feature.to_string(),
        line: Some(line),
        col: Some(col),
        hint: format!("this CSS feature is {FIX_HINT}"),
    })
}

/// Replace every `/* … */` comment span AND every `"…"`/`'…'` string interior
/// with equal-length spaces, preserving all byte offsets so a later match still
/// maps to the right source position. Blanking string interiors prevents a
/// denied keyword inside a value (e.g. `content: "filter results"`) from being
/// mistaken for a real declaration; blanking comments keeps
/// `display:/*x*/grid` catchable.
fn strip_css_comments_and_strings(css: &str) -> String {
    let bytes = css.as_bytes();
    let mut out = String::with_capacity(css.len());
    let mut i = 0;
    while i < bytes.len() {
        if i + 1 < bytes.len() && bytes[i] == b'/' && bytes[i + 1] == b'*' {
            let mut j = i + 2;
            out.push(' ');
            out.push(' ');
            while j + 1 < bytes.len() && !(bytes[j] == b'*' && bytes[j + 1] == b'/') {
                out.push(' ');
                j += 1;
            }
            if j + 1 < bytes.len() {
                out.push(' ');
                out.push(' ');
                j += 2;
            } else {
                // Unterminated comment: pad the remainder.
                while j < bytes.len() {
                    out.push(' ');
                    j += 1;
                }
            }
            i = j;
        } else if bytes[i] == b'"' || bytes[i] == b'\'' {
            // A CSS string. We blank its interior to spaces so a denied keyword
            // *inside a value* (e.g. `content: "see animation: details"`) is not
            // mistaken for a real declaration. But the gate must FAIL
            // CLOSED: a malformed/unterminated string must never swallow a denied
            // declaration that follows it. We classify how the string ends and
            // only commit the blanking when it is a real, terminated value.
            //
            //   * close quote found  -> terminated value: blank interior, keep the
            //     close quote (the false-positive case the blanking exists for).
            //   * unescaped newline (\n \r \f) or `}` -> CSS *bad-string* / block
            //     terminator: blank the interior up to it, then leave the
            //     terminator and everything after it as literal text so a later
            //     declaration is still scanned.
            //   * end-of-region, no close quote, no newline/`}` -> a genuinely
            //     unterminated single-line string: do NOT blank at all — emit the
            //     opening quote then leave the rest as literal, so a following
            //     denied declaration (e.g. `content:"abc\";animation:spin`) is
            //     still scanned rather than blanked away.
            //
            // A `\` escapes the next byte (including a `\<newline>` line
            // continuation, which is consumed, not a bad-string terminator), so we
            // track escapes while locating the terminator.
            let quote = bytes[i];
            let mut j = i + 1;
            let mut blanked = String::new();
            let mut closed = false;
            let mut bad_string = false;
            while j < bytes.len() {
                if bytes[j] == quote {
                    closed = true;
                    break;
                }
                if matches!(bytes[j], b'\n' | b'\r' | 0x0c | b'}') {
                    bad_string = true;
                    break;
                }
                if bytes[j] == b'\\' && j + 1 < bytes.len() {
                    blanked.push(' ');
                    j += 1;
                }
                let ch_len = utf8_len(bytes[j]);
                for _ in 0..ch_len {
                    blanked.push(' ');
                }
                j += ch_len;
            }
            if closed || bad_string {
                // A real value (terminated, or a bad-string ended by newline/`}`):
                // commit the blanked interior. For a terminated value also keep the
                // close quote; for a bad-string leave the newline/`}` as literal.
                out.push(quote as char);
                out.push_str(&blanked);
                if closed {
                    out.push(bytes[j] as char);
                    j += 1;
                }
                i = j;
            } else {
                // Unterminated, no newline/`}`: do NOT blank. Emit the opening quote
                // verbatim and let the outer loop re-scan the rest as literal CSS.
                out.push(quote as char);
                i += 1;
            }
        } else {
            // Keep ASCII bytes as-is; multibyte chars are copied whole.
            let ch_len = utf8_len(bytes[i]);
            out.push_str(&css[i..i + ch_len]);
            i += ch_len;
        }
    }
    out
}

fn utf8_len(b: u8) -> usize {
    if b < 0x80 {
        1
    } else if b >> 5 == 0b110 {
        2
    } else if b >> 4 == 0b1110 {
        3
    } else {
        4
    }
}

/// Find a `display` declaration whose value is `grid`, tolerating arbitrary
/// whitespace around the colon (`display : grid`). Returns the offset of the
/// `display` keyword. Input is already lowercased and comment-stripped.
fn find_display_grid(lower: &str) -> Option<usize> {
    let bytes = lower.as_bytes();
    let mut start = 0;
    while let Some(rel) = lower[start..].find("display") {
        let idx = start + rel;
        let before = if idx == 0 { None } else { Some(bytes[idx - 1]) };
        let boundary_before = matches!(
            before,
            None | Some(b'{') | Some(b';') | Some(b' ') | Some(b'\t') | Some(b'\n') | Some(b'\r')
        );
        // Skip whitespace, require a colon, skip whitespace, require `grid`.
        let mut k = idx + "display".len();
        while k < bytes.len() && matches!(bytes[k], b' ' | b'\t' | b'\n' | b'\r') {
            k += 1;
        }
        if boundary_before && bytes.get(k).copied() == Some(b':') {
            k += 1;
            while k < bytes.len() && matches!(bytes[k], b' ' | b'\t' | b'\n' | b'\r') {
                k += 1;
            }
            if lower[k..].starts_with("grid") {
                // Require a value terminator after `grid` so `display:gridiron`
                // (not a real value) is not falsely flagged.
                let after = bytes.get(k + 4).copied();
                let terminated = matches!(
                    after,
                    None | Some(b';')
                        | Some(b'}')
                        | Some(b' ')
                        | Some(b'\t')
                        | Some(b'\n')
                        | Some(b'\r')
                );
                if terminated {
                    return Some(idx);
                }
            }
        }
        start = idx + "display".len();
    }
    None
}

fn consider<'a>(best: &mut Option<(usize, &'a str)>, idx: usize, feature: &'a str) {
    match best {
        Some((b, _)) if *b <= idx => {}
        _ => *best = Some((idx, feature)),
    }
}

/// Replace HTML-comment spans (`<!-- ... -->`) and quoted attribute-value
/// interiors (`="..."` / `='...'` inside a tag) with equal-length spaces so the
/// `<tag` boundary scan in [`locate_tag`] never counts a tag literal that lives
/// in a comment or attribute value (which produces no DOM element). Byte offsets
/// are preserved (one space per byte) so a later match still maps to real source.
///
/// Quotes are only treated as attribute delimiters while INSIDE a tag (between an
/// unquoted `<` and its matching `>`); a quote/apostrophe in body text (e.g.
/// `it's`) is left verbatim so it cannot swallow a later real `<tag` boundary.
fn mask_html_noise(html: &str) -> String {
    let bytes = html.as_bytes();
    let mut out = String::with_capacity(html.len());
    let mut i = 0;
    // None outside a tag; Some(None) inside a tag but not in an attr value;
    // Some(Some(q)) inside a tag's attribute value delimited by quote `q`.
    let mut tag_state: Option<Option<u8>> = None;
    while i < bytes.len() {
        // HTML comment span — blank `<!-- ... -->` entirely (only outside a tag).
        if tag_state.is_none() && html[i..].starts_with("<!--") {
            let end = match html[i + 4..].find("-->") {
                Some(r) => i + 4 + r + 3, // include the closing `-->`
                None => bytes.len(),      // unterminated: blank to end
            };
            for _ in i..end {
                out.push(' ');
            }
            i = end;
            continue;
        }
        let b = bytes[i];
        match tag_state {
            // Outside any tag: copy verbatim; `<` opens a tag.
            None => {
                if b == b'<' {
                    tag_state = Some(None);
                }
                let ch_len = utf8_len(b);
                out.push_str(&html[i..i + ch_len]);
                i += ch_len;
            }
            // Inside a tag, not in an attribute value.
            Some(None) => {
                match b {
                    b'>' => tag_state = None,
                    b'"' | b'\'' => tag_state = Some(Some(b)),
                    _ => {}
                }
                let ch_len = utf8_len(b);
                out.push_str(&html[i..i + ch_len]);
                i += ch_len;
            }
            // Inside a tag's attribute value: blank to the close quote.
            Some(Some(q)) => {
                if b == q {
                    out.push(b as char);
                    tag_state = Some(None);
                    i += 1;
                } else {
                    let ch_len = utf8_len(b);
                    for _ in 0..ch_len {
                        out.push(' ');
                    }
                    i += ch_len;
                }
            }
        }
    }
    out
}

/// Locate the Nth (1-based) `<tag` opening in the source for line/col.
///
/// `dom_total` is the number of this tag in the parsed DOM. We first blank the
/// regions that can NEVER produce a DOM element — HTML comments (`<!-- ... -->`)
/// and quoted attribute-value interiors — with equal-length spaces (preserving
/// byte offsets) so a denied tag merely *mentioned* in a comment or attribute
/// (e.g. `<div title="use <script>">`, `<!-- <input> -->`) does not add a phantom
/// `<tag` boundary. Without this, such a mention inflated the source count, made
/// `offsets.len() != dom_total`, and forced a recoverable position to `(None,
/// None)`.
///
/// After masking, if the source still has a different number of `<tag` boundaries
/// than the DOM, html5ever genuinely reparented/injected elements (e.g. a denied
/// tag fostered out of table context), so the DOM ordinal cannot be trusted to
/// map to the same source occurrence — we return `(None, None)` rather than point
/// at the wrong element. `None` is the honest, contract-sanctioned output
/// when the position is unrecoverable.
fn locate_tag(
    html: &str,
    tag: &str,
    occurrence: usize,
    dom_total: usize,
) -> (Option<u32>, Option<u32>) {
    let needle = format!("<{tag}");
    // Mask comment/attribute noise, then lowercase. Masking before lowercasing is
    // fine (it only writes ASCII spaces) and keeps byte offsets aligned with the
    // ORIGINAL `html` so offset_to_line_col below maps to the real source.
    let masked = mask_html_noise(html);
    let lower = masked.to_ascii_lowercase();

    // Collect the byte offsets of every real `<tag` boundary in the source.
    let mut offsets = Vec::new();
    let mut start = 0usize;
    while let Some(rel) = lower[start..].find(&needle) {
        let idx = start + rel;
        let next = lower.as_bytes().get(idx + needle.len()).copied();
        let is_boundary = matches!(
            next,
            Some(b' ') | Some(b'>') | Some(b'/') | Some(b'\t') | Some(b'\n') | Some(b'\r') | None
        );
        if is_boundary {
            offsets.push(idx);
        }
        start = idx + needle.len();
    }

    // Ordinal mapping is only trustworthy when the source and DOM agree on the
    // tag count; otherwise the Nth DOM element is not the Nth source `<tag`.
    if offsets.len() != dom_total {
        return (None, None);
    }
    match offsets.get(occurrence.wrapping_sub(1)) {
        Some(&idx) => {
            let (l, c) = offset_to_line_col(html, idx);
            (Some(l), Some(c))
        }
        None => (None, None),
    }
}

/// Convert a byte offset to 1-based (line, column).
fn offset_to_line_col(s: &str, offset: usize) -> (u32, u32) {
    let mut line = 1u32;
    let mut col = 1u32;
    for (i, ch) in s.char_indices() {
        if i >= offset {
            break;
        }
        if ch == '\n' {
            line += 1;
            col = 1;
        } else {
            col += 1;
        }
    }
    (line, col)
}
