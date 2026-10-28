// PDF → per-page RGB rasters via poppler at a fixed DPI. 96 DPI maps 1 CSS px to 1 device px, the
// same scale WPT's print runner uses (print_pdf_runner.html: pdf.js viewport scale 96/72).
//
// Two poppler backends are supported:
//   pdftocairo (default) — glyphs and paths share cairo's coverage rules.
//   pdftoppm (Splash)    — CONFIRMED 2026-10-20 to rasterize FreeType glyph outlines 1px larger
//                          than an identical path fill (Ahem square at x 7..207 vs a CSS box at
//                          8..207 in the same Chrome PDF), which fails glyph-vs-box reftests that
//                          browsers pass. Kept for comparison (`--rasterizer pdftoppm`).
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { decodePng, parsePpm } from "./pixels.mjs";

const execFileP = promisify(execFile);

export const RASTER_DPI = 96;
export const RASTERIZERS = ["pdftocairo", "pdftoppm"];

export function toolPath(name) {
  const env = { pdftoppm: "PDFTOPPM", pdftocairo: "PDFTOCAIRO", pdfinfo: "PDFINFO" }[name];
  return process.env[env] ?? name;
}

/** Backend argument list (without page range / input / output) for a raster config. */
export function rasterArgs({ rasterizer = "pdftocairo", dpi = RASTER_DPI, antialias = true } = {}) {
  if (rasterizer === "pdftocairo") {
    return ["-png", "-r", String(dpi), ...(antialias ? [] : ["-antialias", "none"])];
  }
  return ["-r", String(dpi), ...(antialias ? [] : ["-aa", "no", "-aaVector", "no"])];
}

function withPdfFile(pdf, fn) {
  const dir = mkdtempSync(join(tmpdir(), "vellora-wpt-"));
  const input = join(dir, "in.pdf");
  writeFileSync(input, pdf);
  return fn(dir, input).finally(() => rmSync(dir, { recursive: true, force: true }));
}

/**
 * Rasterize pages [firstPage, firstPage + maxPages) of `pdf` (Uint8Array). Returns
 * [{ width, height, data }] in page order. `maxPages` bounds the work for runaway documents; use
 * `pdfinfoPages` when the true page count matters.
 */
export function rasterize(
  pdf,
  {
    rasterizer = "pdftocairo",
    dpi = RASTER_DPI,
    antialias = true,
    firstPage = 1,
    maxPages = 50,
  } = {},
) {
  return withPdfFile(pdf, async (dir, input) => {
    const args = [
      ...rasterArgs({ rasterizer, dpi, antialias }),
      "-f",
      String(firstPage),
      "-l",
      String(firstPage + maxPages - 1),
      input,
      join(dir, "p"),
    ];
    await execFileP(toolPath(rasterizer), args, { maxBuffer: 1 << 20 });
    const ext = rasterizer === "pdftocairo" ? "png" : "ppm";
    const re = new RegExp(`^p-(\\d+)\\.${ext}$`);
    return readdirSync(dir)
      .filter((f) => re.test(f))
      .map((f) => ({ n: Number(re.exec(f)[1]), f }))
      .sort((a, b) => a.n - b.n)
      .map(({ f }) => {
        const bytes = readFileSync(join(dir, f));
        return ext === "png" ? decodePng(bytes) : parsePpm(bytes);
      });
  });
}

/** True page count via poppler's pdfinfo (krilla may keep the page tree in object streams). */
export function pdfinfoPages(pdf) {
  return withPdfFile(pdf, async (_dir, input) => {
    const { stdout } = await execFileP(toolPath("pdfinfo"), [input], { maxBuffer: 1 << 20 });
    const m = /^Pages:\s+(\d+)/m.exec(stdout);
    return m ? Number(m[1]) : null;
  });
}
