"""Decode 1D barcodes from page rasters with zxing-cpp (barcode decoder #1).

Usage: python -I decode_barcode.py PAGE.png [PAGE.png ...]
Prints one JSON object: {"decoder": "zxing-cpp", "version": ..., "pages": [...]}.
ITF (Interleaved 2 of 5, mandated for boletos by BCB Carta-Circular 2926) and Code 128 (mandated
as CODE-128C for the DANFE chave de acesso by MOC 7.0 Anexo II, section 2; the same zxing-cpp
format the corpus decoder fidelity/corpus/decode_barcodes.py uses) are requested SEPARATELY, so an
unrelated symbol cannot be mistaken for the document's barcode; the decoder is also asked for all
linear formats so a wrong-symbology render is still reported.
"""

import json
import sys
from importlib.metadata import version

import zxingcpp
from PIL import Image


def describe(result):
    position = result.position
    points = [
        [position.top_left.x, position.top_left.y],
        [position.top_right.x, position.top_right.y],
        [position.bottom_right.x, position.bottom_right.y],
        [position.bottom_left.x, position.bottom_left.y],
    ]
    return {
        "format": str(result.format).split(".")[-1],
        "text": result.text,
        "valid": bool(getattr(result, "valid", True)),
        "symbologyIdentifier": getattr(result, "symbology_identifier", None),
        "positionPx": points,
    }


def formats(name):
    return getattr(zxingcpp.BarcodeFormat, name)


def main(paths):
    pages = []
    itf = formats("ITF")
    code128 = formats("Code128")
    linear = formats("LinearCodes")
    for index, path in enumerate(paths, start=1):
        image = Image.open(path).convert("L")
        itf_results = zxingcpp.read_barcodes(image, formats=itf)
        code128_results = zxingcpp.read_barcodes(image, formats=code128)
        linear_results = zxingcpp.read_barcodes(image, formats=linear)
        pages.append(
            {
                "page": index,
                "png": path,
                "widthPx": image.width,
                "heightPx": image.height,
                "itf": [describe(r) for r in itf_results],
                "code128": [describe(r) for r in code128_results],
                "anyLinear": [describe(r) for r in linear_results],
            }
        )
    print(
        json.dumps(
            {"decoder": "zxing-cpp", "version": version("zxing-cpp"), "pages": pages},
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main(sys.argv[1:])
