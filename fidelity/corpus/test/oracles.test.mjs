// Regression tests for the corpus oracles, on synthetic inputs whose ground truth is exact (no
// renderer involved). Each test pins a defect class an independent validator injected and the
// previous oracle missed (fidelity/corpus/README.md "Oracle regressions"):
//   i05  deleting the boleto "Ficha de Compensação" via label re-anchored to another line
//   i07  a DANFE block title below 5 pt passed because only one sample title was measured
//   i10b one grossly misaligned money token was dropped by gap clustering
//   cut  a text row was taken for the dashed cut line (found while fixing the above)
// The Python oracles run in fidelity/.venv; without it these tests are reported as skipped.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { itfElements } from "../lib/itf.mjs";
import { textMatches } from "../lib/required-text.mjs";
import {
  corpusDir,
  helveticaWidthMm,
  pythonMissing,
  runPy,
  runPyInline,
  syntheticPdf,
  tmp,
  writeFile,
  writeJson,
} from "./helpers.mjs";

const manifest = JSON.parse(readFileSync(join(corpusDir, "corpus.json"), "utf8"));
const fixture = (id) => manifest.fixtures.find((f) => f.id === id);

function fontCheck(dir, items, rules, html) {
  const pdf = writeFile(dir, "t.pdf", syntheticPdf(items));
  const args = ["--pdf", pdf, "--rules", writeJson(dir, "rules.json", rules)];
  if (html) {
    args.push("--html", writeFile(dir, "t.html", html));
  }
  return runPy("font_sizes.py", args);
}

test("i05: a required string must occur `count` times, so one deleted copy fails", () => {
  const fx = { requiredText: [{ text: "Ficha de Compensação", count: 2 }, "Recibo do Pagador"] };
  const both =
    "Recibo do Pagador ... Ficha de Compensação\nAutenticação Mecânica - Ficha de Compensação";
  assert.deepEqual(
    textMatches(fx, {}, both).map((r) => r.ok),
    [true, true],
  );
  const viaDeleted = "Recibo do Pagador ... Autenticação Mecânica - Ficha de Compensação";
  const [ficha] = textMatches(fx, {}, viaDeleted);
  assert.equal(ficha.ok, false, "substring of the autenticação line must not satisfy count 2");
  assert.equal(ficha.occurrences, 1);
});

test("i05: the boleto manifest pins the via label as a whole line below the measured symbol", () => {
  const b = fixture("boleto-febraban");
  const t3 = b.fontRules.rules.find((r) => r.id === "BOL-T3");
  assert.equal(t3.regionFrom, "belowBarcode");
  assert.equal(t3.whole_line, true);
  const req = b.requiredText.find((r) => (r.text ?? r) === "Ficha de Compensação");
  assert.equal(req.count, 2);
});

