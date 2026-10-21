// Aggregation, the expectations ratchet, and the upstream (Blitz's own WPT run) cross-tab.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { zstdDecompressSync } from "node:zlib";
import { comparisonConfig } from "./provenance.mjs";

/**
 * `pass-blank` (WPT pass rule satisfied by a pure-white test rendering whose reference is not an
 * empty document by construction) is its own outcome: it is never counted in `pass` or in any
 * pass rate. See lib/run-test.mjs.
 */
export const OUTCOMES = ["pass", "pass-blank", "fail", "unsupported", "error", "timeout", "skip"];
const isPassLike = (o) => o === "pass" || o === "pass-blank";
/** missingFrac at or above which a pass is flagged `ink-missing-vs-chrome` (validator's 0.5). */
export const INK_MISSING_SUSPECT = 0.5;

/**
 * Reasons a `pass` may not show what the test asserts, from the test's own preparation record
 * (deterministic) and, when the Chrome oracle ran, from the ink check (indicative). They never
 * change an outcome; they split `pass` into flagged and clean.
 */
export function suspectFlags(r) {
  const p = r.prepare ?? {};
  const out = [];
  if (p.uncoveredCodepoints) out.push("uncovered-glyphs");
  if (p.cssUrlResources) out.push("css-url-resource");
  if (p.imgWithoutDimAttrs) out.push("img-without-dims");
  if ((p.skippedFonts ?? []).length) out.push("webfont-not-supplied");
  if ((p.missingResources ?? []).length) out.push("missing-resource");
  if (r.inkCheck && r.inkCheck.missingFrac >= INK_MISSING_SUSPECT) {
    out.push("ink-missing-vs-chrome");
  }
  return out;
}
const NON_REFTEST_KINDS = ["testharness", "css-manual", "manual", "visual", "crashtest"];

function pct(n, d) {
  return d === 0 ? null : Math.round((n / d) * 10000) / 100;
}

function emptyRow() {
  const row = { reftests: 0, screen: 0, print: 0 };
  for (const o of OUTCOMES) row[o] = 0;
  row.passFlagged = 0;
  row.notRun = {};
  for (const k of NON_REFTEST_KINDS) row.notRun[k] = 0;
  return row;
}

function finishRow(row) {
  row.passClean = row.pass - row.passFlagged;
  row.passRate = pct(row.pass, row.reftests);
  row.passRateEvaluated = pct(row.pass, row.pass + row["pass-blank"] + row.fail);
  row.passRateClean = pct(row.passClean, row.reftests);
  return row;
}

function sortObject(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/**
 * Stable summary (no timings): totals, per-suite rows, unsupported features, error kinds, skip
 * reasons. `discovered` is the classified file list; `results` the per-reftest records.
 */
export function summarize({ discovered, results, suites, engine = "vellora" }) {
  const outcomeOf = (r) => (engine === "vellora" ? r.outcome : r.chrome?.outcome);
  const bySuite = {};
  for (const s of suites) bySuite[s] = emptyRow();
  const totals = emptyRow();
  for (const f of discovered) {
    if (NON_REFTEST_KINDS.includes(f.kind)) {
      bySuite[f.suite].notRun[f.kind]++;
      totals.notRun[f.kind]++;
    }
  }
  const features = {};
  const flagCounts = {};
  const errorKinds = {};
  const skipReasons = {};
  for (const r of results) {
    const o = outcomeOf(r);
    if (!o) continue;
    for (const row of [bySuite[r.suite], totals]) {
      row.reftests++;
      row[r.mode]++;
      row[o]++;
      if (o === "pass" && engine === "vellora" && suspectFlags(r).length) row.passFlagged++;
    }
    if (o === "pass" && engine === "vellora") {
      for (const f of suspectFlags(r)) flagCounts[f] = (flagCounts[f] ?? 0) + 1;
    }
    const cause = engine === "vellora" ? r.cause : r.chrome?.cause;
    if (o === "unsupported" && cause?.feature) {
      const k = `${cause.feature} (${r.node ?? "test"})`;
      features[k] = (features[k] ?? 0) + 1;
    }
    if (o === "error") {
      const k = cause?.kind ?? "unknown";
      errorKinds[k] = (errorKinds[k] ?? 0) + 1;
    }
    if (o === "skip") {
      const k = cause?.reason ?? "unknown";
      skipReasons[k] = (skipReasons[k] ?? 0) + 1;
    }
  }
  for (const s of suites) finishRow(bySuite[s]);
  finishRow(totals);
  return {
    engine,
    totals,
    bySuite,
    unsupportedFeatures: Object.fromEntries(
      Object.entries(features).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)),
    ),
    errorKinds: sortObject(errorKinds),
    skipReasons: sortObject(skipReasons),
    passFlags: sortObject(flagCounts),
  };
}

