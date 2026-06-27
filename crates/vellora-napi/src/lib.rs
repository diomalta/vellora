//! vellora-napi — the async, thread-safe napi-rs binding over `vellora-core`.
//!
//! Exposes exactly one rendering entry point to JavaScript: an async
//! `render(html, opts) -> Promise<Uint8Array>`. The actual `vellora-core` work
//! runs on a libuv worker thread (via napi-rs [`Task`]) so the Node event loop
//! is never blocked. The binding holds no shared mutable state — each call owns
//! its inputs and output, so N concurrent renders behave like N sequential ones.
//! Core errors and *unwinding* Rust panics are caught at the
//! boundary and surfaced as rejected promises. This does NOT protect
//! against non-unwinding aborts such as a stack overflow; that class is headed
//! off upstream by the recursion-depth gate in `vellora_core::validation`
//! (`MAX_NESTING_DEPTH`), which rejects over-deep input before any recursion
//! runs.

use std::panic::AssertUnwindSafe;

use napi::bindgen_prelude::{AsyncTask, Object, Uint8Array};
use napi::{Env, Error, JsValue, Result, Status, Task};
use napi_derive::napi;
use vellora_core::{PdfAProfile, RenderOptions, VelloraError};

/// JS-facing render options. Mirrors `vellora_core::RenderOptions`: producer is
/// fixed to `vellora`; the document title, a deterministic creation date
/// `(year, month, day)`, and optional image assets are caller-supplied.
#[napi(object)]
pub struct RenderOpts {
    /// Document title written to the PDF info dictionary.
    pub title: Option<String>,
    /// Deterministic creation date as `[year, month, day]`; never wall-clock.
    pub creation_date: Option<Vec<u32>>,
    /// Image bytes keyed by an `<img>`'s `src` string (a JS `Record<string,
    /// Uint8Array>`). Used to resolve non-`data:` image sources; the format is
    /// detected from the bytes in the core.
    pub images: Option<std::collections::HashMap<String, Uint8Array>>,
    /// Base URL used only to normalize a relative `<img>` `src` into the `images`
    /// lookup key. Never fetched.
    pub base_url: Option<String>,
    /// Caller-supplied font faces (raw TTF/OTF bytes, a JS `Uint8Array[]`). Each
    /// registers into the deterministic font context; family/weight/style are
    /// read from the bytes in the core. An unparseable face rejects with
    /// `font:invalid`.
    pub fonts: Option<Vec<Uint8Array>>,
    /// Archival conformance profile. Currently only "PDF/A-2b" is supported.
    pub pdfa: Option<String>,
}

/// The structured located-diagnostic carried across the boundary on a core
/// `Unsupported` error. Stashed by [`RenderTask::compute`] so [`RenderTask::reject`]
/// can attach `{ feature, line, col, hint }` as machine-readable properties.
struct LocatedDiagnostic {
    feature: String,
    line: Option<u32>,
    col: Option<u32>,
    hint: String,
}

/// Structured conformance failure carried across napi as `{ profile, errors }`.
struct ConformanceDiagnostic {
    profile: String,
    errors: Vec<String>,
}

/// The async render unit of work. Carries only `Send` data: the owned HTML bytes
/// (copied off the JS `Uint8Array` on the main thread) and the parsed options.
/// `compute` runs on a libuv worker; the `!Send` Blitz document lives entirely
/// inside `vellora_core::render` on that worker and never crosses a boundary.
pub struct RenderTask {
    html: Vec<u8>,
    opts: RenderOptions,
    /// Set by `compute` on a core `Unsupported` error so `reject` can attach the
    /// structured fields.
    located: Option<LocatedDiagnostic>,
    /// Set by `compute` on a core conformance error so `reject` can attach the
    /// structured fields.
    conformance: Option<ConformanceDiagnostic>,
}

impl Task for RenderTask {
    type Output = Vec<u8>;
    type JsValue = Uint8Array;

