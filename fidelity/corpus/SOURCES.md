# Corpus sources and provenance

Every fixture under `fixtures/boleto-febraban/`, `fixtures/danfe/`, `fixtures/text-stress-ptbr/`,
`fixtures/oss-sparksuite-invoice/` and `fixtures/oss-postmark-receipt/` traces back to the documents
below. The machine-readable list is [`sources.json`](sources.json); `node fidelity/corpus/fetch-sources.mjs`
re-downloads every document into `fidelity/.cache/corpus/sources/` (gitignored) and verifies the sha256.
A fresh re-download on 2026-10-21 reproduced every hash (CONFIRMED).

**No source PDF is committed.** The BCB documents are official acts; the CAIXA manual says it "não
deve[...] ser objeto de reprodução ou disponibilização a terceiros" even though it is publicly
downloadable and marked `#PÚBLICO`; the MOC is an official NF-e publication. To stay clear of any
licence question the repository only cites URL, title, version, sha256 and section numbers.

Network posture: read-only GET requests with `User-Agent: vellora-fidelity-tooling` and no other
identifying header. Two hosts (CAIXA, NF-e portal) need a session cookie set by an ASP.NET redirect;
`fetch-sources.mjs` keeps a per-download cookie jar for that.

## Primary documents used

| ID | Document | Version | sha256 | Used for |
|---|---|---|---|---|
| BCB-2926 | BCB Carta-Circular nº 2.926 (24/07/2000), <https://www.bcb.gov.br/pre/normativos/c_circ/2000/pdf/c_circ_2926_v1_O.pdf> | as published (4 pp.) | `2bd983daccbb947b1bb6ddca7ba90eef4eb833bc40afe4eea6158b2b932c0a36` | Ficha de Compensação: 95–108 × 170–216 mm (03.a), position at the bottom of the sheet (05.b), bank code 5 mm characters (I), linha digitável 3.5–4 mm characters and 5-field layout (II), barcode "2 de 5 intercalado", 103 × 13 mm, 5 mm from the left edge (quiet zone), centre 12 mm above the ficha bottom (V), 44-position layout and DV geral mod 11 (Nota 1), "Ficha de Compensação" identification ≤ 2 mm (V) |
| BCB-3598 | BCB Circular nº 3.598 (06/06/2012) as amended by Circular 3.656/2013, <https://www.bcb.gov.br/pre/normativos/circ/2012/pdf/circ_3598_v2_l.pdf> | consolidated v2 (5 pp.) | `0b90d602cf83ac976829c62039d6ba4c8a417d1fd67d355735ec75c08e85fe8c` | Minimum boleto content (art. 4 § 2, I–V): pagador name, destinatária bank, beneficiário name + address + CPF/CNPJ, value and due date, discount conditions |
| BCB-2414 | BCB Carta-Circular nº 2.414 (07/10/1993), <https://www.bcb.gov.br/pre/normativos/c_circ/1993/pdf/c_circ_2414_v1_O.pdf> | as published (2 pp.) | `642696032dadf306054b4354a755b9c37a153b5baee83662ed41094a7315672d` | Context only: institutes the 44-position ficha de compensação (model CADOC 24044-4) |
| CAIXA | CAIXA "Especificações técnicas para emissão de boletos — Cobrança Bancária CAIXA – SIGCB", <https://www.caixa.gov.br/Downloads/cobranca-caixa/ESP_COD_BARRAS_SIGCB_COBRANCA_CAIXA.pdf> | 67.119 v014, OUT/2022, vigência 19/10/2022 (43 pp.) | `904f8594efae11b72a52b667a9f800c749d229dd2a8a38379f36663223b0d1d1` | Recibo do Pagador required fields (3.2); ficha fields (4.1.2 Modelo II, 4.2); campo livre layout (4.2.10.1.1); DV geral (Anexo I, worked example → DV 4); fator de vencimento incl. the **22/02/2025 restart at 1000** (Anexo II, both tables); campo livre DV (Anexo III → DV 1); nosso número DV (Anexo IV → DV 7); linha digitável + mod 10 (Anexo V, worked example `10490.05505 77222.133348 77777.777713 4 32420000032112`); beneficiário DV (Anexo VI → DV 7). All worked examples are test vectors in `test/check-digits.test.mjs` |
| BANPARA | Banpará "Manual de Procedimento de Impressão de Boletos por Terceiros — Cobrança Registrada", <https://www.banpara.b.br/PortalImagens/2tdgh54u/manual-de-procedimento-de-impressao-de-boletos-por-terceiros-cobranca-banpara-v1-2.pdf?mode=pad&rnd=133740022625430000> | Versão 1.2 (PDF 2023-05-15, 12 pp.) | `5b10dd0cfbc2121c3d723ec20ecb526843b23febcf6d98cea1e21f49ffc5a9c8` | Second bank confirming 103 × 13 mm, 5 mm quiet zone and "distância mínima ... 12 mm" (section 8), and that the 103 mm width is what bank readers are calibrated for |
| FEBRABAN-ARREC | FEBRABAN "Layout – Código de Barras", <https://cmsarquivos.febraban.org.br/Arquivos/documentos/PDF/Layout%20-%20C%C3%B3digo%20de%20Barras%20ATUALIZADO.pdf> | Versão 06 (from 01.11.2020; 23 pp.) | `a22b04c9cd047a6e71e0a73db6db57da41a76050344cc01626b736479430292b` | Context only — this is the **arrecadação** (utility/convênio) layout, not the boleto de cobrança; it confirms ITF and a ≥ 5 mm clear space after the stop pattern for that document family |
| MOC-AII | NF-e "Manual de Orientação do Contribuinte — Anexo II: Manual de Especificações Técnicas do DANFE e Código de Barras", <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=f+NhsSn3%2F5M%3D> | Versão 7.00 – Outubro de 2020 (28 pp.; PDF Title metadata wrongly says "Anexo III") | `729c04fd1374188c29eb21ca60342741b24a014003d4c2ff1bbb455bb1a6a60e` | CODE-128C (2), mod-103 check and the printed example 09758364 → DV 48 (2.1, 2.2), ≥ 6 cm total, ≥ 0.8 cm bar height, ≥ 0.02 cm module, 10-module clear margins (2); chave in 11 blocks of 4 (3.1.1); emitente content (3.1.3); non-suppressible product columns and item dividers (3.1.7); "frete por conta" codes and the printed example "0 – Remetente" (3.1.10); paper/margins 0.2–0.8 cm (3.6.1, 3.6.2); Times New Roman / Courier New and minimum font sizes (3.7.1–3.7.9; every glyph judged per category via `data-moc`); A-4 retrato field table (3.8.1, "sugestão"); variable fields / protocolo (3.9.1); "SEM VALOR FISCAL" in homologação (3); CODE-128C symbol table (Anexo III.01) |
| MOC-VG | NF-e "Manual de Orientação do Contribuinte — MOC 7.0 Visão Geral", <https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=LrBx7WT9PuA%3D> | MOC 7.0 (150 pp.) | `f664dcf94b77cabb32311620d85a7eb02cdf86adb2d4632ce178af2572dd2ad1` | Chave de acesso composition (Tabela 2-1, 2.2.6.1) and cDV mod 11 with the worked example → DV 5 (2.2.6.2) |

