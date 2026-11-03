---
"vellora": minor
"@vellora/cli": minor
---

Pre-rendered HTML with a literal `{{` or `{%` no longer breaks the render (#58). `renderPdf`, `renderPdfBatch` and `renderPdfToStream` accept `template: false`, which passes the HTML to the renderer untouched; passing `data` with it rejects with `VelloraInputError` instead of being silently ignored. The CLI gets the matching `vellora render --no-template` flag. Templates can also protect one part with `{% raw %}…{% endraw %}`, whose content is emitted verbatim (raw blocks do not nest; an unterminated or stray tag rejects with a located `VelloraTemplateError`).
