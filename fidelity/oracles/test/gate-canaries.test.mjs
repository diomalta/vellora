// Unit tests of the gate-era canary helpers (veraPDF PDF/A rule breakers, Code 128) and of the
// Code 128 validator the barcode oracle uses for DANFE-B1. The canaries themselves run against the
// real tools in run-fixtures.mjs (counted in run-all's canaryCounts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { code128cPattern } from "../../corpus/lib/code128c.mjs";
import { SYMBOLOGIES } from "../lib/barcode.mjs";
import {
  VALID_NFE_CHAVE,
  VERAPDF_CANARIES,
  code128CanaryHtml,
  invalidChaveDv,
  renamePdfName,
} from "../lib/canaries.mjs";

test("renamePdfName keeps the byte length (xref offsets stay valid) and counts occurrences", () => {
  const pdf = Buffer.from(
    "1 0 obj << /Type /Catalog /OutputIntents [2 0 R] >> endobj\n/FontFile2 3 0 R /FontFile2",
  );
  for (const c of VERAPDF_CANARIES) {
    const out = renamePdfName(pdf, c.from, c.to);
    assert.equal(out.bytes.length, pdf.length);
    assert.ok(out.count >= 1, c.id);
    assert.ok(!out.bytes.includes(Buffer.from(c.from)), `${c.id} left an occurrence`);
  }
  assert.equal(renamePdfName(Buffer.from("no keys"), "/FontFile2", "/FontFilf2").count, 0);
  assert.throws(() => renamePdfName(pdf, "/A", "/AB"));
});

test("Code 128 canary data: the chave validates, its cDV-broken twin does not", () => {
  assert.equal(SYMBOLOGIES.code128.validate(VALID_NFE_CHAVE).valid, true);
  const bad = invalidChaveDv();
  assert.equal(bad.length, 44);
  assert.notEqual(bad, VALID_NFE_CHAVE);
  const v = SYMBOLOGIES.code128.validate(bad);
  assert.equal(v.valid, false);
  assert.match(v.errors, /cDV/);
  const html = code128CanaryHtml(VALID_NFE_CHAVE, code128cPattern(VALID_NFE_CHAVE));
  // 24 symbol values x 3 bars + 4-bar stop = 76 bars, 75 spaces.
  assert.equal((html.match(/background: #000/g) ?? []).length, 76);
});

test("ITF stays the default symbology (boleto), Code 128 is DANFE's", () => {
  assert.deepEqual(SYMBOLOGIES.itf.zbar, ["-Sdisable", "-Si25.enable"]);
  assert.deepEqual(SYMBOLOGIES.code128.zbar, ["-Sdisable", "-Scode128.enable"]);
  assert.equal(
    SYMBOLOGIES.itf.validate("03398204600000273719028203356661245780020101").valid,
    true,
  );
});
