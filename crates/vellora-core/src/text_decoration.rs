//! Where `text-decoration` lines go (Phase C step 04), on plain data: no Blitz, Stylo or Taffy
//! type here. `blitz_engine::read_text_runs` finds the decorating boxes of each glyph run and
//! calls [`geometry`]; `pdf::emit` paints the lines. Until this step vellora painted no text
//! decoration at all (the postmark receipt's links had no underline).
//!
//! Not a Blitz bug: Blitz leaves decorations to its painter (blitz-dom 0.3.0-beta.4
//! `stylo_to_parley.rs` 509-521 sends none through Parley and keeps the node id in the brush),
//! and vellora never links blitz-paint. The geometry copies Chrome's, measured with Chrome for
//! Testing 155.0.8059.85 (local macOS arm64, INDICATIVE; 2026-10-28), the fidelity reference
//! print path (`fidelity/lib/chrome-reference.mjs`, bundled Liberation faces), PyMuPDF
//! `get_drawings()` x 4/3 against the span baselines: repro
//! `fidelity/gate/snapshots/2026-10-28/c04-paint/repro/deco-sizes.html` (underline, overline,
//! line-through at 8 to 48 px; its Arial half = Liberation Sans, 54 lines) and
//! `deco-serif.html` (the same in Liberation Serif, 54 lines): vellora's lines equal Chrome's
//! on all 108 (top and height, whole px). `deco-sizes.html`'s "Times New Roman" half is not a
//! decoration check: vellora does not alias that family to Liberation Serif as the reference
//! print does, so its glyphs differ. And `deco2.html`:
//!
//! - thickness `t = max(1, font-size / 10)` (`text-decoration-thickness: auto`), painted
//!   `max(1, floor(t))` px tall: 1 px up to 19 px text, 2 px at 20 to 28, 3 px at 32, 4 px at
//!   40 and 48 (Sans and Serif alike, so not the fonts' `post` underline thickness);
//! - underline: top `max(1, ceil(t / 2))` px below the baseline (1 px up to 20 px text, 2 px
//!   at 22 to 40, 3 px at 48);
//! - overline: bottom on the text top, top `round(ascent) + floor(t)` above the baseline;
//! - line-through: top at `floor(-round(ascent) / 3 - t / 2 + 0.5)` from the baseline (16 px
//!   Liberation Sans, ascent 14.48: -5);
//! - the font size and ascent are the DECORATING box's: `<p style="text-decoration:
//!   underline">` with a 30 px span inside paints one 1 px line 1 px under the shared baseline
//!   for all of it, the 30 px text included (`deco2.html`); the colour is the decorating box's
//!   `text-decoration-color` (red under a blue span of a `color: green; text-decoration:
//!   underline red` paragraph);
//! - decorations do not reach inline-blocks, floats or absolutely positioned boxes inside the
//!   decorating box (CSS Text Decoration 3 §2.1; `deco2.html`: the `inline-block` and the
//!   float are not underlined, the text around them is), and the line covers the run's
//!   advance, spaces included, but not the spaces a line ends with.
//!
//! Not modelled: `text-decoration-style` other than `solid` (all paint solid),
//! `text-underline-offset`, `text-underline-position`, `text-decoration-skip-ink` (Chrome skips
//! the descenders of underlined text; vellora draws through them), vertical text. A length
//! `text-decoration-thickness` is used as `t` (UNVERIFIED against Chrome); `from-font` is
//! treated as `auto` (UNVERIFIED).

/// Which line.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum Kind {
    Underline,
    Overline,
    LineThrough,
}

