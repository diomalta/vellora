import { describe, expect, expectTypeOf, test } from "vitest";
import {
  type BridgeRenderOptions,
  MockNativeBridge,
  type NativeBridge,
  type UnsupportedDiagnostic,
  VelloraUnsupportedError,
  unsupportedFromDiagnostic,
} from "../src/index";

const OPTIONS: BridgeRenderOptions = {
  metadata: { creationDate: "2000-01-01T00:00:00.000Z" },
};

describe("mock native bridge (task 7.1)", () => {
  test("records the final HTML and resolved options per call", async () => {
    const bridge = new MockNativeBridge();
    await bridge.render("<p>a</p>", OPTIONS);
    expect(bridge.calls).toHaveLength(1);
    expect(bridge.calls[0]?.html).toBe("<p>a</p>");
    expect(bridge.calls[0]?.options).toEqual(OPTIONS);
  });

  test("returns deterministic PDF-shaped bytes for identical inputs", async () => {
    const a = await new MockNativeBridge().render("<p>a</p>", OPTIONS);
    const b = await new MockNativeBridge().render("<p>a</p>", OPTIONS);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    const text = new TextDecoder().decode(a);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  test("different HTML yields different bytes", async () => {
    const a = await new MockNativeBridge().render("<p>a</p>", OPTIONS);
    const b = await new MockNativeBridge().render("<p>b</p>", OPTIONS);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
  });
});

describe("bridge interface contract (task 7.2)", () => {
  test("MockNativeBridge satisfies the NativeBridge type (drop-in)", () => {
    const bridge: NativeBridge = new MockNativeBridge();
    expectTypeOf(bridge).toMatchTypeOf<NativeBridge>();
    expectTypeOf<MockNativeBridge>().toMatchTypeOf<NativeBridge>();
    expectTypeOf<NativeBridge["render"]>().parameters.toEqualTypeOf<
      [string, BridgeRenderOptions]
    >();
    expectTypeOf<NativeBridge["render"]>().returns.resolves.toEqualTypeOf<Uint8Array>();
  });

  test("out-of-subset rejection carries the structured located fields, preserved verbatim", async () => {
    const bridge = new MockNativeBridge();
    const reason = await bridge.render("<script>x()</script>", OPTIONS).catch((e) => e);
    const diagnostic = reason as UnsupportedDiagnostic;
    expect(typeof diagnostic.feature).toBe("string");
    expect(typeof diagnostic.line).toBe("number");
    expect(typeof diagnostic.col).toBe("number");
    expect(typeof diagnostic.hint).toBe("string");

    const typed = unsupportedFromDiagnostic(diagnostic);
    expect(typed).toBeInstanceOf(VelloraUnsupportedError);
    expect(typed?.feature).toBe(diagnostic.feature);
    expect(typed?.line).toBe(diagnostic.line);
    expect(typed?.col).toBe(diagnostic.col);
    expect(typed?.hint).toBe(diagnostic.hint);
  });
});
