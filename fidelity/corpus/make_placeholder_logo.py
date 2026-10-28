"""Write the neutral placeholder logo used instead of an upstream brand logo (CC0, self-made).

Usage: fidelity/.venv/bin/python -I fidelity/corpus/make_placeholder_logo.py OUT.png
600 x 180 px, 8-bit grey, no text: a filled bar and three circles. Deterministic for a pinned Pillow
(fidelity/corpus/requirements.txt); the committed bytes are what the fixtures use.
"""

import sys

from PIL import Image, ImageDraw


def main(out):
    img = Image.new("L", (600, 180), 255)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 60, 360, 120], fill=60)
    for i, cx in enumerate((420, 490, 560)):
        d.ellipse([cx - 30, 60, cx + 30, 120], fill=60 + 50 * i)
    img.save(out, format="PNG", optimize=False)


if __name__ == "__main__":
    main(sys.argv[1])
