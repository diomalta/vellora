/**
 * Public render functions: `renderPdf`, `renderPdfBatch`, and `renderPdfToStream`.
 *
 * These wire input handling → templating → strict orchestration → native bridge. Input is always
 * content (string | Uint8Array | Readable), never a path, and a `Readable` is buffered in full before
 * templating. The production default is the real `@vellora/native`; tests swap in the deterministic
 * mock without changing these signatures.
 */
import type { Writable } from "node:stream";
import { VelloraError, VelloraInputError } from "./errors.js";
import { DEFAULT_FIDELITY_POLICY_PATH, loadRenderEnginePolicy } from "./fidelity-policy.js";
import { normalizeInput } from "./input.js";
import { NativeAddonBridge } from "./native-bridge.js";
import { orchestrate } from "./orchestrate.js";
import { renderTemplate } from "./template/index.js";
import type {
  HtmlInput,
  NativeBridge,
  RenderBatchItem,
  RenderBatchOptions,
  RenderData,
  RenderEngine,
  RenderEnginePolicy,
  RenderOptions,
} from "./types.js";

type DynamicImport = (specifier: string) => Promise<unknown>;

const importOptionalPackage = new Function(
  "specifier",
  "return import(specifier)",
) as DynamicImport;

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
  /** Test-only: override the optional Chromium bridge for this call. */
  _chromiumBridge?: NativeBridge;
  /** Test-only: inject a parsed auto-routing policy without touching the filesystem. */
  _policy?: RenderEnginePolicy;
  /** Test-only: inject policy-file reading for deterministic policy errors. */
  _policyReader?: (path: string) => Promise<string>;
}

function assertRenderEngine(engine: unknown): asserts engine is RenderEngine {
  if (engine === undefined || engine === "native" || engine === "chromium" || engine === "auto") {
    return;
  }
  throw new VelloraInputError(
    `render engine must be "native", "chromium", or "auto"; received ${JSON.stringify(engine)}.`,
  );
}

async function loadChromiumBridge(opts: InternalRenderOptions): Promise<NativeBridge> {
  if (opts._chromiumBridge) {
    return opts._chromiumBridge;
  }
  let mod: unknown;
  try {
    mod = await importOptionalPackage("@vellora/engine-chromium");
  } catch (cause) {
    throw new VelloraInputError(
      'engine: "chromium" requires installing optional package @vellora/engine-chromium.',
      { cause },
    );
  }
  const chromiumEngine = (mod as { chromiumEngine?: (options?: unknown) => NativeBridge })
    .chromiumEngine;
  if (typeof chromiumEngine !== "function") {
    throw new VelloraInputError("@vellora/engine-chromium did not export chromiumEngine(options).");
  }
  return chromiumEngine(opts.chromium);
}

async function loadPolicy(opts: InternalRenderOptions): Promise<RenderEnginePolicy> {
  if (opts._policy) {
    return opts._policy;
  }
  const path = opts.fidelity?.policyPath ?? DEFAULT_FIDELITY_POLICY_PATH;
  return loadRenderEnginePolicy(path, opts._policyReader);
}

async function selectedAutoEngine(
  opts: InternalRenderOptions,
): Promise<Exclude<RenderEngine, "auto">> {
  const templateId = opts.fidelity?.templateId;
  if (!templateId) {
    throw new VelloraInputError('engine: "auto" requires fidelity.templateId.');
  }
  const policy = await loadPolicy(opts);
  const entry = policy.templates[templateId];
  if (!entry) {
    throw new VelloraInputError(
      `No fidelity policy entry found for templateId ${JSON.stringify(templateId)}.`,
    );
  }
  return entry.selectedEngine;
}

async function selectBridge(opts: InternalRenderOptions): Promise<NativeBridge> {
  const engine = opts.engine ?? "native";
  assertRenderEngine(engine);
  const selected = engine === "auto" ? await selectedAutoEngine(opts) : engine;
  if (selected === "chromium") {
    return loadChromiumBridge(opts);
  }
  return opts._bridge ?? getDefaultBridge();
}

/** Run the shared pipeline: normalize → template → orchestrate, resolving to PDF bytes. */
async function pipeline(
  html: HtmlInput,
  data: RenderData | undefined,
  opts: InternalRenderOptions,
): Promise<Uint8Array> {
  const content = await normalizeInput(html);
  const templated = renderTemplate(content, data);
  const bridge = await selectBridge(opts);
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
 * Render many documents with a bounded number of active native renders.
 *
 * Results keep the same order as the input items. If any render fails, the batch rejects with that
 * error after already-active renders settle; no additional items are started after the first failure.
 */
export async function renderPdfBatch(
  items: Iterable<RenderBatchItem>,
  opts: RenderBatchOptions = {},
): Promise<Uint8Array[]> {
  const batch = Array.from(items);
  const concurrency = resolveBatchConcurrency(opts.concurrency);
  const results = new Array<Uint8Array>(batch.length);
  let next = 0;
  let failure: unknown;

  async function worker(): Promise<void> {
    while (failure === undefined) {
      const index = next++;
      if (index >= batch.length) {
        return;
      }
      const item = batch[index] as RenderBatchItem;
      try {
        results[index] = await pipeline(item.html, item.data, item.opts ?? {});
      } catch (err) {
        failure = err;
        return;
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, batch.length) }, () => worker()));
  if (failure !== undefined) {
    throw failure;
  }
  return results;
}

function resolveBatchConcurrency(value: number | undefined): number {
  const concurrency = value ?? 4;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new VelloraInputError(
      `renderPdfBatch concurrency must be a positive safe integer; received ${JSON.stringify(value)}.`,
    );
  }
  return concurrency;
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
