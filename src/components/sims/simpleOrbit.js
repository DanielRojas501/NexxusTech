import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

export function attachOrbit(camera, dom, { distance = 5, minDist = 2, maxDist = 14, targetY = 0 } = {}) {
  let theta = Math.PI * 0.35;
  let phi = Math.PI * 0.38;
  let dist = distance;
  const target = new THREE.Vector3(0, targetY, 0);

  let dragging = false;
  let px = 0;
  let py = 0;

  const down = (e) => {
    dragging = true;
    px = e.clientX;
    py = e.clientY;
  };
  const move = (e) => {
    if (!dragging) return;
    theta -= (e.clientX - px) * 0.008;
    phi = clamp(phi - (e.clientY - py) * 0.008, 0.15, Math.PI - 0.35);
    px = e.clientX;
    py = e.clientY;
  };
  const up = () => {
    dragging = false;
  };
  const wheel = (e) => {
    e.preventDefault();
    dist = clamp(dist * (1 + Math.sign(e.deltaY) * 0.12), minDist, maxDist);
  };

  dom.addEventListener('pointerdown', down);
  dom.addEventListener('pointermove', move);
  dom.addEventListener('pointerup', up);
  dom.addEventListener('pointerleave', up);
  dom.addEventListener('wheel', wheel, { passive: false });

  return {
    update() {
      camera.position.set(
        target.x + dist * Math.sin(phi) * Math.sin(theta),
        target.y + dist * Math.cos(phi),
        target.z + dist * Math.sin(phi) * Math.cos(theta)
      );
      camera.lookAt(target);
    },
    dispose() {
      dom.removeEventListener('pointerdown', down);
      dom.removeEventListener('pointermove', move);
      dom.removeEventListener('pointerup', up);
      dom.removeEventListener('pointerleave', up);
      dom.removeEventListener('wheel', wheel);
    },
  };
}