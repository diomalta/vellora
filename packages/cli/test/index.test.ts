import type { Report } from "@vellora/lint";
import { describe, expect, test } from "vitest";
import { type CliDeps, type CliIo, EXIT_CODES, runCli } from "../src/cli";
import * as cliPackage from "../src/index";

function report(findings: Array<Partial<Report["findings"][number]>> = []): Report {
  return {
    conformant: findings.length === 0,
    findings: findings.map((finding, i) => ({
      rule: "inline-svg" as const,
      severity: "error" as const,
      autoFixable: true,
      location: { line: i + 1, col: 2 },
      suggestedFix: "Rasterize the SVG.",
      snippet: "<svg></svg>",
      compatLink: "COMPATIBILITY.md#inline-svg",
      ...finding,
    })),
  };
}

function harness(files: Record<string, string | Uint8Array> = {}) {
  const writes: Record<string, string | Uint8Array> = {};
  const replacements: Record<string, string | Uint8Array> = {};
  const io: CliIo = {
    stdout(text) {
      stdout += text;
    },
    stderr(text) {
      stderr += text;
    },
    async readFile(path) {
      const value = files[path];
      if (value === undefined) {
        throw new Error(`missing file ${path}`);
      }
      return typeof value === "string" ? new TextEncoder().encode(value) : value;
    },
    async writeFile(path, data) {
      writes[path] = data;
    },
    async replaceFile(path, data) {
      replacements[path] = data;
    },
    async mkdir() {},
    async readStdin() {
      return stdin;
    },
  };
  let stdout = "";
  let stderr = "";
  let stdin = "";
  const deps: CliDeps = {
    async renderPdf() {
      return new TextEncoder().encode("%PDF-FAKE");
    },
    diagnose() {
      return report();
    },
    fix(html) {
      return {
        html: html.replace("<svg></svg>", '<img src="data:image/png;base64,x">'),
        report: report(),
      };
    },
    async diffPdfs() {
      return {
        available: true,
        ok: true,
        dpi: 144,
        threshold: 12,
        budget: 0.02,
        referencePages: 1,
        subjectPages: 1,
        comparedPages: 1,
        pageCountMismatch: false,
        dimensionMismatch: false,
        pixels: 100,
        mismatchPixels: 0,
        mismatchRatio: 0,
        meanAbsoluteError: 0,
        maxChannelDelta: 0,
        pages: [],
      };
    },
  };
  return {
    io,
    deps,
    writes,
    replacements,
    setStdin(value: string) {
      stdin = value;
    },
    get stdout() {
      return stdout;
    },
    get stderr() {
      return stderr;
    },
  };
}

test("exposes the package name", () => {
  expect(cliPackage.name).toBe("@vellora/cli");
});

test("public package entry does not expose test injection seams", () => {
  expect("runCli" in cliPackage).toBe(false);
  expect("CliDeps" in cliPackage).toBe(false);
  expect("CliIo" in cliPackage).toBe(false);
});

