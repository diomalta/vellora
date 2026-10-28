// Minimal sfnt (TTF/OTF/TTC) `name` table reader: returns the intrinsic family names a font
// declares (nameID 1 = family, nameID 16 = typographic family). vellora matches custom faces by
// their intrinsic family, never by an @font-face alias, so the runner records mismatches.

function u16(b, o) {
  return (b[o] << 8) | b[o + 1];
}
function u32(b, o) {
  return ((b[o] << 24) >>> 0) + ((b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]);
}
function tag(b, o) {
  return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
}

/** Detect the container format from magic bytes. */
export function fontFormat(bytes) {
  if (bytes.length < 4) return "unknown";
  const t = tag(bytes, 0);
  if (t === "wOFF") return "woff";
  if (t === "wOF2") return "woff2";
  if (t === "ttcf") return "ttc";
  if (t === "OTTO") return "otf";
  if (u32(bytes, 0) === 0x00010000 || t === "true") return "ttf";
  return "unknown";
}

function decodeName(bytes, platformId, start, length) {
  const slice = bytes.subarray(start, start + length);
  if (platformId === 0 || platformId === 3) {
    let s = "";
    for (let i = 0; i + 1 < slice.length; i += 2) s += String.fromCharCode(u16(slice, i));
    return s;
  }
  return String.fromCharCode(...slice);
}

function tableOffset(bytes, name) {
  const fmt = fontFormat(bytes);
  if (fmt !== "ttf" && fmt !== "otf" && fmt !== "ttc") return -1;
  const base = fmt === "ttc" ? u32(bytes, 12) : 0;
  const numTables = u16(bytes, base + 4);
  for (let i = 0; i < numTables; i++) {
    const rec = base + 12 + i * 16;
    if (tag(bytes, rec) === name) return u32(bytes, rec + 8);
  }
  return -1;
}

/**
 * Codepoints mapped by the first face's `cmap` (Unicode subtables: format 4 BMP segments and
 * format 12 groups; platform 0, or platform 3 encodings 1/10). Returns a Set; empty when the font
 * has no Unicode cmap. Glyph id 0 (.notdef) is not coverage.
 */
export function readCoverage(bytes) {
  const covered = new Set();
  const cmap = tableOffset(bytes, "cmap");
  if (cmap < 0) return covered;
  const n = u16(bytes, cmap + 2);
  for (let i = 0; i < n; i++) {
    const rec = cmap + 4 + i * 8;
    const platform = u16(bytes, rec);
    const encoding = u16(bytes, rec + 2);
    if (!(platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10)))) continue;
    const sub = cmap + u32(bytes, rec + 4);
    const format = u16(bytes, sub);
    if (format === 4) {
      const segX2 = u16(bytes, sub + 6);
      const ends = sub + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const rangeOffsets = deltas + segX2;
      for (let s = 0; s < segX2; s += 2) {
        const end = u16(bytes, ends + s);
        const start = u16(bytes, starts + s);
        const delta = u16(bytes, deltas + s);
        const ro = u16(bytes, rangeOffsets + s);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let glyph;
          if (ro === 0) glyph = (c + delta) & 0xffff;
          else {
            const at = rangeOffsets + s + ro + (c - start) * 2;
            glyph = u16(bytes, at);
            if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
          }
          if (glyph !== 0) covered.add(c);
        }
      }
    } else if (format === 12) {
      const groups = u32(bytes, sub + 12);
      for (let g = 0; g < groups; g++) {
        const at = sub + 16 + g * 12;
        const start = u32(bytes, at);
        const end = u32(bytes, at + 4);
        const startGlyph = u32(bytes, at + 8);
        for (let c = start; c <= end; c++) if (startGlyph + (c - start) !== 0) covered.add(c);
      }
    }
  }
  return covered;
}

/** Family names of the first face: { family, typographicFamily } (either may be null). */
export function readFamilyNames(bytes) {
  const fmt = fontFormat(bytes);
  if (fmt !== "ttf" && fmt !== "otf" && fmt !== "ttc")
    return { family: null, typographicFamily: null };
  const base = fmt === "ttc" ? u32(bytes, 12) : 0;
  const numTables = u16(bytes, base + 4);
  let nameOff = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = base + 12 + i * 16;
    if (tag(bytes, rec) === "name") nameOff = u32(bytes, rec + 8);
  }
  if (nameOff < 0) return { family: null, typographicFamily: null };
  const count = u16(bytes, nameOff + 2);
  const strings = nameOff + u16(bytes, nameOff + 4);
  const found = {};
  // Preference: Windows/Unicode English, then any Unicode, then Mac Roman.
  const rank = (p, l) => (p === 3 && l === 0x409 ? 0 : p === 3 || p === 0 ? 1 : 2);
  for (let i = 0; i < count; i++) {
    const r = nameOff + 6 + i * 12;
    const platformId = u16(bytes, r);
    const languageId = u16(bytes, r + 4);
    const nameId = u16(bytes, r + 6);
    if (nameId !== 1 && nameId !== 16) continue;
    const value = decodeName(bytes, platformId, strings + u16(bytes, r + 10), u16(bytes, r + 8));
    const score = rank(platformId, languageId);
    if (!found[nameId] || score < found[nameId].score) found[nameId] = { value, score };
  }
  return {
    family: found[1]?.value ?? null,
    typographicFamily: found[16]?.value ?? null,
  };
}
