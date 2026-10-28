#!/usr/bin/env node
// Phase C 03 tip (2026-10-28): shrink-only update of DEBT.json from ONE gated run, by the rule-iii
// routes of gate/debt.mjs (transitionProblems, fixedRemovalProblems):
//   - a key whose item still gates against the head (port/00-start; HEAD_GATING_CLASSES) stays,
//     with measured = the run's value and ceiling = min(old ceiling, the GATE-D7 ceiling of the
//     run's value); a ceiling is never raised (a worse value stays at its old ceiling and gates as
//     debt-exceeded);
//   - a key the run no longer produces leaves with a closed[] record keyVanished: true;
//   - every other key is FIXED: it leaves with { id, key, step, reason, fixed: true, runId,
//     headComparison: { class, before, after } } from the run's head comparison ("none" = no item).
// Ids are untouched (no key moves between entries); closed[] is append-only; no key is added.
// The head comparison is computed as gate/run.mjs computes it (`hr`): compareSnapshots(head, run)
// with the step's class-a acceptances and the declarations carried along the chain.
//
//   node fidelity/gate/snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs --run <run-all dir> \
//     --step 12-phase-c-03 --accept fidelity/gate/snapshots/2026-10-28/c03/accepted.json \
//     [--ledger fidelity/baselines/port/DEBT.json] --out <DEBT.json>
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareSnapshots, snapshotKeys } from "../../../../compare.mjs";
import { ceilingOf } from "../../../../debt-populate.mjs";
import { DEBT_FILE, HEAD_GATING_CLASSES } from "../../../../debt.mjs";
import { chainDeclarations } from "../../../../declarations.mjs";
import { readAcceptances, readDeclarations } from "../../../../run.mjs";
import { loadSnapshot } from "../../../../snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIDELITY = resolve(here, "..", "..", "..", "..", "..");
const argv = process.argv.slice(2);
const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
const ledgerFile = resolve(val("--ledger") ?? DEBT_FILE);
const runDir = resolve(val("--run"));
const step = val("--step");
const acceptFile = val("--accept") ? resolve(val("--accept")) : null;
if (!step || !val("--out")) throw new Error("--step and --out are required");

const cur = JSON.parse(readFileSync(ledgerFile, "utf8"));
const headDir = join(FIDELITY, "baselines", "port", "00-start");
const run = loadSnapshot(runDir);
const runId = run.provenance?.runId;
if (!/^\d{8}T\d{6}Z$/.test(runId ?? "")) throw new Error(`run id not found: ${runId}`);
const accept = readAcceptances(acceptFile).filter((e) => e.class === "a");
const carried = chainDeclarations({
  headDir,
  baselineDir: join(FIDELITY, "baselines", "port", "10-integration"),
  current: readDeclarations(acceptFile),
  step,
});
const hr = compareSnapshots(loadSnapshot(headDir), run, { accept, declared: carried.head });
const headItems = new Map(hr.items.map((i) => [i.key, i]));
const present = snapshotKeys(run);

const entries = [];
const closed = [...(cur.closed ?? [])];
const stats = { kept: 0, lowered: 0, worse: [], fixed: {}, vanished: 0 };
for (const e of cur.entries) {
  const keys = [];
  for (const k of e.keys) {
    const i = headItems.get(k.key);
    if (!present.has(k.key)) {
      closed.push({
        id: e.id,
        key: k.key,
        step,
        reason: `the run no longer produces the key (run ${runId})`,
        keyVanished: true,
        previousCeiling: k.ceiling,
        runId,
      });
      stats.vanished++;
      continue;
    }
    if (i?.gating !== false && i && HEAD_GATING_CLASSES.includes(i.class)) {
      let rec = k;
      if (typeof i.after === "number" && typeof k.ceiling === "number") {
        const c = ceilingOf(i);
        if (c > k.ceiling + 1e-9) stats.worse.push(`${e.id} ${k.key}: ${k.ceiling} -> ${c}`);
        else {
          if (c < k.ceiling - 1e-9) stats.lowered++;
          rec = { ...k, measured: i.after, ceiling: c };
        }
      }
      keys.push(rec);
      stats.kept++;
      continue;
    }
    const cls = i ? i.class : "none";
    stats.fixed[cls] = (stats.fixed[cls] ?? 0) + 1;
    closed.push({
      id: e.id,
      key: k.key,
      step,
      reason:
        "Phase C 03 tip (ledger + LayoutUnit + Chrome page box/auto-table + oversize-fragment slicing): fixed, no longer a gating head item (within tolerance of or better than port/00-start); rule iii fixed removal",
      previousCeiling: k.ceiling,
      valueAtStep: i?.after ?? null,
      evidence: `run ${runId}, head comparison port/00-start vs the run (gate/compare.mjs), built by fidelity/gate/snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs`,
      fixed: true,
      runId,
      headComparison: { class: cls, before: i?.before ?? null, after: i?.after ?? null },
    });
  }
  if (keys.length) entries.push({ ...e, keys });
}
const nk = entries.reduce((s, e) => s + e.keys.length, 0);
const note = `${cur.note} Shrunk 2026-10-28 at Phase C 03 tip (phasec/03-tip, step ${step}) from run ${runId}: ${entries.length} entries / ${nk} keys kept (still gating against port/00-start), ${closed.length - (cur.closed ?? []).length} keys closed (fixed or vanished) by fidelity/gate/snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs.`;
writeFileSync(
  resolve(val("--out")),
  `${JSON.stringify({ ...cur, note, entries, closed }, null, 2)}\n`,
);
process.stdout.write(
  `shrink-ledger: ${entries.length} entries, ${nk} keys (kept ${stats.kept}, ceilings lowered ${stats.lowered}); closed fixed ${JSON.stringify(stats.fixed)}, vanished ${stats.vanished}; worse (kept at old ceiling) ${stats.worse.length}\n${stats.worse.join("\n")}\nids: ${entries.map((e) => `${e.id}(${e.keys.length})`).join(" ")}\n`,
);
