# Personal site — starter

Plain HTML/CSS/JS, no build step, ready for GitHub Pages.

```
site/
├── index.html      the whole page
├── styles.css       all styling
├── script.js        the hero canvas animation
├── assets/
│   └── resume.pdf    your current resume (already dropped in)
└── README.md
```

## 1. Get it on GitHub

**Option A — user site (recommended), lives at `yourusername.github.io`**
1. On GitHub, create a new repo named **exactly** `yourusername.github.io` (replace with your real GitHub username).
2. Push these files to the root of that repo (see step 2 below).
3. Go to the repo's **Settings → Pages**. Under "Build and deployment", source should already default to the `main` branch, root folder — save if needed.
4. Your site is live in a minute or two at `https://yourusername.github.io`.

**Option B — project site, lives at `yourusername.github.io/reponame`**
1. Create a repo with any name (e.g. `portfolio`).
2. Push these files to it.
3. Settings → Pages → set source to the `main` branch, `/ (root)` folder.
4. Live at `https://yourusername.github.io/portfolio`.

## 2. Push the files

From this folder:
```bash
git init
git add .
git commit -m "initial site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 3. Things to fill in before it's real

- **GitHub/email links** — `index.html` has `href="https://github.com/"` placeholders in the nav, hero, and footer. Swap in your actual GitHub URL.
- **Project links** — each project card has two `<a href="#">` placeholders for "Write-up" and "Code". Point these at:
  - a GitHub repo per project (best option — push your Jupyter notebooks/`.py` files there with a short README), and/or
  - a hosted PDF of the write-up (e.g. drop the compiled Overleaf PDF into `assets/` and link to it, the same way `resume.pdf` is linked).
- **Resume** — `assets/resume.pdf` is your current resume. Re-drop an updated file with the same name whenever it changes, no HTML edits needed.
- **Screenshots (optional but recommended)** — the corner-detection, image-stitching, and LoRA loss-curve results all produced real images in your Jupyter notebooks. Exporting 1–2 of the best ones per project into `assets/` and adding an `<img>` tag under the relevant `<p>` in `index.html` would make the CV projects noticeably stronger — visuals do a lot of work for computer vision work specifically.

## 4. Editing content

Everything is in `index.html` as plain text inside `<h3>`, `<p>`, and `<li>` tags — no templating, just edit directly. Styling lives entirely in `styles.css`; color and font choices are set once at the top as CSS variables (`:root`) if you want to retheme later.
