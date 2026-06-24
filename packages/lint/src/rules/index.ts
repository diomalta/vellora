/**
 * The ordered rule registry. `diagnose` and `fix` both iterate this single list so the two surfaces
 * agree on what is a violation. Order here only affects fix application order; report findings are
 * re-sorted by `(line, col, rule)` afterward.
 */
import type { Rule } from "../engine.js";
import { cssAnimationRule } from "./css-animation.js";
import { flexGridInTdRule } from "./flex-grid-in-td.js";
import { imgDimensionAttrsRule } from "./img-dimension-attrs.js";
import { inlineSvgRule } from "./inline-svg.js";
import { invalidMarkupRule } from "./invalid-markup.js";
import { scriptElementRule } from "./script-element.js";

export const RULES: Rule[] = [
  inlineSvgRule,
  flexGridInTdRule,
  imgDimensionAttrsRule,
  invalidMarkupRule,
  scriptElementRule,
  cssAnimationRule,
];
