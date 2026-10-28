// Site evidence for the published fidelity story: manifest, SVG charts and generated markdown
// blocks, all derived from ONE manifest (fidelity/report/build-site-evidence.mjs writes it).
//
// Pure functions only (no filesystem), so the self-tests run without the run store or a venv.
// Every number that the docs print comes from renderBlocks(manifest): prose around the blocks
// carries no measured value, so the site cannot drift from the manifest (checkDocs()).
//
// Charts are static SVG files loaded through <img>: they carry <title>/<desc> and follow the
// reader's OS colour scheme (prefers-color-scheme), but have no hover layer. The table view is the
// generated `table` block next to them.

export const MANIFEST_SCHEMA = "vellora-fidelity/site-evidence/1";

/** Markdown files that carry generated blocks (repo-relative). README.md renders on GitHub. */
export const DOC_FILES = [
  "README.md",
  "docs/guide/fidelity.md",
  "docs/blog/native-pdf-fidelity-blitz-beta4.md",
  "docs/blog/html-to-pdf-nodejs-without-puppeteer.md",
];

/** Fixture order, display names and source notes. OSS fixtures carry their upstream licence. */
export const FIXTURES = [
  { id: "invoice", name: "Invoice", short: "Invoice", origin: "vellora fixture, synthetic data" },
  { id: "receipt", name: "Receipt", short: "Receipt", origin: "vellora fixture, synthetic data" },
  {
    id: "boleto",
    name: "Boleto (bank slip)",
    short: "Boleto",
    origin: "vellora fixture, synthetic data",
  },
  {
    id: "boleto-febraban",
    name: "Boleto, FEBRABAN layout",
    short: "Boleto FEBRABAN",
    origin: "vellora corpus fixture, synthetic data",
  },
  {
    id: "danfe",
    name: "DANFE (NF-e invoice)",
    short: "DANFE",
    origin: "vellora corpus fixture, synthetic data",
  },
  {
    id: "notification",
    name: "Notification letter",
    short: "Notification",
    origin: "vellora fixture, synthetic data",
  },
  {
    id: "text-stress-ptbr",
    name: "Long pt-BR text (stress)",
    short: "Long pt-BR text",
    origin: "vellora corpus fixture, synthetic text",
  },
  {
    id: "oss-postmark-receipt",
    name: "Postmark receipt (OSS template)",
    short: "Postmark receipt (OSS)",
    origin: "adapted OSS template",
    attribution: {
      upstream: "ActiveCampaign/postmark-templates",
      url: "https://github.com/ActiveCampaign/postmark-templates",
      commit: "fa73527acb4eb59cf673a54572d213e908f1515c",
      license: "MIT",
      copyright: "Copyright (c) 2015 Wildbit",
      notice: "fixtures/oss-postmark-receipt/NOTICE.md",
    },
  },
  {
    id: "oss-sparksuite-invoice",
    name: "Sparksuite simple invoice (OSS template)",
    short: "Sparksuite invoice (OSS)",
    origin: "adapted OSS template",
    attribution: {
      upstream: "sparksuite/simple-html-invoice-template",
      url: "https://github.com/sparksuite/simple-html-invoice-template",
      commit: "7d74fe34c862b7712f1a23a3f12147a4a8bd53e1",
      license: "MIT",
      copyright: "Copyright (c) 2021 Sparksuite",
      notice: "fixtures/oss-sparksuite-invoice/NOTICE.md",
    },
  },
];

/** Known, tracked causes of a page-count difference (shown only for that fixture). */
const PAGE_CAUSES = {
  "oss-postmark-receipt":
    "Tracked as table fragmentation across pages (exit-contract condition 3).",
};

/** The fixture whose page-1 composite is the hero image (dense table document, synthetic data). */
export const HERO_FIXTURE = "danfe";

const METRIC_KEYS = [
  "pages",
  "chromePages",
  "pageDelta",
  "chromeWords",
  "subjectWords",
  "pairedWords",
  "missingWords",
  "extraWords",
  "medianMm",
  "p90Mm",
  "within1mmPct",
  "samePagePct",
];

const pickMetrics = (m) => Object.fromEntries(METRIC_KEYS.map((k) => [k, m[k]]));

const WPT_KEYS = [
  "reftests",
  "pass",
  "passClean",
  "passBlank",
  "fail",
  "unsupported",
  "error",
  "skip",
  "passRate",
  "passRateEvaluated",
  "passRateClean",
];
const pickWpt = (t) => Object.fromEntries(WPT_KEYS.filter((k) => k in t).map((k) => [k, t[k]]));

/** "DRAFT" unless a gate report with verdict PASS is supplied. */
export function evidenceStatus(gate) {
  return gate && gate.verdict === "PASS" ? "PASS" : "DRAFT";
}

/**
 * Compare the metrics of a visual-compare metrics.json entry with an oracle summary's fixtures
 * (doc-aggregate output). Returns a list of mismatch strings (empty = identical).
 */
export function crossCheck(metrics, key, docAggregate, label) {
  const problems = [];
  for (const { id } of FIXTURES) {
    const a = metrics[id]?.[key];
    const b = docAggregate.fixtures?.[id];
    if (!a || !b) {
      problems.push(`${label}: ${id} missing (${!a ? "metrics" : "oracle"})`);
      continue;
    }
    for (const k of METRIC_KEYS) {
      if (a[k] !== b[k]) problems.push(`${label}: ${id}.${k} ${a[k]} != ${b[k]}`);
    }
  }
  return problems;
}

/** Item key without the gate's view prefix ("pin|wpt|x" -> "wpt|x"). */
const itemId = (key) => String(key).replace(/^pin\|/, "");
const ids = (items, pred) =>
  [...new Set((items ?? []).filter(pred).map((i) => itemId(i.key)))].sort();

