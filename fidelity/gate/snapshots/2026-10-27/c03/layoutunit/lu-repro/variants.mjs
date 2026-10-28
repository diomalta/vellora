// Minimal LayoutUnit repro set: each variant one document; measured elements carry ids.
const head = (css) =>
  `<!DOCTYPE html><html><head><style>@page{size:A4;margin:0}body{margin:0;font-family:"Liberation Sans";font-size:10pt}${css}</style></head><body>`;
const tail = "</body></html>";
const blk = (id, style, inner = "") => `<div id="${id}" style="${style}">${inner}</div>`;
const rows = (n) =>
  Array.from({ length: n }, (_, i) => `<tr><td id="c${i}">R${i}</td></tr>`).join("");
export const VARIANTS = {
  pad_mm: head("") + blk("m0", "padding:1mm 0;", blk("i0", "height:10px")) + tail,
  pad_frac:
    head("") +
    blk("m0", "padding:0.3px 0;", blk("i0", "height:10px")) +
    blk("m1", "padding:0.01px 0;", blk("i1", "height:10px")) +
    tail,
  pad_pt: head("") + blk("m0", "padding:1pt 0;", blk("i0", "height:10px")) + tail,
  pad_left_mm: head("") + blk("m0", "padding-left:1mm;", blk("i0", "height:10px")) + tail,
  margin_mm:
    head("") + blk("m0", "height:10px;margin-bottom:1mm") + blk("m1", "height:10px") + tail,
  margin_neg:
    head("") + blk("m0", "height:20px;margin-bottom:-1mm") + blk("m1", "height:10px") + tail,
  height_mm: head("") + blk("m0", "height:10.1mm") + blk("m1", "height:1px") + tail,
  width_mm: head("") + blk("m0", "width:74mm;height:1px") + tail,
  minh_mm: head("") + blk("m0", "min-height:10.1mm") + blk("m1", "height:1px") + tail,
  width_pct: head("") + blk("m0", "width:33.333%;height:1px") + tail,
  pad_pct: head("") + blk("m0", "width:100px", blk("m1", "padding-top:3.33333%;height:0")) + tail,
  lh_number:
    head("") + blk("m0", "font-size:8.5pt;line-height:1.35", "Ab") + blk("m1", "height:1px") + tail,
  lh_number10: head("") + blk("m0", "line-height:1.35", "Ab") + tail,
  lh_number_fs13: head("") + blk("m0", "font-size:13px;line-height:1.35", "Ab") + tail,
  lh_px: head("") + blk("m0", "line-height:15.3px", "Ab") + tail,
  lh_pct: head("") + blk("m0", "font-size:8.5pt;line-height:135%", "Ab") + tail,
  lh_em: head("") + blk("m0", "font-size:8.5pt;line-height:1.35em", "Ab") + tail,
  lh_number_2lines:
    head("") + blk("m0", "font-size:8.5pt;line-height:1.35;width:20px", "Ab Cd Ef") + tail,
  lh_number_inline_child:
    head("") +
    blk("m0", "font-size:8.5pt;line-height:1.35", "Ab <span style='font-size:12pt'>Cd</span>") +
    tail,
  lh_normal: head("") + blk("m0", "font-size:8.5pt", "Ab") + tail,
  border_02mm: head("") + blk("m0", "border-top:0.2mm solid;height:10px") + tail,
  border_03mm: head("") + blk("m0", "border-top:0.3mm solid;height:10px") + tail,
  border_04mm: head("") + blk("m0", "border-top:0.4mm solid;height:10px") + tail,
  border_15mm: head("") + blk("m0", "border-top:1.5mm solid;height:10px") + tail,
  border_1_5px: head("") + blk("m0", "border-top:1.5px solid;height:10px") + tail,
  td_sep: `${head("table{border-spacing:0}td{padding:1mm 1.5mm;font-size:8.5pt;line-height:1.35}")}<table id="m0">${rows(3)}</table>${tail}`,
  td_extrato: `${head(
    "table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:8.5pt;line-height:1.35}td{border-bottom:0.2mm solid #ccc;padding:1mm 1.5mm;vertical-align:top}",
  )}<table id="m0">${rows(10)}</table>${tail}`,
  fs_round: head("") + blk("m0", "font-size:11.34px;line-height:1.35", "Ab") + tail,
  fs_round_pct: head("") + blk("m0", "font-size:11.34px;line-height:135%", "Ab") + tail,
  fs_round_normal: head("") + blk("m0", "font-size:11.34px", "Ab") + tail,
  spacing_mm: `${head("table{border-spacing:1.5mm}td{padding:0;height:10px}")}<table id="m0">${rows(3)}</table>${tail}`,
  gap_mm:
    head("") +
    blk(
      "m0",
      "display:flex;flex-direction:column;row-gap:1mm",
      blk("i0", "height:10px") + blk("i1", "height:10px"),
    ) +
    tail,
  rel_top: head("") + blk("m0", "position:relative;top:1mm;height:10px") + tail,
  abs_top:
    head("body{position:relative}") +
    blk("m0", "position:absolute;top:1mm;left:1mm;height:10px;width:10px") +
    tail,
  text_indent: head("") + blk("m0", "text-indent:1mm", "<span id='s0'>Ab</span>") + tail,
  inline_pad:
    head("") +
    blk("m0", "", "<span id='s0' style='padding-left:1mm'>Ab</span><span id='s1'>Cd</span>") +
    tail,
  calc_mix:
    head("") + blk("m0", "width:100px", blk("m1", "padding-top:calc(1mm + 1%);height:0")) + tail,
  em_pad:
    head("") + blk("m0", "font-size:8.5pt;padding-top:0.5em", blk("i0", "height:10px")) + tail,
  page_margin_mm:
    '<!DOCTYPE html><html><head><style>@page{size:A4;margin:16mm 15mm}body{margin:0;font-family:"Liberation Sans";font-size:10pt}</style></head><body><div id="m0" style="height:10px"></div></body></html>',
};
