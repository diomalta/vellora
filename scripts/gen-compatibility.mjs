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
const deniedMarginBoxes = extractPairArray(src, "DENIED_PAGE_MARGIN_BOXES");
const maxNesting = extractConstUsize(src, "MAX_NESTING_DEPTH");

// Only features with a real `@vellora/lint.fix()` rule are Dev-time-fixable;
// everything else denied is plain Unsupported.
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
      ? `Auto-fixable via \`@vellora/lint.fix()\` rule \`${FIX_RULES[feature]}\`; the CLI \`vellora fix\` wraps the same rule.`
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
      ? `Auto-fixable via \`@vellora/lint.fix()\` rule \`${FIX_RULES[feature]}\`; the CLI \`vellora fix\` wraps the same rule.`
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
      ? `Auto-fixable via \`@vellora/lint.fix()\` rule \`${FIX_RULES[feature]}\`; the CLI \`vellora fix\` wraps the same rule.`
      : "Rejected by the strict gate.";
  tokenRows.push({ feature: `\`${token}\` (${feature})`, status, note });
}

const marginBoxRows = deniedMarginBoxes.map(([name, feature]) => ({
  feature: `\`${name}\` (${feature})`,
  status: statusFor(feature),
  note: "Rejected by the strict gate. Not drawn by the native renderer.",
}));

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
    feature: "Images: `src` via the `images` option (with optional `baseUrl`)",
    status: "Supported",
    note: "A non-`data:` `<img src>` is resolved by looking up the caller-supplied `images` map (a `Record<string, Uint8Array>` keyed by `src`, optionally normalized against `baseUrl`); the format is detected from the bytes. A renderable `<img>` whose source does not resolve is rejected.",
  },
  {
    feature: "Images: network fetching of remote URLs",
    status: "Unsupported",
    note: "The core renderer never fetches assets (determinism + no network). Provide the bytes via the `images` option, keyed by the `src` (or `baseUrl`-resolved) URL.",
  },
  {
    feature: "`@page` margins, page numbers, running header/footer",
    status: "Supported",
    note: "Page size and margins are honoured; running content is drawn in the `@top-center` and `@bottom-center` margin boxes, with `counter(page)` / `counter(pages)`. The other margin boxes are rejected (see below).",
  },
  {
    feature: "`@page :first` / `:left` / `:right`",
    status: "Partial",
    note: 'Every `@page` rule of every `<style>` element is read in cascade order (selectors, cascade layers, `!important`, `@media print`). A page selector may change `margin-top`, `margin-bottom`, the page height and the margin boxes per page. A rule that gives pages different content widths (page width minus the left and right margins) is rejected as `css:page-varying-width`: the document is laid out once, at one width. Route such a template to `engine: "chromium"`.',
  },
  {
    feature: "HTML parsing",
    status: "Supported",
    note: "Every document is parsed with the HTML parser, as a browser parses `text/html`, whatever its doctype or XML prolog: an XHTML doctype or `<?xml` prolog no longer switches to an XML parse (where `<br>` is not void and the text after it was lost).",
  },
  {
    feature: "`<table cellspacing>` / `<table cellpadding>`",
    status: "Supported",
    note: "Mapped like Chrome's presentational hints: `cellspacing` to `border-spacing` (in px), `cellpadding` to the cells' padding; author CSS (`border-spacing`, cell `padding`) wins over them, and a table without the attribute keeps the user-agent 2 px spacing.",
  },
  {
    feature: "`@media print` / `@media screen`",
    status: "Supported",
    note: "Documents are styled for print media, like a browser printing: `@media print` (and `all`, `not screen`) rules apply, `@media screen` rules do not. Media features (`width`, `height`, …) are evaluated against the first page's `@page` content box (whole CSS px); browsers use their own print page size instead. `@page` rules inside an `@media` block are read by media type only: a query with a media feature does not match for them (the page box decides the content box the features are measured against). The `media` attribute of a `<style>` element is not evaluated: its rules always apply.",
  },
  {
    feature:
      "`break-inside: avoid` / `break-before: page` (and `page-break-inside` / `page-break-before`)",
    status: "Partial",
    note: "Read from `<style>` rules (any selector Stylo parses), at the top level or inside `@media` blocks (each query list evaluated by Stylo exactly as for the style rules next to it: media type and media features, the features against the first page's `@page` content box), and from inline `style`; rules inside `@supports`/`@layer` are ignored. `break-inside: avoid` keeps together a top-level block, a transparent wrapper (`div`/`section`/`article`/`main`), an items table, or an items-table `<tbody>`; a group taller than an empty page falls back to its rows. `break-before: page` starts a top-level block, a wrapper child, a `<tbody>` or a `<tr>` on a new page. `break-after` and `orphans`/`widows` are not implemented.",
  },
  {
    feature: "Fonts: text shaping + subset embedding",
    status: "Supported",
    note: "Text is shaped and the resolved font is subset and embedded into the PDF.",
  },
  {
    feature: "Fonts: custom faces via the `fonts` option",
    status: "Supported",
    note: 'Caller-supplied font faces (a `Uint8Array[]` of raw TTF/OTF bytes) register into the deterministic font context and are reachable from CSS by each face\'s intrinsic embedded family name (`font-family: "Inter"`); family/weight/style are read from the bytes. Custom faces never override the CSS generics, no host/system font is consulted, and bytes that are not a parseable font reject with `font:invalid`.',
  },
  {
    feature: "Fonts: declared family aliasing / `@font-face` `src` / subsetting config",
    status: "Unsupported",
    note: "A face is reachable only by its intrinsic embedded family name — the `@font-face` model (a caller-declared alias decoupled from the font's own name), resolving `@font-face` `src` URLs from the document CSS, weight/style overrides, variable-font axis selection, and font-subsetting configuration are not provided.",
  },
  {
    feature: "`display: flex`",
    status: "Partial",
    note: "Not on a denylist, so the gate accepts it, but it is not a full flexbox implementation. Prefer tables for reliable layout; `@vellora/lint.fix()` (`flex/grid-in-td`) can convert common table-cell cases.",
  },
  {
    feature:
      "Multi-column layout (`columns`, `column-count`, `column-width`, `column-gap`, `column-fill`)",
    status: "Partial",
    note: "Laid out by vellora (Blitz has no multi-column layout). The column count and width follow CSS Multi-column §3.4 (`column-gap: normal` is `1em`). Content is broken between columns at the paginator's break points: between lines and boxes, never inside a line, an image, an `inline-block`, a `contain: size` box or a `break-inside: avoid` box that fits a column. `break-before: column` / `break-after: column` force a column break (taken in document order, so several forced breaks at the same height each start a column; a break on a row flex item moves its whole flex line, and a negative margin after the break is kept), `break-before: avoid` / `break-after: avoid` move it to the previous break point, and the space at a break is truncated (a flex `row-gap` too). `column-fill: balance` (the default) balances the columns; `column-fill: auto` fills columns of a fixed height in order, continuing in overflow columns, and a content-sized `column-fill: auto` container keeps one column. `orphans` / `widows` are read for column breaks (pages still use 2). Absolutely positioned boxes are positioned against their containing block (in its column fragments when it is inside the columns). Not implemented: `column-span: all` (the spanner stays in the column flow), `column-rule` (not painted), a multi-column container inside another one (laid out in one column), a multi-column container broken across pages (its columns are cut as one block), vertical writing modes, and separate unforced breaks per parallel flow (row flex items, the lines of a column flex container, table cells: one break line for all). A multi-column container longer than a page is cut across all its columns at once (Chrome fills the columns of each page in turn).",
  },
  {
    feature: "Inline SVG (`<svg>`)",
    status: "Dev-time-fixable",
    note: "Not handled at render time; `@vellora/lint.fix()` rule `inline-svg` rasterizes it to PNG. The CLI `vellora fix` wraps the same rule.",
  },
  {
    feature: "`<img>` without explicit dimensions",
    status: "Dev-time-fixable",
    note: "`@vellora/lint.fix()` rule `img-dimension-attrs` adds intrinsic `width`/`height` so layout is deterministic. The CLI `vellora fix` wraps the same rule.",
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
- **Dev-time-fixable** — rejected at render time, but \`@vellora/lint.fix()\` can
  transform it automatically (the applicable rule is named in the Notes column).
  The \`vellora fix\` CLI wraps the same library rule.

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

## Unsupported \`@page\` margin boxes

These margin boxes are in \`DENIED_PAGE_MARGIN_BOXES\` and are rejected by the
strict gate as \`css:page-margin-box\`. The native renderer draws only
\`@top-center\` and \`@bottom-center\`; use one of those, or route the template to
\`engine: "chromium"\`.

${table(marginBoxRows)}

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