/**
 * Cross-engine ink check over vellora's passes (needs the Chrome oracle): distribution of the share
 * of Chrome's significant ink that vellora's TEST rendering lacks, and of the ink bounding-box
 * shift. HYPOTHESIS-grade (colour-histogram heuristic; Chrome prints, vellora paginates).
 */
export function inkCheckSummary(results, status) {
  if (status) return status;
  const passes = results.filter((r) => r.outcome === "pass" && r.inkCheck);
  const blanks = results.filter((r) => r.outcome === "pass-blank" && r.inkCheck);
  const bucket = (v, edges) => {
    for (const [name, hi] of edges) if (v < hi) return name;
    return edges[edges.length - 1][0];
  };
  const missing = { "<0.1": 0, "0.1-0.3": 0, "0.3-0.5": 0, "0.5-0.8": 0, ">=0.8": 0 };
  const shift = { "<=8": 0, "9-32": 0, "33-100": 0, ">100": 0, "no-ink": 0 };
  for (const r of passes) {
    const m = r.inkCheck.missingFrac;
    missing[
      bucket(m, [
        ["<0.1", 0.1],
        ["0.1-0.3", 0.3],
        ["0.3-0.5", 0.5],
        ["0.5-0.8", 0.8],
        [">=0.8", 2],
      ])
    ]++;
    const b = r.inkCheck.bboxShift;
    shift[
      b === null
        ? "no-ink"
        : bucket(b, [
            ["<=8", 9],
            ["9-32", 33],
            ["33-100", 101],
            [">100", 1e9],
          ])
    ]++;
  }
  return {
    status: "ok",
    passesChecked: passes.length,
    passesWithoutData: results.filter((r) => r.outcome === "pass" && !r.inkCheck).length,
    missingFrac: missing,
    flagged: passes.filter((r) => r.inkCheck.missingFrac >= INK_MISSING_SUSPECT).length,
    bboxShift: shift,
    passBlank: {
      checked: blanks.length,
      chromeDrawsSignificantInk: blanks.filter((r) => r.inkCheck.chromeSignificant).length,
      chromeAlsoBlank: blanks.filter((r) => r.inkCheck.oracleInk === 0).length,
    },
  };
}

/**
 * vellora × Chrome outcome matrix for tests both engines ran. `velloraOnlyFail` (vellora fails,
 * Chrome passes) is the actionable set; `bothFail` points at the test, the harness geometry, or
 * print-vs-screen differences rather than at vellora.
 */
export function chromeCrossTab(results, suites) {
  const matrix = {};
  const bySuite = {};
  const blankRow = () => ({
    velloraOnlyFail: 0,
    bothFail: 0,
    velloraPassChromeFail: 0,
    bothPass: 0,
    velloraPassBlank: 0,
  });
  for (const s of suites) bySuite[s] = blankRow();
  for (const r of results) {
    if (!r.chrome) continue;
    const key = `${r.outcome}|${r.chrome.outcome}`;
    matrix[key] = (matrix[key] ?? 0) + 1;
    const row = bySuite[r.suite];
    if (!row) continue;
    // Chrome's own pass-blank counts as a Chrome pass here (Chrome draws what it is given).
    const c = r.chrome.outcome;
    if (r.outcome === "pass-blank") row.velloraPassBlank++;
    else if (r.outcome === "fail" && isPassLike(c)) row.velloraOnlyFail++;
    else if (r.outcome === "fail" && c === "fail") row.bothFail++;
    else if (r.outcome === "pass" && c === "fail") row.velloraPassChromeFail++;
    else if (r.outcome === "pass" && isPassLike(c)) row.bothPass++;
  }
  const totals = blankRow();
  for (const row of Object.values(bySuite))
    for (const k of Object.keys(totals)) totals[k] += row[k];
  return { matrix: sortObject(matrix), totals, bySuite };
}

