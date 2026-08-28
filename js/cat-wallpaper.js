(function () {
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const COLORS = {
    E: '#C23F2A', // dark ear
    P: '#F6C9BE', // inner ear / nose
    F: '#EA5B3F', // fur
    K: '#15171B', // eyes
    N: '#F6C9BE', // nose
    W: '#FBFBF9', // belly / paws
  };

  const BASE_ROWS = [
    '................',
    '...E........E...',
    '..EEE......EEE..',
    '.EEPE......EPEE.',
    '..FFFFFFFFFFFF..',
    '.FFFFFFFFFFFFFF.',
    '.FFKKFFFFFFKKFF.',
    '.FFKKFFFFFFKKFF.',
    '.FFFFFFFNFFFFFF.',
    '.FFFFFFWWWFFFFF.',
    '..FFFFFFFFFFFF..',
    '...FFFFFFFFFF...',
    '..FFFWWWWWFFFF..',
    '.FFFFWWWWWWFFFF.',
    'FF..FFWWWWFF..FF',
    '.F..FFFFFFFF..F.',
  ];

  const EYE_ROWS = [6, 7];
  const EYE_VARIANTS = {
    center: '.FFKKFFFFFFKKFF.',
    left: '.FKKFFFFFFKKFFF.',
    right: '.FFFKKFFFFFFKKF.',
  };

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
        rect.setAttribute('fill', COLORS[ch] || '#000000');
        svg.appendChild(rect);
      }
    }
  }

  function initCatWallpaper() {
    const wrap = document.createElement('div');
    wrap.id = 'cat-wallpaper';
    wrap.setAttribute('aria-hidden', 'true');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('shape-rendering', 'crispEdges');
    wrap.appendChild(svg);
    document.body.insertBefore(wrap, document.body.firstChild);

    buildGrid(svg, BASE_ROWS);

    if (prefersReducedMotion()) return; // sprite stays put, gaze centered

    let currentGaze = 'center';

    function setGaze(gaze) {
      if (gaze === currentGaze) return;
      currentGaze = gaze;
      const rows = BASE_ROWS.slice();
      rows[EYE_ROWS[0]] = EYE_VARIANTS[gaze];
      rows[EYE_ROWS[1]] = EYE_VARIANTS[gaze];
      buildGrid(svg, rows);
    }

    document.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dx = e.clientX - centerX;
      if (dx < -40) setGaze('left');
      else if (dx > 40) setGaze('right');
      else setGaze('center');
    });
  }

  document.addEventListener('DOMContentLoaded', initCatWallpaper);
})();
