// pdf-probe v2 (lib/pdf-probe-v2.mjs): text keys, the bounded optimal assignment, Chrome keys,
// comparability. Synthetic inputs; the real-PDF chain is test/pdf-probe-canaries.test.mjs.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_PAIR_DISTANCE_PT,
  PDF_PROBE_SEMANTICS,
  assignMinCost,
  compactProbeV2,
  keyChromeWords,
  pairGroup,
  pairWords,
  pdfProbeComparability,
  probeResultV2,
  textKey,
} from "../lib/pdf-probe-v2.mjs";

const w = (page, text, x, y, size = 10) => ({ page, text, key: textKey(text), x, y, size });

test("textKey: NFC, ligatures expanded, case kept (v1's lowercasing paired 'Débito' with 'débito')", () => {
  assert.equal(textKey("Débito"), "Débito");
  assert.equal(textKey("ﬁnal"), "final");
  assert.notEqual(textKey("Débito"), textKey("débito"));
  assert.equal(textKey(" a b "), "ab");
});

test("assignMinCost finds the optimum of every small matrix (brute force, fixed seed)", () => {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
  const perms = (n, m) => {
    // all injective maps rows -> columns
    const out = [];
    const rec = (i, used, acc) => {
      if (i === n) return out.push([...acc]);
      for (let j = 0; j < m; j++) {
        if (used.has(j)) continue;
        used.add(j);
        acc.push(j);
        rec(i + 1, used, acc);
        acc.pop();
        used.delete(j);
      }
    };
    rec(0, new Set(), []);
    return out;
  };
  for (let t = 0; t < 60; t++) {
    const n = 1 + Math.floor(rnd() * 4);
    const m = n + Math.floor(rnd() * 3);
    const cost = Array.from({ length: n }, () => Array.from({ length: m }, () => rnd() * 50));
    const sum = (a) => a.reduce((s, j, i) => s + cost[i][j], 0);
    const best = Math.min(...perms(n, m).map(sum));
    const got = assignMinCost(cost);
    assert.equal(new Set(got).size, n);
    assert.ok(Math.abs(sum(got) - best) < 1e-9, `trial ${t}: ${sum(got)} vs ${best}`);
  }
});

test("a column of repeated tokens under a drift larger than half the row pitch keeps row order", () => {
  // The DANFE item rows at port step 07: Chrome pitch 11.2 pt, vellora 12 pt, first row +9.9 pt.
  // Greedy-nearest pairs row i with Chrome row i+1 (3-8 pt); the assignment keeps i -> i.
  const cs = Array.from({ length: 12 }, (_, i) => w(1, "000", 258.9, 538 + 11.2 * i));
  const vs = Array.from({ length: 12 }, (_, i) => w(1, "000", 261.9, 547.4 + 12 * i));
  const pairs = pairGroup(vs, cs, MAX_PAIR_DISTANCE_PT);
  assert.equal(pairs.length, 12);
  for (const [i, j] of pairs) assert.equal(i, j);
});

test("the bound: a word farther than maxDistancePt from every same-text Chrome word is unpaired", () => {
  const r = pairWords(
    [w(1, "Total", 10, 100)],
    [w(1, "Total", 10, 100 + MAX_PAIR_DISTANCE_PT + 1)],
  );
  assert.equal(r.pairs.length, 0);
  assert.equal(r.unpairedVellora.length, 1);
  assert.equal(r.unpairedChrome.length, 1);
  assert.equal(r.unpairedChrome[0].k, "p1|Total#1");
  const near = pairWords([w(1, "Total", 10, 120)], [w(1, "Total", 10, 100)]);
  assert.deepEqual([near.pairs[0].dx, near.pairs[0].dy], [0, 20]);
});

test("pairing is per page: a word on another page than Chrome's never pairs (GATE-P1 page moves)", () => {
  const r = pairWords([w(2, "Assinatura", 50, 700)], [w(1, "Assinatura", 50, 700)]);
  assert.equal(r.pairs.length, 0);
  assert.equal(r.unpairedVellora[0].page, 2);
  assert.equal(r.unpairedChrome[0].k, "p1|Assinatura#1");
});

test("maximum cardinality first: a deleted word leaves exactly its own Chrome word unpaired", () => {
  const cs = [10, 30, 50, 70].map((y) => w(1, "de", 40, y));
  const vs = [10, 30, 70].map((y) => w(1, "de", 41, y + 1)); // the 3rd "de" (y 50) is gone
  const r = pairWords(vs, cs);
  assert.equal(r.pairs.length, 3);
  assert.deepEqual(
    r.unpairedChrome.map((x) => [x.k, x.y]),
    [["p1|de#3", 50]],
  );
});

test("Chrome keys: rank among same-text words of the page by (baseline, x), independent of input order", () => {
  const cs = [w(1, "de", 300, 20), w(1, "de", 10, 20), w(1, "de", 10, 5), w(2, "de", 1, 1)];
  const k1 = keyChromeWords(cs);
  const k2 = keyChromeWords([...cs].reverse());
  assert.deepEqual(
    cs.map((x) => k1.get(x)),
    ["p1|de#3", "p1|de#2", "p1|de#1", "p2|de#1"],
  );
  assert.deepEqual(
    cs.map((x) => k2.get(x)),
    cs.map((x) => k1.get(x)),
  );
});

test("probe result and compact section carry semantics, settings, counts and both unpaired lists", () => {
  const vs = [w(1, "Olá", 10, 20), w(1, "extra", 10, 40)];
  const cs = [w(1, "Olá", 11, 19), w(1, "mundo", 10, 60)];
  const probe = probeResultV2({ velloraWords: vs, chromeWords: cs });
  assert.equal(probe.semantics, PDF_PROBE_SEMANTICS);
  assert.deepEqual(probe.words, {
    vellora: 2,
    chrome: 2,
    paired: 1,
    unpairedVellora: 1,
    unpairedChrome: 1,
  });
  const s = compactProbeV2(probe);
  assert.deepEqual(s.pairs, [{ k: "p1|Olá#1", text: "Olá", page: 1, dx: -1, dy: 1 }]);
  assert.deepEqual(
    s.unpairedChrome.map((x) => x.k),
    ["p1|mundo#1"],
  );
  assert.deepEqual(
    s.unpairedVellora.map((x) => x.text),
    ["extra"],
  );
  assert.match(s.reference.chromeWordsSha256, /^[0-9a-f]{64}$/);
});

test("comparability: v1 vs v2, different settings or different Chrome words are refused", () => {
  const cs = [w(1, "a", 1, 1)];
  const v2 = compactProbeV2(probeResultV2({ velloraWords: cs, chromeWords: cs }));
  const v1 = { pages: {}, words: {}, pairs: [] };
  assert.equal(pdfProbeComparability({ f: v2 }, { f: v2 }), null);
  assert.match(pdfProbeComparability({ f: v1 }, { f: v2 }), /semantics differ: baseline 1, run 2/);
  assert.match(pdfProbeComparability({ f: v1, g: v2 }, { f: v2 }), /mixed/);
  const other = { ...v2, settings: { ...v2.settings, maxDistancePt: 12 } };
  assert.match(pdfProbeComparability({ f: v2 }, { f: other }), /settings differ for f/);
  const moved = compactProbeV2(probeResultV2({ velloraWords: cs, chromeWords: [w(1, "a", 1, 2)] }));
  assert.match(pdfProbeComparability({ f: v2 }, { f: moved }), /Chrome reference words differ/);
  assert.equal(pdfProbeComparability(null, { f: v2 }), null);
});
