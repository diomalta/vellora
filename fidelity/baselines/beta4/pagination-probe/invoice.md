# Pagination probe: invoice (pin vs beta4)

> SCRATCH instrumentation (eprintln! in a throw-away copy of pagination.rs), never committed to crates/. CSS px. offset_vs_flow = placed_at - Blitz flow top (page 1 only); gap_used = pagination's inter-fragment gap (previous fragment's trailing_gap, zeroed at page tops); flow_gap = this fragment's flow top - previous fragment's flow bottom.

| # | fragment root (pin) | pin flow gap | pin gap used | pin offset | beta4 flow gap | beta4 gap used | beta4 offset | Δ offset |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | body>table:nth-child(1) |  | 0 | 3 |  | 0 | 0 | -3 |
| 1 | body>table:nth-child(2) | 38 | 37.795 | 2.795 | 38 | 37.795 | -0.205 | -3 |
| 2 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(1) | 74 | 34.016 | -37.189 | 71 | 34.016 | -37.189 | 0 |
| 3 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(2) | 2 | 0 | -2.189 | 0 | 0 | -0.189 | 2 |
| 4 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(3) | 4 | 0 | -6.189 | 0 | 0 | -0.189 | 6 |
| 5 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(4) | 2 | 0 | -8.189 | 0 | 0 | -0.189 | 8 |
| 6 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(5) | 4 | 0 | -12.189 | 0 | 0 | -0.189 | 12 |
| 7 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(6) | 3 | 0 | -15.189 | 0 | 0 | -0.189 | 15 |
| 8 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(7) | 3 | 0 | -18.189 | 0 | 0 | -0.189 | 18 |
| 9 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(8) | 3 | 0 | -21.189 | 0 | 0 | -0.189 | 21 |
| 10 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(9) | 2 | 0 | -23.189 | 0 | 0 | -0.189 | 23 |
| 11 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(10) | 4 | 0 | -27.189 | 0 | 0 | -0.189 | 27 |
| 12 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(11) | 2 | 0 | -29.189 | 0 | 0 | -0.189 | 29 |
| 13 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(12) |  | 0 |  |  | 0 |  |  |
| 14 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(13) | 3 | 0 |  | 0 | 0 |  |  |
| 15 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(14) | 3 | 0 |  | 0 | 0 |  |  |
| 16 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(15) | 3 | 0 |  | 0 | 0 |  |  |
| 17 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(16) | 3 | 0 |  | 0 | 0 |  |  |
| 18 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(17) | 3 | 0 |  | 0 | 0 |  |  |
| 19 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(18) | 2 | 0 |  | 0 | 0 |  |  |
| 20 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(19) | 4 | 0 |  | 0 | 0 |  |  |
| 21 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(20) | 3 | 0 |  | 0 | 0 |  |  |
| 22 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(21) | 3 | 0 |  | 0 | 0 |  |  |
| 23 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(22) | 3 | 0 |  | 0 | 0 |  |  |
| 24 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(23) | 3 | 0 |  | 0 | 0 |  |  |
| 25 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(24) | 3 | 0 |  | 0 | 0 |  |  |
| 26 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(25) | 2 | 0 |  | 0 | 0 |  |  |
| 27 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(26) | 4 | 0 |  | 0 | 0 |  |  |
| 28 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(27) | 3 | 0 |  | 0 | 0 |  |  |
| 29 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(28) | 3 | 0 |  | 0 | 0 |  |  |
| 30 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(29) | 3 | 0 |  | 0 | 0 |  |  |
| 31 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(30) |  | 0 |  |  | 0 |  |  |
| 32 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(31) | 3 | 0 |  | 0 | 0 |  |  |
| 33 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(32) | 2 | 0 |  | 0 | 0 |  |  |
| 34 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(33) | 4 | 0 |  | 0 | 0 |  |  |
| 35 | body>table:nth-child(3)>tbody:nth-child(2)>tr:nth-child(34) | 3 | 0 |  | 0 | 0 |  |  |
| 36 | body>table:nth-child(4) | 27 | 27 |  | 30 | 30 |  |  |
| 37 | body>div:nth-child(5) | 38 | 38 |  | 38 | 38 |  |  |
