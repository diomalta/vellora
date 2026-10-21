// FONT_ALIASES is copied from benchmarks/visual-fidelity.mjs (which runs main() on import, so it
// cannot be imported). Fail on drift so both harnesses keep pointing Chrome at the same files.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { repoRoot } from "../lib/fixture-html.mjs";
import { FONT_ALIASES, chromeFontFor } from "../lib/fonts.mjs";

test("FONT_ALIASES matches benchmarks/visual-fidelity.mjs verbatim", () => {
  const source = readFileSync(join(repoRoot, "benchmarks", "visual-fidelity.mjs"), "utf8");
  const match = /const FONT_ALIASES = (\[[\s\S]*?\n\]);/.exec(source);
  assert.ok(match, "FONT_ALIASES literal not found in benchmarks/visual-fidelity.mjs");
  // Literal -> JSON (quote bare keys, drop trailing commas); never evaluated as code.
  const asJson = match[1].replace(/(\w+):/g, '"$1":').replace(/,(\s*[\]}])/g, "$1");
  assert.deepEqual(FONT_ALIASES, JSON.parse(asJson));
});

test("bundled faces map to the Chrome family/weight that reaches the same file", () => {
  assert.deepEqual(chromeFontFor("LiberationSans-Bold.ttf"), {
    family: "Liberation Sans",
    weight: 700,
  });
  assert.deepEqual(chromeFontFor("LiberationSerif-Regular.ttf"), {
    family: "Liberation Serif",
    weight: 400,
  });
  assert.equal(chromeFontFor("DejaVuSans.ttf"), null);
});
