// CODE-128 subset C, the symbology mandated for the DANFE chave de acesso barcode by
// MOC 7.0 Anexo II, section 2 ("O padrao de codigo de barras a ser impresso no DANFE e o CODE-128C").
// Module widths per symbol value (bar, space, bar, space, bar, space). The table is the standard
// Code 128 one; test/symbologies.test.mjs cross-checks every value against the transcription of
// MOC 7.0 Anexo II, Anexo III.01 (which mislabels value 71 as "61" - a typo in the manual).

const WIDTHS = [
  "212222",
  "222122",
  "222221",
  "121223",
  "121322",
  "131222",
  "122213",
  "122312",
  "132212",
  "221213",
  "221312",
  "231212",
  "112232",
  "122132",
  "122231",
  "113222",
  "123122",
  "123221",
  "223211",
  "221132",
  "221231",
  "213212",
  "223112",
  "312131",
  "311222",
  "321122",
  "321221",
  "312212",
  "322112",
  "322211",
  "212123",
  "212321",
  "232121",
  "111323",
  "131123",
  "131321",
  "112313",
  "132113",
  "132311",
  "211313",
  "231113",
  "231311",
  "112133",
  "112331",
  "132131",
  "113123",
  "113321",
  "133121",
  "313121",
  "211331",
  "231131",
  "213113",
  "213311",
  "213131",
  "311123",
  "311321",
  "331121",
  "312113",
  "312311",
  "332111",
  "314111",
  "221411",
  "431111",
  "111224",
  "111422",
  "121124",
  "121421",
  "141122",
  "141221",
  "112214",
  "112412",
  "122114",
  "122411",
  "142112",
  "142211",
  "241211",
  "221114",
  "413111",
  "241112",
  "134111",
  "111242",
  "121142",
  "121241",
  "114212",
  "124112",
  "124211",
  "411212",
  "421112",
  "421211",
  "212141",
  "214121",
  "412121",
  "111143",
  "111341",
  "131141",
  "114113",
  "114311",
  "411113",
  "411311",
  "113141",
  "114131",
  "311141",
  "411131",
  "211412",
  "211214",
  "211232",
];
export const START_C = 105;
export const STOP = "2331112";

export function code128Widths(value) {
  const w = WIDTHS[value];
  if (w === undefined) {
    throw new RangeError(`no Code 128 symbol for value ${value}`);
  }
  return w;
}

/** Symbol values for an even-length digit string in subset C: START C, pairs, mod-103 check. */
export function code128cValues(digits) {
  if (!/^\d+$/.test(digits) || digits.length % 2 !== 0) {
    throw new RangeError("CODE-128C needs an even number of decimal digits");
  }
  const values = [START_C];
  for (let i = 0; i < digits.length; i += 2) {
    values.push(Number(digits.slice(i, i + 2)));
  }
  // MOC 7.0 Anexo II 2.1: weighted sum (start weight 1, then 1, 2, 3, ...) modulo 103.
  let sum = START_C;
  for (let i = 1; i < values.length; i++) {
    sum += values[i] * i;
  }
  values.push(sum % 103);
  return values;
}

/** Full module-width string (alternating bar/space, bar first) including the stop pattern. */
export function code128cPattern(digits) {
  return code128cValues(digits).map(code128Widths).join("") + STOP;
}

/** Bars (dark runs) as { x, w } in mm for a module width; total length in mm. */
export function code128cBars(digits, { moduleMm, decimals = 4 }) {
  const pattern = code128cPattern(digits);
  const round = (v) => Number(v.toFixed(decimals));
  const bars = [];
  let modules = 0;
  for (let i = 0; i < pattern.length; i++) {
    const run = Number(pattern[i]);
    if (i % 2 === 0) {
      const x0 = round(modules * moduleMm);
      const x1 = round((modules + run) * moduleMm);
      bars.push({ x: x0, w: round(x1 - x0) });
    }
    modules += run;
  }
  return { bars, modules, lengthMm: round(modules * moduleMm) };
}
