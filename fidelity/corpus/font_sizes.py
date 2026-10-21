"""Font-size / font-family oracle for the corpus (pdfminer.six, independent of the renderer).

Usage:
  fidelity/.venv/bin/python -I fidelity/corpus/font_sizes.py --pdf FILE.pdf --rules RULES.json

RULES.json: {"page": 1, "rules": [{"id": str, "text": str, "min_pt": float, "max_pt": float?,
             "bold": bool|null, "pos": {"x_mm", "top_mm", "tol_mm"}?}], "families": [str, ...] | null}
For every rule, finds the first text line on the page that contains `text` (whitespace-insensitive)
and reports the glyph sizes, fonts and glyph-box position (mm from the top-left corner) of the
matching characters; `pos` turns the position into a pass/fail check. `families` (optional) lists the allowed
font-name substrings for every glyph on the page (DANFE 3.7: Times New Roman or Courier New, i.e.
the metric-compatible Liberation Serif / Liberation Mono substitutes in this repo).
"""

import argparse
import importlib.metadata
import json
import re
import sys

from pdfminer.high_level import extract_pages
from pdfminer.layout import LTChar, LTTextContainer, LTTextLine

MM_PER_PT = 25.4 / 72


def lines_of(layout):
    for element in layout:
        if isinstance(element, LTTextContainer):
            for line in element:
                if isinstance(line, LTTextLine):
                    chars = [c for c in line if isinstance(c, LTChar)]
                    if chars:
                        yield chars


def squash(s):
    return re.sub(r"\s+", "", s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", required=True)
    ap.add_argument("--rules", required=True)
    args = ap.parse_args()
    with open(args.rules, encoding="utf-8") as f:
        spec = json.load(f)
    page_no = spec.get("page", 1)
    layout = None
    for i, page in enumerate(extract_pages(args.pdf), start=1):
        if i == page_no:
            layout = page
            break
    out = {
        "tool": "pdfminer.six",
        "tool_version": importlib.metadata.version("pdfminer.six"),
        "pdf": args.pdf,
        "page": page_no,
        "rules": [],
    }
    lines = list(lines_of(layout)) if layout is not None else []
    for rule in spec["rules"]:
        target = squash(rule["text"])
        hit = None
        for chars in lines:
            text = "".join(c.get_text() for c in chars)
            flat = squash(text)
            idx = flat.find(target)
            if idx >= 0:
                visible = [c for c in chars if c.get_text().strip()]
                hit = visible[idx : idx + len(target)]
                break
        if not hit:
            out["rules"].append({**rule, "found": False, "ok": False})
            continue
        sizes = sorted({round(c.size, 2) for c in hit})
        fonts = sorted({c.fontname for c in hit})
        ok = min(sizes) + 0.05 >= rule.get("min_pt", 0)
        if "max_pt" in rule:
            ok = ok and max(sizes) - 0.05 <= rule["max_pt"]
        if rule.get("bold") is True:
            ok = ok and all("bold" in f.lower() for f in fonts)
        # Glyph-box position of the match in mm from the page's top-left corner.
        page_h = layout.height
        box = {
            "x_mm": round(min(c.x0 for c in hit) * MM_PER_PT, 2),
            "top_mm": round((page_h - max(c.y1 for c in hit)) * MM_PER_PT, 2),
        }
        entry = {**rule, "found": True, "sizes_pt": sizes, "fonts": fonts, "box": box}
        if "pos" in rule:
            dx = box["x_mm"] - rule["pos"]["x_mm"]
            dy = box["top_mm"] - rule["pos"]["top_mm"]
            entry["pos_error_mm"] = {"dx": round(dx, 2), "dy": round(dy, 2)}
            ok = ok and abs(dx) <= rule["pos"]["tol_mm"] and abs(dy) <= rule["pos"]["tol_mm"]
        entry["ok"] = ok
        out["rules"].append(entry)
    families = spec.get("families")
    if families:
        fonts = sorted({c.fontname for chars in lines for c in chars})
        bad = [f for f in fonts if not any(fam.lower() in f.lower() for fam in families)]
        out["families"] = {"allowed": families, "seen": fonts, "violations": bad, "ok": not bad}
    out["min_glyph_pt"] = round(min((c.size for chars in lines for c in chars), default=0), 2)
    json.dump(out, sys.stdout, indent=1, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
