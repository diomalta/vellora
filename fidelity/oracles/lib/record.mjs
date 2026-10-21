import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { REPO_ROOT } from "./paths.mjs";

export const SCHEMA_VERSION = 1;

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Result files are meant to be shared: paths are rewritten to `<repo>/...` and `~/...` so no
 * local user name ends up in a committed or published record.
 */
export function portablePath(path) {
  if (typeof path !== "string") {
    return path;
  }
  const home = homedir();
  let out = path.split(REPO_ROOT).join("<repo>");
  if (home && home !== "/") {
    out = out.split(home).join("~");
  }
  return out;
}

/** Deep-copy a JSON-able value with every string passed through portablePath. */
export function portable(value) {
  return JSON.parse(JSON.stringify(value), (_key, v) =>
    typeof v === "string" ? portablePath(v) : v,
  );
}

export function fileFacts(path) {
  if (!path) {
    return null;
  }
  const bytes = readFileSync(path);
  return { path, bytes: bytes.length, sha256: sha256(bytes) };
}

/** Exact command line that produced a result (node binary + script + args). */
export function commandLine() {
  return [process.execPath, ...process.argv.slice(1)]
    .map((part) => (/[\s"']/.test(part) ? JSON.stringify(part) : part))
    .join(" ");
}

export function argValue(argv, name, fallback) {
  const index = argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

export function hasFlag(argv, name) {
  return argv.includes(name);
}

export function listArg(argv, name, fallback) {
  const raw = argValue(argv, name, null);
  if (raw === null) {
    return fallback;
  }
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Compact run id: UTC timestamp, filesystem-safe. */
export function runId(date = new Date()) {
  return date
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace(/-\d{3}Z$/, "Z");
}
