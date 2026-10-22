// Candidate classes of uncovered head / pin items (gate/ledger-candidates.mjs classify) on planted
// items, one per rule, and the committed part-7 snapshot's totals.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { chainLabels, classify, wptPageCounts } from "../ledger-candidates.mjs";

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
  // A chain acceptance labelled as an artefact (step 01 rect-merge false pass).
  const a = classify(
    { key: "wpt|css/CSS2/linebox/line-height-006.xht", check: "wpt", class: "regression" },
    ctx(),
  );
  assert.deepEqual([a.candidate, /01-pagination-gaps/.test(a.why)], ["a", true]);
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
