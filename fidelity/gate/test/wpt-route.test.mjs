// GATE-A3 (2026-10-22): the (a) / (b) / (c) route of WPT pass -> fail items, on synthetic data
// (the raw-Blitz WPT mode that writes results.json tests[].rawOutcome is built on
// phaseb/10-wptraw; these tests pin the field and the rule).
import assert from "node:assert/strict";
import { test } from "node:test";
import { d7KeyProblems, relaxedB } from "../debt.mjs";
import { classify } from "../ledger-candidates.mjs";
import { expectationsFromResults } from "../snapshot.mjs";
import { falsePassByPageCount, wptRoute } from "../wpt-route.mjs";
import { compareWpt } from "../wpt.mjs";

const T = "css/x/a.html";
const doc = (outcome, extra = {}) => ({
  schema: 2,
  wptCommit: "c",
  comparison: { x: 1 },
  inkCheck: "chrome 1",
  suites: ["css/x"],
  results: { [T]: outcome },
  suspectPasses: {},
  ...extra,
});

test("compareWpt carries the run's raw-Blitz outcome on its items", () => {
  const r = compareWpt(doc("pass"), doc("fail", { rawOutcomes: { [T]: "fail" } }));
  assert.deepEqual(
    r.items.map((i) => [i.key, i.class, i.rawOutcome]),
    [[`wpt|${T}`, "regression", "fail"]],
  );
  assert.equal(compareWpt(doc("pass"), doc("fail")).items[0].rawOutcome, null);
});

test("expectationsFromResults derives rawOutcomes from results.json tests[].rawOutcome", () => {
  const results = {
    env: { wpt: { commit: "c" } },
    config: {},
    tests: [
      { test: T, outcome: "fail", rawOutcome: "fail" },
      { test: "css/x/b.html", outcome: "pass" },
    ],
  };
  assert.deepEqual(expectationsFromResults(results).rawOutcomes, { [T]: "fail" });
  assert.equal(
    expectationsFromResults({ ...results, tests: [results.tests[1]] }).rawOutcomes,
    undefined,
  );
});

test("route: (a) old pass false by ink or page count, (b) raw Blitz fails the same way, else (c)", () => {
  const item = (rawOutcome, extra = {}) => ({
    before: "pass",
    after: "fail",
    rawOutcome,
    ...extra,
  });
  assert.equal(wptRoute(item("fail")).route, "b");
  assert.match(wptRoute(item("fail")).why, /owner upstream/);
  assert.equal(wptRoute(item("pass")).route, "c");
  assert.match(wptRoute(item("pass")).why, /a vellora layer broke the test/);
  assert.equal(wptRoute(item(null)).route, "c");
  assert.equal(wptRoute(item(undefined)).route, "c");
  assert.equal(wptRoute(item("error")).route, "c");
  // Same outcome but different page counts: not the same failure.
  assert.equal(
    wptRoute(
      item("fail", {
        rawComparisons: [{ pageCounts: [1, 1] }],
        afterComparisons: [{ pageCounts: [2, 1] }],
      }),
    ).route,
    "c",
  );
  // (a) wins over raw evidence: the old pass was never a pass.
  assert.equal(wptRoute(item("fail"), { oldFlags: ["ink-missing-vs-chrome"] }).route, "a");
  const oldRecord = {
    comparisons: [{ pageCounts: [2, 2] }],
    chrome: { comparisons: [{ pageCounts: [1, 1] }] },
  };
  assert.equal(wptRoute(item(null), { oldRecord }).route, "a");
  assert.match(falsePassByPageCount(oldRecord), /2 page\(s\) vs Chrome 1/);
  assert.equal(
    falsePassByPageCount({
      comparisons: [{ pageCounts: [1, 1] }],
      chrome: { comparisons: [{ pageCounts: [1, 1] }] },
    }),
    null,
  );
  // Only pass -> non-pass items have a route.
  assert.equal(wptRoute({ before: "fail", after: "pass" }), null);
  assert.equal(wptRoute({ before: "pass", after: "pass" }), null);
});

test("DEBT: a route-b WPT key carries rawOutcome, an upstream owner, and is tied to the run", () => {
  const entry = {
    id: "WPT-1",
    class: "b",
    owner: { layer: "blitz:floats", component: "blitz-dom float placement" },
    compensators: [],
    introducedBy: "01-pagination-gaps",
    evidence: ["synthetic"],
    keys: [
      {
        key: `wpt|${T}`,
        tolClass: "count",
        headValue: "pass",
        ceiling: "fail",
        measured: "fail",
        rawOutcome: "fail",
      },
    ],
  };
  const rec = entry.keys[0];
  const item = { key: `wpt|${T}`, check: "wpt", after: "fail", rawOutcome: "fail" };
  assert.deepEqual(relaxedB(entry), []);
  assert.deepEqual(d7KeyProblems(entry, rec, item), []);
  assert.match(
    d7KeyProblems(entry, rec, { ...item, rawOutcome: "pass" }).join(";"),
    /rawOutcome fail must be the run's raw-Blitz outcome pass/,
  );
  assert.match(
    d7KeyProblems(entry, rec, { ...item, rawOutcome: null }).join(";"),
    /\(not recorded\)/,
  );
  assert.match(
    relaxedB({ ...entry, owner: { layer: "vellora:pagination", component: "x" } }).join(";"),
    /owner.layer must be "blitz:\*"/,
  );
  assert.match(
    relaxedB({ ...entry, keys: [{ ...rec, rawOutcome: undefined }] }).join(";"),
    /rawOutcome/,
  );
});

test("ledger candidates: route b is a (b) candidate, a raw pass is (c), no raw outcome is none", () => {
  const ctx = {
    labels: new Map(),
    pageCounts: new Map(),
    sections: {},
    vectors: {},
    noText: new Set(),
  };
  const it = (rawOutcome) => ({
    key: `wpt|${T}`,
    test: T,
    check: "wpt",
    headClass: "regression",
    before: "pass",
    after: "fail",
    rawOutcome,
  });
  assert.equal(classify(it("fail"), ctx).candidate, "b");
  assert.equal(classify(it("pass"), ctx).candidate, "c");
  assert.equal(classify(it(null), ctx).candidate, "none");
});
