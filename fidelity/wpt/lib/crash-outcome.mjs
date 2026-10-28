// Crashtest outcome taxonomy (fidelity/wpt/crashtests.mjs). Pure, so it is unit-tested.
//   ok       rendered, or rejected cleanly (strict gate VelloraUnsupportedError, typed input/
//            template/conformance/render error): the engine did not crash
//   panic    a Rust panic surfaced as a rejection (catch_unwind in the napi binding)
//   crash    the worker process died (abort, stack overflow) - set by the pool, not here
//   timeout  the worker exceeded its budget and was killed - set by the pool
//   error    the HARNESS failed (not the engine); reported, never counted as ok
//   skip     the file is not UTF-8 (vellora's input contract)
export const CRASH_OUTCOMES = Object.freeze(["ok", "panic", "crash", "timeout", "error", "skip"]);

/** Map a render outcome onto the crashtest taxonomy. */
export function crashOutcome(error) {
  if (!error) return { outcome: "ok" };
  if (error.status === "unsupported")
    return { outcome: "ok", rejected: `unsupported ${error.feature}` };
  if (error.kind === "panic")
    return { outcome: "panic", message: String(error.message).slice(0, 400) };
  if (error.kind === "harness")
    return { outcome: "error", message: String(error.message).slice(0, 400) };
  return { outcome: "ok", rejected: `${error.kind}: ${String(error.message).slice(0, 200)}` };
}
