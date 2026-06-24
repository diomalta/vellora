/**
 * vellora recipe — render several documents concurrently.
 *
 * From the repo root (after `npm install && npm run build`): `npm run batch-concurrency`.
 *
 * Each `renderPdf` is independent and returns a promise, so a batch is just `Promise.all`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPdf } from "vellora";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const types = ["invoice", "receipt", "boleto", "notification"];

function loadFixture(type: string): { template: string; data: Record<string, unknown> } {
  const fixtureDir = join(here, "..", "fixtures", type);
  return {
    template: readFileSync(join(fixtureDir, "index.html"), "utf8"),
    data: JSON.parse(readFileSync(join(fixtureDir, "data.json"), "utf8")),
  };
}

const results = await Promise.all(
  types.map(async (type) => {
    const { template, data } = loadFixture(type);
    const pdf = await renderPdf(template, data, {
      metadata: { title: type, creationDate: "2026-06-22T00:00:00.000Z" },
      strict: true,
    });
    const header = new TextDecoder().decode(pdf.subarray(0, 8));
    if (!header.startsWith("%PDF-")) {
      throw new Error(`${type}: expected a %PDF- header, got ${JSON.stringify(header)}`);
    }
    const outPath = join(outDir, `${type}.pdf`);
    writeFileSync(outPath, pdf);
    return { type, bytes: pdf.length, outPath };
  }),
);

for (const { type, bytes, outPath } of results) {
  console.log(`✓ ${type}: ${bytes} bytes → ${outPath}`);
}
console.log(`✓ rendered ${results.length} documents concurrently, all valid %PDF-`);
