/**
 * Strict orchestration: run templating output through validation + native render.
 *
 * Strict (default): pass the templated HTML to the bridge **byte-unchanged** and never import or run
 * `@vellora/lint`. Best-effort (`strict: false`): lazily import `@vellora/lint`, run its fixers on
 * the templated HTML, then render the fixer output. Either way, a bridge out-of-subset rejection is
 * mapped to a `VelloraUnsupportedError` carrying the located diagnostic.
 *
 * When `opts` omits a creation date, a FIXED deterministic default is injected (never wall-clock) so
 * identical inputs are byte-identical.
 */
import type { Report, RuleId } from "@vellora/lint";
import {
  VelloraError,
  VelloraInputError,
  VelloraUnsupportedError,
  conformanceFromDiagnostic,
  unsupportedFromDiagnostic,
} from "./errors.js";
import type { BridgeRenderOptions, NativeBridge, RenderOptions } from "./types.js";

/**
 * Map a `@vellora/lint` `RuleId` (kebab-case) onto the SAME colon-namespaced `feature` taxonomy the
 * `vellora-core` strict path emits (`element:<tag>`, `css:<feature>`), so the typed
 * `VelloraUnsupportedError.feature` is identical for a given out-of-subset construct whether it is
 * surfaced via best-effort lint or via the strict/core gate. The `{ feature, line, col, hint }`
 * shape is a single contract; consumers/CI key on `feature`, so the two paths must not
 * diverge.
 */
const RULE_ID_TO_CORE_FEATURE: Record<RuleId, string> = {
  "script-element": "element:script",
  "inline-svg": "element:svg",
  "css-animation": "css:animation",
  "flex-grid-in-td": "css:grid",
  "img-dimension-attrs": "css:img-dimensions",
  "invalid-markup": "html:invalid-markup",
};

/**
 * Fixed default PDF creation date injected when `opts.metadata.creationDate` is omitted. A constant
 * (the project's reference instant), never the host wall-clock, so output is byte-stable. This is
 * what satisfies the `vellora-core` `pdf-output` "Deterministic creation date" precondition.
 */
export const DEFAULT_CREATION_DATE = "2000-01-01T00:00:00.000Z";

/** Inclusive UTC-year range accepted at the public boundary. The napi FFI maps the year to a `u16`
 * (`[year, month, day]`), so a year outside `1..=65535` would otherwise pass public validation yet be
 * silently dropped at the FFI checked-conversion (extended-ISO years run to +275760). Rejecting it
 * here keeps the two validation layers in agreement and turns the failure into a typed
 * `VelloraInputError` instead of a silent FFI drop. */
const MIN_CREATION_YEAR = 1;
const MAX_CREATION_YEAR = 65535;
const SUPPORTED_PDFA_PROFILE = "PDF/A-2b";

/** Validate the exact PDF/A profile supported by this release. */
function validatePdfAProfile(pdfa: string): void {
  if (pdfa !== SUPPORTED_PDFA_PROFILE) {
    throw new VelloraInputError(
      `unsupported pdfa profile ${JSON.stringify(pdfa)}; supported: ${JSON.stringify(SUPPORTED_PDFA_PROFILE)}.`,
    );
  }
}

/**
 * Validate a caller-supplied `creationDate` at the public boundary. The string must be a
 * `Date`-parseable ISO-8601 instant whose UTC year fits the FFI `u16`; an empty, non-parseable, or
 * out-of-`u16`-range value rejects with `VelloraInputError` rather than being forwarded as a `NaN`
 * date (which the core would otherwise coerce to a silently-wrong year-0 date) or silently dropped at
 * the FFI.
 */
