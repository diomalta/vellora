# Switching from wkhtmltopdf / Puppeteer

If you generate PDFs today with `wkhtmltopdf` or Puppeteer (headless Chrome), vellora lets you keep a document-HTML workflow while changing the renderer. It does **not** promise that every Puppeteer template will render natively unchanged: vellora is a strict document renderer, not a browser clone. Start by checking whether each template fits the supported subset, then compare important output against your current browser-generated PDF.

Current default behavior: vellora renders through its native in-process engine. Browser-fidelity is
available as an explicit opt-in through `engine: "chromium"` with `@vellora/engine-chromium` for a
host-supplied browser. Auto-routing is available through a committed `vellora.fidelity.json` policy.

## Why switch

- **No headless browser by default.** Puppeteer downloads and drives Chromium; vellora's default path renders through a native addon in the same process. The optional Chromium engine is explicit per render or per policy entry.
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

With vellora's current native engine there is no browser to launch or close:

```js
// After — vellora
import { renderPdf } from "vellora";

// Page size comes from CSS in your HTML: @page { size: A4 }
const pdf = await renderPdf(html, data);
```

Note that vellora takes your **data** separately and runs templating (<code v-pre>{{ var }}</code>, `{% for %}`, `{% if %}`, format helpers) — you no longer need to string-build HTML before rendering.

Before deleting your Puppeteer path, render a representative sample through both systems and compare the PDFs. Small differences are expected when a template depends on browser layout behavior outside vellora's documented subset.

If a template must match Chromium print output, route only that template through the optional Chromium engine instead of forcing every document onto the browser path:

```sh
npm install vellora @vellora/engine-chromium
```

```js
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data, {
  engine: "chromium",
});
```

This path uses a Chromium/Chrome binary directly; it does not add Puppeteer to your runtime dependency graph. If Chrome or Chromium is installed in a normal location, vellora can discover it automatically. For CI, Docker, or production hosts, set `VELLORA_CHROMIUM_EXECUTABLE` or pass `chromium.executablePath` so the selected browser is explicit:

```js
const pdf = await renderPdf(html, data, {
  engine: "chromium",
  chromium: {
    executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
    timeoutMs: 30_000,
  },
});
```

Keep the browser-backed engine as a separate install tier:

| Tier | Install | Runtime browser | Use when |
| --- | --- | --- | --- |
| Native default | `npm install vellora` | No | The template fits vellora's subset and passes visual review. |
| Environment Chromium | `npm install vellora @vellora/engine-chromium` | Yes, supplied by the host/container | The template must match Chromium/Puppeteer print output. |

Do not install the browser-backed tier unless you need it. The main package stays optimized for the no-browser path.

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
- **Visual parity is template-specific.** If your acceptance criterion is "matches Chrome/Puppeteer exactly," keep a browser reference in your migration test until the template has been reviewed and accepted. Use `vellora doctor --pixel-diff --reference-pdf old-puppeteer-output.pdf --out artifacts` to compare native output against a local PDF from the old pipeline without adding Puppeteer to vellora. Use `--subject chromium` when the migration question is specifically "does Vellora's Chromium tier match the Puppeteer PDF?"
