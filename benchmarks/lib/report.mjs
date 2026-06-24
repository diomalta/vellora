/**
 * Reporting.
 *
 * Emits:
 *   1. A machine-readable results JSON (benchmarks/results/*.json).
 *   2. A human-readable table that includes EVERY measured axis for EVERY tool
 *      and EXPLICITLY FLAGS every axis where vellora is NOT the winner. Axes are
 *      never filtered to hide a vellora loss — disclosing losses is what
 *      makes the wins believable.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const fmtBytes = (b) =>
  b == null ? "—" : b >= 1e6 ? `${(b / 1e6).toFixed(2)} MB` : `${(b / 1e3).toFixed(1)} kB`;
const fmtMs = (ms) => (ms == null ? "—" : `${ms.toFixed(2)} ms`);
const fmtThr = (t) => (t == null ? "—" : `${t.toFixed(1)}/s`);

/**
 * Axis definitions: how to pull a comparable value from a tool record, and
 * which direction "better" is, so the reporter can flag vellora's non-wins.
 */
const AXES = [
  {
    key: "imageSize",
    label: "Docker image",
    lowerBetter: true,
    get: (r) => r.imageSize?.bytes,
    fmt: fmtBytes,
    na: (r) => r.imageSize?.na,
  },
  {
    key: "coldStart",
    label: "Cold start",
    lowerBetter: true,
    get: (r) => r.coldStartMs,
    fmt: fmtMs,
    na: () => false,
  },
  {
    key: "rss",
    label: "RSS @N",
    lowerBetter: true,
    get: (r) => r.rss?.peakRssBytes,
    fmt: fmtBytes,
    na: (r) => r.rss?.na,
  },
  {
    key: "outputSize",
    label: "PDF size",
    lowerBetter: true,
    get: (r) => r.outputSizeBytes,
    fmt: fmtBytes,
    na: () => false,
  },
  {
    key: "warmMedian",
    label: "Warm median",
    lowerBetter: true,
    get: (r) => r.warm?.medianMs,
    fmt: fmtMs,
    na: () => false,
  },
  {
    key: "warmP95",
    label: "Warm p95",
    lowerBetter: true,
    get: (r) => r.warm?.p95Ms,
    fmt: fmtMs,
    na: () => false,
  },
  {
    key: "throughput",
    label: "Throughput",
    lowerBetter: false,
    get: (r) => r.throughputPerSec,
    fmt: fmtThr,
    na: () => false,
  },
];

/**
 * Determine, per axis, whether vellora is the winner among COMPARABLE tools.
 * Returns a map axisKey -> { velloraWins: boolean|null, winnerId }.
 * null means "cannot judge" (vellora pending, or axis N/A for vellora).
 */
function judgeAxes(records) {
  const vellora = records.find((r) => r.isSubject);
  const result = {};
  for (const axis of AXES) {
    const candidates = records.filter((r) => r.comparable && !axis.na(r) && axis.get(r) != null);
    if (candidates.length === 0) {
      result[axis.key] = { velloraWins: null, winnerId: null };
      continue;
    }
    const best = candidates.reduce((a, b) =>
      axis.lowerBetter ? (axis.get(a) <= axis.get(b) ? a : b) : axis.get(a) >= axis.get(b) ? a : b,
    );
    const velloraComparable = vellora?.comparable && !axis.na(vellora) && axis.get(vellora) != null;
    result[axis.key] = {
      winnerId: best.id,
      velloraWins: velloraComparable ? best.id === "vellora" : null,
    };
  }
  return result;
}

/**
 * @param {object} report the full report object (env, externalReference, records[])
 * @param {string} outDir
 * @returns {{ jsonPath: string, table: string }}
 */
export function emit(report, outDir) {
  mkdirSync(outDir, { recursive: true });
  const stamp = report.env.runDate.replace(/[:.]/g, "-");
  const jsonPath = join(outDir, `results-${stamp}.json`);
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  // Stable "latest" pointer for the README link / CI diff.
  const latestPath = join(outDir, "latest.json");
  writeFileSync(latestPath, `${JSON.stringify(report, null, 2)}\n`);

  const table = renderTable(report);
  writeFileSync(join(outDir, "latest.md"), `${table}\n`);
  return { jsonPath, latestPath, table };
}

/** @param {object} report */
export function renderTable(report) {
  const { env, records, externalReference } = report;
  const judged = judgeAxes(records);
  const lines = [];

  lines.push("# vellora benchmark results");
  lines.push("");
  if (env.indicativeOnly) {
    lines.push(
      "> INDICATIVE ONLY — this run was NOT produced in a pinned Linux container. " +
        "Authoritative numbers come from CI on the pinned Linux runner (see README).",
    );
  } else {
    lines.push("> AUTHORITATIVE — produced in a pinned Linux container.");
  }
  lines.push("");
  lines.push(
    `Env: ${env.cpuModel} (${env.cores} cores), ${fmtBytes(env.totalRamBytes)} RAM, ` +
      `${env.os} ${env.arch}, ${env.container ? "container" : "native"}, Node ${env.nodeVersion}. ` +
      `Run ${env.runDate}.`,
  );
  lines.push("");

  // Header
  const head = ["Tool", "Version", "Mode", "Comparable", ...AXES.map((a) => a.label)];
  lines.push(`| ${head.join(" | ")} |`);
  lines.push(`| ${head.map(() => "---").join(" | ")} |`);

  for (const r of records) {
    const cells = [
      r.label,
      r.version ?? r.pinnedVersion ?? "—",
      r.mode ?? "—",
      r.comparable ? "yes" : `NO (${r.notComparableReason ?? r.error ?? "pending"})`,
    ];
    for (const axis of AXES) {
      if (axis.na(r)) {
        cells.push("N/A");
        continue;
      }
      const v = axis.get(r);
      let cell = axis.fmt(v);
      // Flag every axis where vellora is NOT the winner (only on vellora's row).
      if (r.isSubject) {
        const j = judged[axis.key];
        if (j?.velloraWins === false) cell += ` ⚠ (loses to ${j.winnerId})`;
        else if (j?.velloraWins === true) cell += " ✓";
      }
      cells.push(cell);
    }
    lines.push(`| ${cells.join(" | ")} |`);
  }

  lines.push("");
  lines.push("## Axes where vellora is NOT the winner");
  const losses = AXES.filter((a) => judged[a.key]?.velloraWins === false);
  if (losses.length === 0) {
    lines.push("- (none yet — or vellora not yet measured; see Comparable column)");
  } else {
    for (const a of losses) {
      lines.push(`- ${a.label}: winner is ${judged[a.key].winnerId}`);
    }
  }

  lines.push("");
  lines.push("## External reference (UNVERIFIED)");
  lines.push(
    `- ${externalReference.source}: "${externalReference.claim}" — ${externalReference.status}. ` +
      `Compared only against ${externalReference.comparedAgainst}; never quoted as fact.`,
  );

  return lines.join("\n");
}
