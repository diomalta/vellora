import { describe, expect, test } from "vitest";
import {
  MockNativeBridge,
  type NativeBridge,
  type RenderEnginePolicy,
  VelloraInputError,
  renderPdf,
} from "../src/index";

function bridgeReturning(label: string): NativeBridge & { calls: string[] } {
  return {
    calls: [],
    async render(html, options) {
      this.calls.push(html);
      return new TextEncoder().encode(`%PDF-${label}-${options.metadata.creationDate}-%%EOF`);
    },
  };
}

describe("render engine selection", () => {
  test("omitted engine preserves the native bridge default", async () => {
    const bridge = new MockNativeBridge();

    await renderPdf("<p>native</p>", undefined, { _bridge: bridge } as never);

    expect(bridge.calls[0]?.html).toBe("<p>native</p>");
  });

  test("engine native uses the native bridge override", async () => {
    const bridge = new MockNativeBridge();

    await renderPdf("<p>native</p>", undefined, { engine: "native", _bridge: bridge } as never);

    expect(bridge.calls).toHaveLength(1);
  });

  test("engine chromium uses the optional chromium bridge override", async () => {
    const native = new MockNativeBridge();
    const chromium = bridgeReturning("chromium");

    const pdf = await renderPdf("<p>browser</p>", undefined, {
      engine: "chromium",
      chromium: { pdf: { landscape: true } },
      _bridge: native,
      _chromiumBridge: chromium,
    } as never);

    expect(new TextDecoder().decode(pdf)).toContain("%PDF-chromium");
    expect(native.calls).toHaveLength(0);
    expect(chromium.calls).toEqual(["<p>browser</p>"]);
  });

  test("engine auto routes through a native policy decision", async () => {
    const native = new MockNativeBridge();
    const chromium = bridgeReturning("chromium");
    const policy: RenderEnginePolicy = {
      version: 1,
      templates: {
        invoice: { selectedEngine: "native", reason: "within supported subset" },
      },
    };

    await renderPdf("<p>invoice</p>", undefined, {
      engine: "auto",
      fidelity: { templateId: "invoice" },
      _bridge: native,
      _chromiumBridge: chromium,
      _policy: policy,
    } as never);

    expect(native.calls).toHaveLength(1);
    expect(chromium.calls).toHaveLength(0);
  });

  test("engine auto routes through a chromium policy decision", async () => {
    const native = new MockNativeBridge();
    const chromium = bridgeReturning("chromium");
    const policy: RenderEnginePolicy = {
      version: 1,
      templates: {
        dashboard: { selectedEngine: "chromium", reason: "browser CSS required" },
      },
    };

    const pdf = await renderPdf("<p>dashboard</p>", undefined, {
      engine: "auto",
      fidelity: { templateId: "dashboard" },
      _bridge: native,
      _chromiumBridge: chromium,
      _policy: policy,
    } as never);

    expect(new TextDecoder().decode(pdf)).toContain("%PDF-chromium");
    expect(native.calls).toHaveLength(0);
    expect(chromium.calls).toHaveLength(1);
  });

  test("engine auto requires a template id", async () => {
    await expect(
      renderPdf("<p>x</p>", undefined, {
        engine: "auto",
        _policy: { version: 1, templates: {} },
      } as never),
    ).rejects.toBeInstanceOf(VelloraInputError);
  });

  test("engine auto rejects an unreadable policy", async () => {
    await expect(
      renderPdf("<p>x</p>", undefined, {
        engine: "auto",
        fidelity: { templateId: "invoice", policyPath: "missing-policy.json" },
        _policyReader: async () => {
          throw new Error("missing");
        },
      } as never),
    ).rejects.toBeInstanceOf(VelloraInputError);
  });

  test("invalid engine values reject as input errors", async () => {
    await expect(
      renderPdf("<p>x</p>", undefined, { engine: "webkit" } as never),
    ).rejects.toBeInstanceOf(VelloraInputError);
  });
});
