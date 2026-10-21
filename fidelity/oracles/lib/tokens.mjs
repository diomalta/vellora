// Text normalization, token-sequence comparison and the copy-paste round-trip check.
// Pure functions (no I/O) so test/tokens.test.mjs can prove each verdict on crafted inputs.

const SOFT_HYPHEN = /\u00AD/g;
const ZERO_WIDTH = /\u200B|\u200C|\u200D|\u2060/g;

/**
 * Normalize for comparison: Unicode NFC, drop soft hyphens / zero-width characters, collapse
 * every Unicode whitespace run (incl. NBSP, U+202F, form feed) to one space. Deliberately NOT
 * NFKC: NFKC would fold "\uFB01" into "fi" and hide exactly the defect the copy-paste check exists for.
 */
export function normalizeText(raw) {
  return String(raw)
    .normalize("NFC")
    .replace(SOFT_HYPHEN, "")
    .replace(ZERO_WIDTH, "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function tokenize(raw) {
  const normalized = normalizeText(raw);
  return normalized ? normalized.split(" ") : [];
}

function multiset(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

/** Multiset intersection/difference helpers. Returns { common, onlyA, onlyB } as arrays. */
export function multisetSplit(a, b) {
  const counts = multiset(b);
  const common = [];
  const onlyA = [];
  for (const token of a) {
    const left = counts.get(token) ?? 0;
    if (left > 0) {
      common.push(token);
      counts.set(token, left - 1);
    } else {
      onlyA.push(token);
    }
  }
  const onlyB = [];
  for (const [token, count] of counts) {
    for (let i = 0; i < count; i += 1) {
      onlyB.push(token);
    }
  }
  return { common, onlyA, onlyB };
}

/**
 * Inside one unaligned gap, find tokens that are a contiguous run of >= 2 tokens on the other
 * side (a line wrap after "0000-" turns "FAKE-AUTH-0000-XXXX" into two extracted words; a
 * letter-spaced run turns one word into many). Those are word-boundary differences.
 */
export function absorbSplits(gapExpected, gapActual) {
  const usedExpected = new Array(gapExpected.length).fill(false);
  const usedActual = new Array(gapActual.length).fill(false);
  const groups = [];
  let expectedTokensAbsorbed = 0;
  const findRun = (whole, pieces, used) => {
    for (let start = 0; start < pieces.length; start += 1) {
      if (used[start] || pieces[start] === whole || !whole.startsWith(pieces[start])) {
        continue;
      }
      let concat = pieces[start];
      let end = start;
      while (concat.length < whole.length && end + 1 < pieces.length && !used[end + 1]) {
        end += 1;
        concat += pieces[end];
      }
      if (concat === whole && end > start) {
        return [start, end];
      }
    }
    return null;
  };
  for (let i = 0; i < gapExpected.length; i += 1) {
    const run = findRun(gapExpected[i], gapActual, usedActual);
    if (run) {
      usedExpected[i] = true;
      for (let j = run[0]; j <= run[1]; j += 1) usedActual[j] = true;
      groups.push({
        expected: gapExpected[i],
        actual: gapActual.slice(run[0], run[1] + 1).join(" "),
      });
      expectedTokensAbsorbed += 1;
    }
  }
  for (let j = 0; j < gapActual.length; j += 1) {
    if (usedActual[j]) continue;
    const run = findRun(gapActual[j], gapExpected, usedExpected);
    if (run) {
      usedActual[j] = true;
      for (let i = run[0]; i <= run[1]; i += 1) usedExpected[i] = true;
      groups.push({
        expected: gapExpected.slice(run[0], run[1] + 1).join(" "),
        actual: gapActual[j],
      });
      expectedTokensAbsorbed += run[1] - run[0] + 1;
    }
  }
  return {
    groups,
    expectedTokensAbsorbed,
    restExpected: gapExpected.filter((_, i) => !usedExpected[i]),
    restActual: gapActual.filter((_, j) => !usedActual[j]),
  };
}

const MAX_LCS_CELLS = 40_000_000;

/**
 * Character-weighted LCS alignment of two token arrays -> [i, j] index pairs (in order).
 * A match is worth its length in code points, so long content tokens win anchors over stray
 * one-character tokens (a "1" from letter-spaced digits must not anchor against a page number
 * and break up the gap that would otherwise be recognized as a word-boundary difference).
 */
export function lcsPairs(a, b) {
  const n = a.length;
  const m = b.length;
  if ((n + 1) * (m + 1) > MAX_LCS_CELLS) {
    return null;
  }
  const width = m + 1;
  const weight = (token) => [...token].length;
  const table = new Uint32Array((n + 1) * width);
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      const skip = Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
      table[i * width + j] =
        a[i] === b[j] ? Math.max(skip, table[(i + 1) * width + j + 1] + weight(a[i])) : skip;
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j] && table[i * width + j] === table[(i + 1) * width + j + 1] + weight(a[i])) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return pairs;
}

