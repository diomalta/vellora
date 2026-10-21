// Interleaved 2 of 5 (ITF) encoder used ONLY to build canary documents that prove the barcode
// oracle can decode a vellora-rendered bar pattern (and that the FEBRABAN check rejects a bad DV).
//
// Source for the symbology tables: Banco Santander, "Código de Barras - Cobrança", Versão 36
// (Abril 2025), p.3-4 ("Código 2 de 5 intercalado": 5 elements per digit, 2 wide, digit
// patterns 0=00110 ... 9=01010 with 1 = wide; first digit of a pair -> bars, second -> spaces;
// start and stop characters). The boleto symbology itself ("2 de 5 intercalado", 103 mm x 13 mm)
// is mandated by Banco Central do Brasil Carta-Circular nº 2926 (24/07/2000), Anexo,
// "Instruções de preenchimento" 01.b.V.
// Start = narrow bar, narrow space, narrow bar, narrow space; stop = wide bar, narrow space,
// narrow bar (standard ITF; consistent with the Santander start/stop description).

export const ITF_DIGIT_PATTERNS = Object.freeze({
  0: "00110",
  1: "10001",
  2: "01001",
  3: "11000",
  4: "00101",
  5: "10100",
  6: "01100",
  7: "00011",
  8: "10010",
  9: "01010",
});

/**
 * Encode an even-length digit string into ITF elements: [{ bar: boolean, wide: boolean }, ...]
 * including start and stop patterns.
 */
export function encodeItf(digits) {
  if (!/^\d*$/.test(digits) || digits.length === 0 || digits.length % 2 !== 0) {
    throw new Error(
      `ITF needs a non-empty even-length digit string, got ${JSON.stringify(digits)}`,
    );
  }
  const elements = [
    { bar: true, wide: false },
    { bar: false, wide: false },
    { bar: true, wide: false },
    { bar: false, wide: false },
  ];
  for (let i = 0; i < digits.length; i += 2) {
    const bars = ITF_DIGIT_PATTERNS[digits[i]];
    const spaces = ITF_DIGIT_PATTERNS[digits[i + 1]];
    for (let k = 0; k < 5; k += 1) {
      elements.push({ bar: true, wide: bars[k] === "1" });
      elements.push({ bar: false, wide: spaces[k] === "1" });
    }
  }
  elements.push({ bar: true, wide: true }, { bar: false, wide: false }, { bar: true, wide: false });
  return elements;
}

/**
 * Canary HTML: an ITF symbol drawn as fixed-width block boxes in a flex row (the layout
 * primitive the native strict gate accepts), followed by the digits as text.
 *
 * `narrow` + `unit` set the narrow module. 0.254 mm (3:1) puts 44 digits at ~103 mm, the BCB
 * 2926 symbol length, but 0.254 mm is 0.96 CSS px: a layout engine that snaps box edges to whole
 * CSS px will collapse some modules to 0 or 2 px. `{ narrow: 1, unit: "px" }` (~107 mm) is the
 * pixel-aligned variant. Both are run as canaries so the difference is measured, not assumed.
 */
export function itfCanaryHtml(
  digits,
  { narrow = 0.254, unit = "mm", ratio = 3, heightMm = 13, title } = {},
) {
  const elements = encodeItf(digits);
  const cells = elements
    .map((element) => {
      const width = (element.wide ? ratio * narrow : narrow).toFixed(4);
      const color = element.bar ? "#000" : "#fff";
      return `<div style="flex: none; width: ${width}${unit}; height: ${heightMm}mm; background: ${color};"></div>`;
    })
    .join("");
  const quietZone = `${(10 * narrow).toFixed(4)}${unit}`;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${title ?? "ITF canary"}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { margin: 0; font-family: "Vellora Mono", monospace; font-size: 9pt; }
    .symbol { display: flex; padding: 0 ${quietZone}; background: #fff; }
  </style>
</head>
<body>
  <p>ITF canary</p>
  <div class="symbol">${cells}</div>
  <p>${digits}</p>
</body>
</html>
`;
}
