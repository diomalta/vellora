#!/usr/bin/env node
import { execFile } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PDFTOTEXT = join(
  process.env.HOME ?? "",
  ".cache",
  "codex-runtimes",
  "codex-primary-runtime",
  "dependencies",
  "native",
  "poppler",
  "poppler",
  "bin",
  "pdftotext",
);

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

function htmlDecode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

async function findExecutable(name, envName, fallbackPath) {
  const envValue = process.env[envName];
  if (envValue) {
    if (!existsSync(envValue)) {
      throw new Error(`${envName} points to a missing executable: ${envValue}`);
    }
    return envValue;
  }
  if (fallbackPath && existsSync(fallbackPath)) {
    return fallbackPath;
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

async function extractWords({ pdftotext, pdfPath, outPath, page }) {
  await execFileAsync(pdftotext, [
    "-bbox",
    "-f",
    String(page),
    "-l",
    String(page),
    pdfPath,
    outPath,
  ]);
  const html = readFileSync(outPath, "utf8");
  return [
    ...html.matchAll(
      /<word xMin="([^"]+)" yMin="([^"]+)" xMax="([^"]+)" yMax="([^"]+)">([\s\S]*?)<\/word>/g,
    ),
  ]
    .map((match, index) => ({
      index,
      text: htmlDecode(match[5]).trim(),
      xMin: Number(match[1]),
      yMin: Number(match[2]),
      xMax: Number(match[3]),
      yMax: Number(match[4]),
    }))
    .filter((word) => word.text.length > 0);
}

function matchWords(referenceWords, subjectWords) {
  const queues = new Map();
  for (const word of subjectWords) {
    const queue = queues.get(word.text) ?? [];
    queue.push(word);
    queues.set(word.text, queue);
  }

  const matched = [];
  const missing = [];
  for (const reference of referenceWords) {
    const subject = queues.get(reference.text)?.shift();
    if (!subject) {
      missing.push(reference);
      continue;
    }
    const dx = subject.xMin - reference.xMin;
    const dTop = subject.yMin - reference.yMin;
    const dBottom = subject.yMax - reference.yMax;
    // Vertical position error is measured at the box MIDPOINT (~ baseline), not the
    // top edge. pdftotext derives the top edge from the embedded font's
    // FontDescriptor /Ascent, and krilla emits OS/2 sTypo ascent while Chromium
    // emits hhea ascent — so the reported top differs by ~0.177*size with NO glyph
    // moving. The midpoint tracks real glyph placement (descent matches to ~1/1000).
    const dy = (subject.yMin + subject.yMax) / 2 - (reference.yMin + reference.yMax) / 2;
    const dRight = subject.xMax - reference.xMax;
    matched.push({
      text: reference.text,
      referenceIndex: reference.index,
      subjectIndex: subject.index,
      reference,
      subject,
      delta: {
        x: dx,
        y: dy,
        top: dTop,
        right: dRight,
        bottom: dBottom,
        distance: Math.hypot(dx, dy),
      },
    });
  }

  const extra = [...queues.values()].flat();
  return { matched, missing, extra };
}

function mean(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(matches) {
  const absX = matches.map((match) => Math.abs(match.delta.x));
  const absY = matches.map((match) => Math.abs(match.delta.y));
  const distances = matches.map((match) => match.delta.distance);
  // Box-height ratio makes the FontDescriptor ascent artifact explicit: it is a
  // ~constant per-font value (~0.84 for the bundled sans) and means nothing moved.
  const heightRatios = matches
    .map((m) => (m.subject.yMax - m.subject.yMin) / (m.reference.yMax - m.reference.yMin))
    .filter((r) => Number.isFinite(r) && r > 0);
  return {
    matchedWords: matches.length,
    meanAbsX: mean(absX),
    meanAbsY: mean(absY),
    p95Distance: percentile(distances, 95),
    maxDistance: Math.max(0, ...distances),
    meanHeightRatio: mean(heightRatios),
  };
}

async function main() {
  const fixture = argValue("--fixture", "invoice");
  const page = numberArg("--page", 1);
  const top = numberArg("--top", 20);
  const visualDir = resolve(
    repoRoot,
    argValue("--visual-dir", "benchmarks/results/visual-fidelity"),
  );
  const outDir = resolve(repoRoot, argValue("--out", "benchmarks/results/geometry-fidelity"));
  const pdftotext = await findExecutable("pdftotext", "PDFTOTEXT_BIN", DEFAULT_PDFTOTEXT);

  const referencePdf = join(visualDir, "pdf", "puppeteer", `${fixture}.pdf`);
  const subjectPdf = join(visualDir, "pdf", "vellora", `${fixture}.pdf`);
  if (!existsSync(referencePdf) || !existsSync(subjectPdf)) {
    throw new Error(
      `Missing visual fidelity PDFs for "${fixture}". Run npm run visual:fidelity -- --fixture ${fixture} first.`,
    );
  }

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const referenceWords = await extractWords({
    pdftotext,
    pdfPath: referencePdf,
    outPath: join(outDir, `${fixture}-page-${page}-puppeteer-bbox.html`),
    page,
  });
  const subjectWords = await extractWords({
    pdftotext,
    pdfPath: subjectPdf,
    outPath: join(outDir, `${fixture}-page-${page}-vellora-bbox.html`),
    page,
  });
  const comparison = matchWords(referenceWords, subjectWords);
  const largestDeltas = [...comparison.matched]
    .sort((a, b) => b.delta.distance - a.delta.distance)
    .slice(0, top);
  const report = {
    schemaVersion: 1,
    suite: "vellora-geometry-fidelity",
    generatedAt: new Date().toISOString(),
    reference: "puppeteer",
    subject: "vellora",
    fixture,
    page,
    units: "pt",
    summary: summarize(comparison.matched),
    missingWords: comparison.missing.length,
    extraWords: comparison.extra.length,
    largestDeltas,
  };

  writeFileSync(join(outDir, "summary.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `${fixture} page ${page}: matched ${report.summary.matchedWords} words; mean |dx| ${report.summary.meanAbsX.toFixed(2)}pt; mean |dy| ${report.summary.meanAbsY.toFixed(2)}pt; p95 distance ${report.summary.p95Distance.toFixed(2)}pt; max distance ${report.summary.maxDistance.toFixed(2)}pt`,
  );
  for (const delta of largestDeltas) {
    console.log(
      `${delta.text.padEnd(24)} dx=${delta.delta.x.toFixed(2)}pt dy=${delta.delta.y.toFixed(2)}pt distance=${delta.delta.distance.toFixed(2)}pt`,
    );
  }
  console.log(`Geometry fidelity report: ${join(outDir, "summary.json")}`);
}

main().catch((err) => {
  process.stderr.write(`geometry fidelity run failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
