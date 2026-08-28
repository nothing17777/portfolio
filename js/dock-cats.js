(function () {
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const COLORS = {
    K: '#1B1B1F', // black fur
    Y: '#F4C542', // eyes
    H: '#FF6FA5', // happy/heart eyes
    R: '#E23B3B', // collar
    W: '#F6F6F3', // whisker glint
  };

  const ROWS_OPEN = [
    '..K....K..',
    '.KK....KK.',
    '.KKKKKKKK.',
    'KKYKKKKYKK',
    'KKKKKKKKKK',
    'KKKKRRKKKK',
    'KKKKKKKKKK',
    '.KKKKKKKK.',
    '..K....K..',
  ];

  const ROWS_BLINK = ROWS_OPEN.map((row) => row.replace(/Y/g, 'K'));
  const ROWS_HAPPY = ROWS_OPEN.map((row) => row.replace(/Y/g, 'H'));

  function buildGrid(svg, rows) {
    svg.innerHTML = '';
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', '1');
        rect.setAttribute('height', '1');
        rect.setAttribute('fill', COLORS[ch] || '#000');
        svg.appendChild(rect);
      }
    }
  }

  function makeHeart() {
    const heart = document.createElement('span');
    heart.className = 'dock-cat-heart';
    heart.textContent = '♥';
    heart.style.left = `${30 + Math.random() * 10 - 5}%`;
    return heart;
  }

  function initOneCat(dock, index, total) {
    const cat = document.createElement('div');
    cat.className = 'dock-cat';
    cat.setAttribute('role', 'button');
    cat.setAttribute('tabindex', '0');
    cat.setAttribute('aria-label', 'Pet the cat');
    cat.style.left = `${(index + 1) * (100 / (total + 1))}%`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 10 9');
    svg.setAttribute('shape-rendering', 'crispEdges');
    cat.appendChild(svg);
    buildGrid(svg, ROWS_OPEN);
    dock.appendChild(cat);

    let petTimeout = null;
    function pet() {
      cat.classList.remove('dock-cat-pet');
      void cat.offsetWidth;
      buildGrid(svg, ROWS_HAPPY);
      cat.classList.add('dock-cat-pet');
      cat.appendChild(makeHeart());
      clearTimeout(petTimeout);
      petTimeout = setTimeout(() => {
        buildGrid(svg, ROWS_OPEN);
        cat.querySelectorAll('.dock-cat-heart').forEach((h) => h.remove());
      }, 900);
    }

    cat.addEventListener('click', pet);
    cat.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pet(); }
    });

    if (!prefersReducedMotion()) {
      const blinkLoop = () => {
        if (!cat.classList.contains('dock-cat-pet')) {
          buildGrid(svg, ROWS_BLINK);
          setTimeout(() => {
            if (!cat.classList.contains('dock-cat-pet')) buildGrid(svg, ROWS_OPEN);
          }, 140);
        }
        setTimeout(blinkLoop, 2400 + Math.random() * 2600);
      };
      setTimeout(blinkLoop, 1000 + Math.random() * 2000);
    }
  }

  function initDockCats() {
    const dock = document.querySelector('.dock');
    if (!dock) return;
    const COUNT = 3;
    for (let i = 0; i < COUNT; i++) initOneCat(dock, i, COUNT);
  }

  document.addEventListener('DOMContentLoaded', initDockCats);
})();
