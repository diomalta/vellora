#!/usr/bin/env node
// PAGINATED probe (complements run.mjs, which is pre-pagination only): render the same fixture
// HTML to PDF with vellora (vellora_core::render via the layout_dump example of --dump-repo) and
// with Chrome (page.pdf, print media, preferCSSPageSize, bundled fonts), extract the words of both
// PDFs with an independent extractor and pair them. Answers "is a PDF-level delta already present
// in the pre-pagination layers, or introduced by pagination/emit?". With a schema-2 dump
// (pagination trace), every vellora word is also mapped to the fragment pagination placed it
// with, and its dy is split into pagination's in-page drift (layer P) and the rest.
//
// Semantics 2 (lib/pdf-probe-v2.mjs, PDF_PROBE_SETTINGS; recorded in every pdf-probe.json and
// checked by the gate, which REFUSES to compare sections of different semantics/settings):
// words are PyMuPDF character origins (fidelity/oracles/py/words.py: pen x, BASELINE y), paired
// per page and text by a bounded optimal assignment; pairs are keyed by the Chrome word; words
// without a partner are listed as unpaired on each side. Semantics 1 (pdftotext -bbox yMin,
// k-th occurrence pairing; parseBbox/alignWords below) is kept for history only.
//
//   node fidelity/layout-diff/pdf-probe.mjs --label <name> [--dump-repo <checkout>]
//     [--fixtures notification,invoice] [--chrome <path>] [--out <dir>]
//
// Requires run.mjs to have produced <out>/<fixture>/<label>/native.html + browser.html first, and
// fidelity/.venv (PyMuPDF; VELLORA_FIDELITY_PYTHON overrides the interpreter).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { printPdf } from "../lib/chrome-reference.mjs";
import { launchChrome, resolveChrome } from "./lib/chrome-snapshot.mjs";
import { blitzLabel, captureEnv } from "./lib/env.mjs";
import { FIXTURE_IDS, repoRoot } from "./lib/fixture-html.mjs";
import { MAX_PAIR_DISTANCE_PT, probeResultV2 } from "./lib/pdf-probe-v2.mjs";
import { pdfWordsV2, requirePython } from "./lib/pdf-words.mjs";
import { paginationLayer } from "./lib/vellora-model.mjs";

// Semantics 1 helpers (history; re-exported for the existing tests and the re-score report).
export { alignWords, parseBbox } from "./lib/pdf-probe-v1.mjs";

const PX_TO_PT = 0.75;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

/**
 * The pagination placement a vellora PDF word belongs to: same page, and the word's vertical
 * centre inside the placed fragment span (page-local content box + @page margin-top, in pt).
 * `placements` are paginationLayer summary rows (offset_vs_flow / drift in CSS px).
 */
export function fragmentAt(placements, marginTopPx, word) {
  const yc = (word.y + word.h / 2) / PX_TO_PT - marginTopPx;
  const hit = placements.find(
    (r) =>
      r.page === word.page - 1 &&
      yc >= r.placed_top - 0.5 &&
      yc <= r.placed_top + (r.bottom - r.top) + 0.5,
  );
  return hit
    ? {
        placement: hit.index,
        root: hit.path,
        offset_vs_flow_pt: Math.round(hit.offset_vs_flow * PX_TO_PT * 100) / 100,
        drift_pt: Math.round(hit.drift * PX_TO_PT * 100) / 100,
      }
    : null;
}

/** A v2 word's vertical centre as fragmentAt expects it (baseline - 0.25 em ~ glyph-box centre). */
const centreOf = (w) => ({ page: w.page, y: w.y - 0.25 * (w.size ?? 0), h: 0 });

async function main() {
  const dumpRepo = resolve(arg("--dump-repo", repoRoot));
  const label = arg("--label", blitzLabel(dumpRepo));
  const fixtures = arg("--fixtures", FIXTURE_IDS.join(",")).split(",").filter(Boolean);
  const out = resolve(arg("--out", join(repoRoot, "fidelity", "results", "layout-diff")));
  const maxDistancePt = Number(arg("--max-distance", String(MAX_PAIR_DISTANCE_PT)));
  const chromePath = resolveChrome(arg("--chrome", undefined));
  const python = requirePython();
  const env = await captureEnv({
    repo: dumpRepo,
    command: `node ${process.argv.slice(1).join(" ")}`,
    chromePath,
  });
  env.python = execFileSync(python, ["-I", "-c", "import sys; print(sys.version.split()[0])"], {
    encoding: "utf8",
  }).trim();
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
      // The ONE shared print path (fidelity/lib/chrome-reference.mjs): print media, fonts
      // awaited, page.pdf({ format: "A4", preferCSSPageSize: true, printBackground: true }).
      const cPdf = join(dir, "chrome.pdf");
      writeFileSync(cPdf, await printPdf(browser, readFileSync(join(dir, "browser.html"), "utf8")));
      const v = pdfWordsV2(vPdf, python);
      const c = pdfWordsV2(cPdf, python);
      env.extractor = v.tool;
      const probe = probeResultV2({
        velloraWords: v.words,
        chromeWords: c.words,
        maxDistancePt,
        velloraOffPage: v.offPage,
        chromeOffPage: c.offPage,
      });
      const dump = JSON.parse(readFileSync(join(dir, "vellora-dump.json"), "utf8"));
      const nodeById = new Map(dump.nodes.map((n) => [n.id, n]));
      const pag = dump.pagination
        ? paginationLayer(dump.pagination, { boxes: new Map(), runs: [] }, nodeById).summary
        : null;
      if (pag) {
        for (const p of probe.pairs) {
          const frag = fragmentAt(pag.placements, dump.page.margin_top, centreOf(p.vellora));
          // Layer P: the fragment pagination placed this word with and its in-page drift; the
          // rest of dy (dy_pt - drift_pt) is what the pre-pagination layers + emit carry.
          p.pagination = frag;
          p.dy_without_pagination_drift_pt = frag
            ? Math.round((p.dy_pt - frag.drift_pt) * 100) / 100
            : null;
        }
      }
      const result = {
        ...probe,
        fixture,
        label,
        env,
        note: "PDF points, top-left origin; x = pen origin of a word's first glyph, y = its BASELINE (PyMuPDF character origins, independent of the producers' declared /Ascent); deltas = vellora - Chrome; pairs are same-page by construction and keyed by the Chrome word (settings.key).",
        pagination: pag
          ? {
              page_count: pag.page_count,
              placements: pag.placements.length,
              words_mapped_to_a_fragment: probe.pairs.filter((x) => x.pagination).length,
              words_with_drift_over_1pt: probe.pairs.filter(
                (x) => Math.abs(x.pagination?.drift_pt ?? 0) > 1,
              ).length,
            }
          : null,
      };
      writeFileSync(join(dir, "pdf-probe.json"), `${JSON.stringify(result, null, 2)}\n`);
      const last = probe.pairs.slice(-6);
      process.stdout.write(
        `${fixture} [${label}] pages v/c ${probe.pages.vellora}/${probe.pages.chrome}; paired ${probe.words.paired}, unpaired vellora ${probe.words.unpairedVellora}, unpaired chrome ${probe.words.unpairedChrome}; last words: ${last.map((p) => `${p.text}(${p.dx_pt},${p.dy_pt})`).join(" ")}\n`,
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
