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
