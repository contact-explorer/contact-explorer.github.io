document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.citation-copy');
  const code = document.querySelector('#bibtex-code');
  const status = document.querySelector('.citation-status');
  if (!button || !code || !status) return;
  const label = button.querySelector('.citation-copy-label');

  button.hidden = false;
  let resetTimer;
  button.addEventListener('click', async () => {
    window.clearTimeout(resetTimer);
    button.disabled = true;
    label.textContent = 'Copy';
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      label.textContent = 'Copied!';
      status.textContent = 'BibTeX copied to clipboard.';
      resetTimer = window.setTimeout(() => {
        label.textContent = 'Copy';
      }, 2500);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      label.textContent = 'Press Ctrl/⌘+C';
      status.textContent = 'Automatic copying is unavailable. The citation is selected; press Ctrl+C or ⌘C to copy.';
    } finally {
      button.disabled = false;
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const toc = document.querySelector('.page-toc');
  if (!toc) return;

  const compact = window.matchMedia('(max-width: 768px)');
  const summary = toc.querySelector('summary');
  const currentLabel = toc.querySelector('.toc-current');
  const links = [...toc.querySelectorAll('.toc-list a')];
  const entries = links.map((link) => ({
    link,
    target: document.getElementById(link.hash.slice(1)),
  })).filter(({ target }) => target);
  let activeTarget;
  let scheduled = false;

  const updateCurrent = () => {
    scheduled = false;
    const readingLine = compact.matches ? 136 : 120;
    let current;
    for (const entry of entries) {
      if (entry.target.getBoundingClientRect().top > readingLine) break;
      current = entry;
    }
    if (activeTarget === current?.target) return;
    activeTarget = current?.target;
    links.forEach((link) => {
      link.removeAttribute('aria-current');
      link.classList.remove('is-active-section');
    });
    if (!current) {
      currentLabel.textContent = 'Motivation';
      return;
    }
    current.link.setAttribute('aria-current', 'location');
    const section = current.target.closest('.paper-section');
    const sectionLink = links.find((link) => link.hash === `#${section.id}`);
    if (sectionLink !== current.link) sectionLink?.classList.add('is-active-section');
    currentLabel.textContent = section.querySelector('.section-heading').textContent.replace(/^\d+/, '').trim();
  };

  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(updateCurrent);
  };

  const updateLayout = () => {
    toc.open = !compact.matches;
    scheduleUpdate();
  };
  compact.addEventListener('change', updateLayout);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);

  toc.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !compact.matches) return;
      toc.open = false;
      // Keep keyboard focus visible when the menu containing the link closes.
      summary.focus({ preventScroll: true });
    });
  });
  toc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && compact.matches && toc.open) {
      toc.open = false;
      summary.focus({ preventScroll: true });
    }
  });
  updateLayout();
});

document.addEventListener('DOMContentLoaded', () => {
  const viewer = document.querySelector('.figure-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;

  const stage = viewer.querySelector('.figure-viewer-stage');
  const image = stage.querySelector('img');
  const title = viewer.querySelector('#figure-viewer-title');
  const zoom = viewer.querySelector('.figure-zoom');
  let trigger;

  document.querySelectorAll('.figure-expand').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      title.textContent = link.dataset.figureTitle;
      stage.classList.remove('is-zoomed');
      zoom.textContent = 'Zoom in';
      zoom.setAttribute('aria-pressed', 'false');
      viewer.showModal();
      stage.scrollTo(0, 0);
      document.documentElement.classList.add('figure-viewer-open');
    });
  });

  zoom.addEventListener('click', () => {
    const zoomed = stage.classList.toggle('is-zoomed');
    zoom.textContent = zoomed ? 'Fit to screen' : 'Zoom in';
    zoom.setAttribute('aria-pressed', String(zoomed));
    stage.scrollTo(0, 0);
  });
  viewer.querySelector('.figure-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    const rect = viewer.getBoundingClientRect();
    if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('figure-viewer-open');
    trigger?.focus({ preventScroll: true });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('[data-real-trial]');
  if (!buttons.length) {
    return;
  }

  const videos = document.querySelectorAll('[data-real-world-view]');
  const updateVideos = (trial) => {
    videos.forEach((video) => {
      const view = video.getAttribute('data-real-world-view');
      if (!view) {
        return;
      }
      const nextSrc = `./static/videos/contact_explorer_media/real/${trial}/${trial}-${view}_web.mp4`;
      const source = video.querySelector('source');
      const currentSrc = source ? source.getAttribute('src') : '';

      video.pause();
      if (source) {
        source.setAttribute('src', nextSrc);
      }
      video.load();
    });
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((btn) => btn.classList.remove('is-active'));
      button.classList.add('is-active');
      updateVideos(button.getAttribute('data-real-trial'));
    });
  });

  const activeButton = document.querySelector('.real-world-button.is-active') || buttons[0];
  if (activeButton) {
    updateVideos(activeButton.getAttribute('data-real-trial'));
  }
});
