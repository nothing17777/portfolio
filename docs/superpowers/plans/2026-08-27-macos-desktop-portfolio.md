# macOS Desktop Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-scroll landing page with a macOS-desktop-simulator experience (menu bar, Dock, desktop icons, draggable glass windows) that hosts all existing portfolio content verbatim.

**Architecture:** Static HTML/CSS/JS, no build step. `index.html` holds the OS shell (menu bar, desktop icons, dock) and every window's markup/content inline. `css/os.css` styles the OS chrome; `css/apps.css` styles per-window content. `js/window-manager.js` handles open/close/focus/drag + the menu bar clock; `js/apps.js` handles the Terminal command evaluator, the Claude Code scripted demo, and the Contact mock-submit.

**Tech Stack:** Plain HTML5, CSS3 (custom properties), vanilla JS (no frameworks, no build tools). Deployed via GitHub Pages from `main` root.

**Spec:** `docs/superpowers/specs/2026-08-27-macos-desktop-portfolio-design.md`

## Global Constraints

- No build step, no package manager, no dependencies — plain static files only.
- Reuse the existing design tokens from `styles.css:1-19` verbatim: `--paper:#F6F6F3`, `--paper-raised:#FBFBF9`, `--ink:#15171B`, `--ink-soft:#3A3D44`, `--graphite:#5B5E66`, `--hairline:#DDDCD5`, `--accent:#3F55E8`, `--accent-ink:#2A3AB8`, `--accent-soft:#EAEBFB`, fonts `--display:"Space Grotesk","Inter",sans-serif`, `--body:"Inter",-apple-system,BlinkMacSystemFont,sans-serif`, `--mono:"JetBrains Mono",ui-monospace,monospace`. This is a **light** "paper" theme, not dark glass.
- All portfolio content (project text, findings, links, cert images, experience dates) must be copied verbatim from the current `index.html` — no paraphrasing, no placeholder text.
- No boot/loading animation. Site loads directly into the desktop.
- Contact and Claude Code windows stay scripted/mock — no real network calls.
- `write-ups/*.html`, `notebooks/*.ipynb`, and everything under `assets/` are unchanged and reused by relative path exactly as today.
- Verification for every task is manual (open in a local server + browser check) — this repo has no test framework and none is being introduced, per `CLAUDE.md`'s "no build, no tests" convention.

---

### Task 1: OS chrome shell — menu bar, desktop icons, dock (no windows yet)

**Files:**
- Create: `css/os.css`
- Create: `index.html` (new shell, replacing the current file)

**Interfaces:**
- Produces: CSS classes `.menubar`, `.menubar-left`, `.menubar-right`, `.menubar-logo`, `.menubar-item`, `.menubar-clock`, `.desktop`, `.desktop-icon`, `.dock`, `.dock-icon`, `.dock-tooltip` — consumed by Task 2's `window-manager.js` (`[data-app]` selector) and by every later window/icon task.
- Consumes: nothing (first task).

- [ ] **Step 1: Write `css/os.css` with menu bar, desktop, and dock chrome**

```css
:root{
  --paper: #F6F6F3;
  --paper-raised: #FBFBF9;
  --ink: #15171B;
  --ink-soft: #3A3D44;
  --graphite: #5B5E66;
  --hairline: #DDDCD5;
  --accent: #3F55E8;
  --accent-ink: #2A3AB8;
  --accent-soft: #EAEBFB;

  --display: "Space Grotesk", "Inter", sans-serif;
  --body: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;

  --menubar-h: 28px;
  --dock-h: 64px;
}

*, *::before, *::after{ box-sizing: border-box; }

html, body{
  margin: 0;
  height: 100%;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  -webkit-font-smoothing: antialiased;
}

/* Menu bar */
.menubar{
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--menubar-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: rgba(251, 251, 249, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--hairline);
  font-size: 0.8rem;
  z-index: 1000;
}
.menubar-left{ display: flex; align-items: center; gap: 18px; }
.menubar-logo{ font-family: var(--display); font-weight: 700; }
.menubar-item{ color: var(--ink-soft); cursor: default; }
.menubar-clock{ color: var(--ink-soft); font-family: var(--mono); font-size: 0.75rem; }

/* Desktop */
.desktop{
  position: fixed;
  top: var(--menubar-h);
  left: 0; right: 0;
  bottom: var(--dock-h);
  padding: 20px;
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(auto-fill, 90px);
  grid-template-columns: repeat(auto-fill, 84px);
  gap: 12px;
  z-index: 1;
}
.desktop-icon{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 84px;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  user-select: none;
}
.desktop-icon:hover{ background: rgba(63, 85, 232, 0.08); }
.desktop-icon .icon-glyph{
  font-size: 2rem;
  margin-bottom: 4px;
}
.desktop-icon span{
  font-size: 0.72rem;
  color: var(--ink);
  font-weight: 500;
}

/* Dock */
.dock{
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(251, 251, 249, 0.75);
  border: 1px solid var(--hairline);
  border-radius: 18px;
  padding: 8px;
  display: flex;
  gap: 10px;
  z-index: 1000;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px rgba(21, 23, 27, 0.12);
}
.dock-icon{
  width: 46px;
  height: 46px;
  border-radius: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  background: var(--accent-soft);
  transition: transform 0.15s ease;
  position: relative;
  user-select: none;
}
.dock-icon:hover{ transform: scale(1.15) translateY(-6px); }
.dock-tooltip{
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--ink);
  color: var(--paper);
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.68rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.dock-icon:hover .dock-tooltip{ opacity: 1; }
```

- [ ] **Step 2: Write the new `index.html` shell with menu bar, 6 desktop icons, and 5 dock icons (windows added in later tasks)**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tim Zhang — Software Engineering</title>
  <meta name="description" content="Tim Zhang — UCLA Computer Science. Systems, computer vision, and applied ML.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/os.css">
  <link rel="stylesheet" href="css/apps.css">
</head>
<body>

  <div class="menubar">
    <div class="menubar-left">
      <span class="menubar-logo">TZ</span>
      <span class="menubar-item">File</span>
      <span class="menubar-item">Edit</span>
      <span class="menubar-item">View</span>
    </div>
    <div class="menubar-right">
      <span id="menubar-clock" class="menubar-clock"></span>
    </div>
  </div>

  <div class="desktop">
    <div class="desktop-icon" data-app="about">
      <span class="icon-glyph">👤</span>
      <span>About Me</span>
    </div>
    <div class="desktop-icon" data-app="sideprojects">
      <span class="icon-glyph">🧪</span>
      <span>Side Projects</span>
    </div>
    <div class="desktop-icon" data-app="tools">
      <span class="icon-glyph">🛠️</span>
      <span>Tools & Automation</span>
    </div>
    <div class="desktop-icon" data-app="coursework">
      <span class="icon-glyph">🎓</span>
      <span>Coursework</span>
    </div>
    <div class="desktop-icon" data-app="certs">
      <span class="icon-glyph">🏅</span>
      <span>Certificates</span>
    </div>
    <div class="desktop-icon" data-app="experience">
      <span class="icon-glyph">💼</span>
      <span>Experience</span>
    </div>
  </div>

  <!-- WINDOWS: added in Tasks 2-10 -->

  <div class="dock">
    <div class="dock-icon" data-app="terminal">
      🐚
      <span class="dock-tooltip">Terminal</span>
    </div>
    <div class="dock-icon" data-app="claude">
      🤖
      <span class="dock-tooltip">Claude Code</span>
    </div>
    <div class="dock-icon" data-app="projects">
      💼
      <span class="dock-tooltip">Projects</span>
    </div>
    <div class="dock-icon" data-app="resume">
      📄
      <span class="dock-tooltip">Resume</span>
    </div>
    <div class="dock-icon" data-app="contact">
      ✉️
      <span class="dock-tooltip">Contact</span>
    </div>
  </div>

  <script src="js/window-manager.js"></script>
  <script src="js/apps.js"></script>
