#!/usr/bin/env node
// Document-level aggregate oracle over a run-all output directory (exit-contract condition 2;
// method in lib/doc-aggregate.mjs, rules in fidelity/ACCEPTANCE.md DOC-*).
//
//   node fidelity/oracles/doc-aggregate.mjs --run <run-all dir> [--out <file.json>]
//     [--fixtures <a,b>] [--subject <dir>] [--reference <run-all dir>] [--label <name>]
//
// --run        the run whose layout-diff/<fixture>/run-all/{chrome.pdf, vellora.pdf, native.html}
//              are scored (default out: <run>/doc-aggregate/summary.json). Fixtures: the run's
//              layout-diff/summary-run-all.json (probe fixtures excluded).
// --subject    score <dir>/<fixture>.pdf instead of the run's vellora.pdf (the pin PDFs).
// --reference  take Chrome's PDFs from another run-all dir (Chrome-vs-Chrome noise).
// Needs fidelity/.venv (PyMuPDF). Paths in the output are portable (<repo>, ~).
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portable } from "../combine/env.mjs";
import { requirePython, wordsPayload } from "../layout-diff/lib/pdf-words.mjs";
import {
  DOC_AGGREGATE_SCHEMA,
  METHOD,
  aggregateDocument,
  geometrySha256,
} from "./lib/doc-aggregate.mjs";
import { REPO_ROOT } from "./lib/paths.mjs";

export const DOC_AGGREGATE_DIR = "doc-aggregate";
export const DOC_AGGREGATE_FILE = join(DOC_AGGREGATE_DIR, "summary.json");

export const sha256File = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

/** The run's measured (non-probe) layout-diff fixtures. */
export function runFixtures(runDir) {
  const summary = join(runDir, "layout-diff", "summary-run-all.json");
  const ids = existsSync(summary)
    ? JSON.parse(readFileSync(summary, "utf8")).fixtures.map((f) => f.fixture)
    : existsSync(join(runDir, "layout-diff"))
      ? readdirSync(join(runDir, "layout-diff")).sort()
      : [];
  return ids.filter((id) => !id.startsWith("probe-") && !id.includes("."));
}

const fixtureDir = (runDir, id) => join(runDir, "layout-diff", id, "run-all");

/**
 * Score every fixture. Returns { fixtures: { id: metrics + inputs }, problems: [], extractor }.
 * A fixture whose PDFs are missing is a problem (listed), never silently dropped.
 */
export function scoreRun({
  runDir,
  fixtures = runFixtures(runDir),
  subjectDir = null,
  referenceDir = null,
  subjectFor = null,
  python = requirePython(),
}) {
  const out = {};
  const problems = [];
  let extractor = null;
  for (const id of fixtures) {
    const chromePdf = join(fixtureDir(referenceDir ?? runDir, id), "chrome.pdf");
    const subjectPdf = subjectFor
      ? subjectFor(id)
      : subjectDir
        ? join(subjectDir, `${id}.pdf`)
        : join(fixtureDir(runDir, id), "vellora.pdf");
    const nativeHtml = join(fixtureDir(runDir, id), "native.html");
    const absent = [chromePdf, subjectPdf, nativeHtml].filter((p) => !existsSync(p));
    if (absent.length) {
      problems.push(`${id}: missing ${absent.join(", ")}`);
      continue;
    }
    const chrome = wordsPayload(chromePdf, python);
    const subject = wordsPayload(subjectPdf, python);
    extractor = `${chrome.tool} ${chrome.version}`;
    out[id] = {
      ...aggregateDocument(chrome, subject),
      inputs: {
        nativeHtmlSha256: sha256File(nativeHtml),
        chromePdfSha256: sha256File(chromePdf),
        chromeGeometrySha256: geometrySha256(chrome),
        subjectGeometrySha256: geometrySha256(subject),
        subjectPdfSha256: sha256File(subjectPdf),
      },
    };
  }
  return { fixtures: out, problems, extractor };
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || !arg(argv, "--run")) {
    process.stdout.write(
      `${readFileSync(fileURLToPath(import.meta.url), "utf8")
        .split("\n")
        .slice(1)
        .filter((l, i, all) => all.slice(0, i + 1).every((x) => x.startsWith("//")))
        .map((l) => l.replace(/^\/\/ ?/, ""))
        .join("\n")}\n`,
    );
    process.exitCode = argv.includes("--help") ? 0 : 2;
    return;
  }
  const runDir = resolve(arg(argv, "--run"));
  const outFile = resolve(arg(argv, "--out") ?? join(runDir, DOC_AGGREGATE_FILE));
  const subjectDir = arg(argv, "--subject") ? resolve(arg(argv, "--subject")) : null;
  const referenceDir = arg(argv, "--reference") ? resolve(arg(argv, "--reference")) : null;
  const fixtures = arg(argv, "--fixtures")?.split(",") ?? runFixtures(runDir);
  const scored = scoreRun({ runDir, fixtures, subjectDir, referenceDir });
  const doc = portable(
    {
      schema: DOC_AGGREGATE_SCHEMA,
      label: arg(argv, "--label") ?? (subjectDir ? "subject" : "run"),
      command: `node fidelity/oracles/doc-aggregate.mjs ${argv.join(" ")}`,
      run: runDir,
      subject: subjectDir ?? "the run's layout-diff/<fixture>/run-all/vellora.pdf",
      reference: referenceDir ?? runDir,
      method: METHOD,
      extractor: scored.extractor,
      problems: scored.problems,
      fixtures: scored.fixtures,
    },
    REPO_ROOT,
  );
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(doc, null, 2)}\n`);
  for (const [id, m] of Object.entries(scored.fixtures)) {
    process.stdout.write(
      `${id}\tpages ${m.pages}/${m.chromePages}\tmedian ${m.medianMm} mm\tp90 ${m.p90Mm} mm\t<=1mm ${m.within1mmPct}%\tmissing ${m.missingWords}\n`,
    );
  }
  for (const p of scored.problems) process.stderr.write(`doc-aggregate: ${p}\n`);
  process.stdout.write(`doc-aggregate: ${outFile}\n`);
  if (scored.problems.length) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`doc-aggregate failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
