// I5 (2026-10-22): rescore-pdf-probe.mjs must FAIL when biome formatting does not run, instead of
// recording the failure in manifest.pdfProbeRescore.formatting and hashing unformatted files.
import assert from "node:assert/strict";
import { test } from "node:test";
import { rescoreBaseline } from "../rescore-pdf-probe.mjs";
import { BIOME_FORMATTED, assertFormatted, biomeUnavailable } from "../write-baseline.mjs";

test("assertFormatted passes only biomeFormat's success value", () => {
  assert.equal(assertFormatted(BIOME_FORMATTED, "x"), BIOME_FORMATTED);
  for (const bad of ["not formatted: spawn ENOENT", "biome exit 1: error", undefined]) {
    assert.throws(() => assertFormatted(bad, "fidelity/baselines/x/pdf-probe"), /biome formatting/);
  }
});

test("the repo's biome binary runs here (the preflight's control)", () => {
  assert.equal(biomeUnavailable(), null);
});

test("a re-score refuses to start when biome is not runnable, before touching the baseline", () => {
  assert.throws(
    () =>
      rescoreBaseline({
        dir: "/nonexistent-baseline",
        runDir: "/nonexistent-run",
        command: "test",
        formatterUnavailable: () => "node_modules/.bin/biome: spawn ENOENT",
      }),
    /biome is not runnable/,
  );
});
