import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateReftest, isDeclaredBlankReference } from "../lib/refgraph.mjs";

const O = "http://web-platform.test:8000/t/";

function page(v) {
  return { width: 2, height: 2, data: new Uint8Array(12).fill(v) };
}

/** Build a node graph: spec = { name: { pages: [v...], refs: [[name, "=="|"!="]], fuzzy?, status? } } */
function graph(spec) {
  const nodes = {};
  for (const [name, s] of Object.entries(spec)) {
    nodes[O + name] = s.status
      ? { status: s.status, url: O + name, feature: s.feature }
      : {
          status: "ok",
          url: O + name,
          pages: s.pages.map(page),
          pageCount: s.pages.length,
          references: (s.refs ?? []).map(([r, relation]) => ({ url: O + r, relation })),
          fuzzy: s.fuzzy ?? [],
        };
  }
  const loads = [];
  const load = async (url) => {
    loads.push(url);
    return nodes[url] ?? { status: "skip", reason: "missing-file", url };
  };
  return { root: nodes[`${O}test`], load, loads };
}

const run = (g, mode = "screen", chainReferences = false) =>
  evaluateReftest(g.root, g.load, { mode, pageRanges: {}, chainReferences });

test("single match: equal passes, different fails", async () => {
  assert.equal(
    (await run(graph({ test: { pages: [1], refs: [["r", "=="]] }, r: { pages: [1] } }))).verdict,
    "pass",
  );
  assert.equal(
    (await run(graph({ test: { pages: [1], refs: [["r", "=="]] }, r: { pages: [2] } }))).verdict,
    "fail",
  );
});

test("multiple references: any match AND all mismatches (WPT docs)", async () => {
  const anyMatch = graph({
    test: {
      pages: [1],
      refs: [
        ["a", "=="],
        ["b", "=="],
      ],
    },
    a: { pages: [9] },
    b: { pages: [1] },
  });
  assert.equal((await run(anyMatch)).verdict, "pass");
  const mismatchSame = graph({
    test: {
      pages: [1],
      refs: [
        ["a", "=="],
        ["m", "!="],
      ],
    },
    a: { pages: [1] },
    m: { pages: [1] },
  });
  assert.equal((await run(mismatchSame)).verdict, "fail");
  const mismatchDiffers = graph({ test: { pages: [1], refs: [["m", "!="]] }, m: { pages: [7] } });
  assert.equal((await run(mismatchDiffers)).verdict, "pass");
});

test("a reference's own links are NOT followed by default (wptrunner from_manifest at the pin)", async () => {
  // Regression for the validator finding of 2026-10-21: 50 tests failed only through a chained
  // reference although test == ref passed; wptrunner never follows a reference's own links.
  const chainBroken = graph({
    test: { pages: [1], refs: [["r1", "=="]] },
    r1: { pages: [1], refs: [["r2", "=="]] },
    r2: { pages: [5] },
  });
  const plain = await run(chainBroken);
  assert.equal(plain.verdict, "pass");
  assert.equal(plain.via, `${O}r1`);
  assert.equal(plain.comparisons.length, 1, "r1's own reference is never loaded or compared");
  assert.equal(chainBroken.loads.includes(`${O}r2`), false);
});

test("--chain-references opts into following a reference's links (cycle-safe)", async () => {
  const chainOk = graph({
    test: { pages: [1], refs: [["r1", "=="]] },
    r1: { pages: [1], refs: [["r2", "=="]] },
    r2: { pages: [1] },
  });
  const ok = await run(chainOk, "screen", true);
  assert.equal(ok.verdict, "pass");
  assert.equal(ok.via, `${O}r2`);
  const chainBroken = graph({
    test: { pages: [1], refs: [["r1", "=="]] },
    r1: { pages: [1], refs: [["r2", "=="]] },
    r2: { pages: [5] },
  });
  assert.equal((await run(chainBroken, "screen", true)).verdict, "fail");
  const cycle = graph({
    test: { pages: [1], refs: [["r1", "=="]] },
    r1: { pages: [1], refs: [["test", "=="]] },
  });
  assert.equal((await run(cycle, "screen", true)).verdict, "pass");
});

test("declared-blank references are recognised by URL", () => {
  assert.equal(isDeclaredBlankReference("about:blank"), true);
  assert.equal(isDeclaredBlankReference("http://web-platform.test:8000/common/blank.html"), true);
  assert.equal(
    isDeclaredBlankReference("http://web-platform.test:8000/css/reference/blank.html"),
    true,
  );
  assert.equal(
    isDeclaredBlankReference(
      "http://web-platform.test:8000/css/css-page/reference/blank-print-ref.html",
    ),
    true,
  );
  assert.equal(
    isDeclaredBlankReference("http://web-platform.test:8000/css/CSS2/text/x-ref.xht"),
    false,
  );
  assert.equal(isDeclaredBlankReference(null), false);
});

test("a non-evaluable reference yields its outcome, never a claimed failure", async () => {
  const g = graph({
    test: {
      pages: [1],
      refs: [
        ["a", "=="],
        ["u", "=="],
      ],
    },
    a: { pages: [2] },
    u: { status: "unsupported", feature: "element:script" },
  });
  const r = await run(g);
  assert.equal(r.verdict, "cannot");
  assert.equal(r.cause.status, "unsupported");
  const missing = await run(graph({ test: { pages: [1], refs: [["gone", "=="]] } }));
  assert.equal(missing.cause.reason, "missing-file");
});

test("print mode compares every page; a page-count mismatch fails ==", async () => {
  const same = graph({ test: { pages: [1, 2], refs: [["r", "=="]] }, r: { pages: [1, 2] } });
  assert.equal((await run(same, "print")).verdict, "pass");
  const diffPage2 = graph({ test: { pages: [1, 2], refs: [["r", "=="]] }, r: { pages: [1, 3] } });
  const res = await run(diffPage2, "print");
  assert.equal(res.verdict, "fail");
  assert.equal(res.comparisons[0].firstDiffPage, 2);
  const count = graph({ test: { pages: [1, 2], refs: [["r", "=="]] }, r: { pages: [1] } });
  assert.equal((await run(count, "print")).comparisons[0].pageCountMismatch, true);
  // Screen mode only looks at page 1 (the viewport).
  assert.equal((await run(diffPage2, "screen")).verdict, "pass");
});

test("fuzzy comes from the left-hand node", async () => {
  const fuzzy = [{ key: null, maxDifference: [0, 1], totalPixels: [0, 4] }];
  const g = graph({ test: { pages: [100], refs: [["r", "=="]], fuzzy }, r: { pages: [101] } });
  assert.equal((await run(g)).verdict, "pass");
  const tooFar = graph({ test: { pages: [100], refs: [["r", "=="]], fuzzy }, r: { pages: [103] } });
  assert.equal((await run(tooFar)).verdict, "fail");
});
