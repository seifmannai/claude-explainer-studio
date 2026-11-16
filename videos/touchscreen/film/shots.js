// shots.js - every shot of "Dave builds a touchscreen". A shot = {name, era, t0, fn(g, t)}; fn draws the whole frame
// (set, Dave, props, camera) as a pure function of t. Times come from cues.js (words), never typed in.
(function (g0) {
  const { INK, cl, sm, eo, back, hs, bump, text } = P;
  const W = 1080, H = 1920;
  const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => cl((t - a) / (b - a));

  // ---------------------------------------------------------------- camera: keys [[t, cx, cy, zoom, rot]], always drifting
  let KICK = [];   // [[t, amp]] camera kicks (hits)
  function camera(g, t, keys, hand = 1) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    const a = keys[i], b = keys[i + 1] || a, u = b === a ? 0 : eio((t - a[0]) / (b[0] - a[0]));
    const cx = lerp(a[1], b[1], u), cy = lerp(a[2], b[2], u), z = lerp(a[3], b[3], u), r = lerp(a[4] || 0, b[4] || 0, u);
    let hx = hand * (9 * Math.sin(t * 0.9) + 5 * Math.sin(t * 2.3 + 1)), hy = hand * (7 * Math.sin(t * 0.7 + 2) + 4 * Math.sin(t * 1.9));
    let hr = hand * 0.006 * Math.sin(t * 0.5 + 1);
    for (const [kt, amp] of KICK) { const d = t - kt; if (d >= 0 && d < 0.6) { const e = Math.exp(-d * 9) * amp; hx += e * 40 * Math.sin(d * 70); hy += e * 30 * Math.cos(d * 55); hr += e * 0.03 * Math.sin(d * 60); } }
    g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2 + hx, H / 2 + hy); g.rotate(r + hr); g.scale(z, z); g.translate(-cx, -cy);
  }

  // ---------------------------------------------------------------- Dave
  const DAVE = { shirt: '#e8762d', hat: 'cap', hatCol: '#2f6f9e', tieOn: 0, hairCol: '#5a3a22', skin: '#f3dcc0', pants: '#3a4256', seed: 3, stubble: 0 };
  // keys: [[t, expr, overrides, varySeed?]]; acting = Stick.act from the previous key, then Stick.alive (never still)
  function davePose(keys, t, costume = DAVE) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    const mk = (k) => { let p = Stick.pose(k[1], Object.assign({}, costume, k[2] || {})); if (k[3]) p = Stick.vary(p, k[3], 0.35); if (k[2] && k[2].handR) p.handR = k[2].handR.slice(); if (k[2] && k[2].handL) p.handL = k[2].handL.slice(); return p; };
    let p = i > 0 || t >= keys[0][0] ? (i > 0 ? Stick.act(mk(keys[i - 1]), mk(keys[i]), t - keys[i][0]) : mk(keys[0])) : mk(keys[0]);
    return Stick.alive(p, t, costume.seed || 1);
  }
  const handAt = (x, y, s, p, side = 'R') => { const h = side === 'R' ? p.handR : p.handL; return [x + h[0] * s, y - h[1] * s]; };
  // hand offset that puts Dave's hand on a screen point
  const reach = (x, y, s, px, py) => [(px - x) / s, (y - py) / s];
  // position along keyed x positions [[t, x]] with a walk cycle between them
  function walker(t, path) {
    let i = 0; while (i + 1 < path.length && path[i + 1][0] <= t) i++;
    const a = path[i], b = path[i + 1];
    if (!b || t < a[0]) return { x: a[1], ph: 0, k: 0, dir: 0 };
    const dur = Math.max(0.35, Math.abs(b[1] - a[1]) / 520), u = (t - b[0] + dur) / dur;   // walk ends at b's time
    if (u <= 0) return { x: a[1], ph: 0, k: 0, dir: 0 };
    if (u >= 1) return { x: b[1], ph: 0, k: 0, dir: 0 };
    const e = sm(u), dir = Math.sign(b[1] - a[1]);
    return { x: lerp(a[1], b[1], e), ph: u * dur * 2.6, k: Math.min(1, Math.sin(Math.PI * u) * 2), dir };
  }
  function drawDave(g, t, x, y, s, p, w) { if (w && w.k > 0) p = Stick.walk(p, w.ph, w.dir, w.k); Stick.draw(g, x, y, s, p, t); return p; }

  // ---------------------------------------------------------------- palettes
  const PAL = {
    shop: { wall: '#f1e6d0', wall2: '#e2d3b6', floor: '#c9a47a', wood: '#b9834f', kind: 'workshop' },
    radar: { wall: '#c9cfc6', wall2: '#b4bcb2', floor: '#7d7f78', wood: '#8a8f86', kind: 'radar', sky: '#9fb7c9' },
    s70: { wall: '#e9c27a', wall2: '#b8642e', floor: '#8a5a32', wood: '#a0683a', kind: 'seventies' },
    s80: { wall: '#3d4a5c', wall2: '#33404f', floor: '#2a313c', wood: '#6b5a48', kind: 'workshop', sky: '#20304a' },
    s90: { wall: '#7cc2b4', wall2: '#f0d264', floor: '#5d6b8a', wood: '#b9834f', kind: 'nineties' },
    s07: { wall: '#e6ebf0', wall2: '#d3dbe3', floor: '#a9b4c0', wood: '#c9a47a', kind: 'modern', sky: '#c7d6e6', snow: true },
    kit: { wall: '#f4dc8a', wall2: '#e8c35c', floor: '#c97a4a', wood: '#b9834f', kind: 'kitchen' },
    now: { wall: '#14233a', wall2: '#101b2e', floor: '#0b1220', wood: '#3a4a63', kind: 'workshop', sky: '#0b1530' },
  };

  // ---------------------------------------------------------------- shared set: Dave on his stool at a bench screen
  const DX = 290, DY = 1560, DS = 1.25;           // Dave's feet on the stool
  const MON = [380, 560, 600, 440];               // monitor x, y, w, h
  function workshopSet(g, t, pal, monOpts, lampCol) {
    P.room(g, t, pal); P.bench(g, t, 300, 1060, 1110, pal.wood);
    const m = P.monitor(g, t, MON[0], MON[1], MON[2], MON[3], monOpts);
    P.lamp(g, t, 600, -260, lampCol); P.stool(g, t, DX, DY); P.dustMotes(g, t);
    return m;
  }
  const POKE = (px = 440, py = 930) => reach(DX, DY, DS, px, py);

  function build(C) {
    KICK = [[C.hit, 1], [C.snap, 1], [C.theft, 0.5], [C.fired, 0.6], [C.del, 0.4], [C.scream, 0.6]];
    const S = C.S;
    const shots = [];
    const add = (name, era, t0, fn) => shots.push({ name, era, t0, fn });

    // ============================================================ ERA 0: Dave's workshop (now)
    add('Meet Dave', 0, 0, (g, t) => {
      camera(g, t, [[0, 600, 1010, 1.0, -0.01], [S(1), 560, 960, 1.14, 0.012]]);
      const dent = Math.max(bump(t, C.poke0, 0.25), bump(t, C.poke0b, 0.25));
      const m = workshopSet(g, t, PAL.shop, { kind: 'flat', dent, content: (g, x, y, w, h) => {
        g.fillStyle = '#26323f'; g.fillRect(x, y, w, h); const q = Math.max(bump(t, C.poke0 + 0.1, 0.7), bump(t, C.poke0b + 0.1, 0.7));
        text(g, '...', x + w / 2, y + h / 2, 120, '#9fb3c8', { stroke: 0, alpha: 0.3 + 0.7 * q }); } });
      const p = davePose([[0, 'idea', { handR: [70, 330] }], [C.poke0 - 0.28, 'suspicious', { handR: [40, 300] }], [C.poke0, 'angry', { handR: POKE() }],
        [C.poke0 + 0.3, 'suspicious', { handR: [80, 360] }], [C.poke0b - 0.22, 'angry', { handR: [30, 320] }], [C.poke0b, 'angry', { handR: POKE(470, 880) }],
        [C.poke0b + 0.35, 'deadpan', { handR: [70, 330], look: [0.7, -0.2] }]], t);
      drawDave(g, t, DX, DY, DS, p);
      for (const pt of [C.poke0, C.poke0b]) { const u = seg(t, pt, pt + 0.5); if (u > 0 && u < 1) text(g, 'boop', 560, 820 - 60 * eo(u), 70, '#fff', { alpha: 1 - u, rot: -0.1 }); }
    });
    add('Feels his finger', 0, S(1), (g, t) => {
      camera(g, t, [[S(1), 540, 900, 1.05, 0.02], [C.dream, 540, 880, 1.2, -0.02]]);
      P.insertBg(g, t, '#3a4d63', '#121a26');
      const k = Stick.sketchCtx(g, t, 7); k.strokeStyle = INK; k.lineWidth = 14;
      k.beginPath(); k.roundRect(90, 300, 900, 1200, 40); k.fillStyle = '#20232b'; k.fill(); k.stroke();
      g.fillStyle = '#26323f'; g.fillRect(130, 340, 820, 1120);
      const taps = [C.fingerTap, C.fingerTap2, C.fingerTap2 + 0.45];
      let press = 0; for (const tp of taps) press = Math.max(press, bump(t, tp - 0.08, 0.3));
      const rest = [700, 1260], hit = [560, 860], pr = eio(press);
      const tip = [lerp(rest[0], hit[0], pr), lerp(rest[1], hit[1], pr) + 30 * Math.sin(t * 3)];
      for (const tp of taps) { const u = seg(t, tp, tp + 0.6); if (u > 0 && u < 1) { g.strokeStyle = `rgba(160,190,220,${0.6 * (1 - u)})`; g.lineWidth = 6; g.beginPath(); g.arc(hit[0], hit[1], 30 + 120 * u, 0, 7); g.stroke(); } }
      P.bigFinger(g, t, tip, -2.1, { press: press > 0.85 ? (press - 0.85) * 6 : 0 });
      const q = seg(t, C.fingerTap2 + 0.3, C.fingerTap2 + 0.6); text(g, '?', 560, 600 - 20 * Math.sin(t * 4), 220, '#9fb3c8', { alpha: q, scale: back(q) });
    });
    add('Pokes back', 0, C.dream, (g, t) => {
      camera(g, t, [[C.dream, 520, 900, 1.08, 0], [C.rw0, 430, 760, 1.25, 0.03]]);
      workshopSet(g, t, PAL.shop, { kind: 'flat', content: (g, x, y, w, h) => { g.fillStyle = '#26323f'; g.fillRect(x, y, w, h); } });
      const p = davePose([[C.dream - 0.1, 'idea', { handR: [60, 320], handL: [-60, 320] }], [C.dreamPoke + 0.1, 'smug', { lid: [0.9, 0.9], mouth: 'grin', open: 0.4 }, 4]], t);
      drawDave(g, t, DX, DY, DS, p);
      const u = seg(t, C.dream - 0.1, C.dream + 0.25);
      if (u > 0) { g.save(); g.translate(330, 640); g.scale(back(u), back(u)); g.translate(-330, -640);
        P.bubble(g, t, 70, 160, 640, 520, [300, 840], (g) => {
          g.fillStyle = '#eaf4ff'; g.fillRect(70, 160, 640, 520);
          const k = Stick.sketchCtx(g, t, 9); k.strokeStyle = INK; k.lineWidth = 7;
          k.beginPath(); k.roundRect(380, 300, 240, 220, 16); k.fillStyle = '#20232b'; k.fill(); k.stroke();       // little screen
          const po = eo(seg(t, C.dreamPoke - 0.25, C.dreamPoke)) * (1 - seg(t, C.dreamPoke + 0.5, C.dreamPoke + 0.8));
          P.bigFinger(g, t, [380 - 90 * po, 410], Math.PI, { len: 150, w: 40, seed: 12 });                             // the screen pokes out!
          const sq = bump(t, C.dreamPoke - 0.05, 0.3);
          k.beginPath(); k.ellipse(220 - 30 * sq, 420, 80 * (1 - 0.15 * sq), 90 * (1 + 0.1 * sq), 0, 0, 7); k.fillStyle = '#f3dcc0'; k.fill(); k.stroke();   // mini Dave
          g.fillStyle = INK; g.beginPath(); g.arc(190, 400, 8, 0, 7); g.arc(240, 400, 8, 0, 7); g.fill();
          if (sq > 0.1) text(g, 'BOOP!', 300, 240, 64, '#e8762d', { scale: back(sq) });
        }); g.restore(); }
    });

    // ============================================================ ERA 1: 1965 radar room (old film)
    const radarScope = (t, dim = 1) => (g, x, y, w, h) => {
      const cx = x + w / 2, cy = y + h / 2, R = w / 2; g.fillStyle = '#0d1f14'; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(120,255,160,.35)'; g.lineWidth = 3; for (let r = 1; r <= 3; r++) { g.beginPath(); g.arc(cx, cy, R * r / 3.2, 0, 7); g.stroke(); }
      g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
      const a = t * 2.4; for (let i = 0; i < 24; i++) { g.fillStyle = `rgba(120,255,160,${0.35 * (1 - i / 24) * dim})`; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a - (i + 1) * 0.03, a - i * 0.03); g.fill(); }
      for (let i = 0; i < 4; i++) { const ba = hs(i) * 6.28, br = R * (0.3 + 0.6 * hs(i + 5)), age = ((a - ba) % 6.283 + 6.283) % 6.283;
        g.fillStyle = `rgba(160,255,190,${Math.max(0, 1 - age / 4) * dim})`; g.beginPath(); g.arc(cx + Math.cos(ba) * br, cy + Math.sin(ba) * br, 9, 0, 7); g.fill(); }
    };
    const radarSet = (g, t) => {
      P.room(g, t, PAL.radar); P.bench(g, t, 300, 1060, 1110, '#7d847a');
      const fl = 0.85 + 0.15 * (hs(Math.floor(t * 12)) > 0.9 ? 0 : 1);   // fluorescent tube flicker
      g.fillStyle = `rgba(255,255,240,${0.9 * fl})`; g.fillRect(260, -60, 560, 26);
      const m = P.monitor(g, t, MON[0], MON[1] - 20, MON[2], MON[3] + 40, { kind: 'radar', content: radarScope(t) });
      P.stool(g, t, DX, DY); P.dustMotes(g, t, 30, 'rgba(255,255,255,.35)'); return m;
    };
    add('1965: screens feel nothing', 1, C.rw0, (g, t) => {
      camera(g, t, [[C.rw0, 560, 1000, 1.18, 0.03], [C.engIn, 600, 960, 1.04, -0.01]]);
      radarSet(g, t);
      const a = Math.max(C.poke65, C.rw1 + 0.05), b = C.poke65b;
      const p = davePose([[C.rw0, 'deadpan', { handR: [60, 330] }], [a, 'deadpan', { handR: POKE(470, 900) }], [a + 0.3, 'deadpan', { handR: [70, 360] }],
        [b, 'suspicious', { handR: POKE(520, 930) }], [b + 0.35, 'defeat', {}, 6]], t);
      drawDave(g, t, DX, DY, DS, p);
      const q = seg(t, b + 0.2, b + 0.5); if (q > 0) P.bubble(g, t, 420, 420, 260, 170, [330, 760], (g) => text(g, '...', 550, 500, 110, INK, { stroke: 0, scale: back(q) }));
    });
    add('1965: the radar engineer', 1, C.engIn, (g, t) => {
      camera(g, t, [[C.engIn, 640, 980, 1.0, 0], [C.engPoint, 700, 960, 1.06, 0.015], [C.field, 660, 900, 1.12, -0.01]]);
      radarSet(g, t);
      const p = davePose([[C.engIn, 'suspicious', { look: [0.9, 0], handR: [60, 300] }], [C.engPoint + 0.2, 'idea', { look: [0.6, -0.3] }, 8]], t);
      drawDave(g, t, DX, DY, DS, p);
      // the engineer: walks in from the right, stops, sips tea, points at the scope
      const ENG = { shirt: '#f4f1e8', coat: '#5b4a3a', bowtie: 1, tieOn: 0, hairCol: '#9b9b9b', skin: '#f6e3cf', pants: '#4a4036', seed: 21, beard: 0 };
      const wk = walker(t, [[C.engIn, 1300], [C.engStop, 860]]);
      const ep = davePose([[C.engIn, 'deadpan', { handL: [-60, 300] }], [C.engStop, 'smug', { handL: [-50, 330] }], [C.engPoint, 'idea', { handL: [-210, 470], handR: [70, 300], look: [-0.8, -0.2] }]], t, ENG);
      const ex = wk.x, ey = 1760, es = 1.32; drawDave(g, t, ex, ey, es, ep, wk);
      const cup = handAt(ex, ey, es, ep, 'R'); const tip = Math.max(0, bump(t, C.engStop, 0.9)) * 0.6;
      g.save(); g.translate(cup[0], cup[1] - 30); g.rotate(-tip); const k = Stick.sketchCtx(g, t, 23); k.strokeStyle = INK; k.lineWidth = 6;
      k.beginPath(); k.roundRect(-34, -50, 68, 60, 10); k.fillStyle = '#fff'; k.fill(); k.stroke(); k.beginPath(); k.arc(40, -22, 16, -1.4, 1.4); k.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(-10 + i * 20, -60); g.quadraticCurveTo(-25 + i * 20 + 10 * Math.sin(t * 3 + i), -95, -5 + i * 20, -130); g.stroke(); }
      g.restore();
      const q = seg(t, C.engStop - 0.1, C.engStop + 0.3); if (q > 0) text(g, 'UK · 1965', ex, ey - 790, 54, '#fff', { alpha: q, scale: back(q) });
    });
    add('1965: a layer of electricity', 1, C.field, (g, t) => {
      camera(g, t, [[C.field, 540, 860, 1.0, -0.03], [C.xray, 540, 820, 1.12, 0.03]]);
      P.insertBg(g, t, '#2c3a33', '#0e1611');
      const k = Stick.sketchCtx(g, t, 31); k.strokeStyle = INK; k.lineWidth = 12;
      k.beginPath(); k.roundRect(140, 380, 800, 900, 30); k.fillStyle = '#1b2a24'; k.fill(); k.stroke();
      const kf = eo(seg(t, C.field + 0.15, C.fieldFull + 0.3));
      P.field(g, t, 150, 390, 780, 880, kf);
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) {   // corner clips + wires
        k.beginPath(); k.roundRect(x - 34, y - 34, 68, 68, 12); k.fillStyle = '#b8bcc4'; k.fill(); k.lineWidth = 8; k.stroke();
        k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + (x < 540 ? -120 : 120), y + 200, x + (x < 540 ? -60 : 60), y + 520); k.lineWidth = 9; k.stroke(); }
      if (kf > 0.95) { const q = seg(t, C.fieldFull, C.fieldFull + 0.4); P.note(g, t, 'zzz', 540, 1460 - 10 * Math.sin(t * 5), 540, 1290, q, '#5fd0ff'); }
    });
    add('1965: a bag of salty water', 1, C.xray, (g, t) => {
      camera(g, t, [[C.xray, 520, 940, 1.0, 0.02], [C.touch65, 600, 900, 1.15, -0.02]]);
      P.insertBg(g, t, '#203a4a', '#08131c');
      const tip = [330, 640 + 20 * Math.sin(t * 2)], ang = -2.35;
      g.save(); g.globalAlpha = 0.55; P.bigFinger(g, t, tip, ang, { skin: '#cfe8ff', sleeve: '#7aa6c2', len: 620, w: 170 }); g.restore();
      // water + salt inside the finger (clipped to a finger-shaped capsule)
      g.save(); g.translate(tip[0], tip[1]); g.rotate(ang + Math.PI); g.beginPath(); g.roundRect(-10, -72, 440, 144, 72); g.clip();
      const lvl = -20 + 10 * Math.sin(t * 3);
      g.fillStyle = 'rgba(70,170,255,.75)'; g.beginPath(); g.moveTo(-20, 100);
      for (let x = -20; x <= 460; x += 20) g.lineTo(x, lvl + 14 * Math.sin(x * 0.03 + t * 5)); g.lineTo(460, 100); g.closePath(); g.fill();
      const ks = seg(t, C.salt - 0.2, C.salt + 0.4);
      for (let i = 0; i < 12; i++) { if (hs(i) > ks) continue; const x = 30 + hs(i + 3) * 380, y = 10 + 50 * hs(i + 9) + 8 * Math.sin(t * 4 + i);
        g.save(); g.translate(x, y); g.rotate(t * (hs(i) - 0.5) * 3); g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 3; g.fillRect(-9, -9, 18, 18); g.strokeRect(-9, -9, 18, 18); g.restore(); }
      for (let i = 0; i < 6; i++) { const y = ((t * 60 + i * 30) % 90) - 20; g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(60 + i * 60, 60 - y, 6, 0, 7); g.fill(); }
      g.restore();
      P.note(g, t, 'salty water!', 640, 1180, 470, 860, seg(t, C.salt, C.salt + 0.3), '#7fd6ff');
    });
    const glassPanel = (g, t, seed = 33) => {
      const k = Stick.sketchCtx(g, t, seed); k.strokeStyle = INK; k.lineWidth = 12;
      k.beginPath(); k.roundRect(140, 380, 800, 900, 30); k.fillStyle = '#1b2a24'; k.fill(); k.stroke();
      P.field(g, t, 150, 390, 780, 880, 1);
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) { k.beginPath(); k.roundRect(x - 34, y - 34, 68, 68, 12); k.fillStyle = '#b8bcc4'; k.fill(); k.lineWidth = 8; k.stroke(); }
    };
    const T65 = [560, 860];
    add('1965: it steals charge', 1, C.touch65, (g, t) => {
      camera(g, t, [[C.touch65, 540, 860, 1.1, 0.02], [C.notice, 560, 860, 1.0, -0.02]]);
      P.insertBg(g, t, '#2c3a33', '#0e1611'); glassPanel(g, t);
      const pr = eo(seg(t, C.touch65, C.touch65 + 0.35));
      const ks = seg(t, C.steal, C.charge + 0.3);
      for (const c of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) P.chargeFlow(g, t, c, T65, 5, ks);
      // corner meters: needle dips when the charge leaves
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) { const d = eo(seg(t, C.steal + 0.2, C.charge + 0.4)) * 0.9 + 0.05 * Math.sin(t * 9);
        g.save(); g.translate(x, y + (y < 800 ? -110 : 110)); g.fillStyle = '#f4ecd8'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 60, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
        g.rotate(-Math.PI / 2 + 1.2 - d * 2.2); g.strokeStyle = '#c8452f'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -50); g.stroke(); g.restore(); }
      P.bigFinger(g, t, [lerp(760, T65[0], pr), lerp(1500, T65[1], pr)], -2.0, { press: pr > 0.9 ? 0.6 : 0 });
      if (ks > 0.2) { g.save(); g.translate(T65[0], T65[1]); g.rotate(t * 5); g.strokeStyle = 'rgba(95,208,255,.8)'; g.lineWidth = 5; g.beginPath(); for (let a = 0; a < 12; a += 0.2) g.lineTo(Math.cos(a) * a * 6, Math.sin(a) * a * 6); g.stroke(); g.restore(); }
    });
    add('1965: the screen notices', 1, C.notice, (g, t) => {
      camera(g, t, [[C.notice, 560, 860, 1.0, 0], [C.theft, 560, 860, 1.12, 0.03], [C.scary - 0.4, 540, 880, 1.2, -0.02]]);
      P.insertBg(g, t, '#2c3a33', '#0e1611'); glassPanel(g, t);
      const flash = Math.sin(t * 22) > 0 && t > C.notice + 0.1 && t < C.yourTouch;
      const cs = [[140, 380], [940, 380], [140, 1280], [940, 1280]];
      for (const [x, y] of cs) { g.fillStyle = flash ? '#ff4a3a' : '#7a2a24'; g.beginPath(); g.arc(x, y, 24, 0, 7); g.fill(); }
      const lk = eo(seg(t, C.notice + 0.15, C.theft));
      g.strokeStyle = 'rgba(255,90,70,.85)'; g.lineWidth = 5; g.setLineDash([22, 14]); g.lineDashOffset = -t * 120;
      for (const [x, y] of cs) { g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, T65[0], lk), lerp(y, T65[1], lk)); g.stroke(); } g.setLineDash([]);
      P.bigFinger(g, t, T65, -2.0, { press: 0.6 });
      const tu = seg(t, C.theft - 0.05, C.theft + 0.25); P.stamp(g, 'THIEF!', 540, 560, tu);
      const ok = seg(t, C.yourTouch - 0.1, C.yourTouch + 0.6);
      if (ok > 0) { for (let i = 0; i < 3; i++) { const u = ((t - C.yourTouch) * 0.9 + i / 3) % 1; g.strokeStyle = `rgba(120,255,160,${(1 - u) * ok})`; g.lineWidth = 8; g.beginPath(); g.arc(T65[0], T65[1], 40 + 220 * u, 0, 7); g.stroke(); }
        text(g, 'TOUCH!', 540, 1160, 96, '#8dffb0', { scale: back(ok) }); }
    });
    add('1965: electricity is scary', 1, C.scary - 0.35, (g, t) => {
      camera(g, t, [[C.scary - 0.35, 520, 960, 1.15, 0.02], [C.ff1a + 0.5, 700, 1000, 1.0, -0.03]]);
      radarSet(g, t);
      const al = seg(t, C.scary - 0.3, C.scary);
      if (al > 0) { g.save(); g.globalAlpha = 0.28 * al * (0.6 + 0.4 * Math.sin(t * 14)); g.fillStyle = '#ff2a1a'; g.fillRect(-400, -400, 1880, 2700); g.restore();
        for (let i = 0; i < 8; i++) { const sx = MON[0] + hs(i + Math.floor(t * 20) * 7) * MON[2], sy = MON[1] + hs(i * 3 + Math.floor(t * 20)) * MON[3];
          g.strokeStyle = '#fff6a0'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 30, sy - 20); g.lineTo(sx + 10, sy - 50); g.stroke(); } }
      const wk = walker(t, [[C.runOff, DX], [C.runOff + 0.75, 1400]]);
      const jump = seg(t, C.runOff - 0.1, C.runOff + 0.25), y = t < C.runOff + 0.25 ? lerp(DY, 1760, eio(jump)) - 160 * Math.sin(Math.PI * jump) : 1760;
      const p = davePose([[C.scary - 0.4, 'suspicious', {}], [C.scary - 0.05, 'panic', {}]], t);
      if (wk.k > 0) wk.ph *= 1.8;
      drawDave(g, t, wk.x, y, DS, p, wk); P.puff(g, t, DX, DY, seg(t, C.runOff, C.runOff + 0.8));
      if (al > 0.5) text(g, '!!', wk.x + 120, y - 760, 140, '#ffd35a', { rot: 0.2 });
    });

    // ============================================================ ERA 2: 1977 resistive
    const SX0 = 140, SX1 = 940, TOPY = 760, BOTY = 900;
    const sheets = (g, t, dip, dipX, lit) => {
      const k = Stick.sketchCtx(g, t, 41); k.strokeStyle = INK; k.lineWidth = 9;
      // bottom sheet + coating
      k.beginPath(); k.roundRect(SX0, BOTY, SX1 - SX0, 60, 10); k.fillStyle = '#9fb0bf'; k.fill(); k.stroke();
      g.fillStyle = lit ? '#ffd35a' : '#c6a24a'; g.fillRect(SX0 + 6, BOTY - 6, SX1 - SX0 - 12, 10);
      // spacer dots
      for (let x = SX0 + 60; x < SX1; x += 110) { if (Math.abs(x - dipX) < 70 && dip > 0.2) continue; g.fillStyle = '#e9e1d2'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(x, BOTY - 22, 14, 0, 7); g.fill(); g.stroke(); }
      // flexible top sheet: bends down under the finger
      const yAt = (x) => TOPY + dip * (BOTY - 8 - TOPY) * Math.exp(-Math.pow((x - dipX) / 150, 2));
      k.beginPath(); k.moveTo(SX0, yAt(SX0) - 40); for (let x = SX0; x <= SX1; x += 20) k.lineTo(x, yAt(x) - 40);
      for (let x = SX1; x >= SX0; x -= 20) k.lineTo(x, yAt(x)); k.closePath(); k.fillStyle = 'rgba(190,225,255,.85)'; k.fill(); k.stroke();
      g.strokeStyle = lit ? '#ffd35a' : '#c6a24a'; g.lineWidth = 8; g.beginPath(); for (let x = SX0 + 6; x <= SX1 - 6; x += 20) x === SX0 + 6 ? g.moveTo(x, yAt(x) + 2) : g.lineTo(x, yAt(x) + 2); g.stroke();
      return yAt;
    };
    add('1977: two sheets', 2, C.ff1a, (g, t) => {
      camera(g, t, [[C.ff1a, 540, 830, 1.15, -0.03], [C.press, 540, 860, 1.0, 0.02]]);
      P.insertBg(g, t, '#8a5530', '#2a160a');
      const u = eo(seg(t, C.sheets - 0.3, C.sheets + 0.4));
      g.save(); g.translate(0, (1 - u) * -600); sheets(g, t, 0, 540, false); g.restore();
      P.note(g, t, 'plastic', 300, 560, 360, 730, seg(t, C.sheets + 0.2, C.sheets + 0.5), '#ffe6a8');
      const gu = seg(t, C.gap, C.gap + 0.3);
      if (gu > 0) { g.strokeStyle = '#ffe6a8'; g.lineWidth = 6; const x = 760; g.beginPath(); g.moveTo(x, TOPY + 4); g.lineTo(x, BOTY - 8); g.moveTo(x - 20, TOPY + 4); g.lineTo(x + 20, TOPY + 4); g.moveTo(x - 20, BOTY - 8); g.lineTo(x + 20, BOTY - 8); g.stroke();
        text(g, 'tiny gap', 760, 1100, 72, '#ffe6a8', { font: P.HAND, weight: 700, scale: back(gu) }); }
    });
    add('1977: press, touch, circuit', 2, C.press, (g, t) => {
      camera(g, t, [[C.press, 540, 860, 1.0, 0.02], [C.contact, 520, 900, 1.12, -0.02], [C.wind, 600, 900, 1.05, 0.01]]);
      P.insertBg(g, t, '#8a5530', '#2a160a');
      const d = eo(seg(t, C.press - 0.1, C.contact)), lit = t > C.contact;
      const yAt = sheets(g, t, d, 520, lit);
      // circuit: wires from both sheets to a battery and a bulb
      const cu = eo(seg(t, C.circuit - 0.2, C.circuit + 0.4));
      g.strokeStyle = cu > 0 ? '#ffd35a' : '#6b5a48'; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.moveTo(SX1, TOPY - 20); g.lineTo(1000, TOPY - 20); g.lineTo(1000, 1250); g.lineTo(700, 1250); g.moveTo(560, 1250); g.lineTo(80, 1250); g.lineTo(80, BOTY + 30); g.lineTo(SX0, BOTY + 30); g.stroke();
      if (cu > 0) { g.strokeStyle = '#fff'; g.lineWidth = 6; g.setLineDash([16, 40]); g.lineDashOffset = -t * 300; g.beginPath(); g.moveTo(SX1, TOPY - 20); g.lineTo(1000, TOPY - 20); g.lineTo(1000, 1250); g.lineTo(80, 1250); g.lineTo(80, BOTY + 30); g.stroke(); g.setLineDash([]); }
      const k = Stick.sketchCtx(g, t, 43); k.strokeStyle = INK; k.lineWidth = 8;
      k.beginPath(); k.roundRect(560, 1210, 140, 80, 12); k.fillStyle = '#3a8d5a'; k.fill(); k.stroke(); text(g, '+', 670, 1250, 50, '#fff', { stroke: 0 });
      const bl = seg(t, C.closes - 0.1, C.closes + 0.15);
      if (bl > 0) { const rg = g.createRadialGradient(300, 1170, 10, 300, 1170, 260); rg.addColorStop(0, `rgba(255,230,120,${0.9 * bl})`); rg.addColorStop(1, 'rgba(255,230,120,0)'); g.fillStyle = rg; g.fillRect(0, 900, 700, 600); }
      k.beginPath(); k.arc(300, 1170, 60, 0, 7); k.fillStyle = bl > 0 ? '#fff3b0' : '#e8e4da'; k.fill(); k.stroke(); k.beginPath(); k.rect(275, 1225, 50, 40); k.fillStyle = '#9aa3ad'; k.fill(); k.stroke();
      P.bigFinger(g, t, [520, yAt(520) - 44 - (1 - d) * 300], Math.PI / 2, { press: d > 0.9 ? 0.6 : 0 });
      const sp = bump(t, C.contact - 0.03, 0.35); if (sp > 0) { g.save(); g.translate(520, BOTY - 6); g.fillStyle = '#fff6a0'; for (let i = 0; i < 8; i++) { g.rotate(0.785); g.beginPath(); g.moveTo(0, -6); g.lineTo(60 * sp, 0); g.lineTo(0, 6); g.fill(); } g.restore(); }
      if (t > C.closes) text(g, 'CLICK!', 300, 980, 80, '#ffd35a', { scale: back(seg(t, C.closes, C.closes + 0.3)), rot: -0.1 });
    });
    add('1977: the hammer', 2, C.wind - 0.35, (g, t) => {
      camera(g, t, [[C.wind - 0.35, 620, 1000, 1.05, 0.02], [C.hit - 0.05, 560, 980, 1.16, -0.02], [C.hit + 0.1, 560, 980, 1.0, 0.01], [C.wp1a, 480, 920, 1.18, -0.02]]);
      const cr = seg(t, C.hit, C.hit + 0.25), dent = bump(t, C.hit, 0.3);
      P.room(g, t, PAL.s70); P.bench(g, t, 300, 1060, 1110, PAL.s70.wood);
      P.monitor(g, t, MON[0], MON[1], MON[2], MON[3], { kind: 'terminal', dent, crack: cr, shake: dent * 8, glass: '#1d2a1d', content: (g, x, y, w, h) => {
        g.fillStyle = '#7dff9a'; g.font = '700 44px monospace'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('> PRESS HERE_', x + 30, y + 40 + 0 * t); } });
      P.lamp(g, t, 600, -260); P.stool(g, t, DX, DY);
      const p = davePose([[C.wind - 0.35, 'smug', { handR: [70, 330] }], [C.wind, 'angry', { handR: [-40, 560], lean: 0.1 }], [C.hit - 0.12, 'angry', { handR: POKE(500, 930), lean: -0.12 }],
        [C.hit + 0.2, 'panic', { handR: [90, 380] }], [C.notHard, 'defeat', { handR: [80, 300] }, 11], [C.sideEye - 0.05, 'suspicious', { look: [0.9, 0.1], handR: [80, 300] }]], t);
      drawDave(g, t, DX, DY, DS, p);
      if (t < C.hit + 0.4) { const hnd = handAt(DX, DY, DS, p, 'R'), sw = eio(seg(t, C.hit - 0.32, C.hit - 0.05)), ang = lerp(-2.4, -0.25, sw) + (t < C.wind ? 0.3 * Math.sin(t * 6) * 0.2 : 0);
        P.hammer(g, t, hnd, ang, 1.1); }
      P.shards(g, t, 560, 900, seg(t, C.hit, C.hit + 1.1) * 1.4); P.puff(g, t, 600, 1000, seg(t, C.hit, C.hit + 0.9), 1.4);
      const hd = [DX - 10, DY - 670]; if (t > C.hit + 0.3) P.stars(g, t, hd[0], hd[1], seg(t, C.hit + 0.3, C.hit + 0.6));
      const ck = bump(t, C.hit - 0.02, 0.5); if (ck > 0) text(g, 'CRACK!', 640, 520, 150, '#fff', { scale: back(ck * 1.5), rot: -0.12 });
    });

    // ============================================================ ERA 3: 1983 infrared grid
    const IRX = 140, IRY = 380, IRW = 800, IRH = 900, ROWS = 8, COLS = 7;
    const irScreen = (g, t, rows, cols, block, ui) => {
      const k = Stick.sketchCtx(g, t, 51); k.strokeStyle = INK; k.lineWidth = 12;
      k.beginPath(); k.roundRect(IRX - 70, IRY - 70, IRW + 140, IRH + 140, 40); k.fillStyle = '#e8dcc0'; k.fill(); k.stroke();
      g.fillStyle = '#16201a'; g.fillRect(IRX, IRY, IRW, IRH); if (ui) ui(g);
      for (let i = 0; i < ROWS; i++) { const y = IRY + (i + 0.5) * IRH / ROWS; g.fillStyle = i < rows * ROWS ? '#ff3b30' : '#5a2a24'; g.fillRect(IRX - 50, y - 12, 30, 24); g.fillStyle = '#333'; g.fillRect(IRX + IRW + 20, y - 12, 30, 24); }
      for (let j = 0; j < COLS; j++) { const x = IRX + (j + 0.5) * IRW / COLS; g.fillStyle = j < cols * COLS ? '#ff3b30' : '#5a2a24'; g.fillRect(x - 12, IRY - 50, 24, 30); g.fillStyle = '#333'; g.fillRect(x - 12, IRY + IRH + 20, 24, 30); }
      g.save(); g.shadowColor = '#ff3b30'; g.shadowBlur = 16; g.lineWidth = 5;
      for (let i = 0; i < ROWS; i++) { const y = IRY + (i + 0.5) * IRH / ROWS, len = cl(rows * ROWS - i) * IRW; if (len <= 0) continue;
        const bx = block.find((b) => Math.abs(b[1] - y) < b[2]); g.strokeStyle = `rgba(255,70,50,${0.55 + 0.25 * Math.sin(t * 9 + i)})`;
        g.beginPath(); g.moveTo(IRX, y); g.lineTo(IRX + Math.min(len, bx ? bx[0] - IRX - bx[2] * 0.6 : len), y); g.stroke(); }
      for (let j = 0; j < COLS; j++) { const x = IRX + (j + 0.5) * IRW / COLS, len = cl(cols * COLS - j) * IRH; if (len <= 0) continue;
        const by = block.find((b) => Math.abs(b[0] - x) < b[2]); g.strokeStyle = `rgba(255,70,50,${0.55 + 0.25 * Math.sin(t * 8 + j)})`;
        g.beginPath(); g.moveTo(x, IRY); g.lineTo(x, IRY + Math.min(len, by ? by[1] - IRY - by[2] * 0.6 : len)); g.stroke(); }
      g.restore();
    };
    const cellXY = (i, j) => [IRX + (j + 0.5) * IRW / COLS, IRY + (i + 0.5) * IRH / ROWS];
    add('1983: light beams', 3, C.wp1a, (g, t) => {
      camera(g, t, [[C.wp1a, 540, 830, 1.12, 0.03], [C.block, 540, 830, 1.0, -0.02]]);
      P.insertBg(g, t, '#2a3346', '#090c14');
      irScreen(g, t, eo(seg(t, C.beams - 0.1, C.beams + 0.7)), eo(seg(t, C.beams2 - 0.2, C.beams2 + 0.6)), []);
    });
    const BLK = cellXY(3, 4);
    add('1983: block a beam', 3, C.block, (g, t) => {
      camera(g, t, [[C.block, 540, 830, 1.0, -0.02], [C.knows, BLK[0], BLK[1], 1.25, 0.02], [C.flyIn, 560, 820, 1.08, 0]]);
      P.insertBg(g, t, '#2a3346', '#090c14');
      const pr = eo(seg(t, C.block - 0.1, C.block + 0.35)), tip = [lerp(900, BLK[0], pr), lerp(1500, BLK[1], pr)];
      irScreen(g, t, 1, 1, pr > 0.95 ? [[BLK[0], BLK[1], 40]] : []);
      P.bigFinger(g, t, tip, -2.2, { press: pr > 0.95 ? 0.5 : 0 });
      const q = seg(t, C.knows - 0.1, C.knows + 0.3);
      if (q > 0) { g.strokeStyle = '#7dff9a'; g.lineWidth = 7; const r = 70 + 20 * Math.sin(t * 8); g.beginPath(); g.arc(BLK[0], BLK[1], r * back(q), 0, 7); g.moveTo(BLK[0] - r - 30, BLK[1]); g.lineTo(BLK[0] - r + 20, BLK[1]); g.moveTo(BLK[0] + r - 20, BLK[1]); g.lineTo(BLK[0] + r + 30, BLK[1]); g.stroke();
        text(g, 'HERE!', BLK[0], BLK[1] - 160, 80, '#7dff9a', { scale: back(q) }); }
    });
    const BTN = [540, 1110];
    add('1983: a fly lands', 3, C.flyIn, (g, t) => {
      camera(g, t, [[C.flyIn, 560, 860, 1.02, 0.02], [C.flyLand, BTN[0], BTN[1] - 80, 1.3, -0.03], [C.fired - 0.4, 540, 900, 1.1, 0.02]]);
      P.insertBg(g, t, '#2a3346', '#090c14');
      const fu = seg(t, C.flyIn, C.flyLand), landed = t >= C.flyLand;
      const fx = landed ? BTN[0] : lerp(1250, BTN[0], eio(fu)) + 160 * Math.sin(fu * 13) * (1 - fu), fy = landed ? BTN[1] - 30 : lerp(300, BTN[1] - 30, eio(fu)) + 120 * Math.cos(fu * 9) * (1 - fu);
      const del = seg(t, C.del, C.del + 1.2);
      irScreen(g, t, 1, 1, landed ? [[BTN[0], BTN[1], 30]] : [], (g) => {
        for (let i = 0; i < 6; i++) { const x = IRX + 120 + (i % 3) * 260, y = IRY + 160 + Math.floor(i / 3) * 260, fly = cl(del * 3 - i * 0.25);
          g.save(); g.translate(x + fly * (hs(i) - 0.5) * 1400, y - fly * 900); g.rotate(fly * 6 * (hs(i + 2) - 0.5)); g.fillStyle = '#e8dcc0'; g.fillRect(-60, -75, 120, 150); g.fillStyle = '#9aa3ad'; for (let l = 0; l < 4; l++) g.fillRect(-40, -45 + l * 30, 80, 10); g.restore(); }
        const pressed = t > C.del; g.fillStyle = pressed ? '#8a1f18' : '#d6332b'; g.beginPath(); g.roundRect(BTN[0] - 210, BTN[1] - 70 + (pressed ? 8 : 0), 420, 140, 26); g.fill();
        text(g, 'DELETE ALL', BTN[0], BTN[1] + (pressed ? 8 : 0), 60, '#fff', { stroke: 0 });
      });
      P.fly(g, t, fx, fy, 1.6, landed);
      if (t > C.del) text(g, 'DELETED', 540, 520, 110, '#ff6a5a', { scale: back(seg(t, C.del, C.del + 0.3)), rot: 0.08 });
    });
    add('1983: plan C is fired', 3, C.fired - 0.4, (g, t) => {
      camera(g, t, [[C.fired - 0.4, 560, 980, 1.12, -0.02], [C.wp2a, 600, 960, 1.0, 0.02]]);
      P.room(g, t, PAL.s80); P.bench(g, t, 300, 1060, 1110, PAL.s80.wood);
      P.monitor(g, t, MON[0], MON[1], MON[2], MON[3], { kind: 'terminal', body: '#e8dcc0', content: (g, x, y, w, h) => {
        g.strokeStyle = 'rgba(255,70,50,.6)'; g.lineWidth = 4; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x, y + i * h / 6); g.lineTo(x + w, y + i * h / 6); g.stroke(); g.beginPath(); g.moveTo(x + i * w / 6, y); g.lineTo(x + i * w / 6, y + h); g.stroke(); } } });
      P.lamp(g, t, 600, -260, 'rgba(160,200,255,'); P.stool(g, t, DX, DY);
      const p = davePose([[C.fired - 0.4, 'angry', { handR: [190, 420] }], [C.fired, 'angry', { handR: POKE(560, 820) }, 13]], t);
      drawDave(g, t, DX, DY, DS, p);
      P.fly(g, t, DX + Math.cos(t * 5) * 170, DY - 760 + Math.sin(t * 7) * 60, 1.1);
      P.stamp(g, 'FIRED', 680, 780, seg(t, C.fired - 0.05, C.fired + 0.25), '#d6332b', 0.15);
    });

    // ============================================================ ERA 4: 1996 stylus
    add('1996: phones get a pen', 4, C.wp2a, (g, t) => {
      camera(g, t, [[C.wp2a, 540, 860, 1.15, 0.02], [C.pen, 560, 840, 1.0, -0.02], [C.lost, 560, 880, 1.1, 0.02]]);
      P.insertBg(g, t, '#4f9a8c', '#173a35');
      const m = P.phone(g, t, 290, 300, 500, 1100, { kind: 'pda', glass: '#9db58a', content: (g, x, y, w, h) => {
        g.fillStyle = '#9db58a'; g.fillRect(x, y, w, h); g.fillStyle = '#2d3a26'; g.font = '700 48px monospace'; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText('MEMO', x + 30, y + 30); const n = Math.floor(cl((t - C.wp2a) / 2) * 5); for (let i = 0; i < n; i++) g.fillRect(x + 30, y + 120 + i * 60, w * (0.4 + 0.4 * hs(i)), 18); } });
      const pu = eo(seg(t, C.pen - 0.2, C.pen + 0.3));
      const taps = [C.tap96, C.tap96 + 0.45, C.tap96 + 0.9];
      if (pu < 0.05) { let pr = 0; for (const tp of taps) pr = Math.max(pr, bump(t, tp - 0.1, 0.32)); P.bigFinger(g, t, [540 + 40 * Math.sin(t), lerp(1120, 700, pr)], -1.75, { press: pr > 0.8 ? 0.5 : 0 }); }
      else { const tp = Math.abs(Math.sin((t - C.pen) * 7)), tip = [lerp(1200, 520, pu) + 60 * Math.sin(t * 2.5), lerp(-200, 640, pu) - 50 * tp];
        g.save(); g.translate(tip[0], tip[1]); g.rotate(-0.6); const k = Stick.sketchCtx(g, t, 61); k.strokeStyle = INK; k.lineWidth = 7;
        k.beginPath(); k.moveTo(0, 0); k.lineTo(26, -60); k.lineTo(26, -560); k.lineTo(-26, -560); k.lineTo(-26, -60); k.closePath(); k.fillStyle = '#e3e6ea'; k.fill(); k.stroke(); g.restore();
        if (tp < 0.2) { g.strokeStyle = 'rgba(45,58,38,.7)'; g.lineWidth = 4; g.beginPath(); g.arc(tip[0], tip[1], 30, 0, 7); g.stroke(); }
        text(g, '!', tip[0] + 90, tip[1] - 300, 120, '#ffd35a', { alpha: bump(t, C.pen, 0.6) }); }
    });
    add('1996: lost in four minutes', 4, C.lost, (g, t) => {
      camera(g, t, [[C.lost, 560, 1000, 1.0, 0.02], [C.catPen, 760, 900, 1.15, -0.02], [C.wp3a, 820, 880, 1.25, 0.02]]);
      P.room(g, t, PAL.s90); P.bench(g, t, 300, 1060, 1110, PAL.s90.wood);
      const tm = eo(seg(t, C.lost, C.four + 0.4)) * 240, mm = Math.floor(tm / 60), ss = Math.floor(tm % 60);
      const k = Stick.sketchCtx(g, t, 71); k.strokeStyle = INK; k.lineWidth = 10; k.beginPath(); k.roundRect(140, 560, 420, 200, 24); k.fillStyle = '#20232b'; k.fill(); k.stroke();
      text(g, `${mm}:${String(ss).padStart(2, '0')}`, 350, 664, 130, mm >= 4 ? '#ff5a4a' : '#ffd35a', { stroke: 0, font: 'monospace', weight: 700 });
      P.lamp(g, t, 700, -260);
      const catPen = t > C.catPen; P.cat(g, t, 880, 1110, { pen: catPen });
      // Dave searches: a new place and pose every beat
      const xs = [[C.lost - 0.2, 320], [C.lost + 0.45, 620], [C.four - 0.05, 260], [C.four + 0.5, 520], [C.catPen + 0.2, 640]];
      const wk = walker(t, xs);
      const p = davePose([[C.lost - 0.2, 'panic', { handL: [-60, 200], handR: [60, 210] }], [C.lost + 0.5, 'suspicious', { lean: 0.5, hip: [0, -60], handR: [140, 120] }, 15],
        [C.four, 'panic', { handL: [-150, 450], handR: [150, 460] }, 16], [C.four + 0.55, 'angry', { lean: -0.2, handR: [100, 300] }, 17],
        [C.catPen + 0.15, 'suspicious', { look: [0.9, -0.1], handR: [60, 300] }]], t);
      drawDave(g, t, wk.x, 1760, 1.3, p, wk);
      if (catPen) text(g, '!?', 900, 760, 110, '#ffd35a', { scale: back(seg(t, C.catPen, C.catPen + 0.3)) });
    });

    // ============================================================ ERA 5: 2007 multi-touch
    const homeIcons = (g, x, y, w, h, t) => { const c = ['#ff6a5a', '#ffd35a', '#7dff9a', '#5fd0ff', '#c58aff', '#ff9a3c'];
      g.fillStyle = '#18233a'; g.fillRect(x, y, w, h); for (let i = 0; i < 16; i++) { const cx = x + 60 + (i % 4) * (w - 120) / 3, cy = y + 90 + Math.floor(i / 4) * 160;
        g.fillStyle = c[i % 6]; g.beginPath(); g.roundRect(cx - 45, cy - 45, 90, 90, 22); g.fill(); } };
    const PH = [240, 260, 600, 1160], PT = [540, 820];
    add('2007: stealing again', 5, C.wp3a, (g, t) => {
      camera(g, t, [[C.wp3a, 540, 860, 1.15, -0.02], [C.wires, 540, 840, 1.02, 0.02]]);
      P.insertBg(g, t, '#46607a', '#101a26');
      const m = P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => homeIcons(g, x, y, w, h, t) });
      const pr = eo(seg(t, C.steal07 - 0.3, C.steal07));
      P.field(g, t, m.gx, m.gy, m.gw, m.gh, eo(seg(t, C.steal07, C.steal07 + 0.5)));
      for (const c of [[m.gx, m.gy], [m.gx + m.gw, m.gy], [m.gx, m.gy + m.gh], [m.gx + m.gw, m.gy + m.gh]]) P.chargeFlow(g, t, c, PT, 5, seg(t, C.steal07 + 0.2, C.steal07 + 1.2));
      P.bigFinger(g, t, [lerp(820, PT[0], pr), lerp(1600, PT[1], pr)], -2.0, { press: pr > 0.95 ? 0.5 : 0 });
    });
    add('2007: wires too thin to see', 5, C.wires, (g, t) => {
      camera(g, t, [[C.wires, 540, 900, 1.0, 0.03], [C.see, 540, 900, 1.25, -0.02]]);
      P.insertBg(g, t, '#46607a', '#101a26');
      g.fillStyle = '#0e1422'; g.beginPath(); g.roundRect(120, 380, 840, 1060, 30); g.fill();
      const thick = 1 - 0.8 * eo(seg(t, C.thin, C.see + 0.2)), nr = Math.floor(eo(seg(t, C.wires, C.wires + 0.8)) * 12), nc = Math.floor(eo(seg(t, C.wires + 0.3, C.wires + 1.1)) * 9);
      const tx = 540 + 160 * Math.sin(t * 1.3), ty = 900 + 200 * Math.cos(t * 1.1);
      for (let i = 0; i < nr; i++) { const y = 420 + i * 85; g.strokeStyle = `rgba(95,208,255,${0.25 + 0.6 * thick})`; g.lineWidth = 2 + 14 * thick; g.beginPath(); g.moveTo(140, y); g.lineTo(940, y); g.stroke(); }
      for (let j = 0; j < nc; j++) { const x = 170 + j * 92; g.strokeStyle = `rgba(255,181,71,${0.25 + 0.6 * thick})`; g.lineWidth = 2 + 14 * thick; g.beginPath(); g.moveTo(x, 400); g.lineTo(x, 1420); g.stroke(); }
      if (nr > 6 && nc > 5) { g.save(); g.shadowColor = '#fff'; g.shadowBlur = 30; g.fillStyle = '#fff'; g.beginPath(); g.arc(tx, ty, 26 + 6 * Math.sin(t * 9), 0, 7); g.fill(); g.restore(); }
      const q = seg(t, C.see - 0.1, C.see + 0.3); if (q > 0) P.note(g, t, 'invisible!', 540, 1560, 540, 1400, q, '#ffd35a');
    });
    add('2007: ten fingers at once', 5, C.ten - 0.2, (g, t) => {
      camera(g, t, [[C.ten - 0.2, 540, 860, 1.05, -0.02], [C.winter, 540, 840, 1.15, 0.03]]);
      P.insertBg(g, t, '#46607a', '#101a26');
      const zm = 1 + 1.4 * eio(seg(t, C.pinch - 0.1, C.pinch + 0.7));
      const m = P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => {
        g.save(); g.translate(x + w / 2, y + h / 2); g.scale(zm, zm); g.fillStyle = '#f2c38a'; g.fillRect(-w, -h, 2 * w, 2 * h);
        P.cat(g, t, 40, 260, {}); g.restore(); } });
      const n = Math.floor(eo(seg(t, C.ten, C.ten + 0.6)) * 10);
      for (let i = 0; i < n; i++) { const a = i / 10 * 6.283 + 0.3, r = 240 + 60 * hs(i), sp = 1 + 0.6 * eio(seg(t, C.pinch - 0.1, C.pinch + 0.7));
        const x = m.cx + Math.cos(a) * r * 0.75 * sp, y = m.cy + Math.sin(a) * r * sp; g.save(); g.shadowColor = '#5fd0ff'; g.shadowBlur = 24; g.fillStyle = 'rgba(95,208,255,.85)'; g.beginPath(); g.arc(x, y, 44, 0, 7); g.fill(); g.restore();
        text(g, String(i + 1), x, y, 46, '#0b1220', { stroke: 0 }); }
    });
    add('2007: winter comes', 5, C.winter, (g, t) => {
      camera(g, t, [[C.winter, 560, 1000, 1.0, -0.02], [C.glove, 520, 940, 1.12, 0.02]]);
      P.room(g, t, PAL.s07); P.bench(g, t, 300, 1060, 1110, PAL.s07.wood); P.lamp(g, t, 760, -260, 'rgba(200,225,255,');
      const shiver = 4 * Math.sin(t * 40);
      const p = davePose([[C.winter - 0.1, 'panic', { handL: [-60, 300], handR: [80, 320], sweat: 0 }], [C.winter + 0.5, 'angry', { handL: [-30, 330], handR: [60, 380] }, 19]], t);
      const x = 420 + shiver; drawDave(g, t, x, 1760, 1.3, p);
      const hl = handAt(x, 1760, 1.3, p, 'L'), hr = handAt(x, 1760, 1.3, p, 'R');
      P.phone(g, t, hl[0] - 70, hl[1] - 240, 160, 300, { content: (g, X, Y, w, h) => homeIcons(g, X, Y, w, h, t) });
      P.glove(g, t, hl, 1.3); P.glove(g, t, [hr[0] + 10 * Math.sin(t * 14), hr[1]], 1.3);
      for (let i = 0; i < 3; i++) { const u = ((t * 0.8 + i / 3) % 1); g.fillStyle = `rgba(255,255,255,${0.6 * (1 - u)})`; g.beginPath(); g.arc(x + 70 + 90 * u, 1760 - 560 - 40 * u, 20 + 30 * u, 0, 7); g.fill(); }
      P.snow(g, t, seg(t, C.winter - 0.2, C.winter + 0.6));
      g.save(); g.globalAlpha = 0.25 * seg(t, C.winter, C.winter + 0.8); g.fillStyle = '#bfe3ff'; g.fillRect(-400, -400, 1880, 2700); g.restore();
    });
    add('2007: gloves don’t conduct', 5, C.glove, (g, t) => {
      camera(g, t, [[C.glove, 540, 860, 1.0, 0.02], [C.nothing, 540, 860, 1.14, -0.02]]);
      P.insertBg(g, t, '#6b8aa8', '#1a2a3a'); P.snow(g, t, 1, 50);
      const m = P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => homeIcons(g, x, y, w, h, t) });
      let pr = 0; for (const tp of [C.glove, C.glove + 0.55, C.glove + 1.1, C.nothing + 0.2]) pr = Math.max(pr, bump(t, tp - 0.1, 0.35));
      // the charges stay home in the corners and stare at the glove
      for (const [cx, cy] of [[m.gx + 60, m.gy + 60], [m.gx + m.gw - 60, m.gy + 60], [m.gx + 60, m.gy + m.gh - 60], [m.gx + m.gw - 60, m.gy + m.gh - 60]]) {
        g.fillStyle = '#5fd0ff'; g.beginPath(); g.arc(cx, cy, 34, 0, 7); g.fill(); const lx = Math.sign(PT[0] - cx) * 6, ly = Math.sign(PT[1] - cy) * 6;
        g.fillStyle = '#fff'; for (const d of [-12, 12]) { g.beginPath(); g.arc(cx + d, cy - 4, 10, 0, 7); g.fill(); } g.fillStyle = INK; for (const d of [-12, 12]) { g.beginPath(); g.arc(cx + d + lx, cy - 4 + ly, 5, 0, 7); g.fill(); } }
      P.bigFinger(g, t, [lerp(760, PT[0], eio(pr)), lerp(1300, PT[1], eio(pr))], -2.0, { glove: true, len: 420, w: 150 });
      const q = seg(t, C.nothing - 0.1, C.nothing + 0.3); if (q > 0) text(g, '0', m.cx, m.gy + 200, 220, '#5fd0ff', { scale: back(q) });
    });

    // ============================================================ ERA 6: 2009 grease + oil-repelling coat
    const smudges = (g, x, y, w, h, beads, slide, t) => {
      for (let i = 0; i < 14; i++) { const sx = x + 60 + hs(i) * (w - 120), sy = y + 80 + hs(i + 7) * (h - 200), r = 40 + 50 * hs(i + 3);
        if (beads > hs(i + 11)) { const dy = slide * (h + 300) * (0.6 + 0.6 * hs(i + 2)); g.fillStyle = 'rgba(255,240,180,.85)'; g.strokeStyle = 'rgba(80,60,20,.6)'; g.lineWidth = 3;
          g.beginPath(); g.ellipse(sx, sy + dy, r * 0.32, r * 0.38, 0, 0, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(sx - r * 0.1, sy + dy - r * 0.15, r * 0.08, 0, 7); g.fill();
          if (slide > 0) { g.strokeStyle = 'rgba(255,240,180,.25)'; g.lineWidth = r * 0.3; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy + dy); g.stroke(); } }
        else { g.strokeStyle = 'rgba(230,210,150,.45)'; g.lineWidth = 6; for (let r2 = 10; r2 < r; r2 += 12) { g.beginPath(); g.ellipse(sx, sy, r2, r2 * 0.8, hs(i), 0, 7); g.stroke(); } } }
    };
    add('2009: face grease', 6, C.wp4a, (g, t) => {
      camera(g, t, [[C.wp4a, 600, 980, 1.05, 0.02], [C.smear, 520, 860, 1.25, -0.02], [C.grease1 + 0.6, 560, 900, 1.15, 0.02]]);
      P.room(g, t, PAL.kit); P.bench(g, t, 300, 1060, 1110, PAL.kit.wood); P.lamp(g, t, 760, -260);
      const sm1 = eo(seg(t, C.smear - 0.3, C.smear)) * (1 - eo(seg(t, C.smear + 0.35, C.smear + 0.7)));
      const p = davePose([[C.wp4a, 'smug', { handL: [-60, 300], handR: [90, 330] }], [C.fries + 0.6, 'idea', { handL: [-20, 420], handR: [90, 330], open: 0.8, mouth: 'o' }],
        [C.smear - 0.3, 'relief', { handR: [30, 430], lean: -0.1 }], [C.smear + 0.4, 'deadpan', { handR: [110, 360] }, 21]], t);
      const x = 380; drawDave(g, t, x, 1760, 1.3, p);
      const hl = handAt(x, 1760, 1.3, p, 'L'), hr = handAt(x, 1760, 1.3, p, 'R');
      const k = Stick.sketchCtx(g, t, 81); k.strokeStyle = INK; k.lineWidth = 6;   // fries box
      for (let i = 0; i < 6; i++) { k.beginPath(); k.roundRect(hl[0] - 50 + i * 18, hl[1] - 120 - 30 * hs(i), 14, 100, 4); k.fillStyle = '#f2c94c'; k.fill(); k.stroke(); }
      k.beginPath(); k.moveTo(hl[0] - 60, hl[1] - 60); k.lineTo(hl[0] + 60, hl[1] - 60); k.lineTo(hl[0] + 44, hl[1] + 40); k.lineTo(hl[0] - 44, hl[1] + 40); k.closePath(); k.fillStyle = '#d6332b'; k.fill(); k.stroke();
      P.phone(g, t, hr[0] - 90 - 40 * sm1, hr[1] - 330, 180, 340, { content: (g, X, Y, w, h) => { homeIcons(g, X, Y, w, h, t); if (t > C.smear) smudges(g, X, Y, w, h, 0, 0, t); } });
      const q = seg(t, C.grease1, C.grease1 + 0.3); if (q > 0) text(g, 'eww', hr[0] + 120, hr[1] - 400, 80, '#7dff9a', { scale: back(q), rot: 0.15 });
    });
    add('2009: oil-repelling coat', 6, C.grease1 + 0.6, (g, t) => {
      camera(g, t, [[C.grease1 + 0.6, 540, 860, 1.0, -0.02], [C.slide, 540, 900, 1.12, 0.02], [C.wp5a, 540, 960, 1.05, -0.01]]);
      P.insertBg(g, t, '#b8862e', '#3a2408');
      const sw = eo(seg(t, C.coat - 0.2, C.coat + 0.6)), sl = eio(seg(t, C.slide - 0.1, C.slide + 0.9));
      P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => {
        homeIcons(g, x, y, w, h, t); smudges(g, x, y, w, h, sw, sl, t);
        if (sw > 0 && sw < 1) { const sy = y + sw * (h + 200) - 100, gr = g.createLinearGradient(0, sy - 80, 0, sy + 80); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, sy - 80, w, 160); }
      } });
      const q = seg(t, C.slide + 0.4, C.slide + 0.7); if (q > 0) text(g, 'squeak!', 540, 1520, 90, '#fff', { scale: back(q), rot: -0.08 });
    });

    // ============================================================ ERA 7: today (channel palette)
    add('Today: sensor built in', 7, C.wp5a, (g, t) => {
      camera(g, t, [[C.wp5a, 540, 900, 1.1, 0.03], [C.merge, 540, 920, 1.0, -0.02], [C.oled, 540, 940, 1.12, 0.02]]);
      P.insertBg(g, t, '#14233a', '#0b1220');
      const mg = eio(seg(t, C.merge - 0.1, C.merge + 0.8)), rot = 0.15 * Math.sin(t * 0.8);
      const layer = (y, fill, stroke, label, extra) => { g.save(); g.translate(540, y); g.transform(1, 0.3 + rot * 0.3, -1.1, 0.55, 0, 0);
        g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 5; g.beginPath(); g.roundRect(-260, -260, 520, 520, 30); g.fill(); g.stroke(); if (extra) extra(g); g.restore();
        if (label) text(g, label, 920, y + 10, 52, stroke, { align: 'right', font: P.HAND, weight: 700 }); };
      const yTop = 560, yMid = lerp(880, 1170, mg), yBot = 1200;
      layer(yBot, '#1a2440', '#ff9a3c', mg > 0.9 ? 'display + touch' : 'display', (g) => { const c = ['#ff5a4a', '#7dff9a', '#5fd0ff']; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { g.fillStyle = c[(i + j) % 3]; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i + j); g.fillRect(-240 + i * 80, -240 + j * 80, 60, 60); } g.globalAlpha = 1;
        if (mg > 0.9) { g.strokeStyle = 'rgba(63,224,232,.9)'; g.lineWidth = 4; for (let i = -240; i <= 240; i += 60) { g.beginPath(); g.moveTo(i, -250); g.lineTo(i, 250); g.moveTo(-250, i); g.lineTo(250, i); g.stroke(); } } });
      if (mg < 0.97) layer(yMid, 'rgba(63,224,232,.18)', '#3fe0e8', mg < 0.3 ? 'touch' : '', (g) => { g.strokeStyle = '#3fe0e8'; g.lineWidth = 4; for (let i = -240; i <= 240; i += 60) { g.beginPath(); g.moveTo(i, -250); g.lineTo(i, 250); g.moveTo(-250, i); g.lineTo(250, i); g.stroke(); } });
      layer(yTop, 'rgba(220,240,255,.18)', '#f2f6fa', 'glass');
      const fl = bump(t, C.merge + 0.6, 0.4); if (fl > 0) { g.fillStyle = `rgba(63,224,232,${0.35 * fl})`; g.fillRect(-400, -400, 1880, 2700); }
    });
    add('Today: OLED pixels', 7, C.oled - 0.2, (g, t) => {
      camera(g, t, [[C.oled - 0.2, 540, 900, 1.35, -0.03], [C.S(30), 540, 900, 1.0, 0.03]]);
      P.insertBg(g, t, '#14233a', '#0b1220');
      const smile = (i, j) => { const x = i - 5.5, y = j - 5.5; const r = Math.hypot(x, y); return (Math.abs(r - 4.6) < 0.7) || (Math.hypot(x + 1.8, y + 1.6) < 0.9) || (Math.hypot(x - 1.8, y + 1.6) < 0.9) || (y > 0.8 && Math.abs(r - 2.6) < 0.6); };
      const on = seg(t, C.ownLight - 0.3, C.ownLight + 1.0);
      for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const x = 110 + i * 72, y = 470 + j * 72, lit = smile(i, j) && (hs(i * 13 + j) < on * 1.3);
        const c = lit ? ['#ff5a4a', '#7dff9a', '#5fd0ff'] : ['#3a1a1a', '#173a20', '#16304a'];
        for (let s = 0; s < 3; s++) { g.fillStyle = c[s]; if (lit) { g.save(); g.shadowColor = c[s]; g.shadowBlur = 18; } g.fillRect(x + s * 22, y, 16, 56); if (lit) g.restore(); } }
      P.note(g, t, 'no backlight!', 540, 1460, 540, 1340, seg(t, C.ownLight + 0.3, C.ownLight + 0.6), '#3fe0e8');
    });
    add('Today: it can fold', 7, C.S(30), (g, t) => {
      camera(g, t, [[C.S(30), 540, 1000, 1.08, 0.02], [C.snap - 0.05, 520, 960, 1.22, -0.02], [C.snap + 0.1, 540, 1000, 1.02, 0.02], [C.final, 540, 980, 1.12, -0.02]]);
      P.room(g, t, PAL.now); P.bench(g, t, 300, 1060, 1110, PAL.now.wood); P.lamp(g, t, 760, -260, 'rgba(120,230,255,'); P.dustMotes(g, t, 20, 'rgba(63,224,232,.35)');
      const p = davePose([[C.S(30), 'idea', { handL: [-130, 250], handR: [130, 250] }], [C.wrongWay, 'angry', { handL: [-150, 240], handR: [150, 240], lean: 0.1 }],
        [C.snap, 'panic', { handL: [-210, 420], handR: [210, 420] }], [C.otherWay + 0.3, 'defeat', { handL: [-120, 220], handR: [120, 220] }, 23]], t);
      const x = 540, y = 1760, s = 1.3; drawDave(g, t, x, y, s, p);
      const hl = handAt(x, y, s, p, 'L'), hr = handAt(x, y, s, p, 'R'), cx = (hl[0] + hr[0]) / 2, cy = (hl[1] + hr[1]) / 2 - 40;
      const fold = Math.sin(Math.PI * seg(t, C.fold - 0.1, C.fold + 0.7)), wrong = seg(t, C.wrongWay, C.snap), broken = t >= C.snap;
      const half = (side, ang, dx, dy, rot) => { g.save(); g.translate(cx + dx, cy + dy); g.rotate(rot); g.scale(side * Math.cos(ang), 1);
        g.fillStyle = '#0e1422'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(0, -170, 130, 340, 18); g.fill(); g.stroke();
        g.fillStyle = 'rgba(63,224,232,.6)'; g.fillRect(14, -150, 102, 300); g.restore(); };
      if (!broken) { half(-1, fold * 1.3 + wrong * 0.4, 0, 0, 0); half(1, fold * 1.3 + wrong * 0.4, 0, 0, 0);
        if (wrong > 0.3) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy - 170); g.lineTo(cx + 10 * Math.sin(t * 60), cy + 170); g.stroke(); } }
      else { const u = seg(t, C.snap, C.snap + 0.8); half(-1, 0.2, -240 * eo(u), -300 * u + 600 * u * u, -2 * u); half(1, 0.2, 240 * eo(u), -260 * u + 600 * u * u, 2.4 * u);
        P.shards(g, t, cx, cy, u * 1.3); }
      const sk = bump(t, C.snap - 0.02, 0.6); if (sk > 0) text(g, 'SNAP!', 540, 520, 170, '#ffb547', { scale: back(sk * 1.5), rot: 0.1 });
      if (t > C.otherWay) { text(g, '↻', 820, 820, 140, '#3fe0e8', { rot: t * 2, alpha: seg(t, C.otherWay, C.otherWay + 0.3) }); }
    });
    add('Finally: it pokes back', 7, C.final, (g, t) => {
      camera(g, t, [[C.final, 540, 980, 1.1, 0.02], [C.pokeBack - 0.1, 520, 860, 1.3, -0.02], [C.pokeBack + 0.2, 540, 940, 1.05, 0.03], [C.DUR, 560, 1000, 0.98, -0.02]]);
      P.room(g, t, PAL.now); P.bench(g, t, 300, 1060, 1110, PAL.now.wood); P.lamp(g, t, 760, -260, 'rgba(120,230,255,'); P.dustMotes(g, t, 20, 'rgba(63,224,232,.35)');
      const p = davePose([[C.final, 'relief', { handR: [110, 420] }], [C.buzz, 'suspicious', { handR: [120, 430], look: [0.6, 0] }], [C.scream, 'panic', { handR: [210, 470], handL: [-200, 460] }]], t);
      const x = 470, y = 1760, s = 1.3; drawDave(g, t, x, y, s, p);
      const hr = handAt(x, y, s, p, 'R'), fl = seg(t, C.scream, C.scream + 1.0);
      const px = hr[0] + 20 + 400 * fl, py = hr[1] - 300 - 900 * fl + 1400 * fl * fl, buzz = t > C.buzz && t < C.scream ? 6 * Math.sin(t * 80) : 0;
      g.save(); g.translate(px + buzz, py); g.rotate(fl * 9); const m = P.phone(g, t, -95, -180, 190, 360, { content: (g, X, Y, w, h) => homeIcons(g, X, Y, w, h, t) }); g.restore();
      P.buzzLines(g, t, px, py, 200, t > C.buzz && t < C.scream ? 1 : 0);
      const po = eo(seg(t, C.pokeBack - 0.2, C.pokeBack)) * (1 - seg(t, C.scream, C.scream + 0.2));
      if (po > 0) P.bigFinger(g, t, [px - 60 - 150 * po, py - 60], Math.PI, { len: 220, w: 54, seed: 99, sleeve: '#1c1e24' });
      const q = seg(t, C.buzz, C.buzz + 0.2); if (q > 0 && t < C.scream + 0.6) text(g, 'BZZT', px + 160, py - 220, 70, '#3fe0e8', { scale: back(q), rot: 0.2 });
      const ah = seg(t, C.scream, C.scream + 0.3); if (ah > 0) text(g, 'AAAH!', 380, 700, 150, '#ffb547', { scale: back(ah), rot: -0.12 });
    });

    shots.sort((a, b) => a.t0 - b.t0);
    return shots;
  }
  g0.Shots = { build, camera, davePose, PAL };
})(window);
