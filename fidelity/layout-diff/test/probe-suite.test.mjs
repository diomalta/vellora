// The probe fixture suite (layout-diff/probes/, run by probe-suite.mjs as run-all step
// pdf-probe-suite): its committed data, its fixture names, and how the gate reads its rows.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compareSnapshots } from "../../gate/compare.mjs";
import { loadRunDir } from "../../gate/snapshot.mjs";
import { compactProbeV2, probeResultV2 } from "../lib/pdf-probe-v2.mjs";
import { DEFAULT_SUITE, loadSuite, probeFixture } from "../probe-suite.mjs";

// The suite's source: port/09-review-fixes/attachments/chrome-probes-review-fixes.json (pruned
// 2026-10-28 with that link; it lives at the local tag fidelity-archive-2026-10-28, b5c9546).
// sha256 of JSON.stringify(Object.entries(attachment.probes).map(([id, p]) => [id, p.html,
// p.targets])) over that file: the suite must still be its 37 probes, ids, HTML and targets
// verbatim, in order.
const ATTACHMENT_PROBES_SHA256 = "1c83eefbb4d44b003a96a1f8c5151ba1a15b14bb156745bed25cdb887bf56745";

test("the committed suite is step 09's 37 Chrome probes, HTML verbatim, deterministic names", () => {
  const suite = loadSuite(DEFAULT_SUITE);
  assert.equal(suite.name, "review-fixes-09");
  assert.equal(suite.probes.length, 37);
  const list = suite.probes.map((p) => [p.id, p.html, p.targets]);
  assert.equal(
    createHash("sha256").update(JSON.stringify(list)).digest("hex"),
    ATTACHMENT_PROBES_SHA256,
  );
  assert.equal(probeFixture("f5_table_partial"), "probe-f5_table_partial");
});

test("a malformed suite is refused", () => {
  const dir = mkdtempSync(join(tmpdir(), "probe-suite-"));
  const f = join(dir, "suite.json");
  const doc = (probes) =>
    JSON.stringify({ schema: "vellora-fidelity/probe-suite/1", name: "x", probes });
  writeFileSync(
    f,
    doc([
      { id: "a", html: "<p>x</p>" },
      { id: "a", html: "<p>y</p>" },
    ]),
  );
  assert.throws(() => loadSuite(f), /duplicate probe id a/);
  writeFileSync(f, doc([{ id: "A-1", html: "<p>x</p>" }]));
  assert.throws(() => loadSuite(f), /bad probe id/);
  writeFileSync(f, doc([{ id: "a" }]));
  assert.throws(() => loadSuite(f), /no html/);
});

test("a run's probe rows load as pdf-probe fixtures; vs a baseline without them they are newly measured, then ratcheted", () => {
  const word = (page, text, x, y) => ({ page, text, key: text, x, y, size: 12, font: "f" });
  const chrome = [word(1, "One", 15, 26.25), word(2, "Two", 15, 26.25)];
  const section = (twoY) =>
    probeResultV2({
      velloraWords: [word(1, "One", 15, 26.25), word(2, "Two", 15, twoY)],
      chromeWords: chrome,
      velloraOffPage: [],
      chromeOffPage: [],
    });
  const dir = mkdtempSync(join(tmpdir(), "probe-run-"));
  writeFileSync(join(dir, "summary.json"), JSON.stringify({ schema: "x", fixtures: [] }));
  const fx = probeFixture("m_posneg");
  mkdirSync(join(dir, "layout-diff", fx, "run-all"), { recursive: true });
  writeFileSync(
    join(dir, "layout-diff", fx, "run-all", "pdf-probe.json"),
    JSON.stringify(section(26.25)),
  );
  const run = loadRunDir(dir);
  assert.deepEqual(Object.keys(run.pdfProbe), [fx]);
  const none = { ...run, pdfProbe: {} };
  const first = compareSnapshots(none, run);
  assert.deepEqual(
    first.items.map((i) => [i.key, i.class, i.gating]),
    [[`pdf-probe|${fx}`, "newly-measured", false]],
  );
  // Step 08 -> 09 on m_posneg ("Two" 45.00 -> 37.50 pt): a move of a probe word gates like any.
  const later = { ...run, pdfProbe: { [fx]: compactProbeV2(section(45)) } };
  const r = compareSnapshots(run, later);
  assert.deepEqual(
    r.items.filter((i) => i.gating).map((i) => i.key),
    [`pdf-probe|${fx}|p2|Two#1|dy`],
  );
});
