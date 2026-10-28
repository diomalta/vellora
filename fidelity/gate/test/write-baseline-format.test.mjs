// write-baseline.mjs FAILS when biome formatting does not run (as I5 made rescore-pdf-probe do),
// instead of recording the failure in manifest.formatting and hashing unformatted files.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { BIOME_FORMATTED, writeBaseline } from "../write-baseline.mjs";

function minimalRun() {
  const dir = mkdtempSync(join(tmpdir(), "vellora-write-baseline-format-"));
  const run = join(dir, "run");
  mkdirSync(run);
  writeFileSync(join(run, "summary.json"), "{}");
  return { dir, run, out: join(dir, "out") };
}

test("a baseline is refused before anything is written when biome is not runnable", () => {
  const { dir, run, out } = minimalRun();
  assert.throws(
    () =>
      writeBaseline({
        runDir: run,
        outDir: out,
        name: "t",
        command: "test",
        formatterUnavailable: () => "node_modules/.bin/biome: spawn ENOENT",
      }),
    /biome is not runnable/,
  );
  assert.equal(existsSync(out), false);
  rmSync(dir, { recursive: true, force: true });
});

test("a biome failure while formatting the baseline fails the write (never a recorded note)", () => {
  const { dir, run, out } = minimalRun();
  assert.throws(
    () =>
      writeBaseline({
        runDir: run,
        outDir: out,
        name: "t",
        command: "test",
        formatterUnavailable: () => null,
        format: () => "biome exit 1: error",
      }),
    /biome formatting did not run/,
  );
  assert.equal(existsSync(join(out, "manifest.json")), false);
  // The same minimal run with a formatter that succeeds is written, formatting recorded.
  const m = writeBaseline({
    runDir: run,
    outDir: out,
    name: "t",
    command: "test",
    formatterUnavailable: () => null,
    format: () => BIOME_FORMATTED,
  });
  assert.equal(m.formatting, BIOME_FORMATTED);
  rmSync(dir, { recursive: true, force: true });
});
