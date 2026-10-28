// The head ratchet and the pin view on the committed chain (no render): the latest link
// port/11-phase-c gated in-process against the link it was written from (port/10-integration)
// with --head port/00-start, the committed DEBT.json, the rule-iii base DEBT-BASE.json names and
// the contract's merge-to-main pin view. Every count must equal the committed gate of that step:
// 11-phase-c's manifest.json gate.counts and the post-hoc --contract re-gate report in
// gate/snapshots/2026-10-28/c06/ (the DOC-* counts need the run's doc aggregate and are checked
// by that re-gate, not here). Their reading is in fidelity/baselines/port/README.md.
//
// Until the 2026-10-28 prune this file also replayed 07 vs 06, 09 vs 08 (head 1409 / 1386, pin
// (c) 1150 / 1140, empty ledger), the merged-09 snapshot and its candidates, and 10-integration vs
// 09 with the 10-integration ledger (pin (c) 165). Those links and snapshots were removed, so the
// checks were deleted; they live at the local tag fidelity-archive-2026-10-28 (b5c9546).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { DEBT_FILE, loadDebt, resolveLedgerBase } from "../debt.mjs";
import { chainDeclarations } from "../declarations.mjs";
import { evaluateGate } from "../run.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const baselines = join(repo, "fidelity", "baselines");
const load = (...p) => loadBaselineDir(join(baselines, ...p));
const STEP = "15-phase-c-06-tip";
const s10 = load("port", "10-integration");
const s11 = load("port", "11-phase-c");
const head = { dir: "fidelity/baselines/port/00-start", snapshot: load("port", "00-start") };
const pin = { dir: "fidelity/baselines/pin", snapshot: load("pin") };
const carried = chainDeclarations({
  headDir: join(baselines, "port", "00-start"),
  baselineDir: join(baselines, "port", "10-integration"),
  current: s11.manifest.declaredRejections ?? [],
  step: STEP,
});
// The rule-iii base exactly as the gate resolves it on this branch while main has no DEBT.json:
// the frozen ledger the committed pointer DEBT-BASE.json names, sha256-checked.
const pointer = JSON.parse(readFileSync(join(baselines, "port", "DEBT-BASE.json"), "utf8"));
const base = loadDebt(join(repo, pointer.ledger));
const contract = JSON.parse(
  gunzipSync(
    readFileSync(
      join(here, "..", "snapshots", "2026-10-28", "c06", "gate-report-c06-tip-contract.json.gz"),
    ),
  ).toString(),
);
const g = evaluateGate({
  before: s10,
  after: s11,
  head,
  pin,
  accept: s11.manifest.acceptedRegressions,
  declared: s11.manifest.declaredRejections ?? [],
  headDeclared: carried.head,
  pinDeclared: carried.pin,
  ledger: loadDebt(DEBT_FILE),
  ledgerBase: base,
  step: STEP,
  main: true,
});

test("the committed DEBT.json is a debt/2 ledger of 2 entries / 5 keys, byte-identical to its frozen rule-iii base", () => {
  const l = loadDebt(DEBT_FILE);
  assert.equal(l.schema, "vellora-fidelity/debt/2");
  assert.equal(l.migratedFrom, undefined);
  assert.deepEqual(
    l.entries.map((e) => [e.id, e.keys.length]),
    [
      ["DEBT-10-wpt-1", 4],
      ["DEBT-10-wpt-2", 1],
    ],
  );
  assert.equal(pointer.step, STEP);
  assert.equal(readFileSync(DEBT_FILE, "utf8"), readFileSync(join(repo, pointer.ledger), "utf8"));
  // The gate's own resolution with main lacking a DEBT.json (stubbed git): the pointer's frozen
  // ledger, sha256-checked, no refusal.
  const git = (args) =>
    args[0] === "merge-base" ? { status: 0, stdout: "0123456789abcdef\n" } : { status: 1 };
  const r = resolveLedgerBase({ git });
  assert.equal(r.refusal, null, r.refusal);
  assert.deepEqual(r.ledger, base);
  assert.match(
    r.source,
    /DEBT-BASE\.json -> fidelity\/gate\/snapshots\/2026-10-28\/c06\/DEBT-c06-tip\.json/,
  );
  assert.deepEqual(g.ledger.problems, []);
});

test("11-phase-c vs 10-integration with the ledger and --main: PASS, the committed counts link to link", () => {
  assert.equal(g.verdict, "PASS");
  const { docRegressions, contractPagesFailing, ...want } = s11.manifest.gate.counts;
  assert.deepEqual([docRegressions, contractPagesFailing], [0, 0]);
  assert.deepEqual(g.counts, want);
  const { docRegressions: d2, contractPagesFailing: p2, ...fromReport } = contract.counts;
  assert.deepEqual(g.counts, fromReport);
});

test("head view (vs port/00-start): 0 gating, the 5 DEBT keys are debt, 5 class-a acceptances, 10 declared", () => {
  assert.deepEqual(g.head.counts, contract.head.counts);
  assert.equal(g.head.counts.gating, 0);
  assert.equal(g.head.counts.debt, 5);
  assert.equal(g.head.counts.accepted, 5);
  assert.equal(g.head.counts.declared, 10);
  // The 10 declared are step 06's css:page-varying-width rejections, carried from the supplement
  // (baselines/port/declared-rejections.json) by step ordinal, not from a link directory.
  const declared = g.head.items.filter((i) => i.class === "declared");
  assert.equal(declared.length, 10);
  assert.ok(declared.every((i) => i.declaredAs.feature === "css:page-varying-width"));
  const ledgerKeys = loadDebt(DEBT_FILE).entries.flatMap((e) => e.keys.map((k) => k.key));
  assert.deepEqual(
    g.head.items
      .filter((i) => i.class === "debt")
      .map((i) => i.key)
      .sort(),
    [...ledgerKeys].sort(),
  );
});

test("pin view (vs the shipped main) under --main: (a) 5, (b) 4, (c) 0, declared 10, merge OK", () => {
  assert.deepEqual(g.pin.counts, { a: 5, b: 4, c: 0, declared: 10 });
  assert.deepEqual(g.pin.counts, contract.pin.counts);
  assert.equal(g.counts.pinC, 0);
});

test("every gate canary is caught on this run", () => {
  assert.equal(g.gateCanaries.length, 32);
  assert.ok(g.gateCanaries.every((c) => c.caught === true));
});
