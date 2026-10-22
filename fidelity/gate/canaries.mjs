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
import { PACK_DIR, loadPack, packWordVectors, relaxedBFacts } from "./layer-vector.mjs";

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
    const b = resolveBase({ git: repo() });
    const problems = b.ledger ? transition(b.ledger, raised, {}) : [];
    const noBase = resolveBase({ git: repo({ mergeBase: false }) });
    const first = resolveBase({ git: repo({ ledger: false }) });
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
