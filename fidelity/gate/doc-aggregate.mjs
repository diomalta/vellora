// Document-level aggregate rules of the gate (fidelity/ACCEPTANCE.md DOC-1..DOC-4; the strict exit
// contract conditions 2 and 3). The run's aggregate (fidelity/oracles/doc-aggregate.mjs, written by
// the run-all step `doc-aggregate` to <run>/doc-aggregate/summary.json) is compared per fixture with
// the published engine's (fidelity/baselines/pin/doc-aggregate.json, oracles/doc-aggregate-pin.mjs).
//
// DOC-1 medianMm may not exceed the pin's by more than DOC_AGGREGATE_TOLERANCE.medianMm.
// DOC-1 within1mmPct may not fall below the pin's by more than DOC_AGGREGATE_TOLERANCE.within1mmPct.
// DOC-1 missingWords may not exceed the pin's (count, 0).
//       p90Mm, extraWords, samePagePct are reported, never gated.
// DOC-2 comparability: same method, same input HTML (native.html sha256) and the same Chrome word
//       geometry as the pin was scored against; the pin's recorded run-to-run noise must be within
//       the tolerance. Otherwise the comparison is not valid: REFUSED under --main.
// DOC-3 a pin fixture absent from the run (or a run without a doc-aggregate) never reads as a pass.
// DOC-4 (contract condition 3, REF-P) pages == chromePages per fixture: always reported; gating only
//       under --contract.
// Everything here is report-only without --main (like the pin view, GATE-H3).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { METHOD } from "../oracles/lib/doc-aggregate.mjs";

export const DOC_AGGREGATE_RUN_FILE = join("doc-aggregate", "summary.json");
export const PIN_DOC_AGGREGATE_FILE = "doc-aggregate.json";

/**
 * Tolerances (a metric regresses when it moves the bad way by MORE than this). Derived from the
 * measured run-to-run noise (CONFIRMED 2026-10-27, local macOS INDICATIVE, recorded in
 * baselines/pin/doc-aggregate.json `noise`): two vellora renders byte-identical 9/9 (tip run
 * 20261023T004510Z vs repro 20261027T130144Z), two pin renders byte-identical 9/9, two Chrome
 * 155.0.8059.85 prints (stable build 2026-10-23, Chrome for Testing 2026-10-27) with identical word
 * geometry 9/9 (PDF bytes differ), so every metric's spread was 0. With zero noise the tolerance is
 * one unit of the reported resolution (0.01 mm, 0.1 percentage point; counts 0), so only a real
 * move gates. A pin whose recorded noise exceeds these refuses the comparison (DOC-2).
 */
export const DOC_AGGREGATE_TOLERANCE = Object.freeze({
  medianMm: 0.01,
  within1mmPct: 0.1,
  missingWords: 0,
});

/** The gated metrics: name -> the bad direction (+1: higher is worse, -1: lower is worse). */
export const DOC_GATED = Object.freeze({ medianMm: 1, within1mmPct: -1, missingWords: 1 });
export const DOC_REPORTED = Object.freeze(["p90Mm", "extraWords", "samePagePct", "pages"]);

const readMaybe = (p) => (p && existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null);

/** The run's aggregate: an explicit file, else <runDir>/doc-aggregate/summary.json (or null). */
export function loadRunDocAggregate(runDir, file = null) {
  return readMaybe(file ?? (runDir ? join(runDir, DOC_AGGREGATE_RUN_FILE) : null));
}

/** The pin reference of a pin baseline directory (or null). */
export function loadPinDocAggregate(pinDir) {
  return readMaybe(pinDir ? join(pinDir, PIN_DOC_AGGREGATE_FILE) : null);
}

const RESCORE =
  "re-score the pin: node fidelity/oracles/doc-aggregate-pin.mjs --engine <published checkout> --engine-commit <sha> --engine-blitz <rev> --run <this run> --pdf-out <dir> --noise-run <second run>";

/**
 * Evaluate DOC-1..DOC-4. `run` / `pin`: the loaded documents (null = absent). `main`: DOC-1/2/3
 * gate (a merge to main); `contract`: DOC-4 gates too. Returns { status, verdict, refusals, items,
 * contractPages, table, tolerance }; items have the gate's item shape.
 */
