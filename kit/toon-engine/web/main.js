// Engine: colour pass (MSAA 4, toon) -> normal/depth pass -> ink + grade -> DOF to screen. window.renderFrame(f).
import * as THREE from 'three';
import { buildWorld } from './world.js';
import { drawCard, DESIGN } from './cast.js';
import { wave, setChop } from './waves.js';
import * as S from './story.js';

const W = 1080, H = 1920, FAR = 4000;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.05, FAR);
scene.fog = new THREE.Fog('#cfe6f5', 200, 2600);

// ---------- lights ----------
const sun = new THREE.DirectionalLight('#ffffff', 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#bfe3ff', '#6b7f8f', 1.1); scene.add(hemi);

// ---------- world ----------
const WD = buildWorld(scene);

// ---------- water: polar grid around the camera's ground point ----------
const RINGS = 120, SEG = 160;
const wGeo = new THREE.BufferGeometry();
const wPos = new Float32Array((RINGS + 2) * SEG * 3), wNor = new Float32Array((RINGS + 2) * SEG * 3), wUv = new Float32Array((RINGS + 2) * SEG * 2);
const ringR = (i) => (i === RINGS + 1 ? 3600 : 0.35 * (Math.exp(0.066 * i) - 1));
const idx = [];
for (let i = 0; i < RINGS + 1; i++) for (let j = 0; j < SEG; j++) {
  const a = i * SEG + j, b = i * SEG + ((j + 1) % SEG), c = (i + 1) * SEG + j, d = (i + 1) * SEG + ((j + 1) % SEG);
  idx.push(a, b, c, b, d, c);
}
wGeo.setIndex(idx);
wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3)); wGeo.setAttribute('normal', new THREE.BufferAttribute(wNor, 3)); wGeo.setAttribute('uv', new THREE.BufferAttribute(wUv, 2));
const seaTex = new THREE.CanvasTexture((await import('./paint.js')).sea('#7fb8e0')); seaTex.colorSpace = THREE.SRGBColorSpace; seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.anisotropy = 8;
const seaMat = new THREE.MeshToonMaterial({ color: '#ffffff', map: seaTex, gradientMap: (await import('./world.js')).GRAD });
const water = new THREE.Mesh(wGeo, seaMat); water.frustumCulled = false; water.receiveShadow = true; water.userData.kind = 'water'; scene.add(water);
const updateWater = (t, cx, cz) => {
  let k = 0, u = 0;
  for (let i = 0; i < RINGS + 2; i++) {
    const r = ringR(i), fade = 1 - Math.min(1, Math.max(0, (r - 25) / 60));
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * Math.PI * 2, x = cx + r * Math.cos(a), z = cz + r * Math.sin(a);
      const [h, dx, dz] = fade > 0 ? wave(x, z, t, fade) : [0, 0, 0];
      wPos[k] = x; wPos[k + 1] = h; wPos[k + 2] = z;
      const nl = Math.hypot(dx, 1, dz); wNor[k] = -dx / nl; wNor[k + 1] = 1 / nl; wNor[k + 2] = -dz / nl; k += 3;
      wUv[u++] = x / 9 + t * 0.02; wUv[u++] = z / 9;
    }
  }
  wGeo.attributes.position.needsUpdate = true; wGeo.attributes.normal.needsUpdate = true; wGeo.attributes.uv.needsUpdate = true;
};

