#!/usr/bin/env node
// WPT reftest runner over vellora's real native pipeline (renderPdf, strict: true).
// See fidelity/wpt/README.md for semantics, outcomes and the evidence behind each choice.
//
//   node fidelity/wpt/run.mjs [suite-path ...] [options]
//
// Options:
//   --wpt <dir>               WPT checkout (default fidelity/.cache/wpt; see fetch-wpt.mjs)
//   --out <dir>               results dir (default fidelity/results/wpt/<run-id>); never deleted
//   --jobs <n>                worker processes (default min(cpus - 2, 12))
//   --timeout-ms <ms>         per-test budget (default 30000; `<meta name=timeout content=long>` x6)
//   --filter <regex>          only tests whose path matches
//   --limit <n>               only the first n reftests (after filtering)
//   --artifacts fail|all|none failure PNGs (default fail);  --keep-pdf  also keep the PDFs
//   --no-inline-css           do not inline <link rel=stylesheet> (measure the raw input contract)
//   --no-aa                   rasterize without anti-aliasing
//   --rasterizer pdftocairo|pdftoppm  poppler backend (default pdftocairo; see lib/raster.mjs)
//   --vellora <dist/index.js> render with another vellora build (e.g. a Blitz-bump worktree)
//   --expectations auto|none|<file>   ratchet against fidelity/baselines/wpt/<engine>.json
//   --update-expectations     write fidelity/baselines/wpt/<engine>.json from this run (refused
//                             unless the default suites ran unfiltered on the exact WPT pin)
//   --chain-references        also follow a reference's own <link rel=match|mismatch> (NOT
//                             wptrunner semantics; diagnosis only, recorded in the results)
//   --allow-unpinned          run on a WPT tree that is not exactly WPT_COMMIT (other HEAD, no git
//                             metadata, modified or untracked files); results are marked unpinned
//                             and no ratchet or expectations update is performed
//   --upstream auto|none|<blitz-sha>  cross-tab with Blitz's own published WPT report
//   --offline                 never download (upstream report must already be cached)
//   --chrome [path]           also run every reftest through Chrome print (see lib/chrome.mjs)
//   --chrome-jobs <n>         concurrent Chrome pages (default 6)
//   --chrome-from <results.json>  reuse Chrome outcomes of an earlier run (same WPT + raster config)
//   --list                    only discover/classify and print counts
//   --label <text>            provenance note stored with the run (required when the vellora
//                             build has no git commit, e.g. a `git archive` export)
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discover } from "./lib/discover.mjs";
import { captureEnv, findRepoRoot } from "./lib/env.mjs";
import { INK_SIGNIFICANT_PX, inkDivergence } from "./lib/pixels.mjs";
import { runPool } from "./lib/pool.mjs";
import {
  HARNESS_SEMANTICS,
  chromeReuseMismatch,
  expectationsMismatch,
  makeRunId,
  partialRunReason,
  wptPinProblems,
} from "./lib/provenance.mjs";
import {
  attributeFailures,
  buildExpectations,
  chromeCrossTab,
  compareExpectations,
  inkCheckSummary,
  loadUpstreamReport,
  prepareFlagBreakdown,
  summarize,
  summaryMarkdown,
  upstreamCrossTab,
} from "./lib/report.mjs";
import { DEFAULT_SUITES } from "./suites.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fidelityRoot = resolve(here, "..");