/**
 * The strict exit contract's four conditions, read from a gate report (fidelity/gate/run.mjs
 * --contract). `met` is derived only from the report's own counts and verdicts; `items` lists
 * the ids that hold a condition open (ids only, no measured values).
 */
export function gateConditions(gate) {
  const c = gate.counts ?? {};
  const pinC = c.pinC ?? gate.pin?.counts?.c ?? 0;
  const regressions = ids(gate.items, (i) => i.gating && i.class === "regression");
  const headVerdict = gate.head?.verdict ?? null;
  const headGating = ids(gate.head?.items, (i) => i.gating);
  const doc = gate.docAggregate ?? {};
  return [
    {
      id: 1,
      what: "pin view (--main): no item worse than the published package unless the gate classifies it (class a: the old pass was false; class b: provable Blitz debt)",
      met: pinC === 0,
      count: pinC,
      items: ids(gate.pin?.items, (i) => i.pinClass === "c"),
    },
    {
      id: 2,
      what: "every fixture's median error and share within 1 mm at least as good as the published package's",
      met: doc.condition2 ? doc.condition2 === "PASS" : (c.docRegressions ?? 0) === 0,
      count: c.docRegressions ?? 0,
      items: [],
    },
    {
      id: 3,
      what: "every fixture's page count equal to Chrome's",
      met: doc.condition3 ? doc.condition3 === "PASS" : (c.contractPagesFailing ?? 0) === 0,
      count: c.contractPagesFailing ?? 0,
      items: [],
    },
    {
      id: 4,
      what: "step-to-step ratchet: no regression against the previous gated step, and the head view (against the chain's first step) passes",
      met: regressions.length === 0 && (c.regression ?? 0) === 0 && headVerdict !== "FAIL",
      count: c.regression ?? 0,
      items: regressions,
      head: { verdict: headVerdict, gating: c.headGating ?? headGating.length, items: headGating },
    },
  ];
}

/** Per-fixture totals of one paint-probe summary (fidelity/oracles/paint-probe.mjs). */
function paintSide(probe) {
  return Object.fromEntries(
    FIXTURES.filter((f) => probe.fixtures?.[f.id]).map((f) => {
      const x = probe.fixtures[f.id];
      return [
        f.id,
        {
          pages: x.pages,
          chromePages: x.chromePages,
          dashSegments: x.dashSegments,
          underlines: x.underlines,
          canvasMismatchPages: x.canvasMismatchPages ?? [],
          flags: x.flags ?? [],
        },
      ];
    }),
  );
}

/** The report-only paint probe, for the branch (`after`) and optionally the published package. */
export function paintSection(after, before) {
  const a = paintSide(after);
  const b = before ? paintSide(before) : null;
  // Chrome's side of both probes must be the same PDFs, so the two columns share one reference.
  for (const id of Object.keys(b ?? {})) {
    const same = (k) =>
      a[id] && a[id][k].chrome === b[id][k].chrome && a[id].chromePages === b[id].chromePages;
    if (!same("dashSegments") || !same("underlines")) {
      throw new Error(`paint probes: ${id} was compared with different Chrome PDFs`);
    }
  }
  return {
    what: "Vector paint read from each PDF (PyMuPDF get_drawings and text spans): dashed/dotted border segments, text-decoration underlines, and whether the page canvas colour matches Chrome's. Report-only: no gate rule reads it",
    reportOnly: true,
    method: after.method?.facts,
    tool: after.tool,
    after: { command: after.command, fixtures: a },
    before: before ? { command: before.command, fixtures: b } : null,
  };
}

/**
 * Build the manifest. `inputs`:
 *   metrics      visual-compare metrics.json (per fixture: { [pinKey]: m, [newKey]: m })
 *   pinKey, newKey
 *   pinDoc       fidelity/baselines/pin/doc-aggregate.json (engine commit/blitz, method)
 *   runSummary   the measured run's run-all summary.json (environment, command, wpt totals)
 *   wptRun       the run's wpt/summary.json (Chrome reference totals), optional
 *   wptBefore    fidelity/baselines/pin/wpt/by-directory.json
 *   gate         gate report (verdict, date, command, counts), optional
 *   paint        the run's paint-probe summary.json, optional
 *   paintBefore  a paint-probe summary of the published package's PDFs (--subject), optional
 *   images      [{ fixture, page, file, pagesShown }] from the composer
 *   files        { name: { path, sha256 } } portable input paths and hashes
 *   commands     { images, regenerate }
 */
