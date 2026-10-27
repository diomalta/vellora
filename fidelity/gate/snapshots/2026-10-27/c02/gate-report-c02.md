# Fidelity gate report

**Verdict: FAIL** (127 gating item(s) vs the previous link, 88 vs the chain head fidelity/baselines/port/00-start; 17 flagged WPT pass(es) lost, reported, not gating; 677 value(s) worse within tolerance, listed, not gating; pin view: merge to main BLOCKED, 193 (c) item(s)). Local macOS runs are INDICATIVE.

| field | value |
|---|---|
| date | 2026-10-27T23:26:50.206Z |
| command | `node fidelity/gate/run.mjs --baseline fidelity/baselines/port/10-integration --run fidelity/results/run-all/c02 --head fidelity/baselines/port/00-start --pin fidelity/baselines/pin --layout-from fidelity/results/run-all/c02 --debt fidelity/baselines/port/DEBT.json --step 11-collapse-comp --out <scratch>/regate` |
| baseline | fidelity/baselines/port/10-integration (vellora-fidelity/baseline/2) |
| run | fidelity/results/run-all/c02 (vellora-fidelity/run-all/1) |
| os / cpu | darwin 27.0.0 arm64 (macOS 27.0.1) / Apple M5 Pro |
| node / rustc | v22.23.2 / rustc 1.96.0 (ac68faa20 2026-05-25) |
| chrome | Google Chrome for Testing 155.0.8059.85 |
| blitz | 0.3.0-beta.4 registry+https://github.com/rust-lang/crates.io-index |
| git | phasec/02-collapse-comp 6c0e2e3ec99d9676d7b67de85b5537f76baa55e8 (0 dirty) |

Counts: improvement 1911, newly-measured 1123, reported 17, within-tolerance 677, regression 127, gating 127, headGating 88, debt 180, flaggedPassLost 17, unchanged 12453, withinTolerance 677, withinToleranceBetter 680, missingTokensNotComparable 0, pinA 0, pinB 93, pinC 193.

## Absolute failures of the run (gate, cannot be accepted)

none

## Regressions beyond tolerance (gate)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#26\|dy` | -1.15 | 1.85 | 1 pdf-probe-pt | "de" dy -1.15 -> 1.85 pt: moved 3 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Lançamentos#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "Lançamentos" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#2\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|2026#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "2026" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#2\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | "—" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#5\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | "de" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Compra#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "Compra" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|no#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "no" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|débito#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "débito" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Padaria#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "Padaria" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Pão#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "Pão" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#7\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "de" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Açúcar#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "Açúcar" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|&#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "&" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Cia.#3\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "Cia." dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#8\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | "de" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Saque#3\|dy` | -11.65 | 1.1 | 1 pdf-probe-pt | "Saque" dy -11.65 -> 1.1 pt: moved 12.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|em#5\|dy` | -11.65 | 1.1 | 1 pdf-probe-pt | "em" dy -11.65 -> 1.1 pt: moved 12.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|terminal#3\|dy` | -11.65 | 1.1 | 1 pdf-probe-pt | "terminal" dy -11.65 -> 1.1 pt: moved 12.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#15\|dy` | -11.65 | 1.1 | 1 pdf-probe-pt | "de" dy -11.65 -> 1.1 pt: moved 12.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|autoatendimento#3\|dy` | -11.65 | 1.1 | 1 pdf-probe-pt | "autoatendimento" dy -11.65 -> 1.1 pt: moved 12.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#17\|dy` | -10.15 | 1.85 | 1 pdf-probe-pt | "de" dy -10.15 -> 1.85 pt: moved 12 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#18\|dy` | -1.9 | 1.85 | 1 pdf-probe-pt | "de" dy -1.9 -> 1.85 pt: moved 3.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|PIX#3\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "PIX" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|recebido#3\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "recebido" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#10\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "—" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|João#3\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "João" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Ninguém#3\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "Ninguém" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|da#3\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "da" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Silva#3\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | "Silva" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Compra#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "Compra" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|no#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "no" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|débito#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "débito" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#11\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "—" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Padaria#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "Padaria" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Pão#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "Pão" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#21\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "de" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Açúcar#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "Açúcar" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|&#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "&" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Cia.#4\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | "Cia." dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Tarifa#2\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | "Tarifa" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#22\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | "de" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|manutenção#2\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | "manutenção" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#23\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | "de" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|conta#2\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | "conta" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#24\|dy` | -1.9 | 1.85 | 1 pdf-probe-pt | "de" dy -1.9 -> 1.85 pt: moved 3.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|Lançamentos#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "Lançamentos" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#2\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|2026#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "2026" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#4\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "de" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#6\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "de" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#10\|dy` | -1.15 | 1.85 | 1 pdf-probe-pt | "de" dy -1.15 -> 1.85 pt: moved 3 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|Estorno#2\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "Estorno" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|cobrança#2\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "cobrança" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|indevida#2\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "indevida" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|(reclamação#2\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "(reclamação" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|nº#2\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "nº" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|2026/00417)#2\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "2026/00417)" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|—#4\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "—" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#15\|dy` | -16.15 | 1.85 | 1 pdf-probe-pt | "de" dy -16.15 -> 1.85 pt: moved 18 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|Rendimento#3\|dy` | -9.4 | 1.85 | 1 pdf-probe-pt | "Rendimento" dy -9.4 -> 1.85 pt: moved 11.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#25\|dy` | -9.4 | 1.85 | 1 pdf-probe-pt | "de" dy -9.4 -> 1.85 pt: moved 11.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|aplicação#3\|dy` | -9.4 | 1.85 | 1 pdf-probe-pt | "aplicação" dy -9.4 -> 1.85 pt: moved 11.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|automática#3\|dy` | -9.4 | 1.85 | 1 pdf-probe-pt | "automática" dy -9.4 -> 1.85 pt: moved 11.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Lançamentos#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "Lançamentos" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#2\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|2026#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "2026" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#4\|dy` | -10.15 | 1.1 | 1 pdf-probe-pt | "de" dy -10.15 -> 1.1 pt: moved 11.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Compra#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "Compra" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|no#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "no" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|débito#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "débito" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#2\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "—" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Padaria#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "Padaria" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Pão#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "Pão" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#7\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "de" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Açúcar#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "Açúcar" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|&#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "&" dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Cia.#1\|dy` | -26.65 | 1.1 | 1 pdf-probe-pt | "Cia." dy -26.65 -> 1.1 pt: moved 27.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#8\|dy` | -7.15 | 1.1 | 1 pdf-probe-pt | "de" dy -7.15 -> 1.1 pt: moved 8.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|PIX#1\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "PIX" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|recebido#1\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "recebido" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#4\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "—" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|João#1\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "João" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Ninguém#1\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "Ninguém" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|da#1\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "da" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Silva#1\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "Silva" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Pagamento#2\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | "Pagamento" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#10\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | "de" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | "de" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#12\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | "de" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#7\|dy` | -1.15 | 1.1 | 1 pdf-probe-pt | "—" dy -1.15 -> 1.1 pt: moved 2.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|58.025,53#2\|dy` | -19.9 | 1.1 | 1 pdf-probe-pt | "58.025,53" dy -19.9 -> 1.1 pt: moved 21 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#21\|dy` | -10.15 | 1.1 | 1 pdf-probe-pt | "de" dy -10.15 -> 1.1 pt: moved 11.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#9\|dy` | -14.65 | 1.85 | 1 pdf-probe-pt | "—" dy -14.65 -> 1.85 pt: moved 16.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#10\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | "—" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#24\|dy` | -32.65 | 1.85 | 1 pdf-probe-pt | "de" dy -32.65 -> 1.85 pt: moved 34.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "Lançamentos" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#2\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "de" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | "2026" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#9\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | "de" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Débito#2\|dy` | -34.15 | 1.1 | 1 pdf-probe-pt | "Débito" dy -34.15 -> 1.1 pt: moved 35.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|automático#1\|dy` | -34.15 | 1.1 | 1 pdf-probe-pt | "automático" dy -34.15 -> 1.1 pt: moved 35.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|energia#1\|dy` | -34.15 | 1.1 | 1 pdf-probe-pt | "energia" dy -34.15 -> 1.1 pt: moved 35.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|elétrica#1\|dy` | -34.15 | 1.1 | 1 pdf-probe-pt | "elétrica" dy -34.15 -> 1.1 pt: moved 35.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dy` | -14.65 | 1.1 | 1 pdf-probe-pt | "de" dy -14.65 -> 1.1 pt: moved 15.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#2\|dy` | -25.9 | 1.1 | 1 pdf-probe-pt | "Lançamentos" dy -25.9 -> 1.1 pt: moved 27 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#13\|dy` | -25.9 | 1.1 | 1 pdf-probe-pt | "de" dy -25.9 -> 1.1 pt: moved 27 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | "de" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#2\|dy` | -25.9 | 1.1 | 1 pdf-probe-pt | "2026" dy -25.9 -> 1.1 pt: moved 27 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#16\|dy` | -25.9 | 1.1 | 1 pdf-probe-pt | "de" dy -25.9 -> 1.1 pt: moved 27 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#17\|dy` | -12.4 | 1.1 | 1 pdf-probe-pt | "de" dy -12.4 -> 1.1 pt: moved 13.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#19\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | "de" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#22\|dy` | -22.15 | 1.85 | 1 pdf-probe-pt | "de" dy -22.15 -> 1.85 pt: moved 24 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#23\|dy` | -3.4 | 1.85 | 1 pdf-probe-pt | "de" dy -3.4 -> 1.85 pt: moved 5.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#24\|dy` | -3.4 | 1.85 | 1 pdf-probe-pt | "de" dy -3.4 -> 1.85 pt: moved 5.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#11\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | "—" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Pagamento#9\|dy` | -6.4 | 1.85 | 1 pdf-probe-pt | "Pagamento" dy -6.4 -> 1.85 pt: moved 8.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#31\|dy` | -6.4 | 1.85 | 1 pdf-probe-pt | "de" dy -6.4 -> 1.85 pt: moved 8.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|em#5\|dy` | -16.15 | 1.85 | 1 pdf-probe-pt | "em" dy -16.15 -> 1.85 pt: moved 18 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Rendimento#3\|dy` | -13.15 | 1.85 | 1 pdf-probe-pt | "Rendimento" dy -13.15 -> 1.85 pt: moved 15 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|aplicação#3\|dy` | -13.15 | 1.85 | 1 pdf-probe-pt | "aplicação" dy -13.15 -> 1.85 pt: moved 15 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|automática#3\|dy` | -13.15 | 1.85 | 1 pdf-probe-pt | "automática" dy -13.15 -> 1.85 pt: moved 15 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|de#5\|dy` | -20.65 | 1.03 | 1 pdf-probe-pt | "de" dy -20.65 -> 1.03 pt: moved 21.68 pt (> 1) and ends 1.03 pt from Chrome (> 1) (I1) |

