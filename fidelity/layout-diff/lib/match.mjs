// Layout-tree matcher: aligns the Chromium continuous-flow snapshot with every vellora layer by
// DOM path and finds where (and in which layer) vellora first diverges.
//
// Event order (what "first" means): a pre-order walk of the Chromium element tree where each
// compared box contributes an ENTER event (x, y, width: decided top-down by the containing block and
// preceding siblings), then TEXT events for the runs it owns, then its children, then an EXIT event
// (height: decided bottom-up by its content). Checking height on exit keeps html/body from always
// being "first" just because their height absorbs every descendant's error.
//
// Chain (attribution order): [N0 ->] B0 -> L0 -> one layer per layout_normalize pass.
//   N0  Blitz on the SOURCE HTML (html_normalize skipped; optional, needs a source dump). Raw Blitz.
//   B0  Blitz on html_normalize's OUTPUT. With N0 present, the N0 -> B0 step is html_normalize's.
//
// Two attribution answers per item (they differ as soon as an error exists early in the chain):
//   first_over_tolerance: the FIRST layer whose |delta vs Chromium| exceeds tolerance (or that lost
//     the box). Answers "is raw Blitz already off?", NOT "which layer made it worse": a pass that
//     adds +10 px to a box already +6 px off at B0 still reads B0 here. Never use it alone to blame
//     a layer.
//   steps / dominant_layer / regressed_by: the exact per-layer decomposition of the final delta
//     (step = layer delta - previous layer delta; per coordinate they sum to the final delta) and
//     every layer that REGRESSED the item (see classifyStep). This is the "which layer changed the
//     error" answer; regressions_by_layer lists, per layer, every event that layer regressed, and
//     regressions_by_layer[<pass>].first_box is the first event a pass made worse even when the
//     natural first divergence (headline) comes earlier.
import { baselineKey } from "./chrome-snapshot.mjs";
import { chromeFontFor } from "./fonts.mjs";
import { attributionChain, isBlitzKind, normText } from "./vellora-model.mjs";

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

/** Coordinates each kind of item is checked on. */
export const COORDS = {
  enter: ["dx", "dy", "dw"],
  exit: ["dh"],
  text: ["dx", "dy"],
  box: ["dx", "dy", "dw", "dh"],
};

/**
 * How one layer changed ONE coordinate of an item's error vs Chromium (prev -> cur, both signed
 * vellora - Chromium deltas; prev = 0 for the first layer of the chain, i.e. Chromium itself):
 *   worsened   |cur| - |prev| > tol                         (the error grew)
 *   overshoot  sign flipped with |prev| > tol and |cur| > tol (moved past Chromium: +6 -> -6 leaves
 *              |delta| unchanged, so a magnitude test alone would miss it)
 *   improved   |prev| - |cur| > tol (and not an overshoot)
 *   same       otherwise
 * `by` = |cur| - |prev| for worsened/improved, |cur| (the error now on the other side) for overshoot.
 */
export function classifyStep(prev, cur, tol) {
  const a = Math.abs(prev);
  const b = Math.abs(cur);
  if (b - a > tol) return { kind: "worsened", by: b - a };
  if (Math.sign(prev) !== Math.sign(cur) && a > tol && b > tol) return { kind: "overshoot", by: b };
  if (a - b > tol) return { kind: "improved", by: a - b };
  return { kind: "same", by: b - a };
}

const fin = (v) => (Number.isFinite(v) ? v : 0);
const present = (v, coords) =>
  v && v.status !== "missing" && coords.some((k) => Number.isFinite(v[k]));

/**
 * Exact per-layer decomposition of one item's error vs Chromium over `layers` (chain order).
 * `perLayer[name]` is a delta record ({dx, dy, ...}), `{status: "missing"}` (the layer has no box
 * for the item), `{status: "n/a"}` or absent (layer not applicable, e.g. Blitz trees for text).
 *  - steps: per layer, the coordinate with the largest |step| (step = delta - previous delta; the
 *    first present layer's step is its own delta), only |step| > 0.01.
 *  - dominant_layer / dominant_step: the layer with the largest |step| (ties: earliest).
 *  - regressed_by: every layer that regressed the item, worst coordinate first: kind
 *    `worsened`/`overshoot` (classifyStep, per coordinate, so a pass that adds dy +5 to a box
 *    already at dx +6.5 is not hidden by a max-abs magnitude that stays 6.5) or `missing` (the box
 *    existed in an earlier layer and this layer lost it). For the first present layer `worsened`
 *    means "already over tolerance vs Chromium" (`first: true`).
 *  - missing_from: first layer that lost a previously present box (null if none).
 *  - changed_by: every layer after the first that moved any coordinate by more than 0.01 px.
 */
