// Provenance guards and the schema-2 ratchet (validator findings of 2026-10-21: the WPT pin and
// tree cleanliness were only warned about, the ratchet ignored provenance, a partial run could
// overwrite the committed baseline, and a failed `git` call leaked into a run directory name).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { gitInfo } from "../lib/env.mjs";
import {
  HARNESS_SEMANTICS,
  chromeReuseMismatch,
  comparisonConfig,
  expectationsMismatch,
  makeRunId,
  partialRunReason,
  wptPinProblems,
} from "../lib/provenance.mjs";
import { buildExpectations, compareExpectations, suspectFlags } from "../lib/report.mjs";

const PIN = "9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba";
const RASTER = { tool: "pdftocairo", dpi: 96, antialias: true };

function git(dir, ...args) {
  return execFileSync("git", ["-C", dir, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@example.invalid",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@example.invalid",
    },
  }).trim();
}

test("pin: a tree without git metadata, another HEAD, or dirty files is refused", () => {
  assert.deepEqual(
    wptPinProblems({ commit: PIN, dirtyTrackedFiles: 0, untrackedFiles: 0 }, PIN),
    [],
  );
  assert.match(wptPinProblems({ commit: null }, PIN)[0], /no git metadata/);
  assert.match(wptPinProblems({ commit: "a".repeat(40) }, PIN)[0], /HEAD a+ != pinned/);
  assert.match(
    wptPinProblems({ commit: PIN, dirtyTrackedFiles: 1, untrackedFiles: 0 }, PIN)[0],
    /1 modified tracked/,
  );
  assert.match(
    wptPinProblems({ commit: PIN, dirtyTrackedFiles: 0, untrackedFiles: 60 }, PIN)[0],
    /60 untracked/,
  );
});

