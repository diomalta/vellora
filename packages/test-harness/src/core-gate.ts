/**
 * Probes for the strict core gate (`crates/vellora-core/src/validation.rs`), built from the gate's
 * own denylists so lint and the gate are tested against the same inputs (issue #60). The lists are
 * read from the Rust source — the same parse `scripts/gen-compatibility.mjs` uses for
 * COMPATIBILITY.md — so a new denylist entry gets a probe without editing this file.
 *
 * - `rejected`: one minimal document per denied construct (and per CSS region kind) with the
 *   `feature` the gate rejects it as.
 * - `accepted`: near misses the gate lets through (`text-transform`, a denied word in a string or a
 *   comment, `display:flex` in a cell, …): lint must not report a gate `feature` for them.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VALIDATION_RS = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "crates",
  "vellora-core",
  "src",
  "validation.rs",
);

/** The gate's denylists, parsed from `validation.rs`. */
export interface CoreGateLists {
  deniedElements: string[];
  deniedCssProperties: [string, string][];
  deniedCssTokens: [string, string][];
  deniedPageMarginBoxes: [string, string][];
  /** `<link rel="stylesheet">` / `@import` (issue #59), needles unescaped. */
  deniedExternalStylesheets: [string, string][];
  /** Every `"<namespace>:<feature>"` literal (and `element:<tag>`) the gate can emit. */
  features: string[];
}

export interface GateProbe {
  name: string;
  html: string;
  /** The feature the strict gate rejects `html` with (absent on an accepted probe). */
  feature?: string;
}

export function validationSource(): string {
  return readFileSync(VALIDATION_RS, "utf8");
}

function arrayBody(src: string, name: string): string {
  const match = src.match(new RegExp(`const\\s+${name}\\s*:[^=]*=\\s*&\\[([\\s\\S]*?)\\];`, "m"));
  if (!match?.[1]) {
    throw new Error(`could not find const ${name} in validation.rs`);
  }
  return match[1];
}

function strArray(src: string, name: string): string[] {
  return [...arrayBody(src, name).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1] as string);
}

function pairArray(src: string, name: string): [string, string][] {
  return [
    ...arrayBody(src, name).matchAll(/\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g),
  ].map((m) => [m[1] as string, m[2] as string]);
}

