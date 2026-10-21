// Environment record and preflight for run-all.mjs. Records what every number depends on (date from
// `date -u`, OS/CPU, node, rustc, Chrome, poppler, Python packages, Docker images, git state) and
// checks prerequisites so a missing one becomes "not-run: <reason>" instead of a silent gap.
// Host name and user name are never recorded; paths are made portable by `portable()`.
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { arch, cpus, homedir, platform, release } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Default local Chrome (macOS). INDICATIVE only; CI passes a pinned Chrome for Testing. */
export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const POPPLER_TOOLS = Object.freeze([
  "pdftoppm",
  "pdftotext",
  "pdftocairo",
  "pdfinfo",
  "pdffonts",
  "pdfimages",
]);

/** Run a command; trimmed stdout (or stderr when stdout is empty), or `unavailable (...)`. */
export async function probe(cmd, args, opts = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { timeout: 30_000, ...opts });
    return (stdout.trim() || stderr.trim()).split("\n")[0];
  } catch (e) {
    const text = String(e.stderr ?? "").trim();
    if (text && e.code === 0) return text.split("\n")[0];
    // poppler prints -v to stderr and exits 0 or 99 depending on the version.
    if (text && /version/i.test(text)) return text.split("\n")[0];
    return `unavailable (${e.code ?? e.message})`;
  }
}

/** Resolve a poppler tool: Homebrew path first (where this repo's harnesses look), else PATH. */
export function popplerTool(name) {
  const brew = `/opt/homebrew/bin/${name}`;
  return existsSync(brew) ? brew : name;
}

