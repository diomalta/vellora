// pdf-probe semantics 1 (history): poppler `pdftotext -bbox` word boxes, paired by occurrence.
// Kept to read and reproduce the v1 sections committed before the v2 re-score
// (baselines/<name>/attachments/pdf-probe-v1/) and as the negative control of the v2 ascent
// canary (layout-diff/lib/pdf-probe-canaries.mjs). The gate no longer measures with it.
import { normText } from "./vellora-model.mjs";

/**
 * Semantics 1 (history): parse `pdftotext -bbox` XHTML into words {page, text, x, y, w, h} in PDF
 * points (top-left); y is the bbox TOP, which carries the producer's declared /Ascent.
 */
export function parseBbox(xhtml) {
  const words = [];
  let page = 0;
  const re =
    /<page\b[^>]*>|<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
  for (const m of xhtml.matchAll(re)) {
    if (m[0].startsWith("<page")) {
      page += 1;
      continue;
    }
    const [x0, y0, x1, y1] = [m[1], m[2], m[3], m[4]].map(Number);
    const text = m[5]
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'");
    words.push({ page, text, norm: normText(text), x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  }
  return words;
}

/**
 * Semantics 1 (history). Align two word lists by (normalized text, occurrence index): the k-th
 * "de" of one PDF pairs with the k-th "de" of the other. Robust to line-wrap differences that reorder the extractor's reading
 * order (a sequential aligner loses sync there); a word whose occurrence count differs stays
 * unpaired.
 */
export function alignWords(a, b) {
  const index = new Map();
  for (const w of b) {
    if (!index.has(w.norm)) index.set(w.norm, []);
    index.get(w.norm).push(w);
  }
  const seen = new Map();
  const pairs = [];
  for (const w of a) {
    const k = seen.get(w.norm) ?? 0;
    seen.set(w.norm, k + 1);
    const match = index.get(w.norm)?.[k];
    if (match) pairs.push([w, match]);
  }
  return pairs;
}
