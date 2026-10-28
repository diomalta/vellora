// Environment record attached to every result file: date (from `date -u`), OS/CPU, Node, rustc,
// Chrome, Docker, git state, and the versions of every external tool the oracles use.
import { existsSync, readFileSync } from "node:fs";
import { cpus, release, type } from "node:os";
import { join } from "node:path";
import { TOOLS_IMAGE, VERAPDF_IMAGE, inspectImage, toolsRecipeSha256 } from "./docker.mjs";
import { findExecutable, run, versionLine } from "./exec.mjs";
import { ORACLES_DIR, REPO_ROOT, pythonUnavailableReason, venvPython } from "./paths.mjs";
import { subjectRendererRecord, velloraVersion } from "./vellora.mjs";

async function gitState() {
  const git = "/usr/bin/git";
  try {
    const head = await run(git, ["rev-parse", "HEAD"], { cwd: REPO_ROOT });
    const branch = await run(git, ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: REPO_ROOT });
    const status = await run(git, ["status", "--porcelain"], { cwd: REPO_ROOT });
    return {
      commit: head.stdout.trim(),
      branch: branch.stdout.trim(),
      dirty: status.stdout.trim().length > 0,
    };
  } catch (error) {
    return { commit: "unknown", error: error.message };
  }
}

/** Version of an npm package installed under fidelity/oracles/node_modules, or null. */
export function installedPackageVersion(name, root = ORACLES_DIR) {
  const manifest = join(root, "node_modules", name, "package.json");
  return existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")).version : null;
}

async function pythonPackages() {
  const python = venvPython();
  if (!python) {
    return { python: null, reason: pythonUnavailableReason() };
  }
  const script =
    "import json,sys\nfrom importlib.metadata import version\n" +
    "names=['pdfminer.six','pymupdf','zxing-cpp','pillow']\n" +
    "print(json.dumps({'python': sys.version.split()[0], **{n: version(n) for n in names}}))";
  const result = await run(python, ["-I", "-c", script]).catch((error) => ({
    code: "spawn-error",
    stderr: error.message,
  }));
  return result.code === 0 ? JSON.parse(result.stdout) : { error: result.stderr.trim() };
}

export async function captureEnvironment({ chrome, chromeError } = {}) {
  const dateU = await run("/bin/date", ["-u"]);
  // -srvm, not -a: -a includes the host name, which must not land in a shared record.
  const uname = await run("/usr/bin/uname", ["-srvm"]);
  const cpuModel =
    process.platform === "darwin"
      ? (await run("/usr/sbin/sysctl", ["-n", "machdep.cpu.brand_string"])).stdout.trim()
      : (cpus()[0]?.model ?? "unknown");
  const pdftotext = await findExecutable("pdftotext", "PDFTOTEXT_BIN");
  const dockerBin = await findExecutable("docker", "DOCKER_BIN");
  const tools = await inspectImage(TOOLS_IMAGE);
  const vera = await inspectImage(VERAPDF_IMAGE);
  return {
    date: dateU.stdout.trim(),
    dateIso: new Date().toISOString(),
    os: { type: type(), release: release(), uname: uname.stdout.trim(), arch: process.arch },
    cpu: { model: cpuModel, cores: cpus().length },
    node: process.version,
    rustc:
      (await run("rustc", ["--version"], { cwd: REPO_ROOT }).catch(() => null))?.stdout.trim() ||
      "unavailable",
    vellora: { version: velloraVersion(), git: await gitState(), subject: subjectRendererRecord() },
    chrome: chrome
      ? { version: chrome.version, executablePath: chrome.executablePath, indicative: true }
      : { unavailable: chromeError ?? "not launched (no oracle needed it)" },
    puppeteerCore: installedPackageVersion("puppeteer-core") ?? "not installed",
    docker: dockerBin ? await versionLine(dockerBin) : "unavailable",
    poppler: pdftotext ? await versionLine(pdftotext, ["-v"]) : "unavailable",
    python: await pythonPackages(),
    images: {
      tools: { ref: TOOLS_IMAGE, recipeSha256: toolsRecipeSha256(), ...tools },
      verapdf: { ref: VERAPDF_IMAGE, ...vera },
    },
  };
}
