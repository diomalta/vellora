// Run one reftest with a given node loader and produce the per-test result record.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { diffImage, encodePng, inkSignature } from "./pixels.mjs";
import {
  comparedPages,
  evaluateReftest,
  isDeclaredBlankReference,
  nodeIsBlank,
} from "./refgraph.mjs";

function relOf(url) {
  if (typeof url === "string" && url.startsWith("about:")) return url;
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return url;
  }
}

/** Strip a non-evaluable node to the JSON-safe fields a result needs. */
export function describeCause(cause) {
  const out = { status: cause.status, url: cause.url ? relOf(cause.url) : undefined };
  for (const k of ["feature", "line", "col", "kind", "reason", "message"]) {
    if (cause[k] !== undefined && cause[k] !== null) out[k] = cause[k];
  }
  if (typeof out.message === "string" && out.message.length > 600) {
    out.message = `${out.message.slice(0, 600)}…`;
  }
  return out;
}

function compactRecord(r) {
  const out = {
    lhs: relOf(r.lhs),
    rhs: relOf(r.rhs),
    relation: r.relation,
    pass: r.pass,
    maxDifference: r.maxDifference,
    totalPixels: r.totalPixels,
  };
  if (r.fuzzy) out.fuzzy = r.fuzzy;
  if (r.firstDiffPage !== null) out.firstDiffPage = r.firstDiffPage;
  if (r.pageCountMismatch) out.pageCountMismatch = true;
  if (r.sizeMismatch) out.sizeMismatch = true;
  out.pageCounts = r.pageCounts;
  return out;
}

function writeArtifacts({ dir, record, pagePair, page, loaded, keepPdf }) {
  mkdirSync(dir, { recursive: true });
  if (pagePair) {
    writeFileSync(join(dir, `lhs-p${page}.png`), encodePng(pagePair[0]));
    writeFileSync(join(dir, `rhs-p${page}.png`), encodePng(pagePair[1]));
    if (pagePair[0].width === pagePair[1].width && pagePair[0].height === pagePair[1].height) {
      writeFileSync(join(dir, `diff-p${page}.png`), encodePng(diffImage(pagePair[0], pagePair[1])));
    }
  }
  if (keepPdf) {
    for (const [side, url] of [
      ["lhs", record.lhs],
      ["rhs", record.rhs],
    ]) {
      const n = loaded.get(url);
      if (n?.pdf) writeFileSync(join(dir, `${side}.pdf`), n.pdf);
    }
  }
  writeFileSync(
    join(dir, "comparison.json"),
    `${JSON.stringify({ ...compactRecord(record), lhsFile: relOf(record.lhs), rhsFile: relOf(record.rhs) }, null, 2)}\n`,
  );
}

/**
 * Evaluate `test` ({ rel, url, mode }) and return its result record.
 *
 * Outcome `pass-blank`: the WPT pass rule holds but every compared page of the TEST rendering is
 * pure white, and the reference it matched is not an empty document by construction
 * (`isDeclaredBlankReference`). Such a pass only shows that test and reference lost the same
 * content, so it is never counted as `pass`. Decided from this engine's own rendering only, so the
 * outcome does not depend on whether an oracle ran.
 *
 * Artifacts: when `artifactsDir` is set, a failing test (or, with `artifacts === "all"`, any test
 * that was compared) gets the first differing page pair — for a pass, page 1 of the test and of
 * its first reference — plus a diff image under artifactsDir/<rel>/ (PDFs too when `keepPdf`).
 */
export async function runReftest({
  test,
  loadNode,
  artifactsDir,
  artifacts = "fail",
  keepPdf = false,
  chainReferences = false,
}) {
  const started = performance.now();
  const result = { test: test.rel, mode: test.mode };
  const root = await loadNode(test.url);
  if (root.status !== "ok") {
    Object.assign(result, { outcome: root.status, node: "test", cause: describeCause(root) });
    result.durationMs = Math.round(performance.now() - started);
    return result;
  }
  if (root.info) result.prepare = root.info;
  if (root.pageCount !== null) result.pageCount = root.pageCount;
  if (root.timeout === "long") result.timeoutClass = "long";

  const loaded = new Map([[root.url, root]]);
  const tracked = async (url) => {
    const n = await loadNode(url);
    if (n.status === "ok") loaded.set(url, n);
    return n;
  };
  const evaluation = await evaluateReftest(root, tracked, {
    mode: test.mode,
    pageRanges: root.pageRanges,
    chainReferences,
  });
  result.comparisons = evaluation.comparisons.map(compactRecord);
  const blank = nodeIsBlank(root, test.mode, root.pageRanges);
  if (blank) result.blank = true;
  if (evaluation.verdict === "cannot") {
    result.outcome = evaluation.cause.status;
    result.node = "ref";
    result.cause = describeCause(evaluation.cause);
  } else if (evaluation.verdict === "pass" && blank && !isDeclaredBlankReference(evaluation.via)) {
    result.outcome = "pass-blank";
  } else {
    result.outcome = evaluation.verdict;
  }
  const firstPage = comparedPages(root, test.mode, root.pageRanges)[0];
  if (firstPage) result.ink = inkSignature(firstPage);
  let renderMs = 0;
  let rasterMs = 0;
  for (const n of loaded.values()) {
    renderMs += n.renderMs ?? 0;
    rasterMs += n.rasterMs ?? 0;
  }
  result.renderMs = Math.round(renderMs);
  result.rasterMs = Math.round(rasterMs);

  const wantArtifacts =
    artifactsDir &&
    evaluation.comparisons.length > 0 &&
    (artifacts === "all" || (artifacts === "fail" && result.outcome === "fail"));
  if (wantArtifacts) {
    const dir = join(artifactsDir, test.rel);
    if (evaluation.failure) {
      const { record, pagePair } = evaluation.failure;
      const page = record.firstDiffPage ?? 1;
      writeArtifacts({ dir, record, pagePair, page, loaded, keepPdf });
    } else {
      // A pass (or a non-evaluable outcome after some comparison): page 1 of the test and of the
      // first reference it was compared with, so a pass can be audited by eye.
      const record = evaluation.comparisons[0];
      const lhs = loaded.get(record.lhs);
      const rhs = loaded.get(record.rhs);
      const a = lhs && comparedPages(lhs, test.mode, root.pageRanges)[0];
      const b = rhs && comparedPages(rhs, test.mode, root.pageRanges)[0];
      writeArtifacts({ dir, record, pagePair: a && b ? [a, b] : null, page: 1, loaded, keepPdf });
    }
    result.artifacts = `artifacts/${test.rel}`;
  }
  result.durationMs = Math.round(performance.now() - started);
  return result;
}
