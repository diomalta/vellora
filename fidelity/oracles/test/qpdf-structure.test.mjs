// Regression tests for the qpdf oracle's own structure checks (validator findings, 2026-10-21):
// a missing %%EOF, a zlib-corrupt font stream, every xref offset shifted (qpdf reconstructs and
// --show-xref then reports the REPAIRED offsets), and a broken endobj must not pass.
import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateSync } from "node:zlib";
import { DAMAGE_PATTERN, checkObjects, parseOwnXref, xrefSanity } from "../lib/qpdf.mjs";

/** Build a small, valid PDF with a classic xref table and one FlateDecode stream. */
function buildPdf({ streamBytes } = {}) {
  const content = deflateSync(Buffer.from("BT /F1 12 Tf 72 720 Td (ok) Tj ET"));
  const data = streamBytes ?? content;
  const objects = [
    Buffer.from("<</Type/Catalog/Pages 2 0 R>>"),
    Buffer.from("<</Type/Pages/Kids[3 0 R]/Count 1>>"),
    Buffer.from("<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>"),
    Buffer.concat([
      Buffer.from(`<</Length ${data.length}/Filter/FlateDecode>>\nstream\n`),
      data,
      Buffer.from("\nendstream"),
    ]),
  ];
  const parts = [Buffer.from("%PDF-1.7\n")];
  const offsets = [];
  let length = parts[0].length;
  objects.forEach((body, index) => {
    offsets.push(length);
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      body,
      Buffer.from("\nendobj\n"),
    ]);
    parts.push(chunk);
    length += chunk.length;
  });
  const xrefOffset = length;
  const rows = offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n\r\n`).join("");
  parts.push(
    Buffer.from(
      `xref\n0 ${objects.length + 1}\n0000000000 65535 f\r\n${rows}trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF`,
    ),
  );
  return Buffer.concat(parts);
}

function allProblems(bytes) {
  const own = parseOwnXref(bytes);
  return [
    ...own.problems,
    ...xrefSanity(own.entries, bytes),
    ...checkObjects(bytes, own.entries, own.sectionOffset).problems,
  ];
}

test("a well-formed PDF has no structural problems", () => {
  const pdf = buildPdf();
  const own = parseOwnXref(pdf);
  assert.equal(own.kind, "table");
  assert.equal(own.entries.filter((e) => e.type === "uncompressed").length, 4);
  assert.equal(own.trailerSize, 5);
  const objects = checkObjects(pdf, own.entries, own.sectionOffset);
  assert.equal(objects.streams, 1);
  assert.equal(objects.flate, 1);
  assert.deepEqual(allProblems(pdf), []);
});

test("missing %%EOF is a problem", () => {
  const pdf = buildPdf();
  assert.match(allProblems(pdf.subarray(0, pdf.length - 5)).join("\n"), /%%EOF/);
});

test("zlib-corrupt stream data (offsets intact) is a problem", () => {
  const good = deflateSync(Buffer.from("x".repeat(400)));
  const bad = Buffer.from(good);
  for (let k = 4; k < 12; k += 1) bad[bad.length - k] ^= 0x5a; // breaks the Adler-32 trailer
  const problems = allProblems(buildPdf({ streamBytes: bad }));
  assert.match(problems.join("\n"), /obj 4: FlateDecode data does not inflate/);
});

test("every own xref offset shifted is caught from the file's own table", () => {
  const pdf = buildPdf();
  const text = pdf.toString("latin1");
  const xref = text.indexOf("\nxref\n");
  const shifted =
    text.slice(0, xref) +
    text
      .slice(xref)
      .replace(/(\d{10}) 00000 n/g, (_, o) => `${String(Number(o) + 3).padStart(10, "0")} 00000 n`);
  const problems = allProblems(Buffer.from(shifted, "latin1"));
  assert.equal(problems.filter((p) => /points at/.test(p)).length, 4, problems.join("\n"));
});

test("a broken endobj keyword is a problem", () => {
  const text = buildPdf().toString("latin1");
  const at = text.indexOf("endobj", text.indexOf("2 0 obj"));
  const broken = `${text.slice(0, at)}enXobj${text.slice(at + 6)}`;
  assert.match(allProblems(Buffer.from(broken, "latin1")).join("\n"), /obj 2: no "endobj"/);
});

test("startxref that does not point at 'xref' is a problem; xref streams are flagged", () => {
  const text = buildPdf().toString("latin1");
  const moved = text.replace(/startxref\n(\d+)/, (_, n) => `startxref\n${Number(n) + 17}`);
  assert.match(allProblems(Buffer.from(moved, "latin1")).join("\n"), /not "xref"/);
  const stream = Buffer.from(
    "%PDF-1.7\n1 0 obj\n<</Type/XRef/Size 1/W[1 2 1]/Length 0>>\nstream\n\nendstream\nendobj\nstartxref\n9\n%%EOF",
    "latin1",
  );
  assert.equal(parseOwnXref(stream).kind, "stream");
});

test("qpdf repair messages are classified as damage", () => {
  for (const line of [
    "WARNING: x.pdf: file is damaged",
    "WARNING: x.pdf: Attempting to reconstruct cross-reference table",
    "WARNING: x.pdf: can't find startxref",
  ]) {
    assert.match(line, DAMAGE_PATTERN);
  }
  assert.doesNotMatch(
    "WARNING: x.pdf (object 19 0, offset 29251): expected endobj",
    DAMAGE_PATTERN,
  );
});
