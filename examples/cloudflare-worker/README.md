# vellora on Cloudflare Workers

Renders the repository's example invoice (`fixtures/invoice`) to PDF inside a Worker. The code is
the same as on Node.js:

```ts
import { renderPdf } from "vellora";

const pdf = await renderPdf(template, data, { images });
return new Response(pdf, { headers: { "content-type": "application/pdf" } });
```

On `workerd`, `vellora` picks its WebAssembly engine, [`@vellora/wasm`](../../packages/wasm),
through the `workerd` export condition instead of the native addon. Install both packages:

```bash
npm install vellora @vellora/wasm
```

`wrangler.toml` needs the `nodejs_compat` flag (vellora's TypeScript layer imports a few `node:`
built-ins). The `.wasm` needs no configuration: Wrangler bundles it as a compiled
`WebAssembly.Module`.

## Run it

From this directory, after building the repository (`npm run build && npm run build:wasm` at the
root):

```bash
npm install
npm run dev            # wrangler dev → http://localhost:8787/ returns the PDF
curl -o invoice.pdf http://localhost:8787/
curl http://localhost:8787/strict   # an out-of-subset input → the located error as JSON
```

## Size

`npm run size` runs `wrangler deploy --dry-run`. Measured on 2026-11-03 (wrangler 4.151.1, this
commit's engine):

```
Total Upload: 15336.59 KiB / gzip: 6285.87 KiB
```

Workers counts only the uncompressed upload, up to 64 MiB on both Free and Paid (there is no
compressed limit since 2026-09-04), so this fits either plan. Most of it is the engine; 5.8 MB of
it is the bundled fonts (see `packages/wasm/README.md`, "Size").

## What differs from Node.js

- Rendering is single-threaded: each request renders on the Worker's thread.
- `strict: false` and `engine: "chromium"` / `"auto"` are not available (they need a native addon
  or a browser); they reject with `VelloraInputError`. Run `vellora fix` on templates at build time.
- See the "WebAssembly build" section of [COMPATIBILITY.md](../../COMPATIBILITY.md).

The PDF is byte-identical to the one `vellora` renders on Node.js with the native engine for the
same input (checked with this example on 2026-11-01).
