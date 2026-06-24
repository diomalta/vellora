/**
 * Public render functions: `renderPdf` and `renderPdfToStream`.
 *
 * Both wire input handling → templating → strict orchestration → native bridge. Input is always
 * content (string | Uint8Array | Readable), never a path, and a `Readable` is buffered in full
 * before templating. Currently the native bridge is the deterministic mock; `native-render-bridge`
 * swaps in the real `@vellora/native` with no change to these signatures.
 */
import type { Writable } from "node:stream";
import { VelloraError, VelloraInputError } from "./errors.js";
import { normalizeInput } from "./input.js";
import { NativeAddonBridge } from "./native-bridge.js";
import { orchestrate } from "./orchestrate.js";
import { renderTemplate } from "./template/index.js";
import type { HtmlInput, NativeBridge, RenderData, RenderOptions } from "./types.js";

/**
 * Internal: the active native bridge. The production default is the real `@vellora/native` addon
 * (lazy — the `.node` loads only on first render). Unit tests reset this to the deterministic mock
 * (see `test/_setup-bridge.ts`); a per-call override is passed via `_bridge`.
 */
let defaultBridge: NativeBridge | undefined;

function getDefaultBridge(): NativeBridge {
  if (!defaultBridge) {
    defaultBridge = new NativeAddonBridge();
  }
  return defaultBridge;
}

/** Test/wiring seam: swap the default native bridge. Returns the previous bridge. */
export function setNativeBridge(bridge: NativeBridge): NativeBridge {
  const previous = getDefaultBridge();
  defaultBridge = bridge;
  return previous;
}

/** Internal options carrying the optional bridge override (used by tests). */
interface InternalRenderOptions extends RenderOptions {
  /** Test-only: override the native bridge for this call. */
  _bridge?: NativeBridge;
}

/** Run the shared pipeline: normalize → template → orchestrate, resolving to PDF bytes. */
async function pipeline(
  html: HtmlInput,
  data: RenderData | undefined,
  opts: InternalRenderOptions,
): Promise<Uint8Array> {
  const content = await normalizeInput(html);
  const templated = renderTemplate(content, data);
  const bridge = opts._bridge ?? getDefaultBridge();
  return orchestrate(templated, opts, bridge);
}

/**
 * Render document HTML to a complete PDF.
 *
 * @param html document **content** (string | Uint8Array | Readable), never a file path.
 * @param data optional templating data.
 * @param opts optional render options (`strict` defaults to `true`).
 */
export function renderPdf(
  html: HtmlInput,
  data?: RenderData,
  opts: RenderOptions = {},
): Promise<Uint8Array> {
  return pipeline(html, data, opts);
}

/**
 * Render document HTML and write the complete PDF to `writable`, then end it.
 *
 * Input is fully buffered; the complete PDF is produced via the native render path and then written.
 * Resolves only after the complete PDF is written. A `writable` `error` rejects and aborts.
 * (Page-by-page progressive emission awaits a future native streaming surface.)
 */
export async function renderPdfToStream(
  html: HtmlInput,
  writable: Writable,
  data?: RenderData,
  opts: RenderOptions = {},
): Promise<void> {
  const pdf = await pipeline(html, data, opts);
  await writeAndEnd(writable, pdf);
}

/** Write a buffer to a `Writable` and end it; reject on a destination error. */
function writeAndEnd(writable: Writable, bytes: Uint8Array): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const fail = (cause: unknown): void => {
      if (settled) {
        return;
      }
      settled = true;
      reject(cause instanceof Error ? cause : new VelloraError(String(cause)));
    };
    // Stay subscribed for the lifetime of the write so a post-callback `error` event (Node emits one
    // when a write callback reports an error) is absorbed rather than left uncaught.
    writable.on("error", fail);
    writable.write(bytes, (writeErr) => {
      if (writeErr) {
        fail(writeErr);
        return;
      }
      writable.end(() => {
        if (!settled) {
          settled = true;
          resolve();
        }
      });
    });
  });
}

// Re-export so the public barrel can avoid importing the input module directly.
export { VelloraInputError };
