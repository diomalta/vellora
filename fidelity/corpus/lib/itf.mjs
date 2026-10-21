// Interleaved 2 of 5 ("2 de 5 intercalado"), the symbology mandated for the boleto barcode by
// BCB Carta-Circular 2.926/2000 (V - CODIGO DE BARRAS): 5 elements per digit, 2 of them wide; the
// first digit of each pair is carried by the bars and the second by the spaces.
// The per-digit N/W patterns and the start (NNNN) / stop (WNN) patterns are the standard ITF ones
// (ISO/IEC 16390 - not accessed, see SOURCES.md; the decoder oracle cross-checks them).

const PATTERNS = {
  0: "nnwwn",
  1: "wnnnw",
  2: "nwnnw",
  3: "wwnnn",
  4: "nnwnw",
  5: "wnwnn",
  6: "nwwnn",
  7: "nnnww",
  8: "wnnwn",
  9: "nwnwn",
};

/**
 * Encode an even-length digit string into the element sequence (alternating bar/space, starting
 * with a bar): start, interleaved pairs, stop. Each element is "n" (narrow) or "w" (wide).
 */
export function itfElements(digits) {
  if (!/^\d+$/.test(digits) || digits.length % 2 !== 0) {
    throw new RangeError("ITF needs an even number of decimal digits");
  }
  const out = ["n", "n", "n", "n"]; // start: bar space bar space, all narrow
  for (let i = 0; i < digits.length; i += 2) {
    const bars = PATTERNS[digits[i]];
    const spaces = PATTERNS[digits[i + 1]];
    for (let k = 0; k < 5; k++) {
      out.push(bars[k], spaces[k]);
    }
  }
  out.push("w", "n", "n"); // stop: wide bar, narrow space, narrow bar
  return out;
}

/** Narrow/wide element counts for a digit count: start 4N, 6N+4W per pair, stop 2N+1W. */
export function itfElementCounts(digitCount) {
  const pairs = digitCount / 2;
  return { narrow: 4 + 6 * pairs + 2, wide: 4 * pairs + 1 };
}

/**
 * Narrow-element width X (mm) that makes the symbol exactly `totalMm` long at wide/narrow `ratio`.
 * For 44 digits: 138 X + 89 * ratio * X = totalMm.
 */
export function itfNarrowForLength(digitCount, totalMm, ratio) {
  const { narrow, wide } = itfElementCounts(digitCount);
  return totalMm / (narrow + wide * ratio);
}

/**
 * Lay out bars (dark elements only) as { x, w } in mm from the symbol start, rounding each edge to
 * `decimals` so the template gets stable strings and edge positions do not accumulate drift.
 */
export function itfBars(digits, { narrowMm, ratio, decimals = 4 }) {
  const elements = itfElements(digits);
  const bars = [];
  let x = 0;
  const round = (v) => Number(v.toFixed(decimals));
  elements.forEach((el, index) => {
    const w = el === "w" ? narrowMm * ratio : narrowMm;
    if (index % 2 === 0) {
      const x0 = round(x);
      const x1 = round(x + w);
      bars.push({ x: x0, w: round(x1 - x0), wide: el === "w" });
    }
    x += w;
  });
  return { bars, lengthMm: round(x), elementCount: elements.length };
}

/** Decode an element sequence (n/w, bar first) back to digits; throws on any structural error. */
export function itfDecodeElements(elements) {
  const seq = elements.join("");
  if (!seq.startsWith("nnnn") || !seq.endsWith("wnn")) {
    throw new Error("missing ITF start/stop");
  }
  const body = seq.slice(4, -3);
  if (body.length % 10 !== 0) {
    throw new Error("ITF body is not a whole number of digit pairs");
  }
  const reverse = Object.fromEntries(Object.entries(PATTERNS).map(([d, p]) => [p, d]));
  let digits = "";
  for (let i = 0; i < body.length; i += 10) {
    let bars = "";
    let spaces = "";
    for (let k = 0; k < 10; k += 2) {
      bars += body[i + k];
      spaces += body[i + k + 1];
    }
    if (!(bars in reverse) || !(spaces in reverse)) {
      throw new Error(`invalid ITF pattern at pair ${i / 10}`);
    }
    digits += reverse[bars] + reverse[spaces];
  }
  return digits;
}
