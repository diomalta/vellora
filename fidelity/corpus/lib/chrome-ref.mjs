// Chromium reference renderer for the corpus (INDICATIVE locally; see fidelity/ACCEPTANCE.md).
// Uses the Chrome CLI (--headless --print-to-pdf) instead of puppeteer-core so the corpus adds no
// npm dependency to fidelity/package.json (owned by another area). CI should pin a Chrome for
// Testing build via @puppeteer/browsers and pass its path in VELLORA_CHROME.
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Family -> bundled Liberation face, so Chrome lays text out with the same font files vellora
 * embeds (crates/vellora-core/src/fonts). Mirrors FONT_ALIASES in benchmarks/visual-fidelity.mjs
 * (replicated, not imported: that module runs its main on import).
 */
export const FONT_ALIASES = [
  {
    families: ["Liberation Sans", "Arial", "Helvetica", "Helvetica Neue", "Nunito Sans", "Tahoma"],
    regular: "LiberationSans-Regular.ttf",
    bold: "LiberationSans-Bold.ttf",
  },
  {
    families: ["Liberation Serif", "Times New Roman", "Georgia"],
    regular: "LiberationSerif-Regular.ttf",
    bold: "LiberationSerif-Bold.ttf",
  },
  {
    families: ["Liberation Mono", "Courier New", "Menlo", "Consolas"],
    regular: "LiberationMono-Regular.ttf",
    bold: "LiberationMono-Bold.ttf",
  },
];

export function fontFaceCss(fontDir) {
  const rules = [];
  for (const alias of FONT_ALIASES) {
    const regular = pathToFileURL(join(fontDir, alias.regular)).href;
    const bold = pathToFileURL(join(fontDir, alias.bold)).href;
    for (const family of alias.families) {
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${JSON.stringify(regular)}); font-weight: 400; }`,
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${JSON.stringify(bold)}); font-weight: 700; }`,
      );
    }
  }
  return rules.join("\n");
}

/** Inject the font aliases and a <base> (for relative asset URLs) right after <head>. */
export function prepareReferenceHtml(html, { fontDir, baseDir }) {
  const base = pathToFileURL(`${baseDir}/`).href;
  const inject = `<base href="${base}"><style>${fontFaceCss(fontDir)}</style>`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}${inject}`);
  }
  return `${inject}${html}`;
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
  const work = mkdtempSync(join(tmpdir(), "vellora-corpus-chrome-"));
  try {
    const htmlPath = join(work, "reference.html");
    writeFileSync(htmlPath, html);
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--allow-file-access-from-files",
      `--user-data-dir=${join(work, "profile")}`,
      "--no-pdf-header-footer",
      "--virtual-time-budget=5000",
      `--print-to-pdf=${outPdf}`,
      pathToFileURL(htmlPath).href,
    ];
    await execFileAsync(chrome, args, { timeout: 120_000 });
    return { command: [chrome, ...args.slice(0, -2), "--print-to-pdf=<out>", "<html>"].join(" ") };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
