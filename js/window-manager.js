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

  function dockIconFor(appId) {
    return document.querySelector(`.dock-icon[data-app="${appId}"]`);
  }

  // Any app can be "running" in the dock while its window is open, not just
  // the four pinned icons — mirrors real macOS, where launching anything
  // gives it a temporary dock icon that disappears again on quit. Reuses a
  // pinned icon if one already exists for this appId; otherwise clones the
  // icon/label off whatever element (desktop icon, folder icon, ...) opened
  // this window and appends a transient icon to #dock-running.
  function ensureRunningIcon(appId) {
    const existing = dockIconFor(appId);
    if (existing) return existing;

    const dockRunning = document.getElementById('dock-running');
    if (!dockRunning) return null;

    const source = document.querySelector(`[data-app="${appId}"]`);
    const img = source ? source.querySelector('img') : null;
    const span = source ? source.querySelector('span') : null;
    const win = getWin(appId);
    const title = win ? win.querySelector('.window-title') : null;

    const el = document.createElement('div');
    el.className = 'dock-icon dock-icon-transient';
    el.dataset.app = appId;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    const icon = img ? img.getAttribute('src') : '';
    const label = span ? span.textContent : (title ? title.textContent : appId);
    el.innerHTML = `<img class="dock-icon-img" src="${icon}" alt="" width="40" height="40" draggable="false"><span>${label}</span>`;
    wireIconInteraction(el);
    dockRunning.appendChild(el);
    return el;
  }

  function removeRunningIcon(appId) {
    const el = dockIconFor(appId);
    if (!el) return;
    el.classList.remove('is-running', 'is-minimized');
    if (el.classList.contains('dock-icon-transient')) el.remove();
  }

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  function openWindow(appId) {
    const win = getWin(appId);
    if (!win) return;
    const wasHidden = win.style.display !== 'flex';
    win.classList.remove('is-minimizing');
    win.style.display = 'flex';
    if (wasHidden) {
      win.classList.remove('is-open', 'is-closing');
      if (reducedMotion()) {
        // No animation will run under reduced motion, so 'animationend' below
        // would never fire and the window would stay stuck at opacity: 0.
        win.classList.add('is-open');
      } else {
        win.classList.add('is-opening');
        win.addEventListener('animationend', () => {
          win.classList.remove('is-opening');
          win.classList.add('is-open');
        }, { once: true });
      }
    }
    focusWindow(appId);
    const dockIcon = ensureRunningIcon(appId);
    if (dockIcon) {
      dockIcon.classList.add('is-running');
      dockIcon.classList.remove('is-minimized');
    }
  }

  function closeWindow(appId) {
    const win = getWin(appId);
    if (!win || win.style.display === 'none') return;
    win.classList.remove('is-open', 'is-opening', 'is-minimizing', 'is-maximized');
    if (reducedMotion()) {
      win.style.display = 'none';
      win.classList.remove('is-closing');
    } else {
      win.classList.add('is-closing');
      win.addEventListener('animationend', () => {
        win.style.display = 'none';
        win.classList.remove('is-closing');
      }, { once: true });
    }
    removeRunningIcon(appId);
  }

  // Minimize: same end state as closeWindow (display: none) but the dock
  // icon stays behind — marked .is-minimized instead of removed — so
  // clicking it restores the window via the normal openWindow path.
  function minimizeWindow(appId) {
    const win = getWin(appId);
    if (!win || win.style.display === 'none') return;
    win.classList.remove('is-open', 'is-opening');
    const finish = () => {
      win.style.display = 'none';
      win.classList.remove('is-minimizing');
    };
    if (reducedMotion()) {
      finish();
    } else {
      win.classList.add('is-minimizing');
      win.addEventListener('animationend', finish, { once: true });
    }
    const dockIcon = ensureRunningIcon(appId);
    if (dockIcon) {
      dockIcon.classList.add('is-running', 'is-minimized');
    }
  }

  function toggleMaximize(win) {
    const appId = idOf(win);
    if (!reducedMotion()) {
      // .is-maximized's target values are set with !important (so they
      // beat the inline top/left/width/height drag/resize leave behind),
      // but a CSS transition still animates smoothly to !important values —
      // only the cascade resolution is affected, not animatability. Add the
      // transition for the duration of this one resize, then drop it so
      // dragging/resizing afterward stays instant.
      win.classList.add('is-maximize-animating');
      win.addEventListener('transitionend', () => {
        win.classList.remove('is-maximize-animating');
      }, { once: true });
    }
    if (win.classList.contains('is-maximized')) {
      const prev = win.dataset.prevRect ? JSON.parse(win.dataset.prevRect) : null;
      win.classList.remove('is-maximized');
      if (prev) {
        win.style.top = prev.top;
        win.style.left = prev.left;
        win.style.width = prev.width;
        win.style.height = prev.height;
      }
      delete win.dataset.prevRect;
    } else {
      win.dataset.prevRect = JSON.stringify({
        top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height,
      });
      win.classList.add('is-maximized');
    }
    focusWindow(appId);
  }

  function dragStart(win, clientX, clientY) {
    focusWindow(idOf(win));
    const rect = win.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    // Clamp so the header (and its close/minimize/maximize buttons) can
    // never be dragged fully behind the menubar — otherwise the window
    // becomes unreachable: no title bar to drag back down, no buttons to
    // close or minimize it.
    const menubarH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--menubar-h')) || 0;
    function move(x, y) {
      win.style.left = `${x - offsetX}px`;
      win.style.top = `${Math.max(menubarH, y - offsetY)}px`;
    }

    function onMouseMove(e) { move(e.clientX, e.clientY); }
    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.dispatchEvent(new CustomEvent('wm:window-drag-end'));
    }
    function onTouchMove(e) {
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }
    function onTouchEnd() {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.dispatchEvent(new CustomEvent('wm:window-drag-end'));
    }

    document.dispatchEvent(new CustomEvent('wm:window-drag-start'));
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  // Icon layout persistence: desktop/dock launcher icons can be dragged
  // freely; a dock icon dragged onto the desktop becomes a desktop icon
  // (and back). Layout is remembered per-browser via localStorage.
  const ICON_LAYOUT_KEY = 'portfolio-icon-layout';
  const iconRegistry = {};

  function loadIconLayout() {
    try {
      return JSON.parse(localStorage.getItem(ICON_LAYOUT_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveIconState(appId, state) {
    const layout = loadIconLayout();
    layout[appId] = state;
    try {
      localStorage.setItem(ICON_LAYOUT_KEY, JSON.stringify(layout));
    } catch (e) {
      // localStorage unavailable (private mode, quota) — layout just won't persist
    }
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Where a dropped icon should land among the dock's existing icons,
  // based on the drop x position vs. each icon's horizontal midpoint.
  function dockInsertIndexForX(dockEl, x, excludeEl) {
    const children = Array.from(dockEl.querySelectorAll(':scope > [data-app]')).filter((c) => c !== excludeEl);
    for (let i = 0; i < children.length; i++) {
      const r = children[i].getBoundingClientRect();
      if (x < r.left + r.width / 2) return i;
    }
    return children.length;
  }

  // Record the dock's current left-to-right icon order so it survives reload.
  function persistDockOrder(dockEl) {
    const layout = loadIconLayout();
    Array.from(dockEl.querySelectorAll(':scope > [data-app]')).forEach((child, i) => {
      layout[child.dataset.app] = { home: 'dock', order: i };
    });
    try {
      localStorage.setItem(ICON_LAYOUT_KEY, JSON.stringify(layout));
    } catch (e) {
      // localStorage unavailable (private mode, quota) — layout just won't persist
    }
  }

  // Mutate an existing icon element in place into the desktop-icon shape —
  // never clone, so a dock icon dragged out stays the same DOM node
  // (drag listeners, tabindex, etc. survive) instead of leaving a stray
  // duplicate behind in its old container.
  function applyDesktopShape(el, data) {
    el.className = 'desktop-icon';
    el.innerHTML = `<img class="icon-glyph" src="${data.icon}" alt="" width="40" height="40" draggable="false"><span>${data.label}</span>`;
  }

  function applyDockShape(el, data) {
    el.className = 'dock-icon';
    el.innerHTML = `<img class="dock-icon-img" src="${data.icon}" alt="" width="40" height="40" draggable="false"><span>${data.label}</span>`;
  }

  function wireIconInteraction(el) {
    el.addEventListener('click', () => {
      if (el.dataset.justDragged === '1') {
        delete el.dataset.justDragged;
        return;
      }
      openWindow(el.dataset.app);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openWindow(el.dataset.app);
      }
    });
    el.addEventListener('mousedown', (e) => {
      // Without this, dragging the icon's <img> triggers the browser's
      // native image-drag gesture instead of our mousemove/mouseup drag,
      // which swallows the mouseup entirely — the icon then silently
      // keeps tracking the cursor and finish() never runs.
      e.preventDefault();
      iconDragStart(el, e.clientX, e.clientY);
    });
    el.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      iconDragStart(el, t.clientX, t.clientY);
    }, { passive: true });
  }

  function iconDragStart(el, startClientX, startClientY) {
    const appId = el.dataset.app;
    const data = iconRegistry[appId];
    if (!data) return;

    // Clear any leftover inline transform from the dock's hover-magnify
    // effect (initDockMagnify) before measuring — otherwise a drag that
    // starts while the icon is magnified keeps that scale baked into the
    // drag offset and, if dropped on the desktop, permanently enlarged
    // (the desktop has no code path that ever clears it again).
    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const offsetX = startClientX - rect.left;
    const offsetY = startClientY - rect.top;
    let dragging = false;
    let placeholder = null;

    function move(x, y) {
      if (!dragging) {
        if (Math.hypot(x - startClientX, y - startClientY) < 4) return;
        dragging = true;
        el.classList.add('icon-dragging');
        // Leave a same-sized placeholder in the icon's old dock/desktop
        // slot for the drag's duration. Without it, pulling the icon out
        // of the dock's flex layout shrinks the dock and re-centers it
        // (since it's centered via left: 50%), which shifts every other
        // icon's position mid-drag — the drop target keeps moving under
        // the cursor, making reordering feel broken.
        if (el.parentElement && el.parentElement.classList.contains('dock')) {
          placeholder = document.createElement('div');
          placeholder.className = 'dock-icon-placeholder';
          placeholder.style.width = `${rect.width}px`;
          placeholder.style.height = `${rect.height}px`;
          el.parentElement.insertBefore(placeholder, el);
        }
        document.body.appendChild(el);
        el.style.position = 'fixed';
        el.style.margin = '0';
        el.style.zIndex = '3000';
      }
      el.style.left = `${x - offsetX}px`;
      el.style.top = `${y - offsetY}px`;
      if (placeholder) {
        const dockEl = document.querySelector('.dock');
        const insertIndex = dockInsertIndexForX(dockEl, x, el);
        const siblings = Array.from(dockEl.querySelectorAll(':scope > [data-app]'));
        if (insertIndex >= siblings.length) {
          dockEl.appendChild(placeholder);
        } else {
          dockEl.insertBefore(placeholder, siblings[insertIndex]);
        }
      }
    }

    function finish(x, y) {
      cleanup();
      if (!dragging) return;
      el.classList.remove('icon-dragging');
      // The dock's hover-magnify effect (initDockMagnify) can re-apply its
      // inline scale transform to this icon on every mousemove while it's
      // still parented inside the dock, even mid-drag — clear it again here
      // so a stale scale never survives the drop.
      el.style.transform = '';
      el.dataset.justDragged = '1';
      // Reparenting el above can suppress the browser's usual post-drag
      // click event, leaving this flag stuck forever and swallowing the
      // *next* unrelated click; auto-clear it as a safety net.
      setTimeout(() => { delete el.dataset.justDragged; }, 300);
      el.style.zIndex = '';

      const dockEl = document.querySelector('.dock');
      const desktopEl = document.querySelector('.desktop');
      const dockRect = dockEl.getBoundingClientRect();
      const overDock = x >= dockRect.left && x <= dockRect.right && y >= dockRect.top && y <= dockRect.bottom;

      if (overDock) {
        applyDockShape(el, data);
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        el.style.margin = '';
        // The placeholder already tracks the live drop index (updated on
        // every move), so just swap the real icon into its spot.
        if (placeholder) {
          placeholder.replaceWith(el);
          placeholder = null;
        } else {
          dockEl.appendChild(el);
        }
        persistDockOrder(dockEl);
      } else {
        if (placeholder) {
          placeholder.remove();
          placeholder = null;
        }
        if (el.className !== 'desktop-icon') applyDesktopShape(el, data);
        const desktopRect = desktopEl.getBoundingClientRect();
        const iconRect = el.getBoundingClientRect();
        const left = clamp(x - offsetX - desktopRect.left, 0, desktopRect.width - iconRect.width);
        const top = clamp(y - offsetY - desktopRect.top, 0, desktopRect.height - iconRect.height);
        el.style.position = 'absolute';
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        desktopEl.appendChild(el);
        saveIconState(appId, { home: 'desktop', x: left, y: top });
      }
    }

    function onMouseMove(e) { move(e.clientX, e.clientY); }
    function onMouseUp(e) { finish(e.clientX, e.clientY); }
    function onTouchMove(e) {
      e.preventDefault();
      const t = e.touches[0];
      move(t.clientX, t.clientY);
    }
    function onTouchEnd(e) {
      const t = e.changedTouches[0];
      finish(t.clientX, t.clientY);
    }
    function cleanup() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function initIcons() {
    const desktopEl = document.querySelector('.desktop');
    const dockEl = document.querySelector('.dock');
    if (!desktopEl || !dockEl) return;

    // Build the registry (icon src, label, default home) from the
    // page's own default markup before applying any saved layout.
    desktopEl.querySelectorAll(':scope > [data-app]').forEach((el) => {
      const img = el.querySelector('img');
      const label = el.querySelector('span');
      iconRegistry[el.dataset.app] = {
        icon: img ? img.getAttribute('src') : '',
        label: label ? label.textContent : el.dataset.app,
        home: 'desktop',
      };
    });
    dockEl.querySelectorAll(':scope > [data-app]').forEach((el) => {
      const img = el.querySelector('img');
      const label = el.querySelector('span');
      iconRegistry[el.dataset.app] = {
        icon: img ? img.getAttribute('src') : '',
        label: label ? label.textContent : el.dataset.app,
        home: 'dock',
      };
    });

    // Any icon can be dragged into or out of the dock, same as real macOS.
    const layout = loadIconLayout();
    const dockAppIds = Object.keys(layout)
      .filter((appId) => layout[appId] && layout[appId].home === 'dock')
      .sort((a, b) => (layout[a].order ?? 0) - (layout[b].order ?? 0));

    Object.keys(layout).forEach((appId) => {
      const data = iconRegistry[appId];
      const saved = layout[appId];
      if (!data || !saved || saved.home !== 'desktop') return;

      const el = document.querySelector(`.desktop > [data-app="${appId}"], .dock > [data-app="${appId}"]`);
      if (!el) return;

      if (el.className !== 'desktop-icon') applyDesktopShape(el, data);
      el.style.position = 'absolute';
      el.style.left = `${saved.x}px`;
      el.style.top = `${saved.y}px`;
      if (el.parentElement !== desktopEl) desktopEl.appendChild(el);
    });

    // Re-append dock icons in their saved left-to-right order (appendChild
    // on each in sequence naturally reproduces that order).
    dockAppIds.forEach((appId) => {
      const data = iconRegistry[appId];
      const el = document.querySelector(`.desktop > [data-app="${appId}"], .dock > [data-app="${appId}"]`);
      if (!data || !el) return;
      if (el.className !== 'dock-icon') applyDockShape(el, data);
      dockEl.appendChild(el);
    });

    document.querySelectorAll('[data-app]').forEach((el) => {
      if (el.dataset.wired === '1') return;
      el.dataset.wired = '1';
      wireIconInteraction(el);
    });
  }

  const MIN_WIN_WIDTH = 320;
  const MIN_WIN_HEIGHT = 220;

  function resizeStart(win, startClientX, startClientY) {
    focusWindow(idOf(win));
    const rect = win.getBoundingClientRect();
    const startWidth = rect.width;
    const startHeight = rect.height;

    function move(x, y) {
      const newWidth = Math.max(MIN_WIN_WIDTH, startWidth + (x - startClientX));
      const newHeight = Math.max(MIN_WIN_HEIGHT, startHeight + (y - startClientY));
      win.style.width = `${newWidth}px`;
      win.style.height = `${newHeight}px`;
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

  function initWindowChrome() {
    document.querySelectorAll('.mac-window').forEach((win) => {
      const header = win.querySelector('.window-header');
      const closeBtn = win.querySelector('.close-btn');
      const minBtn = win.querySelector('.min-btn');
      const maxBtn = win.querySelector('.max-btn');

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.control-btn') || win.classList.contains('is-maximized')) return;
        dragStart(win, e.clientX, e.clientY);
      });
      header.addEventListener('touchstart', (e) => {
        if (e.target.closest('.control-btn') || win.classList.contains('is-maximized')) return;
        const t = e.touches[0];
        dragStart(win, t.clientX, t.clientY);
      }, { passive: true });

      win.addEventListener('mousedown', () => focusWindow(idOf(win)));
      closeBtn.addEventListener('click', () => closeWindow(idOf(win)));
      if (minBtn) minBtn.addEventListener('click', () => minimizeWindow(idOf(win)));
      if (maxBtn) maxBtn.addEventListener('click', () => toggleMaximize(win));
      header.addEventListener('dblclick', (e) => {
        if (e.target.closest('.control-btn')) return;
        toggleMaximize(win);
      });

      const handle = document.createElement('div');
      handle.className = 'window-resize-handle';
      handle.setAttribute('aria-hidden', 'true');
      win.appendChild(handle);
      handle.addEventListener('mousedown', (e) => {
        if (win.classList.contains('is-maximized')) return;
        e.stopPropagation();
        resizeStart(win, e.clientX, e.clientY);
      });
      handle.addEventListener('touchstart', (e) => {
        if (win.classList.contains('is-maximized')) return;
        e.stopPropagation();
        const t = e.touches[0];
        resizeStart(win, t.clientX, t.clientY);
      }, { passive: true });
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
    setInterval(tick, 1000);
  }

  function initDockMagnify() {
    const dock = document.querySelector('.dock');
    if (!dock || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const maxScale = 1.5;
    const spread = 90;

    dock.addEventListener('mousemove', (e) => {
      const icons = dock.querySelectorAll('[data-app]');
      icons.forEach((icon) => {
        const rect = icon.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(e.clientX - center);
        const scale = dist < spread ? 1 + (maxScale - 1) * (1 - dist / spread) : 1;
        icon.style.transform = `scale(${scale}) translateY(${(scale - 1) * -20}px)`;
      });
    });
    dock.addEventListener('mouseleave', () => {
      dock.querySelectorAll('[data-app]').forEach((icon) => { icon.style.transform = ''; });
    });
  }

  function centerWindow(appId) {
    const win = getWin(appId);
    if (!win) return;
    const wasHidden = win.style.display !== 'flex';
    if (wasHidden) win.style.display = 'flex'; // measure real size before showing
    const rect = win.getBoundingClientRect();
    if (wasHidden) win.style.display = 'none';
    const menubar = document.querySelector('.menubar');
    const dock = document.querySelector('.dock');
    const top = menubar ? menubar.getBoundingClientRect().height : 0;
    const bottom = dock ? dock.getBoundingClientRect().top : window.innerHeight;
    win.style.left = `${Math.max(16, (window.innerWidth - rect.width) / 2)}px`;
    win.style.top = `${Math.max(top + 16, top + (bottom - top - rect.height) / 2)}px`;
  }

  // First-visit layout: About Me carries the identity/hero content (name,
  // pitch, résumé/contact), tiled beside the AI assistant so a visitor gets
  // both "who is this" and "ask me anything" at once, with nothing hidden
  // behind clicks. Positions are fixed px (matches the rest of this file's
  // window placements, which assume a desktop-width viewport).
  function openDefaultWindows() {
    // On mobile, windows are full-screen and single-app — skip the
    // desktop-width tiling and just show the desktop icons/dock.
    if (isMobile()) return;
    const about = getWin('about');
    const claude = getWin('claude');
    const gap = 60;
    const iconClearance = 140; // keep clear of the desktop icon column on the left
    const rightMargin = 16;
    // Center the About Me + AI Assistant pair as a group on the desktop
    // (Tools and Framework no longer opens by default, so there's no
    // third window to balance against on the right).
    const aboutW = about ? about.getBoundingClientRect().width || 420 : 420;
    const claudeW = claude ? claude.getBoundingClientRect().width || 620 : 620;
    const claudeH = claude ? claude.getBoundingClientRect().height || 460 : 460;
    const sideBySideWidth = aboutW + gap + claudeW;
    const fitsSideBySide = iconClearance + sideBySideWidth + rightMargin <= window.innerWidth;
    const dock = document.querySelector('.dock');
    const dockTop = dock ? dock.getBoundingClientRect().top : window.innerHeight - 90;
    const maxClaudeTop = Math.max(70, Math.round(dockTop - 16 - claudeH));

    if (fitsSideBySide) {
      const startX = Math.max(
        iconClearance,
        Math.round((window.innerWidth - sideBySideWidth) / 2)
      );
      if (about) {
        about.style.top = '70px';
        about.style.left = `${startX}px`;
        openWindow('about');
      }
      if (claude) {
        // Left lower than About Me so the gap above it (between the menubar
        // and this window) stays open for the basketball hoop/ball, which
        // centers itself in that gap — see js/basketball.js. Clamped above
        // the dock so short viewports don't hide the chat input behind it.
        claude.style.top = `${Math.min(420, maxClaudeTop)}px`;
        claude.style.left = `${startX + aboutW + gap}px`;
        openWindow('claude');
        focusWindow('claude');
      }
    } else {
      // Not enough width to tile side by side (narrow desktop/tablet
      // viewport) — stack them instead so both stay fully on-screen. Both
      // windows' content areas scroll internally, so shrink their heights
      // to fit rather than letting either spill past the dock.
      const stackTop = 70;
      const gapV = 24;
      const minWinH = 200;
      const available = Math.max(2 * minWinH + gapV, dockTop - 16 - stackTop);
      const naturalAboutH = about ? about.getBoundingClientRect().height || 400 : 400;
      const aboutH = Math.min(naturalAboutH, Math.max(minWinH, available - gapV - minWinH));
      if (about) {
        about.style.top = `${stackTop}px`;
        about.style.left = `${iconClearance}px`;
        if (aboutH < naturalAboutH) about.style.height = `${Math.round(aboutH)}px`;
        openWindow('about');
      }
      if (claude) {
        const claudeTop = Math.round(stackTop + aboutH + gapV);
        const claudeAvailH = Math.max(minWinH, dockTop - 16 - claudeTop);
        claude.style.top = `${claudeTop}px`;
        claude.style.left = `${iconClearance}px`;
        claude.style.height = `${Math.round(Math.min(claudeH, claudeAvailH))}px`;
        openWindow('claude');
        focusWindow('claude');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initIcons();
    initWindowChrome();
    initClock();
    initDockMagnify();
    openDefaultWindows();
  });

  window.WM = { open: openWindow, close: closeWindow, focus: focusWindow };
})();
