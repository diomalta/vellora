#!/usr/bin/env node
// Offline backfill of vellora's OFF-PAGE words into a committed baseline's pdf-probe v2 sections
// (2026-10-22), from the PDFs of the run the baseline was written from. PyMuPDF's page words (the
// pdf-probe word source) do not include text drawn outside the MediaBox, so before the off-page
// rule (gate/compare.mjs compareOffPage) a word that moved below the page read as an
// unpaired-vellora "improvement" (step 08, postmark "Download as PDF"). fidelity/oracles/py/
// words.py now also lists `offPage` words; sections written earlier lack the record, and the gate
// then gates every off-page word of a run against them. Changes nothing but the `offPage` field
// of each section and the manifest's file hashes:
//
//   - each section is recomputed from layout-diff/<fixture>/run-all/{vellora,chrome}.pdf of the
//     run and must equal the committed section field for field (proof that these are the PDFs it
//     measured); only then is `offPage` added;
//   - manifest.offPageBackfill records command, date, run, per-fixture PDF sha256s and counts.
//
// --inputs <mapping.json> (schema vellora-fidelity/pdf-probe-inputs/1, the same file and the same
// rules as rescore-pdf-probe.mjs --inputs) fills a fixture whose PDF pair the run did not keep:
// the mapped PDFs must match their sha256 and must still reproduce the committed section exactly.
// The mapping's file and sha256 are recorded in offPageBackfill.inputMap; mapped inputs carry
// source "inputMap" and ~ paths. The pin needs it: its run kept the pair for invoice and
// notification only (2026-10-22, fidelity/baselines/pin manifest pdfProbeRescore.inputMap).
//
//   node fidelity/gate/backfill-off-page.mjs --baseline fidelity/baselines/<name> --run <run-all dir>
//     [--inputs <mapping.json>] [--dry-run]
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compactProbeV2, probeResultV2 } from "../layout-diff/lib/pdf-probe-v2.mjs";
import { pdfWordsV2, requirePython } from "../layout-diff/lib/pdf-words.mjs";
import { loadInputMap, pdfInputsFor, portablePath } from "./rescore-pdf-probe.mjs";
import { loadBaselineDir } from "./snapshot.mjs";
import { assertFormatted, biomeFormat, biomeUnavailable, json } from "./write-baseline.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const GATE_SCHEMA = "vellora-fidelity/baseline/2";

/** A section without its offPage record, canonical JSON (for the identity check). */
const withoutOffPage = (s) => {
  const { offPage, ...rest } = s;
  return JSON.stringify(rest);
};

