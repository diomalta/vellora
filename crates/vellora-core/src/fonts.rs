//! Bundled default fonts and the deterministic font context.
//!
//! vellora embeds its own fonts and resolves all text with Blitz's
//! `system_fonts` feature OFF. That is what makes output (a) deterministic
//! across machines — it never depends on host-installed fonts — and (b) free of
//! any system library or font requirement (no `libfontconfig`), so it runs on
//! slim / Alpine (musl) / Lambda images out of the box. Custom user-supplied
//! fonts (the planned `fonts` option) will register into this same context;
//! host/system fonts are intentionally never consulted.

use parley::fontique::{Blob, Collection, CollectionOptions, FamilyId, GenericFamily, SourceCache};
use parley::FontContext;
use std::sync::Arc;

/// Liberation Sans is metrically compatible with Arial and therefore closer to
/// the browser defaults most invoice HTML uses. DejaVu Sans remains registered
/// as fallback for broader glyph coverage.
///
/// Licenses:
/// - Liberation Sans: `fonts/LICENSE-Liberation.txt` (SIL Open Font License).
/// - DejaVu Sans: `fonts/LICENSE-DejaVu.txt` (Bitstream Vera / Arev terms).
const LIBERATION_SANS: &[u8] = include_bytes!("fonts/LiberationSans-Regular.ttf");
const LIBERATION_SANS_BOLD: &[u8] = include_bytes!("fonts/LiberationSans-Bold.ttf");
const DEJAVU_SANS: &[u8] = include_bytes!("fonts/DejaVuSans.ttf");
const DEJAVU_SANS_BOLD: &[u8] = include_bytes!("fonts/DejaVuSans-Bold.ttf");

/// Every CSS generic family resolves to the bundled font stack, so `font-family:
/// sans-serif` (and the rest) render deterministically with no system fonts.
const GENERIC_FAMILIES: &[GenericFamily] = &[
    GenericFamily::Serif,
    GenericFamily::SansSerif,
    GenericFamily::Monospace,
    GenericFamily::Cursive,
    GenericFamily::Fantasy,
    GenericFamily::SystemUi,
    GenericFamily::UiSerif,
    GenericFamily::UiSansSerif,
    GenericFamily::UiMonospace,
    GenericFamily::UiRounded,
];

/// Build a self-contained [`FontContext`]: the bundled body faces plus Blitz's
/// bullet font (for list markers), with system-font discovery disabled. Passed
/// to every Blitz document via `DocumentConfig::font_ctx` so layout never
/// touches the host's fonts or `libfontconfig`.
pub fn build_font_context() -> FontContext {
    let mut collection = Collection::new(CollectionOptions {
        shared: false,
        system_fonts: false,
    });

    let mut family_ids = Vec::new();
    register_family(
        &mut collection,
        &mut family_ids,
        LIBERATION_SANS,
        LIBERATION_SANS_BOLD,
    );
    register_family(
        &mut collection,
        &mut family_ids,
        DEJAVU_SANS,
        DEJAVU_SANS_BOLD,
    );

    // List markers (e.g. `<ul>` bullets) draw from Blitz's bullet font. Supplying
    // a custom FontContext bypasses Blitz's own default registration of it, so we
    // register it here. It is deliberately NOT mapped to a generic family — it is
    // for markers, never body text.
    collection.register_fonts(Blob::new(Arc::new(blitz_dom::BULLET_FONT) as _), None);

    for &generic in GENERIC_FAMILIES {
        collection.set_generic_families(generic, family_ids.iter().copied());
    }

    FontContext {
        collection,
        source_cache: SourceCache::new_shared(),
    }
}

fn register_family(
    collection: &mut Collection,
    family_ids: &mut Vec<FamilyId>,
    regular: &'static [u8],
    bold: &'static [u8],
) {
    for (id, _) in collection.register_fonts(Blob::new(Arc::new(regular) as _), None) {
        push_family_id(family_ids, id);
    }
    for (id, _) in collection.register_fonts(Blob::new(Arc::new(bold) as _), None) {
        push_family_id(family_ids, id);
    }
}

fn push_family_id(family_ids: &mut Vec<FamilyId>, id: FamilyId) {
    if !family_ids.contains(&id) {
        family_ids.push(id);
    }
}
