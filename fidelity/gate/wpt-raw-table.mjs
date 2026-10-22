#!/usr/bin/env node
// WPT lost-pass attribution table from a `fidelity/wpt/run.mjs --raw` run (fidelity/wpt/README.md
// "Raw-Blitz mode"). For every test that is a pass in a reference expectation document (the pin,
// the head) and not a pass in the subject document (a chain link), it joins:
//   - the outcome of every committed expectation document of the chain (the first link where the
//     pass was lost),
//   - the raw run's `outcome` and `rawOutcome` (and whether the raw and product renderings of the
//     test and its first reference are byte-identical PDFs, when the run kept PDFs),
//   - Chrome's outcome and page counts (`chrome` of the raw run, from --chrome or --chrome-from),
//   - Blitz's own runner status (`upstream`) when a results.json carries it,
// and the candidate class of `rawCandidateClass` (fidelity/wpt/lib/raw.mjs). Read-only.
//
//   node fidelity/gate/wpt-raw-table.mjs --run <raw run dir> --subject <expectations.json>
//     --ref pin=<expectations.json> --ref head=<expectations.json>
//     [--chain <name>=<expectations.json> ...] [--upstream-from <results.json>]
//     [--old-run <ref name>=<results.json> ...]   the ref's own run (old pass vs Chrome, (a))
//     [--portable <prefix>=<label> ...] --out <dir>
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { oldPassProvenFalse, rawCandidateClass } from "../wpt/lib/raw.mjs";

function parse(argv) {
  const o = { refs: [], chain: [], portable: [], oldRuns: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    const pair = (s) => {
      const k = s.indexOf("=");
      return [s.slice(0, k), s.slice(k + 1)];
    };
    if (a === "--run") o.run = v();
    else if (a === "--subject") o.subject = v();
    else if (a === "--ref") o.refs.push(pair(v()));
    else if (a === "--chain") o.chain.push(pair(v()));
    else if (a === "--upstream-from") o.upstreamFrom = v();
    else if (a === "--old-run") o.oldRuns.push(pair(v()));
    else if (a === "--portable") o.portable.push(pair(v()));
    else if (a === "--out") o.out = v();
    else throw new Error(`unknown option ${a}`);
  }
  for (const k of ["run", "subject", "out"]) if (!o[k]) throw new Error(`--${k} is required`);
  return o;
}

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

/** Whether the raw and product passes wrote byte-identical PDFs for `side` (lhs|rhs) of `test`. */
export function samePdf(runDir, test, side) {
  const a = join(runDir, "artifacts", test, `${side}.pdf`);
  const b = join(runDir, "raw-artifacts", test, `${side}.pdf`);
  if (!existsSync(a) || !existsSync(b)) return null;
  return readFileSync(a).equals(readFileSync(b));
}

/**
 * How the raw render fails relative to the product one: `identical-pdf` (test and first reference
 * byte-identical in both renders), `same-diff` (same first failing comparison, same differing
 * pixel count and max difference), `different`, or null when raw passed / was not run.
 */
export function sameWay(row, r) {
  if (!r || row.rawOutcome === "pass" || row.rawOutcome === null) return null;
  if (row.samePdf?.test && row.samePdf?.firstRef) return "identical-pdf";
  const a = r.comparisons?.[0];
  const b = r.raw?.comparisons?.[0];
  if (
    a &&
    b &&
    a.rhs === b.rhs &&
    a.totalPixels === b.totalPixels &&
    a.maxDifference === b.maxDifference &&
    JSON.stringify(a.pageCounts) === JSON.stringify(b.pageCounts)
  ) {
    return "same-diff";
  }
  return "different";
}

