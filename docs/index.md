---
layout: home
titleTemplate: HTML to PDF for Node.js without Puppeteer or Chromium

hero:
  text: Stop shipping a browser to print an invoice.
  tagline: Turn the HTML templates you already have into PDFs with one function call inside Node.js. No Chromium, no Puppeteer.
  image:
    src: /examples/invoice-guide-hero.png
    alt: The top of an English invoice PDF rendered by vellora 0.3.0 from the Invoices guide example, with the seller name, invoice number, bill-to block and the first line items
  actions:
    - theme: brand
      text: Your first PDF in three steps
      link: /guide/getting-started
    - theme: alt
      text: Switching from Puppeteer?
      link: /migrating
---

```sh
npm install vellora
```

Runs on macOS (Apple Silicon and Intel) and on glibc-based Linux, x64 and arm64: Debian or Ubuntu
images such as `node:22-slim`. No Windows or Alpine/musl builds. Node 20 or newer.
MIT licensed · [npm](https://www.npmjs.com/package/vellora) · [GitHub](https://github.com/diomalta/vellora)

## The same job, minus the browser

::: code-group

```js [vellora]
import { renderPdf } from "vellora";

// HTML from your own templates. Page size comes from CSS: @page { size: A4 }
export async function toPdf(html) {
  return renderPdf(html); // a PDF as a Uint8Array
}
```

```js [Puppeteer]
import puppeteer from "puppeteer";

// One browser, launched at startup and shared by every request
const browser = await puppeteer.launch();

export async function toPdf(html) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await page.close();
  }
}
```

:::

<details>
<summary>And the Dockerfile</summary>

::: code-group

```dockerfile [vellora]
FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci   # vellora's renderer comes prebuilt; nothing else to install
COPY . .
CMD ["node", "server.js"]
```

```dockerfile [Puppeteer]
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

:::

</details>

Nothing to launch, keep alive or close. vellora also has built-in templating, so you can pass data
as a second argument instead of building the HTML yourself. One thing to know when you switch:
because that templating always runs, a literal <code v-pre>{{</code> or `{%` in HTML you already
rendered is read as template syntax.

## Sound familiar?

<PainChips :items="[
  'Chrome won’t start in the Docker image',
  'Missing libnss3 on the server',
  '--no-sandbox in production',
  'Zombie Chrome processes',
  'Fonts change between laptop and server',
]" />

Puppeteer’s own [troubleshooting guide](https://pptr.dev/troubleshooting) says in its Docker
section: “Getting headless Chrome up and running in Docker can be tricky.” With vellora there is no
Chrome to install or start. `npm install` downloads the renderer prebuilt for your platform, and it
runs inside your Node process. We checked that in the `node:22-slim` image: install, render, and a
37 MB `node_modules`.

## Same HTML, side by side

<div style="max-width: 600px; margin: 0 auto;">

<CompareSlider
  before="/compare/oss-sparksuite-invoice-chrome.jpg"
  after="/compare/oss-sparksuite-invoice-vellora.jpg"
  before-label="Chrome"
  after-label="vellora"
  ratio="900 / 780"
  alt="the top of page 1 of the open-source Sparksuite invoice template printed to PDF"
  caption="Drag the line. If you can’t tell where Chrome ends and vellora starts, that’s the point. Same HTML file; left is Chrome, right is vellora 0.3.0."
/>

</div>

On 8 of the 9 documents we test (invoices, receipts, bank slips, a letter, long Portuguese text and
two popular open-source templates), every word lands within 1 mm of where Chrome puts it. On the
ninth, 97.2% of words do. That is our own measurement against Chrome for Testing 155, so treat it as
a guide and check your own templates. [See all nine side by side →](/guide/fidelity)

<StatTiles :items="[
  { value: '19 ms', label: 'per warm render', note: '3-page invoice, warm median' },
  { value: '118 MB', label: 'memory, 8 renders at once', note: 'No Chrome processes: this is the whole Node process' },
  { value: '40 MB', label: 'total install size', note: 'no browser to download; a Chromium 130 binary alone is 412 MB' },
]" footnote="vellora 0.3.0, one benchmark run on a 4-core GitHub Actions Linux runner." />

## What you can print with it

<ExampleGallery :items="[
  { src: '/examples/oss-sparksuite-invoice.png', title: 'Simple invoice', caption: 'The open-source Sparksuite invoice template', href: '/recipes#sparksuite-invoice', alt: 'Page 1 of the Sparksuite HTML invoice template rendered by vellora' },
  { src: '/examples/oss-postmark-receipt.png', title: 'Email receipt', caption: 'The open-source Postmark receipt as published, placeholders included', href: '/recipes#postmark-receipt', alt: 'Page 1 of the Postmark receipt template rendered by vellora' },
  { src: '/examples/invoice-guide-1.png', title: 'Multi-page invoice', caption: 'Two pages, the header row repeated and Page X of Y in the footer', href: '/guide/invoices', alt: 'Page 1 of the English invoice from the Invoices guide rendered by vellora' },
  { src: '/examples/invoice.png', title: 'Any language', caption: 'A three-page Portuguese invoice: accents and long text included', href: '/recipes#invoice', alt: 'Page 1 of a Portuguese invoice rendered by vellora' },
]" />

Each picture is page 1 of a real vellora 0.3.0 PDF. [See the code for each →](/recipes)

## Will it work for your template?

vellora is built for documents whose HTML you control, not for printing arbitrary web pages.

<FitCheck
  :works="[
    'CSS must be in a style tag or style attribute (vellora fetches nothing from the network)',
    'Tables that run over several pages, with the header row repeated',
    'Page X of Y in page headers and footers',
    'Your own fonts and images, passed in as bytes',
    'PDF/A-2b for archiving',
  ]"
  :limits="[
    'Flexbox: works for common layouts; tables are the safer choice',
    'Floats and multi-column text, with documented edge cases',
    'Header and footer text only in the top-center and bottom-center slots',
  ]"
  :unsupported="[
    'JavaScript: the page is never run',
    'CSS grid, transforms, animations and filters',
    'External stylesheets and remote images or fonts',
    'Windows and Alpine Linux',
  ]"
/>

Most things outside that list stop the render with the line and column, instead of handing you a
broken PDF. One exception: `<link>` stylesheets and `@import` are skipped without an error, so put
your CSS in a `<style>` tag.

```text
VelloraUnsupportedError: Unsupported construct "css:transform" at line 1, column 11: this CSS feature is outside vellora's document subset; run `vellora fix`
```

<small>`vellora fix` needs `@vellora/cli` 0.3.2, the next release.</small>

The full list lives on [Will my template work?](/compatibility)

## FAQ

### Does vellora need Chrome or Puppeteer?

No. vellora installs from npm with its renderer already built for your platform, and it runs inside
your Node process. There is no browser to download, launch or keep running. If one template truly needs
Chrome’s output, you can opt that template into an optional Chromium engine; nothing else changes.

### Which platforms does it run on?

macOS on Apple Silicon and Intel, and Linux on x64 and arm64 with glibc, which covers Debian and
Ubuntu images such as `node:22-slim`. There are no Windows or Alpine/musl builds. It needs Node 20
or newer.

### Will my template work?

If it is a document you control, such as an invoice, receipt, statement or letter, there is a good
chance. Put your CSS in a `<style>` tag, pass images and fonts as bytes, and avoid CSS grid,
transforms and animations. Anything unsupported fails with the line and column instead of printing
something wrong.

### How close is the output to Chrome?

Very close on the documents we test: on 8 of 9, every word is within 1 mm of Chrome’s position.
[See all nine →](/guide/fidelity)

### Is it production-ready?

It is young. The current release is 0.3.0, and until 1.0 the API can still change between minor
versions, so pin the version you test. Every change is listed in the
[CHANGELOG](https://github.com/diomalta/vellora/blob/main/CHANGELOG.md), and bugs go to
[GitHub issues](https://github.com/diomalta/vellora/issues). The same input always gives the same
PDF bytes, so snapshot tests are a cheap way to catch surprises when you upgrade. To try it on a
template of your own in a few minutes, start with [your first PDF](/guide/getting-started), then
[compare it with the PDF you make today](/migrating#compare-pdfs).

### Is it free, and is it safe with customer data?

It is free and MIT licensed. Rendering happens inside your own process and vellora makes no network
requests: images and fonts come in as bytes you pass. There is no browser to sandbox or patch, and
`<script>` tags are rejected before anything is rendered.

---

**Ready to try it? [Your first PDF in three steps →](/guide/getting-started)**
