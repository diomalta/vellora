import sys
import pymupdf

# Sample the page colour at named points (pt from the page edges) on every page.
for path in sys.argv[1:]:
    doc = pymupdf.open(path)
    print("==", path.split("/")[-1], "pages", doc.page_count, "size", [round(v, 1) for v in doc[0].rect])
    for pno, page in enumerate(doc):
        pix = page.get_pixmap(dpi=72)
        w, h = pix.width, pix.height
        pts = {
            "corner(2,2)": (2, 2),
            "margin-left-mid": (10, h // 2),
            "content-mid": (w // 2, h // 2),
            "content-bottom(40)": (w // 2, h - 40),
            "bottom-margin(10)": (w // 2, h - 10),
        }
        print("  p%d" % (pno + 1), {k: "#%02x%02x%02x" % pix.pixel(x, y)[:3] for k, (x, y) in pts.items()})
