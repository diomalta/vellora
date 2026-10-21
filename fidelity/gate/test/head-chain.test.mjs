// The head ratchet and the pin view on the committed chain (no render): the head of the chain,
// 07-media-print, gated post-hoc against 06 with --head 00-start and the (empty) DEBT.json, and
// classed against the shipped main (pin). Numbers are asserted so a change of the rules or of
// the committed data is visible here; their reading is in fidelity/baselines/port/README.md
// ("Head ratchet and debt ledger").
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DEBT_FILE, loadDebt } from "../debt.mjs";
import { evaluateGate } from "../run.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const load = (...p) => loadBaselineDir(join(baselines, ...p));
const PASSES = [
  "auto_table_compact_columns",
  "painted_table_cell_text_baselines",
  "table_percent_widths",
];

const s06 = load("port", "06-page-rules");
const s07 = load("port", "07-media-print");
const head = { dir: "fidelity/baselines/port/00-start", snapshot: load("port", "00-start") };
const pin = { dir: "fidelity/baselines/pin", snapshot: load("pin") };
const r = evaluateGate({
  before: s06,
  after: s07,
  head,
  pin,
  accept: s07.manifest.acceptedRegressions,
  declared: s07.manifest.declaredRejections ?? [],
  ledger: loadDebt(DEBT_FILE),
  passes: PASSES,
});
const tally = (items, f) => {
  const out = {};
  for (const i of items) out[f(i)] = (out[f(i)] ?? 0) + 1;
  return out;
};

test("the committed DEBT.json is the empty vellora-fidelity/debt/1 ledger", () => {
  const l = loadDebt(DEBT_FILE);
  assert.equal(l.schema, "vellora-fidelity/debt/1");
  assert.deepEqual(l.entries, []);
  assert.deepEqual(r.ledger.problems, []);
});

test("07 vs 06 is unchanged link to link, but 985 items are worse than the head (00-start) and none is covered", () => {
  assert.equal(r.counts.gating, 0);
  assert.equal(r.head.counts.gating, 985);
  assert.equal(r.verdict, "FAIL");
  assert.deepEqual(
    tally(r.head.items, (i) => `${i.check} ${i.headClass}`),
    {
      "pdf-probe regression": 922,
      "wpt regression": 38,
      "wpt rejection": 10,
      "value regression": 13,
      "status regression": 2,
    },
  );
  assert.ok(r.head.items.every((i) => i.class === "head-regression" && i.gating));
  // The 10 step-06 rejections (css:page-varying-width) gate against the head too: undeclared.
  assert.equal(r.head.items.filter((i) => i.headClass === "rejection").length, 10);
  // 07's manifest has no class-a acceptance: every legacy acceptance is ignored by the head.
  assert.equal(r.head.acceptancesCounted, 0);
  // All 11 gate canaries are caught on this run.
  assert.ok(r.gateCanaries.every((c) => c.caught === true));
});

test("pin view of 07: 213 items worse than the shipped main, all (c) while the ledger is empty", () => {
  assert.deepEqual(r.pin.counts, { a: 0, b: 0, c: 213, declared: 0 });
  assert.equal(r.pin.mainMerge, "BLOCKED");
  assert.deepEqual(
    tally(r.pin.items, (i) => i.check),
    { "pdf-probe": 140, wpt: 56, value: 15, status: 2 },
  );
  // The pin view reports; it gates only for a merge to main (--main).
  assert.equal(
    evaluateGate({ before: s06, after: s07, pin, main: true, canaries: false }).counts.gating,
    213,
  );
});
