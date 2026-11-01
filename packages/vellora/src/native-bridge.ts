/**
 * Real engine bridge: adapts the runtime's engine to the `NativeBridge` contract the orchestration
 * calls. This is the production default; the mock backs unit tests.
 *
 * The engine comes from `#runtime`: `@vellora/native` (the prebuilt napi-rs addon) on Node.js, and
 * `@vellora/wasm` (the WebAssembly build of the same Rust core) on Cloudflare Workers. Both expose
 * the same `render(html, opts)` with the same options and error properties, so this adapter is
 * shared. The engine is imported lazily on first render, so importing `vellora` never loads it until
 * a real render happens (tests that inject their own bridge never trigger it).
 */
import { loadEngine } from "#runtime";
import { VelloraInputError } from "./errors.js";
import type { EngineModule } from "./runtime.js";
import type { BridgeRenderOptions, NativeBridge } from "./types.js";

/** The async render surface exposed by `@vellora/native` and `@vellora/wasm`. */
type AddonRender = EngineModule["render"];

/**
 * Map the orchestration's ISO-8601 creation date to the addon's `[year, month, day]` (UTC).
 *
 * Currently records the PDF creation date at **date granularity (year, month, day) in UTC** — the
 * `vellora-core` PDF writer only accepts y/m/d — so the time-of-day and timezone of the ISO-8601
 * instant are intentionally dropped here (documented, not silent). The public boundary
 * (`orchestrate.resolveOptions`) rejects an unparseable date before we get here; the `Number.isNaN`
 * guard below is defense-in-depth so a `NaN` triple can never be forwarded across the FFI.
 */
function isoToYmd(iso: string): [number, number, number] {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new VelloraInputError(
      `metadata.creationDate must be a valid ISO-8601 date string; received ${JSON.stringify(iso)}.`,
    );
  }
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
}

export class NativeAddonBridge implements NativeBridge {
  private renderFn?: AddonRender;

  private async load(): Promise<AddonRender> {
    if (!this.renderFn) {
      this.renderFn = (await loadEngine()).render;
    }
    return this.renderFn;
  }

  async render(html: string, options: BridgeRenderOptions): Promise<Uint8Array> {
    const render = await this.load();
    const bytes = new TextEncoder().encode(html);
    return render(bytes, {
      title: options.metadata.title,
      creationDate: isoToYmd(options.metadata.creationDate),
      images: options.images,
      baseUrl: options.baseUrl,
      fonts: options.fonts,
      pdfa: options.pdfa,
    });
  }
}
