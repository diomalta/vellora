#!/usr/bin/env node
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { countPages } from "./lib/equivalence.mjs";

const execFileAsync = promisify(execFile);
const FIXTURE_IDS = ["invoice", "receipt", "boleto", "notification"];
const FIXED_CREATION_DATE = "2026-06-25T00:00:00.000Z";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bundledFontDir = join(repoRoot, "crates", "vellora-core", "src", "fonts");

const FONT_ALIASES = [
  {
    families: ["Vellora Sans", "Inter", "Helvetica Neue", "Arial", "Liberation Sans"],
    regular: "LiberationSans-Regular.ttf",
    bold: "LiberationSans-Bold.ttf",
  },
  {
    families: ["Liberation Serif", "Georgia", "Times New Roman"],
    regular: "LiberationSerif-Regular.ttf",
    bold: "LiberationSerif-Bold.ttf",
  },
  {
    families: ["Vellora Mono", "Liberation Mono", "Menlo", "Consolas", "Courier New"],
    regular: "LiberationMono-Regular.ttf",
    bold: "LiberationMono-Bold.ttf",
  },
];

const DEFAULT_REGIONS = [
  { id: "page-top", label: "Top spacing and header", x: 0, y: 0, width: 1, height: 0.24 },
  { id: "content-flow", label: "Main content flow", x: 0, y: 0.24, width: 1, height: 0.56 },
  { id: "page-bottom", label: "Footer and bottom spacing", x: 0, y: 0.8, width: 1, height: 0.2 },
];

