/**
 * Public option/data types and the swappable native-bridge contract.
 *
 * `NativeBridge` is the single, narrow boundary the orchestration calls to render. A mock backs all
 * current tests; `@vellora/native` provides the real, drop-in implementation once
 * the napi binding lands. The interface matches that eventual contract: async, content +
 * resolved options in, PDF bytes out.
 */
import type { Readable } from "node:stream";

/** Accepted `html` input. Always document **content**, never a filesystem path. */
export type HtmlInput = string | Uint8Array | Readable;

/** Render `data` for the templating engine: an arbitrary plain object of values. */
export type RenderData = Record<string, unknown>;

/**
 * Document metadata forwarded to the core. Currently, `title` and `creationDate` are honored.
 * `creationDate` is an ISO-8601 string so identical inputs serialize byte-identically.
 */
export interface RenderMetadata {
  title?: string;
  /**
   * ISO-8601 instant recorded as the PDF creation date. Must be `Date`-parseable; an empty or
   * non-parseable value rejects with `VelloraInputError`. Omitted ⇒ a fixed deterministic default.
   *
   * Currently records **date granularity only — (year, month, day) in UTC** — because `vellora-core`
   * accepts only y/m/d; the time-of-day and timezone are intentionally dropped (the recorded
   * `/CreationDate` is always at 00:00:00 UTC).
   */
  creationDate?: string;
}

/**
 * Public render options. `opts` is the single carrier for render configuration and is forwarded to
 * the orchestration and native layers. `metadata`, `images`, `baseUrl`, and `fonts` all have a
 * rendering effect.
 */
export interface RenderOptions {
  /** Strict-by-default: validate, never mutate. `false` runs `@vellora/lint` fixers first. */
  strict?: boolean;
  /** Document metadata (title, creation date). */
  metadata?: RenderMetadata;
  /**
   * Custom font faces as raw TTF/OTF bytes. Each face registers into the deterministic font context
   * (after the bundled faces) and is reachable from the document's CSS by its **intrinsic embedded
   * family name** (`font-family: "Inter"`) — the caller does not declare a family alias. Custom faces
   * never override the CSS generics (`sans-serif`/`serif`/`monospace` stay bundled), and no host/system
   * font is ever consulted, so an unreferenced face leaves output byte-identical. A non-`Uint8Array`
   * entry rejects with `VelloraInputError`; bytes that are not a parseable font reject with
   * `font:invalid`.
   */
  fonts?: Uint8Array[];
  /**
   * Image bytes keyed by an `<img>`'s `src` string. A non-`data:` `<img src>` is resolved by looking
   * up this map (its key optionally normalized against `baseUrl`); the format is detected from the
   * bytes. A renderable `<img>` whose source does not resolve rejects with `image:unresolved`.
   */
  images?: Record<string, Uint8Array>;
  /** Base URL used only to normalize a relative `<img>` `src` into the `images` lookup key. Never fetched. */
  baseUrl?: string;
}

/** One document in a bounded batch render. */
export interface RenderBatchItem {
  html: HtmlInput;
  data?: RenderData;
  opts?: RenderOptions;
}

/** Batch-level controls for `renderPdfBatch`. */
export interface RenderBatchOptions {
  /**
   * Maximum number of renders active at once. Omitted ⇒ 4, matching Node's default libuv pool size
   * while still keeping JavaScript-side work bounded for large batches.
   */
  concurrency?: number;
}

/**
 * The fully-resolved configuration handed to the bridge. Derived from `RenderOptions` with the
 * deterministic creation-date default applied. This is what the native addon receives.
 */
export interface BridgeRenderOptions {
  metadata: RenderMetadata & { creationDate: string };
  fonts?: Uint8Array[];
  images?: Record<string, Uint8Array>;
  baseUrl?: string;
}

/**
 * The swappable native render boundary. The real `@vellora/native` implements this exact type, so
 * the mock is a drop-in: async, finalized HTML + resolved options in, complete PDF bytes out.
 *
 * Out-of-subset input is signaled by a **rejection** carrying the structured located diagnostic
 * `{ feature, line, col, hint }` (see `UnsupportedDiagnostic`), which the orchestration maps to a
 * `VelloraUnsupportedError`.
 */
export interface NativeBridge {
  render(html: string, options: BridgeRenderOptions): Promise<Uint8Array>;
}
