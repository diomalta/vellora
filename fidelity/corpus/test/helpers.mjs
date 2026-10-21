// Test helpers for the corpus oracles (not a test file: the node --test glob is *.test.mjs).
//
// syntheticPdf() writes a tiny, deterministic PDF with base-14 Helvetica text placed in mm, so the
// Python oracles can be exercised on inputs whose ground truth is known exactly, without any
// renderer (vellora or Chrome) in the loop. runPy() runs a corpus oracle in fidelity/.venv; when the
// venv is missing the caller must t.skip() with the returned reason (reported, never silent).
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const corpusDir = resolve(here, "..");
export const repoRoot = resolve(corpusDir, "..", "..");
export const PY = join(repoRoot, "fidelity", ".venv", "bin", "python");

/** null when the venv exists, else the skip reason. */
export function pythonMissing() {
  return existsSync(PY)
    ? null
    : "not-run: fidelity/.venv is missing (uv venv --python 3.12 fidelity/.venv; uv pip install -r fidelity/corpus/requirements.txt)";
}

export function tmp(prefix) {
  return mkdtempSync(join(tmpdir(), `vellora-corpus-${prefix}-`));
}

export function runPy(script, args) {
  const out = execFileSync(PY, ["-I", join(corpusDir, script), ...args], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out);
}

export function runPyInline(code, args = []) {
  return execFileSync(PY, ["-I", "-B", "-c", code, ...args], { encoding: "utf8" });
}

const pt = (mm) => (mm * 72) / 25.4;

/** Helvetica advance widths (AFM, 1/1000 em) for the characters money tokens use. */
const HELV = { ".": 278, ",": 278, "-": 333, " ": 278 };
export function helveticaWidthMm(text, size) {
  let units = 0;
  for (const ch of text) {
    if (/[0-9]/.test(ch)) {
      units += 556;
    } else if (ch in HELV) {
      units += HELV[ch];
    } else {
      throw new Error(`no width for ${JSON.stringify(ch)}`);
    }
  }
  return ((units / 1000) * size * 25.4) / 72;
}

/**
 * items: [{ text, xMm, topMm, size, bold?, page? (1-based) }] -> PDF bytes. Text is WinAnsi
 * (Latin-1 subset); the baseline is placed so the cap height (0.718 em) starts at topMm.
 */
export function syntheticPdf(items, { widthMm = 210, heightMm = 297 } = {}) {
  const W = pt(widthMm);
  const H = pt(heightMm);
  const pageCount = Math.max(1, ...items.map((i) => i.page ?? 1));
  const esc = (s) => s.replace(/[\\()]/g, (c) => `\\${c}`);
  const contents = [];
  for (let p = 1; p <= pageCount; p += 1) {
    let c = "";
    for (const it of items.filter((i) => (i.page ?? 1) === p)) {
      const y = H - pt(it.topMm) - it.size * 0.718;
      c += `BT /${it.bold ? "F2" : "F1"} ${it.size} Tf 1 0 0 1 ${pt(it.xMm).toFixed(3)} ${y.toFixed(3)} Tm (${esc(it.text)}) Tj ET\n`;
    }
    contents.push(Buffer.from(c, "latin1"));
  }
  // 1 catalog, 2 pages, 3/4 fonts, then (page, content) pairs.
  const objs = [];
  const kids = contents.map((_, i) => `${5 + 2 * i} 0 R`).join(" ");
  objs.push(Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"));
  objs.push(Buffer.from(`<< /Type /Pages /Kids [${kids}] /Count ${pageCount} >>`));
  objs.push(
    Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    ),
  );
  objs.push(
    Buffer.from(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    ),
  );
  contents.forEach((c, i) => {
    objs.push(
      Buffer.from(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(3)} ${H.toFixed(3)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + 2 * i} 0 R >>`,
      ),
    );
    objs.push(
      Buffer.concat([
        Buffer.from(`<< /Length ${c.length} >>\nstream\n`),
        c,
        Buffer.from("\nendstream"),
      ]),
    );
  });
  const parts = [Buffer.from("%PDF-1.4\n")];
  const offsets = [];
  let pos = parts[0].length;
  objs.forEach((body, i) => {
    offsets.push(pos);
    const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), body, Buffer.from("\nendobj\n")]);
    parts.push(chunk);
    pos += chunk.length;
  });
  const xref = [
    "xref",
    `0 ${objs.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objs.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(pos),
    "%%EOF",
    "",
  ].join("\n");
  parts.push(Buffer.from(xref));
  return Buffer.concat(parts);
}

export function writeJson(dir, name, value) {
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
}

export function writeFile(dir, name, bytes) {
  const path = join(dir, name);
  writeFileSync(path, bytes);
  return path;
}
