// Layout consensus: Chrome and WeasyPrint are two independent references. Where they agree on a
// word's position (within tol), that position is the "consensus" reference and vellora's delta
// is scored against it; where they disagree, the word is "disputed" (the spec has to decide) and
// vellora is NOT scored on it. Pure functions; test/consensus.test.mjs proves the verdicts.

export const DEFAULT_TOLERANCES = Object.freeze([0.5, 1, 2, 4]);
export const PRIMARY_TOLERANCE = 2;
const SAME_LINE_PT = 1.5;

function readingOrder(a, b) {
  if (a.page !== b.page) {
    return a.page - b.page;
  }
  if (Math.abs(a.baseline - b.baseline) > SAME_LINE_PT) {
    return a.baseline - b.baseline;
  }
  return a.x - b.x;
}

/** Flatten a words.py payload into [{ page, text, x, baseline, x1, size, font }]. */
export function flattenWords(payload) {
  return payload.pages.flatMap((page) => page.words.map((word) => ({ page: page.page, ...word })));
}

function byText(words) {
  const groups = new Map();
  for (const word of words) {
    const list = groups.get(word.text) ?? [];
    list.push(word);
    groups.set(word.text, list);
  }
  for (const list of groups.values()) {
    list.sort(readingOrder);
  }
  return groups;
}

/**
 * Pair occurrences of the same text across the three producers. Occurrences are paired by
 * reading-order index ONLY when all three producers have the same count for that text; anything
 * else goes to a count-mismatch bucket instead of a forced (and possibly wrong) match.
 */
export function matchTriples(chromeWords, weasyWords, subjectWords) {
  const chrome = byText(chromeWords);
  const weasy = byText(weasyWords);
  const subject = byText(subjectWords);
  const texts = new Set([...chrome.keys(), ...weasy.keys(), ...subject.keys()]);
  const triples = [];
  const referenceCountMismatch = [];
  const subjectCountMismatch = [];
  for (const text of [...texts].sort()) {
    const c = chrome.get(text) ?? [];
    const w = weasy.get(text) ?? [];
    const s = subject.get(text) ?? [];
    if (c.length !== w.length) {
      referenceCountMismatch.push({
        text,
        chrome: c.length,
        weasyprint: w.length,
        subject: s.length,
      });
      continue;
    }
    if (s.length !== c.length) {
      subjectCountMismatch.push({
        text,
        chrome: c.length,
        weasyprint: w.length,
        subject: s.length,
      });
      continue;
    }
    for (let i = 0; i < c.length; i += 1) {
      triples.push({ text, chrome: c[i], weasyprint: w[i], subject: s[i] });
    }
  }
  return { triples, referenceCountMismatch, subjectCountMismatch };
}

function quantile(sorted, q) {
  if (sorted.length === 0) {
    return null;
  }
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[index];
}

const round = (value) => (value === null ? null : Math.round(value * 1000) / 1000);

function errorStats(deltas) {
  const absX = deltas.map((d) => Math.abs(d.dx)).sort((a, b) => a - b);
  const absY = deltas.map((d) => Math.abs(d.dy)).sort((a, b) => a - b);
  const dist = deltas.map((d) => Math.hypot(d.dx, d.dy)).sort((a, b) => a - b);
  const mean = (values) =>
    values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return quantile(sorted, 0.5);
  };
  return {
    words: deltas.length,
    medianDx: round(median(deltas.map((d) => d.dx))),
    medianDy: round(median(deltas.map((d) => d.dy))),
    meanAbsDx: round(mean(absX)),
    meanAbsDy: round(mean(absY)),
    p50Distance: round(quantile(dist, 0.5)),
    p95Distance: round(quantile(dist, 0.95)),
    maxDistance: round(dist.length ? dist[dist.length - 1] : null),
  };
}

/**
 * Score the subject against the Chrome/WeasyPrint consensus at several tolerances.
 * @returns { tolerances: [{ tol, consensus, disputed, coverage, subjectError, subjectWithinTol }],
 *            primary: {...}, worst: [...], disputedExamples: [...], buckets }
 */
