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
/// as fallback for broader glyph coverage. Liberation Serif is metrically
/// compatible with Times New Roman and backs CSS `serif` generics for
/// prose/legal documents. Liberation Mono gives CSS `monospace` a real fixed
/// width face for codes, barcodes, and tabular identifiers.
///
/// Licenses:
/// - Liberation Sans: `fonts/LICENSE-Liberation.txt` (SIL Open Font License).
/// - Liberation Serif: `fonts/LICENSE-Liberation.txt` (SIL Open Font License).
/// - Liberation Mono: `fonts/LICENSE-Liberation.txt` (SIL Open Font License).
/// - DejaVu Sans: `fonts/LICENSE-DejaVu.txt` (Bitstream Vera / Arev terms).
const LIBERATION_SANS: &[u8] = include_bytes!("fonts/LiberationSans-Regular.ttf");
const LIBERATION_SANS_BOLD: &[u8] = include_bytes!("fonts/LiberationSans-Bold.ttf");
const LIBERATION_SERIF: &[u8] = include_bytes!("fonts/LiberationSerif-Regular.ttf");
const LIBERATION_SERIF_BOLD: &[u8] = include_bytes!("fonts/LiberationSerif-Bold.ttf");
const LIBERATION_MONO: &[u8] = include_bytes!("fonts/LiberationMono-Regular.ttf");
const LIBERATION_MONO_BOLD: &[u8] = include_bytes!("fonts/LiberationMono-Bold.ttf");
const DEJAVU_SANS: &[u8] = include_bytes!("fonts/DejaVuSans.ttf");
const DEJAVU_SANS_BOLD: &[u8] = include_bytes!("fonts/DejaVuSans-Bold.ttf");

/// Sans-like CSS generic families resolve to the bundled sans stack.
const SANS_GENERIC_FAMILIES: &[GenericFamily] = &[
    GenericFamily::SansSerif,
    GenericFamily::Cursive,
    GenericFamily::Fantasy,
    GenericFamily::SystemUi,
    GenericFamily::UiSansSerif,
    GenericFamily::UiRounded,
];

/// Serif generics resolve to the bundled serif stack, not the sans fallback.
const SERIF_GENERIC_FAMILIES: &[GenericFamily] = &[GenericFamily::Serif, GenericFamily::UiSerif];

/// Monospace generics resolve to a bundled fixed-width face, not the sans stack.
const MONO_GENERIC_FAMILIES: &[GenericFamily] =
    &[GenericFamily::Monospace, GenericFamily::UiMonospace];

/// Build a self-contained [`FontContext`]: the bundled body faces plus Blitz's
/// bullet font (for list markers), with system-font discovery disabled. Passed
/// to every Blitz document via `DocumentConfig::font_ctx` so layout never
/// touches the host's fonts or `libfontconfig`.
pub fn build_font_context() -> FontContext {
    let mut collection = Collection::new(CollectionOptions {
        shared: false,
        system_fonts: false,
    });

    let mut sans_family_ids = Vec::new();
    register_family(
        &mut collection,
        &mut sans_family_ids,
        LIBERATION_SANS,
        LIBERATION_SANS_BOLD,
    );
    register_family(
        &mut collection,
        &mut sans_family_ids,
        DEJAVU_SANS,
        DEJAVU_SANS_BOLD,
    );
    let mut serif_family_ids = Vec::new();
    register_family(
        &mut collection,
        &mut serif_family_ids,
        LIBERATION_SERIF,
        LIBERATION_SERIF_BOLD,
    );
    serif_family_ids.extend(sans_family_ids.iter().copied());
    let mut mono_family_ids = Vec::new();
    register_family(
        &mut collection,
        &mut mono_family_ids,
        LIBERATION_MONO,
        LIBERATION_MONO_BOLD,
    );
    mono_family_ids.extend(sans_family_ids.iter().copied());

    // List markers (e.g. `<ul>` bullets) draw from Blitz's bullet font. Supplying
    // a custom FontContext bypasses Blitz's own default registration of it, so we
    // register it here. It is deliberately NOT mapped to a generic family — it is
    // for markers, never body text.
    collection.register_fonts(Blob::new(Arc::new(blitz_dom::BULLET_FONT) as _), None);

    for &generic in SANS_GENERIC_FAMILIES {
        collection.set_generic_families(generic, sans_family_ids.iter().copied());
    }
    for &generic in SERIF_GENERIC_FAMILIES {
        collection.set_generic_families(generic, serif_family_ids.iter().copied());
    }
    for &generic in MONO_GENERIC_FAMILIES {
        collection.set_generic_families(generic, mono_family_ids.iter().copied());
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
