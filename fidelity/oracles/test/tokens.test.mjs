import assert from "node:assert/strict";
import { test } from "node:test";
import {
  absorbSplits,
  againstControl,
  compareTokens,
  copyPasteCheck,
  normalizeText,
  tokenize,
} from "../lib/tokens.mjs";

test("normalizeText: NFC, NBSP/U+202F/form feed collapse, soft hyphen dropped, no NFKC", () => {
  assert.equal(normalizeText("a\u00A0b\u202Fc\fd  e\u00ADf"), "a b c d ef");
  assert.equal(normalizeText("ac\u0327a\u0303o"), "ação");
  assert.equal(normalizeText("\uFB01m"), "\uFB01m", "ligature must survive normalization");
});

test("identical sequences align fully", () => {
  const tokens = tokenize("Recibo do Pagador R$ 1.842,50");
  const result = compareTokens(tokens, [...tokens]);
  assert.equal(result.inOrder, tokens.length);
  assert.equal(result.orderedRecall, 1);
  assert.deepEqual([result.missing, result.extra, result.reordered], [[], [], []]);
});

test("missing, extra and reordered tokens are told apart", () => {
  const expected = tokenize("alpha beta gamma delta epsilon");
  const actual = tokenize("alpha gamma beta delta zeta");
  const result = compareTokens(expected, actual);
  assert.deepEqual(result.missing, ["epsilon"]);
  assert.deepEqual(result.extra, ["zeta"]);
  assert.deepEqual(result.reordered, ["beta"]);
});

test("letter-spaced digits and wrapped hyphenated words are boundary-only, not loss", () => {
  const expected = tokenize("Código 99991999 fim FAKE-AUTH-0000-XXXX-TESTE. Página 1");
  const actual = tokenize("Código 9 9 9 9 1 9 9 9 fim FAKE-AUTH-0000- XXXX-TESTE. Extra");
  const result = compareTokens(expected, actual);
  assert.equal(result.boundaryOnlyGroups, 2, JSON.stringify(result.boundaryOnly));
  assert.ok(result.missing.includes("Página"));
  assert.ok(result.extra.includes("Extra"));
  assert.ok(!result.missing.includes("99991999"));
});

test("absorbSplits finds merges in both directions", () => {
  const out = absorbSplits(["R$", "1,00", "abc"], ["R$1,00", "a", "bc"]);
  assert.equal(out.groups.length, 2);
  assert.deepEqual(out.restExpected, []);
  assert.deepEqual(out.restActual, []);
});

test("againstControl separates subject-only defects from extractor artifacts", () => {
  const expected = tokenize("one two three four");
  const control = compareTokens(expected, tokenize("one two three four Página 1"));
  const subject = compareTokens(expected, tokenize("one three four Página 1"));
  const split = againstControl(subject, control);
  assert.deepEqual(split.missing.subjectOnly, ["two"]);
  assert.deepEqual(split.extra.explained.sort(), ["1", "Página"]);
});

test("copy-paste check passes clean text and fails each defect class", () => {
  const expected = tokenize("Ficha financeira: conclusão da ação");
  assert.equal(copyPasteCheck("Ficha financeira: conclusão da ação", expected).pass, true);
  const ligature = copyPasteCheck("Ficha \uFB01nanceira: conclusão da ação", expected);
  assert.equal(ligature.pass, false);
  assert.equal(ligature.ligatureCodepoints.count, 1);
  assert.deepEqual(ligature.ligatureWords.missing, ["financeira:"]);
  const nfd = copyPasteCheck("Ficha financeira: conclusa\u0303o da ac\u0327a\u0303o", expected);
  assert.equal(nfd.pass, false);
  assert.equal(nfd.combiningMarks.count, 3);
  const dropped = copyPasteCheck("Ficha financeira: conclusao da acao", expected);
  assert.equal(dropped.pass, false);
  assert.deepEqual(dropped.diacriticWords.missing.sort(), ["ação", "conclusão"]);
  assert.equal(copyPasteCheck("Ficha \uFFFD", expected).replacementChars.count, 1);
});
