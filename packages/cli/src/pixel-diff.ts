import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface PixelDiffOptions {
  outDir?: string;
  pdftoppmPath?: string;
  dpi?: number;
  threshold?: number;
  budget?: number;
  keepTempFiles?: boolean;
}

export interface PixelDiffPage {
  page: number;
  dimensions: {
    referenceWidth: number;
    referenceHeight: number;
    subjectWidth: number;
    subjectHeight: number;
    comparedWidth: number;
    comparedHeight: number;
  };
  metrics: {
    pixels: number;
    mismatchPixels: number;
    mismatchRatio: number;
    meanAbsoluteError: number;
    maxChannelDelta: number;
  };
  referenceImage?: string;
  subjectImage?: string;
  diffImage?: string;
}

export interface PdfPixelDiffReport {
  available: boolean;
  ok: boolean;
  dpi: number;
  threshold: number;
  budget: number;
  referencePages: number;
  subjectPages: number;
  comparedPages: number;
  pageCountMismatch: boolean;
  dimensionMismatch: boolean;
  pixels: number;
  mismatchPixels: number;
  mismatchRatio: number;
  meanAbsoluteError: number;
  maxChannelDelta: number;
  pages: PixelDiffPage[];
  error?: string;
}

interface RgbImage {
  width: number;
  height: number;
  data: Uint8Array;
}

interface RasterizedPdf {
  pdfPath: string;
  imagePaths: string[];
}

