#!/usr/bin/env node
// Site evidence for the docs' "Measured fidelity" story (README, docs/guide/fidelity.md, blog):
// page composites, SVG charts, manifest.json and the generated markdown blocks, from ONE
// visual-compare output and ONE run. Method and definitions: fidelity/report/lib/evidence.mjs.
//
//   node fidelity/report/build-site-evidence.mjs \
//     --compare <visual-compare out dir>      metrics.json + <fixture>/{chrome,pin,new}-N.jpg
//     --run <run-all dir>                     summary.json (env, command, WPT totals), wpt/summary.json,
//                                             doc-aggregate/summary.json (cross-checked)
//     [--gate <gate-report.json[.gz]>]        status is DRAFT unless its verdict is PASS
//     [--pin-key pin] [--new-key c02]
//     [--pin-doc fidelity/baselines/pin/doc-aggregate.json]
//     [--wpt-before fidelity/baselines/pin/wpt/by-directory.json]
//     [--out docs/assets/fidelity] [--og docs/public/fidelity/og.jpg]
//     [--python <python with Pillow>]        default fidelity/.venv/bin/python, else python3
//     [--update-docs]                         rewrite the generated blocks of DOC_FILES
//
//   node fidelity/report/build-site-evidence.mjs --check
//     exit 1 when a DOC_FILES block differs from the committed manifest (no inputs needed).
//
// Never reads the wall clock: every date comes from the inputs.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { gunzipSync } from "node:zlib";
import { portable } from "../combine/env.mjs";
import {
  DOC_FILES,
  FIXTURES,
  HERO_FIXTURE,
  applyBlocks,
  buildManifest,
  checkDocs,
  crossCheck,
  flavorOf,
  mm,
  pct,
  renderBlocks,
  renderCharts,
} from "./lib/evidence.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(HERE, "..", "..");
export const DEFAULT_OUT = join(REPO_ROOT, "docs", "assets", "fidelity");
const FONT = join(REPO_ROOT, "crates/vellora-core/src/fonts/LiberationSans-Regular.ttf");
const FONT_BOLD = join(REPO_ROOT, "crates/vellora-core/src/fonts/LiberationSans-Bold.ttf");

const readJson = (p) => {
  const buf = readFileSync(p);
  return JSON.parse((p.endsWith(".gz") ? gunzipSync(buf) : buf).toString("utf8"));
};
const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const fileEntry = (p) => ({ path: portable(resolve(p), REPO_ROOT), sha256: sha256(p) });

/**
 * Pages composed per fixture: page 1, plus every page that exists in only some of the three PDFs
 * (beyond the shortest page count), so a missing or extra page is shown, never skipped.
 */
export function pagesToShow(before, after, chromePages) {
  const counts = [before.pages, after.pages, chromePages];
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const pages = [1];
  for (let n = Math.max(2, min + 1); n <= max; n++) pages.push(n);
  return pages;
}

function composeSpec(manifest, compareDir, outDir, ogOut) {
  const chrome = manifest.reference.renderer.replace(/^Google /, "");
  const stamp =
    manifest.status === "PASS"
      ? "Gated run · indicative local measurement"
      : "DRAFT · unreleased branch, not merged · indicative local measurement";
  const items = [];
  const images = [];
  for (const f of manifest.fixtures) {
    const src = (who, n) => {
      const p = join(compareDir, f.id, `${who}-${n}.jpg`);
      return existsSync(p) ? p : null;
    };
    const sub = (m) =>
      `median ${mm(m.medianMm)} · ${pct(m.within1mmPct)} within 1 mm · ${m.pages} page${m.pages === 1 ? "" : "s"}`;
    for (const n of pagesToShow(f.before, f.after, f.chromePages)) {
      const file = `${f.id}-p${n}.jpg`;
      const missing = `no page ${n}`;
      items.push({
        out: join(outDir, file),
        title: `${f.name} · page ${n}`,
        subtitle: f.attribution
          ? `Template: ${f.attribution.upstream} (${f.attribution.license}, ${f.attribution.copyright}). Word positions compared with Chrome's PDF.`
          : `Word positions compared with Chrome's PDF. Source: ${f.origin}.`,
        stamp,
        columns: [
          {
            label: chrome,
            sub: `reference · ${f.chromePages} page${f.chromePages === 1 ? "" : "s"}`,
            image: src("chrome", n),
            missing,
          },
          { label: manifest.before.label, sub: sub(f.before), image: src("pin", n), missing },
          { label: manifest.after.label, sub: sub(f.after), image: src("new", n), missing },
        ],
        footer: `Source: docs/assets/fidelity/manifest.json · run ${manifest.after.runId} · ${manifest.environment.os}`,
      });
      images.push({ fixture: f.id, page: n, file });
    }
  }
  const heroOut = join(outDir, `${HERO_FIXTURE}-p1.jpg`);
  return {
    spec: {
      font: FONT,
      fontBold: FONT_BOLD,
      items,
      og: ogOut ? { from: heroOut, out: ogOut, width: 1200, height: 630 } : null,
    },
    images,
  };
}

function pythonWithPillow(explicit) {
  const candidates = [explicit, join(REPO_ROOT, "fidelity/.venv/bin/python"), "python3"].filter(
    Boolean,
  );
  for (const py of candidates) {
    const r = spawnSync(py, ["-c", "import PIL"], { encoding: "utf8" });
    if (r.status === 0) return py;
  }
  throw new Error("no Python with Pillow found (pass --python)");
}

function updateDocs(manifest) {
  for (const file of DOC_FILES) {
    const p = join(REPO_ROOT, file);
    const text = readFileSync(p, "utf8");
    const next = applyBlocks(text, renderBlocks(manifest, flavorOf(file)));
    if (next !== text) writeFileSync(p, next);
  }
}

