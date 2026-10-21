// Required-text matching shared by render-corpus.mjs (judging extracted PDF text) and the node
// self-tests (pinning occurrence counts against the templated HTML).
//
// A required string passes for one extractor when (a) it occurs verbatim (whitespace-normalized,
// case-sensitive; `loose` entries whitespace-free) and (b) it occurs at least `count` times
// case-insensitively (CSS text-transform may change case). `count` (default 1) is pinned in
// corpus.json to the number of occurrences in the templated HTML body, so a string that is also a
// substring of another required line ("Ficha de Compensação" inside "Autenticação Mecânica - Ficha
// de Compensação") cannot hide the deletion of one of them.

/** "@a.b.0" resolves against data.json; any other string is literal text. */
export function resolvePath(data, ref) {
  if (typeof ref !== "string" || !ref.startsWith("@")) {
    return ref;
  }
  return ref
    .slice(1)
    .split(".")
    .reduce((v, k) => (v == null ? undefined : v[k]), data);
}

export function normalizeText(s) {
  return s.replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** Non-overlapping case-insensitive occurrences of needle in hay. */
export function countOccurrences(hay, needle) {
  if (!needle) {
    return 0;
  }
  const h = hay.toUpperCase();
  const n = needle.toUpperCase();
  let count = 0;
  for (let i = h.indexOf(n); i !== -1; i = h.indexOf(n, i + n.length)) {
    count += 1;
  }
  return count;
}

export function requiredItems(fx, data) {
  return (fx.requiredText ?? []).map((item) => {
    const ref = typeof item === "string" ? item : item.text;
    const mode = typeof item === "string" ? "strict" : (item.match ?? "strict");
    const count = typeof item === "string" ? 1 : (item.count ?? 1);
    const needle = normalizeText(String(resolvePath(data, ref) ?? ""));
    return { ref, mode, count, needle };
  });
}

export function textMatches(fx, data, hayRaw) {
  const hay = normalizeText(hayRaw);
  const hayLoose = hay.replace(/ /g, "");
  return requiredItems(fx, data).map(({ ref, mode, count, needle }) => {
    const loose = mode === "loose";
    const n = loose ? needle.replace(/ /g, "") : needle;
    const h = loose ? hayLoose : hay;
    const present = n !== "" && h.includes(n);
    const occurrences = countOccurrences(h, n);
    return { ref, mode, count, occurrences, ok: present && occurrences >= count };
  });
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/**
 * Visible text of a templated HTML document's <body> (comments, <style>, <script> removed; every
 * tag becomes a space; entities decoded). Good enough for the corpus' own fixtures; NOT a general
 * HTML-to-text converter (no CSS: display:none / generated content are not modelled).
 */
export function visibleText(html) {
  const body = html.replace(/^[\s\S]*?<body[^>]*>/i, "").replace(/<\/body>[\s\S]*$/i, "");
  return normalizeText(
    body
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
        if (e[0] === "#") {
          const code =
            e[1] === "x" || e[1] === "X" ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1));
          return String.fromCodePoint(code);
        }
        return ENTITIES[e.toLowerCase()] ?? m;
      }),
  );
}
