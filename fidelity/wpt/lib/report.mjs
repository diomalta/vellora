// Aggregation, the expectations ratchet, and the upstream (Blitz's own WPT run) cross-tab.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { zstdDecompressSync } from "node:zlib";

export const OUTCOMES = ["pass", "fail", "unsupported", "error", "timeout", "skip"];
const NON_REFTEST_KINDS = ["testharness", "css-manual", "manual", "visual", "crashtest"];

function pct(n, d) {
  return d === 0 ? null : Math.round((n / d) * 10000) / 100;
}

function emptyRow() {
  const row = { reftests: 0, screen: 0, print: 0 };
  for (const o of OUTCOMES) row[o] = 0;
  row.passBlank = 0;
  row.notRun = {};
  for (const k of NON_REFTEST_KINDS) row.notRun[k] = 0;
  return row;
}

function finishRow(row) {
  row.passRate = pct(row.pass, row.reftests);
  row.passRateEvaluated = pct(row.pass, row.pass + row.fail);
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
  const errorKinds = {};
  const skipReasons = {};
  for (const r of results) {
    const o = outcomeOf(r);
    if (!o) continue;
    for (const row of [bySuite[r.suite], totals]) {
      row.reftests++;
      row[r.mode]++;
      row[o]++;
      if (o === "pass" && r.blank) row.passBlank++;
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
  for (const s of suites)
    bySuite[s] = { velloraOnlyFail: 0, bothFail: 0, velloraPassChromeFail: 0, bothPass: 0 };
  for (const r of results) {
    if (!r.chrome) continue;
    const key = `${r.outcome}|${r.chrome.outcome}`;
    matrix[key] = (matrix[key] ?? 0) + 1;
    const row = bySuite[r.suite];
    if (!row) continue;
    if (r.outcome === "fail" && r.chrome.outcome === "pass") row.velloraOnlyFail++;
    else if (r.outcome === "fail" && r.chrome.outcome === "fail") row.bothFail++;
    else if (r.outcome === "pass" && r.chrome.outcome === "fail") row.velloraPassChromeFail++;
    else if (r.outcome === "pass" && r.chrome.outcome === "pass") row.bothPass++;
  }
  const totals = { velloraOnlyFail: 0, bothFail: 0, velloraPassChromeFail: 0, bothPass: 0 };
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
    else if (c === "pass" && up === "PASS") k = "velloraLayerSuspect";
    else if (c === "pass" && up && up !== "ABSENT") k = "blitzLayoutSuspect";
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
  { title, env, chromeSummary, chromeCross, flags, upstream, attribution },
) {
  const lines = [];
  lines.push(`# ${title}`, "");
  if (env) {
    lines.push(
      `- date: ${env.date}`,
      `- engine: ${env.engine.id} (blitz-dom ${env.engine.blitzDom?.version}), krilla ${env.engine.krilla?.version}`,
      `- vellora: ${env.vellora.commit} (${env.vellora.branch}), WPT: ${env.wpt.commit}`,
      `- node ${env.node}, ${env.rustc}, ${env.pdftoppm}`,
      `- OS: ${JSON.stringify(env.os)}, ${env.cpus} CPUs`,
      "",
    );
  }
  const head = [
    "suite",
    "reftests",
    "pass",
    "fail",
    "unsup",
    "error",
    "timeout",
    "skip",
    "pass %",
    "pass % of evaluated",
  ];
  if (chromeSummary) head.push("chrome pass %");
  lines.push(`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`);
  const row = (name, r, c) => {
    const cells = [
      name,
      r.reftests,
      r.pass,
      r.fail,
      r.unsupported,
      r.error,
      r.timeout,
      r.skip,
      r.passRate ?? "-",
      r.passRateEvaluated ?? "-",
    ];
    if (chromeSummary) cells.push(c?.passRate ?? "-");
    lines.push(`| ${cells.join(" | ")} |`);
  };
  for (const [s, r] of Object.entries(summary.bySuite)) row(s, r, chromeSummary?.bySuite[s]);
  row("**total**", summary.totals, chromeSummary?.totals);
  lines.push("", `pass (both blank): ${summary.totals.passBlank}`, "");
  if (chromeCross) {
    lines.push("## vellora × Chrome (print oracle)", "");
    lines.push(
      "| suite | vellora-only fail | both fail | vellora pass, Chrome fail | both pass |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const [s, r] of [
      ...Object.entries(chromeCross.bySuite),
      ["**total**", chromeCross.totals],
    ]) {
      lines.push(
        `| ${s} | ${r.velloraOnlyFail} | ${r.bothFail} | ${r.velloraPassChromeFail} | ${r.bothPass} |`,
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

/** Expectations document: test path → outcome, plus provenance. */
export function buildExpectations({ results, env, suites, command }) {
  const out = {};
  for (const r of [...results].sort((a, b) => (a.test < b.test ? -1 : 1))) out[r.test] = r.outcome;
  return {
    schema: 1,
    engine: env.engine.id,
    blitzDom: env.engine.blitzDom,
    vellora: env.vellora.commit,
    wptCommit: env.wpt.commit,
    generated: env.date,
    command,
    suites,
    results: out,
  };
}

/**
 * Ratchet: regressions are expected-pass tests that no longer pass; improvements are tests that
 * now pass but were not expected to; `changed` are non-pass → different non-pass.
 */
export function compareExpectations(expected, results) {
  const actual = new Map(results.map((r) => [r.test, r.outcome]));
  const regressions = [];
  const improvements = [];
  const changed = [];
  const added = [];
  let unchanged = 0;
  for (const [test, now] of actual) {
    const was = expected.results[test];
    if (was === undefined) added.push({ test, actual: now });
    else if (was === now) unchanged++;
    else if (was === "pass") regressions.push({ test, expected: was, actual: now });
    else if (now === "pass") improvements.push({ test, expected: was, actual: now });
    else changed.push({ test, expected: was, actual: now });
  }
  const missing = Object.keys(expected.results).filter((t) => !actual.has(t));
  return {
    expectationsEngine: expected.engine,
    expectationsVellora: expected.vellora,
    expectationsWpt: expected.wptCommit,
    counts: {
      regressions: regressions.length,
      improvements: improvements.length,
      changed: changed.length,
      added: added.length,
      missing: missing.length,
      unchanged,
    },
    regressions,
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