## Primary documents NOT obtained (reported, not silently skipped)

| Document | Why not | Consequence |
|---|---|---|
| Banco do Brasil "Especificações Técnicas para Confecção de Boleto de Pagamento" (`Doc5175Bloqueto.pdf`, `espeboletobb.pdf`) | HTTP 403 (bot protection) for our User-Agent; the TOTVS mirror answered with a Cloudflare challenge | BB-specific campo livre not modelled; the CAIXA SIGCB layout is used instead |
| ISO/IEC 16390:2007 (Interleaved 2 of 5 symbology) | Paywalled, not accessed | The ITF wide:narrow ratio range and quiet-zone minimum are **UNVERIFIED ASSUMPTIONS**; ACCEPTANCE.md relies on decodability by an independent decoder instead |
| GS1 General Specifications (ITF-14 parameters) | HTTP 403 | as above |
| AIM USS Interleaved 2-of-5 (mirror) | HTTP 522 | as above |

## How the boleto barcode geometry was chosen (DESIGN TARGET, with arithmetic)

BCB-2926 fixes the symbol at **103 mm** but no bank document obtained here gives the module width or
the wide:narrow ratio. For 44 digits ITF has 138 narrow + 89 wide elements (start 4N, 22 pairs ×
(6N + 4W), stop 2N + 1W — `lib/itf.mjs`, CONFIRMED by matching zxing-cpp's own ITF writer element
for element). With ratio 3, X = 103 / (138 + 89·3) = 103 / 405 = **0.2543 mm ≈ 0.01 in**, i.e. the
mandated length corresponds to a 10-mil module at 3:1 — HYPOTHESIS: this is how the 103 mm figure
was derived. `data.json` therefore uses X = 0.2543 mm, W = 0.7630 mm (lengths to 4 decimals; sum
103.0004 mm).

