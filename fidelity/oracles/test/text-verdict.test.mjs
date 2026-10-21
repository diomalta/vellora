// Regression tests for the text-oracle verdict (validator findings of 2026-10-21):
// - a deleted body word must fail even when the same token also lives in an @page footer
//   ("de" of "Página 1 de 3") or elsewhere out of reading order ("R$");
// - margin-box runs are removed by POSITION, from every @page block of the HTML;
// - copy-paste words are counted, and a control's ligature code point never excuses a
//   subject's dropped letter.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  decodeCssString,
  marginBoxTemplates,
  parseContentValue,
  splitPages,
  stripMarginBoxes,
} from "../lib/margin-boxes.mjs";
import { REPO_ROOT } from "../lib/paths.mjs";
import { aggregateStatus, scoreExtraction } from "../lib/text.mjs";
import { tokenize } from "../lib/tokens.mjs";

const FOOTER_HTML = `<html><head><style>
  @page { size: A4; margin: 16mm; @bottom-center { content: "Página " counter(page) " de " counter(pages); } }
</style></head><body></body></html>`;
const templates = marginBoxTemplates(FOOTER_HTML);
const LIG = String.fromCodePoint(0xfb01);

/** Extractor-style text: every page followed by a form feed. */
const pdfText = (...pages) => pages.map((p) => `${p}\n\f`).join("");

function score({ subject, control, expected, html = FOOTER_HTML }) {
  return scoreExtraction({
    subjectText: subject,
    controlText: control,
    expectedTokens: tokenize(expected),
    templates: marginBoxTemplates(html),
  });
}

test("template parser: the four fixtures declare one removable bottom-center footer", () => {
  for (const id of ["invoice", "receipt", "boleto", "notification"]) {
    const html = readFileSync(join(REPO_ROOT, "fixtures", id, "index.html"), "utf8");
    const found = marginBoxTemplates(html);
    assert.equal(found.length, 1, `${id}: ${JSON.stringify(found)}`);
    assert.equal(found[0].position, "bottom-center");
    assert.equal(found[0].literal, "Página {page} de {pages}");
    assert.equal(found[0].removable, true);
  }
});

test("template parser: second @page block, escapes, none, unsupported parts", () => {
  const html = `<style>
    /* @page { @top-left { content: "commented out"; } } */
    @page { size: A4; margin: 16mm; }
    @page :first { @top-right { content: "P\\e1 gina " counter(page); } }
    @page { @bottom-left { content: none; } @bottom-right { content: counter(page) "/" counter(pages); } }
    @page { @top-center { content: "Doc " attr(title); } @left-middle { content: counter(page, upper-roman) " x"; } }
  </style>`;
  const found = marginBoxTemplates(html);
  const byPosition = Object.fromEntries(found.map((t) => [t.position, t]));
  assert.deepEqual(Object.keys(byPosition).sort(), [
    "bottom-right",
    "left-middle",
    "top-center",
    "top-right",
  ]);
  assert.equal(byPosition["top-right"].literal, "Página {page}");
  assert.equal(byPosition["top-right"].pageSelector, ":first");
  assert.equal(byPosition["top-right"].removable, true);
  assert.equal(byPosition["bottom-right"].removable, false, "counters only: identity-ambiguous");
  assert.equal(byPosition["top-center"].removable, false, "attr() is not understood");
  assert.equal(byPosition["left-middle"].removable, false, "non-decimal counter style");
  assert.equal(decodeCssString('P\\E1gina \\"x\\"'), 'Página "x"');
  assert.deepEqual(parseContentValue(' "a" counter(pages) !important'), [
    { text: "a" },
    { counter: "pages" },
  ]);
});

test("splitPages drops exactly one trailing form feed", () => {
  assert.deepEqual(splitPages("a\fb\f"), ["a", "b"]);
  assert.deepEqual(splitPages("a\f\f"), ["a", ""]);
  assert.deepEqual(splitPages("a"), ["a"]);
});

test("margin-box runs are removed by position on their own page, body tokens stay", () => {
  const text = pdfText("de um lado Página 1 de 2 de outro", "Página 2 de 2 resto de tudo");
  const stripped = stripMarginBoxes(text, templates);
  assert.equal(stripped.pages, 2);
  assert.deepEqual(stripped.bodyTokens, tokenize("de um lado de outro resto de tudo"));
  assert.deepEqual(
    stripped.runs.map((r) => r.text),
    ["Página 1 de 2", "Página 2 de 2"],
  );
  // A run with the wrong counters (page 1 of 1 printed on a 2-page PDF) is NOT removed.
  const wrong = stripMarginBoxes(pdfText("x Página 1 de 1", "y Página 1 de 1"), templates);
  assert.equal(wrong.runs.length, 0);
  // text-transform: uppercase on the margin box still matches.
  assert.equal(stripMarginBoxes(pdfText("PÁGINA 1 DE 1"), templates).runs.length, 1);
});

test("(a) body 'de' deleted, footer present in both: fail with exactly 'de' missing", () => {
  const r = score({
    subject: pdfText("Suporte fixação Página 1 de 1"),
    control: pdfText("Suporte de fixação Página 1 de 1"),
    expected: "Suporte de fixação",
  });
  assert.equal(r.status, "fail");
  assert.deepEqual(r.subjectOnly.missing, ["de"]);
  assert.deepEqual(r.marginBoxes.absent, []);
});

