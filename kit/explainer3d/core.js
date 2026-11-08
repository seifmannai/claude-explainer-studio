// How It Really Works - reusable 3D explainer core (three.js r170).
// One page = one video. The page builds its scene with these helpers and sets window.renderFrame(f).
// Render contract (kit/local/local_render.mjs): #c is a 2D canvas at W*PR x H*PR; renderFrame(f) draws the
// 3D frame + the UI layer into it; frames are saved at 1080x1920 (downscaled when PR > 1 = supersampling).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export { THREE };
export const W = 1080, H = 1920, FPS = 30;
export const PAL = { navy: '#0b1220', panel: '#101b2e', grid: '#14233a', cyan: '#3fe0e8', orange: '#ffb547', white: '#f2f6fa', steel: '#cdd6e2', muted: '#9fb2c8', hot: '#ff6a2b' };

// ---------- math (everything is a pure function of time: deterministic renders) ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };   // smootherstep
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
/** 0 -> 1 -> 0 envelope: fades in over fi after a, out over fo before b */
export const win = (t, a, b, fi = 0.25, fo = 0.25) => Math.max(0, Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b)));
export const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const noise1 = (t, seed = 0) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 57), hash(i + 1 + seed * 57), u) * 2 - 1; };
/** keyframes [{t, a:[..] or number, ease?}] -> f(t) with smootherstep between neighbours (ease of the later key) */
export function keys(list) {
  return (t) => {
    if (t <= list[0].t) return list[0];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i], b = list[i + 1];
      if (t <= b.t) {
        const u = (b.ease || smooth)((t - a.t) / (b.t - a.t)), o = {};
        for (const k in a) {
          if (k === 't' || k === 'ease') continue;
          const bv = b[k] === undefined ? a[k] : b[k];
          o[k] = Array.isArray(a[k]) ? a[k].map((v, j) => lerp(v, bv[j], u)) : lerp(a[k], bv, u);
        }
        return o;
      }
    }
    return list[list.length - 1];
  };
}

// ---------- geometry helpers ----------
/** rounded-edge cylinder (lathe): edges catch thin highlights like machined parts */
export function rcyl(r, h, b = 0.04, seg = 128) {
  const p = [], n = 6; p.push(new THREE.Vector2(0, -h / 2));
  for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI / 2; p.push(new THREE.Vector2(r - b + b * Math.cos(a), -h / 2 + b + b * Math.sin(a))); }
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI / 2; p.push(new THREE.Vector2(r - b + b * Math.cos(a), h / 2 - b + b * Math.sin(a))); }
  p.push(new THREE.Vector2(0, h / 2)); return new THREE.LatheGeometry(p, seg);
}
export const rbox = (w, h, d, r = 0.05) => new RoundedBoxGeometry(w, h, d, 4, r);
export const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

// ---------- materials ----------
export function makeMaterials({ cut = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)], hatchColors = ['#c0602f', '#9a4421'] } = {}) {
  const noiseTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
    for (let i = 0; i < 256 * 256; i++) { const v = 150 + hash(i * 0.731) * 70; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    g.putImageData(d, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; })();
  // engineering hatch for cut faces (classic cutaway drawing). Wider spacing reads calmer at phone size.
  const hatch = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = hatchColors[0]; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = hatchColors[1]; g.lineWidth = 7; for (let i = -128; i < 256; i += 32) { g.beginPath(); g.moveTo(i, 128); g.lineTo(i + 128, 0); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 7); t.anisotropy = 8; return t; })();
  /** brushed/cast metal; clip=true -> cut by the cutaway plane */
  const metal = (c, r = 0.35, m = 0.85, clip = false, extra = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, metalness: Math.min(1, m + 0.1), roughnessMap: noiseTex, bumpMap: noiseTex, bumpScale: r > 0.4 ? 0.6 : 0.15, clippingPlanes: clip ? cut : null, ...extra });
  const section = new THREE.MeshStandardMaterial({ color: '#ffffff', map: hatch, roughness: 0.6, metalness: 0, clippingPlanes: cut, side: THREE.BackSide });
  return { metal, section, noiseTex, hatch, cut };
}

