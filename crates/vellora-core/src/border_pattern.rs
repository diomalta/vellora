//! Dashed and dotted border sides as filled segments (Phase C step 04), on plain data: no
//! Blitz, Stylo or Taffy type here. `blitz_engine::read_visuals` (separated borders) and
//! `collapsed_borders::ResolvedCell::paint_rects` (the collapsed-border compensation) call
//! [`segments`] for every side they paint; until this step every style but `none`/`hidden` was
//! painted as one solid rect (danfe product rows, the postmark coupon box).
//!
//! Not a Blitz bug: vellora never links blitz-paint and paints borders from its own display list.
//! The geometry copies Chrome's, measured with Chrome for Testing 155.0.8059.85 (local macOS
//! arm64, INDICATIVE; 2026-10-28), the fidelity reference print path
//! (`fidelity/lib/chrome-reference.mjs`, `printBackground: true`), PyMuPDF `get_drawings()` x
//! 4/3, repros `fidelity/gate/snapshots/2026-10-28/c04-paint/repro/{borders,borders2}.html` (a
//! 300 x 60 px box per style and width). Chrome paints each side along its full length (the
//! corners included, as vellora's side rects are) as separate filled segments, the first and
//! the last flush with the side's ends:
//!
//! - `dashed`, width `w`: dash `3w` and nominal gap `2w` when `w < 3`, dash `2w` and gap `w`
//!   when `w >= 3` (w = 1, 2, 3, 4, 5, 6, 8 measured). The gap is then stretched or shrunk so
//!   that a whole number of dashes fits: of the two dash counts around
//!   `(L + gap) / (dash + gap)`, the one whose gap is closer to the nominal gap (top side of
//!   the 1 px box, L = 302: 61 dashes, gap 1.983; 1 px bottom-only side, L = 300: 60 dashes,
//!   gap 2.034; 2 px L = 304: 31 dashes, gap 3.933; 8 px left side, L = 76: 4 dashes, gap 4).
//!   A side too short for two dashes and a gap is solid.
//! - `dotted`, width `w`: dots of `w` along the side with the same gap rule around a nominal
//!   gap of `w` (4 px L = 308: 39 dots, gap 3.99; 6 px L = 72: 7 dots, gap 4.99). Chrome paints
//!   round dots from 4 px on and square ones below (1, 2, 3 px measured); vellora paints every
//!   dot square (its display list has only rects): a known paint difference of thick dotted
//!   borders, no fixture has one.
//!
//! Other styles (`double`, `groove`, `ridge`, `inset`, `outset`) stay solid, as before.

/// The line style of a border side, as far as its painting goes.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) enum LineStyle {
    Solid,
    Dashed,
    Dotted,
}

/// The segments `(start, length)` that paint a `length` px long side of a `width` px border in
/// `style`, along the side (offsets from its start). One segment for a solid side.
pub(crate) fn segments(style: LineStyle, width: f64, length: f64) -> Vec<(f64, f64)> {
    if !(width > 0.0 && length > 0.0) {
        return Vec::new();
    }
    let (dash, gap) = match style {
        LineStyle::Solid => return vec![(0.0, length)],
        LineStyle::Dashed if width < 3.0 => (3.0 * width, 2.0 * width),
        LineStyle::Dashed => (2.0 * width, width),
        LineStyle::Dotted => (width, width),
    };
    if style == LineStyle::Dashed && length <= 2.0 * dash + gap {
        return vec![(0.0, length)];
    }
    if style == LineStyle::Dotted && length < 2.0 * dash {
        return vec![(0.0, dash.min(length))];
    }
    let (count, gap) = best_count(length, dash, gap);
    (0..count)
        .map(|i| (i as f64 * (dash + gap), dash))
        .collect()
}

/// The dash count and the gap that spreads `count` dashes of `dash` over `length` with the first
/// and last flush with the ends, the gap closest to `gap` (see the module comment).
fn best_count(length: f64, dash: f64, gap: f64) -> (usize, f64) {
    let gap_for = |n: f64| (length - n * dash) / (n - 1.0);
    let fewer = ((length + gap) / (dash + gap)).floor().max(2.0);
    let more = fewer + 1.0;
    let (gap_fewer, gap_more) = (gap_for(fewer), gap_for(more));
    if gap_more <= 0.0 || (gap_fewer - gap).abs() < (gap_more - gap).abs() {
        (fewer as usize, gap_fewer)
    } else {
        (more as usize, gap_more)
    }
}