export function buildManifest(inputs) {
  const { metrics, pinKey, newKey, pinDoc, runSummary, wptRun, wptBefore, gate } = inputs;
  const env = runSummary.environment ?? {};
  const fixtures = FIXTURES.map((f) => {
    const before = metrics[f.id]?.[pinKey];
    const after = metrics[f.id]?.[newKey];
    if (!before || !after)
      throw new Error(`metrics.json lacks ${f.id}.${!before ? pinKey : newKey}`);
    return {
      ...f,
      chromeWords: after.chromeWords,
      chromePages: after.chromePages,
      sameChromeGeometry:
        before.inputs?.chromeGeometrySha256 !== undefined &&
        before.inputs.chromeGeometrySha256 === after.inputs?.chromeGeometrySha256,
      sameNativeHtml:
        before.inputs?.nativeHtmlSha256 !== undefined &&
        before.inputs.nativeHtmlSha256 === after.inputs?.nativeHtmlSha256,
      before: pickMetrics(before),
      after: pickMetrics(after),
    };
  });
  const status = evidenceStatus(gate);
  const wptAfter = runSummary.wpt ?? {};
  const chromeWpt = wptRun?.chromeSummary?.totals;
  const manifest = {
    schema: MANIFEST_SCHEMA,
    status,
    statusReason:
      status === "PASS"
        ? `gate report verdict PASS (${gate.contract ? "--contract" : "no --contract"})`
        : gate
          ? `gate report verdict ${gate.verdict}: the strict merge contract is not met yet`
          : "no gate report supplied",
    released: false,
    authority: /darwin/.test(env.os ?? "")
      ? "INDICATIVE: local macOS measurement. Public numbers will be regenerated from the final gated run, and from Linux CI when available."
      : (env.authority ?? "UNSPECIFIED"),
    reference: {
      renderer: env.chrome?.version ?? "UNKNOWN",
      mode: "headless print-to-PDF (fidelity/lib/chrome-reference.mjs)",
    },
    before: {
      label: "vellora 0.2.0 (published)",
      npm: "vellora@0.2.0",
      tag: "v0.2.0",
      commit: pinDoc.engine.commit,
      blitz: `0.3.0-alpha.5 line, git ${pinDoc.engine.blitz.slice(0, 7)}`,
      measured: pinDoc.environment?.date,
      command: pinDoc.command,
    },
    after: {
      label: "vellora (unreleased branch)",
      branch: env.git?.branch,
      commit: env.git?.head,
      blitz: `${env.blitz?.version ?? "?"}, crates.io`,
      measured: runSummary.dateIso,
      runId: runSummary.runId,
      command: runSummary.command,
    },
    environment: {
      os: env.os,
      cpu: env.cpu,
      node: env.node,
      rustc: env.rustc,
      pymupdf: env.python?.packages?.pymupdf,
      poppler: env.poppler?.pdftoppm,
    },
    method: {
      ...pinDoc.method,
      extractorVersion: pinDoc.extractor,
      medianMm:
        "median distance (mm) between each paired word's position in the vellora PDF and in Chrome's PDF",
      within1mmPct:
        "share of ALL Chrome words whose paired vellora word is within 1 mm (unpaired words count as misses)",
      pages: "page count of each PDF; equal to Chrome is the target",
      oracle: "fidelity/oracles/doc-aggregate.mjs (lib/doc-aggregate.mjs)",
    },
    gate: gate
      ? {
          verdict: gate.verdict,
          date: gate.date,
          contract: gate.contract === true,
          command: gate.command,
          counts: {
            gating: gate.counts?.gating ?? 0,
            pinA: gate.counts?.pinA ?? 0,
            pinB: gate.counts?.pinB ?? 0,
            pinC: gate.counts?.pinC ?? 0,
            regression: gate.counts?.regression ?? 0,
            pinCGating: gate.counts?.["pin-c"] ?? 0,
            // The gate writes a count key only when the count is non-zero.
            contractPages: gate.counts?.["contract-pages"] ?? 0,
            contractPagesFailing: gate.counts?.contractPagesFailing ?? 0,
            docRegressions: gate.counts?.docRegressions ?? 0,
            headGating: gate.counts?.headGating ?? 0,
          },
          conditions: gateConditions(gate),
        }
      : null,
    paint: inputs.paint ? paintSection(inputs.paint, inputs.paintBefore) : null,
    fixtures,
    wpt: {
      what: "WPT reftests passed through the vellora pipeline, printed to PDF and compared with the reference page: coverage of the CSS test subset the harness runs, not a document-quality score",
      wptCommit: wptAfter.wptCommit,
      before: {
        label:
          "Blitz 0.3.0-alpha.5 engine of vellora 0.2.0 (baseline commit with layout instrumentation)",
        commit: wptBefore.velloraCommit,
        engine: wptBefore.engineId,
        wptCommit: wptBefore.wptCommit,
        date: wptBefore.provenance?.dateIso,
        chrome: wptBefore.provenance?.chrome,
        totals: pickWpt(wptBefore.totals),
      },
      after: {
        label: "vellora (unreleased branch)",
        commit: wptAfter.velloraCommit,
        engine: wptAfter.engineId,
        wptCommit: wptAfter.wptCommit,
        date: runSummary.dateIso,
        chrome: env.chrome?.version,
        totals: pickWpt(wptAfter.totals ?? {}),
      },
      chrome: chromeWpt
        ? {
            label: `${wptRun.chromeVersion} through the same harness`,
            note: "Chrome's outcomes were reused from an earlier run with the same WPT commit and comparison settings (--chrome-from)",
            totals: pickWpt(chromeWpt),
          }
        : null,
    },
    images: inputs.images ?? [],
    files: inputs.files ?? {},
    commands: inputs.commands ?? {},
  };
  manifest.headline = headline(manifest);
  return manifest;
}

