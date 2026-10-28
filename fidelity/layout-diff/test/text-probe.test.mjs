// text-probe.mjs helpers: the Chrome-side input rewrite, collapsed-whitespace handling, visual
// lines and the per-run x comparison, each shown to catch a planted defect (a dropped space, a
// shifted run). The check of the committed 2026-10-21 text-probe evidence (layout-diff/snapshots/
// 2026-10-21/text-probe/) was deleted with that snapshot on 2026-10-28 (local tag
// fidelity-archive-2026-10-28, b5c9546).
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromeHtmlFor, collapse, renderedChar, runXDeltas, visualLines } from "../text-probe.mjs";

test("chromeHtmlFor rewrites only the sans-serif generic and injects the fonts into <head>", () => {
  const html =
    "<html><head><style>body { font-family: sans-serif; } pre { font-family: monospace; }</style></head><body></body></html>";
  const out = chromeHtmlFor(html, "@font-face{}");
  assert.match(out, /<head><style>@font-face\{\}<\/style>/);
  assert.match(out, /body \{ font-family: "Liberation Sans"; \}/);
  assert.match(out, /pre \{ font-family: monospace; \}/);
});

test("renderedChar: collapsed whitespace renders as one space, a no-break space stays one", () => {
  assert.equal(renderedChar("\n"), " ");
  assert.equal(renderedChar("\t"), " ");
  assert.equal(renderedChar(" "), " ");
  assert.equal(renderedChar("a"), "a");
  assert.equal(collapse("a  \n b "), "a b");
});

const glyphs = (text, x0, line, w = 5) =>
  [...text].map((ch, i) => ({ ch, text: ch, x: x0 + i * w, w, line }));

test("visualLines groups by line and orders by x; a dropped space is visible", () => {
  const chrome = [...glyphs("Beta", 30, 19), ...glyphs("Alpha ", 0, 19.5), ...glyphs("x", 0, 40)];
  assert.deepEqual(
    visualLines(chrome).map((l) => l.text),
    ["Alpha Beta", "x"],
  );
  const dropped = [...glyphs("Alpha", 0, 19), ...glyphs("Beta", 30, 19)];
  assert.notDeepEqual(
    visualLines(dropped).map((l) => l.text),
    ["Alpha Beta"],
  );
});

test("runXDeltas locates each run in Chrome's line and measures x/right; a shift is caught", () => {
  const chrome = glyphs("Alpha Beta", 8, 19);
  const runs = [
    { text: "Alpha ", x: 8, advance: 30, baseline: 19 },
    { text: "Beta", x: 38, advance: 20, baseline: 19 },
  ];
  const ok = runXDeltas(chrome, runs);
  assert.deepEqual(
    ok.map((r) => [r.text, r.dx, r.dright]),
    [
      ["Alpha ", 0, null], // trailing whitespace: right edge not comparable
      ["Beta", 0, 0],
    ],
  );
  const shifted = runXDeltas(chrome, [runs[0], { ...runs[1], x: 42 }]);
  assert.equal(shifted[1].dx, 4);
  const missing = runXDeltas(chrome, [{ text: "Gamma", x: 0, advance: 10, baseline: 19 }]);
  assert.equal(missing[0].chrome_x, null);
});
