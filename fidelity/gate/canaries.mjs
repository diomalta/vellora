import { join } from "node:path";
// Detection canaries of the gate's own rules (fidelity/README.md: an oracle is trusted only after
// it has caught a deliberately broken input). gate/run.mjs runs them on EVERY gate evaluation,
// planted into the snapshots being compared (a real pdf-probe word, a real failing WPT test, a
// real verdict row, the run's real pass list), and an uncaught canary is an absolute failure of
// the gate (GATE-K1, same row shape as fidelity/oracles/lib/canaries.mjs: { oracle, canary,
// mustReport, observed, caught, ran }). Self-tests: gate/test/canaries.test.mjs, which also shows
// that a broken comparator or ledger makes the canaries uncaught.
import { compareSnapshots } from "./compare.mjs";
import {
  DEBT_REPO_PATH,
  applyLedger,
  emptyLedger,
  ledgerProblems,
  relaxedB,
  resolveLedgerBase,
  transitionProblems,
} from "./debt.mjs";
import { mergeChainDeclarations } from "./declarations.mjs";
import { DOC_AGGREGATE_TOLERANCE, evaluateDocAggregate } from "./doc-aggregate.mjs";
import { PACK_DIR, loadPack, packWordVectors, relaxedBFacts } from "./layer-vector.mjs";
import { wptRoute } from "./wpt-route.mjs";

/** The committed layer-vector input the tool canaries plant into (notification, step 07 run). */
export const LAYER_VECTOR_CANARY_PACK = join(PACK_DIR, "notification-07.layer-vector-pack.json.gz");

export const GATE_CANARY_ORACLE = "gate";
const FEATURE = "canary:planted-rejection";
const clone = (v) => structuredClone(v);

/** Minimal snapshot around one section (the same shape gate/snapshot.mjs loads). */
const snap = (extra) => ({
  source: { kind: "canary", schema: "canary" },
  integrity: { ok: true, checked: 0, problems: [] },
  fixtures: [],
  wpt: { expectations: null },
  crashtests: null,
  pdfProbe: null,
  canaries: null,
  codeChecks: null,
  steps: [],
  ...extra,
});

const v2Section = (doc) =>
  doc && Object.values(doc).find((s) => s?.semantics === 2 && s.pairs?.length);

/** One real v2 pdf-probe section and word to plant into (synthetic stand-in when none). */
function probeSeed(run) {
  for (const [fixture, s] of Object.entries(run?.pdfProbe ?? {})) {
    if (s?.semantics === 2 && s.pairs?.length)
      return { fixture, section: s, pair: s.pairs[0], real: true };
  }
  const pair = { k: "p1|Canary#1", text: "Canary", page: 1, dx: 0, dy: 0.1 };
  const section = {
    semantics: 2,
    settings: { canary: true },
    reference: { chromeWordsSha256: "canary" },
    pages: { vellora: 1, chrome: 1 },
    words: { paired: 1, unpairedChrome: 0, unpairedVellora: 0 },
    pairs: [pair],
    unpairedChrome: [],
    unpairedVellora: [],
  };
  return { fixture: "canary", section, pair, real: false };
}

/** The seed section with only `pair` and its dy replaced. */
function withDy(seed, dy) {
  const s = clone(seed.section);
  s.pairs = [{ ...seed.pair, dy }];
  return { [seed.fixture]: s };
}

/** The creep scenario: head |dy| d, previous link d + 0.6, run d + 1.2 (each step < 1 pt). */
function creep(seed, compare) {
  const d = Math.abs(seed.pair.dy);
  const head = snap({ pdfProbe: withDy(seed, d) });
  const prev = snap({ pdfProbe: withDy(seed, d + 0.6) });
  const run = snap({ pdfProbe: withDy(seed, d + 1.2) });
  const key = `pdf-probe|${seed.fixture}|${seed.pair.k}|dy`;
  return { key, d, prevReport: compare(prev, run), headReport: compare(head, run) };
}

/** A debt/2 entry with one key (`keyExtra` overrides the key record: tolClass, layerVector...). */
const entryFor = (key, ceiling, extra = {}, keyExtra = {}) => {
  const layerVectorRef = keyExtra.layerVectorRef ?? {
    unit: "px",
    N0: 2,
    B0: 2,
    L0: 2,
    P: 1,
    run: 1,
  };
  return {
    id: "CANARY-1",
    class: "b",
    closesAt: "99-canary",
    owner: { layer: "blitz:canary", component: "canary" },
    compensators: ["P"],
    introducedBy: "99-canary",
    evidence: ["gate canary"],
    ...extra,
    keys: [
      {
        key,
        tolClass: "pdf-probe-pt",
        headValue: 0,
        ceiling,
        measured: ceiling,
        ...keyExtra,
        layerVectorRef,
        layerVector: layerVectorRef,
      },
    ],
  };
};

function row(canary, mustReport, observed, caught) {
  return { oracle: GATE_CANARY_ORACLE, canary, mustReport, observed, caught, ran: true };
}

/** A real failing WPT test of the run's expectations (synthetic doc when none). */
function wptSeed(run, outcome) {
  const e = run?.wpt?.expectations;
  if (e?.results) {
    const flagged = e.suspectPasses ?? {};
    const test = Object.keys(e.results).find((t) =>
      outcome === "flagged" ? e.results[t] === "pass" && flagged[t] : e.results[t] === outcome,
    );
    if (test) return { doc: e, test, real: true };
  }
  const test = "canary/planted.html";
  const doc = {
    schema: 2,
    wptCommit: "canary",
    comparison: { canary: true },
    inkCheck: "chrome canary",
    suites: ["canary"],
    results: { [test]: outcome === "flagged" ? "pass" : outcome },
    suspectPasses: outcome === "flagged" ? { [test]: "ink-missing-vs-chrome" } : {},
  };
  return { doc, test, real: false };
}

/** A real measured, not-rejected verdict row of the run (synthetic when none). */
function rowSeed(run) {
  for (const f of run?.fixtures ?? []) {
    const v = (f.verdicts ?? []).find(
      (x) =>
        (x.status === "PASS" || x.status === "FAIL") &&
        !/strict gate rejected/i.test(String(x.value)),
    );
    if (v) return { fixture: { ...f, verdicts: [v] }, real: true };
  }
  return {
    fixture: {
      key: "canary",
      fixture: "canary",
      class: "canary",
      diagnostic: false,
      layoutDiff: { status: "not-run" },
      verdicts: [
        {
          criterion: "CANARY-1",
          oracle: "corpus",
          status: "PASS",
          value: "1 (expected 1)",
          kind: "criterion",
        },
      ],
    },
    real: false,
  };
}

const gatingOf = (r) => r.items.filter((i) => i.gating);

/**
 * Run every gate canary. `run`: the snapshot being gated (seeds are taken from it); `passes`: the
 * run's layout_normalize passes. The rule implementations are injectable so the self-test can
 * prove that a broken rule leaves its canary uncaught.
 */
