#!/usr/bin/env node
// Paint probe over a run-all output directory (Phase C step 04; REPORT-ONLY, never gating; method
// in lib/paint-probe.mjs and py/paint.py): per fixture and page, Chrome's vs vellora's canvas
// background, dashed/dotted border segments and text-decoration underlines.
//
//   node fidelity/oracles/paint-probe.mjs --run <run-all dir> [--out <file.json>]
//     [--fixtures <a,b>] [--subject <dir>] [--label <name>]
//
// --run        the run whose layout-diff/<fixture>/run-all/{chrome.pdf, vellora.pdf} are compared
//              (default out: <run>/paint-probe/summary.json). Fixtures: as doc-aggregate (the
//              run's layout-diff/summary-run-all.json, probe fixtures excluded).
// --subject    compare <dir>/<fixture>.pdf instead of the run's vellora.pdf (another build).
// Needs fidelity/.venv (PyMuPDF). Exits 0 whatever it measures (a missing PDF is listed under
// `problems`); only a usage error exits 2. Paths in the output are portable (<repo>, ~).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portable } from "../combine/env.mjs";
import { runFixtures } from "./doc-aggregate.mjs";
import { METHOD, PAINT_PROBE_SCHEMA, comparePaint, paintFacts } from "./lib/paint-probe.mjs";
import { REPO_ROOT } from "./lib/paths.mjs";

export const PAINT_PROBE_FILE = join("paint-probe", "summary.json");

const fixtureDir = (runDir, id) => join(runDir, "layout-diff", id, "run-all");

/** Compare every fixture; never throws for one fixture (its error goes to `problems`). */
export function probeRun({ runDir, fixtures = runFixtures(runDir), subjectDir = null }) {
  const out = {};
  const problems = [];
  let tool = null;
  for (const id of fixtures) {
    const chromePdf = join(fixtureDir(runDir, id), "chrome.pdf");
    const subjectPdf = subjectDir
      ? join(subjectDir, `${id}.pdf`)
      : join(fixtureDir(runDir, id), "vellora.pdf");
    const absent = [chromePdf, subjectPdf].filter((p) => !existsSync(p));
    if (absent.length) {
      problems.push(`${id}: missing ${absent.join(", ")}`);
      continue;
    }
    try {
      const chrome = paintFacts(chromePdf);
      const subject = paintFacts(subjectPdf);
      tool = `${chrome.tool} ${chrome.version}`;
      out[id] = comparePaint(chrome, subject);
    } catch (e) {
      problems.push(`${id}: ${e?.message ?? e}`);
    }
  }
  return { fixtures: out, problems, tool };
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function main() {
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
  const outFile = resolve(arg(argv, "--out") ?? join(runDir, PAINT_PROBE_FILE));
  const subjectDir = arg(argv, "--subject") ? resolve(arg(argv, "--subject")) : null;
  let probed;
  try {
    const fixtures = arg(argv, "--fixtures")?.split(",") ?? runFixtures(runDir);
    probed = probeRun({ runDir, fixtures, subjectDir });
  } catch (e) {
    probed = { fixtures: {}, problems: [`probe failed: ${e?.message ?? e}`], tool: null };
  }
  const doc = portable(
    {
      schema: PAINT_PROBE_SCHEMA,
      reportOnly: true,
      label: arg(argv, "--label") ?? (subjectDir ? "subject" : "run"),
      command: `node fidelity/oracles/paint-probe.mjs ${argv.join(" ")}`,
      run: runDir,
      subject: subjectDir ?? "the run's layout-diff/<fixture>/run-all/vellora.pdf",
      method: METHOD,
      tool: probed.tool,
      problems: probed.problems,
      fixtures: probed.fixtures,
    },
    REPO_ROOT,
  );
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(doc, null, 2)}\n`);
  for (const [id, m] of Object.entries(probed.fixtures)) {
    process.stdout.write(
      `${id}\tpages ${m.pages}/${m.chromePages}\tcanvas mismatch ${JSON.stringify(m.canvasMismatchPages)}\tdashes ${m.dashSegments.vellora}/${m.dashSegments.chrome}\tunderlines ${m.underlines.vellora}/${m.underlines.chrome}\t${m.flags.join(",") || "-"}\n`,
    );
  }
  for (const p of probed.problems) process.stderr.write(`paint-probe: ${p}\n`);
  process.stdout.write(`paint-probe (report-only): ${outFile}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
