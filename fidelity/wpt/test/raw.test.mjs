// Raw-Blitz mode (`run.mjs --raw`, lib/raw.mjs): request encoding, routing of every node to the
// raw bridge, the per-test `rawOutcome` record, the candidate-class rule, and (when the binary,
// the addon and poppler are built/installed) a real run.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { EventEmitter } from "node:events";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  RAW_OUTCOMES,
  attachRawOutcomes,
  oldPassProvenFalse,
  rawCandidateClass,
  rawCrossTab,
  rawRenderProblem,
  withRawOutcomes,
} from "../lib/raw.mjs";
import { makeVelloraRender } from "../lib/vellora-render.mjs";
import { encodeRequest, makeXhtmlBridge, xhtmlRenderBin } from "../lib/xhtml-bridge.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");
const bin = xhtmlRenderBin(repo);

function records(buf) {
  const out = [];
  let at = 4;
  while (at < buf.length) {
    const len = buf.readUInt32LE(at + 1);
    out.push([String.fromCharCode(buf[at]), buf.subarray(at + 5, at + 5 + len).toString()]);
    at += 5 + len;
  }
  return out;
}

test("request: R and S records only in raw mode; the XHTML request is unchanged", () => {
  const plain = encodeRequest("<p>x</p>");
  assert.deepEqual(records(plain), [["H", "<p>x</p>"]]);
  const raw = encodeRequest("<p>x</p>", {}, { raw: true, parser: "html" });
  assert.deepEqual(records(raw), [
    ["H", "<p>x</p>"],
    ["R", "1"],
    ["S", "html"],
  ]);
});

test("render adapter: with rawBridges every node takes the raw bridge of its parser", async () => {
  const seen = [];
  const vellora = {
    async renderPdf(_html, _data, opts) {
      seen.push(opts._bridge ?? null);
      return new Uint8Array([1]);
    },
  };
  const rawHtml = { render: async () => new Uint8Array() };
  const rawXml = { render: async () => new Uint8Array() };
  const xhtml = { render: async () => new Uint8Array() };
  const node = (rel) => ({
    url: `http://web-platform.test/${rel}`,
    rel,
    content: "<html><head></head></html>",
    mode: "screen",
  });
  const render = makeVelloraRender({
    vellora,
    wptRoot: repo,
    xhtmlBridge: xhtml,
    rawBridges: { html: rawHtml, xml: rawXml },
  });
  await render(node("t/a.xht"));
  await render(node("t/a.html"));
  assert.deepEqual(seen, [rawXml, rawHtml]);
  // --xhtml-parser html: no XML raw bridge, so XML-served nodes take the HTML one.
  const htmlOnly = makeVelloraRender({
    vellora,
    wptRoot: repo,
    rawBridges: { html: rawHtml, xml: null },
  });
  await htmlOnly(node("t/a.xht"));
  assert.equal(seen.at(-1), rawHtml);
});

test("bridge: the mode is sent with every request", async () => {
  const sent = [];
  const spawnImpl = () => {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.stdin = {
      on() {},
      end(buf) {
        sent.push(buf);
        child.stdout.emit("data", Buffer.from("%PDF-1.7"));
        child.emit("close", 0, null);
      },
    };
    return child;
  };
  const bridge = makeXhtmlBridge({ bin: "b", mode: { raw: true, parser: "xml" }, spawnImpl });
  await bridge.render("<p/>", {});
  assert.deepEqual(records(sent[0]).slice(1), [
    ["R", "1"],
    ["S", "xml"],
  ]);
});

