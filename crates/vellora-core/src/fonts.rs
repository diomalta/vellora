//! Bundled default font (DejaVu Sans) and the deterministic font context.
//!
//! vellora embeds its own font and resolves all text against it with Blitz's
//! `system_fonts` feature OFF. That is what makes output (a) deterministic across
//! machines — it never depends on host-installed fonts — and (b) free of any
//! system library or font requirement (no `libfontconfig`), so it runs on slim /
//! Alpine (musl) / Lambda images out of the box. Custom user-supplied fonts (the
//! planned `fonts` option) will register into this same context; host/system
//! fonts are intentionally never consulted.

use parley::fontique::{Blob, Collection, CollectionOptions, FamilyId, GenericFamily, SourceCache};
use parley::FontContext;
use std::sync::Arc;

/// DejaVu Sans, regular + bold, vendored under `fonts/`. License (free,
/// permissive — Bitstream Vera / Arev): `fonts/LICENSE-DejaVu.txt`.
const DEJAVU_SANS: &[u8] = include_bytes!("fonts/DejaVuSans.ttf");
const DEJAVU_SANS_BOLD: &[u8] = include_bytes!("fonts/DejaVuSans-Bold.ttf");

/// Every CSS generic family resolves to the bundled font, so `font-family:
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

/// Build a self-contained [`FontContext`]: the bundled DejaVu faces plus Blitz's
/// bullet font (for list markers), with system-font discovery disabled. Passed to
/// every Blitz document via `DocumentConfig::font_ctx` so layout never touches the
/// host's fonts or `libfontconfig`.
pub fn build_font_context() -> FontContext {
    let mut collection = Collection::new(CollectionOptions {
        shared: false,
        system_fonts: false,
    });

    // Body-text faces. Regular and Bold share the "DejaVu Sans" family, so the
    // family id from the regular face already covers bold (registered next, which
    // appends the bold face to that same family).
    let mut family_ids: Vec<FamilyId> = collection
        .register_fonts(Blob::new(Arc::new(DEJAVU_SANS) as _), None)
        .into_iter()
        .map(|(id, _)| id)
        .collect();
    for (id, _) in collection.register_fonts(Blob::new(Arc::new(DEJAVU_SANS_BOLD) as _), None) {
        if !family_ids.contains(&id) {
            family_ids.push(id);
        }
    }

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