function charBagRecall(expectedTokens, actualTokens) {
  const expectedChars = [...expectedTokens.join("")];
  const actualChars = [...actualTokens.join("")];
  if (expectedChars.length === 0) {
    return 1;
  }
  return multisetSplit(expectedChars, actualChars).common.length / expectedChars.length;
}

/**
 * Compare an extracted token sequence against the expected one.
 * - inOrder: tokens aligned by LCS (same order).
 * - boundaryOnly: a gap between two LCS anchors whose expected and actual tokens are equal once
 *   whitespace is removed (e.g. letter-spaced "9 9 9" vs "999", or "R$1,00" vs "R$ 1,00").
 *   That is a word-boundary difference, not lost or invented content.
 * - reordered: unaligned tokens present on both sides (content present, order differs).
 * - missing / extra: unaligned tokens present on one side only.
 */
export function compareTokens(expected, actual, { examples = 25 } = {}) {
  const pairs = lcsPairs(expected, actual);
  const bag = multisetSplit(expected, actual);
  const base = {
    expectedTokens: expected.length,
    actualTokens: actual.length,
    bagRecall: expected.length ? bag.common.length / expected.length : 1,
    bagPrecision: actual.length ? bag.common.length / actual.length : 1,
    charBagRecall: charBagRecall(expected, actual),
  };
  if (!pairs) {
    return {
      ...base,
      lcs: "skipped (input too large)",
      missing: bag.onlyA,
      extra: bag.onlyB,
      reordered: [],
      boundaryOnly: [],
      boundaryOnlyAll: [],
    };
  }
  const missingCandidates = [];
  const extraCandidates = [];
  const boundaryOnly = [];
  let boundaryExpectedTokens = 0;
  const anchors = [[-1, -1], ...pairs, [expected.length, actual.length]];
  for (let k = 1; k < anchors.length; k += 1) {
    const [i0, j0] = anchors[k - 1];
    const [i1, j1] = anchors[k];
    const gapExpected = expected.slice(i0 + 1, i1);
    const gapActual = actual.slice(j0 + 1, j1);
    if (gapExpected.length === 0 && gapActual.length === 0) {
      continue;
    }
    if (
      gapExpected.length > 0 &&
      gapActual.length > 0 &&
      gapExpected.join("") === gapActual.join("")
    ) {
      boundaryOnly.push({ expected: gapExpected.join(" "), actual: gapActual.join(" ") });
      boundaryExpectedTokens += gapExpected.length;
      continue;
    }
    const absorbed = absorbSplits(gapExpected, gapActual);
    boundaryOnly.push(...absorbed.groups);
    boundaryExpectedTokens += absorbed.expectedTokensAbsorbed;
    missingCandidates.push(...absorbed.restExpected);
    extraCandidates.push(...absorbed.restActual);
  }
  const split = multisetSplit(missingCandidates, extraCandidates);
  return {
    ...base,
    inOrder: pairs.length,
    orderedRecall: expected.length ? (pairs.length + boundaryExpectedTokens) / expected.length : 1,
    boundaryOnly: boundaryOnly.slice(0, examples),
    boundaryOnlyAll: boundaryOnly,
    boundaryOnlyGroups: boundaryOnly.length,
    reordered: split.common,
    missing: split.onlyA,
    extra: split.onlyB,
  };
}

