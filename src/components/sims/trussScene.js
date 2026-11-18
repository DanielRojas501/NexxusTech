import * as THREE from 'three';
import { attachOrbit } from './simpleOrbit';
import { MAT, createStudio, createPost, hexBolt, weldMesh, ibeamGeometry } from './sceneKit';
import { createWebglRenderer } from './webgl';

const NODES = [
  { x: -3, y: 0 },
  { x: -2, y: 1.5 },
  { x: -1, y: 0 },
  { x: 0, y: 1.5 },
  { x: 1, y: 0 },
  { x: 2, y: 1.5 },
  { x: 3, y: 0 },
];
const MEMBERS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [0, 2], [2, 4], [4, 6],
  [1, 3], [3, 5],
];
const AREA_SEC = 5e-4; // m² (área del perfil)
const E_MOD = 2e11; // Pa (acero)
const EA = E_MOD * AREA_SEC;
const SIGMA_LIMIT = 150; // MPa (límite de diseño)

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
}

// Solver por equilibrio (estáticamente determinado) — se conserva por compatibilidad
export function solveTruss(loadNode, loadKilo) {
  const nU = MEMBERS.length + 3;
  const rows = 2 * NODES.length;
  const A = Array.from({ length: rows }, () => Array(nU).fill(0));
  const b = Array(rows).fill(0);
  MEMBERS.forEach(([a, c], k) => {
    const dx = NODES[c].x - NODES[a].x;
    const dy = NODES[c].y - NODES[a].y;
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    A[2 * a][k] = ux;
    A[2 * a + 1][k] = uy;
    A[2 * c][k] = -ux;
    A[2 * c + 1][k] = -uy;
  });
  const r0x = MEMBERS.length;
  const r0y = MEMBERS.length + 1;
  const r6y = MEMBERS.length + 2;
  A[0][r0x] = 1;
  A[1][r0y] = 1;
  A[13][r6y] = 1;
  b[2 * loadNode + 1] = loadKilo;
  const x = solveLinear(A, b);
  return {
    forces: x.slice(0, MEMBERS.length),
    reactions: { R0x: x[r0x], R0y: x[r0y], R6y: x[r6y] },
  };
}

// Método directo de rigideces (FEA de armadura): fuerzas + desplazamientos nodales
export function solveTrussFEA(loads, EAmod = EA) {
  const nd = NODES.length;
  const dof = 2 * nd;
  const K = Array.from({ length: dof }, () => Array(dof).fill(0));
  MEMBERS.forEach(([a, c]) => {
    const dx = NODES[c].x - NODES[a].x;
    const dy = NODES[c].y - NODES[a].y;
    const L = Math.hypot(dx, dy);
    const k = EAmod / L;
    const ux = dx / L;
    const uy = dy / L;
    const ix = 2 * a, iy = ix + 1, jx = 2 * c, jy = jx + 1;
    const put = (r, cc, v) => { K[r][cc] += v; };
    put(ix, ix, k * ux * ux); put(ix, iy, k * ux * uy);
    put(iy, ix, k * ux * uy); put(iy, iy, k * uy * uy);
    put(jx, jx, k * ux * ux); put(jx, jy, k * ux * uy);
    put(jy, jx, k * ux * uy); put(jy, jy, k * uy * uy);
    put(ix, jx, -k * ux * ux); put(ix, jy, -k * ux * uy);
    put(iy, jx, -k * ux * uy); put(iy, jy, -k * uy * uy);
    put(jx, ix, -k * ux * ux); put(jx, iy, -k * ux * uy);
    put(jy, ix, -k * ux * uy); put(jy, iy, -k * uy * uy);
  });
  const b = Array(dof).fill(0);
  loads.forEach(({ node, F }) => { b[2 * node + 1] -= F * 1000; }); // kN -> N hacia abajo
  const fixed = [0, 1, 2 * 6 + 1];
  const free = [];
  for (let d = 0; d < dof; d++) if (!fixed.includes(d)) free.push(d);
  const nf = free.length;
  const Kr = [];
  const br = [];
  for (let i = 0; i < nf; i++) {
    Kr.push(free.map((__, j) => K[free[i]][free[j]]));
    br.push(b[free[i]]);
  }
  const ur = solveLinear(Kr, br);
  const u = Array(dof).fill(0);
  free.forEach((d, i) => { u[d] = ur[i]; });
  const forces = MEMBERS.map(([a, c]) => {
    const dx = NODES[c].x - NODES[a].x;
    const dy = NODES[c].y - NODES[a].y;
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const stretch = (u[2 * c] - u[2 * a]) * ux + (u[2 * c + 1] - u[2 * a + 1]) * uy;
    return (EAmod / L) * stretch;
  });
  const reactions = { R0x: 0, R0y: 0, R6y: 0 };
  MEMBERS.forEach(([a, c], k) => {
    const dx = NODES[c].x - NODES[a].x;
    const dy = NODES[c].y - NODES[a].y;
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const N = forces[k];
    if (a === 0) { reactions.R0x -= N * ux; reactions.R0y -= N * uy; }
    if (c === 0) { reactions.R0x += N * ux; reactions.R0y += N * uy; }
    if (a === 6) reactions.R6y -= N * uy;
    if (c === 6) reactions.R6y += N * uy;
  });
  return { forces, u, reactions };
}

