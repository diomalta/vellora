// Crashtest outcome taxonomy, the crates.io Blitz version -> upstream run map, and the inkCheck
// guard of the expectations ratchet (fidelity/ACCEPTANCE.md WPT-2 / WPT-3).
import assert from "node:assert/strict";
import { test } from "node:test";
import { poolOutcome } from "../crashtests.mjs";
import { CRASH_OUTCOMES, crashOutcome } from "../lib/crash-outcome.mjs";
import { expectationsMismatch, inkCheckLabel } from "../lib/provenance.mjs";
import { BLITZ_RELEASES, upstreamComparability, upstreamShaFor } from "../lib/upstream-map.mjs";

test("crashtest outcomes: clean rejections are ok, panics are panic, harness failures are error", () => {
  assert.deepEqual(crashOutcome(null), { outcome: "ok" });
  assert.equal(crashOutcome({ status: "unsupported", feature: "element:script" }).outcome, "ok");
  assert.equal(crashOutcome({ status: "error", kind: "input", message: "bad" }).outcome, "ok");
  assert.equal(
    crashOutcome({ status: "error", kind: "panic", message: "panicked at" }).outcome,
    "panic",
  );
  assert.equal(
    crashOutcome({ status: "error", kind: "harness", message: "EISDIR" }).outcome,
    "error",
  );
  assert.deepEqual(poolOutcome({ outcome: "timeout", cause: { message: "exceeded" } }), {
    outcome: "timeout",
    message: "exceeded",
  });
  assert.equal(
    poolOutcome({ outcome: "error", cause: { kind: "crash", message: "SIGABRT" } }).outcome,
    "crash",
  );
  for (const o of ["ok", "panic", "crash", "timeout", "error", "skip"])
    assert.ok(CRASH_OUTCOMES.includes(o));
});

test("crates.io 0.3.0-beta.4 maps to tag commit 92b11f1 and to the nearest upstream run", () => {
  const r = BLITZ_RELEASES["0.3.0-beta.4"];
  assert.equal(r.commit, "92b11f1bd8ab7975411328b0406a95a09445b4e7");
  const m = upstreamShaFor({ version: "0.3.0-beta.4", rev: null });
  assert.equal(m.sha, "23b9b26a9b6af5947b8f003d2c2cc768bff10b8a");
  assert.match(m.via, /92b11f1/);
  assert.equal(
    upstreamShaFor({ version: "0.3.0-alpha.5", rev: "2003ba5fc2d8931da9213ef26a813b0d24c83ca6" })
      .sha,
    "2003ba5fc2d8931da9213ef26a813b0d24c83ca6",
  );
  assert.equal(upstreamShaFor({ version: "9.9.9", rev: null }), null);
  assert.equal(
    upstreamComparability("9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba", "cd1d8aa5b").sameWptRevision,
    false,
  );
  assert.equal(
    upstreamComparability(r.upstreamRun.wptRevisionFull, r.upstreamRun.wptRevision).sameWptRevision,
    true,
  );
});

test("the expectations ratchet refuses an inkCheck mismatch (clean/flagged would mean different things)", () => {
  const config = {
    chainReferences: false,
    inlineCss: true,
    raster: { tool: "pdftocairo", dpi: 96, antialias: true },
  };
  const exp = {
    schema: 2,
    wptCommit: "p",
    comparison: { semantics: 2, chainReferences: false, inlineCss: true, raster: config.raster },
    inkCheck: "chrome Chrome/155.0.8059.85",
  };
  assert.equal(
    expectationsMismatch(exp, { wptCommit: "p", config, inkCheck: "chrome Chrome/155.0.8059.85" }),
    null,
  );
  assert.match(
    expectationsMismatch(exp, { wptCommit: "p", config, inkCheck: "not-run" }),
    /inkCheck mismatch/,
  );
  assert.equal(inkCheckLabel({ status: "ok" }, "Chrome/1"), "chrome Chrome/1");
  assert.equal(inkCheckLabel({ status: "not-run" }, "Chrome/1"), "not-run");
  assert.equal(inkCheckLabel(null, null), "not-run");
});