/** Derived headline values, each with its definition. */
export function headline(manifest) {
  const fx = manifest.fixtures;
  const count = (side, pred) => fx.filter((f) => pred(f[side])).length;
  const worst = (side) => {
    const f = fx.reduce((a, b) => (b[side].medianMm > a[side].medianMm ? b : a));
    return { value: f[side].medianMm, fixture: f.id };
  };
  return {
    fixtures: fx.length,
    allWordsWithin1mm: {
      what: "fixtures where 100% of Chrome's words have a vellora counterpart within 1 mm",
      before: count("before", (m) => m.within1mmPct === 100),
      after: count("after", (m) => m.within1mmPct === 100),
    },
    worstMedianMm: {
      what: "largest per-fixture median word-position error vs Chrome, in mm",
      before: worst("before"),
      after: worst("after"),
    },
    pagesEqualChrome: {
      what: "fixtures whose page count equals Chrome's",
      before: count("before", (m) => m.pages === m.chromePages),
      after: count("after", (m) => m.pages === m.chromePages),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------------------------

export const mm = (v) => `${v.toFixed(2)} mm`;
export const pct = (v) => `${v.toFixed(1)}%`;
export const pct2 = (v) => `${v.toFixed(2)}%`;
const int = (v) => v.toLocaleString("en-US");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const chromeShort = (m) => m.reference.renderer.replace(/^Google /, "");

// ---------------------------------------------------------------------------------------------
// SVG charts (one palette everywhere; validated with the dataviz validator in both modes:
// before = orange #eb6834 / #d95926, after = blue #2a78d6 / #3987e5; hollow vs filled marker is
// the secondary encoding, so identity never rests on hue alone).
// ---------------------------------------------------------------------------------------------

export const PALETTE = {
  light: {
    surface: "#fcfcfb",
    ink: "#0b0b0b",
    ink2: "#52514e",
    muted: "#6f6e69",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    before: "#eb6834",
    after: "#2a78d6",
    ref: "#898781",
  },
  dark: {
    surface: "#1a1a19",
    ink: "#f0efec",
    ink2: "#c3c2b7",
    muted: "#a3a29c",
    grid: "#2c2c2a",
    axis: "#383835",
    before: "#d95926",
    after: "#3987e5",
    ref: "#898781",
  },
};

function svgStyle() {
  const rules = (p) => `
  .bg{fill:${p.surface}} .t1{fill:${p.ink}} .t2{fill:${p.ink2}} .mu{fill:${p.muted}}
  .grid{stroke:${p.grid}} .axis{stroke:${p.axis}} .ref{stroke:${p.ref}} .refFill{fill:${p.ref}}
  .link{stroke:${p.axis}} .before{stroke:${p.before};fill:${p.surface}} .beforeFill{fill:${p.before}}
  .after{fill:${p.after};stroke:${p.surface}} .afterFill{fill:${p.after}}`;
  return `<style>
  text{font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
  .num{font-variant-numeric:tabular-nums}${rules(PALETTE.light)}
  @media (prefers-color-scheme: dark){${rules(PALETTE.dark)}}
</style>`;
}

function svgOpen(id, width, height, title, desc) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${id}-t ${id}-d">
<title id="${id}-t">${esc(title)}</title>
<desc id="${id}-d">${esc(desc)}</desc>
${svgStyle()}
<rect class="bg" width="${width}" height="${height}" rx="8"/>`;
}

function legend(y, x, manifest) {
  return `<g transform="translate(${x},${y})">
  <circle class="before" cx="6" cy="0" r="5" stroke-width="2"/><text class="t2" x="18" y="4" font-size="12">${esc(manifest.before.label)}</text>
  <circle class="after" cx="226" cy="0" r="5" stroke-width="2"/><text class="t2" x="238" y="4" font-size="12">${esc(manifest.after.label)}</text>
</g>`;
}

function statusLine(manifest) {
  return manifest.status === "PASS"
    ? "Gated run (verdict PASS). Local macOS: indicative."
    : "DRAFT: unreleased branch, merge not yet passed. Local macOS: indicative.";
}

/** Dumbbell chart, one row per fixture. scale: "log" (mm) or "linear" (percent). */
function dumbbell(manifest, spec) {
  const W = 760;
  const rowH = 30;
  const top = 96;
  const left = 200;
  const right = 160;
  const plotW = W - left - right;
  const H = top + rowH * manifest.fixtures.length + 56;
  const x = spec.x(plotW);
  const rows = manifest.fixtures
    .map((f, i) => {
      const y = top + rowH * i + rowH / 2;
      const b = f.before[spec.key];
      const a = f.after[spec.key];
      const xb = left + x(b);
      const xa = left + x(a);
      return `<g>
  <title>${esc(`${f.name}: ${manifest.before.label} ${spec.fmt(b)}, ${manifest.after.label} ${spec.fmt(a)}`)}</title>
  <text class="t1" x="${left - 12}" y="${y + 4}" font-size="12" text-anchor="end">${esc(f.short)}</text>
  <line class="link" x1="${xb}" y1="${y}" x2="${xa}" y2="${y}" stroke-width="2"/>
  <circle class="before" cx="${xb}" cy="${y}" r="5" stroke-width="2"/>
  <circle class="after" cx="${xa}" cy="${y}" r="5" stroke-width="2"/>
  <text class="t2 num" x="${W - right + 14}" y="${y + 4}" font-size="12">${esc(`${spec.fmt(b)} → ${spec.fmt(a)}`)}</text>
</g>`;
    })
    .join("\n");
  const plotTop = top - 6;
  const plotBottom = top + rowH * manifest.fixtures.length;
  const ticks = spec.ticks
    .map((t) => {
      const tx = left + x(t);
      return `<line class="grid" x1="${tx}" y1="${plotTop}" x2="${tx}" y2="${plotBottom}" stroke-width="1"/>
<text class="mu num" x="${tx}" y="${plotBottom + 16}" font-size="11" text-anchor="middle">${esc(spec.tickFmt(t))}</text>`;
    })
    .join("\n");
  const refX = left + x(spec.ref.value);
  return `${svgOpen(spec.id, W, H, spec.title, spec.desc(manifest))}
<text class="t1" x="20" y="28" font-size="15" font-weight="600">${esc(spec.title)}</text>
<text class="t2" x="20" y="48" font-size="12">${esc(spec.subtitle(manifest))}</text>
${legend(72, 20, manifest)}
${ticks}
<line class="ref" x1="${refX}" y1="${plotTop}" x2="${refX}" y2="${plotBottom}" stroke-width="1.5"/>
<text class="t2" x="${refX + (spec.ref.anchor === "end" ? -6 : 6)}" y="${plotTop + 2}" font-size="11" text-anchor="${spec.ref.anchor}">${esc(spec.ref.label(manifest))}</text>
<text class="mu" x="${W - right + 14}" y="${plotTop + 2}" font-size="11">before → after</text>
${rows}
<text class="mu" x="${left + plotW / 2}" y="${plotBottom + 34}" font-size="11" text-anchor="middle">${esc(spec.axisLabel)}</text>
<text class="mu" x="20" y="${H - 10}" font-size="10">${esc(`${statusLine(manifest)} Source: docs/assets/fidelity/manifest.json`)}</text>
</svg>
`;
}

export function chartMedianMm(manifest) {
  const lo = Math.log10(0.05);
  const hi = Math.log10(200);
  return dumbbell(manifest, {
    id: "median-mm",
    key: "medianMm",
    title: "Median word-position error vs Chrome, per fixture (lower is better)",
    subtitle: (m) =>
      `Reference: ${chromeShort(m)} print-to-PDF, whose own error is 0 mm by definition. Log scale.`,
    desc: (m) =>
      `Dumbbell chart, log scale in millimetres. ${m.fixtures
        .map((f) => `${f.name}: ${mm(f.before.medianMm)} to ${mm(f.after.medianMm)}`)
        .join("; ")}.`,
    x: (w) => (v) => ((Math.log10(Math.max(v, 0.05)) - lo) / (hi - lo)) * w,
    ticks: [0.1, 1, 10, 100],
    tickFmt: (t) => `${t} mm`,
    fmt: mm,
    ref: { value: 1, anchor: "start", label: () => "1 mm" },
    axisLabel: "median distance between a word in vellora's PDF and the same word in Chrome's PDF",
  });
}

export function chartWithin1mm(manifest) {
  return dumbbell(manifest, {
    id: "within-1mm",
    key: "within1mmPct",
    title: "Share of words within 1 mm of Chrome's position, per fixture (higher is better)",
    subtitle: (m) =>
      `Denominator: every word in ${chromeShort(m)}'s PDF; a word vellora does not print counts as a miss.`,
    desc: (m) =>
      `Dumbbell chart, 0 to 100 percent. ${m.fixtures
        .map((f) => `${f.name}: ${pct(f.before.within1mmPct)} to ${pct(f.after.within1mmPct)}`)
        .join("; ")}.`,
    x: (w) => (v) => (v / 100) * w,
    ticks: [0, 25, 50, 75, 100],
    tickFmt: (t) => `${t}%`,
    fmt: pct,
    ref: { value: 100, anchor: "end", label: (m) => `${chromeShort(m)} = 100% (reference)` },
    axisLabel: "share of Chrome's words whose vellora counterpart is at most 1 mm away",
  });
}

