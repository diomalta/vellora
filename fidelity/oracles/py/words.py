"""Word anchors for the layout-consensus oracle, from PyMuPDF character ORIGINS.

Usage: python -I words.py FILE.pdf
Prints {"tool": "pymupdf", "version", "pages": [{"page", "width", "height", "words": [...],
"offPage": [...]}]}.

Each word is {"text", "x" (pen origin of its first glyph), "baseline" (origin y), "x1" (right
edge of its last glyph box), "size", "font"}; coordinates are PDF points, origin top-left of the
page (MuPDF convention), y growing down.

Why origins and not word boxes: a word box's top/bottom come from the embedded font's ascent/
descent as the PRODUCER declares them (krilla and Chromium declare different ascents for the
same font file; see benchmarks/geometry-fidelity.mjs), so box tops differ with no glyph moving.
The origin (pen position on the baseline) is where the glyph is actually placed.

Words are split on whitespace characters and at span/line boundaries, mirroring
page.get_text("words").

`words` are the words MuPDF reports inside the page (its text device clips to the page: a glyph
drawn outside the MediaBox is not reported; CONFIRMED 2026-10-22 on the step-09 postmark PDF,
whose tail at 855-1111 pt on an 841.92 pt page is absent). `offPage` lists, in the same shape,
the words of an unclipped extraction (clip = INFINITE_RECT) whose first-glyph origin lies outside
the page rectangle: text a reader never sees, which the pdf-probe gate ratchets (2026-10-22).
"""

import json
import sys
from importlib.metadata import version

import pymupdf


def words_of_page(page, clip=None):
    words = []
    flags = pymupdf.TEXT_PRESERVE_LIGATURES | pymupdf.TEXT_PRESERVE_WHITESPACE
    raw = page.get_text("rawdict", flags=flags, clip=clip) if clip is not None else page.get_text("rawdict", flags=flags)
    for block in raw["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            current = None

            def flush():
                nonlocal current
                if current and current["text"].strip():
                    words.append(current)
                current = None

            for span in line["spans"]:
                for char in span["chars"]:
                    c = char["c"]
                    if c.isspace():
                        flush()
                        continue
                    if current is None:
                        current = {
                            "text": "",
                            "x": round(char["origin"][0], 3),
                            "baseline": round(char["origin"][1], 3),
                            "x1": round(char["bbox"][2], 3),
                            "size": round(span["size"], 3),
                            "font": span["font"],
                        }
                    current["text"] += c
                    current["x1"] = round(char["bbox"][2], 3)
                flush()
            flush()
    return words


def off_page_words(page):
    """Words whose first-glyph origin lies outside the page rectangle (unclipped extraction)."""
    w, h = page.rect.width, page.rect.height
    return [
        word
        for word in words_of_page(page, clip=pymupdf.INFINITE_RECT())
        if not (0 <= word["x"] <= w and 0 <= word["baseline"] <= h)
    ]


def main(path):
    pages = []
    with pymupdf.open(path) as document:
        for index, page in enumerate(document, start=1):
            pages.append(
                {
                    "page": index,
                    "width": round(page.rect.width, 3),
                    "height": round(page.rect.height, 3),
                    "words": words_of_page(page),
                    "offPage": off_page_words(page),
                }
            )
    print(json.dumps({"tool": "pymupdf", "version": version("pymupdf"), "pages": pages}, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1])
