#!/usr/bin/env node
// pdf-probe v2 deltas of a (possibly partial) run-all dir against committed baselines, with the
// gate's own comparePdfProbe (fidelity/gate/compare.mjs, GATE-P1): per fixture, the items worse
// beyond tolerance, the within-tolerance worsening and the improvements, plus the summed |dx| and
// |dy| of every pair. A measurement aid for port step 10-spark (a partial run cannot be gated:
// GATE-R1); the merge verdict is the full gated run's.
//
//   node fidelity/gate/snapshots/2026-10-22/10-spark/probe-delta.mjs --run <run-all dir>
//     --baseline <dir> [--baseline <dir>]... [--base-run <run-all dir>]... [--fixtures a,b] [--list]
import { resolve } from "node:path";
import { comparePdfProbe } from "../../../compare.mjs";
import { loadBaselineDir, loadRunDir } from "../../../snapshot.mjs";

const args = process.argv.slice(2);
const baselines = [];
let run = null;
let fixtures = null;
let list = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--run") run = resolve(args[++i]);
  else if (args[i] === "--baseline") baselines.push(resolve(args[++i]));
  else if (args[i] === "--base-run") baselines.push(`run:${resolve(args[++i])}`);
  else if (args[i] === "--fixtures") fixtures = new Set(args[++i].split(","));
  else if (args[i] === "--list") list = true;
}
const after = loadRunDir(run).pdfProbe ?? {};
const sum = (sec, axis) =>
  Math.round(sec.pairs.reduce((s, p) => s + Math.abs(p[axis]), 0) * 100) / 100;
for (const dir of baselines) {
  const before =
    (dir.startsWith("run:") ? loadRunDir(dir.slice(4)) : loadBaselineDir(dir)).pdfProbe ?? {};
  console.log(`\n== vs ${dir}`);
  for (const fx of Object.keys(after).sort()) {
    if (fixtures && !fixtures.has(fx)) continue;
    const items = [];
    const counts = {};
    comparePdfProbe(before[fx] ? { [fx]: before[fx] } : {}, { [fx]: after[fx] }, items, counts);
    const gating = items.filter((x) => x.gating);
    const wt = items.filter((x) => x.class === "within-tolerance");
    const better = items.filter((x) => x.class === "improvement");
    const b = before[fx];
    const a = after[fx];
    const sums = b
      ? `sum|dx| ${sum(b, "dx")} -> ${sum(a, "dx")}, sum|dy| ${sum(b, "dy")} -> ${sum(a, "dy")}`
      : "no baseline section";
    const off = (a.offPage?.vellora ?? []).length;
    console.log(
      `${fx}: gating ${gating.length}, within-tolerance ${wt.length}, improvement ${better.length}; ${sums}; off-page now ${off}`,
    );
    if (list) for (const g of gating) console.log(`   ${g.key}: ${g.before} -> ${g.after}`);
  }
}