export function chartWpt(manifest) {
  const W = 760;
  const left = 300;
  const right = 150;
  const plotW = W - left - right;
  const bars = [
    {
      cls: "beforeFill",
      label: "vellora 0.2.0 · Blitz 0.3.0-alpha.5",
      t: manifest.wpt.before.totals,
    },
    {
      cls: "afterFill",
      label: `unreleased branch · Blitz ${manifest.after.blitz.split(",")[0]}`,
      t: manifest.wpt.after.totals,
    },
  ];
  if (manifest.wpt.chrome) {
    bars.push({
      cls: "refFill",
      label: `${chromeShort(manifest).replace(/(\d+)\.[\d.]+$/, "$1")} (reference)`,
      t: manifest.wpt.chrome.totals,
    });
  }
  const top = 76;
  const rowH = 40;
  const H = top + rowH * bars.length + 52;
  const rows = bars
    .map((b, i) => {
      const y = top + rowH * i;
      const w = Math.max(4, (b.t.passRate / 100) * plotW);
      const r = 4;
      // Rounded data end, square at the baseline.
      const path = `M${left},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${24 - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} z`;
      return `<g>
  <title>${esc(`${b.label}: ${int(b.t.pass)} of ${int(b.t.reftests)} reftests pass (${pct2(b.t.passRate)})`)}</title>
  <text class="t1" x="${left - 12}" y="${y + 16}" font-size="12" text-anchor="end">${esc(b.label)}</text>
  <path class="${b.cls}" d="${path}"/>
  <text class="t2 num" x="${left + w + 8}" y="${y + 16}" font-size="12">${esc(`${pct2(b.t.passRate)} (${int(b.t.pass)} / ${int(b.t.reftests)})`)}</text>
</g>`;
    })
    .join("\n");
  const plotBottom = top + rowH * bars.length - 12;
  const ticks = [0, 25, 50, 75, 100]
    .map((t) => {
      const tx = left + (t / 100) * plotW;
      return `<line class="grid" x1="${tx}" y1="${top - 6}" x2="${tx}" y2="${plotBottom}" stroke-width="1"/>
<text class="mu num" x="${tx}" y="${plotBottom + 16}" font-size="11" text-anchor="middle">${t}%</text>`;
    })
    .join("\n");
  const title = "WPT reftests passed (coverage of the CSS test subset, not a quality score)";
  const desc = `Bar chart. ${bars.map((b) => `${b.label}: ${pct2(b.t.passRate)}, ${b.t.pass} of ${b.t.reftests}`).join("; ")}.`;
  return `${svgOpen("wpt", W, H, title, desc)}
<text class="t1" x="20" y="28" font-size="15" font-weight="600">${esc(title)}</text>
<text class="t2" x="20" y="48" font-size="12">${esc(`WPT ${String(manifest.wpt.wptCommit).slice(0, 8)}, reftests printed to PDF and compared with the reference page. Chrome does not reach 100% through the same harness.`)}</text>
${ticks}
<line class="axis" x1="${left}" y1="${top - 6}" x2="${left}" y2="${plotBottom}" stroke-width="1"/>
${rows}
<text class="mu" x="20" y="${H - 10}" font-size="10">${esc(`${statusLine(manifest)} Source: docs/assets/fidelity/manifest.json`)}</text>
</svg>
`;
}

export function renderCharts(manifest) {
  return {
    "median-mm.svg": chartMedianMm(manifest),
    "within-1mm.svg": chartWithin1mm(manifest),
    "wpt-pass-rate.svg": chartWpt(manifest),
  };
}

// ---------------------------------------------------------------------------------------------
// Markdown blocks
// ---------------------------------------------------------------------------------------------

const MANIFEST_URL =
  "https://github.com/diomalta/vellora/blob/main/docs/assets/fidelity/manifest.json";
