# Pagination probe: notification (pin vs beta4)

> SCRATCH instrumentation (eprintln! in a throw-away copy of pagination.rs), never committed to crates/. CSS px. offset_vs_flow = placed_at - Blitz flow top (page 1 only); gap_used = pagination's inter-fragment gap (previous fragment's trailing_gap, zeroed at page tops); flow_gap = this fragment's flow top - previous fragment's flow bottom.

| # | fragment root (pin) | pin flow gap | pin gap used | pin offset | beta4 flow gap | beta4 gap used | beta4 offset | Δ offset |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | body>div:nth-child(1) |  | 0 | 0 |  | 0 | 0 | 0 |
| 1 | body>table:nth-child(2) | 21 | 24 | 3 | 24 | 24 | 0 | -3 |
| 2 | body>div:nth-child(3)>div:nth-child(1) | 21 | 21.333 | 3.333 | 21 | 21.333 | 0.333 | -3 |
| 3 | body>div:nth-child(3)>div:nth-child(2) | 3 | 4 | 4.333 | 4 | 4 | 0.333 | -4 |
| 4 | body>div:nth-child(3)>div:nth-child(3) | 1 | 1 | 4.333 | 0 | 0 | 0.333 | -4 |
| 5 | body>div:nth-child(3)>div:nth-child(4) | 0 | 0 | 4.333 | 0 | 0 | 0.333 | -4 |
| 6 | body>div:nth-child(3)>div:nth-child(5) | -1 | 0 | 5.333 | 0 | 0 | 0.333 | -5 |
| 7 | body>div:nth-child(4) | 25 | 21.333 | 1.667 | 24 | 21.333 | -2.333 | -4 |
| 8 | body>div:nth-child(5)>p:nth-child(1) | 19 | 18.667 | 1.333 | 19 | 18.667 | -2.667 | -4 |
| 9 | body>div:nth-child(5)>p:nth-child(2) | 15 | 14.667 | 1 | 14 | 14.667 | -2 | -3 |
| 10 | body>div:nth-child(5)>table:nth-child(3) | 18 | 14.667 | -2.333 | 19 | 14.667 | -6.333 | -4 |
| 11 | body>div:nth-child(5)>p:nth-child(4) | 19 | 18.667 | -2.667 | 19 | 18.667 | -6.667 | -4 |
| 12 | body>div:nth-child(5)>p:nth-child(5) | 15 | 14.667 | -3 | 14 | 14.667 | -6 | -3 |
| 13 | body>div:nth-child(5)>p:nth-child(6) | 14 | 14.667 | -2.333 | 15 | 14.667 | -6.333 | -4 |
| 14 | body>div:nth-child(6)>p:nth-child(1) | 43 | 29.333 | -16 | 43 | 14.667 | -34.667 | -18.667 |
| 15 | body>div:nth-child(6)>div:nth-child(2) | 15 | 14.667 | -16.333 | 14 | 14.672 | -33.995 | -17.662 |
| 16 | body>div:nth-child(6)>div:nth-child(3) | 5 | 5.333 | -16 | 6 | 5.333 | -34.661 | -18.661 |
| 17 | body>div:nth-child(6)>div:nth-child(4) | 0 | 0 | -16 | 0 | 0 | -34.661 | -18.661 |
| 18 | body>div:nth-child(6)>div:nth-child(5) | 0 | 0 | -16 | 0 | 0 | -34.661 | -18.661 |
