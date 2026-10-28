// LET-1 / LET-2 / LET-3 / TXT-B1 on planted word lists, the FINAL-layer fix of
// fromLayoutDiffRow (Phase A known issue: it read the diagnostic B0u layer), WPT-3 and canary counts.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  let3From,
  letterVerdicts,
  lineCount,
  locate,
  paragraphs,
  signatureLines,
  statementVerdict,
} from "../letter.mjs";
import {
  canaryCounts,
  finalLayer,
  fromCrashtests,
  fromLayoutDiffRow,
  fromWpt,
} from "../verdicts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const PT_PER_MM = 72 / 25.4;

/** words.py-shaped document: lines = [[baseline, "text of the line"], ...] on page 1. */
function doc(lines, page = 1) {
  return {
    pages: [
      {
        page,
        words: lines.flatMap(([baseline, text]) =>
          text.split(" ").map((t, i) => ({ text: t, x: 10 + i * 30, baseline })),
        ),
      },
    ],
  };
}

const HTML = `<html><body>
<div class="body"><p>Primeiro parágrafo com &nbsp;texto.</p><p>Sendo o que se apresenta.</p></div>
<div class="signature">
  <p>Atenciosamente,</p>
  <div class="rule"></div>
  <div class="signer">Mariana Souza</div>
</div>
</body></html>`;

test("paragraphs and signature lines come from the templated HTML", () => {
  assert.deepEqual(paragraphs(HTML), [
    "Primeiro parágrafo com texto.",
    "Sendo o que se apresenta.",
    "Atenciosamente,",
  ]);
  assert.deepEqual(signatureLines(HTML), ["Atenciosamente,", "Mariana Souza"]);
  const words = doc([
    [100, "x Sendo o que"],
    [112, "se apresenta."],
  ]).pages[0].words.map((w) => ({ ...w, page: 1, norm: w.text.toLowerCase() }));
  const found = locate(words, "Sendo o que se apresenta.");
  assert.equal(found.index, 1);
  assert.equal(lineCount(found), 2);
});

test("LET-1 passes within 1 mm of the consensus and fails on the beta.4-style 22 pt drift; LET-2 counts lines", () => {
  const ref = doc([
    [100, "Primeiro parágrafo com texto."],
    [120, "Sendo o que se apresenta."],
    [160, "Atenciosamente,"],
    [200, "Mariana Souza"],
  ]);
  const ok = letterVerdicts({ html: HTML, subject: ref, chrome: ref, weasyprint: ref });
  assert.deepEqual(
    ok.map((x) => x.status),
    ["PASS", "PASS"],
  );
  const drift = doc([
    [100, "Primeiro parágrafo com texto."],
    [120, "Sendo o que"],
    [132, "se apresenta."],
    [138, "Atenciosamente,"],
    [178, "Mariana Souza"],
  ]);
  const [let1, let2] = letterVerdicts({ html: HTML, subject: drift, chrome: ref, weasyprint: ref });
  assert.equal(let1.status, "FAIL");
  assert.equal(let1.metrics[0].value, Math.round((22 / PT_PER_MM) * 100) / 100);
  assert.equal(let2.status, "FAIL");
  assert.equal(let2.metrics[0].value, 1);
  // References that disagree by more than 2 pt are disputed, never ground truth.
  const weasyOff = doc([
    [100, "Primeiro parágrafo com texto."],
    [120, "Sendo o que se apresenta."],
    [170, "Atenciosamente,"],
    [210, "Mariana Souza"],
  ]);
  const disputed = letterVerdicts({
    html: HTML,
    subject: drift,
    chrome: ref,
    weasyprint: weasyOff,
  })[0];
  assert.equal(disputed.status, "NOT-RUN");
  // No word lists: explicit NOT-RUN with the reason.
  assert.deepEqual(
    letterVerdicts({ html: HTML }).map((x) => x.status),
    ["NOT-RUN", "NOT-RUN"],
  );
});

test("LET-3 mirrors the page-count criterion it is defined by", () => {
  const v = let3From(
    [
      {
        criterion: "REF-P",
        oracle: "oracles:layout",
        status: "PASS",
        value: "1 pages vs Chrome 1 (WeasyPrint 1)",
        mode: "plain",
      },
    ],
    "REF-P",
  );
  assert.equal(v.criterion, "LET-3");
  assert.equal(v.status, "PASS");
  assert.equal(let3From([], "TXT-P1").status, "NOT-RUN");
});

