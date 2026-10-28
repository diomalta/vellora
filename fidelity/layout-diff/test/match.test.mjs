// Matcher self-tests. Per fidelity/README.md an oracle is only trusted after it has been shown to
// catch a deliberately broken input, so every attribution path is exercised with a planted defect:
// on synthetic trees AND on a real (notification @ Blitz pin) Chromium snapshot + vellora dump.
import assert from "node:assert/strict";
import { test } from "node:test";
import { alignRuns, classifyStep, decompose, diffLayouts } from "../lib/match.mjs";
import { attributionText } from "../lib/report.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import {
  BOXES,
  ID,
  PATHS,
  chromeRecords,
  loadGz,
  plantBoxShift,
  plantFlowGrowth,
  syntheticDump,
} from "./helpers.mjs";

const BASELINES = new Map([["Liberation Sans|400|12", { ascent: 11, descent: 3 }]]);

function run(dump, records = chromeRecords(), opts = {}, sourceDump = null) {
  return diffLayouts({
    chrome: records,
    vellora: velloraModel(dump, { sourceDump }),
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
  assert.equal(r.headline.box.first_over_tolerance, "pass_two");
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
  assert.equal(r.first_divergence_by_layer.L0.box.first_over_tolerance, "B0");
});

test("vellora walk divergence (B0 fine, L0 off) is attributed to L0", () => {
  const dump = syntheticDump();
  for (const layer of ["L0", "pass_one", "pass_two"]) setBox(dump, layer, ID.p, { y: 2 });
  const r = run(dump);
  assert.equal(r.headline.box.path, PATHS.p);
  assert.equal(r.headline.box.first_over_tolerance, "L0");
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
  assert.equal(r.headline.box.first_over_tolerance, "B0");
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
  assert.equal(r.headline.text.first_over_tolerance, "pass_one");
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
  assert.equal(r.headline.box.first_over_tolerance, "B0");
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
  assert.equal(r.headline.box.first_over_tolerance, "B0");
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
  assert.equal(r.headline.box.first_over_tolerance, "fixed_table_widths");
});

// ---- attribution AFTER the first natural divergence (validator injections A2, C2, C3) ----
// plantBoxShift / plantFlowGrowth reproduce the validator's env-gated in-pipeline Rust injections
// exactly (their dumps were checked equal layer-by-layer at 1e-4 px, 2026-10-21).

const B = "html>body:nth-child(2)";
const realDiff = (dump) => {
  const { chrome, baselines } = realInputs();
  return diffLayouts({ chrome: chrome.records, vellora: velloraModel(dump), baselines });
};
const ownRegression = (item, layer) => item.regressed_by.find((w) => w.layer === layer);

test("classifyStep: worsened, overshoot (sign flip at equal magnitude), improved, same", () => {
  assert.equal(classifyStep(6, 16, 0.5).kind, "worsened");
  assert.equal(classifyStep(6, -6, 0.5).kind, "overshoot");
  assert.equal(classifyStep(6, -5.8, 0.5).kind, "overshoot");
  // A flip that ends closer to Chromium by more than tolerance is an improvement (beta.4 boleto:
  // fixed_table_widths moved a cell's dw -1.312 -> +0.688).
  assert.equal(classifyStep(6, -5, 0.5).kind, "improved");
  assert.equal(classifyStep(-1.312, 0.688, 0.5).kind, "improved");
  assert.equal(classifyStep(6, 0.05, 0.5).kind, "improved");
  assert.equal(classifyStep(6, 6.3, 0.5).kind, "same");
  assert.equal(classifyStep(0.3, -0.3, 0.5).kind, "same");
  assert.equal(classifyStep(0, 3, 0.5).kind, "worsened");
});

test("decompose: steps sum to the final delta; a lost box is a `missing` regression", () => {
  const per = {
    B0: { status: "diverged", dx: 2, dy: 6 },
    L0: { status: "diverged", dx: 2, dy: 6 },
    p1: { status: "diverged", dx: 2, dy: 16 },
    p2: { status: "missing" },
  };
  const d = decompose(per, ["B0", "L0", "p1", "p2"], ["dx", "dy"], 0.5);
  assert.deepEqual(
    d.steps.map((s) => [s.layer, s.coord, s.step]),
    [
      ["B0", "dy", 6],
      ["p1", "dy", 10],
    ],
  );
  assert.equal(d.dominant_layer, "p1");
  assert.deepEqual(
    d.regressed_by.map((w) => [w.layer, w.kind]),
    [
      ["B0", "worsened"],
      ["p1", "worsened"],
      ["p2", "missing"],
    ],
  );
  assert.equal(d.regressed_by[0].first, true);
  assert.equal(d.missing_from, "p2");
});

test("synthetic: a pass that flips +6 to -6 (same |delta|) is an overshoot regression", () => {
  const dump = syntheticDump();
  dump.blitz_tree.find((b) => b.id === ID.b).x += 6;
  for (const layer of ["L0", "pass_one"]) setBox(dump, layer, ID.b, { x: 6 });
  setBox(dump, "pass_two", ID.b, { x: -6 });
  const r = run(dump);
  assert.equal(r.headline.box.path, PATHS.b);
  assert.equal(r.headline.box.first_over_tolerance, "B0");
  const w = ownRegression(r.headline.box, "pass_two");
  assert.equal(w.kind, "overshoot");
  assert.equal(w.coord, "dx");
  assert.deepEqual([w.from, w.to], [6, -6]);
  assert.equal(r.regressions_by_layer.pass_two.first_box.path, PATHS.b);
  assert.equal(r.regressions_by_layer.pass_two.by_kind.overshoot, 1);
  assert.equal(r.headline.first_pass_regression.box.path, PATHS.b);
});

test("real snapshot, control: no table_percent_widths regression (so the planted ones are new)", () => {
  const r = realDiff(loadGz("notification-pin.dump.json.gz"));
  const reg = r.regressions_by_layer.table_percent_widths;
  assert.equal(reg.box_events_vs_previous_layer, 0);
  assert.equal(reg.text_events_vs_previous_layer, 0);
  assert.equal(reg.first_box, null);
  // The natural headline is the header-table cell; A2/C3 targets come after it in pre-order.
  assert.equal(
    r.headline.box.path,
    `${B}>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)`,
  );
});

test("real snapshot (A2): +10 px y by a pass on a box ALREADY off at B0, after the headline", () => {
  const target = `${B}>div:nth-child(4)`;
  const ctl = realDiff(loadGz("notification-pin.dump.json.gz"));
  const r = realDiff(
    plantBoxShift(loadGz("notification-pin.dump.json.gz"), target, "table_percent_widths", {
      y: 10,
    }),
  );
  // The headline (natural first divergence) does not move...
  assert.equal(r.headline.box.path, ctl.headline.box.path);
  // ...the box is already over tolerance at B0 (so first_over_tolerance cannot blame the pass)...
  const box = r.boxes.find((b) => b.path === target);
  assert.ok(Math.abs(box.layers.B0.dy) > 0.5);
  // ...but the pass is named as the layer that regressed it, and the pass-effect row names it.
  const reg = r.regressions_by_layer.table_percent_widths;
  assert.equal(reg.first_box.type, "enter");
  assert.equal(reg.first_box.path, target);
  assert.equal(reg.box_events_vs_previous_layer, 1);
  const w = ownRegression(reg.first_box, "table_percent_widths");
  assert.equal(w.kind, "worsened");
  assert.equal(w.coord, "dy");
  assert.ok(Math.abs(w.by - 10) < 0.01);
  assert.equal(reg.first_box.dominant_layer, "table_percent_widths");
  const eff = r.layer_stats.find((s) => s.layer === "table_percent_widths").effect_vs_previous;
  assert.equal(eff.boxes_regressed, 1);
  assert.equal(eff.top_box_regressions[0].path, target);
  const ranked = r.top_local_boxes.find((b) => b.path === target);
  assert.ok(ranked.regressed_by.some((x) => x.layer === "table_percent_widths"));
});

test("real snapshot (C3): flow growth by a pass after the headline; root = first regression", () => {
  const target = `${B}>div:nth-child(3)>div:nth-child(2)`;
  const ctl = realDiff(loadGz("notification-pin.dump.json.gz"));
  const r = realDiff(
    plantFlowGrowth(loadGz("notification-pin.dump.json.gz"), target, "table_percent_widths", 10),
  );
  assert.equal(r.headline.box.path, ctl.headline.box.path);
  const reg = r.regressions_by_layer.table_percent_widths;
  // Pre-order: the grown box's EXIT (height) precedes every following box it pushed down.
  assert.equal(reg.first_box.type, "exit");
  assert.equal(reg.first_box.path, target);
  assert.ok(reg.box_events_vs_previous_layer > 1);
  assert.ok(reg.text_events_vs_previous_layer > 0);
  // The pass-effect row names the ORIGIN first, not html/body that merely absorbed the growth.
  const eff = r.layer_stats.find((s) => s.layer === "table_percent_widths").effect_vs_previous;
  assert.equal(eff.top_box_regressions[0].path, target);
  assert.equal(
    r.headline.first_pass_regression.box.path,
    ctl.headline.first_pass_regression.box.path,
  );
});

test("real snapshot (C2): runs pushed down by a pass name the pass, not L0", () => {
  const layer = "fixed_table_widths";
  const ctl = realDiff(loadGz("notification-pin.dump.json.gz"));
  const r = realDiff(
    plantFlowGrowth(
      loadGz("notification-pin.dump.json.gz"),
      `${B}>div:nth-child(1)>div:nth-child(1)`,
      layer,
      10,
    ),
  );
  const before = new Map(ctl.text_events.map((t, i) => [i, t]));
  let pushed = 0;
  r.text_events.forEach((t, i) => {
    const c = before.get(i);
    const prev = c.per_layer.painted_table_cell_text_baselines.dy;
    if (Math.abs(t.per_layer[layer].dy - prev - 10) > 0.01) return;
    pushed += 1;
    // Every pushed run the +10 made worse (it was not 10 px ABOVE Chromium) names the pass.
    if (prev > -0.5) {
      assert.ok(
        t.regressed_by.some((w) => w.layer === layer && w.coord === "dy"),
        `"${t.text}" regressed_by ${JSON.stringify(t.regressed_by)}`,
      );
    }
    // (dominant_layer is NOT asserted: a later natural pass can move the same run further on
    // another coordinate, e.g. table_percent_widths fixing dx by 119 px.)
  });
  assert.ok(pushed >= 8, `pushed runs: ${pushed}`);
});

// ---- lost boxes, N0 (Blitz on the source HTML), generated text ----

test("a box Blitz lays out but the walk drops is a divergence (LOST at L0)", () => {
  const dump = syntheticDump();
  // div#b exists in Blitz's tree (B0) but vellora's walk never emits it.
  for (const layer of dump.layers) {
    const i = layer.boxes.findIndex((b) => b[0] === ID.b);
    layer.boxes.splice(i, 1);
    for (const run of layer.runs) if (run[0] > i) run[0] -= 1;
  }
  for (const meta of dump.runs) if (meta.box > 3) meta.box -= 1;
  const r = run(dump);
  assert.equal(r.headline.box.path, PATHS.b);
  assert.equal(r.headline.box.status_in_final, "missing");
  assert.equal(r.headline.box.first_over_tolerance, "L0");
  assert.deepEqual(
    r.headline.box.regressed_by.map((w) => [w.layer, w.kind]),
    [["L0", "missing"]],
  );
  assert.equal(r.headline.first_walk_regression.box.path, PATHS.b);
  assert.equal(r.missing_boxes[0].path, PATHS.b);
  assert.equal(r.missing_boxes[0].missing_from, "L0");
  assert.match(attributionText(r.headline.box, r.final_layer, r), /BOX LOST/);
});

test("a Chromium box with no vellora box in ANY layer counts as a divergence", () => {
  const records = chromeRecords();
  const extra = `${PATHS.b}>div:nth-child(2)`;
  records.push({
    path: extra,
    kind: "element",
    tag: "div",
    parent: 5,
    box: { x: 0, y: 60, w: 600, h: 20 },
    display: "block",
    position: "static",
    fragments: [],
    text: null,
  });
  const r = run(syntheticDump(), records);
  assert.equal(r.headline.box.path, extra);
  assert.equal(r.headline.box.first_over_tolerance, "B0");
  assert.equal(r.headline.first_missing.path, extra);
});

test("N0 present: a change html_normalize makes is attributed to B0 (HTML_NORMALIZE), not raw Blitz", () => {
  const source = { ...syntheticDump(), html_normalize: "skipped" };
  const dump = syntheticDump();
  dump.normalize = { wrappers_recorded: 1, wrappers_located: 1 };
  // Blitz on html_normalize's output places p 4px lower; Blitz on the source HTML does not.
  dump.blitz_tree.find((b) => b.id === ID.p).y += 4;
  for (const layer of dump.layers) setBox(dump, layer.name, ID.p, { y: 4 });
  const r = run(dump, chromeRecords(), {}, source);
  assert.deepEqual(
    r.layers.slice(0, 3).map((l) => [l.name, l.kind]),
    [
      ["N0", "blitz-source"],
      ["B0", "blitz"],
      ["L0", "walk"],
    ],
  );
  assert.equal(r.headline.box.path, PATHS.p);
  assert.equal(r.headline.box.per_layer.N0.status, "ok");
  assert.equal(r.headline.box.first_over_tolerance, "B0");
  assert.equal(ownRegression(r.headline.box, "B0").kind, "worsened");
  assert.equal(r.headline.first_html_normalize_regression.box.path, PATHS.p);
  assert.match(attributionText(r.headline.box, r.final_layer, r), /^HTML_NORMALIZE/);
  assert.equal(r.html_normalize.source_layer, "N0");
});

test("N0 present: raw Blitz divergence is attributed to N0; without N0, B0 is not called raw", () => {
  const shifted = () => {
    const d = syntheticDump();
    d.blitz_tree.find((b) => b.id === ID.a).w += 5;
    for (const layer of d.layers) setBox(d, layer.name, ID.a, { w: 5 });
    return d;
  };
  const source = { ...shifted(), html_normalize: "skipped" };
  const withN0 = run(shifted(), chromeRecords(), {}, source);
  assert.equal(withN0.headline.box.first_over_tolerance, "N0");
  assert.match(attributionText(withN0.headline.box, withN0.final_layer, withN0), /^RAW BLITZ/);
  const altered = shifted();
  altered.normalize = { wrappers_recorded: 2, wrappers_located: 2 };
  const noN0 = run(altered);
  assert.equal(noN0.headline.box.first_over_tolerance, "B0");
  assert.match(
    attributionText(noN0.headline.box, noN0.final_layer, noN0),
    /NOT separated \(no N0 layer/,
  );
  // html_normalize changed nothing => B0 IS Blitz on the source HTML.
  const unchanged = run(shifted());
  assert.match(
    attributionText(unchanged.headline.box, unchanged.final_layer, unchanged),
    /^RAW BLITZ/,
  );
});

test("N0 keys the source DOM: a box html_normalize's re-parse re-keyed is LOST at B0", () => {
  const source = { ...syntheticDump(), html_normalize: "skipped" };
  const dump = syntheticDump();
  // The re-parsed normalized DOM keys p differently (e.g. after a hoisted wrapper).
  dump.nodes.find((n) => n.id === ID.p).path = `${PATHS.b}>p:nth-child(2)`;
  const r = run(dump, chromeRecords(), {}, source);
  const lost = r.missing_boxes.find((m) => m.path === PATHS.p);
  assert.equal(lost.missing_from, "B0");
  assert.deepEqual(lost.present_in, ["N0", "N0u"]);
  assert.equal(r.headline.first_html_normalize_regression.box.path, PATHS.p);
});

test("pseudo-element generated text is compared like any text", () => {
  const records = chromeRecords();
  // Chromium: div#a::before { content: "Hello"; display: block } and no direct text.
  const a = records.findIndex((x) => x.path === PATHS.a);
  records[a + 1] = {
    ...records[a + 1],
    path: `${PATHS.a}>::before`,
    kind: "pseudo",
    tag: null,
    display: "block",
  };
  const r = run(syntheticDump(), records);
  assert.equal(r.text.chrome_generated_fragments, 1);
  assert.equal(r.text.matched_pairs, 2);
  assert.equal(r.text.unmatched_chrome_fragments_total, 0);
});
