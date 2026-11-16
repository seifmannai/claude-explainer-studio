// shots.js - every shot of "Dave builds a touchscreen". A shot = {name, era, t0, fn(g, t), over?(g, t), film?}.
// fn draws the whole frame (set, Dave, props, camera) as a pure function of t; over() draws on top of the old-film look
// (1965: the science stays in colour). Times come from cues.js (words). Dave's acting follows ../ACTING.md:
// every key pose has a reason, idle life is calm (Dave.CALM), pokes land ON the glass (Stick.reach).
(function (g0) {
  const { INK, cl, sm, eo, back, hs, bump, text } = P;
  const W = 1080, H = 1920;
  const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => cl((t - a) / (b - a));

  // ---------------------------------------------------------------- camera: keys [[t, cx, cy, zoom, rot]], always drifting
  let KICK = [];
  function camera(g, t, keys, hand = 1) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    const a = keys[i], b = keys[i + 1] || a, u = b === a ? 0 : eio((t - a[0]) / (b[0] - a[0]));
    const cx = lerp(a[1], b[1], u), cy = lerp(a[2], b[2], u), z = lerp(a[3], b[3], u), r = lerp(a[4] || 0, b[4] || 0, u);
    let hx = hand * (9 * Math.sin(t * 0.9) + 5 * Math.sin(t * 2.3 + 1)), hy = hand * (7 * Math.sin(t * 0.7 + 2) + 4 * Math.sin(t * 1.9));
    let hr = hand * 0.006 * Math.sin(t * 0.5 + 1);
    for (const [kt, amp] of KICK) { const d = t - kt; if (d >= 0 && d < 0.6) { const e = Math.exp(-d * 9) * amp; hx += e * 40 * Math.sin(d * 70); hy += e * 30 * Math.cos(d * 55); hr += e * 0.03 * Math.sin(d * 60); } }
    g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2 + hx, H / 2 + hy); g.rotate(r + hr); g.scale(z, z); g.translate(-cx, -cy);
  }

  // ---------------------------------------------------------------- Dave: acting from keys (ACTING.md)
  // keys: [t, poseName, over, frames]. over may hold: at:[px,py] (right hand ON that screen point), atL, lookAt:[px,py]
  // (eyes + a little head turn toward that point), plus any pose field. frames = length of the move (Dave snaps: ~9).
  const headOf = (X, Y, s, p) => [X + (p.hip[0] - p.lean * 150 - p.tilt * 40) * s, Y - (200 + p.hip[1] + 150 + 100 + p.bob) * s];
  function resolve(k, X, Y, s, base) {
    const over = Object.assign({}, k[2] || {}), at = over.at, atL = over.atL, lookAt = over.lookAt;
    delete over.at; delete over.atL; delete over.lookAt;
    const p = base ? Stick.pose(k[1], Object.assign({}, base, over)) : Dave.pose(k[1], over);
    if (at) p.handR = Stick.reach(X, Y, s, p, at[0], at[1], 'R').hand;
    if (atL) p.handL = Stick.reach(X, Y, s, p, atL[0], atL[1], 'L').hand;
    if (lookAt) { const h = headOf(X, Y, s, p), dx = lookAt[0] - h[0], dy = lookAt[1] - h[1];
      p.look = [cl(dx / 260, -1, 1) * 0.95, cl(dy / 260, -1, 1) * 0.8]; p.turn = cl(dx / 700, -0.45, 0.45); }
    return p;
  }
  function acting(keys, t, X, Y, s, base, calm = null) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    let p = resolve(keys[i], X, Y, s, base);
    if (i > 0 && t >= keys[i][0]) p = Stick.act(resolve(keys[i - 1], X, Y, s, base), p, t - keys[i][0], keys[i][3] || 9);
    return Stick.alive(p, t, (base && base.seed) || 3, calm || Dave.CALM);
  }
  g0.__HEADS = [];
  function drawChar(g, t, x, y, s, p, w) {
    if (w && w.k > 0) p = Stick.walk(p, w.ph, w.dir, w.k);
    Stick.draw(g, x, y, s, p, t);
    const h = headOf(x, y, s, p), m = g.getTransform(), sy = m.b * h[0] + m.d * h[1] + m.f, r = 92 * s * Math.hypot(m.c, m.d);
    g0.__HEADS.push([sy - r, sy + r]); return p;
  }
  const handAt = (x, y, s, p, side = 'R') => { const h = side === 'R' ? p.handR : p.handL; return [x + h[0] * s, y - h[1] * s]; };
  function walker(t, path) {
    let i = 0; while (i + 1 < path.length && path[i + 1][0] <= t) i++;
    const a = path[i], b = path[i + 1];
    if (!b || t < a[0]) return { x: a[1], ph: 0, k: 0, dir: 0 };
    const dur = Math.max(0.35, Math.abs(b[1] - a[1]) / 520), u = (t - b[0] + dur) / dur;
    if (u <= 0) return { x: a[1], ph: 0, k: 0, dir: 0 };
    if (u >= 1) return { x: b[1], ph: 0, k: 0, dir: 0 };
    const e = sm(u), dir = Math.sign(b[1] - a[1]);
    return { x: lerp(a[1], b[1], e), ph: u * dur * 2.6, k: Math.min(1, Math.sin(Math.PI * u) * 2), dir };
  }

  // ---------------------------------------------------------------- palettes + sets
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
  const DX = 290, DY = 1520, DS = 1.25;      // Dave on his step stool in front of the bench screen
  const MON = [380, 560, 600, 440];          // glass: x 402..958, y 582..978
  const P1 = [470, 935];                     // a poke point on the glass Dave can reach from the stool
  function workshopSet(g, t, pal, monOpts, lampCol) {
    P.room(g, t, pal); P.bench(g, t, 300, 1060, 1110, pal.wood);
    const m = P.monitor(g, t, MON[0], MON[1], MON[2], MON[3], monOpts);
    P.lamp(g, t, 600, -260, lampCol); P.stool(g, t, DX, DY); P.dustMotes(g, t);
    return m;
  }
  // phones held in a hand (Stick hold props): drawn in hand space, y down, the hand at the bottom edge
  const homeIcons = (g, x, y, w, h, t) => { const c = ['#ff6a5a', '#ffd35a', '#7dff9a', '#5fd0ff', '#c58aff', '#ff9a3c'];
    g.fillStyle = '#18233a'; g.fillRect(x, y, w, h); const cols = 4, cw = (w - 20) / cols, sz = Math.min(cw * 0.66, 90);
    for (let i = 0; i < 16; i++) { const cx = x + 10 + cw * (i % cols + 0.5), cy = y + 20 + cw * (Math.floor(i / cols) + 0.5); if (cy + sz / 2 > y + h) break;
      g.fillStyle = c[i % 6]; g.beginPath(); g.roundRect(cx - sz / 2, cy - sz / 2, sz, sz, sz * 0.24); g.fill(); } };
  const heldPhone = (t, o = {}) => (c) => {
    const w = o.w || 80, h = o.h || 140, sh = o.shake || 0; c.save(); c.translate(sh * Math.sin(t * 90), -h * 0.56);   // small, held at the chest: the face stays free
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 16); c.fillStyle = '#1c1e24'; c.fill(); c.lineWidth = 6; c.stroke();
    c.save(); c.beginPath(); c.roundRect(-w / 2 + 8, -h / 2 + 16, w - 16, h - 32, 8); c.clip(); homeIcons(c, -w / 2 + 8, -h / 2 + 16, w - 16, h - 32, t); if (o.content) o.content(c, -w / 2 + 8, -h / 2 + 16, w - 16, h - 32); c.restore();
    c.restore(); };

  function build(C) {
    KICK = [[C.hit, 1], [C.snap, 1], [C.theft, 0.5], [C.fired, 0.6], [C.del, 0.4], [C.scream, 0.6]];
    const S = C.S, shots = [];
    const add = (name, era, t0, fn, extra) => shots.push(Object.assign({ name, era, t0, fn }, extra || {}));

    // ============================================================ ERA 0: Dave's workshop (now)
    add('Meet Dave', 0, 0, (g, t) => {
      camera(g, t, [[0, 520, 1040, 1.12, -0.012], [C.poke0, 560, 1000, 1.2, 0.01]]);
      const dent = bump(t, C.poke0, 0.25);
      workshopSet(g, t, PAL.shop, { kind: 'flat', dent, content: (g, x, y, w, h) => { g.fillStyle = '#26323f'; g.fillRect(x, y, w, h); } });
      const p = acting([[0, 'proud', { lookAt: [560, 760] }], [C.nod - 0.05, 'proud', { tilt: 0.2, lookAt: [560, 800] }, 6], [C.nod + 0.18, 'proud', { lookAt: [560, 760] }, 7],
        [C.poke0 - 0.4, 'eager', { lookAt: P1 }, 7], [C.poke0, 'poke', { at: P1, lookAt: P1 }, 6]], t, DX, DY, DS);
      drawChar(g, t, DX, DY, DS, p);
    });
    add('Feels his finger', 0, S(1), (g, t) => {
      camera(g, t, [[S(1), 540, 900, 1.05, 0.02], [C.dream, 540, 880, 1.2, -0.02]]);
      P.insertBg(g, t, '#3a4d63', '#121a26');
      const k = Stick.sketchCtx(g, t, 7); k.strokeStyle = INK; k.lineWidth = 14;
      k.beginPath(); k.roundRect(90, 300, 900, 1200, 40); k.fillStyle = '#20232b'; k.fill(); k.stroke();
      g.fillStyle = '#26323f'; g.fillRect(130, 340, 820, 1120);
      const taps = [[C.poke0b, 0.3], [C.fingerTap, 0.3], [C.fingerTap2 + 0.05, 0.5]];   // the last tap is slower: he's losing patience
      let press = 0; for (const [tp, d] of taps) press = Math.max(press, bump(t, tp - d * 0.3, d));
      const rest = [700, 1260], hit = [560, 860], pr = eio(press);
      const tip = [lerp(rest[0], hit[0], pr), lerp(rest[1], hit[1], pr) + 30 * Math.sin(t * 3)];
      for (const [tp] of taps) { const u = seg(t, tp, tp + 0.6); if (u > 0 && u < 1) { g.strokeStyle = `rgba(160,190,220,${0.6 * (1 - u)})`; g.lineWidth = 6; g.beginPath(); g.arc(hit[0], hit[1], 30 + 120 * u, 0, 7); g.stroke(); } }
      P.bigFinger(g, t, tip, -2.1, { press: press > 0.85 ? (press - 0.85) * 6 : 0 });
      const q = seg(t, C.fingerTap2 + 0.4, C.fingerTap2 + 0.7); text(g, '?', 560, 600 - 20 * Math.sin(t * 4), 220, '#9fb3c8', { alpha: q, scale: back(q) });
    });
    add('Pokes back', 0, C.dream, (g, t) => {
      camera(g, t, [[C.dream, 470, 860, 1.12, 0], [C.rw0, 430, 780, 1.25, 0.03]]);
      workshopSet(g, t, PAL.shop, { kind: 'flat', content: (g, x, y, w, h) => { g.fillStyle = '#26323f'; g.fillRect(x, y, w, h); } });
      const p = acting([[C.dream - 0.1, 'think', {}], [C.dreamPoke + 0.12, 'joy', {}, 7]], t, DX, DY, DS);
      drawChar(g, t, DX, DY, DS, p);
      const u = seg(t, C.dream - 0.05, C.dream + 0.3);
      if (u > 0) { g.save(); g.translate(330, 640); g.scale(back(u), back(u)); g.translate(-330, -640);
        P.bubble(g, t, 90, 120, 640, 560, [300, 840], (g) => {
          g.fillStyle = '#eaf4ff'; g.fillRect(90, 120, 640, 560);
          const k = Stick.sketchCtx(g, t, 9); k.strokeStyle = INK; k.lineWidth = 6;
          k.beginPath(); k.roundRect(470, 250, 170, 300, 14); k.fillStyle = '#20232b'; k.fill(); k.stroke();         // the little screen
          const po = eo(seg(t, C.dreamPoke - 0.22, C.dreamPoke)) * (1 - seg(t, C.dreamPoke + 0.45, C.dreamPoke + 0.75));
          const mp = Stick.alive(Dave.pose(po > 0.6 ? 'shock' : 'eager', { look: [0.9, 0] }), t, 5, Dave.CALM);   // mini Dave, booped
          Stick.draw(g, 300 - 18 * po, 640, 0.4, mp, t);
          const tipX = lerp(470, 345, po), tipY = 398;                                                               // a finger comes OUT of the screen
          if (po > 0.02) { k.beginPath(); k.roundRect(tipX, tipY - 12, 470 - tipX + 10, 24, 12); k.fillStyle = '#f3dcc0'; k.fill(); k.lineWidth = 5; k.stroke(); }
          const sq = bump(t, C.dreamPoke - 0.05, 0.35); if (sq > 0.1) text(g, 'BOOP!', 400, 210, 64, '#e8762d', { scale: back(sq) });
        }); g.restore(); }
    });

    // ============================================================ ERA 1: 1965 radar room (old film; the science stays in colour)
    const RX = 370, RY = 1520;
    const RMON = [MON[0], MON[1] + 20, MON[2], MON[3] + 40];
    const SC = [680, 800], TP = [560, 940];      // scope centre, the touch point Dave can reach
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
      const fl = 0.85 + 0.15 * (hs(Math.floor(t * 12)) > 0.9 ? 0 : 1);
      g.fillStyle = `rgba(255,255,240,${0.9 * fl})`; g.fillRect(260, -60, 560, 26);
      const m = P.monitor(g, t, RMON[0], RMON[1], RMON[2], RMON[3], { kind: 'radar', content: radarScope(t) });
      P.stool(g, t, RX, RY); P.dustMotes(g, t, 30, 'rgba(255,255,255,.35)'); return m;
    };
    add('1965: screens feel nothing', 1, C.rw0, (g, t) => {
      camera(g, t, [[C.rw0, 560, 1020, 1.16, 0.03], [C.engIn, 600, 990, 1.06, -0.01]]);
      radarSet(g, t);
      const a = C.rw1 + 0.05, b = C.poke65b;
      const p = acting([[C.rw0, 'eager', { lookAt: SC }], [a, 'poke', { at: TP, lookAt: TP }, 6], [a + 0.35, 'poke', { at: [TP[0] - 30, TP[1] + 30], lookAt: SC }, 8],
        [b, 'pokeHard', { at: TP, lookAt: TP }, 5], [b + 0.45, 'sideEye', {}, 12]], t, RX, RY, DS);
      drawChar(g, t, RX, RY, DS, p);
      const q = seg(t, b + 0.5, b + 0.75); if (q > 0) P.bubble(g, t, 120, 380, 260, 170, [300, 690], (g) => text(g, '...', 250, 460, 110, INK, { stroke: 0, scale: back(q) }));
    });
    const ENG = { shirt: '#f4f1e8', coat: '#ecebe4', tieOn: 1, tieCol: '#2f4f7a', hairCol: '#a8a8a8', skin: '#f6e3cf', pants: '#4a4036', seed: 21, glasses: 1, moustache: 1, stubble: 0 };
    add('1965: the radar engineer', 1, C.engIn, (g, t) => {
      camera(g, t, [[C.engIn, 660, 1000, 1.0, 0], [C.copies + 0.3, 640, 980, 1.06, 0.015], [C.field, 620, 960, 1.12, -0.01]]);
      radarSet(g, t);
      const ex = walker(t, [[C.engIn - 0.6, 1360], [C.copies - 0.05, 870]]), ey = 1760, es = 1.32;
      const eHead = [ex.x, ey - 450 * es];
      const p = acting([[C.engIn, 'sideEye', { lookAt: [1000, 1100] }], [C.engIn + 0.35, 'puzzled', { lookAt: eHead }, 10],
        [C.copies + 0.15, 'eureka', { lookAt: eHead }, 7], [C.engPoint + 0.2, 'eureka', { lookAt: SC, handR: [70, 560] }, 10]], t, RX, RY, DS);
      drawChar(g, t, RX, RY, DS, p);
      // the engineer: walks in already moving, raises one finger ("here's how"), points at the scope, sips his tea
      const ep = acting([[C.engIn, 'deadpan', { handL: [-60, 260], handR: [70, 250], holdR: 'teacup' }],
        [C.copies - 0.1, 'smug', { handL: [-60, 520], pointL: 1, handR: [70, 260], holdR: 'teacup', lookAt: [RX, 900] }, 8],
        [C.engStop, 'idea', { handL: [-230, 430], pointL: 1, handR: [70, 260], holdR: 'teacup', lookAt: SC }, 9],
        [C.engPoint + 0.25, 'smug', { handL: [-60, 230], handR: [44, 420], holdR: 'teacup', lid: [0.3, 0.3], look: [0, 0] }, 12]], t, ex.x, ey, es, ENG, { eyes: 0.1, fidget: 0.3, shift: 0.4, sway: 0.5 });
      drawChar(g, t, ex.x, ey, es, ep, ex);
      const q = seg(t, C.engPoint - 0.1, C.engPoint + 0.3); if (q > 0) text(g, 'E. A. JOHNSON · UK, 1965', ex.x - 60, ey - 840, 44, '#fff', { alpha: q, scale: back(q) });
    });
    // inserts: the panel in old film, the electricity on top in colour (over)
    const panel = (g, t, seed = 33) => {
      const k = Stick.sketchCtx(g, t, seed); k.strokeStyle = INK; k.lineWidth = 12;
      k.beginPath(); k.roundRect(140, 380, 800, 900, 30); k.fillStyle = '#1b2a24'; k.fill(); k.stroke();
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) { k.beginPath(); k.roundRect(x - 34, y - 34, 68, 68, 12); k.fillStyle = '#b8bcc4'; k.fill(); k.lineWidth = 8; k.stroke(); }
    };
    const glow = (g, x, y, r, col, a = 1) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col.replace('A', a)); rg.addColorStop(1, col.replace('A', 0)); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
    const CAMF = [[C.field, 540, 860, 1.0, -0.03], [C.xray, 540, 820, 1.12, 0.03]];
    add('1965: a layer of electricity', 1, C.field, (g, t) => {
      camera(g, t, CAMF); P.insertBg(g, t, '#2c3a33', '#0e1611'); panel(g, t);
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) { const k = Stick.sketchCtx(g, t, 35); k.strokeStyle = INK; k.beginPath(); k.moveTo(x, y); k.quadraticCurveTo(x + (x < 540 ? -120 : 120), y + 200, x + (x < 540 ? -60 : 60), y + 520); k.lineWidth = 9; k.stroke(); }
    }, { film: 0.45, over: (g, t) => {
      camera(g, t, CAMF); const kf = eo(seg(t, C.field + 0.15, C.fieldFull + 0.3));
      P.field(g, t, 150, 390, 780, 880, kf);
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) glow(g, x, y, 90, 'rgba(95,208,255,A)', 0.5 * kf);
      if (kf > 0.95) P.note(g, t, 'electricity!', 540, 1150 - 10 * Math.sin(t * 5), 540, 1000, seg(t, C.fieldFull, C.fieldFull + 0.4), '#5fd0ff');
    } });
    const CAMX = [[C.xray, 520, 940, 1.0, 0.02], [C.touch65, 600, 900, 1.15, -0.02]];
    add('1965: a bag of salty water', 1, C.xray, (g, t) => {
      camera(g, t, CAMX); P.insertBg(g, t, '#203a4a', '#08131c');
      P.bigFinger(g, t, [330, 640 + 20 * Math.sin(t * 2)], -2.35, { skin: '#d8ecfa', sleeve: '#7aa6c2', len: 620, w: 170 });   // an X-ray finger: opaque, pale
    }, { film: 0.45, over: (g, t) => {
      camera(g, t, CAMX);
      const tip = [330, 640 + 20 * Math.sin(t * 2)], ang = -2.35;
      g.save(); g.translate(tip[0], tip[1]); g.rotate(ang + Math.PI); g.beginPath(); g.roundRect(4, -60, 440, 120, 60); g.clip();
      const lvl = -30 + 10 * Math.sin(t * 3);
      g.fillStyle = 'rgba(70,170,255,.8)'; g.beginPath(); g.moveTo(-20, 100);
      for (let x = -20; x <= 460; x += 20) g.lineTo(x, lvl + 14 * Math.sin(x * 0.03 + t * 5)); g.lineTo(460, 100); g.closePath(); g.fill();
      const ks = seg(t, C.salt - 0.2, C.salt + 0.4);
      for (let i = 0; i < 9; i++) { if (hs(i) > ks) continue; const x = 50 + hs(i + 3) * 340, y = 5 + 40 * hs(i + 9) + 8 * Math.sin(t * 4 + i);
        g.save(); g.translate(x, y); g.rotate(t * (hs(i) - 0.5) * 3); g.fillStyle = '#fff'; g.strokeStyle = INK; g.lineWidth = 4; g.fillRect(-15, -15, 30, 30); g.strokeRect(-15, -15, 30, 30); g.restore(); }
      for (let i = 0; i < 6; i++) { const y = ((t * 60 + i * 30) % 90) - 20; g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(60 + i * 60, 50 - y, 7, 0, 7); g.fill(); }
      g.restore();
      P.note(g, t, 'salty water!', 640, 1150, 470, 860, seg(t, C.salt, C.salt + 0.3), '#7fd6ff');
    } });
    const T65 = [560, 860], CAMS = [[C.touch65, 540, 860, 1.1, 0.02], [S(9), 560, 860, 1.0, -0.02]];
    add('1965: it steals charge', 1, C.touch65, (g, t) => {
      camera(g, t, CAMS); P.insertBg(g, t, '#2c3a33', '#0e1611'); panel(g, t);
      const pr = eo(seg(t, C.touch65, C.touch65 + 0.35));
      P.bigFinger(g, t, [lerp(760, T65[0], pr), lerp(1500, T65[1], pr)], -2.0, { press: pr > 0.9 ? 0.6 : 0 });
    }, { film: 0.45, over: (g, t) => {
      camera(g, t, CAMS); P.field(g, t, 150, 390, 780, 880, 1);
      const ks = seg(t, C.steal, C.charge + 0.3);
      for (const c of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) { P.chargeFlow(g, t, c, T65, 6, ks); glow(g, c[0], c[1], 90, 'rgba(95,208,255,A)', 0.5); }
      for (const [x, y] of [[140, 380], [940, 380], [140, 1280], [940, 1280]]) { const d = eo(seg(t, C.steal + 0.2, C.charge + 0.4)) * 0.9 + 0.05 * Math.sin(t * 9);
        g.save(); g.translate(x, y + (y < 800 ? -110 : 110)); g.fillStyle = '#f4ecd8'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 60, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
        g.rotate(-Math.PI / 2 + 1.2 - d * 2.2); g.strokeStyle = '#c8452f'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -50); g.stroke(); g.restore(); }
      if (ks > 0.2) glow(g, T65[0], T65[1], 130, 'rgba(95,208,255,A)', 0.7);
      P.note(g, t, 'charge', 300, 1180, 520, 900, seg(t, C.charge, C.charge + 0.3), '#5fd0ff');
    } });
    // back in the room: Dave's finger is on the scope when the screen catches it
    const CAMN = [[S(9), 600, 980, 1.02, 0.01], [C.theft, 600, 960, 1.1, -0.02], [C.but, 560, 960, 1.14, 0.02]];
    add('1965: the screen notices', 1, S(9), (g, t) => {
      camera(g, t, CAMN); radarSet(g, t);
      const p = acting([[S(9), 'poke', { at: TP, lookAt: TP }], [C.notice + 0.2, 'poke', { at: TP, lookAt: [380, 560], lid: [1.05, 1.05] }, 8],
        [C.theft - 0.05, 'caught', { lookAt: TP }, 5], [C.yourTouch - 0.1, 'eager', { lookAt: TP, mouth: 'o', open: 0.6 }, 12]], t, RX, RY, DS);
      drawChar(g, t, RX, RY, DS, p);
    }, { over: (g, t) => {
      camera(g, t, CAMN);
      const flash = Math.sin(t * 22) > 0 && t > C.notice + 0.1 && t < C.yourTouch;
      const cs = [[RMON[0] - 10, RMON[1] - 20], [RMON[0] + RMON[2] + 10, RMON[1] - 20], [RMON[0] - 10, RMON[1] + RMON[3] + 20], [RMON[0] + RMON[2] + 10, RMON[1] + RMON[3] + 20]];
      for (const [x, y] of cs) { g.fillStyle = flash ? '#ff4a3a' : '#9a2a24'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill(); if (flash) glow(g, x, y, 90, 'rgba(255,70,50,A)', 0.6); }
      const lk = eo(seg(t, C.notice + 0.15, C.theft)) * (1 - seg(t, C.yourTouch - 0.2, C.yourTouch));
      if (lk > 0) { g.strokeStyle = 'rgba(255,90,70,.9)'; g.lineWidth = 5; g.setLineDash([22, 14]); g.lineDashOffset = -t * 120;
        for (const [x, y] of cs) { g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, TP[0], lk), lerp(y, TP[1], lk)); g.stroke(); } g.setLineDash([]); }
      const tu = seg(t, C.theft - 0.05, C.theft + 0.25) * (1 - seg(t, C.yourTouch - 0.25, C.yourTouch)); if (tu > 0) P.stamp(g, 'THIEF!', 700, 470, tu, '#ff3b30', -0.15);
      const ok = seg(t, C.yourTouch - 0.1, C.yourTouch + 0.5);
      if (ok > 0) { for (let i = 0; i < 3; i++) { const u = ((t - C.yourTouch) * 0.9 + i / 3) % 1; g.strokeStyle = `rgba(120,255,160,${(1 - u) * ok})`; g.lineWidth = 8; g.beginPath(); g.arc(TP[0], TP[1], 30 + 160 * u, 0, 7); g.stroke(); }
        text(g, 'TOUCH!', 760, 470, 100, '#8dffb0', { scale: back(ok) }); }
    } });
    const CAMR = [[C.but, 560, 960, 1.14, 0.02], [C.scary, 470, 880, 1.28, -0.02], [C.ff1a + 0.6, 700, 1000, 1.0, -0.03]];
    add('1965: electricity is scary', 1, C.but, (g, t) => {
      camera(g, t, CAMR); radarSet(g, t);
      const wk = walker(t, [[C.runOff, RX], [C.runOff + 0.75, 1400]]);
      const jump = seg(t, C.runOff - 0.1, C.runOff + 0.25), y = t < C.runOff + 0.25 ? lerp(RY, 1760, eio(jump)) - 160 * Math.sin(Math.PI * jump) : 1760;
      const look = [RX + 140, RY - 600];
      const p = acting([[C.but, 'eager', { lookAt: SC }], [C.fingerLook, 'think', { handR: [120, 470], pointR: 1, lookAt: look, mouth: 'o', open: 0.3 }, 10],
        [C.scary - 0.12, 'scared', { lookAt: look }, 5]], t, RX, RY, DS);
      if (wk.k > 0) wk.ph *= 1.8;
      drawChar(g, t, wk.x, y, DS, p, wk); P.puff(g, t, RX, RY, seg(t, C.runOff, C.runOff + 0.8));
    }, { over: (g, t) => {
      camera(g, t, CAMR);
      const sp = seg(t, C.fingerLook + 0.2, C.fingerLook + 0.6) * (t < C.scary - 0.1 ? 1 : 0); if (sp <= 0) return;
      const f = [RX + 150 * DS, RY - 480 * DS];   // the raised fingertip
      glow(g, f[0], f[1], 70, 'rgba(95,208,255,A)', 0.9 * sp);
      for (let i = 0; i < 5; i++) { const a = hs(i + Math.floor(t * 18) * 5) * 6.28, L = 30 + 30 * hs(i * 7 + Math.floor(t * 18));
        g.strokeStyle = '#bff0ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(f[0], f[1]); g.lineTo(f[0] + Math.cos(a) * L * 0.5 + 8, f[1] + Math.sin(a) * L * 0.5); g.lineTo(f[0] + Math.cos(a) * L, f[1] + Math.sin(a) * L); g.stroke(); }
    } });

    // ============================================================ ERA 2: 1977 resistive
    const SX0 = 140, SX1 = 940, TOPY = 760, BOTY = 900;
    const sheets = (g, t, dip, dipX, lit) => {
      const k = Stick.sketchCtx(g, t, 41); k.strokeStyle = INK; k.lineWidth = 9;
      k.beginPath(); k.roundRect(SX0, BOTY, SX1 - SX0, 60, 10); k.fillStyle = '#9fb0bf'; k.fill(); k.stroke();
      g.fillStyle = lit ? '#ffd35a' : '#c6a24a'; g.fillRect(SX0 + 6, BOTY - 6, SX1 - SX0 - 12, 10);
      for (let x = SX0 + 60; x < SX1; x += 110) { if (Math.abs(x - dipX) < 70 && dip > 0.2) continue; g.fillStyle = '#e9e1d2'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(x, BOTY - 22, 14, 0, 7); g.fill(); g.stroke(); }
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
      camera(g, t, [[C.press, 540, 860, 1.0, 0.02], [C.contact, 520, 900, 1.12, -0.02], [S(13), 600, 900, 1.05, 0.01]]);
      P.insertBg(g, t, '#8a5530', '#2a160a');
      const d = eo(seg(t, C.press - 0.1, C.contact)), lit = t > C.contact;
      const yAt = sheets(g, t, d, 520, lit);
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
    // the hammer: pulled from the tool belt, wound up (weight back), the head hits the glass MID-swing, then it slips
    const HH = [450, 940], HA = -0.24, HEAD = [HH[0] + DS * 210 * Math.cos(HA), HH[1] + DS * 210 * Math.sin(HA)];
    add('1977: the hammer', 2, S(13), (g, t) => {
      camera(g, t, [[S(13), 600, 1000, 1.04, 0.02], [C.hit - 0.05, 560, 980, 1.14, -0.02], [C.hit + 0.1, 560, 990, 1.02, 0.01], [C.wp1a, 470, 960, 1.16, -0.02]]);
      const cr = seg(t, C.hit, C.hit + 0.25), dent = bump(t, C.hit, 0.3);
      P.room(g, t, PAL.s70); P.bench(g, t, 300, 1060, 1110, PAL.s70.wood);
      P.monitor(g, t, MON[0], MON[1], MON[2], MON[3], { kind: 'terminal', dent, shake: dent * 8, glass: '#1d2a1d', content: (g, x, y, w, h) => {
        g.fillStyle = '#7dff9a'; g.font = '700 44px monospace'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('> PRESS HERE_', x + 30, y + 40); if (cr > 0) P.cracks(g, t, HEAD[0], HEAD[1], 330 * eo(cr)); } });
      P.lamp(g, t, 600, -260); P.stool(g, t, DX, DY);
      const drop = C.hit + 0.42, s13 = S(13);
      const p = acting([[s13, 'proud', { lookAt: [600, 760], tilt: 0.12 }], [s13 + 0.25, 'proud', { lookAt: [600, 760], tilt: -0.05 }, 6],   // smug nod: "I know how to press"
        [C.wind - 0.1, 'swear', { handR: [70, 190], lookAt: [380, 1350], lean: 0.02 }, 7],                                             // hand to the tool belt
        [C.wind + 0.15, 'swear', { handR: [100, 250], holdR: 'hammer', holdAngR: 1.3, lookAt: HEAD }, 6],                                // pulls the hammer out
        [C.wind + 0.45, 'hammerUp', { holdR: 'hammer', holdAngR: -2.3, lookAt: HEAD }, 9],                                               // wind-up, weight back
        [C.hit - 0.17, 'pokeHard', { at: HH, holdR: 'hammer', holdAngR: HA, lookAt: HEAD, pointR: 0 }, 4],                              // STRIKE (contact mid-swing)
        [C.hit + 0.12, 'shock', { at: [HH[0] - 20, HH[1] + 30], holdR: 'hammer', holdAngR: HA + 0.25, lookAt: HEAD }, 8],                 // frozen follow-through
        [drop, 'shock', { at: [HH[0] - 30, HH[1] + 40], lookAt: [HH[0], 1700] }, 6],                                                     // it slips
        [C.notHard + 0.2, 'sheepish', { lookAt: [HH[0], 1700] }, 12], [C.sideEye, 'sideEye', {}, 14]], t, DX, DY, DS);
      drawChar(g, t, DX, DY, DS, p);
      if (t > drop) {   // the hammer falls to the floor with a bounce (no vanishing)
        const u = t - drop, fy = 1745, y0 = HH[1], gr = 3600, tHit = Math.sqrt(2 * (fy - y0) / gr);
        let y, ang, x = HH[0] + 60 + 120 * Math.min(u, tHit);
        if (u < tHit) { y = y0 + 0.5 * gr * u * u; ang = HA + 3.2 * u; } else { const b = u - tHit, bh = 90 * Math.max(0, Math.sin(Math.min(b / 0.3, 1) * Math.PI)); y = fy - bh; ang = HA + 3.2 * tHit + (b < 0.3 ? b * 4 : 1.2); x += 30 * Math.min(b, 0.3); }
        g.save(); g.translate(x, y); g.rotate(ang); g.scale(DS, DS); g.strokeStyle = INK; Stick.PROPS.hammer(g); g.restore();
        if (u > tHit) P.puff(g, t, x + 150, fy, seg(u - tHit, 0, 0.6), 0.6);
      }
      P.shards(g, t, HEAD[0], HEAD[1], seg(t, C.hit, C.hit + 1.1) * 1.4); P.puff(g, t, HEAD[0], HEAD[1], seg(t, C.hit, C.hit + 0.9), 1.2);
      const hd = [DX - 10, DY - 670]; if (t > C.hit + 0.5) P.stars(g, t, hd[0], hd[1] - 60, seg(t, C.hit + 0.5, C.hit + 0.8));
      const ck = bump(t, C.hit - 0.02, 0.55); if (ck > 0) text(g, 'CRACK!', 640, 470, 150, '#fff', { scale: back(ck * 1.5), rot: -0.12 });
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
      irScreen(g, t, eo(seg(t, C.wp1b - 0.25, C.beams + 0.5)), eo(seg(t, C.beams - 0.2, C.beams2 + 0.4)), []);   // beams already shooting as we arrive
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
    add('1983: plan C is fired', 3, C.fired - 0.6, (g, t) => {
      camera(g, t, [[C.fired - 0.6, 560, 1000, 1.08, -0.02], [C.wp2a, 600, 980, 1.0, 0.02]]);
      P.room(g, t, PAL.s80); P.bench(g, t, 300, 1060, 1110, PAL.s80.wood);
      P.monitor(g, t, MON[0], MON[1], MON[2], MON[3], { kind: 'terminal', body: '#e8dcc0', content: (g, x, y, w, h) => {
        g.strokeStyle = 'rgba(255,70,50,.6)'; g.lineWidth = 4; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x, y + i * h / 6); g.lineTo(x + w, y + i * h / 6); g.stroke(); g.beginPath(); g.moveTo(x + i * w / 6, y); g.lineTo(x + i * w / 6, y + h); g.stroke(); } } });
      P.lamp(g, t, 600, -260, 'rgba(160,200,255,'); P.stool(g, t, DX, DY);
      // the fly circles Dave's head; his eyes follow it; he swats on "fired" and misses; it leaves
      const away = seg(t, C.fired + 0.1, C.fired + 0.9);
      const fly = [DX + 30 + Math.cos(t * 4.2) * 190 + away * 700, DY - 700 + Math.sin(t * 6.1) * 70 - away * 600];
      const p = acting([[C.fired - 0.6, 'angry', { lookAt: fly }], [C.fired - 0.15, 'swear', { lookAt: fly, handR: [150, 520] }, 6],
        [C.fired, 'pokeHard', { at: [fly[0] - 40, fly[1] + 40], pointR: 0, lookAt: fly }, 3], [C.fired + 0.5, 'sideEye', {}, 12]], t, DX, DY, DS);
      drawChar(g, t, DX, DY, DS, p);
      P.fly(g, t, fly[0], fly[1], 1.1);
      P.stamp(g, 'FIRED', 680, 780, seg(t, C.fired - 0.05, C.fired + 0.25), '#d6332b', 0.15);
    });

    // ============================================================ ERA 4: 1996 stylus
    add('1996: phones get a pen', 4, C.wp2a, (g, t) => {
      camera(g, t, [[C.wp2a, 540, 860, 1.15, 0.02], [C.pen, 560, 840, 1.0, -0.02], [C.lost, 560, 880, 1.1, 0.02]]);
      P.insertBg(g, t, '#4f9a8c', '#173a35');
      P.phone(g, t, 290, 300, 500, 1100, { kind: 'pda', glass: '#9db58a', content: (g, x, y, w, h) => {
        g.fillStyle = '#9db58a'; g.fillRect(x, y, w, h); g.fillStyle = '#2d3a26'; g.font = '700 48px monospace'; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText('MEMO', x + 30, y + 30); const n = Math.floor(cl((t - C.wp2a) / 2) * 5); for (let i = 0; i < n; i++) g.fillRect(x + 30, y + 120 + i * 60, w * (0.4 + 0.4 * hs(i)), 18); } });
      const pu = eo(seg(t, C.pen - 0.2, C.pen + 0.3));
      const taps = [C.tap96, C.tap96 + 0.45, C.tap96 + 0.9];
      if (pu < 0.05) { let pr = 0; for (const tp of taps) pr = Math.max(pr, bump(t, tp - 0.1, 0.32)); P.bigFinger(g, t, [540 + 40 * Math.sin(t), lerp(1120, 700, pr)], -1.75, { press: pr > 0.8 ? 0.5 : 0 }); }
      else { const tp = Math.abs(Math.sin((t - C.pen) * 7)), tip = [lerp(1200, 520, pu) + 60 * Math.sin(t * 2.5), lerp(-200, 640, pu) - 50 * tp];
        g.save(); g.translate(tip[0], tip[1]); g.rotate(-0.6); const k = Stick.sketchCtx(g, t, 61); k.strokeStyle = INK; k.lineWidth = 7;
        k.beginPath(); k.moveTo(0, 0); k.lineTo(26, -60); k.lineTo(26, -560); k.lineTo(-26, -560); k.lineTo(-26, -60); k.closePath(); k.fillStyle = '#e3e6ea'; k.fill(); k.stroke(); g.restore();
        if (tp < 0.2) { g.strokeStyle = 'rgba(45,58,38,.7)'; g.lineWidth = 4; g.beginPath(); g.arc(tip[0], tip[1], 30, 0, 7); g.stroke(); } }
    });
    add('1996: lost in four minutes', 4, C.lost, (g, t) => {
      camera(g, t, [[C.lost, 560, 1060, 1.02, 0.02], [C.four, 600, 1060, 1.06, -0.01], [C.catPen, 700, 1040, 1.12, 0.02], [C.wp3a, 740, 1040, 1.16, -0.01]]);
      P.room(g, t, PAL.s90); P.bench(g, t, 300, 1060, 1110, PAL.s90.wood);
      const tm = eo(seg(t, C.lost, C.four + 0.4)) * 240, mm = Math.floor(tm / 60), ss = Math.floor(tm % 60);
      const k = Stick.sketchCtx(g, t, 71); k.strokeStyle = INK; k.lineWidth = 10; k.beginPath(); k.roundRect(470, 470, 380, 180, 24); k.fillStyle = '#20232b'; k.fill(); k.stroke();
      text(g, `${mm}:${String(ss).padStart(2, '0')}`, 660, 564, 120, mm >= 4 ? '#ff5a4a' : '#ffd35a', { stroke: 0, font: 'monospace', weight: 700 });
      P.lamp(g, t, 700, -260);
      const catPen = t > C.catPen; P.cat(g, t, 900, 1110, { pen: catPen });
      // a real search: pats his pockets, bends to look under the bench, panics at 4:00, then slowly suspects the cat
      const wk = walker(t, [[C.lost - 0.2, 300], [C.lost + 0.55, 560], [C.four + 0.4, 430]]);
      const X = wk.x, Y = 1760, s = 1.25;
      const p = acting([[C.lost - 0.2, 'shock', { handL: [-20, 300], handR: [30, 210], lookAt: [X, 1600] }], [C.lost + 0.2, 'puzzled', { handL: [-30, 300], handR: [60, 200], lookAt: [X - 50, 1550] }, 8],
        [C.lost + 0.6, 'puzzled', { lean: -0.5, hip: [-30, -50], handR: [150, 160], handL: [-40, 240], lookAt: [760, 1300], capBack: 0 }, 9],
        [C.four - 0.05, 'scared', { lookAt: [660, 560] }, 6], [C.catPen - 0.15, 'sideEye', { lookAt: [880, 980] }, 12],
        [C.catPen + 0.3, 'swear', { lookAt: [880, 980] }, 8]], t, X, Y, s);
      drawChar(g, t, X, Y, s, p, wk);
      if (catPen) text(g, '!?', 900, 780, 110, '#ffd35a', { scale: back(seg(t, C.catPen, C.catPen + 0.3)) });
    });

    // ============================================================ ERA 5: 2007 multi-touch
    const PH = [240, 260, 600, 1160], PT = [540, 820];
    add('2007: stealing again', 5, C.wp3a, (g, t) => {
      camera(g, t, [[C.wp3a, 540, 860, 1.15, -0.02], [C.wires, 540, 840, 1.02, 0.02]]);
      P.insertBg(g, t, '#46607a', '#101a26');
      const m = P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => homeIcons(g, x, y, w, h, t) });
      const pr = eo(seg(t, C.steal07 - 0.3, C.steal07));
      P.field(g, t, m.gx, m.gy, m.gw, m.gh, eo(seg(t, C.steal07, C.steal07 + 0.5)));
      for (const c of [[m.gx, m.gy], [m.gx + m.gw, m.gy], [m.gx, m.gy + m.gh], [m.gx + m.gw, m.gy + m.gh]]) P.chargeFlow(g, t, c, PT, 6, seg(t, C.steal07 + 0.2, C.steal07 + 1.2));
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
    const MITTS = '#d23b3b';
    add('2007: winter comes', 5, C.winter, (g, t) => {
      camera(g, t, [[C.winter, 560, 1060, 1.0, -0.02], [C.glove, 520, 1040, 1.1, 0.02]]);
      P.room(g, t, PAL.s07); P.bench(g, t, 300, 1060, 1110, PAL.s07.wood); P.lamp(g, t, 760, -260, 'rgba(200,225,255,');
      const X = 440 + 4 * Math.sin(t * 40), Y = 1760, s = 1.25;          // shivering
      const ph = heldPhone(t);
      const p = acting([[C.winter - 0.1, 'shock', { mitts: MITTS, holdL: ph, handL: [-95, 190], handR: [-20, 300], lookAt: [700, 300] }],
        [C.winter + 0.35, 'defeat', { mitts: MITTS, holdL: ph, handL: [-95, 185], handR: [-30, 290], shoulders: 14, lookAt: [X, 1300], mouth: 'teeth' }, 10],
        [C.winter + 0.9, 'poke', { mitts: MITTS, holdL: ph, handL: [-95, 185], handR: [-60, 230], pointR: 0, lookAt: [X + 30, 1300] }, 8]], t, X, Y, s);
      drawChar(g, t, X, Y, s, p);
      for (let i = 0; i < 3; i++) { const u = ((t * 0.8 + i / 3) % 1), h = headOf(X, Y, s, p); g.fillStyle = `rgba(255,255,255,${0.6 * (1 - u)})`; g.beginPath(); g.arc(h[0] + 70 + 90 * u, h[1] + 40 - 40 * u, 20 + 30 * u, 0, 7); g.fill(); }
      P.snow(g, t, seg(t, C.winter - 0.2, C.winter + 0.6));
      g.save(); g.globalAlpha = 0.22 * seg(t, C.winter, C.winter + 0.8); g.fillStyle = '#bfe3ff'; g.fillRect(-400, -400, 1880, 2700); g.restore();
    });
    add('2007: gloves don’t conduct', 5, C.glove, (g, t) => {
      camera(g, t, [[C.glove, 540, 860, 1.0, 0.02], [C.nothing, 540, 860, 1.14, -0.02]]);
      P.insertBg(g, t, '#6b8aa8', '#1a2a3a'); P.snow(g, t, 1, 50);
      const m = P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => homeIcons(g, x, y, w, h, t) });
      let pr = 0; for (const tp of [C.glove, C.glove + 0.55, C.glove + 1.1, C.nothing + 0.2]) pr = Math.max(pr, bump(t, tp - 0.1, 0.35));
      const gx = lerp(760, PT[0], eio(pr)), gy = lerp(1300, PT[1], eio(pr));
      // the charges stay home in the corners and stare at the glove: nothing to steal
      for (const [cx, cy] of [[m.gx + 70, m.gy + 70], [m.gx + m.gw - 70, m.gy + 70], [m.gx + 70, m.gy + m.gh - 70], [m.gx + m.gw - 70, m.gy + m.gh - 70]]) {
        g.save(); g.shadowColor = '#5fd0ff'; g.shadowBlur = 20; g.fillStyle = '#5fd0ff'; g.beginPath(); g.arc(cx, cy, 52, 0, 7); g.fill(); g.restore();
        const lx = cl((gx - cx) / 300, -1, 1) * 8, ly = cl((gy - cy) / 300, -1, 1) * 8;
        g.fillStyle = '#fff'; for (const d of [-17, 17]) { g.beginPath(); g.arc(cx + d, cy - 6, 14, 0, 7); g.fill(); } g.fillStyle = INK; for (const d of [-17, 17]) { g.beginPath(); g.arc(cx + d + lx, cy - 6 + ly, 7, 0, 7); g.fill(); }
        if (t > C.nothing - 0.1) text(g, '?', cx, cy - 90, 60, '#fff', { scale: back(seg(t, C.nothing - 0.1, C.nothing + 0.2)) }); }
      P.bigFinger(g, t, [gx, gy], -2.0, { glove: true, len: 420, w: 150 });
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
      camera(g, t, [[C.wp4a, 560, 1060, 1.04, 0.02], [C.smear, 480, 1020, 1.14, -0.02], [C.grease1 + 0.6, 520, 1040, 1.1, 0.02]]);
      P.room(g, t, PAL.kit); P.bench(g, t, 300, 1060, 1110, PAL.kit.wood); P.lamp(g, t, 760, -260);
      const X = 400, Y = 1760, s = 1.25, smeared = t > C.smear;
      const ph = heldPhone(t, { content: smeared ? (c, x, y, w, h) => { c.save(); c.scale(0.4, 0.4); smudges(c, x / 0.4, y / 0.4, w / 0.4, h / 0.4, 0, 0, t); c.restore(); } : null });
      // eating fries, the phone rings, he takes the call ON HIS CHEEK (that's the grease), then looks at the screen: eww
      const p = acting([[C.wp4a, 'eager', { holdL: 'fries', holdR: ph, handL: [-70, 260], handR: [80, 185], lookAt: [X - 90, 1350] }],
        [C.fries + 0.3, 'joy', { holdL: 'fries', holdR: ph, handL: [-30, 380], handR: [80, 185], mouth: 'o', open: 0.9, lid: [0.5, 0.5] }, 8],
        [C.smear - 0.25, 'deadpan', { holdL: 'fries', holdR: ph, handL: [-80, 260], handR: [100, 345], look: [-0.3, 0], mouth: 'o', open: 0.4 }, 8],
        [C.smear + 0.45, 'suspicious', { holdL: 'fries', holdR: ph, handL: [-80, 260], handR: [70, 190], lookAt: [X + 90, 1410], mouth: 'frown' }, 10]], t, X, Y, s);
      drawChar(g, t, X, Y, s, p);
      const q = seg(t, C.grease1, C.grease1 + 0.3); if (q > 0) text(g, 'eww', X + 260, 1000, 80, '#2e8a4a', { scale: back(q), rot: 0.15 });
    });
    add('2009: oil-repelling coat', 6, C.grease1 + 0.6, (g, t) => {
      camera(g, t, [[C.grease1 + 0.6, 540, 860, 1.0, -0.02], [C.slide, 540, 900, 1.12, 0.02], [C.wp5a, 540, 960, 1.05, -0.01]]);
      P.insertBg(g, t, '#b8862e', '#3a2408');
      const sw = eo(seg(t, C.coat - 0.2, C.coat + 0.6)), sl = eio(seg(t, C.slide - 0.1, C.slide + 0.9));
      P.phone(g, t, PH[0], PH[1], PH[2], PH[3], { content: (g, x, y, w, h) => {
        homeIcons(g, x, y, w, h, t); smudges(g, x, y, w, h, sw, sl, t);
        if (sw > 0 && sw < 1) { const sy = y + sw * (h + 200) - 100, gr = g.createLinearGradient(0, sy - 80, 0, sy + 80); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, sy - 80, w, 160); }
      } });
      const q = seg(t, C.slide + 0.4, C.slide + 0.7); if (q > 0) text(g, 'squeak!', 540, 1560, 90, '#fff', { scale: back(q), rot: -0.08 });
    });

    // ============================================================ ERA 7: today (channel palette)
    add('Today: sensor built in', 7, C.wp5a, (g, t) => {
      camera(g, t, [[C.wp5a, 540, 900, 1.1, 0.03], [C.merge, 540, 920, 1.0, -0.02], [C.oled, 540, 940, 1.12, 0.02]]);
      P.insertBg(g, t, '#14233a', '#0b1220');
      const mg = eio(seg(t, C.merge - 0.1, C.merge + 0.8)), rot = 0.15 * Math.sin(t * 0.8);
      const layer = (y, fill, stroke, label, extra) => { g.save(); g.translate(540, y); g.transform(1, 0.3 + rot * 0.3, -1.1, 0.55, 0, 0);
        g.fillStyle = fill; g.strokeStyle = stroke; g.lineWidth = 5; g.beginPath(); g.roundRect(-260, -260, 520, 520, 30); g.fill(); g.stroke(); if (extra) extra(g); g.restore();
        if (label) text(g, label, 920, y + 10, 52, stroke, { align: 'right', font: P.HAND, weight: 700 }); };
      const yTop = 520, yMid = lerp(840, 1120, mg), yBot = 1150;
      layer(yBot, '#1a2440', '#ff9a3c', mg > 0.9 ? 'display + touch' : 'display', (g) => { const c = ['#ff5a4a', '#7dff9a', '#5fd0ff']; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { g.fillStyle = c[(i + j) % 3]; g.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i + j); g.fillRect(-240 + i * 80, -240 + j * 80, 60, 60); } g.globalAlpha = 1;
        if (mg > 0.9) { g.strokeStyle = 'rgba(63,224,232,.9)'; g.lineWidth = 4; for (let i = -240; i <= 240; i += 60) { g.beginPath(); g.moveTo(i, -250); g.lineTo(i, 250); g.moveTo(-250, i); g.lineTo(250, i); g.stroke(); } } });
      if (mg < 0.97) layer(yMid, 'rgba(63,224,232,.18)', '#3fe0e8', mg < 0.3 ? 'touch' : '', (g) => { g.strokeStyle = '#3fe0e8'; g.lineWidth = 4; for (let i = -240; i <= 240; i += 60) { g.beginPath(); g.moveTo(i, -250); g.lineTo(i, 250); g.moveTo(-250, i); g.lineTo(250, i); g.stroke(); } });
      layer(yTop, 'rgba(220,240,255,.18)', '#f2f6fa', 'glass');
      const fl = bump(t, C.merge + 0.6, 0.4); if (fl > 0) { g.fillStyle = `rgba(63,224,232,${0.35 * fl})`; g.fillRect(-400, -400, 1880, 2700); }
    });
    add('Today: OLED pixels', 7, C.oled - 0.2, (g, t) => {
      camera(g, t, [[C.oled - 0.2, 540, 880, 1.35, -0.03], [C.S(30), 540, 880, 1.0, 0.03]]);
      P.insertBg(g, t, '#14233a', '#0b1220');
      const smile = (i, j) => { const x = i - 5.5, y = j - 5.5; const r = Math.hypot(x, y); return (Math.abs(r - 4.6) < 0.7) || (Math.hypot(x + 1.8, y + 1.6) < 0.9) || (Math.hypot(x - 1.8, y + 1.6) < 0.9) || (y > 0.8 && Math.abs(r - 2.6) < 0.6); };
      const on = seg(t, C.ownLight - 0.3, C.ownLight + 1.0);
      for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const x = 110 + i * 72, y = 420 + j * 72, lit = smile(i, j) && (hs(i * 13 + j) < on * 1.3);
        const c = lit ? ['#ff5a4a', '#7dff9a', '#5fd0ff'] : ['#3a1a1a', '#173a20', '#16304a'];
        for (let s = 0; s < 3; s++) { g.fillStyle = c[s]; if (lit) { g.save(); g.shadowColor = c[s]; g.shadowBlur = 18; } g.fillRect(x + s * 22, y, 16, 56); if (lit) g.restore(); } }
      P.note(g, t, 'no backlight!', 540, 1560, 540, 1300, seg(t, C.ownLight + 0.3, C.ownLight + 0.6), '#3fe0e8');
    });
    // the fold: a small thin phone held at the chest, folds shut and open (delight), then he tries it backwards: SNAP
    const FX = 540, FY = 1760, FS = 1.25;
    add('Today: it can fold', 7, C.S(30), (g, t) => {
      camera(g, t, [[C.S(30), 540, 1200, 1.3, 0.02], [C.snap - 0.05, 540, 1230, 1.45, -0.02], [C.snap + 0.1, 540, 1150, 1.15, 0.02], [C.final, 540, 1080, 1.1, -0.02]]);
      P.room(g, t, PAL.now); P.bench(g, t, 300, 1060, 1110, PAL.now.wood); P.lamp(g, t, 760, -260, 'rgba(120,230,255,'); P.dustMotes(g, t, 20, 'rgba(63,224,232,.35)');
      const broken = t >= C.snap, ph = [FX, FY - 250 * FS];
      const p = acting([[C.S(30), 'eager', { handL: [-62, 255], handR: [62, 255], lookAt: ph }], [C.fold, 'joy', { handL: [-40, 255], handR: [40, 255], lid: [0.6, 0.6], lookAt: ph }, 9],
        [C.wrongWay - 0.15, 'proud', { handL: [-70, 255], handR: [70, 255], lookAt: ph, lean: 0.05 }, 8], [C.wrongWay + 0.1, 'pokeHard', { pointR: 0, handL: [-50, 240], handR: [50, 240], lookAt: ph }, 6],
        [C.snap, 'shock', { handL: [-150, 300], handR: [150, 310], lookAt: ph }, 4], [C.otherWay + 0.25, 'sheepish', { handL: [-120, 250], handR: [110, 380] }, 10], [C.otherWay + 0.7, 'sideEye', { handL: [-120, 250], handR: [120, 250] }, 14]], t, FX, FY, FS);
      drawChar(g, t, FX, FY, FS, p);
      const fold = Math.sin(Math.PI * seg(t, C.fold - 0.1, C.fold + 0.7)), wrong = seg(t, C.wrongWay - 0.05, C.snap);
      const half = (side, open, dx, dy, rot) => { g.save(); g.translate(ph[0] + dx, ph[1] + dy); g.rotate(rot); const sc = Math.cos(open); g.scale(side * Math.max(0.04, Math.abs(sc)), 1);
        const front = sc > 0; g.fillStyle = '#1c1e24'; g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.roundRect(0, -140, 100, 280, 14); g.fill(); g.stroke();
        if (front) { g.save(); g.beginPath(); g.roundRect(8, -128, 86, 256, 8); g.clip(); homeIcons(g, 8, -128, 86, 256, t); g.restore(); } g.restore(); };
      if (!broken) { const ang = fold * 1.45 - wrong * 0.9;   // + = closing like a book, - = bending backwards (wrong)
        half(-1, ang, 0, 0, 0); half(1, ang, 0, 0, 0);
        if (wrong > 0.4) { g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(ph[0], ph[1] - 140); g.lineTo(ph[0] + 8 * Math.sin(t * 60), ph[1]); g.lineTo(ph[0] - 6, ph[1] + 140); g.stroke(); } }
      else { const u = seg(t, C.snap, C.snap + 0.8); half(-1, 0.2, -240 * eo(u), -300 * u + 900 * u * u, -2 * u); half(1, 0.2, 240 * eo(u), -260 * u + 900 * u * u, 2.4 * u); P.shards(g, t, ph[0], ph[1], u * 1.3); }
      const sk = bump(t, C.snap - 0.02, 0.6); if (sk > 0) text(g, 'SNAP!', 540, 560, 170, '#ffb547', { scale: back(sk * 1.5), rot: 0.1 });
    });
    // finale: he taps the new phone, it buzzes, a finger pops out of the screen and boops his nose, he throws it AT the camera
    const EX = 470, EY = 1760, ES = 1.25;
    add('Finally: it pokes back', 7, C.final, (g, t) => {
      camera(g, t, [[C.final, 540, 1080, 1.08, 0.02], [C.pokeBack - 0.1, 500, 1010, 1.24, -0.02], [C.pokeBack + 0.2, 540, 1060, 1.06, 0.03], [C.DUR, 560, 1080, 1.02, -0.02]]);
      P.room(g, t, PAL.now); P.bench(g, t, 300, 1060, 1110, PAL.now.wood); P.lamp(g, t, 760, -260, 'rgba(120,230,255,'); P.dustMotes(g, t, 20, 'rgba(63,224,232,.35)');
      const thrown = t >= C.scream, buzz = t > C.buzz && !thrown ? 5 : 0;
      const phoneHand = [60, 190], phoneTop = [EX + phoneHand[0] * ES, EY - (phoneHand[1] + 140) * ES];
      const ph = thrown ? null : heldPhone(t, { shake: buzz });
      const p = acting([[C.final, 'joy', { holdR: ph, handR: phoneHand, handL: [-80, 260], lookAt: phoneTop }],
        [C.tap - 0.15, 'eager', { holdR: ph, handR: phoneHand, atL: [EX + 60 * ES, EY - 270 * ES], pointL: 1, lookAt: phoneTop }, 7],
        [C.buzz, 'suspicious', { holdR: ph, handR: phoneHand, handL: [-80, 260], lookAt: phoneTop, tilt: -0.08 }, 6],
        [C.pokeBack - 0.05, 'shock', { holdR: ph, handR: phoneHand, handL: [-90, 280], lookAt: phoneTop, lid: [1.2, 1.2] }, 4],
        [C.scream, 'caught', { holdR: null }, 4]], t, EX, EY, ES);
      drawChar(g, t, EX, EY, ES, p);
      if (!thrown) {   // the finger pops out of the screen, up to his nose
        const hd = headOf(EX, EY, ES, p), nose = [hd[0] + 12 * ES, hd[1] + 18 * ES], top = [EX + p.handR[0] * ES, EY - (p.handR[1] + 145) * ES];
        const po = eo(seg(t, C.pokeBack - 0.22, C.pokeBack)), tip = [lerp(top[0], nose[0], po), lerp(top[1], nose[1] + 10, po)];
        if (po > 0.02) { const k = Stick.sketchCtx(g, t, 97), a = Math.atan2(tip[1] - top[1], tip[0] - top[0]), L = Math.hypot(tip[0] - top[0], tip[1] - top[1]);
          g.save(); g.translate(top[0], top[1]); g.rotate(a); k.strokeStyle = INK; k.lineWidth = 6; k.beginPath(); k.roundRect(-6, -13, L + 8, 26, 13); k.fillStyle = '#f3dcc0'; k.fill(); k.stroke();
          k.beginPath(); k.roundRect(L - 22, -9, 18, 15, 6); k.fillStyle = '#f9e9dc'; k.fill(); k.lineWidth = 3; k.stroke(); g.restore(); }
        P.buzzLines(g, t, top[0], top[1] + 90, 120, buzz ? 1 : 0);
        const q = seg(t, C.buzz, C.buzz + 0.2); if (q > 0) text(g, 'BZZT', top[0] + 170, top[1] - 40, 70, '#3fe0e8', { scale: back(q), rot: 0.2 });
        if (po > 0.9) text(g, 'BOOP', nose[0] - 150, nose[1] - 120, 64, '#ffb547', { rot: -0.2 });
      } else {         // thrown at the camera: it grows and spins until it fills the frame (the loop whip takes over)
        const u = seg(t, C.scream, C.loopA), sc = 1 + 9 * u * u;
        g.save(); g.translate(lerp(EX + 80, 560, u), lerp(EY - 600, 980, u) - 300 * Math.sin(Math.PI * u)); g.rotate(u * 7); g.scale(sc * ES, sc * ES); heldPhone(t)(g); g.restore();
        const ah = seg(t, C.scream, C.scream + 0.3); text(g, 'AAAH!', 360, 640, 150, '#ffb547', { scale: back(ah), rot: -0.12, alpha: 1 - seg(t, C.loopA - 0.3, C.loopA) });
      }
    });

    shots.sort((a, b) => a.t0 - b.t0);
    return shots;
  }
  g0.Shots = { build, camera, PAL };
})(window);
