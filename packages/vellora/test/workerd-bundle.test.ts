/**
 * Issue #63: on Cloudflare Workers, `import { renderPdf } from "vellora"` must bundle without the
 * native addon. Bundles the BUILT package the way Wrangler does (esbuild, `workerd` / `worker` /
 * `browser` conditions, `node:` built-ins external with `nodejs_compat`) and checks that the
 * `#runtime` seam picked the WebAssembly engine and that nothing native (napi addon, resvg) or
 * code-generation-from-strings (`new Function`, refused by workerd) is left in the Worker graph.
 * The end-to-end run under `wrangler dev` is `examples/cloudflare-worker`.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { describe, expect, test } from "vitest";

const PKG_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // packages/vellora
const ENTRY = join(PKG_DIR, "dist", "index.js");

describe.skipIf(!existsSync(ENTRY))("workerd bundle of the built vellora package", () => {
  test("resolves the WebAssembly engine and leaves every native module out", async () => {
    const result = await build({
      entryPoints: [ENTRY],
      bundle: true,
      write: false,
      metafile: true,
      format: "esm",
      platform: "neutral",
      conditions: ["workerd", "worker", "browser"],
      // `@vellora/wasm` is the engine on workerd; Wrangler bundles its `.wasm` (not needed here).
      external: ["node:*", "@vellora/wasm"],
      logLevel: "silent",
    });
    const inputs = Object.keys(result.metafile.inputs);
    expect(inputs.some((path) => path.endsWith("runtime.workerd.js"))).toBe(true);
    expect(inputs.filter((path) => /\/runtime\.js$/.test(path))).toEqual([]);
    const forbidden =
      /packages\/(native|lint|engine-chromium)\/|@vellora\/(native|lint|engine-chromium)|@resvg|parse5/;
    expect(inputs.filter((path) => forbidden.test(path))).toEqual([]);

    const code = result.outputFiles[0]?.text ?? "";
    expect(code).toContain('import("@vellora/wasm")');
    expect(code).not.toContain("new Function(");
    expect(code).not.toContain("@vellora/native");
  });
});
