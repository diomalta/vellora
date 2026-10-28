// WPT per-test ratchet for the gate. Pure: no I/O.
//
// Rules (fidelity/ACCEPTANCE.md WPT-2, DESIGN TARGET):
// - A CLEAN pass of the baseline (pass with no suspect flag) that is no longer a pass GATES.
// - A clean pass that is still a pass but now carries a suspect flag GATES ("clean -> suspect"):
//   with equal inputs only the Chrome ink flags can appear, and they mean vellora's rendering lost
//   or moved Chrome's ink, i.e. test and reference may now lose the same content.
// - A FLAGGED pass of the baseline that is lost is REPORTED, not gated (the pass was never proven).
// - A test that rendered (pass, pass-blank, fail, unsupported) and now errors or times out GATES
//   (robustness: a new panic/crash is never a fidelity trade-off).
// - A test of the baseline missing from the run GATES (never silently absent).
// - A test that rendered and is now "unsupported" (a NEW strict-gate rejection) is a "rejection":
//   it GATES unless the step declares it (declaredRejections: feature, reason, evidence; matched
//   in compare.mjs). The run's `unsupportedFeatures` map, when present, names the feature (D5:
//   before, fail -> unsupported was a non-gating "changed" and hid 10 failing tests at step 06).
// - Comparison is refused unless the WPT commit, the comparison settings and the ink data
//   (`inkCheck`, i.e. which Chrome produced the flags) are identical: otherwise "clean" means
//   different things on the two sides.
import { WPT_BROKEN, WPT_INK_FLAGS } from "./tolerances.mjs";

const flagsOf = (doc, test) => (doc.suspectPasses?.[test] ?? "").split(",").filter(Boolean);

/** Why two expectation documents cannot be ratcheted against each other, or null. */
export function wptComparability(before, after) {
  if (!before || !after) return null;
  if (before.schema !== 2 || after.schema !== 2) {
    return `expectations schema ${before.schema}/${after.schema} (2 required)`;
  }
  if (before.wptCommit !== after.wptCommit) {
    return `WPT commit differs: baseline ${before.wptCommit}, run ${after.wptCommit}`;
  }
  const a = JSON.stringify(before.comparison ?? null);
  const b = JSON.stringify(after.comparison ?? null);
  if (a !== b) return `comparison settings differ: baseline ${a}, run ${b}`;
  if ((before.inkCheck ?? "not-run") !== (after.inkCheck ?? "not-run")) {
    return `inkCheck mismatch: baseline "${before.inkCheck ?? "not-run"}", run "${after.inkCheck ?? "not-run"}" (clean/flagged passes are only comparable with ink data from the same Chrome; pass --chrome-from or --wpt-chrome)`;
  }
  if (!String(after.inkCheck ?? "").startsWith("chrome ")) {
    return `the run has no Chrome ink data (inkCheck "${after.inkCheck ?? "not-run"}"): a gating WPT comparison needs --wpt-chrome or --chrome-from`;
  }
  return null;
}

/** Longest suite path that prefixes the test (for per-directory tables). */
export function suiteOf(test, suites) {
  let best = "";
  for (const s of suites ?? []) {
    if ((test === s || test.startsWith(`${s}/`)) && s.length > best.length) best = s;
  }
  return best || test.split("/").slice(0, 2).join("/");
}

/**
 * Compare two schema-2 expectation documents. Returns { comparable, reason, items, perSuite }.
 * Items: { key, test, class, gating, before, after, detail }; unchanged tests are only counted.
 */
