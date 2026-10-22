// The probe fixture suite (layout-diff/probes/, run by probe-suite.mjs as run-all step
// pdf-probe-suite): its committed data, its fixture names, and how the gate reads its rows.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "../../gate/compare.mjs";
import { loadRunDir } from "../../gate/snapshot.mjs";
import { compactProbeV2, probeResultV2 } from "../lib/pdf-probe-v2.mjs";
import { DEFAULT_SUITE, loadSuite, probeFixture } from "../probe-suite.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const attachment = JSON.parse(
  readFileSync(
    join(
      repo,
      "fidelity/baselines/port/09-review-fixes/attachments/chrome-probes-review-fixes.json",
    ),
    "utf8",
  ),
);

test("the committed suite is step 09's 37 Chrome probes, HTML verbatim, deterministic names", () => {
  const suite = loadSuite(DEFAULT_SUITE);
  assert.equal(suite.name, "review-fixes-09");
  assert.equal(suite.probes.length, 37);
  assert.deepEqual(
    suite.probes.map((p) => p.id),
    Object.keys(attachment.probes),
  );
  for (const p of suite.probes) {
    assert.equal(p.html, attachment.probes[p.id].html, p.id);
    assert.equal(p.targets, attachment.probes[p.id].targets, p.id);
  }
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
