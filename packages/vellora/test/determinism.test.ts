/**
 * Quality + determinism gates.
 *
 * The determinism gate renders the invoice fixture under two different `TZ`/`LANG` environments — in real child
 * processes, since `TZ` is read at process start — and asserts byte-identical output, plus that an
 * omitted creation date injects the fixed default (never wall-clock). The source is bundled to a
 * temp ESM file with esbuild so the gate does not depend on a freshly-built `dist/`.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fixtureImages } from "@vellora/test-harness";
import { build } from "esbuild";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { DEFAULT_CREATION_DATE, MockNativeBridge, type RenderData, renderPdf } from "../src/index";

/** Serialize a fixture's images map to a base64 JSON the subprocess runner can rebuild. */
function serializeImages(id: string): string {
  const entries = Object.entries(fixtureImages(id)).map(([key, bytes]) => [
    key,
    Buffer.from(bytes).toString("base64"),
  ]);
  return JSON.stringify(Object.fromEntries(entries));
}

// Mock @vellora/lint so the dependency-hygiene gate observes invocations hermetically.
const fixMock = vi.fn((html: string) => ({ html, report: { findings: [] } }));
vi.mock("@vellora/lint", () => ({ fix: (html: string) => fixMock(html) }));

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "..", "..", "fixtures");
const ENTRY = join(HERE, "..", "src", "index.ts");

function fixture(id: string): { html: string; data: RenderData } {
  const html = readFileSync(join(FIXTURES, id, "index.html"), "utf8");
  const data = JSON.parse(readFileSync(join(FIXTURES, id, "data.json"), "utf8")) as RenderData;
  return { html, data };
}

describe("determinism gate: byte-identical across TZ/LANG", () => {
  let workdir: string;
  let bundlePath: string;
  let runnerPath: string;

  beforeAll(async () => {
    workdir = mkdtempSync(join(tmpdir(), "vellora-determinism-"));
    bundlePath = join(workdir, "vellora.mjs");
    runnerPath = join(workdir, "runner.mjs");
    await build({
      entryPoints: [ENTRY],
      outfile: bundlePath,
      bundle: true,
      format: "esm",
      platform: "node",
      // @vellora/lint (best-effort path) and @vellora/native (real addon) are unused here — the
      // runner injects the deterministic mock — so keep both external.
      external: ["@vellora/lint", "@vellora/native", "node:*"],
    });
    // The runner injects the deterministic mock bridge (this gate isolates TS-layer locale/timezone
    // determinism, not native rendering) and uses a fixed creationDate via opts.metadata.
    const runner = `
import { renderPdf, MockNativeBridge, setNativeBridge } from ${JSON.stringify(bundlePath)};
import { readFileSync } from "node:fs";
setNativeBridge(new MockNativeBridge());
const [htmlPath, dataPath] = process.argv.slice(2);
const html = readFileSync(htmlPath, "utf8");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const pdf = await renderPdf(html, data, { metadata: { creationDate: "2024-02-29T12:00:00.000Z" }, fonts: [new Uint8Array([0, 1, 0, 0])] });
process.stdout.write(Buffer.from(pdf).toString("base64"));
`;
    writeFileSync(runnerPath, runner);
  });

  afterAll(() => {
    rmSync(workdir, { recursive: true, force: true });
  });

  test("the invoice fixture renders identically under TZ=Asia/Tokyo,LANG=ja and TZ=America/Sao_Paulo,LANG=pt_BR", () => {
    const { html, data } = fixture("invoice");
    const htmlPath = join(workdir, "invoice.html");
    const dataPath = join(workdir, "invoice.json");
    writeFileSync(htmlPath, html);
    writeFileSync(dataPath, JSON.stringify(data));

    const run = (env: Record<string, string>): string =>
      execFileSync(process.execPath, [runnerPath, htmlPath, dataPath], {
        env: { ...process.env, ...env },
        maxBuffer: 16 * 1024 * 1024,
      }).toString();

    const tokyo = run({ TZ: "Asia/Tokyo", LANG: "ja_JP.UTF-8" });
    const saopaulo = run({ TZ: "America/Sao_Paulo", LANG: "pt_BR.UTF-8" });
    expect(tokyo).toBe(saopaulo);
    expect(tokyo.length).toBeGreaterThan(0);
  });
});

