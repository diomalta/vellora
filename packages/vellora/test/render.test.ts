import { Readable, Writable } from "node:stream";
import { describe, expect, test } from "vitest";
import {
  MockNativeBridge,
  type NativeBridge,
  VelloraInputError,
  renderPdf,
  renderPdfToStream,
} from "../src/index";

const SAFE_HTML = "<p>{{ name }}</p>";
const decode = (b: Uint8Array): string => new TextDecoder().decode(b);

/** Collect everything written to a Writable into one buffer. */
function collector(): { writable: Writable; chunks: Buffer[] } {
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.from(chunk));
      cb();
    },
  });
  return { writable, chunks };
}

/** A bridge override is passed through the (internal) `_bridge` option for white-box assertions. */
function withBridge(bridge: NativeBridge): { _bridge: NativeBridge } {
  return { _bridge: bridge };
}

describe("renderPdf", () => {
  test("resolves to non-empty PDF-shaped bytes", async () => {
    const pdf = await renderPdf(SAFE_HTML, { name: "Ada" });
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(0);
    const text = decode(pdf);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  test("data is optional; token-free HTML passes through unchanged", async () => {
    const bridge = new MockNativeBridge();
    await renderPdf("<p>static</p>", undefined, withBridge(bridge));
    expect(bridge.calls[0]?.html).toBe("<p>static</p>");
  });

  test("identical inputs resolve to byte-identical output", async () => {
    const a = await renderPdf(SAFE_HTML, { name: "Ada" });
    const b = await renderPdf(SAFE_HTML, { name: "Ada" });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  // Scenario: Empty/whitespace/empty-loop HTML render to valid PDF-shaped bytes without crashing.
  // (TQ-2: the prior `/Count 1` assertion proved nothing — the default mock hardcodes `/Count 1` for
  // EVERY input, so it could never fail. Single-page output is proven in the Rust suite instead.)
  test("empty, whitespace, and empty-loop HTML each render valid PDF-shaped bytes", async () => {
    for (const html of ["", "   \n\t ", "{% for x in xs %}<p>{{ x }}</p>{% endfor %}"]) {
      const pdf = await renderPdf(html, { xs: [] });
      const text = decode(pdf);
      expect(text.startsWith("%PDF-")).toBe(true);
      expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    }
  });

  test("string, Uint8Array, and Readable inputs render byte-identically", async () => {
    const html = "<p>same</p>";
    const fromString = await renderPdf(html);
    const fromBytes = await renderPdf(new TextEncoder().encode(html));
    const fromStream = await renderPdf(Readable.from([html]));
    expect(Buffer.from(fromBytes).equals(Buffer.from(fromString))).toBe(true);
    expect(Buffer.from(fromStream).equals(Buffer.from(fromString))).toBe(true);
  });

  test("a path-like string is rendered as content, not opened", async () => {
    const bridge = new MockNativeBridge();
    await renderPdf("./invoice.html", undefined, withBridge(bridge));
    expect(bridge.calls[0]?.html).toBe("./invoice.html");
  });

  test("a non-content html argument rejects with VelloraInputError", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately passing a bad runtime type.
    await expect(renderPdf(123 as any)).rejects.toBeInstanceOf(VelloraInputError);
  });

  test("an input Readable error rejects and never reaches the bridge", async () => {
    const bridge = new MockNativeBridge();
    const stream = new Readable({
      read() {
        this.destroy(new Error("read fail"));
      },
    });
    await expect(renderPdf(stream, undefined, withBridge(bridge))).rejects.toBeInstanceOf(
      VelloraInputError,
    );
    expect(bridge.calls).toHaveLength(0);
  });

  test("metadata is forwarded to the bridge unchanged", async () => {
    const bridge = new MockNativeBridge();
    const metadata = { title: "Invoice 7", creationDate: "2027-01-02T03:04:05.000Z" };
    await renderPdf(SAFE_HTML, { name: "x" }, { ...withBridge(bridge), metadata });
    expect(bridge.calls[0]?.options.metadata).toEqual(metadata);
  });

  test("an unimplemented fonts option is forwarded and does not change output", async () => {
    const bridge = new MockNativeBridge();
    await renderPdf(SAFE_HTML, { name: "x" }, { ...withBridge(bridge), fonts: ["Inter"] });
    expect(bridge.calls[0]?.options.fonts).toEqual(["Inter"]);

    const withoutFonts = await renderPdf(SAFE_HTML, { name: "x" });
    const withFonts = await renderPdf(SAFE_HTML, { name: "x" }, { fonts: ["Inter"] });
    // fonts is forwarded but currently inert: the mock stub bytes do not include it.
    expect(Buffer.from(withFonts).equals(Buffer.from(withoutFonts))).toBe(true);
  });

  test("omitting creationDate injects a fixed, non-wall-clock default", async () => {
    const bridge = new MockNativeBridge();
    await renderPdf(SAFE_HTML, { name: "x" }, withBridge(bridge));
    const recorded = bridge.calls[0]?.options.metadata.creationDate;
    expect(recorded).toBe("2000-01-01T00:00:00.000Z");
    expect(new Date(recorded ?? "").getFullYear()).not.toBe(new Date().getFullYear());
  });

  test("a supplied creationDate is recorded and two such calls are byte-identical", async () => {
    const metadata = { creationDate: "2029-09-09T09:09:09.000Z" };
    const a = await renderPdf(SAFE_HTML, { name: "x" }, { metadata });
    const b = await renderPdf(SAFE_HTML, { name: "x" }, { metadata });
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(decode(a)).toContain("2029-09-09T09:09:09.000Z");
  });
});

describe("renderPdfToStream", () => {
  test("writes a complete PDF and resolves after the final bytes", async () => {
    const { writable, chunks } = collector();
    await renderPdfToStream(SAFE_HTML, writable, { name: "Ada" });
    const text = Buffer.concat(chunks).toString("utf8");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(writable.writableEnded).toBe(true);
  });

  test("the streamed bytes equal renderPdf's bytes for the same input", async () => {
    const { writable, chunks } = collector();
    await renderPdfToStream(SAFE_HTML, writable, { name: "Ada" });
    const buffered = await renderPdf(SAFE_HTML, { name: "Ada" });
    expect(Buffer.concat(chunks).equals(Buffer.from(buffered))).toBe(true);
  });

  test("a destination error rejects the promise without hanging", async () => {
    const failing = new Writable({
      write(_chunk, _enc, cb) {
        cb(new Error("destination full"));
      },
    });
    await expect(renderPdfToStream(SAFE_HTML, failing, { name: "Ada" })).rejects.toThrow(
      /destination full/,
    );
  });

  // Regression (TQ-10): a destination whose write callback SUCCEEDS but then emits 'error'
  // asynchronously (after cb) exercises the `settled`-guarded late-error absorption in writeAndEnd.
  // The promise must settle exactly once (it resolves, since end() resolved first) and the late
  // 'error' must not surface as an unhandled rejection.
  test("a late post-write 'error' event is absorbed; the promise settles exactly once", async () => {
    let settlements = 0;
    const late = new Writable({
      write(_chunk, _enc, cb) {
        cb();
        process.nextTick(() => late.emit("error", new Error("late destination error")));
      },
    });
    const promise = renderPdfToStream(SAFE_HTML, late, { name: "Ada" }).then(
      () => {
        settlements++;
      },
      () => {
        settlements++;
      },
    );
    await promise;
    // Give the late nextTick error a chance to fire; the settled guard must swallow it.
    await new Promise((r) => setTimeout(r, 10));
    expect(settlements).toBe(1);
  });

  // Regression (TQ-10): a backpressured destination (write returns false via a small highWaterMark)
  // still receives the complete PDF and the promise resolves.
  test("a backpressured destination still receives the full PDF and resolves", async () => {
    const chunks: Buffer[] = [];
    const slow = new Writable({
      highWaterMark: 1,
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        setTimeout(cb, 1);
      },
    });
    await renderPdfToStream(SAFE_HTML, slow, { name: "Ada" });
    const text = Buffer.concat(chunks).toString("utf8");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
  });
});
