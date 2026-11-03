/**
 * `css-animation` diagnostic: `@keyframes` and the `animation` property are dynamic CSS outside the
 * static PDF subset (nothing animates in a print document). The strict gate rejects them as
 * `css:keyframes` / `css:animation`; the finding carries the feature of the region's first match,
 * found with the gate's own scan (`gate.ts`) in `<style>` bodies and `style` attributes. One finding
 * per CSS region. There is no deterministic codemod — we cannot guess the intended static
 * appearance — so this is reported with `autoFixable: false` and never rewritten.
 */
import { cssRegions } from "../css-regions.js";
import type { Detection, Rule } from "../engine.js";
import { scanCss } from "../gate.js";

const ANIMATION_FEATURES: ReadonlySet<string> = new Set(["css:animation", "css:keyframes"]);

const SUGGESTED_FIX =
  "Remove @keyframes and the animation property. Animation has no meaning in a static PDF; use a static style for the printed state. There is no automatic fix.";

export const cssAnimationRule: Rule = {
  id: "css-animation",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    for (const region of cssRegions(doc)) {
      const hit = scanCss(region.text).find((h) => ANIMATION_FEATURES.has(h.feature));
      if (hit) {
        detections.push({
          element: region.element,
          location: region.locate(hit.index),
          snippet: "@keyframes / animation",
          suggestedFix: SUGGESTED_FIX,
          feature: hit.feature,
        });
      }
    }
    return detections;
  },
};
