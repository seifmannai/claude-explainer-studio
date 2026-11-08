// Cast + 2D props for "The Cat Who Sank Three Ships": original tuxedo cat (Sam), Royal Navy sailors, bowl, life rings, fx.
import { Pen, INK, blobPts, shade, mix, thickAngle, bodyFront, fxSplash, fxPuff, fxCloud, fxBurst, fxRing, fxBlob } from './toonbase.js';

const rad = (d) => (d * Math.PI) / 180;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const rnd = (s, k) => { const x = Math.sin(s * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const FUR = '#4c4863', FUR_SH = '#2f2c44', WHITE = '#f8f4ec', WHITE_SH = '#d8d0c6', PINK = '#ef9fb0', EYE = '#d9e35c', EYE_SH = '#a9b83c';
const WATER = '#8fd0f5';
const DEF_LIGHT = rad(-120);

// ---------------- outfits ----------------
const SKINS = ['#ffe2c2', '#f5c9a0', '#ecd0b6', '#c99067'];
export const rating = (v = 0) => ({ jacket: '#26396a', pants: '#26396a', boots: INK, hat: 'sailor', collar: true, skin: SKINS[v % 4],
  moustache: v % 4 === 3 ? '#2a201a' : undefined, buttons: '#26396a' });
export const officer = () => ({ jacket: '#1f2c52', pants: '#1f2c52', boots: INK, hat: 'cap', cap: '#1f2c52', buttons: '#e8c45a', skin: SKINS[1], moustache: '#6a4a30', build: 'stout' });

// ---------------- the cat ----------------
/** spiky contour for wet / furious fur: every other point pushed out */
const spiky = (pts, amt, seed) => pts.map(([x, y], i, a) => {
  if (!amt) return [x, y];
  const n = a.length; let cx = 0, cy = 0; for (const q of a) { cx += q[0] / n; cy += q[1] / n; }
  const k = i % 3 === 0 ? 1 + amt * (0.7 + 0.6 * rnd(seed, i)) : 1;
  return [cx + (x - cx) * k, cy + (y - cy) * k];
});

/** Sam: tuxedo cat. Design space 600 x 600, ground at y = 585.
 *  o: { expr: grumpy|neutral|squint|furious|smug|shock|sleep|sniff, look, blink(0..1), wet(0..1), paw(0..1), pose: sit|curl, tilt, light, t } */
export const cat = (p, o = {}) => {
  const { expr = 'grumpy', look = 0, blink = 0, wet = 0, paw = 0, pose = 'sit', tilt = 0, light = DEF_LIGHT, t = 0, seed = 4 } = o;
  const thick = thickAngle(light), ow = 9;
  const fur = expr === 'furious' || wet > 0.5 ? 0.06 + 0.04 * wet : 0;
  if (pose === 'curl') return catCurl(p, o);
  // tail (behind)
  const puff = expr === 'furious' ? 1.6 : 1;
  const tw = Math.sin(t * 2.2) * 14;
  const tail = [[380, 560], [470, 560], [520, 500], [515 + tw, 420], [480 + tw * 1.4, 380]];
  p.line(tail, FUR, 30 * puff);
  if (puff > 1) for (let i = 1; i < tail.length; i++) p.dot(tail[i][0] + 18, tail[i][1] - 6, 10, FUR);
  // haunches
  for (const s of [-1, 1]) {
    const hp = spiky(blobPts(300 + s * 82, 528, { a: 74, b: 58, nTop: 2, nBot: 2.4, egg: 0, asym: 0, rot: rad(s * 12), noise: 0.01, seed: seed + s }), fur, seed + 3);
    p.shadedFill(hp, FUR, FUR_SH, light, 74); p.inkRing(hp, ow, thick);
  }
  // body
  const B = { a: 112, b: 138, nTop: 2.0, nBot: 2.6, egg: 0.26, asym: 0, rot: 0, noise: 0.008, seed };
  const bp = spiky(blobPts(300, 438, B), fur, seed + 5);
  p.gradFill(bp, FUR, FUR_SH, light, 0.3);
  p.clip(bp, () => {
    const bib = blobPts(300 + look * 8, 398, { a: 62, b: 112, nTop: 2.2, nBot: 2.2, egg: 0.2, asym: 0, rot: 0, noise: 0.01, seed: seed + 9 });
    p.gradFill(bib, WHITE, WHITE_SH, light, 0.4);
  });
  p.inkRing(bp, ow, thick);
  // front legs + white paws
  const leg = (x0, y0, x1, y1) => {
    p.line([[x0, y0], [x1, y1 - 14]], FUR, 40);
    p.ell(x1, y1 - 6, 30, 19, WHITE, 7);
    p.stroke([[x1 - 8, y1 - 14], [x1 - 8, y1 - 2]], 4); p.stroke([[x1 + 8, y1 - 14], [x1 + 8, y1 - 2]], 4);
  };
  leg(262, 470, 258, 585);
  const pe = clamp(paw, 0, 1);
  leg(338, 470, 342 + 225 * pe, 585 - 60 * Math.sin(pe * Math.PI) - 45 * pe);
  // ---- head (rotates by tilt about the neck) ----
  p.rot = tilt ? [rad(tilt), 300, 330] : null;
  const hx = 300 + look * 12, hy = 238;
  // ears (behind head)
  const flat = expr === 'furious' ? 1 : wet > 0.5 ? 0.6 : 0;
  for (const s of [-1, 1]) {
    const base0 = [hx + s * 48, hy - 78], base1 = [hx + s * 104, hy - 30];
    const tip = [hx + s * (100 + 70 * flat), hy - 140 + 95 * flat];
    p.poly([base0, tip, base1], FUR, ow);
    const inner = [[base0[0] * 0.8 + base1[0] * 0.2, base0[1] * 0.8 + base1[1] * 0.2 + 6], [tip[0] * 0.85 + (base0[0] + base1[0]) * 0.075, tip[1] * 0.85 + (base0[1] + base1[1]) * 0.075 + 10], [base0[0] * 0.25 + base1[0] * 0.75, base0[1] * 0.25 + base1[1] * 0.75]];
    p.poly(inner, PINK, 0);
  }
  const H = { a: 114, b: 96, nTop: 2.0, nBot: 2.6, egg: -0.04, asym: 0.03 * Math.sign(look), rot: 0, noise: 0.008, seed: seed + 2 };
  const hp = spiky(blobPts(hx, hy, H), fur * 1.1, seed + 7);
  p.shadedFill(hp, FUR, FUR_SH, light, 114);
  // white muzzle + chin
  p.clip(hp, () => {
    for (const s of [-1, 1]) p.ell(hx + s * 30 + look * 8, hy + 40, 40, 32, WHITE, 0);
    p.ell(hx + look * 8, hy + 70, 46, 30, WHITE, 0);
    p.poly([[hx - 14 + look * 8, hy - 70], [hx + 14 + look * 8, hy - 70], [hx + 26 + look * 8, hy + 20], [hx - 26 + look * 8, hy + 20]], WHITE, 0); // blaze
  });
  p.inkRing(hp, ow, thick);
  catFace(p, hx + look * 8, hy, o, expr, look, blink);
  // wet: drips + droplets
  if (wet > 0) {
    for (let i = 0; i < 7; i++) {
      const ph = (t * 1.4 + rnd(seed, i)) % 1, x = 200 + rnd(seed, i + 20) * 200, y0 = i < 3 ? hy + 90 : 470 + rnd(seed, i + 30) * 60;
      const y = y0 + ph * ph * 160, r = 9 * wet;
      if (y < 585) { p.poly([[x, y - r * 2.2], [x + r, y], [x, y + r], [x - r, y]], WATER, 4); p.dot(x - r * 0.3, y - r * 0.2, r * 0.3, '#ffffff'); }
    }
  }
  p.rot = null;
};

const catFace = (p, cx, cy, o, expr, look, blink) => {
  const ey = cy + 2, ex = 44, pupil = look * 9;
  const eyeR = expr === 'shock' ? [28, 28] : [27, 23];
  const lidBy = { grumpy: 0.42, neutral: 0.18, squint: 0.62, furious: 0.4, smug: 1, shock: 0, sleep: 1, sniff: 0.3 }[expr] ?? 0.2;
  const lid = Math.max(lidBy, blink);
  const ang = { grumpy: 14, squint: 10, furious: 26, neutral: 4, sniff: 0 }[expr] ?? 0; // inner corner low = cross
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (lid >= 0.98) { // closed: smug = happy arc (up), sleep = down arc
      if (expr === 'smug') p.arc(x, ey + 8, 22, 16, 200, 340, 7);
      else p.arc(x, ey - 6, 22, 14, 20, 160, 7);
      continue;
    }
    const pts = [];
    for (let i = 0; i <= 40; i++) { const a = rad(i * 9); pts.push([x + eyeR[0] * Math.cos(a), ey + eyeR[1] * Math.sin(a)]); }
    p.poly(pts, EYE, 0);
    p.clip(pts, () => {
      p.ell(x, ey + eyeR[1] * 0.75, eyeR[0] * 1.1, eyeR[1] * 0.6, EYE_SH, 0);
      const pw = expr === 'shock' ? 7 : expr === 'furious' ? 4 : 6.5, ph = expr === 'shock' ? 8 : 19;
      p.ell(x + pupil, ey + 1, pw, ph, INK, 0);
      if (lid > 0) { // upper lid, slanted
        const yl = ey - eyeR[1] + 2 * eyeR[1] * lid, sl = Math.tan(rad(ang)) * eyeR[0];
        p.poly([[x - 40, ey - 40], [x + 40, ey - 40], [x + 40, yl - s * sl], [x - 40, yl + s * sl]], FUR, 0);
        p.stroke([[x - eyeR[0] - 2, yl + s * sl * 1.05], [x + eyeR[0] + 2, yl - s * sl * 1.05]], 6);
      }
    });
    p.poly(pts, null, 5);
    if (expr === 'furious' || expr === 'grumpy' || expr === 'squint') { // brow tuft
      const yb = ey - eyeR[1] - 12;
      p.stroke([[x - s * 20, yb + s * 0 + (expr === 'furious' ? 10 : 5)], [x + s * 22, yb - (expr === 'furious' ? 8 : 4)]], 7);
    }
  }
  // nose + mouth
  const nx = cx, ny = cy + 34;
  p.poly([[nx - 11, ny - 6], [nx + 11, ny - 6], [nx, ny + 6]], PINK, 3.5);
  if (expr === 'furious') {
    const m = [[nx - 28, ny + 18], [nx + 28, ny + 18], [nx + 22, ny + 40], [nx, ny + 48], [nx - 22, ny + 40]];
    p.poly(m, '#6a1f2e', 4);
    p.poly([[nx - 22, ny + 19], [nx - 12, ny + 19], [nx - 17, ny + 33]], '#ffffff', 2.5);
    p.poly([[nx + 12, ny + 19], [nx + 22, ny + 19], [nx + 17, ny + 33]], '#ffffff', 2.5);
  } else if (expr === 'shock') {
    p.ell(nx, ny + 26, 9, 11, '#6a1f2e', 4);
  } else {
    const up = expr === 'smug' ? -7 : expr === 'grumpy' || expr === 'squint' ? 5 : 0;
    p.stroke([[nx, ny + 6], [nx, ny + 14]], 4);
    p.stroke([[nx, ny + 14], [nx - 8, ny + 19], [nx - 18, ny + 18 + up]], 4);
    p.stroke([[nx, ny + 14], [nx + 8, ny + 19], [nx + 18, ny + 18 + up]], 4);
  }
  // whiskers
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) p.stroke([[nx + s * 46, ny + 8 + k * 9], [nx + s * 112, ny + 2 + k * 15]], 3);
  if (expr === 'sniff') for (const k of [0, 1]) p.arc(nx + 20 + k * 14, ny - 2, 8, 8, 280, 400, 3);
};