const FIXTURE_REGIONS = {
  invoice: [
    {
      id: "invoice-meta",
      label: "Invoice metadata and status badge",
      x: 0.52,
      y: 0.04,
      width: 0.43,
      height: 0.18,
    },
    {
      id: "invoice-parties",
      label: "Party cards and gutters",
      x: 0.05,
      y: 0.2,
      width: 0.9,
      height: 0.2,
    },
    {
      id: "invoice-items",
      label: "Items table rhythm",
      x: 0.05,
      y: 0.38,
      width: 0.9,
      height: 0.42,
    },
  ],
  receipt: [
    {
      id: "receipt-header",
      label: "Receipt header density",
      x: 0.08,
      y: 0.02,
      width: 0.84,
      height: 0.22,
    },
    {
      id: "receipt-items",
      label: "Item rows and totals",
      x: 0.04,
      y: 0.22,
      width: 0.92,
      height: 0.56,
    },
  ],
  boleto: [
    {
      id: "boleto-bank-header",
      label: "Bank header alignment",
      x: 0.05,
      y: 0.06,
      width: 0.9,
      height: 0.16,
    },
    {
      id: "boleto-field-grid",
      label: "Dense field grid",
      x: 0.05,
      y: 0.32,
      width: 0.9,
      height: 0.36,
    },
    {
      id: "boleto-barcode-footer",
      label: "Barcode and footer spacing",
      x: 0.05,
      y: 0.82,
      width: 0.9,
      height: 0.14,
    },
  ],
  notification: [
    {
      id: "notification-heading",
      label: "Heading and opening spacing",
      x: 0.06,
      y: 0.06,
      width: 0.88,
      height: 0.18,
    },
    {
      id: "notification-body",
      label: "Paragraph rhythm",
      x: 0.06,
      y: 0.22,
      width: 0.88,
      height: 0.5,
    },
    {
      id: "notification-signature",
      label: "Signature block",
      x: 0.06,
      y: 0.72,
      width: 0.88,
      height: 0.2,
    },
  ],
};

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function numberArg(name, fallback) {
  const raw = argValue(name, String(fallback));
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function selectedFixtures() {
  const one = argValue("--fixture", "");
  const many = argValue("--fixtures", "");
  const ids = one
    ? [one]
    : many
      ? many
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : FIXTURE_IDS;
  for (const id of ids) {
    if (!FIXTURE_IDS.includes(id)) {
      throw new Error(`Unknown fixture "${id}". Expected one of: ${FIXTURE_IDS.join(", ")}`);
    }
  }
  return ids;
}

function loadFixture(id) {
  const dir = join(repoRoot, "fixtures", id);
  const htmlPath = join(dir, "index.html");
  const dataPath = join(dir, "data.json");
  if (!existsSync(htmlPath) || !existsSync(dataPath)) {
    throw new Error(`Fixture "${id}" is missing index.html or data.json`);
  }
  return {
    id,
    dir,
    html: readFileSync(htmlPath, "utf8"),
    data: JSON.parse(readFileSync(dataPath, "utf8")),
  };
}

function ensurePdf(bytes, label) {
  const header = new TextDecoder().decode(bytes.subarray(0, 5));
  if (header !== "%PDF-") {
    throw new Error(`${label}: expected a PDF header, got ${JSON.stringify(header)}`);
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function injectBaseTag(html, fixtureDir) {
  const href = pathToFileURL(`${fixtureDir}/`).href;
  if (/<base[\s>]/i.test(html)) {
    return html;
  }
  return injectIntoHead(html, `    <base href="${href}">`);
}

function injectIntoHead(html, markup) {
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${markup}`);
}

function fontDataUrl(fileName) {
  const bytes = readFileSync(join(bundledFontDir, fileName)).toString("base64");
  return `data:font/ttf;base64,${bytes}`;
}

function bundledFontFaceCss() {
  const rules = [];
  for (const alias of FONT_ALIASES) {
    const regular = fontDataUrl(alias.regular);
    const bold = fontDataUrl(alias.bold);
    for (const family of alias.families) {
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${regular}) format("truetype"); font-weight: 400; font-style: normal; }`,
      );
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${bold}) format("truetype"); font-weight: 700; font-style: normal; }`,
      );
    }
  }
  return rules.join("\n");
}

let bundledFontsStyle;

function injectBundledFonts(html) {
  bundledFontsStyle ??= `    <style data-vellora-benchmark-fonts>\n${bundledFontFaceCss()}\n    </style>`;
  return injectIntoHead(html, bundledFontsStyle);
}

function imageMimeType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".png")) {
    return "image/png";
  }
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lower.endsWith(".gif")) {
    return "image/gif";
  }
  if (lower.endsWith(".webp")) {
    return "image/webp";
  }
  if (lower.endsWith(".svg")) {
    return "image/svg+xml";
  }
  return null;
}

function inlineLocalImageSources(html, fixtureDir) {
  return html.replace(/\bsrc=(["'])([^"']+)\1/gi, (match, quote, src) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(src)) {
      return match;
    }
    const imagePath = resolve(fixtureDir, src);
    if (!existsSync(imagePath)) {
      return match;
    }
    const mimeType = imageMimeType(imagePath);
    if (!mimeType) {
      return match;
    }
    const data = readFileSync(imagePath).toString("base64");
    return `src=${quote}data:${mimeType};base64,${data}${quote}`;
  });
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function ratio(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "n/a";
}

function regionsForFixture(id) {
  return [...(FIXTURE_REGIONS[id] ?? []), ...DEFAULT_REGIONS];
}

async function findExecutable(name, envName) {
  const envValue = process.env[envName];
  if (envValue) {
    if (!existsSync(envValue)) {
      throw new Error(`${envName} points to a missing executable: ${envValue}`);
    }
    return envValue;
  }
  try {
    const { stdout } = await execFileAsync("which", [name]);
    const resolved = stdout.trim();
    if (resolved) {
      return resolved;
    }
  } catch {
    // Fall through to the actionable error below.
  }
  throw new Error(`Missing ${name}. Install poppler or set ${envName}=/absolute/path/to/${name}`);
}

async function rasterizePdf({ pdftoppm, pdfPath, outDir, id, pages, dpi }) {
  mkdirSync(outDir, { recursive: true });
  const prefix = join(outDir, id);
  await execFileAsync(pdftoppm, ["-png", "-r", String(dpi), pdfPath, prefix]);

  const pagePaths = [];
  for (let page = 1; page <= pages; page += 1) {
    const pngPath = `${prefix}-${page}.png`;
    if (!existsSync(pngPath)) {
      throw new Error(`Raster output missing: ${pngPath}`);
    }
    pagePaths.push(pngPath);
  }
  return pagePaths;
}

async function renderWithPuppeteer(browser, html) {
  const page = await browser.newPage();
  try {
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      preferCSSPageSize: true,
      printBackground: true,
    });
    return new Uint8Array(pdf);
  } finally {
    await page.close();
  }
}

function pngDataUrl(path) {
  return `data:image/png;base64,${readFileSync(path).toString("base64")}`;
}

function writeDataUrl(path, dataUrl) {
  const [, encoded] = dataUrl.split(",");
  if (!encoded) {
    throw new Error(`Invalid data URL for ${path}`);
  }
  writeFileSync(path, Buffer.from(encoded, "base64"));
}

async function comparePagePngs(browser, { referencePath, subjectPath, regions, threshold }) {
  const page = await browser.newPage();
  try {
    return await page.evaluate(
      async ({ referenceUrl, subjectUrl, regions: regionDefs, threshold: deltaThreshold }) => {
        const loadImage = (src) =>
          new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Could not load image: ${src.slice(0, 48)}`));
            image.src = src;
          });

        const [reference, subject] = await Promise.all([
          loadImage(referenceUrl),
          loadImage(subjectUrl),
        ]);
        const width = Math.min(reference.width, subject.width);
        const height = Math.min(reference.height, subject.height);

        const refCanvas = document.createElement("canvas");
        const subjectCanvas = document.createElement("canvas");
        const diffCanvas = document.createElement("canvas");
        refCanvas.width = subjectCanvas.width = diffCanvas.width = width;
        refCanvas.height = subjectCanvas.height = diffCanvas.height = height;

        const refCtx = refCanvas.getContext("2d");
        const subjectCtx = subjectCanvas.getContext("2d");
        const diffCtx = diffCanvas.getContext("2d");
        refCtx.drawImage(reference, 0, 0, width, height);
        subjectCtx.drawImage(subject, 0, 0, width, height);

        const ref = refCtx.getImageData(0, 0, width, height);
        const subj = subjectCtx.getImageData(0, 0, width, height);
        const diff = diffCtx.createImageData(width, height);

        const summarize = (bounds) => {
          let mismatchPixels = 0;
          let sumAbsoluteError = 0;
          const totalPixels = Math.max(1, bounds.width * bounds.height);

          for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
            for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
              const offset = (y * width + x) * 4;
              const dr = Math.abs(ref.data[offset] - subj.data[offset]);
              const dg = Math.abs(ref.data[offset + 1] - subj.data[offset + 1]);
              const db = Math.abs(ref.data[offset + 2] - subj.data[offset + 2]);
              const maxDelta = Math.max(dr, dg, db);
              sumAbsoluteError += (dr + dg + db) / (3 * 255);
              if (maxDelta > deltaThreshold) {
                mismatchPixels += 1;
              }
            }
          }

          return {
            pixels: totalPixels,
            mismatchPixels,
            mismatchRatio: mismatchPixels / totalPixels,
            meanAbsoluteError: sumAbsoluteError / totalPixels,
          };
        };

        const boundsFor = (region) => {
          const x = Math.max(0, Math.min(width - 1, Math.round(region.x * width)));
          const y = Math.max(0, Math.min(height - 1, Math.round(region.y * height)));
          const right = Math.max(
            x + 1,
            Math.min(width, Math.round((region.x + region.width) * width)),
          );
          const bottom = Math.max(
            y + 1,
            Math.min(height, Math.round((region.y + region.height) * height)),
          );
          return { x, y, width: right - x, height: bottom - y };
        };

        for (let i = 0; i < diff.data.length; i += 4) {
          const dr = Math.abs(ref.data[i] - subj.data[i]);
          const dg = Math.abs(ref.data[i + 1] - subj.data[i + 1]);
          const db = Math.abs(ref.data[i + 2] - subj.data[i + 2]);
          const maxDelta = Math.max(dr, dg, db);
          if (maxDelta > deltaThreshold) {
            diff.data[i] = 255;
            diff.data[i + 1] = 32;
            diff.data[i + 2] = 32;
            diff.data[i + 3] = Math.max(110, Math.min(255, maxDelta));
          } else {
            diff.data[i] = 246;
            diff.data[i + 1] = 247;
            diff.data[i + 2] = 249;
            diff.data[i + 3] = 255;
          }
        }

        diffCtx.putImageData(diff, 0, 0);

        return {
          dimensions: {
            referenceWidth: reference.width,
            referenceHeight: reference.height,
            subjectWidth: subject.width,
            subjectHeight: subject.height,
            comparedWidth: width,
            comparedHeight: height,
          },
          overall: summarize({ x: 0, y: 0, width, height }),
          regions: regionDefs.map((region) => ({
            ...region,
            bounds: boundsFor(region),
            metrics: summarize(boundsFor(region)),
          })),
          diffDataUrl: diffCanvas.toDataURL("image/png"),
        };
      },
      {
        referenceUrl: pngDataUrl(referencePath),
        subjectUrl: pngDataUrl(subjectPath),
        regions,
        threshold,
      },
    );
  } finally {
    await page.close();
  }
}

