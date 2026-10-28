#!/usr/bin/env node
// Images for the docs site, with their provenance in docs/public/site-images.json.
//
//   node scripts/build-site-images.mjs --examples [--version 0.3.0]
//     Installs the PUBLISHED vellora@<version> into a fresh temp dir (not the workspace build) and
//     renders page 1 of each EXAMPLES fixture to docs/public/examples/<fixture>.png.
//
//   node scripts/build-site-images.mjs --compare <run-all dir> --metrics <visual-compare metrics.json> [--new-key c07]
//     Rasterizes page 1 of Chrome's and vellora's PDFs from the fidelity run behind
//     docs/assets/fidelity/manifest.json into docs/public/compare/<fixture>-{chrome,vellora}.jpg.
//     Refuses unless metrics.json is the file the manifest pins (sha256) and each PDF is the one
//     metrics.json measured, so the pictures show exactly the PDFs behind the published numbers.
//
// Needs pdftoppm (poppler). Never reads the wall clock.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(REPO, "docs/public");
const PROVENANCE = join(PUBLIC, "site-images.json");
const MANIFEST = join(REPO, "docs/assets/fidelity/manifest.json");
const EXAMPLES = ["oss-sparksuite-invoice", "oss-postmark-receipt", "invoice", "receipt", "boleto", "notification"];
const COMPARE = ["oss-sparksuite-invoice", "oss-postmark-receipt", "invoice", "danfe"];
// Fixed so re-running produces the same PDF bytes.
const CREATION_DATE = "2026-06-23T00:00:00.000Z";

const sha256 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const rel = (file) => relative(REPO, file);

function rasterize(pdf, outBase, format) {
  const args = ["-f", "1", "-l", "1", "-singlefile", "-scale-to-x", "900", "-scale-to-y", "-1"];
  if (format === "jpeg") args.push("-jpeg", "-jpegopt", "quality=85");
  else args.push("-png");
  execFileSync("pdftoppm", [...args, pdf, outBase]);
  return `${outBase}.${format === "jpeg" ? "jpg" : "png"}`;
}

/** The fixture's images, keyed by the `src` strings its markup uses (same rule as test-harness). */
function fixtureImages(dir) {
  const images = {};
  const add = (key, file) => {
    const bytes = readFileSync(file);
    images[key] = bytes;
    images[`./${key}`] = bytes;
  };
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && /\.(png|jpe?g|gif|webp)$/i.test(e.name)) add(e.name, join(dir, e.name));
    if (e.isDirectory() && e.name === "assets") {
      for (const a of readdirSync(join(dir, "assets"))) add(`assets/${a}`, join(dir, "assets", a));
    }
  }
  return images;
}

async function examples(version) {
  const work = mkdtempSync(join(tmpdir(), "vellora-site-images-"));
  try {
    execFileSync("npm", ["init", "-y"], { cwd: work, stdio: "ignore" });
    execFileSync("npm", ["install", "--no-audit", "--no-fund", `vellora@${version}`], { cwd: work, stdio: "inherit" });
    const pkg = JSON.parse(readFileSync(join(work, "node_modules/vellora/package.json"), "utf8"));
    const { renderPdf } = await import(join(work, "node_modules/vellora/dist/index.js"));
    const outDir = join(PUBLIC, "examples");
    mkdirSync(outDir, { recursive: true });
    const images = [];
    for (const fixture of EXAMPLES) {
      const dir = join(REPO, "fixtures", fixture);
      const html = readFileSync(join(dir, "index.html"), "utf8");
      const data = JSON.parse(readFileSync(join(dir, "data.json"), "utf8"));
      const pdf = await renderPdf(html, data, {
        images: fixtureImages(dir),
        metadata: { title: fixture, creationDate: CREATION_DATE },
      });
      const pdfPath = join(work, `${fixture}.pdf`);
      writeFileSync(pdfPath, pdf);
      const png = rasterize(pdfPath, join(outDir, fixture), "png");
      images.push({ image: rel(png), fixture: `fixtures/${fixture}`, page: 1, pdfSha256: sha256(pdfPath) });
    }
    return { renderer: `vellora@${pkg.version} (published npm package)`, creationDate: CREATION_DATE, images };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function compare(runDir, metricsPath, newKey) {
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const pinned = manifest.files.metrics.sha256;
  if (sha256(metricsPath) !== pinned) {
    throw new Error(`${metricsPath} is not the metrics.json pinned by ${rel(MANIFEST)} (sha256 ${pinned})`);
  }
  const metrics = JSON.parse(readFileSync(metricsPath, "utf8"));
  const outDir = join(PUBLIC, "compare");
  mkdirSync(outDir, { recursive: true });
  const images = [];
  for (const fixture of COMPARE) {
    const want = metrics[fixture]?.[newKey]?.inputs;
    if (!want) throw new Error(`metrics.json has no ${fixture}.${newKey}`);
    const pdfs = { chrome: want.chromePdfSha256, vellora: want.subjectPdfSha256 };
    for (const [side, hash] of Object.entries(pdfs)) {
      const pdf = join(runDir, "layout-diff", fixture, "run-all", `${side}.pdf`);
      if (!existsSync(pdf) || sha256(pdf) !== hash) {
        throw new Error(`${pdf} is not the PDF metrics.json measured for ${fixture} (${side}, sha256 ${hash})`);
      }
      const jpg = rasterize(pdf, join(outDir, `${fixture}-${side}`), "jpeg");
      images.push({ image: rel(jpg), fixture: `fixtures/${fixture}`, side, page: 1, pdfSha256: hash });
    }
  }
  return {
    reference: manifest.reference.renderer,
    subject: manifest.after.label,
    measuredBy: `${rel(MANIFEST)} -> files.metrics (sha256 ${pinned})`,
    images,
  };
}

const { values: a } = parseArgs({
  options: {
    examples: { type: "boolean", default: false },
    version: { type: "string", default: "0.3.0" },
    compare: { type: "string" },
    metrics: { type: "string" },
    "new-key": { type: "string", default: "c07" },
  },
});
if (!a.examples && !a.compare) throw new Error("pass --examples and/or --compare <run-all dir> --metrics <file>");
if (a.compare && !a.metrics) throw new Error("--compare needs --metrics <visual-compare metrics.json>");

const provenance = existsSync(PROVENANCE) ? JSON.parse(readFileSync(PROVENANCE, "utf8")) : {};
provenance.generator = "scripts/build-site-images.mjs";
if (a.examples) provenance.examples = await examples(a.version);
if (a.compare) provenance.compare = compare(resolve(a.compare), resolve(a.metrics), a["new-key"]);
writeFileSync(PROVENANCE, `${JSON.stringify(provenance, null, 2)}\n`);
console.log(`wrote ${rel(PROVENANCE)}`);
