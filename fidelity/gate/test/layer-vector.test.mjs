// Layer vectors (gate/layer-vector.mjs) on committed data: the notification pack of the step-07 run
// (reproduces the committed 07 pdf-probe section exactly) and the receipt pack of the step-04 run
// (the run-level P-vs-final-pass numbers that correct the step-04 README claim). No Python needed;
// the run copies under ~/.cache/vellora-fidelity are used only when present.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { compactProbeV2 } from "../../layout-diff/lib/pdf-probe-v2.mjs";
import { relaxedB } from "../debt.mjs";
import {
  PACK_DIR,
  anchorVector,
  boxVector,
  lcsAlign,
  loadPack,
  packWordVectors,
  readDiff,
  relaxedBFacts,
  runLevelSummary,
  stepsOf,
} from "../layer-vector.mjs";

const baselines = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines");
const notification = loadPack(join(PACK_DIR, "notification-07.layer-vector-pack.json.gz"));
const receipt = loadPack(join(PACK_DIR, "receipt-04.layer-vector-pack.json.gz"));
const w07 = packWordVectors(notification);

test("the notification pack is the step-07 link: its v2 probe equals the committed section", () => {
  const committed = JSON.parse(
    readFileSync(
      join(baselines, "port", "07-media-print", "pdf-probe", "notification.json"),
      "utf8",
    ),
  );
  // The pack predates the off-page record (2026-10-22 backfill, gate/backfill-off-page.mjs): the
  // committed section adds it (notification draws no text off the page) and is otherwise equal.
  const { offPage, ...rest } = committed;
  assert.deepEqual(offPage, { vellora: [], chrome: [] });
  assert.deepEqual(compactProbeV2(w07.probe), rest);
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
