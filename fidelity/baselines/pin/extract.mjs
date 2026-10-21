#!/usr/bin/env node
// Extract the committed "baseline at the current Blitz pin" from ONE run-all output directory.
// It only re-shapes what fidelity/run-all.mjs wrote (no re-measurement, no rendering), so every
// number in fidelity/baselines/pin/ traces back to that run's summary.json, whose sha256 is
// recorded in manifest.json.
//
//   node fidelity/baselines/pin/extract.mjs --run fidelity/results/run-all/<run-id> \
//     --expectations <schema-2 WPT expectations file for this engine rev> \
//     [--compare <an earlier run-all summary.json>] [--out fidelity/baselines/pin]
//
// Writes (keep it small: summaries, not rasters):
//   fixtures/<key>.json            one file per measured fixture/variant: verdicts keyed by
//                                  fidelity/ACCEPTANCE.md criterion IDs + layout-diff attribution
//   wpt/by-directory.json          per-WPT-directory counts and pass rates, criteria, ratchet
//   wpt/expectations-<engine>.json byte copy of --expectations (usable as
//                                  `node fidelity/wpt/run.mjs --expectations <it>` on another build)
//   manifest.json                  environment, exact commands, step exit codes, totals, the
//                                  round-trip check, the optional comparison, sha256 of each file
//
// Refuses (exit 2) when the run is unusable as a baseline: a step errored, the WPT ratchet did not
// run, the per-fixture tallies do not re-sum to the summary's totals, the expectations file is
// not schema 2 for the run's WPT commit, or it is not what THIS run produces: the WPT runner's own
// buildExpectations() is re-applied to <run>/wpt/results.json and every per-test outcome and
// suspect-pass flag must be identical (otherwise regenerate it with `fidelity/wpt/run.mjs
// --chrome-from <run>/wpt/results.json --update-expectations` and pass that file).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STATUSES, failedControls, tally } from "../../combine/verdicts.mjs";
import { buildExpectations } from "../../wpt/lib/report.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const SCHEMA = "vellora-fidelity/baseline-pin/1";

function parseArgs(argv) {
  const opts = { run: null, expectations: null, compare: null, out: here };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (argv[i + 1] === undefined) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === "--run") opts.run = resolve(next());
    else if (a === "--expectations") opts.expectations = resolve(next());
    else if (a === "--compare") opts.compare = resolve(next());
    else if (a === "--out") opts.out = resolve(next());
    else throw new Error(`unknown option ${a} (see the header of ${relative(repoRoot, here)})`);
  }
  if (!opts.run || !opts.expectations) throw new Error("--run and --expectations are required");
  return opts;
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const rel = (p) => relative(repoRoot, p);
const quote = (v) => (/^[\w@%+=:,./-]+$/.test(v) ? v : `'${String(v).replace(/'/g, "'\\''")}'`);
const write = (path, value) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};
function biomeFormat(paths) {
  const biome = join(repoRoot, "node_modules", ".bin", "biome");
  if (!existsSync(biome)) refuse("node_modules/.bin/biome missing: run `npm ci` at the repo root");
  // Repo-relative paths: biome.json ignores ".claude", which an absolute path inside a
  // .claude/worktrees/ checkout would match (then nothing is formatted and biome exits 1).
  execFileSync(biome, ["format", "--write", ...paths.map(rel)], { cwd: repoRoot, stdio: "pipe" });
}
function refuse(message) {
  process.stderr.write(`extract: refused: ${message}\n`);
  process.exit(2);
}

/** Identity of a verdict row for run-to-run comparison (n-th occurrence of the same tuple). */
function rowKeys(fixtures) {
  const rows = new Map();
  for (const f of fixtures) {
    const seen = {};
    for (const v of f.verdicts) {
      const base = [f.key, v.criterion, v.oracle, v.mode ?? "", v.kind].join("|");
      seen[base] = (seen[base] ?? 0) + 1;
      rows.set(`${base}#${seen[base]}`, v);
    }
  }
  return rows;
}

