// Value-ratchet rules on planted snapshots: synthetic regressions, an accepted regression, the
// status ratchet, absolute failures, WPT clean/flagged semantics, crashtests and pdf-probe.
import assert from "node:assert/strict";
import { test } from "node:test";
import { compareSnapshots } from "../compare.mjs";
import { verdictMetrics } from "../metrics.mjs";
import { gateOptions, gateRefusal } from "../run.mjs";
import { byKey, expectations, fixture, gating, snapshot, v } from "./helpers.mjs";

const refw = (max, p95, status = "FAIL") =>
  v(
    "REF-W",
    "oracles:layout",
    status,
    `max ${max} mm, p95 ${p95} mm over 235 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1)`,
    { mode: "plain" },
  );
const KEY = "notification|REF-W|oracles:layout|plain|criterion#1";

test("metric parser: every Phase A value shape yields the documented metrics", () => {
  const m = (value, criterion = "X") =>
    Object.fromEntries(verdictMetrics({ criterion, value }).map((x) => [x.metric, x.value]));
  assert.deepEqual(m(refw(3.6, 3.48).value), {
    maxMm: 3.6,
    p95Mm: 3.48,
    consensusWords: 235,
    coverage: 1,
  });
  assert.deepEqual(m("2 pages vs Chrome 1 (WeasyPrint 1)"), {
    pageDelta: 1,
    pages: 2,
    referencePages: 1,
  });
  assert.deepEqual(m("8 vs reference 7"), { pageDelta: 1, pages: 8 });
  assert.deepEqual(m("2 (expected 1)"), { pageDelta: 1, pages: 2 });
  assert.deepEqual(m("0 (expected >= 1)"), { shortfall: 1, value: 0 });
  assert.deepEqual(m("11/16 missing @a, @b (1/2×)"), { found: 11, required: 16 });
  assert.deepEqual(m("pdftotext 11/16; pypdf 16/16; pdfminer 16/16"), {
    "found.pdftotext": 11,
    "found.pypdf": 16,
    "found.pdfminer": 16,
  });
  assert.deepEqual(
    m("pdftotext fail (missing 12, extra 8); pdfminer.six warn (missing 0, extra 0)"),
    {
      "missing.pdftotext": 12,
      "extra.pdftotext": 8,
      "statusRank.pdftotext": 1,
      "missing.pdfminer.six": 0,
      "extra.pdfminer.six": 0,
      "statusRank.pdfminer.six": 2,
    },
  );
  assert.deepEqual(m("102.4043 (target 103 ± 0.3)"), { excess: 0.2957, value: 102.4043 });
  assert.deepEqual(m("39.1583 (in [8, 14.8])"), { excess: 24.3583, value: 39.1583 });
  assert.deepEqual(m("0.0423 (min 2.65)"), { excess: 2.6077, value: 0.0423 });
  assert.deepEqual(m("0.0212 (max 0.05)"), { excess: 0, value: 0.0212 });
  assert.deepEqual(m("ficha_top not measurable (no dashed cut line detected)"), { excess: null });
  assert.deepEqual(m("L 2.498 T 3.429 R 0 B 32.724 (each in [2, 8])"), {
    excessL: 0,
    excessT: 0,
    excessR: 2,
    excessB: 24.724,
  });
  assert.deepEqual(m("worst BOL-T2 86.02 mm (tol 1)"), { worstMm: 86.02 });
  assert.deepEqual(m("DANFE-A4: anchor text not found in vellora"), { worstMm: null });
  assert.deepEqual(m("6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, -3.15) mm"), { posErrMm: 3.15 });
  assert.deepEqual(m('2/3 segments; min 8pt "0 - ENTRADA"'), { segments: 2, segmentsTotal: 3 });
  assert.deepEqual(m('3472/3511 glyphs attributed; sample "X"'), {
    glyphsAttributed: 3472,
    glyphsTotal: 3511,
  });
  assert.deepEqual(m("20.6pt GSCMBG+LiberationSans-Bold; 2/2 occurrences"), {
    sizePt: 20.6,
    occurrences: 2,
  });
  assert.deepEqual(
    m("46 tokens in 3 columns, worst right-edge spread 0.4 mm (Débito (R$); max 0.3)"),
    {
      tokens: 46,
      excess: 0.1,
      spreadMm: 0.4,
    },
  );
  assert.deepEqual(m("decodes false, validates false"), { decodes: 0, validates: 0 });
  // Strings are never compared: a status-only verdict has no metric.
  assert.deepEqual(m("pypdf 6.21.1 strict"), {});
  // Structured metrics win over the string.
  assert.deepEqual(
    verdictMetrics({
      value: "max 9 mm, p95 9 mm over 1 consensus words coverage 1",
      metrics: [{ metric: "worstMm", value: 1 }],
    }),
    [{ metric: "worstMm", value: 1 }],
  );
});

