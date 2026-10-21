// Chromium reference layout: ONE continuous flow (no fragmentation) at the same viewport width
// vellora hands Blitz, captured with CDP DOMSnapshot.captureSnapshot. Comparable only to vellora's
// PRE-pagination layers (B0/L0/pass layers), never to paginated PDF geometry.
import { existsSync } from "node:fs";

export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const CHROME_ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"];

export function resolveChrome(explicit) {
  const path = explicit ?? process.env.VELLORA_FIDELITY_CHROME ?? DEFAULT_CHROME;
  if (!existsSync(path)) {
    throw new Error(
      `Chrome not found at ${path}. Pass --chrome <path> or set VELLORA_FIDELITY_CHROME (CI: install a pinned Chrome for Testing with @puppeteer/browsers, see README).`,
    );
  }
  return path;
}

export async function launchChrome(executablePath) {
  const { default: puppeteer } = await import("puppeteer-core");
  return puppeteer.launch({ executablePath, headless: true, args: CHROME_ARGS });
}

/**
 * Lay `html` out in Chrome at `width` x `height` CSS px (deviceScaleFactor 1, print media, hidden
 * scrollbars, bundled fonts awaited) and return the raw DOMSnapshot plus parity probes.
 */
export async function captureSnapshot(browser, html, { width, height }) {
  const page = await browser.newPage();
  try {
    const cdp = await page.createCDPSession();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await cdp.send("Emulation.setScrollbarsHidden", { hidden: true });
    await page.emulateMediaType("print");
    await page.setContent(html, { waitUntil: "load" });
    // Data-URL @font-face faces load lazily on first use; wait so layout uses the bundled faces.
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const probes = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      printMedia: window.matchMedia("print").matches,
      fonts: [...document.fonts]
        .filter((face) => face.status === "loaded")
        .map((face) => `${face.family} ${face.weight} ${face.style}`),
    }));
    const snapshot = await cdp.send("DOMSnapshot.captureSnapshot", {
      computedStyles: ["display", "position"],
      includeDOMRects: true,
    });
    const userAgent = await browser.userAgent();
    return { snapshot, probes, userAgent };
  } finally {
    await page.close();
  }
}

/**
 * Measure Chrome's text-box-top -> baseline offset per (family, weight, size): one probe line per
 * spec, holding the text and an empty zero-size inline-block whose bottom edge sits ON the
 * baseline (CSS 2.2 §10.8.1: an inline-block without in-flow line boxes has its baseline at its
 * bottom margin edge). Lets the matcher compare vellora baselines with Chrome baselines instead
 * of assuming both engines round ascent/descent the same way. Returns key -> {ascent, descent}.
 */
export async function measureBaselines(browser, fontFaceCss, specs) {
  const out = new Map();
  if (specs.length === 0) return out;
  const rows = specs
    .map(
      (s, i) =>
        `<div id="p${i}" style="font-family:'${s.family}';font-weight:${s.weight};font-size:${s.size}px">Hxg<span style="display:inline-block;width:0;height:0"></span></div>`,
    )
    .join("\n");
  const html = `<!DOCTYPE html><html><head><style>${fontFaceCss}
body{margin:0} div{white-space:nowrap;line-height:normal}</style></head><body>${rows}</body></html>`;
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const cdp = await page.createCDPSession();
    const snapshot = await cdp.send("DOMSnapshot.captureSnapshot", { computedStyles: [] });
    const records = normalizeSnapshot(snapshot);
    specs.forEach((s, i) => {
      const path = `html>body:nth-child(2)>div:nth-child(${i + 1})`;
      const text = records.find((r) => r.path === `${path}>#text` && r.fragments.length);
      const marker = records.find((r) => r.path === `${path}>span:nth-child(1)`);
      if (!text || !marker?.box) return;
      const frag = text.fragments[0];
      const baseline = marker.box.y + marker.box.h;
      out.set(baselineKey(s), { ascent: baseline - frag.y, descent: frag.y + frag.h - baseline });
    });
    return out;
  } finally {
    await page.close();
  }
}

export function baselineKey({ family, weight, size }) {
  return `${family}|${weight}|${Math.round(size * 1000) / 1000}`;
}

/**
 * Normalize a DOMSnapshot into a path-keyed tree using the SAME key scheme as the vellora dump
 * (vellora_core::blitz_engine::DumpNode::dom_path): `html`, then `tag:nth-child(k)` counting element
 * siblings only; pseudo-elements become `::<type>` segments and do not count; text nodes `#text`.
 */
