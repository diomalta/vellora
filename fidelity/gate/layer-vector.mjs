#!/usr/bin/env node
// Per-item LAYER VECTORS from a run's layout-diff dumps: the evidence a DEBT.json entry carries
// (fidelity/gate/debt.mjs, ACCEPTANCE.md GATE-A1 (b) / GATE-D*), computed by a committed tool
// instead of /tmp scripts.
//
// A layer vector is the item's delta vs Chrome in each layer of vellora's pipeline, in CSS px
// (layout-diff's unit): N0 raw Blitz on the source HTML, B0 html_normalize (deleted at step 05:
// B0 = N0), L0 the walk / text reader, one entry per layout_normalize pass in run order, P
// pagination's in-page drift; then `run`, what the PDF-level oracle measured:
//   word   (pdf-probe v2 key)  dy / dx of the vellora PDF word vs Chrome's PDF word (pt -> px).
//          The word is mapped to its layout-diff text run through CHROME's own layout: Chrome's
//          PDF words (page, baseline, x order) are aligned with the tokens of layout-diff's Chrome
//          text fragments (visual order) by a longest common subsequence on the text key. The
//          layers are the run's (dy: the run's baseline, exact for every word of the run; dx:
//          the run's start, exact for its first word only, recorded as `dxExact`).
//   anchor (text)  the first layout-diff run whose Chrome text starts with the anchor text
//          (e.g. LET-1's signature lines); `run` = the pdf-probe pair of its first word.
//   box    (path)  diff.boxes[path].layers; `run` = P (no PDF-level box oracle).
// "final" in fidelity/ACCEPTANCE.md GATE-A1 (b) is `run`: |run| <= |N0| is the relaxed rule. The
// last layout_normalize layer, `final_layer` in layout-diff's own reports, is called `finalPass`
// here so the two are never confused (layout-diff's "P vs final" = P vs finalPass).
//
//   node fidelity/gate/layer-vector.mjs --run <run-all dir> [--fixtures a,b]
//     [--key <pdf-probe item key>]... [--keys-from <gate-report.json>] [--anchor <fixture>:<text>]...
//     [--box <fixture>:<path>]... [--summary] [--out <file.json>]
//     [--pack <fixture>=<out.json.gz>]   write the offline self-test input of one fixture
//   --keys-from  every pdf-probe word item (dx/dy) of the report head section (head-gating items),
//              else of its gating items
//   --summary  per fixture, run level: runs whose P differs from finalPass (y), whose finalPass
//              equals B0 or B0 - 2 px (painted pass), whose N0 = B0 = L0; no word mapping, no Python
//   Words need fidelity/.venv (PyMuPDF, fidelity/oracles/py/words.py) to re-extract both PDFs of
//   the run (layout-diff/<fixture>/run-all/{vellora,chrome}.pdf): the committed baselines keep
//   only the compact pdf-probe section, without Chrome word positions.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { arch, homedir, platform, release } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { probeResultV2, textKey } from "../layout-diff/lib/pdf-probe-v2.mjs";
import { layerStepTolerance, vectorRunTolerance } from "./tolerances.mjs";

export const PX_PER_PT = 4 / 3;
const EPS = 0.01;
const r3 = (v) => Math.round(v * 1000) / 1000;

/** Pipeline layers of a diff.json in order (unrounded diagnostics N0u/B0u excluded). */
export function layerOrder(diff) {
  return (diff.layers ?? []).map((l) => l.name).filter((n) => !/u$/.test(n));
}

/** The last layout_normalize pass (layout-diff's final_layer), or the last pre-pagination layer. */
export const finalPassOf = (diff) =>
  diff.final_layer ??
  layerOrder(diff)
    .filter((n) => n !== "P")
    .at(-1);

/** { layer: delta } for one axis of a per-layer record (layers without a number are left out). */
export function vectorOf(perLayer, order, axis) {
  const out = {};
  for (const name of order) {
    const v = perLayer?.[name]?.[axis];
    if (typeof v === "number") out[name] = r3(v);
  }
  return out;
}

