"""Deliberately broken PDFs for the pdf-probe v2 canaries (fidelity/oracles/lib/canaries.mjs).

Usage (python -I pdf_mutate.py <command> IN OUT ...); prints one JSON object describing the
mutation that was applied (or {"applied": false, "reason": ...}):

  set-ascent IN OUT VALUE           every FontDescriptor's /Ascent := VALUE (per 1000 em); glyph
                                    positions are untouched, only what a bbox-based extractor
                                    derives from the descriptor changes (pdftotext yMin)
  delete-word IN OUT PAGE X Y       remove the glyphs of the word whose first glyph origin is at
                                    (X, Y) (pt, top-left origin, Y = baseline) by a PyMuPDF
                                    redaction confined to that word's characters
  shift-run IN OUT PAGE X Y DY      move the krilla glyph run whose text matrix starts at (X, Y)
                                    (`1 0 0 -1 X Y Tm` under krilla's `1 0 0 -1 0 H cm` flip, so Y is
                                    the run's baseline from the page top) down by DY pt

Coordinates are those of fidelity/oracles/py/words.py (MuPDF: origin top-left, y down).
"""

import json
import re
import sys

import pymupdf


def set_ascent(src, dst, value):
    doc = pymupdf.open(src)
    changed = []
    for xref in range(1, doc.xref_length()):
        try:
            kind = doc.xref_get_key(xref, "Type")
        except Exception:  # noqa: BLE001 - free / broken xref entries
            continue
        if kind[1] != "/FontDescriptor":
            continue
        before = doc.xref_get_key(xref, "Ascent")[1]
        doc.xref_set_key(xref, "Ascent", str(value))
        changed.append(
            {"xref": xref, "font": doc.xref_get_key(xref, "FontName")[1], "before": before, "after": str(value)}
        )
    doc.save(dst)
    return {"applied": bool(changed), "descriptors": changed}


def chars_of_word(page, x, y, tol=0.02):
    raw = page.get_text("rawdict", flags=pymupdf.TEXT_PRESERVE_LIGATURES | pymupdf.TEXT_PRESERVE_WHITESPACE)
    for block in raw["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                chars = span["chars"]
                for i, c in enumerate(chars):
                    if c["c"].isspace():
                        continue
                    if abs(c["origin"][0] - x) > tol or abs(c["origin"][1] - y) > tol:
                        continue
                    if i > 0 and not chars[i - 1]["c"].isspace():
                        continue  # not the first glyph of a word
                    word = []
                    for d in chars[i:]:
                        if d["c"].isspace():
                            break
                        word.append(d)
                    return word, span["size"]
    return None, None


def delete_word(src, dst, page_no, x, y):
    doc = pymupdf.open(src)
    page = doc[page_no - 1]
    word, size = chars_of_word(page, x, y)
    if not word:
        return {"applied": False, "reason": f"no word starts at ({x}, {y}) on page {page_no}"}
    text = "".join(c["c"] for c in word)
    # A thin band through the middle of the glyphs (well inside the line, away from the lines
    # above and below), from the first glyph's centre to the last glyph's centre: a redaction
    # removes the characters whose box the rectangle touches, so neighbours stay.
    first, last = word[0]["bbox"], word[-1]["bbox"]
    x0 = (first[0] + first[2]) / 2
    x1 = (last[0] + last[2]) / 2
    band = y - 0.3 * size
    rect = pymupdf.Rect(x0, band - 0.05 * size, max(x1, x0 + 0.01), band + 0.05 * size)
    page.add_redact_annot(rect)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    doc.save(dst)
    return {"applied": True, "text": text, "page": page_no, "x": x, "y": y, "rect": list(rect)}


TM = re.compile(rb"1 0 0 -1 (-?[\d.]+) (-?[\d.]+) Tm")


def shift_run(src, dst, page_no, x, y, dy, tol=0.02):
    doc = pymupdf.open(src)
    page = doc[page_no - 1]
    for xref in page.get_contents():
        data = doc.xref_stream(xref)
        for m in TM.finditer(data):
            tx, ty = float(m.group(1)), float(m.group(2))
            if abs(tx - x) <= tol and abs(ty - y) <= tol:
                new = b"1 0 0 -1 %s %s Tm" % (m.group(1), repr(round(ty + dy, 6)).encode())
                doc.update_stream(xref, data[: m.start()] + new + data[m.end() :])
                doc.save(dst)
                return {"applied": True, "page": page_no, "x": tx, "y": ty, "dy": dy}
    return {"applied": False, "reason": f"no krilla text matrix at ({x}, {y}) on page {page_no}"}


def main(argv):
    cmd, src, dst = argv[0], argv[1], argv[2]
    if cmd == "set-ascent":
        out = set_ascent(src, dst, float(argv[3]))
    elif cmd == "delete-word":
        out = delete_word(src, dst, int(argv[3]), float(argv[4]), float(argv[5]))
    elif cmd == "shift-run":
        out = shift_run(src, dst, int(argv[3]), float(argv[4]), float(argv[5]), float(argv[6]))
    else:
        raise SystemExit(f"unknown command {cmd}")
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1:])
