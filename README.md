# Personal site — starter

A macOS-desktop-styled portfolio: plain HTML/CSS/JS with a serverless chat backend, deployed via Vercel. No build step, no package manager.

```
site/
├── index.html          the whole page (desktop icons, dock, all windows)
├── css/
│   ├── os.css            desktop shell — menubar, dock, window chrome
│   └── apps.css           per-window app content styling
├── js/
│   ├── window-manager.js  open/close/drag/focus for windows and icons
│   └── apps.js             terminal commands and the Claude Code chat app
├── api/
│   ├── chat.js             serverless function backing the chat window
│   └── profile-data.json   retrieval context for the chat assistant
├── assets/
│   ├── icons/              SVG icon set for desktop/dock/folder icons
│   └── resume.pdf          your current resume (already dropped in)
├── write-ups/             standalone long-form pages per academic project
├── notebooks/              source Jupyter notebooks behind those write-ups
├── styles.css              stylesheet shared by the write-up pages
└── README.md
```

## Deploy

This site is deployed via [Vercel](https://vercel.com):

1. Import the repo into Vercel (New Project → select this GitHub repo).
2. In Project Settings → Environment Variables, add `OPENROUTER_API_KEY` with a real OpenRouter API key (get one at https://openrouter.ai/keys). Required for the Claude Code chat window's `/api/chat` endpoint.
3. Optionally also add `GROQ_API_KEY` (get one free at https://console.groq.com/keys, no billing details required) as a second fallback tier — Groq's free tier allows far more requests/minute than OpenRouter's free models, so this is the single highest-value key to add if the assistant is getting rate-limited in practice.
4. Optionally also add `OPENCODE_API_KEY` (get one at https://opencode.ai, under Zen — requires signing up and adding billing details even though usage is currently free) to enable Big Pickle as a third, last-resort fallback model.

None of steps 3–4 are required — the chat window works with just `OPENROUTER_API_KEY`, and falls back to showing profile content directly (no LLM) if every configured model is unavailable.
3. Every push to `main` auto-deploys. The frontend stays fully static; only `api/chat.js` runs as a serverless function.

## Editing content

`index.html` holds every desktop icon, dock icon, and window as plain HTML — no templating. Each app (About, Tools, Coursework, Projects, etc.) is a `.mac-window` div; opening it is wired by matching a dock/desktop/folder icon's `data-app="foo"` to a window's `id="win-foo"` in `js/window-manager.js`. Add a new app by dropping in an icon and a matching window using an existing pair as the template.

Styling for the desktop shell and windows lives in `css/os.css` and `css/apps.css`; color and font choices are set once at the top of `css/os.css` as CSS variables (`:root`) if you want to retheme later. `styles.css` is separate and only styles the `write-ups/` pages.

- **Resume** — `assets/resume.pdf` is your current resume, shown in the Résumé window. Re-drop an updated file with the same name whenever it changes, no HTML edits needed.
- **Projects** — each academic project window links out to a write-up in `write-ups/` and a notebook in `notebooks/`; each side-project window links Live/GitHub.
