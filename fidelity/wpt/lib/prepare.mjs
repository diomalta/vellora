// Turn a WPT test/reference file into a self-contained vellora render input.
//
// vellora's input contract is self-contained HTML: it never fetches stylesheets, fonts or images.
// WPT tests assume a browser that loads them (and has Ahem installed). The preparation below
// supplies those inputs through vellora's own channels and records every change it made so a
// result can always be traced back to exactly what was rendered:
//   1. <link rel=stylesheet> from the WPT tree is inlined as <style> at the same position (cascade
//      order unchanged); nested @import is inlined up to depth 3.
//   2. Ahem (fonts/Ahem.ttf) is always passed via `fonts` (WPT docs: Ahem is assumed installed);
//      other @font-face TTF/OTF sources found in the CSS are passed too, and an alias mismatch
//      (declared family != intrinsic family) is recorded because vellora matches by intrinsic name.
//   3. <img src> files from the WPT tree are passed via `images`, keyed by the WHATWG-joined URL
//      with `baseUrl` = the node's URL (exactly how vellora-core's resolve_image_key joins).
//   4. The UA page box: `<style>@layer vellora-ua-page { @page { … } }</style>` injected before
//      the author styles (the style insertion point) — screen reftests `size: 800px 600px;
//      margin: 0` (the 800x600 WPT viewport), print reftests the WPT print default `size: 5in 3in;
//      margin: 0.5in`. vellora cascades every @page rule (since port step 06, `page_css`): the
//      first cascade layer loses to every later layer and to every unlayered rule, so every author
//      @page rule (`:first`/`:left`/`:right` and layered ones included) overrides it like a UA
//      default. Until step 06
//      vellora read only the FIRST @page block, and the print default was merged into the start of
//      the document's first @page block instead (`pageInjection: "merged-into-author-@page"`),
//      which broke as soon as that first block was `@page :first`.
//   5. Flags (attribution aids; they never change the rendered input or an outcome):
//      `uncoveredCodepoints` — visible text codepoints that no available face maps (vellora's
//      bundled faces ∪ Ahem ∪ supplied @font-face files; vellora never consults system fonts), so
//      test and reference cannot draw them as real glyphs and a pass says nothing about them;
//      `cssUrlResources` — CSS url() references outside @font-face (backgrounds, list images,
//      content images, ...), which vellora never loads (it has no channel for them).
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { urlToRel } from "./discover.mjs";
import { findTags, parseAttributes } from "./html-meta.mjs";
import { fontFormat, readCoverage, readFamilyNames } from "./sfnt.mjs";

export const SCREEN_PAGE_CSS = "size: 800px 600px; margin: 0";
export const PRINT_PAGE_CSS = "size: 5in 3in; margin: 0.5in";
/** Raster geometry at 96 DPI (1 CSS px = 1 device px), per mode. */
export const PAGE_PX = { screen: [800, 600], print: [480, 288] };
/** The injected UA page box rule: its own (first) cascade layer, so author @page rules win. */
export const uaPageRule = (pageCss) => `@layer vellora-ua-page { @page { ${pageCss} } }`;

const bytesCache = new Map();
function readTreeFile(wptRoot, rel) {
  const key = `${wptRoot}\0${rel}`;
  if (bytesCache.has(key)) return bytesCache.get(key);
  const p = join(wptRoot, rel);
  // A URL that resolves to a DIRECTORY (e.g. `url(.)`, `src=""` against a directory base) is a
  // missing resource, not a harness crash (EISDIR seen in css/css-text/crashtests).
  const value = existsSync(p) && statSync(p).isFile() ? new Uint8Array(readFileSync(p)) : null;
  if (bytesCache.size > 2000) bytesCache.clear();
  bytesCache.set(key, value);
  return value;
}

/** Resolve a URL against a base and map it into the WPT tree; null when outside the tree. */
function treeRel(href, base) {
  let u;
  try {
    u = new URL(href.trim(), base);
  } catch {
    return null;
  }
  u.search = "";
  u.hash = "";
  return { url: u.href, rel: urlToRel(u.href) };
}

