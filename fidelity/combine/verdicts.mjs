// Pure mapping from each area's own output files to fidelity/ACCEPTANCE.md criterion verdicts.
// No I/O here: run-all.mjs reads the files and passes the parsed JSON, so every mapping rule is
// unit-tested in combine/test/verdicts.test.mjs (node --test) against planted inputs.
//
// The mapping itself is the integrator's reading of ACCEPTANCE.md (label: DESIGN TARGET). Where an
// area already evaluates a criterion by ID (corpus), its verdict is copied through unchanged.
import { classifyCheckFailures } from "../layout-diff/lib/expected-failures.mjs";

/** Verdict vocabulary (corpus uses PASS/FAIL/N/A/NOT-RUN; the oracles add warn/info). */
export const STATUSES = Object.freeze(["PASS", "FAIL", "WARN", "INFO", "N/A", "NOT-RUN"]);

/** 1 mm in PDF points (72 / 25.4). */
export const PT_PER_MM = 72 / 25.4;

/**
 * REF-W (ACCEPTANCE.md): max word-position error vs the consensus reference <= 1.0 mm, p95 <= 0.5 mm.
 * The oracles score against the Chrome/WeasyPrint midpoint only where both references agree within a
 * consensus tolerance (0.5, 1, 2 or 4 pt). 2 pt (0.71 mm) is the largest of those below the
 * criterion's own 1.0 mm, so a word the references place 1 mm apart is never used as ground truth.
 */
export const REF_W = Object.freeze({ consensusTolPt: 2, maxMm: 1.0, p95Mm: 0.5 });

const round = (x, d = 3) => (Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : x);

/** Map an oracle status (pass/warn/fail/info/not-run/skipped) to the verdict vocabulary. */
export function oracleStatus(status, { warnIs = "WARN" } = {}) {
  switch (status) {
    case "pass":
      return "PASS";
    case "fail":
      return "FAIL";
    case "warn":
      return warnIs;
    case "info":
      return "INFO";
    case "skipped":
      return "N/A";
    default:
      return "NOT-RUN";
  }
}

function verdict(criterion, oracle, status, value, extra = {}) {
  return { criterion, oracle, status, value: value ?? "", kind: "criterion", ...extra };
}

/**
 * corpus/report.json fixture entry -> verdicts. The corpus evaluates ACCEPTANCE criteria by ID for
 * vellora and for its Chrome reference; the vellora verdict is the verdict, Chrome is context.
 */
export function fromCorpusEntry(entry) {
  return (entry.criteria ?? []).map((c) =>
    verdict(c.id, "corpus", c.vellora?.status ?? "NOT-RUN", c.vellora?.value, {
      reference: c.chrome ? { engine: "chrome", status: c.chrome.status } : undefined,
    }),
  );
}

/** Key the corpus uses for a fixture variant (render-corpus.mjs: `${id}${suffix}`). */
export function corpusKey(entry) {
  const suffix =
    entry.data && entry.data !== "data.json"
      ? `.${entry.data.replace(/^data\.|\.json$/g, "")}`
      : "";
  return `${entry.id}${suffix}`;
}

/**
 * audit-existing-boleto.mjs JSON (fixtures/boleto data checked against the corpus validators) ->
 * BOL-D1 (DV geral), BOL-D2 (linha digitável DVs + rebuild), BOL-D3 (fator/valor vs printed).
 */
