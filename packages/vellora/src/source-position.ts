/**
 * Shared offset→{line,col} mapping. One implementation for the mock bridge's violation locator and
 * the tokenizer's non-incremental callers, so the two can't drift. The tokenizer's main scan tracks
 * line/col incrementally (single O(N) pass); this helper serves the occasional one-off lookup.
 */

/** Compute the 1-based line/column of an absolute `offset` within `source`. */
export function offsetToLineCol(source: string, offset: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset; i++) {
    if (source[i] === "\n") {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}
