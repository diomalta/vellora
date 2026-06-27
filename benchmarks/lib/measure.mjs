/**
 * The five claim-backing axes (spec: "Measure the five claim-backing axes").
 *
 *   1. Docker image size  — N/A (with a reason) for in-process libraries.
 *   2. Cold start         — the FIRST render after a fresh process/browser.
 *   3. RSS under N         — resident memory while N renders run concurrently.
 *   4. PDF output size     — bytes of the equivalent render.
 *   5. Throughput          — documents/second over the warm run set.
 *
 * Each function returns either a measured value or an explicit
 * { value: null, na: true, reason } so a missing axis is recorded, never
 * zeroed or fabricated (spec: "A missing axis is recorded, not silently
 * omitted").
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { promisify } from "node:util";

const execFileP = promisify(execFile);
const MAX_BUFFER = 1024 * 1024 * 8;

/**
 * Package footprint for published/workspace packages that make up a tool.
 * Uses npm's pack dry-run output so the value tracks what would be published,
 * not the full source checkout.
 * @param {{ id: string, packages?: string[], installPackages?: string[], nativeAddon?: boolean }} tool
 * @param {string} repoRoot
 * @returns {Promise<{ tarballBytes: number|null, unpackedBytes: number|null, runtimeDependencyCount: number|null, packages?: object[], freshInstall?: object, nativeAddon?: object, na: boolean, reason?: string }>}
 */
export async function measurePackageFootprint(tool, repoRoot) {
  if (!tool.packages?.length) {
    return {
      tarballBytes: null,
      unpackedBytes: null,
      runtimeDependencyCount: null,
      na: true,
      reason: `${tool.id} is not a Vellora npm package tier; package footprint is not measured here`,
    };
  }

  try {
    const [packageMeasurements, freshInstall, nativeAddon] = await Promise.all([
      Promise.all(
        tool.packages.map((packageName) => measureWorkspacePackage(packageName, repoRoot)),
      ),
      measureFreshInstallFootprint(tool, repoRoot),
      measureNativeAddonFootprint(tool, repoRoot),
    ]);
    const runtimeDependencies = new Set();
    for (const measurement of packageMeasurements) {
      collectDependencyNames(measurement.runtimeTree, runtimeDependencies);
    }
    const packageRecords = packageMeasurements.map(({ name, tarballBytes, unpackedBytes }) => ({
      name,
      tarballBytes,
      unpackedBytes,
    }));

    return {
      tarballBytes: packageRecords.reduce((sum, record) => sum + (record.tarballBytes ?? 0), 0),
      unpackedBytes: packageRecords.reduce((sum, record) => sum + (record.unpackedBytes ?? 0), 0),
      runtimeDependencyCount: runtimeDependencies.size,
      packages: packageRecords,
      freshInstall,
      nativeAddon,
      na: false,
    };
  } catch (err) {
    return {
      tarballBytes: null,
      unpackedBytes: null,
      runtimeDependencyCount: null,
      na: true,
      reason: `package footprint not measured: ${err?.message ?? err}`,
    };
  }
}

async function measureWorkspacePackage(packageName, repoRoot) {
  const [{ stdout: packStdout }, { stdout: lsStdout }] = await Promise.all([
    execFileP("npm", ["pack", "--workspace", packageName, "--dry-run", "--json"], {
      cwd: repoRoot,
      maxBuffer: MAX_BUFFER,
    }),
    execFileP("npm", ["ls", "--workspace", packageName, "--omit=dev", "--json"], {
      cwd: repoRoot,
      maxBuffer: MAX_BUFFER,
    }),
  ]);
  const packInfo = JSON.parse(packStdout)[0];
  return {
    name: packageName,
    tarballBytes: packInfo.size,
    unpackedBytes: packInfo.unpackedSize,
    runtimeTree: JSON.parse(lsStdout),
  };
}