export function compareWpt(before, after) {
  const reason = wptComparability(before, after);
  if (reason) return { comparable: false, reason, items: [], perSuite: {}, unchanged: 0 };
  const suites = after.suites ?? before.suites ?? [];
  const items = [];
  const perSuite = {};
  const bump = (suite, field) => {
    perSuite[suite] ??= { cleanBefore: 0, cleanAfter: 0, passBefore: 0, passAfter: 0 };
    perSuite[suite][field]++;
  };
  let unchanged = 0;
  const tests = new Set([...Object.keys(before.results), ...Object.keys(after.results)]);
  for (const test of [...tests].sort()) {
    const was = before.results[test];
    const now = after.results[test];
    const fb = flagsOf(before, test);
    const fa = flagsOf(after, test);
    const suite = suiteOf(test, suites);
    if (was === "pass") bump(suite, "passBefore");
    if (now === "pass") bump(suite, "passAfter");
    if (was === "pass" && !fb.length) bump(suite, "cleanBefore");
    if (now === "pass" && !fa.length) bump(suite, "cleanAfter");
    // rawOutcome: the raw-Blitz render's outcome of the run (gate/wpt-route.mjs, GATE-A3), or null.
    const base = {
      key: `wpt|${test}`,
      test,
      suite,
      before: was,
      after: now,
      rawOutcome: after.rawOutcomes?.[test] ?? null,
    };
    const describe = (o, f) =>
      o === "pass" && f.length ? `pass[${f.join(",")}]` : (o ?? "absent");
    const detail = `${describe(was, fb)} -> ${describe(now, fa)}`;
    if (was === undefined) {
      items.push({ ...base, class: "added", gating: false, detail });
    } else if (now === "unsupported" && was !== "unsupported" && was !== "skip") {
      const feature = after.unsupportedFeatures?.[test] ?? null;
      items.push({
        ...base,
        class: "rejection",
        gating: true,
        feature,
        cleanPassLost: was === "pass" && !fb.length,
        detail: `${detail} (new strict-gate rejection${feature ? `: ${feature}` : ", feature not recorded"}${was === "pass" ? (fb.length ? "; was a flagged pass" : "; was a CLEAN pass") : ""})`,
      });
    } else if (now === undefined) {
      items.push({
        ...base,
        class: "removed",
        gating: true,
        detail: `${detail} (test missing from the run)`,
      });
    } else if (was === "pass" && now !== "pass") {
      items.push({
        ...base,
        class: fb.length ? "reported" : "regression",
        gating: fb.length === 0,
        detail: `${detail}${fb.length ? " (flagged pass: reported, not gated)" : " (clean pass lost)"}`,
      });
    } else if (was === "pass" && now === "pass" && !fb.length && fa.length) {
      const ink = fa.some((f) => WPT_INK_FLAGS.includes(f));
      items.push({
        ...base,
        class: "regression",
        gating: true,
        detail: `${detail} (clean pass became suspect${ink ? ": vellora lost/moved Chrome's ink" : ""})`,
      });
    } else if (was !== "pass" && now === "pass") {
      items.push({
        ...base,
        class: "improvement",
        gating: false,
        detail: `${detail}${fa.length ? " (flagged)" : " (clean)"}`,
      });
    } else if (was === "pass" && now === "pass" && fb.length && !fa.length) {
      items.push({
        ...base,
        class: "improvement",
        gating: false,
        detail: `${detail} (flags cleared)`,
      });
    } else if (!WPT_BROKEN.includes(was) && was !== "skip" && WPT_BROKEN.includes(now)) {
      items.push({ ...base, class: "regression", gating: true, detail: `${detail} (new ${now})` });
    } else if (was !== now) {
      items.push({ ...base, class: "changed", gating: false, detail });
    } else {
      unchanged++;
    }
  }
  return { comparable: true, reason: null, items, perSuite, unchanged };
}

/** Crashtest ratchet: { results: { test: "ok" | "panic" | "crash" | "timeout" | "error" | "skip" } }. */
export function compareCrashtests(before, after, bad) {
  const items = [];
  let unchanged = 0;
  const tests = new Set([
    ...Object.keys(before.results ?? {}),
    ...Object.keys(after.results ?? {}),
  ]);
  for (const test of [...tests].sort()) {
    const was = before.results?.[test];
    const now = after.results?.[test];
    const base = {
      key: `wpt-crash|${test}`,
      test,
      before: was,
      after: now,
      detail: `${was ?? "absent"} -> ${now ?? "absent"}`,
    };
    if (was === undefined) items.push({ ...base, class: "added", gating: bad.includes(now) });
    else if (now === undefined) items.push({ ...base, class: "removed", gating: true });
    else if (was === now) unchanged++;
    else if (bad.includes(now) && !bad.includes(was))
      items.push({ ...base, class: "regression", gating: true });
    else if (bad.includes(was) && !bad.includes(now))
      items.push({ ...base, class: "improvement", gating: false });
    else items.push({ ...base, class: "changed", gating: false });
  }
  return { items, unchanged };
}
