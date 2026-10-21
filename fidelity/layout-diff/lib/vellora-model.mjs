// Build / run the Rust layout dump (crates/vellora-core/examples/layout_dump.rs) and turn its JSON
// into a path-keyed model with one entry per layer:
//   N0   Blitz's own layout tree of the SOURCE HTML (html_normalize skipped: `layout_dump
//        --no-html-normalize`). Raw Blitz. Optional: present when a source dump is given.
//   N0u  same tree from unrounded_layout (diagnostic only)
//   B0   Blitz's own layout tree of html_normalize's OUTPUT (layout_children, rounded
//        final_layout) — what the render path lays out. B0 − N0 = html_normalize's effect.
//   B0u  same tree from unrounded_layout (diagnostic only; not in the attribution chain)
//   L0   vellora's DOM-children walk, before any layout_normalize pass
//   <pass name> ... one layer per layout_normalize pass, in render order (last = Lfinal)
//   P    pagination: Lfinal moved by what `paginate` did to each box's fragment (schema-2 dumps
//        with a `pagination` trace only; see paginationLayer)
// Text: L0 and the passes carry vellora's text runs (`read_text_runs`, incl. its compensations).
// Schema-2 dumps also carry `blitz_runs`, the RAW Parley runs of the Blitz tree placed the way
// Blitz's own painter places them, so N0/B0 carry text too and the B0 → L0 text step is vellora's
// reader (inline padding compensation, dropped `block_offset`, DOM-parent accumulation). Schema-1
// dumps (no `blitz_runs`) keep N0/B0 box-only, exactly as before (`hasText: false`).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function buildDumpTool(repo) {
  execFileSync("cargo", ["build", "--release", "-p", "vellora-core", "--example", "layout_dump"], {
    cwd: repo,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const bin = join(repo, "target", "release", "examples", "layout_dump");
  if (!existsSync(bin)) throw new Error(`layout_dump binary missing after build: ${bin}`);
  return bin;
}

export function runDump(bin, htmlPath, outPath, { sourceHtml = false } = {}) {
  const args = ["--html", htmlPath, "--out", outPath];
  if (sourceHtml) args.push("--no-html-normalize");
  execFileSync(bin, args, { stdio: ["ignore", "inherit", sourceHtml ? "pipe" : "inherit"] });
  const dump = JSON.parse(readFileSync(outPath, "utf8"));
  if (sourceHtml && dump.html_normalize !== "skipped") {
    throw new Error(`${outPath}: expected a source-HTML dump (html_normalize "skipped")`);
  }
  return dump;
}

/** Layer kinds that are Blitz layout trees (boxes; text only from schema-2 `blitz_runs`). */
export function isBlitzKind(kind) {
  return kind === "blitz" || kind === "blitz-source";
}

/** Whether a layer (model layer or diff.json `layers[]` entry) carries text runs. */
export function layerHasText(layer) {
  return layer.hasText ?? layer.has_text ?? !isBlitzKind(layer.kind);
}

export function normText(text) {
  return String(text ?? "")
    .replace(/[\s ]+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Owner key of a run: the dom path of the nearest ancestor-or-self of its inline root that has a
 * SOURCE counterpart. html_normalize wrappers (synthetic) and Blitz anonymous blocks have none, so
 * their text belongs to their parent element (the same element in every layer, which is what lets
 * an N0 run in an anonymous block align with the L0 run of the wrapper html_normalize inserted).
 */
function ownerKeyFn(byId) {
  return (id) => {
    let node = byId.get(id);
    while (node && (node.synthetic || node.kind === "anonymous")) {
      node = byId.get(node.parent ?? node.layout_parent);
    }
    return node?.path ?? `?node${id}`;
  };
}

/** Raw Blitz text runs of a schema-2 dump as model runs, or null for a schema-1 dump. */
function blitzRuns(dump, byId, prefix) {
  if (!Array.isArray(dump.blitz_runs)) return null;
  const ownerKey = ownerKeyFn(byId);
  return dump.blitz_runs.map((r, i) => ({
    key: `${prefix}${i}`,
    owner: ownerKey(r.owner),
    ownerId: r.owner,
    ownerPath: byId.get(r.owner)?.path,
    brushPath: byId.get(r.brush)?.path,
    text: r.text,
    norm: normText(r.text),
    line: r.line,
    face: r.face,
    fontSize: r.font_size,
    x: r.x,
    baseline: r.y,
    top: r.y - r.ascent,
    w: r.advance,
    h: r.ascent + r.descent,
    blockOffset: r.block_offset,
  }));
}

/**
 * L0 run key -> run key of `layer`: the k-th run with the same owner key and normalized text in
 * L0 order pairs with the k-th such run of the layer (Parley splits a given inline content the
 * same way in every layer; html_normalize wrappers and anonymous blocks fold into the same owner).
 * Returns the map and the layer's runs no L0 run pairs with (text the walk never reads).
 */
function counterparts(l0Runs, layerRuns) {
  const index = new Map();
  for (const r of layerRuns) {
    const k = `${r.owner}|${r.norm}`;
    if (!index.has(k)) index.set(k, []);
    index.get(k).push(r);
  }
  const seen = new Map();
  const map = new Map();
  const used = new Set();
  for (const r of l0Runs) {
    const k = `${r.owner}|${r.norm}`;
    const n = seen.get(k) ?? 0;
    seen.set(k, n + 1);
    const hit = index.get(k)?.[n];
    if (hit) {
      map.set(r.key, hit.key);
      used.add(hit.key);
    }
  }
  return { map, unread: layerRuns.filter((r) => !used.has(r.key) && r.norm) };
}

/**
 * Layer P from a schema-2 `pagination` trace: every box (and its text runs) of the final layer
 * that pagination placed, moved by its fragment's placement offset (`placed_top − top`) RELATIVE
 * TO THE PAGE: on page 1 relative to the flow origin (Chromium's continuous flow and a faithful
 * paginator coincide there), on a later page relative to that page's first fragment (the page
 * break itself legitimately swallows whatever preceded it). So P − final is the drift pagination
 * adds inside a page — e.g. a gap that differs from the flow gap — which Chromium's continuous
 * flow can then judge. A repeated `<thead>` takes its FIRST injection. Boxes pagination does not
 * place (structural html/body/table/tbody, flattened wrappers, fragments with nothing to paint)
 * are absent from P: n/a, not lost (they paint nothing); their text runs, if any, ARE lost.
 */
export function paginationLayer(trace, finalLayer, nodeById) {
  if (!trace?.placements) return null;
  const placed = new Map();
  const pageBase = new Map();
  const rows = [];
  let prev = null;
  trace.placements.forEach((p, i) => {
    const offset = p.placed_top - p.top;
    if (!pageBase.has(p.page)) pageBase.set(p.page, p.page === 0 ? 0 : offset);
    const drift = offset - pageBase.get(p.page);
    const h = p.header_injected;
    if (h) {
      const headerOffset = p.placed_top - h.height - h.top - pageBase.get(p.page);
      for (const id of h.node_ids ?? []) {
        if (!placed.has(id)) placed.set(id, { dy: headerOffset, page: p.page, placement: i });
      }
    }
    for (const id of p.node_ids) {
      if (!placed.has(id)) placed.set(id, { dy: drift, page: p.page, placement: i });
    }
    rows.push({
      index: i,
      page: p.page,
      kind: p.kind,
      root: p.root,
      path: nodeById.get(p.root)?.path ?? `?node${p.root}`,
      boxes: p.node_ids.length,
      top: p.top,
      bottom: p.bottom,
      // Flow gap to the previous fragment on the same page (what the continuous flow has).
      flow_gap: prev && prev.page === p.page ? p.top - prev.bottom : null,
      pending_gap: p.pending_gap,
      pending_gap_source: p.pending_gap_source,
      gap_applied: p.gap_applied,
      gap_note: p.gap_note,
      header: h ? { table_id: h.table_id, height: h.height } : null,
      new_page: p.new_page,
      cursor_before: p.cursor_before,
      placed_top: p.placed_top,
      offset_vs_flow: offset,
      drift,
    });
    prev = p;
  });
  const boxes = new Map();
  for (const [path, b] of finalLayer.boxes) {
    const at = placed.get(b.id);
    if (at) boxes.set(path, { ...b, y: b.y + at.dy, page: at.page });
  }
  const runs = [];
  for (const r of finalLayer.runs) {
    const at = placed.get(r.ownerId);
    if (at) runs.push({ ...r, baseline: r.baseline + at.dy, top: r.top + at.dy, page: at.page });
  }
  return {
    layer: { name: "P", kind: "pagination", boxes, runs, hasText: true },
    summary: {
      page_count: trace.page_count,
      groups_split: trace.groups_split ?? 0,
      placements: rows,
      boxes_placed: placed.size,
      final_boxes_not_placed: [...finalLayer.boxes.values()].filter((b) => !placed.has(b.id))
        .length,
    },
  };
}

/**
 * Path-keyed model of a dump. Text nodes are never boxes. Runs are grouped by owner key (see
 * ownerKeyFn).
 */
export function velloraModel(dump, { sourceDump = null } = {}) {
  if (sourceDump) {
    if (sourceDump.html_normalize !== "skipped") {
      throw new Error("sourceDump must be a --no-html-normalize dump");
    }
    const a = dump.viewport;
    const b = sourceDump.viewport;
    if (a.width_px !== b.width_px || a.height_px !== b.height_px) {
      throw new Error("source dump and dump were laid out at different viewports");
    }
  }
  const nodeById = new Map(dump.nodes.map((n) => [n.id, n]));
  const ownerKeyOf = ownerKeyFn(nodeById);
  const runMeta = new Map(dump.runs.map((r) => [`${r.box}:${r.run}`, r]));

  const boxLayer = (name, kind, entries, byId = nodeById) => {
    const boxes = new Map();
    for (const e of entries) {
      const node = byId.get(e.id);
      if (!node || node.kind === "text" || node.kind === "comment" || node.kind === "document") {
        continue;
      }
      if (!boxes.has(node.path)) {
        boxes.set(node.path, { x: e.x, y: e.y, w: e.w, h: e.h, id: e.id, mt: e.mt, mb: e.mb });
      }
    }
    return { name, kind, boxes, runs: [], hasText: !isBlitzKind(kind) };
  };
  const withText = (layer, runs) => {
    if (runs) {
      layer.runs = runs;
      layer.hasText = true;
    }
    return layer;
  };

  const unrounded = (tree) => tree.map((b) => ({ id: b.id, x: b.ux, y: b.uy, w: b.uw, h: b.uh }));
  const layers = [];
  const sourceById = sourceDump ? new Map(sourceDump.nodes.map((n) => [n.id, n])) : null;
  if (sourceDump) {
    layers.push(
      withText(
        boxLayer("N0", "blitz-source", sourceDump.blitz_tree, sourceById),
        blitzRuns(sourceDump, sourceById, "n"),
      ),
    );
    layers.push(boxLayer("N0u", "blitz-unrounded", unrounded(sourceDump.blitz_tree), sourceById));
  }
  layers.push(withText(boxLayer("B0", "blitz", dump.blitz_tree), blitzRuns(dump, nodeById, "b")));
  layers.push(boxLayer("B0u", "blitz-unrounded", unrounded(dump.blitz_tree)));
  for (const [index, layer] of dump.layers.entries()) {
    const entries = layer.boxes.map(([id, , x, y, w, h, mt, mb]) => ({ id, x, y, w, h, mt, mb }));
    const model = boxLayer(index === 0 ? "L0" : layer.name, index === 0 ? "walk" : "pass", entries);
    for (const [box, run, ox, oy, advance] of layer.runs) {
      const meta = runMeta.get(`${box}:${run}`);
      const ownerId = layer.boxes[box][0];
      const ascent = meta?.ascent ?? Number.NaN;
      const descent = meta?.descent ?? Number.NaN;
      model.runs.push({
        key: `${box}:${run}`,
        owner: ownerKeyOf(ownerId),
        ownerId,
        ownerPath: nodeById.get(ownerId)?.path,
        brushPath: meta ? nodeById.get(meta.brush)?.path : undefined,
        text: meta?.text ?? "",
        norm: normText(meta?.text),
        line: meta?.line,
        face: meta?.face,
        fontSize: meta?.font_size,
        x: ox,
        baseline: oy,
        top: oy - ascent,
        w: advance,
        h: ascent + descent,
      });
    }
    layers.push(model);
  }
  const l0 = layers.find((l) => l.name === "L0");
  // Raw Blitz text runs are keyed per layer; text events are built from L0 runs, so each
  // text-bearing Blitz layer maps L0 run keys to its own runs.
  const unreadByLayer = {};
  for (const layer of layers) {
    if (!isBlitzKind(layer.kind) || !layer.hasText) continue;
    const { map, unread } = counterparts(l0.runs, layer.runs);
    layer.runKeyOf = map;
    unreadByLayer[layer.name] = unread.map((r) => ({
      owner: r.owner,
      inline_root: r.ownerPath,
      text: r.text,
      x: r.x,
      baseline: r.baseline,
    }));
  }
  const pagination = paginationLayer(dump.pagination, layers.at(-1), nodeById);
  if (pagination) layers.push(pagination.layer);
  const anonymous = dump.nodes.filter((n) => n.kind === "anonymous");
  const anonymousTextBlocks = dump.blitz_tree
    .filter((b) => nodeById.get(b.id)?.kind === "anonymous" && normText(b.inline_text))
    .map((b) => ({ path: nodeById.get(b.id).path, text: b.inline_text }));
  return {
    layers,
    nodeById,
    nodesByPath: new Map(dump.nodes.map((n) => [n.path, n])),
    ownerKeys: new Set(l0.runs.map((r) => r.owner)),
    viewport: dump.viewport,
    page: dump.page,
    mediaType: dump.media_type,
    passes: dump.passes,
    normalize: dump.normalize,
    // html_normalize inserted wrappers, i.e. B0 is NOT Blitz on the source DOM.
    domAlteredByHtmlNormalize: (dump.normalize?.wrappers_recorded ?? 0) > 0,
    source: sourceDump
      ? {
          nodes: sourceDump.nodes,
          nodesByPath: new Map(sourceDump.nodes.map((n) => [n.path, n])),
          anonymous: sourceDump.nodes.filter((n) => n.kind === "anonymous").map((n) => n.path),
        }
      : null,
    synthetic: dump.nodes.filter((n) => n.synthetic).map((n) => n.path),
    anonymous: anonymous.map((n) => n.path),
    anonymousTextBlocks,
    // Raw Blitz runs (per text-bearing Blitz layer) that no L0 run pairs with: text Blitz laid
    // out that vellora's walk never reads (anonymous blocks without a wrapper, pseudo-elements).
    blitzTextUnreadByWalk: unreadByLayer,
    pagination: pagination?.summary ?? null,
    schema: dump.schema ?? null,
    runMetaMismatches: dump.run_meta_mismatches,
    layerOrderViolations: dump.layer_order_violations,
    faces: countBy(dump.runs.map((r) => r.face)),
  };
}

function countBy(values) {
  const out = {};
  for (const v of values) out[v] = (out[v] ?? 0) + 1;
  return out;
}

/** Layers that form the attribution chain (N0u/B0u are diagnostic only). */
export function attributionChain(model) {
  return model.layers.filter((l) => l.kind !== "blitz-unrounded");
}

/** The unrounded twin of a Blitz layer (N0 -> N0u, B0 -> B0u), or null. */
export function unroundedOf(model, name) {
  return model.layers.find((l) => l.name === `${name}u` && l.kind === "blitz-unrounded") ?? null;
}
