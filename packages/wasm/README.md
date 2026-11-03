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

The table predates the italic faces. Bundling the six Liberation italic and bold italic files
(issue #74) grew the shipped build, measured on 2026-11-03 the same way (`npm run build:wasm`, Rust
1.96.0, wasm-bindgen 0.2.125, `opt-level = "s"`), from 14.3 MiB raw / 5.3 MiB gzip -9 (`main`,
rebuilt the same day) to **16.4 MiB raw / 6.4 MiB gzip -9**: +2.0 MiB raw / +1.1 MiB gzip, the
size of the six font files themselves. The other rows and the timings were not re-measured.

About 3.1 MB of the gzip size is the fourteen embedded font files. Fitting the Workers Free limit
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
