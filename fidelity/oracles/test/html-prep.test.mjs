import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  BUNDLED_FONT_DIR,
  FONT_ALIASES,
  inlineLocalImageSources,
  referenceEngineHtml,
} from "../lib/html-prep.mjs";
import { REPO_ROOT } from "../lib/paths.mjs";

test("the shared FONT_ALIASES is a superset of benchmarks/visual-fidelity.mjs (read as text)", () => {
  // Read, never import: importing that module runs its harness and rmSync()s its output dir.
  // The fidelity table (fidelity/lib/chrome-reference.mjs) may add families a fixture uses
  // (Helvetica, Nunito Sans, Tahoma), but every benchmark family must reach the SAME file here.
  const source = readFileSync(join(REPO_ROOT, "benchmarks", "visual-fidelity.mjs"), "utf8");
  const start = source.indexOf("const FONT_ALIASES");
  const block = source.slice(start, source.indexOf("];", start) + 2);
  assert.ok(block.length > 20, "FONT_ALIASES block not found in benchmarks/visual-fidelity.mjs");
  for (const entry of block.split(/\},\s*\{/)) {
    const quoted = [...entry.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const files = quoted.filter((q) => q.endsWith(".ttf"));
    const families = quoted.filter((q) => !q.endsWith(".ttf"));
    assert.equal(files.length, 2, `benchmark alias without regular+bold: ${entry}`);
    for (const family of families) {
      const ours = FONT_ALIASES.find((a) => a.families.includes(family));
      assert.ok(ours, `benchmark family "${family}" missing from the shared table`);
      assert.deepEqual([ours.regular, ours.bold], files, `"${family}" maps to other files`);
    }
  }
  assert.ok(
    FONT_ALIASES[0].families.includes("Helvetica"),
    "Helvetica must reach Liberation Sans (oss-postmark-receipt parity, 2026-10-21)",
  );
  for (const alias of FONT_ALIASES) {
    assert.ok(existsSync(join(BUNDLED_FONT_DIR, alias.regular)));
    assert.ok(existsSync(join(BUNDLED_FONT_DIR, alias.bold)));
  }
});

test("local images are inlined; remote and data URLs are left alone", () => {
  const html =
    '<img src="./assets/logo.png"><img src="https://example.invalid/a.png"><img src="data:image/png;base64,AA==">';
  const out = inlineLocalImageSources(html, join(REPO_ROOT, "fixtures", "invoice"));
  assert.match(out, /^<img src="data:image\/png;base64,[A-Za-z0-9+/=]{40,}">/);
  assert.match(out, /src="https:\/\/example\.invalid\/a\.png"/);
  assert.match(out, /src="data:image\/png;base64,AA=="/);
});

test("reference HTML gets the bundled @font-face block and a <base>, subject HTML untouched", () => {
  const templated = "<html><head><title>x</title></head><body>x</body></html>";
  const out = referenceEngineHtml(templated, { baseDir: "/tmp/fixture" });
  assert.match(out, /<base href="file:\/\/\/tmp\/fixture\/">/);
  assert.match(out, /font-family: "Vellora Sans"; src: url\(data:font\/ttf;base64,/);
  assert.equal(referenceEngineHtml(templated, { injectFonts: false }), templated);
});
