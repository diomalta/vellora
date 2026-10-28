---
"@vellora/cli": patch
---

Fix the installed `vellora` command doing nothing. npm links the bin to `dist/cli.js`, and the CLI compared the link path with its own path, so `npx @vellora/cli` and a global install exited 0 without running.
