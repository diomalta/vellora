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

/** Layer kinds that are Blitz layout trees (boxes only, no text runs). */
export function isBlitzKind(kind) {
  return kind === "blitz" || kind === "blitz-source";
}

export function normText(text) {
  return String(text ?? "")
    .replace(/[\s ]+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Path-keyed model of a dump. Text nodes are never boxes. Runs are grouped by "owner key": the
 * dom path of the nearest NON-synthetic ancestor-or-self of the inline root that owns the run
 * (html_normalize wrappers have no source counterpart, so their text belongs to their parent).
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
  const ownerKeyOf = (id) => {
    let node = nodeById.get(id);
    while (node?.synthetic) node = nodeById.get(node.parent);
    return node?.path ?? `?node${id}`;
  };
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
    return { name, kind, boxes, runs: [] };
  };

  const unrounded = (tree) => tree.map((b) => ({ id: b.id, x: b.ux, y: b.uy, w: b.uw, h: b.uh }));
  const layers = [];
  const sourceById = sourceDump ? new Map(sourceDump.nodes.map((n) => [n.id, n])) : null;
  if (sourceDump) {
    layers.push(boxLayer("N0", "blitz-source", sourceDump.blitz_tree, sourceById));
    layers.push(boxLayer("N0u", "blitz-unrounded", unrounded(sourceDump.blitz_tree), sourceById));
  }
  layers.push(boxLayer("B0", "blitz", dump.blitz_tree));
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
  const anonymous = dump.nodes.filter((n) => n.kind === "anonymous");
  const anonymousTextBlocks = dump.blitz_tree
    .filter((b) => nodeById.get(b.id)?.kind === "anonymous" && normText(b.inline_text))
    .map((b) => ({ path: nodeById.get(b.id).path, text: b.inline_text }));
  return {
    layers,
    nodeById,
    nodesByPath: new Map(dump.nodes.map((n) => [n.path, n])),
    ownerKeys: new Set(layers.find((l) => l.name === "L0").runs.map((r) => r.owner)),
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
