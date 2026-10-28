//! Ruby layout (CSS Ruby Annotation Layout 1; Phase C step 06): the geometry Chrome gives a
//! `<ruby>` base and its `<rt>` annotation, on plain numbers. No Blitz, Stylo or Taffy type
//! appears here; [`crate::blitz_engine`] (the only Blitz contact) builds the boxes, measures them
//! and writes the edits this module computes.
//!
//! Blitz 0.3.0-beta.4 has no ruby layout: Stylo 0.22.0 in servo mode does not parse
//! `display: ruby` / `ruby-text` (`stylo-0.22.0/values/specified/box.rs:513-541`, gecko-only), so
//! Blitz's own UA rules for them (`blitz-dom-0.3.0-beta.4/assets/default.css:1006-1021`) are
//! dropped and `<ruby>` / `<rt>` lay out as plain inlines: the annotation follows its base on the
//! same line (raw-Blitz canary `raw_blitz_tests.rs` `blitz_still_lays_ruby_text_out_inline`).
//!
//! The model is Blink's (Chromium `third_party/blink/renderer/core/layout/inline/ruby_utils.cc`
//! and `platform/fonts/simple_font_data.cc`, main, read 2026-10-28), measured against Chrome for
//! Testing 155.0.8059.85 (`tests/ruby.rs`):
//!
//! - A ruby column is a base (the content since the previous `<rt>`) and its annotation. Its
//!   inline size is the larger of the two; the narrower one is centred in it (Chrome's
//!   `ruby-align: space-around` justifies the narrower one's glyphs instead, see Not modelled).
//! - The block position of an annotation comes from em boxes, not line boxes
//!   (`ComputeEmHeight`): a text item contributes its font's em box, the OS/2 `sTypoAscender` :
//!   `sTypoDescender` ratio scaled to the font size (`NormalizedTypoAscentAndDescent`), each side
//!   rounded up to a whole px and capped by the font's rounded ascent / descent; an atomic inline
//!   contributes its border box. The bases of one line unite into one em box, and so do the
//!   annotations (`RubyBlockPositionCalculator`): every annotation of a line shares one baseline,
//!   whose em box sits right on top of the bases' em box (`ComputeRelativeOffsets`).
//! - The line box grows to hold the annotations' em box above it, and only that
//!   (`ComputeAnnotationOverflow`): an annotation that fits in the line's leading adds nothing.
//!
//! Not modelled (documented in COMPATIBILITY.md): `ruby-align` justification and ruby overhang
//! (Chrome lets a wider annotation overhang adjacent spaces by up to half its font size and
//! spreads a narrower base's glyphs), `ruby-position: under` / `alternate`, `<rtc>`, nested
//! ruby, line breaks between the columns of one ruby (a ruby never breaks here), vertical
//! writing modes, and the interplay with `text-emphasis`.

/// The vertical font metrics the em box needs, in font units.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct FontVMetrics {
    pub units_per_em: f64,
    /// OS/2 `sTypoAscender` and `-sTypoDescender` (0 when the font has no OS/2 table).
    pub typo_ascender: f64,
    pub typo_descender: f64,
    /// `hhea` ascender and `-descender`: the font ascent / descent Blink lays text out with.
    pub ascender: f64,
    pub descender: f64,
}

/// `(offset, length)` of table `tag` in the sfnt font `index` of `data` (a `.ttf`/`.otf` or a
/// `ttcf` collection).
fn table(data: &[u8], index: u32, tag: &[u8; 4]) -> Option<(usize, usize)> {
    let be32 = |at: usize| -> Option<u32> {
        Some(u32::from_be_bytes(data.get(at..at + 4)?.try_into().ok()?))
    };
    let be16 = |at: usize| -> Option<u16> {
        Some(u16::from_be_bytes(data.get(at..at + 2)?.try_into().ok()?))
    };
    let font = if data.get(0..4)? == b"ttcf" {
        be32(12 + 4 * index as usize)? as usize
    } else {
        0
    };
    let count = be16(font + 4)? as usize;
    (0..count).find_map(|i| {
        let record = font + 12 + 16 * i;
        (data.get(record..record + 4)? == tag)
            .then(|| Some((be32(record + 8)? as usize, be32(record + 12)? as usize)))
            .flatten()
    })
}

/// The [`FontVMetrics`] of font `index` of `data`, `None` when it has no `head` or `hhea`.
pub(crate) fn font_vmetrics(data: &[u8], index: u32) -> Option<FontVMetrics> {
    let i16_at = |at: usize| -> Option<f64> {
        Some(f64::from(i16::from_be_bytes(
            data.get(at..at + 2)?.try_into().ok()?,
        )))
    };
    let (head, _) = table(data, index, b"head")?;
    let units_per_em = i16_at(head + 18).map(|u| (u as u16 as f64).max(1.0))?;
    let (hhea, _) = table(data, index, b"hhea")?;
    let ascender = i16_at(hhea + 4)?;
    let descender = -i16_at(hhea + 6)?;
    let (typo_ascender, typo_descender) = match table(data, index, b"OS/2") {
        Some((os2, len)) if len >= 72 => (i16_at(os2 + 68)?, -i16_at(os2 + 70)?),
        _ => (0.0, 0.0),
    };
    Some(FontVMetrics {
        units_per_em,
        typo_ascender,
        typo_descender,
        ascender,
        descender,
    })
}

