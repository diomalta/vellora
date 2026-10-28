// DEBT.json builder (gate/debt-populate.mjs): the pure classification rules, and the committed
// ledger (baselines/port/DEBT.json) re-checked against the ledger's own rules, the committed head
// report of its step and its frozen rule-iii base.
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
  entryProblems,
  ledgerProblems,
  loadDebt,
  relaxedB,
  transitionProblems,
} from "../debt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
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

// The committed ledger (Phase C 07 tip shrink, step 16-phase-c-07-tip, run 20261028T110750Z):
// 1 entry / 1 WPT key (flex-fragmented-with-float-descendant-001, an ink-flagged pass, still a head
// debt item), the 4 keys the pin-b fixes made pass with a clean head comparison closed as fixed,
// and rule iii clean against the frozen base DEBT-BASE.json names. Until the 2026-10-28 prune this
// file also checked the 10-integration ledger (27 / 1026, D7 against its head report), the c03
// rebuild (15 / 187), every shrink c03 -> c04 -> c05 -> c06 against the frozen 10-integration
// ledger and the c07 shrink against the frozen c06 ledger; those ledgers and reports were removed
// with their snapshots, so the checks were deleted (they live at the git tag
// fidelity-archive-2026-10-28, b5c9546, and on branch docs/fidelity-results-c07).
test("the committed ledger (c07 tip shrink): 1 entry / 1 key, 4 keys closed as fixed, every key debt in the c07 contract re-gate, rule iii vs its frozen base", () => {
  const ledger = loadDebt(DEBT_FILE);
  const pointer = JSON.parse(readFileSync(join(BASELINES, "port", "DEBT-BASE.json"), "utf8"));
  const base = loadDebt(resolve(here, "..", "..", "..", pointer.ledger));
  assert.deepEqual(ledgerProblems(ledger), []);
  assert.deepEqual(
    ledger.entries.map((e) => [e.id, e.keys.map((k) => k.key)]),
    [
      [
        "DEBT-10-wpt-1",
        ["wpt|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html"],
      ],
    ],
  );
  // closed[] is append-only from the base and every closure is a fixed or vanished record.
  assert.deepEqual(ledger.closed.slice(0, base.closed.length), base.closed);
  for (const c of ledger.closed) {
    assert.ok(c.fixed === true || c.keyVanished === true || c.step, JSON.stringify(c));
  }
  const report = JSON.parse(
    gunzipSync(
      readFileSync(
        resolve(
          here,
          "..",
          "snapshots",
          "2026-10-28",
          "c07",
          "gate-report-c07-tip-contract.json.gz",
        ),
      ),
    ).toString(),
  );
  assert.equal(report.step, "16-phase-c-07-tip");
  assert.equal(report.verdict, "PASS");
  assert.equal(report.counts.pinC, 0);
  assert.equal(report.counts.pinB, 1);
  const head = new Map(report.head.items.map((i) => [i.key, i]));
  for (const e of ledger.entries) {
    for (const k of e.keys) assert.equal(head.get(k.key)?.class, "debt", k.key);
  }
  const added = ledger.closed.filter((c) => c.step === "16-phase-c-07-tip");
  assert.deepEqual(
    added.map((c) => [c.id, c.key, c.headComparison.class]),
    [
      ["DEBT-10-wpt-1", "wpt|css/CSS2/floats/floats-placement-vertical-003.xht", "none"],
      ["DEBT-10-wpt-1", "wpt|css/CSS2/floats/floats-placement-vertical-004.xht", "none"],
      ["DEBT-10-wpt-1", "wpt|css/CSS2/linebox/baseline-block-with-overflow-001.html", "none"],
      ["DEBT-10-wpt-2", "wpt|css/CSS2/floats/zero-width-floats.html", "none"],
    ],
  );
  for (const c of added) {
    assert.equal(c.fixed, true, c.key);
    assert.equal(c.runId, "20261028T110750Z", c.key);
    assert.equal(head.get(c.key)?.gating ?? false, false, c.key);
  }
  assert.match(
    ledger.note,
    /Phase C 07 tip .*\(step 16-phase-c-07-tip\) from run 20261028T110750Z/,
  );
  assert.deepEqual(
    transitionProblems(base, ledger, { step: "16-phase-c-07-tip", headItems: head }),
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