export function scoreConsensus(
  { chrome, weasyprint, subject },
  { tolerances = DEFAULT_TOLERANCES, primary = PRIMARY_TOLERANCE, worst = 15 } = {},
) {
  const { triples, referenceCountMismatch, subjectCountMismatch } = matchTriples(
    chrome,
    weasyprint,
    subject,
  );
  const comparable = [];
  const pageMismatch = [];
  for (const triple of triples) {
    const { chrome: c, weasyprint: w, subject: s } = triple;
    if (c.page !== w.page || c.page !== s.page) {
      pageMismatch.push({
        text: triple.text,
        pages: { chrome: c.page, weasyprint: w.page, subject: s.page },
      });
      continue;
    }
    const refDx = w.x - c.x;
    const refDy = w.baseline - c.baseline;
    const reference = { x: (c.x + w.x) / 2, baseline: (c.baseline + w.baseline) / 2 };
    comparable.push({
      text: triple.text,
      page: c.page,
      referenceDisagreement: Math.max(Math.abs(refDx), Math.abs(refDy)),
      refDx,
      refDy,
      dx: s.x - reference.x,
      dy: s.baseline - reference.baseline,
      dxVsChrome: s.x - c.x,
      dyVsChrome: s.baseline - c.baseline,
      chrome: { x: c.x, baseline: c.baseline },
      weasyprint: { x: w.x, baseline: w.baseline },
      subject: { x: s.x, baseline: s.baseline },
    });
  }
  const perTolerance = tolerances.map((tol) => {
    const consensus = comparable.filter((entry) => entry.referenceDisagreement <= tol);
    const disputed = comparable.length - consensus.length;
    const within = consensus.filter((e) => Math.abs(e.dx) <= tol && Math.abs(e.dy) <= tol);
    const axis = (agreeing, key) => ({
      consensus: agreeing.length,
      coverage: comparable.length ? round(agreeing.length / comparable.length) : null,
      subjectError: errorStats(
        agreeing.map((e) => (key === "dx" ? { dx: e.dx, dy: 0 } : { dx: 0, dy: e.dy })),
      ),
      subjectWithinTol: agreeing.length
        ? round(agreeing.filter((e) => Math.abs(e[key]) <= tol).length / agreeing.length)
        : null,
    });
    return {
      tol,
      perAxis: {
        x: axis(
          comparable.filter((e) => Math.abs(e.refDx) <= tol),
          "dx",
        ),
        y: axis(
          comparable.filter((e) => Math.abs(e.refDy) <= tol),
          "dy",
        ),
      },
      matchedWords: comparable.length,
      consensus: consensus.length,
      disputed,
      coverage: comparable.length ? round(consensus.length / comparable.length) : null,
      subjectError: errorStats(consensus),
      subjectWithinTol: consensus.length ? round(within.length / consensus.length) : null,
    };
  });
  const primaryConsensus = comparable.filter((entry) => entry.referenceDisagreement <= primary);
  const describe = (e) => ({
    text: e.text,
    page: e.page,
    dx: round(e.dx),
    dy: round(e.dy),
    referenceDisagreement: round(e.referenceDisagreement),
    chrome: e.chrome,
    weasyprint: e.weasyprint,
    subject: e.subject,
  });
  return {
    anchor: "first-glyph pen origin x and baseline y (PyMuPDF rawdict), PDF pt, top-left origin",
    reference: "midpoint of Chrome and WeasyPrint when they agree within tol",
    tolerances: perTolerance,
    primary: perTolerance.find((t) => t.tol === primary) ?? null,
    worst: [...primaryConsensus]
      .sort((a, b) => Math.hypot(b.dx, b.dy) - Math.hypot(a.dx, a.dy))
      .slice(0, worst)
      .map(describe),
    disputedExamples: comparable
      .filter((e) => e.referenceDisagreement > primary)
      .sort((a, b) => b.referenceDisagreement - a.referenceDisagreement)
      .slice(0, worst)
      .map(describe),
    buckets: {
      matchedTriples: triples.length,
      comparable: comparable.length,
      pageMismatch: pageMismatch.length,
      pageMismatchExamples: pageMismatch.slice(0, worst),
      referenceCountMismatch: referenceCountMismatch.length,
      referenceCountMismatchExamples: referenceCountMismatch.slice(0, worst),
      subjectCountMismatch: subjectCountMismatch.length,
      subjectCountMismatchExamples: subjectCountMismatch.slice(0, worst),
    },
  };
}