function validateCreationDate(creationDate: string): void {
  const date = new Date(creationDate);
  if (creationDate.trim() === "" || Number.isNaN(date.getTime())) {
    throw new VelloraInputError(
      `metadata.creationDate must be a valid ISO-8601 date string; received ${JSON.stringify(creationDate)}.`,
    );
  }
  const year = date.getUTCFullYear();
  if (year < MIN_CREATION_YEAR || year > MAX_CREATION_YEAR) {
    throw new VelloraInputError(
      `metadata.creationDate year must be in ${MIN_CREATION_YEAR}..=${MAX_CREATION_YEAR}; received year ${year} from ${JSON.stringify(creationDate)}.`,
    );
  }
}

/**
 * Validate a caller-supplied `baseUrl` at the public boundary. It is used (in core) only to normalize
 * a relative `<img>` `src` into the `images` lookup key via WHATWG URL join, so it must be a valid
 * absolute base URL; an invalid value rejects with `VelloraInputError` rather than silently failing to
 * resolve every relative image at render time.
 */
function validateBaseUrl(baseUrl: string): void {
  try {
    // `URL` requires an absolute URL with a scheme; a bare path (e.g. "/assets/") throws.
    void new URL(baseUrl);
  } catch {
    throw new VelloraInputError(
      `baseUrl must be a valid absolute URL (with a scheme); received ${JSON.stringify(baseUrl)}.`,
    );
  }
}

/**
 * Shape-check the `images` map at the public boundary so a wrong value type fails loudly here rather
 * than as an opaque error after crossing the FFI. Each value must be the raw image bytes
 * (`Uint8Array`); the key is the `<img>` `src` string it resolves.
 */
function validateImages(images: Record<string, Uint8Array>): void {
  for (const [key, value] of Object.entries(images)) {
    if (!(value instanceof Uint8Array)) {
      throw new VelloraInputError(
        `images[${JSON.stringify(key)}] must be a Uint8Array of image bytes.`,
      );
    }
  }
}

/**
 * Shape-check the `fonts` list at the public boundary so a wrong entry type fails loudly here rather
 * than as an opaque error after crossing the FFI. Each entry must be the raw font-face bytes
 * (`Uint8Array`); the family/weight/style are read from the bytes in core. Whether those bytes are a
 * *parseable* font is a core-side decision (rejected as `font:invalid`); this only guards the JS type.
 */
function validateFonts(fonts: Uint8Array[]): void {
  if (!Array.isArray(fonts)) {
    throw new VelloraInputError("fonts must be an array of Uint8Array font faces.");
  }
  fonts.forEach((face, i) => {
    if (!(face instanceof Uint8Array)) {
      throw new VelloraInputError(`fonts[${i}] must be a Uint8Array of font-face bytes.`);
    }
  });
}

/** Resolve public `RenderOptions` into the fully-resolved config handed to the bridge. */
export function resolveOptions(opts: RenderOptions = {}): BridgeRenderOptions {
  const metadata = opts.metadata ?? {};
  if (metadata.creationDate !== undefined) {
    validateCreationDate(metadata.creationDate);
  }
  const resolved: BridgeRenderOptions = {
    metadata: {
      ...metadata,
      creationDate: metadata.creationDate ?? DEFAULT_CREATION_DATE,
    },
  };
  if (opts.pdfa !== undefined) {
    validatePdfAProfile(opts.pdfa);
    resolved.pdfa = opts.pdfa;
  }
  if (opts.fonts !== undefined) {
    validateFonts(opts.fonts);
    resolved.fonts = opts.fonts;
  }
  if (opts.images !== undefined) {
    validateImages(opts.images);
    resolved.images = opts.images;
  }
  if (opts.baseUrl !== undefined) {
    validateBaseUrl(opts.baseUrl);
    resolved.baseUrl = opts.baseUrl;
  }
  return resolved;
}

