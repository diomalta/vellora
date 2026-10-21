// Value metrics of a verdict row. Pure: no I/O.
//
// The committed Phase A baselines (fidelity/baselines/pin, beta4) carry verdict VALUES only as
// strings ("max 3.6 mm, p95 3.48 mm over 235 consensus words ..."), so the ratchet derives every
// metric with ONE parser applied identically to the baseline and to the current run: what is
// compared is always produced by the same code. A verdict that already carries structured
// `metrics` (criteria added by the gate work, e.g. LET-1) is used as-is. Strings are never
// compared for equality (font subset prefixes such as "GSCMBG+" change with every build).
//
// Metric record: { metric, value (number | null), unmeasured (reason when value is null),
// better: "lower" | "higher" | "info", tolClass (key of TOLERANCES; absent for "info") }.

const N = String.raw`(-?\d+(?:\.\d+)?)`;
const re = (s, flags = "") => new RegExp(s, flags);

const metric = (name, value, better, tolClass, extra = {}) => ({
  metric: name,
  value: Number.isFinite(value) ? value : null,
  better,
  ...(tolClass ? { tolClass } : {}),
  ...extra,
});
const info = (name, value) => metric(name, value, "info");
const unmeasured = (name, reason, better, tolClass) => ({
  metric: name,
  value: null,
  unmeasured: reason,
  better,
  tolClass,
});

/** Excess of v outside [lo, hi] (0 inside). */
export function excess(v, lo, hi) {
  if (v < lo) return lo - v;
  if (v > hi) return v - hi;
  return 0;
}

const round = (x, d = 6) => Math.round(x * 10 ** d) / 10 ** d;

