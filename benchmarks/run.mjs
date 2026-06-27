/**
 * Benchmark suite — single end-to-end entry point. Reproduce with:
 * `node benchmarks/run.mjs`
 *
 * Per tool: create the long-lived handle, then verify output equivalence
 * BEFORE recording any timing — non-equivalent tools are flagged not-comparable
 * and skipped from the head-to-head. Comparable tools are measured across the
 * five axes; warm stats are median + p95, never best-of-N; the report
 * flags every axis where vellora is not the winner.
 *
 * Tools whose adapter is not yet available (ADAPTER_PENDING) are recorded as
 * pending with the reason, NOT fabricated.
 */
import { readFile } from "node:fs/promises";
import { baseline, externalReference, repoRoot, results, run, tools } from "./config.mjs";
import { verify } from "./lib/equivalence.mjs";
import {
  measureColdStart,
  measureExternalRssUnderLoad,
  measureExternalRuntime,
  measureImageSize,
  measureOutputSize,
  measurePackageFootprint,
  measureRssUnderLoad,
  measureWarm,
} from "./lib/measure.mjs";
import { emit } from "./lib/report.mjs";
import { captureEnv, summarize } from "./lib/stats.mjs";

async function loadBaseline() {
  const html = await readFile(baseline.htmlPath, "utf-8");
  const data = JSON.parse(await readFile(baseline.dataPath, "utf-8"));
  return { html, data };
}

async function benchTool(tool, html, data, referencePages) {
  const record = {
    id: tool.id,
    label: tool.label,
    kind: tool.kind,
    isSubject: Boolean(tool.isSubject),
    pinnedVersion: tool.pinnedVersion,
    declaredMode: tool.longLivedMode,
    comparable: false,
  };
  record.packageFootprint = await measurePackageFootprint(tool, repoRoot);

  let handle;
  try {
    const adapter = await import(tool.adapter);
    handle = await adapter.create({ endpoint: tool.endpoint, image: tool.image });
  } catch (err) {
    // ADAPTER_PENDING (explicit) OR a missing npm package both mean "tool not
    // installed yet" — record as pending, never fabricate a number.
    if (err?.code === "ADAPTER_PENDING" || err?.code === "ERR_MODULE_NOT_FOUND") {
      record.pending = true;
      record.error = err.message;
      record.notComparableReason = "adapter pending (tool not installed / render path not landed)";
      return record;
    }
    record.error = `adapter create failed: ${err?.message ?? err}`;
    record.notComparableReason = record.error;
    return record;
  }

  try {
    record.version = handle.version;
    record.mode = handle.mode;
    record.externalRuntime = await measureExternalRuntime(handle, tool);

    const cold = await measureColdStart(handle, html, data);
    record.coldStartMs = cold.ms;

    // Equivalence BEFORE any further timing.
    const eq = verify(cold.pdf, { ...baseline, referencePages });
    record.pages = eq.pages;
    record.contentStatus = eq.contentStatus;
    if (!eq.comparable) {
      record.comparable = false;
      record.notComparableReason = eq.reason;
      return record; // excluded from head-to-head; no warm timing recorded
    }
    record.comparable = true;

    record.outputSizeBytes = measureOutputSize(cold.pdf).bytes;
    record.imageSize = await measureImageSize(tool);

    const warm = await measureWarm(handle, html, data, run.warmRuns, run.warmupRuns);
    record.warm = summarize(warm.samplesMs);
    record.throughputPerSec = warm.throughputPerSec;

    record.rss = await measureRssUnderLoad(handle, html, data, run.concurrency, tool);
    record.externalRss = await measureExternalRssUnderLoad(
      handle,
      html,
      data,
      run.concurrency,
      tool,
    );

    return record;
  } catch (err) {
    record.error = `benchmark failed: ${err?.message ?? err}`;
    record.notComparableReason = record.error;
    record.comparable = false;
    return record;
  } finally {
    try {
      await handle.close();
    } catch {
      /* ignore teardown errors */
    }
  }
}

async function main() {
  const { html, data } = await loadBaseline();

  // The reference page count comes from the subject (vellora) when available,
  // so every other tool is held to vellora's exact page count. If vellora
  // is pending, equivalence falls back to baseline.minPages.
  let referencePages = null;

  const records = [];
  // Run vellora first so its page count can anchor equivalence for the rest.
  const ordered = [...tools].sort((a, b) => (b.isSubject ? 1 : 0) - (a.isSubject ? 1 : 0));
  for (const tool of ordered) {
    const rec = await benchTool(tool, html, data, referencePages);
    if (tool.isSubject && rec.comparable && rec.pages > 0) referencePages = rec.pages;
    records.push(rec);
  }

  const runtimeVersions = Object.fromEntries(records.map((r) => [r.id, { version: r.version }]));
  const env = captureEnv(tools, runtimeVersions);

  const report = {
    schemaVersion: 1,
    suite: "vellora-html-pdf-benchmark",
    baseline: { name: baseline.name, fixture: "fixtures/invoice", referencePages },
    config: { concurrency: run.concurrency, warmRuns: run.warmRuns, warmupRuns: run.warmupRuns },
    env,
    externalReference,
    records,
  };

  const { jsonPath, table } = emit(report, results.dir);
  process.stdout.write(`${table}\n\n`);
  process.stdout.write(`Machine-readable results: ${jsonPath}\n`);

  if (env.indicativeOnly) {
    process.stdout.write(
      "\nNOTE: indicative-only run (not the pinned Linux CI environment). " +
        "Authoritative numbers come from CI.\n",
    );
  }
}

main().catch((err) => {
  process.stderr.write(`benchmark run failed: ${err?.stack ?? err}\n`);
  process.exitCode = 1;
});
