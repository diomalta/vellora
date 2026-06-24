import { expect, test } from "vitest";
import { CONFORMANT_FIXTURE_IDS, list, listAll, resolveById } from "../src/fixtures";

test("list returns the four conformant fixtures with id, html, and data", () => {
  const fx = list();
  expect(fx.map((f) => f.id).sort()).toEqual([...CONFORMANT_FIXTURE_IDS].sort());
  for (const f of fx) {
    expect(f.html).toContain("<");
    expect(typeof f.data).toBe("object");
    expect(f.conformant).toBe(true);
  }
});

test("listAll exposes the broken variant under a labeled, distinct id", () => {
  const all = listAll();
  const broken = all.find((f) => f.id === "invoice-broken");
  expect(broken).toBeDefined();
  expect(broken?.conformant).toBe(false);
  expect(all.filter((f) => f.conformant).map((f) => f.id)).not.toContain("invoice-broken");
});

test("resolveById returns html + data for a known id", () => {
  const f = resolveById("invoice");
  expect(f.html).toContain("<");
  expect(typeof f.data).toBe("object");
});

test("resolveById throws a clear error for an unknown id", () => {
  expect(() => resolveById("does-not-exist")).toThrow(/Unknown fixture id "does-not-exist"/);
});
