// Suspect-pass flags (deterministic) and the cross-engine ink metric (validator finding of
// 2026-10-21: non-blank passes where test and reference lose the same content carried no flag;
// css-text tests with CJK/Thai/Ethiopic text "passed" although no supplied face has those glyphs).
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { inkDivergence, inkSignature } from "../lib/pixels.mjs";
import { cssUrlResources, prepareNode, textCodepoints } from "../lib/prepare.mjs";
import { readCoverage } from "../lib/sfnt.mjs";
import { bundledCoverage } from "../lib/vellora-render.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const fontsDir = join(repo, "crates", "vellora-core", "src", "fonts");

test("visible text codepoints: body text, entities and CSS content strings; no head/style", () => {
  const html = `<html><head><title>標題</title><style>p::before { content: "\\4E00 x" } q:after{content:'\\'b'}</style></head><body><!-- 注 --><p>A&#x0E01;&amp;&nbsp;\u200b\u00ad</p><script>var s="字"</script></body></html>`;
  const cps = textCodepoints(html, [
    { text: "p::before { content: \"\\4E00 x\" } q:after{content:'\\'b'}" },
  ]);
  const chars = cps.map((c) => String.fromCodePoint(c));
  assert.deepEqual(chars.sort(), ["&", "'", "A", "b", "x", "ก", "一"].sort());
});

test("CSS url() resources: counted outside @font-face, data: and comments excluded", () => {
  assert.deepEqual(
    cssUrlResources(
      `@font-face { font-family: X; src: url(x.ttf) } /* url(c.png) */ div { background: url("support/a.png") } li { list-style-image: url(data:image/png;base64,AA) }`,
    ),
    ["support/a.png"],
  );
});

test("sfnt cmap: the bundled faces cover Latin, Hebrew, Arabic but not CJK, Thai or Ethiopic", () => {
  const cov = bundledCoverage(fontsDir);
  assert.ok(cov, `bundled fonts expected at ${fontsDir}`);
  for (const ch of ["A", "é", "€", "א", "ب"]) assert.equal(cov.has(ch.codePointAt(0)), true, ch);
  for (const ch of ["一", "あ", "ก", "ሀ"]) assert.equal(cov.has(ch.codePointAt(0)), false, ch);
  assert.equal(bundledCoverage(join(tmpdir(), "no-such-fonts-dir")), null);
});

test("prepare: uncovered glyphs and css url() resources are flagged; covered text is not", () => {
  const root = mkdtempSync(join(tmpdir(), "wpt-flags-"));
  try {
    const baseCoverage = bundledCoverage(fontsDir);
    const url = "http://web-platform.test:8000/css/x/t.html";
    const prep = (content) =>
      prepareNode({
        wptRoot: root,
        rel: "css/x/t.html",
        url,
        content,
        mode: "screen",
        baseCoverage,
      }).info;
    const cjk = prep("<!doctype html><body><p>日本語 text</p></body>");
    assert.equal(cjk.uncoveredCodepoints, 3);
    assert.equal(cjk.uncoveredSample, "U+65E5 U+672C U+8A9E");
    const latin = prep(`<!doctype html><body><p style="background:url(bg.png)">Plain</p></body>`);
    assert.equal(latin.uncoveredCodepoints, 0);
    assert.equal(latin.cssUrlResources, 1);
    assert.equal(latin.cssUrlSample, "bg.png");
    const unchecked = prepareNode({
      wptRoot: root,
      rel: "css/x/t.html",
      url,
      content: "<p>日本</p>",
      mode: "screen",
    }).info;
    assert.equal(unchecked.glyphCoverage, "not-checked");
    assert.equal(unchecked.uncoveredCodepoints, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

const ahem = join(repo, "fidelity", ".cache", "wpt", "fonts", "Ahem.ttf");
test(
  "prepare: a supplied face's cmap counts as coverage (Ahem: ASCII + a few CJK numerals)",
  { skip: existsSync(ahem) ? false : "no WPT cache (run fetch-wpt.mjs) for Ahem" },
  () => {
    const cov = readCoverage(new Uint8Array(readFileSync(ahem)));
    assert.equal(cov.has(0x58), true);
    // CONFIRMED 2026-10-21: Ahem.ttf at the pin maps U+4E00 (一) and other CJK numerals, not 日.
    assert.equal(cov.has(0x4e00), true);
    assert.equal(cov.has(0x65e5), false);
  },
);

function image(width, height, paint) {
  const data = new Uint8Array(width * height * 3).fill(255);
  for (const [x0, y0, x1, y1, rgb] of paint) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) data.set(rgb, (y * width + x) * 3);
  }
  return { width, height, data };
}

test("ink: missing share of the oracle's significant colours and bbox shift", () => {
  const green = [0, 128, 0];
  const red = [255, 0, 0];
  const chrome = inkSignature(
    image(40, 40, [
      [0, 0, 9, 9, green],
      [20, 20, 29, 29, red],
    ]),
  );
  assert.equal(chrome.px, 200);
  assert.deepEqual(chrome.bbox, [0, 0, 29, 29]);
  const same = inkDivergence(chrome, chrome);
  assert.equal(same.missingFrac, 0);
  assert.equal(same.bboxShift, 0);
  const lostRed = inkDivergence(chrome, inkSignature(image(40, 40, [[0, 0, 9, 9, green]])));
  assert.equal(lostRed.missingFrac, 0.5);
  const blank = inkDivergence(chrome, inkSignature(image(40, 40, [])));
  assert.equal(blank.missingFrac, 1);
  assert.equal(blank.bboxShift, null);
  // Displaced content keeps its colours (missingFrac 0) but moves the bounding box.
  const moved = inkDivergence(
    chrome,
    inkSignature(
      image(40, 40, [
        [0, 10, 9, 19, green],
        [20, 30, 29, 39, red],
      ]),
    ),
  );
  assert.equal(moved.missingFrac, 0);
  assert.equal(moved.bboxShift, 10);
  // Colours below the significance threshold (anti-aliasing fringe) are not ink.
  const speck = inkSignature(image(40, 40, [[0, 0, 4, 4, green]]));
  assert.equal(inkDivergence(speck, inkSignature(image(40, 40, []))).missingFrac, 0);
});