/** The table rows (pure apart from `samePdfOf`). */
export function buildRows({
  subject,
  refs,
  chain,
  tests,
  upstream,
  samePdfOf,
  oldRuns = new Map(),
}) {
  const byTest = new Map(tests.map((t) => [t.test, t]));
  const rows = [];
  for (const [test, after] of Object.entries(subject.results)) {
    if (after === "pass") continue;
    const views = [];
    for (const [name, doc] of refs) {
      if (doc.results[test] !== "pass") continue;
      views.push(doc.suspectPasses?.[test] ? `${name}-flagged` : name);
    }
    if (!views.length) continue;
    const r = byTest.get(test);
    const chainOutcomes = Object.fromEntries(chain.map(([n, d]) => [n, d.results[test] ?? null]));
    let lostAt = null;
    for (let i = 1; i < chain.length; i++) {
      const prev = chain[i - 1][1].results[test];
      const cur = chain[i][1].results[test];
      if (prev === "pass" && cur !== "pass") lostAt = chain[i][0];
    }
    const chromeOutcome = r?.chrome?.outcome ?? null;
    // GATE-A1 (a) evidence, per view, from the view's own (old) run: was its pass false?
    const oldPass = {};
    for (const [name, doc] of refs) {
      if (doc.results[test] !== "pass") continue;
      const old = oldRuns.get(name)?.get(test);
      oldPass[name] = {
        ...oldPassProvenFalse({
          flags: doc.suspectPasses?.[test],
          pages: old?.comparisons?.[0]?.pageCounts?.[0],
          chromePages: old?.chrome?.comparisons?.[0]?.pageCounts?.[0],
        }),
        pages: old?.comparisons?.[0]?.pageCounts?.[0] ?? null,
        chromePages: old?.chrome?.comparisons?.[0]?.pageCounts?.[0] ?? null,
        measured: Boolean(old),
      };
    }
    const row = {
      test,
      mode: r?.mode ?? null,
      views,
      refs: Object.fromEntries(refs.map(([n, d]) => [n, d.results[test] ?? null])),
      refFlags: Object.fromEntries(refs.map(([n, d]) => [n, d.suspectPasses?.[test] ?? null])),
      chain: chainOutcomes,
      lostAt,
      subject: after,
      outcome: r?.outcome ?? null,
      rawOutcome: r?.rawOutcome ?? null,
      samePdf: r ? { test: samePdfOf(test, "lhs"), firstRef: samePdfOf(test, "rhs") } : null,
      pageCounts: r?.comparisons?.[0]?.pageCounts ?? null,
      rawPageCounts: r?.raw?.comparisons?.[0]?.pageCounts ?? null,
      chrome: chromeOutcome,
      chromePageCounts: r?.chrome?.comparisons?.[0]?.pageCounts ?? null,
      upstream: upstream?.get(test) ?? null,
      oldPass,
    };
    row.rawSameWay = sameWay(row, r);
    row.candidates = Object.fromEntries(
      Object.entries(oldPass).map(([name, ev]) => [
        name,
        rawCandidateClass({
          outcome: row.outcome ?? after,
          rawOutcome: row.rawOutcome ?? undefined,
          oldPassFalse: ev.falsePass,
        }),
      ]),
    );
    const classes = [...new Set(Object.values(row.candidates))];
    row.candidate = classes.length === 1 ? classes[0] : "mixed";
    rows.push(row);
  }
  return rows.sort((a, b) => (a.test < b.test ? -1 : 1));
}

function tally(rows, view) {
  const out = {};
  const name = view.replace(/-flagged$/, "");
  for (const r of rows) {
    if (!r.views.includes(view)) continue;
    const c = r.candidates[name];
    out[c] = (out[c] ?? 0) + 1;
  }
  return out;
}

