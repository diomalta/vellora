// REAL canary on committed data (no render, deterministic): the Phase A beta.4 baseline taken as
// the "run" against the pin baseline MUST be flagged for the two regressions the status-only
// ratchet missed (notification REF-W 3.60 -> 8.54 mm, invoice REF-W 2.44 -> 3.91 mm) and for the
// WPT clean-pass regressions; and beta.4 against itself must show no regression.
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "../compare.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const pin = loadBaselineDir(join(baselines, "pin"));
const beta4 = loadBaselineDir(join(baselines, "beta4"));
const item = (r, key) => r.items.find((i) => i.key === key);

test("committed baselines pass their manifest sha256 integrity check", () => {
  assert.equal(pin.integrity.ok, true, pin.integrity.problems.join("; "));
  assert.equal(beta4.integrity.ok, true, beta4.integrity.problems.join("; "));
});

test("beta4-gated (gate schema) round-trips: vs the Phase A beta4 baseline only the red cargo test gates", () => {
  const gated = loadBaselineDir(join(baselines, "beta4-gated"));
  assert.equal(gated.integrity.ok, true, gated.integrity.problems.join("; "));
  assert.equal(gated.source.schema, "vellora-fidelity/baseline/2");
  assert.ok(gated.pdfProbe && Object.keys(gated.pdfProbe).length === 9);
  assert.equal(Object.keys(gated.crashtests.results).length, 239);
  const r = compareSnapshots(beta4, gated);
  assert.equal(r.items.filter((x) => x.class === "regression" || x.class === "removed").length, 0);
  assert.deepEqual(
    r.items.filter((x) => x.gating).map((x) => x.key),
    ["code|cargo-test"],
  );
  assert.equal(item(r, "danfe|DANFE-B1|oracles:barcode|plain|criterion#1").class, "newly-measured");
});

