// Integration self-test over the REAL pipeline (built napi addon + poppler): the oracle must pass
// a correct pair and must catch a deliberately broken one (fidelity/README.md: an oracle is only
// trusted after it has been shown to catch a deliberately broken input). Skips — with the reason
// printed — when the addon or pdftocairo is unavailable; it never passes silently.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { WPT_ORIGIN } from "../lib/discover.mjs";
import { Lru, makeLoader } from "../lib/loader.mjs";
import { runReftest } from "../lib/run-test.mjs";
import { makeVelloraRender } from "../lib/vellora-render.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const addonBuilt = readdirSync(join(repo, "packages", "native")).some((f) => f.endsWith(".node"));
const cairo = spawnSync(process.env.PDFTOCAIRO ?? "pdftocairo", ["-v"]);
const skipReason = !addonBuilt
  ? "native addon not built (run `npm run build`)"
  : cairo.error
    ? "pdftocairo not found on PATH (install poppler)"
    : null;
const ahemSource = join(repo, "fidelity", ".cache", "wpt", "fonts", "Ahem.ttf");

const SQUARE_BG = `<!DOCTYPE html><html><head><link rel="match" href="ref.html"></head><body><div style="width:100px;height:100px;background:green"></div></body></html>`;
const SQUARE_BORDER = `<!DOCTYPE html><html><head></head><body><div style="width:0;height:0;border:50px solid green"></div></body></html>`;
const SQUARE_SHIFTED = `<!DOCTYPE html><html><head></head><body><div style="width:100px;height:100px;background:green;margin-left:1px"></div></body></html>`;

function makeTree(files) {
  const root = mkdtempSync(join(tmpdir(), "wpt-oracle-"));
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
  if (existsSync(ahemSource)) {
    mkdirSync(join(root, "fonts"), { recursive: true });
    copyFileSync(ahemSource, join(root, "fonts", "Ahem.ttf"));
  }
  return root;
}

async function runPair(files, mode = "screen", rel = "t/test.html") {
  const root = makeTree(files);
  try {
    const vellora = await import("vellora");
    const render = makeVelloraRender({ vellora, wptRoot: root });
    const loadNode = makeLoader({ wptRoot: root, mode, render, cache: new Lru(8) });
    const url = `${WPT_ORIGIN}/${rel}`;
    const r = await runReftest({ test: { rel, url, mode }, loadNode });
    // Cache hit: the rasterized test node, for geometry assertions.
    r.testNode = await loadNode(url);
    return r;
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test(
  "real pipeline: equivalent CSS boxes pass with zero difference (800x600 screen page)",
  { skip: skipReason ?? false },
  async () => {
    const r = await runPair({ "t/test.html": SQUARE_BG, "t/ref.html": SQUARE_BORDER });
    assert.equal(r.outcome, "pass", JSON.stringify(r));
    assert.equal(r.comparisons[0].totalPixels, 0);
    assert.deepEqual([r.testNode.pages[0].width, r.testNode.pages[0].height], [800, 600]);
  },
);

test(
  "real pipeline: a deliberately broken reference (1px shift) is caught",
  { skip: skipReason ?? false },
  async () => {
    const r = await runPair({ "t/test.html": SQUARE_BG, "t/ref.html": SQUARE_SHIFTED });
    assert.equal(r.outcome, "fail");
    assert.ok(r.comparisons[0].totalPixels >= 100, JSON.stringify(r.comparisons));
    assert.equal(r.comparisons[0].maxDifference, 255);
  },
);

test(
  "real pipeline: a mismatch reftest passes when renderings differ",
  { skip: skipReason ?? false },
  async () => {
    const mismatch = SQUARE_BG.replace('rel="match"', 'rel="mismatch"');
    const r = await runPair({ "t/test.html": mismatch, "t/ref.html": SQUARE_SHIFTED });
    assert.equal(r.outcome, "pass");
  },
);

test(
  "real pipeline: the strict gate is reported as unsupported with its feature",
  { skip: skipReason ?? false },
  async () => {
    const withScript = SQUARE_BG.replace("<body>", "<body><script>1</script>");
    const r = await runPair({ "t/test.html": withScript, "t/ref.html": SQUARE_BORDER });
    assert.equal(r.outcome, "unsupported");
    assert.equal(r.node, "test");
    assert.equal(r.cause.feature, "element:script");
  },
);

test(
  "real pipeline: print reftests get the 5in x 3in WPT page and compare every page",
  { skip: skipReason ?? false },
  async () => {
    const two = `<!DOCTYPE html><html><head><link rel="match" href="ref-print.html"></head><body><div style="height:20px;background:navy"></div><div style="break-before:page;height:20px;background:navy"></div></body></html>`;
    const one = `<!DOCTYPE html><html><head></head><body><div style="height:20px;background:navy"></div></body></html>`;
    const r = await runPair(
      { "t/test-print.html": two, "t/ref-print.html": one },
      "print",
      "t/test-print.html",
    );
    assert.equal(r.pageCount, 2);
    // 5in x 3in at 96 DPI.
    assert.deepEqual(
      r.testNode.pages.map((p) => [p.width, p.height]),
      [
        [480, 288],
        [480, 288],
      ],
    );
    assert.equal(r.outcome, "fail");
    assert.equal(r.comparisons[0].pageCountMismatch, true);
  },
);

test(
  "real pipeline: Ahem supplied through `fonts` is the face actually drawn",
  {
    skip:
      skipReason ?? (existsSync(ahemSource) ? false : "no WPT cache (run fetch-wpt.mjs) for Ahem"),
  },
  async () => {
    // Ahem's 'X' is a full 1em square; any fallback face would draw a letter, not a solid square.
    // Compare against a box of the same width and only assert the horizontal extent: vertical glyph
    // placement is engine behaviour under test, not harness behaviour (see README observations).
    const root = makeTree({});
    try {
      const vellora = await import("vellora");
      const render = makeVelloraRender({ vellora, wptRoot: root });
      const loadNode = makeLoader({ wptRoot: root, mode: "screen", render, cache: null });
      writeFileSync(
        join(root, "g.html"),
        "<!DOCTYPE html><html><head><style>div{font:100px/1 Ahem;color:rgb(0,128,0)}</style></head><body><div>X</div></body></html>",
      );
      const node = await loadNode(`${WPT_ORIGIN}/g.html`);
      assert.equal(node.status, "ok", JSON.stringify(node));
      assert.ok(node.info?.fonts === undefined, "only Ahem was supplied");
      const img = node.pages[0];
      let minx = Number.POSITIVE_INFINITY;
      let maxx = -1;
      let solid = 0;
      for (let i = 0; i < img.width * img.height; i++) {
        const [r, g, b] = [img.data[i * 3], img.data[i * 3 + 1], img.data[i * 3 + 2]];
        if (r === 0 && g === 128 && b === 0) {
          solid++;
          minx = Math.min(minx, i % img.width);
          maxx = Math.max(maxx, i % img.width);
        }
      }
      assert.equal(maxx - minx + 1, 100, "Ahem X is exactly 1em (100px) wide");
      assert.ok(solid >= 100 * 90, `solid square expected, got ${solid} px`);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  },
);
