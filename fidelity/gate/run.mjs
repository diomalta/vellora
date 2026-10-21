#!/usr/bin/env node
// Value-ratchet gate over an EXISTING run: compare a fidelity/run-all.mjs output directory (or
// any snapshot directory) with a committed baseline directory, write gate-report.{json,md}, and
// exit non-zero on any regression beyond tolerance. `node fidelity/run-all.mjs --gate --baseline
// <dir>` runs the same evaluation at the end of a fresh run.
//
//   node fidelity/gate/run.mjs --baseline <fidelity/baselines/<name>> --run <run-all out dir>
//     [--accept <accepted.json>] [--out <dir>]
//
// --accept  JSON { "acceptedRegressions": [{ "key" | "keyPrefix", "after"?, "reason",
//           "evidence", "label"?, "class"?: "a" }], "declaredRejections": [{ "feature",
//           "reason", "evidence", "tests"? | "keys"? | "keyPrefix"? }] } (a baseline's
//           manifest.json has the same fields): regressions PROVEN to be corrections of a wrong
//           old value (class a: false pass, oracle artefact) and new strict-gate rejections the
//           step makes on purpose (fidelity/ACCEPTANCE.md GATE-A1).
// Exit: 0 PASS; 3 FAIL (regression beyond tolerance, or an absolute failure of the run: red code
// check, uncaught canary, unexpected layout-diff check failure, expired allowlist entry, crashed
// step); 2 REFUSED (not comparable: WPT commit / settings / ink data differ, baseline integrity);
// 1 the gate itself crashed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "./compare.mjs";
import { renderGateMarkdown } from "./report.mjs";
import { loadSnapshot } from "./snapshot.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const rel = (p) => relative(repoRoot, p) || ".";

export const GATE_EXIT = Object.freeze({ PASS: 0, FAIL: 3, REFUSED: 2 });

/** wpt/run.mjs options that take a value (their value is not a suite path). */
const WPT_VALUE_OPTIONS = new Set([
  "--wpt",
  "--out",
  "--jobs",
  "--timeout-ms",
  "--artifacts",
  "--rasterizer",
  "--vellora",
  "--expectations",
  "--upstream",
  "--chrome-jobs",
  "--chrome-from",
  "--label",
]);

/** The first --wpt-arg that narrows the default suites (--filter, --limit, a suite path), or null. */
export function wptNarrowing(args) {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--filter" || a === "--limit") return a;
    if (WPT_VALUE_OPTIONS.has(a)) {
      i++;
      continue;
    }
    if (!a.startsWith("--")) return a;
  }
  return null;
}

/**
 * Why `run-all.mjs --gate` cannot start, checked BEFORE the 10+ minute WPT step (null = ok).
 * opts: { baseline, accept, wptArgs, chromeFrom, wptChrome, chrome }; selected: step ids.
 */
export function gateRefusal(opts, selected, exists = existsSync) {
  if (!opts.baseline) return "--gate needs --baseline <fidelity/baselines/<name>>";
  if (!exists(join(opts.baseline, "manifest.json"))) {
    return `${opts.baseline} has no manifest.json (not a baseline directory)`;
  }
  if (opts.accept && !exists(opts.accept)) return `--accept ${opts.accept} does not exist`;
  if ((opts.wptArgs ?? []).includes("--update-expectations")) {
    return "a gated run never rewrites committed expectations (drop --wpt-arg --update-expectations)";
  }
  // Every step feeds a gated section (code checks, WPT, crashtests, canaries, pdf-probe, ...):
  // skipping one would silently drop its checks.
  const missing = (opts.allSteps ?? []).filter((s) => !selected.includes(s));
  if (missing.length) {
    return `a gated run runs every step; not selected: ${missing.join(", ")} (drop --only/--skip)`;
  }
  if (opts.canaries === false) return "a gated run runs the canaries (drop --no-canaries)";
  const narrowing = wptNarrowing(opts.wptArgs ?? []);
  if (narrowing) {
    return `a gated run measures the full default WPT suites (--wpt-arg ${narrowing} narrows them)`;
  }
  if (selected.includes("wpt")) {
    if (opts.chromeFrom && !exists(opts.chromeFrom)) {
      return `--chrome-from ${opts.chromeFrom} does not exist`;
    }
    const liveChrome = opts.wptChrome && opts.chrome && exists(opts.chrome);
    if (!opts.chromeFrom && !liveChrome) {
      return "the WPT ratchet needs Chrome ink data: pass --wpt-chrome (live Chrome) or --chrome-from <wpt results.json>";
    }
  }
  return null;
}

