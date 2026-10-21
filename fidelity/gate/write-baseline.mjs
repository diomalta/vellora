#!/usr/bin/env node
// Write a committed baseline directory (schema vellora-fidelity/baseline/2) from a
// fidelity/run-all.mjs output directory, in the shape gate/snapshot.mjs loads:
//
//   fidelity/baselines/<name>/
//     manifest.json        schema, labels, provenance (env, command, date, git, Blitz, addon),
//                          source run + summary sha256, canary counts, gate result (when the run
//                          was gated), acceptedRegressions (reason + evidence), files: sha256 of
//                          every other file (the loader verifies them)
//     fixtures/<key>.json  verdicts (ACCEPTANCE.md criterion IDs) + layout-diff attribution
//     metrics.json         every derived metric (gate/metrics.mjs), for review and diffs
//     wpt/expectations-<engine>.json  per-test outcomes + suspect flags (schema 2, with inkCheck)
//     wpt/by-directory.json, wpt/crashtests.json
//     pdf-probe/<fixture>.json        per-word dx/dy vs Chrome's PDF (compact)
//     canaries.json, code-checks.json, gate-report.{json,md} (when gated)
//
//   node fidelity/gate/write-baseline.mjs --run <run-all out dir> --name <name>
//     [--accept <accepted.json>] [--root fidelity/baselines] [--note <text>] [--force]
//     [--attach <file>[=<name>]]...   extra evidence copied to attachments/ (hashed in files)
//
// --accept: the acceptedRegressions the run's gate used; copied verbatim into the manifest (each
// entry: key|keyPrefix, reason, evidence). Refuses to overwrite an existing directory without
// --force, and refuses a run whose gate verdict is FAIL/REFUSED unless --force (and says so in
// the manifest).
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portable } from "../combine/env.mjs";
import { verdictIndex } from "./metrics.mjs";
import { readAcceptances } from "./run.mjs";
import { BASELINE_SCHEMA, loadRunDir } from "./snapshot.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Committed files never carry the local checkout or home path (<repo>/..., ~/...).
const json = (v) => `${JSON.stringify(portable(v, repoRoot), null, 2)}\n`;
const AUTHORITY =
  "INDICATIVE (local macOS run; the pinned Linux CI run with Chrome for Testing is authoritative and is a DESIGN TARGET, not wired)";

/**
 * Copy a report into the baseline under the same rule as the files written here: text reports
 * (.json/.md/.txt) get the local checkout and home path rewritten (<repo>/..., ~/...); anything else
 * is copied byte for byte. A gate report embeds the run's argv verbatim (e.g. an absolute
 * `--chrome-from` path), so copying it raw would commit the local home path.
 */
export function copyPortable(src, dest, root = repoRoot) {
  if (/\.(json|md|txt)$/i.test(dest)) {
    writeFileSync(dest, portable(readFileSync(src, "utf8"), root));
  } else copyFileSync(src, dest);
}

/** `biome format --write` with the repo's pinned biome (a note instead when it is missing). */
function biomeFormat(path) {
  const bin = join(repoRoot, "node_modules", ".bin", "biome");
  // Relative path: biome.json ignores ".claude", which an ABSOLUTE path of a worktree under
  // .claude/worktrees/ would match.
  const r = spawnSync(bin, ["format", "--write", relative(repoRoot, path)], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (r.error) return `not formatted: ${r.error.message}`;
  return r.status === 0
    ? "biome format --write (repo biome.json) before hashing"
    : `biome exit ${r.status}: ${String(r.stderr).slice(0, 200)}`;
}

function listFiles(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name), base) : [relative(base, join(dir, e.name))],
  );
}

