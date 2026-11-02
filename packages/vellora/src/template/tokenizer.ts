/**
 * Tokenizer: split a template string into `text`, `interpolation` (`{{ }}`), and `tag` (`{% %}`)
 * tokens, tracking 1-based line/column for error reporting. No interpretation happens here.
 *
 * `{% raw %}…{% endraw %}` is resolved here: everything between the two tags is emitted as one
 * verbatim `text` token, so a literal `{{` or `{%` inside it is never read as template syntax.
 * Raw blocks do not nest; the first `{% endraw %}` closes the block.
 */
import { VelloraTemplateError } from "../errors.js";

export interface Position {
  line: number;
  col: number;
}

export type Token =
  | { kind: "text"; value: string; pos: Position }
  | { kind: "interpolation"; value: string; pos: Position }
  | { kind: "tag"; value: string; pos: Position };

/** Matches a `{% endraw %}` tag (any inner whitespace). Used with `lastIndex`, so one forward scan. */
const ENDRAW_RE = /\{%\s*endraw\s*%\}/g;

/**
 * Single O(N) pass: line/col are tracked incrementally as the cursor advances and snapshotted at
 * each token start, so positions never require rescanning from the start of `source`.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let textStart = 0;
  let line = 1;
  let col = 1;
  // Position of the current pending text run's first char.
  let textStartPos: Position = { line: 1, col: 1 };

  const flushText = (end: number): void => {
    if (end > textStart) {
      tokens.push({
        kind: "text",
        value: source.slice(textStart, end),
        pos: { ...textStartPos },
      });
    }
  };

  // Step char-by-char (not a jump) so line/col stay in sync with the cursor.
  const advanceTo = (end: number): void => {
    while (i < end) {
      if (source[i] === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    }
  };

  while (i < source.length) {
    const open2 = source.slice(i, i + 2);
    if (open2 === "{{" || open2 === "{%") {
      const isInterp = open2 === "{{";
      const close = isInterp ? "}}" : "%}";
      const closeIdx = source.indexOf(close, i + 2);
      if (closeIdx === -1) {
        throw new VelloraTemplateError(`Unterminated ${isInterp ? "{{ }}" : "{% %}"} tag.`, {
          line,
          col,
        });
      }
      flushText(i);
      const value = source.slice(i + 2, closeIdx).trim();
      if (!isInterp && value === "raw") {
        const rawPos: Position = { line, col };
        ENDRAW_RE.lastIndex = closeIdx + 2;
        const end = ENDRAW_RE.exec(source);
        if (!end) {
          throw new VelloraTemplateError(
            "Unterminated {% raw %} block (missing {% endraw %}).",
            rawPos,
          );
        }
        advanceTo(closeIdx + 2);
        textStart = i;
        textStartPos = { line, col };
        advanceTo(end.index);
        flushText(end.index);
        advanceTo(end.index + end[0].length);
        textStart = i;
        textStartPos = { line, col };
        continue;
      }
      tokens.push({
        kind: isInterp ? "interpolation" : "tag",
        value,
        pos: { line, col },
      });
      advanceTo(closeIdx + 2);
      textStart = i;
      textStartPos = { line, col };
    } else {
      advanceTo(i + 1);
    }
  }
  flushText(source.length);
  return tokens;
}
