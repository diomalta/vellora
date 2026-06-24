/**
 * `img-dimension-attrs` codemod: move presentational `width`/`height` HTML attributes on `<img>`
 * into equivalent CSS, preserving any existing inline `style`, and remove the original attributes.
 * Unitless numeric values are treated as pixels. Idempotent — `detect` matches only the *attributes*,
 * and the produced CSS is never re-matched.
 */
import { type Element, getAttr, removeAttr, setAttr, tagName, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";
import { parseStyle, serializeStyle, toCssLength } from "../style.js";

const DIMENSION_ATTRS = ["width", "height"] as const;

const SUGGESTED_FIX =
  'Move the width/height HTML attributes into CSS (e.g. style="width:120px;height:80px"). Presentational image dimensions belong in the stylesheet, not as attributes.';

function hasDimensionAttr(img: Element): boolean {
  return DIMENSION_ATTRS.some((name) => getAttr(img, name) !== null);
}

export const imgDimensionAttrsRule: Rule = {
  id: "img-dimension-attrs",
  severity: "warning",
  autoFixable: true,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      if (tagName(element) === "img" && hasDimensionAttr(element)) {
        detections.push({ element, suggestedFix: SUGGESTED_FIX });
      }
    });
    return detections;
  },
  apply(img): void {
    const declarations = parseStyle(getAttr(img, "style") ?? "");
    for (const name of DIMENSION_ATTRS) {
      const value = getAttr(img, name);
      if (value === null) {
        continue;
      }
      removeAttr(img, name);
      const cssValue = toCssLength(value);
      const existing = declarations.find((d) => d.property === name);
      if (existing) {
        existing.value = cssValue;
      } else {
        declarations.push({ property: name, value: cssValue });
      }
    }
    if (declarations.length > 0) {
      setAttr(img, "style", serializeStyle(declarations));
    }
  },
};
