import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  DEFAULT_CREATION_DATE,
  MockNativeBridge,
  type NativeBridge,
  type UnsupportedDiagnostic,
  VelloraConformanceError,
  VelloraError,
  VelloraInputError,
  VelloraUnsupportedError,
  renderPdf,
  resolveOptions,
} from "../src/index";
import { orchestrate } from "../src/orchestrate";

// Mock @vellora/lint so the best-effort path is exercised hermetically (the real fixers are owned by
// `@vellora/lint` and tested there). The mocked `fix` contract matches the real one.
const fixMock = vi.fn((html: string) => ({ html, report: { findings: [] } }));
vi.mock("@vellora/lint", () => ({ fix: (html: string) => fixMock(html) }));

beforeEach(() => {
  fixMock.mockReset();
  fixMock.mockImplementation((html: string) => ({ html, report: { findings: [] } }));
});

const SAFE_HTML = "<p>ok</p>";

/** A bridge that always rejects with a structured located diagnostic. */
class RejectingBridge implements NativeBridge {
  calls = 0;
  constructor(private readonly diagnostic: UnsupportedDiagnostic) {}
  render(): Promise<Uint8Array> {
    this.calls++;
    return Promise.reject(this.diagnostic);
  }
}

/** A bridge that always rejects with a structured conformance diagnostic. */
class RejectingConformanceBridge implements NativeBridge {
  calls = 0;
  render(): Promise<Uint8Array> {
    this.calls++;
    return Promise.reject({
      profile: "PDF/A-2b",
      errors: ["MissingDocumentDate (Validators { a: Some(A2_B), ua: None })"],
    });
  }
}

describe("strict is the default", () => {
  test("omitted strict and explicit strict:true both pass HTML unmutated", async () => {
    for (const opts of [{}, { strict: true }]) {
      const bridge = new MockNativeBridge();
      await orchestrate(SAFE_HTML, opts, bridge);
      expect(bridge.calls).toHaveLength(1);
      expect(bridge.calls[0]?.html).toBe(SAFE_HTML);
    }
  });
});

describe("strict validates and never mutates", () => {
  test("the HTML passed to the bridge equals the templating output byte-for-byte", async () => {
    const bridge = new MockNativeBridge();
    const html = "<div>{% if x %}{{ x }}{% endif %}</div>";
    await orchestrate(html, { strict: true }, bridge);
    expect(bridge.calls[0]?.html).toBe(html);
  });

  test("no @vellora/lint fixer is invoked in strict mode", async () => {
    const bridge = new MockNativeBridge();
    await orchestrate(SAFE_HTML, { strict: true }, bridge);
    expect(fixMock).not.toHaveBeenCalled();
  });

  test("an out-of-subset rejection becomes a located VelloraUnsupportedError", async () => {
    const diagnostic: UnsupportedDiagnostic = {
      feature: "inline-script",
      line: 5,
      col: 3,
      hint: "run vellora fix",
    };
    const bridge = new RejectingBridge(diagnostic);
    const err = await orchestrate(SAFE_HTML, { strict: true }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err.feature).toBe("inline-script");
    expect(err.line).toBe(5);
    expect(err.col).toBe(3);
    expect(err.hint).toBe("run vellora fix");
  });
});

