// The debt ledger and the head ratchet (gate/debt.mjs, gate/run.mjs evaluateGate) on planted
// snapshots: one test per rule (i)-(vi), the relaxed (b) rule for new entries, class-a vs legacy
// acceptances against the head, and the pin view.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "../compare.mjs";
import {
  DEBT_BASE_SCHEMA,
  DEBT_REPO_PATH,
  applyLedger,
  chainHead,
  closedHistoryProblems,
  d7KeyProblems,
  emptyLedger,
  entryProblems,
  idReuseProblems,
  ledgerProblems,
  migrateEntryV1,
  parseDebt,
  pdfProbePage,
  readBasePointer,
  relaxedB,
  resolveLedgerBase,
  transitionProblems,
  vectorSteps,
  withinCeiling,
} from "../debt.mjs";
import { evaluateGate } from "../run.mjs";
import { byKey, snapshot } from "./helpers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLE_FILE = join(here, "data", "debt-example.json");
const EXAMPLE = parseDebt(readFileSync(EXAMPLE_FILE, "utf8"), EXAMPLE_FILE);
const ENTRY = EXAMPLE.entries[0];
const KREC = ENTRY.keys[0];
/** ENTRY (or `e`) with its one key record overridden (a new layerVectorRef is resolved inline). */
const withKey = (e, over = {}) => ({
  ...e,
  keys: [
    {
      ...e.keys[0],
      ...over,
      ...("layerVectorRef" in over ? { layerVector: over.layerVectorRef } : {}),
    },
  ],
});
/** The head item GATE-D7 ties the example key to (step 07: dy 1.66 pt). */
const HEAD_ITEMS = new Map([
  [
    "pdf-probe|danfe|p1|NOME/RAZÃO#1|dy",
    { key: "pdf-probe|danfe|p1|NOME/RAZÃO#1|dy", after: 1.66, better: "lower-abs" },
  ],
]);

// A one-fixture pdf-probe section (semantics 2) with the given pairs and unpaired counts.
const section = (pairs, { unpairedChrome = 0, pages = { vellora: 1, chrome: 1 } } = {}) => ({
  semantics: 2,
  settings: { test: true },
  reference: { chromeWordsSha256: "x" },
  pages,
  words: { paired: pairs.length, unpairedChrome, unpairedVellora: 0 },
  pairs,
  unpairedChrome: [],
  unpairedVellora: [],
});
const pair = (k, dy, dx = 0) => ({ k, text: k.split("|")[1].split("#")[0], page: 1, dx, dy });
const probe = (fx, ...args) => snapshot([], { pdfProbe: { [fx]: section(...args) } });
const KEY = "pdf-probe|danfe|p1|NOME/RAZÃO#1|dy";

test("the example ledger is valid and its entry satisfies the relaxed (b) rule", () => {
  assert.deepEqual(ledgerProblems(EXAMPLE), []);
  assert.deepEqual(relaxedB(ENTRY), []);
  // Real step-07 numbers: raw Blitz +3.656 px, the painted pass -2 px (named compensator), the
  // PDF-level step +0.557 px (within the 1 pt run tolerance); |run| 2.213 <= |N0| 3.656.
  assert.deepEqual(
    vectorSteps(KREC.layerVector)
      .filter((s) => Math.abs(s.step) > 0.01)
      .map((s) => [s.layer, Math.round(s.step * 1000) / 1000]),
    [
      ["painted_table_cell_text_baselines", -2],
      ["run", 0.557],
    ],
  );
});

test("chainHead reads the head named in baselines/port/README.md", () => {
  assert.match(chainHead(), /baselines\/port\/00-start$/);
});

test("rule i: a head-gating item no entry covers gates as head-regression", () => {
  const head = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.16)]);
  const run = probe("danfe", [pair("p1|NOME/RAZÃO#1", 1.66)]);
  const hr = compareSnapshots(head, run);
  const none = applyLedger(hr, emptyLedger()).items;
  assert.deepEqual(
    none.map((i) => [i.key, i.class, i.gating]),
    [[KEY, "head-regression", true]],
  );
  const covered = applyLedger(hr, EXAMPLE).items;
  assert.deepEqual(
    covered.map((i) => [i.class, i.gating, i.debt]),
    [["debt", false, "DEBT-EXAMPLE-1"]],
  );
});

test("rule ii: beyond the ceiling the entry no longer covers the item (debt-exceeded gates)", () => {
  const hr = compareSnapshots(
    probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.16)]),
    probe("danfe", [pair("p1|NOME/RAZÃO#1", -1.9)]),
  );
  const [i] = applyLedger(hr, EXAMPLE).items;
  assert.deepEqual([i.class, i.gating], ["debt-exceeded", true]);
  // Orientation: |d| for pdf-probe, the value for lower-is-better, the value for higher-is-better.
  assert.equal(withinCeiling({ better: "lower-abs", after: -1.66 }, 1.66), true);
  assert.equal(withinCeiling({ better: "lower", after: 3.2 }, 3.1), false);
  assert.equal(withinCeiling({ better: "higher", after: 15 }, 16), false);
  assert.equal(withinCeiling({ check: "status", after: "WARN" }, "FAIL"), true);
  assert.equal(withinCeiling({ check: "status", after: "FAIL" }, "WARN"), false);
  assert.equal(withinCeiling({ check: "pdf-probe", after: "unpaired" }, "unpaired"), true);
});

