---
title: HTML to PDF in Node.js without Puppeteer or Chromium
description: Your invoice service shouldn't need a web browser. What it costs to keep one, what vellora does instead, how close the output gets to Chrome, and where it stops.
---

# Why we print PDFs without a browser

Puppeteer, Playwright and Chromium are good tools. But think about the last time your invoice PDFs broke. Maybe the Docker image grew because Chrome
needed a list of system libraries. Maybe the first request after a deploy took seconds while a
browser started. Maybe the month-end batch ran out of memory, or left a few Chrome processes running
after it finished.

Sound familiar?

<PainChips :items="['Chrome won’t start in Docker', '--no-sandbox flags', 'Zombie Chrome processes', 'Fonts that change on the server', 'Slow first request after deploy']" />

That is how a document pipeline quietly becomes a browser operations problem. You wanted to turn an
invoice template into a PDF. Now your deploy has to care about browser downloads, sandbox flags,
cold starts, process cleanup and memory under load.

## The idea: a renderer made for documents

A browser is built to run any web page. An invoice is not any web page. It comes from your own code,
it runs no JavaScript, and it needs a short list of things: page size and margins, tables that
continue across pages, page numbers, fonts, images, text you can select and copy. And when something
in the template can't be printed correctly, it should fail loudly instead of shipping a broken PDF.

So we built vellora around that list. It turns HTML into a PDF inside your Node process. There is no
browser to download, launch, sandbox or patch.

Use the smallest renderer that fits the document. For an invoice, that is not a browser.

## The code

Here is vellora next to the honest Puppeteer version, with one shared browser:

::: code-group

```js [vellora]
import { renderPdf } from "vellora";

export async function toPdf(html) {
  // HTML from your own templates, or use the built-in {{ }} templating
  return renderPdf(html);
}
```

```js [Puppeteer]
import puppeteer from "puppeteer";

const browser = await puppeteer.launch(); // one browser, shared

export async function toPdf(html) {
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({ format: "A4", printBackground: true });
  } finally {
    await page.close();
  }
}
```

:::

If you don't have a template engine yet, vellora brings a small one, with loops, conditions and
currency, number and date helpers:

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

## Does it look the same?

This is the first question anyone asks, so here is a real page. It is Postmark's open-source receipt
template. Both sides come from the same HTML: one printed by Chrome, one by vellora. Drag the handle
to compare.

<CompareSlider
  before="/compare/oss-postmark-receipt-chrome.jpg"
  after="/compare/oss-postmark-receipt-vellora.jpg"
  before-label="Chrome"
  after-label="vellora"
  alt="Postmark receipt template, page 1"
  caption="Postmark receipt template, page 1, same HTML on both sides. This is the one document we test that is not perfect yet: nearly all of its words land within 1 mm of Chrome’s. A couple of the misses are a text shadow Chrome draws on the header; vellora does not draw text shadows."
/>

We check 9 documents word by word and publish the misses with the results. We measured it
ourselves on a Mac, so check your own templates too. [How close to Chrome?](/guide/fidelity) has
every document side by side.

<details>
<summary>For engineers: a harder document, before and after</summary>

Same HTML in all three columns. Left: Chrome. Middle: our previous release. Right: vellora 0.3.0.
The document is a DANFE, the printed form of a Brazilian electronic invoice, full of small bordered
boxes that make any drift easy to see.

<!-- fidelity-evidence:hero -->
![DANFE (NF-e invoice), page 1, side by side: Chrome for Testing 155.0.8059.85 (reference), vellora 0.2.0 (published), vellora 0.3.0. Synthetic document data.](/assets/fidelity/danfe-p1.jpg)

<sub>DANFE (NF-e invoice), page 1. Left to right: Chrome for Testing 155.0.8059.85 (reference), vellora 0.2.0 (published), vellora 0.3.0. Median word-position error 17.68 mm → 0.21 mm; words within 1 mm 8.9% → 100.0%; pages 2 → 1 (Chrome: 1). Synthetic data.</sub>
<!-- /fidelity-evidence:hero -->

</details>

## The numbers