export function createTrussScene(mount, onTelemetry, onHover) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.Fog(0x020617, 10, 22);

  let width = mount.clientWidth || 640;
  let height = mount.clientHeight || 400;
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  const renderer = createWebglRenderer(mount);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const studio = createStudio(scene, renderer, { gridY: -0.8, envIntensity: 0.55, contactRadius: 5 });
  const post = createPost(renderer, scene, camera, { bloom: 0.3 });
  const orbit = attachOrbit(camera, renderer.domElement, { distance: 6.5, targetY: 0.7 });

  const params = { loadKilo: 20, loadNode: 2, loadType: 'puntual', mode: 'tc', exag: 10 };
  let current = { forces: MEMBERS.map(() => 0), u: Array(14).fill(0), reactions: { R0x: 0, R0y: 0, R6y: 0 } };

  const steel = MAT.acero(0x9fb0c2, { roughness: 0.22 });
  const plateMat = MAT.hierro(0x57616e);
  const weldMat = MAT.hierro(0x2f3742, { roughness: 0.85 });
  const supMat = MAT.hierro(0x475265);
  const heatMat = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.4, roughness: 0.45 });

  const pickables = [];
  const lenArr = [];

  // Nodos: grupo por nodo (capuchón + placa gusset + pernos + apoyos)
  const nodeGrps = NODES.map((n, i) => {
    const grp = new THREE.Group();
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), steel.clone());
    sphere.userData = {
      label: `Nodo ${i + 1}`,
      detail: () =>
        `(${n.x.toFixed(0)}, ${n.y.toFixed(1)})` +
        (i === 0 ? ' · Apoyo fijo (pasador)' : i === 6 ? ' · Apoyo móvil (rodillo)' : ''),
    };
    grp.add(sphere);
    pickables.push(sphere);
    if (i !== 0 && i !== 6) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.045), plateMat);
      plate.castShadow = true;
      grp.add(plate);
      [[-0.12, 0.12], [0.12, 0.12], [-0.12, -0.12], [0.12, -0.12]].forEach(([dx, dy]) => {
        const b = hexBolt(0.026, 0.02, 0.015, 0.05);
        b.rotation.x = Math.PI / 2;
        b.position.set(dx, dy, 0.03);
        grp.add(b);
      });
    }
    grp.position.set(n.x, n.y, 0);
    scene.add(grp);
    return grp;
  });
  // Apoyos fijos (no se deforman)
  const pinPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.3), supMat);
  pinPlate.position.set(NODES[0].x, NODES[0].y - 0.32, 0);
  pinPlate.castShadow = true;
  scene.add(pinPlate);
  const pinAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.36, 16), MAT.acero());
  pinAxis.rotation.x = Math.PI / 2;
  pinAxis.position.set(NODES[0].x, NODES[0].y - 0.1, 0);
  scene.add(pinAxis);
  const rollPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), supMat);
  rollPlate.position.set(NODES[6].x, NODES[6].y - 0.32, 0);
  rollPlate.castShadow = true;
  scene.add(rollPlate);
  [-0.14, 0.14].forEach((dx) => {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 16), MAT.acero());
    roller.rotation.x = Math.PI / 2;
    roller.position.set(NODES[6].x + dx, NODES[6].y - 0.42, 0);
    roller.castShadow = true;
    scene.add(roller);
  });

  // Miembros: vigas de acero tipo I con soldaduras; deformables (escala + rotación)
  const memberGrps = [];
  const memberMeshes = MEMBERS.map(([a, c], k) => {
    const p1 = NODES[a];
    const p2 = NODES[c];
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    lenArr[k] = len;
    const geo = ibeamGeometry(len, { h: 0.15, w: 0.09, tw: 0.02, tf: 0.024 });
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
    const grp = new THREE.Group();
    const beam = new THREE.Mesh(geo, heatMat);
    beam.castShadow = true;
    beam.receiveShadow = true;
    const w1 = weldMesh(0.052, 0.011);
    w1.material = weldMat;
    w1.position.z = len / 2 - 0.02;
    const w2 = weldMesh(0.052, 0.011);
    w2.material = weldMat;
    w2.position.z = -(len / 2 - 0.02);
    grp.add(beam, w1, w2);
    grp.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0);
    const dir = new THREE.Vector3(p2.x - p1.x, p2.y - p1.y, 0).normalize();
    grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    beam.userData = {
      label: `Miembro ${a + 1}–${c + 1} (perfil I)`,
      detail: () => {
        const N = current.forces[k] / 1000;
        const sigma = Math.abs(current.forces[k]) / 1000 / AREA_SEC;
        const delta = (Math.abs(current.forces[k]) * lenArr[k]) / EA * 1000;
        return `N = ${N.toFixed(2)} kN (${N >= 0 ? 'tensión' : 'compresión'}) · σ = ${sigma.toFixed(1)} MPa · δ = ${delta.toFixed(3)} mm`;
      },
    };
    scene.add(grp);
    pickables.push(beam);
    memberGrps[k] = grp;
    return beam;
  });

  // Flechas: cargas aplicadas (hasta 5) y reacciones
  const loadArrows = Array.from({ length: 5 }, () => {
    const a = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, 0xf59e0b, 0.12, 0.06);
    a.visible = false;
    scene.add(a);
    return a;
  });
  const react0 = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0x6FA37C, 0.13, 0.07);
  const react6 = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0x6FA37C, 0.13, 0.07);
  scene.add(react0, react6);

  const maxAbs = (arr) => Math.max(...arr.map(Math.abs), 1e-9);
  const ramp = (t) => new THREE.Color().setHSL(0.66 * (1 - t), 0.95, 0.38 + 0.14 * t);

  const applyLoad = () => {
    const loads =
      params.loadType === 'distribuida'
        ? [1, 2, 3, 4, 5].map((n) => ({ node: n, F: params.loadKilo / 5 }))
        : [{ node: params.loadNode, F: params.loadKilo }];
    current = solveTrussFEA(loads);

    // Coloreado por modo: tensión/compresión (azul/rojo), Von Mises o acero
    const smax = maxAbs(current.forces);
    memberMeshes.forEach((beam, k) => {
      const N = current.forces[k];
      const geo = beam.geometry;
      const pos = geo.attributes.position;
      const col = geo.attributes.color;
      const stress = Math.abs(N) / smax;
      for (let i = 0; i < pos.count; i++) {
        let c;
        if (params.mode === 'tc') c = new THREE.Color(N >= 0 ? 0x7C93AC : 0xB05064);
        else {
          const tz = (pos.getZ(i) + lenArr[k] / 2) / lenArr[k];
          c = ramp(Math.min(tz * stress, 1));
        }
        col.setXYZ(i, c.r, c.g, c.b);
      }
      col.needsUpdate = true;
      beam.material = params.mode === 'steel' ? steel : heatMat;
    });

    // Deformación exagerada: desplaza nodos y re-orienta/estira los miembros
    const EX_VIS = 100;
    const vis = (i) => {
      const dx = current.u[2 * i] * params.exag * EX_VIS;
      const dy = current.u[2 * i + 1] * params.exag * EX_VIS;
      const m = Math.hypot(dx, dy);
      const cap = m > 2.0 ? 2.0 / m : 1;
      return [dx * cap, dy * cap];
    };
    const deformed = NODES.map((n, i) => {
      const [dx, dy] = vis(i);
      return [n.x + dx, n.y + dy];
    });
    nodeGrps.forEach((grp, i) => {
      grp.position.set(deformed[i][0], deformed[i][1], 0);
    });
    MEMBERS.forEach(([a, c], k) => {
      const grp = memberGrps[k];
      const [x1, y1] = deformed[a];
      const [x2, y2] = deformed[c];
      const L2 = Math.hypot(x2 - x1, y2 - y1);
      grp.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
      grp.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(x2 - x1, y2 - y1, 0).normalize()
      );
      grp.scale.z = L2 / lenArr[k];
    });

    // Flechas de carga y reacciones
    loadArrows.forEach((arrow, i) => {
      const ld = loads[i];
      if (!ld) { arrow.visible = false; return; }
      const n = NODES[ld.node];
      arrow.position.set(n.x, n.y + 0.25, 0);
      arrow.setLength(Math.max(ld.F / 40, 0.35), 0.12, 0.06);
      arrow.visible = true;
    });
    const { R0y, R6y } = current.reactions;
    react0.position.set(NODES[0].x, NODES[0].y - 0.5, 0);
    react0.setLength(Math.max(R0y, 0) / 40000 + 0.001, 0.13, 0.07);
    react0.visible = R0y > 100;
    react6.position.set(NODES[6].x, NODES[6].y - 0.5, 0);
    react6.setLength(Math.max(R6y, 0) / 40000 + 0.001, 0.13, 0.07);
    react6.visible = R6y > 100;

    let maxDisp = 0;
    for (let i = 0; i < NODES.length; i++) maxDisp = Math.max(maxDisp, Math.hypot(current.u[2 * i], current.u[2 * i + 1]));
    onTelemetry && onTelemetry({
      maxStress: smax / 1000 / AREA_SEC,
      maxN: smax / 1000,
      R0y: R0y / 1000,
      R6y: R6y / 1000,
      loadKilo: params.loadKilo,
      maxDispMm: maxDisp * 1000,
    });
  };
  applyLoad();

  let hovered = null;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const setHover = (obj) => {
    if (hovered === obj) return;
    if (hovered && hovered.material && hovered.material.emissive) hovered.material.emissive.setHex(hovered.userData._em ?? 0x000000);
    hovered = obj;
    if (hovered && hovered.material && hovered.material.emissive) {
      hovered.userData._em = hovered.material.emissive.getHex();
      hovered.material.emissive.setHex(0x8a6f36);
    }
  };
  const emitHover = (e) => {
    if (!onHover) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(pickables, false)[0]?.object ?? null;
    setHover(hit);
    onHover(hit ? { label: hit.userData.label, detail: hit.userData.detail?.() || '', x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  };
  renderer.domElement.addEventListener('pointermove', emitHover);
  renderer.domElement.addEventListener('pointerdown', emitHover);

  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    orbit.update();
    post.render();
  }
  raf = requestAnimationFrame(frame);

  const ro = new ResizeObserver(() => {
    width = mount.clientWidth || 640;
    height = mount.clientHeight || 400;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    post.resize(width, height);
  });
  ro.observe(mount);

  return {
    setState: (patch) => {
      Object.assign(params, patch);
      applyLoad();
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      orbit.dispose();
      studio.dispose();
      post.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material && o.material.dispose) o.material.dispose();
      });
      renderer.domElement.removeEventListener('pointermove', emitHover);
      renderer.domElement.removeEventListener('pointerdown', emitHover);
      renderer.dispose();
    },
  };
}