#!/usr/bin/env node
// Evidence for the pdf-probe v2 re-score of the committed chain (pin -> beta4 -> beta4-gated ->
// port/00-start -> ... -> port/07): per link and fixture, v1 vs v2 statistics; the v2 gate of every
// link against the previous one and against port/00-start; and every pdf-probe item a link
// ACCEPTED under v1 (acceptedRegressions, unchanged in the manifests: they are history), re-judged
// under v2 against the previous link and against 00-start.
//
//   node fidelity/gate/pdf-probe-rescore-report.mjs [--out <file.json>]
//
// Inputs: the committed baselines (v1 history via loadBaselineDir(dir, { pdfProbe: "v1" }), v2 the
// gated section) and, to identify which word a v1 key meant, the run copies recorded in each
// manifest's pdfProbeRescore.source.run (~/.cache/vellora-fidelity/run-all-*, never written).
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { portable } from "../combine/env.mjs";
import { probeResultV2 } from "../layout-diff/lib/pdf-probe-v2.mjs";
import { pdfWordsV2, requirePython } from "../layout-diff/lib/pdf-words.mjs";
import { compareSnapshots } from "./compare.mjs";
import { compactPdfProbe, loadBaselineDir } from "./snapshot.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");
const B = join(repoRoot, "fidelity", "baselines");
export const CHAIN = [
  "pin",
  "beta4",
  "beta4-gated",
  "port/00-start",
  "port/01-pagination-gaps",
  "port/02-delete-noop-passes",
  "port/03-table-passes",
  "port/04-block-offset",
  "port/05-walk-rewrite",
  "port/06-page-rules",
  "port/07-media-print",
];
const TOL = 1;
const r2 = (v) => (v === null || v === undefined ? null : Math.round(v * 100) / 100);
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

function stats(pairs) {
  const ax = pairs.map((p) => Math.abs(p.dx));
  const ay = pairs.map((p) => Math.abs(p.dy));
  return {
    pairs: pairs.length,
    worstAbsDx: r2(ax.length ? Math.max(...ax) : null),
    medianAbsDx: r2(median(ax)),
    worstAbsDy: r2(ay.length ? Math.max(...ay) : null),
    medianAbsDy: r2(median(ay)),
  };
}

function v1Stats(s) {
  const same = s.pairs.filter((p) => p.samePage !== false);
  return {
    ...stats(same),
    crossPagePairs: s.pairs.length - same.length,
    words: s.words ?? null,
    unpairedVellora: s.words ? s.words.vellora - s.pairs.length : null,
    unpairedChrome: s.words ? s.words.chrome - s.pairs.length : null,
  };
}

const v2Stats = (s) => ({
  ...stats(s.pairs),
  unpairedVellora: s.words.unpairedVellora,
  unpairedChrome: s.words.unpairedChrome,
});

const expandHome = (p) => p.replace(/^~(?=\/)/, homedir());

/** v2 comparison of two baselines' pdf-probe sections only (other sections are irrelevant here). */
function gateV2(before, after) {
  const strip = (s) => ({
    ...s,
    fixtures: [],
    wpt: { expectations: null },
    crashtests: null,
    canaries: null,
    codeChecks: null,
    integrity: { ok: true, checked: 0, problems: [] },
    source: { kind: "baseline" },
  });
  const r = compareSnapshots(strip(before), strip(after));
  const per = {};
  for (const i of r.items) {
    const fx = i.key.split("|")[1];
    const kind = i.key.endsWith("|dx")
      ? "dx"
      : i.key.endsWith("|dy")
        ? "dy"
        : i.key.endsWith("|pairing")
          ? "pairing"
          : (i.key.split("|")[2] ?? "fixture");
    per[fx] ??= {};
    per[fx][`${i.class} ${kind}`] = (per[fx][`${i.class} ${kind}`] ?? 0) + 1;
  }
  return {
    verdict: r.verdict,
    refusals: r.refusals,
    counts: r.counts,
    perFixture: per,
    gating: r.items.filter((i) => i.gating),
  };
}

