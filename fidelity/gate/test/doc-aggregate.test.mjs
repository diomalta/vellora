// DOC-1..DOC-4 (gate/doc-aggregate.mjs): the document aggregate vs the published engine, the
// contract page-count rule, their wiring into evaluateGate, and the canary of each canary.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runGateCanaries } from "../canaries.mjs";
import {
  DOC_AGGREGATE_TOLERANCE,
  evaluateDocAggregate,
  renderDocAggregateMarkdown,
} from "../doc-aggregate.mjs";
import { evaluateGate, gateOptions } from "../run.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PIN = JSON.parse(
  readFileSync(join(here, "..", "..", "baselines", "pin", "doc-aggregate.json"), "utf8"),
);
const DOC_CANARIES = [
  "DOC-1 median word distance worse than the published engine",
  "DOC-1 share of words within 1 mm below the published engine",
  "DOC-1 one more missing word than the published engine",
  "DOC-3 a fixture (or the whole aggregate) absent from the run",
  "DOC-2 the pin scored on another input, Chrome geometry or above its noise",
  "DOC-4 page count differs from Chrome's (contract condition 3)",
];
/** A run equal to the pin (same inputs, same values). */
const runLikePin = (edit = (r) => r) => ({
  method: PIN.method,
  fixtures: Object.fromEntries(
    Object.entries(structuredClone(PIN.fixtures)).map(([id, r]) => [id, edit(r, id)]),
  ),
});
const caughtBy = (rows) => Object.fromEntries(rows.map((r) => [r.canary, r.caught]));

test("the committed pin's recorded noise is within the tolerance (DOC-2 would refuse otherwise)", () => {
  for (const [m, tol] of Object.entries(DOC_AGGREGATE_TOLERANCE)) {
    assert.ok(PIN.noise.max[m] <= tol, `${m}: noise ${PIN.noise.max[m]} > ${tol}`);
  }
});

test("a run equal to the pin passes DOC-1..3; DOC-4 reports the pin's own page mismatches", () => {
  const d = evaluateDocAggregate({ run: runLikePin(), pin: PIN, main: true });
  assert.equal(d.verdict, "PASS");
  assert.equal(d.condition2, "PASS");
  const wrongPages = Object.entries(PIN.fixtures).filter(([, r]) => r.pages !== r.chromePages);
  assert.equal(d.counts.contractPagesFailing, wrongPages.length);
  assert.equal(d.condition3, wrongPages.length ? "FAIL" : "PASS");
  const c = evaluateDocAggregate({ run: runLikePin(), pin: PIN, main: true, contract: true });
  assert.equal(c.verdict, wrongPages.length ? "FAIL" : "PASS");
  assert.ok(renderDocAggregateMarkdown(d).some((l) => l.startsWith("| invoice |")));
});

test("better everywhere passes; worse in one fixture gates only that fixture, only under --main", () => {
  const better = runLikePin((r) => ({ ...r, medianMm: 0, within1mmPct: 100, missingWords: 0 }));
  assert.equal(evaluateDocAggregate({ run: better, pin: PIN, main: true }).verdict, "PASS");
  const worse = runLikePin((r, id) => (id === "boleto" ? { ...r, medianMm: r.medianMm + 1 } : r));
  const g = evaluateDocAggregate({ run: worse, pin: PIN, main: true });
  assert.deepEqual(
    g.items.filter((i) => i.gating).map((i) => i.key),
    ["doc-aggregate|boleto|medianMm"],
  );
  assert.equal(evaluateDocAggregate({ run: worse, pin: PIN, main: false }).verdict, "PASS");
});

test("a missing aggregate or pin refuses only under --main", () => {
  assert.equal(evaluateDocAggregate({ run: null, pin: PIN, main: true }).verdict, "REFUSED");
  assert.equal(
    evaluateDocAggregate({ run: runLikePin(), pin: null, main: true }).verdict,
    "REFUSED",
  );
  const report = evaluateDocAggregate({ run: null, pin: PIN, main: false });
  assert.equal(report.verdict, "NOT-RUN");
  assert.equal(report.notes.length, 1);
});