    /// Runs on a libuv worker thread. Catches *unwinding* panics so a single bad
    /// render surfaces as a rejected promise rather than a process abort. Note
    /// this does not protect against non-unwinding aborts such as a stack
    /// overflow — that class is prevented by the recursion-depth gate in
    /// `vellora_core::validation`.
    fn compute(&mut self) -> Result<Self::Output> {
        let result = std::panic::catch_unwind(AssertUnwindSafe(|| {
            vellora_core::render(&self.html, &self.opts)
        }));
        match result {
            Ok(Ok(pdf)) => Ok(pdf),
            Ok(Err(err)) => {
                if let VelloraError::Unsupported(diag) = &err {
                    self.located = Some(LocatedDiagnostic {
                        feature: diag.feature.clone(),
                        line: diag.line,
                        col: diag.col,
                        hint: diag.hint.clone(),
                    });
                }
                if let VelloraError::Conformance { profile, errors } = &err {
                    self.conformance = Some(ConformanceDiagnostic {
                        profile: profile.clone(),
                        errors: errors.clone(),
                    });
                }
                Err(Error::new(Status::GenericFailure, err.to_string()))
            }
            Err(panic) => Err(Error::new(Status::GenericFailure, panic_message(panic))),
        }
    }

    /// Runs on the main thread. Copies the PDF bytes out of the Rust `Vec` into a
    /// fresh JS-owned `Uint8Array`, so the consumer can hold/slice/mutate it with
    /// no lifetime coupling to Rust memory.
    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(Uint8Array::new(output))
    }

    /// Runs on the main thread when `compute` returned `Err`. Builds a JS `Error`
    /// whose message carries the core diagnostic AND, for a located diagnostic,
    /// exposes `{ feature, line, col, hint }` as machine-readable properties so the
    /// public-API adapter can reconstruct the located error verbatim.
    fn reject(&mut self, env: Env, err: Error) -> Result<Self::JsValue> {
        let Some(diag) = self.located.take() else {
            let Some(conformance) = self.conformance.take() else {
                return Err(err);
            };
            let mut error_obj: Object = env.create_error(err)?;
            error_obj.set("profile", conformance.profile)?;
            error_obj.set("errors", conformance.errors)?;
            return Err(Error::from(error_obj.to_unknown()));
        };
        let mut error_obj: Object = env.create_error(err)?;
        error_obj.set("feature", diag.feature)?;
        error_obj.set("line", diag.line)?;
        error_obj.set("col", diag.col)?;
        error_obj.set("hint", diag.hint)?;
        Err(Error::from(error_obj.to_unknown()))
    }
}

/// Render `html` document bytes to a PDF on the libuv threadpool.
///
/// `html` is read as *content* bytes (UTF-8), never a file path — the binding
/// performs no filesystem access. The bytes are copied into an owned `Vec` on the
/// main thread, then consumed inside `vellora_core::render` on a worker. Resolves
/// with a JS-owned `Uint8Array` of PDF bytes, or rejects with an `Error` carrying
/// the core diagnostic (and, when located, its `{ feature, line, col, hint }`).
#[napi(ts_return_type = "Promise<Uint8Array>")]
pub fn render(html: Uint8Array, opts: Option<RenderOpts>) -> AsyncTask<RenderTask> {
    let task = RenderTask {
        html: html.to_vec(),
        opts: to_render_options(opts),
        located: None,
        conformance: None,
    };
    AsyncTask::new(task)
}