</body>
</html>
```

- [ ] **Step 3: Manual verification**

Run: `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/` in a browser.
Expected: menu bar visible at top with "TZ", File/Edit/View, and empty space where the clock will go (Task 2 adds it). Desktop shows 6 icons in a left-aligned grid. Dock is centered at the bottom with 5 icons; hovering each shows its tooltip and a lift animation. No console errors (the two `<script src>` 404s are expected and fixed in Task 2 — confirm the *only* errors are those two 404s).

- [ ] **Step 4: Commit**

```bash
git add index.html css/os.css
git rm styles.css script.js
git commit -m "Replace landing page with macOS desktop shell (menu bar, desktop icons, dock)"
```

---

### Task 2: Window manager (open/close/focus/drag/clock) + Terminal window

**Files:**
- Create: `js/window-manager.js`
- Create: `js/apps.js`
- Modify: `css/os.css` (append window-chrome rules)
- Modify: `css/apps.css` (create — terminal content rules)
- Modify: `index.html` (add `#win-terminal` markup in the windows placeholder from Task 1)

**Interfaces:**
- Produces: global `window.WM = { open(appId), close(appId), focus(appId) }`; convention that every window is `<div id="win-<appId>" class="mac-window">` containing a `.window-header` with a `.close-btn`. Every later window task (3–10) relies on this exact convention and calls no other API.
- Consumes: `.desktop-icon[data-app]` / `.dock-icon[data-app]` from Task 1 (click delegation), `#menubar-clock` from Task 1.

- [ ] **Step 1: Append window-chrome CSS to `css/os.css`**

```css
/* Windows */
.mac-window{
  position: absolute;
  width: 620px;
  height: 460px;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - var(--menubar-h) - var(--dock-h) - 24px);
  background: var(--paper-raised);
  border-radius: 10px;
  border: 1px solid var(--hairline);
  box-shadow: 0 20px 48px rgba(21, 23, 27, 0.18);
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 10;
}
.window-header{
  background: #F0F0EC;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--hairline);
  cursor: move;
  flex-shrink: 0;
}
.window-controls{ display: flex; gap: 7px; position: absolute; }
.control-btn{
  width: 12px; height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  padding: 0;
}
.close-btn{ background: #ff5f56; }
.min-btn{ background: #ffbd2e; }
.max-btn{ background: #27c93f; }
.window-title{
  width: 100%;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ink-soft);
}
.window-content{
  flex-grow: 1;
  padding: 18px 20px;
  overflow-y: auto;
  color: var(--ink);
}
```

- [ ] **Step 2: Write `js/window-manager.js`**

```js
(function () {
  let highestZ = 10;

  function getWin(appId) {
    return document.getElementById(`win-${appId}`);
  }

  function idOf(win) {
    return win.id.replace('win-', '');
  }

  function focusWindow(appId) {
    const win = getWin(appId);
    if (!win) return;
    highestZ += 1;
    win.style.zIndex = highestZ;
  }

  function openWindow(appId) {
    const win = getWin(appId);
    if (!win) return;
    win.style.display = 'flex';
    focusWindow(appId);
  }

  function closeWindow(appId) {
    const win = getWin(appId);
    if (win) win.style.display = 'none';
  }

  function dragStart(win, clientX, clientY) {
    focusWindow(idOf(win));
    const rect = win.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    function move(x, y) {
      win.style.left = `${x - offsetX}px`;
      win.style.top = `${y - offsetY}px`;
    }

    function onMouseMove(e) { move(e.clientX, e.clientY); }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    function onTouchMove(e) {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }
    function onTouchEnd() {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function initIcons() {
    document.querySelectorAll('[data-app]').forEach((el) => {
      el.addEventListener('click', () => openWindow(el.dataset.app));
    });
  }

  function initWindowChrome() {
    document.querySelectorAll('.mac-window').forEach((win) => {
      const header = win.querySelector('.window-header');
      const closeBtn = win.querySelector('.close-btn');

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.control-btn')) return;
        dragStart(win, e.clientX, e.clientY);
      });
      header.addEventListener('touchstart', (e) => {
        if (e.target.closest('.control-btn')) return;
        const t = e.touches[0];
        dragStart(win, t.clientX, t.clientY);
      }, { passive: true });

      win.addEventListener('mousedown', () => focusWindow(idOf(win)));
      closeBtn.addEventListener('click', () => closeWindow(idOf(win)));
    });
  }

  function initClock() {
    const clockEl = document.getElementById('menubar-clock');
    if (!clockEl) return;
    function tick() {
      const now = new Date();
      const date = now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const time = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      clockEl.textContent = `${date}  ${time}`;
    }
    tick();
    setInterval(tick, 30000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    initWindowChrome();
    initClock();
  });

  window.WM = { open: openWindow, close: closeWindow, focus: focusWindow };
})();
```

- [ ] **Step 3: Create `css/apps.css` with terminal content styling**

```css
.terminal-app{
  font-family: var(--mono);
  font-size: 0.85rem;
  line-height: 1.6;
}
.terminal-output{ margin-bottom: 10px; white-space: pre-wrap; }
.terminal-input-row{ display: flex; align-items: center; gap: 8px; }
.terminal-prompt{ color: var(--accent-ink); font-weight: bold; }
.terminal-input{
  background: transparent;
  border: none;
  outline: none;
  color: var(--ink);
  font-family: var(--mono);
  flex-grow: 1;
  font-size: 0.85rem;
}
```

- [ ] **Step 4: Add the Terminal window markup to `index.html`, replacing the `<!-- WINDOWS: added in Tasks 2-10 -->` comment**

```html
  <div id="win-terminal" class="mac-window" style="top: 60px; left: 60px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">tim@portfolio — zsh — 80×24</div>
    </div>
    <div class="window-content terminal-app">
      <div id="term-output" class="terminal-output">Welcome to Tim Zhang's portfolio shell.
Type 'help' to see available commands.</div>
      <div class="terminal-input-row">
        <span class="terminal-prompt">tim@portfolio ~ %</span>
        <input type="text" id="term-input" class="terminal-input" autocomplete="off" spellcheck="false" />
      </div>
    </div>
  </div>

  <!-- WINDOWS: added in Tasks 3-10 -->
```

- [ ] **Step 5: Write `js/apps.js` with the Terminal command evaluator**

```js
(function () {
  const APP_NAMES = {
    about: 'About Me',
    sideprojects: 'Side Projects',
    tools: 'Tools & Automation',
    coursework: 'Coursework',
    certs: 'Certificates',
    experience: 'Experience',
    projects: 'Projects',
    resume: 'Resume',
    contact: 'Contact',
    claude: 'Claude Code',
  };

  function initTerminal() {
    const input = document.getElementById('term-input');
    const output = document.getElementById('term-output');
    if (!input || !output) return;

    function print(html) {
      output.innerHTML += `\n${html}`;
      output.parentElement.scrollTop = output.parentElement.scrollHeight;
    }

    function run(cmd) {
      const lower = cmd.toLowerCase().trim();
      print(`<span class="terminal-prompt">tim@portfolio ~ %</span> ${cmd}`);

      if (lower === 'help') {
        print(`Available commands:
  help                 show this list
  open &lt;app&gt;           open a window (about, projects, sideprojects,
                       tools, coursework, certs, experience, resume, contact, claude)
  clear                clear this terminal`);
      } else if (lower === 'clear') {
        output.innerHTML = '';
        return;
      } else if (lower.startsWith('open ')) {
        const target = lower.slice(5).trim();
        if (APP_NAMES[target]) {
          window.WM.open(target);
          print(`Opening ${APP_NAMES[target]}…`);
        } else {
          print(`open: unknown app "${target}"`);
        }
      } else {
        print(`command not found: ${cmd}`);
      }
    }

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const cmd = input.value.trim();
      input.value = '';
      if (cmd) run(cmd);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTerminal();
  });
})();
```

