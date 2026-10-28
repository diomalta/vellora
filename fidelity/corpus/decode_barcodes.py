"""Independent barcode oracle for the corpus: decode linear barcodes with zxing-cpp.

Usage:
  fidelity/.venv/bin/python -I fidelity/corpus/decode_barcodes.py --dpi DPI PAGE.png [PAGE.png ...]
  fidelity/.venv/bin/python -I fidelity/corpus/decode_barcodes.py --ideal BARS.json --dpi DPI [--flip N]

Raster mode prints every ITF / Code 128 symbol zxing-cpp finds on rasterized PDF pages (format,
text, bounding box in px and mm). Ideal mode draws the bars listed in BARS.json (the fixture's own
data, no renderer involved) at DPI and decodes them: it proves the fixture data is a valid symbol.
--flip N toggles element N between bar and space (merging it with its neighbours) to prove the
oracle rejects a broken symbol (negative control).
Pinned versions: fidelity/corpus/requirements.txt.
"""

import argparse
import hashlib
import importlib.metadata
import json
import platform
import sys

import zxingcpp
from PIL import Image, ImageDraw

FORMATS = [zxingcpp.BarcodeFormat.ITF, zxingcpp.BarcodeFormat.Code128]
MM_PER_INCH = 25.4


def decode_image(image, dpi):
    results = zxingcpp.read_barcodes(image, formats=FORMATS, try_rotate=False)
    symbols = []
    for r in results:
        pos = r.position
        xs = [pos.top_left.x, pos.top_right.x, pos.bottom_left.x, pos.bottom_right.x]
        ys = [pos.top_left.y, pos.top_right.y, pos.bottom_left.y, pos.bottom_right.y]
        box = [min(xs), min(ys), max(xs), max(ys)]
        symbols.append(
            {
                "format": str(r.format).split(".")[-1],
                "text": r.text,
                "valid": r.valid,
                "box_px": box,
                "box_mm": [round(v * MM_PER_INCH / dpi, 3) for v in box],
            }
        )
    return symbols


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def ideal_image(spec, dpi, flip):
    """Draw elements [{w_mm, dark}] left to right with a 10 mm quiet zone on both sides."""
    elements = [dict(e) for e in spec["elements"]]
    if flip is not None:
        elements[flip]["dark"] = not elements[flip]["dark"]
    px = dpi / MM_PER_INCH
    quiet = 10.0
    length = sum(e["w_mm"] for e in elements)
    width = int(round((length + 2 * quiet) * px))
    height = int(round((spec["height_mm"] + 2 * quiet) * px))
    image = Image.new("L", (width, height), 255)
    draw = ImageDraw.Draw(image)
    x = quiet
    top = quiet * px
    bottom = (quiet + spec["height_mm"]) * px
    for e in elements:
        if e["dark"]:
            draw.rectangle([round(x * px), top, round((x + e["w_mm"]) * px) - 1, bottom], fill=0)
        x += e["w_mm"]
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dpi", type=int, required=True)
    parser.add_argument("--ideal")
    parser.add_argument("--flip", type=int)
    parser.add_argument("images", nargs="*")
    args = parser.parse_args()
    out = {
        "decoder": "zxing-cpp",
        "decoder_version": importlib.metadata.version("zxing-cpp"),
        "pillow_version": importlib.metadata.version("pillow"),
        "python": platform.python_version(),
        "dpi": args.dpi,
    }
    if args.ideal:
        with open(args.ideal, encoding="utf-8") as f:
            spec = json.load(f)
        out["mode"] = "ideal"
        out["source"] = args.ideal
        out["source_sha256"] = sha256(args.ideal)
        out["flip"] = args.flip
        out["symbols"] = decode_image(ideal_image(spec, args.dpi, args.flip), args.dpi)
    else:
        out["mode"] = "raster"
        out["pages"] = [
            {
                "image": p,
                "image_sha256": sha256(p),
                "symbols": decode_image(Image.open(p).convert("L"), args.dpi),
            }
            for p in args.images
        ]
    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