## Accepted regressions (acceptedRegressions, with evidence)

none

## Declared strict-gate rejections (declaredRejections, 0)

none

## Reported, not gating (17)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-bottom-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-left-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-right-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-001.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-002.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-003.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/CSS2/borders | `wpt\|css/CSS2/borders/border-top-width-applies-to-004.xht` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |
| wpt css/css-tables | `wpt\|css/css-tables/out-of-order-elements-collapsed-border.html` | pass | fail |  | pass[ink-missing-vs-chrome] -> fail (flagged pass: reported, not gated) |

## Improvements (1911)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst BOL-T3 1.82 mm (tol 1) -> worst BOL-T2 0.24 mm (tol 1) |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.31 mm, p95 1.95 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) -> max 0.44 mm, p95 0.37 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | worst BOL-T3 1.82 mm (tol 1) -> worst BOL-T2 0.24 mm (tol 1) |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 2.31 mm, p95 1.95 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) -> max 0.44 mm, p95 0.37 mm over 315 consensus words (Chrome and WeasyPrint within 2 pt; coverage 1) |
| corpus DANFE-P | `danfe\|DANFE-P1\|corpus\|\|criterion#1` | FAIL | PASS |  | 2 (expected 1) -> 1 (expected 1) |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1` | FAIL | PASS |  | L 2.498 T 4.445 R 0 B 32.173 (each in [2, 8]) -> L 2.498 T 4.191 R 2.074 B 3.09 (each in [2, 8]) |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1` | FAIL | PASS |  | 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 3.68) mm -> 6pt SWPJVR+LiberationSerif-Bold; pos Δ(0, 2.36) mm |
| corpus DANFE-R | `danfe\|DANFE-R1\|corpus\|\|criterion#1` | FAIL | PASS |  | DANFE-A4: anchor text not found in vellora -> worst DANFE-A2 0.27 mm (tol 1) |
| oracles:layout REF-P | `danfe\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 2 pages vs Chrome 1 (WeasyPrint 1) -> 1 pages vs Chrome 1 (WeasyPrint 1) |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 1.81 mm, p95 1.7 mm over 245 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.988) -> max 0.29 mm, p95 0.23 mm over 245 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.988) |
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | worst "Gerente do Departamento de Cobra" dy 1.81 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) -> worst "Gerente do Departamento de Cobra" dy 0.22 mm (tol 1; 4 anchors: last paragraph + signature lines; 0 disputed) |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | max 0.77 mm, p95 0.68 mm over 145 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.96) -> max 0.39 mm, p95 0.26 mm over 145 consensus words (Chrome and WeasyPrint within 2 pt; coverage 0.96) |
| corpus TXT-P | `text-stress-ptbr\|TXT-P1\|corpus\|\|criterion#1` | FAIL | PASS |  | 8 vs reference 7 -> 7 vs reference 7 |
| oracles:layout REF-P | `text-stress-ptbr\|REF-P\|oracles:layout\|plain\|criterion#1` | FAIL | PASS |  | 8 pages vs Chrome 7 (WeasyPrint 7) -> 7 pages vs Chrome 7 (WeasyPrint 7) |
| corpus LET- | `text-stress-ptbr\|LET-3\|corpus\|\|criterion#1` | FAIL | PASS |  | 8 vs reference 7 (= TXT-P1) -> 7 vs reference 7 (= TXT-P1) |
| corpus BOL-R | `boleto-febraban\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 1.82 | 0.24 | 0.1 position-mm | 1.82 -> 0.24 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.31 | 0.44 | 0.1 position-mm | 2.31 -> 0.44 |
| oracles:layout REF-W | `boleto-febraban\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.95 | 0.37 | 0.1 position-mm | 1.95 -> 0.37 |
| corpus BOL-R | `boleto-febraban.px-grid\|BOL-R1\|corpus\|\|criterion#1\|worstMm` | 1.82 | 0.24 | 0.1 position-mm | 1.82 -> 0.24 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.31 | 0.44 | 0.1 position-mm | 2.31 -> 0.44 |
| oracles:layout REF-W | `boleto-febraban.px-grid\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.95 | 0.37 | 0.1 position-mm | 1.95 -> 0.37 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 2.62 | 0.76 | 0.1 position-mm | 2.62 -> 0.76 |
| oracles:layout REF-W | `boleto\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 2.36 | 0.71 | 0.1 position-mm | 2.36 -> 0.71 |
| corpus DANFE-P | `danfe\|DANFE-P1\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessR` | 2 | 0 | 0.05 geometry-excess-mm | 2 -> 0 |
| corpus DANFE-M | `danfe\|DANFE-M1\|corpus\|\|criterion#1\|excessB` | 24.173 | 0 | 0.05 geometry-excess-mm | 24.173 -> 0 |
| corpus DANFE-L | `danfe\|DANFE-L1a\|corpus\|\|criterion#1\|posErrMm` | 2.09 | 1.56 | 0.1 position-mm | 2.09 -> 1.56 |
| corpus DANFE-L | `danfe\|DANFE-L1b\|corpus\|\|criterion#1\|posErrMm` | 3.68 | 2.36 | 0.1 position-mm | 3.68 -> 2.36 |
| corpus DANFE-L | `danfe\|DANFE-L1c\|corpus\|\|criterion#1\|posErrMm` | 5.24 | 3.12 | 0.1 position-mm | 5.24 -> 3.12 |
| corpus DANFE-L | `danfe\|DANFE-L1d\|corpus\|\|criterion#1\|posErrMm` | 6.49 | 3.32 | 0.1 position-mm | 6.49 -> 3.32 |
| oracles:layout REF-P | `danfe\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 5.42 | 0.72 | 0.1 position-mm | 5.42 -> 0.72 |
| oracles:layout REF-W | `danfe\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 4.49 | 0.67 | 0.1 position-mm | 4.49 -> 0.67 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 1.81 | 0.29 | 0.1 position-mm | 1.81 -> 0.29 |
| oracles:layout REF-W | `notification\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 1.7 | 0.23 | 0.1 position-mm | 1.7 -> 0.23 |
| oracles:layout LET-1 | `notification\|LET-1\|oracles:layout\|plain\|criterion#1\|worstMm` | 1.81 | 0.22 | 0.1 position-mm | 1.81 -> 0.22 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 0.77 | 0.39 | 0.1 position-mm | 0.77 -> 0.39 |
| oracles:layout REF-W | `receipt\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 0.68 | 0.26 | 0.1 position-mm | 0.68 -> 0.26 |
| corpus TXT-A | `text-stress-ptbr\|TXT-A1\|corpus\|\|criterion#1\|tokens` | 46 | 69 | 0 count | 46 -> 69 |
| corpus TXT-P | `text-stress-ptbr\|TXT-P1\|corpus\|\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdftotext` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pdfminer.six` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|extra.pymupdf` | 9 | 0 | 0 count | 9 -> 0 |
| oracles:text EXT-2 | `text-stress-ptbr\|EXT-2\|oracles:text\|plain\|criterion#1\|statusRank.pymupdf` | 2 | 3 | 0 count | 2 -> 3 |
| oracles:layout REF-P | `text-stress-ptbr\|REF-P\|oracles:layout\|plain\|criterion#1\|pageDelta` | 1 | 0 | 0 page-delta | 1 -> 0 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|maxMm` | 97.79 | 1.03 | 0.1 position-mm | 97.79 -> 1.03 |
| oracles:layout REF-W | `text-stress-ptbr\|REF-W\|oracles:layout\|plain\|criterion#1\|p95Mm` | 97.02 | 0.95 | 0.1 position-mm | 97.02 -> 0.95 |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | 2.74 | 1.24 | 1 pdf-probe-pt | "99990.00001" \|dy\| 2.74 -> 1.24 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | 2.74 | 1.24 | 1 pdf-probe-pt | "23456.700001" \|dy\| 2.74 -> 1.24 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | 2.74 | 1.24 | 1 pdf-probe-pt | "00000.000420" \|dy\| 2.74 -> 1.24 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | 2.74 | 1.24 | 1 pdf-probe-pt | "1" \|dy\| 2.74 -> 1.24 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dy` | 2.13 | 0.63 | 1 pdf-probe-pt | "999-9" \|dy\| 2.13 -> 0.63 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | 2.74 | 1.24 | 1 pdf-probe-pt | "99990000012345" \|dy\| 2.74 -> 1.24 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#3\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "AGÊNCIA" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#3\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "/" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "CÓDIGO" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#4\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "DO" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#4\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "BENEFICIÁRIO" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "Acme" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "Widgets" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "Comércio" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "LTDA" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#2\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "—" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CNPJ#1\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "CNPJ" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|12.345.678/0001-90#1\|dy` | 2.6 | 0.35 | 1 pdf-probe-pt | "12.345.678/0001-90" \|dy\| 2.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dy` | 3.35 | 1.1 | 1 pdf-probe-pt | "0042" \|dy\| 3.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dy` | 3.35 | 1.1 | 1 pdf-probe-pt | "/" \|dy\| 3.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dy` | 3.35 | 1.1 | 1 pdf-probe-pt | "00012345-6" \|dy\| 3.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DATA#1\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "DATA" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#5\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "DO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#2\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "NÚMERO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "DO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#3\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#1\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "ESPÉCIE" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC.#1\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "DOC." \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#2\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "NOSSO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#3\|dy` | 4.1 | 0.35 | 1 pdf-probe-pt | "NÚMERO" \|dy\| 4.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|22/06/2026#1\|dy` | 4.85 | 1.1 | 1 pdf-probe-pt | "22/06/2026" \|dy\| 4.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dy` | 4.85 | 1.1 | 1 pdf-probe-pt | "DOC-00042" \|dy\| 4.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dy` | 4.85 | 1.1 | 1 pdf-probe-pt | "DM" \|dy\| 4.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dy` | 4.85 | 1.1 | 1 pdf-probe-pt | "00000000000123456-7" \|dy\| 4.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|CARTEIRA#1\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "CARTEIRA" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "ESPÉCIE" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "MOEDA" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "QUANTIDADE" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|(=)#1\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "(=)" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#2\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "VALOR" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#7\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "DO" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#4\|dy` | 5.6 | 0.35 | 1 pdf-probe-pt | "DOCUMENTO" \|dy\| 5.6 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|17#1\|dy` | 6.35 | 1.1 | 1 pdf-probe-pt | "17" \|dy\| 6.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dy` | 6.35 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 6.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dy` | 6.35 | 1.1 | 1 pdf-probe-pt | "1" \|dy\| 6.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dy` | 6.35 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 6.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dy` | 6.35 | 1.1 | 1 pdf-probe-pt | "1.842,50" \|dy\| 6.35 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|INSTRUÇÕES#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "INSTRUÇÕES" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|(TEXTO#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "(TEXTO" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#2\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "DE" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|RESPONSABILIDADE#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "RESPONSABILIDADE" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#8\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "DO" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO)#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "BENEFICIÁRIO)" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|(-)#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "(-)" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCONTO#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "DESCONTO" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#5\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "/" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|ABATIMENTO#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "ABATIMENTO" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "•" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Não#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "Não" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|receber#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "receber" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|após#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "após" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|30#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "30" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|dias#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "dias" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|do#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "do" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento.#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "vencimento." \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "R$" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dy` | 7.85 | 1.1 | 1 pdf-probe-pt | "0,00" \|dy\| 7.85 -> 1.1 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#2\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "•" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|Após#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "Após" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|o#2\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "o" \|dy\| 7.1 -> 0.35 pt |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento,#1\|dy` | 7.1 | 0.35 | 1 pdf-probe-pt | "vencimento," \|dy\| 7.1 -> 0.35 pt |
| … | 1711 more in gate-report.json | | | | |