- [ ] **Step 6: Manual verification**

Run: `python3 -m http.server 8000`, open `http://localhost:8000/`.
Expected: menu bar clock shows the current date/time and updates. Clicking the Terminal dock icon opens the terminal window on top; dragging its header (mouse) moves it; clicking its red button closes it; reopening via the dock icon works again. In the terminal, typing `help` then Enter lists commands, `open projects` prints "Opening Projects…" (the Projects window itself doesn't exist until Task 6 — that's expected, `window.WM.open('projects')` is a no-op until then), `clear` wipes the output. On a touch device or browser touch emulation, dragging via touch also works.

- [ ] **Step 7: Commit**

```bash
git add index.html css/os.css css/apps.css js/window-manager.js js/apps.js
git commit -m "Add window manager (open/close/focus/drag/clock) and working Terminal window"
```

---

### Task 3: Claude Code scripted-demo window

**Files:**
- Modify: `index.html` (add `#win-claude` markup)
- Modify: `css/apps.css` (append `.claude-harness` rules)
- Modify: `js/apps.js` (append the scripted demo)

**Interfaces:**
- Consumes: `window.WM` (Task 2), the `#win-<appId>` / `.window-header` / `.close-btn` convention (Task 2).
- Produces: nothing consumed by later tasks (self-contained window).

- [ ] **Step 1: Append Claude Code CSS to `css/apps.css`**

```css
.claude-harness{ font-family: var(--mono); font-size: 0.85rem; }
.claude-step{ margin-bottom: 8px; }
.claude-badge{
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: bold;
  text-transform: uppercase;
  margin-right: 6px;
}
.claude-badge-thinking{ background: #FDF3D8; color: #8A6D1D; }
.claude-badge-shell{ background: var(--accent-soft); color: var(--accent-ink); }
.claude-badge-success{ background: #DFF3E6; color: #1E7A46; }
.claude-input-row{ display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.claude-prompt{ color: var(--accent-ink); font-weight: bold; }
.claude-input{
  background: transparent;
  border: none;
  outline: none;
  color: var(--ink);
  font-family: var(--mono);
  flex-grow: 1;
  font-size: 0.85rem;
}
```

- [ ] **Step 2: Add Claude Code window markup to `index.html`**

```html
  <div id="win-claude" class="mac-window" style="top: 90px; left: 140px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">claude-code — agentic-harness</div>
    </div>
    <div class="window-content claude-harness">
      <div id="claude-output">
        <div>Claude Code CLI — sandboxed session ready.</div>
        <div style="margin-top: 8px; color: var(--graphite);">This is a scripted demo — type any task and watch a simulated agent loop run.</div>
      </div>
      <div class="claude-input-row">
        <span class="claude-prompt">claude &gt;</span>
        <input type="text" id="claude-input" class="claude-input" autocomplete="off" spellcheck="false" placeholder="e.g. 'refactor the window manager'" />
      </div>
    </div>
  </div>

  <!-- WINDOWS: added in Tasks 4-10 -->
```

- [ ] **Step 3: Append the scripted demo to `js/apps.js`, inside the existing IIFE, calling it from the `DOMContentLoaded` listener**

```js
  function initClaudeDemo() {
    const input = document.getElementById('claude-input');
    const output = document.getElementById('claude-output');
    if (!input || !output) return;

    const STEPS = [
      { type: 'thinking', text: 'Scanning workspace for relevant files…' },
      { type: 'shell', text: 'git diff --stat' },
      { type: 'thinking', text: 'Planning the change…' },
      { type: 'success', text: 'Done — changes applied and verified.' },
    ];

    function runTask(task) {
      input.disabled = true;
      output.innerHTML += `<div style="margin-top: 12px; color: var(--accent-ink);">&gt; ${task}</div>`;

      let i = 0;
      function next() {
        if (i >= STEPS.length) {
          input.disabled = false;
          input.focus();
          return;
        }
        const step = STEPS[i];
        output.innerHTML += `<div class="claude-step"><span class="claude-badge claude-badge-${step.type}">${step.type}</span>${step.text}</div>`;
        output.parentElement.scrollTop = output.parentElement.scrollHeight;
        i += 1;
        setTimeout(next, 900);
      }
      next();
    }

    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const task = input.value.trim();
      input.value = '';
      if (task) runTask(task);
    });
  }
```

Add `initClaudeDemo();` to the existing `document.addEventListener('DOMContentLoaded', ...)` block next to `initTerminal();`.

- [ ] **Step 4: Manual verification**

Reload `http://localhost:8000/`. Click the Claude Code dock icon, type a task and press Enter — 4 scripted steps should print one at a time (~0.9s apart) with colored badges, then the input re-enables. Window drags/closes/reopens like the Terminal.

- [ ] **Step 5: Commit**

```bash
git add index.html css/apps.css js/apps.js
git commit -m "Add Claude Code scripted-demo window"
```

---

### Task 4: About Me, Tools & Automation, Coursework windows

**Files:**
- Modify: `index.html` (add `#win-about`, `#win-tools`, `#win-coursework` markup)
- Modify: `css/apps.css` (append `.prose-app` rules)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Append shared prose styling to `css/apps.css`**

```css
.prose-app{ font-family: var(--body); font-size: 0.92rem; line-height: 1.6; }
.prose-app p{ margin: 0 0 12px; }
.prose-app ul{ margin: 0; padding-left: 20px; }
.prose-app li{ margin-bottom: 8px; }
.prose-app .mono-small{ font-family: var(--mono); font-size: 0.8rem; color: var(--graphite); }
```

- [ ] **Step 2: Add the three windows to `index.html`, content copied verbatim from the current site's `#about`, `#tools`, `#coursework` sections**

```html
  <div id="win-about" class="mac-window" style="top: 70px; left: 200px; width: 460px; height: 260px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">About Me</div>
    </div>
    <div class="window-content prose-app">
      <p>
        I'm a Computer Science undergraduate at UCLA who uses agentic AI in my daily workflow to
        build and code cool projects. I enjoy turning ideas into practical software while learning
        new technologies along the way.
      </p>
    </div>
  </div>

  <div id="win-tools" class="mac-window" style="top: 100px; left: 240px; width: 480px; height: 320px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Tools & Automation</div>
    </div>
    <div class="window-content prose-app">
      <p>
        Beyond project code, I use Zapier to wire OpenAI's ChatGPT and Claude directly into the
        tools I use daily &mdash; email and document handling included.
      </p>
      <ul>
        <li>Zapier pipelines connect ChatGPT and Claude to Gmail to draft, schedule, and
          auto-reply to email based on trigger conditions.</li>
        <li>The same models are wired to Google Drive to generate on-demand summaries of
          documents.</li>
        <li>Extensive daily use of <strong>Claude Code</strong> &mdash; custom slash commands,
          skills, and subagents built into a working development loop, not just chat.</li>
        <li>Also work across Antigravity, Codex, and Cursor for AI-assisted development.</li>
      </ul>
    </div>
  </div>

  <div id="win-coursework" class="mac-window" style="top: 130px; left: 280px; width: 440px; height: 200px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Coursework</div>
    </div>
    <div class="window-content prose-app">
      <p class="mono-small">
        Data Structures &amp; Algorithms &middot; Object-Oriented Programming &middot; Software Design &middot;
        Introduction to Machine Learning &middot; Foundations of Computer Vision
      </p>
    </div>
  </div>

  <!-- WINDOWS: added in Tasks 5-10 -->
```