## Existing `fixtures/boleto` audit (CONFIRMED by `node fidelity/corpus/audit-existing-boleto.mjs`)

The pre-existing fixture is **not** a valid or scannable boleto (it is not owned by this corpus and
was not edited; the findings are reported here):

- The barcode is printed as **text** ("representação textual — não escaneável"), not as bars.
- Barcode `99991999900000123459990000012345670000004200` (44 digits): DV geral is **1**, the mod-11
  rule gives **5** → invalid.
- Linha digitável `99990.00001 23456.700001 00000.000420 1 99990000012345`: all three field DVs are
  wrong (printed 1/1/0, mod 10 gives 4/6/2), and rebuilding the barcode from it gives
  `99991999900000123450000023456700000000000042` — it does **not** match the printed barcode.
- Fator `9999` = 21/02/2025 (first cycle) or 13/10/2049 (second cycle) while the document prints a
  due date of 15/07/2026; the valor field `0000012345` = R$ 123,45 while the document prints R$ 1.842,50.
- Bank code `999-9` is not a real compensation code (acceptable for a synthetic fixture, but no
  bank-specific campo livre can be validated).
- The beneficiário address required by BCB-3598 art. 4 § 2 III (and Lei 12.039/2009 as cited by
  CAIXA 4.2.3.1) is missing.

## OSS templates (licence verified from the LICENSE file at a pinned commit)

| Fixture | Upstream | Commit | Upstream file sha256 | Licence (file sha256) |
|---|---|---|---|---|
| `oss-sparksuite-invoice` | <https://github.com/sparksuite/simple-html-invoice-template> `invoice.html` | `7d74fe34c862b7712f1a23a3f12147a4a8bd53e1` | `a7fe870a3e9bd20e6c3bacacdee648e93ef2976ec587d47b7c84b1b84b5f48bc` | MIT, © 2021 Sparksuite (`c8ad2d52…3b03`) |
| `oss-postmark-receipt` | <https://github.com/ActiveCampaign/postmark-templates> `templates/basic/receipt/content.html` | `fa73527acb4eb59cf673a54572d213e908f1515c` | `1f6a3f3168eafdcaefd3843a4dc3b6d24cc82e8f042fe59963a973bce1bdf50b` | MIT, © 2015 Wildbit (`a0f51a51…76d2`) |

Each fixture directory carries the verbatim `LICENSE` and a `NOTICE.md` with the adaptation diff
intent. Considered and excluded (details in `sources.json`): CourtBouillon/weasyprint-samples (no
LICENSE file; README "public domain" statement is not one of MIT/BSD/Apache/CC0), anvilco/html-pdf-invoice-template
(package.json says MIT but no LICENSE file), Invoice Ninja (Elastic-2.0) and Odoo (LGPL) per the
task rule. SolidInvoice (MIT, commit `3c2e57e08e37729e2135868120f00a74ff4cb9b9`) qualifies but was not
adapted in this run (Twig macros, external CSS and mPDF-only tags) — a known gap.

## Self-authored material

`fixtures/boleto-febraban`, `fixtures/danfe` and `fixtures/text-stress-ptbr` are written for this
repository from the documents above; all personal and company data in them is synthetic (CNPJ/CPF
numbers are generated with valid check digits from obviously fake bases, e.g. 11.222.333/0001-81 and
123.456.789-09). `fixtures/oss-sparksuite-invoice/assets/logo.png` is a neutral placeholder generated
by `make_placeholder_logo.py` (CC0).
