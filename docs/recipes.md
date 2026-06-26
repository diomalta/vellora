# Recipes

Short, task-focused examples. The canonical runnable versions live in the repository's [`examples/`](https://github.com/diomalta/vellora/tree/main/examples) directory and the HTML input [`fixtures/`](https://github.com/diomalta/vellora/tree/main/fixtures).

## Runnable examples

- **[Render an invoice](https://github.com/diomalta/vellora/blob/main/examples/render-invoice.ts)** — `examples/render-invoice.ts`: templating with loops, currency/date helpers, pagination with a repeating `<thead>`, and strict rejection of out-of-subset input. Walked through in the [Invoices guide](/guide/invoices).

## HTML Fixtures

The repository ships representative HTML inputs at `fixtures/<scenario>/{index.html,data.json}`.
These scenarios exercise layout capabilities; they are not domain entities or special render modes:

- [`fixtures/invoice/`](https://github.com/diomalta/vellora/tree/main/fixtures/invoice)
- [`fixtures/receipt/`](https://github.com/diomalta/vellora/tree/main/fixtures/receipt)
- [`fixtures/boleto/`](https://github.com/diomalta/vellora/tree/main/fixtures/boleto)
- [`fixtures/notification/`](https://github.com/diomalta/vellora/tree/main/fixtures/notification)
- [`fixtures/invoice-broken/`](https://github.com/diomalta/vellora/tree/main/fixtures/invoice-broken) — deliberately out-of-subset, to demonstrate strict rejection and fixes.

## Guides

For step-by-step how-tos, see [Streaming](/guide/streaming) and [Concurrency](/guide/concurrency).
