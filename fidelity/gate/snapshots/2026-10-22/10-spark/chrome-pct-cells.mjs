// Chrome probe for port step 10-spark: percentage cells of a NESTED auto-layout table whose cells
// hold a full-width block (postmark's `<td width="80%"><p class="right">Total</p></td>`), and of a
// top-level table whose percentages sum to exactly 100%. DOM boxes at the 657 px print-media
// viewport vellora hands Blitz for A4 - 2 x 18 mm: every [id] element's getBoundingClientRect()
// and, for [data-text] elements, the client rect of their text. The expected numbers of
// crates/vellora-core/tests/layout_fidelity.rs `percent_cells_*`.
// Usage: node chrome-pct-cells.mjs <repo> <out.json>
import { writeFileSync } from "node:fs";

const [repo, out] = process.argv.slice(2);
const { launchReferenceChrome, referenceHtml } = await import(
  `${repo}/fidelity/lib/chrome-reference.mjs`
);
const probe = (style, body) =>
  `<!DOCTYPE html><html><head><style>\n@page { size: A4; margin: 18mm; }\nbody { margin: 8px; font: 16px/20px "Liberation Sans"; color: #000; }\n${style}\n</style></head><body>${body}</body></html>`;
const STYLE = "table { width: 100%; } p { margin: 0; } .r { text-align: right; }";
const ROWS =
  '<tr><td width="80%"><p class="r" id="l1" data-text>Total</p></td><td width="20%"><p class="r" id="v1" data-text>$81.00</p></td></tr>' +
  '<tr><td width="80%" id="c2"><span id="l2" data-text>Item</span></td><td width="20%" class="r" id="c3"><span id="v2" data-text>$9.00</span></td></tr>';
export const CASES = {
  nested: probe(
    STYLE,
    `<table cellspacing="0" cellpadding="0" id="outer"><tr><td><table cellspacing="0" cellpadding="0" id="t">${ROWS}</table></td></tr></table>`,
  ),
  top: probe(STYLE, `<table cellspacing="0" cellpadding="0" id="t">${ROWS}</table>`),
};
const chrome = await launchReferenceChrome();
const page = await chrome.browser.newPage();
await page.setViewport({ width: 657, height: 1050 });
await page.emulateMediaType("print");
const result = {
  tool: "chrome-pct-cells.mjs",
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
        [...document.querySelectorAll("[id], td")].map((e, i) => {
          const r = e.getBoundingClientRect();
          const rec = { x: r.x, y: r.y, w: r.width, h: r.height };
          if (e.hasAttribute("data-text")) {
            const range = document.createRange();
            range.selectNodeContents(e);
            const t = range.getClientRects()[0];
            rec.text = { x: t.x, right: t.x + t.width };
          }
          return [e.id || `td${i}`, rec];
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
      .map(([k, b]) => `${k}:${b.x},${b.w}${b.text ? ` text ${b.text.x}..${b.text.right}` : ""}`)
      .join(" | "),
  );
}
