// Environment record attached to every result file: date (from `date -u`), OS/CPU, Node, rustc,
// Chrome, Docker, git state, and the versions of every external tool the oracles use.
import { cpus, release, type } from "node:os";
import { TOOLS_IMAGE, VERAPDF_IMAGE, inspectImage, toolsRecipeSha256 } from "./docker.mjs";
import { findExecutable, run, versionLine } from "./exec.mjs";
import { REPO_ROOT, venvPython } from "./paths.mjs";
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

async function pythonPackages() {
  const python = venvPython();
  if (!python) {
    return { python: null, reason: "fidelity/.venv missing" };
  }
  const script =
    "import json,sys\nfrom importlib.metadata import version\n" +
    "names=['pdfminer.six','pymupdf','zxing-cpp','pillow']\n" +
    "print(json.dumps({'python': sys.version.split()[0], **{n: version(n) for n in names}}))";
  const result = await run(python, ["-I", "-c", script]);
  return result.code === 0 ? JSON.parse(result.stdout) : { error: result.stderr.trim() };
}

export async function captureEnvironment({ chrome } = {}) {
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
      : null,
    docker: dockerBin ? await versionLine(dockerBin) : "unavailable",
    poppler: pdftotext ? await versionLine(pdftotext, ["-v"]) : "unavailable",
    python: await pythonPackages(),
    images: {
      tools: { ref: TOOLS_IMAGE, recipeSha256: toolsRecipeSha256(), ...tools },
      verapdf: { ref: VERAPDF_IMAGE, ...vera },
    },
  };
}