describe("best-effort mode runs lint fixers before core", () => {
  test("strict:false applies fixers before the bridge and renders their output", async () => {
    fixMock.mockImplementation((html: string) => ({
      html: `${html}<!--fixed-->`,
      report: { conformant: true, findings: [] },
    }));
    const bridge = new MockNativeBridge();
    await orchestrate(SAFE_HTML, { strict: false }, bridge);
    expect(fixMock).toHaveBeenCalledTimes(1);
    expect(fixMock).toHaveBeenCalledWith(SAFE_HTML);
    expect(bridge.calls[0]?.html).toBe(`${SAFE_HTML}<!--fixed-->`);
  });

  test("fixers do not run when strict is omitted", async () => {
    const bridge = new MockNativeBridge();
    await orchestrate(SAFE_HTML, {}, bridge);
    expect(fixMock).not.toHaveBeenCalled();
  });

  // Regression: a fixer crash (e.g. resvg failing to rasterize an SVG) now happens
  // INSIDE the try/catch, so it maps to a VelloraError instead of escaping as a bare Error.
  test("a fixer crash maps to a VelloraError, never a raw Error", async () => {
    fixMock.mockImplementation(() => {
      throw new Error("resvg: could not render SVG");
    });
    const bridge = new MockNativeBridge();
    const err = await orchestrate(SAFE_HTML, { strict: false }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraError);
    expect(bridge.calls).toHaveLength(0);
  });

  // Regression: the fixer's residual error-severity findings are no longer discarded — the
  // first one is surfaced as a located VelloraUnsupportedError before the bridge is ever called. Its
  // `feature` is normalized to the core's colon-namespaced taxonomy (`element:script`), NOT the lint
  // RuleId (`script-element`), so best-effort and strict/core agree. The lint location is in the
  // FIXED-output coordinate space, which does not map to the caller's original HTML, so line/col are
  // reported as null rather than a misleading rewritten-document position.
  test("best-effort surfaces a residual error-severity fixer finding without rendering", async () => {
    fixMock.mockImplementation((html: string) => ({
      html,
      report: {
        conformant: false,
        findings: [
          {
            rule: "script-element",
            severity: "error",
            autoFixable: false,
            location: { line: 3, col: 7 },
            suggestedFix: "remove the <script> element",
            snippet: "<script>",
            compatLink: "#script-element",
          },
        ],
      },
    }));
    const bridge = new MockNativeBridge();
    const err = await orchestrate(SAFE_HTML, { strict: false }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err.feature).toBe("element:script");
    expect(err.line).toBeNull();
    expect(err.col).toBeNull();
    expect(bridge.calls).toHaveLength(0);
  });

  // Regression: a given out-of-subset construct (a `<script>`) yields the IDENTICAL `feature`
  // string whether it surfaces via best-effort lint or via the strict/core bridge rejection. A
  // consumer keyed on the core value must not silently miss the best-effort variant.
  test("best-effort and strict/core emit the identical feature for the same construct", async () => {
    fixMock.mockImplementation((html: string) => ({
      html,
      report: {
        conformant: false,
        findings: [
          {
            rule: "script-element",
            severity: "error",
            autoFixable: false,
            location: { line: 3, col: 7 },
            suggestedFix: "remove the <script> element",
            snippet: "<script>",
            compatLink: "#script-element",
          },
        ],
      },
    }));
    const bestEffortErr = await orchestrate(
      SAFE_HTML,
      { strict: false },
      new MockNativeBridge(),
    ).catch((e) => e);
    // The strict/core path reports a `<script>` as `element:script` (crates/vellora-core taxonomy).
    const coreErr = await orchestrate(
      SAFE_HTML,
      { strict: true },
      new RejectingBridge({
        feature: "element:script",
        line: 3,
        col: 7,
        hint: "remove the <script> element",
      }),
    ).catch((e) => e);
    expect(bestEffortErr).toBeInstanceOf(VelloraUnsupportedError);
    expect(coreErr).toBeInstanceOf(VelloraUnsupportedError);
    expect(bestEffortErr.feature).toBe(coreErr.feature);
    expect(bestEffortErr.feature).toBe("element:script");
  });

  // Regression: the residual-finding filter is `severity === "error" && !f.applied`. An
  // auto-fixed error-severity finding (which fix() marks `applied: true`, e.g. a rasterized inline-svg)
  // must NOT be surfaced — orchestrate proceeds to render. This pins the `!f.applied` half of the
  // predicate: removing that guard would re-throw an already-fixed finding and never reach the bridge.
  test("best-effort does NOT surface an applied error-severity finding and renders", async () => {
    fixMock.mockImplementation((html: string) => ({
      html: `${html}<!--svg-fixed-->`,
      report: {
        conformant: false,
        findings: [
          {
            rule: "inline-svg",
            severity: "error",
            autoFixable: true,
            applied: true,
            location: { line: 1, col: 1 },
            suggestedFix: "rasterize the inline <svg>",
            snippet: "<svg>",
            compatLink: "#inline-svg",
          },
        ],
      },
    }));
    const bridge = new MockNativeBridge();
    await orchestrate(SAFE_HTML, { strict: false }, bridge);
    expect(bridge.calls).toHaveLength(1);
    expect(bridge.calls[0]?.html).toBe(`${SAFE_HTML}<!--svg-fixed-->`);
  });

  test("best-effort surfaces residual unsupported constructs as located errors", async () => {
    fixMock.mockImplementation((html: string) => ({
      html,
      report: { conformant: true, findings: [] },
    }));
    const diagnostic: UnsupportedDiagnostic = {
      feature: "css-animation",
      line: 2,
      col: 1,
      hint: "run vellora fix",
    };
    const bridge = new RejectingBridge(diagnostic);
    const err = await orchestrate(SAFE_HTML, { strict: false }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err.feature).toBe("css-animation");
  });
});

