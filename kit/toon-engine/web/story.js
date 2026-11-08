// "The Cat Who Sank Three Ships": every shot as pure functions of the frame. 1509 frames @ 30 fps, timed to the voiceover.
import { wave } from './waves.js';
import { rating, officer } from './cast.js';

export const TOTAL = 1509;
const FPS = 30;
// ---------- easing ----------
const c01 = (x) => Math.max(0, Math.min(1, x));
const ss = (x) => { x = c01(x); return x * x * x * (x * (x * 6 - 15) + 10); };
const eo = (x) => 1 - Math.pow(1 - c01(x), 3);
const ei = (x) => Math.pow(c01(x), 2.4);
const back = (x) => { x = c01(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const spring = (fr, k = 0.55, d = 0.16) => (fr <= 0 ? 0 : 1 - Math.exp(-d * fr) * Math.cos(k * fr));
const seg = (f, a, b) => c01((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const add3 = (a, b) => a.map((v, i) => v + b[i]);
const EASE = { ss, eo, ei, lin: c01 };
const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------- lights ----------
export const LIGHTS = {
  day: { sun: { az: 130, el: 44, col: '#fff3dc', int: 2.5 }, hemi: { sky: '#cfe8ff', ground: '#6f8494', int: 1.25 }, fog: '#cfe5f4', zen: '#4f9be0', sea: '#ffffff', card: [1, 1, 1], chop: 1,
    grade: { sat: 1.12, gain: [1.02, 1.0, 0.98], lift: [0.0, 0.0, 0.01] } },
  golden: { sun: { az: 62, el: 17, col: '#ffd3a2', int: 2.6 }, hemi: { sky: '#d6cde8', ground: '#5a5470', int: 1.1 }, fog: '#f6c99e', zen: '#6a7fc4', sea: '#a9c4ff', card: [1.04, 0.9, 0.78], chop: 1.15,
    grade: { sat: 1.1, gain: [1.05, 0.98, 0.9], lift: [0.015, 0.005, 0.0] } },
  dusk: { sun: { az: 118, el: 10, col: '#ff9a6e', int: 2.5 }, hemi: { sky: '#b48ab0', ground: '#3d3858', int: 0.95 }, fog: '#e79a86', zen: '#3e4386', sea: '#a3b2ff', card: [0.95, 0.8, 0.82], chop: 1.35,
    grade: { sat: 1.08, gain: [1.04, 0.94, 0.94], lift: [0.02, 0.0, 0.02] } },
  night: { sun: { az: 300, el: 32, col: '#a9bfff', int: 1.2 }, hemi: { sky: '#40568f', ground: '#121a30', int: 0.75 }, fog: '#23365e', zen: '#0b1430', sea: '#6f86b8', card: [0.62, 0.68, 0.92], chop: 0.8,
    grade: { sat: 1.0, gain: [0.95, 1.0, 1.08], lift: [0.0, 0.005, 0.02] }, fogNear: 120, fogFar: 1600 },
};

// ---------- word frames (from the voiceover) ----------
// key words: three 44, both 93, sides 108, war 132 | bismarck 301, sank 325 | sailors 399, found 416, floating 441, plank 465
// named 494, oscar 515 | torpedoed 614, sank 653 | oscar 672, floated 698 | called 762, unsinkable 780, sam 810
// ark 881, royal 892, carrier 917, helped 936, sink 947, bismarck 958 | torpedo 1021, hit 1044, sank 1072, too 1085
// sam 1130, board 1159, soaking 1178, wet 1196, furious 1218 | never 1300, unlucky 1315, one 1336 | sent 1369, land 1403
// lucky 1424, cat 1443, unlucky 1463, ships 1489
const CAT_H = 0.62, SAIL_H = 2.2;
const FLASHES = [155, 345, 535, 980, 1345];
export const flashAt = (f) => { for (const a of FLASHES) { const k = f - a; if (k >= 0 && k < 6) return [1, 0.82, 0.6, 0.38, 0.2, 0.07][k]; } return 0; };

// ---------- helpers ----------
const blinkAt = (f, seed) => { const per = 70 + ((seed * 37) % 45), ph = (f + seed * 23) % per; return ph < 4 ? [0.5, 1, 1, 0.5][ph] : 0; };
const camKeys = (keys, f) => {
  let i = 0; while (i < keys.length - 2 && f >= keys[i + 1].f) i++;
  const a = keys[i], b = keys[i + 1] ?? a, t = b === a ? 0 : (EASE[a.e ?? 'ss'])((f - a.f) / (b.f - a.f));
  return { pos: L3(a.pos, b.pos, t), tgt: L3(a.tgt, b.tgt, t), fov: lerp(a.fov ?? 40, b.fov ?? 40, t), roll: lerp(a.roll ?? 0, b.roll ?? 0, t) };
};
/** flip-shake: 7-frame decaying jolt */
const kick = (cam, f, at, amp) => {
  const k = f - at; if (k < 0 || k > 12) return cam;
  const e = Math.exp(-k * 0.35) * Math.sin(k * 2.2) * amp;
  return { ...cam, pos: add3(cam.pos, [e * 0.6, e, 0]), tgt: add3(cam.tgt, [e * 0.3, e * 0.6, 0]), roll: (cam.roll ?? 0) + e * 6 };
};
const floatAt = (x, z, f, damp = 0.7) => { const [h, dx, dz] = wave(x, z, f / FPS); return { y: h, rx: -Math.atan(dz) * damp, rz: Math.atan(dx) * damp }; };
/** world point of a ship-local point (pivot: Rx(roll)*Rz(pitch), then yaw, then root) */
const shipPt = (st, p) => {
  const cz = Math.cos(st.pitch ?? 0), sz = Math.sin(st.pitch ?? 0), cx = Math.cos(st.roll ?? 0), sx = Math.sin(st.roll ?? 0);
  let x = p[0] * cz - p[1] * sz, y = p[0] * sz + p[1] * cz, z = p[2];
  const y2 = y * cx - z * sx, z2 = y * sx + z * cx; y = y2 + (st.y ?? 0); z = z2; x += st.px ?? 0;
  const cy = Math.cos(st.yaw ?? 0), sy = Math.sin(st.yaw ?? 0);
  return [st.x + x * cy + z * sy, y, st.z - x * sy + z * cy];
};
const bob = (f, s = 1, ph = 0) => ({ roll: 0.012 * s * Math.sin(f * 0.07 + ph), pitch: 0.006 * s * Math.sin(f * 0.05 + ph + 1), y: 0.15 * s * Math.sin(f * 0.06 + ph) });
const catC = (id, f, pos, o = {}, x = {}) => ({ id, kind: 'cat', opts: { t: f / FPS, blink: blinkAt(f, 3), ...o }, pos, h: CAT_H, shadow: true, ...x });
const sailC = (id, f, pos, v, o = {}, x = {}) => ({ id, kind: 'sailor', outfit: v === 'off' ? officer() : rating(v), opts: { mode: 'stand', facing: 0, seed: (typeof v === 'number' ? v : 7) * 3 + 2, blink: blinkAt(f, 5 + (typeof v === 'number' ? v : 7)), ...o }, pos, h: SAIL_H, shadow: true, roll: 0.012 * Math.sin(f * 0.09 + (typeof v === 'number' ? v : 2)), ...x });
const blob = (id, pos, r = 0.5) => ({ id, kind: 'blob', flat: true, pos: [pos[0], pos[1] + 0.012, pos[2]], h: r, d: r * 0.7, col: '#8a90a8' });
const clouds = (cx = 0, cz = 0) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
  const a = i * 0.63 + 0.4, r = 1100 + 500 * hash(i, 2);
  return { id: 'cloud' + i, kind: 'cloud', seed: i, pos: [cx + r * Math.cos(a), 160 + 220 * hash(i, 3), cz + r * Math.sin(a)], h: 110 + 90 * hash(i, 4), anchor: 'center', fog: false };
});
const ripple = (id, pos, t, size = 2) => ({ id, kind: 'ripple', t: c01(t), flat: true, pos: [pos[0], pos[1] + 0.03, pos[2]], h: size, d: size });
const bubbleC = (id, pos, t, h = 0.6, seed = 1) => ({ id, kind: 'bubbles', t, seed, pos, h, fog: true });
const splashC = (id, pos, t, h) => ({ id, kind: 'splash', t: c01(t), pos: [pos[0], pos[1] - h * 0.12, pos[2]], h });
/** sunk ship pose: stern up */
const sternUp = (x, z, yaw, pitch, y) => ({ x, z, yaw, pitch, y, roll: 0.15 });
const WR = [[-18, -115, 0.7, -0.85, -16], [3, -90, -0.5, -0.95, -8.5], [24, -140, 0.4, -0.75, -19]];
const wrecks = (f, dn = () => 0) => ({ bis: sternUp(WR[0][0], WR[0][1], WR[0][2], WR[0][3], WR[0][4] + 0.3 * Math.sin(f * 0.05) + dn(0)), des: sternUp(WR[1][0], WR[1][1], WR[1][2], WR[1][3], WR[1][4] + dn(1)), car: sternUp(WR[2][0], WR[2][1], WR[2][2], WR[2][3], WR[2][4] + dn(2)) });

// ---------- shots ----------
const S = [];
const shot = (o) => { S.push(o); return o; };

// 1. hook: Sam on a plank, three sterns behind him
shot({ f0: 0, f1: 155, light: 'day', shadow: { c: [0, 0, 0], r: 12 },
  cam: (f) => camKeys([
    { f: 0, pos: [0.18, 0.5, 1.45], tgt: [0, 0.4, 0], e: 'lin' },
    { f: 40, pos: [0.14, 0.52, 1.3], tgt: [0, 0.41, 0], e: 'ss' },
    { f: 86, pos: [0.12, 0.95, 3.3], tgt: [0.6, 3.0, -45], e: 'lin' },
    { f: 155, pos: [0.2, 1.0, 3.65], tgt: [0.8, 3.1, -45] }], f),
  dof: (f) => ({ cInf: lerp(11, 3.5, ss(seg(f, 40, 86))), focus: [0, 0.42, 0] }),
  world: (f) => {
    const pl = floatAt(0, 0, f);
    return { plank: { pos: [0, pl.y + 0.02, 0], rx: pl.rx, rz: pl.rz, ry: 0.25 },
      ...wrecks(f) };
  },
  cards: (f) => {
    const pl = floatAt(0, 0, f);
    const look = f < 90 ? 0 : f < 104 ? -ss(seg(f, 90, 96)) : f < 128 ? lerp(-1, 1, ss(seg(f, 104, 110))) : lerp(1, 0, ss(seg(f, 128, 138)));
    return [catC('sam', f, [0, pl.y + 0.08, 0], { expr: 'grumpy', look }, { roll: pl.rz * 0.5 }), blob('sam_b', [0, pl.y + 0.08, 0], 0.4),
      ...[0, 1, 2].map((i) => ripple('rip' + i, [WR[i][0] + 4, 0, WR[i][1] + 3], ((f / 50 + i * 0.33) % 1), 30)), ...clouds()];
  } });

// 2. Bismarck at golden hour; lurch on "Bismarck", bow-up and under on "sank"
shot({ f0: 155, f1: 345, light: 'golden', shadow: { c: [0, 5, 0], r: 60 },
  cam: (f) => kick(camKeys([
    { f: 155, pos: [66, 6, 34], tgt: [4, 10, 0], e: 'lin' },
    { f: 300, pos: [54, 7, 46], tgt: [-2, 10, 0], e: 'ss' },
    { f: 345, pos: [50, 6, 50], tgt: [-4, 8, 0], roll: -3 }], f), f, 300, 0.5),
  dof: () => ({ cInf: 0 }),
  world: (f) => {
    const b = bob(f, 1), lurch = f >= 299 ? 0.07 * Math.exp(-(f - 299) * 0.08) * Math.sin((f - 299) * 0.35) : 0;
    const s = ei(seg(f, 316, 345));
    return { bis: { x: 0, z: 0, yaw: 0, roll: b.roll + lurch + 0.25 * s, pitch: b.pitch + 0.72 * ss(seg(f, 312, 340)), y: b.y - 26 * s } };
  },
  cards: (f) => {
    const out = [...clouds()];
    for (let i = 0; i < 6; i++) { // funnel smoke
      const k = ((f - 155) / 55 + i / 6) % 1; if (f > 330) break;
      out.push({ id: 'smk' + i, kind: 'puff', t: k, col: '#8d8892', alpha: 0.85, pos: [-4 - 20 * k, 22 + 13 * k, -2 - 8 * k], h: 5 + 12 * k, anchor: 'center' });
    }
    if (f >= 316) out.push(splashC('spl', [-4, 0, 6], seg(f, 316, 345), 22), ripple('rr', [0, 0, 0], seg(f, 318, 345), 90), bubbleC('bub', [0, 0.5, 8], (f - 316) / 30, 10));
    return out;
  } });

// 3. hours later: destroyer arrives, sailors at the rail, rack focus to Sam on the plank
const desArr = (f) => { const k = eo(seg(f, 345, 402)); return { x: lerp(34, 2, k), z: -6, yaw: Math.PI, ...bob(f, 0.6) }; };
shot({ f0: 345, f1: 480, light: 'day', shadow: { c: [0, 2, -3], r: 18 },
  cam: (f) => camKeys([
    { f: 345, pos: [1.6, 0.85, 3.6], tgt: [14, 3.2, -8], e: 'ss' },
    { f: 392, pos: [1.3, 0.8, 4.6], tgt: [4, 3.2, -6], e: 'ss' },
    { f: 410, pos: [0.7, 0.9, 5.6], tgt: [0, 2.5, -3], e: 'lin' },
    { f: 480, pos: [0.45, 0.85, 4.9], tgt: [0, 2.2, -3] }], f),
  dof: (f) => ({ cInf: 7, focus: f < 436 ? [0, 4.6, -3.6] : L3([0, 4.6, -3.6], [0, 0.4, 0], ss(seg(f, 436, 450))) }),
  world: (f) => { const pl = floatAt(0, 0, f); return { plank: { pos: [0, pl.y + 0.02, 0], rx: pl.rx, rz: pl.rz, ry: -0.3 }, des: desArr(f) }; },
  cards: (f) => {
    const pl = floatAt(0, 0, f), d = desArr(f), rg = floatAt(0.62, 0.6, f);
    const deck = (lx, lz) => shipPt(d, [lx, 3.4, lz]);
    const fnd = f >= 414;
    return [catC('sam', f, [0, pl.y + 0.08, 0], { expr: 'grumpy', look: f > 420 ? 0 : 0.6 }, { roll: pl.rz * 0.5 }),
      { id: 'ring', kind: 'ring', opts: { label: 'BISMARCK' }, pos: [0.62, rg.y - 0.24, 0.6], h: 0.74, lean: -0.45 },
      ripple('rip', [0.62, 0, 0.6], (f / 40) % 1, 1.6),
      sailC('s1', f, deck(1.1, -2.6), 0, { expr: fnd ? 'shock' : 'neutral', wave: fnd ? 0.3 + 0.2 * Math.sin(f * 0.4) : undefined }),
      sailC('s2', f, deck(2.7, -2.6), 1, { expr: f >= 422 ? 'grin' : 'neutral' }),
      ...clouds()];
  } });

// 4. insert: the OSCAR bowl lands on deck in front of Sam
const DES0 = { x: 0, z: 0, yaw: 0, y: 0 };
shot({ f0: 480, f1: 535, light: 'day', shadow: { c: [-8, 3.4, 1], r: 6 },
  cam: (f) => camKeys([{ f: 480, pos: [-7.45, 3.82, 2.75], tgt: [-7.9, 3.62, 0.95], e: 'lin' }, { f: 535, pos: [-7.55, 3.76, 2.45], tgt: [-7.9, 3.62, 0.95] }], f),
  dof: () => ({ cInf: 9, focus: [-7.75, 3.6, 1.35] }),
  world: () => ({ des: DES0 }),
  cards: (f) => {
    const land = 513, y = f < 492 ? 1.2 : f < land ? lerp(0.9, 0, ei(seg(f, 492, land))) : 0.04 * Math.exp(-(f - land) * 0.4) * Math.abs(Math.sin((f - land) * 0.9));
    return [catC('sam', f, [-8.0, 3.4, 0.7], { expr: f >= 517 ? 'sniff' : 'grumpy', look: f >= 505 ? 0.3 : 0 }), blob('sam_b', [-8.0, 3.4, 0.7], 0.45),
      { id: 'bowl', kind: 'bowl', opts: { label: 'OSCAR' }, pos: [-7.72, 3.4 + y, 1.32], h: 0.2, shadow: true }, blob('bowl_b', [-7.72, 3.4, 1.32], 0.34)];
  } });

// 5. five months later, dusk: destroyer cruising, torpedo wake, hit on "torpedoed", sinks on "sank"
const desCruise = (f) => {
  const b = bob(f, 1.2), hit = f >= 612 ? Math.exp(-(f - 612) * 0.07) * Math.sin((f - 612) * 0.4) * 0.12 : 0, s = ei(seg(f, 640, 665));
  return { x: -12 + (f - 535) * 0.16 * (1 - 0.6 * ss(seg(f, 612, 650))), z: 0, yaw: 0, roll: b.roll + hit + 0.2 * ss(seg(f, 615, 645)), pitch: b.pitch + 0.55 * ss(seg(f, 636, 662)), y: b.y - 0.6 * ss(seg(f, 612, 640)) - 14 * s };
};
shot({ f0: 535, f1: 665, light: 'dusk', shadow: { c: [0, 3, 0], r: 30 },
  cam: (f) => kick(camKeys([{ f: 535, pos: [-20, 4.5, 58], tgt: [-6, 4.5, 0], e: 'lin' }, { f: 612, pos: [-8, 4.8, 54], tgt: [2, 4.5, 0], e: 'ss' }, { f: 665, pos: [-4, 3.8, 50], tgt: [4, 3.5, 0], roll: 4 }], f), f, 612, 1.0),
  dof: () => ({ cInf: 0 }),
  world: (f) => ({ des: desCruise(f) }),
  cards: (f) => {
    const d = desCruise(f), hx = 3.5, out = [...clouds()];
    const k = seg(f, 584, 612);
    if (f >= 584 && f < 614) out.push({ id: 'wake', kind: 'wake', t: k, flat: true, spin: Math.PI / 2, pos: [hx, 0.06, 3.2 + 32], h: 64, d: 3 });
    if (f >= 612) {
      out.push({ id: 'col', kind: 'column', t: seg(f, 612, 650), pos: [hx, 0, 3.6], h: 22 });
      if (f < 624) out.push({ id: 'bst', kind: 'burst', t: seg(f, 612, 624), col: '#ffd25a', pos: [hx, 2.2, 4.2], h: 9, anchor: 'center', glow: true });
      out.push(ripple('rr', [hx, 0, 3.6], seg(f, 612, 660), 40));
    }
    for (let i = 0; i < 5; i++) { const kk = ((f - 535) / 45 + i / 5) % 1; if (f < 640) out.push({ id: 'smk' + i, kind: 'puff', t: kk, col: '#6f6a78', alpha: 0.85, pos: add3(shipPt(d, [0, 8.2, 0]), [-8 * kk, 4 * kk, -2 * kk]), h: 3 + 5 * kk, anchor: 'center' }); }
    if (f >= 640) out.push(splashC('spl', [2, 0, 4], seg(f, 642, 665), 14), bubbleC('bub', [0, 0.4, 5], (f - 640) / 25, 6));
    return out;
  } });

// 6. "Oscar floated": the plank pops up with Sam and his bowl
const popY = (f, at) => (f < at ? -0.7 : lerp(-0.7, 0, back(seg(f, at, at + 9))));
shot({ f0: 665, f1: 722, light: 'dusk', shadow: { c: [0, 0, 0], r: 5 },
  cam: (f) => camKeys([{ f: 665, pos: [0.22, 0.66, 2.0], tgt: [0, 0.3, 0], e: 'lin' }, { f: 722, pos: [0.14, 0.62, 1.7], tgt: [0, 0.33, 0] }], f),
  dof: () => ({ cInf: 9, focus: [0, 0.4, 0] }),
  world: (f) => { const pl = floatAt(0, 0, f); const y = popY(f, 668); return { plank: { pos: [0, pl.y + 0.02 + y, 0], rx: pl.rx + (f < 690 ? 0.2 * Math.exp(-(f - 668) * 0.15) * Math.sin((f - 668) * 0.6) : 0), rz: pl.rz, ry: 0.2 } }; },
  cards: (f) => {
    const pl = floatAt(0, 0, f), y = popY(f, 668), bw = floatAt(0.55, 0.15, f), by = popY(f, 674);
    const out = [catC('sam', f, [0, pl.y + 0.08 + y, 0], { expr: 'grumpy', wet: 0.6 }, { roll: pl.rz * 0.5 }),
      { id: 'bowl', kind: 'bowl', opts: { label: 'OSCAR' }, pos: [0.52, bw.y - 0.06 + by, 0.18], h: 0.16, roll: bw.rz },
      ripple('rip', [0, 0, 0], seg(f, 668, 715), 2.4)];
    if (f >= 666 && f < 690) out.push(splashC('spl', [0, 0, -0.15], seg(f, 666, 690), 0.85));
    if (f < 672) out.push(bubbleC('bub', [0.05, -0.05, 0.1], (f - 640) / 20, 0.5, 3));
    return out;
  } });

// 7. lifeboat: sailors keep their distance; the bowl gets repainted UNSINKABLE SAM
const BOAT = (f) => ({ x: 0, z: 0, yaw: 0.35, ...bob(f, 0.5, 2), y: floatAt(0, 0, f).y });
shot({ f0: 722, f1: 825, light: 'day', shadow: { c: [0, 0.5, 0], r: 6 },
  cam: (f) => { const b = BOAT(f), P = (p) => shipPt({ ...b, y: 0 }, p); return camKeys([
    { f: 722, pos: P([3.55, 1.5, 0.35]), tgt: P([-1.5, 1.1, -0.05]), e: 'ss' },
    { f: 770, pos: P([3.3, 1.42, 0.4]), tgt: P([-1.2, 1.0, 0.0]), e: 'ss' },
    { f: 792, pos: P([1.78, 1.0, 1.05]), tgt: P([0.88, 0.7, 0.0]), e: 'lin' },
    { f: 825, pos: P([1.68, 0.98, 0.95]), tgt: P([0.88, 0.7, 0.0]) }], f); },
  dof: (f) => ({ cInf: lerp(5, 10, ss(seg(f, 772, 792))), focus: f < 780 ? null : shipPt(BOAT(f), [0.95, 0.6, 0.05]) }),
  world: (f) => ({ boat: BOAT(f) }),
  cards: (f) => {
    const b = BOAT(f), P = (p) => shipPt(b, p), rev = seg(f, 780, 806);
    const out = [catC('sam', f, P([0.65, 0.49, -0.12]), { expr: 'grumpy', look: -0.4 }),
      { id: 'bowl', kind: 'bowl', opts: { label: f >= 778 ? 'SAM' : 'OSCAR', reveal: rev }, pos: P([0.95, 0.49, 0.12]), h: 0.17, shadow: true },
      sailC('s1', f, P([-1.7, 0.12, -0.35]), 0, { expr: 'nervous', tilt: -4, wave: f >= 758 ? 0.6 : undefined }),
      sailC('s2', f, P([-2.25, 0.12, 0.45]), 1, { expr: 'nervous', tilt: -6 }),
      ...clouds()];
    if (f >= 778 && f < 812) { const bp = P([0.95, 0.6, 0.18]), k = Math.min(1, rev * 1.02); out.push({ id: 'brush', kind: 'brush', pos: [bp[0] - 0.12 + 0.24 * k * Math.cos(0.35), bp[1] + 0.02 * Math.sin(f * 0.9), bp[2] + 0.24 * k * Math.sin(-0.35) * -1], h: 0.16, anchor: 'center' }); }
    return out;
  } });

// 8. moved to the Ark Royal: sailor carries Sam along the flight deck, crane up to the wide carrier on "Ark Royal"
const CAR0 = (f) => ({ x: 0, z: 0, yaw: 0, ...bob(f, 0.35) });
const carryPos = (f) => [lerp(-5.5, 2.5, seg(f, 825, 885)), 13.8, -2];
shot({ f0: 825, f1: 905, light: 'day', shadow: { c: [-4, 14, 0], r: 46 },
  cam: (f) => camKeys([
    { f: 825, pos: [7.5, 15.3, -1.6], tgt: [-3, 14.9, -2], e: 'ss' },
    { f: 862, pos: [8.5, 15.5, -1.8], tgt: [0, 14.9, -2], e: 'ss' },
    { f: 880, pos: [20, 24, -20], tgt: [0, 13, -1], e: 'eo' },
    { f: 900, pos: [60, 38, -66], tgt: [-2, 10, 0], e: 'lin' },
    { f: 905, pos: [61, 38.5, -67], tgt: [-2, 10, 0] }], f),
  dof: (f) => ({ cInf: lerp(6, 0, ss(seg(f, 862, 885))), focus: carryPos(f) }),
  world: (f) => ({ car: CAR0(f) }),
  cards: (f) => {
    const c = CAR0(f), sp = carryPos(f), ph = (f - 825) / 15;
    const wp = shipPt(c, sp), cp = shipPt(c, [sp[0] + 0.3, 13.8 + 0.95 + 0.02 * Math.cos(ph * Math.PI * 4), sp[2]]);
    return [sailC('s1', f, wp, 2, { mode: f < 885 ? 'stroll' : 'stand', phase: ph, expr: 'smile' }), blob('s1_b', wp, 0.9),
      catC('sam', f, cp, { expr: 'grumpy' }, { h: CAT_H * 0.95 }),
      sailC('s3', f, shipPt(c, [6, 13.8, 4.5]), 3, { expr: 'neutral' }), blob('s3_b', shipPt(c, [6, 13.8, 4.5]), 0.9),
      ...clouds()];
  } });

// 9. Sam by the island under the ARK ROYAL ring; side-eye on "helped sink Bismarck"
shot({ f0: 905, f1: 980, light: 'day', shadow: { c: [3, 14, 6], r: 6 },
  cam: (f) => camKeys([{ f: 905, pos: [3.3, 14.6, 2.55], tgt: [3.0, 14.62, 6.4], e: 'ss' }, { f: 980, pos: [3.18, 14.5, 3.5], tgt: [3.0, 14.5, 6.2] }], f),
  dof: () => ({ cInf: 7, focus: [3, 14.2, 5.6] }),
  world: () => ({ car: { x: 0, z: 0, yaw: 0, y: 0 } }),
  cards: (f) => {
    const sq = f >= 932;
    return [catC('sam', f, [3.0, 13.8, 5.6], { expr: sq ? 'squint' : 'grumpy', look: sq ? 0 : -0.5, tilt: sq ? 4 * ss(seg(f, 932, 940)) : 0 }), blob('sam_b', [3, 13.8, 5.6], 0.45),
      { id: 'ring', kind: 'ring', opts: { label: 'ARK ROYAL' }, pos: [3.0, 14.85, 6.58], h: 0.9, rot: [0, Math.PI, 0] }, ...clouds()];
  } });

// 10. weeks later, dusk: carrier hit on "hit", lists and slips under by "too"
const carHit = (f) => {
  const b = bob(f, 0.6), j = f >= 1042 ? Math.exp(-(f - 1042) * 0.08) * Math.sin((f - 1042) * 0.4) * 0.06 : 0, s = ei(seg(f, 1060, 1090));
  return { x: 0, z: 0, yaw: 0, roll: b.roll + j - 0.45 * ss(seg(f, 1045, 1080)), pitch: b.pitch + 0.35 * ss(seg(f, 1062, 1088)), y: b.y - 1.2 * ss(seg(f, 1042, 1062)) - 30 * s };
};
shot({ f0: 980, f1: 1100, light: 'dusk', shadow: { c: [0, 10, 0], r: 55 },
  cam: (f) => kick(camKeys([{ f: 980, pos: [66, 16, 58], tgt: [0, 10, 0], e: 'ss' }, { f: 1042, pos: [60, 13, 64], tgt: [-2, 10, 0], e: 'ss' }, { f: 1100, pos: [56, 9, 66], tgt: [-3, 5, 0], roll: -4 }], f), f, 1042, 1.2),
  dof: () => ({ cInf: 0 }),
  world: (f) => ({ car: carHit(f) }),
  cards: (f) => {
    const out = [...clouds()], hx = 6, hz = 6.8;
    if (f >= 1012 && f < 1044) out.push({ id: 'wake', kind: 'wake', t: seg(f, 1012, 1042), flat: true, spin: -Math.PI / 4 + Math.PI / 2, pos: [hx + 22, 0.06, hz + 22], h: 62, d: 3 });
    if (f >= 1042) {
      out.push({ id: 'col', kind: 'column', t: seg(f, 1042, 1082), pos: [hx, 0, hz + 0.8], h: 30 }, ripple('rr', [hx, 0, hz], seg(f, 1042, 1095), 60));
      if (f < 1054) out.push({ id: 'bst', kind: 'burst', t: seg(f, 1042, 1054), col: '#ffd25a', pos: [hx, 3, hz + 1.2], h: 12, anchor: 'center', glow: true });
    }
    if (f >= 1070) out.push(splashC('spl', [-6, 0, 10], seg(f, 1072, 1100), 24), bubbleC('bub', [0, 0.5, 10], (f - 1070) / 25, 10));
    return out;
  } });

// 11. "And there was Sam": pop-up, wet + furious, shake-off, tight CU
shot({ f0: 1100, f1: 1240, light: 'golden', shadow: { c: [0, 0, 0], r: 5 },
  cam: (f) => camKeys([
    { f: 1100, pos: [0.3, 0.45, 2.1], tgt: [0, 0.3, 0], e: 'ss' },
    { f: 1150, pos: [0.22, 0.46, 1.75], tgt: [0, 0.34, 0], e: 'ss' },
    { f: 1212, pos: [0.18, 0.46, 1.55], tgt: [0, 0.36, 0], e: 'eo' },
    { f: 1226, pos: [0.04, 0.5, 0.82], tgt: [0, 0.45, 0], e: 'lin' },
    { f: 1240, pos: [0.03, 0.5, 0.74], tgt: [0, 0.45, 0] }], f),
  dof: (f) => ({ cInf: 10, focus: [0, 0.42, 0] }),
  world: (f) => { const pl = floatAt(0, 0, f), y = popY(f, 1124); return { plank: { pos: [0, pl.y + 0.02 + y, 0], rx: pl.rx, rz: pl.rz, ry: -0.2 } }; },
  cards: (f) => {
    const pl = floatAt(0, 0, f), y = popY(f, 1124), shake = f >= 1174 && f < 1198 ? Math.sin((f - 1174) * 1.6) * 0.18 * (1 - seg(f, 1174, 1198)) : 0;
    const fur = f >= 1214;
    const out = [catC('sam', f, [0, pl.y + 0.08 + y, 0], { expr: fur ? 'furious' : 'grumpy', wet: 1 }, { roll: pl.rz * 0.5 + shake }), ripple('rip', [0, 0, 0], seg(f, 1124, 1170), 2.4)];
    if (f >= 1122 && f < 1146) out.push(splashC('spl', [0, 0, 0.1], seg(f, 1122, 1146), 1.4));
    if (f >= 1176 && f < 1200) out.push({ id: 'spray', kind: 'spray', t: seg(f, 1176, 1200), pos: [0, pl.y + 0.36, 0.05], h: 0.9, anchor: 'center' });
    if (fur) for (let i = 0; i < 2; i++) { const k = ((f - 1214) / 16 + i * 0.5) % 1; out.push({ id: 'stm' + i, kind: 'puff', t: k, col: '#ffffff', alpha: 0.85, pos: [(i ? 0.14 : -0.14) + (i ? 0.08 : -0.08) * k, pl.y + 0.62 + 0.18 * k, 0.02], h: 0.16 + 0.12 * k, anchor: 'center' }); }
    return out;
  } });

// 12. the twist, night: sting + push-in with roll; three sterns slip under one after another
shot({ f0: 1240, f1: 1345, light: 'night', shadow: { c: [0, 0, 0], r: 8 },
  cam: (f) => camKeys([{ f: 1240, pos: [0.2, 1.0, 3.6], tgt: [0.7, 3.2, -45], roll: 0, e: 'eo' }, { f: 1300, pos: [0.12, 0.8, 2.5], tgt: [0.5, 2.6, -45], roll: 3, e: 'ss' }, { f: 1345, pos: [0.1, 0.74, 2.25], tgt: [0.5, 2.5, -45], roll: 4 }], f),
  dof: () => ({ cInf: 4, focus: [0, 0.42, 0] }),
  world: (f) => {
    const pl = floatAt(0, 0, f), dn = (a) => -30 * ei(seg(f, a, a + 22));
    return { plank: { pos: [0, pl.y + 0.02, 0], rx: pl.rx, rz: pl.rz, ry: 0.25 },
      ...wrecks(f, (i) => dn(1306 + i * 8)) };
  },
  cards: (f) => {
    const pl = floatAt(0, 0, f), nv = f >= 1296;
    const out = [catC('sam', f, [0, pl.y + 0.08, 0], { expr: nv ? 'squint' : 'neutral', look: nv ? 0 : -0.7 }, { roll: pl.rz * 0.5 }),
      { id: 'moon', kind: 'moon', pos: [-260, 380, -1400], h: 150, anchor: 'center', fog: false, glow: true }];
    for (let i = 0; i < 3; i++) { const a = 1306 + i * 8; if (f >= a) out.push(ripple('rr' + i, [WR[i][0] + 3, 0, WR[i][1] + 3], seg(f, a, a + 35), 40)); }
    return out;
  } });

// 13. land: a sailor carries Sam to the bench outside the Sailors' Home; set down on "land"
const LX = 900, LZ = -500, LP = (x, y, z) => [LX + x, y, LZ + z];
const walk13 = (f) => lerp(-6.5, 1.6, ss(seg(f, 1345, 1392)));
shot({ f0: 1345, f1: 1415, light: 'day', shadow: { c: LP(-2, 3, -6), r: 16 },
  cam: (f) => camKeys([{ f: 1345, pos: LP(-6.6, 6.9, 11.5), tgt: LP(-7, 5.3, -8.5), e: 'lin' }, { f: 1356, pos: LP(-6.2, 6.8, 11.2), tgt: LP(-6.8, 5.25, -8.5), e: 'ss' }, { f: 1398, pos: LP(5.2, 4.4, 4.4), tgt: LP(1.0, 3.5, -2.8), e: 'ss' }, { f: 1415, pos: LP(5.0, 4.3, 4.2), tgt: LP(1.1, 3.45, -2.8) }], f),
  dof: () => ({ cInf: 2.5, focus: LP(1.6, 3.4, -2) }),
  world: () => ({ land: true, des: { x: LX + 260, z: LZ + 380, yaw: 0.2, y: 0 } }),
  cards: (f) => {
    const x = walk13(f), sp = LP(x, 2.4, -1.9), ph = (f - 1345) / 15, put = ss(seg(f, 1390, 1402));
    const held = LP(x + 0.25, 2.4 + 0.95, -1.75), seat = LP(2.0, 3.06, -2.6);
    const cp = L3(held, seat, put); cp[1] += 0.25 * Math.sin(put * Math.PI);
    return [sailC('s1', f, sp, 0, { mode: f < 1392 ? 'stroll' : 'stand', phase: ph, expr: 'smile' }), blob('s1_b', sp, 0.9),
      catC('sam', f, cp, { expr: put >= 1 ? 'smug' : 'grumpy' }), ...clouds(LX, LZ)];
  } });

// 14. "Lucky cat. Unlucky ships.": smug Sam, paw taps the bucket, the toy boat sinks on "ships"
shot({ f0: 1415, f1: 1509, light: 'day', shadow: { c: LP(2.2, 3, -2.6), r: 4 },
  cam: (f) => camKeys([{ f: 1415, pos: LP(2.3, 3.95, -0.45), tgt: LP(2.26, 3.25, -2.6), e: 'lin' }, { f: 1509, pos: LP(2.3, 3.88, -0.75), tgt: LP(2.26, 3.25, -2.6) }], f),
  dof: () => ({ cInf: 8, focus: LP(2.2, 3.3, -2.6) }),
  world: (f) => {
    const tip = ss(seg(f, 1462, 1478)), sink = ei(seg(f, 1474, 1490));
    return { land: true, des: { x: LX + 160, z: LZ - 420, yaw: 0.3, y: 0 }, toy: { y: -0.15 * sink + 0.004 * Math.sin(f * 0.3), rz: 0.85 * tip + 0.05 * Math.sin(f * 0.2), rx: 0.1 * Math.sin(f * 0.15), ry: 0.5 } };
  },
  cards: (f) => {
    const paw = f < 1452 ? 0 : f < 1462 ? back(seg(f, 1452, 1462)) : lerp(1, 0, ss(seg(f, 1470, 1484)));
    const out = [catC('sam', f, LP(2.0, 3.06, -2.6), { expr: f < 1418 ? 'grumpy' : 'smug', paw }), blob('sam_b', LP(2.0, 3.06, -2.6), 0.4)];
    if (f >= 1460) out.push(ripple('rip', LP(2.5, 3.2, -2.6), seg(f, 1460, 1500), 0.5));
    if (f >= 1486) out.push(bubbleC('bub', LP(2.5, 3.24, -2.6), (f - 1486) / 25, 0.22, 5));
    return out;
  } });

export const SHOTS = S;
export const shotAt = (f) => { let s = S[0]; for (const x of S) if (f >= x.f0) s = x; return s; };
export const lightFor = (f) => LIGHTS[shotAt(f).light];
export const camAt = (f) => shotAt(f).cam(f);
export const dofAt = (f) => shotAt(f).dof(f);
export const worldAt = (f) => shotAt(f).world(f);
export const cardsAt = (f) => shotAt(f).cards(f);
