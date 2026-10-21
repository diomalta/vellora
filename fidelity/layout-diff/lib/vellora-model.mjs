// Build / run the Rust layout dump (crates/vellora-core/examples/layout_dump.rs) and turn its JSON
// into a path-keyed model with one entry per layer:
//   B0   Blitz's own layout tree (layout_children, rounded final_layout), what Blitz itself computed
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

export function runDump(bin, htmlPath, outPath) {
  execFileSync(bin, ["--html", htmlPath, "--out", outPath], {
    stdio: ["ignore", "inherit", "inherit"],
  });
  return JSON.parse(readFileSync(outPath, "utf8"));
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
export function velloraModel(dump) {
  const nodeById = new Map(dump.nodes.map((n) => [n.id, n]));
  const ownerKeyOf = (id) => {
    let node = nodeById.get(id);
    while (node?.synthetic) node = nodeById.get(node.parent);
    return node?.path ?? `?node${id}`;
  };
  const runMeta = new Map(dump.runs.map((r) => [`${r.box}:${r.run}`, r]));

  const boxLayer = (name, kind, entries) => {
    const boxes = new Map();
    for (const e of entries) {
      const node = nodeById.get(e.id);
      if (!node || node.kind === "text" || node.kind === "comment" || node.kind === "document") {
        continue;
      }
      if (!boxes.has(node.path)) {
        boxes.set(node.path, { x: e.x, y: e.y, w: e.w, h: e.h, id: e.id, mt: e.mt, mb: e.mb });
      }
    }
    return { name, kind, boxes, runs: [] };
  };

  const layers = [];
  layers.push(boxLayer("B0", "blitz", dump.blitz_tree));
  layers.push(
    boxLayer(
      "B0u",
      "blitz-unrounded",
      dump.blitz_tree.map((b) => ({ id: b.id, x: b.ux, y: b.uy, w: b.uw, h: b.uh })),
    ),
  );
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

/** Layers that form the attribution chain (B0u is diagnostic only). */
export function attributionChain(model) {
  return model.layers.filter((l) => l.kind !== "blitz-unrounded");
}
