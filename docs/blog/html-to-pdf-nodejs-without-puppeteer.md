---
title: HTML to PDF in Node.js without Puppeteer or Chromium
description: Why Vellora uses a native browserless default for generated document HTML in Node.js, where it fits, and when to keep a browser renderer.
---

# HTML to PDF in Node.js without Puppeteer or Chromium

Puppeteer is good software. Playwright is good software. Chromium is a good browser.

The problem starts when a document pipeline quietly becomes a browser operations problem. You want to
turn an invoice template into a PDF. Now your deploy has to think about browser downloads, system
libraries, launch behavior, container size, cold paths, process cleanup, and memory under concurrency.

That trade-off can be worth it when the input is really a web page. It feels stranger when the input
is controlled document HTML: invoices, receipts, statements, boletos, reports, notices. These
templates usually come from your own code. They do not need JavaScript execution. They need pagination,
fonts, images, page numbers, selectable text, and predictable failure when the template leaves the
supported shape.

That is the reason Vellora exists.

The comparison below comes from the current visual-fidelity artifacts for invoice page 1: Vellora's
native path, Vellora's optional Chromium path, and the generated pixel-diff map.

| Vellora native | Vellora Chromium | Difference map |
| --- | --- | --- |
| ![Vellora native invoice page 1 visual evidence](/assets/visual-evidence/png/vellora/invoice-1.png) | ![Vellora Chromium invoice page 1 visual evidence](/assets/visual-evidence/png/chromium/invoice-1.png) | ![Pixel diff between Vellora native and Vellora Chromium invoice page 1](/assets/visual-evidence/png/diff/invoice-page-1.png) |

Vellora is an HTML-to-PDF renderer for Node.js with a native, in-process default path. The default
package does not install Puppeteer, Playwright, Chromium, wkhtmltopdf, Python, Java, or a sidecar
service. You pass generated document HTML and data to `renderPdf`, and you get PDF bytes back from
the same Node process.

```sh
npm install vellora
```

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!doctype html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: sans-serif; }
    </style>
  </head>
  <body>
    <h1>Invoice {{ invoiceNumber }}</h1>
    <p>Total: {{ total | currency("USD") }}</p>
  </body>
</html>`;

const pdf = await renderPdf(html, {
  invoiceNumber: "INV-2026-00417",
  total: 129,
});

writeFileSync("invoice.pdf", pdf);
```

## Why not just use Puppeteer?

Sometimes you should.

If your template depends on JavaScript, arbitrary website CSS, browser layout quirks, or exact
Chromium print output, a browser renderer is the honest tool. Vellora is not trying to be a browser
clone.

The native path is for a narrower case: generated documents whose markup you control. That narrower
case is still large. Billing, finance, logistics, healthcare, legal operations, and internal tools
all produce document HTML that looks much more like a print template than like a live web app.

For that kind of input, carrying a full browser through every runtime can be unnecessary weight.

## What changes when the renderer is native?

The main change is where the contract lives.

A browser renderer accepts the web platform and tries to print whatever page you give it. Vellora
starts from the opposite side. It defines a documented HTML/CSS subset for generated documents and
rejects unsupported input in strict mode instead of silently producing a wrong PDF.

That can feel less magical. It is also easier to reason about.

- The default path launches no browser process.
- The renderer validates the template against the documented [compatibility table](/compatibility).
- Built-in templating handles interpolation, loops, conditionals, and formatting helpers.
- Document features such as `@page`, page counters, repeated table headers, images, custom fonts, and
  PDF/A-2b are part of the current shipped surface.
- If a template needs browser print fidelity, you can route that template through the optional
  [Chromium engine](/guide/fidelity) instead of moving every document onto the browser path.

The point is not "browser bad, native good." The point is choosing the smallest renderer that matches
the document.

## What the current data says

The repository has a pinned resource benchmark run for the native path and Vellora's optional
Chromium path. This is a snapshot from CI, not a universal promise for every host or template. It is
useful because it keeps the discussion concrete.

Source: [Resource Benchmarks run 28302742627](https://github.com/diomalta/vellora/actions/runs/28302742627)
on pinned Linux CI, Node v22.23.0, 4 cores.

| Path | Fresh install | External runtime | RSS @8 | External RSS @8 | Warm median / p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Native `vellora` | 28.93 MB | N/A | 116.51 MB | N/A | 17.47 / 17.96 ms |
| Vellora Chromium | 28.94 MB | 412.28 MB | N/A | 6425.81 MB | 491.85 / 509.43 ms |

The same evidence bundle includes native-vs-Chromium visual artifacts for representative fixtures:
[visual report](https://github.com/diomalta/vellora/blob/main/docs/assets/visual-evidence/index.html)
and
[manifest](https://github.com/diomalta/vellora/blob/main/docs/assets/visual-evidence/manifest.json).
Puppeteer and Playwright are measured in that benchmark artifact, but this article does not quote
them as comparable because the run marked them non-comparable for the fixture.

## Where Vellora fits

Use the native path when the template is generated by your application and can stay inside Vellora's
document subset:

- invoices with repeated table headers
- receipts and point-of-sale summaries
- statements and account reports
- boletos and payment notices
- legal or operational notifications
- internal reports that need deterministic PDF output

The sweet spot is not arbitrary HTML. It is document HTML.

## Where this breaks

Vellora's native renderer does not execute scripts. It does not fetch remote assets from inside the
document. It does not promise full CSS grid/flex/browser parity. It is strict by default because a
financial document that renders "almost right" can be worse than a document that fails loudly.

If your acceptance criterion is "matches my current Puppeteer PDF exactly," keep that browser output
as a reference and compare it before switching. The [migration guide](/migrating) walks through that
process, including how to keep Chromium available only for templates that actually need it.

## How to try it

Start with the [getting started guide](/guide/getting-started). It renders a first PDF from Node.js
and explains what `renderPdf` expects.

Then check the [compatibility reference](/compatibility) before moving a real template. If your
template needs images or fonts, the [images](/guide/images) and [fonts](/guide/fonts) guides show the
explicit byte-based APIs. If you are migrating from Puppeteer or wkhtmltopdf, read
[Switching from wkhtmltopdf / Puppeteer](/migrating) before deleting your old path.

The package is on [npm](https://www.npmjs.com/package/vellora), and the source is on
[GitHub](https://github.com/diomalta/vellora). If you have a document template that should fit this
model and does not, open an issue with the smallest representative case. That is the most useful
feedback this project can get.
