// The Phase C ledger-shrink recipe (gate/snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs).
// Step-4 verify: its closed[] reason was hard-coded to "Phase C 03 tip (...)", so the c04 shrink
// labelled its closures as step 03's (relabelled by hand in 3545ce4). The label is now a required
// parameter; these tests pin that, and the three routes (kept, fixed, vanished).
import assert from "node:assert/strict";
import { test } from "node:test";
import { shrinkLedger } from "../snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs";

const RUN = "20261028T034745Z";
const ledger = () => ({
  schema: "vellora-fidelity/debt/2",
  note: "ledger.",
  entries: [
    {
      id: "DEBT-X-1",
      class: "b",
      keys: [
        {
          key: "wpt|still-failing.html",
          tolClass: "count",
          headValue: "pass",
          ceiling: "fail",
          measured: "fail",
        },
        {
          key: "wpt|fixed.html",
          tolClass: "count",
          headValue: "pass",
          ceiling: "fail",
          measured: "fail",
        },
        {
          key: "wpt|gone.html",
          tolClass: "count",
          headValue: "pass",
          ceiling: "fail",
          measured: "fail",
        },
      ],
    },
  ],
  closed: [
    {
      id: "DEBT-OLD",
      key: "wpt|old.html",
      step: "12-phase-c-03",
      reason: "Phase C 03 tip (...): fixed",
    },
  ],
});
const headItems = new Map([
  [
    "wpt|still-failing.html",
    {
      key: "wpt|still-failing.html",
      class: "regression",
      gating: true,
      before: "pass",
      after: "fail",
    },
  ],
  [
    "wpt|fixed.html",
    { key: "wpt|fixed.html", class: "improvement", gating: false, before: "fail", after: "pass" },
  ],
]);
const present = new Set(["wpt|still-failing.html", "wpt|fixed.html"]);

test("closed[] reasons and the note carry the given label, not a hard-coded step", () => {
  const label = "Phase C 05 probe (multicol evidence)";
  const { ledger: out, stats } = shrinkLedger({
    cur: ledger(),
    headItems,
    present,
    runId: RUN,
    step: "14-phase-c-05",
    label,
  });
  const added = out.closed.slice(1);
  assert.equal(added.length, 2);
  const fixed = added.find((c) => c.key === "wpt|fixed.html");
  assert.ok(fixed.reason.startsWith(`${label}: fixed`), fixed.reason);
  assert.ok(!fixed.reason.includes("Phase C 03"), fixed.reason);
  assert.equal(fixed.step, "14-phase-c-05");
  assert.equal(fixed.fixed, true);
  assert.equal(fixed.runId, RUN);
  assert.deepEqual(fixed.headComparison, { class: "improvement", before: "fail", after: "pass" });
  const gone = added.find((c) => c.key === "wpt|gone.html");
  assert.equal(gone.keyVanished, true);
  assert.ok(
    out.note.includes(label) &&
      out.note.includes("14-phase-c-05") &&
      !out.note.includes("Phase C 03"),
  );
  assert.deepEqual(stats.fixed, { improvement: 1 });
  assert.equal(stats.vanished, 1);
});

test("a still-gating key stays; closed[] is append-only; ids are untouched", () => {
  const cur = ledger();
  const { ledger: out } = shrinkLedger({
    cur,
    headItems,
    present,
    runId: RUN,
    step: "s",
    label: "L",
  });
  assert.deepEqual(
    out.entries.map((e) => [e.id, e.keys.map((k) => k.key)]),
    [["DEBT-X-1", ["wpt|still-failing.html"]]],
  );
  assert.deepEqual(out.closed[0], cur.closed[0]);
  assert.equal(cur.entries[0].keys.length, 3, "the input ledger is not mutated");
});

test("the label is required", () => {
  for (const label of [undefined, "", "   "]) {
    assert.throws(
      () => shrinkLedger({ cur: ledger(), headItems, present, runId: RUN, step: "s", label }),
      /label is required/,
    );
  }
});
