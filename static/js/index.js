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
