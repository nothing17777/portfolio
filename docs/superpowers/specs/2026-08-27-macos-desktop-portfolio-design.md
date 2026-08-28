# macOS Desktop Portfolio — Design

## Goal

Replace the current single-scroll landing page with a macOS-desktop-simulator
experience: a menu bar, a Dock, desktop icons, and draggable glass windows
that each hold one section of the existing portfolio content. Inspired by
jyothishvm.com, but skipping its virtual-machine boot sequence — the site
loads directly into a live desktop, no boot animation.

No build step. Static HTML/CSS/JS, deployed to GitHub Pages exactly as today.

## Content mapping

All content is pulled verbatim from the current `index.html` (no
placeholders) into the following windows:

| Window | Source section | Content |
|---|---|---|
| About Me | `#about` | bio paragraph |
| Projects | `#projects` | 4 CV/ML projects: preview image, write-up, findings, links to write-up + notebook |
| Side Projects | `#side-projects` | grouped by category (web tooling / league of legends / ai agents & tools), same articles |
| Tools & Automation | `#tools` | Zapier/Claude Code/Cursor blurb |
| Coursework | `#coursework` | course list |
| Certificates | `#certificates` | 4 certs, real images, verify links |
| Experience | `#experience` | timeline: SEASNet, TED Translators, Learn To Be |
| Resume | `assets/resume.pdf` | embed/link to existing PDF |
| Terminal | new | command simulator (`help`, `resume`, `about`, `projects`, `clear`, etc.) wired to open the matching window; welcome text reflects Tim's site, not "joe.exe" |
| Claude Code | new | scripted, non-interactive demo (kept as a playful simulation, no real agent calls) |
| Contact | footer mailto | form that shows a mock "sent" alert (kept as simulation, no real backend) |

## Layout

- **Menu bar** (top, full width): left side shows a wordmark (reuses `TZ`)
  and static menu labels (File, Edit, View — decorative, non-functional);
  right side shows a live clock.
- **Dock** (bottom, centered, glass): Terminal, Claude Code, Projects,
  Resume, Contact.
- **Desktop icons** (grid, top-left origin): About Me, Side Projects, Tools
  & Automation, Coursework, Certificates, Experience.
- **Windows**: macOS traffic-light chrome (close/min/max — close hides the
  window, min/max are decorative to match the template), draggable by
  header (mouse + touch), click-to-front z-index stacking, glassmorphic
  blur matching the current dark palette.

## Visual style

Reuse the current site's design tokens instead of the template's generic
blue/purple palette: fonts (Space Grotesk / Inter / JetBrains Mono, already
loaded via Google Fonts), the existing dark background and accent colors
from `styles.css`. Window content styling (project cards, cert grid,
timeline rows) is adapted from the existing section styles, not
reinvented.

## Files

```
index.html          shell: menu bar, desktop icons, dock, all window markup/content
css/os.css           menu bar, desktop, dock, window chrome, drag states
css/apps.css         per-window content styling (terminal, resume, certs, projects, timeline)
js/window-manager.js open/close/focus/drag (mouse + touch), menu bar clock
js/apps.js           terminal command evaluator, Claude Code scripted demo, contact mock-submit
```

`styles.css` and `script.js` (old landing page) are removed once their
styles are ported into `css/os.css` / `css/apps.css`. `assets/` is unchanged
and reused as-is (resume, certificate images, project preview images,
write-up images). The four `write-ups/*.html` pages and `notebooks/*.ipynb`
are unchanged and continue to be linked from the Projects window exactly as
today.

## Out of scope

- No real backend for Contact or Claude Code — both stay scripted/mock per
  explicit decision.
- No boot/loading animation.
- No responsive/mobile-specific redesign beyond what's needed for windows
  to be usable on a touch screen (drag via touch events, as in the
  template) — not a primary target, existing site's mobile behavior can be
  degraded gracefully (e.g. windows still open, just resized to near-full-
  screen).
