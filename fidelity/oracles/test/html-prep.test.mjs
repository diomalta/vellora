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

test("FONT_ALIASES copy has not drifted from benchmarks/visual-fidelity.mjs (read as text)", () => {
  // Read, never import: importing that module runs its harness and rmSync()s its output dir.
  const source = readFileSync(join(REPO_ROOT, "benchmarks", "visual-fidelity.mjs"), "utf8");
  const start = source.indexOf("const FONT_ALIASES");
  const block = source.slice(start, source.indexOf("];", start) + 2);
  assert.ok(block.length > 20, "FONT_ALIASES block not found in benchmarks/visual-fidelity.mjs");
  const quoted = [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const ours = FONT_ALIASES.flatMap((alias) => [...alias.families, alias.regular, alias.bold]);
  assert.deepEqual([...ours].sort(), [...quoted].sort());
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