// ---------- cards ----------
const CARD_G = (() => { const g = new THREE.PlaneGeometry(1, 1); return g; })();
const cards = new Map();
const ndCardMat = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map }, FAR: { value: FAR } }, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; varying float vz; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vz = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; uniform float FAR; varying vec2 vUv; varying float vz; void main(){ if(texture2D(map, vUv).a < 0.04) discard; gl_FragColor = vec4(0.0,0.0,0.0, vz/FAR); }`,
});
const getCard = (id, s) => {
  let c = cards.get(id);
  const [dw, dh] = DESIGN[s.kind];
  const res = s.res ?? (s.kind === 'sailor' ? 900 : s.kind === 'cat' ? 1024 : 768);
  const cw = res, ch = Math.round((res * dh) / dw);
  if (!c || c.cw !== cw || c.ch !== ch || c.kind !== s.kind) {
    if (c) { scene.remove(c.mesh); c.tex.dispose(); }
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = s.kind === 'blob'
      ? new THREE.MeshBasicMaterial({ map: tex, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, fog: false })
      : new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.04, side: THREE.DoubleSide, alphaToCoverage: true, fog: s.fog !== false });
    const mesh = new THREE.Mesh(CARD_G, mat);
    mesh.userData.kind = s.kind === 'blob' ? 'blob' : s.kind === 'cloud' || s.kind === 'moon' ? 'cloud' : 'card';
    mesh.userData.nd = ndCardMat(tex);
    mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    mesh.frustumCulled = false;
    scene.add(mesh);
    c = { cv, g: cv.getContext('2d'), tex, mesh, key: '', cw, ch, kind: s.kind };
    cards.set(id, c);
  }
  const key = JSON.stringify(s, (k, v) => (typeof v === 'number' ? Math.round(v * 200) / 200 : k === 'pos' || k === 'rot' || k === 'h' || k === 'w' ? undefined : v));
  if (key !== c.key) { drawCard(c.g, cw, ch, s); c.tex.needsUpdate = true; c.key = key; }
  return c;
};

// ---------- post ----------
const rtC = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtN = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtP = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
const quadScene = new THREE.Scene(); quadScene.add(quad);
const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const inkMat = new THREE.ShaderMaterial({
  uniforms: { tC: { value: rtC.texture }, tN: { value: rtN.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, FAR: { value: FAR },
    inkCol: { value: new THREE.Color('#241726') }, inkR: { value: 2.6 }, inkFade: { value: new THREE.Vector2(160, 560) },
    sat: { value: 1.1 }, gain: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3(0, 0, 0) }, vign: { value: 0.22 }, flash: { value: 0 } },
  vertexShader: VS, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tC, tN; uniform vec2 px; uniform float FAR, inkR, sat, vign, flash; uniform vec3 inkCol, gain, lift; uniform vec2 inkFade; varying vec2 vUv;
    bool isCard(vec4 s){ return s.r + s.g + s.b < 0.01; }
    void main(){
      vec4 c = texture2D(tC, vUv); vec4 s0 = texture2D(tN, vUv); float ink = 0.0;
      if(!isCard(s0) && s0.a < 0.999){
        vec3 n0 = s0.rgb * 2.0 - 1.0; float z0 = s0.a * FAR; float w0 = 1.0 / z0;
        vec2 D[4]; D[0] = vec2(1.0, 0.0); D[1] = vec2(0.0, 1.0); D[2] = vec2(0.7071, 0.7071); D[3] = vec2(0.7071, -0.7071);
        for(int r = 1; r <= 2; r++){
          float rr = inkR * float(r) * 0.5;
          for(int i = 0; i < 4; i++){
            vec2 d = D[i] * rr * px;
            vec4 a = texture2D(tN, vUv + d), b = texture2D(tN, vUv - d);
            if(isCard(a) || isCard(b)) continue;
            float wa = 1.0 / (a.a * FAR), wb = 1.0 / (b.a * FAR);
            float lap = (wa + wb - 2.0 * w0) / w0;
            ink = max(ink, smoothstep(0.03, 0.09, -lap));
            if(a.a < 0.999 && b.a < 0.999){
              float cr = max(1.0 - dot(n0, a.rgb * 2.0 - 1.0), 1.0 - dot(n0, b.rgb * 2.0 - 1.0));
              ink = max(ink, smoothstep(0.22, 0.42, cr));
            }
          }
        }
        ink *= 1.0 - smoothstep(inkFade.x, inkFade.y, z0);
      }
      vec3 col = mix(c.rgb, inkCol, ink * 0.95);
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = max(mix(vec3(l), col, sat), 0.0) * gain + lift;
      vec2 q = (vUv - 0.5) * vec2(0.78, 1.0); col *= 1.0 - vign * smoothstep(0.25, 0.75, length(q));
      col = mix(col, vec3(1.0), flash);
      gl_FragColor = vec4(col, s0.a);
    }`,
});
const dofMat = new THREE.ShaderMaterial({
  uniforms: { tP: { value: rtP.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, FAR: { value: FAR }, focus: { value: 5 }, cInf: { value: 0 }, maxC: { value: 16 } },
  vertexShader: VS, depthTest: false, depthWrite: false,
  fragmentShader: `uniform sampler2D tP; uniform vec2 px; uniform float FAR, focus, cInf, maxC; varying vec2 vUv;
    float coc(float a){ float z = max(a * FAR, 0.01); return min(maxC, cInf * abs(1.0 - focus / z)); }
    void main(){
      vec4 c0 = texture2D(tP, vUv); vec3 col = c0.rgb;
      if(cInf > 0.3){
        float k0 = coc(c0.a); vec3 acc = c0.rgb; float ws = 1.0;
        for(int i = 0; i < 48; i++){
          float fi = float(i); float r = sqrt((fi + 0.5) / 48.0) * maxC; float th = fi * 2.39996;
          vec2 o = vec2(cos(th), sin(th)) * r;
          vec4 s = texture2D(tP, vUv + o * px); float k = coc(s.a);
          if(s.a > c0.a) k = min(k, k0);
          float w = clamp(k - r + 1.0, 0.0, 1.0);
          acc += s.rgb * w; ws += w;
        }
        col = acc / ws;
      }
      gl_FragColor = linearToOutputTexel(vec4(col, 1.0));
    }`,
});
const ndWorld = new THREE.ShaderMaterial({ uniforms: { FAR: { value: FAR } }, side: THREE.DoubleSide,
  vertexShader: `varying vec3 vN; varying float vz; void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float FAR; varying vec3 vN; varying float vz; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * 0.5 + 0.5, vz / FAR); }` });
const ndWater = new THREE.ShaderMaterial({ uniforms: { FAR: { value: FAR } },
  vertexShader: `varying vec3 vN; varying float vz; void main(){ vN = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); vec3 p = position; vec4 mv = modelViewMatrix * vec4(p, 1.0); vz = -mv.z; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform float FAR; varying vec3 vN; varying float vz; void main(){ gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, vz / FAR); }` });

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const k = o.userData.kind;
    if (on) {
      o.userData.mat = o.material; o.userData.vis = o.visible;
      if (k === 'sky' || k === 'blob' || k === 'cloud') o.visible = false;
      else o.material = k === 'card' ? o.userData.nd : k === 'water' ? ndWater : ndWorld;
    } else { o.material = o.userData.mat; o.visible = o.userData.vis; }
  });
};