const DOCS_URL = "https://diomalta.github.io/vellora/guide/fidelity#measured-fidelity";
const REPO_BLOB = "https://github.com/diomalta/vellora/blob/main/";

/** Flavor per file: README.md renders on GitHub (relative paths), the rest in VitePress. */
export const flavorOf = (file) => (file === "README.md" ? "github" : "vitepress");

const assetPath = (flavor, name) =>
  flavor === "github" ? `./docs/assets/fidelity/${name}` : `/assets/fidelity/${name}`;

function attributionLine(f) {
  const a = f.attribution;
  return `${f.name} is adapted from [${a.upstream}](${a.url}) (commit \`${a.commit.slice(0, 7)}\`), ${a.license} licence, ${a.copyright}; see [NOTICE](${REPO_BLOB}${a.notice}).`;
}

function statusBlock(m, flavor) {
  const text =
    m.status === "PASS"
      ? `Measured on a gated run (gate verdict PASS). ${m.authority}`
      : `**DRAFT. These results are from an unreleased branch that is not merged.** The merge is gated by a strict oracle contract, and this run does not pass it yet (${m.statusReason}). ${m.authority} The released package is ${m.before.npm}.`;
  return flavor === "github" ? `> ${text}` : `::: warning ${m.status}\n${text}\n:::`;
}

function headlineBlock(m) {
  const h = m.headline;
  const n = h.fixtures;
  const ref = chromeShort(m);
  const pagesOff = m.fixtures.filter((f) => f.after.pages !== f.after.chromePages);
  const off = pagesOff
    .map(
      (f) =>
        `${f.id} prints ${plural(f.after.pages, "page")} where Chrome prints ${f.after.chromePages}`,
    )
    .join("; ");
  return [
    `- **${h.allWordsWithin1mm.after} of ${n} fixtures** have every word within 1 mm of its position in ${ref}'s PDF (share of word positions within 1 mm = 100%). ${m.before.label}: ${h.allWordsWithin1mm.before} of ${n}.`,
    `- **${mm(h.worstMedianMm.after.value)} or less** median word-position error on every one of the ${n} fixtures (largest: ${h.worstMedianMm.after.fixture}). ${m.before.label}: up to ${mm(h.worstMedianMm.before.value)} (${h.worstMedianMm.before.fixture}).`,
    `- **${h.pagesEqualChrome.after} of ${n} fixtures** print the same number of pages as Chrome. ${m.before.label}: ${h.pagesEqualChrome.before} of ${n}.${off ? ` Still open: ${off}.` : ""}`,
  ].join("\n");
}

function heroBlock(m, flavor) {
  const f = m.fixtures.find((x) => x.id === HERO_FIXTURE);
  const img = m.images.find((i) => i.fixture === HERO_FIXTURE && i.page === 1);
  if (!img) return "";
  const alt = `${f.name}, page 1, side by side: ${chromeShort(m)} (reference), ${m.before.label}, ${m.after.label}. Synthetic document data.`;
  return `![${alt}](${assetPath(flavor, img.file)})

<sub>${esc(f.name)}, page 1. Left to right: ${chromeShort(m)} (reference), ${m.before.label}, ${m.after.label}. Median word-position error ${mm(f.before.medianMm)} → ${mm(f.after.medianMm)}; words within 1 mm ${pct(f.before.within1mmPct)} → ${pct(f.after.within1mmPct)}; pages ${f.before.pages} → ${f.after.pages} (Chrome: ${f.chromePages}). Synthetic data.</sub>`;
}

function readmeBlock(m) {
  return [
    statusBlock(m, "github"),
    "",
    heroBlock(m, "github"),
    "",
    `Measured against ${chromeShort(m)} headless print-to-PDF on ${m.fixtures.length} document fixtures, comparing the position of every word in each PDF:`,
    "",
    headlineBlock(m),
    "",
    `Method, the full table with the losses, and how to reproduce it: [Measured fidelity](${DOCS_URL}). Raw values: [manifest.json](./docs/assets/fidelity/manifest.json).`,
  ].join("\n");
}

function tableBlock(m) {
  const head =
    "| Fixture | Chrome words | Median error (mm) | p90 error (mm) | Words within 1 mm | Chrome words unpaired | Pages: 0.2.0 / branch / Chrome |\n|---|---:|---:|---:|---:|---:|---:|";
  const arrow = (a, b, f) => `${f(a)} → ${f(b)}`;
  const n2 = (v) => v.toFixed(2);
  const rows = m.fixtures.map((f) => {
    const b = f.before;
    const a = f.after;
    const pages = `${b.pages} / ${a.pages} / ${f.chromePages}${a.pages !== f.chromePages ? " (open)" : ""}`;
    return `| ${f.name} (\`${f.id}\`) | ${int(f.chromeWords)} | ${arrow(b.medianMm, a.medianMm, n2)} | ${arrow(b.p90Mm, a.p90Mm, n2)} | ${arrow(b.within1mmPct, a.within1mmPct, pct)} | ${arrow(b.missingWords, a.missingWords, String)} | ${pages} |`;
  });
  return [
    `Each cell reads ${m.before.label} → ${m.after.label}. Reference: ${chromeShort(m)}.`,
    "",
    head,
    ...rows,
  ].join("\n");
}

