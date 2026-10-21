#!/usr/bin/env node
// PAGINATED probe (complements run.mjs, which is pre-pagination only): render the same fixture
// HTML to PDF with vellora (vellora_core::render via the layout_dump example of --dump-repo) and
// with Chrome (page.pdf, print media, preferCSSPageSize, bundled fonts), extract word boxes with an
// independent extractor (poppler pdftotext -bbox) and align words by text. Answers "is a PDF-level
// delta already present in the pre-pagination layers, or introduced by pagination/emit?".
//
//   node fidelity/layout-diff/pdf-probe.mjs --label <name> [--dump-repo <checkout>]
//     [--fixtures notification,invoice] [--chrome <path>] [--out <dir>] [--pdftotext <bin>]
//
// Requires run.mjs to have produced <out>/<fixture>/<label>/native.html + browser.html first.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { launchChrome, resolveChrome } from "./lib/chrome-snapshot.mjs";
import { blitzLabel, captureEnv } from "./lib/env.mjs";
import { FIXTURE_IDS, repoRoot } from "./lib/fixture-html.mjs";
import { normText } from "./lib/vellora-model.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

/** Parse `pdftotext -bbox` XHTML into words {page, text, x, y, w, h} in PDF points (top-left). */
export function parseBbox(xhtml) {
  const words = [];
  let page = 0;
  const re =
    /<page\b[^>]*>|<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
  for (const m of xhtml.matchAll(re)) {
    if (m[0].startsWith("<page")) {
      page += 1;
      continue;
    }
    const [x0, y0, x1, y1] = [m[1], m[2], m[3], m[4]].map(Number);
    const text = m[5]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'");
    words.push({ page, text, norm: normText(text), x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  return words;
}

/**
 * Align two word lists by (normalized text, occurrence index): the k-th "de" of one PDF pairs with
 * the k-th "de" of the other. Robust to line-wrap differences that reorder the extractor's reading
 * order (a sequential aligner loses sync there); a word whose occurrence count differs stays
 * unpaired.
 */
export function alignWords(a, b) {
  const index = new Map();
  for (const w of b) {
    if (!index.has(w.norm)) index.set(w.norm, []);
    index.get(w.norm).push(w);
  }
  const seen = new Map();
  const pairs = [];
  for (const w of a) {
    const k = seen.get(w.norm) ?? 0;
    seen.set(w.norm, k + 1);
    const match = index.get(w.norm)?.[k];
    if (match) pairs.push([w, match]);
  }
  return pairs;
}

function pdfWords(pdftotext, pdfPath) {
  return parseBbox(execFileSync(pdftotext, ["-bbox", pdfPath, "-"], { encoding: "utf8" }));
}

async function main() {
  const dumpRepo = resolve(arg("--dump-repo", repoRoot));
  const label = arg("--label", blitzLabel(dumpRepo));
  const fixtures = arg("--fixtures", FIXTURE_IDS.join(",")).split(",").filter(Boolean);
  const out = resolve(arg("--out", join(repoRoot, "fidelity", "results", "layout-diff")));
  const pdftotext = arg("--pdftotext", "/opt/homebrew/bin/pdftotext");
  const chromePath = resolveChrome(arg("--chrome", undefined));
  const env = await captureEnv({
    repo: dumpRepo,
    command: `node ${process.argv.slice(1).join(" ")}`,
    chromePath,
  });
  env.pdftotext = execFileSync(pdftotext, ["-v"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })
    .split("\n")[0]
    .trim();
  const bin = join(dumpRepo, "target", "release", "examples", "layout_dump");
  const browser = await launchChrome(chromePath);
  try {
    for (const fixture of fixtures) {
      const dir = join(out, fixture, label);
      const nativePath = join(dir, "native.html");
      if (!existsSync(nativePath))
        throw new Error(`run run.mjs --label ${label} first (${nativePath})`);
      const vPdf = join(dir, "vellora.pdf");
      execFileSync(bin, [
        "--html",
        nativePath,
        "--out",
        join(dir, "vellora-dump.json"),
        "--pdf",
        vPdf,
      ]);
      const page = await browser.newPage();
      const cPdf = join(dir, "chrome.pdf");
      try {
        await page.emulateMediaType("print");
        await page.setContent(readFileSync(join(dir, "browser.html"), "utf8"), {
          waitUntil: "load",
        });
        await page.evaluate(() => document.fonts.ready.then(() => true));
        writeFileSync(
          cPdf,
          await page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true }),
        );
      } finally {
        await page.close();
      }
      const vWords = pdfWords(pdftotext, vPdf);
      const cWords = pdfWords(pdftotext, cPdf);
      const pairs = alignWords(vWords, cWords).map(([v, c]) => ({
        text: v.text,
        vellora: { page: v.page, x: v.x, y: v.y },
        chrome: { page: c.page, x: c.x, y: c.y },
        samePage: v.page === c.page,
        dx_pt: Math.round((v.x - c.x) * 100) / 100,
        dy_pt: Math.round((v.y - c.y) * 100) / 100,
      }));
      const result = {
        schema: "vellora-layout-diff/pdf-probe/1",
        fixture,
        label,
        env,
        note: "PDF points, top-left origin, from poppler pdftotext -bbox on both PDFs; deltas = vellora - Chrome; cross-page pairs are listed but their dy is meaningless.",
        pages: {
          vellora: Math.max(0, ...vWords.map((w) => w.page)),
          chrome: Math.max(0, ...cWords.map((w) => w.page)),
        },
        words: { vellora: vWords.length, chrome: cWords.length, aligned: pairs.length },
        pairs,
      };
      writeFileSync(join(dir, "pdf-probe.json"), `${JSON.stringify(result, null, 2)}\n`);
      const same = pairs.filter((p) => p.samePage);
      const last = same.slice(-6);
      process.stdout.write(
        `${fixture} [${label}] pages v/c ${result.pages.vellora}/${result.pages.chrome}; aligned ${pairs.length}/${vWords.length}; last words: ${last.map((p) => `${p.text}(${p.dx_pt},${p.dy_pt})`).join(" ")}\n`,
      );
    }
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`pdf-probe failed: ${err?.stack ?? err}\n`);
    process.exitCode = 1;
  });
}