// ---------- per-frame pose ----------
const tmpV = new THREE.Vector3();
const poseShip = (s, st) => {
  if (!st) { s.root.visible = false; return; }
  s.root.visible = true;
  s.root.position.set(st.x, 0, st.z); s.root.rotation.set(0, st.yaw ?? 0, 0);
  s.pivot.position.set(st.px ?? 0, st.y ?? 0, 0);
  s.pivot.rotation.set(st.roll ?? 0, 0, st.pitch ?? 0, 'XZY');
};
const applyLight = (L, shot) => {
  const az = (L.sun.az * Math.PI) / 180, el = (L.sun.el * Math.PI) / 180, dir = new THREE.Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const c = shot.shadow?.c ?? [0, 0, 0], r = shot.shadow?.r ?? 60;
  sun.color.set(L.sun.col); sun.intensity = L.sun.int;
  sun.target.position.set(...c); sun.position.copy(sun.target.position).addScaledVector(dir, 400);
  const sc = sun.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 50; sc.far = 900; sc.updateProjectionMatrix();
  hemi.color.set(L.hemi.sky); hemi.groundColor.set(L.hemi.ground); hemi.intensity = L.hemi.int;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear ?? 220; scene.fog.far = L.fogFar ?? 2600;
  WD.skyU.zen.value.set(L.zen); WD.skyU.hor.value.set(L.fog); WD.skyU.sunDir.value.copy(dir); WD.skyU.sunCol.value.set(L.sun.col);
  seaMat.color.set(L.sea);
  const g = L.grade; inkMat.uniforms.sat.value = g.sat; inkMat.uniforms.gain.value.set(...g.gain); inkMat.uniforms.lift.value.set(...g.lift); inkMat.uniforms.vign.value = g.vign ?? 0.22;
  setChop(L.chop ?? 1);
  return dir;
};