/// Blink's em box of a text item of `metrics` at `size` px, as `(ascent, descent)` above and
/// below its baseline (`ComputeEmHeight`): the normalized typo ascent / descent
/// (`TrySetNormalizedTypoAscentAndDescent`, the ascent rounded to 1/64 px and the descent the
/// rest of the 1/64-px-rounded size; the hhea ascent / descent when the OS/2 ones are unusable),
/// each rounded up to a whole px and capped by the font's whole-px ascent / descent
/// (`SimpleFontData` rounds them: Liberation Serif 20 px is 18 + 4, Chrome 155 `p2.html` d12).
pub(crate) fn em_box(metrics: &FontVMetrics, size: f64) -> (f64, f64) {
    let scale = size / metrics.units_per_em;
    let primary = (
        (metrics.ascender * scale).round(),
        (metrics.descender * scale).round(),
    );
    let normalized = |ascent: f64, descent: f64| {
        let height = ascent + descent;
        (height > 0.0 && ascent >= 0.0 && ascent <= height).then(|| {
            let a = crate::layout_unit::round(ascent * size / height);
            (a, crate::layout_unit::round(size) - a)
        })
    };
    let (a, d) = (metrics.typo_ascender > 0.0)
        .then(|| normalized(metrics.typo_ascender, metrics.typo_descender))
        .flatten()
        .or_else(|| normalized(primary.0, primary.1))
        .unwrap_or((0.0, 0.0));
    (a.ceil().min(primary.0), d.ceil().min(primary.1))
}

/// An em box `(ascent, descent)` around a baseline; `None` = no item.
pub(crate) type EmBox = Option<(f64, f64)>;

/// The union of two em boxes.
pub(crate) fn unite(a: EmBox, b: EmBox) -> EmBox {
    match (a, b) {
        (Some(a), Some(b)) => Some((a.0.max(b.0), a.1.max(b.1))),
        (a, None) => a,
        (None, b) => b,
    }
}

/// One ruby column as laid out before the ruby pass: the base box (an inline-block holding the
/// base content) and its annotation (the `<rt>`, an inline-block) side by side on a line.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct Column {
    /// The line this column sits on (columns of one line share their em boxes).
    pub line: (usize, usize),
    /// Margin-box widths of the base and of the annotation.
    pub base_width: f64,
    pub annotation_width: f64,
    /// Em box of the base content around the base's baseline (`None`: an empty base).
    pub base_em: EmBox,
    /// The line box's own ascent / descent around its baseline, the base em box of an empty
    /// base (Blink falls back to `line_box_metrics`).
    pub line_metrics: (f64, f64),
    /// Em box of the annotation content around the annotation's baseline (`None`: empty).
    pub annotation_em: EmBox,
    /// The annotation's border-box height and its baseline below its border-box top.
    pub annotation_height: f64,
    pub annotation_baseline: f64,
}

/// The edits that place one column ([`place`]): margins of the base box, margins and baseline
/// shift of the annotation box.
#[derive(Debug, Clone, Copy, PartialEq)]
pub(crate) struct ColumnEdit {
    /// Left and right margin of the base box: half the column's spare width each.
    pub base_margin: (f64, f64),
    /// The annotation's left and right margins: it is drawn centred over the column that ends
    /// at its own inline position, and advances the line by nothing.
    pub annotation_margin_x: (f64, f64),
    /// The annotation's top and bottom margins: its margin box is its em box, so the line box
    /// grows by exactly the em box's overflow ([`crate::ruby`] module docs).
    pub annotation_margin_y: (f64, f64),
    /// How far the annotation's baseline is raised above the line's baseline
    /// (`vertical-align: <length>`).
    pub annotation_raise: f64,
}

