import { describe, expect, test, vi } from "vitest";
import { MockNativeBridge, VelloraError } from "../src/index";
import { orchestrate } from "../src/orchestrate";

// Regression: if `@vellora/lint` resolves WITHOUT a `fix` export (mis-resolution, wrong
// version, or tree-shaking), best-effort mode must fail loudly with a typed VelloraError instead of
// silently rendering the un-fixed HTML. Mock the module as empty (no `fix`) for this whole file.
vi.mock("@vellora/lint", () => ({ fix: undefined }));

describe("best-effort mode with @vellora/lint.fix unavailable", () => {
  test("rejects with a VelloraError and never reaches the bridge", async () => {
    const bridge = new MockNativeBridge();
    const err = await orchestrate("<p>ok</p>", { strict: false }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraError);
    expect((err as VelloraError).message).toContain("@vellora/lint.fix is unavailable");
    expect(bridge.calls).toHaveLength(0);
  });
});