/** Steps between consecutive layers of a vector ([{ layer, step }]; N0 has none: raw Blitz). */
export function stepsOf(vector) {
  const out = [];
  let prev = null;
  for (const [layer, v] of Object.entries(vector)) {
    if (layer === "unit" || typeof v !== "number") continue;
    if (prev !== null) out.push({ layer, step: r3(v - prev) });
    prev = v;
  }
  return out;
}

/**
 * The relaxed (b) facts of a vector: |run| <= |N0|, the non-zero vellora steps (the candidate
 * compensators an entry must name). `possible` = the relaxed rule CAN hold (compensators and the
 * residual owner still have to be named in the entry).
 */
export function relaxedBFacts(vector, tolClass = "pdf-probe-pt") {
  if (typeof vector.N0 !== "number" || typeof vector.run !== "number") {
    return { possible: false, why: "no N0 or no run value" };
  }
  const tol = layerStepTolerance(vector.unit);
  const runTol = vectorRunTolerance(tolClass, vector.unit);
  const steps = stepsOf(vector).filter(
    (s) => Math.abs(s.step) > (s.layer === "run" ? runTol : tol),
  );
  const ok = Math.abs(vector.run) <= Math.abs(vector.N0) + runTol;
  return {
    possible: ok,
    absRun: r3(Math.abs(vector.run)),
    absN0: r3(Math.abs(vector.N0)),
    stepTolerance: tol,
    runTolerance: r3(runTol),
    nonZeroVelloraSteps: steps,
    why: ok ? null : `|run| ${r3(Math.abs(vector.run))} > |N0| ${r3(Math.abs(vector.N0))}`,
  };
}

/**
 * Run-level summary of one diff.json (the step-04 "no other vellora layer moves text y" claim):
 * text runs with a number in both P and the final pass, how many of them P moves, and which
 * vellora layers move y at all.
 */
export function runLevelSummary(diff) {
  const order = layerOrder(diff);
  const fin = finalPassOf(diff);
  const out = {
    fixture: diff.fixture,
    finalPass: fin,
    layers: order,
    runs: 0,
    runsWithP: 0,
    pDiffersFromFinalPassY: 0,
    pMovesBeyondTolY: 0,
    finalPassEqualsB0Y: 0,
    finalPassEqualsB0Minus2Y: 0,
    finalPassOtherY: 0,
    n0EqualsB0EqualsL0Y: 0,
    yMovedBy: {},
  };
  for (const e of diff.text_events ?? []) {
    const v = vectorOf(e.per_layer, order, "dy");
    if (typeof v[fin] !== "number" || typeof v.B0 !== "number") continue;
    out.runs++;
    if (Math.abs(v[fin] - v.B0) <= EPS) out.finalPassEqualsB0Y++;
    else if (Math.abs(v[fin] - (v.B0 - 2)) <= EPS) out.finalPassEqualsB0Minus2Y++;
    else out.finalPassOtherY++;
    if (
      typeof v.N0 === "number" &&
      typeof v.L0 === "number" &&
      Math.abs(v.N0 - v.B0) <= EPS &&
      Math.abs(v.B0 - v.L0) <= EPS
    ) {
      out.n0EqualsB0EqualsL0Y++;
    }
    if (typeof v.P === "number") {
      out.runsWithP++;
      if (Math.abs(v.P - v[fin]) > EPS) out.pDiffersFromFinalPassY++;
      if (Math.abs(v.P - v[fin]) > layerStepTolerance("px")) out.pMovesBeyondTolY++;
    }
    for (const s of stepsOf(v)) {
      if (Math.abs(s.step) > EPS) out.yMovedBy[s.layer] = (out.yMovedBy[s.layer] ?? 0) + 1;
    }
  }
  return out;
}

