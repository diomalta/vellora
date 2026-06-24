import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, expect, test } from "vitest";
import {
  RESOLUTION_TABLE,
  SUPPORTED_PLATFORMS,
  coreName,
  platformTag,
  unsupportedPlatformError,
} from "../src/index";

const PKG_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // packages/native
const ADDON = join(PKG_DIR, `vellora.${platformTag()}.node`);

beforeAll(() => {
  // Build via the package script (single source of truth) if the addon is absent.
  if (!existsSync(ADDON)) {
    execFileSync("npm", ["run", "build:addon"], { cwd: PKG_DIR, stdio: "inherit" });
  }
}, 300_000);

test("builds, loads, and calls the addon in-process", () => {
  expect(coreName()).toBe("vellora-core");
});

test("actionable error names the platform and supported targets", () => {
  const err = unsupportedPlatformError("win32", "x64");
  expect(err.message).toContain("win32-x64");
  expect(err.message).toContain(SUPPORTED_PLATFORMS[0]);
  expect(err.message).toContain("napi build");
});

test("Linux resolution key includes libc: linux+x64+gnu -> linux-x64-gnu", () => {
  // The gnu/musl suffix comes from the host's libc detection, so accept either.
  const tag = platformTag("linux", "x64");
  expect(tag).toMatch(/^linux-x64-(gnu|musl)$/);
  expect(RESOLUTION_TABLE["linux-x64-gnu"]).toBe("@vellora/native-linux-x64-gnu");
});

test("resolution table publishes the launch matrix; later-phase key is reserved", () => {
  expect(RESOLUTION_TABLE["darwin-arm64"]).toBe("@vellora/native-darwin-arm64");
  expect(RESOLUTION_TABLE["linux-x64-gnu"]).toBe("@vellora/native-linux-x64-gnu");
  const published = Object.entries(RESOLUTION_TABLE)
    .filter(([, pkg]) => pkg !== null)
    .map(([key]) => key)
    .sort();
  expect(published).toEqual([
    "darwin-arm64",
    "darwin-x64",
    "linux-arm64-gnu",
    "linux-x64-gnu",
    "linux-x64-musl",
  ]);
  expect(RESOLUTION_TABLE["linux-arm64-musl"]).toBeNull();
});

test("adding a target is additive: a registered key resolves to its package via the table", () => {
  // Registering the reserved key via the same table is purely additive (no loader-shape change).
  const registered: Record<string, string | null> = {
    ...RESOLUTION_TABLE,
    "linux-arm64-musl": "@vellora/native-linux-arm64-musl",
  };
  expect(registered["linux-arm64-musl"]).toBe("@vellora/native-linux-arm64-musl");
  expect(registered["darwin-arm64"]).toBe("@vellora/native-darwin-arm64");
});

test("optionalDependencies match the generated npm/* platform packages 1:1", () => {
  const pkg = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));
  const optionalKeys = Object.keys(pkg.optionalDependencies ?? {}).sort();
  const npmPkgNames = readdirSync(join(PKG_DIR, "npm"))
    .map((d) => JSON.parse(readFileSync(join(PKG_DIR, "npm", d, "package.json"), "utf8")).name)
    .sort();
  expect(optionalKeys).toEqual(npmPkgNames);
  // Reserved (null) RESOLUTION_TABLE entries must NOT appear as optionalDependencies.
  for (const [tag, name] of Object.entries(RESOLUTION_TABLE)) {
    if (name === null) expect(optionalKeys).not.toContain(`@vellora/native-${tag}`);
  }
});
