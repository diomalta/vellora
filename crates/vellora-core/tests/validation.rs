//! Subset-validation gate tests (tasks 5.4-5.6).

use vellora_core::validation::{validate, VelloraError};

const INVOICE: &str = include_str!("fixtures/invoice.html");

#[test]
fn out_of_subset_css_animation_is_rejected() {
    let html = r#"<!DOCTYPE html><html><head><style>
        .x { animation: spin 2s linear infinite; }
    </style></head><body><div class="x">hi</div></body></html>"#;

    let err = validate(html).expect_err("animation must be rejected");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "css:animation");
            assert!(d.line.is_some(), "located diagnostic carries a line");
            assert!(d.col.is_some(), "located diagnostic carries a column");
            assert!(d.hint.contains("vellora fix"), "hint points at vellora fix");
        }
        other => panic!("expected Unsupported, got {other:?}"),
    }
}

#[test]
fn out_of_subset_3d_transform_is_rejected() {
    let html = r#"<!DOCTYPE html><html><head><style>
        .y { perspective: 500px; }
    </style></head><body><div class="y">hi</div></body></html>"#;

    let err = validate(html).expect_err("3d transform must be rejected");
    if let VelloraError::Unsupported(d) = err {
        assert_eq!(d.feature, "css:3d-transform");
        assert!(d.hint.contains("vellora fix"));
    } else {
        panic!("expected Unsupported");
    }
}

#[test]
fn out_of_subset_element_is_rejected_with_node_and_location() {
    let html =
        "<!DOCTYPE html><html><body>\n  <p>ok</p>\n  <script>alert(1)</script>\n</body></html>";
    let err = validate(html).expect_err("script element must be rejected");
    if let VelloraError::Unsupported(d) = err {
        assert_eq!(d.feature, "element:script");
        assert_eq!(d.line, Some(3), "names the offending node's source line");
        assert!(d.col.is_some());
        assert!(d.hint.contains("vellora fix"));
    } else {
        panic!("expected Unsupported");
    }
}

#[test]
fn in_subset_invoice_passes_the_gate() {
    validate(INVOICE).expect("the in-subset invoice fixture passes the gate");
}

#[test]
fn first_reported_violation_is_deterministic() {
    // Two violations: a <canvas> element and a CSS animation. The element walk
    // runs first, so the canvas is reported. Must be identical across runs.
    let html = r#"<!DOCTYPE html><html><head><style>
        .a { animation: x 1s; }
    </style></head><body>
        <canvas></canvas>
        <video></video>
    </body></html>"#;

    let a = validate(html).unwrap_err();
    let b = validate(html).unwrap_err();
    assert_eq!(a, b, "same first violation across two runs");
    if let VelloraError::Unsupported(d) = a {
        // canvas precedes video in document order.
        assert_eq!(d.feature, "element:canvas");
    } else {
        panic!("expected Unsupported");
    }
}

// SEC-1: pathologically deep nesting must be REJECTED cleanly, not crash the
// process via a fatal stack overflow (which catch_unwind cannot recover).

#[test]
fn deeply_nested_document_is_rejected_not_aborted() {
    // ~5000 nested <div>s would overflow the recursive resolve/layout/walk and
    // SIGABRT the process pre-fix. The depth gate rejects it cleanly first.
    let depth = 5000;
    let html = format!(
        "<!DOCTYPE html><html><body>{}{}</body></html>",
        "<div>".repeat(depth),
        "</div>".repeat(depth)
    );
    let err = validate(&html).expect_err("deep nesting must be rejected");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "max-nesting-depth");
            assert!(
                d.hint.contains("deep") || d.hint.contains("maximum"),
                "hint explains the depth cap, got {:?}",
                d.hint
            );
        }
        other => panic!("expected Unsupported(max-nesting-depth), got {other:?}"),
    }
}

#[test]
fn shallow_document_passes_the_depth_gate() {
    let html = "<!DOCTYPE html><html><body><div><section><p><span>ok</span></p></section></div></body></html>";
    assert!(validate(html).is_ok(), "shallow doc passes the depth gate");
}

// F1 / RUST-5: the CSS subset gate must scan ONLY real CSS regions (<style>
// text and style= attributes), never body prose or arbitrary attributes.

#[test]
fn denied_keyword_in_body_text_passes_the_gate() {
    let cases = [
        r#"<!DOCTYPE html><html><body><p>Status: transition: done</p></body></html>"#,
        r#"<!DOCTYPE html><html><body><p>display:grid is great for layout</p></body></html>"#,
        r#"<!DOCTYPE html><html><body><p>We use @keyframes in our animations doc</p></body></html>"#,
        r#"<!DOCTYPE html><html><body><pre>.x { animation: spin 1s; }</pre></body></html>"#,
    ];
    for html in cases {
        assert!(
            validate(html).is_ok(),
            "denied keyword in body text must pass the gate: {html}"
        );
    }
}

