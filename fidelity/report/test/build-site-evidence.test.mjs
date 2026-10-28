// Site evidence (fidelity/report): status stamping, the manifest's link to the committed oracle
// outputs, chart accessibility, image hygiene, and that every generated docs block is in sync
// with the committed manifest (no hand-typed numbers can drift).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { pagesToShow } from "../build-site-evidence.mjs";
import {
  DOC_FILES,
  FIXTURES,
  RELEASE_PLACEHOLDER,
  applyBlocks,
  buildManifest,
  checkDocs,
  crossCheck,
  evidenceStatus,
  gateConditions,
  paintSection,
  renderBlocks,
  renderCharts,
  statusStamp,
} from "../lib/evidence.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT = join(REPO, "docs/assets/fidelity");
const json = (p) => JSON.parse(readFileSync(join(REPO, p), "utf8"));
const manifest = json("docs/assets/fidelity/manifest.json");

const m = (over = {}) => ({
  pages: 1,
  chromePages: 1,
  pageDelta: 0,
  chromeWords: 10,
  subjectWords: 10,
  pairedWords: 10,
  missingWords: 0,
  extraWords: 0,
  medianMm: 0.5,
  p90Mm: 0.9,
  within1mmPct: 100,
  samePagePct: 100,
  inputs: { chromeGeometrySha256: "g", nativeHtmlSha256: "h" },
  ...over,
});

function synthetic(gate, extra = {}) {
  const metrics = Object.fromEntries(
    FIXTURES.map((f, i) => [
      f.id,
      { pin: m({ medianMm: 2 + i, within1mmPct: 10 }), c02: m({ medianMm: 0.1 * (i + 1) }) },
    ]),
  );
  return buildManifest({
    metrics,
    pinKey: "pin",
    newKey: "c02",
    pinDoc: { engine: { commit: "a".repeat(40), blitz: "b".repeat(40) }, method: {} },
    runSummary: {
      runId: "R",
      dateIso: "2026-01-01T00:00:00Z",
      command: "node fidelity/run-all.mjs",
      environment: {
        os: "darwin 27.0.0 arm64",
        chrome: { version: "Google Chrome for Testing 1" },
        git: { head: "e".repeat(40), branch: "b" },
      },
      wpt: {
        velloraCommit: "c".repeat(40),
        totals: {
          reftests: 10,
          pass: 5,
          passRate: 50,
          passClean: 4,
          passRateClean: 40,
          fail: 4,
          unsupported: 1,
        },
      },
    },
    wptBefore: {
      velloraCommit: "d".repeat(40),
      totals: {
        reftests: 10,
        pass: 3,
        passRate: 30,
        passClean: 2,
        passRateClean: 20,
        fail: 6,
        unsupported: 1,
      },
    },
    gate,
    ...extra,
  });
}

test("status is DRAFT unless the gate verdict is PASS", () => {
  assert.equal(evidenceStatus(undefined), "DRAFT");
  assert.equal(evidenceStatus({ verdict: "FAIL" }), "DRAFT");
  assert.equal(evidenceStatus({ verdict: "REFUSED" }), "DRAFT");
  assert.equal(evidenceStatus({ verdict: "PASS" }), "PASS");
  assert.equal(synthetic(null).status, "DRAFT");
  assert.equal(synthetic({ verdict: "FAIL", counts: {} }).status, "DRAFT");
  assert.equal(synthetic({ verdict: "PASS", counts: {} }).status, "PASS");
  assert.match(synthetic(null).authority, /^INDICATIVE/);
});

test("headline values are derived from the fixtures, with definitions", () => {
  const h = synthetic(null).headline;
  assert.equal(h.fixtures, FIXTURES.length);
  assert.equal(h.allWordsWithin1mm.after, FIXTURES.length);
  assert.equal(h.allWordsWithin1mm.before, 0);
  assert.equal(h.worstMedianMm.after.fixture, FIXTURES.at(-1).id);
  assert.ok(h.allWordsWithin1mm.what && h.worstMedianMm.what && h.pagesEqualChrome.what);
});

