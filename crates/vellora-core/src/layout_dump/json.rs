//! JSON writer for [`LayoutDump`] (schema `vellora-layout-dump/2`, read by
//! `fidelity/layout-diff/lib/vellora-model.mjs`). Hand-rolled so the shipped
//! crate gains no serde dependency; numbers are rounded to 1e-4 CSS px.
//!
//! Schema 2 = schema 1 plus `blitz_runs` (raw Blitz/Parley text of the Blitz
//! tree, fidelity text layers `B0`/`N0`) and `pagination` (fidelity layer `P`).
//! Every schema-1 field is written exactly as before.

use std::fmt::Write as _;

use super::LayoutDump;

/// Minimal JSON value.
enum V {
    Null,
    Bool(bool),
    Num(f64),
    Int(i64),
    Str(String),
    Arr(Vec<V>),
    Obj(Vec<(&'static str, V)>),
}

impl V {
    fn opt_str(s: Option<&str>) -> V {
        s.map_or(V::Null, |s| V::Str(s.to_string()))
    }
    fn opt_int(v: Option<usize>) -> V {
        v.map_or(V::Null, |v| V::Int(v as i64))
    }
    fn write(&self, out: &mut String) {
        match self {
            V::Null => out.push_str("null"),
            V::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
            V::Int(i) => {
                let _ = write!(out, "{i}");
            }
            V::Num(n) => write_num(out, *n),
            V::Str(s) => write_str(out, s),
            V::Arr(items) => {
                out.push('[');
                for (i, item) in items.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    item.write(out);
                }
                out.push(']');
            }
            V::Obj(fields) => {
                out.push('{');
                for (i, (key, value)) in fields.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    write_str(out, key);
                    out.push(':');
                    value.write(out);
                }
                out.push('}');
            }
        }
    }
}

fn write_num(out: &mut String, n: f64) {
    if !n.is_finite() {
        out.push_str("null");
        return;
    }
    let rounded = (n * 10_000.0).round() / 10_000.0;
    let mut s = format!("{rounded:.4}");
    while s.ends_with('0') {
        s.pop();
    }
    if s.ends_with('.') {
        s.pop();
    }
    if s == "-0" {
        s = "0".to_string();
    }
    out.push_str(&s);
}

