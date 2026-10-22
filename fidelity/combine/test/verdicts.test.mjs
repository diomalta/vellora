// Self-tests of the run-all combiner (node --test; the root vitest only globs packages/*).
// Per fidelity/README.md an oracle is trusted only after it catches a broken input, so every
// mapping below is also fed a planted defect and must report it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { mergePins, parsePins, portable, requirementFiles } from "../env.mjs";
import {
  FONT_PARITY_CHECKS,
  PT_PER_MM,
  REF_W,
  annotateFontParity,
  corpusKey,
  failedControls,
  fromBoletoAudit,
  fromCorpusEntry,
  fromLayoutDiffRow,
  fromOracleRecord,
  fromWpt,
  missingTokensOf,
  oracleStatus,
  pdfaDeterminism,
  refP,
  refW,
  tally,
} from "../verdicts.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const find = (verdicts, id, mode) =>
  verdicts.find((v) => v.criterion === id && (mode === undefined || v.mode === mode));

function layoutRecord({ maxPt, p95Pt, words = 100, pages = [1, 1, 1] }) {
  const pageList = (n) => Array.from({ length: n }, (_, i) => ({ page: i + 1 }));
  return {
    status: "info",
    pages: {
      subject: pageList(pages[0]),
      chrome: pageList(pages[1]),
      weasyprint: pageList(pages[2]),
    },
    tolerances: [0.5, 1, 2, 4].map((tol) => ({
      tol,
      coverage: 0.5,
      consensus: words,
      subjectError: { words, maxDistance: maxPt, p95Distance: p95Pt },
    })),
  };
}

function oracleRecord({
  qpdf = "pass",
  verapdf = "pass",
  compliant = false,
  text = "pass",
  copyPaste = [true, true, true],
  layout = layoutRecord({ maxPt: 1, p95Pt: 0.5 }),
  barcode = { status: "skipped", reason: "no barcode" },
  deterministic = true,
} = {}) {
  return {
    input: { deterministic },
    results: {
      qpdf: { status: qpdf, structuralProblems: [] },
      verapdf: { status: verapdf, compliant, report: { rules: [] } },
      text: {
        status: text,
        extractors: ["pdftotext", "pdfminer.six", "pymupdf"].map((name, i) => ({
          name,
          status: text,
          copyPaste: { pass: copyPaste[i] },
          subjectOnly: { missingCount: text === "fail" ? 1 : 0, extraCount: 0 },
        })),
      },
      barcode,
      layout,
    },
  };
}

test("oracle statuses map onto the verdict vocabulary; a qpdf warning can be made a FAIL", () => {
  assert.equal(oracleStatus("pass"), "PASS");
  assert.equal(oracleStatus("fail"), "FAIL");
  assert.equal(oracleStatus("warn"), "WARN");
  assert.equal(oracleStatus("warn", { warnIs: "FAIL" }), "FAIL");
  assert.equal(oracleStatus("info"), "INFO");
  assert.equal(oracleStatus("skipped"), "N/A");
  assert.equal(oracleStatus("not-run"), "NOT-RUN");
  assert.equal(oracleStatus(undefined), "NOT-RUN");
});

test("corpus verdicts are copied by criterion ID; Chrome is context only", () => {
  const v = fromCorpusEntry({
    criteria: [
      { id: "INV-I1", vellora: { status: "FAIL", value: "0" }, chrome: { status: "PASS" } },
      { id: "DET-1", vellora: { status: "PASS", value: "true" }, chrome: { status: "N/A" } },
    ],
  });
  assert.deepEqual(
    v.map((x) => [x.criterion, x.status, x.reference.status]),
    [
      ["INV-I1", "FAIL", "PASS"],
      ["DET-1", "PASS", "N/A"],
    ],
  );
  assert.equal(corpusKey({ id: "boleto-febraban", data: "data.json" }), "boleto-febraban");
  assert.equal(
    corpusKey({ id: "boleto-febraban", data: "data.px-grid.json" }),
    "boleto-febraban.px-grid",
  );
});