#[test]
fn denied_keyword_in_attribute_value_passes_the_gate() {
    let html = r#"<!DOCTYPE html><html><body>
        <img src="x" alt="display:grid example" />
        <p title="transition: all 1s">hover me</p>
    </body></html>"#;
    assert!(
        validate(html).is_ok(),
        "denied keyword in an attribute value must pass the gate"
    );
}

#[test]
fn denied_keyword_inside_style_element_is_rejected() {
    let html = r#"<!DOCTYPE html><html><head><style>
        .x { transition: all 0.2s ease; }
    </style></head><body><p>hi</p></body></html>"#;
    let err = validate(html).expect_err("transition in <style> must be rejected");
    match err {
        VelloraError::Unsupported(d) => assert_eq!(d.feature, "css:transition"),
        other => panic!("expected css:transition, got {other:?}"),
    }
}

#[test]
fn denied_keyword_inside_style_attribute_is_rejected() {
    let html = r#"<!DOCTYPE html><html><body>
        <div style="transform: rotate(10deg)">x</div>
    </body></html>"#;
    let err = validate(html).expect_err("transform in style= must be rejected");
    match err {
        VelloraError::Unsupported(d) => assert_eq!(d.feature, "css:transform"),
        other => panic!("expected css:transform, got {other:?}"),
    }
}

#[test]
fn grid_with_whitespace_or_comments_around_colon_is_rejected() {
    // RUST-5 bypass class: `display : grid` and `display:/*x*/grid` are the same
    // violation as `display:grid` and must not slip through.
    let spaced = r#"<!DOCTYPE html><html><head><style>
        .x { display : grid }
    </style></head><body><p>hi</p></body></html>"#;
    let commented = r#"<!DOCTYPE html><html><head><style>
        .y { display:/*c*/grid }
    </style></head><body><p>hi</p></body></html>"#;
    for html in [spaced, commented] {
        let err = validate(html).expect_err("grid variant must be rejected");
        match err {
            VelloraError::Unsupported(d) => assert_eq!(d.feature, "css:grid"),
            other => panic!("expected css:grid, got {other:?}"),
        }
    }
}

// F11: a denied tag reparented by html5ever (e.g. <input> fostered out of
// <table> context) must not be mislocated. When the source/DOM tag counts
// diverge, the locator degrades to None rather than pointing at the wrong tag.

#[test]
fn reparented_denied_tag_is_located_correctly_or_none_never_wrong() {
    // <input> inside a <table> is foster-parented before the table by html5ever,
    // so the DOM document-order ordinal need not match the source `<input` order.
    // The first denied element is still reported as element:input; its location
    // must either point at a real <input> line or be None — never a wrong line.
    let html = "<!DOCTYPE html><html><body>\n\
        <input id=\"a\">\n\
        <table><input id=\"b\"></table>\n\
        </body></html>";
    let err = validate(html).expect_err("input is denied");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "element:input");
            // Either an honest None, or a line that actually contains an <input>.
            if let Some(line) = d.line {
                let src_line = html.lines().nth((line as usize) - 1).unwrap_or("");
                assert!(
                    src_line.contains("<input"),
                    "reported line {line} ({src_line:?}) must contain an <input>, not a wrong sibling"
                );
            }
        }
        other => panic!("expected element:input, got {other:?}"),
    }
}

#[test]
fn carriage_return_after_tag_name_is_a_boundary() {
    // EDGE-2: `<input\r>` is legal HTML (CR is whitespace) and html5ever parses it
    // as the element, but the source `<tag` boundary set omitted `\r`, so the
    // source count (0) diverged from dom_total (1) and the F11 guard degraded the
    // diagnostic to None. With `\r` in the boundary set the location is recovered.
    let html = "<!DOCTYPE html><html><body><input\r></body></html>";
    let err = validate(html).expect_err("input is denied");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "element:input");
            assert!(
                d.line.is_some() && d.col.is_some(),
                "a CR-terminated tag name must still be locatable, got line={:?} col={:?}",
                d.line,
                d.col
            );
        }
        other => panic!("expected element:input, got {other:?}"),
    }
}

#[test]
fn genuine_source_dom_count_divergence_degrades_location_to_none() {
    // TQ-NEW-4 / INV-2 / RUST-REV-2: the F11 guard's whole purpose is the
    // count-mismatch -> None branch, which the reparented_... test above NEVER
    // exercises (foster-parenting moves <input> but keeps the count equal). Here
    // two source `<form` boundaries collapse to ONE DOM <form> (html5ever ignores
    // the nested <form> start tag), so offsets.len()=2 != dom_total=1, the guard
    // fires, and the location must degrade to None — never a wrong line.
    let html = "<!DOCTYPE html><html><body>\n\
        <form><form>x</form></form>\n\
        </body></html>";
    let err = validate(html).expect_err("form is denied");
    match err {
        VelloraError::Unsupported(d) => {
            assert_eq!(d.feature, "element:form");
            assert!(
                d.line.is_none() && d.col.is_none(),
                "genuine count divergence must degrade to None, got line={:?} col={:?}",
                d.line,
                d.col
            );
        }
        other => panic!("expected element:form, got {other:?}"),
    }
}

