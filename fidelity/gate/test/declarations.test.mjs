// I4 (2026-10-22): declaredRejections carried along the port chain (gate/declarations.mjs).
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  DECLARATIONS_SCHEMA,
  chainDeclarations,
  loadSupplement,
  mergeChainDeclarations,
  stepOrdinal,
} from "../declarations.mjs";

const port = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "baselines", "port");
const d = (feature, tests) => ({ feature, reason: "r", evidence: "e", tests });

test("merge: links in (head, current], the supplement in range, the current step always", () => {
  const links = [
    { step: "00-a", declaredRejections: [d("f0", ["t0"])] },
    { step: "01-b", declaredRejections: [d("f1", ["t1"])] },
    { step: "03-d", declaredRejections: [d("f3", ["t3"])] },
  ];
  const supplement = [{ step: "02-c", ...d("f2", ["t2"]) }];
  const feats = (x) => x.map((y) => y.feature).sort();
  assert.deepEqual(
    feats(mergeChainDeclarations({ links, supplement, from: 0, to: 2, current: [d("fc", [])] })),
    ["f1", "f2", "fc"],
  );
  // The head (exclusive) and links after the current step never count.
  assert.deepEqual(feats(mergeChainDeclarations({ links, supplement, from: 1, to: 1 })), []);
  // From the chain start (pin view): 00 included.
  assert.deepEqual(feats(mergeChainDeclarations({ links, supplement, from: null, to: 3 })), [
    "f0",
    "f1",
    "f2",
    "f3",
  ]);
  // Duplicates (the same feature and tests from a manifest and the current step) count once.
  const once = mergeChainDeclarations({ links, from: 0, to: 1, current: [d("f1", ["t1"])] });
  assert.equal(once.length, 1);
  assert.equal(stepOrdinal("06-page-rules"), 6);
  assert.equal(stepOrdinal("pin"), null);
});

test("the committed supplement declares step 06's 10 css:page-varying-width rejections", () => {
  const s = loadSupplement();
  assert.equal(s.length, 1);
  assert.equal(s[0].step, "06-page-rules");
  assert.equal(s[0].feature, "css:page-varying-width");
  assert.equal(s[0].tests.length, 10);
  // Carried from step 06 on; not before.
  const at = (prev, step) =>
    chainDeclarations({
      headDir: join(port, "00-start"),
      baselineDir: join(port, prev),
      step,
    });
  assert.equal(at("05-walk-rewrite", "06-page-rules").head.length, 1);
  assert.equal(at("08-html-parse", "09-review-fixes").head.length, 1);
  assert.equal(at("08-html-parse", "09-review-fixes").pin.length, 1);
  assert.equal(at("04-block-offset", "05-walk-rewrite").head.length, 0);
  // Without --step the current step is the previous link + 1.
  assert.equal(at("05-walk-rewrite", null).head.length, 1);
  // A head after 06 does not carry 06's declaration.
  assert.equal(
    chainDeclarations({
      headDir: join(port, "06-page-rules"),
      baselineDir: join(port, "08-html-parse"),
      step: "09-review-fixes",
    }).head.length,
    0,
  );
  // Outside the port chain (previous link = pin): only the current declarations.
  assert.equal(
    chainDeclarations({ headDir: join(port, "00-start"), baselineDir: join(port, "..", "pin") })
      .head.length,
    0,
  );
});

test("gated against the pin itself (--baseline pin --main --step NN): the pin view still carries the chain's declarations", () => {
  const pinDir = join(port, "..", "pin");
  const r = chainDeclarations({ headDir: null, baselineDir: pinDir, step: "09-review-fixes" });
  assert.equal(r.head.length, 0);
  assert.deepEqual(
    r.pin.map((x) => x.feature),
    ["css:page-varying-width"],
  );
  // Without --step there is no current step to carry up to.
  assert.equal(chainDeclarations({ headDir: null, baselineDir: pinDir }).pin.length, 0);
});

test("a malformed supplement is refused", () => {
  const dir = mkdtempSync(join(tmpdir(), "decl-"));
  const f = join(dir, "declared-rejections.json");
  writeFileSync(f, JSON.stringify({ schema: DECLARATIONS_SCHEMA, declarations: [{ step: "06" }] }));
  assert.throws(() => loadSupplement(f), /feature, reason and evidence.*step must be NN-name/);
  writeFileSync(f, JSON.stringify({ schema: "other", declarations: [] }));
  assert.throws(() => loadSupplement(f), /schema other/);
});