test("rule iii: count and per-class ceiling sums never grow, ceilings only go down, removals need closesAt or a vanished key", () => {
  const old = { ...emptyLedger(), entries: [ENTRY] };
  // First population (no previous entry): allowed, but every new entry must satisfy relaxed (b).
  assert.deepEqual(transitionProblems(emptyLedger(), old, { headItems: HEAD_ITEMS }), []);
  const bad = withKey({ ...ENTRY, id: "N" }, { layerVectorRef: { ...KREC.layerVector, run: 13 } });
  assert.match(
    transitionProblems(
      emptyLedger(),
      { ...emptyLedger(), entries: [bad] },
      {
        headItems: HEAD_ITEMS,
      },
    ).join(";"),
    /\|run\| 13 > \|N0\| 3\.656.*relaxed \(b\)/,
  );
  // Afterwards the ledger only shrinks.
  const added = withKey(
    { ...ENTRY, id: "DEBT-2" },
    { key: "pdf-probe|danfe|p1|0,00#4|dy", ceiling: 1 },
  );
  assert.match(
    transitionProblems(old, { ...emptyLedger(), entries: [ENTRY, added] }).join(";"),
    /entry count 1 -> 2/,
  );
  // A swap that keeps the count but raises the pdf-probe-pt sum is refused.
  assert.match(
    transitionProblems(old, { ...emptyLedger(), entries: [withKey(added, { ceiling: 8 })] }).join(
      ";",
    ),
    /sum of pdf-probe-pt ceilings 1.66 -> 8/,
  );
  assert.match(
    transitionProblems(old, { ...emptyLedger(), entries: [withKey(ENTRY, { ceiling: 1.7 })] }).join(
      ";",
    ),
    /ceilings only go down/,
  );
  assert.deepEqual(
    transitionProblems(old, { ...emptyLedger(), entries: [withKey(ENTRY, { ceiling: 1.2 })] }),
    [],
  );
  // Removal: at closesAt, fine; before it only with a stated reason and a key that vanished.
  assert.deepEqual(transitionProblems(old, emptyLedger(), { step: "09-row-drift" }), []);
  assert.match(
    transitionProblems(old, emptyLedger(), { step: "08-html-parse" }).join(";"),
    /without a stated reason/,
  );
  const closed = {
    ...emptyLedger(),
    closed: [{ id: ENTRY.id, reason: "word gone", keyVanished: true }],
  };
  assert.deepEqual(
    transitionProblems(old, closed, { step: "08-html-parse", presentKeys: new Set() }),
    [],
  );
  assert.match(
    transitionProblems(old, closed, { step: "08-html-parse", presentKeys: new Set([KEY]) }).join(
      ";",
    ),
    /still has/,
  );
  assert.match(
    transitionProblems(old, closed, { step: "08-html-parse" }).join(";"),
    /cannot be verified/,
  );
});

test("rule iv: a vellora-owned entry names its retirement step", () => {
  const e = { ...ENTRY, owner: { layer: "vellora:pagination", component: "pagination.rs" } };
  assert.deepEqual(ledgerProblems({ entries: [e] }), []);
  assert.match(
    ledgerProblems({ entries: [{ ...e, closesAt: "upstream" }] }).join(";"),
    /closesAt must name a retirement step/,
  );
});

test("rule v: an entry whose compensator pass is gone from the run is re-gated", () => {
  const hr = compareSnapshots(
    probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.16)]),
    probe("danfe", [pair("p1|NOME/RAZÃO#1", 1.66)]),
  );
  const passes = ["table_percent_widths", "auto_table_compact_columns"];
  const [i] = applyLedger(hr, EXAMPLE, { passes }).items;
  assert.deepEqual([i.class, i.gating], ["debt-regate", true]);
  const [ok] = applyLedger(hr, EXAMPLE, {
    passes: [...passes, "painted_table_cell_text_baselines"],
  }).items;
  assert.equal(ok.class, "debt");
  // Unknown pass list: reported as a ledger problem, never silently assumed.
  assert.match(applyLedger(hr, EXAMPLE, { passes: null }).problems.join(";"), /rule v/);
});

