//! krilla PDF emission — the only module that touches krilla.
//!
//! Takes a paginated display list (pages of positioned boxes + text runs in
//! page-local CSS px, top-left origin) and emits a PDF. Emits one
//! krilla page per paginated page (px->pt flip) with real Parley glyph runs
//! with ToUnicode, never rasterized.

use std::collections::HashMap;
use std::sync::Arc;

use krilla::color::rgb;
use krilla::configure::{Archival, ConfigurationBuilder};
use krilla::error::KrillaError;
use krilla::geom::{Path, PathBuilder, Point, Rect, Size, Transform};
use krilla::image::Image;
use krilla::metadata::{DateTime, Metadata};
use krilla::num::NormalizedF32;
use krilla::page::PageSettings;
use krilla::paint::{Fill, Stroke};
use krilla::text::{Font, GlyphId, KrillaGlyph};
use krilla::{Document, SerializeSettings};

use crate::blitz_engine::{ImageFormat, ImageRun, TextRun};

/// px -> pt scale (layout px @96dpi -> PDF pt @72dpi).
const PX_TO_PT: f64 = 0.75;

/// Map a layout Y (CSS px, top-left origin) to a krilla surface Y (pt).
///
/// krilla's drawing surface is **top-left origin** (krilla `surface.rs`: "the
/// coordinate axis is in the top-left corner"); it converts to PDF's bottom-left
/// internally. Our layout is already top-left, so this is a plain px->pt scale
/// with NO `page_h - y` flip. Applying a flip here double-handles the Y axis,
/// which inverts the document and pushes all content into the bottom band.
fn content_y_pt(origin_y_px: f64) -> f32 {
    (origin_y_px * PX_TO_PT) as f32
}

/// Map a layout X (CSS px) to a krilla surface X (pt). Plain scale (X is not flipped).
fn content_x_pt(x_px: f64) -> f32 {
    (x_px * PX_TO_PT) as f32
}

/// One page of the paginated display list, in page-local CSS px (top-left
/// origin). The pagination layer produces these; here we only emit them.
pub struct PdfPage {
    /// Page width/height in CSS px.
    pub width_px: f64,
    pub height_px: f64,
    /// Filled rectangles (e.g. table header bands), page-local px.
    pub rects: Vec<FilledRect>,
    /// Rounded border strokes (e.g. small badges), page-local px.
    pub rounded_strokes: Vec<RoundedStroke>,
    /// Raster images, page-local px.
    pub images: Vec<ImageRun>,
    /// Positioned text runs, page-local px (baseline origin).
    pub text_runs: Vec<TextRun>,
    /// Running headers/footers (`@top-center` / `@bottom-center` margin boxes).
    pub margin_texts: Vec<MarginText>,
}

/// A running header/footer: its resolved string and the glyph runs Blitz shaped it into
/// (`blitz_engine::lay_out_margin_texts`), page-local px, drawn like body text.
pub struct MarginText {
    pub text: String,
    pub runs: Vec<TextRun>,
}

/// A solid-filled rectangle (used for backgrounds / header bands).
pub struct FilledRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub color: [u8; 3],
    /// Painting-order layer (`blitz_engine::paint_tier`): rects are drawn in list order, which
    /// `pagination::merge_adjacent_rects` sorts by tier first.
    pub tier: u8,
}

/// A rounded rectangle outline drawn with a PDF stroke.
pub struct RoundedStroke {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub radius_x: f64,
    pub radius_y: f64,
    pub stroke_width: f64,
    pub color: [u8; 3],
}

/// Caller-supplied document metadata (current surface). Producer is fixed.
#[derive(Clone, Default)]
pub struct DocMeta {
    pub title: Option<String>,
    /// Deterministic creation date as (year, month, day). Never wall-clock.
    pub creation_date: Option<(u16, u8, u8)>,
    /// Optional archival conformance profile.
    pub pdfa: Option<PdfAProfile>,
}

/// PDF/A profiles currently supported by vellora.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum PdfAProfile {
    A2B,
}

impl PdfAProfile {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::A2B => "PDF/A-2b",
        }
    }
}

/// Error emitted by the PDF backend.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PdfEmitError {
    Render(String),
    Conformance {
        profile: PdfAProfile,
        errors: Vec<String>,
    },
}