WPT/crashtest improvements: 80 (listed in gate-report.json).

## Worse within tolerance (677; not gating, counted; the head ratchet sums them)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#1\|dy` | -1.01 | 0.49 | 1 pdf-probe-pt | "99990.00001" dy -1.01 -> 0.49 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#1\|dy` | -1.01 | 0.49 | 1 pdf-probe-pt | "23456.700001" dy -1.01 -> 0.49 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#1\|dy` | -1.01 | 0.49 | 1 pdf-probe-pt | "00000.000420" dy -1.01 -> 0.49 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#1\|dy` | -1.01 | 0.49 | 1 pdf-probe-pt | "1" dy -1.01 -> 0.49 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#1\|dx` | -0.86 | 0.64 | 1 pdf-probe-pt | "999-9" dx -0.86 -> 0.64 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#1\|dy` | -0.87 | 0.63 | 1 pdf-probe-pt | "999-9" dy -0.87 -> 0.63 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#1\|dy` | -1.01 | 0.49 | 1 pdf-probe-pt | "99990000012345" dy -1.01 -> 0.49 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "BENEFICIÁRIO" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|AGÊNCIA#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "AGÊNCIA" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "/" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|CÓDIGO#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "CÓDIGO" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#2\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "DO" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|BENEFICIÁRIO#2\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "BENEFICIÁRIO" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Acme#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "Acme" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Widgets#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "Widgets" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Comércio#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "Comércio" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|LTDA#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "LTDA" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0042" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "0042" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "/" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#2\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "/" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "00012345-6" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#1\|dy` | -1.9 | 0.35 | 1 pdf-probe-pt | "00012345-6" dy -1.9 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NOSSO#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "NOSSO" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "NÚMERO" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "VENCIMENTO" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "VENCIMENTO" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|VALOR#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "VALOR" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#3\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "DO" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOCUMENTO#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "DOCUMENTO" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "00000000000123456-7" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "15/07/2026" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "15/07/2026" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "R$" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1.842,50" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#1\|dy` | -0.4 | 0.35 | 1 pdf-probe-pt | "1.842,50" dy -0.4 -> 0.35 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|999-9#2\|dx` | -0.86 | 0.64 | 1 pdf-probe-pt | "999-9" dx -0.86 -> 0.64 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|15/07/2026#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "15/07/2026" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0042" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "/" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "00012345-6" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|NÚMERO#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "NÚMERO" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DO#6\|dx` | 0.74 | -0.01 | 1 pdf-probe-pt | "DO" dx 0.74 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "ESPÉCIE" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC.#1\|dx` | 0.74 | -0.01 | 1 pdf-probe-pt | "DOC." dx 0.74 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "DOC-00042" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "DM" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "00000000000123456-7" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|ESPÉCIE#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "ESPÉCIE" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|MOEDA#1\|dx` | 0.74 | -0.01 | 1 pdf-probe-pt | "MOEDA" dx 0.74 -> -0.01 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|QUANTIDADE#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "QUANTIDADE" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1.842,50" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0,00" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#5\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#2\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0,00" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#7\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "0,00" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#8\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "R$" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#3\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "1.842,50" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DESCRIÇÃO#1\|dx` | 0.69 | -0.06 | 1 pdf-probe-pt | "DESCRIÇÃO" dx 0.69 -> -0.06 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|10492.46810#1\|dy` | -0.25 | 0.5 | 1 pdf-probe-pt | "10492.46810" dy -0.25 -> 0.5 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|31000.100045#1\|dy` | -0.25 | 0.5 | 1 pdf-probe-pt | "31000.100045" dy -0.25 -> 0.5 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|00041.700139#1\|dy` | -0.25 | 0.5 | 1 pdf-probe-pt | "00041.700139" dy -0.25 -> 0.5 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|7#1\|dy` | -0.25 | 0.5 | 1 pdf-probe-pt | "7" dy -0.25 -> 0.5 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|16460000184250#1\|dy` | -0.25 | 0.5 | 1 pdf-probe-pt | "16460000184250" dy -0.25 -> 0.5 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Beneficiário" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "CPF/CNPJ" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CPF/CNPJ#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "CPF/CNPJ" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#2\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "do" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#2\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "do" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#2\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "Beneficiário" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#2\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Beneficiário" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Agência#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Agência" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "/" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Código#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Código" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#3\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "do" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#3\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Beneficiário" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Oficina#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Oficina" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplo#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Exemplo" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|de#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "de" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Testes#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Testes" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Ltda.#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "Ltda." dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|11.222.333/0001-81#1\|dx` | 2.98 | -0.02 | 1 pdf-probe-pt | "11.222.333/0001-81" dx 2.98 -> -0.02 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|11.222.333/0001-81#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "11.222.333/0001-81" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1234#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "1234" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#2\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "/" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|246813-1#1\|dy` | 0.67 | -0.08 | 1 pdf-probe-pt | "246813-1" dy 0.67 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Endereço#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Endereço" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#4\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "do" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Beneficiário#4\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Beneficiário" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Rua#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Rua" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|das#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "das" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Acácias,#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Acácias," dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|1500,#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "1500," dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Sala#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Sala" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|42#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "42" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "—" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Jardim#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Jardim" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Sintético#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Sintético" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#2\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "—" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|São#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "São" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|José#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "José" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|dos#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "dos" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Exemplos#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "Exemplos" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|/#3\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "/" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|SP#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "SP" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|—#3\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "—" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|CEP#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "CEP" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|01310-930#1\|dy` | 1.42 | -0.08 | 1 pdf-probe-pt | "01310-930" dy 1.42 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Data#1\|dy` | 2.17 | -0.08 | 1 pdf-probe-pt | "Data" dy 2.17 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#5\|dy` | 2.17 | -0.08 | 1 pdf-probe-pt | "do" dy 2.17 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|documento#1\|dy` | 2.17 | -0.08 | 1 pdf-probe-pt | "documento" dy 2.17 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "Nr." dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|Nr.#1\|dy` | 2.17 | -0.08 | 1 pdf-probe-pt | "Nr." dy 2.17 -> -0.08 pt (crossed Chrome, within 1 pt) |
| pdf-probe | `pdf-probe\|boleto-febraban\|p1\|do#6\|dx` | 1.32 | -0.18 | 1 pdf-probe-pt | "do" dx 1.32 -> -0.18 pt (crossed Chrome, within 1 pt) |
| … | 557 more in gate-report.json | | | | |

