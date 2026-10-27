// node chrome.mjs <worktree> <chromePath> <outdir>: Chrome rects of #t, tr, td, #after per variant.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const [wt, chromePath, out] = process.argv.slice(2);
const ref = await import(pathToFileURL(join(wt, "fidelity/lib/chrome-reference.mjs")).href);
const { VARIANTS } = await import(pathToFileURL(join(import.meta.dirname, "variants.mjs")).href);
mkdirSync(out, { recursive: true });
const chrome = await ref.launchReferenceChrome(chromePath);
const res = { chrome: chrome.version, variants: {} };
for (const [id, html] of Object.entries(VARIANTS)) {
  writeFileSync(join(out, `${id}.html`), html);
  const page = await chrome.browser.newPage();
  await page.setViewport({ width: 672, height: 1001 });
  await page.emulateMediaType("print");
  await page.setContent(ref.referenceHtml(html), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  res.variants[id] = await page.evaluate(() =>
    [...document.querySelectorAll("[id]")].map((e) => {
      const r = e.getBoundingClientRect();
      const out = { id: e.id, y: r.y, h: r.height };
      if (e.tagName === "TD" && e.firstChild) {
        const rg = document.createRange();
        rg.selectNodeContents(e);
        out.textTop = rg.getClientRects()[0]?.y;
      }
      return out;
    }),
  );
  await page.close();
}
await chrome.close();
writeFileSync(join(out, "chrome.json"), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
