"""Print the bundled Liberation font metrics the corpus converts between mm and pt.

Usage: fidelity/.venv/bin/python -I fidelity/corpus/font_metrics.py

The boleto criteria BOL-T1..T3 (fidelity/ACCEPTANCE.md) turn "character height in mm" into a font
size using the digit/cap height of Liberation Sans (0.688 em); the DANFE chave width estimate uses
Liberation Serif advances. This script re-derives those numbers from the TTF files vellora embeds
(crates/vellora-core/src/fonts) with fontTools (pinned in requirements.txt).
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


def main():
    out = {"fonttools": importlib.metadata.version("fonttools")}
    for face in FACES:
        out[face] = metrics(FONT_DIR / face)
    print(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