/**
 * Split a subject's missing/extra/reordered tokens into "explained" (the same extractor shows
 * the same token in the same bucket on the CONTROL pdf, i.e. Chrome's own print of the same
 * HTML) and "subjectOnly" (attributable to the subject renderer).
 */
export function againstControl(subject, control) {
  const out = {};
  for (const bucket of ["missing", "extra", "reordered"]) {
    const split = multisetSplit(subject[bucket], control?.[bucket] ?? []);
    out[bucket] = { explained: split.common, subjectOnly: split.onlyA };
  }
  return out;
}

const LIGATURES = /[\uFB00-\uFB06]/gu;
// Nonspacing combining marks (U+0300-036F and the rest of Mn): their presence means NFD text.
const COMBINING = /\p{Mn}/gu;
const REPLACEMENT = /\uFFFD/gu;
const PRIVATE_USE = /[\uE000-\uF8FF]/gu;
// biome-ignore lint/suspicious/noControlCharactersInRegex: detecting C0 controls is the point.
const CONTROL = /[\u0000-\u0008\u000B\u000E-\u001F\u007F]/gu;

function contexts(raw, regex, limit = 10) {
  const found = [];
  for (const match of raw.matchAll(regex)) {
    if (found.length >= limit) {
      break;
    }
    const start = Math.max(0, match.index - 12);
    found.push({
      char: `U+${match[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`,
      context: raw.slice(start, match.index + 12).replace(/\s+/g, " "),
    });
  }
  return { count: [...raw.matchAll(regex)].length, examples: found };
}

/**
 * Copy-paste round trip: would a user copying text out of the PDF get the characters the
 * document shows? Fails on ligature presentation forms (U+FB00-FB06 instead of "fi"/"fl"/...),
 * decomposed (NFD) accents, U+FFFD, private-use code points, C0 controls, and on expected words
 * with diacritics or f-ligature letter pairs that cannot be found verbatim in the extraction.
 */
export function copyPasteCheck(raw, expectedTokens) {
  const text = String(raw);
  const normalizedActual = ` ${normalizeText(text)} `;
  const ligatures = contexts(text, LIGATURES);
  const combining = contexts(text, COMBINING);
  const replacement = contexts(text, REPLACEMENT);
  const privateUse = contexts(text, PRIVATE_USE);
  const control = contexts(text, CONTROL);
  const unique = [...new Set(expectedTokens)];
  const diacriticWords = unique.filter(
    (token) => [...token].some((c) => c.codePointAt(0) > 0x7f) && /\p{L}/u.test(token),
  );
  const ligatureWords = unique.filter((token) => /ff|fi|fl/.test(token));
  const missingDiacriticWords = diacriticWords.filter((word) => !normalizedActual.includes(word));
  const missingLigatureWords = ligatureWords.filter((word) => !normalizedActual.includes(word));
  const failures = [];
  if (ligatures.count) failures.push(`${ligatures.count} ligature presentation-form code point(s)`);
  if (combining.count) failures.push(`${combining.count} combining mark(s) (NFD text on copy)`);
  if (replacement.count) failures.push(`${replacement.count} U+FFFD`);
  if (privateUse.count) failures.push(`${privateUse.count} private-use code point(s)`);
  if (control.count) failures.push(`${control.count} control character(s)`);
  if (missingDiacriticWords.length) {
    failures.push(
      `${missingDiacriticWords.length}/${diacriticWords.length} diacritic word(s) not found verbatim`,
    );
  }
  if (missingLigatureWords.length) {
    failures.push(
      `${missingLigatureWords.length}/${ligatureWords.length} ff/fi/fl word(s) not found verbatim`,
    );
  }
  return {
    pass: failures.length === 0,
    failures,
    ligatureCodepoints: ligatures,
    combiningMarks: combining,
    replacementChars: replacement,
    privateUse,
    controlChars: control,
    diacriticWords: { checked: diacriticWords.length, missing: missingDiacriticWords },
    ligatureWords: { checked: ligatureWords.length, missing: missingLigatureWords },
  };
}
