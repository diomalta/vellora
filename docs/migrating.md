---
title: Switching from Puppeteer or wkhtmltopdf
description: Move HTML-to-PDF rendering in Node.js off headless Chrome or wkhtmltopdf. A before/after, a step-by-step migration, and a script to check your own templates.
---

# Switching from Puppeteer or wkhtmltopdf

You print invoices, receipts or reports from HTML, and most of the work goes into keeping a browser
running on a server.

<PainChips :items="[
  'Chrome won’t start in the Docker image',
  'Missing system libraries on the server',
  '--no-sandbox in production',
  'Zombie Chrome processes',
  'A browser pool to size and restart',
  'Fonts change between laptop and server',
]" />

vellora renders the PDF inside your Node process. There is no browser to install, launch, pool or
close: `npm install vellora` downloads the renderer prebuilt for your platform, and
`renderPdf(html)` returns the PDF bytes.

## Before and after

The Puppeteer side is a common production setup: one browser shared by every request, a fresh page
per PDF. The vellora side is the whole thing. The last two tabs show the Dockerfile for each.

::: code-group

```js [Before: Puppeteer]
import puppeteer from "puppeteer";

// Launched once and shared, because launching per request is slow.
const browser = await puppeteer.launch();

export async function toPdf(html) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
  } finally {
    await page.close();
  }
}

// ...and somewhere: restart the browser if it crashes, close it on shutdown.
```

```js [After: vellora]
import { renderPdf } from "vellora";

// Page size and margins live in your HTML:
// @page { size: A4; margin: 20mm 15mm; }
export async function toPdf(html, data) {
  return renderPdf(html, data);
}
```

```dockerfile [Dockerfile: Puppeteer]
FROM node:22-slim
# The system libraries and fonts Chrome needs
RUN apt-get update && apt-get install -y \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libasound2 libpango-1.0-0 libcairo2 fonts-liberation \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci   # also downloads a Chrome build
COPY . .
# ...plus --no-sandbox if the container runs as root
CMD ["node", "server.js"]
```

```dockerfile [Dockerfile: vellora]
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci   # vellora's renderer comes prebuilt; nothing else to install
COPY . .
CMD ["node", "server.js"]
```

:::

`renderPdf` resolves to a `Uint8Array`. Write it to disk, upload it, or send it as the response body.

## What you get

<StatTiles :items="[
  { value: '19 ms', label: 'per warm render', note: '3-page invoice, warm median' },
  { value: '118 MB', label: 'memory, 8 renders at once', note: 'the whole Node process' },
  { value: '40 MB', label: 'total install size', note: 'no browser to download' },
]" footnote="vellora 0.3.0, one benchmark run on a 4-core GitHub Actions Linux runner." />

<div style="max-width: 600px; margin: 0 auto;">

<CompareSlider
  before="/compare/oss-sparksuite-invoice-chrome.jpg"
  after="/compare/oss-sparksuite-invoice-vellora.jpg"
  before-label="Chrome"
  after-label="vellora"
  ratio="900 / 780"
  alt="the top of page 1 of the open-source Sparksuite invoice template printed to PDF"
  caption="Drag the line. Left is Chrome, right is vellora 0.3.0, from the same HTML file."
/>

</div>

On 8 of the 9 documents we test, every word lands within 1 mm of where Chrome puts it. We measured
that ourselves on a Mac, so check your own templates with step 4 below.
[How close to Chrome? →](/guide/fidelity)

## Step by step

### 1. Install

```sh
npm install vellora
```

Prebuilt binaries cover macOS (Apple silicon and Intel) and Linux x64/arm64 with glibc. We checked
the install and a render in the `node:22-slim` Docker image. There are no Windows or Alpine/musl
builds.

### 2. Bring your HTML

