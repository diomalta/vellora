/**
 * The document's CSS regions, as the strict gate scans them (`css_scan::css_regions`): every
 * `<style>` element body and every `style` attribute value, in document order. Only these are
 * scanned for denied CSS, so a denied word in prose or in another attribute is never flagged.
 */
import {
  type ChildNode,
  type Element,
  type ParsedDocument,
  getAttr,
  isTextNode,
  startLocation,
  tagName,
  textValue,
  walkElements,
} from "./dom.js";

export interface CssRegion {
  /** The `<style>` element, or the element carrying the `style` attribute. */
  element: Element;
  kind: "style-element" | "style-attribute";
  text: string;
  /** 1-based source `{ line, col }` of the character at `index` in `text`. */
  locate(index: number): { line: number; col: number };
}

export function cssRegions(doc: ParsedDocument): CssRegion[] {
  const regions: CssRegion[] = [];
  walkElements(doc.document, (element) => {
    if (tagName(element) === "style") {
      const text = element.childNodes.map(textValue).join("");
      const first = element.childNodes.find(isTextNode);
      regions.push({
        element,
        kind: "style-element",
        text,
        locate: (index) => locateInText(first, text, index) ?? startLocation(element),
      });
    }
    const style = getAttr(element, "style");
    if (style !== null) {
      const attr = element.sourceCodeLocation?.attrs?.style;
      const location = attr ? { line: attr.startLine, col: attr.startCol } : startLocation(element);
      regions.push({ element, kind: "style-attribute", text: style, locate: () => location });
    }
  });
  return regions;
}

/** Map an offset in a `<style>` body to a source position, from the text node's own location. */
function locateInText(
  node: ChildNode | undefined,
  text: string,
  index: number,
): { line: number; col: number } | null {
  const loc = node?.sourceCodeLocation;
  if (!loc) {
    return null;
  }
  const before = text.slice(0, index);
  const lastNewline = before.lastIndexOf("\n");
  if (lastNewline === -1) {
    return { line: loc.startLine, col: loc.startCol + index };
  }
  let newlines = 0;
  for (const c of before) {
    if (c === "\n") {
      newlines++;
    }
  }
  return { line: loc.startLine + newlines, col: index - lastNewline };
}
