import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, test } from "vitest";
import { type RenderOpts, addon, platformTag, render } from "../src/index";

const PKG_DIR = dirname(dirname(fileURLToPath(import.meta.url))); // packages/native
const ADDON = join(PKG_DIR, `vellora.${platformTag()}.node`);

beforeAll(() => {
  if (!existsSync(ADDON)) {
    execFileSync("npm", ["run", "build:addon"], { cwd: PKG_DIR, stdio: "inherit" });
  }
}, 600_000);

const encoder = new TextEncoder();
const FIXED_OPTS: RenderOpts = { title: "Test", creationDate: [2024, 1, 1] };

const HEAD = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><title>Doc</title><style>@page { size: A4; margin: 16mm; }</style></head>`;

/** A small, static, fully in-subset document (no `{{ }}` templating — that is the api's job). */
function doc(body: string): Uint8Array {
  return encoder.encode(`${HEAD}<body>${body}</body></html>`);
}

const PDF_MAGIC = encoder.encode("%PDF-");

function startsWithPdfMagic(buf: Uint8Array): boolean {
  return PDF_MAGIC.every((byte, i) => buf[i] === byte);
}

describe("render", () => {
  test("resolves a Uint8Array starting with %PDF-", async () => {
    const pdf = await render(doc("<h1>Invoice</h1><p>One paragraph.</p>"), FIXED_OPTS);
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(0);
    expect(startsWithPdfMagic(pdf)).toBe(true);
  });

  test("keeps the event loop responsive during an in-flight render", async () => {
    let timerFired = false;
    // A timer scheduled before awaiting the render must fire while the render runs on a worker.
    const timer = new Promise<void>((resolve) => {
      setImmediate(() => {
        timerFired = true;
        resolve();
      });
    });
    const pending = render(doc("<h1>Busy</h1><p>Multi page.</p>".repeat(50)), FIXED_OPTS);
    await timer;
    expect(timerFired).toBe(true);
    const pdf = await pending;
    expect(startsWithPdfMagic(pdf)).toBe(true);
  });

  // Pairwise inequality alone does not prove isolation (one result partly overwritten by
  // another could still differ). Build a per-input sequential golden and assert each concurrent
  // result is byte-IDENTICAL to its own golden, catching partial cross-call corruption.
  test("isolates concurrent renders with distinct inputs (each matches its own golden)", async () => {
    const bodies = [
      "<h1>Alpha</h1>",
      "<h1>Beta</h1><p>two</p>",
      "<h1>Gamma</h1><p>three</p><p>four</p>",
    ];
    const goldens: Uint8Array[] = [];
    for (const b of bodies) {
      goldens.push(await render(doc(b), FIXED_OPTS));
    }
    const results = await Promise.all(bodies.map((b) => render(doc(b), FIXED_OPTS)));
    for (let i = 0; i < bodies.length; i++) {
      expect(startsWithPdfMagic(results[i])).toBe(true);
      // Each concurrent result must equal its OWN sequential golden — not merely differ from siblings.
      expect(Buffer.from(results[i]).equals(Buffer.from(goldens[i]))).toBe(true);
    }
    expect(Buffer.from(results[0]).equals(Buffer.from(results[1]))).toBe(false);
    expect(Buffer.from(results[1]).equals(Buffer.from(results[2]))).toBe(false);
  });

  test("concurrent renders are byte-identical to sequential renders (incl. a multi-page input)", async () => {
    // Include a genuinely multi-page body so byte-equality exercises pagination under concurrency,
    // not just single-page docs.
    const multiPage = `<h1>Report</h1>${"<p>A paragraph of body text that fills the page.</p>".repeat(120)}`;
    const inputs = [doc("<h1>One</h1>"), doc("<h1>Two</h1><p>x</p>"), doc(multiPage)];

    const concurrent = await Promise.all(inputs.map((html) => render(html, FIXED_OPTS)));

    const sequential: Uint8Array[] = [];
    for (const html of inputs) {
      sequential.push(await render(html, FIXED_OPTS));
    }

    for (let i = 0; i < inputs.length; i++) {
      expect(Buffer.from(concurrent[i]).equals(Buffer.from(sequential[i]))).toBe(true);
    }
  });

  // N concurrent calls sharing the SAME large multi-page input must all equal one sequential
  // golden — the most direct check for buffer aliasing/interleaving across the worker pool.
  test("N concurrent renders of one shared multi-page input all match a single sequential golden", async () => {
    const html = doc(
      `<h1>Shared</h1>${"<p>Repeated body line for multiple pages.</p>".repeat(120)}`,
    );
    const golden = await render(html, FIXED_OPTS);
    const concurrent = await Promise.all(Array.from({ length: 8 }, () => render(html, FIXED_OPTS)));
    for (const pdf of concurrent) {
      expect(Buffer.from(pdf).equals(Buffer.from(golden))).toBe(true);
    }
  });

  test("treats a path-like html string as content and opens no file", async () => {
    // Path-like bytes must be rendered as content, never read as a file.
    const pathLike = doc("./report.html <p>./not-a-file.html</p>");
    const pdf = await render(pathLike, FIXED_OPTS);
    expect(startsWithPdfMagic(pdf)).toBe(true);
  });

  test("returns a buffer independent of Rust memory (mutation does not leak)", async () => {
    const html = doc("<h1>Owned</h1><p>buffer</p>");
    const first = await render(html, FIXED_OPTS);
    const before = Buffer.from(first).toString("latin1");
    // Mutate the returned buffer; it must be JS-owned and not alias any other result.
    first.fill(0);
    const second = await render(html, FIXED_OPTS);
    const after = Buffer.from(second).toString("latin1");
    expect(after).toBe(before);
    expect(startsWithPdfMagic(second)).toBe(true);
  });

  test("rejects out-of-subset input with the located diagnostic; process survives", async () => {
    const bad = doc("<canvas></canvas>");
    await expect(render(bad, FIXED_OPTS)).rejects.toMatchObject({
      message: expect.stringContaining("element:canvas"),
      feature: "element:canvas",
      hint: expect.stringContaining("vellora fix"),
    });
    // The structured located fields must be present (machine-readable, not only in the message).
    const err = await render(bad, FIXED_OPTS).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    const located = err as Error & {
      feature: string;
      line: number | null;
      col: number | null;
      hint: string;
    };
    expect(located.feature).toBe("element:canvas");
    expect(typeof located.line).toBe("number");
    expect(typeof located.col).toBe("number");
    expect(located.hint).toContain("vellora fix");
    // Process still alive: a normal render after the rejection still succeeds.
    const ok = await render(doc("<h1>After error</h1>"), FIXED_OPTS);
    expect(startsWithPdfMagic(ok)).toBe(true);
  });

  test("rejects on invalid (non-UTF-8) content without crashing the process", async () => {
    const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]);
    await expect(render(invalidUtf8, FIXED_OPTS)).rejects.toThrow();
    const ok = await render(doc("<h1>Recovered</h1>"), FIXED_OPTS);
    expect(startsWithPdfMagic(ok)).toBe(true);
  });

  test("renders with no opts argument", async () => {
    const pdf = await render(doc("<h1>No opts</h1>"));
    expect(startsWithPdfMagic(pdf)).toBe(true);
  });

  // This proves only the RECOVERABLE (unwinding) panic → rejection path that `catch_unwind`
  // handles by design. It does NOT prove survival of non-unwinding aborts (e.g. a stack overflow
  // from deep recursion); that abort-class is guarded by the recursion-depth limits in the core, not
  // by this test.
  test("a forced (recoverable) Rust panic rejects the promise; process survives and next render works", async () => {
    const forcePanic = addon().__forcePanicForTest;
    expect(forcePanic).toBeTypeOf("function");
    await expect((forcePanic as () => Promise<void>)()).rejects.toMatchObject({
      message: expect.stringContaining("panic"),
    });
    // Process did not abort: a subsequent real render still succeeds.
    const ok = await render(doc("<h1>After panic</h1>"), FIXED_OPTS);
    expect(startsWithPdfMagic(ok)).toBe(true);
  });
});
