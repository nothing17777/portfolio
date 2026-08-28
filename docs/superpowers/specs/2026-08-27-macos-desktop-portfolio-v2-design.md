# macOS Desktop Portfolio v2 — RAG Chat, Real Icons, Per-Project Apps — Design

## Relationship to the original spec

Amends `docs/superpowers/specs/2026-08-27-macos-desktop-portfolio-design.md`.
Tasks 1–8 of the original implementation plan (OS shell, window manager,
Terminal, About Me, Tools & Automation, Coursework, Projects, Side
Projects, Certificates, Experience) are built and merged into this
branch and are NOT rebuilt. This document specifies what changes on top
of that work, and supersedes the original spec's decisions on three
points: icons, the Claude Code window, and the Projects/Side Projects
window structure. Everything else from the original spec (design tokens,
window-manager API, file split for `os.css`/existing `apps.css`, content
verbatim requirement) still applies.

## What changes

### 1. Real icon assets (replaces all emoji)

Every emoji used for a desktop icon, dock icon, or folder icon is
replaced with a custom SVG icon, generated to match the site's existing
light "paper" palette (`--paper`, `--ink`, `--accent`, etc. — see the v1
spec's Global Constraints). One SVG per icon, stored under
`assets/icons/`, referenced via `<img>` (not inlined) so the markup stays
readable. Icon set needed: Terminal, Claude Code, Projects (folder),
Side Projects (folder), Resume, Contact, About Me, Tools & Automation,
Coursework, Certificates, Experience, plus one generic "project" app
icon reused for every individual project inside the two folders (11
distinct projects total: 4 academic + 7 side projects — see Task 6's
ledger note correcting "6" to "7").

### 2. Projects and Side Projects become Finder-style folders

**Current state (Task 5/6, built):** `#win-projects` and
`#win-sideprojects` are each one large window containing all of that
category's project articles inline, opened directly from a dock/desktop
icon.

**New state:** the Projects and Side Projects desktop/dock icons open a
**folder window** — a Finder-style icon grid (reusing the `.desktop-icon`
grid pattern from the OS shell, scoped inside a window instead of the
whole desktop) listing one icon per project in that category. Double-
clicking a project icon opens a **new, small app window** containing
that single project's existing content (unchanged: preview image,
summary paragraph, findings list, links) — i.e., the exact content
blocks already written in Tasks 5 and 6 get redistributed one-per-window
instead of concatenated into one long window. No content is rewritten,
only regrouped.

- Projects folder: 4 icons (CNN Classification, Robust Geometric
  Estimation, Feature Detection, Semantic Matching & Reasoning).
- Side Projects folder: 7 icons, grouped visually into the same 3
  categories as before (web tooling / league of legends / ai agents &
  tools) via section headers inside the folder grid, not separate nested
  folders.
- Every per-project window follows the existing `#win-<appId>` /
  `.window-header` / `.close-btn` convention from `window-manager.js` —
  no changes needed to the window manager itself, since it already
  handles any element matching `.mac-window` generically.

### 3. Claude Code becomes a real RAG-backed chat

**Current state (Task 3, built):** `#win-claude` runs a fixed 4-step
scripted demo with no real logic.

**New state:** a real chat interface — a scrollable message list (user
messages right-aligned, assistant messages left-aligned, styled to keep
the existing terminal-adjacent monospace aesthetic) plus a text input.
Submitting a message POSTs to a new serverless function which retrieves
relevant profile content and calls an LLM, then streams/returns the
answer into the chat.

**Content the assistant can answer about:** the same content already
live on the site — bio, all 11 projects (findings, tech stack), tools &
automation, coursework, certificates, experience/timeline, resume
highlights. This content is authored once as a structured JSON file
(`api/profile-data.json` or similar) derived from the existing window
content — not duplicated by hand a second time in prose; the JSON is
generated from the same source facts already in `index.html`.

**Retrieval:** given the corpus is small (~11 project entries + a
handful of other sections, well under what fits in a single LLM context
window), retrieval is a simple relevance filter over the JSON (keyword
overlap between the question and each section's title/tags/body — no
vector database needed) rather than true embedding-based RAG. This is a
deliberate simplicity choice (YAGNI) given the corpus size — an
embedding store would be over-engineering for content this small.

**LLM call:** the serverless function calls OpenRouter's chat completions
endpoint:
- `POST https://openrouter.ai/api/v1/chat/completions`
- Header: `Authorization: Bearer <OPENROUTER_API_KEY>` (server-side env
  var, never exposed to the client)
- Header: `Content-Type: application/json`
- Body: `{ "model": "<a :free-suffixed model id>", "messages": [...] }`
  — system message carries the retrieved profile context + an instruction
  to answer only from that context and say so if something isn't covered;
  user message is the visitor's question.
- **Constraint:** OpenRouter's free tier caps at 20 requests/minute and
  50 requests/day per key without a $10 credit purchase (confirmed from
  OpenRouter's own rate-limit docs). The serverless function must handle
  a 429 from OpenRouter gracefully and return a friendly "rate limited,
  try again later" message to the chat UI rather than a raw error.

### 4. Hosting moves to Vercel

The site gains a build step and a backend for the first time: the
serverless function under `api/` (Vercel's convention — a plain
`api/chat.js` file exporting a handler is sufficient, no framework
needed). Everything else (`index.html`, `css/`, `js/`, `assets/`,
`write-ups/`, `notebooks/`) stays static and unchanged in how it's
served. Deploy moves from GitHub Pages (`main` branch root) to Vercel's
GitHub integration (auto-deploy on push to `main`). `OPENROUTER_API_KEY`
is set as a Vercel environment variable, never committed to the repo.

## Out of scope (unchanged from v1)

- Contact form stays a client-side mock (no real email backend) — the
  RAG backend is the only new server-side capability being added.
- No user auth, no chat history persistence across sessions — each page
  load starts a fresh chat.
- No streaming responses required (a single request/response per message
  is sufficient) — can be added later if desired but isn't required now.
