// Layer vectors (gate/layer-vector.mjs) on committed data: the notification pack of the step-07 run
// (reproduces the committed 07 pdf-probe section exactly) and the receipt pack of the step-04 run
// (the run-level P-vs-final-pass numbers that correct the step-04 README claim). No Python needed;
// the run copies under ~/.cache/vellora-fidelity are used only when present.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { relaxedB } from "../debt.mjs";
import {
  PACK_DIR,
  anchorVector,
  boxVector,
  geometryFallback,
  lcsAlign,
  loadPack,
  packWordVectors,
  readDiff,
  relaxedBFacts,
  runLevelSummary,
  specAnchorVector,
  stepsOf,
} from "../layer-vector.mjs";

const notification = loadPack(join(PACK_DIR, "notification-07.layer-vector-pack.json.gz"));
const receipt = loadPack(join(PACK_DIR, "receipt-04.layer-vector-pack.json.gz"));
const w07 = packWordVectors(notification);

// The pack was built from the step-07 run (source.run names its run copy). Until the 2026-10-28
// prune a test also checked that its v2 probe equals port/07-media-print's committed section; that
// link was removed (local tag fidelity-archive-2026-10-28, b5c9546), so only the source is checked.
test("the notification pack names the step-07 run it was built from", () => {
  assert.equal(notification.source.fixture, "notification");
  assert.match(notification.source.run, /run-all-07-media-print-20261021T162148Z$/);
});

test("word mapping: 244 of 248 Chrome words mapped, both independent checks agree", () => {
  assert.deepEqual(
    [w07.mapping.chromeWords, w07.mapping.mapped, w07.mapping.pairsMapped],
    [248, 244, 244],
  );
  // (a) page-1 first tokens sit at one x offset (the 60 px left margin) and one baseline offset
  // per font size; (b) the PDF-level dy agrees with layout-diff's P dy of the mapped run.
  assert.equal(w07.mapping.xCheck.medianOffsetPx, 60);
  assert.equal(w07.mapping.xCheck.within3px, 1);
  assert.ok(w07.mapping.pAgreement.agreeWithinRunTolerance >= 0.95);
});

test("LET-1's worst anchor 'Gerente do Departamento de Cobrança' is raw Blitz in every layer (step 07)", () => {
  const g = [...w07.vectors.values()].find((x) => x.text === "Gerente");
  assert.deepEqual(g.dy.vector, {
    unit: "px",
    N0: 6.516,
    B0: 6.516,
    L0: 6.516,
    painted_table_cell_text_baselines: 6.516,
    table_percent_widths: 6.516,
    auto_table_compact_columns: 6.516,
    P: 6.516,
    run: 7.467,
  });
  // No vellora layer moves it; the PDF-level step (Chrome PDF vs Chrome DOM rounding) is within
  // the 1 pt run tolerance, so the relaxed (b) rule is possible with the owner Blitz.
  assert.deepEqual(g.dy.relaxedB.nonZeroVelloraSteps, []);
  assert.equal(g.dy.relaxedB.possible, true);
  const a = anchorVector(notification.diff, "Gerente do Departamento");
  assert.equal(a.owner, g.owner);
  assert.deepEqual(
    stepsOf(a.vector).map((s) => s.step),
    [0, 0, 0, 0, 0, 0],
  );
});

test("an entry built from a tool vector passes the ledger's relaxed (b) check iff the tool says possible", () => {
  for (const rec of [...w07.vectors.values()].filter((x) => x.mapped).slice(0, 60)) {
    const v = rec.dy.vector;
    const facts = relaxedBFacts(v);
    const entry = {
      id: rec.key,
      tolClass: "pdf-probe-pt",
      layerVector: v,
      compensators: facts.nonZeroVelloraSteps.map((s) => s.layer),
      owner: { layer: "blitz:x", component: "x" },
    };
    assert.equal(relaxedB(entry).length === 0, facts.possible, rec.key);
  }
});

