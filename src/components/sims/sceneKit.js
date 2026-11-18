import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// ---------- Texturas procedurales (mapas de normales: poros, rugosidad) ----------
const texCache = new Map();

function porousNormalMap(key, { size = 128, cells = 10, amp = 0.5, fine = 0.3 } = {}) {
  if (texCache.has(key)) return texCache.get(key);
  const coarse = [];
  for (let i = 0; i < cells; i++) {
    coarse[i] = [];
    for (let j = 0; j < cells; j++) coarse[i][j] = Math.random();
  }
  const sample = (u, v) => {
    const x = u * cells, y = v * cells;
    const ia = Math.floor(x) % cells, ja = Math.floor(y) % cells;
    const fx = x - Math.floor(x), fy = y - Math.floor(y);
    const ib = (ia + 1) % cells, jb = (ja + 1) % cells;
    return coarse[ia][ja] * (1 - fx) * (1 - fy) + coarse[ib][ja] * fx * (1 - fy) + coarse[ia][jb] * (1 - fx) * fy + coarse[ib][jb] * fx * fy;
  };
  const data = new Uint8Array(size * size * 4);
  const step = 1 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x * step, v = y * step;
      const hx = sample(u + step, v) - sample(u - step, v);
      const hy = sample(u, v + step) - sample(u, v - step);
      const nx = -hx * amp * 8 + (Math.random() - 0.5) * fine;
      const ny = -hy * amp * 8 + (Math.random() - 0.5) * fine;
      const len = Math.sqrt(nx * nx + ny * ny + 1);
      const idx = (y * size + x) * 4;
      data[idx] = ((-nx / len) * 0.5 + 0.5) * 255;
      data[idx + 1] = ((-ny / len) * 0.5 + 0.5) * 255;
      data[idx + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[idx + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

let discTex = null;
function contactDiscTexture() {
  if (discTex) return discTex;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.75)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  discTex = new THREE.CanvasTexture(c);
  return discTex;
}

// ---------- Biblioteca de materiales PBR industriales ----------
export const MAT = {
  // Acero pulido / aluminio anodizado
  acero: (color = 0xb0bccb, o = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: o.metalness ?? 0.85,
      roughness: o.roughness ?? 0.2,
      normalMap: porousNormalMap('brushed', { cells: 14, amp: 0.1, fine: 0.06 }),
      normalScale: new THREE.Vector2(0.18, 0.18),
    }),
  // Aluminio forjado (pistones)
  aluminio: (color = 0xd6dde6) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.85,
      roughness: 0.28,
      normalMap: porousNormalMap('brushed', { cells: 14, amp: 0.1, fine: 0.06 }),
      normalScale: new THREE.Vector2(0.12, 0.12),
    }),
  // Hierro fundido / bloque de motor (textura porosa)
  hierro: (color = 0x4c5663) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness: 0.5,
      roughness: 0.6,
      normalMap: porousNormalMap('cast', { cells: 9, amp: 0.5, fine: 0.35 }),
      normalScale: new THREE.Vector2(0.8, 0.8),
    }),
  // Bronce / cojinetes
  bronce: (color = 0xb08d57) => new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.35 }),
  // Polímeros / plásticos técnicos (clearcoat)
  polimero: (color = 0x1f2a37) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
};

// ---------- Estudio: HDRI de taller + luces + sombras de contacto + AO ----------
export function createStudio(scene, renderer, { gridY = null, envIntensity = 0.55, contactRadius = 2.4 } = {}) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = envIntensity;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 7, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 30 });
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xD8B775, 0.7); // luz de acento dorada ITS
  rim.position.set(-5, 3, -4);
  scene.add(rim);
  const fill = new THREE.HemisphereLight(0xc7d2de, 0x1a0d12, 0.4);
  scene.add(fill);

  const groundY = gridY ?? 0;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY + 0.005;
  ground.receiveShadow = true;
  scene.add(ground);

  const disc = new THREE.Mesh(
    new THREE.PlaneGeometry(contactRadius * 2, contactRadius * 2),
    new THREE.MeshBasicMaterial({ map: contactDiscTexture(), transparent: true, opacity: 0.55, depthWrite: false })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = groundY + 0.002;
  scene.add(disc);

  let grid = null;
  if (gridY !== null) {
    grid = new THREE.GridHelper(12, 24, 0x1e293b, 0x0f172a);
    grid.position.y = gridY;
    scene.add(grid);
  }
  return { dispose: () => pmrem.dispose() };
}

