// Check-digit algorithms used by the Brazilian corpus fixtures. Each function cites the primary
// source section it implements (see fidelity/corpus/SOURCES.md for URL, version and sha256).

function digitsOf(value) {
  const s = String(value);
  if (!/^\d+$/.test(s)) {
    throw new TypeError(`expected a string of decimal digits, got ${JSON.stringify(value)}`);
  }
  return [...s].map(Number);
}

// Weighted mod-11 sum, weights 2..9 cycling from the rightmost digit.
function mod11Sum(value) {
  const digits = digitsOf(value);
  let sum = 0;
  let weight = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += digits[i] * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  return sum;
}

/**
 * Boleto "DV geral" (position 5 of the 44-digit barcode) over the other 43 digits.
 * BCB Carta-Circular 2.926/2000 Nota 1 + Caixa 67.119 v014 Anexo I (5.1.4): DV = 11 - (sum mod 11);
 * a result of 0 or > 9 becomes 1 — the general DV never admits 0.
 */
export function boletoGeneralDv(digits43) {
  if (String(digits43).length !== 43) {
    throw new RangeError("boletoGeneralDv expects the 43 barcode digits without position 5");
  }
  const dv = 11 - (mod11Sum(digits43) % 11);
  return dv === 0 || dv > 9 ? 1 : dv;
}

/**
 * Caixa SIGCB mod-11 DV used for the codigo do beneficiario (Anexo VI), the nosso numero (Anexo IV)
 * and the campo livre (Anexo III): DV = 11 - (sum mod 11), weights 2..9 from the right; a result
 * greater than 9 becomes 0 (these DVs admit 0, unlike the DV geral). Caixa 67.119 v014 5.3-5.6.
 */
export function sigcbDv(value) {
  const dv = 11 - (mod11Sum(value) % 11);
  return dv > 9 ? 0 : dv;
}

/**
 * Linha digitavel field DV (fields 1, 2, 3): mod 10, weights 2,1 alternating from the right,
 * two-digit products summed digit-wise; DV = (10 - sum mod 10) mod 10.
 * Caixa 67.119 v014 Anexo V (5.5.1); FEBRABAN "Layout - Codigo de Barras" v06 (calculo do DAC mod 10).
 */
export function mod10Dv(value) {
  const digits = digitsOf(value);
  let sum = 0;
  let weight = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    const product = digits[i] * weight;
    sum += product > 9 ? Math.floor(product / 10) + (product % 10) : product;
    weight = weight === 2 ? 1 : 2;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * NF-e chave de acesso DV (cDV): mod 11, weights 2..9 from the right; DV = 11 - (sum mod 11),
 * and a remainder of 0 or 1 yields DV 0. MOC 7.0 Visao Geral 2.2.6.2.
 */
export function nfeChaveDv(digits43) {
  if (String(digits43).length !== 43) {
    throw new RangeError("nfeChaveDv expects the 43 chave digits without the DV");
  }
  const remainder = mod11Sum(digits43) % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Brazilian CNPJ (14 digits) check digits, mod 11 weights 2..9 from the right; remainder < 2 -> 0.
 * Receita Federal algorithm (same shape as the NF-e DV). Used only to make synthetic CNPJs valid.
 */
export function cnpjCheckDigits(base12) {
  if (String(base12).length !== 12) {
    throw new RangeError("cnpjCheckDigits expects the 12-digit CNPJ base");
  }
  const d1 = mod11Sum(base12) % 11;
  const dv1 = d1 < 2 ? 0 : 11 - d1;
  const d2 = mod11Sum(`${base12}${dv1}`) % 11;
  const dv2 = d2 < 2 ? 0 : 11 - d2;
  return `${dv1}${dv2}`;
}

/** Brazilian CPF (11 digits) check digits: weights 2..10 / 2..11 from the right; remainder < 2 -> 0. */
export function cpfCheckDigits(base9) {
  const digits = digitsOf(base9);
  if (digits.length !== 9) {
    throw new RangeError("cpfCheckDigits expects the 9-digit CPF base");
  }
  const dv = (ds) => {
    let sum = 0;
    for (let i = 0; i < ds.length; i++) {
      sum += ds[i] * (ds.length + 1 - i);
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const dv1 = dv(digits);
  const dv2 = dv([...digits, dv1]);
  return `${dv1}${dv2}`;
}
