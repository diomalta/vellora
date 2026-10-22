// The head ratchet and the pin view on the committed chain (no render): 07-media-print gated
// post-hoc against 06 (and, below, 09-review-fixes against 08) with --head 00-start and the
// (empty) DEBT.json, and classed against the shipped main (pin). Numbers are asserted so a change of the rules or of
// the committed data is visible here; their reading is in fidelity/baselines/port/README.md
// ("Head ratchet and debt ledger").
import assert from "node:assert/strict";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DEBT_FILE, loadDebt } from "../debt.mjs";
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
const r = evaluateGate({
  before: s06,
  after: s07,
  head,
  pin,
  accept: s07.manifest.acceptedRegressions,
  declared: s07.manifest.declaredRejections ?? [],
  headDeclared: c07.head,
  pinDeclared: c07.pin,
  ledger: loadDebt(DEBT_FILE),
  ledgerBase: null,
  passes: PASSES,
});
const tally = (items, f) => {
  const out = {};
  for (const i of items) out[f(i)] = (out[f(i)] ?? 0) + 1;
  return out;
};

test("the committed DEBT.json is the empty vellora-fidelity/debt/2 ledger", () => {
  const l = loadDebt(DEBT_FILE);
  assert.equal(l.schema, "vellora-fidelity/debt/2");
  assert.equal(l.migratedFrom, undefined);
  assert.deepEqual(l.entries, []);
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
  ledger: loadDebt(DEBT_FILE),
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