export function fromBoletoAudit(audit) {
  const b = audit?.barcode;
  const l = audit?.linhaDigitavel;
  if (!b || !l) {
    return [verdict("BOL-D1..D3", "corpus:audit", "NOT-RUN", "audit output missing")];
  }
  const fatorOk =
    b.fatorMeans?.firstCycle === b.printedVencimento ||
    b.fatorMeans?.secondCycle === b.printedVencimento;
  const valorOk = b.valorFieldMeans === b.printedValor;
  const badFields = (l.fieldDvs ?? []).filter((f) => f.printed !== f.expected).length;
  return [
    verdict(
      "BOL-D1",
      "corpus:audit",
      b.dvGeral?.ok ? "PASS" : "FAIL",
      `DV geral printed ${b.dvGeral?.actual}, expected ${b.dvGeral?.expected}`,
    ),
    verdict(
      "BOL-D2",
      "corpus:audit",
      l.ok && l.rebuildsPrintedBarcode ? "PASS" : "FAIL",
      `${badFields} of ${(l.fieldDvs ?? []).length} field DVs wrong; rebuilds printed barcode: ${l.rebuildsPrintedBarcode}`,
    ),
    verdict(
      "BOL-D3",
      "corpus:audit",
      fatorOk && valorOk ? "PASS" : "FAIL",
      `fator ${b.fator} -> ${b.fatorMeans?.firstCycle} / ${b.fatorMeans?.secondCycle} vs printed ${b.printedVencimento}; valor field ${b.valorFieldMeans} vs printed ${b.printedValor}`,
    ),
  ];
}

function textValue(text) {
  const parts = (text.extractors ?? []).map(
    (e) =>
      `${e.name} ${e.status}${e.subjectOnly ? ` (missing ${e.subjectOnly.missingCount ?? 0}, extra ${e.subjectOnly.extraCount ?? 0})` : ""}`,
  );
  return parts.length ? parts.join("; ") : (text.reason ?? "");
}

/** EXT-3 from the oracles' copy-paste check (NFC, no decomposed marks, diacritic words kept). */
function ext3(text) {
  if (!text || text.status === "not-run" || text.status === "skipped") {
    return verdict("EXT-3", "oracles:text", "NOT-RUN", text?.reason ?? "text oracle not run");
  }
  const ex = (text.extractors ?? []).filter((e) => e.copyPaste);
  if (!ex.length) {
    return verdict("EXT-3", "oracles:text", "NOT-RUN", "no extractor reported a copy-paste check");
  }
  const failed = ex.filter((e) => e.copyPaste.pass !== true);
  return verdict(
    "EXT-3",
    "oracles:text",
    failed.length ? "FAIL" : "PASS",
    failed.length
      ? `copy-paste failed in ${failed.map((e) => e.name).join(", ")}`
      : `copy-paste clean in ${ex.map((e) => e.name).join(", ")}`,
  );
}

/** REF-W from the oracles' layout-consensus record at REF_W.consensusTolPt. */
export function refW(layout) {
  if (!layout || layout.status === "not-run" || layout.status === "skipped") {
    return verdict("REF-W", "oracles:layout", "NOT-RUN", layout?.reason ?? "layout oracle not run");
  }
  const t = (layout.tolerances ?? []).find((x) => x.tol === REF_W.consensusTolPt);
  if (!t) {
    return verdict(
      "REF-W",
      "oracles:layout",
      "NOT-RUN",
      `no consensus at ${REF_W.consensusTolPt} pt`,
    );
  }
  const words = t.subjectError?.words ?? t.consensus ?? 0;
  if (!words) {
    return verdict(
      "REF-W",
      "oracles:layout",
      "NOT-RUN",
      `0 consensus words at ${REF_W.consensusTolPt} pt (coverage ${t.coverage})`,
    );
  }
  const maxMm = t.subjectError.maxDistance / PT_PER_MM;
  const p95Mm = t.subjectError.p95Distance / PT_PER_MM;
  const ok = maxMm <= REF_W.maxMm && p95Mm <= REF_W.p95Mm;
  return verdict(
    "REF-W",
    "oracles:layout",
    ok ? "PASS" : "FAIL",
    `max ${round(maxMm, 2)} mm, p95 ${round(p95Mm, 2)} mm over ${words} consensus words (Chrome and WeasyPrint within ${REF_W.consensusTolPt} pt; coverage ${t.coverage})`,
    { consensusTolPt: REF_W.consensusTolPt, coverage: t.coverage },
  );
}

