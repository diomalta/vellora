/**
 * A tiny, deterministic inline-`style` parser/serializer. Order-preserving so codemod output is
 * byte-stable: declarations keep source order, and appended declarations land at the end. Property
 * names are lower-cased for matching; values are trimmed. This is not a full CSS parser — it only
 * needs to read/edit the `display`, `width`, and `height` declarations the codemods touch.
 */

export interface Declaration {
  property: string;
  value: string;
}

/** Parse an inline `style` value into ordered declarations, dropping empty/malformed segments. */
export function parseStyle(style: string): Declaration[] {
  const declarations: Declaration[] = [];
  for (const segment of style.split(";")) {
    const trimmed = segment.trim();
    if (trimmed === "") {
      continue;
    }
    const colon = trimmed.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const property = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    if (property === "" || value === "") {
      continue;
    }
    declarations.push({ property, value });
  }
  return declarations;
}

/** Serialize declarations back into a canonical `prop:value;prop:value` string (no trailing space). */
export function serializeStyle(declarations: Declaration[]): string {
  return declarations.map((d) => `${d.property}:${d.value}`).join(";");
}

/** Treat a unitless numeric dimension as pixels; pass through values that already carry a unit. */
export function toCssLength(value: string): string {
  const trimmed = value.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

/**
 * A `style` value is malformed when it contains a non-empty segment that has no `:` separator (a
 * bare token like `display flex`) — a declaration that the browser/engine would silently drop. Empty
 * segments (trailing `;`) are tolerated, not malformed.
 */
export function hasMalformedStyle(style: string): boolean {
  for (const segment of style.split(";")) {
    const trimmed = segment.trim();
    if (trimmed === "") {
      continue;
    }
    const colon = trimmed.indexOf(":");
    if (colon === -1) {
      return true;
    }
    const property = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    if (property === "" || value === "") {
      return true;
    }
  }
  return false;
}