/**
 * Three-way attribution of vellora `fail`s (needs both the Chrome oracle and the upstream report).
 * This is triage, not proof: upstream is a lenient screen-paint runner with `floats` enabled.
 *   velloraLayerSuspect — Chrome passes AND Blitz's own runner passes: the difference arises in
 *                         what vellora adds or removes (pagination, post-layout normalization, PDF
 *                         emit, build features, input preparation);
 *   blitzLayoutSuspect  — Chrome passes, Blitz's own runner does not pass;
 *   oracleInconclusive  — Chrome's print rendering fails too;
 *   unattributed        — Chrome did not evaluate it or upstream has no result.
 */
export function attributeFailures(results, suites) {
  const keys = ["velloraLayerSuspect", "blitzLayoutSuspect", "oracleInconclusive", "unattributed"];
  const bySuite = {};
  for (const s of suites) bySuite[s] = Object.fromEntries(keys.map((k) => [k, 0]));
  const lists = Object.fromEntries(keys.map((k) => [k, []]));
  for (const r of results) {
    if (r.outcome !== "fail") continue;
    const c = r.chrome?.outcome;
    const up = r.upstream;
    let k = "unattributed";
    if (c === "fail") k = "oracleInconclusive";
    else if (isPassLike(c) && up === "PASS") k = "velloraLayerSuspect";
    else if (isPassLike(c) && up && up !== "ABSENT") k = "blitzLayoutSuspect";
    lists[k].push(r.test);
    if (bySuite[r.suite]) bySuite[r.suite][k]++;
  }
  const totals = Object.fromEntries(keys.map((k) => [k, lists[k].length]));
  return { totals, bySuite, lists };
}

/**
 * Outcome counts for tests whose preparation recorded a condition that can explain a failure
 * without a layout bug (attribution aid; it does not change any outcome).
 */
export function prepareFlagBreakdown(results) {
  const flags = {
    xhtmlHazard: (p) => (p.xhtmlHazards ?? []).length > 0,
    imgWithoutDimAttrs: (p) => (p.imgWithoutDimAttrs ?? 0) > 0,
    fontAliasMismatch: (p) => (p.fontAliasMismatch ?? []).length > 0,
    skippedFonts: (p) => (p.skippedFonts ?? []).length > 0,
    missingResources: (p) => (p.missingResources ?? []).length > 0,
    inlinedStylesheets: (p) => (p.inlinedStylesheets ?? 0) > 0,
    mergedAuthorPage: (p) => p.pageInjection === "merged-into-author-@page",
    uncoveredCodepoints: (p) => (p.uncoveredCodepoints ?? 0) > 0,
    cssUrlResources: (p) => (p.cssUrlResources ?? 0) > 0,
  };
  const out = {};
  for (const name of Object.keys(flags)) out[name] = {};
  for (const r of results) {
    if (!r.prepare) continue;
    for (const [name, test] of Object.entries(flags)) {
      if (test(r.prepare)) out[name][r.outcome] = (out[name][r.outcome] ?? 0) + 1;
    }
  }
  return out;
}

