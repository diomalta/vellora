#!/usr/bin/env node
// Probe for pdf-probe v2's choice of coordinate (D1): rewrite the declared /Ascent of EVERY font
// descriptor of a PDF (two values far below and above any real one) and show that the v2 word
// coordinates (PyMuPDF character origins: pen x, baseline) do not move, while poppler
// `pdftotext -bbox` yMin (pdf-probe v1's y) moves by delta-Ascent x size. Runs on the vellora
// and Chrome PDFs of every fixture of a run-all output, i.e. on every bundled font face the
// corpus embeds, as each producer embeds it.
//
//   node fidelity/layout-diff/ascent-probe.mjs --run <run-all dir> [--out <file.json>]
//     [--pdftotext <bin>]
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { arch, platform, release, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { portable } from "../combine/env.mjs";
import { repoRoot } from "./lib/fixture-html.mjs";
import { parseBbox } from "./lib/pdf-probe-v1.mjs";
import { MUTATE_PY, pdfWordsV2, requirePython } from "./lib/pdf-words.mjs";

const VALUES = [450, 1100];

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

/**
 * yMin change of each pdftotext word of the original matched in the mutated PDF by (page, text,
 * xMin): pdftotext re-orders and re-splits words when the boxes change, so indices do not match.
 */
export function yMinShifts(before, after) {
  const key = (w) => `${w.page}|${w.text}|${w.x.toFixed(2)}`;
  const pool = new Map();
  for (const w of after) {
    if (!pool.has(key(w))) pool.set(key(w), []);
    pool.get(key(w)).push(w);
  }
  const out = [];
  for (const w of before) {
    const m = pool.get(key(w))?.shift();
    if (m) out.push(m.y - w.y);
  }
  return out.length ? out : null;
}

/** Max |change| of (x, baseline) between two word lists of the same PDF (same order). */
export function originShift(a, b) {
  if (a.length !== b.length) return { comparable: false, words: [a.length, b.length] };
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i].text !== b[i].text) return { comparable: false, at: i };
    dx = Math.max(dx, Math.abs(a[i].x - b[i].x));
    dy = Math.max(dy, Math.abs(a[i].y - b[i].y));
  }
  return { comparable: true, words: a.length, maxAbsDx: dx, maxAbsDy: dy };
}

function main() {
  const run = resolve(arg("--run", ""));
  const pdftotext = arg("--pdftotext", "pdftotext");
  const python = requirePython();
  const work = mkdtempSync(join(tmpdir(), "ascent-probe-"));
  const ld = join(run, "layout-diff");
  const out = {
    what: "declared /Ascent rewritten in every FontDescriptor; v2 = PyMuPDF origins (x, baseline), v1 = pdftotext -bbox yMin",
    command: `node ${process.argv.slice(1).join(" ")}`,
    date: new Date().toISOString(),
    run,
    env: {
      os: `${platform()} ${release()} ${arch()}`,
      node: process.version,
      python: execFileSync(python, ["-I", "-c", "import sys; print(sys.version.split()[0])"], {
        encoding: "utf8",
      }).trim(),
      pdftotext: (() => {
        const r = spawnSync(pdftotext, ["-v"], { encoding: "utf8" });
        return `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n")[0].trim();
      })(),
      extractor: null,
    },
    values: VALUES,
    files: [],
  };
  try {
    for (const fixture of readdirSync(ld).sort()) {
      for (const who of ["vellora", "chrome"]) {
        const pdf = join(ld, fixture, "run-all", `${who}.pdf`);
        if (!existsSync(pdf)) continue;
        const base = pdfWordsV2(pdf, python);
        out.env.extractor = base.tool;
        const boxes = (p) =>
          parseBbox(execFileSync(pdftotext, ["-bbox", p, "-"], { encoding: "utf8" }));
        const b0 = boxes(pdf);
        const row = { fixture, producer: who, words: base.words.length, mutations: [] };
        for (const value of VALUES) {
          const m = join(work, `${fixture}-${who}-${value}.pdf`);
          const r = JSON.parse(
            execFileSync(python, ["-I", MUTATE_PY, "set-ascent", pdf, m, String(value)], {
              encoding: "utf8",
            }),
          );
          row.fonts ??= r.descriptors.map((d) => ({
            font: d.font.replace(/^\/[A-Z]{6}\+/, ""),
            ascent: Number(d.before),
          }));
          const shifts = yMinShifts(b0, boxes(m));
          row.mutations.push({
            ascent: value,
            v2: originShift(base.words, pdfWordsV2(m, python).words),
            v1YMinShiftPt: shifts
              ? {
                  matched: shifts.length,
                  of: b0.length,
                  min: Math.round(Math.min(...shifts) * 1000) / 1000,
                  max: Math.round(Math.max(...shifts) * 1000) / 1000,
                }
              : "no pdftotext word matched",
          });
        }
        out.files.push(row);
        const v2 = row.mutations.map(
          (x) =>
            `${x.ascent}: v2 max |d| ${x.v2.maxAbsDx}/${x.v2.maxAbsDy}, v1 yMin ${JSON.stringify(x.v1YMinShiftPt)}`,
        );
        process.stdout.write(
          `${fixture} ${who} ${row.fonts.map((f) => `${f.font}@${f.ascent}`).join(",")} | ${v2.join(" | ")}\n`,
        );
      }
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
  const file = arg("--out", null);
  if (file) writeFileSync(file, `${JSON.stringify(portable(out, repoRoot), null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
