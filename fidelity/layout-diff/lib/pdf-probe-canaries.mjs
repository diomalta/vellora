// Detection canaries of pdf-probe v2 (fidelity/README.md: an oracle is trusted only after it has
// caught a deliberately broken input). Each canary mutates vellora's PDF of one fixture, runs the
// SAME chain the gate uses (PyMuPDF words -> probeResultV2 -> compactProbeV2 -> the gate's
// comparePdfProbe of the unmutated section against the mutated one) and states what MUST happen.
// `caught` is computed from that output and from a control that proves the mutation did what it
// claims (and nothing else). Run by fidelity/oracles/lib/canaries.mjs (run-fixtures.mjs, gated
// by GATE-K1) and by layout-diff/test/pdf-probe-canaries.test.mjs on committed PDFs.
//
//   shift-6pt   the existing layout-shift-6pt.pdf (body translated +6 pt): dx gates, median
//               per-word dx change 6 +/- 1 pt
//   delete-word one word redacted: unpaired-chrome +1 gates and that Chrome word's pairing gates
//   shift-line  one glyph run moved 2 pt vertically, away from Chrome: that word's dy gates
//   ascent      same glyphs, every FontDescriptor /Ascent rewritten: v2 reports NOTHING, while the
//               v1 extractor (pdftotext yMin) moves and its gate would fire (the D1 artefact)
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { comparePdfProbe } from "../../gate/compare.mjs";
import { compactPdfProbe } from "../../gate/snapshot.mjs";
import { alignWords, parseBbox } from "./pdf-probe-v1.mjs";
import { compactProbeV2, pdfProbeComparability, probeResultV2, textKey } from "./pdf-probe-v2.mjs";
import { MUTATE_PY, pdfWordsV2 } from "./pdf-words.mjs";

export const PDF_PROBE_CANARY_ORACLE = "pdf-probe";
/** Declared /Ascent written into every subject FontDescriptor by the ascent canary (per 1000 em). */
export const ASCENT_CANARY_VALUE = 450;
const FX = "canary";

function mutate(python, ...args) {
  return JSON.parse(
    execFileSync(python, ["-I", MUTATE_PY, ...args.map(String)], { encoding: "utf8" }),
  );
}

/** The gate's pdf-probe items for baseline section `b` vs run section `a` (one fixture). */
export function gateItems(b, a) {
  const refusal = pdfProbeComparability({ [FX]: b }, { [FX]: a });
  const items = [];
  const counts = { unchanged: 0, withinTolerance: 0 };
  if (!refusal) comparePdfProbe({ [FX]: b }, { [FX]: a }, items, counts);
  return { refusal, items, counts, gating: items.filter((i) => i.gating) };
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : null;
};
const spotKey = (w) => `${w.page}|${w.text}|${w.x}|${w.y}`;

/** Words of `after` that are not in `before` and vice versa (exact page/text/x/baseline). */
function wordDiff(before, after) {
  const a = new Map();
  for (const w of after) a.set(spotKey(w), (a.get(spotKey(w)) ?? 0) + 1);
  const gone = [];
  for (const w of before) {
    const k = spotKey(w);
    if (a.get(k)) a.set(k, a.get(k) - 1);
    else gone.push(w);
  }
  const b = new Map();
  for (const w of before) b.set(spotKey(w), (b.get(spotKey(w)) ?? 0) + 1);
  const added = [];
  for (const w of after) {
    const k = spotKey(w);
    if (b.get(k)) b.set(k, b.get(k) - 1);
    else added.push(w);
  }
  return { gone, added };
}

const row = (canary, mustReport, observed, caught, extra = {}) => ({
  oracle: PDF_PROBE_CANARY_ORACLE,
  canary,
  mustReport,
  observed,
  caught,
  ran: true,
  ...extra,
});

export const CANARY_NAMES = Object.freeze({
  shift: "pdf-probe v2: body translated by +6pt in the subject only (layout-shift-6pt.pdf)",
  delete: "pdf-probe v2: one word deleted from the subject PDF (PyMuPDF redaction)",
  line: "pdf-probe v2: one glyph run of the subject moved 2pt vertically, away from Chrome",
  ascent:
    "pdf-probe v2: same glyphs, every subject FontDescriptor /Ascent rewritten (must NOT be flagged)",
  offPage: "pdf-probe v2: one glyph run of the subject moved below the MediaBox (off-page text)",
});

