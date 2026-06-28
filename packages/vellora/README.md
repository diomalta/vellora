# vellora

HTML to PDF for Node.js — native and browserless by default. Public API + templating + strict
orchestration, with optional Chromium fidelity routing for selected templates.

> Part of the [vellora](https://github.com/diomalta/vellora) project.
> **0.x pre-1.0** — the API is implemented, but semver-major changes can still happen before `1.0`.

## Install

```bash
npm install vellora
```

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

See the [project README](https://github.com/diomalta/vellora#readme) for the full
guide, compatibility table, and roadmap.

## License

MIT — see [LICENSE](./LICENSE).
