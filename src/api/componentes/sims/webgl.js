import * as THREE from 'three';

// El canvas ya está montado en el DOM; Three.js solicita la GPU directamente.
export function createWebglRenderer(mount, extra = {}) {
  return new THREE.WebGLRenderer({
    canvas: mount.querySelector('canvas[data-three-scene]'),
    antialias: true,
    ...extra,
    preserveDrawingBuffer: true,
    failIfMajorPerformanceCaveat: false,
    powerPreference: 'high-performance',
  });
}