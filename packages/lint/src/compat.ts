/**
 * Stable rule → compatibility-table link map. `@vellora/lint` does not own the compatibility table
 * (that lives elsewhere, per the design's non-goals); it only links into it. Every rule has exactly
 * one non-empty, stable anchor so two findings with the same rule always carry the same `compatLink`.
 */
import type { RuleId } from "./types.js";

const COMPAT_BASE = "https://vellora.dev/compat";

export const COMPAT_LINKS: Record<RuleId, string> = {
  "inline-svg": `${COMPAT_BASE}#inline-svg`,
  "flex-grid-in-td": `${COMPAT_BASE}#flex-grid-in-td`,
  "img-dimension-attrs": `${COMPAT_BASE}#img-dimension-attrs`,
  "invalid-markup": `${COMPAT_BASE}#invalid-markup`,
  "script-element": `${COMPAT_BASE}#script-element`,
  "css-animation": `${COMPAT_BASE}#css-animation`,
};

export function compatLink(rule: RuleId): string {
  return COMPAT_LINKS[rule];
}
