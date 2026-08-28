(function () {
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const COLORS = ['#3F55E8', '#2A3AB8', '#15171B', '#5B5E66', '#EA5B3F', '#1F9E6B'];

  function initMascot() {
    const desktop = document.querySelector('.desktop');
    const menubar = document.querySelector('.menubar');
    const dock = document.querySelector('.dock');
    if (!desktop || !menubar || !dock) return;

    const mascot = document.createElement('div');
    mascot.id = 'mascot';
    mascot.setAttribute('aria-hidden', 'true');
    mascot.innerHTML = `
      <svg viewBox="0 0 64 64">
        <rect id="mascot-body" x="1" y="1" width="62" height="62" rx="20" fill="#3F55E8"/>
        <circle cx="24" cy="30" r="4" fill="#FBFBF9"/>
        <circle cx="40" cy="30" r="4" fill="#FBFBF9"/>
        <path d="M24 42 Q32 48 40 42" stroke="#FBFBF9" stroke-width="3" fill="none" stroke-linecap="round"/>
      </svg>`;
    document.body.appendChild(mascot);
    const body = mascot.querySelector('#mascot-body');

    const reduced = prefersReducedMotion();
    const SIZE = 48;
    const SPEED = 110; // px/second

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let vx = SPEED;
    let vy = SPEED;
    let dragging = false;
    let windowDragActive = false;
    let rafId = null;
    let lastTime = null;

    mascot.style.left = `${x}px`;
    mascot.style.top = `${y}px`;

    function bounds() {
      const menubarRect = menubar.getBoundingClientRect();
      const dockRect = dock.getBoundingClientRect();
      return {
        minX: 0,
        maxX: window.innerWidth - SIZE,
        minY: menubarRect.height,
        maxY: dockRect.top - SIZE,
      };
    }

    function bounceColor() {
      let next = COLORS[Math.floor(Math.random() * COLORS.length)];
      if (next === body.getAttribute('fill')) {
        next = COLORS[(COLORS.indexOf(next) + 1) % COLORS.length];
      }
      body.setAttribute('fill', next);
    }

    function place() {
      mascot.style.left = `${x}px`;
      mascot.style.top = `${y}px`;
    }

    function tick(now) {
      rafId = requestAnimationFrame(tick);
      if (dragging || windowDragActive) { lastTime = now; return; }
      if (lastTime === null) { lastTime = now; return; }
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const b = bounds();
      x += vx * dt;
      y += vy * dt;

      let bounced = false;
      if (x <= b.minX) { x = b.minX; vx = Math.abs(vx); bounced = true; }
      else if (x >= b.maxX) { x = b.maxX; vx = -Math.abs(vx); bounced = true; }
      if (y <= b.minY) { y = b.minY; vy = Math.abs(vy); bounced = true; }
      else if (y >= b.maxY) { y = b.maxY; vy = -Math.abs(vy); bounced = true; }

      if (bounced) bounceColor();
      place();
    }

    mascot.addEventListener('click', () => {
      if (mascot.dataset.justDragged === '1') {
        delete mascot.dataset.justDragged;
        return;
      }
      mascot.classList.remove('mascot-squish');
      void mascot.offsetWidth;
      mascot.classList.add('mascot-squish');
    });

    function dragStart(startClientX, startClientY) {
      const rect = mascot.getBoundingClientRect();
      const offsetX = startClientX - rect.left;
      const offsetY = startClientY - rect.top;
      let moved = false;

      function move(cx, cy) {
        if (!moved) {
          if (Math.hypot(cx - startClientX, cy - startClientY) < 4) return;
          moved = true;
          dragging = true;
        }
        x = cx - offsetX;
        y = cy - offsetY;
        place();
      }
      function onMouseMove(e) { move(e.clientX, e.clientY); }
      function onMouseUp(e) { finish(e.clientX, e.clientY); }
      function onTouchMove(e) {
        const t = e.touches[0];
        move(t.clientX, t.clientY);
      }
      function onTouchEnd(e) {
        const t = e.changedTouches[0];
        finish(t.clientX, t.clientY);
      }
      function finish() {
        cleanup();
        if (!moved) return;
        dragging = false;
        lastTime = null;
        // Send it off in a fresh direction from wherever it was dropped.
        const angle = Math.random() * Math.PI * 2;
        vx = Math.cos(angle) * SPEED;
        vy = Math.sin(angle) * SPEED;
        mascot.dataset.justDragged = '1';
        setTimeout(() => { delete mascot.dataset.justDragged; }, 300);
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

    mascot.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragStart(e.clientX, e.clientY);
    });
    mascot.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      dragStart(t.clientX, t.clientY);
    }, { passive: true });

    document.addEventListener('wm:window-drag-start', () => { windowDragActive = true; });
    document.addEventListener('wm:window-drag-end', () => { windowDragActive = false; lastTime = null; });

    if (reduced) {
      place();
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  document.addEventListener('DOMContentLoaded', initMascot);
})();
