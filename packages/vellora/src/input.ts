/**
 * Input normalization: turn an `HtmlInput` into a content string.
 *
 * Input is **always content, never a path**: there is no content-vs-path heuristic and no
 * filesystem access. A `string` is used as-is; a `Uint8Array` is decoded as **strict** UTF-8
 * (malformed bytes reject with `VelloraInputError`, matching the native core); a `Readable` is
 * buffered to completion (and strict-decoded) before returning. Anything else rejects with
 * `VelloraInputError`. A `Readable` that errors before `end` rejects with the underlying cause and
 * never hangs.
 */
import type { Readable } from "node:stream";
import { VelloraInputError } from "./errors.js";
import type { HtmlInput } from "./types.js";

const UTF8 = new TextDecoder("utf-8", { fatal: true });

/**
 * Decode bytes as strict UTF-8. The native core rejects non-UTF-8 input, so the public byte path
 * must too: a `fatal` decoder throws on malformed bytes, which we map to a `VelloraInputError`
 * rather than silently substituting U+FFFD (which would re-encode as valid UTF-8 and hide the bug).
 */
function decodeUtf8(bytes: Uint8Array): string {
  try {
    return UTF8.decode(bytes);
  } catch (cause) {
    throw new VelloraInputError("The input HTML is not valid UTF-8.", { cause });
  }
}

/** Duck-typed `Readable` check (avoids `instanceof` coupling across realms). */
function isReadable(value: unknown): value is Readable {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { pipe?: unknown }).pipe === "function" &&
    typeof (value as { on?: unknown }).on === "function"
  );
}

/** Buffer a `Readable` to completion, then decode as UTF-8. Rejects (never hangs) on stream error. */
function bufferReadable(stream: Readable): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const onError = (cause: unknown): void => {
      cleanup();
      reject(new VelloraInputError("The input HTML stream errored before it ended.", { cause }));
    };
    const onData = (chunk: Buffer | string): void => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk);
    };
    const onEnd = (): void => {
      cleanup();
      try {
        resolve(decodeUtf8(Buffer.concat(chunks)));
      } catch (err) {
        reject(err);
      }
    };
    const cleanup = (): void => {
      stream.off("data", onData);
      stream.off("end", onEnd);
      stream.off("error", onError);
      stream.off("close", onClose);
    };
    const onClose = (): void => {
      // A destroy() without an `error` still closes; treat a close-before-end as an error so the
      // promise never hangs waiting for an `end` that will not arrive.
      cleanup();
      reject(
        new VelloraInputError("The input HTML stream closed before it ended.", {
          cause: undefined,
        }),
      );
    };
    stream.on("data", onData);
    stream.once("end", onEnd);
    stream.once("error", onError);
    stream.once("close", onClose);
  });
}

/**
 * Normalize `html` to a content string. No filesystem access; a path-like string is content.
 * Async because a `Readable` must be drained before templating begins.
 */
export async function normalizeInput(html: HtmlInput): Promise<string> {
  if (typeof html === "string") {
    return html;
  }
  if (html instanceof Uint8Array) {
    return decodeUtf8(html);
  }
  if (isReadable(html)) {
    return bufferReadable(html);
  }
  throw new VelloraInputError(
    "Invalid html input: expected a string, Uint8Array, or Readable (content, never a file path).",
  );
}
