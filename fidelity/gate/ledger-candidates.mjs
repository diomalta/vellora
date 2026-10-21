#!/usr/bin/env node
// Candidate classes for the items a gate report's HEAD ratchet and PIN VIEW leave uncovered: what
// evidence exists today to make each one an (a) artefact acceptance or a (b) DEBT.json entry
// (fidelity/ACCEPTANCE.md GATE-A1), and which ones have no possible (a)/(b) classification yet.
// It CLASSIFIES CANDIDATES, it does not accept anything: the gate's formal classes stay
// (a) = a class-a acceptance of the step, (b) = a ledger entry, (c) = the rest.
//
//   node fidelity/gate/ledger-candidates.mjs --report <gate-report.json> --layout-from <run-all dir>
//     [--head-wpt <results.json>] [--pin-wpt <results.json>] [--chain fidelity/baselines/port]
//     [--out <dir>]
//
// Candidates (per item):
//   a        recorded artefact evidence: a chain acceptance of an artefact label (wpt-false-pass*,
//            wpt-subpixel-raster-artefact) on this key, or WPT page counts of vellora's old
//            test render differing from Chrome's (the false-pass definition of GATE-A1)
//   b        a layer vector (gate/layer-vector.mjs) on which the relaxed (b) rule can hold:
//            |run| <= |N0|; its non-zero vellora steps are the compensators to name
//   b-page   a word displaced to another page in a fixture whose page count differs from
//            Chrome's: rule vi, one page-scoped entry per page-count criterion
//   declare  a new strict-gate rejection: needs a declaredRejections entry, not a/b
//   c        evidence that the OLD value was right or that vellora made it worse than raw Blitz
//            (lost text; |run| > |N0|): blocks (GATE-A1)
//   none     no evidence either way yet (no layer vector for the item, an unlabelled WPT loss
//            whose old render matched Chrome's page count)
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { probeResultV2 } from "../layout-diff/lib/pdf-probe-v2.mjs";
import { requirePython } from "../layout-diff/lib/pdf-words.mjs";
import { parseProbeKey, readDiff, wordVectors } from "./layer-vector.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const A_LABELS = new Set([
  "wpt-false-pass",
  "wpt-false-pass-rect-merge",
  "wpt-subpixel-raster-artefact",
]);
const TEXT_LOSS = /\|(INV-X1|INV-X2|BOL-X1|BOL-X2|DANFE-X1|DANFE-X2|TXT-X1|TXT-X2|EXT-2)\|/;

/** acceptedRegressions of every link manifest under `chainDir`: key -> [{ link, label, reason, evidence }]. */
export function chainLabels(chainDir) {
  const out = new Map();
  for (const link of readdirSync(chainDir).sort()) {
    const m = join(chainDir, link, "manifest.json");
    if (!existsSync(m)) continue;
    for (const e of JSON.parse(readFileSync(m, "utf8")).acceptedRegressions ?? []) {
      if (!e.key) continue;
      if (!out.has(e.key)) out.set(e.key, []);
      out.get(e.key).push({ link, label: e.label, reason: e.reason, evidence: e.evidence });
    }
  }
  return out;
}

/** WPT page counts of vellora's test render vs Chrome's in a results.json: test -> { vellora, chrome }. */
export function wptPageCounts(results) {
  const out = new Map();
  for (const t of results?.tests ?? []) {
    const v = t.comparisons?.[0]?.pageCounts;
    const c = t.chrome?.comparisons?.[0]?.pageCounts;
    if (v && c) out.set(t.test, { vellora: v[0], chrome: c[0] });
  }
  return out;
}

/** Is an unpaired Chrome word's text drawn by vellora on ANOTHER page (displaced, not lost)? */
function displaced(section, text, page) {
  return (section?.unpairedVellora ?? []).some((w) => w.text === text && w.page !== page);
}

/**
 * Classify one uncovered item. ctx: { labels, pageCounts (old side), sections (run pdf-probe),
 * vectors: fixture -> Map, noText: Set(fixture) }.
 */
