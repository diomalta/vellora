#!/usr/bin/env node
// Annotate the output of the SCRATCH pagination probe (probe_pagination.py: two eprintln! calls
// added to a throw-away copy of crates/vellora-core/src/pagination.rs; never committed, never in
// a shipped build) with DOM paths, and compare two builds fragment by fragment.
//
//   node fidelity/baselines/beta4/pagination-probe/annotate.mjs --fixture notification \
//     --a pin=<stderr.txt>,<dump.json> --b beta4=<stderr.txt>,<dump.json> --out <prefix>
//
// <stderr.txt> is the probe's stderr of `layout_dump --html <native.html> --out <dump.json>
// --pdf <x.pdf>` (the --pdf render runs pagination); <dump.json> is that same invocation's dump,
// whose `nodes[].id/path` map the probe's node ids to source-DOM paths (wrappers transparent).
// Writes <prefix>.json and <prefix>.md. Offsets are pagination's placement minus Blitz's flow
// position (CSS px): what pagination/emit adds after the last layout layer.
import { readFileSync, writeFileSync } from "node:fs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

const num = (s) => Number.parseFloat(s);
const r3 = (v) => Math.round(v * 1000) / 1000;

function load(spec) {
  const [label, files] = spec.split("=");
  const [stderrPath, dumpPath] = files.split(",");
  const dump = JSON.parse(readFileSync(dumpPath, "utf8"));
  const pathOf = new Map(dump.nodes.map((n) => [String(n.id), n.path]));
  const frags = [];
  const places = [];
  for (const line of readFileSync(stderrPath, "utf8").split("\n")) {
    let m =
      /^PROBE frag (\d+) tag=(\S+) node=Some\((\d+)\) top=(\S+) bottom=(\S+) trailing_gap=(\S+) root_mt=(\S+) root_mb=(\S+) members=(\d+) row=(\w+) thead=(\w+)/.exec(
        line,
      );
    if (m) {
      frags.push({
        index: Number(m[1]),
        path: (pathOf.get(m[3]) ?? `node ${m[3]}`).replace("html>body:nth-child(2)>", "body>"),
        top: num(m[4]),
        bottom: num(m[5]),
        trailing_gap: num(m[6]),
        root_margin_top: num(m[7]),
        root_margin_bottom: num(m[8]),
      });
      continue;
    }
    m =
      /^PROBE place page=(\d+) top=(\S+) bottom=(\S+) cursor_before=(\S+) gap=(\S+) placed_at=(\S+) node=Some\((\d+)\)/.exec(
        line,
      );
    if (m) {
      places.push({
        page: Number(m[1]),
        top: num(m[2]),
        bottom: num(m[3]),
        cursor_before: num(m[4]),
        gap_used: num(m[5]),
        placed_at: num(m[6]),
        path: (pathOf.get(m[7]) ?? `node ${m[7]}`).replace("html>body:nth-child(2)>", "body>"),
      });
    }
  }
  // One row per placed fragment, in placement order (thead fragments are not placed standalone,
  // so rows are NOT index-aligned with `frags`).
  const rows = places.map((p, i) => {
    const prev = places[i - 1];
    const sameFlowPage = prev && prev.page === p.page;
    return {
      ...p,
      flow_gap: sameFlowPage ? r3(p.top - prev.bottom) : null,
      offset_vs_flow: p.page === 0 ? r3(p.placed_at - p.top) : null,
    };
  });
  return { label, stderrPath, dumpPath, frags, rows, vellora_core: dump.vellora_core };
}

function main() {
  const fixture = arg("--fixture");
  const a = load(arg("--a"));
  const b = load(arg("--b"));
  const out = arg("--out");
  const n = Math.max(a.rows.length, b.rows.length);
  const table = [];
  for (let i = 0; i < n; i++) {
    const ra = a.rows[i];
    const rb = b.rows[i];
    table.push({
      index: i,
      path_a: ra?.path,
      path_b: rb?.path,
      same_path: ra?.path === rb?.path,
      a: ra && {
        page: ra.page,
        flow_top: ra.top,
        flow_gap: ra.flow_gap,
        gap_used: ra.gap_used,
        placed_at: ra.placed_at,
        offset_vs_flow: ra.offset_vs_flow,
      },
      b: rb && {
        page: rb.page,
        flow_top: rb.top,
        flow_gap: rb.flow_gap,
        gap_used: rb.gap_used,
        placed_at: rb.placed_at,
        offset_vs_flow: rb.offset_vs_flow,
      },
      delta_offset_b_minus_a:
        ra?.offset_vs_flow != null && rb?.offset_vs_flow != null
          ? r3(rb.offset_vs_flow - ra.offset_vs_flow)
          : null,
    });
  }
  const report = {
    schema: "vellora-fidelity/pagination-probe/1",
    fixture,
    note: "SCRATCH instrumentation (eprintln! in a throw-away copy of pagination.rs), never committed to crates/. CSS px. offset_vs_flow = placed_at - Blitz flow top (page 1 only); gap_used = pagination's inter-fragment gap (previous fragment's trailing_gap, zeroed at page tops); flow_gap = this fragment's flow top - previous fragment's flow bottom.",
    a: { label: a.label, fragments: a.frags },
    b: { label: b.label, fragments: b.frags },
    rows: table,
  };
  writeFileSync(`${out}.json`, `${JSON.stringify(report, null, 2)}\n`);
  const md = [
    `# Pagination probe: ${fixture} (${a.label} vs ${b.label})`,
    "",
    `> ${report.note}`,
    "",
    `| # | fragment root (${a.label}) | ${a.label} flow gap | ${a.label} gap used | ${a.label} offset | ${b.label} flow gap | ${b.label} gap used | ${b.label} offset | Δ offset |`,
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...table.map(
      (r) =>
        `| ${r.index} | ${r.path_a}${r.same_path ? "" : ` / ${r.path_b}`} | ${r.a?.flow_gap ?? ""} | ${r.a?.gap_used ?? ""} | ${r.a?.offset_vs_flow ?? ""} | ${r.b?.flow_gap ?? ""} | ${r.b?.gap_used ?? ""} | ${r.b?.offset_vs_flow ?? ""} | ${r.delta_offset_b_minus_a ?? ""} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(`${out}.md`, md);
  process.stdout.write(`${out}.json\n${out}.md\n`);
}

main();
