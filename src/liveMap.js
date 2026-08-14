import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─────────────────────────────────────────────────────────────
// CONFIGURATION VARIABLES (Exact Village Center Coordinates & Info)
// ─────────────────────────────────────────────────────────────
export const targetLat = 3.47334834202855;
export const targetLng = 98.67209941158488;
export const initialZoom = 16;

export const villageInfo = {
  name: "Desa Kutatualah",
  district: "Kecamatan Namorambe",
  regency: "Kabupaten Deli Serdang",
  province: "Sumatera Utara",
  centerLabel: "Pusat / Kantor Desa Kutatualah",
  description: "Pusat Pelayanan Administrasi & Pemerintahan Desa Kutatualah"
};

// Village Landmarks / POIs (Exact updated list & coordinates)
export const landmarksData = [
  {
    id: "kantor-desa",
    name: "Kantor Desa Kutatualah",
    category: "Pemerintahan",
    tagClass: "tag-gov",
    desc: "Pusat pemerintahan & pelayanan administrasi warga desa.",
    lat: 3.47334834202855,
    lng: 98.67209941158488,
    photo: "/kantordesa.jpeg",
    icon: "building"
  },
  {
    id: "pertashop",
    name: "Pertashop / Pertamini",
    category: "Fasilitas Publik",
    tagClass: "tag-energy",
    desc: "Stasiun penyedia bahan bakar & pengisian energi warga.",
    lat: 3.4731227468601826,
    lng: 98.67158084411822,
    photo: "/pertashop.jpeg",
    icon: "fuel"
  },
  {
    id: "gbkp",
    name: "GBKP Kutatualah",
    category: "Tempat Ibadah",
    tagClass: "tag-rel",
    desc: "Gereja Batak Karo Protestan sarana ibadah jemaat.",
    lat: 3.473217824518343,
    lng: 98.67042437200736,
    photo: "/GBKP.jpeg",
    icon: "church"
  },
  {
    id: "buddhist-center",
    name: "Mahapajapati Buddhist Center",
    category: "Tempat Ibadah",
    tagClass: "tag-rel",
    desc: "Pusat peribadatan & kegiatan keagamaan Buddhis.",
    lat: 3.4787544282813023,
    lng: 98.67746450011755,
    photo: "/mahapajapati.jpeg",
    icon: "temple"
  },
  {
    id: "kelenteng",
    name: "Kelenteng Sat Bu Sien",
    category: "Tempat Ibadah",
    tagClass: "tag-rel",
    desc: "Tempat ibadah & klenteng Tritharma masyarakat.",
    lat: 3.480263736164313,
    lng: 98.67599666118767,
    photo: "/klentengsatbusien.jpeg",
    icon: "shrine"
  },
  {
    id: "mushola-silaturahim",
    name: "Mushola Silaturahim",
    category: "Tempat Ibadah",
    tagClass: "tag-rel",
    desc: "Sarana ibadah & keagamaan umat Islam setempat.",
    lat: 3.4801532990894843,
    lng: 98.67516007074967,
    photo: "/mushollasilaturahim.jpeg",
    icon: "mosque"
  },
  {
    id: "masjid-aisyah",
    name: "Masjid Aisyah Abdullatif Farah",
    category: "Tempat Ibadah",
    tagClass: "tag-rel",
    desc: "Masjid tempat peribadatan & kajian keagamaan warga.",
    lat: 3.4801442820928057,
    lng: 98.66938946991236,
    photo: "https://images.unsplash.com/photo-1542668595-fa9394e5b686?auto=format&fit=crop&w=600&q=80",
    icon: "mosque"
  },
  {
    id: "tk-bunda",
    name: "TK Bunda",
    category: "Pendidikan",
    tagClass: "tag-edu",
    desc: "Taman Kanak-Kanak & sarana pendidikan anak usia dini.",
    lat: 3.479848760406552,
    lng: 98.67179727140677,
    photo: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    icon: "school"
  }
];