export function coreGateLists(src: string = validationSource()): CoreGateLists {
  const deniedElements = strArray(src, "DENIED_ELEMENTS");
  // Feature literals outside comments: `"css:grid"`, `"image:unresolved"`, `"max-nesting-depth"`.
  const code = src
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
  const literals = [...code.matchAll(/"((?:css|element|image|font|html):[a-z0-9-]+)"/g)].map(
    (m) => m[1] as string,
  );
  const bare = [...code.matchAll(/feature:\s*"([a-z0-9-]+)"/g)].map((m) => m[1] as string);
  const features = new Set([
    ...literals,
    ...bare,
    ...deniedElements.map((tag) => `element:${tag}`),
  ]);
  return {
    deniedElements,
    deniedCssProperties: pairArray(src, "DENIED_CSS_PROPERTIES"),
    deniedCssTokens: pairArray(src, "DENIED_CSS_TOKENS"),
    deniedPageMarginBoxes: pairArray(src, "DENIED_PAGE_MARGIN_BOXES"),
    deniedExternalStylesheets: pairArray(src, "DENIED_EXTERNAL_STYLESHEETS").map(
      ([needle, feature]) => [needle.replace(/\\"/g, '"'), feature],
    ),
    features: [...features].sort(),
  };
}

const VOID_ELEMENTS = new Set(["input", "embed"]);

function page(head: string, body: string): string {
  return `<!DOCTYPE html><html><head><title>t</title>${head}</head><body>${body}</body></html>`;
}

/** One minimal document per denied construct the gate rejects, with its feature. */
export function rejectedGateProbes(lists: CoreGateLists = coreGateLists()): GateProbe[] {
  const probes: GateProbe[] = [];
  for (const tag of lists.deniedElements) {
    const element = VOID_ELEMENTS.has(tag) ? `<${tag}>` : `<${tag}>x</${tag}>`;
    probes.push({
      name: `<${tag}>`,
      html: page("", `<p>x</p>${element}`),
      feature: `element:${tag}`,
    });
  }
  for (const [prop, feature] of lists.deniedCssProperties) {
    probes.push({
      name: `${prop} in <style>`,
      html: page(`<style>p { color: black; ${prop}: none; }</style>`, "<p>x</p>"),
      feature,
    });
    probes.push({
      name: `${prop} in style=""`,
      html: page("", `<p style="color:black;${prop}:none">x</p>`),
      feature,
    });
  }
  for (const [token, feature] of lists.deniedCssTokens) {
    if (token.startsWith("@")) {
      probes.push({
        name: `${token} in <style>`,
        html: page(
          `<style>${token} k { from { opacity: 1; } to { opacity: 0; } }</style>`,
          "<p>x</p>",
        ),
        feature,
      });
      continue;
    }
    probes.push({
      name: `${token} in <style>`,
      html: page(`<style>div { ${token}; }</style>`, "<div><p>x</p></div>"),
      feature,
    });
    probes.push({
      name: `${token} in style=""`,
      html: page("", `<div style="${token}"><p>x</p></div>`),
      feature,
    });
  }
  probes.push({
    name: "display : grid (whitespace around the colon)",
    html: page("<style>div { display : grid }</style>", "<div><p>x</p></div>"),
    feature: "css:grid",
  });
  probes.push({
    name: "display:/*x*/grid (comment in the value)",
    html: page("<style>div { display:/*x*/grid }</style>", "<div><p>x</p></div>"),
    feature: "css:grid",
  });
  for (const [box, feature] of lists.deniedPageMarginBoxes) {
    probes.push({
      name: `${box} margin box`,
      html: page(`<style>@page { ${box} { content: "x"; } }</style>`, "<p>x</p>"),
      feature,
    });
  }
  for (const [needle, feature] of lists.deniedExternalStylesheets) {
    probes.push(
      needle.startsWith("@")
        ? {
            name: `${needle} in <style>`,
            html: page(`<style>${needle} url("https://example.com/x.css");</style>`, "<p>x</p>"),
            feature,
          }
        : {
            name: needle,
            html: page(needle.replace(">", ' href="https://example.com/x.css">'), "<p>x</p>"),
            feature,
          },
    );
  }
  return probes;
}

/** Near misses the gate accepts: lint must not report a gate feature for them. */
export function acceptedGateProbes(): GateProbe[] {
  return [
    {
      name: "text-transform",
      html: page("<style>p { text-transform: uppercase }</style>", "<p>x</p>"),
    },
    {
      name: "denied word inside a string value",
      html: page(
        '<style>p::after { content: "transform: rotate(1deg); display:grid" }</style>',
        "<p>x</p>",
      ),
    },
    {
      name: "denied declaration inside a CSS comment",
      html: page(
        "<style>p { color: black; /* filter: blur(2px); transform: none */ }</style>",
        "<p>x</p>",
      ),
    },
    {
      name: "denied word in prose",
      html: page("", "<p>transform: rotate(1deg); display:grid; &lt;canvas&gt;</p>"),
    },
    { name: "display:flex", html: page("", '<div style="display:flex"><p>x</p></div>') },
    {
      name: "display:inline-grid",
      html: page("", '<div style="display:inline-grid"><p>x</p></div>'),
    },
    {
      name: "animation-name alone",
      html: page("<style>p { animation-name: k }</style>", "<p>x</p>"),
    },
    {
      name: "@top-center and @bottom-center margin boxes",
      html: page(
        '<style>@page { @top-center { content: "a" } @bottom-center { content: "b" } }</style>',
        "<p>x</p>",
      ),
    },
    {
      name: "@ inside a url()",
      html: page(
        "<style>.i { background: url(icons@bottom-right.png) }</style>",
        '<p class="i">x</p>',
      ),
    },
    {
      name: '<link rel="icon">',
      html: page('<link rel="icon" href="a.png">', "<p>x</p>"),
    },
    {
      name: "@import inside a string or a comment, and @importance",
      html: page(
        '<style>p::before { content: "@import url(x.css)" } /* @import url(y.css); */ @importance {}</style>',
        "<p>x</p>",
      ),
    },
  ];
}
