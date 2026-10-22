// Candidate classes of uncovered head / pin items (gate/ledger-candidates.mjs classify) on planted
// items, one per rule, and the committed part-7 snapshot's totals.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import {
  chainLabels,
  classify,
  offPageTexts,
  wptPageCounts,
  wptRawRecords,
} from "../ledger-candidates.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const labels = chainLabels(resolve(here, "..", "..", "baselines", "port"));
const section = (pages, unpairedVellora = []) => ({ pages, unpairedVellora });
const vec = (N0, run, extra = {}) => ({ unit: "px", N0, B0: N0, L0: N0, P: N0, run, ...extra });
const word = (v, page = 1) => ({
  mapped: true,
  page,
  dy: { vector: v, relaxedB: relaxedFacts(v) },
});
function relaxedFacts(v) {
  const ok = Math.abs(v.run) <= Math.abs(v.N0) + 1.333;
  return {
    possible: ok,
    absRun: Math.abs(v.run),
    absN0: Math.abs(v.N0),
    runTolerance: 1.333,
    stepTolerance: 0.5,
    nonZeroVelloraSteps: [],
    why: ok ? null : "|run| > |N0|",
  };
}
const ctx = (extra = {}) => ({
  labels,
  pageCounts: new Map([["css/x/paged.html", { vellora: 2, chrome: 4 }]]),
  sections: {
    danfe: section({ vellora: 1, chrome: 1 }),
    "text-stress-ptbr": section({ vellora: 8, chrome: 7 }, [{ text: "débito", page: 4 }]),
    "oss-postmark-receipt": section({ vellora: 1, chrome: 2 }),
  },
  vectors: new Map([
    [
      "danfe",
      new Map([
        ["p1|A#1", word(vec(3.656, 2.213))],
        ["p1|B#1", word(vec(1.984, 3.533))],
      ]),
    ],
  ]),
  noText: new Set(["oss-postmark-receipt"]),
  lostText: new Map(),
  ...extra,
});

test("rejections need a declaration; WPT artefacts need recorded evidence or a page-count difference", () => {
  assert.equal(
    classify({ key: "wpt|t", check: "wpt", class: "rejection" }, ctx()).candidate,
    "declare",
  );
  // A chain acceptance labelled as an artefact (step 01 rect-merge false pass) is history, not
  // GATE-A1 evidence: without an ink flag or a page-count difference it is no (a).
  const a = classify(
    { key: "wpt|css/CSS2/linebox/line-height-006.xht", check: "wpt", class: "regression" },
    ctx(),
  );
  assert.deepEqual([a.candidate, /01-pagination-gaps/.test(a.why)], ["none", true]);
  assert.equal(
    classify({ key: "wpt|css/x/paged.html", check: "wpt", class: "regression" }, ctx()).candidate,
    "a",
  );
  // Two cancelling errors is not an artefact label, and WPT tests have no layer vector.
  assert.equal(
    classify(
      { key: "wpt|css/CSS2/floats/zero-width-floats.html", check: "wpt", class: "regression" },
      ctx(),
    ).candidate,
    "none",
  );
});

test("words: b when |run| <= |N0| (+tol), c when vellora made it worse, b-page on displaced pages, none without a vector", () => {
  const w = (k) => ({ key: `pdf-probe|danfe|${k}|dy`, check: "pdf-probe", class: "regression" });
  assert.equal(classify(w("p1|A#1"), ctx()).candidate, "b");
  assert.equal(classify(w("p1|B#1"), ctx()).candidate, "c");
  assert.equal(classify(w("p1|C#1"), ctx()).candidate, "none");
  assert.equal(
    classify(
      {
        key: "pdf-probe|oss-postmark-receipt|p1|Total#1|dy",
        check: "pdf-probe",
        class: "regression",
      },
      ctx(),
    ).candidate,
    "none",
  );
});

test("pairings: displaced to another page is b-page, lost text is c, and a fixture's counts follow its lost words", () => {
  const c = ctx();
  const displaced = classify(
    {
      key: "pdf-probe|text-stress-ptbr|p3|débito#2|pairing",
      check: "pdf-probe",
      class: "regression",
      detail: `Chrome's "débito" (page 3) lost`,
    },
    c,
  );
  assert.equal(displaced.candidate, "b-page");
  const lost = classify(
    {
      key: "pdf-probe|oss-postmark-receipt|p1|team#2|pairing",
      check: "pdf-probe",
      class: "regression",
      detail: `Chrome's "team" (page 1) lost`,
    },
    c,
  );
  assert.equal(lost.candidate, "c");
  c.lostText.set("oss-postmark-receipt", 1);
  assert.equal(
    classify(
      {
        key: "pdf-probe|oss-postmark-receipt|unpaired-chrome",
        check: "pdf-probe",
        class: "regression",
      },
      c,
    ).candidate,
    "c",
  );
  assert.equal(
    classify(
      {
        key: "pdf-probe|text-stress-ptbr|unpaired-chrome",
        check: "pdf-probe",
        class: "regression",
      },
      c,
    ).candidate,
    "b-page",
  );
});

