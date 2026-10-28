"""Phase C step 03 repro reader: filled rects and text-span origins of every page of the PDFs in
<dir>/index.json (chrome-page-box.mjs output), in CSS px (pt x 4/3).

    fidelity/.venv/bin/python -I pdf-geometry.py <dir>
"""
import json
import sys

import pymupdf

PX = 0.75
out = sys.argv[1]
idx = json.load(open(f"{out}/index.json"))
for probe in idx["probes"]:
    doc = pymupdf.open(f"{out}/{probe['file']}")
    print(f"== {probe['rule']}{' (rtl)' if probe.get('rtl') else ''}  pages={len(doc)}")
    for pn, page in enumerate(doc):
        print(f"  page {pn + 1} W={page.rect.width / PX:.3f} H={page.rect.height / PX:.3f} px")
        for d in page.get_drawings():
            if d.get("fill"):
                r = d["rect"]
                print("   rect", tuple(round(c, 2) for c in d["fill"]),
                      *(round(v / PX, 3) for v in (r.x0, r.y0, r.x1, r.y1)))
        for block in page.get_text("rawdict")["blocks"]:
            for line in block.get("lines", []):
                for span in line["spans"]:
                    chars = span["chars"]
                    if chars:
                        print("   text", "".join(c["c"] for c in chars),
                              round(chars[0]["origin"][0] / PX, 3),
                              round(chars[0]["origin"][1] / PX, 3),
                              round(chars[-1]["bbox"][2] / PX, 3))
