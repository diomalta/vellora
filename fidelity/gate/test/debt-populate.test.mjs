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
  PAGINATION_CLOSES_AT,
  TABLE_SPACING_UA_SHEET,
  ceilingOf,
  classifyVectorItem,
  classifyWptItem,
  freshId,
  groupEntries,
  introducedBy,
  ledgerIds,
  pageCriterionKey,
  pageScopeEntries,
  tableSpacingHintFixtures,
  wordOwnerComponent,
} from "../debt-populate.mjs";
import {
  DEBT_FILE,
  HEAD_GATING_CLASSES,
  d7KeyProblems,
  entryProblems,
  ledgerProblems,
  loadDebt,
  pageScopeD7Problems,
  relaxedB,
  transitionProblems,
} from "../debt.mjs";
import { pageMetricValues } from "../run.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SNAP = resolve(here, "..", "snapshots", "2026-10-27", "10-debt");
// The ledger as committed at port step 10-integration, frozen when Phase C 02 shrank DEBT.json.
const LEDGER_10 = resolve(
  here,
  "..",
  "snapshots",
  "2026-10-27",
  "10-final",
  "DEBT-10-integration.json",
);
const SNAP_C02 = resolve(here, "..", "snapshots", "2026-10-27", "c02");
const SNAP_C03_TIP = resolve(here, "..", "snapshots", "2026-10-28", "c03");
// The ledger step's rebuild (15 entries / 187 keys), frozen when the c03 tip shrank DEBT.json.
const LEDGER_C03_REBUILD = join(SNAP_C03_TIP, "DEBT-c03-ledger-rebuild.json");
const SNAP_C04_TIP = resolve(here, "..", "snapshots", "2026-10-28", "c04");
// The c03 tip shrink (3 entries / 7 keys), frozen when the c04 tip shrank DEBT.json.
const LEDGER_C03_TIP = join(SNAP_C04_TIP, "DEBT-c03-tip.json");
const BASELINES = resolve(here, "..", "..", "baselines");

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
  // The DANFE-L1d spec anchor: 0.626 px above P. Rule (ii) (2026-10-27): inside the shared
  // 1.333 px run tolerance -> (b) with no compensator; +1.5 px above P -> still refused.
  const l1d = { unit: "px", N0: 23.903, P: 23.903, run: 24.529 };
  const item = { key: "danfe|DANFE-L1d|corpus||criterion#1|posErrMm", tolClass: "position-mm" };
  assert.deepEqual(classifyVectorItem({ ...item, after: 6.49 }, l1d), {
    ok: true,
    compensators: [],
  });
  assert.match(
    classifyVectorItem({ ...item, after: 6.73 }, { ...l1d, run: 25.403 }).why,
    /\|run\| 25.403 > \|N0\| 23.903/,
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
  const e = groupEntries([r("a", ["P"], "04-b"), r("b", ["P"], "04-b"), r("c", [], "04-b")], {
    step: "10-integration",
  });
  assert.deepEqual(
    e.map((x) => [x.id, x.keys.map((k) => k.key)]),
    [
      ["DEBT-10-boleto-1", ["a", "b"]],
      ["DEBT-10-boleto-2", ["c"]],
    ],
  );
  // Rule iii, ids never reused (Phase C 03): a later step's population derives its prefix from
  // --step, skips every id a ledger has used, and keeps the base's id for keys the base holds.
  const later = groupEntries([r("a", ["P"], "04-b"), r("c", [], "04-b"), r("d", ["L0"], "04-b")], {
    step: "11-collapse-comp",
    takenIds: new Set(["DEBT-10-boleto-1", "DEBT-10-boleto-2", "DEBT-11-boleto-1"]),
    baseIdOf: (k) => ({ a: "DEBT-10-boleto-1", c: "DEBT-10-boleto-2" })[k] ?? null,
  });
  assert.deepEqual(
    later.map((x) => [x.id, x.keys.map((k) => k.key)]),
    [
      ["DEBT-10-boleto-1", ["a"]],
      ["DEBT-10-boleto-2", ["c"]],
      ["DEBT-11-boleto-2", ["d"]],
    ],
  );
  // A base id whose keys split into two groups: the first keeps it, the other takes a fresh id.
  const split = groupEntries([r("a", ["P"], "04-b"), r("b", [], "04-b")], {
    step: "11-collapse-comp",
    takenIds: new Set(["DEBT-10-boleto-1"]),
    baseIdOf: () => "DEBT-10-boleto-1",
  });
  assert.deepEqual(
    split.map((x) => x.id),
    ["DEBT-10-boleto-1", "DEBT-11-boleto-1"],
  );
  assert.throws(() => groupEntries([r("a", [], "04-b")], {}), /step id/);
  assert.equal(freshId("DEBT-11-x", new Set(["DEBT-11-x-1"])), "DEBT-11-x-2");
  assert.deepEqual(
    [...ledgerIds({ entries: [{ id: "A" }], closed: [{ id: "B", key: "k" }] })].sort(),
    ["A", "B"],
  );
});

