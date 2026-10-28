import assert from "node:assert/strict";
import { test } from "node:test";
import { compareRuns } from "../compare.mjs";
import { diffLayouts } from "../lib/match.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { alignWords, fragmentAt, parseBbox } from "../pdf-probe.mjs";
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

test("fragmentAt maps a PDF word to the pagination placement that put it there", () => {
  // margin-top 60 px; placement 1 spans page-local 100..140 px on page 1 (pt: 120..150 + 45).
  const placements = [
    {
      index: 0,
      page: 0,
      path: "a",
      top: 0,
      bottom: 90,
      placed_top: 0,
      offset_vs_flow: 0,
      drift: 0,
    },
    {
      index: 1,
      page: 0,
      path: "b",
      top: 120,
      bottom: 160,
      placed_top: 100,
      offset_vs_flow: -20,
      drift: -20,
    },
  ];
  const word = { page: 1, y: (60 + 110) * 0.75, h: 9 }; // centre at 170 + 6 = 176 px - 60 = 116
  assert.deepEqual(fragmentAt(placements, 60, word), {
    placement: 1,
    root: "b",
    offset_vs_flow_pt: -15,
    drift_pt: -15,
  });
  assert.equal(fragmentAt(placements, 60, { ...word, page: 2 }), null);
});