/**
 * Best-effort fix: lazily import `@vellora/lint` (only here) and run its fixers on the HTML.
 *
 * `@vellora/lint` is a declared dependency that exports `fix`, so a missing `fix` indicates a real
 * resolution/version/config failure of the requested best-effort operation — fail loudly instead of
 * silently rendering the un-fixed HTML. It must also return the current `{ html, report }`
 * shape; an old/version-skewed `fix` that resolves but returns the old `{ html }` shape would
 * otherwise throw an opaque `TypeError` on `report.findings`, so its return is shape-guarded with the
 * same loud message. The fixer also already computes the residual, non-auto-fixable findings;
 * rather than discard them and rely on a later core gate, surface the first error-severity finding as
 * the same typed `VelloraUnsupportedError` the core path uses, normalized to the core `feature`
 * taxonomy.
 */
async function applyFixers(html: string): Promise<string> {
  const lint = await import("@vellora/lint");
  const fix = (
    lint as {
      fix?: (
        html: string,
      ) => { html: string; report: Report } | Promise<{ html: string; report: Report }>;
    }
  ).fix;
  if (typeof fix !== "function") {
    throw new VelloraError("best-effort mode requested but @vellora/lint.fix is unavailable");
  }
  const result = await fix(html);
  // Guard the return SHAPE before dereferencing `report.findings`: the static cast above makes the
  // structural fields look total to tsc, but a mis-resolved/old-version `fix` could resolve and
  // return a different runtime shape. Fail loudly with a meaningful message instead of leaking a raw
  // `TypeError: Cannot read properties of undefined (reading 'findings')`.
  if (
    !result ||
    typeof result.html !== "string" ||
    !result.report ||
    !Array.isArray(result.report.findings)
  ) {
    throw new VelloraError(
      "best-effort mode requested but @vellora/lint.fix returned an unexpected shape",
    );
  }
  // The fixer already located every remaining, non-auto-fixable diagnostic. Surface the first
  // error-severity one as the typed error contract rather than dropping it. Normalize
  // the lint `RuleId` to the core `feature` taxonomy so the best-effort and strict/core paths emit the
  // IDENTICAL `feature` for the same construct. The lint `location` is in the FIXED/re-serialized
  // output coordinate space (see `@vellora/lint.fix`), but the caller holds the ORIGINAL HTML and the
  // orchestrator has no mapping back, so report `null` line/col rather than a coordinate that may point
  // into the rewritten document — matching the core path's honest-None behavior.
  const unfixable = result.report.findings.find((f) => f.severity === "error" && !f.applied);
  if (unfixable) {
    throw new VelloraUnsupportedError({
      feature: RULE_ID_TO_CORE_FEATURE[unfixable.rule] ?? unfixable.rule,
      line: null,
      col: null,
      hint: unfixable.suggestedFix,
    });
  }
  return result.html;
}

/**
 * Drive validation + native render for already-templated HTML.
 *
 * @param html finalized HTML from the templating engine.
 * @param opts public render options (default strict).
 * @param bridge the swappable native render boundary.
 */
export async function orchestrate(
  html: string,
  opts: RenderOptions,
  bridge: NativeBridge,
): Promise<Uint8Array> {
  const resolved = resolveOptions(opts);
  const strict = opts.strict !== false;

  try {
    // `applyFixers` runs inside the try so any fixer crash (e.g. a resvg rasterize failure) is
    // mapped to a typed Vellora error instead of escaping as a bare `Error`.
    const finalHtml = strict ? html : await applyFixers(html);
    return await bridge.render(finalHtml, resolved);
  } catch (reason) {
    const unsupported = unsupportedFromDiagnostic(reason);
    if (unsupported) {
      throw unsupported;
    }
    const conformance = conformanceFromDiagnostic(reason);
    if (conformance) {
      throw conformance;
    }
    // Already-typed Vellora errors propagate unchanged; anything else (e.g. a raw fixer/resvg
    // crash) is wrapped so the public contract never leaks a bare `Error`.
    if (reason instanceof VelloraError) {
      throw reason;
    }
    throw new VelloraError(reason instanceof Error ? reason.message : String(reason));
  }
}
