# Personal site — starter

Plain HTML/CSS/JS with a serverless chat backend, deployed via Vercel.

```
site/
├── index.html      the whole page
├── styles.css       all styling
├── script.js        the hero canvas animation
├── assets/
│   └── resume.pdf    your current resume (already dropped in)
└── README.md
```

## Deploy

This site is deployed via [Vercel](https://vercel.com):

1. Import the repo into Vercel (New Project → select this GitHub repo).
2. In Project Settings → Environment Variables, add `OPENROUTER_API_KEY` with a real OpenRouter API key (get one at https://openrouter.ai/keys). Required for the Claude Code chat window's `/api/chat` endpoint.
3. Every push to `main` auto-deploys. The frontend stays fully static; only `api/chat.js` runs as a serverless function.

## 1. Things to fill in before it's real

- **GitHub/email links** — `index.html` has `href="https://github.com/"` placeholders in the nav, hero, and footer. Swap in your actual GitHub URL.
- **Project links** — each project card has two `<a href="#">` placeholders for "Write-up" and "Code". Point these at:
  - a GitHub repo per project (best option — push your Jupyter notebooks/`.py` files there with a short README), and/or
  - a hosted PDF of the write-up (e.g. drop the compiled Overleaf PDF into `assets/` and link to it, the same way `resume.pdf` is linked).
- **Resume** — `assets/resume.pdf` is your current resume. Re-drop an updated file with the same name whenever it changes, no HTML edits needed.
- **Screenshots (optional but recommended)** — the corner-detection, image-stitching, and LoRA loss-curve results all produced real images in your Jupyter notebooks. Exporting 1–2 of the best ones per project into `assets/` and adding an `<img>` tag under the relevant `<p>` in `index.html` would make the CV projects noticeably stronger — visuals do a lot of work for computer vision work specifically.

## 2. Editing content

Everything is in `index.html` as plain text inside `<h3>`, `<p>`, and `<li>` tags — no templating, just edit directly. Styling lives entirely in `styles.css`; color and font choices are set once at the top as CSS variables (`:root`) if you want to retheme later.
