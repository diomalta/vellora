#!/usr/bin/env node
// Determinism A/B for the beta.4 baseline: render EVERY fixture under fixtures/ (each data*.json
// variant, plain and PDF/A-2b) through the PRODUCTION path (packages/vellora/dist renderPdf ->
// @vellora/native addon -> vellora-core::render) of two builds and compare sha256 per PDF.
// Each build also renders every input twice in-process (same-build byte stability).
//
//   node fidelity/baselines/beta4/determinism/render-sha-ab.mjs --a <checkout> --b <checkout>
//     [--out <file.json>]
//
// Inputs (HTML, data, images) are ALWAYS read from THIS checkout's fixtures/, so both builds see
// byte-identical input even when the other checkout predates a fixture. Options are the corpus'
// fixed render options (fidelity/corpus/lib/fixture-io.mjs renderOptions: strict, fixed title and
// creation date) plus `pdfa: "PDF/A-2b"` for the pdfa mode. Used to show that the layout-dump hook
// port (blitz_engine.rs only) leaves PDF bytes identical to the bump-only tree.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fixtureImages, renderOptions } from "../../../corpus/lib/fixture-io.mjs";
import { captureEnv } from "../../../layout-diff/lib/env.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..");
/** Not renderable on purpose (strict gate must reject it) or not a fixture. */
const EXCLUDED = new Set(["invoice-broken", "fonts"]);

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : null;
}

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

function inputs() {
  const dir = join(repoRoot, "fixtures");
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || EXCLUDED.has(e.name)) continue;
    const fx = join(dir, e.name);
    if (!existsSync(join(fx, "index.html"))) continue;
    const variants = readdirSync(fx)
      .filter((f) => /^data(\..+)?\.json$/.test(f))
      .sort();
    for (const data of variants) {
      for (const mode of ["plain", "pdfa"]) out.push({ id: e.name, dir: fx, data, mode });
    }
  }
  return out.sort((x, y) =>
    `${x.id}/${x.data}/${x.mode}`.localeCompare(`${y.id}/${y.data}/${y.mode}`),
  );
}

async function renderAll(repo, list) {
  const vellora = await import(pathToFileURL(join(repo, "packages/vellora/dist/index.js")).href);
  const results = {};
  for (const item of list) {
    const html = readFileSync(join(item.dir, "index.html"), "utf8");
    const data = JSON.parse(readFileSync(join(item.dir, item.data), "utf8"));
    const options = renderOptions(fixtureImages(item.dir));
    if (item.mode === "pdfa") options.pdfa = "PDF/A-2b";
    const key = `${item.id}/${item.data}/${item.mode}`;
    try {
      const a = await vellora.renderPdf(html, data, options);
      const b = await vellora.renderPdf(html, data, options);
      results[key] = { sha256: sha256(a), bytes: a.length, stable: sha256(a) === sha256(b) };
    } catch (err) {
      results[key] = { error: String(err?.message ?? err).split("\n")[0] };
    }
  }
  return results;
}

async function main() {
  const a = arg("--a");
  const b = arg("--b");
  if (!a || !b) throw new Error("usage: render-sha-ab.mjs --a <checkout> --b <checkout> [--out f]");
  const list = inputs();
  const ra = await renderAll(resolve(a), list);
  const rb = await renderAll(resolve(b), list);
  const rows = {};
  let identical = 0;
  for (const key of Object.keys(ra)) {
    const same = Boolean(ra[key].sha256) && ra[key].sha256 === rb[key]?.sha256;
    if (same) identical += 1;
    rows[key] = { identical: same, a: ra[key], b: rb[key] };
    process.stdout.write(`${same ? "SAME" : "DIFF"}\t${key}\t${ra[key].sha256 ?? ra[key].error}\n`);
  }
  const command = `node ${process.argv.slice(1).join(" ")}`;
  const report = {
    schema: "vellora-fidelity/render-sha-ab/1",
    env_a: await captureEnv({ repo: resolve(a), command }),
    env_b: await captureEnv({ repo: resolve(b), command }),
    inputs_from: repoRoot,
    total: list.length,
    identical,
    result: identical === list.length ? "IDENTICAL" : `${list.length - identical} DIFFER`,
    rows,
  };
  const out = arg("--out");
  if (out) writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${report.result} (${identical}/${list.length})\n`);
  if (identical !== list.length) process.exitCode = 1;
}

main().catch((err) => {
  process.stderr.write(`render-sha-ab failed: ${err?.stack ?? err}\n`);
  process.exitCode = 2;
});