function lossesBlock(m) {
  const items = [];
  for (const f of m.fixtures) {
    const a = f.after;
    const b = f.before;
    if (a.pages !== f.chromePages) {
      items.push(
        `**${f.id}: ${plural(a.pages, "page")}, Chrome prints ${f.chromePages}.** ${a.missingWords} of Chrome's ${f.chromeWords} words have no counterpart in vellora's PDF (${m.before.label}: ${b.missingWords}). ${PAGE_CAUSES[f.id] ?? "Cause not yet attributed."} Not fixed on this branch.`,
      );
    }
    if (a.within1mmPct < 100 && a.pages === f.chromePages) {
      items.push(
        `**${f.id}: ${pct(a.within1mmPct)} of words within 1 mm** (${m.before.label}: ${pct(b.within1mmPct)}); p90 error ${mm(a.p90Mm)}.`,
      );
    }
    for (const k of ["medianMm", "p90Mm", "missingWords", "extraWords"]) {
      if (a[k] > b[k])
        items.push(`**${f.id}: ${k} is worse than ${m.before.label}** (${b[k]} → ${a[k]}).`);
    }
    for (const k of ["within1mmPct", "samePagePct"]) {
      if (a[k] < b[k])
        items.push(`**${f.id}: ${k} is worse than ${m.before.label}** (${b[k]} → ${a[k]}).`);
    }
  }
  const w = m.wpt;
  items.push(
    `**WPT:** ${int(w.after.totals.pass)} of ${int(w.after.totals.reftests)} reftests pass (${pct2(w.after.totals.passRate)}); ${int(w.after.totals.passClean)} (${pct2(w.after.totals.passRateClean)}) pass without any suspect-pass flag. ${int(w.after.totals.fail)} still fail and ${int(w.after.totals.unsupported)} are rejected as outside the strict subset.`,
  );
  if (m.gate && m.gate.verdict !== "PASS") {
    items.push(gateLines(m.gate));
  }
  return items.map((i) => `- ${i}`).join("\n");
}

const testIds = (list) => list.map((k) => `\`${k.replace(/^wpt\|/, "")}\``).join(", ");

/** The merge gate's verdict, one sub-item per strict-contract condition. */
function gateLines(g) {
  const head = `**Merge gate: verdict ${g.verdict}** on this run${g.contract ? " (strict contract, --contract)" : ""}, ${plural(g.counts.gating, "gating item")}. The branch does not merge until every condition is met.`;
  if (!g.conditions) return head;
  const sub = g.conditions.map((c) => {
    const state = c.met ? "met" : "NOT met";
    let detail = "";
    if (c.id === 1 && !c.met) {
      detail = ` ${plural(c.count, "item")} worse than the published package that the gate cannot classify yet${c.items.length ? `: ${testIds(c.items)}` : ""}. Classified: ${int(g.counts.pinA)} class a, ${int(g.counts.pinB)} class b.`;
    }
    if ((c.id === 2 || c.id === 3) && !c.met) detail = ` ${plural(c.count, "fixture")} failing.`;
    if (c.id === 4 && !c.met) {
      const r = c.count
        ? ` ${plural(c.count, "regression")} against the previous gated step${c.items.length ? `: ${testIds(c.items)}` : ""}.`
        : "";
      const h =
        c.head?.verdict === "FAIL"
          ? ` Head view: FAIL, ${plural(c.head.gating, "item")}${c.head.items.length ? ` (${testIds(c.head.items)})` : ""}.`
          : "";
      detail = `${r}${h}`;
    }
    return `  - (${c.id}) ${c.what}: **${state}**.${detail}`;
  });
  return [head, ...sub].join("\n");
}

function paintBlock(m) {
  const p = m.paint;
  if (!p) return "Paint probe: not supplied.";
  const before = p.before?.fixtures ?? null;
  const pair = (x) => `${int(x.vellora)} / ${int(x.chrome)}`;
  const over = (x) =>
    x.vellora > x.chrome ? ` (${int(x.vellora - x.chrome)} more than Chrome)` : "";
  const any = (x) =>
    x &&
    (x.dashSegments.chrome ||
      x.dashSegments.vellora ||
      x.underlines.chrome ||
      x.underlines.vellora ||
      x.canvasMismatchPages.length ||
      x.flags.length);
  const shown = m.fixtures.filter((f) => any(p.after.fixtures[f.id]) || any(before?.[f.id]));
  const rest = m.fixtures.length - shown.length;
  const canvas = (x) =>
    x.canvasMismatchPages.length ? `pages ${x.canvasMismatchPages.join(", ")}` : "none";
  const flags = (x) => (x.flags.length ? x.flags.join(", ") : "none");
  const rows = shown.map((f) => {
    const a = p.after.fixtures[f.id];
    const b = before?.[f.id];
    const cell = (fn) => (b ? `${fn(b)} → ${fn(a)}` : fn(a));
    return `| ${f.name} (\`${f.id}\`) | ${cell((x) => pair(x.dashSegments))}${over(a.dashSegments)} | ${cell((x) => pair(x.underlines))}${over(a.underlines)} | ${cell(canvas)} | ${cell(flags)} |`;
  });
  return [
    `${p.what}.${before ? ` Each cell reads ${m.before.label} → ${m.after.label}. Both are probed against this run's Chrome PDFs (the published package's PDFs through \`paint-probe.mjs --subject\`; the generator checks that Chrome's side of both probes agrees).` : ""}`,
    "",
    "| Fixture | Dashed/dotted border segments, vellora / Chrome | Underlines, vellora / Chrome | Pages whose canvas colour differs from Chrome's | Probe flags |",
    "|---|---:|---:|---:|---:|",
    ...rows,
    "",
    `${rest ? `The other ${plural(rest, "fixture")} have no dashed borders, underlines or canvas colour in either PDF. ` : ""}A count equal to Chrome's says the segments exist, not that each one sits where Chrome's does. Method: ${p.method}; ${p.tool}.`,
  ].join("\n");
}

function wptBlock(m) {
  const w = m.wpt;
  const cols = [w.before, w.after, ...(w.chrome ? [w.chrome] : [])];
  const row = (label, f) => `| ${label} | ${cols.map((c) => f(c.totals)).join(" | ")} |`;
  return [
    `${w.what}.`,
    "",
    `| | ${w.before.label} | ${w.after.label} (Blitz ${m.after.blitz}) |${w.chrome ? ` ${w.chrome.label} |` : ""}`,
    `|---|---:|---:|${w.chrome ? "---:|" : ""}`,
    row("Reftests", (t) => int(t.reftests)),
    row("Pass", (t) => `${int(t.pass)} (${pct2(t.passRate)})`),
    row("Pass without suspect-pass flags", (t) => `${int(t.passClean)} (${pct2(t.passRateClean)})`),
    row("Unsupported (rejected by the strict subset)", (t) => int(t.unsupported)),
    "",
    `Commits: ${w.before.commit.slice(0, 7)} (${w.before.date}), ${w.after.commit.slice(0, 7)} (${w.after.date}); WPT \`${String(w.wptCommit).slice(0, 8)}\`. ${w.chrome ? `${w.chrome.note}.` : ""} The 0.2.0 column was measured on a baseline commit that adds layout instrumentation to the 0.2.0 engine; its render-path equivalence to the tag is not separately verified.`,
  ].join("\n");
}

