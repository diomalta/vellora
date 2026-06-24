/**
 * vellora recipe — render straight into a Node Writable stream.
 *
 * From the repo root (after `npm install && npm run build`): `npm run render-to-http-stream`.
 *
 * `renderPdfToStream` writes the complete PDF to any Node `Writable` (a
 * `fs.WriteStream`, or an `http.ServerResponse` in a handler) then ends it.
 *
 * NOTE: the PDF is currently fully buffered in memory and then written in one
 * shot. Page-by-page progressive emission awaits a future native streaming
 * surface; the public signature already takes a stream so callers need not change.
 */
import { createWriteStream, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPdfToStream } from "vellora";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(here, "..", "fixtures", "invoice");

const template = readFileSync(join(fixtureDir, "index.html"), "utf8");
const data = JSON.parse(readFileSync(join(fixtureDir, "data.json"), "utf8"));

const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "stream.pdf");

// In an HTTP handler this would be `res`, with Content-Type: application/pdf set first.
const writable = createWriteStream(outPath);

await renderPdfToStream(template, writable, data, {
  metadata: { title: "Fatura (stream)", creationDate: "2026-06-22T00:00:00.000Z" },
  strict: true,
});

const header = new TextDecoder().decode(readFileSync(outPath).subarray(0, 8));
if (!header.startsWith("%PDF-")) {
  throw new Error(`expected a %PDF- header, got ${JSON.stringify(header)}`);
}
console.log(`✓ streamed PDF → ${outPath}`);
console.log(`  valid PDF header: ${header.startsWith("%PDF-")} (${JSON.stringify(header)})`);
