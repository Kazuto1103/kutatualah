import './style.css';
import gsap from 'gsap';
import { initLiveMap, refreshMapSize, animateMarkersEntrance } from './liveMap.js';
import { initQRCodeModal } from './qrModal.js';
import { initPhotoViewer } from './photoViewer.js';

let hasMapTransitioned = false;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize QR Code Modal trigger handler (bound strictly to QR button)
  initQRCodeModal();

  // Initialize Photo Viewer Lightbox
  initPhotoViewer();

  // Initialize KKN Identity Modal
  initKKNModal();

  // Start vertical left-edge loading animation
  runLoadingSequence();
});

/**
 * PHASE 1 — GSAP Vertical Left Loader (fills bar 0% -> 100% top to bottom)
 */
function runLoadingSequence() {
  const pctEl = document.getElementById('loader-pct');
  const barEl = document.getElementById('loader-bar');
  const statusEl = document.getElementById('loader-status');

  const statusMessages = [
    [0, 'Menyiapkan peta interaktif…'],
    [28, 'Memuat animasi bumi video intro…'],
    [65, 'Menyiapkan koordinat Desa Kutatualah…'],
    [90, 'Hampir selesai…']
  ];

  let currentStatusIdx = 0;
  const progressObj = { p: 0 };

  gsap.to(progressObj, {
    p: 100,
    duration: 2.2,
    ease: 'power2.inOut',

    onUpdate() {
      const currentPct = Math.floor(progressObj.p);

      // Update numerical percentage
      if (pctEl) pctEl.textContent = currentPct;

      // Update vertical left bar height (0% -> 100%)
      if (barEl) barEl.style.height = progressObj.p + '%';

      // Update status message dynamically
      if (statusEl) {
        for (let i = statusMessages.length - 1; i >= 0; i--) {
          if (currentPct >= statusMessages[i][0] && i > currentStatusIdx) {
            currentStatusIdx = i;
            gsap.to(statusEl, {
              opacity: 0,
              duration: 0.15,
              onComplete() {
                statusEl.textContent = statusMessages[i][1];
                gsap.to(statusEl, { opacity: 1, duration: 0.2 });
              }
            });
            break;
          }
        }
      }
    },

    onComplete() {
      // Small pause at 100% before triggering horizontal curtain wipe
      gsap.delayedCall(0.2, runCurtainWipeTransition);
    }
  });
}

/**
 * PHASE 2 — Horizontal Curtain Wipe & Reveal Video Stage (world.mp4)
 */
function runCurtainWipeTransition() {
  const loader = document.getElementById('loader');
  const curtain = document.getElementById('wipe-curtain');
  const videoStage = document.getElementById('video-stage');

  if (!curtain) {
    runVideoStage();
    return;
  }

  const tl = gsap.timeline();

  // Step 1: Wipe green curtain horizontally across screen from left to right
  tl.fromTo(
    curtain,
    { clipPath: 'inset(0 100% 0 0)', webkitClipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      webkitClipPath: 'inset(0 0% 0 0)',
      duration: 0.75,
      ease: 'power2.inOut',
      onComplete() {
        // Hide loader overlay once full curtain covers screen
        if (loader) {
          loader.classList.add('hidden');
          loader.style.display = 'none';
          loader.style.pointerEvents = 'none';
        }
        // Make video stage visible under curtain
        if (videoStage) {
          videoStage.style.visibility = 'visible';
          videoStage.style.opacity = '1';
        }
        runVideoStage();
      }
    }
  );

  // Step 2: Unmask green curtain from left to right, smoothly revealing world.mp4 video
  tl.to(curtain, {
    clipPath: 'inset(0 0% 0 100%)',
    webkitClipPath: 'inset(0 0% 0 100%)',
    duration: 0.8,
    ease: 'power2.inOut',
    delay: 0.1,
    onComplete() {
      if (curtain) {
        curtain.classList.add('hidden');
        curtain.style.display = 'none';
        curtain.style.pointerEvents = 'none';
      }
    }
  });
}

