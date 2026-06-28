import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const LIFECYCLE_SCRIPTS = new Set([
  "preinstall",
  "install",
  "postinstall",
  "prepare",
  "prepublish",
  "prepublishOnly",
  "prepack",
  "postpack",
]);

const ALLOWED_DEPENDENCY_INSTALL_SCRIPTS = new Map([
  [
    "@biomejs/biome",
    "dev-only formatter/linter binary shim; platform binaries are optional dependencies",
  ],
  ["esbuild", "dev/build bundler binary verifier; platform binaries are optional dependencies"],
  ["fsevents", "optional macOS file watcher used by the dev-server toolchain"],
]);

function packageNameFromLockPath(path) {
  const marker = "node_modules/";
  const index = path.lastIndexOf(marker);

  if (index === -1) {
    return path;
  }

  return path.slice(index + marker.length);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function workspacePackageJsonPaths() {
  const packagePaths = ["package.json", "benchmarks/package.json"];

  for (const entry of await readdir("packages", { withFileTypes: true })) {
    if (entry.isDirectory()) {
      packagePaths.push(join("packages", entry.name, "package.json"));
    }
  }

  return packagePaths;
}

const lock = await readJson("package-lock.json");
const unexpectedInstallScripts = [];
const allowedInstallScripts = [];

for (const [path, packageInfo] of Object.entries(lock.packages ?? {})) {
  if (!packageInfo?.hasInstallScript) {
    continue;
  }

  const name = packageInfo.name ?? packageNameFromLockPath(path);
  const allowedReason = ALLOWED_DEPENDENCY_INSTALL_SCRIPTS.get(name);
  const row = {
    path,
    name,
    version: packageInfo.version,
    reason: allowedReason,
  };

  if (allowedReason) {
    allowedInstallScripts.push(row);
  } else {
    unexpectedInstallScripts.push(row);
  }
}

const workspaceLifecycleScripts = [];

for (const path of await workspacePackageJsonPaths()) {
  const packageJson = await readJson(path);
  const scripts = packageJson.scripts ?? {};

  for (const script of LIFECYCLE_SCRIPTS) {
    if (script in scripts) {
      workspaceLifecycleScripts.push({
        path,
        name: packageJson.name,
        script,
        command: scripts[script],
      });
    }
  }
}

if (unexpectedInstallScripts.length > 0 || workspaceLifecycleScripts.length > 0) {
  console.error("Unexpected install/lifecycle scripts detected.");

  if (unexpectedInstallScripts.length > 0) {
    console.error("\nDependency install scripts:");
    console.error(JSON.stringify(unexpectedInstallScripts, null, 2));
  }

  if (workspaceLifecycleScripts.length > 0) {
    console.error("\nWorkspace package lifecycle scripts:");
    console.error(JSON.stringify(workspaceLifecycleScripts, null, 2));
  }

  process.exit(1);
}

console.log(
  `Install script allowlist OK (${allowedInstallScripts.length} dependency entries, ${workspaceLifecycleScripts.length} workspace lifecycle scripts).`,
);

for (const entry of allowedInstallScripts) {
  console.log(`- ${entry.name}@${entry.version} (${entry.path}): ${entry.reason}`);
}
