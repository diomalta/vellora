// Reftest metadata extraction: <link rel=match|mismatch>, <meta name=fuzzy>,
// <meta name=reftest-pages>, <meta name=timeout>, <meta name=flags>.
//
// Semantics follow the WPT manifest at the pinned commit
// (tools/manifest/sourcefile.py: `references`, `fuzzy`, `page_ranges`,
// `parse_ref_keyed_meta`). The manifest parses with an XML/HTML tree builder;
// we use tolerant regexes over comment-stripped source (as Blitz's runner does)
// because the runner must also see files the HTML parser would reject.

const SPACE_CHARS = " \t\n\f\r";

/** Remove HTML comments so commented-out <link>/<meta> tags are ignored. */
export function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

const ATTR_RE = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

/** Parse the attributes of a start tag string such as `<link rel=match href="a.html">`. */
export function parseAttributes(tag) {
  const inner = tag.replace(/^<\s*[^\s>/]+/, "").replace(/\/?>$/, "");
  const attrs = {};
  for (const m of inner.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    if (name in attrs) continue; // first attribute wins (HTML parser rule)
    attrs[name] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

/** All start tags with the given local name (optionally namespace-prefixed, e.g. `html:link`). */
export function findTags(html, localName) {
  const re = new RegExp(`<(?:[A-Za-z_][\\w.-]*:)?${localName}\\b[^>]*>`, "gi");
  return [...html.matchAll(re)].map((m) => ({ index: m.index, tag: m[0] }));
}

function trimSpace(s) {
  let a = 0;
  let b = s.length;
  while (a < b && SPACE_CHARS.includes(s[a])) a++;
  while (b > a && SPACE_CHARS.includes(s[b - 1])) b--;
  return s.slice(a, b);
}

/**
 * References of a node: [{ url, relation: "==" | "!=" }] in manifest order (all match links first,
 * then mismatch links — `reftest_nodes` concatenates the two findall() results).
 */
export function parseReferences(html, nodeUrl) {
  const src = stripComments(html);
  const match = [];
  const mismatch = [];
  for (const { tag } of findTags(src, "link")) {
    const a = parseAttributes(tag);
    if (!("href" in a) || a.rel === undefined) continue;
    // ElementTree `link[@rel='match']` is an exact attribute-value comparison.
    const rel = a.rel;
    if (rel !== "match" && rel !== "mismatch") continue;
    const url = new URL(trimSpace(a.href), nodeUrl).href;
    (rel === "match" ? match : mismatch).push({
      url,
      relation: rel === "match" ? "==" : "!=",
    });
  }
  return [...match, ...mismatch];
}

function metaContents(html, name) {
  const src = stripComments(html);
  const out = [];
  for (const { tag } of findTags(src, "meta")) {
    const a = parseAttributes(tag);
    if (a.name === name) out.push(a.content ?? "");
  }
  return out;
}

/**
 * Split a ref-keyed meta value (`[<ref-url> ":"] <value>`) as `parse_ref_keyed_meta` does:
 * `rsplit(":", 1)`; a key is resolved against the node URL and must name one of its references.
 */
export function parseRefKeyedMeta(content, nodeUrl, references) {
  const idx = content.lastIndexOf(":");
  if (idx === -1) return { key: null, value: content };
  const keyUrl = new URL(content.slice(0, idx), nodeUrl).href;
  const ref = references.find((r) => r.url === keyUrl);
  if (!ref) throw new Error(`fuzzy/page-range key ${keyUrl} does not correspond to a reference`);
  return {
    key: { lhs: nodeUrl, rhs: keyUrl, relation: ref.relation },
    value: content.slice(idx + 1),
  };
}

/** Parse one fuzzy value `maxDifference=a-b;totalPixels=c-d` (names optional, positional ok). */
export function parseFuzzyValue(value) {
  const args = ["maxDifference", "totalPixels"];
  const ranges = value.split(";");
  if (ranges.length !== 2) throw new Error(`Malformed fuzzy value ${value}`);
  const named = {};
  const positional = [];
  for (let part of ranges) {
    let name = null;
    if (part.includes("=")) {
      const eq = part.indexOf("=");
      name = part.slice(0, eq).trim();
      part = part.slice(eq + 1).trim();
      if (!args.includes(name)) throw new Error(`${name} is not a valid fuzzy property`);
      if (named[name]) throw new Error(`Got multiple values for argument ${name}`);
    }
    let lo;
    let hi;
    if (part.includes("-")) {
      const pieces = part.split("-");
      if (pieces.length !== 2) throw new Error(`Fuzzy value ${part} must be a range of integers`);
      [lo, hi] = pieces;
    } else {
      lo = part;
      hi = part;
    }
    const range = [lo, hi].map((x) => {
      const t = x.trim();
      if (!/^[+-]?\d+$/.test(t)) throw new Error(`Fuzzy value ${part} must be a range of integers`);
      return Number.parseInt(t, 10);
    });
    if (name === null) positional.push(range);
    else named[name] = range;
  }
  const out = {};
  for (const arg of args) out[arg] = named[arg] ?? positional.shift();
  if (!out.maxDifference || !out.totalPixels) throw new Error(`Malformed fuzzy value ${value}`);
  return out;
}

/** All fuzzy specs of a node: [{ key: {lhs,rhs,relation} | null, maxDifference, totalPixels }]. */
export function parseFuzzy(html, nodeUrl, references) {
  const specs = [];
  for (const content of metaContents(html, "fuzzy")) {
    const { key, value } = parseRefKeyedMeta(content, nodeUrl, references);
    if (specs.some((s) => sameKey(s.key, key))) {
      throw new Error("Got multiple fuzzy values for the same key");
    }
    specs.push({ key, ...parseFuzzyValue(value) });
  }
  return specs;
}

function sameKey(a, b) {
  if (a === null || b === null) return a === b;
  return a.lhs === b.lhs && a.rhs === b.rhs && a.relation === b.relation;
}

/**
 * Fuzzy tolerance for comparing `lhsNode` against `rhsUrl` (wptrunner `get_fuzzy`): the LHS node's
 * own specs, a spec keyed to exactly (lhs, rhs, relation) first, else the unkeyed one.
 */
export function fuzzyFor(lhsFuzzy, lhsUrl, rhsUrl, relation) {
  const keyed = lhsFuzzy.find(
    (s) => s.key && s.key.lhs === lhsUrl && s.key.rhs === rhsUrl && s.key.relation === relation,
  );
  const spec = keyed ?? lhsFuzzy.find((s) => s.key === null);
  return spec ? { maxDifference: spec.maxDifference, totalPixels: spec.totalPixels } : null;
}

/** Parse `<meta name=reftest-pages>`: { [nodeUrl]: [[lo|null, hi|null] | [n]] }. */
export function parsePageRanges(html, nodeUrl, references) {
  const out = {};
  for (const content of metaContents(html, "reftest-pages")) {
    const { key, value } = parseRefKeyedMeta(content, nodeUrl, references);
    const k = key === null ? nodeUrl : key.rhs;
    if (k in out) throw new Error("Duplicate page-ranges value");
    out[k] = value.split(",").map((raw) => {
      const r = raw.trim();
      if (r.includes("-")) {
        const parts = r.split("-").map((p) => p.trim());
        const nums = parts.map((p) => {
          if (p === "") return null;
          if (!/^\d+$/.test(p)) throw new Error(`Malformed page-range value ${r}`);
          return Number.parseInt(p, 10);
        });
        if (nums.some((n) => n === 0)) throw new Error(`Malformed page-range value ${r}`);
        return nums;
      }
      if (!/^\d+$/.test(r)) throw new Error(`Malformed page-range value ${r}`);
      return [Number.parseInt(r, 10)];
    });
  }
  return out;
}

/** wptrunner `get_pages`: 1-based page numbers to compare for a node with `total` pages. */
export function selectPages(ranges, total) {
  if (!ranges || ranges.length === 0) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set();
  for (const original of ranges) {
    const r = original.length === 1 ? [original[0], original[0]] : [...original];
    if (r[0] === null) r[0] = 1;
    if (r[1] === null) r[1] = total;
    if (r[0] > total) continue;
    for (let p = r[0]; p <= r[1]; p++) set.add(p);
  }
  return [...set].sort((a, b) => a - b);
}

/** `<meta name=timeout content=long>` → "long", else "normal". */
export function parseTimeout(html) {
  return metaContents(html, "timeout").some((c) => c.trim() === "long") ? "long" : "normal";
}

/** CSS-WG `<meta name=flags>` tokens (e.g. `ahem`, `paged`, `image`, `may`). */
export function parseFlags(html) {
  return metaContents(html, "flags")
    .flatMap((c) => c.split(/\s+/))
    .filter(Boolean);
}

/** Is the content a testharness.js test (manifest: script[@src='/resources/testharness.js']). */
export function isTestharness(html) {
  return /<script\b[^>]*\bsrc\s*=\s*["']?\/resources\/testharness\.js/i.test(stripComments(html));
}
