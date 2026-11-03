/**
 * `page-margin-box` diagnostic: the native renderer draws only the `@top-center` and
 * `@bottom-center` `@page` margin boxes. The other fourteen (`@bottom-right`, `@top-left-corner`,
 * `@left-middle`, …) are rejected by the strict core gate as `css:page-margin-box`. There is no
 * deterministic codemod — moving content between boxes changes the layout the author chose — so this
 * is reported with `autoFixable: false`. The finding is anchored to the offending `<style>` element.
 */
import { type Element, startLocation, tagName, textValue, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";

/** An undrawn margin-box at-rule name, e.g. `@bottom-right` or `@top-left-corner`. */
const UNDRAWN_MARGIN_BOX =
  /(?:^|[\s{};])@(?:(?:top|bottom)-(?:left|right)(?:-corner)?|(?:left|right)-(?:top|middle|bottom))(?![a-z-])/i;

/** Blank CSS comments and quoted strings so a margin-box name inside them is not a rule. */
function stripCommentsAndStrings(css: string): string {
  return css
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
}

function styleText(element: Element): string {
  let text = "";
  for (const child of element.childNodes) {
    text += textValue(child);
  }
  return text;
}

const SUGGESTED_FIX =
  'Move the content into @top-center or @bottom-center (the only margin boxes the native renderer draws), or route this template to engine: "chromium". There is no automatic fix.';

export const pageMarginBoxRule: Rule = {
  id: "page-margin-box",
  severity: "error",
  autoFixable: false,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      if (tagName(element) !== "style") {
        return;
      }
      const match = UNDRAWN_MARGIN_BOX.exec(stripCommentsAndStrings(styleText(element)));
      if (match) {
        detections.push({
          element,
          location: startLocation(element),
          snippet: match[0].trim().replace(/^[{};]/, ""),
          suggestedFix: SUGGESTED_FIX,
          feature: "css:page-margin-box",
        });
      }
    });
    return detections;
  },
};
