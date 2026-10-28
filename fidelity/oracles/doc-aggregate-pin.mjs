#!/usr/bin/env node
// The pin reference of the document-level aggregate (fidelity/baselines/pin/doc-aggregate.json,
// ACCEPTANCE.md DOC-*): render each fixture's native.html of a run with the PUBLISHED engine, score
// those PDFs against the run's Chrome PDFs with the same method as the run (lib/doc-aggregate.mjs),
// and record what makes drift detectable: the sha256 of every pin PDF, of its input HTML and of
// Chrome's word geometry, plus the command. Optionally measures the run-to-run noise the gate
// tolerance is derived from (--noise-run: a second run-all dir over the same inputs).
//
//   node fidelity/oracles/doc-aggregate-pin.mjs --engine <published checkout, built>
//     --engine-commit <sha> --engine-blitz <rev> --run <run-all dir> --pdf-out <dir>
//     [--noise-run <run-all dir>] [--out <file.json>]
//
// --engine  a checkout of the published engine with `npm run build` done (packages/vellora/dist);
//           every fixture is rendered TWICE through its public renderPdf (strict: true, the
//           layout-diff metadata) and the two must be byte-identical (DET-1), else this fails.
// Out: default fidelity/baselines/pin/doc-aggregate.json. Paths are portable (<repo>, ~).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { portable } from "../combine/env.mjs";
import { FIXED_CREATION_DATE } from "../layout-diff/lib/fixture-html.mjs";
import { requirePython } from "../layout-diff/lib/pdf-words.mjs";
import { runFixtures, scoreRun, sha256File } from "./doc-aggregate.mjs";
import { DOC_AGGREGATE_SCHEMA, METHOD } from "./lib/doc-aggregate.mjs";
import { FIDELITY_DIR, REPO_ROOT } from "./lib/paths.mjs";

export const PIN_DOC_AGGREGATE = join(FIDELITY_DIR, "baselines", "pin", "doc-aggregate.json");
/** The metrics whose run-to-run spread is recorded (the gated ones and the reported ones). */
export const NOISE_METRICS = ["medianMm", "p90Mm", "within1mmPct", "missingWords", "pages"];

const sha = (b) => createHash("sha256").update(b).digest("hex");

/** Per-metric |a - b| over the fixtures both scored, and the max per metric. */
export function spread(a, b) {
  const perFixture = {};
  const max = Object.fromEntries(NOISE_METRICS.map((m) => [m, 0]));
  for (const id of Object.keys(a)) {
    if (!b[id]) continue;
    perFixture[id] = {};
    for (const m of NOISE_METRICS) {
      const d = Math.round(Math.abs((a[id][m] ?? 0) - (b[id][m] ?? 0)) * 1000) / 1000;
      perFixture[id][m] = d;
      max[m] = Math.max(max[m], d);
    }
  }
  return { perFixture, max };
}