export function normalizeSnapshot(snapshot) {
  const { strings } = snapshot;
  const doc = snapshot.documents[0];
  const str = (i) => (i === undefined || i < 0 ? null : strings[i]);
  const nodes = doc.nodes;
  const count = nodes.parentIndex.length;

  const pseudoOf = new Map();
  if (nodes.pseudoType) {
    nodes.pseudoType.index.forEach((nodeIdx, i) => {
      pseudoOf.set(nodeIdx, str(nodes.pseudoType.value[i]));
    });
  }

  const children = Array.from({ length: count }, () => []);
  for (let i = 0; i < count; i += 1) {
    const parent = nodes.parentIndex[i];
    if (parent >= 0) children[parent].push(i);
  }

  const styleNames = ["display", "position"];
  const layoutOf = new Map();
  doc.layout.nodeIndex.forEach((nodeIdx, li) => {
    const entry = layoutOf.get(nodeIdx);
    if (entry) {
      entry.extra += 1;
      return;
    }
    const styles = {};
    (doc.layout.styles[li] ?? []).forEach((s, k) => {
      styles[styleNames[k]] = str(s);
    });
    const [x, y, w, h] = doc.layout.bounds[li];
    layoutOf.set(nodeIdx, { li, x, y, w, h, styles, text: str(doc.layout.text?.[li]), extra: 0 });
  });

  const fragmentsOf = new Map();
  doc.textBoxes.layoutIndex.forEach((li, t) => {
    const [x, y, w, h] = doc.textBoxes.bounds[t];
    const list = fragmentsOf.get(li) ?? [];
    list.push({ x, y, w, h, start: doc.textBoxes.start[t], length: doc.textBoxes.length[t] });
    fragmentsOf.set(li, list);
  });

  const out = [];
  const attr = (i, name) => {
    const a = nodes.attributes?.[i] ?? [];
    for (let k = 0; k + 1 < a.length; k += 2) {
      if (str(a[k]) === name) return str(a[k + 1]);
    }
    return null;
  };

  const visit = (i, path, parentOut) => {
    const nodeType = nodes.nodeType[i];
    const layout = layoutOf.get(i) ?? null;
    const record = {
      idx: i,
      path,
      parent: parentOut,
      kind: pseudoOf.has(i)
        ? "pseudo"
        : nodeType === 1
          ? "element"
          : nodeType === 3
            ? "text"
            : "other",
      tag: nodeType === 1 ? (str(nodes.nodeName[i]) ?? "").toLowerCase() : null,
      id_attr: nodeType === 1 ? attr(i, "id") : null,
      class: nodeType === 1 ? attr(i, "class") : null,
      box: layout ? { x: layout.x, y: layout.y, w: layout.w, h: layout.h } : null,
      display: layout?.styles.display ?? null,
      position: layout?.styles.position ?? null,
      layoutObjects: layout ? 1 + layout.extra : 0,
      text: null,
      fragments: [],
    };
    if (nodeType === 3 && layout) {
      const text = layout.text ?? str(nodes.nodeValue[i]) ?? "";
      record.text = text;
      record.fragments = (fragmentsOf.get(layout.li) ?? []).map((f) => ({
        ...f,
        text: text.slice(f.start, f.start + f.length),
      }));
    }
    const self = out.length;
    out.push(record);
    let k = 0;
    for (const c of children[i]) {
      const type = nodes.nodeType[c];
      if (pseudoOf.has(c)) {
        visit(c, `${path}>::${pseudoOf.get(c)}`, self);
      } else if (type === 1) {
        k += 1;
        const tag = (str(nodes.nodeName[c]) ?? "").toLowerCase();
        visit(c, path ? `${path}>${tag}:nth-child(${k})` : tag, self);
      } else if (type === 3) {
        visit(c, `${path}>#text`, self);
      }
    }
  };

  // Root: the Document node (nodeType 9); its element child is <html>.
  const root = nodes.nodeType.indexOf(9);
  let k = 0;
  for (const c of children[root]) {
    if (nodes.nodeType[c] === 1) {
      k += 1;
      const tag = (str(nodes.nodeName[c]) ?? "").toLowerCase();
      visit(c, k === 1 ? tag : `${tag}:nth-child(${k})`, null);
    }
  }
  return out;
}
