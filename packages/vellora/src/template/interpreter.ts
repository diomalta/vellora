/**
 * Interpreter: resolve dotted paths against `data`, evaluate interpolation expressions
 * (`path | helper(args)`), conditions (`path`, `not path`, `path == literal`, `path != literal`),
 * and render the AST to a finalized HTML string.
 *
 * Escape-by-default: every interpolated value (helpers included) is HTML-escaped so data cannot
 * inject markup. Missing paths resolve to `""` and never throw. No arbitrary code is executed: only
 * the documented token grammar is interpreted; data values are inert text.
 */
import { VelloraTemplateError } from "../errors.js";
import type { RenderData } from "../types.js";
import { HELPERS } from "./helpers.js";
import type { Node } from "./parser.js";
import type { Position } from "./tokenizer.js";

/** A lexical scope chain: loop-variable frames over the root `data`. */
type Scope = Record<string, unknown>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Resolve a dotted path against the scope chain (innermost first). Missing ⇒ `undefined`. */
function resolvePath(path: string, scopes: Scope[]): unknown {
  const segments = path.split(".");
  const head = segments[0];
  if (head === undefined) {
    return undefined;
  }
  let base: unknown;
  let found = false;
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i];
    if (scope && Object.hasOwn(scope, head)) {
      base = scope[head];
      found = true;
      break;
    }
  }
  if (!found) {
    return undefined;
  }
  for (let i = 1; i < segments.length; i++) {
    if (base === null || base === undefined) {
      return undefined;
    }
    const key = segments[i];
    if (key === undefined) {
      return undefined;
    }
    // Gate EVERY segment on own-property access so a dotted path can never walk the prototype chain
    // (`x.__proto__`, `x.constructor.name`); such reads resolve to `undefined` (coerced to "").
    if (!Object.hasOwn(base as object, key)) {
      return undefined;
    }
    base = (base as Record<string, unknown>)[key];
  }
  return base;
}

/** Coerce a resolved value to its string form for escaping. `null`/`undefined` ⇒ `""`. */
function coerce(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

/** Parse a literal argument: a quoted string or a number. */
function parseLiteral(raw: string, pos: Position): unknown {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed !== "" && !Number.isNaN(Number(trimmed))) {
    return Number(trimmed);
  }
  throw new VelloraTemplateError(`Unsupported helper argument: ${raw}.`, pos);
}

/** Split a `helper(arg, arg)` arg list, respecting quotes. */
function splitArgs(rawArgs: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let quote: string | undefined;
  let current = "";
  for (const ch of rawArgs) {
    if (quote) {
      current += ch;
      if (ch === quote) {
        quote = undefined;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(") {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ")") {
      depth--;
      current += ch;
      continue;
    }
    if (ch === "," && depth === 0) {
      args.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim() !== "") {
    args.push(current);
  }
  return args;
}

/** Evaluate an interpolation expression to its (unescaped) string value. */
function evalInterpolation(expr: string, scopes: Scope[], pos: Position): string {
  const pipeIdx = expr.indexOf("|");
  if (pipeIdx === -1) {
    return coerce(resolvePath(expr.trim(), scopes));
  }
  const path = expr.slice(0, pipeIdx).trim();
  const helperPart = expr.slice(pipeIdx + 1).trim();
  const callMatch = helperPart.match(/^([A-Za-z_$][\w$]*)\s*(?:\((.*)\))?$/s);
  if (!callMatch) {
    throw new VelloraTemplateError(`Malformed helper expression: ${helperPart}.`, pos);
  }
  const name = callMatch[1] ?? "";
  const helper = HELPERS[name];
  if (!helper) {
    throw new VelloraTemplateError(`Unknown helper: ${name}.`, pos);
  }
  const rawArgs = callMatch[2];
  const args =
    rawArgs === undefined || rawArgs.trim() === ""
      ? []
      : splitArgs(rawArgs).map((a) => parseLiteral(a, pos));
  const value = resolvePath(path, scopes);
  try {
    return helper(value, args, pos);
  } catch (err) {
    if (err instanceof VelloraTemplateError) {
      throw err;
    }
    // A helper may throw a raw V8 error (e.g. `Intl` `RangeError` on a bad currency/digits arg).
    // Re-wrap as a located `VelloraTemplateError` so every error leaving the engine is typed.
    throw new VelloraTemplateError(
      `Helper "${name}" failed: ${err instanceof Error ? err.message : String(err)}.`,
      pos,
    );
  }
}

/** Evaluate a condition expression to a boolean. Supports path, `not path`, `==`/`!=` literals. */
function evalCondition(condition: string, scopes: Scope[], pos: Position): boolean {
  const negMatch = condition.match(/^not\s+(.+)$/);
  if (negMatch) {
    return !truthy(resolvePath((negMatch[1] ?? "").trim(), scopes));
  }
  const eqMatch = condition.match(/^(.+?)\s*(==|!=)\s*(.+)$/);
  if (eqMatch) {
    const left = resolvePath((eqMatch[1] ?? "").trim(), scopes);
    const right = parseLiteral(eqMatch[3] ?? "", pos);
    const equal = left === right;
    return eqMatch[2] === "==" ? equal : !equal;
  }
  return truthy(resolvePath(condition.trim(), scopes));
}

/** Truthiness for conditions: empty arrays are falsy (so `{% if items %}` guards rows). */
function truthy(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value);
}

function renderNodes(nodes: Node[], scopes: Scope[]): string {
  let out = "";
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        out += node.value;
        break;
      case "interpolation":
        out += escapeHtml(evalInterpolation(node.expr, scopes, node.pos));
        break;
      case "for": {
        const collection = resolvePath(node.collection, scopes);
        if (Array.isArray(collection)) {
          for (const item of collection) {
            out += renderNodes(node.body, [...scopes, { [node.item]: item }]);
          }
        }
        break;
      }
      case "if":
        out += evalCondition(node.condition, scopes, node.pos)
          ? renderNodes(node.consequent, scopes)
          : renderNodes(node.alternate, scopes);
        break;
    }
  }
  return out;
}

/** Render a parsed AST to finalized HTML against `data`. */
export function render(nodes: Node[], data: RenderData): string {
  return renderNodes(nodes, [data]);
}