/** Markdown table for summary.md. */
export function summaryMarkdown(
  summary,
  { title, env, chromeSummary, chromeCross, flags, upstream, attribution, raster, inkCheck, pin },
) {
  const lines = [];
  lines.push(`# ${title}`, "");
  if (env) {
    lines.push(
      `- date: ${env.date}`,
      `- engine: ${env.engine.id} (blitz-dom ${env.engine.blitzDom?.version}), krilla ${env.engine.krilla?.version}`,
      `- vellora: ${env.vellora.commit} (${env.vellora.branch}), WPT: ${env.wpt.commit}`,
      `- node ${env.node}, ${env.rustc}, raster: ${raster ? `${raster.tool} (${env[raster.tool]}) @ ${raster.dpi} DPI, antialias ${raster.antialias}` : env.pdftocairo}`,
      `- OS: ${JSON.stringify(env.os)}, ${env.cpus} CPUs`,
      `- WPT pin: ${pin?.ok ? "exact (HEAD = WPT_COMMIT, clean tree)" : `NOT exact — ${(pin?.problems ?? ["unknown"]).join("; ")}`}`,
      "",
    );
  }
  const head = [
    "suite",
    "reftests",
    "pass",
    "pass (clean)",
    "pass-blank",
    "fail",
    "unsup",
    "error",
    "timeout",
    "skip",
    "pass %",
    "pass % of evaluated",
    "clean pass %",
  ];
  if (chromeSummary) head.push("chrome pass %");
  lines.push(`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`);
  const row = (name, r, c) => {
    const cells = [
      name,
      r.reftests,
      r.pass,
      r.passClean,
      r["pass-blank"],
      r.fail,
      r.unsupported,
      r.error,
      r.timeout,
      r.skip,
      r.passRate ?? "-",
      r.passRateEvaluated ?? "-",
      r.passRateClean ?? "-",
    ];
    if (chromeSummary) cells.push(c?.passRate ?? "-");
    lines.push(`| ${cells.join(" | ")} |`);
  };
  for (const [s, r] of Object.entries(summary.bySuite)) row(s, r, chromeSummary?.bySuite[s]);
  row("**total**", summary.totals, chromeSummary?.totals);
  lines.push(
    "",
    "`pass-blank` (test rendering pure white, reference not empty by construction) is not a pass and",
    "is excluded from every pass rate; `pass (clean)` = passes with no suspect flag; pass % of",
    "evaluated = pass / (pass + pass-blank + fail).",
    "",
    "## Suspect-flagged passes (a pass that may not show what the test asserts)",
    "",
  );
  for (const [k, v] of Object.entries(summary.passFlags ?? {})) lines.push(`- ${k}: ${v}`);
  lines.push("");
  if (inkCheck) {
    lines.push(
      "## Ink check of vellora passes against Chrome's test rendering (HYPOTHESIS-grade)",
      "",
    );
    if (inkCheck.status !== "ok") lines.push(`not run: ${inkCheck.reason}`, "");
    else {
      lines.push(
        `- passes checked: ${inkCheck.passesChecked} (without data: ${inkCheck.passesWithoutData})`,
        `- share of Chrome's significant ink missing in vellora: ${JSON.stringify(inkCheck.missingFrac)}`,
        `- flagged ink-missing-vs-chrome (>= 0.5): ${inkCheck.flagged}`,
        `- ink bounding-box shift (px): ${JSON.stringify(inkCheck.bboxShift)}`,
        `- pass-blank: ${JSON.stringify(inkCheck.passBlank)}`,
        "",
      );
    }
  }
  if (chromeCross) {
    lines.push("## vellora × Chrome (print oracle)", "");
    lines.push(
      "| suite | vellora-only fail | both fail | vellora pass, Chrome fail | both pass | vellora pass-blank |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const [s, r] of [
      ...Object.entries(chromeCross.bySuite),
      ["**total**", chromeCross.totals],
    ]) {
      lines.push(
        `| ${s} | ${r.velloraOnlyFail} | ${r.bothFail} | ${r.velloraPassChromeFail} | ${r.bothPass} | ${r.velloraPassBlank} |`,
      );
    }
    lines.push("");
  }
  if (upstream?.status === "ok") {
    lines.push(
      `## vellora × upstream Blitz report (${upstream.sha.slice(0, 12)}, WPT ${upstream.upstreamWptRevision})`,
      "",
    );
    for (const [k, v] of Object.entries(upstream.counts)) lines.push(`- ${k}: ${v}`);
    lines.push("", ...upstream.caveats.map((c) => `> ${c}`), "");
  } else if (upstream) {
    lines.push("## Upstream Blitz report", "", `not run: ${upstream.reason}`, "");
  }
  if (attribution) {
    lines.push("## Attribution of vellora failures (triage; see README)", "");
    lines.push(
      "| suite | vellora-layer suspect | Blitz-layout suspect | oracle inconclusive | unattributed |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const [s, r] of [
      ...Object.entries(attribution.bySuite),
      ["**total**", attribution.totals],
    ]) {
      lines.push(
        `| ${s} | ${r.velloraLayerSuspect} | ${r.blitzLayoutSuspect} | ${r.oracleInconclusive} | ${r.unattributed} |`,
      );
    }
    lines.push("");
  }
  if (flags) {
    lines.push("## Preparation flags × outcome (attribution aid)", "");
    for (const [k, v] of Object.entries(flags)) lines.push(`- ${k}: ${JSON.stringify(v)}`);
    lines.push("");
  }
  lines.push("## Unsupported features (strict gate; node that was rejected)", "");
  for (const [k, v] of Object.entries(summary.unsupportedFeatures).slice(0, 30))
    lines.push(`- ${k}: ${v}`);
  lines.push("", "## Errors by kind", "");
  for (const [k, v] of Object.entries(summary.errorKinds)) lines.push(`- ${k}: ${v}`);
  lines.push("", "## Skipped reftests by reason", "");
  for (const [k, v] of Object.entries(summary.skipReasons)) lines.push(`- ${k}: ${v}`);
  lines.push("", "## Not run (not reftests)", "");
  for (const [k, v] of Object.entries(summary.totals.notRun)) lines.push(`- ${k}: ${v}`);
  return `${lines.join("\n")}\n`;
}

