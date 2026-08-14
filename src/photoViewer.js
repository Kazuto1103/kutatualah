import { landmarksData } from './liveMap.js';
import gsap from 'gsap';

/**
 * Initialize the Photo Viewer Lightbox functionality
 */
export function initPhotoViewer() {
  const lightbox = document.getElementById('photo-viewer-lightbox');
  const closeBtn = document.getElementById('btn-close-lightbox');
  const img = document.getElementById('lightbox-img');
  const tag = document.getElementById('lightbox-tag');
  const title = document.getElementById('lightbox-title');
  const desc = document.getElementById('lightbox-desc');

  if (!lightbox || !closeBtn || !img || !tag || !title || !desc) {
    console.warn("Photo viewer elements not found in DOM");
    return;
  }

  /**
   * Open photo viewer modal for a specific landmark
   * @param {string} landmarkId
   */
  const openPhotoViewer = (landmarkId) => {
    const data = landmarksData.find(item => item.id === landmarkId);
    if (!data) return;

    // Set elements data
    img.src = data.photo;
    img.alt = data.name;
    tag.textContent = data.category;
    
    // Maintain correct background badge category color
    tag.className = 'lightbox-tag ' + data.tagClass;
    
    title.textContent = data.name;
    desc.textContent = data.desc;

    // Show photo viewer with GSAP
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');

    // Smooth backdrop fade-in
    gsap.fromTo(lightbox,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );

    // Springy/bouncy scale-in for the modal card
    gsap.fromTo(lightbox.querySelector('.lightbox-card'),
      { scale: 0.93, y: 15 },
      { scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.5)' }
    );
  };

  // Expose function globally so Leaflet map popup photo click can use it
  window.openPhotoViewer = openPhotoViewer;

  /**
   * Close photo viewer modal
   */
  const closePhotoViewer = () => {
    gsap.to(lightbox.querySelector('.lightbox-card'), {
      scale: 0.95,
      y: 10,
      duration: 0.2,
      ease: 'power2.in'
    });

    gsap.to(lightbox, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
      onComplete() {
        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        // Clear image source to prevent visual flash on next open
        img.src = '';
      }
    });
  };

  // Close button click
  closeBtn.addEventListener('click', closePhotoViewer);

  // Backdrop click to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closePhotoViewer();
    }
  });

  // Escape key click to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closePhotoViewer();
    }
  });

  // Bind clicks on all card thumbnail photo overlay buttons (stop propagation so map doesn't fly)
  document.querySelectorAll('.btn-view-photo-overlay').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // VERY IMPORTANT: Prevents triggering card fly-to map click
      const card = btn.closest('.landmark-card');
      if (card) {
        const landmarkId = card.getAttribute('data-landmark-id');
        if (landmarkId) {
          openPhotoViewer(landmarkId);
        }
      }
    });
  });
}