test("rule vi: displaced words collapse into one page-scoped entry per page-count criterion", () => {
  const pageKey = "text-stress-ptbr|TXT-P1|corpus||criterion#1|pageDelta";
  const scoped = withKey(
    { ...ENTRY, id: "DEBT-PAGES", scope: { fixture: "text-stress-ptbr", fromPage: 3 } },
    { key: pageKey, tolClass: "page-delta", headValue: 1, ceiling: 1, measured: 1 },
  );
  assert.equal(pdfProbePage("pdf-probe|text-stress-ptbr|p4|de#2|dy"), 4);
  // A per-word entry inside the scope is invalid; one before the scope is fine.
  const inside = withKey({ ...ENTRY, id: "W1" }, { key: "pdf-probe|text-stress-ptbr|p4|de#2|dy" });
  const before = withKey({ ...ENTRY, id: "W2" }, { key: "pdf-probe|text-stress-ptbr|p2|de#2|dy" });
  assert.match(
    ledgerProblems({ entries: [scoped, inside] }).join(";"),
    /collapsed into DEBT-PAGES/,
  );
  assert.deepEqual(ledgerProblems({ entries: [scoped, before] }), []);
  assert.match(
    ledgerProblems({ entries: [scoped, { ...scoped, id: "DEBT-PAGES-2" }] }).join(";"),
    /already collapsed/,
  );
  assert.match(
    ledgerProblems({ entries: [scoped] }, { pageMetricKeys: new Set() }).join(";"),
    /not a page-count/,
  );
  // Coverage: words on pages >= fromPage and the unpaired counts of that fixture.
  const head = snapshot([], {
    pdfProbe: {
      "text-stress-ptbr": section([
        { k: "p2|de#2", text: "de", page: 2, dx: 0, dy: 0 },
        { k: "p4|de#2", text: "de", page: 4, dx: 0, dy: 0 },
      ]),
    },
  });
  const run = snapshot([], {
    pdfProbe: {
      "text-stress-ptbr": section(
        [
          { k: "p2|de#2", text: "de", page: 2, dx: 0, dy: 30 },
          { k: "p4|de#2", text: "de", page: 4, dx: 0, dy: 30 },
        ],
        { unpairedChrome: 5 },
      ),
    },
  });
  const items = applyLedger(compareSnapshots(head, run), { entries: [scoped] }).items;
  const cls = Object.fromEntries(items.map((i) => [i.key, i.class]));
  assert.equal(cls["pdf-probe|text-stress-ptbr|p4|de#2|dy"], "debt");
  assert.equal(cls["pdf-probe|text-stress-ptbr|unpaired-chrome"], "debt");
  assert.equal(cls["pdf-probe|text-stress-ptbr|p2|de#2|dy"], "head-regression");
});

test("relaxed (b): |run| <= |N0|, every non-zero vellora step named, residual owner named", () => {
  assert.match(
    relaxedB({ ...ENTRY, compensators: ["run"] }).join(";"),
    /painted_table_cell_text_baselines .* not a named compensator/,
  );
  assert.match(relaxedB({ ...ENTRY, owner: { layer: "blitz:x" } }).join(";"), /owner/);
  assert.match(
    relaxedB(withKey(ENTRY, { layerVectorRef: { ...KREC.layerVector, N0: 0.5 } })).join(";"),
    /\|run\| 2.213 > \|N0\| 0.5/,
  );
  assert.match(relaxedB(withKey(ENTRY, { layerVectorRef: undefined })).join(";"), /layerVector/);
});

test("head ratchet: creep under tolerance at every step gates against the head; class-a acceptances of the step cover it, legacy ones do not", () => {
  const h = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.2)]);
  const prev = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.8)]);
  const run = probe("danfe", [pair("p1|NOME/RAZÃO#1", 1.4)]);
  const opts = {
    before: prev,
    after: run,
    head: { dir: "head", snapshot: h },
    ledgerBase: null,
    canaries: false,
  };
  const r = evaluateGate(opts);
  assert.equal(byKey(r, KEY).class, "within-tolerance");
  assert.equal(r.counts.gating, 0);
  assert.equal(r.counts.headGating, 1);
  assert.equal(r.verdict, "FAIL");
  assert.deepEqual(
    r.head.items.map((i) => [i.key, i.class]),
    [[KEY, "head-regression"]],
  );
  const accept = (extra) => [{ key: KEY, reason: "r", evidence: "e", ...extra }];
  assert.equal(evaluateGate({ ...opts, accept: accept({}) }).verdict, "FAIL");
  const a = evaluateGate({ ...opts, accept: accept({ class: "a" }) });
  assert.equal(a.verdict, "PASS");
  assert.equal(a.head.counts.accepted, 1);
  // Without a head (--no-head) the same run passes: what D4 let through.
  assert.equal(evaluateGate({ ...opts, head: null }).verdict, "PASS");
});

test("a refused head comparison refuses the gate", () => {
  const h = snapshot([], {
    pdfProbe: { danfe: { ...section([pair("p1|NOME/RAZÃO#1", 0)]), settings: { other: 1 } } },
  });
  const r = evaluateGate({
    before: probe("danfe", [pair("p1|NOME/RAZÃO#1", 0)]),
    after: probe("danfe", [pair("p1|NOME/RAZÃO#1", 0)]),
    head: { dir: "head", snapshot: h },
    ledgerBase: null,
    canaries: false,
  });
  assert.equal(r.verdict, "REFUSED");
  assert.match(r.refusals.join(";"), /^head head: pdf-probe: pdf-probe settings differ/);
});

