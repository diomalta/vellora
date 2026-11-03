/**
 * A TypeScript mirror of the strict core gate's denylists and CSS scan
 * (`crates/vellora-core/src/validation.rs`). The gate rejects these constructs at render time; lint
 * reports them ahead of time with the SAME `feature` taxonomy (`element:<tag>`, `css:<feature>`), so
 * `vellora lint` never calls a template conformant that `renderPdf` (strict) rejects (issue #60).
 *
 * The lists are copied, not generated: `test/core-gate-sync.test.ts` reads `validation.rs` and fails
 * when a list here and its Rust counterpart differ, or when the gate gains a feature lint does not
 * report. The scan follows the gate's matching rules exactly (property boundary, comment/string
 * blanking, `display` + `grid` with any whitespace) so lint does not flag what the gate accepts:
 * best-effort mode (`strict: false`) surfaces an error-severity finding as a render error.
 */

/** `DENIED_ELEMENTS`: HTML elements outside the document subset (matched by local name). */
export const DENIED_ELEMENTS: readonly string[] = [
  "script",
  "canvas",
  "video",
  "audio",
  "iframe",
  "object",
  "embed",
  "applet",
  "input",
  "button",
  "select",
  "textarea",
  "form",
  "marquee",
  "blink",
  "noscript",
];

/** `DENIED_CSS_PROPERTIES`: `[property, feature]`, matched only at a property boundary. */
export const DENIED_CSS_PROPERTIES: readonly (readonly [string, string])[] = [
  ["animation", "css:animation"],
  ["transform", "css:transform"],
  ["transition", "css:transition"],
  ["filter", "css:filter"],
  ["backdrop-filter", "css:backdrop-filter"],
  ["perspective", "css:3d-transform"],
];

/** `DENIED_CSS_TOKENS`: `[token, feature]`, matched as plain substrings. */
export const DENIED_CSS_TOKENS: readonly (readonly [string, string])[] = [
  ["@keyframes", "css:keyframes"],
  ["display:grid", "css:grid"],
  ["display: grid", "css:grid"],
];

/** A denied CSS construct found in one CSS region: its feature and offset in the region text. */
export interface CssHit {
  feature: string;
  /** UTF-16 offset of the match in the region text. */
  index: number;
}

/**
 * Every denied CSS feature in one CSS region (a `<style>` body or a `style` attribute value), at
 * most one hit per feature (its first match, as the gate takes the first per region), ordered by
 * offset. `@page` margin boxes are reported by the `page-margin-box` rule, not here.
 */
export function scanCss(css: string): CssHit[] {
  const lower = asciiLower(stripCommentsAndStrings(css));
  const hits = new Map<string, number>();
  const consider = (feature: string, index: number): void => {
    const previous = hits.get(feature);
    if (previous === undefined || index < previous) {
      hits.set(feature, index);
    }
  };

  for (const [prop, feature] of DENIED_CSS_PROPERTIES) {
    const index = findProperty(lower, prop);
    if (index !== -1) {
      consider(feature, index);
    }
  }
  for (const [token, feature] of DENIED_CSS_TOKENS) {
    const index = lower.indexOf(token);
    if (index !== -1) {
      consider(feature, index);
    }
  }
  const grid = findDisplayGrid(lower);
  if (grid !== -1) {
    consider("css:grid", grid);
  }

  return [...hits]
    .map(([feature, index]) => ({ feature, index }))
    .sort((a, b) => a.index - b.index || (a.feature < b.feature ? -1 : 1));
}

/** ASCII-only lower-casing (the gate's `to_ascii_lowercase`), so offsets never shift. */
function asciiLower(text: string): string {
  return text.replace(/[A-Z]/g, (c) => c.toLowerCase());
}

const isPropBoundaryBefore = (c: string | undefined): boolean =>
  c === undefined ||
  c === "{" ||
  c === ";" ||
  c === " " ||
  c === "\t" ||
  c === "\n" ||
  c === "\r" ||
  c === '"' ||
  c === "'";

const isPropBoundaryAfter = (c: string | undefined): boolean =>
  c === ":" || c === " " || c === "\t" || c === "\n";

/** First occurrence of `prop` at a property boundary (`text-transform` is not `transform`). */
function findProperty(lower: string, prop: string): number {
  let start = 0;
  for (let index = lower.indexOf(prop, start); index !== -1; index = lower.indexOf(prop, start)) {
    const before = index === 0 ? undefined : lower[index - 1];
    if (isPropBoundaryBefore(before) && isPropBoundaryAfter(lower[index + prop.length])) {
      return index;
    }
    start = index + prop.length;
  }
  return -1;
}

const isSpace = (c: string | undefined): boolean =>
  c === " " || c === "\t" || c === "\n" || c === "\r";

/** A `display` declaration whose value is `grid`, with any whitespace around the colon. */
function findDisplayGrid(lower: string): number {
  const keyword = "display";
  let start = 0;
  for (
    let index = lower.indexOf(keyword, start);
    index !== -1;
    index = lower.indexOf(keyword, start)
  ) {
    const before = index === 0 ? undefined : lower[index - 1];
    const boundaryBefore =
      before === undefined || before === "{" || before === ";" || isSpace(before);
    let k = index + keyword.length;
    while (k < lower.length && isSpace(lower[k])) {
      k++;
    }
    if (boundaryBefore && lower[k] === ":") {
      k++;
      while (k < lower.length && isSpace(lower[k])) {
        k++;
      }
      if (lower.startsWith("grid", k)) {
        const after = lower[k + 4];
        if (after === undefined || after === ";" || after === "}" || isSpace(after)) {
          return index;
        }
      }
    }
    start = index + keyword.length;
  }
  return -1;
}

/**
 * Blank `/* … *\/` comments and quoted-string interiors with spaces, preserving offsets: a denied
 * word inside a value (`content: "filter results"`) is not a declaration, while
 * `display:/*x*\/grid` is still found. Fails closed like the gate: a string with no close quote, no
 * newline and no `}` before the end of the region is left literal, so a declaration after it is
 * still scanned. Linear: a quote kind known to be unterminated from an offset is not re-scanned.
 */
export function stripCommentsAndStrings(css: string): string {
  let out = "";
  let i = 0;
  const unterminatedFrom = { '"': Number.POSITIVE_INFINITY, "'": Number.POSITIVE_INFINITY };
  while (i < css.length) {
    const c = css[i] as string;
    if (c === "/" && css[i + 1] === "*") {
      const close = css.indexOf("*/", i + 2);
      const end = close === -1 ? css.length : close + 2;
      out += " ".repeat(end - i);
      i = end;
    } else if (c === '"' || c === "'") {
      if (i >= unterminatedFrom[c]) {
        out += c;
        i++;
        continue;
      }
      let j = i + 1;
      let blanked = "";
      let closed = false;
      let badString = false;
      while (j < css.length) {
        const d = css[j];
        if (d === c) {
          closed = true;
          break;
        }
        if (d === "\n" || d === "\r" || d === "\f" || d === "}") {
          badString = true;
          break;
        }
        if (d === "\\" && j + 1 < css.length) {
          blanked += " ";
          j++;
        }
        blanked += " ";
        j++;
      }
      if (closed || badString) {
        out += c + blanked;
        if (closed) {
          out += c;
          j++;
        }
        i = j;
      } else {
        unterminatedFrom[c] = i + 1;
        out += c;
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}
