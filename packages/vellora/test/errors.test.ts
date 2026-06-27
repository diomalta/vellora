import { describe, expect, test } from "vitest";
import {
  type ConformanceDiagnostic,
  type UnsupportedDiagnostic,
  VelloraConformanceError,
  VelloraError,
  VelloraInputError,
  VelloraTemplateError,
  VelloraUnsupportedError,
  conformanceFromDiagnostic,
  isConformanceDiagnostic,
  isUnsupportedDiagnostic,
  unsupportedFromDiagnostic,
} from "../src/index";

const diagnostic: UnsupportedDiagnostic = {
  feature: "inline-script",
  line: 42,
  col: 7,
  hint: "run vellora fix",
};

const conformance: ConformanceDiagnostic = {
  profile: "PDF/A-2b",
  errors: ["MissingDocumentDate (Validators { a: Some(A2_B), ua: None })"],
};

describe("error contract", () => {
  test("every subclass is instanceof VelloraError", () => {
    expect(new VelloraTemplateError("x")).toBeInstanceOf(VelloraError);
    expect(new VelloraInputError("x")).toBeInstanceOf(VelloraError);
    expect(new VelloraConformanceError(conformance)).toBeInstanceOf(VelloraError);
    expect(new VelloraUnsupportedError(diagnostic)).toBeInstanceOf(VelloraError);
  });

  test("codes are stable and machine-readable", () => {
    expect(new VelloraError("x").code).toBe("VELLORA_ERROR");
    expect(new VelloraTemplateError("x").code).toBe("VELLORA_TEMPLATE_ERROR");
    expect(new VelloraInputError("x").code).toBe("VELLORA_INPUT_ERROR");
    expect(new VelloraConformanceError(conformance).code).toBe("VELLORA_CONFORMANCE");
    expect(new VelloraUnsupportedError(diagnostic).code).toBe("VELLORA_UNSUPPORTED");
  });

  test("each subclass keeps a distinct name and is a real Error", () => {
    expect(new VelloraTemplateError("x").name).toBe("VelloraTemplateError");
    expect(new VelloraInputError("x").name).toBe("VelloraInputError");
    expect(new VelloraConformanceError(conformance).name).toBe("VelloraConformanceError");
    expect(new VelloraUnsupportedError(diagnostic).name).toBe("VelloraUnsupportedError");
    expect(new VelloraConformanceError(conformance)).toBeInstanceOf(Error);
    expect(new VelloraUnsupportedError(diagnostic)).toBeInstanceOf(Error);
  });

  test("VelloraTemplateError carries token location when provided", () => {
    const err = new VelloraTemplateError("bad", { line: 3, col: 5 });
    expect(err.line).toBe(3);
    expect(err.col).toBe(5);
  });

  test("VelloraInputError preserves an underlying cause", () => {
    const cause = new Error("boom");
    const err = new VelloraInputError("stream failed", { cause });
    expect((err as { cause?: unknown }).cause).toBe(cause);
  });
});

describe("conformance diagnostic adapter", () => {
  test("preserves profile and validator errors verbatim", () => {
    const err = new VelloraConformanceError(conformance);
    expect(err.profile).toBe("PDF/A-2b");
    expect(err.errors).toEqual(conformance.errors);
    expect(err.message).toContain("PDF/A-2b");
    expect(err.message).toContain("MissingDocumentDate");
  });

  test("isConformanceDiagnostic accepts the structured shape and rejects others", () => {
    expect(isConformanceDiagnostic(conformance)).toBe(true);
    expect(isConformanceDiagnostic({ profile: "PDF/A-2b" })).toBe(false);
    expect(isConformanceDiagnostic({ profile: "PDF/A-2b", errors: [1] })).toBe(false);
    expect(isConformanceDiagnostic(null)).toBe(false);
  });

  test("maps a raw conformance object to a typed error", () => {
    const err = conformanceFromDiagnostic(conformance);
    expect(err).toBeInstanceOf(VelloraConformanceError);
    expect(err?.profile).toBe("PDF/A-2b");
  });

  test("passes through an existing VelloraConformanceError unchanged", () => {
    const original = new VelloraConformanceError(conformance);
    expect(conformanceFromDiagnostic(original)).toBe(original);
  });

  test("returns undefined for unrelated rejections", () => {
    expect(conformanceFromDiagnostic(new Error("network"))).toBeUndefined();
    expect(conformanceFromDiagnostic("oops")).toBeUndefined();
  });
});

describe("unsupported diagnostic adapter", () => {
  test("preserves feature/line/col/hint verbatim", () => {
    const err = new VelloraUnsupportedError(diagnostic);
    expect(err.feature).toBe("inline-script");
    expect(err.line).toBe(42);
    expect(err.col).toBe(7);
    expect(err.hint).toBe("run vellora fix");
    expect(err.message).toContain("inline-script");
    expect(err.message).toContain("run vellora fix");
  });

  test("isUnsupportedDiagnostic accepts the structured shape and rejects others", () => {
    expect(isUnsupportedDiagnostic(diagnostic)).toBe(true);
    expect(isUnsupportedDiagnostic({ feature: "x" })).toBe(false);
    expect(isUnsupportedDiagnostic(null)).toBe(false);
    expect(isUnsupportedDiagnostic("nope")).toBe(false);
  });

  test("maps a raw diagnostic object to a typed error", () => {
    const err = unsupportedFromDiagnostic(diagnostic);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err?.line).toBe(42);
  });

  test("maps an error carrying a nested diagnostic property", () => {
    const carrier = Object.assign(new Error("flattened"), { diagnostic });
    const err = unsupportedFromDiagnostic(carrier);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err?.hint).toBe("run vellora fix");
  });

  test("passes through an existing VelloraUnsupportedError unchanged", () => {
    const original = new VelloraUnsupportedError(diagnostic);
    expect(unsupportedFromDiagnostic(original)).toBe(original);
  });

  test("returns undefined for an unrelated rejection", () => {
    expect(unsupportedFromDiagnostic(new Error("network"))).toBeUndefined();
    expect(unsupportedFromDiagnostic("oops")).toBeUndefined();
  });

  // Regression: the core emits null line/col when the source position is unknown. The guard
  // and adapter must accept that so the typed error is not lost and a raw error does not leak.
  test("a diagnostic with null line/col is still recognized and mapped", () => {
    const located: UnsupportedDiagnostic = {
      feature: "denied-element",
      line: null,
      col: null,
      hint: "remove the element",
    };
    expect(isUnsupportedDiagnostic(located)).toBe(true);
    const err = unsupportedFromDiagnostic(located);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err?.line).toBeNull();
    expect(err?.col).toBeNull();
    // The message omits the location when both are null, but still carries feature + hint.
    expect(err?.message).toContain("denied-element");
    expect(err?.message).toContain("remove the element");
    expect(err?.message).not.toContain("line");
  });
});
