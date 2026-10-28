// Schema-2 dump layers: raw Blitz text (N0/B0 `blitz_runs`) and pagination (P). Per
// fidelity/README.md every attribution path is shown to catch a planted defect: a raw Blitz text
// shift -> B0, a reader-only text shift -> L0 vs raw B0, a pagination drift -> P (with the
// pre-pagination headline untouched), plus the n/a rules (unaligned raw run, unplaced box).
import assert from "node:assert/strict";
import { test } from "node:test";
import { diffLayouts } from "../lib/match.mjs";
import { renderMarkdown } from "../lib/report.mjs";
import { paginationLayer, velloraModel } from "../lib/vellora-model.mjs";
import { ID, PATHS, chromeRecords, syntheticDump, syntheticDumpV2 } from "./helpers.mjs";

const BASELINES = new Map([["Liberation Sans|400|12", { ascent: 11, descent: 3 }]]);
const run = (dump, sourceDump = null) =>
  diffLayouts({
    chrome: chromeRecords(),
    vellora: velloraModel(dump, { sourceDump }),
    baselines: BASELINES,
  });
const report = (result) =>
  renderMarkdown({ fixture: "synthetic", label: "test", env: {}, parity: [], result });

test("schema 1 dump: no raw text in B0, no P layer (unchanged behaviour)", () => {
  const r = run(syntheticDump());
  assert.deepEqual(
    r.layers.map((l) => [l.name, l.has_text]),
    [
      ["B0", false],
      ["L0", true],
      ["pass_one", true],
      ["pass_two", true],
    ],
  );
  assert.equal(r.post_pagination_layer, null);
  assert.equal(r.pagination, null);
  assert.equal(r.headline.first_pagination_regression, null);
  assert.equal(r.text_events[0].per_layer.B0.status, "n/a");
});

test("schema 2 dump identical to Chromium: raw text and P present, nothing diverges", () => {
  const r = run(syntheticDumpV2());
  assert.deepEqual(
    r.layers.map((l) => [l.name, l.kind, l.has_text]),
    [
      ["B0", "blitz", true],
      ["L0", "walk", true],
      ["pass_one", "pass", true],
      ["pass_two", "pass", true],
      ["P", "pagination", true],
    ],
  );
  assert.equal(r.final_layer, "pass_two");
  assert.equal(r.post_pagination_layer, "P");
  assert.equal(r.headline.box, null);
  assert.equal(r.headline.text, null);
  assert.equal(r.headline.first_pagination_regression.box, null);
  assert.equal(r.headline.first_pagination_regression.text, null);
  for (const t of r.text_events) {
    assert.equal(t.per_layer.B0.status, "ok");
    assert.equal(t.per_layer.P.status, "ok");
  }
  // Structural / flattened-wrapper boxes pagination never places are n/a in P, never LOST.
  const body = r.boxes.find((b) => b.path === PATHS.body);
  assert.equal(body.layers.P, null);
  assert.equal(r.regressions_by_layer.P.by_kind.missing, 0);
  assert.equal(r.pagination.final_boxes_not_placed, 3);
  assert.equal(r.pagination.placements[1].flow_gap, 10);
  assert.equal(r.pagination.placements[1].drift, 0);
});