impl From<String> for PdfEmitError {
    fn from(message: String) -> Self {
        Self::Render(message)
    }
}

/// Emit the paginated pages to a PDF byte stream.
pub fn emit(pages: &[PdfPage], meta: &DocMeta) -> Result<Vec<u8>, PdfEmitError> {
    let mut document = Document::new_with(serialize_settings(meta.pdfa)?);

    // Metadata. Producer is fixed to vellora; title + creation date are
    // caller-supplied and deterministic.
    let mut md = Metadata::new().producer("vellora".to_string());
    if let Some(title) = &meta.title {
        md = md.title(title.clone());
    }
    if let Some((y, m, d)) = meta.creation_date {
        let mut dt = DateTime::new(y);
        dt = dt.month(m).day(d);
        md = md.creation_date(dt);
    }
    document.set_metadata(md);

    // One krilla Font per distinct face, reused across pages (subsetting picks
    // up every glyph drawn from it).
    let mut font_cache: HashMap<(usize, u32), Font> = HashMap::new();

    for page in pages {
        let w_pt = (page.width_px * PX_TO_PT) as f32;
        let h_pt = (page.height_px * PX_TO_PT) as f32;
        let settings =
            PageSettings::from_wh(w_pt, h_pt).ok_or_else(|| "invalid page size".to_string())?;
        let mut krilla_page = document.start_page_with(settings);
        let mut surface = krilla_page.surface();

        // Background rects first (painted under text).
        for r in &page.rects {
            draw_rect(&mut surface, r);
        }

        for image in &page.images {
            draw_image_run(&mut surface, image)?;
        }

        for s in &page.rounded_strokes {
            draw_rounded_stroke(&mut surface, s);
        }

        // The runs' `text-decoration` lines: underlines and overlines under the glyphs,
        // line-throughs over them (CSS Text Decoration 3 §2.1 painting order).
        let runs = || {
            page.text_runs
                .iter()
                .chain(page.margin_texts.iter().flat_map(|mt| mt.runs.iter()))
        };
        for r in decoration_rects(runs(), false) {
            draw_rect(&mut surface, &r);
        }

        let mut at = 0;
        while at < page.text_runs.len() {
            let end = contiguous_run_end(&page.text_runs, at);
            if end == at + 1 {
                draw_text_run(&mut surface, &page.text_runs[at], &mut font_cache)?;
            } else {
                let mut merged = page.text_runs[at].clone();
                for run in &page.text_runs[at + 1..end] {
                    merged.glyphs.extend(run.glyphs.iter().cloned());
                }
                draw_text_run(&mut surface, &merged, &mut font_cache)?;
            }
            at = end;
        }

        // Running headers/footers, shaped by Blitz like body text (glyphs + ToUnicode).
        for run in page.margin_texts.iter().flat_map(|mt| mt.runs.iter()) {
            draw_text_run(&mut surface, run, &mut font_cache)?;
        }

        for r in decoration_rects(runs(), true) {
            draw_rect(&mut surface, &r);
        }

        surface.finish();
        krilla_page.finish();
    }

    document
        .finish()
        .map_err(|err| finish_error(err, meta.pdfa))
}

fn serialize_settings(pdfa: Option<PdfAProfile>) -> Result<SerializeSettings, PdfEmitError> {
    let Some(profile) = pdfa else {
        return Ok(SerializeSettings::default());
    };
    let configuration = match profile {
        PdfAProfile::A2B => ConfigurationBuilder::new()
            .with_archival_validator(Archival::A2_B)
            .finish(),
    }
    .map_err(|err| {
        PdfEmitError::Render(format!(
            "invalid {} configuration: {err:?}",
            profile.as_str()
        ))
    })?;

    Ok(SerializeSettings {
        configuration,
        ..SerializeSettings::default()
    })
}

fn finish_error(err: KrillaError, pdfa: Option<PdfAProfile>) -> PdfEmitError {
    match (err, pdfa) {
        (KrillaError::Validation(errors), Some(profile)) => PdfEmitError::Conformance {
            profile,
            errors: errors
                .into_iter()
                .map(|(error, validators)| format!("{error:?} ({validators:?})"))
                .collect(),
        },
        (err, _) => PdfEmitError::Render(format!("krilla finish failed: {err:?}")),
    }
}