export async function diffPdfPixels(
  referencePdf: Uint8Array,
  subjectPdf: Uint8Array,
  options: PixelDiffOptions = {},
): Promise<PdfPixelDiffReport> {
  const dpi = positiveNumber(options.dpi ?? 144, "dpi");
  const threshold = nonNegativeNumber(options.threshold ?? 12, "threshold");
  const budget = nonNegativeNumber(options.budget ?? 0.02, "budget");
  const pdftoppm = options.pdftoppmPath ?? process.env.PDFTOPPM_BIN ?? "pdftoppm";
  const workDir = await mkdtemp(join(tmpdir(), "vellora-pixel-diff-"));
  const visualDir = options.outDir ? join(options.outDir, "visual") : undefined;

  try {
    if (visualDir) {
      await mkdir(visualDir, { recursive: true });
    }
    const reference = await rasterizePdf(referencePdf, {
      workDir,
      label: "reference",
      pdftoppm,
      dpi,
    });
    const subject = await rasterizePdf(subjectPdf, {
      workDir,
      label: "subject",
      pdftoppm,
      dpi,
    });
    const comparedPages = Math.min(reference.imagePaths.length, subject.imagePaths.length);
    const pages: PixelDiffPage[] = [];
    let pixels = 0;
    let mismatchPixels = 0;
    let absoluteErrorSum = 0;
    let maxChannelDelta = 0;

    for (let index = 0; index < comparedPages; index += 1) {
      const page = index + 1;
      const referencePath = reference.imagePaths[index] as string;
      const subjectPath = subject.imagePaths[index] as string;
      const comparison = compareRgbImages(
        decodePpm(await readFile(referencePath)),
        decodePpm(await readFile(subjectPath)),
        threshold,
      );
      pixels += comparison.metrics.pixels;
      mismatchPixels += comparison.metrics.mismatchPixels;
      absoluteErrorSum += comparison.metrics.meanAbsoluteError * comparison.metrics.pixels;
      maxChannelDelta = Math.max(maxChannelDelta, comparison.metrics.maxChannelDelta);

      let referenceImage: string | undefined;
      let subjectImage: string | undefined;
      let diffImage: string | undefined;
      if (visualDir && options.outDir) {
        const referenceOut = join(visualDir, `reference-page-${page}.ppm`);
        const subjectOut = join(visualDir, `subject-page-${page}.ppm`);
        const diffOut = join(visualDir, `diff-page-${page}.ppm`);
        await writeFile(referenceOut, await readFile(referencePath));
        await writeFile(subjectOut, await readFile(subjectPath));
        await writeFile(diffOut, encodePpm(comparison.diff));
        referenceImage = relative(options.outDir, referenceOut);
        subjectImage = relative(options.outDir, subjectOut);
        diffImage = relative(options.outDir, diffOut);
      }

      pages.push({
        page,
        dimensions: comparison.dimensions,
        metrics: comparison.metrics,
        referenceImage,
        subjectImage,
        diffImage,
      });
    }

    const totalPixels = Math.max(1, pixels);
    const mismatchRatio = mismatchPixels / totalPixels;
    const pageCountMismatch = reference.imagePaths.length !== subject.imagePaths.length;
    const dimensionMismatch = pages.some(
      (page) =>
        page.dimensions.referenceWidth !== page.dimensions.subjectWidth ||
        page.dimensions.referenceHeight !== page.dimensions.subjectHeight,
    );

    return {
      available: true,
      ok: !pageCountMismatch && !dimensionMismatch && mismatchRatio <= budget,
      dpi,
      threshold,
      budget,
      referencePages: reference.imagePaths.length,
      subjectPages: subject.imagePaths.length,
      comparedPages,
      pageCountMismatch,
      dimensionMismatch,
      pixels,
      mismatchPixels,
      mismatchRatio,
      meanAbsoluteError: absoluteErrorSum / totalPixels,
      maxChannelDelta,
      pages,
    };
  } finally {
    if (!options.keepTempFiles) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

async function rasterizePdf(
  pdf: Uint8Array,
  options: { workDir: string; label: string; pdftoppm: string; dpi: number },
): Promise<RasterizedPdf> {
  const outDir = join(options.workDir, options.label);
  await mkdir(outDir, { recursive: true });
  const pdfPath = join(outDir, `${options.label}.pdf`);
  await writeFile(pdfPath, pdf);
  const prefix = join(outDir, "page");
  try {
    await execFileAsync(options.pdftoppm, ["-r", String(options.dpi), pdfPath, prefix], {
      maxBuffer: 1024 * 1024 * 16,
    });
  } catch (cause) {
    throw new Error(
      `Unable to rasterize ${options.label} PDF with pdftoppm. Install poppler or set PDFTOPPM_BIN. ${messageOf(cause)}`,
      { cause },
    );
  }
  const imagePaths = (await readdir(outDir))
    .map((name) => ({ name, page: pageNumber(name) }))
    .filter((entry): entry is { name: string; page: number } => entry.page !== undefined)
    .sort((a, b) => a.page - b.page)
    .map((entry) => join(outDir, entry.name));
  if (imagePaths.length === 0) {
    throw new Error(`pdftoppm produced no PPM pages for ${options.label} PDF.`);
  }
  return { pdfPath, imagePaths };
}

function pageNumber(name: string): number | undefined {
  const match = /^page-(\d+)\.ppm$/.exec(name);
  if (!match) {
    return undefined;
  }
  return Number(match[1]);
}

function compareRgbImages(reference: RgbImage, subject: RgbImage, threshold: number) {
  const width = Math.max(reference.width, subject.width);
  const height = Math.max(reference.height, subject.height);
  const pixels = Math.max(1, width * height);
  const diff = {
    width,
    height,
    data: new Uint8Array(width * height * 3),
  };
  let mismatchPixels = 0;
  let absoluteErrorSum = 0;
  let maxChannelDelta = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      const r = pixelAt(reference, x, y);
      const s = pixelAt(subject, x, y);
      const dr = Math.abs(r[0] - s[0]);
      const dg = Math.abs(r[1] - s[1]);
      const db = Math.abs(r[2] - s[2]);
      const delta = Math.max(dr, dg, db);
      maxChannelDelta = Math.max(maxChannelDelta, delta);
      absoluteErrorSum += (dr + dg + db) / (3 * 255);
      if (delta > threshold) {
        mismatchPixels += 1;
        diff.data[offset] = 255;
        diff.data[offset + 1] = 32;
        diff.data[offset + 2] = 32;
      } else {
        diff.data[offset] = 246;
        diff.data[offset + 1] = 247;
        diff.data[offset + 2] = 249;
      }
    }
  }

  return {
    dimensions: {
      referenceWidth: reference.width,
      referenceHeight: reference.height,
      subjectWidth: subject.width,
      subjectHeight: subject.height,
      comparedWidth: width,
      comparedHeight: height,
    },
    metrics: {
      pixels,
      mismatchPixels,
      mismatchRatio: mismatchPixels / pixels,
      meanAbsoluteError: absoluteErrorSum / pixels,
      maxChannelDelta,
    },
    diff,
  };
}

