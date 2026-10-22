// fidelity/gate/wpt-raw-table.mjs: which tests enter the table, the chain link a pass was lost
// at, how raw fails, and the candidate class.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRows, sameWay } from "../wpt-raw-table.mjs";

const doc = (results, suspectPasses = {}) => ({ schema: 2, results, suspectPasses });

test("rows: a pass in a reference view that the subject lost, with its chain link and class", () => {
  const pin = doc(
    { t1: "pass", t2: "pass", t3: "pass", t4: "fail", t5: "pass" },
    { t3: "ink-missing-vs-chrome" },
  );
  const head = doc({ t1: "pass", t2: "fail", t3: "fail", t4: "pass", t5: "pass" });
  const mid = doc({ t1: "fail", t2: "fail", t3: "fail", t4: "pass", t5: "pass" });
  const subject = doc({ t1: "fail", t2: "fail", t3: "fail", t4: "fail", t5: "pass" });
  const cmp = (totalPixels) => [{ rhs: "r", totalPixels, maxDifference: 255, pageCounts: [1, 1] }];
  const tests = [
    {
      test: "t1",
      mode: "screen",
      outcome: "fail",
      rawOutcome: "pass",
      comparisons: cmp(5),
      raw: { comparisons: [] },
      chrome: { outcome: "pass" },
    },
    {
      test: "t2",
      mode: "screen",
      outcome: "fail",
      rawOutcome: "fail",
      comparisons: cmp(5),
      raw: { comparisons: cmp(5) },
      chrome: { outcome: "pass" },
    },
    {
      test: "t3",
      mode: "screen",
      outcome: "fail",
      rawOutcome: "fail",
      comparisons: cmp(5),
      raw: { comparisons: cmp(9) },
      chrome: { outcome: "fail" },
    },
    {
      test: "t4",
      mode: "print",
      outcome: "fail",
      rawOutcome: "fail",
      comparisons: cmp(5),
      raw: { comparisons: cmp(5) },
      chrome: { outcome: "pass" },
    },
  ];
  const rows = buildRows({
    subject,
    refs: [
      ["pin", pin],
      ["head", head],
    ],
    chain: [
      ["pin", pin],
      ["head", head],
      ["mid", mid],
      ["subject", subject],
    ],
    tests,
    upstream: new Map([["t1", "PASS"]]),
    samePdfOf: (t) => (t === "t4" ? true : t === "t2" ? false : null),
  });
  assert.deepEqual(
    rows.map((r) => [r.test, r.views.join(","), r.lostAt, r.rawSameWay, r.candidate]),
    [
      ["t1", "pin,head", "mid", null, "c"],
      ["t2", "pin", "head", "same-diff", "b"],
      ["t3", "pin-flagged", "head", "different", "a"],
      ["t4", "head", "subject", "identical-pdf", "b"],
    ],
  );
  assert.equal(rows[0].upstream, "PASS");
  assert.deepEqual(rows[0].chain, { pin: "pass", head: "pass", mid: "fail", subject: "fail" });
});

test("sameWay: null when raw passed or did not run", () => {
  assert.equal(sameWay({ rawOutcome: "pass" }, {}), null);
  assert.equal(sameWay({ rawOutcome: null }, {}), null);
  assert.equal(sameWay({ rawOutcome: "fail" }, null), null);
});

test("(a) per view: the view's own old run proves its pass false by page count", () => {
  const pin = doc({ t: "pass" });
  const head = doc({ t: "pass" });
  const subject = doc({ t: "fail" });
  const old = (pages, chromePages) =>
    new Map([
      [
        "t",
        {
          comparisons: [{ pageCounts: [pages, pages] }],
          chrome: { comparisons: [{ pageCounts: [chromePages, chromePages] }] },
        },
      ],
    ]);
  const rows = buildRows({
    subject,
    refs: [
      ["pin", pin],
      ["head", head],
    ],
    chain: [],
    tests: [
      {
        test: "t",
        mode: "print",
        outcome: "fail",
        rawOutcome: "fail",
        chrome: { outcome: "fail" },
      },
    ],
    samePdfOf: () => null,
    oldRuns: new Map([
      ["pin", old(2, 4)],
      ["head", old(4, 4)],
    ]),
  });
  // Chrome failing its own reftest does not make the head view (a).
  assert.deepEqual(rows[0].candidates, { pin: "a", head: "b" });
  assert.equal(rows[0].candidate, "mixed");
  assert.equal(rows[0].oldPass.pin.pageMismatch, true);
});