/** Layout-diff Chrome text fragments as tokens in visual order: [{ event, key }]. */
export function chromeTokens(diff) {
  const events = (diff.text_events ?? [])
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e.chrome && (e.chrome_text ?? e.text));
  // Visual order of Chrome's continuous layout: by line (fragment bottom, 2 px buckets), then x.
  events.sort(
    (a, b) =>
      Math.round((a.e.chrome.y + a.e.chrome.h) / 2) -
        Math.round((b.e.chrome.y + b.e.chrome.h) / 2) || a.e.chrome.x - b.e.chrome.x,
  );
  const out = [];
  for (const { e, i } of events) {
    const words = String(e.chrome_text ?? e.text)
      .split(/\s+/)
      .map(textKey)
      .filter(Boolean);
    words.forEach((key, n) => out.push({ event: i, key, first: n === 0 }));
  }
  return out;
}

/**
 * Longest common subsequence of two key arrays: Map(aIndex -> bIndex). O(n m) time and memory
 * (n, m <= ~2000 words per fixture in the corpus).
 */
export function lcsAlign(a, b) {
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const dp = new Uint16Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] =
        a[i] === b[j]
          ? dp[(i + 1) * w + j + 1] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }
  const map = new Map();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      map.set(i, j);
      i++;
      j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) i++;
    else j++;
  }
  return map;
}

/**
 * Word layer vectors of one fixture. `probe`: a FULL pdf-probe v2 result (probeResultV2, with
 * Chrome word positions); `chromeWords`: every Chrome PDF word (pairs and unpaired). Returns
 * { vectors: Map(pairKey -> record), mapping: { chromeWords, mapped, unmapped } }.
 */
export function wordVectors({ diff, probe, chromeWords, fixture }) {
  const order = layerOrder(diff);
  const fin = finalPassOf(diff);
  const words = [...chromeWords].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  const tokens = chromeTokens(diff);
  const map = lcsAlign(
    words.map((w) => w.key ?? textKey(w.text)),
    tokens.map((t) => t.key),
  );
  const at = (w) => `${w.page}|${w.x}|${w.y}|${w.text}`;
  const wordIndex = new Map(words.map((w, i) => [at(w), i]));
  const vectors = new Map();
  for (const p of probe.pairs) {
    const wi = wordIndex.get(at({ ...p.chrome, text: p.text }));
    const ti = wi === undefined ? undefined : map.get(wi);
    const base = { fixture, key: p.k, text: p.text, page: p.chrome.page };
    if (ti === undefined) {
      vectors.set(p.k, { ...base, mapped: false });
      continue;
    }
    const t = tokens[ti];
    const e = diff.text_events[t.event];
    const rec = {
      ...base,
      mapped: true,
      owner: e.owner,
      runText: e.chrome_text ?? e.text,
      dxExact: t.first,
    };
    for (const axis of ["dx", "dy"]) {
      const v = { unit: "px", ...vectorOf(e.per_layer, order, axis) };
      v.run = r3((axis === "dx" ? p.dx_pt : p.dy_pt) * PX_PER_PT);
      rec[axis] = { vector: v, finalPass: fin, steps: stepsOf(v), relaxedB: relaxedBFacts(v) };
    }
    vectors.set(p.k, rec);
  }
  return {
    vectors,
    mapping: {
      method:
        "LCS of Chrome PDF words (page, baseline, x) vs layout-diff Chrome fragment tokens (visual order), text key = pdf-probe v2 textKey",
      chromeWords: words.length,
      mapped: map.size,
      unmapped: words.length - map.size,
      pairs: probe.pairs.length,
      pairsMapped: [...vectors.values()].filter((x) => x.mapped).length,
      xCheck: mappingXCheck(words, tokens, map, diff),
      pAgreement: pAgreement(vectors),
    },
  };
}

