---
layout: home
titleTemplate: HTML to PDF for Node.js without Puppeteer or Chromium

hero:
  name: vellora
  text: HTML to PDF for Node.js, without Puppeteer or Chromium
  tagline: Render invoices, receipts, statements, boletos, and other generated HTML documents to deterministic PDFs in-process. Measured word by word against Chrome's print-to-PDF output.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Measured against Chrome
      link: /guide/fidelity#measured-fidelity
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

## Measured against Chrome

vellora 0.3.0 numbers, each from a reproducible run in this repository:

| What | Native `vellora` | Chromium path | Source |
|---|---:|---:|---|
| Warm render, median / p95 | 19.09 / 23.32 ms | 635.50 / 681.03 ms | [Benchmark run 40687532121](https://github.com/diomalta/vellora/actions/runs/40687532121) |
| Cold start | 47.29 ms | 735.01 ms | same run |
| Memory at 8 concurrent renders | 117.60 MB RSS in Node | 6833.96 MB external browser RSS | same run |
| External runtime to ship | none | 412.28 MB | same run |

The benchmark ran on pinned Linux CI (AMD EPYC 7763, 4 cores, Node v22.23.4) with a 3-page invoice;
the Chromium path is vellora's optional `@vellora/engine-chromium`. Puppeteer and Playwright were
measured too, but the run marks them non-comparable for this fixture, so they are not quoted.

Output is compared against Chrome for Testing 155 print-to-PDF, word by word, on 9 document
fixtures: 8 of 9 have every word within 1 mm of Chrome's position, and 9 of 9 print the same number
of pages (vellora 0.2.0: 0 of 9 and 6 of 9). That fidelity run is an indicative local macOS
measurement. The method, the full table and the losses are in
[Measured fidelity](/guide/fidelity#measured-fidelity); the story of how it got there is in
[Word by word against Chrome](/blog/native-pdf-fidelity-blitz-beta4).

## What ships now

- Native HTML to PDF rendering through `vellora` and `@vellora/native`.
- Built-in templating with interpolation, loops, conditionals, and currency/date/number helpers.
- Paged document features: `@page`, page counters, multi-page tables, repeated `<thead>`, selectable text.
- Layout added in 0.3.0: floats, multi-column, ruby annotations, `break-before` / `break-after`,
  table captions, and inline `<svg>` drawn natively as PDF vectors.
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
- Read [HTML to PDF in Node.js without Puppeteer or Chromium](/blog/html-to-pdf-nodejs-without-puppeteer).
- Read [Word by word against Chrome](/blog/native-pdf-fidelity-blitz-beta4), how 0.3.0 was measured.
- Build a paginated [invoice](/guide/invoices).
- Add [custom fonts](/guide/fonts) and [images](/guide/images).
- Use [Rendering fidelity](/guide/fidelity) when comparing against Chromium or a legacy Puppeteer PDF.
- Check the generated [Compatibility](/compatibility) reference before adopting new HTML/CSS patterns.

## FAQ

### Is vellora a Puppeteer alternative?

For generated document HTML, yes: invoices, receipts, statements, boletos, reports and
notifications whose markup you control. vellora renders them to PDF in-process, with no headless
browser. For arbitrary web pages, JavaScript-driven templates or exact Chromium output, keep a
browser renderer, or route only those templates through vellora's optional Chromium engine.

### Does vellora need Chromium, Puppeteer or Playwright installed?

No. The default renderer is a native Node.js addon (Rust, napi-rs) with prebuilt binaries for macOS
and Linux on x64 and arm64. Chromium is only used if you opt into `engine: "chromium"` or
`engine: "auto"`.

### How close is the output to Chrome's PDF?

On the repository's 9 document fixtures, 8 have every word within 1 mm of Chrome for Testing 155's
print-to-PDF position and all 9 have the same page count. See
[Measured fidelity](/guide/fidelity#measured-fidelity) for the method and the losses.

### What happens with HTML vellora does not support?

In strict mode (the default) it is rejected before any PDF is written, with an error naming the
feature, line, column and a hint. See [Compatibility](/compatibility).
