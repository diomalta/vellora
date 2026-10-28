// The report-only paint probe (lib/paint-probe.mjs + py/paint.py): the page comparison on
// synthetic facts (no venv needed) and, when fidelity/.venv exists, paint.py on PDFs built here
// with PyMuPDF that hold exactly one of each measured paint (and the regressed forms).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { canvasMatches, comparePaint, paintFacts } from "../lib/paint-probe.mjs";
import { venvPython } from "../lib/paths.mjs";

const page = (over = {}) => ({
  page: 1,
  width: 595,
  height: 842,
  canvas: null,
  dashSegments: 0,
  dashLengthPt: 0,
  underlines: 0,
  underlineLengthPt: 0,
  ...over,
});
const doc = (...pages) => ({ tool: "pymupdf", version: "test", pages });
const grey = { color: "#f2f4f6", coverage: 0.845 };

test("identical paint: no flags, no canvas mismatch", () => {
  const p = page({ canvas: grey, dashSegments: 136, underlines: 5 });
  const m = comparePaint(doc(p, p), doc(p, p));
  assert.deepEqual(m.flags, []);
  assert.deepEqual(m.canvasMismatchPages, []);
  assert.deepEqual(m.dashSegments, { chrome: 272, vellora: 272 });
});

test("the three c03 paint differences each raise their flag", () => {
  // postmark at c03: page 2 canvas missing, dashed coupon box solid, link underlines missing.
  const chrome = doc(
    page({ canvas: grey, dashSegments: 136, underlines: 2 }),
    page({ canvas: grey, underlines: 3 }),
  );
  const vellora = doc(page({ canvas: grey }), page());
  const m = comparePaint(chrome, vellora);
  assert.deepEqual(m.canvasMismatchPages, [2]);
  assert.deepEqual(m.flags, ["canvas", "dashes-missing", "underlines-missing"]);
});

test("extra paint and a page only one side has are reported too", () => {
  const m = comparePaint(
    doc(page()),
    doc(page({ dashSegments: 4, underlines: 1 }), page({ canvas: grey })),
  );
  assert.deepEqual(m.flags, ["canvas", "dashes-extra", "underlines-extra"]);
  assert.deepEqual(m.canvasMismatchPages, [2]);
  assert.equal(m.pages, 2);
  assert.equal(m.chromePages, 1);
});

test("canvas colours match within 2/255 per channel and 2% coverage", () => {
  assert.ok(canvasMatches(grey, { color: "#f1f4f7", coverage: 0.84 }));
  assert.ok(!canvasMatches(grey, { color: "#eef4f6", coverage: 0.845 }));
  assert.ok(!canvasMatches(grey, { color: "#f2f4f6", coverage: 0.8 }));
  assert.ok(!canvasMatches(grey, null));
  assert.ok(canvasMatches(null, null));
});

// A4 page: one page-area rect, a 1 px dashed line as 20 dashes (0.75 x 2.25 pt), the same line
// solid, and a text span with an underline 0.75 pt under its baseline plus a table rule under
// it that runs past the text.
const BUILD_PDF = `
import sys, pymupdf
doc = pymupdf.open()
p = doc.new_page(width=595.28, height=841.89)
p.draw_rect(pymupdf.Rect(28.5, 28.5, 567, 813.75), color=None, fill=(0.95, 0.96, 0.965))
for i in range(20):
    x = 50 + i * 3.75
    p.draw_rect(pymupdf.Rect(x, 100, x + 2.25, 100.75), color=None, fill=(0, 0, 0))
p.draw_rect(pymupdf.Rect(50, 120, 200, 120.75), color=None, fill=(0, 0, 0))
p.insert_text((50, 200), "underlined", fontsize=12)
w = pymupdf.get_text_length("underlined", fontsize=12)
p.draw_rect(pymupdf.Rect(50, 200.75, 50 + w, 201.5), color=None, fill=(0, 0, 0.93))
p.insert_text((50, 260), "cell", fontsize=12)
p.draw_rect(pymupdf.Rect(40, 261, 400, 261.75), color=None, fill=(0.5, 0.5, 0.5))
doc.save(sys.argv[1])
`;

test("paint.py measures the canvas, dash segments and underlines of a built PDF", (t) => {
  const python = venvPython();
  if (!python) return t.skip("fidelity/.venv missing");
  const dir = mkdtempSync(join(tmpdir(), "paint-probe-"));
  try {
    const pdf = join(dir, "built.pdf");
    execFileSync(python, ["-I", "-c", BUILD_PDF, pdf]);
    const facts = paintFacts(pdf, python);
    assert.equal(facts.pages.length, 1);
    const p = facts.pages[0];
    assert.equal(p.canvas.color, "#f2f5f6");
    assert.ok(p.canvas.coverage > 0.84 && p.canvas.coverage < 0.85, `${p.canvas.coverage}`);
    assert.equal(p.dashSegments, 20, "20 dashes; the solid line is not one");
    assert.equal(p.underlines, 1, "the underline, not the rule that runs past the cell text");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
