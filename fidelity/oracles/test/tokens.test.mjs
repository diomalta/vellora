import assert from "node:assert/strict";
import { test } from "node:test";
import {
  absorbSplits,
  compareTokens,
  copyPasteCheck,
  countOccurrences,
  foldLigatures,
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

test("foldLigatures expands presentation forms only; countOccurrences is non-overlapping", () => {
  const fi = String.fromCodePoint(0xfb01);
  const ffl = String.fromCodePoint(0xfb04);
  assert.equal(foldLigatures(`${fi}nanceira a${ffl}uent`), "financeira affluent");
  assert.equal(foldLigatures("ação"), "ação");
  assert.equal(countOccurrences(" aaa ", "aa"), 1);
  assert.equal(countOccurrences(" ação, ação ", "ação"), 2);
  assert.equal(countOccurrences("x", ""), 0);
});

test("copy-paste check passes clean text and fails each defect class", () => {
  const expectedTokens = tokenize("Ficha financeira: conclusão da ação");
  const check = (raw) =>
    copyPasteCheck(raw, {
      expectedTokens,
      subjectBodyTokens: tokenize(raw),
      referenceBodyTokens: expectedTokens,
    });
  assert.equal(check("Ficha financeira: conclusão da ação").pass, true);
  const ligature = check(`Ficha ${String.fromCodePoint(0xfb01)}nanceira: conclusão da ação`);
  assert.equal(ligature.pass, false);
  assert.equal(ligature.ligatureCodepoints.count, 1);
  assert.deepEqual(ligature.ligatureWords.deficits, [], "folded: reported once, as a code point");
  const nfd = check("Ficha financeira: conclusa\u0303o da ac\u0327a\u0303o");
  assert.equal(nfd.pass, false);
  assert.equal(nfd.combiningMarks.count, 3);
  const dropped = check("Ficha financeira: conclusao da acao");
  assert.equal(dropped.pass, false);
  assert.deepEqual(dropped.diacriticWords.deficits.map((d) => d.word).sort(), [
    "ação",
    "conclusão",
  ]);
  const letter = check("Ficha fnanceira: conclusão da ação");
  assert.deepEqual(letter.ligatureWords.deficits, [
    { word: "financeira:", reference: 1, subject: 0 },
  ]);
  assert.equal(check("Ficha \uFFFD").replacementChars.count, 1);
});
