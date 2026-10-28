import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fuzzyFor,
  isTestharness,
  parseFuzzy,
  parseFuzzyValue,
  parsePageRanges,
  parseReferences,
  parseTimeout,
  selectPages,
} from "../lib/html-meta.mjs";

const URL_ = "http://web-platform.test:8000/css/a/test.html";

test("references: match links first, then mismatch; comments ignored; hrefs resolved", () => {
  const html = `
    <link rel="mismatch" href="not-ref.html">
    <!-- <link rel="match" href="commented.html"> -->
    <link href = 'ref.html' rel=match>
    <html:link rel="match" href="/css/reference/x.xht"/>
    <link rel="match stylesheet" href="ignored.html">
    <link rel="stylesheet" href="s.css">`;
  assert.deepEqual(parseReferences(html, URL_), [
    { url: "http://web-platform.test:8000/css/a/ref.html", relation: "==" },
    { url: "http://web-platform.test:8000/css/reference/x.xht", relation: "==" },
    { url: "http://web-platform.test:8000/css/a/not-ref.html", relation: "!=" },
  ]);
});

test("fuzzy values: named, positional, ranges (manifest parse rules)", () => {
  assert.deepEqual(parseFuzzyValue("maxDifference=0-2;totalPixels=0-40"), {
    maxDifference: [0, 2],
    totalPixels: [0, 40],
  });
  assert.deepEqual(parseFuzzyValue("15;300"), { maxDifference: [15, 15], totalPixels: [300, 300] });
  assert.deepEqual(parseFuzzyValue("totalPixels=5-6; maxDifference=1"), {
    maxDifference: [1, 1],
    totalPixels: [5, 6],
  });
  assert.throws(() => parseFuzzyValue("maxDifference=0-2"));
  assert.throws(() => parseFuzzyValue("bogus=1;2"));
});

test("fuzzy keyed to a reference applies to that ref only; unkeyed is the fallback", () => {
  const html = `<link rel=match href=a-ref.html><link rel=match href=b-ref.html>
    <meta name=fuzzy content="0-1;0-10">
    <meta name="fuzzy" content="b-ref.html:maxDifference=0-50;totalPixels=0-500">`;
  const refs = parseReferences(html, URL_);
  const specs = parseFuzzy(html, URL_, refs);
  const b = "http://web-platform.test:8000/css/a/b-ref.html";
  const a = "http://web-platform.test:8000/css/a/a-ref.html";
  assert.deepEqual(fuzzyFor(specs, URL_, b, "=="), {
    maxDifference: [0, 50],
    totalPixels: [0, 500],
  });
  assert.deepEqual(fuzzyFor(specs, URL_, a, "=="), { maxDifference: [0, 1], totalPixels: [0, 10] });
  assert.equal(fuzzyFor([], URL_, a, "=="), null);
  assert.throws(() => parseFuzzy(`<meta name=fuzzy content="nope.html:1;1">`, URL_, refs));
});

test("page ranges + wptrunner get_pages", () => {
  const html = `<link rel=match href=r.html><meta name=reftest-pages content="-2,4,6-">`;
  const ranges = parsePageRanges(html, URL_, parseReferences(html, URL_));
  assert.deepEqual(ranges[URL_], [[null, 2], [4], [6, null]]);
  assert.deepEqual(selectPages(ranges[URL_], 10), [1, 2, 4, 6, 7, 8, 9, 10]);
  assert.deepEqual(selectPages(undefined, 3), [1, 2, 3]);
  assert.deepEqual(selectPages([[5]], 3), []);
});

test("timeout and testharness detection", () => {
  assert.equal(parseTimeout(`<meta name="timeout" content="long">`), "long");
  assert.equal(parseTimeout("<p>"), "normal");
  assert.equal(isTestharness(`<script src="/resources/testharness.js"></script>`), true);
  assert.equal(isTestharness(`<!-- <script src="/resources/testharness.js"></script> -->`), false);
});