test("(b) body 'de' deleted AND footer absent: fail on 'de' plus marginBox absent", () => {
  const r = score({
    subject: pdfText("Suporte fixação"),
    control: pdfText("Suporte de fixação Página 1 de 1"),
    expected: "Suporte de fixação",
  });
  assert.equal(r.status, "fail");
  assert.deepEqual(r.subjectOnly.missing, ["de"]);
  assert.equal(r.marginBoxes.absent.length, 1);
  assert.equal(r.marginBoxes.absent[0].missingRuns, 1);
});

test("(c) footer absent, body intact: warn only (generated text, not body loss)", () => {
  const r = score({
    subject: pdfText("Suporte de fixação"),
    control: pdfText("Suporte de fixação Página 1 de 1"),
    expected: "Suporte de fixação",
  });
  assert.equal(r.status, "warn");
  assert.deepEqual(r.subjectOnly.missing, []);
  assert.equal(r.marginBoxes.absent.length, 1);
});

test("(d) 'R$' deleted while other 'R$' tokens are out of reading order: fail", () => {
  // Both PDFs put the price column after the descriptions (reading-order artifact).
  const r = score({
    subject: pdfText("Parafuso Arruela Porca 32,50 R$ 18,90 R$ 9,75"),
    control: pdfText("Parafuso Arruela Porca R$ 32,50 R$ 18,90 R$ 9,75"),
    expected: "Parafuso R$ 32,50 Arruela R$ 18,90 Porca R$ 9,75",
  });
  assert.equal(r.status, "fail");
  assert.deepEqual(r.subjectOnly.missing, ["R$"]);
});

test("identical subject and control pass even when both differ from innerText", () => {
  const text = pdfText("ITEM QTD. Parafuso 40 Página 1 de 2", "ITEM QTD. Arruela 25 Página 2 de 2");
  const r = score({ subject: text, control: text, expected: "ITEM QTD. Parafuso 40 Arruela 25" });
  assert.equal(r.status, "pass", JSON.stringify(r.subjectOnly));
  assert.equal(r.marginBoxes.perTemplate[0].controlRuns, 2);
});

test("without a control, innerText is the reference and the subject's footer is removed", () => {
  const r = score({
    subject: pdfText("Suporte de fixação Página 1 de 1"),
    control: null,
    expected: "Suporte de fixação",
  });
  assert.equal(r.reference, "innerText");
  assert.equal(r.status, "pass", JSON.stringify(r.subjectOnly));
  const lost = score({
    subject: pdfText("Suporte fixação Página 1 de 1"),
    control: null,
    expected: "Suporte de fixação",
  });
  assert.equal(lost.status, "fail");
  assert.deepEqual(lost.subjectOnly.missing, ["de"]);
});

test("real ligature loss: control U+FB01, subject drops the letter -> fail, copy-paste fail", () => {
  const r = score({
    subject: pdfText("Ficha fnanceira: fm do perfl"),
    control: pdfText(`Ficha ${LIG}nanceira: ${LIG}m do per${LIG}l`),
    expected: "Ficha financeira: fim do perfil",
  });
  assert.equal(r.status, "fail");
  assert.equal(r.copyPaste.pass, false);
  assert.deepEqual(r.copyPaste.subject.ligatureWords.deficits.map((d) => d.word).sort(), [
    "fim",
    "financeira:",
    "perfil",
  ]);
  assert.deepEqual(r.subjectOnly.missing.sort(), ["fim", "financeira:", "perfil"]);
});

test("control U+FB01 vs subject plain letters is NOT a subject defect", () => {
  const r = score({
    subject: pdfText("Ficha financeira: fim do perfil"),
    control: pdfText(`Ficha ${LIG}nanceira: ${LIG}m do per${LIG}l`),
    expected: "Ficha financeira: fim do perfil",
  });
  assert.equal(r.status, "pass", JSON.stringify(r.subjectOnly));
  assert.equal(r.copyPaste.pass, true);
  assert.equal(r.copyPaste.control.codepointDefects, 3, "the control's own defect is reported");
});

test("subject U+FB01 is a copy-paste code-point failure, not a token loss", () => {
  const r = score({
    subject: pdfText(`Ficha ${LIG}nanceira`),
    control: pdfText("Ficha financeira"),
    expected: "Ficha financeira",
  });
  assert.equal(r.status, "fail");
  assert.deepEqual(r.subjectOnly.missing, []);
  assert.equal(r.copyPaste.subject.ligatureCodepoints.count, 1);
});

test("one dropped diacritic among four repeated words is caught by count", () => {
  const sentence = "conclusão da ação.";
  const control = pdfText([sentence, sentence, sentence, sentence].join(" "));
  const subject = pdfText([sentence, sentence, "conclusão da acao.", sentence].join(" "));
  const r = score({
    subject,
    control,
    expected: [sentence, sentence, sentence, sentence].join(" "),
  });
  assert.equal(r.status, "fail");
  assert.equal(r.copyPaste.pass, false);
  assert.deepEqual(r.copyPaste.subject.diacriticWords.deficits, [
    { word: "ação.", reference: 4, subject: 3 },
  ]);
});

test("aggregateStatus is worst-first and ignores not-run", () => {
  assert.equal(aggregateStatus(["pass", "warn", "not-run"]), "warn");
  assert.equal(aggregateStatus(["pass", "fail", "warn"]), "fail");
  assert.equal(aggregateStatus(["not-run", "not-run"]), "not-run");
  assert.equal(aggregateStatus(["pass"]), "pass");
});
