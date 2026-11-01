//! vellora-wasm — the WebAssembly binding over `vellora-core`.
//!
//! Same contract as `vellora-napi`, for runtimes that cannot load a native `.node` addon
//! (Cloudflare Workers / workerd, Vercel Edge, Deno Deploy, browsers):
//!
//! - one entry point, `render(html: Uint8Array, opts?) -> Uint8Array` (synchronous here: the
//!   WebAssembly build is single-threaded, so the JS wrapper in `@vellora/wasm` presents it as a
//!   `Promise` to keep the `NativeBridge` shape);
//! - a core `Unsupported` error becomes a JS `Error` carrying `{ feature, line, col, hint }`; a
//!   conformance failure carries `{ profile, errors }` — byte-for-byte the properties the napi
//!   binding attaches, so the `vellora` package maps both bindings with the same code.
//!
//! **Panics.** `wasm32-unknown-unknown`'s standard library is built with `panic = "abort"`, so a
//! panic cannot be caught here with `catch_unwind` the way `vellora-napi` does: it traps the
//! instance (`WebAssembly.RuntimeError: unreachable`). The panic hook installed by [`start`]
//! records the message first; the JS wrapper reads it with [`take_panic_message`], rejects the
//! render with `render panicked: <message>` (the napi wording), and re-instantiates the module
//! (`wasm-bindgen --experimental-reset-state-function`) because a trapped instance's stack and
//! heap are no longer trustworthy. Non-unwinding aborts (stack overflow) are still headed off
//! upstream by `vellora_core::validation`'s recursion-depth gate, as on the native path.

use std::cell::RefCell;
use std::collections::HashMap;

use js_sys::{Array, Error as JsError, Object, Reflect, Uint8Array};
use vellora_core::{PdfAProfile, RenderOptions, VelloraError};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

thread_local! {
    /// Message of the last panic, recorded by the hook before the instance traps.
    static LAST_PANIC: RefCell<Option<String>> = const { RefCell::new(None) };
}

/// Module start function: runs once per instantiation (and again after every
/// `__wbg_reset_state`, which re-runs `__wbindgen_start` on the fresh instance), so each instance
/// records its panic message before trapping.
#[wasm_bindgen(start)]
pub fn start() {
    std::panic::set_hook(Box::new(|info| {
        let detail = info
            .payload()
            .downcast_ref::<&str>()
            .map(|s| s.to_string())
            .or_else(|| info.payload().downcast_ref::<String>().cloned())
            .unwrap_or_else(|| "unknown panic".to_string());
        LAST_PANIC.with(|slot| *slot.borrow_mut() = Some(detail));
    }));
}

/// Return (and clear) the message of the panic that trapped the last call, formatted like the
/// napi binding's rejection (`render panicked: <detail>`). `undefined` when no panic was recorded.
#[wasm_bindgen(js_name = "takePanicMessage")]
pub fn take_panic_message() -> Option<String> {
    LAST_PANIC
        .with(|slot| slot.borrow_mut().take())
        .map(|detail| format!("render panicked: {detail}"))
}

/// Render `html` document bytes (UTF-8 content, never a path) to PDF bytes.
///
/// `opts` mirrors `@vellora/native`'s `RenderOpts`: `{ title?, creationDate?: [y, m, d],
/// images?: Record<string, Uint8Array>, baseUrl?, fonts?: Uint8Array[], pdfa?: "PDF/A-2b" }`.
/// Throws a JS `Error` on a core error (see the module docs for its properties).
#[wasm_bindgen]
pub fn render(html: &[u8], opts: JsValue) -> Result<Vec<u8>, JsValue> {
    let opts = to_render_options(&opts)?;
    vellora_core::render(html, &opts).map_err(to_js_error)
}

/// Initial smoke export, mirroring `vellora-napi`'s `coreName`.
#[wasm_bindgen(js_name = "coreName")]
pub fn core_name() -> String {
    vellora_core::name().to_string()
}

/// Test-only export (NOT public surface): panics, so tests can prove the trap-to-rejection path
/// and that the instance is usable again after the JS wrapper resets it.
#[wasm_bindgen(js_name = "__forcePanicForTest")]
pub fn force_panic_for_test() {
    panic!("forced panic for test");
}

