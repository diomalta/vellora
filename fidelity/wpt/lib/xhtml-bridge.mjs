// XHTML nodes: WPT serves `.xht`/`.xhtml`/`.xml` files as `application/xhtml+xml`
// (lib/chrome.mjs MIME table), so Chrome parses them with its XML parser. vellora parses every
// document as HTML (port step 08: its input is a `text/html` string), which turns XML-only
// constructs into something else (a CDATA section in a <style> becomes CSS garbage, `<div/>` opens
// an element). Measured on the step-08 build with every node parsed as HTML: 1518 pass -> fail and
// 175 fail -> pass against step 07 (fidelity/baselines/port/08-html-parse/attachments/
// xht-parse-measurement.json). So the harness renders an XML-served node with vellora-core's
// fidelity-only XML parse (`vellora_core::debug_render_xhtml`, run by the `xhtml_render` example
// binary), through vellora's own `renderPdf` as its `NativeBridge` (`_bridge`): templating, the
// strict orchestration and the error mapping are the product's, only the parser differs. The
// product API is unchanged: nothing outside fidelity tooling can reach the XML parse.
import { execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** File extensions WPT serves as XML (`application/xhtml+xml`), matched on a node's tree path. */
export const XML_SERVED = /\.(xht|xhtml|xml)$/i;

/** Whether a node (tree-relative path) is served as XML, so Chrome parses it as XML. */
export function isXmlServed(rel) {
  return typeof rel === "string" && XML_SERVED.test(rel);
}

/** Path of the `xhtml_render` example binary of the vellora checkout at `repoRoot`. */
export function xhtmlRenderBin(repoRoot) {
  return join(repoRoot, "target", "release", "examples", "xhtml_render");
}

/** Build the `xhtml_render` example (release, like the napi addon) and return its path. */
export function buildXhtmlRender(repoRoot, { execFile = execFileSync } = {}) {
  execFile("cargo", ["build", "--release", "-p", "vellora-core", "--example", "xhtml_render"], {
    cwd: repoRoot,
    stdio: ["ignore", "ignore", "inherit"],
  });
  const bin = xhtmlRenderBin(repoRoot);
  if (!existsSync(bin)) throw new Error(`xhtml_render binary missing after build: ${bin}`);
  return bin;
}

function rec(tag, body) {
  const bytes = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
  const head = Buffer.alloc(5);
  head[0] = tag.charCodeAt(0);
  head.writeUInt32LE(bytes.length, 1);
  return [head, bytes];
}

/** ISO-8601 instant → `YYYY-MM-DD` (UTC), exactly the napi bridge's `isoToYmd`. */
export function isoToDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`bad creationDate ${JSON.stringify(iso)}`);
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

/**
 * Encode one render request (`examples/xhtml_render.rs` protocol): `VXR1`, then records
 * `tag u8, len u32 LE, bytes`. `mode` selects the raw-Blitz render (`{ raw: true }`, record `R`)
 * and its parser (`parser: "html" | "xml"`, record `S`; the binary defaults to `xml`); without
 * `raw` the binary runs `debug_render_xhtml`, which only parses XML.
 */
export function encodeRequest(html, options = {}, mode = {}) {
  const parts = [Buffer.from("VXR1"), ...rec("H", html)];
  if (mode.raw) parts.push(...rec("R", "1"));
  if (mode.parser !== undefined) parts.push(...rec("S", mode.parser));
  if (options.baseUrl !== undefined) parts.push(...rec("B", options.baseUrl));
  if (options.metadata?.title !== undefined) parts.push(...rec("T", options.metadata.title));
  if (options.metadata?.creationDate !== undefined) {
    parts.push(...rec("D", isoToDate(options.metadata.creationDate)));
  }
  if (options.pdfa !== undefined) parts.push(...rec("P", options.pdfa));
  for (const face of options.fonts ?? []) parts.push(...rec("F", face));
  for (const [key, bytes] of Object.entries(options.images ?? {})) {
    parts.push(...rec("K", key), ...rec("I", bytes));
  }
  return Buffer.concat(parts);
}

/** Decode a rejection (exit 3) into the napi binding's error object shape. */
export function decodeRejection(buf) {
  const fields = { errors: [] };
  let at = 0;
  while (at + 5 <= buf.length) {
    const tag = String.fromCharCode(buf[at]);
    const len = buf.readUInt32LE(at + 1);
    const body = buf.subarray(at + 5, at + 5 + len).toString("utf8");
    at += 5 + len;
    if (tag === "e") fields.errors.push(body);
    else fields[tag] = body;
  }
  const err = new Error(fields.M ?? "xhtml_render: rejection without a message");
  if (fields.f !== undefined) {
    // Located diagnostic: { feature, line, col, hint }, line/col null when unknown (napi).
    err.feature = fields.f;
    err.line = fields.l === undefined ? null : Number(fields.l);
    err.col = fields.c === undefined ? null : Number(fields.c);
    err.hint = fields.h ?? "";
  } else if (fields.p !== undefined) {
    err.profile = fields.p;
    err.errors = fields.errors;
  }
  return err;
}

/**
 * A vellora `NativeBridge` rendering with the XML parse, one `xhtml_render` process per render.
 * A render process killed by a signal (an abort, a stack overflow) re-raises that signal in this
 * worker, so the pool records the test as a crash exactly as it does when the in-process napi
 * render aborts the worker. `mode` is passed to every request ([`encodeRequest`]): `{ raw: true,
 * parser }` makes it the raw-Blitz bridge of `run.mjs --raw`.
 */
export function makeXhtmlBridge({
  bin,
  mode = {},
  spawnImpl = spawn,
  raise = (s) => process.kill(process.pid, s),
}) {
  return {
    render(html, options) {
      return new Promise((resolve, reject) => {
        const child = spawnImpl(bin, [], { stdio: ["pipe", "pipe", "pipe"] });
        const out = [];
        const err = [];
        child.stdout.on("data", (c) => out.push(c));
        child.stderr.on("data", (c) => err.push(c));
        child.on("error", reject);
        child.on("close", (code, signal) => {
          const stdout = Buffer.concat(out);
          if (signal) {
            raise(signal);
            reject(new Error(`xhtml_render killed by ${signal}`));
          } else if (code === 0) resolve(new Uint8Array(stdout));
          else if (code === 3) reject(decodeRejection(stdout));
          else {
            reject(
              new Error(
                `xhtml_render exited ${code}: ${Buffer.concat(err).toString("utf8").trim()}`,
              ),
            );
          }
        });
        child.stdin.on("error", () => {});
        child.stdin.end(encodeRequest(html, options, mode));
      });
    },
  };
}
