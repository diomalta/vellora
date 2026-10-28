import sys
import pymupdf

# Per drawing: decompose into sub-shapes (by closing 'l' runs / 're' / 'c' curves), report the
# intervals along the long axis in CSS px: count, first/last, dash lengths, gaps.
path = sys.argv[1]
pno = int(sys.argv[2]) if len(sys.argv) > 2 else 1
doc = pymupdf.open(path)
page = doc[pno - 1]
px = lambda v: round(v / 0.75, 3)
for d in page.get_drawings():
    r = d["rect"]
    horiz = r.width >= r.height
    # group points into subpaths: a new subpath starts when an item's first point != previous last point
    subs = []
    cur = []
    last = None
    for it in d["items"]:
        pts = [p for p in it[1:] if hasattr(p, "x")]
        if it[0] == "re":
            rr = it[1]
            subs.append([pymupdf.Point(rr.x0, rr.y0), pymupdf.Point(rr.x1, rr.y1)])
            last = None
            continue
        if last is None or abs(pts[0].x - last.x) > 1e-3 or abs(pts[0].y - last.y) > 1e-3:
            if cur:
                subs.append(cur)
            cur = []
        cur.extend(pts)
        last = pts[-1]
    if cur:
        subs.append(cur)
    iv = []
    for s in subs:
        a = [p.x if horiz else p.y for p in s]
        iv.append((min(a), max(a)))
    iv.sort()
    lens = [px(b - a) for a, b in iv]
    gaps = [px(iv[i + 1][0] - iv[i][1]) for i in range(len(iv) - 1)]
    kinds = sorted(set(it[0] for it in d["items"]))
    print("fill" if d.get("fill") else "stroke", "#%02x%02x%02x" % tuple(round(v * 255) for v in (d.get("fill") or d.get("color"))),
          "H" if horiz else "V", "rect px", [px(v) for v in r], "n", len(iv), kinds,
          "lens", sorted(set(lens))[:6], "gaps", sorted(set(gaps))[:6], "first", lens[:2], "last", lens[-2:])