export function runGateCanaries({
  run = null,
  passes = null,
  compare = compareSnapshots,
  apply = applyLedger,
  transition = transitionProblems,
  ledgerCheck = ledgerProblems,
  relaxed = relaxedB,
  vectors = packWordVectors,
  pack = LAYER_VECTOR_CANARY_PACK,
  resolveBase = resolveLedgerBase,
  carry = mergeChainDeclarations,
  route = wptRoute,
  docAggregate = null,
  docRule = evaluateDocAggregate,
} = {}) {
  const rows = [];
  const seed = probeSeed(run);
  const src = seed.real ? `real word ${seed.fixture} ${seed.pair.k}` : "synthetic word";

  // 1. D4: two sub-tolerance steps the previous-link gate cannot see, the head ratchet must.
  {
    const c = creep(seed, compare);
    const prev = c.prevReport.items.find((i) => i.key === c.key);
    const head = c.headReport.items.find((i) => i.key === c.key);
    const ledgerItems = apply(c.headReport, emptyLedger(), { passes }).items;
    const caught =
      prev?.class === "within-tolerance" &&
      prev.gating === false &&
      head?.class === "regression" &&
      head.gating === true &&
      ledgerItems.some((i) => i.key === c.key && i.class === "head-regression" && i.gating);
    rows.push(
      row(
        "head ratchet: |dy| +0.6 pt per step over two steps",
        `${src}: vs previous link within-tolerance (listed, not gating); vs head regression; no DEBT entry -> head-regression`,
        `previous ${prev?.class ?? "none"}; head ${head?.class ?? "none"}; ledger ${ledgerItems.map((i) => i.class).join(",") || "none"}`,
        caught,
      ),
    );
  }

  // 2. D5: a test that failed is now unsupported.
  {
    const w = wptSeed(run, "fail");
    const after = clone(w.doc);
    after.results[w.test] = "unsupported";
    after.unsupportedFeatures = { ...(after.unsupportedFeatures ?? {}), [w.test]: FEATURE };
    const b = snap({ wpt: { expectations: w.doc } });
    const a = snap({ wpt: { expectations: after } });
    const raw = compare(b, a).items.find((i) => i.key === `wpt|${w.test}`);
    const declared = compare(b, a, {
      declared: [{ feature: FEATURE, reason: "canary", evidence: "canary" }],
    }).items.find((i) => i.key === `wpt|${w.test}`);
    rows.push(
      row(
        "WPT fail -> unsupported (new strict-gate rejection)",
        `${w.real ? "real" : "synthetic"} test ${w.test}: gating rejection; declared with its feature -> declared`,
        `undeclared ${raw?.class}/${raw?.gating}; declared ${declared?.class}/${declared?.gating}`,
        raw?.class === "rejection" &&
          raw.gating === true &&
          declared?.class === "declared" &&
          !declared.gating,
      ),
    );
  }

  // 3 + 4. D5 for verdict rows: "strict gate rejected" and measured -> NOT-RUN.
  {
    const r = rowSeed(run);
    const v = r.fixture.verdicts[0];
    const b = snap({ fixtures: [r.fixture] });
    const rejected = snap({
      fixtures: [
        {
          ...r.fixture,
          verdicts: [{ ...v, status: "FAIL", value: `strict gate rejected: ${FEATURE}` }],
        },
      ],
    });
    const notRun = snap({
      fixtures: [
        { ...r.fixture, verdicts: [{ ...v, status: "NOT-RUN", value: "canary: not run" }] },
      ],
    });
    const rej = gatingOf(compare(b, rejected)).filter((i) => i.check === "status");
    const nr = gatingOf(compare(b, notRun)).filter((i) => i.check === "status");
    const label = `${r.real ? "real" : "synthetic"} row ${r.fixture.key} ${v.criterion} ${v.oracle}`;
    rows.push(
      row(
        "verdict row -> strict gate rejected",
        `${label}: gating rejection with its feature`,
        rej.map((i) => `${i.class}:${i.feature}`).join(",") || "nothing gated",
        rej.length === 1 && rej[0].class === "rejection" && rej[0].feature === FEATURE,
      ),
    );
    rows.push(
      row(
        "verdict row measured -> NOT-RUN",
        `${label}: gating regression`,
        nr.map((i) => i.class).join(",") || "nothing gated",
        nr.length === 1 && nr[0].class === "regression",
      ),
    );
  }

  // 5. D6: a lost flagged pass is reported, counted, and does not gate.
  {
    const w = wptSeed(run, "flagged");
    const after = clone(w.doc);
    after.results[w.test] = "fail";
    const r = compare(
      snap({ wpt: { expectations: w.doc } }),
      snap({ wpt: { expectations: after } }),
    );
    const i = r.items.find((x) => x.key === `wpt|${w.test}`);
    rows.push(
      row(
        "WPT flagged pass lost",
        `${w.real ? "real" : "synthetic"} flagged pass ${w.test}: reported, not gating, counts.flaggedPassLost 1`,
        `${i?.class}/${i?.gating}; flaggedPassLost ${r.counts.flaggedPassLost}; verdict ${r.verdict}`,
        i?.class === "reported" &&
          i.gating === false &&
          r.counts.flaggedPassLost === 1 &&
          r.verdict === "PASS",
      ),
    );
  }

  // 6. Rules i and ii on the creep scenario.
  {
    const c = creep(seed, compare);
    const v = c.d + 1.2;
    const ledger = (ceiling) => ({ ...emptyLedger(), entries: [entryFor(c.key, ceiling)] });
    const cls = (l) => apply(c.headReport, l, { passes }).items.find((i) => i.key === c.key);
    const none = cls(emptyLedger());
    const within = cls(ledger(v));
    const beyond = cls(ledger(v - 0.5));
    rows.push(
      row(
        "DEBT rules i/ii: uncovered, within ceiling, beyond ceiling",
        "no entry -> head-regression (gates); ceiling = value -> debt (not gating); ceiling below value -> debt-exceeded (gates)",
        `${none?.class}/${none?.gating}; ${within?.class}/${within?.gating}; ${beyond?.class}/${beyond?.gating}`,
        none?.class === "head-regression" &&
          none.gating &&
          within?.class === "debt" &&
          !within.gating &&
          beyond?.class === "debt-exceeded" &&
          beyond.gating,
      ),
    );
    // 7. Rule v: a compensator pass the run no longer has.
    const runPasses = passes ?? ["painted_table_cell_text_baselines"];
    const regate = apply(
      c.headReport,
      {
        ...emptyLedger(),
        entries: [entryFor(c.key, v, { compensators: ["canary_deleted_pass"] })],
      },
      { passes: runPasses },
    ).items.find((i) => i.key === c.key);
    rows.push(
      row(
        "DEBT rule v: compensator pass deleted",
        `entry names a pass absent from the run's passes (${runPasses.join(", ")}) -> debt-regate (gates)`,
        `${regate?.class}/${regate?.gating}`,
        regate?.class === "debt-regate" && regate.gating === true,
      ),
    );
  }

  // 8. Rule iii across a merge.
  {
    const key = "pdf-probe|canary|p1|Canary#1|dy";
    const e = entryFor(key, 3);
    const old = { ...emptyLedger(), entries: [e] };
    const raised = transition(old, { ...emptyLedger(), entries: [entryFor(key, 4)] }, {});
    const grown = transition(
      old,
      { ...emptyLedger(), entries: [e, entryFor(`${key}x`, 3, { id: "CANARY-2" })] },
      {},
    );
    const dropped = transition(old, emptyLedger(), { step: "98-other" });
    const closed = transition(old, emptyLedger(), { step: "99-canary" });
    rows.push(
      row(
        "DEBT rule iii: ceiling raised, entry added, entry dropped early",
        "each transition reports a problem; removal at closesAt (control) reports none",
        `raised ${raised.length}, grown ${grown.length}, dropped ${dropped.length}, closed-at-closesAt ${closed.length}`,
        raised.length > 0 && grown.length > 0 && dropped.length > 0 && closed.length === 0,
      ),
    );
  }

  // 8b. Rule iii, removals and ids (Phase C 03, 2026-10-27; verify phasec/02 finding 1: step 02
  // closed 7 WPT keys that still failed, and its population reused DEBT-10-* ids for other keys).
  // A key leaves before its closesAt only as vanished or FIXED (closed[] fixed: true, runId,
  // headComparison), never while the run's head comparison still has it gating (any route,
  // closesAt included); an id never names a different thing; closed[] is append-only and a
  // closed key never re-enters.
  {
    const key = "pdf-probe|canary|p1|Canary#1|dy";
    const old = { ...emptyLedger(), entries: [entryFor(key, 3)] };
    const fixedRec = (extra = {}) => ({
      id: "CANARY-1",
      key,
      step: "98-other",
      reason: "canary: fixed",
      fixed: true,
      runId: "20261027T000000Z",
      headComparison: { class: "improvement", before: 2, after: 0.5 },
      ...extra,
    });
    const closedWith = (rec) => ({ ...emptyLedger(), closed: [rec] });
    const failing = new Map([
      [key, { key, class: "regression", gating: true, before: 0.2, after: 2.8 }],
    ]);
    const fixedNow = new Map([
      [key, { key, class: "improvement", gating: false, before: 2, after: 0.5 }],
    ]);
    const stillFails = transition(old, closedWith(fixedRec()), {
      step: "98-other",
      headItems: failing,
    });
    const atClosesAt = transition(old, emptyLedger(), { step: "99-canary", headItems: failing });
    rows.push(
      row(
        "DEBT rule iii: a still-failing key removed",
        "a key whose head item still gates, removed as fixed or at its closesAt -> problem (never removed, only its ceiling lowered)",
        `as fixed ${stillFails.length}, at closesAt ${atClosesAt.length}`,
        stillFails.some((x) => /still fails/.test(x)) &&
          atClosesAt.some((x) => /still fails/.test(x)),
      ),
    );
    const fixedOk = transition(old, closedWith(fixedRec()), {
      step: "98-other",
      headItems: fixedNow,
    });
    const noRunId = transition(old, closedWith(fixedRec({ runId: undefined })), {
      step: "98-other",
      headItems: fixedNow,
    });
    const noComparison = transition(old, closedWith(fixedRec({ headComparison: undefined })), {
      step: "98-other",
      headItems: fixedNow,
    });
    const unverifiable = transition(old, closedWith(fixedRec()), { step: "98-other" });
    rows.push(
      row(
        "DEBT rule iii: a fixed key removed with evidence",
        "closed[] fixed: true + runId + headComparison and no gating head item -> none; without runId, without headComparison, or without the run's head comparison -> problem",
        `with evidence ${fixedOk.length}; no runId ${noRunId.length}, no headComparison ${noComparison.length}, no head comparison ${unverifiable.length}`,
        fixedOk.length === 0 &&
          noRunId.some((x) => /runId/.test(x)) &&
          noComparison.some((x) => /headComparison/.test(x)) &&
          unverifiable.some((x) => /cannot be verified/.test(x)),
      ),
    );
    const k2 = "pdf-probe|canary|p1|Other#1|dy";
    const k2Item = new Map([
      [
        k2,
        { key: k2, class: "regression", gating: true, before: 0, after: 1, better: "lower-abs" },
      ],
    ]);
    const other = (id) =>
      entryFor(k2, 1, { id }, { measured: 1, layerVectorRef: { unit: "pt", N0: 2, P: 1, run: 1 } });
    const fresh = transition(
      old,
      { ...emptyLedger(), entries: [entryFor(key, 3), other("CANARY-1x")] },
      {
        headItems: k2Item,
      },
    );
    const reusedId = transition(
      { ...emptyLedger(), entries: [entryFor(key, 3), entryFor(`${key}y`, 3, { id: "CANARY-Y" })] },
      { ...emptyLedger(), entries: [entryFor(key, 3), other("CANARY-Y")] },
      { headItems: k2Item, presentKeys: new Set([key]) },
    );
    const closedOld = {
      ...emptyLedger(),
      entries: [entryFor(key, 3)],
      closed: [fixedRec({ id: "CANARY-Z", key: "k-z" })],
    };
    const reusedClosed = transition(
      closedOld,
      { ...closedOld, entries: [entryFor(key, 3), other("CANARY-Z")] },
      { headItems: k2Item },
    );
    const lostHistory = transition(closedOld, { ...closedOld, closed: [] }, {});
    const reentered = ledgerCheck({
      ...emptyLedger(),
      entries: [entryFor(key, 3)],
      closed: [fixedRec()],
    });
    rows.push(
      row(
        "DEBT rule iii: an id reused",
        "an id the base has naming another key -> problem; an id the base closed -> problem; a closed key back in the ledger -> problem; closed[] losing a base record -> problem; a fresh id (control) -> no id problem",
        `fresh ${fresh.filter((x) => /id reused/.test(x)).length}; reused ${reusedId.filter((x) => /id reused/.test(x)).length}, closed id ${reusedClosed.filter((x) => /id reused/.test(x)).length}, re-entered ${reentered.filter((x) => /re-enters/.test(x)).length}, history ${lostHistory.filter((x) => /append-only/.test(x)).length}`,
        fresh.filter((x) => /id reused/.test(x)).length === 0 &&
          reusedId.some((x) => /id reused/.test(x)) &&
          reusedClosed.some((x) => /id reused/.test(x)) &&
          reentered.some((x) => /re-enters/.test(x)) &&
          lostHistory.some((x) => /append-only/.test(x)),
      ),
    );
  }

  // 9. Rule iv and 10. rule vi (ledger shape).
  {
    const k = "pdf-probe|canary|p1|Canary#1|dy";
    const iv = ledgerCheck({
      entries: [
        entryFor(k, 1, { owner: { layer: "vellora:pagination", component: "x" }, closesAt: null }),
      ],
    });
    const page = "canary|TXT-P1|corpus||criterion#1|pageDelta";
    const scoped = (id) =>
      entryFor(
        page,
        1,
        { id, scope: { fixture: "canary", fromPage: 2 } },
        { tolClass: "page-delta" },
      );
    const twice = ledgerCheck({ entries: [scoped("CANARY-P1"), scoped("CANARY-P2")] });
    const perWord = ledgerCheck({
      entries: [
        scoped("CANARY-P1"),
        entryFor("pdf-probe|canary|p3|Canary#1|dy", 1, { id: "CANARY-W" }),
      ],
    });
    const ok = ledgerCheck({
      entries: [scoped("CANARY-P1"), entryFor("pdf-probe|canary|p1|Canary#1|dy", 1)],
    });
    rows.push(
      row(
        "DEBT rule iv: vellora-owned entry without a retirement step",
        "a problem naming closesAt",
        iv.join("; ") || "no problem",
        iv.some((x) => /closesAt/.test(x)),
      ),
    );
    rows.push(
      row(
        "DEBT rule vi: displaced words not collapsed",
        "two entries on one page-count criterion -> problem; a per-word entry inside a page scope -> problem; a page-1 word next to a scope from page 2 (control) -> none",
        `twice ${twice.length}, per-word ${perWord.length}, control ${ok.length}`,
        twice.some((x) => /rule vi/.test(x)) &&
          perWord.some((x) => /rule vi/.test(x)) &&
          ok.length === 0,
      ),
    );
  }

  // 11. Relaxed (b) for new entries.
  {
    const k = "pdf-probe|canary|p1|Canary#1|dy";
    const good = relaxed(entryFor(k, 1));
    const worse = relaxed(
      entryFor(k, 1, {}, { layerVectorRef: { unit: "px", N0: 1, B0: 1, L0: 1, P: 3, run: 3 } }),
    );
    const unnamed = relaxed(entryFor(k, 1, { compensators: [] }));
    const noOwner = relaxed(entryFor(k, 1, { owner: {} }));
    rows.push(
      row(
        "relaxed (b): |run| > |N0|, unnamed compensator, no owner",
        "each reports a problem; a valid entry (control) reports none",
        `good ${good.length}, worse ${worse.length}, unnamed ${unnamed.length}, no owner ${noOwner.length}`,
        good.length === 0 && worse.length > 0 && unnamed.length > 0 && noOwner.length > 0,
      ),
    );
  }
  // 12 + 13. The layer-vector tool (gate/layer-vector.mjs): the word -> layout-diff run mapping
  // must fail its own x-check when misaligned, and a planted vellora pass step must be reported.
  {
    const p = loadPack(pack);
    const ok = vectors(p).mapping.xCheck.within3px;
    const shifted = clone(p);
    const texts = shifted.diff.text_events.map((e) => e.chrome_text);
    shifted.diff.text_events.forEach((e, i) => {
      e.chrome_text = texts[(i + 3) % texts.length];
    });
    const bad = vectors(shifted).mapping.xCheck.within3px;
    rows.push(
      row(
        "layer-vector: word mapping misaligned by three fragments",
        "position check share within 3 px: control >= 0.95, misaligned < 0.5 (a shift by one fragment reads 0.55 on this fixture: neighbouring lines share x; the check catches shifts of two or more)",
        `control ${ok}, misaligned ${bad}`,
        ok >= 0.95 && bad !== null && bad < 0.5,
      ),
    );
    const planted = clone(p);
    const ev = planted.diff.text_events.find((e) => /^Gerente/.test(e.chrome_text ?? ""));
    const layers = planted.diff.layers.map((l) => l.name);
    for (const name of layers.slice(layers.indexOf("table_percent_widths"))) {
      if (typeof ev?.per_layer?.[name]?.dy === "number") ev.per_layer[name].dy += 3;
    }
    const rec = [...vectors(planted).vectors.values()].find((x) => x.text === "Gerente");
    const control = [...vectors(p).vectors.values()].find((x) => x.text === "Gerente");
    const named = (r) => (r?.dy?.relaxedB?.nonZeroVelloraSteps ?? []).map((x) => x.layer);
    rows.push(
      row(
        "layer-vector: planted +3 px pass step",
        "the planted pass (table_percent_widths) appears as a non-zero vellora step of the word; the unplanted word (control) has none",
        `planted [${named(rec).join(", ")}], control [${named(control).join(", ")}]`,
        named(rec).includes("table_percent_widths") && named(control).length === 0,
      ),
    );
  }
  // 14. I1: a word that moves THROUGH Chrome. 0.35 -> -1.15 pt gates; 0.9 -> -0.9 is a
  // within-tolerance item (never "better"); control: a same-side move 3 -> 1.5 is an improvement.
  {
    const key = `pdf-probe|${seed.fixture}|${seed.pair.k}|dy`;
    const one = (from, to) => {
      const r = compare(
        snap({ pdfProbe: withDy(seed, from) }),
        snap({ pdfProbe: withDy(seed, to) }),
      );
      return { item: r.items.find((i) => i.key === key), counts: r.counts };
    };
    const through = one(0.35, -1.15);
    const flip = one(0.9, -0.9);
    const control = one(3, 1.5);
    rows.push(
      row(
        "pdf-probe: a word crosses Chrome (I1)",
        `${src}: dy 0.35 -> -1.15 pt regression (gates); 0.9 -> -0.9 within-tolerance, withinToleranceBetter 0; control 3 -> 1.5 improvement`,
        `through ${through.item?.class}/${through.item?.gating}; flip ${flip.item?.class}, better ${flip.counts.withinToleranceBetter}; control ${control.item?.class}`,
        through.item?.class === "regression" &&
          through.item.gating === true &&
          flip.item?.class === "within-tolerance" &&
          flip.item.gating === false &&
          flip.counts.withinToleranceBetter === 0 &&
          control.item?.class === "improvement",
      ),
    );
  }
  // 15. I2: rule iii without --debt-base. The base defaults to DEBT.json at `git merge-base HEAD
  // main` (a planted repository: merge-base abc1234 holds the entry at ceiling 3); the ledger
  // raises it to 4 -> a rule iii problem. Controls: no merge-base -> a refusal; no DEBT.json at
  // the merge base -> first population.
  {
    const key = "pdf-probe|canary|p1|Canary#1|dy";
    const baseDoc = { ...emptyLedger(), entries: [entryFor(key, 3)] };
    const repo =
      ({ mergeBase = true, ledger = true } = {}) =>
      (args) => {
        if (args[0] === "merge-base") {
          return mergeBase
            ? { status: 0, stdout: "abc1234\n", stderr: "" }
            : { status: 128, stdout: "", stderr: "fatal: Not a valid object name main" };
        }
        if (args[0] === "cat-file") return { status: ledger ? 0 : 128, stdout: "", stderr: "" };
        if (args[0] === "show" && args[1] === `abc1234:${DEBT_REPO_PATH}`) {
          return { status: 0, stdout: JSON.stringify(baseDoc), stderr: "" };
        }
        return { status: 128, stdout: "", stderr: "unexpected" };
      };
    const raised = { ...emptyLedger(), entries: [entryFor(key, 4)] };
    // pointer: null: the planted repository has no per-branch base pointer (DEBT-BASE.json).
    const b = resolveBase({ git: repo(), pointer: null });
    const problems = b.ledger ? transition(b.ledger, raised, {}) : [];
    const noBase = resolveBase({ git: repo({ mergeBase: false }), pointer: null });
    const first = resolveBase({ git: repo({ ledger: false }), pointer: null });
    rows.push(
      row(
        "DEBT rule iii without --debt-base (I2)",
        "base = DEBT.json at the merge base; a raised ceiling -> problem; no merge-base -> refusal; no ledger there -> first population",
        `problems ${problems.length}; no merge-base ${noBase.refusal ? "refused" : "not refused"}; absent ${first.ledger === null ? "first population" : String(first.ledger)}`,
        problems.some((p) => /ceiling/.test(p)) &&
          Boolean(noBase.refusal) &&
          noBase.ledger === undefined &&
          first.ledger === null &&
          !first.refusal,
      ),
    );
  }
  // 16. I3 / GATE-D7: a NEW ledger key is tied to the run. On the creep scenario (head |dy| d, run
  // d + 1.2 pt): a ceiling of 99, a vector whose run is not the measured value, and a measured
  // value that is not the run's each report a problem; the exact entry (control) reports none.
  {
    const c = creep(seed, compare);
    const item = c.headReport.items.find((i) => i.key === c.key);
    const after = item?.after ?? c.d + 1.2;
    const runPx = Math.round(((after * 4) / 3) * 1000) / 1000;
    const vec = (run) => ({ unit: "px", N0: run + 2, B0: run + 2, L0: run + 2, P: run, run });
    const headItems = new Map(c.headReport.items.map((i) => [i.key, i]));
    const fresh = (ceiling, keyExtra) => ({
      ...emptyLedger(),
      entries: [entryFor(c.key, ceiling, {}, { measured: after, ...keyExtra })],
    });
    const check = (l) => transition(emptyLedger(), l, { headItems });
    const exact = check(fresh(Math.abs(after), { layerVectorRef: vec(runPx) }));
    const ceiling99 = check(fresh(99, { layerVectorRef: vec(runPx) }));
    const vector = check(fresh(Math.abs(after), { layerVectorRef: vec(runPx + 2) }));
    const measured = check(fresh(99, { measured: 99, layerVectorRef: vec(99 * (4 / 3)) }));
    const d7 = (x) => x.some((m) => /GATE-D7/.test(m));
    rows.push(
      row(
        "GATE-D7: new ledger key tied to the measured value (I3)",
        `${src}: ceiling 99 -> problem; layerVector.run != measured -> problem; measured != the run's value -> problem; exact entry (control) -> none`,
        `exact ${exact.length}; ceiling 99 ${ceiling99.length}; vector ${vector.length}; measured ${measured.length}`,
        exact.length === 0 && d7(ceiling99) && d7(vector) && d7(measured),
      ),
    );
  }
  // 17. I4: a rejection declared by an earlier link (step 01 of a planted chain, head 00) is not
  // a head regression at step 02, whose own accept file declares nothing; vs the previous link
  // (no change) nothing gates either. Control: a link outside (head, current] does not count.
  {
    const w = wptSeed(run, "fail");
    const rejected = clone(w.doc);
    rejected.results[w.test] = "unsupported";
    rejected.unsupportedFeatures = { ...(rejected.unsupportedFeatures ?? {}), [w.test]: FEATURE };
    const decl = { feature: FEATURE, reason: "canary", evidence: "canary", tests: [w.test] };
    const links = [
      { step: "00-canary-head", declaredRejections: [] },
      { step: "01-canary-reject", declaredRejections: [decl] },
    ];
    const merged = carry({ links, from: 0, to: 2, current: [], currentStep: "02-canary-now" });
    const outside = carry({ links, from: 1, to: 2, current: [], currentStep: "02-canary-now" });
    const head = snap({ wpt: { expectations: w.doc } });
    const now = snap({ wpt: { expectations: rejected } });
    const cls = (declared) =>
      compare(head, now, { declared }).items.find((i) => i.key === `wpt|${w.test}`);
    const carried = cls(merged);
    const notCarried = cls(outside);
    rows.push(
      row(
        "declared rejection carried to the head comparison (I4)",
        `${w.real ? "real" : "synthetic"} test ${w.test} rejected and declared at link 01: vs head 00 at link 02 -> declared; a declaration outside (head, current] (control) -> rejection`,
        `carried ${carried?.class}/${carried?.gating}; control ${notCarried?.class}/${notCarried?.gating}`,
        carried?.class === "declared" &&
          carried.gating === false &&
          notCarried?.class === "rejection" &&
          notCarried.gating === true,
      ),
    );
  }
  // 18. EXT-2 missing-token SET (step 08: 3 tokens left the page while 4 came back, equal count).
  // One extractor's list: before [A, B], after [A, C] (count 2 both) -> C gates; control: the
  // same list again -> nothing.
  {
    const f = (run?.fixtures ?? []).find((x) =>
      (x.verdicts ?? []).some((v) => v.criterion === "EXT-2" && v.oracle === "oracles:text"),
    );
    const v0 = f?.verdicts.find((v) => v.criterion === "EXT-2" && v.oracle === "oracles:text");
    const fixture = f
      ? { ...f, verdicts: [v0] }
      : {
          key: "canary",
          fixture: "canary",
          verdicts: [
            {
              criterion: "EXT-2",
              oracle: "oracles:text",
              status: "FAIL",
              value: "pdftotext fail (missing 2, extra 0)",
              mode: "plain",
              kind: "criterion",
            },
          ],
        };
    const v = fixture.verdicts[0];
    const ex = Object.keys(v.missingTokens ?? {})[0] ?? "pdftotext";
    const withTokens = (tokens) => ({
      ...fixture,
      verdicts: [
        { ...v, missingTokens: { [ex]: { tokens, count: tokens.length, complete: true } } },
      ],
    });
    const b = snap({ fixtures: [withTokens(["CanaryA", "CanaryB"])] });
    const a = snap({ fixtures: [withTokens(["CanaryA", "CanaryC"])] });
    const swapped = gatingOf(compare(b, a)).filter((i) => i.key.includes("|missingTokens."));
    const same = gatingOf(compare(b, b)).filter((i) => i.key.includes("|missingTokens."));
    rows.push(
      row(
        "EXT-2 missing-token set: one token swapped for another",
        `${f ? "real" : "synthetic"} row ${fixture.key} EXT-2 ${ex}: [CanaryA, CanaryB] -> [CanaryA, CanaryC] (same count) -> CanaryC gates; unchanged list (control) -> nothing`,
        `swapped [${swapped.map((i) => i.key.split("|").pop()).join(", ")}]; control ${same.length}`,
        swapped.length === 1 &&
          swapped[0].key.endsWith(`|missingTokens.${ex}|CanaryC`) &&
          same.length === 0,
      ),
    );
  }
  // 19. Off-page text (step 08: "Download as PDF" moved below vellora's page; PyMuPDF's page
  // words lost it, so unpaired-vellora 3 -> 0 read as an improvement). An unpaired vellora word
  // moves into the section's off-page record -> the off-page item gates; control: the same
  // off-page word on both sides -> nothing.
  {
    const s0 = clone(seed.section);
    const w = { text: "CanaryOff", page: 1, x: 10, y: 20 };
    const before = {
      ...s0,
      words: { ...s0.words, unpairedVellora: (s0.unpairedVellora ?? []).length + 1 },
      unpairedVellora: [...(s0.unpairedVellora ?? []), w],
      offPage: { vellora: [...(s0.offPage?.vellora ?? [])], chrome: s0.offPage?.chrome ?? [] },
    };
    const after = {
      ...before,
      words: { ...before.words, unpairedVellora: before.unpairedVellora.length - 1 },
      unpairedVellora: before.unpairedVellora.filter((x) => x !== w),
      offPage: { ...before.offPage, vellora: [...before.offPage.vellora, { ...w, y: 900 }] },
    };
    const b = snap({ pdfProbe: { [seed.fixture]: before } });
    const a = snap({ pdfProbe: { [seed.fixture]: after } });
    const key = `pdf-probe|${seed.fixture}|off-page|CanaryOff`;
    const moved = gatingOf(compare(b, a)).filter((i) => i.key === key);
    const same = gatingOf(compare(a, a)).filter((i) => /\|off-page/.test(i.key));
    rows.push(
      row(
        "pdf-probe: a word moved below the page (off-page)",
        `${src} section: an unpaired vellora word drawn at y 900 pt (outside the page) -> ${key} gates; the same off-page word on both sides (control) -> nothing`,
        `moved ${moved.map((i) => `${i.class}/${i.gating}`).join(",") || "nothing gated"}; control ${same.length}`,
        moved.length === 1 && moved[0].class === "regression" && same.length === 0,
      ),
    );
  }
  // 20. GATE-A3, the WPT pass -> fail route: a real clean pass of the run's expectations fails;
  // raw Blitz fails the same way -> (b), and a DEBT key with that rawOutcome passes GATE-D7 while
  // one whose rawOutcome is not the run's fails; raw Blitz passes -> (c); no raw outcome -> (c);
  // the old render's page count differs from Chrome's -> (a).
  {
    const w = wptSeed(run, "pass");
    const after = clone(w.doc);
    after.results[w.test] = "fail";
    delete after.suspectPasses?.[w.test];
    const before = clone(w.doc);
    delete before.suspectPasses?.[w.test];
    const itemWith = (raw) => {
      const a = clone(after);
      a.rawOutcomes = raw === undefined ? undefined : { [w.test]: raw };
      return compare(
        snap({ wpt: { expectations: before } }),
        snap({ wpt: { expectations: a } }),
      ).items.find((i) => i.key === `wpt|${w.test}`);
    };
    const same = itemWith("fail");
    const rawPass = itemWith("pass");
    const none = itemWith(undefined);
    const oldRecord = {
      comparisons: [{ pageCounts: [2, 2] }],
      chrome: { comparisons: [{ pageCounts: [1, 1] }] },
    };
    const routes = {
      b: route(same ?? {})?.route,
      c1: route(rawPass ?? {})?.route,
      c2: route(none ?? {})?.route,
      a: route(none ?? {}, { oldRecord })?.route,
    };
    const key = (raw) => ({
      key: `wpt|${w.test}`,
      tolClass: "count",
      headValue: "pass",
      ceiling: "fail",
      measured: "fail",
      rawOutcome: raw,
    });
    const entry = (raw) => ({
      ...emptyLedger(),
      entries: [
        {
          ...entryFor(`wpt|${w.test}`, "fail", {
            owner: { layer: "blitz:canary", component: "canary" },
          }),
          keys: [key(raw)],
        },
      ],
    });
    const headItems = new Map([[`wpt|${w.test}`, same]]);
    const okD7 = transition(emptyLedger(), entry("fail"), { headItems });
    const badD7 = transition(emptyLedger(), entry("pass"), { headItems });
    rows.push(
      row(
        "WPT pass -> fail route (GATE-A3)",
        `${w.real ? "real" : "synthetic"} clean pass ${w.test} -> fail: raw Blitz fails the same way -> b; raw passes -> c; no raw outcome -> c; old page count != Chrome's -> a; a DEBT key with the run's rawOutcome passes GATE-D7, one with another does not`,
        `routes ${JSON.stringify(routes)}; D7 ok ${okD7.length}, D7 wrong rawOutcome ${badD7.length}`,
        routes.b === "b" &&
          routes.c1 === "c" &&
          routes.c2 === "c" &&
          routes.a === "a" &&
          okD7.length === 0 &&
          badD7.some((m) => /rawOutcome/.test(m)),
      ),
    );
  }
  // 21. Rule vi' (GATE-D6b; rule (i) of Phase B integration 5, 2026-10-27): a listed page scope
  // binds a page metric unchanged vs the head (1 -> 1, not a head item; the run's value comes
  // from the snapshot). Its listed page-2 word is covered while the page delta is 1; the page
  // delta 1 -> 2 gates (the metric and the word: debt-exceeded); a page-1 word of the fixture
  // worsening beyond tolerance still gates (head-regression); at page delta 0 the listed word is
  // compared again (head-regression). D7: the exact entry ties to the snapshots (control: none);
  // a head 1 / run 2 metric or a ceiling above the page delta is a problem.
  {
    const page = "canary|TXT-P1|corpus||criterion#1|pageDelta";
    const p2 = "pdf-probe|canary|p2|Canary#1|dy";
    const p1 = "pdf-probe|canary|p1|Canary#1|dy";
    const word = (key) => ({
      key,
      group: "pdf-probe",
      check: "pdf-probe",
      tolClass: "pdf-probe-pt",
      tol: 1,
      better: "lower-abs",
      before: 0.1,
      after: 5,
      class: "regression",
      gating: true,
      detail: "canary word",
    });
    const pageItem = {
      key: page,
      check: "value",
      tolClass: "page-delta",
      tol: 0,
      better: "lower",
      before: 1,
      after: 2,
      class: "regression",
      gating: true,
      detail: "canary page delta 1 -> 2",
    };
    const scopedEntry = (ceiling = 1, extra = {}) => ({
      id: "CANARY-PS",
      class: "b",
      owner: { layer: "vellora:pagination", component: "canary pagination" },
      compensators: [],
      closesAt: "99-canary",
      introducedBy: "99-canary",
      evidence: ["gate canary"],
      scope: { fixture: "canary", fromPage: 2, keys: [p2] },
      keys: [
        {
          key: page,
          tolClass: "page-delta",
          headValue: 1,
          ceiling,
          measured: 1,
          layerVectorRef: null,
          ...extra,
        },
      ],
    });
    const ledger = { ...emptyLedger(), entries: [scopedEntry()] };
    const cls = (items, value, key) =>
      apply({ items }, ledger, { passes, pageValues: new Map([[page, value]]) }).items.find(
        (i) => i.key === key,
      );
    const same = cls([word(p2), word(p1)], 1, p2);
    const p1Same = cls([word(p2), word(p1)], 1, p1);
    const grew = cls([word(p2), pageItem], 2, p2);
    const grewPage = cls([word(p2), pageItem], 2, page);
    const matched = cls([word(p2)], 0, p2);
    const headItems = new Map([[p2, word(p2)]]);
    const vals = (v) => new Map([[page, v]]);
    const d7 = (l, h, r) =>
      transition(emptyLedger(), l, { headItems, headPageValues: vals(h), runPageValues: vals(r) });
    const okD7 = d7(ledger, 1, 1);
    const movedD7 = d7(ledger, 1, 2);
    const slackD7 = d7({ ...emptyLedger(), entries: [scopedEntry(2)] }, 1, 1);
    const shape = ledgerCheck(ledger);
    const s = (i) => `${i?.class}/${i?.gating}`;
    rows.push(
      row(
        "DEBT rule vi': listed page scope on an unchanged page metric (rule i, 2026-10-27)",
        "page delta 1 (= head): listed p2 word -> debt; page-1 word -> head-regression; page delta 1 -> 2 -> metric and word debt-exceeded; page delta 0 -> listed word head-regression; D7: exact entry none, head 1 / run 2 a problem, ceiling 2 a problem; ledger shape none",
        `p2 ${s(same)}; p1 ${s(p1Same)}; 1->2 word ${s(grew)} metric ${s(grewPage)}; 0 ${s(matched)}; D7 ok ${okD7.length}, moved ${movedD7.length}, slack ${slackD7.length}; shape ${shape.length}`,
        same?.class === "debt" &&
          !same.gating &&
          p1Same?.class === "head-regression" &&
          p1Same.gating &&
          grew?.class === "debt-exceeded" &&
          grew.gating &&
          grewPage?.class === "debt-exceeded" &&
          grewPage.gating &&
          matched?.class === "head-regression" &&
          matched.gating &&
          okD7.length === 0 &&
          movedD7.length > 0 &&
          slackD7.length > 0 &&
          shape.length === 0,
      ),
    );
    // 23. GATE-D6b's two shape limits (verify 10-final, 2026-10-27): the listed route binds only a
    // page metric that is NOT a head item, so a page-count regression vs the head (1 -> 2, a head
    // item) entered with measured = ceiling = 2 is refused (before: d7KeyProblems alone accepted
    // it, and the relaxed (b) rule skips page-delta keys of a listed scope); and a listed scope
    // starts at page >= 2, so fromPage 1 listing the page-1 word is refused (before: accepted, and
    // the page-1 word rode on the page metric). Control: the exact entry (none, row 21).
    const movedHead = new Map([
      [p2, word(p2)],
      [page, pageItem],
    ]);
    const movedEntry = { ...emptyLedger(), entries: [scopedEntry(2, { measured: 2 })] };
    const movedHeadD7 = transition(emptyLedger(), movedEntry, {
      headItems: movedHead,
      headPageValues: vals(1),
      runPageValues: vals(2),
    });
    const fromPage1 = ledgerCheck({
      ...emptyLedger(),
      entries: [{ ...scopedEntry(), scope: { fixture: "canary", fromPage: 1, keys: [p1, p2] } }],
    });
    rows.push(
      row(
        "DEBT rule vi': a listed page scope binds no moved page metric and no page-1 word",
        "page metric a head item (1 -> 2) entered with measured = ceiling = 2 -> a problem; fromPage 1 listing the page-1 word -> a ledger problem; exact entry -> none",
        `moved metric ${movedHeadD7.length}; fromPage 1 ${fromPage1.length}; exact D7 ${okD7.length}, shape ${shape.length}`,
        movedHeadD7.length > 0 && fromPage1.length > 0 && okD7.length === 0 && shape.length === 0,
      ),
    );
  }
  // 22. Rule (ii) (2026-10-27): ONE run tolerance (1.333 px, the pdf-probe value) for position-mm
  // and pdf-probe vectors, covering Chrome's DOM -> PDF offset only. On the DANFE-L1d spec-anchor
  // vector of run 20261023T004510Z (N0 = every layer = P 23.903 px, run 24.529 px): the vector as
  // measured is (b) with no compensator (control); a +0.6 px layout-layer step stays (c) whether
  // the pass is named or not (step tolerance 0.5 px; |P| <= |N0| + 0.5 px); a +1.5 px P -> run step
  // gates even with `run` named (|run| > |N0| + 1.333 px).
  {
    const key = "danfe|DANFE-L1d|corpus||criterion#1|posErrMm";
    const n0 = 23.903;
    const layers = [
      "B0",
      "L0",
      "painted_table_cell_text_baselines",
      "table_percent_widths",
      "auto_table_compact_columns",
      "P",
    ];
    const vec = (passStep, runStep) => {
      const v = { unit: "px", N0: n0 };
      for (const l of layers) {
        v[l] = Math.round((n0 + (l === "B0" || l === "L0" ? 0 : passStep)) * 1000) / 1000;
      }
      v.run = Math.round((v.P + runStep) * 1000) / 1000;
      return v;
    };
    const e = (v, compensators) =>
      entryFor(
        key,
        Math.abs(v.run),
        { compensators, owner: { layer: "blitz:block-offset", component: "canary" } },
        { tolClass: "position-mm", layerVectorRef: v },
      );
    const control = relaxed(e(vec(0, 0.626), []));
    const layoutUnnamed = relaxed(e(vec(0.6, 0.626), []));
    const layoutNamed = relaxed(
      e(vec(0.6, 0.626), [
        "auto_table_compact_columns",
        "painted_table_cell_text_baselines",
        "table_percent_widths",
      ]),
    );
    const runStep = relaxed(e(vec(0, 1.5), ["run"]));
    rows.push(
      row(
        "rule (ii): shared run tolerance on a DANFE-L1 position-mm vector",
        "DANFE-L1d as measured (P -> run +0.626 px) -> none; +0.6 px layout step unnamed -> problem; named -> problem (|P| > |N0| + 0.5); +1.5 px P -> run with run named -> problem (|run| > |N0| + 1.333)",
        `control ${control.length}; layout unnamed ${layoutUnnamed.length}, named ${layoutNamed.length}; P->run +1.5 ${runStep.length}`,
        control.length === 0 &&
          layoutUnnamed.length > 0 &&
          layoutNamed.length > 0 &&
          runStep.length > 0,
      ),
    );
  }
  rows.push(...docAggregateCanaries(docAggregate, docRule));
  return rows;
}

