// run-all.mjs --raw passes --raw to the wpt step (fidelity/wpt/run.mjs), so a gated run records
// tests[i].rawOutcome for every WPT test (GATE-A3's (b) route reads it). No render here.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseArgs, wptStepArgs } from "../../run-all.mjs";

test("--raw reaches the wpt step once; without it the wpt arguments are unchanged", () => {
  const base = { out: "/o/wpt", baselineExpectations: "/b/wpt/expectations-x.json" };
  const plain = parseArgs(["--chrome-from", "/c/results.json"]);
  assert.equal(plain.raw, false);
  assert.deepEqual(wptStepArgs({ opts: plain, ...base }), [
    "--out",
    "/o/wpt",
    "--expectations",
    "/b/wpt/expectations-x.json",
    "--chrome-from",
    "/c/results.json",
  ]);
  const raw = parseArgs(["--raw", "--chrome-from", "/c/results.json"]);
  assert.equal(raw.raw, true);
  const args = wptStepArgs({ opts: raw, ...base });
  assert.equal(args.filter((a) => a === "--raw").length, 1);
  assert.deepEqual(
    args.filter((a) => a !== "--raw"),
    wptStepArgs({ opts: plain, ...base }),
  );
  // Also given as --wpt-arg --raw: still passed once.
  const both = parseArgs(["--raw", "--wpt-arg", "--raw"]);
  assert.equal(wptStepArgs({ opts: both, ...base }).filter((a) => a === "--raw").length, 1);
});
