/**
 * `external-stylesheet` diagnostic: vellora never loads anything from outside the document, so a
 * `<link rel="stylesheet">` or an `@import` rule would render with its CSS missing. The strict core
 * gate rejects both as `css:external-stylesheet` (issue #59). There is no deterministic codemod —
 * lint reads only the HTML and never fetches the sheet — so this is reported with
 * `autoFixable: false`: inline the CSS in a `<style>` tag. A `<link>` finding is anchored to the
 * `<link>`; an `@import` finding to the `<style>` element that holds it.
 */
import { type Element, getAttr, startLocation, tagName, textValue, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";

/** An `@import` at-rule: where an at-rule can start, and as the whole at-rule name. */
const IMPORT_RULE = /(?:^|[\s{};])@import(?![\w\\-]|\P{ASCII})/iu;

/** Blank CSS comments and quoted strings so an `@import` inside them is not a rule. */
function stripCommentsAndStrings(css: string): string {
  return css
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
}

function styleText(element: Element): string {
  let text = "";
  for (const child of element.childNodes) {
    text += textValue(child);
  }
  return text;
}

/** `rel` is a set of space-separated, ASCII case-insensitive tokens (HTML §4.6.7). */
function isStylesheetLink(element: Element): boolean {
  const rel = getAttr(element, "rel");
  return (rel ?? "").split(/[\t\n\f\r ]+/).some((t) => t.toLowerCase() === "stylesheet");
}

const SUGGESTED_FIX =
  "Inline the CSS in a <style> tag. vellora never loads external style sheets (no network, no filesystem), so this CSS would not be applied; the strict render gate rejects it. There is no automatic fix.";

export const externalStylesheetRule: Rule = {
  id: "external-stylesheet",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      const tag = tagName(element);
      if (tag === "link" && isStylesheetLink(element)) {
        detections.push({ element, suggestedFix: SUGGESTED_FIX });
      } else if (tag === "style" && IMPORT_RULE.test(stripCommentsAndStrings(styleText(element)))) {
        detections.push({
          element,
          location: startLocation(element),
          snippet: "@import",
          suggestedFix: SUGGESTED_FIX,
        });
      }
    });
    return detections;
  },
};
