// Worked examples copied from the primary sources (fidelity/corpus/SOURCES.md). If one of these
// fails, the implementation disagrees with the spec, not the other way round.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  composeBarcode,
  fatorVencimento,
  linhaDigitavel,
  validateLinha,
  vencimentoFromFator,
} from "../lib/boleto.mjs";
import {
  boletoGeneralDv,
  cnpjCheckDigits,
  cpfCheckDigits,
  mod10Dv,
  nfeChaveDv,
  sigcbDv,
} from "../lib/check-digits.mjs";
import { composeChave, formatChave, validateChave } from "../lib/nfe.mjs";

// Caixa 67.119 v014, Anexo I (5.1): 104 9 [DV] 3242 0000032112 + campo livre 0055077222133347777777771
const CAIXA_BARCODE = "10494324200000321120055077222133347777777771";

test("Caixa Anexo I: DV geral of the worked example is 4", () => {
  const without = `${CAIXA_BARCODE.slice(0, 4)}${CAIXA_BARCODE.slice(5)}`;
  assert.equal(boletoGeneralDv(without), 4);
  assert.equal(
    composeBarcode({
      banco: "104",
      fator: 3242,
      valor: "0000032112",
      campoLivre: "0055077222133347777777771",
    }),
    CAIXA_BARCODE,
  );
});

test("DV geral never admits 0 (Carta-Circular 2.926 Nota 1; Caixa 5.1.4)", () => {
  // Search a body whose raw mod-11 result is 0, 10 or 11 and check it maps to 1.
  let found = 0;
  for (let n = 0; n < 2000 && found < 3; n++) {
    const body = `1049${String(n).padStart(39, "0")}`;
    const raw = 11 - (sumMod11(body) % 11);
    if (raw === 0 || raw > 9) {
      assert.equal(boletoGeneralDv(body), 1);
      found++;
    }
  }
  assert.ok(found > 0);
});

function sumMod11(s) {
  let sum = 0;
  let w = 2;
  for (let i = s.length - 1; i >= 0; i--) {
    sum += Number(s[i]) * w;
    w = w === 9 ? 2 : w + 1;
  }
  return sum;
}

test("Caixa Anexo III / IV / VI: campo livre DV 1, nosso numero DV 7, beneficiario DV 7", () => {
  assert.equal(sigcbDv("005507722213334777777777"), 1);
  assert.equal(sigcbDv("14000000000000019"), 7);
  assert.equal(sigcbDv("005507"), 7);
});

test("Caixa Anexo V: mod-10 example 104900550 -> 5 and the full linha digitavel", () => {
  assert.equal(mod10Dv("104900550"), 5);
  assert.equal(
    linhaDigitavel(CAIXA_BARCODE).formatted,
    "10490.05505 77222.133348 77777.777713 4 32420000032112",
  );
});

test("validateLinha catches a single-digit error in each field and rebuilds the barcode", () => {
  const good = linhaDigitavel(CAIXA_BARCODE).digits;
  const ok = validateLinha(good);
  assert.equal(ok.ok, true);
  assert.equal(ok.barcode, CAIXA_BARCODE);
  for (const pos of [2, 12, 25, 32, 40]) {
    const bad = `${good.slice(0, pos)}${(Number(good[pos]) + 1) % 10}${good.slice(pos + 1)}`;
    assert.equal(validateLinha(bad).ok, false, `error at position ${pos} not detected`);
  }
});

test("Caixa Anexo II: fator de vencimento table, both cycles (restart at 22/02/2025)", () => {
  const firstCycle = {
    1000: "2000-07-03",
    1002: "2000-07-05",
    1667: "2002-05-01",
    4789: "2010-11-17",
    9999: "2025-02-21",
  };
  const secondCycle = {
    1000: "2025-02-22",
    1002: "2025-02-24",
    1667: "2026-12-21",
    4789: "2035-07-09",
    9999: "2049-10-13",
  };
  for (const [fator, iso] of Object.entries(firstCycle)) {
    assert.equal(fatorVencimento(iso), Number(fator));
    assert.equal(vencimentoFromFator(Number(fator), { secondCycle: false }), iso);
  }
  for (const [fator, iso] of Object.entries(secondCycle)) {
    assert.equal(fatorVencimento(iso), Number(fator));
    assert.equal(vencimentoFromFator(Number(fator), { secondCycle: true }), iso);
  }
  // Caixa 5.1 example: fator 3242 = 23/08/2006.
  assert.equal(fatorVencimento("2006-08-23"), 3242);
});

test("MOC 7.0 Visao Geral 2.2.6.2: chave DV example is 5; remainders 0/1 give DV 0", () => {
  assert.equal(nfeChaveDv("5206043300991100250655012000000780026730161"), 5);
  const chave = composeChave({
    cUF: "52",
    aamm: "0604",
    cnpj: "33009911002506",
    mod: "55",
    serie: "012",
    nNF: "000000780",
    tpEmis: "0",
    cNF: "26730161",
  });
  assert.equal(chave, "52060433009911002506550120000007800267301615");
  assert.equal(validateChave(chave).ok, true);
  assert.equal(validateChave(`${chave.slice(0, 43)}6`).ok, false);
  assert.equal(formatChave(chave).split(" ").length, 11);
});

test("CNPJ / CPF check digits of the classic synthetic numbers", () => {
  assert.equal(cnpjCheckDigits("112223330001"), "81");
  assert.equal(cpfCheckDigits("123456789"), "09");
});
