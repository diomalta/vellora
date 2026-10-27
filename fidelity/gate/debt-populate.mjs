#!/usr/bin/env node
// Build DEBT.json entries (schema vellora-fidelity/debt/2, fidelity/ACCEPTANCE.md GATE-D1..D7)
// from ONE gated run: the head items a gate report leaves uncovered, the committed layer-vector
// files of that run (gate/layer-vector.mjs) and the run's WPT raw-Blitz outcomes. It proposes only
// what the ledger's own rules accept, and lists everything else as a residual with the reason:
//   word / spec-anchor items   the key's committed vector satisfies the relaxed (b) rule
//                              (gate/debt.mjs relaxedB) with exactly its over-tolerance steps as
//                              compensators, AND the vector describes the run (|run - P| within
//                              the run tolerance: on later pages of a fixture whose page count
//                              differs from Chrome's, P is not the PDF position, rule vi)
//   words on pages >= 2 of a fixture whose page count differs from Chrome's are never per-word
//                              keys (rule vi: one page-scoped entry per page-count criterion);
//                              they are listed as residual route "page-scope"
//   WPT pass -> fail           GATE-A3 (b): the run's rawOutcome equals its outcome and, when both
//                              record comparisons, the raw page counts equal the product's
// Entries GROUP keys sharing fixture, owner, compensators and introducedBy. introducedBy is
// computed, not guessed: the first port link (head exclusive, in order) whose comparison with the
// head has the key beyond tolerance; a key no committed link has is introduced by --step.
// Per key: headValue = the head comparison's `before`, measured = its `after` (signed for pdf-probe
// dx/dy), ceiling = |measured| (lower-abs) or measured (lower): no slack (GATE-D7).
//
//   node fidelity/gate/debt-populate.mjs --report <gate-report.json> --run <run-all dir>
//     --vectors <repo-relative layer-vector file>... --step <NN-name> [--chain fidelity/baselines/port]
//     [--head <baseline dir>] [--accept <accepted.json>] [--date YYYY-MM-DD] --out <DEBT.json>
//     [--residual <residual.json>] [--pin-out <pin-classification.json>
//     [--pin-candidates <ledger-candidates.json[.gz]>] [--pin-report <gate-report.json>]]
//   --pin-report  the report whose pin view is classified (default --report; pass the re-gate WITH
//              the ledger so that only its (c) items are classified)
//   --vectors may name the pin view's vector file too: a key is looked up in each file in order.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { compareSnapshots } from "./compare.mjs";
import {
  DEBT_SCHEMA,
  HEAD_GATING_CLASSES,
  pdfProbePage,
  relaxedB,
  resolveVectorRef,
} from "./debt.mjs";
import { relaxedBFacts } from "./layer-vector.mjs";
import { verdictIndex } from "./metrics.mjs";
import { loadSnapshot, readJsonMaybeGz } from "./snapshot.mjs";
import { vectorRunTolerance } from "./tolerances.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(here, "..", "..");
const r2 = (v) => Math.round(v * 100) / 100;
/** A JSON file, gzipped when its name ends in .gz (or `<path>.gz` next to a missing `<path>`). */
const readAny = (p) =>
  p.endsWith(".gz") ? JSON.parse(gunzipSync(readFileSync(p)).toString("utf8")) : readJsonMaybeGz(p);

/** tolClass of a head item (pdf-probe word items carry none: pdf-probe-pt). */
export const tolClassOf = (item) =>
  item.tolClass ??
  (/\|(dx|dy)$/.test(item.key) && item.check === "pdf-probe" ? "pdf-probe-pt" : null);

/** The ceiling GATE-D7 allows for a key: |measured| (pdf-probe) or measured, no slack. */
export function ceilingOf(item) {
  if (typeof item.after !== "number") return item.after;
  return item.better === "lower-abs" || tolClassOf(item) === "pdf-probe-pt"
    ? r2(Math.abs(item.after))
    : item.after;
}

/**
 * Classify one head item against its vector. Returns { ok: true, compensators } or { ok: false,
 * why }. `vector` null = no committed vector for the key.
 */
export function classifyVectorItem(item, vector) {
  if (!vector) return { ok: false, why: "no committed layer vector for the key" };
  const tolClass = tolClassOf(item);
  const facts = relaxedBFacts(vector, tolClass);
  if (!facts.possible) {
    return { ok: false, why: `relaxed (b) rule fails: ${facts.why} (${vector.unit})` };
  }
  if (typeof vector.P === "number") {
    const tol = vectorRunTolerance(tolClass, vector.unit);
    const gap = Math.abs(vector.run - vector.P);
    if (gap > tol + 1e-9) {
      return {
        ok: false,
        why: `the vector does not describe the run: |run - P| ${r2(gap)} ${vector.unit} > ${r2(tol)} (P, layout-diff's in-page drift vs Chrome's continuous layout, is not this word's PDF position: e.g. a later page whose page-break offset differs from Chrome's)`,
      };
    }
  }
  return { ok: true, compensators: facts.nonZeroVelloraSteps.map((s) => s.layer).sort() };
}