/** vellora-core `css_scan::style_blocks`, re-implemented byte-for-byte in spirit (raw scan). */
export function styleBlocks(html) {
  const lower = html.toLowerCase();
  const out = [];
  let search = 0;
  for (;;) {
    const tagStart = lower.indexOf("<style", search);
    if (tagStart === -1) break;
    const after = lower[tagStart + 6];
    if (![" ", ">", "/", "\t", "\n", "\r"].includes(after)) {
      search = tagStart + 6;
      continue;
    }
    const gt = lower.indexOf(">", tagStart);
    if (gt === -1) break;
    const contentStart = gt + 1;
    const close = lower.indexOf("</style", contentStart);
    if (close === -1) break;
    out.push({ offset: contentStart, text: html.slice(contentStart, close) });
    const closeGt = lower.indexOf(">", close);
    search = closeGt === -1 ? close + 7 : closeGt + 1;
  }
  return out;
}

/**
 * Offset just after the `{` of the first well-formed @page block of the `<style>` elements, or -1
 * when there is none (used to note an author @page that precedes the injected UA page box).
 */
export function firstAtPageBodyOffset(html) {
  for (const region of styleBlocks(html)) {
    const lower = region.text.toLowerCase();
    let search = 0;
    for (;;) {
      const at = lower.indexOf("@page", search);
      if (at === -1) break;
      const open = lower.indexOf("{", at);
      if (open === -1) break;
      let depth = 1;
      let i = open + 1;
      let closed = false;
      for (; i < lower.length; i++) {
        if (lower[i] === "{") depth++;
        else if (lower[i] === "}") {
          depth--;
          if (depth === 0) {
            closed = true;
            break;
          }
        }
      }
      if (closed) return region.offset + open + 1;
      search = at + 5;
    }
  }
  return -1;
}

/**
 * Where a new <style> must go: right after `<head ...>`, else after `<html ...>`, else after the
 * doctype/XML prolog. Never before an explicit `<html>` tag: CONFIRMED (2026-10-21, vellora @
 * 20970ca, Blitz 2003ba5) that `<!DOCTYPE html><style>…</style><html xmlns="http://www.w3.org/1999/xhtml">`
 * renders a blank page (a plain `<html>` there, or a `<meta>` instead of the `<style>`, renders
 * normally). Most CSS2 tests are XHTML with exactly that `<html xmlns>` tag.
 */
export function styleInsertionPoint(html) {
  const head = /<head(?:\s[^>]*)?>/i.exec(html);
  if (head) return { offset: head.index + head[0].length, where: "after-head" };
  const htmlTag = /<html(?:\s[^>]*)?>/i.exec(html);
  if (htmlTag) return { offset: htmlTag.index + htmlTag[0].length, where: "after-html" };
  const prolog = /^\s*(?:<\?xml[^>]*\?>\s*)?(?:<!doctype[^>]*>)?/i.exec(html);
  return { offset: prolog ? prolog[0].length : 0, where: "after-doctype" };
}

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/**
 * Constructs whose meaning differs when an XHTML file (parsed as XML by browsers) is parsed as
 * HTML: CDATA sections, self-closing non-void elements (`<div/>` opens an element in HTML), and
 * XML processing instructions other than the prolog. vellora's product parse is HTML for every
 * document (port step 08); the harness renders XML-served nodes with vellora-core's XML parse
 * (lib/xhtml-bridge.mjs), so these flags say what the HTML parse would change, not what the run
 * did. Before step 08 blitz-html sniffed: an XHTML doctype, `<?xml` or a leading
 * `<html xmlns="…xhtml">` got its XML parser, anything else (`<!DOCTYPE html>` first) HTML.
 */