function main() {
  const { values: a } = parseArgs({
    options: {
      compare: { type: "string" },
      run: { type: "string" },
      gate: { type: "string" },
      "pin-key": { type: "string", default: "pin" },
      "new-key": { type: "string", default: "c02" },
      "pin-doc": {
        type: "string",
        default: join(REPO_ROOT, "fidelity/baselines/pin/doc-aggregate.json"),
      },
      "wpt-before": {
        type: "string",
        default: join(REPO_ROOT, "fidelity/baselines/pin/wpt/by-directory.json"),
      },
      out: { type: "string", default: DEFAULT_OUT },
      og: { type: "string", default: join(REPO_ROOT, "docs/public/fidelity/og.jpg") },
      python: { type: "string" },
      "update-docs": { type: "boolean", default: false },
      check: { type: "boolean", default: false },
    },
  });

  if (a.check) {
    const manifest = readJson(join(a.out, "manifest.json"));
    const problems = checkDocs(manifest, (f) => readFileSync(join(REPO_ROOT, f), "utf8"));
    for (const p of problems) console.error(`${p.file}: ${p.problem}`);
    if (problems.length) {
      console.error("regenerate: node fidelity/report/build-site-evidence.mjs ... --update-docs");
      process.exit(1);
    }
    console.log(
      `fidelity evidence blocks in sync with ${relative(REPO_ROOT, a.out)}/manifest.json`,
    );
    return;
  }

  if (!a.compare || !a.run) throw new Error("--compare and --run are required (or --check)");
  const metricsPath = join(a.compare, "metrics.json");
  const metrics = readJson(metricsPath);
  const pinDoc = readJson(a["pin-doc"]);
  const runSummary = readJson(join(a.run, "summary.json"));
  const wptRunPath = join(a.run, "wpt", "summary.json");
  const wptRun = existsSync(wptRunPath) ? readJson(wptRunPath) : null;
  const wptBefore = readJson(a["wpt-before"]);
  const gate = a.gate ? readJson(a.gate) : null;

  // The numbers must be the committed oracle's: metrics.json against the pin reference and the
  // run's own doc-aggregate summary.
  const problems = crossCheck(metrics, a["pin-key"], pinDoc, "pin-doc");
  const runDocPath = join(a.run, "doc-aggregate", "summary.json");
  if (existsSync(runDocPath)) {
    problems.push(...crossCheck(metrics, a["new-key"], readJson(runDocPath), "run doc-aggregate"));
  } else {
    problems.push(`run doc-aggregate: ${runDocPath} missing`);
  }
  if (problems.length) throw new Error(`metrics.json disagrees:\n${problems.join("\n")}`);

  const files = {
    metrics: fileEntry(metricsPath),
    pinDoc: fileEntry(a["pin-doc"]),
    runSummary: fileEntry(join(a.run, "summary.json")),
    runDocAggregate: fileEntry(runDocPath),
    wptBefore: fileEntry(a["wpt-before"]),
    ...(wptRun ? { wptRun: fileEntry(wptRunPath) } : {}),
    ...(gate ? { gate: fileEntry(a.gate) } : {}),
  };
  const regenerate = portable(
    `node fidelity/report/build-site-evidence.mjs --compare ${resolve(a.compare)} --run ${resolve(a.run)}${a.gate ? ` --gate ${resolve(a.gate)}` : ""} --pin-key ${a["pin-key"]} --new-key ${a["new-key"]} --update-docs`,
    REPO_ROOT,
  );
  const commands = {
    images:
      "node fidelity/report/visual-compare.mjs --run <RUN> --pin-pdfs <doc-aggregate-pin.mjs --pdf-out dir> --out <compare dir> (pdftoppm -r 55), composed by fidelity/report/py/compose.py",
    regenerate,
  };

  mkdirSync(a.out, { recursive: true });
  if (a.og) mkdirSync(dirname(a.og), { recursive: true });
  // Status and labels first (the composites stamp them), images listed after composing.
  const draft = buildManifest({
    metrics,
    pinKey: a["pin-key"],
    newKey: a["new-key"],
    pinDoc,
    runSummary,
    wptRun,
    wptBefore,
    gate,
    files,
    commands,
  });
  const { spec, images } = composeSpec(draft, a.compare, a.out, a.og);
  const specPath = join(tmpdir(), `vellora-site-evidence-${process.pid}.json`);
  writeFileSync(specPath, JSON.stringify(spec));
  const py = pythonWithPillow(a.python);
  const r = spawnSync(py, [join(HERE, "py", "compose.py"), specPath], { encoding: "utf8" });
  rmSync(specPath, { force: true });
  if (r.status !== 0) throw new Error(`compose.py failed:\n${r.stderr}`);

  const manifest = portable({ ...draft, images }, REPO_ROOT);
  manifest.files.images = Object.fromEntries(
    images.map((i) => [i.file, sha256(join(a.out, i.file))]),
  );
  if (a.og) manifest.files.og = fileEntry(a.og);
  for (const [name, svg] of Object.entries(renderCharts(manifest))) {
    writeFileSync(join(a.out, name), svg);
  }
  writeFileSync(join(a.out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  if (a["update-docs"]) updateDocs(manifest);
  console.log(
    `${manifest.status}: ${images.length} composites, 3 charts, manifest.json -> ${relative(REPO_ROOT, a.out)}${a["update-docs"] ? "; docs updated" : ""}`,
  );
  const unknown = FIXTURES.filter((f) => !metrics[f.id]);
  if (unknown.length) console.warn(`fixtures without metrics: ${unknown.map((f) => f.id)}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