#[test]
fn denied_tag_mentioned_in_comment_or_attribute_is_still_located() {
    // EH-1 / INV-1: a denied tag literal inside an HTML comment or an attribute
    // value must NOT add a phantom `<tag` boundary that defeats the F11 guard. The
    // real denied element stays locatable — the reported line must contain a REAL
    // `<input>`, never the commented/attribute mention.
    let cases = [
        // Multi-line comment mention + real <input>: the real one is on line 3.
        (
            "<!DOCTYPE html><html><body>\n\
             <!-- <input id=\"x\"> -->\n\
             <input id=\"real\">\n\
             </body></html>",
            3u32,
        ),
        // Attribute-value mention + real <input>: the real one is on line 3.
        (
            "<!DOCTYPE html><html><body>\n\
             <div title=\"use <input> here\">x</div>\n\
             <input id=\"real\">\n\
             </body></html>",
            3u32,
        ),
        // Single-line inline comment mention immediately before the real <input>.
        ("<body><!-- <input x --><input></body>", 1u32),
    ];
    for (html, expected_line) in cases {
        let err = validate(html).expect_err("input is denied");
        match err {
            VelloraError::Unsupported(d) => {
                assert_eq!(d.feature, "element:input");
                let line = d.line.unwrap_or_else(|| {
                    panic!(
                        "comment/attr mention must NOT degrade a locatable input to None: {html}"
                    )
                });
                assert_eq!(line, expected_line, "wrong line for {html}");
                let src_line = html.lines().nth((line as usize) - 1).unwrap_or("");
                assert!(
                    src_line.contains("<input"),
                    "located line {line} ({src_line:?}) must contain a real <input>"
                );
            }
            other => panic!("expected element:input, got {other:?}"),
        }
    }
}

// ROB-6: a denied keyword inside a quoted CSS value/comment is NOT a real
// declaration — string interiors must be blanked before the property scan.

#[test]
fn denied_keyword_inside_quoted_css_value_passes_the_gate() {
    let cases = [
        // The word "animation" lives inside a content string, not a declaration.
        r#"<!DOCTYPE html><html><head><style>
            .x::before { content: "see animation: details"; }
        </style></head><body><p>hi</p></body></html>"#,
        // "filter" preceded by an in-string space (not a quote) — the realistic
        // false-positive the boundary-set tweak alone would NOT fix.
        r#"<!DOCTYPE html><html><head><style>
            .y::before { content: "filter results"; }
        </style></head><body><p>hi</p></body></html>"#,
        // A denied at-rule token inside a quoted value.
        r#"<!DOCTYPE html><html><head><style>
            .z::before { content: "@keyframes are cool"; }
        </style></head><body><p>hi</p></body></html>"#,
    ];
    for html in cases {
        assert!(
            validate(html).is_ok(),
            "denied keyword inside a quoted CSS value must pass the gate: {html}"
        );
    }
}

#[test]
fn unterminated_css_string_does_not_blank_a_later_denied_declaration() {
    // EH-2 / SEC-BYPASS-1 / RUST-DIFF-1: an unterminated/newline-spanning CSS
    // string must NOT swallow declarations that follow it. Per CSS, a string is a
    // bad-string at an unescaped newline (and `}` ends the block), so a denied
    // declaration after such a terminator is REAL and the gate must still reject
    // it. Pre-fix the blanker consumed to the next quote/EOF, erasing these.
    let cases = [
        // (a) unterminated `"` then `animation:` on a LATER line.
        (
            "<!DOCTYPE html><html><head><style>\n\
             .x::before { content: \"oops\n\
             animation: spin 1s; }\n\
             </style></head><body><p>hi</p></body></html>",
            "css:animation",
        ),
        // (a') unterminated `"` then display:grid on a later line.
        (
            "<!DOCTYPE html><html><head><style>\n\
             .x::before { content: \"oops\n\
             display: grid; }\n\
             </style></head><body><p>hi</p></body></html>",
            "css:grid",
        ),
        // (b) unterminated `'` then display:grid on a later line.
        (
            "<!DOCTYPE html><html><head><style>\n\
             .x::before { content: 'oops\n\
             display: grid; }\n\
             </style></head><body><p>hi</p></body></html>",
            "css:grid",
        ),
        // (c) single-line unterminated `\"` then `}` then a denied decl.
        (
            "<!DOCTYPE html><html><head><style>\
             .x::before{content:\"oops} .y{animation:spin 1s}\
             </style></head><body><p>hi</p></body></html>",
            "css:animation",
        ),
        // (c') single-line unterminated `'` then `}` then display:grid.
        (
            "<!DOCTYPE html><html><head><style>\
             .x::before{content:'oops} .y{display:grid}\
             </style></head><body><p>hi</p></body></html>",
            "css:grid",
        ),
    ];
    for (html, expected) in cases {
        let err = validate(html).expect_err(&format!(
            "denied decl after unterminated string must be rejected: {html}"
        ));
        match err {
            VelloraError::Unsupported(d) => {
                assert_eq!(d.feature, expected, "expected {expected} for input: {html}")
            }
            other => panic!("expected Unsupported({expected}), got {other:?} for {html}"),
        }
    }
}