test("synthetic regression: REF-W max beyond the 0.1 mm tolerance FAILS the gate", () => {
  const before = snapshot([fixture("notification", [refw(3.6, 3.48)])]);
  const after = snapshot([fixture("notification", [refw(3.75, 3.48)])]);
  const r = compareSnapshots(before, after);
  assert.equal(r.verdict, "FAIL");
  const item = byKey(r, `${KEY}|maxMm`);
  assert.equal(item.class, "regression");
  assert.equal(item.gating, true);
  assert.equal(item.before, 3.6);
  assert.equal(item.after, 3.75);
  assert.equal(item.tol, 0.1);
});

test("worse within tolerance is a listed, counted within-tolerance item (never unchanged); better is an improvement; neither gates", () => {
  const before = snapshot([fixture("notification", [refw(3.6, 3.48)])]);
  const w = compareSnapshots(before, snapshot([fixture("notification", [refw(3.69, 3.47)])]));
  assert.equal(w.verdict, "PASS");
  const item = byKey(w, `${KEY}|maxMm`);
  assert.deepEqual(
    [item.class, item.gating, item.before, item.after],
    ["within-tolerance", false, 3.6, 3.69],
  );
  assert.equal(w.counts.withinTolerance, 1);
  // 3.48 -> 3.47 (better, within tolerance): counted separately, not an item, not "unchanged".
  assert.equal(byKey(w, `${KEY}|p95Mm`), undefined);
  assert.equal(w.counts.withinToleranceBetter, 1);
  const r = compareSnapshots(before, snapshot([fixture("notification", [refw(1.2, 1.1)])]));
  assert.equal(r.verdict, "PASS");
  assert.equal(byKey(r, `${KEY}|maxMm`).class, "improvement");
});

test("synthetic ACCEPTED regression: an acceptedRegressions entry with reason + evidence passes the gate", () => {
  const before = snapshot([fixture("notification", [refw(3.6, 3.48)])]);
  const after = snapshot([fixture("notification", [refw(8.54, 8.42)])]);
  const accept = [
    {
      key: `${KEY}|maxMm`,
      after: 8.54,
      reason: "old value was a false pass",
      evidence: "Chrome+WeasyPrint consensus, see report",
    },
    { key: `${KEY}|p95Mm`, reason: "same", evidence: "same" },
  ];
  const r = compareSnapshots(before, after, { accept });
  assert.equal(r.verdict, "PASS");
  const item = byKey(r, `${KEY}|maxMm`);
  assert.equal(item.class, "accepted");
  assert.equal(item.acceptedAs.reason, "old value was a false pass");
  // The acceptance is bound to the accepted value: a WORSE later value is not hidden by it.
  const worse = compareSnapshots(before, snapshot([fixture("notification", [refw(9.5, 8.42)])]), {
    accept,
  });
  assert.equal(worse.verdict, "FAIL");
  assert.equal(byKey(worse, `${KEY}|maxMm`).class, "regression");
  assert.equal(worse.unusedAcceptances.length, 1);
});

test("status ratchet: PASS->FAIL gates; NOT-RUN->FAIL is newly measured; FAIL->NOT-RUN and a lost row gate", () => {
  const before = snapshot([
    fixture("danfe", [
      v("DANFE-F4c", "corpus", "PASS", "3/3 segments; min 8pt"),
      v("DANFE-B1", "oracles:barcode", "NOT-RUN", "Code 128 not implemented", { mode: "plain" }),
      v("PDF-Q1", "oracles:qpdf", "FAIL", "", { mode: "plain" }),
      v("DET-1", "corpus", "PASS", "true"),
    ]),
  ]);
  const after = snapshot([
    fixture("danfe", [
      v("DANFE-F4c", "corpus", "FAIL", "2/3 segments; min 8pt"),
      v("DANFE-B1", "oracles:barcode", "FAIL", "zxing-cpp: no Code 128 symbol decoded", {
        mode: "plain",
      }),
      v("PDF-Q1", "oracles:qpdf", "NOT-RUN", "qpdf missing", { mode: "plain" }),
    ]),
  ]);
  const r = compareSnapshots(before, after);
  assert.equal(byKey(r, "danfe|DANFE-F4c|corpus||criterion#1").class, "regression");
  assert.equal(byKey(r, "danfe|DANFE-F4c|corpus||criterion#1|segments").class, "regression");
  assert.equal(
    byKey(r, "danfe|DANFE-B1|oracles:barcode|plain|criterion#1").class,
    "newly-measured",
  );
  assert.equal(byKey(r, "danfe|PDF-Q1|oracles:qpdf|plain|criterion#1").class, "regression");
  const lost = byKey(r, "danfe|DET-1|corpus||criterion#1");
  assert.equal(lost.class, "removed");
  assert.equal(lost.gating, true);
  assert.equal(r.verdict, "FAIL");
});

