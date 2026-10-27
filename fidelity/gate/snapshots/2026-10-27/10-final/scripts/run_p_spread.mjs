#!/usr/bin/env node
// Chrome DOM -> PDF offset as a layer vector sees it: run - P per mapped page-1 word, per fixture
// and axis, from a committed layer-vector.mjs output (rule ii of Phase B integration 5: the
// measurement the shared vector run tolerance, gate/tolerances.mjs VECTOR_RUN_TOLERANCE_PX, is
// checked against). P is the word's delta vs Chrome's continuous DOM layout after vellora's
// pagination, run its delta vs Chrome's PDF; on page 1 no page-break offset enters, so run - P is
// the difference of Chrome's two references plus vellora's PDF emit rounding.
//
//   node fidelity/gate/snapshots/2026-10-27/10-final/scripts/run_p_spread.mjs <repo root> \
//     [<repo-relative layer-vector file> ...]
// default file: fidelity/gate/snapshots/2026-10-27/10-debt/layer-vectors-head.json.gz
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gunzipSync } from "node:zlib";

const [root, ...files] = process.argv.slice(2);
if (!root) {
  process.stderr.write("usage: run_p_spread.mjs <repo root> [<layer-vector file>...]\n");
  process.exit(2);
}
const { VECTOR_RUN_TOLERANCE_PX } = await import(resolve(root, "fidelity/gate/tolerances.mjs"));
const inputs = files.length
  ? files
  : ["fidelity/gate/snapshots/2026-10-27/10-debt/layer-vectors-head.json.gz"];
const r3 = (v) => Math.round(v * 1000) / 1000;
const median = (a) =>
  a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
const out = { inputs, unit: "px", runTolerancePx: r3(VECTOR_RUN_TOLERANCE_PX), groups: {} };
let maxAbs = 0;
for (const f of inputs) {
  const buf = readFileSync(resolve(root, f));
  const doc = JSON.parse((f.endsWith(".gz") ? gunzipSync(buf) : buf).toString("utf8"));
  out.run ??= doc.run;
  for (const w of doc.words ?? []) {
    if (!w.mapped || w.page !== 1) continue;
    for (const axis of ["dx", "dy"]) {
      const v = w[axis]?.vector;
      if (typeof v?.P !== "number" || typeof v.run !== "number") continue;
      const k = `${w.fixture} ${axis}`;
      out.groups[k] ??= [];
      out.groups[k].push(v.run - v.P);
    }
  }
}
for (const [k, a] of Object.entries(out.groups)) {
  a.sort((x, y) => x - y);
  maxAbs = Math.max(maxAbs, Math.abs(a[0]), Math.abs(a.at(-1)));
  out.groups[k] = { n: a.length, median: r3(median(a)), min: r3(a[0]), max: r3(a.at(-1)) };
}
// + the pdf-probe resolution 0.01 pt in px: the largest offset the measurement can hide.
out.maxAbs = r3(maxAbs);
out.maxAbsPlusResolution = r3(maxAbs + 0.01 * (4 / 3));
out.covered = out.maxAbsPlusResolution <= VECTOR_RUN_TOLERANCE_PX;
process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