// ---------- Post-procesado: Bloom sutil + FXAA + salida ACES/sRGB ----------
export function createPost(renderer, scene, camera, { bloom = 0.35 } = {}) {
  const pr = renderer.getPixelRatio();
  const size = renderer.getSize(new THREE.Vector2());
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pr);
  composer.setSize(size.x, size.y);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), bloom, 0.55, 0.82);
  composer.addPass(bloomPass);
  const fxaa = new ShaderPass(FXAAShader);
  const setFxaa = (w, h) => fxaa.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr));
  setFxaa(size.x, size.y);
  composer.addPass(fxaa);
  composer.addPass(new OutputPass());
  return {
    render: () => composer.render(),
    resize: (w, h) => {
      composer.setSize(w, h);
      setFxaa(w, h);
    },
    dispose: () => composer.dispose(),
  };
}

// ---------- Piezas estándar ----------
export function hexBolt(headR = 0.03, headH = 0.02, shankR = 0.018, shankL = 0.05) {
  const g = new THREE.Group();
  const head = new THREE.Mesh(new THREE.CylinderGeometry(headR, headR, headH, 6), MAT.acero(0x93a1b1, { roughness: 0.3 }));
  head.position.y = headH / 2;
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(shankR, shankR, shankL, 10), MAT.acero(0x8a97a8, { roughness: 0.35 }));
  shank.position.y = -shankL / 2;
  g.add(head, shank);
  return g;
}

export function weldMesh(radius, tube = 0.012) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 20), MAT.hierro(0x2f3742, { roughness: 0.85 }));
}

// Viga tipo I (perfil estructural) extruida a lo largo de Z, centrada
export function ibeamGeometry(len, { h = 0.16, w = 0.09, tw = 0.02, tf = 0.024 } = {}) {
  const s = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  s.moveTo(-hw, -hh);
  s.lineTo(hw, -hh);
  s.lineTo(hw, -hh + tf);
  s.lineTo(tw / 2, -hh + tf);
  s.lineTo(tw / 2, hh - tf);
  s.lineTo(hw, hh - tf);
  s.lineTo(hw, hh);
  s.lineTo(-hw, hh);
  s.lineTo(-hw, hh - tf);
  s.lineTo(-tw / 2, hh - tf);
  s.lineTo(-tw / 2, -hh + tf);
  s.lineTo(-hw, -hh + tf);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  geo.translate(0, 0, -len / 2);
  return geo;
}

// Perfil de diente en evolvente real (ángulo de presión 20°)
export function involuteGearShape(Z, m) {
  const rp = (m * Z) / 2;
  const rb = rp * Math.cos(Math.PI / 9);
  const ra = rp + m;
  const rf = rp - 1.25 * m;
  const inv = (t) => Math.tan(t) - t;
  const invP = inv(Math.PI / 9);
  const tMax = Math.acos(Math.min(rb / ra, 1));
  const tMin = rf > rb ? Math.acos(Math.min(rb / rf, 1)) : 0;
  const hT = Math.PI / (2 * Z);
  const px = (r, a) => r * Math.cos(a);
  const py = (r, a) => r * Math.sin(a);
  const invD = (t) => inv(t) - invP;
  const shape = new THREE.Shape();
  let prevRightRoot = 0;
  for (let i = 0; i < Z; i++) {
    const c = (i / Z) * Math.PI * 2;
    if (i === 0) {
      shape.moveTo(px(rb / Math.cos(tMin), c - hT + invD(tMin)), py(rb / Math.cos(tMin), c - hT + invD(tMin)));
    } else {
      shape.absarc(0, 0, rf, prevRightRoot, c - hT + invD(tMin), false);
    }
    for (let j = 0; j <= 5; j++) {
      const t = tMin + ((tMax - tMin) * j) / 5;
      const r = rb / Math.cos(t);
      shape.lineTo(px(r, c - hT + invD(t)), py(r, c - hT + invD(t)));
    }
    shape.absarc(0, 0, ra, c - hT + invD(tMax), c + hT - invD(tMax), false);
    for (let j = 5; j >= 0; j--) {
      const t = tMin + ((tMax - tMin) * j) / 5;
      const r = rb / Math.cos(t);
      shape.lineTo(px(r, c + hT - invD(t)), py(r, c + hT - invD(t)));
    }
    prevRightRoot = c + hT - invD(tMin);
  }
  shape.absarc(0, 0, rf, prevRightRoot, Math.PI * 2 - hT + invD(tMin), false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, Math.max(rp * 0.22, 0.04), 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

// Agujero de buje con chavetero (keyway)
export function hubKeyPath(rh, kw, kd) {
  const a0 = Math.atan2(rh, kw / 2);
  const p = new THREE.Path();
  p.moveTo(kw / 2, rh);
  p.absarc(0, 0, rh, a0, Math.PI - a0, true);
  p.lineTo(-kw / 2, rh + kd);
  p.lineTo(kw / 2, rh + kd);
  p.closePath();
  return p;
}

// Sistema de partículas (flujos / líneas de corriente)
export function createParticles(count, { color = 0xC5A059, size = 0.04, opacity = 0.4 } = {}) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  return new THREE.Points(geo, mat);
}