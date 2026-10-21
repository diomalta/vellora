// Matcher self-tests. Per fidelity/README.md an oracle is only trusted after it has been shown to
// catch a deliberately broken input, so every attribution path is exercised with a planted defect:
// on synthetic trees AND on a real (notification @ Blitz pin) Chromium snapshot + vellora dump.
import assert from "node:assert/strict";
import { test } from "node:test";
import { alignRuns, diffLayouts } from "../lib/match.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { BOXES, ID, PATHS, chromeRecords, loadGz, syntheticDump } from "./helpers.mjs";

const BASELINES = new Map([["Liberation Sans|400|12", { ascent: 11, descent: 3 }]]);

function run(dump, records = chromeRecords(), opts = {}) {
  return diffLayouts({
    chrome: records,
    vellora: velloraModel(dump),
    baselines: BASELINES,
    ...opts,
  });
}

function setBox(dump, layerName, id, patch) {
  const layer = dump.layers.find((l) => l.name === layerName);
  const box = layer.boxes.find((b) => b[0] === id);
  const fields = { x: 2, y: 3, w: 4, h: 5 };
  for (const [k, v] of Object.entries(patch)) box[fields[k]] += v;
}

test("identical trees: no divergence anywhere", () => {
  const r = run(syntheticDump());
  assert.equal(r.headline.box, null);
  assert.equal(r.headline.text, null);
  assert.equal(r.counts.matched_boxes, 5);
  assert.equal(r.text.matched_pairs, 2);
});

test("a box broken only by a pass is attributed to that pass", () => {
  const dump = syntheticDump();
  // pass_two shifts div#b (and nothing else) 3px right.
  setBox(dump, "pass_two", ID.b, { x: 3 });
  const r = run(dump);
  assert.equal(r.headline.box.path, PATHS.b);
  assert.equal(r.headline.box.type, "enter");
  assert.equal(r.headline.box.introduced_by, "pass_two");
  assert.equal(r.headline.box.per_layer.pass_one.status, "ok");
  assert.equal(r.headline.box.per_layer.pass_two.dx, 3);
});

test("raw Blitz divergence is attributed to B0 even if a pass later fixes it", () => {
  const dump = syntheticDump();
  dump.blitz_tree.find((b) => b.id === ID.a).w += 5;
  for (const layer of ["L0", "pass_one"]) setBox(dump, layer, ID.a, { w: 5 });
  const r = run(dump);
  // Final layer (pass_two) is correct: no headline, but B0/L0 report the box with B0 as cause.
  assert.equal(r.headline.box, null);
  assert.equal(r.first_divergence_by_layer.B0.box.path, PATHS.a);
  assert.equal(r.first_divergence_by_layer.L0.box.introduced_by, "B0");
});

test("vellora walk divergence (B0 fine, L0 off) is attributed to L0", () => {
  const dump = syntheticDump();
  for (const layer of ["L0", "pass_one", "pass_two"]) setBox(dump, layer, ID.p, { y: 2 });
  const r = run(dump);
  assert.equal(r.headline.box.path, PATHS.p);
  assert.equal(r.headline.box.introduced_by, "L0");
});

test("height is checked on EXIT: the child that grew is first, not its ancestors", () => {
  const dump = syntheticDump();
  // p is 4px taller in every layer; div#b, body and html grow with it.
  const grow = (key) => {
    dump.blitz_tree.find((b) => b.id === ID[key]).h += 4;
    for (const layer of ["L0", "pass_one", "pass_two"]) setBox(dump, layer, ID[key], { h: 4 });
  };
  for (const key of ["p", "b", "body", "html"]) grow(key);
  const r = run(dump);
  assert.equal(r.headline.box.type, "exit");
  assert.equal(r.headline.box.path, PATHS.p);
  assert.equal(r.headline.box.introduced_by, "B0");
  assert.deepEqual(
    r.headline.box.ancestors.map((a) => a.path),
    [PATHS.html, PATHS.body, PATHS.b],
  );
});