/** REF-P from the page lists the layout oracle records for subject, Chrome and WeasyPrint. */
export function refP(layout) {
  const pages = layout?.pages;
  if (!pages?.subject || !pages?.chrome) {
    return verdict("REF-P", "oracles:layout", "NOT-RUN", layout?.reason ?? "no page lists");
  }
  const s = pages.subject.length;
  const c = pages.chrome.length;
  const w = pages.weasyprint ? pages.weasyprint.length : "n/a";
  return verdict(
    "REF-P",
    "oracles:layout",
    s === c ? "PASS" : "FAIL",
    `${s} pages vs Chrome ${c} (WeasyPrint ${w})`,
  );
}

/**
 * One oracles result.json (run-fixtures.mjs per fixture/mode, or run.mjs single PDF) -> verdicts.
 * mode "plain": the PDF claims nothing, so veraPDF is a NEGATIVE CONTROL (kind "control", excluded
 * from criterion totals). mode "pdfa": the PDF claims PDF/A-2b, so veraPDF decides PDF-A1.
 */
export function fromOracleRecord(record, { mode, docClass } = {}) {
  const r = record?.results;
  if (!r) {
    return [verdict("oracles", "oracles", "NOT-RUN", "result.json missing or unreadable")];
  }
  const out = [];
  const tag = { mode };
  if (r.qpdf) {
    // PDF-Q1 requires 0 errors AND 0 warnings, so a qpdf warning is a FAIL here.
    out.push(
      verdict(
        "PDF-Q1",
        "oracles:qpdf",
        oracleStatus(r.qpdf.status, { warnIs: "FAIL" }),
        r.qpdf.reason ?? (r.qpdf.structuralProblems?.length ? r.qpdf.structuralProblems[0] : ""),
        tag,
      ),
    );
  }
  if (r.verapdf) {
    const failed = r.verapdf.report?.rules?.length ?? 0;
    const value =
      r.verapdf.reason ??
      `compliant ${r.verapdf.compliant}${failed ? `, ${failed} failed rules` : ""}`;
    if (mode === "pdfa") {
      out.push(verdict("PDF-A1", "oracles:verapdf", oracleStatus(r.verapdf.status), value, tag));
    } else {
      out.push(
        verdict("PDF-A1", "oracles:verapdf", oracleStatus(r.verapdf.status), value, {
          ...tag,
          kind: "control",
          note: "plain render claims no PDF/A: veraPDF must report it non-compliant (negative control)",
        }),
      );
    }
  }
  if (typeof record.input?.deterministic === "boolean") {
    out.push(
      verdict(
        "DET-1",
        "oracles",
        record.input.deterministic ? "PASS" : "FAIL",
        "two in-process renders byte-identical",
        tag,
      ),
    );
  }
  if (mode === "pdfa") {
    return out;
  }
  if (r.text) {
    out.push(
      verdict("EXT-2", "oracles:text", oracleStatus(r.text.status), textValue(r.text), {
        ...tag,
        basis:
          "every body token of Chrome's own PDF of the same HTML (control) is present in vellora's PDF, per extractor (pdftotext, pdfminer.six, PyMuPDF); stricter than the corpus required-string list",
      }),
    );
    out.push({ ...ext3(r.text), ...tag });
  }
  if (r.barcode && r.barcode.status !== "skipped") {
    const id = docClass === "danfe" ? "DANFE-B1" : "BOL-B1";
    out.push(
      verdict(
        id,
        "oracles:barcode",
        oracleStatus(r.barcode.status),
        r.barcode.reason ?? (r.barcode.problems ?? []).join("; "),
        {
          ...tag,
          basis: "second decoder pair: zxing-cpp and zbar, plus the BCB mod-11/mod-10 DVs",
          ...(record.input?.expect?.note ? { note: record.input.expect.note } : {}),
        },
      ),
    );
  }
  if (r.layout) {
    out.push({ ...refP(r.layout), ...tag });
    out.push({ ...refW(r.layout), ...tag });
  }
  return out;
}

/** layout-diff checks that prove Chromium did NOT draw with vellora's bundled font files. */
export const FONT_PARITY_CHECKS = Object.freeze([
  "font_block_injected",
  "bundled_fonts_loaded",
  "platform_fonts_custom",
]);

