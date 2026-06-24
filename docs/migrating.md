# Switching from wkhtmltopdf / Puppeteer

If you generate PDFs today with `wkhtmltopdf` or Puppeteer (headless Chrome), vellora swaps the rendering engine while keeping your existing HTML and CSS. You bring the same documents and get a PDF in-process, with no external runtime.

## Why switch

- **No headless browser.** Puppeteer downloads and drives Chromium; vellora renders through a native addon in the same process. No browser binary, no subprocess lifecycle, no `--no-sandbox` flags.
- **No separate runtime.** `wkhtmltopdf` is a separate binary (and Qt WebKit); vellora is `npm install vellora` and a prebuilt addon. No system package to install, no PATH wrangling.
- **Deterministic output.** Identical inputs produce byte-identical PDFs, which makes output testable and reproducible.
- **Strict, documented subset.** vellora targets generated documents and validates against a [documented subset](/compatibility) instead of best-effort rendering arbitrary web pages.

## From Puppeteer

A typical Puppeteer flow launches a browser, sets content, and prints to PDF:

```js
// Before — Puppeteer
import puppeteer from "puppeteer";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(html);
const pdf = await page.pdf({ format: "A4" });
await browser.close();
```

With vellora there is no browser to launch or close:

```js
// After — vellora
import { renderPdf } from "vellora";

// Page size comes from CSS in your HTML: @page { size: A4 }
const pdf = await renderPdf(html, data);
```

Note that vellora takes your **data** separately and runs templating (<code v-pre>{{ var }}</code>, `{% for %}`, `{% if %}`, format helpers) — you no longer need to string-build HTML before rendering.

## From wkhtmltopdf

`wkhtmltopdf` shells out to a binary over a file or stdin:

```sh
# Before — wkhtmltopdf
wkhtmltopdf invoice.html invoice.pdf
```

With vellora you pass document **content** (never a file path) to an in-process call:

```js
// After — vellora
import { readFileSync, writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = readFileSync("invoice.html", "utf8");
const pdf = await renderPdf(html, data);
writeFileSync("invoice.pdf", pdf);
```

## What to check when switching

- **Your CSS must fit the subset.** Pages that relied on arbitrary modern CSS or JavaScript execution will be rejected in strict mode. Review [Compatibility](/compatibility) and use the located diagnostics on `VelloraUnsupportedError` to fix markup.
- **No JavaScript runs in the document.** Unlike Chrome, vellora does not execute scripts in your HTML. Compute values in your code and pass them as templating `data`.
- **Paged-media features.** `@page` rules, margins, and page counters are honored; see [Invoices](/guide/invoices) for a paginated example.
