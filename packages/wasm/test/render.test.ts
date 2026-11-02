/**
 * The WebAssembly engine through the real `@vellora/wasm` Node entry: same contract as
 * `@vellora/native` (PDF bytes, located diagnostics, panic → rejection), plus byte parity with
 * the native addon on the shared fixtures.
 *
 * Needs `npm run build:wasm` (wasm32 target + the pinned wasm-bindgen CLI). Without the build the
 * suite is skipped, unless `VELLORA_WASM_TESTS=1` (set in CI), where a missing build fails.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";
import { WARMUP_HTML, WARMUP_PNG } from "../src/warmup";
// Imported in `beforeAll`, not statically: the engine module imports the wasm-bindgen glue
// (`../wasm/vellora.js`), which exists only after `npm run build:wasm`, and a failed static
// import fails the whole file before `describe.skipIf` can skip it.
type Engine = typeof import("../src/node");
let engine: Engine;
const render: Engine["render"] = (...args) => engine.render(...args);
const coreName: Engine["coreName"] = () => engine.coreName();
const __forcePanicForTest: Engine["__forcePanicForTest"] = () => engine.__forcePanicForTest();
const warmup: Engine["warmup"] = (...args) => engine.warmup(...args);

const PKG_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = join(PKG_DIR, "..", "..");
const WASM = join(PKG_DIR, "wasm", "vellora_bg.wasm");
const built = existsSync(WASM);
const required = process.env.VELLORA_WASM_TESTS === "1";

if (!built && !required) {
  console.warn(
    "@vellora/wasm tests skipped: run `npm run build:wasm` (or set VELLORA_WASM_TESTS=1).",
  );
}

const encoder = new TextEncoder();
const HEAD = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><style>@page { size: A4; margin: 16mm; }</style></head>`;
const doc = (body: string) => encoder.encode(`${HEAD}<body>${body}</body></html>`);
const isPdf = (b: Uint8Array) => new TextDecoder().decode(b.subarray(0, 5)) === "%PDF-";

beforeAll(async () => {
  if (built) {
    engine = await import("../src/node");
  }
});

describe.skipIf(!built && !required)("@vellora/wasm", () => {
  test("the WebAssembly module is built", () => {
    expect(built).toBe(true);
  });

  test("links vellora-core", async () => {
    expect(await coreName()).toBe("vellora-core");
  });

  test("renders a PDF, deterministically", async () => {
    const opts = { title: "T", creationDate: [2024, 1, 1] as [number, number, number] };
    const a = await render(doc("<h1>Invoice</h1><p>One paragraph.</p>"), opts);
    const b = await render(doc("<h1>Invoice</h1><p>One paragraph.</p>"), opts);
    expect(a).toBeInstanceOf(Uint8Array);
    expect(isPdf(a)).toBe(true);
    expect(Buffer.compare(a, b)).toBe(0);
  });

  test("an out-of-subset construct rejects with the located diagnostic", async () => {
    const error = await render(doc("<div><script>1</script></div>")).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    const diag = error as { feature: unknown; line: unknown; col: unknown; hint: unknown };
    expect(diag.feature).toBe("element:script");
    expect(typeof diag.line).toBe("number");
    expect(typeof diag.col).toBe("number");
    expect(typeof diag.hint).toBe("string");
  });

  test("an unparseable custom font rejects with font:invalid", async () => {
    const error = await render(doc("<p>x</p>"), { fonts: [new Uint8Array([1, 2, 3])] }).catch(
      (e: unknown) => e,
    );
    expect((error as { feature?: unknown }).feature).toBe("font:invalid");
  });

  test("a bad option type rejects instead of trapping", async () => {
    const bad = { images: { "a.png": "not bytes" } } as unknown as Parameters<typeof render>[1];
    await expect(render(doc("<p>x</p>"), bad)).rejects.toThrow(/must be a Uint8Array/);
  });

  test("warmup() resolves, is idempotent, and leaves later renders unchanged", async () => {
    const opts = { creationDate: [2024, 1, 1] as [number, number, number] };
    const before = await render(doc("<h1>Warm</h1><p>up</p>"), opts);
    await warmup();
    await Promise.all([warmup(), warmup()]);
    const after = await render(doc("<h1>Warm</h1><p>up</p>"), opts);
    expect(Buffer.compare(before, after)).toBe(0);
  });

  test("a Rust panic rejects with the napi wording and the next render still works", async () => {
    const before = await render(doc("<p>after panic</p>"), { creationDate: [2024, 1, 1] });
    for (let i = 0; i < 2; i++) {
      await expect(__forcePanicForTest()).rejects.toThrow("render panicked: forced panic for test");
      const after = await render(doc("<p>after panic</p>"), { creationDate: [2024, 1, 1] });
      expect(Buffer.compare(before, after)).toBe(0);
    }
  });

  test("deep input stays bounded: renders or rejects with max-nesting-depth", async () => {
    const depth = 200_000;
    const css = `${"@media all { ".repeat(depth)}p { margin: 0 }${"}".repeat(depth)}`;
    const media = encoder.encode(
      `<!DOCTYPE html><html><head><style>${css}</style></head><body><p>x</p></body></html>`,
    );
    expect(isPdf(await render(media))).toBe(true);
    const divs = encoder.encode(
      `<!DOCTYPE html><html><body>${"<div>".repeat(depth)}x</body></html>`,
    );
    const error = await render(divs).catch((e: unknown) => e);
    expect((error as { feature?: unknown }).feature).toBe("max-nesting-depth");
    // The deepest nesting the gate admits, through flex and inline-block layout.
    const deepest = (open: string) =>
      encoder.encode(`<!DOCTYPE html><html><body>${open.repeat(188)}x</body></html>`);
    expect(isPdf(await render(deepest("<div style='display:flex'>")))).toBe(true);
    expect(
      isPdf(await render(deepest("<div style='display:inline-block;border:1px solid'>"))),
    ).toBe(true);
  }, 120_000);
});

/** Every fixture with an `index.html`, templated with its `data.json`, plus its `assets/` images. */
function fixtures() {
  const dir = join(ROOT, "fixtures");
  return readdirSync(dir)
    .filter((name) => existsSync(join(dir, name, "index.html")))
    .map((name) => ({ name, dir: join(dir, name) }));
}