export function classify(item, ctx) {
  const cls = item.headClass ?? item.class;
  if (cls === "rejection") {
    return {
      candidate: "declare",
      why: `new strict-gate rejection${item.feature ? ` (${item.feature})` : ""}: needs a declaredRejections entry`,
    };
  }
  const hist = ctx.labels.get(item.key) ?? [];
  const art = hist.find((h) => A_LABELS.has(h.label));
  if (item.check === "wpt") {
    if (art)
      return {
        candidate: "a",
        why: `${art.link} accepted it as ${art.label}`,
        evidence: art.evidence,
      };
    const pc = ctx.pageCounts.get(item.test ?? item.key.replace(/^wpt\|/, ""));
    if (pc && pc.vellora !== pc.chrome) {
      return {
        candidate: "a",
        why: `old test render ${pc.vellora} page(s) vs Chrome ${pc.chrome}: a false pass by page count`,
      };
    }
    return {
      candidate: "none",
      why: hist.length
        ? `${hist.map((h) => `${h.link} ${h.label}`).join("; ")}: not an artefact label, and WPT tests have no layer vector`
        : "no artefact evidence (old render's page count equals Chrome's) and no layer vector for WPT tests",
    };
  }
  if (item.check === "pdf-probe") {
    const k = parseProbeKey(item.key);
    const fx = item.key.split("|")[1];
    const section = ctx.sections[fx];
    const pageDelta = section ? section.pages.vellora - section.pages.chrome : 0;
    if (/\|unpaired-(chrome|vellora)$/.test(item.key)) {
      // A count that grew because text was LOST is not displacement, whatever the page count.
      const lost = (ctx.lostText.get(fx) ?? 0) > 0;
      if (pageDelta && !lost) {
        return {
          candidate: "b-page",
          why: `unpaired-word count of a fixture printing ${section.pages.vellora} pages vs Chrome ${section.pages.chrome} (rule vi)`,
        };
      }
      return {
        candidate: "c",
        why: lost
          ? `unpaired-word count grew with ${ctx.lostText.get(fx)} lost Chrome word(s) of this fixture (text lost, not displaced)`
          : "unpaired-word count grew on a fixture with Chrome's page count: text lost or added",
      };
    }
    if (k?.axis === "pairing") {
      const page = Number(/^p(\d+)\|/.exec(k.k)[1]);
      const text =
        item.detail?.match(/Chrome's "([^"]+)"/)?.[1] ?? k.k.split("|")[1].replace(/#\d+$/, "");
      if (pageDelta && displaced(section, text, page)) {
        return {
          candidate: "b-page",
          why: `"${text}" is drawn on another page (vellora ${section.pages.vellora} pages vs Chrome ${section.pages.chrome}; rule vi)`,
        };
      }
      return {
        candidate: "c",
        why: `Chrome's "${text}" has no vellora partner and is not drawn on another page: text lost (the OLD value was right)`,
      };
    }
    if (ctx.noText.has(fx)) {
      return {
        candidate: "none",
        why: "no layer vector: layout-diff aligned no text run of this fixture",
      };
    }
    const rec = ctx.vectors.get(fx)?.get(k.k);
    if (!rec?.mapped)
      return {
        candidate: "none",
        why: "the Chrome word maps to no layout-diff run (no layer vector)",
      };
    if (pageDelta && rec.page >= 2) {
      return {
        candidate: "b-page",
        why: `page ${rec.page} of a fixture printing ${section.pages.vellora} pages vs Chrome ${section.pages.chrome} (rule vi)`,
      };
    }
    const f = rec[k.axis].relaxedB;
    const v = rec[k.axis].vector;
    if (f.possible) {
      return {
        candidate: "b",
        why: `|run| ${f.absRun} <= |N0| ${f.absN0} px (+${f.runTolerance}); compensators to name: ${f.nonZeroVelloraSteps.map((s) => `${s.layer} ${s.step}`).join(", ") || "none"}; residual owner ${Math.abs(v.N0) > f.stepTolerance ? "raw Blitz (N0)" : "to be named"}`,
        vector: v,
      };
    }
    return {
      candidate: "c",
      why: `${f.why}: vellora's layers made the word worse than raw Blitz`,
      vector: v,
    };
  }
  if (TEXT_LOSS.test(item.key) && hist.some((h) => h.label === "html-normalize-compensation")) {
    return {
      candidate: "c",
      why: `${hist[0].link} ${hist[0].label}: text lost (XHTML doctype parsed as XML drops the text after each <br>); the OLD value was right`,
    };
  }
  return {
    candidate: "none",
    why: hist.length
      ? `${hist.map((h) => `${h.link} ${h.label}`).join("; ")}: needs a per-item layer vector of the anchor behind this aggregate metric`
      : "no historical label and no per-item layer vector",
  };
}

function summarize(items) {
  const byCandidate = {};
  const byCheck = {};
  const byFixture = {};
  for (const i of items) {
    byCandidate[i.candidate] = (byCandidate[i.candidate] ?? 0) + 1;
    const k = `${i.check} ${i.candidate}`;
    byCheck[k] = (byCheck[k] ?? 0) + 1;
    const fx = `${i.fixture} ${i.candidate}`;
    byFixture[fx] = (byFixture[fx] ?? 0) + 1;
  }
  return { total: items.length, byCandidate, byCheck, byFixture };
}

const esc = (v) =>
  String(v ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");

/** Markdown: counts, then every item with no possible (a)/(b) classification yet (c and none). */
export function renderCandidates(out) {
  const lines = [
    "# Ledger candidates (fidelity/gate/ledger-candidates.mjs)",
    "",
    `Command: \`${esc(out.command)}\`; date ${out.date}. Candidates, not verdicts: the gate's formal classes are (a) a class-a acceptance of the step, (b) a DEBT.json entry, (c) the rest. Local macOS data: INDICATIVE.`,
    "",
  ];
  for (const [name, s] of Object.entries(out.sections)) {
    lines.push(`## ${name} view vs ${esc(s.baseline)}: ${s.total} uncovered items`, "");
    lines.push(
      "| candidate | items |",
      "|---|---|",
      ...Object.entries(s.byCandidate).map(([k, v]) => `| ${k} | ${v} |`),
      "",
    );
    lines.push(
      "| check x candidate | items |",
      "|---|---|",
      ...Object.entries(s.byCheck).map(([k, v]) => `| ${k} | ${v} |`),
      "",
    );
    lines.push(
      "| fixture x candidate | items |",
      "|---|---|",
      ...Object.entries(s.byFixture)
        .sort()
        .map(([k, v]) => `| ${k} | ${v} |`),
      "",
    );
    const open = s.items.filter((i) => i.candidate === "c" || i.candidate === "none");
    lines.push(
      `### No possible (a)/(b) classification yet (${open.length}: c ${s.byCandidate.c ?? 0}, none ${s.byCandidate.none ?? 0})`,
      "",
    );
    // Collapse words with one reason per fixture so the list stays readable.
    const groups = new Map();
    for (const i of open) {
      const g = `${i.candidate}|${i.fixture}|${i.check === "pdf-probe" && i.candidate === "none" ? i.why : i.key}`;
      if (!groups.has(g)) groups.set(g, { ...i, n: 0 });
      groups.get(g).n++;
    }
    lines.push(
      "| candidate | item (or group) | n | before -> after | why |",
      "|---|---|---|---|---|",
    );
    for (const g of groups.values()) {
      lines.push(
        `| ${g.candidate} | \`${esc(g.n > 1 ? `${g.fixture}: ${g.n} words` : g.key)}\` | ${g.n} | ${g.n > 1 ? "" : `${esc(g.before)} -> ${esc(g.after)}`} | ${esc(g.why)} |`,
      );
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  if (!val("--report") || !val("--layout-from")) {
    process.stderr.write(
      "usage: node fidelity/gate/ledger-candidates.mjs --report <gate-report.json> --layout-from <run-all dir> [--head-wpt <results.json>] [--pin-wpt <results.json>] [--chain <dir>] [--out <dir>]\n",
    );
    process.exitCode = 2;
    return;
  }
  const report = JSON.parse(readFileSync(resolve(val("--report")), "utf8"));
  const runDir = resolve(val("--layout-from"));
  const labels = chainLabels(resolve(val("--chain") ?? join(here, "..", "baselines", "port")));
  const readResults = (f) =>
    f && existsSync(f) ? JSON.parse(readFileSync(resolve(f), "utf8")) : null;
  const { loadSnapshot } = await import("./snapshot.mjs");
  const run = loadSnapshot(resolve(join(here, "..", ".."), report.run.dir));
  const sections = run.pdfProbe ?? {};
  // Word vectors for every fixture any uncovered pdf-probe word item names.
  const python = requirePython();
  const { pdfWordsV2 } = await import("../layout-diff/lib/pdf-words.mjs");
  const uncovered = {
    head: (report.head?.items ?? []).filter((i) => i.gating),
    pin: (report.pin?.items ?? []).filter((i) => i.pinClass === "c"),
  };
  const fixtures = new Set(
    [...uncovered.head, ...uncovered.pin]
      .filter((i) => i.check === "pdf-probe")
      .map((i) => i.key.split("|")[1]),
  );
  const vectors = new Map();
  const noText = new Set();
  const mapping = {};
  for (const fx of fixtures) {
    const diff = readDiff(runDir, fx);
    if (!(diff.text_events ?? []).length) {
      noText.add(fx);
      continue;
    }
    const dir = join(runDir, "layout-diff", fx, "run-all");
    const v = pdfWordsV2(join(dir, "vellora.pdf"), python);
    const c = pdfWordsV2(join(dir, "chrome.pdf"), python);
    const probe = probeResultV2({ velloraWords: v.words, chromeWords: c.words });
    const w = wordVectors({ diff, probe, chromeWords: c.words, fixture: fx });
    vectors.set(fx, w.vectors);
    mapping[fx] = w.mapping;
  }
  const out = {
    tool: "fidelity/gate/ledger-candidates.mjs",
    command: `node fidelity/gate/ledger-candidates.mjs ${argv.join(" ")}`
      .split(homedir())
      .join("~"),
    date: new Date().toISOString(),
    report: val("--report").split(homedir()).join("~"),
    layoutFrom: runDir.split(homedir()).join("~"),
    mapping,
    sections: {},
  };
  for (const [name, items, wpt] of [
    ["head", uncovered.head, val("--head-wpt")],
    ["pin", uncovered.pin, val("--pin-wpt")],
  ]) {
    if (!items.length) continue;
    const ctx = {
      labels,
      pageCounts: wptPageCounts(readResults(wpt)),
      sections,
      vectors,
      noText,
      lostText: new Map(),
    };
    // Pairing losses first: a fixture's unpaired counts are classed after its lost words.
    const order = (i) => (/\|unpaired-(chrome|vellora)$/.test(i.key) ? 1 : 0);
    const classified = [...items]
      .sort((x, y) => order(x) - order(y))
      .map((i) => {
        const c = classify(i, ctx);
        if (c.candidate === "c" && i.key.endsWith("|pairing")) {
          const fx = i.key.split("|")[1];
          ctx.lostText.set(fx, (ctx.lostText.get(fx) ?? 0) + 1);
        }
        return {
          key: i.key,
          check: i.check,
          fixture: i.key.split("|")[i.key.startsWith("pdf-probe|") ? 1 : 0],
          before: i.before,
          after: i.after,
          ...c,
        };
      });
    out.sections[name] = {
      baseline: name === "head" ? report.head.baseline : report.pin.baseline,
      wptResults: wpt ? wpt.split(homedir()).join("~") : null,
      ...summarize(classified),
      items: classified,
    };
  }
  const text = `${JSON.stringify(out, null, 2)}\n`;
  if (val("--out")) {
    mkdirSync(resolve(val("--out")), { recursive: true });
    writeFileSync(join(resolve(val("--out")), "ledger-candidates.json"), text);
    writeFileSync(join(resolve(val("--out")), "ledger-candidates.md"), renderCandidates(out));
  }
  for (const [name, s] of Object.entries(out.sections)) {
    process.stdout.write(
      `${name} (${s.baseline}): ${s.total} uncovered; ${JSON.stringify(s.byCandidate)}\n  ${JSON.stringify(s.byCheck)}\n`,
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`ledger-candidates failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
