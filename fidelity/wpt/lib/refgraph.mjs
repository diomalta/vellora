// Reftest verdicts over a reference graph.
//
// Semantics (documented in fidelity/wpt/README.md):
// * Multiple references on one node follow WPT docs/writing-tests/reftests.md "Multiple
//   References" at the pinned commit: at least one `match` must match AND every `mismatch` must
//   differ.
// * Chained references follow wptrunner's RefTestImplementation.run_test DFS: when a `match`
//   comparison passes and that reference itself has references, the verdict continues into the
//   reference's own references (with the reference as the new left-hand side).
// * Per-comparison fuzzy comes from the LEFT-hand node's <meta name=fuzzy> (wptrunner get_fuzzy),
//   applied separately to every compared page; a page-count mismatch fails `==`.
// * Screen reftests compare page 1 only (the 800x600 viewport); print reftests compare every page
//   selected by <meta name=reftest-pages> (keyed per node URL, wptrunner get_pages).
// * When no alternative passes and some alternative could not be rendered (unsupported/error/
//   timeout/skip), the verdict is that non-evaluable outcome rather than "fail": we do not claim a
//   failure we could not observe.
import { fuzzyFor, selectPages } from "./html-meta.mjs";
import { imageHash, isBlank, pageEqual, pixelDiff } from "./pixels.mjs";

const MAX_CHAIN_DEPTH = 8;

/** Pages of `node` that take part in a comparison. */
export function comparedPages(node, mode, pageRanges) {
  if (mode === "screen") return node.pages.slice(0, 1);
  const total = node.pageCount ?? node.pages.length;
  const wanted = selectPages(pageRanges?.[node.url], total);
  return wanted.filter((n) => n <= node.pages.length).map((n) => node.pages[n - 1]);
}

function hashOf(img) {
  if (!img.hash) img.hash = imageHash(img);
  return img.hash;
}

/** Compare two loaded nodes. Returns a JSON-safe comparison record (+ `pagePair` for artifacts). */
export function compareNodes(lhs, rhs, relation, { mode, pageRanges }) {
  const a = comparedPages(lhs, mode, pageRanges);
  const b = comparedPages(rhs, mode, pageRanges);
  const fuzzy = fuzzyFor(lhs.fuzzy ?? [], lhs.url, rhs.url, relation);
  const record = {
    lhs: lhs.url,
    rhs: rhs.url,
    relation,
    fuzzy,
    pageCounts: [a.length, b.length],
    equal: true,
    firstDiffPage: null,
    maxDifference: 0,
    totalPixels: 0,
  };
  let pagePair = null;
  if (a.length !== b.length) {
    record.equal = false;
    record.pageCountMismatch = true;
  } else {
    for (let i = 0; i < a.length; i++) {
      const diff =
        hashOf(a[i]) === hashOf(b[i])
          ? { maxDifference: 0, totalPixels: 0, sizeMismatch: false }
          : pixelDiff(a[i], b[i]);
      if (!pageEqual(diff, fuzzy)) {
        record.equal = false;
        record.firstDiffPage = i + 1;
        record.maxDifference = diff.maxDifference;
        record.totalPixels = diff.totalPixels;
        if (diff.sizeMismatch) record.sizeMismatch = true;
        pagePair = [a[i], b[i]];
        break;
      }
      if (diff.totalPixels > record.totalPixels) {
        record.maxDifference = diff.maxDifference;
        record.totalPixels = diff.totalPixels;
      }
    }
  }
  record.pass = relation === "==" ? record.equal : !record.equal;
  return { record, pagePair };
}

/**
 * Evaluate a reftest whose root node is already loaded (status "ok").
 * `loadNode(url)` resolves to a loaded node `{ status: "ok", url, pages, pageCount, references,
 * fuzzy }` or a non-evaluable `{ status: "unsupported"|"error"|"timeout"|"skip", ... }`.
 * Returns { verdict: "pass"|"fail"|"cannot", cause?, comparisons, failure? }.
 */
export async function evaluateReftest(root, loadNode, { mode, pageRanges }) {
  const comparisons = [];
  let failure = null;

  const compare = (lhs, rhs, relation) => {
    const { record, pagePair } = compareNodes(lhs, rhs, relation, { mode, pageRanges });
    comparisons.push(record);
    if (!record.pass && !failure) failure = { record, pagePair };
    return record;
  };

  async function verdictOf(node, depth, stack) {
    const refs = node.references ?? [];
    for (const ref of refs.filter((r) => r.relation === "!=")) {
      const rhs = await loadNode(ref.url);
      if (rhs.status !== "ok") return { verdict: "cannot", cause: rhs };
      if (!compare(node, rhs, "!=").pass) return { verdict: "fail" };
    }
    const matches = refs.filter((r) => r.relation === "==");
    if (matches.length === 0) return { verdict: "pass" };
    let cannot = null;
    for (const ref of matches) {
      const rhs = await loadNode(ref.url);
      if (rhs.status !== "ok") {
        cannot ??= rhs;
        continue;
      }
      if (!compare(node, rhs, "==").pass) continue;
      const chained =
        (rhs.references ?? []).length > 0 && depth < MAX_CHAIN_DEPTH && !stack.has(rhs.url);
      if (!chained) return { verdict: "pass" };
      const sub = await verdictOf(rhs, depth + 1, new Set([...stack, rhs.url]));
      if (sub.verdict === "pass") return sub;
      if (sub.verdict === "cannot") cannot ??= sub.cause;
    }
    return cannot ? { verdict: "cannot", cause: cannot } : { verdict: "fail" };
  }

  const result = await verdictOf(root, 0, new Set([root.url]));
  return { ...result, comparisons, failure };
}

/** True when every compared page of the node is pure white. */
export function nodeIsBlank(node, mode, pageRanges) {
  return comparedPages(node, mode, pageRanges).every((p) => isBlank(p));
}
