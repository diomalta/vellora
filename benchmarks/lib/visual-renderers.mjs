import { readFileSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_PACKAGE_JSON = new Map([
  ["vellora", "packages/vellora/package.json"],
  ["@vellora/engine-chromium", "packages/engine-chromium/package.json"],
]);

const CHROMIUM_ARGS = ["--no-sandbox", "--disable-dev-shm-usage"];

export const RENDERERS = Object.freeze({
  puppeteer: {
    id: "puppeteer",
    label: "Puppeteer",
    directory: "puppeteer",
    packageNames: ["puppeteer"],
    async render({ browser, browserHtml, renderWithPuppeteer }) {
      return renderWithPuppeteer(browser, browserHtml);
    },
  },
  vellora: {
    id: "vellora",
    label: "Vellora",
    directory: "vellora",
    packageNames: ["vellora"],
    async render({ nativeHtml, metadata, renderPdf }) {
      return renderPdf(nativeHtml, undefined, {
        strict: true,
        metadata,
      });
    },
  },
  chromium: {
    id: "chromium",
    label: "Vellora Chromium",
    directory: "chromium",
    packageNames: ["vellora", "@vellora/engine-chromium"],
    async render({ browserHtml, metadata, renderPdf }) {
      return renderPdf(browserHtml, undefined, {
        strict: true,
        metadata,
        engine: "chromium",
        chromium: {
          executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
          timeoutMs: Number(process.env.BENCH_CHROMIUM_TIMEOUT_MS ?? 30_000),
          args: CHROMIUM_ARGS,
        },
      });
    },
  },
});

export const RENDERER_IDS = Object.freeze(Object.keys(RENDERERS));

export function rendererFor(id) {
  const renderer = RENDERERS[id];
  if (!renderer) {
    throw new Error(`Unsupported renderer "${id}". Expected one of: ${RENDERER_IDS.join(", ")}`);
  }
  return renderer;
}

export async function rendererVersions(renderers, repoRoot) {
  const packageNames = new Set(renderers.flatMap((renderer) => renderer.packageNames));
  const entries = await Promise.all(
    [...packageNames].map(async (packageName) => [
      packageName,
      await packageVersion(packageName, repoRoot),
    ]),
  );
  return Object.fromEntries(entries);
}

async function packageVersion(packageName, repoRoot) {
  try {
    const mod = await import(`${packageName}/package.json`, { with: { type: "json" } });
    return mod.default.version;
  } catch {
    const workspacePath = WORKSPACE_PACKAGE_JSON.get(packageName);
    if (!workspacePath) {
      return "unavailable";
    }
    try {
      return JSON.parse(readFileSync(join(repoRoot, workspacePath), "utf8")).version;
    } catch {
      return "unavailable";
    }
  }
}