/**
 * Expectations document (schema 2): test path → outcome, the comparison settings the outcomes
 * depend on (a ratchet refuses different ones), and for every `pass` with suspect flags the
 * comma-joined flags, so a later run can tell a regression of a clean pass from one of a pass that
 * was never verified. `inkCheck` records whether Chrome-derived flags are included.
 */
export function buildExpectations({ results, env, suites, command, config, inkCheck }) {
  const out = {};
  const suspect = {};
  for (const r of [...results].sort((a, b) => (a.test < b.test ? -1 : 1))) {
    out[r.test] = r.outcome;
    if (r.outcome === "pass") {
      const flags = suspectFlags(r);
      if (flags.length) suspect[r.test] = flags.join(",");
    }
  }
  return {
    schema: 2,
    engine: env.engine.id,
    blitzDom: env.engine.blitzDom,
    vellora: env.vellora.commit,
    velloraSourceHash: env.vellora.sourceHash ?? null,
    wptCommit: env.wpt.commit,
    generated: env.date,
    command,
    suites,
    comparison: comparisonConfig(config),
    inkCheck,
    results: out,
    suspectPasses: suspect,
  };
}

/**
 * Ratchet (schema-2 expectations; the caller checks compatibility first):
 *   regressions   — expected `pass` → anything else (including `pass-blank`: content vanished);
 *                   each carries `expectedFlags` when the expected pass was flagged suspect;
 *   sightGained   — expected `pass-blank` → a non-pass: the oracle now sees content it could not
 *                   see before (not a regression; usually a pre-existing gap becoming visible);
 *   improvements  — any non-pass → `pass`;
 *   changed       — non-pass → a different non-pass.
 */
export function compareExpectations(expected, results) {
  const actual = new Map(results.map((r) => [r.test, r.outcome]));
  const flags = expected.suspectPasses ?? {};
  const regressions = [];
  const sightGained = [];
  const improvements = [];
  const changed = [];
  const added = [];
  let unchanged = 0;
  for (const [test, now] of actual) {
    const was = expected.results[test];
    const entry = { test, expected: was, actual: now };
    if (was === undefined) added.push({ test, actual: now });
    else if (was === now) unchanged++;
    else if (was === "pass") {
      if (flags[test]) entry.expectedFlags = flags[test];
      regressions.push(entry);
    } else if (now === "pass") improvements.push(entry);
    else if (was === "pass-blank") sightGained.push(entry);
    else changed.push(entry);
  }
  const missing = Object.keys(expected.results).filter((t) => !actual.has(t));
  const flaggedRegressions = regressions.filter((r) => r.expectedFlags).length;
  return {
    status: "ok",
    expectationsEngine: expected.engine,
    expectationsVellora: expected.vellora,
    expectationsWpt: expected.wptCommit,
    expectationsInkCheck: expected.inkCheck ?? null,
    counts: {
      regressions: regressions.length,
      regressionsOfCleanPasses: regressions.length - flaggedRegressions,
      regressionsOfFlaggedPasses: flaggedRegressions,
      sightGained: sightGained.length,
      improvements: improvements.length,
      changed: changed.length,
      added: added.length,
      missing: missing.length,
      unchanged,
    },
    regressions,
    sightGained,
    improvements,
    changed,
    added,
    missing,
  };
}