/**
 * Cross-oracle consistency: layout-diff and the oracles inject the SAME alias table
 * (benchmarks/visual-fidelity.mjs FONT_ALIASES, copied with drift tests). When layout-diff measured
 * Chromium drawing a fixture with system fonts, the oracles' Chrome-referenced verdicts for that
 * fixture (text vs Chrome's PDF, layout consensus) were judged against a reference whose font
 * parity is not established. The status is kept; the verdict carries a caveat and is counted.
 */
export function annotateFontParity(verdicts, layoutDiff) {
  const failed = (layoutDiff?.checksFailed ?? []).filter((c) => FONT_PARITY_CHECKS.includes(c));
  if (!failed.length) return verdicts;
  return verdicts.map((v) =>
    v.oracle === "oracles:text" || v.oracle === "oracles:layout"
      ? {
          ...v,
          caveat: `reference font parity not established: layout-diff failed ${failed.join(", ")} for this fixture with the alias table the oracles also inject (CONFIRMED for layout-diff's Chromium; for the oracles' Chrome/WeasyPrint references an UNVERIFIED ASSUMPTION, same table)`,
        }
      : v,
  );
}

/** In-run determinism of the PDF/A variant run-all renders itself for corpus fixtures. */
export function pdfaDeterminism(det) {
  if (!det) {
    return verdict("DET-1", "run-all", "NOT-RUN", "PDF/A variant not rendered", { mode: "pdfa" });
  }
  return verdict(
    "DET-1",
    "run-all",
    det.identical ? "PASS" : "FAIL",
    `two in-process PDF/A-2b renders ${det.identical ? "byte-identical" : "DIFFER"} (${det.sha256})`,
    { mode: "pdfa" },
  );
}

/**
 * layout-diff summary-<label>.json fixture row -> attribution record. NOT a PASS/FAIL verdict: no
 * ACCEPTANCE criterion is decided by the pre-pagination diff (LET-1/LET-2 need pagination, REF-W is
 * the oracles' consensus). The checks tell whether the attribution can be trusted.
 */
export function fromLayoutDiffRow(row, { expectedFailures = [] } = {}) {
  if (!row) {
    return { status: "not-run", reason: "fixture missing from the layout-diff summary" };
  }
  const box = row.first_box;
  const text = row.first_text;
  const layer = finalLayer(row);
  // The FINAL layer is the last layout_normalize pass in layer_stats order. per_layer key order
  // ends with the diagnostic unrounded layers (N0u, B0u), which are NOT the final layout: taking
  // the last key reported B0u (Phase A known issue, fixed here).
  const final = (item) => {
    if (!item?.per_layer) return null;
    const delta = layer ? item.per_layer[layer] : null;
    return delta ? { layer, ...delta } : null;
  };
  const checks = classifyCheckFailures(row.fixture, row.checks_summary ?? {}, expectedFailures);
  const regressions = Object.fromEntries(
    Object.entries(row.regressions_by_layer ?? {})
      .filter(([, x]) => x.box_events_vs_previous_layer || x.text_events_vs_previous_layer)
      .map(([layer, x]) => [
        layer,
        { box: x.box_events_vs_previous_layer, text: x.text_events_vs_previous_layer },
      ]),
  );
  return {
    status: "ran",
    attributionValid: row.attribution_valid ?? row.checks_summary?.attribution_valid ?? null,
    checksFailed: row.checks_summary?.failed ?? [],
    checksWarned: row.checks_summary?.warned ?? [],
    checksNotRun: row.checks_summary?.not_run ?? [],
    // Allowlist (fidelity/layout-diff/expected-check-failures.json): failures with a recorded
    // reason and expiry condition do not gate; an entry whose check passes has EXPIRED and gates.
    checksExpectedFailures: checks.expected,
    checksUnexpectedFailures: checks.unexpected,
    checksExpired: checks.expired,
    finalLayer: layer,
    firstBox: box
      ? {
          type: box.type,
          path: box.path,
          firstOverTolerance: box.first_over_tolerance,
          dominantLayer: box.dominant_layer,
          finalDelta: final(box),
        }
      : null,
    firstText: text
      ? {
          text: text.text,
          owner: text.owner,
          firstOverTolerance: text.first_over_tolerance,
          dominantLayer: text.dominant_layer,
          finalDelta: final(text),
        }
      : null,
    firstPassRegression: row.first_pass_regression?.box
      ? {
          path: row.first_pass_regression.box.path,
          type: row.first_pass_regression.box.type,
          by: (row.first_pass_regression.box.regressed_by ?? [])
            .filter((w) => !w.first)
            .map((w) => `${w.layer} ${w.kind}${w.coord ? ` ${w.coord} ${w.from}->${w.to}` : ""}`),
        }
      : null,
    regressionEventsByLayer: regressions,
    htmlNormalize: row.html_normalize ?? null,
  };
}

