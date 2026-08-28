# macOS Desktop Portfolio v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace emoji icons with real SVG assets, split the Projects and Side Projects windows into Finder-style folders of one-app-per-project, and rebuild the Claude Code window into a real RAG-backed chat answering questions about the portfolio's content via a Vercel serverless function + OpenRouter.

**Architecture:** Builds on the merged v1 work (Tasks 1-8: OS shell, window manager, Terminal, About Me, Tools & Automation, Coursework, Certificates, Experience — all unchanged). This plan only touches: icon assets, the Projects/Side Projects windows (replaced with folder + per-project windows), the Claude Code window (replaced with a real chat UI), and adds a new `api/` serverless function + JSON data file. Hosting moves from GitHub Pages to Vercel.

**Tech Stack:** Plain HTML5/CSS3/vanilla JS for the frontend (unchanged). One new Node serverless function (`api/chat.js`, Vercel's zero-config convention — no framework, uses the built-in `fetch`). No new frontend dependencies.

**Spec:** `docs/superpowers/specs/2026-08-27-macos-desktop-portfolio-v2-design.md` (amends `docs/superpowers/specs/2026-08-27-macos-desktop-portfolio-design.md`)

## Global Constraints

- No client-side exposed API key. `OPENROUTER_API_KEY` is read only inside `api/chat.js` via `process.env.OPENROUTER_API_KEY` (a Vercel environment variable) — never inlined into any file this plan writes.
- OpenRouter call, exactly as documented: `POST https://openrouter.ai/api/v1/chat/completions`, header `Authorization: Bearer <OPENROUTER_API_KEY>`, header `Content-Type: application/json`, body `{ model, messages }` where `model` is a `:free`-suffixed model id (this plan uses `"meta-llama/llama-3.1-8b-instruct:free"` — confirmed to exist on OpenRouter's free-tier model list as of this plan's writing; if it's been retired by execution time, substitute the closest available `:free` model of similar size and note the substitution in the task report).
- A 429 from OpenRouter (free-tier rate limit: 20 req/min, 50 req/day without prior credits) must be caught and turned into a friendly JSON error the frontend renders as a chat message — never an unhandled 500 or raw error text.
- Every project's text content (title, tags, summary, findings, links) moved into its own window must be copied verbatim from the existing merged `index.html` (Task 5/6 content) — no paraphrasing, no rewriting, no invented facts. The JSON profile data used for RAG retrieval must also be verbatim-sourced from the same existing content, not re-authored from memory.
- Icon SVGs use literal hex colors matching the site's existing design tokens (`--paper-raised:#FBFBF9`, `--ink:#15171B`, `--hairline:#DDDCD5`, `--accent:#3F55E8`, `--accent-ink:#2A3AB8`, `--accent-soft:#EAEBFB`) — not CSS custom properties, since each SVG is a separate document loaded via `<img>` and does not inherit the host page's `:root` variables.
- Every new window keeps the established convention: `<div id="win-<appId>" class="mac-window">` with a `.window-header` containing a `.close-btn` inside `.window-controls` — `js/window-manager.js` is unchanged and already wires drag/close/focus generically to anything matching this shape, and already delegates click-to-open on any `[data-app]` element present in the initial DOM (folder-grid icons are static markup, so no window-manager.js changes are needed anywhere in this plan).
- No build step for the frontend (still plain static files). The only new tooling is Vercel's own zero-config handling of the `api/` directory — no bundler, no `package.json` unless Vercel's deploy requires one for the Node runtime version (Task 7 checks this).

---

### Task 1: Icon assets — 12 SVG icons + swap emoji to `<img>`

**Files:**
- Create: `assets/icons/terminal.svg`
- Create: `assets/icons/claude.svg`
- Create: `assets/icons/folder-projects.svg`
- Create: `assets/icons/folder-sideprojects.svg`
- Create: `assets/icons/resume.svg`
- Create: `assets/icons/contact.svg`
- Create: `assets/icons/about.svg`
- Create: `assets/icons/tools.svg`
- Create: `assets/icons/coursework.svg`
- Create: `assets/icons/certs.svg`
- Create: `assets/icons/experience.svg`
- Create: `assets/icons/project-generic.svg`
- Modify: `index.html` (swap every emoji glyph on desktop/dock icons for an `<img>` tag)
- Modify: `css/os.css` (append icon `<img>` sizing rules)

**Interfaces:**
- Produces: `assets/icons/*.svg` file set, referenced by every later task that adds a desktop icon, dock icon, or folder-grid icon (Tasks 5, 6 reuse `project-generic.svg`).
- Consumes: nothing (first task of this plan).

- [ ] **Step 1: Write the 12 SVG icon files**, each `64×64` viewBox, a rounded-square tile background plus a simple glyph:

`assets/icons/terminal.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#15171B"/>
  <path d="M16 24 L26 32 L16 40" fill="none" stroke="#FBFBF9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="30" y1="40" x2="46" y2="40" stroke="#FBFBF9" stroke-width="3" stroke-linecap="round"/>
</svg>
```

`assets/icons/claude.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#3F55E8"/>
  <path d="M18 22 h28 a4 4 0 0 1 4 4 v14 a4 4 0 0 1 -4 4 h-16 l-8 8 v-8 h-4 a4 4 0 0 1 -4 -4 v-14 a4 4 0 0 1 4 -4 z" fill="#FBFBF9"/>
  <circle cx="26" cy="33" r="2.4" fill="#3F55E8"/>
  <circle cx="34" cy="33" r="2.4" fill="#3F55E8"/>
  <circle cx="42" cy="33" r="2.4" fill="#3F55E8"/>
</svg>
```

`assets/icons/folder-projects.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#FBFBF9" stroke="#DDDCD5" stroke-width="1.5"/>
  <path d="M14 24 h12 l4 5 h20 a2 2 0 0 1 2 2 v17 a2 2 0 0 1 -2 2 h-36 a2 2 0 0 1 -2 -2 v-22 a2 2 0 0 1 2 -2 z" fill="#3F55E8"/>
  <rect x="14" y="27" width="36" height="4" fill="#2A3AB8"/>
</svg>
```

`assets/icons/folder-sideprojects.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#FBFBF9" stroke="#DDDCD5" stroke-width="1.5"/>
  <path d="M14 24 h12 l4 5 h20 a2 2 0 0 1 2 2 v17 a2 2 0 0 1 -2 2 h-36 a2 2 0 0 1 -2 -2 v-22 a2 2 0 0 1 2 -2 z" fill="#EAEBFB"/>
  <rect x="14" y="27" width="36" height="4" fill="#3F55E8"/>
  <circle cx="44" cy="20" r="6" fill="#3F55E8"/>
  <path d="M44 17 v6 M41 20 h6" stroke="#FBFBF9" stroke-width="1.6" stroke-linecap="round"/>
</svg>
```

`assets/icons/resume.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#FBFBF9" stroke="#DDDCD5" stroke-width="1.5"/>
  <path d="M20 14 h16 l8 8 v28 a2 2 0 0 1 -2 2 h-22 a2 2 0 0 1 -2 -2 v-34 a2 2 0 0 1 2 -2 z" fill="#EAEBFB" stroke="#3F55E8" stroke-width="1.5"/>
  <path d="M36 14 v8 h8 z" fill="#3F55E8"/>
  <line x1="24" y1="32" x2="40" y2="32" stroke="#2A3AB8" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="38" x2="40" y2="38" stroke="#2A3AB8" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="44" x2="34" y2="44" stroke="#2A3AB8" stroke-width="2" stroke-linecap="round"/>
</svg>
```

`assets/icons/contact.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#3F55E8"/>
  <rect x="14" y="20" width="36" height="24" rx="3" fill="#FBFBF9"/>
  <path d="M14 22 L32 36 L50 22" fill="none" stroke="#3F55E8" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

`assets/icons/about.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#EAEBFB"/>
  <circle cx="32" cy="24" r="9" fill="#3F55E8"/>
  <path d="M16 48 a16 14 0 0 1 32 0 z" fill="#3F55E8"/>
</svg>
```

`assets/icons/tools.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#15171B"/>
  <path d="M40 16 a9 9 0 0 0 -11 11 l-14 14 a3 3 0 0 0 4 4 l14 -14 a9 9 0 0 0 11 -11 l-5 5 -4 -4 z" fill="#FBFBF9"/>
</svg>
```

`assets/icons/coursework.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#FBFBF9" stroke="#DDDCD5" stroke-width="1.5"/>
  <path d="M32 18 L54 27 L32 36 L10 27 Z" fill="#3F55E8"/>
  <path d="M20 31 v9 c0 3 5 6 12 6 s12 -3 12 -6 v-9" fill="none" stroke="#2A3AB8" stroke-width="2"/>
</svg>
```

`assets/icons/certs.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#EAEBFB"/>
  <circle cx="32" cy="26" r="12" fill="#3F55E8"/>
  <circle cx="32" cy="26" r="7" fill="#FBFBF9"/>
  <path d="M24 36 L20 50 L32 44 L44 50 L40 36" fill="#2A3AB8"/>
</svg>
```

`assets/icons/experience.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#15171B"/>
  <rect x="14" y="26" width="36" height="22" rx="3" fill="#FBFBF9"/>
  <path d="M24 26 v-4 a4 4 0 0 1 4 -4 h8 a4 4 0 0 1 4 4 v4" fill="none" stroke="#FBFBF9" stroke-width="2.5"/>
  <line x1="14" y1="36" x2="50" y2="36" stroke="#15171B" stroke-width="2"/>
</svg>
```

`assets/icons/project-generic.svg`
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="1" y="1" width="62" height="62" rx="14" fill="#FBFBF9" stroke="#DDDCD5" stroke-width="1.5"/>
  <path d="M24 22 L14 32 L24 42" fill="none" stroke="#3F55E8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M40 22 L50 32 L40 42" fill="none" stroke="#3F55E8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="35" y1="18" x2="29" y2="46" stroke="#2A3AB8" stroke-width="2.5" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 2: In `index.html`, replace every icon glyph with an `<img>` tag** (keep the surrounding `.desktop-icon`/`.dock-icon` structure and `data-app` attributes unchanged, only swap the glyph):

Desktop icons — replace `<span class="icon-glyph">👤</span>` etc. with, for example:
```html
<div class="desktop-icon" data-app="about">
  <img class="icon-glyph" src="assets/icons/about.svg" alt="" width="40" height="40">
  <span>About Me</span>
</div>
```
Apply the same pattern to all 6 desktop icons (`about.svg`, `folder-sideprojects.svg` for Side Projects, `tools.svg`, `coursework.svg`, `certs.svg`, `experience.svg`).

Dock icons — replace the raw emoji character with an `<img>`, for example:
```html
<div class="dock-icon" data-app="terminal">
  <img class="dock-icon-img" src="assets/icons/terminal.svg" alt="" width="30" height="30">
  <span class="dock-tooltip">Terminal</span>
</div>
```
Apply to all 5 dock icons (`terminal.svg`, `claude.svg`, `folder-projects.svg` for Projects, `resume.svg`, `contact.svg`).

- [ ] **Step 3: Append icon-image sizing rules to `css/os.css`**

```css
.desktop-icon .icon-glyph{
  width: 40px;
  height: 40px;
  margin-bottom: 4px;
}
.dock-icon .dock-icon-img{
  width: 30px;
  height: 30px;
  pointer-events: none;
}
```

- [ ] **Step 4: Manual verification**

`python3 -m http.server 8000`, open `http://localhost:8000/`. Every desktop and dock icon shows a real SVG tile instead of an emoji; hovering/opening windows still works exactly as before (icon swap is purely visual, `data-app` values are unchanged). Structural fallback for this environment: `curl -sI http://localhost:8000/assets/icons/terminal.svg` (and the other 11) return 200; `curl -s http://localhost:8000/ | grep -c '<img class="icon-glyph"'` returns 6 (desktop) and `grep -c 'dock-icon-img'` returns 5 (dock).

- [ ] **Step 5: Commit**

```bash
git add assets/icons/ index.html css/os.css
git commit -m "Replace emoji icons with real SVG assets"
```

---

### Task 2: Vercel scaffold + profile data JSON

**Files:**
- Create: `vercel.json`
- Create: `api/profile-data.json`

**Interfaces:**
- Produces: `api/profile-data.json` — an array of `{ id, title, tags, body }` section objects, consumed by Task 3's `api/chat.js` retrieval logic.
- Consumes: nothing new (content sourced from the already-merged `index.html`).

- [ ] **Step 1: Write `vercel.json`** (routes are Vercel's default for `api/*.js` — this file only pins the Node runtime and disables unneeded framework detection)

```json
{
  "functions": {
    "api/chat.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

- [ ] **Step 2: Write `api/profile-data.json`**, sourced verbatim from the merged `index.html` (About Me, Tools & Automation, Coursework, Experience, Certificates, and all 11 project summaries — condensed to the facts an assistant would cite, not the full HTML markup)

```json
[
  {
    "id": "about",
    "title": "About Tim Zhang",
    "tags": ["about", "bio", "background", "ucla"],
    "body": "Tim Zhang is a Computer Science undergraduate at UCLA who uses agentic AI in his daily workflow to build and code projects. He enjoys turning ideas into practical software while learning new technologies along the way."
  },
  {
    "id": "tools",
    "title": "Tools & Automation",
    "tags": ["tools", "automation", "zapier", "claude code", "ai workflow"],
    "body": "Tim uses Zapier to wire ChatGPT and Claude directly into daily tools: Gmail (drafting, scheduling, auto-replying to email based on trigger conditions) and Google Drive (on-demand document summaries). He makes extensive daily use of Claude Code — custom slash commands, skills, and subagents built into a working development loop, not just chat — and also works across Antigravity, Codex, and Cursor for AI-assisted development."
  },
  {
    "id": "coursework",
    "title": "Coursework",
    "tags": ["coursework", "classes", "courses", "ucla"],
    "body": "Data Structures & Algorithms, Object-Oriented Programming, Software Design, Introduction to Machine Learning, Foundations of Computer Vision."
  },
  {
    "id": "experience-seasnet",
    "title": "Computer Lab Consultant, UCLA SEASNet (Mar 2026 - present)",
    "tags": ["experience", "job", "work", "seasnet", "ucla"],
    "body": "Technical support for hundreds of engineering students and faculty daily covering software, hardware, and network issues. Runs training sessions on lab tools and contributes to lab-wide system improvements with the SEASNet technical team."
  },
  {
    "id": "experience-ted",
    "title": "Translator / Transcriber, TED Translators (Jun 2022 - 2024)",
    "tags": ["experience", "job", "work", "ted", "translation"],
    "body": "Translated TED Talk scripts between English and Simplified Chinese, reviewed peer translations for accuracy, tone, and cultural sensitivity, and produced time-synced subtitles for global accessibility across concurrent projects."
  },
  {
    "id": "experience-tutor",
    "title": "Mathematics Tutor, Learn To Be (Aug 2023 - Apr 2024)",
    "tags": ["experience", "job", "work", "tutor", "math"],
    "body": "Tutored K-12 students from underserved communities, breaking down concepts into individualized, approachable lesson plans over live virtual sessions."
  },
  {
    "id": "certs",
    "title": "Certificates",
    "tags": ["certificates", "certifications", "courses completed"],
    "body": "CS50's Introduction to Programming with Python (Harvard University, 2024). AI Fluency: Framework & Foundations (Anthropic). Claude Code 101 (Anthropic). Claude Code in Action (Anthropic)."
  },
  {
    "id": "proj-cnn",
    "title": "CNN-Based Image Classification - CIFAR-10",
    "tags": ["project", "computer vision", "cnn", "pytorch", "cifar-10", "academic"],
    "body": "Built and trained a convolutional neural network from scratch in PyTorch for 10-class image classification, sweeping batch size and epoch count. Best configuration (batch size 16, 20 epochs) reached 65.7% test accuracy versus 55.5% at 5 epochs. At a fixed 5 epochs, the smaller batch size (4) outperformed the larger one (58.1% vs 55.5%), reversing once given enough epochs (65.7% vs 61.2% at 20 epochs)."
  },
  {
    "id": "proj-rge",
    "title": "Robust Geometric Estimation - SIFT, RANSAC & Homography",
    "tags": ["project", "computer vision", "sift", "ransac", "homography", "academic"],
    "body": "Full correspondence pipeline: SIFT keypoint detection and descriptor matching, a from-scratch RANSAC loop for robust homography estimation, and inverse warping with bilinear interpolation to stitch image pairs into a panorama. Implemented direct linear transform (DLT) homography estimation, then RANSAC to separate true matches from outliers. Also implemented the eight-point algorithm for essential matrix estimation and 3D point reconstruction (2.7% mean reprojection error)."
  },
  {
    "id": "proj-fd",
    "title": "Feature Detection - Edges, Blobs & Corners",
    "tags": ["project", "computer vision", "edge detection", "harris corners", "academic"],
    "body": "A ground-up image-filtering stack: 2D convolution, Gaussian/median/bilateral filtering, gradient-based edge detection, Laplacian-of-Gaussian blob detection, and Harris corner detection with non-maximum suppression, every operator derived and implemented by hand. Median filtering won on both quantitative error and visual edge preservation compared to average and Gaussian filtering."
  },
  {
    "id": "proj-llm",
    "title": "Semantic Matching & Reasoning with Language Models",
    "tags": ["project", "nlp", "llm", "lora", "fine-tuning", "academic"],
    "body": "Two-part project on paraphrase detection (PAWS) and math reasoning (GSM8K). Paraphrase detection: a bi-encoder baseline hit 61.8% test accuracy; fine-tuning a DistilBERT cross-encoder pushed that to 81.9%, matched by few-shot prompting a 1.5B instruct model (81.5%) with zero training. Math reasoning: LoRA fine-tuned Qwen2.5-1.5B on 1,000 then 2,000 examples, taking base-model accuracy from 36% to 47% to 49%, training under 0.15% of total parameters. A 'reread the problem first' prompt alone lifted base-model accuracy from 44% to 60%."
  },
  {
    "id": "side-cloner",
    "title": "Website Template Cloner",
    "tags": ["project", "side project", "web tooling", "playwright", "next.js"],
    "body": "An agent-driven pipeline that turns any webpage into a reusable Next.js front-end template: captures the rendered DOM, every stylesheet, and a full-page screenshot, then emits a self-contained app with placeholder copy and imagery. Every value is cited to a selector and property or marked UNVERIFIED, never guessed. The apple.com/iPhone rebuild landed within 1px over a 12,967px page."
  },
  {
    "id": "side-rift",
    "title": "Rift Connections",
    "tags": ["project", "side project", "league of legends", "next.js", "game"],
    "body": "A daily NYT Connections-style puzzle for League of Legends: group 16 champions into four hidden thematic categories in a 4x4 grid, with a 3D mascot scene and streak tracking. Puzzles are procedurally generated from a bank of 40 disjoint champion-relationship pools. Built as a Next.js 14 monorepo with Tailwind CSS, Framer Motion, and Zustand."
  },
  {
    "id": "side-esports",
    "title": "ESPORTS.DATA - League of Legends Esports Analytics",
    "tags": ["project", "side project", "league of legends", "analytics", "dashboard"],
    "body": "A data analytics dashboard covering 98,000+ professional League of Legends matches from 2014-2026, sourced from Oracle's Elixir and served through REST API routes backed by a Turso (libSQL) database. Covers champion presence, synergy, counters, lane performance, and win rates, plus browsable match history and pro player profiles. Built on Next.js 16 with React 19 and Tailwind CSS 4."
  },
  {
    "id": "side-winrate",
    "title": "League of Legends Win Rate Quiz",
    "tags": ["project", "side project", "league of legends", "game", "quiz"],
    "body": "A 'Higher or Lower' streak quiz comparing two champions' win rates. Animated count-up reveal after each guess, running score bar, and round-by-round guess history. High score and run history persist locally via localStorage. Champion art is pulled live from Riot's Data Dragon CDN."
  },
  {
    "id": "side-yugioh",
    "title": "Yu-Gi-Oh! RAG Chatbot",
    "tags": ["project", "side project", "ai agents", "rag", "langchain", "chatbot"],
    "body": "A Retrieval-Augmented Generation chatbot answering questions over the full Yu-Gi-Oh! card database (~14,500 cards) using a locally-hosted LLM, no paid APIs. Hybrid retrieval combines semantic vector search (Sentence Transformers + ChromaDB) with exact metadata filtering. A LangGraph ReAct agent handles tool-calling and intent classification. Generation is grounded strictly in retrieved context using Qwen2.5-7B via Ollama."
  },
  {
    "id": "side-crewai",
    "title": "CrewAI News Agent",
    "tags": ["project", "side project", "ai agents", "crewai", "multi-agent"],
    "body": "A multi-agent news pipeline built with CrewAI: a News Collector agent searches the web for coverage of a topic, and a News Reporter agent turns those findings into a validated headline, both running sequentially against a local LLM (Qwen2.5-7B-Instruct via Ollama). Web search is wired in as a CrewAI tool (Serper)."
  },
  {
    "id": "side-whisper",
    "title": "German Whisper Transcriber",
    "tags": ["project", "side project", "ai agents", "whisper", "transcription"],
    "body": "A Streamlit app that transcribes German audio/video locally using OpenAI's Whisper model, then translates the transcript to English, built for cases where content shouldn't leave the machine. Runs fully locally with a model-size selector and automatic GPU/CPU detection via PyTorch. Accepts mp3, mp4, wav, m4a, and webm uploads."
  }
]
```

- [ ] **Step 3: Manual verification**

`node -e "JSON.parse(require('fs').readFileSync('api/profile-data.json','utf8')); console.log('valid JSON,', JSON.parse(require('fs').readFileSync('api/profile-data.json','utf8')).length, 'sections')"` — expect "valid JSON, 17 sections" with no error. `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"` — expect no error.

- [ ] **Step 4: Commit**

```bash
git add vercel.json api/profile-data.json
git commit -m "Add Vercel scaffold and profile data JSON for RAG retrieval"
```

---

### Task 3: `api/chat.js` — retrieval + OpenRouter call

**Files:**
- Create: `api/chat.js`

**Interfaces:**
- Consumes: `api/profile-data.json` (Task 2) — array of `{id, title, tags, body}`.
- Produces: a Vercel serverless endpoint at `POST /api/chat` accepting `{ "message": string }` and returning `{ "reply": string }` on success or `{ "error": string }` (still HTTP 200, so the frontend never has to special-case transport-level failure vs. a friendly rate-limit message) — consumed by Task 4's chat UI `fetch('/api/chat', ...)`.

- [ ] **Step 1: Write `api/chat.js`**

```js
const profileData = require('./profile-data.json');

const MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function scoreSection(section, queryWords) {
  const haystack = `${section.title} ${section.tags.join(' ')} ${section.body}`.toLowerCase();
  let score = 0;
  for (const word of queryWords) {
    if (word.length < 3) continue;
    if (haystack.includes(word)) score += 1;
  }
  return score;
}

function retrieveContext(message) {
  const queryWords = message.toLowerCase().split(/\W+/).filter(Boolean);
  const scored = profileData
    .map((section) => ({ section, score: scoreSection(section, queryWords) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.filter((s) => s.score > 0).slice(0, 5);
  const chosen = top.length > 0 ? top : scored.slice(0, 3);

  return chosen.map(({ section }) => `### ${section.title}\n${section.body}`).join('\n\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Missing "message" in request body' });
    return;
  }

  const context = retrieveContext(message);
  const systemPrompt = `You are a helpful assistant answering questions about Tim Zhang's portfolio, based ONLY on the context below. If the context doesn't cover the question, say you don't have that information rather than guessing.\n\n${context}`;

  try {
    const apiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    if (apiRes.status === 429) {
      res.status(200).json({ error: 'This assistant is rate-limited right now — please try again in a minute.' });
      return;
    }

    if (!apiRes.ok) {
      res.status(200).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
      return;
    }

    const data = await apiRes.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      res.status(200).json({ error: 'The assistant could not generate a reply. Please try again.' });
      return;
    }

    res.status(200).json({ reply });
  } catch (err) {
    res.status(200).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
  }
};
```

- [ ] **Step 2: Manual verification**

`node -c api/chat.js` — expect no syntax errors. `node -e "const h = require('./api/chat.js'); console.log(typeof h)"` — expect `function` (confirms the module loads and `profile-data.json` resolves correctly from Task 2). Since there's no live Vercel/OpenRouter environment available in this task, the actual HTTP round-trip (including the 429 path) cannot be exercised here — note in the report that live verification happens after deploy (Task 7), once `OPENROUTER_API_KEY` is set as a real Vercel environment variable.

- [ ] **Step 3: Commit**

```bash
git add api/chat.js
git commit -m "Add /api/chat serverless function: keyword retrieval + OpenRouter call"
```

---

### Task 4: Claude Code real chat UI

**Files:**
- Modify: `index.html` (replace `#win-claude`'s scripted-demo markup with a chat UI)
- Modify: `css/apps.css` (replace `.claude-harness`/`.claude-step`/`.claude-badge*` rules with chat-message rules)
- Modify: `js/apps.js` (remove `initClaudeDemo()`, replace with a real `fetch`-backed chat handler)

