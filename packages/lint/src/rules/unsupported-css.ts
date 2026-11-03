/**
 * `unsupported-css` diagnostic: a CSS feature the strict gate rejects that has no rule of its own —
 * `transform`, `transition`, `filter`, `backdrop-filter`, `perspective` (`css:3d-transform`) and
 * `display: grid` (`css:grid`). Scanned in `<style>` bodies and `style` attributes with the gate's
 * own matching (`gate.ts`), so `text-transform` or a word inside a string value is not flagged.
 * Animation (`css-animation`), `@page` margin boxes (`page-margin-box`) and `display: grid` on a
 * `<td>` that `flex-grid-in-td` rewrites are left to those rules. One finding per CSS region and
 * feature, located at the match. There is no deterministic codemod: `autoFixable: false`.
 */
import { cssRegions } from "../css-regions.js";
import type { Detection, Rule } from "../engine.js";
import { scanCss } from "../gate.js";
import { isFlexGridTd } from "./flex-grid-in-td.js";

/** Features reported by other rules. */
const OWNED_ELSEWHERE: ReadonlySet<string> = new Set(["css:animation", "css:keyframes"]);

const SUGGESTED_FIX: Record<string, string> = {
  "css:transform":
    'Remove the transform property (rotate/scale/translate). Position and size the box with margins, padding and widths instead, or route this template to engine: "chromium".',
  "css:transition":
    "Remove the transition property. Nothing changes state in a static PDF, so it has no effect.",
  "css:filter":
    'Remove the filter property. Apply the effect to the image asset itself (e.g. export a greyscale PNG), or route this template to engine: "chromium".',
  "css:backdrop-filter":
    "Remove the backdrop-filter property. Use a solid or semi-transparent background color instead.",
  "css:3d-transform": "Remove the perspective property. 3D transforms are not rendered.",
  "css:grid":
    "Replace display: grid with a <table> (rows and cells) or block layout. Grid layout is outside vellora's static subset; `vellora fix` only rewrites display:grid on a <td>.",
};

/** The matched declaration, up to its end (`;`, `{`, `}`, newline), for the finding's snippet. */
function snippetAt(text: string, index: number): string {
  const rest = text.slice(index);
  const end = rest.search(/[;{}\n]/);
  return (end === -1 ? rest : rest.slice(0, end)).trim().slice(0, 120);
}

export const unsupportedCssRule: Rule = {
  id: "unsupported-css",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    for (const region of cssRegions(doc)) {
      const cellRewrite = region.kind === "style-attribute" && isFlexGridTd(region.element);
      for (const hit of scanCss(region.text)) {
        if (OWNED_ELSEWHERE.has(hit.feature) || (hit.feature === "css:grid" && cellRewrite)) {
          continue;
        }
        detections.push({
          element: region.element,
          location: region.locate(hit.index),
          snippet: snippetAt(region.text, hit.index),
          suggestedFix: `${SUGGESTED_FIX[hit.feature] ?? "Remove this CSS feature."} The strict render rejects it as ${hit.feature}. There is no automatic fix.`,
          feature: hit.feature,
        });
      }
    }
    return detections;
  },
};
