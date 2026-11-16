// kit/char2d/stick.js - hand-drawn 2D character (our own design) for 3D worlds. Canvas 2D, no dependencies.
//
//   Stick.draw(ctx, x, y, s, pose, t)  x,y = feet on the ground (px), s = scale (1 = about 540 px tall), t = time (s)
//   Stick.pose('panic', {look:[.3,0]}) a named expression merged with overrides
//   Stick.alive(pose, t, seed)         adds the idle layers (breath, blink, eye darts, sway, weight shift, fidget)
//   Stick.act(from, to, since)         4-part move between two poses: anticipation, action, overshoot, settle,
//                                      with overlap (body first, head +3 f, hands +4 f, hair/tie +6 f)
//
// LINE BOIL: every path goes through a sketch layer that redraws it a little differently on every drawing
// (Stick.boilFps drawings a second: 24 = every frame, the default): the outline wobbles, the line weight changes and a second faint
// pencil line overshoots the ends. So no two frames are the same drawing, even when the pose holds.
(function (g) {
  const INK = '#16161c', SHADE = '#dccfbb', SHOE = '#1b1819';
  let SKIN = '#f6efe2', PANTS = '#2c3140', HAIR = '#2a2630';   // per character: pose.skin / pose.pants / pose.hairCol
  const BASE = { lean: 0, tilt: 0, squash: 0, bob: 0, look: [0, 0], lid: [0.62, 0.62], brow: [[0, 0], [0, 0]], pupil: 1,
    mouth: 'flat', open: 0, mw: 1, sweat: 0, blush: 0, hair: 0, tie: 0, shirt: '#2f6f7e', tieCol: '#c8452f',
    handL: [-80, 178], handR: [80, 175], footL: [-34, 0], footR: [34, 0], hip: [0, 0], shoulders: 0,
    // costume (strings switch at the middle of a blend): hat '' | 'top' | 'bowler' | 'cap' | 'bonnet'; coat = frock coat colour;
    // beard 0..1 (chin curtain); bowtie 0/1; prop '' | 'axe' held in the right hand at propAng (radians)
    skin: '#f6efe2', pants: '#2c3140', hairCol: '#2a2630', hat: '', hatCol: '#1d1a1c', hatTip: 0, coat: '', beard: 0, bowtie: 0,
    mitts: '', stubble: 1, tieOn: 1, prop: '', propAng: 0, pointL: 0, pointR: 0, holdL: null, holdR: null, holdAngL: 0, holdAngR: 0,
    goggles: 0, gogglesOn: 0, pencil: 0, toolbelt: 0, nose: 0, freckles: 0, plaster: 0, glasses: 0, moustache: 0, tuft: 0, capBack: 0, hairOff: [0, 0], hairRot: 0, turn: 0 };   // turn -1..1: face looks left/right (3/4 view; features slide, far ear hides)   // hairOff/hairRot: the hair block can leave the head (gags)
  // brow = [raise, angle] per eye (angle > 0 = inner end down = angry); hands/feet are offsets from the ground point, y up
  const EXPR = {
    deadpan: { lid: [0.5, 0.5], brow: [[-4, 0], [-4, 0]], mouth: 'flat' },
    smug: { lid: [0.42, 0.55], brow: [[6, -0.12], [-6, 0.3]], mouth: 'smirk', tilt: 0.1, lean: -0.05, handR: [52, 330], handL: [-60, 205] },
    panic: { lid: [1.15, 1.15], pupil: 0.55, brow: [[26, -0.35], [26, -0.35]], mouth: 'scream', open: 1, sweat: 1, hair: 1, tie: 1,
      shoulders: 16, handL: [-175, 420], handR: [170, 440], footL: [-62, 0], footR: [56, 0], hip: [0, -24], lean: -0.1, tilt: -0.06 },
    defeat: { lid: [0.3, 0.3], brow: [[2, -0.3], [2, -0.3]], mouth: 'frown', look: [0, 0.7], shoulders: -14, lean: 0.12, tilt: 0.2,
      handL: [-62, 160], handR: [54, 155], hip: [0, -8] },
    idea: { lid: [1, 1], brow: [[20, -0.1], [22, -0.1]], mouth: 'grin', open: 0.5, look: [0.2, -0.5], handR: [110, 500], handL: [-90, 215], tilt: -0.05 },
    angry: { lid: [0.55, 0.55], brow: [[-12, 0.45], [-12, 0.45]], mouth: 'teeth', shoulders: 10, lean: 0.08, handL: [-130, 205], handR: [128, 210], footL: [-48, 0], footR: [48, 0] },
    suspicious: { lid: [0.3, 0.62], brow: [[-10, 0.3], [14, -0.2]], mouth: 'side', look: [0.8, 0], tilt: -0.08, handR: [30, 345], handL: [-70, 215] },
    relief: { lid: [0.05, 0.05], brow: [[12, -0.25], [12, -0.25]], mouth: 'o', open: 0.5, shoulders: -8, tilt: 0.1, handR: [26, 320], sweat: 0.5 },
  };

  // ---------------------------------------------------------------- pose maths
  const lerp = (a, b, k) => a + (b - a) * k;
  function mixKeys(a, b, kOf) {
    const o = {};
    for (const key in a) {
      const x = a[key], y = b[key] ?? x, k = kOf(key);
      if (typeof x === 'number') o[key] = lerp(x, y, k);
      else if (Array.isArray(x)) o[key] = x.map((v, i) => Array.isArray(v) ? v.map((w, j) => lerp(w, y[i][j], k)) : lerp(v, y[i], k));
      else o[key] = k < 0.5 ? x : y;
    }
    return o;
  }
  const mix = (a, b, k) => mixKeys(a, b, () => k);
  const pose = (name, over) => Object.assign({}, BASE, EXPR[name] || {}, over || {});
  const GROUP = { hip: 0, lean: 0, squash: 0, footL: 0, footR: 0, shoulders: 2, tilt: 3, bob: 3, look: 2, lid: 3, brow: 3, pupil: 3,
    mouth: 3, open: 3, mw: 3, sweat: 4, blush: 4, handL: 4, handR: 4, hair: 6, tie: 6 };
  // 0 -> 1 with anticipation (dips below 0), a fast action, ~12 % overshoot and a damped settle
  function curve(x) {
    if (x <= 0) return 0;
    const ant = x < 0.2 ? -0.1 * Math.sin(Math.PI * x / 0.2) : 0;
    const y = x < 0.2 ? 0 : x - 0.2;
    return ant + (y > 0 ? 1 - Math.exp(-7 * y) * Math.cos(10 * y) : 0);
  }
  function act(from, to, since, frames = 16, fps = 24) {
    return mixKeys(from, to, (key) => curve((since * fps - (GROUP[key] ?? 3)) / frames));
  }

  // ---------------------------------------------------------------- idle layers: never still
  const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const ss = (x) => x * x * (3 - 2 * x);
  // opt = {eyes, fidget, shift, sway} multipliers (default 1). ACTING (user rule 2026-11-16): use calm values
  // ({eyes:.15, fidget:.3, shift:.5, sway:.6}) so idle life never reads as random business; the acting keys carry the meaning.
  function alive(p0, t, seed = 1, opt = {}) {
    const hold = {}; for (const k of ['holdL', 'holdR']) { hold[k] = p0[k]; }
    const p = JSON.parse(JSON.stringify(p0)), T = 2 * Math.PI; Object.assign(p, hold);
    const oE = opt.eyes ?? 1, oF = opt.fidget ?? 1, oS = opt.shift ?? 1, oW = opt.sway ?? 1;
    const br = Math.sin(T * 0.29 * t + seed) + 0.35 * Math.sin(T * 0.11 * t + seed * 3);           // breath
    p.shoulders += 3.2 * br; p.bob += 2.2 * br; p.squash += 0.015 * br;
    // weight shift every ~4 s, eased
    const k = Math.floor(t / 4 + h(seed)), side = h(k * 3.7 + seed) < 0.5 ? -1 : 1, prev = h((k - 1) * 3.7 + seed) < 0.5 ? -1 : 1;
    const u = ss(Math.min(((t / 4 + h(seed)) % 1) * 4 / 0.6, 1));
    const w = lerp(prev, side, u);
    p.hip[0] += oS * (9 * w + 3 * Math.sin(T * 0.37 * t + seed)); p.hip[1] -= oS * 3 * Math.abs(w); p.lean += oW * 0.012 * Math.sin(T * 0.23 * t + seed);
    p.tilt += oW * (0.035 * Math.sin(T * 0.17 * t + seed * 2) - 0.02 * w);
    // blink: irregular, 3 frames closed, sometimes double
    const P = 2.7, bk = Math.floor(t / P), bt = t - bk * P - h(bk + seed) * 1.4;
    const b1 = bt > 0 && bt < 0.17 ? 1 - Math.abs(bt / 0.085 - 1) : 0;
    const b2 = h(bk * 9 + seed) > 0.7 && bt > 0.25 && bt < 0.42 ? 1 - Math.abs((bt - 0.25) / 0.085 - 1) : 0;
    const shut = Math.min(1, Math.max(b1, b2) * 1.6);
    p.lid = p.lid.map((l) => l * (1 - shut) + 0.02 * shut);
    // eye darts: a new target every 0.6-1.8 s, snapped in 2 frames
    const dk = Math.floor(t / 0.9 + h(seed * 5)), dt = (t / 0.9 + h(seed * 5)) % 1;
    const tgt = (n) => [(h(n * 2.1 + seed) - 0.5) * 0.55, (h(n * 4.3 + seed) - 0.5) * 0.35];
    const a = tgt(dk - 1), b = tgt(dk), dd = ss(Math.min(dt * 0.9 * 12, 1));
    p.look = [p.look[0] + oE * lerp(a[0], b[0], dd), p.look[1] + oE * lerp(a[1], b[1], dd)];
    // hands fidget, never in sync; tie and hair drift
    p.handL[0] += oF * 5 * Math.sin(T * 0.41 * t + seed); p.handL[1] += oF * 4 * Math.sin(T * 0.53 * t + seed * 2) + 2.5 * br;
    p.handR[0] += oF * 5 * Math.sin(T * 0.47 * t + seed * 4); p.handR[1] += oF * 4 * Math.sin(T * 0.31 * t + seed * 5) + 2.5 * br;
    p.tie += 0.05 * Math.sin(T * 0.6 * t + seed); p.hair += 0.08 * (Math.sin(T * 0.5 * t) * 0.5 + 0.5);
    p.brow = p.brow.map(([r, an], i) => [r + 1.5 * Math.sin(T * 0.2 * t + i + seed), an]);
    return p;
  }

  // walk: ph = steps so far (1 = one step; 12 frames per step = normal walk), dir = -1 left / +1 right / 0 toward camera,
  // k = amount 0..1 (blend in/out at start and stop). Contact -> down -> passing -> up, arms opposite, head lag, face turns.
  function walk(p0, ph, dir = 1, k = 1, stride = 1) {
    if (k <= 0) return p0;
    const p = JSON.parse(JSON.stringify(p0)), a = ph * Math.PI, s = Math.sin(a), c = Math.cos(a); p.holdL = p0.holdL; p.holdR = p0.holdR;
    const sideL = Math.max(0, s), sideR = Math.max(0, -s);                      // which foot is in the air
    p.footL = [p.footL[0] + k * stride * (dir * 46 * c), p.footL[1] + k * 30 * sideL];
    p.footR = [p.footR[0] - k * stride * (dir * 46 * c), p.footR[1] + k * 30 * sideR];
    if (!dir) { p.footL[1] += k * 6 * sideL; p.footR[1] += k * 6 * sideR; }
    p.hip[1] += k * (-9 * Math.abs(c) + 4); p.hip[0] += k * (5 * s + dir * 6);    // down on contact, up on passing
    p.handL = [p.handL[0] - k * dir * 34 * c, p.handL[1] + k * 8 * Math.abs(c)]; p.handR = [p.handR[0] + k * dir * 34 * c, p.handR[1] + k * 8 * Math.abs(c)];
    p.lean -= k * dir * 0.06; p.bob += k * 3 * Math.cos(2 * a + 0.6); p.tilt += k * 0.03 * s;
    p.tie += k * (0.12 * s - dir * 0.15); p.turn = (p.turn || 0) * (1 - k) + k * dir * 0.8; p.squash += k * 0.05 * Math.max(0, -Math.cos(2 * a));
    return p;
  }

  // vary: a NEW body position from any expression (user rule 2026-11-14: never the same position twice). seed = a unique
  // number per beat (e.g. sentence index); amt 0..1. Changes arms (a gesture family), stance, lean, tilt, turn and weight.
  const GEST = [[[-70, 330], [95, 205]], [[-150, 260], [150, 255]], [[-40, 300], [40, 310]], [[-95, 175], [170, 360]], [[-170, 380], [70, 190]],
    [[-60, 245], [120, 420]], [[-110, 200], [60, 300]], [[-30, 360], [130, 230]], [[-135, 300], [100, 170]], [[-85, 420], [85, 180]]];
  function vary(p0, seed, amt = 1) {
    const p = Object.assign(JSON.parse(JSON.stringify(p0)), { holdL: p0.holdL, holdR: p0.holdR }), r = (k) => { const v = Math.sin(seed * 91.7 + k * 37.3) * 43758.5453; return v - Math.floor(v); };
    const gst = GEST[Math.floor(r(1) * GEST.length)], mir = r(2) < 0.5 ? 1 : -1, k = amt * 0.65;
    const gL = mir > 0 ? gst[0] : [-gst[1][0], gst[1][1]], gR = mir > 0 ? gst[1] : [-gst[0][0], gst[0][1]];
    p.handL = [lerp(p.handL[0], gL[0], k), lerp(p.handL[1], gL[1], k)]; p.handR = [lerp(p.handR[0], gR[0], k), lerp(p.handR[1], gR[1], k)];
    const st = (r(3) - 0.5) * 50 * amt; p.footL = [p.footL[0] - 12 * amt * r(4) + st * 0.4, p.footL[1]]; p.footR = [p.footR[0] + 12 * amt * r(5) + st * 0.4, p.footR[1]];
    p.lean += (r(6) - 0.5) * 0.16 * amt; p.tilt += (r(7) - 0.5) * 0.18 * amt; p.turn = (p.turn || 0) + (r(8) - 0.5) * 0.9 * amt;
    p.hip = [p.hip[0] + (r(9) - 0.5) * 24 * amt, p.hip[1] - r(10) * 10 * amt]; p.shoulders += (r(11) - 0.5) * 8 * amt;
    p.look = [p.look[0] + (r(12) - 0.5) * 0.5 * amt, p.look[1] + (r(13) - 0.5) * 0.3 * amt];
    return p;
  }

  // ---------------------------------------------------------------- sketch layer (line boil)
  let DRAW = 0, PATH = 0, MITT = '';   // MITT = glove colour (pose.mitts) for the hands
  const hb = (n) => { const s = Math.sin(n * 12.9898 + DRAW * 78.233) * 43758.5453; return s - Math.floor(s); };
  const wob = (x, k) => { const a = Math.floor(x), f = x - a, u = f * f * (3 - 2 * f); return (hb(a * 1.31 + k * 17.7) * (1 - u) + hb((a + 1) * 1.31 + k * 17.7) * u) * 2 - 1; };
  class Sk {
    constructor(c) { this.c = c; this.subs = []; this.cur = null; this.amp = 2.0; this.jit = null; this.key = 0; }
    beginPath() { this.subs = []; this.cur = null; this.jit = null; this.key = ++PATH; }
    _last() { return this.cur[this.cur.length - 1]; }
    moveTo(x, y) { this.cur = [[x, y]]; this.subs.push(this.cur); this.jit = null; }
    lineTo(x, y) { if (!this.cur) return this.moveTo(x, y); const p = this._last(), n = Math.max(1, Math.ceil(Math.hypot(x - p[0], y - p[1]) / 12));
      for (let i = 1; i <= n; i++) this.cur.push([p[0] + (x - p[0]) * i / n, p[1] + (y - p[1]) * i / n]); }
    quadraticCurveTo(cx, cy, x, y) { if (!this.cur) this.moveTo(cx, cy); const p = this._last(), n = Math.max(4, Math.ceil(Math.hypot(x - p[0], y - p[1]) / 10));
      for (let i = 1; i <= n; i++) { const u = i / n, v = 1 - u; this.cur.push([v * v * p[0] + 2 * v * u * cx + u * u * x, v * v * p[1] + 2 * v * u * cy + u * u * y]); } }
    bezierCurveTo(ax, ay, bx, by, x, y) { if (!this.cur) this.moveTo(ax, ay); const p = this._last(), n = 14;
      for (let i = 1; i <= n; i++) { const u = i / n, v = 1 - u; this.cur.push([v * v * v * p[0] + 3 * v * v * u * ax + 3 * v * u * u * bx + u * u * u * x, v * v * v * p[1] + 3 * v * v * u * ay + 3 * v * u * u * by + u * u * u * y]); } }
    arc(x, y, r, a0, a1, ccw) { this.ellipse(x, y, r, r, 0, a0, a1, ccw); }
    ellipse(x, y, rx, ry, rot, a0, a1, ccw) {
      let sw = a1 - a0; if (ccw) sw = -sw; const full = Math.abs(sw) >= 2 * Math.PI - 1e-3; sw = Math.max(-2 * Math.PI, Math.min(2 * Math.PI, sw)) * (ccw ? -1 : 1);
      const n = Math.max(12, Math.ceil((rx + ry) * 0.35)), cr = Math.cos(rot), sr = Math.sin(rot);
      const pt = (a) => { const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; return [x + ex * cr - ey * sr, y + ex * sr + ey * cr]; };
      if (full || !this.cur) this.moveTo(...pt(a0)); else this.lineTo(...pt(a0));
      for (let i = 1; i <= n; i++) this.cur.push(pt(a0 + sw * i / n));
      if (full) { this.cur.closed = true; this.cur = null; }
    }
    roundRect(x, y, w, h, r) {
      let [a, b, c, d] = Array.isArray(r) ? (r.length === 4 ? r : [r[0], r[1] ?? r[0], r[2] ?? r[0], r[3] ?? r[1] ?? r[0]]) : [r, r, r, r];
      const m = Math.min(Math.abs(w), Math.abs(h)) / 2; [a, b, c, d] = [a, b, c, d].map((v) => Math.min(v, m));
      this.moveTo(x + a, y); this.lineTo(x + w - b, y); this.ellipse(x + w - b, y + b, b, b, 0, -Math.PI / 2, 0);
      this.lineTo(x + w, y + h - c); this.ellipse(x + w - c, y + h - c, c, c, 0, 0, Math.PI / 2);
      this.lineTo(x + d, y + h); this.ellipse(x + d, y + h - d, d, d, 0, Math.PI / 2, Math.PI);
      this.lineTo(x, y + a); this.ellipse(x + a, y + a, a, a, 0, Math.PI, Math.PI * 1.5); this.closePath();
    }
    rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); }
    closePath() { if (!this.cur) return; const f = this.cur[0]; this.lineTo(f[0], f[1]); this.cur.closed = true; this.cur = null; }
    _jitter(key, ampMul) {
      return this.subs.map((s, si) => {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of s) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        const A = Math.min(this.amp, 0.05 * Math.hypot(x1 - x0, y1 - y0) + 0.2) * ampMul;   // small shapes wobble less
        const o = s.map((p, i) => [p[0] + wob(i * 0.2, key * 3 + si) * A, p[1] + wob(i * 0.2, key * 3 + si + 0.5) * A]);
        if (s.closed) o[o.length - 1] = o[0]; o.closed = s.closed; return o;
      });
    }
    _trace(J, over = 0) {
      const c = this.c; c.beginPath();
      for (const s of J) {
        if (s.length < 2) continue; let pts = s;
        if (over && !s.closed) { const e = (a, b) => { const d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; return [a[0] + (a[0] - b[0]) / d * over, a[1] + (a[1] - b[1]) / d * over]; };
          pts = [e(s[0], s[1]), ...s, e(s[s.length - 1], s[s.length - 2])]; }
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) c.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
        c.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); if (s.closed) c.closePath();
      }
    }
    _j() { return this.jit || (this.jit = this._jitter(this.key, 1)); }
    fill() { this._trace(this._j()); this.c.fill(); }
    clip() { this._trace(this._j()); this.c.clip(); }
    stroke() {
      const c = this.c, lw = c.lineWidth;
      c.lineWidth = lw * (0.82 + 0.36 * hb(this.key * 5.1)); this._trace(this._j()); c.stroke();
      if (lw >= 4) { const ga = c.globalAlpha; c.globalAlpha = ga * 0.4; c.lineWidth = lw * 0.3; this._trace(this._jitter(this.key + 9000, 1.6), 5 + 6 * hb(this.key)); c.stroke(); c.globalAlpha = ga; }
      c.lineWidth = lw;
    }
  }
  function sketch(c) {
    const s = new Sk(c);
    return new Proxy(s, { get(t, k) { if (k in t) { const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; } const v = c[k]; return typeof v === 'function' ? v.bind(c) : v; },
      set(t, k, v) { if (k in t) t[k] = v; else c[k] = v; return true; } });
  }

  // ---------------------------------------------------------------- body parts
  function ik(a, b, l1, l2, side, cx) {        // two-bone IK, elbow/knee on the outward side; stretches up to 15 % (rubber hose)
    let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1e-3; const st = Math.min(Math.max(d / (l1 + l2), 1), 1.15); l1 *= st; l2 *= st;
    const dd = Math.min(d, l1 + l2 - 0.01), ux = dx / d, uy = dy / d, x = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd), hh = Math.sqrt(Math.max(l1 * l1 - x * x, 0));
    const c1 = [a[0] + ux * x - uy * hh, a[1] + uy * x + ux * hh], c2 = [a[0] + ux * x + uy * hh, a[1] + uy * x - ux * hh];
    const score = (e) => side * (e[0] - cx) - 0.6 * e[1];
    return [score(c1) > score(c2) ? c1 : c2, [a[0] + ux * dd, a[1] + uy * dd]];
  }
  function tube(c, a, e, b, w0, w1, fill, lw) {   // a soft limb: a curve through the joint, tapered, round ends
    const P = [], n = 14, k = [2 * e[0] - (a[0] + b[0]) / 2, 2 * e[1] - (a[1] + b[1]) / 2];
    for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; P.push([v * v * a[0] + 2 * v * u * k[0] + u * u * b[0], v * v * a[1] + 2 * v * u * k[1] + u * u * b[1]]); }
    const L = [], R = [];
    P.forEach((p, i) => { const q = P[Math.min(i + 1, n)], r = P[Math.max(i - 1, 0)], tx = q[0] - r[0], ty = q[1] - r[1], d = Math.hypot(tx, ty) || 1;
      const w = lerp(w0, w1, i / n) * (1 + 0.08 * Math.sin(i / n * Math.PI)) / 2; L.push([p[0] - ty / d * w, p[1] + tx / d * w]); R.push([p[0] + ty / d * w, p[1] - tx / d * w]); });
    c.beginPath(); c.moveTo(...L[0]); L.forEach((p) => c.lineTo(...p));
    const ang = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]);
    const capB = ang(P[n], L[n]); c.ellipse(P[n][0], P[n][1], w1 / 2, w1 / 2, 0, capB, capB - Math.PI, true);
    for (let i = n; i >= 0; i--) c.lineTo(...R[i]);
    const capA = ang(P[0], R[0]); c.ellipse(P[0][0], P[0][1], w0 / 2, w0 / 2, 0, capA, capA - Math.PI, true); c.closePath();
    c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.stroke(); return P;
  }
  function hand(c, at, from, side, lw, point = 0) {        // mitten + thumb, pointing along the forearm; point 0..1 = index finger out
    const a = Math.atan2(at[1] - from[1], at[0] - from[0]);
    c.save(); c.translate(at[0], at[1]); c.rotate(a);
    if (point > 0.05) { c.beginPath(); c.roundRect(10, -6 - side * 4, 16 + 30 * point, 13, 6.5); c.fillStyle = SKIN; c.fill(); c.lineWidth = lw * 0.8; c.stroke(); }
    c.beginPath(); c.ellipse(6, 0, 21 * (MITT ? 1.35 : 1), 17 * (MITT ? 1.35 : 1), 0, 0, 7); c.fillStyle = MITT || SKIN; c.fill(); c.lineWidth = lw; c.stroke();
    c.beginPath(); c.ellipse(4, side * 15 * (MITT ? 1.4 : 1), 10, 7, side * 0.6, 0, 7); c.fill(); c.stroke();
    c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(14, -6); c.lineTo(24, -5); c.moveTo(14, 4); c.lineTo(23, 5); c.stroke();   // finger lines
    c.restore();
  }

  function draw(c0, X, Y, s, p, t = 0) {
    DRAW = Math.floor(t * g.Stick.boilFps + 1e-6) + (p.seed || 0) * 7919; PATH = 0;
    MITT = p.mitts || ''; SKIN = p.skin || '#f6efe2'; PANTS = p.pants || '#2c3140'; HAIR = p.hairCol || '#2a2630';
    const SLEEVE = p.coat || p.shirt;
    const c = sketch(c0), L = 8;
    c0.save(); c0.translate(X + p.hip[0] * 0.5 * s, Y); c0.scale(s, s * 0.22); c0.fillStyle = 'rgba(0,0,0,.25)'; c0.beginPath(); c0.arc(0, 0, 100, 0, 7); c0.fill(); c0.restore();   // contact shadow (the 3D world adds the real one)
    c.save(); c.translate(X, Y); c.scale(s, -s); c.lineCap = c.lineJoin = 'round'; c.strokeStyle = INK;   // y up, feet at 0
    const sq = 1 - p.squash * 0.12, hipX = p.hip[0], hipY = 200 + p.hip[1];
    const bodyH = 150 * sq, lx = -p.lean * bodyH, topX = hipX + lx, topY = hipY + bodyH;
    const shL = [topX - 42, topY - 26 + p.shoulders], shR = [topX + 42, topY - 26 + p.shoulders];
    const headC = [topX - p.tilt * 40, topY + 100 + p.bob];
    // far arm (behind the body)
    const [eL, hL] = ik(shL, p.handL, 86, 82, -1, topX);
    tube(c, shL, eL, hL, 30, 22, SLEEVE, L); holdProp(c, p.holdL, hL, eL, p.holdAngL, s); hand(c, hL, eL, -1, L - 2, p.pointL);
    // legs: trousers + shoes
    for (const [f, side] of [[p.footL, -1], [p.footR, 1]]) {
      const hp = [hipX + side * 24, hipY + 4], ank = [f[0], f[1] + 26];
      const [kn, an] = ik(hp, ank, 94, 90, side, hipX);
      tube(c, hp, kn, an, 40, 30, PANTS, L);
      c.beginPath(); c.roundRect(an[0] - 22 + side * 10, an[1] - 30, 44 + 14, 26, [12, 12, 4, 4]); c.closePath();
      c.fillStyle = SHOE; c.fill(); c.lineWidth = L - 2; c.stroke();
    }
    // frock-coat tails (over the thighs, open in front)
    if (p.coat) for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 8, hipY + 26); c.lineTo(sd * 58, hipY + 26); c.quadraticCurveTo(sd * 70, hipY - 50, sd * 62, hipY - 118);
      c.lineTo(sd * 14, hipY - 100); c.closePath(); c.fillStyle = p.coat; c.fill(); c.lineWidth = L; c.stroke(); }
    // pelvis
    c.beginPath(); c.roundRect(hipX - 46, hipY - 22, 92, 44, 18); c.fillStyle = PANTS; c.fill(); c.lineWidth = L; c.stroke();
    if (p.toolbelt) {   // inventor's tool belt: pouch on the near hip with a screwdriver and a wrench sticking out
      const bx = hipX + 40, by = hipY - 6;
      c.beginPath(); c.moveTo(bx + 4, by + 30); c.lineTo(bx + 8, by + 78); c.lineWidth = 9; c.strokeStyle = '#c8452f'; c.stroke(); c.strokeStyle = INK;
      c.beginPath(); c.moveTo(bx + 26, by + 26); c.lineTo(bx + 36, by + 66); c.lineWidth = 7; c.strokeStyle = '#9aa3ad'; c.stroke(); c.strokeStyle = INK;
      c.beginPath(); c.arc(bx + 37, by + 70, 9, 0, 7); c.lineWidth = 5; c.stroke();
      c.beginPath(); c.roundRect(bx - 18, by - 34, 62, 64, [6, 6, 16, 16]); c.fillStyle = '#8a5a32'; c.fill(); c.lineWidth = 6; c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 12, by + 14); c.lineTo(bx + 38, by + 14); c.stroke(); }
    // torso: shirt (wider at the shoulders), shadow side, belt, tie, collar
    c.save(); c.transform(1, 0, -p.lean, 1, hipX, hipY);
    const W0 = 50, W1 = 58 + p.shoulders * 0.3;
    const torso = () => { c.beginPath(); c.moveTo(-W0, 4); c.quadraticCurveTo(-W1 - 6, bodyH * 0.55, -W1, bodyH - 30); c.quadraticCurveTo(-W1 + 6, bodyH + 2, 0, bodyH + 4);
      c.quadraticCurveTo(W1 - 6, bodyH + 2, W1, bodyH - 30); c.quadraticCurveTo(W1 + 6, bodyH * 0.55, W0, 4); c.quadraticCurveTo(0, -8, -W0, 4); c.closePath(); };
    torso(); c.fillStyle = p.coat || p.shirt; c.fill();
    c.save(); torso(); c.clip();
    if (p.coat) { c.beginPath(); c.moveTo(-30, bodyH + 10); c.lineTo(-16, 0); c.lineTo(16, 0); c.lineTo(30, bodyH + 10); c.closePath(); c.fillStyle = p.shirt; c.fill(); c.lineWidth = 5; c.stroke();   // vest in the open front
      c.fillStyle = INK; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(0, 20 + k * 26, 3.5, 0, 7); c.fill(); } }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(W0 * 0.25, -20, 100, bodyH + 40);
    if (!p.coat) { c.fillStyle = INK; c.fillRect(-90, 6, 180, 14); c.fillStyle = '#d9b44a'; c.fillRect(-10, 5, 20, 16); }
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-W0 + 14, 40); c.quadraticCurveTo(-20, 60, -6, 100); c.stroke();   // fold
    c.restore(); torso(); c.strokeStyle = INK; c.lineWidth = L; c.stroke();
    c.translate(p.turn * 18, 0);   // tie/collar follow the turn
    if (p.bowtie) { c.save(); c.translate(0, bodyH - 12); c.rotate(p.tie * 0.4); c.beginPath(); c.moveTo(0, 0); c.lineTo(-24, 12); c.lineTo(-24, -12); c.closePath(); c.moveTo(0, 0); c.lineTo(24, 12); c.lineTo(24, -12); c.closePath();
      c.fillStyle = p.tieCol; c.fill(); c.lineWidth = 5; c.stroke(); c.restore(); }
    else if (p.tieOn) { c.save(); c.translate(0, bodyH - 10); c.rotate(p.tie * 1.25);
    c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.lineTo(15, -66); c.lineTo(0, -84); c.lineTo(-15, -66); c.closePath(); c.fillStyle = p.tieCol; c.fill(); c.lineWidth = 5; c.stroke(); c.restore(); }
    c.beginPath(); c.moveTo(-32, bodyH); c.lineTo(-4, bodyH - 26); c.lineTo(0, bodyH - 6); c.lineTo(4, bodyH - 26); c.lineTo(32, bodyH); c.lineWidth = 6; c.stroke();
    c.restore();
    // neck + head
    c.lineWidth = 26; c.strokeStyle = INK; c.beginPath(); c.moveTo(topX, topY - 10); c.lineTo(headC[0], headC[1] - 70); c.stroke();
    c.lineWidth = 14; c.strokeStyle = SKIN; c.beginPath(); c.moveTo(topX, topY - 4); c.lineTo(headC[0], headC[1] - 70); c.stroke(); c.strokeStyle = INK;
    c.save(); c.translate(headC[0], headC[1]); c.rotate(-p.tilt);
    const hw = 164, hh = 172;
    for (const sx of [-1, 1]) { if (sx * p.turn > 0.35) continue; c.beginPath(); c.ellipse(sx * (hw / 2 + 4) - p.turn * 14, -6, 15, 22, 0, 0, 7); c.fillStyle = SKIN; c.fill(); c.lineWidth = 7; c.stroke(); }
    c.beginPath(); c.roundRect(-hw / 2, -hh / 2, hw, hh, [46, 46, 58, 58]); c.fillStyle = SKIN; c.fill(); c.lineWidth = L + 1; c.stroke();
    c.save(); c.beginPath(); c.roundRect(-hw / 2, -hh / 2, hw, hh, [46, 46, 58, 58]); c.clip();
    c.fillStyle = SHADE; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(hw * 0.62, -10, hw * 0.4, hh * 0.75, 0, 0, 7); c.fill(); c.globalAlpha = 1;
    c.fillStyle = 'rgba(40,40,50,.35)';
    if (p.stubble && !p.beard) for (let i = 0; i < 26; i++) { const a = i * 2.399, r = 8 + (i * 37 % 30); c.beginPath(); c.arc(Math.cos(a) * r * 1.9, -hh / 2 + 22 + Math.sin(a) * 9 + (i % 3) * 3, 1.7, 0, 7); c.fill(); }
    if (p.blush) { c.fillStyle = `rgba(230,110,90,${0.35 * p.blush})`; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 52, -22, 18, 10, 0, 0, 7); c.fill(); } }
    c.restore();
    c.save(); c.translate(p.hairOff[0] - p.turn * 12, p.hairOff[1]); c.rotate(p.hairRot);
    c.beginPath(); c.moveTo(-hw / 2 - 8, hh / 2 - 34); c.quadraticCurveTo(-hw / 2 - 4, hh / 2 + 22, -20, hh / 2 + 20);
    c.quadraticCurveTo(50, hh / 2 + 30 + p.hair * 8, hw / 2 + 16, hh / 2 - 6); c.quadraticCurveTo(hw / 2 + 8, hh / 2 - 30, hw / 2 - 2, hh / 2 - 40);
    c.quadraticCurveTo(10, hh / 2 - 8, -hw / 2 - 8, hh / 2 - 34); c.closePath(); c.fillStyle = HAIR; c.fill(); c.lineWidth = 7; c.stroke();
    if (!p.hat || p.hair > 0.5) { c.lineWidth = 6; for (let i = 0; i < 4; i++) { const hx = -50 + i * 34; c.beginPath(); c.moveTo(hx, hh / 2 + 16);
      c.quadraticCurveTo(hx + 14 - p.hair * 10, hh / 2 + 34 + p.hair * 26, hx + 30 - p.hair * 26, hh / 2 + 26 + p.hair * 44 + (i % 2) * 6); c.stroke(); } }
    c.restore();
    if (p.beard > 0.01) {   // chin-curtain beard: ear to ear under the jaw, mouth stays free
      c.beginPath(); c.moveTo(-hw / 2 - 2, 4); c.quadraticCurveTo(-hw / 2 - 10, -hh / 2 - 10 * p.beard, -30, -hh / 2 - 30 * p.beard); c.quadraticCurveTo(0, -hh / 2 - 46 * p.beard, 30, -hh / 2 - 30 * p.beard);
      c.quadraticCurveTo(hw / 2 + 10, -hh / 2 - 10 * p.beard, hw / 2 + 2, 4); c.quadraticCurveTo(hw / 2 - 18, -40, 26, -72); c.quadraticCurveTo(0, -80, -26, -72); c.quadraticCurveTo(-hw / 2 + 18, -40, -hw / 2 - 2, 4); c.closePath();
      c.fillStyle = HAIR; c.fill(); c.lineWidth = 6; c.stroke();
      c.lineWidth = 3; for (let k = 0; k < 7; k++) { const bx = -60 + k * 20; c.beginPath(); c.moveTo(bx, -hh / 2 - 4); c.lineTo(bx + 4, -hh / 2 - 18 * p.beard); c.stroke(); } }
    if (p.hat) {   // hats sit on the hair; hatTip lifts and tilts it (greeting)
      c.save(); c.translate(-6 + p.hatTip * 40 - p.capBack * 22, hh / 2 + 4 + p.hatTip * 70 + p.capBack * 10); c.rotate(-0.08 - p.hatTip * 0.5 + p.capBack * 0.32);
      c.fillStyle = p.hatCol; c.lineWidth = 7;
      if (p.hat === 'top') { c.beginPath(); c.ellipse(0, 0, 112, 20, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-64, 6); c.lineTo(-70, 168); c.quadraticCurveTo(0, 182, 70, 168); c.lineTo(64, 6); c.quadraticCurveTo(0, -6, -64, 6); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-60, 12, 120, 18); }
      else if (p.hat === 'bowler') { c.beginPath(); c.ellipse(0, 0, 104, 18, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(0, 10, 72, 78, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke(); }
      else if (p.hat === 'cap') { c.beginPath(); c.ellipse(0, 22, 88, 46, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.ellipse(52, 4, 62, 14, 0.05, 0, 7); c.fill(); c.stroke(); }
      else if (p.hat === 'bonnet') { c.beginPath(); c.ellipse(0, -10, 112, 110, 0, -0.2, Math.PI + 0.2); c.closePath(); c.fill(); c.stroke(); c.lineWidth = 5; c.beginPath(); c.moveTo(-80, -40); c.quadraticCurveTo(-60, -160, -10, -150); c.stroke(); }
      c.restore(); }
    if (p.tuft) { c.save(); c.translate(-hw / 2 + 4, hh / 2 - 10); c.fillStyle = HAIR; c.lineWidth = 6;   // hair tuft escaping the cap at the back
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(i * 14, 6); c.quadraticCurveTo(-22 + i * 8 - p.hair * 10, 24 + i * 6, -30 + i * 10 - p.hair * 18, 4 + i * 14 + p.hair * 16); c.quadraticCurveTo(-8 + i * 8, 8, i * 14 + 14, 0); c.fill(); c.stroke(); }
      c.restore(); }
    if (p.pencil && p.turn < 0.35) { c.save(); c.translate(hw / 2 + 2 - p.turn * 14, 22); c.rotate(-0.9);   // pencil behind the near ear
      c.beginPath(); c.moveTo(-50, -6); c.lineTo(40, -6); c.lineTo(58, 0); c.lineTo(40, 6); c.lineTo(-50, 6); c.closePath(); c.fillStyle = '#f2c94c'; c.fill(); c.lineWidth = 5; c.stroke();
      c.fillStyle = '#e88a9a'; c.fillRect(-56, -6, 8, 12); c.restore(); }
    const goggles = (y, sc) => { c.save(); c.translate(p.turn * 20, y); c.lineWidth = 7;
      c.beginPath(); c.moveTo(-hw / 2 - 6, 0); c.lineTo(hw / 2 + 6, 0); c.lineWidth = 12; c.strokeStyle = '#4a3a2a'; c.stroke(); c.strokeStyle = INK; c.lineWidth = 7;
      for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 36 * sc, 0, 30 * sc, 0, 7); c.fillStyle = '#b07a3a'; c.fill(); c.stroke();
        c.beginPath(); c.arc(sx * 36 * sc, 0, 20 * sc, 0, 7); c.fillStyle = 'rgba(120,200,230,.85)'; c.fill(); c.lineWidth = 5; c.stroke();
        c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(sx * 36 * sc - 7, 7, 5, 0, 7); c.fill(); }
      c.restore(); };
    if (p.goggles && !p.gogglesOn) goggles(hh / 2 + 18, 0.85);
    c.save(); c.translate(p.turn * 30, 0);   // face features slide toward the turn (restored after the sweat drops)
    for (let i = 0; i < 2; i++) {
      const sx = i ? 1 : -1, ex = sx * 38 * (1 - 0.18 * Math.abs(p.turn)), ey = 8, lid = Math.max(p.lid[i], 0), ew = 27, eh = 21 * Math.min(Math.max(lid, 0.06), 1.2);
      c.save(); c.beginPath(); c.ellipse(ex, ey, ew, eh, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.stroke();
      if (lid > 0.1) { c.beginPath(); c.ellipse(ex, ey, ew, eh, 0, 0, 7); c.clip(); c.fillStyle = INK; c.beginPath(); c.arc(ex + p.look[0] * 13, ey - p.look[1] * 9, 8.5 * p.pupil, 0, 7); c.fill();
        if (lid < 0.95) { c.fillStyle = SKIN; c.fillRect(ex - ew - 4, ey + eh * (2 * lid - 1) + 2, ew * 2 + 8, 60); } }
      c.restore();
      if (lid > 0.1 && lid < 0.95) { c.lineWidth = 6; c.beginPath(); c.moveTo(ex - ew * 0.96, ey + eh * (2 * lid - 1) + 2); c.lineTo(ex + ew * 0.96, ey + eh * (2 * lid - 1) + 2); c.stroke(); }
      if (lid <= 0.1) { c.lineWidth = 6; c.beginPath(); c.moveTo(ex - ew, ey); c.quadraticCurveTo(ex, ey - 8, ex + ew, ey); c.stroke(); }
      c.lineWidth = 3; c.globalAlpha = 0.45; c.beginPath(); c.moveTo(ex - 16, ey - eh - 9); c.quadraticCurveTo(ex, ey - eh - 14, ex + 16, ey - eh - 9); c.stroke(); c.globalAlpha = 1;
      const [br, ba] = p.brow[i]; c.save(); c.translate(ex, ey + 33 + br); c.rotate(sx * ba);
      c.lineWidth = 15; c.beginPath(); c.moveTo(-27, 0); c.quadraticCurveTo(0, 5, 27, 0); c.stroke(); c.restore();
    }
    if (p.nose) { c.beginPath(); c.ellipse(8, -16, 24, 20, 0.2, 0, 7); c.fillStyle = '#f0b59a'; c.fill(); c.lineWidth = 6; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(14, -8, 5, 0, 7); c.fill(); }
    else { c.lineWidth = 6; c.beginPath(); c.moveTo(2, 2); c.lineTo(8, -18); c.lineTo(-2, -20); c.stroke(); }
    if (p.freckles) { c.fillStyle = 'rgba(160,90,50,.7)'; for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(sx * (46 + (k % 2) * 12) + 4, -20 - Math.floor(k / 2) * 10 + (k % 2) * 4, 3, 0, 7); c.fill(); } }
    if (p.plaster) { c.save(); c.translate(-58, -46); c.rotate(0.5); for (const r of [0, 1.4]) { c.save(); c.rotate(r); c.beginPath(); c.roundRect(-18, -6, 36, 12, 5); c.fillStyle = '#f1d3a6'; c.fill(); c.lineWidth = 4; c.stroke(); c.restore(); } c.restore(); }
    if (p.moustache) { c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(-30, -24, -48, -44); c.quadraticCurveTo(-26, -46, 0, -38); c.quadraticCurveTo(26, -46, 48, -44); c.quadraticCurveTo(30, -24, 0, -34); c.fillStyle = HAIR; c.fill(); c.lineWidth = 5; c.stroke(); }
    if (p.glasses) { c.lineWidth = 5; for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 38 * (1 - 0.18 * Math.abs(p.turn)), 8, 33, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(-6, 12); c.quadraticCurveTo(0, 18, 6, 12); c.stroke(); }
    if (p.goggles && p.gogglesOn) { c.restore(); goggles(8, 1.05); c.save(); c.translate(p.turn * 30, 0); }
    const my = -48, mw = 44 * p.mw, o = p.open; c.lineWidth = 7;
    const blob = (f) => { c.fillStyle = f; c.fill(); c.stroke(); };
    const teeth = (hgt, shape) => { c.fillStyle = '#fff'; c.fill(); c.stroke(); c.save(); shape(); c.clip(); c.lineWidth = 3;
      for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * mw / 3.2, my - hgt - 40); c.lineTo(k * mw / 3.2, my + 40); c.stroke(); }
      c.beginPath(); c.moveTo(-mw - 9, my - hgt * 0.5); c.lineTo(mw + 9, my - hgt * 0.5); c.stroke(); c.restore(); };
    c.beginPath();
    switch (p.mouth) {
      case 'smirk': c.moveTo(-mw * 0.7, my - 2); c.quadraticCurveTo(mw * 0.2, my - 10, mw * 0.9, my + 12); c.stroke(); c.beginPath(); c.arc(mw * 0.9 + 3, my + 15, 4, 0, 7); c.fillStyle = INK; c.fill(); break;
      case 'frown': c.moveTo(-mw * 0.75, my - 12); c.quadraticCurveTo(0, my + 8, mw * 0.75, my - 12); c.stroke(); break;
      case 'side': c.moveTo(-mw * 0.1, my); c.lineTo(mw * 0.85, my + 3); c.stroke(); break;
      case 'o': c.ellipse(0, my - 4, 11 + o * 4, 9 + o * 12, 0, 0, 7); blob('#3a1620'); break;
      case 'grin': { const sh = () => { c.beginPath(); c.moveTo(-mw, my + 8); c.quadraticCurveTo(0, my + 2, mw, my + 8); c.quadraticCurveTo(mw * 0.7, my - 22 - o * 22, 0, my - 24 - o * 24); c.quadraticCurveTo(-mw * 0.7, my - 22 - o * 22, -mw, my + 8); c.closePath(); };
        sh(); teeth(24 + o * 24, sh); break; }
      case 'teeth': { const sh = () => { c.beginPath(); c.roundRect(-mw, my - 20, mw * 2, 26, 9); }; sh(); teeth(26, sh); break; }
      case 'scream': { const sh = () => { c.beginPath(); c.roundRect(-mw * 0.8, my - 30 - o * 22, mw * 1.6, 40 + o * 22, [14, 14, 24, 24]); };
        sh(); c.fillStyle = '#3a1620'; c.fill(); c.save(); sh(); c.clip(); c.fillStyle = '#fff'; c.fillRect(-mw, my - 2, mw * 2, 20);
        c.fillStyle = '#d0584e'; c.beginPath(); c.ellipse(4, my - 34 - o * 22, 24, 15, 0, 0, 7); c.fill(); c.restore(); sh(); c.stroke(); break; }
      default: c.moveTo(-mw * 0.7, my); c.lineTo(mw * 0.7, my); c.stroke();
    }
    for (let k = 0; k < Math.round(p.sweat * 3); k++) { const dx = hw / 2 + 20 + k * 20, dy = 44 - k * 30; c.beginPath(); c.moveTo(dx, dy + 16); c.quadraticCurveTo(dx + 13, dy - 8, dx, dy - 12); c.quadraticCurveTo(dx - 13, dy - 8, dx, dy + 16); c.lineWidth = 4; blob('#9fd8f0'); }
    c.restore();
    c.restore();
    // near arm last, so gestures cross the body
    const [eR, hR] = ik(shR, p.handR, 86, 82, 1, topX);
    tube(c, shR, eR, hR, 30, 22, SLEEVE, L);
    if (p.prop === 'axe') { c.save(); c.translate(hR[0], hR[1]); c.rotate(p.propAng);
      c.beginPath(); c.roundRect(-40, -8, 220, 16, 6); c.fillStyle = '#8a5a32'; c.fill(); c.lineWidth = 6; c.stroke();
      c.beginPath(); c.moveTo(150, 6); c.lineTo(205, 10); c.quadraticCurveTo(222, -30, 204, -64); c.lineTo(150, -46); c.closePath(); c.fillStyle = '#b8bcc4'; c.fill(); c.stroke(); c.restore(); }
    holdProp(c, p.holdR, hR, eR, p.holdAngR, s);
    hand(c, hR, eR, 1, L - 2, p.pointR);
    c.restore();
  }
  // held props: p.holdR / p.holdL = a name from Stick.PROPS or a function(c) drawing in hand space (x along the hand's
  // grip, y DOWN, units = character units). holdAng turns it (radians, + = clockwise on screen). Drawn under the fingers.
  function holdProp(c, h, at, from, ang, s) {
    if (!h) return; const f = typeof h === 'function' ? h : g.Stick.PROPS[h]; if (!f) return;
    c.save(); c.translate(at[0], at[1]); c.scale(1, -1); c.rotate(ang || 0); c.strokeStyle = INK; c.lineCap = c.lineJoin = 'round'; f(c); c.restore();
  }
  const PROPS = {
    hammer(c) { c.beginPath(); c.roundRect(-30, -10, 230, 20, 9); c.fillStyle = '#a0683a'; c.fill(); c.lineWidth = 6; c.stroke();
      c.beginPath(); c.roundRect(180, -58, 60, 116, 10); c.fillStyle = '#8f98a3'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(190, -40); c.lineTo(230, -40); c.lineWidth = 3; c.stroke(); },
    teacup(c) { c.beginPath(); c.roundRect(-30, -62, 60, 52, 10); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 5; c.stroke(); c.beginPath(); c.arc(32, -40, 13, -1.4, 1.4); c.stroke();
      c.beginPath(); c.ellipse(0, -62, 30, 7, 0, 0, 7); c.fillStyle = '#9a6a3a'; c.fill(); c.stroke(); },
    pencil(c) { c.beginPath(); c.moveTo(-20, -5); c.lineTo(70, -5); c.lineTo(90, 0); c.lineTo(70, 5); c.lineTo(-20, 5); c.closePath(); c.fillStyle = '#f2c94c'; c.fill(); c.lineWidth = 4; c.stroke(); },
    fries(c) { for (let i = 0; i < 6; i++) { c.beginPath(); c.roundRect(-40 + i * 15, -110 - (i * 37 % 30), 12, 80, 3); c.fillStyle = '#f2c94c'; c.fill(); c.lineWidth = 4; c.stroke(); }
      c.beginPath(); c.moveTo(-50, -50); c.lineTo(50, -50); c.lineTo(38, 30); c.lineTo(-38, 30); c.closePath(); c.fillStyle = '#d6332b'; c.fill(); c.lineWidth = 5; c.stroke(); },
  };
  // reach: hand offset (character units) that puts this arm's hand on screen point (px,py), clamped to what the arm can
  // reach (so a poke never ends in the air: if it can't reach, move the character, don't fake it). Returns {hand, ok}.
  function reach(X, Y, s, p, px, py, side = 'R', k = 0.97) {
    const sq = 1 - (p.squash || 0) * 0.12, hipX = p.hip[0], hipY = 200 + p.hip[1], bodyH = 150 * sq, topX = hipX - p.lean * bodyH, topY = hipY + bodyH;
    const sh = [topX + (side === 'R' ? 42 : -42), topY - 26 + p.shoulders], tx = (px - X) / s, ty = (Y - py) / s;
    const dx = tx - sh[0], dy = ty - sh[1], d = Math.hypot(dx, dy), R = 168 * 1.15 * k;
    return d <= R ? { hand: [tx, ty], ok: true } : { hand: [sh[0] + dx / d * R, sh[1] + dy / d * R], ok: false };
  }
  // sketchCtx: the same boiling ink for props and sets (ropes, planks, machines), so the world and the characters match
  function sketchCtx(c, t, seed = 1) { DRAW = Math.floor(t * g.Stick.boilFps + 1e-6) + seed * 7919; PATH = seed * 100000; return sketch(c); }
  g.Stick = { draw, pose, mix, act, alive, walk, vary, curve, sketchCtx, reach, PROPS, EXPR, BASE, boilFps: 24 };   // 24 = a new drawing every frame; 12 = classic 'on twos'
})(typeof window !== 'undefined' ? window : globalThis);
