// usage: node chrome-rects.mjs <repo root> <file.html>...
// Loads each file in Chrome for Testing 155 (print media, 800x600) and prints the border-box
// rects of every element carrying an id, plus the rect of each non-blank text node directly in
// them. Bundled Liberation fonts are added as @font-face (the same .ttf files vellora embeds).
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [root, ...files] = process.argv.slice(2);
const { default: puppeteer } = await import(
  pathToFileURL(
    join(root, "fidelity/wpt/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js"),
  ).href
);
const exe = join(
  root,
  "fidelity/.cache/chrome/chrome/mac_arm-155.0.8059.85/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
);
const fonts = join(root, "crates/vellora-core/src/fonts");
const face = (fam, file) =>
  `@font-face{font-family:"${fam}";src:url("${pathToFileURL(join(fonts, file)).href}")}`;
const css = [
  face("Liberation Serif", "LiberationSerif-Regular.ttf"),
  face("Liberation Sans", "LiberationSans-Regular.ttf"),
].join("\n");
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ["--font-render-hinting=none", "--allow-file-access-from-files"],
});
console.log("#", await browser.version());
const page = await browser.newPage();
await page.emulateMediaType("print");
await page.setViewport({ width: 800, height: 600 });
for (const f of files) {
  await page.goto(pathToFileURL(resolve(f)).href, { waitUntil: "load" });
  await page.addStyleTag({ content: css });
  await page.evaluate(() => document.fonts.ready);
  const out = await page.evaluate(() => {
    const r = [];
    const fmt = (b) => [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 100) / 100);
    for (const el of document.querySelectorAll("[id]")) {
      r.push([
        el.id,
        el.tagName.toLowerCase(),
        getComputedStyle(el).display,
        fmt(el.getBoundingClientRect()),
      ]);
      for (const n of el.childNodes)
        if (n.nodeType === 3 && n.data.trim()) {
          const rg = document.createRange();
          rg.selectNodeContents(n);
          r.push([
            `  text:${JSON.stringify(n.data.trim().slice(0, 12))}`,
            "",
            "",
            fmt(rg.getBoundingClientRect()),
          ]);
        }
    }
    return r;
  });
  console.log("==", f);
  for (const row of out) console.log(row.join("\t"));
}
await browser.close();
