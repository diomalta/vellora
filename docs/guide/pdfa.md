# PDF/A

::: warning Planned
PDF/A conformance output is **not implemented yet**. This page documents intent only; there is no PDF/A option on the current public API.
:::

## What PDF/A is

PDF/A is an ISO-standardized subset of PDF for long-term archiving: fonts must be embedded, color must be device-independent, and external dependencies are disallowed so the document renders identically decades later.

## Current behavior

vellora's current output is a standard PDF (its bytes start with `%PDF-`) and is **deterministic** — identical inputs produce byte-identical output — but it does **not** assert PDF/A conformance. There is no flag to request PDF/A in the current API.

## Planned

PDF/A output depends on the planned font-embedding work (see [Fonts](/guide/fonts)) plus color and metadata conformance. Track the [roadmap](https://github.com/diomalta/vellora#status--roadmap) for the shipped surface.
