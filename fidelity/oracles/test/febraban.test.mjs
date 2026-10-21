import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  barcodeToLinha,
  fatorCandidates,
  findLinhasDigitaveis,
  linhaToBarcode,
  mod10Dv,
  mod11BarcodeDv,
  validateBoletoBarcode,
  validateLinhaDigitavel,
} from "../lib/febraban.mjs";
import { REPO_ROOT } from "../lib/paths.mjs";

// Worked examples from Banco Santander "Código de Barras - Cobrança" v36 (Abril 2025).
const SANTANDER_BARCODE = "03398204600000273719028203356661245780020101";

test("mod 10 reproduces the Santander v36 worked field examples (p.11-13)", () => {
  assert.equal(mod10Dv("033990282"), 7);
  assert.equal(mod10Dv("0335666124"), 3);
  assert.equal(mod10Dv("5780020101"), 4);
});

test("mod 11 reproduces the Santander v36 barcode DV example (sum 696 -> 8)", () => {
  assert.equal(mod11BarcodeDv(SANTANDER_BARCODE.slice(0, 4) + SANTANDER_BARCODE.slice(5)), 8);
  const result = validateBoletoBarcode(SANTANDER_BARCODE);
  assert.equal(result.valid, true);
  assert.equal(result.fields.valorReais, 273.71);
});

test("mod 11 maps remainders 0, 1 and 10 to DV 1 (BCB 2926 01.b.V Nota 1)", () => {
  // Search 43-digit bodies whose weighted sum hits each special remainder.
  const found = new Set();
  for (let n = 0; n < 5000 && found.size < 3; n += 1) {
    const body = String(n).padStart(43, "0");
    let sum = 0;
    let weight = 2;
    for (let i = body.length - 1; i >= 0; i -= 1) {
      sum += Number(body[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    const remainder = sum % 11;
    if (remainder === 0 || remainder === 1 || remainder === 10) {
      assert.equal(mod11BarcodeDv(body), 1, `remainder ${remainder}`);
      found.add(remainder);
    }
  }
  assert.deepEqual(
    [...found].sort((a, b) => a - b),
    [0, 1, 10],
  );
});

test("a barcode with a wrong position-5 DV is rejected", () => {
  const broken = `${SANTANDER_BARCODE.slice(0, 4)}9${SANTANDER_BARCODE.slice(5)}`;
  const result = validateBoletoBarcode(broken);
  assert.equal(result.valid, false);
  assert.match(result.errors[0], /mod-11 gives 8/);
});

test("barcode <-> linha digitável round trip (BCB 2926 01.b.II field mapping)", () => {
  const linha = barcodeToLinha(SANTANDER_BARCODE);
  assert.equal(linha, "03399.02827 03356.661243 57800.201014 8 20460000027371");
  assert.equal(linhaToBarcode(linha), SANTANDER_BARCODE);
  const check = validateLinhaDigitavel(linha);
  assert.equal(check.valid, true, JSON.stringify(check.errors));
  assert.deepEqual(findLinhasDigitaveis(`Pague: ${linha} até amanhã`), [linha]);
});

test("a linha digitável with a wrong field DV is rejected", () => {
  const linha = barcodeToLinha(SANTANDER_BARCODE).replace("03399.02827", "03399.02828");
  const check = validateLinhaDigitavel(linha);
  assert.equal(check.valid, false);
  assert.match(check.errors.join(" "), /field 1 DV is 8, mod-10 gives 7/);
});

test("fator de vencimento matches Santander v36 p.5 examples on both bases", () => {
  assert.equal(fatorCandidates(1156)[0].date, "2000-12-06");
  assert.equal(fatorCandidates(1165)[0].date, "2000-12-15");
  assert.equal(fatorCandidates(1000)[1].date, "2025-02-22");
  assert.equal(fatorCandidates(1002)[1].date, "2025-02-24");
});

test("arrecadação layout (leading 8) is reported as not applicable, not as invalid", () => {
  const result = validateBoletoBarcode(`8${"0".repeat(43)}`);
  assert.equal(result.applicable, false);
  assert.equal(result.valid, null);
});

test("the boleto fixture's printed values are reported invalid (fictional data, not rendering)", () => {
  const data = JSON.parse(readFileSync(join(REPO_ROOT, "fixtures", "boleto", "data.json"), "utf8"));
  assert.equal(validateBoletoBarcode(data.documento.codigoBarras).valid, false);
  const linha = validateLinhaDigitavel(data.documento.linhaDigitavel);
  assert.equal(linha.valid, false);
  assert.notEqual(linha.barcode, data.documento.codigoBarras);
});
