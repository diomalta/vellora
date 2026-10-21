// Bundled-font parity for the Chrome side. FONT_ALIASES is a verbatim copy of the constant of the
// same name in benchmarks/visual-fidelity.mjs (that file runs main() at import time, so it cannot
// be imported). test/fonts.test.mjs extracts the literal from the benchmarks source and fails on
// drift. Every alias points Chrome at the SAME .ttf files vellora embeds via include_bytes!
// (crates/vellora-core/src/fonts/), so both engines shape with identical font files.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const FONT_ALIASES = [
  {
    families: ["Vellora Sans", "Inter", "Helvetica Neue", "Arial", "Liberation Sans"],
    regular: "LiberationSans-Regular.ttf",
    bold: "LiberationSans-Bold.ttf",
  },
  {
    families: ["Liberation Serif", "Georgia", "Times New Roman"],
    regular: "LiberationSerif-Regular.ttf",
    bold: "LiberationSerif-Bold.ttf",
  },
  {
    families: ["Vellora Mono", "Liberation Mono", "Menlo", "Consolas", "Courier New"],
    regular: "LiberationMono-Regular.ttf",
    bold: "LiberationMono-Bold.ttf",
  },
];

/**
 * Bundled face file (as reported per run by the vellora dump) -> the CSS family/weight that reaches
 * the SAME file in Chrome through FONT_ALIASES. DejaVu (vellora's glyph fallback) and the Blitz
 * bullet font have no injected Chrome counterpart: null.
 */
export function chromeFontFor(face) {
  for (const alias of FONT_ALIASES) {
    const family = alias.families.find((f) => f.startsWith("Liberation"));
    if (face === alias.regular) return { family, weight: 400 };
    if (face === alias.bold) return { family, weight: 700 };
  }
  return null;
}

export function bundledFontDir(repoRoot) {
  return join(repoRoot, "crates", "vellora-core", "src", "fonts");
}

function fontDataUrl(repoRoot, fileName) {
  const bytes = readFileSync(join(bundledFontDir(repoRoot), fileName)).toString("base64");
  return `data:font/ttf;base64,${bytes}`;
}

/** Same rule shape as benchmarks/visual-fidelity.mjs bundledFontFaceCss(). */
export function bundledFontFaceCss(repoRoot) {
  const rules = [];
  for (const alias of FONT_ALIASES) {
    const regular = fontDataUrl(repoRoot, alias.regular);
    const bold = fontDataUrl(repoRoot, alias.bold);
    for (const family of alias.families) {
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${regular}) format("truetype"); font-weight: 400; font-style: normal; }`,
      );
      rules.push(
        `@font-face { font-family: ${JSON.stringify(family)}; src: url(${bold}) format("truetype"); font-weight: 700; font-style: normal; }`,
      );
    }
  }
  return rules.join("\n");
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