/**
 * Fixtures whose page count differs from the reference in a snapshot: Map(fixture -> [page-delta
 * metric key = value]). Their words on pages >= 2 belong to rule vi (page scope).
 */
export function pageMismatchFixtures(snapshot) {
  const out = new Map();
  for (const [k, m] of verdictIndex(snapshot.fixtures ?? []).metrics) {
    if (m.tolClass !== "page-delta" || !(m.value > 0)) continue;
    const fx = k.split("|")[0];
    out.set(fx, [...(out.get(fx) ?? []), `${k} = ${m.value}`]);
  }
  return out;
}

/** GATE-A3 (b) for a WPT head item from the run's results.json record. */
export function classifyWptItem(item, record) {
  if (!record) return { ok: false, why: "no record in the run's wpt/results.json" };
  if (record.rawOutcome !== record.outcome || record.outcome !== item.after) {
    return {
      ok: false,
      why: `raw-Blitz outcome ${record.rawOutcome ?? "(none)"} is not the run's outcome ${record.outcome} (GATE-A3 (b) needs the same failure)`,
    };
  }
  const v = record.comparisons?.[0]?.pageCounts;
  const r = record.raw?.comparisons?.[0]?.pageCounts ?? record.rawComparisons?.[0]?.pageCounts;
  if (v && r && JSON.stringify(v) !== JSON.stringify(r)) {
    return {
      ok: false,
      why: `raw Blitz fails differently: page counts ${JSON.stringify(r)} vs the product's ${JSON.stringify(v)} (GATE-A3 (b) needs the same failure)`,
    };
  }
  return { ok: true, pageCounts: v ?? null };
}

/**
 * First link (in chain order) whose comparison with the head has `key` beyond tolerance.
 * `linkReports`: [{ link, keys: Set }] in chain order.
 */
export function introducedBy(key, linkReports, step) {
  return linkReports.find((l) => l.keys.has(key))?.link ?? step;
}

/** Group classified records into debt/2 entries. Pure. */
export function groupEntries(records, { evidence = [], date = null } = {}) {
  const groups = new Map();
  for (const r of records) {
    const g = [r.fixture, r.owner.layer, r.compensators.join("+"), r.introducedBy].join("|");
    if (!groups.has(g)) groups.set(g, { ...r, keys: [] });
    groups.get(g).keys.push(r.keyRecord);
  }
  const perFixture = new Map();
  return [...groups.values()].map((g) => {
    const n = (perFixture.get(g.fixture) ?? 0) + 1;
    perFixture.set(g.fixture, n);
    return {
      id: `DEBT-10-${g.fixture}-${n}`,
      class: "b",
      owner: g.owner,
      compensators: g.compensators,
      closesAt: g.closesAt ?? null,
      introducedBy: g.introducedBy,
      evidence: [...g.evidence, ...evidence],
      ...(date ? { date } : {}),
      keys: g.keys,
    };
  });
}