const placeCards = (list, L, sunDir) => {
  const used = new Set();
  for (const s of list) {
    const c = getCard(s.id, s); used.add(s.id);
    const m = c.mesh; m.visible = true;
    const [dw, dh] = DESIGN[s.kind], h = s.h, w = s.w ?? (h * dw) / dh;
    m.scale.set(w, h, 1);
    const anchorY = s.anchor === 'center' ? 0 : s.kind === 'cat' ? h * (1 - 585 / 600) : s.kind === 'sailor' ? h * (1 - 975 / 1000) : 0;
    const yOff = s.anchor === 'center' ? 0 : h / 2 - anchorY;
    if (s.rot) { m.rotation.set(s.rot[0], s.rot[1], s.rot[2], 'YXZ'); m.position.set(s.pos[0], s.pos[1] + yOff, s.pos[2]); }
    else { // yaw-only billboard (+ optional lean)
      const yaw = Math.atan2(camera.position.x - s.pos[0], camera.position.z - s.pos[2]);
      m.rotation.set(s.lean ?? 0, yaw, s.roll ?? 0, 'YXZ');
      m.position.set(s.pos[0], s.pos[1] + yOff * Math.cos(s.lean ?? 0), s.pos[2]);
      if (s.lean) { m.position.x -= Math.sin(yaw) * Math.sin(s.lean) * yOff; m.position.z -= Math.cos(yaw) * Math.sin(s.lean) * yOff; }
    }
    if (s.flat) { m.rotation.set(-Math.PI / 2, 0, s.spin ?? 0, 'YXZ'); m.position.set(s.pos[0], s.pos[1], s.pos[2]); m.scale.set(w, s.d ?? h, 1); }
    m.castShadow = !!s.shadow; m.receiveShadow = false;
    const tint = s.kind === 'blob' ? [1, 1, 1] : s.glow ? [1, 1, 1] : L.card;
    m.material.color.setRGB(...tint);
    m.renderOrder = s.kind === 'blob' ? 1 : 0;
  }
  for (const [id, c] of cards) if (!used.has(id)) c.mesh.visible = false;
};

window.renderFrame = (f) => {
  const shot = S.shotAt(f), L = S.lightFor(f), t = f / 30;
  const dir = applyLight(L, shot);
  const cam = S.camAt(f);
  camera.position.set(...cam.pos); camera.up.set(0, 1, 0); camera.lookAt(...cam.tgt);
  if (cam.roll) camera.rotateZ((cam.roll * Math.PI) / 180);
  camera.fov = cam.fov ?? 40; camera.updateProjectionMatrix();
  const ws = S.worldAt(f);
  poseShip(WD.bis, ws.bis); poseShip(WD.des, ws.des); poseShip(WD.car, ws.car);
  poseShip(WD.boat, ws.boat);
  if (ws.plank) { WD.plank.visible = true; WD.plank.position.set(...ws.plank.pos); WD.plank.rotation.set(ws.plank.rx ?? 0, ws.plank.ry ?? 0, ws.plank.rz ?? 0, 'YXZ'); } else WD.plank.visible = false;
  WD.land.visible = !!ws.land;
  if (ws.toy) { WD.toy.pivot.position.set(0, ws.toy.y ?? 0, 0); WD.toy.pivot.rotation.set(ws.toy.rx ?? 0, ws.toy.ry ?? 0.4, ws.toy.rz ?? 0); }
  updateWater(t, camera.position.x, camera.position.z);
  water.visible = ws.water !== false;
  placeCards(S.cardsAt(f, (x, z) => wave(x, z, t)[0]), L, dir);
  // colour
  renderer.setRenderTarget(rtC); renderer.setClearColor(L.fog, 1); renderer.clear(); renderer.render(scene, camera);
  // normal + depth
  const fog = scene.fog; scene.fog = null; renderer.shadowMap.autoUpdate = false;
  swapForNd(true);
  renderer.setRenderTarget(rtN); renderer.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 1); renderer.clear(); renderer.render(scene, camera);
  swapForNd(false); scene.fog = fog; renderer.shadowMap.autoUpdate = true;
  // ink + grade
  inkMat.uniforms.flash.value = S.flashAt(f);
  quad.material = inkMat; renderer.setRenderTarget(rtP); renderer.render(quadScene, quadCam);
  // DOF to screen
  const d = S.dofAt(f);
  camera.getWorldDirection(tmpV);
  const fp = new THREE.Vector3(...(d.focus ?? cam.tgt));
  dofMat.uniforms.focus.value = Math.max(0.2, fp.sub(camera.position).dot(tmpV));
  dofMat.uniforms.cInf.value = d.cInf ?? 0; dofMat.uniforms.maxC.value = Math.min(18, Math.max(4, (d.cInf ?? 0) * 1.4));
  quad.material = dofMat; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam);
  return true;
};
window.TOTAL = S.TOTAL;
window.ready = true;
