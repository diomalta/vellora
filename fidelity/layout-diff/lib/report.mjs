// Markdown + standalone HTML reports for one layout diff (and the cross-fixture summary).

export const SCOPE_NOTE =
  "Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at " +
  "the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination " +
  "layers (N0, B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, " +
  "repeated thead, page-local offsets, margin boxes).";

export const LAYER_DOCS = {
  N0: "Blitz's own layout tree of the SOURCE HTML (`layout_dump --no-html-normalize`: html_normalize skipped), keyed by the source DOM. **Raw Blitz.**",
  N0u: "Same N0 tree from `unrounded_layout` (Taffy before `round_layout`). Diagnostic only, not in the attribution chain.",
  B0: "Blitz's own layout tree of html_normalize's OUTPUT (what the render path lays out): `layout_children` walk (incl. anonymous blocks), absolute border boxes from rounded `final_layout`. With N0 present, the N0 → B0 step is html_normalize's; without N0 it is NOT raw Blitz whenever html_normalize altered the DOM.",
  B0u: "Same B0 tree from `unrounded_layout` (Taffy before `round_layout`). Diagnostic only, not in the attribution chain.",
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

const signed = (v) => `${v > 0 ? "+" : ""}${num(v)}`;

/** First-over-tolerance label of an item (accepts pre-rename diff.json: `introduced_by`). */
export function firstOverTol(item) {
  return item?.first_over_tolerance ?? item?.introduced_by ?? null;
}

/** "layer coord ±step" list, e.g. "B0 dy +6.52; table_percent_widths dy +10". */
export function stepsText(steps) {
  if (!steps?.length) return "";
  return steps.map((st) => `${st.layer} ${st.coord} ${signed(st.step)}`).join("; ");
}

/** "layer kind coord from→to" list of regressions (`first` = already over tolerance there). */
export function regressedText(regressed) {
  if (!regressed?.length) return "";
  return regressed
    .map((w) =>
      w.kind === "missing"
        ? `${w.layer} LOST the box`
        : `${w.layer} ${w.kind === "overshoot" ? "overshoot " : ""}${w.coord} ${num(w.from)}→${num(w.to)}${w.first ? " (first layer)" : ""}`,
    )
    .join("; ");
}

function dominantText(item) {
  if (!item?.dominant_layer) return "";
  const st = item.dominant_step;
  return st ? `${item.dominant_layer} (${st.coord} ${signed(st.step)})` : item.dominant_layer;
}

/** Banner when input parity failed: the attribution below is not about the engines. */
function invalidPrefix(result) {
  const s = result?.checks_summary;
  if (!s || s.input_parity_ok) return "";
  const ids = result.checks
    .filter((c) => c.class === "input-parity" && c.status === "fail")
    .map((c) => c.id);
  return `INVALID — input parity failed (${ids.join(", ")}); the engines were not given the same problem, so this is NOT evidence about Blitz or vellora: `;
}

const hasLayer = (result, name) => result.layers.some((l) => l.name === name);

/** What the FIRST-OVER-TOLERANCE layer means for this run (never, by itself, "which layer made it worse"). */
export function attributionText(div, finalName, result) {
  if (!div) return "no divergence beyond tolerance";
  const layer = firstOverTol(div);
  const v = layer ? div.per_layer?.[layer] : null;
  const unr = layer ? div.per_layer?.[`${layer}u`] : null;
  const rounding =
    unr?.status === "ok" ? " (but the UNROUNDED tree is within tolerance: Taffy round_layout)" : "";
  const lost = v?.status === "missing";
  const n0 = hasLayer(result, "N0");
  let text;
  if (lost) {
    const present = Object.entries(div.per_layer ?? {})
      .filter(([k, x]) => x?.status && x.status !== "missing" && !k.endsWith("u"))
      .map(([k]) => k);
    text = present.length
      ? `BOX LOST: layer ${layer} has no box for it (present in ${present.join(", ")})`
      : "BOX MISSING: Chromium lays it out, no vellora layer has a box for it";
  } else if (layer === "N0") {
    text = `RAW BLITZ: Blitz's layout of the SOURCE HTML (N0) already differs from Chromium${rounding}`;
  } else if (layer === "B0") {
    if (n0) {
      text = `HTML_NORMALIZE: Blitz on the source HTML (N0) is ${div.per_layer?.N0?.status ?? "?"}, Blitz on html_normalize's output (B0) differs${rounding}`;
    } else if (result.html_normalize?.dom_altered === false) {
      text = `RAW BLITZ: B0 differs from Chromium, and html_normalize changed nothing for this input (B0 = Blitz on the source HTML)${rounding}`;
    } else {
      text = `BLITZ ON html_normalize OUTPUT (B0) differs; raw Blitz and html_normalize are NOT separated (no N0 layer in this run)${rounding}`;
    }
  } else if (layer === "L0") {
    text =
      div.type === "text"
        ? "RAW BLITZ/PARLEY TEXT as read by vellora's walk (L0); no normalize pass involved"
        : `VELLORA WALK: B0 ${div.per_layer?.B0?.status ?? "?"}, but vellora's DOM-children walk (L0) differs`;
  } else if (layer) {
    text = `NORMALIZE PASS \`${layer}\`: every earlier layer is within tolerance`;
  } else {
    text = `diverges only in ${finalName}`;
  }
  return `${invalidPrefix(result)}${text}`;
}

function eventLabel(div) {
  if (!div) return "";
  if (div.type === "text") return `text "${div.text}" in ${shortPath(div.owner)}`;
  return `${div.type === "enter" ? "enter (x/y/width)" : "exit (height)"} ${shortPath(div.path)}`;
}

function layerTable(div, result) {
  const rows = [];
  const names = [
    ...result.layers.map((l) => l.name),
    ...(div.type === "text" ? [] : (result.unrounded_layers ?? ["B0u"])),
  ];
  for (const layer of names) {
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

function divergenceSection(title, div, result, none = "No divergence beyond tolerance.") {
  let md = `## ${title}\n\n`;
  if (!div) return `${md}${none}\n\n`;
  md += `- **${eventLabel(div)}** (event #${div.order})${div.status_in_final === "missing" ? " — **no box in the final layer**" : ""}\n`;
  md += `- first over tolerance: **${firstOverTol(div) ?? "n/a"}** — ${attributionText(div, result.final_layer, result)}\n`;
  md += `- regressed by (which layer made it worse, per coordinate): **${regressedText(div.regressed_by) || "none"}**\n`;
  md += `- dominant layer (largest step of the final Δ): ${dominantText(div) || "n/a"}; step decomposition (sums to the final Δ): ${stepsText(div.steps) || "none"}\n`;
  if (div.type === "text") {
    md += `- Chromium fragment: "${esc(div.chrome_text)}" at x=${num(div.chrome.x)} y=${num(div.chrome.y)} w=${num(div.chrome.w)}; vellora faces: ${div.faces.join(", ")}${div.joined ? " (joined fragments)" : ""}\n`;
  }
  md += `\n${layerTable(div, result)}\n`;
  if (div.ancestors?.length) {
    const n0 = hasLayer(result, "N0");
    md += "Ancestor chain (compared boxes, root first; deltas = vellora − Chromium, CSS px):\n\n";
    md += table(
      [
        "ancestor",
        `${result.final_layer} dx,dy,dw,dh`,
        ...(n0 ? ["N0 dx,dy,dw,dh"] : []),
        "B0 dx,dy,dw,dh",
        "L0 dx,dy,dw,dh",
      ],
      div.ancestors.map((a) => [
        shortPath(a.path),
        quad(a[result.final_layer]),
        ...(n0 ? [quad(a.N0)] : []),
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

export const ATTRIBUTION_NOTE =
  "Two attribution answers per item. **regressed by** = every layer that made the item WORSE than the previous layer, per checked coordinate: |Δ| grew by more than tolerance (`worsened`), the sign flipped with both sides over tolerance and |Δ| did not shrink by more than tolerance (`overshoot`, e.g. +6 → −6), or the layer lost the box (`LOST`); on the first layer of the chain it means 'already over tolerance vs Chromium'. This answers 'which layer changed the error', also after the document's first natural divergence. **first over tolerance** = the first layer of N0 → B0 → L0 → passes whose |Δ vs Chromium| exceeds tolerance: it answers 'is raw Blitz already off?' and NEVER blames a later layer — a pass that adds +10 px to a box already +6 px off at B0 still reads B0 there. **dominant layer** = the layer with the largest step (step = layer Δ − previous layer Δ; steps sum exactly to the final Δ). Limit: a layer that moves a box TOWARDS Chromium is an improvement by definition, whatever its cause; `compare.mjs` (build vs build) answers 'what did this code change do'.";

function checksSection(result) {
  if (!result.checks) return "";
  let md = "## Checks (input parity, dump self-consistency, coverage)\n\n";
  md += table(
    ["check", "class", "status", "detail"],
    result.checks.map((c) => [
      c.id,
      c.class,
      c.status === "fail" ? "**FAIL**" : c.status,
      c.detail,
    ]),
  );
  return `${md}\n`;
}

function checksBanner(result) {
  const s = result.checks_summary;
  if (!s) return "";
  const parts = [];
  if (!s.input_parity_ok) {
    parts.push(
      "INPUT PARITY FAILED: Chromium and Blitz were not given the same problem; every attribution below is INVALID as engine evidence",
    );
  }
  if (!s.self_consistency_ok) {
    parts.push(
      "SELF-CONSISTENCY FAILED: some DOM-path keys or dump records are wrong; results for the affected subtree are unreliable",
    );
  }
  let md = "";
  if (s.failed.length) {
    md += `> **CHECKS FAILED (${s.failed.join(", ")})** — ${parts.join(". ")}. See \`Checks\`.\n\n`;
  }
  if (s.not_run?.length) {
    md += `> NOT RUN: ${s.not_run.join(", ")} — see \`Checks\` for the reason.\n\n`;
  }
  return md;
}

function regressionSection(result) {
  const r = result.regressions_by_layer;
  if (!r) return "";
  let md = "## Regressions by layer\n\n";
  md +=
    "Events each layer REGRESSED (worsened / overshoot by more than tolerance on any single checked coordinate, or lost the box) relative to the previous layer; for the first layer of the chain, vs Chromium (= already over tolerance). Independent of the first-over-tolerance label and of the headline, so a pass that worsens an already-divergent box, or any box after the first natural divergence, is listed here.\n\n";
  md += table(
    [
      "layer",
      "box events regressed (worsened/overshoot/lost)",
      "text events regressed",
      "first box regressed",
      "largest box regression",
      "first text regressed",
      "largest text regression",
    ],
    result.layers.map((l) => {
      const x = r[l.name];
      const k = x.by_kind ?? {};
      const lb = x.largest_box;
      const lt = x.largest_text;
      const own = (item) => regressedText(item.regressed_by.filter((w) => w.layer === l.name));
      const blitz = l.kind === "blitz" || l.kind === "blitz-source";
      return [
        l.name,
        `${x.box_events} (${k.worsened ?? 0}/${k.overshoot ?? 0}/${k.missing ?? 0})`,
        blitz ? "n/a" : x.text_events,
        x.first_box ? `${eventLabel(x.first_box)} (${own(x.first_box)})` : "—",
        lb ? `${eventLabel(lb)} ${lb.kind} ${lb.coord} ${num(lb.from)}→${num(lb.to)}` : "—",
        x.first_text ? `${eventLabel(x.first_text)} (${own(x.first_text)})` : "—",
        lt ? `${eventLabel(lt)} ${lt.kind} ${lt.coord} ${num(lt.from)}→${num(lt.to)}` : "—",
      ];
    }),
  );
  const firstLayer = result.layers[0]?.name;
  const PER_LAYER = 12;
  const passRows = result.layers
    .filter((l) => l.name !== firstLayer)
    .flatMap((l) =>
      r[l.name].events
        .filter((e) => !e.first)
        .slice(0, PER_LAYER)
        .map((e) => [l.name, e]),
    );
  if (passRows.length) {
    md += `\nEvents regressed by each layer after ${firstLayer}, in document order (first ${PER_LAYER} per layer here, 40 in diff.json; ${firstLayer} omitted: it is the list of items already over tolerance in the first layer):\n\n`;
    md += table(
      ["layer", "event", "kind", "coord", "from → to", "first over tol.", "dominant"],
      passRows.map(([name, e]) => [
        name,
        eventLabel(e),
        e.kind,
        e.coord ?? "",
        e.kind === "missing" ? "box lost" : `${num(e.from)} → ${num(e.to)}`,
        firstOverTol(e) ?? "",
        e.dominant_layer ?? "",
      ]),
    );
  }
  return `${md}\n`;
}

function missingSection(result) {
  const m = result.headline.first_missing;
  let md = "## Compared Chromium boxes with no vellora box (final layer)\n\n";
  if (!m) return `${md}None: every compared Chromium box has a vellora box.\n\n`;
  md += `${m.total_missing} box(es). A lost box counts as a divergence (first over tolerance / regressed by \`LOST\`) when an earlier layer had it, or when no vellora layer has it at all.\n\n`;
  md += table(
    ["path", "tag", "event", "Chromium x,y,w,h", "present in", "lost at", "counted"],
    (result.missing_boxes ?? [m]).map((x) => [
      shortPath(x.path),
      x.tag,
      `#${x.order}`,
      x.chrome ? [x.chrome.x, x.chrome.y, x.chrome.w, x.chrome.h].map(num).join(", ") : "",
      x.present_in.join(", ") || "none",
      x.missing_from ?? "",
      x.counted_as_divergence === false ? "no" : "yes",
    ]),
  );
  return `${md}\n`;
}

function marginSection(result) {
  const m = result.margins;
  if (!m) return "";
  let md = "## Margins (not part of the x/y/w/h attribution)\n\n";
  md += `${m.note}\n\n`;
  md += `- boxes with vellora margins: ${m.boxes_with_margins}; changed by the passes (L0 → final): ${m.changed_by_passes}\n`;
  md += `- differ from Chromium COMPUTED margins by > tolerance (L0): ${m.chromium_computed_available ? m.differ_from_chromium_computed : "n/a (snapshot has no computed margins)"}\n`;
  if (m.differ_from_chromium_computed_sample.length) {
    md += "\n";
    md += table(
      ["path", "vellora L0 mt / mb", "Chromium computed mt / mb"],
      m.differ_from_chromium_computed_sample.map((x) => [
        shortPath(x.path),
        `${num(x.vellora_L0.mt)} / ${num(x.vellora_L0.mb)}`,
        `${num(x.chromium_computed.mt)} / ${num(x.chromium_computed.mb)}`,
      ]),
    );
  }
  return `${md}\n`;
}

function effectText(e, kind) {
  if (!e) return "";
  const moved = kind === "box" ? e.boxes_moved : e.runs_moved;
  const better = kind === "box" ? e.boxes_improved : e.runs_improved;
  const worse = kind === "box" ? e.boxes_worsened : e.runs_worsened;
  const sigma = kind === "box" ? e.box_error_delta : e.run_error_delta;
  return `${moved}/${better}/${worse} (${num(sigma)})`;
}

function regressedNames(e, kind) {
  if (!e) return "";
  const n = kind === "box" ? e.boxes_regressed : e.runs_regressed;
  const largest = kind === "box" ? e.largest_box_regression : e.largest_run_regression;
  const top = [...(kind === "box" ? e.top_box_regressions : e.top_run_regressions)];
  if (largest && !top.some((x) => x.path === largest.path && x.text === largest.text)) {
    top.push({ ...largest, largest: true });
  }
  if (n === undefined) return "";
  const lost = kind === "box" && e.boxes_lost ? `; ${e.boxes_lost} lost` : "";
  if (!n) return `0${lost}`;
  return `${n}${lost}: ${top
    .map(
      (x) =>
        `${x.largest ? "largest: " : ""}${kind === "box" ? shortPath(x.path) : `"${x.text.slice(0, 20)}"`} ${x.kind === "overshoot" ? "overshoot " : ""}${x.coord} ${num(x.from)}→${num(x.to)}`,
    )
    .join("; ")}`;
}

export function renderMarkdown({ fixture, label, env, parity, result }) {
  let md = `# Layout diff — ${fixture} (${label})\n\n> ${SCOPE_NOTE}\n\n`;
  md += checksBanner(result);
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
  md += checksSection(result);
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
      ...(result.unrounded_layers ?? ["B0u"]).map((n) => [n, "blitz-unrounded", LAYER_DOCS[n]]),
    ],
  );
  md += `\nTolerance: box ${result.config.tolerance} px, text ${result.config.textTolerance} px. `;
  md +=
    "Box events: ENTER checks x/y/width (top-down), EXIT checks height (bottom-up, so html/body are not 'first' just because they absorb descendants' error). Text runs are checked between a box's enter and exit.\n\n";
  md += `${ATTRIBUTION_NOTE}\n\n`;
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
  const pr = result.headline.first_pass_regression ?? {};
  md += divergenceSection(
    "First box event a layout_normalize pass regressed",
    pr.box,
    result,
    "None: no pass worsened, overshot or lost any box event by more than tolerance.",
  );
  md += divergenceSection(
    "First text run a layout_normalize pass regressed",
    pr.text,
    result,
    "None: no pass worsened or overshot any text run by more than tolerance.",
  );
  md += divergenceSection(
    "First box event vellora's walk (L0) regressed vs Blitz (B0)",
    result.headline.first_walk_regression?.box,
    result,
    "None: L0 never worsened, overshot or lost a box event vs B0 by more than tolerance.",
  );
  if (result.headline.first_html_normalize_regression) {
    md += divergenceSection(
      "First box event html_normalize regressed (B0 vs N0)",
      result.headline.first_html_normalize_regression.box,
      result,
      "None: B0 never worsened, overshot or lost a box event vs N0 by more than tolerance.",
    );
  }
  md += missingSection(result);
  md += regressionSection(result);
  md += "## First divergence per layer\n\n";
  md +=
    "The first event over tolerance (or lost) IN each layer. After the document's natural first divergence every layer usually repeats the same event; use `Regressions by layer` for what each layer changed.\n\n";
  md += table(
    ["layer", "first box", "box Δ", "first text", "text Δ (dx, dy)"],
    result.layers.map((l) => {
      const f = result.first_divergence_by_layer[l.name];
      const b = f.box;
      const t = f.text;
      const bv = b?.per_layer[l.name];
      const tv = t?.per_layer[l.name];
      const blitz = l.kind === "blitz" || l.kind === "blitz-source";
      return [
        l.name,
        b ? eventLabel(b) : "—",
        bv?.status === "missing"
          ? "box lost"
          : bv
            ? [bv.dx, bv.dy, bv.dw, bv.dh]
                .filter((v) => v !== undefined)
                .map(num)
                .join(", ")
            : "",
        t ? eventLabel(t) : blitz ? "n/a (no text in Blitz trees)" : "—",
        tv ? `${num(tv.dx)}, ${num(tv.dy)}` : "",
      ];
    }),
  );
  md += "\n## Per-layer error and layer effects\n\n";
  md +=
    "`moved` = boxes/runs whose geometry this layer changed vs the previous one; `better`/`worse` = max |Δ| per item moved closer to / further from Chromium; `Σ` = summed change of that max |Δ| (a few large improvements can make it negative while one box regresses); `regressed` = items this layer worsened or overshot on some coordinate by more than tolerance (classifyStep), NAMED: the first three in document order (boxes that only absorbed or followed a regressed box's change rank last) and the largest.\n\n";
  md += table(
    [
      "layer",
      "box events diverged",
      "text events diverged",
      "mean abs box Δ (px)",
      "boxes moved/better/worse (Σ)",
      "boxes regressed (largest)",
      "runs moved/better/worse (Σ)",
      "runs regressed (largest)",
    ],
    result.layer_stats.map((s) => {
      const e = s.effect_vs_previous;
      const blitz = s.kind === "blitz" || s.kind === "blitz-source";
      return [
        s.layer,
        s.box_events_diverged,
        blitz ? "n/a" : s.text_events_diverged,
        num(s.mean_abs_box_error),
        effectText(e, "box"),
        regressedNames(e, "box"),
        effectText(e, "run"),
        regressedNames(e, "run"),
      ];
    }),
  );
  md += `\n## Top ${result.config.top} box divergences in ${result.final_layer} (absolute)\n\n`;
  md += table(
    ["path", "dx", "dy", "dw", "dh", "regressed by", "first over tol.", "dominant (step)", "steps"],
    result.top_boxes.map((b) => [
      shortPath(b.path),
      num(b.delta.dx),
      num(b.delta.dy),
      num(b.delta.dw),
      num(b.delta.dh),
      regressedText(b.regressed_by),
      firstOverTol(b) ?? "",
      dominantText(b),
      stepsText(b.steps),
    ]),
  );
  md += `\n## Top ${result.config.top} LOCAL box divergences\n\n`;
  md +=
    "rdx/rdy = the error a box ADDS to what it inherits: after a previous compared sibling in the same row, relative to that sibling's right edge (dx+dw) and dy; after a stacked sibling, relative to its bottom edge (dy+dh); a first child, relative to its parent's dx/dy. Isolates where cumulative drift originates.\n\n";
  md += table(
    ["path", "rdx", "rdy", "dw", "dh", "regressed by", "first over tol.", "dominant (step)"],
    result.top_local_boxes.map((b) => [
      shortPath(b.path),
      num(b.local.rdx),
      num(b.local.rdy),
      num(b.delta.dw),
      num(b.delta.dh),
      regressedText(b.regressed_by),
      firstOverTol(b) ?? "",
      dominantText(b),
    ]),
  );
  md += `\n## Top ${result.config.top} text-run divergences in ${result.final_layer}\n\n`;
  md += table(
    [
      "owner",
      "text",
      "dx",
      "dy",
      "dw",
      "dright",
      "faces",
      "regressed by",
      "first over tol.",
      "dominant (step)",
    ],
    result.top_text.map((t) => [
      shortPath(t.owner),
      t.text.length > 48 ? `${t.text.slice(0, 45)}...` : t.text,
      num(t.delta?.dx),
      num(t.delta?.dy),
      num(t.delta?.dw),
      num(t.delta?.dright),
      t.faces.join(" "),
      regressedText(t.regressed_by),
      firstOverTol(t) ?? "",
      dominantText(t),
    ]),
  );
  if (result.top_local_text) {
    md += `\n## Top ${result.config.top} LOCAL text-run divergences\n\n`;
    md +=
      "rdx/rdy = the run's Δ minus its owner box's dx/dy (final layer), so runs that only ride along with a shifted owner rank low (de-duplicates cascades, like the local box table).\n\n";
    md += table(
      [
        "owner",
        "text",
        "rdx",
        "rdy",
        "dx",
        "dy",
        "regressed by",
        "first over tol.",
        "dominant (step)",
      ],
      result.top_local_text.map((t) => [
        shortPath(t.owner),
        t.text.length > 48 ? `${t.text.slice(0, 45)}...` : t.text,
        num(t.local?.rdx),
        num(t.local?.rdy),
        num(t.delta?.dx),
        num(t.delta?.dy),
        regressedText(t.regressed_by),
        firstOverTol(t) ?? "",
        dominantText(t),
      ]),
    );
  }
  md += `\n${marginSection(result)}`;
  const c = result.counts;
  md += "\n## Match counts and node policy\n\n";
  md += `- Chromium elements under html (head excluded) by policy: ${Object.entries(
    c.chrome_elements_by_policy,
  )
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}\n`;
  md += `- vellora L0 boxes (elements, head excluded): ${c.vellora_l0_boxes}; matched to a compared Chromium box: ${c.matched_boxes}${c.source_tree_compared_boxes === null || c.source_tree_compared_boxes === undefined ? "" : `; compared Chromium boxes present in N0: ${c.source_tree_compared_boxes}`}\n`;
  for (const [k, v] of Object.entries(c.vellora_only)) {
    md += `- vellora-only — ${k}: ${v.count} (e.g. ${v.sample.slice(0, 3).map(shortPath).join("; ")})\n`;
  }
  md += `- Chromium-only compared boxes (no vellora L0 box): ${c.chrome_only_compared.count}${c.chrome_only_compared.count ? ` (e.g. ${c.chrome_only_compared.sample.slice(0, 3).map(shortPath).join("; ")})` : ""}\n`;
  md += `- Blitz layout-tree-only nodes (anonymous blocks / pseudo-elements the walk never visits): ${c.blitz_tree_only.count}${c.blitz_tree_only.count ? ` (e.g. ${c.blitz_tree_only.sample.slice(0, 3).map(shortPath).join("; ")})` : ""}\n`;
  md +=
    "- Policy: `inline-text-only` = Chromium `display:inline` non-replaced element (Blitz gives it no Taffy box; its text is compared as runs). `no-blitz-box` = table row/row-group that is not a Blitz layout node (zero box in the walk); listed, not scored. `no-layout` = Chromium has no layout object (display:none). Pseudo-elements are matched by `::before`/`::after` segments and never count toward `:nth-child`; their generated text is compared like any text. Anonymous boxes: Chromium's are not exposed by DOMSnapshot; Blitz's appear only in N0/B0 as `::blitz-anon(j)`. html_normalize wrappers are transparent in keys and listed as vellora-only.\n";
  const t = result.text;
  md += "\n## Text alignment\n\n";
  md += `- vellora runs (non-blank, L0): ${t.vellora_runs}; Chromium text fragments (non-blank): ${t.chrome_fragments}${t.chrome_generated_fragments ? ` (${t.chrome_generated_fragments} generated by pseudo-elements)` : ""}; matched pairs: ${t.matched_pairs} (${t.joined_pairs} joined across fragment/run boundaries)\n`;
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
      ["owner", "text", "generated"],
      t.unmatched_chrome_fragments
        .slice(0, 10)
        .map((r) => [shortPath(r.owner), r.text, r.generated ? "yes" : ""]),
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
  md +=
    "- A layer that moves a box TOWARDS Chromium is an improvement here, whatever its cause; for 'what did this code change do', compare two builds with compare.mjs.\n";
  return md;
}

export function renderSummaryMarkdown({ label, env, rows }) {
  let md = `# Layout diff summary (${label})\n\n> ${SCOPE_NOTE}\n\n`;
  const failing = rows.filter((r) => r.result.checks_summary?.failed.length);
  if (failing.length) {
    md += `> **WARNING — CHECKS FAILED** in ${failing
      .map(
        (r) =>
          `${r.fixture} (${r.result.checks_summary.failed.join(", ")}${r.result.checks_summary.input_parity_ok ? "" : "; INPUT PARITY: attribution INVALID"})`,
      )
      .join("; ")}. See the checks table below and each fixture's report.\n\n`;
  }
  md += `- date: \`${env.date_utc}\`; blitz: \`${env.blitz}\`; commit: \`${env.git_commit}\` (${env.git_dirty}); chrome: \`${env.chrome_version}\`; node: \`${env.node}\`; rustc: \`${env.rustc}\`\n`;
  md += `- command: \`${env.command}\`\n\n`;
  const ids = [...new Set(rows.flatMap((r) => (r.result.checks ?? []).map((c) => c.id)))];
  if (ids.length) {
    md += "## Checks\n\n";
    md += table(
      ["check", ...rows.map((r) => r.fixture)],
      ids.map((id) => [
        id,
        ...rows.map((r) => {
          const c = r.result.checks?.find((x) => x.id === id);
          return c ? (c.status === "fail" ? "**FAIL**" : c.status) : "";
        }),
      ]),
    );
    md += "\n";
  }
  md += `${ATTRIBUTION_NOTE}\n\n`;
  md += "## Natural first divergence (final layer)\n\n";
  md += table(
    [
      "fixture",
      "html_normalize",
      "first divergent box",
      "Δ",
      "regressed by",
      "first over tol.",
      "first divergent text run",
      "text Δ (dx, dy)",
      "regressed by",
      "matched boxes",
    ],
    rows.map((r) => {
      const b = r.result.headline.box;
      const t = r.result.headline.text;
      const bv = b?.per_layer[r.result.final_layer];
      const tv = t?.per_layer[r.result.final_layer];
      const hn = r.result.html_normalize;
      const invalid =
        r.result.checks_summary && !r.result.checks_summary.input_parity_ok
          ? " (INVALID: input parity)"
          : "";
      return [
        r.fixture,
        hn
          ? `${hn.dom_altered ? "altered DOM" : "no change"}${hn.source_layer ? "; N0 run" : "; N0 NOT run"}`
          : "",
        b ? eventLabel(b) : "none",
        bv?.status === "missing"
          ? "box lost"
          : bv
            ? [bv.dx, bv.dy, bv.dw, bv.dh]
                .filter((v) => v !== undefined)
                .map(num)
                .join(", ")
            : "",
        `${regressedText(b?.regressed_by)}${invalid}`,
        firstOverTol(b) ?? "",
        t ? eventLabel(t) : "none",
        tv ? `${num(tv.dx)}, ${num(tv.dy)}` : "",
        regressedText(t?.regressed_by),
        `${r.result.counts.matched_boxes}/${r.result.counts.vellora_l0_boxes}`,
      ];
    }),
  );
  md +=
    "\n## Regressions per layer after the first layer (events that layer made worse than the previous layer)\n\n";
  md += table(
    [
      "fixture",
      "box events regressed, by layer",
      "text runs regressed, by layer",
      "first box a pass regressed",
      "first text run a pass regressed",
    ],
    rows.map((r) => {
      const reg = r.result.regressions_by_layer ?? {};
      const later = r.result.layers.slice(1).map((l) => l.name);
      const passes = r.result.layers.filter((l) => l.kind === "pass").map((l) => l.name);
      const count = (name, key) =>
        reg[name]?.[`${key}_events_vs_previous_layer`] ?? reg[name]?.[`${key}_events`] ?? 0;
      const fmt = (key) =>
        later
          .map((p) => [p, count(p, key)])
          .filter(([, n]) => n)
          .map(([p, n]) => `${p} ${n}`)
          .join(", ") || "0";
      const pr = r.result.headline.first_pass_regression ?? {};
      const labelOf = (e) =>
        e
          ? `${eventLabel(e)} (${regressedText(e.regressed_by.filter((w) => passes.includes(w.layer)))})`
          : "none";
      return [r.fixture, fmt("box"), fmt("text"), labelOf(pr.box), labelOf(pr.text)];
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
