/**
 * The document `warmup()` renders (issue #66).
 *
 * Why it exists: V8 compiles a WebAssembly function the first time it is called (Liftoff, on the
 * calling thread). The engine's first render in a fresh isolate therefore also compiles the ~2 MB
 * of code a typical document runs (measured with `scripts/code-size.mjs --trace`), which is most of
 * the WebAssembly cold start. Rendering this document once, outside a request, compiles that code
 * ahead of time. It is shaped like the documents vellora is for (an `@page` box with page counters,
 * CSS variables, flex rows, a table with a header and borders, bold / italic / serif / monospace
 * text, non-ASCII text, a list, a link and a PNG), so most of the code a real template runs has
 * been compiled when the first real render arrives. Keep it inside the document subset: the render
 * gate rejects anything outside it, and `test/render.test.ts` renders it on both engines.
 */

export const WARMUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>vellora warm-up</title>
<style>
@page { size: A4; margin: 12mm; @bottom-center { content: "Page " counter(page) " of " counter(pages); font-size: 8pt; } }
:root { --ink: #1a1d24; --line: #d7dce4; }
* { box-sizing: border-box; }
body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: var(--ink); margin: 0; }
h1 { font-size: 16pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4mm; }
p { margin: 0 0 2mm; }
.row { display: flex; justify-content: space-between; gap: 4mm; margin: 4mm 0; }
.box { flex: 1; padding: 3mm; border: 0.5pt solid var(--line); border-radius: 2mm; background: #f4f6fa; }
.serif { font-family: "Times New Roman", serif; font-style: italic; }
.mono { font-family: "Courier New", monospace; }
table { width: 100%; border-collapse: collapse; }
thead th { background: #2f5d8a; color: #fff; text-align: left; padding: 2mm; }
td { padding: 2mm; border-bottom: 0.5pt solid var(--line); vertical-align: top; }
tr:nth-child(even) td { background: #fafbfc; }
.right { text-align: right; }
img { width: 10mm; height: 10mm; }
</style>
</head>
<body>
<h1>Warm-up <b>document</b></h1>
<div class="row"><div class="box"><strong>From</strong><br>Acme Ltda. — São Paulo</div><div class="box serif">To<br>Ünïcödé “quotes” &amp; ç</div><img src="warmup.png" alt=""></div>
<table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Total</th></tr></thead>
<tbody><tr><td>Alpha <em>em</em></td><td class="right">1</td><td class="right mono">10.00</td></tr><tr><td>Beta <a href="https://example.com">link</a></td><td class="right">2</td><td class="right mono">20.00</td></tr></tbody></table>
<div class="row"><div>Notes</div><div><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><ul><li>one</li><li>two</li></ul></div></div>
</body>
</html>
`;

/** A 2x2 RGBA PNG (79 bytes), so the image decode and embed paths are compiled too. */
export const WARMUP_PNG = new Uint8Array([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0, 0,
  0, 114, 182, 13, 36, 0, 0, 0, 22, 73, 68, 65, 84, 120, 156, 99, 208, 143, 237, 250, 255, 255, 255,
  255, 6, 6, 16, 1, 226, 0, 0, 99, 54, 11, 37, 14, 252, 41, 117, 0, 0, 0, 0, 73, 69, 78, 68, 174,
  66, 96, 130,
]);