/** add a mesh; section=true also adds the hatched cap for cutaway parts */
export function part(parent, geo, mat, { pos = [0, 0, 0], rot = [0, 0, 0], section = null, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.castShadow = m.receiveShadow = shadow; parent.add(m);
  if (section) { const s = new THREE.Mesh(geo, section); m.add(s); }
  return m;
}

// ---------- studio: renderer, lights, environment, post, composite ----------
export async function createStudio({ hdri = '../../../assets/hdri/studio.hdr', bg = PAL.navy, fog = [26, 45], exposure = 0.95, bloom = [0.45, 0.5, 1.25], dof = { aperture: 0.00022, maxblur: 0.006 }, envIntensity = 1.1, envRotY = 2.2, fov = 30, grid = true } = {}) {
  const PR = window.devicePixelRatio || 1;
  const out = document.getElementById('c'); out.width = Math.round(W * PR); out.height = Math.round(H * PR);
  const ctx = out.getContext('2d');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(PR); renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.localClippingEnabled = true;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); if (fog) scene.fog = new THREE.Fog(bg, fog[0], fog[1]);

  // environment: procedural softbox studio, replaced by an HDRI when present (assets/hdri, downloaded by the PC runner)
  const pmrem = new THREE.PMREMGenerator(renderer), studio = new THREE.Scene(); studio.background = new THREE.Color('#2b3646');
  const panel = (w, h, x, y, z, ry, rx, k, col = '#ffffff') => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); studio.add(m); };
  panel(18, 9, 0, 9, 3, 0, Math.PI / 2, 4.0); panel(5, 14, -9, 2, 3, Math.PI / 2, 0, 3.0); panel(4, 14, 9, 2, 2, -Math.PI / 2, 0, 2.2, '#cfefff');
  panel(16, 8, 2, 3, 11, Math.PI, 0, 1.6); panel(10, 3, 0, 1, -10, 0, 0, 0.9, PAL.cyan); panel(30, 30, 0, -6, 0, 0, -Math.PI / 2, 0.12, '#22344f');
  scene.environment = pmrem.fromScene(studio, 0.02).texture; scene.environmentIntensity = 1.35;
  let hdriUsed = 'procedural studio';
  if (hdri) try {
    const hdr = await new RGBELoader().loadAsync(hdri); hdr.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = hdr; scene.environmentIntensity = envIntensity; scene.environmentRotation = new THREE.Euler(0, envRotY, 0); hdriUsed = 'Poly Haven HDRI';
  } catch (e) { /* keep procedural */ }

  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.1, 120);
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(6, 9, 8); key.castShadow = true;
  Object.assign(key.shadow, { radius: 4, normalBias: 0.02, bias: -0.0004 }); key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); scene.add(key);
  const fill = new THREE.DirectionalLight('#cfe3ff', 0.6); fill.position.set(-6, 3, 7); scene.add(fill);
  const rim = new THREE.DirectionalLight(PAL.cyan, 2.2); rim.position.set(-6, 5, -7); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#9fc4ff', '#22344f', 0.25));
  if (grid) {
    const g = new THREE.GridHelper(40, 40, '#1d3354', '#14233a'); g.position.y = -4.2; scene.add(g);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#0e1a2c', roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -4.21; floor.receiveShadow = true; scene.add(floor);
  }

  // post: MSAA x8 -> GTAO contact shadows -> bloom (emissive only, high threshold) -> depth of field -> vignette/grain -> output
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 8 }));
  composer.setPixelRatio(PR); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, W * PR, H * PR); gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 2, thickness: 1, scale: 0.8 }); gtao.blendIntensity = 0.7; composer.addPass(gtao);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(W * PR, H * PR), ...bloom); composer.addPass(bloomPass);
  const bokeh = dof ? new BokehPass(scene, camera, { focus: 25, aperture: dof.aperture, maxblur: dof.maxblur }) : null; if (bokeh) composer.addPass(bokeh);
  const grade = new ShaderPass({ uniforms: { tDiffuse: { value: null }, seed: { value: 0 }, flash: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float seed; uniform float flash; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 q = (vUv-0.5)*vec2(0.8,1.0); c.rgb *= 1.0 - 0.28*smoothstep(0.25,0.8,length(q));
        c.rgb += flash*vec3(1.0,0.75,0.45)*(1.0-0.6*length(q));
        float g = fract(sin(dot(vUv*1000.0+seed, vec2(12.9898,78.233)))*43758.5453); c.rgb += (g-0.5)*0.022; gl_FragColor = c; }` });
  composer.addPass(grade); composer.addPass(new OutputPass());

  const st = {
    THREE, renderer, scene, camera, composer, PR, ctx, out, pmrem, lights: { key, fill, rim }, passes: { gtao, bloom: bloomPass, bokeh, grade },
    hdriUsed, target: new THREE.Vector3(),
    /** place camera: pos, look-at, fov; optional shake (world units) */
    setCamera(pos, look, f = fov, shake = 0, t = 0) {
      camera.position.set(...pos); if (shake) camera.position.add(new THREE.Vector3(noise1(t * 30, 1), noise1(t * 30, 2), noise1(t * 30, 3)).multiplyScalar(shake));
      camera.fov = f; camera.updateProjectionMatrix(); st.target.set(...look); camera.lookAt(st.target);
      if (bokeh) bokeh.uniforms.focus.value = camera.position.distanceTo(st.target);
    },
    /** render the 3D frame into #c (full resolution); the UI is drawn on top afterwards */
    render(f) {
      grade.uniforms.seed.value = f; composer.render();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(renderer.domElement, 0, 0, out.width, out.height);
      ctx.setTransform(PR, 0, 0, PR, 0, 0);   // UI coordinates = 1080x1920
    },
    /** world point -> screen [x, y] in 1080x1920 UI coordinates (+ behind flag) */
    project(v) { const p = (v.isVector3 ? v : new THREE.Vector3(...v)).clone().project(camera); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H, p.z > 1]; },
  };
  window.glInfo = (() => { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'; })();
  window.hdriUsed = () => hdriUsed;
  return st;
}

/** fonts must be loaded before the first UI frame (kit/fonts/inter.css) */
export async function fontsReady() {
  await Promise.all(['700', '800', '900'].map((w) => document.fonts.load(`${w} 40px Inter`)));
  await document.fonts.load('900 40px "Inter Display"'); await document.fonts.ready;
}
export async function loadJSON(url, fallback = null) { try { const r = await fetch(url); if (!r.ok) throw 0; return await r.json(); } catch (e) { return fallback; } }
export async function loadImage(url) { const i = new Image(); i.src = url; try { await i.decode(); return i; } catch (e) { return null; } }