/// Set a solid (fully opaque) sRGB fill on the surface.
fn set_solid_fill(surface: &mut krilla::surface::Surface, color: [u8; 3]) {
    surface.set_fill(Some(Fill {
        paint: rgb::Color::new(color[0], color[1], color[2]).into(),
        opacity: NormalizedF32::ONE,
        rule: Default::default(),
    }));
}

/// Get-or-insert a krilla `Font` for a face, keyed by font-bytes pointer
/// identity + face index. Loads once per distinct face; reused across pages and
/// runs so subsetting picks up every glyph drawn from it. The key is the `Arc`
/// heap address — identity-based and valid ONLY within this single `emit` call;
/// never persist, serialize, or compare it across renders.
fn cached_font(
    cache: &mut HashMap<(usize, u32), Font>,
    data: &Arc<Vec<u8>>,
    index: u32,
    ctx: &str,
) -> Result<Font, String> {
    let key = (Arc::as_ptr(data) as usize, index);
    if let Some(f) = cache.get(&key) {
        return Ok(f.clone());
    }
    let bytes: Vec<u8> = (**data).clone();
    let font =
        Font::new(bytes.into(), index).ok_or_else(|| format!("krilla could not load {ctx}"))?;
    cache.insert(key, font.clone());
    Ok(font)
}

fn draw_rect(surface: &mut krilla::surface::Surface, r: &FilledRect) {
    // Guard against degenerate/inverted geometry in test builds so a pagination
    // bug that emits a non-positive-area or non-finite rect fails loudly rather
    // than vanishing silently below (the `Rect::from_ltrb`/`finish` None arms
    // return without a trace). No FilledRect is emitted today, so this is a
    // forward-looking guard for when background-fill lowering lands.
    debug_assert!(
        r.x.is_finite()
            && r.y.is_finite()
            && r.width.is_finite()
            && r.height.is_finite()
            && r.width > 0.0
            && r.height > 0.0,
        "draw_rect got degenerate geometry x={} y={} w={} h={}",
        r.x,
        r.y,
        r.width,
        r.height
    );
    // krilla is top-left origin: top edge = r.y, bottom edge = r.y + height (no flip).
    let x0 = content_x_pt(r.x);
    let y0 = content_y_pt(r.y);
    let x1 = content_x_pt(r.x + r.width);
    let y1 = content_y_pt(r.y + r.height);
    let rect = match Rect::from_ltrb(x0, y0, x1, y1) {
        Some(rect) => rect,
        None => return,
    };
    set_solid_fill(surface, r.color);
    let path: Path = {
        let mut pb = PathBuilder::new();
        pb.push_rect(rect);
        match pb.finish() {
            Some(p) => p,
            None => return,
        }
    };
    surface.draw_path(&path);
}

fn draw_rounded_stroke(surface: &mut krilla::surface::Surface, s: &RoundedStroke) {
    debug_assert!(
        s.x.is_finite()
            && s.y.is_finite()
            && s.width.is_finite()
            && s.height.is_finite()
            && s.radius_x.is_finite()
            && s.radius_y.is_finite()
            && s.stroke_width.is_finite()
            && s.width > 0.0
            && s.height > 0.0
            && s.radius_x > 0.0
            && s.radius_y > 0.0
            && s.stroke_width > 0.0,
        "draw_rounded_stroke got degenerate geometry"
    );

    let half = s.stroke_width / 2.0;
    let x0 = s.x + half;
    let y0 = s.y + half;
    let x1 = s.x + s.width - half;
    let y1 = s.y + s.height - half;
    if x1 <= x0 || y1 <= y0 {
        return;
    }
    let rx = (s.radius_x - half).max(0.0).min((x1 - x0) / 2.0);
    let ry = (s.radius_y - half).max(0.0).min((y1 - y0) / 2.0);
    if rx <= 0.0 || ry <= 0.0 {
        return;
    }

    let path = match rounded_rect_path(x0, y0, x1, y1, rx, ry) {
        Some(path) => path,
        None => return,
    };
    surface.set_fill(None);
    surface.set_stroke(Some(Stroke {
        paint: rgb::Color::new(s.color[0], s.color[1], s.color[2]).into(),
        width: (s.stroke_width * PX_TO_PT) as f32,
        ..Default::default()
    }));
    surface.draw_path(&path);
    surface.set_stroke(None);
}

