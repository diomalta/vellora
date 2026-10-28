"""Small independent PDF probes for the corpus (no renderer code involved).

  text    --pdf F            text of every page from pypdf AND pdfminer.six (two extractors that do
                             not share code with poppler's pdftotext, which the runner also uses)
  strict  --pdf F            pypdf strict-mode parse (structural sanity only; NOT a qpdf --check)
  inkbox  --png P --dpi D    bounding box of all non-white pixels of a page raster, in mm
  columns --pdf F --page N --headers JSON
                             right edges (mm) of money-formatted words on page N, each assigned to
                             the column of the nearest listed header (no gap clustering)

Usage: fidelity/.venv/bin/python -I fidelity/corpus/pdf_probe.py <cmd> [args]
"""

import argparse
import importlib.metadata
import io
import json
import re
import sys

MM_PER_PT = 25.4 / 72
MONEY = re.compile(r"^[−-]?\d{1,3}(\.\d{3})*,\d{2}$")


def cmd_text(args):
    from pdfminer.high_level import extract_text
    from pypdf import PdfReader

    reader = PdfReader(args.pdf)
    return {
        "pypdf_version": importlib.metadata.version("pypdf"),
        "pdfminer_version": importlib.metadata.version("pdfminer.six"),
        "pypdf": "\n".join(page.extract_text() or "" for page in reader.pages),
        "pdfminer": extract_text(args.pdf),
    }


def cmd_strict(args):
    from pypdf import PdfReader

    try:
        with open(args.pdf, "rb") as f:
            reader = PdfReader(io.BytesIO(f.read()), strict=True)
            pages = len(reader.pages)
            for page in reader.pages:
                page.get_contents()
        return {"tool": f"pypdf {importlib.metadata.version('pypdf')} strict", "ok": True, "pages": pages}
    except Exception as e:  # noqa: BLE001 - any parse failure is the finding
        return {"tool": f"pypdf {importlib.metadata.version('pypdf')} strict", "ok": False, "error": repr(e)}


def cmd_inkbox(args):
    from PIL import Image

    img = Image.open(args.png).convert("L")
    # Anything darker than 95% white counts as ink (anti-aliased hairlines included).
    mask = img.point(lambda v: 255 if v < 242 else 0)
    box = mask.getbbox()
    px = args.dpi / 25.4
    if box is None:
        return {"empty": True}
    left, top, right, bottom = box
    return {
        "page_mm": [round(img.width / px, 3), round(img.height / px, 3)],
        "ink_mm": {
            "left": round(left / px, 3),
            "top": round(top / px, 3),
            "right_margin": round((img.width - right) / px, 3),
            "bottom_margin": round((img.height - bottom) / px, 3),
        },
    }


def page_words(page):
    """Words (text, x0, x1, top) of one pdfminer page; lines are split at spaces / LTAnno gaps, so
    two cells that pdfminer merged into one line still yield separate tokens."""
    from pdfminer.layout import LTAnno, LTChar, LTTextContainer, LTTextLine

    words = []
    for el in page:
        if not isinstance(el, LTTextContainer):
            continue
        for line in el:
            if not isinstance(line, LTTextLine):
                continue
            cur = []

            def flush():
                if cur:
                    words.append(
                        {
                            "text": "".join(c.get_text() for c in cur),
                            "x0_mm": min(c.x0 for c in cur) * MM_PER_PT,
                            "x1_mm": max(c.x1 for c in cur) * MM_PER_PT,
                            "top_mm": (page.height - max(c.y1 for c in cur)) * MM_PER_PT,
                        }
                    )
                    cur.clear()

            for item in line:
                text = item.get_text()
                if isinstance(item, LTAnno) or not text.strip():
                    flush()
                elif isinstance(item, LTChar):
                    cur.append(item)
            flush()
    return words


def find_header(words, header):
    """Right edge (mm) of the first occurrence of the header's word sequence, or None."""
    want = header.split()
    for i in range(len(words) - len(want) + 1):
        if all(words[i + k]["text"] == w for k, w in enumerate(want)):
            return words[i + len(want) - 1]["x1_mm"]
    return None


def cmd_columns(args):
    """Money tokens of one page assigned to the column of the nearest money header (by right edge).

    Column x is page-invariant for a fixed-layout table, so the header may come from any page (the
    first one that shows all headers). A token farther than half the closest header spacing from
    every header is `unassigned` (reported, and judged as a failure by the runner): an isolated
    misaligned token is measured, never dropped.
    """
    from pdfminer.high_level import extract_pages

    headers = json.loads(args.headers)
    pages = [page_words(p) for p in extract_pages(args.pdf)]
    header_x = None
    header_page = None
    for n, words in enumerate(pages, start=1):
        xs = [find_header(words, h) for h in headers]
        if all(x is not None for x in xs):
            header_x, header_page = xs, n
            break
    out = {
        "tool": f"pdfminer.six {importlib.metadata.version('pdfminer.six')}",
        "page": args.page,
        "pages": len(pages),
        "headers": headers,
    }
    if header_x is None:
        out["error"] = "money column headers not found on any page"
        return out
    out["header_page"] = header_page
    tokens = [w for w in (pages[args.page - 1] if args.page <= len(pages) else []) if MONEY.match(w["text"])]
    spacing = min(abs(a - b) for i, a in enumerate(header_x) for b in header_x[i + 1 :]) if len(header_x) > 1 else 1e9
    columns = [[] for _ in headers]
    unassigned = []
    for t in tokens:
        d = [abs(t["x1_mm"] - x) for x in header_x]
        k = d.index(min(d))
        if d[k] > spacing / 2:
            unassigned.append({"text": t["text"], "x1_mm": round(t["x1_mm"], 3)})
        else:
            columns[k].append(t)
    out["tokens"] = len(tokens)
    out["unassigned"] = unassigned
    out["columns"] = []
    for h, x, c in zip(headers, header_x, columns):
        col = {"header": h, "header_x1_mm": round(x, 3), "count": len(c)}
        if c:
            lo = min(c, key=lambda e: e["x1_mm"])
            hi = max(c, key=lambda e: e["x1_mm"])
            col.update(
                {
                    "x1_min_mm": round(lo["x1_mm"], 3),
                    "x1_max_mm": round(hi["x1_mm"], 3),
                    "spread_mm": round(hi["x1_mm"] - lo["x1_mm"], 3),
                    "outermost": [lo["text"], hi["text"]],
                }
            )
        out["columns"].append(col)
    return out


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("text", "strict"):
        p = sub.add_parser(name)
        p.add_argument("--pdf", required=True)
    p = sub.add_parser("inkbox")
    p.add_argument("--png", required=True)
    p.add_argument("--dpi", type=int, required=True)
    p = sub.add_parser("columns")
    p.add_argument("--pdf", required=True)
    p.add_argument("--page", type=int, default=1)
    p.add_argument("--headers", required=True, help="JSON list of money column header texts")
    args = ap.parse_args()
    out = {"text": cmd_text, "strict": cmd_strict, "inkbox": cmd_inkbox, "columns": cmd_columns}[args.cmd](args)
    json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
