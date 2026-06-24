/**
 * `invalid-markup` rule: detect and repair mis-nested tags and malformed `style=` attributes.
 *
 * Mis-nesting is repaired implicitly — `fix()` re-serializes parse5's normalized tree, which the
 * HTML5 tree-construction (adoption-agency) algorithm has already re-nested correctly. Malformed
 * `style=` is repaired explicitly in `apply` by re-parsing the attribute (which drops the invalid
 * declarations) and re-serializing the surviving ones. Both paths are idempotent: a well-formed tree
 * re-serializes unchanged, and a cleaned `style` re-parses to itself.
 *
 * Mis-nesting note: parse5 v8 silently repairs the adoption-agency case (`<b><i>x</b></i>`) WITHOUT
 * an `onParseError` callback, so we detect it structurally: a formatting element that sits in the
 * source (has a start-tag location) but lost its end-tag location because an enclosing formatting
 * element was closed first. Malformed `style=` is detected on the parsed attribute.
 */
import { type Element, getAttr, removeAttr, setAttr, tagName, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";
import { hasMalformedStyle, parseStyle, serializeStyle } from "../style.js";

/** Inline formatting elements subject to the HTML5 adoption-agency algorithm. */
const FORMATTING_ELEMENTS = new Set([
  "a",
  "b",
  "big",
  "code",
  "em",
  "font",
  "i",
  "nobr",
  "s",
  "small",
  "strike",
  "strong",
  "tt",
  "u",
]);

/**
 * A mis-nested formatting element: present in source (`startTag` location) but missing its own
 * `endTag` location while nested directly inside another source-present formatting element. This is
 * exactly the footprint adoption-agency repair leaves on `<b><i>x</b></i>`.
 */
function isMisNested(element: Element, parent: Element | null): boolean {
  if (!FORMATTING_ELEMENTS.has(tagName(element))) {
    return false;
  }
  const loc = element.sourceCodeLocation;
  if (!loc || !loc.startTag || loc.endTag) {
    return false;
  }
  if (!parent || !FORMATTING_ELEMENTS.has(tagName(parent))) {
    return false;
  }
  const parentLoc = parent.sourceCodeLocation;
  return Boolean(parentLoc?.startTag);
}

const MISNEST_FIX =
  "Close inline tags in the order they were opened. The HTML5 parser normalizes mis-nested tags; the fix re-serializes the well-formed tree.";

const STYLE_FIX =
  "Repair the malformed style attribute: every declaration needs a property:value pair. Invalid declarations are dropped.";

export const invalidMarkupRule: Rule = {
  id: "invalid-markup",
  severity: "warning",
  autoFixable: true,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element, parent) => {
      if (isMisNested(element, parent)) {
        detections.push({ element, suggestedFix: MISNEST_FIX });
        return;
      }
      const style = getAttr(element, "style");
      if (style !== null && hasMalformedStyle(style)) {
        detections.push({ element, suggestedFix: STYLE_FIX });
      }
    });
    return detections;
  },
  apply(element): void {
    // Only the malformed-`style` case needs an explicit rewrite; mis-nesting is repaired by parse5
    // re-serialization. Re-parsing the style drops invalid declarations and keeps the valid ones.
    const style = getAttr(element, "style");
    if (style === null || !hasMalformedStyle(style)) {
      return;
    }
    const declarations = parseStyle(style);
    if (declarations.length > 0) {
      setAttr(element, "style", serializeStyle(declarations));
    } else {
      removeAttr(element, "style");
    }
  },
};
