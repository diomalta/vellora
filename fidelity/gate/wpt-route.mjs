// The (a) / (b) / (c) route of a WPT pass -> fail item (fidelity/ACCEPTANCE.md GATE-A3,
// 2026-10-22). Pure: no I/O.
//
// WPT items have no layer vector (gate/layer-vector.mjs works on layout-diff dumps of the corpus),
// so GATE-A1's (b) rule cannot be applied to them as written. Their route:
//   (a) the OLD pass was false: vellora's old test render equalled the reference but not Chrome,
//       by ink (the old record's Chrome ink check: ink-missing-vs-chrome / ink-displaced-vs-chrome)
//       or by page count (vellora's test or reference page count != Chrome's test page count) ->
//       a class-a acceptance of the step, with that record as evidence;
//   (b) a raw-Blitz render of the same test (no vellora pass: the raw-Blitz WPT mode,
//       phaseb/10-wptraw) fails the same way -> the loss is Blitz's, owner upstream: a DEBT.json
//       key `{ key: "wpt|<test>", tolClass: "count", headValue: "pass", ceiling: <outcome>,
//       measured: <outcome>, rawOutcome: <outcome> }` in an entry whose owner.layer is "blitz:*"
//       (gate/debt.mjs: no layer vector for such a key; GATE-D7 ties rawOutcome to the run);
//   (c) otherwise (raw Blitz passes, so a vellora layer broke the test; or no raw outcome was
//       recorded): blocks, like any (c) item.
//
// The field the rule reads (produced by the raw-Blitz WPT mode: wpt/run.mjs --raw, run-all.mjs
// --raw; merged on phaseb/10-integrate, 2026-10-22):
//   wpt/results.json  tests[i].rawOutcome   the raw-Blitz render's outcome with the SAME
//                                           comparison settings ("pass" | "fail" | "pass-blank"
//                                           | "error" | "timeout" | "unsupported")
//                     tests[i].rawComparisons (optional) the raw render's comparisons[] (same
//                                           shape as comparisons[]: pageCounts, maxDifference)
//   wpt/outcomes.json rawOutcomes: { <test>: outcome } (derived from results.json by
//                                           gate/snapshot.mjs expectationsFromResults when absent)
// "Fails the same way": rawOutcome equals the run's outcome and, when both record comparisons,
// the same page counts. An absent field is never (b).
import { WPT_INK_FLAGS } from "./tolerances.mjs";

/** Page-count evidence of an old results.json test record: why its pass was false, or null. */
export function falsePassByPageCount(oldRecord) {
  const v = oldRecord?.comparisons?.[0]?.pageCounts;
  const c = oldRecord?.chrome?.comparisons?.[0]?.pageCounts;
  if (!v || !c) return null;
  // Test and reference agreed (it passed) but vellora's test page count is not Chrome's.
  return v[0] !== c[0]
    ? `old test render ${v[0]} page(s) vs Chrome ${c[0]} (reference ${v[1] ?? "?"}): a false pass by page count`
    : null;
}

/**
 * Route of one WPT item. `item`: a compareWpt item (before, after, rawOutcome?, rawComparisons?,
 * afterComparisons?); `oldFlags`: the old pass's suspect flags; `oldRecord`: the old
 * results.json test record (page counts), or null. Returns { route: "a" | "b" | "c", why } for
 * a pass -> non-pass item, null for any other item.
 */
export function wptRoute(item, { oldFlags = [], oldRecord = null } = {}) {
  if (item.before !== "pass" || item.after === "pass" || item.after === undefined) return null;
  const ink = oldFlags.filter((f) => WPT_INK_FLAGS.includes(f));
  if (ink.length) {
    return { route: "a", why: `the old pass was false by ink: ${ink.join(", ")} vs Chrome` };
  }
  const pages = falsePassByPageCount(oldRecord);
  if (pages) return { route: "a", why: pages };
  const raw = item.rawOutcome;
  if (raw === undefined || raw === null) {
    return {
      route: "c",
      why: "no raw-Blitz outcome recorded (results.json tests[].rawOutcome): neither an artefact nor upstream debt",
    };
  }
  if (raw !== item.after) {
    return {
      route: "c",
      why: `raw Blitz ${raw}, vellora ${item.after}: ${raw === "pass" ? "a vellora layer broke the test" : "not the same failure"}`,
    };
  }
  const rp = item.rawComparisons?.[0]?.pageCounts;
  const vp = item.afterComparisons?.[0]?.pageCounts;
  if (rp && vp && JSON.stringify(rp) !== JSON.stringify(vp)) {
    return {
      route: "c",
      why: `raw Blitz also ${raw} but with page counts ${JSON.stringify(rp)} vs vellora ${JSON.stringify(vp)}: not the same failure`,
    };
  }
  return {
    route: "b",
    why: `a raw-Blitz render fails the same way (${raw}): owner upstream (blitz)`,
  };
}