- [ ] **Step 3: Manual verification**

Reload, click the About Me / Tools & Automation / Coursework desktop icons. Each opens its window with the exact text above (not paraphrased), drags/closes/reopens correctly, and content scrolls if the window is resized smaller than the content (test by shrinking the browser window — `.window-content` already has `overflow-y: auto` from Task 2).

- [ ] **Step 4: Commit**

```bash
git add index.html css/apps.css
git commit -m "Add About Me, Tools & Automation, and Coursework windows"
```

---

### Task 5: Projects window (4 CV/ML projects)

**Files:**
- Modify: `index.html` (add `#win-projects` markup)
- Modify: `css/apps.css` (append `.projects-app` rules)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2). Consumed by Task 2's terminal `open projects` command (already wired, becomes functional once this task lands).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Append projects styling to `css/apps.css`**

```css
.projects-app .project{ border-bottom: 1px solid var(--hairline); padding-bottom: 18px; margin-bottom: 18px; }
.projects-app .project:last-child{ border-bottom: none; margin-bottom: 0; }
.projects-app .project-meta{ display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
.projects-app .tag{ font-size: 0.68rem; padding: 2px 8px; border-radius: 10px; background: var(--accent-soft); color: var(--accent-ink); }
.projects-app .tag.mono{ font-family: var(--mono); background: transparent; border: 1px solid var(--hairline); color: var(--graphite); }
.projects-app h3{ font-family: var(--display); font-size: 1rem; margin: 4px 0 10px; }
.projects-app .project-preview img{ width: 100%; border-radius: 6px; border: 1px solid var(--hairline); display: block; margin-bottom: 10px; }
.projects-app p{ font-size: 0.88rem; line-height: 1.55; margin: 0 0 8px; }
.projects-app .findings{ padding-left: 18px; margin: 0 0 10px; }
.projects-app .findings li{ font-size: 0.85rem; margin-bottom: 6px; }
.projects-app .project-links{ display: flex; gap: 14px; font-family: var(--mono); font-size: 0.8rem; }
```

- [ ] **Step 2: Add the Projects window to `index.html`, with all 4 project articles copied verbatim from the current `#projects` section**

```html
  <div id="win-projects" class="mac-window" style="top: 50px; left: 320px; width: 640px; height: 520px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Projects</div>
    </div>
    <div class="window-content projects-app">

      <article class="project">
        <div class="project-meta">
          <span class="tag">EC ENGR 149 · Foundations of Computer Vision</span>
          <span class="tag mono">Python · PyTorch</span>
        </div>
        <h3>CNN-Based Image Classification — CIFAR-10</h3>
        <a class="project-preview" href="write-ups/cnn-image-classification.html">
          <img src="assets/write-ups/cnn-sample-images.jpg" alt="Sample CIFAR-10 training images: a truck, a bird, a frog and a horse at 32&times;32 resolution" loading="lazy">
        </a>
        <p>
          Built and trained a convolutional neural network from scratch in PyTorch for 10-class
          image classification, then swept batch size and epoch count to study the trade-off
          between gradient noise and convergence speed.
        </p>
        <ul class="findings">
          <li>Best configuration (batch size 16, 20 epochs) reached <strong>65.7% test
              accuracy</strong>, versus 55.5% at only 5 epochs with the same batch size &mdash; most of
            the accuracy gain came from training longer, not from architecture changes.</li>
          <li>At a fixed 5 epochs, the <em>smaller</em> batch size (4) outperformed the larger one
            (58.1% vs. 55.5%) &mdash; noisier, more frequent gradient updates helped early on. That
            reversed once given enough epochs, where the larger batch's steadier gradient estimates
            pulled ahead (65.7% vs. 61.2% at 20 epochs).</li>
          <li>Explained and applied core CNN mechanics: how padding and kernel size determine
            output size, why max pooling has no learnable parameters, and why batch normalization
            uses running statistics at inference instead of the current batch's mean/variance.</li>
        </ul>
        <div class="project-links">
          <a href="write-ups/cnn-image-classification.html">Write-up ↗</a>
          <a href="https://github.com/nothing17777/portfolio/blob/main/notebooks/cnn-image-classification.ipynb" target="_blank" rel="noopener">Notebook ↗</a>
        </div>
      </article>

      <article class="project">
        <div class="project-meta">
          <span class="tag">EC ENGR 149 · Foundations of Computer Vision</span>
          <span class="tag mono">Python · NumPy · OpenCV</span>
        </div>
        <h3>Robust Geometric Estimation — SIFT, RANSAC & Homography</h3>
        <a class="project-preview" href="write-ups/robust-geometric-estimation.html">
          <img src="assets/write-ups/rge-sift-correspondences.jpg" alt="SIFT keypoint correspondences drawn between two overlapping photographs of a campus courtyard" loading="lazy">
        </a>
        <p>
          Full correspondence pipeline built from primitives: SIFT keypoint detection and
          descriptor matching, a from-scratch RANSAC loop for robust homography estimation, and
          inverse warping with bilinear interpolation to stitch image pairs into a single panorama.
        </p>
        <ul class="findings">
          <li>Implemented direct linear transform (DLT) homography estimation from raw
            correspondences, then RANSAC to separate true matches from spurious ones.</li>
          <li>Stitching without RANSAC visibly breaks on outlier matches — a direct, visual
            demonstration of why robust estimation matters, not just a theoretical footnote.</li>
          <li>Extended the same approach to insert new content into a target image via homography
            (compositing a name plate into a photograph using four corner correspondences).</li>
          <li>Also implemented the eight-point algorithm for essential matrix estimation and 3D
            point reconstruction from stereo correspondences (2.7% mean reprojection error).</li>
        </ul>
        <div class="project-links">
          <a href="write-ups/robust-geometric-estimation.html">Write-up ↗</a>
          <a href="https://github.com/nothing17777/portfolio/blob/main/notebooks/robust-geometric-estimation.ipynb" target="_blank" rel="noopener">Notebook ↗</a>
        </div>
      </article>

      <article class="project">
        <div class="project-meta">
          <span class="tag">EC ENGR 149 · Foundations of Computer Vision</span>
          <span class="tag mono">Python · NumPy</span>
        </div>
        <h3>Feature Detection — Edges, Blobs &amp; Corners</h3>
        <a class="project-preview" href="write-ups/feature-detection.html">
          <img src="assets/write-ups/fd-harris-corners.jpg" alt="Harris corner detection output: corners marked on a synthetic test image after non-maximum suppression" loading="lazy">
        </a>
        <p>
          A ground-up image-filtering stack: 2D convolution, Gaussian/median/bilateral filtering,
          gradient-based edge detection, Laplacian-of-Gaussian blob detection, and Harris corner
          detection with non-maximum suppression — every operator derived and implemented by hand.
        </p>
        <ul class="findings">
          <li>Compared average, Gaussian, and median filtering for denoising; median filtering won
            on both quantitative error (lowest relative L1 distance) and visual edge preservation.</li>
          <li>Derived a bilateral filter from first principles to smooth flat regions while keeping
            edges sharp — the same idea behind "cartoonize" filters in consumer photo apps.</li>
          <li>Built full non-max suppression for Harris corners: threshold → sort by response →
            greedy spatial suppression, from scratch, no library calls.</li>
        </ul>
        <div class="project-links">
          <a href="write-ups/feature-detection.html">Write-up ↗</a>
          <a href="https://github.com/nothing17777/portfolio/blob/main/notebooks/feature-detection.ipynb" target="_blank" rel="noopener">Notebook ↗</a>
        </div>
      </article>

      <article class="project">
        <div class="project-meta">
          <span class="tag">M146 · Intro to Machine Learning</span>
          <span class="tag mono">Python · HF Transformers · PEFT / LoRA</span>
        </div>
        <h3>Semantic Matching &amp; Reasoning with Language Models</h3>
        <a class="project-preview" href="write-ups/semantic-matching-llm.html">
          <img src="assets/write-ups/m146-lexical-overlap.jpg" alt="Histogram of lexical overlap by label on the PAWS test set, showing paraphrase and non-paraphrase pairs overlapping almost entirely" loading="lazy">
        </a>
        <p>
          Two-part final project comparing how far you can push a small language model with
          architecture, fine-tuning, and prompting alone.
        </p>
        <ul class="findings">
          <li><strong>Paraphrase detection (PAWS):</strong> a bi-encoder baseline (MiniLM + logistic
            regression) hit 61.8% test accuracy — it can't see token-level word-order swaps that
            flip meaning. Fine-tuning a DistilBERT cross-encoder pushed that to 81.9%, matched by
            few-shot prompting a 1.5B instruct model (81.5%) with zero training.</li>
          <li><strong>Math reasoning (GSM8K):</strong> LoRA fine-tuned Qwen2.5-1.5B on 1,000 then
            2,000 examples, taking base-model accuracy from 36% → 47% → 49%, training under 0.15%
            of total parameters. Diagnosed the model's actual failure modes (percentage
            misinterpretation, arithmetic slips, problem misreads) before and after tuning.</li>
          <li><strong>Prompt engineering:</strong> a "reread the problem first" prompt alone lifted
            base-model accuracy 44% → 60% — matching what fine-tuning achieved, with no training.</li>
        </ul>
        <div class="project-links">
          <a href="write-ups/semantic-matching-llm.html">Write-up ↗</a>
          <a href="https://github.com/nothing17777/portfolio/blob/main/notebooks/semantic-matching-llm.ipynb" target="_blank" rel="noopener">Notebook ↗</a>
        </div>
      </article>

    </div>
  </div>

  <!-- WINDOWS: added in Tasks 6-10 -->
```

