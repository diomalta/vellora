// The gate's own detection canaries (gate/canaries.mjs): all caught on committed data, each one
// UNCAUGHT when the rule it guards is broken (the canary of the canary), and an uncaught canary is
// an absolute failure of the gate.
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { LAYER_VECTOR_CANARY_PACK, gateCanaryItems, runGateCanaries } from "../canaries.mjs";
import { compareSnapshots } from "../compare.mjs";
import { applyLedger, ledgerProblems, relaxedB, transitionProblems } from "../debt.mjs";
import { loadPack, packWordVectors } from "../layer-vector.mjs";
import { loadBaselineDir } from "../snapshot.mjs";
import { wptRoute } from "../wpt-route.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const seed = loadBaselineDir(join(baselines, "port", "00-start"));
const PASSES = [
  "auto_table_compact_columns",
  "painted_table_cell_text_baselines",
  "table_percent_widths",
];

const caughtBy = (rows) => Object.fromEntries(rows.map((r) => [r.canary, r.caught]));

test("every gate canary is caught on the committed chain head port/00-start (real seeds) and on synthetic seeds", () => {
  for (const run of [seed, null]) {
    const rows = runGateCanaries({ run, passes: PASSES });
    assert.equal(rows.length, 32);
    assert.ok(
      rows.every((r) => r.caught === true && r.ran === true && r.oracle === "gate"),
      JSON.stringify(rows.filter((r) => !r.caught)),
    );
    assert.deepEqual(gateCanaryItems(rows), []);
  }
  // The real seeds are real: a word, a failing WPT test, a flagged pass, a verdict row of the
  // head (port/00-start; until 2026-10-28 the seeds came from port/07-media-print, pruned).
  const rows = runGateCanaries({ run: seed, passes: PASSES });
  assert.match(rows[0].mustReport, /^real word /);
  assert.match(rows[1].mustReport, /^real test /);
  assert.match(rows[2].mustReport, /^real row /);
  assert.match(rows[4].mustReport, /^real flagged pass /);
});

test("a comparator that hides within-tolerance worsening (the D4 hole) leaves the head canary uncaught", () => {
  const hiding = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return { ...r, items: r.items.filter((i) => i.class !== "within-tolerance") };
  };
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, compare: hiding }));
  assert.equal(c["head ratchet: |dy| +0.6 pt per step over two steps"], false);
});

test("a comparator that treats fail -> unsupported as 'changed' (the D5 hole) leaves the WPT canary uncaught", () => {
  const old = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return {
      ...r,
      items: r.items.map((i) =>
        i.class === "rejection" && i.check === "wpt"
          ? { ...i, class: "changed", gating: false }
          : i,
      ),
    };
  };
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, compare: old }));
  assert.equal(c["WPT fail -> unsupported (new strict-gate rejection)"], false);
  assert.equal(c["head ratchet: |dy| +0.6 pt per step over two steps"], true);
});

test("a comparator that does not count flagged-pass losses (D6) leaves its canary uncaught", () => {
  const uncounted = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return { ...r, counts: { ...r.counts, flaggedPassLost: 0 } };
  };
  const c = caughtBy(runGateCanaries({ run: seed, compare: uncounted }));
  assert.equal(c["WPT flagged pass lost"], false);
});

