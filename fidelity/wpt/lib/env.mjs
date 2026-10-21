// Environment capture for every result file: date (`date -u`), OS/CPU, node, rustc, poppler,
// Chrome, WPT commit, vellora commit, Blitz/krilla revisions (Cargo.lock), addon hash. Commands run
// via execFile (no shell); a tool that cannot be queried is recorded as such, never omitted.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import { dirname, join, resolve } from "node:path";

function run(cmd, args, opts = {}) {
  // spawnSync (no shell) so tools that print their version on stderr (pdftoppm -v) are captured.
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 15000, ...opts });
  if (r.error) return { error: String(r.error.message ?? r.error) };
  const out = (r.stdout || r.stderr || "").trim();
  if (r.status !== 0 && !out) return { error: `${cmd} exited ${r.status}` };
  return out;
}

function firstLine(v) {
  return typeof v === "string" ? v.split("\n")[0] : v;
}

/** Walk up from `start` to the directory containing Cargo.lock (the vellora repo root). */
export function findRepoRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, "Cargo.lock")) && existsSync(join(dir, "crates"))) return dir;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

/** Locked revisions of the engine crates from Cargo.lock. */
export function engineRevisions(repoRoot) {
  const lock = readFileSync(join(repoRoot, "Cargo.lock"), "utf8");
  const pkg = (name) => {
    const re = new RegExp(
      `\\[\\[package\\]\\]\\nname = "${name}"\\nversion = "([^"]+)"(?:\\nsource = "([^"]+)")?`,
    );
    const m = re.exec(lock);
    if (!m) return null;
    const rev = m[2] && /#([0-9a-f]{40})$/.exec(m[2]);
    return { version: m[1], source: m[2] ?? null, rev: rev ? rev[1] : null };
  };
  return {
    blitzDom: pkg("blitz-dom"),
    blitzHtml: pkg("blitz-html"),
    stylo: pkg("stylo"),
    taffy: pkg("taffy"),
    parley: pkg("parley"),
    krilla: pkg("krilla"),
  };
}

/** Stable engine-revision id used to name expectation files, e.g. "blitz-2003ba5fc2d8". */
export function engineRevId(revisions) {
  const rev = revisions.blitzDom?.rev;
  return rev ? `blitz-${rev.slice(0, 12)}` : `blitz-${revisions.blitzDom?.version ?? "unknown"}`;
}

function gitInfo(dir) {
  const sha = run("git", ["-C", dir, "rev-parse", "HEAD"]);
  const branch = run("git", ["-C", dir, "rev-parse", "--abbrev-ref", "HEAD"]);
  const status = run("git", ["-C", dir, "status", "--porcelain", "--untracked-files=no"]);
  return {
    commit: typeof sha === "string" ? sha : null,
    branch: typeof branch === "string" ? branch : null,
    dirtyTrackedFiles:
      typeof status === "string" ? status.split("\n").filter(Boolean).length : null,
  };
}

function addonInfo(repoRoot) {
  const dir = join(repoRoot, "packages", "native");
  let files = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".node"));
  } catch {
    files = [];
  }
  return files.map((f) => {
    const p = join(dir, f);
    const bytes = readFileSync(p);
    return {
      file: `packages/native/${f}`,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.length,
      mtime: statSync(p).mtime.toISOString(),
    };
  });
}

/** Full environment record. `chromeVersion` is filled by the Chrome oracle when it runs. */
export function captureEnv({ repoRoot, wptRoot, chromePath }) {
  const revisions = engineRevisions(repoRoot);
  const osInfo =
    process.platform === "darwin"
      ? {
          productVersion: run("sw_vers", ["-productVersion"]),
          buildVersion: run("sw_vers", ["-buildVersion"]),
          cpu: run("sysctl", ["-n", "machdep.cpu.brand_string"]),
        }
      : { osRelease: run("uname", ["-a"]), cpu: os.cpus()[0]?.model ?? null };
  return {
    date: run("date", ["-u"]),
    dateIso: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    os: osInfo,
    cpus: os.cpus().length,
    totalMemGiB: Math.round((os.totalmem() / 2 ** 30) * 10) / 10,
    node: process.version,
    rustc: firstLine(run("rustc", ["--version"], { cwd: repoRoot })),
    cargo: firstLine(run("cargo", ["--version"], { cwd: repoRoot })),
    pdftoppm: firstLine(run(process.env.PDFTOPPM ?? "pdftoppm", ["-v"])),
    pdftocairo: firstLine(run(process.env.PDFTOCAIRO ?? "pdftocairo", ["-v"])),
    pdfinfo: firstLine(run(process.env.PDFINFO ?? "pdfinfo", ["-v"])),
    chrome: chromePath
      ? { path: chromePath, version: firstLine(run(chromePath, ["--version"])) }
      : null,
    wpt: { root: wptRoot, ...gitInfo(wptRoot) },
    vellora: { root: repoRoot, ...gitInfo(repoRoot), addon: addonInfo(repoRoot) },
    engine: { id: engineRevId(revisions), ...revisions },
    argv: process.argv,
    cwd: process.cwd(),
  };
}
