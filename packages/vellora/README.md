# vellora

**Turn HTML into PDF inside your Node.js process. No Chromium, no Puppeteer, no browser to babysit.**

[![npm](https://img.shields.io/npm/v/vellora)](https://www.npmjs.com/package/vellora)
[![CI](https://github.com/diomalta/vellora/actions/workflows/ci.yml/badge.svg)](https://github.com/diomalta/vellora/actions/workflows/ci.yml)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)
![node: >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)

You write the document as HTML and CSS, the way you already would for Puppeteer. vellora lays it
out with a native engine compiled into a Node addon and gives you the PDF bytes back. There is
nothing to download at runtime, no browser process to launch or keep warm, and the same input
always produces the same PDF, byte for byte.

![An invoice rendered by vellora 0.3.0: header with invoice number and dates, issuer and recipient blocks, and a table of line items with prices in BRL](https://raw.githubusercontent.com/diomalta/vellora/main/docs/public/assets/npm/invoice-hero.png)

<sub>Page 1 of the invoice fixture in the repository, rendered by `vellora@0.3.0` with no browser installed.</sub>

## Is it a good fit?

vellora is built for **documents you generate from your own templates**: invoices, receipts,
statements, reports, bank slips, notifications, contracts.

| Use vellora when | Keep a browser when |
|---|---|
| You control the HTML template | You render arbitrary pages from the web |
| You want a small, fast container without Chromium | The page needs JavaScript to build its content |
| You run on serverless or tight memory limits | You depend on CSS grid, transforms or animations |
| You need the same PDF bytes for the same input | You need pixel-exact Chrome output everywhere |

When one template does need Chrome, you can route only that template to the optional
[`@vellora/engine-chromium`](https://www.npmjs.com/package/@vellora/engine-chromium) and keep
everything else native.

## Install

```bash
npm install vellora
```

That's it. npm picks the prebuilt binary for your machine (macOS arm64/x64, Linux x64/arm64
with glibc). You do not need Rust, Python, Chromium or system fonts.

Works with ESM and with CommonJS `require("vellora")` on Node 20.19+ / 22.12+.

## Your first PDF

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 20mm; }
      body { font-family: sans-serif; }
      td.amount { text-align: right; }
    </style>
  </head>
  <body>
    <h1>Invoice {{ number }}</h1>
    <p>Issued {{ issued | date("DD/MM/YYYY") }} to {{ customer.name }}</p>
    <table>
      {% for item in items %}
      <tr><td>{{ item.name }}</td><td class="amount">{{ item.price | currency("USD") }}</td></tr>
      {% endfor %}
    </table>
    {% if paid %}<p>Paid, thank you!</p>{% endif %}
  </body>
</html>`;

const pdf = await renderPdf(html, {
  number: "INV-0042",
  issued: "2026-10-28",
  customer: { name: "Ada Lovelace" },
  items: [
    { name: "Consulting", price: 1200 },
    { name: "Support plan", price: 300 },
  ],
  paid: true,
});

writeFileSync("invoice.pdf", pdf); // pdf is a Uint8Array
```

The page size and margins come from your CSS (`@page`). Templating is built in:
`{{ value }}` with dotted paths, `{% for %}`, `{% if %}`, and the `currency`, `number` and
`date` helpers. Every value is HTML-escaped.

## What you get

- **Real document layout.** Tables that span pages with the header repeated on each page, page
  numbers (`counter(page)` / `counter(pages)`), page breaks (`break-before`, `break-inside: avoid`),
  floats, multi-column text, inline SVG drawn as vectors, images and your own fonts.
- **Fast and light.** A warm render of a 3-page invoice takes about 19 ms, and the whole process
  peaks at 118 MB with 8 renders in parallel. The same invoice through Chromium takes about
  636 ms and its browser processes use about 6.8 GB ([numbers below](#performance)).
- **Close to Chrome.** In 8 of 9 test documents, every word lands within 1 mm of where Chrome
  prints it ([how it's measured](https://diomalta.github.io/vellora/guide/fidelity#measured-fidelity)).
- **Same input, same bytes.** No clock, no randomness, no fonts borrowed from the host. Golden-file
  tests and caching just work.
- **Errors instead of silent surprises.** If a template uses something vellora can't render
  faithfully, it fails before writing a PDF and tells you where:

  ```js
  import { renderPdf, VelloraUnsupportedError } from "vellora";

  try {
    await renderPdf(`<div style="transform: rotate(5deg)">x</div>`);
  } catch (err) {
    if (err instanceof VelloraUnsupportedError) {
      console.log(err.feature, err.line, err.col); // "css:transform" 1 25
      console.log(err.hint); // "this CSS feature is outside vellora's document subset; run `vellora fix`"
    }
  }
  ```

  Pass `strict: false` if you'd rather have vellora apply its automatic fixes (from
  [`@vellora/lint`](https://www.npmjs.com/package/@vellora/lint)) and render anyway.

## How close to Chrome?

Each image below shows the same page three times: Chrome's print-to-PDF (the reference), the
previous vellora release, and the current one.

![DANFE (Brazilian electronic invoice), page 1: Chrome for Testing 155 on the left, vellora 0.2.0 in the middle, vellora 0.3.0 on the right](https://raw.githubusercontent.com/diomalta/vellora/main/docs/assets/fidelity/danfe-p1.jpg)

![Share of words within 1 mm of Chrome for each test document, vellora 0.2.0 compared with 0.3.0](https://raw.githubusercontent.com/diomalta/vellora/main/docs/assets/fidelity/within-1mm.svg)

These are local measurements on macOS against Chrome for Testing 155. The full method, every
document and the cases where vellora still loses are in the
[fidelity report](https://diomalta.github.io/vellora/guide/fidelity#measured-fidelity).

## API at a glance

```js
import { renderPdf, renderPdfBatch, renderPdfToStream, renderTemplate } from "vellora";

// One document -> Uint8Array
const pdf = await renderPdf(html, data, options);

// Many documents, at most 4 at a time, results in input order
const pdfs = await renderPdfBatch(
  customers.map((c) => ({ html, data: c })),
  { concurrency: 4 },
);

// Write straight to an HTTP response or file stream
await renderPdfToStream(html, res, data);

// Only the templating step, no PDF
const filledHtml = renderTemplate(html, data);
```

`html` is always the document itself (a string, `Uint8Array` or readable stream), never a file
path. Useful options:

| Option | What it does |
|---|---|
| `images` | `{ "logo.png": bytes }`: images your `<img src>` refers to. vellora never fetches from the network. |
| `baseUrl` | Resolves relative `src` values before looking them up in `images`. |
| `fonts` | `[bytes, ...]`: your own TTF/OTF fonts, used by their family name. |
| `metadata` | `{ title, creationDate }` for the PDF info. Without a date, a fixed one is used so output stays reproducible. |
| `pdfa` | `"PDF/A-2b"` for archival PDFs. |
| `strict` | `true` by default. `false` applies the automatic fixes before rendering. |
| `engine` | `"native"` (default), `"chromium"`, or `"auto"` to choose per template from a reviewed policy file. |

## Performance

[Resource Benchmarks run 40687532121](https://github.com/diomalta/vellora/actions/runs/40687532121),
pinned Linux CI (AMD EPYC 7763, 4 cores, Node 22.23.4), `v0.3.0`, 3-page invoice. Memory is the
peak with 8 renders at once; warm timings are over 50 renders.

| Path | Install size | Extra runtime | Peak memory @8 | Cold start | Warm median / p95 |
|---|---:|---:|---:|---:|---:|
| `vellora` (native) | 39.7 MB | none | 117.6 MB (inside Node) | 47 ms | 19.1 / 23.3 ms |
| `vellora` + Chromium engine | 39.7 MB | 412.3 MB browser | 6,834 MB (browser processes) | 735 ms | 635.5 / 681.0 ms |

Method and raw artifacts: [benchmarks/](https://github.com/diomalta/vellora/tree/main/benchmarks).

## Limits worth knowing

vellora is not a browser. It does not run JavaScript, does not fetch URLs, and covers a documented
subset of HTML and CSS. CSS grid and flexbox are partial (tables are the reliable choice for
layout); `transform`, `filter`, animations, forms and `<canvas>` are rejected. The complete list is
in [COMPATIBILITY.md](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md).

vellora is pre-1.0: the API works and is tested, but a minor version can still bring a breaking
change. Read the [release notes](https://github.com/diomalta/vellora/releases) before upgrading.

## The vellora packages

| Package | What it's for |
|---|---|
| [`vellora`](https://www.npmjs.com/package/vellora) | This package. The API you use. |
| [`@vellora/native`](https://www.npmjs.com/package/@vellora/native) | The native renderer. Installed for you. |
| [`@vellora/lint`](https://www.npmjs.com/package/@vellora/lint) | Check and fix templates in your editor or CI. |
| [`@vellora/cli`](https://www.npmjs.com/package/@vellora/cli) | `vellora render`, `lint`, `fix` and `doctor` from the terminal. |
| [`@vellora/engine-chromium`](https://www.npmjs.com/package/@vellora/engine-chromium) | Optional Chrome rendering for the templates that need it. |

## Learn more

- [Getting started](https://diomalta.github.io/vellora/guide/getting-started) and
  [rendering invoices](https://diomalta.github.io/vellora/guide/invoices)
- [Images](https://diomalta.github.io/vellora/guide/images), [fonts](https://diomalta.github.io/vellora/guide/fonts),
  [streaming](https://diomalta.github.io/vellora/guide/streaming), [PDF/A](https://diomalta.github.io/vellora/guide/pdfa)
- [Switching from Puppeteer or wkhtmltopdf](https://diomalta.github.io/vellora/migrating)
- [HTML to PDF in Node.js without Puppeteer](https://diomalta.github.io/vellora/blog/html-to-pdf-nodejs-without-puppeteer)

Found a template that renders wrong? [Open an issue](https://github.com/diomalta/vellora/issues)
with the HTML. A failing template is the most useful bug report there is.

## License

MIT. See [LICENSE](./LICENSE).