## newly-measured (1123)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| corpus DANFE-R | `danfe\|DANFE-R1\|corpus\|\|criterion#1\|worstMm` |  | 0.27 | 0.1 position-mm | was DANFE-A4 not found in vellora |
| pdf-probe | `pdf-probe\|danfe\|p1\|INFORMAÇÕES#1\|pairing` | unpaired | dx 0.33 dy 0.67 |  | Chrome's "INFORMAÇÕES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|COMPLEMENTARES#1\|pairing` | unpaired | dx 0.37 dy 0.67 |  | Chrome's "COMPLEMENTARES" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|RESERVADO#1\|pairing` | unpaired | dx 0.38 dy 0.67 |  | Chrome's "RESERVADO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|AO#2\|pairing` | unpaired | dx 0.41 dy 0.67 |  | Chrome's "AO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|FISCO#1\|pairing` | unpaired | dx 0.42 dy 0.67 |  | Chrome's "FISCO" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|SEM#1\|pairing` | unpaired | dx 0.33 dy 0.67 |  | Chrome's "SEM" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|VALOR#15\|pairing` | unpaired | dx 0.34 dy 0.67 |  | Chrome's "VALOR" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|FISCAL#3\|pairing` | unpaired | dx 0.36 dy 0.67 |  | Chrome's "FISCAL" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#12\|pairing` | unpaired | dx 0.38 dy 0.67 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|NF-e#3\|pairing` | unpaired | dx 0.38 dy 0.67 |  | Chrome's "NF-e" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|emitida#1\|pairing` | unpaired | dx 0.4 dy 0.67 |  | Chrome's "emitida" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|em#2\|pairing` | unpaired | dx 0.42 dy 0.67 |  | Chrome's "em" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|ambiente#1\|pairing` | unpaired | dx 0.43 dy 0.67 |  | Chrome's "ambiente" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#8\|pairing` | unpaired | dx 0.46 dy 0.67 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|homologação#1\|pairing` | unpaired | dx 0.47 dy 0.67 |  | Chrome's "homologação" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|(fixture#1\|pairing` | unpaired | dx 0.51 dy 0.67 |  | Chrome's "(fixture" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|sintética#1\|pairing` | unpaired | dx 0.53 dy 0.67 |  | Chrome's "sintética" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|do#1\|pairing` | unpaired | dx 0.56 dy 0.67 |  | Chrome's "do" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|vellora,#1\|pairing` | unpaired | dx 0.57 dy 0.67 |  | Chrome's "vellora," (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|fidelity/corpus).#1\|pairing` | unpaired | dx 0.59 dy 0.67 |  | Chrome's "fidelity/corpus)." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Pedido#1\|pairing` | unpaired | dx 0.33 dy 0.68 |  | Chrome's "Pedido" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|de#9\|pairing` | unpaired | dx 0.35 dy 0.68 |  | Chrome's "de" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|compra#1\|pairing` | unpaired | dx 0.36 dy 0.68 |  | Chrome's "compra" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|nº#1\|pairing` | unpaired | dx 0.38 dy 0.68 |  | Chrome's "nº" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|PC-2026-0815.#1\|pairing` | unpaired | dx 0.38 dy 0.68 |  | Chrome's "PC-2026-0815." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Entrega#1\|pairing` | unpaired | dx 0.42 dy 0.68 |  | Chrome's "Entrega" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|no#3\|pairing` | unpaired | dx 0.44 dy 0.68 |  | Chrome's "no" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|horário#1\|pairing` | unpaired | dx 0.45 dy 0.68 |  | Chrome's "horário" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|comercial.#1\|pairing` | unpaired | dx 0.47 dy 0.68 |  | Chrome's "comercial." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|Valor#1\|pairing` | unpaired | dx 0.33 dy 0.69 |  | Chrome's "Valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|aproximado#1\|pairing` | unpaired | dx 0.34 dy 0.69 |  | Chrome's "aproximado" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|dos#2\|pairing` | unpaired | dx 0.38 dy 0.69 |  | Chrome's "dos" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|tributos:#1\|pairing` | unpaired | dx 0.39 dy 0.69 |  | Chrome's "tributos:" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|R$#4\|pairing` | unpaired | dx 0.41 dy 0.69 |  | Chrome's "R$" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|4.203,37#1\|pairing` | unpaired | dx 0.42 dy 0.69 |  | Chrome's "4.203,37" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|(Fonte:#1\|pairing` | unpaired | dx 0.44 dy 0.69 |  | Chrome's "(Fonte:" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|IBPT)#1\|pairing` | unpaired | dx 0.46 dy 0.69 |  | Chrome's "IBPT)" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#13\|pairing` | unpaired | dx 0.48 dy 0.69 |  | Chrome's "—" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|valor#1\|pairing` | unpaired | dx 0.48 dy 0.69 |  | Chrome's "valor" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|danfe\|p1\|fictício.#1\|pairing` | unpaired | dx 0.5 dy 0.69 |  | Chrome's "fictício." (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|7#1\|pairing` | unpaired | dx -0.56 dy -0.34 |  | Chrome's "7" (page 1) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#23\|pairing` | unpaired | dx -0.22 dy 1.1 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Lançamentos#3\|pairing` | unpaired | dx 0.03 dy 1.85 |  | Chrome's "Lançamentos" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#25\|pairing` | unpaired | dx 0.02 dy 1.85 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|março#1\|pairing` | unpaired | dx 0.02 dy 1.85 |  | Chrome's "março" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|2026#3\|pairing` | unpaired | dx 0.01 dy 1.85 |  | Chrome's "2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|120.466,81#1\|pairing` | unpaired | dx -0.94 dy 1.85 |  | Chrome's "120.466,81" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|852357#1\|pairing` | unpaired | dx -0.17 dy 1.85 |  | Chrome's "852357" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|03/03/2026#1\|pairing` | unpaired | dx 0.03 dy 1.85 |  | Chrome's "03/03/2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Compra#5\|pairing` | unpaired | dx -0.21 dy 1.85 |  | Chrome's "Compra" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|no#5\|pairing` | unpaired | dx -0.22 dy 1.85 |  | Chrome's "no" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|débito#5\|pairing` | unpaired | dx -0.22 dy 1.85 |  | Chrome's "débito" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#11\|pairing` | unpaired | dx -0.23 dy 1.85 |  | Chrome's "—" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Padaria#5\|pairing` | unpaired | dx -0.23 dy 1.85 |  | Chrome's "Padaria" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Pão#5\|pairing` | unpaired | dx -0.24 dy 1.85 |  | Chrome's "Pão" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#27\|pairing` | unpaired | dx -0.24 dy 1.85 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Açúcar#5\|pairing` | unpaired | dx -0.24 dy 1.85 |  | Chrome's "Açúcar" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|&#5\|pairing` | unpaired | dx -0.25 dy 1.85 |  | Chrome's "&" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Cia.#5\|pairing` | unpaired | dx -0.25 dy 1.85 |  | Chrome's "Cia." (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|−321,66#1\|pairing` | unpaired | dx -0.48 dy 1.85 |  | Chrome's "−321,66" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|143.119,78#1\|pairing` | unpaired | dx -0.95 dy 1.85 |  | Chrome's "143.119,78" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|917939#1\|pairing` | unpaired | dx -0.17 dy 1.85 |  | Chrome's "917939" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|05/03/2026#1\|pairing` | unpaired | dx 0.03 dy 1.85 |  | Chrome's "05/03/2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Transferência#1\|pairing` | unpaired | dx -0.21 dy 1.85 |  | Chrome's "Transferência" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|TED#1\|pairing` | unpaired | dx -0.22 dy 1.85 |  | Chrome's "TED" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#12\|pairing` | unpaired | dx -0.22 dy 1.85 |  | Chrome's "—" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Distribuidora#1\|pairing` | unpaired | dx -0.22 dy 1.85 |  | Chrome's "Distribuidora" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Exemplo#1\|pairing` | unpaired | dx -0.24 dy 1.85 |  | Chrome's "Exemplo" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#28\|pairing` | unpaired | dx -0.25 dy 1.85 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|−1.931,80#1\|pairing` | unpaired | dx -0.47 dy 1.85 |  | Chrome's "−1.931,80" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|141.187,98#1\|pairing` | unpaired | dx -0.94 dy 1.85 |  | Chrome's "141.187,98" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Componentes#1\|pairing` | unpaired | dx -0.21 dy 1.85 |  | Chrome's "Componentes" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Ltda.#1\|pairing` | unpaired | dx -0.22 dy 1.85 |  | Chrome's "Ltda." (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|982804#1\|pairing` | unpaired | dx -0.17 dy 1.85 |  | Chrome's "982804" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|08/03/2026#1\|pairing` | unpaired | dx 0.03 dy 1.85 |  | Chrome's "08/03/2026" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|Tarifa#2\|pairing` | unpaired | dx -0.21 dy 1.85 |  | Chrome's "Tarifa" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#29\|pairing` | unpaired | dx -0.21 dy 1.85 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|manutenção#2\|pairing` | unpaired | dx -0.21 dy 1.85 |  | Chrome's "manutenção" (page 2) now has a vellora counterpart |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#30\|pairing` | unpaired | dx -0.23 dy 1.85 |  | Chrome's "de" (page 2) now has a vellora counterpart |
| … | 1043 more in gate-report.json | | | | |

## Head ratchet vs fidelity/baselines/port/00-start (GATE-H1): FAIL

Every item worse than the chain head beyond its tolerance gates unless a class-a acceptance of this step (0 counted, 0 legacy/other ignored) or a DEBT.json entry within its ceiling covers it. Counts: head-regression 88, debt 180, declared 10, gating 88, improvement 2342, withinTolerance 1660, flaggedPassLost 20.

