/**
 * The five claim-backing axes (spec: "Measure the five claim-backing axes").
 *
 *   1. Docker image size  — N/A (with a reason) for in-process libraries.
 *   2. Cold start         — the FIRST render after a fresh process/browser.
 *   3. RSS under N         — resident memory while N renders run concurrently.
 *   4. PDF output size     — bytes of the equivalent render.
 *   5. Throughput          — documents/second over the warm run set.
 *
 * Each function returns either a measured value or an explicit
 * { value: null, na: true, reason } so a missing axis is recorded, never
 * zeroed or fabricated (spec: "A missing axis is recorded, not silently
 * omitted").
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

/**
 * Axis 1 — Docker image size.
 * For in-process libraries (vellora, WeasyPrint-in-worker) there is no image to
 * size, so we return N/A with the reason. For containerized tools we read the
 * pinned image's size via `docker image inspect` when Docker is available.
 * @param {{ kind: string, image?: string }} tool
 * @returns {Promise<{ bytes: number|null, na: boolean, reason?: string, image?: string }>}
 */
export async function measureImageSize(tool) {
  if (tool.kind !== "http-service" || !tool.image) {
    return {
      bytes: null,
      na: true,
      reason: `${tool.id} runs in-process / in this Node runtime — no standalone container image to size`,
    };
  }
  try {
    const { stdout } = await execFileP("docker", [
      "image",
      "inspect",
      tool.image,
      "--format",
      "{{.Size}}",
    ]);
    const bytes = Number(stdout.trim());
    if (!Number.isFinite(bytes)) throw new Error(`unexpected size output: ${stdout}`);
    return { bytes, na: false, image: tool.image };
  } catch (err) {
    return {
      bytes: null,
      na: true,
      reason:
        `image size not measured (docker unavailable or image not pulled): ${err?.message ?? err}. ` +
        `TODO(CI): pull ${tool.image} and re-measure on the pinned Linux runner.`,
      image: tool.image,
    };
  }
}

/**
 * Axis 2 — Cold start. Times the FIRST render after the handle was created
 * (process/browser freshly started). Reported separately from warm samples.
 * @param {{ render: (html: string, data: unknown) => Promise<Uint8Array> }} handle
 * @param {string} html @param {unknown} data
 * @returns {Promise<{ ms: number, pdf: Uint8Array }>}
 */
export async function measureColdStart(handle, html, data) {
  const t0 = performance.now();
  const pdf = await handle.render(html, data);
  const ms = performance.now() - t0;
  return { ms, pdf };
}

/**
 * Axis 3 — RSS under concurrency N. Fires N renders concurrently and samples
 * peak process RSS during the burst. For out-of-process tools (Gotenberg) the
 * memory lives in the service container, not this process — recorded as N/A
 * with a reason (the container's RSS is measured separately in CI).
 * @param {{ render: Function }} handle
 * @param {string} html @param {unknown} data
 * @param {number} concurrency
 * @param {{ kind: string, id: string }} tool
 * @returns {Promise<{ peakRssBytes: number|null, na: boolean, reason?: string, concurrency: number }>}
 */
export async function measureRssUnderLoad(handle, html, data, concurrency, tool) {
  if (tool.kind === "http-service") {
    // Drive the load so the comparison is fair, but the RSS that matters lives
    // in the service, not this client process.
    await Promise.all(Array.from({ length: concurrency }, () => handle.render(html, data)));
    return {
      peakRssBytes: null,
      na: true,
      concurrency,
      reason: `${tool.id} memory lives in the service container, not this process. TODO(CI): sample container RSS (e.g. docker stats) during the concurrent burst.`,
    };
  }

  let peak = process.memoryUsage().rss;
  let sampling = true;
  const sampler = (async () => {
    while (sampling) {
      const rss = process.memoryUsage().rss;
      if (rss > peak) peak = rss;
      await new Promise((r) => setTimeout(r, 5));
    }
  })();

  await Promise.all(Array.from({ length: concurrency }, () => handle.render(html, data)));
  sampling = false;
  await sampler;

  return { peakRssBytes: peak, na: false, concurrency };
}

/**
 * Axis 4 — PDF output size of the equivalent render.
 * @param {Uint8Array} pdf @returns {{ bytes: number }}
 */
export function measureOutputSize(pdf) {
  return { bytes: pdf.length };
}

/**
 * Axis 5 — Throughput (documents/second) over the warm run set. Computed from
 * the warm sample durations: total docs / total wall time of the sampled set.
 * Returned alongside the raw per-render durations so stats.mjs can compute
 * median/p95 latency from the same samples.
 * @param {{ render: Function }} handle
 * @param {string} html @param {unknown} data
 * @param {number} warmRuns @param {number} warmupRuns
 * @returns {Promise<{ samplesMs: number[], throughputPerSec: number, totalMs: number }>}
 */
export async function measureWarm(handle, html, data, warmRuns, warmupRuns) {
  // Discard warm-up renders (JIT/cache settle) — not sampled.
  for (let i = 0; i < warmupRuns; i++) await handle.render(html, data);

  const samplesMs = [];
  const tStart = performance.now();
  for (let i = 0; i < warmRuns; i++) {
    const t0 = performance.now();
    await handle.render(html, data);
    samplesMs.push(performance.now() - t0);
  }
  const totalMs = performance.now() - tStart;
  const throughputPerSec = totalMs > 0 ? (warmRuns / totalMs) * 1000 : 0;
  return { samplesMs, throughputPerSec, totalMs };
}