function parseArgs(argv) {
  const opts = {
    suites: [],
    wpt: join(fidelityRoot, ".cache", "wpt"),
    out: null,
    jobs: Math.max(1, Math.min(os.availableParallelism() - 2, 12)),
    timeoutMs: 30000,
    filter: null,
    limit: null,
    artifacts: "fail",
    keepPdf: false,
    inlineCss: true,
    antialias: true,
    rasterizer: "pdftocairo",
    vellora: null,
    expectations: "auto",
    updateExpectations: false,
    upstream: "auto",
    offline: false,
    chrome: null,
    chromeJobs: 6,
    list: false,
    chainReferences: false,
    allowUnpinned: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    switch (a) {
      case "--wpt":
        opts.wpt = resolve(val());
        break;
      case "--out":
        opts.out = resolve(val());
        break;
      case "--jobs":
        opts.jobs = Number(val());
        break;
      case "--timeout-ms":
        opts.timeoutMs = Number(val());
        break;
      case "--filter":
        opts.filter = new RegExp(val());
        break;
      case "--limit":
        opts.limit = Number(val());
        break;
      case "--artifacts":
        opts.artifacts = val();
        break;
      case "--keep-pdf":
        opts.keepPdf = true;
        break;
      case "--no-inline-css":
        opts.inlineCss = false;
        break;
      case "--no-aa":
        opts.antialias = false;
        break;
      case "--rasterizer":
        opts.rasterizer = val();
        if (!["pdftocairo", "pdftoppm"].includes(opts.rasterizer)) {
          throw new Error("--rasterizer must be pdftocairo or pdftoppm");
        }
        break;
      case "--vellora":
        opts.vellora = resolve(val());
        break;
      case "--expectations":
        opts.expectations = val();
        break;
      case "--update-expectations":
        opts.updateExpectations = true;
        break;
      case "--upstream":
        opts.upstream = val();
        break;
      case "--offline":
        opts.offline = true;
        break;
      case "--chrome":
        // The executable is optional: only consume the next argument when it is an existing file
        // (so `--chrome css/CSS2/box` keeps `css/CSS2/box` as a suite path).
        opts.chrome =
          argv[i + 1] && !argv[i + 1].startsWith("--") && statSafeIsFile(argv[i + 1])
            ? argv[++i]
            : (process.env.CHROME_PATH ??
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome");
        break;
      case "--chrome-jobs":
        opts.chromeJobs = Number(val());
        break;
      case "--chrome-from":
        opts.chromeFrom = resolve(val());
        break;
      case "--list":
        opts.list = true;
        break;
      case "--chain-references":
        opts.chainReferences = true;
        break;
      case "--allow-unpinned":
        opts.allowUnpinned = true;
        break;
      case "--label":
        opts.label = val();
        break;
      default:
        if (a.startsWith("--")) throw new Error(`unknown option ${a}`);
        opts.suites.push(a.replace(/\/+$/, ""));
    }
  }
  if (opts.suites.length === 0) opts.suites = DEFAULT_SUITES.map((s) => s.path);
  return opts;
}

function statSafeIsFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function fatal(message) {
  console.error(`run: ${message}`);
  process.exit(2);
}

const opts = parseArgs(process.argv.slice(2));
const defaultSuitePaths = DEFAULT_SUITES.map((s) => s.path);
if (opts.updateExpectations) {
  const why = partialRunReason({
    suites: opts.suites,
    defaultSuites: defaultSuitePaths,
    filter: opts.filter,
    limit: opts.limit,
  });
  if (why)
    fatal(
      `--update-expectations refused: ${why}; the committed baseline covers the full default run`,
    );
  if (opts.chainReferences)
    fatal("--update-expectations refused: --chain-references is not wptrunner semantics");
  if (opts.allowUnpinned)
    fatal("--update-expectations refused: --allow-unpinned results are not a baseline");
}
if (!existsSync(join(opts.wpt, "fonts", "Ahem.ttf"))) {
  console.error(
    `run: no WPT checkout at ${opts.wpt}; run \`node fidelity/wpt/fetch-wpt.mjs\` first`,
  );
  process.exit(2);
}
const repoRoot = findRepoRoot(opts.vellora ? dirname(opts.vellora) : resolve(fidelityRoot, ".."));
const started = Date.now();
const env = captureEnv({ repoRoot, wptRoot: opts.wpt, chromePath: opts.chrome });
const expectedWpt = readFileSync(join(here, "WPT_COMMIT"), "utf8").trim();
const pinProblems = wptPinProblems(env.wpt, expectedWpt);
const pin = { expected: expectedWpt, ok: pinProblems.length === 0, problems: pinProblems };
if (!pin.ok && !opts.list) {
  if (!opts.allowUnpinned) {
    fatal(
      `WPT tree ${opts.wpt} is not exactly the pin: ${pinProblems.join("; ")}. Run fetch-wpt.mjs, or pass --allow-unpinned to measure it anyway (no ratchet, results marked unpinned).`,
    );
  }
  console.warn(
    `run: WARNING running UNPINNED (${pinProblems.join("; ")}); no ratchet will be computed`,
  );
}
if (!env.vellora.commit && !opts.label && !opts.list) {
  fatal(
    `the vellora build at ${env.vellora.root} has no git commit; pass --label <provenance> (its source hash ${env.vellora.sourceHash.slice(0, 12)} is recorded either way)`,
  );
}

// 1. Discover + classify.
const discovered = discover(opts.wpt, opts.suites);
let reftests = discovered
  .filter((f) => f.kind === "reftest")
  .map((f) => ({
    rel: f.rel,
    url: f.url,
    mode: f.print ? "print" : "screen",
    suite: f.suite,
    timeoutClass: f.timeout,
    nonUtf8: !!f.nonUtf8,
    sub: f.metaFlags.includes("sub"),
  }));
if (opts.filter) reftests = reftests.filter((t) => opts.filter.test(t.rel));
if (opts.limit) reftests = reftests.slice(0, opts.limit);
const kindCounts = {};
for (const f of discovered) kindCounts[f.kind] = (kindCounts[f.kind] ?? 0) + 1;
console.log(
  `run: ${discovered.length} files in ${opts.suites.length} suites; ${reftests.length} reftests selected; kinds ${JSON.stringify(kindCounts)}`,
);
if (opts.list) process.exit(0);

const runId = makeRunId({
  dateIso: env.dateIso,
  engineId: env.engine.id,
  velloraCommit: env.vellora.commit,
  sourceHash: env.vellora.sourceHash,
});
const outDir = opts.out ?? join(fidelityRoot, "results", "wpt", runId);
mkdirSync(outDir, { recursive: true });
const config = {
  suites: opts.suites,
  jobs: opts.jobs,
  timeoutMs: opts.timeoutMs,
  longTimeoutMultiplier: 6,
  filter: opts.filter?.source ?? null,
  limit: opts.limit,
  artifacts: opts.artifacts,
  keepPdf: opts.keepPdf,
  inlineCss: opts.inlineCss,
  raster: { tool: opts.rasterizer, dpi: 96, antialias: opts.antialias },
  screenPage: "800x600 CSS px, margin 0 (injected as the first @page)",
  printPage: "5in x 3in, margin 0.5in (merged into the first author @page, else injected)",
  render: "vellora.renderPdf(html, undefined, { strict: true, fonts, images, baseUrl })",
  velloraModule: opts.vellora ?? "vellora (workspace package via root node_modules)",
  label: opts.label ?? null,
  semantics: HARNESS_SEMANTICS,
  chainReferences: opts.chainReferences,
  allowUnpinned: opts.allowUnpinned,
  wptPin: pin,
  bundledFontsDir: join(repoRoot, "crates", "vellora-core", "src", "fonts"),
};

// 2. Harness-level skips (never silent): non-UTF-8 and wptserve `.sub.` substitution files.
const results = [];
const tasks = [];
for (const t of reftests) {
  if (t.nonUtf8 || t.sub) {
    results.push({
      test: t.rel,
      suite: t.suite,
      mode: t.mode,
      outcome: "skip",
      node: "test",
      cause: { status: "skip", reason: t.nonUtf8 ? "non-utf8" : "needs-wptserve-substitution" },
    });
  } else tasks.push(t);
}

// 3. Render + compare in worker processes.
let done = 0;
const tally = {};
const tick = setInterval(() => {
  console.log(
    `run: ${done}/${tasks.length} ${JSON.stringify(tally)} (${Math.round((Date.now() - started) / 1000)}s)`,
  );
}, 15000);
const vStart = Date.now();
await runPool({
  script: join(here, "lib", "vellora-worker.mjs"),
  size: opts.jobs,
  tasks,
  timeoutMs: (t) => opts.timeoutMs * (t.timeoutClass === "long" ? 6 : 1),
  env: {
    VELLORA_WPT_WORKER_CONFIG: JSON.stringify({
      wptRoot: opts.wpt,
      inlineCss: opts.inlineCss,
      antialias: opts.antialias,
      rasterizer: opts.rasterizer,
      artifactsDir: opts.artifacts === "none" ? null : join(outDir, "artifacts"),
      artifacts: opts.artifacts,
      keepPdf: opts.keepPdf,
      velloraModule: opts.vellora,
      chainReferences: opts.chainReferences,
      bundledFontsDir: config.bundledFontsDir,
    }),
  },
  onResult: (result, task) => {
    result.suite = task.suite;
    results.push(result);
    done++;
    tally[result.outcome] = (tally[result.outcome] ?? 0) + 1;
  },
});
clearInterval(tick);
const velloraSeconds = (Date.now() - vStart) / 1000;
results.sort((a, b) => (a.test < b.test ? -1 : 1));

// 4. Optional Chrome oracle.
let chromeInfo = null;
if (opts.chrome) {
  const { runChromeOracle } = await import("./lib/chrome.mjs");
  const cStart = Date.now();
  chromeInfo = await runChromeOracle({
    chromePath: opts.chrome,
    wptRoot: opts.wpt,
    tests: results.filter((r) => r.outcome !== "skip"),
    jobs: opts.chromeJobs,
    antialias: opts.antialias,
    rasterizer: opts.rasterizer,
    timeoutMs: opts.timeoutMs,
    artifactsDir: opts.artifacts === "none" ? null : join(outDir, "chrome-artifacts"),
    artifacts: opts.artifacts,
    keepPdf: opts.keepPdf,
    chainReferences: opts.chainReferences,
    onProgress: (n, total, counts) => {
      if (n % 500 === 0 || n === total)
        console.log(`run: chrome ${n}/${total} ${JSON.stringify(counts)}`);
    },
  });
  chromeInfo.seconds = (Date.now() - cStart) / 1000;
  env.chrome = { ...(env.chrome ?? {}), browserVersion: chromeInfo.browserVersion };
} else if (opts.chromeFrom) {
  // Chrome's outcomes do not depend on the vellora build: reuse a previous run's Chrome results
  // when the WPT commit, raster configuration and comparison semantics are identical.
  const prior = JSON.parse(readFileSync(opts.chromeFrom, "utf8"));
  const why = chromeReuseMismatch(prior, { wptCommit: env.wpt.commit, config });
  if (why) fatal(`--chrome-from ${opts.chromeFrom} refused: ${why}`);
  if (prior.config?.wptPin && !prior.config.wptPin.ok && pin.ok) {
    fatal(`--chrome-from ${opts.chromeFrom} refused: that run was unpinned`);
  }
  const byTest = new Map(prior.tests.filter((t) => t.chrome).map((t) => [t.test, t.chrome]));
  let reused = 0;
  for (const r of results) {
    const c = byTest.get(r.test);
    if (c && r.outcome !== "skip") {
      r.chrome = c;
      reused++;
    }
  }
  chromeInfo = {
    reusedFrom: opts.chromeFrom,
    reusedRunId: prior.runId,
    browserVersion: prior.chrome?.browserVersion ?? prior.env?.chrome?.browserVersion ?? null,
    reused,
    seconds: 0,
  };
  env.chrome = prior.env?.chrome ?? null;
}
const chromeRan = chromeInfo !== null;

// 4b. Ink check (attribution aid): how much of Chrome's ink vellora's TEST rendering lacks, for
// every vellora pass / pass-blank. Needs ink signatures from both engines.
let inkStatus = null;
if (chromeRan) {
  let checked = 0;
  for (const r of results) {
    if (!(r.outcome === "pass" || r.outcome === "pass-blank") || !r.ink || !r.chrome?.ink) continue;
    r.inkCheck = {
      ...inkDivergence(r.chrome.ink, r.ink),
      chromeSignificant: Object.values(r.chrome.ink.bins).some((n) => n >= INK_SIGNIFICANT_PX),
    };
    checked++;
  }
  if (checked === 0) {
    inkStatus = {
      status: "not-run",
      reason: opts.chromeFrom
        ? `the --chrome-from run has no ink signatures (produced before harness semantics ${HARNESS_SEMANTICS})`
        : "no vellora pass had ink signatures from both engines",
    };
  }
}
const inkCheck = chromeRan ? inkCheckSummary(results, inkStatus) : null;

// 5. Upstream cross-tab (Blitz's own published WPT report for the same Blitz commit).
let upstream = null;
if (opts.upstream !== "none") {
  const sha = opts.upstream === "auto" ? env.engine.blitzDom?.rev : opts.upstream;
  if (sha) {
    const report = await loadUpstreamReport({
      sha,
      cacheDir: join(fidelityRoot, ".cache", "blitz-wpt-results"),
      offline: opts.offline,
    });
    if (report.error) {
      upstream = { sha, status: "not-run", reason: report.error };
    } else {
      for (const r of results) r.upstream = report.statuses.get(r.test) ?? "ABSENT";
      upstream = {
        sha,
        status: "ok",
        source: report.url,
        upstreamWptRevision: report.run?.wpt_revision ?? report.runInfo?.revision ?? null,
        ourWptRevision: env.wpt.commit,
        caveats: [
          "Upstream = Blitz's own runner (blitz-paint/vello screen paint, 800x600) with the `floats` feature enabled; vellora builds blitz-dom with default-features = false (no `floats`).",
          "Upstream treats a reftest without <meta name=fuzzy> as passing when dify (threshold 0.1, anti-aliasing detection) finds no difference; this runner requires exact pixel equality (wptrunner rule). Upstream is therefore an upper bound, not a like-for-like oracle.",
          "Upstream may have run a different WPT revision (see upstreamWptRevision); test content can differ.",
        ],
        ...upstreamCrossTab(results, report),
      };
    }
  }
}

// 6. Summaries and result files.
const summary = summarize({ discovered, results, suites: opts.suites });
const chromeSummary = chromeRan
  ? summarize({ discovered, results, suites: opts.suites, engine: "chrome" })
  : null;
const chromeCross = chromeRan ? chromeCrossTab(results, opts.suites) : null;
const flags = prepareFlagBreakdown(results);
const attribution =
  chromeRan && upstream?.status === "ok" ? attributeFailures(results, opts.suites) : null;
const totalSeconds = (Date.now() - started) / 1000;
const runInfo = {
  runId,
  env,
  config,
  timing: {
    totalSeconds,
    velloraSeconds,
    chromeSeconds: chromeInfo?.seconds ?? null,
    velloraTestsPerSecond: tasks.length / velloraSeconds,
  },
  discovered: kindCounts,
  chrome: chromeInfo,
};
writeJson(join(outDir, "results.json"), { schema: 1, ...runInfo, tests: results });
// Stable summary: no timings or dates, so two runs of the same engine diff cleanly.
writeJson(join(outDir, "summary.json"), {
  schema: 1,
  engineId: env.engine.id,
  velloraCommit: env.vellora.commit,
  wptCommit: env.wpt.commit,
  wptPin: pin,
  chromeVersion: chromeInfo?.browserVersion ?? null,
  config: {
    suites: opts.suites,
    raster: config.raster,
    inlineCss: opts.inlineCss,
    semantics: HARNESS_SEMANTICS,
    chainReferences: opts.chainReferences,
    filter: config.filter,
    limit: config.limit,
  },
  summary,
  inkCheck,
  chromeSummary,
  chromeCross: chromeCross && {
    matrix: chromeCross.matrix,
    totals: chromeCross.totals,
    bySuite: chromeCross.bySuite,
  },
  upstream: upstream && {
    sha: upstream.sha,
    status: upstream.status,
    reason: upstream.reason,
    upstreamWptRevision: upstream.upstreamWptRevision,
    counts: upstream.counts,
    matrix: upstream.matrix,
  },
  prepareFlags: flags,
  attribution: attribution && { totals: attribution.totals, bySuite: attribution.bySuite },
});
writeJson(join(outDir, "run-info.json"), runInfo);
if (upstream) writeJson(join(outDir, "upstream.json"), upstream);
if (attribution) writeJson(join(outDir, "attribution.json"), attribution);

// Committed baselines live in fidelity/baselines/wpt/ (fidelity/README.md ownership table).
let ratchet = null;
const expectationsPath = join(fidelityRoot, "baselines", "wpt", `${env.engine.id}.json`);
if (opts.expectations !== "none") {
  const explicit = opts.expectations !== "auto";
  const file = explicit ? resolve(opts.expectations) : expectationsPath;
  if (existsSync(file)) {
    const expected = JSON.parse(readFileSync(file, "utf8"));
    const why = !pin.ok
      ? `the WPT tree is not exactly the pin (${pinProblems.join("; ")})`
      : expectationsMismatch(expected, { wptCommit: env.wpt.commit, config });
    if (why) {
      ratchet = { status: "not-run", reason: why, file };
      console.error(`run: ratchet against ${file} not run: ${why}`);
      if (explicit) process.exitCode = 2;
    } else {
      ratchet = compareExpectations(expected, results);
      ratchet.file = file;
    }
    writeJson(join(outDir, "ratchet.json"), ratchet);
  } else if (explicit) {
    console.error(`run: expectations file ${file} not found`);
    process.exitCode = 2;
  }
}
if (opts.updateExpectations) {
  if (!pin.ok) fatal(`--update-expectations refused: ${pinProblems.join("; ")}`);
  // Shell-quoted so the recorded command can be pasted back (e.g. a Chrome path with spaces).
  const quote = (v) => (/^[\w@%+=:,./-]+$/.test(v) ? v : `'${v.replace(/'/g, "'\\''")}'`);
  const command = `node fidelity/wpt/run.mjs ${process.argv.slice(2).map(quote).join(" ")}`.trim();
  const ink = inkCheck?.status === "ok" ? `chrome ${chromeInfo?.browserVersion}` : "not-run";
  writeJson(
    expectationsPath,
    buildExpectations({ results, env, suites: opts.suites, command, config, inkCheck: ink }),
  );
  console.log(`run: wrote ${expectationsPath}`);
}

writeFileSync(
  join(outDir, "summary.md"),
  summaryMarkdown(summary, {
    title: `WPT reftests — vellora ${env.engine.id}`,
    env,
    chromeSummary,
    chromeCross,
    flags,
    upstream,
    attribution,
    raster: config.raster,
    inkCheck,
    pin,
  }),
);

// 7. Console report.
console.log(
  `\nrun: results in ${outDir} (${totalSeconds.toFixed(1)}s total, vellora phase ${velloraSeconds.toFixed(1)}s with ${opts.jobs} workers${chromeInfo ? `, chrome phase ${chromeInfo.seconds.toFixed(1)}s` : ""})`,
);
const pad = (s, n) => String(s).padEnd(n);
console.log(
  `${pad("suite", 32)} ${pad("reftests", 8)} ${pad("pass", 6)} ${pad("blank", 6)} ${pad("fail", 6)} ${pad("unsup", 6)} ${pad("error", 6)} ${pad("t/o", 4)} ${pad("skip", 5)} pass%  eval%${chromeSummary ? "  chrome%" : ""}`,
);
for (const [s, r] of [...Object.entries(summary.bySuite), ["TOTAL", summary.totals]]) {
  const c = s === "TOTAL" ? chromeSummary?.totals : chromeSummary?.bySuite[s];
  console.log(
    `${pad(s, 32)} ${pad(r.reftests, 8)} ${pad(r.pass, 6)} ${pad(r["pass-blank"], 6)} ${pad(r.fail, 6)} ${pad(r.unsupported, 6)} ${pad(r.error, 6)} ${pad(r.timeout, 4)} ${pad(r.skip, 5)} ${pad(r.passRate ?? "-", 6)} ${pad(r.passRateEvaluated ?? "-", 6)}${c ? ` ${c.passRate ?? "-"}` : ""}`,
  );
}
if (chromeCross) console.log(`run: vellora x chrome: ${JSON.stringify(chromeCross.totals)}`);
if (attribution)
  console.log(`run: vellora failures attributed: ${JSON.stringify(attribution.totals)}`);
if (ratchet?.status === "ok") {
  console.log(`run: ratchet vs ${ratchet.file}: ${JSON.stringify(ratchet.counts)}`);
}
if (inkCheck?.status === "ok") {
  console.log(
    `run: ink check of passes vs Chrome: ${inkCheck.flagged} ink-missing, ${inkCheck.flaggedDisplaced} ink-displaced of ${inkCheck.passesChecked}`,
  );
}
if (upstream) {
  console.log(
    `run: upstream ${upstream.sha}: ${upstream.status === "ok" ? JSON.stringify(upstream.counts) : upstream.reason}`,
  );
}
if (ratchet?.status === "ok" && ratchet.counts.regressions > 0 && !process.exitCode) {
  process.exitCode = 1;
}