/** sleeping loaf, head on the left */
const catCurl = (p, o) => {
  const { light = DEF_LIGHT, t = 0, seed = 4, expr = 'sleep', look = 0 } = o;
  const thick = thickAngle(light), ow = 9;
  const breathe = 1 + 0.02 * Math.sin(t * 2.4);
  const bp = blobPts(330, 505, { a: 190, b: 82 * breathe, nTop: 2.1, nBot: 3.2, egg: 0.08, asym: 0, rot: 0, noise: 0.008, seed });
  p.gradFill(bp, FUR, FUR_SH, light, 0.3); p.inkRing(bp, ow, thick);
  p.line([[520, 560], [420, 585], [250, 585], [170, 570]], FUR, 30);
  for (const x of [230, 300]) p.ell(x, 572, 30, 17, WHITE, 7);
  const hx = 185, hy = 455;
  for (const s of [-1, 1]) p.poly([[hx + s * 40, hy - 64], [hx + s * 88, hy - 120], [hx + s * 92, hy - 22]], FUR, ow);
  const hp = blobPts(hx, hy, { a: 100, b: 84, nTop: 2.0, nBot: 2.6, egg: -0.04, asym: 0, rot: rad(-8), noise: 0.008, seed: seed + 2 });
  p.shadedFill(hp, FUR, FUR_SH, light, 100);
  p.clip(hp, () => { for (const s of [-1, 1]) p.ell(hx + s * 26, hy + 34, 34, 28, WHITE, 0); p.poly([[hx - 12, hy - 60], [hx + 12, hy - 60], [hx + 22, hy + 16], [hx - 22, hy + 16]], WHITE, 0); });
  p.inkRing(hp, ow, thick);
  catFace(p, hx, hy - 4, o, expr, look, 1);
};

