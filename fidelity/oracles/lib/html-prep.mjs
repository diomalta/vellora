// HTML preparation shared by every oracle: template a fixture, inline its local images, and
// give the reference engines (Chrome, WeasyPrint) the SAME font files vellora bundles.
//
// FONT_ALIASES is a COPY of the table in benchmarks/visual-fidelity.mjs (lines 18-34 at commit
// 20970ca). It is copied, not imported, because importing that module runs its harness
// (top-level main()) and rmSync()s benchmarks/results/visual-fidelity. test/html-prep.test.mjs
// re-reads the benchmarks file as TEXT and fails if the two tables drift apart.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "./paths.mjs";

export const BUNDLED_FONT_DIR = join(REPO_ROOT, "crates", "vellora-core", "src", "fonts");

export const FONT_ALIASES = Object.freeze([
  {
    families: ["Vellora Sans", "Inter", "Helvetica Neue", "Arial", "Liberation Sans"],
    regular: "LiberationSans-Regular.ttf",
    bold: "LiberationSans-Bold.ttf",
  },
  {
    families: ["Liberation Serif", "Georgia", "Times New Roman"],
    regular: "LiberationSerif-Regular.ttf",
    bold: "LiberationSerif-Bold.ttf",
  },
  {
    families: ["Vellora Mono", "Liberation Mono", "Menlo", "Consolas", "Courier New"],
    regular: "LiberationMono-Regular.ttf",
    bold: "LiberationMono-Bold.ttf",
  },
]);

export const FIXTURE_IDS = Object.freeze(["invoice", "receipt", "boleto", "notification"]);

/** Fixed creation date so a fixture render is byte-reproducible (determinism invariant). */
export const FIXED_CREATION_DATE = "2026-06-25T00:00:00.000Z";

const MIME_BY_EXTENSION = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
]);

function imageMimeType(path) {
  const lower = path.toLowerCase();
  for (const [extension, mime] of MIME_BY_EXTENSION) {
    if (lower.endsWith(extension)) {
      return mime;
    }
  }
  return null;
}

/** Replace relative `<img src>` values that point at existing local files with data: URLs. */
export function inlineLocalImageSources(html, baseDir) {
  return html.replace(/\bsrc=(["'])([^"']+)\1/gi, (match, quote, src) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(src)) {
      return match;
    }
    const imagePath = resolve(baseDir, src);
    const mimeType = imageMimeType(imagePath);
    if (!mimeType || !existsSync(imagePath)) {
      return match;
    }
    const data = readFileSync(imagePath).toString("base64");
    return `src=${quote}data:${mimeType};base64,${data}${quote}`;
  });
}

function injectIntoHead(html, markup) {
  if (!/<head[^>]*>/i.test(html)) {
    return `<head>\n${markup}\n</head>\n${html}`;
  }
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${markup}`);
}

function fontDataUrl(fileName) {
  const bytes = readFileSync(join(BUNDLED_FONT_DIR, fileName)).toString("base64");
  return `data:font/ttf;base64,${bytes}`;
}

let cachedFontCss;

/** @font-face rules mapping every aliased family onto vellora's bundled Liberation files. */
export function bundledFontFaceCss() {
  if (cachedFontCss) {
    return cachedFontCss;
  }
  const rules = [];
  for (const alias of FONT_ALIASES) {
    const regular = fontDataUrl(alias.regular);
    const bold = fontDataUrl(alias.bold);
    for (const family of alias.families) {
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${regular}) format("truetype"); font-weight: 400; font-style: normal; }`,
      );
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${bold}) format("truetype"); font-weight: 700; font-style: normal; }`,
      );
    }
  }
  cachedFontCss = rules.join("\n");
  return cachedFontCss;
}

/**
 * HTML for the reference engines: the exact templated HTML vellora received, plus a `<base>`
 * (so any non-inlined relative URL resolves the same way) and the bundled-font `@font-face`
 * block. `injectFonts: false` is for caller HTML that already ships its own fonts.
 */
export function referenceEngineHtml(templatedHtml, { baseDir, injectFonts = true } = {}) {
  let html = templatedHtml;
  if (baseDir && !/<base[\s>]/i.test(html)) {
    html = injectIntoHead(html, `    <base href="${pathToFileURL(`${baseDir}/`).href}">`);
  }
  if (injectFonts) {
    html = injectIntoHead(
      html,
      `    <style data-vellora-oracle-fonts>\n${bundledFontFaceCss()}\n    </style>`,
    );
  }
  return html;
}

/** Load a repo fixture (template + data) without rendering it. */
export function loadFixture(id) {
  const dir = join(REPO_ROOT, "fixtures", id);
  return {
    id,
    dir,
    template: readFileSync(join(dir, "index.html"), "utf8"),
    data: JSON.parse(readFileSync(join(dir, "data.json"), "utf8")),
  };
}

/** Template a fixture with vellora's own engine and inline its images (what vellora renders). */
export function templatedFixtureHtml(fixture, renderTemplate) {
  return inlineLocalImageSources(renderTemplate(fixture.template, fixture.data), fixture.dir);
}
