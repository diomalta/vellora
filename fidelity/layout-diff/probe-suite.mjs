#!/usr/bin/env node
// Probe fixtures as pdf-probe v2 rows (2026-10-22): small HTML documents that exercise pagination
// and @page behaviour the corpus never does (forced breaks and their margins, @media-scoped break
// rules, partial boxes / tables / images at a page end, RTL inline alignment, ...). Step 09's
// review wrote 37 such probes by hand and caught a fix-5 regression the gate missed (two probes
// moved away from Chrome while no corpus oracle moved); as a suite they are gated like any fixture.
//
// Per probe `<id>` of the suite file (default fidelity/layout-diff/probes/review-fixes-09.json):
//   vellora   the built native addon (`@vellora/native` render(html bytes, { title, creationDate:
//             [2000, 1, 1] })): what renderPdf(html, undefined, { strict: true }) hands the bridge,
//             WITHOUT templating, so a probe's literal `{{...}}` text (g_postmark_raw) is drawn as
//             Chrome draws it; the same path the step-09 probes were measured with
//   Chrome    fidelity/lib/chrome-reference.mjs referenceHtml (bundled Liberation/DejaVu
//             @font-face) + printPdf (print media, page.pdf A4 preferCSSPageSize), printed at
//             run time like every other fixture's reference
//   words     PyMuPDF character origins (fidelity/oracles/py/words.py), incl. off-page words
//   probe     probeResultV2 (semantics 2), written to <out>/probe-<id>/<label>/pdf-probe.json with
//             vellora.pdf and chrome.pdf, so gate/snapshot.mjs loadRunDir reads each probe as the
//             pdf-probe fixture `probe-<id>` (deterministic names: the suite's ids)
// A probe the strict gate rejects writes rejected.json instead of pdf-probe.json (a baseline that
// measured it then gates the fixture as removed). Exit 1 when a probe cannot be measured.
//
//   node fidelity/layout-diff/probe-suite.mjs [--suite <file>] [--out <layout-diff dir>]
//     [--label run-all] [--chrome <path>] [--only id,id]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  launchReferenceChrome,
  printPdf,
  referenceHtml,
  resolveChrome,
} from "../lib/chrome-reference.mjs";
import { probeResultV2 } from "./lib/pdf-probe-v2.mjs";
import { pdfWordsV2, requirePython } from "./lib/pdf-words.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_SUITE = join(here, "probes", "review-fixes-09.json");
export const PROBE_SUITE_SCHEMA = "vellora-fidelity/probe-suite/1";
/** pdf-probe fixture name of a probe (the directory under layout-diff/). */
export const probeFixture = (id) => `probe-${id}`;
/** Fixed render options: same input, same bytes (DET-1). */
export const PROBE_RENDER_OPTS = Object.freeze({
  title: "vellora-fidelity-probe",
  creationDate: [2000, 1, 1],
});

/** Load and validate a suite file: unique ids matching [a-z0-9_]+, html present. */
export function loadSuite(file = DEFAULT_SUITE) {
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (doc.schema !== PROBE_SUITE_SCHEMA) {
    throw new Error(`${file}: schema ${doc.schema} (expected ${PROBE_SUITE_SCHEMA})`);
  }
  const ids = new Set();
  for (const p of doc.probes ?? []) {
    if (!/^[a-z0-9_]+$/.test(p.id ?? "")) throw new Error(`${file}: bad probe id ${p.id}`);
    if (ids.has(p.id)) throw new Error(`${file}: duplicate probe id ${p.id}`);
    if (typeof p.html !== "string" || !p.html)
      throw new Error(`${file}: probe ${p.id} has no html`);
    ids.add(p.id);
  }
  return doc;
}

function arg(argv, name, fallback) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : fallback;
}

async function main() {
  const argv = process.argv.slice(2);
  const repoRoot = resolve(here, "..", "..");
  const suiteFile = resolve(arg(argv, "--suite", DEFAULT_SUITE));
  const out = resolve(arg(argv, "--out", join(repoRoot, "fidelity", "results", "layout-diff")));
  const label = arg(argv, "--label", "run-all");
  const only = arg(argv, "--only", "").split(",").filter(Boolean);
  const suite = loadSuite(suiteFile);
  const probes = suite.probes.filter((p) => !only.length || only.includes(p.id));
  const python = requirePython();
  let native;
  try {
    native = await import("@vellora/native");
  } catch (cause) {
    throw new Error(
      "@vellora/native is not built: run `npm ci && npm run build` at the repo root",
      {
        cause,
      },
    );
  }
  const chrome = await launchReferenceChrome(resolveChrome(arg(argv, "--chrome", undefined)));
  const env = {
    suite: suiteFile.startsWith(repoRoot) ? suiteFile.slice(repoRoot.length + 1) : suiteFile,
    chrome: chrome.version,
    node: process.version,
    python: execFileSync(python, ["-I", "-c", "import sys; print(sys.version.split()[0])"], {
      encoding: "utf8",
    }).trim(),
  };
  let failed = 0;
  try {
    for (const p of probes) {
      const dir = join(out, probeFixture(p.id), label);
      mkdirSync(dir, { recursive: true });
      try {
        let pdf;
        try {
          pdf = await native.render(new TextEncoder().encode(p.html), { ...PROBE_RENDER_OPTS });
        } catch (e) {
          // A located core diagnostic ({ feature, line, col, hint }) is a strict-gate rejection.
          if (!e?.feature) throw e;
          writeFileSync(
            join(dir, "rejected.json"),
            `${JSON.stringify({ probe: p.id, error: String(e.message ?? e), feature: e.feature, line: e.line ?? null, col: e.col ?? null }, null, 2)}\n`,
          );
          process.stdout.write(`${probeFixture(p.id)}: rejected by the strict gate\n`);
          continue;
        }
        const vPdf = join(dir, "vellora.pdf");
        const cPdf = join(dir, "chrome.pdf");
        writeFileSync(vPdf, pdf);
        writeFileSync(cPdf, await printPdf(chrome, referenceHtml(p.html)));
        const v = pdfWordsV2(vPdf, python);
        const c = pdfWordsV2(cPdf, python);
        const probe = probeResultV2({
          velloraWords: v.words,
          chromeWords: c.words,
          velloraOffPage: v.offPage,
          chromeOffPage: c.offPage,
        });
        const result = {
          ...probe,
          fixture: probeFixture(p.id),
          label,
          probe: { id: p.id, targets: p.targets ?? null, suite: suite.name },
          env: { ...env, extractor: v.tool },
          note: "Probe fixture (fidelity/layout-diff/probe-suite.mjs): PDF points, top-left origin; x = pen origin of a word's first glyph, y = its BASELINE; deltas = vellora - Chrome; pairs keyed by the Chrome word.",
        };
        writeFileSync(join(dir, "pdf-probe.json"), `${JSON.stringify(result, null, 2)}\n`);
        process.stdout.write(
          `${probeFixture(p.id)}: pages v/c ${probe.pages.vellora}/${probe.pages.chrome}; paired ${probe.words.paired}, unpaired vellora ${probe.words.unpairedVellora}, chrome ${probe.words.unpairedChrome}; off-page vellora ${probe.offPage?.vellora.length ?? "?"}\n`,
        );
      } catch (e) {
        failed++;
        process.stderr.write(`${probeFixture(p.id)}: ${e?.stack ?? e}\n`);
      }
    }
  } finally {
    await chrome.close();
  }
  process.exitCode = failed ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`probe-suite failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
