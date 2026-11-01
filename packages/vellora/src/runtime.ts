/**
 * Runtime seam (`#runtime`, resolved through the `imports` map in `package.json`): the three
 * optional modules the render path loads lazily, for the default runtime — Node.js.
 *
 * - `loadEngine`: the native engine, `@vellora/native` (napi-rs addon on the libuv pool).
 * - `loadLint`: `@vellora/lint`, only for `strict: false` (it is never imported in strict mode).
 * - `loadChromium`: the optional `@vellora/engine-chromium` package, only for `engine: "chromium"`.
 *
 * On Cloudflare Workers (`workerd` condition) `runtime.workerd.ts` replaces this module, so a
 * Worker bundle never reaches the native addon, resvg, or Chromium. Keep both files' exports
 * identical.
 */

/** The engine surface shared by `@vellora/native` and `@vellora/wasm`. */
export interface EngineModule {
  render(
    html: Uint8Array,
    opts?: {
      title?: string;
      creationDate?: [number, number, number];
      images?: Record<string, Uint8Array>;
      baseUrl?: string;
      fonts?: Uint8Array[];
      pdfa?: "PDF/A-2b";
    },
  ): Promise<Uint8Array>;
}

export async function loadEngine(): Promise<EngineModule> {
  return (await import("@vellora/native")) as EngineModule;
}

export async function loadLint(): Promise<unknown> {
  return import("@vellora/lint");
}

// `new Function` keeps the optional package out of bundlers' static graph (it may be absent). It
// is created on first use, never at module load: runtimes that forbid code generation from
// strings (workerd) must still be able to import `vellora`.
let importOptional: ((specifier: string) => Promise<unknown>) | undefined;

export async function loadChromium(): Promise<unknown> {
  importOptional ??= new Function("specifier", "return import(specifier)") as (
    specifier: string,
  ) => Promise<unknown>;
  return importOptional("@vellora/engine-chromium");
}
