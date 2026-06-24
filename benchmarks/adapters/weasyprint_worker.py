#!/usr/bin/env python3
"""Long-lived WeasyPrint worker.

CRITICAL FAIRNESS CONTRACT: WeasyPrint is imported ONCE, at worker startup, and
then renders MANY documents in-process over the worker's lifetime. We never
spawn a new Python interpreter (or re-import WeasyPrint) per render — that was
the pdf4.dev methodology flaw (it measured interpreter startup, not rendering)
and reproducing it, even in our favor, would be dishonest.

Protocol (one warm worker, many renders):
  - On startup, print a single JSON line: {"ready": true, "version": "<x.y>"}
  - Then loop: read one length-prefixed HTML request, render it in-process,
    write back a length-prefixed PDF (or a JSON error line).

Framing avoids any ambiguity between HTML/PDF bytes and control messages:
  request:  b"R" + 4-byte big-endian length + utf-8 HTML bytes
  response: b"P" + 4-byte big-endian length + PDF bytes        (success)
            b"E" + 4-byte big-endian length + utf-8 JSON error (failure)
"""
import json
import struct
import sys


def _read_exact(stream, n):
    buf = bytearray()
    while len(buf) < n:
        chunk = stream.read(n - len(buf))
        if not chunk:
            return None
        buf.extend(chunk)
    return bytes(buf)


def main():
    out = sys.stdout.buffer
    inp = sys.stdin.buffer

    try:
        # The one and only import — happens once for the whole worker lifetime.
        from weasyprint import HTML  # noqa: E402
        import weasyprint  # noqa: E402

        version = getattr(weasyprint, "__version__", "unknown")
    except Exception as exc:  # pragma: no cover - environment-dependent
        out.write((json.dumps({"ready": False, "error": str(exc)}) + "\n").encode("utf-8"))
        out.flush()
        return 1

    out.write((json.dumps({"ready": True, "version": version}) + "\n").encode("utf-8"))
    out.flush()

    while True:
        tag = _read_exact(inp, 1)
        if tag is None:
            break  # parent closed stdin -> shut down
        if tag == b"Q":  # explicit quit
            break
        if tag != b"R":
            continue
        size_bytes = _read_exact(inp, 4)
        if size_bytes is None:
            break
        (size,) = struct.unpack(">I", size_bytes)
        html_bytes = _read_exact(inp, size)
        if html_bytes is None:
            break
        try:
            html = html_bytes.decode("utf-8")
            pdf = HTML(string=html).write_pdf()  # in-process render, warm process
            out.write(b"P" + struct.pack(">I", len(pdf)))
            out.write(pdf)
            out.flush()
        except Exception as exc:  # render error for THIS doc; keep the worker alive
            payload = json.dumps({"error": str(exc)}).encode("utf-8")
            out.write(b"E" + struct.pack(">I", len(payload)))
            out.write(payload)
            out.flush()

    return 0


if __name__ == "__main__":
    sys.exit(main())
