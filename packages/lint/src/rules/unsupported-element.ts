/**
 * `unsupported-element` diagnostic: an element on the strict gate's `DENIED_ELEMENTS` list
 * (`<canvas>`, `<video>`, `<iframe>`, form controls, `<noscript>`, …). The gate matches the local
 * name in any namespace and rejects the render as `element:<tag>`; this finding carries the same
 * `feature`. `<script>` keeps its own `script-element` rule. There is no deterministic codemod —
 * the static replacement is the author's call — so this is `autoFixable: false`.
 */
import { tagName, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";
import { DENIED_ELEMENTS } from "../gate.js";

/** Denied elements this rule reports; `script` belongs to `script-element`. */
export const UNSUPPORTED_ELEMENTS: ReadonlySet<string> = new Set(
  DENIED_ELEMENTS.filter((tag) => tag !== "script"),
);

function suggestedFix(tag: string): string {
  return `Remove the <${tag}> element or replace it with static content (text, a table, or an <img>). It is outside vellora's static document subset and the strict render rejects it as element:${tag}. There is no automatic fix.`;
}

export const unsupportedElementRule: Rule = {
  id: "unsupported-element",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      const tag = tagName(element);
      if (UNSUPPORTED_ELEMENTS.has(tag)) {
        detections.push({ element, suggestedFix: suggestedFix(tag), feature: `element:${tag}` });
      }
    });
    return detections;
  },
};
