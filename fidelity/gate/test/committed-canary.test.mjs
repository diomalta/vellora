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