**Interfaces:**
- Consumes: `POST /api/chat` (Task 3) — `{message}` request, `{reply}` or `{error}` response.
- Produces: nothing consumed by later tasks (self-contained window).

- [ ] **Step 1: Replace the Claude Code CSS block in `css/apps.css`** (remove the existing `.claude-harness`, `.claude-step`, `.claude-badge*`, `.claude-input-row`, `.claude-prompt`, `.claude-input` rules from Task 3 of the v1 plan, replace with:)

```css
.claude-chat{ display: flex; flex-direction: column; height: 100%; font-family: var(--body); }
.claude-messages{ flex: 1; overflow-y: auto; padding-bottom: 12px; display: flex; flex-direction: column; gap: 10px; }
.claude-msg{ max-width: 80%; padding: 8px 12px; border-radius: 10px; font-size: 0.85rem; line-height: 1.5; }
.claude-msg-user{ align-self: flex-end; background: var(--accent); color: white; }
.claude-msg-assistant{ align-self: flex-start; background: var(--accent-soft); color: var(--ink); }
.claude-msg-error{ align-self: flex-start; background: #FDEAEA; color: #8A1F1F; }
.claude-chat-form{ display: flex; gap: 8px; padding-top: 10px; border-top: 1px solid var(--hairline); }
.claude-chat-input{
  flex: 1;
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 6px;
  padding: 8px 10px;
  font-family: var(--body);
  font-size: 0.85rem;
  color: var(--ink);
}
.claude-chat-send{
  background: var(--accent);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.claude-chat-send:disabled{ opacity: 0.5; cursor: default; }
```

