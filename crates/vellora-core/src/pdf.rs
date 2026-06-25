//! krilla PDF emission — the only module that touches krilla.
//!
//! Takes a paginated display list (pages of positioned boxes + text runs in
//! page-local CSS px, top-left origin) and emits a PDF. Emits one
//! krilla page per paginated page (px->pt flip) with real Parley glyph runs
//! with ToUnicode, never rasterized.

use std::collections::HashMap;
use std::sync::Arc;

use krilla::color::rgb;
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

/// Parley exposes the line baseline used for layout. Chromium's print output
/// paints the same bundled faces slightly higher when rasterized by Poppler;
/// compensate proportionally to the run size instead of using a fixture-sized
/// absolute offset.
const TEXT_BASELINE_COMPENSATION_EM: f64 = 0.30;

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
    /// Running header/footer strings shaped by krilla itself (correct glyphs +
    /// ToUnicode for the per-page page-number label).
    pub margin_texts: Vec<MarginText>,
}

/// A running header/footer string to be shaped+drawn by krilla's `draw_text`.
pub struct MarginText {
    pub text: String,
    /// Baseline origin in page-local CSS px (top-left origin).
    pub origin_x: f64,
    pub origin_y: f64,
    pub font_size: f32,
    /// Raw font bytes + face index reused from a body run.
    pub font_data: std::sync::Arc<Vec<u8>>,
    pub font_index: u32,
    pub color: [u8; 3],
}

/// A solid-filled rectangle (used for backgrounds / header bands).
pub struct FilledRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub color: [u8; 3],
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
}

/// Emit the paginated pages to a PDF byte stream.
pub fn emit(pages: &[PdfPage], meta: &DocMeta) -> Result<Vec<u8>, String> {
    let mut document = Document::new_with(SerializeSettings::default());

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

        for run in &page.text_runs {
            draw_text_run(&mut surface, run, &mut font_cache)?;
        }

        // Running header/footer: let krilla shape the per-page label so its
        // glyphs + ToUnicode are correct for the exact (varying) string.
        for mt in &page.margin_texts {
            draw_margin_text(&mut surface, mt, &mut font_cache)?;
        }

        surface.finish();
        krilla_page.finish();
    }

    document
        .finish()
        .map_err(|e| format!("krilla finish failed: {e:?}"))
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

    // Build krilla glyphs. Parley gives px advances/offsets at this font size;
    // krilla's KrillaGlyph expects them normalized by font size (it multiplies
    // back by size internally), per its constructor contract.
    let glyphs: Vec<KrillaGlyph> = run
        .glyphs
        .iter()
        .map(|g| {
            KrillaGlyph::new(
                GlyphId::new(g.id),
                g.advance / font_size,
                g.x_offset / font_size,
                g.y_offset / font_size,
                0.0,
                g.text_start..g.text_end,
                None,
            )
        })
        .collect();

    // Baseline origin in krilla's top-left space (px->pt, no flip).
    let baseline_y = run.origin_y - run.font_size as f64 * TEXT_BASELINE_COMPENSATION_EM;
    let start = Point::from_xy(content_x_pt(run.origin_x), content_y_pt(baseline_y));

    set_solid_fill(surface, run.color);

    surface.draw_glyphs(
        start,
        &glyphs,
        font,
        &run.text,
        font_size * PX_TO_PT as f32,
        false,
    );

    Ok(())
}

fn draw_margin_text(
    surface: &mut krilla::surface::Surface,
    mt: &MarginText,
    font_cache: &mut HashMap<(usize, u32), Font>,
) -> Result<(), String> {
    let font = cached_font(font_cache, &mt.font_data, mt.font_index, "margin font")?;

    let start = Point::from_xy(content_x_pt(mt.origin_x), content_y_pt(mt.origin_y));
    set_solid_fill(surface, mt.color);
    // krilla shapes the string against the font (correct glyph IDs + ToUnicode).
    surface.draw_text(
        start,
        font,
        mt.font_size * PX_TO_PT as f32,
        &mt.text,
        false,
        krilla::text::TextDirection::Auto,
    );
    Ok(())
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
}
