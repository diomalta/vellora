// Gate rules for pdf-probe v2 sections (gate/compare.mjs comparePdfProbeV2) and the refusal of
// sections with different semantics (mirrors the WPT inkCheck / HARNESS_SEMANTICS refusal).
import assert from "node:assert/strict";
import { test } from "node:test";
import { compactProbeV2, probeResultV2, textKey } from "../../layout-diff/lib/pdf-probe-v2.mjs";
import { compareSnapshots } from "../compare.mjs";
import { byKey, gating, snapshot } from "./helpers.mjs";

const w = (page, text, x, y, size = 10) => ({ page, text, key: textKey(text), x, y, size });
const CHROME = [
  w(1, "Total", 400, 100),
  w(1, "de", 50, 120),
  w(1, "de", 50, 140),
  w(1, "Assinatura", 50, 700),
  w(2, "Fim", 50, 60),
];
const section = (vellora) =>
  compactProbeV2(probeResultV2({ velloraWords: vellora, chromeWords: CHROME }));
const compare = (b, a) =>
  compareSnapshots(snapshot([], { pdfProbe: { inv: b } }), snapshot([], { pdfProbe: { inv: a } }));
const BASE = [
  w(1, "Total", 400.5, 100.2),
  w(1, "de", 50, 121),
  w(1, "de", 50, 141),
  w(1, "Assinatura", 50, 702),
  w(2, "Fim", 50, 60),
];

test("v2 vs v2, nothing moved: PASS, every axis unchanged", () => {
  const r = compare(section(BASE), section(BASE));
  assert.equal(r.verdict, "PASS");
  assert.equal(r.items.length, 0);
  assert.equal(r.counts.unchanged, 5 * 2 + 2);
});

test("v2: |dy| growing by more than 1 pt gates; by less counts as withinTolerance, not silently", () => {
  const moved = BASE.map((x) =>
    x.text === "Assinatura" ? { ...x, y: x.y + 1.5 } : x.text === "Total" ? { ...x, y: 100.9 } : x,
  );
  const r = compare(section(BASE), section(moved));
  const item = byKey(r, "pdf-probe|inv|p1|Assinatura#1|dy");
  assert.deepEqual(
    [item.class, item.gating, item.before, item.after],
    ["regression", true, 2, 3.5],
  );
  assert.equal(byKey(r, "pdf-probe|inv|p1|Total#1|dy"), undefined);
  assert.equal(r.counts.withinTolerance, 1);
  assert.equal(r.verdict, "FAIL");
});

test("v2: a deleted word gates twice: its Chrome word's pairing and the unpaired-chrome count", () => {
  const r = compare(section(BASE), section(BASE.filter((x) => !(x.text === "de" && x.y === 141))));
  assert.deepEqual(
    gating(r)
      .map((i) => i.key)
      .sort(),
    ["pdf-probe|inv|p1|de#2|pairing", "pdf-probe|inv|unpaired-chrome"],
  );
  const c = byKey(r, "pdf-probe|inv|unpaired-chrome");
  assert.deepEqual([c.before, c.after, c.tolClass], [0, 1, "count"]);
  assert.match(c.detail, /"de" p1/);
});

test("v2: a word moved to another page than Chrome's loses its pairing (gates) and adds an extra vellora word", () => {
  const r = compare(
    section(BASE),
    section(BASE.map((x) => (x.text === "Assinatura" ? { ...x, page: 2 } : x))),
  );
  assert.equal(byKey(r, "pdf-probe|inv|p1|Assinatura#1|pairing").gating, true);
  assert.equal(byKey(r, "pdf-probe|inv|unpaired-vellora").class, "regression");
  assert.equal(byKey(r, "pdf-probe|inv|unpaired-chrome").class, "regression");
});

test("v2: a word that comes back is newly-measured and the counts improve (never gates)", () => {
  const lost = section(BASE.filter((x) => x.text !== "Fim"));
  const r = compare(lost, section(BASE));
  assert.equal(r.verdict, "PASS");
  assert.equal(byKey(r, "pdf-probe|inv|p2|Fim#1|pairing").class, "newly-measured");
  assert.equal(byKey(r, "pdf-probe|inv|unpaired-chrome").class, "improvement");
});

test("v2: a fixture the baseline measured and the run lacks is removed (gates)", () => {
  const r = compareSnapshots(
    snapshot([], { pdfProbe: { inv: section(BASE), other: section(BASE) } }),
    snapshot([], { pdfProbe: { inv: section(BASE) } }),
  );
  assert.deepEqual(
    gating(r).map((i) => [i.key, i.class]),
    [["pdf-probe|other", "removed"]],
  );
});

test("v2 accepted regressions match by key and after value like every other item", () => {
  const moved = BASE.map((x) => (x.text === "Assinatura" ? { ...x, y: x.y + 3 } : x));
  const accept = [
    {
      key: "pdf-probe|inv|p1|Assinatura#1|dy",
      after: 5,
      reason: "test",
      evidence: "synthetic",
    },
  ];
  const r = compareSnapshots(
    snapshot([], { pdfProbe: { inv: section(BASE) } }),
    snapshot([], { pdfProbe: { inv: section(moved) } }),
    { accept },
  );
  assert.equal(r.verdict, "PASS");
  assert.equal(byKey(r, "pdf-probe|inv|p1|Assinatura#1|dy").class, "accepted");
});

test("v1 baseline vs v2 run (or the reverse) is REFUSED with no pdf-probe items", () => {
  const v1 = {
    pages: {},
    words: {},
    pairs: [{ k: "Total#1", text: "Total", page: 1, samePage: true, dx: 0, dy: 2.1 }],
  };
  for (const [b, a] of [
    [v1, section(BASE)],
    [section(BASE), v1],
  ]) {
    const r = compare(b, a);
    assert.equal(r.verdict, "REFUSED");
    assert.match(r.refusals.join("; "), /pdf-probe: pdf-probe semantics differ/);
    assert.equal(r.items.filter((i) => i.check === "pdf-probe").length, 0);
  }
});

test("v2 sections of different settings or Chrome reference words are REFUSED", () => {
  const other = { ...section(BASE), settings: { ...section(BASE).settings, maxDistancePt: 72 } };
  assert.match(compare(section(BASE), other).refusals.join(";"), /settings differ for inv/);
  const otherChrome = compactProbeV2(
    probeResultV2({ velloraWords: BASE, chromeWords: CHROME.map((x) => ({ ...x, x: x.x + 1 })) }),
  );
  assert.match(
    compare(section(BASE), otherChrome).refusals.join(";"),
    /Chrome reference words differ for inv/,
  );
});