function pixelAt(image: RgbImage, x: number, y: number): [number, number, number] {
  if (x >= image.width || y >= image.height) {
    return [255, 255, 255];
  }
  const offset = (y * image.width + x) * 3;
  return [image.data[offset] ?? 255, image.data[offset + 1] ?? 255, image.data[offset + 2] ?? 255];
}

function decodePpm(bytes: Uint8Array): RgbImage {
  const buffer = Buffer.from(bytes);
  let offset = 0;
  const magic = readToken(
    buffer,
    () => offset,
    (next) => {
      offset = next;
    },
  );
  if (magic !== "P6") {
    throw new Error(`Unsupported PPM format ${JSON.stringify(magic)}; expected P6.`);
  }
  const width = Number(
    readToken(
      buffer,
      () => offset,
      (next) => {
        offset = next;
      },
    ),
  );
  const height = Number(
    readToken(
      buffer,
      () => offset,
      (next) => {
        offset = next;
      },
    ),
  );
  const max = Number(
    readToken(
      buffer,
      () => offset,
      (next) => {
        offset = next;
      },
    ),
  );
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new Error("Invalid PPM dimensions.");
  }
  if (max !== 255) {
    throw new Error(`Unsupported PPM max value ${max}; expected 255.`);
  }
  if (isWhitespace(buffer[offset] ?? 0)) {
    offset += 1;
  }
  const expected = width * height * 3;
  const data = buffer.subarray(offset, offset + expected);
  if (data.length !== expected) {
    throw new Error("Truncated PPM pixel data.");
  }
  return { width, height, data: new Uint8Array(data) };
}

function readToken(buffer: Buffer, getOffset: () => number, setOffset: (value: number) => void) {
  let offset = skipWhitespaceAndComments(buffer, getOffset());
  const start = offset;
  while (offset < buffer.length && !isWhitespace(buffer[offset] ?? 0)) {
    offset += 1;
  }
  if (start === offset) {
    throw new Error("Invalid PPM header.");
  }
  setOffset(offset);
  return buffer.subarray(start, offset).toString("ascii");
}

function skipWhitespaceAndComments(buffer: Buffer, offset: number): number {
  let current = offset;
  while (current < buffer.length) {
    const byte = buffer[current] ?? 0;
    if (isWhitespace(byte)) {
      current += 1;
      continue;
    }
    if (byte === 0x23) {
      while (current < buffer.length && buffer[current] !== 0x0a) {
        current += 1;
      }
      continue;
    }
    break;
  }
  return current;
}

function isWhitespace(byte: number): boolean {
  return byte === 0x20 || byte === 0x09 || byte === 0x0a || byte === 0x0d || byte === 0x0c;
}

function encodePpm(image: RgbImage): Uint8Array {
  return Buffer.concat([
    Buffer.from(`P6\n${image.width} ${image.height}\n255\n`, "ascii"),
    Buffer.from(image.data),
  ]);
}

function positiveNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number.`);
  }
  return value;
}

function nonNegativeNumber(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a finite number >= 0.`);
  }
  return value;
}

function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

export const pixelDiffInternals = {
  compareRgbImages,
  decodePpm,
  encodePpm,
};