test("pin: gitInfo counts untracked files and detects an enclosing repository", () => {
  const root = mkdtempSync(join(tmpdir(), "wpt-git-"));
  try {
    git(root, "init", "-q");
    writeFileSync(join(root, "a.html"), "a");
    git(root, "add", "a.html");
    git(root, "commit", "-q", "-m", "a");
    const head = git(root, "rev-parse", "HEAD");
    const clean = { root, ...gitInfo(root) };
    assert.deepEqual(wptPinProblems(clean, head), []);
    writeFileSync(join(root, "injected-fixture.html"), "x");
    const dirty = { root, ...gitInfo(root) };
    assert.equal(dirty.untrackedFiles, 1);
    assert.equal(dirty.dirtyTrackedFiles, 0);
    assert.match(wptPinProblems(dirty, head).join(";"), /1 untracked/);
    writeFileSync(join(root, "a.html"), "changed");
    assert.equal(gitInfo(root).dirtyTrackedFiles, 1);
    // A copy without .git placed inside another repository must not inherit that repo's HEAD.
    const nested = join(root, "copy");
    mkdirSync(nested);
    const inherited = { root: nested, ...gitInfo(nested) };
    assert.equal(inherited.commit, head, "git -C resolves the enclosing repository");
    assert.match(wptPinProblems(inherited, head)[0], /not its own git checkout/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("run id: only safe characters; a build without git is named by its source hash", () => {
  const dateIso = "2026-10-21T01:23:58.123Z";
  assert.equal(
    makeRunId({
      dateIso,
      engineId: "blitz-0.3.0-beta.4",
      velloraCommit: null,
      sourceHash: "abc1234ff",
    }),
    "20261021T012358Z-blitz-0.3.0-beta.4-vellora-nogit-abc1234",
  );
  const id = makeRunId({
    dateIso,
    engineId: "blitz x/y",
    velloraCommit: "fatal: no",
    sourceHash: null,
  });
  assert.match(id, /^[A-Za-z0-9._-]+$/);
  assert.equal(id.includes(":"), false);
  assert.equal(id.includes(" "), false);
});

test("update-expectations: refused for any partial run", () => {
  const defaultSuites = ["a", "b"];
  assert.equal(partialRunReason({ suites: ["b", "a"], defaultSuites }), null);
  assert.match(partialRunReason({ suites: ["a"], defaultSuites }), /suites differ/);
  assert.match(partialRunReason({ suites: ["a", "b"], defaultSuites, filter: /x/ }), /--filter/);
  assert.match(partialRunReason({ suites: ["a", "b"], defaultSuites, limit: 3 }), /--limit/);
});

const config = { raster: RASTER, inlineCss: true, chainReferences: false };
const expectations = (over = {}) => ({
  schema: 2,
  engine: "blitz-x",
  wptCommit: PIN,
  comparison: comparisonConfig(config),
  results: {},
  ...over,
});

test("ratchet: refused across WPT commits, schemas or comparison settings", () => {
  assert.equal(expectationsMismatch(expectations(), { wptCommit: PIN, config }), null);
  assert.match(
    expectationsMismatch(expectations({ schema: 1 }), { wptCommit: PIN, config }),
    /schema 1/,
  );
  assert.match(
    expectationsMismatch(expectations(), { wptCommit: "b".repeat(40), config }),
    /produced on WPT/,
  );
  assert.match(
    expectationsMismatch(expectations(), {
      wptCommit: PIN,
      config: { ...config, chainReferences: true },
    }),
    /comparison settings differ/,
  );
  assert.match(
    expectationsMismatch(expectations(), {
      wptCommit: PIN,
      config: { ...config, raster: { ...RASTER, tool: "pdftoppm" } },
    }),
    /comparison settings differ/,
  );
});

test("--chrome-from: refused from a run with other semantics (e.g. the pre-fix harness)", () => {
  const prior = (c) => ({ env: { wpt: { commit: PIN } }, config: c });
  assert.equal(
    chromeReuseMismatch(prior({ ...config, semantics: HARNESS_SEMANTICS }), {
      wptCommit: PIN,
      config,
    }),
    null,
  );
  assert.match(
    chromeReuseMismatch(prior({ raster: RASTER, inlineCss: true }), { wptCommit: PIN, config }),
    /harness semantics 1/,
  );
  assert.match(
    chromeReuseMismatch(prior({ ...config, semantics: HARNESS_SEMANTICS }), {
      wptCommit: "c".repeat(40),
      config,
    }),
    /WPT commit/,
  );
});

test("ratchet: pass-blank → fail is sight gained, pass → pass-blank is a regression", () => {
  const expected = expectations({
    results: {
      a: "pass",
      b: "fail",
      c: "unsupported",
      gone: "pass",
      blankThenFail: "pass-blank",
      blankThenPass: "pass-blank",
      passThenBlank: "pass",
      flaggedPass: "pass",
    },
    suspectPasses: { flaggedPass: "uncovered-glyphs,ink-missing-vs-chrome" },
  });
  const r = compareExpectations(expected, [
    { test: "a", outcome: "fail" },
    { test: "b", outcome: "pass" },
    { test: "c", outcome: "error" },
    { test: "new", outcome: "pass" },
    { test: "blankThenFail", outcome: "fail" },
    { test: "blankThenPass", outcome: "pass" },
    { test: "passThenBlank", outcome: "pass-blank" },
    { test: "flaggedPass", outcome: "fail" },
  ]);
  assert.deepEqual(r.counts, {
    regressions: 3,
    regressionsOfCleanPasses: 2,
    regressionsOfFlaggedPasses: 1,
    sightGained: 1,
    improvements: 2,
    changed: 1,
    added: 1,
    missing: 1,
    unchanged: 0,
  });
  assert.deepEqual(
    r.regressions.map((x) => x.test),
    ["a", "passThenBlank", "flaggedPass"],
  );
  assert.equal(r.regressions[2].expectedFlags, "uncovered-glyphs,ink-missing-vs-chrome");
  assert.deepEqual(r.sightGained, [
    { test: "blankThenFail", expected: "pass-blank", actual: "fail" },
  ]);
});

test("expectations: schema 2 stores comparison settings and suspect passes as strings", () => {
  const env = {
    engine: { id: "blitz-x", blitzDom: null },
    vellora: { commit: "f".repeat(40), sourceHash: "0".repeat(64) },
    wpt: { commit: PIN },
    date: "Wed Oct 21 00:00:00 UTC 2026",
  };
  const results = [
    { test: "z", outcome: "pass", prepare: { uncoveredCodepoints: 3, cssUrlResources: 1 } },
    { test: "y", outcome: "pass", prepare: {} },
    { test: "x", outcome: "pass-blank" },
  ];
  const doc = buildExpectations({
    results,
    env,
    suites: ["s"],
    command: "c",
    config,
    inkCheck: "not-run",
  });
  assert.equal(doc.schema, 2);
  assert.deepEqual(doc.comparison, comparisonConfig(config));
  assert.deepEqual(doc.results, { x: "pass-blank", y: "pass", z: "pass" });
  assert.deepEqual(doc.suspectPasses, { z: "uncovered-glyphs,css-url-resource" });
  assert.equal(expectationsMismatch(doc, { wptCommit: PIN, config }), null);
  assert.deepEqual(suspectFlags({ prepare: {}, inkCheck: { missingFrac: 0.5 } }), [
    "ink-missing-vs-chrome",
  ]);
  assert.deepEqual(
    suspectFlags({ prepare: {}, inkCheck: { missingFrac: 0.49, bboxShift: 8 } }),
    [],
  );
  // val-i2/val-i3 shape: right colours, 300 px away in both test and reference.
  assert.deepEqual(suspectFlags({ prepare: {}, inkCheck: { missingFrac: 0, bboxShift: 300 } }), [
    "ink-displaced-vs-chrome",
  ]);
});
