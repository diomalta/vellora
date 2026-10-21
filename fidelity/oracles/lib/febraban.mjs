// Check-digit validation for Brazilian boleto (bloqueto de cobrança) barcodes and the 47-digit
// "linha digitável" (representação numérica), so a decoded value can be judged even without an
// expected value.
//
// PRIMARY SOURCES (both downloaded and read on 2026-10-21; sha256 of the PDFs as fetched):
//
// [BCB-2926] Banco Central do Brasil, Carta-Circular nº 2926, de 24 de julho de 2000
//   ("Inclui 'fator de vencimento' no código de barras do Bloqueto de Cobrança modelo CADOC
//   24044-4"), Anexo "ESPECIFICAÇÕES" / "INSTRUÇÕES DE PREENCHIMENTO":
//     - item 01.b.V "CODIGO DE BARRAS", "Leiaute e conteúdo": positions 01-03 bank, 04 currency
//       (9 = real), 05 general DV, 06-09 fator de vencimento, 10-19 valor (9(8)V99),
//       20-44 campo livre; type "2 de 5 intercalado".
//     - item 01.b.V Nota 1: DV at position 5 = "módulo 11, de 2 a 9, utilizando o dígito 1 para
//       os restos 0, 10 ou 1"; "considerar as posições de 1 a 4 e de 6 a 44, iniciando pela
//       posição 44 e saltando a posição 5".
//     - item 01.b.II "REPRESENTAÇÃO NUMÉRICA" (linha digitável): five fields; field 1 = barcode
//       1-3 + 4 + campo livre 20-24 + DV; field 2 = barcode 25-34 + DV; field 3 = barcode
//       35-44 + DV; field 4 = barcode position 5; field 5 = fator (6-9) + valor (10-19);
//       Nota 1: fields 1-3 edited with a point after their 5th position; Nota 3: the field DVs
//       are not represented in the barcode.
//     https://www.bcb.gov.br/pre/normativos/c_circ/2000/pdf/c_circ_2926_v1_O.pdf
//     sha256 2bd983daccbb947b1bb6ddca7ba90eef4eb833bc40afe4eea6158b2b932c0a36
//   BCB-2926 does NOT state the algorithm of the field 1-3 DVs.
//
// [SANTANDER-v36] Banco Santander, "Código de Barras - Cobrança", Versão 36 (Abril 2025):
//     - p.6-7: the same mod-11 rule, worked example (sum 696 -> DV 8).
//     - p.11-12 "Módulo 10 - CÁLCULO": weights 2,1 from right to left, a product > 9 is
//       replaced by the sum of its digits, DV = 10 - (sum mod 10), and 0 when the remainder is 0;
//       worked examples field 1 "033990282" -> 7, field 2 "0335666124" -> 3, field 3
//       "5780020101" -> 4. (The page's "Ex.: 578000 0 101" caption is a typo: the worked digits
//       and the IPTE line use 5780020101.)
//     - p.5: fator de vencimento = days since 07/10/1997; from 22/02/2025 the fator restarts at
//       1000 ("Nova data Base").
//     https://cms.santander.com.br/sites/WPS/documentos/arq-cobranca-barras-port-jul22/25-05-06_134319_codigo-de+barras-santander-abril-2025-v36-ptbr.pdf
//     sha256 5008730a99f482ea6cfbb5edf8fc85dc0b746326f1273120a38e4dcab8d79e0a
//
// UNVERIFIED ASSUMPTION: that the Santander mod-10 rule for the linha digitável fields applies
// to every bank. Santander states it follows FEBRABAN determinations, and the rule is the one in
// common use, but the FEBRABAN cobrança specification itself was not obtained.
//
// NOT IMPLEMENTED: the "arrecadação" (convênio/utility/tax) layout, which starts with "8" and
// uses different DV rules (FEBRABAN "Layout - Código de Barras"); such inputs are reported as
// not applicable instead of failing.

const onlyDigits = (value) => String(value).replace(/\D/g, "");

