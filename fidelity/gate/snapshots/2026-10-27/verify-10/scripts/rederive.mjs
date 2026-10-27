import fs from "node:fs";
import path from "node:path";
import z from "node:zlib";

const root = process.argv[2];
const run = process.argv[3];
const rd = (p) =>
  JSON.parse(p.endsWith(".gz") ? z.gunzipSync(fs.readFileSync(p)) : fs.readFileSync(p));
const debt = rd(path.join(root, "fidelity/baselines/port/DEBT.json"));
const rep = rd(
  path.join(
    root,
    "fidelity/gate/snapshots/2026-10-27/10-debt/gate-report-10-integration-nodebt.json.gz",
  ),
);
const headItems = new Map(rep.head.items.map((i) => [i.key, i]));
const files = new Map();
const vec = (ref) => {
  const at = ref.indexOf("#");
  const f = ref.slice(0, at);
  const k = ref.slice(at + 1);
  if (!files.has(f)) files.set(f, rd(path.join(root, f)));
  const d = files.get(f);
  if (d.vectors?.[k]) return d.vectors[k];
  const w = (d.words ?? []).find((x) => x.item === k);
  return w?.[w.axis]?.vector ?? null;
};
const wpt = new Map(rd(path.join(run, "wpt/results.json")).tests.map((t) => [t.test, t]));
const PX = { "pdf-probe-pt": 4 / 3, "position-mm": 96 / 25.4 };
const RUNTOL = { "pdf-probe-pt": 4 / 3, "position-mm": 0.5 };
const probs = [];
const stats = { keys: 0, pWorse: [], runWorse: [], away: [], wpt: [] };
for (const e of debt.entries)
  for (const k of e.keys) {
    stats.keys++;
    const h = headItems.get(k.key);
    if (!h) {
      probs.push(`${k.key}: not a head item of the nodebt report`);
      continue;
    }
    if (JSON.stringify(h.before) !== JSON.stringify(k.headValue))
      probs.push(`${k.key}: headValue ${k.headValue} != before ${h.before}`);
    if (JSON.stringify(h.after) !== JSON.stringify(k.measured))
      probs.push(`${k.key}: measured ${k.measured} != after ${h.after}`);
    if (k.key.startsWith("wpt|")) {
      const t = wpt.get(k.key.slice(4));
      const pc = t.comparisons?.[0]?.pageCounts;
      const rpc = t.rawComparisons?.[0]?.pageCounts ?? t.raw?.comparisons?.[0]?.pageCounts;
      if (!(t.outcome === k.measured && t.rawOutcome === k.measured && k.rawOutcome === k.measured))
        probs.push(`${k.key}: outcome ${t.outcome} raw ${t.rawOutcome}`);
      if (JSON.stringify(pc) !== JSON.stringify(rpc))
        probs.push(`${k.key}: pages ${JSON.stringify(pc)} raw ${JSON.stringify(rpc)}`);
      stats.wpt.push(
        `${k.key} ${t.outcome}/${t.rawOutcome} pages ${JSON.stringify(pc)} raw ${JSON.stringify(rpc)} keys=${Object.keys(t).join(",")}`,
      );
      continue;
    }
    const v = vec(k.layerVectorRef);
    if (!v) {
      probs.push(`${k.key}: no vector`);
      continue;
    }
    const conv = PX[k.tolClass];
    const runTol = RUNTOL[k.tolClass];
    const runInUnit = v.run / conv;
    if (Math.abs(runInUnit - k.measured) > 0.011)
      probs.push(`${k.key}: run ${runInUnit.toFixed(3)} != measured ${k.measured}`);
    if (k.ceiling > Math.abs(k.measured) + 0.01 + 1e-9)
      probs.push(`${k.key}: ceiling ${k.ceiling} > |measured|+res`);
    if (Math.abs(v.run) > Math.abs(v.N0) + runTol + 1e-9) probs.push(`${k.key}: |run|>|N0|+tol`);
    if (typeof v.P === "number" && Math.abs(v.run - v.P) > runTol + 1e-9)
      probs.push(`${k.key}: |run-P| ${(v.run - v.P).toFixed(3)}`);
    const layers = Object.keys(v).filter((x) => x !== "unit");
    const steps = [];
    for (let i = 1; i < layers.length; i++)
      steps.push([
        layers[i],
        v[layers[i]] - v[layers[i - 1]],
        Math.abs(v[layers[i]]) - Math.abs(v[layers[i - 1]]),
      ]);
    const over = steps
      .filter(([l, s]) => l !== "run" && Math.abs(s) > 0.5 + 1e-9)
      .map(([l]) => l)
      .sort();
    if (JSON.stringify(over) !== JSON.stringify([...e.compensators].sort()))
      probs.push(`${k.key}: over-tol steps ${over} vs compensators ${e.compensators}`);
    if (typeof v.P === "number" && Math.abs(v.P) > Math.abs(v.N0) + 0.5)
      stats.pWorse.push(`${k.key} ${JSON.stringify(v)}`);
    if (Math.abs(v.run) > Math.abs(v.N0) + 1e-9)
      stats.runWorse.push(`${k.key} N0 ${v.N0} P ${v.P} run ${v.run}`);
    const away = steps.filter(([l, , da]) => l !== "run" && da > 0.5);
    if (away.length) stats.away.push(`${k.key} ${JSON.stringify(v)}`);
  }
console.log("keys", stats.keys, "problems", probs.length);
for (const p of probs.slice(0, 40)) console.log(" P", p);
console.log("WPT:");
for (const x of stats.wpt) console.log(" ", x);
console.log(
  "|P| > |N0| + 0.5 px (vellora layers net worse than raw Blitz in DOM terms):",
  stats.pWorse.length,
);
for (const x of stats.pWorse.slice(0, 15)) console.log(" ", x);
console.log("|run| > |N0| (any):", stats.runWorse.length);
for (const x of stats.runWorse.slice(0, 10)) console.log(" ", x);
console.log("keys with a vellora step growing |d| by > 0.5 px:", stats.away.length);
for (const x of stats.away.slice(0, 10)) console.log(" ", x);
