import assert from "node:assert/strict";
import { test } from "node:test";
import { matchTriples, scoreConsensus } from "../lib/consensus.mjs";

const word = (text, x, baseline, page = 1) => ({ text, x, baseline, page, x1: x + 10 });
const line = (y, dx = 0, page = 1) => [
  word("Total", 40 + dx, y, page),
  word("R$", 300 + dx, y, page),
  word("1.842,50", 320 + dx, y, page),
];

test("identical references and subject => full consensus, zero error", () => {
  const words = [...line(100), ...line(120)];
  const result = scoreConsensus({ chrome: words, weasyprint: words, subject: words });
  assert.equal(result.primary.coverage, 1);
  assert.equal(result.primary.subjectError.maxDistance, 0);
  assert.equal(result.primary.subjectWithinTol, 1);
});

test("a subject shifted by +3pt is scored against the consensus", () => {
  const reference = [...line(100), ...line(120)];
  const subject = [...line(100, 3), ...line(120, 3)];
  const result = scoreConsensus({ chrome: reference, weasyprint: reference, subject });
  assert.equal(result.primary.subjectError.medianDx, 3);
  assert.equal(result.primary.subjectWithinTol, 0);
  assert.equal(result.primary.perAxis.x.subjectError.medianDx, 3);
});

test("words where Chrome and WeasyPrint disagree beyond tol are disputed, not scored", () => {
  const chrome = [...line(100), word("Nota", 40, 200)];
  const weasy = [...line(100), word("Nota", 40, 205)];
  const subject = [...line(100), word("Nota", 90, 300)];
  const result = scoreConsensus({ chrome, weasyprint: weasy, subject });
  assert.equal(result.primary.disputed, 1);
  assert.equal(result.primary.consensus, 3);
  assert.equal(result.primary.subjectError.maxDistance, 0, "disputed word must not be scored");
  assert.equal(result.disputedExamples[0].text, "Nota");
  const loose = result.tolerances.find((t) => t.tol === 4);
  assert.equal(loose.disputed, 1);
});

test("count mismatches go to explicit buckets instead of forced matches", () => {
  const chrome = [word("de", 10, 10), word("de", 50, 10), word("Página", 10, 800)];
  const weasy = [word("de", 10, 10), word("de", 50, 10), word("Página", 10, 800)];
  const subject = [word("de", 10, 10)];
  const out = matchTriples(chrome, weasy, subject);
  assert.equal(out.triples.length, 0);
  assert.deepEqual(
    out.subjectCountMismatch.map((m) => m.text),
    ["Página", "de"],
  );
});

test("a word on a different page is a page mismatch, not a huge dy", () => {
  const reference = [word("Este", 40, 100, 2)];
  const subject = [word("Este", 40, 100, 3)];
  const result = scoreConsensus({ chrome: reference, weasyprint: reference, subject });
  assert.equal(result.buckets.pageMismatch, 1);
  assert.equal(result.primary.matchedWords, 0);
});
