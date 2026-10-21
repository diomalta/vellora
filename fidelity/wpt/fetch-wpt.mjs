#!/usr/bin/env node
// Fetch web-platform-tests at the pinned commit with a partial (blob:none) + sparse checkout into
// fidelity/.cache/wpt. WPT is BSD-3-Clause and multi-GB; it is never vendored into this repo.
//
//   node fidelity/wpt/fetch-wpt.mjs                 # commit from fidelity/wpt/WPT_COMMIT
//   node fidelity/wpt/fetch-wpt.mjs --commit <sha>  # any other commit (e.g. an upstream report's)
//   node fidelity/wpt/fetch-wpt.mjs --dir <path>    # alternative checkout location
//
// Idempotent: re-running with the same commit only re-applies the sparse patterns.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SPARSE_PATTERNS } from "./suites.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REMOTE = "https://github.com/web-platform-tests/wpt.git";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const commit = arg("--commit", readFileSync(join(here, "WPT_COMMIT"), "utf8").trim());
const dir = resolve(arg("--dir", join(here, "..", ".cache", "wpt")));
if (!/^[0-9a-f]{40}$/.test(commit)) {
  console.error(`fetch-wpt: commit must be a full 40-hex sha, got ${JSON.stringify(commit)}`);
  process.exit(2);
}

function git(args, opts = {}) {
  return execFileSync("git", ["-C", dir, ...args], {
    stdio: ["ignore", "pipe", "inherit"],
    encoding: "utf8",
    ...opts,
  }).trim();
}

mkdirSync(dir, { recursive: true });
if (!existsSync(join(dir, ".git"))) {
  git(["init", "-q"]);
  git(["remote", "add", "origin", REMOTE]);
}
git(["sparse-checkout", "init", "--no-cone"]);
writeFileSync(join(dir, ".git", "info", "sparse-checkout"), `${SPARSE_PATTERNS.join("\n")}\n`);

let head = "";
try {
  // A fresh repository has no HEAD yet; keep git's "ambiguous argument" message off the console.
  head = git(["rev-parse", "HEAD"], { stdio: ["ignore", "pipe", "ignore"] });
} catch {
  head = "";
}
const t0 = Date.now();
if (head !== commit) {
  console.log(`fetch-wpt: fetching ${commit} (depth 1, blob:none) into ${dir}`);
  git(["fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", commit]);
  git(["checkout", "-q", "--detach", commit]);
} else {
  git(["sparse-checkout", "reapply"]);
}
const verified = git(["rev-parse", "HEAD"]);
if (verified !== commit) {
  console.error(`fetch-wpt: HEAD is ${verified}, expected ${commit}`);
  process.exit(1);
}
const date = git(["log", "-1", "--format=%cI"]);
console.log(
  `fetch-wpt: OK ${verified} (committed ${date}) in ${((Date.now() - t0) / 1000).toFixed(1)}s`,
);