test("a ledger that ignores ceilings, compensators, transitions, owners, collapse or relaxed (b) leaves those canaries uncaught", () => {
  const noCeiling = (hr, l, o) => {
    const r = applyLedger(hr, l, o);
    return {
      ...r,
      items: r.items.map((i) =>
        i.class === "debt-exceeded" ? { ...i, class: "debt", gating: false } : i,
      ),
    };
  };
  const noRegate = (hr, l, o) => applyLedger(hr, l, { ...o, passes: null });
  const c1 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, apply: noCeiling }));
  assert.equal(c1["DEBT rules i/ii: uncovered, within ceiling, beyond ceiling"], false);
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, apply: noRegate }));
  assert.equal(c2["DEBT rule v: compensator pass deleted"], false);
  const c3 = caughtBy(
    runGateCanaries({
      run: seed,
      transition: (o, n, x) => transitionProblems(o, n, x).filter((p) => !/ceiling/.test(p)),
    }),
  );
  assert.equal(c3["DEBT rule iii: ceiling raised, entry added, entry dropped early"], false);
  const c4 = caughtBy(
    runGateCanaries({
      run: seed,
      ledgerCheck: (l, o) => ledgerProblems(l, o).filter((p) => !/closesAt|rule vi/.test(p)),
    }),
  );
  assert.equal(c4["DEBT rule iv: vellora-owned entry without a retirement step"], false);
  assert.equal(c4["DEBT rule vi: displaced words not collapsed"], false);
  const c5 = caughtBy(
    runGateCanaries({
      run: seed,
      relaxed: (e) => relaxedB(e).filter((p) => !/\|run\||\|P\|/.test(p)),
    }),
  );
  assert.equal(c5["relaxed (b): |run| > |N0|, unnamed compensator, no owner"], false);
});

test("a layer-vector tool that ignores the mapping or the pass layers leaves its canaries uncaught", () => {
  // A tool that always reports the control's mapping check, and one that drops pass layers.
  const control = packWordVectors(loadPack(LAYER_VECTOR_CANARY_PACK)).mapping;
  const stuck = (p) => ({ ...packWordVectors(p), mapping: control });
  const c1 = caughtBy(runGateCanaries({ vectors: stuck }));
  assert.equal(c1["layer-vector: word mapping misaligned by three fragments"], false);
  const passBlind = (p) => {
    const q = structuredClone(p);
    q.diff.layers = q.diff.layers.filter((l) => l.kind !== "pass");
    return packWordVectors(q);
  };
  const c2 = caughtBy(runGateCanaries({ vectors: passBlind }));
  assert.equal(c2["layer-vector: planted +3 px pass step"], false);
});

test("a comparator that scores pdf-probe words by |after| - |before| only (the I1 hole) leaves the crossing canary uncaught", () => {
  // The pre-I1 rule: a move through Chrome is judged by the magnitude change alone.
  const magnitudeOnly = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    const items = r.items.map((i) => {
      if (i.check !== "pdf-probe" || typeof i.before !== "number" || typeof i.after !== "number") {
        return i;
      }
      const d = Math.abs(i.after) - Math.abs(i.before);
      if (d > i.tol) return { ...i, class: "regression", gating: true };
      if (d < -i.tol) return { ...i, class: "improvement", gating: false };
      return null;
    });
    return {
      ...r,
      items: items.filter(Boolean),
      counts: { ...r.counts, withinToleranceBetter: 1 },
    };
  };
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, compare: magnitudeOnly }));
  assert.equal(c["pdf-probe: a word crosses Chrome (I1)"], false);
  // The sign-agnostic formula (|moved| > tol and |after| > tol) gates the same-side control.
  const signAgnostic = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return {
      ...r,
      items: r.items.map((i) =>
        i.check === "pdf-probe" &&
        typeof i.moved === "number" &&
        Math.abs(i.moved) > i.tol &&
        Math.abs(i.after) > i.tol
          ? { ...i, class: "regression", gating: true }
          : i,
      ),
    };
  };
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, compare: signAgnostic }));
  assert.equal(c2["pdf-probe: a word crosses Chrome (I1)"], false);
});

test("a gate that skips rule iii without --debt-base (the I2 hole) leaves its canary uncaught", () => {
  // The pre-I2 behaviour: no --debt-base, no base ledger, rule iii never runs.
  const skip = () => ({ ledger: undefined, source: null, refusal: null });
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, resolveBase: skip }));
  assert.equal(c["DEBT rule iii without --debt-base (I2)"], false);
});