/** Parse `name==version` pins (comments, hashes and continuation lines ignored). */
export function parsePins(text) {
  const pins = {};
  for (const raw of text.split("\n")) {
    const line = raw.replace(/#.*/, "").replace(/\\$/, "").trim();
    const m = /^([A-Za-z0-9_.-]+)==([^\s;]+)/.exec(line);
    if (m) pins[m[1].toLowerCase().replace(/[_.]/g, "-")] = m[2];
  }
  return pins;
}

/** Union of several requirements files; a package pinned differently in two files is a conflict. */
export function mergePins(files) {
  const merged = {};
  const conflicts = [];
  for (const { file, pins } of files) {
    for (const [name, version] of Object.entries(pins)) {
      if (merged[name] && merged[name].version !== version) {
        conflicts.push(
          `${name}: ${merged[name].version} (${merged[name].file}) vs ${version} (${file})`,
        );
      } else if (!merged[name]) {
        merged[name] = { version, file };
      }
    }
  }
  return { merged, conflicts };
}

async function pythonPackages(python, names) {
  if (!existsSync(python)) return null;
  const script = `import importlib.metadata as m, json, sys
out = {}
for n in sys.argv[1:]:
    try:
        out[n] = m.version(n)
    except m.PackageNotFoundError:
        out[n] = None
print(json.dumps(out))`;
  try {
    const { stdout } = await execFileAsync(python, ["-I", "-c", script, ...names], {
      timeout: 30_000,
    });
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

async function dockerImage(image) {
  try {
    const { stdout } = await execFileAsync(
      "docker",
      ["image", "inspect", image, "--format", "{{.Id}} {{.Architecture}}"],
      { timeout: 30_000 },
    );
    const [id, architecture] = stdout.trim().split(" ");
    return { image, present: true, id, architecture };
  } catch (e) {
    return {
      image,
      present: false,
      reason: String(e.stderr ?? e.message)
        .trim()
        .split("\n")[0],
    };
  }
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function blitzFromCargoLock(repoRoot) {
  const lock = readFileSync(join(repoRoot, "Cargo.lock"), "utf8");
  const m = /name = "blitz-dom"\nversion = "([^"]+)"\nsource = "([^"]+)"/.exec(lock);
  return m ? { version: m[1], source: m[2] } : null;
}

/**
 * Environment of one run-all invocation. `chrome` is the resolved Chrome path (or null).
 */
export async function captureEnvironment({ repoRoot, chrome, toolsImage, verapdfImage, command }) {
  const python = join(repoRoot, "fidelity", ".venv", "bin", "python");
  const reqFiles = requirementFiles(repoRoot);
  const pinNames = Object.keys(mergePins(reqFiles).merged);
  const addonDir = join(repoRoot, "packages", "native");
  const addons = existsSync(addonDir)
    ? readdirSync(addonDir).filter((f) => f.endsWith(".node"))
    : [];
  const [
    date,
    dateIso,
    osVersion,
    cpuBrand,
    rustc,
    cargo,
    chromeVersion,
    gitHead,
    gitBranch,
    gitStatus,
    pyVersion,
    dockerServer,
  ] = await Promise.all([
    probe("date", ["-u"]),
    probe("date", ["-u", "+%Y-%m-%dT%H:%M:%SZ"]),
    platform() === "darwin" ? probe("sw_vers", ["-productVersion"]) : probe("uname", ["-sr"]),
    platform() === "darwin"
      ? probe("sysctl", ["-n", "machdep.cpu.brand_string"])
      : Promise.resolve(cpus()[0]?.model ?? "unknown"),
    probe("rustc", ["--version"]),
    probe("cargo", ["--version"]),
    chrome && existsSync(chrome) ? probe(chrome, ["--version"]) : Promise.resolve(null),
    probe("git", ["-C", repoRoot, "rev-parse", "HEAD"]),
    probe("git", ["-C", repoRoot, "rev-parse", "--abbrev-ref", "HEAD"]),
    execFileAsync("git", ["-C", repoRoot, "status", "--porcelain"]).then(
      (r) => r.stdout.split("\n").filter(Boolean).length,
      () => null,
    ),
    existsSync(python) ? probe(python, ["-I", "--version"]) : Promise.resolve(null),
    probe("docker", ["version", "--format", "{{.Server.Version}}"]),
  ]);
  const poppler = {};
  for (const t of POPPLER_TOOLS) {
    poppler[t] = await probe(popplerTool(t), ["-v"]);
  }
  const wptDir = join(repoRoot, "fidelity", ".cache", "wpt");
  return {
    date,
    dateIso,
    os: `${platform()} ${release()} ${arch()}${platform() === "darwin" ? ` (macOS ${osVersion})` : ` (${osVersion})`}`,
    cpu: cpuBrand,
    cpuCount: cpus().length,
    node: process.version,
    rustc,
    cargo,
    chrome: chrome
      ? { path: chrome, version: chromeVersion ?? "unavailable (not found)" }
      : { path: null, version: "not-run (no Chrome)" },
    poppler,
    python: {
      interpreter: pyVersion ?? "unavailable (fidelity/.venv missing)",
      packages: await pythonPackages(python, pinNames),
    },
    docker: {
      server: dockerServer,
      toolsImage: await dockerImage(toolsImage),
      verapdfImage: await dockerImage(verapdfImage),
    },
    git: { head: gitHead, branch: gitBranch, dirtyEntries: gitStatus },
    blitz: blitzFromCargoLock(repoRoot),
    addon: addons.map((f) => ({ file: f, sha256: sha256File(join(addonDir, f)) })),
    wpt: {
      pinned: readFileSync(join(repoRoot, "fidelity", "wpt", "WPT_COMMIT"), "utf8").trim(),
      cacheHead: existsSync(join(wptDir, ".git"))
        ? await probe("git", ["-C", wptDir, "rev-parse", "HEAD"])
        : "absent",
    },
    command,
    authority:
      platform() === "darwin"
        ? "INDICATIVE (local macOS run; the pinned Linux CI run with Chrome for Testing is authoritative and is a DESIGN TARGET, not wired)"
        : "Linux run: authoritative only when Chrome is a pinned Chrome for Testing build (recorded above)",
  };
}

export function requirementFiles(repoRoot) {
  return ["fidelity/oracles/requirements.txt", "fidelity/corpus/requirements.txt"].map((file) => ({
    file,
    pins: parsePins(readFileSync(join(repoRoot, file), "utf8")),
  }));
}

/**
 * Prerequisite checks. `hard` failures make the dependent step not-run; soft ones are recorded and
 * left to the tool, which reports its own not-run oracles (e.g. no Docker: qpdf/veraPDF not-run).
 */
export function preflight({ repoRoot, env, chrome }) {
  const checks = [];
  const add = (id, ok, detail, steps = []) =>
    checks.push({ id, ok, detail, blocks: ok ? [] : steps });
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  add("node-22", nodeMajor === 22, `node ${process.version} (.nvmrc pins 22)`);
  add(
    "native-addon",
    env.addon.length > 0 && existsSync(join(repoRoot, "packages", "vellora", "dist", "index.js")),
    env.addon.length
      ? `${env.addon.map((a) => a.file).join(", ")} + packages/vellora/dist`
      : "no packages/native/*.node: run `npm ci && npm run build`",
    ["wpt", "corpus", "oracles-fixtures", "oracles-corpus", "layout-diff"],
  );
  add(
    "chrome",
    Boolean(chrome && existsSync(chrome)),
    chrome ? `${chrome}: ${env.chrome.version}` : "no Chrome path",
    ["layout-diff"],
  );
  const missingPoppler = POPPLER_TOOLS.filter((t) =>
    String(env.poppler[t] ?? "unavailable").startsWith("unavailable"),
  );
  add(
    "poppler",
    missingPoppler.length === 0,
    missingPoppler.length ? `not found: ${missingPoppler.join(", ")}` : "all present",
  );
  const { merged, conflicts } = mergePins(requirementFiles(repoRoot));
  const pkgs = env.python.packages;
  const wrong = pkgs
    ? Object.entries(merged)
        .filter(([name, { version }]) => pkgs[name] !== version)
        .map(([name, { version }]) => `${name} ${pkgs[name] ?? "missing"} (pinned ${version})`)
    : ["fidelity/.venv missing"];
  add(
    "python-venv-pins",
    conflicts.length === 0 && wrong.length === 0,
    conflicts.length
      ? `requirements conflict: ${conflicts.join("; ")}`
      : wrong.length
        ? `fidelity/.venv differs from the pins: ${wrong.join("; ")}`
        : `fidelity/.venv matches ${Object.keys(merged).length} pins of oracles + corpus requirements`,
  );
  for (const [dir, steps] of [
    ["fidelity", ["layout-diff"]],
    ["fidelity/wpt", []],
    ["fidelity/oracles", ["oracles-fixtures", "oracles-corpus"]],
  ]) {
    const ok = existsSync(join(repoRoot, dir, "node_modules", "puppeteer-core", "package.json"));
    add(
      `npm:${dir}`,
      ok,
      ok ? "puppeteer-core installed" : `run PUPPETEER_SKIP_DOWNLOAD=1 npm --prefix ${dir} ci`,
      steps,
    );
  }
  add(
    "docker-tools-image",
    env.docker.toolsImage.present,
    env.docker.toolsImage.present
      ? `${env.docker.toolsImage.image} ${env.docker.toolsImage.id}`
      : `${env.docker.toolsImage.image}: ${env.docker.toolsImage.reason}`,
  );
  add(
    "docker-verapdf-image",
    env.docker.verapdfImage.present,
    env.docker.verapdfImage.present
      ? `${env.docker.verapdfImage.id} (${env.docker.verapdfImage.architecture})`
      : env.docker.verapdfImage.reason,
  );
  add(
    "wpt-cache-at-pin",
    env.wpt.cacheHead === env.wpt.pinned,
    env.wpt.cacheHead === env.wpt.pinned
      ? `fidelity/.cache/wpt at ${env.wpt.pinned}`
      : `fidelity/.cache/wpt HEAD ${env.wpt.cacheHead} != ${env.wpt.pinned}: run node fidelity/wpt/fetch-wpt.mjs`,
    ["wpt"],
  );
  return checks;
}

/** Rewrite absolute paths to <repo>/… and ~/… (no user or host names in committed records). */
export function portable(value, repoRoot) {
  const home = homedir();
  const walk = (v) => {
    if (typeof v === "string") {
      return v.split(repoRoot).join("<repo>").split(home).join("~");
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return walk(value);
}
