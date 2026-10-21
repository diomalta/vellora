# WPT reftests — vellora blitz-0.3.0-beta.4

- date: Wed Oct 21 05:48:09 UTC 2026
- engine: blitz-0.3.0-beta.4 (blitz-dom 0.3.0-beta.4), krilla 0.8.2
- vellora: dc535e7f9e0a3291a539b3c8597ee03472ad1aaa (fidelity/baseline-beta4), WPT: 9d8aceec0ddc7ffe46d8f5f3f42d27a0163d6cba
- node v22.23.2, rustc 1.96.0 (ac68faa20 2026-05-25), raster: pdftocairo (pdftocairo version 26.06.0) @ 96 DPI, antialias true
- OS: {"productVersion":"27.0.1","buildVersion":"26A434","cpu":"Apple M5 Pro"}, 18 CPUs
- WPT pin: exact (HEAD = WPT_COMMIT, clean tree)

| suite | reftests | pass | pass (clean) | pass-blank | fail | unsup | error | timeout | skip | pass % | pass % of evaluated | clean pass % | chrome pass % |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| css/CSS2/normal-flow | 789 | 392 | 368 | 6 | 317 | 73 | 0 | 0 | 1 | 49.68 | 54.83 | 46.64 | 99.24 |
| css/CSS2/margin-padding-clear | 682 | 409 | 396 | 0 | 272 | 1 | 0 | 0 | 0 | 59.97 | 60.06 | 58.06 | 99.12 |
| css/CSS2/box | 9 | 4 | 0 | 0 | 5 | 0 | 0 | 0 | 0 | 44.44 | 44.44 | 0 | 100 |
| css/CSS2/box-display | 120 | 47 | 47 | 1 | 37 | 35 | 0 | 0 | 0 | 39.17 | 55.29 | 39.17 | 93.33 |
| css/CSS2/visudet | 38 | 10 | 7 | 0 | 27 | 1 | 0 | 0 | 0 | 26.32 | 27.03 | 18.42 | 65.79 |
| css/CSS2/visuren | 39 | 1 | 1 | 0 | 30 | 8 | 0 | 0 | 0 | 2.56 | 3.23 | 2.56 | 94.87 |
| css/CSS2/linebox | 191 | 45 | 33 | 2 | 141 | 3 | 0 | 0 | 0 | 23.56 | 23.94 | 17.28 | 97.91 |
| css/CSS2/text | 410 | 223 | 215 | 6 | 159 | 22 | 0 | 0 | 0 | 54.39 | 57.47 | 52.44 | 81.22 |
| css/CSS2/fonts | 160 | 120 | 120 | 0 | 39 | 1 | 0 | 0 | 0 | 75 | 75.47 | 75 | 89.38 |
| css/CSS2/tables | 372 | 19 | 17 | 0 | 231 | 122 | 0 | 0 | 0 | 5.11 | 7.6 | 4.57 | 89.25 |
| css/CSS2/borders | 506 | 332 | 302 | 0 | 172 | 2 | 0 | 0 | 0 | 65.61 | 65.87 | 59.68 | 100 |
| css/CSS2/backgrounds | 336 | 152 | 67 | 2 | 179 | 3 | 0 | 0 | 0 | 45.24 | 45.65 | 19.94 | 86.31 |
| css/CSS2/colors | 19 | 6 | 6 | 0 | 13 | 0 | 0 | 0 | 0 | 31.58 | 31.58 | 31.58 | 52.63 |
| css/CSS2/lists | 156 | 67 | 40 | 0 | 88 | 1 | 0 | 0 | 0 | 42.95 | 43.23 | 25.64 | 99.36 |
| css/CSS2/generated-content | 226 | 41 | 38 | 0 | 159 | 26 | 0 | 0 | 0 | 18.14 | 20.5 | 16.81 | 87.61 |
| css/CSS2/floats | 111 | 20 | 18 | 0 | 82 | 9 | 0 | 0 | 0 | 18.02 | 19.61 | 16.22 | 84.68 |
| css/CSS2/floats-clear | 214 | 25 | 22 | 0 | 182 | 7 | 0 | 0 | 0 | 11.68 | 12.08 | 10.28 | 97.66 |
| css/CSS2/positioning | 520 | 175 | 173 | 0 | 323 | 22 | 0 | 0 | 0 | 33.65 | 35.14 | 33.27 | 98.85 |
| css/CSS2/abspos | 29 | 0 | 0 | 0 | 25 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 89.66 |
| css/CSS2/visufx | 53 | 1 | 1 | 1 | 47 | 4 | 0 | 0 | 0 | 1.89 | 2.04 | 1.89 | 100 |
| css/CSS2/pagination | 43 | 19 | 17 | 0 | 24 | 0 | 0 | 0 | 0 | 44.19 | 44.19 | 39.53 | 90.7 |
| css/css-tables | 171 | 36 | 27 | 3 | 95 | 37 | 0 | 0 | 0 | 21.05 | 26.87 | 15.79 | 91.23 |
| css/css-break | 1121 | 101 | 73 | 1 | 722 | 297 | 0 | 0 | 0 | 9.01 | 12.26 | 6.51 | 88.67 |
| css/css-page | 224 | 63 | 47 | 5 | 100 | 56 | 0 | 0 | 0 | 28.13 | 37.5 | 20.98 | 83.48 |
| css/css-text | 1508 | 421 | 178 | 10 | 944 | 133 | 0 | 0 | 0 | 27.92 | 30.62 | 11.8 | 78.98 |
| **total** | 8047 | 2729 | 2213 | 37 | 4413 | 867 | 0 | 0 | 1 | 33.91 | 38.01 | 27.5 | 90.21 |

