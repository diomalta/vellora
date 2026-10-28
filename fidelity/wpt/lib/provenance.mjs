// Provenance guards: a result is only comparable with another when it was produced from the same
// test files with the same comparison semantics. Everything here is pure (no I/O) so it can be
// unit-tested; run.mjs applies it.
import { realpathSync } from "node:fs";

/**
 * Version of the harness's comparison semantics. Bump it whenever a change can alter an outcome
 * for the same renderings (verdict rules, outcome taxonomy, page selection); results and
 * expectations from a different version are not comparable.
 *   1 — e47e77f: chained references followed; blank passes counted as `pass`.
 *   2 — wptrunner reference graph (no chaining by default); `pass-blank` outcome.
 */
export const HARNESS_SEMANTICS = 2;

function samePath(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

/**
 * Reasons the WPT checkout is not exactly the pinned commit (empty array when it is): no git
 * metadata of its own, a different HEAD, modified tracked files, or untracked files (e.g.
 * injected fixtures).
 */
export function wptPinProblems(wpt, expectedCommit) {
  const problems = [];
  if (!wpt.commit) {
    problems.push(`no git metadata (cannot prove it is ${expectedCommit})`);
    return problems;
  }
  if (wpt.toplevel && wpt.root && !samePath(wpt.toplevel, wpt.root)) {
    problems.push(
      `not its own git checkout (git resolves ${wpt.toplevel}, an enclosing repository)`,
    );
    return problems;
  }
  if (wpt.commit !== expectedCommit)
    problems.push(`HEAD ${wpt.commit} != pinned ${expectedCommit}`);
  if (wpt.dirtyTrackedFiles) problems.push(`${wpt.dirtyTrackedFiles} modified tracked file(s)`);
  if (wpt.untrackedFiles) problems.push(`${wpt.untrackedFiles} untracked file(s)`);
  return problems;
}

/** Run directory name: only [A-Za-z0-9._-] (a failed `git` call must never leak into a path). */
export function makeRunId({ dateIso, engineId, velloraCommit, sourceHash }) {
  const stamp = dateIso.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const build = velloraCommit
    ? velloraCommit.slice(0, 7)
    : `nogit-${(sourceHash ?? "unknown").slice(0, 7)}`;
  return `${stamp}-${engineId}-vellora-${build}`.replace(/[^A-Za-z0-9._-]+/g, "-");
}

/**
 * Why this run cannot (re)write the committed expectations, or null when it can: the default
 * suites must all run, unfiltered and unlimited, on the pinned WPT tree.
 */
export function partialRunReason({ suites, defaultSuites, filter, limit }) {
  if (filter) return "--filter selects a subset of the reftests";
  if (limit) return "--limit selects a subset of the reftests";
  const a = [...new Set(suites)].sort();
  const b = [...new Set(defaultSuites)].sort();
  if (a.length !== b.length || a.some((s, i) => s !== b[i])) {
    return "the suites differ from the default suites (suites.mjs DEFAULT_SUITES)";
  }
  return null;
}

/** The settings an outcome depends on besides the renderings themselves. */
export function comparisonConfig(config) {
  return {
    semantics: HARNESS_SEMANTICS,
    chainReferences: config.chainReferences === true,
    inlineCss: config.inlineCss !== false,
    raster: config.raster,
  };
}

/**
 * Why `expected` (an expectations document) cannot be ratcheted against the current run, or null.
 * The engine and vellora build may differ (that is the point of a ratchet); the test files and the
 * comparison semantics may not.
 */
export function expectationsMismatch(expected, { wptCommit, config, inkCheck }) {
  if (expected.schema !== 2) {
    return `expectations schema ${expected.schema ?? "?"} is not 2 (regenerate with --update-expectations)`;
  }
  if (expected.wptCommit !== wptCommit) {
    return `expectations were produced on WPT ${expected.wptCommit}, this run is on ${wptCommit}`;
  }
  const want = JSON.stringify(expected.comparison ?? null);
  const have = JSON.stringify(comparisonConfig(config));
  if (want !== have) return `comparison settings differ: expectations ${want}, run ${have}`;
  // Clean vs flagged passes depend on the Chrome ink data: a run without it (or with another
  // Chrome) would count every ink-flagged pass of the expectations as "clean" or vice versa.
  if (inkCheck !== undefined && (expected.inkCheck ?? "not-run") !== inkCheck) {
    return `inkCheck mismatch: expectations "${expected.inkCheck ?? "not-run"}", run "${inkCheck}" (run with --chrome or --chrome-from)`;
  }
  return null;
}

/** inkCheck label of a run, as stored in an expectations file. */
export function inkCheckLabel(inkCheck, browserVersion) {
  return inkCheck?.status === "ok" ? `chrome ${browserVersion}` : "not-run";
}

/** Same check for reusing Chrome outcomes from an earlier results.json (`--chrome-from`). */
export function chromeReuseMismatch(prior, { wptCommit, config }) {
  if (prior.env?.wpt?.commit !== wptCommit) {
    return `WPT commit ${prior.env?.wpt?.commit} != ${wptCommit}`;
  }
  const want = JSON.stringify(prior.config ? comparisonConfig(prior.config) : null);
  const have = JSON.stringify(comparisonConfig(config));
  if (prior.config?.semantics !== HARNESS_SEMANTICS) {
    return `harness semantics ${prior.config?.semantics ?? 1} != ${HARNESS_SEMANTICS}`;
  }
  if (want !== have) return `comparison settings differ: ${want} vs ${have}`;
  return null;
}
