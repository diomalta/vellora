# Cloudflare Workers

> Next release: `@vellora/wasm` is not on npm yet. Build it from the repository to try it today.

Workers can't load a native Node addon, so vellora ships its engine a second way: compiled to
WebAssembly, as `@vellora/wasm`. Your code doesn't change. On `workerd`, `vellora` picks the
WebAssembly engine by itself.

```bash
npm install vellora @vellora/wasm
```

```toml
# wrangler.toml
compatibility_flags = ["nodejs_compat"]
```

```ts
import { renderPdf, VelloraUnsupportedError } from "vellora";

export default {
  async fetch(request: Request): Promise<Response> {
    const html = `<!DOCTYPE html><html><body><h1>Hello, {{ name }}</h1></body></html>`;
    try {
      const pdf = await renderPdf(html, { name: "Workers" });
      return new Response(pdf, { headers: { "content-type": "application/pdf" } });
    } catch (err) {
      if (err instanceof VelloraUnsupportedError) {
        return Response.json({ feature: err.feature, line: err.line, col: err.col }, { status: 422 });
      }
      throw err;
    }
  },
};
```

The full example renders the sample invoice with its logo:
[`examples/cloudflare-worker`](https://github.com/diomalta/vellora/tree/main/examples/cloudflare-worker).

## Same PDF, same errors

It is the same Rust engine: same HTML/CSS subset, same located errors, and the same PDF bytes as
on Node.js for the same input. The repository's tests check that for every fixture.

## What's different

- **Size.** The Worker is about 5.3 MB gzip, most of it the engine and its fonts. That fits the
  Workers Paid plan (10 MB) but not Free (3 MB).
- **Slower, one thread.** A render runs on the Worker's thread. On the repository benchmark
  (`benchmarks/wasm-vs-native.mjs`, sample invoice, Node.js 22, one Linux machine), the warm median
  was 31.8 ms for WebAssembly against 17.1 ms native, and the first render in a fresh process
  243 ms against 30 ms (compiling the module). Measure on your own templates.
- **No `strict: false`, no Chrome.** The fixers behind `strict: false` use a native addon, and there
  is no browser on Workers: both reject with `VelloraInputError`. Run `vellora fix` on your
  templates at build time instead.

Details: the "WebAssembly build" section of the
[compatibility matrix](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md).