async function measureFreshInstallFootprint(tool, repoRoot) {
  if (!tool.installPackages?.length) {
    return {
      installedBytes: null,
      na: true,
      reason: `${tool.id} does not define a fresh-app install package set`,
    };
  }

  const appDir = await mkdtemp(join(tmpdir(), "vellora-bench-install-"));
  try {
    const tarballDir = join(appDir, "tarballs");
    await mkdir(tarballDir, { recursive: true });
    const packageTarballs = await Promise.all(
      tool.installPackages.map((packageName) =>
        packWorkspacePackage(packageName, repoRoot, tarballDir),
      ),
    );
    const nativePrebuild = tool.nativeAddon
      ? await packCurrentNativePrebuild(repoRoot, tarballDir)
      : null;
    const tarballs = [
      ...packageTarballs,
      ...(nativePrebuild?.tarballPath
        ? [{ name: nativePrebuild.packageName, tarballPath: nativePrebuild.tarballPath }]
        : []),
    ];

    await writeFile(
      join(appDir, "package.json"),
      `${JSON.stringify(
        {
          private: true,
          type: "module",
          dependencies: Object.fromEntries(
            tarballs.map(({ name, tarballPath }) => [
              name,
              `file:${relative(appDir, tarballPath)}`,
            ]),
          ),
        },
        null,
        2,
      )}\n`,
    );
    const installArgs = [
      "install",
      "--omit=dev",
      "--no-audit",
      "--no-fund",
      "--ignore-scripts",
      ...(!nativePrebuild?.tarballPath ? ["--omit=optional"] : []),
    ];
    await execFileP("npm", installArgs, { cwd: appDir, maxBuffer: MAX_BUFFER });
    return {
      installedBytes: await directorySize(join(appDir, "node_modules")),
      packageCount: tool.installPackages.length,
      includesCurrentNativePrebuild: Boolean(nativePrebuild?.tarballPath),
      method: nativePrebuild?.tarballPath
        ? "fresh npm install from local package tarballs plus current-platform prebuild tarball"
        : "fresh npm install from local package tarballs with optional prebuilds omitted",
      notes: nativePrebuild?.tarballPath
        ? []
        : [
            "Current-platform prebuild package was not materialized in packages/native/npm; see nativeAddon for the local .node size.",
          ],
      na: false,
    };
  } catch (err) {
    return {
      installedBytes: null,
      packageCount: tool.installPackages.length,
      na: true,
      reason: `fresh-app install footprint not measured: ${err?.message ?? err}`,
    };
  } finally {
    await rm(appDir, { recursive: true, force: true });
  }
}

async function packWorkspacePackage(packageName, repoRoot, tarballDir) {
  const { stdout } = await execFileP(
    "npm",
    ["pack", "--workspace", packageName, "--pack-destination", tarballDir, "--json"],
    { cwd: repoRoot, maxBuffer: MAX_BUFFER },
  );
  return { name: packageName, tarballPath: packOutputPath(stdout, tarballDir) };
}

async function packCurrentNativePrebuild(repoRoot, tarballDir) {
  const tag = platformTag();
  const packageDir = join(repoRoot, "packages", "native", "npm", tag);
  const nodePath = join(packageDir, `vellora.${tag}.node`);
  if (!existsSync(nodePath)) {
    return { tarballPath: null, tag, nodePath };
  }
  const { stdout } = await execFileP(
    "npm",
    ["pack", packageDir, "--pack-destination", tarballDir, "--json"],
    {
      cwd: repoRoot,
      maxBuffer: MAX_BUFFER,
    },
  );
  const packageJson = JSON.parse(await readFile(join(packageDir, "package.json"), "utf8"));
  return {
    tarballPath: packOutputPath(stdout, tarballDir),
    tag,
    nodePath,
    packageName: packageJson.name,
  };
}

function packOutputPath(stdout, tarballDir) {
  const [packInfo] = JSON.parse(stdout);
  return resolve(tarballDir, packInfo.filename);
}

