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

Unbounded `Promise.all` over a very large batch will start every render at once. For large batches, cap concurrency — for example, process in fixed-size chunks:

```js
async function renderInChunks(template, batch, size = 8) {
  const out = [];
  for (let i = 0; i < batch.length; i += size) {
    const chunk = batch.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map((d) => renderPdf(template, d)))));
  }
  return out;
}
```

## Determinism under concurrency

Rendering is deterministic: the same `(html, data, opts)` always yields byte-identical output regardless of how many renders run alongside it. Concurrent calls do not share mutable state that would change each other's results.
