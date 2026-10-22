#!/usr/bin/env node
// Offline re-score of a committed baseline's pdf-probe section with the current semantics (v2,
// fidelity/layout-diff/lib/pdf-probe-v2.mjs) from the PDFs of the run the baseline was written
// from. Changes nothing but the pdf-probe section and the manifest's file hashes:
//
//   - the v1 files (pdf-probe/<fixture>.json, semantics 1) move UNCHANGED to
//     attachments/pdf-probe-v1/ (same sha256; manifest.files keys renamed): they are the history
//     the baseline was gated with, read by loadBaselineDir(dir, { pdfProbe: "v1" });
//   - the v2 sections are written to pdf-probe/<fixture>.json (the gated location, where
//     write-baseline.mjs writes them for new runs), biome-formatted, then hashed;
//   - Phase A baselines (pin, beta4: schema baseline-*/1, whose manifests hash only some files)
//     keep their v1 data where it is (beta4: layout-diff-ab/) and only gain the new entries;
//   - manifest.pdfProbeRescore records command, date, environment, per-fixture inputs (path +
//     sha256), the v1 identity check, missing inputs and any substitution.
//
// The run is verified first: its summary.json sha256 must equal the manifest's source (unless
// --substitute <evidence> explains why another run's PDFs stand in), and the run's own v1
// pdf-probe.json, re-compacted, must equal the committed v1 section (proof that these PDFs are
// the ones the baseline measured).
//
//   node fidelity/gate/rescore-pdf-probe.mjs --baseline fidelity/baselines/<name> --run <run-all dir>
//     [--fixtures a,b] [--substitute <evidence>] [--dry-run]
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { arch, platform, release } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PDF_PROBE_SEMANTICS,
  PDF_PROBE_SETTINGS,
  probeResultV2,
} from "../layout-diff/lib/pdf-probe-v2.mjs";
import { pdfWordsV2, requirePython } from "../layout-diff/lib/pdf-words.mjs";
import { PDF_PROBE_V1_DIR, compactPdfProbe, loadBaselineDir } from "./snapshot.mjs";
import { biomeFormat, json, listFiles } from "./write-baseline.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const GATE_SCHEMA = "vellora-fidelity/baseline/2";

/** The v1 section as committed (raw files) and where it lives, or null. */
function committedV1(dir) {
  const v1 = loadBaselineDir(dir, { pdfProbe: "v1" }).pdfProbe;
  if (!v1) return null;
  const where = existsSync(join(dir, PDF_PROBE_V1_DIR))
    ? PDF_PROBE_V1_DIR
    : existsSync(join(dir, "pdf-probe"))
      ? "pdf-probe"
      : "layout-diff-ab";
  return { sections: v1, where };
}