fn to_js_error(err: VelloraError) -> JsValue {
    let error = JsError::new(&err.to_string());
    let set = |key: &str, value: JsValue| {
        // `Reflect.set` on a fresh, extensible Error object cannot fail.
        let _ = Reflect::set(&error, &JsValue::from_str(key), &value);
    };
    match &err {
        VelloraError::Unsupported(diag) => {
            set("feature", JsValue::from_str(&diag.feature));
            set("line", diag.line.map_or(JsValue::NULL, JsValue::from));
            set("col", diag.col.map_or(JsValue::NULL, JsValue::from));
            set("hint", JsValue::from_str(&diag.hint));
        }
        VelloraError::Conformance { profile, errors } => {
            set("profile", JsValue::from_str(profile));
            let list = errors
                .iter()
                .map(|e| JsValue::from_str(e))
                .collect::<Array>();
            set("errors", list.into());
        }
        VelloraError::Render(_) => {}
    }
    error.into()
}

fn get(obj: &JsValue, key: &str) -> Result<JsValue, JsValue> {
    Reflect::get(obj, &JsValue::from_str(key))
}

fn bytes(value: &JsValue, what: &str) -> Result<Vec<u8>, JsValue> {
    value
        .dyn_ref::<Uint8Array>()
        .map(Uint8Array::to_vec)
        .ok_or_else(|| JsError::new(&format!("{what} must be a Uint8Array")).into())
}

/// Map the JS options object to `vellora_core::RenderOptions`, with exactly the napi binding's
/// semantics (`vellora-napi::to_render_options`): a `creationDate` that is not a 3-element array
/// of integers fitting `(u16, u8, u8)` is dropped (treated as "no date"); an unknown `pdfa`
/// profile is ignored (the `vellora` package validates it before the bridge).
fn to_render_options(opts: &JsValue) -> Result<RenderOptions, JsValue> {
    if opts.is_undefined() || opts.is_null() {
        return Ok(RenderOptions::default());
    }
    let title = get(opts, "title")?.as_string();
    let base_url = get(opts, "baseUrl")?.as_string();
    let pdfa = match get(opts, "pdfa")?.as_string().as_deref() {
        Some("PDF/A-2b") => Some(PdfAProfile::A2B),
        _ => None,
    };

    let creation_date = {
        let value = get(opts, "creationDate")?;
        if Array::is_array(&value) {
            let parts: Vec<Option<f64>> = Array::from(&value).iter().map(|v| v.as_f64()).collect();
            match parts.as_slice() {
                [Some(y), Some(m), Some(d)] => {
                    match (to_int::<u16>(*y), to_int::<u8>(*m), to_int::<u8>(*d)) {
                        (Some(y), Some(m), Some(d)) => Some((y, m, d)),
                        _ => None,
                    }
                }
                _ => None,
            }
        } else {
            None
        }
    };

    let mut images = HashMap::new();
    let images_value = get(opts, "images")?;
    if images_value.is_object() {
        let entries = Object::entries(images_value.unchecked_ref());
        for entry in entries.iter() {
            let pair = Array::from(&entry);
            let key = pair.get(0).as_string().unwrap_or_default();
            let value = bytes(&pair.get(1), &format!("images[{key:?}]"))?;
            images.insert(key, value);
        }
    }

    let mut fonts = Vec::new();
    let fonts_value = get(opts, "fonts")?;
    if Array::is_array(&fonts_value) {
        for (i, face) in Array::from(&fonts_value).iter().enumerate() {
            fonts.push(bytes(&face, &format!("fonts[{i}]"))?);
        }
    }

    Ok(RenderOptions {
        title,
        pdfa,
        creation_date,
        images,
        base_url,
        fonts,
    })
}

/// A JS number as an integer of width `T`, or `None` for a fractional, negative, or out-of-range
/// value (the napi binding's `u32` + `try_from` boundary, which also rejects those).
fn to_int<T: TryFrom<u64>>(n: f64) -> Option<T> {
    if n.is_finite() && n >= 0.0 && n.fract() == 0.0 && n <= u32::MAX as f64 {
        T::try_from(n as u64).ok()
    } else {
        None
    }
}
