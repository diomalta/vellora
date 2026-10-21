# Fidelity acceptance criteria

Measurable acceptance criteria for the native renderer, per document class. Every tolerance is either
traced to a primary-source section (document IDs from [`corpus/SOURCES.md`](corpus/SOURCES.md)) or
labelled **DESIGN TARGET** with its rationale. Nothing here says the renderer passes today; the
current status is a dated, INDICATIVE snapshot in [`corpus/RESULTS.md`](corpus/RESULTS.md).

## How to read this file

- **Criterion ID** — stable key used by `corpus/corpus.json` and the run reports.
- **Source** — `SPEC <doc> <section>` when the requirement and its number come from a primary
  document (CONFIRMED by reading it in this run), **DESIGN TARGET** when the requirement or the
  tolerance is ours, **UNVERIFIED ASSUMPTION** when it rests on a document we could not access.
- **Oracle** — the independent tool that decides. "corpus" = implemented in `fidelity/corpus/` and
  run in this phase; "→ area" = owned by another fidelity area (`wpt/`, `layout-diff/`, `oracles/`)
  and **not run by the corpus** (its criteria are DESIGN TARGETs for that tooling).
- Units: mm on the page, origin top-left. Rasters are poppler `pdftoppm -r 600 -gray`
  (1 px = 0.0423 mm). PDF pt = 1/72 in; CSS px = 1/96 in = 0.2646 mm.
- **Reference.** Where no spec fixes a number, vellora is compared with a Chromium reference
  rendering of the same templated HTML with the same Liberation font files (`corpus/lib/chrome-ref.mjs`).
  Locally that is Chrome 155.0.8059.85 (INDICATIVE); CI must pin a Chrome for Testing build via
  `@puppeteer/browsers` and record it. DESIGN TARGET: the consensus reference becomes Chromium **and**
  WeasyPrint (→ oracles); where they disagree by more than the tolerance the criterion reports
  "reference disagreement" instead of PASS/FAIL.
- **Barcodes are not judged against Chromium.** CONFIRMED in this run: Chromium also snaps box
  edges to whole CSS px, so its rendering of a 0.2543 mm-module ITF is not decodable either. The
  barcode reference is the ideal raster drawn directly from `data.json` (no renderer), which must
  decode, and whose one-element corruption must NOT decode (negative control).

## Shared criteria (every corpus fixture)

| ID | Criterion | Tolerance | Source | Oracle |
|---|---|---|---|---|
| DET-1 | Two renders of the same input in one process are byte-identical | exact | SPEC repo invariant (`CLAUDE.md` "Determinism: same input ⇒ byte-identical PDF") | corpus (sha256) |
| DET-2 | A render in a child process with `TZ=America/Sao_Paulo LANG=LC_ALL=pt_BR.UTF-8` is byte-identical to DET-1 | exact | SPEC repo invariant (no wall-clock, no host locale) | corpus (`render-one.mjs`) |
| DET-3 | Linux CI bytes equal the macOS bytes for the same pin | exact | DESIGN TARGET (no platform input reaches the PDF writer; unverified) | → oracles / CI (not run) |
| PDF-S1 | The PDF parses in pypdf strict mode | no exception | DESIGN TARGET (weak structural sanity only; not a validity proof) | corpus (pypdf 6.21.1) |
| PDF-Q1 | `qpdf --check` reports no errors and no warnings | 0 / 0 | DESIGN TARGET (qpdf is the de-facto structural checker) | → oracles (qpdf not installed locally: not run) |
| PDF-A1 | Renders with `pdfa: "PDF/A-2b"` pass veraPDF's PDF/A-2B profile | 0 failed rules | SPEC ISO 19005-2 level B as encoded by the veraPDF validation profile (standard not read in this run: UNVERIFIED ASSUMPTION on the exact rule set) | → oracles (veraPDF in Docker; not run) |
| EXT-1 | Every required text string (per fixture, whitespace-normalized; `loose` entries whitespace-free) is extracted by poppler `pdftotext`, verbatim at least once AND case-insensitively at least `count` times, where `count` is pinned to the string's occurrences in the templated HTML (checked by `node --test`), so a string that also sits inside another line cannot hide a deleted copy | 100 % | DESIGN TARGET (documents must be machine-readable; for boleto/DANFE the strings are the SPEC-mandated fields listed below) | corpus |
| EXT-2 | The same strings are extracted by pypdf **and** pdfminer.six (three independent extractors agree) | 100 % each | DESIGN TARGET | corpus (pdftotext 26.06.0, pypdf 6.21.1, pdfminer.six 20260107) |
| EXT-3 | Extracted text is NFC and keeps every diacritic of the source (no decomposed or dropped marks) | exact | DESIGN TARGET | → oracles (not run; EXT-1/2 cover presence only) |
| REF-P | Page count equals the reference's | exact | DESIGN TARGET | corpus (`pagesVsReference`) |
| REF-R | Glyph-box position of each listed anchor text differs from the reference by at most the tolerance (x and top) | 1.0 mm | DESIGN TARGET (below half an 8 pt line ≈ 1.4 mm, so a whole-line drift fails; the beta.4 notification regression was ≈ 22.5 pt ≈ 7.9 mm) | corpus (pdfminer anchors; per class IDs `BOL-R1`, `DANFE-R1`, `TXT-R1`, `INV-R1`) |
| REF-W | Max word-position error vs the consensus reference over all words | ≤ 1.0 mm; ≤ 0.5 mm p95 | DESIGN TARGET | → layout-diff / oracles (not run by the corpus) |

