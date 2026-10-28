// Render WPT nodes with vellora (product renderPdf through the harness preparation) and with
// Chrome for Testing (same print path as fidelity/wpt/lib/chrome.mjs), rasterize every page at
// 96 dpi with pdftocairo, write PNGs + a per-page pixel diff count.
// usage: node both.mjs <repo> <outDir> <mode screen|print> <rel> [<rel>...]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const [repo, outDir, mode, ...rels] = process.argv.slice(2);
const wptRoot = process.env.ROOT ?? join(repo, "fidelity/.cache/wpt");
const lib = (f) => pathToFileURL(join(repo, "fidelity/wpt/lib", f)).href;
const { startServer } = await import(lib("chrome.mjs"));
const { makeVelloraRender } = await import(lib("vellora-render.mjs"));
const { WPT_ORIGIN } = await import(lib("discover.mjs"));
const req = createRequire(join(repo, "fidelity/wpt/package.json"));
const puppeteer = (await import(pathToFileURL(req.resolve("puppeteer-core")).href)).default;
const vellora = await import(pathToFileURL(join(repo, "packages/vellora/dist/index.js")).href);
const render = makeVelloraRender({
  vellora,
  wptRoot,
  bundledFontsDir: join(repo, "crates/vellora-core/src/fonts"),
});
const chromePath = join(
  repo,
  "fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
);
const { server, origin } = await startServer(wptRoot);
const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: [
    "--font-render-hinting=none",
    "--disable-lcd-text",
    "--force-color-profile=srgb",
    "--hide-scrollbars",
  ],
});
const page = await browser.newPage();
mkdirSync(outDir, { recursive: true });
const raster = (pdfFile, prefix) => {
  execFileSync("pdftocairo", ["-png", "-r", "96", pdfFile, prefix]);
};
for (const rel of rels) {
  const name = basename(rel).replace(/[^\w.-]/g, "_");
  const content = readFileSync(join(wptRoot, rel), "utf8");
  const { pdf } = await render({ url: `${WPT_ORIGIN}/${rel}`, rel, content, mode });
  writeFileSync(join(outDir, `${name}.vellora.pdf`), pdf);
  raster(join(outDir, `${name}.vellora.pdf`), join(outDir, `${name}.vellora`));
  await page.emulateMediaType(mode);
  await page.setViewport(
    mode === "screen" ? { width: 800, height: 600 } : { width: 480, height: 288 },
  );
  await page.goto(`${origin}/${rel}`, { waitUntil: "load" });
  const cpdf = await page.pdf(
    mode === "screen"
      ? {
          width: "800px",
          height: "600px",
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          printBackground: true,
          preferCSSPageSize: false,
        }
      : {
          width: "5in",
          height: "3in",
          margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
          printBackground: true,
          preferCSSPageSize: true,
        },
  );
  writeFileSync(join(outDir, `${name}.chrome.pdf`), cpdf);
  raster(join(outDir, `${name}.chrome.pdf`), join(outDir, `${name}.chrome`));
  const pages = (f) =>
    execFileSync("pdfinfo", [f])
      .toString()
      .match(/Pages:\s+(\d+)/)[1];
  console.log(
    rel,
    "vellora pages",
    pages(join(outDir, `${name}.vellora.pdf`)),
    "chrome pages",
    pages(join(outDir, `${name}.chrome.pdf`)),
  );
}
await browser.close();
server.close();
