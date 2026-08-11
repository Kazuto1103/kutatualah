import './style.css';
import gsap from 'gsap';
import { initMapViewer } from './mapViewer.js';

let hasMapTransitioned = false;

// ─────────────────────────────────────────────────────────────
// PHASE 1 — Loading Screen
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const pctEl    = document.getElementById('loader-pct');
  const barEl    = document.getElementById('loader-bar');
  const statusEl = document.getElementById('loader-status');

  const statuses = [
    [0,  'Memuat peta desa…'],
    [28, 'Memuat animasi video bumi…'],
    [58, 'Mengambil data wilayah…'],
    [82, 'Menyiapkan tampilan interaktif…'],
    [97, 'Hampir selesai…'],
  ];
  let statusIdx = 0;

  const proxy = { p: 0 };

  gsap.to(proxy, {
    p: 100,
    duration: 2.8,
    ease: 'power1.inOut',

    onUpdate() {
      const v = Math.floor(proxy.p);
      if (pctEl) pctEl.textContent = v;
      if (barEl) barEl.style.height = proxy.p + '%';

      if (statusEl) {
        for (let i = statuses.length - 1; i >= 0; i--) {
          if (v >= statuses[i][0] && i > statusIdx) {
            statusIdx = i;
            gsap.killTweensOf(statusEl);
            gsap.to(statusEl, {
              opacity: 0, duration: 0.15,
              onComplete() {
                statusEl.textContent = statuses[i][1];
                gsap.to(statusEl, { opacity: 1, duration: 0.2 });
              }
            });
            break;
          }
        }
      }
    },

    onComplete() {
      gsap.delayedCall(0.3, runWipe);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// PHASE 2 — Green Curtain Wipe (Hardware-Accelerated clipPath)
// ─────────────────────────────────────────────────────────────
function runWipe() {
  const loader     = document.getElementById('loader');
  const curtain    = document.getElementById('wipe-curtain');
  const videoStage = document.getElementById('video-stage');

  if (!curtain) {
    runVideoStage();
    return;
  }

  const tl = gsap.timeline();

  // Step 1 (Intro): Expand green curtain from left loading bar across horizontally to right
  // clipPath: inset(0 100% 0 0) -> inset(0 0% 0 0)
  tl.fromTo(curtain,
    { clipPath: 'inset(0 100% 0 0)', webkitClipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      webkitClipPath: 'inset(0 0% 0 0)',
      duration: 0.85,
      ease: 'power2.inOut',
      onComplete() {
        // Viewport is 100% covered in solid green: hide loader & activate video stage underneath
        if (loader) loader.style.display = 'none';
        if (videoStage) {
          videoStage.style.visibility = 'visible';
          videoStage.style.opacity = '1';
        }
        runVideoStage();
      }
    }
  );

  // Step 2 (Outro): Unmask left edge moving from left to right, revealing video underneath
  // clipPath: inset(0 0% 0 0) -> inset(0 0% 0 100%)
  tl.to(curtain, {
    clipPath: 'inset(0 0% 0 100%)',
    webkitClipPath: 'inset(0 0% 0 100%)',
    duration: 0.9,
    ease: 'power2.inOut',
    delay: 0.1,
    onComplete() {
      gsap.set(curtain, { clipPath: 'inset(0 100% 0 0)', webkitClipPath: 'inset(0 100% 0 0)' });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// PHASE 3 — Play world.mp4 Video & Monitor 8-Second Mark
// ─────────────────────────────────────────────────────────────
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
      console.warn("Autoplay muted video error:", err);
    });
  }

  // Listen for 8 second timestamp threshold
  video.addEventListener('timeupdate', () => {
    if (video.currentTime >= 8.0) {
      triggerMapTransition();
    }
  });

  // Listen for video end
  video.addEventListener('ended', () => {
    triggerMapTransition();
  });

  // Skip button click
  skipBtn?.addEventListener('click', () => {
    triggerMapTransition();
  });
}

// ─────────────────────────────────────────────────────────────
// PHASE 4 — Smooth Cross-fade from Video to 2D Map Viewer
// ─────────────────────────────────────────────────────────────
function triggerMapTransition() {
  if (hasMapTransitioned) return;
  hasMapTransitioned = true;

  const videoStage = document.getElementById('video-stage');
  const mapStage   = document.getElementById('map-stage');
  const video      = document.getElementById('world-video');

  // Show map stage behind video
  if (mapStage) {
    mapStage.style.visibility = 'visible';
    mapStage.style.opacity = '0';
    initMapViewer();
  }

  // Fade out video stage, fade in map stage
  gsap.to(videoStage, {
    opacity: 0,
    duration: 1.0,
    ease: 'power2.out',
    onComplete() {
      if (videoStage) videoStage.style.display = 'none';
      if (video) video.pause();
    }
  });

  gsap.to(mapStage, {
    opacity: 1,
    duration: 1.0,
    ease: 'power2.out',
  });
}
