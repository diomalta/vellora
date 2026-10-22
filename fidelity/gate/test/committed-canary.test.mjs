// REAL canary on committed data (no render, deterministic): the Phase A beta.4 baseline taken as
// the "run" against the pin baseline MUST be flagged for the two regressions the status-only
// ratchet missed (notification REF-W 3.60 -> 8.54 mm, invoice REF-W 2.44 -> 3.91 mm) and for the
// WPT clean-pass regressions; and beta.4 against itself must show no regression.
//
// pdf-probe history: every link was gated with pdf-probe semantics 1 (pdftotext bbox tops, k-th
// occurrence pairs) and its acceptedRegressions name v1 keys. Since the v2 re-score
// (gate/rescore-pdf-probe.mjs) the gated section is v2 and the v1 one is kept under
// attachments/pdf-probe-v1/ (beta4: layout-diff-ab/). The historical verdicts below are reproduced
// on the v1 sections (`v1(...)`); the v2 facts of the chain are asserted at the end.
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
/** A baseline with the pdf-probe section it was gated with (semantics 1, history). */
const v1 = (...parts) => loadBaselineDir(join(baselines, ...parts), { pdfProbe: "v1" });

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

test("port/01-pagination-gaps passes vs port/00-start only with its acceptedRegressions (v1 pdf-probe)", () => {
  const start = v1("port", "00-start");
  const step = v1("port", "01-pagination-gaps");
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

test("port/03-table-passes passes vs port/02-delete-noop-passes only with its acceptedRegressions (v1 pdf-probe)", () => {
  const prev = v1("port", "02-delete-noop-passes");
  const step = v1("port", "03-table-passes");
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/02-delete-noop-passes");
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  const accept = step.manifest.acceptedRegressions;
  assert.equal(accept.length, 40);
  assert.ok(accept.every((e) => e.key.startsWith("pdf-probe|") && e.reason && e.evidence));
  // 16 occurrence-pairing artefacts and 24 DANFE words the deleted fixed_table_widths pass had
  // placed near Chrome by coincidence (labels and evidence: manifest.json, baselines/port/README.md).
  const labels = {};
  for (const e of accept) labels[e.label] = (labels[e.label] ?? 0) + 1;
  assert.deepEqual(labels, {
    "pdf-probe-pairing-artefact": 16,
    "coincidental-match-of-wrong-geometry": 24,
  });
  // Without the acceptances the same comparison gates exactly the 40 accepted items...
  const raw = compareSnapshots(prev, step);
  assert.equal(raw.verdict, "FAIL");
  assert.deepEqual(
    raw.items
      .filter((x) => x.gating)
      .map((x) => x.key)
      .sort(),
    accept.map((e) => e.key).sort(),
  );
  // ...and with them it passes.
  const r = compareSnapshots(prev, step, { accept });
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  // The step's targets: invoice price columns, DANFE and boleto-febraban grids.
  const inv = item(r, "invoice|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([inv.class, inv.before, inv.after], ["improvement", 3.91, 2.81]);
  const bol = item(r, "boleto-febraban|BOL-X1|corpus||criterion#1|found");
  assert.deepEqual([bol.class, bol.before, bol.after], ["improvement", 11, 16]);
  const danfe = item(r, "danfe|DANFE-X1|corpus||criterion#1|found");
  assert.deepEqual([danfe.class, danfe.before, danfe.after], ["improvement", 22, 26]);
  const wpt = item(r, "wpt|css/CSS2/tables/fixed-table-layout-026.xht");
  assert.deepEqual([wpt.class, wpt.before, wpt.after], ["improvement", "fail", "pass"]);
});

test("port/04-block-offset passes vs port/03-table-passes only with its acceptedRegressions (v1 pdf-probe)", () => {
  const prev = v1("port", "03-table-passes");
  const step = v1("port", "04-block-offset");
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/03-table-passes");
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  const accept = step.manifest.acceptedRegressions;
  assert.equal(accept.length, 2587);
  assert.ok(accept.every((e) => e.key && e.after !== undefined && e.reason && e.evidence));
  // 709 oracle artefacts (literal GATE-A1 fit) and 1861 words + 17 value/status rows whose old value
  // was two errors cancelling (the removed 3 pt PDF raise vs raw Blitz box drift); labels and
  // evidence: manifest.json, attachments/accepted-evidence.json, baselines/port/README.md.
  const labels = {};
  for (const e of accept) labels[e.label] = (labels[e.label] ?? 0) + 1;
  assert.deepEqual(labels, {
    "compensating-drift": 689,
    "misplaced-word-uniform-shift": 1189,
    "pdf-probe-ascent-artefact": 697,
    "pdf-probe-pairing-artefact": 11,
    "wpt-subpixel-raster-artefact": 1,
  });
  // Without the acceptances the same comparison gates exactly the 2587 accepted items...
  const raw = compareSnapshots(prev, step);
  assert.equal(raw.verdict, "FAIL");
  assert.deepEqual(
    raw.items
      .filter((x) => x.gating)
      .map((x) => x.key)
      .sort(),
    accept.map((e) => e.key).sort(),
  );
  // ...and with them it passes.
  const r = compareSnapshots(prev, step, { accept });
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  // The step's targets: Ahem line boxes, invoice/boleto cell text; LET-1 is an accepted regression.
  const ahem = item(r, "wpt|css/CSS2/linebox/line-height-002.xht");
  assert.deepEqual([ahem.class, ahem.before, ahem.after], ["improvement", "fail", "pass"]);
  const inv = item(r, "invoice|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([inv.class, inv.before, inv.after], ["improvement", 2.81, 2.53]);
  const bol = item(r, "boleto-febraban|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([bol.class, bol.before, bol.after], ["improvement", 7.94, 2.31]);
  const let1 = item(r, "notification|LET-1|oracles:layout|plain|criterion#1|worstMm");
  assert.deepEqual([let1.class, let1.before, let1.after], ["accepted", 0.75, 1.81]);
});

test("port/05-walk-rewrite passes vs port/04-block-offset only with its acceptedRegressions (v1 pdf-probe)", () => {
  const prev = v1("port", "04-block-offset");
  const step = v1("port", "05-walk-rewrite");
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/04-block-offset");
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  const accept = step.manifest.acceptedRegressions;
  assert.equal(accept.length, 18);
  assert.ok(accept.every((e) => e.key && e.after !== undefined && e.reason && e.evidence));
  // 6 WPT false passes (literal GATE-A1 fit) and 12 items html_normalize's DOM rewrite had
  // compensated (3 float WPT tests, 9 postmark text rows); evidence: manifest.json,
  // attachments/accepted-evidence.json, baselines/port/README.md.
  const labels = {};
  for (const e of accept) labels[e.label] = (labels[e.label] ?? 0) + 1;
  assert.deepEqual(labels, { "html-normalize-compensation": 12, "wpt-false-pass": 6 });
  // Without the acceptances the same comparison gates exactly the 18 accepted items...
  const raw = compareSnapshots(prev, step);
  assert.equal(raw.verdict, "FAIL");
  assert.deepEqual(
    raw.items
      .filter((x) => x.gating)
      .map((x) => x.key)
      .sort(),
    accept.map((e) => e.key).sort(),
  );
  // ...and with them it passes.
  const r = compareSnapshots(prev, step, { accept });
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  // The step's targets: the receipt's hoisted <p class="thanks"> content, block ::before,
  // abspos on its containing block, anonymous boxes.
  const rec = item(r, "receipt|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([rec.class, rec.before, rec.after], ["improvement", 101.22, 1.37]);
  for (const t of [
    "css/CSS2/generated-content/before-inheritable-001.xht",
    "css/CSS2/positioning/abspos-containing-block-001.xht",
    "css/CSS2/box-display/anonymous-box-generation-001.xht",
  ]) {
    const w = item(r, `wpt|${t}`);
    assert.deepEqual([w.class, w.before, w.after], ["improvement", "fail", "pass"], t);
  }
});

// The 10 WPT tests step 06 moved fail -> unsupported with its new strict-gate rejection
// css:page-varying-width (cause.feature in the step-06 run's wpt/results.json, run copy
// run-all-06-page-rules-20261021T153752Z; listed in baselines/port/README.md). The rule of its
// time compared them as non-gating "changed"; since D5 they gate unless declared.
const STEP06_REJECTED = [
  "css/css-page/layers-003-print.html",
  "css/css-page/layers-004-print.html",
  "css/css-page/page-margin-007-print.html",
  "css/css-page/page-size-004-print.html",
  "css/css-page/page-size-005-print.html",
  "css/css-page/page-size-009-print.html",
  "css/css-page/pseudo-first-margin-001-print.html",
  "css/css-page/pseudo-first-margin-002-print.html",
  "css/css-page/pseudo-first-margin-003-print.html",
  "css/css-page/pseudo-first-margin-004-print.html",
];

test("port/06-page-rules passes vs port/05-walk-rewrite only with its acceptedRegressions (v1 pdf-probe) and, since D5, a declaration of its 10 new rejections", () => {
  const prev = v1("port", "05-walk-rewrite");
  const step = v1("port", "06-page-rules");
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/05-walk-rewrite");
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  const accept = step.manifest.acceptedRegressions;
  assert.equal(accept.length, 13);
  assert.ok(accept.every((e) => e.key && e.after !== undefined && e.reason && e.evidence));
  // Both labels fit GATE-A1's literal wording: 12 pdf-probe occurrence-pairing artefacts
  // (text-stress-ptbr: vellora's footer "de" paired with a Chrome body "de") and 1 WPT false
  // pass (page-size-015: test and reference both lost their page size); evidence:
  // manifest.json, attachments/accepted-evidence.json, baselines/port/README.md.
  const labels = {};
  for (const e of accept) labels[e.label] = (labels[e.label] ?? 0) + 1;
  assert.deepEqual(labels, { "pdf-probe-pairing-artefact": 12, "wpt-false-pass": 1 });
  const rejected = STEP06_REJECTED.map((t) => `wpt|${t}`);
  // Without the acceptances the same comparison gates exactly the 13 accepted items and, since
  // D5, the 10 new strict-gate rejections (fail -> unsupported, "changed" under the old rule)...
  const raw = compareSnapshots(prev, step);
  assert.equal(raw.verdict, "FAIL");
  assert.deepEqual(
    raw.items
      .filter((x) => x.gating)
      .map((x) => x.key)
      .sort(),
    [...accept.map((e) => e.key), ...rejected].sort(),
  );
  // ...with the acceptances only the 10 rejections gate (06's manifest predates
  // declaredRejections; committed expectations carry no feature, so the tests are listed)...
  const withAccept = compareSnapshots(prev, step, { accept });
  assert.equal(withAccept.verdict, "FAIL");
  const gatingNow = withAccept.items.filter((x) => x.gating);
  assert.deepEqual(gatingNow.map((x) => x.key).sort(), rejected);
  assert.ok(gatingNow.every((x) => x.class === "rejection" && x.before === "fail"));
  // ...and with the declaration the step would have needed, it passes.
  const declared = [
    {
      feature: "css:page-varying-width",
      reason: "step 06 rejects :first/:left/:right rules that give pages different content widths",
      evidence: "wpt/results.json cause.feature of the step-06 run; baselines/port/README.md",
      tests: STEP06_REJECTED,
    },
  ];
  const r = compareSnapshots(prev, step, { accept, declared });
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.filter((x) => x.gating).length, 0);
  assert.equal(r.items.filter((x) => x.class === "declared").length, 10);
  // A declaration of another feature covers nothing.
  const wrong = compareSnapshots(prev, step, {
    accept,
    declared: [{ ...declared[0], feature: "css:grid", tests: undefined }],
  });
  assert.equal(wrong.items.filter((x) => x.gating).length, 10);
  assert.equal(wrong.unusedDeclarations.length, 1);
  // The step's targets: the notification footer is drawn (EXT-2 per extractor), the footers
  // sit where Chrome prints them (boleto REF-W max was its footer "1"), page-size-006 (:first).
  for (const [key, before, after] of [
    ["notification|EXT-2|oracles:text|plain|criterion#1|statusRank.pdfminer.six", 2, 3],
    ["notification|EXT-2|oracles:text|plain|criterion#1|statusRank.pymupdf", 2, 3],
    ["receipt|EXT-2|oracles:text|plain|criterion#1", "WARN", "PASS"],
    ["boleto|REF-W|oracles:layout|plain|criterion#1|maxMm", 4.64, 2.62],
    ["receipt|REF-W|oracles:layout|plain|criterion#1|maxMm", 1.37, 0.77],
    ["wpt|css/css-page/page-size-006-print.html", "fail", "pass"],
  ]) {
    const x = item(r, key);
    assert.deepEqual([x.class, x.before, x.after], ["improvement", before, after], key);
  }
});

test("port/07-media-print passes vs port/06-page-rules with no acceptedRegressions and no change", () => {
  const prev = loadBaselineDir(join(baselines, "port", "06-page-rules"));
  const step = loadBaselineDir(join(baselines, "port", "07-media-print"));
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/06-page-rules");
  assert.deepEqual(step.manifest.acceptedRegressions, []);
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  // Styling for print changes which @media rules cascade; no corpus document or WPT reftest
  // has a print/screen rule that applies at its page size, so every compared value is
  // unchanged and the 38 vellora PDFs are byte-identical to step 06's
  // (attachments/pdf-identity-vs-06-page-rules.json). The behaviour is covered by
  // crates/vellora-core/tests/media_print.rs (Chrome 155 probes).
  const r = compareSnapshots(prev, step);
  assert.equal(r.verdict, "PASS");
  assert.deepEqual(
    r.items.filter((x) => x.class !== "unchanged").map((x) => `${x.class} ${x.key}`),
    [],
  );
});

test("port/08-html-parse passes vs port/07-media-print with no acceptedRegressions; the postmark text is back (v1 pdf-probe)", () => {
  const prev = v1("port", "07-media-print");
  const step = v1("port", "08-html-parse");
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/07-media-print");
  assert.deepEqual(step.manifest.acceptedRegressions, []);
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  // Every document is parsed as HTML. oss-postmark-receipt (XHTML 1.0 Transitional doctype) was
  // parsed as XML by blitz-html's sniffing from step 05 to 07 and lost the text after its three
  // <br>; that is what step 05 accepted as 9 'html-normalize-compensation' rows, retired here.
  // Without acceptances the comparison passes, and its only non-unchanged items are those 9
  // rows coming back plus the pdf-probe pairing change ("Download as PDF" now lies below the
  // page edge of vellora's single page, as at step 04; "The [Product Name] team" pairs again).
  const r = compareSnapshots(prev, step);
  assert.equal(r.verdict, "PASS");
  const pm = "oss-postmark-receipt";
  const expected = [
    [`${pm}|INV-X1|corpus||criterion#1`, "FAIL", "PASS"],
    [`${pm}|INV-X2|corpus||criterion#1`, "FAIL", "PASS"],
    [`${pm}|INV-X1|corpus||criterion#1|found`, 5, 6],
    [`${pm}|INV-X2|corpus||criterion#1|found.pdftotext`, 5, 6],
    [`${pm}|INV-X2|corpus||criterion#1|found.pypdf`, 5, 6],
    [`${pm}|INV-X2|corpus||criterion#1|found.pdfminer`, 5, 6],
    // Back to their step-04 values: 38, 2, 40.
    [`${pm}|EXT-2|oracles:text|plain|criterion#1|missing.pdftotext`, 39, 38],
    [`${pm}|EXT-2|oracles:text|plain|criterion#1|missing.pdfminer.six`, 11, 2],
    [`${pm}|EXT-2|oracles:text|plain|criterion#1|missing.pymupdf`, 41, 40],
  ];
  for (const [key, before, after] of expected) {
    const x = item(r, key);
    assert.deepEqual([x.class, x.before, x.after], ["improvement", before, after], key);
  }
  assert.deepEqual(
    r.items
      .filter((x) => x.class !== "unchanged")
      .map((x) => `${x.class} ${x.key}`)
      .sort(),
    [...expected.map(([k]) => `improvement ${k}`), `changed pdf-probe|${pm}|unpaired`].sort(),
  );
  // No WPT outcome moves: the harness keeps an XML parse for the nodes WPT serves as XML.
  assert.equal(r.items.filter((x) => x.check === "wpt" && x.class !== "unchanged").length, 0);
  // Against step 04 (before the XML parse cost text) no postmark value differs at all: its
  // three PDFs are byte-identical to step 04's (attachments/pdf-identity-vs-07-media-print.json).
  const s04 = v1("port", "04-block-offset");
  const r04 = compareSnapshots(s04, step);
  assert.deepEqual(
    r04.items.filter((x) => x.key.includes(pm) && x.class !== "unchanged").map((x) => x.key),
    [],
  );
});

test("port/09-review-fixes passes vs port/08-html-parse with no acceptedRegressions and no change (v1 pdf-probe)", () => {
  const prev = v1("port", "08-html-parse");
  const step = v1("port", "09-review-fixes");
  assert.equal(step.integrity.ok, true, step.integrity.problems.join("; "));
  assert.equal(step.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(step.manifest.gate.verdict, "PASS");
  assert.equal(step.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(step.manifest.gate.baseline, "fidelity/baselines/port/08-html-parse");
  assert.deepEqual(step.manifest.acceptedRegressions, []);
  assert.equal(step.provenance.git.dirtyEntries, 0);
  assert.equal(Object.keys(step.crashtests.results).length, 239);
  assert.ok(step.codeChecks.length === 4 && step.codeChecks.every((c) => c.status === "pass"));
  // The six review fixes (no recursion before the depth gate, signed margins after a forced
  // break, Stylo-evaluated break-* media queries, RTL inline padding, forced-break fit, test
  // accuracy) change no corpus document or WPT reftest: every compared value is unchanged and
  // the 47 vellora PDFs are byte-identical to step 08's
  // (attachments/pdf-identity-vs-08-html-parse.json). The behaviour is covered by Chrome 155
  // probes in crates/vellora-core/tests (attachments/chrome-probes-review-fixes.json).
  const r = compareSnapshots(prev, step);
  assert.equal(r.verdict, "PASS");
  assert.equal(r.counts.gating, 0);
  assert.deepEqual(
    r.items.filter((x) => x.class !== "unchanged").map((x) => `${x.class} ${x.key}`),
    [],
  );
});

// ---- pdf-probe v2 (semantics 2) on the re-scored chain --------------------------------------

const CHAIN = [
  "pin",
  "beta4",
  "beta4-gated",
  "port/00-start",
  "port/01-pagination-gaps",
  "port/02-delete-noop-passes",
  "port/03-table-passes",
  "port/04-block-offset",
  "port/05-walk-rewrite",
  "port/06-page-rules",
  "port/07-media-print",
  "port/08-html-parse",
  "port/09-review-fixes",
];
const cur = (link) => loadBaselineDir(join(baselines, ...link.split("/")));

test("every committed link carries a v2 pdf-probe section re-scored from its own run's PDFs", () => {
  for (const link of CHAIN) {
    const b = cur(link);
    assert.equal(b.integrity.ok, true, `${link}: ${b.integrity.problems.join("; ")}`);
    const m = b.manifest.pdfProbeRescore;
    assert.equal(m.semantics, 2, link);
    assert.ok(
      Object.values(b.pdfProbe).every((s) => s.semantics === 2),
      link,
    );
    // The run's own v1 probe re-compacts to the committed v1 section: same PDFs (pin had none).
    const want = link === "pin" ? "baseline has no v1 section" : "identical";
    assert.ok(
      Object.values(m.v1Identity).every((x) => x === want),
      `${link}: ${JSON.stringify(m.v1Identity)}`,
    );
    assert.equal(m.source.matchesManifestSource, link !== "beta4", link);
  }
  // Missing inputs are recorded, never silently dropped: the pin run kept invoice + notification
  // only; beta4's A/B PDFs were not kept, so beta4-gated's stand in (evidence in the manifest).
  assert.deepEqual(
    cur("pin").manifest.pdfProbeRescore.missing.map((x) => x.fixture),
    [
      "boleto",
      "boleto-febraban",
      "danfe",
      "oss-postmark-receipt",
      "oss-sparksuite-invoice",
      "receipt",
      "text-stress-ptbr",
    ],
  );
  assert.match(cur("beta4").manifest.pdfProbeRescore.source.substitute, /no run copy kept/);
  assert.deepEqual(Object.keys(cur("beta4").pdfProbe), [
    "boleto",
    "invoice",
    "notification",
    "receipt",
  ]);
});

test("a v1 baseline against a v2 snapshot is REFUSED (pdf-probe semantics differ)", () => {
  const r = compareSnapshots(v1("port", "06-page-rules"), cur("port/07-media-print"));
  assert.equal(r.verdict, "REFUSED");
  assert.match(r.refusals.join("; "), /pdf-probe semantics differ: baseline 1, run 2/);
});

test("v2: links whose vellora PDFs equal the previous link's show no pdf-probe item at all", () => {
  // 00-start = beta4-gated, 02 = 01, 07 = 06, 09 = 08 (byte-identical vellora PDFs; Chrome's PyMuPDF
  // words are identical across every run): no Chrome or extractor jitter reaches the section.
  for (const [prev, link] of [
    ["beta4-gated", "port/00-start"],
    ["port/01-pagination-gaps", "port/02-delete-noop-passes"],
    ["port/06-page-rules", "port/07-media-print"],
    ["port/08-html-parse", "port/09-review-fixes"],
  ]) {
    const r = compareSnapshots(cur(prev), cur(link));
    assert.deepEqual(
      r.items.filter((x) => x.check === "pdf-probe"),
      [],
      link,
    );
  }
});

test("v2 re-judges the chain: gating pdf-probe items per link vs the previous link", () => {
  // With each link's own (v1-era) acceptedRegressions applied: their pdf-probe keys match no v2
  // key, every other accepted item still matches, so what gates is exactly the v2 pdf-probe debt.
  // I1 (2026-10-22): a word that crosses Chrome to more than 1 pt on the other side gates, so
  // 01 / 03 / 04 gate 168 / 230 / 1632 (55 / 84 / 1403 before I1).
  const expected = {
    "port/01-pagination-gaps": 168,
    "port/03-table-passes": 230,
    "port/04-block-offset": 1632,
    "port/05-walk-rewrite": 6,
    "port/06-page-rules": 0,
    "port/08-html-parse": 0,
    "port/09-review-fixes": 0,
  };
  for (const [link, n] of Object.entries(expected)) {
    const step = cur(link);
    const r = compareSnapshots(cur(CHAIN[CHAIN.indexOf(link) - 1]), step, {
      accept: step.manifest.acceptedRegressions,
    });
    assert.equal(r.items.filter((x) => x.gating && x.check === "pdf-probe").length, n, link);
    // Outside pdf-probe only step 06's 10 undeclared rejections gate (D5).
    const other = r.items.filter((x) => x.gating && x.check !== "pdf-probe");
    assert.equal(other.length, link === "port/06-page-rules" ? 10 : 0, link);
    assert.ok(
      other.every((x) => x.class === "rejection"),
      link,
    );
  }
});

test("v2 gates the step-05 text loss v1 only reported (D3): postmark's 'The [Product Name] team'", () => {
  const r = compareSnapshots(cur("port/04-block-offset"), cur("port/05-walk-rewrite"));
  assert.deepEqual(
    r.items
      .filter((x) => x.gating && x.key.startsWith("pdf-probe|oss-postmark-receipt|"))
      .map((x) => x.key)
      .sort(),
    [
      "pdf-probe|oss-postmark-receipt|p1|Name]#3|pairing",
      "pdf-probe|oss-postmark-receipt|p1|The#1|pairing",
      "pdf-probe|oss-postmark-receipt|p1|[Product#4|pairing",
      "pdf-probe|oss-postmark-receipt|p1|team#2|pairing",
      "pdf-probe|oss-postmark-receipt|unpaired-chrome",
      "pdf-probe|oss-postmark-receipt|unpaired-vellora",
    ],
  );
  const c = item(r, "pdf-probe|oss-postmark-receipt|unpaired-chrome");
  assert.deepEqual([c.before, c.after], [42, 46]);
  // v1 saw the same change as a non-gating "changed" item.
  const old = compareSnapshots(v1("port", "04-block-offset"), v1("port", "05-walk-rewrite"));
  const u = item(old, "pdf-probe|oss-postmark-receipt|unpaired");
  assert.deepEqual([u.class, u.gating], ["changed", false]);
});

test("v2 of 08 vs 07: postmark's 'The [Product Name] team' pairs again; nothing gates", () => {
  // The step-05 loss v2 gates (above) is undone by the HTML-only parse. unpaired-vellora 3 -> 0
  // reads as an improvement, but its 3 words ("Download as PDF") are not gone: they now lie
  // below the page edge of vellora's single page (README 08-html-parse), where the v2 word list
  // does not see them. An off-page word is not gated yet (INTEGRATION-TODO item 2).
  const step = cur("port/08-html-parse");
  const r = compareSnapshots(cur("port/07-media-print"), step, {
    accept: step.manifest.acceptedRegressions,
  });
  assert.equal(r.verdict, "PASS");
  assert.equal(r.counts.gating, 0);
  const pm = "pdf-probe|oss-postmark-receipt";
  assert.deepEqual(
    r.items
      .filter((x) => x.check === "pdf-probe")
      .map((x) => `${x.class} ${x.key} ${x.before} -> ${x.after}`)
      .sort(),
    [
      `improvement ${pm}|unpaired-chrome 46 -> 42`,
      `improvement ${pm}|unpaired-vellora 3 -> 0`,
      `newly-measured ${pm}|p1|Name]#3|pairing unpaired -> dx 0.97 dy 35.1`,
      `newly-measured ${pm}|p1|The#1|pairing unpaired -> dx 0.97 dy 35.1`,
      `newly-measured ${pm}|p1|[Product#4|pairing unpaired -> dx 0.97 dy 35.1`,
      `newly-measured ${pm}|p1|team#2|pairing unpaired -> dx 0.97 dy 35.1`,
    ].sort(),
  );
});
