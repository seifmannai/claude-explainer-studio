// The world: three ships (battleship, destroyer, carrier), a lifeboat, a plank, and the land quay with the Sailors' Home.
// All primitives with painted textures, 2-step toon shading. Pivoted groups are posed by story.worldAt(f).
import * as THREE from 'three';
import * as P from './paint.js';

export const GRAD = (() => { const t = new THREE.DataTexture(new Uint8Array([100, 100, 255, 255]), 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const texCache = new Map();
export const tex = (key, painter, rx = 1, ry = 1) => {
  let base = texCache.get(key);
  if (!base) { base = new THREE.CanvasTexture(painter()); base.colorSpace = THREE.SRGBColorSpace; base.wrapS = base.wrapT = THREE.RepeatWrapping; base.anisotropy = 4; texCache.set(key, base); }
  if (rx === 1 && ry === 1) return base;
  const t = base.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t;
};
export const toon = (color = '#ffffff', map = null, o = {}) => new THREE.MeshToonMaterial({ color, map, gradientMap: GRAD, ...o });

/** box with UVs in metres / tile, so every face keeps the same texel density */
export const tbox = (w, h, d, mat, tile = 2) => {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile); }
  return new THREE.Mesh(g, mat);
};
export const add = (parent, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.kind ??= 'world'; } });
  parent.add(m); return m;
};
const cyl = (r0, r1, h, mat, n = 16) => new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, n), mat);

const hullShape = (L, B, bow = 0.28) => {
  const s = new THREE.Shape(), hb = B / 2, xb = L / 2 - L * bow, xs = -L / 2;
  s.moveTo(xs + hb * 0.7, -hb);
  s.lineTo(xb, -hb);
  s.quadraticCurveTo(L / 2 - L * bow * 0.2, -hb * 0.8, L / 2, 0);
  s.quadraticCurveTo(L / 2 - L * bow * 0.2, hb * 0.8, xb, hb);
  s.lineTo(xs + hb * 0.7, hb);
  s.quadraticCurveTo(xs, hb, xs, hb * 0.3);
  s.lineTo(xs, -hb * 0.3);
  s.quadraticCurveTo(xs, -hb, xs + hb * 0.7, -hb);
  return s;
};
const extrudeUp = (shape, y0, y1, mats, tile = 2) => {
  const g = new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false, curveSegments: 10 });
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tile, uv.getY(i) / tile);
  g.rotateX(-Math.PI / 2); g.translate(0, y0, 0);
  return new THREE.Mesh(g, mats);
};

const turret = (mat, barrelMat, w, h, d, n, len, dir = 1) => {
  const g = new THREE.Group();
  add(g, tbox(w, h, d, mat, 2), 0, h / 2, 0);
  add(g, tbox(w * 0.35, h * 0.7, d * 0.9, mat, 2), dir * (w / 2 + w * 0.1), h * 0.38, 0, 0, 0, dir * 0.5);
  for (let i = 0; i < n; i++) {
    const b = cyl(0.12 * h, 0.15 * h, len, barrelMat, 10); b.rotation.z = Math.PI / 2;
    add(g, b, dir * (w / 2 + len / 2 - 0.2), h * 0.5, n === 1 ? 0 : (i - (n - 1) / 2) * d * 0.38, 0, 0, Math.PI / 2 + dir * 0.06);
  }
  return g;
};