test("i05: font anchors never re-anchor to a longer line or an ambiguous match", (t) => {
  const skip = pythonMissing();
  if (skip) {
    t.skip(skip);
    return;
  }
  const dir = tmp("anchor");
  const autent = {
    text: "Autenticação Mecânica - Ficha de Compensação",
    xMm: 150,
    topMm: 230,
    size: 6,
  };
  const via = { text: "Ficha de Compensação", xMm: 10, topMm: 270, size: 6 };
  const region = { x_min_mm: 7, x_max_mm: 113, top_min_mm: 268, top_max_mm: 278 };
  const rule = { id: "T3", text: "Ficha de Compensação", whole_line: true, region, max_pt: 8.24 };
  const ok = fontCheck(dir, [autent, via], { page: 1, rules: [rule] }).rules[0];
  assert.equal(ok.ok, true);
  assert.equal(ok.occurrences, 1);
  assert.deepEqual(ok.sizes_pt, [6]);
  // Via label deleted: neither the region nor the whole-line rule lets the autenticação line stand in.
  const gone = fontCheck(dir, [autent], { page: 1, rules: [rule] }).rules[0];
  assert.equal(gone.found, false);
  assert.equal(gone.ok, false);
  const lineOnly = { id: "T3-no-region", text: rule.text, whole_line: true, max_pt: 8.24 };
  assert.equal(fontCheck(dir, [autent], { page: 1, rules: [lineOnly] }).rules[0].found, false);
  // Unqualified rule with the default count 1: two occurrences are ambiguous, not "the first".
  const plain = { id: "P", text: "Ficha de Compensação" };
  const amb = fontCheck(dir, [autent, via], { page: 1, rules: [plain] }).rules[0];
  assert.equal(amb.occurrences, 2);
  assert.equal(amb.ok, false);
  // judge "last": both copies counted, only the lower one judged.
  const last = { id: "L", text: "104-0", count: 2, judge: "last", min_pt: 20.6 };
  const items = [
    { text: "104-0", xMm: 30, topMm: 20, size: 12 },
    { text: "104-0", xMm: 30, topMm: 200, size: 20.6 },
  ];
  const r = fontCheck(dir, items, { page: 1, rules: [last] }).rules[0];
  assert.equal(r.ok, true);
  assert.equal(r.boxes.length, 2);
  assert.deepEqual(r.sizes_pt, [20.6]);
});

test("i07: every glyph of a data-moc category is judged, plus a page floor and coverage", (t) => {
  const skip = pythonMissing();
  if (skip) {
    t.skip(skip);
    return;
  }
  const dir = tmp("moc");
  const html = `<html><head><title>DANFE ignored</title></head><body>
    <div data-moc="3.7.1">Destinatário/Remetente</div>
    <div data-moc="3.7.1">Cálculo do imposto</div>
    <div data-moc="3.7.6">SAO PAULO - SP</div>
    <span data-moc="3.7.9">SP</span>
  </body></html>`;
  const rules = {
    page: 1,
    floor_pt: 5,
    rules: [],
    categories: [
      { id: "F1", moc: "3.7.1", min_pt: 5, bold: true, caps: true },
      { id: "F6", moc: "3.7.6", min_pt: 8 },
      { id: "F9", moc: "3.7.9", min_pt: 10 },
    ],
  };
  const page = (calcPt) => [
    { text: "DESTINATÁRIO/REMETENTE", xMm: 2.5, topMm: 80, size: 6, bold: true },
    { text: "CÁLCULO DO IMPOSTO", xMm: 2.5, topMm: 120, size: calcPt, bold: true },
    { text: "SAO PAULO - SP", xMm: 2.5, topMm: 150, size: 8 },
    { text: "SP", xMm: 100, topMm: 180, size: 10 },
  ];
  const good = fontCheck(dir, page(6), rules, html);
  const cat = (out, id) => out.categories.find((c) => c.id === id);
  assert.equal(cat(good, "F1").ok, true);
  assert.equal(cat(good, "F1").segments_located, 2);
  // "SP" (10 pt) must not claim the glyphs of "SAO PAULO - SP" (8 pt): longest text first.
  assert.equal(cat(good, "F9").ok, true, JSON.stringify(cat(good, "F9")));
  assert.equal(cat(good, "F6").ok, true);
  assert.equal(good.floor.ok, true);
  assert.equal(good.coverage.ok, true);
  // The injected defect: the second (non-sample) block title at 4 pt.
  const bad = fontCheck(dir, page(4), rules, html);
  assert.equal(cat(bad, "F1").ok, false);
  assert.deepEqual(cat(bad, "F1").smallest, { pt: 4, segment: "Cálculo do imposto" });
  assert.equal(bad.floor.ok, false);
  // A tagged segment the PDF does not contain fails its category (never a silent pass) ...
  const missing = fontCheck(dir, page(6).slice(1), rules, html);
  assert.equal(cat(missing, "F1").ok, false);
  assert.deepEqual(cat(missing, "F1").missing, ["Destinatário/Remetente"]);
  // ... and a glyph no category explains fails coverage.
  const extra = fontCheck(
    dir,
    [...page(6), { text: "XYZ", xMm: 50, topMm: 250, size: 9 }],
    rules,
    html,
  );
  assert.equal(extra.coverage.ok, false);
  assert.equal(extra.coverage.unattributed, 3);
  // Non-bold glyphs in a bold category fail it.
  const regular = page(6).map((i) => (i.topMm === 80 ? { ...i, bold: false } : i));
  assert.equal(cat(fontCheck(dir, regular, rules, html), "F1").ok, false);
});

