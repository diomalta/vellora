"""Print the bundled Liberation font metrics the corpus converts between mm and pt.

Usage: fidelity/.venv/bin/python -I fidelity/corpus/font_metrics.py

The boleto criteria BOL-T1..T3 (fidelity/ACCEPTANCE.md) turn "character height in mm" into a font
size using ONE metric, the flat digit / cap height of Liberation Sans (0.688 em: "1", "4", "7",
"H"); the DANFE chave width estimate uses Liberation Serif advances. This script re-derives those
numbers from the TTF files vellora embeds (crates/vellora-core/src/fonts) with fontTools (pinned in
requirements.txt) and prints the derived thresholds under "derived" (test/fixtures.test.mjs checks
that fidelity/corpus/corpus.json uses exactly these values). It also prints the alternative
"full ink" reading of BOL-T3 (ascender/accent top to cedilla bottom of the exact string), which is
not judged but which the fixture also satisfies.
"""

import importlib.metadata
import json
from pathlib import Path

from fontTools.ttLib import TTFont

FONT_DIR = Path(__file__).resolve().parents[2] / "crates" / "vellora-core" / "src" / "fonts"
FACES = [
    "LiberationSans-Regular.ttf",
    "LiberationSans-Bold.ttf",
    "LiberationSerif-Regular.ttf",
    "LiberationSerif-Bold.ttf",
]


def metrics(path):
    font = TTFont(path)
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    glyf = font["glyf"]
    hmtx = font["hmtx"]

    def top(ch):
        return glyf[cmap[ord(ch)]].yMax / upm

    def bottom(ch):
        return glyf[cmap[ord(ch)]].yMin / upm

    def adv(ch):
        return hmtx[cmap[ord(ch)]][0] / upm

    return {
        "unitsPerEm": upm,
        "capHeight_H_em": round(top("H"), 5),
        "digit1_height_em": round(top("1"), 5),
        "digit0_top_em": round(top("0"), 5),
        "digit0_bottom_em": round(bottom("0"), 5),
        "advance_digit_em": round(adv("0"), 5),
        "advance_space_em": round(adv(" "), 5),
        "advance_period_em": round(adv("."), 5),
    }


PT_PER_MM = 72 / 25.4


def ink_em(path, text):
    font = TTFont(path)
    upm = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    glyf = font["glyf"]
    boxes = [glyf[cmap[ord(ch)]] for ch in text if not ch.isspace()]
    return (max(g.yMax for g in boxes) - min(g.yMin for g in boxes)) / upm


def main():
    out = {"fonttools": importlib.metadata.version("fonttools")}
    for face in FACES:
        out[face] = metrics(FONT_DIR / face)
    flat = out["LiberationSans-Bold.ttf"]["digit1_height_em"]
    assert flat == out["LiberationSans-Regular.ttf"]["digit1_height_em"]
    via = "Ficha de Compensação"
    via_ink = ink_em(FONT_DIR / "LiberationSans-Regular.ttf", via)
    out["derived"] = {
        "metric": "Liberation Sans flat digit / cap height",
        "metric_em": flat,
        "BOL-T1": {"min_pt": round(5 * PT_PER_MM / flat, 2), "basis": "5 mm, BCB-2926 I"},
        "BOL-T2": {
            "min_pt": round(3.5 * PT_PER_MM / flat, 2),
            "max_pt": round(4 * PT_PER_MM / flat, 2),
            "basis": "3.5-4 mm, BCB-2926 II",
        },
        "BOL-T3": {"max_pt": round(2 * PT_PER_MM / flat, 2), "basis": "<= 2 mm, BCB-2926 V"},
        "BOL-T3-full-ink (alternative reading, not judged)": {
            "ink_em": round(via_ink, 4),
            "max_pt": round(2 * PT_PER_MM / via_ink, 2),
            "basis": f"top of the highest to bottom of the lowest glyph of {via!r}",
        },
    }
    print(json.dumps(out, indent=1, ensure_ascii=False))


if __name__ == "__main__":
    main()
