# Invoices

Invoices are vellora's canonical use case: a table of line items, currency and date formatting, and a total. This guide shows the templating features you'll lean on.

## Template + data

vellora's templating runs before render. You write the document once and bind a plain data object to it.

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const template = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      @page { @bottom-center { content: "Page " counter(page) " of " counter(pages); } }
      body { font-family: sans-serif; color: #1a1a1a; font-size: 12px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      thead th { text-align: left; border-bottom: 2px solid #1a1a1a; padding: 6px 4px; }
      tbody td { border-bottom: 1px solid #ddd; padding: 6px 4px; }
      .right { text-align: right; }
      .total td { border-top: 2px solid #1a1a1a; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>{{ seller.name }}</h1>
    <p>Invoice {{ invoice.number }} · Issued {{ invoice.date | date("DD/MM/YYYY") }}</p>
    <p>Bill to: <strong>{{ customer.name }}</strong><br/>{{ customer.address }}</p>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qty</th>
          <th class="right">Unit price</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        {% for item in items %}
        <tr>
          <td>{{ item.name }}</td>
          <td class="right">{{ item.qty }}</td>
          <td class="right">{{ item.unitPrice | currency("USD") }}</td>
          <td class="right">{{ item.total | currency("USD") }}</td>
        </tr>
        {% endfor %}
        <tr class="total">
          <td colspan="3" class="right">Total due</td>
          <td class="right">{{ total | currency("USD") }}</td>
        </tr>
      </tbody>
    </table>

    {% if note %}<p style="margin-top: 16px;">{{ note }}</p>{% endif %}
  </body>
</html>`;

const items = [
  { name: "Aluminum bracket A20", qty: 40, unitPrice: 32.5, total: 1300 },
  { name: "Hex bolt M8 (box of 100)", qty: 25, unitPrice: 18.9, total: 472.5 },
];

const data = {
  seller: { name: "Acme Components" },
  customer: { name: "Model Workshop", address: "123 Flower St" },
  invoice: { number: "INV-2026-00417", date: "2026-06-23" },
  items,
  total: items.reduce((sum, i) => sum + i.total, 0),
  note: "Payment due within 15 days. Sample document — fictional data.",
};

const pdf = await renderPdf(template, data, {
  metadata: { title: "Invoice INV-2026-00417", creationDate: "2026-06-23T00:00:00.000Z" },
});

writeFileSync("invoice.pdf", pdf);
```

## Templating features used here

- **<code v-pre>{{ var }}</code>** — interpolation with dotted paths (`invoice.number`). All output is HTML-escaped.
- **`{% for item in items %}…{% endfor %}`** — loops over arrays.
- **`{% if note %}…{% endif %}`** — conditionals.
- **`| currency("USD")`**, **`| date("DD/MM/YYYY")`**, **`| number`** — format helpers.

## Pagination

When a line-item list is long enough to span pages, the `<thead>` repeats at the top of each page automatically, and `@page` paged-media rules (margins, `@bottom-center` page counters) are honored. See [Compatibility](/compatibility) for the supported subset.

A complete, runnable version of this example lives in the repository at [`examples/render-invoice.ts`](https://github.com/diomalta/vellora/blob/main/examples/render-invoice.ts).
