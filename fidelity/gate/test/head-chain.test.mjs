// The head ratchet and the pin view on the committed chain (no render): 07-media-print gated
// post-hoc against 06 (and, below, 09-review-fixes against 08) with --head 00-start and the
// ledger as it stood for those links (empty: DEBT.json was first populated on 2026-10-27, at
// step 10-integration), and classed against the shipped main (pin). Numbers are asserted so a change of the rules or of
// the committed data is visible here; their reading is in fidelity/baselines/port/README.md
// ("Head ratchet and debt ledger").
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { DEBT_FILE, emptyLedger, loadDebt } from "../debt.mjs";
import { chainDeclarations } from "../declarations.mjs";
import { evaluateGate } from "../run.mjs";
import { loadBaselineDir } from "../snapshot.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const load = (...p) => loadBaselineDir(join(baselines, ...p));
const PASSES = [
  "auto_table_compact_columns",
  "painted_table_cell_text_baselines",
  "table_percent_widths",
];

const s06 = load("port", "06-page-rules");
const s07 = load("port", "07-media-print");
const head = { dir: "fidelity/baselines/port/00-start", snapshot: load("port", "00-start") };
// I4: the head and pin views merge the declarations carried along the chain (step 06's 10
// css:page-varying-width rejections live in baselines/port/declared-rejections.json).
const carried = (prev, step, current) =>
  chainDeclarations({
    headDir: join(baselines, "port", "00-start"),
    baselineDir: join(baselines, "port", prev),
    current,
    step,
  });
const c07 = carried("06-page-rules", "07-media-print", s07.manifest.declaredRejections ?? []);
const pin = { dir: "fidelity/baselines/pin", snapshot: load("pin") };
// The ledger as committed at port step 10-integration (frozen when Phase C 02 shrank DEBT.json).
const LEDGER_10 = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "snapshots",
  "2026-10-27",
  "10-final",
  "DEBT-10-integration.json",
);
const r = evaluateGate({
  before: s06,
  after: s07,
  head,
  pin,
  accept: s07.manifest.acceptedRegressions,
  declared: s07.manifest.declaredRejections ?? [],
  headDeclared: c07.head,
  pinDeclared: c07.pin,
  ledger: emptyLedger(),
  ledgerBase: null,
  passes: PASSES,
});
const tally = (items, f) => {
  const out = {};
  for (const i of items) out[f(i)] = (out[f(i)] ?? 0) + 1;
  return out;
};

test("the committed DEBT.json is a debt/2 ledger (first population 2026-10-27); 07 and 09 ran with none", () => {
  const l = loadDebt(DEBT_FILE);
  assert.equal(l.schema, "vellora-fidelity/debt/2");
  assert.equal(l.migratedFrom, undefined);
  // 2 entries / 11 keys since Phase C 03 (Phase C 02: 10 / 180, frozen in
  // snapshots/2026-10-27/c02/DEBT-c02.json; step 10-integration: 27 / 1026, frozen in
  // snapshots/2026-10-27/10-final/DEBT-10-integration.json; gate/test/debt-populate.test.mjs checks
  // all three).
  assert.equal(l.entries.length, 2);
  assert.equal(loadDebt(LEDGER_10).entries.length, 27);
  assert.deepEqual(r.ledger.problems, []);
});

// I1 (2026-10-22): a pdf-probe word that crosses Chrome to more than 1 pt on the other side of it
// gates, so the head views grow by the crossings (07: 985 -> 1407, 09: 974 -> 1396; pin view 07:
// 213 -> 252, 09: 206 -> 245; all pdf-probe items). I4 (2026-10-22): step 06's 10 declared
// css:page-varying-width rejections are carried to the head and the pin (07: 1407 -> 1397,
// 09: 1396 -> 1386; pin (c) 07: 252 -> 242, 09: 245 -> 235, declared 10). The EXT-2
// missing-token SET ratchet (2026-10-22) adds, per newly missing token, the postmark text the
// XML parse lost at 07 (12 tokens vs head and pin: "The [Product Name] team" in pdftotext and
// pdfminer.six, "1234 Street Rd. Suite 1234" in pdfminer.six) and at 09 the off-page "Download
// as PDF" vs pin (6: pdftotext and pymupdf): 07 head 1397 -> 1409, pin (c) 07 242 -> 254, 09
// 235 -> 241.
test("07 vs 06 is unchanged link to link, but 1409 items are worse than the head (00-start) and none is covered", () => {
  assert.equal(r.counts.gating, 0);
  assert.equal(r.head.counts.gating, 1409);
  assert.equal(r.verdict, "FAIL");
  assert.deepEqual(
    tally(r.head.items, (i) => `${i.check} ${i.headClass}`),
    {
      "pdf-probe regression": 1344,
      "wpt regression": 38,
      "wpt undefined": 10,
      "value regression": 25,
      "status regression": 2,
    },
  );
  const gating = r.head.items.filter((i) => i.gating);
  assert.ok(gating.every((i) => i.class === "head-regression"));
  // The 10 step-06 rejections (css:page-varying-width) are declared, carried from 06 (I4).
  const declared = r.head.items.filter((i) => i.class === "declared");
  assert.equal(declared.length, 10);
  assert.ok(declared.every((i) => i.declaredAs.feature === "css:page-varying-width"));
  assert.equal(r.head.declarationsCarried, 1);
  // 07's manifest has no class-a acceptance: every legacy acceptance is ignored by the head.
  assert.equal(r.head.acceptancesCounted, 0);
  // Every gate canary is caught on this run.
  assert.ok(r.gateCanaries.every((c) => c.caught === true));
});

