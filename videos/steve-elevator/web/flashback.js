// Video 3 flashback: New York, 1854. Elisha Otis cuts the rope of his own hoist in front of a crowd.
// Drawn 2D set + characters (kit/char2d), old film (kit/fx/oldfilm), every event on a WORD (kit/timeline/words).
//   const FB = makeFlashback(Words(words));  FB.t0 / FB.t1 = window;  FB.draw(g, t, W, H, present)
//   present = canvas holding the 3D frame of "now" (used by the rewind / fast-forward transitions).
// Story beats (sentences 14-17 of script.txt):
//   "This part is real." rewind to 1854 | "eighteen fifty-four" title | "Elisha Otis" he tips his hat |
//   "cut ... rope" assistant raises the axe and HOLDS (tension) | "crowd" gasps | "platform" CHOP |
//   "dropped" platform falls, pawls bite the teeth | "stopped" calm Otis | "gentlemen" hat off, bow, hats fly |
//   "Steve" fast-forward back to now.
(function (G) {
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, u) => a + (b - a) * u, h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const ramp = (t, a, b) => sm((t - a) / (b - a));
  const spring = (x) => x <= 0 ? 0 : 1 - Math.exp(-6 * x) * Math.cos(11 * x);          // overshoot + settle
  const pulse = (t, a, d) => t < a ? 0 : Math.exp(-(t - a) / d);
  const S1 = 14, S2 = 15, S3 = 16, S4 = 17;
  const SEPIA = { wall: '#cdb994', wall2: '#b9a37c', iron: '#4a3f36', wood: '#a7774a', wood2: '#8c6038', rope: '#c9b28a', floor: '#8f7a5e', glass: '#e6dcc2' };

  G.makeFlashback = function (W0) {
    const at = W0.at;
    const T = {
      This: at('This', S1), real: at('real.', S1), y1854: at('eighteen', S1), Elisha: at('Elisha', S1), cut: at('cut', S1), rope: at('rope', S1),
      crowd: at('crowd', S1), York: at('York.', S1), platform: at('platform', S2), dropped: at('dropped', S2), stopped: at('stopped.', S2),
      All: at('All', S3), gent: at('gentlemen.', S3), Steve: at('Steve', S4),
    };
    T.in0 = T.This - 0.6; T.in1 = T.This + 0.25;           // rewind into 1854 (reaction lands just before the words)
    T.out0 = T.Steve - 0.45; T.out1 = T.Steve + 0.3;       // fast-forward back to now
    T.chop = T.platform + 0.12; T.drop = T.dropped - 0.02; T.lock = T.drop + 0.3;
    const PLAT0 = 1060, DROP = 54;
    let SC = null, PAST = null;

    // ---------------------------------------------------------------- camera: one shot per idea, cuts on words, never still
    function camera(t) {
      const shot = [
        [T.in0, T.Elisha - 0.06, () => ({ x: 545, y: lerp(1010, 980, ramp(t, T.in0, T.Elisha)), z: lerp(0.9, 0.99, ramp(t, T.in0, T.Elisha)) })],
        [T.Elisha - 0.06, T.cut - 0.04, () => ({ x: 545 - 10 * ramp(t, T.Elisha, T.cut), y: PLAT0 - 150, z: lerp(2.25, 2.45, ramp(t, T.Elisha, T.cut)) })],
        [T.cut - 0.04, T.crowd - 0.06, () => ({ x: 855, y: 1360, z: lerp(1.75, 1.95, ramp(t, T.cut, T.crowd)) })],
        [T.crowd - 0.06, T.platform - 0.05, () => ({ x: 560, y: lerp(1880, 1560, ramp(t, T.crowd + 0.2, T.platform)), z: lerp(1.45, 1.2, ramp(t, T.crowd, T.platform)) })],
        [T.platform - 0.05, T.stopped - 0.08, () => ({ x: 640, y: 1220, z: lerp(1.12, 1.2, ramp(t, T.platform, T.stopped)) })],
        [T.stopped - 0.08, T.All - 0.05, () => ({ x: 505, y: PLAT0 + DROP - 150, z: lerp(2.6, 2.75, ramp(t, T.stopped, T.All)) })],
        [T.All - 0.05, 1e9, () => ({ x: 548, y: lerp(1150, 1110, ramp(t, T.All, T.out1)), z: lerp(1.2, 1.32, ramp(t, T.All, T.out1)) })],
      ];
      const s = shot.find(([a, b]) => t >= a && t < b) || shot[0];
      const c = s[2]();
      // handheld breathing + camera kick on the chop and on the lock
      const kick = 10 * pulse(t, T.chop, 0.12) * Math.sin((t - T.chop) * 60) + 16 * pulse(t, T.lock, 0.14) * Math.sin((t - T.lock) * 55);
      c.x += 3 * Math.sin(t * 1.3) + 1.5 * Math.sin(t * 3.7); c.y += 2.5 * Math.sin(t * 1.1 + 1) + kick;
      return c;
    }

    // ---------------------------------------------------------------- the set
    function platY(t) { const d = t < T.drop ? 0 : t < T.lock ? Math.pow((t - T.drop) / 0.3, 2) : 1 + 0.06 * pulse(t, T.lock, 0.08) * Math.sin((t - T.lock) * 70); return PLAT0 + DROP * d; }
    function ropeState(t) { return { cut: t >= T.chop, whip: t >= T.chop ? Math.min((t - T.chop) / 0.5, 1) : 0 }; }

    function hall(k, t) {
      const bg = k.createLinearGradient(0, 0, 0, 1650); bg.addColorStop(0, SEPIA.wall); bg.addColorStop(1, '#a58f6c');   // darker low down = depth
      k.fillStyle = bg; k.fillRect(-600, -600, 2400, 2300);
      // glass roof grid with light coming through
      k.save(); k.fillStyle = SEPIA.glass; k.fillRect(-600, -600, 2400, 760); k.restore();
      k.strokeStyle = SEPIA.iron; k.lineWidth = 7;
      for (let i = -6; i <= 12; i++) { k.beginPath(); k.moveTo(i * 130, -600); k.lineTo(i * 130, 160); k.stroke(); }
      for (let j = 0; j < 6; j++) { k.beginPath(); k.moveTo(-600, -600 + j * 150); k.lineTo(1800, -600 + j * 150); k.stroke(); }
      // iron arches and columns
      for (const [x0, x1] of [[-420, 140], [140, 940], [940, 1500]]) {
        k.lineWidth = 22; k.beginPath(); k.moveTo(x0, 1650); k.lineTo(x0, 300); k.quadraticCurveTo((x0 + x1) / 2, -40, x1, 300); k.lineTo(x1, 1650); k.stroke();
        k.lineWidth = 8; k.beginPath(); k.moveTo(x0 + 40, 330); k.quadraticCurveTo((x0 + x1) / 2, 40, x1 - 40, 330); k.stroke(); }
      // light shafts with drifting dust
      k.save(); k.globalAlpha = 0.18; k.fillStyle = '#fff6dc';
      for (const [x, w] of [[180, 160], [620, 200], [980, 140]]) { k.beginPath(); k.moveTo(x, 160); k.lineTo(x + w, 160); k.lineTo(x + w + 380, 1700); k.lineTo(x + 380, 1700); k.closePath(); k.fill(); }
      k.globalAlpha = 0.65; k.fillStyle = '#fffaf0';
      for (let i = 0; i < 40; i++) { const sx = (h(i) * 1400 - 150 + t * (8 + h(i * 3) * 10)) % 1400 - 150, sy = (h(i * 7) * 1500 + 200 + Math.sin(t * 0.7 + i) * 20); k.beginPath(); k.arc(sx, sy, 2 + h(i * 5) * 2.5, 0, 7); k.fill(); }
      k.restore();
      // bunting garlands sway
      k.lineWidth = 4; k.strokeStyle = SEPIA.iron;
      for (let r = 0; r < 2; r++) { const y0 = 380 + r * 120, sw = Math.sin(t * 1.4 + r) * 10;
        k.beginPath(); k.moveTo(-200, y0); k.quadraticCurveTo(540 + sw, y0 + 120, 1300, y0); k.stroke();
        for (let i = 0; i < 16; i++) { const u = i / 15, x = lerp(-200, 1300, u), y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (y0 + 120) + u * u * y0, fl = Math.sin(t * 2.3 + i) * 0.15;
          k.save(); k.translate(x, y); k.rotate(fl); k.beginPath(); k.moveTo(-18, 0); k.lineTo(18, 0); k.lineTo(0, 44); k.closePath(); k.fillStyle = i % 2 ? '#9b5b45' : '#d8c8a0'; k.fill(); k.lineWidth = 3; k.stroke(); k.restore(); } }
      // far crowd: a band of heads and hats behind the tower, bobbing
      k.fillStyle = '#5a4a3a';
      for (let i = 0; i < 34; i++) { const x = -300 + i * 52 + h(i) * 20, y = 1612 + Math.sin(t * 2 + i * 1.7) * 3 + h(i * 2) * 14;
        k.beginPath(); k.ellipse(x, y, 17, 21, 0, 0, 7); k.fill(); k.beginPath(); k.rect(x - 24, y + 14, 48, 60); k.fill();
        if (h(i * 9) > 0.5) { k.beginPath(); k.rect(x - 13, y - 52, 26, 36); k.rect(x - 22, y - 20, 44, 7); k.fill(); } }
      // floor
      k.fillStyle = SEPIA.floor; k.fillRect(-600, 1650, 2400, 1400); k.strokeStyle = SEPIA.wood2; k.lineWidth = 4;
      for (let i = 0; i < 12; i++) { k.beginPath(); k.moveTo(-600, 1650 + i * i * 9); k.lineTo(1800, 1650 + i * i * 9); k.stroke(); }
    }

    function tower(k, t) {
      const py = platY(t), rs = ropeState(t), turn = (t < T.chop ? 0 : (py - PLAT0) / 46) + Math.sin(t * 0.8) * 0.02;
      k.strokeStyle = '#16161c';
      // back braces
      k.lineWidth = 10; k.strokeStyle = SEPIA.wood2;
      for (let y = 420; y < 1600; y += 300) { k.beginPath(); k.moveTo(400, y); k.lineTo(680, y + 300); k.moveTo(680, y); k.lineTo(400, y + 300); k.stroke(); }
      k.strokeStyle = '#16161c';
      // posts with ratchet teeth on the inner faces
      for (const [x, sd] of [[370, 1], [680, -1]]) {
        k.beginPath(); k.rect(x, 250, 30, 1400); k.fillStyle = SEPIA.wood; k.fill(); k.lineWidth = 7; k.stroke();
        k.beginPath(); const ix = sd > 0 ? x + 30 : x;
        for (let y = 330; y < 1640; y += 26) { k.moveTo(ix, y); k.lineTo(ix + sd * 16, y + 20); k.lineTo(ix, y + 26); }
        k.fillStyle = '#6f6a62'; k.fill(); k.lineWidth = 3.5; k.stroke(); }
      // top beam + pulleys
      k.beginPath(); k.rect(340, 225, 400, 34); k.fillStyle = SEPIA.wood; k.fill(); k.lineWidth = 7; k.stroke();
      for (const [px, r] of [[540, 44], [800, 34]]) { k.save(); k.translate(px, 200); k.rotate(turn * (r === 44 ? 1 : 1.3));
        k.beginPath(); k.arc(0, 0, r, 0, 7); k.fillStyle = '#6f6a62'; k.fill(); k.lineWidth = 6; k.stroke();
        k.lineWidth = 4; k.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; k.moveTo(0, 0); k.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); } k.stroke(); k.restore(); }
      k.beginPath(); k.rect(780, 200, 40, 1450); k.fillStyle = SEPIA.wood2; k.fill(); k.lineWidth = 6; k.stroke();   // winch post
      // winch drum on the ground
      k.save(); k.translate(800, 1590); k.beginPath(); k.ellipse(0, 0, 54, 42, 0, 0, 7); k.fillStyle = SEPIA.wood; k.fill(); k.lineWidth = 6; k.stroke();
      k.lineWidth = 3; for (let i = -2; i <= 2; i++) { k.beginPath(); k.moveTo(i * 18, -40); k.lineTo(i * 18, 40); k.stroke(); } k.restore();
      // rope: platform crosshead -> over the pulleys -> down to the winch. Cut at y=1400 by the axe.
      const hookY = py - 300;
      k.strokeStyle = '#3a2c1c'; k.lineWidth = 9;
      if (!rs.cut) { k.beginPath(); k.moveTo(540, hookY); k.lineTo(540 - 44, 200); k.moveTo(540, 156); k.lineTo(800, 166); k.moveTo(834, 200); k.lineTo(834, 1560); k.stroke(); }
      else {
        const w = rs.whip, top = lerp(1400, 640, spring(w) * 0.9);   // upper end flies up, then the slack rope hangs and sways
        k.beginPath(); k.moveTo(540, hookY); k.lineTo(540 - 44, 200); k.moveTo(540, 156); k.lineTo(800, 166); k.moveTo(834, 200);
        k.quadraticCurveTo(834 + 60 * Math.sin(t * 9) * (1 - w * 0.6), (200 + top) / 2, 834 + 30 * Math.sin(t * 7), top); k.stroke();
        k.beginPath(); k.moveTo(834, 1560); k.quadraticCurveTo(850, 1480, 828 + 6 * Math.sin(t * 5), 1420); k.stroke();
        k.lineWidth = 3; for (let i = 0; i < 5; i++) { k.beginPath(); k.moveTo(828, 1420); k.lineTo(822 + i * 4, 1404 - h(i) * 10); k.stroke(); } }
      // platform: floor, rails, frame up to the crosshead with the wagon spring and pawls
      const pawl = t < T.chop ? 0 : spring((t - T.chop) / 0.25);
      k.lineWidth = 7; k.strokeStyle = '#16161c';
      k.beginPath(); k.rect(404, hookY, 272, 22); k.fillStyle = SEPIA.wood2; k.fill(); k.stroke();                       // crosshead
      k.beginPath(); k.moveTo(540 - 90, hookY + 6); k.quadraticCurveTo(540, hookY - 26 + 22 * pawl, 540 + 90, hookY + 6); k.lineWidth = 9; k.stroke();   // wagon spring flattens when the rope goes slack
      for (const [x, sd] of [[404, -1], [676, 1]]) { k.save(); k.translate(x, hookY + 11); k.rotate(sd * (0.15 - 0.95 * pawl));
        k.beginPath(); k.moveTo(0, -8); k.lineTo(sd * 22, -2); k.lineTo(0, 10); k.closePath(); k.fillStyle = '#6f6a62'; k.fill(); k.lineWidth = 4; k.stroke(); k.restore(); }
      k.lineWidth = 7; k.beginPath(); k.moveTo(414, hookY + 20); k.lineTo(414, py); k.moveTo(666, hookY + 20); k.lineTo(666, py); k.stroke();
      k.beginPath(); k.rect(398, py, 284, 26); k.fillStyle = SEPIA.wood; k.fill(); k.stroke();
      k.lineWidth = 6; k.beginPath(); k.moveTo(404, py - 118); k.lineTo(676, py - 118); k.moveTo(404, py - 60); k.lineTo(676, py - 60); k.stroke();
      // sparks + dust when the pawls bite
      const d = pulse(t, T.lock, 0.25); if (d > 0.02) { k.save(); k.globalAlpha = d;
        for (let i = 0; i < 14; i++) { const a = h(i) * Math.PI, r = 30 + (1 - d) * 120 * h(i * 3); for (const sx of [404, 676]) { k.beginPath(); k.arc(sx + Math.cos(a) * r * (sx < 500 ? -1 : 1), hookY + 10 - Math.sin(a) * r * 0.6 + (1 - d) * 40, 5 + h(i) * 6, 0, 7); k.fillStyle = '#efe2c4'; k.fill(); } }
        k.restore(); }
      return { py, hookY };
    }

    // ---------------------------------------------------------------- the people
    const CROWD = Array.from({ length: 11 }, (_, i) => ({
      x: -40 + i * 112 + (h(i * 3) - 0.5) * 40, y: 2040 + h(i * 5) * 110, s: 0.47 + h(i * 7) * 0.09, seed: i + 3,
      hat: ['top', 'bowler', 'bonnet', 'top', 'cap', 'bowler', 'bonnet', 'top', 'bowler', 'cap', 'top'][i],
      shirt: ['#5d4a3a', '#6b5d4c', '#8a6f5a', '#4a4038', '#7a6a55', '#55493f', '#937a63', '#3e3631', '#6d5b48', '#7d6b57', '#51463d'][i],
    }));
    function person(k, t, P, look) {
      const gasp = ramp(t, T.crowd - 0.05, T.crowd + 0.15) * (1 - ramp(t, T.platform, T.platform + 0.2));
      const panic = t >= T.chop && t < T.stopped + 0.2 ? spring((t - T.chop - P.seed * 0.02) / 0.35) : 0;
      const cheer = t >= T.gent - 0.05 ? spring((t - T.gent - (P.seed % 4) * 0.04) / 0.3) : 0;
      let p = Stick.pose('deadpan', { hat: cheer > 0.3 ? '' : P.hat, hatCol: '#2a221c', shirt: P.shirt, coat: P.seed % 3 === 0 ? '#3a302a' : '', tieOn: 0, bowtie: P.seed % 2,
        tieCol: '#6d3a2c', skin: '#f1e4cc', hairCol: '#3a2e24', pants: '#3b3530', seed: P.seed, look: [look * 0.6, -0.55], lid: [0.75, 0.75], stubble: P.seed % 2, beard: P.seed % 4 === 1 ? 0.6 : 0 });
      if (gasp > 0) p = Stick.mix(p, Object.assign({}, p, { mouth: 'o', open: 0.9, lid: [1.1, 1.1], brow: [[18, -0.25], [18, -0.25]], handR: [30, 330] }), gasp);
      if (panic > 0) p = Stick.mix(p, Object.assign({}, p, { mouth: 'scream', open: 0.8, lid: [1.15, 1.15], pupil: 0.6, brow: [[24, -0.35], [24, -0.35]], handL: [-110, 360], handR: [120, 380], shoulders: 12 }), Math.min(panic, 1.1));
      if (cheer > 0) p = Stick.mix(p, Object.assign({}, p, { mouth: 'grin', open: 0.7, lid: [0.9, 0.9], brow: [[14, -0.1], [14, -0.1]], handL: [-90, 470], handR: [110, 490] }), Math.min(cheer, 1.1));
      p = Stick.alive(p, t + P.seed * 1.7, P.seed);
      Stick.draw(k, P.x, P.y, P.s, p, t);
      if (cheer > 0.3 && P.hat !== 'bonnet') { const u = t - T.gent - 0.1;   // hats thrown in the air, spinning
        k.save(); k.translate(P.x + 30 + u * 60 * (P.seed % 2 ? 1 : -1), P.y - 560 * P.s - 900 * u + 1100 * u * u); k.rotate(u * 9 * (P.seed % 2 ? 1 : -1)); k.scale(P.s * 0.9, P.s * 0.9);
        k.beginPath(); k.ellipse(0, 0, 100, 18, 0, 0, 7); k.fillStyle = '#2a221c'; k.fill(); k.lineWidth = 7; k.strokeStyle = '#16161c'; k.stroke();
        k.beginPath(); k.rect(-58, -150, 116, 150); k.fill(); k.stroke(); k.restore(); }
    }

    function otis(k, t, py) {
      const tip = ramp(t, T.Elisha + 0.15, T.Elisha + 0.45) * (1 - ramp(t, T.cut - 0.1, T.cut + 0.2));
      const jolt = t >= T.drop ? spring((t - T.drop) / 0.3) : 0, calm = ramp(t, T.stopped - 0.1, T.stopped + 0.1);
      const bow = t >= T.All - 0.1 ? Stick.curve((t - T.All + 0.1) / 0.6) : 0;
      let p = Stick.pose('smug', { hat: 'top', hatCol: '#1f1a17', coat: '#2e2622', shirt: '#cdbb98', bowtie: 1, tieCol: '#2a1f1a', beard: 1, hairCol: '#4a3b2e',
        skin: '#f1e2c8', pants: '#3a332e', stubble: 0, seed: 1, look: [0.3, 0.1] });
      if (tip > 0) p = Stick.mix(p, Object.assign({}, p, { hatTip: 0.55, handR: [40, 520], tilt: -0.06 }), tip);
      if (jolt > 0) p = Stick.mix(p, Object.assign({}, p, { squash: 0.5, hip: [0, -22], lid: [1, 1], brow: [[16, 0], [-4, 0.2]], handL: [-120, 250], handR: [110, 260] }), (1 - calm) * Math.min(jolt, 1.2));
      if (calm > 0) p = Stick.mix(p, Object.assign({}, p, { lid: [0.45, 0.6], brow: [[-4, 0], [12, -0.2]], mouth: 'smirk', look: [-0.8, 0.1], handR: [60, 320] }), calm * (1 - bow));
      if (bow > 0) p = Stick.mix(p, Object.assign({}, p, { hatTip: 1.4, handR: [150, 560], lean: 0.25, tilt: 0.2, mouth: 'grin', open: 0.3, lid: [0.3, 0.3], handL: [-70, 200] }), bow);
      p = Stick.alive(p, t, 7);
      Stick.draw(k, 520, py, 0.44, p, t);
    }

    function assistant(k, t) {
      const raise = ramp(t, T.cut - 0.12, T.cut + 0.3), chop = t >= T.chop - 0.1 ? Stick.curve((t - T.chop + 0.1) / 0.28) : 0;
      const shake = raise * (1 - chop) * Math.sin(t * 30) * 0.03;   // axe trembles while he waits
      let p = Stick.pose('angry', { hat: 'cap', hatCol: '#4a3d30', shirt: '#a08a6a', tieOn: 0, pants: '#4a4036', skin: '#f0dfc2', hairCol: '#3a2e24', seed: 2,
        prop: 'axe', propAng: 1.2, handR: [70, 230], handL: [-40, 240], look: [-0.5, 0.4] });
      p = Stick.mix(p, Object.assign({}, p, { handR: [60, 520], propAng: 2.6 + shake * 10, lean: -0.12, hip: [0, -6], lid: [0.9, 0.9], mouth: 'teeth' }), raise);
      if (chop > 0) p = Stick.mix(p, Object.assign({}, p, { handR: [-120, 300], propAng: -0.35, lean: 0.3, hip: [-10, -26], squash: 0.4, mouth: 'flat', lid: [0.3, 0.3] }), Math.min(chop, 1.1));
      p = Stick.alive(p, t, 2);
      Stick.draw(k, 930, 1650, 0.5, p, t);
    }

    // ---------------------------------------------------------------- one frame of 1854 (before the old-film pass)
    function past(t, W, H) {
      if (!PAST) { PAST = document.createElement('canvas'); PAST.width = W; PAST.height = H; }
      const g = PAST.getContext('2d'), cam = camera(t), K = W / 1080;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
      g.setTransform(K * cam.z, 0, 0, K * cam.z, K * (540 - cam.x * cam.z), K * (960 - cam.y * cam.z));
      g.lineCap = g.lineJoin = 'round';
      const k = Stick.sketchCtx(g, t, 11);
      hall(k, t);
      const tw = tower(Stick.sketchCtx(g, t, 12), t);
      otis(g, t, tw.py);
      assistant(g, t);
      for (const P of CROWD) person(g, t, P, (540 - P.x) / 600);
      g.setTransform(1, 0, 0, 1, 0, 0);
      return PAST;
    }

    function title(g, t, W, H) {   // intertitle-style card, slides in on "eighteen fifty-four"
      const a = ramp(t, T.y1854 - 0.05, T.y1854 + 0.2) * (1 - ramp(t, T.cut - 0.2, T.cut));
      if (a <= 0) return; const S = W / 1080;
      g.save(); g.globalAlpha = a; g.translate(W / 2, H * 0.14 + (1 - a) * -40 * S); g.rotate(-0.02 + 0.01 * Math.sin(t * 2));
      g.fillStyle = '#efe0bf'; g.strokeStyle = '#2a1c10'; g.lineWidth = 8 * S; g.beginPath(); g.roundRect(-330 * S, -70 * S, 660 * S, 140 * S, 10 * S); g.fill(); g.stroke();
      g.lineWidth = 3 * S; g.beginPath(); g.roundRect(-312 * S, -54 * S, 624 * S, 108 * S, 6 * S); g.stroke();
      g.fillStyle = '#2a1c10'; g.font = `700 ${64 * S}px Georgia, 'Times New Roman', serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NEW YORK · 1854', 0, 4 * S);
      g.restore();
      const b = ramp(t, T.Elisha, T.Elisha + 0.15) * (1 - ramp(t, T.cut - 0.15, T.cut));   // name label on Otis
      if (b > 0) { g.save(); g.globalAlpha = b; g.translate(W * 0.5, H * 0.3); g.fillStyle = '#efe0bf'; g.strokeStyle = '#2a1c10'; g.lineWidth = 6 * S;
        g.beginPath(); g.roundRect(-210 * S, -44 * S, 420 * S, 88 * S, 8 * S); g.fill(); g.stroke(); g.fillStyle = '#2a1c10'; g.font = `700 ${50 * S}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ELISHA OTIS', 0, 3 * S); g.restore(); }
    }

    function draw(g, t, W, H, present) {
      const f = Math.round(t * 24);
      if (!SC) { SC = document.createElement('canvas'); SC.width = W; SC.height = H; }
      const sc = SC.getContext('2d');
      const film = () => { OldFilm.apply(sc, past(t, W, H), f, 1, W, H); title(sc, t, W, H); return SC; };
      if (t < T.in1) { const u = cl((t - T.in0) / (T.in1 - T.in0)); OldFilm.rewind(g, present, film(), u, f, W, H, [2026, 1854], -1); }
      else if (t >= T.out0) { const u = cl((t - T.out0) / (T.out1 - T.out0)); OldFilm.rewind(g, film(), present, u, f, W, H, [1854, 2026], 1); }
      else { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(film(), 0, 0); }
    }
    return { T, t0: T.in0, t1: T.out1, draw };
  };
})(typeof window !== 'undefined' ? window : globalThis);
