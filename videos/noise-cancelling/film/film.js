// film.js - "How noise-cancelling headphones erase sound" (How It Really Works, video 5). VideoHub contract:
// window.renderOut(t) draws second t (pure function of t), window.READY, window.VH_SCENES.
// 2D metro (metro.js, drawn style, Dave) -> dive into the ear cup -> 3D exploded headphones (hp3d.js, kit core.js:
// studio light, bloom, depth of field, contact shadows) -> back out to the metro -> loops to frame 0.
import { THREE, W, H, createStudio } from './lib/core.js';
import { buildHeadphones } from './hp3d.js';

window.FILM_PR = window.FILM_PR || 1;
const { cl, eo, back, hs, text } = P;
const seg = (t, a, b) => cl((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const WORDS = window.WORDS, C = makeCues(WORDS), DUR = C.DUR, FPS = 30;

const st = await createStudio({ hdri: null, grid: false, bg: '#0b1220', fog: null, exposure: 1.0, bloom: [0.4, 0.4, 1.35], dof: { aperture: 0.0004, maxblur: 0.006 }, fov: 34 });
const { scene, camera, ctx, out, PR } = st; window.__st = st;
st.passes.gtao.enabled = false;   // GTAO drew a dark rectangle behind the parts (bad with the gradient background); shadows come from the key light
scene.environmentIntensity = 0.55; st.renderer.toneMappingExposure = 0.9;
Object.assign(st.lights.key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 40 }); st.lights.key.shadow.camera.updateProjectionMatrix();
// floor disc + soft backdrop gradient (studio product shot)
const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 64), new THREE.MeshStandardMaterial({ color: '#101a2c', roughness: 0.85 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.3; floor.receiveShadow = true; scene.add(floor);
const bgTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1b2b46'); gr.addColorStop(0.6, '#0e1728'); gr.addColorStop(1, '#070c16'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
scene.background = bgTex;
const hp = buildHeadphones(THREE, scene);

// ------------------------------------------------------------------ 3D camera: keys of (pos, look, fov), built from the live part positions
const A = hp.anchors, V = (v, d = [0, 0, 0]) => [v.x + d[0], v.y + d[1], v.z + d[2]];
const lab = () => [A.cup.x - 0.2, A.cup.y + 0.1, A.cup.z + 2.2];
const CAM = [   // portrait frame: the view is only ~0.33 x distance wide, so cameras sit 6-9 units away
  [C.dive1 - 0.3, () => [0.3, 1.2, 9.5], () => [0.3, 0.55, 0], 32],
  [C.explode + 0.6, () => [1.6, 1.4, 9.0], () => [1.5, 0.35, 0], 34],
  [C.mic + 0.4, () => V(A.outerMic, [-1.0, 0.9, 6.2]), () => V(A.outerMic, [-0.9, -0.2, 0]), 32],
  [C.air - 0.2, () => V(A.outerMic, [-1.4, 0.6, 6.4]), () => V(A.outerMic, [-1.3, -0.35, 0]), 32],
  [C.chip - 0.15, () => V(A.chip, [0.3, 1.6, 6.0]), () => V(A.chip, [-0.2, 0.45, 0.4]), 32],
  [C.speaker - 0.15, () => V(A.driver, [-0.8, 0.9, 7.2]), () => V(A.driver, [-1.15, 0, 0]), 32],
  [C.hill - 0.2, () => [lab()[0] + 0.2, lab()[1] + 0.5, lab()[2] + 6.2], () => lab(), 32],
  [C.mic2 - 0.15, () => V(A.innerMic, [1.0, 1.0, 5.4]), () => V(A.innerMic, [-0.1, 0.2, 0.2]), 32],
  [C.steady - 0.2, () => [lab()[0] - 0.2, lab()[1] + 0.4, lab()[2] + 6.4], () => [lab()[0], lab()[1] - 0.05, lab()[2]], 32],
  [C.cushions - 0.15, () => V(A.cushion, [-1.0, 1.0, 6.0]), () => V(A.cushion, [-0.7, 0.2, 0.2]), 32],
  [C.back0 - 0.55, () => V(A.cup, [0.6, 0.5, 6.0]), () => V(A.cup), 32],
  [C.back0, () => V(A.cup, [0.3, 0.1, 1.0]), () => V(A.cup), 40],
];
function camAt(t) {
  let i = 0; while (i + 1 < CAM.length && CAM[i + 1][0] <= t) i++;
  const b = CAM[i], a = CAM[Math.max(0, i - 1)], k = a === b ? 1 : eio(seg(t, b[0], b[0] + Math.min(0.9, (CAM[i + 1] ? CAM[i + 1][0] : t + 1) - b[0])));   // arrive at key i within its first ~0.9 s, then hold (drifting)
  const pa = a[1](), pb = b[1](), la = a[2](), lb = b[2]();
  const p = pa.map((v, j) => lerp(v, pb[j], k)), l = la.map((v, j) => lerp(v, lb[j], k)), f = lerp(a[3], b[3], k);
  // constant slow orbit + breathing so the 3D shot is never still
  const ang = 0.1 * Math.sin(t * 0.45) + 0.05 * (t - C.dive1) / 10, dx = p[0] - l[0], dz = p[2] - l[2];
  return { p: [l[0] + dx * Math.cos(ang) - dz * Math.sin(ang), p[1] + 0.05 * Math.sin(t * 0.8), l[2] + dx * Math.sin(ang) + dz * Math.cos(ang)], l, f };
}

// ------------------------------------------------------------------ 2D layers
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const M2 = mk(), M3 = mk(), UI = mk(), gm = M2.getContext('2d'), gm3 = M3.getContext('2d'), gu = UI.getContext('2d');
const proj = (v) => st.project(v);
function pill(g, s, x, y, col, k, o = {}) {
  if (k <= 0) return; g.save(); g.translate(x, y); const sc = back(k); g.scale(sc, sc); g.globalAlpha = cl(k * 3);
  g.font = `900 ${o.size || 52}px "Inter", "Segoe UI", Arial, sans-serif`; const w = g.measureText(s).width + 56, h = (o.size || 52) * 1.5;
  g.fillStyle = 'rgba(11,18,32,.88)'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, h / 2); g.fill(); g.strokeStyle = col; g.lineWidth = 5; g.stroke();
  g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 3); g.restore();
}
function label(g, s, anchor, dx, dy, col, k) {   // leader line from a 3D point to a pill
  if (k <= 0 || !anchor) return; const [x, y] = proj(anchor), lx = cl(x + dx, 270, W - 270), ly = cl(y + dy, 230, 1250);
  g.save(); g.globalAlpha = cl(k * 3); g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, lx, eo(k)), lerp(y, ly, eo(k))); g.stroke();
  g.fillStyle = col; g.beginPath(); g.arc(x, y, 10 + 4 * Math.sin(performance.now ? 0 : 0), 0, 7); g.fill(); g.restore();
  pill(g, s, lx, ly, col, k);
}
const vis = (t, a, b, fi = 0.25, fo = 0.25) => Math.max(0, Math.min(seg(t, a, a + fi), 1 - seg(t, b - fo, b)));