/// [`segments`] of a side rect `(x, y, width, height)`: along x for a horizontal side (top,
/// bottom), along y for a vertical one (left, right); `thickness` is the border width.
pub(crate) fn side_rects(
    style: LineStyle,
    thickness: f64,
    rect: (f64, f64, f64, f64),
    horizontal: bool,
) -> Vec<(f64, f64, f64, f64)> {
    let (x, y, w, h) = rect;
    let length = if horizontal { w } else { h };
    segments(style, thickness, length)
        .into_iter()
        .map(|(start, len)| {
            if horizontal {
                (x + start, y, len, h)
            } else {
                (x, y + start, w, len)
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn gaps(s: &[(f64, f64)]) -> Vec<f64> {
        s.windows(2).map(|p| p[1].0 - (p[0].0 + p[0].1)).collect()
    }

    /// Every (width, side length, Chrome dash count, Chrome dash length, Chrome gap) measured in
    /// the module comment's repros.
    const DASHED: &[(f64, f64, usize, f64, f64)] = &[
        (1.0, 302.0, 61, 3.0, 1.983),
        (1.0, 62.0, 13, 3.0, 1.917),
        (1.0, 300.0, 60, 3.0, 2.034),
        (2.0, 304.0, 31, 6.0, 3.933),
        (2.0, 64.0, 7, 6.0, 3.667),
        (2.0, 480.0, 48, 6.0, 4.085),
        (3.0, 306.0, 34, 6.0, 3.091),
        (3.0, 66.0, 8, 6.0, 2.571),
        (4.0, 308.0, 26, 8.0, 4.0),
        (4.0, 68.0, 6, 8.0, 4.0),
        (5.0, 310.0, 21, 10.0, 5.0),
        (6.0, 312.0, 18, 12.0, 5.647),
        (6.0, 72.0, 4, 12.0, 8.0),
        (8.0, 316.0, 14, 16.0, 7.077),
        (8.0, 76.0, 4, 16.0, 4.0),
    ];

    #[test]
    fn dashed_sides_match_chromes_dash_count_length_and_gap() {
        for &(w, l, n, dash, gap) in DASHED {
            let s = segments(LineStyle::Dashed, w, l);
            assert_eq!(s.len(), n, "{w} px x {l} px: dash count");
            assert!(s.iter().all(|&(_, len)| (len - dash).abs() < 1e-9));
            for g in gaps(&s) {
                assert!((g - gap).abs() < 0.002, "{w} px x {l} px: gap {g} vs {gap}");
            }
            let (start, len) = (s[0].0, s[n - 1].0 + s[n - 1].1);
            assert!(
                start == 0.0 && (len - l).abs() < 1e-9,
                "flush with both ends"
            );
        }
    }

    #[test]
    fn dotted_sides_match_chromes_dot_count_and_gap() {
        for (w, l, n, gap) in [
            (4.0, 308.0, 39, 4.0),
            (6.0, 72.0, 7, 5.0),
            (6.0, 312.0, 27, 5.77),
        ] {
            let s = segments(LineStyle::Dotted, w, l);
            assert_eq!(s.len(), n, "{w} px x {l} px: dot count");
            for g in gaps(&s) {
                assert!((g - gap).abs() < 0.01, "{w} px x {l} px: gap {g} vs {gap}");
            }
        }
    }

    #[test]
    fn short_and_solid_sides_are_one_segment() {
        assert_eq!(segments(LineStyle::Solid, 2.0, 50.0), vec![(0.0, 50.0)]);
        // 1 px dashed: dash 3, gap 2: 8 px or less has no room for two dashes and a gap.
        assert_eq!(segments(LineStyle::Dashed, 1.0, 8.0), vec![(0.0, 8.0)]);
        assert_eq!(segments(LineStyle::Dashed, 1.0, 9.0).len(), 2);
        assert_eq!(segments(LineStyle::Dotted, 3.0, 5.0), vec![(0.0, 3.0)]);
        assert!(segments(LineStyle::Dashed, 0.0, 50.0).is_empty());
        assert!(segments(LineStyle::Dashed, 1.0, 0.0).is_empty());
    }

    #[test]
    fn side_rects_run_along_the_side() {
        let top = side_rects(LineStyle::Dashed, 1.0, (10.0, 20.0, 302.0, 1.0), true);
        assert_eq!(top.len(), 61);
        assert_eq!(top[0], (10.0, 20.0, 3.0, 1.0));
        let left = side_rects(LineStyle::Dashed, 1.0, (10.0, 20.0, 1.0, 62.0), false);
        assert_eq!(left.len(), 13);
        assert_eq!(left[0], (10.0, 20.0, 1.0, 3.0));
        assert!((left[12].1 + left[12].3 - 82.0).abs() < 1e-9);
    }
}