fn write_str(out: &mut String, s: &str) {
    out.push('"');
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                let _ = write!(out, "\\u{:04x}", c as u32);
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

/// The dump as one line of JSON (no trailing newline).
pub fn to_json(dump: &LayoutDump) -> String {
    let mut out = String::new();
    value(dump).write(&mut out);
    out
}

fn value(dump: &LayoutDump) -> V {
    let page = &dump.page;
    let nodes = dump
        .nodes
        .iter()
        .map(|n| {
            V::Obj(vec![
                ("id", V::Int(n.node_id as i64)),
                ("kind", V::Str(n.kind.to_string())),
                ("tag", V::opt_str(n.tag.as_deref())),
                ("id_attr", V::opt_str(n.id_attr.as_deref())),
                ("class", V::opt_str(n.class_attr.as_deref())),
                ("path", V::Str(n.dom_path.clone())),
                ("synthetic", V::Bool(n.synthetic)),
                ("parent", V::opt_int(n.parent)),
                ("layout_parent", V::opt_int(n.layout_parent)),
                ("inline_root", V::Bool(n.inline_root)),
                ("display_outside", V::opt_str(n.display_outside.as_deref())),
                ("display_inside", V::opt_str(n.display_inside.as_deref())),
            ])
        })
        .collect();
    let blitz_tree = dump
        .blitz_tree
        .iter()
        .map(|b| {
            V::Obj(vec![
                ("id", V::Int(b.node_id as i64)),
                ("depth", V::Int(b.depth as i64)),
                ("x", V::Num(b.x)),
                ("y", V::Num(b.y)),
                ("w", V::Num(b.width)),
                ("h", V::Num(b.height)),
                ("ux", V::Num(b.ux)),
                ("uy", V::Num(b.uy)),
                ("uw", V::Num(b.uwidth)),
                ("uh", V::Num(b.uheight)),
                (
                    "border",
                    V::Arr(b.border.iter().map(|v| V::Num(*v)).collect()),
                ),
                (
                    "padding",
                    V::Arr(b.padding.iter().map(|v| V::Num(*v)).collect()),
                ),
                ("inline_text", V::opt_str(b.inline_text.as_deref())),
            ])
        })
        .collect();
    let blitz_runs = dump
        .blitz_runs
        .iter()
        .map(|r| {
            V::Obj(vec![
                ("owner", V::Int(r.owner_node_id as i64)),
                ("brush", V::Int(r.brush_node_id as i64)),
                ("line", V::Int(r.line_index as i64)),
                ("text", V::Str(r.text.clone())),
                ("font_size", V::Num(r.font_size as f64)),
                ("ascent", V::Num(r.ascent as f64)),
                ("descent", V::Num(r.descent as f64)),
                ("face", V::Str(r.face.to_string())),
                ("glyphs", V::Int(r.glyph_count as i64)),
                ("x", V::Num(r.origin_x)),
                ("y", V::Num(r.origin_y)),
                ("advance", V::Num(r.advance)),
                ("offset", V::Num(r.offset)),
                ("baseline", V::Num(r.baseline)),
                ("block_offset", V::Num(r.block_offset)),
            ])
        })
        .collect();
    let layers = dump
        .layers
        .iter()
        .map(|layer| {
            let boxes = layer
                .boxes
                .iter()
                .map(|b| {
                    V::Arr(vec![
                        V::Int(b.node_id as i64),
                        V::Int(b.depth as i64),
                        V::Num(b.x),
                        V::Num(b.y),
                        V::Num(b.width),
                        V::Num(b.height),
                        V::Num(b.margin_top),
                        V::Num(b.margin_bottom),
                    ])
                })
                .collect();
            let runs = layer
                .boxes
                .iter()
                .enumerate()
                .flat_map(|(box_index, b)| {
                    b.runs.iter().enumerate().map(move |(run_index, r)| {
                        V::Arr(vec![
                            V::Int(box_index as i64),
                            V::Int(run_index as i64),
                            V::Num(r.origin_x),
                            V::Num(r.origin_y),
                            V::Num(r.advance),
                        ])
                    })
                })
                .collect();
            V::Obj(vec![
                ("name", V::Str(layer.name.clone())),
                (
                    "box_fields",
                    V::Str("node_id,depth,x,y,w,h,margin_top,margin_bottom".into()),
                ),
                ("boxes", V::Arr(boxes)),
                (
                    "run_fields",
                    V::Str("box_index,run_index,origin_x,origin_y,advance".into()),
                ),
                ("runs", V::Arr(runs)),
            ])
        })
        .collect();
    let runs = dump
        .runs
        .iter()
        .map(|r| {
            V::Obj(vec![
                ("box", V::Int(r.box_index as i64)),
                ("run", V::Int(r.run_index as i64)),
                ("owner", V::Int(r.owner_node_id as i64)),
                ("brush", V::Int(r.brush_node_id as i64)),
                ("line", V::Int(r.line_index as i64)),
                ("text", V::Str(r.text.clone())),
                ("font_size", V::Num(r.font_size as f64)),
                ("ascent", V::Num(r.ascent as f64)),
                ("descent", V::Num(r.descent as f64)),
                ("line_baseline", V::Num(r.line_baseline as f64)),
                ("line_top", V::Num(r.line_top as f64)),
                ("line_bottom", V::Num(r.line_bottom as f64)),
                ("face", V::Str(r.face.to_string())),
                ("glyphs", V::Int(r.glyph_count as i64)),
            ])
        })
        .collect();
    let pagination = dump.pagination.as_ref().map_or(V::Null, |p| {
        V::Obj(vec![
            ("page_count", V::Int(p.page_count as i64)),
            ("groups_split", V::Int(p.groups_split as i64)),
            (
                "placements",
                V::Arr(
                    p.placements
                        .iter()
                        .map(|f| {
                            V::Obj(vec![
                                ("kind", V::Str(f.kind.to_string())),
                                ("root", V::opt_int(f.node_ids.first().copied())),
                                ("root_tag", V::opt_str(f.root_tag.as_deref())),
                                (
                                    "node_ids",
                                    V::Arr(f.node_ids.iter().map(|i| V::Int(*i as i64)).collect()),
                                ),
                                ("table_id", V::opt_int(f.table_id)),
                                ("top", V::Num(f.top)),
                                ("bottom", V::Num(f.bottom)),
                                ("trailing_gap", V::Num(f.trailing_gap)),
                                ("gap_source", V::Str(f.gap_source.to_string())),
                                ("page", V::Int(f.page as i64)),
                                ("new_page", V::opt_str(f.new_page)),
                                ("cursor_before", V::Num(f.cursor_before)),
                                ("pending_gap", V::Num(f.pending_gap)),
                                (
                                    "pending_gap_source",
                                    V::Str(f.pending_gap_source.to_string()),
                                ),
                                ("gap_applied", V::Num(f.gap_applied)),
                                ("gap_note", V::Str(f.gap_note.to_string())),
                                (
                                    "header_injected",
                                    f.header_injected.as_ref().map_or(V::Null, |h| {
                                        V::Obj(vec![
                                            ("table_id", V::Int(h.table_id as i64)),
                                            ("top", V::Num(h.top)),
                                            ("height", V::Num(h.height)),
                                            (
                                                "node_ids",
                                                V::Arr(
                                                    h.node_ids
                                                        .iter()
                                                        .map(|i| V::Int(*i as i64))
                                                        .collect(),
                                                ),
                                            ),
                                        ])
                                    }),
                                ),
                                ("placed_top", V::Num(f.placed_top)),
                            ])
                        })
                        .collect(),
                ),
            ),
        ])
    });
    V::Obj(vec![
        ("schema", V::Str("vellora-layout-dump/2".into())),
        ("vellora_core", V::Str(env!("CARGO_PKG_VERSION").into())),
        (
            "viewport",
            V::Obj(vec![
                ("width_px", V::Int(dump.viewport_width_px as i64)),
                ("height_px", V::Int(dump.viewport_height_px as i64)),
            ]),
        ),
        (
            "page",
            V::Obj(vec![
                ("width", V::Num(page.width)),
                ("height", V::Num(page.height)),
                ("margin_top", V::Num(page.margin_top)),
                ("margin_right", V::Num(page.margin_right)),
                ("margin_bottom", V::Num(page.margin_bottom)),
                ("margin_left", V::Num(page.margin_left)),
                ("content_width", V::Num(page.content_width())),
                ("content_height", V::Num(page.content_height())),
            ]),
        ),
        ("media_type", V::Str(dump.media_type.into())),
        (
            "html_normalize",
            V::Str(
                if dump.html_normalize_applied {
                    "applied"
                } else {
                    "skipped"
                }
                .into(),
            ),
        ),
        (
            "normalize",
            V::Obj(vec![
                (
                    "wrappers_recorded",
                    V::Int(dump.normalize_wrappers_recorded as i64),
                ),
                (
                    "wrappers_located",
                    V::Int(dump.normalize_wrappers_located as i64),
                ),
            ]),
        ),
        (
            "passes",
            V::Arr(
                dump.layers
                    .iter()
                    .skip(1)
                    .map(|l| V::Str(l.name.clone()))
                    .collect(),
            ),
        ),
        ("nodes", V::Arr(nodes)),
        ("blitz_tree", V::Arr(blitz_tree)),
        ("blitz_runs", V::Arr(blitz_runs)),
        ("layers", V::Arr(layers)),
        ("runs", V::Arr(runs)),
        (
            "run_meta_mismatches",
            V::Arr(
                dump.run_meta_mismatches
                    .iter()
                    .map(|i| V::Int(*i as i64))
                    .collect(),
            ),
        ),
        (
            "layer_order_violations",
            V::Arr(
                dump.layer_order_violations
                    .iter()
                    .map(|n| V::Str(n.clone()))
                    .collect(),
            ),
        ),
        ("pagination", pagination),
    ])
}
