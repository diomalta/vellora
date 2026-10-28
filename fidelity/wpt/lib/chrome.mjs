import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
// Optional Chrome print oracle: renders the same reftests (test AND references) through Chrome's
// print-to-PDF with the same page geometry, rasterizes with the same pdftoppm settings and applies
// the same comparator, so "Chrome fails too" can be told apart from vellora-only failures.
//
// Geometry: screen reftests print on an 800x600 CSS px sheet with zero margins (media emulated as
// `screen`); print reftests on WPT's 5in x 3in sheet with 0.5in margins (WebDriver print defaults
// used by wptrunner's WebDriverPrintProtocolPart), honouring author @page size
// (preferCSSPageSize). Backgrounds are printed (wptrunner passes background=True).
//
// Ahem: WPT assumes Ahem is installed system-wide. The static server injects an
// `@font-face { font-family: Ahem; src: url(/fonts/Ahem.ttf) }` into served documents instead of
// installing a font on the host; vellora gets the same bytes through its `fonts` option.
//
// Local Chrome is INDICATIVE only; CI should pin a Chrome for Testing build (see README).
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { WPT_ORIGIN, urlToRel } from "./discover.mjs";
import { Lru, makeLoader } from "./loader.mjs";
import { styleInsertionPoint } from "./prepare.mjs";
import { runReftest } from "./run-test.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".xht": "application/xhtml+xml",
  ".xhtml": "application/xhtml+xml",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".css": "text/css",
  ".js": "text/javascript",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const MARKUP = new Set([".html", ".htm", ".xht", ".xhtml", ".xml"]);
const AHEM_FACE = "<style>@font-face { font-family: Ahem; src: url(/fonts/Ahem.ttf); }</style>";

/** Static file server over the WPT tree (127.0.0.1 only) with the Ahem @font-face injection. */
export function startServer(wptRoot) {
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = normalize(join(wptRoot, path));
    if (!file.startsWith(wptRoot)) {
      res.writeHead(403).end();
      return;
    }
    let body;
    try {
      if (!statSync(file).isFile()) throw new Error("not a file");
      body = readFileSync(file);
    } catch {
      res.writeHead(404).end();
      return;
    }
    const ext = extname(file).toLowerCase();
    if (MARKUP.has(ext)) {
      const text = body.toString("utf8");
      const at = styleInsertionPoint(text).offset;
      body = Buffer.from(`${text.slice(0, at)}${AHEM_FACE}${text.slice(at)}`, "utf8");
    }
    res.writeHead(200, {
      "content-type": TYPES[ext] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, origin: `http://127.0.0.1:${server.address().port}` }),
    );
  });
}

function withTimeout(promise, ms, what) {
  let t;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      t = setTimeout(() => reject({ status: "timeout", message: `${what} exceeded ${ms} ms` }), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

/** Wait like wptrunner's reftest-wait handling: fonts ready, no `reftest-wait` class, 2 frames. */
async function settle(page, budgetMs) {
  await page.evaluate(async (budget) => {
    const deadline = performance.now() + budget;
    if (document.fonts?.ready) await document.fonts.ready;
    const root = document.documentElement;
    while (root?.classList?.contains("reftest-wait") && performance.now() < deadline) {
      await new Promise((r) => setTimeout(r, 20));
    }
    // Two frames, but never wait forever: a page that is not the visible target gets no
    // requestAnimationFrame callbacks (observed: first page of each concurrent lane hung until
    // the test timeout). printToPDF forces its own layout, so the timer fallback is safe.
    await Promise.race([
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      new Promise((r) => setTimeout(r, 100)),
    ]);
  }, budgetMs);
}

export async function runChromeOracle({
  chromePath,
  wptRoot,
  tests,
  jobs = 6,
  antialias = true,
  rasterizer = "pdftocairo",
  timeoutMs = 30000,
  artifactsDir = null,
  artifacts = "fail",
  keepPdf = false,
  chainReferences = false,
  onProgress,
}) {
  const { default: puppeteer } = await import("puppeteer-core");
  const { server, origin } = await startServer(wptRoot);
  const userDataDir = mkdtempSync(join(tmpdir(), "vellora-wpt-chrome-"));
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    userDataDir,
    args: [
      "--font-render-hinting=none",
      "--disable-lcd-text",
      "--force-color-profile=srgb",
      "--hide-scrollbars",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
    ],
  });
  const browserVersion = await browser.version();
  const counts = {};
  let next = 0;
  let done = 0;

  const toServed = (url) => {
    if (url.startsWith("about:")) return "about:blank";
    const rel = urlToRel(url);
    return rel === null ? url : `${origin}/${rel}`;
  };

  async function lane() {
    let page = await browser.newPage();
    const caches = { screen: new Lru(48), print: new Lru(48) };
    while (next < tests.length) {
      const t = tests[next++];
      const mode = t.mode;
      const render = async ({ url }) => {
        await page.emulateMediaType(mode === "screen" ? "screen" : "print");
        await page.setViewport(
          mode === "screen" ? { width: 800, height: 600 } : { width: 480, height: 288 },
        );
        try {
          await withTimeout(
            page.goto(toServed(url), { waitUntil: "load", timeout: timeoutMs }),
            timeoutMs,
            "load",
          );
          await withTimeout(settle(page, 5000), timeoutMs, "settle");
          const pdf = await withTimeout(
            page.pdf(
              mode === "screen"
                ? {
                    width: "800px",
                    height: "600px",
                    margin: { top: 0, right: 0, bottom: 0, left: 0 },
                    printBackground: true,
                    preferCSSPageSize: false,
                  }
                : {
                    width: "5in",
                    height: "3in",
                    margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
                    printBackground: true,
                    preferCSSPageSize: true,
                  },
            ),
            timeoutMs,
            "printToPDF",
          );
          return { pdf: new Uint8Array(pdf) };
        } catch (e) {
          if (e?.status) throw e;
          throw { status: "error", kind: "chrome", message: String(e?.message ?? e) };
        }
      };
      const loadNode = makeLoader({
        wptRoot,
        mode,
        render,
        cache: caches[mode],
        antialias,
        rasterizer,
      });
      let r;
      try {
        r = await runReftest({
          test: { rel: t.test, url: `${WPT_ORIGIN}/${t.test}`, mode },
          loadNode,
          artifactsDir,
          artifacts,
          keepPdf,
          chainReferences,
        });
      } catch (e) {
        r = {
          outcome: "error",
          cause: { status: "error", kind: "harness", message: String(e?.stack ?? e) },
        };
      }
      if (r.outcome === "timeout" || r.cause?.kind === "chrome") {
        await page.close().catch(() => {});
        page = await browser.newPage();
      }
      t.chrome = {
        outcome: r.outcome,
        ...(r.node ? { node: r.node } : {}),
        ...(r.cause ? { cause: r.cause } : {}),
        ...(r.blank ? { blank: true } : {}),
        ...(r.ink ? { ink: r.ink } : {}),
        comparisons: r.comparisons,
      };
      counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;
      done++;
      onProgress?.(done, tests.length, counts);
    }
    await page.close().catch(() => {});
  }

  try {
    await Promise.all(
      Array.from({ length: Math.max(1, Math.min(jobs, tests.length)) }, () => lane()),
    );
  } finally {
    await browser.close().catch(() => {});
    server.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
  return { browserVersion, counts, served: origin };
}
