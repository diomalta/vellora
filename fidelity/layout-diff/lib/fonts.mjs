// Bundled-font parity for the Chrome side. FONT_ALIASES is the ONE shared table of
// fidelity/lib/chrome-reference.mjs (a superset of benchmarks/visual-fidelity.mjs, checked by
// test/fonts.test.mjs). Every alias points Chrome at the SAME .ttf files vellora embeds via
// include_bytes! (crates/vellora-core/src/fonts/), so both engines shape with identical font files.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FONT_ALIASES,
  aliasFor,
  bundledFontFaceCss as sharedFontFaceCss,
} from "../../lib/chrome-reference.mjs";

export { FONT_ALIASES };

/**
 * Bundled face file (as reported per run by the vellora dump) -> the CSS family/weight that reaches
 * the SAME file in Chrome through FONT_ALIASES. DejaVu (vellora's glyph fallback) and the Blitz
 * bullet font have no injected Chrome counterpart: null.
 */
export function chromeFontFor(face) {
  const alias = aliasFor(face);
  if (!alias) return null;
  return { family: alias.families.find((f) => f.startsWith("Liberation")), weight: alias.weight };
}

/**
 * Every CSS family that reaches `face` in Chrome through FONT_ALIASES (e.g. "Vellora Sans" and
 * "Liberation Sans" both reach LiberationSans-Regular.ttf), with the weight that selects it.
 * null for faces without an injected Chrome counterpart (DejaVu fallback, Blitz bullet font).
 */
export function aliasFamiliesFor(face) {
  return aliasFor(face);
}

export function bundledFontDir(repoRoot) {
  return join(repoRoot, "crates", "vellora-core", "src", "fonts");
}

/** The shared @font-face block (data: URLs of the bundled files). */
export function bundledFontFaceCss(repoRoot) {
  return sharedFontFaceCss(bundledFontDir(repoRoot));
}

/** sha256 of every bundled font file, recorded in each result's environment block. */
export function bundledFontHashes(repoRoot) {
  const out = {};
  const files = new Set(FONT_ALIASES.flatMap((alias) => [alias.regular, alias.bold]));
  for (const file of [...files].sort()) {
    const bytes = readFileSync(join(bundledFontDir(repoRoot), file));
    out[file] = createHash("sha256").update(bytes).digest("hex");
  }
  return out;
}
