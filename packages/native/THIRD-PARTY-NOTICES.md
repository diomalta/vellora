# Third-party notices

The prebuilt native addon distributed in this package embeds a default font so that
text renders deterministically and with no system font dependency (no `libfontconfig`,
no host-installed fonts) — which is what lets it run on slim, Alpine/musl, and AWS
Lambda images out of the box.

## DejaVu Sans (Regular and Bold)

- Source: https://dejavu-fonts.github.io/
- Copyright: Bitstream Vera fonts © 2003 Bitstream, Inc.; DejaVu changes are in the
  public domain; glyphs imported from Arev fonts © Tavmjong Bah.
- License: Bitstream Vera Fonts License (and the Arev addendum) — a free, permissive
  license. The full text is in [`LICENSE-DejaVu.txt`](./LICENSE-DejaVu.txt).

Only the glyphs actually used by a document are subset into each output PDF; the full
font is embedded in the addon binary, not in the PDFs you generate.