test("crossCheck reports any metric that differs from the oracle output", () => {
  const metrics = { invoice: { c02: m() } };
  const doc = { fixtures: { invoice: m({ medianMm: 0.6 }) } };
  const problems = crossCheck(metrics, "c02", doc, "x");
  assert.ok(problems.some((p) => p.includes("invoice.medianMm")));
  assert.ok(problems.some((p) => p.includes("receipt missing")));
});

test("the committed manifest carries the committed oracle's numbers, before and after", () => {
  const pin = json("fidelity/baselines/pin/doc-aggregate.json");
  const after = json("fidelity/gate/snapshots/2026-10-28/c07/doc-aggregate-c07-tip.json");
  for (const f of manifest.fixtures) {
    for (const [k, v] of Object.entries(f.before))
      assert.equal(v, pin.fixtures[f.id][k], `${f.id}.before.${k}`);
    for (const [k, v] of Object.entries(f.after))
      assert.equal(v, after.fixtures[f.id][k], `${f.id}.after.${k}`);
    assert.equal(
      f.sameChromeGeometry,
      true,
      `${f.id}: both scored against the same Chrome geometry`,
    );
  }
  assert.equal(manifest.before.commit, pin.engine.commit);
  assert.equal(manifest.fixtures.length, FIXTURES.length);
});

test("the committed manifest is PASS (contract gate report PASS) and released in 0.3.0", () => {
  assert.equal(manifest.gate.verdict, "PASS");
  assert.equal(manifest.gate.contract, true);
  assert.equal(manifest.status, "PASS");
  assert.equal(manifest.released, true);
  assert.deepEqual(manifest.release, { version: "0.3.0" });
  assert.equal(manifest.after.label, "vellora 0.3.0");
  assert.equal(manifest.before.label, "vellora 0.2.0 (published)");
  assert.match(manifest.commands.regenerate, / --release 0\.3\.0 /);
  const blocks = renderBlocks(manifest, "vitepress");
  assert.ok(!blocks.status.includes(RELEASE_PLACEHOLDER));
  assert.match(blocks.status, /Released in vellora 0\.3\.0/);
  assert.doesNotMatch(blocks.status, /not merged|not released|released yet/);
  assert.match(blocks.status, /Before is vellora@0\.2\.0, the previous release/);
});

test("every generated docs block is in sync with the committed manifest", () => {
  const problems = checkDocs(manifest, (f) => readFileSync(join(REPO, f), "utf8"));
  assert.deepEqual(problems, []);
});

test("applyBlocks rejects an unknown block name", () => {
  assert.throws(
    () => applyBlocks("<!-- fidelity-evidence:nope -->\n<!-- /fidelity-evidence:nope -->", {}),
    /unknown/,
  );
});

test("charts are accessible, theme-aware and in sync with the manifest", () => {
  for (const [name, svg] of Object.entries(renderCharts(manifest))) {
    assert.match(svg, /role="img"/, name);
    assert.match(svg, /<title id="[^"]+">[^<]+<\/title>/, name);
    assert.match(svg, /<desc id="[^"]+">[^<]+<\/desc>/, name);
    assert.match(svg, /prefers-color-scheme: dark/, name);
    assert.equal(readFileSync(join(OUT, name), "utf8"), svg, `${name} is stale`);
  }
});

/** APPn marker segments of a JPEG up to the first scan. */
function jpegSegments(buf) {
  assert.equal(buf.readUInt16BE(0), 0xffd8);
  const out = [];
  let i = 2;
  while (i < buf.length) {
    const marker = buf.readUInt16BE(i);
    if (marker === 0xffda) break;
    const len = buf.readUInt16BE(i + 2);
    out.push({ marker, id: buf.subarray(i + 4, i + 4 + 12).toString("latin1") });
    i += 2 + len;
  }
  return out;
}