- [ ] **Step 3: Manual verification**

Reload, click the Projects dock icon. All 4 project cards render with their preview images loading correctly (check the network tab — no 404s on `assets/write-ups/*.jpg`), findings lists, and both links per project. Click a "Write-up ↗" link and confirm it opens the existing `write-ups/*.html` page correctly (still using the old `styles.css` — that page is unchanged and out of scope for this plan). Back in the Terminal window (Task 2), run `open projects` — it now actually opens this window instead of being a no-op.

- [ ] **Step 4: Commit**

```bash
git add index.html css/apps.css
git commit -m "Add Projects window with all 4 CV/ML project write-ups"
```

---

### Task 6: Side Projects window (grouped by category)

**Files:**
- Modify: `index.html` (add `#win-sideprojects` markup)
- Modify: `css/apps.css` (append `.sideprojects-app` rules)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2), `.project`/`.project-meta`/`.tag`/`.findings`/`.project-links` classes from Task 5 (reused, not redefined).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Append side-projects/group styling to `css/apps.css`**

```css
.sideprojects-app .project-group{ margin-bottom: 20px; }
.sideprojects-app .project-group-head{
  font-family: var(--mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--graphite);
  cursor: pointer;
  padding: 4px 0;
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 12px;
}
```

- [ ] **Step 2: Add the Side Projects window to `index.html`, with all 6 side-project articles across 3 groups, copied verbatim from the current `#side-projects` section**