test("the 10-integration ledger: 27 entries, 1026 keys, every key passes D7 against its head report", () => {
  const ledger = loadDebt(LEDGER_10);
  assert.equal(ledger.entries.length, 27);
  assert.deepEqual(ledgerProblems(ledger), []);
  const report = JSON.parse(
    gunzipSync(readFileSync(join(SNAP, "gate-report-10-integration-nodebt.json.gz"))).toString(),
  );
  const head = new Map(report.head.items.map((i) => [i.key, i]));
  // The listed page scope (rule vi') binds a page metric that is no head item: its head and run
  // values come from the snapshots (port/00-start and port/10-integration, the same run).
  const headValues = pageMetricValues(loadBaselineDir(join(BASELINES, "port", "00-start")));
  const runValues = pageMetricValues(loadBaselineDir(join(BASELINES, "port", "10-integration")));
  let keys = 0;
  let scoped = 0;
  for (const e of ledger.entries) {
    assert.deepEqual(entryProblems(e), [], e.id);
    assert.deepEqual(relaxedB(e), [], e.id);
    for (const k of e.keys) {
      keys++;
      const p = e.scope
        ? pageScopeD7Problems(e, k, { headValues, runValues, headItems: head })
        : d7KeyProblems(e, k, head.get(k.key));
      assert.deepEqual(p, [], k.key);
    }
    scoped += e.scope?.keys?.length ?? 0;
  }
  assert.equal(keys, 1026);
  assert.equal(scoped, 144);
});

// Phase C 02 (2026-10-27): DEBT.json shrunk from run 20261027T231548Z (snapshots/2026-10-27/c02):
// 10 entries, 180 keys, each a key the 10-integration ledger covered, no ceiling above its old one,
// every removed key recorded in closed[]; every key passes D7 against the c02 no-ledger re-gate.
test("the c03 ledger-step rebuild (frozen): 15 entries, 187 keys, rule iii vs the frozen 10-integration ledger", () => {
  const ledger = loadDebt(LEDGER_C03_REBUILD);
  const old = loadDebt(LEDGER_10);
  assert.equal(ledger.entries.length, 15);
  assert.deepEqual(ledgerProblems(ledger), []);
  const report = JSON.parse(
    gunzipSync(readFileSync(join(SNAP_C02, "gate-report-c02-nodebt.json.gz"))).toString(),
  );
  const head = new Map(report.head.items.map((i) => [i.key, i]));
  const oldKeys = new Map(old.entries.flatMap((e) => e.keys.map((k) => [k.key, { e, k }])));
  const oldScope = new Set(old.entries.flatMap((e) => e.scope?.keys ?? []));
  const kept = new Set();
  for (const e of ledger.entries) {
    assert.deepEqual(entryProblems(e), [], e.id);
    assert.deepEqual(relaxedB(e), [], e.id);
    assert.equal(e.scope, undefined, e.id);
    for (const k of e.keys) {
      kept.add(k.key);
      const o = oldKeys.get(k.key);
      assert.ok(o || oldScope.has(k.key), `${k.key}: not covered by the 10-integration ledger`);
      // Ids are never reused (rule iii): a kept key keeps its 10-integration entry id; the 9 former
      // scope keys take fresh DEBT-11-* ids.
      assert.equal(
        e.id,
        o ? o.e.id : e.id.startsWith("DEBT-11-") ? e.id : "(fresh DEBT-11-*)",
        k.key,
      );
      if (k.key.startsWith("wpt|")) {
        // Restored verbatim (step 02 closed them while they still failed).
        const { layerVector, ...rec } = k;
        assert.deepEqual(rec, o.k, k.key);
        continue;
      }
      assert.deepEqual(d7KeyProblems(e, k, head.get(k.key)), [], k.key);
      if (o && typeof o.k.ceiling === "number") assert.ok(k.ceiling <= o.k.ceiling + 1e-9, k.key);
    }
  }
  assert.equal(kept.size, 187);
  assert.equal([...kept].filter((k) => !oldKeys.has(k)).length, 9);
  const closed = new Map(ledger.closed.map((c) => [c.key, c]));
  for (const key of oldKeys.keys()) {
    if (!kept.has(key)) assert.ok(closed.has(key), `${key}: removed without a closed[] record`);
  }
  assert.equal(ledger.closed.length, 848);
  for (const c of ledger.closed) {
    assert.equal(c.fixed, true, c.key);
    assert.equal(c.runId, "20261027T231548Z", c.key);
    assert.ok(!HEAD_GATING_CLASSES.includes(c.headComparison.class), c.key);
    assert.equal(c.id, oldKeys.get(c.key).e.id, c.key);
  }
  // Rule iii against the frozen base on the c02 head items: no problem.
  assert.deepEqual(
    transitionProblems(old, ledger, { step: "11-collapse-comp", headItems: head }),
    [],
  );
});