test("step 04 receipt: P moves the y of 36 of its 56 text runs (the README's 'no other vellora layer moves text y' is wrong)", () => {
  const s = runLevelSummary(receipt.diff);
  assert.deepEqual([s.runs, s.pDiffersFromFinalPassY, s.pMovesBeyondTolY], [56, 36, 36]);
  // The first half of the claim holds: the final pre-pagination pass equals B0 or B0 - 2 px.
  assert.deepEqual(
    [s.finalPassEqualsB0Y, s.finalPassEqualsB0Minus2Y, s.finalPassOtherY],
    [29, 27, 0],
  );
  assert.deepEqual(s.yMovedBy, { painted_table_cell_text_baselines: 27, P: 36 });
});

const RUN04 = join(
  homedir(),
  ".cache",
  "vellora-fidelity",
  "run-all-04-block-offset-20261021T125346Z",
);
test(
  "step 04 run copy (when present): P moves y on 60/98 boleto-febraban, 13/78 boleto, 364/779 text-stress-ptbr runs",
  {
    skip: existsSync(join(RUN04, "layout-diff")) ? false : "run copy not present",
  },
  () => {
    const want = {
      "boleto-febraban": [98, 60],
      boleto: [78, 13],
      "text-stress-ptbr": [779, 364],
      receipt: [56, 36],
      danfe: [318, 0],
      invoice: [210, 0],
      notification: [35, 0],
    };
    for (const [fx, [runs, moved]] of Object.entries(want)) {
      const s = runLevelSummary(readDiff(RUN04, fx));
      assert.deepEqual([s.runs, s.pDiffersFromFinalPassY], [runs, moved], fx);
      assert.equal(s.finalPassOtherY, 0, fx);
    }
  },
);

test("box vectors and the LCS alignment", () => {
  const path = notification.diff.boxes.find((b) => b.layers?.P)?.path;
  const b = boxVector(notification.diff, path);
  assert.equal(b.vector.run, b.vector.P);
  // LCS: the classic example and order preservation.
  const m = lcsAlign(["a", "b", "c", "d"], ["b", "x", "c", "a", "d"]);
  assert.deepEqual(
    [...m],
    [
      [1, 0],
      [2, 2],
      [3, 4],
    ],
  );
});

// 2026-10-27: the boleto pack of the 10-tip run (run-all-10-tip-20261023T004536Z, a293cf5). Its 44
// barcode-line digits are 44 one-digit Chrome PDF words but ONE layout-diff fragment, so the LCS
// leaves them unmapped; the page-1 position fallback maps them to that fragment.
const boleto = loadPack(join(PACK_DIR, "boleto-10tip.layer-vector-pack.json.gz"));
const wb = packWordVectors(boleto);

test("10-tip boleto: the LCS maps 249 of 297 words, the geometry fallback the 44 barcode digits", () => {
  assert.deepEqual([wb.mapping.chromeWords, wb.mapping.mapped], [297, 249]);
  assert.equal(wb.mapping.geometry.mapped, 44);
  assert.equal(wb.mapping.pairsMapped, 249 + 44);
  const geo = [...wb.vectors.values()].filter((x) => x.mappedBy === "geometry");
  assert.equal(geo.length, 44);
  for (const g of geo) {
    assert.match(g.text, /^\d$/);
    assert.equal(g.runText, "99991999900000123459990000012345670000004200");
    assert.ok(Math.abs(g.geometry.fragmentBottomDeltaPx) <= 3);
    assert.deepEqual(g.dy.vector, {
      unit: "px",
      N0: 28.531,
      B0: 28.531,
      L0: 28.531,
      painted_table_cell_text_baselines: 28.531,
      table_percent_widths: 28.531,
      auto_table_compact_columns: 28.531,
      P: 25.531,
      run: 26.467,
    });
    // Independent check: the PDF-level dy agrees with the fragment's P within the run tolerance.
    assert.ok(Math.abs(g.dy.vector.run - g.dy.vector.P) <= 4 / 3);
    assert.equal(g.dy.relaxedB.possible, true);
    assert.deepEqual(g.dy.relaxedB.nonZeroVelloraSteps, [{ layer: "P", step: -3 }]);
  }
  // Only the first digit starts the fragment: dx is exact for it alone.
  assert.equal(geo.filter((g) => g.dxExact).length, 1);
  // The LCS-mapped words are untouched by the fallback (no record carries mappedBy).
  assert.equal([...wb.vectors.values()].filter((x) => x.mapped && !x.mappedBy).length, 249);
});

