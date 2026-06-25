#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { countPages } from "../benchmarks/lib/equivalence.mjs";

const FIXTURE_IDS = ["invoice", "receipt", "boleto", "notification"];
const FIXED_CREATION_DATE = "2026-06-25T00:00:00.000Z";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function selectedFixtures() {
  const one = argValue("--fixture", "");
  if (!one) {
    return FIXTURE_IDS;
  }
  if (!FIXTURE_IDS.includes(one)) {
    throw new Error(`Unknown fixture "${one}". Expected one of: ${FIXTURE_IDS.join(", ")}`);
  }
  return [one];
}

function loadFixture(id) {
  const dir = join(repoRoot, "fixtures", id);
  const htmlPath = join(dir, "index.html");
  const dataPath = join(dir, "data.json");
  if (!existsSync(htmlPath) || !existsSync(dataPath)) {
    throw new Error(`Fixture "${id}" is missing index.html or data.json`);
  }
  return {
    id,
    html: readFileSync(htmlPath, "utf8"),
    data: JSON.parse(readFileSync(dataPath, "utf8")),
  };
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderReviewPage(entries) {
  const rows = entries
    .map(
      (entry) => `<tr>
        <td><a href="${htmlEscape(basename(entry.pdfPath))}">${htmlEscape(entry.id)}</a></td>
        <td>${entry.pages}</td>
        <td>${entry.bytes}</td>
        <td><code>${htmlEscape(entry.sha256.slice(0, 16))}</code></td>
      </tr>`,
    )
    .join("\n");
  const embeds = entries
    .map(
      (entry) => `<section>
        <h2>${htmlEscape(entry.id)}</h2>
        <object data="${htmlEscape(basename(entry.pdfPath))}" type="application/pdf"></object>
      </section>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vellora Fixture Review</title>
  <style>
    body { margin: 24px; font: 14px/1.45 system-ui, sans-serif; color: #1a1d24; }
    table { border-collapse: collapse; width: 100%; margin: 0 0 24px; }
    th, td { border-bottom: 1px solid #d7dce4; padding: 8px 10px; text-align: left; }
    th { background: #f4f6fa; font-weight: 700; }
    section { margin: 0 0 28px; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    h2 { margin: 0 0 8px; font-size: 18px; }
    object { width: 100%; height: 82vh; border: 1px solid #d7dce4; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  </style>
</head>
<body>
  <h1>Vellora Fixture Review</h1>
  <table>
    <thead><tr><th>Fixture</th><th>Pages</th><th>Bytes</th><th>SHA-256</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
${embeds}
</body>
</html>
`;
}

let renderPdf;
try {
  ({ renderPdf } = await import("vellora"));
} catch (cause) {
  throw new Error("Build the workspace before running visual fixtures: npm run build", {
    cause,
  });
}

const outDir = resolve(repoRoot, argValue("--out", "examples/out/visual-fixtures"));
mkdirSync(outDir, { recursive: true });

const entries = [];
for (const id of selectedFixtures()) {
  const fixture = loadFixture(id);
  const pdf = await renderPdf(fixture.html, fixture.data, {
    metadata: { title: `fixture-${id}`, creationDate: FIXED_CREATION_DATE },
    strict: true,
  });
  const header = new TextDecoder().decode(pdf.subarray(0, 5));
  if (header !== "%PDF-") {
    throw new Error(`${id}: expected a PDF header, got ${JSON.stringify(header)}`);
  }

  const pdfPath = join(outDir, `${id}.pdf`);
  writeFileSync(pdfPath, pdf);
  entries.push({
    id,
    pages: countPages(pdf),
    bytes: pdf.length,
    sha256: sha256(pdf),
    pdfPath: relative(outDir, pdfPath),
  });
}

const manifest = {
  renderer: "vellora",
  fixtures: entries.map(({ id, pages, bytes, sha256, pdfPath }) => ({
    id,
    pages,
    bytes,
    sha256,
    pdfPath,
  })),
};

writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(join(outDir, "index.html"), renderReviewPage(entries));

for (const entry of entries) {
  console.log(
    `${entry.id}: ${entry.pages} pages, ${entry.bytes} bytes, ${entry.sha256.slice(0, 16)} -> ${join(outDir, entry.pdfPath)}`,
  );
}
console.log(`Review page: ${join(outDir, "index.html")}`);
