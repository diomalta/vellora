//! Chrome's fixed-point layout lengths (`LayoutUnit`, 1/64 CSS px) on plain numbers, for the
//! computed-length snapping in [`crate::blitz_engine`] (`snap_lengths_to_layout_unit`, which
//! carries the description of the difference it emulates, the measurements and when to delete
//! it). No Blitz, Stylo or Taffy type appears here.
//!
//! Chromium `third_party/blink/renderer/platform/geometry/layout_unit.h` (main, read 2026-10-27):
//! `using LayoutUnit = FixedPoint<6, int32_t>`, `kFixedPointDenominator = 1 << kFractionalBits`
//! (64); the `float`/`double` constructor is `ClampRawValue(value * kFixedPointDenominator)`,
//! i.e. `base::saturated_cast<int32_t>`, which TRUNCATES toward zero; `FromFloatRound` is
//! `roundf(value * 64)`. Blink resolves box lengths with that constructor
//! (`MinimumValueForLength`/`ValueForLength`) and a line height with
//! `ComputedStyle::ComputedLineHeightAsFixed` (`computed_style.cc`, main, read 2026-10-27): a
//! fixed `line-height` is `LayoutUnit::FromFloatRound(px)`, a unitless one (stored as a
//! percentage) is `MinimumValueForLength(lh, ComputedFontSizeAsFixed())`, i.e. the truncated
//! product of the factor and the font size as a `LayoutUnit`.

/// Sub-units per CSS px (Chromium `kFixedPointDenominator`).
pub(crate) const DENOMINATOR: f64 = 64.0;

/// Slack (in 1/64 px units) for the binary-float noise of an f32 length that is meant to sit
/// exactly on a 1/64 px step (`f32` carries ~7 significant digits: 1000 px is exact to ~6e-5 px,
/// 0.004 units). 0.01 units = 0.00016 px, far below anything a renderer can show.
const SLACK: f64 = 0.01;

/// `LayoutUnit(px)`: truncated toward zero to 1/64 px (margins may be negative: -1mm is
/// -3.765625, not -3.78125; measured, Chrome 155 `margin_neg`).
pub(crate) fn truncate(px: f64) -> f64 {
    let raw = px * DENOMINATOR;
    let raw = if raw >= 0.0 {
        (raw + SLACK).floor()
    } else {
        (raw - SLACK).ceil()
    };
    raw / DENOMINATOR
}

/// `LayoutUnit::FromFloatRound(px)`: the nearest 1/64 px.
pub(crate) fn round(px: f64) -> f64 {
    (px * DENOMINATOR).round() / DENOMINATOR
}

/// Chrome's used `line-height: <number>`: `LayoutUnit(n * FromFloatRound(font_size))`.
pub(crate) fn line_height_for_number(font_size_px: f64, factor: f64) -> f64 {
    truncate(round(font_size_px) * factor)
}

/// Chrome's used `border-spacing`: a whole number of px, truncated (1.5mm = 5.669 px is 5 px;
/// measured, Chrome 155 `spacing_mm`: cells at y 5 / 25 / 45 with 15 px rows).
pub(crate) fn border_spacing(px: f64) -> f64 {
    (px + SLACK / DENOMINATOR).floor().max(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Every number below is Chrome for Testing 155.0.8059.85's (getBoundingClientRect, print
    /// media, repro set `fidelity/gate/snapshots/2026-10-27/c03/layoutunit/lu-repro/`).
    #[test]
    fn lengths_truncate_to_one_sixty_fourth_px_like_chrome() {
        let mm = 96.0 / 25.4;
        assert_eq!(truncate(mm), 3.765625); // padding / margin / gap / inset: 1mm
        assert_eq!(truncate(-mm), -3.765625); // margin-bottom: -1mm
        assert_eq!(truncate(0.3), 0.296875);
        assert_eq!(truncate(0.01), 0.0);
        assert_eq!(truncate(96.0 / 72.0), 1.328125); // 1pt
        assert_eq!(truncate(10.1 * mm), 38.171875); // height: 10.1mm
        assert_eq!(truncate(74.0 * mm), 279.671875); // width: 74mm
        assert_eq!(truncate(0.5 * 725.0 / 64.0), 5.65625); // 0.5em at 8.5pt
        assert_eq!(truncate(10.0), 10.0);
        assert_eq!(
            truncate(10.0 - 1e-6),
            10.0,
            "f32 noise under a step is not a step lower"
        );
    }

    #[test]
    fn line_heights_follow_chromes_computed_line_height_as_fixed() {
        let pt = 96.0 / 72.0;
        assert_eq!(line_height_for_number(8.5 * pt, 1.35), 15.28125);
        assert_eq!(line_height_for_number(10.0 * pt, 1.35), 17.984375);
        assert_eq!(line_height_for_number(13.0, 1.35), 17.546875);
        // The font size is ROUNDED first: 11.34 px -> 726/64, x 1.35 = 15.3140625 -> 15.3125
        // (truncating it first would give 15.28125).
        assert_eq!(line_height_for_number(11.34, 1.35), 15.3125);
        assert_eq!(line_height_for_number(8.5 * pt, 1.35) * 3.0, 45.84375); // three lines
        assert_eq!(round(15.3), 15.296875); // line-height: 15.3px / 135% / 1.35em at 8.5pt
        assert_eq!(round(11.34 * 1.35), 15.3125); // 135% at 11.34px
    }

    #[test]
    fn border_spacing_is_whole_px() {
        assert_eq!(border_spacing(1.5 * 96.0 / 25.4), 5.0);
        assert_eq!(border_spacing(2.0), 2.0);
        assert_eq!(border_spacing(0.4), 0.0);
    }
}
