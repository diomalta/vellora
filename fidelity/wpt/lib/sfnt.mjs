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