/** Every value pattern the Phase A verdicts use, most specific first. */
const PARSERS = [
  // REF-W (oracles:layout): position error vs the Chrome/WeasyPrint consensus.
  (s) => {
    const m = s.match(re(`^max ${N} mm, p95 ${N} mm over (\\d+) consensus words.*?coverage ${N}`));
    if (!m) return null;
    return [
      metric("maxMm", Number(m[1]), "lower", "position-mm"),
      metric("p95Mm", Number(m[2]), "lower", "position-mm"),
      info("consensusWords", Number(m[3])),
      info("coverage", Number(m[4])),
    ];
  },
  // REF-P (oracles:layout).
  (s) => {
    const m = s.match(/^(\d+) pages vs Chrome (\d+) \(WeasyPrint (\d+|n\/a)\)/);
    if (!m) return null;
    return [
      metric("pageDelta", Math.abs(Number(m[1]) - Number(m[2])), "lower", "page-delta"),
      info("pages", Number(m[1])),
      info("referencePages", Number(m[2])),
    ];
  },
  // INV-I1: "1 (expected >= 1)".
  (s) => {
    const m = s.match(/^(\d+) \(expected >= (\d+)\)/);
    if (!m) return null;
    return [
      metric("shortfall", Math.max(0, Number(m[2]) - Number(m[1])), "lower", "count"),
      info("value", Number(m[1])),
    ];
  },
  // Page counts: "2 (expected 1)" (BOL-P1, DANFE-P1, INV-P1), "8 vs reference 7" (TXT-P1, INV-P2).
  (s) => {
    const m = s.match(/^(\d+) \(expected (\d+)\)$/) ?? s.match(/^(\d+) vs reference (\d+)$/);
    if (!m) return null;
    return [
      metric("pageDelta", Math.abs(Number(m[1]) - Number(m[2])), "lower", "page-delta"),
      info("pages", Number(m[1])),
    ];
  },
  // Geometry against a spec window (mm).
  (s) => {
    const m = s.match(re(`^${N} \\(target ${N} ± ${N}\\)`));
    if (!m) return null;
    const [v, t, tol] = [Number(m[1]), Number(m[2]), Number(m[3])];
    return [
      metric("excess", round(excess(v, t - tol, t + tol)), "lower", "geometry-excess-mm"),
      info("value", v),
    ];
  },
  (s) => {
    const m = s.match(re(`^${N} \\(in \\[${N}, ${N}\\]\\)`));
    if (!m) return null;
    const v = Number(m[1]);
    return [
      metric("excess", round(excess(v, Number(m[2]), Number(m[3]))), "lower", "geometry-excess-mm"),
      info("value", v),
    ];
  },
  (s) => {
    const m = s.match(re(`^${N} \\(min ${N}\\)`));
    if (!m) return null;
    const v = Number(m[1]);
    return [
      metric("excess", round(Math.max(0, Number(m[2]) - v)), "lower", "geometry-excess-mm"),
      info("value", v),
    ];
  },
  (s) => {
    const m = s.match(re(`^${N} \\(max ${N}\\)`));
    if (!m) return null;
    const v = Number(m[1]);
    return [
      metric("excess", round(Math.max(0, v - Number(m[2]))), "lower", "geometry-excess-mm"),
      info("value", v),
    ];
  },
  // A geometry criterion the corpus could not measure (e.g. "... not measurable (no dashed cut line)").
  (s) => {
    const m = s.match(/^(\S+) not measurable \((.*)\)$/);
    if (!m) return null;
    return [
      unmeasured("excess", `${m[1]} not measurable (${m[2]})`, "lower", "geometry-excess-mm"),
    ];
  },
  // DANFE-M1: "L 2.498 T 3.429 R 0 B 32.724 (each in [2, 8])".
  (s) => {
    const m = s.match(re(`^L ${N} T ${N} R ${N} B ${N} \\(each in \\[${N}, ${N}\\]\\)`));
    if (!m) return null;
    const [lo, hi] = [Number(m[5]), Number(m[6])];
    return ["L", "T", "R", "B"].map((side, i) =>
      metric(
        `excess${side}`,
        round(excess(Number(m[i + 1]), lo, hi)),
        "lower",
        "geometry-excess-mm",
      ),
    );
  },
  // REF-R family (BOL-R1, DANFE-R1, TXT-R1, INV-R1): worst anchor error.
  (s) => {
    const m = s.match(re(`^worst (\\S+) ${N} mm \\(tol ${N}\\)`));
    if (!m) return null;
    return [metric("worstMm", Number(m[2]), "lower", "position-mm", { anchor: m[1] })];
  },
  (s) => {
    const m = s.match(/^(\S+): anchor text not found in (\w+)/);
    if (!m) return null;
    return [unmeasured("worstMm", `${m[1]} not found in ${m[2]}`, "lower", "position-mm")];
  },
  // DANFE-L1*: "6pt FONT; pos Δ(0, 3.15) mm".
  (s) => {
    const m = s.match(re(`pos Δ\\(${N}, ${N}\\) mm`));
    if (!m) return null;
    return [
      metric(
        "posErrMm",
        Math.max(Math.abs(Number(m[1])), Math.abs(Number(m[2]))),
        "lower",
        "position-mm",
      ),
    ];
  },
  // DANFE-F*: "7/7 segments; ...", F11: "3472/3511 glyphs attributed".
  (s) => {
    const m = s.match(/^(\d+)\/(\d+) segments/);
    if (!m) return null;
    return [
      metric("segments", Number(m[1]), "higher", "count"),
      info("segmentsTotal", Number(m[2])),
    ];
  },
  (s) => {
    const m = s.match(/^(\d+)\/(\d+) glyphs attributed/);
    if (!m) return null;
    return [
      metric("glyphsAttributed", Number(m[1]), "higher", "count"),
      info("glyphsTotal", Number(m[2])),
    ];
  },
  // BOL-T1/T2: "20.6pt FONT; 2/2 occurrences".
  (s) => {
    const m = s.match(re(`^${N}pt \\S+; (\\d+)/(\\d+) occurrences`));
    if (!m) return null;
    return [info("sizePt", Number(m[1])), metric("occurrences", Number(m[2]), "higher", "count")];
  },
  // TXT-A1: "46 tokens in 3 columns, worst right-edge spread 0 mm (Débito (R$); max 0.3)".
  (s) => {
    const m = s.match(
      re(`^(\\d+) tokens in (\\d+) columns, worst right-edge spread ${N} mm \\(.*max ${N}\\)`),
    );
    if (!m) return null;
    return [
      metric("tokens", Number(m[1]), "higher", "count"),
      metric(
        "excess",
        round(Math.max(0, Number(m[3]) - Number(m[4]))),
        "lower",
        "geometry-excess-mm",
      ),
      info("spreadMm", Number(m[3])),
    ];
  },
  // Corpus barcode: "decodes false, validates false"; BOL-B2 "DVs true, rebuilds barcode true, printed text found false".
  (s) => {
    const m = s.match(/^decodes (true|false), validates (true|false)$/);
    if (!m) return null;
    return [
      metric("decodes", m[1] === "true" ? 1 : 0, "higher", "count"),
      metric("validates", m[2] === "true" ? 1 : 0, "higher", "count"),
    ];
  },
  (s) => {
    const m = s.match(
      /^DVs (true|false), rebuilds barcode (true|false), printed text found (true|false)$/,
    );
    if (!m) return null;
    return [
      metric("dvs", m[1] === "true" ? 1 : 0, "higher", "count"),
      metric("rebuilds", m[2] === "true" ? 1 : 0, "higher", "count"),
      metric("printedTextFound", m[3] === "true" ? 1 : 0, "higher", "count"),
    ];
  },
  // EXT-1 style required strings: "11/16 missing ..." or "16/16".
  (s) => {
    const m = s.match(/^(\d+)\/(\d+)(?:\s+missing\b.*)?$/);
    if (!m) return null;
    return [metric("found", Number(m[1]), "higher", "count"), info("required", Number(m[2]))];
  },
  // EXT-2 corpus: "pdftotext 11/16; pypdf 16/16; pdfminer 16/16".
  (s) => {
    const parts = [...s.matchAll(/(pdftotext|pypdf|pdfminer(?:\.six)?|pymupdf) (\d+)\/(\d+)/g)];
    if (!parts.length || !/^(pdftotext|pypdf|pdfminer|pymupdf)/.test(s) || /\(missing/.test(s)) {
      return null;
    }
    return parts.map((p) => metric(`found.${p[1]}`, Number(p[2]), "higher", "count"));
  },
  // EXT-2 oracles: "pdftotext fail (missing 12, extra 8); pdfminer.six warn (missing 0, extra 0); ...".
  (s) => {
    const parts = [
      ...s.matchAll(/(\S+) (pass|warn|fail|info|not-run) \(missing (\d+), extra (\d+)\)/g),
    ];
    if (!parts.length) return null;
    // Per-extractor status as a rank: pass 3 > warn/info 2 > fail 1 (warn = reordered or extra
    // tokens / margin-box runs absent, which the missing/extra counts alone do not show).
    const rank = { pass: 3, warn: 2, info: 2, fail: 1 };
    return parts.flatMap((p) => [
      metric(`missing.${p[1]}`, Number(p[3]), "lower", "count"),
      metric(`extra.${p[1]}`, Number(p[4]), "lower", "count"),
      metric(`statusRank.${p[1]}`, rank[p[2]] ?? Number.NaN, "higher", "count"),
    ]);
  },
];

/** Metrics of one verdict (structured `metrics` first, else the shared string parser). */
export function verdictMetrics(verdict) {
  if (Array.isArray(verdict.metrics)) return verdict.metrics;
  const s = String(verdict.value ?? "").trim();
  if (!s) return [];
  for (const parse of PARSERS) {
    const out = parse(s);
    if (out) return out;
  }
  return [];
}

/** Stable row key of a verdict inside a fixture: duplicates get #n in document order. */
export function rowKeys(fixtureKey, verdicts) {
  const seen = new Map();
  return verdicts.map((v) => {
    const base = `${fixtureKey}|${v.criterion}|${v.oracle}|${v.mode ?? ""}|${v.kind ?? "criterion"}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return `${base}#${n}`;
  });
}

/**
 * Snapshot fixtures -> { rows: Map(rowKey -> row), metrics: Map(metricKey -> record) }. A row is a
 * verdict (status ratchet); a metric is a value of that verdict (value ratchet).
 */
export function verdictIndex(fixtures) {
  const rows = new Map();
  const metrics = new Map();
  for (const f of fixtures) {
    const keys = rowKeys(f.key, f.verdicts ?? []);
    (f.verdicts ?? []).forEach((v, i) => {
      const rowKey = keys[i];
      const row = {
        rowKey,
        fixture: f.key,
        criterion: v.criterion,
        oracle: v.oracle,
        mode: v.mode ?? "",
        kind: v.kind ?? "criterion",
        diagnostic: Boolean(f.diagnostic),
        status: v.status,
        value: v.value,
        caveat: v.caveat ?? null,
      };
      rows.set(rowKey, row);
      for (const m of verdictMetrics(v)) {
        metrics.set(`${rowKey}|${m.metric}`, { ...m, rowKey, row });
      }
    });
  }
  return { rows, metrics };
}