export const UPSTREAM_REPORT_URL = (sha) =>
  `https://raw.githubusercontent.com/DioxusLabs/blitz-wpt-results/main/reports/${sha}.json.zst`;
export const UPSTREAM_RUNS_URL =
  "https://raw.githubusercontent.com/DioxusLabs/blitz-wpt-results/main/summary/runs.json";

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": "vellora-fidelity-tooling" } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

/** Load (downloading once into the cache) Blitz's own wptreport for a Blitz commit. */
export async function loadUpstreamReport({ sha, cacheDir, offline = false }) {
  const dest = `${cacheDir}/reports/${sha}.json.zst`;
  const runsDest = `${cacheDir}/runs.json`;
  if (!existsSync(dest)) {
    if (offline) return { error: `report for ${sha} not cached and --offline set` };
    try {
      await download(UPSTREAM_REPORT_URL(sha), dest);
    } catch (e) {
      return { error: String(e.message ?? e) };
    }
  }
  if (!existsSync(runsDest) && !offline) {
    try {
      await download(UPSTREAM_RUNS_URL, runsDest);
    } catch {
      // runs.json only adds provenance (WPT revision); its absence is recorded below.
    }
  }
  const report = JSON.parse(zstdDecompressSync(readFileSync(dest)).toString("utf8"));
  let run = null;
  if (existsSync(runsDest)) {
    const runs = JSON.parse(readFileSync(runsDest, "utf8")).runs ?? [];
    run = runs.find((r) => r.product_revision === sha) ?? null;
  }
  const statuses = new Map();
  for (const r of report.results ?? []) statuses.set(String(r.test).replace(/^\//, ""), r.status);
  return { sha, url: UPSTREAM_REPORT_URL(sha), run, runInfo: report.run_info ?? null, statuses };
}

/**
 * Cross-tab of our outcome × Blitz's own (screen, vello-painted) status for the same test path.
 * Buckets: both-pass, vellora-only-fail (upstream PASS but vellora fail), upstream-only-fail,
 * both-fail, vellora-not-evaluated (unsupported/error/timeout/skip), upstream-absent.
 */
export function upstreamCrossTab(results, upstream) {
  const matrix = {};
  const buckets = {
    bothPass: [],
    velloraFailUpstreamPass: [],
    velloraPassUpstreamFail: [],
    velloraPassBlank: [],
    bothFail: [],
    velloraNotEvaluatedUpstreamPass: [],
    velloraNotEvaluatedUpstreamNotPass: [],
    upstreamAbsent: [],
  };
  for (const r of results) {
    const up = upstream.statuses.get(r.test) ?? "ABSENT";
    const key = `${r.outcome}|${up}`;
    matrix[key] = (matrix[key] ?? 0) + 1;
    if (up === "ABSENT") buckets.upstreamAbsent.push(r.test);
    else if (r.outcome === "pass-blank") buckets.velloraPassBlank.push(r.test);
    else if (r.outcome === "pass" && up === "PASS") buckets.bothPass.push(r.test);
    else if (r.outcome === "fail" && up === "PASS") buckets.velloraFailUpstreamPass.push(r.test);
    else if (r.outcome === "pass") buckets.velloraPassUpstreamFail.push(r.test);
    else if (r.outcome === "fail") buckets.bothFail.push(r.test);
    else if (up === "PASS") buckets.velloraNotEvaluatedUpstreamPass.push(r.test);
    else buckets.velloraNotEvaluatedUpstreamNotPass.push(r.test);
  }
  const counts = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.length]));
  return { matrix: sortObject(matrix), counts, buckets };
}
