// Markdown + standalone HTML reports for one layout diff (and the cross-fixture summary).

export const SCOPE_NOTE =
  "Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at " +
  "the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination " +
  "layers (B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, " +
  "repeated thead, page-local offsets, margin boxes).";

export const LAYER_DOCS = {
  B0: "Blitz's own layout tree: `layout_children` walk (incl. anonymous blocks), absolute border boxes from rounded `final_layout`. Raw Blitz.",
  B0u: "Same tree from `unrounded_layout` (Taffy before `round_layout`). Diagnostic only, not in the attribution chain.",
  L0: "vellora's box walk (`blitz_engine::walk`, DOM `children`, accumulating `final_layout`) before any pass; text = Parley glyph runs as read by `read_text_runs`.",
};

const P = "html>body:nth-child(2)";

export function shortPath(path) {
  if (!path) return "";
  return path.startsWith(P) ? `body${path.slice(P.length)}` : path;
}

function num(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "";
  return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : String(v);
}

function esc(text) {
  return String(text ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

function table(headers, rows) {
  if (rows.length === 0) return "_none_\n";
  const out = [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`];
  for (const row of rows) out.push(`| ${row.map((c) => esc(c)).join(" | ")} |`);
  return `${out.join("\n")}\n`;
}

export function attributionText(div, finalName) {
  if (!div) return "no divergence beyond tolerance";
  const layer = div.introduced_by;
  const b0 = div.per_layer?.B0;
  const b0u = div.per_layer?.B0u;
  let text;
  if (layer === "B0") {
    text = "RAW BLITZ: Blitz's own layout tree (B0) already differs from Chromium";
    if (b0u?.status === "ok")
      text += " (but the UNROUNDED tree is within tolerance: Taffy round_layout)";
  } else if (layer === "L0") {
    text =
      div.type === "text"
        ? "RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved"
        : `VELLORA WALK: B0 ${b0?.status ?? "?"}, but vellora's DOM-children walk (L0) differs`;
  } else if (layer) {
    text = `NORMALIZE PASS \`${layer}\`: every earlier layer is within tolerance`;
  } else {
    text = `diverges only in ${finalName}`;
  }
  return text;
}

function eventLabel(div) {
  if (!div) return "";
  if (div.type === "text") return `text "${div.text}" in ${shortPath(div.owner)}`;
  return `${div.type === "enter" ? "enter (x/y/width)" : "exit (height)"} ${shortPath(div.path)}`;
}

function layerTable(div, layers) {
  const rows = [];
  for (const layer of [...layers.map((l) => l.name), ...(div.type === "text" ? [] : ["B0u"])]) {
    const v = div.per_layer[layer];
    if (!v) continue;
    rows.push([
      layer,
      v.status,
      num(v.dx),
      num(v.dy),
      num(v.dw),
      num(v.dh ?? v.dright),
      v.dy_basis ?? "",
    ]);
  }
  return table(
    ["layer", "status", "dx", "dy", "dw", div.type === "text" ? "dright" : "dh", "dy basis"],
    rows,
  );
}

function divergenceSection(title, div, result) {
  let md = `## ${title}\n\n`;
  if (!div) return `${md}No divergence beyond tolerance.\n\n`;
  md += `- **${eventLabel(div)}** (event #${div.order})\n`;
  md += `- introduced by: **${div.introduced_by ?? "n/a"}** — ${attributionText(div, result.final_layer)}\n`;
  if (div.changed_by?.length) {
    md += `- later layers that changed its max |Δ|: ${div.changed_by
      .map((c) => `\`${c.layer}\` ${num(c.from)} → ${num(c.to)}`)
      .join(", ")}\n`;
  }
  if (div.type === "text") {
    md += `- Chromium fragment: "${esc(div.chrome_text)}" at x=${num(div.chrome.x)} y=${num(div.chrome.y)} w=${num(div.chrome.w)}; vellora faces: ${div.faces.join(", ")}${div.joined ? " (joined fragments)" : ""}\n`;
  }
  md += `\n${layerTable(div, result.layers)}\n`;
  if (div.ancestors?.length) {
    md += "Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):\n\n";
    md += table(
      ["ancestor", `${result.final_layer} dx,dy,dw,dh`, "B0 dx,dy,dw,dh", "L0 dx,dy,dw,dh"],
      div.ancestors.map((a) => [
        shortPath(a.path),
        quad(a[result.final_layer]),
        quad(a.B0),
        quad(a.L0),
      ]),
    );
    md += "\n";
  }
  return md;
}

function quad(v) {
  return v ? [v.dx, v.dy, v.dw, v.dh].map(num).join(", ") : "—";
}

export function renderMarkdown({ fixture, label, env, parity, result }) {
  let md = `# Layout diff — ${fixture} (${label})\n\n> ${SCOPE_NOTE}\n\n`;
  md +=
    "Deltas are vellora − Chromium in CSS px. Paths abbreviate `html>body:nth-child(2)` as `body`.\n\n";
  md += "## Environment\n\n";
  for (const [k, v] of Object.entries(env)) {
    if (typeof v === "object") continue;
    md += `- ${k}: \`${v}\`\n`;
  }
  md += `- crates: ${Object.entries(env.crates ?? {})
    .map(([k, v]) => `${k} ${v.map((e) => e.version).join("/")}`)
    .join(", ")}\n`;
  md += `- tools: ${Object.entries(env.tools ?? {})
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}\n\n`;
  md += "## Input parity\n\n";
  for (const line of parity) md += `- ${line}\n`;
  md += "\n## Layers (attribution chain order)\n\n";
  md += table(
    ["layer", "kind", "meaning"],
    [
      ...result.layers.map((l) => [
        l.name,
        l.kind,
        LAYER_DOCS[l.name] ?? "after this `layout_normalize` pass",
      ]),
      ["B0u", "blitz-unrounded", LAYER_DOCS.B0u],
    ],
  );
  md += `\nTolerance: box ${result.config.tolerance} px, text ${result.config.textTolerance} px. `;
  md +=
    "Box events: ENTER checks x/y/width (top-down), EXIT checks height (bottom-up, so html/body are not 'first' just because they absorb descendants' error). Text runs are checked between a box's enter and exit.\n\n";
  md += divergenceSection(
    `Headline: first divergent box in ${result.final_layer}`,
    result.headline.box,
    result,
  );
  md += divergenceSection(
    `First divergent text run in ${result.final_layer}`,
    result.headline.text,
    result,
  );
  md += "## First divergence per layer\n\n";
  md += table(
    ["layer", "first box", "box Δ", "first text", "text Δ (dx, dy)"],
    result.layers.map((l) => {
      const f = result.first_divergence_by_layer[l.name];
      const b = f.box;
      const t = f.text;
      const bv = b?.per_layer[l.name];
      const tv = t?.per_layer[l.name];
      return [
        l.name,
        b ? eventLabel(b) : "—",
        bv
          ? [bv.dx, bv.dy, bv.dw, bv.dh]
              .filter((v) => v !== undefined)
              .map(num)
              .join(", ")
          : "",
        t ? eventLabel(t) : l.kind === "blitz" ? "n/a (no text in B0)" : "—",
        tv ? `${num(tv.dx)}, ${num(tv.dy)}` : "",
      ];
    }),
  );
  md += "\n## Per-layer error and pass effects\n\n";
  md +=
    "`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = moved closer to / further from Chromium (max |Δ| per item); `Σ` = summed change of that error.\n\n";
  md += table(
    [
      "layer",
      "box events diverged",
      "text events diverged",
      "mean abs box Δ (px)",
      "boxes moved/better/worse (Σ)",
      "runs moved/better/worse (Σ)",
    ],
    result.layer_stats.map((s) => {
      const e = s.effect_vs_previous;
      return [
        s.layer,
        s.box_events_diverged,
        s.kind === "blitz" ? "n/a" : s.text_events_diverged,
        num(s.mean_abs_box_error),
        e
          ? `${e.boxes_moved}/${e.boxes_improved}/${e.boxes_worsened} (${num(e.box_error_delta)})`
          : "",
        e
          ? `${e.runs_moved}/${e.runs_improved}/${e.runs_worsened} (${num(e.run_error_delta)})`
          : "",
      ];
    }),
  );
  md += `\n## Top ${result.config.top} box divergences in ${result.final_layer} (absolute)\n\n`;
  md += table(
    ["path", "dx", "dy", "dw", "dh", "introduced by"],
    result.top_boxes.map((b) => [
      shortPath(b.path),
      num(b.delta.dx),
      num(b.delta.dy),
      num(b.delta.dw),
      num(b.delta.dh),
      b.introduced_by ?? "",
    ]),
  );
  md += `\n## Top ${result.config.top} LOCAL box divergences\n\n`;
  md +=
    "rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.\n\n";
  md += table(
    ["path", "rdx", "rdy", "dw", "dh", "introduced by"],
    result.top_local_boxes.map((b) => [
      shortPath(b.path),
      num(b.local.rdx),
      num(b.local.rdy),
      num(b.delta.dw),
      num(b.delta.dh),
      b.introduced_by ?? "",
    ]),
  );
  md += `\n## Top ${result.config.top} text-run divergences in ${result.final_layer}\n\n`;
  md += table(
    ["owner", "text", "dx", "dy", "dw", "dright", "faces", "introduced by"],
    result.top_text.map((t) => [
      shortPath(t.owner),
      t.text.length > 48 ? `${t.text.slice(0, 45)}...` : t.text,
      num(t.delta?.dx),
      num(t.delta?.dy),
      num(t.delta?.dw),
      num(t.delta?.dright),
      t.faces.join(" "),
      t.introduced_by ?? "",
    ]),
  );
  const c = result.counts;
  md += "\n## Match counts and node policy\n\n";
  md += `- Chromium elements under html (head excluded) by policy: ${Object.entries(
    c.chrome_elements_by_policy,
  )
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}\n`;
  md += `- vellora L0 boxes (elements, head excluded): ${c.vellora_l0_boxes}; matched to a compared Chromium box: ${c.matched_boxes}\n`;
  for (const [k, v] of Object.entries(c.vellora_only)) {
    md += `- vellora-only — ${k}: ${v.count} (e.g. ${v.sample.slice(0, 3).map(shortPath).join("; ")})\n`;
  }
  md += `- Chromium-only compared boxes (no vellora L0 box): ${c.chrome_only_compared.count}${c.chrome_only_compared.count ? ` (e.g. ${c.chrome_only_compared.sample.slice(0, 3).map(shortPath).join("; ")})` : ""}\n`;
  md += `- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): ${c.blitz_tree_only.count}${c.blitz_tree_only.count ? ` (e.g. ${c.blitz_tree_only.sample.slice(0, 3).map(shortPath).join("; ")})` : ""}\n`;
  md +=
    "- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.\n";
  const t = result.text;
  md += "\n## Text alignment\n\n";
  md += `- vellora runs (non-blank, L0): ${t.vellora_runs}; Chromium text fragments (non-blank): ${t.chrome_fragments}; matched pairs: ${t.matched_pairs} (${t.joined_pairs} joined across fragment/run boundaries)\n`;
  md += `- unmatched vellora runs: ${t.unmatched_vellora_runs_total}; unmatched Chromium fragments: ${t.unmatched_chrome_fragments_total}; Chromium text with NO vellora owner (text vellora never shaped): ${t.chrome_text_without_vellora_owner_total}\n`;
  if (t.unmatched_vellora_runs.length) {
    md += `\nUnmatched vellora runs (first ${Math.min(10, t.unmatched_vellora_runs.length)}):\n\n`;
    md += table(
      ["owner", "text"],
      t.unmatched_vellora_runs.slice(0, 10).map((r) => [shortPath(r.owner), r.text]),
    );
  }
  if (t.unmatched_chrome_fragments.length) {
    md += `\nUnmatched Chromium fragments (first ${Math.min(10, t.unmatched_chrome_fragments.length)}):\n\n`;
    md += table(
      ["owner", "text"],
      t.unmatched_chrome_fragments.slice(0, 10).map((r) => [shortPath(r.owner), r.text]),
    );
  }
  if (t.chrome_text_without_vellora_owner.length) {
    md += "\nChromium text with no vellora owner:\n\n";
    md += table(
      ["text node", "text"],
      t.chrome_text_without_vellora_owner.slice(0, 10).map((r) => [shortPath(r.path), r.text]),
    );
  }
  md += "\n## Caveats\n\n";
  md +=
    "- Local macOS Chrome results are INDICATIVE; the authoritative run is the pinned Chrome for Testing on Linux CI (see fidelity/layout-diff/README.md).\n";
  md +=
    "- Text dy compares BASELINES when Chromium's ascent for the face/size was measured (probe page, zero-size inline-block on the baseline); otherwise vellora's text top (baseline − Parley ascent) vs Chromium's text-box top (`dy basis` column).\n";
  md +=
    "- L0 text positions already include `read_text_runs`' inline padding-right compensation, so 'raw Parley' text is not separated from vellora's reader.\n";
  return md;
}

export function renderSummaryMarkdown({ label, env, rows }) {
  let md = `# Layout diff summary (${label})\n\n> ${SCOPE_NOTE}\n\n`;
  md += `- date: \`${env.date_utc}\`; blitz: \`${env.blitz}\`; commit: \`${env.git_commit}\` (${env.git_dirty}); chrome: \`${env.chrome_version}\`; node: \`${env.node}\`; rustc: \`${env.rustc}\`\n`;
  md += `- command: \`${env.command}\`\n\n`;
  md += table(
    [
      "fixture",
      "first divergent box (final layer)",
      "Δ",
      "introduced by",
      "first divergent text run",
      "text Δ (dx, dy)",
      "introduced by",
      "matched boxes",
    ],
    rows.map((r) => {
      const b = r.result.headline.box;
      const t = r.result.headline.text;
      const bv = b?.per_layer[r.result.final_layer];
      const tv = t?.per_layer[r.result.final_layer];
      return [
        r.fixture,
        b ? eventLabel(b) : "none",
        bv
          ? [bv.dx, bv.dy, bv.dw, bv.dh]
              .filter((v) => v !== undefined)
              .map(num)
              .join(", ")
          : "",
        b?.introduced_by ?? "",
        t ? eventLabel(t) : "none",
        tv ? `${num(tv.dx)}, ${num(tv.dy)}` : "",
        t?.introduced_by ?? "",
        `${r.result.counts.matched_boxes}/${r.result.counts.vellora_l0_boxes}`,
      ];
    }),
  );
  return md;
}

/** Tiny Markdown -> HTML for the subset emitted above (headings, lists, tables, quotes, code). */
export function markdownToHtml(md, title) {
  const escHtml = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const inline = (s) =>
    escHtml(s)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|\W)_([^_]+)_(?=\W|$)/g, "$1<em>$2</em>");
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(lines[i]);
        i += 1;
      }
      const cells = (r) =>
        r
          .slice(1, -1)
          .split(/(?<!\\)\|/)
          .map((c) => c.trim().replaceAll("\\|", "|"));
      out.push("<table><thead><tr>");
      for (const c of cells(rows[0])) out.push(`<th>${inline(c)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const r of rows.slice(2)) {
        out.push(
          `<tr>${cells(r)
            .map((c) => `<td>${inline(c)}</td>`)
            .join("")}</tr>`,
        );
      }
      out.push("</tbody></table>");
      continue;
    }
    if (line.startsWith("- ")) {
      out.push("<ul>");
      while (i < lines.length && lines[i].startsWith("- ")) {
        out.push(`<li>${inline(lines[i].slice(2))}</li>`);
        i += 1;
      }
      out.push("</ul>");
      continue;
    }
    const h = /^(#{1,4}) (.*)$/.exec(line);
    if (h) out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    else if (line.startsWith("> ")) out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
    i += 1;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escHtml(title)}</title>
<style>body{font:14px/1.45 system-ui,sans-serif;margin:2rem;max-width:1400px}table{border-collapse:collapse;margin:.5rem 0 1rem}
td,th{border:1px solid #ccc;padding:2px 6px;font-size:12px;vertical-align:top}th{background:#f3f3f3}
code{font-size:12px;background:#f6f6f6;padding:0 2px}blockquote{border-left:4px solid #c90;margin:0;padding:.3rem 1rem;background:#fff8e6}</style>
</head><body>
${out.join("\n")}
</body></html>
`;
}
