import * as THREE from 'three';
import { attachOrbit } from './simpleOrbit';
import { MAT, createStudio, createPost, hexBolt, createParticles } from './sceneKit';
import { createWebglRenderer } from './webgl';

const S = 6; // metros -> unidades de escena
const BORE = 0.09; // m (diámetro del cilindro)
const PISTON_MASS = 0.35; // kg
const AREA = (Math.PI * BORE * BORE) / 4; // m^2

const pistonY = (th, r, L) =>
  r * Math.cos(th) + Math.sqrt(Math.max(L * L - r * r * Math.sin(th) ** 2, 1e-9));

export function createEngineScene(mount, onTelemetry, onHover) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);
  scene.fog = new THREE.Fog(0x020617, 10, 22);

  let width = mount.clientWidth || 640;
  let height = mount.clientHeight || 400;
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
  const renderer = createWebglRenderer(mount);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const studio = createStudio(scene, renderer, { gridY: -1.3, envIntensity: 0.55, contactRadius: 2.6 });
  const post = createPost(renderer, scene, camera, { bloom: 0.35 });
  const orbit = attachOrbit(camera, renderer.domElement, { distance: 5.2, targetY: 0.4 });

  // --- Materiales PBR industriales ---
  const steel = MAT.acero();
  const steelDark = MAT.acero(0x66717f, { roughness: 0.35 });
  const alu = MAT.aluminio();
  const ringMat = MAT.acero(0x3c4654, { roughness: 0.5 });
  const headMat = MAT.hierro(0x57616e);
  headMat.transparent = true;
  headMat.opacity = 0.95;
  const sumpMat = MAT.hierro(0x4a5460);
  sumpMat.transparent = true;
  sumpMat.opacity = 0.95;
  const glassLiner = new THREE.MeshStandardMaterial({
    color: 0x8fd7e8, metalness: 0.9, roughness: 0.15,
    transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false,
  });
  const jacketMat = MAT.hierro(0x6b7683);
  jacketMat.transparent = true;
  jacketMat.opacity = 0.32;
  jacketMat.side = THREE.DoubleSide;
  jacketMat.depthWrite = false;

  const params = { rpm: 300, stroke_mm: 90, rod_mm: 160, pressure_bar: 6, speed: 1 };
  const view = { playing: true, xray: false, exploded: false, dir: 1 };
  let theta = 0;
  let lastVel = 0;
  let lastAcc = 0;
  let lastTorque = 0;
  let lastFRod = 0;
  let blockBot = 0;
  let blockTop = 1;

  // --- Flujos de gas (líneas de corriente) dentro del cilindro ---
  const FLOW_N = 60;
  const flow = createParticles(FLOW_N, { color: 0xC5A059, size: 0.035, opacity: 0.4 });
  scene.add(flow);
  const flowData = Array.from({ length: FLOW_N }, () => ({
    a: Math.random() * Math.PI * 2,
    r: 0.1 + Math.random() * 0.14,
    y: Math.random(),
    v: 0.35 + Math.random() * 0.4,
  }));

  // --- Vectores: inercia (rosa), aceleración (cian), torque (violeta) ---
  const arrInertia = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, 0xB05064, 0.15, 0.07);
  const arrAccel = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, 0xD8B775, 0.15, 0.07);
  const arrTorque = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 1, 0x987836, 0.15, 0.07);
  scene.add(arrInertia, arrAccel, arrTorque);
  const setArrow = (arrow, origin, dir, len) => {
    arrow.position.copy(origin);
    arrow.setDirection(dir);
    arrow.setLength(Math.max(len, 0.12), 0.15, 0.07);
  };

  // --- Cigüeñal: contrapesos redondeados, conductos de lubricación ---
  const crank = new THREE.Group();
  scene.add(crank);
  const buildCrank = (r) => {
    crank.traverse((o) => o.geometry?.dispose());
    crank.clear();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * S, 0.05 * S, 1.6 * S, 24), steel.clone());
    shaft.rotation.x = Math.PI / 2;
    const oil = new THREE.Mesh(new THREE.CylinderGeometry(0.013 * S, 0.013 * S, 1.62 * S, 10), ringMat.clone());
    oil.rotation.x = Math.PI / 2;
    [-1, 1].forEach((side) => {
      // contrapeso redondeado (perfil extruido con curvas)
      const R = Math.max(0.15 * S * (r / 0.045), 0.12 * S);
      const a = 0.05 * S;
      const wShape = new THREE.Shape();
      wShape.moveTo(-a, -0.06 * S);
      wShape.lineTo(a, -0.06 * S);
      wShape.lineTo(a, R * 0.3);
      wShape.quadraticCurveTo(a, R, 0, R);
      wShape.quadraticCurveTo(-a, R, -a, R * 0.3);
      wShape.lineTo(-a, -0.06 * S);
      const cw = new THREE.Mesh(
        new THREE.ExtrudeGeometry(wShape, { depth: 0.07 * S, bevelEnabled: true, bevelThickness: 0.01 * S, bevelSize: 0.01 * S, bevelSegments: 2 }),
        steelDark.clone()
      );
      cw.rotation.z = Math.PI / 2; // lóbulo hacia −x (opuesto a la muñequilla)
      cw.position.set(-0.55 * r * S, 0, side * 0.13 * S);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.05 * r * S, 0.15 * S, 0.07 * S), steelDark.clone());
      arm.position.set(0.45 * r * S, 0, side * 0.13 * S);
      crank.add(cw, arm);
      cw.userData = { label: 'Contrapeso', detail: () => 'Compensa la fuerza de inercia del pistón para equilibrar el cigüeñal' };
      arm.userData = { label: 'Brazo de manivela', detail: () => `Radio de manivela r = ${(params.stroke_mm / 2).toFixed(0)} mm (carrera/2)` };
    });
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * S, 0.045 * S, 0.34 * S, 20), steel.clone());
    pin.rotation.x = Math.PI / 2;
    pin.position.set(r * S, 0, 0);
    crank.add(shaft, oil, pin);
    shaft.userData = { label: 'Cigüeñal', detail: () => `Torque instantáneo ≈ ${lastTorque.toFixed(1)} N·m · ω = ${(((params.rpm * 2 * Math.PI) / 60) * params.speed).toFixed(1)} rad/s` };
    oil.userData = { label: 'Conducto de lubricación', detail: () => 'Taladro central que alimenta la muñequilla con aceite a presión' };
    pin.userData = { label: 'Muñequilla (pasador de biela)', detail: () => `Torque ≈ ${lastTorque.toFixed(1)} N·m` };
  };

  // --- Pistón: corona, anillos de compresión, falda y pasador ---
  const piston = new THREE.Group();
  const crown = new THREE.Mesh(new THREE.CylinderGeometry((BORE / 2) * S * 0.98, (BORE / 2) * S * 0.98, 0.3 * S, 32), alu.clone());
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry((BORE / 2) * S * 0.99, 0.011 * S, 10, 36), ringMat.clone());
  ring1.rotation.x = Math.PI / 2;
  ring1.position.y = 0.1 * S;
  const ring2 = ring1.clone();
  ring2.position.y = 0.055 * S;
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry((BORE / 2) * S * 0.96, (BORE / 2) * S * 0.96, 0.14 * S, 32, 1, true), alu.clone());
  skirt.position.y = -0.19 * S;
  const wpin = new THREE.Mesh(new THREE.CylinderGeometry(0.035 * S, 0.035 * S, 0.2 * S, 16), steel.clone());
  wpin.rotation.x = Math.PI / 2;
  wpin.position.y = -0.16 * S;
  piston.add(crown, ring1, ring2, skirt, wpin);
  scene.add(piston);
  piston.userData = { label: 'Pistón', detail: () => `v = ${lastVel.toFixed(2)} m/s · a = ${lastAcc.toFixed(0)} m/s² · m = ${PISTON_MASS} kg · aluminio forjado` };
  ring1.userData = { label: 'Anillo de compresión', detail: () => 'Sella la cámara contra la pared del cilindro' };
  ring2.userData = { label: 'Anillo de aceite', detail: () => 'Raspa el exceso de lubricante de la camisa' };
  crown.userData = { label: 'Corona del pistón', detail: () => `Recibe la presión de gas (${params.pressure_bar} bar)` };
  skirt.userData = { label: 'Falda del pistón', detail: () => 'Guía el pistón dentro de la camisa' };
  wpin.userData = { label: 'Pasador del pistón', detail: () => 'Articulación biela-pistón (movimiento plano)' };

  // Marcador de articulación (pasador)
  const pinMark = new THREE.Mesh(
    new THREE.SphereGeometry(0.05 * S, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xC5A059, emissive: 0xC5A059, emissiveIntensity: 0.6, transparent: true, opacity: 0.55, depthWrite: false })
  );
  scene.add(pinMark);
  pinMark.userData = { label: 'Pasador del pistón', detail: () => 'Articulación biela-pistón (movimiento plano)' };

  // --- Biela: viga con ojos forjados, pernos del pie de biela ---
  const rod = new THREE.Group();
  const rodShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026 * S, 0.036 * S, 1, 12), steel.clone());
  const rodBig = new THREE.Mesh(new THREE.TorusGeometry(0.055 * S, 0.028 * S, 12, 28), steel.clone());
  const rodSmall = new THREE.Mesh(new THREE.TorusGeometry(0.036 * S, 0.02 * S, 10, 22), steel.clone());
  rodSmall.position.y = 1;
  const rodBolt1 = hexBolt(0.028 * S, 0.022 * S, 0.017 * S, 0.05 * S);
  rodBolt1.position.set(0.075 * S, 0, 0);
  const rodBolt2 = hexBolt(0.028 * S, 0.022 * S, 0.017 * S, 0.05 * S);
  rodBolt2.position.set(-0.075 * S, 0, 0);
  rod.add(rodShaft, rodBig, rodSmall, rodBolt1, rodBolt2);
  scene.add(rod);
  rod.userData = { label: 'Biela', detail: () => `Fuerza axial ≈ ${lastFRod.toFixed(0)} N · L = ${params.rod_mm} mm` };
  rodBig.userData = { label: 'Pie de biela', detail: () => 'Cojinete de casquillo sobre la muñequilla' };
  rodSmall.userData = { label: 'Cabeza de biela', detail: () => 'Articulación con el pasador del pistón' };
  rodBolt1.userData = rodBolt2.userData = { label: 'Pernos del pie de biela', detail: () => 'Apriete de la tapa del cojinete' };

  // --- Destello de combustión (bloom) ---
  const comb = new THREE.Mesh(
    new THREE.SphereGeometry(0.15 * S, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff7a1a, emissiveIntensity: 0, transparent: true, opacity: 0.45, depthWrite: false })
  );
  scene.add(comb);

  // --- Bloque con vista de corte (cutaway): camisa, chaqueta, culata, cárter ---
  let blockGroup = null;
  const buildBlock = (r, L) => {
    if (blockGroup) {
      blockGroup.traverse((o) => o.geometry?.dispose());
      scene.remove(blockGroup);
    }
    blockGroup = new THREE.Group();
    const yMin = (L - r) * S - 0.16 * S;
    const yMax = (L + r) * S + 0.4 * S;
    const h = yMax - yMin;
    blockBot = yMin;
    blockTop = yMax;

    const liner = new THREE.Mesh(new THREE.CylinderGeometry((BORE / 2) * S * 1.06, (BORE / 2) * S * 1.06, h * 0.96, 32, 1, true), glassLiner);
    liner.position.y = yMin + h / 2;
    const jacket = new THREE.Mesh(
      new THREE.CylinderGeometry((BORE / 2) * S * 1.5, (BORE / 2) * S * 1.55, h * 0.92, 28, 1, true, 0.55, Math.PI * 2 - 1.1),
      jacketMat
    );
    jacket.position.y = yMin + h / 2;
    for (let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(new THREE.TorusGeometry((BORE / 2) * S * 1.62, 0.014 * S, 8, 40), jacketMat);
      fin.rotation.x = Math.PI / 2;
      fin.position.y = yMin + h * (0.28 + i * 0.18);
      blockGroup.add(fin);
    }
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.0 * S, 0.22 * S, 0.7 * S), headMat);
    head.position.y = yMax + 0.1 * S;
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry((BORE / 2) * S * 1.12, (BORE / 2) * S * 1.12, 0.06 * S, 24), ringMat.clone());
    chamber.position.y = yMax - 0.02 * S;
    const sump = new THREE.Mesh(new THREE.BoxGeometry(0.95 * S, 0.3 * S, 0.7 * S), sumpMat);
    sump.position.y = yMin - 0.22 * S;
    blockGroup.add(liner, jacket, head, chamber, sump);
    [-0.32, 0.32].forEach((dx) =>
      [-0.2, 0.2].forEach((dz) => {
        const b = hexBolt(0.035 * S, 0.03 * S, 0.02 * S, 0.06 * S);
        b.position.set(dx * S, yMax + 0.21 * S, dz * S);
        blockGroup.add(b);
      })
    );
    liner.userData = { label: 'Camisa del cilindro', detail: () => `Ø émbolo = ${(BORE * 1000).toFixed(0)} mm` };
    jacket.userData = { label: 'Bloque de fundición (vista de corte)', detail: () => `Presión = ${params.pressure_bar} bar · Carrera = ${params.stroke_mm} mm · fundición gris` };
    head.userData = { label: 'Culata', detail: () => 'Aloja la cámara de combustión; pernos de apriete hexagonales' };
    chamber.userData = { label: 'Cámara de combustión', detail: () => `Presión de gas = ${params.pressure_bar} bar` };
    sump.userData = { label: 'Cárter', detail: () => 'Depósito de aceite del cárter húmedo' };
    scene.add(blockGroup);
    comb.position.set(0, yMax - 0.06 * S, 0);
  };

  const pickables = [];
  const applyParams = () => {
    const r = params.stroke_mm / 2000;
    const L = params.rod_mm / 1000;
    buildCrank(r);
    buildBlock(r, L);
    pickables.length = 0;
    pickables.push(piston, pinMark, rod, blockGroup, crank);
  };
  applyParams();

  let hovered = null;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const setHover = (obj) => {
    if (hovered === obj) return;
    if (hovered && hovered.material && hovered.material.emissive) hovered.material.emissive.setHex(hovered.userData._em ?? 0x000000);
    hovered = obj;
    if (hovered && hovered.material && hovered.material.emissive) {
      hovered.userData._em = hovered.material.emissive.getHex();
      hovered.material.emissive.setHex(0x0e7490);
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

  let raf = 0;
  let last = performance.now();
  let teleAt = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    const r = params.stroke_mm / 2000;
    const L = params.rod_mm / 1000;
    const omega = (((params.rpm * 2 * Math.PI) / 60) * params.speed) * (view.dir ?? 1);
    if (view.playing) theta += omega * dt;

    // Cinemática del mecanismo biela-manivela (diferencias finitas)
    const y = pistonY(theta, r, L);
    const h = 1e-4;
    const y1 = pistonY(theta + h, r, L);
    const y0 = pistonY(theta - h, r, L);
    const dy = (y1 - y0) / (2 * h);
    const d2 = (y1 - 2 * y + y0) / (h * h);
    const vel = dy * omega;
    const acc = d2 * omega * omega;

    // Fuerzas: gas, biela, torque al cigüeñal e inercia del pistón
    const phi = Math.asin(Math.min((r * Math.sin(theta)) / L, 0.999));
    const fGas = params.pressure_bar * 1e5 * AREA;
    const fRod = fGas / Math.max(Math.cos(phi), 0.15);
    const torque = fRod * r * Math.sin(theta + phi);
    const fInertia = PISTON_MASS * acc;
    lastVel = vel;
    lastAcc = acc;
    lastTorque = torque;
    lastFRod = fRod;

    const gap = view.exploded ? 0.85 * S : 0;
    const pinPos = new THREE.Vector3(0, y * S + gap, 0);
    const crankPos = new THREE.Vector3(r * S * Math.cos(theta), r * S * Math.sin(theta), 0);

    crank.rotation.z = theta;
    piston.position.set(0, y * S + 0.16 * S + gap, 0);
    pinMark.position.copy(pinPos);

    const rodEnd = view.exploded ? new THREE.Vector3(0, y * S, 0) : pinPos;
    const dir = rodEnd.clone().sub(crankPos);
    rod.position.copy(crankPos);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    rodShaft.scale.y = dir.length();
    rodShaft.position.y = dir.length() / 2;
    rodSmall.position.y = dir.length();

    // X-Ray: translucidez ajustada de la carcasa
    jacketMat.opacity = view.xray ? 0.06 : 0.32;
    glassLiner.opacity = view.xray ? 0.15 : 0.55;
    headMat.opacity = view.xray ? 0.12 : 0.95;
    sumpMat.opacity = view.xray ? 0.12 : 0.95;

    // Destello de combustión cerca del PMS
    const tdc = Math.max(0, 1 - (y - (L - r)) / (2 * r));
    comb.material.emissiveIntensity = 3.0 * (params.pressure_bar / 30) * tdc * (view.playing ? 1 : 0.4);

    // Flujo de gas (líneas de corriente dentro del cilindro)
    const posAttr = flow.geometry.attributes.position;
    for (let i = 0; i < FLOW_N; i++) {
      const p = flowData[i];
      p.y += p.v * dt * (view.playing ? 1 : 0.15);
      if (p.y > 1) p.y -= 1;
      const yy = blockBot + p.y * (blockTop - blockBot);
      const ang = p.a + theta * 1.5;
      posAttr.setXYZ(i, Math.cos(ang) * p.r, yy, Math.sin(ang) * p.r);
    }
    posAttr.needsUpdate = true;
    flow.material.opacity = view.xray ? 0.15 : 0.4;

    const accSign = Math.sign(acc) || 1;
    setArrow(arrAccel, pinPos.clone().add(new THREE.Vector3(0.22 * S, 0, 0)), new THREE.Vector3(0, accSign, 0), Math.min(Math.abs(acc) / 400, 1.3) + 0.15);
    setArrow(arrInertia, pinPos.clone().add(new THREE.Vector3(-0.22 * S, 0, 0)), new THREE.Vector3(0, -accSign, 0), Math.min(Math.abs(fInertia) / 700, 1.3) + 0.15);
    setArrow(arrTorque, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, Math.sign(torque) || 1), Math.min(Math.abs(torque) / 60, 1.4) + 0.15);

    orbit.update();
    post.render();

    if (now - teleAt > 120) {
      teleAt = now;
      onTelemetry({
        omega,
        y_mm: y * 1000,
        vel,
        acc,
        fGas,
        fInertia,
        torque,
        fRod,
        power_kW: Math.abs(torque * omega) / 1000,
        rpmEff: (Math.abs(omega) * 60) / (2 * Math.PI),
        phase: (((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI),
        overload: params.pressure_bar >= 22 && params.rpm >= 1800,
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
      Object.assign(params, patch);
      applyParams();
    },
    setView: (patch) => {
      Object.assign(view, patch);
    },
    step: () => {
      if (!view.playing) theta += (Math.PI / 12) * (view.dir ?? 1);
    },
    setPhase: (t) => {
      theta = ((((t % 1) + 1) % 1) * 2 * Math.PI);
    },
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      orbit.dispose();
      studio.dispose();
      post.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material && o.material.dispose && !o.material._shared) o.material.dispose();
      });
      renderer.domElement.removeEventListener('pointermove', emitHover);
      renderer.domElement.removeEventListener('pointerdown', emitHover);
      renderer.dispose();
    },
  };
}