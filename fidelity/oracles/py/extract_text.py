"""Extract plain text from a PDF with two independent Python extractors.

Usage: python -I extract_text.py FILE.pdf
Prints {"extractors": [{"name", "version", "text"|"error"}, ...]}.

- pdfminer.six: pure-Python, its own content-stream interpreter and layout analysis (LAParams
  defaults), no shared code with poppler or MuPDF.
- PyMuPDF: MuPDF's text device, page.get_text("text") with default flags (ligatures and
  whitespace preserved as MuPDF reports them; no dehyphenation).
The raw strings are returned unnormalized so the copy-paste check can see ligature code points,
combining marks and U+FFFD exactly as a user would get them on copy.
"""

import json
import sys
from importlib.metadata import version


def with_pdfminer(path):
    from pdfminer.high_level import extract_text

    return extract_text(path)


def with_pymupdf(path):
    import pymupdf

    with pymupdf.open(path) as document:
        return "\f".join(page.get_text("text") for page in document)


def main(path):
    extractors = []
    for name, dist, fn in (
        ("pdfminer.six", "pdfminer.six", with_pdfminer),
        ("pymupdf", "pymupdf", with_pymupdf),
    ):
        entry = {"name": name, "version": version(dist)}
        try:
            entry["text"] = fn(path)
        except Exception as error:  # report, never hide, an extractor failure
            entry["error"] = f"{type(error).__name__}: {error}"
        extractors.append(entry)
    print(json.dumps({"extractors": extractors}, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1])