// Phase C 03 tip (2026-10-28): DEBT.json shrunk from run 20261028T013052Z (phasec/03-tip; the
// script fidelity/gate/snapshots/2026-10-28/c03/scripts/shrink-ledger.mjs): only the 7 WPT keys
// of DEBT-10-wpt-1/2/3 still gate against port/00-start; the other 180 keys are fixed and leave
// with closed[] records of that run's head comparison. Rule iii against the frozen 10-integration
// base on the run's contract re-gate: no problem.
test("the c03 tip ledger (frozen at c04): 3 entries, 7 WPT keys, rule iii vs the frozen 10-integration ledger", () => {
  const ledger = loadDebt(LEDGER_C03_TIP);
  const prev = loadDebt(LEDGER_C03_REBUILD);
  const base = loadDebt(LEDGER_10);
  assert.deepEqual(ledgerProblems(ledger), []);
  assert.deepEqual(
    ledger.entries.map((e) => [e.id, e.keys.length]),
    [
      ["DEBT-10-wpt-1", 5],
      ["DEBT-10-wpt-2", 1],
      ["DEBT-10-wpt-3", 1],
    ],
  );
  const report = JSON.parse(
    gunzipSync(readFileSync(join(SNAP_C03_TIP, "gate-report-c03-tip-contract.json.gz"))).toString(),
  );
  const head = new Map(report.head.items.map((i) => [i.key, i]));
  for (const e of ledger.entries) {
    for (const k of e.keys) assert.equal(head.get(k.key)?.class, "debt", k.key);
  }
  const added = ledger.closed.slice(prev.closed.length);
  assert.deepEqual(ledger.closed.slice(0, prev.closed.length), prev.closed);
  assert.equal(added.length, 180);
  for (const c of added) {
    assert.equal(c.fixed, true, c.key);
    assert.equal(c.runId, "20261028T013052Z", c.key);
    assert.equal(c.step, "12-phase-c-03", c.key);
    assert.ok(!HEAD_GATING_CLASSES.includes(c.headComparison.class), c.key);
  }
  assert.deepEqual(
    transitionProblems(base, ledger, { step: "12-phase-c-03", headItems: head }),
    [],
  );
});

// Phase C 04 tip (2026-10-28): DEBT.json shrunk from run 20261028T034745Z (phasec/04-tip, step
// 13-phase-c-04, the c03 script shrink-ledger.mjs): floats-153 (DEBT-10-wpt-1) and
// inline-formatting-context-001 (DEBT-10-wpt-3) now pass (Blitz's floats feature) and leave as
// fixed with head class "none"; the other 5 keys still gate against port/00-start.
test("the committed ledger (c04 tip shrink): 2 entries, 5 WPT keys, rule iii vs the frozen 10-integration ledger", () => {
  const ledger = loadDebt(DEBT_FILE);
  const prev = loadDebt(LEDGER_C03_TIP);
  const base = loadDebt(LEDGER_10);
  assert.deepEqual(ledgerProblems(ledger), []);
  assert.deepEqual(
    ledger.entries.map((e) => [e.id, e.keys.length]),
    [
      ["DEBT-10-wpt-1", 4],
      ["DEBT-10-wpt-2", 1],
    ],
  );
  const report = JSON.parse(
    gunzipSync(readFileSync(join(SNAP_C04_TIP, "gate-report-c04-tip-contract.json.gz"))).toString(),
  );
  const head = new Map(report.head.items.map((i) => [i.key, i]));
  for (const e of ledger.entries) {
    for (const k of e.keys) assert.equal(head.get(k.key)?.class, "debt", k.key);
  }
  const added = ledger.closed.slice(prev.closed.length);
  assert.deepEqual(ledger.closed.slice(0, prev.closed.length), prev.closed);
  assert.deepEqual(
    added.map((c) => [c.id, c.key, c.headComparison.class]),
    [
      ["DEBT-10-wpt-1", "wpt|css/CSS2/floats-clear/floats-153.xht", "none"],
      ["DEBT-10-wpt-3", "wpt|css/CSS2/linebox/inline-formatting-context-001.xht", "none"],
    ],
  );
  for (const c of added) {
    assert.equal(c.fixed, true, c.key);
    assert.equal(c.runId, "20261028T034745Z", c.key);
    assert.equal(c.step, "13-phase-c-04", c.key);
  }
  assert.deepEqual(
    transitionProblems(base, ledger, { step: "13-phase-c-04", headItems: head }),
    [],
  );
});

