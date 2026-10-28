# Bulk rendering

With a headless browser, rendering a lot of PDFs means running a pool of browser processes,
limiting how many pages are open, and restarting the ones that grow or hang. With vellora each
render is a promise. You render many documents with ordinary async code and choose how many run at
once.

## A handful of documents

```js
import { renderPdf } from "vellora";

const pdfs = await Promise.all(
  invoices.map((data) => renderPdf(template, data)),
);
```

Each call is independent and resolves to its own `Uint8Array`.

## A large batch

`Promise.all` starts every render at the same time. For hundreds or thousands of documents, use
`renderPdfBatch` to cap how many run at once. Results come back in the same order as the input:

```js
import { renderPdfBatch } from "vellora";

const pdfs = await renderPdfBatch(
  invoices.map((data) => ({ html: template, data })),
  { concurrency: 8 },
);
```

Leave out `concurrency` and vellora runs 4 at a time. The value must be a positive whole number;
anything else throws `VelloraInputError`. Each item can also carry its own `opts` (images, fonts,
metadata).

<StatTiles :items="[{ value: 'about 118 MB', label: 'memory with 8 renders at once', note: 'the whole Node process, 3-page invoice' }]" footnote="vellora 0.3.0, one benchmark run on a 4-core GitHub Actions Linux runner. Peak memory of the whole Node process." />

## Same bytes, however many run together

A document rendered alongside others produces exactly the same PDF bytes as when it is rendered
alone. Renders share no state that could change each other's output.

<details>
<summary>Details</summary>

- **If one document fails**, `renderPdfBatch` rejects with that error. Renders already running are
  allowed to finish, and no new ones are started.
- **The same-bytes guarantee is tested**: a test in `packages/native/test/render.test.ts` renders
  documents (one of them multi-page) concurrently and sequentially and compares the bytes.

</details>

## Next step

[Serve your PDFs over HTTP →](/guide/streaming)
