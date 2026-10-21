# Layout diff summary (beta4)

> Continuous-flow comparison: Chromium lays the document out as ONE flow (no fragmentation) at the same viewport width vellora hands Blitz. It is comparable ONLY to vellora's PRE-pagination layers (B0, L0, layout_normalize passes) and says nothing about pagination (page breaks, repeated thead, page-local offsets, margin boxes).

- date: `2026-10-21T01:07:44Z`; blitz: `blitz-0.3.0-beta.4`; commit: `a704aa14767d2424b3e0097a0c2402867eba39e3` (dirty); chrome: `Google Chrome 155.0.8059.85`; node: `v22.23.2`; rustc: `rustc 1.96.0 (ac68faa20 2026-05-25)`
- command: `node /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/layout-diff/run.mjs --label beta4 --dump-repo /Users/diomalta/Repositories/vellora/.claude/worktrees/wf_e3d702d1-528-2/fidelity/.cache/beta4`

| fixture | first divergent box (final layer) | Δ | introduced by | first divergent text run | text Δ (dx, dy) | introduced by | matched boxes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| invoice | enter (x/y/width) body>table:nth-child(1)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0, -10.47 | B0 | text "EMITENTE" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>div:nth-child(1) | 1.11, -1.14 | L0 | 220/304 |
| receipt | exit (height) body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.56 | B0 | text "CEP 01001-000" in body>div:nth-child(1)>header:nth-child(1)>address:nth-child(4) | -0.12, 0.67 | L0 | 62/95 |
| boleto | exit (height) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | -1.08 | B0 | text "999-9" in body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(2) | -1.62, -12.44 | L0 | 82/175 |
| notification | enter (x/y/width) body>table:nth-child(2)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1) | 0, 0.09, -18.56 | B0 | text "Acme Serviços Prediais Ltda." in body>div:nth-child(1)>div:nth-child(1) | 0, 1 | L0 | 34/42 |
