// FONT_ALIASES is the ONE shared table of fidelity/lib/chrome-reference.mjs. It must stay a
// superset of benchmarks/visual-fidelity.mjs (which runs main() on import, so it is read as text):
// every benchmark family has to reach the same files, so both harnesses point Chrome at them.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { FONT_ALIASES as SHARED } from "../../lib/chrome-reference.mjs";
import { repoRoot } from "../lib/fixture-html.mjs";
import { FONT_ALIASES, chromeFontFor } from "../lib/fonts.mjs";

test("layout-diff uses the shared alias table, a superset of benchmarks/visual-fidelity.mjs", () => {
  assert.equal(FONT_ALIASES, SHARED);
  const source = readFileSync(join(repoRoot, "benchmarks", "visual-fidelity.mjs"), "utf8");
  const match = /const FONT_ALIASES = (\[[\s\S]*?\n\]);/.exec(source);
  assert.ok(match, "FONT_ALIASES literal not found in benchmarks/visual-fidelity.mjs");
  // Literal -> JSON (quote bare keys, drop trailing commas); never evaluated as code.
  const asJson = match[1].replace(/(\w+):/g, '"$1":').replace(/,(\s*[\]}])/g, "$1");
  for (const bench of JSON.parse(asJson)) {
    for (const family of bench.families) {
      const ours = FONT_ALIASES.find((a) => a.families.includes(family));
      assert.ok(ours, `benchmark family ${family} missing`);
      assert.equal(ours.regular, bench.regular);
      assert.equal(ours.bold, bench.bold);
    }
  }
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