/** A real fixture row of the run's doc-aggregate (synthetic when none) and a pin equal to it. */
function docSeed(doc) {
  const real = Object.entries(doc?.fixtures ?? {}).find(
    ([, r]) => typeof r.medianMm === "number" && typeof r.within1mmPct === "number",
  );
  const [fixture, row] = real ?? [
    "canary",
    {
      pages: 1,
      chromePages: 1,
      chromeWords: 100,
      missingWords: 0,
      medianMm: 0.5,
      p90Mm: 0.9,
      within1mmPct: 90,
      inputs: { nativeHtmlSha256: "canary-html", chromeGeometrySha256: "canary-geometry" },
    },
  ];
  // Pages equal to Chrome's in the seed, so only the DOC-4 canary plants a page difference.
  const base = { ...clone(row), chromePages: row.pages };
  const method = doc?.method ?? { canary: true };
  const noise = {
    max: Object.fromEntries(Object.keys(DOC_AGGREGATE_TOLERANCE).map((m) => [m, 0])),
  };
  return {
    fixture,
    real: Boolean(real),
    pin: { method, noise, fixtures: { [fixture]: clone(base) } },
    run: (edit = (r) => r) => ({ method, fixtures: { [fixture]: edit(clone(base)) } }),
  };
}

/**
 * DOC-1..DOC-4 canaries (GATE-K2, 2026-10-27): planted into a real row of the run's document
 * aggregate; each must be caught by the doc-aggregate rule (injectable for the self-test).
 */
