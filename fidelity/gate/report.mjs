// Gate report rendering (markdown) from compareSnapshots() output. Pure.

const esc = (v) =>
  String(v ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
const fmt = (v) => (typeof v === "number" ? String(Math.round(v * 1e4) / 1e4) : esc(v));

function table(items, { limit = Number.POSITIVE_INFINITY } = {}) {
  const lines = [
    "| group | key | before | after | tolerance | detail |",
    "|---|---|---|---|---|---|",
  ];
  for (const i of items.slice(0, limit)) {
    lines.push(
      `| ${esc(i.group)} | \`${esc(i.key)}\` | ${fmt(i.before)} | ${fmt(i.after)} | ${i.tol === undefined ? "" : `${i.tol} ${esc(i.tolClass ?? "")}`} | ${esc(i.detail)}${i.acceptedAs ? ` — ACCEPTED: ${esc(i.acceptedAs.reason)} (evidence: ${esc(i.acceptedAs.evidence)})` : ""} |`,
    );
  }
  if (items.length > limit)
    lines.push(`| … | ${items.length - limit} more in gate-report.json | | | | |`);
  return lines;
}

export function renderGateMarkdown(report, { baseline, run, command, date, environment } = {}) {
  const by = (cls) => report.items.filter((i) => i.class === cls);
  const nonWpt = (list) => list.filter((i) => i.check !== "wpt" && i.check !== "crashtest");
  const wpt = (list) => list.filter((i) => i.check === "wpt" || i.check === "crashtest");
  const lines = [
    "# Fidelity gate report",
    "",
    `**Verdict: ${report.verdict}** (${report.counts.gating} gating item(s)). Local macOS runs are INDICATIVE.`,
    "",
    "| field | value |",
    "|---|---|",
    `| date | ${esc(date)} |`,
    `| command | \`${esc(command)}\` |`,
    `| baseline | ${esc(baseline)} |`,
    `| run | ${esc(run)} |`,
    ...(environment
      ? [
          `| os / cpu | ${esc(environment.os)} / ${esc(environment.cpu)} |`,
          `| node / rustc | ${esc(environment.node)} / ${esc(environment.rustc)} |`,
          `| chrome | ${esc(environment.chrome?.version ?? environment.chrome)} |`,
          `| blitz | ${esc(environment.blitz?.version)} ${esc(environment.blitz?.source)} |`,
          `| git | ${esc(environment.git?.branch)} ${esc(environment.git?.head)} (${esc(environment.git?.dirtyEntries)} dirty) |`,
        ]
      : []),
    "",
    `Counts: ${Object.entries(report.counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(", ")}.`,
    "",
  ];
  if (report.refusals.length) {
    lines.push(
      "## Refused (the two sides are not comparable)",
      "",
      ...report.refusals.map((r) => `- ${esc(r)}`),
      "",
    );
  }
  const failures = by("failure");
  lines.push("## Absolute failures of the run (gate, cannot be accepted)", "");
  lines.push(...(failures.length ? table(failures) : ["none"]), "");
  const regressions = report.items.filter((i) => i.gating && i.class !== "failure");
  lines.push("## Regressions beyond tolerance (gate)", "");
  lines.push(
    ...(nonWpt(regressions).length ? table(nonWpt(regressions)) : ["none outside WPT"]),
    "",
  );
  if (wpt(regressions).length) {
    lines.push(
      `### WPT / crashtest regressions (${wpt(regressions).length})`,
      "",
      ...table(wpt(regressions), { limit: 200 }),
      "",
    );
  }
  const accepted = by("accepted");
  lines.push("## Accepted regressions (acceptedRegressions, with evidence)", "");
  lines.push(...(accepted.length ? table(accepted) : ["none"]), "");
  if (report.unusedAcceptances?.length) {
    lines.push(
      "Acceptance entries that matched nothing (stale or mistyped):",
      "",
      ...report.unusedAcceptances.map(
        (e) => `- \`${esc(e.key ?? `${e.keyPrefix}*`)}\`: ${esc(e.reason)}`,
      ),
      "",
    );
  }
  const reported = by("reported");
  lines.push(`## Reported, not gating (${reported.length})`, "");
  lines.push(...(reported.length ? table(reported, { limit: 60 }) : ["none"]), "");
  const improvements = by("improvement");
  lines.push(`## Improvements (${improvements.length})`, "");
  lines.push(
    ...(nonWpt(improvements).length
      ? table(nonWpt(improvements), { limit: 120 })
      : ["none outside WPT"]),
    "",
  );
  if (wpt(improvements).length) {
    lines.push(
      `WPT/crashtest improvements: ${wpt(improvements).length} (listed in gate-report.json).`,
      "",
    );
  }
  for (const cls of ["newly-measured", "added", "removed", "changed", "not-comparable"]) {
    const list = by(cls);
    if (!list.length) continue;
    lines.push(`## ${cls} (${list.length})`, "", ...table(list, { limit: 80 }), "");
  }
  if (report.wptPerSuite) {
    lines.push(
      "## WPT per directory (pass / clean pass)",
      "",
      "| directory | pass before | pass after | clean before | clean after |",
      "|---|---|---|---|---|",
      ...Object.entries(report.wptPerSuite)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(
          ([s, r]) =>
            `| ${esc(s)} | ${r.passBefore} | ${r.passAfter} | ${r.cleanBefore} | ${r.cleanAfter} |`,
        ),
      "",
    );
  }
  lines.push(
    "## Per group",
    "",
    "| group | classes |",
    "|---|---|",
    ...Object.entries(report.byGroup)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(
        ([g, c]) =>
          `| ${esc(g)} | ${Object.entries(c)
            .map(([k, v]) => `${k} ${v}`)
            .join(", ")} |`,
      ),
    "",
    "## Tolerances",
    "",
    "| class | tolerance | label | rationale |",
    "|---|---|---|---|",
    ...Object.entries(report.tolerances).map(
      ([k, t]) => `| ${k} | ${t.tol} ${t.unit} | ${esc(t.label)} | ${esc(t.why)} |`,
    ),
    "",
  );
  return `${lines.join("\n")}\n`;
}