// ---------------- props (cards) ----------------
/** enamel bowl, 600 x 320: label 'OSCAR' or the repainted 'UNSINKABLE SAM' (reveal 0..1 = brush progress) */
export const bowl = (p, o = {}) => {
  const { label = 'OSCAR', reveal = 1 } = o, g = p.g;
  const body = [[50, 70], [550, 70], [470, 300], [130, 300]];
  p.poly(body, '#c63a3d', 10);
  p.ell(300, 70, 252, 40, '#f4efe4', 10);
  p.ell(300, 72, 216, 26, '#8c2a30', 0);
  p.poly([[120, 280], [480, 280], [470, 300], [130, 300]], '#f4efe4', 6);
  const text = (s, size, y, col) => { g.font = `900 ${size}px 'DejaVu Sans', Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(s, 300, y); };
  if (label === 'OSCAR') { text('OSCAR', 92, 182, '#fff6df'); return; }
  text('OSCAR', 72, 140, '#fff6df');
  g.save(); g.beginPath(); g.rect(0, 0, 80 + 460 * clamp(reveal * 2, 0, 1), 320); g.clip();
  p.stroke([[150, 146], [450, 134]], 26, '#22263a'); g.restore();
  g.save(); g.beginPath(); g.rect(0, 0, 70 + 470 * clamp(reveal * 2 - 1, 0, 1), 320); g.clip();
  text('UNSINKABLE', 54, 205, '#ffd85a'); text('SAM', 78, 262, '#ffd85a'); g.restore();
};

/** life ring with curved name on the top arc, 600 x 600 */
export const ring = (p, o = {}) => {
  const { label = 'BISMARCK' } = o, g = p.g;
  p.ell(300, 300, 270, 270, '#f7f2e6', 10);
  for (const a of [35, 145, 215, 325]) p.ell(300, 300, 270, 270, null, 0); // keep outline order
  g.save(); g.beginPath(); g.arc(300, 300, 270, 0, Math.PI * 2); g.arc(300, 300, 140, 0, Math.PI * 2, true); g.clip();
  for (const a of [20, 160]) { g.fillStyle = '#d4353a'; g.beginPath(); g.moveTo(300, 300); g.arc(300, 300, 280, rad(a), rad(a + 42)); g.closePath(); g.fill(); }
  g.fillStyle = '#d4353a'; g.beginPath(); g.moveTo(300, 300); g.arc(300, 300, 280, rad(70), rad(110)); g.closePath(); g.fill();
  g.restore();
  p.ell(300, 300, 270, 270, null, 10); p.ell(300, 300, 140, 140, null, 10);
  g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(300, 300, 136, 0, Math.PI * 2); g.fill(); g.restore();
  // rope loops
  for (const a of [0, 90, 180, 270]) { const x = 300 + 270 * Math.cos(rad(a + 45)), y = 300 + 270 * Math.sin(rad(a + 45)); p.ell(x, y, 22, 22, null, 8); }
  // curved text, left -> right across the top
  const n = label.length, span = Math.min(150, 13.5 * n), a0 = -90 - span / 2;
  g.fillStyle = '#1d2747'; g.font = `900 64px 'DejaVu Sans', Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = rad(a0 + (span * (i + 0.5)) / n);
    g.save(); g.translate(300 + 205 * Math.cos(a), 300 + 205 * Math.sin(a)); g.rotate(a + Math.PI / 2); g.fillText(label[i], 0, 0); g.restore();
  }
};

