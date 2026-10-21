// Layout-tree matcher: aligns the Chromium continuous-flow snapshot with every vellora layer by
// DOM path and finds where (and in which layer) vellora first diverges.
//
// Event order (what "first" means): a pre-order walk of the Chromium element tree where each
// compared box contributes an ENTER event (x, y, width: decided top-down by the containing block and
// preceding siblings), then TEXT events for the runs it owns, then its children, then an EXIT event
// (height: decided bottom-up by its content). Checking height on exit keeps html/body from always
// being "first" just because their height absorbs every descendant's error.
import { baselineKey } from "./chrome-snapshot.mjs";
import { chromeFontFor } from "./fonts.mjs";
import { attributionChain, normText } from "./vellora-model.mjs";

/** Replaced elements keep a real box when display:inline; other inline boxes are text-only. */
export const REPLACED_TAGS = new Set([
  "img",
  "svg",
  "video",
  "canvas",
  "iframe",
  "object",
  "embed",
  "input",
  "select",
  "textarea",
  "button",
]);

const LOOKAHEAD = 12;

function round(v) {
  return Number.isFinite(v) ? Math.round(v * 1000) / 1000 : null;
}

function boxDelta(v, c) {
  return { dx: round(v.x - c.x), dy: round(v.y - c.y), dw: round(v.w - c.w), dh: round(v.h - c.h) };
}

function maxAbs(...values) {
  return Math.max(0, ...values.filter(Number.isFinite).map(Math.abs));
}

/** Chromium records -> policy-classified element tree + text fragments. */
export function chromeTree(records, { includeInline = false } = {}) {
  const elements = [];
  const byRecord = new Map();
  records.forEach((r, i) => {
    if (r.kind !== "element" && r.kind !== "pseudo") return;
    if (r.path === "html>head:nth-child(1)" || r.path.startsWith("html>head:nth-child(1)>")) return;
    let policy = "compared";
    if (!r.box) policy = "no-layout";
    else if (r.kind === "pseudo") policy = "compared";
    else if (r.display === "inline" && !REPLACED_TAGS.has(r.tag) && !includeInline) {
      policy = "inline-text-only";
    } else if (r.display === "contents") policy = "no-box";
    const el = { ...r, policy, children: [], parentEl: null };
    byRecord.set(i, el);
    elements.push(el);
  });
  for (const el of elements) {
    let p = el.parent;
    while (p !== null && p !== undefined && !byRecord.has(p)) p = records[p]?.parent;
    if (p !== null && p !== undefined) {
      el.parentEl = byRecord.get(p);
      el.parentEl.children.push(el);
    }
  }
  const textNodes = records
    .map((r, i) => ({ ...r, idx: i }))
    .filter((r) => r.kind === "text" && r.fragments.length > 0);
  return { elements, roots: elements.filter((e) => !e.parentEl), byRecord, textNodes, records };
}

/** Distinct (Chrome family, weight, size) specs needed to calibrate baselines for these runs. */
export function baselineSpecs(runs) {
  const specs = new Map();
  for (const run of runs) {
    const font = chromeFontFor(run.face);
    if (!font || !Number.isFinite(run.fontSize)) continue;
    const spec = { ...font, size: run.fontSize };
    specs.set(baselineKey(spec), spec);
  }
  return [...specs.values()];
}

/** Group Chromium text fragments under vellora owner keys (nearest ancestor that owns runs). */
function groupChromeText(tree, ownerKeys) {
  const groups = new Map();
  const orphans = [];
  for (const t of tree.textNodes) {
    let p = t.parent;
    let owner = null;
    while (p !== null && p !== undefined) {
      const rec = tree.records[p];
      if (rec && ownerKeys.has(rec.path)) {
        owner = rec.path;
        break;
      }
      p = rec?.parent;
    }
    for (const f of t.fragments) {
      const frag = { ...f, norm: normText(f.text), textPath: t.path };
      if (!frag.norm) continue;
      if (owner) {
        if (!groups.has(owner)) groups.set(owner, []);
        groups.get(owner).push(frag);
      } else {
        orphans.push({ path: t.path, text: f.text, x: f.x, y: f.y, w: f.w, h: f.h });
      }
    }
  }
  return { groups, orphans };
}

