/**
 * WebAssembly vs native engine benchmark (issue #63): the same Rust core, rendered through
 * `@vellora/native` (napi-rs addon) and `@vellora/wasm` (wasm32 build), on the invoice fixture.
 *
 *   npm run build && npm run build:wasm      # from the repo root, once
 *   node benchmarks/wasm-vs-native.mjs
 *
 * Axes, per engine:
 *   - cold start: a FRESH Node process imports the engine and renders once; the sample is the time
 *     from just before the import to the first PDF (Node's own boot is excluded: it is the same for
 *     both). The WebAssembly sample includes reading, compiling and instantiating the module.
 *   - first render after a boot warm-up (engines exporting `warmup()`, i.e. WebAssembly; issue
 *     #66): a fresh process imports the engine and awaits `warmup()` (timed separately, from just
 *     before the import: the
 *     one-off startup cost), then the sample is the first render of the invoice, i.e. what the
 *     first request pays when the application warms the engine up at startup.
 *   - warm: one process, BENCH_WARMUP_RUNS discarded, then BENCH_WARM_RUNS sequential renders;
 *     median / p95 via lib/stats.mjs.
 *   - output bytes, and whether both engines produced byte-identical PDFs.
 * Optional: BENCH_WORKERD_URL=http://localhost:8787/ (examples/cloudflare-worker under
 * `wrangler dev`) adds client-observed warm latency of the Worker (HTTP included; local workerd,
 * not Cloudflare's edge).
 *
 * Writes benchmarks/results/wasm-vs-native/<timestamp>.json and prints a Markdown table.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { cpus, platform, release, tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { baseline, repoRoot } from "./config.mjs";
import { summarize } from "./lib/stats.mjs";

const COLD_RUNS = Number(process.env.BENCH_COLD_RUNS ?? 10);
const WARM_RUNS = Number(process.env.BENCH_WARM_RUNS ?? 50);
const WARMUP_RUNS = Number(process.env.BENCH_WARMUP_RUNS ?? 5);
const WASM_PATH = join(repoRoot, "packages", "wasm", "wasm", "vellora_bg.wasm");

const ENGINES = {
  native: join(repoRoot, "packages", "native", "dist", "index.js"),
  wasm: join(repoRoot, "packages", "wasm", "dist", "node.js"),
};

// The child: import one engine, render the (pre-templated) invoice, report timings as JSON.
const CHILD = `
const [enginePath, inputPath, warmRuns, warmupRuns, bootWarmup] = process.argv.slice(1);
const { readFileSync } = await import("node:fs");
const input = JSON.parse(readFileSync(inputPath, "utf8"));
const html = new TextEncoder().encode(input.html);
const opts = { title: "benchmark-invoice", creationDate: [2026, 1, 1], images: Object.fromEntries(
  Object.entries(input.images).map(([k, v]) => [k, new Uint8Array(Buffer.from(v, "base64"))])) };
const t0 = performance.now();
const engine = await import(enginePath);
let bootWarmupMs;
if (bootWarmup === "1") {
  await engine.warmup();
  bootWarmupMs = performance.now() - t0;
}
const t1 = performance.now();
const first = await engine.render(html, opts);
const coldMs = performance.now() - (bootWarmup === "1" ? t1 : t0);
const warm = [];
for (let i = 0; i < Number(warmupRuns) + Number(warmRuns); i++) {
  const t = performance.now();
  await engine.render(html, opts);
  if (i >= Number(warmupRuns)) warm.push(performance.now() - t);
}
process.stdout.write(JSON.stringify({ coldMs, bootWarmupMs, warm, pdf: Buffer.from(first).toString("base64") }));
`;

function runChild(engine, inputPath, warmRuns, warmupRuns, bootWarmup = false) {
  const child = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      CHILD,
      ENGINES[engine],
      inputPath,
      String(warmRuns),
      String(warmupRuns),
      bootWarmup ? "1" : "0",
    ],
    { encoding: "utf8", maxBuffer: 64 << 20 },
  );
  if (child.status !== 0) {
    throw new Error(`${engine} child failed (${child.status}): ${child.stderr}`);
  }
  return JSON.parse(child.stdout);
}

async function workerdWarm(url) {
  const samples = [];
  for (let i = 0; i < WARMUP_RUNS + WARM_RUNS; i++) {
    const t = performance.now();
    const res = await fetch(url);
    await res.arrayBuffer();
    if (!res.ok) throw new Error(`workerd ${url}: HTTP ${res.status}`);
    if (i >= WARMUP_RUNS) samples.push(performance.now() - t);
  }
  return summarize(samples);
}

const { renderTemplate } = await import(join(repoRoot, "packages", "vellora", "dist", "index.js"));
const { fixtureImages } = await import(
  join(repoRoot, "packages", "test-harness", "dist", "index.js")
);
const html = renderTemplate(
  readFileSync(baseline.htmlPath, "utf8"),
  JSON.parse(readFileSync(baseline.dataPath, "utf8")),
);
const images = Object.fromEntries(
  Object.entries(fixtureImages(baseline.name)).map(([k, v]) => [
    k,
    Buffer.from(v).toString("base64"),
  ]),
);
const outDir = join(repoRoot, "benchmarks", "results", "wasm-vs-native");
mkdirSync(outDir, { recursive: true });
const scratch = mkdtempSync(join(tmpdir(), "vellora-bench-"));
const inputPath = join(scratch, "input.json");
writeFileSync(inputPath, JSON.stringify({ html, images }));

const results = {};
const pdfs = {};
for (const engine of Object.keys(ENGINES)) {
  const cold = [];
  for (let i = 0; i < COLD_RUNS; i++) {
    const r = runChild(engine, inputPath, 0, 0);
    cold.push(r.coldMs);
    pdfs[engine] = r.pdf;
  }
  const warm = runChild(engine, inputPath, WARM_RUNS, WARMUP_RUNS);
  let afterBootWarmup;
  if (engine === "wasm") {
    const first = [];
    const boot = [];
    for (let i = 0; i < COLD_RUNS; i++) {
      const r = runChild(engine, inputPath, 0, 0, true);
      first.push(r.coldMs);
      boot.push(r.bootWarmupMs);
      if (r.pdf !== pdfs[engine]) throw new Error("warmup() changed the PDF of the next render");
    }
    afterBootWarmup = { bootWarmup: summarize(boot), firstRender: summarize(first) };
  }
  results[engine] = {
    cold: summarize(cold),
    ...(afterBootWarmup ? { afterBootWarmup } : {}),
    warm: summarize(warm.warm),
    pdfBytes: Buffer.from(pdfs[engine], "base64").length,
  };
}
if (process.env.BENCH_WORKERD_URL) {
  results.workerd = { warmClientObserved: await workerdWarm(process.env.BENCH_WORKERD_URL) };
}

rmSync(scratch, { recursive: true, force: true });
const wasmBytes = readFileSync(WASM_PATH);
const record = {
  date: new Date().toISOString(),
  command: "node benchmarks/wasm-vs-native.mjs",
  fixture: baseline.name,
  runs: { cold: COLD_RUNS, warm: WARM_RUNS, warmup: WARMUP_RUNS },
  env: {
    node: process.version,
    platform: `${platform()} ${release()}`,
    cpu: cpus()[0]?.model ?? "unknown",
    cpus: cpus().length,
    gitSha: execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim(),
  },
  wasmModule: {
    rawBytes: statSync(WASM_PATH).size,
    gzipBytes: gzipSync(wasmBytes, { level: 9 }).length,
  },
  identicalPdf: pdfs.native === pdfs.wasm,
  results,
};
const stamp = record.date.replace(/[:.]/g, "-");
writeFileSync(join(outDir, `${stamp}.json`), `${JSON.stringify(record, null, 2)}\n`);

const ms = (v) => (v == null ? "—" : `${v.toFixed(1)} ms`);
console.log("| engine | cold start (median / p95) | warm (median / p95) | PDF bytes |");
console.log("|---|---|---|---|");
for (const engine of Object.keys(ENGINES)) {
  const r = results[engine];
  console.log(
    `| ${engine} | ${ms(r.cold.medianMs)} / ${ms(r.cold.p95Ms)} | ${ms(r.warm.medianMs)} / ${ms(r.warm.p95Ms)} | ${r.pdfBytes} |`,
  );
}
const boot = results.wasm.afterBootWarmup;
if (boot) {
  console.log(
    `| wasm, after \`warmup()\` at boot | ${ms(boot.firstRender.medianMs)} / ${ms(boot.firstRender.p95Ms)} (boot warm-up ${ms(boot.bootWarmup.medianMs)}) | — | — |`,
  );
}
if (results.workerd) {
  const w = results.workerd.warmClientObserved;
  console.log(
    `| workerd (wrangler dev, client-observed, HTTP incl.) | — | ${ms(w.medianMs)} / ${ms(w.p95Ms)} | — |`,
  );
}
console.log(
  `\nbyte-identical PDFs: ${record.identicalPdf} · wasm ${record.wasmModule.rawBytes} B raw, ${record.wasmModule.gzipBytes} B gzip`,
);
console.log(
  `env: ${record.env.node} · ${record.env.platform} · ${record.env.cpu} ×${record.env.cpus} · ${record.env.gitSha}`,
);