### head-regression: worse than the head, no ledger entry (gate, rule i) (88)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-004.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/inline-formatting-context-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| pdf-probe | `pdf-probe\|invoice\|p1\|São#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "São" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Paulo#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Paulo" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#2\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SP#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SP" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Avenida#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Avenida" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Central,#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Central," dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|4500#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "4500" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#3\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Conjunto#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Conjunto" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|faturamento@acmewidgets.example#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "faturamento@acmewidgets.example" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CNPJ#2\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CNPJ" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|98.765.432/0001-21#1\|dy` | -2.8 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "98.765.432/0001-21" dy -2.8 -> 1.1 pt: moved 3.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|[Product#2\|pairing` | dx -0.9 dy -0.15 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "[Product" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|p1\|Name]#2\|pairing` | dx -0.9 dy -0.15 | unpaired |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): Chrome's "Name]" (page 1) lost its vellora counterpart: missing, on another page, or more than 36 pt away |
| pdf-probe | `pdf-probe\|oss-postmark-receipt\|unpaired-vellora` | 0 | 3 | 0 count | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): vellora words Chrome lacks: 0 -> 3 (e.g. "Download" p1, "as" p1, "PDF" p1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|DESCRIÇÃO#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DESCRIÇÃO" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|QTD#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|UNITÁRIO#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "UNITÁRIO" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|TOTAL#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "TOTAL" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|SKU#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SKU" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|CAF-ESP-002#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CAF-ESP-002" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|SKU#2\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SKU" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|PAD-PCH-014#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "PAD-PCH-014" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|SKU#4\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SKU" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|BEB-SUC-021#1\|dy` | -10.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "BEB-SUC-021" dy -10.12 -> 1.1 pt: moved 11.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|Total#1\|dy` | -11.62 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Total" dy -11.62 -> 1.1 pt: moved 12.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|pago#1\|dy` | -11.62 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pago" dy -11.62 -> 1.1 pt: moved 12.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|R$#11\|dy` | -11.62 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" dy -11.62 -> 1.1 pt: moved 12.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|68,50#1\|dy` | -11.62 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "68,50" dy -11.62 -> 1.1 pt: moved 12.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#26\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#27\|dy` | -22.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -22.15 -> 1.85 pt: moved 24 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Lançamentos#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#2\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|2026#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#2\|dy` | -19.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -19.9 -> 1.1 pt: moved 21 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#9\|dy` | -10.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -10.9 -> 1.1 pt: moved 12 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#17\|dy` | -13.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -13.15 -> 1.85 pt: moved 15 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#18\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#11\|dy` | -25.9 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -25.9 -> 1.85 pt: moved 27.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#24\|dy` | -23.65 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -23.65 -> 1.85 pt: moved 25.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|Lançamentos#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#2\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|2026#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#4\|dy` | -20.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -20.65 -> 1.1 pt: moved 21.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#10\|dy` | -4.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.85 pt: moved 6 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#17\|dy` | -29.65 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -29.65 -> 1.85 pt: moved 31.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#18\|dy` | -22.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -22.15 -> 1.1 pt: moved 23.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#19\|dy` | -20.65 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -20.65 -> 1.85 pt: moved 22.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Lançamentos#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#2\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|2026#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#10\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|58.025,53#2\|dy` | -22.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "58.025,53" dy -22.9 -> 1.1 pt: moved 24 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#19\|dy` | -14.65 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -14.65 -> 1.85 pt: moved 16.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#23\|dy` | 0.35 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.35 -> 1.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#10\|dy` | -5.65 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -5.65 -> 1.85 pt: moved 7.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#1\|dy` | -3.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -3.4 -> 1.1 pt: moved 4.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#10\|dy` | -19.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -19.9 -> 1.1 pt: moved 21 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#8\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#2\|dy` | -28.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -28.9 -> 1.1 pt: moved 30 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#13\|dy` | -28.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -28.9 -> 1.1 pt: moved 30 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#14\|dy` | -10.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -10.9 -> 1.1 pt: moved 12 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#2\|dy` | -28.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -28.9 -> 1.1 pt: moved 30 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#17\|dy` | -15.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 1.1 pt: moved 16.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#9\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#23\|dy` | -6.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -6.4 -> 1.85 pt: moved 8.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#24\|dy` | -6.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -6.4 -> 1.85 pt: moved 8.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#28\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#30\|dy` | -28.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -28.15 -> 1.85 pt: moved 30 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#31\|dy` | -9.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -9.4 -> 1.85 pt: moved 11.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#32\|dy` | -0.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" \|dy\| 0.4 -> 1.85 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|de#5\|dy` | -23.65 | 1.03 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -23.65 -> 1.03 pt: moved 24.68 pt (> 1) and ends 1.03 pt from Chrome (> 1) (I1) |

### debt: covered by DEBT.json (class b, not gating) (180)

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| pdf-probe | `pdf-probe\|boleto\|p1\|Corte#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Corte" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|na#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "na" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|linha#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "linha" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|pontilhada#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "pontilhada" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|—#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "—" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Ficha#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Ficha" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|Compensação#1\|dy` | -2.06 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "Compensação" dy -2.06 -> 1.1 pt: moved 3.16 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990.00001#2\|dy` | -2.81 | 1.24 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "99990.00001" dy -2.81 -> 1.24 pt: moved 4.05 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|23456.700001#2\|dy` | -2.81 | 1.24 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "23456.700001" dy -2.81 -> 1.24 pt: moved 4.05 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000.000420#2\|dy` | -2.81 | 1.24 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "00000.000420" dy -2.81 -> 1.24 pt: moved 4.05 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#2\|dy` | -2.81 | 1.24 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "1" dy -2.81 -> 1.24 pt: moved 4.05 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|99990000012345#2\|dy` | -2.81 | 1.24 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "99990000012345" dy -2.81 -> 1.24 pt: moved 4.05 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|LOCAL#1\|dy` | -1.22 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "LOCAL" dy -1.22 -> 1.1 pt: moved 2.32 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|DE#1\|dy` | -1.22 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "DE" dy -1.22 -> 1.1 pt: moved 2.32 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|PAGAMENTO#1\|dy` | -1.22 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "PAGAMENTO" dy -1.22 -> 1.1 pt: moved 2.32 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|boleto\|p1\|VENCIMENTO#2\|dy` | -1.22 | 1.1 | 1 pdf-probe-pt | DEBT-10-boleto-1 (class b, owner blitz:text-position-dy, closes at -): "VENCIMENTO" dy -1.22 -> 1.1 pt: moved 2.32 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-boleto-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|CNPJ#1\|dx` | -0.67 | 1.08 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "CNPJ" dx -0.67 -> 1.08 pt: moved 1.75 pt (> 1) and ends 1.08 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|12.345.678/0001-95#1\|dx` | -0.67 | 1.08 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "12.345.678/0001-95" dx -0.67 -> 1.08 pt: moved 1.75 pt (> 1) and ends 1.08 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|CEP#2\|dx` | -8.98 | 1.09 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "CEP" dx -8.98 -> 1.09 pt: moved 10.07 pt (> 1) and ends 1.09 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|04578-000#1\|dx` | -8.98 | 1.09 | 1 pdf-probe-pt | DEBT-10-danfe-1 (class b, owner blitz:text-position-dx, closes at -): "04578-000" dx -8.98 -> 1.09 pt: moved 10.07 pt (> 1) and ends 1.09 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-1 |
| pdf-probe | `pdf-probe\|danfe\|p1\|7.185,22#1\|dx` | -1.24 | 1.01 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "7.185,22" dx -1.24 -> 1.01 pt: moved 2.25 pt (> 1) and ends 1.01 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|003#1\|dx` | -1.13 | 1.12 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "003" dx -1.13 -> 1.12 pt: moved 2.25 pt (> 1) and ends 1.12 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#10\|dx` | -1.12 | 1.13 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "—" dx -1.12 -> 1.13 pt: moved 2.25 pt (> 1) and ends 1.13 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|13/01/2027#1\|dx` | -1.11 | 1.14 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "13/01/2027" dx -1.11 -> 1.14 pt: moved 2.25 pt (> 1) and ends 1.14 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|—#11\|dx` | -1.06 | 1.19 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "—" dx -1.06 -> 1.19 pt: moved 2.25 pt (> 1) and ends 1.19 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|R$#3\|dx` | -1.05 | 1.2 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "R$" dx -1.05 -> 1.2 pt: moved 2.25 pt (> 1) and ends 1.2 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|7.185,22#2\|dx` | -1.03 | 1.22 | 1 pdf-probe-pt | DEBT-10-danfe-2 (class b, owner blitz:text-position-dx, closes at -): "7.185,22" dx -1.03 -> 1.22 pt: moved 2.25 pt (> 1) and ends 1.22 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-2 |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#17\|dy` | -1.01 | 1.24 | 1 pdf-probe-pt | DEBT-10-danfe-3 (class b, owner blitz:text-position-dy, closes at -): "0,00" dy -1.01 -> 1.24 pt: moved 2.25 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) — DEBT DEBT-10-danfe-3 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Suporte#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Suporte" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|de#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "de" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|fixação#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "fixação" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|em#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "em" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|alumínio#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "alumínio" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|A20#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "A20" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|40#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "40" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|32,50#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "32,50" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#2\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.300,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "1.300,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#3\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "SKU" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|FS-W8-200#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "FS-W8-200" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Perfil#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Perfil" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|estrutural#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "estrutural" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|40x40#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "40x40" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#5\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "—" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|barra#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "barra" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|3m#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "3m" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|60#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "60" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#7\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|47,20#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "47,20" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#8\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|2.832,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "2.832,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#5\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "SKU" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|CN-RF-01#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "CN-RF-01" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Roldana#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Roldana" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|industrial#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "industrial" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Ø50mm#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Ø50mm" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|30#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "30" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#11\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|28,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "28,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#12\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|840,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "840,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Bloco#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Bloco" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|deslizante#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "deslizante" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|para#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "para" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|trilho#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "trilho" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|linear#2\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "linear" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|44#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "44" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#15\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|34,50#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "34,50" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#16\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.518,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "1.518,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#8\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "SKU" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|BD-TL#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "BD-TL" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Motor#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Motor" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|de#4\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "de" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|passo#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "passo" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|NEMA#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "NEMA" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|23#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "23" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#2\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "12" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#17\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|156,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "156,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#18\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.872,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "1.872,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|SKU#10\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "SKU" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|AC-FL-68#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "AC-FL-68" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|Fonte#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "Fonte" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|chaveada#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "chaveada" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|24V#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "24V" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|10A#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "10A" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|8#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "8" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#21\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|142,50#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "142,50" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|R$#22\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|invoice\|p1\|1.140,00#1\|dy` | -2.04 | 1.1 | 1 pdf-probe-pt | DEBT-10-invoice-2 (class b, owner blitz:text-position-dy, closes at -): "1.140,00" dy -2.04 -> 1.1 pt: moved 3.14 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-invoice-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Acme#1\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-1 (class b, owner blitz:text-position-dy, closes at -): "Acme" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-1 |
| pdf-probe | `pdf-probe\|notification\|p1\|Serviços#1\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-1 (class b, owner blitz:text-position-dy, closes at -): "Serviços" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-1 |
| pdf-probe | `pdf-probe\|notification\|p1\|Prediais#1\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-1 (class b, owner blitz:text-position-dy, closes at -): "Prediais" dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-1 |
| pdf-probe | `pdf-probe\|notification\|p1\|Ltda.#1\|dy` | -1.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-1 (class b, owner blitz:text-position-dy, closes at -): "Ltda." dy -1.9 -> 1.1 pt: moved 3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-1 |
| pdf-probe | `pdf-probe\|notification\|p1\|Mariana#1\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Mariana" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Oliveira#1\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Oliveira" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Souza#1\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Souza" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Gerente#1\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Gerente" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|do#3\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "do" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Departamento#1\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Departamento" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|de#9\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "de" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Cobrança#1\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Cobrança" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Acme#2\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Acme" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Serviços#2\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Serviços" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Prediais#2\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Prediais" dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|notification\|p1\|Ltda.#4\|dy` | -23.39 | 1.1 | 1 pdf-probe-pt | DEBT-10-notification-2 (class b, owner blitz:text-position-dy, closes at -): "Ltda." dy -23.39 -> 1.1 pt: moved 24.49 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-notification-2 |
| pdf-probe | `pdf-probe\|receipt\|p1\|CEP#1\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "CEP" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|01001-000#1\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "01001-000" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Recibo#1\|dy` | -8.47 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Recibo" dy -8.47 -> 1.1 pt: moved 9.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|nº#1\|dy` | -8.47 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "nº" dy -8.47 -> 1.1 pt: moved 9.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|REC-2026-000482#1\|dy` | -8.47 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "REC-2026-000482" dy -8.47 -> 1.1 pt: moved 9.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|ITENS#1\|dy` | -8.88 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "ITENS" dy -8.88 -> 1.1 pt: moved 9.98 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Desconto#1\|dy` | -8.62 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Desconto" dy -8.62 -> 1.1 pt: moved 9.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|-#1\|dy` | -8.62 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "-" dy -8.62 -> 1.1 pt: moved 9.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|R$#10\|dy` | -8.62 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "R$" dy -8.62 -> 1.1 pt: moved 9.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|5,00#1\|dy` | -8.62 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "5,00" dy -8.62 -> 1.1 pt: moved 9.72 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|PAGAMENTO#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "PAGAMENTO" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Forma#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Forma" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|de#3\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|pagamento#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "pagamento" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Cartão#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Cartão" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|de#4\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|crédito#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "crédito" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Bandeira#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Bandeira" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|/#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "/" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|detalhe#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "detalhe" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Aurora#2\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Aurora" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Card#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Card" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|••••#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "••••" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|4242#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "4242" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Autorização#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Autorização" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|AUTH-7F3A9C21#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "AUTH-7F3A9C21" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Situação#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Situação" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|receipt\|p1\|Pago#1\|dy` | -7.87 | 1.1 | 1 pdf-probe-pt | DEBT-10-receipt-1 (class b, owner blitz:text-position-dy, closes at -): "Pago" dy -7.87 -> 1.1 pt: moved 8.97 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-receipt-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|2.#1\|dy` | -15.8 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "2." dy -15.8 -> 1.1 pt: moved 16.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|Ligaduras#1\|dy` | -15.8 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "Ligaduras" dy -15.8 -> 1.1 pt: moved 16.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|e#3\|dy` | -15.8 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "e" dy -15.8 -> 1.1 pt: moved 16.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|pesos#1\|dy` | -15.8 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "pesos" dy -15.8 -> 1.1 pt: moved 16.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|misturados#1\|dy` | -15.8 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "misturados" dy -15.8 -> 1.1 pt: moved 16.9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|Regular,#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "Regular," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|negrito#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "negrito" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|,#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|serifada#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "serifada" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|,#2\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|serifada#2\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "serifada" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|negrito#2\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "negrito" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|,#3\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|mono#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "mono" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|0123456789#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "0123456789" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|,#4\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|mono#2\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "mono" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|negrito#3\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "negrito" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|,#5\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|itálico#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "itálico" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|solicitado,#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "solicitado," dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|menor#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "menor" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|e#4\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "e" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|maior#1\|dy` | -16.2 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "maior" dy -16.2 -> 1.1 pt: moved 17.3 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|3.#1\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "3." dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|Palavras#1\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "Palavras" dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|longas#1\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "longas" dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|e#5\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "e" dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|tokens#1\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "tokens" dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|sem#1\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "sem" dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p1\|quebra#1\|dy` | -23.37 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "quebra" dy -23.37 -> 1.1 pt: moved 24.47 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|10/01/2026#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "10/01/2026" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|152.683,31#1\|dy` | -0.4 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "152.683,31" dy -0.4 -> 1.1 pt: moved 1.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#6\|dy` | -31.15 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-2 (class b, owner blitz:text-position-dy, closes at -): "—" dy -31.15 -> 1.1 pt: moved 32.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-2 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|—#9\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-2 (class b, owner blitz:text-position-dy, closes at -): "—" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-2 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#20\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-2 (class b, owner blitz:text-position-dy, closes at -): "de" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-2 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#6\|dy` | -19.15 | 1.1 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -19.15 -> 1.1 pt: moved 20.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#8\|dy` | -13.15 | 1.85 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-2 (class b, owner blitz:text-position-dy, closes at -): "—" dy -13.15 -> 1.85 pt: moved 15 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-2 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#8\|dy` | -29.65 | 1.85 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "de" dy -29.65 -> 1.85 pt: moved 31.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) — DEBT DEBT-10-text-stress-ptbr-1 |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|—#5\|dy` | -0.4 | 1.85 | 1 pdf-probe-pt | DEBT-10-text-stress-ptbr-1 (class b, owner blitz:text-position-dy, closes at -): "—" \|dy\| 0.4 -> 1.85 pt vs Chrome (baseline) — DEBT DEBT-10-text-stress-ptbr-1 |

## Debt ledger (10 entries; transition checked; passes auto_table_compact_columns, table_percent_widths)

no problem

## Gate canaries (23/23 caught; an uncaught one is an absolute failure)

| canary | must report | observed | caught |
|---|---|---|---|
| head ratchet: \|dy\| +0.6 pt per step over two steps | real word boleto p1\|RECIBO#1: vs previous link within-tolerance (listed, not gating); vs head regression; no DEBT entry -> head-regression | previous within-tolerance; head regression; ledger head-regression | true |
| WPT fail -> unsupported (new strict-gate rejection) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht: gating rejection; declared with its feature -> declared | undeclared rejection/true; declared declared/false | true |
| verdict row -> strict gate rejected | real row invoice PDF-Q1 oracles:qpdf: gating rejection with its feature | rejection:canary:planted-rejection | true |
| verdict row measured -> NOT-RUN | real row invoice PDF-Q1 oracles:qpdf: gating regression | regression | true |
| WPT flagged pass lost | real flagged pass css/CSS2/backgrounds/background-applies-to-015.xht: reported, not gating, counts.flaggedPassLost 1 | reported/false; flaggedPassLost 1; verdict PASS | true |
| DEBT rules i/ii: uncovered, within ceiling, beyond ceiling | no entry -> head-regression (gates); ceiling = value -> debt (not gating); ceiling below value -> debt-exceeded (gates) | head-regression/true; debt/false; debt-exceeded/true | true |
| DEBT rule v: compensator pass deleted | entry names a pass absent from the run's passes (auto_table_compact_columns, table_percent_widths) -> debt-regate (gates) | debt-regate/true | true |
| DEBT rule iii: ceiling raised, entry added, entry dropped early | each transition reports a problem; removal at closesAt (control) reports none | raised 2, grown 4, dropped 1, closed-at-closesAt 0 | true |
| DEBT rule iv: vellora-owned entry without a retirement step | a problem naming closesAt | CANARY-1: owner vellora:pagination is vellora's: closesAt must name a retirement step (NN-name) | true |
| DEBT rule vi: displaced words not collapsed | two entries on one page-count criterion -> problem; a per-word entry inside a page scope -> problem; a page-1 word next to a scope from page 2 (control) -> none | twice 2, per-word 1, control 0 | true |
| relaxed (b): \|run\| > \|N0\|, unnamed compensator, no owner | each reports a problem; a valid entry (control) reports none | good 0, worse 2, unnamed 1, no owner 1 | true |
| layer-vector: word mapping misaligned by three fragments | position check share within 3 px: control >= 0.95, misaligned < 0.5 (a shift by one fragment reads 0.55 on this fixture: neighbouring lines share x; the check catches shifts of two or more) | control 1, misaligned 0.233 | true |
| layer-vector: planted +3 px pass step | the planted pass (table_percent_widths) appears as a non-zero vellora step of the word; the unplanted word (control) has none | planted [table_percent_widths, run], control [] | true |
| pdf-probe: a word crosses Chrome (I1) | real word boleto p1\|RECIBO#1: dy 0.35 -> -1.15 pt regression (gates); 0.9 -> -0.9 within-tolerance, withinToleranceBetter 0; control 3 -> 1.5 improvement | through regression/true; flip within-tolerance, better 0; control improvement | true |
| DEBT rule iii without --debt-base (I2) | base = DEBT.json at the merge base; a raised ceiling -> problem; no merge-base -> refusal; no ledger there -> first population | problems 2; no merge-base refused; absent first population | true |
| GATE-D7: new ledger key tied to the measured value (I3) | real word boleto p1\|RECIBO#1: ceiling 99 -> problem; layerVector.run != measured -> problem; measured != the run's value -> problem; exact entry (control) -> none | exact 0; ceiling 99 1; vector 1; measured 1 | true |
| declared rejection carried to the head comparison (I4) | real test css/CSS2/abspos/abspos-containing-block-initial-004a.xht rejected and declared at link 01: vs head 00 at link 02 -> declared; a declaration outside (head, current] (control) -> rejection | carried declared/false; control rejection/true | true |
| EXT-2 missing-token set: one token swapped for another | real row invoice EXT-2 pdftotext: [CanaryA, CanaryB] -> [CanaryA, CanaryC] (same count) -> CanaryC gates; unchanged list (control) -> nothing | swapped [CanaryC]; control 0 | true |
| pdf-probe: a word moved below the page (off-page) | real word boleto p1\|RECIBO#1 section: an unpaired vellora word drawn at y 900 pt (outside the page) -> pdf-probe\|boleto\|off-page\|CanaryOff gates; the same off-page word on both sides (control) -> nothing | moved regression/true; control 0 | true |
| WPT pass -> fail route (GATE-A3) | real clean pass css/CSS2/abspos/static-fixed-inside-abspos.html -> fail: raw Blitz fails the same way -> b; raw passes -> c; no raw outcome -> c; old page count != Chrome's -> a; a DEBT key with the run's rawOutcome passes GATE-D7, one with another does not | routes {"b":"b","c1":"c","c2":"c","a":"a"}; D7 ok 0, D7 wrong rawOutcome 1 | true |
| DEBT rule vi': listed page scope on an unchanged page metric (rule i, 2026-10-27) | page delta 1 (= head): listed p2 word -> debt; page-1 word -> head-regression; page delta 1 -> 2 -> metric and word debt-exceeded; page delta 0 -> listed word head-regression; D7: exact entry none, head 1 / run 2 a problem, ceiling 2 a problem; ledger shape none | p2 debt/false; p1 head-regression/true; 1->2 word debt-exceeded/true metric debt-exceeded/true; 0 head-regression/true; D7 ok 0, moved 3, slack 1; shape 0 | true |
| DEBT rule vi': a listed page scope binds no moved page metric and no page-1 word | page metric a head item (1 -> 2) entered with measured = ceiling = 2 -> a problem; fromPage 1 listing the page-1 word -> a ledger problem; exact entry -> none | moved metric 1; fromPage 1 1; exact D7 0, shape 0 | true |
| rule (ii): shared run tolerance on a DANFE-L1 position-mm vector | DANFE-L1d as measured (P -> run +0.626 px) -> none; +0.6 px layout step unnamed -> problem; named -> problem (\|P\| > \|N0\| + 0.5); +1.5 px P -> run with run named -> problem (\|run\| > \|N0\| + 1.333) | control 0; layout unnamed 2, named 1; P->run +1.5 1 | true |

## Pin view vs fidelity/baselines/pin (GATE-H3): merge to main BLOCKED (reported; --main makes (c) gate)

(a) accepted artefacts 0, (b) ledger debt 93, (c) neither 193, declared rejections 10.

| group | key | before | after | tolerance | detail |
|---|---|---|---|---|---|
| wpt css/CSS2/abspos | `wpt\|css/CSS2/abspos/between-float-and-text.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-applies-to-009.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/clear-float-005.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats-clear | `wpt\|css/CSS2/floats-clear/floats-153.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-in-inline-anonymous-block-with-overflow-hidden.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-2.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/float-nowrap-8.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-001a.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/floats-placement-vertical-003.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/floats | `wpt\|css/CSS2/floats/zero-width-floats.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-012.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/after-content-display-013.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-012.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/generated-content | `wpt\|css/CSS2/generated-content/before-content-display-013.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/linebox | `wpt\|css/CSS2/linebox/baseline-block-with-overflow-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/block-in-inline-float-between-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/normal-flow | `wpt\|css/CSS2/normal-flow/inline-table-zorder-001.xht` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/CSS2/visuren | `wpt\|css/CSS2/visuren/float-inside-inline-between-blocks-1.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/flex-fragmented-with-float-descendant-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-054.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-055.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/flexbox/multi-line-column-flex-fragmentation-058.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-break | `wpt\|css/css-break/ruby-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-page | `wpt\|css/css-page/monolithic-overflow-014-print.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/hanging-punctuation/hanging-punctuation-first-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-002.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/tab-size/tab-size-integer-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-align/text-align-end-006.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-003.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/text-justify/text-justify-and-trailing-spaces-004.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| wpt css/css-text | `wpt\|css/css-text/white-space/text-wrap-balance-text-indent-001.html` | pass | fail |  | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): pass -> fail (clean pass lost) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0042#2\|dy` | -6.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0042" dy -6.47 -> 1.1 pt: moved 7.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|/#4\|dy` | -6.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "/" dy -6.47 -> 1.1 pt: moved 7.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00012345-6#2\|dy` | -6.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00012345-6" dy -6.47 -> 1.1 pt: moved 7.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|22/06/2026#1\|dy` | -4.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22/06/2026" dy -4.97 -> 1.1 pt: moved 6.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DOC-00042#1\|dy` | -4.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DOC-00042" dy -4.97 -> 1.1 pt: moved 6.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|DM#1\|dy` | -4.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DM" dy -4.97 -> 1.1 pt: moved 6.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|00000000000123456-7#2\|dy` | -4.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "00000000000123456-7" dy -4.97 -> 1.1 pt: moved 6.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|17#1\|dy` | -3.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "17" dy -3.47 -> 1.1 pt: moved 4.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#2\|dy` | -3.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" dy -3.47 -> 1.1 pt: moved 4.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1#3\|dy` | -3.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" dy -3.47 -> 1.1 pt: moved 4.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#3\|dy` | -3.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" dy -3.47 -> 1.1 pt: moved 4.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|1.842,50#2\|dy` | -3.47 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1.842,50" dy -3.47 -> 1.1 pt: moved 4.57 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|•#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "•" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Não#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Não" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|receber#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "receber" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|após#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "após" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|30#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|dias#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "dias" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|do#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "do" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|vencimento.#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "vencimento." dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#4\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|0,00#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|Desconto#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Desconto" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|de#7\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|R$#6\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "R$" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|92,13#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "92,13" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|para#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "para" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|pagamento#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "pagamento" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|até#2\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "até" dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|boleto\|p1\|05/07/2026.#1\|dy` | -1.97 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "05/07/2026." dy -1.97 -> 1.1 pt: moved 3.07 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|no#2\|dx` | -4.76 | 1.07 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "no" dx -4.76 -> 1.07 pt: moved 5.83 pt (> 1) and ends 1.07 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|21.773,40#3\|dx` | -7.36 | 1.19 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "21.773,40" dx -7.36 -> 1.19 pt: moved 8.55 pt (> 1) and ends 1.19 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#5\|dy` | -3.26 | 1.24 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dy -3.26 -> 1.24 pt: moved 4.5 pt (> 1) and ends 1.24 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|18,00#8\|dy` | -1.72 | 1.28 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18,00" dy -1.72 -> 1.28 pt: moved 3 pt (> 1) and ends 1.28 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|0,00#23\|dy` | -1.72 | 1.28 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "0,00" dy -1.72 -> 1.28 pt: moved 3 pt (> 1) and ends 1.28 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|danfe\|p1\|com#3\|dy` | -12.96 | 1.29 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "com" dy -12.96 -> 1.29 pt: moved 14.25 pt (> 1) and ends 1.29 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|São#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "São" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Paulo#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Paulo" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#2\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|SP#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SP" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Avenida#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Avenida" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Central,#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Central," dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|4500#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "4500" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|—#3\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|Conjunto#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Conjunto" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|faturamento@acmewidgets.example#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "faturamento@acmewidgets.example" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|CNPJ#2\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CNPJ" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|98.765.432/0001-21#1\|dy` | -1.3 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "98.765.432/0001-21" dy -1.3 -> 1.1 pt: moved 2.4 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|invoice\|p1\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|40#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|25#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "25" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|18#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|60#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "60" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|120#1\|dx` | 1.2 | 4.43 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "120" \|dx\| 1.2 -> 4.43 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|22#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|44#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "44" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|12#2\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|24#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "24" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p1\|8#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|10#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "10" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|6#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "6" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|14#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "14" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|20#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "20" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|5#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|35#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "35" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|50#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "50" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|28#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "28" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|56#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "56" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|16#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "16" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|64#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "64" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|18#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "18" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|22#2\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "22" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|15#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "15" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|40#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "40" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p2\|8#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "8" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|QTD.#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD." \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|30#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "30" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|12#1\|dx` | 1.2 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "12" \|dx\| 1.2 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|5#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "5" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|1#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|invoice\|p3\|2#1\|dx` | 1.21 | 4.42 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2" \|dx\| 1.21 -> 4.42 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Invoice#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Invoice" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|#:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "#:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|123#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "123" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Created:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Created:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|January#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "January" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1," \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2023" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Due:#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Due:" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|February#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "February" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|1,#2\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "1," \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|2023#2\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2023" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Acme#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Acme" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Corp.#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Corp." \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|John#1\|dx` | -0.22 | -1.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "John" \|dx\| 0.22 -> 1.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|Doe#1\|dx` | -0.22 | -1.72 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Doe" \|dx\| 0.22 -> 1.72 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|oss-sparksuite-invoice\|p1\|john@example.com#1\|dx` | -0.23 | -1.73 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "john@example.com" \|dx\| 0.23 -> 1.73 pt vs Chrome (baseline) |
| pdf-probe | `pdf-probe\|receipt\|p1\|DESCRIÇÃO#1\|dy` | -1.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "DESCRIÇÃO" dy -1.12 -> 1.1 pt: moved 2.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|QTD#1\|dy` | -1.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "QTD" dy -1.12 -> 1.1 pt: moved 2.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|UNITÁRIO#1\|dy` | -1.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "UNITÁRIO" dy -1.12 -> 1.1 pt: moved 2.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|TOTAL#1\|dy` | -1.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "TOTAL" dy -1.12 -> 1.1 pt: moved 2.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|SKU#1\|dy` | -1.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "SKU" dy -1.12 -> 1.1 pt: moved 2.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|receipt\|p1\|CAF-ESP-002#1\|dy` | -1.12 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "CAF-ESP-002" dy -1.12 -> 1.1 pt: moved 2.22 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#6\|dy` | -12.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -12.4 -> 1.1 pt: moved 13.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#9\|dy` | -7.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -7.9 -> 1.1 pt: moved 9 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#13\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#15\|dy` | -15.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 1.1 pt: moved 16.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|em#6\|dy` | -16.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "em" dy -16.9 -> 1.1 pt: moved 18 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p2\|de#28\|dy` | -28.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -28.15 -> 1.85 pt: moved 30 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|Lançamentos#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#2\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|2026#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|—#2\|dy` | -17.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -17.65 -> 1.1 pt: moved 18.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#9\|dy` | -1.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -1.15 -> 1.1 pt: moved 2.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#11\|dy` | -4.9 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.9 -> 1.85 pt: moved 6.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p3\|de#16\|dy` | -15.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 1.85 pt: moved 17.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|Lançamentos#1\|dy` | -4.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -4.9 -> 1.1 pt: moved 6 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#1\|dy` | -4.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.9 -> 1.1 pt: moved 6 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#2\|dy` | -4.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.9 -> 1.1 pt: moved 6 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|2026#1\|dy` | -4.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -4.9 -> 1.1 pt: moved 6 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#4\|dy` | -19.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -19.9 -> 1.1 pt: moved 21 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#14\|dy` | -5.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -5.65 -> 1.1 pt: moved 6.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#15\|dy` | -2.65 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -2.65 -> 1.85 pt: moved 4.5 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#17\|dy` | -12.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -12.4 -> 1.85 pt: moved 14.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#18\|dy` | -2.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -2.65 -> 1.1 pt: moved 3.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#19\|dy` | -19.9 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -19.9 -> 1.85 pt: moved 21.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p4\|de#20\|dy` | -16.9 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -16.9 -> 1.85 pt: moved 18.75 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Lançamentos#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#2\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|2026#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#7\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#9\|dy` | -2.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -2.65 -> 1.1 pt: moved 3.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#11\|dy` | -9.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -9.4 -> 1.1 pt: moved 10.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|Lançamentos#2\|dy` | -25.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -25.15 -> 1.1 pt: moved 26.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#13\|dy` | -25.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -25.15 -> 1.1 pt: moved 26.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#14\|dy` | -25.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -25.15 -> 1.1 pt: moved 26.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|2026#2\|dy` | -25.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -25.15 -> 1.1 pt: moved 26.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|de#18\|dy` | -6.4 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -6.4 -> 1.85 pt: moved 8.25 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p5\|—#9\|dy` | -10.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -10.15 -> 1.85 pt: moved 12 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#1\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#7\|dy` | -7.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -7.15 -> 1.1 pt: moved 8.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#10\|dy` | -8.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -8.65 -> 1.1 pt: moved 9.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#7\|dy` | -4.15 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -4.15 -> 1.1 pt: moved 5.25 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|—#8\|dy` | -2.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "—" dy -2.65 -> 1.1 pt: moved 3.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#12\|dy` | -2.65 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -2.65 -> 1.1 pt: moved 3.75 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|Lançamentos#2\|dy` | -13.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "Lançamentos" dy -13.9 -> 1.1 pt: moved 15 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#13\|dy` | -13.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -13.9 -> 1.1 pt: moved 15 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|2026#2\|dy` | -13.9 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "2026" dy -13.9 -> 1.1 pt: moved 15 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#25\|dy` | -15.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 1.1 pt: moved 16.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#26\|dy` | -15.4 | 1.1 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -15.4 -> 1.1 pt: moved 16.5 pt (> 1) and ends 1.1 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p6\|de#29\|dy` | -7.15 | 1.85 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -7.15 -> 1.85 pt: moved 9 pt (> 1) and ends 1.85 pt from Chrome (> 1) (I1) |
| pdf-probe | `pdf-probe\|text-stress-ptbr\|p7\|de#5\|dy` | -20.65 | 1.03 | 1 pdf-probe-pt | worse than the chain head beyond tolerance and no DEBT.json entry covers it (rule i): "de" dy -20.65 -> 1.03 pt: moved 21.68 pt (> 1) and ends 1.03 pt from Chrome (> 1) (I1) |