test("page composites carry no EXIF/XMP/ICC metadata and match the manifest hashes", () => {
  assert.ok(manifest.images.length >= FIXTURES.length);
  for (const img of manifest.images) {
    const p = join(OUT, img.file);
    const buf = readFileSync(p);
    const segs = jpegSegments(buf);
    for (const s of segs) {
      assert.ok(
        s.marker !== 0xffe1 && s.marker !== 0xffe2,
        `${img.file}: APP${s.marker - 0xffe0} ${s.id}`,
      );
    }
    assert.equal(createHash("sha256").update(buf).digest("hex"), manifest.files.images[img.file]);
  }
  const og = join(REPO, "docs/public/fidelity/og.jpg");
  assert.ok(existsSync(og));
  for (const s of jpegSegments(readFileSync(og)))
    assert.ok(s.marker !== 0xffe1 && s.marker !== 0xffe2);
});

test("generated files hold no local paths or e-mail addresses", () => {
  const texts = [
    readFileSync(join(OUT, "manifest.json"), "utf8"),
    ...Object.values(renderCharts(manifest)),
    ...DOC_FILES.map((f) => readFileSync(join(REPO, f), "utf8")),
  ];
  for (const t of texts) {
    assert.doesNotMatch(t, /\/Users\/|\/home\/[a-z]/);
    assert.doesNotMatch(t, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/);
  }
});

test("OSS attributions match the fixtures' NOTICE files", () => {
  for (const f of FIXTURES.filter((x) => x.attribution)) {
    const notice = readFileSync(join(REPO, f.attribution.notice), "utf8");
    assert.ok(notice.includes(f.attribution.commit), f.id);
    assert.ok(notice.includes(f.attribution.copyright), f.id);
    assert.ok(notice.includes(f.attribution.url), f.id);
    assert.match(notice, /Licence \| MIT/);
  }
});

test("pagesToShow: page 1, plus every page that not all three PDFs have", () => {
  assert.deepEqual(pagesToShow({ pages: 3 }, { pages: 3 }, 3), [1]);
  assert.deepEqual(pagesToShow({ pages: 2 }, { pages: 1 }, 1), [1, 2]);
  assert.deepEqual(pagesToShow({ pages: 1 }, { pages: 1 }, 2), [1, 2]);
  assert.deepEqual(pagesToShow({ pages: 8 }, { pages: 7 }, 7), [1, 8]);
});

const gateReport = (over = {}) => ({
  verdict: "FAIL",
  contract: true,
  counts: { gating: 3, regression: 2, "pin-c": 1, pinA: 4, pinB: 5, pinC: 1, headGating: 1 },
  items: [
    { key: "wpt|t/a.html", class: "regression", gating: true },
    { key: "wpt|t/b.html", class: "regression", gating: true },
    { key: "pin|wpt|t/c.html", class: "pin-c", gating: true },
    { key: "wpt|t/d.html", class: "improvement", gating: false },
  ],
  pin: {
    counts: { a: 4, b: 5, c: 1 },
    items: [
      { key: "wpt|t/c.html", class: "pin-regression", pinClass: "c" },
      { key: "wpt|t/e.html", class: "accepted", pinClass: "a" },
    ],
  },
  head: { verdict: "FAIL", items: [{ key: "wpt|t/a.html", gating: true }] },
  docAggregate: { condition2: "PASS", condition3: "PASS" },
  ...over,
});

test("gate conditions: a count key the gate omits (zero) reads as 0, never undefined", () => {
  const g = synthetic(gateReport()).gate;
  assert.equal(g.counts.contractPages, 0);
  assert.equal(g.counts.contractPagesFailing, 0);
  assert.equal(g.counts.docRegressions, 0);
  const losses = renderBlocks(synthetic(gateReport()), "vitepress").losses;
  assert.doesNotMatch(losses, /undefined|NaN/);
});

