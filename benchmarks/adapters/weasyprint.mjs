/**
 * WeasyPrint adapter — INTENDED LONG-LIVED MODE (in-process warm worker).
 *
 * WeasyPrint is a Python library, so the closest fair analogue to a long-lived
 * Node service is a long-lived Python WORKER that imports WeasyPrint ONCE and
 * renders many documents over its lifetime. This adapter starts exactly one
 * such worker (weasyprint_worker.py) and streams render requests to it over a
 * length-prefixed stdio protocol.
 *
 * We deliberately do NOT spawn a subprocess per render — that strawman (the
 * pdf4.dev flaw) measures Python startup, not rendering: WeasyPrint runs
 * in-process, not subprocess-per-render.
 *
 * WeasyPrint is installed out-of-band (pip install weasyprint==62.3); if the
 * worker fails to import it, create() throws ADAPTER_PENDING.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER = join(__dirname, "weasyprint_worker.py");
const PYTHON = process.env.PYTHON ?? "python3";

export const meta = {
  id: "weasyprint",
  kind: "in-process",
  longLivedMode: "in-process inside a warm long-lived Python worker (single import, many renders)",
};

function frame(tag, body) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  return Buffer.concat([Buffer.from(tag, "ascii"), len, body]);
}

export async function create() {
  const child = spawn(PYTHON, [WORKER], { stdio: ["pipe", "pipe", "pipe"] });

  // --- read-side state machine over the framed stdout protocol ---
  let buf = Buffer.alloc(0);
  const waiters = []; // FIFO of { resolve, reject } for pending renders
  let readyResolve;
  let readyReject;
  const ready = new Promise((res, rej) => {
    readyResolve = res;
    readyReject = rej;
  });
  let gotReady = false;

  function fail(err) {
    if (!gotReady) readyReject(err);
    while (waiters.length) waiters.shift().reject(err);
  }

  child.on("error", fail);
  child.on("exit", (code) => {
    if (code) fail(new Error(`WeasyPrint worker exited with code ${code}`));
  });

  let stderr = "";
  child.stderr.on("data", (d) => {
    stderr += d.toString();
  });

  child.stdout.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      if (!gotReady) {
        // Readiness is a single JSON line terminated by \n.
        const nl = buf.indexOf(0x0a);
        if (nl === -1) return;
        const line = buf.subarray(0, nl).toString("utf-8");
        buf = buf.subarray(nl + 1);
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        gotReady = true;
        if (msg.ready) readyResolve(msg.version ?? "unknown");
        else readyReject(new Error(msg.error ?? "WeasyPrint worker not ready"));
        continue;
      }
      // Framed response: tag(1) + len(4) + body.
      if (buf.length < 5) return;
      const tag = String.fromCharCode(buf[0]);
      const size = buf.readUInt32BE(1);
      if (buf.length < 5 + size) return;
      const body = buf.subarray(5, 5 + size);
      buf = buf.subarray(5 + size);
      const waiter = waiters.shift();
      if (!waiter) continue;
      if (tag === "P") waiter.resolve(new Uint8Array(body));
      else if (tag === "E") {
        let detail = body.toString("utf-8");
        try {
          detail = JSON.parse(detail).error ?? detail;
        } catch {
          /* keep raw */
        }
        waiter.reject(new Error(`WeasyPrint render error: ${detail}`));
      }
    }
  });

  let version;
  try {
    version = await ready;
  } catch (err) {
    try {
      child.kill();
    } catch {
      /* ignore */
    }
    const e = new Error(
      `WeasyPrint worker unavailable (pip install weasyprint==62.3). Underlying: ${err?.message ?? err}${stderr ? ` | stderr: ${stderr.trim()}` : ""}`,
    );
    e.code = "ADAPTER_PENDING";
    throw e;
  }

  return {
    mode: meta.longLivedMode,
    version,
    /** @param {string} html @returns {Promise<Uint8Array>} */
    render(html) {
      return new Promise((resolve, reject) => {
        waiters.push({ resolve, reject });
        child.stdin.write(frame("R", Buffer.from(html, "utf-8")));
      });
    },
    async close() {
      try {
        child.stdin.write(Buffer.from("Q", "ascii"));
        child.stdin.end();
      } catch {
        /* ignore */
      }
      child.kill();
    },
  };
}
