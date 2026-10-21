// Run one reftest with a given node loader and produce the per-test result record.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { diffImage, encodePng } from "./pixels.mjs";
import { evaluateReftest, nodeIsBlank } from "./refgraph.mjs";

function relOf(url) {
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

/**
 * Evaluate `test` ({ rel, url, mode }) and return its result record. When `artifactsDir` is set
 * and the test fails (or `artifacts === "all"`), the first differing page pair and a diff image
 * are written under artifactsDir/<rel>/ (PDFs too when `keepPdf`).
 */
export async function runReftest({
  test,
  loadNode,
  artifactsDir,
  artifacts = "fail",
  keepPdf = false,
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
  });
  result.comparisons = evaluation.comparisons.map(compactRecord);
  if (evaluation.verdict === "cannot") {
    result.outcome = evaluation.cause.status;
    result.node = "ref";
    result.cause = describeCause(evaluation.cause);
  } else {
    result.outcome = evaluation.verdict;
  }
  if (nodeIsBlank(root, test.mode, root.pageRanges)) result.blank = true;
  let renderMs = 0;
  let rasterMs = 0;
  for (const n of loaded.values()) {
    renderMs += n.renderMs ?? 0;
    rasterMs += n.rasterMs ?? 0;
  }
  result.renderMs = Math.round(renderMs);
  result.rasterMs = Math.round(rasterMs);

  const wantArtifacts =
    artifactsDir && (artifacts === "all" || (artifacts === "fail" && result.outcome === "fail"));
  if (wantArtifacts && evaluation.failure) {
    const dir = join(artifactsDir, test.rel);
    mkdirSync(dir, { recursive: true });
    const { record, pagePair } = evaluation.failure;
    const page = record.firstDiffPage ?? 1;
    if (pagePair) {
      writeFileSync(join(dir, `lhs-p${page}.png`), encodePng(pagePair[0]));
      writeFileSync(join(dir, `rhs-p${page}.png`), encodePng(pagePair[1]));
      if (pagePair[0].width === pagePair[1].width && pagePair[0].height === pagePair[1].height) {
        writeFileSync(
          join(dir, `diff-p${page}.png`),
          encodePng(diffImage(pagePair[0], pagePair[1])),
        );
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
    result.artifacts = `artifacts/${test.rel}`;
  }
  result.durationMs = Math.round(performance.now() - started);
  return result;
}
