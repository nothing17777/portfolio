(function () {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const INK = "21, 23, 27";
  const ACCENT = "63, 85, 232";

  let width, height, dpr;
  let points = [];
  let mouse = { x: -9999, y: -9999 };

  function sizeCanvas() {
    const hero = canvas.parentElement;
    width = hero.clientWidth;
    height = hero.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePoints() {
    const density = 15000; // px^2 per point, keeps count sane on big screens
    const count = Math.max(28, Math.min(90, Math.floor((width * height) / density)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.2 + 0.9,
    }));
  }

  function neighborRadius() {
    return Math.min(width, height) * 0.13;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const nr = neighborRadius();
    const cursorR = nr * 1.8;

    // faint correspondence links between nearby points
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < nr) {
          const alpha = (1 - d / nr) * 0.09;
          ctx.strokeStyle = `rgba(${INK}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // cursor-driven highlight links, like a match query against the feature set
    for (const p of points) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < cursorR) {
        const alpha = (1 - d / cursorR) * 0.55;
        ctx.strokeStyle = `rgba(${ACCENT}, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        ctx.fillStyle = `rgba(${ACCENT}, ${Math.min(1, alpha + 0.3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `rgba(${INK}, 0.28)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function step() {
    for (const p of points) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    }
    draw();
    requestAnimationFrame(step);
  }

  function init() {
    sizeCanvas();
    makePoints();
    draw();
    if (!reduceMotion) requestAnimationFrame(step);
  }

  window.addEventListener("resize", () => {
    sizeCanvas();
    makePoints();
    draw();
  });

  canvas.parentElement.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    if (reduceMotion) draw();
  });
  canvas.parentElement.addEventListener("mouseleave", () => {
    mouse.x = -9999;
    mouse.y = -9999;
    if (reduceMotion) draw();
  });

  init();
})();

/* Back-to-top button: shown once the hero has scrolled past. */
(() => {
  const btn = document.getElementById("to-top");
  if (!btn) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sync = () => btn.classList.toggle("is-visible", window.scrollY > 600);
  sync();
  window.addEventListener("scroll", sync, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });
})();