/** The Chrome version string a run-all summary recorded (null when absent). */
function readRunChrome(runDir) {
  try {
    const env = JSON.stringify(
      JSON.parse(readFileSync(join(runDir, "summary.json"), "utf8")).environment,
    );
    return env.match(/Google Chrome[^"]*?\d+\.\d+\.\d+\.\d+/)?.[0] ?? null;
  } catch {
    return null;
  }
}

function arg(argv, name) {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main() {
  const argv = process.argv.slice(2);
  for (const req of ["--engine", "--engine-commit", "--engine-blitz", "--run", "--pdf-out"]) {
    if (!arg(argv, req)) throw new Error(`${req} is required (see the header of this file)`);
  }
  const engine = resolve(arg(argv, "--engine"));
  const runDir = resolve(arg(argv, "--run"));
  const pdfOut = resolve(arg(argv, "--pdf-out"));
  const noiseRun = arg(argv, "--noise-run") ? resolve(arg(argv, "--noise-run")) : null;
  const outFile = resolve(arg(argv, "--out") ?? PIN_DOC_AGGREGATE);
  const python = requirePython();
  const vellora = await import(pathToFileURL(join(engine, "packages/vellora/dist/index.js")).href);
  const fixtures = runFixtures(runDir);
  mkdirSync(pdfOut, { recursive: true });
  const renders = {};
  for (const id of fixtures) {
    const html = readFileSync(join(runDir, "layout-diff", id, "run-all", "native.html"), "utf8");
    const opts = {
      strict: true,
      metadata: { title: `layout-diff-${id}`, creationDate: FIXED_CREATION_DATE },
    };
    const first = await vellora.renderPdf(html, undefined, opts);
    const second = await vellora.renderPdf(html, undefined, opts);
    if (sha(first) !== sha(second)) throw new Error(`${id}: two pin renders differ (DET-1)`);
    writeFileSync(join(pdfOut, `${id}.pdf`), first);
    renders[id] = { pdfSha256: sha(first), bytes: first.length, renderedTwiceIdentical: true };
    process.stdout.write(`${id}\tpin ${sha(first)}\t${first.length}\n`);
  }
  const pin = scoreRun({ runDir, fixtures, subjectDir: pdfOut, python });
  if (pin.problems.length) throw new Error(pin.problems.join("; "));
  let noise = null;
  if (noiseRun) {
    // Same inputs, a second Chrome print and a second vellora render (the noise run).
    const vRun = scoreRun({ runDir, fixtures, python }).fixtures;
    const vOtherChrome = scoreRun({ runDir, fixtures, referenceDir: noiseRun, python }).fixtures;
    const vOther = scoreRun({ runDir: noiseRun, fixtures, python }).fixtures;
    const pinOtherChrome = scoreRun({
      runDir,
      fixtures,
      subjectDir: pdfOut,
      referenceDir: noiseRun,
      python,
    }).fixtures;
    // Chrome's second print scored as the subject against its first print.
    const chromeVsChrome = scoreRun({
      runDir,
      fixtures,
      subjectFor: (id) => join(noiseRun, "layout-diff", id, "run-all", "chrome.pdf"),
      python,
    }).fixtures;
    const sameInputs = fixtures.filter(
      (id) =>
        sha256File(join(runDir, "layout-diff", id, "run-all", "native.html")) ===
        sha256File(join(noiseRun, "layout-diff", id, "run-all", "native.html")),
    );
    const velloraBytesEqual = fixtures.filter(
      (id) =>
        sha256File(join(runDir, "layout-diff", id, "run-all", "vellora.pdf")) ===
        sha256File(join(noiseRun, "layout-diff", id, "run-all", "vellora.pdf")),
    );
    const chromeGeometryEqual = fixtures.filter(
      (id) =>
        vRun[id]?.inputs.chromeGeometrySha256 === vOtherChrome[id]?.inputs.chromeGeometrySha256,
    );
    const parts = {
      "vellora: Chrome print 1 vs Chrome print 2": spread(vRun, vOtherChrome),
      "pin: Chrome print 1 vs Chrome print 2": spread(pin.fixtures, pinOtherChrome),
      "vellora: run vs noise run (both renders and both prints)": spread(vRun, vOther),
      "Chrome print 2 scored against Chrome print 1 (vs a perfect 0)": spread(
        chromeVsChrome,
        Object.fromEntries(
          fixtures.map((id) => [
            id,
            {
              medianMm: 0,
              p90Mm: 0,
              within1mmPct: 100,
              missingWords: 0,
              pages: chromeVsChrome[id]?.chromePages,
            },
          ]),
        ),
      ),
    };
    const max = Object.fromEntries(
      NOISE_METRICS.map((m) => [m, Math.max(...Object.values(parts).map((p) => p.max[m]))]),
    );
    noise = {
      noiseRun,
      sameInputs: `${sameInputs.length}/${fixtures.length} native.html byte-identical`,
      velloraPdfBytesEqual: `${velloraBytesEqual.length}/${fixtures.length}`,
      chromeGeometryEqual: `${chromeGeometryEqual.length}/${fixtures.length}`,
      chromePdfBytesEqual: `${fixtures.filter((id) => vRun[id]?.inputs.chromePdfSha256 === vOtherChrome[id]?.inputs.chromePdfSha256).length}/${fixtures.length}`,
      pinRenderedTwice:
        "every pin PDF rendered twice, byte-identical (renders[].renderedTwiceIdentical)",
      parts,
      max,
    };
  }
  const doc = portable(
    {
      schema: `${DOC_AGGREGATE_SCHEMA}/pin`,
      label: "pin: the published engine",
      engine: {
        commit: arg(argv, "--engine-commit"),
        blitz: arg(argv, "--engine-blitz"),
        path: "renderPdf(nativeHtml, undefined, { strict: true, metadata: { title: `layout-diff-${id}`, creationDate: FIXED_CREATION_DATE } }) of the engine's packages/vellora/dist",
        build:
          "git archive <commit> | tar -x -C <dir>; cd <dir>; npm ci; npm run build (fresh target/: a copied target/ whose artefacts are newer than the archived sources is NOT rebuilt by cargo)",
      },
      environment: {
        date: new Date().toISOString(),
        node: process.version,
        platform: `${process.platform} ${process.arch}`,
        authority: "INDICATIVE (local run)",
        chromeOfRun: readRunChrome(runDir),
        chromeOfNoiseRun: noiseRun ? readRunChrome(noiseRun) : null,
      },
      command: `node fidelity/oracles/doc-aggregate-pin.mjs ${argv.join(" ")}`,
      run: runDir,
      method: METHOD,
      extractor: pin.extractor,
      renders,
      noise,
      fixtures: pin.fixtures,
    },
    REPO_ROOT,
  );
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(doc, null, 2)}\n`);
  process.stdout.write(`doc-aggregate-pin: ${outFile}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`doc-aggregate-pin failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
