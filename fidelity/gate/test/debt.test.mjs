// The debt ledger and the head ratchet (gate/debt.mjs, gate/run.mjs evaluateGate) on planted
// snapshots: one test per rule (i)-(vi), the relaxed (b) rule for new entries, class-a vs legacy
// acceptances against the head, and the pin view.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compareSnapshots } from "../compare.mjs";
import {
  applyLedger,
  chainHead,
  emptyLedger,
  ledgerProblems,
  pdfProbePage,
  relaxedB,
  transitionProblems,
  vectorSteps,
  withinCeiling,
} from "../debt.mjs";
import { evaluateGate } from "../run.mjs";
import { byKey, snapshot } from "./helpers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLE = JSON.parse(readFileSync(join(here, "data", "debt-example.json"), "utf8"));
const ENTRY = EXAMPLE.entries[0];

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
    vectorSteps(ENTRY.layerVector)
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
  assert.deepEqual(transitionProblems(emptyLedger(), old), []);
  const bad = { ...ENTRY, id: "N", layerVector: { ...ENTRY.layerVector, run: 13 } };
  assert.match(
    transitionProblems(emptyLedger(), { ...emptyLedger(), entries: [bad] }).join(";"),
    /\|run\| 13 > \|N0\| 3\.656.*relaxed \(b\)/,
  );
  // Afterwards the ledger only shrinks.
  const added = { ...ENTRY, id: "DEBT-2", keys: ["pdf-probe|danfe|p1|0,00#4|dy"], ceiling: 1 };
  assert.match(
    transitionProblems(old, { ...emptyLedger(), entries: [ENTRY, added] }).join(";"),
    /entry count 1 -> 2/,
  );
  // A swap that keeps the count but raises the pdf-probe-pt sum is refused.
  assert.match(
    transitionProblems(old, { ...emptyLedger(), entries: [{ ...added, ceiling: 8 }] }).join(";"),
    /sum of pdf-probe-pt ceilings 1.66 -> 8/,
  );
  assert.match(
    transitionProblems(old, { ...emptyLedger(), entries: [{ ...ENTRY, ceiling: 1.7 }] }).join(";"),
    /ceilings only go down/,
  );
  assert.deepEqual(
    transitionProblems(old, { ...emptyLedger(), entries: [{ ...ENTRY, ceiling: 1.2 }] }),
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
  const scoped = {
    ...ENTRY,
    id: "DEBT-PAGES",
    keys: [pageKey],
    tolClass: "page-delta",
    headValue: 1,
    ceiling: 1,
    scope: { fixture: "text-stress-ptbr", fromPage: 3 },
  };
  assert.equal(pdfProbePage("pdf-probe|text-stress-ptbr|p4|de#2|dy"), 4);
  // A per-word entry inside the scope is invalid; one before the scope is fine.
  const inside = { ...ENTRY, id: "W1", keys: ["pdf-probe|text-stress-ptbr|p4|de#2|dy"] };
  const before = { ...ENTRY, id: "W2", keys: ["pdf-probe|text-stress-ptbr|p2|de#2|dy"] };
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
    relaxedB({ ...ENTRY, layerVector: { ...ENTRY.layerVector, N0: 0.5 } }).join(";"),
    /\|run\| 2.213 > \|N0\| 0.5/,
  );
  assert.match(relaxedB({ ...ENTRY, layerVector: undefined }).join(";"), /layerVector/);
});

test("head ratchet: creep under tolerance at every step gates against the head; class-a acceptances of the step cover it, legacy ones do not", () => {
  const h = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.2)]);
  const prev = probe("danfe", [pair("p1|NOME/RAZÃO#1", 0.8)]);
  const run = probe("danfe", [pair("p1|NOME/RAZÃO#1", 1.4)]);
  const opts = { before: prev, after: run, head: { dir: "head", snapshot: h }, canaries: false };
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
  const r = evaluateGate({ before: run, after: run, ledger: broken, canaries: false });
  assert.equal(r.verdict, "FAIL");
  assert.match(byKey(r, "debt|ledger#1").detail, /class must be "b"/);
});
