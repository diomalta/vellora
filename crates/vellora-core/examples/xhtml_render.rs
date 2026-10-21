//! XHTML render for the WPT harness (`fidelity/wpt/`), next to the layout dump hook.
//!
//! ```text
//! cargo build --release -p vellora-core --example xhtml_render
//! xhtml_render < request > response
//! ```
//!
//! WPT serves `.xht`/`.xhtml` files as `application/xhtml+xml`, so Chrome (the reference engine)
//! parses them with its XML parser. vellora parses every document as HTML (port step 08), which
//! is right for its input (`renderPdf(html)`, a `text/html` string) but not for those files: a
//! CDATA section in a `<style>`, for one, is CSS garbage to the HTML parser. The harness therefore
//! renders `.xht`/`.xhtml`/`.xml` nodes with this binary, which runs
//! `vellora_core::debug_render_xhtml`: `render`'s exact pipeline with the document parsed by
//! blitz-html's XML parser (xml5ever). It goes through vellora's TS `renderPdf` like every other
//! node, as its `NativeBridge` (`fidelity/wpt/lib/xhtml-bridge.mjs`), so only the parser
//! differs. Fidelity tooling only: no product build links or ships it.
//!
//! One render per process. Request on stdin: the magic `VXR1`, then records `tag: u8, len: u32
//! LE, bytes`: `H` html (once), `B` base URL, `T` title, `D` creation date (`YYYY-MM-DD`), `P`
//! PDF/A profile (`PDF/A-2b`), `F` a font face (repeated, in order), `K` an image key followed by
//! `I` its bytes (repeated). Response:
//!
//! - exit 0: the PDF bytes on stdout;
//! - exit 3: the rejection as records on stdout, mirroring the napi binding's error object:
//!   `M` message (`VelloraError`'s `Display`, or `render panicked: …`), and for a located
//!   diagnostic `f` feature, `l` line, `c` col (decimal, absent when `None`), `h` hint, or for a
//!   conformance failure `p` profile and `e` one error (repeated);
//! - exit 2: a malformed request (message on stderr).
//!
//! The render runs on a thread with an 8 MiB stack, the stack libuv gives the napi binding's
//! render tasks. A watchdog exits the process once its parent is gone (a harness worker killed
//! on timeout), so a hung render cannot outlive its worker.

use std::collections::HashMap;
use std::io::{Read, Write};
use std::panic::AssertUnwindSafe;
use std::process::ExitCode;

use vellora_core::{PdfAProfile, RenderOptions, VelloraError};

const RENDER_STACK_BYTES: usize = 8 << 20;

fn parse_request(input: &[u8]) -> Result<(Vec<u8>, RenderOptions), String> {
    let mut rest = input
        .strip_prefix(b"VXR1")
        .ok_or("request does not start with VXR1")?;
    let mut html = None;
    let mut opts = RenderOptions::default();
    let mut images = HashMap::new();
    let mut pending_key: Option<String> = None;
    while !rest.is_empty() {
        if rest.len() < 5 {
            return Err("truncated record header".into());
        }
        let tag = rest[0];
        let len = u32::from_le_bytes([rest[1], rest[2], rest[3], rest[4]]) as usize;
        let body = rest
            .get(5..5 + len)
            .ok_or("record longer than the request")?;
        rest = &rest[5 + len..];
        let text = || String::from_utf8(body.to_vec()).map_err(|e| format!("record {tag}: {e}"));
        match tag {
            b'H' => html = Some(body.to_vec()),
            b'B' => opts.base_url = Some(text()?),
            b'T' => opts.title = Some(text()?),
            b'D' => {
                let date = text()?;
                let mut parts = date.split('-').map(str::parse::<u32>);
                let (Some(Ok(y)), Some(Ok(m)), Some(Ok(d)), None) =
                    (parts.next(), parts.next(), parts.next(), parts.next())
                else {
                    return Err(format!("bad creation date {date:?}"));
                };
                opts.creation_date = match (u16::try_from(y), u8::try_from(m), u8::try_from(d)) {
                    (Ok(y), Ok(m), Ok(d)) => Some((y, m, d)),
                    _ => None,
                };
            }
            // Same mapping as the napi binding: an unknown profile is ignored there too.
            b'P' => opts.pdfa = (text()? == "PDF/A-2b").then_some(PdfAProfile::A2B),
            b'F' => opts.fonts.push(body.to_vec()),
            b'K' => pending_key = Some(text()?),
            b'I' => {
                let key = pending_key.take().ok_or("image bytes without a key")?;
                images.insert(key, body.to_vec());
            }
            other => return Err(format!("unknown record tag {other}")),
        }
    }
    opts.images = images;
    Ok((html.ok_or("request has no html record")?, opts))
}

