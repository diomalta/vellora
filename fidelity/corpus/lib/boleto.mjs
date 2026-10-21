// Boleto de pagamento: 44-digit barcode and 47-digit linha digitavel.
// Primary sources (fidelity/corpus/SOURCES.md):
//   [BCB-2926]  BCB Carta-Circular 2.926/2000, annex "Leiaute e conteudo" + Notas.
//   [CAIXA]     Caixa "Especificacoes tecnicas para emissao de boletos" 67.119 v014 (OUT/2022),
//               4.2.10.1.1 (composition), Anexo I (DV geral), Anexo II (fator), Anexo V (linha).
import { boletoGeneralDv, mod10Dv } from "./check-digits.mjs";

const DAY_MS = 86_400_000;
/** [CAIXA] 5.2.1: base date 07/10/1997 (fator 1000 = 03/07/2000). */
const FATOR_BASE_UTC = Date.UTC(1997, 9, 7);
/** [CAIXA] 5.2.2: fator 9999 = 21/02/2025; from 22/02/2025 the counter restarts at 1000. */
const FATOR_RESTART_UTC = Date.UTC(2025, 1, 22);

function parseIsoDateUtc(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) {
    throw new TypeError(`expected YYYY-MM-DD, got ${JSON.stringify(iso)}`);
  }
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Fator de vencimento for an ISO date (YYYY-MM-DD), honouring the 22/02/2025 restart [CAIXA 5.2.2]. */
export function fatorVencimento(isoDate) {
  const t = parseIsoDateUtc(isoDate);
  if (t >= FATOR_RESTART_UTC) {
    const fator = 1000 + Math.round((t - FATOR_RESTART_UTC) / DAY_MS);
    if (fator > 9999) {
      throw new RangeError(`fator for ${isoDate} exceeds 9999 in the second cycle`);
    }
    return fator;
  }
  const fator = Math.round((t - FATOR_BASE_UTC) / DAY_MS);
  if (fator < 1000) {
    throw new RangeError(`dates before 03/07/2000 have no fator de vencimento (${isoDate})`);
  }
  return fator;
}

/** Valor do documento as 10 digits, 8 integer + 2 decimal (picture 9(8)V99) [BCB-2926]. */
export function valorField(centavos) {
  if (!Number.isInteger(centavos) || centavos < 0 || centavos > 9_999_999_999) {
    throw new RangeError(`valor must be integer centavos in [0, 9999999999], got ${centavos}`);
  }
  return String(centavos).padStart(10, "0");
}

/**
 * Compose the 44-digit barcode: banco(3) moeda(1) DV(1) fator(4) valor(10) campoLivre(25)
 * [BCB-2926 "Leiaute e conteudo"]. The DV is computed, never supplied.
 */
export function composeBarcode({ banco, moeda = "9", fator, valor, campoLivre }) {
  const parts = {
    banco: String(banco),
    moeda: String(moeda),
    fator: String(fator).padStart(4, "0"),
    valor: String(valor),
    campoLivre: String(campoLivre),
  };
  const lengths = { banco: 3, moeda: 1, fator: 4, valor: 10, campoLivre: 25 };
  for (const [k, len] of Object.entries(lengths)) {
    if (!new RegExp(`^\\d{${len}}$`).test(parts[k])) {
      throw new RangeError(`${k} must be ${len} digits, got ${JSON.stringify(parts[k])}`);
    }
  }
  const without = `${parts.banco}${parts.moeda}${parts.fator}${parts.valor}${parts.campoLivre}`;
  const dv = boletoGeneralDv(without);
  return `${without.slice(0, 4)}${dv}${without.slice(4)}`;
}

/** Validate a 44-digit barcode's DV geral; returns { ok, expected, actual }. */
export function validateBarcode(barcode) {
  if (!/^\d{44}$/.test(barcode)) {
    return { ok: false, reason: `not 44 digits (${barcode.length})` };
  }
  const expected = boletoGeneralDv(`${barcode.slice(0, 4)}${barcode.slice(5)}`);
  const actual = Number(barcode[4]);
  return { ok: expected === actual, expected, actual };
}

/**
 * Linha digitavel (47 digits, 5 fields) from the barcode [BCB-2926 II; CAIXA Anexo V]:
 *   1: barcode[1..4] + barcode[20..24] + DV10   2: barcode[25..34] + DV10
 *   3: barcode[35..44] + DV10                   4: barcode[5]   5: barcode[6..19]
 */
export function linhaDigitavel(barcode) {
  const check = validateBarcode(barcode);
  if (!check.ok) {
    throw new RangeError(`invalid barcode: ${JSON.stringify(check)}`);
  }
  const f1 = `${barcode.slice(0, 4)}${barcode.slice(19, 24)}`;
  const f2 = barcode.slice(24, 34);
  const f3 = barcode.slice(34, 44);
  const digits = `${f1}${mod10Dv(f1)}${f2}${mod10Dv(f2)}${f3}${mod10Dv(f3)}${barcode[4]}${barcode.slice(5, 19)}`;
  return { digits, formatted: formatLinha(digits) };
}

/** Edit with a dot after the 5th position of fields 1-3 and one space between fields [BCB-2926 Nota 1]. */
export function formatLinha(digits47) {
  const d = digits47;
  return `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d[32]} ${d.slice(33, 47)}`;
}

/**
 * Validate a linha digitavel (any formatting) independently of the barcode: field DVs (mod 10) and
 * the embedded DV geral (mod 11) after rebuilding the barcode. Returns the rebuilt barcode.
 */
export function validateLinha(linha) {
  const d = String(linha).replace(/\D/g, "");
  if (d.length !== 47) {
    return { ok: false, reason: `not 47 digits (${d.length})` };
  }
  const fields = [
    { body: d.slice(0, 9), dv: Number(d[9]) },
    { body: d.slice(10, 20), dv: Number(d[20]) },
    { body: d.slice(21, 31), dv: Number(d[31]) },
  ];
  const fieldResults = fields.map((f) => ({
    ...f,
    expected: mod10Dv(f.body),
    ok: mod10Dv(f.body) === f.dv,
  }));
  const barcode = `${d.slice(0, 4)}${d[32]}${d.slice(33, 47)}${d.slice(4, 9)}${d.slice(10, 20)}${d.slice(21, 31)}`;
  const barcodeCheck = validateBarcode(barcode);
  return {
    ok: fieldResults.every((f) => f.ok) && barcodeCheck.ok,
    fields: fieldResults,
    barcode,
    barcodeCheck,
  };
}

/** Decode fator -> ISO due date, given the cycle (dates >= 22/02/2025 use the second cycle). */
export function vencimentoFromFator(fator, { secondCycle }) {
  const base = secondCycle ? FATOR_RESTART_UTC - 1000 * DAY_MS : FATOR_BASE_UTC;
  return new Date(base + fator * DAY_MS).toISOString().slice(0, 10);
}