- [ ] **Step 2: Replace the `#win-claude` window content in `index.html`** (keep the outer `.mac-window`/`.window-header`/`.window-controls`/`.window-title` chrome identical; only replace what's inside `.window-content`)

```html
    <div class="window-content claude-chat">
      <div id="claude-messages" class="claude-messages">
        <div class="claude-msg claude-msg-assistant">Hi — I'm a small assistant that knows about Tim's projects, experience, and background. Ask me anything about his portfolio.</div>
      </div>
      <form id="claude-chat-form" class="claude-chat-form">
        <input type="text" id="claude-chat-input" class="claude-chat-input" autocomplete="off" spellcheck="false" placeholder="Ask about a project, his experience..." />
        <button type="submit" id="claude-chat-send" class="claude-chat-send">Send</button>
      </form>
    </div>
```

- [ ] **Step 3: In `js/apps.js`, delete the entire `initClaudeDemo()` function and its `STEPS`/`runTask` body from Task 3 of the v1 plan, and remove the `initClaudeDemo();` call from the `DOMContentLoaded` listener. Replace with:**

```js
  function initClaudeChat() {
    const form = document.getElementById('claude-chat-form');
    const input = document.getElementById('claude-chat-input');
    const send = document.getElementById('claude-chat-send');
    const messages = document.getElementById('claude-messages');
    if (!form || !input || !messages) return;

    function appendMessage(text, kind) {
      const div = document.createElement('div');
      div.className = `claude-msg claude-msg-${kind}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      appendMessage(text, 'user');
      input.value = '';
      input.disabled = true;
      send.disabled = true;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        if (data.error) {
          appendMessage(data.error, 'error');
        } else {
          appendMessage(data.reply, 'assistant');
        }
      } catch (err) {
        appendMessage('Could not reach the assistant. Please try again.', 'error');
      } finally {
        input.disabled = false;
        send.disabled = false;
        input.focus();
      }
    });
  }