const OWNERS = {
  word: (fixture, axis) => ({
    layer: `blitz:text-position-${axis}`,
    component: `raw Blitz (blitz-dom 0.3.0-beta.4 + parley) layout of ${fixture}: N0, Blitz on the source HTML, already places each word's run off Chrome on ${axis}; the residual |run| <= |N0| (+ run tolerance) is Blitz's, and the vellora layers listed as compensators move the run by more than the 0.5 px step tolerance`,
    upstream: null,
  }),
  spec: (fixture) => ({
    layer: "blitz:block-offset",
    component: `raw Blitz block stacking of ${fixture}: the block title's run is below Chrome in N0 and no vellora layer moves it (all layer steps 0); its error vs the MOC 3.8.1 suggested position is Chrome's own error plus that raw Blitz offset`,
    upstream: null,
  }),
  wpt: () => ({
    layer: "blitz:wpt-raw-fail",
    component:
      "raw Blitz (no vellora pass; wpt/run.mjs --raw) fails these tests the same way as the product (same outcome and page counts): GATE-A3 route (b)",
    upstream: null,
  }),
};

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const all = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []));
  const reportFile = val("--report");
  const runDir = val("--run") && resolve(val("--run"));
  const step = val("--step");
  if (!reportFile || !runDir || !step || !val("--out")) {
    process.stderr.write(
      "usage: node fidelity/gate/debt-populate.mjs --report <gate-report.json> --run <run dir> --vectors <file>... --step <NN-name> --out <DEBT.json> [--residual <file>] [--accept <accepted.json>]\n",
    );
    process.exitCode = 2;
    return;
  }
  const report = readAny(resolve(reportFile));
  const accepted = new Set(
    val("--accept")
      ? (JSON.parse(readFileSync(resolve(val("--accept")), "utf8")).acceptedRegressions ?? [])
          .filter((e) => e.class === "a")
          .map((e) => e.key)
      : [],
  );
  const items = report.head.items.filter(
    (i) => i.gating && (i.class === "head-regression" || HEAD_GATING_CLASSES.includes(i.class)),
  );
  // Chain: comparisons of every committed link with the head, for introducedBy.
  const chainDir = resolve(val("--chain") ?? join(here, "..", "baselines", "port"));
  const headDir = resolve(val("--head") ?? join(chainDir, "00-start"));
  const head = loadSnapshot(headDir);
  const links = readdirSync(chainDir)
    .filter((d) => /^\d{2}-/.test(d) && existsSync(join(chainDir, d, "manifest.json")))
    .filter((d) => resolve(chainDir, d) !== headDir)
    .sort();
  const linkReports = links.map((link) => {
    const r = compareSnapshots(head, loadSnapshot(join(chainDir, link)));
    return {
      link,
      keys: new Set(r.items.filter((i) => HEAD_GATING_CLASSES.includes(i.class)).map((i) => i.key)),
    };
  });
  // Vectors.
  const vectorFiles = all("--vectors");
  const cache = new Map();
  const vectorOf = (key) => {
    for (const f of vectorFiles) {
      const r = resolveVectorRef(`${f}#${key}`, { root: REPO_ROOT, cache });
      if (r.vector) return { vector: r.vector, ref: `${f}#${key}` };
    }
    return null;
  };
  const wpt = new Map(
    (JSON.parse(readFileSync(join(runDir, "wpt", "results.json"), "utf8")).tests ?? []).map((t) => [
      t.test,
      t,
    ]),
  );
  const runName = runDir.split(homedir()).join("~");
  const pageMismatch = pageMismatchFixtures(loadSnapshot(runDir));
  // One item -> { record } (a ledger key) or { residual }. Shared by the head items and the pin view.
  const classify = (i) => {
    if (accepted.has(i.key)) {
      return {
        residual: { key: i.key, route: "a", why: "class-a acceptance of the step (--accept)" },
      };
    }
    const base = { key: i.key, before: i.before, after: i.after };
    const page = pdfProbePage(i.key);
    const pfx = i.key.startsWith("pdf-probe|") ? i.key.split("|")[1] : null;
    if (page !== null && page >= 2 && pageMismatch.has(pfx)) {
      return {
        residual: {
          ...base,
          route: "page-scope",
          why: `page ${page} of ${pfx}, whose page count differs from Chrome's (${pageMismatch.get(pfx).join(", ")}): rule vi collapses such words into ONE page-scoped entry on the page-count metric, never per-word keys`,
        },
      };
    }
    if (i.check === "wpt") {
      const c = classifyWptItem(i, wpt.get(i.test));
      if (!c.ok) return { residual: { ...base, route: "none", why: c.why } };
      return {
        record: {
          fixture: "wpt",
          owner: OWNERS.wpt(),
          compensators: [],
          introducedBy: introducedBy(i.key, linkReports, step),
          evidence: [
            `${runName}/wpt/results.json: rawOutcome = outcome = ${i.after}, raw page counts = product page counts`,
          ],
          keyRecord: {
            key: i.key,
            tolClass: "count",
            headValue: i.before,
            ceiling: i.after,
            measured: i.after,
            rawOutcome: wpt.get(i.test).rawOutcome,
          },
        },
      };
    }
    const tolClass = tolClassOf(i);
    const v = vectorOf(i.key);
    const c = typeof i.after === "number" ? classifyVectorItem(i, v?.vector) : null;
    if (!c?.ok) {
      return {
        residual: {
          ...base,
          // A vector that describes the run and still fails |run| <= |N0|: vellora made the item
          // worse than raw Blitz, the (c) evidence (GATE-A1). Anything else: no evidence either way.
          route: c?.why?.startsWith("relaxed (b) rule fails") ? "c" : "none",
          why: c?.why ?? `non-numeric value ${JSON.stringify(i.after)} (lost pairing): no vector`,
          vector: v?.vector ?? null,
        },
      };
    }
    const isSpec = /\|posErrMm$/.test(i.key);
    const fixture = i.key.startsWith("pdf-probe|") ? i.key.split("|")[1] : i.key.split("|")[0];
    const axis = i.key.split("|").at(-1);
    return {
      record: {
        fixture,
        owner: isSpec ? OWNERS.spec(fixture) : OWNERS.word(fixture, axis),
        compensators: c.compensators,
        introducedBy: introducedBy(i.key, linkReports, step),
        evidence: [
          `layer vectors: node fidelity/gate/layer-vector.mjs --run ${runName} (${vectorFiles.join(", ")})`,
        ],
        keyRecord: {
          key: i.key,
          tolClass,
          headValue: i.before,
          ceiling: ceilingOf(i),
          measured: i.after,
          layerVectorRef: v.ref,
        },
      },
    };
  };
  const records = [];
  const residual = [];
  for (const i of items) {
    const r = classify(i);
    if (r.record) records.push(r.record);
    else residual.push(r.residual);
  }
  const entries = groupEntries(records, {
    evidence: [
      `head items: ${reportFile.split(homedir()).join("~")} (head ${report.head.baseline}); built by node fidelity/gate/debt-populate.mjs ${argv.join(" ")}`
        .split(homedir())
        .join("~"),
    ],
  });
  // Self-check: every proposed entry passes the ledger's own relaxed (b) rule.
  const problems = entries.flatMap((e) =>
    relaxedB({
      ...e,
      keys: e.keys.map((k) =>
        k.layerVectorRef ? { ...k, layerVector: vectorOf(k.key).vector } : k,
      ),
    }),
  );
  if (problems.length)
    throw new Error(`proposed entries fail relaxed (b):\n${problems.join("\n")}`);
  const out = {
    schema: DEBT_SCHEMA,
    head: "port/00-start",
    note: "",
    entries,
    closed: [],
  };
  writeFileSync(resolve(val("--out")), `${JSON.stringify(out, null, 2)}\n`);
  if (val("--residual")) {
    writeFileSync(
      resolve(val("--residual")),
      `${JSON.stringify({ report: reportFile, residual }, null, 2)}\n`,
    );
  }
  if (val("--pin-out")) {
    // Pin view (GATE-H3): every item the gate report's pin view leaves (c), classified with the
    // same evidence rules. "b-provable" = the vector proves (b) (or raw Blitz fails the same way)
    // but the item is not a head-gating item, so the head-only ledger does not carry it. WPT items
    // with no raw-Blitz (b) route keep the candidate a prior ledger-candidates output recorded from
    // the pin run's WPT records (--pin-candidates), if any.
    const prior = new Map();
    if (val("--pin-candidates")) {
      const lc = readAny(resolve(val("--pin-candidates")));
      for (const c of lc.sections?.pin?.items ?? []) prior.set(c.key, c);
    }
    const headKeys = new Set(items.map((i) => i.key));
    const pinFile = val("--pin-report") ?? reportFile;
    const pinReport = readAny(resolve(pinFile));
    const pinC = (pinReport.pin?.items ?? []).filter((i) => i.pinClass === "c");
    const pinItems = pinC.map((i) => {
      const r = classify(i);
      const p = prior.get(i.key);
      if (r.record) {
        return {
          key: i.key,
          before: i.before,
          after: i.after,
          route: headKeys.has(i.key) ? "b" : "b-provable",
          why: headKeys.has(i.key)
            ? "a head item the ledger would cover"
            : "the layer vector proves (b) (or raw Blitz fails the same way), but the item is not worse than the head: the ledger is head debt (GATE-D1) and does not carry it",
          compensators: r.record.compensators,
          owner: r.record.owner.layer,
        };
      }
      const out = { ...r.residual, before: i.before, after: i.after };
      if (out.route === "none" && p && p.candidate !== "none" && i.check === "wpt") {
        out.route = p.candidate;
        out.why = `${out.why}; prior candidate (ledger-candidates, pin-wpt record): ${p.why}`;
      }
      return out;
    });
    const byRoute = {};
    for (const x of pinItems) byRoute[x.route] = (byRoute[x.route] ?? 0) + 1;
    writeFileSync(
      resolve(val("--pin-out")),
      `${JSON.stringify({ report: pinFile.split(homedir()).join("~"), pin: pinReport.pin?.baseline, total: pinItems.length, byRoute, items: pinItems }, null, 2)}\n`,
    );
    process.stdout.write(`debt-populate: pin (c) ${pinItems.length}: ${JSON.stringify(byRoute)}\n`);
  }
  process.stdout.write(
    `debt-populate: ${entries.length} entries, ${records.length} keys; residual ${residual.length} (${residual.filter((r) => r.route === "a").length} class-a)\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`debt-populate failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