/** The vellora word a v1 key (`<text>#<n>`) of a run's pdf-probe.json named (n-th pair of that text). */
function v1Word(probe, k) {
  const seen = new Map();
  for (const p of probe.pairs) {
    const norm = p.text.normalize("NFC");
    const n = (seen.get(norm) ?? 0) + 1;
    seen.set(norm, n);
    if (`${norm}#${n}` === k) return p;
  }
  return null;
}

/** The PyMuPDF word whose pdftotext box is `w` (page, text, xMin = origin x, top within 1.2 em). */
function v2WordOf(words, w) {
  const hits = words.filter(
    (x) =>
      x.page === w.page &&
      x.text.normalize("NFC") === w.text.normalize("NFC") &&
      Math.abs(x.x - w.x) < 0.05 &&
      x.y - w.y > 0 &&
      x.y - w.y < 1.2 * x.size,
  );
  return hits.length === 1 ? hits[0] : null;
}

function classify(dAfter, dBefore) {
  const d = Math.abs(dAfter) - Math.abs(dBefore);
  if (d > TOL + 1e-9) return "worse>1pt";
  if (d < -(TOL + 1e-9)) return "improved>1pt";
  return d > 1e-9 ? "within1pt-worse" : d < -1e-9 ? "within1pt-better" : "identical";
}