test("beta.4 vs pin: REF-W regressions of notification and invoice are flagged with before/after", () => {
  const r = compareSnapshots(pin, beta4);
  assert.equal(r.verdict, "FAIL");
  const n = item(r, "notification|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([n.class, n.gating, n.before, n.after], ["regression", true, 3.6, 8.54]);
  const np = item(r, "notification|REF-W|oracles:layout|plain|criterion#1|p95Mm");
  assert.deepEqual([np.before, np.after], [3.48, 8.42]);
  const i = item(r, "invoice|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([i.class, i.gating, i.before, i.after], ["regression", true, 2.44, 3.91]);
  // The status of both rows stayed FAIL -> FAIL: the old status-only ratchet was blind to this.
  assert.equal(item(r, "notification|REF-W|oracles:layout|plain|criterion#1"), undefined);
});

test("beta.4 vs pin: 53 WPT clean-pass regressions gate, 111 flagged-pass regressions are only reported", () => {
  const r = compareSnapshots(pin, beta4);
  const wpt = r.items.filter((x) => x.check === "wpt");
  assert.equal(wpt.filter((x) => x.class === "regression" && x.gating).length, 53);
  assert.equal(wpt.filter((x) => x.class === "reported" && !x.gating).length, 111);
  // Same numbers the Phase A wpt/run.mjs ratchet recorded in the beta.4 manifest.
  assert.equal(beta4.manifest.wpt.ratchetCounts.regressionsOfCleanPasses, 53);
  assert.equal(beta4.manifest.wpt.ratchetCounts.regressionsOfFlaggedPasses, 111);
});

test("beta.4 vs pin: text-extraction and DANFE losses are value regressions too", () => {
  const r = compareSnapshots(pin, beta4);
  const x = item(r, "boleto-febraban|BOL-X1|corpus||criterion#1|found");
  assert.deepEqual([x.class, x.before, x.after], ["regression", 13, 11]);
  assert.equal(item(r, "danfe|DANFE-F11|corpus||criterion#1").class, "regression");
  assert.equal(item(r, "danfe|DANFE-B3|corpus||criterion#1").class, "improvement");
});

test("beta.4 vs beta.4: no regression; the only gating items are the 2 postmark font-parity checks the shared alias table fixes", () => {
  const r = compareSnapshots(beta4, beta4);
  assert.equal(r.items.filter((x) => x.class === "regression" || x.class === "removed").length, 0);
  assert.deepEqual(
    r.items
      .filter((x) => x.gating)
      .map((x) => x.key)
      .sort(),
    [
      "layout-diff|oss-postmark-receipt|bundled_fonts_loaded",
      "layout-diff|oss-postmark-receipt|platform_fonts_custom",
    ],
  );
});

test("port/00-start (head of the port chain, baselines/port/README.md) passes vs beta4-gated", () => {
  const start = loadBaselineDir(join(baselines, "port", "00-start"));
  assert.equal(start.integrity.ok, true, start.integrity.problems.join("; "));
  assert.equal(start.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(start.manifest.gate.verdict, "PASS");
  assert.equal(start.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(start.manifest.gate.baseline, "fidelity/baselines/beta4-gated");
  assert.deepEqual(start.manifest.acceptedRegressions, []);
  assert.equal(Object.keys(start.crashtests.results).length, 239);
  assert.ok(start.codeChecks.length === 4 && start.codeChecks.every((c) => c.status === "pass"));
  const r = compareSnapshots(loadBaselineDir(join(baselines, "beta4-gated")), start);
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  // The only change: 13 WPT css-text tests fail -> pass (phaseb/text-hook's reader fix).
  const improved = r.items.filter((x) => x.class === "improvement");
  assert.equal(improved.length, 13);
  assert.ok(improved.every((x) => x.key.startsWith("wpt|css/css-text/")));
});

test("port/01-pagination-gaps passes vs port/00-start only with its acceptedRegressions", () => {
  const start = loadBaselineDir(join(baselines, "port", "00-start"));
  const step = loadBaselineDir(join(baselines, "port", "01-pagination-gaps"));
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/00-start");
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  const accept = step.manifest.acceptedRegressions;
  assert.equal(accept.length, 150);
  assert.ok(accept.every((e) => e.key && e.after !== undefined && e.reason && e.evidence));
  // Without the acceptances the same comparison gates exactly the 150 accepted items...
  const raw = compareSnapshots(start, step);
  assert.equal(raw.verdict, "FAIL");
  assert.deepEqual(
    raw.items
      .filter((x) => x.gating)
      .map((x) => x.key)
      .sort(),
    accept.map((e) => e.key).sort(),
  );
  // ...and with them it passes.
  const r = compareSnapshots(start, step, { accept });
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  // The step's target: the notification's bottom text (Phase A: -8.54 mm).
  const let1 = item(r, "notification|LET-1|oracles:layout|plain|criterion#1|worstMm");
  assert.deepEqual([let1.class, let1.before, let1.after], ["improvement", 8.54, 0.75]);
  const refw = item(r, "notification|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([refw.class, refw.before, refw.after], ["improvement", 8.54, 1.63]);
});

test("port/02-delete-noop-passes passes vs port/01-pagination-gaps with no acceptedRegressions", () => {
  const prev = loadBaselineDir(join(baselines, "port", "01-pagination-gaps"));
  const step = loadBaselineDir(join(baselines, "port", "02-delete-noop-passes"));
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/01-pagination-gaps");
  assert.deepEqual(step.manifest.acceptedRegressions, []);
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  const r = compareSnapshots(prev, step);
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  // The only change: 3 WPT margin-collapse tests fail -> clean pass (the removed
  // vertical_margin_collapse pass collapsed margins Blitz had already collapsed).
  assert.deepEqual(
    r.items
      .filter((x) => x.class !== "unchanged")
      .map((x) => `${x.class} ${x.key}`)
      .sort(),
    [
      "improvement wpt|css/CSS2/box-display/multiple-block-in-inlines-margins-collapse.html",
      "improvement wpt|css/CSS2/margin-padding-clear/margin-collapse-101.xht",
      "improvement wpt|css/CSS2/margin-padding-clear/margin-collapse-105.xht",
    ],
  );
});
