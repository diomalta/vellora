// Builders for hermetic matcher tests: a synthetic Chromium record list and a synthetic vellora
// dump (same JSON shape as crates/vellora-core/examples/layout_dump.rs) for one small tree.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));

export function loadGz(name) {
  return JSON.parse(gunzipSync(readFileSync(join(here, "data", name))).toString("utf8"));
}

/**
 * Tree: html > body > [div#a (block, text "Hello"), div#b > p (text "World")].
 * `boxes` maps path -> [x, y, w, h] for Chromium; the dump starts identical.
 */
export const PATHS = {
  html: "html",
  body: "html>body:nth-child(2)",
  a: "html>body:nth-child(2)>div:nth-child(1)",
  b: "html>body:nth-child(2)>div:nth-child(2)",
  p: "html>body:nth-child(2)>div:nth-child(2)>p:nth-child(1)",
};

export const BOXES = {
  html: [0, 0, 600, 100],
  body: [0, 0, 600, 100],
  a: [0, 0, 600, 20],
  b: [0, 20, 600, 80],
  p: [0, 30, 600, 20],
};

export function chromeRecords(boxes = BOXES) {
  const rec = (path, kind, tag, parent, box, extra = {}) => ({
    path,
    kind,
    tag,
    parent,
    box: box ? { x: box[0], y: box[1], w: box[2], h: box[3] } : null,
    display: kind === "element" ? "block" : null,
    position: "static",
    fragments: [],
    text: null,
    ...extra,
  });
  return [
    rec(PATHS.html, "element", "html", null, boxes.html),
    rec("html>head:nth-child(1)", "element", "head", 0, null),
    rec(PATHS.body, "element", "body", 0, boxes.body),
    rec(PATHS.a, "element", "div", 2, boxes.a),
    rec(`${PATHS.a}>#text`, "text", null, 3, [0, 3, 40, 14], {
      text: "Hello",
      fragments: [{ x: 0, y: 3, w: 40, h: 14, start: 0, length: 5, text: "Hello" }],
    }),
    rec(PATHS.b, "element", "div", 2, boxes.b),
    rec(PATHS.p, "element", "p", 5, boxes.p),
    rec(`${PATHS.p}>#text`, "text", null, 6, [0, 33, 44, 14], {
      text: "World",
      fragments: [{ x: 0, y: 33, w: 44, h: 14, start: 0, length: 5, text: "World" }],
    }),
  ];
}

const IDS = { html: 1, body: 3, a: 4, ta: 5, b: 6, p: 7, tp: 8 };

/** A dump with B0 == L0 == every pass == Chromium; `mutate(dump)` breaks one layer. */
export function syntheticDump(boxes = BOXES) {
  const node = (id, kind, tag, path, parent) => ({
    id,
    kind,
    tag,
    id_attr: null,
    class: null,
    path,
    synthetic: false,
    parent,
    layout_parent: parent,
    inline_root: tag === "div" && path === PATHS.a ? true : tag === "p",
    display_outside: "Block",
    display_inside: "Flow",
  });
  const order = ["html", "body", "a", "b", "p"];
  const layerBoxes = () => [
    ...order.map((k) => [IDS[k], 0, ...boxes[k], 0, 0]),
    [IDS.ta, 3, 0, 0, 0, 0, 0, 0],
    [IDS.tp, 4, 0, 0, 0, 0, 0, 0],
  ];
  // Runs: "Hello" owned by div#a (box index 2), "World" by p (box index 4). Baseline = top + 11.
  const layerRuns = () => [
    [2, 0, 0, 14, 40],
    [4, 0, 0, 44, 44],
  ];
  const passes = ["pass_one", "pass_two"];
  return {
    schema: "vellora-layout-dump/1",
    viewport: { width_px: 600, height_px: 800 },
    page: { content_width: 600.4, content_height: 800 },
    media_type: "screen",
    normalize: { wrappers_recorded: 0, wrappers_located: 0 },
    passes,
    nodes: [
      node(IDS.html, "element", "html", PATHS.html, null),
      node(IDS.body, "element", "body", PATHS.body, IDS.html),
      node(IDS.a, "element", "div", PATHS.a, IDS.body),
      node(IDS.ta, "text", null, `${PATHS.a}>#text`, IDS.a),
      node(IDS.b, "element", "div", PATHS.b, IDS.body),
      node(IDS.p, "element", "p", PATHS.p, IDS.b),
      node(IDS.tp, "text", null, `${PATHS.p}>#text`, IDS.p),
    ],
    blitz_tree: order.map((k) => ({
      id: IDS[k],
      depth: 0,
      x: boxes[k][0],
      y: boxes[k][1],
      w: boxes[k][2],
      h: boxes[k][3],
      ux: boxes[k][0],
      uy: boxes[k][1],
      uw: boxes[k][2],
      uh: boxes[k][3],
      border: [0, 0, 0, 0],
      padding: [0, 0, 0, 0],
      inline_text: null,
    })),
    layers: ["L0", ...passes].map((name) => ({
      name,
      boxes: layerBoxes(),
      runs: layerRuns(),
    })),
    runs: [
      {
        box: 2,
        run: 0,
        owner: IDS.a,
        brush: IDS.a,
        line: 0,
        text: "Hello",
        font_size: 12,
        ascent: 11,
        descent: 3,
        face: "LiberationSans-Regular.ttf",
        glyphs: 5,
      },
      {
        box: 4,
        run: 0,
        owner: IDS.p,
        brush: IDS.p,
        line: 0,
        text: "World",
        font_size: 12,
        ascent: 11,
        descent: 3,
        face: "LiberationSans-Regular.ttf",
        glyphs: 5,
      },
    ],
    run_meta_mismatches: [],
    layer_order_violations: [],
  };
}

