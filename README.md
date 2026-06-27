# vellora

**HTML → PDF for Node.js. No Puppeteer on the native path. No browser install by default — built for
generated documents in slim Linux images and AWS Lambda.**

[![CI](https://github.com/diomalta/vellora/actions/workflows/ci.yml/badge.svg)](https://github.com/diomalta/vellora/actions/workflows/ci.yml)
![license: MIT](https://img.shields.io/badge/license-MIT-blue)
![node: >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![status: alpha](https://img.shields.io/badge/status-alpha-orange)
[![npm](https://img.shields.io/npm/v/vellora)](https://www.npmjs.com/package/vellora) -->

`npm install` and it works — a native, in-process renderer for **generated document HTML**:
the input can be an invoice, receipt, statement, boleto, notification, or any other template
that stays inside the supported subset. No `apt install`, no Puppeteer browser download,
no `npx playwright install`, no sidecar service.

```bash
npm install vellora
```

<p align="center">
  <img src="./docs/assets/invoice-preview.png" alt="An invoice template rendered to PDF by vellora" width="420">
  <br><em>A multi-page invoice template rendered to PDF — in-process, selectable text, repeated table header.</em>
</p>

> 🚧 **Status: pre-release / alpha — in active development.** The native document renderer, CLI, lint
> workflow, PDF/A-2b, images, fonts, batch rendering, streaming helper, and optional Chromium fidelity
> engine are implemented. Roadmap items are marked separately in [Status & roadmap](#status--roadmap).

## Why

Browser-based PDF (Puppeteer/Playwright) means shipping Chromium: a large browser download, system
libraries in your Docker image, browser launch cost, and a per-render memory footprint that can
OOM-kill under concurrency. vellora's default path takes a different route — a **native addon
(napi-rs) that renders inside your Node process**:

- ✅ `npm install`, nothing installed "outside" on supported platforms (macOS + Linux glibc; musl/Alpine prebuilt is a fast-follow)
- ✅ no browser to launch and no subprocess per render
- ✅ designed for bounded memory + real concurrency on the libuv thread pool
- ✅ selectable, searchable text + subset-embedded fonts
- ✅ `@page` page numbers and running headers/footers (which `chrome --print-to-pdf` can't do via CSS)
- ✅ PDF/A-2b for archival output; PDF/UA and tagged PDF are planned
- ✅ **deterministic** output — same template + data ⇒ byte-stable PDF

> **Performance claims are evidence-gated.** Reproducible benchmarks vs Puppeteer, Playwright,
> Gotenberg, and WeasyPrint (cold start, RSS under concurrency, output size, throughput, image size)
> live in [`benchmarks/`](./benchmarks/). Numbers are published here once the suite runs in CI —
> we measure our own, we don't borrow them.

vellora is **not** a browser clone. It renders a documented HTML/CSS **subset** built for
documents, and tells you — precisely — when your input leaves it. **Strict by default.**
For the minority of templates that must match Chromium print output, install the separate
`@vellora/engine-chromium` package and route only those templates to `engine: "chromium"` or a
checked-in fidelity policy.

## What works today vs. design target

| Surface | Status |
|---|---|
| `renderPdf(html, data?, opts)` — render + built-in templating, strict subset | **Implemented** |
| `renderPdfBatch(items, { concurrency })` — bounded batch rendering | **Implemented** |
| `renderPdfToStream(...)` — render to a writable/HTTP response | **Implemented** (PDF buffered then written; progressive emission is planned) |
| `renderTemplate(...)` — templating only | **Implemented** |
| `@vellora/lint` `diagnose()` / `fix()` | **Implemented alpha** — dev-time/CI diagnostics and codemods |
| `npx vellora render` / `lint` / `fix` / `doctor` / `fidelity` (CLI) | **Implemented alpha** |
| `engine: "chromium"` via optional `@vellora/engine-chromium` | **Implemented alpha** — explicit browser-fidelity tier |
| `engine: "auto"` with `vellora.fidelity.json` | **Implemented alpha** — template-level routing policy |

## Quick start

```ts
import { renderPdf } from "vellora";

const pdf = await renderPdf(invoiceHtml, data, {
  metadata: { title: "Invoice INV-2026-00417", creationDate: "2026-06-23T00:00:00.000Z" },
  strict: true, // default — fails clearly on unsupported HTML/CSS
});
// pdf: Uint8Array
```

Built-in templating (no extra library):

```html
<table>
  <thead><tr><th>Item</th><th>Total</th></tr></thead>
  <tbody>
    {% for row in items %}
      <tr><td>{{ row.name }}</td><td>{{ row.total | currency("BRL") }}</td></tr>
    {% endfor %}
  </tbody>
</table>
```

Stream straight to an HTTP response or upload:

```ts
import { renderPdfToStream } from "vellora";
await renderPdfToStream(invoiceHtml, res, data);
```

Render large batches without starting every native render at once:

```ts
import { renderPdfBatch } from "vellora";

const pdfs = await renderPdfBatch(
  invoices.map((data) => ({ html: invoiceHtml, data })),
  { concurrency: 4 },
);
```

Runnable recipes live in [`examples/`](./examples) — `npm run example` (invoice),
`npm run render-receipt`, `render-boleto`, `render-notification`, `render-to-http-stream`,
`batch-concurrency`.

## Keep your templates in the subset (dev-time, not runtime)

`@vellora/lint` is the dev-time/CI companion to the strict renderer. It reports every supported
lint finding with stable `{ rule, severity, autoFixable, location, suggestedFix, snippet,
compatLink }` fields, and `fix()` applies deterministic codemods for the common mechanical cases.
Strict rendering still never mutates your HTML; best-effort rendering (`strict: false`) uses the
same lint fixers before handing the result to the core.

Use the library directly from tests or template build steps:

```ts
import { diagnose, fix } from "@vellora/lint";

const report = diagnose(html);
if (!report.conformant) {
  console.log(report.findings);
}

const { html: fixedHtml } = fix(html);
```

Or use the CLI for file-based workflows:

```bash
npx vellora lint templates/invoice.html
npx vellora fix  templates/invoice.html --write
```

## Compatibility

vellora renders a documented HTML/CSS **subset**. The full, generated reference — every supported,
partial, unsupported, and dev-time-fixable feature — is in **[COMPATIBILITY.md](./COMPATIBILITY.md)**
(generated from the strict-gate denylist, so it can't drift from the code).

| Feature | Status |
|---|---|
| Block & inline text, headings, lists | Supported |
| Tables (incl. multi-page, repeated header) | Supported |
| Images: data URL PNG / JPEG / GIF / WebP | Supported |
| Images: `src` via the `images` option (with optional `baseUrl`) | Supported — pass the bytes |
| Images: network fetching of remote URLs | Not supported (no network; provide bytes via `images`) |
| Inline SVG | Via dev-time `@vellora/lint.fix()` / `vellora fix` (rasterized to PNG) |
| `@page` margins, page numbers, running header/footer | Supported |
| Fonts: text shaping + subset embedding | Supported |
| Fonts: custom faces via the `fonts` option | Supported — pass `Uint8Array[]` (TTF/OTF) |
| PDF/A-2b archival output | Supported |
| PDF/UA, tagged PDF, bookmarks | *Planned* |
| `display: flex` / `grid` (general) | Limited — use tables |
| JavaScript, browser APIs, animations, filters | Not supported (rejected by the strict gate) |

## How it compares

Honest positioning — including where vellora is **weaker**. *Found something inaccurate?
[Open a PR](https://github.com/diomalta/vellora/issues).*

| Tool | Engine / runtime | In-process? | Headless browser? | License | Best for |
|---|---|---|---|---|---|
| **vellora** | Rust (napi addon) | ✅ yes | ❌ no by default | MIT | Generated documents, serverless/slim containers, deterministic PDFs |
| `@vellora/engine-chromium` | Chrome/Chromium executable | ❌ no (browser process) | ✅ explicit opt-in | MIT | Template-specific Chromium print fidelity without Puppeteer |
| Puppeteer / Playwright | Chromium | ❌ no (browser) | ✅ yes | Apache-2.0 | Full-fidelity web pages, screenshots, JS-driven content |
| Gotenberg | Chromium + LibreOffice (Docker) | ❌ no (HTTP sidecar) | ✅ yes | MIT | Office docs + HTML via a standalone service |
| WeasyPrint | Python | ✅ (in Python) | ❌ no | BSD | HTML/CSS→PDF in Python stacks |
| Prince / DocRaptor | Proprietary engine | ❌ service/binary | ❌ no | Commercial | Advanced print CSS, paid SLA |
| wkhtmltopdf | Old WebKit | ✅ (binary) | ❌ no | LGPL | **Archived (2023)** — vellora is a migration target |
| pdfkit / pdf-lib / @react-pdf | JS, programmatic | ✅ yes | ❌ no | MIT | Drawing PDFs by hand/JSX (you don't write HTML/CSS) |

**Where vellora is weaker:** it renders a **documented subset** of HTML/CSS, not the full web
platform. A headless browser (Puppeteer/Playwright) supports far more CSS, JavaScript, and arbitrary
web content. If you need pixel-perfect rendering of an arbitrary website, use a browser; vellora is
for **generated documents** whose markup you control.

## Status & roadmap

vellora is **pre-release (alpha)**. The *What works today* table above is the API surface; this is
the broader feature view. Order is roughly build order, not a delivery commitment.

- **Available now** — in-process HTML→PDF (no browser by default); multi-page layout (text, headings, lists,
  tables); table pagination with a repeated `<thead>`; `@page` margins, page numbers, running
  header/footer; selectable text with subset-embedded fonts; custom fonts via the `fonts` option;
  deterministic (byte-identical) output;
  templating (`{{ var }}`, `{% for %}` / `{% if %}`, `currency` / `number` / `date` helpers);
  strict-by-default subset validation; `renderPdf` / `renderPdfBatch` / `renderPdfToStream`; document metadata
	  (`title`, `creationDate`); PDF/A-2b archival output; embedded data-url images; representative HTML fixtures for invoice,
  receipt, boleto, and notification inputs; `@vellora/lint` `diagnose()` / `fix()`; `@vellora/cli`
  `render` / `lint` / `fix` / `doctor` / `fidelity`; bounded, configurable concurrency; best-effort
  mode (`{ strict: false }`); optional Chromium engine and `engine: "auto"` fidelity policies.
- **In progress / next** — musl/Alpine prebuilt binaries, Windows prebuilds, stronger release notes
  and launch docs.
- **Planned for a stable release** — broader PDF/A profiles · PDF/UA · tagged PDF · bookmarks; content-hash caching
  and phase timings; CI quality gates (generated compatibility table, visual-regression, our own
  benchmarks vs Chromium/Gotenberg/WeasyPrint); a stable semver API and deeper docs/site examples.
- **Future (post-1.0, demand-driven)** — password / encryption; attachments (PDF/A-3, e.g. embedding
  NF-e XML); watermark / stamp; broader CSS subset; more `fix` rules; more image formats; a managed
  Chromium package **only if** real demand appears for zero-config browser fidelity.
- **Out of scope** — JavaScript execution · arbitrary-website fidelity · WASM build · Windows
  support today · bundled Chromium by default.

## Packages

| Package | What |
|---|---|
| `vellora` | Public API + templating |
| `@vellora/native` | Prebuilt napi addons (linux glibc, macOS) |
| `@vellora/lint` | Dev-time `diagnose` + `fix` |
| `@vellora/cli` | `render` / `lint` / `fix` commands |
| `@vellora/engine-chromium` | Optional Chromium/Chrome fidelity engine |

## Try it without installing

Open the repo in a ready-to-run environment (Rust + Node provisioned), then `npm run build && npm run example`:

[![Open in GitHub Codespaces](https://img.shields.io/badge/Open%20in-GitHub%20Codespaces-181717?logo=github)](https://codespaces.new/diomalta/vellora)

A one-command Docker demo is in [`Dockerfile.example`](./Dockerfile.example).

## Documentation

- [COMPATIBILITY.md](./COMPATIBILITY.md) — the supported HTML/CSS subset (generated)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — design, layers, dependency stack, performance model
- [Status & roadmap](#status--roadmap) — what's shipping when
- [CONTRIBUTING.md](./CONTRIBUTING.md) — toolchain, dev loop, how to help
- [SECURITY.md](./SECURITY.md) — disclosure policy + native-addon threat model
- [RELEASING.md](./RELEASING.md) — release pipeline (Changesets + prebuilds + provenance)
- [Docs site](https://diomalta.github.io/vellora/) — VitePress guide, recipes, compatibility, and API reference

## Contributing

vellora is pre-release and contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and
the [good first issues](https://github.com/diomalta/vellora/contribute).

## License

MIT — see [LICENSE](./LICENSE).

---

⭐ **Star the repo to follow the launch**, track the [status](#status--roadmap), or open an issue with
your document use case.
