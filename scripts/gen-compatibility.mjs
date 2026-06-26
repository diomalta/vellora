#!/usr/bin/env node
// Generates COMPATIBILITY.md from the strict subset-validation denylists in
// crates/vellora-core/src/validation.rs, which are the single source of truth
// for what vellora's strict gate accepts. The subset is DENYLIST-based:
// everything NOT denied flows to layout (so it is "Supported / best-effort").
//
// Usage:
//   node scripts/gen-compatibility.mjs           # write COMPATIBILITY.md
//   node scripts/gen-compatibility.mjs --check    # diff against committed file; exit 1 if stale

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const VALIDATION_RS = join(ROOT, "crates", "vellora-core", "src", "validation.rs");
const OUTPUT = join(ROOT, "COMPATIBILITY.md");

/**
 * Extract a `const NAME: &[&str] = &[ "a", "b" ];` array body as a list of
 * string literals, regardless of line wrapping.
 */
function extractStrArray(src, name) {
  const re = new RegExp(`const\\s+${name}\\s*:[^=]*=\\s*&\\[([\\s\\S]*?)\\];`, "m");
  const m = src.match(re);
  if (!m) throw new Error(`could not find const ${name} in validation.rs`);
  return [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1]);
}

/**
 * Extract a `const NAME: &[(&str, &str)] = &[ ("a","b"), ... ];` array body as
 * a list of [needle, feature] pairs.
 */
function extractPairArray(src, name) {
  const re = new RegExp(`const\\s+${name}\\s*:[^=]*=\\s*&\\[([\\s\\S]*?)\\];`, "m");
  const m = src.match(re);
  if (!m) throw new Error(`could not find const ${name} in validation.rs`);
  return [...m[1].matchAll(/\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g)].map((x) => [
    x[1],
    x[2],
  ]);
}

function extractConstUsize(src, name) {
  const re = new RegExp(`const\\s+${name}\\s*:\\s*usize\\s*=\\s*(\\d+)\\s*;`, "m");
  const m = src.match(re);
  if (!m) throw new Error(`could not find const ${name} in validation.rs`);
  return Number(m[1]);
}

const src = readFileSync(VALIDATION_RS, "utf8");
const deniedElements = extractStrArray(src, "DENIED_ELEMENTS");
const deniedProps = extractPairArray(src, "DENIED_CSS_PROPERTIES");
// Tokens contain whitespace variants (e.g. "display:grid"/"display: grid") that
// map to the same feature; dedupe by feature for the table.
const deniedTokensRaw = extractPairArray(src, "DENIED_CSS_TOKENS");
const maxNesting = extractConstUsize(src, "MAX_NESTING_DEPTH");

// Only features with a real `vellora fix` rule are Dev-time-fixable; everything
// else denied is plain Unsupported.
const FIX_RULES = {
  "css:grid": "flex/grid-in-td",
};

// Why each denied element is out of subset (caveat shown in the table).
const ELEMENT_REASON = {
  script: "scripting",
  canvas: "scripting / dynamic raster",
  video: "media",
  audio: "media",
  iframe: "embedded browsing context",
  object: "embedded content",
  embed: "embedded content",
  applet: "embedded content",
  input: "interactive form control",
  button: "interactive form control",
  select: "interactive form control",
  textarea: "interactive form control",
  form: "interactive form",
  marquee: "animation",
  blink: "animation",
  noscript: "scripting fallback",
};

function statusFor(feature) {
  return FIX_RULES[feature] ? "Dev-time-fixable" : "Unsupported";
}

const elementRows = deniedElements.map((tag) => {
  const feature = `element:${tag}`;
  const status = statusFor(feature);
  const reason = ELEMENT_REASON[tag] ?? "outside subset";
  const note =
    status === "Dev-time-fixable"
      ? `Auto-fixable via \`vellora fix\` rule \`${FIX_RULES[feature]}\`.`
      : `Rejected by the strict gate (${reason}).`;
  return { feature: `\`<${tag}>\``, status, note };
});

const propRows = deniedProps.map(([prop, feature]) => {
  const status = statusFor(feature);
  // Mirror the scanner's property-boundary matching: the needle is matched only
  // at a property boundary, so a longer property that merely contains it as a
  // substring (e.g. `text-transform` contains `transform`) is NOT denied.
  const boundaryNote =
    prop === "transform"
      ? "Matched at a property boundary only — `text-transform` is allowed even though it contains `transform`."
      : `Matched at a property boundary only — a longer property name that merely contains \`${prop}\` as a substring is unaffected.`;
  const note =
    status === "Dev-time-fixable"
      ? `Auto-fixable via \`vellora fix\` rule \`${FIX_RULES[feature]}\`.`
      : `Rejected by the strict gate. ${boundaryNote}`;
  return { feature: `\`${prop}\` (${feature})`, status, note };
});

const seenTokenFeatures = new Set();
const tokenRows = [];
for (const [token, feature] of deniedTokensRaw) {
  if (seenTokenFeatures.has(feature)) continue;
  seenTokenFeatures.add(feature);
  const status = statusFor(feature);
  const note =
    status === "Dev-time-fixable"
      ? `Auto-fixable via \`vellora fix\` rule \`${FIX_RULES[feature]}\`.`
      : "Rejected by the strict gate.";
  tokenRows.push({ feature: `\`${token}\` (${feature})`, status, note });
}