export function rescoreBaseline({
  dir,
  runDir,
  fixtures = null,
  substitute = null,
  dryRun = false,
  command,
}) {
  const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));
  const gateSchema = manifest.schema === GATE_SCHEMA;
  const want = manifest.source?.summarySha256 ?? manifest.provenance?.sourceSummarySha256;
  const got = sha256(readFileSync(join(runDir, "summary.json")));
  if (want !== got && !substitute) {
    throw new Error(
      `${dir}: run summary.json sha256 ${got.slice(0, 12)} != manifest ${String(want).slice(0, 12)} (pass --substitute <evidence> if another run's PDFs stand in)`,
    );
  }
  // Integrity BEFORE: every listed file must still match, and (gate schema) nothing unlisted.
  const before = loadBaselineDir(dir);
  if (!before.integrity.ok)
    throw new Error(`${dir}: integrity ${before.integrity.problems.join("; ")}`);
  if (gateSchema) {
    const unlisted = listFiles(dir).filter(
      (f) => f !== "manifest.json" && f !== "README.md" && !(f in manifest.files),
    );
    if (unlisted.length)
      throw new Error(`${dir}: files not in manifest.files: ${unlisted.join(", ")}`);
  }
  const v1 = committedV1(dir);
  const ld = join(runDir, "layout-diff");
  const candidates =
    fixtures ?? [...new Set([...(v1 ? Object.keys(v1.sections) : []), ...listFixtures(ld)])].sort();
  const python = requirePython();
  const inputs = {};
  const missing = [];
  const v1Identity = {};
  const sections = {};
  for (const fx of candidates) {
    const vPdf = join(ld, fx, "run-all", "vellora.pdf");
    const cPdf = join(ld, fx, "run-all", "chrome.pdf");
    const absent = [vPdf, cPdf].filter((p) => !existsSync(p));
    if (absent.length) {
      missing.push({ fixture: fx, absent: absent.map((p) => relative(runDir, p)) });
      continue;
    }
    // The run's own v1 probe, re-compacted, must be the committed v1 section.
    const runV1 = join(ld, fx, "run-all", "pdf-probe.json");
    if (v1?.sections[fx] && existsSync(runV1)) {
      const a = JSON.stringify(compactPdfProbe(JSON.parse(readFileSync(runV1, "utf8"))));
      const b = JSON.stringify(v1.sections[fx]);
      v1Identity[fx] = a === b ? "identical" : "DIFFERS";
    } else
      v1Identity[fx] = v1?.sections[fx]
        ? "run has no v1 pdf-probe.json"
        : "baseline has no v1 section";
    const v = pdfWordsV2(vPdf, python);
    const c = pdfWordsV2(cPdf, python);
    const probe = probeResultV2({ velloraWords: v.words, chromeWords: c.words });
    sections[fx] = compactPdfProbe(probe);
    inputs[fx] = {
      vellora: { path: vPdf, sha256: sha256(readFileSync(vPdf)) },
      chrome: { path: cPdf, sha256: sha256(readFileSync(cPdf)) },
      extractor: v.tool,
      words: probe.words,
    };
  }
  const differs = Object.entries(v1Identity).filter(([, s]) => s === "DIFFERS");
  if (differs.length && !substitute) {
    throw new Error(
      `${dir}: the run's v1 pdf-probe differs from the committed one: ${differs.map(([f]) => f).join(", ")}`,
    );
  }
  const record = {
    semantics: PDF_PROBE_SEMANTICS,
    settings: PDF_PROBE_SETTINGS,
    command,
    date: new Date().toISOString(),
    environment: {
      os: `${platform()} ${release()} ${arch()}`,
      node: process.version,
      python: execFileSync(python, ["-I", "-c", "import sys; print(sys.version.split()[0])"], {
        encoding: "utf8",
      }).trim(),
      extractor: Object.values(inputs)[0]?.extractor ?? null,
    },
    source: {
      run: runDir,
      summarySha256: got,
      matchesManifestSource: want === got,
      ...(substitute ? { substitute } : {}),
    },
    v1: v1
      ? {
          location: gateSchema && v1.where === "pdf-probe" ? PDF_PROBE_V1_DIR : v1.where,
          note: "semantics 1 (pdftotext -bbox yMin, k-th occurrence pairing): the section this baseline carried before the re-score (a gated link was gated with it); kept unchanged as history, not gated. loadBaselineDir(dir, { pdfProbe: 'v1' }) reads it.",
          fixtures: Object.keys(v1.sections).sort(),
        }
      : { location: null, note: "this baseline had no pdf-probe section before the re-score" },
    v1Identity,
    inputs: Object.fromEntries(
      Object.entries(inputs).map(([fx, x]) => [
        fx,
        {
          vellora: { path: relative(runDir, x.vellora.path), sha256: x.vellora.sha256 },
          chrome: { path: relative(runDir, x.chrome.path), sha256: x.chrome.sha256 },
          words: x.words,
        },
      ]),
    ),
    missing,
    v2Fixtures: Object.keys(sections).sort(),
  };
  if (dryRun) return { record, sections };

  // Move the v1 files of a gate-schema baseline (byte for byte) and write the v2 sections.
  const files = { ...manifest.files };
  if (gateSchema && v1?.where === "pdf-probe") {
    mkdirSync(join(dir, PDF_PROBE_V1_DIR), { recursive: true });
    for (const fx of Object.keys(v1.sections)) {
      const from = join("pdf-probe", `${fx}.json`);
      const to = join(PDF_PROBE_V1_DIR, `${fx}.json`);
      renameSync(join(dir, from), join(dir, to));
      if (sha256(readFileSync(join(dir, to))) !== files[from])
        throw new Error(`${to}: hash changed in the move`);
      files[to] = files[from];
      delete files[from];
    }
  }
  if (existsSync(join(dir, "pdf-probe"))) {
    // Only v2 files may remain here now (a re-run replaces them).
    for (const fx of listFiles(join(dir, "pdf-probe"))) {
      rmSync(join(dir, "pdf-probe", fx));
      delete files[join("pdf-probe", fx)];
    }
  }
  mkdirSync(join(dir, "pdf-probe"), { recursive: true });
  for (const [fx, s] of Object.entries(sections)) {
    writeFileSync(join(dir, "pdf-probe", `${fx}.json`), json(s));
  }
  record.formatting = biomeFormat(join(dir, "pdf-probe"));
  for (const fx of Object.keys(sections)) {
    const rel = join("pdf-probe", `${fx}.json`);
    files[rel] = sha256(readFileSync(join(dir, rel)));
  }
  const sorted = Object.fromEntries(Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)));
  // Nothing else in the manifest changes: the same object with files replaced and one new key.
  // Phase A manifests hash a chosen subset in their own order: keep it, append the new entries.
  const out = { ...manifest, files: gateSchema ? sorted : files, pdfProbeRescore: record };
  writeFileSync(join(dir, "manifest.json"), json(out));
  biomeFormat(join(dir, "manifest.json"));
  const after = loadBaselineDir(dir);
  if (!after.integrity.ok)
    throw new Error(`${dir}: integrity after re-score: ${after.integrity.problems.join("; ")}`);
  return { record, sections };
}

/** Every fixture layout-diff measured in the run (with or without pdf-probe inputs). */
function listFixtures(ld) {
  if (!existsSync(ld)) return [];
  return readdirSync(ld).filter((f) => statSync(join(ld, f)).isDirectory());
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const dir = val("--baseline") && resolve(val("--baseline"));
  const runDir = val("--run") && resolve(val("--run"));
  if (!dir || !runDir) {
    process.stderr.write(
      "usage: rescore-pdf-probe.mjs --baseline <dir> --run <run-all dir> [--fixtures a,b] [--substitute <evidence>] [--dry-run]\n",
    );
    process.exitCode = 2;
    return;
  }
  const { record } = rescoreBaseline({
    dir,
    runDir,
    fixtures: val("--fixtures")?.split(",").filter(Boolean) ?? null,
    substitute: val("--substitute") ?? null,
    dryRun: argv.includes("--dry-run"),
    command: `node fidelity/gate/rescore-pdf-probe.mjs ${argv.join(" ")}`,
  });
  process.stdout.write(
    `${relative(repoRoot, dir)}: v2 ${record.v2Fixtures.join(",")}; missing ${record.missing.map((m) => m.fixture).join(",") || "none"}; v1 identity ${JSON.stringify(record.v1Identity)}\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`rescore-pdf-probe failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