`pass-blank` (test rendering pure white, reference not empty by construction) is not a pass and
is excluded from every pass rate; `pass (clean)` = passes with no suspect flag; pass % of
evaluated = pass / (pass + pass-blank + fail).

## Suspect-flagged passes (a pass that may not show what the test asserts)

- css-url-resource: 128
- img-without-dims: 27
- ink-displaced-vs-chrome: 90
- ink-missing-vs-chrome: 209
- missing-resource: 37
- uncovered-glyphs: 164
- webfont-not-supplied: 43

## Ink check of vellora passes against Chrome's test rendering (HYPOTHESIS-grade)

- passes checked: 2729 (without data: 0)
- share of Chrome's significant ink missing in vellora: {"<0.1":2283,"0.1-0.3":179,"0.3-0.5":58,"0.5-0.8":40,">=0.8":169}
- flagged ink-missing-vs-chrome (>= 0.5): 209; ink-displaced-vs-chrome (bbox shift > 100 px): 90
- ink bounding-box shift (px): {"<=8":38,"9-32":2137,"33-100":284,">100":264,"no-ink":6}
- pass-blank: {"checked":37,"chromeDrawsSignificantInk":31,"chromeAlsoBlank":3}

## vellora × Chrome (print oracle)

| suite | vellora-only fail | both fail | vellora pass, Chrome fail | both pass | vellora pass-blank |
| --- | --- | --- | --- | --- | --- |
| css/CSS2/normal-flow | 315 | 2 | 1 | 391 | 6 |
| css/CSS2/margin-padding-clear | 267 | 5 | 1 | 408 | 0 |
| css/CSS2/box | 5 | 0 | 0 | 4 | 0 |
| css/CSS2/box-display | 30 | 7 | 0 | 47 | 1 |
| css/CSS2/visudet | 14 | 13 | 0 | 10 | 0 |
| css/CSS2/visuren | 28 | 2 | 0 | 1 | 0 |
| css/CSS2/linebox | 138 | 3 | 1 | 44 | 2 |
| css/CSS2/text | 91 | 68 | 4 | 219 | 6 |
| css/CSS2/fonts | 23 | 16 | 0 | 120 | 0 |
| css/CSS2/tables | 205 | 26 | 1 | 18 | 0 |
| css/CSS2/borders | 172 | 0 | 0 | 332 | 0 |
| css/CSS2/backgrounds | 134 | 45 | 1 | 151 | 2 |
| css/CSS2/colors | 4 | 9 | 0 | 6 | 0 |
| css/CSS2/lists | 88 | 0 | 0 | 67 | 0 |
| css/CSS2/generated-content | 137 | 22 | 6 | 35 | 0 |
| css/CSS2/floats | 67 | 15 | 2 | 18 | 0 |
| css/CSS2/floats-clear | 177 | 5 | 0 | 25 | 0 |
| css/CSS2/positioning | 319 | 4 | 2 | 173 | 0 |
| css/CSS2/abspos | 23 | 2 | 0 | 0 | 0 |
| css/CSS2/visufx | 47 | 0 | 0 | 1 | 1 |
| css/CSS2/pagination | 21 | 3 | 1 | 18 | 0 |
| css/css-tables | 91 | 4 | 1 | 35 | 3 |
| css/css-break | 696 | 24 | 3 | 98 | 1 |
| css/css-page | 87 | 13 | 4 | 59 | 5 |
| css/css-text | 712 | 232 | 55 | 366 | 10 |
| **total** | 3891 | 520 | 83 | 2646 | 37 |

## Preparation flags × outcome (attribution aid)

- xhtmlHazard: {"fail":371,"pass":72}
- imgWithoutDimAttrs: {"pass":27,"fail":84}
- fontAliasMismatch: {"fail":3,"pass":7}
- skippedFonts: {"fail":242,"pass":43,"pass-blank":4}
- missingResources: {"pass":37,"fail":8}
- inlinedStylesheets: {"fail":935,"pass":625,"unsupported":1}
- mergedAuthorPage: {"fail":105,"pass":69,"pass-blank":6,"unsupported":11}
- uncoveredCodepoints: {"fail":273,"pass":164,"pass-blank":2}
- cssUrlResources: {"fail":201,"pass":128}

## Unsupported features (strict gate; node that was rejected)

- element:script (test): 462
- css:grid (test): 218
- css:transform (test): 47
- element:iframe (test): 34
- css:page-margin-box (test): 29
- element:textarea (test): 26
- element:canvas (test): 12
- css:grid (ref): 11
- css:filter (test): 8
- element:form (test): 7
- element:object (test): 7
- element:input (test): 2
- element:video (test): 2
- css:transform (ref): 1
- element:script (ref): 1

## Errors by kind


## Skipped reftests by reason

- needs-wptserve-substitution: 1

## Not run (not reftests)

- testharness: 629
- css-manual: 415
- manual: 2
- visual: 1913
- crashtest: 239