function unionFrag(frags) {
  const x = Math.min(...frags.map((f) => f.x));
  const y = Math.min(...frags.map((f) => f.y));
  const r = Math.max(...frags.map((f) => f.x + f.w));
  const b = Math.max(...frags.map((f) => f.y + f.h));
  return { x, y, w: r - x, h: b - y, text: frags.map((f) => f.text).join(""), parts: frags.length };
}

/**
 * Align vellora runs (one owner group, L0 order) with Chromium fragments by normalized text.
 * Exact 1:1 first; otherwise consecutive same-line fragments (or runs) may be joined when their
 * concatenated text is equal (e.g. two text nodes Chromium keeps apart but Parley shapes as one run).
 */
export function alignRuns(runs, frags) {
  const pairs = [];
  const unmatchedRuns = [];
  const used = new Set();
  let j = 0;
  let i = 0;
  const sameLine = (a, b) => Math.abs(a.y - b.y) < 2;
  const take = (run, k) => {
    // Exact 1:1.
    if (frags[k].norm === run.norm) {
      used.add(frags[k]);
      pairs.push({ runs: [run], frag: frags[k], joined: false });
      return { next: k + 1, consumedRuns: 0 };
    }
    // Several Chromium fragments on one line == this run.
    if (run.norm.startsWith(frags[k].norm)) {
      const parts = [frags[k]];
      for (let m = k + 1; m < frags.length && sameLine(frags[m], frags[k]); m += 1) {
        parts.push(frags[m]);
        const acc = normText(parts.map((p) => p.text).join(""));
        if (acc === run.norm) {
          for (const p of parts) used.add(p);
          pairs.push({ runs: [run], frag: unionFrag(parts), joined: true });
          return { next: m + 1, consumedRuns: 0 };
        }
        if (!run.norm.startsWith(acc)) break;
      }
    }
    // Several vellora runs on one line == this fragment.
    if (frags[k].norm.startsWith(run.norm)) {
      const parts = [run];
      for (let m = i + 1; m < runs.length && runs[m].line === run.line; m += 1) {
        parts.push(runs[m]);
        const acc = normText(parts.map((p) => p.text).join(""));
        if (acc === frags[k].norm) {
          used.add(frags[k]);
          pairs.push({ runs: parts, frag: frags[k], joined: true });
          return { next: k + 1, consumedRuns: m - i };
        }
        if (!frags[k].norm.startsWith(acc)) break;
      }
    }
    return null;
  };
  while (i < runs.length) {
    const run = runs[i];
    if (!run.norm) {
      i += 1;
      continue;
    }
    let hit = null;
    for (let k = j; k < Math.min(frags.length, j + LOOKAHEAD) && !hit; k += 1) {
      hit = take(run, k);
    }
    if (hit) {
      j = hit.next;
      i += hit.consumedRuns;
    } else {
      unmatchedRuns.push(run);
    }
    i += 1;
  }
  const unmatchedFrags = frags.filter((f) => !used.has(f));
  return { pairs, unmatchedRuns, unmatchedFrags };
}

/** Geometry of a (possibly joined) vellora run group in one layer. */
function runGeom(layer, runKeys) {
  const runs = runKeys.map((k) => layer.runIndex.get(k)).filter(Boolean);
  if (runs.length !== runKeys.length) return null;
  const x = Math.min(...runs.map((r) => r.x));
  const right = Math.max(...runs.map((r) => r.x + r.w));
  return { x, w: right - x, top: Math.min(...runs.map((r) => r.top)), baseline: runs[0].baseline };
}