/**
 * Independent check of the mapping on page 1, where Chrome's PDF and its continuous layout differ by
 * the page margins only: for every mapped word that is the FIRST token of its fragment, (a) PDF x
 * (pt -> px) - fragment x is one constant (the left page margin) and (b) PDF baseline (pt -> px) -
 * fragment bottom is one constant per font size (top margin - descent) when the word was mapped
 * to the right fragment; a wrong fragment is a line pitch or a column away. Returns the medians
 * and the share of words within 3 px of both (Chrome right-aligned fragments sit 2 px from
 * left-aligned ones in (a), CONFIRMED on oss-sparksuite-invoice at step 07: 57 vs 59 px).
 */
export function mappingXCheck(words, tokens, map, diff) {
  const rows = [];
  for (const [wi, ti] of map) {
    const w = words[wi];
    const t = tokens[ti];
    if (w.page !== 1 || !t.first) continue;
    const c = diff.text_events[t.event].chrome;
    rows.push({
      dx: w.x * PX_PER_PT - c.x,
      dy: w.y * PX_PER_PT - (c.y + c.h),
      size: Math.round((w.size ?? 0) * 10),
    });
  }
  if (!rows.length) return { firstTokensOnPage1: 0, medianOffsetPx: null, within3px: null };
  const med = (xs) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.floor((s.length - 1) / 2)];
  };
  const mx = med(rows.map((r) => r.dx));
  const my = new Map();
  for (const size of new Set(rows.map((r) => r.size))) {
    my.set(size, med(rows.filter((r) => r.size === size).map((r) => r.dy)));
  }
  const within = rows.filter(
    (r) => Math.abs(r.dx - mx) <= 3 && Math.abs(r.dy - my.get(r.size)) <= 3,
  );
  return {
    firstTokensOnPage1: rows.length,
    medianOffsetPx: r3(mx),
    medianBaselineOffsetPxBySize: Object.fromEntries([...my].map(([k, v]) => [k / 10, r3(v)])),
    within3px: r3(within.length / rows.length),
  };
}

/**
 * Second, independent check: on page 1 the PDF-level dy of a mapped word (run) and layout-diff's
 * P-layer dy of its run measure the same error in two references (Chrome PDF vs Chrome DOM), so
 * they agree within the run tolerance (1 pt) when the mapping is right. Share of page-1 mapped
 * words that agree.
 */
export function pAgreement(vectors) {
  const recs = [...vectors.values()].filter(
    (r) => r.mapped && r.page === 1 && typeof r.dy?.vector?.P === "number",
  );
  if (!recs.length) return { wordsOnPage1: 0, agreeWithinRunTolerance: null };
  const tol = vectorRunTolerance("pdf-probe-pt", "px");
  const ok = recs.filter((r) => Math.abs(r.dy.vector.run - r.dy.vector.P) <= tol).length;
  return { wordsOnPage1: recs.length, agreeWithinRunTolerance: r3(ok / recs.length) };
}

/** Committed input packs (gate/data/*.layer-vector-pack.json.gz), used by the canaries and tests. */
export const PACK_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");
export function loadPack(file) {
  return JSON.parse(gunzipSync(readFileSync(file)).toString("utf8"));
}

/** wordVectors over a pack: the probe is recomputed from the pack's words (same v2 code path). */
export function packWordVectors(pack) {
  const probe = probeResultV2({ velloraWords: pack.velloraWords, chromeWords: pack.chromeWords });
  return {
    probe,
    ...wordVectors({
      diff: pack.diff,
      probe,
      chromeWords: pack.chromeWords,
      fixture: pack.source.fixture,
    }),
  };
}

/** The input pack of one fixture (diff subset + both PDFs' words) for an offline self-test. */
export function layerVectorPack({ diff, chromeWords, velloraWords, source }) {
  return {
    schema: "vellora-fidelity/layer-vector-pack/1",
    source,
    diff: {
      fixture: diff.fixture,
      layers: diff.layers,
      final_layer: diff.final_layer,
      post_pagination_layer: diff.post_pagination_layer,
      text_events: diff.text_events,
      boxes: diff.boxes,
    },
    chromeWords,
    velloraWords,
  };
}

