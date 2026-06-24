import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { compareGolden } from "../src/golden";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "vellora-golden-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

test("update mode records a golden, then a normal run matches", () => {
  expect(
    compareGolden("synthetic", bytes("hello world"), { goldenDir: dir, update: true }).pass,
  ).toBe(true);
  expect(
    compareGolden("synthetic", bytes("hello world"), { goldenDir: dir, update: false }).pass,
  ).toBe(true);
});

test("mismatch reports a structured diff and leaves the golden unchanged", () => {
  compareGolden("synthetic", bytes("hello world"), { goldenDir: dir, update: true });
  const before = readFileSync(join(dir, "synthetic.golden"));
  const cmp = compareGolden("synthetic", bytes("hello WORLD"), { goldenDir: dir, update: false });
  expect(cmp.pass).toBe(false);
  expect(cmp.diff).toMatch(/offset|size/);
  expect(readFileSync(join(dir, "synthetic.golden")).equals(before)).toBe(true);
});

test("a missing golden fails without writing anything", () => {
  const cmp = compareGolden("absent", bytes("x"), { goldenDir: dir, update: false });
  expect(cmp.pass).toBe(false);
  expect(cmp.diff).toContain("no golden");
});

test("renderer-agnostic: an arbitrary binary artifact compares by bytes", () => {
  const blob = new Uint8Array([0, 1, 2, 255, 254]);
  compareGolden("blob", blob, { goldenDir: dir, update: true });
  expect(compareGolden("blob", blob, { goldenDir: dir, update: false }).pass).toBe(true);
  expect(compareGolden("blob", new Uint8Array([0, 1, 2, 255, 253]), { goldenDir: dir }).pass).toBe(
    false,
  );
});
