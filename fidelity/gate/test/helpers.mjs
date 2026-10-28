// Synthetic snapshots for the gate self-tests.

export function fixture(key, verdicts, layoutDiff = { status: "not-run" }) {
  return { key, fixture: key, class: key, diagnostic: false, verdicts, layoutDiff };
}

export function v(criterion, oracle, status, value, extra = {}) {
  return { criterion, oracle, status, value, kind: "criterion", ...extra };
}

export function snapshot(fixtures, extra = {}) {
  return {
    source: { kind: "test", schema: "test" },
    integrity: { ok: true, checked: 0, problems: [] },
    fixtures,
    wpt: { expectations: null },
    crashtests: null,
    pdfProbe: null,
    canaries: null,
    codeChecks: null,
    steps: [],
    ...extra,
  };
}

export function expectations(results, suspectPasses = {}, extra = {}) {
  return {
    schema: 2,
    engine: "blitz-test",
    wptCommit: "a".repeat(40),
    comparison: {
      semantics: 2,
      chainReferences: false,
      inlineCss: true,
      raster: { tool: "pdftocairo", dpi: 96, antialias: true },
    },
    inkCheck: "chrome Chrome/155.0.8059.85",
    suites: ["css/CSS2/box", "css/CSS2/tables"],
    results,
    suspectPasses,
    ...extra,
  };
}

export const gating = (report) => report.items.filter((i) => i.gating);
export const byKey = (report, key) => report.items.find((i) => i.key === key);
