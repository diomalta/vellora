// The XML parse of the nodes WPT serves as XML (port step 08, lib/xhtml-bridge.mjs): which nodes
// take it, the request/rejection protocol of crates/vellora-core/examples/xhtml_render.rs, the
// child-process outcomes, and (when the example binary is built) the real round trip through
// vellora's renderPdf with the bridge.
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { makeVelloraRender } from "../lib/vellora-render.mjs";
import {
  decodeRejection,
  encodeRequest,
  isXmlServed,
  isoToDate,
  makeXhtmlBridge,
  xhtmlRenderBin,
} from "../lib/xhtml-bridge.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..", "..");

/** Records `tag, len u32 LE, bytes` → [[tag, Buffer]...] (the format both sides use). */
function records(buf) {
  const out = [];
  let at = 0;
  while (at < buf.length) {
    const len = buf.readUInt32LE(at + 1);
    out.push([String.fromCharCode(buf[at]), buf.subarray(at + 5, at + 5 + len)]);
    at += 5 + len;
  }
  return out;
}

test("only the extensions WPT serves as application/xhtml+xml take the XML parse", () => {
  for (const rel of ["a/b.xht", "a/b.XHTML", "a/b.xml"]) assert.equal(isXmlServed(rel), true, rel);
  for (const rel of ["a/b.html", "a/b.htm", "a/b.svg", "about-blank.html", null, undefined]) {
    assert.equal(isXmlServed(rel), false, String(rel));
  }
});

test("request: VXR1 + html, base URL, title, UTC date, profile, fonts in order, image key/bytes", () => {
  const buf = encodeRequest("<p>é</p>", {
    baseUrl: "http://web-platform.test/a/b.xht",
    metadata: { title: "T", creationDate: "2000-01-01T00:00:00.000Z" },
    pdfa: "PDF/A-2b",
    fonts: [new Uint8Array([1, 2]), new Uint8Array([3])],
    images: { "http://web-platform.test/a/i.png": new Uint8Array([9, 8, 7]) },
  });
  assert.equal(buf.subarray(0, 4).toString(), "VXR1");
  const recs = records(buf.subarray(4)).map(([t, b]) => [
    t,
    t === "F" || t === "I" ? [...b] : b.toString(),
  ]);
  assert.deepEqual(recs, [
    ["H", "<p>é</p>"],
    ["B", "http://web-platform.test/a/b.xht"],
    ["T", "T"],
    ["D", "2000-1-1"],
    ["P", "PDF/A-2b"],
    ["F", [1, 2]],
    ["F", [3]],
    ["K", "http://web-platform.test/a/i.png"],
    ["I", [9, 8, 7]],
  ]);
  assert.equal(isoToDate("2026-06-25T23:30:00-03:00"), "2026-6-26");
});

const rec = (tag, s) => {
  const b = Buffer.from(s);
  const h = Buffer.alloc(5);
  h[0] = tag.charCodeAt(0);
  h.writeUInt32LE(b.length, 1);
  return Buffer.concat([h, b]);
};

test("rejection decodes to the napi error shape (located diagnostic, conformance, plain)", () => {
  const located = decodeRejection(
    Buffer.concat([
      rec("M", "Unsupported construct"),
      rec("f", "element:script"),
      rec("l", "2"),
      rec("h", "hint"),
    ]),
  );
  assert.equal(located.message, "Unsupported construct");
  assert.deepEqual(
    [located.feature, located.line, located.col, located.hint],
    ["element:script", 2, null, "hint"],
  );
  const conf = decodeRejection(
    Buffer.concat([rec("M", "m"), rec("p", "PDF/A-2b"), rec("e", "a"), rec("e", "b")]),
  );
  assert.deepEqual([conf.profile, conf.errors], ["PDF/A-2b", ["a", "b"]]);
  const plain = decodeRejection(rec("M", "render panicked: boom"));
  assert.equal(plain.message, "render panicked: boom");
  assert.equal(plain.feature, undefined);
});

function fakeSpawn({ code = 0, signal = null, stdout = Buffer.alloc(0), stderr = "" }) {
  const calls = [];
  const spawnImpl = (bin, args) => {
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = new PassThrough();
    const input = [];
    child.stdin.on("data", (c) => input.push(c));
    child.stdin.on("finish", () => {
      calls.push({ bin, args, input: Buffer.concat(input) });
      child.stdout.end(stdout);
      child.stderr.end(stderr);
      setImmediate(() => child.emit("close", code, signal));
    });
    return child;
  };
  return { spawnImpl, calls };
}

