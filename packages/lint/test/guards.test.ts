/**
 * Negative / guard tests: `@vellora/lint` performs no network or filesystem access during
 * `diagnose`/`fix`, and importing the package is side-effect-free (it is dev-time tooling that must
 * never run on, nor be pulled into, the render hot path). Maps to the lint-diagnostics "No network
 * or filesystem access" scenario.
 *
 * Interception strategy: spy on the *default* exports of `node:fs`/`node:net` (configurable objects;
 * the `import * as` namespace is frozen and cannot be spied). `net.Socket.prototype.connect` is the
 * single choke point every outbound socket — and therefore every http/https/fetch request — passes
 * through, so spying it proves no network access regardless of the client used.
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test, vi } from "vitest";
import { diagnose } from "../src/diagnose";
import { fix } from "../src/fix";

const HERE = path.dirname(fileURLToPath(import.meta.url));

const REMOTE_HTML =
  '<!DOCTYPE html><html><head><link rel="stylesheet" href="https://cdn.example/app.css">' +
  '<title>t</title></head><body><img src="https://cdn.example/logo.svg" width="40">' +
  '<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg"><rect width="4" height="4"/></svg>' +
  "</body></html>";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("No network access", () => {
  test("diagnose opens no outbound socket", () => {
    const connect = vi.spyOn(net.Socket.prototype, "connect");
    diagnose(REMOTE_HTML);
    expect(connect).not.toHaveBeenCalled();
  });

  test("fix opens no outbound socket even when rasterizing an SVG", () => {
    const connect = vi.spyOn(net.Socket.prototype, "connect");
    const result = fix(REMOTE_HTML);
    expect(connect).not.toHaveBeenCalled();
    // The inline SVG was rasterized in-process; the remote <img src> reference is left untouched.
    expect(result.html).toContain("data:image/png;base64,");
    expect(result.html).toContain("https://cdn.example/logo.svg");
  });

  test("remote references are reported, not fetched", () => {
    const report = diagnose(REMOTE_HTML);
    const finding = report.findings.find((f) => f.rule === "img-dimension-attrs");
    expect(finding).toBeDefined();
    expect(finding?.snippet).toContain("https://cdn.example/logo.svg");
  });
});

describe("No filesystem access", () => {
  test("diagnose and fix read no files", () => {
    const readFileSync = vi.spyOn(fs, "readFileSync");
    const openSync = vi.spyOn(fs, "openSync");
    const createReadStream = vi.spyOn(fs, "createReadStream");
    diagnose(REMOTE_HTML);
    fix(REMOTE_HTML);
    expect(readFileSync).not.toHaveBeenCalled();
    expect(openSync).not.toHaveBeenCalled();
    expect(createReadStream).not.toHaveBeenCalled();
  });

  test("a local-path asset reference is diagnosed, not read from disk", () => {
    const readFileSync = vi.spyOn(fs, "readFileSync");
    const html = '<!DOCTYPE html><html><body><img src="/etc/hostname" width="10"></body></html>';
    const report = diagnose(html);
    expect(report.findings.some((f) => f.rule === "img-dimension-attrs")).toBe(true);
    expect(readFileSync).not.toHaveBeenCalled();
  });
});

describe("Side-effect-free import (hot-path safety)", () => {
  test("re-importing the package opens no socket and reads no file", async () => {
    const readFileSync = vi.spyOn(fs, "readFileSync");
    const connect = vi.spyOn(net.Socket.prototype, "connect");
    vi.resetModules();
    const mod = await import("../src/index");
    expect(typeof mod.diagnose).toBe("function");
    expect(typeof mod.fix).toBe("function");
    expect(readFileSync).not.toHaveBeenCalled();
    expect(connect).not.toHaveBeenCalled();
  });

  test("the package declares no @vellora/native dependency", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(HERE, "..", "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };
    const all = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.optionalDependencies,
    };
    expect(all["@vellora/native"]).toBeUndefined();
  });
});
