import { Readable } from "node:stream";
import { describe, expect, test } from "vitest";
import { VelloraInputError } from "../src/index";
import { normalizeInput } from "../src/input";

const decode = (s: string): Uint8Array => new TextEncoder().encode(s);

describe("input normalization", () => {
  test("a string is used as-is", async () => {
    expect(await normalizeInput("<p>hi</p>")).toBe("<p>hi</p>");
  });

  test("a Uint8Array is decoded as UTF-8", async () => {
    expect(await normalizeInput(decode("<p>café</p>"))).toBe("<p>café</p>");
  });

  test("a Readable is consumed to completion and buffered", async () => {
    const stream = Readable.from(["<p>", "ab", "c</p>"]);
    expect(await normalizeInput(stream)).toBe("<p>abc</p>");
  });

  test("each input type yields identical content", async () => {
    const html = "<p>same</p>";
    const fromString = await normalizeInput(html);
    const fromBytes = await normalizeInput(decode(html));
    const fromStream = await normalizeInput(Readable.from([html]));
    expect(fromString).toBe(html);
    expect(fromBytes).toBe(html);
    expect(fromStream).toBe(html);
  });

  test("a Readable is fully drained before returning", async () => {
    const stream = Readable.from(["a", "b", "c"]);
    const result = await normalizeInput(stream);
    expect(result).toBe("abc");
    expect(stream.readableEnded).toBe(true);
  });

  test("a path-like string is treated as content (no file opened)", async () => {
    expect(await normalizeInput("./invoice.html")).toBe("./invoice.html");
  });

  // Regression: malformed UTF-8 must reject with VelloraInputError, not silently substitute
  // U+FFFD (which would re-encode as valid UTF-8 and hide the corruption from the native core).
  test("a Uint8Array with invalid UTF-8 rejects with VelloraInputError", async () => {
    const badBytes = new Uint8Array([0x3c, 0x70, 0x3e, 0xff, 0xfe, 0x3c, 0x2f, 0x70, 0x3e]);
    await expect(normalizeInput(badBytes)).rejects.toBeInstanceOf(VelloraInputError);
    await expect(normalizeInput(badBytes)).rejects.toThrow(/not valid UTF-8/);
  });

  test("a Readable yielding invalid UTF-8 rejects with VelloraInputError", async () => {
    const stream = Readable.from([Buffer.from([0xff, 0xfe, 0x00])]);
    await expect(normalizeInput(stream)).rejects.toBeInstanceOf(VelloraInputError);
  });

  test("valid multi-byte UTF-8 still decodes unchanged", async () => {
    expect(await normalizeInput(decode("<p>café — 日本語</p>"))).toBe("<p>café — 日本語</p>");
  });

  test("a non-string/Uint8Array/Readable rejects with VelloraInputError", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: deliberately passing a bad runtime type.
    await expect(normalizeInput(42 as any)).rejects.toBeInstanceOf(VelloraInputError);
    // biome-ignore lint/suspicious/noExplicitAny: deliberately passing a bad runtime type.
    await expect(normalizeInput({} as any)).rejects.toThrow(/string, Uint8Array, or Readable/);
  });

  test("a Readable that errors before end rejects with VelloraInputError carrying the cause", async () => {
    const cause = new Error("disk gone");
    const stream = new Readable({
      read() {
        this.destroy(cause);
      },
    });
    const err = await normalizeInput(stream).catch((e) => e);
    expect(err).toBeInstanceOf(VelloraInputError);
    expect((err as { cause?: unknown }).cause).toBe(cause);
  });
});
