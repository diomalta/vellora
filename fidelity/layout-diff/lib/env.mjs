// Environment block recorded in every result file (fidelity/README.md "Rules").
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { arch, cpus, platform, release } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function run(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts })
      .toString()
      .trim();
  } catch (err) {
    return `unavailable (${(err?.message ?? String(err)).split("\n")[0]})`;
  }
}

/** Blitz / parley / taffy / stylo versions actually resolved by a checkout's Cargo.lock. */
export function lockedCrates(repo) {
  const lockPath = join(repo, "Cargo.lock");
  if (!existsSync(lockPath)) return {};
  const lock = readFileSync(lockPath, "utf8");
  const wanted = ["blitz-dom", "blitz-html", "blitz-traits", "parley", "taffy", "stylo", "krilla"];
  const out = {};
  for (const block of lock.split("[[package]]")) {
    const name = /name = "([^"]+)"/.exec(block)?.[1];
    if (!name || !wanted.includes(name)) continue;
    const version = /version = "([^"]+)"/.exec(block)?.[1];
    const source = /source = "([^"]+)"/.exec(block)?.[1] ?? "path";
    out[name] = [...(out[name] ?? []), { version, source }];
  }
  return out;
}

/** Short label for a checkout's Blitz resolution, e.g. "blitz-0.3.0-alpha.5+2003ba5". */
export function blitzLabel(repo) {
  const dom = lockedCrates(repo)["blitz-dom"]?.[0];
  if (!dom) return "blitz-unknown";
  const rev = /#([0-9a-f]{7})/.exec(dom.source)?.[1];
  return rev ? `blitz-${dom.version}+${rev}` : `blitz-${dom.version}`;
}

function packageVersion(name) {
  const p = join(here, "..", "..", "node_modules", name, "package.json");
  if (!existsSync(p)) return "not installed";
  return JSON.parse(readFileSync(p, "utf8")).version;
}

export async function captureEnv({ repo, command, chromePath } = {}) {
  const env = {
    date_utc: run("date", ["-u", "+%Y-%m-%dT%H:%M:%SZ"]),
    os: `${platform()} ${release()} ${arch()}`,
    cpu: cpus()[0]?.model ?? "unknown",
    node: process.version,
    command,
    repo,
  };
  if (repo) {
    env.rustc = run("rustc", ["--version"], { cwd: repo });
    env.git_commit = run("git", ["rev-parse", "HEAD"], { cwd: repo });
    env.git_dirty = run("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: repo })
      ? "dirty"
      : "clean";
    env.crates = lockedCrates(repo);
    env.blitz = blitzLabel(repo);
  }
  if (chromePath) {
    env.chrome_path = chromePath;
    env.chrome_version = run(chromePath, ["--version"]);
  }
  env.tools = { "puppeteer-core": packageVersion("puppeteer-core") };
  return env;
}