// Tile Layer URLs
const TILE_SATELLITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  options: {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DigitalGlobe, GeoEye'
  }
};

const TILE_STREET = {
  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  options: {
    maxZoom: 20,
    subdomains: 'abcd',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }
};

let map = null;
let satelliteLayer = null;
let streetLayer = null;
let currentLayerName = 'satellite';
let centerMarker = null;
const landmarkMarkers = {};

// Custom Green Pin Icon HTML
const createCustomPinIcon = (isCenter = true, tagClass = 'tag-gov') => {
  let pinColor = '#2E7D32';
  if (!isCenter) {
    if (tagClass === 'tag-rel') pinColor = '#0284C7';
    else if (tagClass === 'tag-energy') pinColor = '#D97706';
    else if (tagClass === 'tag-edu') pinColor = '#7C3AED';
    else pinColor = '#15803D';
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="marker-pin-wrapper">
        <div class="marker-pin-pulse ${isCenter ? 'pulse-primary' : ''}"></div>
        <div class="marker-pin-body ${isCenter ? 'pin-center' : 'pin-poi'}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="1.8"/>
            <circle cx="12" cy="9" r="3.5" fill="#FFF9C4"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42]
  });
};

/**
 * Initialize the interactive Leaflet live map
 */
export function initLiveMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error('Element #map not found');
    return;
  }

  // Prevent double initialization
  if (map) {
    map.invalidateSize();
    return map;
  }

  // Create Leaflet Map instance
  map = L.map('map', {
    center: [targetLat, targetLng],
    zoom: initialZoom,
    zoomControl: false,
    attributionControl: false,
    tap: true,
    touchZoom: true
  });

  // Base Tile Layers
  satelliteLayer = L.tileLayer(TILE_SATELLITE.url, TILE_SATELLITE.options);
  streetLayer = L.tileLayer(TILE_STREET.url, TILE_STREET.options);
  satelliteLayer.addTo(map);

  // Initialize Village Center Pinpoint Marker (but do not add to map yet)
  centerMarker = L.marker([targetLat, targetLng], {
    icon: createCustomPinIcon(true, 'tag-gov'),
    title: villageInfo.centerLabel
  });

  const centerPopupContent = `
    <div class="popup-photo-wrapper" data-landmark-id="kantor-desa">
      <img src="/kantordesa.jpeg" class="popup-photo" alt="${villageInfo.name}">
      <div class="popup-photo-overlay">Klik untuk memperbesar</div>
    </div>
    <div class="map-popup-card" style="padding-top: 0.5rem;">
      <div class="popup-badge">${villageInfo.district}</div>
      <h3 class="popup-title">${villageInfo.name}</h3>
      <p class="popup-subtitle"><span class="popup-dot"></span>${villageInfo.centerLabel}</p>
      <p class="popup-desc">${villageInfo.description}</p>
      <div class="popup-footer">
        <span class="popup-coords">${targetLat.toFixed(6)}° N, ${targetLng.toFixed(6)}° E</span>
      </div>
    </div>
  `;

  centerMarker.bindPopup(centerPopupContent, {
    className: 'custom-leaflet-popup',
    maxWidth: 280,
    closeButton: true
  });
}

/**
 * Trigger staggered marker entrance animation when the map is fully shown
 */
