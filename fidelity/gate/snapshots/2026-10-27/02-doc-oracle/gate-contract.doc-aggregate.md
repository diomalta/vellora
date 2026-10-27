## Document aggregate vs the published engine (DOC-1..DOC-4)

Verdict FAIL; contract condition 2 FAIL, condition 3 FAIL; --main true, --contract true; tolerance median 0.01 mm, <=1 mm share 0.1 pp, missing 0.


| fixture | median mm pin → run | p90 mm pin → run | <=1 mm % pin → run | missing pin → run | pages run / Chrome | worse |
|---|---|---|---|---|---|---|
| invoice | 1.46 → 0.41 | 1.73 → 0.91 | 36 → 93.2 | 0 → 0 | 3 / 3 | - |
| receipt | 5.18 → 0.16 | 77 → 0.92 | 7.9 → 100 | 0 → 0 | 2 / 2 | - |
| boleto | 1.77 → 2.78 | 14.09 → 7.01 | 32 → 22.9 | 0 → 0 | 1 / 1 | medianMm, within1mmPct |
| notification | 0.41 → 0.2 | 1.02 → 1.72 | 86.7 → 63.7 | 4 → 0 | 1 / 1 | within1mmPct |
| boleto-febraban | 80.7 → 0.9 | 82.32 → 1.68 | 15.6 → 52.4 | 8 → 0 | 1 / 1 | - |
| danfe | 17.68 → 3.19 | 37.17 → 6.44 | 8.9 → 19 | 1 → 0 | 2 / 1 | - |
| text-stress-ptbr | 106.22 → 95.11 | 221.05 → 218.29 | 1.4 → 16.3 | 7 → 7 | 8 / 7 | - |
| oss-sparksuite-invoice | 9.87 → 0.61 | 10.95 → 0.62 | 0 → 100 | 0 → 0 | 1 / 1 | - |
| oss-postmark-receipt | 0.66 → 0.19 | 18.19 → 0.32 | 40 → 75 | 39 → 39 | 1 / 2 | - |

