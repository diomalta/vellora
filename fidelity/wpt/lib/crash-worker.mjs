// Forked worker for WPT crashtests (fidelity/wpt/crashtests.mjs): renders each crashtest file
// once through vellora's real pipeline. A crashtest asserts only "the engine does not crash", so
// the outcome is ok (rendered, or rejected cleanly by the strict gate / a typed error) or panic
// (a Rust panic surfaced as a rejection by catch_unwind). A native abort / stack overflow kills
// this process and is recorded by the pool as a crash; a hang as a timeout.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { crashOutcome } from "./crash-outcome.mjs";
import { decodeUtf8 } from "./discover.mjs";
import { makeVelloraRender } from "./vellora-render.mjs";

const config = JSON.parse(process.env.VELLORA_WPT_WORKER_CONFIG ?? "{}");
const specifier = config.velloraModule ? pathToFileURL(config.velloraModule).href : "vellora";
const vellora = await import(specifier);
const render = makeVelloraRender({
  vellora,
  wptRoot: config.wptRoot,
  inlineCss: config.inlineCss !== false,
  bundledFontsDir: config.bundledFontsDir,
});

process.on("message", async (msg) => {
  if (msg?.type !== "run") return;
  const { id, test } = msg;
  const started = Date.now();
  let result;
  try {
    const content = decodeUtf8(readFileSync(join(config.wptRoot, test.rel)));
    if (content === null) {
      result = { test: test.rel, outcome: "skip", cause: { reason: "non-utf8" } };
    } else {
      let error = null;
      try {
        await render({ url: test.url, rel: test.rel, content, mode: test.mode });
      } catch (e) {
        error =
          e && typeof e === "object" && "status" in e
            ? e
            : { kind: "harness", message: String(e?.stack ?? e) };
      }
      result = { test: test.rel, ...crashOutcome(error) };
    }
  } catch (e) {
    result = { test: test.rel, outcome: "error", message: String(e?.stack ?? e).slice(0, 400) };
  }
  result.durationMs = Date.now() - started;
  process.send({ type: "result", id, result });
});

process.send({ type: "ready", pid: process.pid });
