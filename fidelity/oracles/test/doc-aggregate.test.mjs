// The document-level aggregate oracle (lib/doc-aggregate.mjs): pure matcher + metrics on
// synthetic words.py payloads (no venv needed), and the committed pin reference's shape.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DOC_AGGREGATE_SCHEMA,
  METHOD,
  MM_PER_PT,
  aggregateDocument,
  documentWords,
  geometrySha256,
  quantile,
} from "../lib/doc-aggregate.mjs";

const H = 841.92;
const page = (n, words) => ({ page: n, width: 595.28, height: H, words });
const w = (text, x, baseline) => ({ text, x, baseline, x1: x + 10, size: 10, font: "F" });
/** 10 distinct words on one page, 20 pt apart. */
const doc = (shiftPt = 0, edit = (ws) => ws) => ({
  tool: "pymupdf",
  version: "test",
  pages: [
    page(1, edit(Array.from({ length: 10 }, (_, i) => w(`w${i}`, 50 + shiftPt, 100 + 20 * i)))),
  ],
});

test("identical documents: distance 0, everything within 1 mm, nothing missing", () => {
  const m = aggregateDocument(doc(), doc());
  assert.equal(m.medianMm, 0);
  assert.equal(m.p90Mm, 0);
  assert.equal(m.within1mmPct, 100);
  assert.equal(m.missingWords, 0);
  assert.equal(m.extraWords, 0);
  assert.equal(m.pageDelta, 0);
});

test("a uniform 2 mm shift reads as median = p90 = 2 mm and 0% within 1 mm", () => {
  const m = aggregateDocument(doc(), doc(2 / MM_PER_PT));
  assert.equal(m.medianMm, 2);
  assert.equal(m.p90Mm, 2);
  assert.equal(m.within1mmPct, 0);
});

test("one word moved 5 mm lowers the within-1-mm share by exactly one word", () => {
  const moved = doc(0, (ws) =>
    ws.map((x, i) => (i === 3 ? { ...x, baseline: x.baseline + 5 / MM_PER_PT } : x)),
  );
  const m = aggregateDocument(doc(), moved);
  assert.equal(m.within1mmPct, 90);
  assert.equal(m.medianMm, 0);
  assert.equal(m.p90Mm, 0);
});

test("a missing word counts against the share, not in the quantiles; an extra word is listed", () => {
  const fewer = doc(0, (ws) => ws.slice(1));
  const m = aggregateDocument(doc(), fewer);
  assert.equal(m.missingWords, 1);
  assert.equal(m.within1mmPct, 90);
  assert.equal(m.medianMm, 0);
  const more = doc(0, (ws) => [...ws, w("extra", 10, 10)]);
  assert.equal(aggregateDocument(doc(), more).extraWords, 1);
});

test("a word on the next page is a page height away (document coordinates)", () => {
  const chrome = doc();
  const subject = {
    ...doc(0, (ws) => ws.slice(0, 9)),
  };
  subject.pages = [...subject.pages, page(2, [w("w9", 50, 280)])];
  const m = aggregateDocument(chrome, subject);
  assert.equal(m.pages, 2);
  assert.equal(m.pageDelta, 1);
  assert.equal(m.samePagePct, 90);
  // w9: Chrome at y 280 on page 1, subject at y 280 on page 2 -> one page height.
  assert.equal(m.p90Mm, 0);
  assert.equal(m.within1mmPct, 90);
});

test("repeated text pairs k-th to k-th in reading order, whatever the extraction order", () => {
  // Chrome: "R$" at y 100 and y 200; subject extracted as y 300 then y 105. Reading order sorts
  // the subject to (105, 300), so the pairs are 100->105 (5 pt) and 200->300 (100 pt).
  const c = { pages: [page(1, [w("R$", 50, 100), w("R$", 50, 200)])] };
  const s = { pages: [page(1, [w("R$", 50, 300), w("R$", 50, 105)])] };
  const m = aggregateDocument(c, s);
  assert.equal(m.p90Mm, Math.round(100 * MM_PER_PT * 100) / 100);
  assert.equal(m.medianMm, Math.round(5 * MM_PER_PT * 100) / 100);
});

test("text keys fold ligatures and NFC, so producers' encodings compare", () => {
  const c = { pages: [page(1, [w("ﬁnal", 50, 100), w("ação", 50, 120)])] };
  const s = { pages: [page(1, [w("final", 50, 100), w("ação", 50, 120)])] };
  assert.equal(aggregateDocument(c, s).missingWords, 0);
  assert.deepEqual(
    documentWords(s).map((x) => x.key),
    ["final", "ação"],
  );
});

test("quantile is nearest rank; geometry sha ignores order of extraction, not anchors", () => {
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2);
  assert.equal(quantile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9), 9);
  assert.equal(quantile([], 0.5), null);
  const a = doc();
  const reversed = { pages: [{ ...a.pages[0], words: [...a.pages[0].words].reverse() }] };
  assert.equal(geometrySha256(a), geometrySha256(reversed));
  assert.notEqual(geometrySha256(a), geometrySha256(doc(0.1)));
});

test("the committed pin reference: published engine, same method, every fixture hashed, portable", () => {
  const file = join(
    resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."),
    "baselines",
    "pin",
    "doc-aggregate.json",
  );
  const text = readFileSync(file, "utf8");
  const pin = JSON.parse(text);
  assert.equal(pin.schema, `${DOC_AGGREGATE_SCHEMA}/pin`);
  assert.deepEqual(pin.method, METHOD);
  assert.match(pin.engine.commit, /^[0-9a-f]{40}$/);
  assert.ok(Object.keys(pin.fixtures).length >= 9);
  for (const [id, f] of Object.entries(pin.fixtures)) {
    for (const k of [
      "nativeHtmlSha256",
      "chromeGeometrySha256",
      "subjectPdfSha256",
      "subjectGeometrySha256",
    ]) {
      assert.match(f.inputs[k], /^[0-9a-f]{64}$/, `${id} ${k}`);
    }
    assert.equal(pin.renders[id].pdfSha256, f.inputs.subjectPdfSha256, id);
    assert.equal(pin.renders[id].renderedTwiceIdentical, true, id);
  }
  assert.ok(pin.noise?.max, "the pin records its run-to-run noise");
  assert.doesNotMatch(text, /\/Users\/|\/home\//, "no personal absolute paths");
});