test("gate conditions: met/not met per condition, with the ids that hold it open", () => {
  const [c1, c2, c3, c4] = gateConditions(gateReport());
  assert.equal(c1.met, false);
  assert.deepEqual(c1.items, ["wpt|t/c.html"]);
  assert.equal(c2.met, true);
  assert.equal(c3.met, true);
  assert.equal(c4.met, false);
  assert.deepEqual(c4.items, ["wpt|t/a.html", "wpt|t/b.html"]);
  assert.equal(c4.head.verdict, "FAIL");
  const losses = renderBlocks(synthetic(gateReport()), "vitepress").losses;
  assert.match(losses, /\(1\) [^\n]*\*\*NOT met\*\*[^\n]*`t\/c\.html`/);
  assert.match(losses, /\(3\) [^\n]*\*\*met\*\*/);
  assert.match(
    losses,
    /\(4\) [^\n]*2 regressions[^\n]*`t\/a\.html`, `t\/b\.html`[^\n]*Head view: FAIL/,
  );
  const clean = gateConditions(
    gateReport({
      counts: { gating: 0 },
      items: [],
      pin: { counts: { c: 0 }, items: [] },
      head: { verdict: "PASS", items: [] },
    }),
  );
  assert.ok(clean.every((c) => c.met));
});

test("a PASS gate still lists what each condition lets through", () => {
  const report = gateReport({
    verdict: "PASS",
    counts: { gating: 0, pinA: 1, pinB: 1, pinC: 0, flaggedPassLost: 3 },
    items: [{ key: "wpt|t/d.html", class: "improvement", gating: false }],
    pin: {
      counts: { a: 1, b: 1, c: 0, declared: 1 },
      items: [
        { key: "wpt|t/e.html", class: "accepted", pinClass: "a" },
        { key: "wpt|t/f.html", class: "debt", pinClass: "b", after: "fail", rawOutcome: "fail" },
        {
          key: "wpt|t/i.html",
          class: "debt",
          pinClass: "b",
          after: "pass",
          rawOutcome: "fail",
          detail:
            "DEBT-x (class b): pass -> pass[ink-displaced-vs-chrome] (clean pass became suspect)",
        },
        { key: "wpt|t/g.html", class: "declared", pinClass: "declared" },
      ],
    },
    head: {
      verdict: "PASS",
      items: [
        { key: "wpt|t/f.html", class: "debt", gating: false },
        { key: "wpt|t/h.html", class: "accepted", gating: false },
      ],
    },
  });
  const [c1, , , c4] = gateConditions(report);
  assert.equal(c1.met, true);
  assert.deepEqual(c1.classA, ["wpt|t/e.html"]);
  assert.deepEqual(c1.classB, ["wpt|t/f.html", "wpt|t/i.html"]);
  assert.deepEqual(c1.classBOutcomes["wpt|t/i.html"], {
    after: "pass",
    rawOutcome: "fail",
    flag: "ink-displaced-vs-chrome",
  });
  assert.equal(c1.classBOutcomes["wpt|t/f.html"].flag, null);
  assert.deepEqual(c1.declared, ["wpt|t/g.html"]);
  assert.equal(c4.met, true);
  assert.deepEqual(c4.head.debt, ["wpt|t/f.html"]);
  const mf = synthetic(report);
  assert.equal(mf.status, "PASS");
  const losses = renderBlocks(mf, "vitepress").losses;
  assert.match(losses, /verdict PASS/);
  assert.match(
    losses,
    /\(1\) [^\n]*\*\*met\*\*[^\n]*not matched on the branch: 3 WPT tests[^\n]*Class a[^\n]*`t\/e\.html`[^\n]*Class b[^\n]*fail on the branch: `t\/f\.html`[^\n]*pass on the branch with a suspect-pass flag[^\n]*`t\/i\.html` \(flag `ink-displaced-vs-chrome`; raw Blitz: fail\)/,
  );
  // A class-b pass must never be described as a failure.
  assert.doesNotMatch(losses, /fail on the branch: [^\n.]*`t\/i\.html`/);
  assert.match(losses, /\(1\) [^\n]*1 test that failed before is now rejected/);
  assert.match(
    losses,
    /\(4\) [^\n]*Head view: PASS; 1 test carried in the debt ledger \(`t\/f\.html`\)/,
  );
  assert.match(losses, /3 suspect passes/);
  assert.doesNotMatch(losses, /undefined|NaN/);
});