/// The painted line of a decorating box with `font_size` and first-font `ascent` (CSS px) and
/// thickness `thickness` (`None`: `auto`): `(top, height)` in px relative to the baseline
/// (positive = below), whole px for a whole-px baseline.
pub(crate) fn geometry(
    line: Kind,
    font_size: f64,
    ascent: f64,
    thickness: Option<f64>,
) -> (f64, f64) {
    let t = thickness.unwrap_or(font_size / 10.0).max(1.0);
    let height = t.floor().max(1.0);
    let top = match line {
        Kind::Underline => (t / 2.0).ceil().max(1.0),
        Kind::Overline => -(ascent.round() + height),
        Kind::LineThrough => (-ascent.round() / 3.0 - t / 2.0 + 0.5).floor(),
    };
    (top, height)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Liberation Sans (`hhea` ascent 1854 / 2048 em) rows of the repro: (font-size, Chrome
    /// underline top, overline top, line-through top, height), px from the baseline.
    const SANS: &[(f64, f64, f64, f64, f64)] = &[
        (8.0, 1.0, -8.0, -3.0, 1.0),
        (9.0, 1.0, -9.0, -3.0, 1.0),
        (10.0, 1.0, -10.0, -3.0, 1.0),
        (11.0, 1.0, -11.0, -4.0, 1.0),
        (12.0, 1.0, -12.0, -4.0, 1.0),
        (13.0, 1.0, -13.0, -5.0, 1.0),
        (14.0, 1.0, -14.0, -5.0, 1.0),
        (15.0, 1.0, -15.0, -5.0, 1.0),
        (16.0, 1.0, -15.0, -5.0, 1.0),
        (17.0, 1.0, -16.0, -6.0, 1.0),
        (18.0, 1.0, -17.0, -6.0, 1.0),
        (20.0, 1.0, -20.0, -7.0, 2.0),
        (22.0, 2.0, -22.0, -8.0, 2.0),
        (24.0, 2.0, -24.0, -9.0, 2.0),
        (28.0, 2.0, -27.0, -10.0, 2.0),
        (32.0, 2.0, -32.0, -11.0, 3.0),
        (40.0, 2.0, -40.0, -14.0, 4.0),
        (48.0, 3.0, -47.0, -17.0, 4.0),
    ];
    /// Liberation Serif (ascent 1825 / 2048 em; repro `deco-serif.html`), same columns.
    const SERIF: &[(f64, f64, f64, f64, f64)] = &[
        (8.0, 1.0, -8.0, -3.0, 1.0),
        (9.0, 1.0, -9.0, -3.0, 1.0),
        (10.0, 1.0, -10.0, -3.0, 1.0),
        (11.0, 1.0, -11.0, -4.0, 1.0),
        (12.0, 1.0, -12.0, -4.0, 1.0),
        (13.0, 1.0, -13.0, -5.0, 1.0),
        (14.0, 1.0, -13.0, -5.0, 1.0),
        (15.0, 1.0, -14.0, -5.0, 1.0),
        (16.0, 1.0, -15.0, -5.0, 1.0),
        (17.0, 1.0, -16.0, -6.0, 1.0),
        (18.0, 1.0, -17.0, -6.0, 1.0),
        (20.0, 1.0, -20.0, -7.0, 2.0),
        (22.0, 2.0, -22.0, -8.0, 2.0),
        (24.0, 2.0, -23.0, -8.0, 2.0),
        (28.0, 2.0, -27.0, -10.0, 2.0),
        (32.0, 2.0, -32.0, -11.0, 3.0),
        (40.0, 2.0, -40.0, -14.0, 4.0),
        (48.0, 3.0, -47.0, -17.0, 4.0),
    ];

    #[test]
    fn auto_decorations_match_chrome_at_every_measured_size() {
        for (rows, ascent_em) in [(SANS, 1854.0 / 2048.0), (SERIF, 1825.0 / 2048.0)] {
            for &(fs, under, over, through, height) in rows {
                let ascent = fs * ascent_em;
                for (line, top) in [
                    (Kind::Underline, under),
                    (Kind::Overline, over),
                    (Kind::LineThrough, through),
                ] {
                    assert_eq!(
                        geometry(line, fs, ascent, None),
                        (top, height),
                        "{fs} px {line:?} (ascent {ascent})"
                    );
                }
            }
        }
    }
}
