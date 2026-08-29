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

  function openWindow(appId) {
    const win = getWin(appId);
    if (!win) return;
    const wasHidden = win.style.display !== 'flex';
    win.style.display = 'flex';
    if (wasHidden) {
      win.classList.remove('is-open', 'is-closing');
      win.classList.add('is-opening');
      win.addEventListener('animationend', () => {
        win.classList.remove('is-opening');
        win.classList.add('is-open');
      }, { once: true });
    }
    focusWindow(appId);
    const dockIcon = dockIconFor(appId);
    if (dockIcon) dockIcon.classList.add('is-running');
  }

  function closeWindow(appId) {
    const win = getWin(appId);
    if (!win || win.style.display === 'none') return;
    win.classList.remove('is-open', 'is-opening');
    win.classList.add('is-closing');
    win.addEventListener('animationend', () => {
      win.style.display = 'none';
      win.classList.remove('is-closing');
    }, { once: true });
    const dockIcon = dockIconFor(appId);
    if (dockIcon) dockIcon.classList.remove('is-running');
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

    const rect = el.getBoundingClientRect();
    const offsetX = startClientX - rect.left;
    const offsetY = startClientY - rect.top;
    let dragging = false;

    function move(x, y) {
      if (!dragging) {
        if (Math.hypot(x - startClientX, y - startClientY) < 4) return;
        dragging = true;
        el.classList.add('icon-dragging');
        document.body.appendChild(el);
        el.style.position = 'fixed';
        el.style.margin = '0';
        el.style.zIndex = '3000';
      }
      el.style.left = `${x - offsetX}px`;
      el.style.top = `${y - offsetY}px`;
    }

    function finish(x, y) {
      cleanup();
      if (!dragging) return;
      el.classList.remove('icon-dragging');
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
        dockEl.appendChild(el);
        saveIconState(appId, { home: 'dock' });
      } else {
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
    Object.keys(layout).forEach((appId) => {
      const data = iconRegistry[appId];
      const saved = layout[appId];
      if (!data || !saved) return;

      const el = document.querySelector(`.desktop > [data-app="${appId}"], .dock > [data-app="${appId}"]`);
      if (!el) return;

      if (saved.home === 'desktop') {
        if (el.className !== 'desktop-icon') applyDesktopShape(el, data);
        el.style.position = 'absolute';
        el.style.left = `${saved.x}px`;
        el.style.top = `${saved.y}px`;
        if (el.parentElement !== desktopEl) desktopEl.appendChild(el);
      } else if (saved.home === 'dock') {
        if (el.className !== 'dock-icon') applyDockShape(el, data);
        if (el.parentElement !== dockEl) dockEl.appendChild(el);
      }
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

      const handle = document.createElement('div');
      handle.className = 'window-resize-handle';
      handle.setAttribute('aria-hidden', 'true');
      win.appendChild(handle);
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        resizeStart(win, e.clientX, e.clientY);
      });
      handle.addEventListener('touchstart', (e) => {
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
    const about = getWin('about');
    const claude = getWin('claude');
    if (about) {
      about.style.top = '70px';
      about.style.left = '140px';
      openWindow('about');
    }
    if (claude) {
      const gap = 40;
      const aboutRight = about ? about.getBoundingClientRect().right : 480;
      claude.style.top = '90px';
      claude.style.left = `${Math.round(aboutRight + gap)}px`;
      openWindow('claude');
      focusWindow('claude');
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