test("pin view: items worse than the pin are (a) accepted artefact, (b) ledger debt, (c) neither; --main gates (c)", () => {
  const pin = probe("danfe", [
    pair("p1|NOME/RAZÃO#1", 0.16),
    pair("p1|0,00#4", 0),
    pair("p1|0,00#5", 0),
  ]);
  const run = probe("danfe", [
    pair("p1|NOME/RAZÃO#1", 1.66),
    pair("p1|0,00#4", 5),
    pair("p1|0,00#5", 5),
  ]);
  const accept = [{ key: "pdf-probe|danfe|p1|0,00#4|dy", reason: "r", evidence: "e", class: "a" }];
  const opts = {
    before: run,
    after: run,
    pin: { dir: "pin", snapshot: pin },
    ledger: EXAMPLE,
    // The example is already in the base ledger: no new key, nothing for GATE-D7 to tie.
    ledgerBase: EXAMPLE,
    accept,
    canaries: false,
  };
  const r = evaluateGate(opts);
  assert.deepEqual(r.pin.counts, { a: 1, b: 1, c: 1, declared: 0 });
  assert.equal(r.pin.mainMerge, "BLOCKED");
  assert.equal(r.verdict, "PASS");
  const m = evaluateGate({ ...opts, main: true });
  assert.equal(m.verdict, "FAIL");
  assert.deepEqual(
    m.items.filter((i) => i.gating).map((i) => i.key),
    ["pin|pdf-probe|danfe|p1|0,00#5|dy"],
  );
});

test("ledger problems are absolute failures of the gate", () => {
  const broken = { ...EXAMPLE, entries: [{ ...ENTRY, class: "a" }] };
  const run = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0)]);
  const r = evaluateGate({
    before: run,
    after: run,
    ledger: broken,
    ledgerBase: null,
    canaries: false,
  });
  assert.equal(r.verdict, "FAIL");
  assert.match(byKey(r, "debt|ledger#1").detail, /class must be "b"/);
});

test("I2: rule iii always runs; an undetermined ledger base refuses the gate", () => {
  const run = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0)]);
  const r = evaluateGate({ before: run, after: run, canaries: false });
  assert.equal(r.verdict, "REFUSED");
  assert.match(r.refusals.join(";"), /ledger base .* not determined/);
  const raised = { ...EXAMPLE, entries: [withKey(ENTRY, { ceiling: KREC.ceiling + 1 })] };
  const ok = evaluateGate({ before: run, after: run, ledgerBase: null, canaries: false });
  assert.equal(ok.verdict, "PASS");
  assert.equal(ok.ledger.transitionChecked, true);
  const up = evaluateGate({
    before: run,
    after: run,
    ledger: raised,
    ledgerBase: EXAMPLE,
    canaries: false,
  });
  assert.equal(up.verdict, "FAIL");
  assert.match(up.ledger.problems.join(";"), /ceilings only go down/);
});

