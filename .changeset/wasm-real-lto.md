---
"@vellora/wasm": patch
---

Build the WebAssembly engine with link-time optimization. The build profile asked for it, but
cargo silently disabled it because the crate was also built as an `rlib`. The `.wasm` drops from
16.4 MiB to 14.9 MiB (6.4 to 6.1 MiB gzip), and the warm render of the sample invoice goes from
about 40 ms to about 26 ms (`benchmarks/wasm-vs-native.mjs`, Node.js 22, Linux). The first render
in a fresh process does not change. PDFs are byte-identical to before and to the native engine.

Cloudflare Workers now limits only the uncompressed bundle (64 MiB, Free and Paid), so the engine
fits both plans. The docs no longer cite the old 3 MB / 10 MB compressed limits.
