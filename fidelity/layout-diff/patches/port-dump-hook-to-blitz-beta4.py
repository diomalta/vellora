"""Port the debug layout-dump hook (fidelity/layout-diff) onto the Blitz 0.3.0-beta.4 API.

Applied to crates/vellora-core/src/blitz_engine.rs AFTER cherry-picking dff3bc6 on top of the
hook commit. Every replacement must match exactly once (asserted), so a drifted source fails loudly.
"""
import sys

path = sys.argv[1]
src = open(path, encoding="utf-8").read()

REPLACEMENTS = [
    # dump_node: NodeId -> owned usize ids (same conversion as walk(): as_u64() as usize).
    ("        node_id: node.id,\n        kind,",
     "        node_id: node.id.as_u64() as usize,\n        kind,"),
    ("        parent: node.parent,\n        layout_parent: node.layout_parent.get(),",
     "        parent: node.parent.map(|p| p.as_u64() as usize),\n"
     "        layout_parent: node.layout_parent.get().map(|p| p.as_u64() as usize),"),
    # dump_dom_nodes: traverse with NodeId.
    ("    let mut synthetic: HashSet<usize> = HashSet::new();\n"
     "    let mut stack: Vec<(usize, Vec<usize>)> = vec![(base.root_node().id, Vec::new())];",
     "    let mut synthetic: HashSet<NodeId> = HashSet::new();\n"
     "    let mut stack: Vec<(NodeId, Vec<usize>)> = vec![(base.root_node().id, Vec::new())];"),
    ("    let mut stack: Vec<(usize, String)> = vec![(root.id, String::new())];",
     "    let mut stack: Vec<(NodeId, String)> = vec![(root.id, String::new())];"),
    ("        let mut sequence: Vec<usize> = Vec::new();",
     "        let mut sequence: Vec<NodeId> = Vec::new();"),
    ("        let mut work: Vec<usize> = node.children.iter().rev().copied().collect();",
     "        let mut work: Vec<NodeId> = node.children.iter().rev().copied().collect();"),
    ("        let mut next: Vec<(usize, String)> = Vec::new();",
     "        let mut next: Vec<(NodeId, String)> = Vec::new();"),
    # beta.4: pseudo-element ids moved behind accessors.
    ("[(node.before, \"before\"), (node.after, \"after\")]",
     "[(node.before(), \"before\"), (node.after(), \"after\")]"),
    # dump_blitz_tree: NodeId keys; final_layout()/unrounded_layout() accessors panic on
    # text/comment nodes, so skip nodes without layout data (they carry no box).
    ("    let mut path_of: HashMap<usize, String> = nodes\n"
     "        .iter()\n"
     "        .map(|n| (n.node_id, n.dom_path.clone()))\n"
     "        .collect();\n"
     "    let mut anon_count: HashMap<usize, usize> = HashMap::new();",
     "    let mut path_of: HashMap<NodeId, String> = nodes\n"
     "        .iter()\n"
     "        .map(|n| (NodeId::from_u64(n.node_id as u64), n.dom_path.clone()))\n"
     "        .collect();\n"
     "    let mut anon_count: HashMap<Option<NodeId>, usize> = HashMap::new();"),
    ("    let mut stack: Vec<(usize, f64, f64, f64, f64, usize)> =",
     "    let mut stack: Vec<(NodeId, f64, f64, f64, f64, usize)> ="),
    ("        let fl = &node.final_layout;\n        let ul = &node.unrounded_layout;",
     "        if !node_has_layout_data(node) {\n            continue;\n        }\n"
     "        let fl = node.final_layout();\n        let ul = node.unrounded_layout();"),
    ("            let parent = node.layout_parent.get().unwrap_or(usize::MAX);\n"
     "            let parent_path = path_of.get(&parent).cloned().unwrap_or_else(|| \"?\".into());",
     "            let parent = node.layout_parent.get();\n"
     "            let parent_path = parent\n"
     "                .and_then(|p| path_of.get(&p).cloned())\n"
     "                .unwrap_or_else(|| \"?\".into());"),
    ("        out.push(DumpBlitzBox {\n            node_id: id,",
     "        out.push(DumpBlitzBox {\n            node_id: id.as_u64() as usize,"),
    # node_run_meta: usize -> NodeId lookup; parley 0.12 renamed Run::metrics -> font_metrics.
    ("    let Some(node) = base.get_node(node_id) else {\n        return Vec::new();\n    };\n"
     "    if !node.flags.is_inline_root() {",
     "    let Some(node) = base.get_node(NodeId::from_u64(node_id as u64)) else {\n"
     "        return Vec::new();\n    };\n"
     "    if !node.flags.is_inline_root() {"),
    ("            let metrics = run.metrics();",
     "            let metrics = run.font_metrics();"),
    ("                brush_node_id: glyph_run.style().brush.id,",
     "                brush_node_id: glyph_run.style().brush.id.as_u64() as usize,"),
]

for old, new in REPLACEMENTS:
    n = src.count(old)
    if n != 1:
        sys.exit(f"expected exactly 1 match, found {n}:\n{old}")
    src = src.replace(old, new)

open(path, "w", encoding="utf-8").write(src)
print(f"ported {len(REPLACEMENTS)} sites in {path}")
