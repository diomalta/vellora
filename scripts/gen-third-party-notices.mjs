// Regenerate packages/native/THIRD-PARTY-NOTICES.md from the actual crate dependency tree.
//
// The prebuilt addon statically links its Rust dependencies, so their copyright notices and
// license texts must travel with the binary. This reads the real license files bundled by each
// crate (via cargo-bundle-licenses) and emits an attribution index + the deduplicated license
// texts, below a sentinel — the hand-written font section above the sentinel is preserved.
//
// Requires: cargo install cargo-bundle-licenses --locked
// Usage:    node scripts/gen-third-party-notices.mjs [--check]
//   --check  exit non-zero if the file would change (for CI), without writing.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "packages/native/THIRD-PARTY-NOTICES.md");
const CHECK = process.argv.includes("--check");
const SENTINEL =
  "<!-- BEGIN GENERATED: Rust crate licenses — regenerate with scripts/gen-third-party-notices.mjs -->";

let json;
try {
  json = execFileSync("cargo", ["bundle-licenses", "--format", "json", "--output", "-"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  });
} catch {
  console.error("error: `cargo bundle-licenses` failed. Install it with:");
  console.error("  cargo install cargo-bundle-licenses --locked");
  process.exit(1);
}

const libs = JSON.parse(json).third_party_libraries;
libs.sort((a, b) => a.package_name.localeCompare(b.package_name));

const hasText = (l) => l.text && !/NOT FOUND|could not be found/i.test(l.text);

// Attribution index — every linked crate, with its SPDX expression and source.
const indexLines = libs.map((l) => {
  const repo = l.repository ? ` — ${l.repository}` : "";
  const note = (l.licenses || []).some(hasText) ? "" : " *(license text not shipped by crate)*";
  return `- **${l.package_name}** ${l.package_version} — ${l.license}${repo}${note}`;
});

// Deduplicate license texts: identical text (e.g. Apache-2.0) collapses to one block listing the
// crates that share it; MIT/BSD blocks stay distinct because their copyright lines differ.
const byText = new Map();
for (const lib of libs) {
  for (const lic of lib.licenses || []) {
    if (!hasText(lic)) continue;
    // Normalize whitespace for the dedup KEY only (collapses formatting-only variants of the same
    // license, e.g. Apache-2.0); the first-seen verbatim text is what gets displayed.
    const key = `${lic.license}${lic.text.replace(/\s+/g, " ").trim()}`;
    if (!byText.has(key))
      byText.set(key, { name: lic.license, crates: new Set(), text: lic.text.trimEnd() });
    byText.get(key).crates.add(`${lib.package_name} ${lib.package_version}`);
  }
}

// Guard: any license family that appears ONLY on crates without bundled text would be unattributed.
const familiesWithText = new Set([...byText.values()].flatMap((b) => b.name.split(/\s+OR\s+/)));
const missingFamilies = new Set();
for (const lib of libs) {
  if ((lib.licenses || []).some(hasText)) continue;
  for (const part of lib.license.split(/\s+OR\s+/)) {
    if (!familiesWithText.has(part)) missingFamilies.add(part);
  }
}
if (missingFamilies.size) {
  console.error(`error: no license text available for: ${[...missingFamilies].join(", ")}`);
  console.error("Add a canonical text fallback for these families before publishing.");
  process.exit(1);
}

const blocks = [...byText.values()].sort(
  (a, b) => a.name.localeCompare(b.name) || [...a.crates][0].localeCompare([...b.crates][0]),
);

const textSections = blocks
  .map((b) => {
    const crates = [...b.crates].sort().join(", ");
    return `### ${b.name}\n\nApplies to: ${crates}\n\n\`\`\`\n${b.text}\n\`\`\``;
  })
  .join("\n\n");

const generated = `${SENTINEL}

## Rust crates compiled into the addon

The prebuilt \`.node\` statically links the following ${libs.length} third-party crates. Their
copyright and permission notices are reproduced below as required by their licenses (MIT, Apache-2.0,
MPL-2.0, BSD, ISC, Zlib, Unicode-3.0, and others). For crates that do not ship a license file, the
SPDX identifier and upstream repository are listed; the canonical text of that license applies.

${indexLines.join("\n")}

## License texts

${textSections}
`;

const existing = readFileSync(OUT, "utf8");
const idx = existing.indexOf(SENTINEL);
const preamble = (idx === -1 ? existing : existing.slice(0, idx)).trimEnd();
const next = `${preamble}\n\n${generated}`;

if (CHECK) {
  if (existing.trimEnd() !== next.trimEnd()) {
    console.error(
      "error: THIRD-PARTY-NOTICES.md is out of date — run scripts/gen-third-party-notices.mjs",
    );
    process.exit(1);
  }
  console.log("THIRD-PARTY-NOTICES.md is up to date");
} else {
  writeFileSync(OUT, `${next}\n`);
  console.log(`wrote ${libs.length} crates to packages/native/THIRD-PARTY-NOTICES.md`);
}