async function measureNativeAddonFootprint(tool, repoRoot) {
  if (!tool.nativeAddon) {
    return {
      bytes: null,
      na: true,
      reason: `${tool.id} does not use the Vellora native addon package`,
    };
  }
  const tag = platformTag();
  const candidates = [
    { source: "local-build", path: join(repoRoot, "packages", "native", `vellora.${tag}.node`) },
    {
      source: "current-platform-prebuild-package",
      path: join(repoRoot, "packages", "native", "npm", tag, `vellora.${tag}.node`),
    },
  ];
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate.path);
      return {
        bytes: info.size,
        tag,
        path: candidate.path,
        source: candidate.source,
        na: false,
      };
    } catch {
      // Try the next candidate.
    }
  }
  return {
    bytes: null,
    tag,
    na: true,
    reason: `no current-platform native addon found; expected packages/native/vellora.${tag}.node or packages/native/npm/${tag}/vellora.${tag}.node`,
  };
}

async function directorySize(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const child = join(path, entry.name);
      if (entry.isDirectory()) {
        return directorySize(child);
      }
      if (entry.isFile() || entry.isSymbolicLink()) {
        return (await stat(child)).size;
      }
      return 0;
    }),
  );
  return sizes.reduce((sum, size) => sum + size, 0);
}

function platformTag(platform = process.platform, arch = process.arch) {
  if (platform === "linux") {
    return `linux-${arch}-${isMusl() ? "musl" : "gnu"}`;
  }
  return `${platform}-${arch}`;
}

function isMusl() {
  try {
    return !process.report?.getReport()?.header?.glibcVersionRuntime;
  } catch {
    return false;
  }
}

function collectDependencyNames(tree, names) {
  const dependencies = tree?.dependencies;
  if (!dependencies || typeof dependencies !== "object") {
    return;
  }
  for (const [name, child] of Object.entries(dependencies)) {
    names.add(name);
    collectDependencyNames(child, names);
  }
}

export async function measureExternalRuntime(handle, tool) {
  if (typeof handle.externalRuntimeInfo !== "function") {
    return {
      bytes: null,
      na: true,
      reason: `${tool.id} does not expose an external runtime binary`,
    };
  }
  try {
    return await handle.externalRuntimeInfo();
  } catch (err) {
    return {
      bytes: null,
      na: true,
      reason: `external runtime not measured: ${err?.message ?? err}`,
    };
  }
}

/**
 * Axis 1 — Docker image size.
 * For in-process libraries (vellora, WeasyPrint-in-worker) there is no image to
 * size, so we return N/A with the reason. For containerized tools we read the
 * pinned image's size via `docker image inspect` when Docker is available.
 * @param {{ kind: string, image?: string }} tool
 * @returns {Promise<{ bytes: number|null, na: boolean, reason?: string, image?: string }>}
 */
export async function measureImageSize(tool) {
  if (tool.kind !== "http-service" || !tool.image) {
    return {
      bytes: null,
      na: true,
      reason: `${tool.id} is not represented by a standalone service container image in this benchmark`,
    };
  }
  try {
    const { stdout } = await execFileP("docker", [
      "image",
      "inspect",
      tool.image,
      "--format",
      "{{.Size}}",
    ]);
    const bytes = Number(stdout.trim());
    if (!Number.isFinite(bytes)) throw new Error(`unexpected size output: ${stdout}`);
    return { bytes, na: false, image: tool.image };
  } catch (err) {
    return {
      bytes: null,
      na: true,
      reason:
        `image size not measured (docker unavailable or image not pulled): ${err?.message ?? err}. ` +
        `TODO(CI): pull ${tool.image} and re-measure on the pinned Linux runner.`,
      image: tool.image,
    };
  }
}

/**
 * Axis 2 — Cold start. Times the FIRST render after the handle was created
 * (process/browser freshly started). Reported separately from warm samples.
 * @param {{ render: (html: string, data: unknown) => Promise<Uint8Array> }} handle
 * @param {string} html @param {unknown} data
 * @returns {Promise<{ ms: number, pdf: Uint8Array }>}
 */
