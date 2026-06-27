import { spawn } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, normalize, sep } from "node:path";
import { pathToFileURL } from "node:url";
import type { BridgeRenderOptions, ChromiumEngineOptions, NativeBridge } from "vellora";

export type { BridgeRenderOptions, ChromiumEngineOptions, NativeBridge } from "vellora";

export interface ChromiumEngineConfig {
  executablePath?: string;
  args?: string[];
  tmpDir?: string;
  keepTempFiles?: boolean;
  runChromium?: ChromiumRunner;
}

export type ChromiumRunner = (
  executablePath: string,
  args: string[],
  options: { timeoutMs?: number },
) => Promise<void>;

export function chromiumEngine(config: ChromiumEngineConfig = {}): NativeBridge {
  return new ChromiumBridge(config);
}

export class ChromiumBridge implements NativeBridge {
  constructor(private readonly config: ChromiumEngineConfig = {}) {}

  async render(html: string, options: BridgeRenderOptions): Promise<Uint8Array> {
    const workDir = await mkdtemp(join(this.config.tmpDir ?? tmpdir(), "vellora-chromium-"));
    try {
      const prepared = await prepareInput(workDir, html, options.images);
      const pdfPath = join(workDir, "output.pdf");
      const executablePath = await resolveChromiumExecutable(options.chromium, this.config);
      const args = chromiumArgs(prepared.htmlPath, pdfPath, options.chromium, this.config);
      await (this.config.runChromium ?? runChromium)(executablePath, args, {
        timeoutMs: options.chromium?.timeoutMs,
      });
      return await readFile(pdfPath);
    } catch (cause) {
      throw chromiumUnavailable(cause);
    } finally {
      if (!this.config.keepTempFiles) {
        await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
      }
    }
  }
}

async function prepareInput(
  workDir: string,
  html: string,
  images: Record<string, Uint8Array> | undefined,
): Promise<{ htmlPath: string }> {
  await materializeImages(workDir, images);
  const htmlPath = join(workDir, "index.html");
  await writeFile(htmlPath, html);
  return { htmlPath };
}

async function materializeImages(
  workDir: string,
  images: Record<string, Uint8Array> | undefined,
): Promise<void> {
  if (!images) {
    return;
  }
  await Promise.all(
    Object.entries(images).map(async ([key, bytes]) => {
      const relative = safeRelativeAssetPath(key, bytes);
      const path = join(workDir, relative);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    }),
  );
}

function safeRelativeAssetPath(key: string, bytes: Uint8Array): string {
  const parsedPath = urlPathname(key) ?? key;
  const normalized = normalize(parsedPath).replace(/^([/\\])+/, "");
  const safe = normalized
    .split(sep)
    .filter((part) => part && part !== "." && part !== "..")
    .join(sep);
  if (safe) {
    return safe;
  }
  return `asset-${hashBytes(bytes)}${extensionFor(bytes)}`;
}

function urlPathname(key: string): string | undefined {
  try {
    return new URL(key).pathname;
  } catch {
    return undefined;
  }
}

function chromiumArgs(
  htmlPath: string,
  pdfPath: string,
  options: ChromiumEngineOptions | undefined,
  config: ChromiumEngineConfig,
): string[] {
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--host-resolver-rules=MAP * 0.0.0.0",
    "--allow-file-access-from-files",
    "--no-pdf-header-footer",
    `--print-to-pdf=${pdfPath}`,
  ];
  if (options?.pdf?.landscape) {
    args.push("--landscape");
  }
  return [...args, ...(config.args ?? []), ...(options?.args ?? []), pathToFileURL(htmlPath).href];
}

async function resolveChromiumExecutable(
  options: ChromiumEngineOptions | undefined,
  config: ChromiumEngineConfig,
): Promise<string> {
  const configured =
    options?.executablePath ?? config.executablePath ?? process.env.VELLORA_CHROMIUM_EXECUTABLE;
  if (configured) {
    return configured;
  }
  const absolute = await firstAccessible([
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ]);
  return absolute ?? "chromium";
}

async function firstAccessible(paths: string[]): Promise<string | undefined> {
  for (const path of paths) {
    if (await exists(path)) {
      return path;
    }
  }
  return undefined;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function runChromium(
  executablePath: string,
  args: string[],
  options: { timeoutMs?: number },
): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(executablePath, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    let settled = false;
    const timeout =
      options.timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            child.kill("SIGKILL");
            finish(new Error(`Chromium render timed out after ${options.timeoutMs}ms.`));
          }, options.timeoutMs);
    function finish(reason?: Error): void {
      if (settled) {
        return;
      }
      settled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
      if (reason) {
        reject(reason);
        return;
      }
      resolvePromise();
    }
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", finish);
    child.on("close", (code) => {
      if (code === 0) {
        finish();
        return;
      }
      finish(
        new Error(`Chromium exited with code ${code ?? "unknown"}${stderr ? `: ${stderr}` : ""}`),
      );
    });
  });
}

function chromiumUnavailable(cause: unknown): Error {
  const message = cause instanceof Error ? cause.message : String(cause);
  return Object.assign(
    new Error(
      `Chromium render failed. Set chromium.executablePath or VELLORA_CHROMIUM_EXECUTABLE to a Chromium/Chrome binary. Cause: ${message}`,
    ),
    { code: "VELLORA_CHROMIUM_UNAVAILABLE", cause },
  );
}

function hashBytes(bytes: Uint8Array): string {
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function extensionFor(bytes: Uint8Array): string {
  const contentType = sniffImageContentType(bytes);
  switch (contentType) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/gif":
      return ".gif";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

function sniffImageContentType(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return "application/octet-stream";
}

export const chromiumEngineInternals = {
  chromiumArgs,
  resolveChromiumExecutable,
  safeRelativeAssetPath,
};
