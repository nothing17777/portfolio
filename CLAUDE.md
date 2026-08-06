# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Tim Zhang's personal portfolio site. Plain static HTML/CSS/JS — no build step, no package manager, no tests, no dependencies. Deployed via GitHub Pages from the `main` branch root (project site at `https://nothing17777.github.io/portfolio`).

## Running it

Open `index.html` directly in a browser, or serve the root for correct relative paths:

```bash
python3 -m http.server 8000   # then http://localhost:8000
```

There is nothing to build, lint, or test. Pushing to `main` deploys.

## Structure and conventions

- `index.html` — the entire main page. All content is literal text in `<h3>`/`<p>`/`<li>`; edit it directly, there is no templating.
- `styles.css` — the *only* stylesheet, shared by `index.html` and every write-up page. Design tokens (colors, fonts, `--measure`, `--edge`) are CSS custom properties in `:root` at the top; retheme there rather than editing individual rules. Roughly the first ~360 lines style the main page; from `.writeup-nav` (~line 363) down styles the write-up pages.
- `write-ups/*.html` — one standalone long-form page per academic project. They are hand-written HTML that link back with `../styles.css` and `../index.html#projects`, and reuse the `writeup-*` class family (`writeup-nav`, `writeup-header`, `writeup-body`, `writeup-section`, `writeup-figure`, `writeup-figrow`, `writeup-note`, `writeup-footer`). Copy an existing write-up as the template for a new one.
- `notebooks/*.ipynb` — the source Jupyter notebooks behind the academic projects. Linked from `index.html` via absolute GitHub blob URLs, not relative paths.
- `assets/write-ups/` — figures exported from the notebooks, embedded in write-ups. `assets/previews/` — screenshots of the deployed side projects. `assets/resume.pdf` — linked from nav and hero; replace the file in place, no HTML edit needed.
- `script.js` — self-invoking IIFE driving the hero `<canvas id="field">` particle/correspondence animation. Bails out if the canvas is absent (so it is harmless on any page), and respects `prefers-reduced-motion` by rendering a single static frame instead of running the rAF loop. Its `INK`/`ACCENT` constants duplicate the CSS token values as `"r, g, b"` strings — change both together.

## Content conventions

- Each project in `index.html` is an `<article class="project">`: meta tags → `<h3>` → optional `.project-preview` image → summary `<p>` → `<ul class="findings">` of concrete results → `.project-links`. Side projects link Live/GitHub; academic projects link Write-up/Notebook.
- Sections are anchored (`#projects`, `#side-projects`, `#coursework`, `#experience`) and referenced by the top nav — keep IDs in sync when adding sections.
- Prose uses HTML entities (`&mdash;`, `&times;`, `&amp;`). Note: `index.html` currently has three spots where an em dash was mangled into a literal `2014` (from a broken `—` escape) — fix these to `&mdash;` if you touch those lines, and don't introduce more.

## Deliverables

- When a task produces a viewable file (HTML report, generated page, screenshot, PDF), open it automatically with `open <path>` when the work finishes — don't just print the path.