// The pin's pdf-probe covers all 9 fixtures since 2026-10-22 (fidelity/baselines/pin manifest
// pdfProbeRescore.inputMap; before, invoice + notification only). Under the merged 10-gate rules
// (I1 sign-crossing, off-page, I4 declarations; phaseb/10-integrate) the pin view is 1150 (c) at
// 07 and 1140 at 09; on the 2-fixture pin it was 254 / 241, under the old rules on the complete
// pin 816 / 809. Postmark: 152 at 07, 155 at 09 (the 3 "Download as PDF" words newly off-page
// since 08, gated by compareOffPage against the pin's off-page backfill).
const PIN_PDF_PROBE_BY_FIXTURE_07 = {
  boleto: 212,
  "boleto-febraban": 64,
  danfe: 248,
  invoice: 77,
  notification: 102,
  "oss-postmark-receipt": 152,
  "oss-sparksuite-invoice": 92,
  receipt: 8,
  "text-stress-ptbr": 120,
};
const PIN_PDF_PROBE_BY_FIXTURE_09 = { ...PIN_PDF_PROBE_BY_FIXTURE_07, "oss-postmark-receipt": 155 };
const pdfProbeByFixture = (items) =>
  tally(
    items.filter((i) => i.check === "pdf-probe"),
    (i) => i.key.split("|")[1],
  );

test("pin view of 07: 1150 items worse than the shipped main, all (c) while the ledger is empty", () => {
  assert.deepEqual(r.pin.counts, { a: 0, b: 0, c: 1150, declared: 10 });
  assert.equal(r.pin.mainMerge, "BLOCKED");
  assert.deepEqual(
    tally(r.pin.items, (i) => i.check),
    { "pdf-probe": 1075, wpt: 56, value: 27, status: 2 },
  );
  assert.deepEqual(pdfProbeByFixture(r.pin.items), PIN_PDF_PROBE_BY_FIXTURE_07);
  // The pin view reports; it gates only for a merge to main (--main).
  assert.equal(
    evaluateGate({
      before: s06,
      after: s07,
      pin,
      pinDeclared: c07.pin,
      main: true,
      ledgerBase: null,
      canaries: false,
    }).counts.gating,
    1150,
  );
});

// 09-review-fixes, gated post-hoc against 08 once both were re-scored to pdf-probe v2 (2026-10-22,
// fidelity/gate/snapshots/2026-10-22/ledger-09/). Versus 07: the HTML-only parse (08) retires the
// 9 postmark INV-X/EXT-2 head items (7 value + 2 status) and the 6 lost-pairing/unpaired items,
// and adds 4 dy items (postmark "The [Product Name] team" pairs again, dy 35.1 pt vs 32.1 pt).
const s08 = load("port", "08-html-parse");
const s09 = load("port", "09-review-fixes");
const c09 = carried("08-html-parse", "09-review-fixes", s09.manifest.declaredRejections ?? []);
const r09 = evaluateGate({
  before: s08,
  after: s09,
  head,
  pin,
  accept: s09.manifest.acceptedRegressions,
  declared: s09.manifest.declaredRejections ?? [],
  headDeclared: c09.head,
  pinDeclared: c09.pin,
  ledger: emptyLedger(),
  ledgerBase: null,
  passes: PASSES,
});

test("09 vs 08 (both v2) is unchanged link to link; 1386 items are worse than the head", () => {
  assert.deepEqual(r09.refusals, []);
  assert.equal(r09.counts.gating, 0);
  assert.equal(r09.head.counts.gating, 1386);
  assert.equal(r09.verdict, "FAIL");
  assert.deepEqual(
    tally(r09.head.items, (i) => `${i.check} ${i.headClass}`),
    {
      "pdf-probe regression": 1342,
      "wpt regression": 38,
      "wpt undefined": 10,
      "value regression": 6,
    },
  );
  assert.equal(r09.head.acceptancesCounted, 0);
  assert.ok(r09.gateCanaries.every((c) => c.caught === true));
});

test("pin view of 09: 1140 items worse than the shipped main, all (c) while the ledger is empty", () => {
  assert.deepEqual(r09.pin.counts, { a: 0, b: 0, c: 1140, declared: 10 });
  assert.equal(r09.pin.mainMerge, "BLOCKED");
  assert.deepEqual(
    tally(r09.pin.items, (i) => i.check),
    { "pdf-probe": 1078, wpt: 56, value: 16 },
  );
  // As at 07 except postmark: +3 newly off-page words ("Download as PDF", off the page since 08).
  assert.deepEqual(pdfProbeByFixture(r09.pin.items), PIN_PDF_PROBE_BY_FIXTURE_09);
});

