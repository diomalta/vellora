import sys, re
import pymupdf

# For every 'H<fs> <u|o|l> <A|T>' line: the decoration rect's top/height relative to the baseline,
# in CSS px (pt / 0.75). Prints one row per line, for each PDF given.
res = {}
for path in sys.argv[1:]:
    doc = pymupdf.open(path)
    rows = {}
    for page in doc:
        rects = [d["rect"] for d in page.get_drawings() if d.get("fill") is not None]
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                for s in l["spans"]:
                    m = re.match(r"H(\d+) ([uol]) ([AT])", s["text"])
                    if not m:
                        continue
                    bx = s["origin"][1]
                    x0 = s["origin"][0]
                    near = [r for r in rects if abs(r.x0 - x0) < 1 and -2.0 * s["size"] < r.y0 - bx < 1.0 * s["size"]]
                    near.sort(key=lambda r: abs(r.y0 - bx))
                    key = (m.group(3), int(m.group(1)), m.group(2))
                    if near:
                        r = near[0]
                        rows[key] = (round((r.y0 - bx) / 0.75, 3), round(r.height / 0.75, 3), round(bx / 0.75, 3), round(r.width / 0.75, 2))
                    else:
                        rows[key] = (None, None, round(bx / 0.75, 3), None)
    res[path] = rows
paths = sys.argv[1:]
keys = sorted(set().union(*[set(r) for r in res.values()]))
for k in keys:
    print(k, " | ".join(str(res[p].get(k)) for p in paths))