test("boleto audit: wrong DVs / fator / valor fail BOL-D1..D3, consistent data passes", () => {
  const bad = fromBoletoAudit({
    barcode: {
      dvGeral: { ok: false, expected: 5, actual: 1 },
      fator: 9999,
      fatorMeans: { firstCycle: "2025-02-21", secondCycle: "2049-10-13" },
      printedVencimento: "2026-07-15",
      valorFieldMeans: 123.45,
      printedValor: 1842.5,
    },
    linhaDigitavel: {
      ok: false,
      rebuildsPrintedBarcode: true,
      fieldDvs: [{ printed: 1, expected: 4 }],
    },
  });
  assert.deepEqual(
    bad.map((v) => v.status),
    ["FAIL", "FAIL", "FAIL"],
  );
  const good = fromBoletoAudit({
    barcode: {
      dvGeral: { ok: true },
      fator: 1646,
      fatorMeans: { firstCycle: "2004-04-08", secondCycle: "2026-11-30" },
      printedVencimento: "2026-11-30",
      valorFieldMeans: 1842.5,
      printedValor: 1842.5,
    },
    linhaDigitavel: { ok: true, rebuildsPrintedBarcode: true, fieldDvs: [] },
  });
  assert.deepEqual(
    good.map((v) => v.status),
    ["PASS", "PASS", "PASS"],
  );
  assert.equal(fromBoletoAudit(null)[0].status, "NOT-RUN");
});

test("plain mode: veraPDF is a negative control, excluded from criterion totals", () => {
  const v = fromOracleRecord(oracleRecord(), { mode: "plain", docClass: "invoice" });
  const a1 = find(v, "PDF-A1");
  assert.equal(a1.kind, "control");
  assert.equal(a1.status, "PASS");
  assert.equal(find(v, "PDF-Q1").status, "PASS");
  assert.equal(find(v, "DET-1").status, "PASS");
  assert.equal(find(v, "EXT-2").status, "PASS");
  assert.equal(find(v, "EXT-3").status, "PASS");
  assert.equal(find(v, "BOL-B1"), undefined, "a skipped barcode oracle is not a verdict");
  const fx = [{ key: "x", verdicts: v }];
  assert.equal(
    Object.values(tally(fx).counts).reduce((a, b) => a + b, 0),
    v.filter((x) => x.kind === "criterion").length,
  );
  assert.deepEqual(failedControls(fx), []);
});

test("planted defects are reported: qpdf warning, broken control, text loss, NFD, bad barcode", () => {
  const v = fromOracleRecord(
    oracleRecord({
      qpdf: "warn",
      verapdf: "fail",
      compliant: true,
      text: "fail",
      copyPaste: [true, false, true],
      barcode: { status: "fail", problems: ["decoded digits differ"] },
      deterministic: false,
    }),
    { mode: "plain", docClass: "boleto" },
  );
  assert.equal(find(v, "PDF-Q1").status, "FAIL", "PDF-Q1 allows 0 warnings");
  assert.equal(find(v, "EXT-2").status, "FAIL");
  assert.equal(find(v, "EXT-3").status, "FAIL");
  assert.match(find(v, "EXT-3").value, /pdfminer\.six/);
  assert.equal(find(v, "BOL-B1").status, "FAIL");
  assert.equal(find(v, "DET-1").status, "FAIL");
  assert.deepEqual(
    failedControls([{ key: "boleto", verdicts: v }]).map((c) => [c.criterion, c.status]),
    [["PDF-A1", "FAIL"]],
  );
});

test("pdfa mode: veraPDF decides PDF-A1 as a criterion; text/layout are not re-scored", () => {
  const ok = fromOracleRecord(oracleRecord({ compliant: true }), { mode: "pdfa" });
  assert.equal(find(ok, "PDF-A1").kind, "criterion");
  assert.equal(find(ok, "PDF-A1").status, "PASS");
  assert.equal(find(ok, "EXT-2"), undefined);
  assert.equal(find(ok, "REF-W"), undefined);
  const broken = fromOracleRecord(oracleRecord({ verapdf: "fail", compliant: false }), {
    mode: "pdfa",
  });
  assert.equal(find(broken, "PDF-A1").status, "FAIL");
  assert.equal(fromOracleRecord(null, { mode: "pdfa" })[0].status, "NOT-RUN");
});

test("DANFE barcode maps to DANFE-B1 and stays NOT-RUN (Code 128 not implemented)", () => {
  const v = fromOracleRecord(
    oracleRecord({ barcode: { status: "not-run", reason: "only ITF is implemented" } }),
    { mode: "plain", docClass: "danfe" },
  );
  assert.equal(find(v, "DANFE-B1").status, "NOT-RUN");
  assert.equal(find(v, "BOL-B1"), undefined);
});

