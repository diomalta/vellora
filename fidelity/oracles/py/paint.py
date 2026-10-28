"""Paint facts of a PDF for the report-only paint probe (fidelity/oracles/paint-probe.mjs).

Usage: python -I paint.py FILE.pdf
Prints {"tool": "pymupdf", "version", "pages": [{"page", "width", "height", "canvas",
"dashSegments", "dashLengthPt", "underlines", "underlineLengthPt"}]}; coordinates are PDF points,
origin top-left (MuPDF convention).

Three measurements, each the cheapest that separates a correct paint from the three differences
found in Phase C step 04 (canvas background not painted, dashed/dotted borders drawn solid,
text-decoration lines missing). They read vector paint only (PyMuPDF get_drawings, text
spans), never pixels, so they do not depend on a rasterizer.

- canvas: the largest filled sub-path of the page by area when it covers at least half of the
  page ({"color": "#rrggbb", "coverage": area / page area}), else null. Chrome paints the canvas
  background as one rect over the page area of every page; vellora since step 04 as well.
- dashSegments / dashLengthPt: filled sub-paths shaped like a dash or a dot of a border: short
  side 0 < s <= 6 pt, long side l with 0.5 s <= l <= 3.2 s + 0.5 pt (a 1 px dash is 0.75 x 2.25
  pt, a 4 px one 3 x 6 pt, a dot s x s). A solid border side is one long sub-path, so a
  dashed border drawn solid counts 0. Chrome draws each dashed side as one path of many
  sub-paths, vellora as one rect per dash: both are counted per sub-path.
- underlines / underlineLengthPt: thin horizontal filled sub-paths (height <= 3 pt, width >=
  max(2 pt, 5 x height)) whose top lies between 0.05 em above and 0.3 em below the baseline of
  a text span, inside the span's horizontal extent (1 pt slack) and at least half its width.
  Chrome draws one underline rect per text fragment, so a table rule under a cell's text, which
  runs past the text, is not counted.
"""

import json
import sys
from importlib.metadata import version

import pymupdf


def subpaths(drawing):
    """Bounding boxes (x0, y0, x1, y1) of the sub-paths of one drawing."""
    boxes = []
    cur = []
    last = None
    for item in drawing["items"]:
        kind = item[0]
        if kind == "re":
            r = item[1]
            boxes.append((r.x0, r.y0, r.x1, r.y1))
            last = None
            continue
        if kind == "qu":
            q = item[1]
            pts = [q.ul, q.ur, q.ll, q.lr]
            boxes.append((min(p.x for p in pts), min(p.y for p in pts), max(p.x for p in pts), max(p.y for p in pts)))
            last = None
            continue
        pts = [p for p in item[1:] if hasattr(p, "x")]
        if not pts:
            continue
        if last is None or abs(pts[0].x - last.x) > 1e-3 or abs(pts[0].y - last.y) > 1e-3:
            if cur:
                boxes.append(bbox(cur))
            cur = []
        cur.extend(pts)
        last = pts[-1]
    if cur:
        boxes.append(bbox(cur))
    return boxes


def bbox(pts):
    return (min(p.x for p in pts), min(p.y for p in pts), max(p.x for p in pts), max(p.y for p in pts))


def hex_color(c):
    return "#%02x%02x%02x" % tuple(max(0, min(255, round(v * 255))) for v in c[:3])


def spans_of(page):
    out = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for s in line["spans"]:
                if not s["text"].strip():
                    continue
                out.append((s["bbox"][0], s["bbox"][2], s["origin"][1], s["size"]))
    return out


def page_facts(page):
    width, height = page.rect.width, page.rect.height
    page_area = width * height
    fills = []
    for d in page.get_drawings():
        if d.get("fill") is None:
            continue
        color = hex_color(d["fill"])
        for box in subpaths(d):
            fills.append((box, color))
    canvas = None
    best = max(fills, key=lambda f: (f[0][2] - f[0][0]) * (f[0][3] - f[0][1]), default=None)
    if best is not None:
        (x0, y0, x1, y1), color = best
        coverage = (x1 - x0) * (y1 - y0) / page_area
        if coverage >= 0.5:
            canvas = {"color": color, "coverage": round(coverage, 4)}
    dash_count = 0
    dash_len = 0.0
    spans = spans_of(page)
    under_count = 0
    under_len = 0.0
    for (x0, y0, x1, y1), _color in fills:
        w, h = x1 - x0, y1 - y0
        short, long = min(w, h), max(w, h)
        if 0 < short <= 6.0 and 0.5 * short <= long <= 3.2 * short + 0.5:
            dash_count += 1
            dash_len += long
            continue
        if 0 < h <= 3.0 and w >= max(2.0, 5.0 * h):
            for sx0, sx1, baseline, size in spans:
                if x0 < sx0 - 1.0 or x1 > sx1 + 1.0 or w < 0.5 * (sx1 - sx0):
                    continue
                if baseline - 0.05 * size <= y0 <= baseline + 0.3 * size:
                    under_count += 1
                    under_len += w
                    break
    return {
        "width": round(width, 2),
        "height": round(height, 2),
        "canvas": canvas,
        "dashSegments": dash_count,
        "dashLengthPt": round(dash_len, 2),
        "underlines": under_count,
        "underlineLengthPt": round(under_len, 2),
    }


def main():
    doc = pymupdf.open(sys.argv[1])
    pages = []
    for i, page in enumerate(doc):
        facts = page_facts(page)
        facts["page"] = i + 1
        pages.append(facts)
    print(json.dumps({"tool": "pymupdf", "version": version("pymupdf"), "pages": pages}))


if __name__ == "__main__":
    main()