test("rawOutcome: attached per test, skip stays skip, a missing raw result is an error", () => {
  const results = [
    { test: "a", outcome: "pass" },
    { test: "b", outcome: "fail" },
    { test: "c", outcome: "skip" },
    { test: "d", outcome: "fail" },
  ];
  const raw = new Map([
    ["a", { test: "a", outcome: "pass", comparisons: [{ pass: true }], durationMs: 3 }],
    ["b", { test: "b", outcome: "pass", comparisons: [] }],
  ]);
  attachRawOutcomes(results, raw);
  assert.deepEqual(
    results.map((r) => r.rawOutcome),
    ["pass", "pass", "skip", "error"],
  );
  assert.deepEqual(results[0].raw, { outcome: "pass", comparisons: [{ pass: true }] });
  for (const r of results) assert.ok(RAW_OUTCOMES.includes(r.rawOutcome));
  assert.deepEqual(rawCrossTab(results), {
    counts: { pass: 2, skip: 1, error: 1 },
    matrix: { pass: { pass: 1 }, fail: { pass: 1, error: 1 }, skip: { skip: 1 } },
  });
  const expectations = { schema: 2, results: { a: "pass" } };
  assert.equal(withRawOutcomes(expectations, results, null), expectations);
  const withRaw = withRawOutcomes(expectations, results, { render: "raw" });
  assert.deepEqual(withRaw.rawOutcomes, { a: "pass", b: "pass", c: "skip", d: "error" });
  assert.equal(withRaw.rawMode, "raw");
  assert.equal(withRaw.schema, 2);
});

test("candidate class: old false pass -> a, raw not pass -> b, raw pass -> c", () => {
  const cls = (outcome, rawOutcome, oldPassFalse = false) =>
    rawCandidateClass({ outcome, rawOutcome, oldPassFalse });
  assert.equal(cls("pass", "fail"), "none");
  assert.equal(cls("fail", "pass", true), "a");
  // Chrome failing its own reftest is not the (a) criterion: the class ignores it.
  assert.equal(
    rawCandidateClass({ outcome: "fail", rawOutcome: "fail", chromeOutcome: "fail" }),
    "b",
  );
  assert.equal(cls("fail", "fail"), "b");
  assert.equal(cls("fail", "pass-blank"), "b");
  assert.equal(cls("pass-blank", "fail"), "b");
  assert.equal(cls("fail", "pass"), "c");
  assert.equal(cls("pass-blank", "pass"), "c");
  assert.equal(cls("unsupported", "unsupported"), "none");
  assert.equal(cls("fail", undefined), "none");
  assert.equal(cls("fail", "pass", false), "c");
});

test("old false pass: an ink flag of the old run or an old page count != Chrome's", () => {
  assert.deepEqual(
    oldPassProvenFalse({ flags: "ink-missing-vs-chrome", pages: 1, chromePages: 1 }),
    {
      falsePass: true,
      ink: ["ink-missing-vs-chrome"],
      pageMismatch: false,
    },
  );
  assert.equal(
    oldPassProvenFalse({ flags: "css-url-resource", pages: 1, chromePages: 1 }).falsePass,
    false,
  );
  assert.equal(oldPassProvenFalse({ flags: null, pages: 2, chromePages: 4 }).falsePass, true);
  assert.equal(oldPassProvenFalse({ flags: ["ink-displaced-vs-chrome"] }).falsePass, true);
  assert.equal(oldPassProvenFalse({ flags: null, pages: 1, chromePages: null }).falsePass, false);
});

test("a binary without the raw render is refused before any test runs", () => {
  const old = () => ({
    status: 2,
    stderr: Buffer.from("xhtml_render: unknown record tag 82"),
    stdout: Buffer.alloc(0),
  });
  assert.match(rawRenderProblem("b", { spawn: old }), /unknown record tag 82/);
  const ok = () => ({ status: 0, stdout: Buffer.from("%PDF-1.7 ...") });
  assert.equal(rawRenderProblem("b", { spawn: ok }), null);
  assert.match(rawRenderProblem(null), /no xhtml_render binary/);
});

const addon = existsSync(join(repo, "packages", "vellora", "dist", "index.js"));
test(
  "real xhtml_render: the raw render answers the probe; equal to the product render when nothing is corrected",
  { skip: existsSync(bin) && addon ? false : `xhtml_render or the vellora build missing (${bin})` },
  async () => {
    assert.equal(rawRenderProblem(bin), null);
    const vellora = await import("vellora");
    const html =
      "<!DOCTYPE html><html><head><style>@page { size: 800px 600px; margin: 0 } body { margin: 8px }" +
      "</style></head><body><div style='width:100px;height:100px;background:green'></div></body></html>";
    const raw = makeXhtmlBridge({ bin, mode: { raw: true, parser: "html" } });
    const product = await vellora.renderPdf(html, undefined, { strict: true });
    const rawPdf = await vellora.renderPdf(html, undefined, { strict: true, _bridge: raw });
    assert.deepEqual(Buffer.from(rawPdf), Buffer.from(product));
    // A padded inline span: the product advances the next run by the padding, raw does not.
    const padded =
      "<!DOCTYPE html><html><head><style>@page { size: 800px 600px; margin: 0 }</style></head>" +
      "<body><p><span style='padding-right:40px'>A</span>B</p></body></html>";
    const p2 = await vellora.renderPdf(padded, undefined, { strict: true });
    const r2 = await vellora.renderPdf(padded, undefined, { strict: true, _bridge: raw });
    assert.notDeepEqual(Buffer.from(r2), Buffer.from(p2));
  },
);