function renderReport(report) {
  const fixtureSections = report.fixtures
    .map((fixture) => {
      const pageSections = fixture.pages
        .map((page) => {
          const regions = page.regions
            .map(
              (region) => `<tr>
                <td>${htmlEscape(region.id)}</td>
                <td>${htmlEscape(region.label)}</td>
                <td>${percent(region.metrics.mismatchRatio)}</td>
                <td>${ratio(region.metrics.meanAbsoluteError)}</td>
              </tr>`,
            )
            .join("\n");

          return `<article class="page">
            <h3>Page ${page.page}</h3>
            <div class="metrics">
              <span>Mismatch ${percent(page.overall.mismatchRatio)}</span>
              <span>MAE ${ratio(page.overall.meanAbsoluteError)}</span>
              <span>${page.dimensions.comparedWidth}x${page.dimensions.comparedHeight}px</span>
            </div>
            <div class="comparison">
              <figure>
                <figcaption>Puppeteer reference</figcaption>
                <img src="${htmlEscape(page.referencePng)}" alt="${htmlEscape(fixture.id)} Puppeteer page ${page.page}">
              </figure>
              <figure>
                <figcaption>Vellora</figcaption>
                <img src="${htmlEscape(page.subjectPng)}" alt="${htmlEscape(fixture.id)} Vellora page ${page.page}">
              </figure>
              <figure>
                <figcaption>Diff</figcaption>
                <img src="${htmlEscape(page.diffPng)}" alt="${htmlEscape(fixture.id)} diff page ${page.page}">
              </figure>
            </div>
            <table>
              <thead>
                <tr><th>Region</th><th>Focus</th><th>Mismatch</th><th>MAE</th></tr>
              </thead>
              <tbody>${regions}</tbody>
            </table>
          </article>`;
        })
        .join("\n");

      return `<section class="fixture">
        <h2>${htmlEscape(fixture.id)}</h2>
        <div class="fixture-meta">
          <span>Vellora pages: ${fixture.vellora.pages}</span>
          <span>Puppeteer pages: ${fixture.puppeteer.pages}</span>
          <span>Vellora PDF: <a href="${htmlEscape(fixture.vellora.pdfPath)}">${htmlEscape(fixture.vellora.sha256.slice(0, 12))}</a></span>
          <span>Puppeteer PDF: <a href="${htmlEscape(fixture.puppeteer.pdfPath)}">${htmlEscape(fixture.puppeteer.sha256.slice(0, 12))}</a></span>
        </div>
        ${fixture.pageCountMismatch ? `<p class="warning">Page count mismatch: only comparable pages are shown.</p>` : ""}
        ${pageSections}
      </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vellora Visual Fidelity</title>
  <style>
    :root {
      --ink: #17202a;
      --muted: #657184;
      --line: #d8dee8;
      --panel: #f7f9fc;
      --accent: #255f8f;
    }
    body {
      margin: 24px;
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: #fff;
    }
    h1, h2, h3 { margin: 0; }
    h1 { font-size: 24px; }
    h2 { font-size: 20px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--line); }
    h3 { font-size: 16px; margin: 18px 0 8px; }
    .summary, .fixture-meta, .metrics {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 14px;
      color: var(--muted);
      margin: 10px 0 16px;
    }
    .warning {
      color: #8a4b00;
      background: #fff8e8;
      border: 1px solid #ead6a5;
      padding: 8px 10px;
    }
    .comparison {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      align-items: start;
    }
    figure { margin: 0; }
    figcaption { font-weight: 700; margin-bottom: 6px; color: var(--accent); }
    img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--line);
      background: var(--panel);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 7px 8px;
      text-align: left;
    }
    th {
      background: var(--panel);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    a { color: var(--accent); }
    @media (max-width: 900px) {
      .comparison { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <h1>Vellora Visual Fidelity</h1>
  <div class="summary">
    <span>Reference: Puppeteer</span>
    <span>Subject: Vellora</span>
    <span>DPI: ${report.config.dpi}</span>
    <span>Pixel threshold: ${report.config.threshold}</span>
    <span>Generated: ${htmlEscape(report.generatedAt)}</span>
  </div>
  ${fixtureSections}
</body>
</html>
`;
}

async function main() {
  const outDir = resolve(repoRoot, argValue("--out", "benchmarks/results/visual-fidelity"));
  const dpi = numberArg("--dpi", 144);
  const threshold = numberArg("--threshold", 12);
  const failOnMismatch = Number(argValue("--fail-on-mismatch", "NaN"));
  const pdftoppm = await findExecutable("pdftoppm", "PDFTOPPM_BIN");

  let puppeteer;
  let renderPdf;
  let renderTemplate;
  try {
    puppeteer = (await import("puppeteer")).default;
  } catch (cause) {
    throw new Error("Install benchmark dependencies first: npm --prefix benchmarks install", {
      cause,
    });
  }
  try {
    ({ renderPdf, renderTemplate } = await import("vellora"));
  } catch (cause) {
    throw new Error("Build the workspace before running visual fidelity: npm run build", {
      cause,
    });
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, "pdf", "vellora"), { recursive: true });
  mkdirSync(join(outDir, "pdf", "puppeteer"), { recursive: true });
  mkdirSync(join(outDir, "png", "vellora"), { recursive: true });
  mkdirSync(join(outDir, "png", "puppeteer"), { recursive: true });
  mkdirSync(join(outDir, "png", "diff"), { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const report = {
    schemaVersion: 1,
    suite: "vellora-visual-fidelity",
    generatedAt: new Date().toISOString(),
    reference: "puppeteer",
    subject: "vellora",
    config: {
      dpi,
      threshold,
      pdftoppm,
      fontParity: "Puppeteer reference embeds Vellora bundled fonts for fixture aliases.",
      localImages: "Both renderers receive local fixture image assets inlined as data URLs.",
      fixtures: selectedFixtures(),
      regions: {
        default: DEFAULT_REGIONS,
        fixtureSpecific: FIXTURE_REGIONS,
      },
    },
    fixtures: [],
  };

  try {
    for (const id of report.config.fixtures) {
      const fixture = loadFixture(id);
      const finalHtml = renderTemplate(fixture.html, fixture.data);
      const imageReadyHtml = inlineLocalImageSources(finalHtml, fixture.dir);
      const browserHtml = injectBundledFonts(injectBaseTag(imageReadyHtml, fixture.dir));
      const metadata = { title: `visual-fidelity-${id}`, creationDate: FIXED_CREATION_DATE };

      const velloraPdf = await renderPdf(imageReadyHtml, undefined, {
        strict: true,
        metadata,
      });
      const puppeteerPdf = await renderWithPuppeteer(browser, browserHtml);
      ensurePdf(velloraPdf, `${id} vellora`);
      ensurePdf(puppeteerPdf, `${id} puppeteer`);

      const velloraPdfPath = join(outDir, "pdf", "vellora", `${id}.pdf`);
      const puppeteerPdfPath = join(outDir, "pdf", "puppeteer", `${id}.pdf`);
      writeFileSync(velloraPdfPath, velloraPdf);
      writeFileSync(puppeteerPdfPath, puppeteerPdf);

      const velloraPages = countPages(velloraPdf);
      const puppeteerPages = countPages(puppeteerPdf);
      const comparablePages = Math.min(velloraPages, puppeteerPages);
      const regions = regionsForFixture(id);
      const velloraPngs = await rasterizePdf({
        pdftoppm,
        pdfPath: velloraPdfPath,
        outDir: join(outDir, "png", "vellora"),
        id,
        pages: velloraPages,
        dpi,
      });
      const puppeteerPngs = await rasterizePdf({
        pdftoppm,
        pdfPath: puppeteerPdfPath,
        outDir: join(outDir, "png", "puppeteer"),
        id,
        pages: puppeteerPages,
        dpi,
      });

      const pages = [];
      for (let page = 1; page <= comparablePages; page += 1) {
        const comparison = await comparePagePngs(browser, {
          referencePath: puppeteerPngs[page - 1],
          subjectPath: velloraPngs[page - 1],
          regions,
          threshold,
        });
        const diffPath = join(outDir, "png", "diff", `${id}-page-${page}.png`);
        writeDataUrl(diffPath, comparison.diffDataUrl);
        pages.push({
          page,
          dimensions: comparison.dimensions,
          overall: comparison.overall,
          regions: comparison.regions,
          referencePng: relative(outDir, puppeteerPngs[page - 1]),
          subjectPng: relative(outDir, velloraPngs[page - 1]),
          diffPng: relative(outDir, diffPath),
        });
      }

      const fixtureRecord = {
        id,
        pageCountMismatch: velloraPages !== puppeteerPages,
        vellora: {
          pages: velloraPages,
          bytes: velloraPdf.length,
          sha256: sha256(velloraPdf),
          pdfPath: relative(outDir, velloraPdfPath),
        },
        puppeteer: {
          pages: puppeteerPages,
          bytes: puppeteerPdf.length,
          sha256: sha256(puppeteerPdf),
          pdfPath: relative(outDir, puppeteerPdfPath),
        },
        pages,
      };
      report.fixtures.push(fixtureRecord);
      const worst = pages.reduce((max, page) => Math.max(max, page.overall.mismatchRatio), 0);
      console.log(
        `${id}: ${velloraPages} Vellora pages, ${puppeteerPages} Puppeteer pages, worst page mismatch ${percent(worst)}`,
      );
    }
  } finally {
    await browser.close();
  }

  writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outDir, "index.html"), renderReport(report));
  console.log(`Visual fidelity report: ${join(outDir, "index.html")}`);

  if (Number.isFinite(failOnMismatch)) {
    const worst = report.fixtures.reduce(
      (max, fixture) => Math.max(max, ...fixture.pages.map((page) => page.overall.mismatchRatio)),
      0,
    );
    if (worst > failOnMismatch) {
      throw new Error(
        `Worst mismatch ${percent(worst)} exceeds --fail-on-mismatch ${percent(failOnMismatch)}`,
      );
    }
  }
}

main().catch((err) => {
  process.stderr.write(`visual fidelity run failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