export function xhtmlHazards(rel, content) {
  if (!/\.(xht|xhtml|xml)$/i.test(rel)) return [];
  const out = [];
  if (content.includes("<![CDATA[")) out.push("cdata");
  for (const m of content.matchAll(/<([A-Za-z][\w:-]*)\b[^<>]*\/>/g)) {
    const name = m[1].toLowerCase().replace(/^.*:/, "");
    if (!VOID_ELEMENTS.has(name)) {
      out.push(`self-closing:${name}`);
      break;
    }
  }
  if (/<\?(?!xml\s)[A-Za-z]/.test(content)) out.push("processing-instruction");
  return out;
}

const IMPORT_RE = /@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1\s*\)?([^;]*);/gi;

function inlineImports(css, cssUrl, wptRoot, depth, info) {
  return css.replace(IMPORT_RE, (whole, _q, href, media) => {
    const target = treeRel(href, cssUrl);
    const bytes = target?.rel ? readTreeFile(wptRoot, target.rel) : null;
    if (!bytes || depth >= 3) {
      info.missingResources.push(target?.url ?? href);
      return whole;
    }
    info.inlinedImports++;
    if (media.trim()) info.notes.push(`@import media "${media.trim()}" ignored when inlining`);
    const text = Buffer.from(bytes).toString("utf8");
    info.cssSources.push({ url: target.url, text });
    return inlineImports(text, target.url, wptRoot, depth + 1, info);
  });
}

