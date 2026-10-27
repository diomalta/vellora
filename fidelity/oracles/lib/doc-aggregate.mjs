// Document-level aggregate oracle (exit-contract condition 2, fidelity/ACCEPTANCE.md DOC-*).
//
// Promoted on 2026-10-27 from the ad-hoc visual compare script (run store
// visual-compare-20261027/scripts/compare.py, not committed). The SAME method scores every engine
// (vellora at the run, the published pin, Chrome against itself for the noise measurement):
//
// - Words: fidelity/oracles/py/words.py (PyMuPDF rawdict), the extractor pdf-probe v2 and REF-W
//   already use. Anchor = pen origin x of the first glyph and the BASELINE y. compare.py used
//   page.get_text("words") boxes (x0, y1): y1 is the box bottom, which comes from the descent
//   the PRODUCER declares for the font (krilla and Chromium declare different values for the same
//   file, words.py docstring), so it carried a constant producer offset with no glyph moving.
//   Only words drawn inside the page are read (MuPDF clips to the MediaBox), so text a reader
//   never sees counts as missing.
// - Text key: NFC, ligature presentation forms folded, whitespace removed (pdf-probe v2 textKey).
// - Document coordinates: y + the sum of the heights of the pages before the word's page, so a
//   word on another page than Chrome's is ~297 mm away and the aggregate shows a page break.
// - Pairing: the k-th occurrence of a text key in the subject, in reading order (page, baseline,
//   x), is paired with the k-th occurrence of that key in Chrome's PDF (compare.py's rule). It is
//   deliberately NOT a nearest-copy assignment: on a document-level aggregate a minimum-distance
//   pairing would pick whichever copy happens to be close and flatter the subject.
// - Metrics, per fixture, distances in mm (1 pt = 25.4/72 mm): medianMm and p90Mm over the
//   PAIRED words (nearest rank: the ceil(q*n)-th smallest), within1mmPct = paired words at
//   <= 1 mm / ALL Chrome words (a missing word is never within 1 mm), missingWords (Chrome words
//   with no subject copy), extraWords (subject words with no Chrome copy), samePagePct (paired
//   on the same page / all Chrome words), pages vs chromePages.
import { createHash } from "node:crypto";
import { textKey } from "../../layout-diff/lib/pdf-probe-v2.mjs";

export const DOC_AGGREGATE_SCHEMA = "vellora-fidelity/doc-aggregate/1";
export const MM_PER_PT = 25.4 / 72;
export const WITHIN_MM = 1;

export const METHOD = Object.freeze({
  extractor: "fidelity/oracles/py/words.py (PyMuPDF rawdict: pen origin x, baseline y)",
  textKey: "NFC, ligatures U+FB00-FB06 folded, whitespace removed",
  coordinates: "document y = baseline + sum of the heights of the previous pages",
  pairing:
    "k-th occurrence of a text key in reading order (page, baseline, x) <-> k-th in Chrome's",
  quantiles: "nearest rank over paired words (ceil(q*n)-th smallest)",
  within1mmPct: "paired words with distance <= 1 mm / all Chrome words",
  rounding: "mm 0.01, percentages 0.1",
});

const round = (v, d) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);

/** Flat words of a words.py payload in reading order, with document coordinates (pt). */
export function documentWords(payload) {
  const out = [];
  let offset = 0;
  for (const p of payload.pages) {
    for (const w of p.words) {
      const key = textKey(w.text);
      if (key)
        out.push({ key, page: p.page, x: w.x, baseline: w.baseline, y: w.baseline + offset });
    }
    offset += p.height;
  }
  return out.sort((a, b) => a.page - b.page || a.baseline - b.baseline || a.x - b.x);
}

/** sha256 of the reference geometry (page boxes + every word's key and anchor at 0.01 pt). */
export function geometrySha256(payload) {
  const lines = payload.pages.map((p) => `page ${p.page} ${p.width} ${p.height}`);
  for (const w of documentWords(payload)) {
    lines.push(`${w.page} ${w.key} ${w.x.toFixed(2)} ${w.baseline.toFixed(2)}`);
  }
  return createHash("sha256").update(lines.join("\n")).digest("hex");
}

/** Nearest-rank quantile of an ascending array (null when empty). */
export function quantile(sorted, q) {
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
}

/**
 * Aggregate of one subject PDF against Chrome's PDF of the same HTML, from their words.py
 * payloads. Returns the per-fixture metrics (module header).
 */
export function aggregateDocument(chromePayload, subjectPayload) {
  const chrome = documentWords(chromePayload);
  const subject = documentWords(subjectPayload);
  const copies = new Map();
  for (const w of subject) {
    if (!copies.has(w.key)) copies.set(w.key, []);
    copies.get(w.key).push(w);
  }
  const seen = new Map();
  const distances = [];
  let missing = 0;
  let samePage = 0;
  for (const c of chrome) {
    const k = seen.get(c.key) ?? 0;
    seen.set(c.key, k + 1);
    const s = copies.get(c.key)?.[k];
    if (!s) {
      missing++;
      continue;
    }
    distances.push(Math.hypot(s.x - c.x, s.y - c.y) * MM_PER_PT);
    if (s.page === c.page) samePage++;
  }
  distances.sort((a, b) => a - b);
  const n = chrome.length;
  const within = distances.filter((d) => d <= WITHIN_MM).length;
  return {
    pages: subjectPayload.pages.length,
    chromePages: chromePayload.pages.length,
    pageDelta: subjectPayload.pages.length - chromePayload.pages.length,
    chromeWords: n,
    subjectWords: subject.length,
    pairedWords: distances.length,
    missingWords: missing,
    extraWords: subject.length - distances.length,
    medianMm: round(quantile(distances, 0.5), 2),
    p90Mm: round(quantile(distances, 0.9), 2),
    within1mmPct: n ? round((100 * within) / n, 1) : null,
    samePagePct: n ? round((100 * samePage) / n, 1) : null,
  };
}
