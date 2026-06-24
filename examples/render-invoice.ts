/**
 * vellora example — render an invoice to PDF, in-process, no browser.
 *
 * From the repo root (after `npm install && npm run build`): `npm run example`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { VelloraUnsupportedError, renderPdf } from "vellora";

// Built-in templating: {{ var }} interpolation (dotted paths), {% for %} loops,
// {% if %}, and format helpers (currency / date / number). All values are HTML-escaped.
const template = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      @page { @bottom-center { content: "Página " counter(page) " de " counter(pages); } }
      body { font-family: sans-serif; color: #1a1a1a; font-size: 12px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      .muted { color: #666; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      thead th { text-align: left; border-bottom: 2px solid #1a1a1a; padding: 6px 4px; }
      tbody td { border-bottom: 1px solid #ddd; padding: 6px 4px; }
      .right { text-align: right; }
      .total td { border-top: 2px solid #1a1a1a; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>{{ seller.name }}</h1>
    <p class="muted">Fatura {{ invoice.number }} · Emitida em {{ invoice.date | date("DD/MM/YYYY") }}</p>
    <p>Cobrar de: <strong>{{ customer.name }}</strong><br/>{{ customer.address }}</p>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qtd.</th>
          <th class="right">Preço unit.</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>{{ item.name }}</td>
          <td class="right">{{ item.qty }}</td>
          <td class="right">{{ item.unitPrice | currency("BRL") }}</td>
          <td class="right">{{ item.total | currency("BRL") }}</td>
        </tr>
        {% endfor %}
        <tr class="total">
          <td colspan="3" class="right">Total a pagar</td>
          <td class="right">{{ total | currency("BRL") }}</td>
        </tr>
      </tbody>
    </table>

    {% if note %}<p class="muted" style="margin-top: 16px;">{{ note }}</p>{% endif %}
  </body>
</html>`;

// Enough line items that a longer list paginates across pages, repeating the <thead>.
const items = [
  { name: "Suporte de fixação em alumínio A20", qty: 40, unitPrice: 32.5, total: 1300 },
  { name: "Parafuso sextavado M8 (caixa 100)", qty: 25, unitPrice: 18.9, total: 472.5 },
  { name: "Perfil estrutural 40x40 — barra 3m", qty: 60, unitPrice: 47.2, total: 2832 },
  { name: "Motor de passo NEMA 23", qty: 12, unitPrice: 156.0, total: 1872 },
  { name: "Fonte chaveada 24V 10A", qty: 8, unitPrice: 142.5, total: 1140 },
];
const data = {
  seller: { name: "Acme Componentes LTDA" },
  customer: { name: "Oficina Modelo ME", address: "Rua das Flores, 123 — São Paulo/SP" },
  invoice: { number: "INV-2026-00417", date: "2026-06-23" },
  items,
  total: items.reduce((sum, i) => sum + i.total, 0),
  note: "Pagamento em até 15 dias. Documento de exemplo — dados fictícios.",
};

const pdf = await renderPdf(template, data, {
  metadata: { title: "Fatura INV-2026-00417", creationDate: "2026-06-23T00:00:00.000Z" },
  strict: true, // default: validate the subset, never mutate the input
});

const outDir = join(dirname(fileURLToPath(import.meta.url)), "out");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "invoice.pdf");
writeFileSync(outPath, pdf);

const header = new TextDecoder().decode(pdf.subarray(0, 8));
console.log(`✓ rendered ${pdf.length} bytes → ${outPath}`);
console.log(`  valid PDF header: ${header.startsWith("%PDF-")} (${JSON.stringify(header)})`);

// Strict-by-default: out-of-subset input fails clearly instead of rendering wrong.
try {
  await renderPdf("<div><script>alert(1)</script>oops</div>");
  console.log("  (unexpected: out-of-subset input did not throw)");
} catch (err) {
  if (err instanceof VelloraUnsupportedError) {
    console.log(`✓ strict rejected out-of-subset input → feature="${err.feature}" (${err.hint})`);
  } else {
    throw err;
  }
}
