# Fixtures

Each fixture is a document `index.html` template plus a `data.json` it binds to. They double as
the inputs for the runnable recipes in [`../examples/`](../examples). Every recipe reads the
fixture's `index.html` as the template string and `data.json` as the data, renders with
`renderPdf` (strict by default), and asserts the output begins with `%PDF-`.

| Fixture | Capability exercised | Recipe (npm script) |
| --- | --- | --- |
| `invoice/` | Templating (`{{ }}`, `{% for %}`, `{% if %}`, `currency`/`date` helpers), table pagination with repeated `<thead>`, `@page` margins + footer counters | `npm run example` (`examples/render-invoice.ts`) |
| `receipt/` | Compact point-of-sale layout: narrow page, itemized totals | `npm run render-receipt` (`examples/render-receipt.ts`) |
| `boleto/` | Brazilian boleto layout: dense fields, monospaced digit lines, fixed-position blocks | `npm run render-boleto` (`examples/render-boleto.ts`) |
| `notification/` | Flowing legal/prose document: paragraphs, headings, signature block | `npm run render-notification` (`examples/render-notification.ts`) |
| `invoice-broken/` | Strict-mode **rejection** of out-of-subset input — strict render throws `VelloraUnsupportedError` instead of silently producing a wrong PDF | (no render recipe — see `examples/render-invoice.ts` step 5 for the strict-rejection demo) |

All four valid fixtures are also rendered together, concurrently, by
`npm run batch-concurrency` (`examples/batch-concurrency.ts`), and the invoice fixture is rendered
to a Node stream by `npm run render-to-http-stream` (`examples/render-to-http-stream.ts`).

> Prerequisite: build the native addon first with `npm run build` (cargo + `@vellora/native`).
