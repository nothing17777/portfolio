---
name: portfolio-content
description: Use when adding, editing or removing content on Tim Zhang's portfolio site — a project or side project card, a write-up page, a certificate, coursework or experience entry, or a preview screenshot. Covers the exact HTML shapes, asset conventions and the deploy step.
---

# Editing the portfolio

Static site, no build step, no tests. `index.html` is the whole main page and all content is
literal HTML — edit it directly. Pushing to `main` deploys to
`https://nothing17777.github.io/portfolio`.

Verify with `python3 -m http.server 8000` from the repo root and `open http://localhost:8000`.

## Adding a project card

Both `#projects` (academic) and `#side-projects` use the same `<article class="project">` shape.
Copy the nearest existing card rather than writing one from scratch. Order within a section is
newest/strongest first.

```html
<article class="project">
  <div class="project-meta">
    <span class="tag">Personal Project</span>          <!-- or the course code + name -->
    <span class="tag mono">Next.js · TypeScript</span> <!-- stack, middot-separated -->
  </div>
  <h3>Project Name</h3>
  <a class="project-preview" href="<live-url>" target="_blank" rel="noopener">
    <img src="assets/previews/preview-<slug>.jpg" alt="<what the screenshot shows>" loading="lazy">
  </a>
  <p>One paragraph: what it is and what it does.</p>
  <ul class="findings">
    <li>Three to four concrete, specific results — numbers where they exist.</li>
  </ul>
  <div class="project-links">
    <a href="<live-url>" target="_blank" rel="noopener">Live ↗</a>
    <a href="<repo-url>" target="_blank" rel="noopener">GitHub ↗</a>
  </div>
</article>
```

Rules that are easy to get wrong:
- **Omit `.project-preview` entirely** if there is no image worth showing — never ship a broken
  image or a preview that links to `#`. With no deployed site, a composed image (e.g. a
  before/after comparison from the README) linking to the repo works.
- Side projects link Live/GitHub; academic projects link Write-up/Notebook (notebooks use absolute
  GitHub blob URLs, not relative paths).
- Prose uses HTML entities: `&mdash;`, `&times;`, `&amp;`, `&ndash;`, `&rarr;`. Never a raw em dash.
- `findings` are results, not a feature list. "65.7% test accuracy, versus 55.5% at 5 epochs" beats
  "improved accuracy".

## Preview screenshots

`assets/previews/preview-<slug>.jpg`, captured from the deployed site at desktop width, top of the
page. Keep the naming pattern — nothing else references these files.

## Write-up pages

One standalone page per academic project in `write-ups/`. Copy an existing file as the template.
They link back with `../styles.css` and `../index.html#projects` and reuse the `writeup-*` class
family (`writeup-nav`, `writeup-header`, `writeup-body`, `writeup-section`, `writeup-figure`,
`writeup-figrow`, `writeup-note`, `writeup-footer`). Figures live in `assets/write-ups/`.

## Styling

`styles.css` is the only stylesheet, shared by the main page and every write-up. Design tokens are
CSS custom properties in `:root` at the top — retheme there, not in individual rules. `script.js`
duplicates the ink/accent tokens as `"r, g, b"` strings in its `INK`/`ACCENT` constants; change both
together.

## New sections

Anchor the section (`id="…"`) and add the matching link to the top nav in `index.html` — the nav is
hand-maintained and will silently drift otherwise.

## Known defect

`index.html` has spots where an em dash was mangled into a literal `2014` (a broken `&mdash;`
escape). Fix any you touch; don't introduce more.

## Shipping

```bash
git add -A && git commit -m "<what changed>" && git push
```
