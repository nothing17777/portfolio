(function () {
  const GRAVITY = 900; // px/s^2
  const BALL_R = 20;
  const THREE_PT_RADIUS = 240; // launch distance from the rim beyond which a make is worth 3

  function initBasketball() {
    const dock = document.querySelector('.dock');
    if (!dock) return;

    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.id = 'court-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = `
      <circle id="three-arc" r="0" fill="none" stroke="#DDDCD5" stroke-width="2" stroke-dasharray="6 6"/>
      <line id="sling-line" x1="0" y1="0" x2="0" y2="0" stroke="#15171B" stroke-width="2"
            stroke-dasharray="4 4" stroke-linecap="round" opacity="0"/>`;
    document.body.appendChild(overlay);
    const threeArc = overlay.querySelector('#three-arc');
    const slingLine = overlay.querySelector('#sling-line');

    const hoop = document.createElement('div');
    hoop.id = 'hoop';
    hoop.setAttribute('aria-hidden', 'true');
    hoop.innerHTML = `
      <svg viewBox="0 0 120 90">
        <rect x="10" y="4" width="70" height="46" rx="4" fill="#FBFBF9" stroke="#DDDCD5" stroke-width="2"/>
        <rect x="34" y="20" width="22" height="16" fill="none" stroke="#DDDCD5" stroke-width="1.5"/>
        <ellipse cx="45" cy="52" rx="26" ry="6" fill="none" stroke="#EA5B3F" stroke-width="4"/>
        <path d="M22 54 L30 74 M32 55 L36 76 M45 56 L45 78 M58 55 L54 76 M68 54 L60 74"
              stroke="#DDDCD5" stroke-width="1.5" fill="none"/>
      </svg>`;
    document.body.appendChild(hoop);

    const scoreEl = document.createElement('div');
    scoreEl.id = 'hoop-score';
    scoreEl.textContent = '0';
    document.body.appendChild(scoreEl);

    const ball = document.createElement('div');
    ball.id = 'basketball';
    ball.setAttribute('aria-hidden', 'true');
    ball.innerHTML = `
      <svg viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#EA5B3F" stroke="#15171B" stroke-width="1.2"/>
        <path d="M2 20 H38 M20 2 V38 M7 7 Q20 20 7 33 M33 7 Q20 20 33 33"
              stroke="#15171B" stroke-width="1.2" fill="none"/>
      </svg>`;
    document.body.appendChild(ball);

    const ballHint = document.createElement('div');
    ballHint.id = 'ball-hint';
    ballHint.textContent = 'drag to move · shift+drag to shoot';
    document.body.appendChild(ballHint);

    let hoopX = 0;
    let hoopY = 0;
    let hoopRimY = 0;
    let rimCenterX = 0;
    let hoopMoved = false;
    let ballMoved = false;
    let restX = 0;
    let restY = 0;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let launchX = 0;
    let launchY = 0;
    let held = false;
    let flying = false;
    let scoredThisFlight = false;
    let score = 0;
    let lastTime = null;

    function place() {
      ball.style.left = `${x - BALL_R}px`;
      ball.style.top = `${y - BALL_R}px`;
    }

    function resetBall() {
      flying = false;
      x = restX;
      y = restY;
      vx = 0;
      vy = 0;
      place();
      ballHint.style.left = `${restX - 70}px`;
      ballHint.style.top = `${restY + 26}px`;
      ballHint.style.opacity = '1';
    }

    function positionHoop() {
      hoop.style.left = `${hoopX}px`;
      hoop.style.top = `${hoopY}px`;
      hoopRimY = hoopY + 52;
      rimCenterX = hoopX + 45;
      scoreEl.style.left = `${hoopX + 128}px`;
      scoreEl.style.top = `${hoopY + 4}px`;
      threeArc.setAttribute('cx', rimCenterX);
      threeArc.setAttribute('cy', hoopRimY);
      threeArc.setAttribute('r', THREE_PT_RADIUS);
    }

    function layout() {
      const dockRect = dock.getBoundingClientRect();
      const dockCenterX = dockRect.left + dockRect.width / 2;

      if (!hoopMoved) {
        // Hoop and ball rest symmetrically around the dock's center so the
        // pair reads as one centered composition, not two stray props.
        hoopX = dockCenterX - 60 - 45;
        hoopY = dockRect.top - 90;
      }
      positionHoop();

      if (!ballMoved) {
        restX = Math.min(dockCenterX + 60, window.innerWidth - BALL_R - 20);
        restY = dockRect.top - 40;
      }
      if (!flying && !held) resetBall();
    }

    function bump() {
      scoreEl.classList.remove('hoop-score-bump');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('hoop-score-bump');
    }

    function tick(now) {
      requestAnimationFrame(tick);
      if (!flying) { lastTime = null; return; }
      if (lastTime === null) { lastTime = now; return; }
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;

      const prevY = y;
      vy += GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;
      place();

      if (!scoredThisFlight && vy > 0 && prevY < hoopRimY && y >= hoopRimY) {
        if (Math.abs(x - rimCenterX) < 20) {
          const dist = Math.hypot(launchX - rimCenterX, launchY - hoopRimY);
          const points = dist > THREE_PT_RADIUS ? 3 : 2;
          score += points;
          scoreEl.textContent = String(score);
          bump();
          scoredThisFlight = true;
        }
      }

      if (y - BALL_R > window.innerHeight || x < -BALL_R * 2 || x > window.innerWidth + BALL_R * 2) {
        resetBall();
      }
    }

    function dragStart(startClientX, startClientY, repositionMode) {
      if (flying) return;
      held = true;
      scoredThisFlight = false;
      ballHint.style.opacity = '0';
      if (!repositionMode) slingLine.setAttribute('opacity', '1');

      function move(cx, cy) {
        if (repositionMode) {
          // Free placement: the ball tracks the cursor 1:1, any distance.
          x = cx;
          y = cy;
          place();
          return;
        }
        x = restX + (cx - startClientX) * 0.5;
        y = restY + (cy - startClientY) * 0.5;
        place();
        slingLine.setAttribute('x1', restX);
        slingLine.setAttribute('y1', restY);
        slingLine.setAttribute('x2', x);
        slingLine.setAttribute('y2', y);
      }
      function release(cx, cy) {
        cleanup();
        held = false;

        if (repositionMode) {
          restX = x;
          restY = y;
          ballMoved = true;
          resetBall();
          return;
        }

        slingLine.setAttribute('opacity', '0');
        const dx = startClientX - cx;
        const dy = startClientY - cy;
        const dist = Math.hypot(dx, dy);

        launchX = x;
        launchY = y;
        const power = Math.min(dist * 4, 900);
        const angle = Math.atan2(dy, dx);
        vx = Math.cos(angle) * power;
        vy = Math.sin(angle) * power;
        lastTime = null;
        flying = true;
      }
      function onMouseMove(e) { move(e.clientX, e.clientY); }
      function onMouseUp(e) { release(e.clientX, e.clientY); }
      function onTouchMove(e) {
        const t = e.touches[0];
        move(t.clientX, t.clientY);
      }
      function onTouchEnd(e) {
        const t = e.changedTouches[0];
        release(t.clientX, t.clientY);
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

    function hoopDragStart(startClientX, startClientY) {
      const startHoopX = hoopX;
      const startHoopY = hoopY;

      function move(cx, cy) {
        hoopX = startHoopX + (cx - startClientX);
        hoopY = startHoopY + (cy - startClientY);
        positionHoop();
      }
      function finish() {
        cleanup();
        hoopMoved = true;
      }
      function onMouseMove(e) { move(e.clientX, e.clientY); }
      function onMouseUp() { finish(); }
      function onTouchMove(e) {
        const t = e.touches[0];
        move(t.clientX, t.clientY);
      }
      function onTouchEnd() { finish(); }
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

    // Plain drag repositions the ball; Shift+drag pulls back and shoots.
    ball.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragStart(e.clientX, e.clientY, !e.shiftKey);
    });
    ball.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      dragStart(t.clientX, t.clientY, true);
    }, { passive: true });

    hoop.addEventListener('mousedown', (e) => {
      e.preventDefault();
      hoopDragStart(e.clientX, e.clientY);
    });
    hoop.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      hoopDragStart(t.clientX, t.clientY);
    }, { passive: true });

    window.addEventListener('resize', layout);
    layout();
    requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', initBasketball);
})();
