// Real data, schema-2 dumps (raw Blitz text + pagination trace) at Blitz 0.3.0-beta.4, captured
// by `run.mjs --label s1b` on 2026-10-21 (Chrome 155.0.8059.85, macOS arm64; INDICATIVE):
//   notification-beta4.*        the notification fixture (dump, source dump, Chrome snapshot)
//   pseudo-anon-probe-beta4.*   test/data/pseudo-anon-probe.html (Chrome side: the pin-era snapshot
//                               pseudo-anon-probe.chrome.json.gz, which does not depend on vellora)
// The pagination layer must reproduce, from the committed tool, the Phase A mechanism of the
// notification's bottom text (fidelity/baselines/beta4/pagination-probe/notification.md, a
// scratch eprintln! probe): the signature's first line gets the previous paragraph's 14.667 px
// margin-bottom as its gap where the flow has 43 px, so pagination lifts it 34.667 px.
import assert from "node:assert/strict";
import { test } from "node:test";
import { diffLayouts } from "../lib/match.mjs";
import { renderMarkdown } from "../lib/report.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { loadGz } from "./helpers.mjs";

const B = "html>body:nth-child(2)";

function notification() {
  const chrome = loadGz("notification-beta4.chrome.json.gz");
  const dump = loadGz("notification-beta4.dump.json.gz");
  const sourceDump = loadGz("notification-beta4.dump-source.json.gz");
  const result = diffLayouts({
    chrome: chrome.records,
    vellora: velloraModel(dump, { sourceDump }),
    baselines: new Map(Object.entries(chrome.baselines)),
  });
  return { dump, result };
}

test("notification @ beta.4: the dump is schema 2 with raw text in N0/B0 and a P layer", () => {
  const { dump, result } = notification();
  assert.equal(dump.schema, "vellora-layout-dump/2");
  assert.deepEqual(
    result.layers.map((l) => `${l.name}:${l.has_text}`),
    [
      "N0:true",
      "B0:true",
      "L0:true",
      "vertical_margin_collapse:true",
      "collapsed_table_medium_border_insets:true",
      "painted_table_cell_text_baselines:true",
      "fixed_table_widths:true",
      "table_percent_widths:true",
      "auto_table_compact_columns:true",
      "collapsed_table_medium_border_insets_x:true",
      "P:true",
    ],
  );
  // The headline keeps its pre-pagination meaning (same first box as the schema-1 runs).
  assert.equal(result.final_layer, "collapsed_table_medium_border_insets_x");
  assert.equal(
    result.headline.box.path,
    `${B}>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)`,
  );
  assert.equal(result.headline.box.first_over_tolerance, "N0");
  // Every L0 run has a raw Blitz counterpart, and vellora's reader moves none of them here.
  for (const t of result.text_events) assert.notEqual(t.per_layer.B0.status, "n/a", t.text);
  assert.equal(result.regressions_by_layer.L0.text_events_vs_previous_layer, 0);
});

test("notification @ beta.4: P reproduces the signature gap mechanism (−34.67 px)", () => {
  const { result } = notification();
  const sig = result.pagination.placements.find(
    (p) => p.path === `${B}>div:nth-child(6)>p:nth-child(1)`,
  );
  assert.equal(sig.pending_gap_source, "margin-bottom");
  assert.ok(Math.abs(sig.gap_applied - 14.6667) < 0.01, `${sig.gap_applied}`);
  assert.equal(sig.flow_gap, 43);
  assert.ok(Math.abs(sig.drift + 34.6667) < 0.01, `${sig.drift}`);
  // The text run pagination moves furthest is attributed to P, on top of a pre-pagination Δ.
  const att = result.text_events.find((t) => t.text.startsWith("Atenciosamente"));
  const pre = att.per_layer[result.final_layer].dy;
  assert.ok(Math.abs(att.per_layer.P.dy - (pre - 34.6667)) < 0.01);
  assert.ok(att.regressed_by.some((w) => w.layer === "P" && w.coord === "dy"));
  assert.ok(result.regressions_by_layer.P.text_events_vs_previous_layer > 0);
  const md = renderMarkdown({
    fixture: "notification",
    label: "beta4",
    env: {},
    parity: [],
    result,
  });
  assert.match(
    md,
    /\| 14 \| 1 \| block \| body>div:nth-child\(6\)>p:nth-child\(1\) \| 853–875 \| 43 \|/,
  );
});

test("pseudo/anon probe @ beta.4: ::before generated text is raw Blitz text the walk never reads", () => {
  const chrome = loadGz("pseudo-anon-probe.chrome.json.gz");
  const dump = loadGz("pseudo-anon-probe-beta4.dump.json.gz");
  const sourceDump = loadGz("pseudo-anon-probe-beta4.dump-source.json.gz");
  const result = diffLayouts({
    chrome: chrome.records,
    vellora: velloraModel(dump, { sourceDump }),
    baselines: new Map(Object.entries(chrome.baselines)),
  });
  for (const layer of ["N0", "B0"]) {
    const unread = result.blitz_text_unread_by_walk[layer];
    assert.ok(
      unread.sample.some((r) => r.text === "Before block" && r.inline_root.endsWith("::before")),
      `${layer}: ${JSON.stringify(unread)}`,
    );
  }
  // In the source dump Blitz's anonymous blocks own the inline runs; they still align with the
  // L0 runs of html_normalize's wrappers (same owner key), so they are NOT reported as unread.
  assert.ok(!result.blitz_text_unread_by_walk.N0.sample.some((r) => r.text.includes("Leading")));
  const lead = result.text_events.find((t) => t.text.startsWith("Leading inline text"));
  assert.notEqual(lead.per_layer.N0.status, "n/a");
});
