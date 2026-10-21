// Regression tests for the validator's major finding (2026-10-21): a reftest whose test and
// reference both render nothing must not be counted as a pass. Injected defect (a') — a passing
// test with its reference swapped for an unrelated one — "passed" because vellora rendered both
// blank. Synthetic loader: no addon or rasterizer needed.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runReftest } from "../lib/run-test.mjs";

const O = "http://web-platform.test:8000/t/";

function img(fill, width = 4, height = 3) {
  return { width, height, data: new Uint8Array(width * height * 3).fill(fill) };
}

/** spec = { url: { pages: [fill...], refs: [[url, relation]] } } */
function loader(spec) {
  return async (url) => {
    const s = spec[url];
    if (!s) return { status: "skip", reason: "missing-file", url };
    return {
      status: "ok",
      url,
      pages: s.pages.map((f) => img(f)),
      pageCount: null,
      references: (s.refs ?? []).map(([u, relation]) => ({ url: u, relation })),
      fuzzy: [],
      pageRanges: {},
      info: null,
    };
  };
}

const run = (spec, extra = {}) =>
  runReftest({
    test: { rel: "t/test.html", url: `${O}test.html`, mode: "screen" },
    loadNode: loader(spec),
    ...extra,
  });

test("blank test == blank (non-empty-by-construction) reference is pass-blank, not pass", async () => {
  const r = await run({
    [`${O}test.html`]: { pages: [255], refs: [[`${O}unrelated-ref.html`, "=="]] },
    [`${O}unrelated-ref.html`]: { pages: [255] },
  });
  assert.equal(r.outcome, "pass-blank");
  assert.notEqual(r.outcome, "pass");
  assert.equal(r.blank, true);
  assert.equal(r.comparisons[0].pass, true, "the WPT comparison itself still holds");
});

test("a blank test matching an empty-by-construction reference is a real pass", async () => {
  for (const ref of ["about:blank", "http://web-platform.test:8000/common/blank.html"]) {
    const r = await run({
      [`${O}test.html`]: { pages: [255], refs: [[ref, "=="]] },
      [ref]: { pages: [255] },
    });
    assert.equal(r.outcome, "pass", ref);
    assert.equal(r.blank, true);
  }
});

test("a mismatch-only pass with a blank test rendering is pass-blank", async () => {
  const r = await run({
    [`${O}test.html`]: { pages: [255], refs: [[`${O}m.html`, "!="]] },
    [`${O}m.html`]: { pages: [0] },
  });
  assert.equal(r.outcome, "pass-blank");
});

test("a non-blank equal pair is a plain pass and carries an ink signature", async () => {
  const r = await run({
    [`${O}test.html`]: { pages: [0], refs: [[`${O}ref.html`, "=="]] },
    [`${O}ref.html`]: { pages: [0] },
  });
  assert.equal(r.outcome, "pass");
  assert.equal(r.blank, undefined);
  assert.equal(r.ink.px, 12);
  assert.deepEqual(r.ink.bbox, [0, 0, 3, 2]);
  const blank = await run({
    [`${O}test.html`]: { pages: [255], refs: [[`${O}r.html`, "=="]] },
    [`${O}r.html`]: { pages: [128] },
  });
  assert.equal(blank.outcome, "fail", "a blank test that differs from its reference still fails");
});

test("--artifacts all writes page rasters for passing tests too", async () => {
  const dir = mkdtempSync(join(tmpdir(), "wpt-art-"));
  try {
    const spec = {
      [`${O}test.html`]: { pages: [0], refs: [[`${O}ref.html`, "=="]] },
      [`${O}ref.html`]: { pages: [0] },
    };
    const none = await run(spec, { artifactsDir: dir, artifacts: "fail" });
    assert.equal(none.artifacts, undefined, "default mode writes nothing for a pass");
    const r = await run(spec, { artifactsDir: dir, artifacts: "all" });
    assert.equal(r.outcome, "pass");
    assert.equal(r.artifacts, "artifacts/t/test.html");
    const files = readdirSync(join(dir, "t", "test.html")).sort();
    assert.deepEqual(files, ["comparison.json", "diff-p1.png", "lhs-p1.png", "rhs-p1.png"]);
    assert.ok(existsSync(join(dir, "t", "test.html", "lhs-p1.png")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