/** BCB-2926 01.b.V Nota 1: mod 11, weights 2..9 cycling from the right, remainders 0/1/10 -> 1. */
export function mod11BarcodeDv(digits43) {
  if (!/^\d{43}$/.test(digits43)) {
    throw new Error("mod11BarcodeDv expects the 43 barcode digits without position 5");
  }
  let sum = 0;
  let weight = 2;
  for (let i = digits43.length - 1; i >= 0; i -= 1) {
    sum += Number(digits43[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  return remainder === 0 || remainder === 1 || remainder === 10 ? 1 : 11 - remainder;
}

/** SANTANDER-v36 p.11: mod 10, weights 2,1 from the right, digit-sum of products > 9. */
export function mod10Dv(digits) {
  if (!/^\d+$/.test(digits)) {
    throw new Error("mod10Dv expects digits");
  }
  let sum = 0;
  let weight = 2;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    const product = Number(digits[i]) * weight;
    sum += product > 9 ? Math.floor(product / 10) + (product % 10) : product;
    weight = weight === 2 ? 1 : 2;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/** Fator de vencimento -> candidate due dates (both cycles; SANTANDER-v36 p.5). */
export function fatorCandidates(fator) {
  const value = Number(fator);
  if (value === 0) {
    return [];
  }
  const day = 86_400_000;
  const firstCycle = new Date(Date.UTC(1997, 9, 7) + value * day);
  const candidates = [{ cycle: "base 1997-10-07", date: firstCycle.toISOString().slice(0, 10) }];
  if (value >= 1000) {
    const secondCycle = new Date(Date.UTC(2025, 1, 22) + (value - 1000) * day);
    candidates.push({
      cycle: "base 2025-02-22 (=1000)",
      date: secondCycle.toISOString().slice(0, 10),
    });
  }
  return candidates;
}

/** Validate a 44-digit bloqueto de cobrança barcode (BCB-2926 01.b.V). */
export function validateBoletoBarcode(barcode) {
  const digits = onlyDigits(barcode);
  if (digits.length !== 44) {
    return {
      applicable: true,
      valid: false,
      errors: [`expected 44 digits, got ${digits.length}`],
    };
  }
  if (digits[0] === "8") {
    return {
      applicable: false,
      valid: null,
      layout: "arrecadacao",
      errors: ["arrecadação layout (leading 8) is not implemented"],
    };
  }
  const errors = [];
  const fields = {
    bank: digits.slice(0, 3),
    currency: digits.slice(3, 4),
    dv: Number(digits[4]),
    fator: digits.slice(5, 9),
    valor: digits.slice(9, 19),
    campoLivre: digits.slice(19, 44),
  };
  const expectedDv = mod11BarcodeDv(digits.slice(0, 4) + digits.slice(5));
  if (fields.dv !== expectedDv) {
    errors.push(`position 5 DV is ${fields.dv}, mod-11 gives ${expectedDv}`);
  }
  if (fields.currency !== "9") {
    errors.push(`currency code (position 4) is ${fields.currency}, BCB-2926 lists 9 = real`);
  }
  return {
    applicable: true,
    valid: errors.length === 0,
    layout: "cobranca",
    errors,
    fields: {
      ...fields,
      expectedDv,
      valorReais: Number(fields.valor) / 100,
      dueDateCandidates: fatorCandidates(fields.fator),
    },
  };
}

/** Linha digitável -> barcode (BCB-2926 01.b.II field mapping; DVs dropped). */
export function linhaToBarcode(linha) {
  const d = onlyDigits(linha);
  if (d.length !== 47) {
    throw new Error(`linha digitável must have 47 digits, got ${d.length}`);
  }
  const field1 = d.slice(0, 9);
  const field2 = d.slice(10, 20);
  const field3 = d.slice(21, 31);
  const generalDv = d.slice(32, 33);
  const field5 = d.slice(33, 47);
  return field1.slice(0, 4) + generalDv + field5 + field1.slice(4) + field2 + field3;
}

/** Barcode -> formatted linha digitável with computed field DVs. */
export function barcodeToLinha(barcode) {
  const b = onlyDigits(barcode);
  if (b.length !== 44) {
    throw new Error(`barcode must have 44 digits, got ${b.length}`);
  }
  const f1 = b.slice(0, 4) + b.slice(19, 24);
  const f2 = b.slice(24, 34);
  const f3 = b.slice(34, 44);
  const withDv = (field) => `${field}${mod10Dv(field)}`;
  const edit = (field) => `${field.slice(0, 5)}.${field.slice(5)}`;
  return `${edit(withDv(f1))} ${edit(withDv(f2))} ${edit(withDv(f3))} ${b[4]} ${b.slice(5, 19)}`;
}

/** Validate a 47-digit linha digitável: three mod-10 field DVs + the barcode it encodes. */
export function validateLinhaDigitavel(linha) {
  const d = onlyDigits(linha);
  if (d.length !== 47) {
    return { applicable: true, valid: false, errors: [`expected 47 digits, got ${d.length}`] };
  }
  if (d[0] === "8") {
    return {
      applicable: false,
      valid: null,
      layout: "arrecadacao",
      errors: ["arrecadação layout (leading 8) is not implemented"],
    };
  }
  const errors = [];
  const fieldChecks = [
    { field: 1, body: d.slice(0, 9), dv: Number(d[9]) },
    { field: 2, body: d.slice(10, 20), dv: Number(d[20]) },
    { field: 3, body: d.slice(21, 31), dv: Number(d[31]) },
  ].map((check) => ({ ...check, expectedDv: mod10Dv(check.body) }));
  for (const check of fieldChecks) {
    if (check.dv !== check.expectedDv) {
      errors.push(`field ${check.field} DV is ${check.dv}, mod-10 gives ${check.expectedDv}`);
    }
  }
  const barcode = linhaToBarcode(d);
  const barcodeCheck = validateBoletoBarcode(barcode);
  for (const error of barcodeCheck.errors) {
    errors.push(`encoded barcode: ${error}`);
  }
  return {
    applicable: true,
    valid: errors.length === 0,
    layout: "cobranca",
    errors,
    fieldChecks,
    barcode,
    barcodeCheck,
  };
}

/** Find linha digitável candidates (47 digits in the 5-field edited layout) in extracted text. */
export function findLinhasDigitaveis(text) {
  const pattern = /\b\d{5}\.?\d{5}\s+\d{5}\.?\d{6}\s+\d{5}\.?\d{6}\s+\d\s+\d{14}\b/g;
  return [...String(text).matchAll(pattern)].map((match) => match[0].replace(/\s+/g, " "));
}