export const ID = IDS;

/**
 * Schema-2 variant of syntheticDump: raw Blitz text (`blitz_runs`, equal to L0's runs) and a
 * one-page pagination trace placing div#a and p at their flow positions (div#b is a flattened
 * wrapper and html/body are structural: pagination never places them). Flow gap a -> p = 10 px
 * (a ends at 20, p starts at 30) and the gap used is a's 10 px margin-bottom, so P == final.
 */
export function syntheticDumpV2(boxes = BOXES) {
  const dump = syntheticDump(boxes);
  dump.schema = "vellora-layout-dump/2";
  const raw = (owner, text, x, y, advance) => ({
    owner,
    brush: owner,
    line: 0,
    text,
    font_size: 12,
    ascent: 11,
    descent: 3,
    face: "LiberationSans-Regular.ttf",
    glyphs: text.length,
    x,
    y,
    advance,
    offset: 0,
    baseline: 11,
    block_offset: 0,
  });
  dump.blitz_runs = [raw(IDS.a, "Hello", 0, 14, 40), raw(IDS.p, "World", 0, 44, 44)];
  const place = (root, tag, nodeIds, top, bottom, extra) => ({
    kind: "block",
    root,
    root_tag: tag,
    node_ids: nodeIds,
    table_id: null,
    top,
    bottom,
    trailing_gap: 0,
    gap_source: "margin-bottom",
    page: 0,
    new_page: null,
    cursor_before: 0,
    pending_gap: 0,
    pending_gap_source: "none",
    gap_applied: 0,
    gap_note: "none",
    header_injected: null,
    placed_top: top,
    ...extra,
  });
  dump.pagination = {
    page_count: 1,
    groups_split: 0,
    placements: [
      place(IDS.a, "div", [IDS.a, IDS.ta], 0, 20, { trailing_gap: 10 }),
      place(IDS.p, "p", [IDS.p, IDS.tp], 30, 50, {
        cursor_before: 20,
        pending_gap: 10,
        pending_gap_source: "margin-bottom",
        gap_applied: 10,
        gap_note: "applied",
      }),
    ],
  };
  return dump;
}

// ---- planted defects on a real dump (same shape as the validator's in-pipeline injections) ----

const BOX_FIELD = { x: 2, y: 3, w: 4, h: 5 };

function layersFrom(dump, fromLayer) {
  const k = dump.layers.findIndex((l) => l.name === fromLayer);
  if (k < 0) throw new Error(`no layer ${fromLayer}`);
  return dump.layers.slice(k);
}

function nodeIdOf(dump, path) {
  const node = dump.nodes.find((n) => n.path === path);
  if (!node) throw new Error(`no node ${path}`);
  return node.id;
}

/**
 * Move ONE box (not its runs, not its descendants) by `delta` in `fromLayer` and every later
 * layer: a pass that mis-places one box and the change persists (validator injection A).
 */
export function plantBoxShift(dump, path, fromLayer, delta) {
  const id = nodeIdOf(dump, path);
  for (const layer of layersFrom(dump, fromLayer)) {
    const box = layer.boxes.find((b) => b[0] === id);
    for (const [k, v] of Object.entries(delta)) box[BOX_FIELD[k]] += v;
  }
  return dump;
}

/**
 * A pass makes one box `grow` px taller in `fromLayer` and every later layer, with flow
 * consequences: its ancestors grow by the same amount and every box after its subtree (walk
 * order), with its text runs, moves down (validator injection C).
 */
export function plantFlowGrowth(dump, path, fromLayer, grow) {
  const id = nodeIdOf(dump, path);
  const parentOf = new Map(dump.nodes.map((n) => [n.id, n.parent]));
  const ancestors = new Set();
  for (let p = parentOf.get(id); p !== null && p !== undefined; p = parentOf.get(p)) {
    ancestors.add(p);
  }
  for (const layer of layersFrom(dump, fromLayer)) {
    const i = layer.boxes.findIndex((b) => b[0] === id);
    const depth = layer.boxes[i][1];
    let end = i + 1;
    while (end < layer.boxes.length && layer.boxes[end][1] > depth) end += 1;
    layer.boxes.forEach((b, j) => {
      if (j === i || ancestors.has(b[0])) b[BOX_FIELD.h] += grow;
      if (j >= end) b[BOX_FIELD.y] += grow;
    });
    for (const run of layer.runs) if (run[0] >= end) run[3] += grow;
  }
  return dump;
}