## WPT per directory (pass / clean pass)

| directory | pass before | pass after | clean before | clean after |
|---|---|---|---|---|
| css/CSS2/abspos | 2 | 2 | 2 | 2 |
| css/CSS2/backgrounds | 175 | 175 | 67 | 67 |
| css/CSS2/borders | 383 | 409 | 354 | 396 |
| css/CSS2/box | 4 | 4 | 0 | 0 |
| css/CSS2/box-display | 66 | 66 | 66 | 66 |
| css/CSS2/colors | 10 | 10 | 10 | 10 |
| css/CSS2/floats | 19 | 19 | 16 | 16 |
| css/CSS2/floats-clear | 38 | 38 | 33 | 33 |
| css/CSS2/fonts | 135 | 135 | 135 | 135 |
| css/CSS2/generated-content | 82 | 82 | 78 | 78 |
| css/CSS2/linebox | 150 | 151 | 148 | 149 |
| css/CSS2/lists | 67 | 67 | 40 | 40 |
| css/CSS2/margin-padding-clear | 527 | 527 | 510 | 510 |
| css/CSS2/normal-flow | 443 | 444 | 417 | 418 |
| css/CSS2/pagination | 34 | 34 | 32 | 32 |
| css/CSS2/positioning | 361 | 361 | 359 | 359 |
| css/CSS2/tables | 77 | 94 | 74 | 89 |
| css/CSS2/text | 250 | 250 | 241 | 241 |
| css/CSS2/visudet | 14 | 14 | 9 | 9 |
| css/CSS2/visufx | 2 | 2 | 2 | 2 |
| css/CSS2/visuren | 6 | 6 | 6 | 6 |
| css/css-break | 115 | 115 | 81 | 81 |
| css/css-page | 70 | 70 | 55 | 55 |
| css/css-tables | 47 | 60 | 38 | 55 |
| css/css-text | 632 | 634 | 379 | 379 |