// Curated allowed/best-effort and dev-time-fixable entries that are NOT on a
// denylist (so the gate accepts them) but matter to authors. These describe
// renderer behaviour for in-subset features.
const allowedRows = [
  {
    feature: "Block & inline text, headings, lists",
    status: "Supported",
    note: "Rendered via the Blitz/Stylo/Taffy layout engine.",
  },
  {
    feature: "Tables (incl. multi-page, repeated `<thead>`)",
    status: "Supported",
    note: "Headers repeat across page breaks.",
  },
  {
    feature: "Images: data URL PNG / JPEG / GIF / WebP",
    status: "Supported",
    note: "Base64 `data:image/...` sources are embedded as PDF image XObjects when the `<img>` has finite laid-out dimensions.",
  },
  {
    feature: "Images: relative or remote URLs",
    status: "Planned",
    note: "The core renderer does not fetch assets; bundle or inline them as data URLs before rendering.",
  },
  {
    feature: "`@page` margins, page numbers, running header/footer",
    status: "Supported",
    note: "Paged-media constructs are honoured.",
  },
  {
    feature: "Fonts: text shaping + subset embedding",
    status: "Supported",
    note: "Text is shaped and the resolved font is subset and embedded into the PDF. Supplying custom fonts via the `fonts` option is planned and currently inert.",
  },
  {
    feature: "`display: flex`",
    status: "Partial",
    note: "Not on a denylist, so the gate accepts it, but it is not a full flexbox implementation. Prefer tables for reliable layout; `vellora fix` (`flex/grid-in-td`) can convert it.",
  },
  {
    feature: "Inline SVG (`<svg>`)",
    status: "Dev-time-fixable",
    note: "Not handled at render time; `vellora fix` rule `inline-svg` rasterizes it to PNG.",
  },
  {
    feature: "`<img>` without explicit dimensions",
    status: "Dev-time-fixable",
    note: "`vellora fix` rule `img-dimension-attrs` adds intrinsic `width`/`height` so layout is deterministic.",
  },
];

function table(rows) {
  const head = "| Feature | Status | Notes |\n|---|---|---|";
  const body = rows.map((r) => `| ${r.feature} | ${r.status} | ${r.note} |`).join("\n");
  return `${head}\n${body}`;
}

const md = `<!-- GENERATED FILE — DO NOT EDIT BY HAND.
     Regenerate with: node scripts/gen-compatibility.mjs
     Source of truth: crates/vellora-core/src/validation.rs -->

# Compatibility reference

vellora renders a documented HTML/CSS subset and is **strict by default**. This
reference is generated mechanically from the strict subset-validation denylists
in \`crates/vellora-core/src/validation.rs\`, so it cannot drift from what the
renderer actually accepts.

The subset is **denylist-based**: everything that is *not* explicitly denied
below flows to the layout engine and is rendered best-effort. A denied feature
is rejected by the strict gate with a \`VelloraUnsupportedError\` before any PDF
is produced (unless you opt into runtime fixing with \`{ strict: false }\`).

## Status levels

- **Supported** — in the subset; renders.
- **Partial** — in the subset (the gate accepts it), but with a documented caveat.
- **Planned** — designed but not yet implemented; accepted by the gate but has no effect on output in the current release.
- **Unsupported** — on a denylist; the strict gate rejects it. Rewrite required.
- **Dev-time-fixable** — rejected at render time, but \`vellora fix\` can transform
  it automatically (the applicable rule is named in the Notes column).

## Allowed and best-effort features

These are not on any denylist, so the strict gate accepts them.

${table(allowedRows)}

## Unsupported HTML elements

These elements are in \`DENIED_ELEMENTS\` and are rejected by the strict gate.

${table(elementRows)}

## Unsupported CSS properties

These properties are in \`DENIED_CSS_PROPERTIES\` and are rejected by the strict
gate. Matching is at a **property boundary**: \`text-transform\` is allowed even
though it contains \`transform\`.

${table(propRows)}

## Unsupported CSS at-rules and values

These tokens are in \`DENIED_CSS_TOKENS\` and are rejected by the strict gate.

${table(tokenRows)}

## Nesting depth limit

The strict gate rejects documents whose element nesting exceeds
**${maxNesting} levels** (the \`MAX_NESTING_DEPTH\` constant). Real documents nest only
a handful of levels deep; this cap rejects only pathologically deep markup.
`;

const isCheck = process.argv.includes("--check");

if (isCheck) {
  let committed;
  try {
    committed = readFileSync(OUTPUT, "utf8");
  } catch {
    console.error("COMPATIBILITY.md is missing; run: node scripts/gen-compatibility.mjs");
    process.exit(1);
  }
  if (committed !== md) {
    console.error("COMPATIBILITY.md is stale. Regenerate with: node scripts/gen-compatibility.mjs");
    process.exit(1);
  }
  console.log("COMPATIBILITY.md is up to date.");
} else {
  writeFileSync(OUTPUT, md);
  console.log(`Wrote ${OUTPUT}`);
}