test("geometry fallback: ambiguous, text-inconsistent and off-page-1 words stay unmapped", () => {
  const frag = (text, x, y, w = 40, h = 10) => ({
    chrome_text: text,
    chrome: { x, y, w, h },
    per_layer: { N0: { dy: 1 }, P: { dy: 1 } },
  });
  const diff = { text_events: [frag("abc", 0, 0), frag("abc", 10, 0), frag("xyz", 100, 0)] };
  const xCheck = { medianOffsetPx: 0, medianBaselineOffsetPxBySize: { 10: 0 } };
  const pt = (px) => px * 0.75;
  const words = [
    { page: 1, text: "abc", x: pt(20), y: pt(10), size: 10 }, // inside both "abc": ambiguous
    { page: 1, text: "q", x: pt(110), y: pt(10), size: 10 }, // inside "xyz" but not its text
    { page: 2, text: "xyz", x: pt(110), y: pt(10), size: 10 }, // page 2: no page-1 offsets
    { page: 1, text: "xyz,", x: pt(100), y: pt(11), size: 10 }, // trailing punctuation dropped
  ];
  const m = geometryFallback(words, new Map(), diff, xCheck);
  assert.deepEqual([...m.keys()], [3]);
  assert.equal(m.get(3).event, 2);
  assert.equal(m.get(3).first, true);
});

test("spec anchor (DANFE-L1 posErrMm): Chrome's spec error + each layer's delta; run = vellora's", () => {
  // The 10-tip DANFE-L1d numbers: font_sizes.py dy 3.17 mm (Chrome) and 6.49 mm (vellora),
  // layout-diff dy 11.922 px in every layer of "DADOS DOS PRODUTOS/SERVIÇOS".
  const layer = { dy: 11.922 };
  const diff = {
    layers: [{ name: "N0" }, { name: "B0" }, { name: "L0" }, { name: "P" }],
    text_events: [
      {
        owner: "div",
        chrome_text: "DADOS DOS PRODUTOS/SERVIÇOS",
        chrome: { x: 0, y: 660, w: 135, h: 9 },
        per_layer: { N0: layer, B0: layer, L0: layer, P: layer },
      },
    ],
  };
  const r = specAnchorVector({
    diff,
    text: "DADOS DOS PRODUTOS/SERVIÇOS",
    chromeErr: { dx: -0.12, dy: 3.17 },
    velloraErr: { dx: 0, dy: 6.49 },
  });
  assert.deepEqual(r.vector, {
    unit: "px",
    N0: 23.903,
    B0: 23.903,
    L0: 23.903,
    P: 23.903,
    run: 24.529,
  });
  // 0.626 px above P: inside the measured Chrome DOM-vs-PDF spread (danfe page-1 dy -0.284..+1.113
  // px). Since rule (ii) (2026-10-27) a position-mm item shares the pdf-probe run tolerance
  // (1.333 px), so the relaxed (b) rule holds; before, its 0.5 px run tolerance refused it.
  assert.equal(r.relaxedB.possible, true);
  assert.equal(r.relaxedB.runTolerance, 1.333);
  // The metric is max(|dx|, |dy|): a dx-dominated error has no dy vector.
  assert.equal(
    specAnchorVector({
      diff,
      text: "DADOS",
      chromeErr: { dx: 5, dy: 1 },
      velloraErr: { dx: 0, dy: 2 },
    }),
    null,
  );
});
