// Set every published package to one version, from a release tag.
//
// Tag-driven release: the GitHub Release tag is the single source of truth for the version
// (replacing `changeset version`). This rewrites, in lockstep, the four fixed-group packages,
// their exact internal cross-package pins, and the four per-platform addon packages + the
// optionalDependency pins on `@vellora/native`. `napi pre-publish` and `changeset publish` then
// publish the files as-is.
//
// It edits raw text (replacing only the package's own current version string) rather than
// re-serializing JSON, so the compact array formatting (biome) is preserved byte-for-byte.
//
// Usage: node scripts/set-release-version.mjs <version> [--dry]
//   <version>  e.g. 0.1.0-alpha.1 (a leading "v" is stripped)

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const raw = process.argv[2];
if (!raw) {
  console.error("error: version argument required (e.g. 0.1.0-alpha.1)");
  process.exit(1);
}
const version = raw.replace(/^v/, "");
// Loose semver guard — accepts prerelease tags like 0.1.0-alpha.1; rejects obvious garbage.
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`error: "${raw}" is not a valid semver version`);
  process.exit(1);
}

// The four fixed-group packages always share one version; the per-platform prebuilt addon
// packages (not workspaces; published by napi) track it too.
const FILES = [
  ...["vellora", "native", "cli", "lint"].map((p) => `packages/${p}/package.json`),
  ...readdirSync(join(ROOT, "packages/native/npm")).map(
    (d) => `packages/native/npm/${d}/package.json`,
  ),
];

for (const rel of FILES) {
  const path = join(ROOT, rel);
  const text = readFileSync(path, "utf8");
  const current = JSON.parse(text).version;

  // Replace only the package's own current version string, wherever it appears as a JSON value
  // ("version" + every internal @vellora pin all share it). A quoted, exact match avoids touching
  // unrelated fields and preserves all surrounding formatting.
  const needle = `"${current}"`;
  const next = current === version ? text : text.split(needle).join(`"${version}"`);

  // Guard: the result must still parse and actually carry the target version.
  if (JSON.parse(next).version !== version) {
    console.error(`error: ${rel} version did not update to ${version} (current was ${current})`);
    process.exit(1);
  }

  if (DRY) {
    const hits = text.split(needle).length - 1;
    console.log(`would update ${rel} (${current} -> ${version}, ${hits} occurrence(s))`);
  } else {
    writeFileSync(path, next);
    console.log(`updated ${rel} (${current} -> ${version})`);
  }
}

console.log(`\n${DRY ? "[dry-run] " : ""}set all published packages to ${version}`);
