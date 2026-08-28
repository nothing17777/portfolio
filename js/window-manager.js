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