function docAggregateCanaries(doc, rule) {
  const seed = docSeed(doc);
  const tol = DOC_AGGREGATE_TOLERANCE;
  const src = seed.real ? `real row ${seed.fixture}` : "synthetic row";
  const gatingKeys = (r) => r.items.filter((i) => i.gating).map((i) => i.key);
  const key = (m) => `doc-aggregate|${seed.fixture}|${m}`;
  const round = (v) => Math.round(v * 1000) / 1000;
  const rows = [];
  {
    const at = rule({
      pin: seed.pin,
      run: seed.run((r) => ({ ...r, medianMm: round(r.medianMm + tol.medianMm) })),
      main: true,
    });
    const over = rule({
      pin: seed.pin,
      run: seed.run((r) => ({ ...r, medianMm: round(r.medianMm + tol.medianMm + 0.01) })),
      main: true,
    });
    const noMain = rule({
      pin: seed.pin,
      run: seed.run((r) => ({ ...r, medianMm: r.medianMm + 1 })),
      main: false,
    });
    const listed = noMain.items.find((i) => i.key === key("medianMm"));
    rows.push(
      row(
        "DOC-1 median word distance worse than the published engine",
        `${src}: +${tol.medianMm} mm (= tolerance) passes; +${round(tol.medianMm + 0.01)} mm gates under --main; +1 mm without --main is listed, not gating`,
        `at tolerance gating [${gatingKeys(at)}]; over [${gatingKeys(over)}]; no --main listed ${Boolean(listed)} gating ${listed?.gating}`,
        gatingKeys(at).length === 0 &&
          gatingKeys(over).includes(key("medianMm")) &&
          listed?.gating === false &&
          noMain.verdict === "PASS",
      ),
    );
  }
  {
    const over = rule({
      pin: seed.pin,
      run: seed.run((r) => ({
        ...r,
        within1mmPct: round(r.within1mmPct - tol.within1mmPct - 0.1),
      })),
      main: true,
    });
    const at = rule({
      pin: seed.pin,
      run: seed.run((r) => ({ ...r, within1mmPct: round(r.within1mmPct - tol.within1mmPct) })),
      main: true,
    });
    rows.push(
      row(
        "DOC-1 share of words within 1 mm below the published engine",
        `${src}: -${tol.within1mmPct} pp passes; -${round(tol.within1mmPct + 0.1)} pp gates under --main`,
        `at tolerance gating [${gatingKeys(at)}]; over [${gatingKeys(over)}]`,
        gatingKeys(at).length === 0 && gatingKeys(over).includes(key("within1mmPct")),
      ),
    );
  }
  {
    const r = rule({
      pin: seed.pin,
      run: seed.run((x) => ({ ...x, missingWords: x.missingWords + 1 })),
      main: true,
    });
    rows.push(
      row(
        "DOC-1 one more missing word than the published engine",
        `${src}: missingWords +1 gates under --main`,
        `gating [${gatingKeys(r)}]`,
        gatingKeys(r).includes(key("missingWords")),
      ),
    );
  }
  {
    const r = rule({ pin: seed.pin, run: { method: seed.pin.method, fixtures: {} }, main: true });
    const none = rule({ pin: seed.pin, run: null, main: true });
    rows.push(
      row(
        "DOC-3 a fixture (or the whole aggregate) absent from the run",
        `${src}: the fixture removed gates; no run aggregate refuses under --main`,
        `removed gating [${gatingKeys(r)}]; no aggregate ${none.verdict}`,
        gatingKeys(r).includes(`doc-aggregate|${seed.fixture}`) && none.verdict === "REFUSED",
      ),
    );
  }
  {
    const html = rule({
      pin: seed.pin,
      run: seed.run((x) => ({ ...x, inputs: { ...x.inputs, nativeHtmlSha256: "changed" } })),
      main: true,
    });
    const geometry = rule({
      pin: seed.pin,
      run: seed.run((x) => ({ ...x, inputs: { ...x.inputs, chromeGeometrySha256: "changed" } })),
      main: true,
    });
    const noisy = rule({
      pin: { ...seed.pin, noise: { max: { ...seed.pin.noise.max, medianMm: tol.medianMm * 2 } } },
      run: seed.run(),
      main: true,
    });
    rows.push(
      row(
        "DOC-2 the pin scored on another input, Chrome geometry or above its noise",
        `${src}: native.html sha changed, Chrome geometry sha changed, pin noise 2x the median tolerance: each REFUSED under --main`,
        `html ${html.verdict}; geometry ${geometry.verdict}; noise ${noisy.verdict}`,
        html.verdict === "REFUSED" && geometry.verdict === "REFUSED" && noisy.verdict === "REFUSED",
      ),
    );
  }
  {
    const plant = (x) => ({ ...x, pages: x.chromePages + 1 });
    const report = rule({ pin: seed.pin, run: seed.run(plant), main: true, contract: false });
    const gated = rule({ pin: seed.pin, run: seed.run(plant), main: true, contract: true });
    const listed = report.items.find((i) => i.key === key("pages"));
    rows.push(
      row(
        "DOC-4 page count differs from Chrome's (contract condition 3)",
        `${src}: pages = Chrome + 1 is reported (not gating) under --main, gating under --contract`,
        `--main listed ${Boolean(listed)} gating ${listed?.gating} condition3 ${report.condition3}; --contract gating [${gatingKeys(gated)}]`,
        listed?.gating === false &&
          report.condition3 === "FAIL" &&
          gatingKeys(gated).includes(key("pages")),
      ),
    );
  }
  return rows;
}

/** Gate items for canary rows: an uncaught gate canary is an absolute failure (GATE-K1). */
export function gateCanaryItems(rows) {
  return rows
    .filter((r) => r.caught !== true)
    .map((r) => ({
      key: `canary|${r.oracle}|${r.canary}`,
      group: "canaries",
      check: "canary",
      class: "failure",
      gating: true,
      before: "-",
      after: r.caught,
      detail: `gate canary NOT caught: the gate rule is not trusted (${r.mustReport}; observed ${r.observed})`,
    }));
}

export { v2Section };