```

Add `initClaudeChat();` to the existing `DOMContentLoaded` listener in place of the removed `initClaudeDemo();` call.

- [ ] **Step 4: Manual verification**

`node -c js/apps.js` — expect no syntax errors. `python3 -m http.server 8000`, open `http://localhost:8000/`, click the Claude Code dock icon — the greeting message renders, the input/send button are present. Sending a message will fail against `fetch('/api/chat', ...)` in this static-server-only environment (no serverless runtime here) — expect the caught-`fetch`-error path to append a "Could not reach the assistant" message, which is the correct graceful-degradation behavior; full round-trip verification happens after Task 7's Vercel deploy.

- [ ] **Step 5: Commit**

```bash
git add index.html css/apps.css js/apps.js
git commit -m "Replace Claude Code scripted demo with real RAG-backed chat UI"
```

---

### Task 5: Projects folder + 4 per-project windows

**Files:**
- Modify: `index.html` (replace `#win-projects`'s single-window content with a folder-grid window, and add 4 new per-project windows)
- Modify: `css/apps.css` (append `.folder-grid` styling, reused by Task 6)

**Interfaces:**
- Consumes: `assets/icons/project-generic.svg` (Task 1), the existing `.projects-app .project`/`.tag`/`.findings`/`.project-links` rules (already in `css/apps.css` from the v1 plan's Task 5 — reused verbatim, not redefined).
- Produces: `.folder-grid`/`.folder-icon` CSS classes, reused by Task 6 without redefinition.

- [ ] **Step 1: Append folder-grid styling to `css/apps.css`**

```css
.folder-grid{
  display: grid;
  grid-template-columns: repeat(auto-fill, 84px);
  gap: 16px;
  padding: 4px;
}
.folder-icon{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
}
.folder-icon:hover{ background: rgba(63, 85, 232, 0.08); }
.folder-icon img{ width: 48px; height: 48px; }
.folder-icon span{ font-size: 0.72rem; color: var(--ink); font-weight: 500; }
.folder-group-label{
  grid-column: 1 / -1;
  font-family: var(--mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--graphite);
  margin: 10px 0 2px;
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 4px;
}
.folder-group-label:first-child{ margin-top: 0; }
```

- [ ] **Step 2: Replace the `#win-projects` window in `index.html`** — the window keeps its id (`win-projects`, still opened by the same dock icon and the Terminal's `open projects` command) but its content becomes a folder grid of 4 icons instead of the inline project list:

```html
  <div id="win-projects" class="mac-window" style="top: 50px; left: 320px; width: 420px; height: 340px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Projects</div>
    </div>
    <div class="window-content">
      <div class="folder-grid">
        <div class="folder-icon" data-app="proj-cnn">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>CNN Image Classification</span>
        </div>
        <div class="folder-icon" data-app="proj-rge">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Robust Geometric Estimation</span>
        </div>
        <div class="folder-icon" data-app="proj-fd">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Feature Detection</span>
        </div>
        <div class="folder-icon" data-app="proj-llm">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Semantic Matching &amp; Reasoning</span>
        </div>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: Add 4 new per-project windows to `index.html`**, each containing that project's exact existing content — extract the corresponding `<article class="project">...</article>` block verbatim from the current (pre-this-task) `#win-projects` content in the merged `index.html`, and wrap it in its own window:

```html
  <div id="win-proj-cnn" class="mac-window" style="top: 70px; left: 380px; width: 560px; height: 520px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">CNN-Based Image Classification</div>
    </div>
    <div class="window-content projects-app">
      <!-- Move the exact <article class="project"> block for "CNN-Based Image Classification — CIFAR-10"
           here verbatim from the current #win-projects content (meta tags, h3, project-preview image,
           summary paragraph, findings list, project-links) — do not paraphrase or drop any line. -->
    </div>
  </div>

  <div id="win-proj-rge" class="mac-window" style="top: 90px; left: 400px; width: 560px; height: 520px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Robust Geometric Estimation</div>
    </div>
    <div class="window-content projects-app">
      <!-- Move the exact <article class="project"> block for "Robust Geometric Estimation — SIFT, RANSAC & Homography" here verbatim. -->
    </div>
  </div>

  <div id="win-proj-fd" class="mac-window" style="top: 110px; left: 420px; width: 560px; height: 520px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Feature Detection</div>
    </div>
    <div class="window-content projects-app">
      <!-- Move the exact <article class="project"> block for "Feature Detection — Edges, Blobs & Corners" here verbatim. -->
    </div>
  </div>

  <div id="win-proj-llm" class="mac-window" style="top: 130px; left: 440px; width: 560px; height: 520px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Semantic Matching &amp; Reasoning</div>
    </div>
    <div class="window-content projects-app">
      <!-- Move the exact <article class="project"> block for "Semantic Matching & Reasoning with Language Models" here verbatim. -->
    </div>
  </div>
```

The implementer must pull the real `<article>` HTML from the current file — the exact text (findings, tags, image paths, links) is already correct in the merged `index.html` from the v1 plan's Task 5 and must not be retyped from scratch or altered in any way, only relocated.

- [ ] **Step 4: Manual verification**

`python3 -m http.server 8000`, open `http://localhost:8000/`, click Projects — a 4-icon folder grid opens. Click each icon — its own project window opens with the correct content (preview image loads, findings list intact, both links present). Structural fallback: `curl -s http://localhost:8000/ | grep -c 'folder-icon'` returns 4 (this task only, before Task 6 adds more), `curl -s http://localhost:8000/ | grep -c 'win-proj-'` returns 4.

- [ ] **Step 5: Commit**

```bash
git add index.html css/apps.css
git commit -m "Split Projects into a folder of 4 per-project windows"
```

---

### Task 6: Side Projects folder + 7 per-project windows

**Files:**
- Modify: `index.html` (replace `#win-sideprojects`'s single-window content with a folder-grid window grouped by category, and add 7 new per-project windows)

**Interfaces:**
- Consumes: `.folder-grid`/`.folder-icon`/`.folder-group-label` CSS (Task 5, reused not redefined), `assets/icons/project-generic.svg` (Task 1), existing `.projects-app .project` rules (v1 plan Task 5).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the `#win-sideprojects` window in `index.html`** — same id, same dock/desktop trigger, content becomes a folder grid with 3 category group-labels:

```html
  <div id="win-sideprojects" class="mac-window" style="top: 60px; left: 260px; width: 460px; height: 440px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Side Projects</div>
    </div>
    <div class="window-content">
      <div class="folder-grid">
        <div class="folder-group-label">web tooling</div>
        <div class="folder-icon" data-app="side-cloner">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Website Template Cloner</span>
        </div>

        <div class="folder-group-label">league of legends</div>
        <div class="folder-icon" data-app="side-rift">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Rift Connections</span>
        </div>
        <div class="folder-icon" data-app="side-esports">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>ESPORTS.DATA</span>
        </div>
        <div class="folder-icon" data-app="side-winrate">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Win Rate Quiz</span>
        </div>

        <div class="folder-group-label">ai agents &amp; tools</div>
        <div class="folder-icon" data-app="side-yugioh">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>Yu-Gi-Oh! RAG Chatbot</span>
        </div>
        <div class="folder-icon" data-app="side-crewai">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>CrewAI News Agent</span>
        </div>
        <div class="folder-icon" data-app="side-whisper">
          <img src="assets/icons/project-generic.svg" alt="">
          <span>German Whisper Transcriber</span>
        </div>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Add 7 new per-project windows to `index.html`**, each wrapping the exact existing `<article class="project">` block from the current `#win-sideprojects` content (v1 plan's Task 6), moved verbatim, one project per window: `win-side-cloner`, `win-side-rift`, `win-side-esports`, `win-side-winrate`, `win-side-yugioh`, `win-side-crewai`, `win-side-whisper`. Follow the exact same window-chrome pattern as Task 5's Step 3 (mac-window / window-header / window-controls / window-title / `window-content projects-app` wrapping the moved article). Stagger each window's `top`/`left` inline style by ~20px from the previous one, starting around `top: 70px; left: 300px;`, each sized `width: 560px; height: 520px;` (or `440` height for `side-crewai`/`side-whisper`, which have no preview image and are shorter).

- [ ] **Step 3: Manual verification**

`python3 -m http.server 8000`, open `http://localhost:8000/`, click Side Projects — a folder grid with 3 category labels and 7 icons opens. Click each icon — its own project window opens with correct content. Structural fallback: `curl -s http://localhost:8000/ | grep -c 'folder-icon'` returns 11 (4 from Task 5 + 7 from this task), `curl -s http://localhost:8000/ | grep -c 'win-side-'` returns 7, `curl -s http://localhost:8000/ | grep -c 'folder-group-label'` returns 3.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Split Side Projects into a folder of 7 per-project windows"
```

---

### Task 7: Vercel deploy config + documentation update

**Files:**
- Modify: `CLAUDE.md` (update hosting/structure sections for Vercel + `api/` + `assets/icons/`)
- Modify: `README.md` (replace GitHub Pages deploy instructions with Vercel instructions and the `OPENROUTER_API_KEY` setup step)

**Interfaces:**
- Consumes: everything from Tasks 1-6.
- Produces: nothing (final task).

- [ ] **Step 1: Update `CLAUDE.md`'s "Running it" and "Structure and conventions" sections**

Replace the "Running it" section body with:

```markdown
Static frontend: open `index.html` directly, or serve the root for correct relative paths (`python3 -m http.server 8000`). The `/api/chat` endpoint only runs under Vercel — locally, run `vercel dev` (requires the Vercel CLI and a `.env.local` with `OPENROUTER_API_KEY` set) if you need to exercise the Claude Code chat end-to-end; without it, the chat UI still renders and gracefully shows a "could not reach the assistant" message.

Deployed via Vercel's GitHub integration (auto-deploy on push to `main`). `OPENROUTER_API_KEY` must be set as a Vercel project environment variable (Project Settings → Environment Variables) — never commit it to the repo.
```

Add to the file-structure bullet list:
```markdown
- `assets/icons/` — SVG icon set for every desktop/dock/folder icon (replaces the earlier emoji icons).
- `api/chat.js` — Vercel serverless function backing the Claude Code chat window: keyword-overlap retrieval over `api/profile-data.json` plus a call to OpenRouter's free-tier chat completions API. Reads `OPENROUTER_API_KEY` from the environment; never exposes it to the client.
- `api/profile-data.json` — structured `{id, title, tags, body}` sections used for retrieval, sourced verbatim from the portfolio's own content (About, Tools, Coursework, Experience, Certificates, all 11 projects).
- `vercel.json` — pins the Node runtime for `api/chat.js`.
```

- [ ] **Step 2: Update `README.md`'s deploy section** — replace the GitHub Pages instructions with:

```markdown
## Deploy

This site is deployed via [Vercel](https://vercel.com):

1. Import the repo into Vercel (New Project → select this GitHub repo).
2. In Project Settings → Environment Variables, add `OPENROUTER_API_KEY` with a real OpenRouter API key (get one at https://openrouter.ai/keys). Required for the Claude Code chat window's `/api/chat` endpoint.
3. Every push to `main` auto-deploys. The frontend stays fully static; only `api/chat.js` runs as a serverless function.
```

- [ ] **Step 3: Manual verification**

Read both updated files once to confirm the Vercel/GitHub Pages swap is complete and no stray reference to GitHub Pages as the deploy target remains in either file.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "Update docs for Vercel hosting, api/ directory, and icon assets"
```

---

## Self-Review Notes

- **Spec coverage:** real SVG icons replacing emoji (Task 1) — covered; Projects/Side Projects folder restructure with per-project windows (Tasks 5, 6) — covered, all 11 projects accounted for (4 academic + 7 side, matching the v1 ledger's correction from "6" to "7"); real RAG-backed Claude Code chat (Tasks 2-4) — covered, including the OpenRouter endpoint/headers/model-suffix/rate-limit handling exactly as confirmed from OpenRouter's docs; Vercel hosting migration (Task 7) — covered.
- **Type/interface consistency:** every new window still follows `#win-<appId>`/`.window-header`/`.close-btn`, so `js/window-manager.js` needs zero changes (confirmed in Global Constraints) — checked against Tasks 1, 4, 5, 6 all reusing this shape. `POST /api/chat` request/response shape (`{message}` → `{reply}`/`{error}`) is defined once in Task 3 and consumed identically in Task 4. `.folder-grid`/`.folder-icon`/`.folder-group-label` defined once in Task 5, reused without redefinition in Task 6.
- **Placeholder scan:** the only intentional non-literal content is Task 5 Step 3 / Task 6 Step 2's instruction to move existing `<article>` blocks verbatim (explicitly marked as "extract the real content that already exists" rather than "write placeholder text later") — this is a relocation instruction, not a content placeholder, since the real text already exists in the merged `index.html` and the task explicitly forbids paraphrasing it.
