/**
 * Real native bridge: adapts `@vellora/native` (the prebuilt napi-rs addon) to the `NativeBridge`
 * contract the orchestration calls. This is the production default; the mock backs unit tests.
 *
 * The addon is imported lazily on first render, so importing `vellora` never loads the native `.node`
 * until a real render happens (tests that inject their own bridge never trigger it).
 */
import { VelloraInputError } from "./errors.js";
import type { BridgeRenderOptions, NativeBridge } from "./types.js";

/** The async render surface exposed by `@vellora/native`. */
type AddonRender = (
  html: Uint8Array,
  opts?: {
    title?: string;
    creationDate?: [number, number, number];
    images?: Record<string, Uint8Array>;
    baseUrl?: string;
  },
) => Promise<Uint8Array>;

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
      const native = (await import("@vellora/native")) as { render: AddonRender };
      this.renderFn = native.render;
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
    });
  }
}