test("i10b: one grossly misaligned money token is measured, and a stray one is unassigned", (t) => {
  const skip = pythonMissing();
  if (skip) {
    t.skip(skip);
    return;
  }
  const dir = tmp("money");
  const headers = ["Débito (R$)", "Crédito (R$)", "Saldo (R$)"];
  const edges = [145.5, 169.5, 193.5];
  const size = 8.5;
  const right = (text, x1, topMm, page = 2) => ({
    text,
    xMm: x1 - helveticaWidthMm(text, size),
    topMm,
    size,
    page,
  });
  const base = [
    { text: "Débito (R$)", xMm: 128, topMm: 20, size, page: 2 },
    { text: "Crédito (R$)", xMm: 151, topMm: 20, size, page: 2 },
    { text: "Saldo (R$)", xMm: 177, topMm: 20, size, page: 2 },
    { text: "page one", xMm: 20, topMm: 20, size, page: 1 },
  ];
  const rows = (outlierShift) =>
    Array.from({ length: 10 }, (_, i) => [
      right("1.234,56", edges[0], 30 + 6 * i),
      right("87,10", edges[1], 30 + 6 * i),
      right("152.753,97", edges[2] - (i === 6 ? outlierShift : 0), 30 + 6 * i),
    ]).flat();
  const probe = (items) => {
    const pdf = writeFile(dir, "m.pdf", syntheticPdf(items));
    return runPy("pdf_probe.py", [
      "columns",
      "--pdf",
      pdf,
      "--page",
      "2",
      "--headers",
      JSON.stringify(headers),
    ]);
  };
  const aligned = probe([...base, ...rows(0)]);
  assert.equal(aligned.tokens, 30);
  assert.deepEqual(
    aligned.columns.map((c) => c.count),
    [10, 10, 10],
  );
  assert.ok(Math.max(...aligned.columns.map((c) => c.spread_mm)) < 0.01);
  assert.deepEqual(aligned.unassigned, []);
  const shifted = probe([...base, ...rows(4.5)]);
  const saldo = shifted.columns.find((c) => c.header === "Saldo (R$)");
  assert.equal(saldo.count, 10, "the outlier stays in its column");
  assert.ok(Math.abs(saldo.spread_mm - 4.5) < 0.01, JSON.stringify(saldo));
  const stray = probe([...base, ...rows(0), right("9.999,99", 60, 100)]);
  assert.deepEqual(
    stray.unassigned.map((u) => u.text),
    ["9.999,99"],
  );
});

