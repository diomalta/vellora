// Chromium reference renderer for the corpus (INDICATIVE locally; see fidelity/ACCEPTANCE.md).
// Since 2026-10-21 this is the ONE shared reference setup (fidelity/lib/chrome-reference.mjs):
// the same font alias table and the same puppeteer-core print path (print media, fonts awaited,
// page.pdf A4 / preferCSSPageSize / printBackground) as the oracles and layout-diff. It replaced a
// Chrome CLI `--print-to-pdf` driver with its own alias table (the corpus could disagree with the
// oracles about what "Chrome's rendering" of the same HTML is). CI should pin a Chrome for Testing
// build via @puppeteer/browsers and pass its path in VELLORA_CHROME.
import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";
import { promisify } from "node:util";
import {
  DEFAULT_CHROME,
  FONT_ALIASES,
  PRINT_OPTIONS,
  bundledFontFaceCss,
  launchReferenceChrome,
  printPdf,
  referenceHtml,
} from "../../lib/chrome-reference.mjs";

const execFileAsync = promisify(execFile);

export { DEFAULT_CHROME, FONT_ALIASES };

/** The shared @font-face block for the bundled files in `fontDir`. */
export function fontFaceCss(fontDir) {
  return bundledFontFaceCss(fontDir);
}

/** Inline local images, inject a <base> (other relative URLs) and the font aliases. */
export function prepareReferenceHtml(html, { fontDir, baseDir }) {
  return referenceHtml(html, { baseDir, fontDir });
}

export async function chromeVersion(chrome = process.env.VELLORA_CHROME || DEFAULT_CHROME) {
  const { stdout } = await execFileAsync(chrome, ["--version"]);
  return stdout.trim();
}

export async function chromePrintToPdf(
  html,
  outPdf,
  chrome = process.env.VELLORA_CHROME || DEFAULT_CHROME,
) {
  const ref = await launchReferenceChrome(chrome);
  try {
    writeFileSync(outPdf, await printPdf(ref, html));
    return {
      command: `puppeteer-core ${ref.version} page.pdf(${JSON.stringify(PRINT_OPTIONS)}) (fidelity/lib/chrome-reference.mjs)`,
    };
  } finally {
    await ref.close();
  }
}