fn draw_image_run(surface: &mut krilla::surface::Surface, run: &ImageRun) -> Result<(), String> {
    if !run.x.is_finite()
        || !run.y.is_finite()
        || !run.width.is_finite()
        || !run.height.is_finite()
        || run.width <= 0.0
        || run.height <= 0.0
    {
        return Ok(());
    }

    let bytes: Vec<u8> = (*run.data).clone();
    let image = match run.format {
        ImageFormat::Png => Image::from_png(bytes.into(), false),
        ImageFormat::Jpeg => Image::from_jpeg(bytes.into(), false),
        ImageFormat::Gif => Image::from_gif(bytes.into(), false),
        ImageFormat::Webp => Image::from_webp(bytes.into(), false),
    }
    .map_err(|e| format!("could not decode embedded image: {e}"))?;
    let size = Size::from_wh(
        (run.width * PX_TO_PT) as f32,
        (run.height * PX_TO_PT) as f32,
    )
    .ok_or_else(|| "invalid image size".to_string())?;
    let transform = Transform::from_translate(content_x_pt(run.x), content_y_pt(run.y));
    surface.push_transform(&transform);
    surface.draw_image(image, size);
    surface.pop();
    Ok(())
}

fn rounded_rect_path(x0: f64, y0: f64, x1: f64, y1: f64, rx: f64, ry: f64) -> Option<Path> {
    // Cubic approximation of a quarter ellipse.
    const KAPPA: f64 = 0.552_284_749_830_793_6;

    let x0 = content_x_pt(x0);
    let y0 = content_y_pt(y0);
    let x1 = content_x_pt(x1);
    let y1 = content_y_pt(y1);
    let rx = (rx * PX_TO_PT) as f32;
    let ry = (ry * PX_TO_PT) as f32;
    let ox = (rx as f64 * KAPPA) as f32;
    let oy = (ry as f64 * KAPPA) as f32;

    let mut pb = PathBuilder::new();
    pb.move_to(x0 + rx, y0);
    pb.line_to(x1 - rx, y0);
    pb.cubic_to(x1 - rx + ox, y0, x1, y0 + ry - oy, x1, y0 + ry);
    pb.line_to(x1, y1 - ry);
    pb.cubic_to(x1, y1 - ry + oy, x1 - rx + ox, y1, x1 - rx, y1);
    pb.line_to(x0 + rx, y1);
    pb.cubic_to(x0 + rx - ox, y1, x0, y1 - ry + oy, x0, y1 - ry);
    pb.line_to(x0, y0 + ry);
    pb.cubic_to(x0, y0 + ry - oy, x0 + rx - ox, y0, x0 + rx, y0);
    pb.close();
    pb.finish()
}

/// Two runs continue each other when the second starts where the first's advances end.
const RUN_CONTINUATION_EPSILON_PX: f64 = 1e-3;

/// The end of the stretch of `runs` from `start` that one text object can draw: each next run
/// continues the previous one exactly (same source string, face, size and colour, same baseline,
/// its origin where the previous run's advances end). Parley ends a glyph run at every inline
/// box, so text that a float (or another inline box of zero advance) interrupts reaches the
/// emitter as two runs; drawn as two text objects, the second restarts at a rounded `Tm` origin
/// and Poppler rasterizes its glyphs a fraction of a pixel off the single-object drawing of the
/// same text (WPT css/CSS2/floats/floats-placement-vertical-001a.xht: `Hello` + `Kitty` vs the
/// reference's `HelloKitty`, 4 pixels differ by up to 3/255; float-nowrap-8.html: 4 pixels, up
/// to 84/255). One text object for the stretch draws the glyphs where they were already
/// positioned, so the page's text does not move.
fn contiguous_run_end(runs: &[TextRun], start: usize) -> usize {
    let mut end = start + 1;
    while let (Some(prev), Some(next)) = (runs.get(end - 1), runs.get(end)) {
        let prev_end = prev.origin_x
            + prev
                .glyphs
                .iter()
                .map(|g| f64::from(g.advance))
                .sum::<f64>();
        let continues = Arc::ptr_eq(&prev.text, &next.text)
            && Arc::ptr_eq(&prev.font_data, &next.font_data)
            && prev.font_index == next.font_index
            && prev.font_size == next.font_size
            && prev.color == next.color
            && prev.origin_y == next.origin_y
            && !next.glyphs.is_empty()
            && (next.origin_x - prev_end).abs() < RUN_CONTINUATION_EPSILON_PX;
        if !continues {
            break;
        }
        end += 1;
    }
    end
}

