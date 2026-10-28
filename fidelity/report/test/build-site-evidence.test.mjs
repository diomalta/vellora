// Site evidence (fidelity/report): status stamping, the manifest's link to the committed oracle
// outputs, chart accessibility, image hygiene, and that every generated docs block is in sync
// with the committed manifest (no hand-typed numbers can drift).
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { pagesToShow } from "../build-site-evidence.mjs";
import {
  DOC_FILES,
  FIXTURES,
  applyBlocks,
  buildManifest,
  checkDocs,
  crossCheck,
  evidenceStatus,
  renderCharts,
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

function synthetic(gate) {
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
      },
      wpt: { velloraCommit: "c".repeat(40), totals: { reftests: 10, pass: 5, passRate: 50 } },
    },
    wptBefore: { velloraCommit: "d".repeat(40), totals: { reftests: 10, pass: 3, passRate: 30 } },
    gate,
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
  const after = json("fidelity/gate/snapshots/2026-10-27/c02/doc-aggregate-c02-tip.json");
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

test("the committed manifest is DRAFT while the committed contract gate report is not PASS", () => {
  assert.equal(manifest.gate.verdict, "FAIL");
  assert.equal(manifest.status, "DRAFT");
  assert.equal(manifest.released, false);
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
