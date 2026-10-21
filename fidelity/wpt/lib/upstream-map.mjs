// crates.io Blitz version -> git commit -> Blitz's own published WPT run (DioxusLabs/
// blitz-wpt-results), so `run.mjs --upstream auto` works for a crates.io build (Cargo.lock then
// has no git rev). Every entry is CONFIRMED with the command recorded in `evidence`.
//
// Same-revision comparison: an upstream run uses ITS WPT revision, which is usually not our pin.
// To compare like for like, fetch that revision and run against it (no ratchet, results marked
// unpinned):
//   node fidelity/wpt/fetch-wpt.mjs --commit <wptRevisionFull> --dir fidelity/.cache/wpt-<short>
//   node fidelity/wpt/run.mjs --wpt fidelity/.cache/wpt-<short> --allow-unpinned --upstream auto
// `upstreamComparability()` states whether a given run is at the upstream run's revision.

export const BLITZ_RELEASES = Object.freeze({
  "0.3.0-beta.4": {
    tag: "v0.3.0-beta.4",
    tagObject: "560b324f8aff60a6b33ccabecb131583991fafc2",
    commit: "92b11f1bd8ab7975411328b0406a95a09445b4e7",
    upstreamRun: {
      productRevision: "23b9b26a9b6af5947b8f003d2c2cc768bff10b8a",
      date: "2026-10-16T13:01:42Z",
      wptRevision: "cd1d8aa5b",
      wptRevisionFull: "cd1d8aa5bfebc15d1af2af230c7ff95f9e582a4c",
      relation:
        "no upstream run is keyed by the tag commit 92b11f1; 23b9b26a9b ('Delete the bump crate') is 1 commit ahead of it and touches only apps/bump, Cargo.toml, Cargo.lock and justfile, no blitz-dom/blitz-html source (GitHub compare API). UNVERIFIED ASSUMPTION: the Cargo.lock change did not move a dependency the renderer uses.",
    },
    evidence: [
      "git ls-remote https://github.com/DioxusLabs/blitz 'refs/tags/v0.3.0-beta.4*' (2026-10-21): tag 560b324f…, peeled 92b11f1bd8ab…",
      "summary/runs.json of DioxusLabs/blitz-wpt-results (2026-10-21, 1203 runs): no product_revision 92b11f1…; 23b9b26a9b… at wpt_revision cd1d8aa5b",
      "GET api.github.com/repos/DioxusLabs/blitz/compare/92b11f1…23b9b26a9b: ahead_by 1, behind_by 0",
      "GET api.github.com/repos/web-platform-tests/wpt/commits/cd1d8aa5b: cd1d8aa5bfebc15d1af2af230c7ff95f9e582a4c",
    ],
  },
  "0.3.0-alpha.5": {
    tag: "v0.3.0-alpha.5",
    tagObject: "2f31893679cbbf1bce1210a62e5b9fbf571b2b85",
    commit: "a9905d22cb1be228e6b9e98418afe73b2276f145",
    upstreamRun: null,
    evidence: [
      "git ls-remote (2026-10-21). vellora's former pin is the git rev 2003ba5fc2d8 (not this tag); its upstream run is keyed by that rev directly (wpt_revision 8eaad6beb).",
    ],
  },
});

/**
 * Upstream report sha for an engine: the git rev when Cargo.lock has one, else the mapped run of
 * the crates.io version. Returns { sha, via, release } or null.
 */
export function upstreamShaFor(blitzDom) {
  if (blitzDom?.rev) return { sha: blitzDom.rev, via: "Cargo.lock git rev", release: null };
  const release = BLITZ_RELEASES[blitzDom?.version];
  if (release?.upstreamRun) {
    return {
      sha: release.upstreamRun.productRevision,
      via: `crates.io ${blitzDom.version} = tag ${release.tag} = ${release.commit.slice(0, 7)}; upstream run ${release.upstreamRun.productRevision.slice(0, 10)} (${release.upstreamRun.relation})`,
      release,
    };
  }
  return null;
}

/** Is our WPT tree at the upstream run's WPT revision? (prefix match: upstream records 9 hex.) */
export function upstreamComparability(ourWptCommit, upstreamWptRevision) {
  if (!upstreamWptRevision) return { sameWptRevision: null, note: "upstream WPT revision unknown" };
  const same = Boolean(ourWptCommit?.startsWith(upstreamWptRevision));
  return {
    sameWptRevision: same,
    note: same
      ? "same WPT revision: test files are identical on both sides"
      : `different WPT revision (ours ${ourWptCommit?.slice(0, 9)}, upstream ${upstreamWptRevision}): for a like-for-like cross-tab fetch the upstream revision (fetch-wpt.mjs --commit <full sha> --dir <dir>) and run with --wpt <dir> --allow-unpinned`,
  };
}
