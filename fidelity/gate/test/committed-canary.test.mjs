// REAL canary on committed data (no render, deterministic): the chain head port/00-start (the
// Blitz 0.3.0-beta.4 bump plus the whitespace-test and reader fixes) taken as the "run" against
// the pin baseline (the published v0.2.0 at Blitz 2003ba5) MUST be flagged for the regressions
// the old status-only ratchet missed (notification REF-W 3.60 -> 8.54 mm, invoice REF-W 2.44 ->
// 3.91 mm) and for the 53 WPT clean-pass regressions; a baseline against itself shows none. And
// the latest port link must reproduce its own committed gate verdict against the link it was
// gated with.
//
// Kept set (2026-10-28 prune, fidelity/scripts/prune-evidence.mjs --keep-latest): pin, the chain
// head, the latest link and the link it was gated against. Until then this file also replayed
// beta4 / beta4-gated and every intermediate link 01..09 (each PASS against its predecessor with
// exactly its acceptedRegressions, the v2 pdf-probe re-score of the chain, the EXT-2 token set on
// 08 vs 07); those checks were deleted with their baselines. They live, with the data, at the
// local tag fidelity-archive-2026-10-28 (b5c95460eebedcc86a6dce3c0e262a940b0a8c27).
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "../compare.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const load = (...parts) => loadBaselineDir(join(baselines, ...parts));
const pin = load("pin");
const head = load("port", "00-start");
const s10 = load("port", "10-integration");
const s11 = load("port", "11-phase-c");
const item = (r, key) => r.items.find((i) => i.key === key);

test("committed baselines pass their manifest sha256 integrity check", () => {
  for (const [name, b, n] of [
    ["pin", pin, 24],
    ["port/00-start", head, 42],
    ["port/10-integration", s10, 65],
    ["port/11-phase-c", s11, 65],
  ]) {
    assert.equal(b.integrity.ok, true, `${name}: ${b.integrity.problems.join("; ")}`);
    assert.equal(b.integrity.checked, n, name);
  }
});

