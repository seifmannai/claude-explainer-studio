// metro.js - the 2D metro scenes (hook + ending) of the noise-cancelling film. Classic script: window.Metro.
// Metro.draw(g, t, C) draws one frame on a 1080x1920 2D context. Uses Stick/Dave/Acting (kit) and P (props.js).
(function (g0) {
  const { INK, cl, sm, eo, back, hs, bump, text } = P;
  const lerp = (a, b, k) => a + (b - a) * k, seg = (t, a, b) => cl((t - a) / (b - a));
  const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const FLOOR = 1660, DXX = 540, S = 1.3;
  const HP = { headphones: '#efe7da', hpAccent: '#ffb547' };
  const MOM = { shirt: '#c55b8a', pants: '#3a3550', hairCol: '#3a2418', skin: '#e8c3a0', hat: '', tieOn: 0, stubble: 0, seed: 11 };
  const CHIP = { shirt: '#5aa36b', pants: '#2c3440', hairCol: '#1a1a1a', skin: '#c99a72', hat: 'beanie', hatCol: '#d6332b', tieOn: 0, stubble: 1, seed: 17 };
  const SUIT = { shirt: '#f2f2f2', coat: '#3c4a63', pants: '#2b3446', hairCol: '#6b6b6b', skin: '#f0d2b8', hat: '', tieOn: 1, stubble: 0, seed: 23 };

  // how loud the world is for Dave (1 = full noise, ~0.08 = noise cancelling on)
  const anc = (t, C) => (t < C.back0 - 1 ? eo(seg(t, C.button - 0.05, C.gone + 0.3)) : 1);

  function car(g, t, C, sat) {
    const sway = 0.008 * Math.sin(t * 2.1) + 0.004 * Math.sin(t * 5.3), k = Stick.sketchCtx(g, t, 201);
    // back wall
    g.fillStyle = '#cfd8e3'; g.fillRect(-500, -500, 2100, 2900);
    g.fillStyle = '#b9c4d2'; g.fillRect(-500, 860, 2100, 120);
    // windows (left/right of the door) with the tunnel, or the platform at the end
    const atStation = seg(t, C.back0 + 0.2, C.nothing + 0.6), slide = (t - C.back0) * 900 * (1 - 0.8 * eo(atStation));
    const win = (x0, x1) => {
      g.save(); g.beginPath(); g.roundRect(x0, 420, x1 - x0, 400, 30); g.clip();
      if (t < C.back0) { g.fillStyle = '#141a24'; g.fillRect(x0, 420, x1 - x0, 400);
        for (let i = 0; i < 7; i++) { const x = x0 + ((hs(i) * 900 - t * 1400 * (0.8 + hs(i + 3))) % 900 + 900) % 900 - 100; g.fillStyle = i % 2 ? '#ffd35a' : '#ff9a3c'; g.globalAlpha = 0.85; g.fillRect(x, 470 + hs(i + 9) * 300, 160, 10); g.globalAlpha = 1; }
        if (t > C.brakes - 0.15 && t < C.taps) for (let i = 0; i < 26; i++) { const a = hs(i + Math.floor(t * 30) * 7) * 3.14, d = 40 + 160 * hs(i * 3 + Math.floor(t * 30)); g.strokeStyle = i % 2 ? '#fff6a0' : '#ffb547'; g.lineWidth = 4;
          g.beginPath(); g.moveTo(x1 - 40, 800); g.lineTo(x1 - 40 - Math.cos(a) * d, 800 - Math.sin(a) * d); g.stroke(); } }
      else { g.fillStyle = '#e9e2cf'; g.fillRect(x0, 420, x1 - x0, 400); g.fillStyle = '#c9bea4'; g.fillRect(x0, 700, x1 - x0, 120);
        for (let i = 0; i < 6; i++) { const px = x0 + ((i * 160 - (t - C.back0) * 260) % 960 + 960) % 960 - 100; g.fillStyle = '#b3a88e'; g.fillRect(px, 600, 18, 100); }   // platform pillars
        if (x0 > 0) { const sx = 900 - (t - C.nothing) * 210;   // the station sign slides past the right window, readable around "nothing"
          g.fillStyle = '#2f6f9e'; g.beginPath(); g.roundRect(sx - 170, 480, 340, 120, 16); g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
          text(g, "DAVE'S", sx, 518, 44, '#fff', { stroke: 0 }); text(g, 'STOP', sx, 566, 50, '#ffd35a', { stroke: 0 }); } }
      g.restore(); k.strokeStyle = INK; k.lineWidth = 12; k.beginPath(); k.roundRect(x0, 420, x1 - x0, 400, 30); k.stroke();
    };
    win(-180, 330); win(750, 1260);
    // doors in the middle (close at the end)
    const doorOpen = t > C.back0 ? 1 - eio(seg(t, C.stop - 0.2, C.stop + 0.3)) : 0, dw = 210 * (1 - 0.0) ;
    g.fillStyle = '#e9e2cf'; g.fillRect(345, 400, 390, 1260);
    for (const sd of [-1, 1]) { const x = 540 + sd * (dw * doorOpen) - (sd < 0 ? 195 : 0); g.fillStyle = '#9fb0c2'; g.fillRect(x, 400, 195, 1260); k.strokeStyle = INK; k.lineWidth = 8; k.beginPath(); k.rect(x, 400, 195, 1260); k.stroke();
      g.fillStyle = '#1b2433'; g.fillRect(x + 40, 460, 115, 300); }
    // ceiling rail, straps swinging with the train, poles
    g.fillStyle = '#9aa3ad'; g.fillRect(-500, 300, 2100, 20);
    for (let i = 0; i < 8; i++) { const x = -60 + i * 170, a = 0.12 * Math.sin(t * 2.1 + i * 0.4) + 0.05 * Math.sin(t * 5 + i);
      const len = i === 3 ? 660 : 120; g.save(); g.translate(x, 310); g.rotate(a * (i === 3 ? 0.3 : 1)); k.strokeStyle = INK; k.lineWidth = 6; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, len); k.stroke(); k.beginPath(); k.ellipse(0, len + 30, 26, 32, 0, 0, 7); k.lineWidth = 9; k.strokeStyle = '#ffb547'; k.stroke(); g.restore(); }
    for (const x of [90, 990]) { k.beginPath(); k.moveTo(x, 300); k.lineTo(x, FLOOR); k.lineWidth = 20; k.strokeStyle = '#e8c35c'; k.stroke(); }
    // floor + the crowd behind (silhouettes)
    g.fillStyle = '#5d6b8a'; g.fillRect(-500, FLOOR, 2100, 1000);
    g.fillStyle = 'rgba(40,50,70,.55)'; for (let i = 0; i < 9; i++) { const x = -120 + i * 150 + 20 * Math.sin(t * 1.3 + i), h = 560 + 80 * hs(i + 2);
      g.beginPath(); g.ellipse(x, FLOOR - h + 40, 52, 60, 0, 0, 7); g.fill(); g.beginPath(); g.roundRect(x - 80, FLOOR - h + 100, 160, h, 50); g.fill(); }
    return sway;
  }
  // a noise squiggle travelling from a source to Dave's ear; it stops at the calm bubble when noise cancelling is on
  function squiggle(g, t, a, b, col, amp, freq, k, quiet, R) {
    if (k <= 0) return; const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), stopAt = quiet > 0.01 ? L - R * quiet : L;
    g.save(); g.translate(a[0], a[1]); g.rotate(ang); g.globalAlpha = cl(k); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); for (let x = 0; x <= Math.min(L, stopAt); x += 6) { const y = amp * Math.sin(x * freq - t * 20) * (0.6 + 0.4 * Math.sin(x * 0.013 + t * 3)); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = INK; g.lineWidth = 13; g.stroke(); g.strokeStyle = col; g.lineWidth = 7; g.stroke(); g.restore();
  }
  function baby(g, t, x, y, cry) {
    const k = Stick.sketchCtx(g, t, 211); k.strokeStyle = INK; k.lineWidth = 6;
    k.beginPath(); k.ellipse(x, y + 30, 70, 50, -0.3, 0, 7); k.fillStyle = '#f4d3e2'; k.fill(); k.stroke();       // blanket
    k.beginPath(); k.arc(x - 30, y - 10, 40, 0, 7); k.fillStyle = '#f6dcc6'; k.fill(); k.stroke();                    // head
    const o = cry * (0.6 + 0.4 * Math.abs(Math.sin(t * 9)));
    g.fillStyle = INK; g.beginPath(); g.ellipse(x - 30, y + 8, 14 * o + 3, 16 * o + 3, 0, 0, 7); g.fill();          // crying mouth
    g.lineWidth = 4; g.strokeStyle = INK; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x - 30 + sd * 12 - 8, y - 22); g.lineTo(x - 30 + sd * 12 + 8, y - 18); g.stroke(); }
    if (cry > 0.3) { g.fillStyle = '#7fd6ff'; for (const sd of [-1, 1]) { const d = (t * 2 + (sd > 0 ? 0.5 : 0)) % 1; g.beginPath(); g.arc(x - 30 + sd * 32, y - 10 + d * 40, 6, 0, 7); g.fill(); } }
  }
  const chipsBag = (t) => (c) => { c.beginPath(); c.moveTo(-36, -120); c.lineTo(36, -120); c.lineTo(44, 20); c.lineTo(-44, 20); c.closePath(); c.fillStyle = '#ffd35a'; c.fill(); c.lineWidth = 5; c.stroke();
    c.fillStyle = '#d6332b'; c.fillRect(-30, -80, 60, 40); };

  // ------------------------------------------------------------------ the frame
  function draw(g, t, C) {
    const q = anc(t, C), end = t > C.back0 - 0.5;
    const head = [DXX - 6, FLOOR - 450 * S], cup = [head[0] + 88 * S * 0.98, head[1] + 4];
    // camera: hook wide -> punch-ins on each noise -> close on Dave -> dive into the ear cup ; ending: out of the cup -> wide
    const keys = end
      ? [[C.back0, cup[0], cup[1], 7, 0], [C.back1 + 0.35, 700, 980, 1.08, 0.01], [C.notEven, 720, 960, 1.05, -0.01], [C.stop + 0.4, 620, 1000, 1.15, 0.02], [C.DUR, 600, 990, 1.1, 0]]
      : [[0, 540, 1060, 1.05, -0.01], [C.more - 0.1, 540, 1060, 1.05, -0.01], [C.moreNoise + 0.1, 560, 1040, 1.35, 0.02], [C.rush - 0.05, 540, 1060, 1.0, 0],
         [C.baby - 0.12, 260, 1060, 1.45, -0.03], [C.brakes - 0.12, 860, 900, 1.45, 0.03], [C.taps - 0.2, 560, 1080, 1.55, 0], [C.button, 600, 1060, 1.9, 0.01],
         [C.gone + 0.3, 540, 1060, 1.15, -0.01], [C.dive0, 560, 1040, 1.3, 0], [C.dive1, cup[0], cup[1], 9, 0.08]];
    Acting.shake = end ? 0.6 : 1 + (1 - q) * 0.8;
    const cam = Acting.camera(g, t, keys);
    const satv = 1 - 0.75 * q * (end ? 1 : 1);
    g.filter = q > 0.02 ? `saturate(${satv}) brightness(${1 - 0.18 * q})` : 'none';
    car(g, t, C);
    // the others: mom with the baby, the chips guy, a suited commuter (all hold straps, the train sways them)
    const shove = bump(t, C.rush - 0.05, 0.6);
    const mom = Acting.acting([[0, 'defeat', { handL: [-10, 330], handR: [40, 340], lookAt: [180, 1180] }], [C.baby, 'panic', { handL: [-10, 330], handR: [40, 340], lookAt: [180, 1180] }, 6],
      [C.gone, 'deadpan', { handL: [-10, 330], handR: [40, 340], lookAt: [180, 1180] }, 14]], t, 200, FLOOR, 1.22, MOM, { eyes: 0.1, fidget: 0.4 });
    Acting.drawChar(g, t, 200 - 40 * shove, FLOOR, 1.22, mom);
    baby(g, t, 230 - 40 * shove, FLOOR - 330 * 1.22, t < C.gone ? 1 : 0.9);
    const chew = Math.abs(Math.sin(t * 7)) * (t > C.rush ? 1 : 0.4);
    const chip = Acting.acting([[0, 'deadpan', { holdR: chipsBag(t), handR: [60, 270], handL: [-40, 420], mouth: 'o', open: chew * 0.6, lookAt: [920, 1300] }]], t, 900, FLOOR, 1.24, CHIP, { eyes: 0.1, fidget: 0.5 });
    chip.open = chew * 0.6; Acting.drawChar(g, t, 900 + 40 * shove, FLOOR, 1.24, chip);
    g.filter = 'none';
    // noise squiggles into Dave's ears (they stop at the calm bubble when noise cancelling is on)
    const R = 260, quiet = end ? 1 : q, earL = [head[0] - 88 * S, head[1]], earR = cup, hook = seg(t, 0, 0.25);
    if (!end) {
      squiggle(g, t, [230, FLOOR - 380 * 1.22], earL, '#ff6aa8', 26, 0.09, hook * (1 + bump(t, C.baby - 0.1, 0.9)), quiet, R);
      squiggle(g, t, [1000, 760], earR, '#ffd35a', 18, 0.16, hook * (t > C.brakes - 0.15 ? 1.4 : 0.5), quiet, R);
      squiggle(g, t, [860, FLOOR - 470 * 1.24], earR, '#ff9a3c', 14, 0.12, hook * (t > C.rush ? 0.9 : 0.4), quiet, R);
      squiggle(g, t, [540, FLOOR + 20], [head[0], head[1] + 200], '#9fb3c8', 30, 0.035, hook * 0.8, quiet, R);
      if (t > C.rush && t < C.gone) { const u = (t * 2.2) % 1; text(g, 'CRUNCH', 860, 1050 - 40 * u, 46, '#ff9a3c', { alpha: 1 - u, rot: 0.15 }); }
      if (t > C.baby - 0.05 && t < C.taps) text(g, 'WAAAH!', 260, 880, 74, '#ff6aa8', { rot: -0.1 + 0.05 * Math.sin(t * 20), scale: back(seg(t, C.baby - 0.05, C.baby + 0.2)) });
      if (t > C.brakes - 0.05 && t < C.taps) text(g, 'SCREEEECH', 820, 660, 70, '#ffd35a', { rot: 0.08 + 0.04 * Math.sin(t * 25), scale: back(seg(t, C.brakes - 0.05, C.brakes + 0.2)) });
    }
    // the calm bubble (noise cancelling on)
    const bu = end ? 1 - seg(t, C.stop + 0.3, C.stop + 0.8) : eo(seg(t, C.button, C.gone + 0.4));
    if (bu > 0) { g.save(); g.globalAlpha = 0.9 * bu; const rg = g.createRadialGradient(head[0], head[1], R * 0.5, head[0], head[1], R); rg.addColorStop(0, 'rgba(63,224,232,0)'); rg.addColorStop(0.92, 'rgba(63,224,232,.18)'); rg.addColorStop(1, 'rgba(63,224,232,.55)');
      g.fillStyle = rg; g.beginPath(); g.arc(head[0], head[1], R * (0.96 + 0.04 * Math.sin(t * 2)), 0, 7); g.fill(); g.restore(); }
    // Dave
    const lookBaby = [240, 1220], win = [1000, 640];
    const keysD = end
      ? [[C.back0, 'joy', Object.assign({ hpLed: 1, lid: [0.05, 0.05], tilt: -0.1, handL: [-70, 500] }, HP)], [C.nothing, 'joy', Object.assign({ hpLed: 1, lid: [0.05, 0.05], tilt: 0.06, handL: [-70, 500] }, HP), 20],
         [C.stop - 0.05, 'shock', Object.assign({ hpLed: 1, handL: [-70, 500], lookAt: win }, HP), 10], [C.stop + 0.35, 'caught', Object.assign({ hpLed: 1, lookAt: win }, HP), 5],
         [C.stop + 0.9, 'sideEye', Object.assign({ hpLed: 1 }, HP), 14]]
      : [[0, 'defeat', Object.assign({ handL: [-70, 500], handR: [70, 260], lookAt: lookBaby, mouth: 'teeth' }, HP)],
         [C.more, 'suspicious', Object.assign({ handL: [-70, 500], handR: [70, 260], lookAt: [cup[0] + 120, cup[1] - 60] }, HP), 9],
         [C.rush, 'defeat', Object.assign({ handL: [-70, 500], handR: [70, 250], lean: 0.18, squash: 0.4, lookAt: [0, 1100], mouth: 'teeth' }, HP), 5],
         [C.baby - 0.05, 'shock', Object.assign({ handL: [-70, 500], handR: [60, 250], shoulders: 16, lookAt: lookBaby }, HP), 5],
         [C.brakes - 0.05, 'angry', Object.assign({ handL: [-70, 500], handR: [60, 250], lid: [0.15, 0.15], tilt: -0.12, lookAt: win }, HP), 5],
         [C.taps - 0.25, 'deadpan', Object.assign({ handL: [-70, 500], handR: [70, 260], look: [0, 0], lid: [0.6, 0.6] }, HP), 9],
         [C.button - 0.2, 'poke', Object.assign({ handL: [-70, 500], at: [cup[0] + 18, cup[1] + 10], look: [0.4, 0], lean: -0.04 }, HP), 7],
         [C.button + 0.1, 'poke', Object.assign({ hpLed: 1, handL: [-70, 500], at: [cup[0] + 18, cup[1] + 10], look: [0.4, 0], lid: [0.9, 0.9] }, HP), 3],
         [C.whole, 'joy', Object.assign({ hpLed: 1, handL: [-70, 500], handR: [70, 260], lid: [0.05, 0.05], tilt: -0.08 }, HP), 18]];
    const d = Acting.acting(keysD, t, DXX, FLOOR, S);
    Acting.drawChar(g, t + (end ? 0 : 0), DXX - 30 * shove * 0, FLOOR, S, d);
    // his own cup "makes noise": a little cyan wave pops out of it on "more noise"
    const mn = bump(t, C.more, 1.0); if (mn > 0) { g.save(); g.globalAlpha = mn; for (let i = 0; i < 3; i++) { g.strokeStyle = '#3fe0e8'; g.lineWidth = 7; g.beginPath(); g.arc(cup[0], cup[1], 50 + i * 34 + 30 * (1 - mn), -0.9, 0.9); g.stroke(); } g.restore(); }
    if (t > C.button - 0.02 && t < C.gone) text(g, 'click', cup[0] + 120, cup[1] - 90, 56, '#3fe0e8', { scale: back(seg(t, C.button - 0.02, C.button + 0.2)), rot: 0.1 });
    if (end && t > C.stop + 0.3) text(g, '!!', head[0] + 160, head[1] - 180, 130, '#ffb547', { rot: 0.2, scale: back(seg(t, C.stop + 0.3, C.stop + 0.6)) });
    return { cup, head, cam };
  }
  g0.Metro = { draw, anc };
})(window);
