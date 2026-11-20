// hp3d.js - the 3D headphones (procedural, three.js r170) for the noise-cancelling film.
// buildHeadphones(THREE, scene) -> { root, parts, anchors, update(t, C) }. The right ear cup explodes along its axis:
// cushion, fabric, inside (feedback) mic, speaker (driver), chip board + battery, outside mic, shell.
// Waves are glowing ribbons whose shape is computed every frame (pure function of t).
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function buildHeadphones(THREE, scene) {
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => cl((t - a) / (b - a));
  const sm = (x) => { x = cl(x); return x * x * x * (x * (x * 6 - 15) + 10); }, eo = (x) => 1 - Math.pow(1 - cl(x), 3);
  const back = (x) => { x = cl(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const M = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, roughness: 0.45, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.4 }, o));
  const mats = {
    shell: M('#d6cdbf', { roughness: 0.68, clearcoat: 0.12 }), accent: M('#ffb547', { roughness: 0.3, metalness: 0.6 }),
    leather: M('#3a3f4c', { roughness: 0.7, sheen: 1, sheenColor: new THREE.Color('#8a92a8'), sheenRoughness: 0.5 }), fabric: M('#22262f', { roughness: 0.95 }),
    metal: M('#b9c2cc', { roughness: 0.25, metalness: 1 }), dark: M('#15181e', { roughness: 0.5 }), pcb: M('#1f6b4a', { roughness: 0.6, clearcoat: 0.6 }),
    gold: M('#d9a441', { roughness: 0.25, metalness: 1 }), chip: M('#111317', { roughness: 0.35, clearcoat: 0.8 }),
    cone: M('#2b2f38', { roughness: 0.6, side: THREE.DoubleSide }), battery: M('#3a6fd8', { roughness: 0.4, clearcoat: 0.7 }),
    glowCyan: new THREE.MeshBasicMaterial({ color: new THREE.Color('#3fe0e8').multiplyScalar(2.2), toneMapped: false }),
    glowOrange: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb547').multiplyScalar(2.2), toneMapped: false }),
  };
  const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
  const mesh = (geo, mat, parent, pos = [0, 0, 0], rot = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

  const root = new THREE.Group(); scene.add(root);
  // ---------------- headband + left cup (stays whole)
  const bandCurve = new THREE.CatmullRomCurve3([[-1.05, 0.2, 0], [-1.0, 1.0, 0], [-0.55, 1.62, 0], [0, 1.8, 0], [0.55, 1.62, 0], [1.0, 1.0, 0], [1.05, 0.2, 0]].map((p) => new THREE.Vector3(...p)));
  mesh(new THREE.TubeGeometry(bandCurve, 120, 0.075, 20), mats.shell, root);
  const pad = new THREE.CatmullRomCurve3([[-0.6, 1.58, 0], [-0.3, 1.72, 0], [0, 1.75, 0], [0.3, 1.72, 0], [0.6, 1.58, 0]].map((p) => new THREE.Vector3(...p)));
  mesh(new THREE.TubeGeometry(pad, 60, 0.1, 16), mats.leather, root, [0, -0.07, 0]);
  const cupParts = (side) => {   // a cup in "cup space": axis +Y = outward, y=0 = ear face; the group is turned so +Y points to +X*side
    const g = new THREE.Group(); g.rotation.z = -side * Math.PI / 2; g.position.set(side * 1.0, 0, 0); root.add(g);
    const P = {};
    const part = (name) => { const pg = new THREE.Group(); g.add(pg); P[name] = pg; return pg; };
    mesh(lathe([[0.42, -0.14], [0.56, -0.12], [0.62, -0.04], [0.6, 0.04], [0.5, 0.06], [0.42, 0.04]]), mats.leather, part('cushion'));
    mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.02, 64), mats.fabric, part('fabric'), [0, 0.07, 0]);
    const im = part('innerMic'); mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 24), mats.metal, im, [0.18, 0.1, 0.1]); mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 24), mats.dark, im, [0.18, 0.068, 0.1]);
    const dr = part('driver');
    mesh(lathe([[0.04, 0.13], [0.14, 0.17], [0.3, 0.2], [0.34, 0.15], [0.355, 0.14]]), mats.cone, dr);
    mesh(new THREE.SphereGeometry(0.075, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mats.metal, dr, [0, 0.12, 0], [Math.PI, 0, 0]);
    mesh(new THREE.TorusGeometry(0.355, 0.022, 12, 96), mats.metal, dr, [0, 0.14, 0], [Math.PI / 2, 0, 0]);
    mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.1, 48), mats.metal, dr, [0, 0.25, 0]);
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 48), mats.dark, dr, [0, 0.2, 0]);
    const pcb = part('pcb'); mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 64), mats.pcb, pcb, [0, 0.36, 0]);
    const chip = mesh(new RoundedBoxGeometry(0.16, 0.04, 0.16, 3, 0.01), mats.chip, pcb, [0.05, 0.395, -0.04]);
    for (let i = 0; i < 6; i++) { mesh(new THREE.BoxGeometry(0.012, 0.01, 0.03), mats.gold, pcb, [0.05 - 0.06 + i * 0.024, 0.38, -0.04 + 0.1]); mesh(new THREE.BoxGeometry(0.012, 0.01, 0.03), mats.gold, pcb, [0.05 - 0.06 + i * 0.024, 0.38, -0.04 - 0.1]); }
    const chipGlow = mesh(new THREE.BoxGeometry(0.1, 0.005, 0.1), mats.glowCyan.clone(), pcb, [0.05, 0.418, -0.04]); chipGlow.castShadow = false;
    mesh(new RoundedBoxGeometry(0.18, 0.06, 0.3, 3, 0.02), mats.battery, pcb, [-0.18, 0.4, 0.05]);
    for (let i = 0; i < 9; i++) { const a = i * 0.7; mesh(new THREE.BoxGeometry(0.03, 0.012, 0.05), i % 3 ? mats.dark : mats.gold, pcb, [Math.cos(a) * 0.3, 0.385, Math.sin(a) * 0.3]); }
    const om = part('outerMic'); mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 24), mats.metal, om, [0.0, 0.47, 0.47]);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.015, 24), mats.gold, om, [0.0, 0.5, 0.47]);
    const sh = part('shell');
    mesh(lathe([[0.6, 0.02], [0.62, 0.1], [0.6, 0.3], [0.52, 0.46], [0.36, 0.56], [0.0, 0.6]]), mats.shell, sh);
    mesh(new THREE.TorusGeometry(0.61, 0.025, 12, 96), mats.accent, sh, [0, 0.06, 0], [Math.PI / 2, 0, 0]);
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 24), mats.dark, sh, [0.0, 0.5, 0.47], [0.9, 0, 0]);    // the mic hole
    const led = mesh(new THREE.SphereGeometry(0.025, 16, 8), mats.glowCyan.clone(), sh, [0.4, 0.42, -0.25]); led.castShadow = false;
    // yoke (fork to the headband)
    mesh(new THREE.TorusGeometry(0.66, 0.028, 12, 48, Math.PI), mats.metal, g, [0, 0.2, 0], [0, 0, 0]).rotation.set(0, Math.PI / 2, 0);
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 3.6, 8), new THREE.MeshBasicMaterial({ color: '#4f7db0', transparent: true, opacity: 0 })); axis.position.y = 0.3; g.add(axis);
    return { g, P, chipGlow, led, axis };
  };
  const L = cupParts(-1), R = cupParts(1);
  // explode offsets along the cup axis (cup space y) and a little sideways for readability
  const EX = { cushion: [0, -1.05, 0], fabric: [0, -0.7, 0], innerMic: [0.0, -0.4, 0.25], driver: [0, 0.0, 0], pcb: [0, 0.55, 0], outerMic: [0, 1.0, 0.35], shell: [0, 1.45, 0] };

  // ---------------- glowing wave ribbons (shape set every frame)
  function ribbon(color, n = 220, wdt = 0.035) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 2 * 3), idx = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    geo.setIndex(idx); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2.4), toneMapped: false, side: THREE.DoubleSide, transparent: true });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m);
    return { m, set(x0, x1, f, opacity = 1, z = 0) {   // f(u, x) -> y ; u = 0..1 along the ribbon
      const a = m.geometry.attributes.position.array; let px = 0, py = 0;
      for (let i = 0; i < n; i++) { const u = i / (n - 1), x = x0 + (x1 - x0) * u, y = f(u, x);
        let nx = -(y - py), ny = x - px; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (i === 0) { nx = 0; ny = 1; }
        a.set([x + nx * wdt, y + ny * wdt, z, x - nx * wdt, y - ny * wdt, z], i * 6); px = x; py = y; }
      m.geometry.attributes.position.needsUpdate = true; mat.opacity = opacity; m.visible = opacity > 0.01; } };
  }
  const waves = { noise: ribbon('#ffb547'), copy: ribbon('#ffb547'), anti: ribbon('#3fe0e8'), sum: ribbon('#f2f6fa', 220, 0.03), res: ribbon('#ff6a5a', 220, 0.025) };
  const wgroup = new THREE.Group(); scene.add(wgroup); for (const k in waves) wgroup.add(waves[k].m);
  // air "molecules" for "sound is just air": little spheres squeezed and stretched by the wave
  const AIRN = 260, air = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 10, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#cfe8ff').multiplyScalar(1.3), toneMapped: false, transparent: true }), AIRN);
  air.frustumCulled = false; scene.add(air); const dummy = new THREE.Object3D();
  // ear (a soft glowing target where the anti-noise goes)
  const ear = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 16, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff8fb1').multiplyScalar(1.5), toneMapped: false, transparent: true }));
  scene.add(ear);

  const anchors = {};   // world positions for labels (filled every update)
  const world = (obj, local = [0, 0, 0]) => obj.localToWorld(new THREE.Vector3(...local));
  function update(t, C) {
    const e = sm(seg(t, C.explode + 0.15, C.mic - 0.05)) * (1 - sm(seg(t, C.back0 - 1.0, C.back0 - 0.15)));
    root.rotation.y = -0.35 + 0.05 * Math.sin(t * 0.4); root.position.y = 0.04 * Math.sin(t * 1.1);
    R.axis.material.opacity = 0.7 * e; R.axis.scale.y = Math.max(0.01, e);
    for (const k in EX) { const o = R.P[k]; o.position.set(EX[k][0] * e, EX[k][1] * e, EX[k][2] * e); o.rotation.y = e * 0.15 * Math.sin(t * 0.6 + k.length); }
    // the speaker cone pumps while it plays
    const pump = t > C.speaker - 0.2 && t < C.cancel + 0.5 ? 0.012 * Math.sin(t * 40) : 0.002 * Math.sin(t * 20); R.P.driver.children[0].position.y = pump;
    R.chipGlow.material.color.set('#3fe0e8').multiplyScalar(1 + 3 * (t > C.chip - 0.1 && t < C.speaker ? 0.5 + 0.5 * Math.sin(t * 18) : 0.1));
    R.led.material.color.set('#3fe0e8').multiplyScalar(2 + Math.sin(t * 4));
    root.updateMatrixWorld(true);
    anchors.outerMic = world(R.P.outerMic, [0, 0.5, 0.47]); anchors.chip = world(R.P.pcb, [0.05, 0.42, -0.04]); anchors.driver = world(R.P.driver, [0, 0.1, 0]);
    anchors.innerMic = world(R.P.innerMic, [0.18, 0.1, 0.1]); anchors.cushion = world(R.P.cushion, [0.0, -0.05, -0.55]); anchors.shell = world(R.P.shell, [0.3, 0.5, 0]);
    anchors.cup = world(R.g, [0, 0.3, 0]); anchors.battery = world(R.P.pcb, [-0.18, 0.43, 0.05]);

    // ---- waves: each beat places the ribbons in a little "lab" in front of the exploded cup (world space, z toward camera)
    const om = anchors.outerMic, ch = anchors.chip, dv = anchors.driver;
    const vis = (a, b, fi = 0.25, fo = 0.25) => Math.max(0, Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b)));
    for (const k in waves) waves[k].m.visible = false; air.visible = false; ear.visible = false;
    wgroup.position.set(0, 0, 0); for (const k in waves) { waves[k].m.position.set(0, 0, 0); waves[k].m.rotation.set(0, 0, 0); }
    const sine = (A, k, w, ph = 0) => (u, x) => A * Math.sin(x * k - t * w + ph);
    // 1) the train noise arrives at the outside mic (from the left, a messy wave)
    const noiseF = (A) => (u, x) => A * (Math.sin(x * 5 - t * 9) * 0.7 + Math.sin(x * 11.3 - t * 17) * 0.3);
    if (t > C.mic - 0.3 && t < C.chip + 0.2) { const k = vis(C.mic - 0.3, C.chip + 0.2), grow = eo(seg(t, C.mic, C.listens + 0.4));
      waves.noise.set(om.x - 3.2, om.x - 3.2 + 3.15 * grow, noiseF(0.16), k, om.z); waves.noise.m.position.y = om.y; }
    // 2) sound is just air: molecules squeezed/stretched + a clean wave above
    if (t > C.air - 0.4 && t < C.chip) { const k = vis(C.air - 0.4, C.chip); air.visible = true; air.material.opacity = k;
      for (let i = 0; i < AIRN; i++) { const r = i % 4, x0 = -3.2 + (i / AIRN) * 3.1, comp = 0.08 * Math.sin(x0 * 7 - t * 8);
        dummy.position.set(om.x + x0 + comp, om.y + 0.55 + (r - 1.5) * 0.09 + 0.02 * Math.sin(i * 1.7), om.z); dummy.scale.setScalar(1); dummy.updateMatrix(); air.setMatrixAt(i, dummy.matrix); }
      air.instanceMatrix.needsUpdate = true; }
    // 3) the chip copies the wave, then flips it upside down
    if (t > C.chip - 0.3 && t < C.hill) { const k = vis(C.chip - 0.3, C.hill);
      const cp = eo(seg(t, C.copies - 0.1, C.copies + 0.5)), fl = sm(seg(t, C.flips - 0.05, C.upside + 0.35));
      waves.copy.set(-0.9, 0.9, sine(0.18, 6, 8), k * (1 - fl * 0.0)); waves.copy.m.position.set(ch.x - 0.6, ch.y + 0.55, ch.z + 0.7);
      waves.anti.set(-0.9, 0.9, sine(0.18, 6, 8), k * cp); waves.anti.m.position.set(ch.x - 0.6, ch.y + 0.55 - 0.48 * cp, ch.z + 0.7); waves.anti.m.rotation.x = Math.PI * fl;
      waves.anti.m.material.color.set(fl > 0.5 ? '#3fe0e8' : '#ffb547').multiplyScalar(1.8); }
    // 4) the speaker plays the flipped wave toward the ear (the ear is on the inside, -X)
    if (t > C.speaker - 0.3 && t < C.hill) { const k = vis(C.speaker - 0.3, C.hill), go = eo(seg(t, C.plays - 0.1, C.ear + 0.2));
      waves.anti.set(0, -2.2 * go - 0.01, (u, x) => -0.18 * Math.sin(x * 6 - t * 10) * Math.min(1, u * 4), k, 0);
      waves.anti.m.position.set(dv.x - 0.1, dv.y, dv.z + 0.05); waves.anti.m.rotation.set(0, 0, 0); waves.anti.m.material.color.set('#3fe0e8').multiplyScalar(1.8);
      ear.visible = true; ear.position.set(dv.x - 2.4, dv.y, dv.z); ear.rotation.y = Math.PI / 2; ear.material.opacity = k * eo(seg(t, C.plays, C.ear)); ear.scale.setScalar(1 + 0.08 * Math.sin(t * 6)); }
    // 5) hill meets valley -> cancel -> flat (the "lab": big, centred, facing the camera)
    const lab = [anchors.cup.x - 0.2, anchors.cup.y + 0.1, anchors.cup.z + 2.2];   // keep in sync with film.js lab()
    if (t > C.hill - 0.3 && t < C.mic2) { const k = vis(C.hill - 0.3, C.mic2), m = sm(seg(t, C.hill, C.valley + 0.4)), c = sm(seg(t, C.cancel - 0.25, C.cancel + 0.35));
      const A = 0.2, sep = 0.5 * (1 - m);
      waves.noise.set(-0.95, 0.95, sine(A, 6.5, 6), k * (1 - c), 0); waves.noise.m.position.set(lab[0], lab[1] + sep, lab[2]);
      waves.anti.set(-0.95, 0.95, sine(-A, 6.5, 6), k * (1 - c), 0); waves.anti.m.position.set(lab[0], lab[1] - sep, lab[2]); waves.anti.m.rotation.set(0, 0, 0); waves.anti.m.material.color.set('#3fe0e8').multiplyScalar(1.8);
      waves.sum.set(-0.95, 0.95, (u, x) => 0.012 * Math.sin(x * 30 - t * 30) * (1 - c), k * c, 0); waves.sum.m.material.color.set('#f2f6fa').multiplyScalar(1.2); waves.sum.m.position.set(lab[0], lab[1], lab[2]); }
    // 6) inside mic checks what's left: a small red leftover gets squashed again and again
    if (t > C.mic2 - 0.3 && t < C.steady) { const k = vis(C.mic2 - 0.3, C.steady), im = anchors.innerMic, fix = 0.5 + 0.5 * Math.cos(t * 14);
      waves.res.set(-0.45, 0.45, (u, x) => 0.07 * fix * Math.sin(x * 9 - t * 12), k, 0); waves.res.m.position.set(im.x - 0.3, im.y + 0.45, im.z + 0.3); }
    // 7) steady hum: slow wave cancels perfectly ; 8) high sharp sound: fast spiky wave, the copy lags (leftover)
    if (t > C.steady - 0.3 && t < C.cushions) { const k = vis(C.steady - 0.3, C.cushions), hi = t > C.high - 0.1, sp = hi ? 1 : 0;
      const f = hi ? (u, x) => 0.17 * Math.sign(Math.sin(x * 22 - t * 30)) * Math.pow(Math.abs(Math.sin(x * 22 - t * 30)), 0.3) : sine(0.2, 3.5, 3);
      const lag = hi ? 0.05 : 0, ok = hi ? 0 : sm(seg(t, C.steady + 0.4, C.engines));
      waves.noise.set(-0.95, 0.95, f, k, 0); waves.noise.m.position.set(lab[0], lab[1] + 0.45, lab[2]);
      waves.anti.set(-0.95, 0.95, (u, x) => -f(u, x - lag), k * (1 - ok * 0.6), 0); waves.anti.m.position.set(lab[0], lab[1] - 0.15, lab[2]); waves.anti.m.rotation.set(0, 0, 0); waves.anti.m.material.color.set('#3fe0e8').multiplyScalar(1.8);
      waves.sum.set(-0.95, 0.95, (u, x) => (f(u, x) - f(u, x - lag)) * (hi ? 1 : 0), k, 0); waves.sum.m.material.color.set(hi ? '#ff5a4a' : '#f2f6fa').multiplyScalar(hi ? 1.6 : 1.2); waves.sum.m.position.set(lab[0], lab[1] - 0.6, lab[2]); }
    // 9) cushions: sharp waves bounce off the cushion
    if (t > C.cushions - 0.3 && t < C.back0 - 0.35) { const k = vis(C.cushions - 0.3, C.back0 - 0.35), cu = anchors.cushion, bounce = ((t - C.cushions) * 1.6) % 1;
      const xin = -2.4 + 2.2 * Math.min(1, bounce * 2), xout = bounce < 0.5 ? xin : -0.2 - 2.2 * (bounce - 0.5) * 2;
      waves.noise.set(cu.x - 2.6, cu.x + (bounce < 0.5 ? xin + 0.2 : -0.2), (u, x) => 0.15 * Math.sign(Math.sin(x * 14 - t * 26)), k, 0); waves.noise.m.position.set(0, cu.y + 0.3, cu.z + 0.4);
      if (bounce >= 0.5) { waves.copy.set(cu.x - 0.3, cu.x + xout, (u, x) => 0.15 * Math.sign(Math.sin(x * 14 + t * 26)), k * (1.5 - bounce), 0); waves.copy.m.position.set(0, cu.y + 0.75, cu.z + 0.4); waves.copy.m.rotation.set(0, 0, 0); } }
  }
  return { root, R, L, anchors, update, mats };
}
