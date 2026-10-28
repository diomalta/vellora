//! Debug layout dump for the fidelity tooling (`fidelity/layout-diff/`).
//!
//! ```text
//! cargo run --release -p vellora-core --example layout_dump -- \
//!   --html <templated.html> --out <dump.json> [--pdf <render.pdf>] \
//!   [--font <face.ttf>]... [--image <src>=<file>]... [--base-url <url>]
//!   [--no-html-normalize]
//! ```
//!
//! `--no-html-normalize` writes the source-HTML dump
//! (`vellora_core::debug_layout_dump_source_html`; fidelity layer `N0`). It once
//! skipped vellora's html_normalize pre-pass; port step 05 deleted that pre-pass,
//! so the render path lays out the input as given too and the N0 Blitz tree
//! equals the default dump's. It cannot be combined with `--pdf` (the source dump
//! has no pagination layer; `--pdf` belongs with the default dump).
//!
//! `--pdf` additionally writes the normal `vellora_core::render` output for the
//! same input (fixed creation date), so a paginated probe can be compared with
//! the pre-pagination layers.
//!
//! Calls `vellora_core::debug_layout_dump`, which runs `render`'s exact
//! validation + layout sequence with an observer and then traces pagination, and
//! writes the dump with `vellora_core::layout_dump::json::to_json`
//! (schema `vellora-layout-dump/2`):
//!
//! - `blitz_tree` (`B0`): Blitz's own layout tree (`layout_children`, incl.
//!   anonymous blocks), absolute border boxes from rounded `final_layout` and
//!   from `unrounded_layout`, each placed on its containing block's origin as
//!   Blitz's painter places it; `blitz_runs`: its raw Parley text runs.
//! - `layers[0]` (`L0`): vellora's box walk (Blitz's box tree, table rows
//!   re-inserted), before any pass.
//! - `layers[1..]`: after each named `layout_normalize` pass, in render order.
//! - `pagination` (`P`): every fragment placement of `paginate` (null for N0).
//!
//! Every box is keyed by `node_id`; `nodes` maps ids to stable source-DOM paths.

use std::collections::HashMap;
use std::process::ExitCode;

use vellora_core::RenderOptions;

fn run() -> Result<(), String> {
    let mut html_path: Option<String> = None;
    let mut out_path: Option<String> = None;
    let mut pdf_path: Option<String> = None;
    let mut source_html = false;
    let mut opts = RenderOptions {
        // Fixed, like every vellora render: never wall-clock.
        creation_date: Some((2026, 6, 25)),
        ..Default::default()
    };
    let mut images: HashMap<String, Vec<u8>> = HashMap::new();
    let mut args = std::env::args().skip(1);
    while let Some(arg) = args.next() {
        let mut value = || args.next().ok_or_else(|| format!("{arg} needs a value"));
        match arg.as_str() {
            "--html" => html_path = Some(value()?),
            "--out" => out_path = Some(value()?),
            "--pdf" => pdf_path = Some(value()?),
            "--base-url" => opts.base_url = Some(value()?),
            "--no-html-normalize" => source_html = true,
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
    if source_html && pdf_path.is_some() {
        return Err("--no-html-normalize cannot be combined with --pdf".into());
    }
    let dump = if source_html {
        vellora_core::debug_layout_dump_source_html(&html, &opts)
    } else {
        vellora_core::debug_layout_dump(&html, &opts)
    }
    .map_err(|e| format!("{e:?}"))?;
    let mut json = vellora_core::layout_dump::json::to_json(&dump);
    json.push('\n');
    std::fs::write(&out_path, json).map_err(|e| format!("{out_path}: {e}"))?;
    if let Some(pdf_path) = pdf_path {
        // The normal render of the same input (same options), for the PAGINATED probe
        // (fidelity/layout-diff/pdf-probe.mjs): where pre-pagination layers and PDF disagree.
        let pdf = vellora_core::render(&html, &opts).map_err(|e| format!("{e:?}"))?;
        std::fs::write(&pdf_path, pdf).map_err(|e| format!("{pdf_path}: {e}"))?;
    }
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
