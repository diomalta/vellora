---
"vellora": patch
"@vellora/wasm": patch
"@vellora/native": patch
"@vellora/lint": patch
"@vellora/cli": patch
"@vellora/engine-chromium": patch
---

New package `@vellora/wasm`: the vellora engine built to WebAssembly, for Cloudflare Workers and other runtimes that cannot load a native addon (#63). On `workerd`, `import { renderPdf } from "vellora"` now renders with it (through the `workerd` export condition) when `@vellora/wasm` is installed next to `vellora`; on Node.js nothing changes. The PDFs are byte-identical to the native engine's. On Workers, `strict: false` and `engine: "chromium"` / `"auto"` are not available and reject with `VelloraInputError`. The bundle is about 5.3 MB gzip: within the Workers Paid limit, not the Free one. See `examples/cloudflare-worker` and the "WebAssembly build" section of COMPATIBILITY.md.
