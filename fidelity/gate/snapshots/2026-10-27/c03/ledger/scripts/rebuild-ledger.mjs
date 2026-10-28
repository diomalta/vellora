#!/usr/bin/env node
// Phase C 03 (2026-10-27): rebuild DEBT.json after the step-02 shrink so that it passes rule iii
// against the frozen 10-integration ledger (fidelity/baselines/port/DEBT-BASE.json):
//   1. ids: every kept key returns to the id of its 10-integration entry (step 02's populate
//      renumbered DEBT-10-* ids onto other keys); the 9 keys that were listed scope keys of
//      DEBT-10-text-stress-ptbr-page-scope get fresh DEBT-11-* ids (one per introducedBy group).
//      Entry metadata (owner, compensators, introducedBy, evidence) is step 02's, recomputed on the
//      c02 vectors.
//   2. the 7 WPT keys step 02 closed while they still failed (DEBT-10-wpt-1/2/3) are restored
//      verbatim from the base (ceilings "fail") and their 7 closed[] records dropped.
//   3. every other closed[] record (a key no longer a head item at c02) gets the fixed-removal
//      evidence rule iii now requires: fixed: true, runId, headComparison { class, before, after }
//      of the head comparison (port/00-start vs the recording run, gate/compare.mjs, the head's
//      carried declarations); class "none" = no item.
//
//   node fidelity/gate/snapshots/2026-10-27/c03/ledger/scripts/rebuild-ledger.mjs \
//     --run <run-all-c02-20261027T231548Z copy> [--ledger fidelity/baselines/port/DEBT.json] \
//     [--base <frozen 10-integration ledger>] --out fidelity/baselines/port/DEBT.json
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "../../../../../compare.mjs";
import { freshId, ledgerIds } from "../../../../../debt-populate.mjs";
import { DEBT_FILE, HEAD_GATING_CLASSES } from "../../../../../debt.mjs";
import { chainDeclarations } from "../../../../../declarations.mjs";
import { loadSnapshot } from "../../../../../snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIDELITY = resolve(here, "..", "..", "..", "..", "..", "..");
const argv = process.argv.slice(2);
const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
const ledgerFile = resolve(val("--ledger") ?? DEBT_FILE);
const baseFile = resolve(
  val("--base") ??
    join(FIDELITY, "gate", "snapshots", "2026-10-27", "10-final", "DEBT-10-integration.json"),
);
const runDir = resolve(val("--run"));
const STEP = "11-collapse-comp";
const cur = JSON.parse(readFileSync(ledgerFile, "utf8"));
const base = JSON.parse(readFileSync(baseFile, "utf8"));

// The recording run's head comparison (what evaluateGate computes as `hr`).
const headDir = join(FIDELITY, "baselines", "port", "00-start");
const run = loadSnapshot(runDir);
const runId = run.provenance?.runId;
if (runId !== "20261027T231548Z") throw new Error(`expected run 20261027T231548Z, got ${runId}`);
const carried = chainDeclarations({
  headDir,
  baselineDir: join(FIDELITY, "baselines", "port", "10-integration"),
  current: [],
  step: STEP,
});
const hr = compareSnapshots(loadSnapshot(headDir), run, { accept: [], declared: carried.head });
const headItems = new Map(hr.items.map((i) => [i.key, i]));

// 1. ids.
const baseIdOf = new Map();
for (const e of base.entries) for (const k of e.keys) baseIdOf.set(k.key, e.id);
const taken = new Set([...ledgerIds(base), ...ledgerIds(cur)]);
const entries = [];
for (const e of cur.entries) {
  const parts = new Map();
  for (const k of e.keys) {
    const id = baseIdOf.get(k.key) ?? `NEW|${e.introducedBy}`;
    if (!parts.has(id)) parts.set(id, []);
    parts.get(id).push(k);
  }
  for (const [id, keys] of parts) {
    const fixture = keys[0].key.startsWith("pdf-probe|")
      ? keys[0].key.split("|")[1]
      : keys[0].key.split("|")[0];
    entries.push({
      ...e,
      id: id.startsWith("NEW|") ? freshId(`DEBT-11-${fixture}`, taken) : id,
      keys,
    });
  }
}
// 2. the 7 WPT keys, verbatim from the base.
const wptIds = new Set();
for (const e of base.entries.filter((x) => x.keys.every((k) => k.key.startsWith("wpt|")))) {
  const still = e.keys.filter((k) => {
    const i = headItems.get(k.key);
    return i?.gating && HEAD_GATING_CLASSES.includes(i.class);
  });
  if (still.length !== e.keys.length) throw new Error(`${e.id}: not every key still fails`);
  wptIds.add(e.id);
  entries.push({
    ...e,
    evidence: [
      ...e.evidence,
      `Restored at Phase C 03 (2026-10-27): phasec/02 closed these keys while they still failed (run ${runId}: pass -> fail vs port/00-start, rawOutcome not recorded by that run); rule iii never removes a still-failing key. The raw-Blitz evidence (rawOutcome) is still the 10-tip run's, not re-measured at c02.`,
    ],
  });
}
const order = new Map(base.entries.map((e, n) => [e.id, n]));
entries.sort(
  (a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9) || a.id.localeCompare(b.id),
);
// 3. closed[].
const closed = [];
let dropped = 0;
for (const c of cur.closed) {
  if (wptIds.has(c.id)) {
    dropped++;
    continue;
  }
  const i = headItems.get(c.key);
  if (i?.gating && HEAD_GATING_CLASSES.includes(i.class)) {
    throw new Error(`${c.id} ${c.key}: still a gating head item at ${runId}`);
  }
  closed.push({
    ...c,
    reason:
      "Phase C 02 collapsed-border compensation: fixed, no longer a head item (within tolerance of or better than port/00-start); rule iii fixed removal",
    fixed: true,
    runId,
    headComparison: i
      ? { class: i.class, before: i.before ?? null, after: i.after ?? null }
      : { class: "none", before: null, after: null },
  });
}
const note = `${cur.note} Rebuilt 2026-10-27 at Phase C 03 (phasec/03-ledger) to pass rule iii against the frozen 10-integration ledger (baselines/port/DEBT-BASE.json): kept keys carry their 10-integration entry ids again (step 02 had renumbered DEBT-10-* ids onto other keys), the 9 keys that were listed scope keys of DEBT-10-text-stress-ptbr-page-scope take fresh DEBT-11-* ids, the 7 WPT keys of DEBT-10-wpt-1/2/3 that step 02 closed while still failing are restored with their old ceilings, and each of the other ${closed.length} closed[] records carries fixed: true, its run id and its head comparison (port/00-start vs run ${runId}). Built by fidelity/gate/snapshots/2026-10-27/c03/ledger/scripts/rebuild-ledger.mjs.`;
const out = { ...cur, note, entries, closed };
writeFileSync(resolve(val("--out")), `${JSON.stringify(out, null, 2)}\n`);
const nk = entries.reduce((s, e) => s + e.keys.length, 0);
const byClass = {};
for (const c of closed)
  byClass[c.headComparison.class] = (byClass[c.headComparison.class] ?? 0) + 1;
process.stdout.write(
  `rebuild-ledger: ${entries.length} entries, ${nk} keys; closed ${closed.length} (dropped ${dropped} WPT); head classes ${JSON.stringify(byClass)}\nids: ${entries.map((e) => `${e.id}(${e.keys.length})`).join(" ")}\n`,
);
