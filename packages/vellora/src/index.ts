/**
 * vellora — public API.
 *
 * Pass document HTML (and optional data) in, get a deterministic PDF out, strict by default.
 *
 *   import { renderPdf } from "vellora";
 *   const pdf = await renderPdf(html, data);
 *
 * Input is always **content** (string | Uint8Array | Readable), never a file path. Templating
 * (`{{ var }}`, `{% for %}`, `{% if %}`, `currency`/`number`/`date` helpers) runs before render.
 * Strict mode validates and never mutates; `{ strict: false }` runs `@vellora/lint` fixers first.
 */
export {
  conformanceFromDiagnostic,
  isConformanceDiagnostic,
  isUnsupportedDiagnostic,
  unsupportedFromDiagnostic,
  type ConformanceDiagnostic,
  type UnsupportedDiagnostic,
  VelloraConformanceError,
  VelloraError,
  type VelloraErrorCode,
  VelloraInputError,
  VelloraTemplateError,
  VelloraUnsupportedError,
} from "./errors.js";
export { MockNativeBridge, type MockRenderCall } from "./mock-bridge.js";
export { NativeAddonBridge } from "./native-bridge.js";
export { DEFAULT_CREATION_DATE, resolveOptions } from "./orchestrate.js";
export {
  DEFAULT_FIDELITY_POLICY_PATH,
  loadRenderEnginePolicy,
  parseRenderEnginePolicy,
  summarizeRenderEnginePolicy,
} from "./fidelity-policy.js";
export type { RenderEnginePolicySummary } from "./fidelity-policy.js";
export { renderPdf, renderPdfBatch, renderPdfToStream, setNativeBridge } from "./render.js";
export { renderTemplate } from "./template/index.js";
export type {
  BridgeRenderOptions,
  ChromiumEngineOptions,
  FidelityOptions,
  HtmlInput,
  NativeBridge,
  PdfAProfile,
  PolicySelectedEngine,
  RenderBatchItem,
  RenderBatchOptions,
  RenderData,
  RenderEngine,
  RenderEnginePolicy,
  RenderEnginePolicyEntry,
  RenderMetadata,
  RenderOptions,
} from "./types.js";