/** tall water column from a torpedo hit, 600 x 1200; t 0..1 */
export const column = (p, t) => {
  const rise = Math.sin(clamp(t * 1.6, 0, 1) * Math.PI / 2), fall = clamp((t - 0.55) / 0.45, 0, 1);
  const top = 1150 - 1000 * rise + 500 * fall * fall, w = 120 + 180 * t;
  if (t >= 1) return;
  const blobs = [];
  for (let i = 0; i < 9; i++) { const y = 1150 - (1150 - top) * (i / 8); blobs.push([300 + 40 * Math.sin(i * 2.1 + t * 3), y, w * (0.55 + 0.45 * (1 - i / 9)) * (1 - 0.4 * fall)]); }
  for (const [x, y, r] of blobs) p.ell(x, y, r, r * 0.8, '#ffffff', 10);
  for (const [x, y, r] of blobs) p.ell(x, y, r * 0.85, r * 0.68, '#ffffff', 0);
  for (const [x, y, r] of blobs.slice(0, 5)) p.ell(x + r * 0.2, y + r * 0.2, r * 0.45, r * 0.35, '#cfeeff', 0);
  for (let i = 0; i < 10; i++) { const a = rad(200 + i * 14), d = 200 + 400 * t; const x = 300 + d * Math.cos(a) * 0.9, y = top + 120 + d * Math.sin(a) + 900 * t * t; if (y < 1180) p.ell(x, y, 22, 28, '#ffffff', 7); }
};