/// Map the JS options object to `vellora_core::RenderOptions`. A 3-element
/// `creationDate` `[y, m, d]` becomes `(u16, u8, u8)`; any other shape — or a
/// component that does not fit its integer width (year > 65535, or month/day >
/// 255) — is dropped (treated as "no date"), matching the deterministic,
/// non-wall-clock contract. Checked conversions avoid silently truncating such an
/// out-of-range component to a wrong-but-plausible date via `as`.
///
/// Note: this boundary validates only the integer WIDTH, not calendar semantics.
/// An in-range but invalid component (e.g. month 13 or day 200) still passes here
/// and is clamped — not dropped — downstream by krilla (e.g. `[2021, 13, 200]`
/// renders as 2021-12-31, NOT "no date"). The stronger "treated as no date"
/// guarantee holds only for width-overflowing values.
fn to_render_options(opts: Option<RenderOpts>) -> RenderOptions {
    let Some(opts) = opts else {
        return RenderOptions::default();
    };
    let creation_date = match opts.creation_date.as_deref() {
        Some([y, m, d]) => match (u16::try_from(*y), u8::try_from(*m), u8::try_from(*d)) {
            (Ok(y), Ok(m), Ok(d)) => Some((y, m, d)),
            _ => None,
        },
        _ => None,
    };
    // Copy each JS `Uint8Array` into an owned `Vec<u8>` (the bytes must outlive the
    // JS values on the worker thread). Lookup is by key, so map order is irrelevant.
    let images = opts
        .images
        .map(|m| {
            m.into_iter()
                .map(|(k, v)| (k, v.to_vec()))
                .collect::<std::collections::HashMap<String, Vec<u8>>>()
        })
        .unwrap_or_default();
    // Copy each JS `Uint8Array` face into an owned `Vec<u8>` (same outlives-the-JS
    // reason as images). Registration is positional, so order is preserved.
    let fonts = opts
        .fonts
        .map(|faces| faces.iter().map(|f| f.to_vec()).collect::<Vec<Vec<u8>>>())
        .unwrap_or_default();
    let pdfa = opts.pdfa.as_deref().and_then(|profile| match profile {
        "PDF/A-2b" => Some(PdfAProfile::A2B),
        _ => None,
    });
    RenderOptions {
        title: opts.title,
        pdfa,
        creation_date,
        images,
        base_url: opts.base_url,
        fonts,
    }
}

/// Extract a readable message from a caught panic payload.
fn panic_message(panic: Box<dyn std::any::Any + Send>) -> String {
    let detail = panic
        .downcast_ref::<&str>()
        .map(|s| s.to_string())
        .or_else(|| panic.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "unknown panic".to_string());
    format!("render panicked: {detail}")
}

/// Initial smoke export, retained so existing loader tests keep linking: returns
/// the core crate name, proving the addon links `vellora-core` in-process.
#[napi]
pub fn core_name() -> String {
    vellora_core::name().to_string()
}

/// Test-only task: panics inside `compute` on the libuv worker thread to verify
/// the panic-to-rejection boundary (the same `catch_unwind` the render path uses).
pub struct PanicTask;

impl Task for PanicTask {
    type Output = ();
    type JsValue = ();

    fn compute(&mut self) -> Result<Self::Output> {
        let result = std::panic::catch_unwind(AssertUnwindSafe(|| {
            panic!("forced panic for test");
        }));
        match result {
            Ok(()) => Ok(()),
            Err(panic) => Err(Error::new(Status::GenericFailure, panic_message(panic))),
        }
    }

    fn resolve(&mut self, _env: Env, _output: Self::Output) -> Result<Self::JsValue> {
        Ok(())
    }
}

/// Test-only export (NOT part of the public surface): forces an *unwinding* Rust
/// panic on the worker thread so tests can assert it surfaces as a rejected
/// promise and the process survives. Mirrors the render path's
/// `catch_unwind`-in-`compute`. This exercises only the recoverable
/// (unwinding-panic) path, NOT the non-unwinding abort class (stack overflow),
/// which is headed off by the recursion-depth gate instead.
#[napi(js_name = "__forcePanicForTest", ts_return_type = "Promise<void>")]
pub fn force_panic_for_test() -> AsyncTask<PanicTask> {
    AsyncTask::new(PanicTask)
}
