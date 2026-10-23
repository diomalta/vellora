// Chrome probe: table `cellspacing` / `cellpadding` presentational hints (DOM boxes at a 657 px
// print-media viewport, the viewport vellora hands Blitz for A4 - 2 x 18 mm): every element's
// getBoundingClientRect() and computed border-spacing / padding. The expected numbers of
// crates/vellora-core/tests/table_cellspacing.rs. Usage: node chrome-cellspacing.mjs <repo> <out.json>
import { writeFileSync } from "node:fs";
const [repo, out] = process.argv.slice(2);
const { launchReferenceChrome, referenceHtml } = await import(
  `${repo}/fidelity/lib/chrome-reference.mjs`
);
const probe = (style, body) =>
  `<!DOCTYPE html><html><head><style>\n@page { size: A4; margin: 18mm; }\nbody { margin: 8px; font: 16px/20px "Liberation Sans"; color: #000; }\n${style}\n</style></head><body>${body}</body></html>`;
const row = (id) =>
  `<tr><td id="${id}a">A</td><td id="${id}b">B</td></tr><tr><td id="${id}c">C</td><td id="${id}d">D</td></tr>`;
export const CASES = {
  none: probe("td { padding: 0; }", `<table id="t">${row("x")}</table>`),
  zero: probe("td { padding: 0; }", `<table id="t" cellspacing="0">${row("x")}</table>`),
  five: probe("td { padding: 0; }", `<table id="t" cellspacing="5">${row("x")}</table>`),
  junk: probe("td { padding: 0; }", `<table id="t" cellspacing=" 7px">${row("x")}</table>`),
  author: probe(
    "table { border-spacing: 3px; } td { padding: 0; }",
    `<table id="t" cellspacing="0">${row("x")}</table>`,
  ),
  nested: probe(
    "td { padding: 0; }",
    `<table id="t" cellspacing="0"><tr><td id="o"><table id="n">${row("x")}</table></td></tr></table>`,
  ),
  cellpadding: probe("", `<table id="t" cellspacing="0" cellpadding="0">${row("x")}</table>`),
  cellpadding4: probe("", `<table id="t" cellspacing="0" cellpadding="4">${row("x")}</table>`),
  cellpaddingAuthor: probe(
    ".p td { padding: 5px; }",
    `<table class="p" id="t" cellspacing="0" cellpadding="0">${row("x")}</table>`,
  ),
  uaPadding: probe("", `<table id="t" cellspacing="0">${row("x")}</table>`),
};
const chrome = await launchReferenceChrome();
const page = await chrome.browser.newPage();
await page.setViewport({ width: 657, height: 1050 });
await page.emulateMediaType("print");
const result = {
  tool: "chrome-cellspacing.mjs",
  chrome: chrome.version,
  date: new Date().toISOString(),
  viewport: [657, 1050],
  cases: {},
};
for (const [name, html] of Object.entries(CASES)) {
  await page.setContent(referenceHtml(html), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  result.cases[name] = {
    html,
    boxes: await page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll("[id]")].map((e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return [
            e.id,
            {
              x: r.x,
              y: r.y,
              w: r.width,
              h: r.height,
              borderSpacing: cs.borderSpacing,
              paddingLeft: cs.paddingLeft,
              paddingTop: cs.paddingTop,
            },
          ];
        }),
      ),
    ),
  };
}
await chrome.close();
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
for (const [n, c] of Object.entries(result.cases)) {
  console.log(
    n,
    Object.entries(c.boxes)
      .map(([k, b]) => `${k}:${b.x},${b.y},${b.w}x${b.h} bs=${b.borderSpacing} p=${b.paddingLeft}`)
      .join(" | "),
  );
}
