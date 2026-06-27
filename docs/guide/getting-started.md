# Getting Started

This tutorial takes you from nothing to a rendered PDF. The happy path installs a **prebuilt native addon** — you do **not** need a Rust toolchain, Chromium, Python, or Java.

## Requirements

- Node.js 22 (the repo pins `22` via `.nvmrc`; vellora supports Node `>=20`).
- An ESM project (`"type": "module"` in your `package.json`), or use a `.mjs` file.

## Install

```sh
npm install vellora
```

That single install pulls in `@vellora/native`, the prebuilt native addon for your platform. No compilation step runs. If you want to build the addon from Rust source instead, see [Compiling from source](#compiling-from-source-advanced) below — that is an advanced, contributor-only path and is **not** required to use vellora.

## Your first PDF

Create `first-pdf.mjs`:

```js
import { writeFileSync } from "node:fs";
import { renderPdf } from "vellora";

const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4; margin: 18mm; }
      body { font-family: sans-serif; color: #1a1a1a; }
      h1 { font-size: 22px; }
    </style>
  </head>
  <body>
    <h1>Hello, {{ name }}!</h1>
    <p>Your first vellora PDF — rendered in-process, no browser.</p>
  </body>
</html>`;

const pdf = await renderPdf(html, { name: "world" }, {
  metadata: { title: "First PDF", creationDate: "2026-06-24T00:00:00.000Z" },
  strict: true,
});

writeFileSync("first.pdf", pdf);
console.log(`Wrote ${pdf.length} bytes; starts with %PDF-: ${new TextDecoder().decode(pdf.subarray(0, 5)) === "%PDF-"}`);
```

Run it:

```sh
node first-pdf.mjs
```

You now have `first.pdf` on disk. `renderPdf` resolves to a `Uint8Array` whose bytes start with `%PDF-`.

## What just happened

- **`html` is content, never a path.** You pass the document itself (a `string`, `Uint8Array`, or `Readable`), not a filename.
- **Templating runs first.** <code v-pre>{{ name }}</code> is interpolated from the `data` object. vellora supports <code v-pre>{{ var }}</code> interpolation (dotted paths), `{% for %}` loops, `{% if %}` conditionals, and `currency` / `number` / `date` helpers. All values are HTML-escaped.
- **Strict by default.** `strict: true` validates your HTML/CSS against the supported [subset](/compatibility) and never mutates your input. Out-of-subset input throws a `VelloraUnsupportedError` instead of silently rendering wrong.

## Next steps

- [Render an invoice](/guide/invoices) with loops and currency formatting.
- Add [images](/guide/images) and [custom fonts](/guide/fonts).
- [Stream a PDF](/guide/streaming) to an HTTP response.
- Generate archival [PDF/A-2b](/guide/pdfa).
- Compare native output against Chromium or a legacy PDF with [Rendering fidelity](/guide/fidelity).
- Run `npx vellora lint templates/invoice.html` in CI to keep templates inside the supported subset.
- Browse the [API Reference](/reference/).

## Compiling from source (advanced)

You do **not** need this to use vellora — `npm install vellora` ships a prebuilt addon. This path is only for contributors building `@vellora/native` from Rust source. It requires a Rust toolchain (see `rust-toolchain.toml`) and a full build:

```sh
git clone https://github.com/diomalta/vellora
cd vellora
npm install
npm run build   # cargo build --release + native addon + TypeScript
```