export async function measureColdStart(handle, html, data) {
  const t0 = performance.now();
  const pdf = await handle.render(html, data);
  const ms = performance.now() - t0;
  return { ms, pdf };
}

/**
 * Axis 3 — RSS under concurrency N. Fires N renders concurrently and samples
 * peak process RSS during the burst. For out-of-process tools (Gotenberg) the
 * memory lives in the service container, not this process — recorded as N/A
 * with a reason (the container's RSS is measured separately in CI).
 * @param {{ render: Function }} handle
 * @param {string} html @param {unknown} data
 * @param {number} concurrency
 * @param {{ kind: string, id: string }} tool
 * @returns {Promise<{ peakRssBytes: number|null, na: boolean, reason?: string, concurrency: number }>}
 */
export async function measureRssUnderLoad(handle, html, data, concurrency, tool) {
  if (tool.kind !== "in-process") {
    // Drive the load so the comparison is fair, but the RSS that matters lives
    // in the service/browser process, not this client process.
    await Promise.all(Array.from({ length: concurrency }, () => handle.render(html, data)));
    return {
      peakRssBytes: null,
      na: true,
      concurrency,
      reason: `${tool.id} memory lives outside this Node process. TODO(CI): sample browser/service/worker RSS during the concurrent burst.`,
    };
  }

  let peak = process.memoryUsage().rss;
  let sampling = true;
  const sampler = (async () => {
    while (sampling) {
      const rss = process.memoryUsage().rss;
      if (rss > peak) peak = rss;
      await new Promise((r) => setTimeout(r, 5));
    }
  })();

  await Promise.all(Array.from({ length: concurrency }, () => handle.render(html, data)));
  sampling = false;
  await sampler;

  return { peakRssBytes: peak, na: false, concurrency };
}

export async function measureExternalRssUnderLoad(handle, html, data, concurrency, tool) {
  if (typeof handle.measureExternalRssUnderLoad !== "function") {
    return {
      peakRssBytes: null,
      na: true,
      concurrency,
      reason: `${tool.id} does not expose an external RSS sampler`,
    };
  }
  try {
    return await handle.measureExternalRssUnderLoad({ html, data, concurrency });
  } catch (err) {
    return {
      peakRssBytes: null,
      na: true,
      concurrency,
      reason: `external RSS not measured: ${err?.message ?? err}`,
    };
  }
}

/**
 * Axis 4 — PDF output size of the equivalent render.
 * @param {Uint8Array} pdf @returns {{ bytes: number }}
 */
export function measureOutputSize(pdf) {
  return { bytes: pdf.length };
}

/**
 * Axis 5 — Throughput (documents/second) over the warm run set. Computed from
 * the warm sample durations: total docs / total wall time of the sampled set.
 * Returned alongside the raw per-render durations so stats.mjs can compute
 * median/p95 latency from the same samples.
 * @param {{ render: Function }} handle
 * @param {string} html @param {unknown} data
 * @param {number} warmRuns @param {number} warmupRuns
 * @returns {Promise<{ samplesMs: number[], throughputPerSec: number, totalMs: number }>}
 */
export async function measureWarm(handle, html, data, warmRuns, warmupRuns) {
  // Discard warm-up renders (JIT/cache settle) — not sampled.
  for (let i = 0; i < warmupRuns; i++) await handle.render(html, data);

  const samplesMs = [];
  const tStart = performance.now();
  for (let i = 0; i < warmRuns; i++) {
    const t0 = performance.now();
    await handle.render(html, data);
    samplesMs.push(performance.now() - t0);
  }
  const totalMs = performance.now() - tStart;
  const throughputPerSec = totalMs > 0 ? (warmRuns / totalMs) * 1000 : 0;
  return { samplesMs, throughputPerSec, totalMs };
}
