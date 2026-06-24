/**
 * `script-element` diagnostic: an inline `<script>` has no meaning in a static PDF and is rejected by
 * the strict gate. There is no deterministic codemod (we cannot infer the author's intent), so this
 * is reported with `autoFixable: false` and never rewritten.
 */
import { tagName, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";

const SUGGESTED_FIX =
  "Remove the <script> element. JavaScript does not execute in a static PDF; the strict render gate rejects it. There is no automatic fix.";

export const scriptElementRule: Rule = {
  id: "script-element",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      if (tagName(element) === "script") {
        detections.push({ element, suggestedFix: SUGGESTED_FIX });
      }
    });
    return detections;
  },
};
