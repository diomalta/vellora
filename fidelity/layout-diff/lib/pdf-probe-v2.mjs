// pdf-probe v2 (semantics 2): vellora's PDF words vs Chrome's PDF words, scored on the BASELINE and
// paired by POSITION. Pure: no I/O, so every rule is unit-tested (test/pdf-probe-v2.test.mjs).
//
// Why v2 (fidelity/baselines/port/README.md, "pdf-probe v2"):
//   D1  v1 scored a word's y by poppler `pdftotext -bbox` yMin = baseline - /Ascent x size, and
//       each producer declares its own /Ascent for the same font file (krilla: OS/2
//       sTypoAscender, e.g. Liberation Sans 728; Chrome: hhea 905), so every v1 dy carried
//       +(A_chrome - A_krilla) x size (+2.12 pt at 12 pt) with no glyph moving. v2 reads PyMuPDF
//       character ORIGINS (fidelity/oracles/py/words.py, the REF-W word source): x = pen origin of
//       the word's first glyph, y = its baseline. Both come from the text matrix, not the font
//       descriptor (probe: ascent-probe.mjs, snapshots/2026-10-21/pdf-probe-v2/ascent-probe.json;
//       canary: lib/pdf-probe-canaries.mjs).
//   D2  v1 paired the k-th occurrence of a text in vellora's extraction order with the k-th in
//       Chrome's; when page counts or line orders differ, words paired with another instance. v2
//       pairs, per page and per text, by a maximum-cardinality minimum-total-distance assignment
//       with a distance bound; a word with no partner within the bound is UNPAIRED.
//   D3  v1 did not gate a word that disappeared. v2 records unpaired words on both sides; the gate
//       ratchets the counts and every Chrome word that loses its vellora partner.
//
// Keys. Chrome's PDF is the stable side (same Chrome, same templated HTML: its PyMuPDF word
// tuples are identical across every port-chain run, CONFIRMED 2026-10-21), so a pair is keyed by
// its CHROME word: `p<page>|<text>#<n>`, n = 1-based rank among the same-text Chrome words of that
// page in (baseline, x) order. The same key in two runs is the same Chrome word.

import { createHash } from "node:crypto";

export const PDF_PROBE_SEMANTICS = 2;
export const PDF_PROBE_SCHEMA = "vellora-layout-diff/pdf-probe/2";

/**
 * Pairing bound (pt, Euclidean on (x, baseline)). Above every vertical error the probe has to
 * report as a dx/dy (Phase A: +9 pt price column, -14 pt signature, -22.5 pt notification tail)
 * and below the distance at which unbounded assignments in the port-chain runs start to pair
 * different instances (data and choice: fidelity/layout-diff/README.md, "pdf-probe v2").
 */
export const MAX_PAIR_DISTANCE_PT = 36;

export const PDF_PROBE_SETTINGS = Object.freeze({
  semantics: PDF_PROBE_SEMANTICS,
  extractor: "pymupdf rawdict character origins (fidelity/oracles/py/words.py)",
  x: "pen origin x of the word's first glyph (pt, page top-left origin)",
  y: "baseline = origin y of the word's first glyph (pt, page top-left origin)",
  text: "NFC, U+FB00-U+FB06 ligatures expanded, case-sensitive; words split at whitespace and span boundaries",
  pairing:
    "same page, same text: maximum-cardinality minimum-total-distance assignment (Hungarian); Euclidean distance on (x, baseline); a pair farther than maxDistancePt is unpaired",
  maxDistancePt: MAX_PAIR_DISTANCE_PT,
  key: "Chrome word: p<page>|<text>#<n>, n = rank among the same-text Chrome words of the page by (baseline, x)",
});

const LIGATURES = new Map([
  ["ﬀ", "ff"],
  ["ﬁ", "fi"],
  ["ﬂ", "fl"],
  ["ﬃ", "ffi"],
  ["ﬄ", "ffl"],
  ["ﬅ", "st"],
  ["ﬆ", "st"],
]);

/** Text identity of a word for pairing: NFC, ligatures expanded, whitespace removed, case kept. */
export function textKey(text) {
  return String(text ?? "")
    .normalize("NFC")
    .replace(/[ﬀ-ﬆ]/g, (c) => LIGATURES.get(c))
    .replace(/\s+/g, "");
}

const round2 = (v) => Math.round(v * 100) / 100;
const byPosition = (a, b) => a.y - b.y || a.x - b.x;

/** words.py payload ({ pages: [{ page, words: [{ text, x, baseline, size, font }] }] }) -> words. */
export function flattenWordsPayload(payload) {
  return payload.pages.flatMap((p) =>
    p.words.map((w) => ({
      page: p.page,
      text: w.text,
      key: textKey(w.text),
      x: w.x,
      y: w.baseline,
      size: w.size,
      font: w.font,
    })),
  );
}