/** Status-level and value-level differences between two run-all summaries. */
function compareRuns(now, before) {
  const a = rowKeys(before.fixtures);
  const b = rowKeys(now.fixtures);
  const statusChanged = [];
  const valueChanged = [];
  const onlyBefore = [...a.keys()].filter((k) => !b.has(k));
  const onlyNow = [...b.keys()].filter((k) => !a.has(k));
  for (const [k, v] of b) {
    const w = a.get(k);
    if (!w) continue;
    if (w.status !== v.status) statusChanged.push({ row: k, before: w.status, now: v.status });
    else if (String(w.value ?? "") !== String(v.value ?? "")) {
      valueChanged.push({ row: k, status: v.status, before: w.value, now: v.value });
    }
  }
  const suites = (s) => ({ ...(s.wpt?.bySuite ?? {}), TOTAL: s.wpt?.totals ?? {} });
  const wptBefore = suites(before);
  const wptNow = suites(now);
  const wptChanged = [];
  for (const [suite, r] of Object.entries(wptNow)) {
    const p = wptBefore[suite] ?? {};
    for (const field of ["reftests", "pass", "passBlank", "fail", "unsupported", "error"]) {
      if (p[field] !== r[field]) wptChanged.push({ suite, field, before: p[field], now: r[field] });
    }
  }
  const addon = (s) => (s.environment?.addon ?? []).map((x) => x.sha256).join(",");
  return {
    summary: {
      runId: before.runId,
      date: before.date,
      gitHead: before.environment?.git?.head,
      command: before.command,
      chromeOracleInWpt: before.wpt?.chromeOracle,
    },
    rows: { before: a.size, now: b.size, onlyBefore, onlyNow },
    statusChanged,
    valueChanged,
    sameAddonSha256: addon(before) === addon(now),
    sameBlitz: JSON.stringify(before.environment?.blitz) === JSON.stringify(now.environment?.blitz),
    sameToolsImage:
      before.environment?.docker?.toolsImage?.id === now.environment?.docker?.toolsImage?.id,
    wptCountsChanged: wptChanged,
    note: "passClean / passRateClean are not compared: they depend on whether the WPT Chrome oracle ran (--wpt-chrome), see fidelity/run-all.mjs",
  };
}

/**
 * Per-layer view of one layout-diff summary row (fidelity/layout-diff/run.mjs): every layer's
 * delta for the natural first box/text, and per-layer error stats. Added because run-all's
 * `layoutDiff.firstBox.finalDelta` (combine/verdicts.mjs fromLayoutDiffRow) takes the LAST
 * `per_layer` key, and for boxes that key is the diagnostic unrounded layer `B0u`, not the final
 * layer (CONFIRMED on invoice: finalDelta dw -14.969 = B0u; the final layer has dw -11.09).
 */
