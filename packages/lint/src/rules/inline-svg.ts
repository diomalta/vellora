/**
 * `inline-svg` codemod: rasterize each inline `<svg>` to a PNG in-process via `@resvg/resvg-js` and
 * replace the `<svg>` element with an `<img>` carrying a `data:image/png;base64` URI. Idempotent by
 * construction — `detect` only matches `<svg>`, and the produced `<img>` is never re-matched.
 *
 * Determinism: resvg is pinned to `loadSystemFonts: false` and `fitTo: original`, with no time- or
 * locale-dependent inputs, so the PNG bytes are byte-stable across runs and platforms.
 */
import { Resvg } from "@resvg/resvg-js";
import { html } from "parse5";
import { type Element, getAttr, serializeElement, tagName, walkElements } from "../dom.js";
import type { Detection, Rule } from "../engine.js";
import { type Declaration, serializeStyle, toCssLength } from "../style.js";

const RESVG_OPTIONS = {
  font: { loadSystemFonts: false },
  fitTo: { mode: "original" as const },
};

const SVG_NS = 'xmlns="http://www.w3.org/2000/svg"';

/**
 * Since the native renderer paints inline SVG as PDF vector content (vellora-core `svg.rs`), this
 * rule is a `warning`, not a subset violation: the codemod stays available for templates that want
 * a raster `<img>` instead (it loses selectable SVG text and vector sharpness), and best-effort mode
 * still runs it. The core gate never emits `element:svg`.
 */
const SUGGESTED_FIX =
  "Optional: the native renderer draws inline <svg> as vector content. Rasterize it to a PNG <img> with a data: URI only if a raster image is wanted (SVG text is then no longer selectable).";

/** resvg requires a namespaced root; parse5 may serialize an inline `<svg>` without `xmlns`. */
function ensureSvgNamespace(svgMarkup: string): string {
  if (svgMarkup.includes("xmlns=")) {
    return svgMarkup;
  }
  return svgMarkup.replace(/^<svg/, `<svg ${SVG_NS}`);
}

/**
 * Rasterize an inline `<svg>` to a PNG data URI. Returns `null` (not throws) when resvg cannot
 * render the SVG (malformed XML, an unsupported feature, or text needing a font while
 * `loadSystemFonts: false` is pinned), so one bad SVG leaves itself unconverted rather than crashing
 * the whole document — the re-detect then reports it (a warning) and the native renderer draws it.
 */
function rasterizeToDataUri(svgMarkup: string): string | null {
  try {
    const png = new Resvg(ensureSvgNamespace(svgMarkup), RESVG_OPTIONS).render().asPng();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export const inlineSvgRule: Rule = {
  id: "inline-svg",
  severity: "warning",
  autoFixable: true,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      if (tagName(element) === "svg") {
        detections.push({ element, suggestedFix: SUGGESTED_FIX });
      }
    });
    return detections;
  },
  apply(svg): void {
    const svgMarkup = serializeElement(svg);
    const dataUri = rasterizeToDataUri(svgMarkup);
    if (dataUri === null) {
      // resvg could not render this SVG; leave it unconverted (the re-detect reports it as a warning and
      // the native renderer draws it) instead of the whole render crashing on one bad element.
      return;
    }
    convertSvgToImg(svg, dataUri);
  },
};

/**
 * Rewrite an `<svg>` element in place into an `<img>` carrying the PNG data URI. The SVG's `width`
 * and `height` are emitted as CSS (not attributes) so the produced `<img>` is already conformant and
 * is never re-matched by the `img-dimension-attrs` rule — preserving the fixed-point guarantee.
 */
function convertSvgToImg(svg: Element, dataUri: string): void {
  const width = getAttr(svg, "width");
  const height = getAttr(svg, "height");
  const declarations: Declaration[] = [];
  if (width !== null) {
    declarations.push({ property: "width", value: toCssLength(width) });
  }
  if (height !== null) {
    declarations.push({ property: "height", value: toCssLength(height) });
  }
  // Mutate in place so parentNode links stay valid: become an <img>, drop SVG children/attrs. The
  // namespace must move from SVG to HTML so parse5 serializes a void <img> (no closing tag) — this
  // is what makes the codemod a re-serialization fixed point.
  svg.tagName = "img";
  svg.nodeName = "img";
  svg.namespaceURI = html.NS.HTML;
  svg.childNodes = [];
  svg.attrs = [{ name: "src", value: dataUri }];
  if (declarations.length > 0) {
    svg.attrs.push({ name: "style", value: serializeStyle(declarations) });
  }
}