/** Last layout_normalize pass of a layout-diff summary row (layer_stats order), else last real layer. */
export function finalLayer(row) {
  const stats = row?.layer_stats ?? [];
  const pass = stats.filter((l) => l.kind === "pass").at(-1);
  if (pass) return pass.layer;
  const real = stats.filter((l) => !/u$/.test(l.layer)).at(-1);
  if (real) return real.layer;
  const keys = Object.keys(row?.first_box?.per_layer ?? row?.first_text?.per_layer ?? {});
  return keys.filter((k) => !/u$/.test(k)).at(-1) ?? null;
}

/** WPT summary.json + ratchet.json -> per-directory pass rates and WPT-1 / WPT-2 verdicts. */
export function fromWpt(summary, ratchet) {
  if (!summary?.summary) {
    return {
      status: "not-run",
      criteria: [
        verdict("WPT-1", "wpt", "NOT-RUN", "summary.json missing"),
        verdict("WPT-2", "wpt", "NOT-RUN", "summary.json missing"),
      ],
    };
  }
  const row = (r) => ({
    reftests: r.reftests,
    pass: r.pass,
    passClean: r.passClean,
    passBlank: r["pass-blank"],
    fail: r.fail,
    unsupported: r.unsupported,
    error: r.error,
    timeout: r.timeout,
    skip: r.skip,
    passRate: r.passRate,
    passRateEvaluated: r.passRateEvaluated,
    passRateClean: r.passRateClean,
  });
  const s = summary.summary;
  const pinOk = summary.wptPin?.ok === true;
  const complete = s.totals.reftests > 0;
  const wpt1 = verdict(
    "WPT-1",
    "wpt",
    pinOk && complete ? "PASS" : "FAIL",
    !pinOk
      ? `WPT tree is not the pin: ${(summary.wptPin?.problems ?? []).join("; ")}`
      : complete
        ? `WPT ${summary.wptCommit} exact pin; ${s.totals.reftests} reftests recorded`
        : `WPT ${summary.wptCommit} exact pin but 0 reftests recorded`,
  );
  let wpt2;
  if (!ratchet) {
    wpt2 = verdict("WPT-2", "wpt", "NOT-RUN", "no ratchet.json (no expectations for this engine)");
  } else if (ratchet.status !== "ok") {
    wpt2 = verdict("WPT-2", "wpt", "NOT-RUN", ratchet.reason ?? `ratchet ${ratchet.status}`);
  } else {
    // Only CLEAN passes gate (fidelity/ACCEPTANCE.md WPT-2): a flagged pass was never proven.
    const n = ratchet.counts?.regressions ?? 0;
    const clean = ratchet.counts?.regressionsOfCleanPasses ?? n;
    wpt2 = verdict(
      "WPT-2",
      "wpt",
      clean === 0 ? "PASS" : "FAIL",
      `${clean} regressions of clean passes (${n - clean} of flagged passes, reported only), ${ratchet.counts?.improvements ?? 0} improvements, ${ratchet.counts?.unchanged ?? 0} unchanged vs ${ratchet.expectationsEngine ?? "baseline"}`,
      {
        metrics: [
          { metric: "cleanPassRegressions", value: clean, better: "lower", tolClass: "count" },
          { metric: "flaggedPassRegressions", value: n - clean, better: "info" },
        ],
      },
    );
  }
  return {
    status: "ran",
    engineId: summary.engineId,
    wptCommit: summary.wptCommit,
    velloraCommit: summary.velloraCommit,
    chromeOracle: summary.chromeVersion ? `ran (${summary.chromeVersion})` : "not run",
    passRateCleanNote: summary.chromeVersion
      ? "passClean excludes every suspect-pass flag, including the Chrome ink flags"
      : "passClean excludes only the deterministic suspect-pass flags: the Chrome ink flags need --wpt-chrome, so it is HIGHER than a run with the Chrome oracle",
    totals: row(s.totals),
    bySuite: Object.fromEntries(Object.entries(s.bySuite).map(([k, v]) => [k, row(v)])),
    ratchet: ratchet
      ? { status: ratchet.status, counts: ratchet.counts ?? null, reason: ratchet.reason ?? null }
      : null,
    criteria: [wpt1, wpt2],
  };
}

