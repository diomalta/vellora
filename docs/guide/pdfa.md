# PDF/A archiving

PDF/A-2b is the ISO profile for long-term archiving that many document-retention policies ask for.
With vellora it is one option.

## Turn it on

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <body style="font-family: sans-serif">
    <h1>Invoice {{ number }}</h1>
  </body>
</html>`;

const pdf = await renderPdf(html, { number: "INV-2026-00417" }, {
  pdfa: "PDF/A-2b",
  metadata: { title: "Invoice INV-2026-00417", creationDate: "2026-06-23" },
});

writeFileSync("archive.pdf", pdf);
```

A PDF/A file has to carry everything needed to display it, fonts and metadata included, so it
doesn't depend on the machine that opens it later. Give it a `title` so archives can index it.

## You get a valid file or an error

If vellora can't produce a valid PDF/A-2b file for your document, `renderPdf` rejects with
`VelloraConformanceError`. It never quietly hands you a regular PDF instead.

If your process requires a specific validator, run it on the output in CI as well (veraPDF is a
common choice).

## What it isn't

Only `PDF/A-2b` is supported. Asking for another profile throws `VelloraInputError`.

- Not PDF/A-2u, PDF/A-2a, PDF/A-3b or PDF/A-4.
- Not PDF/UA or tagged (accessible) PDF.
- Not for Factur-X / ZUGFeRD e-invoices: those are
  [built on PDF/A-3](https://fnfe-mpe.org/factur-x/factur-x_en/), which vellora doesn't produce.

The other PDF/A profiles and PDF/UA are planned; none of them is available today.

## Next step

[Render many PDFs at once →](/guide/concurrency)
