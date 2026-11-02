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
- `warmup(source?)` runs `init(source)` and renders a small built-in document once, so the first
  real render does not pay for compiling the engine. See [Cold start](#cold-start).

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

## Cold start

The first render in a fresh process or isolate is several times slower than the next ones. The
engine itself does no expensive setup (on the native engine the first render costs about the same
as the others): the time is V8 compiling the WebAssembly code. V8 compiles each function the first
time it is called, on the calling thread, so the first render compiles all the code it runs on the
way.

Call `warmup()` once at startup, outside a request, to pay that cost there:

```ts
import { warmup } from "@vellora/wasm";

await warmup(); // ~100–200 ms, once per process / isolate
// ...then start serving requests
```

`warmup()` renders a built-in document shaped like an invoice (page box and counters, flex rows, a
table, bold / italic / serif / monospace text, a PNG) and discards the PDF. It moves the cost; it
does not remove it. Rendering one of your own templates at startup works too, and covers your code
paths exactly.

Measured with `node benchmarks/wasm-vs-native.mjs` on 2026-11-02 (invoice fixture, 10 fresh
processes per row, Node.js 22.23.4, Linux, Intel Xeon 2.10 GHz ×4):

| Engine | First render, median / p95 | Warm render, median |
|---|---|---|
| native | 22.1 / 33.5 ms | 12.7 ms |
| WebAssembly, no warm-up (import to first PDF) | 213.1 / 240.0 ms | 23.5 ms |
| WebAssembly, after `warmup()` at boot | 38.1 / 52.6 ms | — |

The `warmup()` call itself (import, compile, instantiate and the warm-up render) took 170.5 ms
(median). Under `wrangler dev` (local workerd, not Cloudflare's edge; 4–5 restarts each), the first
request to `examples/cloudflare-worker` took 190–336 ms without a warm-up and 70–100 ms after a
request that ran `warmup()`; warm requests took about 40–45 ms.

### Where the code is

`scripts/code-size.mjs` attributes the module's code to the Rust crates it comes from. It reads a
build that keeps function names (profile `wasm-profiling`: the shipped `wasm-release` without
symbol stripping) and runs `wasm-bindgen` on it as the release build does, so it needs the
`wasm-bindgen` CLI:

```bash
cargo build -p vellora-wasm --target wasm32-unknown-unknown --profile wasm-profiling
node packages/wasm/scripts/code-size.mjs                        # the whole module, per crate
node packages/wasm/scripts/code-size.mjs --first-render invoice # only what that first render compiles
```

`--first-render` renders a fixture once in a fresh `node --trace-wasm-compilation-times` process and
counts only the functions V8 compiled (it needs `npm run build` for the template engine).

Measured on 2026-11-02: the code section is 9.3 MiB in 25 813 functions (the data section, mostly
the embedded fonts, is another 5.0 MiB and is not compiled). The largest crates are `style` (Stylo,
1.7 MiB), `core` (0.8 MiB, which includes generic code instantiated for other crates), `read_fonts`
and `skrifa` (1.4 MiB together), `alloc`, the two `usvg` versions (0.4 MiB together), `tiny_skia`,
`hashbrown`, `taffy` and `blitz_dom`. The invoice's first render compiles 2.0 MiB of it (21%, 4 865
functions): mostly `style`, `vellora_core`, `html5ever`, `blitz_dom`, `taffy`, `krilla` and
`harfrust`. No SVG code runs for a document without `<svg>`, so dropping one of the two `usvg`
versions would shrink the file but not that document's first render.

## Size

Measured on 2026-11-01 with `npm run build:wasm` (Rust 1.96.0, wasm-bindgen 0.2.125, profile
`wasm-release`):

| Build | Raw | gzip -9 | Warm render, invoice (median) |
|---|---|---|---|
| `opt-level = "s"` (shipped) | 14.3 MiB | 5.2 MiB | 36.5 ms |
| `opt-level = 3` | 15.6 MiB | 5.7 MiB | 37.6 ms |
| `opt-level = "z"` | 12.8 MiB | 4.7 MiB | 48.6 ms |
| `"s"` + `wasm-opt -Oz` (binaryen 132) | 12.9 MiB | 5.3 MiB | 44.2 ms |

Timings: Node.js 22.23.4, Linux, Intel Xeon 2.80 GHz ×4, 20 renders after 5 warm-ups; indicative,
single run. `wasm-opt` is not used: it shrinks the raw file but not the gzip size Workers checks.

About 1.9 MB of the gzip size is the eight embedded font files. Fitting the Workers Free limit
(3 MB) would need both the fonts and the engine code to shrink; that is not done yet.

## Build from source

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.125 --locked   # must match Cargo.lock
npm run build:wasm   # from the repository root
```

## License

MIT. The embedded fonts are under their own licenses; see
[THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