/**
 * WPT-3: the WPT crashtests of the default suites (fidelity/wpt/crashtests.mjs) - no panic, crash
 * or timeout. Absolute here; the gate also ratchets each test (ok -> panic/crash/timeout gates).
 */
export function fromCrashtests(doc, step) {
  if (!doc?.results) {
    return verdict("WPT-3", "wpt:crashtests", "NOT-RUN", step?.reason ?? "crashtests.json missing");
  }
  const bad = Object.entries(doc.results).filter(([, o]) =>
    ["panic", "crash", "timeout"].includes(o),
  );
  const harness = Object.values(doc.results).filter((o) => o === "error").length;
  const total = Object.keys(doc.results).length;
  return verdict(
    "WPT-3",
    "wpt:crashtests",
    bad.length ? "FAIL" : "PASS",
    `${bad.length} of ${total} crashtests panic/crash/time out${
      bad.length
        ? `: ${bad
            .slice(0, 4)
            .map(([t, o]) => `${t} ${o}`)
            .join("; ")}`
        : ""
    }; ${harness} harness error(s); counts ${JSON.stringify(doc.counts)}`,
    {
      metrics: [
        { metric: "broken", value: bad.length, better: "lower", tolClass: "count" },
        { metric: "total", value: total, better: "info" },
      ],
    },
  );
}

/**
 * Canary counts (fidelity/README.md "trusted only after it caught a broken input"): detection
 * canaries have caught true/false, measurement rows caught null (they show a behaviour, they do
 * not test an oracle).
 */
export function canaryCounts(canaries) {
  const list = canaries ?? [];
  const detection = list.filter((c) => c.caught !== null);
  return {
    total: list.length,
    detection: detection.length,
    caught: detection.filter((c) => c.caught === true).length,
    notCaught: detection.filter((c) => c.ran !== false && c.caught === false).length,
    notRun: list.filter((c) => c.ran === false).length,
    measurement: list.filter((c) => c.caught === null).length,
  };
}

/** Count statuses of criterion verdicts (controls excluded), optionally skipping diagnostics. */
export function tally(fixtures, { includeDiagnostic = true } = {}) {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  const byOracle = {};
  let caveated = 0;
  for (const f of fixtures) {
    if (f.diagnostic && !includeDiagnostic) continue;
    for (const v of f.verdicts) {
      if (v.kind !== "criterion") continue;
      if (v.caveat) caveated++;
      counts[v.status] = (counts[v.status] ?? 0) + 1;
      byOracle[v.oracle] ??= Object.fromEntries(STATUSES.map((s) => [s, 0]));
      byOracle[v.oracle][v.status] = (byOracle[v.oracle][v.status] ?? 0) + 1;
    }
  }
  return { counts, byOracle, caveated };
}

/** Controls whose outcome is not the expected one (a broken oracle would show up here). */
export function failedControls(fixtures) {
  return fixtures.flatMap((f) =>
    f.verdicts
      .filter((v) => v.kind === "control" && v.status !== "PASS")
      .map((v) => ({ fixture: f.key, criterion: v.criterion, status: v.status, value: v.value })),
  );
}