test("--contract implies --main; evaluateGate folds the section into the verdict", () => {
  assert.deepEqual(
    [gateOptions(["--contract"]).main, gateOptions(["--contract"]).contract],
    [true, true],
  );
  assert.equal(gateOptions([]).main, false);
  const snap = {
    source: { kind: "canary", schema: "canary" },
    integrity: { ok: true, checked: 0, problems: [] },
    fixtures: [],
    wpt: { expectations: null },
    crashtests: null,
    pdfProbe: null,
    canaries: null,
    codeChecks: null,
    steps: [],
  };
  const base = { before: snap, after: snap, ledgerBase: null, canaries: false };
  const worse = runLikePin((r, id) => (id === "invoice" ? { ...r, within1mmPct: 0 } : r));
  const reported = evaluateGate({ ...base, docAggregate: { run: worse, pin: PIN } });
  assert.equal(reported.verdict, "PASS");
  assert.equal(reported.docAggregate.condition2, "FAIL");
  const gated = evaluateGate({ ...base, main: true, docAggregate: { run: worse, pin: PIN } });
  assert.equal(gated.verdict, "FAIL");
  const contract = evaluateGate({
    ...base,
    contract: true,
    docAggregate: { run: runLikePin(), pin: PIN },
  });
  assert.equal(contract.docAggregate.main, true);
  assert.equal(
    contract.verdict,
    contract.docAggregate.counts.contractPagesFailing ? "FAIL" : "PASS",
  );
  // Pure callers without the section are unchanged.
  assert.equal(evaluateGate({ ...base, main: true }).docAggregate, undefined);
});

test("every DOC canary is caught on a real row and on a synthetic row", () => {
  for (const docAggregate of [runLikePin(), null]) {
    const c = caughtBy(runGateCanaries({ docAggregate }));
    for (const name of DOC_CANARIES) assert.equal(c[name], true, name);
  }
  const rows = runGateCanaries({ docAggregate: runLikePin() });
  assert.match(rows.find((r) => r.canary === DOC_CANARIES[0]).mustReport, /^real row /);
});

test("a broken DOC rule leaves its canary uncaught (the canary of the canary)", () => {
  const run = runLikePin();
  const withRule = (rule) => caughtBy(runGateCanaries({ docAggregate: run, docRule: rule }));
  // No tolerance at all: a move of exactly the tolerance gates.
  const strict = (o) =>
    evaluateDocAggregate({ ...o, tolerance: { medianMm: 0, within1mmPct: 0, missingWords: 0 } });
  assert.equal(withRule(strict)[DOC_CANARIES[0]], false);
  assert.equal(withRule(strict)[DOC_CANARIES[1]], false);
  // Tolerance ten times too wide: the planted move passes.
  const loose = (o) =>
    evaluateDocAggregate({ ...o, tolerance: { medianMm: 0.1, within1mmPct: 1, missingWords: 0 } });
  assert.equal(withRule(loose)[DOC_CANARIES[0]], false);
  // Missing words ignored.
  const noMissing = (o) => {
    const d = evaluateDocAggregate(o);
    return { ...d, items: d.items.filter((i) => !i.key.endsWith("|missingWords")) };
  };
  assert.equal(withRule(noMissing)[DOC_CANARIES[2]], false);
  // An absent fixture read as a pass.
  const absentOk = (o) => {
    const d = evaluateDocAggregate(o);
    return { ...d, items: d.items.filter((i) => i.class !== "doc-missing") };
  };
  assert.equal(withRule(absentOk)[DOC_CANARIES[3]], false);
  // Never refuses.
  const noRefusal = (o) => ({ ...evaluateDocAggregate(o), verdict: "PASS", refusals: [] });
  assert.equal(withRule(noRefusal)[DOC_CANARIES[4]], false);
  // --contract ignored (pages never gate), or pages always gate.
  const noContract = (o) => evaluateDocAggregate({ ...o, contract: false });
  assert.equal(withRule(noContract)[DOC_CANARIES[5]], false);
  const alwaysPages = (o) => evaluateDocAggregate({ ...o, contract: true });
  assert.equal(withRule(alwaysPages)[DOC_CANARIES[5]], false);
  // The real rule: all caught.
  const c = withRule(evaluateDocAggregate);
  for (const name of DOC_CANARIES) assert.equal(c[name], true, name);
});