const passWithDebt = () =>
  gateReport({
    verdict: "PASS",
    counts: { gating: 0, pinA: 1, pinB: 2, pinC: 0 },
    items: [],
    pin: {
      counts: { a: 1, b: 2, c: 0 },
      items: [
        { key: "wpt|t/e.html", class: "accepted", pinClass: "a" },
        { key: "wpt|t/f.html", class: "debt", pinClass: "b", after: "fail", rawOutcome: "fail" },
        {
          key: "wpt|t/i.html",
          class: "debt",
          pinClass: "b",
          after: "pass",
          rawOutcome: "fail",
          detail: "DEBT-x (class b): pass -> pass[ink-displaced-vs-chrome]",
        },
      ],
    },
    head: { verdict: "PASS", items: [] },
  });

test("--release is refused unless the gate verdict is PASS, and needs a plain semver", () => {
  assert.throws(() => synthetic(null, { release: "0.3.0" }), /refused[^\n]*missing/);
  for (const verdict of ["FAIL", "REFUSED"])
    assert.throws(
      () => synthetic({ verdict, counts: {} }, { release: "0.3.0" }),
      new RegExp(`refused[^\\n]*${verdict}, not PASS`),
    );
  for (const bad of ["v0.3.0", "0.3", "latest", ""])
    assert.throws(() => synthetic(passWithDebt(), { release: bad }), /semver/);
  assert.doesNotThrow(() => synthetic(passWithDebt(), { release: "0.3.0-beta.1" }));
});

