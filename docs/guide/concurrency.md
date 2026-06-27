# Concurrency

vellora renders **in-process** through a native addon — there is no subprocess and no headless browser to pool. `renderPdf` returns a `Promise<Uint8Array>`, so rendering many documents is ordinary async JavaScript.

## Render many documents

Render concurrently with `Promise.all`:

```js
import { renderPdf } from "vellora";

const invoices = [/* ...data objects... */];

const pdfs = await Promise.all(
  invoices.map((data) => renderPdf(template, data)),
);
```

Each call is independent and produces its own `Uint8Array`.

## Bounding concurrency

Unbounded `Promise.all` over a very large batch will start every render at once. For large batches, use `renderPdfBatch` to cap the number of active renders while preserving the input order:

```js
import { renderPdfBatch } from "vellora";

const pdfs = await renderPdfBatch(
  invoices.map((data) => ({ html: template, data })),
  { concurrency: 8 },
);
```

If `concurrency` is omitted, vellora uses `4`. The value must be a positive safe integer.

## Determinism under concurrency

Rendering is deterministic: the same `(html, data, opts)` always yields byte-identical output regardless of how many renders run alongside it. Concurrent calls do not share mutable state that would change each other's results.
