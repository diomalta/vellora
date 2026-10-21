# SCRATCH ONLY (never committed): add stderr prints of pagination fragments to a checkout's
# crates/vellora-core/src/pagination.rs. Usage: python3 probe_pagination.py <checkout>
import pathlib
import sys

p = pathlib.Path(sys.argv[1]) / "crates/vellora-core/src/pagination.rs"
s = p.read_text()
a = "    let fragments = build_fragments(doc);\n"
assert s.count(a) == 1, "anchor 1"
s = s.replace(
    a,
    a
    + """    for (fi, f) in fragments.iter().enumerate() {
        let root = f.boxes.first();
        eprintln!(
            "PROBE frag {fi} tag={:?} node={:?} top={:.3} bottom={:.3} trailing_gap={:.3} root_mt={:.3} root_mb={:.3} members={} row={} thead={}",
            root.and_then(|b| b.tag.clone()),
            root.map(|b| b.node_id),
            f.top,
            f.bottom,
            f.trailing_gap,
            root.map(|b| b.margin_top).unwrap_or(f64::NAN),
            root.map(|b| b.margin_bottom).unwrap_or(f64::NAN),
            f.members.len(),
            f.is_row(),
            f.is_thead
        );
    }
""",
)
b = "        let page_gap = if current.is_empty() { 0.0 } else { page_gap };\n        cursor += page_gap;\n"
assert s.count(b) == 1, "anchor 2"
s = s.replace(
    b,
    """        let page_gap = if current.is_empty() { 0.0 } else { page_gap };
        let probe_cursor_before = cursor;
        cursor += page_gap;
        eprintln!(
            "PROBE place page={} top={:.3} bottom={:.3} cursor_before={:.3} gap={:.3} placed_at={:.3} node={:?} tag={:?}",
            page_slices.len(),
            frag.top,
            frag.bottom,
            probe_cursor_before,
            page_gap,
            cursor,
            frag.boxes.first().map(|b| b.node_id),
            frag.boxes.first().and_then(|b| b.tag.clone())
        );
""",
)
p.write_text(s)
print("patched", p)
