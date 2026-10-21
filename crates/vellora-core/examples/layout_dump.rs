//! Debug layout dump for the fidelity tooling (`fidelity/layout-diff/`).
//!
//! ```text
//! cargo run --release -p vellora-core --example layout_dump -- \
//!   --html <templated.html> --out <dump.json> \
//!   [--font <face.ttf>]... [--image <src>=<file>]... [--base-url <url>]
//! ```
//!
//! Calls `vellora_core::debug_layout_dump`, which runs `render`'s exact
//! validation + layout sequence (stopping before pagination) with an observer,
//! and writes every captured layer as JSON:
//!
//! - `blitz_tree` (`B0`): Blitz's own layout tree (`layout_children`, incl.
//!   anonymous blocks), absolute border boxes from rounded `final_layout` and
//!   from `unrounded_layout`.
//! - `layers[0]` (`L0`): vellora's DOM-children box walk, before any pass.
//! - `layers[1..]`: after each named `layout_normalize` pass, in render order.
//!
//! Every box is keyed by `node_id`; `nodes` maps ids to stable source-DOM paths.
//! The JSON writer is hand-rolled so the shipped crate gains no serde dependency.

use std::collections::HashMap;
use std::fmt::Write as _;
use std::process::ExitCode;

use vellora_core::blitz_engine::LayoutDump;
use vellora_core::RenderOptions;

/// Minimal JSON value + writer (numbers rounded to 1e-4 CSS px).
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

fn to_json(dump: &LayoutDump) -> V {
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
                ("box_fields", V::Str("node_id,depth,x,y,w,h".into())),
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
    V::Obj(vec![
        ("schema", V::Str("vellora-layout-dump/1".into())),
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
    ])
}

fn run() -> Result<(), String> {
    let mut html_path: Option<String> = None;
    let mut out_path: Option<String> = None;
    let mut opts = RenderOptions::default();
    let mut images: HashMap<String, Vec<u8>> = HashMap::new();
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        let mut value = || args.next().ok_or_else(|| format!("{arg} needs a value"));
        match arg.as_str() {
            "--html" => html_path = Some(value()?),
            "--out" => out_path = Some(value()?),
            "--base-url" => opts.base_url = Some(value()?),
            "--font" => {
                let path = value()?;
                opts.fonts
                    .push(std::fs::read(&path).map_err(|e| format!("{path}: {e}"))?);
            }
            "--image" => {
                let spec = value()?;
                let (key, path) = spec
                    .split_once('=')
                    .ok_or_else(|| format!("--image expects <src>=<file>, got {spec}"))?;
                let bytes = std::fs::read(path).map_err(|e| format!("{path}: {e}"))?;
                images.insert(key.to_string(), bytes);
            }
            other => return Err(format!("unknown argument {other}")),
        }
    }
    opts.images = images;
    let html_path = html_path.ok_or("--html <file> is required")?;
    let out_path = out_path.ok_or("--out <file> is required")?;
    let html = std::fs::read(&html_path).map_err(|e| format!("{html_path}: {e}"))?;
    let dump = vellora_core::debug_layout_dump(&html, &opts).map_err(|e| format!("{e:?}"))?;
    let mut json = String::new();
    to_json(&dump).write(&mut json);
    json.push('\n');
    std::fs::write(&out_path, json).map_err(|e| format!("{out_path}: {e}"))?;
    Ok(())
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(message) => {
            eprintln!("layout_dump: {message}");
            ExitCode::FAILURE
        }
    }
}