test("a ledger transition without GATE-D7 (the I3 hole: a ceiling of 99 passed) leaves its canary uncaught", () => {
  const noD7 = (o, n, x) => transitionProblems(o, n, x).filter((m) => !/GATE-D7/.test(m));
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: noD7 }));
  assert.equal(c["GATE-D7: new ledger key tied to the measured value (I3)"], false);
});

test("a head comparison that sees only the current step's declarations (the I4 hole) leaves its canary uncaught", () => {
  const currentOnly = ({ current = [] }) => current;
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, carry: currentOnly }));
  assert.equal(c["declared rejection carried to the head comparison (I4)"], false);
});

test("a comparator that ratchets only the COUNT of missing tokens (the step-08 hole) leaves the set canary uncaught", () => {
  const countOnly = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return { ...r, items: r.items.filter((i) => !i.key.includes("|missingTokens.")) };
  };
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, compare: countOnly }));
  assert.equal(c["EXT-2 missing-token set: one token swapped for another"], false);
});

test("a comparator blind to off-page words (the step-08 hole) leaves the off-page canary uncaught", () => {
  const blind = (b, a, o) => {
    const r = compareSnapshots(b, a, o);
    return { ...r, items: r.items.filter((i) => !/\|off-page/.test(i.key)) };
  };
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, compare: blind }));
  assert.equal(c["pdf-probe: a word moved below the page (off-page)"], false);
});

test("a WPT route that ignores the raw-Blitz outcome, or trusts a missing one, leaves the GATE-A3 canary uncaught", () => {
  const ignoreRaw = (item, o) => {
    const r = wptRoute({ ...item, rawOutcome: null }, o);
    return r?.route === "c" ? { ...r, route: "c" } : r;
  };
  const c1 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, route: ignoreRaw }));
  assert.equal(c1["WPT pass -> fail route (GATE-A3)"], false);
  const trustMissing = (item, o) =>
    wptRoute({ ...item, rawOutcome: item.rawOutcome ?? item.after }, o);
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, route: trustMissing }));
  assert.equal(c2["WPT pass -> fail route (GATE-A3)"], false);
});

test("a listed page scope that ignores the run's page delta, covers page 1, or skips its D7 leaves the rule vi' canary uncaught", () => {
  const name = "DEBT rule vi': listed page scope on an unchanged page metric (rule i, 2026-10-27)";
  const mapEntries = (l, f) => ({ ...l, entries: l.entries.map((e) => (e.scope ? f(e) : e)) });
  // The pre-rule-(i) bound: an unlisted scope covers its pages whatever the metric reads now.
  const unbound = (hr, l, o) =>
    applyLedger(
      hr,
      mapEntries(l, (e) => ({
        ...e,
        scope: { fixture: e.scope.fixture, fromPage: e.scope.fromPage },
      })),
      { ...o, pageValues: null },
    );
  const c1 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, apply: unbound }));
  assert.equal(c1[name], false);
  // A scope that also lists the page-1 word hides it.
  const p1 = "pdf-probe|canary|p1|Canary#1|dy";
  const allPages = (hr, l, o) =>
    applyLedger(
      hr,
      mapEntries(l, (e) => ({
        ...e,
        scope: { ...e.scope, fromPage: 1, keys: [...e.scope.keys, p1] },
      })),
      o,
    );
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, apply: allPages }));
  assert.equal(c2[name], false);
  // A D7 that does not tie the page metric to the snapshots (a moved metric or slack passes).
  const looseD7 = (o, n, x) => transitionProblems(o, n, x).filter((p) => !/pageDelta/.test(p));
  const c3 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: looseD7 }));
  assert.equal(c3[name], false);
});