/**
 * Minimum-cost assignment of every row to a distinct column (rows <= columns), Hungarian method
 * with potentials, O(n^2 m). `cost[i][j]` finite. Returns `assign[i] = j`.
 */
export function assignMinCost(cost) {
  const n = cost.length;
  if (n === 0) return [];
  const m = cost[0].length;
  if (m < n) throw new Error("assignMinCost: more rows than columns");
  const u = new Float64Array(n + 1);
  const v = new Float64Array(m + 1);
  const p = new Int32Array(m + 1); // p[j] = row assigned to column j (1-based), 0 = none
  const way = new Int32Array(m + 1);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Float64Array(m + 1).fill(Number.POSITIVE_INFINITY);
    const used = new Uint8Array(m + 1);
    do {
      used[j0] = 1;
      const i0 = p[j0];
      let delta = Number.POSITIVE_INFINITY;
      let j1 = 0;
      for (let j = 1; j <= m; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }
  const assign = new Array(n).fill(-1);
  for (let j = 1; j <= m; j++) if (p[j]) assign[p[j] - 1] = j - 1;
  return assign;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Pair one group (same page, same text key) of vellora and Chrome words: maximum number of pairs
 * within `maxDistancePt`, then minimum total distance. Returns [[vIndex, cIndex, distance]].
 */
export function pairGroup(vs, cs, maxDistancePt) {
  if (!vs.length || !cs.length) return [];
  const rowsAreV = vs.length <= cs.length;
  const rows = rowsAreV ? vs : cs;
  const cols = rowsAreV ? cs : vs;
  // An out-of-bound pair costs more than any set of in-bound pairs could save, so the assignment
  // maximises the number of in-bound pairs first (BIG > n x bound), then minimises their sum.
  const big = (rows.length + 1) * (maxDistancePt + 1);
  const cost = rows.map((r) =>
    cols.map((c) => {
      const d = dist(r, c);
      return d <= maxDistancePt ? d : big;
    }),
  );
  const out = [];
  for (const [i, j] of assignMinCost(cost).entries()) {
    if (j < 0 || cost[i][j] >= big) continue;
    out.push(rowsAreV ? [i, j, cost[i][j]] : [j, i, cost[i][j]]);
  }
  return out;
}

/** Chrome word keys: p<page>|<text>#<n> in (baseline, x) order per page and text. */
export function keyChromeWords(chromeWords) {
  const groups = new Map();
  for (const w of chromeWords) {
    const g = `${w.page}\u0000${w.key}`;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(w);
  }
  const keyed = new Map();
  for (const list of groups.values()) {
    list.sort(byPosition);
    list.forEach((w, i) => keyed.set(w, `p${w.page}|${w.key}#${i + 1}`));
  }
  return keyed;
}

/**
 * Pair vellora's words with Chrome's: same page, same text key, bounded optimal assignment.
 * Returns { pairs: [{ k, text, v, c, dx, dy, dist }], unpairedVellora: [w], unpairedChrome: [{ k, ...w }] }
 * with dx/dy = vellora - Chrome in pt (y grows down), rounded to 0.01 pt.
 */
export function pairWords(
  velloraWords,
  chromeWords,
  { maxDistancePt = MAX_PAIR_DISTANCE_PT } = {},
) {
  const keys = keyChromeWords(chromeWords);
  const group = (words) => {
    const m = new Map();
    for (const w of words) {
      const g = `${w.page}\u0000${w.key}`;
      if (!m.has(g)) m.set(g, []);
      m.get(g).push(w);
    }
    for (const list of m.values()) list.sort(byPosition);
    return m;
  };
  const gv = group(velloraWords);
  const gc = group(chromeWords);
  const pairs = [];
  const pairedV = new Set();
  const pairedC = new Set();
  for (const [g, vs] of gv) {
    const cs = gc.get(g);
    if (!cs) continue;
    for (const [i, j, d] of pairGroup(vs, cs, maxDistancePt)) {
      const v = vs[i];
      const c = cs[j];
      pairedV.add(v);
      pairedC.add(c);
      pairs.push({
        k: keys.get(c),
        text: c.text,
        v,
        c,
        dx: round2(v.x - c.x),
        dy: round2(v.y - c.y),
        dist: round2(d),
      });
    }
  }
  const order = (a, b) => a.page - b.page || byPosition(a, b);
  pairs.sort((a, b) => order(a.c, b.c));
  return {
    pairs,
    unpairedVellora: velloraWords.filter((w) => !pairedV.has(w)).sort(order),
    unpairedChrome: chromeWords
      .filter((w) => !pairedC.has(w))
      .sort(order)
      .map((w) => ({ k: keys.get(w), ...w })),
  };
}

const pageCount = (words) => Math.max(0, ...words.map((w) => w.page));
const spot = (w) => ({ text: w.text, page: w.page, x: round2(w.x), y: round2(w.y) });
const at = (w) => ({ page: w.page, x: w.x, y: w.y, size: w.size, font: w.font });

/**
 * Fingerprint of the Chrome reference words (page, text, x, baseline, size in a canonical order):
 * the pair keys name the same words on both sides of a comparison only when it is equal.
 */
export function chromeWordsFingerprint(chromeWords) {
  const rows = chromeWords
    .map((w) => [w.page, w.text, round2(w.x), round2(w.y), round2(w.size ?? 0)])
    .sort(
      (a, b) =>
        a[0] - b[0] || a[3] - b[3] || a[2] - b[2] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0),
    );
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

/**
 * The body of a v2 pdf-probe.json (fidelity/layout-diff/pdf-probe.mjs adds fixture, label, env and
 * the pagination mapping): counts, every pair with both words, both unpaired lists.
 */
export function probeResultV2({ velloraWords, chromeWords, maxDistancePt = MAX_PAIR_DISTANCE_PT }) {
  const r = pairWords(velloraWords, chromeWords, { maxDistancePt });
  return {
    schema: PDF_PROBE_SCHEMA,
    semantics: PDF_PROBE_SEMANTICS,
    settings: { ...PDF_PROBE_SETTINGS, maxDistancePt },
    reference: { chromeWordsSha256: chromeWordsFingerprint(chromeWords) },
    pages: { vellora: pageCount(velloraWords), chrome: pageCount(chromeWords) },
    words: {
      vellora: velloraWords.length,
      chrome: chromeWords.length,
      paired: r.pairs.length,
      unpairedVellora: r.unpairedVellora.length,
      unpairedChrome: r.unpairedChrome.length,
    },
    pairs: r.pairs.map((p) => ({
      k: p.k,
      text: p.text,
      vellora: at(p.v),
      chrome: at(p.c),
      samePage: true,
      dx_pt: p.dx,
      dy_pt: p.dy,
      dist_pt: p.dist,
    })),
    unpairedChrome: r.unpairedChrome.map((w) => ({ k: w.k, ...spot(w) })),
    unpairedVellora: r.unpairedVellora.map(spot),
  };
}

/**
 * The gated section of a v2 probe (committed as baselines/<name>/pdf-probe/<fixture>.json; the
 * gate loads a run's pdf-probe.json through it): per Chrome key the paired word's dx/dy, both
 * unpaired lists, counts, semantics and settings.
 */
export function compactProbeV2(probe) {
  return {
    schema: probe.schema,
    semantics: probe.semantics,
    settings: probe.settings,
    reference: probe.reference,
    pages: probe.pages,
    words: probe.words,
    pairs: probe.pairs.map((p) => ({
      k: p.k,
      text: p.text,
      page: p.chrome.page,
      dx: p.dx_pt,
      dy: p.dy_pt,
    })),
    unpairedChrome: probe.unpairedChrome,
    unpairedVellora: probe.unpairedVellora,
  };
}

/** Semantics version of a loaded pdf-probe section (v1 sections carry none). */
export const sectionSemantics = (section) => section?.semantics ?? 1;

/**
 * Why two pdf-probe maps ({ fixture: section }) cannot be ratcheted against each other, or null.
 * Mirrors fidelity/gate/wpt.mjs wptComparability: different semantics or settings measure
 * different things, so the comparison is REFUSED instead of producing items.
 */
export function pdfProbeComparability(before, after) {
  if (!before || !after) return null;
  const sem = (map) => [...new Set(Object.values(map).map(sectionSemantics))];
  const b = sem(before);
  const a = sem(after);
  if (b.length > 1 || a.length > 1) {
    return `mixed pdf-probe semantics within one snapshot (baseline ${b.join("/")}, run ${a.join("/")})`;
  }
  if (b.length && a.length && b[0] !== a[0]) {
    return `pdf-probe semantics differ: baseline ${b[0]}, run ${a[0]} (v1 = pdftotext yMin + k-th occurrence pairing, v2 = PyMuPDF baseline + position pairing; re-score the baseline with fidelity/gate/rescore-pdf-probe.mjs)`;
  }
  if (a[0] === 2) {
    for (const [fixture, s] of Object.entries(after)) {
      const q = before[fixture];
      if (!q) continue;
      const x = JSON.stringify(q.settings ?? null);
      const y = JSON.stringify(s.settings ?? null);
      if (x !== y) return `pdf-probe settings differ for ${fixture}: baseline ${x}, run ${y}`;
      const rb = q.reference?.chromeWordsSha256;
      const ra = s.reference?.chromeWordsSha256;
      if (rb !== ra) {
        return `pdf-probe Chrome reference words differ for ${fixture} (sha256 ${rb?.slice(0, 12)} vs ${ra?.slice(0, 12)}): the pair keys would name different words; re-measure the baseline with the run's Chrome and templated HTML`;
      }
    }
  }
  return null;
}