test("REF-W thresholds: 1.0 mm max and 0.5 mm p95 at the 2 pt consensus, in mm", () => {
  assert.equal(REF_W.consensusTolPt, 2);
  const justInside = refW(layoutRecord({ maxPt: 0.99 * PT_PER_MM, p95Pt: 0.49 * PT_PER_MM }));
  assert.equal(justInside.status, "PASS");
  // The beta.4 notification regression (about 22.5 pt) must fail by a wide margin.
  assert.equal(refW(layoutRecord({ maxPt: 22.5, p95Pt: 0.3 })).status, "FAIL");
  // A p95 over 0.5 mm fails even when the max is fine.
  assert.equal(refW(layoutRecord({ maxPt: 2.5, p95Pt: 0.51 * PT_PER_MM })).status, "FAIL");
  assert.equal(refW(layoutRecord({ maxPt: 1, p95Pt: 1, words: 0 })).status, "NOT-RUN");
  assert.equal(refW({ status: "not-run", reason: "no Chrome" }).status, "NOT-RUN");
  assert.equal(refP(layoutRecord({ maxPt: 1, p95Pt: 1, pages: [2, 3, 3] })).status, "FAIL");
  assert.equal(refP(layoutRecord({ maxPt: 1, p95Pt: 1, pages: [3, 3, 2] })).status, "PASS");
});

test("PDF/A determinism of the run-all render: identical -> PASS, differing -> FAIL", () => {
  assert.equal(pdfaDeterminism({ identical: true, sha256: "a" }).status, "PASS");
  assert.equal(pdfaDeterminism({ identical: false, sha256: "a" }).status, "FAIL");
  assert.equal(pdfaDeterminism(undefined).status, "NOT-RUN");
});

test("WPT: per-directory rows, pin -> WPT-1, ratchet -> WPT-2 (regression, not-run, missing)", () => {
  const row = (pass) => ({
    reftests: 10,
    pass,
    passClean: pass,
    "pass-blank": 0,
    fail: 10 - pass,
    unsupported: 0,
    error: 0,
    timeout: 0,
    skip: 0,
    passRate: pass * 10,
    passRateEvaluated: pass * 10,
    passRateClean: pass * 10,
  });
  const summary = {
    engineId: "blitz-x",
    wptCommit: "abc",
    wptPin: { ok: true, problems: [] },
    chromeVersion: null,
    summary: { totals: row(5), bySuite: { "css/a": row(5) } },
  };
  const ok = fromWpt(summary, { status: "ok", counts: { regressions: 0, unchanged: 10 } });
  assert.equal(ok.bySuite["css/a"].passRate, 50);
  assert.deepEqual(
    ok.criteria.map((c) => c.status),
    ["PASS", "PASS"],
  );
  assert.match(ok.passRateCleanNote, /HIGHER/);
  const regressed = fromWpt(summary, { status: "ok", counts: { regressions: 1 } });
  assert.equal(regressed.criteria[1].status, "FAIL");
  const refused = fromWpt(summary, { status: "not-run", reason: "other WPT commit" });
  assert.equal(refused.criteria[1].status, "NOT-RUN");
  assert.match(refused.criteria[1].value, /other WPT commit/);
  const unpinned = fromWpt({ ...summary, wptPin: { ok: false, problems: ["dirty"] } }, null);
  assert.equal(unpinned.criteria[0].status, "FAIL");
  assert.equal(unpinned.criteria[1].status, "NOT-RUN");
  assert.equal(fromWpt(null, null).status, "not-run");
});

test("layout-diff rows from the committed 2026-10-21 snapshot: attribution, not verdicts", () => {
  const snap = JSON.parse(
    readFileSync(
      join(repoRoot, "fidelity/layout-diff/snapshots/2026-10-21/summary-pin.json"),
      "utf8",
    ),
  );
  const row = (id) => snap.fixtures.find((f) => f.fixture === id);
  const invoice = fromLayoutDiffRow(row("invoice"));
  assert.equal(invoice.status, "ran");
  assert.equal(invoice.attributionValid, true);
  assert.equal(invoice.firstBox.firstOverTolerance, "N0");
  assert.ok(invoice.firstBox.finalDelta, "final-layer delta is taken from the last layer");
  // receipt carries the known html_normalize defect: its self-consistency checks fail.
  const receipt = fromLayoutDiffRow(row("receipt"));
  assert.ok(receipt.checksFailed.includes("normalize_dom_roundtrip"));
  assert.equal(fromLayoutDiffRow(undefined).status, "not-run");
  assert.equal("verdicts" in invoice, false);
});

