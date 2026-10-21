// Fixture -> HTML preparation, mirroring benchmarks/visual-fidelity.mjs exactly so the layout diff
// sees the same bytes the visual/geometry harnesses render:
//   renderTemplate(html, data) -> inline local <img> sources as data: URLs  => "native" HTML
//   native HTML + <base> + bundled-font @font-face block in <head>          => "browser" HTML
// The browser-only additions live in <head>, so DOM paths under <body> are identical on both sides.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { bundledFontFaceCss } from "./fonts.mjs";

export const FIXTURE_IDS = ["invoice", "receipt", "boleto", "notification"];

/** Same constant as benchmarks/visual-fidelity.mjs (FIXED_CREATION_DATE). */
export const FIXED_CREATION_DATE = "2026-06-25T00:00:00.000Z";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

export function loadFixture(id, root = repoRoot) {
  const dir = join(root, "fixtures", id);
  const htmlPath = join(dir, "index.html");
  const dataPath = join(dir, "data.json");
  if (!existsSync(htmlPath) || !existsSync(dataPath)) {
    throw new Error(`Fixture "${id}" is missing index.html or data.json at ${dir}`);
  }
  return {
    id,
    dir,
    html: readFileSync(htmlPath, "utf8"),
    data: JSON.parse(readFileSync(dataPath, "utf8")),
  };
}

function imageMimeType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return null;
}

/** Copy of benchmarks/visual-fidelity.mjs inlineLocalImageSources (not exported there). */
export function inlineLocalImageSources(html, fixtureDir) {
  return html.replace(/\bsrc=(["'])([^"']+)\1/gi, (match, quote, src) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(src)) {
      return match;
    }
    const imagePath = resolve(fixtureDir, src);
    if (!existsSync(imagePath)) {
      return match;
    }
    const mimeType = imageMimeType(imagePath);
    if (!mimeType) {
      return match;
    }
    const data = readFileSync(imagePath).toString("base64");
    return `src=${quote}data:${mimeType};base64,${data}${quote}`;
  });
}

/** Marker attribute of the injected font block (checked by lib/checks.mjs). */
export const FONT_STYLE_MARKER = "data-vellora-fidelity-fonts";

/**
 * Insert `markup` right after the opening <head> tag. Throws when there is no <head> tag: a silent
 * no-op would let Chromium fall back to system fonts (the font-parity failure mode).
 */
function injectIntoHead(html, markup) {
  if (!/<head(\s[^>]*)?>/i.test(html)) {
    throw new Error(
      "browserHtmlFor: no <head> tag to inject the bundled @font-face block into; Chromium would fall back to system fonts (font parity lost). Add a <head> to the fixture.",
    );
  }
  return html.replace(/<head(\s[^>]*)?>/i, (tag) => `${tag}\n${markup}`);
}

/** Browser-side HTML: <base> + bundled @font-face block, both inside <head> only. */
export function browserHtmlFor(nativeHtml, fixtureDir, root = repoRoot) {
  let html = nativeHtml;
  if (!/<base[\s>]/i.test(html)) {
    html = injectIntoHead(html, `    <base href="${pathToFileURL(`${fixtureDir}/`).href}">`);
  }
  return injectIntoHead(
    html,
    `    <style ${FONT_STYLE_MARKER}>\n${bundledFontFaceCss(root)}\n    </style>`,
  );
}

/**
 * Build both HTML variants for a fixture. `renderTemplate` comes from the built `vellora` package
 * (npm run build); it is injected so tests can stub it.
 */
export function prepareFixture(id, renderTemplate, root = repoRoot) {
  const fixture = loadFixture(id, root);
  const templated = renderTemplate(fixture.html, fixture.data);
  const nativeHtml = inlineLocalImageSources(templated, fixture.dir);
  return {
    id,
    dir: fixture.dir,
    nativeHtml,
    browserHtml: browserHtmlFor(nativeHtml, fixture.dir, root),
  };
}