const FONT_FACE_RE = /@font-face\s*{([^}]*)}/gi;
const CSS_URL_RE = /url\(\s*(["']?)([^"')]*)\1\s*\)/gi;

/** Non-data: url() references in CSS text, ignoring @font-face blocks and comments. */
export function cssUrlResources(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(FONT_FACE_RE, "");
  const out = [];
  for (const m of text.matchAll(CSS_URL_RE)) {
    const href = m[2].trim();
    if (href && !/^data:/i.test(href)) out.push(href);
  }
  return out;
}

const coverageCache = new WeakMap();
function coverageOf(bytes) {
  let c = coverageCache.get(bytes);
  if (!c) {
    c = readCoverage(bytes);
    coverageCache.set(bytes, c);
  }
  return c;
}

/** Union of the cmap coverage of every TTF/OTF file in `dir` (vellora's bundled faces). */
export function directoryCoverage(dir, readDir, readFile) {
  const all = new Set();
  for (const f of readDir(dir)
    .filter((n) => /\.(ttf|otf|ttc)$/i.test(n))
    .sort()) {
    for (const cp of readCoverage(new Uint8Array(readFile(join(dir, f))))) all.add(cp);
  }
  return all;
}

const NAMED_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };
const IGNORABLE_RE = /[\p{White_Space}\p{Cc}\p{Default_Ignorable_Code_Point}]/u;

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === "#") {
      const cp =
        body[1] === "x" || body[1] === "X"
          ? Number.parseInt(body.slice(2), 16)
          : Number(body.slice(1));
      return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : whole;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

function decodeCssString(s) {
  return s.replace(/\\([0-9a-f]{1,6})\s?|\\(.)/gi, (_w, hex, ch) => {
    if (hex) {
      const cp = Number.parseInt(hex, 16);
      return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : "";
    }
    return ch;
  });
}

/**
 * Distinct, sorted codepoints of the text a document can paint: character data outside <head>,
 * <script>, <style>, <title> and comments (entities decoded), plus quoted strings of CSS
 * `content:` declarations. White space, controls and default-ignorable codepoints are excluded:
 * they need no glyph.
 */
export function textCodepoints(html, cssSources = []) {
  let body = html.replace(/<!--[\s\S]*?-->/g, "");
  body = body.replace(/<(script|style|title|head)\b[\s\S]*?<\/\1\s*>/gi, "");
  body = decodeEntities(body.replace(/<[^>]*>/g, ""));
  const chars = new Set();
  const add = (text) => {
    for (const ch of text) if (!IGNORABLE_RE.test(ch)) chars.add(ch.codePointAt(0));
  };
  add(body);
  for (const src of cssSources) {
    for (const decl of src.text.matchAll(/(?:^|[;{\s])content\s*:\s*([^;}]*)/gi)) {
      for (const str of decl[1].matchAll(/"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g)) {
        add(decodeCssString(str[1] ?? str[2] ?? ""));
      }
    }
  }
  return [...chars].sort((a, b) => a - b);
}

function collectFontFaces(css, cssUrl) {
  const faces = [];
  for (const m of css.matchAll(FONT_FACE_RE)) {
    const body = m[1];
    const fam = /font-family\s*:\s*(?:"([^"]+)"|'([^']+)'|([^;]+))/i.exec(body);
    const declared = fam ? (fam[1] ?? fam[2] ?? fam[3]).trim() : null;
    const srcs = [...body.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi)].map((u) => u[2]);
    faces.push({ declared, srcs, base: cssUrl });
  }
  return faces;
}

/**
 * Prepare one node. `mode` is "screen" | "print".
 * Returns { html, fonts, images, baseUrl, info }.
 */
export function prepareNode({
  wptRoot,
  rel,
  url,
  content,
  mode,
  inlineCss = true,
  baseCoverage = null,
}) {
  const info = {
    pageInjection: null,
    styleInsertion: null,
    inlinedStylesheets: 0,
    inlinedImports: 0,
    missingResources: [],
    fonts: [],
    fontAliasMismatch: [],
    skippedFonts: [],
    images: 0,
    imgWithoutDimAttrs: 0,
    templateSyntax: /\{\{|\{%/.test(content),
    xmlSyntax: /\.(xht|xhtml|xml|svg)$/i.test(rel),
    xhtmlHazards: xhtmlHazards(rel, content),
    notes: [],
    cssSources: [],
    uncoveredCodepoints: 0,
    uncoveredSample: null,
    glyphCoverage: baseCoverage ? "checked" : "not-checked",
    cssUrlResources: 0,
    cssUrlSample: null,
  };
  let html = content;

  // 1. Inline linked stylesheets (replace each <link rel=stylesheet> in place).
  if (inlineCss) {
    const links = findTags(html, "link").filter(({ tag }) => {
      const a = parseAttributes(tag);
      const rels = (a.rel ?? "").toLowerCase().split(/\s+/);
      return rels.includes("stylesheet") && !rels.includes("alternate") && a.href;
    });
    for (const { index, tag } of links.reverse()) {
      const a = parseAttributes(tag);
      const target = treeRel(a.href, url);
      const bytes = target?.rel ? readTreeFile(wptRoot, target.rel) : null;
      if (!bytes) {
        info.missingResources.push(target?.url ?? a.href);
        continue;
      }
      let css = Buffer.from(bytes).toString("utf8");
      info.cssSources.push({ url: target.url, text: css });
      css = inlineImports(css, target.url, wptRoot, 1, info);
      const media = a.media ? ` media="${a.media.replace(/"/g, "&quot;")}"` : "";
      html = `${html.slice(0, index)}<style${media}>${css}</style>${html.slice(index + tag.length)}`;
      info.inlinedStylesheets++;
    }
  }

  // Collect every inline <style> block too, for @font-face discovery (an @import inside an inline
  // <style> is NOT inlined; vellora never fetches it).
  for (const block of styleBlocks(html)) {
    info.cssSources.push({ url, text: block.text });
  }

  // 2. Fonts: Ahem always, then @font-face TTF/OTF sources (dedup by file).
  const fonts = [];
  const fontFiles = new Set();
  const addFont = (fontRel, declared) => {
    if (fontFiles.has(fontRel)) return;
    const bytes = readTreeFile(wptRoot, fontRel);
    if (!bytes) {
      info.missingResources.push(fontRel);
      return;
    }
    const fmt = fontFormat(bytes);
    if (fmt === "woff" || fmt === "woff2" || fmt === "unknown") {
      info.skippedFonts.push({ file: fontRel, format: fmt, declared });
      return;
    }
    fontFiles.add(fontRel);
    fonts.push(bytes);
    const names = readFamilyNames(bytes);
    info.fonts.push({ file: fontRel, ...names });
    const intrinsic = [names.family, names.typographicFamily].filter(Boolean);
    if (declared && !intrinsic.some((n) => n.toLowerCase() === declared.toLowerCase())) {
      info.fontAliasMismatch.push({ declared, intrinsic: names.family, file: fontRel });
    }
  };
  addFont("fonts/Ahem.ttf", null);
  for (const src of info.cssSources) {
    for (const face of collectFontFaces(src.text, src.url)) {
      const candidates = face.srcs
        .map((s) => treeRel(s, face.base))
        .filter((t) => t?.rel && /\.(ttf|otf|ttc|woff2?)$/i.test(t.rel));
      const pick = candidates.find((t) => /\.(ttf|otf|ttc)$/i.test(t.rel)) ?? candidates[0];
      if (pick) addFont(pick.rel, face.declared);
      else if (face.srcs.length)
        info.skippedFonts.push({ srcs: face.srcs, declared: face.declared });
    }
  }
  // 5a. CSS url() resources other than @font-face sources (never loaded by vellora).
  const cssUrls = new Set();
  for (const src of info.cssSources) {
    for (const u of cssUrlResources(src.text)) cssUrls.add(u);
  }
  for (const m of html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    for (const u of cssUrlResources(decodeEntities(m[1] ?? m[2]))) cssUrls.add(u);
  }
  info.cssUrlResources = cssUrls.size;
  if (cssUrls.size) info.cssUrlSample = [...cssUrls].slice(0, 3).join(" ");
  // 5b. Glyph coverage of the visible text (+ CSS `content` strings) by every available face.
  if (baseCoverage) {
    const extra = fonts.map((bytes) => coverageOf(bytes));
    const uncovered = [];
    for (const cp of textCodepoints(html, info.cssSources)) {
      if (baseCoverage.has(cp) || extra.some((c) => c.has(cp))) continue;
      uncovered.push(cp);
    }
    info.uncoveredCodepoints = uncovered.length;
    if (uncovered.length) {
      info.uncoveredSample = uncovered
        .slice(0, 8)
        .map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`)
        .join(" ");
    }
  }
  info.cssSources = info.cssSources.map((s) => s.url);

  // 3. Images referenced by <img src>.
  const images = {};
  for (const { tag } of findTags(html, "img")) {
    const a = parseAttributes(tag);
    if (!("width" in a) && !("height" in a)) info.imgWithoutDimAttrs++;
    if (!a.src || a.src.trim().startsWith("data:")) continue;
    const target = treeRel(a.src, url);
    const bytes = target?.rel ? readTreeFile(wptRoot, target.rel) : null;
    if (!bytes) {
      info.missingResources.push(target?.url ?? a.src);
      continue;
    }
    // Key exactly as vellora-core joins: WHATWG join of the raw src against baseUrl.
    images[new URL(a.src.trim(), url).href] = bytes;
    info.images++;
  }

  // 4. UA page box: a universal @page rule in the FIRST cascade layer, before every author
  // style, so every author @page rule (layered or not; cascaded by vellora-core) overrides it.
  const pageCss = mode === "print" ? PRINT_PAGE_CSS : SCREEN_PAGE_CSS;
  const point = styleInsertionPoint(html);
  const authorPage = firstAtPageBodyOffset(html);
  html = `${html.slice(0, point.offset)}<style>${uaPageRule(pageCss)}</style>${html.slice(point.offset)}`;
  info.pageInjection = "new-style-block";
  info.styleInsertion = point.where;
  if (authorPage !== -1 && authorPage <= point.offset) {
    info.authorPageBeforeUaPage = true;
    info.notes.push(
      "an author @page precedes the injected UA page box, so the injected box overrides it",
    );
  }

  return { html, fonts, images, baseUrl: url, info };
}
