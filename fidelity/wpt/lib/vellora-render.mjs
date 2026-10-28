// Render adapter: one prepared WPT node through vellora's real public pipeline
// (`renderPdf`, strict: true, the built napi addon). Engine rejections are classified into the
// runner's outcome taxonomy without interpreting them.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { WPT_ORIGIN } from "./discover.mjs";
import { directoryCoverage, prepareNode } from "./prepare.mjs";
import { isXmlServed } from "./xhtml-bridge.mjs";

/**
 * Codepoints covered by vellora's bundled faces (crates/vellora-core/src/fonts of the build being
 * measured), or null when that directory is absent (coverage is then recorded as not checked).
 */
export function bundledCoverage(dir) {
  if (!dir || !existsSync(dir)) return null;
  const set = directoryCoverage(dir, readdirSync, readFileSync);
  return set.size ? set : null;
}

/** Drop empty fields so per-test records stay small. */
export function compactInfo(info) {
  const out = {};
  for (const [k, v] of Object.entries(info)) {
    if (v === null || v === false || v === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  // `fonts` always contains Ahem; keep only the extra faces to keep records small.
  if (Array.isArray(out.fonts)) {
    const extra = out.fonts.filter((f) => f.file !== "fonts/Ahem.ttf");
    if (extra.length) out.fonts = extra;
    else out.fonts = undefined;
  }
  out.cssSources = undefined;
  if (out.glyphCoverage === "checked") out.glyphCoverage = undefined;
  return out;
}

/** Map a vellora rejection onto { status, kind?, feature?, ... }. */
export function classifyVelloraError(err) {
  const name = err?.name ?? "";
  const message = String(err?.message ?? err);
  if (name === "VelloraUnsupportedError") {
    return { status: "unsupported", feature: err.feature, line: err.line, col: err.col };
  }
  if (name === "VelloraTemplateError") return { status: "error", kind: "template", message };
  if (name === "VelloraInputError") return { status: "error", kind: "input", message };
  if (name === "VelloraConformanceError") return { status: "error", kind: "conformance", message };
  if (/panic/i.test(message)) return { status: "error", kind: "panic", message };
  if (name.startsWith("Vellora") || err?.code) return { status: "error", kind: "render", message };
  return { status: "error", kind: "harness", message: String(err?.stack ?? message) };
}

/**
 * Build the engine render function for the shared loader.
 * `vellora` is the imported module (so a different build can be injected). `xhtmlBridge`, when
 * given (lib/xhtml-bridge.mjs), renders the nodes WPT serves as XML (`.xht`/`.xhtml`/`.xml`) with
 * vellora-core's XML parse, as Chrome parses them; every other node goes through the product
 * bridge (the napi addon), which parses HTML.
 *
 * `rawBridges` (`run.mjs --raw`), when given, `{ html, xml }`, replaces both: EVERY node goes
 * through `renderPdf` with the raw-Blitz bridge of its parser (`xml` for an XML-served node when
 * that bridge exists, else `html`), i.e. `vellora_core::debug_render_raw_blitz`. Preparation,
 * templating, the strict orchestration and the error mapping stay the product's.
 */
export function makeVelloraRender({
  vellora,
  wptRoot,
  inlineCss = true,
  bundledFontsDir = null,
  xhtmlBridge = null,
  rawBridges = null,
}) {
  const baseCoverage = bundledCoverage(bundledFontsDir);
  return async function render({ url, rel, content, mode }) {
    const nodeUrl = url.startsWith("about:") ? `${WPT_ORIGIN}/about-blank.html` : url;
    const prepared = prepareNode({
      wptRoot,
      rel: rel ?? "about-blank.html",
      url: nodeUrl,
      content,
      mode,
      inlineCss,
      baseCoverage,
    });
    const xml = xhtmlBridge !== null && isXmlServed(rel);
    let bridge = xml ? xhtmlBridge : null;
    if (rawBridges) bridge = (isXmlServed(rel) && rawBridges.xml) || rawBridges.html;
    let pdf;
    try {
      pdf = await vellora.renderPdf(prepared.html, undefined, {
        strict: true,
        fonts: prepared.fonts,
        images: prepared.images,
        baseUrl: prepared.baseUrl,
        ...(bridge ? { _bridge: bridge } : {}),
      });
    } catch (err) {
      throw classifyVelloraError(err);
    }
    return { pdf, info: compactInfo(prepared.info) };
  };
}
