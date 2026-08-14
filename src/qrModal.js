import QRCode from 'qrcode';
import gsap from 'gsap';

const TARGET_DOMAIN = 'https://kutatualah.vercel.app';

export function initQRCodeModal() {
  const modal       = document.getElementById('qr-modal');
  const canvas      = document.getElementById('qr-canvas');
  const btnQr       = document.getElementById('btn-qr');
  const btnClose    = document.getElementById('btn-close-qr');
  const btnDownload = document.getElementById('btn-download-qr');
  const btnCopy     = document.getElementById('btn-copy-url');
  const copyLabel   = document.getElementById('copy-label');

  if (!modal) return;

  let qrGenerated = false;

  function renderQR() {
    if (!canvas) return;
    QRCode.toCanvas(
      canvas,
      TARGET_DOMAIN,
      {
        width: 240,
        margin: 2,
        color: {
          dark: '#1B4D3E',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      },
      (err) => {
        if (err) console.error('Gagal membuat QR Code:', err);
      }
    );
    qrGenerated = true;
  }

  function openQRModal() {
    if (!modal) return;
    if (!qrGenerated) renderQR();

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    const card = modal.querySelector('.qr-modal-card');
    if (card) {
      gsap.fromTo(
        card,
        { scale: 0.85, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)' }
      );
    }
  }

  function closeQRModal() {
    if (!modal) return;
    const card = modal.querySelector('.qr-modal-card');
    if (card) {
      gsap.to(card, {
        scale: 0.9,
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete() {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
        }
      });
    } else {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Bind trigger strictly to QR Code button
  btnQr?.addEventListener('click', openQRModal);

  // Close triggers
  btnClose?.addEventListener('click', closeQRModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeQRModal();
  });

  // Global keydown listeners (Escape to close)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeQRModal();
    }
  });

  // Download QR Code Image if download button present
  btnDownload?.addEventListener('click', () => {
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'QR-Kutatualah-Vercel.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // Copy URL Link
  btnCopy?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(TARGET_DOMAIN);
      if (copyLabel) copyLabel.textContent = 'Tersalin!';
      btnCopy.classList.add('copied');
      setTimeout(() => {
        if (copyLabel) copyLabel.textContent = 'Salin';
        btnCopy.classList.remove('copied');
      }, 2200);
    } catch (err) {
      console.error('Gagal menyalin link:', err);
    }
  });
}
