// D5 and D6 on planted snapshots: new strict-gate rejections gate unless declared
// (declaredRejections: feature, reason, evidence), and lost flagged WPT passes are counted in the
// report totals without gating.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { compareSnapshots, matchesDeclaration } from "../compare.mjs";
import { readAcceptances, readDeclarations } from "../run.mjs";
import { byKey, expectations, fixture, gating, snapshot, v } from "./helpers.mjs";

const wptPair = (before, after, afterExtra = {}, opts = {}) =>
  compareSnapshots(
    snapshot([], { wpt: { expectations: expectations(before) } }),
    snapshot([], { wpt: { expectations: expectations(after, {}, afterExtra) } }),
    opts,
  );

test("WPT: fail/pass -> unsupported is a gating rejection, never a silent 'changed' (D5)", () => {
  const before = {
    "css/CSS2/box/a.html": "fail",
    "css/CSS2/box/b.html": "pass",
    "css/CSS2/box/c.html": "unsupported",
    "css/CSS2/box/d.html": "pass-blank",
  };
  const after = {
    "css/CSS2/box/a.html": "unsupported",
    "css/CSS2/box/b.html": "unsupported",
    "css/CSS2/box/c.html": "unsupported",
    "css/CSS2/box/d.html": "unsupported",
  };
  const r = wptPair(before, after, {
    unsupportedFeatures: {
      "css/CSS2/box/a.html": "css:page-varying-width",
      "css/CSS2/box/b.html": "css:page-varying-width",
      "css/CSS2/box/c.html": "css:grid",
      "css/CSS2/box/d.html": "css:transform",
    },
  });
  assert.equal(r.verdict, "FAIL");
  const a = byKey(r, "wpt|css/CSS2/box/a.html");
  assert.deepEqual([a.class, a.gating, a.feature], ["rejection", true, "css:page-varying-width"]);
  assert.equal(byKey(r, "wpt|css/CSS2/box/b.html").cleanPassLost, true);
  assert.equal(byKey(r, "wpt|css/CSS2/box/c.html"), undefined); // already unsupported: unchanged
  assert.equal(byKey(r, "wpt|css/CSS2/box/d.html").class, "rejection");
  assert.equal(gating(r).length, 3);
});

test("WPT: a declaration covers its feature only; without recorded features it must list the tests", () => {
  const before = { "css/CSS2/box/a.html": "fail", "css/CSS2/box/b.html": "fail" };
  const after = { "css/CSS2/box/a.html": "unsupported", "css/CSS2/box/b.html": "unsupported" };
  const decl = { feature: "css:page-varying-width", reason: "r", evidence: "e" };
  const features = {
    unsupportedFeatures: {
      "css/CSS2/box/a.html": "css:page-varying-width",
      "css/CSS2/box/b.html": "css:grid",
    },
  };
  const r = wptPair(before, after, features, { declared: [decl] });
  assert.equal(byKey(r, "wpt|css/CSS2/box/a.html").class, "declared");
  assert.equal(byKey(r, "wpt|css/CSS2/box/a.html").declaredAs.feature, decl.feature);
  // b was rejected for another feature: it still gates.
  assert.deepEqual(
    gating(r).map((i) => i.key),
    ["wpt|css/CSS2/box/b.html"],
  );
  // No recorded features (committed expectations before unsupportedFeatures): a feature-only
  // declaration covers nothing; listing the tests covers them.
  assert.equal(gating(wptPair(before, after, {}, { declared: [decl] })).length, 2);
  const listed = wptPair(
    before,
    after,
    {},
    {
      declared: [{ ...decl, tests: ["css/CSS2/box/a.html", "css/CSS2/box/b.html"] }],
    },
  );
  assert.equal(gating(listed).length, 0);
  // Listing a test whose recorded feature differs does not cover it.
  const mismatch = wptPair(before, after, features, {
    declared: [{ ...decl, tests: ["css/CSS2/box/b.html"] }],
  });
  assert.equal(byKey(mismatch, "wpt|css/CSS2/box/b.html").class, "rejection");
});

test("rows: a measured row now 'strict gate rejected: <feature>' is a rejection even when FAIL stays FAIL", () => {
  const before = snapshot([
    fixture("danfe", [
      v("DANFE-X1", "corpus", "FAIL", "24/26 missing @a"),
      v("DANFE-P1", "corpus", "PASS", "1 (expected 1)"),
    ]),
  ]);
  const after = snapshot([
    fixture("danfe", [
      v("DANFE-X1", "corpus", "FAIL", "strict gate rejected: css:grid"),
      v("DANFE-P1", "corpus", "FAIL", "strict gate rejected: css:grid"),
    ]),
  ]);
  const r = compareSnapshots(before, after);
  const x1 = byKey(r, "danfe|DANFE-X1|corpus||criterion#1");
  assert.deepEqual([x1.class, x1.gating, x1.feature], ["rejection", true, "css:grid"]);
  // Its metric is no longer reported: a rejection too (same feature), not a plain regression.
  const found = byKey(r, "danfe|DANFE-X1|corpus||criterion#1|found");
  assert.deepEqual([found.class, found.feature], ["rejection", "css:grid"]);
  assert.equal(byKey(r, "danfe|DANFE-P1|corpus||criterion#1").class, "rejection");
  // A declaration by fixture prefix and feature covers all of them.
  const ok = compareSnapshots(before, after, {
    declared: [{ feature: "css:grid", reason: "r", evidence: "e", keyPrefix: "danfe|" }],
  });
  assert.equal(ok.verdict, "PASS");
  assert.ok(ok.items.filter((i) => i.class === "declared").length >= 3);
  // ...and a declaration of another feature covers none.
  const other = compareSnapshots(before, after, {
    declared: [{ feature: "css:transform", reason: "r", evidence: "e", keyPrefix: "danfe|" }],
  });
  assert.equal(other.verdict, "FAIL");
});