// The locally built addon (`npm run build`), for whatever platform this is.
const nativeBuilt = readdirSync(join(ROOT, "packages", "native")).some(
  (file) => file.startsWith("vellora.") && file.endsWith(".node"),
);

describe.skipIf(!built || !nativeBuilt)("WebAssembly ↔ native parity", () => {
  test("the warmup() document is inside the subset and renders byte-identical on both", async () => {
    const native = await import("@vellora/native");
    const html = encoder.encode(WARMUP_HTML);
    const opts = { images: { "warmup.png": WARMUP_PNG } };
    const viaNative = await native.render(html, opts);
    expect(isPdf(viaNative)).toBe(true);
    expect(Buffer.compare(await render(html, opts), viaNative)).toBe(0);
  });

  test.each(fixtures())(
    "$name renders byte-identical to the native addon",
    async ({ dir }) => {
      const [{ renderTemplate }, native] = await Promise.all([
        import("../../vellora/src/template/index"),
        import("@vellora/native"),
      ]);
      const dataPath = join(dir, "data.json");
      const data = existsSync(dataPath) ? JSON.parse(readFileSync(dataPath, "utf8")) : {};
      const html = encoder.encode(
        renderTemplate(readFileSync(join(dir, "index.html"), "utf8"), data),
      );
      const images: Record<string, Uint8Array> = {};
      const assets = join(dir, "assets");
      if (existsSync(assets)) {
        for (const file of readdirSync(assets)) {
          images[`assets/${file}`] = new Uint8Array(readFileSync(join(assets, file)));
        }
      }
      const opts = { creationDate: [2000, 1, 1] as [number, number, number], images };
      const outcome = async (fn: () => Promise<Uint8Array>) =>
        fn().then(
          (pdf) => ({ pdf: Buffer.from(pdf).toString("base64") }),
          (e: { feature?: string; line?: number; col?: number; message: string }) => ({
            error: { feature: e.feature, line: e.line, col: e.col, message: e.message },
          }),
        );
      const viaNative = await outcome(() => native.render(html, opts));
      const viaWasm = await outcome(() => render(html, opts));
      expect(viaWasm).toEqual(viaNative);
    },
    60_000,
  );
});