test("values: text lost under html-normalize-compensation is c; an aggregate metric without a vector is none", () => {
  assert.equal(
    classify(
      {
        key: "oss-postmark-receipt|INV-X1|corpus||criterion#1|found",
        check: "value",
        class: "regression",
      },
      ctx(),
    ).candidate,
    "c",
  );
  assert.equal(
    classify(
      { key: "danfe|DANFE-L1a|corpus||criterion#1|posErrMm", check: "value", class: "regression" },
      ctx(),
    ).candidate,
    "none",
  );
  assert.deepEqual(
    [
      ...wptPageCounts({
        tests: [
          {
            test: "t",
            comparisons: [{ pageCounts: [2, 2] }],
            chrome: { comparisons: [{ pageCounts: [4, 4] }] },
          },
        ],
      }),
    ],
    [["t", { vellora: 2, chrome: 4 }]],
  );
});

test("WPT route (GATE-A1/A3): (a) only by the old record's ink flag or page count; raw Blitz decides (b) / (c)", () => {
  const t = "css/CSS2/linebox/line-height-006.xht";
  const item = { key: `wpt|${t}`, test: t, check: "wpt", before: "pass", after: "fail" };
  const old = (extra = {}) => ({
    test: t,
    prepare: {},
    comparisons: [{ pass: true, pageCounts: [1, 1] }],
    chrome: { comparisons: [{ pageCounts: [1, 1] }] },
    ...extra,
  });
  const withOld = (rec, raw = null) =>
    ctx({
      oldRecords: new Map([[t, rec]]),
      rawRecords: raw ? new Map([[t, raw]]) : new Map(),
    });
  const sameFail = {
    rawOutcome: "fail",
    rawComparisons: [{ pageCounts: [1, 1] }],
    afterComparisons: [{ pageCounts: [1, 1] }],
  };
  // Clean, single-page old pass with only the chain label: no evidence.
  assert.equal(classify(item, withOld(old())).candidate, "none");
  // Ink flag on the old pass (missingFrac >= 0.5) or a page-count difference: (a).
  assert.equal(
    classify(item, withOld(old({ inkCheck: { missingFrac: 0.8, bboxShift: 0 } }))).candidate,
    "a",
  );
  assert.equal(
    classify(item, withOld(old({ chrome: { comparisons: [{ pageCounts: [3, 3] }] } }))).candidate,
    "a",
  );
  // Raw Blitz fails the same way: (b); raw Blitz passes: (c), a vellora layer broke it.
  assert.equal(classify(item, withOld(old(), sameFail)).candidate, "b");
  const c = classify(item, withOld(old(), { ...sameFail, rawOutcome: "pass" }));
  assert.deepEqual([c.candidate, /vellora layer/.test(c.why)], ["c", true]);
  // Same outcome but other page counts is not the same failure: (c).
  assert.equal(
    classify(item, withOld(old(), { ...sameFail, rawComparisons: [{ pageCounts: [2, 1] }] }))
      .candidate,
    "c",
  );
  assert.deepEqual(
    [
      ...wptRawRecords({
        tests: [
          { test: "x", rawOutcome: "pass", raw: { comparisons: [1] }, comparisons: [2] },
          { test: "y" },
        ],
      }),
    ],
    [["x", { rawOutcome: "pass", rawComparisons: [1], afterComparisons: [2] }]],
  );
});

test("lost text: newly off-page text and newly missing tokens are c; the off-page tail replaces the stale XML-parse reason", () => {
  const items = [
    { key: "pdf-probe|oss-postmark-receipt|off-page|Download", check: "pdf-probe" },
    { key: "pdf-probe|oss-postmark-receipt|off-page|as", check: "pdf-probe" },
  ];
  const c = ctx({ offPage: offPageTexts(items) });
  assert.deepEqual([...c.offPage], [["oss-postmark-receipt", ["Download", "as"]]]);
  const off = classify(items[0], c);
  assert.equal(off.candidate, "c");
  assert.match(off.why, /off the page/);
  const tok = classify(
    {
      key: "oss-postmark-receipt|EXT-2|oracles:text|plain|criterion#1|missingTokens.pdftotext|as",
      check: "value",
    },
    c,
  );
  assert.deepEqual([tok.candidate, /off the page/.test(tok.why)], ["c", true]);
  const other = classify(
    {
      key: "danfe|EXT-2|oracles:text|plain|criterion#1|missingTokens.pymupdf|CNPJ",
      check: "value",
    },
    c,
  );
  assert.deepEqual([other.candidate, /off the page/.test(other.why)], ["c", false]);
  // A count row of a fixture with off-page text: c for the off-page cause, not step 05's label.
  const count = classify(
    {
      key: "oss-postmark-receipt|EXT-2|oracles:text|plain|criterion#1|missing.pdftotext",
      check: "value",
    },
    c,
  );
  assert.equal(count.candidate, "c");
  assert.match(count.why, /off the page \(Download as\)/);
  assert.doesNotMatch(count.why, /XML/);
});

test("the committed part-7 snapshot: 985 head items and 213 pin items, every one classed", () => {
  const snap = JSON.parse(
    gunzipSync(
      readFileSync(
        resolve(here, "..", "snapshots", "2026-10-21", "ledger", "ledger-candidates.json.gz"),
      ),
    ).toString("utf8"),
  );
  for (const [name, total] of [
    ["head", 985],
    ["pin", 213],
  ]) {
    const s = snap.sections[name];
    assert.equal(s.total, total, name);
    assert.equal(
      Object.values(s.byCandidate).reduce((a, b) => a + b, 0),
      total,
      name,
    );
  }
});
