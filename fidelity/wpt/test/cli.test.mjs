// CLI-level guards of run.mjs (validator findings of 2026-10-21). These exit before any render, so
// they need neither the native addon nor poppler.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const runner = resolve(here, "..", "run.mjs");
const repo = resolve(here, "..", "..", "..");
const pinnedCache = join(repo, "fidelity", ".cache", "wpt");

function run(args) {
  const r = spawnSync(process.execPath, [runner, ...args], { encoding: "utf8", timeout: 60000 });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

/** A WPT-shaped tree (fonts/Ahem.ttf + one reftest) with no git metadata, outside any repo. */
function bareTree() {
  const root = mkdtempSync(join(tmpdir(), "wpt-bare-"));
  mkdirSync(join(root, "fonts"));
  writeFileSync(join(root, "fonts", "Ahem.ttf"), "not-a-font");
  mkdirSync(join(root, "css", "x"), { recursive: true });
  writeFileSync(join(root, "css", "x", "t.html"), `<link rel="match" href="r.html"><p>t`);
  writeFileSync(join(root, "css", "x", "r.html"), "<p>t");
  return root;
}

test("--update-expectations is refused for a partial run (before anything is rendered)", () => {
  for (const extra of [["--filter", "x"], ["--limit", "5"], ["css/CSS2/box"]]) {
    const r = run(["--update-expectations", ...extra]);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /--update-expectations refused/);
  }
  const chained = run(["--update-expectations", "--chain-references"]);
  assert.equal(chained.status, 2);
  assert.match(chained.out, /not wptrunner semantics/);
  const unpinned = run(["--update-expectations", "--allow-unpinned"]);
  assert.equal(unpinned.status, 2);
  assert.match(unpinned.out, /not a baseline/);
});

test("a WPT tree that cannot be proven to be the pin is refused without --allow-unpinned", () => {
  const root = bareTree();
  const out = mkdtempSync(join(tmpdir(), "wpt-out-"));
  try {
    const r = run(["--wpt", root, "--out", out, "css/x"]);
    assert.equal(r.status, 2, r.out);
    assert.match(r.out, /not exactly the pin: no git metadata/);
    assert.equal(existsSync(join(out, "results.json")), false, "nothing was run");
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  }
});

test(
  "a vellora build without a git commit needs --label",
  { skip: existsSync(join(pinnedCache, ".git")) ? false : "no pinned WPT cache (fetch-wpt.mjs)" },
  () => {
    // Fake build root: Cargo.lock + crates/ is what findRepoRoot looks for; no .git anywhere above.
    const build = mkdtempSync(join(tmpdir(), "vellora-nogit-"));
    try {
      copyFileSync(join(repo, "Cargo.lock"), join(build, "Cargo.lock"));
      mkdirSync(join(build, "crates"));
      mkdirSync(join(build, "packages", "vellora", "dist"), { recursive: true });
      const entry = join(build, "packages", "vellora", "dist", "index.js");
      writeFileSync(entry, "export {};\n");
      const r = run(["--vellora", entry, "--filter", "^$", "--expectations", "none"]);
      assert.equal(r.status, 2, r.out);
      assert.match(r.out, /has no git commit; pass --label/);
    } finally {
      rmSync(build, { recursive: true, force: true });
    }
  },
);
