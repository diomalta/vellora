/**
 * vellora recipe — render a point-of-sale receipt to PDF, in-process, no browser.
 *
 * From the repo root (after `npm install && npm run build`): `npm run render-receipt`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPdf } from "vellora";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, "..", "fixtures", "receipt");

const template = readFileSync(join(fixtureDir, "index.html"), "utf8");
const data = JSON.parse(readFileSync(join(fixtureDir, "data.json"), "utf8"));

const pdf = await renderPdf(template, data, {
  metadata: { title: "Recibo", creationDate: "2026-06-22T00:00:00.000Z" },
  strict: true,
});

const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "receipt.pdf");
writeFileSync(outPath, pdf);

const header = new TextDecoder().decode(pdf.subarray(0, 8));
if (!header.startsWith("%PDF-")) {
  throw new Error(`expected a %PDF- header, got ${JSON.stringify(header)}`);
}
console.log(`✓ rendered ${pdf.length} bytes → ${outPath}`);
console.log(`  valid PDF header: ${header.startsWith("%PDF-")} (${JSON.stringify(header)})`);