test("font-parity failure in layout-diff puts a caveat on Chrome-referenced oracle verdicts", () => {
  const v = fromOracleRecord(oracleRecord(), { mode: "plain", docClass: "receipt" });
  const clean = annotateFontParity(v, { checksFailed: ["normalize_dom_roundtrip"] });
  assert.equal(
    clean.some((x) => x.caveat),
    false,
    "a self-consistency failure is not a font-parity failure",
  );
  const flagged = annotateFontParity(v, {
    checksFailed: ["bundled_fonts_loaded", "platform_fonts_custom"],
  });
  for (const id of ["EXT-2", "EXT-3", "REF-P", "REF-W"]) {
    assert.match(find(flagged, id).caveat, /bundled_fonts_loaded, platform_fonts_custom/);
    assert.equal(find(flagged, id).status, find(v, id).status, "the status is never changed");
  }
  assert.equal(find(flagged, "PDF-Q1").caveat, undefined, "qpdf does not use a reference");
  assert.equal(tally([{ key: "r", verdicts: flagged }]).caveated, 4);
  assert.deepEqual(FONT_PARITY_CHECKS, [
    "font_block_injected",
    "bundled_fonts_loaded",
    "platform_fonts_custom",
  ]);
});

test("tally counts criteria only and can leave DIAGNOSTIC variants out", () => {
  const fx = [
    {
      key: "a",
      diagnostic: false,
      verdicts: [
        { criterion: "X", oracle: "o", status: "PASS", kind: "criterion" },
        { criterion: "Y", oracle: "o", status: "PASS", kind: "control" },
      ],
    },
    {
      key: "b",
      diagnostic: true,
      verdicts: [{ criterion: "X", oracle: "o", status: "FAIL", kind: "criterion" }],
    },
  ];
  assert.equal(tally(fx).counts.PASS, 1);
  assert.equal(tally(fx).counts.FAIL, 1);
  assert.equal(tally(fx, { includeDiagnostic: false }).counts.FAIL, 0);
});

test("requirements pins: a version conflict is detected; the shared venv files agree", () => {
  const pins = parsePins(
    "# c\nzxing-cpp==3.1.1\npillow==12.3.0 \\\n    --hash=sha256:abc\npdfminer.six==20260107\n",
  );
  assert.deepEqual(pins, { "zxing-cpp": "3.1.1", pillow: "12.3.0", "pdfminer-six": "20260107" });
  const planted = mergePins([
    { file: "a", pins: { pillow: "12.3.0" } },
    { file: "b", pins: { pillow: "13.0.0" } },
  ]);
  assert.equal(planted.conflicts.length, 1);
  // fidelity/.venv is shared by oracles and corpus: their pins must never diverge again.
  const real = mergePins(requirementFiles(repoRoot));
  assert.deepEqual(real.conflicts, []);
  assert.equal(real.merged.pillow.version, "12.3.0");
});

test("portable() strips the repo root and the home directory from recorded paths", () => {
  const out = portable({ a: `${repoRoot}/x`, b: [`${process.env.HOME}/y`], c: 1 }, repoRoot);
  assert.deepEqual(out, { a: "<repo>/x", b: ["~/y"], c: 1 });
});

test("EXT-2 carries the missing tokens per extractor (the gate ratchets the SET, 2026-10-22)", () => {
  const text = {
    status: "fail",
    extractors: [
      {
        name: "pdftotext",
        status: "fail",
        subjectOnly: { missing: ["a", "b"], missingAll: ["a", "b", "a"], missingCount: 3 },
      },
      { name: "pymupdf", status: "fail", subjectOnly: { missing: ["x"], missingCount: 41 } },
      { name: "pdfminer.six", status: "pass", subjectOnly: { missing: [], missingCount: 0 } },
    ],
  };
  assert.deepEqual(missingTokensOf(text), {
    pdftotext: { tokens: ["a", "b", "a"], count: 3, complete: true },
    // A record that kept only the report's first 40: incomplete, the gate falls back to counts.
    pymupdf: { tokens: ["x"], count: 41, complete: false },
    "pdfminer.six": { tokens: [], count: 0, complete: true },
  });
  const v = fromOracleRecord({ results: { text } }, { mode: "plain" });
  assert.deepEqual(find(v, "EXT-2").missingTokens, missingTokensOf(text));
  assert.equal(missingTokensOf({ extractors: [] }), null);
});
