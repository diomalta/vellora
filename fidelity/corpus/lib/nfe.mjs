// NF-e chave de acesso (44 digits). Composition: MOC 7.0 Visao Geral, Tabela 2-1 (2.2.6.1);
// DV: MOC 7.0 Visao Geral 2.2.6.2; printed mask (11 blocks of 4): MOC 7.0 Anexo II 3.1.1.
import { nfeChaveDv } from "./check-digits.mjs";

const FIELDS = [
  ["cUF", 2],
  ["aamm", 4],
  ["cnpj", 14],
  ["mod", 2],
  ["serie", 3],
  ["nNF", 9],
  ["tpEmis", 1],
  ["cNF", 8],
];

export function composeChave(parts) {
  let body = "";
  for (const [name, len] of FIELDS) {
    const raw = String(parts[name] ?? "");
    const value = raw.replace(/\D/g, "").padStart(len, "0");
    if (value.length !== len) {
      throw new RangeError(`${name} must fit in ${len} digits, got ${JSON.stringify(raw)}`);
    }
    body += value;
  }
  return `${body}${nfeChaveDv(body)}`;
}

export function validateChave(chave) {
  const d = String(chave).replace(/\D/g, "");
  if (d.length !== 44) {
    return { ok: false, reason: `not 44 digits (${d.length})` };
  }
  const expected = nfeChaveDv(d.slice(0, 43));
  return { ok: expected === Number(d[43]), expected, actual: Number(d[43]) };
}

export function parseChave(chave) {
  const d = String(chave).replace(/\D/g, "");
  const out = {};
  let at = 0;
  for (const [name, len] of FIELDS) {
    out[name] = d.slice(at, at + len);
    at += len;
  }
  out.cDV = d.slice(at);
  return out;
}

/** "9999 9999 ... 9999" — eleven blocks of four digits [MOC 7.0 Anexo II 3.1.1]. */
export function formatChave(chave) {
  return String(chave).replace(/(\d{4})(?=\d)/g, "$1 ");
}