/** a ship: root (position/yaw) > pivot (pitch/roll/sink) > parts. Lower hull antifouling red shows when she tips. */
const ship = (scene, o) => {
  const root = new THREE.Group(), pivot = new THREE.Group(); root.add(pivot); scene.add(root);
  const steelM = toon('#ffffff', tex('steel' + o.color, () => P.steel(o.color, true), 1, 1));
  const plainM = toon('#ffffff', tex('steelp' + o.color, () => P.steel(o.color, false), 1, 1));
  const redM = toon('#ffffff', tex('red', () => P.steel('#a8382e', false, 7)));
  const deckM = o.deckM ?? toon('#ffffff', tex('deck' + o.deck, () => P.planks(o.deck, 8), 1, 1));
  const shp = hullShape(o.L, o.B, o.bow ?? 0.28);
  add(pivot, extrudeUp(shp, -o.draft, 0.5, [redM, redM], 3));
  add(pivot, extrudeUp(shp, 0.5, o.fb, [deckM, steelM], 3));
  return { root, pivot, steelM, plainM, deckM, dark: toon('#3a3d45'), barrel: toon('#4a4e57'), o };
};

export const buildWorld = (scene) => {
  const W = {};
  // ---------- sky ----------
  const skyU = { zen: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(3800, 32, 16), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelMatrix*vec4(position,1.0); gl_Position = projectionMatrix*viewMatrix*p; }`,
    fragmentShader: `uniform vec3 zen, hor, sunDir, sunCol; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float t = pow(clamp(d.y, 0.0, 1.0), 0.55);
        vec3 c = mix(hor, zen, t); float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 40.0) * 0.6 + pow(s, 6.0) * 0.18) * (1.0 - t * 0.6);
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  sky.userData.kind = 'sky'; sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky); W.sky = sky; W.skyU = skyU;

  // ---------- battleship (Bismarck stand-in: dark grey, no markings) ----------
  {
    const s = ship(scene, { L: 74, B: 12.5, draft: 4.5, fb: 6, color: '#646b77', deck: '#bba27a', bow: 0.3 });
    const { pivot: pv, steelM, plainM, dark, barrel } = s;
    add(pv, tbox(24, 4, 8.6, plainM, 3), -3, 8, 0);
    add(pv, tbox(15, 3.4, 7, plainM, 3), -1, 11.7, 0);
    add(pv, tbox(5.5, 6, 4.6, toon('#ffffff', tex('bwin', () => P.bridgeWin('#646b77'), 1, 1)), 3), 7, 16.4, 0);
    add(pv, tbox(2.2, 1.2, 8, plainM, 2), 7, 20, 0);
    add(pv, tbox(5, 4.5, 4.4, plainM, 3), -12, 11.6, 0);
    const fun = cyl(2.1, 2.4, 8, plainM, 20); add(pv, fun, -3, 16.5, 0, 0, 0, 0.1);
    add(pv, cyl(2.05, 2.1, 0.8, dark, 20), -3.4, 20.6, 0, 0, 0, 0.1);
    add(pv, cyl(0.22, 0.3, 13, plainM, 8), 3, 22, 0);
    add(pv, tbox(0.25, 0.25, 7, plainM, 2), 3, 25, 0);
    add(pv, cyl(3.3, 3.3, 2.2, plainM, 20), 17, 7.1, 0); add(pv, cyl(3.3, 3.3, 2.2, plainM, 20), -20, 7.1, 0);
    for (const [x, y, dir] of [[25, 6, 1], [17, 8.2, 1], [-20, 8.2, -1], [-27, 6, -1]]) add(pv, turret(plainM, barrel, 6, 2.5, 6.5, 2, 9, dir), x, y, 0);
    for (const sz of [-1, 1]) for (const x of [-8, -2, 4]) add(pv, turret(plainM, barrel, 2.4, 1.3, 2.4, 2, 3, sz > 0 ? 1 : 1), x, 10, sz * 4.6, 0, sz * 1.2, 0);
    W.bis = s;
  }
  // ---------- destroyer (Cossack stand-in, light grey) ----------
  {
    const s = ship(scene, { L: 40, B: 6.2, draft: 2.5, fb: 3.4, color: '#a7b2bd', deck: '#c4a77c', bow: 0.3 });
    const { pivot: pv, plainM, dark, barrel } = s;
    add(pv, tbox(5, 2.6, 4.4, plainM, 2), 6, 4.7, 0);
    add(pv, tbox(3.4, 1.8, 3.8, toon('#ffffff', tex('dwin', () => P.bridgeWin('#a7b2bd'), 1, 1)), 2), 6.6, 6.9, 0);
    for (const x of [1.4, -3.2]) { add(pv, cyl(0.85, 1, 4.6, plainM, 16), x, 5.6, 0, 0, 0, 0.1); add(pv, cyl(0.84, 0.86, 0.4, dark, 16), x - 0.23, 7.9, 0, 0, 0, 0.1); }
    add(pv, cyl(0.1, 0.14, 9, plainM, 6), 4.3, 8.5, 0); add(pv, tbox(0.12, 0.12, 3.4, plainM, 2), 4.3, 11, 0);
    for (const [x, y, dir] of [[14, 3.4, 1], [10, 4.6, 1], [-10.5, 3.4, -1], [-15, 3.4, -1]]) add(pv, turret(plainM, barrel, 2.4, 1.5, 2.3, 1, 3.4, dir), x, y, 0);
    add(pv, tbox(3, 1.2, 3, plainM, 2), 10, 4, 0);
    // rails both sides
    const railM = toon('#dde3e8');
    for (const sz of [-1, 1]) {
      add(pv, tbox(30, 0.07, 0.07, railM, 2), -2, 4.3, sz * 2.95);
      add(pv, tbox(30, 0.06, 0.06, railM, 2), -2, 3.85, sz * 2.95);
      for (let x = -17; x <= 13; x += 2) add(pv, tbox(0.07, 0.9, 0.07, railM, 2), x, 3.85, sz * 2.95);
    }
    W.des = s;
  }
  // ---------- carrier (Ark Royal stand-in) ----------
  {
    const s = ship(scene, { L: 80, B: 13, draft: 4.5, fb: 7, color: '#8e99a5', deck: '#8e99a5', bow: 0.26, deckM: toon('#8e99a5') });
    const { pivot: pv, steelM, plainM, dark } = s;
    add(pv, tbox(74, 6, 15.5, steelM, 3), -2, 10, 0);
    const fd = new THREE.BoxGeometry(88, 0.8, 19);
    const fdM = toon('#ffffff', tex('fdeck', () => P.flightDeck()));
    const deck = new THREE.Mesh(fd, [plainM, plainM, fdM, plainM, plainM, plainM]);
    add(pv, deck, -1, 13.4, 0);
    add(pv, tbox(15, 8, 3.4, toon('#ffffff', tex('cwin', () => P.bridgeWin('#8e99a5'), 1, 1)), 3), 4, 17.8, 8.3);
    add(pv, tbox(6.5, 4.2, 3, plainM, 3), 2, 23.9, 8.3);
    add(pv, tbox(6.2, 0.5, 2.7, dark, 3), 2, 26.1, 8.3);
    add(pv, cyl(0.16, 0.22, 7, plainM, 6), 8, 25, 8.3); add(pv, tbox(0.14, 0.14, 4, plainM, 2), 8, 27.5, 8.3);
    // biplanes on the aft deck
    const pm = toon('#c9c4ae'), pw = toon('#a9b07f'), pk = toon('#3a3d45');
    const biplane = () => {
      const g = new THREE.Group();
      add(g, tbox(6.5, 1.0, 1.0, pm, 1), 0, 1.4, 0);
      add(g, tbox(1.5, 0.12, 10, pw, 1), 1.2, 2.3, 0); add(g, tbox(1.5, 0.12, 10, pw, 1), 1.2, 0.9, 0);
      for (const z of [-3.2, 3.2]) add(g, tbox(0.1, 1.4, 0.1, pk, 1), 1.2, 1.6, z);
      add(g, tbox(0.9, 0.08, 3.4, pw, 1), -3, 1.6, 0); add(g, tbox(0.9, 1.4, 0.08, pw, 1), -3.1, 2.2, 0);
      add(g, cyl(0.08, 0.08, 2.6, pk, 6), 3.3, 1.4, 0, Math.PI / 2, 0, 0);
      for (const z of [-0.8, 0.8]) add(g, cyl(0.35, 0.35, 0.15, pk, 12), 1.6, 0.35, z, Math.PI / 2, 0, 0);
      return g;
    };
    for (const [x, z] of [[-24, -3], [-31, 3], [-38, -3]]) add(pv, biplane(), x, 13.8, z);
    W.car = s;
  }
  // ---------- lifeboat ----------
  {
    const root = new THREE.Group(), pivot = new THREE.Group(); root.add(pivot); scene.add(root);
    const outer = hullShape(6.2, 2.3, 0.32), inner = hullShape(5.85, 1.98, 0.32);
    outer.holes.push(new THREE.Path(inner.getPoints(12)));
    const white = toon('#f1eee6'), wood = toon('#ffffff', tex('boatwood', () => P.planks('#b58353', 5), 1, 1));
    add(pivot, extrudeUp(outer, -0.35, 0.78, [toon('#c9473f'), white], 1));
    add(pivot, extrudeUp(inner, -0.35, 0.12, [wood, wood], 1));
    for (const x of [-1.4, 0.6]) add(pivot, tbox(0.4, 0.08, 1.95, wood, 1), x, 0.45, 0);
    W.boat = { root, pivot };
  }
  // ---------- plank ----------
  {
    const root = new THREE.Group(); scene.add(root);
    add(root, tbox(1.35, 0.12, 0.42, toon('#ffffff', tex('plank', () => P.planks('#a8744a', 3, 9), 1, 1)), 0.6), 0, 0, 0);
    W.plank = root;
  }
  // ---------- land: quay + Sailors' Home ----------
  {
    const L = new THREE.Group(); L.position.set(900, 0, -500); scene.add(L); W.land = L;
    const stoneM = toon('#ffffff', tex('stone', () => P.stone('#aaa194')));
    add(L, tbox(90, 5, 40, stoneM, 3), 0, -0.2, -20);
    add(L, tbox(90, 0.1, 40, toon('#ffffff', tex('pave', () => P.stone('#c2b9a8', 9))), 2.5), 0, 2.35, -20);
    const plas = toon('#ffffff', tex('plaster', () => P.plaster('#efe2c6')));
    add(L, tbox(11, 5.2, 7, plas, 3), -7, 4.95, -12);
    const roof = new THREE.Shape(); roof.moveTo(-4.3, 0); roof.lineTo(4.3, 0); roof.lineTo(0, 3.2); roof.closePath();
    const rg = new THREE.ExtrudeGeometry(roof, { depth: 12, bevelEnabled: false }); const ruv = rg.attributes.uv; for (let i = 0; i < ruv.count; i++) ruv.setXY(i, ruv.getX(i) / 3, ruv.getY(i) / 3);
    rg.rotateY(Math.PI / 2); rg.translate(-13, 7.55, -12);
    add(L, new THREE.Mesh(rg, [toon('#ffffff', tex('plaster', () => P.plaster('#efe2c6'))), toon('#ffffff', tex('roof', () => P.roofTiles('#b5523a')))]));
    add(L, tbox(1.2, 2.6, 1.2, toon('#ffffff', tex('brick', () => P.stone('#9a5a48', 4))), 1), -3.5, 9.4, -12);
    const plane = (w, h, map, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon('#ffffff', map)); return add(L, m, x, y, z); };
    plane(1.5, 2.6, tex('door', () => P.door()), -7, 3.65, -8.48);
    plane(1.6, 1.6, tex('win', () => P.window4()), -10.4, 4.6, -8.48);
    plane(1.6, 1.6, tex('win', () => P.window4()), -3.6, 4.6, -8.48);
    plane(6.4, 1.3, tex('sign', () => P.sign("SAILORS' HOME")), -7, 6.55, -8.47);
    // bench + cushion + bucket
    const wood = toon('#ffffff', tex('bench', () => P.planks('#9a6a3e', 4, 5), 1, 1));
    add(L, tbox(2.6, 0.12, 0.62, wood, 0.8), 2, 2.88, -2.6);
    add(L, tbox(2.6, 0.5, 0.08, wood, 0.8), 2, 3.3, -2.92);
    for (const x of [1, 3]) for (const z of [-2.35, -2.85]) add(L, tbox(0.1, 0.5, 0.1, toon('#4a3426'), 1), x, 2.6, z);
    const cush = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), toon('#c9474a')); cush.scale.set(0.42, 0.09, 0.28); add(L, cush, 2.0, 2.98, -2.6);
    const bucketM = toon('#93a0ae');
    const bk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 0.34, 24, 1, true), bucketM); bk.material.side = THREE.DoubleSide; add(L, bk, 2.5, 3.11, -2.6);
    add(L, cyl(0.19, 0.19, 0.02, bucketM, 24), 2.5, 2.95, -2.6);
    const bw = new THREE.Mesh(new THREE.CircleGeometry(0.228, 24), toon('#5aa7d8')); bw.rotation.x = -Math.PI / 2; bw.userData.kind = 'world'; bw.position.set(2.5, 3.22, -2.6); L.add(bw);
    // toy boat
    const toy = new THREE.Group(), toyP = new THREE.Group(); toy.add(toyP); L.add(toy); toy.position.set(2.5, 3.22, -2.6);
    add(toyP, extrudeUp(hullShape(0.26, 0.09, 0.35), -0.03, 0.035, [toon('#f1eee6'), toon('#d4353a')], 0.2));
    add(toyP, tbox(0.08, 0.05, 0.06, toon('#f1eee6'), 0.2), -0.02, 0.06, 0);
    add(toyP, cyl(0.012, 0.012, 0.06, toon('#3a3d45'), 6), -0.03, 0.11, 0);
    W.toy = { root: toy, pivot: toyP };
    // quay dressing
    const bol = toon('#3a3d45');
    for (const x of [-30, -16, 8, 22]) { add(L, cyl(0.3, 0.35, 0.7, bol, 12), x, 2.75, -0.8); add(L, cyl(0.4, 0.4, 0.12, bol, 12), x, 3.1, -0.8); }
    const crateM = toon('#ffffff', tex('crate', () => P.planks('#b78a52', 4, 11), 1, 1));
    add(L, tbox(1.2, 1.2, 1.2, crateM, 1.2), 9, 3, -6); add(L, tbox(1.2, 1.2, 1.2, crateM, 1.2), 10.3, 3, -6.2, 0, 0.3, 0); add(L, tbox(1.1, 1.1, 1.1, crateM, 1.2), 9.6, 4.15, -6.1, 0, 0.7, 0);
    add(L, cyl(0.08, 0.1, 4.5, bol, 8), 5.5, 4.6, -1.5); add(L, tbox(0.5, 0.6, 0.5, toon('#f2d37a', null, { emissive: '#4a3a10' })), 5.5, 7.1, -1.5);
    // town + hills behind
    const hill = toon('#6f9a4e'), hill2 = toon('#5e8a45');
    for (const [x, z, r, m] of [[-60, -140, 70, hill], [20, -170, 95, hill2], [110, -150, 80, hill], [-150, -190, 110, hill2]]) add(L, new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), m), x, -r * 0.55, z);
    const hp = [toon('#e8d6b4'), toon('#d9b89a'), toon('#efe7d6')], rf = toon('#a8503c');
    for (let i = 0; i < 9; i++) { const x = -40 + i * 11, z = -45 - (i % 3) * 9; add(L, tbox(7, 5 + (i % 3), 6, hp[i % 3], 3), x, 4.8 + (i % 3) * 0.5, z); add(L, tbox(7.4, 0.8, 6.4, rf, 3), x, 7.7 + (i % 3), z); }
  }
  return W;
};
