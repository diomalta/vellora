---
"@vellora/wasm": patch
---

Add `warmup()`: compiles the engine's common code ahead of the first render by rendering a small
built-in document once. Call it at startup, outside a request, to move most of the WebAssembly cold
start out of the first request (#66). On the repository benchmark the invoice's first render went
from 213 ms to 38 ms after a 171 ms warm-up at boot (Node.js 22, see `packages/wasm/README.md`).
