---
layout: home

hero:
  name: vellora
  text: HTML to PDF for Node.js
  tagline: Render invoices, receipts, statements, boletos, and other generated HTML documents to deterministic PDFs — no Puppeteer on the native path.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: npm package
      link: https://www.npmjs.com/package/vellora
    - theme: alt
      text: API Reference
      link: /reference/
    - theme: alt
      text: View on GitHub
      link: https://github.com/diomalta/vellora

features:
  - title: Native by default
    details: Rendering runs in-process through a napi-rs addon. No Chromium download, Puppeteer dependency, subprocess pool, Python, or Java on the default path.
  - title: Built for documents
    details: Invoices, receipts, statements, boletos, notifications, and reports get paged layout, repeated table headers, selectable text, fonts, images, and PDF/A-2b.
  - title: Strict, documented subset
    details: Generated document HTML is validated before output. Unsupported browser-only markup fails with located diagnostics instead of rendering silently wrong.
  - title: Fidelity when needed
    details: Keep native rendering as the default and route only browser-sensitive templates through optional Chromium or a checked-in fidelity policy.
---

## HTML to PDF for generated Node.js documents

vellora is for teams that already create HTML templates for business documents and want PDF output
without shipping a headless browser in every runtime. Pass document HTML and data to `renderPdf`, keep
the template inside the supported subset, and get a PDF `Uint8Array` back from the same Node.js process.
The package is published as [`vellora` on npm](https://www.npmjs.com/package/vellora), with source code
and examples in [`diomalta/vellora` on GitHub](https://github.com/diomalta/vellora).

```ts
import { renderPdf } from "vellora";

const pdf = await renderPdf(invoiceHtml, invoiceData, {
  metadata: { title: "Invoice INV-2026-00417", creationDate: "2026-06-23T00:00:00.000Z" },
});
```

## What ships now

- Native HTML to PDF rendering through `vellora` and `@vellora/native`.
- Built-in templating with interpolation, loops, conditionals, and currency/date/number helpers.
- Paged document features: `@page`, page counters, multi-page tables, repeated `<thead>`, selectable text.
- Image support through `data:` URLs or caller-supplied `images` bytes with optional `baseUrl`.
- Custom fonts through caller-supplied TTF/OTF bytes, without host font lookup.
- PDF/A-2b output for archive-oriented workflows.
- `renderPdfBatch` for bounded concurrency and `renderPdfToStream` for response/file streams.
- `@vellora/lint` and `vellora lint/fix` for template diagnostics and deterministic codemods.
- `vellora doctor`, pixel-diff reports, and `@vellora/engine-chromium` for templates that require browser fidelity.

## When to choose vellora

Use the native renderer when you control the template and can keep it inside vellora's documented
HTML/CSS subset. This is the common path for invoices, receipts, statements, billing notices, legal
notifications, internal reports, and other generated documents.

Keep Puppeteer, Playwright, or another browser-backed renderer when a template depends on JavaScript
execution, arbitrary website CSS, or exact Chromium print output. For mixed portfolios, use
`engine: "auto"` and a committed `vellora.fidelity.json` policy so each template's renderer choice is
explicit and reviewable.

## Learn the workflow

- Start with [Install & first PDF](/guide/getting-started).
- Build a paginated [invoice](/guide/invoices).
- Add [custom fonts](/guide/fonts) and [images](/guide/images).
- Use [Rendering fidelity](/guide/fidelity) when comparing against Chromium or a legacy Puppeteer PDF.
- Check the generated [Compatibility](/compatibility) reference before adopting new HTML/CSS patterns.