test("the CLI refuses --release without a PASS gate before reading any input", () => {
  const cli = join(REPO, "fidelity/report/build-site-evidence.mjs");
  const r = spawnSync(
    process.execPath,
    [cli, "--compare", "/nonexistent/compare", "--run", "/nonexistent/run", "--release", "0.3.0"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--release 0\.3\.0 refused/);
});

test("released evidence names the version everywhere and drops every unreleased claim", () => {
  const unreleased = synthetic(passWithDebt());
  assert.equal(unreleased.released, false);
  const mf = synthetic(passWithDebt(), { release: "0.3.0" });
  assert.equal(mf.status, "PASS");
  assert.equal(mf.released, true);
  assert.deepEqual(mf.release, { version: "0.3.0" });
  assert.equal(mf.after.label, "vellora 0.3.0");
  assert.equal(mf.wpt.after.label, "vellora 0.3.0");
  assert.equal(mf.before.label, "vellora 0.2.0 (published)");
  // The numbers do not depend on the release flag.
  assert.deepEqual(mf.fixtures, unreleased.fixtures);
  assert.deepEqual(mf.headline, unreleased.headline);
  assert.deepEqual(mf.gate, unreleased.gate);
  assert.deepEqual(mf.wpt.after.totals, unreleased.wpt.after.totals);
  assert.equal(
    statusStamp(mf),
    "Released in vellora 0.3.0 · strict merge gate PASS · indicative local macOS measurement (reference: Chrome for Testing 1 on macOS)",
  );
  const unreleasedClaims =
    /unreleased|not merged|not released|released yet|vX\.Y\.Z|placeholder|released package is|on the branch|on this branch|\/ branch \//i;
  for (const flavor of ["github", "vitepress"]) {
    const blocks = renderBlocks(mf, flavor);
    for (const [name, text] of Object.entries(blocks))
      assert.doesNotMatch(text, unreleasedClaims, `${flavor} block ${name}`);
    assert.match(blocks.status, /Released in vellora 0\.3\.0/);
    assert.match(blocks.status, /Before is vellora@0\.2\.0, the previous release/);
    assert.match(blocks.status, /verdict PASS/);
    assert.match(blocks.table, /Pages: 0\.2\.0 \/ 0\.3\.0 \/ Chrome/);
    assert.match(
      blocks.losses,
      /not matched in 0\.3\.0[^\n]*fail in 0\.3\.0: `t\/f\.html`[^\n]*pass in 0\.3\.0 with a suspect-pass flag/,
    );
  }
  assert.match(renderBlocks(mf, "vitepress").status, /^::: tip Released in vellora 0\.3\.0\n/);
  for (const [name, svg] of Object.entries(renderCharts(mf))) {
    assert.match(svg, /Released in vellora 0\.3\.0 · strict merge gate PASS/, name);
    assert.doesNotMatch(svg, /unreleased|Not merged/i, name);
  }
  assert.match(renderCharts(mf)["wpt-pass-rate.svg"], /vellora 0\.3\.0 · Blitz/);
});

test("the paint block shows before → after against Chrome and marks an over-count", () => {
  const fx = (dash, ul, canvas = [], flags = []) => ({
    pages: 1,
    chromePages: 1,
    dashSegments: dash,
    underlines: ul,
    canvasMismatchPages: canvas,
    flags,
  });
  const zero = { chrome: 0, vellora: 0 };
  const probe = (map) => ({
    command: "node fidelity/oracles/paint-probe.mjs --run R",
    tool: "pymupdf 1",
    method: { facts: "paint.py" },
    fixtures: Object.fromEntries(FIXTURES.map((f) => [f.id, map[f.id] ?? fx(zero, zero)])),
  });
  const after = probe({
    danfe: fx({ chrome: 10, vellora: 12 }, zero),
    receipt: fx(zero, { chrome: 2, vellora: 2 }),
  });
  const before = probe({
    danfe: fx({ chrome: 10, vellora: 0 }, zero, [], ["dashes-missing"]),
    receipt: fx(zero, { chrome: 2, vellora: 0 }, [1], ["canvas", "underlines-missing"]),
  });
  assert.equal(paintSection(after, before).reportOnly, true);
  const block = renderBlocks(
    synthetic(null, { paint: after, paintBefore: before }),
    "vitepress",
  ).paint;
  assert.match(block, /`danfe`\) \| 0 \/ 10 → 12 \/ 10 \(2 more than Chrome\)/);
  assert.match(block, /`receipt`\) [^\n]*0 \/ 2 → 2 \/ 2 [^\n]*pages 1 → none/);
  assert.match(block, /The other 7 fixtures/);
  assert.match(block, /Report-only/);
  // Before and after must be probed against the same Chrome PDFs.
  const other = probe({ danfe: fx({ chrome: 11, vellora: 0 }, zero) });
  assert.throws(() => paintSection(after, other), /different Chrome PDFs/);
});

test("the committed manifest's gate and paint numbers are the committed snapshots'", () => {
  const gz = readFileSync(
    join(REPO, "fidelity/gate/snapshots/2026-10-28/c07/gate-report-c07-tip-contract.json.gz"),
  );
  const g = JSON.parse(gunzipSync(gz).toString("utf8"));
  assert.equal(manifest.gate.verdict, g.verdict);
  for (const k of ["gating", "pinA", "pinB", "pinC", "regression", "headGating"])
    assert.equal(manifest.gate.counts[k], g.counts[k] ?? 0, k);
  assert.deepEqual(manifest.gate.conditions, gateConditions(g));
  const paint = json("fidelity/gate/snapshots/2026-10-28/c07/paint-probe-c07-tip.json");
  const before = json("fidelity/gate/snapshots/2026-10-28/c07-docs/paint-probe-pin-v0.2.0.json");
  assert.deepEqual(manifest.paint, paintSection(paint, before));
});