/// The `text-decoration` lines ([`TextRun::decorations`]) of `runs` with `over_text` as given,
/// as page rects, in run order. A line continued by the next run of the same line (same colour,
/// top and height, the next starting within 0.5 px of its end) is one rect: two abutting rects
/// leave an anti-aliasing seam between them in a rasterizer.
fn decoration_rects<'a>(
    runs: impl Iterator<Item = &'a TextRun>,
    over_text: bool,
) -> Vec<FilledRect> {
    let mut out: Vec<FilledRect> = Vec::new();
    for run in runs {
        for d in run.decorations.iter().filter(|d| d.over_text == over_text) {
            if !(d.width > 0.0 && d.height > 0.0) {
                continue;
            }
            let rect = FilledRect {
                x: run.origin_x + d.x,
                y: run.origin_y + d.top,
                width: d.width,
                height: d.height,
                color: d.color,
                tier: 0,
            };
            if let Some(prev) = out.last_mut().filter(|p| {
                p.color == rect.color
                    && (p.y - rect.y).abs() < 1e-6
                    && (p.height - rect.height).abs() < 1e-6
                    && (rect.x - (p.x + p.width)).abs() <= 0.5
            }) {
                prev.width = rect.x + rect.width - prev.x;
                continue;
            }
            out.push(rect);
        }
    }
    out
}

fn draw_text_run(
    surface: &mut krilla::surface::Surface,
    run: &TextRun,
    font_cache: &mut HashMap<(usize, u32), Font>,
) -> Result<(), String> {
    if run.glyphs.is_empty() {
        return Ok(());
    }

    let font = cached_font(font_cache, &run.font_data, run.font_index, "font face")?;

    let font_size = run.font_size;

    set_solid_fill(surface, run.color);

    // A preserved tab is a shift to the next tab stop, never a glyph (CSS Text 3 §4.2 "Tab
    // Character Size": it is rendered as a horizontal shift; Chrome 155 paints nothing for it).
    // Parley shapes U+0009 like any character, and no bundled face maps it, so the run carries
    // the face's `.notdef` (glyph 0, a box in the Liberation faces) for it. The run is drawn in
    // segments around its tab glyphs: each tab keeps its advance (the next segment starts after
    // it) and draws nothing. Only U+0009 clusters: a genuinely unmapped character keeps its
    // `.notdef`, as Chrome paints tofu for it. Parley 0.12 also gives a tab one space advance
    // whatever `tab-size` says; that width is not corrected here
    // (`tests/text_probes.rs` `preserved_tab_paints_no_glyph`).
    let mut pen_px = 0.0f64;
    let mut segment_start_px = 0.0f64;
    let mut segment: Vec<KrillaGlyph> = Vec::new();
    for g in &run.glyphs {
        if run.text.get(g.text_start..g.text_end) == Some("\t") {
            draw_glyph_segment(surface, run, font.clone(), segment_start_px, &segment);
            segment.clear();
            pen_px += f64::from(g.advance);
            segment_start_px = pen_px;
            continue;
        }
        // Parley gives px advances/offsets at this font size; krilla's KrillaGlyph expects
        // them normalized by font size (it multiplies back by size internally), per its
        // constructor contract.
        segment.push(KrillaGlyph::new(
            GlyphId::new(g.id),
            g.advance / font_size,
            g.x_offset / font_size,
            g.y_offset / font_size,
            0.0,
            g.text_start..g.text_end,
            None,
        ));
        pen_px += f64::from(g.advance);
    }
    draw_glyph_segment(surface, run, font, segment_start_px, &segment);

    Ok(())
}