export function decompose(perLayer, layers, coords, tolerance) {
  const steps = [];
  const regressed = [];
  let prev = null;
  let missingFrom = null;
  for (const name of layers) {
    const v = perLayer[name];
    if (v?.status === "missing") {
      if (prev !== null && missingFrom === null) {
        missingFrom = name;
        regressed.push({
          layer: name,
          kind: "missing",
          coord: null,
          from: null,
          to: null,
          by: null,
        });
      }
      continue;
    }
    if (!present(v, coords)) continue;
    let best = { abs: 0, coord: null, signed: 0 };
    let reg = null;
    for (const k of coords) {
      const cur = fin(v[k]);
      const before = prev ? fin(prev[k]) : 0;
      const s = cur - before;
      if (Math.abs(s) > best.abs) best = { abs: Math.abs(s), coord: k, signed: s };
      const c = classifyStep(before, cur, tolerance);
      if ((c.kind === "worsened" || c.kind === "overshoot") && (!reg || c.by > reg.by)) {
        reg = {
          layer: name,
          kind: c.kind,
          coord: k,
          from: round(before),
          to: round(cur),
          by: c.by,
        };
      }
    }
    if (reg)
      regressed.push({ ...reg, by: round(reg.by), ...(prev === null ? { first: true } : {}) });
    steps.push({ layer: name, first: prev === null, step: round(best.signed), coord: best.coord });
    prev = v;
  }
  let dominant = null;
  for (const st of steps) {
    if (Math.abs(st.step) > 0.01 && (!dominant || Math.abs(st.step) > Math.abs(dominant.step))) {
      dominant = st;
    }
  }
  return {
    steps: steps
      .filter((st) => Math.abs(st.step) > 0.01)
      .map((st) => ({ layer: st.layer, coord: st.coord, step: st.step })),
    dominant_layer: dominant?.layer ?? null,
    dominant_step: dominant ? { coord: dominant.coord, step: dominant.step } : null,
    regressed_by: regressed,
    missing_from: missingFrom,
    changed_by: steps
      .filter((st) => !st.first && Math.abs(st.step) > 0.01)
      .map((st) => ({ layer: st.layer, coord: st.coord, step: st.step })),
  };
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
  // Text nodes, plus pseudo-elements carrying GENERATED text (`content:`), whose text fragments
  // normalizeSnapshot attaches to the pseudo record itself.
  const textNodes = records
    .map((r, i) => ({ ...r, idx: i }))
    .filter((r) => (r.kind === "text" || r.kind === "pseudo") && r.fragments.length > 0);
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
    // Generated text may be owned by the pseudo-element itself (if vellora shapes it as an inline
    // root), so a pseudo record starts the owner search at itself.
    let p = t.kind === "pseudo" ? t.idx : t.parent;
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
      const frag = {
        ...f,
        norm: normText(f.text),
        textPath: t.path,
        ...(t.kind === "pseudo" ? { generated: true } : {}),
      };
      if (!frag.norm) continue;
      if (owner) {
        if (!groups.has(owner)) groups.set(owner, []);
        groups.get(owner).push(frag);
      } else {
        orphans.push({
          path: t.path,
          text: f.text,
          x: f.x,
          y: f.y,
          w: f.w,
          h: f.h,
          ...(t.kind === "pseudo" ? { generated: true } : {}),
        });
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
  const unroundedLayers = vellora.layers.filter((l) => l.kind === "blitz-unrounded");
  for (const layer of vellora.layers) {
    layer.runIndex = new Map(layer.runs.map((r) => [r.key, r]));
  }
  const final = chain[chain.length - 1];
  const tree = chromeTree(chrome, { includeInline });
  const l0 = vellora.layers.find((l) => l.name === "L0");
  const b0 = vellora.layers.find((l) => l.name === "B0");
  const n0 = vellora.layers.find((l) => l.name === "N0") ?? null;
  // Table rows / row groups are not Taffy nodes in Blitz (cells are laid out directly by the
  // table): absent from Blitz's layout tree and a zero-size box in vellora's walk. There is no
  // geometry to compare, so they are listed, not scored (their cells are compared).
  for (const el of tree.elements) {
    const v = l0.boxes.get(el.path);
    if (
      el.policy === "compared" &&
      !b0.boxes.has(el.path) &&
      !n0?.boxes.has(el.path) &&
      v &&
      v.w === 0 &&
      v.h === 0
    ) {
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
    chrome_generated_fragments: [...groups.values()].flat().filter((f) => f.generated).length,
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
      textStats.unmatched_chrome_fragments.push(chromeFragOut(owner, f));
    }
  }
  for (const [owner, frags] of groups) {
    if (!runsByOwner.has(owner)) {
      for (const f of frags) textStats.unmatched_chrome_fragments.push(chromeFragOut(owner, f));
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
        // Chromium COMPUTED margins of the element itself (not collapsed); null on snapshots
        // captured before margins were requested.
        chrome_margin: Number.isFinite(el.margin_top)
          ? { mt: el.margin_top, mb: el.margin_bottom }
          : null,
        parent: comparedAncestor,
        prev,
        layers: {},
      };
      for (const layer of [...chain, ...unroundedLayers]) {
        const v = layer.boxes.get(el.path);
        row.layers[layer.name] = v
          ? { x: v.x, y: v.y, w: v.w, h: v.h, mt: v.mt, mb: v.mb, ...boxDelta(v, el.box) }
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
      if (isBlitzKind(layer.kind)) return { status: "n/a" };
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

  const textChain = chain.filter((l) => !isBlitzKind(l.kind)).map((l) => l.name);
  const boxChain = chain.map((l) => l.name);
  const kindOf = new Map(chain.map((l) => [l.name, l.kind]));
  const evaluated = events.map((event, order) => {
    const perLayer = {};
    for (const layer of chain) perLayer[layer.name] = evalEvent(event, layer);
    if (event.type !== "text") {
      for (const layer of unroundedLayers) perLayer[layer.name] = evalEvent(event, layer);
    }
    const layerNames = event.type === "text" ? textChain : boxChain;
    const dec =
      event.type === "text"
        ? decompose(perLayer, textChain, COORDS.text, textTolerance)
        : decompose(perLayer, boxChain, COORDS[event.type], tolerance);
    // A layer with no box for a compared Chromium box COUNTS as a divergence when the box existed
    // in an earlier layer (that layer lost it) or in no vellora layer at all (Chromium-only).
    // A box absent from Blitz's trees but present in the walk is not "lost" (not a layout node).
    const anyPresent = layerNames.some((n) => perLayer[n] && perLayer[n].status !== "missing");
    const counts = {};
    let seen = false;
    for (const n of layerNames) {
      const st = perLayer[n]?.status;
      counts[n] = st === "diverged" || (st === "missing" && (seen || !anyPresent));
      if (st === "ok" || st === "diverged") seen = true;
    }
    return { order, event, perLayer, dec, counts };
  });

  const firstOverTolerance = (e) => {
    const names = e.event.type === "text" ? textChain : boxChain;
    return names.find((n) => e.counts[n]) ?? null;
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
        ...(n0 ? { N0: pick(r.layers.N0) } : {}),
        B0: pick(r.layers.B0),
        L0: pick(r.layers.L0),
      });
      p = r.parent;
    }
    return out;
  };

  /** Full record of one evaluated event (headline sections). */
  const detail = (e) => ({
    order: e.order,
    ...describe(e.event),
    first_over_tolerance: firstOverTolerance(e),
    status_in_final: e.perLayer[final.name]?.status ?? null,
    ...e.dec,
    per_layer: e.perLayer,
    ancestors: ancestorsOf(e.event.path),
  });

  const isText = (e) => e.event.type === "text";
  const firstDivergence = (layerName, kind) => {
    const hit = evaluated.find((e) => (kind === "text") === isText(e) && e.counts[layerName]);
    return hit ? detail(hit) : null;
  };

  const firstByLayer = {};
  for (const layer of chain) {
    firstByLayer[layer.name] = {
      box: firstDivergence(layer.name, "box"),
      text: isBlitzKind(layer.kind) ? null : firstDivergence(layer.name, "text"),
    };
  }

  // ---- regressions: which layer made which event worse (independent of first-over-tolerance) ----
  const regressionOf = (e, name) => e.dec.regressed_by.find((w) => w.layer === name);
  const brief = (e, w) => ({
    order: e.order,
    ...describe(e.event),
    kind: w.kind,
    coord: w.coord,
    from: w.from,
    to: w.to,
    by: w.by,
    ...(w.first ? { first: true } : {}),
    first_over_tolerance: firstOverTolerance(e),
    dominant_layer: e.dec.dominant_layer,
  });
  const regressionsByLayer = {};
  for (const layer of chain) {
    const hits = evaluated.map((e) => ({ e, w: regressionOf(e, layer.name) })).filter((h) => h.w);
    const boxHits = hits.filter((h) => !isText(h.e));
    const textHits = hits.filter((h) => isText(h.e));
    const largest = (list) =>
      [...list].filter((h) => Number.isFinite(h.w.by)).sort((a, b) => b.w.by - a.w.by)[0] ?? null;
    const byKind = countBy(hits.map((h) => h.w.kind));
    const lb = largest(boxHits);
    const lt = largest(textHits);
    regressionsByLayer[layer.name] = {
      kind: layer.kind,
      box_events: boxHits.length,
      text_events: textHits.length,
      // Excluding `first` regressions (= already over tolerance where the item first appears).
      box_events_vs_previous_layer: boxHits.filter((h) => !h.w.first).length,
      text_events_vs_previous_layer: textHits.filter((h) => !h.w.first).length,
      by_kind: {
        worsened: byKind.worsened ?? 0,
        overshoot: byKind.overshoot ?? 0,
        missing: byKind.missing ?? 0,
      },
      first_box: boxHits[0] ? detail(boxHits[0].e) : null,
      first_text: textHits[0] ? detail(textHits[0].e) : null,
      largest_box: lb ? brief(lb.e, lb.w) : null,
      largest_text: lt ? brief(lt.e, lt.w) : null,
      events: hits.slice(0, 40).map((h) => brief(h.e, h.w)),
    };
  }
  // First event (pre-order) a layer of `kind` regressed RELATIVE TO AN EARLIER LAYER (a `first`
  // regression only says the item is already over tolerance where it first appears).
  const firstRegressionByKind = (kind, textEvents) => {
    const hit = evaluated.find(
      (e) =>
        textEvents === isText(e) &&
        e.dec.regressed_by.some((w) => !w.first && kindOf.get(w.layer) === kind),
    );
    return hit ? detail(hit) : null;
  };
  const missingEnters = evaluated.filter(
    (e) => e.event.type === "enter" && e.perLayer[final.name]?.status === "missing",
  );
  const missingOut = (e) => ({
    order: e.order,
    path: e.event.path,
    tag: boxRows.get(e.event.path)?.tag,
    chrome: boxRows.get(e.event.path)?.chrome,
    present_in: Object.entries(e.perLayer)
      .filter(([, v]) => v.status !== "missing")
      .map(([k]) => k),
    missing_from: e.dec.missing_from,
    counted_as_divergence: e.counts[final.name],
  });
  const firstMissing = missingEnters[0]
    ? { ...missingOut(missingEnters[0]), total_missing: missingEnters.length }
    : null;

  // ---- per-box ranking ----
  const boxIntroduced = (row) => {
    for (const layer of chain) {
      const v = row.layers[layer.name];
      if (v && maxAbs(v.dx, v.dy, v.dw, v.dh) > tolerance) return layer.name;
    }
    return null;
  };
  const rowPerLayer = (row) =>
    Object.fromEntries(boxChain.map((n) => [n, row.layers[n] ?? { status: "missing" }]));
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
        first_over_tolerance: boxIntroduced(r),
        ...decompose(rowPerLayer(r), boxChain, COORDS.box, tolerance),
      };
    });
  const topBoxes = [...ranked].sort((a, b) => b.magnitude - a.magnitude).slice(0, top);
  const topLocal = [...ranked].sort((a, b) => b.local_magnitude - a.local_magnitude).slice(0, top);
  const textEvents = evaluated.filter(isText);
  const textRanked = textEvents.map((e) => {
    const d = e.perLayer[final.name];
    // LOCAL text error: the run's delta minus its owner box's x/y delta, so runs that merely
    // ride along with a shifted owner (cascade) rank low, like top_local_boxes.
    const owner = boxRows.get(e.event.path)?.layers[final.name];
    const local =
      owner && Number.isFinite(d?.dx)
        ? { rdx: round(d.dx - owner.dx), rdy: round(d.dy - owner.dy) }
        : null;
    return {
      ...describe(e.event),
      delta: d,
      local,
      magnitude: round(maxAbs(d?.dx, d?.dy)),
      local_magnitude: local ? round(maxAbs(local.rdx, local.rdy)) : round(maxAbs(d?.dx, d?.dy)),
      first_over_tolerance: firstOverTolerance(e),
      dominant_layer: e.dec.dominant_layer,
      dominant_step: e.dec.dominant_step,
      steps: e.dec.steps,
      regressed_by: e.dec.regressed_by,
    };
  });
  const topText = [...textRanked].sort((a, b) => b.magnitude - a.magnitude).slice(0, top);
  const topLocalText = [...textRanked]
    .sort((a, b) => b.local_magnitude - a.local_magnitude)
    .slice(0, top);

  // ---- per-layer stats and pass effects ----
  const boxEvents = evaluated.filter((e) => !isText(e));
  const layerStats = chain.map((layer, index) => {
    const statuses = evaluated.map((e) => e.perLayer[layer.name]?.status);
    const stat = {
      layer: layer.name,
      kind: layer.kind,
      events: statuses.filter((s) => s === "ok" || s === "diverged").length,
      diverged: evaluated.filter((e) => e.counts[layer.name]).length,
      box_events_diverged: boxEvents.filter((e) => e.counts[layer.name]).length,
      text_events_diverged: textEvents.filter((e) => e.counts[layer.name]).length,
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
      stat.effect_vs_previous = passEffect({
        rows,
        textEvents,
        prev: chain[index - 1],
        layer,
        evalEvent,
        tolerance,
        textTolerance,
        describe,
      });
    }
    return stat;
  });

  // ---- margins (NOT part of the x/y/w/h attribution; pagination re-stacks with them) ----
  const l0Name = l0.name;
  const marginRows = rows.filter((r) => r.layers[l0Name] && Number.isFinite(r.layers[l0Name].mt));
  const passChangedMargins = marginRows.filter((r) => {
    const a = r.layers[l0Name];
    const b = r.layers[final.name];
    return b && (Math.abs(a.mt - b.mt) > 0.01 || Math.abs(a.mb - b.mb) > 0.01);
  });
  const vsComputed = marginRows.filter(
    (r) =>
      r.chrome_margin &&
      (Math.abs(r.layers[l0Name].mt - r.chrome_margin.mt) > tolerance ||
        Math.abs(r.layers[l0Name].mb - r.chrome_margin.mb) > tolerance),
  );
  const margins = {
    note: "vellora margins are Blitz's resolved layout.margin as read by the walk (L0) and after the passes; Chromium values are COMPUTED margins of the element itself (not collapsed through descendants). Not part of the x/y/w/h attribution.",
    boxes_with_margins: marginRows.length,
    chromium_computed_available: marginRows.some((r) => r.chrome_margin),
    changed_by_passes: passChangedMargins.length,
    changed_by_passes_sample: passChangedMargins.slice(0, 12).map((r) => ({
      path: r.path,
      L0: { mt: round(r.layers[l0Name].mt), mb: round(r.layers[l0Name].mb) },
      final: { mt: round(r.layers[final.name].mt), mb: round(r.layers[final.name].mb) },
    })),
    differ_from_chromium_computed: vsComputed.length,
    differ_from_chromium_computed_sample: vsComputed.slice(0, 20).map((r) => ({
      path: r.path,
      vellora_L0: { mt: round(r.layers[l0Name].mt), mb: round(r.layers[l0Name].mb) },
      chromium_computed: r.chrome_margin,
    })),
  };

  // ---- match counts ----
  const chromeCounts = countBy(tree.elements.map((e) => e.policy));
  const notHead = (p) => p !== "html>head:nth-child(1)" && !p.startsWith("html>head:nth-child(1)>");
  const l0Paths = [...l0.boxes.keys()].filter(notHead);
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
  const b0Only = [...b0.boxes.keys()].filter((p) => !l0.boxes.has(p));
  const sourceCompared = n0
    ? tree.elements.filter((e) => e.policy === "compared" && n0.boxes.has(e.path)).length
    : null;

  return {
    schema: "vellora-layout-diff/2",
    config: { tolerance, textTolerance, includeInline, top },
    layers: chain.map((l) => ({ name: l.name, kind: l.kind })),
    unrounded_layers: unroundedLayers.map((l) => l.name),
    final_layer: final.name,
    html_normalize: {
      source_layer: n0 ? "N0" : null,
      dom_altered: vellora.domAlteredByHtmlNormalize ?? null,
      wrappers_recorded: vellora.normalize?.wrappers_recorded ?? null,
      wrappers_located: vellora.normalize?.wrappers_located ?? null,
    },
    // The first divergent BOX (enter: x/y/w, exit: h, or a box the final layer lacks) and,
    // separately, the first divergent TEXT run in the final pre-pagination layer, each with its
    // first-over-tolerance layer and per-layer decomposition. These are the NATURAL first
    // divergences; a pass regression later in the document is in first_pass_regression /
    // regressions_by_layer, never hidden behind them.
    headline: {
      ...firstByLayer[final.name],
      // First event (pre-order) that a layout_normalize pass REGRESSED (worsened > tolerance,
      // overshot, or lost), and the same for vellora's walk vs Blitz (boxes only: Blitz trees have
      // no text) and for html_normalize (N0 -> B0; only with a source dump).
      first_pass_regression: {
        box: firstRegressionByKind("pass", false),
        text: firstRegressionByKind("pass", true),
      },
      first_walk_regression: { box: firstRegressionByKind("walk", false) },
      first_html_normalize_regression: n0 ? { box: firstRegressionByKind("blitz", false) } : null,
      // First compared Chromium box with NO vellora box in the final layer.
      first_missing: firstMissing,
    },
    first_divergence_by_layer: firstByLayer,
    regressions_by_layer: regressionsByLayer,
    missing_boxes: missingEnters.slice(0, 40).map(missingOut),
    margins,
    layer_stats: layerStats,
    top_boxes: topBoxes,
    top_local_boxes: topLocal,
    top_text: topText,
    top_local_text: topLocalText,
    counts: {
      chrome_elements_by_policy: chromeCounts,
      vellora_l0_boxes: l0Paths.length,
      matched_boxes: matched,
      source_tree_compared_boxes: sourceCompared,
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
      chrome_margin: r.chrome_margin,
      layers: Object.fromEntries(Object.entries(r.layers).map(([k, v]) => [k, pick(v)])),
    })),
    text_events: textEvents.map((e) => ({
      ...describe(e.event),
      per_layer: e.perLayer,
      first_over_tolerance: firstOverTolerance(e),
      dominant_layer: e.dec.dominant_layer,
      regressed_by: e.dec.regressed_by,
    })),
  };
}

