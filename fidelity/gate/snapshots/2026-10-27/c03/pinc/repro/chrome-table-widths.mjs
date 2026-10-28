#!/usr/bin/env node
// Phase C step 03 repro (Chrome only): cell widths of a table in Chrome's DOM at a viewport width
// (print media, bundled faces), once as authored and once per extra CSS block, e.g. the table at
// `width: max-content` (its columns' max-content widths). At Chrome's print layout width (A4 at
// 16 mm: 673 px) the DOM equals the print layout (checked against the PDF in the README).
//
//   node chrome-table-widths.mjs --chrome <CfT> <file.html> <table selector> <viewport px> \
//     ["table.items{width:max-content !important}" ...]
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const require = createRequire(resolve(REPO, "fidelity/package.json"));
const puppeteer = require("puppeteer-core");
const ref = await import(resolve(REPO, "fidelity/lib/chrome-reference.mjs"));

const args = process.argv.slice(2);
const ci = args.indexOf("--chrome");
const chrome = ci >= 0 ? args.splice(ci, 2)[1] : process.env.VELLORA_FIDELITY_CHROME;
const [file, selector, viewport, ...extras] = args;
const source = readFileSync(file, "utf8");
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: [...ref.CHROME_ARGS],
});
console.log(await browser.version());
for (const extra of ["", ...extras]) {
  const page = await browser.newPage();
  await page.setViewport({ width: Number(viewport), height: 1000, deviceScaleFactor: 1 });
  await page.emulateMediaType("print");
  const html = ref.injectIntoHead(
    source,
    `<style>${ref.bundledFontFaceCss()}</style><style>${extra}</style>`,
  );
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const r = await page.evaluate((sel) => {
    const t = document.querySelector(sel);
    return {
      table: t.getBoundingClientRect().width,
      rows: [...t.rows]
        .slice(0, 3)
        .map((row) =>
          [...row.cells].map((c) => Math.round(c.getBoundingClientRect().width * 1000) / 1000),
        ),
    };
  }, selector);
  console.log(JSON.stringify(extra), r.table, JSON.stringify(r.rows));
  await page.close();
}
await browser.close();