// The committed merged-09 snapshot (phaseb/10-integrate, 2026-10-22,
// fidelity/gate/snapshots/2026-10-22/merged-09/): the same 09 vs 08 gate as above, written by
// run.mjs, and its ledger candidates under GATE-A1/A3-exact WPT classes with the raw-Blitz run of
// the 165 lost passes (--raw-wpt). The report must agree with the in-process evaluation above.
const merged09 = (f) =>
  JSON.parse(
    gunzipSync(
      readFileSync(resolve(baselines, "..", "gate", "snapshots", "2026-10-22", "merged-09", f)),
    ).toString("utf8"),
  );

test("merged-09 snapshot: head 1386 + 10 declared, pin (c) 1140 + 10 declared, as evaluated here", () => {
  const g = merged09("gate-report-09-vs-08-head-00-start.json.gz");
  assert.equal(g.counts.gating, 0);
  assert.equal(g.head.counts.gating, r09.head.counts.gating);
  assert.deepEqual(g.pin.counts, r09.pin.counts);
  assert.deepEqual(g.pin.counts, { a: 0, b: 0, c: 1140, declared: 10 });
  const m = merged09("gate-report-09-vs-pin-main.json.gz");
  assert.deepEqual(m.pin.counts, { a: 0, b: 0, c: 1140, declared: 10 });
  assert.equal(m.pin.mainMerge, "BLOCKED");
});

test("merged-09 candidates: WPT (a) only with old-pass evidence, raw Blitz splits b / c; lost text is c", () => {
  const c = merged09("ledger-candidates.json.gz");
  assert.deepEqual(c.sections.head.byCandidate, { none: 57, b: 1154, c: 30, a: 1, "b-page": 144 });
  assert.deepEqual(c.sections.pin.byCandidate, { none: 59, c: 57, b: 934, a: 1, "b-page": 89 });
  const wpt = (s) =>
    tally(
      s.items.filter((i) => i.check === "wpt"),
      (i) => i.candidate,
    );
  // = fidelity/gate/snapshots/2026-10-22/wpt-raw/wpt-raw-table.md per view.
  assert.deepEqual(wpt(c.sections.head), { b: 7, c: 30, a: 1 });
  assert.deepEqual(wpt(c.sections.pin), { b: 31, c: 14, a: 1 });
  // The 3 newly off-page postmark words and the 6 tokens they take from pdftotext / pymupdf.
  const pinC = c.sections.pin.items.filter((i) => i.candidate === "c");
  assert.deepEqual(
    pinC.filter((i) => i.key.includes("|off-page|")).map((i) => i.key.split("|")[3]),
    ["Download", "as", "PDF"],
  );
  assert.equal(pinC.filter((i) => i.key.includes("|missingTokens.")).length, 6);
});

// Port link 10-integration (2026-10-27, phaseb/10-final): run 20261023T004510Z re-gated against 09
// with the step's class-a acceptances and the committed DEBT.json (rules (i) and (ii)): PASS vs the
// previous link and vs the head; pin (c) 165 (fidelity/gate/snapshots/2026-10-27/10-final/).
test("10-integration vs 09 with its ledger: PASS vs 09 and vs the head, pin (c) 165", () => {
  const s09 = load("port", "09-review-fixes");
  const s10 = load("port", "10-integration");
  assert.equal(s10.integrity.ok, true, s10.integrity.problems.join("; "));
  assert.equal(s10.manifest.gate.verdict, "PASS");
  assert.equal(s10.manifest.gate.writtenDespiteVerdict, false);
  assert.equal(s10.manifest.gate.baseline, "fidelity/baselines/port/09-review-fixes");
  const accept = s10.manifest.acceptedRegressions;
  assert.equal(accept.length, 4);
  assert.ok(accept.every((e) => e.class === "a"));
  const c10 = carried("09-review-fixes", "10-integration", s10.manifest.declaredRejections ?? []);
  const g = evaluateGate({
    before: s09,
    after: s10,
    head,
    pin,
    accept,
    declared: s10.manifest.declaredRejections ?? [],
    headDeclared: c10.head,
    pinDeclared: c10.pin,
    ledger: loadDebt(LEDGER_10),
    ledgerBase: null,
    step: "10-integration",
    passes: PASSES,
    canaries: false,
  });
  assert.equal(g.counts.gating, 0);
  assert.equal(g.counts.accepted, 3);
  assert.equal(g.counts.improvement, 93);
  assert.equal(g.head.counts.gating, 0);
  assert.equal(g.head.counts.debt, 1169);
  assert.deepEqual(g.ledger.problems, []);
  assert.deepEqual(g.pin.counts, { a: 1, b: 693, c: 165, declared: 10 });
});
