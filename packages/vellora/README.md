# vellora

HTML to PDF for Node.js — no browser. Public API + templating + strict orchestration.

> Part of the [vellora](https://github.com/diomalta/vellora) project.
> **Pre-release (alpha)** — the API may change before `1.0`.

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

For batches, cap active native renders with `renderPdfBatch(items, { concurrency })`.

See the [project README](https://github.com/diomalta/vellora#readme) for the full
guide, compatibility table, and roadmap.

## License

MIT — see [LICENSE](./LICENSE).