test("raw Blitz text shift is attributed to B0 (raw Blitz), not to vellora's reader", () => {
  const dump = syntheticDumpV2();
  dump.blitz_runs[1].x += 3;
  for (const layer of dump.layers) layer.runs[1][2] += 3;
  const r = run(dump);
  assert.equal(r.headline.text.text, "World");
  assert.equal(r.headline.text.first_over_tolerance, "B0");
  assert.equal(r.headline.text.per_layer.B0.dx, 3);
  assert.equal(r.headline.first_walk_regression.text, null);
  assert.match(report(r), /RAW BLITZ\/PARLEY TEXT on html_normalize's output \(B0\)/);
});

test("a text shift only in vellora's reader is attributed to L0 vs raw Blitz text", () => {
  const dump = syntheticDumpV2();
  for (const layer of dump.layers) layer.runs[1][3] -= 4; // a reader shift, 4 px up (e.g. the block_offset dropped before phaseb/04)
  const r = run(dump);
  assert.equal(r.headline.text.text, "World");
  assert.equal(r.headline.text.first_over_tolerance, "L0");
  assert.equal(r.headline.text.per_layer.B0.status, "ok");
  assert.equal(r.headline.first_walk_regression.text.text, "World");
  assert.deepEqual(
    r.headline.first_walk_regression.text.regressed_by.map((w) => [w.layer, w.coord]),
    [["L0", "dy"]],
  );
  assert.match(report(r), /VELLORA TEXT READER: raw Blitz text \(B0\) is ok/);
});

test("pagination drift is attributed to P and leaves the pre-pagination headline alone", () => {
  const dump = syntheticDumpV2();
  // pagination applies a 5 px gap where the flow has 10 px: p and its text land 5 px high.
  const p = dump.pagination.placements[1];
  p.gap_applied = 5;
  p.pending_gap = 5;
  p.placed_top = 25;
  const r = run(dump);
  assert.equal(r.headline.box, null, "pre-pagination layers are all fine");
  assert.equal(r.headline.text, null);
  const pr = r.headline.first_pagination_regression;
  assert.equal(pr.box.path, PATHS.p);
  assert.equal(pr.box.type, "enter");
  assert.equal(pr.box.first_over_tolerance, "P");
  assert.equal(pr.box.per_layer.P.dy, -5);
  assert.equal(pr.text.text, "World");
  assert.equal(pr.text.per_layer.P.dy, -5);
  assert.equal(r.regressions_by_layer.P.box_events_vs_previous_layer, 1);
  assert.equal(r.pagination.placements[1].drift, -5);
  const md = report(r);
  assert.match(md, /## Pagination \(layer P\)/);
  assert.match(md, /placements whose gap used differs from the flow gap by > 0.5 px: 1/);
  assert.match(md, /PAGINATION: every pre-pagination layer is within tolerance/);
});

test("P re-anchors later pages at their first fragment; a thead takes its first injection", () => {
  const finalLayer = {
    boxes: new Map([
      ["h", { id: 1, x: 0, y: 100, w: 10, h: 10 }],
      ["r1", { id: 2, x: 0, y: 110, w: 10, h: 10 }],
      ["r2", { id: 3, x: 0, y: 900, w: 10, h: 10 }],
      ["r3", { id: 4, x: 0, y: 912, w: 10, h: 10 }],
    ]),
    runs: [],
  };
  const header = { table_id: 9, node_ids: [1], top: 100, height: 10 };
  const trace = {
    page_count: 2,
    placements: [
      { page: 0, top: 110, bottom: 120, placed_top: 110, node_ids: [2], header_injected: header },
      // page 2: header repeated at 0, row at 10 (offset -890), next row 2 px too high.
      { page: 1, top: 900, bottom: 910, placed_top: 10, node_ids: [3], header_injected: header },
      { page: 1, top: 912, bottom: 922, placed_top: 20, node_ids: [4], header_injected: null },
    ],
  };
  const { layer, summary } = paginationLayer(trace, finalLayer, new Map());
  assert.equal(layer.boxes.get("h").y, 100, "first injection, page 1: in place");
  assert.equal(layer.boxes.get("r1").y, 110);
  assert.equal(layer.boxes.get("r2").y, 900, "first fragment of page 2 anchors the page");
  assert.equal(layer.boxes.get("r3").y, 910, "2 px in-page drift");
  assert.deepEqual(
    summary.placements.map((r) => r.drift),
    [0, 0, -2],
  );
});

test("an L0 run without an aligned raw run is n/a in B0, not lost", () => {
  const dump = syntheticDumpV2();
  dump.blitz_runs.pop();
  const r = run(dump);
  const world = r.text_events.find((t) => t.text === "World");
  assert.equal(world.per_layer.B0.status, "n/a");
  assert.equal(r.headline.text, null);
});

test("raw text of a Blitz anonymous block folds into its parent element's owner key", () => {
  const dump = syntheticDumpV2();
  dump.nodes.push({
    id: 99,
    kind: "anonymous",
    tag: "div",
    id_attr: null,
    class: null,
    path: `${PATHS.a}>::blitz-anon(1)`,
    synthetic: false,
    parent: ID.a,
    layout_parent: ID.a,
    inline_root: true,
    display_outside: "Block",
    display_inside: "Flow",
  });
  dump.blitz_runs[0].owner = 99;
  dump.blitz_runs[0].x += 2;
  const r = run(dump);
  const hello = r.text_events.find((t) => t.text === "Hello");
  // Aligned (not n/a) and measured: the planted +2 px is raw Blitz's, the walk is 2 px closer.
  assert.equal(hello.per_layer.B0.status, "diverged");
  assert.equal(hello.per_layer.B0.dx, 2);
  assert.equal(hello.per_layer.L0.dx, 0);
});

test("raw Blitz text no L0 run pairs with is reported as text the walk never reads", () => {
  const dump = syntheticDumpV2();
  dump.blitz_runs.push({ ...dump.blitz_runs[0], text: "generated", x: 50 });
  const r = run(dump);
  assert.equal(r.blitz_text_unread_by_walk.B0.count, 1);
  assert.equal(r.blitz_text_unread_by_walk.B0.sample[0].text, "generated");
  assert.match(report(r), /## Raw Blitz text vellora's walk never reads/);
});

test("N0 raw text from the source dump is the first text layer", () => {
  const dump = syntheticDumpV2();
  const source = structuredClone(dump);
  source.html_normalize = "skipped";
  source.pagination = null;
  source.blitz_runs[1].y += 3; // raw Blitz on the SOURCE html puts "World" 3 px low
  for (const d of [dump]) {
    d.blitz_runs[1].y += 3;
    for (const layer of d.layers) layer.runs[1][3] += 3;
  }
  const r = run(dump, source);
  assert.deepEqual(
    r.layers.slice(0, 2).map((l) => [l.name, l.has_text]),
    [
      ["N0", true],
      ["B0", true],
    ],
  );
  assert.equal(r.headline.text.first_over_tolerance, "N0");
  assert.match(report(r), /RAW BLITZ\/PARLEY TEXT: Blitz's own placement/);
});
