# Invoices

An invoice is a template plus data. You write the HTML once, pass each customer's data, and get a
PDF back. When the line items run long, they flow onto more pages: the table header repeats at the
top of each page and the footer counts "Page 2 of 2" for you.

<div style="max-width: 600px; margin: 0 auto;">

<CompareSlider before="/examples/invoice-guide-1.png" after="/examples/invoice-guide-2.png" before-label="Page 1" after-label="Page 2" alt="the invoice from the example below. Both pages start with the same Item, Qty, Unit price and Total header; page 2 ends with the bold Total due $7,680.00 row; the footers read Page 1 of 2 and Page 2 of 2" caption="Drag to compare the two pages of the PDF the example below writes, rendered by vellora 0.3.0. The table header repeats and the footer counts the pages." />

</div>

How it works: put the column headings in a `<thead>`, and put the counter in the page footer with
`@page { @bottom-center { content: "Page " counter(page) " of " counter(pages); } }`.
Put page headers in `@top-center` and footers in `@bottom-center`. vellora rejects the other slots,
such as `@top-left`.

## Template + data

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const template = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page {
        size: A4;
        margin: 18mm 18mm 22mm;
        @bottom-center {
          content: "Page " counter(page) " of " counter(pages);
          font-family: sans-serif;
          font-size: 10px;
          color: #666;
        }
      }
      body { font-family: sans-serif; color: #1a1a1a; font-size: 12px; }
      h1 { font-size: 22px; margin: 0 0 4px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      thead th { text-align: left; padding: 6px 4px; }
      thead th { border-bottom: 2px solid #1a1a1a; }
      tbody td { border-bottom: 1px solid #ddd; padding: 6px 4px; }
      .right { text-align: right; }
      .total td { border-top: 2px solid #1a1a1a; font-weight: bold; }
    </style>
  </head>
  <body>
    <h1>{{ seller.name }}</h1>
    <p>
      Invoice {{ invoice.number }} ·
      Issued {{ invoice.date | date("MMMM D, YYYY") }}
    </p>
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

// 60 line items: enough to flow onto a second page. Use your real items here.
const items = Array.from({ length: 60 }, (_, i) => {
  const qty = (i % 5) + 1;
  const unitPrice = 12.5 + i;
  return { name: `Part #${1000 + i}`, qty, unitPrice, total: qty * unitPrice };
});

const data = {
  seller: { name: "Acme Components" },
  customer: { name: "Model Workshop", address: "123 Flower St" },
  invoice: { number: "INV-2026-00417", date: "2026-06-23" },
  items,
  total: items.reduce((sum, i) => sum + i.total, 0),
  note: "Payment due within 15 days. Sample document with fictional data.",
};

const pdf = await renderPdf(template, data, {
  metadata: { title: "Invoice INV-2026-00417" },
});

writeFileSync("invoice.pdf", pdf);
```

The data travels separately from the template, and every value is HTML-escaped on the way in, so a
customer name like `<b>Ada</b>` prints as text instead of becoming markup.

## Templating used here

- **<code v-pre>{{ var }}</code>**: fills in a value; dotted paths such as `invoice.number` work.
- **`{% for item in items %}…{% endfor %}`**: repeats a block for each item in an array.
- **`{% if note %}…{% endif %}`**: shows a block only when the value is set (`{% else %}` works too).
- **`| currency("USD")`**, **`| date("MMMM D, YYYY")`**, **`| number`**: formatting helpers. They
  give the same output on every machine, whatever its locale or time zone.

## How fast is it?

Our benchmark document is a 3-page invoice built the same way: about 19 ms per render once the
process is warm.

Measured on a 4-core GitHub Actions Linux runner with vellora 0.3.0.

<details>
<summary>About this number</summary>

Median warm render of a 3-page invoice on a GitHub Actions Linux runner (AMD EPYC 7763, 4 cores,
Node v22.23.4), run 40687532121, built from the v0.3.0 commit.

</details>

## Next step

[Add your logo →](/guide/images)
