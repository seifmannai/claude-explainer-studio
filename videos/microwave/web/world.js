// Microwave Short: the kitchen world + every prop the story adds. Units: metres. Counter top at y = 0.9.
// Look: soft "premium toy" PBR (rounded forms, light clearcoat, no metal except the oven), warm lamp vs cool night.
import { THREE, rbox, rcyl, lathe, hash } from '../../../kit/explainer3d/core.js';

export const mat = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.45, ...o });
export const glow = (c, k = 1, o = {}) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false, ...o });
export function add(p, geo, m, pos = [0, 0, 0], rot = [0, 0, 0], shadow = true) {
  const x = new THREE.Mesh(geo, m); x.position.set(...pos); x.rotation.set(...rot); x.castShadow = x.receiveShadow = shadow; p.add(x); return x;
}
const grp = (p, pos = [0, 0, 0]) => { const g = new THREE.Group(); g.position.set(...pos); p.add(g); return g; };
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8; return t;
}

// ---------- painted textures ----------
const TEX = {
  tiles: canvasTex(512, 512, (g, w) => { g.fillStyle = '#c9b89e'; g.fillRect(0, 0, w, w); const n = 4, s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = hash(i * 7 + j * 13) * 14; g.fillStyle = `rgb(${244 - v},${238 - v},${226 - v})`; g.fillRect(i * s + 5, j * s + 5, s - 10, s - 10); } }, { repeat: [5, 1] }),
  floor: canvasTex(512, 512, (g, w) => { const s = w / 2; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#3f5e73' : '#e8dcc6'; g.fillRect(i * s, j * s, s, s); } }, { repeat: [8, 6] }),
  wood: canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#b07a4a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(90,52,25,${0.15 + hash(i) * 0.2})`; g.lineWidth = 1 + hash(i + 3) * 3; g.beginPath(); const y = hash(i + 9) * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 8, w * 0.6, y - 8, w, y + 3); g.stroke(); } }),
  city: canvasTex(1024, 1024, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#0b1433'); sky.addColorStop(0.7, '#1d2f5c'); sky.addColorStop(1, '#3b4f7c'); g.fillStyle = sky; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; g.fillRect(hash(i + 1) * w, hash(i + 2) * h * 0.55, 2, 2); }
    g.fillStyle = '#fff6d8'; g.shadowColor = '#fff3c4'; g.shadowBlur = 50; g.beginPath(); g.arc(w * 0.72, h * 0.2, 60, 0, 7); g.fill(); g.shadowBlur = 0;
    let x = 0; for (let i = 0; x < w; i++) { const bw = 70 + hash(i + 40) * 120, bh = 220 + hash(i + 70) * 420; g.fillStyle = i % 2 ? '#141d38' : '#18233f'; g.fillRect(x, h - bh, bw, bh);
      for (let yy = h - bh + 20; yy < h - 10; yy += 34) for (let xx = x + 12; xx < x + bw - 16; xx += 26) if (hash(xx * 0.37 + yy * 0.11) > 0.55) { g.fillStyle = hash(xx + yy) > 0.5 ? '#ffd27a' : '#ffe9b0'; g.fillRect(xx, yy, 12, 16); }
      x += bw + 6; }
  }),
  pizza: canvasTex(1024, 1024, (g, w) => {
    const c = w / 2; g.fillStyle = '#d99a4e'; g.beginPath(); g.arc(c, c, c - 4, 0, 7); g.fill();
    g.fillStyle = '#c0392b'; g.beginPath(); g.arc(c, c, c * 0.86, 0, 7); g.fill();
    g.fillStyle = '#ffd36b'; g.beginPath(); for (let a = 0; a < 6.3; a += 0.05) { const r = c * (0.8 + 0.04 * Math.sin(a * 9) + 0.02 * Math.sin(a * 23)); g.lineTo(c + r * Math.cos(a), c + r * Math.sin(a)); } g.fill();
    for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,${200 + hash(i) * 40},${110 + hash(i + 1) * 50},0.6)`; g.beginPath(); g.arc(c + (hash(i + 2) - 0.5) * c * 1.5, c + (hash(i + 3) - 0.5) * c * 1.5, 6 + hash(i + 4) * 16, 0, 7); g.fill(); }
    const pep = [[0.3, 0.35], [0.62, 0.3], [0.45, 0.55], [0.7, 0.62], [0.3, 0.68], [0.52, 0.78], [0.18, 0.5], [0.8, 0.45]];
    for (const [px, py] of pep) { g.fillStyle = '#a3241a'; g.beginPath(); g.arc(px * w, py * w, 56, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.arc(px * w - 14, py * w - 14, 18, 0, 7); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = '#3f7d2c'; g.beginPath(); g.ellipse(c + (hash(i + 90) - 0.5) * c * 1.3, c + (hash(i + 91) - 0.5) * c * 1.3, 10, 5, hash(i) * 3, 0, 7); g.fill(); }
  }),
  frost: canvasTex(1024, 1024, (g, w) => { const c = w / 2; g.clearRect(0, 0, w, w); g.save(); g.beginPath(); g.arc(c, c, c - 2, 0, 7); g.clip();
    g.fillStyle = 'rgba(214,236,255,0.78)'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 900; i++) { g.strokeStyle = `rgba(255,255,255,${0.3 + hash(i) * 0.6})`; g.lineWidth = 1 + hash(i + 5) * 2; const x = hash(i + 1) * w, y = hash(i + 2) * w, a = hash(i + 3) * 6.3, l = 6 + hash(i + 4) * 26; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l * Math.cos(a), y + l * Math.sin(a)); g.stroke(); }
    g.restore(); }),
  // hot/cold spot pattern of a standing wave: checkerboard of blobs ~6 cm apart (pizza is 26 cm)
  spots: canvasTex(1024, 1024, (g, w) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, w); const n = 4.3;
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) { const x = (i + 0.3) * w / n, y = (j + 0.25) * w / n, r = w / n * 0.62; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, { srgb: false }),
  coldSpots: canvasTex(1024, 1024, (g, w) => { g.clearRect(0, 0, w, w); const n = 4.3; g.save(); g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 2, 0, 7); g.clip();
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 1) { const x = (i + 0.3) * w / n, y = (j + 0.25) * w / n, r = w / n * 0.55; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(205,232,255,0.95)'); gr.addColorStop(1, 'rgba(205,232,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.restore(); }),
  // door net: dark mesh with small round holes (alpha)
  net: canvasTex(256, 256, (g, w) => { g.fillStyle = '#1b2230'; g.fillRect(0, 0, w, w); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc((i + 0.5) * w / 8 + (j % 2) * w / 16, (j + 0.5) * w / 8, w / 8 * 0.36, 0, 7); g.fill(); } }, { repeat: [14, 8] }),
};

// ---------- a little cartoon cat (rounded vinyl toy) ----------
function makeCat(p) {
  const root = grp(p), body = grp(root), m = mat('#f2a65a'), m2 = mat('#fff3e2'), dark = mat('#2a1d18', { clearcoat: 0.8 });
  add(body, new THREE.SphereGeometry(0.11, 48, 32), m, [0, 0.08, 0]).scale.set(1.35, 0.75, 1);
  const head = grp(body, [0.13, 0.12, 0.02]);
  add(head, new THREE.SphereGeometry(0.075, 48, 32), m);
  add(head, new THREE.SphereGeometry(0.05, 32, 24), m2, [0.03, -0.025, 0.035]).scale.set(1, 0.7, 0.8);
  for (const s of [-1, 1]) { add(head, new THREE.ConeGeometry(0.03, 0.06, 24), m, [0.0, 0.07, s * 0.04], [s * 0.35, 0, 0]);
    const eye = add(head, new THREE.CapsuleGeometry(0.004, 0.012, 4, 8), dark, [0.06, 0.012, s * 0.03], [0, 0, Math.PI / 2]); eye.name = 'eye' + s; }
  const tail = add(body, new THREE.TorusGeometry(0.08, 0.018, 16, 48, Math.PI * 1.1), m, [-0.13, 0.05, 0.02], [Math.PI / 2, 0, 0.6]);
  const fur = []; // spikes that pop out when the waves hit (fur puff)
  for (let i = 0; i < 40; i++) { const a = hash(i) * Math.PI * 2, b = hash(i + 50) * Math.PI * 0.6; const s = add(body, new THREE.ConeGeometry(0.018, 0.07, 10), m,
      [0.14 * Math.cos(a) * Math.sin(b + 0.6), 0.08 + 0.08 * Math.cos(b), 0.11 * Math.sin(a) * Math.sin(b + 0.6)]); s.lookAt(new THREE.Vector3(0, 0.08, 0)); s.rotateX(-Math.PI / 2); s.scale.setScalar(0.001); fur.push(s); }
  return { root, body, head, tail, fur };
}

// ---------- retro radio ----------
function makeRadio(p) {
  const root = grp(p);
  add(root, rbox(0.26, 0.16, 0.1, 0.03), mat('#c94f3d'), [0, 0.08, 0]);
  add(root, rbox(0.12, 0.1, 0.01, 0.01), mat('#e9dcc2'), [-0.05, 0.08, 0.051]);
  for (let i = 0; i < 4; i++) add(root, new THREE.BoxGeometry(0.1, 0.006, 0.004), mat('#6b4a3a'), [-0.05, 0.05 + i * 0.022, 0.057]);
  const dial = add(root, rcyl(0.025, 0.015, 0.005, 32), mat('#f2e6cf'), [0.07, 0.08, 0.055], [Math.PI / 2, 0, 0]);
  const ant = add(root, new THREE.CylinderGeometry(0.003, 0.003, 0.22, 8), mat('#cfd6df', { metalness: 0.8, roughness: 0.3 }), [0.08, 0.26, -0.02], [0, 0, -0.35]);
  return { root, dial, ant };
}

// ---------- phone with a live screen ----------
function makePhone(p) {
  const root = grp(p), cv = document.createElement('canvas'); cv.width = 360; cv.height = 720;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  add(root, rbox(0.075, 0.15, 0.009, 0.008), mat('#22262e', { roughness: 0.3, clearcoat: 1 }), [0, 0.075, 0]);
  const scr = add(root, new THREE.PlaneGeometry(0.068, 0.138), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }), [0, 0.075, 0.0047], [0, 0, 0], false);
  // stand
  add(root, rbox(0.06, 0.012, 0.05, 0.004), mat('#8fb3c4'), [0, 0.006, -0.012]);
  root.rotation.x = -0.18;
  /** k = buffering amount 0..1, t = time */
  const draw = (t, k) => { const g = cv.getContext('2d'); g.fillStyle = '#0d0f14'; g.fillRect(0, 0, 360, 720);
    const gr = g.createLinearGradient(0, 120, 0, 520); gr.addColorStop(0, '#ff7a59'); gr.addColorStop(1, '#7b4dff'); g.fillStyle = gr; g.fillRect(0, 160, 360, 300);
    g.fillStyle = 'rgba(0,0,0,' + (0.55 * k) + ')'; g.fillRect(0, 160, 360, 300);
    if (k > 0.02) { g.save(); g.translate(180, 310); g.globalAlpha = k; for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.fillStyle = `rgba(255,255,255,${((i + Math.floor(t * 14)) % 12) / 12})`; g.fillRect(-5, -44, 10, 22); } g.restore(); }
    g.fillStyle = '#2d313b'; g.fillRect(24, 480, 312, 10); g.fillStyle = '#ff3b4f'; g.fillRect(24, 480, 312 * (0.38 + 0.0 * k), 10);
    g.fillStyle = '#e9edf3'; g.font = '700 26px Inter'; g.fillText('cat_video_FINAL.mp4', 24, 540); tex.needsUpdate = true; };
  return { root, draw };
}

// ---------- Wi-Fi router ----------
function makeRouter(p) {
  const root = grp(p);
  add(root, rbox(0.2, 0.045, 0.13, 0.015), mat('#f4f1ea'), [0, 0.0225, 0]);
  for (const s of [-1, 1]) add(root, new THREE.CapsuleGeometry(0.006, 0.11, 4, 8), mat('#f4f1ea'), [s * 0.08, 0.1, -0.05], [0, 0, s * 0.18]);
  const leds = []; for (let i = 0; i < 4; i++) leds.push(add(root, new THREE.SphereGeometry(0.004, 8, 8), glow('#3dff9a', 2), [-0.06 + i * 0.03, 0.03, 0.066], [0, 0, 0], false));
  const arcs = []; for (let i = 0; i < 3; i++) { const a = add(root, new THREE.TorusGeometry(0.06 + i * 0.045, 0.006, 8, 48, Math.PI * 0.5), glow('#3fe0e8', 2.5, { transparent: true }), [0, 0.2, 0], [0, 0, Math.PI * 0.25], false); arcs.push(a); }
  return { root, leds, arcs };
}

// ---------- the wave gun (magnetron): magnet + copper block + wire ----------
function makeGadget(p) {
  const root = grp(p);
  const magnetA = add(root, rcyl(0.05, 0.03, 0.008, 48), mat('#d43b3b', { clearcoat: 0.6 }), [0, 0.135, 0]);
  const copper = add(root, rcyl(0.045, 0.08, 0.01, 48), mat('#d9814a', { metalness: 0.85, roughness: 0.28 }), [0, 0.07, 0]);
  const fins = grp(copper); for (let i = 0; i < 8; i++) add(fins, new THREE.BoxGeometry(0.11, 0.006, 0.04), mat('#c9763f', { metalness: 0.8, roughness: 0.35 }), [0, -0.03 + i * 0.009, 0]);
  const magnetB = add(root, rcyl(0.05, 0.03, 0.008, 48), mat('#3b6fd4', { clearcoat: 0.6 }), [0, 0.015, 0]);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.045, 0.07, 0), new THREE.Vector3(0.11, 0.09, 0.03), new THREE.Vector3(0.13, 0.02, 0.07), new THREE.Vector3(0.2, 0.005, 0.05)]);
  const wire = add(root, new THREE.TubeGeometry(curve, 48, 0.006, 10), mat('#2c2f36'));
  const antenna = add(root, new THREE.CylinderGeometry(0.008, 0.008, 0.05, 16), mat('#e8eef5', { metalness: 0.9, roughness: 0.2 }), [0, 0.175, 0]);
  const core = add(root, new THREE.SphereGeometry(0.012, 16, 16), glow('#3fe0e8', 4), [0, 0.2, 0], [0, 0, 0], false);
  return { root, magnetA, copper, magnetB, wire, antenna, core };
}

// ---------- the oven box: 5 metal panels + door (glass, then net) + turntable ----------
export const OVEN = { w: 0.6, h: 0.34, d: 0.42 };
function makeOven(p) {
  const { w, h, d } = OVEN, t = 0.018, root = grp(p);
  const steel = mat('#d7dee7', { metalness: 0.55, roughness: 0.32, clearcoat: 0.4 }), inner = mat('#eef1f4', { metalness: 0.2, roughness: 0.6 });
  const panel = (sx, sy, sz, pos, m = steel) => { const g = grp(root, pos); add(g, rbox(sx, sy, sz, 0.008), m); return g; };
  const panels = {
    floor: panel(w, t, d, [0, t / 2, 0], inner), top: panel(w, t, d, [0, h - t / 2, 0]),
    left: panel(t, h, d, [-w / 2 + t / 2, h / 2, 0]), right: panel(t, h, d, [w / 2 - t / 2, h / 2, 0]), back: panel(w, h, t, [0, h / 2, -d / 2 + t / 2]),
  };
  // inner wall between food cavity and the wave gun bay (gadget lives on the right)
  const bay = panel(0.012, h - 2 * t, d - 0.02, [w / 2 - 0.16, h / 2, 0], inner);
  // door: hinge on the left edge
  const door = grp(root, [-w / 2, 0, d / 2 + 0.01]);
  const doorBody = grp(door, [(w - 0.15) / 2, h / 2, 0]);
  const frame = new THREE.Shape(); frame.moveTo(-0.225, -0.17); frame.lineTo(0.225, -0.17); frame.lineTo(0.225, 0.17); frame.lineTo(-0.225, 0.17); frame.lineTo(-0.225, -0.17);
  const hole = new THREE.Path(); hole.moveTo(-0.19, -0.13); hole.lineTo(0.19, -0.13); hole.lineTo(0.19, 0.13); hole.lineTo(-0.19, 0.13); hole.lineTo(-0.19, -0.13); frame.holes.push(hole);
  add(doorBody, new THREE.ExtrudeGeometry(frame, { depth: 0.016, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 3 }), mat('#2b3240', { roughness: 0.4, clearcoat: 0.8 }), [0, 0, -0.008]);
  const glass = add(doorBody, new THREE.PlaneGeometry(0.38, 0.26), new THREE.MeshPhysicalMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0, clearcoat: 1, depthWrite: false }), [0, 0, 0.001], [0, 0, 0], false);
  const net = add(doorBody, new THREE.PlaneGeometry(0.38, 0.26), new THREE.MeshStandardMaterial({ map: TEX.net, alphaMap: null, transparent: true, color: '#ffffff', roughness: 0.5, metalness: 0.4, depthWrite: false }), [0, 0, 0.003], [0, 0, 0], false);
  const handle = add(doorBody, rbox(0.016, 0.22, 0.03, 0.006), mat('#c9d3de', { metalness: 0.7, roughness: 0.25 }), [0.205, 0, 0.02]);
  // control panel on the bay front
  const ctrl = grp(root, [w / 2 - 0.075, h / 2, d / 2 + 0.008]);
  add(ctrl, rbox(0.14, h - 0.02, 0.012, 0.006), mat('#2b3240', { roughness: 0.4, clearcoat: 0.8 }));
  const display = add(ctrl, new THREE.PlaneGeometry(0.09, 0.03), glow('#3dff9a', 1.6), [0, 0.11, 0.007], [0, 0, 0], false);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) add(ctrl, rbox(0.022, 0.016, 0.006, 0.004), mat('#e9eef4'), [-0.03 + i * 0.03, 0.04 - j * 0.026, 0.008]);
  const knob = add(ctrl, rcyl(0.026, 0.016, 0.004, 32), mat('#e9eef4'), [0, -0.1, 0.012], [Math.PI / 2, 0, 0]);
  // turntable (glass plate + roller ring)
  const turn = grp(root, [-0.07, t, 0]);
  add(turn, rcyl(0.15, 0.008, 0.003, 96), new THREE.MeshPhysicalMaterial({ color: '#d8f0ff', roughness: 0.08, transmission: 0.0, transparent: true, opacity: 0.55, clearcoat: 1 }), [0, 0.012, 0]);
  add(turn, new THREE.TorusGeometry(0.09, 0.005, 8, 48), mat('#9aa6b4'), [0, 0.005, 0], [Math.PI / 2, 0, 0]);
  const light = new THREE.PointLight('#ffe7b0', 0, 0.8, 1.5); light.position.set(-0.07, h - 0.05, 0); root.add(light);
  return { root, panels, bay, door, doorBody, glass, net, handle, ctrl, display, knob, turn, light };
}

// ---------- pizza ----------
function makePizza(p) {
  const root = grp(p);
  const top = new THREE.MeshPhysicalMaterial({ map: TEX.pizza, roughness: 0.6, clearcoat: 0.3, emissive: '#ff6a1a', emissiveMap: TEX.spots, emissiveIntensity: 0 });
  const base = add(root, rcyl(0.13, 0.02, 0.008, 96), mat('#d7a057'), [0, 0.01, 0]);
  const disc = add(root, new THREE.CircleGeometry(0.128, 96), top, [0, 0.0205, 0], [-Math.PI / 2, 0, 0]);
  const frost = add(root, new THREE.CircleGeometry(0.13, 96), new THREE.MeshStandardMaterial({ map: TEX.frost, transparent: true, depthWrite: false, roughness: 0.2 }), [0, 0.022, 0], [-Math.PI / 2, 0, 0], false);
  const cold = add(root, new THREE.CircleGeometry(0.13, 96), new THREE.MeshStandardMaterial({ map: TEX.coldSpots, transparent: true, depthWrite: false, roughness: 0.2, opacity: 0 }), [0, 0.023, 0], [-Math.PI / 2, 0, 0], false);
  const box = add(root, rbox(0.3, 0.035, 0.3, 0.004), mat('#efe4cf'), [0, 0.0175, 0]); // pizza box lid, used in the fridge
  box.visible = false;
  return { root, top, disc, frost, cold };
}

// ---------- fire (sticks + flame tongues) ----------
function makeFire(p) {
  const root = grp(p), sticks = [];
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const s = add(root, new THREE.CylinderGeometry(0.014, 0.016, 0.26, 10), mat('#7a4a2a'), [0.06 * Math.cos(a), 0.07, 0.06 * Math.sin(a)]);
    s.lookAt(new THREE.Vector3(0, 0.22, 0)); s.rotateX(Math.PI / 2); sticks.push(s); }
  const flames = []; for (let i = 0; i < 7; i++) { const f = add(root, new THREE.ConeGeometry(0.07 - i * 0.006, 0.3, 20, 1, true), glow(i % 2 ? '#ffb547' : '#ff6a2b', 2.6, { transparent: true, side: THREE.DoubleSide }), [0, 0.1, 0], [0, 0, 0], false); flames.push(f); }
  const light = new THREE.PointLight('#ff8a3a', 0, 3, 1.6); light.position.set(0, 0.25, 0.1); root.add(light);
  return { root, sticks, flames, light };
}

// ---------- macro sets (far away in the same scene) ----------
// 1) the door net up close: a metal sheet with holes and a fat wave trying to squeeze through
function makeNetSet(p) {
  const root = grp(p, [30, 0, 0]);
  const sheet = add(root, new THREE.PlaneGeometry(6, 10), new THREE.MeshStandardMaterial({ map: TEX.net.clone(), transparent: true, roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide }), [0, 0, 0]);
  sheet.material.map.repeat.set(10, 16); sheet.material.map.needsUpdate = true;
  const bg = add(root, new THREE.PlaneGeometry(14, 20), mat('#1c2742'), [0, 0, -2.5]);
  // the wave: a fat glowing snake made of a sine tube
  const pts = []; for (let i = 0; i <= 80; i++) pts.push(new THREE.Vector3(0, 0, 0));
  const wave = add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((v, i) => new THREE.Vector3(i * 0.01, 0, 0))), 120, 0.18, 16), glow('#3fe0e8', 2.2), [0, 0, 0], [0, 0, 0], false);
  return { root, sheet, wave };
}
// 2) inside the cheese: water buddies (one big + two small spheres, cute eyes)
function makeCheeseSet(p) {
  const root = grp(p, [60, 0, 0]);
  add(root, new THREE.PlaneGeometry(16, 24), mat('#f7c948', { roughness: 0.4, clearcoat: 0.6 }), [0, 0, -1.6]);
  for (let i = 0; i < 26; i++) add(root, new THREE.SphereGeometry(0.25 + hash(i) * 0.6, 32, 24), mat('#ffd76a', { roughness: 0.35, clearcoat: 0.8, transparent: true, opacity: 0.9 }), [(hash(i + 1) - 0.5) * 9, (hash(i + 2) - 0.5) * 14, -1.2 + hash(i + 3) * 0.4]);
  const buddies = [], oM = mat('#8fd3ff', { roughness: 0.25, clearcoat: 1, emissive: '#ff6a1a', emissiveIntensity: 0 }), hM = mat('#ffffff', { roughness: 0.3, clearcoat: 1 }), eM = mat('#14202c', { clearcoat: 1 });
  for (let i = 0; i < 18; i++) {
    const b = grp(root, [(hash(i + 30) - 0.5) * 3.6, (hash(i + 31) - 0.5) * 5.6, hash(i + 32) * 0.8]);
    const spin = grp(b);
    add(spin, new THREE.SphereGeometry(0.28, 40, 30), oM);
    for (const s of [-1, 1]) add(spin, new THREE.SphereGeometry(0.15, 32, 24), hM, [s * 0.24, 0.2, 0]);
    for (const s of [-1, 1]) add(spin, new THREE.SphereGeometry(0.035, 16, 12), eM, [s * 0.08, 0.02, 0.26]);
    add(spin, new THREE.TorusGeometry(0.05, 0.012, 8, 16, Math.PI), eM, [0, -0.07, 0.26], [0, 0, Math.PI]);
    buddies.push({ b, spin, seed: i });
  }
  return { root, buddies, oM };
}

// ---------- the kitchen ----------
export function buildKitchen(scene) {
  const K = grp(scene);
  add(K, new THREE.PlaneGeometry(10, 8), mat('#ffffff', { map: TEX.floor, roughness: 0.35, clearcoat: 0.6 }), [0, 0, 1], [-Math.PI / 2, 0, 0]);
  { const sh = new THREE.Shape(); sh.moveTo(-5, -1.7); sh.lineTo(5, -1.7); sh.lineTo(5, 1.7); sh.lineTo(-5, 1.7); sh.lineTo(-5, -1.7);
    const h = new THREE.Path(); h.moveTo(0.25, -0.355); h.lineTo(1.25, -0.355); h.lineTo(1.25, 0.395); h.lineTo(0.25, 0.395); h.lineTo(0.25, -0.355); sh.holes.push(h);
    add(K, new THREE.ShapeGeometry(sh), mat('#e7cfae', { roughness: 0.9, clearcoat: 0 }), [0, 1.7, -0.66]); }
  add(K, new THREE.PlaneGeometry(2.45, 0.42), mat('#ffffff', { map: TEX.tiles, roughness: 0.3, clearcoat: 0.8 }), [0.4, 1.11, -0.655]);
  add(K, new THREE.PlaneGeometry(8, 3.4), mat('#dcc29e', { roughness: 0.9 }), [-2.2, 1.7, 1], [0, Math.PI / 2, 0]);
  // counter + base cabinets
  add(K, rbox(2.5, 0.05, 0.66, 0.015), mat('#e6d6bb', { roughness: 0.45, clearcoat: 0.5 }), [0.4, 0.875, -0.32]);
  add(K, rbox(2.45, 0.82, 0.6, 0.02), mat('#5fa8ad'), [0.4, 0.43, -0.33]);
  for (let i = 0; i < 4; i++) { add(K, rbox(0.56, 0.7, 0.02, 0.02), mat('#6cb7bc'), [-0.52 + i * 0.61, 0.45, -0.025]); add(K, rbox(0.12, 0.018, 0.025, 0.008), mat('#e8c27a', { metalness: 0.8, roughness: 0.3 }), [-0.52 + i * 0.61, 0.74, 0.0]); }
  add(K, rbox(2.45, 0.08, 0.55, 0.01), mat('#2f5f66'), [0.4, 0.04, -0.36]);
  // fridge (retro, rounded) with door hinged on its left
  const fr = grp(K, [-1.25, 0, -0.3]);
  const fm = mat('#bfe3d6'), fin = mat('#f4f7f6', { roughness: 0.7, clearcoat: 0 });
  add(fr, rbox(0.72, 0.06, 0.66, 0.02), fm, [0, 0.03, 0]); add(fr, rbox(0.72, 0.12, 0.66, 0.05), fm, [0, 1.74, 0]);
  add(fr, rbox(0.05, 1.8, 0.66, 0.02), fm, [-0.335, 0.9, 0]); add(fr, rbox(0.05, 1.8, 0.66, 0.02), fm, [0.335, 0.9, 0]);
  add(fr, rbox(0.72, 1.8, 0.04, 0.02), fm, [0, 0.9, -0.31]); add(fr, rbox(0.72, 0.04, 0.6, 0.01), fm, [0, 1.22, 0.0]);
  const frInner = add(fr, new THREE.PlaneGeometry(0.6, 1.1), glow('#fff6e0', 1.15), [0, 0.65, -0.285], [0, 0, 0], false);
  // a few things in the fridge
  add(fr, new THREE.CylinderGeometry(0.04, 0.04, 0.2, 24), mat('#f5f5f5'), [-0.18, 0.43, -0.05]);   // milk
  add(fr, new THREE.SphereGeometry(0.05, 24, 16), mat('#e94f37'), [0.2, 0.39, -0.08]); add(fr, new THREE.SphereGeometry(0.045, 24, 16), mat('#7cc242'), [0.12, 0.385, -0.15]);
  add(fr, rbox(0.14, 0.09, 0.1, 0.02), mat('#ffd166'), [0.15, 0.95, -0.1]);
  const shelvesF = []; for (let i = 0; i < 3; i++) shelvesF.push(add(fr, rbox(0.6, 0.012, 0.52, 0.004), new THREE.MeshPhysicalMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.6, roughness: 0.1 }), [0, 0.33 + i * 0.29, -0.02]));
  const frDoor = grp(fr, [-0.36, 0, 0.34]);
  add(frDoor, rbox(0.72, 1.18, 0.07, 0.06), mat('#c6eadc'), [0.36, 0.95, 0]);
  add(frDoor, rbox(0.72, 0.52, 0.07, 0.06), mat('#c6eadc'), [0.36, 1.53, 0.0]);
  add(frDoor, rbox(0.03, 0.4, 0.04, 0.012), mat('#e8c27a', { metalness: 0.85, roughness: 0.25 }), [0.66, 1.05, 0.05]);
  const frLight = new THREE.SpotLight('#fff1d6', 0, 4, 0.9, 0.6, 1.4); frLight.position.set(-1.25, 1.1, -0.2); frLight.target.position.set(-0.6, 0.9, 1.4); frLight.castShadow = true; frLight.shadow.mapSize.set(1024, 1024); K.add(frLight, frLight.target);
  // upper cabinet + shelf
  add(K, rbox(0.75, 0.62, 0.34, 0.02), mat('#5fa8ad'), [-0.42, 2.0, -0.48]);
  add(K, rbox(0.35, 0.58, 0.02, 0.015), mat('#6cb7bc'), [-0.6, 2.0, -0.305]); add(K, rbox(0.35, 0.58, 0.02, 0.015), mat('#6cb7bc'), [-0.23, 2.0, -0.305]);
  add(K, rbox(0.5, 0.03, 0.2, 0.008), mat('#ffffff', { map: TEX.wood }), [1.62, 1.62, -0.56]);
  // window with the night city
  const win = grp(K, [0.75, 1.72, -0.65]);
  add(win, new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ map: TEX.city, toneMapped: false, color: new THREE.Color(0.8, 0.8, 0.85) }), [0, 0.1, -0.9], [0, 0, 0], false);
  const wf = mat('#f6efe2'); add(win, rbox(1.1, 0.06, 0.08, 0.015), wf, [0, 0.4, 0]); add(win, rbox(1.1, 0.06, 0.08, 0.015), wf, [0, -0.4, 0]);
  add(win, rbox(0.06, 0.86, 0.08, 0.015), wf, [-0.53, 0, 0]); add(win, rbox(0.06, 0.86, 0.08, 0.015), wf, [0.53, 0, 0]); add(win, rbox(0.03, 0.8, 0.05, 0.01), wf, [0, 0, 0]);
  add(win, rbox(1.2, 0.035, 0.18, 0.01), mat('#ffffff', { map: TEX.wood }), [0, -0.44, 0.08]);
  // plants on the sill
  const plants = grp(win, [0, -0.42, 0.08]);
  [[-0.38, '#d9744a', 0.07], [-0.2, '#e8d9c0', 0.055], [0.33, '#5b8bd1', 0.06]].forEach(([x, c, r], i) => {
    add(plants, lathe([[0, 0], [r, 0], [r * 1.15, r * 1.3], [0, r * 1.3]], 32), mat(c), [x, 0, 0]);
    for (let j = 0; j < 7; j++) { const lf = add(plants, new THREE.SphereGeometry(0.035, 16, 12), mat(j % 2 ? '#4f9a4a' : '#6dbb5a'), [x + (hash(i * 9 + j) - 0.5) * 0.08, r * 1.3 + 0.04 + hash(i * 9 + j + 1) * 0.1, (hash(j + i) - 0.5) * 0.05]); lf.scale.set(0.6, 1.5, 0.35); lf.rotation.z = (hash(j * 3 + i) - 0.5) * 1.2; }
  });
  // pendant lamp
  const lamp = grp(K, [0.15, 2.45, -0.15]);
  add(lamp, new THREE.CylinderGeometry(0.004, 0.004, 0.6, 6), mat('#2a2a2a'), [0, 0.3, 0]);
  add(lamp, lathe([[0.02, 0], [0.22, -0.18], [0.21, -0.19], [0.018, -0.005]], 64), mat('#ffb547', { side: THREE.DoubleSide }), [0, 0, 0]);
  const bulb = add(lamp, new THREE.SphereGeometry(0.045, 24, 16), glow('#fff1c9', 0.2), [0, -0.12, 0], [0, 0, 0], false);
  const lampLight = new THREE.PointLight('#ffd9a0', 0, 6, 1.4); lampLight.position.set(0.15, 2.28, -0.15); lampLight.castShadow = true; lampLight.shadow.mapSize.set(2048, 2048); lampLight.shadow.bias = -0.0008; lampLight.shadow.radius = 6; K.add(lampLight);
  // under-cabinet strip
  const strip = add(K, new THREE.BoxGeometry(0.7, 0.012, 0.02), glow('#fff0c8', 0.1), [-0.42, 1.685, -0.33], [0, 0, 0], false);
  const stripLight = new THREE.RectAreaLight ? null : null;
  // smoke alarm on the wall corner + sprinkler
  const alarm = grp(K, [-0.05, 2.55, -0.62]);
  add(alarm, rcyl(0.07, 0.03, 0.01, 32), mat('#f7f7f2'), [0, 0, 0.02], [Math.PI / 2, 0, 0]);
  const alarmLed = add(alarm, new THREE.SphereGeometry(0.01, 12, 8), glow('#ff2d2d', 0.2), [0.03, -0.02, 0.04], [0, 0, 0], false);
  // props on the counter
  const radio = makeRadio(K); radio.root.position.set(-0.6, 0.9, -0.45); radio.root.rotation.y = 0.3;
  const cat = makeCat(K); cat.root.position.set(1.42, 0.9, -0.35); cat.root.rotation.y = -0.6;
  const phone = makePhone(K); phone.root.position.set(1.0, 0.9, -0.12); phone.root.rotation.y = -0.35;
  const router = makeRouter(K); router.root.position.set(1.62, 1.635, -0.55);
  // story props
  const SPOT = new THREE.Vector3(0.12, 0.9, -0.3);   // where the oven gets built
  const oven = makeOven(K); oven.root.position.copy(SPOT);
  const gadget = makeGadget(K);
  const pizza = makePizza(K);
  const fire = makeFire(K); fire.root.position.set(0.0, 0.9, -0.25);
  const net = makeNetSet(scene), cheese = makeCheeseSet(scene);
  return { K, fr, frDoor, frInner, frLight, lamp, bulb, lampLight, strip, alarmLed, radio, cat, phone, router, oven, gadget, pizza, fire, net, cheese, SPOT, win };
}
