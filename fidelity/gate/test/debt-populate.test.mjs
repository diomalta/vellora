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
  groupEntries,
  introducedBy,
  pageCriterionKey,
  pageScopeEntries,
  tableSpacingHintFixtures,
  wordOwnerComponent,
} from "../debt-populate.mjs";
import {
  DEBT_FILE,
  d7KeyProblems,
  entryProblems,
  ledgerProblems,
  loadDebt,
  pageScopeD7Problems,
  relaxedB,
} from "../debt.mjs";
import { pageMetricValues } from "../run.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SNAP = resolve(here, "..", "snapshots", "2026-10-27", "10-debt");
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
  const e = groupEntries([r("a", ["P"], "04-b"), r("b", ["P"], "04-b"), r("c", [], "04-b")]);
  assert.deepEqual(
    e.map((x) => [x.id, x.keys.map((k) => k.key)]),
    [
      ["DEBT-10-boleto-1", ["a", "b"]],
      ["DEBT-10-boleto-2", ["c"]],
    ],
  );
});

test("the committed ledger: 27 entries, 1026 keys, every key passes D7 against the committed head report", () => {
  const ledger = loadDebt(DEBT_FILE);
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
  });
  const { entries, left } = pageScopeEntries(residual, opts(1, 1));
  assert.equal(entries.length, 1);
  const e = entries[0];
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
