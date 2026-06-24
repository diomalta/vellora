/**
 * Parser: build an AST of `text`, `interpolation`, `for`, and `if` nodes from the token stream.
 *
 * Only the documented token syntax is recognized; anything else (unknown tag, unclosed/mismatched
 * block, stray `endfor`/`endif`/`else`) rejects with a located `VelloraTemplateError` before any
 * native call. No arbitrary expression evaluation is parsed — interpolation/conditions are parsed
 * by the interpreter from their raw expression text.
 */
import { VelloraTemplateError } from "../errors.js";
import type { Position, Token } from "./tokenizer.js";

export type Node =
  | { type: "text"; value: string }
  | { type: "interpolation"; expr: string; pos: Position }
  | { type: "for"; item: string; collection: string; body: Node[]; pos: Position }
  | { type: "if"; condition: string; consequent: Node[]; alternate: Node[]; pos: Position };

const FOR_RE = /^for\s+([A-Za-z_$][\w$]*)\s+in\s+(.+)$/;
const IF_RE = /^if\s+(.+)$/;

interface Frame {
  /** The block kind currently open. */
  kind: "for" | "if";
  /** Position of the opening tag, for unclosed-block error reporting. */
  pos: Position;
  /** Accumulator for the active branch (for body, if consequent, or if alternate after else). */
  current: Node[];
  /** Partial node being assembled; finalized when the matching end tag is seen. */
  build:
    | { type: "for"; item: string; collection: string }
    | { type: "if"; condition: string; consequent: Node[]; inElse: boolean };
}

export function parse(tokens: Token[]): Node[] {
  const root: Node[] = [];
  const stack: Frame[] = [];

  const top = (): Node[] => stack[stack.length - 1]?.current ?? root;

  for (const token of tokens) {
    if (token.kind === "text") {
      top().push({ type: "text", value: token.value });
      continue;
    }
    if (token.kind === "interpolation") {
      top().push({ type: "interpolation", expr: token.value, pos: token.pos });
      continue;
    }

    const tag = token.value;
    const forMatch = tag.match(FOR_RE);
    if (forMatch) {
      const item = forMatch[1] ?? "";
      const collection = (forMatch[2] ?? "").trim();
      const frame: Frame = {
        kind: "for",
        pos: token.pos,
        current: [],
        build: { type: "for", item, collection },
      };
      stack.push(frame);
      continue;
    }
    const ifMatch = tag.match(IF_RE);
    if (ifMatch) {
      const frame: Frame = {
        kind: "if",
        pos: token.pos,
        current: [],
        build: { type: "if", condition: (ifMatch[1] ?? "").trim(), consequent: [], inElse: false },
      };
      stack.push(frame);
      continue;
    }
    if (tag === "else") {
      const frame = stack[stack.length - 1];
      if (!frame || frame.kind !== "if" || frame.build.type !== "if" || frame.build.inElse) {
        throw new VelloraTemplateError(
          "Unexpected {% else %} without an open {% if %}.",
          token.pos,
        );
      }
      frame.build.consequent = frame.current;
      frame.build.inElse = true;
      frame.current = [];
      continue;
    }
    if (tag === "endfor") {
      const frame = stack.pop();
      if (!frame || frame.kind !== "for" || frame.build.type !== "for") {
        throw new VelloraTemplateError(
          "Unexpected {% endfor %} without an open {% for %}.",
          token.pos,
        );
      }
      top().push({
        type: "for",
        item: frame.build.item,
        collection: frame.build.collection,
        body: frame.current,
        pos: frame.pos,
      });
      continue;
    }
    if (tag === "endif") {
      const frame = stack.pop();
      if (!frame || frame.kind !== "if" || frame.build.type !== "if") {
        throw new VelloraTemplateError(
          "Unexpected {% endif %} without an open {% if %}.",
          token.pos,
        );
      }
      const consequent = frame.build.inElse ? frame.build.consequent : frame.current;
      const alternate = frame.build.inElse ? frame.current : [];
      top().push({
        type: "if",
        condition: frame.build.condition,
        consequent,
        alternate,
        pos: frame.pos,
      });
      continue;
    }
    throw new VelloraTemplateError(`Unknown template tag: {% ${tag} %}.`, token.pos);
  }

  const unclosed = stack[stack.length - 1];
  if (unclosed) {
    const name = unclosed.kind === "for" ? "{% for %}" : "{% if %}";
    throw new VelloraTemplateError(`Unterminated ${name} block (missing end tag).`, unclosed.pos);
  }
  return root;
}
