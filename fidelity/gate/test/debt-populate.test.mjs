// DEBT.json builder (gate/debt-populate.mjs): the pure classification rules, and the committed
// first population (baselines/port/DEBT.json, 2026-10-27) re-checked against the ledger's own
// rules and the committed head report it was built from.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import {
  ceilingOf,
  classifyVectorItem,
  classifyWptItem,
  groupEntries,
  introducedBy,
} from "../debt-populate.mjs";
import { DEBT_FILE, d7KeyProblems, entryProblems, loadDebt, relaxedB } from "../debt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SNAP = resolve(here, "..", "snapshots", "2026-10-27", "10-debt");

// The boleto barcode digit of the 10-tip run (layer-vector geometry mapping): N0 28.531 px, P -3.
const BARCODE = {
  unit: "px",
  N0: 28.531,
  B0: 28.531,
  L0: 28.531,
  painted_table_cell_text_baselines: 28.531,
  table_percent_widths: 28.531,
  auto_table_compact_columns: 28.531,
  P: 25.531,
  run: 26.467,
};
const WORD = { key: "pdf-probe|boleto|p1|9#1|dy", check: "pdf-probe", before: 17.37, after: 19.85 };

test("a vector item enters with exactly its over-tolerance steps as compensators", () => {
  assert.deepEqual(classifyVectorItem(WORD, BARCODE), { ok: true, compensators: ["P"] });
  assert.equal(ceilingOf(WORD), 19.85);
  assert.equal(ceilingOf({ ...WORD, after: -1.234 }), 1.23);
  assert.equal(ceilingOf({ key: "x|posErrMm", tolClass: "position-mm", after: 2.09 }), 2.09);
});

test("no vector, |run| > |N0|, or a vector that does not describe the run: residual", () => {
  assert.match(classifyVectorItem(WORD, null).why, /no committed layer vector/);
  assert.match(
    classifyVectorItem(WORD, { ...BARCODE, N0: 1, B0: 1, L0: 1 }).why,
    /relaxed \(b\) rule fails/,
  );
  // run 3.52 px from P: P is not the word's PDF position (10-tip invoice p3 words).
  const v = { unit: "px", N0: 1.984, P: 1.984, run: -1.533 };
  assert.match(classifyVectorItem(WORD, v).why, /does not describe the run/);
  // The DANFE-L1d spec anchor: 0.626 px above P, beyond the 0.5 px position-mm run tolerance.
  const l1d = { unit: "px", N0: 23.903, P: 23.903, run: 24.529 };
  const item = { key: "danfe|DANFE-L1d|corpus||criterion#1|posErrMm", tolClass: "position-mm" };
  assert.match(
    classifyVectorItem({ ...item, after: 6.49 }, l1d).why,
    /\|run\| 24.529 > \|N0\| 23.903/,
  );
});

test("WPT route (b) only when raw Blitz fails the same way (outcome and page counts)", () => {
  const item = { key: "wpt|t", test: "t", after: "fail" };
  const rec = (raw) => ({
    outcome: "fail",
    rawOutcome: raw.outcome,
    comparisons: [{ pageCounts: [2, 2] }],
    raw: { comparisons: [{ pageCounts: raw.pages }] },
  });
  assert.equal(classifyWptItem(item, rec({ outcome: "fail", pages: [2, 2] })).ok, true);
  // monolithic-overflow-014 at 10-tip: raw fails with pages [4, 1].
  assert.match(classifyWptItem(item, rec({ outcome: "fail", pages: [4, 1] })).why, /differently/);
  assert.match(classifyWptItem(item, rec({ outcome: "pass", pages: [2, 2] })).why, /not the run/);
  assert.match(classifyWptItem(item, null).why, /no record/);
});

test("introducedBy is the first link that has the key; grouping by fixture, owner, compensators, link", () => {
  const links = [
    { link: "01-a", keys: new Set(["k2"]) },
    { link: "04-b", keys: new Set(["k1", "k2"]) },
  ];
  assert.equal(introducedBy("k1", links, "10-x"), "04-b");
  assert.equal(introducedBy("k2", links, "10-x"), "01-a");
  assert.equal(introducedBy("k3", links, "10-x"), "10-x");
  const owner = { layer: "blitz:x", component: "c" };
  const r = (key, compensators, link) => ({
    fixture: "boleto",
    owner,
    compensators,
    introducedBy: link,
    evidence: ["e"],
    keyRecord: { key },
  });
  const e = groupEntries([r("a", ["P"], "04-b"), r("b", ["P"], "04-b"), r("c", [], "04-b")]);
  assert.deepEqual(
    e.map((x) => [x.id, x.keys.map((k) => k.key)]),
    [
      ["DEBT-10-boleto-1", ["a", "b"]],
      ["DEBT-10-boleto-2", ["c"]],
    ],
  );
});

test("the committed ledger: 26 entries, 1024 keys, every key passes D7 against the committed head report", () => {
  const ledger = loadDebt(DEBT_FILE);
  assert.equal(ledger.entries.length, 26);
  const report = JSON.parse(
    gunzipSync(readFileSync(join(SNAP, "gate-report-10-integration-nodebt.json.gz"))).toString(),
  );
  const head = new Map(report.head.items.map((i) => [i.key, i]));
  let keys = 0;
  for (const e of ledger.entries) {
    assert.deepEqual(entryProblems(e), [], e.id);
    assert.deepEqual(relaxedB(e), [], e.id);
    for (const k of e.keys) {
      keys++;
      assert.deepEqual(d7KeyProblems(e, k, head.get(k.key)), [], k.key);
    }
  }
  assert.equal(keys, 1024);
});
