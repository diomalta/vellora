# Streaming

`renderPdfToStream` renders a document and writes the complete PDF to a writable stream, then ends it. This is the most direct way to serve a generated PDF from an HTTP handler without staging the whole file yourself.

## Write to an HTTP response

```js
import { createServer } from "node:http";
import { renderPdfToStream } from "vellora";

const html = `<!DOCTYPE html>
<html><body><h1>Hello, {{ name }}!</h1></body></html>`;

createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  await renderPdfToStream(html, res, { name: "world" });
}).listen(3000);
```

`renderPdfToStream(html, writable, data?, opts?)` resolves only **after** the complete PDF has been written to `writable`. If the writable emits an `error`, the returned promise rejects and the render is aborted.

## What is buffered

Today the input is fully buffered and the complete PDF is produced via the native render path before any bytes are written. The stream receives the finished document in one write-and-end.

::: info Planned
Page-by-page progressive emission — writing each page as it is laid out — is **planned** and awaits a future native streaming surface. The `renderPdfToStream` signature will not change when it lands.
:::

## When to use which API

- **`renderPdf`** — you want the bytes in memory (a `Uint8Array`) to attach, store, or post-process.
- **`renderPdfToStream`** — you want to pipe directly to a response or file stream and let vellora manage the write-and-end.