describe("help and command discovery", () => {
  test("top-level help lists subcommands", async () => {
    const h = harness();
    const code = await runCli(["--help"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(h.stdout).toContain("render");
    expect(h.stdout).toContain("lint");
    expect(h.stdout).toContain("fix");
    expect(h.stdout).toContain("doctor");
    expect(h.stdout).toContain("fidelity");
  });

  test("unknown command fails with usage", async () => {
    const h = harness();
    const code = await runCli(["unknown"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("Unknown command");
    expect(h.stderr).toContain("Usage:");
  });
});

describe("render command", () => {
  test("renders fixture input with JSON data", async () => {
    const h = harness({
      "template.html": "<h1>{{ title }}</h1>",
      "data.json": '{"title":"Invoice"}',
    });
    const calls: unknown[] = [];
    h.deps.renderPdf = async (html, data, opts) => {
      calls.push({ html, data, opts });
      return new TextEncoder().encode("%PDF-FAKE");
    };
    const code = await runCli(
      [
        "render",
        "template.html",
        "--data",
        "data.json",
        "--out",
        "out/invoice.pdf",
        "--title",
        "Invoice",
        "--creation-date",
        "2026-06-23T00:00:00.000Z",
      ],
      h.io,
      h.deps,
    );
    expect(code).toBe(EXIT_CODES.success);
    expect(new TextDecoder().decode(h.writes["out/invoice.pdf"] as Uint8Array)).toBe("%PDF-FAKE");
    expect(calls).toEqual([
      {
        html: "<h1>{{ title }}</h1>",
        data: { title: "Invoice" },
        opts: {
          strict: true,
          metadata: { title: "Invoice", creationDate: "2026-06-23T00:00:00.000Z" },
        },
      },
    ]);
  });

  test("reads HTML from stdin", async () => {
    const h = harness();
    h.setStdin("<p>stdin</p>");
    let htmlSeen = "";
    h.deps.renderPdf = async (html) => {
      htmlSeen = html;
      return new TextEncoder().encode("%PDF-STDIN");
    };
    const code = await runCli(["render", "-", "--out", "stdin.pdf"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(htmlSeen).toBe("<p>stdin</p>");
    expect(new TextDecoder().decode(h.writes["stdin.pdf"] as Uint8Array)).toBe("%PDF-STDIN");
  });

  test("requires --out", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    const code = await runCli(["render", "template.html"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("--out");
  });

  test("rejects extra positional inputs", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    const code = await runCli(
      ["render", "template.html", "extra.html", "--out", "out.pdf"],
      h.io,
      h.deps,
    );
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("exactly one");
  });

  test("invalid data JSON exits invalid usage", async () => {
    const h = harness({ "template.html": "<p>x</p>", "bad.json": "{no" });
    const code = await runCli(
      ["render", "template.html", "--data", "bad.json", "--out", "out.pdf"],
      h.io,
      h.deps,
    );
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("Invalid JSON");
  });

  test("runtime render rejection exits runtime failure with typed details", async () => {
    const h = harness({ "template.html": "<script>x()</script>" });
    h.deps.renderPdf = async () => {
      throw Object.assign(new Error("Unsupported construct"), {
        code: "VELLORA_UNSUPPORTED",
        feature: "element:script",
      });
    };
    const code = await runCli(["render", "template.html", "--out", "out.pdf"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.runtimeFailure);
    expect(h.stderr).toContain("VELLORA_UNSUPPORTED");
    expect(h.stderr).toContain("element:script");
  });

  test("runtime TypeError from render is not misclassified as invalid usage", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    h.deps.renderPdf = async () => {
      throw new TypeError("bridge returned an invalid shape");
    };
    const code = await runCli(["render", "template.html", "--out", "out.pdf"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.runtimeFailure);
    expect(h.stderr).toContain("bridge returned an invalid shape");
  });

  test("parseArgs TypeError still exits invalid usage", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    const code = await runCli(["render", "template.html", "--bad-option"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("Unknown option");
  });

  test("forwards best-effort and asset options through public render options", async () => {
    const h = harness({
      "template.html": '<img src="logo">',
      "logo.png": new Uint8Array([1, 2, 3]),
      "font.ttf": new Uint8Array([4, 5, 6]),
    });
    let optsSeen: unknown;
    h.deps.renderPdf = async (_html, _data, opts) => {
      optsSeen = opts;
      return new TextEncoder().encode("%PDF-ASSETS");
    };
    const code = await runCli(
      [
        "render",
        "template.html",
        "--out",
        "out.pdf",
        "--no-strict",
        "--base-url",
        "https://example.test/docs/",
        "--image",
        "logo=logo.png",
        "--font",
        "font.ttf",
      ],
      h.io,
      h.deps,
    );
    expect(code).toBe(EXIT_CODES.success);
    expect(optsSeen).toMatchObject({
      strict: false,
      baseUrl: "https://example.test/docs/",
      images: { logo: new Uint8Array([1, 2, 3]) },
      fonts: [new Uint8Array([4, 5, 6])],
    });
  });

  test("forwards engine and fidelity routing options", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    let optsSeen: unknown;
    h.deps.renderPdf = async (_html, _data, opts) => {
      optsSeen = opts;
      return new TextEncoder().encode("%PDF-AUTO");
    };
    const code = await runCli(
      [
        "render",
        "template.html",
        "--out",
        "out.pdf",
        "--engine",
        "auto",
        "--template-id",
        "invoice",
        "--policy",
        "vellora.fidelity.json",
      ],
      h.io,
      h.deps,
    );
    expect(code).toBe(EXIT_CODES.success);
    expect(optsSeen).toMatchObject({
      engine: "auto",
      fidelity: {
        templateId: "invoice",
        policyPath: "vellora.fidelity.json",
      },
    });
  });
});

describe("lint command", () => {
  test("conformant input exits success", async () => {
    const h = harness({ "template.html": "<p>ok</p>" });
    const code = await runCli(["lint", "template.html"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(h.stdout).toContain("No lint findings");
  });

  test("rejects extra positional inputs", async () => {
    const h = harness({ "template.html": "<p>ok</p>" });
    const code = await runCli(["lint", "template.html", "extra.html"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("exactly one");
  });

  test("broken input exits diagnostics-found and prints finding rows", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    h.deps.diagnose = () => report([{ rule: "inline-svg" }]);
    const code = await runCli(["lint", "template.html"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.diagnosticsFound);
    expect(h.stdout).toContain("inline-svg");
    expect(h.stdout).toContain("1:2");
  });

  test("reads lint input from stdin", async () => {
    const h = harness();
    h.setStdin("<p>stdin</p>");
    let htmlSeen = "";
    h.deps.diagnose = (html) => {
      htmlSeen = html;
      return report();
    };
    const code = await runCli(["lint", "-"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(htmlSeen).toBe("<p>stdin</p>");
  });

  test("json output preserves report shape", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    h.deps.diagnose = () => report([{ rule: "inline-svg" }]);
    const code = await runCli(["lint", "template.html", "--json"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.diagnosticsFound);
    expect(JSON.parse(h.stdout)).toMatchObject({
      conformant: false,
      findings: [{ rule: "inline-svg" }],
    });
  });
});

describe("fix command", () => {
  test("writes fixed HTML to stdout by default", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    const code = await runCli(["fix", "template.html"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(h.stdout).toContain("<img");
    expect(h.writes["template.html"]).toBeUndefined();
  });

  test("write replaces input file after fix succeeds", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    const code = await runCli(["fix", "template.html", "--write"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(h.replacements["template.html"]).toContain("<img");
    expect(h.writes["template.html"]).toBeUndefined();
  });

  test("write does not replace input when fix fails", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    h.deps.fix = () => {
      throw new Error("fix failed");
    };
    const code = await runCli(["fix", "template.html", "--write"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.runtimeFailure);
    expect(h.replacements["template.html"]).toBeUndefined();
  });

  test("rejects extra positional inputs", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    const code = await runCli(["fix", "template.html", "extra.html"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("exactly one");
  });

  test("stdin cannot be used with write", async () => {
    const h = harness();
    h.setStdin("<svg></svg>");
    const code = await runCli(["fix", "-", "--write"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("--write requires a file input");
  });

  test("json output contains fixed html and report", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    const code = await runCli(["fix", "template.html", "--json"], h.io, h.deps);
    expect(code).toBe(EXIT_CODES.success);
    expect(JSON.parse(h.stdout)).toMatchObject({
      html: '<img src="data:image/png;base64,x">',
      report: { conformant: true },
    });
  });
});

describe("doctor command", () => {
  test("writes render artifacts, a report, and a policy suggestion", async () => {
    const h = harness({ "template.html": "<svg></svg>" });
    h.deps.diagnose = () => report([{ rule: "inline-svg" }]);
    h.deps.renderPdf = async (_html, _data, opts) =>
      new TextEncoder().encode(`%PDF-${opts?.engine ?? "native"}`);

    const code = await runCli(
      [
        "doctor",
        "template.html",
        "--out",
        "artifacts",
        "--reference",
        "chromium",
        "--template-id",
        "invoice",
        "--json",
      ],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.diagnosticsFound);
    expect(new TextDecoder().decode(h.writes["artifacts/native.pdf"] as Uint8Array)).toBe(
      "%PDF-native",
    );
    expect(new TextDecoder().decode(h.writes["artifacts/chromium.pdf"] as Uint8Array)).toBe(
      "%PDF-chromium",
    );
    const reportJson = JSON.parse(h.writes["artifacts/report.json"] as string);
    expect(reportJson).toMatchObject({
      status: "needs-browser",
      recommendation: "chromium",
    });
    const policyJson = JSON.parse(h.writes["artifacts/vellora.fidelity.json"] as string);
    expect(policyJson.templates.invoice.selectedEngine).toBe("chromium");
    expect(JSON.parse(h.stdout)).toMatchObject({ status: "needs-browser" });
  });

  test("returns reference-unavailable when Chromium cannot be loaded", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    h.deps.renderPdf = async (_html, _data, opts) => {
      if (opts?.engine === "chromium") {
        throw Object.assign(new Error("Set chromium.executablePath"), {
          code: "VELLORA_CHROMIUM_UNAVAILABLE",
        });
      }
      return new TextEncoder().encode("%PDF-native");
    };

    const code = await runCli(
      ["doctor", "template.html", "--reference", "chromium", "--json"],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.referenceUnavailable);
    expect(JSON.parse(h.stdout)).toMatchObject({
      status: "reference-unavailable",
      recommendation: "native",
    });
  });

  test("pixel diff implies a Chromium reference and recommends Chromium when over budget", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    h.deps.renderPdf = async (_html, _data, opts) =>
      new TextEncoder().encode(`%PDF-${opts?.engine ?? "native"}`);
    const diffCalls: unknown[] = [];
    h.deps.diffPdfs = async (referencePdf, subjectPdf, options) => {
      diffCalls.push({
        reference: new TextDecoder().decode(referencePdf),
        subject: new TextDecoder().decode(subjectPdf),
        options,
      });
      return {
        available: true,
        ok: false,
        dpi: 144,
        threshold: 12,
        budget: 0.02,
        referencePages: 1,
        subjectPages: 1,
        comparedPages: 1,
        pageCountMismatch: false,
        dimensionMismatch: false,
        pixels: 100,
        mismatchPixels: 8,
        mismatchRatio: 0.08,
        meanAbsoluteError: 0.03,
        maxChannelDelta: 90,
        pages: [{ page: 1, dimensions: {}, metrics: {} }],
      } as never;
    };

    const code = await runCli(
      [
        "doctor",
        "template.html",
        "--pixel-diff",
        "--pixel-budget",
        "0.02",
        "--out",
        "artifacts",
        "--json",
      ],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.diagnosticsFound);
    expect(diffCalls).toMatchObject([
      {
        reference: "%PDF-chromium",
        subject: "%PDF-native",
        options: { outDir: "artifacts", budget: 0.02, threshold: 12, dpi: 144 },
      },
    ]);
    expect(JSON.parse(h.writes["artifacts/report.json"] as string)).toMatchObject({
      status: "needs-browser",
      recommendation: "chromium",
      visualDiff: { mismatchRatio: 0.08 },
    });
  });

  test("pixel diff keeps native recommendation when inside budget", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    h.deps.renderPdf = async (_html, _data, opts) =>
      new TextEncoder().encode(`%PDF-${opts?.engine ?? "native"}`);
    h.deps.diffPdfs = async () => ({
      available: true,
      ok: true,
      dpi: 144,
      threshold: 12,
      budget: 0.02,
      referencePages: 1,
      subjectPages: 1,
      comparedPages: 1,
      pageCountMismatch: false,
      dimensionMismatch: false,
      pixels: 100,
      mismatchPixels: 1,
      mismatchRatio: 0.01,
      meanAbsoluteError: 0.002,
      maxChannelDelta: 20,
      pages: [],
    });

    const code = await runCli(["doctor", "template.html", "--pixel-diff", "--json"], h.io, h.deps);

    expect(code).toBe(EXIT_CODES.success);
    expect(JSON.parse(h.stdout)).toMatchObject({
      status: "pass",
      recommendation: "native",
      visualDiff: { ok: true },
    });
  });

  test("pixel diff can compare against a local reference PDF without rendering Chromium", async () => {
    const h = harness({
      "template.html": "<p>x</p>",
      "legacy-puppeteer.pdf": new TextEncoder().encode("%PDF-LEGACY"),
    });
    const renderEngines: unknown[] = [];
    h.deps.renderPdf = async (_html, _data, opts) => {
      renderEngines.push(opts?.engine ?? "native");
      return new TextEncoder().encode(`%PDF-${opts?.engine ?? "native"}`);
    };
    const diffCalls: unknown[] = [];
    h.deps.diffPdfs = async (referencePdf, subjectPdf) => {
      diffCalls.push({
        reference: new TextDecoder().decode(referencePdf),
        subject: new TextDecoder().decode(subjectPdf),
      });
      return {
        available: true,
        ok: true,
        dpi: 144,
        threshold: 12,
        budget: 0.02,
        referencePages: 1,
        subjectPages: 1,
        comparedPages: 1,
        pageCountMismatch: false,
        dimensionMismatch: false,
        pixels: 100,
        mismatchPixels: 1,
        mismatchRatio: 0.01,
        meanAbsoluteError: 0.002,
        maxChannelDelta: 20,
        pages: [],
      };
    };

    const code = await runCli(
      [
        "doctor",
        "template.html",
        "--pixel-diff",
        "--reference-pdf",
        "legacy-puppeteer.pdf",
        "--out",
        "artifacts",
        "--json",
      ],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.success);
    expect(renderEngines).toEqual(["native"]);
    expect(diffCalls).toEqual([{ reference: "%PDF-LEGACY", subject: "%PDF-native" }]);
    expect(new TextDecoder().decode(h.writes["artifacts/reference.pdf"] as Uint8Array)).toBe(
      "%PDF-LEGACY",
    );
    expect(JSON.parse(h.stdout)).toMatchObject({
      reference: { type: "pdf", path: "legacy-puppeteer.pdf" },
      subject: { type: "engine", engine: "native" },
      status: "pass",
      recommendation: "native",
    });
  });

  test("pixel diff can compare a local Puppeteer PDF against the Chromium subject", async () => {
    const h = harness({
      "template.html": "<p>x</p>",
      "legacy-puppeteer.pdf": new TextEncoder().encode("%PDF-PUPPETEER"),
    });
    const renderEngines: unknown[] = [];
    h.deps.renderPdf = async (_html, _data, opts) => {
      renderEngines.push(opts?.engine ?? "native");
      return new TextEncoder().encode(`%PDF-${opts?.engine ?? "native"}`);
    };
    const diffCalls: unknown[] = [];
    h.deps.diffPdfs = async (referencePdf, subjectPdf) => {
      diffCalls.push({
        reference: new TextDecoder().decode(referencePdf),
        subject: new TextDecoder().decode(subjectPdf),
      });
      return {
        available: true,
        ok: true,
        dpi: 144,
        threshold: 12,
        budget: 0.02,
        referencePages: 1,
        subjectPages: 1,
        comparedPages: 1,
        pageCountMismatch: false,
        dimensionMismatch: false,
        pixels: 100,
        mismatchPixels: 0,
        mismatchRatio: 0,
        meanAbsoluteError: 0,
        maxChannelDelta: 0,
        pages: [],
      };
    };

    const code = await runCli(
      [
        "doctor",
        "template.html",
        "--pixel-diff",
        "--reference-pdf",
        "legacy-puppeteer.pdf",
        "--subject",
        "chromium",
        "--out",
        "artifacts",
        "--json",
      ],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.diagnosticsFound);
    expect(renderEngines).toEqual(["chromium"]);
    expect(diffCalls).toEqual([{ reference: "%PDF-PUPPETEER", subject: "%PDF-chromium" }]);
    expect(new TextDecoder().decode(h.writes["artifacts/chromium.pdf"] as Uint8Array)).toBe(
      "%PDF-chromium",
    );
    expect(JSON.parse(h.stdout)).toMatchObject({
      comparison: {
        reference: { type: "pdf", path: "legacy-puppeteer.pdf" },
        subject: { type: "engine", engine: "chromium" },
      },
      status: "needs-browser",
      recommendation: "chromium",
    });
  });

  test("subject requires pixel diff", async () => {
    const h = harness({ "template.html": "<p>x</p>" });

    const code = await runCli(["doctor", "template.html", "--subject", "chromium"], h.io, h.deps);

    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("--subject requires --pixel-diff");
  });

  test("reference-pdf requires pixel diff", async () => {
    const h = harness({
      "template.html": "<p>x</p>",
      "legacy.pdf": new TextEncoder().encode("%PDF-LEGACY"),
    });

    const code = await runCli(
      ["doctor", "template.html", "--reference-pdf", "legacy.pdf"],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("--reference-pdf requires --pixel-diff");
  });

  test("reference-pdf cannot be combined with a live reference engine", async () => {
    const h = harness({
      "template.html": "<p>x</p>",
      "legacy.pdf": new TextEncoder().encode("%PDF-LEGACY"),
    });

    const code = await runCli(
      [
        "doctor",
        "template.html",
        "--pixel-diff",
        "--reference-pdf",
        "legacy.pdf",
        "--reference",
        "chromium",
      ],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("cannot be combined");
  });

  test("pixel diff failure exits runtime failure with an explicit status", async () => {
    const h = harness({ "template.html": "<p>x</p>" });
    h.deps.renderPdf = async (_html, _data, opts) =>
      new TextEncoder().encode(`%PDF-${opts?.engine ?? "native"}`);
    h.deps.diffPdfs = async () => {
      throw new Error("missing pdftoppm");
    };

    const code = await runCli(["doctor", "template.html", "--pixel-diff", "--json"], h.io, h.deps);

    expect(code).toBe(EXIT_CODES.runtimeFailure);
    expect(JSON.parse(h.stdout)).toMatchObject({
      status: "diff-unavailable",
      recommendation: "manual-review",
      visualDiff: { available: false, error: "missing pdftoppm" },
    });
  });
});

describe("fidelity command", () => {
  test("validates a policy file", async () => {
    const h = harness({
      "vellora.fidelity.json": JSON.stringify({
        version: 1,
        templates: {
          invoice: { selectedEngine: "native" },
          dashboard: { selectedEngine: "chromium" },
        },
      }),
    });

    const code = await runCli(
      ["fidelity", "--config", "vellora.fidelity.json", "--json"],
      h.io,
      h.deps,
    );

    expect(code).toBe(EXIT_CODES.success);
    expect(JSON.parse(h.stdout)).toMatchObject({
      valid: true,
      templates: 2,
      native: 1,
      chromium: 1,
    });
  });

  test("rejects invalid selectedEngine values", async () => {
    const h = harness({
      "vellora.fidelity.json": JSON.stringify({
        version: 1,
        templates: {
          invoice: { selectedEngine: "auto" },
        },
      }),
    });

    const code = await runCli(["fidelity", "--config", "vellora.fidelity.json"], h.io, h.deps);

    expect(code).toBe(EXIT_CODES.invalidUsage);
    expect(h.stderr).toContain("selectedEngine");
  });
});
