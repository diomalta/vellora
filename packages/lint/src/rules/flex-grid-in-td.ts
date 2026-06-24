/**
 * `flex-grid-in-td` codemod: a `<td>` whose inline `style` uses `display:flex` or `display:grid` is
 * rewritten into an equivalent single-row nested `<table>`. Each child block becomes a cell of that
 * row, preserving order and content; the `display` declaration is removed from the outer `<td>`.
 *
 * Scope (documented trade-off): this captures the common document pattern — a single row of inline
 * blocks inside a cell. Wrapping, alignment, and gaps are not reproduced; cases beyond this pattern
 * are still *diagnosed*, never silently mis-fixed. Idempotent — once `display` is gone the cell no
 * longer matches, and the produced nested `<td>`s carry no `display:flex/grid`.
 */
import {
  type ChildNode,
  type Element,
  getAttr,
  isCommentNode,
  isTextNode,
  removeAttr,
  setAttr,
  tagName,
  textValue,
  walkElements,
} from "../dom.js";
import type { Detection, Rule } from "../engine.js";
import { type Declaration, parseStyle, serializeStyle } from "../style.js";

function isFlexGridDisplay(d: Declaration): boolean {
  return d.property === "display" && (d.value === "flex" || d.value === "grid");
}

function flexOrGridDisplay(style: string): boolean {
  return parseStyle(style).some(isFlexGridDisplay);
}

function isFlexGridTd(element: Element): boolean {
  if (tagName(element) !== "td") {
    return false;
  }
  const style = getAttr(element, "style");
  return style !== null && flexOrGridDisplay(style);
}

const SUGGESTED_FIX =
  "Replace display:flex/grid on this <td> with a nested <table> laying the children out in a single row. Flexbox and grid are outside the static PDF layout subset.";

export const flexGridInTdRule: Rule = {
  id: "flex-grid-in-td",
  severity: "warning",
  autoFixable: true,
  detect(doc): Detection[] {
    const detections: Detection[] = [];
    walkElements(doc.document, (element) => {
      if (isFlexGridTd(element)) {
        detections.push({ element, suggestedFix: SUGGESTED_FIX });
      }
    });
    return detections;
  },
  apply(td): void {
    removeDisplayDeclaration(td);
    const cells = td.childNodes.filter(isMeaningfulChild);
    if (cells.length === 0) {
      return;
    }
    const innerCells = cells.map((child) => makeCell(td, child));
    const row = makeElement("tr", td, innerCells);
    const tbody = makeElement("tbody", td, [row]);
    const table = makeElement("table", td, [tbody]);
    td.childNodes = [table];
  },
};

/** Drop only the `display:flex`/`display:grid` declaration, keeping any other inline styles. */
function removeDisplayDeclaration(td: Element): void {
  const declarations = parseStyle(getAttr(td, "style") ?? "").filter((d) => !isFlexGridDisplay(d));
  if (declarations.length > 0) {
    setAttr(td, "style", serializeStyle(declarations));
  } else {
    removeAttr(td, "style");
  }
}

/** Whitespace-only text between flex items is layout gap, not content — it does not become a cell. */
function isMeaningfulChild(node: ChildNode): boolean {
  if (isTextNode(node)) {
    return textValue(node).trim() !== "";
  }
  if (isCommentNode(node)) {
    return false;
  }
  return true;
}

function makeCell(parent: Element, child: ChildNode): Element {
  const cell = makeElement("td", parent, [child]);
  child.parentNode = cell;
  return cell;
}

function makeElement(name: string, parentNode: Element, childNodes: ChildNode[]): Element {
  const element: Element = {
    nodeName: name,
    tagName: name,
    attrs: [],
    namespaceURI: parentNode.namespaceURI,
    childNodes,
    parentNode,
  };
  for (const child of childNodes) {
    child.parentNode = element;
  }
  return element;
}
