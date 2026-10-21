import assert from "node:assert/strict";
import { test } from "node:test";
import { compareRuns } from "../compare.mjs";
import { diffLayouts } from "../lib/match.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { alignWords, parseBbox } from "../pdf-probe.mjs";
import { ID, PATHS, chromeRecords, syntheticDump } from "./helpers.mjs";

const BASELINES = new Map([["Liberation Sans|400|12", { ascent: 11, descent: 3 }]]);
const diff = (dump) =>
  diffLayouts({ chrome: chromeRecords(), vellora: velloraModel(dump), baselines: BASELINES });

test("compareRuns attributes a build-to-build change to the first layer that changed", () => {
  const a = syntheticDump();
  const b = syntheticDump();
  // Build b: raw Blitz unchanged, but pass_two now moves "World" 4px right.
  b.layers.find((l) => l.name === "pass_two").runs[1][2] += 4;
  // ...and B0 (hence every layer) moves div#a 2px down.
  b.blitz_tree.find((x) => x.id === ID.a).y += 2;
  for (const layer of b.layers) layer.boxes.find((x) => x[0] === ID.a)[3] += 2;
  const cmp = compareRuns(diff(a), diff(b));
  assert.equal(cmp.chrome_reference_identical, true);
  const world = cmp.top_text_changes.find((t) => t.text === "World");
  assert.equal(world.first_changed_layer_x, "pass_two");
  assert.equal(world.change_in_L0.dx, 0);
  const boxA = cmp.top_box_changes.find((x) => x.path === PATHS.a);
  assert.equal(boxA.first_changed_layer, "B0");
});

test("pdftotext -bbox parsing and occurrence-based word alignment", () => {
  const xhtml = `<page width="595" height="842">
<word xMin="10.0" yMin="20.0" xMax="30.0" yMax="32.0">de</word>
<word xMin="40.0" yMin="20.0" xMax="60.0" yMax="32.0">AGÊNCIA</word>
<word xMin="10.0" yMin="40.0" xMax="30.0" yMax="52.0">de</word>
</page>`;
  const v = parseBbox(xhtml);
  assert.equal(v.length, 3);
  assert.equal(v[0].page, 1);
  assert.equal(v[1].w, 20);
  // Chrome lists the words in a different reading order; occurrences still pair correctly.
  const c = [v[1], v[0], v[2]].map((w) => ({ ...w, x: w.x + 1 }));
  const pairs = alignWords(v, c);
  assert.equal(pairs.length, 3);
  assert.equal(pairs[2][1].y, 40);
});
