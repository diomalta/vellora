/**
 * Render a PDF/A-2b document in-process, no browser and no runtime validator.
 *
 * From the repo root (after `npm install && npm run build`):
 * `tsx examples/pdfa-compliance.ts`
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VelloraConformanceError, renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: sans-serif; font-size: 12px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border-bottom: 1px solid #ddd; padding: 6px 4px; text-align: left; }
      .right { text-align: right; }
    </style>
  </head>
  <body>
    <h1>Archive invoice {{ invoice.number }}</h1>
    <p>Issued to {{ customer.name }} on {{ invoice.date | date("YYYY-MM-DD") }}.</p>
    <table>
      <thead>
        <tr><th>Item</th><th class="right">Total</th></tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr><td>{{ item.name }}</td><td class="right">{{ item.total | currency("USD") }}</td></tr>
        {% endfor %}
      </tbody>
    </table>
  </body>
</html>`;

const data = {
  invoice: { number: "A-2026-001", date: "2026-06-27" },
  customer: { name: "Example Co." },
  items: [
    { name: "Implementation", total: 1200 },
    { name: "Support", total: 300 },
  ],
};

try {
  const pdf = await renderPdf(html, data, {
    pdfa: "PDF/A-2b",
    metadata: {
      title: "Archive invoice A-2026-001",
      creationDate: "2026-06-27T00:00:00.000Z",
    },
  });

  const outDir = join(dirname(fileURLToPath(import.meta.url)), "out");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "pdfa-invoice.pdf");
  writeFileSync(outPath, pdf);
  console.log(`rendered PDF/A-2b candidate ${pdf.length} bytes -> ${outPath}`);
} catch (err) {
  if (err instanceof VelloraConformanceError) {
    console.error(`${err.profile} validation failed:`);
    for (const reason of err.errors) {
      console.error(`- ${reason}`);
    }
    process.exitCode = 1;
  } else {
    throw err;
  }
}
