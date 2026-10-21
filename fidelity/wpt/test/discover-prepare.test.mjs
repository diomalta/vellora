import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { classify, splitName } from "../lib/discover.mjs";
import {
  firstAtPageBodyOffset,
  prepareNode,
  styleInsertionPoint,
  xhtmlHazards,
} from "../lib/prepare.mjs";
import { readFamilyNames } from "../lib/sfnt.mjs";

const REF = `<link rel="match" href="x-ref.html">`;

test("file-name flags follow SourceFile.__init__", () => {
  assert.deepEqual(splitName("a-print.html"), {
    name: "a-print",
    ext: ".html",
    typeFlag: "print",
    metaFlags: [],
  });
  assert.deepEqual(splitName("t-001.sub.html").metaFlags, ["sub"]);
  assert.equal(splitName("a-print-001.html").typeFlag, "001");
});

test("classification order mirrors manifest_items", () => {
  assert.equal(classify("css/x/support/a.html", REF).kind, "non-test");
  assert.equal(classify("css/x/a-manual.html", REF).kind, "manual");
  assert.equal(classify("css/x/a-crash.html", REF).kind, "crashtest");
  const print = classify("css/x/a-print.html", REF);
  assert.equal(print.kind, "reftest");
  assert.equal(print.print, true);
  assert.equal(classify("css/x/print/a.html", REF).print, true);
  assert.equal(classify("css/x/a-print-001.html", REF).print, false);
  assert.equal(
    classify("css/x/a.html", `${REF}<meta name="flags" content="paged">`).kind,
    "css-manual",
  );
  assert.equal(
    classify("css/x/a-ref.html", `${REF}<meta name="flags" content="paged">`).kind,
    "reftest",
  );
  assert.equal(
    classify("css/x/a.html", `<script src="/resources/testharness.js"></script>`).kind,
    "testharness",
  );
  assert.equal(classify("css/x/a-ref.html", "<p>").kind, "non-test");
  assert.equal(classify("css/x/a.html", `<link rel="help" href="x">`).kind, "visual");
});

test("style insertion never lands between the doctype and an explicit <html>", () => {
  const doc = `<!DOCTYPE html PUBLIC "x"><html xmlns="y"><head><title>t</title></head>`;
  const p = styleInsertionPoint(doc);
  assert.equal(p.where, "after-head");
  assert.equal(doc.slice(0, p.offset).endsWith("<head>"), true);
  assert.equal(styleInsertionPoint("<!doctype html><p>x").where, "after-doctype");
});

test("first @page offset mirrors vellora-core extract_at_page_block", () => {
  const html = `<style>p{}</style><style>@page :first { margin: 1in; @top-center { content: "x" } } @page { size: 1in }</style>`;
  const at = firstAtPageBodyOffset(html);
  assert.equal(html.slice(at - 1, at + 8), "{ margin:");
  assert.equal(firstAtPageBodyOffset("<p>@page { size: 1in }</p>"), -1);
});

function tree() {
  const root = mkdtempSync(join(tmpdir(), "wpt-prep-"));
  mkdirSync(join(root, "css", "a", "support"), { recursive: true });
  writeFileSync(join(root, "css", "a", "support", "s.css"), "@import 'more.css'; p { color: red }");
  writeFileSync(join(root, "css", "a", "support", "more.css"), "div { color: blue }");
  writeFileSync(
    join(root, "css", "a", "support", "img.png"),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  return root;
}

test("prepare: stylesheet inlining, image keys, screen @page first, print @page merged", () => {
  const root = tree();
  try {
    const url = "http://web-platform.test:8000/css/a/t.html";
    const content = `<!doctype html><html><head><link rel="stylesheet" href="support/s.css"><style>@page { size: 2in 1in }</style></head><body><img src="support/img.png"><img src="missing.png" width=1 height=1></body></html>`;
    const screen = prepareNode({
      wptRoot: root,
      rel: "css/a/t.html",
      url,
      content,
      mode: "screen",
    });
    assert.equal(screen.info.inlinedStylesheets, 1);
    assert.equal(screen.info.inlinedImports, 1);
    assert.match(screen.html, /div \{ color: blue \}/);
    assert.equal(
      screen.html.indexOf("@page { size: 800px 600px; margin: 0 }") <
        screen.html.indexOf("size: 2in"),
      true,
    );
    assert.deepEqual(Object.keys(screen.images), [
      "http://web-platform.test:8000/css/a/support/img.png",
    ]);
    assert.equal(screen.info.imgWithoutDimAttrs, 1);
    assert.ok(screen.info.missingResources.some((m) => m.endsWith("missing.png")));
    assert.ok(screen.info.missingResources.includes("fonts/Ahem.ttf"));
    const print = prepareNode({ wptRoot: root, rel: "css/a/t.html", url, content, mode: "print" });
    assert.equal(print.info.pageInjection, "merged-into-author-@page");
    assert.match(print.html, /@page \{ size: 5in 3in; margin: 0\.5in;\s+size: 2in 1in \}/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("XHTML-as-HTML hazards are flagged", () => {
  assert.deepEqual(xhtmlHazards("a.xht", "<style><![CDATA[p{}]]></style><div/>"), [
    "cdata",
    "self-closing:div",
  ]);
  assert.deepEqual(xhtmlHazards("a.xht", "<br/><img src=x />"), []);
  assert.deepEqual(xhtmlHazards("a.html", "<div/>"), []);
});

test("sfnt name table: family names are read from a minimal font", () => {
  // Offset table with one 'name' table holding nameID 1 = "Ahem" (Windows, UTF-16BE).
  const str = Buffer.from("\u0000A\u0000h\u0000e\u0000m", "latin1");
  const name = Buffer.alloc(6 + 12 + str.length);
  name.writeUInt16BE(0, 0);
  name.writeUInt16BE(1, 2);
  name.writeUInt16BE(18, 4);
  name.writeUInt16BE(3, 6);
  name.writeUInt16BE(1, 8);
  name.writeUInt16BE(0x409, 10);
  name.writeUInt16BE(1, 12);
  name.writeUInt16BE(str.length, 14);
  name.writeUInt16BE(0, 16);
  str.copy(name, 18);
  const head = Buffer.alloc(12 + 16);
  head.writeUInt32BE(0x00010000, 0);
  head.writeUInt16BE(1, 4);
  head.write("name", 12, "ascii");
  head.writeUInt32BE(28, 20);
  head.writeUInt32BE(name.length, 24);
  assert.deepEqual(readFamilyNames(new Uint8Array(Buffer.concat([head, name]))), {
    family: "Ahem",
    typographicFamily: null,
  });
});