export function writeBaseline({
  runDir,
  outDir,
  name,
  acceptFile = null,
  note = null,
  command,
  forced = false,
  attach = [],
}) {
  const snap = loadRunDir(runDir);
  // Extra evidence files (e.g. the same run gated against another baseline), hashed like the rest.
  if (attach.length) mkdirSync(join(outDir, "attachments"), { recursive: true });
  for (const a of attach) {
    const [src, as] = a.split("=").length === 2 ? a.split("=") : [a, null];
    copyPortable(resolve(src), join(outDir, "attachments", as ?? src.split("/").pop()));
  }
  const s = snap.summary;
  const env = s.environment ?? {};
  mkdirSync(join(outDir, "fixtures"), { recursive: true });
  mkdirSync(join(outDir, "wpt"), { recursive: true });
  for (const f of snap.fixtures) {
    writeFileSync(
      join(outDir, "fixtures", `${f.key}.json`),
      json({
        schema: `${BASELINE_SCHEMA}/fixture`,
        key: f.key,
        fixture: f.fixture,
        variant: f.variant,
        class: f.class,
        diagnostic: f.diagnostic,
        verdicts: f.verdicts,
        layoutDiff: f.layoutDiff,
      }),
    );
  }
  const { metrics } = verdictIndex(snap.fixtures);
  writeFileSync(
    join(outDir, "metrics.json"),
    json({
      note: "derived by fidelity/gate/metrics.mjs from the fixture verdicts (the gate re-derives them; this file is for review)",
      metrics: Object.fromEntries(
        [...metrics].map(([k, m]) => [
          k,
          {
            value: m.value,
            better: m.better,
            tolClass: m.tolClass ?? null,
            ...(m.unmeasured ? { unmeasured: m.unmeasured } : {}),
          },
        ]),
      ),
    }),
  );
  if (snap.wpt.expectations) {
    const e = snap.wpt.expectations;
    writeFileSync(join(outDir, "wpt", `expectations-${e.engine}.json`), json(e));
  }
  if (s.wpt?.bySuite) {
    writeFileSync(
      join(outDir, "wpt", "by-directory.json"),
      json({
        engineId: s.wpt.engineId,
        wptCommit: s.wpt.wptCommit,
        chromeOracle: s.wpt.chromeOracle,
        totals: s.wpt.totals,
        bySuite: s.wpt.bySuite,
        criteria: s.wpt.criteria,
      }),
    );
  }
  if (snap.crashtests?.results)
    writeFileSync(join(outDir, "wpt", "crashtests.json"), json(snap.crashtests));
  if (snap.pdfProbe) {
    mkdirSync(join(outDir, "pdf-probe"), { recursive: true });
    for (const [fixture, p] of Object.entries(snap.pdfProbe)) {
      writeFileSync(join(outDir, "pdf-probe", `${fixture}.json`), json(p));
    }
  }
  writeFileSync(
    join(outDir, "canaries.json"),
    json({ counts: s.canaryCounts ?? null, canaries: snap.canaries ?? [] }),
  );
  if (snap.codeChecks)
    writeFileSync(join(outDir, "code-checks.json"), json({ checks: snap.codeChecks }));
  let gate = null;
  const gateDir = join(runDir, "gate");
  if (existsSync(join(gateDir, "gate-report.json"))) {
    const g = JSON.parse(readFileSync(join(gateDir, "gate-report.json"), "utf8"));
    gate = {
      verdict: g.verdict,
      baseline: g.baseline?.dir ?? null,
      counts: g.counts,
      refusals: g.refusals,
      accepted: g.items
        .filter((i) => i.class === "accepted")
        .map((i) => ({ key: i.key, before: i.before, after: i.after, ...i.acceptedAs })),
      gating: g.items
        .filter((i) => i.gating)
        .map((i) => ({
          key: i.key,
          class: i.class,
          before: i.before,
          after: i.after,
          detail: i.detail,
        })),
    };
    copyPortable(join(gateDir, "gate-report.json"), join(outDir, "gate-report.json"));
    copyPortable(join(gateDir, "gate-report.md"), join(outDir, "gate-report.md"));
  }
  // The baseline is committed and `npm run lint` (biome) checks JSON under fidelity/baselines:
  // format with the repo's own biome BEFORE hashing, so the recorded sha256s stay valid.
  const formatted = biomeFormat(outDir);
  const files = Object.fromEntries(
    listFiles(outDir)
      .filter((f) => f !== "manifest.json" && f !== "README.md")
      .sort()
      .map((f) => [f, sha256(readFileSync(join(outDir, f)))]),
  );
  const manifest = {
    schema: BASELINE_SCHEMA,
    name,
    labels: {
      authority: AUTHORITY,
      what: "Baseline for the fidelity value ratchet (fidelity/gate/): verdicts with values, WPT per-test outcomes with Chrome ink flags, crashtests, per-word pdf-probe, canaries, code checks.",
      ...(note ? { note } : {}),
    },
    provenance: {
      runId: s.runId,
      date: s.date,
      dateIso: s.dateIso,
      command: s.command,
      os: env.os,
      cpu: env.cpu,
      node: env.node,
      rustc: env.rustc,
      chrome: env.chrome?.version ?? null,
      poppler: env.poppler?.pdftoppm ?? null,
      python: env.python?.interpreter ?? null,
      toolsImage: env.docker?.toolsImage
        ? `${env.docker.toolsImage.image} ${env.docker.toolsImage.id ?? ""}`.trim()
        : null,
      verapdfImage: env.docker?.verapdfImage?.id ?? null,
      git: env.git ?? null,
      blitz: env.blitz ?? null,
      addon: env.addon ?? null,
      wpt: env.wpt ?? null,
    },
    environment: env,
    source: {
      run: relative(repoRoot, runDir),
      summarySha256: sha256(readFileSync(join(runDir, "summary.json"))),
      note: "fidelity/results/ is gitignored; the run directory is not committed",
    },
    canaryCounts: s.canaryCounts ?? null,
    totals: s.totals ?? null,
    gate: gate && { ...gate, writtenDespiteVerdict: forced && gate.verdict !== "PASS" },
    acceptedRegressions: readAcceptances(acceptFile),
    extraction: { command, date: new Date().toISOString() },
    files,
  };
  manifest.formatting = formatted;
  writeFileSync(join(outDir, "manifest.json"), json(manifest));
  biomeFormat(join(outDir, "manifest.json"));
  return manifest;
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const runDir = val("--run") && resolve(val("--run"));
  const name = val("--name");
  if (!runDir || !name || !/^[\w.-]+$/.test(name)) {
    process.stderr.write(
      "usage: write-baseline.mjs --run <run-all out dir> --name <name> [--accept <file>] [--root <dir>] [--note <text>] [--force]\n",
    );
    process.exitCode = 2;
    return;
  }
  const outDir = join(resolve(val("--root") ?? join(repoRoot, "fidelity", "baselines")), name);
  const force = argv.includes("--force");
  if (existsSync(outDir) && !force) {
    process.stderr.write(`write-baseline: ${outDir} exists (use --force to overwrite)\n`);
    process.exitCode = 2;
    return;
  }
  const gateFile = join(runDir, "gate", "gate-report.json");
  if (existsSync(gateFile)) {
    const verdict = JSON.parse(readFileSync(gateFile, "utf8")).verdict;
    if (verdict !== "PASS" && !force) {
      process.stderr.write(
        `write-baseline: the run's gate verdict is ${verdict}; fix or accept the regressions first (or --force, recorded in the manifest)\n`,
      );
      process.exitCode = 3;
      return;
    }
  }
  const m = writeBaseline({
    runDir,
    outDir,
    name,
    acceptFile: val("--accept") ? resolve(val("--accept")) : null,
    attach: argv.flatMap((a, i) => (a === "--attach" && argv[i + 1] ? [argv[i + 1]] : [])),
    note: val("--note") ?? null,
    command: `node fidelity/gate/write-baseline.mjs ${argv.join(" ")}`,
    forced: force,
  });
  process.stdout.write(
    `write-baseline: ${outDir} (${Object.keys(m.files).length} files; gate ${m.gate?.verdict ?? "not run"})\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`write-baseline failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
