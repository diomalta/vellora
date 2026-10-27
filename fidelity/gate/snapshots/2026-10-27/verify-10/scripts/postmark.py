import sys

import pymupdf

d = sys.argv[1]
for name in ("chrome.pdf", "vellora.pdf"):
    doc = pymupdf.open(f"{d}/{name}")
    for pno, page in enumerate(doc, 1):
        h = page.rect.height
        raw = page.get_text("rawdict", flags=0, clip=None)
        for b in raw["blocks"]:
            for line in b.get("lines", []):
                for s in line["spans"]:
                    t = "".join(c["c"] for c in s["chars"])
                    if "Product" in t or "Download" in t:
                        o = s["chars"][0]["origin"]
                        print(name, "p", pno, "h", round(h, 2), repr(t), "origin", tuple(round(x, 3) for x in o), "color", hex(s["color"]))
