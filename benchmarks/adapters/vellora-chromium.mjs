import { execFile, spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const CHROMIUM_ARGS = ["--no-sandbox", "--disable-dev-shm-usage"];

/**
 * Vellora environment-Chromium adapter.
 *
 * Calls the public `vellora` API with `engine: "chromium"`. The optional
 * `@vellora/engine-chromium` package does not bundle a browser; it launches the
 * Chrome/Chromium executable supplied by the environment.
 */
export const meta = {
  id: "vellora-chromium",
  kind: "browser-subprocess",
  longLivedMode:
    "Vellora optional environment-Chromium engine (direct Chrome/Chromium executable per render)",
};

export async function create() {
  const activePids = new Set();
  let renderPdf;
  let fixtureImages;
  let chromiumEngine;
  let chromiumEngineInternals;
  let version = "unknown";
  try {
    ({ renderPdf } = await import("vellora"));
    ({ fixtureImages } = await import("@vellora/test-harness"));
    ({ chromiumEngine, chromiumEngineInternals } = await import("@vellora/engine-chromium"));
    const velloraPkg = await import("vellora/package.json", { with: { type: "json" } }).catch(
      () => null,
    );
    const enginePkg = await import("@vellora/engine-chromium/package.json", {
      with: { type: "json" },
    }).catch(() => null);
    version = `${velloraPkg?.default?.version ?? "0.1.0-alpha.0"} + ${
      enginePkg?.default?.version ?? "0.1.0-alpha.0"
    }`;
  } catch (err) {
    const e = new Error(
      `Vellora environment-Chromium adapter unavailable. Install/build vellora and @vellora/engine-chromium. Underlying: ${err?.message ?? err}`,
    );
    e.code = "ADAPTER_PENDING";
    throw e;
  }

  const chromiumBridge = chromiumEngine({ runChromium: monitoredRunChromium(activePids) });

  return {
    mode: meta.longLivedMode,
    version,
    async externalRuntimeInfo() {
      return chromiumExecutableInfo(chromiumEngineInternals);
    },
    async measureExternalRssUnderLoad({ html, data, concurrency }) {
      let peak = 0;
      let sampling = true;
      const sampler = (async () => {
        while (sampling) {
          peak = Math.max(peak, await sampleRss(activePids));
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      })();
      try {
        await Promise.all(Array.from({ length: concurrency }, () => this.render(html, data)));
      } finally {
        sampling = false;
        await sampler;
      }
      return peak > 0
        ? {
            peakRssBytes: peak,
            na: false,
            concurrency,
            processKind: "chromium-subprocess",
          }
        : {
            peakRssBytes: null,
            na: true,
            concurrency,
            reason: "no active Chromium subprocess RSS sample was captured during the burst",
          };
    },
    /** @param {string} html @param {unknown} data @returns {Promise<Uint8Array>} */
    async render(html, data) {
      return renderPdf(html, data, {
        engine: "chromium",
        _chromiumBridge: chromiumBridge,
        strict: true,
        images: fixtureImages("invoice"),
        metadata: { title: "benchmark-invoice", creationDate: "2026-01-01T00:00:00.000Z" },
        chromium: {
          executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE,
          timeoutMs: Number(process.env.BENCH_CHROMIUM_TIMEOUT_MS ?? 30_000),
          args: CHROMIUM_ARGS,
        },
      });
    },
    async close() {
      /* direct binary adapter has no long-lived browser to close */
    },
  };
}

function monitoredRunChromium(activePids) {
  return (executablePath, args, options) =>
    new Promise((resolvePromise, reject) => {
      const child = spawn(executablePath, args, {
        stdio: ["ignore", "ignore", "pipe"],
      });
      if (child.pid) {
        activePids.add(child.pid);
      }
      let stderr = "";
      let settled = false;
      const timeout =
        options.timeoutMs === undefined
          ? undefined
          : setTimeout(() => {
              child.kill("SIGKILL");
              finish(new Error(`Chromium render timed out after ${options.timeoutMs}ms.`));
            }, options.timeoutMs);
      function finish(reason) {
        if (settled) {
          return;
        }
        settled = true;
        if (child.pid) {
          activePids.delete(child.pid);
        }
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

async function chromiumExecutableInfo(chromiumEngineInternals) {
  const executablePath = await resolveExecutablePath(chromiumEngineInternals);
  const [version, bytes] = await Promise.all([
    executableVersion(executablePath),
    executableSize(executablePath),
  ]);
  return {
    kind: "chromium-executable",
    executablePath,
    version: version.value,
    bytes: bytes.value,
    versionNa: version.na,
    sizeNa: bytes.na,
    na: bytes.na,
    reason: bytes.na ? bytes.reason : undefined,
    versionReason: version.na ? version.reason : undefined,
  };
}

async function resolveExecutablePath(chromiumEngineInternals) {
  const resolved = await chromiumEngineInternals.resolveChromiumExecutable(
    { executablePath: process.env.VELLORA_CHROMIUM_EXECUTABLE },
    {},
  );
  if (resolved.includes("/")) {
    return resolved;
  }
  const { stdout } = await execFileP("which", [resolved]);
  return stdout.trim() || resolved;
}

async function executableVersion(executablePath) {
  try {
    const { stdout } = await execFileP(executablePath, ["--version"]);
    return { value: stdout.trim(), na: false };
  } catch (err) {
    return { value: null, na: true, reason: `version not measured: ${err?.message ?? err}` };
  }
}

async function executableSize(executablePath) {
  try {
    const info = await stat(executablePath);
    return { value: info.size, na: false };
  } catch (err) {
    return {
      value: null,
      na: true,
      reason: `executable size not measured: ${err?.message ?? err}`,
    };
  }
}

async function sampleRss(activePids) {
  const pids = await processTreePids([...activePids]);
  if (pids.length === 0) {
    return 0;
  }
  try {
    const { stdout } = await execFileP("ps", ["-o", "rss=", "-p", pids.join(",")]);
    return stdout
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .reduce((sum, kb) => sum + Number(kb) * 1024, 0);
  } catch {
    return 0;
  }
}

async function processTreePids(rootPids) {
  const seen = new Set(rootPids);
  let frontier = rootPids;
  while (frontier.length > 0) {
    try {
      const { stdout } = await execFileP("pgrep", ["-P", frontier.join(",")]);
      frontier = stdout
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(Number)
        .filter((pid) => Number.isInteger(pid) && !seen.has(pid));
      for (const pid of frontier) {
        seen.add(pid);
      }
    } catch {
      frontier = [];
    }
  }
  return [...seen];
}