function main() {
  const python = requirePython();
  const out = {
    what: "pdf-probe v1 vs v2 over the committed chain; v2 gate per link; v1-accepted pdf-probe items re-judged under v2",
    command: `node ${process.argv.slice(1).join(" ")}`,
    date: new Date().toISOString(),
    tolerancePt: TOL,
    classes: {
      "worse>1pt": "|d| grew by more than 1 pt under v2 (the v2 gate fails on it)",
      "improved>1pt": "|d| shrank by more than 1 pt",
      "within1pt-worse": "|d| grew by at most 1 pt (v2 gate: unchanged, counted withinTolerance)",
      "within1pt-better": "|d| shrank by at most 1 pt",
      identical: "same |d|",
      "unpaired-after": "under v2 the link's word has no Chrome partner within 36 pt on its page",
      "unpaired-before":
        "the Chrome word the link's word pairs with under v2 was unpaired in the compared link",
      unmapped: "the v1 key's vellora word could not be identified as exactly one PyMuPDF word",
    },
    links: {},
    gateV2: {},
    accepted: {},
  };
  const snaps = {};
  const v1 = {};
  for (const link of CHAIN) {
    snaps[link] = loadBaselineDir(join(B, link));
    v1[link] = loadBaselineDir(join(B, link), { pdfProbe: "v1" }).pdfProbe;
    const fx = {};
    for (const f of new Set([
      ...Object.keys(v1[link] ?? {}),
      ...Object.keys(snaps[link].pdfProbe ?? {}),
    ])) {
      fx[f] = {
        v1: v1[link]?.[f] ? v1Stats(v1[link][f]) : null,
        v2: snaps[link].pdfProbe?.[f] ? v2Stats(snaps[link].pdfProbe[f]) : null,
      };
    }
    const m = snaps[link].manifest.pdfProbeRescore;
    out.links[link] = {
      rescore: m
        ? { run: m.source.run, missing: m.missing, substitute: Boolean(m.source.substitute) }
        : null,
      fixtures: fx,
    };
  }
  for (let i = 1; i < CHAIN.length; i++) {
    const [prev, link] = [CHAIN[i - 1], CHAIN[i]];
    const vsPrev = gateV2(snaps[prev], snaps[link]);
    const vsStart = link.startsWith("port/") ? gateV2(snaps["port/00-start"], snaps[link]) : null;
    out.gateV2[link] = {
      vsPrevious: { baseline: prev, ...vsPrev, gating: vsPrev.gating.length },
      ...(vsStart
        ? { vs00Start: { baseline: "port/00-start", ...vsStart, gating: vsStart.gating.length } }
        : {}),
    };
  }
  // v1-accepted pdf-probe items, re-judged under v2.
  const words = new Map();
  const wordsOf = (run, fx, who) => {
    const k = `${run}|${fx}|${who}`;
    if (!words.has(k)) {
      words.set(k, pdfWordsV2(join(run, "layout-diff", fx, "run-all", `${who}.pdf`), python).words);
    }
    return words.get(k);
  };
  for (let i = 1; i < CHAIN.length; i++) {
    const [prev, link] = [CHAIN[i - 1], CHAIN[i]];
    const accepted = (snaps[link].manifest.acceptedRegressions ?? []).filter((a) =>
      a.key.startsWith("pdf-probe|"),
    );
    if (!accepted.length) continue;
    const run = expandHome(snaps[link].manifest.pdfProbeRescore.source.run);
    const res = {};
    const probes = new Map();
    for (const a of accepted) {
      const [, fx, k, axis = "dy"] = a.key.split("|");
      const label = a.label ?? "unlabelled";
      res[label] ??= { n: 0, byFixture: {} };
      res[label].n++;
      res[label].byFixture[fx] ??= { n: 0, vsPrevious: {}, vs00Start: {}, examples: [] };
      const bucket = res[label].byFixture[fx];
      bucket.n++;
      const bump = (cmp, cls) => {
        bucket[cmp][cls] = (bucket[cmp][cls] ?? 0) + 1;
      };
      const v1Probe = JSON.parse(
        readFileSync(join(run, "layout-diff", fx, "run-all", "pdf-probe.json"), "utf8"),
      );
      const p = v1Word(v1Probe, k);
      const vw = p ? v2WordOf(wordsOf(run, fx, "vellora"), { ...p.vellora, text: p.text }) : null;
      if (!vw) {
        bump("vsPrevious", "unmapped");
        bump("vs00Start", "unmapped");
        continue;
      }
      if (!probes.has(fx)) {
        const probe = probeResultV2({
          velloraWords: wordsOf(run, fx, "vellora"),
          chromeWords: wordsOf(run, fx, "chrome"),
        });
        // The recomputed section must be the committed one (same code, same PDFs).
        const same =
          JSON.stringify(compactPdfProbe(probe)) === JSON.stringify(snaps[link].pdfProbe[fx]);
        if (!same) throw new Error(`${link} ${fx}: recomputed v2 section differs from committed`);
        probes.set(fx, probe);
      }
      const pair = probes
        .get(fx)
        .pairs.find(
          (q) => q.vellora.page === vw.page && q.vellora.x === vw.x && q.vellora.y === vw.y,
        );
      const ax = axis === "dx" ? "dx" : "dy";
      for (const [cmp, base] of [
        ["vsPrevious", prev],
        ["vs00Start", "port/00-start"],
      ]) {
        if (!pair) {
          bump(cmp, "unpaired-after");
          continue;
        }
        const q = snaps[base].pdfProbe?.[fx]?.pairs.find((x) => x.k === pair.k);
        if (!q) {
          bump(cmp, "unpaired-before");
          continue;
        }
        const cls = classify(pair[`${ax}_pt`], q[ax]);
        bump(cmp, cls);
        if (cmp === "vsPrevious" && bucket.examples.length < 3 && cls === "worse>1pt") {
          bucket.examples.push({
            v1Key: a.key,
            v2Key: pair.k,
            axis: ax,
            before: q[ax],
            after: pair[`${ax}_pt`],
          });
        }
      }
    }
    for (const l of Object.values(res)) {
      l.vsPrevious = {};
      l.vs00Start = {};
      for (const b of Object.values(l.byFixture)) {
        for (const cmp of ["vsPrevious", "vs00Start"]) {
          for (const [c, n] of Object.entries(b[cmp])) l[cmp][c] = (l[cmp][c] ?? 0) + n;
        }
      }
    }
    out.accepted[link] = { previous: prev, labels: res };
  }
  const file =
    process.argv.indexOf("--out") >= 0 ? process.argv[process.argv.indexOf("--out") + 1] : null;
  const text = `${JSON.stringify(portable(out, repoRoot), null, 2)}\n`;
  if (file) writeFileSync(file, text);
  else process.stdout.write(text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