## Per group

| group | classes |
|---|---|
| corpus BOL-R | improvement 4 |
| corpus DANFE-L | improvement 5 |
| corpus DANFE-M | improvement 3 |
| corpus DANFE-P | improvement 2 |
| corpus DANFE-R | improvement 1, newly-measured 1 |
| corpus LET- | improvement 1 |
| corpus TXT-A | improvement 1 |
| corpus TXT-P | improvement 2 |
| oracles:layout LET-1 | improvement 2 |
| oracles:layout REF-P | improvement 4 |
| oracles:layout REF-W | improvement 18 |
| oracles:text EXT-2 | improvement 4 |
| pdf-probe | within-tolerance 677, improvement 1784, newly-measured 1122, regression 127 |
| wpt css/CSS2/borders | improvement 42, reported 16 |
| wpt css/CSS2/linebox | improvement 1 |
| wpt css/CSS2/normal-flow | improvement 1 |
| wpt css/CSS2/tables | improvement 17 |
| wpt css/css-tables | improvement 17, reported 1 |
| wpt css/css-text | improvement 2 |

## Tolerances

| class | tolerance | label | rationale |
|---|---|---|---|
| position-mm | 0.1 mm | DESIGN TARGET | word/anchor position error vs a reference (REF-W max/p95, REF-R worst anchor, DANFE-L1, LET-1). 0.1 mm (0.28 pt, 0.38 CSS px) is 10x the 0.01 mm the values are reported with and below one CSS px (0.26 mm), the smallest step a px-snapping layout can move; the measurement is deterministic for one build and one reference (CONFIRMED: equal inputs gave equal values in the Phase A repeat run). |
| geometry-excess-mm | 0.05 mm | DESIGN TARGET | distance OUTSIDE a specification window (BOL-G*, DANFE-B*, DANFE-M1, TXT-A1). Inside the window the spec admits any value, so only the excess is ratcheted; 0.05 mm is about one 600 dpi raster pixel (0.042 mm), the measurement quantum of measure_bars.py / the page ink box. |
| font-excess-pt | 0.05 pt | SPEC-derived tolerance unit | font-size excess outside a window; 0.05 pt is the tolerance ACCEPTANCE.md already applies to every font-size criterion (BOL-T*, DANFE-F*). |
| count | 0 count | DESIGN TARGET | integer counts from deterministic tools (required strings found, extractor missing/extra tokens, segments/glyphs attributed, decoded symbols): any loss is a real change of the document. |
| page-delta | 0 pages | DESIGN TARGET | \|vellora pages - reference pages\|: a page break moving is never noise. |
| pdf-probe-pt | 1 pt | DESIGN TARGET | per-word \|dx\| / \|dy\| of vellora's PDF vs Chrome's PDF (pdf-probe semantics 2: PyMuPDF pen origin and baseline, same-page position pairs keyed by the Chrome word). 1 pt (0.35 mm) is an order of magnitude below the Phase A regressions it must catch (invoice price column +9 pt, notification signature -14 pt) and above the 0.01 pt rounding of the probe and sub-px snapping differences. The per-fixture unpaired-word counts use the count class. |

