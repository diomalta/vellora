/**
 * `@vellora/wasm` for Cloudflare Workers (the `workerd` export condition). Wrangler bundles the
 * imported `.wasm` as a pre-compiled `WebAssembly.Module` (its default `CompiledWasm` rule), so no
 * fetch or compile happens at request time; the instance is created on the first render.
 */
import wasmModule from "../wasm/vellora_bg.wasm";
import { createVelloraWasm } from "./engine.js";

export type { RenderOpts, VelloraWasm, WasmSource } from "./engine.js";

const api = createVelloraWasm(() => wasmModule);

export const { init, render, coreName, __forcePanicForTest } = api;
