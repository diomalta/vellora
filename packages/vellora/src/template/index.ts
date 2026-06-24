/**
 * Built-in templating engine entry point.
 *
 * `renderTemplate(html, data)` tokenizes → parses → renders to a finalized HTML string with all
 * `{{ }}` / `{% %}` tokens resolved. Syntax errors (unclosed blocks, unknown tags/helpers) reject
 * with a located `VelloraTemplateError` before any native call. No arbitrary code is executed.
 */
import type { RenderData } from "../types.js";
import { render } from "./interpreter.js";
import { parse } from "./parser.js";
import { tokenize } from "./tokenizer.js";

export { HELPERS } from "./helpers.js";

/** Apply the templating engine. Throws `VelloraTemplateError` on any syntax error. */
export function renderTemplate(html: string, data: RenderData = {}): string {
  const tokens = tokenize(html);
  const ast = parse(tokens);
  return render(ast, data);
}
