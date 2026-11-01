/**
 * `#runtime` on Cloudflare Workers (the `workerd` export condition; see `runtime.ts` for the
 * contract). The engine is the WebAssembly build, `@vellora/wasm`; the features that need a native
 * addon or a browser are unavailable and say so instead of breaking the Worker bundle.
 */
import { VelloraInputError } from "./errors.js";
import type { EngineModule } from "./runtime.js";

export type { EngineModule } from "./runtime.js";

export async function loadEngine(): Promise<EngineModule> {
  return (await import("@vellora/wasm")) as EngineModule;
}

export async function loadLint(): Promise<unknown> {
  throw new VelloraInputError(
    "strict: false is not available on Cloudflare Workers: its fixers (@vellora/lint) use a native " +
      "addon (resvg). Run `vellora fix` on the template at build time and render it with strict: true.",
  );
}

export async function loadChromium(): Promise<unknown> {
  throw new VelloraInputError(
    'engine: "chromium" is not available on Cloudflare Workers; use the default engine.',
  );
}
