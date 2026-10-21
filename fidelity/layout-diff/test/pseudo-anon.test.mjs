// Real data: a probe page (test/data/pseudo-anon-probe.html; the validator's ::before / anonymous
// block probe) laid out by Chrome 155.0.8059.85 and vellora @ Blitz pin, 2026-10-21. Covers the
// paths no fixture exercises: a block ::before Blitz lays out but vellora's walk never emits,
// pseudo-element GENERATED text on the Chromium side, and Blitz anonymous blocks (N0 only, since
// html_normalize pre-wraps inline runs in the render path).
import assert from "node:assert/strict";
import { test } from "node:test";
import { runChecks, summarizeChecks } from "../lib/checks.mjs";
import { FONT_STYLE_MARKER } from "../lib/fixture-html.mjs";
import { diffLayouts } from "../lib/match.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { loadGz } from "./helpers.mjs";

const PSEUDO = "html>body:nth-child(2)>div:nth-child(3)>::before";

function probe() {
  const chrome = loadGz("pseudo-anon-probe.chrome.json.gz");
  const dump = loadGz("pseudo-anon-probe.dump.json.gz");
  const sourceDump = loadGz("pseudo-anon-probe.dump-source.json.gz");
  const model = velloraModel(dump, { sourceDump });
  const result = diffLayouts({
    chrome: chrome.records,
    vellora: model,
    baselines: new Map(Object.entries(chrome.baselines)),
  });
  result.checks = runChecks({
    dump,
    model,
    probes: chrome.probes,
    browserHtml: `<head><style ${FONT_STYLE_MARKER}></style></head>`,
    result,
    chromeRecords: chrome.records,
  });
  result.checks_summary = summarizeChecks(result.checks);
  return { result, model };
}

test("a block ::before Blitz lays out but the walk drops is LOST at L0 and counted", () => {
  const { result } = probe();
  const lost = result.missing_boxes.find((m) => m.path === PSEUDO);
  assert.equal(lost.missing_from, "L0");
  assert.ok(lost.present_in.includes("N0") && lost.present_in.includes("B0"));
  assert.equal(lost.counted_as_divergence, true);
  assert.equal(result.headline.first_walk_regression.box.path, PSEUDO);
  assert.equal(result.regressions_by_layer.L0.by_kind.missing, 2); // enter + exit
  // A dropped box is not a key failure: its key matches on both sides.
  assert.equal(result.checks.find((c) => c.id === "dom_key_alignment").status, "pass");
});

test("pseudo-element generated text is captured on the Chromium side", () => {
  const { result } = probe();
  assert.equal(result.text.chrome_generated_fragments, 1);
  const frag = result.text.unmatched_chrome_fragments.find((f) => f.generated);
  assert.equal(frag.text, "Before block");
  assert.equal(frag.owner, "html>body:nth-child(2)>div:nth-child(3)");
});

test("Blitz anonymous blocks are keyed ::blitz-anon(j) in N0 and never compared", () => {
  const { model, result } = probe();
  const anon = model.source.anonymous;
  assert.deepEqual(anon, [
    "html>body:nth-child(2)>div:nth-child(1)>::blitz-anon(1)",
    "html>body:nth-child(2)>div:nth-child(1)>::blitz-anon(2)",
    "html>body:nth-child(2)>div:nth-child(2)>::blitz-anon(1)",
    "html>body:nth-child(2)>div:nth-child(2)>::blitz-anon(2)",
  ]);
  assert.ok(!result.boxes.some((b) => b.path.includes("::blitz-anon")));
  // html_normalize pre-wrapped the same inline runs: no anonymous blocks in the render path.
  assert.equal(model.anonymous.length, 0);
  assert.equal(result.checks.find((c) => c.id === "normalize_dom_roundtrip").status, "pass");
});