test("bridge: exit 0 resolves the PDF, 3 rejects with the diagnostic, 2 rejects with stderr", async () => {
  const ok = fakeSpawn({ stdout: Buffer.from("%PDF-1.7") });
  const pdf = await makeXhtmlBridge({ bin: "/x/xhtml_render", spawnImpl: ok.spawnImpl }).render(
    "<p/>",
    {},
  );
  assert.equal(Buffer.from(pdf).toString(), "%PDF-1.7");
  assert.equal(ok.calls[0].bin, "/x/xhtml_render");
  assert.equal(ok.calls[0].input.subarray(0, 4).toString(), "VXR1");
  const rej = fakeSpawn({
    code: 3,
    stdout: Buffer.concat([rec("M", "m"), rec("f", "css:x"), rec("h", "h")]),
  });
  await assert.rejects(
    makeXhtmlBridge({ bin: "b", spawnImpl: rej.spawnImpl }).render("", {}),
    (e) => {
      assert.deepEqual([e.feature, e.line, e.col, e.hint], ["css:x", null, null, "h"]);
      return true;
    },
  );
  const bad = fakeSpawn({ code: 2, stderr: "xhtml_render: request has no html record" });
  await assert.rejects(
    makeXhtmlBridge({ bin: "b", spawnImpl: bad.spawnImpl }).render("", {}),
    /no html record/,
  );
});

test("bridge: a render process killed by a signal re-raises it in the worker (crash parity)", async () => {
  const raised = [];
  const killed = fakeSpawn({ code: null, signal: "SIGABRT" });
  await assert.rejects(
    makeXhtmlBridge({ bin: "b", spawnImpl: killed.spawnImpl, raise: (s) => raised.push(s) }).render(
      "",
      {},
    ),
    /SIGABRT/,
  );
  assert.deepEqual(raised, ["SIGABRT"]);
});

test("render adapter: .xht nodes get the bridge, .html nodes the product path", async () => {
  const seen = [];
  const vellora = {
    async renderPdf(html, data, opts) {
      seen.push({ html, data, bridge: opts._bridge ?? null, strict: opts.strict });
      return new Uint8Array([1]);
    },
  };
  const bridge = { render: async () => new Uint8Array() };
  const render = makeVelloraRender({ vellora, wptRoot: repo, xhtmlBridge: bridge });
  const url = (rel) => `http://web-platform.test/${rel}`;
  await render({
    url: url("t/a.xht"),
    rel: "t/a.xht",
    content: "<html><head></head></html>",
    mode: "screen",
  });
  await render({
    url: url("t/a.html"),
    rel: "t/a.html",
    content: "<html><head></head></html>",
    mode: "screen",
  });
  assert.deepEqual(
    seen.map((s) => [s.bridge === bridge, s.strict, s.data]),
    [
      [true, true, undefined],
      [false, true, undefined],
    ],
  );
  // Without a bridge (--xhtml-parser html) every node takes the product path.
  const plain = makeVelloraRender({ vellora, wptRoot: repo });
  await plain({
    url: url("t/a.xht"),
    rel: "t/a.xht",
    content: "<html><head></head></html>",
    mode: "screen",
  });
  assert.equal(seen.at(-1).bridge, null);
});

const bin = xhtmlRenderBin(repo);
test(
  "real xhtml_render: XML parse through renderPdf (CDATA style, non-void <br>), diagnostics mapped",
  { skip: existsSync(bin) ? false : `xhtml_render not built (${bin})` },
  async () => {
    const vellora = await import("vellora");
    const bridge = makeXhtmlBridge({ bin });
    const xht =
      '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">' +
      '<html xmlns="http://www.w3.org/1999/xhtml"><head><style><![CDATA[ p { margin: 0 } ]]></style></head>' +
      "<body><p>head<br>tail</br></p></body></html>";
    const pdf = await vellora.renderPdf(xht, undefined, { strict: true, _bridge: bridge });
    assert.equal(Buffer.from(pdf.subarray(0, 5)).toString(), "%PDF-");
    await assert.rejects(
      vellora.renderPdf(
        '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>\n<script>1</script></body></html>',
        undefined,
        {
          strict: true,
          _bridge: bridge,
        },
      ),
      (e) => {
        assert.equal(e.name, "VelloraUnsupportedError");
        assert.deepEqual([e.feature, e.line, e.col], ["element:script", 2, 1]);
        return true;
      },
    );
  },
);