export function diffLayouts({
  chrome,
  vellora,
  baselines = null,
  tolerance = 0.5,
  textTolerance = 0.5,
  includeInline = false,
  top = 20,
}) {
  const chain = attributionChain(vellora);
  const unrounded = vellora.layers.find((l) => l.name === "B0u");
  for (const layer of vellora.layers) {
    layer.runIndex = new Map(layer.runs.map((r) => [r.key, r]));
  }
  const final = chain[chain.length - 1];
  const tree = chromeTree(chrome, { includeInline });
  const l0 = vellora.layers.find((l) => l.name === "L0");
  const b0 = vellora.layers.find((l) => l.name === "B0");
  // Table rows / row groups are not Taffy nodes in Blitz (cells are laid out directly by the
  // table): absent from Blitz's layout tree and a zero-size box in vellora's walk. There is no
  // geometry to compare, so they are listed, not scored (their cells are compared).
  for (const el of tree.elements) {
    const v = l0.boxes.get(el.path);
    if (el.policy === "compared" && !b0.boxes.has(el.path) && v && v.w === 0 && v.h === 0) {
      el.policy = "no-blitz-box";
    }
  }
  const chromeAscent = (run) => {
    const font = chromeFontFor(run.face);
    if (!font || !baselines) return null;
    return baselines.get(baselineKey({ ...font, size: run.fontSize }))?.ascent ?? null;
  };

  // ---- text alignment (done once on L0; runs keep their key across layers) ----
  const { groups, orphans } = groupChromeText(tree, vellora.ownerKeys);
  const runsByOwner = new Map();
  for (const run of l0.runs) {
    if (!runsByOwner.has(run.owner)) runsByOwner.set(run.owner, []);
    runsByOwner.get(run.owner).push(run);
  }
  const textPairsByOwner = new Map();
  const textStats = {
    vellora_runs: l0.runs.filter((r) => r.norm).length,
    chrome_fragments: [...groups.values()].reduce((n, g) => n + g.length, 0) + orphans.length,
    matched_pairs: 0,
    joined_pairs: 0,
    unmatched_vellora_runs: [],
    unmatched_chrome_fragments: [],
    chrome_text_without_vellora_owner: orphans,
  };
  for (const [owner, runs] of runsByOwner) {
    const frags = groups.get(owner) ?? [];
    const { pairs, unmatchedRuns, unmatchedFrags } = alignRuns(runs, frags);
    textPairsByOwner.set(owner, pairs);
    textStats.matched_pairs += pairs.length;
    textStats.joined_pairs += pairs.filter((p) => p.joined).length;
    for (const r of unmatchedRuns) {
      textStats.unmatched_vellora_runs.push({
        owner,
        text: r.text,
        x: round(r.x),
        top: round(r.top),
      });
    }
    for (const f of unmatchedFrags) {
      textStats.unmatched_chrome_fragments.push({ owner, text: f.text, x: f.x, y: f.y });
    }
  }
  for (const [owner, frags] of groups) {
    if (!runsByOwner.has(owner)) {
      for (const f of frags) {
        textStats.unmatched_chrome_fragments.push({ owner, text: f.text, x: f.x, y: f.y });
      }
    }
  }

  // ---- events ----
  const events = [];
  const boxRows = new Map();
  const comparedChildren = new Map();
  const visit = (el, comparedAncestor) => {
    let compared = comparedAncestor;
    if (el.policy === "compared") {
      const siblings = comparedChildren.get(comparedAncestor) ?? [];
      comparedChildren.set(comparedAncestor, siblings);
      const prev = siblings.at(-1) ?? null;
      siblings.push(el.path);
      const row = {
        path: el.path,
        tag: el.tag,
        chrome: el.box,
        parent: comparedAncestor,
        prev,
        layers: {},
      };
      for (const layer of [...chain, unrounded]) {
        const v = layer.boxes.get(el.path);
        row.layers[layer.name] = v
          ? { x: v.x, y: v.y, w: v.w, h: v.h, ...boxDelta(v, el.box) }
          : null;
      }
      boxRows.set(el.path, row);
      events.push({ type: "enter", path: el.path });
      compared = el.path;
    }
    for (const pair of textPairsByOwner.get(el.path) ?? []) {
      events.push({ type: "text", path: el.path, pair });
    }
    for (const child of el.children) visit(child, compared);
    if (el.policy === "compared") events.push({ type: "exit", path: el.path });
  };
  for (const root of tree.roots) visit(root, null);

  const evalEvent = (event, layer) => {
    if (event.type === "text") {
      if (layer.kind === "blitz") return { status: "n/a" };
      const g = runGeom(
        layer,
        event.pair.runs.map((r) => r.key),
      );
      if (!g) return { status: "missing" };
      const f = event.pair.frag;
      const ascent = chromeAscent(event.pair.runs[0]);
      const d = {
        dx: round(g.x - f.x),
        // Baseline vs baseline when Chrome's ascent for this face/size was measured; otherwise
        // vellora's text top (baseline - Parley ascent) vs Chrome's text-box top.
        dy: round(ascent === null ? g.top - f.y : g.baseline - (f.y + ascent)),
        dy_basis: ascent === null ? "top-parley-ascent" : "baseline",
        dw: round(g.w - f.w),
        dright: round(g.x + g.w - (f.x + f.w)),
      };
      return { status: maxAbs(d.dx, d.dy) > textTolerance ? "diverged" : "ok", ...d };
    }
    const row = boxRows.get(event.path);
    const v = row.layers[layer.name];
    if (!v) return { status: "missing" };
    if (event.type === "enter") {
      const m = maxAbs(v.dx, v.dy, v.dw);
      return { status: m > tolerance ? "diverged" : "ok", dx: v.dx, dy: v.dy, dw: v.dw };
    }
    return { status: Math.abs(v.dh) > tolerance ? "diverged" : "ok", dh: v.dh };
  };

  const describe = (event) => {
    if (event.type !== "text") return { type: event.type, path: event.path };
    const f = event.pair.frag;
    return {
      type: "text",
      owner: event.path,
      text: event.pair.runs.map((r) => r.text).join(""),
      chrome_text: f.text,
      chrome: { x: f.x, y: f.y, w: f.w, h: f.h },
      faces: [...new Set(event.pair.runs.map((r) => r.face))],
      joined: event.pair.joined,
    };
  };

  const evaluated = events.map((event, order) => {
    const perLayer = {};
    for (const layer of chain) perLayer[layer.name] = evalEvent(event, layer);
    if (event.type !== "text") perLayer.B0u = evalEvent(event, unrounded);
    return { order, event, perLayer };
  });

  const introducedBy = (perLayer, eventType) => {
    for (const layer of chain) {
      if (eventType === "text" && layer.kind === "blitz") continue;
      if (perLayer[layer.name]?.status === "diverged") return layer.name;
    }
    return null;
  };

  const ancestorsOf = (path) => {
    const out = [];
    const row = boxRows.get(path);
    let p = row?.parent ?? null;
    while (p) {
      const r = boxRows.get(p);
      out.unshift({
        path: p,
        [final.name]: pick(r.layers[final.name]),
        B0: pick(r.layers.B0),
        L0: pick(r.layers.L0),
      });
      p = r.parent;
    }
    return out;
  };

  const firstDivergence = (layerName, kind) => {
    const hit = evaluated.find(
      (e) =>
        (kind === "text" ? e.event.type === "text" : e.event.type !== "text") &&
        e.perLayer[layerName]?.status === "diverged",
    );
    if (!hit) return null;
    const ownerPath = hit.event.path;
    return {
      order: hit.order,
      ...describe(hit.event),
      introduced_by: introducedBy(hit.perLayer, hit.event.type),
      changed_by: changedBy(hit.perLayer),
      per_layer: hit.perLayer,
      ancestors: ancestorsOf(ownerPath),
    };
  };

  /** Layers (after the first) that changed this event's max |Δ| by more than 0.01 px. */
  const changedBy = (perLayer) => {
    const out = [];
    let prev = null;
    for (const layer of chain) {
      const v = perLayer[layer.name];
      if (!v || (v.status !== "ok" && v.status !== "diverged")) continue;
      const m = maxAbs(v.dx, v.dy, v.dw, v.dh);
      if (prev && Math.abs(m - prev.m) > 0.01) {
        out.push({ layer: layer.name, from: round(prev.m), to: round(m) });
      }
      prev = { m };
    }
    return out;
  };

  const firstByLayer = {};
  for (const layer of chain) {
    firstByLayer[layer.name] = {
      box: firstDivergence(layer.name, "box"),
      text: layer.kind === "blitz" ? null : firstDivergence(layer.name, "text"),
    };
  }

  // ---- per-box ranking ----
  const boxIntroduced = (row) => {
    for (const layer of chain) {
      const v = row.layers[layer.name];
      if (v && maxAbs(v.dx, v.dy, v.dw, v.dh) > tolerance) return layer.name;
    }
    return null;
  };
  const rows = [...boxRows.values()];
  const ranked = rows
    .filter((r) => r.layers[final.name])
    .map((r) => {
      // LOCAL delta: the error this box adds on top of what it inherits. A box placed after a
      // previous compared sibling inherits that sibling's end edge (same row: its right edge;
      // stacked: its bottom edge); a first child inherits its parent's offset.
      const v = r.layers[final.name];
      const parent = r.parent ? boxRows.get(r.parent)?.layers[final.name] : null;
      const prevRow = r.prev ? boxRows.get(r.prev) : null;
      const pv = prevRow?.layers[final.name];
      const sameRow =
        prevRow && Math.abs(prevRow.chrome.y - r.chrome.y) < 1 && prevRow.chrome.x < r.chrome.x;
      const baseX = sameRow && pv ? pv.dx + pv.dw : (parent?.dx ?? 0);
      const baseY = pv ? (sameRow ? pv.dy : pv.dy + pv.dh) : (parent?.dy ?? 0);
      const rdx = round(v.dx - baseX);
      const rdy = round(v.dy - baseY);
      return {
        path: r.path,
        chrome: r.chrome,
        delta: pick(v),
        local: { rdx, rdy },
        magnitude: round(maxAbs(v.dx, v.dy, v.dw, v.dh)),
        local_magnitude: round(maxAbs(rdx, rdy, v.dw, v.dh)),
        introduced_by: boxIntroduced(r),
      };
    });
  const topBoxes = [...ranked].sort((a, b) => b.magnitude - a.magnitude).slice(0, top);
  const topLocal = [...ranked].sort((a, b) => b.local_magnitude - a.local_magnitude).slice(0, top);
  const textEvents = evaluated.filter((e) => e.event.type === "text");
  const topText = textEvents
    .map((e) => ({
      ...describe(e.event),
      delta: e.perLayer[final.name],
      magnitude: round(maxAbs(e.perLayer[final.name]?.dx, e.perLayer[final.name]?.dy)),
      introduced_by: introducedBy(e.perLayer, "text"),
    }))
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, top);

  // ---- per-layer stats and pass effects ----
  const layerStats = chain.map((layer, index) => {
    const statuses = evaluated.map((e) => e.perLayer[layer.name]?.status);
    const boxEvents = evaluated.filter((e) => e.event.type !== "text");
    const stat = {
      layer: layer.name,
      kind: layer.kind,
      events: statuses.filter((s) => s === "ok" || s === "diverged").length,
      diverged: statuses.filter((s) => s === "diverged").length,
      box_events_diverged: boxEvents.filter((e) => e.perLayer[layer.name]?.status === "diverged")
        .length,
      text_events_diverged: textEvents.filter((e) => e.perLayer[layer.name]?.status === "diverged")
        .length,
      missing: statuses.filter((s) => s === "missing").length,
      mean_abs_box_error: round(
        mean(
          rows
            .map((r) => r.layers[layer.name])
            .filter(Boolean)
            .map((v) => maxAbs(v.dx, v.dy, v.dw, v.dh)),
        ),
      ),
    };
    if (index > 0) {
      const prev = chain[index - 1];
      stat.effect_vs_previous = passEffect(rows, textEvents, prev, layer, evalEvent);
    }
    return stat;
  });

  // ---- match counts ----
  const chromeCounts = countBy(tree.elements.map((e) => e.policy));
  const l0Paths = [...l0.boxes.keys()].filter(
    (p) => p !== "html>head:nth-child(1)" && !p.startsWith("html>head:nth-child(1)>"),
  );
  const chromeByPath = new Map(tree.elements.map((e) => [e.path, e]));
  const velloraOnly = {};
  let matched = 0;
  for (const path of l0Paths) {
    const el = chromeByPath.get(path);
    if (el?.policy === "compared") {
      matched += 1;
      continue;
    }
    const node = vellora.nodesByPath.get(path);
    const category = node?.synthetic
      ? "html_normalize wrapper (no source node)"
      : el?.policy === "no-layout"
        ? "display:none in Chromium (vellora zero box)"
        : el?.policy === "inline-text-only"
          ? "inline element (compared via text runs)"
          : el?.policy === "no-blitz-box"
            ? "table row/group: not a Blitz layout node (zero box in walk)"
            : !el
              ? "no Chromium node with this path"
              : `chromium policy ${el.policy}`;
    velloraOnly[category] = [...(velloraOnly[category] ?? []), path];
  }
  const chromeOnly = tree.elements
    .filter((e) => e.policy === "compared" && !l0.boxes.has(e.path))
    .map((e) => e.path);
  const b0Only = [...chain[0].boxes.keys()].filter((p) => !l0.boxes.has(p));

  return {
    schema: "vellora-layout-diff/1",
    config: { tolerance, textTolerance, includeInline, top },
    layers: chain.map((l) => ({ name: l.name, kind: l.kind })),
    final_layer: final.name,
    // The first divergent BOX (enter: x/y/w, exit: h) and, separately, the first divergent TEXT
    // run in the final pre-pagination layer, each with the layer that introduced it.
    headline: firstByLayer[final.name],
    first_divergence_by_layer: firstByLayer,
    layer_stats: layerStats,
    top_boxes: topBoxes,
    top_local_boxes: topLocal,
    top_text: topText,
    counts: {
      chrome_elements_by_policy: chromeCounts,
      vellora_l0_boxes: l0Paths.length,
      matched_boxes: matched,
      vellora_only: Object.fromEntries(
        Object.entries(velloraOnly).map(([k, v]) => [
          k,
          { count: v.length, sample: v.slice(0, 8) },
        ]),
      ),
      chrome_only_compared: { count: chromeOnly.length, sample: chromeOnly.slice(0, 12) },
      blitz_tree_only: { count: b0Only.length, sample: b0Only.slice(0, 12) },
    },
    text: {
      ...textStats,
      unmatched_vellora_runs: textStats.unmatched_vellora_runs.slice(0, 40),
      unmatched_chrome_fragments: textStats.unmatched_chrome_fragments.slice(0, 40),
      chrome_text_without_vellora_owner: orphans.slice(0, 40),
      unmatched_vellora_runs_total: textStats.unmatched_vellora_runs.length,
      unmatched_chrome_fragments_total: textStats.unmatched_chrome_fragments.length,
      chrome_text_without_vellora_owner_total: orphans.length,
    },
    boxes: rows.map((r) => ({
      path: r.path,
      chrome: r.chrome,
      layers: Object.fromEntries(Object.entries(r.layers).map(([k, v]) => [k, pick(v)])),
    })),
    text_events: textEvents.map((e) => ({ ...describe(e.event), per_layer: e.perLayer })),
  };
}