describe("swappable native bridge", () => {
  test("the mock receives the final HTML, resolved options, and strict flag is honored", async () => {
    const bridge = new MockNativeBridge();
    await orchestrate(SAFE_HTML, { strict: true, metadata: { title: "T" } }, bridge);
    const call = bridge.calls[0];
    expect(call?.html).toBe(SAFE_HTML);
    expect(call?.options.metadata.title).toBe("T");
    expect(call?.options.metadata.creationDate).toBe(DEFAULT_CREATION_DATE);
  });

  // Regression: a rejection whose line/col are null (unknown source position) still maps to
  // the typed VelloraUnsupportedError instead of leaking the raw rejection.
  test("a {feature,null,null,hint} rejection maps to VelloraUnsupportedError", async () => {
    const diagnostic: UnsupportedDiagnostic = {
      feature: "denied-element",
      line: null,
      col: null,
      hint: "remove the element",
    };
    const err = await orchestrate(SAFE_HTML, {}, new RejectingBridge(diagnostic)).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err.feature).toBe("denied-element");
    expect(err.line).toBeNull();
    expect(err.col).toBeNull();
  });

  test("a {feature,line,col,hint} rejection maps to VelloraUnsupportedError preserving all fields", async () => {
    const diagnostic: UnsupportedDiagnostic = {
      feature: "unsupported-css",
      line: 11,
      col: 9,
      hint: "remove the property",
    };
    const err = await orchestrate(SAFE_HTML, {}, new RejectingBridge(diagnostic)).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect({ feature: err.feature, line: err.line, col: err.col, hint: err.hint }).toEqual(
      diagnostic,
    );
  });

  test("a {profile,errors} rejection maps to VelloraConformanceError", async () => {
    const bridge = new RejectingConformanceBridge();
    const err = await orchestrate(SAFE_HTML, { pdfa: "PDF/A-2b" }, bridge).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraConformanceError);
    expect(err.profile).toBe("PDF/A-2b");
    expect(err.errors[0]).toContain("MissingDocumentDate");
  });
});