test("rule vi': one listed page-scope entry per fixture whose page metric is unchanged vs the head", () => {
  const page = "fx|TXT-P1|corpus||criterion#1|pageDelta";
  const ref = "fx|REF-P|oracles:layout|plain|criterion#1|pageDelta";
  assert.equal(pageCriterionKey([ref, page]), page);
  const residual = [
    { key: "pdf-probe|fx|p3|b#1|dy", route: "page-scope", why: "w" },
    { key: "pdf-probe|fx|p2|a#1|dx", route: "page-scope", why: "w" },
    { key: "pdf-probe|gx|p2|a#1|dx", route: "page-scope", why: "w" },
    { key: "x|DANFE-L1d", route: "c", why: "w" },
  ];
  const opts = (h, r) => ({
    pageKeys: new Map([
      ["fx", [ref, page]],
      ["gx", ["gx|TXT-P1|corpus||criterion#1|pageDelta"]],
    ]),
    headValues: new Map([[page, h]]),
    runValues: new Map([[page, r]]),
    introduced: (k) => (k.includes("p3") ? "04-b" : "03-a"),
    pages: new Map([["fx", { vellora: 8, chrome: 7 }]]),
    step: "10-integration",
  });
  const { entries, left } = pageScopeEntries(residual, opts(1, 1));
  assert.equal(entries.length, 1);
  const e = entries[0];
  assert.equal(e.id, "DEBT-10-fx-page-scope-1");
  // Ids (rule iii): a taken id is skipped; the base's scope of the metric keeps its id only when it
  // lists every key again.
  const taken = { ...opts(1, 1), step: "11-x", takenIds: new Set(["DEBT-11-fx-page-scope-1"]) };
  assert.equal(pageScopeEntries(residual, taken).entries[0].id, "DEBT-11-fx-page-scope-2");
  const all = new Set(["pdf-probe|fx|p2|a#1|dx", "pdf-probe|fx|p3|b#1|dy"]);
  const baseScopeOf = (scopeKeys) => (k) => (k === page ? { id: "DEBT-10-old", scopeKeys } : null);
  assert.equal(
    pageScopeEntries(residual, { ...taken, baseScopeOf: baseScopeOf(all) }).entries[0].id,
    "DEBT-10-old",
  );
  assert.equal(
    pageScopeEntries(residual, {
      ...taken,
      baseScopeOf: baseScopeOf(new Set(["pdf-probe|fx|p2|a#1|dx"])),
    }).entries[0].id,
    "DEBT-11-fx-page-scope-2",
  );
  assert.deepEqual(e.scope, {
    fixture: "fx",
    fromPage: 2,
    keys: ["pdf-probe|fx|p2|a#1|dx", "pdf-probe|fx|p3|b#1|dy"],
  });
  assert.deepEqual(e.keys, [
    {
      key: page,
      tolClass: "page-delta",
      headValue: 1,
      ceiling: 1,
      measured: 1,
      layerVectorRef: null,
    },
  ]);
  assert.equal(e.introducedBy, "03-a");
  assert.equal(e.closesAt, PAGINATION_CLOSES_AT);
  assert.match(e.owner.component, /vellora 8, Chrome 7/);
  assert.deepEqual(entryProblems(e), []);
  assert.deepEqual(relaxedB(e), []);
  // gx has no head/run values: stays residual. A moved page metric (head 1, run 2) never binds.
  assert.deepEqual(
    left.map((x) => x.key),
    ["pdf-probe|gx|p2|a#1|dx"],
  );
  assert.equal(pageScopeEntries(residual, opts(1, 2)).entries.length, 0);
  assert.equal(pageScopeEntries(residual, opts(0, 0)).entries.length, 0);
});

test("owner text: fixtures using cellspacing/cellpadding name vellora's UA sheet in N0", () => {
  const hints = tableSpacingHintFixtures();
  // CONFIRMED on the committed sources (2026-10-27): the two OSS fixtures and the raw postmark probe.
  assert.deepEqual([...hints].sort(), [
    "oss-postmark-receipt",
    "oss-sparksuite-invoice",
    "probe-g_postmark_raw",
  ]);
  const plain = wordOwnerComponent("danfe", "dy", hints);
  assert.match(plain, /^raw Blitz \(blitz-dom 0.3.0-beta.4 \+ parley\) layout of danfe: N0, Blitz/);
  const sheet = wordOwnerComponent("oss-postmark-receipt", "dy", hints);
  assert.ok(sheet.includes(TABLE_SPACING_UA_SHEET));
  assert.match(sheet, /NOT pure raw Blitz/);
  assert.doesNotMatch(sheet, /^raw Blitz/);
});