```html
  <div id="win-sideprojects" class="mac-window" style="top: 60px; left: 260px; width: 620px; height: 520px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Side Projects</div>
    </div>
    <div class="window-content projects-app sideprojects-app">

      <details class="project-group" open>
        <summary class="project-group-head">web tooling</summary>
        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">TypeScript · Node · Playwright · Next.js</span>
          </div>
          <h3>Website Template Cloner</h3>
          <a class="project-preview" href="https://github.com/nothing17777/Website-Template-Cloner" target="_blank" rel="noopener">
            <img src="assets/previews/preview-website-template-cloner.jpg" alt="Side-by-side comparison of cluely.com and the generated template: identical layout and geometry, with all copy and imagery replaced by placeholders" loading="lazy">
          </a>
          <p>
            An agent-driven pipeline that turns any webpage into a reusable front-end template:
            it captures the rendered DOM, every stylesheet and a full-page screenshot, measures how
            the page is built, and emits a self-contained Next.js app with placeholder copy and
            imagery &mdash; the construction reproduced, the content left behind.
          </p>
          <ul class="findings">
            <li>Resolves exact values without staying attached to the live page: the captured DOM is
              reloaded with the captured CSS in a headless browser, so <code>getComputedStyle</code>
              resolves the real cascade offline and every run is reproducible from the same bytes.</li>
            <li>Every colour, spacing, type-scale and breakpoint value is cited to a selector and
              property, or written as <code>UNVERIFIED</code> &mdash; never guessed.</li>
            <li>Placeholder substitution is enforced by an idempotent script, matching original word
              counts and image dimensions so the template still measures like the page it came from
              &mdash; the apple.com/iPhone rebuild lands within <strong>1px over a 12,967px page</strong>.</li>
            <li>Reconnaissance, per-section specs, parallel builder agents, visual band-by-band diffing
              and the static&rarr;Next.js conversion are wired together as a Claude Code skill.</li>
          </ul>
          <div class="project-links">
            <a href="https://github.com/nothing17777/Website-Template-Cloner" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>
      </details>

      <details class="project-group" open>
        <summary class="project-group-head">league of legends</summary>

        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">Next.js · TypeScript · Tailwind · Framer Motion</span>
          </div>
          <h3>Rift Connections</h3>
          <a class="project-preview" href="https://rift-connection.vercel.app" target="_blank" rel="noopener">
            <img src="assets/previews/preview-rift-connections.jpg" alt="Rift Connections homepage showing the daily 4x4 connections puzzle and Teemo mascot scene" loading="lazy">
          </a>
          <p>
            A daily NYT Connections-style puzzle for League of Legends: group 16 champions into
            four hidden thematic categories (shared regions, roles, resources, abilities) in a
            4&times;4 grid, with a 3D mascot scene and streak tracking across daily and unlimited modes.
          </p>
          <ul class="findings">
            <li>Puzzles are procedurally generated from a bank of 40 disjoint champion-relationship
              pools, so the daily board is different every time rather than hand-authored per day.</li>
            <li>Ships both a daily puzzle (with a browsable archive of past boards) and an unlimited
              practice mode, plus a match-history view for tracking streaks over time.</li>
            <li>Built as a Next.js 14 monorepo workspace with Tailwind CSS, Framer Motion for the
              grid/reveal animations, and Zustand for client-side game state.</li>
          </ul>
          <div class="project-links">
            <a href="https://rift-connection.vercel.app" target="_blank" rel="noopener">Live ↗</a>
            <a href="https://github.com/nothing17777/rift_connection" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>

        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">Next.js · TypeScript · Turso (libSQL) · Recharts</span>
          </div>
          <h3>ESPORTS.DATA — League of Legends Esports Analytics</h3>
          <a class="project-preview" href="https://riot-esports-data.vercel.app" target="_blank" rel="noopener">
            <img src="assets/previews/preview-esports-data.jpg" alt="ESPORTS.DATA dashboard showing professional League of Legends match, champion, and player statistics" loading="lazy">
          </a>
          <p>
            A data analytics dashboard covering 98,000+ professional League of Legends matches from
            2014&ndash;2026 across every major global league, sourced from Oracle's Elixir and served
            through a set of REST API routes backed by a Turso (libSQL) database.
          </p>
          <ul class="findings">
            <li>Champion analytics across presence (pick/ban rate), synergy (best pairings), counters
              (unfavorable matchups), lane-vs-lane performance, and win rates &mdash; each with its own
              dedicated API route and dashboard view.</li>
            <li>Browsable match history and pro player profiles, with league filtering across the
              full dataset and a light/dark theme.</li>
            <li>Built on Next.js 16 (App Router) with React 19, Tailwind CSS 4 and Radix/shadcn-style
              components, querying a libSQL database directly from serverless API routes.</li>
          </ul>
          <div class="project-links">
            <a href="https://riot-esports-data.vercel.app" target="_blank" rel="noopener">Live ↗</a>
            <a href="https://github.com/nothing17777/riot-esports-data-" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>

        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">React · Vite · TypeScript · Tailwind</span>
          </div>
          <h3>League of Legends Win Rate Quiz</h3>
          <a class="project-preview" href="https://league-winrate-quiz.vercel.app" target="_blank" rel="noopener">
            <img src="assets/previews/preview-winrate-quiz.jpg" alt="League of Legends Win Rate Quiz showing two champions side by side for a Higher or Lower guess" loading="lazy">
          </a>
          <p>
            A "Higher or Lower" streak quiz: two champions are shown side by side and you guess which
            one has the higher win rate &mdash; guess right and the streak continues, guess wrong and the
            run ends and both win rates are revealed.
          </p>
          <ul class="findings">
            <li>Animated count-up reveal of the actual win rates after each guess, with a running
              score bar and round-by-round guess history for the current run.</li>
            <li>High score and recent run history persist locally in the browser via <code>localStorage</code>,
              so streaks carry over between visits with no backend needed.</li>
            <li>Champion splash art and icons are pulled live from Riot's public Data Dragon CDN
              rather than bundled, keeping the app in sync with the current champion roster.</li>
          </ul>
          <div class="project-links">
            <a href="https://league-winrate-quiz.vercel.app" target="_blank" rel="noopener">Live ↗</a>
            <a href="https://github.com/nothing17777/league-winrate-quiz" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>
      </details>

      <details class="project-group" open>
        <summary class="project-group-head">ai agents &amp; tools</summary>

        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">LangChain · LangGraph · ChromaDB · Ollama · Streamlit</span>
          </div>
          <h3>Yu-Gi-Oh! RAG Chatbot</h3>
          <a class="project-preview" href="https://github.com/nothing17777/yugiohChatbot" target="_blank" rel="noopener">
            <img src="assets/previews/preview-yugioh-chatbot.jpg" alt="Yu-Gi-Oh! RAG Chatbot answering a question about the Ritual Beast archetype with a list of matching cards" loading="lazy">
          </a>
          <p>
            A Retrieval-Augmented Generation chatbot that answers questions over the full
            Yu-Gi-Oh! card database (~14,500 cards) using a locally-hosted LLM &mdash; no paid
            APIs, no external inference.
          </p>
          <ul class="findings">
            <li>Hybrid retrieval combines semantic vector search (Sentence Transformers +
              ChromaDB) with exact metadata filtering on archetype/card type, avoiding
              hallucinated results on structured queries like "list all Blue-Eyes cards."</li>
            <li>A LangGraph ReAct agent handles tool-calling and intent classification,
              routing greetings away from the retrieval pipeline and resolving follow-up
              questions ("what about that one's ATK?") from cached sources and chat history.</li>
            <li>Generation is grounded strictly in retrieved context &mdash; the prompt constrains
              the LLM (Qwen2.5-7B via Ollama) from inventing card names not present in the
              retrieved chunks.</li>
          </ul>
          <div class="project-links">
            <a href="https://github.com/nothing17777/yugiohChatbot" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>

        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">CrewAI · Ollama · Serper</span>
          </div>
          <h3>CrewAI News Agent</h3>
          <p>
            A multi-agent news pipeline built with CrewAI: a News Collector agent searches
            the web for the latest coverage of a topic, and a News Reporter agent turns
            those findings into a validated headline &mdash; both running sequentially against
            a local LLM rather than a hosted API.
          </p>
          <ul class="findings">
            <li>Two agents with distinct roles, goals, and backstories are orchestrated as a
              sequential Crew, with task outputs from the first agent feeding directly into
              the second.</li>
            <li>Web search is wired in as a CrewAI tool (Serper) so the collector agent can
              ground its findings in live results rather than model knowledge alone.</li>
            <li>Inference runs locally via Ollama (Qwen2.5-7B-Instruct), keeping the whole
              pipeline free to run.</li>
          </ul>
          <div class="project-links">
            <a href="https://github.com/nothing17777/crewai-news-agent" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>

        <article class="project">
          <div class="project-meta">
            <span class="tag">Personal Project</span>
            <span class="tag mono">Python · Streamlit · Whisper · PyTorch</span>
          </div>
          <h3>German Whisper Transcriber</h3>
          <p>
            A Streamlit app that transcribes German audio/video locally using OpenAI's
            Whisper model, then translates the transcript to English &mdash; built for cases
            where content shouldn't leave the machine to get transcribed.
          </p>
          <ul class="findings">
            <li>Runs Whisper fully locally with a model-size selector (tiny &rarr; large) and
              automatic GPU/CPU detection via PyTorch, trading speed for accuracy as needed.</li>
            <li>German transcription is force-decoded with <code>language="de"</code> to stay
              robust on unclear audio, then chunked and translated to English via
              MyMemory/Deep Translator to respect per-request character limits.</li>
            <li>Accepts mp3, mp4, wav, m4a, and webm uploads, with both the transcript and
              translation downloadable as text files.</li>
          </ul>
          <div class="project-links">
            <a href="https://github.com/nothing17777/german-whisper-transcriber" target="_blank" rel="noopener">GitHub ↗</a>
          </div>
        </article>
      </details>

    </div>
  </div>

  <!-- WINDOWS: added in Tasks 7-10 -->
```

- [ ] **Step 3: Manual verification**

Reload, click the Side Projects desktop icon. All 3 groups are expanded by default (native `<details open>`), each with correct articles, images loading, and links. Click a group's `<summary>` to confirm it collapses/expands natively. Window drags/closes/reopens correctly.

- [ ] **Step 4: Commit**

```bash
git add index.html css/apps.css
git commit -m "Add Side Projects window grouped by category"
```

---

### Task 7: Certificates window

**Files:**
- Modify: `index.html` (add `#win-certs` markup)
- Modify: `css/apps.css` (append `.certs-app` rules)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2), `.project`/`.project-meta`/`.tag`/`.project-links` classes from Task 5.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Append certificate grid styling to `css/apps.css`**

```css
.certs-app .project img{ max-width: 260px; }
```

- [ ] **Step 2: Add the Certificates window to `index.html`, with all 4 certificate articles copied verbatim from the current `#certificates` section**