/**
 * Run the four canaries for one fixture. `velloraPdf` / `chromePdf`: the unmutated pair;
 * `shiftedPdf`: vellora's render with the body translated by +6 pt (null: that canary is
 * reported not-run); `pdftotext`: poppler binary for the ascent canary's v1 control.
 */
export function pdfProbeCanaries({
  velloraPdf,
  chromePdf,
  shiftedPdf,
  workDir,
  python,
  pdftotext,
  label = "",
}) {
  mkdirSync(workDir, { recursive: true });
  const tag = label ? `${label}: ` : "";
  const vw = pdfWordsV2(velloraPdf, python);
  const cw = pdfWordsV2(chromePdf, python);
  const v = vw.words;
  const c = cw.words;
  const baseProbe = probeResultV2({
    velloraWords: v,
    chromeWords: c,
    velloraOffPage: vw.offPage,
    chromeOffPage: cw.offPage,
  });
  const base = compactProbeV2(baseProbe);
  const sectionOf = (words, offPage = vw.offPage) =>
    compactProbeV2(
      probeResultV2({
        velloraWords: words,
        chromeWords: c,
        velloraOffPage: offPage,
        chromeOffPage: cw.offPage,
      }),
    );
  const out = [];

  // 1. +6 pt body shift (the layout-consensus canary's PDF).
  if (!shiftedPdf) {
    out.push({
      ...row(tag + CANARY_NAMES.shift, "n/a", "no shifted PDF", false),
      ran: false,
      reason: "layout-shift-6pt.pdf not rendered",
    });
  } else {
    const moved = sectionOf(pdfWordsV2(shiftedPdf, python).words);
    const g = gateItems(base, moved);
    const was = new Map(base.pairs.map((p) => [p.k, p]));
    const deltas = moved.pairs.filter((p) => was.has(p.k)).map((p) => p.dx - was.get(p.k).dx);
    const m = median(deltas);
    const dxGating = g.gating.filter((i) => i.key.endsWith("|dx")).length;
    out.push(
      row(
        tag + CANARY_NAMES.shift,
        "the gate FAILs on dx items and the median per-word dx change is 6 +/- 1 pt",
        `refusal ${g.refusal ?? "none"}; ${dxGating} dx gating of ${base.pairs.length} pairs; median dx change ${m === null ? "n/a" : m.toFixed(3)} pt over ${deltas.length} words; gating total ${g.gating.length}`,
        !g.refusal && dxGating > 0 && m !== null && Math.abs(m - 6) <= 1,
      ),
    );
  }

  // 2. One word deleted. Target: a paired word whose text is unique on its page in both PDFs, so
  //    the expected outcome does not depend on how the other instances re-pair.
  {
    const count = (ws) => {
      const m = new Map();
      for (const w of ws) m.set(`${w.page}|${w.key}`, (m.get(`${w.page}|${w.key}`) ?? 0) + 1);
      return m;
    };
    const cv = count(v);
    const cc = count(c);
    const target = baseProbe.pairs.find(
      (p) =>
        p.text.length >= 3 &&
        cv.get(`${p.vellora.page}|${textKey(p.text)}`) === 1 &&
        cc.get(`${p.chrome.page}|${textKey(p.text)}`) === 1,
    );
    if (!target) {
      out.push(row(tag + CANARY_NAMES.delete, "n/a", "no unique paired word to delete", false));
    } else {
      const pdf = join(workDir, "pdf-probe-delete-word.pdf");
      const m = mutate(
        python,
        "delete-word",
        velloraPdf,
        pdf,
        target.vellora.page,
        target.vellora.x,
        target.vellora.y,
      );
      const after = pdfWordsV2(pdf, python).words;
      const d = wordDiff(v, after);
      const control =
        m.applied && d.gone.length === 1 && d.gone[0].text === target.text && !d.added.length;
      const g = gateItems(base, sectionOf(after));
      const count1 = g.gating.find((i) => i.key === `pdf-probe|${FX}|unpaired-chrome`);
      const lost = g.gating.find((i) => i.key === `pdf-probe|${FX}|${target.k}|pairing`);
      out.push(
        row(
          tag + CANARY_NAMES.delete,
          `unpaired-chrome +1 gates and "${target.k}" loses its pairing (gates); control: exactly that word is gone, no other word moved`,
          `mutation ${m.applied ? `removed "${m.text}"` : `not applied: ${m.reason}`}; words gone ${d.gone.map((w) => w.text).join(",") || "none"}, changed/added ${d.added.length}; unpaired-chrome ${count1 ? `${count1.before} -> ${count1.after}` : "not gating"}; pairing item ${lost ? "gating" : "absent"}; gating total ${g.gating.length}`,
          Boolean(control && count1 && count1.after === count1.before + 1 && lost),
        ),
      );
    }
  }

  // 3. One glyph run moved 2 pt vertically, away from Chrome (so |dy| grows by exactly 2 pt).
  {
    let done = null;
    for (const p of baseProbe.pairs.filter((x) => Math.abs(x.dy_pt) <= 5).slice(0, 80)) {
      const dy = p.dy_pt >= 0 ? 2 : -2;
      const pdf = join(workDir, "pdf-probe-shift-line.pdf");
      const m = mutate(
        python,
        "shift-run",
        velloraPdf,
        pdf,
        p.vellora.page,
        p.vellora.x,
        p.vellora.y,
        dy,
      );
      if (m.applied) {
        done = { p, dy, pdf };
        break;
      }
    }
    if (!done) {
      out.push(
        row(tag + CANARY_NAMES.line, "n/a", "no krilla glyph run matched a paired word", false),
      );
    } else {
      const after = pdfWordsV2(done.pdf, python).words;
      const d = wordDiff(v, after);
      // Control: the words that changed moved by exactly dy on y and 0 on x; the target is one.
      const moved = d.added.length === d.gone.length && d.added.length > 0;
      const exact = d.added.every((w) =>
        d.gone.some(
          (g0) =>
            g0.text === w.text &&
            Math.abs(g0.x - w.x) < 0.01 &&
            Math.abs(w.y - g0.y - done.dy) < 0.01,
        ),
      );
      const hasTarget = d.gone.some(
        (w) => Math.abs(w.x - done.p.vellora.x) < 0.01 && Math.abs(w.y - done.p.vellora.y) < 0.01,
      );
      const g = gateItems(base, sectionOf(after));
      const item = g.gating.find((i) => i.key === `pdf-probe|${FX}|${done.p.k}|dy`);
      out.push(
        row(
          tag + CANARY_NAMES.line,
          `"${done.p.k}" |dy| gates with a change of 2 +/- 0.05 pt; control: only the run's words moved, by exactly ${done.dy} pt`,
          `run at (${done.p.vellora.x}, ${done.p.vellora.y}) p${done.p.vellora.page} moved ${done.dy} pt: ${d.added.length} word(s) moved, exact ${exact}; item ${item ? `${item.before} -> ${item.after} (delta ${item.delta.toFixed(3)})` : "not gating"}; gating total ${g.gating.length}`,
          Boolean(moved && exact && hasTarget && item && Math.abs(item.delta - 2) <= 0.05),
        ),
      );
    }
  }

  // 4. /Ascent rewritten (the D1 artefact): v2 must not move; the v1 extractor must (control).
  //    ASCENT_CANARY_VALUE sits about 250/1000 em below krilla's Liberation ascents (677-728), so
  //    v1's bbox tops move down by ~2.2 pt at 9 pt, the size of the artefact D1 measured
  //    (+2.12 pt at 12 pt): v1's |dy| grows by more than its 1 pt tolerance and its gate fires.
  {
    const pdf = join(workDir, "pdf-probe-ascent.pdf");
    const m = mutate(python, "set-ascent", velloraPdf, pdf, ASCENT_CANARY_VALUE);
    const after = pdfWordsV2(pdf, python).words;
    const d = wordDiff(v, after);
    const g = gateItems(base, sectionOf(after));
    const changed = g.items.filter((i) => i.class !== "unchanged");
    let v1 = "pdftotext unavailable";
    let v1Gating = null;
    if (pdftotext) {
      const words = (p) =>
        parseBbox(execFileSync(pdftotext, ["-bbox", p, "-"], { encoding: "utf8" }));
      const cw = words(chromePdf);
      const sec = (p) => compactPdfProbe({ pairs: v1Pairs(words(p), cw) });
      const items = [];
      comparePdfProbe({ [FX]: sec(velloraPdf) }, { [FX]: sec(pdf) }, items, { unchanged: 0 });
      v1Gating = items.filter((i) => i.gating).length;
      v1 = `v1 (pdftotext yMin, k-th occurrence) gating ${v1Gating}, other changes ${items.filter((i) => !i.gating).length}`;
    }
    out.push(
      row(
        tag + CANARY_NAMES.ascent,
        "v2: no pdf-probe item other than unchanged and identical words; control: the v1 extractor's gate fires on the same pair",
        `mutation ${m.applied ? `${m.descriptors.length} descriptor(s) -> /Ascent ${ASCENT_CANARY_VALUE}` : "not applied"}; words changed ${d.gone.length}/${d.added.length}; v2 non-unchanged items ${changed.length}, refusal ${g.refusal ?? "none"}; ${v1}`,
        Boolean(
          m.applied &&
            !d.gone.length &&
            !d.added.length &&
            !g.refusal &&
            !changed.length &&
            v1Gating > 0,
        ),
        pdftotext ? {} : { ran: false, reason: "pdftotext not found (the v1 control needs it)" },
      ),
    );
  }
  // 5. One glyph run moved below the MediaBox (step 08's "Download as PDF" at 846 pt on an
  //    841.92 pt page): PyMuPDF's page words drop it, so only the off-page record shows it; the
  //    off-page item for its text must gate. Control: the run's words leave the page words and
  //    appear, with the same x, in the off-page words, nothing else moves.
  {
    let done = null;
    for (const p of baseProbe.pairs.slice(0, 80)) {
      // Far below any page size the fixtures use (A4 841.92 pt, Letter 792 pt).
      const dy = Math.ceil(5000 - p.vellora.y);
      const pdf = join(workDir, "pdf-probe-off-page.pdf");
      const m = mutate(
        python,
        "shift-run",
        velloraPdf,
        pdf,
        p.vellora.page,
        p.vellora.x,
        p.vellora.y,
        dy,
      );
      if (m.applied) {
        done = { p, dy, pdf };
        break;
      }
    }
    if (!done) {
      out.push(
        row(tag + CANARY_NAMES.offPage, "n/a", "no krilla glyph run matched a paired word", false),
      );
    } else {
      const moved = pdfWordsV2(done.pdf, python);
      const d = wordDiff(v, moved.words);
      const offBefore = new Set((vw.offPage ?? []).map(spotKey));
      const newOff = (moved.offPage ?? []).filter((w) => !offBefore.has(spotKey(w)));
      const control =
        d.gone.length > 0 &&
        !d.added.length &&
        newOff.length === d.gone.length &&
        newOff.every((w) => d.gone.some((g0) => g0.text === w.text && Math.abs(g0.x - w.x) < 0.01));
      const g = gateItems(base, sectionOf(moved.words, moved.offPage));
      const item = g.gating.find(
        (i) => i.key === `pdf-probe|${FX}|off-page|${textKey(done.p.text)}`,
      );
      out.push(
        row(
          tag + CANARY_NAMES.offPage,
          `"${done.p.text}" moved ${done.dy} pt below its line, past the page edge: its off-page item gates; control: the run's ${d.gone.length} word(s) left the page words and are exactly the new off-page words`,
          `run at (${done.p.vellora.x}, ${done.p.vellora.y}) p${done.p.vellora.page} moved ${done.dy} pt: page words gone ${d.gone.length}, added ${d.added.length}; new off-page ${newOff.length}; off-page item ${item ? `${item.before} -> ${item.after}` : "not gating"}; gating total ${g.gating.length}`,
          Boolean(control && item),
        ),
      );
    }
  }
  return out;
}

/** v1 pairs in the shape pdf-probe.json semantics 1 recorded (for compactPdfProbe). */
function v1Pairs(vw, cw) {
  return alignWords(vw, cw).map(([a, b]) => ({
    text: a.text,
    vellora: { page: a.page, x: a.x, y: a.y },
    chrome: { page: b.page, x: b.x, y: b.y },
    samePage: a.page === b.page,
    dx_pt: Math.round((a.x - b.x) * 100) / 100,
    dy_pt: Math.round((a.y - b.y) * 100) / 100,
  }));
}
