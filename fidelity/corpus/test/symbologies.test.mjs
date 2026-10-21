import assert from "node:assert/strict";
import { test } from "node:test";
import { STOP, code128Widths, code128cPattern, code128cValues } from "../lib/code128c.mjs";
import {
  itfBars,
  itfDecodeElements,
  itfElementCounts,
  itfElements,
  itfNarrowForLength,
} from "../lib/itf.mjs";

// MOC 7.0 Anexo II, Anexo III.01 transcribed value -> B S B S B S widths. The manual prints the
// row for value 71 with the label "61" (typo); the widths in that row are value 71's.
const MOC_TABLE = {
  0: "212222",
  1: "222122",
  2: "222221",
  3: "121223",
  4: "121322",
  5: "131222",
  6: "122213",
  7: "122312",
  8: "132212",
  9: "221213",
  10: "221312",
  11: "231212",
  12: "112232",
  13: "122132",
  14: "122231",
  15: "113222",
  16: "123122",
  17: "123221",
  18: "223211",
  19: "221132",
  20: "221231",
  21: "213212",
  22: "223112",
  23: "312131",
  24: "311222",
  25: "321122",
  26: "321221",
  27: "312212",
  28: "322112",
  29: "322211",
  30: "212123",
  31: "212321",
  32: "232121",
  33: "111323",
  34: "131123",
  35: "131321",
  36: "112313",
  37: "132113",
  38: "132311",
  39: "211313",
  40: "231113",
  41: "231311",
  42: "112133",
  43: "112331",
  44: "132131",
  45: "113123",
  46: "113321",
  47: "133121",
  48: "313121",
  49: "211331",
  50: "231131",
  51: "213113",
  52: "213311",
  53: "213131",
  54: "311123",
  55: "311321",
  56: "331121",
  57: "312113",
  58: "312311",
  59: "332111",
  60: "314111",
  61: "221411",
  62: "431111",
  63: "111224",
  64: "111422",
  65: "121124",
  66: "121421",
  67: "141122",
  68: "141221",
  69: "112214",
  70: "112412",
  71: "122114",
  72: "122411",
  73: "142112",
  74: "142211",
  75: "241211",
  76: "221114",
  77: "413111",
  78: "241112",
  79: "134111",
  80: "111242",
  81: "121142",
  82: "121241",
  83: "114212",
  84: "124112",
  85: "124211",
  86: "411212",
  87: "421112",
  88: "421211",
  89: "212141",
  90: "214121",
  91: "412121",
  92: "111143",
  93: "111341",
  94: "131141",
  95: "114113",
  96: "114311",
  97: "411113",
  98: "411311",
  99: "113141",
  100: "114131",
  101: "311141",
  102: "411131",
  103: "211412",
  104: "211214",
  105: "211232",
};

test("Code 128 width table matches the MOC 7.0 Anexo III.01 transcription for all 106 values", () => {
  for (const [value, widths] of Object.entries(MOC_TABLE)) {
    assert.equal(code128Widths(Number(value)), widths, `value ${value}`);
    assert.equal(
      [...widths].reduce((s, w) => s + Number(w), 0),
      11,
      `value ${value} != 11 modules`,
    );
  }
  assert.equal(STOP, "2331112");
});

test("MOC 7.0 Anexo II 2.1/2.2: 09758364 -> check value 48 and the printed bar sequence", () => {
  const values = code128cValues("09758364");
  assert.deepEqual(values, [105, 9, 75, 83, 64, 48]);
  // Section 2.2 "Representacao Simbolica do Codigo", read left to right.
  const moc =
    "2 1 1 2 3 2 2 2 1 2 1 3 2 4 1 2 1 1 1 1 4 2 1 2 1 1 1 4 2 2 3 1 3 1 2 1 2 3 3 1 1 1 2";
  assert.equal(code128cPattern("09758364"), moc.replace(/ /g, ""));
});

test("44-digit chave -> 24 symbols + stop = 277 modules (MOC 2: 6 cm / 297 positions with margins)", () => {
  const pattern = code128cPattern("35261012345678000195550010000123451705243180");
  const modules = [...pattern].reduce((s, w) => s + Number(w), 0);
  assert.equal(modules, 22 * 11 + 11 + 11 + 13);
  assert.equal(modules + 20, 297);
});

test("ITF: 44 digits = 138 narrow + 89 wide; 103 mm at ratio 3 gives X = 103/405 mm", () => {
  assert.deepEqual(itfElementCounts(44), { narrow: 138, wide: 89 });
  const x = itfNarrowForLength(44, 103, 3);
  assert.ok(Math.abs(x - 103 / 405) < 1e-12);
  const { bars, lengthMm } = itfBars("10494324200000321120055077222133347777777771", {
    narrowMm: x,
    ratio: 3,
  });
  assert.equal(bars.length, 2 + 22 * 5 + 2);
  assert.ok(Math.abs(lengthMm - 103) < 0.001);
});

test("ITF encode/decode round-trip and rejection of a corrupted element", () => {
  const digits = "10494324200000321120055077222133347777777771";
  const elements = itfElements(digits);
  assert.equal(itfDecodeElements(elements), digits);
  const broken = [...elements];
  broken[10] = broken[10] === "n" ? "w" : "n";
  assert.throws(() => itfDecodeElements(broken));
});
