#!/usr/bin/env node
// Compare two layout-diff runs of the SAME HTML with different vellora builds (e.g. the Blitz pin
// vs a Blitz bump) and attribute every change to the first layer where it appears:
//   change already in B0  => the bump changed raw Blitz layout
//   B0/L0 unchanged, a pass output changed => a vellora post-layout pass reacts differently
//   all pre-pagination layers unchanged but the PDF moved => pagination / PDF emit
//
//   node fidelity/layout-diff/compare.mjs --a pin --b beta4 [--fixtures ...] [--out <dir>]
//     [--tolerance 0.5]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { FIXTURE_IDS, repoRoot } from "./lib/fixture-html.mjs";
import { shortPath } from "./lib/report.mjs";
import { normText } from "./lib/vellora-model.mjs";

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : fallback;
}

const r2 = (v) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : null);
const maxAbs = (...v) => Math.max(0, ...v.filter(Number.isFinite).map(Math.abs));
const PX_TO_PT = 0.75;

function table(headers, rows) {
  if (!rows.length) return "_none_\n";
  const esc = (c) => String(c ?? "").replaceAll("|", "\\|");
  return `${[`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((r) => `| ${r.map(esc).join(" | ")} |`)].join("\n")}\n`;
}

/** First layer (chain order) where b's delta differs from a's by more than tol. */
function firstChange(chain, aLayers, bLayers, keys, tol) {
  for (const layer of chain) {
    const a = aLayers[layer];
    const b = bLayers[layer];
    if (!a || !b) continue;
    if (!keys.every((k) => Number.isFinite(a[k]) && Number.isFinite(b[k]))) continue;
    if (maxAbs(...keys.map((k) => b[k] - a[k])) > tol) return layer;
  }
  return null;
}

export function compareRuns(a, b, { tolerance = 0.5 } = {}) {
  const chain = a.layers.map((l) => l.name);
  const finalName = a.final_layer;
  const chromeMismatch = [];
  const boxChanges = [];
  const bBoxes = new Map(b.boxes.map((x) => [x.path, x]));
  for (const box of a.boxes) {
    const other = bBoxes.get(box.path);
    if (!other) continue;
    if (
      maxAbs(
        box.chrome.x - other.chrome.x,
        box.chrome.y - other.chrome.y,
        box.chrome.w - other.chrome.w,
        box.chrome.h - other.chrome.h,
      ) > 0.01
    ) {
      chromeMismatch.push(box.path);
    }
    const fa = box.layers[finalName];
    const fb = other.layers[finalName];
    if (!fa || !fb) continue;
    const delta = {
      dx: r2(fb.dx - fa.dx),
      dy: r2(fb.dy - fa.dy),
      dw: r2(fb.dw - fa.dw),
      dh: r2(fb.dh - fa.dh),
    };
    const magnitude = maxAbs(delta.dx, delta.dy, delta.dw, delta.dh);
    if (magnitude <= tolerance) continue;
    boxChanges.push({
      path: box.path,
      change_in_final: delta,
      magnitude: r2(magnitude),
      first_changed_layer: firstChange(
        chain,
        box.layers,
        other.layers,
        ["dx", "dy", "dw", "dh"],
        tolerance,
      ),
      a_final: fa,
      b_final: fb,
    });
  }
  const textChanges = [];
  const occurrence = new Map();
  const keyOf = (t) => {
    const base = `${t.owner}|${normText(t.text)}`;
    const n = (occurrence.get(base) ?? 0) + 1;
    occurrence.set(base, n);
    return `${base}|${n}`;
  };
  const aText = new Map(a.text_events.map((t) => [keyOf(t), t]));
  occurrence.clear();
  for (const t of b.text_events) {
    const key = keyOf(t);
    const ta = aText.get(key);
    if (!ta) continue;
    const fa = ta.per_layer[finalName];
    const fb = t.per_layer[finalName];
    if (!Number.isFinite(fa?.dx) || !Number.isFinite(fb?.dx)) continue;
    const delta = { dx: r2(fb.dx - fa.dx), dy: r2(fb.dy - fa.dy) };
    const magnitude = maxAbs(delta.dx, delta.dy);
    if (magnitude <= tolerance) continue;
    textChanges.push({
      owner: t.owner,
      text: t.text,
      change_in_final: delta,
      change_in_L0: {
        dx: r2(t.per_layer.L0.dx - ta.per_layer.L0.dx),
        dy: r2(t.per_layer.L0.dy - ta.per_layer.L0.dy),
      },
      magnitude: r2(magnitude),
      first_changed_layer: firstChange(
        chain.filter((n) => n !== "B0"),
        ta.per_layer,
        t.per_layer,
        ["dx", "dy"],
        tolerance,
      ),
      first_changed_layer_x: firstChange(
        chain.filter((n) => n !== "B0"),
        ta.per_layer,
        t.per_layer,
        ["dx"],
        tolerance,
      ),
      first_changed_layer_y: firstChange(
        chain.filter((n) => n !== "B0"),
        ta.per_layer,
        t.per_layer,
        ["dy"],
        tolerance,
      ),
      a_final: { dx: fa.dx, dy: fa.dy },
      b_final: { dx: fb.dx, dy: fb.dy },
      a_trajectory: chain.filter((n) => n !== "B0").map((n) => ta.per_layer[n]?.dx),
      b_trajectory: chain.filter((n) => n !== "B0").map((n) => t.per_layer[n]?.dx),
    });
  }
  const tally = (items, key = "first_changed_layer", filter = () => true) => {
    const out = {};
    for (const i of items.filter(filter)) out[i[key] ?? "none"] = (out[i[key] ?? "none"] ?? 0) + 1;
    return out;
  };
  const byDx = [...textChanges]
    .filter((t) => Math.abs(t.change_in_final.dx) > tolerance)
    .sort((x, y) => Math.abs(y.change_in_final.dx) - Math.abs(x.change_in_final.dx));
  return {
    final_layer: finalName,
    chrome_reference_identical: chromeMismatch.length === 0,
    chrome_mismatch_sample: chromeMismatch.slice(0, 5),
    boxes_changed_in_final: boxChanges.length,
    boxes_by_first_changed_layer: tally(boxChanges),
    text_runs_changed_in_final: textChanges.length,
    text_by_first_changed_layer: tally(textChanges),
    text_x_changed_in_final: byDx.length,
    text_x_by_first_changed_layer: tally(byDx, "first_changed_layer_x"),
    text_y_by_first_changed_layer: tally(
      textChanges,
      "first_changed_layer_y",
      (t) => Math.abs(t.change_in_final.dy) > tolerance,
    ),
    top_text_x_changes: byDx.slice(0, 15),
    top_box_changes: boxChanges.sort((x, y) => y.magnitude - x.magnitude).slice(0, 15),
    top_text_changes: textChanges.sort((x, y) => y.magnitude - x.magnitude).slice(0, 15),
  };
}

/** Pre-pagination vs PDF for the last lines of the document (single-page alignment by text). */
function bottomLines(diff, probe, lines = 3) {
  if (!probe) return null;
  const same = probe.pairs.filter((p) => p.samePage);
  const byLine = [];
  for (const p of same) {
    const last = byLine.at(-1);
    if (last && Math.abs(last.y - p.vellora.y) < 0.5 && last.page === p.vellora.page)
      last.words.push(p);
    else byLine.push({ y: p.vellora.y, page: p.vellora.page, words: [p] });
  }
  const pick = byLine.filter((l) => l.words.length >= 2).slice(-lines - 1, -1);
  return pick.map((line) => {
    const text = normText(line.words.map((w) => w.text).join(" "));
    const run = [...diff.text_events]
      .reverse()
      .find((t) => normText(t.text).includes(text) || text.includes(normText(t.text)));
    const pdfDy = r2(line.words.reduce((s, w) => s + w.dy_pt, 0) / line.words.length);
    const flowDy = run ? r2(run.per_layer[diff.final_layer]?.dy * PX_TO_PT) : null;
    return {
      text: line.words.map((w) => w.text).join(" "),
      page: line.page,
      pdf_dy_pt: pdfDy,
      prepagination_dy_pt: flowDy,
      introduced_after_layout_pt: flowDy === null ? null : r2(pdfDy - flowDy),
    };
  });
}

function topLevelMargins(dumpA, dumpB) {
  const rows = [];
  const read = (dump) => {
    const nodes = new Map(dump.nodes.map((n) => [n.id, n]));
    const out = new Map();
    for (const [id, , , , , , mt, mb] of dump.layers[0].boxes) {
      const p = nodes.get(id)?.path ?? "";
      if (/^html>body:nth-child\(2\)>[^>]+$/.test(p)) out.set(p, { mt, mb });
    }
    return out;
  };
  const a = read(dumpA);
  const b = read(dumpB);
  for (const [path, ma] of a) {
    const mb = b.get(path);
    if (!mb) continue;
    rows.push({
      path,
      a: ma,
      b: mb,
      changed: Math.abs(ma.mt - mb.mt) > 0.01 || Math.abs(ma.mb - mb.mb) > 0.01,
    });
  }
  return rows;
}

function main() {
  const la = arg("--a", "pin");
  const lb = arg("--b", "beta4");
  const out = resolve(arg("--out", join(repoRoot, "fidelity", "results", "layout-diff")));
  const tolerance = Number(arg("--tolerance", "0.5"));
  const fixtures = arg("--fixtures", FIXTURE_IDS.join(",")).split(",").filter(Boolean);
  const read = (fixture, label, file) => {
    const p = join(out, fixture, label, file);
    return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
  };
  const results = [];
  let md = `# Layout diff comparison: ${la} → ${lb}\n\n`;
  md +=
    "Same templated HTML, same Chromium reference, two vellora builds. A change is attributed to the FIRST layer where b's delta-vs-Chromium differs from a's by more than the tolerance: `B0` = the bump changed raw Blitz layout; `L0` = raw Blitz/Parley text as read by the walk; a pass name = that vellora post-layout pass reacts differently to the new input. PDF rows: same-page words aligned by text from poppler `pdftotext -bbox`; `introduced_after_layout` = PDF Δ − pre-pagination Δ (both pt), i.e. what pagination/emit added.\n\n";
  for (const fixture of fixtures) {
    const a = read(fixture, la, "diff.json");
    const b = read(fixture, lb, "diff.json");
    if (!a || !b) {
      md += `## ${fixture}\n\nNOT RUN: missing diff.json for ${!a ? la : lb}.\n\n`;
      results.push({ fixture, status: "not-run" });
      continue;
    }
    const cmp = compareRuns(a, b, { tolerance });
    const margins = topLevelMargins(
      read(fixture, la, "vellora-dump.json"),
      read(fixture, lb, "vellora-dump.json"),
    );
    const bottomA = bottomLines(a, read(fixture, la, "pdf-probe.json"));
    const bottomB = bottomLines(b, read(fixture, lb, "pdf-probe.json"));
    results.push({
      fixture,
      comparison: cmp,
      top_level_margins: margins,
      bottom_lines: { [la]: bottomA, [lb]: bottomB },
      headline: { [la]: a.headline, [lb]: b.headline },
    });
    md += `## ${fixture}\n\n`;
    md += `- Chromium reference identical across both runs: ${cmp.chrome_reference_identical ? "yes" : `NO (${cmp.chrome_mismatch_sample.join(", ")})`}\n`;
    md += table(
      ["", `${la}`, `${lb}`],
      [
        [
          "first divergent box",
          `${shortPath(a.headline.box?.path)} (${a.headline.box?.type}) by ${a.headline.box?.introduced_by}`,
          `${shortPath(b.headline.box?.path)} (${b.headline.box?.type}) by ${b.headline.box?.introduced_by}`,
        ],
        [
          "first divergent text",
          `"${a.headline.text?.text}" by ${a.headline.text?.introduced_by}`,
          `"${b.headline.text?.text}" by ${b.headline.text?.introduced_by}`,
        ],
        ...a.layer_stats.map((s, i) => [
          `${s.layer}: box/text diverged, mean box err`,
          `${s.box_events_diverged}/${s.text_events_diverged}, ${s.mean_abs_box_error}`,
          `${b.layer_stats[i]?.box_events_diverged}/${b.layer_stats[i]?.text_events_diverged}, ${b.layer_stats[i]?.mean_abs_box_error}`,
        ]),
      ],
    );
    md += `\n- boxes whose final pre-pagination geometry changed: ${cmp.boxes_changed_in_final}; by first changed layer: ${JSON.stringify(cmp.boxes_by_first_changed_layer)}\n`;
    md += `- text runs whose final position changed: ${cmp.text_runs_changed_in_final}; by first changed layer: ${JSON.stringify(cmp.text_by_first_changed_layer)}\n`;
    md += `  - of those, x changed: ${cmp.text_x_changed_in_final}, first x-changing layer: ${JSON.stringify(cmp.text_x_by_first_changed_layer)}; y changed, first y-changing layer: ${JSON.stringify(cmp.text_y_by_first_changed_layer)}\n\n`;
    md +=
      "Largest text-run X changes (px), with the x trajectory per layer (vellora − Chromium dx, L0 → final):\n\n";
    md += table(
      [
        "owner",
        "text",
        "Δ final dx",
        "Δ L0 dx",
        "first x-changing layer",
        `${la} dx trajectory`,
        `${lb} dx trajectory`,
      ],
      cmp.top_text_x_changes
        .slice(0, 10)
        .map((t) => [
          shortPath(t.owner),
          t.text.slice(0, 24),
          t.change_in_final.dx,
          t.change_in_L0.dx,
          t.first_changed_layer_x ?? "",
          t.a_trajectory.map(r2).join(" → "),
          t.b_trajectory.map(r2).join(" → "),
        ]),
    );
    md += `\nLayer order of the trajectories: ${a.layers
      .filter((l) => l.name !== "B0")
      .map((l) => l.name)
      .join(" → ")}\n\n`;
    md += "Largest text-run changes (px; Δ = b − a of vellora−Chromium):\n\n";
    md += table(
      [
        "owner",
        "text",
        "Δ final dx,dy",
        "Δ L0 dx,dy",
        "first changed layer",
        `${la} final dx,dy`,
        `${lb} final dx,dy`,
      ],
      cmp.top_text_changes
        .slice(0, 10)
        .map((t) => [
          shortPath(t.owner),
          t.text.slice(0, 30),
          `${t.change_in_final.dx}, ${t.change_in_final.dy}`,
          `${t.change_in_L0.dx}, ${t.change_in_L0.dy}`,
          t.first_changed_layer ?? "",
          `${t.a_final.dx}, ${t.a_final.dy}`,
          `${t.b_final.dx}, ${t.b_final.dy}`,
        ]),
    );
    md += "\nLargest box changes:\n\n";
    md += table(
      ["path", "Δ final dx,dy,dw,dh", "first changed layer"],
      cmp.top_box_changes
        .slice(0, 10)
        .map((x) => [
          shortPath(x.path),
          Object.values(x.change_in_final).join(", "),
          x.first_changed_layer ?? "",
        ]),
    );
    const changedMargins = margins.filter((m) => m.changed);
    md += `\nTop-level body children whose Blitz margins (L0 margin_top/margin_bottom, used by pagination's gaps) changed: ${changedMargins.length ? changedMargins.map((m) => `${shortPath(m.path)} ${la} ${r2(m.a.mt)}/${r2(m.a.mb)} → ${lb} ${r2(m.b.mt)}/${r2(m.b.mb)}`).join("; ") : "none"}\n`;
    if (bottomA || bottomB) {
      md += "\nBottom lines, PDF vs pre-pagination (pt, vellora − Chrome):\n\n";
      md += table(
        ["run", "line", "page", "PDF dy", "pre-pagination dy", "added after layout"],
        [
          ...(bottomA ?? []).map((l) => [
            la,
            l.text.slice(0, 40),
            l.page,
            l.pdf_dy_pt,
            l.prepagination_dy_pt,
            l.introduced_after_layout_pt,
          ]),
          ...(bottomB ?? []).map((l) => [
            lb,
            l.text.slice(0, 40),
            l.page,
            l.pdf_dy_pt,
            l.prepagination_dy_pt,
            l.introduced_after_layout_pt,
          ]),
        ],
      );
    }
    md += "\n";
  }
  writeFileSync(join(out, `compare-${la}-vs-${lb}.md`), md);
  writeFileSync(
    join(out, `compare-${la}-vs-${lb}.json`),
    `${JSON.stringify({ schema: "vellora-layout-diff/compare/1", a: la, b: lb, tolerance, results }, null, 2)}\n`,
  );
  process.stdout.write(`${join(out, `compare-${la}-vs-${lb}.md`)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
