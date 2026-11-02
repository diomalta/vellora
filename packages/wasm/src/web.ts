/**
 * `@vellora/wasm` for browsers and other `fetch`-capable runtimes (the `default` export condition).
 * Fetches the `.wasm` next to this file. If your bundler moves or renames assets, call
 * `init(source)` first with the module's URL bytes or a compiled `WebAssembly.Module`.
 */
import { createVelloraWasm } from "./engine.js";

export type { RenderOpts, VelloraWasm, WasmSource } from "./engine.js";

const api = createVelloraWasm(async () => {
  const url = new URL("../wasm/vellora_bg.wasm", import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`@vellora/wasm: could not fetch ${url} (HTTP ${response.status}).`);
  }
  return response.arrayBuffer();
});

export const { init, warmup, render, coreName, __forcePanicForTest } = api;
