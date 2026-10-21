// The gate's own detection canaries (gate/canaries.mjs): all caught on committed data, each one
// UNCAUGHT when the rule it guards is broken (the canary of the canary), and an uncaught canary is
// an absolute failure of the gate.
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gateCanaryItems, runGateCanaries } from "../canaries.mjs";
import { compareSnapshots } from "../compare.mjs";
import { applyLedger, ledgerProblems, relaxedB, transitionProblems } from "../debt.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const step07 = loadBaselineDir(join(baselines, "port", "07-media-print"));
const PASSES = [
  "auto_table_compact_columns",
  "painted_table_cell_text_baselines",
  "table_percent_widths",
];

const caughtBy = (rows) => Object.fromEntries(rows.map((r) => [r.canary, r.caught]));

test("every gate canary is caught on the committed 07 baseline (real seeds) and on synthetic seeds", () => {
  for (const run of [step07, null]) {
    const rows = runGateCanaries({ run, passes: PASSES });
    assert.equal(rows.length, 11);
    assert.ok(
      rows.every((r) => r.caught === true && r.ran === true && r.oracle === "gate"),
      JSON.stringify(rows.filter((r) => !r.caught)),
    );
    assert.deepEqual(gateCanaryItems(rows), []);
  }
  // The real seeds are real: a word, a failing WPT test, a flagged pass, a verdict row of 07.
  const rows = runGateCanaries({ run: step07, passes: PASSES });
  assert.match(rows[0].mustReport, /^real word /);
  assert.match(rows[1].mustReport, /^real test /);
  assert.match(rows[2].mustReport, /^real row /);
  assert.match(rows[4].mustReport, /^real flagged pass /);
});

test("a comparator that hides within-tolerance worsening (the D4 hole) leaves the head canary uncaught", () => {
  const hiding = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return { ...r, items: r.items.filter((i) => i.class !== "within-tolerance") };
  };
  const c = caughtBy(runGateCanaries({ run: step07, passes: PASSES, compare: hiding }));
  assert.equal(c["head ratchet: |dy| +0.6 pt per step over two steps"], false);
});

test("a comparator that treats fail -> unsupported as 'changed' (the D5 hole) leaves the WPT canary uncaught", () => {
  const old = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return {
      ...r,
      items: r.items.map((i) =>
        i.class === "rejection" && i.check === "wpt"
          ? { ...i, class: "changed", gating: false }
          : i,
      ),
    };
  };
  const c = caughtBy(runGateCanaries({ run: step07, passes: PASSES, compare: old }));
  assert.equal(c["WPT fail -> unsupported (new strict-gate rejection)"], false);
  assert.equal(c["head ratchet: |dy| +0.6 pt per step over two steps"], true);
});

test("a comparator that does not count flagged-pass losses (D6) leaves its canary uncaught", () => {
  const uncounted = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return { ...r, counts: { ...r.counts, flaggedPassLost: 0 } };
  };
  const c = caughtBy(runGateCanaries({ run: step07, compare: uncounted }));
  assert.equal(c["WPT flagged pass lost"], false);
});

test("a ledger that ignores ceilings, compensators, transitions, owners, collapse or relaxed (b) leaves those canaries uncaught", () => {
  const noCeiling = (hr, l, o) => {
    const r = applyLedger(hr, l, o);
    return {
      ...r,
      items: r.items.map((i) =>
        i.class === "debt-exceeded" ? { ...i, class: "debt", gating: false } : i,
      ),
    };
  };
  const noRegate = (hr, l, o) => applyLedger(hr, l, { ...o, passes: null });
  const c1 = caughtBy(runGateCanaries({ run: step07, passes: PASSES, apply: noCeiling }));
  assert.equal(c1["DEBT rules i/ii: uncovered, within ceiling, beyond ceiling"], false);
  const c2 = caughtBy(runGateCanaries({ run: step07, passes: PASSES, apply: noRegate }));
  assert.equal(c2["DEBT rule v: compensator pass deleted"], false);
  const c3 = caughtBy(
    runGateCanaries({
      run: step07,
      transition: (o, n, x) => transitionProblems(o, n, x).filter((p) => !/ceiling/.test(p)),
    }),
  );
  assert.equal(c3["DEBT rule iii: ceiling raised, entry added, entry dropped early"], false);
  const c4 = caughtBy(
    runGateCanaries({
      run: step07,
      ledgerCheck: (l, o) => ledgerProblems(l, o).filter((p) => !/closesAt|rule vi/.test(p)),
    }),
  );
  assert.equal(c4["DEBT rule iv: vellora-owned entry without a retirement step"], false);
  assert.equal(c4["DEBT rule vi: displaced words not collapsed"], false);
  const c5 = caughtBy(
    runGateCanaries({ run: step07, relaxed: (e) => relaxedB(e).filter((p) => !/\|run\|/.test(p)) }),
  );
  assert.equal(c5["relaxed (b): |run| > |N0|, unnamed compensator, no owner"], false);
});

test("an uncaught gate canary becomes an absolute failure item", () => {
  const items = gateCanaryItems([
    { oracle: "gate", canary: "x", mustReport: "m", observed: "o", caught: false, ran: true },
  ]);
  assert.deepEqual(
    items.map((i) => [i.key, i.class, i.gating]),
    [["canary|gate|x", "failure", true]],
  );
});