/// The edits that lay `columns` out as Chrome does. Columns with the same [`Column::line`] share
/// one base em box and one annotation em box.
pub(crate) fn place(columns: &[Column]) -> Vec<ColumnEdit> {
    let shared = |line: (usize, usize)| {
        columns
            .iter()
            .filter(|c| c.line == line)
            .fold((None, None), |(base, ann), c| {
                (
                    unite(base, c.base_em),
                    unite(ann, c.annotation_em.or(Some((0.0, 0.0)))),
                )
            })
    };
    columns
        .iter()
        .map(|c| {
            let (base_em, annotation_em) = shared(c.line);
            let (base_ascent, _) = base_em.unwrap_or(c.line_metrics);
            let (ann_ascent, ann_descent) = annotation_em.unwrap_or((0.0, 0.0));
            let width = c.base_width.max(c.annotation_width);
            let spare = width - c.base_width;
            let ann_left = -(width + c.annotation_width) / 2.0;
            ColumnEdit {
                base_margin: (spare / 2.0, spare - spare / 2.0),
                annotation_margin_x: (ann_left, -(ann_left + c.annotation_width)),
                annotation_margin_y: (
                    ann_ascent - c.annotation_baseline,
                    ann_descent - (c.annotation_height - c.annotation_baseline),
                ),
                annotation_raise: base_ascent + ann_descent,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    const SERIF: &[u8] = include_bytes!("fonts/LiberationSerif-Regular.ttf");

    #[test]
    fn liberation_serif_metrics_are_read_from_its_tables() {
        let m = font_vmetrics(SERIF, 0).unwrap();
        assert_eq!(
            m,
            FontVMetrics {
                units_per_em: 2048.0,
                typo_ascender: 1420.0,
                typo_descender: 442.0,
                ascender: 1825.0,
                descender: 443.0,
            }
        );
    }

    /// Chrome 155 (`p2.html` d1, Liberation Serif 20 px base, 10 px annotation): the annotation's
    /// baseline is 18 px above the base's (base em ascent 16 + annotation em descent 2) and the
    /// line box grows from 23 to 31 px (annotation em ascent 8 + 18 above a baseline 18 px
    /// below the line top: 26 - 18 = 8).
    #[test]
    fn em_boxes_are_blinks_normalized_typo_metrics() {
        let m = font_vmetrics(SERIF, 0).unwrap();
        assert_eq!(em_box(&m, 20.0), (16.0, 4.0));
        assert_eq!(em_box(&m, 10.0), (8.0, 2.0));
    }

    #[test]
    fn a_narrow_annotation_is_centred_over_its_base_and_advances_nothing() {
        let edits = place(&[Column {
            line: (0, 0),
            base_width: 40.0,
            annotation_width: 20.0,
            base_em: Some((16.0, 4.0)),
            line_metrics: (18.0, 5.0),
            annotation_em: Some((8.0, 2.0)),
            annotation_height: 10.0,
            annotation_baseline: 8.5,
        }]);
        let e = edits[0];
        assert_eq!(e.base_margin, (0.0, 0.0));
        assert_eq!(e.annotation_margin_x, (-30.0, 10.0));
        assert_eq!(
            e.annotation_margin_x.0 + 20.0 + e.annotation_margin_x.1,
            0.0
        );
        assert_eq!(e.annotation_margin_y, (-0.5, 0.5));
        assert_eq!(e.annotation_raise, 18.0);
    }

    #[test]
    fn a_wide_annotation_widens_the_column_and_centres_the_base() {
        let e = place(&[Column {
            line: (0, 0),
            base_width: 20.0,
            annotation_width: 40.0,
            base_em: Some((16.0, 4.0)),
            line_metrics: (18.0, 5.0),
            annotation_em: Some((8.0, 2.0)),
            annotation_height: 10.0,
            annotation_baseline: 8.0,
        }])[0];
        assert_eq!(e.base_margin, (10.0, 10.0));
        // Drawn from the column start (40 px left of its own position), advancing nothing.
        assert_eq!(e.annotation_margin_x, (-40.0, 0.0));
    }

    /// The columns of one line share one baseline for their annotations, above the tallest base.
    #[test]
    fn columns_of_a_line_share_their_em_boxes() {
        let col = |base_em: EmBox, line| Column {
            line,
            base_width: 10.0,
            annotation_width: 10.0,
            base_em,
            line_metrics: (18.0, 5.0),
            annotation_em: Some((8.0, 2.0)),
            annotation_height: 10.0,
            annotation_baseline: 8.0,
        };
        let edits = place(&[
            col(Some((16.0, 4.0)), (0, 0)),
            col(Some((50.0, 0.0)), (0, 0)),
            col(Some((16.0, 4.0)), (0, 1)),
        ]);
        assert_eq!(edits[0].annotation_raise, 52.0);
        assert_eq!(edits[1].annotation_raise, 52.0);
        assert_eq!(edits[2].annotation_raise, 18.0);
    }

    /// An empty base takes the line box's metrics (Blink `ComputeRelativeOffsets`).
    #[test]
    fn an_empty_base_sits_on_the_line_box() {
        let e = place(&[Column {
            line: (0, 0),
            base_width: 0.0,
            annotation_width: 10.0,
            base_em: None,
            line_metrics: (18.0, 5.0),
            annotation_em: Some((8.0, 2.0)),
            annotation_height: 10.0,
            annotation_baseline: 8.0,
        }])[0];
        assert_eq!(e.annotation_raise, 20.0);
    }
}