export function readAcceptances(file) {
  if (!file) return [];
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(doc) ? doc : (doc.acceptedRegressions ?? []);
  for (const e of list) {
    if (!(e.key || e.keyPrefix) || !e.reason || !e.evidence) {
      throw new Error(
        `acceptance entry needs key|keyPrefix, reason and evidence: ${JSON.stringify(e)}`,
      );
    }
    // GATE-A1: compensating drift (class b) is entered in DEBT.json, never accepted.
    if (e.class !== undefined && e.class !== "a") {
      throw new Error(
        `acceptance entry of class "${e.class}": only class "a" (artefact: the OLD value is proven wrong) is accepted; compensating drift (class b) goes into fidelity/baselines/port/DEBT.json: ${JSON.stringify(e.key ?? e.keyPrefix)}`,
      );
    }
  }
  return list;
}

/**
 * declaredRejections of the same file (an accepted.json, or a baseline's manifest.json): new
 * strict-gate rejections the step makes on purpose (GATE-A1, D5). Each: feature (the core gate's
 * `feature` id, e.g. "css:page-varying-width"), reason, evidence, and optionally tests (WPT),
 * keys / keyPrefix (verdict rows, metrics).
 */
export function readDeclarations(file) {
  if (!file) return [];
  const doc = JSON.parse(readFileSync(file, "utf8"));
  const list = Array.isArray(doc) ? [] : (doc.declaredRejections ?? []);
  for (const d of list) {
    if (!d.feature || !d.reason || !d.evidence) {
      throw new Error(
        `declaredRejections entry needs feature, reason and evidence: ${JSON.stringify(d)}`,
      );
    }
  }
  return list;
}

/** Evaluate and write gate-report.{json,md} into outDir. Returns { report, exitCode }. */
export function runGate({ baselineDir, runDir, acceptFile = null, outDir, command, date }) {
  const before = loadSnapshot(baselineDir);
  const after = loadSnapshot(runDir);
  const accept = readAcceptances(acceptFile);
  const declared = readDeclarations(acceptFile);
  const report = compareSnapshots(before, after, { accept, declared });
  const meta = {
    date: date ?? new Date().toISOString(),
    command,
    baseline: {
      dir: rel(baselineDir),
      schema: before.source.schema,
      provenance: before.provenance ?? null,
      integrity: before.integrity,
    },
    run: { dir: rel(runDir), schema: after.source.schema, provenance: after.provenance ?? null },
    acceptFile: acceptFile ? rel(acceptFile) : null,
  };
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "gate-report.json"),
    `${JSON.stringify({ ...meta, ...report }, null, 2)}\n`,
  );
  writeFileSync(
    join(outDir, "gate-report.md"),
    renderGateMarkdown(report, {
      baseline: `${meta.baseline.dir} (${before.source.schema})`,
      run: `${meta.run.dir} (${after.source.schema})`,
      command,
      date: meta.date,
      environment: after.provenance?.environment ?? null,
    }),
  );
  return { report, exitCode: GATE_EXIT[report.verdict] ?? 1 };
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (argv.includes("--help") || !val("--baseline") || !val("--run")) {
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
  const runDir = resolve(val("--run"));
  const outDir = resolve(val("--out") ?? join(runDir, "gate"));
  const { report, exitCode } = runGate({
    baselineDir: resolve(val("--baseline")),
    runDir,
    acceptFile: val("--accept") ? resolve(val("--accept")) : null,
    outDir,
    command: `node fidelity/gate/run.mjs ${argv.join(" ")}`,
  });
  process.stdout.write(
    `gate: ${report.verdict}; ${Object.entries(report.counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(
        ", ",
      )}\n${report.refusals.map((r) => `gate: REFUSED ${r}\n`).join("")}gate: report ${join(outDir, "gate-report.md")}\n`,
  );
  process.exitCode = exitCode;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`gate failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
