/**
 * `css-animation` diagnostic: `@keyframes` and the `animation` property are dynamic CSS outside the
 * static PDF subset (nothing animates in a print document). There is no deterministic codemod — we
 * cannot guess the intended static appearance — so this is reported with `autoFixable: false` and
 * never rewritten. The finding is anchored to the offending `<style>` element for a stable location.
 */
import { type Element, startLocation, tagName, textValue, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";

/** `@keyframes ...` or an `animation`/`animation-*` declaration anywhere in the stylesheet text. */
const ANIMATION_PATTERN = /@keyframes\b|(^|[;{\s])animation(-[a-z-]+)?\s*:/m;

/** Drop HTML-comment spans so a `@keyframes` mentioned in a comment is not flagged as real CSS. */
function stripComments(css: string): string {
  return css.replace(/<!--[\s\S]*?-->/g, "");
}

function styleText(element: Element): string {
  let text = "";
  for (const child of element.childNodes) {
    text += textValue(child);
  }
  return text;
}

const SUGGESTED_FIX =
  "Remove @keyframes and the animation property. Animation has no meaning in a static PDF; use a static style for the printed state. There is no automatic fix.";

export const cssAnimationRule: Rule = {
  id: "css-animation",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      if (tagName(element) !== "style") {
        return;
      }
      if (ANIMATION_PATTERN.test(stripComments(styleText(element)))) {
        detections.push({
          element,
          location: startLocation(element),
          snippet: "@keyframes / animation",
          suggestedFix: SUGGESTED_FIX,
        });
      }
    });
    return detections;
  },
};