test("I2: resolveLedgerBase reads DEBT.json at the merge base, else first population, else refuses", () => {
  const calls = [];
  const repo = (files) => (args) => {
    calls.push(args.join(" "));
    if (args[0] === "merge-base") return { status: 0, stdout: "0123abcd\n", stderr: "" };
    const f = files[args[2] ?? args[1]];
    if (args[0] === "cat-file") return { status: f ? 0 : 128, stdout: "", stderr: "" };
    if (args[0] === "show") return { status: 0, stdout: f, stderr: "" };
    return { status: 1, stdout: "", stderr: "" };
  };
  const path = `0123abcd:${DEBT_REPO_PATH}`;
  const b = resolveLedgerBase({ git: repo({ [path]: JSON.stringify(EXAMPLE) }), pointer: null });
  assert.equal(b.refusal, null);
  assert.equal(b.ledger.entries.length, 1);
  assert.match(b.source, /merge-base 0123abcd/);
  assert.deepEqual(calls.slice(0, 1), ["merge-base HEAD main"]);
  const first = resolveLedgerBase({ git: repo({}), pointer: null });
  assert.equal(first.ledger, null);
  assert.match(first.source, /first population/);
  // Phase C 03: no ledger at the merge base -> the committed per-branch base pointer names the
  // frozen base (sha256-checked); a ledger at the merge base still wins over the pointer.
  const dir = mkdtempSync(join(tmpdir(), "debt-base-"));
  const frozen = join(dir, "DEBT-frozen.json");
  writeFileSync(frozen, JSON.stringify(EXAMPLE));
  const sha = createHash("sha256").update(readFileSync(frozen)).digest("hex");
  const ptr = (doc) => {
    const f = join(dir, `ptr-${Math.random().toString(36).slice(2)}.json`);
    writeFileSync(f, JSON.stringify(doc));
    return f;
  };
  const good = ptr({
    schema: DEBT_BASE_SCHEMA,
    ledger: "DEBT-frozen.json",
    sha256: sha,
    step: "10-x",
  });
  const viaPointer = resolveLedgerBase({ git: repo({}), pointer: good, root: dir });
  assert.equal(viaPointer.refusal, null);
  assert.equal(viaPointer.ledger.entries.length, 1);
  assert.match(
    viaPointer.source,
    /base pointer .*DEBT-frozen\.json.*step 10-x.*absent at merge-base/,
  );
  const mbWins = resolveLedgerBase({
    git: repo({ [path]: JSON.stringify({ ...EXAMPLE, entries: [] }) }),
    pointer: good,
    root: dir,
  });
  assert.equal(mbWins.ledger.entries.length, 0);
  assert.match(mbWins.source, /merge-base 0123abcd/);
  const tampered = ptr({
    schema: DEBT_BASE_SCHEMA,
    ledger: "DEBT-frozen.json",
    sha256: "0".repeat(64),
  });
  const t = resolveLedgerBase({ git: repo({}), pointer: tampered, root: dir });
  assert.equal(t.ledger, undefined);
  assert.match(t.refusal, /frozen ledger base .* sha256 .* never changes/);
  const missing = ptr({ schema: DEBT_BASE_SCHEMA, ledger: "nope.json", sha256: sha });
  assert.match(
    resolveLedgerBase({ git: repo({}), pointer: missing, root: dir }).refusal,
    /does not exist/,
  );
  assert.match(
    resolveLedgerBase({ git: repo({}), pointer: ptr({ ledger: "DEBT-frozen.json" }), root: dir })
      .refusal,
    /needs schema/,
  );
  // The committed pointer names the frozen 10-integration ledger (27 entries, 1026 keys).
  const committed = readBasePointer();
  assert.equal(committed.refusal, undefined);
  assert.equal(committed.ledger.entries.length, 27);
  assert.equal(
    committed.ledger.entries.reduce((n, e) => n + e.keys.length, 0),
    1026,
  );
  const none = resolveLedgerBase({
    git: () => ({ status: 128, stdout: "", stderr: "fatal: no main" }),
  });
  assert.equal(none.ledger, undefined);
  assert.match(none.refusal, /cannot be determined.*fatal: no main/);
  // An explicit --debt-base wins; a missing file is the first population.
  assert.equal(resolveLedgerBase({ debtBase: "/nonexistent/DEBT.json" }).ledger, null);
});

test("debt/2: an entry groups keys; rules ii and iii apply per key", () => {
  const k2 = "pdf-probe|danfe|p1|0,00#4|dy";
  const two = {
    ...ENTRY,
    keys: [KREC, { ...KREC, key: k2, headValue: 0, ceiling: 3, measured: 3 }],
  };
  assert.deepEqual(ledgerProblems({ entries: [two] }), []);
  const hr = compareSnapshots(
    probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.16), pair("p1|0,00#4", 0)]),
    probe("danfe", [pair("p1|NOME/RAZÃO#1", 1.66), pair("p1|0,00#4", 3.5)]),
  );
  const cls = Object.fromEntries(
    applyLedger(
      hr,
      { entries: [two] },
      { passes: ["painted_table_cell_text_baselines"] },
    ).items.map((i) => [i.key, i.class]),
  );
  // Key 1 within its own ceiling (1.66), key 2 beyond ITS ceiling (3 < 3.5).
  assert.deepEqual(cls, { [KEY]: "debt", [k2]: "debt-exceeded" });
  // Rule iii per key: raising one key's ceiling is a problem even when the other goes down.
  const moved = {
    ...two,
    keys: [
      { ...KREC, ceiling: 1 },
      { ...two.keys[1], ceiling: 3.2 },
    ],
  };
  assert.match(
    transitionProblems({ entries: [two] }, { entries: [moved] }).join(";"),
    new RegExp(`${k2.replace(/[|]/g, "\\|")}: ceiling 3 -> 3.2: ceilings only go down`),
  );
  // Dropping one key early is a removal like an entry's.
  assert.match(
    transitionProblems({ entries: [two] }, { entries: [ENTRY] }, { step: "08-x" }).join(";"),
    /0,00#4\|dy removed before its closesAt/,
  );
  // Keys are records now; a debt/1 string key is a shape problem.
  assert.match(entryProblems({ ...ENTRY, keys: [KEY] }).join(";"), /every key is a record/);
  assert.match(
    ledgerProblems({ entries: [ENTRY, { ...ENTRY, id: "OTHER" }] }).join(";"),
    /already in DEBT-EXAMPLE-1/,
  );
});

