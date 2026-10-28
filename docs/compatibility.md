---
title: Will my template work?
description: What HTML and CSS vellora renders to PDF, what it rejects, and what to do when your template uses something unsupported.
---

# Will my template work?

vellora renders the HTML and CSS that documents use: text, tables, page rules, images and fonts.
When a template uses something outside that, it doesn't guess. It stops and tells you where.

<FitCheck
  :works="[
    'Text, headings, lists and tables',
    'Tables over several pages, with the header row repeated',
    'Page size and margins from @page',
    'Page X of Y in headers and footers',
    'Page breaks before, after or inside blocks and table rows',
    'CSS in a style tag or a style attribute',
    'Images and fonts you pass in as bytes, or images as data: URLs',
    '@media print rules',
    'PDF/A-2b for archiving',
  ]"
  :limits="[
    'Flexbox: common layouts work; tables are the safer choice',
    'Floats and multi-column text, with a few edge cases',
    'Headers and footers only in the top-center and bottom-center slots',
    'Inline SVG draws, but the page’s CSS doesn’t style the SVG',
  ]"
  :unsupported="[
    'JavaScript: script tags are rejected, the page never runs',
    'CSS grid, transform, animation, transition and filter',
    'External stylesheets (link rel=stylesheet, @import): skipped without an error',
    'Remote images and @font-face URLs: nothing is fetched',
    'Forms, iframes, canvas, video and audio',
    'Windows and Alpine Linux',
  ]"
/>

A few rarer limits, and the details for each item, are in [The full list](#the-full-list) below.

## When something is unsupported, you get the line and column

Say your template has `<p style="transform: rotate(1deg)">`. `renderPdf` rejects it before making a
PDF:

```txt
VelloraUnsupportedError: Unsupported construct "css:transform" at line 1, column 11: this CSS feature is outside vellora's document subset; run `vellora fix`
```

The error also carries the same details as properties, so your code or your CI can read them:

```js
import { renderPdf, VelloraUnsupportedError } from "vellora";

try {
  await renderPdf('<p style="transform: rotate(1deg)">Hi</p>');
} catch (err) {
  if (err instanceof VelloraUnsupportedError) {
    console.log(err.feature, err.line, err.col); // css:transform 1 11
  }
}
```

You find out on your machine, when you render the template, not from a customer who got a broken
PDF.

## Where your CSS, images and fonts come from

vellora loads nothing from the network or the disk on its own. Everything the PDF needs is in the
HTML string or in the render options:

- **CSS** goes in a `<style>` tag or a `style=""` attribute. A `<link rel="stylesheet">` or
  `@import url(...)` is skipped, with no error, so the PDF comes out unstyled.
- **Images** are `data:` URLs, or bytes you pass in the `images` option, keyed by the `src` in your
  HTML. See [Logos & images](/guide/images).
- **Fonts** are bytes you pass in the `fonts` option, used by the family name inside the font file.
  vellora also bundles its own fonts and never uses the fonts installed on the machine. See
  [Fonts](/guide/fonts).

```js
import { readFileSync } from "node:fs";
import { renderPdf } from "vellora";

const logoUrl = "https://cdn.example.com/logo.png";
const html = `<style>body { font-family: "Inter"; }</style>
<img src="${logoUrl}" width="120" height="40">
<h1>Invoice</h1>`;

const pdf = await renderPdf(html, {}, {
  images: { [logoUrl]: new Uint8Array(await (await fetch(logoUrl)).arrayBuffer()) },
  fonts: [readFileSync("Inter-Regular.ttf")],
});
```

## My template uses X. What now?

| Your template has | What to do |
| --- | --- |
| CSS grid | Rewrite that part with a table (or flexbox for simple rows). For `display: grid` or `display: flex` on a table cell, `vellora fix` (or `strict: false`) rewrites it into a nested table for you. |
| `transform`, animations, transitions, filters | Remove them. Animations and transitions do nothing on paper anyway. For a rotated stamp or a filtered logo, use an image of it. |
| JavaScript that fills in values or draws a chart | Compute the values in Node and pass them as `data`. Draw charts as inline SVG or pass them as images. |
| A remote image URL | Fetch it yourself and pass the bytes in `images`, keyed by that URL. |
| `@font-face` with a URL | Pass the font file's bytes in `fonts` and use the family name inside the file. |
| A CDN stylesheet (Tailwind, Bootstrap) | Inline the built CSS in a `<style>` tag. |
| HTML already rendered by another engine, with literal <code v-pre>{{</code> or `{%` in it | vellora's templating always runs, so that text is read as template syntax. There is no escape tag today; remove or replace those characters before rendering. |
| A header or footer in a corner slot (`@top-left`, `@bottom-right`, …) | Move it to `@top-center` or `@bottom-center`. |
| Something that really needs a browser | Send that one template to Chrome with the [optional Chromium engine](/guide/chromium-engine). Keep the rest native. |

## Fix it automatically, or check it in CI

The error hint says `run vellora fix`. The fixer handles a few patterns: grid or flex on a table
cell, images without a size, inline SVG it can turn into an image, and broken markup. Most other
rejections, like `transform`, you remove by hand.

- **`strict: false`** runs the same fixers on the HTML before rendering. The default,
  `strict: true`, never changes your HTML.

  ```js
  const pdf = await renderPdf(html, data, { strict: false });
  ```

- **`vellora lint` and `vellora fix`** from [`@vellora/cli`](https://www.npmjs.com/package/@vellora/cli)
  (0.3.2 or newer) check or rewrite template files in CI. The lint does not catch everything the
  renderer rejects (an inline `transform`, for example), so the surest CI check is a strict
  `renderPdf` of each template with sample data.

## The full list

A few more limits that only some templates hit:

- **Page breaks:** `break-before`, `break-after` and `break-inside: avoid` work on blocks, wrappers
  and table rows. `orphans` and `widows` are ignored.
- **`@page :first`, `:left` and `:right`** work if they don’t change the left or right margin.
- **Named pages** (`page: name`) start a new page, but their own `@page` rules are ignored.
- **A block taller than a page** splits across pages, mostly as Chrome does.
- **Inline SVG:** shapes, paths, gradients and text draw; the page’s own CSS doesn’t style SVG
  elements.

Every element and CSS feature, with its exact status and notes, is in
[COMPATIBILITY.md](https://github.com/diomalta/vellora/blob/main/COMPATIBILITY.md). It is generated
from the renderer's source and checked in CI, so it matches what the code accepts.

**Next:** [Check one of your templates with the migration script →](/migrating#check-a-template)