test("TXT-B1: a statement page without the repeated header, or a split month, fails", () => {
  const months = [{ label: "Lançamentos de janeiro de 2026", dates: ["02/01/2026", "04/01/2026"] }];
  const page = (n, lines) => ({
    page: n,
    words: lines.flatMap(([b, t]) => t.split(" ").map((x) => ({ text: x, baseline: b, x: 0 }))),
  });
  const good = {
    pages: [
      page(1, [
        [10, "5. Extrato detalhado"],
        [20, "Data Histórico Documento"],
        [30, "Lançamentos de janeiro de 2026"],
        [40, "02/01/2026 PIX"],
        [50, "04/01/2026 Compra"],
      ]),
      page(2, [[10, "6. Termos e condições"]]),
    ],
  };
  assert.equal(statementVerdict({ subject: good, chrome: good, months }).status, "PASS");
  const split = {
    pages: [
      page(1, [
        [10, "5. Extrato detalhado"],
        [20, "Data Histórico Documento"],
        [30, "Lançamentos de janeiro de 2026"],
        [40, "02/01/2026 PIX"],
      ]),
      page(2, [
        [50, "04/01/2026 Compra"],
        [60, "6. Termos e condições"],
      ]),
    ],
  };
  const v = statementVerdict({ subject: split, chrome: good, months });
  assert.equal(v.status, "FAIL");
  assert.deepEqual(
    v.metrics.map((m) => m.value),
    [1, 1, 2],
  );
});

test("fromLayoutDiffRow reports the FINAL layout_normalize layer, not the diagnostic B0u (committed notification data)", () => {
  const fx = JSON.parse(
    readFileSync(
      resolve(here, "..", "..", "baselines", "pin", "fixtures", "notification.json"),
      "utf8",
    ),
  );
  const row = {
    fixture: "notification",
    first_box: {
      type: "enter",
      path: fx.layoutDiffLayers.firstBox.path,
      per_layer: fx.layoutDiffLayers.firstBox.perLayer,
    },
    layer_stats: fx.layoutDiffLayers.layerStats,
    checks_summary: { failed: [], warned: [], not_run: [] },
  };
  assert.equal(finalLayer(row), "collapsed_table_medium_border_insets_x");
  const out = fromLayoutDiffRow(row);
  assert.equal(out.firstBox.finalDelta.layer, "collapsed_table_medium_border_insets_x");
  assert.equal(out.firstBox.finalDelta.dw, fx.layoutDiffLayers.firstBox.finalLayerDelta.dw);
  assert.notEqual(out.firstBox.finalDelta.dw, fx.layoutDiffLayers.firstBox.perLayer.B0u.dw);
});

test("fromLayoutDiffRow applies the allowlist: expected, unexpected and expired checks", () => {
  const entries = [
    { fixture: "receipt", check: "normalize_wrappers_located", reason: "r", expires: "e" },
    { fixture: "receipt", check: "dom_key_alignment", reason: "r", expires: "e" },
  ];
  const out = fromLayoutDiffRow(
    {
      fixture: "receipt",
      checks_summary: { failed: ["normalize_wrappers_located", "viewport_width"], not_run: [] },
    },
    { expectedFailures: entries },
  );
  assert.deepEqual(
    out.checksExpectedFailures.map((e) => e.check),
    ["normalize_wrappers_located"],
  );
  assert.deepEqual(out.checksUnexpectedFailures, ["viewport_width"]);
  assert.deepEqual(
    out.checksExpired.map((e) => e.check),
    ["dom_key_alignment"],
  );
});

test("WPT-2 gates only clean-pass regressions; WPT-3 fails on any panic/crash/timeout", () => {
  const summary = {
    summary: { totals: { reftests: 3 }, bySuite: {} },
    wptPin: { ok: true },
    wptCommit: "x",
  };
  const flaggedOnly = fromWpt(summary, {
    status: "ok",
    counts: { regressions: 4, regressionsOfCleanPasses: 0 },
  });
  assert.equal(flaggedOnly.criteria[1].status, "PASS");
  const clean = fromWpt(summary, {
    status: "ok",
    counts: { regressions: 4, regressionsOfCleanPasses: 1 },
  });
  assert.equal(clean.criteria[1].status, "FAIL");
  assert.equal(fromCrashtests({ results: { a: "ok", b: "ok" }, counts: { ok: 2 } }).status, "PASS");
  assert.equal(fromCrashtests({ results: { a: "ok", b: "panic" }, counts: {} }).status, "FAIL");
  assert.equal(fromCrashtests(null, { reason: "not selected" }).status, "NOT-RUN");
});

test("canary counts separate detection canaries from measurement-only rows", () => {
  const c = canaryCounts([
    { caught: true, ran: true },
    { caught: false, ran: true },
    { caught: false, ran: false },
    { caught: null, ran: true },
  ]);
  assert.deepEqual(c, {
    total: 4,
    detection: 3,
    caught: 1,
    notCaught: 1,
    notRun: 1,
    measurement: 1,
  });
});