#[test]
fn escaped_final_quote_then_denied_declaration_is_rejected() {
    // EDGE-4: `content:"abc\"` ends with an ESCAPED quote, so the string is
    // unterminated. The blanker must not consume the rest of the stylesheet — a
    // genuine denied declaration after it (no newline/`}` separator) must still be
    // scanned and rejected (fail-closed).
    let cases = [
        (
            "<!DOCTYPE html><html><head><style>\
             .x::before{content:\"abc\\\";animation:spin\
             </style></head><body><p>hi</p></body></html>",
            "css:animation",
        ),
        (
            "<!DOCTYPE html><html><head><style>\
             .x::before{content:\"abc\\\";display:grid\
             </style></head><body><p>hi</p></body></html>",
            "css:grid",
        ),
    ];
    for (html, expected) in cases {
        let err = validate(html).expect_err(&format!(
            "denied decl after an escaped-final-quote string must be rejected: {html}"
        ));
        match err {
            VelloraError::Unsupported(d) => {
                assert_eq!(d.feature, expected, "expected {expected} for: {html}")
            }
            other => panic!("expected Unsupported({expected}), got {other:?}"),
        }
    }
}

#[test]
fn escaped_newline_line_continuation_inside_css_string_stays_blanked() {
    // The bad-string newline terminator must NOT fire for an ESCAPED newline
    // (`\<newline>` line continuation): the string is still a single value, so a
    // denied keyword inside it must remain blanked (no false rejection).
    let html = "<!DOCTYPE html><html><head><style>\n\
        .x::before { content: \"see animation: \\\n\
        details\"; }\n\
        </style></head><body><p>hi</p></body></html>";
    assert!(
        validate(html).is_ok(),
        "escaped line-continuation keeps the string blanked: {html}"
    );
}

#[test]
fn real_declaration_after_a_quoted_value_is_still_rejected() {
    // A genuine `animation:` declaration outside any string must still fail, even
    // when an earlier string holds the same word.
    let html = r#"<!DOCTYPE html><html><head><style>
        .x::before { content: "no animation here"; }
        .x { animation: spin 1s; }
    </style></head><body><p>hi</p></body></html>"#;
    let err = validate(html).expect_err("real animation declaration must be rejected");
    match err {
        VelloraError::Unsupported(d) => assert_eq!(d.feature, "css:animation"),
        other => panic!("expected css:animation, got {other:?}"),
    }
}

// F5 / R6: the @page reader must scan only <style> CSS, not body text/attrs.

#[test]
fn at_page_in_body_text_does_not_hijack_the_page_box() {
    use vellora_core::page_css;
    // A literal @page rule in PROSE must be ignored: the page box stays A4.
    let html = r#"<!DOCTYPE html><html><body>
        <p>To print, add: @page { size: letter; margin: 0 }</p>
    </body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert!(
        (pb.width - 793.7).abs() < 1.0,
        "stays A4 width, got {}",
        pb.width
    );
}

#[test]
fn at_page_in_style_still_applies_with_body_text_decoy() {
    use vellora_core::page_css;
    // A real @page in <style> must apply even when a decoy @page sits in prose.
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: 400px 600px; margin: 10px }
    </style></head><body>
        <p>docs mention @page { size: letter }</p>
    </body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert_eq!(pb.width, 400.0, "real @page from <style> applies");
    assert_eq!(pb.height, 600.0);
}

#[test]
fn unbalanced_decoy_at_page_does_not_discard_a_later_valid_rule() {
    use vellora_core::page_css;
    // An earlier @page with an unbalanced brace must not swallow the rest and
    // silently fall back to A4 — the later well-formed rule still applies (F5).
    let html = r#"<!DOCTYPE html><html><head><style>
        @page { size: 400px 600px; margin: 10px }
    </style></head><body><p>x</p></body></html>"#;
    let pb = page_css::parse_page_box(html);
    assert_eq!(pb.width, 400.0);
}
