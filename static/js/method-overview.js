(() => {
  const figure = document.querySelector('.method-overview');
  const canvas = figure?.querySelector('.method-flow-canvas');
  if (!canvas) return;

  const svg = canvas.querySelector('.method-flow-connectors');
  const paths = svg.querySelector('.method-flow-paths');
  const toggle = figure.querySelector('.method-flow-toggle');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const colors = { blue: '#496fc1', coral: '#a05e49', green: '#3f745b' };
  const namespace = 'http://www.w3.org/2000/svg';
  let paused = motionPreference.matches;
  let visible = false;
  let layoutFrame;

  const element = (name, attributes) => {
    const node = document.createElementNS(namespace, name);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };

  const updatePlayback = () => {
    if (paused || !visible || document.hidden) svg.pauseAnimations();
    else svg.unpauseAnimations();
    toggle.querySelector('.method-flow-toggle-label').textContent = paused ? 'Play' : 'Pause';
    toggle.querySelector('.method-flow-toggle-icon').textContent = paused ? '▷' : 'Ⅱ';
    toggle.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} overview animation`);
  };

  // Derive routes from the cards so typography and responsive reflow stay independent.
  const draw = () => {
    layoutFrame = undefined;
    const bounds = canvas.getBoundingClientRect();
    const nodes = {};
    canvas.querySelectorAll('[data-flow-node]').forEach((node) => {
      const rect = node.getBoundingClientRect();
      const x = rect.left - bounds.left;
      const y = rect.top - bounds.top;
      nodes[node.dataset.flowNode] = {
        x, y, right: x + rect.width, bottom: y + rect.height,
        cx: x + rect.width / 2, cy: y + rect.height / 2, width: rect.width,
      };
    });
    const {
      interaction: i, hashing: h, 'hash-output': hash, counter: c,
      reaching: r, coverage: v, policy: p, simulation: s,
    } = nodes;
    const unit = parseFloat(getComputedStyle(canvas).fontSize);
    const clearance = unit * 0.35;
    const fragment = document.createDocumentFragment();
    svg.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);

    const edge = (points, color, label, arrow = true) => {
      const route = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' ');
      fragment.append(element('path', {
        d: route, class: 'method-flow-edge', stroke: colors[color],
        ...(arrow ? { 'marker-end': `url(#method-arrow-${color})` } : {}),
      }));
      const length = points.slice(1).reduce((total, point, index) =>
        total + Math.hypot(point[0] - points[index][0], point[1] - points[index][1]), 0);
      const duration = Math.max(2.8, length / (unit * 3.2));
      // Short links need only one particle; longer feedback paths get a trailing one.
      (length > unit * 10 ? [0, 0.5] : [0]).forEach((phase) => {
        const dot = element('circle', { r: unit * (phase ? 0.16 : 0.2), fill: colors[color], opacity: phase ? 0.45 : 1 });
        dot.append(element('animateMotion', {
          path: route, dur: `${duration}s`, begin: `${-phase * duration}s`,
          repeatCount: 'indefinite', calcMode: 'linear',
        }));
        fragment.append(dot);
      });
      if (label) {
        const text = element('text', {
          x: label.x, y: label.y, fill: colors[color], class: 'method-flow-label',
          'text-anchor': label.anchor || 'middle',
        });
        text.textContent = label.text;
        fragment.append(text);
      }
    };

    // Match the paper overview: hashing | contact memory | rewards | PPO.
    const hashLane = (h.right + c.x) / 2;
    edge([[h.right + 2, hash.cy], [hashLane, hash.cy], [hashLane, c.cy], [c.x - clearance, c.cy]], 'blue');
    edge([[i.cx, i.y - 2], [c.cx, c.bottom + clearance]], 'coral');

    const branch = (c.right + r.x) / 2;
    edge([[c.right + 2, c.cy], [branch, c.cy]], 'blue', null, false);
    edge([[branch, c.cy], [branch, r.cy], [r.x - clearance, r.cy]], 'blue');
    edge([[branch, c.cy], [branch, v.cy], [v.x - clearance, v.cy]], 'blue');

    const merge = (r.right + p.x) / 2;
    edge([[r.right + 2, r.cy], [merge, r.cy], [merge, p.cy]], 'blue', null, false);
    edge([[v.right + 2, v.cy], [merge, v.cy], [merge, p.cy]], 'coral', null, false);
    edge([[merge, p.cy], [p.x - clearance, p.cy]], 'blue');
    fragment.append(element('circle', { cx: merge, cy: p.cy, r: unit * 0.5, fill: '#fff', stroke: '#a6b7d1' }));
    const sum = element('text', { x: merge, y: p.cy + unit * 0.3, 'text-anchor': 'middle', fill: colors.blue, 'font-size': unit });
    sum.textContent = '+';
    fragment.append(sum);

    // Keep state feedback and the policy loop below the main left-to-right flow.
    edge([[s.x - 2, s.cy], [h.cx, s.cy], [h.cx, h.bottom + clearance]], 'green',
      { text: 'object state', x: (h.cx + s.x) / 2, y: s.cy - unit * 0.65 });
    edge([[i.cx, s.y - 2], [i.cx, i.bottom + clearance]], 'green');
    edge([[s.right + 2, s.y + unit * 0.8], [p.cx, s.y + unit * 0.8], [p.cx, p.bottom + clearance]], 'green',
      { text: 'task reward', x: (s.right + p.cx) / 2, y: s.y + unit * 0.2 });
    const outer = bounds.width - unit * 0.4;
    const returnY = s.bottom + unit;
    edge([[p.right + 2, p.cy], [outer, p.cy], [outer, returnY], [s.cx, returnY], [s.cx, s.bottom + clearance]], 'green',
      { text: 'actions', x: (outer + s.cx) / 2, y: returnY + unit * 0.25 });

    paths.replaceChildren(fragment);
    // A responsive redraw restarts the same schematic flow, including when paused.
    svg.setCurrentTime(0);
    updatePlayback();
  };

  const scheduleDraw = () => {
    if (!layoutFrame) layoutFrame = window.requestAnimationFrame(draw);
  };
  new ResizeObserver(scheduleDraw).observe(canvas);
  document.fonts.ready.then(scheduleDraw);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }).observe(figure);
  document.addEventListener('visibilitychange', updatePlayback);
  motionPreference.addEventListener('change', () => {
    paused = motionPreference.matches;
    updatePlayback();
  });
  toggle.addEventListener('click', () => {
    paused = !paused;
    updatePlayback();
  });
  toggle.hidden = false;
  scheduleDraw();
})();
