#!/usr/bin/env node
// The repo's own test and lint suites as one gate step (fidelity/ACCEPTANCE.md GATE-C1). Each
// check runs as its own process so one red suite never hides another; `npm test` is NOT used
// because it stops after test:rust.
//
//   node fidelity/gate/code-checks.mjs --out <dir> [--only cargo-test,vitest,lint,fidelity-test]
//
// Writes <dir>/summary.json ({ checks: [{ id, command, exitCode, status, durationS, failures,
// log }] }) and one log per check. cargo's "failures:" block is parsed so the report names the
// failing tests. Exit 0 when every check passed, 1 otherwise (the gate treats any red check as an
// absolute failure: red is red, whatever the baseline was).
import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export const CODE_CHECKS = Object.freeze([
  {
    id: "cargo-test",
    cmd: "cargo",
    args: ["test", "--workspace", "--no-fail-fast"],
    why: "npm run test:rust (= cargo test), every crate incl. crates/vellora-core/tests/layout_dump.rs",
  },
  { id: "vitest", cmd: "npm", args: ["run", "test:ts"], why: "npm run test:ts (vitest run)" },
  {
    id: "lint",
    cmd: "npm",
    args: ["run", "lint"],
    why: "clippy -D warnings + cargo fmt --check + biome check",
  },
  {
    id: "fidelity-test",
    cmd: "npm",
    args: ["--prefix", "fidelity", "test"],
    why: "node --test self-tests of every fidelity area (incl. the gate's own)",
  },
]);

/** Test names from cargo's "failures:" summary blocks (the indented list after "failures:"). */
export function cargoFailures(log) {
  const out = new Set();
  const lines = log.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "failures:") continue;
    for (let j = i + 1; j < lines.length; j++) {
      const m = lines[j].match(/^ {4}(\S+)$/);
      if (m) out.add(m[1]);
      else if (lines[j].trim() === "" && j > i + 1) break;
      else if (!m && lines[j].trim() !== "") break;
    }
  }
  return [...out];
}

/** Failing test titles from node --test / vitest output (best effort; the exit code decides). */
export function nodeTestFailures(log) {
  const out = new Set();
  for (const m of log.matchAll(/^\s*(?:not ok \d+ - |✖ |× |FAIL\s+)(.+?)\s*$/gm)) out.add(m[1]);
  return [...out].slice(0, 20);
}

function runOne(check, logDir) {
  const log = join(logDir, `${check.id}.log`);
  const fd = openSync(log, "w");
  const started = Date.now();
  return new Promise((done) => {
    const child = spawn(check.cmd, check.args, {
      cwd: repoRoot,
      stdio: ["ignore", fd, fd],
      env: process.env,
    });
    const finish = (exitCode, error) => {
      closeSync(fd);
      const text = readFileSync(log, "utf8");
      const failures =
        check.id === "cargo-test" ? cargoFailures(text) : exitCode ? nodeTestFailures(text) : [];
      done({
        id: check.id,
        command: [check.cmd, ...check.args].join(" "),
        why: check.why,
        exitCode,
        status: !error && exitCode === 0 ? "pass" : "fail",
        error: error?.message ?? null,
        durationS: Math.round((Date.now() - started) / 100) / 10,
        failures,
        log: relative(repoRoot, log),
      });
    };
    child.on("error", (e) => finish(null, e));
    child.on("exit", (code) => finish(code, null));
  });
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const out = resolve(val("--out") ?? join(repoRoot, "fidelity", "results", "code-checks"));
  const only = val("--only")?.split(",");
  mkdirSync(out, { recursive: true });
  const checks = [];
  for (const c of CODE_CHECKS.filter((x) => !only || only.includes(x.id))) {
    process.stdout.write(`code-checks: [${c.id}] ${c.cmd} ${c.args.join(" ")}\n`);
    const r = await runOne(c, out);
    process.stdout.write(
      `code-checks: [${c.id}] ${r.status} (exit ${r.exitCode}, ${r.durationS}s)${r.failures.length ? ` failing: ${r.failures.join(", ")}` : ""}\n`,
    );
    checks.push(r);
  }
  writeFileSync(
    join(out, "summary.json"),
    `${JSON.stringify({ schema: "vellora-fidelity/code-checks/1", checks }, null, 2)}\n`,
  );
  process.exitCode = checks.every((c) => c.status === "pass") ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`code-checks failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
