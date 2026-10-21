// Raster helpers with no npm dependencies: binary PPM (P6) parsing, wptrunner-equivalent pixel
// difference, fuzzy pass check, and a small PNG encoder (node:zlib) for failure artifacts.
import { createHash } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";

/**
 * Decode a non-interlaced 8-bit RGB/RGBA/gray PNG (what pdftocairo emits) to RGB, compositing any
 * alpha over white.
 */
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let off = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[12] !== 0)
        throw new Error("only 8-bit non-interlaced PNG supported");
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  const bpp = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!bpp) throw new Error(`unsupported PNG color type ${colorType}`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const out = new Uint8Array(width * height * 3);
  let prev = new Uint8Array(stride);
  let cur = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const base = y * (stride + 1);
    const filter = raw[base];
    for (let i = 0; i < stride; i++) {
      const x = raw[base + 1 + i];
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let v = x;
      if (filter === 1) v = x + a;
      else if (filter === 2) v = x + b;
      else if (filter === 3) v = x + ((a + b) >> 1);
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      cur[i] = v & 0xff;
    }
    for (let px = 0; px < width; px++) {
      const o = (y * width + px) * 3;
      const s = px * bpp;
      if (colorType === 0 || colorType === 4) {
        const alpha = colorType === 4 ? cur[s + 1] : 255;
        const g = Math.round((cur[s] * alpha + 255 * (255 - alpha)) / 255);
        out[o] = g;
        out[o + 1] = g;
        out[o + 2] = g;
      } else {
        const alpha = colorType === 6 ? cur[s + 3] : 255;
        for (let k = 0; k < 3; k++)
          out[o + k] = Math.round((cur[s + k] * alpha + 255 * (255 - alpha)) / 255);
      }
    }
    [prev, cur] = [cur, prev];
  }
  return { width, height, data: out };
}

/** Parse a binary PPM (P6, maxval 255) as produced by `pdftoppm` without `-png`. */
export function parsePpm(buf) {
  let off = 0;
  const tokens = [];
  while (tokens.length < 4) {
    while (off < buf.length && (buf[off] === 0x20 || (buf[off] >= 0x09 && buf[off] <= 0x0d))) off++;
    if (buf[off] === 0x23) {
      while (off < buf.length && buf[off] !== 0x0a) off++;
      continue;
    }
    let s = "";
    while (off < buf.length && buf[off] > 0x20) s += String.fromCharCode(buf[off++]);
    tokens.push(s);
  }
  off++; // the single whitespace byte after maxval
  const [magic, w, h, max] = tokens;
  if (magic !== "P6" || max !== "255")
    throw new Error(`unsupported PPM header ${tokens.join(" ")}`);
  const width = Number(w);
  const height = Number(h);
  const data = buf.subarray(off, off + width * height * 3);
  if (data.length !== width * height * 3) throw new Error("truncated PPM data");
  return { width, height, data };
}

/** SHA-1 of the raw RGB bytes plus geometry (identical images ⇔ identical hash). */
export function imageHash(img) {
  return createHash("sha1").update(`${img.width}x${img.height}:`).update(img.data).digest("hex");
}

/** True when every pixel is pure white. */
export function isBlank(img) {
  const d = img.data;
  for (let i = 0; i < d.length; i++) if (d[i] !== 255) return false;
  return true;
}

/**
 * wptrunner `get_differences`: max per-channel |T-R| over RGB and the number of pixels with any
 * channel difference. Images of different geometry are reported with `sizeMismatch`.
 */
export function pixelDiff(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    return {
      maxDifference: 255,
      totalPixels: Math.max(a.width * a.height, b.width * b.height),
      sizeMismatch: true,
    };
  }
  const da = a.data;
  const db = b.data;
  let maxDifference = 0;
  let totalPixels = 0;
  for (let i = 0; i < da.length; i += 3) {
    const d0 = Math.abs(da[i] - db[i]);
    const d1 = Math.abs(da[i + 1] - db[i + 1]);
    const d2 = Math.abs(da[i + 2] - db[i + 2]);
    const d = d0 > d1 ? (d0 > d2 ? d0 : d2) : d1 > d2 ? d1 : d2;
    if (d !== 0) {
      totalPixels++;
      if (d > maxDifference) maxDifference = d;
    }
  }
  return { maxDifference, totalPixels, sizeMismatch: false };
}

/**
 * wptrunner `check_pass` equality for one page pair, including its two zero-minimum special cases:
 *   no fuzzy (or 0-0;0-0): equal iff no pixel differs;
 *   fuzzy: (px==0 && allowedPx.min==0) || (max==0 && allowedMax.min==0) || both within ranges.
 */
export function pageEqual(diff, fuzzy) {
  const { maxDifference: max, totalPixels: px } = diff;
  if (diff.sizeMismatch) return false;
  const zero =
    !fuzzy ||
    (fuzzy.maxDifference[0] === 0 &&
      fuzzy.maxDifference[1] === 0 &&
      fuzzy.totalPixels[0] === 0 &&
      fuzzy.totalPixels[1] === 0);
  if (zero) return px === 0 && max === 0;
  const [mLo, mHi] = fuzzy.maxDifference;
  const [pLo, pHi] = fuzzy.totalPixels;
  return (
    (px === 0 && pLo === 0) ||
    (max === 0 && mLo === 0) ||
    (mLo <= max && max <= mHi && pLo <= px && px <= pHi)
  );
}

/** Diff visualisation: differing pixels red, others the test pixel faded to 25%. */
export function diffImage(a, b) {
  const out = new Uint8Array(a.width * a.height * 3);
  for (let i = 0; i < out.length; i += 3) {
    const same =
      a.data[i] === b.data[i] && a.data[i + 1] === b.data[i + 1] && a.data[i + 2] === b.data[i + 2];
    if (same) {
      for (let c = 0; c < 3; c++) out[i + c] = 191 + (a.data[i + c] >> 2);
    } else {
      out[i] = 255;
      out[i + 1] = 0;
      out[i + 2] = 0;
    }
  }
  return { width: a.width, height: a.height, data: out };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Encode an RGB image as PNG (8-bit truecolor, filter 0). */
export function encodePng(img) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(img.width, 0);
  ihdr.writeUInt32BE(img.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const stride = img.width * 3;
  const raw = Buffer.alloc((stride + 1) * img.height);
  for (let y = 0; y < img.height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(img.data.buffer, img.data.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
