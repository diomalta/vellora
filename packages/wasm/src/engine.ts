/**
 * Runtime-neutral core of `@vellora/wasm`: wraps the `wasm-bindgen` glue (`../wasm/vellora.js`)
 * with the same async surface as `@vellora/native` (`render(html, opts) → Promise<Uint8Array>`).
 *
 * Each runtime entry (`node.ts`, `workerd.ts`, `web.ts`) only says where the `.wasm` bytes come
 * from. The module is compiled and instantiated lazily on the first call, so importing the package
 * costs nothing until a render happens.
 *
 * **Panics.** On `wasm32-unknown-unknown` a Rust panic aborts: the instance traps with
 * `WebAssembly.RuntimeError: unreachable`. The crate's panic hook records the message before the
 * trap; here it is read back, the call rejects with `render panicked: <message>` (the napi
 * binding's wording), and the instance is re-created (`__wbg_reset_state`) because a trapped
 * instance's stack pointer and heap can no longer be trusted. The next call runs on a fresh
 * instance. A `RangeError` (the host's call stack overflowing inside the engine) is handled the
 * same way. The re-creation is synchronous, which browsers refuse on their main thread for a
 * module this size (> 8 MB); there the engine stays unusable after a panic and every later call
 * rejects (reload the page, or render in a Web Worker, where it is allowed).
 *
 * **Threads.** The WebAssembly engine is single-threaded: a render runs synchronously on the
 * caller's thread (the returned promise only keeps the `@vellora/native` shape). Concurrent calls
 * therefore run one after another; they never share state.
 */
import initGlue, * as glue from "../wasm/vellora.js";

/** Render options. Identical to `@vellora/native`'s `RenderOpts`. */
export interface RenderOpts {
  title?: string;
  /** Deterministic creation date `[year, month, day]`; never wall-clock. */
  creationDate?: [number, number, number];
  /** Image bytes keyed by an `<img>`'s `src` string; the format is detected in the core. */
  images?: Record<string, Uint8Array>;
  /** Base URL used only to normalize a relative `<img>` `src` into the `images` lookup key. */
  baseUrl?: string;
  /** Custom font faces (raw TTF/OTF bytes); family/weight/style are read from the bytes. */
  fonts?: Uint8Array[];
  /** Emit an archival PDF using the named PDF/A profile. Currently only PDF/A-2b is supported. */
  pdfa?: "PDF/A-2b";
}

/** Where a runtime gets the engine from: a compiled module, or the raw `.wasm` bytes. */
export type WasmSource = WebAssembly.Module | BufferSource;

/** The public surface every runtime entry exports. */
export interface VelloraWasm {
  /**
   * Compile and instantiate the engine now instead of on the first render. Optional. Pass a
   * `source` to load the `.wasm` from somewhere else than the package (a CDN, R2, a bundler
   * asset URL); without it the runtime entry's default location is used. Idempotent.
   */
  init(source?: WasmSource | Promise<WasmSource>): Promise<void>;
  /** Render document HTML bytes (UTF-8 content, never a path) to PDF bytes. */
  render(html: Uint8Array, opts?: RenderOpts): Promise<Uint8Array>;
  /** Smoke export: the linked core crate's name (`"vellora-core"`). */
  coreName(): Promise<string>;
  /** Test-only: forces a Rust panic to prove panic-to-rejection and instance reset. Not public API. */
  __forcePanicForTest(): Promise<void>;
}

/** Was this error raised by the WebAssembly machine itself (trap / host stack overflow)? */
function isTrap(error: unknown): boolean {
  return error instanceof WebAssembly.RuntimeError || error instanceof RangeError;
}

/** Build the API for a runtime whose default `.wasm` location is `defaultSource`. */
export function createVelloraWasm(
  defaultSource: () => WasmSource | Promise<WasmSource>,
): VelloraWasm {
  let ready: Promise<void> | undefined;
  /** Set when a trapped instance could not be re-created; every later call rejects with it. */
  let broken: Error | undefined;

  function init(source?: WasmSource | Promise<WasmSource>): Promise<void> {
    if (!ready) {
      ready = (async () => {
        const resolved = await (source ?? defaultSource());
        // Compile asynchronously: browsers refuse a synchronous compile of a module this size on
        // the main thread. workerd hands over an already-compiled `WebAssembly.Module`.
        const module =
          resolved instanceof WebAssembly.Module ? resolved : await WebAssembly.compile(resolved);
        // Instantiate asynchronously too (`WebAssembly.instantiate` in the glue's init): Chrome
        // also refuses a synchronous `new WebAssembly.Instance` of a module over 8 MB on the main
        // thread.
        await initGlue({ module_or_path: module });
      })();
      // A failed load (missing file, network) can be retried by the next call.
      ready.catch(() => {
        ready = undefined;
      });
    }
    return ready;
  }

  function call<T>(fn: () => T): T {
    if (broken) {
      throw broken;
    }
    try {
      return fn();
    } catch (error) {
      if (!isTrap(error)) {
        throw error; // a core error: `{ feature, line, col, hint }` or `{ profile, errors }`
      }
      let message: string | undefined;
      try {
        message = glue.takePanicMessage();
      } catch {
        // The trapped instance could not even report; fall back to the trap's own message.
      }
      const failure = new Error(message ?? `render aborted: ${(error as Error).message}`, {
        cause: error,
      });
      try {
        glue.__wbg_reset_state();
      } catch (resetError) {
        broken = new Error(
          `@vellora/wasm: the engine could not be restarted after "${failure.message}" ` +
            `(${(resetError as Error).message}). Reload the page, or render in a Web Worker.`,
          { cause: resetError },
        );
      }
      throw failure;
    }
  }

  return {
    init,
    async render(html, opts) {
      await init();
      return call(() => glue.render(html, opts));
    },
    async coreName() {
      await init();
      return call(() => glue.coreName());
    },
    async __forcePanicForTest() {
      await init();
      call(() => glue.__forcePanicForTest());
    },
  };
}
