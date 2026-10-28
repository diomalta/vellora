import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decodePng,
  encodePng,
  imageHash,
  isBlank,
  pageEqual,
  parsePpm,
  pixelDiff,
} from "../lib/pixels.mjs";

function img(w, h, fill = 255) {
  return { width: w, height: h, data: new Uint8Array(w * h * 3).fill(fill) };
}

test("PPM P6 parsing (with comment line)", () => {
  const header = Buffer.from("P6\n# c\n2 1\n255\n", "ascii");
  const p = parsePpm(Buffer.concat([header, Buffer.from([1, 2, 3, 4, 5, 6])]));
  assert.equal(p.width, 2);
  assert.equal(p.height, 1);
  assert.deepEqual([...p.data], [1, 2, 3, 4, 5, 6]);
});

test("PNG encode/decode round trip", () => {
  const a = img(3, 2, 0);
  a.data.set([255, 0, 0], 0);
  a.data.set([1, 2, 3], 15);
  const b = decodePng(encodePng(a));
  assert.equal(b.width, 3);
  assert.equal(b.height, 2);
  assert.deepEqual([...b.data], [...a.data]);
  assert.equal(imageHash(a), imageHash(b));
});

test("pixel diff: max per-channel difference and differing pixel count", () => {
  const a = img(2, 2);
  const b = img(2, 2);
  b.data[1] = 250; // pixel 0, channel g: 5
  b.data[9] = 0; // pixel 3, channel r: 255
  assert.deepEqual(pixelDiff(a, b), { maxDifference: 255, totalPixels: 2, sizeMismatch: false });
  assert.equal(pixelDiff(a, img(2, 3)).sizeMismatch, true);
  assert.equal(isBlank(a), true);
  assert.equal(isBlank(b), false);
});

test("pageEqual implements wptrunner check_pass including zero-minimum cases", () => {
  const same = { maxDifference: 0, totalPixels: 0 };
  const small = { maxDifference: 3, totalPixels: 10 };
  assert.equal(pageEqual(same, null), true);
  assert.equal(pageEqual(small, null), false);
  assert.equal(pageEqual(small, { maxDifference: [0, 5], totalPixels: [0, 20] }), true);
  assert.equal(pageEqual(small, { maxDifference: [4, 5], totalPixels: [0, 20] }), false);
  // A minimum > 0 requires a difference to exist (both ranges exclude zero)...
  assert.equal(pageEqual(same, { maxDifference: [1, 5], totalPixels: [1, 20] }), false);
  // ...unless one range allows zero: identical images then pass.
  assert.equal(pageEqual(same, { maxDifference: [0, 5], totalPixels: [1, 20] }), true);
  assert.equal(
    pageEqual({ ...small, sizeMismatch: true }, { maxDifference: [0, 255], totalPixels: [0, 1e9] }),
    false,
  );
});
