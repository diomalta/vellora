// THE Chromium reference setup of fidelity/ (ACCEPTANCE.md "Reference"): one font alias table and
// one puppeteer-core driver, shared by the corpus (corpus/lib/chrome-ref.mjs), the oracles
// (oracles/lib/html-prep.mjs, oracles/lib/chrome.mjs) and layout-diff (layout-diff/lib/fonts.mjs,
// chrome-snapshot.mjs, pdf-probe.mjs). Before 2026-10-21 there were three alias tables (the
// oracles' and layout-diff's lacked Helvetica, so Chrome drew oss-postmark-receipt with SYSTEM
// Helvetica: layout-diff input parity failed) and two print drivers (corpus: Chrome CLI
// --print-to-pdf; oracles/layout-diff: page.pdf).
//
// Every alias maps a CSS family to the SAME .ttf files vellora embeds via include_bytes!
// (crates/vellora-core/src/fonts/), so both engines shape with identical font files. The table is a
// SUPERSET of benchmarks/visual-fidelity.mjs FONT_ALIASES (that module runs main() on import, so it
// is read as text by the drift tests: every benchmark alias must map to the same file here).
// Families are added only when a fixture names them and vellora resolves them to the bundled face
// (vellora never consults system fonts: an unknown family falls back to the bundled default).
// puppeteer-core never downloads a browser; the executable is explicit (local Chrome is INDICATIVE,
// CI pins a Chrome for Testing build).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BUNDLED_FONT_DIR = join(REPO_ROOT, "crates", "vellora-core", "src", "fonts");
export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const FONT_ALIASES = Object.freeze([
  {
    families: [
      "Vellora Sans",
      "Inter",
      "Helvetica Neue",
      "Helvetica",
      "Arial",
      "Liberation Sans",
      "Nunito Sans",
      "Tahoma",
    ],
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

/** Launch flags of every reference Chrome (union of the former oracles + layout-diff flags). */
export const CHROME_ARGS = Object.freeze([
  "--no-sandbox",
  "--disable-dev-shm-usage",
  "--font-render-hinting=none",
  "--hide-scrollbars",
]);

/** page.pdf options of every reference print (A4 unless the document's @page says otherwise). */
export const PRINT_OPTIONS = Object.freeze({
  format: "A4",
  preferCSSPageSize: true,
  printBackground: true,
});

const cssCache = new Map();

/** @font-face rules mapping every aliased family onto the bundled Liberation files (data: URLs). */
export function bundledFontFaceCss(fontDir = BUNDLED_FONT_DIR) {
  if (cssCache.has(fontDir)) return cssCache.get(fontDir);
  const url = (file) =>
    `data:font/ttf;base64,${readFileSync(join(fontDir, file)).toString("base64")}`;
  const rules = [];
  for (const alias of FONT_ALIASES) {
    const regular = url(alias.regular);
    const bold = url(alias.bold);
    for (const family of alias.families) {
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${regular}) format("truetype"); font-weight: 400; font-style: normal; }`,
      );
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${bold}) format("truetype"); font-weight: 700; font-style: normal; }`,
      );
    }
  }
  const css = rules.join("\n");
  cssCache.set(fontDir, css);
  return css;
}

/** The alias (families + weight) that reaches a bundled face file, or null (DejaVu, bullets). */
export function aliasFor(face) {
  for (const alias of FONT_ALIASES) {
    if (face === alias.regular) return { families: alias.families, weight: 400 };
    if (face === alias.bold) return { families: alias.families, weight: 700 };
  }
  return null;
}

const MIME_BY_EXTENSION = [
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
];

/** Replace relative `<img src>` values that point at existing local files with data: URLs. */
export function inlineLocalImageSources(html, baseDir) {
  return html.replace(/\bsrc=(["'])([^"']+)\1/gi, (match, quote, src) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(src)) return match;
    const imagePath = resolve(baseDir, src);
    const lower = imagePath.toLowerCase();
    const mime = MIME_BY_EXTENSION.find(([ext]) => lower.endsWith(ext))?.[1];
    if (!mime || !existsSync(imagePath)) return match;
    return `src=${quote}data:${mime};base64,${readFileSync(imagePath).toString("base64")}${quote}`;
  });
}

export function injectIntoHead(html, markup) {
  if (!/<head[^>]*>/i.test(html)) return `<head>\n${markup}\n</head>\n${html}`;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${markup}`);
}

/**
 * HTML for a reference engine (Chrome, WeasyPrint): the exact templated HTML vellora received,
 * local images inlined, a `<base>` (so any other relative URL resolves the same way) and the
 * bundled-font `@font-face` block. `injectFonts: false` is for HTML that ships its own fonts.
 */
export function referenceHtml(templatedHtml, { baseDir, injectFonts = true, fontDir } = {}) {
  let html = baseDir ? inlineLocalImageSources(templatedHtml, baseDir) : templatedHtml;
  if (baseDir && !/<base[\s>]/i.test(html)) {
    html = injectIntoHead(html, `    <base href="${pathToFileURL(`${baseDir}/`).href}">`);
  }
  if (injectFonts) {
    html = injectIntoHead(
      html,
      `    <style data-vellora-oracle-fonts>\n${bundledFontFaceCss(fontDir)}\n    </style>`,
    );
  }
  return html;
}

export function resolveChrome(explicit) {
  const path =
    explicit ??
    process.env.VELLORA_FIDELITY_CHROME ??
    process.env.VELLORA_ORACLE_CHROME ??
    process.env.VELLORA_CHROME ??
    DEFAULT_CHROME;
  if (!existsSync(path)) {
    throw new Error(
      `Chrome not found at ${path}. Pass --chrome <path> or set VELLORA_FIDELITY_CHROME (CI: a pinned Chrome for Testing via @puppeteer/browsers).`,
    );
  }
  return path;
}

/** Launch the reference Chrome. Returns { browser, executablePath, version, userAgent, close }. */
export async function launchReferenceChrome(executablePath = resolveChrome()) {
  const { default: puppeteer } = await import("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [...CHROME_ARGS],
  });
  return {
    browser,
    executablePath,
    version: await browser.version(),
    userAgent: await browser.userAgent(),
    async close() {
      await browser.close();
    },
  };
}

/** Run `fn(page)` on a print-media page holding `html`, fonts loaded. */
export async function withPrintPage(chromeOrBrowser, html, fn) {
  const browser =
    typeof chromeOrBrowser.newPage === "function" ? chromeOrBrowser : chromeOrBrowser.browser;
  const page = await browser.newPage();
  try {
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "load", timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    return await fn(page);
  } finally {
    await page.close();
  }
}

/** Chrome's print-to-PDF of `html` (the ONE print path of every Chromium PDF reference). */
export function printPdf(chromeOrBrowser, html) {
  return withPrintPage(
    chromeOrBrowser,
    html,
    async (page) => new Uint8Array(await page.pdf(PRINT_OPTIONS)),
  );
}

/** `document.body.innerText` under print media (no @page margin boxes, by definition). */
export function printInnerText(chromeOrBrowser, html) {
  return withPrintPage(chromeOrBrowser, html, (page) =>
    page.evaluate(() => document.body.innerText),
  );
}
