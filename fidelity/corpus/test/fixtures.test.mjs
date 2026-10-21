// Integrity of the committed corpus fixtures: derived data is in sync with its inputs, every check
// digit / total is self-consistent, licences and provenance files exist, and every template renders
// through vellora's templating with no unresolved token.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { TARGETS, serialize } from "../build-fixtures.mjs";
import { fatorVencimento, validateBarcode, validateLinha } from "../lib/boleto.mjs";
import { code128cValues } from "../lib/code128c.mjs";
import { parseChave, validateChave } from "../lib/nfe.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const read = (p) => readFileSync(join(repoRoot, p), "utf8");
const json = (p) => JSON.parse(read(p));
const manifest = json("fidelity/corpus/corpus.json");

const parseBR = (s) => Number(s.replace(/−/, "-").replace(/\./g, "").replace(",", "."));

test("derived fixture data is byte-identical to a fresh build (drift guard)", () => {
  for (const target of TARGETS) {
    assert.equal(
      read(target.path),
      serialize(target.build()),
      `${target.path} drifted; run build-fixtures.mjs`,
    );
  }
});

test("boleto-febraban: barcode, linha, fator, valor and campo livre are mutually consistent", () => {
  for (const file of ["data.json", "data.px-grid.json"]) {
    const d = json(`fixtures/boleto-febraban/${file}`);
    const bc = d.codigoBarras.digitos;
    assert.equal(validateBarcode(bc).ok, true);
    const linha = validateLinha(d.linhaDigitavel.formatada);
    assert.equal(linha.ok, true);
    assert.equal(linha.barcode, bc, "linha digitavel must rebuild the printed barcode");
    assert.equal(Number(bc.slice(5, 9)), fatorVencimento(d.expected.vencimentoIso));
    const [dd, mm, yyyy] = d.titulo.vencimento.split("/");
    assert.equal(`${yyyy}-${mm}-${dd}`, d.expected.vencimentoIso);
    assert.equal(Number(bc.slice(9, 19)), Math.round(parseBR(d.titulo.valor) * 100));
    assert.equal(bc.slice(19), d.expected.campoLivre);
    const total = d.demonstrativo.reduce((s, r) => s + Math.round(parseBR(r.valor) * 100), 0);
    assert.equal(total, d.expected.valorCentavos);
  }
  const spec = json("fixtures/boleto-febraban/data.json").codigoBarras;
  assert.ok(Math.abs(spec.lengthMm - 103) < 0.01, "spec geometry must be 103 mm long");
  assert.equal(spec.heightMm, 13);
});

test("danfe: chave DV, CODE-128C values, totals and duplicatas are consistent", () => {
  const d = json("fixtures/danfe/data.json");
  assert.equal(validateChave(d.chave.digitos).ok, true);
  const parts = parseChave(d.chave.digitos);
  assert.equal(parts.mod, "55");
  assert.equal(d.chave.formatada.replace(/ /g, ""), d.chave.digitos);
  assert.deepEqual(d.expected.code128Values, code128cValues(d.chave.digitos));
  assert.ok(d.codigoBarras.lengthMm >= 60, "MOC 7.0 Anexo II 2: >= 6 cm total width");
  assert.ok(d.codigoBarras.moduloMm >= 0.2, "MOC 7.0 Anexo II 2: module >= 0.02 cm");
  assert.ok(d.codigoBarras.heightMm >= 8, "MOC 7.0 Anexo II 2: bar height >= 0.8 cm");
  const items = d.itens.reduce((s, it) => s + Math.round(parseBR(it.vTotal) * 100), 0);
  assert.equal(items, d.expected.vProdCentavos);
  assert.equal(Math.round(parseBR(d.imposto.vNF) * 100), d.expected.vNFCentavos);
  const dups = d.duplicatas.reduce((s, x) => s + Math.round(parseBR(x.valor) * 100), 0);
  assert.equal(dups, d.expected.vNFCentavos);
});

test("text-stress-ptbr: running balance closes (inicial + creditos + debitos = final)", () => {
  const d = json("fixtures/text-stress-ptbr/data.json");
  const sum = parseBR(d.saldoInicial) + parseBR(d.totais.creditos) + parseBR(d.totais.debitos);
  assert.equal(Math.round(sum * 100), d.expected.saldoFinalCentavos);
  const last = d.meses.at(-1).lancamentos.at(-1);
  assert.equal(last.saldo, d.totais.saldoFinal);
});

test("every corpus fixture has index.html + its data files; OSS fixtures carry LICENSE + NOTICE", () => {
  for (const fx of manifest.fixtures) {
    const dir = `fixtures/${fx.id}`;
    assert.ok(existsSync(join(repoRoot, dir, "index.html")), `${dir}/index.html`);
    for (const v of fx.variants) {
      assert.ok(existsSync(join(repoRoot, dir, v.data)), `${dir}/${v.data}`);
    }
    if (fx.id.startsWith("oss-")) {
      assert.match(read(`${dir}/LICENSE`), /MIT License/);
      assert.match(read(`${dir}/NOTICE.md`), /commit [0-9a-f]{40}/);
    }
  }
});

test("every template renders through vellora templating with no unresolved token", async (t) => {
  let vellora;
  try {
    vellora = await import("vellora");
  } catch {
    t.skip("not-run: the vellora package is not built (run `npm run build` first)");
    return;
  }
  for (const fx of manifest.fixtures) {
    const html = read(`fixtures/${fx.id}/index.html`);
    for (const v of fx.variants) {
      const out = vellora.renderTemplate(html, json(`fixtures/${fx.id}/${v.data}`));
      assert.doesNotMatch(out, /\{\{|\}\}|\{%|%\}/, `${fx.id}/${v.data}`);
    }
  }
});
