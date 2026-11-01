/**
 * `@vellora/wasm` for Node.js (and other runtimes resolving the `node` export condition): reads the
 * `.wasm` shipped in this package. On Node, prefer the native engine (`@vellora/native`, which the
 * `vellora` package uses by default): it renders on the libuv pool instead of the main thread.
 */
import { readFile } from "node:fs/promises";
import { createVelloraWasm } from "./engine.js";

export type { RenderOpts, VelloraWasm, WasmSource } from "./engine.js";

const api = createVelloraWasm(() => readFile(new URL("../wasm/vellora_bg.wasm", import.meta.url)));

export const { init, render, coreName, __forcePanicForTest } = api;
