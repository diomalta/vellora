// Node loader shared by the vellora worker and the Chrome oracle: read a WPT file, parse its
// reftest metadata, render it with an engine-specific `render` function, rasterize, and cache.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decodeUtf8, urlToRel } from "./discover.mjs";
import { parseFuzzy, parsePageRanges, parseReferences, parseTimeout } from "./html-meta.mjs";
import { pdfinfoPages, rasterize } from "./raster.mjs";

const MAX_PRINT_PAGES = 50;

/** Small LRU keyed by string. */
export class Lru {
  constructor(limit) {
    this.limit = limit;
    this.map = new Map();
  }
  get(k) {
    const v = this.map.get(k);
    if (v !== undefined) {
      this.map.delete(k);
      this.map.set(k, v);
    }
    return v;
  }
  set(k, v) {
    this.map.delete(k);
    this.map.set(k, v);
    while (this.map.size > this.limit) this.map.delete(this.map.keys().next().value);
  }
}

/** Read a node's source. about:blank is an empty document (WPT allows it as a reference). */
export function readNodeSource(wptRoot, url) {
  if (url.startsWith("about:blank")) return { rel: null, content: "" };
  const rel = urlToRel(url);
  if (rel === null) return { error: { status: "skip", reason: "reference-outside-wpt-tree", url } };
  let buf;
  try {
    buf = readFileSync(join(wptRoot, rel));
  } catch {
    return { error: { status: "skip", reason: "missing-file", url } };
  }
  const content = decodeUtf8(buf);
  if (content === null) return { error: { status: "skip", reason: "non-utf8", url } };
  return { rel, content };
}

/**
 * Build `loadNode(url)` for one test run.
 *   render({ url, rel, content, mode }) → Promise<{ pdf, info? }>, throwing an object with a
 *   `status` field ("unsupported" | "error") for engine rejections.
 */
export function makeLoader({
  wptRoot,
  mode,
  render,
  cache,
  antialias = true,
  rasterizer = "pdftocairo",
  onNode,
}) {
  return async function loadNode(url) {
    const key = `${mode}|${url}`;
    const hit = cache?.get(key);
    if (hit) return hit;
    const src = readNodeSource(wptRoot, url);
    if (src.error) return src.error;
    let references;
    let fuzzy;
    let pageRanges;
    try {
      references = parseReferences(src.content, url);
      fuzzy = parseFuzzy(src.content, url, references);
      pageRanges = parsePageRanges(src.content, url, references);
    } catch (e) {
      return { status: "error", kind: "metadata", url, message: String(e.message ?? e) };
    }
    const t0 = performance.now();
    let rendered;
    try {
      rendered = await render({ url, rel: src.rel, content: src.content, mode });
    } catch (e) {
      if (e && typeof e === "object" && "status" in e) return { url, ...e };
      return { status: "error", kind: "harness", url, message: String(e?.stack ?? e) };
    }
    const renderMs = performance.now() - t0;
    let pages;
    let pageCount;
    const t1 = performance.now();
    try {
      if (mode === "screen") {
        pages = await rasterize(rendered.pdf, { rasterizer, antialias, maxPages: 1 });
        pageCount = null;
      } else {
        pages = await rasterize(rendered.pdf, { rasterizer, antialias, maxPages: MAX_PRINT_PAGES });
        pageCount =
          pages.length < MAX_PRINT_PAGES ? pages.length : await pdfinfoPages(rendered.pdf);
      }
    } catch (e) {
      return { status: "error", kind: "raster", url, message: String(e?.message ?? e) };
    }
    if (pages.length === 0) {
      return { status: "error", kind: "raster", url, message: "rasterizer produced no pages" };
    }
    const node = {
      status: "ok",
      url,
      rel: src.rel,
      pages,
      pageCount,
      references,
      fuzzy,
      pageRanges,
      timeout: parseTimeout(src.content),
      info: rendered.info ?? null,
      pdf: rendered.pdf,
      renderMs,
      rasterMs: performance.now() - t1,
    };
    onNode?.(node);
    cache?.set(key, node);
    return node;
  };
}