/** Anchor vector: the first text run whose Chrome text starts with `text` (whitespace-folded). */
export function anchorVector(diff, text, axis = "dy") {
  const want = String(text).replace(/\s+/g, " ").trim();
  const e = (diff.text_events ?? []).find((x) =>
    String(x.chrome_text ?? x.text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .startsWith(want),
  );
  if (!e) return null;
  const v = { unit: "px", ...vectorOf(e.per_layer, layerOrder(diff), axis) };
  return { owner: e.owner, runText: e.chrome_text ?? e.text, axis, vector: v, steps: stepsOf(v) };
}

/** Box vector: diff.boxes[path] layer deltas; `run` = P (or the final pass when P is n/a). */
export function boxVector(diff, path, axis = "dy") {
  const b = (diff.boxes ?? []).find((x) => x.path === path);
  if (!b) return null;
  const v = { unit: "px", ...vectorOf(b.layers, layerOrder(diff), axis) };
  v.run = v.P ?? v[finalPassOf(diff)];
  return { path, axis, vector: v, steps: stepsOf(v), relaxedB: relaxedBFacts(v, null) };
}

/** The DEBT.json `layerVector` of a word record's axis. */
export const ledgerVector = (rec, axis) => rec?.[axis]?.vector ?? null;

/** Parse a pdf-probe item key: pdf-probe|<fixture>|<chrome key p..|text#n>|<axis>. */
export function parseProbeKey(key) {
  const m = /^pdf-probe\|([^|]+)\|(p\d+\|.+#\d+)\|(dx|dy|pairing)$/.exec(key);
  return m ? { fixture: m[1], k: m[2], axis: m[3] } : null;
}

/** Full v2 probe of one fixture of a run dir: re-extract both PDFs with words.py. */
async function probeOf(runDir, fixture, python) {
  const { pdfWordsV2 } = await import("../layout-diff/lib/pdf-words.mjs");
  const dir = join(runDir, "layout-diff", fixture, "run-all");
  const v = pdfWordsV2(join(dir, "vellora.pdf"), python);
  const c = pdfWordsV2(join(dir, "chrome.pdf"), python);
  return {
    probe: probeResultV2({ velloraWords: v.words, chromeWords: c.words }),
    chromeWords: c.words,
    tool: v.tool,
  };
}

export const readDiff = (runDir, fixture) =>
  JSON.parse(readFileSync(join(runDir, "layout-diff", fixture, "run-all", "diff.json"), "utf8"));

async function main() {
  const argv = process.argv.slice(2);
  const val = (n) => (argv.indexOf(n) >= 0 ? argv[argv.indexOf(n) + 1] : undefined);
  const all = (n) => argv.flatMap((a, i) => (a === n && argv[i + 1] ? [argv[i + 1]] : []));
  const runDir = val("--run") && resolve(val("--run"));
  if (!runDir || !existsSync(join(runDir, "layout-diff"))) {
    process.stderr.write(
      "usage: node fidelity/gate/layer-vector.mjs --run <run-all dir> [--fixtures a,b] [--key k]... [--keys-from gate-report.json] [--anchor fx:text]... [--box fx:path]... [--summary] [--out file]\n",
    );
    process.exitCode = 2;
    return;
  }
  const out = {
    tool: "fidelity/gate/layer-vector.mjs",
    // Committed outputs never carry the local home path.
    command: `node fidelity/gate/layer-vector.mjs ${argv.join(" ")}`.split(homedir()).join("~"),
    date: new Date().toISOString(),
    environment: { os: `${platform()} ${release()} ${arch()}`, node: process.version },
    run: runDir.split(homedir()).join("~"),
    unit: "CSS px (pdf-probe pt x 4/3)",
  };
  const fixtures = (val("--fixtures") ?? "").split(",").filter(Boolean);
  const keys = all("--key");
  if (val("--keys-from")) {
    const rep = JSON.parse(readFileSync(resolve(val("--keys-from")), "utf8"));
    const items = rep.head ? rep.head.items : rep.items.filter((i) => i.gating);
    for (const i of items)
      if (parseProbeKey(i.key) && !i.key.endsWith("|pairing")) keys.push(i.key);
    out.keysFrom = {
      report: val("--keys-from"),
      section: rep.head ? "head" : "gating",
      keys: keys.length,
    };
  }
  if (argv.includes("--summary")) {
    const { readdirSync } = await import("node:fs");
    const fxs = fixtures.length
      ? fixtures
      : readdirSync(join(runDir, "layout-diff")).filter((f) =>
          existsSync(join(runDir, "layout-diff", f, "run-all", "diff.json")),
        );
    out.summary = fxs.sort().map((f) => runLevelSummary(readDiff(runDir, f)));
  }
  if (keys.length) {
    const { requirePython } = await import("../layout-diff/lib/pdf-words.mjs");
    const python = requirePython();
    const byFixture = new Map();
    for (const key of keys) {
      const k = parseProbeKey(key);
      if (!k) throw new Error(`not a pdf-probe word key: ${key}`);
      if (!byFixture.has(k.fixture)) byFixture.set(k.fixture, []);
      byFixture.get(k.fixture).push({ key, ...k });
    }
    out.words = [];
    out.mapping = {};
    for (const [fixture, list] of byFixture) {
      const { probe, chromeWords, tool } = await probeOf(runDir, fixture, python);
      out.extractor = tool;
      const w = wordVectors({ diff: readDiff(runDir, fixture), probe, chromeWords, fixture });
      out.mapping[fixture] = w.mapping;
      for (const k of list) {
        const rec = w.vectors.get(k.k) ?? { fixture, key: k.k, mapped: false, unpaired: true };
        out.words.push({ item: k.key, axis: k.axis, ...rec });
      }
    }
  }
  if (val("--pack")) {
    // --pack <fixture>=<out.json.gz>: the offline self-test input of one fixture.
    const { createHash } = await import("node:crypto");
    const { gzipSync } = await import("node:zlib");
    const { pdfWordsV2, requirePython } = await import("../layout-diff/lib/pdf-words.mjs");
    const [fixture, file] = val("--pack").split("=");
    const dir = join(runDir, "layout-diff", fixture, "run-all");
    const sha = (f) =>
      createHash("sha256")
        .update(readFileSync(join(dir, f)))
        .digest("hex");
    const python = requirePython();
    const c = pdfWordsV2(join(dir, "chrome.pdf"), python);
    const v = pdfWordsV2(join(dir, "vellora.pdf"), python);
    const pack = layerVectorPack({
      diff: readDiff(runDir, fixture),
      chromeWords: c.words,
      velloraWords: v.words,
      source: {
        run: out.run,
        fixture,
        sha256: {
          "diff.json": sha("diff.json"),
          "chrome.pdf": sha("chrome.pdf"),
          "vellora.pdf": sha("vellora.pdf"),
        },
        extractor: c.tool,
        command: out.command,
        date: out.date,
        environment: out.environment,
      },
    });
    writeFileSync(resolve(file), gzipSync(JSON.stringify(pack), { level: 9 }));
    process.stdout.write(`layer-vector: pack ${file} (${fixture})\n`);
    return;
  }
  out.anchors = all("--anchor").map((a) => {
    const [fixture, ...rest] = a.split(":");
    return {
      fixture,
      text: rest.join(":"),
      ...anchorVector(readDiff(runDir, fixture), rest.join(":")),
    };
  });
  out.boxes = all("--box").map((a) => {
    const [fixture, ...rest] = a.split(":");
    return { fixture, ...boxVector(readDiff(runDir, fixture), rest.join(":")) };
  });
  const text = `${JSON.stringify(out, null, 2)}\n`;
  if (val("--out")) writeFileSync(resolve(val("--out")), text);
  else process.stdout.write(text);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(`layer-vector failed: ${e?.stack ?? e}\n`);
    process.exitCode = 1;
  });
}
