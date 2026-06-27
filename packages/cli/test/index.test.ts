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
