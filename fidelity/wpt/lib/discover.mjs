// Test discovery and classification, mirroring the WPT manifest's
// `SourceFile.manifest_items` ordering (tools/manifest/sourcefile.py at the pinned commit) for the
// item types that occur under css/: support, manual, visual, crashtest, print-reftest, css-manual,
// testharness, reftest. Classification is by file name + content only (no manifest build needed).
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  isTestharness,
  parseFlags,
  parseReferences,
  parseTimeout,
  stripComments,
} from "./html-meta.mjs";

export const WPT_ORIGIN = "http://web-platform.test:8000";

const MARKUP_EXT = new Set([".html", ".htm", ".xht", ".xhtml", ".xml", ".svg"]);
const DIR_NON_TEST = new Set(["resources", "support", "tools"]);
const ROOT_DIR_NON_TEST = new Set(["common"]);
const DIR_PATH_NON_TEST = [
  ["css21", "archive"],
  ["css", "CSS2", "archive"],
  ["css", "common"],
];
const CSS_MANUAL_FLAGS = new Set([
  "animated",
  "font",
  "history",
  "interact",
  "paged",
  "speech",
  "userstyle",
]);
const REFERENCE_FILE_RE = /(^|[-_])(not)?ref[0-9]*([-_]|$)/;

/** Split a file name the way SourceFile.__init__ does: name, ext, type_flag, meta_flags. */
export function splitName(filename) {
  const dot = filename.lastIndexOf(".");
  const name = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot) : "";
  let typeFlag = null;
  let metaFlags;
  if (name.includes("-")) {
    const typeMeta = name.slice(name.lastIndexOf("-") + 1).split(".");
    typeFlag = typeMeta[0];
    metaFlags = typeMeta.slice(1);
  } else {
    metaFlags = name.split(".").slice(1);
  }
  return { name, ext, typeFlag, metaFlags };
}

export function relToUrl(rel) {
  return `${WPT_ORIGIN}/${rel.split(sep).join("/")}`;
}

export function urlToRel(url) {
  const u = new URL(url);
  if (u.origin !== WPT_ORIGIN) return null;
  return decodeURIComponent(u.pathname.replace(/^\//, ""));
}

function inNonTestDir(parts) {
  if (parts.length <= 1) return true;
  const dirs = parts.slice(0, -1);
  if (ROOT_DIR_NON_TEST.has(dirs[0])) return true;
  if (dirs.some((d) => DIR_NON_TEST.has(d))) return true;
  return DIR_PATH_NON_TEST.some((p) => p.every((seg, i) => dirs[i] === seg));
}

/**
 * Classify one file. Returns { kind, ... } where kind is one of:
 *   "non-test" (support / non-markup), "manual", "visual", "crashtest", "css-manual",
 *   "testharness", "reftest". Reftests carry { print, references, metaFlags, cssFlags }.
 */
export function classify(rel, content) {
  const parts = rel.split(sep);
  const filename = parts[parts.length - 1];
  const { name, ext, typeFlag, metaFlags } = splitName(filename);
  const base = { rel, url: relToUrl(rel), metaFlags };
  if (!MARKUP_EXT.has(ext) || filename.startsWith(".") || inNonTestDir(parts)) {
    return { ...base, kind: "non-test" };
  }
  if (typeFlag === "manual") return { ...base, kind: "manual" };
  if (typeFlag === "visual") return { ...base, kind: "visual" };
  const dirs = parts.slice(0, -1);
  if (typeFlag === "crash" || dirs.includes("crashtests")) return { ...base, kind: "crashtest" };
  const isReferenceName =
    `/${parts.join("/")}`.includes("/reference/") || REFERENCE_FILE_RE.test(name);
  const references = parseReferences(content, base.url);
  const cssFlags = parseFlags(content);
  if (typeFlag === "print" || dirs.includes("print")) {
    if (references.length === 0) return { ...base, kind: "non-test", note: "print-without-refs" };
    return {
      ...base,
      kind: "reftest",
      print: true,
      references,
      cssFlags,
      timeout: parseTimeout(content),
    };
  }
  if (!isReferenceName && cssFlags.some((f) => CSS_MANUAL_FLAGS.has(f))) {
    return { ...base, kind: "css-manual", cssFlags };
  }
  if (isTestharness(content)) return { ...base, kind: "testharness" };
  if (references.length > 0) {
    return {
      ...base,
      kind: "reftest",
      print: false,
      references,
      cssFlags,
      timeout: parseTimeout(content),
    };
  }
  const hasHelp = /<link\b[^>]*\brel\s*=\s*["']?help\b/i.test(stripComments(content));
  if (hasHelp && !isReferenceName) return { ...base, kind: "visual" };
  return { ...base, kind: "non-test" };
}

function walk(dir, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile()) out.push(p);
  }
  return out;
}

const UTF8 = new TextDecoder("utf-8", { fatal: true });

/** Decode bytes as strict UTF-8 (BOM stripped). Returns null when the bytes are not UTF-8. */
export function decodeUtf8(buf) {
  try {
    return UTF8.decode(buf);
  } catch {
    return null;
  }
}

/**
 * Discover and classify every file under each suite path (relative to the WPT root). Returns
 * { files: [...classified], bySuite: { suite: [...] } }; a file is attributed to the first suite
 * (in the given order) that contains it.
 */
export function discover(wptRoot, suites) {
  const seen = new Set();
  const files = [];
  for (const suite of suites) {
    for (const abs of walk(join(wptRoot, suite), [])) {
      const rel = relative(wptRoot, abs);
      if (seen.has(rel)) continue;
      seen.add(rel);
      const { ext } = splitName(rel.split(sep).pop());
      if (!MARKUP_EXT.has(ext)) continue;
      const buf = readFileSync(abs);
      const text = decodeUtf8(buf);
      // Non-UTF-8 files are classified on a lossy decode so they are still counted correctly,
      // then flagged; the runner skips them (vellora's input contract is UTF-8).
      const content = text ?? buf.toString("latin1");
      const item = classify(rel, content);
      item.suite = suite;
      if (text === null) item.nonUtf8 = true;
      files.push(item);
    }
  }
  return files;
}
