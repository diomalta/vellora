// Integrity of the committed corpus fixtures: derived data is in sync with its inputs, every check
// digit / total is self-consistent, licences and provenance files exist, and every template renders
// through vellora's templating with no unresolved token.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { TARGETS, serialize } from "../build-fixtures.mjs";
import { fatorVencimento, validateBarcode, validateLinha } from "../lib/boleto.mjs";
import { code128cValues } from "../lib/code128c.mjs";
import { parseChave, validateChave } from "../lib/nfe.mjs";
import { countOccurrences, requiredItems, visibleText } from "../lib/required-text.mjs";
import { PY, pythonMissing } from "./helpers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const read = (p) => readFileSync(join(repoRoot, p), "utf8");
const json = (p) => JSON.parse(read(p));
const manifest = json("fidelity/corpus/corpus.json");
const sources = json("fidelity/corpus/sources.json");
const sha256 = (p) =>
  createHash("sha256")
    .update(readFileSync(join(repoRoot, p)))
    .digest("hex");

async function loadVellora(t) {
  try {
    return await import("vellora");
  } catch {
    t.skip("not-run: the vellora package is not built (run `npm run build` first)");
    return null;
  }
}

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

// The LICENSE files are verbatim copies of the upstream file at the pinned commit, so their bytes
// must hash to sources.json licenceSha256 (a text that merely mentions "MIT License" does not).
// fileSha256 is the hash of the UPSTREAM template, which the fixture adapts (NOTICE.md lists the
// changes), so it is checked for consistency with NOTICE.md, not against the adapted index.html.
test("OSS fixtures: LICENSE bytes equal the pinned upstream licence; NOTICE agrees with sources.json", () => {
  const oss = manifest.fixtures.filter((fx) => fx.id.startsWith("oss-"));
  assert.equal(oss.length, sources.upstreamTemplates.length);
  for (const fx of oss) {
    const up = sources.upstreamTemplates.find((u) => u.fixture === fx.id);
    assert.ok(up, `${fx.id} missing from sources.json upstreamTemplates`);
    assert.equal(up.licence, "MIT");
    assert.equal(
      sha256(`fixtures/${fx.id}/${up.licenceFile}`),
      up.licenceSha256,
      `${fx.id} LICENSE`,
    );
    const notice = read(`fixtures/${fx.id}/NOTICE.md`);
    assert.ok(notice.includes(`commit ${up.commit}`), `${fx.id} NOTICE commit`);
    assert.ok(notice.includes(up.licenceSha256), `${fx.id} NOTICE licence sha256`);
    assert.ok(notice.includes(up.fileSha256), `${fx.id} NOTICE upstream file sha256`);
  }
});

// Every required string's pinned `count` is the number of times it occurs (case-insensitively) in
// the templated HTML body, so deleting one copy of a string that also appears elsewhere (the via
// label "Ficha de Compensação" vs "Autenticação Mecânica - Ficha de Compensação") is caught here at
// authoring time and by BOL-X1 at render time.
test("required-text counts are pinned to the templated HTML of every fixture/variant", async (t) => {
  const vellora = await loadVellora(t);
  if (!vellora) {
    return;
  }
  for (const fx of manifest.fixtures) {
    const html = read(`fixtures/${fx.id}/index.html`);
    for (const v of fx.variants) {
      const data = json(`fixtures/${fx.id}/${v.data}`);
      const text = visibleText(vellora.renderTemplate(html, data));
      for (const it of requiredItems(fx, data)) {
        const loose = it.mode === "loose";
        const n = countOccurrences(
          loose ? text.replace(/ /g, "") : text,
          loose ? it.needle.replace(/ /g, "") : it.needle,
        );
        assert.equal(
          n,
          it.count,
          `${fx.id}/${v.data} ${it.ref}: HTML has ${n}, corpus.json pins ${it.count}`,
        );
      }
    }
  }
});

// DANFE: every visible text node of the templated body is inside an element whose data-moc names a
// category the manifest judges (fidelity/corpus/font_sizes.py Segments parser, the same one the
// render-time DANFE-F1..F11 checks use), so no glyph escapes the MOC-AII 3.7 minimums.
test("danfe: every body text node carries a data-moc category judged by corpus.json", async (t) => {
  const skip = pythonMissing();
  if (skip) {
    t.skip(skip);
    return;
  }
  const vellora = await loadVellora(t);
  if (!vellora) {
    return;
  }
  const fx = manifest.fixtures.find((f) => f.id === "danfe");
  const html = vellora.renderTemplate(
    read("fixtures/danfe/index.html"),
    json("fixtures/danfe/data.json"),
  );
  const code = [
    "import json, sys",
    `sys.path.insert(0, ${JSON.stringify(join(repoRoot, "fidelity", "corpus"))})`,
    "from font_sizes import Segments",
    "p = Segments(); p.feed(sys.stdin.read())",
    "print(json.dumps({'mocs': sorted({m for _, m in p.out}), 'untagged': [t for t, _ in p.untagged], 'n': len(p.out)}))",
  ].join("\n");
  const out = JSON.parse(
    execFileSync(PY, ["-I", "-B", "-c", code], { input: html, encoding: "utf8" }),
  );
  assert.deepEqual(out.untagged, [], "text outside any data-moc element");
  assert.ok(out.n > 300, `only ${out.n} segments`);
  const judged = new Set(fx.fontRules.categories.map((c) => c.moc));
  assert.deepEqual(
    out.mocs.filter((m) => !judged.has(m)),
    [],
    "data-moc values the manifest does not judge",
  );
  assert.deepEqual(
    [...judged].filter((m) => !out.mocs.includes(m)),
    [],
    "categories with no segment",
  );
});

test("every template renders through vellora templating with no unresolved token", async (t) => {
  const vellora = await loadVellora(t);
  if (!vellora) {
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
