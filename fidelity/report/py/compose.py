"""Side-by-side page composites for the site evidence (fidelity/report/build-site-evidence.mjs).

usage: python3 compose.py <spec.json>

spec: { "font": <ttf>, "fontBold": <ttf>, "items": [ { "out", "title", "subtitle", "stamp",
        "columns": [ { "label", "sub", "image" | null, "missing" } ], "footer" } ],
        "og": { "from": <item out>, "out", "width", "height" } | null }

Every output is re-encoded from pixels (no EXIF/XMP/ICC copied from the inputs) as baseline
progressive JPEG. Deterministic for identical inputs and Pillow version.
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

BG = (246, 247, 249)
INK = (27, 31, 36)
INK2 = (82, 81, 78)
BORDER = (201, 206, 214)
STAMP_BG = (250, 178, 25)  # status "warning"; always paired with its text label
STAMP_INK = (11, 11, 11)
PAD = 24
GAP = 20


def load(spec):
    f = lambda size, bold=False: ImageFont.truetype(spec["fontBold" if bold else "font"], size)
    return {"title": f(22, True), "sub": f(14), "label": f(15, True), "small": f(13), "stamp": f(13, True)}


def compose(item, fonts):
    cols = item["columns"]
    pages = [Image.open(c["image"]).convert("RGB") if c.get("image") else None for c in cols]
    real = [p for p in pages if p is not None]
    w = max(p.width for p in real)
    h = max(p.height for p in real)
    head = 88
    label_h = 46
    foot = 34
    W = PAD * 2 + len(cols) * w + (len(cols) - 1) * GAP
    H = PAD + head + label_h + h + foot + PAD // 2
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((PAD, PAD), item["title"], font=fonts["title"], fill=INK)
    d.text((PAD, PAD + 32), item["subtitle"], font=fonts["sub"], fill=INK2)
    if item.get("stamp"):
        tw = d.textlength(item["stamp"], font=fonts["stamp"])
        x0, y0 = PAD, PAD + 56
        d.rounded_rectangle((x0, y0, x0 + tw + 20, y0 + 24), radius=6, fill=STAMP_BG)
        d.text((x0 + 10, y0 + 4), item["stamp"], font=fonts["stamp"], fill=STAMP_INK)
    top = PAD + head
    for i, (c, p) in enumerate(zip(cols, pages)):
        x = PAD + i * (w + GAP)
        d.text((x, top), c["label"], font=fonts["label"], fill=INK)
        d.text((x, top + 20), c["sub"], font=fonts["small"], fill=INK2)
        y = top + label_h
        if p is not None:
            im.paste(p, (x, y))
            d.rectangle((x - 1, y - 1, x + p.width, y + p.height), outline=BORDER)
        else:
            d.rectangle((x - 1, y - 1, x + w, y + h), outline=BORDER, fill=(255, 255, 255))
            msg = c.get("missing", "no page")
            tw = d.textlength(msg, font=fonts["label"])
            d.text((x + (w - tw) / 2, y + h / 2 - 10), msg, font=fonts["label"], fill=INK2)
    d.text((PAD, H - foot), item["footer"], font=fonts["small"], fill=INK2)
    return im


def save(im, path):
    im.save(path, "JPEG", quality=84, optimize=True, progressive=True)


def main():
    spec = json.load(open(sys.argv[1], encoding="utf-8"))
    fonts = load(spec)
    made = {}
    for item in spec["items"]:
        im = compose(item, fonts)
        save(im, item["out"])
        made[item["out"]] = im
    og = spec.get("og")
    if og:
        src = made[og["from"]]
        W, H = og["width"], og["height"]
        scale = min(W / src.width, H / src.height)
        fit = src.resize((round(src.width * scale), round(src.height * scale)), Image.LANCZOS)
        canvas = Image.new("RGB", (W, H), BG)
        canvas.paste(fit, ((W - fit.width) // 2, (H - fit.height) // 2))
        save(canvas, og["out"])
    print(json.dumps({"written": list(made) + ([og["out"]] if og else [])}))


if __name__ == "__main__":
    main()
