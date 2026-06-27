/**
 * Statistics + environment capture.
 *
 * - median AND p95 of the WARM samples. We NEVER headline best-of-N (the min)
 *   — best-of-N hides tail latency and is the classic way to lie with
 *   benchmarks. The min is retained only as a labeled, non-headline field.
 * - environment metadata so a number is interpretable without external context
 *   (CPU, cores, RAM, OS/kernel, container-vs-native, tool versions, run date).
 */
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";

/** @param {number[]} xs @param {number} p in [0,1] */
function percentile(xs, p) {
  if (xs.length === 0) return null;
  const sorted = [...xs].sort((a, b) => a - b);
  // Nearest-rank.
  const rank = Math.ceil(p * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}

/**
 * Summarize warm samples. Headline fields are median + p95; min is included but
 * explicitly labeled as NOT a headline.
 * @param {number[]} samplesMs
 */
export function summarize(samplesMs) {
  if (!samplesMs || samplesMs.length === 0) {
    return { count: 0, medianMs: null, p95Ms: null, minMs: null, maxMs: null };
  }
  return {
    count: samplesMs.length,
    medianMs: percentile(samplesMs, 0.5),
    p95Ms: percentile(samplesMs, 0.95),
    // Non-headline; retained for completeness only. Reporter must not present
    // this as the result.
    minMs_notHeadline: percentile(samplesMs, 0.0),
    maxMs: percentile(samplesMs, 1.0),
  };
}

/**
 * Detect whether we are running inside a container (best-effort).
 * @returns {boolean}
 */
function inContainer() {
  if (process.env.BENCH_IN_CONTAINER) return process.env.BENCH_IN_CONTAINER === "1";
  if (existsSync("/.dockerenv")) return true;
  try {
    return /docker|containerd|kubepods/.test(readFileSync("/proc/1/cgroup", "utf-8"));
  } catch {
    return false;
  }
}

/**
 * Capture the measured environment. The presence of `container: false` on a
 * macOS host is what flags a run as indicative-only (see report.mjs).
 * @param {{ id: string, label: string, pinnedVersion: string }[]} tools
 * @param {Record<string, { version?: string }>} runtimeVersions per-tool versions reported by adapters
 */
export function captureEnv(tools, runtimeVersions = {}) {
  const cpus = os.cpus();
  const container = inContainer();
  const platform = os.platform();
  const forcedAuthoritative = process.env.BENCH_AUTHORITATIVE === "1";
  const authoritative = forcedAuthoritative
    ? platform === "linux"
    : container && platform === "linux";
  return {
    runDate: new Date().toISOString(),
    cpuModel: cpus[0]?.model ?? "unknown",
    cores: cpus.length,
    totalRamBytes: os.totalmem(),
    os: `${platform} ${os.release()}`,
    arch: os.arch(),
    container,
    authoritative,
    authority: forcedAuthoritative
      ? "pinned-linux-ci"
      : container && platform === "linux"
        ? "linux-container"
        : "local-indicative",
    indicativeOnly: !authoritative,
    nodeVersion: process.version,
    toolVersions: tools.map((t) => ({
      id: t.id,
      label: t.label,
      pinnedVersion: t.pinnedVersion,
      // Version actually loaded at runtime (drift detection); null until the
      // adapter ran successfully.
      runtimeVersion: runtimeVersions[t.id]?.version ?? null,
    })),
  };
}
