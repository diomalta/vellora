import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VALID_BOLETO_BARCODE,
  corruptXref,
  invalidDvBarcode,
  mutateFirstWord,
} from "../lib/canaries.mjs";
import { validateBoletoBarcode } from "../lib/febraban.mjs";
import { ITF_DIGIT_PATTERNS, encodeItf, itfCanaryHtml } from "../lib/itf.mjs";
import { parseShowXref, xrefSanity } from "../lib/qpdf.mjs";
import { parseVeraJson } from "../lib/verapdf.mjs";

test("ITF encoding: start + 5 bars/5 spaces per digit pair + stop, 2 wide per digit", () => {
  for (const pattern of Object.values(ITF_DIGIT_PATTERNS)) {
    assert.equal([...pattern].filter((c) => c === "1").length, 2);
  }
  const elements = encodeItf(VALID_BOLETO_BARCODE);
  assert.equal(elements.length, 4 + 22 * 10 + 3);
  assert.deepEqual(
    elements.slice(0, 4).map((e) => e.wide),
    [false, false, false, false],
  );
  assert.throws(() => encodeItf("123"));
  assert.match(itfCanaryHtml("12", { narrow: 1, unit: "px" }), /width: 3\.0000px/);
});

test("qpdf --show-xref parsing and independent offset sanity", () => {
  const pdf = Buffer.from("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n2 0 obj\n<<>>\nendobj\n", "latin1");
  const entries = parseShowXref(
    "1/0: uncompressed; offset = 9\n2/0: uncompressed; offset = 29\n3/0: compressed; stream = 5, index = 0\n",
  );
  assert.equal(entries.length, 3);
  assert.deepEqual(xrefSanity(entries, pdf), []);
  const wrong = parseShowXref("1/0: uncompressed; offset = 12\n2/0: uncompressed; offset = 999\n");
  assert.equal(xrefSanity(wrong, pdf).length, 2);
});

test("veraPDF JSON report parsing keeps clause and test number of failed rules", () => {
  const report = {
    report: {
      buildInformation: { releaseDetails: [{ id: "apps", version: "1.30.3" }] },
      jobs: [
        {
          validationResult: [
            {
              profileName: "PDF/A-2b validation profile",
              statement: "PDF file is not compliant with Validation Profile requirements.",
              compliant: false,
              details: {
                passedRules: 141,
                failedRules: 1,
                passedChecks: 10,
                failedChecks: 1,
                ruleSummaries: [
                  {
                    ruleStatus: "FAILED",
                    specification: "ISO 19005-2:2011",
                    clause: "6.6.4",
                    testNumber: 1,
                    failedChecks: 1,
                    description: "XMP metadata",
                    object: "PDDocument",
                    checks: [{ context: "root", errorMessage: "missing" }],
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  };
  const parsed = parseVeraJson(JSON.stringify(report));
  assert.equal(parsed.compliant, false);
  assert.deepEqual(
    parsed.rules.map((r) => `${r.clause}-${r.testNumber}`),
    ["6.6.4-1"],
  );
  assert.equal(parseVeraJson({ report: { jobs: [{}] } }).parsed, false);
});

test("canary builders really break what they claim to break", () => {
  const pdf = Buffer.from("%PDF-1.7\n...\nstartxref\n1234\n%%EOF\n", "latin1");
  assert.match(corruptXref(pdf).toString("latin1"), /startxref\n1251\n/);
  const bad = invalidDvBarcode();
  assert.equal(validateBoletoBarcode(bad).valid, false);
  assert.equal(bad.length, 44);
  const mutation = mutateFirstWord(
    "<html><head><title>Título</title></head><body><!-- Comentário --><p>Recibo do Pagador</p></body></html>",
  );
  assert.equal(mutation.replaced, "Recibo");
  assert.match(mutation.html, /<p>VELLORACANARY do Pagador<\/p>/);
  assert.match(mutation.html, /<title>Título<\/title>/);
});