fn record(out: &mut Vec<u8>, tag: u8, body: &[u8]) {
    out.push(tag);
    out.extend_from_slice(&(body.len() as u32).to_le_bytes());
    out.extend_from_slice(body);
}

fn rejection(message: &str, err: Option<&VelloraError>) -> Vec<u8> {
    let mut out = Vec::new();
    record(&mut out, b'M', message.as_bytes());
    match err {
        Some(VelloraError::Unsupported(d)) => {
            record(&mut out, b'f', d.feature.as_bytes());
            if let Some(line) = d.line {
                record(&mut out, b'l', line.to_string().as_bytes());
            }
            if let Some(col) = d.col {
                record(&mut out, b'c', col.to_string().as_bytes());
            }
            record(&mut out, b'h', d.hint.as_bytes());
        }
        Some(VelloraError::Conformance { profile, errors }) => {
            record(&mut out, b'p', profile.as_bytes());
            for e in errors {
                record(&mut out, b'e', e.as_bytes());
            }
        }
        _ => {}
    }
    out
}

/// The napi binding's panic message, verbatim (`crates/vellora-napi/src/lib.rs`).
fn panic_message(panic: Box<dyn std::any::Any + Send>) -> String {
    let detail = panic
        .downcast_ref::<&str>()
        .map(|s| s.to_string())
        .or_else(|| panic.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "unknown panic".to_string());
    format!("render panicked: {detail}")
}

#[cfg(unix)]
fn exit_when_orphaned() {
    let parent = std::os::unix::process::parent_id();
    std::thread::spawn(move || loop {
        std::thread::sleep(std::time::Duration::from_millis(250));
        if std::os::unix::process::parent_id() != parent {
            std::process::exit(4);
        }
    });
}

#[cfg(not(unix))]
fn exit_when_orphaned() {}

fn main() -> ExitCode {
    exit_when_orphaned();
    let mut input = Vec::new();
    if let Err(e) = std::io::stdin().read_to_end(&mut input) {
        eprintln!("xhtml_render: stdin: {e}");
        return ExitCode::from(2);
    }
    let (html, opts) = match parse_request(&input) {
        Ok(request) => request,
        Err(message) => {
            eprintln!("xhtml_render: {message}");
            return ExitCode::from(2);
        }
    };
    let outcome = std::thread::Builder::new()
        .stack_size(RENDER_STACK_BYTES)
        .spawn(move || {
            std::panic::catch_unwind(AssertUnwindSafe(|| {
                vellora_core::debug_render_xhtml(&html, &opts)
            }))
        })
        .expect("spawn the render thread")
        .join()
        .expect("the render thread catches its panics");
    let (code, bytes) = match outcome {
        Ok(Ok(pdf)) => (0, pdf),
        Ok(Err(err)) => (3, rejection(&err.to_string(), Some(&err))),
        Err(panic) => (3, rejection(&panic_message(panic), None)),
    };
    let mut stdout = std::io::stdout().lock();
    if stdout
        .write_all(&bytes)
        .and_then(|()| stdout.flush())
        .is_err()
    {
        return ExitCode::from(2);
    }
    ExitCode::from(code)
}
