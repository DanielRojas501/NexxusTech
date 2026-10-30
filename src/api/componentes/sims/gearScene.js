import * as THREE from 'three';
import { attachOrbit } from './simpleOrbit';
import { MAT, createStudio, createPost, hexBolt, involuteGearShape, hubKeyPath } from './sceneKit';
import { createWebglRenderer } from './webgl';

const K = 0.02; // mm -> unidades de escena

function makeGearBody(Z, mScene, helixRad, mat) {
  const grp = new THREE.Group();
  const rp = (mScene * Z) / 2;
  if (Math.abs(helixRad) < 0.02) {
    // Engrane recto: un solo cuerpo con chaflán (bevel)
    const shape = involuteGearShape(Z, mScene);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -0.08;
    grp.add(mesh);
  } else {
    // Engrane helicoidal: rebanadas progresivamente giradas (hélice real)
    const n = 6;
    const d = 0.16 / n;
    for (let i = 0; i < n; i++) {
      const shape = involuteGearShape(Z, mScene);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d * 1.05, bevelEnabled: false, curveSegments: 6 });
      const mesh = new THREE.Mesh(geo, mat);
      const zc = -0.08 + i * d + (d * 1.05) / 2;
      mesh.position.z = -0.08 + i * d;
      mesh.rotation.z = (zc / rp) * Math.tan(helixRad);
      grp.add(mesh);
    }
  }
  return grp;
}

