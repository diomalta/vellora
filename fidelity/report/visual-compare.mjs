#!/usr/bin/env node
// The visual-compare directory build-site-evidence.mjs consumes: page images of Chrome's PDF, the
// published engine's PDF and the run's vellora PDF per fixture, plus metrics.json with the
// committed oracle's numbers for both engines.
//
//   node fidelity/report/visual-compare.mjs --run <run-all dir> --pin-pdfs <dir> --out <dir>
//     [--pin-doc fidelity/baselines/pin/doc-aggregate.json] [--new-key c02] [--dpi 55]
//
// --run       a run-all output: layout-diff/<fixture>/run-all/{chrome,vellora}.pdf and
//             doc-aggregate/summary.json (the run's own doc-aggregate step)
// --pin-pdfs  <fixture>.pdf of the published engine, written by
//             fidelity/oracles/doc-aggregate-pin.mjs --pdf-out (their sha256 must match the pin
//             reference's renders[].pdfSha256, so the images show exactly what was scored)
// Needs pdftoppm (poppler) on PATH. Writes <out>/<fixture>/{chrome,pin,new}-<page>.jpg.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { FIXTURES } from "./lib/evidence.mjs";

const { values: a } = parseArgs({
  options: {
    run: { type: "string" },
    "pin-pdfs": { type: "string" },
    out: { type: "string" },
    "pin-doc": { type: "string", default: "fidelity/baselines/pin/doc-aggregate.json" },
    "new-key": { type: "string", default: "c02" },
    dpi: { type: "string", default: "55" },
  },
});
if (!a.run || !a["pin-pdfs"] || !a.out) {
  console.error("usage: visual-compare.mjs --run <run-all dir> --pin-pdfs <dir> --out <dir>");
  process.exit(2);
}
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const pin = json(a["pin-doc"]);
const run = json(join(a.run, "doc-aggregate", "summary.json"));

function rasterize(pdf, prefix) {
  const r = spawnSync("pdftoppm", ["-r", a.dpi, "-jpeg", pdf, prefix], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`pdftoppm ${pdf}: ${r.stderr}`);
  // pdftoppm zero-pads the page number on long documents: normalise to <prefix>-<n>.jpg.
  const dir = join(prefix, "..");
  const base = prefix.slice(dir.length + 1);
  for (const f of readdirSync(dir)) {
    const m = f.match(new RegExp(`^${base}-(\\d+)\\.jpg$`));
    if (m && f !== `${base}-${Number(m[1])}.jpg`) {
      renameSync(join(dir, f), join(dir, `${base}-${Number(m[1])}.jpg`));
    }
  }
}

const metrics = {};
for (const { id } of FIXTURES) {
  const pinPdf = join(a["pin-pdfs"], `${id}.pdf`);
  const want = pin.renders?.[id]?.pdfSha256;
  if (want && sha256(pinPdf) !== want) {
    throw new Error(`${pinPdf}: sha256 differs from the pin reference's render`);
  }
  const dir = join(a.out, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const base = join(a.run, "layout-diff", id, "run-all");
  rasterize(join(base, "chrome.pdf"), join(dir, "chrome"));
  rasterize(pinPdf, join(dir, "pin"));
  rasterize(join(base, "vellora.pdf"), join(dir, "new"));
  metrics[id] = { pin: pin.fixtures[id], [a["new-key"]]: run.fixtures[id] };
}
writeFileSync(join(a.out, "metrics.json"), `${JSON.stringify(metrics, null, 1)}\n`);
console.log(`${FIXTURES.length} fixtures -> ${a.out}`);
