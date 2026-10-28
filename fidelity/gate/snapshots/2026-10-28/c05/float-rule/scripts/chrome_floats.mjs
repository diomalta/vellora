// node chrome_floats.mjs <chrome executable> <html>...  -> JSON lines: float rects relative to #c.
// Print media, like the WPT/pdf references. Needs puppeteer-core (run with NODE_PATH pointing at a
// node_modules that has it).
import { readFileSync } from "node:fs";
import { basename } from "node:path";
const { default: puppeteer } = await import(process.env.PUPPETEER_CORE);

const [exe, ...files] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: exe,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.emulateMediaType("print");
for (const f of files) {
  await page.setContent(readFileSync(f, "utf8"), { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const c = document.getElementById("c").getBoundingClientRect();
    const out = {};
    for (const id of ["f", "g"]) {
      const e = document.getElementById(id);
      if (!e) continue;
      const b = e.getBoundingClientRect();
      out[id] = [b.x - c.x, b.y - c.y, b.width, b.height].map((v) => Math.round(v * 100) / 100);
    }
    const ch = (() => {
      const s = document.createElement("span");
      s.textContent = "0000000000";
      document.getElementById("c").appendChild(s);
      const w = s.getBoundingClientRect().width / 10;
      s.remove();
      return w;
    })();
    const texts = [];
    const walker = document.createTreeWalker(document.getElementById("c"), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const b = range.getClientRects()[0];
      if (b)
        texts.push([
          n.textContent.trim().slice(0, 12),
          Math.round((b.x - c.x) * 100) / 100,
          Math.round((b.y - c.y) * 100) / 100,
        ]);
    }
    return { ch: Math.round(ch * 1000) / 1000, c: [c.width, c.height], ...out, texts };
  });
  console.log(JSON.stringify({ file: basename(f), ...r }));
}
await browser.close();