function ui3d(g, t) {
  g.clearRect(0, 0, W, H); g.setTransform(1, 0, 0, 1, 0, 0);
  const O = '#ffb547', Cy = '#3fe0e8', Wt = '#f2f6fa';
  label(g, 'OUTSIDE MIC', A.outerMic, 160, -260, O, vis(t, C.mic - 0.05, C.air + 0.2));
  if (t > C.air - 0.2 && t < C.chip) { pill(g, 'AIR', 300, 560, '#cfe8ff', vis(t, C.air - 0.2, C.chip)); }
  label(g, 'CHIP', A.chip, -220, -330, Cy, vis(t, C.chip - 0.05, C.speaker));
  if (t > C.copies && t < C.speaker) pill(g, t < C.flips ? 'COPY' : 'FLIP!', 820, 520, t < C.flips ? O : Cy, vis(t, C.copies, C.speaker) * (t > C.flips ? back(seg(t, C.flips, C.flips + 0.3)) : 1));
  label(g, 'SPEAKER', A.driver, 160, -300, Cy, vis(t, C.speaker - 0.05, C.hill - 0.1));
  if (t > C.ear - 0.2 && t < C.hill) pill(g, 'YOUR EAR', 250, 640, '#ff8fb1', vis(t, C.ear - 0.2, C.hill - 0.1));
  // hill + valley dots meeting, then SILENCE
  if (t > C.hill - 0.1 && t < C.mic2) {
    const L = lab(), m = eo(seg(t, C.hill, C.valley + 0.4)), sep = 0.75 * (1 - m);
    const ph = (Math.PI / 2 + t * 6) / 4, hillX = L[0] + ((ph % (Math.PI * 2 / 4)) - 0.4);   // a crest of the noise wave
    const hill = proj([hillX, L[1] + sep + 0.3, L[2]]), val = proj([hillX, L[1] - sep - 0.3, L[2]]);
    const k = vis(t, C.hill - 0.1, C.cancel + 0.2);
    if (k > 0) { g.globalAlpha = k; g.fillStyle = O; g.beginPath(); g.arc(hill[0], hill[1], 18, 0, 7); g.fill(); g.fillStyle = Cy; g.beginPath(); g.arc(val[0], val[1], 18, 0, 7); g.fill(); g.globalAlpha = 1;
      pill(g, 'HILL', hill[0], hill[1] - 90, O, vis(t, C.hill - 0.1, C.cancel + 0.2), { size: 44 }); pill(g, 'VALLEY', val[0], val[1] + 90, Cy, vis(t, C.valley - 0.1, C.cancel + 0.2), { size: 44 }); }
    // the equation, word by word
    const y = 420; const e1 = vis(t, C.noisePlus - 0.1, C.mic2), e2 = vis(t, C.anti - 0.15, C.mic2), e3 = vis(t, C.silence - 0.15, C.mic2);
    if (e1 > 0) { pill(g, 'NOISE', 230, y, O, e1, { size: 48 }); text(g, '+', 410, y, 80, Wt, { alpha: e1 }); }
    if (e2 > 0) { pill(g, 'ANTI-NOISE', 640, y, Cy, e2, { size: 48 }); }
    if (e3 > 0) { text(g, '=', 540, y + 120, 80, Wt, { alpha: e3 }); pill(g, 'SILENCE', 540, y + 230, Wt, e3, { size: 60 }); }
  }
  // inside mic: check + fix loop, very fast
  if (t > C.mic2 - 0.1 && t < C.steady) {
    const k = vis(t, C.mic2 - 0.1, C.steady); label(g, 'INSIDE MIC', A.innerMic, -200, -360, '#ff6a5a', k);
    const [x, y] = proj(A.innerMic), sp = t > C.fixes ? 14 : 4;
    g.save(); g.globalAlpha = k; g.translate(x, y); g.rotate(t * sp); g.strokeStyle = Cy; g.lineWidth = 8;
    for (let i = 0; i < 2; i++) { g.rotate(Math.PI); g.beginPath(); g.arc(0, 0, 90, 0.2, 2.6); g.stroke(); g.beginPath(); g.moveTo(Math.cos(2.6) * 90, Math.sin(2.6) * 90); g.lineTo(Math.cos(2.6) * 90 + 26, Math.sin(2.6) * 90 - 10); g.stroke(); }
    g.restore();
    if (t > C.checks - 0.1) pill(g, t < C.fixes ? 'CHECK' : 'FIX', x + 240, y + 40, t < C.fixes ? '#ff6a5a' : Cy, vis(t, C.checks - 0.1, C.steady) * (0.85 + 0.15 * Math.abs(Math.sin(t * 9))), { size: 44 });
    if (t > C.thousands - 0.1) { const n = Math.floor(seg(t, C.thousands - 0.1, C.thousands + 1.2) * 1000) * 48; pill(g, `${n.toLocaleString('en-US')} × / SEC`, 540, 1180, Wt, vis(t, C.thousands - 0.1, C.steady), { size: 46 }); }
  }
  if (t > C.steady - 0.1 && t < C.cushions) {
    const hi = t > C.high - 0.1, L = lab(), y0 = proj([L[0], L[1] + 1.0, L[2]])[1];
    pill(g, hi ? 'HIGH, SHARP SOUND' : 'STEADY ENGINE HUM', 540, Math.max(300, y0 - 40), hi ? '#ff6aa8' : O, hi ? vis(t, C.high - 0.1, C.cushions) : vis(t, C.steady - 0.1, C.high - 0.1), { size: 46 });
    const ok = !hi && t > C.engines - 0.2, bad = hi && t > C.tooFast - 0.3;
    if (ok) text(g, '✓', 900, 1120, 170, '#7dff9a', { scale: back(seg(t, C.engines - 0.2, C.engines + 0.1)) });
    if (bad) { text(g, '✗', 900, 1120, 170, '#ff5a4a', { scale: back(seg(t, C.tooFast - 0.3, C.tooFast)) }); pill(g, 'LEFTOVER', 300, 1160, '#ff5a4a', seg(t, C.tooFast - 0.3, C.tooFast), { size: 40 }); }
  }
  label(g, 'CUSHION BLOCKS IT', A.cushion, 120, -380, '#7dff9a', vis(t, C.cushionWord - 0.15, C.back0 - 0.3));
  // flashes at the cuts in/out of the cup
  const fl = Math.max(1 - seg(t, C.dive1, C.dive1 + 0.35), seg(t, C.back0 - 0.25, C.back0));
  if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, W, H); }
}