export function animateMarkersEntrance() {
  if (!map) return;

  // 1. Add center marker first
  setTimeout(() => {
    if (centerMarker && map && !map.hasLayer(centerMarker)) {
      centerMarker.addTo(map);
    }
  }, 0);

  // 2. Add Markers for all 7 additional updated landmarks (staggered entrance)
  landmarksData.forEach((item, idx) => {
    if (item.id === 'kantor-desa') {
      landmarkMarkers[item.id] = centerMarker;
      return;
    }

    setTimeout(() => {
      if (!map) return; // Map could have been destroyed or unloaded
      if (landmarkMarkers[item.id] && map.hasLayer(landmarkMarkers[item.id])) return;

      const lmMarker = L.marker([item.lat, item.lng], {
        icon: createCustomPinIcon(false, item.tagClass),
        title: item.name
      }).addTo(map);

      const lmPopup = `
        <div class="popup-photo-wrapper" data-landmark-id="${item.id}">
          <img src="${item.photo}" class="popup-photo" alt="${item.name}">
          <div class="popup-photo-overlay">Klik untuk memperbesar</div>
        </div>
        <div class="map-popup-card" style="padding-top: 0.5rem;">
          <div class="popup-badge ${item.tagClass}">${item.category}</div>
          <h3 class="popup-title">${item.name}</h3>
          <p class="popup-desc">${item.desc}</p>
          <div class="popup-footer">
            <span class="popup-coords">${item.lat.toFixed(6)}° N, ${item.lng.toFixed(6)}° E</span>
          </div>
        </div>
      `;

      lmMarker.bindPopup(lmPopup, {
        className: 'custom-leaflet-popup',
        maxWidth: 280,
        closeButton: true
      });

      landmarkMarkers[item.id] = lmMarker;
    }, (idx + 1) * 180); // Stagger marker display with 180ms delay per pin
  });

  // Listen to popup open to bind photo click handlers dynamically
  map.on('popupopen', (e) => {
    const popupNode = e.popup.getElement();
    if (!popupNode) return;
    const photoWrapper = popupNode.querySelector('.popup-photo-wrapper');
    if (photoWrapper) {
      photoWrapper.addEventListener('click', () => {
        const landmarkId = photoWrapper.getAttribute('data-landmark-id');
        if (landmarkId && window.openPhotoViewer) {
          window.openPhotoViewer(landmarkId);
        }
      });
    }
  });

  // Setup UI Event Listeners
  setupMapUIEvents();

  return map;
}

/**
 * Switch map tile layer between 'satellite' and 'street'
 */
export function switchBasemap(layerType) {
  if (!map) return;
  if (layerType === currentLayerName) return;

  if (layerType === 'satellite') {
    if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
    satelliteLayer.addTo(map);
    currentLayerName = 'satellite';
  } else if (layerType === 'street') {
    if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
    streetLayer.addTo(map);
    currentLayerName = 'street';
  }

  // Update desktop pill buttons
  const satBtn = document.getElementById('mode-sat');
  const streetBtn = document.getElementById('mode-street');
  if (satBtn && streetBtn) {
    if (layerType === 'satellite') {
      satBtn.classList.add('active');
      streetBtn.classList.remove('active');
    } else {
      streetBtn.classList.add('active');
      satBtn.classList.remove('active');
    }
  }

  // Sync mobile toggle button visual state
  syncMobileToggle(layerType);
}

/**
 * Re-center map to default village coordinates
 */
export function resetMapView() {
  if (!map) return;
  map.flyTo([targetLat, targetLng], initialZoom, {
    duration: 1.2,
    easeLinearity: 0.25
  });
  if (centerMarker) {
    centerMarker.openPopup();
  }
}

/**
 * Fly map to specific landmark coordinates
 */
export function flyToLandmark(landmarkId) {
  const lm = landmarksData.find(item => item.id === landmarkId);
  if (!lm || !map) return;

  map.flyTo([lm.lat, lm.lng], 17, {
    duration: 1.2,
    easeLinearity: 0.25
  });

  const marker = landmarkMarkers[landmarkId];
  if (marker) {
    setTimeout(() => {
      marker.openPopup();
    }, 1200);
  }
}

export function zoomInMap() {
  if (map) map.zoomIn();
}

export function zoomOutMap() {
  if (map) map.zoomOut();
}

export function refreshMapSize() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
}

/**
 * Sync mobile toggle button visual state with the current layer
 */
