// Minimal table variants: each is one standalone HTML document (Liberation Serif via the bundled
// "Vellora"/Liberation faces, 13.333px font, line-height 20px, padding 8px vertical).
const head = (css) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@page { size: A4; margin: 16mm; }
body { margin: 0; font-family: "Liberation Serif"; font-size: 10pt; line-height: 20px; }
table { width: 400px; }
td { padding: 8px; }
${css}
</style></head><body>`;
const rows = (n) =>
  `<table id="t"><tbody>${Array.from({ length: n }, (_, i) => `<tr id="r${i}"><td id="c${i}a">a${i}</td><td id="c${i}b">b${i}</td></tr>`).join("")}</tbody></table><div id="after">after</div></body></html>`;
export const VARIANTS = {
  collapse_b1: head("table{border-collapse:collapse} td{border:1px solid #000}") + rows(3),
  collapse_b1_10rows: head("table{border-collapse:collapse} td{border:1px solid #000}") + rows(10),
  collapse_b0: head("table{border-collapse:collapse} td{border:0}") + rows(3),
  collapse_b2: head("table{border-collapse:collapse} td{border:2px solid #000}") + rows(3),
  collapse_b05: head("table{border-collapse:collapse} td{border:0.5px solid #000}") + rows(3),
  collapse_b1_tbonly:
    head(
      "table{border-collapse:collapse} td{border-top:1px solid #000;border-bottom:1px solid #000}",
    ) + rows(3),
  separate_s0_b1:
    head("table{border-collapse:separate;border-spacing:0} td{border:1px solid #000}") + rows(3),
  separate_s0_b0: head("table{border-collapse:separate;border-spacing:0} td{border:0}") + rows(3),
  collapse_first_cell_borderless:
    head("table{border-collapse:collapse} td{border:1px solid #000} #c0a{border:0}") + rows(3),
  collapse_table_border2_cells_none:
    head("table{border-collapse:collapse;border-bottom:2px solid #000} td{border:0}") + rows(3),
  collapse_b1_tr_height48:
    head("table{border-collapse:collapse} td{border:1px solid #000} tr{height:48px}") + rows(3),
};