test("a listed page scope that binds a moved page metric or starts at page 1 leaves the GATE-D6b shape canary uncaught", () => {
  const name = "DEBT rule vi': a listed page scope binds no moved page metric and no page-1 word";
  // The pre-fix D7 (verify 10-final): a moved page metric entered through d7KeyProblems alone.
  const movedOk = (o, n, x) =>
    transitionProblems(o, n, x).filter((p) => !/the page metric is a head item/.test(p));
  const c1 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: movedOk }));
  assert.equal(c1[name], false);
  // The pre-fix shape check: any fromPage.
  const anyFrom = (l, o) =>
    ledgerProblems(l, o).filter((p) => !/a listed page scope starts at a page >= 2/.test(p));
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, ledgerCheck: anyFrom }));
  assert.equal(c2[name], false);
});

test("a relaxed (b) rule without |P| <= |N0| + step, without |run| <= |N0| + run tolerance, or with the old 0.5 px leaves the rule (ii) canary uncaught", () => {
  const name = "rule (ii): shared run tolerance on a DANFE-L1 position-mm vector";
  const noP = (e) => relaxedB(e).filter((p) => !/\|P\|/.test(p));
  const noRun = (e) => relaxedB(e).filter((p) => !/\|run\|/.test(p));
  const c1 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, relaxed: noP }));
  assert.equal(c1[name], false);
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, relaxed: noRun }));
  assert.equal(c2[name], false);
  // The pre-rule-(ii) position-mm run tolerance (0.5 px) refuses DANFE-L1d as measured.
  const beyondOld = (k) =>
    k.tolClass === "position-mm" && Math.abs(k.layerVector.run) > Math.abs(k.layerVector.N0) + 0.5;
  const old = (e) => [...relaxedB(e), ...(e.keys.some(beyondOld) ? ["|run| beyond 0.5 px"] : [])];
  const c3 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, relaxed: old }));
  assert.equal(c3[name], false);
});

test("an uncaught gate canary becomes an absolute failure item", () => {
  const items = gateCanaryItems([
    { oracle: "gate", canary: "x", mustReport: "m", observed: "o", caught: false, ran: true },
  ]);
  assert.deepEqual(
    items.map((i) => [i.key, i.class, i.gating]),
    [["canary|gate|x", "failure", true]],
  );
});

// Phase C 03 (2026-10-27): rule iii removals and ids (verify phasec/02 finding 1).
test("a transition that removes a still-failing key leaves its canary uncaught", () => {
  const lax = (o, n, x) => transitionProblems(o, n, x).filter((p) => !/still fails/.test(p));
  const c = caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: lax }));
  assert.equal(c["DEBT rule iii: a still-failing key removed"], false);
  assert.equal(c["DEBT rule iii: a fixed key removed with evidence"], true);
});

test("a transition that refuses every fixed removal, or accepts one without its run id, leaves its canary uncaught", () => {
  const old = (o, n, x) => [
    ...transitionProblems(o, n, x),
    ...(n?.closed ?? []).filter((r) => r.fixed).map((r) => `${r.id} ${r.key}: only a vanished key`),
  ];
  const c1 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: old }));
  assert.equal(c1["DEBT rule iii: a fixed key removed with evidence"], false);
  const noRunId = (o, n, x) => transitionProblems(o, n, x).filter((p) => !/runId/.test(p));
  const c2 = caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: noRunId }));
  assert.equal(c2["DEBT rule iii: a fixed key removed with evidence"], false);
});

test("a ledger that allows a reused id, a re-entered closed key or a lost closed record leaves its canary uncaught", () => {
  const name = "DEBT rule iii: an id reused";
  for (const re of [/id reused/, /append-only/]) {
    const lax = (o, n, x) => transitionProblems(o, n, x).filter((p) => !re.test(p));
    assert.equal(
      caughtBy(runGateCanaries({ run: seed, passes: PASSES, transition: lax }))[name],
      false,
    );
  }
  const reenter = (l, o) => ledgerProblems(l, o).filter((p) => !/re-enters/.test(p));
  assert.equal(
    caughtBy(runGateCanaries({ run: seed, passes: PASSES, ledgerCheck: reenter }))[name],
    false,
  );
});