test("I3 / GATE-D7: a new key's ceiling, measured value and vector run are tied to the run", () => {
  assert.deepEqual(d7KeyProblems(ENTRY, KREC, HEAD_ITEMS.get(KEY)), []);
  // A ceiling of 99 (the I3 hole) and any slack above the measured value + 0.01 pt resolution.
  assert.match(
    d7KeyProblems(ENTRY, { ...KREC, ceiling: 99 }, HEAD_ITEMS.get(KEY)).join(";"),
    /ceiling 99 is not the measured value 1.66.*GATE-D7/,
  );
  assert.match(
    d7KeyProblems(ENTRY, { ...KREC, ceiling: 1.68 }, HEAD_ITEMS.get(KEY)).join(";"),
    /ceiling 1.68/,
  );
  assert.deepEqual(d7KeyProblems(ENTRY, { ...KREC, ceiling: 1.67 }, HEAD_ITEMS.get(KEY)), []);
  // A vector whose run is not the measured value (2.213 px = 1.66 pt; 3 px = 2.25 pt is not).
  assert.match(
    d7KeyProblems(
      ENTRY,
      { ...KREC, layerVector: { ...KREC.layerVector, run: 3 } },
      HEAD_ITEMS.get(KEY),
    ).join(";"),
    /layerVector.run 3 px = 2.25 pt is not the measured 1.66/,
  );
  // measured must be the run's value; a key the head comparison does not have cannot be tied.
  assert.match(
    d7KeyProblems(ENTRY, { ...KREC, measured: 2 }, HEAD_ITEMS.get(KEY)).join(";"),
    /measured 2 is not the run's value 1.66/,
  );
  assert.match(d7KeyProblems(ENTRY, KREC, null).join(";"), /must be an item of the head/);
  // A count key: no slack at all, and a px vector cannot describe a count.
  const countItem = { key: "x|missing", after: 3, better: "lower" };
  const count = { ...KREC, key: "x|missing", tolClass: "count", ceiling: 3, measured: 3 };
  assert.match(d7KeyProblems(ENTRY, count, countItem).join(";"), /cannot be expressed in .* count/);
  assert.match(
    d7KeyProblems(
      ENTRY,
      { ...count, ceiling: 4, layerVector: { unit: "count", N0: 3, run: 3 } },
      countItem,
    ).join(";"),
    /ceiling 4/,
  );
});

test("debt/2 migration and layerVectorRef resolution", () => {
  const v1 = {
    id: "OLD",
    keys: [KEY, "pdf-probe|danfe|p1|0,00#4|dy"],
    class: "b",
    headValue: 0.16,
    ceiling: 1.66,
    tolClass: "pdf-probe-pt",
    layerVector: KREC.layerVector,
    owner: ENTRY.owner,
    compensators: ENTRY.compensators,
    closesAt: ENTRY.closesAt,
    introducedBy: ENTRY.introducedBy,
    evidence: ENTRY.evidence,
  };
  const m = migrateEntryV1(v1);
  assert.deepEqual(
    m.keys.map((k) => [k.key, k.ceiling, k.measured, k.tolClass]),
    [
      [KEY, 1.66, null, "pdf-probe-pt"],
      ["pdf-probe|danfe|p1|0,00#4|dy", 1.66, null, "pdf-probe-pt"],
    ],
  );
  const parsed = parseDebt(
    JSON.stringify({ schema: "vellora-fidelity/debt/1", entries: [v1] }),
    "v1",
  );
  assert.equal(parsed.schema, "vellora-fidelity/debt/2");
  assert.equal(parsed.migratedFrom, "vellora-fidelity/debt/1");
  assert.deepEqual(parsed.entries[0].keys[0].layerVector, KREC.layerVector);
  // A string ref: "<file>#<item key>" into a layer-vector.mjs output (words[].item, <axis>.vector).
  const dir = mkdtempSync(join(tmpdir(), "debt-ref-"));
  writeFileSync(
    join(dir, "vectors.json"),
    JSON.stringify({ words: [{ item: KEY, axis: "dy", dy: { vector: KREC.layerVector } }] }),
  );
  const ref = parseDebt(
    JSON.stringify({
      schema: "vellora-fidelity/debt/2",
      entries: [withKey(ENTRY, { layerVectorRef: `vectors.json#${KEY}` })].map((e) => ({
        ...e,
        keys: e.keys.map(({ layerVector, ...k }) => k),
      })),
    }),
    "ref",
    { root: dir },
  );
  assert.deepEqual(ref.entries[0].keys[0].layerVector, KREC.layerVector);
  const missing = parseDebt(
    JSON.stringify({
      schema: "vellora-fidelity/debt/2",
      entries: [
        { ...ENTRY, keys: [{ ...KREC, layerVector: undefined, layerVectorRef: "nope.json#x" }] },
      ],
    }),
    "missing",
    { root: dir },
  );
  assert.match(entryProblems(missing.entries[0]).join(";"), /nope.json does not exist/);
});

// Rule vi' (GATE-D6b, rule (i) of Phase B integration 5, 2026-10-27): the listed page scope.
const PS_PAGE = "fx|TXT-P1|corpus||criterion#1|pageDelta";
const PS_W2 = "pdf-probe|fx|p2|w#1|dy";
const psEntry = (rec = {}, scope = {}) => ({
  id: "PS",
  class: "b",
  owner: { layer: "vellora:pagination", component: "c" },
  compensators: [],
  closesAt: "11-pagination",
  introducedBy: "10-x",
  evidence: ["e"],
  scope: { fixture: "fx", fromPage: 2, keys: [PS_W2], ...scope },
  keys: [
    {
      key: PS_PAGE,
      tolClass: "page-delta",
      headValue: 1,
      ceiling: 1,
      measured: 1,
      layerVectorRef: null,
      ...rec,
    },
  ],
});

