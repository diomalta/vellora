#!/usr/bin/env node
// WPT crashtests as a cheap panic oracle (fidelity/ACCEPTANCE.md WPT-3). Every file that WPT
// classifies as a crashtest (`-crash` name flag or a `crashtests/` directory) inside the default
// suites is rendered once through vellora's real pipeline (renderPdf, strict: true, the built napi
// addon), each in a forked worker so an abort or stack overflow is contained. The outcome is
// ok / panic / crash / timeout / error / skip (lib/crash-outcome.mjs); the gate ratchets it:
// a test that was ok and now panics, crashes or times out fails the gate.
//
//   node fidelity/wpt/crashtests.mjs [--wpt <dir>] [--out <dir>] [--jobs <n>] [--timeout-ms <ms>]
//     [--filter <regex>] [--vellora <dist/index.js>] [--allow-unpinned]
//
// Writes <out>/crashtests.json: { schema, engine, wptCommit, wptPin, counts, results: { test:
// outcome }, details: { test: { outcome, rejected?, message?, durationMs } } }. Exit 0 when the
// file was written (outcomes are data, not an exit status); 2 on a setup error.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discover } from "./lib/discover.mjs";
import { captureEnv, findRepoRoot } from "./lib/env.mjs";
import { runPool } from "./lib/pool.mjs";
import { wptPinProblems } from "./lib/provenance.mjs";
import { DEFAULT_SUITES } from "./suites.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fidelityRoot = resolve(here, "..");

/** Pool result (worker record, or the pool's own crash/timeout record) -> crashtest outcome. */
export function poolOutcome(result) {
  if (result.outcome === "timeout") return { outcome: "timeout", message: result.cause?.message };
  if (result.outcome === "error" && result.cause?.kind === "crash") {
    return { outcome: "crash", message: result.cause.message };
  }
  return result;
}

function parseArgs(argv) {
  const opts = {
    wpt: join(fidelityRoot, ".cache", "wpt"),
    out: null,
    jobs: Math.max(1, Math.min(os.availableParallelism() - 2, 12)),
    timeoutMs: 30000,
    filter: null,
    vellora: null,
    allowUnpinned: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--wpt") opts.wpt = resolve(val());
    else if (a === "--out") opts.out = resolve(val());
    else if (a === "--jobs") opts.jobs = Number(val());
    else if (a === "--timeout-ms") opts.timeoutMs = Number(val());
    else if (a === "--filter") opts.filter = new RegExp(val());
    else if (a === "--vellora") opts.vellora = resolve(val());
    else if (a === "--allow-unpinned") opts.allowUnpinned = true;
    else throw new Error(`unknown option ${a}`);
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!existsSync(join(opts.wpt, "fonts", "Ahem.ttf"))) {
    console.error(`crashtests: no WPT checkout at ${opts.wpt}; run fidelity/wpt/fetch-wpt.mjs`);
    process.exit(2);
  }
  const repoRoot = findRepoRoot(opts.vellora ? dirname(opts.vellora) : resolve(fidelityRoot, ".."));
  const env = captureEnv({ repoRoot, wptRoot: opts.wpt, chromePath: null });
  const expected = readFileSync(join(here, "WPT_COMMIT"), "utf8").trim();
  const problems = wptPinProblems(env.wpt, expected);
  if (problems.length && !opts.allowUnpinned) {
    console.error(`crashtests: WPT tree is not the pin: ${problems.join("; ")} (--allow-unpinned)`);
    process.exit(2);
  }
  const suites = DEFAULT_SUITES.map((s) => s.path);
  let tests = discover(opts.wpt, suites)
    .filter((f) => f.kind === "crashtest")
    .map((f) => ({ rel: f.rel, url: f.url, suite: f.suite, mode: "screen" }));
  if (opts.filter) tests = tests.filter((t) => opts.filter.test(t.rel));
  const out =
    opts.out ?? join(fidelityRoot, "results", "wpt-crashtests", env.dateIso.replace(/[-:.]/g, ""));
  mkdirSync(out, { recursive: true });
  console.log(
    `crashtests: ${tests.length} crashtests in ${suites.length} default suites (WPT ${env.wpt.commit})`,
  );
  const results = {};
  const details = {};
  const started = Date.now();
  await runPool({
    script: join(here, "lib", "crash-worker.mjs"),
    size: opts.jobs,
    tasks: tests,
    timeoutMs: () => opts.timeoutMs,
    env: {
      VELLORA_WPT_WORKER_CONFIG: JSON.stringify({
        wptRoot: opts.wpt,
        velloraModule: opts.vellora,
        bundledFontsDir: join(repoRoot, "crates", "vellora-core", "src", "fonts"),
      }),
    },
    onResult: (result, task) => {
      const r = poolOutcome(result);
      results[task.rel] = r.outcome;
      const { test: _t, ...rest } = r;
      details[task.rel] = { suite: task.suite, ...rest };
    },
  });
  const sorted = Object.fromEntries(Object.entries(results).sort(([a], [b]) => (a < b ? -1 : 1)));
  const counts = {};
  for (const o of Object.values(sorted)) counts[o] = (counts[o] ?? 0) + 1;
  const doc = {
    schema: "vellora-fidelity/wpt-crashtests/1",
    engine: env.engine.id,
    blitzDom: env.engine.blitzDom,
    vellora: env.vellora.commit,
    wptCommit: env.wpt.commit,
    wptPin: { expected, ok: problems.length === 0, problems },
    date: env.date,
    node: env.node,
    suites,
    timeoutMs: opts.timeoutMs,
    seconds: Math.round((Date.now() - started) / 100) / 10,
    counts,
    results: sorted,
    details: Object.fromEntries(Object.entries(details).sort(([a], [b]) => (a < b ? -1 : 1))),
  };
  writeFileSync(join(out, "crashtests.json"), `${JSON.stringify(doc, null, 2)}\n`);
  console.log(
    `crashtests: ${JSON.stringify(counts)} in ${doc.seconds}s -> ${join(out, "crashtests.json")}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`crashtests failed: ${e?.stack ?? e}`);
    process.exitCode = 2;
  });
}
