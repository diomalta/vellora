//! Inline `<svg>` painting: the vector content of an inline SVG element, drawn into its laid-out
//! content box the way Chrome prints it (vector paths, embedded selectable text, no rasterizing).
//!
//! Blitz lays an inline `<svg>` out as a replaced box (blitz-dom 0.3.0-beta.4, `svg` cargo
//! feature) but vellora paints from its own walk, so the SVG's content is parsed again here, with
//! usvg 0.47 (the version krilla-svg 0.8.1 draws), from the source the walk serializes out of the
//! parsed DOM (`blitz_engine::inline_svg_source`). The parse options are vellora's, not Blitz's:
//!
//! - fonts: the bundled faces then the caller's `fonts`, in that order ([`font_db`]); host fonts
//!   are never loaded, so SVG `<text>` is as deterministic as HTML text;
//! - `<image>` / `<feImage>` sources: `data:` URLs only. Any other `href` was already rejected by
//!   the render gate before Blitz parsed the SVG (`blitz_engine::find_external_svg_image`), and
//!   the string resolver here loads nothing, so no file is ever read from the host.

use std::sync::Arc;

use usvg::fontdb;

/// The SVG default font family when neither the SVG nor its HTML ancestors name one. The HTML
/// side injects the `<svg>` element's computed `font-family` on the root, so this applies only
/// to a family list that matches no loaded face.
const DEFAULT_FAMILY: &str = "Liberation Serif";

/// The font database SVG `<text>` resolves against: the bundled faces
/// ([`crate::fonts::BUNDLED_FACES`]) then `custom`, in order (fontdb ids are allocation order,
/// so the database is a pure function of its inputs). The CSS generics map like the HTML font
/// context's ([`crate::fonts::build_font_context`]): `serif` to Liberation Serif, `monospace`
/// to Liberation Mono, every other generic to Liberation Sans.
pub(crate) fn font_db(custom: &[Vec<u8>]) -> Arc<fontdb::Database> {
    let mut db = fontdb::Database::new();
    for face in crate::fonts::BUNDLED_FACES {
        db.load_font_source(fontdb::Source::Binary(Arc::new(face)));
    }
    for bytes in custom {
        db.load_font_source(fontdb::Source::Binary(Arc::new(bytes.clone())));
    }
    db.set_serif_family("Liberation Serif");
    db.set_sans_serif_family("Liberation Sans");
    db.set_cursive_family("Liberation Sans");
    db.set_fantasy_family("Liberation Sans");
    db.set_monospace_family("Liberation Mono");
    Arc::new(db)
}

/// Parse a serialized inline SVG into a drawable tree, or `None` when usvg rejects it (Chrome
/// draws nothing for an SVG it cannot parse either; Blitz's own parse of the same element then
/// fails too and gives it no image data).
pub(crate) fn parse(source: &str, fonts: Arc<fontdb::Database>) -> Option<Arc<usvg::Tree>> {
    let options = usvg::Options {
        resources_dir: None,
        font_family: DEFAULT_FAMILY.to_string(),
        image_href_resolver: usvg::ImageHrefResolver {
            resolve_data: usvg::ImageHrefResolver::default_data_resolver(),
            // Never a path or URL: only `data:` sources are drawn (see the module comment).
            resolve_string: Box::new(|_, _| None),
        },
        fontdb: fonts,
        ..Default::default()
    };
    usvg::Tree::from_str(source, &options).ok().map(Arc::new)
}