## 1. Boleto de pagamento (`fixtures/boleto-febraban`)

Data criteria are checked on `data.json` by `test/fixtures.test.mjs` (node --test); rendering
criteria on the PDF by `render-corpus.mjs`.

| ID | Criterion | Tolerance | Source | Oracle |
|---|---|---|---|---|
| BOL-D1 | 44-digit barcode: banco(3) moeda(1) DV(1) fator(4) valor(10) campo livre(25); DV geral = mod 11 weights 2–9 from the right over positions 1–4 + 6–44; results 0, 10, 11 → 1 | exact | SPEC BCB-2926 "Leiaute e conteúdo" + Nota 1; CAIXA Anexo I | corpus (`lib/boleto.mjs`, spec worked example DV 4) |
| BOL-D2 | Linha digitável: 5 fields as in BCB-2926 II; fields 1–3 carry a mod-10 (weights 2,1) DV; dots after the 5th digit of fields 1–3; one character of space between fields; rebuilding the barcode from it yields the printed barcode | exact | SPEC BCB-2926 II + Notas 1–3; CAIXA Anexo V (worked example) | corpus |
| BOL-D3 | Fator de vencimento = days since 07/10/1997, restarting at 1000 on 22/02/2025; printed due date and value equal the fator and valor fields | exact | SPEC CAIXA Anexo II (5.2.2, both tables); BCB-2926 | corpus |
| BOL-D4 | Bank-specific DVs (SIGCB): código do beneficiário, nosso número, campo livre — mod 11, >9 → 0 | exact | SPEC CAIXA Anexos III, IV, VI (worked examples) | corpus |
| BOL-P1 | One page; Recibo do Pagador above, Ficha de Compensação at the bottom of the sheet | exact | SPEC BCB-2926 05.b; CAIXA 2.1 | corpus |
| BOL-X1 / X2 | Required text (EXT-1/EXT-2): linha digitável, bank code, beneficiário name + CNPJ + address, agência/código, pagador name + CPF, due date, value, nosso número, "Recibo do Pagador", "Ficha de Compensação", "Autenticação Mecânica - Ficha de Compensação", "Local de pagamento", "Instruções (Texto de Responsabilidade do Beneficiário)". The first thirteen occur twice (recibo + ficha) and must be extracted twice | 100 % | SPEC BCB-3598 art. 4 § 2 I–V; CAIXA 3.2, 4.2.x; BCB-2926 IV–V | corpus |
| BOL-B1 | The rendered barcode (page 1, 600 dpi) decodes as ITF to exactly the 44 digits and they pass BOL-D1 | exact | SPEC BCB-2926 V ("preenchimento obrigatório", "2 de 5 intercalado") | corpus (zxing-cpp 3.1.1) |
| BOL-B2 | The printed linha digitável is extractable and consistent with the decoded barcode (BOL-D2) | exact | SPEC BCB-2926 II | corpus |
| BOL-G1 | Symbol length (first bar edge to last bar edge) 103 mm | ± 0.3 mm (DESIGN TARGET: ≈ 1 CSS px + raster quantum; BCB states no tolerance) | SPEC BCB-2926 V "103 mm de comprimento"; BANPARA 8.b | corpus (`measure_bars.py`) |
| BOL-G2 | Bar height 13 mm | ± 0.3 mm (DESIGN TARGET) | SPEC BCB-2926 V "13 mm de altura" | corpus |
| BOL-G3 | Symbol starts 5 mm from the ficha's left edge (quiet zone). The ficha left edge is DETECTED: the outer border of the ficha's field grid in the raster (leftmost column with ≥ 20 mm of vertical ink above the symbol). The distance to the sheet edge is reported too (`barcode_start_from_sheet_left`, 10.03 mm in the fixture) | ± 0.3 mm (DESIGN TARGET) | SPEC CAIXA 4.2.10.1 ("5 mm da lateral esquerda da Ficha de Compensação"). **Spec tension**: BCB-2926 V says "da lateral esquerda do formulário" (the sheet) and BANPARA 8.c says "margem esquerda do boleto"; the fixture follows CAIXA, so under the literal BCB reading its symbol is 5 mm too far right | corpus |
| BOL-G4 | Symbol centre 12 mm above the ficha's bottom edge. The bottom edge is **not drawn** in the fixture, so it is DECLARED (UNVERIFIED ASSUMPTION about the engine): detected ficha top + the template's 105 mm `.ficha` height. The centre above the sheet bottom is reported as well (18.0 mm in the Chrome reference) | ± 0.5 mm (DESIGN TARGET; BANPARA words it as a minimum) | SPEC BCB-2926 V ("12 mm desde a margem inferior da ficha"); CAIXA 4.2.10.1 | corpus |
| BOL-G5 | Every bar edge within tolerance of the ideal position from `data.json` (bar count must match first) | ≤ 0.05 mm (DESIGN TARGET ≈ 20 % of X = 0.2543 mm; ISO/IEC 16390 print tolerances not accessed — UNVERIFIED ASSUMPTION) | DESIGN TARGET | corpus |
| BOL-G6 | Ficha de Compensação 95–108 × 170–216 mm (fixture: 105 × 200) positioned at the page bottom: ficha top (first row under the dashed cut line) at 186 mm. The cut line must be a regular dashed line (≥ 95 % of the row's runs are equal dashes with regular gaps); a solid rule or a text row is not a cut line, and the criterion is then "not measurable" (FAIL) | ± 0.5 mm (DESIGN TARGET) | SPEC BCB-2926 03.a, 05.b; CAIXA 2.3 | corpus |
| BOL-T1 | Bank code characters 5 mm high, bold → font size ≥ **20.60 pt** = 5 mm / 0.68799 em. The metric for T1–T3 is the flat digit / cap height of Liberation Sans ("1", "4", "7", "H" = 1409/2048 em), derived from the bundled TTF by `corpus/font_metrics.py` (fontTools 4.67.0), which `node --test` compares with `corpus.json`. Judged on the ficha copy: the code occurs twice and the lower occurrence (the ficha, BCB-2926 05.b) is judged | single − 0.05 pt | SPEC BCB-2926 I "caractere com 5 mm"; CAIXA 4.2.1.2 | corpus (pdfminer sizes) |
| BOL-T2 | Linha digitável characters 3.5–4 mm high → 14.42–16.48 pt (same metric; ficha copy judged, as T1) | ± 0.05 pt | SPEC BCB-2926 II; CAIXA 4.2.1.3 | corpus |
| BOL-T3 | Identificação da Via "Ficha de Compensação" below the symbol, ≤ 2 mm → ≤ **8.24 pt** (2 mm / 0.68799 em, same metric as T1/T2). Anchor: exactly one text line whose whole text is "Ficha de Compensação" inside the band directly under the measured symbol (glyph top within [bottom − 0.5, bottom + 8] mm, x within the symbol span); none or more than one → FAIL. The band size is DESIGN TARGET (BCB says only "abaixo"). Alternative reading, not judged: "2 mm" as the full ink of the string (i-dot top to ç-cedilla bottom, 0.9365 em) → ≤ 6.05 pt; the fixture's 6 pt label satisfies both (the previous 7 pt label was 2.31 mm under that reading) | + 0.05 pt | SPEC BCB-2926 V "Identificação da Via: abaixo do código de barras, dimensão máxima de 2 mm ... 'Ficha de Compensação'" (which height "dimensão" means is not stated: UNVERIFIED ASSUMPTION) | corpus |
| BOL-R1 | REF-R on the bank code, linha digitável and identification anchors | 1.0 mm | DESIGN TARGET | corpus |
| — | Stroke widths (bank code 1.2 mm, linha 0.3 mm — BCB-2926 I/II) | — | SPEC, **not measured** (no stroke-width oracle yet) | gap |

ITF ratio: the fixture uses wide = 3 × narrow; a measured ratio is reported (`N`) but not judged,
because the admissible range (2.0–3.0 per ISO/IEC 16390) is an UNVERIFIED ASSUMPTION. The
`data.px-grid.json` variant (narrow 1 CSS px, wide 3 CSS px, 107.16 mm) is **DIAGNOSTIC only**: it
deliberately violates BOL-G1 (+4.16 mm, its G1 target is overridden to 107.16 mm) to separate
"bars are snapped to the CSS px grid" from "bars are encoded wrong".

## 2. DANFE — NF-e, A-4 retrato, folhas soltas, laser (`fixtures/danfe`)

| ID | Criterion | Tolerance | Source | Oracle |
|---|---|---|---|---|
| DANFE-D1 | Chave de acesso: 44 digits cUF·AAMM·CNPJ·mod·série·nNF·tpEmis·cNF·cDV; cDV mod 11 weights 2–9, remainder 0/1 → 0 | exact | SPEC MOC-VG Tabela 2-1, 2.2.6.2 (worked example DV 5) | corpus |
| DANFE-D2 | Totals: Σ item values = valor dos produtos; valor da nota = produtos + IPI; Σ duplicatas = valor da nota | exact | DESIGN TARGET (internal consistency of synthetic data) | corpus (node --test) |
| DANFE-P1 | One folha, "FOLHA 1/1" printed at the top | exact | SPEC MOC-AII 3.10.2 | corpus |
| DANFE-X1 / X2 | Required text: "DANFE", "DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA", chave in 11 blocks of 4, number, emitente name + CNPJ, destinatário name + CNPJ, valor total, ICMS, protocolo, "SEM VALOR FISCAL", "PROTOCOLO DE AUTORIZAÇÃO DE USO", and the non-suppressible product column headers | 100 % | SPEC MOC-AII 3 (SEM VALOR FISCAL in homologação), 3.1.1, 3.1.3, 3.1.7, 3.7.4, 3.9.1 | corpus |
| DANFE-B1 | The chave barcode decodes as Code 128 to exactly the chave and passes DANFE-D1 | exact | SPEC MOC-AII 2 ("CODE-128C") | corpus (zxing-cpp) |
| DANFE-B2 | Total symbol width ≥ 6 cm (non-impact printers) | ≥ 60 mm | SPEC MOC-AII 2 | corpus |
| DANFE-B3 | Bar height ≥ 0.8 cm and inside the 1.48 cm barcode quadro | [8, 14.8] mm | SPEC MOC-AII 2 (min); 3.8.1 quadro height (max, sugestão) | corpus |
| DANFE-B4 / B5 | Clear margin left / right ≥ 10 modules (fixture module 1 CSS px = 0.2646 mm ≥ the 0.02 cm minimum) | ≥ 2.65 mm | SPEC MOC-AII 2 ("Margem clara ... no mínimo ... 10 módulos") | corpus |
| DANFE-M1 | Margins between printed body and sheet edge 0.2–0.8 cm on every side | each in [2, 8] mm | SPEC MOC-AII 3.6.2 | corpus (page ink box) |
| DANFE-F0 | Every glyph in Times New Roman or Courier New → accepted substitutes: Liberation Serif / Liberation Mono (metric-compatible; vellora bundles no Times New Roman) | no other family | SPEC MOC-AII 3.7; substitution is a **recorded deviation** | corpus (pdfminer font names) |
| — | **How F1–F9 are judged.** Every text node of the template sits in an element tagged `data-moc="<3.7 item>"` (`node --test` fails on an untagged node or an unjudged tag). Each node is a segment; segments are located on all pages (word-bounded, case-insensitive, longest first, each glyph attributed once; a second unbounded pass locates segments whose glyphs touch a neighbour, reported as "merged"). A category fails if any of its segments is not located, if the smallest attributed glyph is below the minimum, or if bold / caps is required and any glyph is not. Where one text sits in two categories the most favourable pairing is used and leftovers fail F11 | — | — | corpus (`font_sizes.py` categories) |
| DANFE-F1 | Block titles ≥ 5 pt, bold, caps | − 0.05 pt | SPEC MOC-AII 3.7.1 | corpus |
| DANFE-F2 | Product column headers ≥ 5 pt, caps | − 0.05 pt | SPEC MOC-AII 3.7.2 | corpus |
| DANFE-F3 | Other field labels ≥ 6 pt, caps | − 0.05 pt | SPEC MOC-AII 3.7.3 | corpus |
| DANFE-F4a/b/c | "DANFE" ≥ 12 pt bold; número/série/folha/tipo ≥ 10 pt bold; "DOCUMENTO AUXILIAR…", ENTRADA/SAÍDA ≥ 8 pt | − 0.05 pt | SPEC MOC-AII 3.7.4 | corpus |
| DANFE-F5 | Chave bold; ≥ 8.5 pt | − 0.05 pt | SPEC MOC-AII 3.7.5 (bold); size is DESIGN TARGET — see note | corpus |
| DANFE-F6a/b | Emitente bold; razão social ≥ 12 pt; address/phone ≥ 8 pt | − 0.05 pt | SPEC MOC-AII 3.7.6 | corpus |
| DANFE-F7 / F8 / F9 | Product content ≥ 6 pt; informações complementares ≥ 6 pt; other field content ≥ 10 pt (every `.val`, the duplicatas, frete, the canhoto NF-e box and the consulta text) | − 0.05 pt | SPEC MOC-AII 3.7.7, 3.7.8, 3.7.9 | corpus |
| DANFE-F10 | Page floor: every glyph on every page ≥ 5 pt (the smallest 3.7 minimum) | − 0.05 pt | SPEC MOC-AII 3.7.1–3.7.9 | corpus |
| DANFE-F11 | Coverage: every glyph of the PDF is attributed to a tagged segment (none unexplained) | 0 unattributed | DESIGN TARGET (makes F1–F9 exhaustive) | corpus |
| DANFE-L1a–d | Block titles near the 3.8.1 suggested positions (destinatário 8.16 cm, fatura 11.09 cm, transportador 14.48 cm, produtos 17.45 cm, + 0.12 cm title padding) | ± 3 mm | DESIGN TARGET: 3.8 sizes are explicitly "sugestão" / "Tamanhos Mínimos", so positions legitimately move | corpus |
| DANFE-R1 | REF-R on block titles (L1a–d) and anchors A1–A5: "DANFE", chave, emitente razão social, "SEM VALOR FISCAL", destinatário razão social (each must occur exactly once in both engines) | 1.0 mm | DESIGN TARGET | corpus |
| DANFE-G1 | Folhas adicionais repeat the identification block (emitente, DANFE, número/série/folha, barcode, chave, natureza, IE/CNPJ) | — | SPEC MOC-AII 3.5 — **expected gap**: vellora repeats only `<thead>`; not exercised by this single-folha fixture | gap |

Spec tensions found while authoring (reported, not resolved by guessing):
- 3.8.1 suggests fields 20.57 cm wide from a 0.25 cm left margin → right margin 0.18 cm, below the
  0.2 cm minimum of 3.6.2. The fixture uses 20.50 cm (3.6.2 is mandatory, 3.8 a suggestion).
- 3.7.9 asks ≥ 10 pt for "demais campos"; a 44-digit chave in 11 blocks at 10 pt Times bold needs
  ≈ 86 mm (24.5 em × 3.53 mm), more than the 80 mm the fixture's chave box has. That 80 mm laser
  chave width is **inferred**, not read: 3.8.1 lists the CHAVE DE ACESSO row only as 0,85 × 12,70 cm
  at 8,12 cm (no Laser row); 8.00 cm is the laser width of the adjacent barcode and dados quadros,
  and the Anexo III.02 drawing is consistent with it. 3.7.5 only requires bold for the chave, so the
  fixture uses 8.5 pt (DANFE-F5 is a DESIGN TARGET).
- 3.7.9 was violated by the first version of this fixture (duplicatas 8 pt, frete 7 pt) and the old
  one-sample check did not see it. The fixture now prints the duplicatas as a 6 pt label (3.7.3)
  plus 10 pt values, and frete as "0 – Remetente", the worked example of 3.1.10, which fits the
  2.79 cm field at 10 pt. The canhoto "Recebemos de ..." label (6 pt) now wraps: on one line it was
  wider than its 16 cm cell and Chromium clipped "AO LADO".
- The fixture shrinks the products quadro from 6.77 cm to 6.37 cm to absorb collapsed-border
  accumulation of the bands above; 3.10.3 permits reductions only in that quadro.

## 3. Invoice / receipt / statement (`oss-sparksuite-invoice`, `oss-postmark-receipt`, the statement in `text-stress-ptbr`)

No regulation fixes these layouts; the reference is Chromium (later Chromium + WeasyPrint).

| ID | Criterion | Tolerance | Source | Oracle |
|---|---|---|---|---|
| INV-P1 | Expected page count of the template (sparksuite: 1) | exact | DESIGN TARGET (upstream template is a one-page invoice) | corpus |
| INV-P2 / TXT-P1 | REF-P: page count equals the reference | exact | DESIGN TARGET | corpus |
| INV-X1 / X2, TXT-X1 / X2 | EXT-1 / EXT-2 on the listed strings (amounts, ids, U+2212 minus, pt-BR pangram, ligature line, wrapped long tokens as `loose`) | 100 % | DESIGN TARGET | corpus |
| INV-I1 | Every `<img>` the template declares with intrinsic dimensions is painted (≥ 1 image XObject for the sparksuite logo) | ≥ declared count | DESIGN TARGET (a silently dropped image is a fidelity failure even when the strict gate accepts the input) | corpus (`pdfimages -list`) |
| INV-R1 / TXT-R1 | REF-R on 4–5 anchor texts per document | 1.0 mm | DESIGN TARGET | corpus |
| TXT-A1 | Right-aligned money columns: right edges of all money tokens in a column agree. Tokens are words (cells pdfminer merges into one line still split), assigned to the column of the nearest money header ("Débito (R$)", "Crédito (R$)", "Saldo (R$)") by right edge, so an isolated misaligned token is measured; a money token farther than half the header spacing from every header fails the criterion | ≤ 0.3 mm spread (≈ 1 CSS px, DESIGN TARGET); 0 unassigned | DESIGN TARGET | corpus (pdfminer, page 2) |
| TXT-B1 | Repeated `<thead>` on every statement page; no month `<tbody>` split across pages unless taller than a page | exact | DESIGN TARGET (COMPATIBILITY.md documents both behaviours as supported/partial) | → layout-diff (not run by the corpus; visible in the PDFs) |

## 4. Letter / notification (existing `fixtures/notification`; "Termos" section of `text-stress-ptbr`)

| ID | Criterion | Tolerance | Source | Oracle |
|---|---|---|---|---|
| LET-1 | Vertical position of the last paragraph and the signature block vs the reference | ≤ 1.0 mm | DESIGN TARGET (the beta.4 regression put the bottom text ≈ 22.5 pt too high) | → layout-diff (not run by the corpus) |
| LET-2 | Line count of every paragraph equals the reference (same line breaks) | exact | DESIGN TARGET | → layout-diff / oracles |
| LET-3 | REF-P page count | exact | DESIGN TARGET | corpus for `text-stress-ptbr`; → oracles for `notification` |

## 5. WPT conformance

| ID | Criterion | Tolerance | Source | Oracle |
|---|---|---|---|---|
| WPT-1 | Pinned WPT commit, pinned test list; pass/fail per reftest recorded with the vellora pin | — | DESIGN TARGET | → wpt (not run) |
| WPT-2 | Ratchet: no test that passes in `fidelity/baselines/` may fail on a new pin | 0 regressions | DESIGN TARGET | → wpt |

## 6. Text extraction (all classes)

EXT-1, EXT-2, EXT-3 above. Additional DESIGN TARGET for the oracles area: reading order of the
required strings is the same in all three extractors (→ oracles, not run).

## 7. Determinism

DET-1, DET-2 (run here), DET-3 (→ CI). Nothing added by the corpus changes the bytes of a normal
render: the corpus only reads fixtures and calls the public `renderPdf` with fixed metadata.

## Per-fixture map

Status column = the INDICATIVE run in `corpus/RESULTS.md` (2026-10-21T04:36:13Z, macOS 27.0.1
arm64, Apple M5 Pro, Node v22.23.2, rustc 1.96.0, Chrome 155.0.8059.85, poppler 26.06.0, gitHead
`ae54650` — the commit that contains the runner, manifest and fixtures that produced it). "FAIL"
lists failing criteria for vellora; Chrome's failures are listed separately.

| Fixture | Class | Criteria | Oracles (run here) | vellora FAILs at this pin | Chrome FAILs |
|---|---|---|---|---|---|
| `boleto-febraban` (`data.json`, spec geometry) | boleto | BOL-D1–D4, P1, X1, X2, B1, B2, G1–G6, T1–T3, R1, DET-1/2, PDF-S1 | node --test, zxing-cpp, measure_bars, pdftotext/pypdf/pdfminer, pdfminer sizes | X1, X2, B1, B2, G4, G5, G6, R1 (G4/G6: no dashed cut line, vellora paints it solid) | B1, G1, G5 (px snapping) |
| `boleto-febraban` (`data.px-grid.json`, DIAGNOSTIC) | boleto | same, G1 target 107.16 mm | same | X1, X2, B2, G4, G6, R1 (B1 and G5 PASS) | none |
| `danfe` | DANFE | DANFE-D1, D2, P1, X1, X2, B1–B5, M1, F0–F11, L1a–d, R1, DET-1/2, PDF-S1 | same + page ink box + data-moc categories | P1, X1, X2, B1, B3, B5, M1, L1b, L1c, L1d, R1 (F1–F11 PASS on both pages) | X2 (pypdf misses "ALÍQ. ICMS"), L1d (+3.17 mm vs 3.8.1 suggestion) |
| `text-stress-ptbr` | statement / text / letter | TXT-X1, X2, A1, P1, R1, LET-3, DET-1/2, PDF-S1 | pdftotext/pypdf/pdfminer, pdfminer columns + anchors | P1 (8 pages vs 7), R1 (11.24 mm drift by "4. Resumo") | none |
| `oss-sparksuite-invoice` | invoice | INV-P1, P2, X1, X2, I1, R1, DET-1/2, PDF-S1 | same + pdfimages | I1 (logo not painted), R1 (11.47 mm) | none |
| `oss-postmark-receipt` | receipt | INV-P2, X1, X2, R1, DET-1/2, PDF-S1 | same | P2 (1 page vs 2), R1 (5.50 mm) | none |
| existing `boleto` | boleto (audit) | BOL-D1, D2, D3 on its data | `audit-existing-boleto.mjs` | D1, D2, D3 fail (see SOURCES.md) | n/a |
| existing `invoice`, `receipt`, `notification` | invoice / receipt / letter | REF-*, LET-*, EXT-* | → layout-diff / oracles | not run by the corpus | — |