/** smoke / steam puff (tinted), 300 x 300 */
export const puff = (p, t, col = '#cfcac4', alpha = 1) => {
  for (let i = 0; i < 5; i++) {
    const a = rad(160 + i * 55), d = 30 + 80 * t, r = (40 + 22 * (i % 2)) * (0.6 + 0.6 * t);
    const c = col.startsWith('#') ? `rgba(${parseInt(col.slice(1, 3), 16)},${parseInt(col.slice(3, 5), 16)},${parseInt(col.slice(5, 7), 16)},${(alpha * (1 - t)).toFixed(3)})` : col;
    p.ell(150 + d * Math.cos(a), 160 + d * 0.5 * Math.sin(a) - 40 * t, r, r * 0.85, c, 0);
  }
};

/** torpedo wake: foam line on a 1024 x 128 canvas, head at the right, length k 0..1 */
export const wake = (p, k) => {
  const g = p.g, x1 = 40 + 960 * k;
  if (k <= 0) return;
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.beginPath(); g.moveTo(x1, 64); g.lineTo(Math.max(0, x1 - 900), 40); g.lineTo(Math.max(0, x1 - 900), 88); g.closePath(); g.fill();
  for (let i = 0; i < 24; i++) { const x = x1 - rnd(3, i) * Math.min(x1, 700), y = 64 + (rnd(5, i) - 0.5) * 40 * (1 - (x1 - x) / 900); g.beginPath(); g.arc(x, y, 6 + rnd(7, i) * 8, 0, 7); g.fill(); }
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x1 - 10, 64, 34, 20, 0, 0, 7); g.fill();
};

