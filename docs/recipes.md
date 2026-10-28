---
title: Examples
description: Invoices, receipts, a bank payment slip and a letter rendered to PDF by vellora, each with its HTML, data and the code that renders it.
---

# Examples

Real document templates, rendered by vellora. Each picture is page 1 of a PDF made by the published
`vellora@0.3.0` package. The HTML and data for every one are in the repository's
[`fixtures/`](https://github.com/diomalta/vellora/tree/main/fixtures) folder.

<ExampleGallery :items="[
  { src: '/examples/oss-sparksuite-invoice.png', title: 'Simple invoice', caption: 'The open-source Sparksuite template, one page', href: '/recipes#sparksuite-invoice', alt: 'Page 1 of the Sparksuite HTML invoice template rendered by vellora' },
  { src: '/examples/invoice.png', title: 'Multi-page invoice', caption: 'Three pages, header row repeated on each (Portuguese)', href: '/recipes#invoice', alt: 'Page 1 of a Portuguese invoice rendered by vellora' },
  { src: '/examples/receipt.png', title: 'Receipt', caption: 'Two-page point-of-sale receipt with a logo (Portuguese)', href: '/recipes#receipt', alt: 'Page 1 of a Portuguese receipt rendered by vellora' },
  { src: '/examples/oss-postmark-receipt.png', title: 'Email receipt', caption: 'The open-source Postmark receipt as published, placeholders included, printed on A4', href: '/recipes#postmark-receipt', alt: 'Page 1 of the Postmark receipt template rendered by vellora' },
  { src: '/examples/boleto.png', title: 'Boleto', caption: 'Brazilian bank payment slip, one page', href: '/recipes#boleto', alt: 'A Brazilian boleto bank payment slip rendered by vellora' },
  { src: '/examples/notification.png', title: 'Letter', caption: 'Formal notification letter, one page (Portuguese)', href: '/recipes#letter', alt: 'A Portuguese notification letter rendered by vellora' },
]" />

## A full recipe: the receipt {#receipt}

Every example follows the same pattern: read the template and its data, pass any images as bytes,
and call `renderPdf`. To run it, copy the repository's
[`fixtures/`](https://github.com/diomalta/vellora/tree/main/fixtures) folder into a project that
has `vellora` installed, and run the script from that project's root:

```js
import { readFileSync, writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const dir = "fixtures/receipt";
const html = readFileSync(`${dir}/index.html`, "utf8");
const data = JSON.parse(readFileSync(`${dir}/data.json`, "utf8"));

const pdf = await renderPdf(html, data, {
  images: { "./logo.png": readFileSync(`${dir}/logo.png`) },
  metadata: { title: "Receipt" },
});

writeFileSync("receipt.pdf", pdf);
```

The template prints <code v-pre>{{ merchant.name }}</code>, loops over the items with
`{% for row in items %}`, and its `@page` rule adds "Página 1 de 2" ("Page 1 of 2") at the bottom
of each page. The `images` key is the `src` the template uses for the logo.

The other examples differ only in the folder and the images they pass.

## Simple invoice {#sparksuite-invoice}

[sparksuite/simple-html-invoice-template](https://github.com/sparksuite/simple-html-invoice-template),
an open-source HTML invoice template. Its sample text moved into `data.json`; the brand logo is replaced by
a neutral placeholder.

```js
const dir = "fixtures/oss-sparksuite-invoice";
const pdf = await renderPdf(html, data, {
  images: { "assets/logo.png": readFileSync(`${dir}/assets/logo.png`) },
});
```

## Email receipt {#postmark-receipt}

The receipt from [ActiveCampaign/postmark-templates](https://github.com/ActiveCampaign/postmark-templates),
an email template printed to A4. Its Google Fonts `@import` is removed, because vellora loads
nothing from the network; the text falls back to the bundled sans-serif font.

```js
const dir = "fixtures/oss-postmark-receipt";
const pdf = await renderPdf(html, data);
```

<div style="max-width: 600px; margin: 0 auto;">

<CompareSlider
  before="/compare/oss-postmark-receipt-chrome.jpg"
  after="/compare/oss-postmark-receipt-vellora.jpg"
  before-label="Chrome"
  after-label="vellora"
  alt="page 1 of the Postmark receipt template printed to PDF"
  caption="Drag to compare. Left: Chrome’s print-to-PDF. Right: vellora 0.3.0. Same HTML file, with the template’s own [Product Name] placeholders."
/>

</div>

## Multi-page invoice {#invoice}

A Portuguese invoice with enough line items for three pages. The table's header row repeats at the
top of each page, and the footer counts the pages. The [Invoices guide](/guide/invoices) walks
through it.

```js
const dir = "fixtures/invoice";
const pdf = await renderPdf(html, data, {
  images: { "assets/logo.png": readFileSync(`${dir}/assets/logo.png`) },
  metadata: { title: "Invoice" },
});
```

From a clone of the repository, after `npm install && npm run build`, `npm run example` renders it.

## Boleto {#boleto}

A boleto is a Brazilian bank payment slip: a fixed grid of boxes, the typeable payment line, and
the barcode digits printed as text.

```js
const dir = "fixtures/boleto";
const pdf = await renderPdf(html, data, {
  images: { "./assets/banco-fake-logo.png": readFileSync(`${dir}/assets/banco-fake-logo.png`) },
  metadata: { title: "Boleto" },
});
```

## Letter {#letter}

A formal notification letter in Portuguese: long-form text, no images.

```js
const dir = "fixtures/notification";
const pdf = await renderPdf(html, data, { metadata: { title: "Notification" } });
```

From a clone of the repository, after the same build, `npm run render-notification` renders it.

## More from the repository

These scripts live in [`examples/`](https://github.com/diomalta/vellora/tree/main/examples):

- [Render many documents with a concurrency cap](https://github.com/diomalta/vellora/blob/main/examples/batch-concurrency.ts),
  `npm run batch-concurrency`. Guide: [Bulk rendering](/guide/concurrency).
- [Stream a PDF to an HTTP response](https://github.com/diomalta/vellora/blob/main/examples/render-to-http-stream.ts)
  with `renderPdfToStream`. Guide: [Serve PDFs over HTTP](/guide/streaming).
- [Custom fonts](https://github.com/diomalta/vellora/blob/main/examples/custom-fonts.ts): pass TTF/OTF
  bytes in `fonts`. Guide: [Fonts](/guide/fonts).
- [PDF/A output](https://github.com/diomalta/vellora/blob/main/examples/pdfa-compliance.ts): request
  `PDF/A-2b` and handle conformance errors. Guide: [PDF/A archiving](/guide/pdfa).

[`fixtures/invoice-broken/`](https://github.com/diomalta/vellora/tree/main/fixtures/invoice-broken)
is a template with mistakes on purpose, to show the errors vellora gives.

## Licences

The Simple invoice is adapted from sparksuite/simple-html-invoice-template, MIT licence,
Copyright (c) 2021 Sparksuite. The Email receipt is adapted from ActiveCampaign/postmark-templates,
MIT licence, Copyright (c) 2015 Wildbit. Each folder has the licence text and a `NOTICE.md` listing
every change.

**Next:** [Your first PDF in three steps →](/guide/getting-started)
