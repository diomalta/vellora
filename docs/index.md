---
layout: home

hero:
  name: vellora
  text: HTML to PDF for Node.js
  tagline: A native addon that renders your HTML to a deterministic PDF in-process — no Chromium, no Python, no Java.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API Reference
      link: /reference/
    - theme: alt
      text: View on GitHub
      link: https://github.com/diomalta/vellora

features:
  - title: No headless browser
    details: Rendering runs in-process through a native addon. No Chromium download, no subprocess, no separate runtime to install.
  - title: First PDF with one install
    details: "npm install vellora pulls a prebuilt native addon. You reach a rendered PDF without ever touching a Rust toolchain."
  - title: Strict, documented subset
    details: A strict-by-default HTML/CSS subset for generated document HTML, with fixtures that cover invoices, receipts, boletos, notifications, and similar inputs.
  - title: Deterministic output
    details: Identical inputs produce byte-identical PDFs, so output is reproducible and easy to test.
---