test("text broken by a pass is attributed to that pass; baselines are compared", () => {
  const dump = syntheticDump();
  // pass_one moves "World" down 2px (origin_y).
  for (const layer of ["pass_one", "pass_two"]) {
    dump.layers.find((l) => l.name === layer).runs[1][3] += 2;
  }
  const r = run(dump);
  assert.equal(r.headline.text.text, "World");
  assert.equal(r.headline.text.introduced_by, "pass_one");
  assert.equal(r.headline.text.per_layer.pass_one.dy, 2);
  assert.equal(r.headline.text.per_layer.pass_one.dy_basis, "baseline");
});

test("tolerance is respected and configurable", () => {
  const dump = syntheticDump();
  setBox(dump, "pass_two", ID.b, { x: 0.4 });
  assert.equal(run(dump).headline.box, null);
  assert.equal(run(dump, chromeRecords(), { tolerance: 0.3 }).headline.box.path, PATHS.b);
});

test("Chromium-side change in a box is caught (reference perturbation)", () => {
  const boxes = structuredClone(BOXES);
  boxes.p = [0, 31.5, 600, 20];
  const r = run(syntheticDump(), chromeRecords(boxes));
  assert.equal(r.headline.box.path, PATHS.p);
  assert.equal(r.headline.box.per_layer.B0.dy, -1.5);
});

test("alignRuns joins Chromium fragments split across text nodes", () => {
  const runs = [{ key: "0:0", norm: "ref.: abc-1", text: "Ref.: ABC-1", line: 0 }];
  const frags = [
    { norm: "ref.:", text: "Ref.: ", x: 0, y: 10, w: 30, h: 14 },
    { norm: "abc-1", text: "ABC-1", x: 30, y: 10, w: 40, h: 14 },
  ];
  const { pairs, unmatchedRuns, unmatchedFrags } = alignRuns(runs, frags);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].joined, true);
  assert.equal(pairs[0].frag.w, 70);
  assert.equal(unmatchedRuns.length, 0);
  assert.equal(unmatchedFrags.length, 0);
});

// ---- real data: notification at the Blitz pin (captured by run.mjs, Chrome 155, 2026-10-21) ----

function realInputs() {
  const chrome = loadGz("notification-pin.chrome.json.gz");
  const dump = loadGz("notification-pin.dump.json.gz");
  return { chrome, dump, baselines: new Map(Object.entries(chrome.baselines)) };
}

test("real snapshot: baseline result is stable (first box = header-table cell, raw Blitz)", () => {
  const { chrome, dump, baselines } = realInputs();
  const r = diffLayouts({ chrome: chrome.records, vellora: velloraModel(dump), baselines });
  assert.equal(
    r.headline.box.path,
    "html>body:nth-child(2)>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)",
  );
  assert.equal(r.headline.box.introduced_by, "B0");
  assert.equal(r.counts.matched_boxes, 34);
});

test("real snapshot: a 3px Chromium perturbation before the known first divergence is found", () => {
  const { chrome, dump, baselines } = realInputs();
  const target = "html>body:nth-child(2)>div:nth-child(1)>div:nth-child(2)";
  const rec = chrome.records.find((r) => r.path === target);
  rec.box.x += 3;
  const r = diffLayouts({ chrome: chrome.records, vellora: velloraModel(dump), baselines });
  assert.equal(r.headline.box.path, target);
  assert.equal(r.headline.box.type, "enter");
  assert.equal(r.headline.box.introduced_by, "B0");
  assert.equal(r.headline.box.per_layer.L0.dx, -3);
});

test("real snapshot: a 3px shift planted in ONE pass layer is attributed to that pass", () => {
  const { chrome, dump, baselines } = realInputs();
  const target = "html>body:nth-child(2)>div:nth-child(1)>div:nth-child(2)";
  const id = dump.nodes.find((n) => n.path === target).id;
  const k = dump.layers.findIndex((l) => l.name === "fixed_table_widths");
  for (const layer of dump.layers.slice(k)) {
    layer.boxes.find((b) => b[0] === id)[2] += 3;
  }
  const r = diffLayouts({ chrome: chrome.records, vellora: velloraModel(dump), baselines });
  assert.equal(r.headline.box.path, target);
  assert.equal(r.headline.box.introduced_by, "fixed_table_widths");
});
