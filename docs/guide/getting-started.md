# Your first PDF in three steps

One npm package. You don't install a browser, Rust, Python or any fonts.

## 1. Install

```sh
npm install vellora
```

Prebuilt for macOS (Apple Silicon and Intel) and Linux x64/arm64 with glibc, on Node 20 or newer.
There are no Windows or Alpine/musl builds.

## 2. Write `first-pdf.mjs`

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: sans-serif; color: #1f2937; }
      h1 { font-size: 28px; margin: 0; color: #4f46e5; }
      .muted { color: #6b7280; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      th { background: #eef2ff; text-align: left; }
      th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
      .amount { text-align: right; }
      .total td { font-weight: bold; border-top: 2px solid #1f2937; }
    </style>
  </head>
  <body>
    <h1>Hello, {{ name }}</h1>
    <p class="muted">
      Order {{ order }} · {{ date | date("MMMM D, YYYY") }}
    </p>
    <table>
      <tr><th>Item</th><th class="amount">Price</th></tr>
      {% for item in items %}
      <tr>
        <td>{{ item.name }}</td>
        <td class="amount">{{ item.price | currency("USD") }}</td>
      </tr>
      {% endfor %}
      <tr class="total">
        <td>Total</td>
        <td class="amount">{{ total | currency("USD") }}</td>
      </tr>
    </table>
  </body>
</html>`;

const pdf = await renderPdf(html, {
  name: "Ada",
  order: "#1042",
  date: "2026-10-28",
  items: [
    { name: "Notebook", price: 12 },
    { name: "Fountain pen", price: 48.5 },
  ],
  total: 60.5,
});

writeFileSync("first.pdf", pdf);
```

## 3. Run it and open `first.pdf`

```sh
node first-pdf.mjs
```

![The top of page 1 of first.pdf: the heading Hello, Ada, the line Order #1042 · October 28, 2026, and a table with Notebook $12.00, Fountain pen $48.50 and Total $60.50](/examples/first-pdf.png)

<small>The top of the first page of `first.pdf`, exactly as the script above writes it with vellora 0.3.0.</small>

## What just happened

- **Your HTML and your data went in.** <code v-pre>{{ name }}</code>, the `{% for %}` loop and the
  `date` / `currency` helpers were filled in from the object you passed. Every value is HTML-escaped.
- **vellora drew the PDF inside your Node process.** Nothing was launched or downloaded, and
  `renderPdf` gave you the PDF as a `Uint8Array`.
- **If you use something it can't draw, it stops and tells you where.** No silently wrong PDF.
  For example, `` renderPdf(`<div style="transform: rotate(3deg)">Hi</div>`) `` throws:

```txt
VelloraUnsupportedError: Unsupported construct "css:transform" at line 1, column 13:
this CSS feature is outside vellora's document subset; run `vellora fix`
```

The error also carries `feature`, `line`, `col` and `hint` as properties, so you can log them or
send them back from an API.

::: tip Already have HTML from another template engine?
Pass it as-is. Templating always runs, though, so any literal <code v-pre>{{</code> or
<code v-pre>{%</code> left in your HTML is read as vellora template syntax. An unknown
<code v-pre>{{ value }}</code> renders as empty text, and a stray <code v-pre>{%</code> throws a
`VelloraTemplateError` with its line and column.
:::

<details>
<summary>Troubleshooting</summary>

**"no compatible prebuilt addon for …"** — your platform has no prebuilt binary. The error lists
the supported platforms. On Linux, check that you are on a glibc distribution (Debian, Ubuntu,
`node:22-slim`), not Alpine.

**CommonJS projects.** On Node 20.19+ or 22.12+, `require("vellora")` works. Use named imports:
`const { renderPdf } = require("vellora");`. In a `.js` file without `"type": "module"`, top-level
`await` is not available, so wrap the call in an `async` function.

**Bundlers.** Mark `vellora` and `@vellora/*` as externals so the native addon is loaded from
`node_modules` at runtime.

**TypeScript.** See the [README](https://github.com/diomalta/vellora#readme) for
`moduleResolution` notes.

**HTML is content, not a path.** `renderPdf` takes the document itself (a `string`, `Uint8Array` or
`Readable`). Read the file first if your template lives on disk.

**Strict mode.** By default vellora checks your HTML and CSS and never changes them. Passing
`{ strict: false }` runs the automatic fixers from `@vellora/lint` first.

</details>

## Advanced

**Same input, same PDF bytes.** If you leave out a creation date, vellora records a fixed default
(`2000-01-01`) so repeated renders match byte for byte. To record a real date, pass it as an ISO
string; only the year, month and day are kept:

```js
const pdf = await renderPdf(html, data, {
  metadata: { title: "Order #1042", creationDate: "2026-10-28" },
});
```

**Compiling from source.** You don't need this to use vellora. It is for contributors building
`@vellora/native` from Rust; see the
[repository README](https://github.com/diomalta/vellora#readme).

## Next step

[Now build a real invoice →](/guide/invoices)
