// Render every *.html in <dir> with Chrome (reference print path) and vellora (renderPdf, strict),
// write <name>.chrome.pdf / <name>.vellora.pdf and a pdftoppm PNG of each page.
//   node repro.mjs <worktree> <dir> [chromePath]
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [wt, dir, chromePath] = process.argv.slice(2);
const ref = await import(join(wt, "fidelity/lib/chrome-reference.mjs"));
const { renderPdf } = await import(join(wt, "packages/vellora/dist/index.js"));
const chrome = await ref.launchReferenceChrome(ref.resolveChrome(chromePath));
console.log("chrome", chrome.version);
const only = process.env.ONLY;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".html"))) {
  if (only && !f.startsWith(only)) continue;
  const name = f.replace(/\.html$/, "");
  const html = readFileSync(join(dir, f), "utf8");
  const c = await ref.printPdf(chrome, ref.referenceHtml(html, { baseDir: dir }));
  writeFileSync(join(dir, `${name}.chrome.pdf`), c);
  try {
    const v = await renderPdf(html, {}, {});
    writeFileSync(join(dir, `${name}.vellora.pdf`), v);
  } catch (e) {
    console.log(name, "vellora error", e.message);
  }
  for (const side of ["chrome", "vellora"]) {
    try {
      execFileSync("pdftoppm", [
        "-r",
        "60",
        "-png",
        join(dir, `${name}.${side}.pdf`),
        join(dir, `${name}.${side}`),
      ]);
    } catch {}
  }
  console.log("done", name);
}
await chrome.close();