export function backfillOffPage({
  dir,
  runDir,
  dryRun = false,
  command,
  inputMap = null,
  python = null,
  format = biomeFormat,
  formatterUnavailable = biomeUnavailable,
}) {
  const why = formatterUnavailable();
  if (why) throw new Error(`biome is not runnable (${why}): a backfill must format before hashing`);
  const py = python ?? requirePython();
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const before = loadBaselineDir(dir);
  if (!before.integrity.ok) {
    throw new Error(`${dir}: integrity ${before.integrity.problems.join("; ")}`);
  }
  const probeDir = join(dir, "pdf-probe");
  if (!existsSync(probeDir)) throw new Error(`${dir} has no pdf-probe/ section`);
  const want = manifest.source?.summarySha256 ?? manifest.provenance?.sourceSummarySha256;
  const got = existsSync(join(runDir, "summary.json"))
    ? sha256(readFileSync(join(runDir, "summary.json")))
    : null;
  const sections = {};
  const inputs = {};
  const differs = [];
  const missing = [];
  const ld = join(runDir, "layout-diff");
  const fixtures = readdirSync(probeDir)
    .filter((x) => x.endsWith(".json"))
    .map((x) => x.replace(/\.json$/, ""));
  const unused = Object.keys(inputMap?.data.fixtures ?? {}).filter((f) => !fixtures.includes(f));
  if (unused.length)
    throw new Error(`--inputs names fixtures without a pdf-probe section: ${unused.join(", ")}`);
  for (const f of readdirSync(probeDir)
    .filter((x) => x.endsWith(".json"))
    .sort()) {
    const fx = f.replace(/\.json$/, "");
    const committed = JSON.parse(readFileSync(join(probeDir, f), "utf8"));
    if (committed.semantics !== 2) throw new Error(`${dir}/pdf-probe/${f} is not semantics 2`);
    // The run's own pair, or the mapping's (only where the run lacks it; sha256 checked). The
    // identity check below is what proves these are the PDFs the section measured.
    const pair = pdfInputsFor({ fixture: fx, ld, inputMap });
    if (pair.absent) {
      missing.push(fx);
      continue;
    }
    const { vPdf, cPdf, mapped } = pair;
    const v = pdfWordsV2(vPdf, py);
    const c = pdfWordsV2(cPdf, py);
    const s = compactProbeV2(
      probeResultV2({
        velloraWords: v.words,
        chromeWords: c.words,
        maxDistancePt: committed.settings?.maxDistancePt,
        velloraOffPage: v.offPage,
        chromeOffPage: c.offPage,
      }),
    );
    if (withoutOffPage(s) !== withoutOffPage(committed)) {
      differs.push(fx);
      continue;
    }
    sections[fx] = { ...committed, offPage: s.offPage };
    const where = (p) => (mapped ? portablePath(p) : relative(runDir, p));
    inputs[fx] = {
      vellora: { path: where(vPdf), sha256: sha256(readFileSync(vPdf)) },
      chrome: { path: where(cPdf), sha256: sha256(readFileSync(cPdf)) },
      ...(mapped ? { source: "inputMap" } : {}),
      offPage: { vellora: s.offPage.vellora.length, chrome: s.offPage.chrome.length },
    };
  }
  if (differs.length) {
    throw new Error(
      `${dir}: the run's PDFs do not reproduce the committed pdf-probe section of ${differs.join(", ")}`,
    );
  }
  if (missing.length) {
    throw new Error(`${dir}: the run has no layout-diff PDFs for ${missing.join(", ")}`);
  }
  const record = {
    command,
    date: new Date().toISOString(),
    source: { run: portablePath(runDir), summarySha256: got, matchesManifestSource: want === got },
    ...(inputMap
      ? { inputMap: { file: portablePath(inputMap.file), sha256: inputMap.sha256 } }
      : {}),
    extractor:
      "fidelity/oracles/py/words.py offPage (PyMuPDF rawdict, clip INFINITE_RECT, first-glyph origin outside the page rectangle)",
    inputs,
  };
  if (dryRun) return { record, sections };
  const files = { ...manifest.files };
  for (const [fx, s] of Object.entries(sections)) {
    const rel = join("pdf-probe", `${fx}.json`);
    writeFileSync(join(dir, rel), json(s));
  }
  assertFormatted(format(probeDir), probeDir);
  for (const fx of Object.keys(sections)) {
    const rel = join("pdf-probe", `${fx}.json`);
    files[rel] = sha256(readFileSync(join(dir, rel)));
  }
  const gateSchema = manifest.schema === GATE_SCHEMA;
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
  const out = { ...manifest, files: gateSchema ? sorted : files, offPageBackfill: record };
  writeFileSync(join(dir, "manifest.json"), json(out));
  assertFormatted(format(join(dir, "manifest.json")), join(dir, "manifest.json"));
  const after = loadBaselineDir(dir);
  if (!after.integrity.ok) {
    throw new Error(`${dir}: integrity after backfill: ${after.integrity.problems.join("; ")}`);
  }
  return { record, sections };
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const dir = val("--baseline") && resolve(val("--baseline"));
  const runDir = val("--run") && resolve(val("--run"));
  if (!dir || !runDir) {
    process.stderr.write(
      "usage: backfill-off-page.mjs --baseline <dir> --run <run-all dir> [--inputs <mapping.json>] [--dry-run]\n",
    );
    process.exitCode = 2;
    return;
  }
  const { record } = backfillOffPage({
    dir,
    runDir,
    dryRun: argv.includes("--dry-run"),
    inputMap: val("--inputs") ? loadInputMap(val("--inputs")) : null,
    command: `node fidelity/gate/backfill-off-page.mjs ${argv.map(portablePath).join(" ")}`,
  });
  process.stdout.write(
    `${relative(repoRoot, dir)}: off-page vellora/chrome ${Object.entries(record.inputs)
      .map(([fx, x]) => `${fx} ${x.offPage.vellora}/${x.offPage.chrome}`)
      .join(", ")}; summary matches manifest source ${record.source.matchesManifestSource}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`backfill-off-page failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