test("rule vi': a listed page scope parses without a vector, passes relaxed (b) and its shape rules", () => {
  const doc = parseDebt(
    JSON.stringify({ schema: "vellora-fidelity/debt/2", entries: [psEntry()] }),
  );
  assert.deepEqual(entryProblems(doc.entries[0]), []);
  assert.deepEqual(relaxedB(doc.entries[0]), []);
  assert.deepEqual(ledgerProblems(doc), []);
  // A listed key on page 1, of another fixture, or listed twice is refused.
  for (const keys of [["pdf-probe|fx|p1|w#1|dy"], ["pdf-probe|other|p2|w#1|dy"], [PS_W2, PS_W2]]) {
    const p = ledgerProblems({ entries: [psEntry({}, { keys })] });
    assert.ok(
      p.some((x) => /rule vi'/.test(x)),
      JSON.stringify(keys),
    );
  }
  // A listed scope binding a non-page key is refused.
  assert.ok(
    ledgerProblems({ entries: [psEntry({ tolClass: "count" })] }).some((x) => /page-delta/.test(x)),
  );
});

test("rule vi': D7 ties the unchanged page metric to the snapshots; the list never grows", () => {
  const word = { key: PS_W2, class: "regression", gating: true };
  const headItems = new Map([[PS_W2, word]]);
  const vals = (v) => new Map([[PS_PAGE, v]]);
  const t = (l, h, r, hi = headItems) =>
    transitionProblems(emptyLedger(), l, {
      headItems: hi,
      headPageValues: vals(h),
      runPageValues: vals(r),
    });
  const one = (e) => ({ ...emptyLedger(), entries: [e] });
  assert.deepEqual(t(one(psEntry()), 1, 1), []);
  assert.ok(t(one(psEntry()), 1, 2).some((x) => /head 1 != run 2/.test(x)));
  assert.ok(t(one(psEntry({ ceiling: 2 })), 1, 1).some((x) => /ceiling 2/.test(x)));
  assert.ok(t(one(psEntry({ headValue: 0 })), 1, 1).some((x) => /headValue 0/.test(x)));
  assert.ok(
    t(one(psEntry({ measured: 0, ceiling: 0, headValue: 0 })), 0, 0).some((x) =>
      /nothing to scope out/.test(x),
    ),
  );
  assert.ok(t(one(psEntry()), 1, 1, new Map()).some((x) => /not a gating item/.test(x)));
  assert.ok(
    transitionProblems(emptyLedger(), one(psEntry()), { headItems }).some((x) =>
      /are needed/.test(x),
    ),
  );
  // Rule iii: an existing listed scope may only shrink its list.
  const grown = psEntry({}, { keys: [PS_W2, "pdf-probe|fx|p3|w#1|dy"] });
  assert.ok(
    transitionProblems(one(psEntry()), one(grown), {}).some((x) => /scope.keys grew by 1/.test(x)),
  );
  assert.deepEqual(transitionProblems(one(grown), one(psEntry()), {}), []);
});

test("rule vi': coverage follows the run's page delta (1 covered, 2 exceeded, 0 compared again, unknown a problem)", () => {
  const word = (key) => ({ key, class: "regression", gating: true, after: 5, better: "lower-abs" });
  const ledger = { ...emptyLedger(), entries: [psEntry()] };
  const run = (v, items = [word(PS_W2)]) =>
    applyLedger({ items }, ledger, {
      pageValues: v === undefined ? null : new Map([[PS_PAGE, v]]),
    });
  assert.equal(run(1).items[0].class, "debt");
  assert.equal(run(2).items[0].class, "debt-exceeded");
  assert.equal(run(0).items[0].class, "head-regression");
  const unknown = run(undefined);
  assert.equal(unknown.items[0].class, "head-regression");
  assert.ok(unknown.problems.some((x) => /unknown/.test(x)));
  // An unlisted page-2 word of the same fixture is not covered.
  assert.equal(run(1, [word("pdf-probe|fx|p2|other#1|dy")]).items[0].class, "head-regression");
});

test("rule vi': a listed scope binds no moved page metric and starts at page >= 2 (GATE-D6b, verify 10-final)", () => {
  const one = (e) => ({ ...emptyLedger(), entries: [e] });
  // A page-count regression vs the head (1 -> 2, a head item) entered with measured = ceiling = 2.
  const pageItem = { key: PS_PAGE, class: "regression", gating: true, before: 1, after: 2 };
  const word = { key: PS_W2, class: "regression", gating: true };
  const moved = transitionProblems(emptyLedger(), one(psEntry({ measured: 2, ceiling: 2 })), {
    headItems: new Map([
      [PS_W2, word],
      [PS_PAGE, pageItem],
    ]),
    headPageValues: new Map([[PS_PAGE, 1]]),
    runPageValues: new Map([[PS_PAGE, 2]]),
  });
  assert.ok(
    moved.some((x) => /the page metric is a head item \(1 -> 2\)/.test(x)),
    moved.join(";"),
  );
  // fromPage 1 (which would let a listed page-1 word ride on the page metric) is refused.
  for (const fromPage of [1, 0, "2", undefined]) {
    const p = ledgerProblems(
      one(psEntry({}, { fromPage, keys: ["pdf-probe|fx|p1|w#1|dy", PS_W2] })),
    );
    assert.ok(
      p.some((x) => /a listed page scope starts at a page >= 2/.test(x)),
      `${fromPage}: ${p.join(";")}`,
    );
  }
  assert.deepEqual(
    ledgerProblems(one(psEntry({}, { fromPage: 3, keys: ["pdf-probe|fx|p3|w#1|dy"] }))),
    [],
  );
});

// Phase C 03 (2026-10-27): rule iii removal routes, ids and the closed history.
test("rule iii: a fixed key leaves with closed[] evidence; a still-failing key never leaves; ids are never reused", () => {
  const key = KREC.key;
  const old = { ...emptyLedger(), entries: [ENTRY] };
  const rec = {
    id: ENTRY.id,
    key,
    step: "11-x",
    reason: "fixed",
    fixed: true,
    runId: "20261027T231548Z",
    headComparison: { class: "within-tolerance", before: 0.1, after: 0.4 },
  };
  const now = (cls, gating) => new Map([[key, { key, class: cls, gating, before: 0, after: 1 }]]);
  const t = (closed, headItems, step = "11-x") =>
    transitionProblems(old, { ...emptyLedger(), closed }, { step, headItems });
  assert.deepEqual(t([rec], now("improvement", false)), []);
  assert.deepEqual(t([rec], new Map()), []); // no item now: unchanged vs the head
  assert.match(t([rec], null).join(";"), /cannot be verified without the run's head comparison/);
  const gone = transitionProblems(
    old,
    { ...emptyLedger(), closed: [rec] },
    { step: "11-x", headItems: new Map(), presentKeys: new Set() },
  );
  assert.match(gone.join(";"), /closed as keyVanished/);
  assert.deepEqual(
    transitionProblems(
      old,
      { ...emptyLedger(), closed: [rec] },
      { step: "11-x", headItems: new Map(), presentKeys: new Set([key]) },
    ),
    [],
  );
  assert.match(t([{ ...rec, runId: "c02" }], new Map()).join(";"), /runId/);
  assert.match(t([{ ...rec, headComparison: null }], new Map()).join(";"), /headComparison/);
  assert.match(
    t([{ ...rec, headComparison: { class: "regression" } }], new Map()).join(";"),
    /recorded head comparison is a gating regression/,
  );
  // Still failing now: refused as fixed, at its closesAt, and from a gate report (headClass).
  assert.match(t([rec], now("regression", true)).join(";"), /still fails/);
  assert.match(
    t([], now("regression", true), ENTRY.closesAt ?? "99-x").join(";"),
    ENTRY.closesAt ? /still fails/ : /without a stated reason/,
  );
  const fromReport = new Map([
    [key, { key, class: "head-regression", headClass: "regression", gating: true }],
  ]);
  assert.match(t([rec], fromReport).join(";"), /still fails/);
  // A plain reason (neither vanished nor fixed) is still refused.
  assert.match(
    t([{ id: ENTRY.id, key, reason: "shrink" }], new Map()).join(";"),
    /only a vanished key or a fixed item/,
  );
  // Ids: an id of the base naming another key, and an id the base closed, are refused.
  const moved = { ...ENTRY, keys: [{ ...KREC, key: `${key}x` }] };
  assert.match(idReuseProblems([ENTRY], [moved]).join(";"), /id reused for a different thing/);
  assert.deepEqual(idReuseProblems([ENTRY], [{ ...moved, id: "DEBT-11-fresh-1" }]), []);
  assert.match(
    idReuseProblems([], [{ ...moved, id: "OLD-1" }], [{ id: "OLD-1", key: "k" }]).join(";"),
    /closed this id/,
  );
  const scopeE = { ...ENTRY, scope: { fixture: "f", fromPage: 2, keys: ["a"] } };
  assert.match(
    idReuseProblems([scopeE], [{ ...scopeE, scope: { ...scopeE.scope, keys: ["a", "b"] } }]).join(
      ";",
    ),
    /scope\.keys the base entry/,
  );
  // History: closed[] is append-only, and a closed key never re-enters.
  assert.match(closedHistoryProblems([rec], []).join(";"), /append-only/);
  assert.deepEqual(closedHistoryProblems([rec], [rec, { ...rec, key: "z" }]), []);
  assert.match(
    ledgerProblems({ ...emptyLedger(), entries: [ENTRY], closed: [rec] }).join(";"),
    /re-enters the ledger after closed\[\] closed it/,
  );
  assert.match(
    ledgerProblems({
      ...emptyLedger(),
      entries: [ENTRY],
      closed: [{ id: ENTRY.id, reason: "x" }],
    }).join(";"),
    /closed as a whole/,
  );
});
