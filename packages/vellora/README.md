# vellora

HTML to PDF for Node.js without Puppeteer or Chromium. vellora renders generated document HTML
(invoices, receipts, statements, boletos, reports, notifications) to deterministic PDFs inside your
Node.js process, through a native napi-rs addon. An optional Chromium engine is available for the
templates that need browser output.

> Part of the [vellora](https://github.com/diomalta/vellora) project.
> **0.x pre-1.0** — the API is implemented, but semver-major changes can still happen before `1.0`.
> Docs: [diomalta.github.io/vellora](https://diomalta.github.io/vellora/)

## Why vellora instead of a headless browser

- **In-process and native.** No Chromium download, no Puppeteer or Playwright, no browser to
  launch, keep warm or patch, no subprocess pool. Prebuilt addons for macOS and Linux (x64, arm64),
  so no Rust toolchain is needed.
- **Deterministic bytes.** The same input gives a byte-identical PDF: no wall clock, no randomness,
  no host-font fallback.
- **Strict mode rejects instead of mis-rendering.** HTML outside the documented subset fails with a
  `VelloraUnsupportedError` carrying `feature`, `line`, `col` and a `hint`, before any PDF is
  written.
- **Measured against Chrome.** In 0.3.0, 8 of 9 document fixtures have every word within 1 mm of
  its position in Chrome for Testing 155's print-to-PDF output, and 9 of 9 print the same number of
  pages (indicative, local macOS measurement;
  [method and losses](https://diomalta.github.io/vellora/guide/fidelity#measured-fidelity)).

## Performance

From [Resource Benchmarks run 40687532121](https://github.com/diomalta/vellora/actions/runs/40687532121)
on pinned Linux CI, built from the `v0.3.0` commit `c40b3c2`: AMD EPYC 7763, 4 cores, Linux x64,
Node v22.23.4, 2026-10-28. 3-page invoice fixture; RSS is the peak at 8 concurrent renders, warm
timings are over 50 renders.

| Path | Fresh install | External runtime | Peak RSS @8 | External RSS @8 | Cold start | Warm median / p95 |
|---|---:|---:|---:|---:|---:|---:|
| Native `vellora` | 39.72 MB | N/A | 117.60 MB | N/A | 47.29 ms | 19.09 / 23.32 ms |
| Vellora Chromium | 39.74 MB | 412.28 MB | N/A | 6833.96 MB | 735.01 ms | 635.50 / 681.03 ms |

The native path's memory is RSS inside Node; the Chromium path's is RSS of the external browser
processes. Install size grew: an earlier run measured 28.93 MB before 0.3.0, and the 0.3.0 release notes
attribute the addon growth to inline SVG support. Puppeteer and
Playwright are in the benchmark artifact but are not quoted: the run marks them non-comparable for
this fixture. Method: [benchmarks/](https://github.com/diomalta/vellora/tree/main/benchmarks).

## Install

```bash
npm install vellora
```

ESM package; CommonJS `require("vellora")` works on Node 20.19+ / 22.12+.

## Usage

```ts
import { renderPdf } from "vellora";

const pdf = await renderPdf(html, data);
// pdf: Uint8Array — page size comes from CSS in your HTML: @page { size: A4 }
```

Core APIs:

- `renderPdf(html, data?, opts?)` returns a complete PDF `Uint8Array`.
- `renderPdfBatch(items, { concurrency })` caps active renders and preserves input order.
- `renderPdfToStream(html, writable, data?, opts?)` writes the complete PDF to a writable stream.
- `renderTemplate(html, data?)` runs the built-in templating layer without rendering.

Supported options include `metadata`, `pdfa: "PDF/A-2b"`, `fonts`, `images`, `baseUrl`, `strict`,
and explicit engine routing (`"native"`, `"chromium"`, or `"auto"`).

## What's new in 0.3.0

Blitz 0.3.0-beta.4 without a fork, floats, multi-column layout, ruby annotations,
`break-before` / `break-after`, tables fragmented across pages, table captions, and inline `<svg>`
drawn natively as PDF vectors. Full notes:
[GitHub Release v0.3.0](https://github.com/diomalta/vellora/releases/tag/v0.3.0).

## When to keep a browser

vellora is not a browser. It does not run JavaScript or fetch remote assets, and it targets
document HTML you control. For templates that need exact Chromium output, route them through
`@vellora/engine-chromium` with `engine: "chromium"`, or per template with `engine: "auto"` and a
committed `vellora.fidelity.json` policy.

## Learn more

- [Getting started](https://diomalta.github.io/vellora/guide/getting-started)
- [HTML to PDF in Node.js without Puppeteer or Chromium](https://diomalta.github.io/vellora/blog/html-to-pdf-nodejs-without-puppeteer)
- [Word by word against Chrome](https://diomalta.github.io/vellora/blog/native-pdf-fidelity-blitz-beta4)
- [Compatibility](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md) ·
  [Switching from Puppeteer / wkhtmltopdf](https://diomalta.github.io/vellora/migrating)

## License

MIT — see [LICENSE](./LICENSE).