describe("resolveOptions", () => {
  test("injects the fixed default creation date when omitted", () => {
    expect(resolveOptions().metadata.creationDate).toBe(DEFAULT_CREATION_DATE);
    expect(resolveOptions({}).metadata.creationDate).toBe(DEFAULT_CREATION_DATE);
  });

  test("forwards a supplied creation date verbatim", () => {
    const creationDate = "2030-12-25T08:00:00.000Z";
    expect(resolveOptions({ metadata: { creationDate } }).metadata.creationDate).toBe(creationDate);
  });

  // Regression: an invalid or empty creationDate must reject at the public
  // boundary with VelloraInputError, never forward a NaN date across the FFI.
  test("rejects a non-parseable or empty creationDate with VelloraInputError", () => {
    for (const creationDate of ["not-a-date", ""]) {
      expect(() => resolveOptions({ metadata: { creationDate } })).toThrow(VelloraInputError);
    }
  });

  // Regression: a year outside the FFI u16 range (1..=65535) would pass the old parseable-only
  // check yet be silently dropped at the napi checked-conversion (extended-ISO years run to +275760).
  // The public boundary now rejects it with a typed VelloraInputError so the two layers agree, while a
  // year at the u16 edge (65535) still passes.
  test("rejects a creationDate whose UTC year overflows the FFI u16 with VelloraInputError", () => {
    expect(() =>
      resolveOptions({ metadata: { creationDate: "+070000-01-01T00:00:00.000Z" } }),
    ).toThrow(VelloraInputError);
    // Boundary: year 65535 is the inclusive max and must be accepted.
    const ok = "+065535-01-01T00:00:00.000Z";
    expect(resolveOptions({ metadata: { creationDate: ok } }).metadata.creationDate).toBe(ok);
  });

  test("forwards optional fonts/images/baseUrl options when present and omits them otherwise", () => {
    const images = { "logo.png": new Uint8Array([0x89, 0x50, 0x4e, 0x47]) };
    const fonts = [new Uint8Array([0x00, 0x01, 0x00, 0x00])];
    const resolved = resolveOptions({
      fonts,
      images,
      baseUrl: "https://example.test/assets/",
    });
    expect(resolved.fonts).toBe(fonts);
    expect(resolved.images).toBe(images);
    expect(resolved.baseUrl).toBe("https://example.test/assets/");
    const bare = resolveOptions({});
    expect("images" in bare).toBe(false);
    expect("baseUrl" in bare).toBe(false);
    expect("fonts" in bare).toBe(false);
  });

  test("forwards the supported PDF/A profile", () => {
    const resolved = resolveOptions({ pdfa: "PDF/A-2b" });
    expect(resolved.pdfa).toBe("PDF/A-2b");
  });

  test("rejects an unsupported PDF/A profile with VelloraInputError", () => {
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: deliberately passing a bad runtime value.
      resolveOptions({ pdfa: "PDF/A-3b" as any }),
    ).toThrow(VelloraInputError);
  });

  test("rejects an invalid baseUrl with VelloraInputError", () => {
    // A bare path has no scheme, so it is not a valid absolute base URL.
    expect(() => resolveOptions({ baseUrl: "/assets/" })).toThrow(VelloraInputError);
  });

  test("rejects a non-Uint8Array images value with VelloraInputError", () => {
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: deliberately passing a bad runtime type.
      resolveOptions({ images: { "logo.png": "not-bytes" as any } }),
    ).toThrow(VelloraInputError);
  });

  test("rejects a non-Uint8Array fonts entry with VelloraInputError", () => {
    expect(() =>
      // biome-ignore lint/suspicious/noExplicitAny: deliberately passing a bad runtime type.
      resolveOptions({ fonts: ["not-bytes" as any] }),
    ).toThrow(VelloraInputError);
  });
});

describe("renderPdf honors the default mock bridge", () => {
  test("a strict render rejects on a modeled out-of-subset construct", async () => {
    const err = await renderPdf("<script>alert(1)</script>").catch((e) => e);
    expect(err).toBeInstanceOf(VelloraUnsupportedError);
    expect(err.feature).toBe("inline-script");
  });

  // Regression: an invalid creationDate rejects through the public surface, and the
  // bridge is never reached (the validation happens before render).
  test("an invalid creationDate rejects with VelloraInputError before reaching the bridge", async () => {
    const bridge = new MockNativeBridge();
    for (const creationDate of ["not-a-date", ""]) {
      const err = await renderPdf("<p>x</p>", undefined, {
        metadata: { creationDate },
        _bridge: bridge,
      } as never).catch((e) => e);
      expect(err).toBeInstanceOf(VelloraInputError);
    }
    expect(bridge.calls).toHaveLength(0);
  });
});