```html
  <div id="win-certs" class="mac-window" style="top: 70px; left: 180px; width: 560px; height: 500px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Certificates</div>
    </div>
    <div class="window-content projects-app certs-app">

      <article class="project">
        <div class="project-meta">
          <span class="tag">Harvard University</span>
          <span class="tag mono">Python &middot; 2024</span>
        </div>
        <h3>CS50's Introduction to Programming with Python</h3>
        <a class="project-preview" href="https://cs50.harvard.edu/certificates/6f5148e6-1801-45be-8e0f-d5d5aa9cfa25" target="_blank" rel="noopener">
          <img src="assets/certificates/cert-cs50p.jpg" alt="CS50 certificate awarded to Yuqian Zhang for CS50's Introduction to Programming with Python, signed by David J. Malan" loading="lazy">
        </a>
        <p>
          Harvard University's introduction to programming in Python, completed through nine
          problem sets and one final project and awarded from Cambridge, Massachusetts in 2024.
        </p>
        <p class="mono-small">
          Issued under my legal name, Yuqian Zhang &mdash; Tim is the English name I go by.
        </p>
        <div class="project-links">
          <a href="https://cs50.harvard.edu/certificates/6f5148e6-1801-45be-8e0f-d5d5aa9cfa25" target="_blank" rel="noopener">Verify &#8599;</a>
        </div>
      </article>

      <article class="project">
        <div class="project-meta">
          <span class="tag">Anthropic</span>
          <span class="tag mono">AI Fluency</span>
        </div>
        <h3>AI Fluency: Framework &amp; Foundations</h3>
        <a class="project-preview" href="https://verify.skilljar.com/c/oweqzv8o2ei3" target="_blank" rel="noopener">
          <img src="assets/certificates/cert-ai-fluency.jpg" alt="Anthropic certificate of completion awarded to Tim Zhang for AI Fluency: Framework &amp; Foundations" loading="lazy">
        </a>
        <p>
          Anthropic's course on working effectively with AI systems, developed with University
          College Cork and Ringling College of Art + Design.
        </p>
        <div class="project-links">
          <a href="https://verify.skilljar.com/c/oweqzv8o2ei3" target="_blank" rel="noopener">Verify &#8599;</a>
        </div>
      </article>

      <article class="project">
        <div class="project-meta">
          <span class="tag">Anthropic</span>
          <span class="tag mono">Claude Code</span>
        </div>
        <h3>Claude Code 101</h3>
        <a class="project-preview" href="https://verify.skilljar.com/c/tay9smbmvv9c" target="_blank" rel="noopener">
          <img src="assets/certificates/cert-claude-code-101.jpg" alt="Anthropic certificate of completion awarded to Tim Zhang for Claude Code 101" loading="lazy">
        </a>
        <p>
          Anthropic's introductory course on Claude Code, its agentic command-line coding tool.
        </p>
        <div class="project-links">
          <a href="https://verify.skilljar.com/c/tay9smbmvv9c" target="_blank" rel="noopener">Verify &#8599;</a>
        </div>
      </article>

      <article class="project">
        <div class="project-meta">
          <span class="tag">Anthropic</span>
          <span class="tag mono">Claude Code</span>
        </div>
        <h3>Claude Code in Action</h3>
        <a class="project-preview" href="https://verify.skilljar.com/c/r8q4gcxeaye9" target="_blank" rel="noopener">
          <img src="assets/certificates/cert-claude-code-in-action.jpg" alt="Anthropic certificate of completion awarded to Tim Zhang for Claude Code in Action" loading="lazy">
        </a>
        <p>
          Anthropic's applied follow-on course on using Claude Code across real codebases and
          development workflows.
        </p>
        <div class="project-links">
          <a href="https://verify.skilljar.com/c/r8q4gcxeaye9" target="_blank" rel="noopener">Verify &#8599;</a>
        </div>
      </article>

    </div>
  </div>

  <!-- WINDOWS: added in Tasks 8-10 -->
```

- [ ] **Step 3: Manual verification**

Reload, click the Certificates desktop icon. All 4 certs render with real images (check network tab for 404s on `assets/certificates/*.jpg`) and each "Verify ↗" link points to the correct external URL (hover to check status bar, don't need to actually click through).

- [ ] **Step 4: Commit**

```bash
git add index.html css/apps.css
git commit -m "Add Certificates window"
```

---

### Task 8: Experience window (timeline)

**Files:**
- Modify: `index.html` (add `#win-experience` markup)
- Modify: `css/apps.css` (append `.xp-app` rules)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Append timeline styling to `css/apps.css`**

```css
.xp-app .xp-row{ display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--hairline); }
.xp-app .xp-row:last-child{ border-bottom: none; }
.xp-app .xp-when{ flex-shrink: 0; width: 130px; font-family: var(--mono); font-size: 0.75rem; color: var(--graphite); }
.xp-app .xp-what h4{ font-family: var(--display); font-size: 0.9rem; margin: 0 0 6px; }
.xp-app .xp-what p{ font-size: 0.85rem; margin: 0; line-height: 1.55; }
```

- [ ] **Step 2: Add the Experience window to `index.html`, copied verbatim from the current `#experience` section**

```html
  <div id="win-experience" class="mac-window" style="top: 100px; left: 220px; width: 540px; height: 420px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Experience</div>
    </div>
    <div class="window-content xp-app">

      <div class="xp-row">
        <div class="xp-when">Mar 2026 — present</div>
        <div class="xp-what">
          <h4>Computer Lab Consultant · UCLA SEASNet</h4>
          <p>Technical support for 100s of engineering students and faculty daily — software,
            hardware, and network issues. Runs training sessions on lab tools and contributes to
            lab-wide system improvements with the SEASNet technical team.</p>
        </div>
      </div>

      <div class="xp-row">
        <div class="xp-when">Jun 2022 — 2024</div>
        <div class="xp-what">
          <h4>Translator / Transcriber · TED Translators</h4>
          <p>Translated TED Talk scripts between English and Simplified Chinese; reviewed peer
            translations for accuracy, tone, and cultural sensitivity. Produced time-synced
            subtitles for global accessibility across concurrent projects.</p>
        </div>
      </div>

      <div class="xp-row">
        <div class="xp-when">Aug 2023 — Apr 2024</div>
        <div class="xp-what">
          <h4>Mathematics Tutor · Learn To Be</h4>
          <p>Tutored K–12 students from underserved communities, breaking down concepts into
            individualized, approachable lesson plans over live virtual sessions.</p>
        </div>
      </div>

    </div>
  </div>

  <!-- WINDOWS: added in Tasks 9-10 -->
```

- [ ] **Step 3: Manual verification**

Reload, click the Experience desktop icon. All 3 timeline rows render with correct dates/titles/descriptions matching the current site exactly.

- [ ] **Step 4: Commit**

```bash
git add index.html css/apps.css
git commit -m "Add Experience window"
```

---

### Task 9: Resume window

**Files:**
- Modify: `index.html` (add `#win-resume` markup)
- Modify: `css/apps.css` (append `.resume-app` rules)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2). Consumed by Task 2's terminal `open resume` command (already wired, becomes functional once this task lands).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Append resume styling to `css/apps.css`**

```css
.resume-app{ display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; text-align: center; }
.resume-app iframe{ width: 100%; height: 100%; border: 1px solid var(--hairline); border-radius: 6px; }
.resume-app .resume-fallback-link{ font-family: var(--mono); font-size: 0.85rem; }
```

- [ ] **Step 2: Add the Resume window to `index.html`, embedding the existing `assets/resume.pdf`**

```html
  <div id="win-resume" class="mac-window" style="top: 60px; left: 300px; width: 520px; height: 560px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Resume — Preview</div>
    </div>
    <div class="window-content resume-app">
      <iframe src="assets/resume.pdf" title="Tim Zhang's résumé"></iframe>
      <a class="resume-fallback-link" href="assets/resume.pdf" target="_blank" rel="noopener">Open in a new tab ↗</a>
    </div>
  </div>

  <!-- WINDOWS: added in Task 10 -->
```

- [ ] **Step 3: Manual verification**

