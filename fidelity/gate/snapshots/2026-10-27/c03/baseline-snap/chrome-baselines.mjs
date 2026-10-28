// Where Chrome's print puts text baselines: each variant is printed (the reference print path)
// and its words' baselines read back with PyMuPDF (fidelity/oracles/py/words.py), in CSS px
// from the page top. Variants put the same lines at fractional layout positions under different
// containers (plain block, overflow: hidden, a table cell, line-height: 1, a 0.42cm page margin).
//   node chrome-baselines.mjs <chrome executable> <python with PyMuPDF>   (JSON to stdout)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  launchReferenceChrome,
  printPdf,
  referenceHtml,
} from "../../../../../lib/chrome-reference.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const words = join(here, "..", "..", "..", "..", "..", "oracles", "py", "words.py");
const page = (margin, css, body) =>
  `<!DOCTYPE html><html><head><style>@page{size:A4;margin:${margin}}body{margin:0;font-family:"Liberation Sans";font-size:8.5pt;line-height:1.35}${css}</style></head><body>${body}</body></html>`;
const lines = (n) => Array.from({ length: n }, (_, i) => `<div>L${i}</div>`).join("");
const VARIANTS = {
  plain_16mm: page("16mm", "", lines(6)),
  pad_16mm: page("16mm", "div{padding-top:0.3px}", lines(6)),
  overflow_hidden_16mm: page("16mm", ".c{overflow:hidden}", `<div class="c">${lines(6)}</div>`),
  cell_16mm: page("16mm", "td{padding:0}", `<table><tr><td>${lines(6)}</td></tr></table>`),
  cell_overflow_16mm: page(
    "16mm",
    "td{padding:0;overflow:hidden}",
    `<table><tr><td>${lines(6)}</td></tr></table>`,
  ),
  lh1_serif_042cm: page(
    "0.42cm 0.25cm 0.2cm 0.25cm",
    "body{font-family:'Liberation Serif';line-height:1;font-size:10pt}div{padding-top:0.3px}",
    lines(6),
  ),
  danfe_like: page(
    "0.42cm 0.25cm 0.2cm 0.25cm",
    "*{box-sizing:border-box}body{font-family:'Liberation Serif';line-height:1}table{width:20.5cm;border-collapse:collapse;table-layout:fixed}td{border:0.5pt solid #000;padding:0.04cm 0.08cm 0 0.08cm;vertical-align:top;overflow:hidden}.v{display:block;font-size:10pt}",
    `<table><tr><td><span class="v">A1</span><span class="v">A2</span></td></tr><tr><td><span class="v">B1</span></td></tr></table>`,
  ),
  // crates/vellora-core/tests/layout_fidelity.rs rounded_badge_border_lowers_to_pdf_stroke
  badge_18mm: `<!DOCTYPE html><html><head><style>
        @page { size: A4; margin: 18mm; }
        body { font-family: sans-serif; font-size: 12px; }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border: 1px solid #2f5d8a;
            border-radius: 8px;
            color: #2f5d8a;
            font-weight: 700;
        }
    </style></head><body>
        <span class="badge">EM ABERTO</span>
    </body></html>`,
};
const chrome = await launchReferenceChrome(process.argv[2]);
const dir = mkdtempSync(join(tmpdir(), "c03-baselines-"));
const out = { chrome: chrome.version };
for (const [name, html] of Object.entries(VARIANTS)) {
  writeFileSync(join(here, `${name}.html`), html);
  const pdf = join(dir, `${name}.pdf`);
  writeFileSync(pdf, await printPdf(chrome, referenceHtml(html)));
  const res = JSON.parse(execFileSync(process.argv[3], ["-I", words, pdf], { encoding: "utf8" }));
  out[name] = res.pages[0].words.map((w) => [w.text, +((w.baseline * 4) / 3).toFixed(4)]);
}
await chrome.close();
console.log(JSON.stringify(out, null, 1));