function pick(v) {
  return v ? { dx: v.dx, dy: v.dy, dw: v.dw, dh: v.dh } : null;
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function countBy(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** How a layer changed error vs the previous layer, for boxes and text runs. */
function passEffect(rows, textEvents, prev, layer, evalEvent) {
  const eff = {
    boxes_moved: 0,
    boxes_improved: 0,
    boxes_worsened: 0,
    box_error_delta: 0,
    runs_moved: 0,
    runs_improved: 0,
    runs_worsened: 0,
    run_error_delta: 0,
  };
  for (const r of rows) {
    const a = r.layers[prev.name];
    const b = r.layers[layer.name];
    if (!a || !b) continue;
    const moved = ["x", "y", "w", "h"].some((k) => Math.abs(a[k] - b[k]) > 0.01);
    if (!moved) continue;
    eff.boxes_moved += 1;
    const ea = maxAbs(a.dx, a.dy, a.dw, a.dh);
    const eb = maxAbs(b.dx, b.dy, b.dw, b.dh);
    eff.box_error_delta += eb - ea;
    if (eb < ea - 0.01) eff.boxes_improved += 1;
    else if (eb > ea + 0.01) eff.boxes_worsened += 1;
  }
  if (prev.kind !== "blitz") {
    for (const e of textEvents) {
      const a = evalEvent(e.event, prev);
      const b = evalEvent(e.event, layer);
      if (!Number.isFinite(a.dx) || !Number.isFinite(b.dx)) continue;
      if (Math.abs(a.dx - b.dx) <= 0.01 && Math.abs(a.dy - b.dy) <= 0.01) continue;
      eff.runs_moved += 1;
      const ea = maxAbs(a.dx, a.dy);
      const eb = maxAbs(b.dx, b.dy);
      eff.run_error_delta += eb - ea;
      if (eb < ea - 0.01) eff.runs_improved += 1;
      else if (eb > ea + 0.01) eff.runs_worsened += 1;
    }
  }
  eff.box_error_delta = round(eff.box_error_delta);
  eff.run_error_delta = round(eff.run_error_delta);
  return eff;
}
