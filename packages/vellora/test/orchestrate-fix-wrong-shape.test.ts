import { describe, expect, test, vi } from "vitest";
import { MockNativeBridge, VelloraError } from "../src/index";
import { orchestrate } from "../src/orchestrate";

// Regression (TS-1): if `@vellora/lint` resolves with a `fix` that returns the OLD `{ html }`
// shape (the exact version-skew/mis-resolution class EH-2 cites), dereferencing `result.report.findings`
// would otherwise throw an opaque `TypeError: Cannot read properties of undefined (reading 'findings')`.
// The shape guard must instead fail loudly with the same typed VelloraError. Mock a wrong-shape `fix`
// for this whole file.
vi.mock("@vellora/lint", () => ({ fix: (html: string) => ({ html }) }));

describe("best-effort mode with @vellora/lint.fix returning the wrong shape", () => {
  test("rejects with a VelloraError mentioning the unexpected shape and never reaches the bridge", async () => {
    const bridge = new MockNativeBridge();
    const err = await orchestrate("<p>ok</p>", { strict: false }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraError);
    expect((err as VelloraError).message).toContain("unexpected shape");
    // The opaque internal TypeError must NOT leak through.
    expect((err as VelloraError).message).not.toContain("findings");
    expect(bridge.calls).toHaveLength(0);
  });
});