function chartsBlock(m, flavor) {
  return [
    `![Median word-position error per fixture, ${m.before.label} vs ${m.after.label}, log scale](${assetPath(flavor, "median-mm.svg")})`,
    "",
    `![Share of words within 1 mm of Chrome per fixture, ${m.before.label} vs ${m.after.label}](${assetPath(flavor, "within-1mm.svg")})`,
  ].join("\n");
}

function wptChartBlock(m, flavor) {
  return `![WPT reftests passed: ${m.before.label} engine, ${m.after.label}, Chrome reference](${assetPath(flavor, "wpt-pass-rate.svg")})`;
}

function galleryBlock(m, flavor) {
  const out = [];
  for (const f of m.fixtures) {
    const imgs = m.images.filter((i) => i.fixture === f.id);
    if (!imgs.length) continue;
    out.push(`#### ${f.name}`, "");
    for (const i of imgs) {
      out.push(
        `![${f.name}, page ${i.page}: ${chromeShort(m)}, ${m.before.label}, ${m.after.label}](${assetPath(flavor, i.file)})`,
        "",
      );
    }
    if (f.attribution) out.push(`<sub>${attributionLine(f)}</sub>`, "");
  }
  return out.join("\n").trimEnd();
}

function attributionBlock(m) {
  return m.fixtures
    .filter((f) => f.attribution)
    .map((f) => `- ${attributionLine(f)}`)
    .join("\n");
}

function envBlock(m) {
  const e = m.environment;
  return [
    `- Status: **${m.status}** (${m.statusReason}). ${m.authority}`,
    `- Reference: ${m.reference.renderer}, ${m.reference.mode}.`,
    `- Before: ${m.before.label}, tag \`${m.before.tag}\`, commit \`${m.before.commit.slice(0, 7)}\`, Blitz ${m.before.blitz}. Scored ${m.before.measured}.`,
    `- After: ${m.after.label} \`${m.after.branch}\`, commit \`${m.after.commit.slice(0, 7)}\`, Blitz ${m.after.blitz}. Run \`${m.after.runId}\` (${m.after.measured}).`,
    `- Environment: ${e.os}, ${e.cpu}, Node ${e.node}, ${e.rustc}, PyMuPDF ${e.pymupdf}, ${e.poppler}.`,
    `- Word positions: ${m.method.extractor}; pairing: ${String(m.method.pairing).replace("<->", "↔")}; quantiles: ${m.method.quantiles}.`,
    `- Run command: \`${m.after.command}\``,
    m.gate
      ? `- Gate: \`${m.gate.command}\` → ${m.gate.verdict} (${m.gate.date}).`
      : "- Gate: none supplied.",
    ...(m.paint
      ? [
          `- Paint probe (report-only): \`${m.paint.after.command}\`${m.paint.before ? `; published package: \`${m.paint.before.command}\`` : ""}.`,
        ]
      : []),
    `- Page images: \`${m.commands.images ?? "n/a"}\``,
    `- This page: \`${m.commands.regenerate ?? "n/a"}\``,
    `- Raw values: [manifest.json](${MANIFEST_URL}).`,
  ].join("\n");
}

export function renderBlocks(m, flavor) {
  return {
    status: statusBlock(m, flavor),
    readme: readmeBlock(m),
    headline: headlineBlock(m),
    hero: heroBlock(m, flavor),
    charts: chartsBlock(m, flavor),
    "wpt-chart": wptChartBlock(m, flavor),
    table: tableBlock(m),
    losses: lossesBlock(m),
    wpt: wptBlock(m),
    paint: paintBlock(m),
    gallery: galleryBlock(m, flavor),
    attribution: attributionBlock(m),
    env: envBlock(m),
  };
}

const BLOCK_RE = /<!-- fidelity-evidence:([a-z-]+) -->\n([\s\S]*?)<!-- \/fidelity-evidence:\1 -->/g;

/** Replace every generated block in `text`; unknown block names throw. */
export function applyBlocks(text, blocks) {
  return text.replace(BLOCK_RE, (_, name) => {
    if (!(name in blocks)) throw new Error(`unknown fidelity-evidence block "${name}"`);
    return `<!-- fidelity-evidence:${name} -->\n${blocks[name]}\n<!-- /fidelity-evidence:${name} -->`;
  });
}

export const blockNames = (text) => [...text.matchAll(BLOCK_RE)].map((x) => x[1]);

/** [{ file, problem }] for files whose generated blocks differ from the manifest. */
export function checkDocs(manifest, readFile) {
  const problems = [];
  for (const file of DOC_FILES) {
    const text = readFile(file);
    if (blockNames(text).length === 0) {
      problems.push({ file, problem: "no fidelity-evidence block" });
      continue;
    }
    const want = applyBlocks(text, renderBlocks(manifest, flavorOf(file)));
    if (want !== text) problems.push({ file, problem: "generated blocks are stale" });
  }
  return problems;
}
