import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";
import { platformTag } from "../src/index";

// Port step 09 (review blocker): a stack overflow inside the addon is not a panic, so it is not
// turned into a rejected promise; it kills the process. At port step 08, 20 000 nested
// `@media all {` exited with SIGILL (132) here. Each input is rendered in a CHILD process through
// the real addon, so an abort shows up as a signal / non-zero exit instead of killing vitest.

const PKG_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // packages/native
const ADDON = join(PKG_DIR, `vellora.${platformTag()}.node`);

beforeAll(() => {
  if (!existsSync(ADDON)) {
    execFileSync("npm", ["run", "build:addon"], { cwd: PKG_DIR, stdio: "inherit" });
  }
}, 600_000);

const DEPTH = 200_000;

// The child: build the input, render it once, print the outcome as one JSON line.
const CHILD = `
import { createRequire } from "node:module";
const [addonPath, kind, depthArg] = process.argv.slice(1);
const depth = Number(depthArg);
const addon = createRequire(import.meta.url)(addonPath);
const nest = (open, close) =>
  "<!DOCTYPE html><html><head><style>" + open.repeat(depth) +
  "@page { margin: 7mm } p { margin: 0 }" + close.repeat(depth) +
  "</style></head><body><p>x</p></body></html>";
const inputs = {
  media: () => nest("@media all { ", "}"),
  layer: () => nest("@layer a { ", "}"),
  supports: () => nest("@supports (display: block) { ", "}"),
  divs: () => "<!DOCTYPE html><html><body>" + "<div>".repeat(depth) + "x</body></html>",
};
try {
  const pdf = await addon.render(new TextEncoder().encode(inputs[kind]()), { creationDate: [2000, 1, 1] });
  console.log(JSON.stringify({ pdf: Buffer.from(pdf.subarray(0, 5)).toString("latin1") }));
} catch (e) {
  console.log(JSON.stringify({ error: { name: e.name, feature: e.feature, line: e.line, col: e.col, hint: e.hint } }));
}
`;

function renderInChild(kind: string) {
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "-e", CHILD, ADDON, kind, String(DEPTH)],
    { encoding: "utf8", timeout: 120_000, maxBuffer: 1 << 20 },
  );
  return {
    status: child.status,
    signal: child.signal,
    stderr: child.stderr,
    outcome: child.status === 0 ? JSON.parse(child.stdout.trim().split("\n").pop() ?? "{}") : null,
  };
}

describe("deeply nested input through the real addon", () => {
  test.each(["media", "layer", "supports", "divs"])(
    "%s nested 200000 deep renders or rejects, never crashes the process",
    (kind) => {
      const { status, signal, stderr, outcome } = renderInChild(kind);
      expect({ status, signal, stderr }).toEqual({ status: 0, signal: null, stderr: "" });
      if (outcome.pdf !== undefined) {
        expect(outcome.pdf).toBe("%PDF-");
      } else {
        // The located-diagnostic contract `{ feature, line, col, hint }`.
        expect(typeof outcome.error.feature).toBe("string");
        expect(outcome.error.line === null || typeof outcome.error.line === "number").toBe(true);
        expect(outcome.error.col === null || typeof outcome.error.col === "number").toBe(true);
        expect(typeof outcome.error.hint).toBe("string");
      }
      if (kind === "divs") {
        expect(outcome.error?.feature).toBe("max-nesting-depth");
      } else {
        expect(outcome.pdf).toBe("%PDF-");
      }
    },
    150_000,
  );
});