// captions (STYLE.md): 3 words, active word orange, y=1400 (drops to 1640 when a drawn head is in the way)
const CHUNKS = [];
for (const s of WORDS.sentences) { const ws = WORDS.words.filter((w) => w.s === s.s); for (let i = 0; i < ws.length; i += 3) CHUNKS.push({ s: s.s, ws: ws.slice(i, i + 3), t0: ws[i].t, end: s.end }); }
for (let i = 0; i < CHUNKS.length; i++) CHUNKS[i].t1 = CHUNKS[i + 1] && CHUNKS[i + 1].s === CHUNKS[i].s ? CHUNKS[i + 1].t0 : CHUNKS[i].end + 0.2;
function captions(g, t) {
  const ch = CHUNKS.find((k) => t >= k.t0 - 0.05 && t < k.t1); if (!ch) return;
  const heads = window.__HEADS || [], y0 = heads.some(([a, b]) => b > 1320 && a < 1480) ? 1640 : 1400;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const size = 86; g.font = `900 ${size}px "Inter", "Segoe UI Black", "Arial Black", sans-serif`;
  const parts = ch.ws.map((w) => w.w.replace(/[^\w'’-]/g, '').toUpperCase()), sp = size * 0.3, widths = parts.map((p) => g.measureText(p).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1), sc = Math.min(1, 980 / total), pop = back(seg(t, ch.t0 - 0.05, ch.t0 + 0.12));
  g.translate(W / 2, y0); g.scale(sc * (0.85 + 0.15 * pop), sc * (0.85 + 0.15 * pop)); g.rotate(-0.02 + 0.01 * Math.sin(t * 2));
  let x = -total / 2; g.textBaseline = 'middle'; g.textAlign = 'left'; g.lineJoin = 'round';
  parts.forEach((p, i) => { const w = ch.ws[i], act = t >= w.t - 0.03 && (t < w.end + 0.05 || i === parts.length - 1);
    g.lineWidth = 18; g.strokeStyle = '#0b1220'; g.strokeText(p, x, act ? -8 : 0); g.fillStyle = act ? '#ffb547' : '#f2f6fa'; g.fillText(p, x, act ? -8 : 0); x += widths[i] + sp; });
  g.restore();
}

const is2D = (t) => t < C.dive1 || t >= C.back0;
function drawMetro(g, t) { window.__HEADS = []; g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); Metro.draw(g, t, C); g.setTransform(1, 0, 0, 1, 0, 0); }
window.renderOut = function (t) {
  t = cl(+t || 0, 0, DUR); const f = Math.round(t * FPS);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (is2D(t)) {
    if (t >= C.loopA) {   // loop: whip from the last beat into frame 0
      drawMetro(gm, t); const heads = window.__HEADS; drawMetro(gm3, 0); window.__HEADS = heads;
      const u = seg(t, C.loopA, DUR), e = eio(u), off = e * W * 1.1, bl = Math.round(30 * Math.sin(Math.PI * u));
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, out.width, out.height); ctx.filter = bl > 0 ? `blur(${bl}px)` : 'none';
      ctx.drawImage(M2, -off * PR, 0, out.width, out.height); ctx.drawImage(M3, (W * 1.1 - off) * PR, 0, out.width, out.height); ctx.filter = 'none';
    } else { drawMetro(gm, t); ctx.drawImage(M2, 0, 0, out.width, out.height);
      const fl = 1 - seg(t, C.back0, C.back0 + 0.35); if (t >= C.back0 && fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, out.width, out.height); } }
    gu.clearRect(0, 0, W, H);
  } else {
    window.__HEADS = [];
    hp.update(t, C); const c = camAt(t); st.setCamera(c.p, c.l, c.f); hp.update(t, C);
    const labShot = (t > C.hill - 0.2 && t < C.mic2 - 0.15) || (t > C.steady - 0.2 && t < C.cushions - 0.15);   // wave demos: blur the parts behind
    st.passes.bokeh.uniforms.aperture.value = labShot ? 0.0022 : 0.0005;
    st.render(f); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ui3d(gu, t);
  }
  captions(gu, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(UI, 0, 0, out.width, out.height);
};
window.VH_SCENES = [
  { name: 'Metro: the noise', t0: 0, t1: C.taps - 0.25 }, { name: 'Metro: one button', t0: C.taps - 0.25, t1: C.dive0 }, { name: 'Dive into the ear cup', t0: C.dive0, t1: C.dive1 },
  { name: '3D: outside mic', t0: C.dive1, t1: C.air - 0.2 }, { name: '3D: sound is air', t0: C.air - 0.2, t1: C.chip - 0.15 }, { name: '3D: chip copies + flips', t0: C.chip - 0.15, t1: C.speaker - 0.15 },
  { name: '3D: speaker plays it', t0: C.speaker - 0.15, t1: C.hill - 0.2 }, { name: '3D: hill meets valley', t0: C.hill - 0.2, t1: C.mic2 - 0.15 }, { name: '3D: inside mic fixes', t0: C.mic2 - 0.15, t1: C.steady - 0.2 },
  { name: '3D: hums vs sharp sounds', t0: C.steady - 0.2, t1: C.cushions - 0.15 }, { name: '3D: cushions', t0: C.cushions - 0.15, t1: C.back0 }, { name: 'Metro: missed his stop', t0: C.back0, t1: DUR },
].map((s) => ({ name: s.name, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3) }));
try { await document.fonts.ready; } catch (e) { /* fine */ }
window.renderOut(0);
window.READY = true;
