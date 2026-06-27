# PDF/A

vellora supports `PDF/A-2b` output for archive-oriented business documents.

## What PDF/A is

PDF/A is an ISO-standardized subset of PDF for long-term archiving. A PDF/A
file is intended to be self-contained: fonts, color information, metadata, and
the resources needed to reproduce the document should travel with the file.

## Current behavior

Use the `pdfa` render option:

```ts
import { renderPdf } from "vellora";

const pdf = await renderPdf(invoiceHtml, data, {
  pdfa: "PDF/A-2b",
  metadata: {
    title: "Invoice INV-2026-00417",
    creationDate: "2026-06-23T00:00:00.000Z"
  }
});
```

When `pdfa: "PDF/A-2b"` is set, vellora configures the native PDF emitter for
PDF/A-2b. If the emitter reports a conformance failure, `renderPdf` rejects with
`VelloraConformanceError`; vellora does not silently fall back to a regular PDF.

## Supported profile

Only `PDF/A-2b` is supported today. Other profiles are intentionally still
planned:

- `PDF/A-2u` and `PDF/A-2a`
- `PDF/A-3b` for attachments such as source XML
- `PDF/A-4`
- PDF/UA and tagged PDF

## Validation

vellora validates through the configured native emitter. Compliance-sensitive
workflows should also validate final artifacts with the validator required by
their organization, such as a CI-only veraPDF check.