test("absolute failures gate and cannot be accepted: red code check, uncaught canary, layout-diff checks", () => {
  const base = snapshot([fixture("receipt", [])]);
  const after = snapshot(
    [
      fixture("receipt", [], {
        status: "ran",
        checksFailed: ["normalize_wrappers_located", "viewport_width"],
        checksUnexpectedFailures: ["viewport_width"],
        checksExpired: [{ check: "dom_key_alignment", expires: "when fixed" }],
      }),
    ],
    {
      codeChecks: [
        {
          id: "cargo-test",
          command: "cargo test",
          status: "fail",
          exitCode: 101,
          failures: ["t::mixed_weight"],
        },
      ],
      canaries: [
        { oracle: "verapdf", canary: "OutputIntent removed", ran: true, caught: false },
        { oracle: "copy-paste/pymupdf", canary: "Chrome measurement", ran: true, caught: null },
      ],
    },
  );
  const accept = [{ keyPrefix: "code|", reason: "x", evidence: "y" }];
  const r = compareSnapshots(base, after, { accept });
  assert.equal(r.verdict, "FAIL");
  const keys = gating(r)
    .map((i) => i.key)
    .sort();
  assert.deepEqual(keys, [
    "canary|verapdf|OutputIntent removed",
    "code|cargo-test",
    "layout-diff|receipt|dom_key_alignment",
    "layout-diff|receipt|viewport_width",
  ]);
  assert.match(byKey(r, "code|cargo-test").detail, /t::mixed_weight/);
  assert.equal(r.unusedAcceptances.length, 1);
});

test("WPT: clean pass lost and clean->suspect gate; flagged pass lost is reported; new error gates", () => {
  const before = expectations(
    {
      "css/CSS2/box/a.html": "pass",
      "css/CSS2/box/b.html": "pass",
      "css/CSS2/box/c.html": "pass",
      "css/CSS2/tables/d.html": "fail",
      "css/CSS2/tables/e.html": "fail",
      "css/CSS2/tables/f.html": "pass",
    },
    { "css/CSS2/box/b.html": "ink-missing-vs-chrome" },
  );
  const after = expectations(
    {
      "css/CSS2/box/a.html": "fail",
      "css/CSS2/box/b.html": "fail",
      "css/CSS2/box/c.html": "pass",
      "css/CSS2/tables/d.html": "pass",
      "css/CSS2/tables/e.html": "error",
      "css/CSS2/tables/f.html": "pass",
    },
    { "css/CSS2/box/c.html": "ink-displaced-vs-chrome" },
  );
  const r = compareSnapshots(
    snapshot([], { wpt: { expectations: before } }),
    snapshot([], { wpt: { expectations: after } }),
  );
  const cls = (t) => [byKey(r, `wpt|${t}`)?.class, byKey(r, `wpt|${t}`)?.gating];
  assert.deepEqual(cls("css/CSS2/box/a.html"), ["regression", true]);
  assert.deepEqual(cls("css/CSS2/box/b.html"), ["reported", false]);
  assert.deepEqual(cls("css/CSS2/box/c.html"), ["regression", true]);
  assert.deepEqual(cls("css/CSS2/tables/d.html"), ["improvement", false]);
  assert.deepEqual(cls("css/CSS2/tables/e.html"), ["regression", true]);
  assert.equal(r.wptPerSuite["css/CSS2/box"].cleanBefore, 2);
  assert.equal(r.wptPerSuite["css/CSS2/box"].cleanAfter, 0);
  assert.equal(r.verdict, "FAIL");
});

