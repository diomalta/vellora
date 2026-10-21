// text-probe.mjs helpers: the Chrome-side input rewrite, collapsed-whitespace handling, visual
// lines and the per-run x comparison, each shown to catch a planted defect (a dropped space, a
// shifted run). Plus the committed 2026-10-21 evidence (Chrome 155.0.8059.85, macOS, INDICATIVE).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { chromeHtmlFor, collapse, renderedChar, runXDeltas, visualLines } from "../text-probe.mjs";

const here = dirname(fileURLToPath(import.meta.url));

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

test("2026-10-21 evidence: Chrome renders every probe space; the reader's padded-root shift", () => {
  const before = JSON.parse(
    readFileSync(
      join(here, "..", "snapshots", "2026-10-21", "text-probe", "text-probe.before-fix.json"),
      "utf8",
    ),
  );
  const byId = Object.fromEntries(before.probes.map((p) => [p.id, p]));
  for (const p of before.probes) {
    assert.equal(p.agreement.lines_equal, true, p.id);
    assert.equal(p.agreement.pdftotext_equal, true, p.id);
  }
  const mixed = byId["mixed-weight"];
  assert.deepEqual(
    mixed.chrome.lines.map((l) => l.text),
    ["Acme Widgets Comércio LTDA — CNPJ 12.345.678/0001-90"],
  );
  assert.equal(mixed.agreement.run_x[1].chrome_x, 187.703);
  // After the read_text_runs fix (run_padding_right_px): every run of every probe is within
  // 0.05 px of Chrome's x and right edge.
  const after = JSON.parse(
    readFileSync(
      join(here, "..", "snapshots", "2026-10-21", "text-probe", "text-probe.json"),
      "utf8",
    ),
  );
  for (const p of after.probes) {
    assert.equal(p.agreement.lines_equal, true, p.id);
    assert.equal(p.agreement.runs_located_in_chrome, p.agreement.runs, p.id);
    assert.ok(p.agreement.max_abs_dx <= 0.05, `${p.id} dx ${p.agreement.max_abs_dx}`);
    assert.ok(p.agreement.max_abs_dright <= 0.05, `${p.id} dright ${p.agreement.max_abs_dright}`);
  }
  // Before the fix: a run after text styled by the padded inline root itself is
  // shifted by the root's padding-right (td 4 px; block 10 px on a right-aligned line).
  const bad = byId.whitespace.agreement.run_x.filter((r) => Math.abs(r.dx) > 0.5);
  assert.deepEqual(
    bad.map((r) => [r.text, r.dx]),
    [
      ["Beta", 3.994],
      ["Total ", -3.99],
      ["Total ", -9.99],
    ],
  );
});