Pass the HTML string as you build it today. Put CSS in a `<style>` tag, and watch for literal
<code v-pre>{{</code> or `{%` in HTML you already rendered.

<details>
<summary>Why those two</summary>

**Templating always runs.** vellora has built-in templating (<code v-pre>{{ name }}</code>,
`{% for %}`, `{% if %}`), and it runs on every render, with or without data. A literal
<code v-pre>{{ x }}</code> left in your HTML becomes empty text, and a stray `{%` throws a
`VelloraTemplateError` with the line and column. There is no escape tag today. You can also move
your data into vellora's templating and stop building the HTML string yourself.

**External stylesheets are not loaded.** vellora loads nothing from the network. A
`<link rel="stylesheet">` or `@import url(...)` is skipped without an error, so the PDF comes out
unstyled. Put the CSS in a `<style>` tag or a `style=""` attribute; for Tailwind or Bootstrap,
inline the built CSS file. Images and fonts are passed in as bytes; see
[Logos & images](/guide/images) and [Fonts](/guide/fonts).

</details>

### 3. Check each template {#check-a-template}

Render each template once with its real data. vellora stops at the first problem and tells you
the line and column. Save this as `check-template.mjs`:

```js
// usage: node check-template.mjs template.html [data.json]
import { readFileSync } from "node:fs";
import { renderPdf } from "vellora";

const [htmlFile, dataFile] = process.argv.slice(2);
const html = readFileSync(htmlFile, "utf8");
const data = dataFile ? JSON.parse(readFileSync(dataFile, "utf8")) : {};

const pdf = await renderPdf(html, data); // throws with line and column
console.log(`OK: ${pdf.length} bytes`);
```

On a template that uses an animation, it stops with:

```txt
VelloraUnsupportedError: Unsupported construct "css:keyframes" at line 16, column 41: this CSS feature is outside vellora's document subset; run `vellora fix`
  feature: 'css:keyframes',
  line: 16,
  col: 41,
```

Fix it, run it again, and repeat until it prints `OK`. [Will my template work?](/compatibility)
lists what is supported and what to do for each kind of error. If your templates use `<img>` tags,
pass the image bytes with the `images` option, as in [Logos & images](/guide/images), or the check
stops at the first image.

### 4. Compare against your current PDFs {#compare-pdfs}

You can do this today with the script from step 3: change its last line to
`writeFileSync("new.pdf", pdf)` (import `writeFileSync` from `node:fs`), then open `new.pdf` next
to the PDF your Puppeteer or wkhtmltopdf setup makes now and flip between them.

To compare pixel by pixel, `vellora doctor` from
[`@vellora/cli`](https://www.npmjs.com/package/@vellora/cli) renders your template and marks every
difference from a PDF you already have:

```sh
vellora doctor invoice.html --pixel-diff --reference-pdf old-puppeteer-output.pdf --out artifacts
```

::: tip
This needs `@vellora/cli` 0.3.2 or newer and poppler's `pdftoppm` (`apt install poppler-utils` or
`brew install poppler`).
:::

### 5. Switch, one template at a time

Replace the Puppeteer call for each template that passes. If a template truly needs a browser (it
runs JavaScript, or its layout depends on CSS grid), you don't have to rewrite it now: route only
that one to Chrome with the [optional Chromium engine](/guide/chromium-engine) and keep the rest
native.

## Translating Puppeteer options

| Puppeteer | vellora |
| --- | --- |
| `page.pdf({ format: "A4" })` | `@page { size: A4; }` in your CSS |
| `page.pdf({ margin: { top: "20mm", … } })` | `@page { margin: 20mm 15mm; }` |
| `displayHeaderFooter`, `headerTemplate`, `footerTemplate` | `@page { @top-center { … } @bottom-center { … } }` with `counter(page)` and `counter(pages)` |
| `page.setContent(html)` | `renderPdf(html, data)` |
| `waitForSelector`, `page.evaluate`, scripts in the page | Compute the values in Node and pass them as `data`. Scripts never run. |
| `page.goto(url)` | Fetch the HTML yourself and pass the string. vellora never fetches URLs. |

Headers and footers only go in the top-center and bottom-center slots. Here is a "Page 1 of 3"
footer with a company name on top:

```html
<style>
  @page {
    size: A4;
    margin: 20mm 15mm;
    @top-center { content: "Acme Inc."; }
    @bottom-center { content: "Page " counter(page) " of " counter(pages); }
  }
</style>
```

## Coming from wkhtmltopdf

wkhtmltopdf runs as a separate program, usually through a shell command on a file:

```sh
wkhtmltopdf invoice.html invoice.pdf
```

With vellora, you read the file and pass its content. Nothing to install on the host, no binary on
the `PATH`:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = readFileSync("invoice.html", "utf8");
writeFileSync("invoice.pdf", await renderPdf(html));
```

wkhtmltopdf's own [status page](https://wkhtmltopdf.org/status.html) says "Do not use wkhtmltopdf
with any untrusted HTML". vellora doesn't run scripts and doesn't fetch anything over the network.

## When to keep Chrome

<FitCheck
  :works="[
    'Invoices, receipts, statements and letters you write the HTML for',
    'Tables over several pages with the header row repeated',
    'Page X of Y in headers and footers',
    'Your own fonts and images, passed as bytes',
  ]"
  :limits="[
    'Flexbox: common layouts work; tables are the safer choice',
    'Headers and footers only in the top-center and bottom-center slots',
  ]"
  :unsupported="[
    'Templates that need JavaScript to run',
    'CSS grid, transforms and animations',
    'Printing live web pages by URL',
    'Windows and Alpine Linux',
  ]"
/>

For anything in the last column, use the [optional Chromium engine](/guide/chromium-engine) for that
template only.

**Next:** [Your first PDF in three steps →](/guide/getting-started)
