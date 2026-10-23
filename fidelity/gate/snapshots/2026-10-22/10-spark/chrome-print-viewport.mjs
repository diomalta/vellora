// Probe the CSS box Chrome's print path lays a page out in, per @page margin: a full-width
// bordered block (width = the layout viewport width) and a 100vh bordered block (height = the
// layout viewport height), measured as the drawn stroke rectangles of Chrome's page.pdf() with
// PyMuPDF. Usage: node chrome-print-viewport.mjs <repo> <out.json> <margin css>...
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const [repo, out, ...margins] = process.argv.slice(2);
const { launchReferenceChrome, printPdf } = await import(
  `${repo}/fidelity/lib/chrome-reference.mjs`
);
const chrome = await launchReferenceChrome();
const py = `${repo}/fidelity/.venv/bin/python`;
const result = {
  tool: "chrome-print-viewport.mjs",
  chrome: chrome.version,
  date: new Date().toISOString(),
  method: "1px solid border boxes; outer edges = stroke rect +- 0.5 px; px = pt * 4/3",
  cases: [],
};
for (const margin of margins) {
  const html = `<!DOCTYPE html><html><head><style>@page { size: A4; margin: ${margin}; } html, body { margin: 0; } #w { border: 1px solid #000; height: 20px; } #h { position: absolute; left: 0; top: 0; width: 10px; height: 100vh; box-sizing: border-box; border: 1px solid #f00; }</style></head><body><div id="w"></div><div id="h"></div></body></html>`;
  const pdf = await printPdf(chrome, html);
  const f = `${process.env.TMPDIR ?? "/tmp"}/cw-${margin.replace(/\W/g, "_")}.pdf`;
  writeFileSync(f, pdf);
  const m = JSON.parse(
    execFileSync(py, [
      "-I",
      "-c",
      `
import pymupdf,sys,json
d=pymupdf.open(sys.argv[1]);p=d[0]
rs=[]
for dr in p.get_drawings():
    r=dr['rect'];rs.append({'color':dr.get('color'),'x0':r.x0*4/3,'y0':r.y0*4/3,'x1':r.x1*4/3,'y1':r.y1*4/3})
print(json.dumps({'pagePt':[p.rect.width,p.rect.height],'pages':len(d),'rects':rs}))
`,
      f,
    ]).toString(),
  );
  const w = m.rects.find((r) => r.color && r.color[0] === 0);
  const h = m.rects.find((r) => r.color && r.color[0] === 1);
  const row = {
    margin,
    pagePt: m.pagePt,
    pages: m.pages,
    left: w && Math.round((w.x0 - 0.5) * 1000) / 1000,
    width: w && Math.round((w.x1 - w.x0 + 1) * 1000) / 1000,
    top: h && Math.round((h.y0 - 0.5) * 1000) / 1000,
    height: h && Math.round((h.y1 - h.y0 + 1) * 1000) / 1000,
  };
  result.cases.push(row);
  console.log(JSON.stringify(row));
}
await chrome.close();
writeFileSync(out, `${JSON.stringify(result, null, 2)}\n`);