export function evaluateDocAggregate({
  run,
  pin,
  main = false,
  contract = false,
  tolerance = DOC_AGGREGATE_TOLERANCE,
}) {
  const refusals = [];
  const items = [];
  const notes = [];
  const out = { tolerance, main, contract, refusals, notes, items, table: [] };
  // Under --main a comparability problem refuses; otherwise it is a note of the report.
  const refuse = (why) => (main ? refusals : notes).push(why);
  if (!pin) refuse("no pin doc-aggregate reference (baselines/pin/doc-aggregate.json)");
  if (!run) {
    refuse(
      "the run has no doc-aggregate (run-all step doc-aggregate, or node fidelity/oracles/doc-aggregate.mjs --run <dir>)",
    );
  }
  if (!pin || !run) {
    out.status = "not-run";
    out.verdict = refusals.length ? "REFUSED" : "NOT-RUN";
    return out;
  }
  out.status = "measured";
  if (JSON.stringify(pin.method) !== JSON.stringify(run.method)) {
    refuse("the run and the pin were scored with different methods (DOC-2)");
  }
  for (const [m, tol] of Object.entries(tolerance)) {
    const noise = pin.noise?.max?.[m];
    if (noise === undefined) refuse(`the pin records no run-to-run noise for ${m} (DOC-2)`);
    else if (noise > tol) {
      refuse(`the pin's measured noise of ${m} (${noise}) exceeds the tolerance ${tol} (DOC-2)`);
    }
  }
  for (const [id, p] of Object.entries(pin.fixtures ?? {})) {
    const r = run.fixtures?.[id];
    const row = { fixture: id, pin: p, run: r ?? null, comparable: true, worse: [] };
    out.table.push(row);
    if (!r) {
      items.push({
        key: `doc-aggregate|${id}`,
        group: "doc-aggregate",
        check: "doc-aggregate",
        class: "doc-missing",
        gating: main,
        before: "measured",
        after: "absent",
        detail: `DOC-3: the pin measured ${id}, the run did not`,
      });
      continue;
    }
    for (const k of ["nativeHtmlSha256", "chromeGeometrySha256"]) {
      if (p.inputs?.[k] !== r.inputs?.[k]) {
        row.comparable = false;
        refuse(`DOC-2 ${id}: ${k} differs from the pin's (${RESCORE})`);
      }
    }
    for (const [m, dir] of Object.entries(DOC_GATED)) {
      const b = p[m];
      const a = r[m];
      const worseBy = a === null || a === undefined ? Number.POSITIVE_INFINITY : (a - b) * dir;
      if (worseBy > tolerance[m] + 1e-9) {
        row.worse.push(m);
        items.push({
          key: `doc-aggregate|${id}|${m}`,
          group: "doc-aggregate",
          check: "doc-aggregate",
          class: "doc-regression",
          gating: main,
          before: b,
          after: a ?? "unmeasured",
          detail: `DOC-1 ${id} ${m}: ${a} vs the published engine's ${b} (tolerance ${tolerance[m]})`,
        });
      }
    }
  }
  out.contractPages = Object.entries(run.fixtures ?? {}).map(([id, r]) => ({
    fixture: id,
    pages: r.pages,
    chromePages: r.chromePages,
    ok: r.pages === r.chromePages,
  }));
  for (const c of out.contractPages.filter((x) => !x.ok)) {
    items.push({
      key: `doc-aggregate|${c.fixture}|pages`,
      group: "doc-aggregate",
      check: "contract-pages",
      class: "contract-pages",
      gating: contract,
      before: c.chromePages,
      after: c.pages,
      detail: `DOC-4 (contract condition 3, REF-P) ${c.fixture}: ${c.pages} pages vs Chrome's ${c.chromePages}${contract ? "" : " (report-only without --contract)"}`,
    });
  }
  const gating = items.filter((i) => i.gating).length;
  out.counts = {
    regressions: items.filter((i) => i.class === "doc-regression").length,
    missing: items.filter((i) => i.class === "doc-missing").length,
    contractPagesFailing: out.contractPages.filter((c) => !c.ok).length,
    gating,
  };
  out.condition2 = items.some((i) => i.class !== "contract-pages") ? "FAIL" : "PASS";
  out.condition3 = out.counts.contractPagesFailing ? "FAIL" : "PASS";
  out.verdict = refusals.length ? "REFUSED" : gating ? "FAIL" : "PASS";
  return out;
}

/** Markdown table of the section (gate report). */
export function renderDocAggregateMarkdown(d) {
  if (!d) return [];
  const lines = [
    "## Document aggregate vs the published engine (DOC-1..DOC-4)",
    "",
    `Verdict ${d.verdict}; contract condition 2 ${d.condition2 ?? "-"}, condition 3 ${d.condition3 ?? "-"}; --main ${d.main}, --contract ${d.contract}; tolerance median ${d.tolerance.medianMm} mm, <=1 mm share ${d.tolerance.within1mmPct} pp, missing ${d.tolerance.missingWords}.`,
    "",
  ];
  for (const r of [...d.refusals, ...(d.notes ?? [])]) lines.push(`- ${r}`);
  if (d.table.length) {
    lines.push(
      "",
      "| fixture | median mm pin → run | p90 mm pin → run | <=1 mm % pin → run | missing pin → run | pages run / Chrome | worse |",
      "|---|---|---|---|---|---|---|",
    );
    for (const r of d.table) {
      const f = (m) => `${r.pin[m]} → ${r.run ? r.run[m] : "-"}`;
      lines.push(
        `| ${r.fixture} | ${f("medianMm")} | ${f("p90Mm")} | ${f("within1mmPct")} | ${f("missingWords")} | ${r.run ? `${r.run.pages} / ${r.run.chromePages}` : "-"} | ${r.run ? r.worse.join(", ") || "-" : "absent"}${r.comparable ? "" : " (not comparable)"} |`,
      );
    }
  }
  lines.push("");
  return lines;
}