export function createGearScene(mount, onTelemetry, onHover) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.Fog(0x020617, 10, 22);

  let width = mount.clientWidth || 640;
  let height = mount.clientHeight || 400;
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  const renderer = createWebglRenderer(mount);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const studio = createStudio(scene, renderer, { gridY: -2, envIntensity: 0.55, contactRadius: 3 });
  const post = createPost(renderer, scene, camera, { bloom: 0.35 });
  const orbit = attachOrbit(camera, renderer.domElement, { distance: 5.4, targetY: 0 });

  const mat1 = MAT.acero(0x9fb2c8, { roughness: 0.18 });
  const mat2 = MAT.acero(0x8792a4, { roughness: 0.3 });
  const hubMat = MAT.hierro(0x3f4a56);
  const axleMat = MAT.acero();
  const wearMat = MAT.acero(0x2a3340, { metalness: 0.9, roughness: 0.1 });

  const params = { z1: 14, z2: 28, module: 3, rpm: 60, torque: 40, speed: 1, helix: 0 };
  const view = { playing: true, dir: 1 };

  let g1 = null;
  let g2 = null;
  let rp1 = 0;
  let rp2 = 0;
  const pickables = [];

  // Zona de contacto entre dientes (esfera pulsante + luz → bloom)
  const contact = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.4 })
  );
  scene.add(contact);
  contact.userData = {
    label: 'Zona de contacto (círculo primitivo)',
    detail: () => `Fuerza en el diente ≈ ${(params.torque / (params.module * params.z1 / 2 / 1000)).toFixed(0)} N`,
  };
  const glow = new THREE.PointLight(0xC5A059, 5, 1.6);
  scene.add(glow);

  // Flechas de dirección de rotación en cada engrane
  const arr1 = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 0.7, 0xD8B775, 0.12, 0.06);
  const arr2 = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.7, 0xB05064, 0.12, 0.06);
  scene.add(arr1, arr2);

  const disposeGroup = (g) => {
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.dispose) o.material.dispose();
    });
  };

  const buildGears = () => {
    if (g1) {
      scene.remove(g1);
      scene.remove(g2);
      disposeGroup(g1);
      disposeGroup(g2);
    }
    rp1 = ((params.module * params.z1) / 2) * K;
    rp2 = ((params.module * params.z2) / 2) * K;
    const mScene = params.module * K;
    const helix = (params.helix * Math.PI) / 180;

    const mk = (mat, Z, label, hand) => {
      const grp = new THREE.Group();
      const rpOwn = ((params.module * Z) / 2) * K;
      const body = makeGearBody(Z, mScene, helix * hand, mat.clone());
      grp.add(body);
      const rh = Math.max(rpOwn * 0.22, 0.04);
      const rh2 = rh + 0.012;
      // Buje central con chavetero
      const hubShape = new THREE.Shape();
      hubShape.absarc(0, 0, rh2, 0, Math.PI * 2, false);
      hubShape.holes.push(hubKeyPath(rh2, rh2 * 0.4, rh2 * 0.35));
      const hubGeo = new THREE.ExtrudeGeometry(hubShape, { depth: 0.24, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1 });
      const hub = new THREE.Mesh(hubGeo, hubMat.clone());
      hub.position.z = -0.12;
      grp.add(hub);
      // Eje (chaveterado)
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(rh2 * 0.7, rh2 * 0.7, 0.55, 16), axleMat.clone());
      axle.rotation.x = Math.PI / 2;
      grp.add(axle);
      // Marcas de desgaste/contacto pulido en el círculo primitivo
      [-0.088, 0.088].forEach((z) => {
        const wear = new THREE.Mesh(new THREE.TorusGeometry(rpOwn, mScene * 0.2, 8, 72), wearMat.clone());
        wear.position.z = z;
        grp.add(wear);
      });
      // Pernos de la brida del buje
      const rB = (rh2 + rpOwn * 0.55) / 2;
      if (rB > rh2 + 0.035) {
        for (let b = 0; b < 6; b++) {
          const a = (b / 6) * Math.PI * 2;
          const bolt = hexBolt(0.022, 0.016, 0.013, 0.03);
          bolt.rotation.x = Math.PI / 2;
          bolt.position.set(Math.cos(a) * rB, Math.sin(a) * rB, 0.088);
          grp.add(bolt);
        }
      }
      grp.userData = { label };
      return grp;
    };
    g1 = mk(mat1, params.z1, 'Engrane 1 · entrada (motriz)', 1);
    g2 = mk(mat2, params.z2, 'Engrane 2 · salida (conducido)', -1);
    g1.userData.detail = () => `Z₁ = ${params.z1} dientes · ω₁ = ${params.rpm} RPM · T₁ = ${params.torque} N·m · perfil evolvente 20°`;
    g2.userData.detail = () => `Z₂ = ${params.z2} dientes · ω₂ = ${((params.rpm * params.z1) / params.z2).toFixed(1)} RPM · T₂ = ${((params.torque * params.z2) / params.z1).toFixed(1)} N·m`;
    g1.position.set(-rp1, 0, 0);
    g2.position.set(rp2, 0, 0);
    g1.traverse((o) => (o.castShadow = true));
    g2.traverse((o) => (o.castShadow = true));

    const lift = params.module * K + 0.16;
    arr1.position.set(-rp1, rp1 + lift, 0);
    arr2.position.set(rp2, rp2 + lift, 0);

    scene.add(g1, g2);
    pickables.length = 0;
    pickables.push(g1, g2, contact);
  };
  buildGears();

  let hovered = null;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const setHover = (mesh) => {
    if (hovered === mesh) return;
    if (hovered && hovered.material && hovered.material.emissive) hovered.material.emissive.setHex(hovered.userData._em ?? 0x000000);
    hovered = mesh;
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
    const hit = raycaster.intersectObjects(pickables, true)[0];
    let withLabel = hit?.object;
    while (withLabel && !withLabel.userData?.label) withLabel = withLabel.parent;
    const mesh = hit?.object?.material?.emissive ? hit.object : null;
    setHover(mesh);
    onHover(withLabel ? { label: withLabel.userData.label, detail: withLabel.userData.detail?.() || '', x: e.clientX - rect.left, y: e.clientY - rect.top } : null);
  };
  renderer.domElement.addEventListener('pointermove', emitHover);
  renderer.domElement.addEventListener('pointerdown', emitHover);

  let theta = 0;
  let raf = 0;
  let last = performance.now();
  let teleAt = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const omega = (((params.rpm * 2 * Math.PI) / 60) * params.speed) * (view.dir ?? 1);
    if (view.playing) theta += omega * dt;

    // Engrane de diente a diente: sentidos opuestos, relación Z1/Z2
    const off1 = Math.PI / params.z1;
    const off2 = params.z2 % 2 === 0 ? 0 : Math.PI / params.z2;
    g1.rotation.z = off1 + theta;
    g2.rotation.z = off2 - theta * (params.z1 / params.z2);

    const pulse = 1 + 0.25 * Math.sin(now * 0.012);
    contact.scale.setScalar(pulse);
    glow.intensity = 4 + 2 * Math.sin(now * 0.012);

    orbit.update();
    post.render();

    if (now - teleAt > 120) {
      teleAt = now;
      const i = params.z2 / params.z1;
      const rpmOut = params.rpm * (params.z1 / params.z2);
      const torqueOut = params.torque * (params.z2 / params.z1);
      const rp1m = ((params.module * params.z1) / 2) / 1000;
      onTelemetry({
        i,
        rpmOut,
        torqueOut,
        contactForce: params.torque / rp1m,
        a_mm: (params.module * (params.z1 + params.z2)) / 2,
        interference: params.z1 < 17,
        power_kW: (params.torque * Math.abs(omega)) / 1000,
        phase: (((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI),
      });
    }
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
      const rebuild = patch.z1 !== undefined || patch.z2 !== undefined || patch.module !== undefined || patch.helix !== undefined;
      Object.assign(params, patch);
      if (rebuild) buildGears();
    },
    setView: (patch) => {
      Object.assign(view, patch);
    },
    step: () => {
      if (!view.playing) theta += (Math.PI / 12) * (view.dir ?? 1);
    },
    setPhase: (t) => {
      theta = (((t % 1) + 1) % 1) * 2 * Math.PI;
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