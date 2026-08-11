import panzoom from 'panzoom';

let pz = null;
let currentMode = 'satellite';

const MAP_SOURCES = {
  satellite: '/kutatualah-satellite.png',
  street: '/kutatualah-street.jpeg'
};

// ─────────────────────────────────────────────────────────────
// initMapViewer()
// ─────────────────────────────────────────────────────────────
export function initMapViewer() {
  const scene    = document.getElementById('panzoom-scene');
  const img      = document.getElementById('village-map-img');
  const viewport = document.getElementById('map-viewport');
  if (!scene || !img || !viewport) return;

  // Crisp image rendering for high-res maps
  img.style.imageRendering = 'high-quality';
  img.style.imageRendering = '-webkit-optimize-contrast';
  img.style.imageRendering = 'crisp-edges';

  // ── Create panzoom instance ─────────────────────────────────
  pz = panzoom(scene, {
    maxZoom:       8,
    minZoom:       0.3,
    bounds:        true,
    boundsPadding: 0.05,
    smoothScroll:  true,
    zoomSpeed:     0.06,
  });

  // ── Fit map once image dimensions are loaded ────────────────
  if (img.complete && img.naturalWidth > 0) {
    requestAnimationFrame(() => fitMap(img, viewport));
  } else {
    img.addEventListener('load', () => {
      requestAnimationFrame(() => fitMap(img, viewport));
    }, { once: true });
  }

  // ── Double-tap / double-click → reset view ──────────────────
  let lastTap = 0;
  viewport.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 280) {
      e.preventDefault();
      fitMap(img, viewport);
    }
    lastTap = now;
  }, { passive: false });

  viewport.addEventListener('dblclick', () => fitMap(img, viewport));

  // ── Wire controls & drawer toggles ──────────────────────────
  _bindControls(img, viewport);
  _bindModePill(img, viewport);
  _bindLandmarkDrawer();
}

// ─── Scale-to-fit + center ───────────────────────────────────
export function fitMap(img, viewport) {
  if (!pz) return;
  img = img || document.getElementById('village-map-img');
  viewport = viewport || document.getElementById('map-viewport');
  if (!img || !viewport) return;

  const vw = viewport.clientWidth  || window.innerWidth;
  const vh = viewport.clientHeight || window.innerHeight;

  const iw = img.naturalWidth  || img.width  || 1200;
  const ih = img.naturalHeight || img.height || 900;

  const scale = Math.min((vw * 0.95) / iw, (vh * 0.95) / ih);

  const dx = (vw - iw * scale) / 2;
  const dy = (vh - ih * scale) / 2;

  pz.zoomAbs(0, 0, scale);
  pz.moveTo(dx, dy);
}

// ─── Switch Map Mode (Satellite vs Street) ────────────────────
export function setMapMode(mode) {
  if (mode === currentMode) return;
  currentMode = mode;

  const img = document.getElementById('village-map-img');
  const viewport = document.getElementById('map-viewport');
  const modeSatBtn = document.getElementById('mode-sat');
  const modeStreetBtn = document.getElementById('mode-street');

  if (!img) return;

  // Toggle active button style
  if (mode === 'satellite') {
    modeSatBtn?.classList.add('active');
    modeStreetBtn?.classList.remove('active');
  } else {
    modeStreetBtn?.classList.add('active');
    modeSatBtn?.classList.remove('active');
  }

  // Smooth fade switch
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = MAP_SOURCES[mode] || MAP_SOURCES.satellite;
    img.onload = () => {
      img.style.opacity = '1';
      if (viewport) fitMap(img, viewport);
    };
  }, 200);
}

// ─── Floating Controls Event Listeners ────────────────────────
function _bindControls(img, viewport) {
  const cx = () => (viewport.clientWidth  || window.innerWidth)  / 2;
  const cy = () => (viewport.clientHeight || window.innerHeight) / 2;

  document.getElementById('btn-zoom-in')
    ?.addEventListener('click', () => pz?.smoothZoom(cx(), cy(), 1.45));

  document.getElementById('btn-zoom-out')
    ?.addEventListener('click', () => pz?.smoothZoom(cx(), cy(), 0.68));

  document.getElementById('btn-reset')
    ?.addEventListener('click', () => fitMap(img, viewport));

  // Info drawer toggle
  const infoDrawer  = document.getElementById('info-drawer');
  const btnInfo     = document.getElementById('btn-info');
  const btnClose    = document.getElementById('btn-close-drawer');
  const landmarkDrawer = document.getElementById('landmark-drawer');

  btnInfo?.addEventListener('click', () => {
    // Close landmark drawer if open
    landmarkDrawer?.classList.remove('open');
    document.getElementById('btn-landmarks')?.classList.remove('map-btn--accent');

    const isOpen = infoDrawer?.classList.toggle('open');
    infoDrawer?.setAttribute('aria-hidden', String(!isOpen));
    btnInfo.classList.toggle('map-btn--accent', !!isOpen);
  });

  btnClose?.addEventListener('click', () => {
    infoDrawer?.classList.remove('open');
    infoDrawer?.setAttribute('aria-hidden', 'true');
    btnInfo?.classList.remove('map-btn--accent');
  });
}

// ─── Segmented Mode Toggle Pill Event Listeners ─────────────
function _bindModePill(img, viewport) {
  const modeSatBtn = document.getElementById('mode-sat');
  const modeStreetBtn = document.getElementById('mode-street');

  modeSatBtn?.addEventListener('click', () => setMapMode('satellite'));
  modeStreetBtn?.addEventListener('click', () => setMapMode('street'));
}

// ─── Landmark Drawer Event Listeners ──────────────────────────
function _bindLandmarkDrawer() {
  const landmarkDrawer = document.getElementById('landmark-drawer');
  const btnLandmarks   = document.getElementById('btn-landmarks');
  const btnCloseLM     = document.getElementById('btn-close-landmarks');
  const infoDrawer     = document.getElementById('info-drawer');

  btnLandmarks?.addEventListener('click', () => {
    // Close info drawer if open
    infoDrawer?.classList.remove('open');
    document.getElementById('btn-info')?.classList.remove('map-btn--accent');

    const isOpen = landmarkDrawer?.classList.toggle('open');
    landmarkDrawer?.setAttribute('aria-hidden', String(!isOpen));
    btnLandmarks.classList.toggle('map-btn--accent', !!isOpen);
  });

  btnCloseLM?.addEventListener('click', () => {
    landmarkDrawer?.classList.remove('open');
    landmarkDrawer?.setAttribute('aria-hidden', 'true');
    btnLandmarks?.classList.remove('map-btn--accent');
  });

  // Clicking landmark card re-fits map (or focuses)
  document.querySelectorAll('.landmark-card').forEach(card => {
    card.addEventListener('click', () => {
      landmarkDrawer?.classList.remove('open');
      btnLandmarks?.classList.remove('map-btn--accent');
      fitMap();
    });
  });
}

// ─── Cleanup ─────────────────────────────────────────────────
export function destroyMapViewer() {
  pz?.dispose();
  pz = null;
}