/**
 * PHASE 3 — Play world.mp4 Video & Monitor Transition Threshold
 */
function runVideoStage() {
  const video = document.getElementById('world-video');
  const skipBtn = document.getElementById('btn-skip-video');

  if (!video) {
    triggerMapTransition();
    return;
  }

  // Play video
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("Autoplay video error:", err);
      triggerMapTransition();
    });
  }

  // Listen for 8 second timestamp threshold for smooth transition
  video.addEventListener('timeupdate', () => {
    if (video.currentTime >= 8.0) {
      triggerMapTransition();
    }
  });

  // Listen for video end
  video.addEventListener('ended', () => {
    triggerMapTransition();
  });

  // Skip button click handler
  skipBtn?.addEventListener('click', () => {
    triggerMapTransition();
  });
}

/**
 * PHASE 4 — Smooth Cross-Fade Transition from Video to Interactive Live Map
 */
function triggerMapTransition() {
  if (hasMapTransitioned) return;
  hasMapTransitioned = true;

  const videoStage = document.getElementById('video-stage');
  const mapStage   = document.getElementById('map-stage');
  const video      = document.getElementById('world-video');
  const fogOverlay = document.getElementById('fog-overlay');
  const fogLayers  = document.querySelectorAll('.fog-layer');

  // Prepare map stage behind the scenes
  if (mapStage) {
    mapStage.style.visibility = 'visible';
    mapStage.style.opacity = '0';
    initLiveMap();
  }

  // Display the fog overlay container
  if (fogOverlay) {
    fogOverlay.style.display = 'block';
  }

  const tl = gsap.timeline({
    onComplete() {
      // Cleanup video stage
      if (videoStage) {
        videoStage.style.display = 'none';
        videoStage.style.pointerEvents = 'none';
      }
      if (video) video.pause();
      
      // Hide fog overlay container
      if (fogOverlay) {
        fogOverlay.style.display = 'none';
      }
      
      // Ensure Leaflet size updates properly
      refreshMapSize();
    }
  });

  // 1. Fog rolls in: layers fade in and scale up from small, drifting in different directions
  tl.to(fogLayers, {
    opacity: 1,
    scale: 1.25,
    x: (idx) => (idx % 2 === 0 ? '15%' : '-15%'),
    y: (idx) => (idx === 0 ? '-10%' : idx === 1 ? '10%' : '0%'),
    duration: 0.95,
    ease: 'power2.inOut'
  });

  // 2. Map Stage reveals at the peak of the fog cover (underneath)
  tl.add(() => {
    if (videoStage) videoStage.style.opacity = '0';
    if (mapStage) mapStage.style.opacity = '1';
    // Trigger marker entrance animations when the map is finally revealed
    animateMarkersEntrance();
  }, "-=0.3");

  // 3. Fog disperses: layers fade out and scale up even larger to drift away
  tl.to(fogLayers, {
    opacity: 0,
    scale: 2.3,
    x: (idx) => (idx % 2 === 0 ? '40%' : '-40%'),
    y: (idx) => (idx === 0 ? '-25%' : idx === 1 ? '25%' : '0%'),
    duration: 1.35,
    ease: 'power3.out'
  });
}

/**
 * Initialize KKN Identity Modal Event Listeners
 */
function initKKNModal() {
  const openBtn = document.getElementById('btn-kkn-identity');
  const closeBtn = document.getElementById('btn-close-kkn');
  const modalOverlay = document.getElementById('kkn-modal');

  if (!openBtn || !modalOverlay || !closeBtn) return;

  const openModal = () => {
    modalOverlay.setAttribute('aria-hidden', 'false');
    modalOverlay.classList.add('active');
    setTimeout(() => closeBtn.focus(), 100);
  };

  const closeModal = () => {
    modalOverlay.setAttribute('aria-hidden', 'true');
    modalOverlay.classList.remove('active');
    openBtn.focus();
  };

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // Close when clicking on background overlay
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });
}
