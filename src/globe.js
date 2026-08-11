import * as THREE from 'three';
import gsap from 'gsap';

// ─── State ───────────────────────────────────────────────────
let scene, camera, renderer, globe, raf;
let isZooming = false;

// ─── Constants ───────────────────────────────────────────────
const GLOBE_R     = 5;
const TARGET_LAT  = -6.9147;   // Kutatualah, Kab. Bandung Barat
const TARGET_LON  = 107.6098;

// ─── Lat/Lon → 3D vector on sphere surface ───────────────────
function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.sin(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.cos(theta)
  );
}

// ─────────────────────────────────────────────────────────────
// initGlobe()
// FIX: Always use window.innerWidth / window.innerHeight so the
//      renderer fills the full screen regardless of host element
//      layout quirks. Enable antialias. Set pixelRatio properly.
// ─────────────────────────────────────────────────────────────
export function initGlobe() {
  const host = document.getElementById('globe-canvas-host');
  if (!host) return;

  const W = window.innerWidth;
  const H = window.innerHeight;

  // ── Scene ──────────────────────────────────────────────────
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF2F6F4); // matches --off-white

  // ── Camera ─────────────────────────────────────────────────
  camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 600);
  camera.position.set(0, 1.5, 18);
  camera.lookAt(0, 0, 0);

  // ── Renderer ───────────────────────────────────────────────
  // FIX: window dimensions, antialias, correct pixelRatio
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Make canvas fill host absolutely
  renderer.domElement.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
  host.appendChild(renderer.domElement);

  // ── Lighting (natural sunlight, no glow) ───────────────────
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const sun = new THREE.DirectionalLight(0xfff8ec, 1.05);
  sun.position.set(10, 6, 12);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xd0eaff, 0.28);
  fill.position.set(-8, -4, -10);
  scene.add(fill);

  // ── Earth texture & globe mesh ─────────────────────────────
  const texLoader = new THREE.TextureLoader();

  texLoader.load(
    '/earth-texture.png',
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

      const geo = new THREE.SphereGeometry(GLOBE_R, 80, 80);
      const mat = new THREE.MeshPhongMaterial({
        map:       tex,
        specular:  new THREE.Color(0x1a3322),
        shininess: 14,
      });
      globe = new THREE.Mesh(geo, mat);
      scene.add(globe);

      // Thin natural atmosphere haze
      const atmGeo = new THREE.SphereGeometry(GLOBE_R * 1.015, 40, 40);
      const atmMat = new THREE.MeshPhongMaterial({
        color:       0xa8d4f0,
        transparent: true,
        opacity:     0.10,
        side:        THREE.FrontSide,
        depthWrite:  false,
      });
      globe.add(new THREE.Mesh(atmGeo, atmMat));

      // Orient Indonesia toward camera
      globe.rotation.y = -(TARGET_LON * Math.PI / 180) - Math.PI / 2;

      tick();
    },
    undefined,
    (err) => {
      // Texture load failed — show a fallback plain blue sphere
      console.warn('Earth texture failed to load, using fallback.', err);
      const geo = new THREE.SphereGeometry(GLOBE_R, 64, 64);
      const mat = new THREE.MeshPhongMaterial({ color: 0x4a90b8, shininess: 10 });
      globe = new THREE.Mesh(geo, mat);
      scene.add(globe);
      tick();
    }
  );

  // ── Resize handler ─────────────────────────────────────────
  window.addEventListener('resize', _onResize);
}

// ─── Render loop ─────────────────────────────────────────────
function tick() {
  raf = requestAnimationFrame(tick);
  if (globe && !isZooming) {
    globe.rotation.y += 0.0010; // slow, gentle rotate
  }
  renderer?.render(scene, camera);
}

// ─────────────────────────────────────────────────────────────
// startZoom(onComplete)
// FIX: Camera position animated with window dimensions so it
//      stays full-screen. lookAt target kept updated every frame.
// ─────────────────────────────────────────────────────────────
export function startZoom(onComplete) {
  if (!globe) {
    // Globe texture not loaded yet — retry after a short delay
    setTimeout(() => startZoom(onComplete), 150);
    return;
  }

  isZooming = true;

  const targetWorld = latLonToVec3(TARGET_LAT, TARGET_LON, GLOBE_R);

  // Final camera pos: just above the surface at target location
  const surfaceDist = GLOBE_R + 0.6;
  const finalPos    = targetWorld.clone().normalize().multiplyScalar(surfaceDist);

  // Globe rotation needed so target lon faces the camera (z+ axis)
  const finalRotY = -(TARGET_LON * Math.PI / 180) - Math.PI / 2;

  const tl = gsap.timeline({
    onComplete() {
      cancelAnimationFrame(raf);
      raf = null;
      if (onComplete) onComplete();
    }
  });

  // Phase A: rotate globe so target faces camera
  tl.to(globe.rotation, {
    y: finalRotY,
    duration: 1.5,
    ease: 'power2.out',
  });

  // Phase B: zoom camera from far to close — overlap with rotation
  tl.to(camera.position, {
    x: finalPos.x,
    y: finalPos.y,
    z: finalPos.z,
    duration: 2.6,
    ease: 'power2.inOut',
    onUpdate() {
      // Keep camera locked on target throughout zoom
      if (camera) camera.lookAt(targetWorld);
    },
  }, '-=0.8'); // overlap 0.8s with rotation
}

// ─── Cleanup ─────────────────────────────────────────────────
export function destroyGlobe() {
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  window.removeEventListener('resize', _onResize);
  if (renderer) {
    renderer.dispose();
    renderer.domElement?.remove();
  }
  scene = camera = renderer = globe = null;
  isZooming = false;
}

// ─── Resize ──────────────────────────────────────────────────
function _onResize() {
  if (!camera || !renderer) return;
  const W = window.innerWidth;
  const H = window.innerHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
}

