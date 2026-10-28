# Serve PDFs over HTTP

Two copy-paste recipes for returning a PDF from an endpoint: plain `node:http` with
`renderPdfToStream`, and Express with `renderPdf`. Both send a useful error when a template can't be
rendered.

## node:http

`renderPdfToStream(html, writable, data?, opts?)` renders the PDF, writes it to the response and
ends it.

```js
import { createServer } from "node:http";
import { renderPdfToStream, VelloraUnsupportedError } from "vellora";

const html = `<!DOCTYPE html>
<html><body style="font-family: sans-serif"><h1>Hello, {{ name }}</h1></body></html>`;

createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'inline; filename="hello.pdf"');
  try {
    await renderPdfToStream(html, res, { name: "world" });
  } catch (err) {
    if (res.headersSent) return res.destroy(); // the response itself failed mid-write
    res.removeHeader("Content-Disposition");
    res.statusCode = err instanceof VelloraUnsupportedError ? 422 : 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(
      err instanceof VelloraUnsupportedError
        ? { feature: err.feature, line: err.line, col: err.col }
        : { error: "PDF rendering failed" },
    ));
  }
}).listen(3000);
```

Nothing is written until the PDF is complete, so if rendering fails you can still change the status
code and headers, as the `catch` block does.

## Express

```js
import express from "express";
import { renderPdf, VelloraUnsupportedError } from "vellora";

const template = `<!DOCTYPE html>
<html><body style="font-family: sans-serif"><h1>Invoice {{ id }}</h1></body></html>`;

const app = express();

app.get("/invoices/:id", async (req, res) => {
  try {
    const pdf = await renderPdf(template, { id: req.params.id });
    res.set({
      "Content-Type": "application/pdf",
      // "inline" opens it in the browser tab; "attachment" downloads it.
      "Content-Disposition": `attachment; filename="invoice-${req.params.id}.pdf"`,
    });
    res.send(Buffer.from(pdf));
  } catch (err) {
    if (err instanceof VelloraUnsupportedError) {
      res.status(422).json({ feature: err.feature, line: err.line, col: err.col });
    } else {
      res.status(500).json({ error: "PDF rendering failed" });
    }
  }
});

app.listen(3000);
```

`renderPdf` returns a `Uint8Array`; `Buffer.from(pdf)` hands it to `res.send` as binary data.

## Which status code?

- **422** when the template uses something vellora can't draw (`VelloraUnsupportedError`). The
  body says what and where. Add `transform: rotate(1deg)` after `font-family: sans-serif` in the
  template above and the body is `{"feature":"css:transform","line":2,"col":45}`. That is a template bug, not a server outage.
- **500** for anything else. Log the error; don't send its message to the client.

## What to expect from "streaming"

vellora builds the whole PDF first and then writes it in one go. You get a simple stream API, not
page-by-page delivery: the first byte arrives when the last page is done.

::: info Roadmap
Writing each page as soon as it is laid out is planned. The `renderPdfToStream` signature will stay
the same when it lands.
:::

## Next step

[Check that your own template will work →](/compatibility)