function syncMobileToggle(layerType) {
  const toggleBtn = document.getElementById('mode-toggle-mobile');
  if (!toggleBtn) return;
  const label = toggleBtn.querySelector('.mode-toggle-label');

  toggleBtn.setAttribute('data-current', layerType);

  if (layerType === 'street') {
    toggleBtn.classList.add('street-active');
    if (label) label.textContent = 'Peta Jalan';
  } else {
    toggleBtn.classList.remove('street-active');
    if (label) label.textContent = 'Citra Satelit';
  }
}

/**
 * Setup UI element handlers for floating controls, info drawer & landmark drawer
 */
function setupMapUIEvents() {
  const satBtn = document.getElementById('mode-sat');
  const streetBtn = document.getElementById('mode-street');
  const resetBtn = document.getElementById('btn-reset');
  const zoomInBtn = document.getElementById('btn-zoom-in');
  const zoomOutBtn = document.getElementById('btn-zoom-out');

  satBtn?.addEventListener('click', () => switchBasemap('satellite'));
  streetBtn?.addEventListener('click', () => switchBasemap('street'));
  resetBtn?.addEventListener('click', resetMapView);
  zoomInBtn?.addEventListener('click', zoomInMap);
  zoomOutBtn?.addEventListener('click', zoomOutMap);

  // Mobile toggle button — flips between satellite ↔ street
  const mobileToggle = document.getElementById('mode-toggle-mobile');
  let mobileTooltipTimer = null;
  mobileToggle?.addEventListener('click', () => {
    const next = mobileToggle.getAttribute('data-current') === 'satellite' ? 'street' : 'satellite';
    switchBasemap(next);

    // Show the tooltip label briefly
    clearTimeout(mobileTooltipTimer);
    mobileToggle.classList.add('show-label');
    mobileTooltipTimer = setTimeout(() => {
      mobileToggle.classList.remove('show-label');
    }, 1800);
  });

  // Initialize mobile toggle label
  syncMobileToggle(currentLayerName);

  // Drawer Elements
  const infoDrawer = document.getElementById('info-drawer');
  const landmarkDrawer = document.getElementById('landmark-drawer');
  const btnInfo = document.getElementById('btn-info');
  const btnLandmarks = document.getElementById('btn-landmarks');
  const btnCloseInfo = document.getElementById('btn-close-drawer');
  const btnCloseLandmarks = document.getElementById('btn-close-landmarks');

  // Toggle Village Profile (Info Drawer)
  btnInfo?.addEventListener('click', () => {
    landmarkDrawer?.classList.remove('open');
    btnLandmarks?.classList.remove('map-btn--accent');

    const isOpen = infoDrawer?.classList.toggle('open');
    infoDrawer?.setAttribute('aria-hidden', String(!isOpen));
    btnInfo.classList.toggle('map-btn--accent', !!isOpen);
  });

  btnCloseInfo?.addEventListener('click', () => {
    infoDrawer?.classList.remove('open');
    infoDrawer?.setAttribute('aria-hidden', 'true');
    btnInfo?.classList.remove('map-btn--accent');
  });

  // Toggle Landmark Drawer
  btnLandmarks?.addEventListener('click', () => {
    infoDrawer?.classList.remove('open');
    btnInfo?.classList.remove('map-btn--accent');

    const isOpen = landmarkDrawer?.classList.toggle('open');
    landmarkDrawer?.setAttribute('aria-hidden', String(!isOpen));
    btnLandmarks.classList.toggle('map-btn--accent', !!isOpen);
  });

  btnCloseLandmarks?.addEventListener('click', () => {
    landmarkDrawer?.classList.remove('open');
    landmarkDrawer?.setAttribute('aria-hidden', 'true');
    btnLandmarks?.classList.remove('map-btn--accent');
  });

  // Landmark Card Clicks -> Fly to Landmark on Map
  document.querySelectorAll('.landmark-card').forEach(card => {
    card.addEventListener('click', () => {
      const landmarkId = card.getAttribute('data-landmark-id');
      if (landmarkId) {
        landmarkDrawer?.classList.remove('open');
        btnLandmarks?.classList.remove('map-btn--accent');
        flyToLandmark(landmarkId);
      }
    });
  });
}
