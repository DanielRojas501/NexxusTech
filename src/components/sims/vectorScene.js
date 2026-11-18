import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createWebglRenderer } from './webgl';

// math (x, y, z) with z up  <->  three (x, y up, z)
export const toThree = (a) => new THREE.Vector3(a[0], a[2], -a[1]);
const toMath = (v) => [v.x, -v.z, v.y].map((n) => Math.round(Math.max(-6, Math.min(6, n)) * 10) / 10);

export function createVectorScene(el, onDrag) {
  const w = el.clientWidth, h = el.clientHeight;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
  camera.position.set(10, 8, 12);
  const renderer = createWebglRenderer(el, { alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.GridHelper(12, 12, 0x334155, 0x1e293b));
  const axis = (dir, color) => {
    scene.add(new THREE.ArrowHelper(dir, new THREE.Vector3(), 7, color, 0.35, 0.2));
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir.clone().multiplyScalar(-7)]);
    scene.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.25 })));
  };
  axis(new THREE.Vector3(1, 0, 0), 0xB05064);
  axis(new THREE.Vector3(0, 0, -1), 0x6FA37C);
  axis(new THREE.Vector3(0, 1, 0), 0x7C93AC);

  const mk = (color) => { const a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.5, 0.3); scene.add(a); return a; };
  // Color institucional personalizable (panel "MI ESTILO ITS") para el vector A
  const readVectorHex = () => {
    const v = window.getComputedStyle(document.documentElement).getPropertyValue('--sim-vector').trim();
    return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#C5A059';
  };
  let customHex = readVectorHex();
  const arrowA = mk(customHex), arrowB = mk(0xe8e4dc), arrowC = mk(0xB05064);
  const tip = (color, key) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 }));
    m.userData.key = key; scene.add(m); return m;
  };
  const tipA = tip(customHex, 'A'), tipB = tip(0xe8e4dc, 'B');

  // Paralelogramo generado por A y B (el área del producto cruz)
  const paraGeo = new THREE.BufferGeometry();
  paraGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
  paraGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const para = new THREE.Mesh(paraGeo,     new THREE.MeshBasicMaterial({ color: customHex, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
  para.renderOrder = -1;
  scene.add(para);

  // Plano generado por A y B (normal = A × B)
  const planeDisc = new THREE.Mesh(
    new THREE.CircleGeometry(3.6, 48),
    new THREE.MeshBasicMaterial({ color: customHex, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false })
  );
  planeDisc.renderOrder = -2;
  scene.add(planeDisc);

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(), hit = new THREE.Vector3();
  let dragging = null;
  const setNdc = (e) => { const r = renderer.domElement.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); };
  const onDown = (e) => {
    setNdc(e);
    const [i] = ray.intersectObjects([tipA, tipB]);
    if (!i) return;
    e.stopPropagation();
    dragging = i.object.userData.key; controls.enabled = false;
    const n = new THREE.Vector3(); camera.getWorldDirection(n);
    plane.setFromNormalAndCoplanarPoint(n, i.object.position);
  };
  const onMove = (e) => {
    setNdc(e);
    if (!dragging) { renderer.domElement.style.cursor = ray.intersectObjects([tipA, tipB]).length ? 'grab' : 'default'; return; }
    if (ray.ray.intersectPlane(plane, hit)) onDrag(dragging, toMath(hit));
  };
  const onUp = () => { dragging = null; controls.enabled = true; };
  el.addEventListener('pointerdown', onDown, { capture: true });
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);

  const ro = new ResizeObserver(() => { const W = el.clientWidth, Hh = el.clientHeight; camera.aspect = W / Hh; camera.updateProjectionMatrix(); renderer.setSize(W, Hh); });
  ro.observe(el);
  let raf;
  const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  loop();

  const setArrow = (arrow, tipMesh, t) => {
    const len = t.length();
    arrow.visible = len > 0.01;
    if (arrow.visible) { arrow.setDirection(t.clone().normalize()); arrow.setLength(len, Math.min(0.5, len * 0.3), Math.min(0.3, len * 0.2)); }
    if (tipMesh) tipMesh.position.copy(t);
  };

  const dispose = () => {
    cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
    el.removeEventListener('pointerdown', onDown, { capture: true });
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp);
    renderer.dispose();
  };
  const setParallelogram = (a3, b3) => {
    const pos = para.geometry.attributes.position;
    pos.setXYZ(0, 0, 0, 0);
    pos.setXYZ(1, a3.x, a3.y, a3.z);
    pos.setXYZ(2, a3.x + b3.x, a3.y + b3.y, a3.z + b3.z);
    pos.setXYZ(3, b3.x, b3.y, b3.z);
    pos.needsUpdate = true;
    para.visible = a3.lengthSq() > 0.01 && b3.lengthSq() > 0.01;
  };
  const setPlane = (c3) => {
    const cl = c3.length();
    planeDisc.visible = cl > 0.05;
    if (planeDisc.visible) {
      planeDisc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c3.clone().normalize());
    }
  };

  const setCustomColor = (hex) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return;
    customHex = hex;
    arrowA.setColor(new THREE.Color(hex));
    tipA.material.color.set(hex);
    para.material.color.set(hex);
    planeDisc.material.color.set(hex);
  };

  return { arrowA, arrowB, arrowC, tipA, tipB, setArrow, setParallelogram, setPlane, setCustomColor, dispose };
}