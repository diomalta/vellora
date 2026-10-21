// Forked worker: renders reftests through vellora one at a time. Runs in its own process so a
// native crash (abort / stack overflow — `catch_unwind` only covers panics) or a hang is contained
// and attributed to the test by the parent (lib/pool.mjs).
import { pathToFileURL } from "node:url";
import { Lru, makeLoader } from "./loader.mjs";
import { runReftest } from "./run-test.mjs";
import { makeVelloraRender } from "./vellora-render.mjs";

const config = JSON.parse(process.env.VELLORA_WPT_WORKER_CONFIG ?? "{}");
const specifier = config.velloraModule ? pathToFileURL(config.velloraModule).href : "vellora";
const vellora = await import(specifier);
const render = makeVelloraRender({
  vellora,
  wptRoot: config.wptRoot,
  inlineCss: config.inlineCss,
  bundledFontsDir: config.bundledFontsDir,
});
// Rasterized nodes are cached per worker: shared references (e.g. ref-filled-green-100px-square)
// recur across hundreds of tests.
const caches = { screen: new Lru(48), print: new Lru(48) };

process.on("message", async (msg) => {
  if (msg?.type !== "run") return;
  const { id, test } = msg;
  let result;
  try {
    const loadNode = makeLoader({
      wptRoot: config.wptRoot,
      mode: test.mode,
      render,
      cache: caches[test.mode],
      antialias: config.antialias !== false,
      rasterizer: config.rasterizer,
    });
    result = await runReftest({
      test,
      loadNode,
      artifactsDir: config.artifactsDir,
      artifacts: config.artifacts,
      keepPdf: config.keepPdf,
      chainReferences: config.chainReferences === true,
    });
  } catch (e) {
    result = {
      test: test.rel,
      mode: test.mode,
      outcome: "error",
      node: "test",
      cause: { status: "error", kind: "harness", message: String(e?.stack ?? e) },
    };
  }
  process.send({ type: "result", id, result });
});

process.send({ type: "ready", pid: process.pid });