test("pin vs the chain head: REF-W regressions of notification and invoice are flagged with before/after", () => {
  const r = compareSnapshots(pin, head);
  assert.equal(r.verdict, "FAIL");
  const n = item(r, "notification|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([n.class, n.gating, n.before, n.after], ["regression", true, 3.6, 8.54]);
  const i = item(r, "invoice|REF-W|oracles:layout|plain|criterion#1|maxMm");
  assert.deepEqual([i.class, i.gating, i.before, i.after], ["regression", true, 2.44, 3.91]);
  // The status of the row stayed FAIL -> FAIL: the old status-only ratchet was blind to this.
  assert.equal(item(r, "notification|REF-W|oracles:layout|plain|criterion#1"), undefined);
});

test("pin vs the chain head: 53 WPT clean-pass regressions gate, flagged-pass regressions are only reported", () => {
  const r = compareSnapshots(pin, head);
  const wpt = r.items.filter((x) => x.check === "wpt");
  assert.equal(wpt.filter((x) => x.class === "regression" && x.gating).length, 53);
  assert.equal(wpt.filter((x) => x.class === "reported" && !x.gating).length, 102);
});

test("pin vs the chain head: text-extraction and DANFE losses are value regressions too", () => {
  const r = compareSnapshots(pin, head);
  const x = item(r, "boleto-febraban|BOL-X1|corpus||criterion#1|found");
  assert.deepEqual([x.class, x.before, x.after], ["regression", 13, 11]);
  assert.equal(item(r, "danfe|DANFE-F11|corpus||criterion#1").class, "regression");
  assert.equal(item(r, "danfe|DANFE-B3|corpus||criterion#1").class, "improvement");
});

test("a baseline against itself: no gating item", () => {
  for (const b of [head, s11]) {
    const r = compareSnapshots(b, b);
    assert.equal(r.verdict, "PASS");
    assert.deepEqual(
      r.items.filter((x) => x.gating),
      [],
    );
  }
});

test("port/00-start (head of the port chain, baselines/port/README.md) was written from a PASS, not --force", () => {
  assert.equal(head.source.schema, "vellora-fidelity/baseline/2");
  assert.equal(head.manifest.gate.verdict, "PASS");
  assert.equal(head.manifest.gate.writtenDespiteVerdict, false);
  // Its own previous link (beta4-gated) was pruned; the PASS is the recorded verdict.
  assert.equal(head.manifest.gate.baseline, "fidelity/baselines/beta4-gated");
  assert.deepEqual(head.manifest.acceptedRegressions, []);
  assert.equal(Object.keys(head.crashtests.results).length, 239);
  assert.ok(head.codeChecks.length === 4 && head.codeChecks.every((c) => c.status === "pass"));
});

test("port/11-phase-c reproduces its committed gate vs port/10-integration: PASS only with its 3 class-a acceptances", () => {
  const g = s11.manifest.gate;
  assert.equal(g.verdict, "PASS");
  assert.equal(g.writtenDespiteVerdict, false);
  assert.equal(g.baseline, "fidelity/baselines/port/10-integration");
  assert.equal(s10.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(s11.manifest.acceptedRegressions.length, 13);
  assert.ok(s11.manifest.acceptedRegressions.every((e) => e.class === "a"));
  assert.equal(Object.keys(s11.crashtests.results).length, 239);
  assert.ok(s11.codeChecks.length === 4 && s11.codeChecks.every((c) => c.status === "pass"));

  const r = compareSnapshots(s10, s11, { accept: s11.manifest.acceptedRegressions });
  assert.equal(r.verdict, "PASS");
  const counts = {};
  for (const i of r.items) counts[i.class] = (counts[i.class] ?? 0) + 1;
  // The link-to-link classes of the committed gate (the head/pin/doc counts need the run).
  for (const k of ["improvement", "newly-measured", "reported", "changed", "accepted"]) {
    assert.equal(counts[k], g.counts[k], k);
  }
  assert.equal(counts["within-tolerance"], g.counts["within-tolerance"]);
  assert.equal(r.items.filter((x) => x.gating).length, g.counts.gating);
  assert.equal(g.counts.gating, 0);
  assert.deepEqual(
    r.items
      .filter((x) => x.class === "accepted")
      .map((x) => x.key)
      .sort(),
    [
      "wpt|css/css-page/page-name-flex-001-print.html",
      "wpt|css/css-page/page-name-flex-002-print.html",
      "wpt|css/css-page/page-name-flex-004-print.html",
    ],
  );
  // Without them exactly those 3 gate.
  const bare = compareSnapshots(s10, s11);
  assert.equal(bare.verdict, "FAIL");
  assert.equal(bare.items.filter((x) => x.gating).length, 3);
});

test("every kept link carries a v2 pdf-probe section; a v1 baseline against a v2 snapshot is REFUSED", () => {
  for (const [name, b] of [
    ["pin", pin],
    ["port/00-start", head],
    ["port/10-integration", s10],
    ["port/11-phase-c", s11],
  ]) {
    assert.ok(
      Object.keys(b.pdfProbe).length >= 9 &&
        Object.values(b.pdfProbe).every((s) => s.semantics === 2),
      name,
    );
  }
  // The pair keys name Chrome words: the pin's must be the chain's (else the pin view is REFUSED).
  for (const fx of Object.keys(pin.pdfProbe)) {
    assert.equal(
      pin.pdfProbe[fx].reference.chromeWordsSha256,
      head.pdfProbe[fx].reference.chromeWordsSha256,
      fx,
    );
  }
  const v1 = loadBaselineDir(join(baselines, "port", "00-start"), {
    pdfProbe: "v1",
    ext2Tokens: false,
  });
  const r = compareSnapshots(v1, s11);
  assert.equal(r.verdict, "REFUSED");
  assert.match(r.refusals.join("; "), /pdf-probe semantics differ: baseline 1, run 2/);
});
