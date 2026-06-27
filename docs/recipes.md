# Recipes

Short, task-focused examples. The canonical runnable versions live in the repository's [`examples/`](https://github.com/diomalta/vellora/tree/main/examples) directory and the HTML input [`fixtures/`](https://github.com/diomalta/vellora/tree/main/fixtures).

## Runnable examples

- **[Render an invoice](https://github.com/diomalta/vellora/blob/main/examples/render-invoice.ts)** — `examples/render-invoice.ts`: templating with loops, currency/date helpers, pagination with a repeating `<thead>`, and strict rejection of out-of-subset input. Walked through in the [Invoices guide](/guide/invoices).
- **[Render a receipt](https://github.com/diomalta/vellora/blob/main/examples/render-receipt.ts)** — compact point-of-sale style output with deterministic metadata.
- **[Render a boleto](https://github.com/diomalta/vellora/blob/main/examples/render-boleto.ts)** — structured banking document layout and barcode-like text fixture coverage.
- **[Render a notification](https://github.com/diomalta/vellora/blob/main/examples/render-notification.ts)** — legal-notice style document with long-form text.
- **[Stream to an HTTP response](https://github.com/diomalta/vellora/blob/main/examples/render-to-http-stream.ts)** — use `renderPdfToStream` with a writable response.
- **[Bound concurrency](https://github.com/diomalta/vellora/blob/main/examples/batch-concurrency.ts)** — render many documents while capping active native work.
- **[Custom fonts](https://github.com/diomalta/vellora/blob/main/examples/custom-fonts.ts)** — pass TTF/OTF bytes through `fonts`.
- **[PDF/A output](https://github.com/diomalta/vellora/blob/main/examples/pdfa-compliance.ts)** — request `PDF/A-2b` and handle conformance failures.

## HTML Fixtures

The repository ships representative HTML inputs at `fixtures/<scenario>/{index.html,data.json}`.
These scenarios exercise layout capabilities; they are not domain entities or special render modes:

- [`fixtures/invoice/`](https://github.com/diomalta/vellora/tree/main/fixtures/invoice)
- [`fixtures/receipt/`](https://github.com/diomalta/vellora/tree/main/fixtures/receipt)
- [`fixtures/boleto/`](https://github.com/diomalta/vellora/tree/main/fixtures/boleto)
- [`fixtures/notification/`](https://github.com/diomalta/vellora/tree/main/fixtures/notification)
- [`fixtures/invoice-broken/`](https://github.com/diomalta/vellora/tree/main/fixtures/invoice-broken) — deliberately out-of-subset, to demonstrate strict rejection and fixes.

## Guides

For step-by-step how-tos, see [Streaming](/guide/streaming), [Images](/guide/images),
[Fonts](/guide/fonts), [PDF/A](/guide/pdfa), [Rendering fidelity](/guide/fidelity), and
[Concurrency](/guide/concurrency).
