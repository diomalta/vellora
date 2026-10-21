// LET-1 / LET-2 / LET-3 (letter / notification class) and TXT-B1 (statement table pagination),
// fidelity/ACCEPTANCE.md sections 3 and 4. Pure: run-all.mjs reads the files and passes them in.
//
// Inputs are the layout oracle's own word lists (fidelity/oracles/py/words.py: PyMuPDF pen origin
// x and BASELINE y per word, PDF pt, top-left origin) for vellora's PDF (subject), Chrome's PDF and
// WeasyPrint's PDF of the same templated HTML, plus the templated HTML itself (paragraph texts).
// Baselines, not box tops: box tops depend on the font ascent each PDF producer declares.

export const PT_PER_MM = 72 / 25.4;
/** Two references agree on a vertical position within this (same 2 pt as REF-W's consensus). */
export const LET_CONSENSUS_PT = 2;
/** LET-1 tolerance (ACCEPTANCE.md): 1.0 mm. */
export const LET1_TOL_MM = 1.0;
/** Words on one line share a baseline; a new line starts when the baseline moves more than this. */
export const LINE_BREAK_PT = 1.5;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", middot: "·" };

/** Text content of an HTML fragment: tags dropped, entities decoded, whitespace collapsed. */
export function htmlText(fragment) {
  return fragment
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
      if (e[0] === "#") {
        const cp =
          e[1] === "x" || e[1] === "X" ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1));
        return String.fromCodePoint(cp);
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Paragraphs (<p> elements) of the body in document order, optionally only after the first
 * occurrence of `after` (a literal string of the HTML, e.g. a section heading).
 */
export function paragraphs(html, { after = null } = {}) {
  let body = html.slice(Math.max(0, html.search(/<body[^>]*>/i)));
  if (after) {
    const at = body.indexOf(after);
    body = at >= 0 ? body.slice(at) : "";
  }
  body = body.replace(/<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "");
  return [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/gi)]
    .map((m) => htmlText(m[1]))
    .filter(Boolean);
}

/** Text lines of the `<div class="signature">` block (its child elements), or []. */
export function signatureLines(html) {
  const m = html.match(/<div\s+class="signature"[^>]*>([\s\S]*?)<\/div>\s*<\/body>/i);
  if (!m) return [];
  return [...m[1].matchAll(/<(p|div)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)]
    .map((x) => htmlText(x[2]))
    .filter(Boolean);
}

const norm = (s) => s.normalize("NFC").toLowerCase();
const tokens = (s) => norm(s).split(/\s+/).filter(Boolean);

/** Flatten a words.py document into reading-order words with their page. */
export function flatWords(doc) {
  return (doc?.pages ?? []).flatMap((p) =>
    p.words.map((w) => ({ ...w, page: p.page, norm: norm(w.text) })),
  );
}

/**
 * Locate a text block (token sequence) in a word list: the first index where all its tokens
 * follow in order. Returns the matched words or null. `from` lets callers locate blocks in order.
 */