function layerView(row) {
  if (!row) return null;
  const stats = row.layer_stats ?? [];
  const finalLayer = stats.at(-1)?.layer ?? null;
  const item = (x) =>
    x && {
      path: x.path ?? x.owner,
      text: x.text,
      type: x.type,
      firstOverTolerance: x.first_over_tolerance,
      dominantLayer: x.dominant_layer,
      finalLayerDelta: x.per_layer?.[finalLayer] ?? null,
      perLayer: x.per_layer,
    };
  return {
    note: "per-layer deltas vs Chromium (vellora - Chromium, CSS px, pre-pagination); finalLayerDelta is the delta in the final layout_normalize layer. Use it instead of layoutDiff.firstBox.finalDelta, which is the diagnostic B0u layer (see extract.mjs layerView).",
    finalLayer,
    firstBox: item(row.first_box),
    firstText: item(row.first_text),
    layerStats: stats.map((l) => ({
      layer: l.layer,
      kind: l.kind,
      events: l.events,
      diverged: l.diverged,
      boxEventsDiverged: l.box_events_diverged,
      textEventsDiverged: l.text_events_diverged,
      missing: l.missing,
      meanAbsBoxError: l.mean_abs_box_error,
    })),
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const summaryPath = join(opts.run, "summary.json");
  if (!existsSync(summaryPath)) refuse(`${summaryPath} not found`);
  const summaryBytes = readFileSync(summaryPath);
  const s = JSON.parse(summaryBytes);
  const env = s.environment;

  // 1. Is this run usable as a baseline at all?
  const errored = s.steps.filter((x) => x.status === "error");
  if (errored.length) refuse(`steps errored: ${errored.map((x) => x.id).join(", ")}`);
  const ratchetPath = join(opts.run, "wpt", "ratchet.json");
  const ratchet = existsSync(ratchetPath) ? readJson(ratchetPath) : null;
  if (ratchet?.status !== "ok") refuse(`WPT ratchet did not run: ${ratchet?.reason ?? "missing"}`);
  const wptSummary = readJson(join(opts.run, "wpt", "summary.json"));
  const expBytes = readFileSync(opts.expectations);
  const exp = JSON.parse(expBytes);
  if (exp.schema !== 2 || exp.wptCommit !== s.wpt.wptCommit) {
    refuse(
      `expectations are schema ${exp.schema} on WPT ${exp.wptCommit}, run is ${s.wpt.wptCommit}`,
    );
  }
  const wptRun = readJson(join(opts.run, "wpt", "results.json"));
  const rebuilt = buildExpectations({
    results: wptRun.tests,
    env: wptRun.env,
    suites: wptRun.config.suites ?? [],
    command: "",
    config: wptRun.config,
    inkCheck: "",
  });
  const differing = (a, b) =>
    [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]);
  const reproduction = {
    check:
      "fidelity/wpt/lib/report.mjs buildExpectations() re-applied to <run>/wpt/results.json vs the expectations file",
    tests: Object.keys(rebuilt.results).length,
    suspectPasses: Object.keys(rebuilt.suspectPasses).length,
    outcomesDiffering: differing(exp.results, rebuilt.results),
    suspectPassesDiffering: differing(exp.suspectPasses ?? {}, rebuilt.suspectPasses),
    sameEngine: exp.engine === rebuilt.engine,
    sameComparison: JSON.stringify(exp.comparison) === JSON.stringify(rebuilt.comparison),
    chromeOracleRan: Boolean(wptSummary.chromeVersion),
  };
  if (
    reproduction.outcomesDiffering.length ||
    reproduction.suspectPassesDiffering.length ||
    !reproduction.sameEngine ||
    !reproduction.sameComparison ||
    !reproduction.chromeOracleRan
  ) {
    refuse(
      `expectations are not what this run produces: ${JSON.stringify({ ...reproduction, outcomesDiffering: reproduction.outcomesDiffering.length, suspectPassesDiffering: reproduction.suspectPassesDiffering.length })}`,
    );
  }

  // 2. Round trip: per-fixture tallies must re-sum to the summary's totals.
  const sum = Object.fromEntries(STATUSES.map((k) => [k, 0]));
  for (const f of s.fixtures) {
    for (const [k, v] of Object.entries(tally([f]).counts)) sum[k] = (sum[k] ?? 0) + v;
  }
  const roundTripOk = JSON.stringify(sum) === JSON.stringify(s.totals.all.counts);
  if (!roundTripOk) {
    refuse(`fixture tallies ${JSON.stringify(sum)} != ${JSON.stringify(s.totals.all.counts)}`);
  }

  const extraction = {
    command: `node ${rel(fileURLToPath(import.meta.url))} ${process.argv
      .slice(2)
      .map((a) => (a.startsWith(repoRoot) ? rel(a) : a))
      .map(quote)
      .join(" ")}`,
    date: execFileSync("date", ["-u"], { encoding: "utf8" }).trim(),
  };
  const provenance = {
    runId: s.runId,
    date: s.date,
    dateIso: s.dateIso,
    authority: env.authority,
    command: s.command,
    os: env.os,
    cpu: env.cpu,
    node: env.node,
    rustc: env.rustc,
    chrome: env.chrome.version,
    poppler: env.poppler.pdftoppm,
    python: env.python.interpreter,
    toolsImage: `${env.docker.toolsImage.image} ${env.docker.toolsImage.id}`,
    verapdfImage: `${env.docker.verapdfImage.image} ${env.docker.verapdfImage.id}`,
    git: env.git,
    blitz: env.blitz,
    addon: env.addon,
    sourceSummarySha256: sha256(summaryBytes),
    extractedBy: extraction.command,
  };
  // Written as JSON.stringify output, then formatted with the repo's own biome (so `npm run lint`
  // passes), THEN hashed: the recorded sha256 is of the committed bytes.
  const written = [];
  const put = (name, value) => {
    write(join(opts.out, name), value);
    written.push(name);
  };

  // 3. One file per fixture/variant.
  const layoutPath = join(opts.run, "layout-diff", "summary-run-all.json");
  const layoutRows = existsSync(layoutPath) ? (readJson(layoutPath).fixtures ?? []) : [];
  for (const f of s.fixtures) {
    const steps = s.steps
      .filter(
        (x) =>
          x.id === "layout-diff" ||
          (f.sources.includes("oracles/run-fixtures.mjs") && x.id === "oracles-fixtures") ||
          (f.sources.includes("corpus/render-corpus.mjs") && x.id === "corpus") ||
          (f.fixture === "boleto" && x.id === "corpus-audit-existing-boleto") ||
          x.id.startsWith(`oracles-corpus:${f.key}:`),
      )
      .map(({ id, status, exitCode, signal, durationS, reason, command }) => ({
        id,
        status,
        exitCode,
        signal,
        durationS,
        reason,
        command,
      }));
    const t = tally([f]);
    put(`fixtures/${f.key}.json`, {
      schema: `${SCHEMA}/fixture`,
      labels: {
        verdicts: `${env.authority}; criterion IDs and mapping: fidelity/ACCEPTANCE.md and manifest.json acceptance.mapping`,
        layoutDiff: "attribution only (per-layer first divergence vs Chromium), never PASS/FAIL",
      },
      provenance,
      key: f.key,
      fixture: f.fixture,
      variant: f.variant,
      variantLabel: f.variantLabel,
      class: f.class,
      diagnostic: f.diagnostic,
      sources: f.sources,
      steps,
      totals: { counts: t.counts, byOracle: t.byOracle, caveated: t.caveated },
      controlsNotAsExpected: failedControls([f]),
      verdicts: f.verdicts,
      layoutDiff: f.layoutDiff,
      layoutDiffLayers:
        f.layoutDiff?.status === "ran"
          ? layerView(layoutRows.find((r) => r.fixture === f.fixture))
          : null,
    });
  }

  // 4. WPT per directory (+ the expectations file for this engine rev, byte copy).
  const expName = `wpt/expectations-${exp.engine}.json`;
  const expOut = join(opts.out, expName);
  mkdirSync(dirname(expOut), { recursive: true });
  writeFileSync(expOut, expBytes);
  const counts = (r) =>
    r && {
      reftests: r.reftests,
      pass: r.pass,
      passBlank: r["pass-blank"],
      fail: r.fail,
      unsupported: r.unsupported,
      error: r.error,
      timeout: r.timeout,
      skip: r.skip,
      passRate: r.passRate,
      passRateEvaluated: r.passRateEvaluated,
    };
  const chrome = wptSummary.chromeSummary;
  const wptStep = s.steps.find((x) => x.id === "wpt");
  put("wpt/by-directory.json", {
    schema: `${SCHEMA}/wpt`,
    labels: {
      authority: env.authority,
      passRates:
        "pass % = pass / reftests; % of evaluated = pass / (reftests - unsupported - skip); clean % = passes without any suspect-pass flag / reftests. pass-blank is never a pass. Definitions: fidelity/wpt/README.md",
    },
    provenance,
    step: wptStep && {
      status: wptStep.status,
      exitCode: wptStep.exitCode,
      durationS: wptStep.durationS,
      command: wptStep.command,
    },
    engineId: s.wpt.engineId,
    wptCommit: s.wpt.wptCommit,
    velloraCommit: s.wpt.velloraCommit,
    chromeOracle: s.wpt.chromeOracle,
    passRateCleanNote: s.wpt.passRateCleanNote,
    criteria: s.wpt.criteria,
    totals: s.wpt.totals,
    bySuite: s.wpt.bySuite,
    chromeReference: chrome
      ? {
          note: "the same reftests through Chrome print with the same geometry, rasterizer and comparator (fidelity/wpt/lib/chrome.mjs); INDICATIVE with a local Chrome",
          version: wptSummary.chromeVersion,
          totals: counts(chrome.totals),
          bySuite: Object.fromEntries(
            Object.entries(chrome.bySuite ?? {}).map(([k, v]) => [k, counts(v)]),
          ),
          velloraVsChrome: wptSummary.chromeCross,
          inkCheck: wptSummary.inkCheck,
        }
      : { status: "not-run", reason: "run-all without --wpt-chrome" },
    upstreamBlitzReport: wptSummary.upstream,
    unsupportedFeatures: wptSummary.summary.unsupportedFeatures,
    errorKinds: wptSummary.summary.errorKinds,
    skipReasons: wptSummary.summary.skipReasons,
    passFlags: wptSummary.summary.passFlags,
    attribution: wptSummary.attribution,
    ratchet: {
      status: ratchet.status,
      against: ratchet.file ? rel(ratchet.file) : null,
      expectationsEngine: ratchet.expectationsEngine,
      counts: ratchet.counts,
      regressions: ratchet.regressions,
      improvements: ratchet.improvements,
      changed: ratchet.changed,
      sightGained: ratchet.sightGained,
      added: ratchet.added,
    },
    expectations: {
      file: rel(expOut),
      sha256: sha256(expBytes),
      copiedFrom: rel(opts.expectations),
      engine: exp.engine,
      blitzDom: exp.blitzDom,
      generated: exp.generated,
      generatedBy: exp.command,
      vellora: exp.vellora,
      inkCheck: exp.inkCheck,
      tests: Object.keys(exp.results).length,
      suspectPasses: Object.keys(exp.suspectPasses ?? {}).length,
      reproducedByThisRun: reproduction,
      use: `node fidelity/wpt/run.mjs --expectations ${rel(expOut)}  (ratchet a different build, e.g. Blitz 0.3.0-beta.4, against this pin; the expectations check compares WPT commit and comparison settings, not the engine id)`,
    },
  });

  // 5. Format, hash, then the manifest (last: it carries the sha256 of every other file).
  biomeFormat(written.map((n) => join(opts.out, n)));
  const files = {};
  for (const name of [...written, expName].sort()) {
    files[name] = sha256(readFileSync(join(opts.out, name)));
  }
  if (files[expName] !== sha256(expBytes)) refuse(`${expName} is not a byte copy after formatting`);
  const manifest = {
    schema: `${SCHEMA}/manifest`,
    labels: {
      authority: env.authority,
      what: "Baseline at the current Blitz pin: per-fixture verdicts (fidelity/ACCEPTANCE.md criterion IDs), layout-diff attribution and per-WPT-directory results of one fidelity/run-all.mjs run, re-shaped by extract.mjs. Phase A: measurement only.",
    },
    knownIssues: [
      "run-all's layoutDiff.firstBox.finalDelta (fidelity/combine/verdicts.mjs fromLayoutDiffRow) is the delta of the LAST per_layer key, which for boxes is the diagnostic unrounded layer B0u, not the final layout_normalize layer. Not fixed here (combine/ is not this baseline's path); every fixtures/<key>.json carries layoutDiffLayers.firstBox.finalLayerDelta from layout-diff's own summary instead.",
      "layout-diff exits 2 by design (receipt: html_normalize hoist fails self-consistency; oss-postmark-receipt: Helvetica stack not in FONT_ALIASES, input parity fails, attribution INVALID). Recorded per fixture, not a crash.",
    ],
    provenance,
    environment: env,
    preflight: s.preflight,
    acceptance: s.acceptance,
    steps: s.steps.map(({ id, status, exitCode, signal, durationS, reason, command }) => ({
      id,
      status,
      exitCode,
      signal,
      durationS,
      reason,
      command,
    })),
    totals: s.totals,
    roundTrip: {
      ok: roundTripOk,
      check: "sum of per-fixture tallies == summary totals.all.counts",
      counts: sum,
    },
    canaries: s.canaries,
    excludedFixtures: s.excludedFixtures,
    uncoveredFixtures: s.uncoveredFixtures,
    wpt: {
      engineId: s.wpt.engineId,
      totals: s.wpt.totals,
      criteria: s.wpt.criteria,
      ratchetCounts: ratchet.counts,
      expectationsReproduced: {
        tests: reproduction.tests,
        suspectPasses: reproduction.suspectPasses,
        outcomesDiffering: reproduction.outcomesDiffering.length,
        suspectPassesDiffering: reproduction.suspectPassesDiffering.length,
      },
    },
    comparedTo: opts.compare
      ? { file: rel(opts.compare), ...compareRuns(s, readJson(opts.compare)) }
      : null,
    source: {
      summary: rel(summaryPath),
      summarySha256: sha256(summaryBytes),
      note: "fidelity/results/ is gitignored; the run directory is not committed",
    },
    extraction,
    files,
  };
  write(join(opts.out, "manifest.json"), manifest);
  biomeFormat([join(opts.out, "manifest.json")]);
  process.stdout.write(
    `extract: ${Object.keys(files).length} files + manifest.json in ${rel(opts.out)}; round trip ok; ${s.fixtures.length} fixtures\n`,
  );
}

main();
