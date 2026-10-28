#!/usr/bin/env python3
"""Text spans per font of a PDF (PyMuPDF), to see what a host's fallback font draws.

usage: font-spans.py <pdf> [<font substring>]   (prints page, font, size, bbox, text)
"""
import sys
import fitz  # PyMuPDF, from fidelity/.venv

doc = fitz.open(sys.argv[1])
want = sys.argv[2] if len(sys.argv) > 2 else None
for pno, page in enumerate(doc, 1):
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                if want is None or want in span["font"]:
                    x0, y0, x1, y1 = span["bbox"]
                    print(f"p{pno} {span['font']} {span['size']:.2f} "
                          f"({x0:.2f},{y0:.2f},{x1:.2f},{y1:.2f}) {span['text']!r}")