export function locate(words, text, from = 0) {
  const t = tokens(text);
  if (!t.length) return null;
  for (let i = from; i + t.length <= words.length; i++) {
    let ok = true;
    for (let k = 0; k < t.length; k++) {
      if (words[i + k].norm !== t[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return { index: i, words: words.slice(i, i + t.length) };
  }
  return null;
}

/** Number of lines a located block occupies (baseline changes, or a page change). */
export function lineCount(found) {
  let lines = 0;
  let prev = null;
  for (const w of found.words) {
    if (!prev || w.page !== prev.page || Math.abs(w.baseline - prev.baseline) > LINE_BREAK_PT)
      lines++;
    prev = w;
  }
  return lines;
}

/** Locate every block of `texts` in order (a block not found does not advance the cursor). */
function locateAll(words, texts) {
  let cursor = 0;
  return texts.map((t) => {
    const f = locate(words, t, cursor);
    if (f) cursor = f.index + f.words.length;
    return f;
  });
}

const r2 = (x) => Math.round(x * 100) / 100;
const verdict = (criterion, oracle, status, value, extra = {}) => ({
  criterion,
  oracle,
  status,
  value,
  kind: "criterion",
  ...extra,
});

/**
 * LET-1: vertical position of the last paragraph and of every signature line vs the
 * Chrome/WeasyPrint consensus (both references within LET_CONSENSUS_PT of each other), <= 1.0 mm.
 * LET-2: line count of every paragraph equals the reference (Chrome and WeasyPrint agreeing).
 */
export function letterVerdicts({
  html,
  subject,
  chrome,
  weasyprint,
  after = null,
  mode = "plain",
}) {
  const oracle = "oracles:layout";
  if (!html || !subject || !chrome) {
    const why = !html
      ? "no templated HTML"
      : "layout oracle word lists missing (oracles did not run)";
    return [
      verdict("LET-1", oracle, "NOT-RUN", why, { mode }),
      verdict("LET-2", oracle, "NOT-RUN", why, { mode }),
    ];
  }
  const sw = flatWords(subject);
  const cw = flatWords(chrome);
  const ww = weasyprint ? flatWords(weasyprint) : null;
  const paras = paragraphs(html, { after });
  const sig = signatureLines(html).filter((l) => !paras.includes(l));
  const blocks = [...paras, ...sig];
  const at = {
    s: locateAll(sw, blocks),
    c: locateAll(cw, blocks),
    w: ww ? locateAll(ww, blocks) : null,
  };

  // LET-2 over paragraphs (not signature lines: single lines by construction).
  let compared = 0;
  let disputed = 0;
  let notLocated = 0;
  const mismatches = [];
  paras.forEach((p, i) => {
    const s = at.s[i];
    const c = at.c[i];
    const w = at.w?.[i] ?? null;
    if (!c || (ww && !w)) {
      disputed++;
      return;
    }
    if (!s) {
      notLocated++;
      mismatches.push(`"${p.slice(0, 32)}…" not found in vellora's text`);
      return;
    }
    const lc = lineCount(c);
    if (w && lineCount(w) !== lc) {
      disputed++;
      return;
    }
    compared++;
    const ls = lineCount(s);
    if (ls !== lc) mismatches.push(`"${p.slice(0, 32)}…" ${ls} lines vs ${lc}`);
  });
  const let2 = verdict(
    "LET-2",
    oracle,
    compared + notLocated === 0 ? "NOT-RUN" : mismatches.length ? "FAIL" : "PASS",
    compared + notLocated === 0
      ? `no paragraph comparable (${paras.length} paragraphs, ${disputed} with references disagreeing or not located)`
      : `${mismatches.length} of ${compared + notLocated} paragraphs differ in line count${mismatches.length ? `: ${mismatches.slice(0, 4).join("; ")}` : ""} (${disputed} disputed/not located in the references)`,
    {
      mode,
      metrics: [
        {
          metric: "paragraphsMismatched",
          value: mismatches.length,
          better: "lower",
          tolClass: "count",
        },
        { metric: "paragraphsCompared", value: compared + notLocated, better: "info" },
        { metric: "paragraphsDisputed", value: disputed, better: "info" },
      ],
      basis:
        "line count = distinct baselines of the paragraph's words (PyMuPDF origins) in vellora's, Chrome's and WeasyPrint's PDFs; reference = Chrome and WeasyPrint agreeing",
    },
  );

  // LET-1: the last paragraph and the signature lines (first word baseline).
  const anchorIdx = [paras.length - 1, ...sig.map((_, k) => paras.length + k)].filter(
    (i) => i >= 0,
  );
  const errors = [];
  let anchorsDisputed = 0;
  for (const i of anchorIdx) {
    const s = at.s[i]?.words[0];
    const c = at.c[i]?.words[0];
    const w = at.w?.[i]?.words[0] ?? null;
    if (
      !c ||
      (ww && !w) ||
      (w && (w.page !== c.page || Math.abs(w.baseline - c.baseline) > LET_CONSENSUS_PT))
    ) {
      anchorsDisputed++;
      continue;
    }
    const ref = w ? (c.baseline + w.baseline) / 2 : c.baseline;
    if (!s) {
      errors.push({ text: blocks[i], mm: null, why: "not found in vellora's text" });
      continue;
    }
    if (s.page !== c.page) {
      errors.push({ text: blocks[i], mm: null, why: `page ${s.page} vs ${c.page}` });
      continue;
    }
    errors.push({ text: blocks[i], mm: (s.baseline - ref) / PT_PER_MM });
  }
  let let1;
  if (!errors.length) {
    let1 = verdict(
      "LET-1",
      oracle,
      "NOT-RUN",
      `no anchor with a reference consensus (${anchorsDisputed} disputed)`,
      { mode },
    );
  } else {
    const unplaced = errors.filter((e) => e.mm === null);
    const worst = errors
      .filter((e) => e.mm !== null)
      .sort((a, b) => Math.abs(b.mm) - Math.abs(a.mm))[0];
    const worstMm = unplaced.length ? null : Math.abs(worst.mm);
    const ok = !unplaced.length && worstMm <= LET1_TOL_MM;
    let1 = verdict(
      "LET-1",
      oracle,
      ok ? "PASS" : "FAIL",
      unplaced.length
        ? `${unplaced.length} anchor(s) not placed: ${unplaced.map((e) => `"${e.text.slice(0, 24)}" ${e.why}`).join("; ")}`
        : `worst "${worst.text.slice(0, 32)}" dy ${r2(worst.mm)} mm (tol ${LET1_TOL_MM}; ${errors.length} anchors: last paragraph + signature lines; ${anchorsDisputed} disputed)`,
      {
        mode,
        metrics: [
          unplaced.length
            ? {
                metric: "worstMm",
                value: null,
                unmeasured: "anchor not placed",
                better: "lower",
                tolClass: "position-mm",
              }
            : { metric: "worstMm", value: r2(worstMm), better: "lower", tolClass: "position-mm" },
        ],
        anchors: errors.map((e) => ({
          text: e.text.slice(0, 48),
          dyMm: e.mm === null ? null : r2(e.mm),
          why: e.why,
        })),
      },
    );
  }
  return [let1, let2];
}

/** LET-3 = REF-P (or the corpus page-count criterion) re-labelled for the letter class. */
export function let3From(verdicts, sourceCriterion) {
  const v = verdicts.find((x) => x.criterion === sourceCriterion && (x.mode ?? "plain") !== "pdfa");
  if (!v) return verdict("LET-3", "oracles:layout", "NOT-RUN", `${sourceCriterion} not evaluated`);
  return { ...v, criterion: "LET-3", value: `${v.value} (= ${sourceCriterion})` };
}

/**
 * TXT-B1 on the statement table of text-stress-ptbr: every page holding statement rows also
 * holds the repeated <thead> (its "Histórico" and "Documento" header cells), and no month <tbody>
 * (break-inside: avoid) is split across pages unless the reference splits it too (taller than a
 * page). `months`: [{ label, dates: [...] }] from data.json, in document order.
 */
export function statementVerdict({
  subject,
  chrome,
  months,
  tableStart = "5. Extrato detalhado",
  tableEnd = "6. Termos e condições",
}) {
  const oracle = "oracles:layout";
  if (!subject || !months?.length) {
    return verdict(
      "TXT-B1",
      oracle,
      "NOT-RUN",
      subject ? "no months in data.json" : "layout oracle word lists missing",
    );
  }
  const pagesOf = (doc) => {
    const words = flatWords(doc);
    // The table's span in reading order: from its section heading to the next section heading
    // (dates elsewhere, e.g. the period in the page header, are not statement rows).
    const start = locate(words, tableStart)?.index ?? 0;
    const endAt = locate(words, tableEnd, start)?.index ?? words.length;
    const rows = new Set();
    const header = new Set();
    for (const w of words.slice(start, endAt)) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(w.text)) rows.add(w.page);
      if (w.norm === "histórico" || w.norm === "documento") header.add(w.page);
    }
    // Month blocks: label "Lançamentos de <mês> de 2026" then its rows' dates, in order.
    let cursor = start;
    const split = [];
    for (const m of months) {
      const label = locate(words, m.label, cursor);
      if (!label) {
        split.push({ month: m.label, pages: null });
        continue;
      }
      const pages = new Set([label.words[0].page]);
      let i = label.index + label.words.length;
      for (const d of m.dates) {
        while (i < words.length && words[i].text !== d) i++;
        if (i < words.length) pages.add(words[i].page);
      }
      cursor = label.index + 1;
      split.push({ month: m.label, pages: [...pages] });
    }
    return { rows: [...rows].sort(), header, split };
  };
  const s = pagesOf(subject);
  const c = chrome ? pagesOf(chrome) : null;
  const missingHeader = s.rows.filter((p) => !s.header.has(p));
  const splitMonths = s.split.filter((m, i) => {
    if (!m.pages || m.pages.length <= 1) return false;
    const ref = c?.split[i];
    return !(ref?.pages && ref.pages.length > 1);
  });
  const notFound = s.split.filter((m) => !m.pages).length;
  const ok = !missingHeader.length && !splitMonths.length && !notFound;
  return verdict(
    "TXT-B1",
    oracle,
    ok ? "PASS" : "FAIL",
    `${s.rows.length} pages with statement rows, header missing on ${missingHeader.length ? `page(s) ${missingHeader.join(", ")}` : "none"}; months split across pages ${splitMonths.length ? splitMonths.map((m) => `${m.month} (pages ${m.pages.join(",")})`).join("; ") : "none"}${notFound ? `; ${notFound} month label(s) not found` : ""} (a split the Chrome reference also makes is allowed: taller than a page)`,
    {
      metrics: [
        {
          metric: "pagesMissingHeader",
          value: missingHeader.length,
          better: "lower",
          tolClass: "count",
        },
        {
          metric: "monthsSplit",
          value: splitMonths.length + notFound,
          better: "lower",
          tolClass: "count",
        },
        { metric: "pagesWithRows", value: s.rows.length, better: "info" },
      ],
    },
  );
}