Reload, click the Resume dock icon. The PDF renders inline in the iframe (browser's native PDF viewer); the "Open in a new tab" link also works. In the Terminal window, `open resume` now opens this window.

- [ ] **Step 4: Commit**

```bash
git add index.html css/apps.css
git commit -m "Add Resume window embedding assets/resume.pdf"
```

---

### Task 10: Contact window (mock form)

**Files:**
- Modify: `index.html` (add `#win-contact` markup)
- Modify: `css/apps.css` (append `.contact-app` rules)
- Modify: `js/apps.js` (append the mock-submit handler)

**Interfaces:**
- Consumes: `window.WM`/window-chrome convention (Task 2). Consumed by Task 2's terminal `open contact` command (already wired, becomes functional once this task lands).
- Produces: nothing consumed by later tasks (last window task).

- [ ] **Step 1: Append contact form styling to `css/apps.css`**

```css
.contact-app label{ display: block; font-size: 0.78rem; margin-bottom: 4px; color: var(--graphite); }
.contact-app input, .contact-app textarea{
  width: 100%;
  background: var(--paper);
  border: 1px solid var(--hairline);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--ink);
  margin-bottom: 12px;
  font-family: var(--body);
  font-size: 0.88rem;
}
.contact-app button{
  background: var(--accent);
  border: none;
  color: white;
  padding: 9px 18px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}
.contact-app button:hover{ background: var(--accent-ink); }
```

- [ ] **Step 2: Add the Contact window to `index.html`**

```html
  <div id="win-contact" class="mac-window" style="top: 90px; left: 340px; width: 400px; height: 420px;">
    <div class="window-header">
      <div class="window-controls">
        <button class="control-btn close-btn" aria-label="Close"></button>
        <button class="control-btn min-btn" aria-label="Minimize"></button>
        <button class="control-btn max-btn" aria-label="Maximize"></button>
      </div>
      <div class="window-title">Compose — Mail</div>
    </div>
    <div class="window-content contact-app">
      <form id="contact-form">
        <label for="contact-to">To</label>
        <input type="text" id="contact-to" value="timzhang.email@gmail.com" readonly>
        <label for="contact-from">Your Email Address</label>
        <input type="email" id="contact-from" required placeholder="name@domain.com">
        <label for="contact-message">Message</label>
        <textarea id="contact-message" required rows="4" placeholder="Hi Tim, let's collaborate..."></textarea>
        <button type="submit">Send</button>
      </form>
    </div>
  </div>
```

- [ ] **Step 3: Append the mock-submit handler to `js/apps.js`, inside the existing IIFE, calling it from the `DOMContentLoaded` listener**

```js
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Message sent (simulated) — thanks for reaching out!');
      window.WM.close('contact');
      form.reset();
    });
  }
```

Add `initContactForm();` to the existing `document.addEventListener('DOMContentLoaded', ...)` block next to `initTerminal();` and `initClaudeDemo();`.

- [ ] **Step 4: Manual verification**

Reload, click the Contact dock icon, fill in the required fields (the "To" field stays read-only), submit. Expected: an alert says "Message sent (simulated)…", the window closes, and reopening it shows an empty form (reset). Submitting with the email or message field empty is blocked by native HTML5 `required` validation. In the Terminal, `open contact` now opens this window.

- [ ] **Step 5: Commit**

```bash
git add index.html css/apps.css js/apps.js
git commit -m "Add Contact window with mock-submit"
```

---

### Task 11: Cleanup and final pass

**Files:**
- Modify: `CLAUDE.md` (update structure section to describe the new files)
- Modify: `docs/superpowers/specs/2026-08-27-macos-desktop-portfolio-design.md` (no changes expected — read-only reference check)

**Interfaces:**
- Consumes: everything from Tasks 1–10.
- Produces: nothing (final task).

- [ ] **Step 1: Update `CLAUDE.md`'s "Structure and conventions" section to describe the new file layout**

Replace the current `## Structure and conventions` section body (the bullet list describing `index.html`, `styles.css`, `write-ups/*.html`, `notebooks/*.ipynb`, `assets/`, `script.js`) with:

```markdown
- `index.html` — the OS shell: menu bar, desktop icons, dock, and every window's markup/content inline. All portfolio content is literal text inside each window's `.window-content` — edit it directly, there is no templating.
- `css/os.css` — menu bar, desktop icon grid, dock, and window chrome (drag handle, traffic-light buttons, glass blur). Design tokens (colors, fonts) are CSS custom properties in `:root` at the top of this file; retheme there.
- `css/apps.css` — per-window content styling (terminal, Claude Code demo, prose windows, project cards, certificates, timeline, resume, contact form).
- `js/window-manager.js` — `window.WM = { open, close, focus }`, drag (mouse + touch), and the menu bar clock. Every window follows the `<div id="win-<appId}" class="mac-window">` convention with a `.window-header` and a `.close-btn`; opening it is `data-app="<appId>"` on any icon.
- `js/apps.js` — the Terminal command evaluator, the Claude Code scripted demo, and the Contact form's mock-submit handler.
- `write-ups/*.html` — one standalone long-form page per academic project, unchanged. They still link back with `../styles.css` and `../index.html#projects`; the `#projects` anchor no longer exists on the new `index.html`; update these back-links to just `../index.html` when next touching a write-up page.
- `notebooks/*.ipynb` — the source Jupyter notebooks behind the academic projects, unchanged. Linked from the Projects window via absolute GitHub blob URLs, not relative paths.
- `assets/write-ups/` — figures exported from the notebooks, embedded in write-ups. `assets/previews/` — screenshots of the deployed side projects. `assets/certificates/` — certificate images. `assets/resume.pdf` — embedded in the Resume window and linked from the nav; replace the file in place, no HTML edit needed.
```

- [ ] **Step 2: Full manual walkthrough**

Run: `python3 -m http.server 8000`, open `http://localhost:8000/`.
Expected, checked in order: (1) no console errors on load; (2) every dock icon (Terminal, Claude Code, Projects, Resume, Contact) and every desktop icon (About Me, Side Projects, Tools & Automation, Coursework, Certificates, Experience) opens its window; (3) every window drags by its header, brings itself to front on click, and closes via the red button; (4) reopening a closed window via its icon works; (5) in the Terminal, `open <every appId>` opens the matching window; (6) resize the browser to a narrow width and confirm windows stay within the viewport (`max-width`/`max-height` from Task 2's CSS) rather than overflowing off-screen.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for the macOS desktop portfolio file structure"
```

---

## Self-Review Notes

- **Spec coverage:** menu bar (Task 1) — covered; Dock + desktop icons (Task 1) — covered; window manager drag/focus/close (Task 2) — covered; Terminal (Task 2), Claude Code (Task 3), About/Tools/Coursework (Task 4), Projects (Task 5), Side Projects (Task 6), Certificates (Task 7), Experience (Task 8), Resume (Task 9), Contact (Task 10) — each covered with verbatim content; file split into `css/os.css`, `css/apps.css`, `js/window-manager.js`, `js/apps.js` (spec's "Files" section) — covered; removal of old `styles.css`/`script.js` — Task 1 Step 4; light "paper" token reuse — Global Constraints + every CSS step; no boot animation — never introduced; Contact/Claude Code stay mock — Tasks 3 & 10; `write-ups/`/`notebooks/`/`assets/` untouched — confirmed, only their existing paths are referenced.
- **Type/interface consistency:** every window task uses the exact `id="win-<appId>"` / `.window-header` / `.close-btn` convention defined in Task 2; every icon uses `data-app="<appId>"` matching those same ids; `window.WM.open/close/focus` signatures are used identically in `js/apps.js` (Tasks 2, 3, 10) and never redefined.
- **Placeholder scan:** no TBD/TODO; every content step carries the actual verbatim text/markup: no step says "similar to the above" without repeating the code.
