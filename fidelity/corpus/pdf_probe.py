"""Small independent PDF probes for the corpus (no renderer code involved).

  text    --pdf F            text of every page from pypdf AND pdfminer.six (two extractors that do
                             not share code with poppler's pdftotext, which the runner also uses)
  strict  --pdf F            pypdf strict-mode parse (structural sanity only; NOT a qpdf --check)
  inkbox  --png P --dpi D    bounding box of all non-white pixels of a page raster, in mm
  columns --pdf F --page N   right edges (mm) of money-formatted tokens, clustered into columns

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


def cmd_columns(args):
    from pdfminer.high_level import extract_pages
    from pdfminer.layout import LTTextContainer, LTTextLine

    edges = []
    for i, page in enumerate(extract_pages(args.pdf), start=1):
        if i != args.page:
            continue
        height = page.height
        for el in page:
            if not isinstance(el, LTTextContainer):
                continue
            for line in el:
                if isinstance(line, LTTextLine):
                    t = line.get_text().strip()
                    if MONEY.match(t):
                        edges.append({"text": t, "x1_mm": line.x1 * MM_PER_PT, "y_mm": (height - line.y1) * MM_PER_PT})
    edges.sort(key=lambda e: e["x1_mm"])
    columns = []
    for e in edges:
        if columns and e["x1_mm"] - columns[-1][-1]["x1_mm"] < 3:
            columns[-1].append(e)
        else:
            columns.append([e])
    return {
        "tool": f"pdfminer.six {importlib.metadata.version('pdfminer.six')}",
        "page": args.page,
        "columns": [
            {
                "count": len(c),
                "x1_min_mm": round(min(e["x1_mm"] for e in c), 3),
                "x1_max_mm": round(max(e["x1_mm"] for e in c), 3),
                "spread_mm": round(max(e["x1_mm"] for e in c) - min(e["x1_mm"] for e in c), 3),
            }
            for c in columns
            if len(c) >= 3
        ],
    }


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
    args = ap.parse_args()
    out = {"text": cmd_text, "strict": cmd_strict, "inkbox": cmd_inkbox, "columns": cmd_columns}[args.cmd](args)
    json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