test("rows: measured -> NOT-RUN or absent still gates, and is declarable only by listing its keys", () => {
  const before = snapshot([
    fixture("danfe", [
      v("DANFE-X1", "corpus", "FAIL", "24/26 missing @a"),
      v("DANFE-P1", "corpus", "PASS", "1 (expected 1)"),
    ]),
  ]);
  const after = snapshot([
    fixture("danfe", [v("DANFE-X1", "corpus", "NOT-RUN", "vellora rejected the fixture")]),
  ]);
  const r = compareSnapshots(before, after);
  assert.equal(byKey(r, "danfe|DANFE-X1|corpus||criterion#1").class, "regression");
  assert.equal(byKey(r, "danfe|DANFE-P1|corpus||criterion#1").class, "removed");
  const decl = { feature: "css:grid", reason: "r", evidence: "e" };
  // A prefix cannot declare a feature-less NOT-RUN (it might be a missing tool, not a rejection).
  const byPrefix = compareSnapshots(before, after, {
    declared: [{ ...decl, keyPrefix: "danfe|" }],
  });
  assert.equal(gating(byPrefix).length, gating(r).length);
  const keys = ["danfe|DANFE-X1|corpus||criterion#1", "danfe|DANFE-P1|corpus||criterion#1"];
  const ok = compareSnapshots(before, after, { declared: [{ ...decl, keys }] });
  assert.deepEqual(
    keys.map((k) => byKey(ok, k).class),
    ["declared", "declared"],
  );
});

test("a plain value regression of a still-measured row is never declarable", () => {
  const refw = (max) =>
    v(
      "REF-W",
      "oracles:layout",
      "FAIL",
      `max ${max} mm, p95 1 mm over 235 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1)`,
      { mode: "plain" },
    );
  const key = "n|REF-W|oracles:layout|plain|criterion#1|maxMm";
  const r = compareSnapshots(
    snapshot([fixture("n", [refw(1)])]),
    snapshot([fixture("n", [refw(5)])]),
    {
      declared: [{ feature: "x", reason: "r", evidence: "e", keys: [key] }],
    },
  );
  assert.equal(byKey(r, key).class, "regression");
  assert.equal(
    matchesDeclaration({ check: "wpt", test: "t", feature: null }, { feature: "x" }),
    false,
  );
});

test("D6: lost flagged passes are reported, not gating, and counted in the totals", () => {
  const before = expectations(
    { "css/CSS2/box/a.html": "pass", "css/CSS2/box/b.html": "pass" },
    {
      "css/CSS2/box/a.html": "ink-missing-vs-chrome",
      "css/CSS2/box/b.html": "ink-missing-vs-chrome",
    },
  );
  const after = expectations({
    "css/CSS2/box/a.html": "fail",
    "css/CSS2/box/b.html": "pass-blank",
  });
  const r = compareSnapshots(
    snapshot([], { wpt: { expectations: before } }),
    snapshot([], { wpt: { expectations: after } }),
  );
  assert.equal(r.verdict, "PASS");
  assert.equal(r.counts.flaggedPassLost, 2);
  assert.equal(r.counts.reported, 2);
});

test("accepted.json: class b entries are refused (DEBT.json); declarations need feature, reason, evidence", () => {
  const dir = mkdtempSync(join(tmpdir(), "gate-decl-"));
  const file = join(dir, "accepted.json");
  writeFileSync(
    file,
    JSON.stringify({
      acceptedRegressions: [{ key: "k", reason: "r", evidence: "e", class: "a" }],
      declaredRejections: [{ feature: "css:grid", reason: "r", evidence: "e" }],
    }),
  );
  assert.equal(readAcceptances(file).length, 1);
  assert.equal(readDeclarations(file).length, 1);
  writeFileSync(
    file,
    JSON.stringify({ acceptedRegressions: [{ key: "k", reason: "r", evidence: "e", class: "b" }] }),
  );
  assert.throws(() => readAcceptances(file), /DEBT\.json/);
  writeFileSync(file, JSON.stringify({ declaredRejections: [{ feature: "css:grid" }] }));
  assert.throws(() => readDeclarations(file), /feature, reason and evidence/);
});