function chromeFragOut(owner, f) {
  return { owner, text: f.text, x: f.x, y: f.y, ...(f.generated ? { generated: true } : {}) };
}

function pick(v) {
  if (!v) return null;
  const out = { dx: v.dx, dy: v.dy, dw: v.dw, dh: v.dh };
  if (Number.isFinite(v.mt)) {
    out.mt = round(v.mt);
    out.mb = round(v.mb);
  }
  return out;
}

function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function countBy(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** Worst per-coordinate regression (classifyStep) between two delta records, or null. */
function regressionBetween(a, b, coords, tol) {
  let worst = null;
  for (const k of coords) {
    if (!Number.isFinite(a[k]) || !Number.isFinite(b[k])) continue;
    const c = classifyStep(a[k], b[k], tol);
    if ((c.kind === "worsened" || c.kind === "overshoot") && (!worst || c.by > worst.by)) {
      worst = {
        kind: c.kind,
        coord: k,
        from: round(a[k]),
        to: round(b[k]),
        by: round(c.by),
        step: round(b[k] - a[k]),
      };
    }
  }
  return worst;
}

/**
 * How a layer changed error vs the previous layer, for boxes and text runs. `improved`/`worsened`
 * compare max |Δ| per item (Σ = summed change of that error, which a few large improvements can
 * drive negative while a single box regresses), so `regressed` (per-coordinate classifyStep:
 * worsened or overshoot by > tolerance) is counted too and its largest items are NAMED.
 */
function passEffect({
  rows,
  textEvents,
  prev,
  layer,
  evalEvent,
  tolerance,
  textTolerance,
  describe,
}) {
  const eff = {
    boxes_moved: 0,
    boxes_improved: 0,
    boxes_worsened: 0,
    box_error_delta: 0,
    boxes_regressed: 0,
    boxes_lost: 0,
    top_box_regressions: [],
    runs_moved: 0,
    runs_improved: 0,
    runs_worsened: 0,
    run_error_delta: 0,
    runs_regressed: 0,
    top_run_regressions: [],
  };
  const boxRegs = [];
  for (const r of rows) {
    const a = r.layers[prev.name];
    const b = r.layers[layer.name];
    if (a && !b) eff.boxes_lost += 1;
    if (!a || !b) continue;
    const moved = ["x", "y", "w", "h"].some((k) => Math.abs(a[k] - b[k]) > 0.01);
    if (!moved) continue;
    eff.boxes_moved += 1;
    const ea = maxAbs(a.dx, a.dy, a.dw, a.dh);
    const eb = maxAbs(b.dx, b.dy, b.dw, b.dh);
    eff.box_error_delta += eb - ea;
    if (eb < ea - 0.01) eff.boxes_improved += 1;
    else if (eb > ea + 0.01) eff.boxes_worsened += 1;
    const reg = regressionBetween(a, b, COORDS.box, tolerance);
    if (reg) boxRegs.push({ path: r.path, ...reg });
  }
  eff.boxes_regressed = boxRegs.length;
  // Name the ORIGIN, not the cascade: the first regressed boxes in document order, where a box
  // whose height regression equals a regressed descendant's (it only absorbed the growth), or
  // whose x/y regression equals a regressed ancestor's (it only moved with it), ranks after the
  // others. Boxes pushed down by an earlier sibling's growth follow it in document order.
  const same = (q, r) => q.coord === r.coord && Math.abs(q.step - r.step) <= 0.01;
  const cascade = (r) =>
    boxRegs.some((q) =>
      r.coord === "dh"
        ? q.path.startsWith(`${r.path}>`) && same(q, r)
        : r.path.startsWith(`${q.path}>`) && same(q, r),
    );
  eff.top_box_regressions = boxRegs
    .map((r, order) => ({ ...r, cascade: cascade(r), order }))
    .sort((x, y) => Number(x.cascade) - Number(y.cascade) || x.order - y.order)
    .slice(0, 3)
    .map(({ order, ...r }) => r);
  eff.largest_box_regression = [...boxRegs].sort((x, y) => y.by - x.by)[0] ?? null;
  const runRegs = [];
  if (!isBlitzKind(prev.kind)) {
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
      const reg = regressionBetween(a, b, COORDS.text, textTolerance);
      if (reg) {
        const d = describe(e.event);
        runRegs.push({ owner: d.owner, text: d.text, ...reg });
      }
    }
  }
  eff.runs_regressed = runRegs.length;
  // Document order (first regressed runs), plus the largest.
  eff.top_run_regressions = runRegs.slice(0, 3);
  eff.largest_run_regression = [...runRegs].sort((x, y) => y.by - x.by)[0] ?? null;
  eff.box_error_delta = round(eff.box_error_delta);
  eff.run_error_delta = round(eff.run_error_delta);
  return eff;
}
