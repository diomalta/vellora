/**
 * parse5 helpers shared by every rule: parsing with source-location info, a depth-first element
 * walk, attribute and inline-`style` accessors, and source-snippet extraction. Kept dependency-light
 * and side-effect-free so importing `@vellora/lint` never touches the network or filesystem.
 */
import {
  type DefaultTreeAdapterTypes,
  type ParserError,
  parse,
  serialize,
  serializeOuter,
} from "parse5";

export type Element = DefaultTreeAdapterTypes.Element;
export type Node = DefaultTreeAdapterTypes.Node;
export type ChildNode = DefaultTreeAdapterTypes.ChildNode;
export type Document = DefaultTreeAdapterTypes.Document;

export interface ParsedDocument {
  document: Document;
  /** Parse errors reported by parse5 (`onParseError`), in source order. */
  parseErrors: ParserError[];
  /** The original input, used for source-snippet extraction. */
  source: string;
}

/** Parse HTML with source-location info and a collected parse-error list. Never mutates input. */
export function parseHtml(html: string): ParsedDocument {
  const parseErrors: ParserError[] = [];
  const document = parse(html, {
    sourceCodeLocationInfo: true,
    onParseError: (error) => parseErrors.push(error),
  });
  return { document, parseErrors, source: html };
}

/** Serialize a document back to HTML (includes the DOCTYPE). This is a parse→serialize fixed point. */
export function serializeDocument(document: Document): string {
  return serialize(document);
}

/** Serialize a single element (including its own tag) — used to feed an `<svg>` subtree to resvg. */
export function serializeElement(element: Element): string {
  return serializeOuter(element);
}

function isElement(node: Node | ChildNode): node is Element {
  return typeof (node as Element).tagName === "string";
}

/** Is this a parse5 text node (`#text`)? */
export function isTextNode(node: ChildNode): boolean {
  return node.nodeName === "#text";
}

/** Is this a parse5 comment node (`#comment`)? */
export function isCommentNode(node: ChildNode): boolean {
  return node.nodeName === "#comment";
}

/** Raw character data of a text node (empty string for non-text nodes). */
export function textValue(node: ChildNode): string {
  return isTextNode(node) ? (node as { value: string }).value : "";
}

/**
 * Depth-first walk over every element, calling `visit(element, parent)` in document order.
 *
 * Iterative (explicit worklist) rather than recursive so a pathologically deep document — parse5
 * imposes no nesting cap — cannot overflow the JS call stack and surface an uncaught `RangeError`.
 * Children are pushed in reverse so they pop in document order; each frame carries its effective
 * parent (the nearest ancestor element).
 */
export function walkElements(
  document: Document,
  visit: (element: Element, parent: Element | null) => void,
): void {
  const stack: { node: Node; parent: Element | null }[] = [{ node: document, parent: null }];
  for (let frame = stack.pop(); frame !== undefined; frame = stack.pop()) {
    const { node, parent } = frame;
    const element = isElement(node) ? node : null;
    if (element) {
      visit(element, parent);
    }
    const children = (node as { childNodes?: ChildNode[] }).childNodes ?? [];
    const effectiveParent = element ?? parent;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (child !== undefined) {
        stack.push({ node: child, parent: effectiveParent });
      }
    }
  }
}

/**
 * Maximum element-nesting depth `diagnose`/`fix` will process. Beyond this, parse5's own recursive
 * serializer (and any future deep recursion) would overflow the JS call stack; the entry points cap
 * here and surface a structured finding instead of letting a raw `RangeError` escape. Untrusted HTML
 * this deep is pathological — well past anything a real document needs.
 */
export const MAX_NESTING_DEPTH = 5000;

/**
 * Does the document nest elements deeper than `MAX_NESTING_DEPTH`? Iterative (explicit worklist) so
 * the depth check itself cannot overflow the stack on the very input it guards against.
 */
export function exceedsMaxDepth(document: Document, max = MAX_NESTING_DEPTH): boolean {
  const stack: { node: Node; depth: number }[] = [{ node: document, depth: 0 }];
  for (let frame = stack.pop(); frame !== undefined; frame = stack.pop()) {
    const { node, depth } = frame;
    if (depth > max) {
      return true;
    }
    const children = (node as { childNodes?: ChildNode[] }).childNodes ?? [];
    const childDepth = isElement(node) ? depth + 1 : depth;
    for (const child of children) {
      stack.push({ node: child, depth: childDepth });
    }
  }
  return false;
}

export function tagName(element: Element): string {
  return element.tagName.toLowerCase();
}

export function getAttr(element: Element, name: string): string | null {
  const attr = element.attrs.find((a) => a.name === name);
  return attr ? attr.value : null;
}

export function setAttr(element: Element, name: string, value: string): void {
  const attr = element.attrs.find((a) => a.name === name);
  if (attr) {
    attr.value = value;
  } else {
    element.attrs.push({ name, value });
  }
}

export function removeAttr(element: Element, name: string): void {
  const index = element.attrs.findIndex((a) => a.name === name);
  if (index !== -1) {
    element.attrs.splice(index, 1);
  }
}

/** 1-based start `{ line, col }` of an element from its source-location info (falls back to 1:1). */
export function startLocation(element: Element): { line: number; col: number } {
  const loc = element.sourceCodeLocation;
  if (loc) {
    return { line: loc.startLine, col: loc.startCol };
  }
  return { line: 1, col: 1 };
}

/** Extract the offending source fragment for an element from the original source. */
export function snippetFor(element: Element, source: string): string {
  const loc = element.sourceCodeLocation;
  if (!loc) {
    return `<${tagName(element)}>`;
  }
  const fragment = source.slice(loc.startOffset, loc.endOffset);
  return fragment.length > 0 ? fragment : `<${tagName(element)}>`;
}