test("WPT: an inkCheck mismatch or a run without Chrome ink data is REFUSED, never silently compared", () => {
  const before = expectations({ "css/CSS2/box/a.html": "pass" });
  const noInk = expectations({ "css/CSS2/box/a.html": "pass" }, {}, { inkCheck: "not-run" });
  const other = expectations(
    { "css/CSS2/box/a.html": "pass" },
    {},
    { inkCheck: "chrome Chrome/156.0.0.0" },
  );
  for (const after of [noInk, other]) {
    const r = compareSnapshots(
      snapshot([], { wpt: { expectations: before } }),
      snapshot([], { wpt: { expectations: after } }),
    );
    assert.equal(r.verdict, "REFUSED");
    assert.match(r.refusals[0], /inkCheck/);
  }
  const otherCommit = expectations(
    { "css/CSS2/box/a.html": "pass" },
    {},
    { wptCommit: "b".repeat(40) },
  );
  const r = compareSnapshots(
    snapshot([], { wpt: { expectations: before } }),
    snapshot([], { wpt: { expectations: otherCommit } }),
  );
  assert.equal(r.verdict, "REFUSED");
  // A baseline WITH outcomes and a run WITHOUT them: refused, not passed.
  const missing = compareSnapshots(
    snapshot([], { wpt: { expectations: before } }),
    snapshot([], { wpt: { expectations: null, reason: "wpt not selected" } }),
  );
  assert.equal(missing.verdict, "REFUSED");
});

test("crashtests: ok -> panic/crash/timeout gates; a missing baseline record is not comparable", () => {
  const ok = { results: { "a-crash.html": "ok", "b-crash.html": "ok", "c-crash.html": "panic" } };
  const now = { results: { "a-crash.html": "panic", "b-crash.html": "ok", "c-crash.html": "ok" } };
  const r = compareSnapshots(snapshot([], { crashtests: ok }), snapshot([], { crashtests: now }));
  assert.deepEqual(
    [byKey(r, "wpt-crash|a-crash.html").class, byKey(r, "wpt-crash|a-crash.html").gating],
    ["regression", true],
  );
  assert.equal(byKey(r, "wpt-crash|c-crash.html").class, "improvement");
  const legacy = compareSnapshots(snapshot([]), snapshot([], { crashtests: now }));
  assert.equal(byKey(legacy, "wpt-crash").class, "not-comparable");
  assert.equal(legacy.verdict, "PASS");
});

test("pdf-probe: a word moving > 1 pt further from Chrome, or to another page, gates", () => {
  const pair = (k, dx, dy, samePage = true) => ({
    k,
    text: k.split("#")[0],
    page: 1,
    samePage,
    dx,
    dy,
  });
  const before = {
    invoice: { pairs: [pair("32,50#1", 0.92, 0.1), pair("Total#1", 0, 0), pair("Data#1", 0, 0)] },
  };
  const after = {
    invoice: {
      pairs: [pair("32,50#1", 9.96, 0.1), pair("Total#1", 0.5, -0.4), pair("Data#1", 0, 0, false)],
    },
  };
  const r = compareSnapshots(snapshot([], { pdfProbe: before }), snapshot([], { pdfProbe: after }));
  assert.equal(byKey(r, "pdf-probe|invoice|32,50#1|dx").class, "regression");
  // 0 -> 0.5 pt (v1 history path too): worse within tolerance, listed, never "unchanged".
  assert.deepEqual(
    [
      byKey(r, "pdf-probe|invoice|Total#1|dx").class,
      byKey(r, "pdf-probe|invoice|Total#1|dx").gating,
    ],
    ["within-tolerance", false],
  );
  assert.equal(byKey(r, "pdf-probe|invoice|Data#1").class, "regression");
  assert.equal(r.verdict, "FAIL");
});

test("baseline integrity problems refuse the comparison", () => {
  const before = snapshot([], {
    integrity: {
      ok: false,
      checked: 1,
      problems: ["fixtures/x.json sha256 differs from manifest"],
    },
  });
  assert.equal(compareSnapshots(before, snapshot([])).verdict, "REFUSED");
});