/// Draw `glyphs` of `run` starting `offset_px` after the run's origin.
fn draw_glyph_segment(
    surface: &mut krilla::surface::Surface,
    run: &TextRun,
    font: Font,
    offset_px: f64,
    glyphs: &[KrillaGlyph],
) {
    if glyphs.is_empty() {
        return;
    }
    // Baseline origin in krilla's top-left space (px->pt, no flip). `origin_y` is
    // the Parley line baseline placed exactly as Blitz's own painter places it
    // (content box + `block_offset` + `GlyphRun::baseline()`,
    // `blitz_engine::read_text_runs`), which is where Chrome puts it, so it is
    // drawn as is. Port step 04 removed the former constant 4 px raise
    // (`TEXT_BASELINE_COMPENSATION_PX`): it drew every glyph 3 pt above Chrome's
    // print baseline (`tests/text_baseline.rs`).
    let start = Point::from_xy(
        content_x_pt(run.origin_x + offset_px),
        content_y_pt(run.origin_y),
    );
    surface.draw_glyphs(
        start,
        glyphs,
        font,
        &run.text,
        run.font_size * PX_TO_PT as f32,
        false,
    );
}

#[cfg(test)]
mod tests {
    use super::{content_y_pt, PX_TO_PT};

    // Regression for the upside-down render: krilla's surface is top-left origin, so
    // content near the TOP of the document must map to a SMALLER surface y than
    // content lower down. The old `page_h - y` flip inverted this ordering, which
    // rendered the invoice upside-down and crammed into the bottom band.
    #[test]
    fn content_y_is_top_left_not_flipped() {
        let top = content_y_pt(95.0); // element near the document top
        let bottom = content_y_pt(1000.0); // element near the bottom
        assert!(
            top < bottom,
            "top content must map above lower content in krilla top-left space (top={top}, bottom={bottom})"
        );
        // Plain px->pt scale, no page-height term: 95px -> 71.25pt.
        assert!(
            (top - (95.0 * PX_TO_PT) as f32).abs() < 1e-3,
            "y must be origin_y * PX_TO_PT, got {top}"
        );
    }

    /// Runs that continue each other exactly are drawn as one text object; any break in the
    /// source string, colour, baseline or pen position ends the stretch.
    #[test]
    fn only_exact_continuations_share_a_text_object() {
        use super::contiguous_run_end;
        use crate::blitz_engine::{Glyph, TextRun};
        use std::sync::Arc;
        let text = Arc::new("HelloKitty".to_string());
        let face = Arc::new(vec![0u8; 4]);
        let run = |x: f64, start: usize| TextRun {
            text: text.clone(),
            font_data: face.clone(),
            font_index: 0,
            font_size: 12.0,
            origin_x: x,
            origin_y: 20.0,
            line_above: 10.0,
            line_below: 4.0,
            glyphs: (start..start + 5)
                .map(|i| Glyph {
                    id: i as u32,
                    advance: 5.5,
                    x_offset: 0.0,
                    y_offset: 0.0,
                    text_start: i,
                    text_end: i + 1,
                })
                .collect(),
            color: [0, 0, 0],
            decorations: Vec::new(),
        };
        let hello = run(10.0, 0);
        let kitty = run(10.0 + 27.5, 5);
        assert_eq!(contiguous_run_end(&[hello.clone(), kitty.clone()], 0), 2);
        let gap = TextRun {
            origin_x: kitty.origin_x + 0.01,
            ..kitty.clone()
        };
        assert_eq!(contiguous_run_end(&[hello.clone(), gap], 0), 1);
        let red = TextRun {
            color: [255, 0, 0],
            ..kitty.clone()
        };
        assert_eq!(contiguous_run_end(&[hello.clone(), red], 0), 1);
        let lower = TextRun {
            origin_y: 21.0,
            ..kitty.clone()
        };
        assert_eq!(contiguous_run_end(&[hello.clone(), lower], 0), 1);
        let other_text = TextRun {
            text: Arc::new("HelloKitty".to_string()),
            ..kitty
        };
        assert_eq!(contiguous_run_end(&[hello, other_text], 0), 1);
    }
}
