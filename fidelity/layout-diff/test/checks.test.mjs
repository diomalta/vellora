// lib/checks.mjs: input parity failures must INVALIDATE attribution (the validator's viewport and
// font-injection defects showed as "enter html ... RAW BLITZ" / a silent "loaded (none)").
import assert from "node:assert/strict";
import { test } from "node:test";
import { runChecks, summarizeChecks } from "../lib/checks.mjs";
import { FONT_STYLE_MARKER, browserHtmlFor } from "../lib/fixture-html.mjs";
import { diffLayouts } from "../lib/match.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { chromeRecords, syntheticDump } from "./helpers.mjs";

const BASELINES = new Map([["Liberation Sans|400|12", { ascent: 11, descent: 3 }]]);
const GOOD_HTML = `<head><style ${FONT_STYLE_MARKER}></style></head>`;
const goodProbes = () => ({
  clientWidth: 600,
  innerWidth: 600,
  innerHeight: 800,
  fonts: ["Liberation Sans 400 normal"],
  platformFonts: {
    elements_probed: 2,
    fonts: [{ family: "Liberation Sans", custom: true, glyphs: 10, elements: 2 }],
  },
});

function checksFor({ probes = goodProbes(), browserHtml = GOOD_HTML, source = false } = {}) {
  const dump = syntheticDump();
  const sourceDump = source ? { ...syntheticDump(), html_normalize: "skipped" } : null;
  const model = velloraModel(dump, { sourceDump });
  const records = chromeRecords();
  const result = diffLayouts({ chrome: records, vellora: model, baselines: BASELINES });
  const checks = runChecks({ dump, model, probes, browserHtml, result, chromeRecords: records });
  return { checks, summary: summarizeChecks(checks), byId: new Map(checks.map((c) => [c.id, c])) };
}

test("all inputs at parity: no failure, attribution valid; N0 absent is reported not-run", () => {
  const { summary, byId } = checksFor();
  assert.deepEqual(summary.failed, []);
  assert.equal(summary.attribution_valid, true);
  assert.equal(byId.get("source_html_layer").status, "not-run");
  assert.deepEqual(summary.not_run, ["source_html_layer"]);
});

test("with N0: source keys vs Chromium and the normalize round trip are checked", () => {
  const { summary, byId } = checksFor({ source: true });
  assert.deepEqual(summary.failed, []);
  assert.equal(byId.get("source_html_layer").status, "pass");
  assert.equal(byId.get("normalize_dom_roundtrip").status, "pass");
  assert.equal(byId.get("source_dom_keys_vs_chromium").status, "pass");
});

test("a 1 px viewport mismatch fails input parity and invalidates attribution", () => {
  const probes = { ...goodProbes(), clientWidth: 599, innerWidth: 599 };
  const { summary, byId } = checksFor({ probes });
  assert.equal(byId.get("viewport_width").status, "fail");
  assert.equal(summary.attribution_valid, false);
});

test("lost @font-face injection fails even when the geometry would not show it", () => {
  const probes = {
    ...goodProbes(),
    fonts: [],
    platformFonts: {
      elements_probed: 2,
      fonts: [{ family: "Helvetica", custom: false, glyphs: 10, elements: 2 }],
    },
  };
  const { summary, byId } = checksFor({ probes, browserHtml: "<head></head>" });
  assert.equal(byId.get("font_block_injected").status, "fail");
  assert.equal(byId.get("bundled_fonts_loaded").status, "fail");
  assert.equal(byId.get("platform_fonts_custom").status, "fail");
  assert.equal(summary.attribution_valid, false);
});

test("browserHtmlFor refuses HTML without <head> instead of silently dropping the fonts", () => {
  assert.throws(() => browserHtmlFor("<body>x</body>", "/tmp"), /no <head> tag/);
  assert.ok(
    browserHtmlFor("<html><head></head><body></body></html>", "/tmp").includes(FONT_STYLE_MARKER),
  );
});
