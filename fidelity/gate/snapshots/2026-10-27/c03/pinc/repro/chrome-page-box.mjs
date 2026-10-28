#!/usr/bin/env node
// Phase C step 03 repro (Chrome only): where Chrome's print path puts the content box and how wide
// it lays the document out, for each `@page` declaration block given. Each probe is a 10 px tall
// full-width red bar, left/right/centre-aligned text, a 200.6 px blue box at margin-left 100.3 px,
// a two-cell table and (`--rtl`) an rtl root. PDFs go to <out>/<n>.pdf; read them with
// pdf-geometry.py.
//
//   node chrome-page-box.mjs --chrome <Chrome for Testing 155.0.8059.85> --out <dir> [--rtl] \
//     "size: A4; margin: 16mm" "size: letter; margin: 16mm" ...
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const require = createRequire(resolve(REPO, "fidelity/package.json"));
const puppeteer = require("puppeteer-core");
const ref = await import(resolve(REPO, "fidelity/lib/chrome-reference.mjs"));

const args = process.argv.slice(2);
const take = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args.splice(i, 2)[1] : undefined;
};
const chrome = take("--chrome") ?? process.env.VELLORA_FIDELITY_CHROME;
const out = take("--out") ?? "page-box-out";
const rtlIdx = args.indexOf("--rtl");
const rtl = rtlIdx >= 0;
if (rtl) args.splice(rtlIdx, 1);
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: [...ref.CHROME_ARGS],
});
const index = [];
for (const [n, rule] of args.entries()) {
  const html = `<!doctype html><html${rtl ? ' dir="rtl"' : ""}><head><style>
@page { ${rule} }
html,body{margin:0;padding:0}
body{font-family:"Liberation Sans";font-size:12pt;line-height:20px}
.bar{height:10px;background:#f00}
.l{text-align:left}.r{text-align:right}.c{text-align:center}
.box{margin-left:100.3px;width:200.6px;height:10px;background:#00f}
</style></head><body><div class="bar"></div><div class="l">LEFTxx</div><div class="r">RIGHTxx</div><div class="c">CENTERxx</div><div class="box"></div><table style="width:100%;border-collapse:collapse"><tr><td style="padding:0">TL</td><td style="padding:0;text-align:right">TR</td></tr></table></body></html>`;
  const pdf = await ref.printPdf(
    browser,
    ref.injectIntoHead(html, `<style>${ref.bundledFontFaceCss()}</style>`),
  );
  writeFileSync(`${out}/${n}.pdf`, pdf);
  index.push({ n, rule, rtl, file: `${n}.pdf` });
}
writeFileSync(
  `${out}/index.json`,
  JSON.stringify({ chrome: await browser.version(), probes: index }, null, 1),
);
await browser.close();