const wptCache = join(repo, "fidelity", ".cache", "wpt");
const poppler = spawnSync("pdftocairo", ["-v"]).status === 0;
test(
  "run.mjs --raw: rawOutcome in results.json and rawOutcomes in outcomes.json",
  {
    skip:
      existsSync(bin) && addon && poppler && existsSync(join(wptCache, "fonts", "Ahem.ttf"))
        ? false
        : "needs xhtml_render, the vellora build, poppler and the WPT cache (fonts/Ahem.ttf)",
  },
  () => {
    const root = mkdtempSync(join(tmpdir(), "wpt-raw-"));
    const out = mkdtempSync(join(tmpdir(), "wpt-raw-out-"));
    try {
      mkdirSync(join(root, "fonts"));
      copyFileSync(join(wptCache, "fonts", "Ahem.ttf"), join(root, "fonts", "Ahem.ttf"));
      mkdirSync(join(root, "css", "x"), { recursive: true });
      const page = (body) =>
        `<!DOCTYPE html><html><head><style>p { margin: 0; font: 20px/20px Ahem }</style></head><body>${body}</body></html>`;
      // Passes in both renders: nothing to correct.
      writeFileSync(
        join(root, "css", "x", "same.html"),
        page(`<link rel="match" href="same-ref.html"><p>XX</p>`),
      );
      writeFileSync(join(root, "css", "x", "same-ref.html"), page("<p>XX</p>"));
      // The reference draws the second run 40 px further: the product's padding-right advance
      // matches it, raw Blitz (no advance) does not.
      writeFileSync(
        join(root, "css", "x", "padded.html"),
        page(
          `<link rel="match" href="padded-ref.html"><p><span style="padding-right:40px">X</span>X</p>`,
        ),
      );
      writeFileSync(
        join(root, "css", "x", "padded-ref.html"),
        page(`<p>X<span style="display:inline-block;width:40px"></span>X</p>`),
      );
      const r = spawnSync(
        process.execPath,
        [
          resolve(here, "..", "run.mjs"),
          "--wpt",
          root,
          "--out",
          out,
          "--allow-unpinned",
          "--raw",
          "--xhtml-render",
          bin,
          "--expectations",
          "none",
          "--upstream",
          "none",
          "--jobs",
          "2",
          "--label",
          "raw.test.mjs",
          "css/x",
        ],
        { encoding: "utf8", timeout: 120000 },
      );
      assert.equal(r.status, 0, `${r.stdout}\n${r.stderr}`);
      const results = JSON.parse(readFileSync(join(out, "results.json"), "utf8"));
      const by = Object.fromEntries(results.tests.map((t) => [t.test, t]));
      assert.equal(by["css/x/same.html"].outcome, "pass");
      assert.equal(by["css/x/same.html"].rawOutcome, "pass");
      assert.equal(by["css/x/padded.html"].outcome, "pass");
      assert.equal(by["css/x/padded.html"].rawOutcome, "fail");
      assert.equal(results.config.raw.field, "rawOutcome");
      assert.deepEqual(results.raw.matrix, { pass: { pass: 1, fail: 1 } });
      const outcomes = JSON.parse(readFileSync(join(out, "outcomes.json"), "utf8"));
      assert.deepEqual(outcomes.rawOutcomes, {
        "css/x/padded.html": "fail",
        "css/x/same.html": "pass",
      });
      assert.deepEqual(outcomes.results, {
        "css/x/padded.html": "pass",
        "css/x/same.html": "pass",
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(out, { recursive: true, force: true });
    }
  },
);