/** spray droplets (cat shaking off water), 600 x 600; t 0..1 */
export const spray = (p, t) => {
  for (let i = 0; i < 18; i++) {
    const a = rad(rnd(11, i) * 360), d = 120 + 220 * t * (0.6 + 0.4 * rnd(12, i)), r = 13 * (1 - t) + 3;
    p.ell(300 + d * Math.cos(a), 300 + d * Math.sin(a) + 120 * t * t, r, r * 1.2, WATER, 4);
  }
};

export const zzz = (p, t) => {
  const g = p.g;
  g.font = `900 90px 'DejaVu Sans', Arial, sans-serif`; g.textAlign = 'center';
  for (let i = 0; i < 3; i++) {
    const u = (t + i / 3) % 1, x = 120 + 120 * u + 30 * Math.sin(u * 6), y = 260 - 200 * u, s = 0.5 + 0.6 * u;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.sin(u * Math.PI);
    g.lineWidth = 12; g.strokeStyle = INK; g.strokeText('z', 0, 0); g.fillStyle = '#ffffff'; g.fillText('z', 0, 0); g.restore();
  }
};

export const bubbles = (p, t, seed = 1) => {
  for (let i = 0; i < 9; i++) {
    const u = (t * 1.3 + rnd(seed, i)) % 1, x = 150 + (rnd(seed, i + 9) - 0.5) * 200 + 14 * Math.sin(u * 9 + i), y = 290 - 260 * u, r = 8 + 14 * rnd(seed, i + 4);
    if (u < 0.95) { p.ell(x, y, r, r, '#d8f2ff', 4); p.dot(x - r * 0.35, y - r * 0.35, r * 0.25, '#ffffff'); }
  }
};

export const moon = (p) => { p.ell(300, 300, 250, 250, '#fff6d6', 0); p.ell(230, 260, 44, 40, '#efe2b4', 0); p.ell(360, 380, 30, 26, '#efe2b4', 0); p.ell(370, 220, 22, 20, '#efe2b4', 0); };

export const brush = (p) => {
  p.band([[100, 500], [420, 140]], '#9a6a3a', 26, 6, 'round');
  p.poly([[400, 120], [470, 60], [520, 110], [450, 175]], '#c9ccd2', 6);
  p.poly([[470, 60], [540, 10], [570, 40], [520, 110]], '#ffd85a', 6);
};

// ---------------- dispatcher ----------------
/** design size per kind and the drawing; returns [designW, designH] */
export const DESIGN = { sailor: [600, 1000], cat: [600, 600], bowl: [600, 320], ring: [600, 600], splash: [800, 800], column: [600, 1200], burst: [500, 500],
  puff: [300, 300], ripple: [600, 600], wake: [1024, 128], spray: [600, 600], zzz: [300, 300], bubbles: [300, 300], cloud: [600, 300], moon: [600, 600], brush: [600, 600], blob: [128, 128] };

export const drawCard = (g, cw, ch, s) => {
  const [dw, dh] = DESIGN[s.kind];
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch);
  g.setTransform(cw / dw, 0, 0, ch / dh, 0, 0);
  const p = new Pen(g);
  switch (s.kind) {
    case 'sailor': bodyFront(p, s.outfit, s.opts); break;
    case 'cat': cat(p, s.opts); break;
    case 'bowl': bowl(p, s.opts); break;
    case 'ring': ring(p, s.opts); break;
    case 'splash': fxSplash(p, s.t); break;
    case 'column': column(p, s.t); break;
    case 'burst': fxBurst(p, s.t, s.col ?? '#ffd25a', 12, 50, 240); break;
    case 'puff': puff(p, s.t, s.col, s.alpha ?? 1); break;
    case 'ripple': fxRing(p, s.t); break;
    case 'wake': wake(p, s.t); break;
    case 'spray': spray(p, s.t); break;
    case 'zzz': zzz(p, s.t); break;
    case 'bubbles': bubbles(p, s.t, s.seed ?? 1); break;
    case 'cloud': fxCloud(p, s.seed ?? 1); break;
    case 'moon': moon(p); break;
    case 'brush': brush(p); break;
    case 'blob': fxBlob(p, s.col ?? '#9aa0b8'); break;
  }
};