test("run-all --gate refuses before running anything without baseline or Chrome ink data", () => {
  const exists = (p) => !p.includes("missing");
  const base = {
    baseline: "/b",
    wptArgs: [],
    chrome: "/chrome",
    wptChrome: false,
    chromeFrom: null,
    accept: null,
    resolveBase: () => ({ ledger: null, source: "planted", refusal: null }),
  };
  assert.match(gateRefusal({ ...base, baseline: null }, ["wpt"], exists), /needs --baseline/);
  // I2: without --debt-base the ledger base must be determinable before anything runs.
  const noBase = () => ({ ledger: undefined, source: null, refusal: "ledger base: no merge-base" });
  assert.match(
    gateRefusal({ ...base, chromeFrom: "/r.json", resolveBase: noBase }, ["wpt"], exists),
    /no merge-base/,
  );
  assert.equal(
    gateRefusal(
      { ...base, chromeFrom: "/r.json", resolveBase: noBase, gateArgs: ["--debt-base", "/d.json"] },
      ["wpt"],
      exists,
    ),
    null,
  );
  assert.match(gateRefusal({ ...base, baseline: "/missing" }, ["wpt"], exists), /no manifest/);
  assert.match(gateRefusal(base, ["wpt"], exists), /Chrome ink data/);
  assert.equal(gateRefusal({ ...base, wptChrome: true }, ["wpt"], exists), null);
  assert.equal(gateRefusal({ ...base, chromeFrom: "/r.json" }, ["wpt"], exists), null);
  assert.match(
    gateRefusal({ ...base, chromeFrom: "/missing.json" }, ["wpt"], exists),
    /does not exist/,
  );
  assert.equal(gateRefusal(base, ["corpus"], exists), null);
  // --head / --pin must be baseline directories; the default head comes from the port README.
  assert.match(
    gateRefusal({ ...base, gateArgs: ["--head", "/missing-head"] }, ["corpus"], exists),
    /--head .*no manifest/,
  );
  assert.match(
    gateRefusal({ ...base, gateArgs: ["--pin", "/missing-pin"] }, ["corpus"], exists),
    /--pin .*no manifest/,
  );
  assert.equal(
    gateRefusal({ ...base, gateArgs: ["--no-head", "--no-pin"] }, ["corpus"], exists),
    null,
  );
  const o = gateOptions([
    "--no-head",
    "--pin",
    "/p",
    "--main",
    "--step",
    "08-x",
    "--debt-base",
    "/d",
  ]);
  assert.deepEqual(
    [o.headDir, o.pinDir, o.main, o.step, o.debtBase],
    [null, "/p", true, "08-x", "/d"],
  );
  assert.equal(gateOptions([]).headDir, undefined);
  assert.match(
    gateRefusal({ ...base, wptChrome: true, wptArgs: ["--update-expectations"] }, ["wpt"], exists),
    /never rewrites/,
  );
});

test("a gated run cannot skip a step, the canaries or part of the WPT suites", () => {
  const exists = () => true;
  const all = ["code-checks", "wpt", "wpt-crashtests", "corpus", "oracles-fixtures"];
  const base = {
    baseline: "/b",
    wptArgs: [],
    chromeFrom: "/r.json",
    allSteps: all,
    canaries: true,
    resolveBase: () => ({ ledger: null, source: "planted", refusal: null }),
  };
  assert.equal(gateRefusal(base, all, exists), null);
  const skipped = all.filter((s) => s !== "code-checks");
  assert.match(gateRefusal(base, skipped, exists), /not selected: code-checks/);
  assert.match(gateRefusal({ ...base, canaries: false }, all, exists), /--no-canaries/);
  for (const wptArgs of [["css/CSS2/tables"], ["--filter", "x"], ["--limit", "3"]]) {
    assert.match(gateRefusal({ ...base, wptArgs }, all, exists), /narrows/);
  }
  // Option values are not suite paths.
  assert.equal(
    gateRefusal({ ...base, wptArgs: ["--jobs", "6", "--upstream", "none"] }, all, exists),
    null,
  );
});

test("sections the baseline measured but the run lacks are REFUSED, never compared as empty", () => {
  const code = [{ id: "cargo-test", status: "pass", exitCode: 0, failures: [] }];
  const canaries = [{ oracle: "qpdf", canary: "truncated", ran: true, caught: true }];
  const probe = {
    invoice: { pairs: [{ k: "a#1", text: "a", page: 1, samePage: true, dx: 0, dy: 0 }] },
  };
  const crash = { results: { "a-crash.html": "ok" } };
  for (const [field, value, re] of [
    ["codeChecks", code, /code checks/],
    ["canaries", canaries, /canaries/],
    ["pdfProbe", probe, /pdf-probe/],
    ["crashtests", crash, /crashtests/],
  ]) {
    const r = compareSnapshots(snapshot([], { [field]: value }), snapshot([]));
    assert.equal(r.verdict, "REFUSED", field);
    assert.match(r.refusals.join("; "), re);
  }
  // A run-all RUN must carry code checks, canaries and crashtests even against a Phase A
  // baseline that has none of them.
  const r = compareSnapshots(snapshot([]), snapshot([], { source: { kind: "run" } }));
  assert.equal(r.verdict, "REFUSED");
  assert.equal(r.refusals.length, 3);
  const full = snapshot([], {
    source: { kind: "run" },
    codeChecks: code,
    canaries,
    crashtests: crash,
  });
  assert.equal(compareSnapshots(snapshot([]), full).verdict, "PASS");
});