test("cut: a text row is not a dashed cut line; a regular dashed line is (measure_bars)", (t) => {
  const skip = pythonMissing();
  if (skip) {
    t.skip(skip);
    return;
  }
  const dir = tmp("cut");
  const kinds = itfElements("10497164600001842502468131000100040004170013");
  const elements = kinds.map((k, i) => ({ w_mm: k === "n" ? 0.4 : 1.2, dark: i % 2 === 0 }));
  const expect = writeJson(dir, "expect.json", {
    elements,
    x0_mm: 10,
    y_center_mm: 96.5,
    height_mm: 13,
    cut_search_mm: [0, 90],
  });
  // Page 210 x 120 mm at 600 dpi: field-grid left border (x = 5 mm, y 20..85), an irregular
  // "text" row at y = 50 mm (>= 50 short runs over > 150 mm, irregular gaps), optionally a regular
  // dashed line (1.0 mm dash / 0.6 mm gap) at y = 15 mm, and the bars at x = 10 mm, y 90..103.
  const draw = `
import json, sys
from PIL import Image, ImageDraw
dpi, out, dashed = 600, sys.argv[1], sys.argv[2] == "1"
px = lambda mm: round(mm * dpi / 25.4)
img = Image.new("L", (px(210), px(120)), 255)
d = ImageDraw.Draw(img)
d.rectangle([px(5), px(20), px(5.2) - 1, px(85)], fill=0)
x, k, lens, gaps = px(20), 0, [4, 9, 5, 13, 6, 7], [3, 11, 5, 20, 7, 4]
while x < px(195):
    d.rectangle([x, px(50), x + lens[k % 6] - 1, px(50) + 3], fill=0)
    x += lens[k % 6] + gaps[k % 6]
    k += 1
if dashed:
    x = px(10)
    while x < px(205):
        d.rectangle([x, px(15), x + px(1.0) - 1, px(15.3)], fill=0)
        x += px(1.6)
x = 10.0
for e in json.load(open(sys.argv[3]))["elements"]:
    if e["dark"]:
        d.rectangle([px(x), px(90), px(x + e["w_mm"]) - 1, px(103) - 1], fill=0)
    x += e["w_mm"]
img.save(out)
`;
  const measure = (withDash) => {
    const png = join(dir, `p${withDash}.png`);
    runPyInline(draw, [png, withDash ? "1" : "0", expect]);
    return runPy("measure_bars.py", ["--png", png, "--dpi", "600", "--expect", expect]);
  };
  const withDash = measure(true);
  assert.equal(withDash.found, true);
  assert.ok(Math.abs(withDash.cut_line_y_mm - 15) < 0.1, String(withDash.cut_line_y_mm));
  const rel = withDash.ficha_relative_mm;
  assert.ok(Math.abs(rel.ficha_left_detected - 5) < 0.1, JSON.stringify(rel));
  assert.ok(Math.abs(rel.barcode_start_from_ficha_left - 5) < 0.1, JSON.stringify(rel));
  const noDash = measure(false);
  assert.equal(noDash.cut_line_y_mm, null, "the irregular text row must not be a cut line");
  assert.equal(noDash.ficha_relative_mm.ficha_top, null);
  assert.equal(noDash.ficha_relative_mm.barcode_centre_above_ficha_bottom, null);
  assert.ok(Math.abs(noDash.ficha_relative_mm.ficha_left_detected - 5) < 0.1);
});

test("BOL-T1..T3 thresholds in corpus.json are the values derived by font_metrics.py", (t) => {
  const skip = pythonMissing();
  if (skip) {
    t.skip(skip);
    return;
  }
  const derived = runPy("font_metrics.py", []).derived;
  const rules = Object.fromEntries(
    fixture("boleto-febraban").fontRules.rules.map((r) => [r.id, r]),
  );
  assert.equal(rules["BOL-T1"].min_pt, derived["BOL-T1"].min_pt);
  assert.equal(rules["BOL-T2"].min_pt, derived["BOL-T2"].min_pt);
  assert.equal(rules["BOL-T2"].max_pt, derived["BOL-T2"].max_pt);
  assert.equal(rules["BOL-T3"].max_pt, derived["BOL-T3"].max_pt);
  // The fixture's 6 pt via label also satisfies the stricter full-ink reading of "2 mm".
  const fullInk = derived["BOL-T3-full-ink (alternative reading, not judged)"].max_pt;
  const css = readFileSync(
    join(corpusDir, "..", "..", "fixtures", "boleto-febraban", "index.html"),
    "utf8",
  );
  const viaPt = Number(/\.via \{[^}]*font-size: ([\d.]+)pt/.exec(css)[1]);
  assert.ok(viaPt <= fullInk, `via label ${viaPt}pt > ${fullInk}pt`);
});