function markdown(rows, meta) {
  const views = [...new Set(rows.flatMap((r) => r.views))].sort();
  const L = [];
  L.push("# WPT lost passes: raw-Blitz attribution");
  L.push("");
  L.push(
    "Local macOS run, INDICATIVE. Generated by `fidelity/gate/wpt-raw-table.mjs`; classes are",
  );
  L.push(
    '`rawCandidateClass` candidates (fidelity/wpt/README.md "Raw-Blitz mode"), not gate verdicts.',
  );
  L.push("");
  L.push("| field | value |");
  L.push("|---|---|");
  for (const [k, v] of Object.entries(meta))
    L.push(`| ${k} | ${String(v).replace(/\|/g, "\\|")} |`);
  L.push("");
  L.push("## Candidates per view");
  L.push("");
  L.push("| view | tests | a | b | c | none |");
  L.push("|---|---|---|---|---|---|");
  for (const v of views) {
    const t = tally(rows, v);
    const n = rows.filter((r) => r.views.includes(v)).length;
    L.push(`| ${v} | ${n} | ${t.a ?? 0} | ${t.b ?? 0} | ${t.c ?? 0} | ${t.none ?? 0} |`);
  }
  L.push("");
  L.push("## Per test");
  L.push("");
  L.push(
    "`class`: (a) only when the view's OLD pass is proven false (ink flag or old page count != Chrome's, `oldPass` in the JSON); `chrome` = Chrome's own reftest verdict on the same test (supporting evidence, not the (a) criterion). `same PDF` = raw and product renderings byte-identical (test / first reference); `raw fails` = `identical-pdf`, `same-diff` (same comparison, pixel count, max difference) or `different`; `lost at` = the chain link where the pass was lost; `upstream` = Blitz's own runner (blitz-paint, `floats` on, dify tolerance; fidelity/wpt/README.md), from the 09 run copy.",
  );
  L.push("");
  const chainNames = Object.keys(rows[0]?.chain ?? {});
  L.push(
    `| test | mode | views | ${chainNames.join(" | ")} | lost at | outcome | rawOutcome | raw fails | same PDF | pages v/raw/chrome | chrome | upstream | class |`,
  );
  L.push(
    `|---|---|---|${chainNames.map(() => "---").join("|")}|---|---|---|---|---|---|---|---|---|`,
  );
  const short = (o) => (o === null ? "-" : o === "unsupported" ? "unsup" : o);
  const yn = (b) => (b === null || b === undefined ? "?" : b ? "y" : "n");
  for (const r of rows) {
    const pages = [r.pageCounts, r.rawPageCounts, r.chromePageCounts]
      .map((p) => (p ? p.join(":") : "-"))
      .join(" / ");
    L.push(
      `| \`${r.test}\` | ${r.mode ?? "-"} | ${r.views.join(", ")} | ${chainNames.map((n) => short(r.chain[n])).join(" | ")} | ${r.lostAt ?? "-"} | ${short(r.outcome)} | ${short(r.rawOutcome)} | ${r.rawSameWay ?? "-"} | ${yn(r.samePdf?.test)}/${yn(r.samePdf?.firstRef)} | ${pages} | ${short(r.chrome)} | ${r.upstream ?? "-"} | ${
        r.candidate === "mixed"
          ? Object.entries(r.candidates)
              .map(([n, c]) => `${n}:${c}`)
              .join(" ")
          : r.candidate
      } |`,
    );
  }
  return `${L.join("\n")}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const o = parse(process.argv.slice(2));
  const run = readJson(join(o.run, "results.json"));
  const upstream = o.upstreamFrom
    ? new Map(readJson(o.upstreamFrom).tests.map((t) => [t.test, t.upstream ?? null]))
    : null;
  const oldRuns = new Map(
    o.oldRuns.map(([name, p]) => [name, new Map(readJson(p).tests.map((t) => [t.test, t]))]),
  );
  const rows = buildRows({
    oldRuns,
    subject: readJson(o.subject),
    refs: o.refs.map(([n, p]) => [n, readJson(p)]),
    chain: o.chain.map(([n, p]) => [n, readJson(p)]),
    tests: run.tests,
    upstream,
    samePdfOf: (test, side) => samePdf(o.run, test, side),
  });
  const portable = (s) => o.portable.reduce((acc, [k, v]) => acc.split(k).join(v), String(s));
  const meta = {
    date: run.env?.date ?? null,
    command: portable(
      `node fidelity/gate/wpt-raw-table.mjs ${process.argv
        .slice(2)
        .filter((x, i, all) => x !== "--portable" && all[i - 1] !== "--portable")
        .join(" ")}`,
    ),
    rawRun: portable(o.run),
    rawRunCommand: portable(
      (run.env?.argv ?? [])
        .map((x) =>
          String(x).length > 300 ? `<${String(x).length}-char --filter regex: the tests below>` : x,
        )
        .join(" "),
    ),
    velloraCommit: run.env?.vellora?.commit ?? null,
    engine: run.env?.engine?.id ?? null,
    wptCommit: run.env?.wpt?.commit ?? null,
    chrome: run.chrome?.browserVersion ?? null,
    chromeFrom: portable(run.chrome?.reusedFrom ?? "-"),
    host: `${run.env?.platform ?? ""} ${run.env?.arch ?? ""} ${run.env?.os?.productVersion ?? ""} ${run.env?.os?.cpu ?? ""}`.trim(),
    node: run.env?.node ?? null,
    outcomeEqualsSubject: `${rows.filter((r) => r.outcome === r.subject).length}/${rows.length}`,
  };
  mkdirSync(o.out, { recursive: true });
  writeFileSync(join(o.out, "wpt-raw-table.json"), `${JSON.stringify({ meta, rows }, null, 1)}\n`);
  writeFileSync(join(o.out, "wpt-raw-table.md"), markdown(rows, meta));
  const views = [...new Set(rows.flatMap((r) => r.views))].sort();
  console.log(JSON.stringify(Object.fromEntries(views.map((v) => [v, tally(rows, v)]))));
}
