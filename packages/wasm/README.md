# @vellora/wasm

**The WebAssembly build of [vellora](https://www.npmjs.com/package/vellora)'s HTML-to-PDF engine,
for runtimes that cannot load a native addon: Cloudflare Workers first.**

> **You probably want [`vellora`](https://www.npmjs.com/package/vellora) instead.** On Cloudflare
> Workers, `import { renderPdf } from "vellora"` uses this package automatically (the `workerd`
> export condition); you only install it next to `vellora`:
>
> ```bash
> npm install vellora @vellora/wasm
> ```
>
> See [`examples/cloudflare-worker`](https://github.com/diomalta/vellora/tree/main/examples/cloudflare-worker).

## What's inside

The same Rust engine as [`@vellora/native`](https://www.npmjs.com/package/@vellora/native), compiled
to `wasm32-unknown-unknown`: Blitz layout, vellora's pagination and the krilla PDF writer, with the
default fonts embedded. Same input, same PDF: the repository's tests render every fixture with both
engines and require byte-identical output.

## API

The same surface as `@vellora/native`:

```ts
import { render } from "@vellora/wasm";

const pdf = await render(new TextEncoder().encode(html), {
  title: "Invoice",
  creationDate: [2026, 6, 22],
  images: { "logo.png": logoBytes },
});
```

- `render(html, opts?)` → `Promise<Uint8Array>`. Errors carry the same properties as the native
  engine: `{ feature, line, col, hint }` for an out-of-subset construct, `{ profile, errors }` for a
  PDF/A failure.
- `init(source?)` compiles and instantiates the engine ahead of the first render. Pass a
  `WebAssembly.Module` or the `.wasm` bytes to load it from somewhere else.

The package picks the loader for its runtime through export conditions: `workerd` (Wrangler bundles
the `.wasm` as a module), `node` (reads the file), and `default` (fetches the `.wasm` next to the
script, for browsers).

## Differences from the native engine

- **Single-threaded.** A render runs on the calling thread and blocks it until the PDF is done.
- **Panics.** A Rust panic aborts on wasm32. The render rejects with `render panicked: …` (the
  native wording) and the instance is re-created for the next call. On a browser's main thread that
  re-creation is refused for a module this size, so the engine stays unusable until the page
  reloads; render in a Web Worker to avoid it.

The full list is in the "WebAssembly build" section of
[COMPATIBILITY.md](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md).

## Size

Cloudflare Workers limits the **uncompressed** bundle to 64 MiB on both Free and Paid; there has
been no compressed limit since 2026-09-04 ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
read 2026-11-03). This module fits on both plans with room to spare. What its size still costs is
time: the module is read, compiled and instantiated on every cold start.

Measured on 2026-11-03 with `npm run build:wasm` (Rust 1.96.0, wasm-bindgen 0.2.125, profile
`wasm-release`, `opt-level = "s"`, fat LTO) and `benchmarks/wasm-vs-native.mjs` (invoice, Node.js
22.23.4, Linux, Intel Xeon ×4, 15 fresh processes for the cold start, 50 warm renders):

| | Raw | gzip -9 | Warm render (median) | Cold start (median) |
|---|---|---|---|---|
| Before issue #66 (LTO silently off) | 16.4 MiB | 6.4 MiB | 39.7–42.0 ms | 324–336 ms |
| Shipped | **14.9 MiB** | 6.1 MiB | **25.1–27.7 ms** | 325–342 ms |

PDFs are byte-identical to the native addon in both. Until issue #66 the profile's `lto = true`
did nothing: cargo turns LTO off for a library whose crate types include `rlib`, and
`crates/vellora-wasm` listed one. `ryu`'s `small` feature on wasm32 saves another 9 KB.

Measured and **not** shipped (same harness, PDFs compared on every fixture plus SVG, font, script
and image probes):

| Lever | Raw saving | Why not |
|---|---|---|
| Fonts stored brotli-compressed, decoded in the engine (measured before the LTO fix) | −3.6 MB (−1.0 MB gzip) | First render 45–180 ms slower (decoding) |
| Unify the font stack (krilla/subsetter on skrifa 0.44) | −318 KB | Needs vendored crates; read-fonts 0.41 bug fixes change a few malformed fonts' PDFs |
| Blitz's usvg without `<text>` (never runs: Blitz only sizes SVGs) | −596 KB | Needs a vendored blitz-dom; no measurable speed gain |
| Unify usvg on 0.48 | −1.1 MB | Changes nested `<svg transform>` output (a usvg 0.48 fix) |
| `opt-level = "z"` for crates a typical document never runs | −284 KB | Not faster; slower for SVG-heavy documents |
| `wasm-opt` (binaryen 132, `-O1` … `-Oz`; measured before the LTO fix) | up to −1.5 MB | Slower first render and warm p95 |

The cold start is V8 compiling code, not the module's size: on a fresh isolate V8 compiles each
function on first call, and the invoice's first render compiles about 2.3 MiB of code (Stylo,
vellora's layout, Blitz, krilla, html5ever, Taffy, harfrust) out of 8.1 MiB. One-time Rust
initialisation is about 7 ms. Cutting code that never runs makes the file smaller but does not
make that first render faster. Measure it with:

```bash
cargo build -p vellora-wasm --target wasm32-unknown-unknown --profile wasm-profiling
node packages/wasm/scripts/code-size.mjs                         # code per crate
node packages/wasm/scripts/code-size.mjs --first-render invoice  # what the first render compiles
```

About 3.1 MB of the gzip size (5.8 MB raw) is the fourteen embedded font files.

## Build from source

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.125 --locked   # must match Cargo.lock
npm run build:wasm   # from the repository root
```

## License

MIT. The embedded fonts are under their own licenses; see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
