#!/usr/bin/env node
// Audit the pre-existing fixtures/boleto (NOT owned by the corpus; never edited here) against the
// same primary-source validators used for fixtures/boleto-febraban. Prints a JSON report.
//   node fidelity/corpus/audit-existing-boleto.mjs
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateBarcode, validateLinha, vencimentoFromFator } from "./lib/boleto.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const dir = join(repoRoot, "fixtures", "boleto");
const data = JSON.parse(readFileSync(join(dir, "data.json"), "utf8"));
const html = readFileSync(join(dir, "index.html"), "utf8");
const doc = data.documento;
const barcode = doc.codigoBarras;
const fator = Number(barcode.slice(5, 9));
const linha = validateLinha(doc.linhaDigitavel);

const report = {
  fixture: "fixtures/boleto",
  barcode: {
    digits: barcode,
    length: barcode.length,
    dvGeral: validateBarcode(barcode),
    fator,
    fatorMeans: {
      firstCycle: vencimentoFromFator(fator, { secondCycle: false }),
      secondCycle: vencimentoFromFator(fator, { secondCycle: true }),
    },
    printedVencimento: doc.vencimento,
    valorField: barcode.slice(9, 19),
    valorFieldMeans: Number(barcode.slice(9, 19)) / 100,
    printedValor: doc.valor,
    renderedAsBars: !/(representa(ç|c)ão textual|não escaneável)/i.test(html),
  },
  linhaDigitavel: {
    printed: doc.linhaDigitavel,
    fieldDvs: linha.fields?.map((f) => ({ body: f.body, printed: f.dv, expected: f.expected })),
    ok: linha.ok,
    rebuildsPrintedBarcode: linha.barcode === barcode,
    rebuiltBarcode: linha.barcode,
  },
  circular3598MinimumInfo: {
    beneficiarioNome: Boolean(data.beneficiario?.nome),
    beneficiarioCnpj: Boolean(data.beneficiario?.cnpj),
    beneficiarioEndereco: Boolean(data.beneficiario?.endereco),
    pagadorNome: Boolean(data.pagador?.nome),
    valorEVencimento: Boolean(doc.valor && doc.vencimento),
  },
  bankCode: data.banco.codigoCompensacao,
};
console.log(JSON.stringify(report, null, 2));
