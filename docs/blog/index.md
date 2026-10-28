---
title: Blog
description: Notes on turning HTML into PDFs in Node.js without a browser, and on measuring how close vellora's output gets to Chrome.
---

# Blog

Notes from building vellora: why we print PDFs without a browser, and how we check the result.

<ExampleGallery :items="[
  { src: '/compare/oss-postmark-receipt-vellora.jpg', title: 'Why we print PDFs without a browser', caption: 'Your invoice service shouldn’t need a web browser. What it costs to keep one, and what we did instead. July 2, 2026 · updated October 28, 2026', href: '/blog/html-to-pdf-nodejs-without-puppeteer', alt: 'A receipt rendered to PDF by vellora' },
  { src: '/compare/danfe-vellora.jpg', title: 'Engineering note: measuring vellora against Chrome, word by word', caption: 'How close a browserless renderer gets to Chrome on real documents, and the bugs we found and fixed, with pictures. October 28, 2026', href: '/blog/native-pdf-fidelity-blitz-beta4', alt: 'A Brazilian invoice printout (DANFE) rendered to PDF by vellora' }
]" />
