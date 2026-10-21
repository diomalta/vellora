// Real data: receipt @ Blitz pin (run.mjs, Chrome 155.0.8059.85, 2026-10-21) WITH the N0 source
// dump. html_normalize wraps the inline run of `<p class="thanks">` (it has a display:block child)
// in a <div>; Blitz's HTML parser cannot keep a <div> inside a <p> when it re-parses the
// serialized output, so the wrapper is hoisted out, an empty <p> follows it and later siblings'
// keys shift. The tool must (1) FAIL the run's self-consistency checks, (2) charge the change to
// html_normalize (N0 -> B0), not to raw Blitz, and (3) keep comparing the footer through N0.
import assert from "node:assert/strict";
import { test } from "node:test";
import { runChecks, summarizeChecks } from "../lib/checks.mjs";
import { FONT_STYLE_MARKER } from "../lib/fixture-html.mjs";
import { diffLayouts } from "../lib/match.mjs";
import { attributionText } from "../lib/report.mjs";
import { velloraModel } from "../lib/vellora-model.mjs";
import { loadGz } from "./helpers.mjs";

const B = "html>body:nth-child(2)>div:nth-child(1)";

function receipt({ withSource = true } = {}) {
  const chrome = loadGz("receipt-pin.chrome.json.gz");
  const dump = loadGz("receipt-pin.dump.json.gz");
  const sourceDump = withSource ? loadGz("receipt-pin.dump-source.json.gz") : null;
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
  return result;
}

const status = (r, id) => r.checks.find((c) => c.id === id)?.status;

test("receipt: the hoisted wrapper fails self-consistency (the run exits non-zero)", () => {
  const r = receipt();
  assert.equal(status(r, "normalize_wrappers_located"), "fail");
  assert.equal(status(r, "normalize_dom_roundtrip"), "fail");
  assert.equal(status(r, "dom_key_alignment"), "fail");
  // Blitz's parse of the SOURCE HTML keys every element exactly like Chromium.
  assert.equal(status(r, "source_dom_keys_vs_chromium"), "pass");
  assert.equal(status(r, "source_html_layer"), "pass");
  assert.equal(r.checks_summary.self_consistency_ok, false);
  assert.equal(r.checks_summary.attribution_valid, true);
  const roundtrip = r.checks.find((c) => c.id === "normalize_dom_roundtrip").detail;
  assert.match(
    roundtrip,
    /only in normalized 4 .*div:nth-child\(7\).*p:nth-child\(8\).*footer:nth-child\(9\)/,
  );
});

test("receipt: p.thanks losing its second line is html_normalize's (N0 ok, B0 -46 px)", () => {
  const r = receipt();
  const first = r.headline.first_html_normalize_regression.box;
  assert.equal(first.type, "exit");
  assert.equal(first.path, `${B}>p:nth-child(6)`);
  const w = first.regressed_by.find((x) => x.layer === "B0");
  assert.equal(w.kind, "worsened");
  assert.equal(w.coord, "dh");
  assert.ok(Math.abs(first.per_layer.N0.dh) <= 0.5, `N0 dh ${first.per_layer.N0.dh}`);
  assert.ok(first.per_layer.B0.dh < -40, `B0 dh ${first.per_layer.B0.dh}`);
});

test("receipt: the footer is compared at N0 and LOST at B0, never silently dropped", () => {
  const r = receipt();
  const footer = r.missing_boxes.find((m) => m.path === `${B}>footer:nth-child(7)`);
  assert.equal(footer.missing_from, "B0");
  assert.deepEqual(footer.present_in, ["N0", "N0u"]);
  assert.equal(footer.counted_as_divergence, true);
  assert.equal(r.regressions_by_layer.B0.by_kind.missing, 2); // its enter and exit
});

test("receipt without N0: B0 is NOT called raw Blitz (html_normalize altered this DOM)", () => {
  const r = receipt({ withSource: false });
  assert.equal(status(r, "source_html_layer"), "not-run");
  assert.equal(r.headline.box.first_over_tolerance, "B0");
  assert.match(attributionText(r.headline.box, r.final_layer, r), /NOT separated/);
  // The footer has no box in any layer: still counted, as a missing box.
  const footer = r.missing_boxes.find((m) => m.path === `${B}>footer:nth-child(7)`);
  assert.equal(footer.counted_as_divergence, true);
});