These come from one benchmark run on a GitHub Actions Linux runner, rendering the same 3-page
invoice. Shorter is better. The grey bar is vellora's optional Chromium engine, which starts Chrome
for every PDF, so it mostly shows the cost of starting a browser.

<BarChart
  title="Cost of starting Chrome for each PDF"
  unit="ms"
  :bars="[{ label: 'vellora', value: 19.09, highlight: true }, { label: 'vellora’s Chromium engine (Chromium 130, launched per render)', value: 635.5 }]"
  footnote="Median time per PDF over 50 renders, after the first one."
/>

<BarChart
  title="Memory with 8 renders at once"
  unit="MB"
  :bars="[{ label: 'vellora', value: 117.6, highlight: true }, { label: 'vellora’s Chromium engine (Chromium 130, launched per render)', value: 6833.96 }]"
  footnote="vellora: the whole Node process. Chromium: summed across its processes, which counts shared memory more than once. Read it as a difference in kind, not an exact ratio."
/>

There is also what you install. vellora's npm install was 39.72 MB, and that is all it needs. The
Chromium engine's npm install was about the same, but it also needs a 412.28 MB Chromium 130 browser
on the machine.

<details>
<summary>About these numbers</summary>

- GitHub Actions Linux runner (AMD EPYC 7763, 4 cores, Node v22.23.4), run
  [40687532121](https://github.com/diomalta/vellora/actions/runs/40687532121), built from the
  v0.3.0 commit (`c40b3c2`) on 2026-10-28. The package version printed in the results is the
  workspace label `0.1.0-alpha.0`; the code is the v0.3.0 tag. A verbatim copy of the results is
  committed in the repository under `benchmarks/results/run-40687532121/`.
- Workload: the 3-page invoice fixture. Warm timings are over 50 renders. Memory is the peak with
  8 renders running at once.
- Slowest 1 in 20 renders: 23.32 ms for vellora, 681.03 ms for the Chromium engine. First render
  after start: 47.29 ms for vellora, 735.01 ms for the Chromium engine.
- vellora's memory is the whole Node process, including the benchmark harness. The Chromium figure
  is summed across the Chromium processes. They are sampled differently, and the sum overcounts
  memory the processes share.
- The harness checks page counts but does not check the content of each PDF (its content status is
  "inconclusive").
- Puppeteer 23.6.0 and Playwright 1.48.2 were measured in the same run with a shared browser, but
  their PDF came out 1 page where the reference has 3, so the timing isn't a fair comparison and we
  do not quote or chart them.
- Not everything got better. The previous run we quoted (28302742627, before 0.3.0) measured a
  28.93 MB install and a 17.47 ms warm median. The 0.3.0 install is larger; the release notes
  attribute the growth to inline SVG support.

</details>

## Where it stops

vellora is not a browser, and it does not try to be one. It prints the HTML that documents use, and
it says no to the rest. When a template uses something outside that set, the render fails with the
line and column instead of returning a PDF that is almost right:

```txt
VelloraUnsupportedError: Unsupported construct "css:transform" at line 1, column 13: this CSS feature is outside vellora's document subset; run `vellora fix`
```

That is on purpose. A financial document that renders "almost right" can be worse than a document
that fails loudly.

<FitCheck
  :works="['Invoices, receipts, statements and letters built from HTML you control', 'Tables whose header repeats on every page', 'Page size, margins, and Page X of Y headers and footers', 'Images and fonts passed in as bytes', 'The same bundled fonts on every machine', 'Same input, same PDF bytes', 'PDF/A-2b for archiving']"
  :limits="['CSS must live in a <style> tag or style attribute: <link> stylesheets and @import are ignored', 'Literal {{ or {% in your HTML is read as template syntax', 'Flexbox works in part; tables are the reliable layout', 'Prebuilt for macOS and glibc Linux (Debian, Ubuntu, node:22-slim)']"
  :unsupported="['JavaScript in the page', 'CSS grid and transforms (rejected with line and column)', 'Loading anything from the network', 'Windows and Alpine/musl']"
/>

If your template needs a real browser, keep one for that template. vellora's optional Chromium
engine lets you route just those templates to Chrome and keep everything else native.

## Try it

```sh
npm install vellora
```

[Your first PDF in three steps →](/guide/getting-started)