// Regression: the mock gate above only proves the TS layer ignores TZ/LANG. This gate
// runs renderPdf over the REAL @vellora/native bridge in two child processes under different TZ/LANG
// envs and asserts byte-identical PDFs — exercising the real ICU/Intl/krilla path the mock skips.
describe("determinism gate: byte-identical across TZ/LANG over the REAL native stack", () => {
  let workdir: string;
  let bundlePath: string;
  let runnerPath: string;

  beforeAll(async () => {
    // The bundle lives UNDER the package directory (not tmpdir) so the external bare specifier
    // `@vellora/native` resolves via the normal upward node_modules walk — the native loader must
    // not be bundled, since it locates its `.node` relative to its own on-disk location.
    workdir = mkdtempSync(join(HERE, "..", ".determinism-native-"));
    bundlePath = join(workdir, "vellora.mjs");
    runnerPath = join(workdir, "runner.mjs");
    await build({
      entryPoints: [ENTRY],
      outfile: bundlePath,
      bundle: true,
      format: "esm",
      platform: "node",
      // Keep the native addon external (a `.node` cannot be bundled and its loader resolves its
      // addon relative to its real path); the child resolves it from the repo node_modules.
      external: ["@vellora/lint", "@vellora/native", "node:*"],
    });
    // The runner injects the REAL NativeAddonBridge via `_bridge` and uses a fixed creationDate. It
    // rebuilds the `images` map (the invoice carries an <img>) from a base64 JSON sidecar.
    const runner = `
import { renderPdf, NativeAddonBridge } from ${JSON.stringify(bundlePath)};
import { readFileSync } from "node:fs";
const [htmlPath, dataPath, imagesPath] = process.argv.slice(2);
const html = readFileSync(htmlPath, "utf8");
const data = JSON.parse(readFileSync(dataPath, "utf8"));
const rawImages = JSON.parse(readFileSync(imagesPath, "utf8"));
const images = {};
for (const [key, b64] of Object.entries(rawImages)) images[key] = new Uint8Array(Buffer.from(b64, "base64"));
const pdf = await renderPdf(html, data, { _bridge: new NativeAddonBridge(), metadata: { creationDate: "2024-02-29T12:00:00.000Z" }, images });
process.stdout.write(Buffer.from(pdf).toString("base64"));
`;
    writeFileSync(runnerPath, runner);
  });

  afterAll(() => {
    rmSync(workdir, { recursive: true, force: true });
  });

  test("the invoice fixture renders byte-identically under TZ=Asia/Tokyo,LANG=ja and TZ=America/Sao_Paulo,LANG=pt_BR", () => {
    const { html, data } = fixture("invoice");
    const htmlPath = join(workdir, "invoice.html");
    const dataPath = join(workdir, "invoice.json");
    const imagesPath = join(workdir, "invoice-images.json");
    writeFileSync(htmlPath, html);
    writeFileSync(dataPath, JSON.stringify(data));
    writeFileSync(imagesPath, serializeImages("invoice"));

    const run = (env: Record<string, string>): string =>
      execFileSync(process.execPath, [runnerPath, htmlPath, dataPath, imagesPath], {
        env: { ...process.env, ...env },
        maxBuffer: 16 * 1024 * 1024,
      }).toString();

    const tokyo = run({ TZ: "Asia/Tokyo", LANG: "ja_JP.UTF-8" });
    const saopaulo = run({ TZ: "America/Sao_Paulo", LANG: "pt_BR.UTF-8" });
    expect(tokyo).toBe(saopaulo);
    // A real multi-page invoice render is far larger than the ~300-byte mock stub.
    expect(Buffer.from(tokyo, "base64").length).toBeGreaterThan(3000);
  });
});

describe("determinism gate: creation-date default", () => {
  test("omitting creationDate injects the fixed default, never wall-clock", async () => {
    const bridge = new MockNativeBridge();
    await renderPdf("<p>x</p>", undefined, { _bridge: bridge } as never);
    const recorded = bridge.calls[0]?.options.metadata.creationDate;
    expect(recorded).toBe(DEFAULT_CREATION_DATE);
    // It is a constant, not "now": rendering again much later yields the same default.
    const bridge2 = new MockNativeBridge();
    await renderPdf("<p>x</p>", undefined, { _bridge: bridge2 } as never);
    expect(bridge2.calls[0]?.options.metadata.creationDate).toBe(recorded);
  });
});

describe("strict-no-mutation gate", () => {
  test("across fixtures, the HTML reaching the bridge equals the templating output byte-for-byte", async () => {
    const { renderTemplate } = await import("../src/index");
    for (const id of ["invoice", "receipt", "boleto", "notification"]) {
      const { html, data } = fixture(id);
      const expected = renderTemplate(html, data);
      const bridge = new MockNativeBridge();
      try {
        await renderPdf(html, data, { strict: true, _bridge: bridge } as never);
      } catch {
        // Some fixtures may carry out-of-subset constructs; the bridge still records the HTML first.
      }
      expect(bridge.calls[0]?.html).toBe(expected);
    }
  });
});

describe("dependency-hygiene gate", () => {
  test("the strict hot path never imports/loads @vellora/lint", async () => {
    fixMock.mockClear();
    const bridge = new MockNativeBridge();
    await renderPdf("<p>{{ a }}</p>", { a: "1" }, { strict: true, _bridge: bridge } as never);
    await renderPdf("<p>{{ a }}</p>", { a: "1" }, { _bridge: bridge } as never); // omitted == strict
    expect(fixMock).not.toHaveBeenCalled();
  });
});

describe("public API surface gate", () => {
  test("exports the documented surface with strict defaulting to true", async () => {
    const api = await import("../src/index");
    expect(typeof api.renderPdf).toBe("function");
    expect(typeof api.renderPdfToStream).toBe("function");
    expect(typeof api.renderTemplate).toBe("function");
    expect(typeof api.VelloraError).toBe("function");
    expect(typeof api.VelloraTemplateError).toBe("function");
    expect(typeof api.VelloraInputError).toBe("function");
    expect(typeof api.VelloraUnsupportedError).toBe("function");
    expect(typeof api.MockNativeBridge).toBe("function");

    // strict defaults to true: a render with no opts must not run fixers.
    fixMock.mockClear();
    await api.renderPdf("<p>x</p>");
    expect(fixMock).not.toHaveBeenCalled();
  });
});
