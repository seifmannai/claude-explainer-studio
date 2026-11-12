// kit/char2d/stick.js - hand-drawn 2D character (our own design) for 3D worlds. Canvas 2D, no dependencies.
//   Stick.draw(ctx, x, y, s, pose)   x,y = feet on the ground (pixels), s = scale (1 = 520 px tall)
//   pose = Stick.pose('panic', {look:[.3,0]})  - a named expression merged with overrides; Stick.mix(a,b,k) blends two.
// Every number in a pose is animatable, so idle layers (breath, blink, sway) are just small offsets added per frame.
(function (g) {
  const INK = '#17171d', SKIN = '#f7f2e8', SHADE = '#ddd3c2';
  const BASE = { lean: 0, tilt: 0, squash: 0, bob: 0, look: [0, 0], lid: [0.62, 0.62], brow: [[0, 0], [0, 0]], pupil: 1,
    mouth: 'flat', open: 0, mw: 1, sweat: 0, blush: 0, hair: 0, tie: 0, shirt: '#2f6f7e', tieCol: '#c8452f',
    handL: [-78, 205], handR: [78, 205], footL: [-34, 0], footR: [34, 0], hip: [0, 0], shoulders: 0 };
  // brow = [raise, angle] per eye (angle > 0 = inner end down = angry); hands/feet are offsets from the ground point, y up
  const EXPR = {
    deadpan: { lid: [0.5, 0.5], brow: [[-4, 0], [-4, 0]], mouth: 'flat' },
    smug: { lid: [0.42, 0.55], brow: [[6, -0.12], [-6, 0.3]], mouth: 'smirk', tilt: 0.1, lean: -0.05, handR: [60, 300], handL: [-70, 215] },
    panic: { lid: [1.15, 1.15], pupil: 0.55, brow: [[26, -0.35], [26, -0.35]], mouth: 'scream', open: 1, sweat: 1, hair: 1, tie: 1,
      shoulders: 16, handL: [-170, 400], handR: [165, 430], footL: [-60, 0], footR: [52, 0], hip: [0, -22], lean: -0.1, tilt: -0.06 },
    defeat: { lid: [0.3, 0.3], brow: [[2, -0.3], [2, -0.3]], mouth: 'frown', look: [0, 0.7], shoulders: -14, lean: 0.12, tilt: 0.2,
      handL: [-60, 170], handR: [50, 165], hip: [0, -8] },
    idea: { lid: [1, 1], brow: [[20, -0.1], [22, -0.1]], mouth: 'grin', open: 0.5, look: [0.2, -0.5], handR: [120, 480], handL: [-80, 240], tilt: -0.05 },
    angry: { lid: [0.55, 0.55], brow: [[-12, 0.45], [-12, 0.45]], mouth: 'teeth', shoulders: 10, lean: 0.08, handL: [-120, 215], handR: [120, 215], footL: [-48, 0], footR: [48, 0] },
    suspicious: { lid: [0.3, 0.62], brow: [[-10, 0.3], [14, -0.2]], mouth: 'side', look: [0.8, 0], tilt: -0.08, handR: [40, 330], handL: [-60, 230] },
    relief: { lid: [0.05, 0.05], brow: [[12, -0.25], [12, -0.25]], mouth: 'o', open: 0.5, shoulders: -8, tilt: 0.1, handR: [30, 300], sweat: 0.5 },
  };
  const lerp = (a, b, k) => a + (b - a) * k;
  function mix(a, b, k) {
    const o = {};
    for (const key in a) {
      const x = a[key], y = b[key];
      if (typeof x === 'number') o[key] = lerp(x, y, k);
      else if (Array.isArray(x)) o[key] = x.map((v, i) => Array.isArray(v) ? v.map((w, j) => lerp(w, y[i][j], k)) : lerp(v, y[i], k));
      else o[key] = k < 0.5 ? x : y;
    }
    return o;
  }
  const pose = (name, over) => Object.assign({}, BASE, EXPR[name] || {}, over || {});

  function limb(c, ax, ay, bx, by, len, bend, w) {       // two-bone IK drawn as one smooth stroke
    const dx = bx - ax, dy = by - ay, d0 = Math.hypot(dx, dy) || 1; len = Math.min(len, Math.max(d0 * 1.12, 120));   // rubber-hose: never loops
    const d = Math.min(d0, len * 0.999);
    const h = Math.sqrt(Math.max(len * len - d * d, 0)) / 2 * bend, mx = (ax + bx) / 2 - dy / d * h, my = (ay + by) / 2 + dx / d * h;
    c.lineWidth = w; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx * 2 - (ax + bx) / 2, my * 2 - (ay + by) / 2, bx, by); c.stroke();
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
  function blob(c, fill, lw) { c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.stroke(); }

  function draw(c, X, Y, s, p) {
    c.save(); c.translate(X, Y); c.scale(s, -s); c.lineCap = c.lineJoin = 'round'; c.strokeStyle = INK;   // y up, feet at 0
    const L = 9, hipY = 190 + p.hip[1], hipX = p.hip[0], sq = 1 - p.squash * 0.12;
    const bodyH = 150 * sq, bodyW = 104 * (1 + p.squash * 0.1), topY = hipY + bodyH, lx = -p.lean * bodyH;
    const shY = topY - 34 + p.shoulders, neck = [hipX + lx, topY], headC = [neck[0] - p.tilt * 40, topY + 96 + p.bob];
    // ground shadow (a real shadow comes from the 3D proxy; this is the fallback)
    c.save(); c.scale(1, 0.22); c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.arc(hipX * 0.5, 0, 92, 0, 7); c.fill(); c.restore();
    // far arm, legs
    limb(c, hipX + lx * 0.8 - 44, shY, p.handL[0], p.handL[1], 235, 0.55, L);
    for (const [f, sx] of [[p.footL, -24], [p.footR, 24]]) {
      limb(c, hipX + sx, hipY + 8, f[0], f[1] + 12, 204, sx < 0 ? -0.3 : 0.3, L);
      c.save(); c.translate(f[0] + 12, f[1] + 11); c.scale(1, 0.55); c.beginPath(); c.arc(0, 0, 25, 0, 7); blob(c, INK, 2); c.restore();
    }
    // body: shirt, belt, tie (the tie flies up with p.tie)
    c.save(); c.transform(1, 0, -p.lean, 1, hipX, hipY);
    rr(c, -bodyW / 2, 0, bodyW, bodyH, [44, 44, 50, 50]); blob(c, p.shirt, L);
    c.save(); rr(c, -bodyW / 2, 0, bodyW, bodyH, [44, 44, 50, 50]); c.clip();
    c.fillStyle = 'rgba(0,0,0,.16)'; c.fillRect(bodyW * 0.18, 0, bodyW, bodyH);                       // soft form shadow
    c.fillStyle = INK; c.fillRect(-bodyW, 16, bodyW * 2, 13); c.fillStyle = '#d9b44a'; c.fillRect(-9, 15, 18, 15); c.restore();
    const ta = p.tie * 1.25; c.save(); c.translate(0, bodyH - 12); c.rotate(ta);
    c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.lineTo(14, -62); c.lineTo(0, -80); c.lineTo(-14, -62); c.closePath(); blob(c, p.tieCol, 5); c.restore();
    c.beginPath(); c.moveTo(-30, bodyH - 4); c.lineTo(0, bodyH - 26); c.lineTo(30, bodyH - 4); c.lineWidth = 6; c.stroke();   // collar
    c.restore();
    // neck + head
    c.lineWidth = L; c.beginPath(); c.moveTo(neck[0], neck[1] - 6); c.lineTo(headC[0], headC[1] - 70); c.stroke();
    c.save(); c.translate(headC[0], headC[1]); c.rotate(-p.tilt);
    const hw = 164, hh = 172;
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * (hw / 2 + 4), -6, 15, 22, 0, 0, 7); blob(c, SKIN, 7); }   // ears
    rr(c, -hw / 2, -hh / 2, hw, hh, [46, 46, 58, 58]); blob(c, SKIN, L);
    c.save(); rr(c, -hw / 2, -hh / 2, hw, hh, [46, 46, 58, 58]); c.clip();
    c.fillStyle = SHADE; c.globalAlpha = 0.55; c.beginPath(); c.ellipse(hw * 0.62, -10, hw * 0.4, hh * 0.75, 0, 0, 7); c.fill(); c.globalAlpha = 1;
    c.fillStyle = 'rgba(40,40,50,.35)';                                                                  // stubble
    for (let i = 0; i < 26; i++) { const a = i * 2.399, r = 8 + (i * 37 % 30); c.beginPath(); c.arc(Math.cos(a) * r * 1.9, -hh / 2 + 22 + Math.sin(a) * 9 + (i % 3) * 3, 1.7, 0, 7); c.fill(); }
    if (p.blush) { c.fillStyle = `rgba(230,110,90,${0.35 * p.blush})`; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 52, -22, 18, 10, 0, 0, 7); c.fill(); } }
    c.restore();
    // hair: a swept block with loose strands; p.hair lifts the strands (fright)
    c.beginPath(); c.moveTo(-hw / 2 - 8, hh / 2 - 34); c.quadraticCurveTo(-hw / 2 - 4, hh / 2 + 22, -20, hh / 2 + 20);
    c.quadraticCurveTo(50, hh / 2 + 30 + p.hair * 8, hw / 2 + 16, hh / 2 - 6); c.quadraticCurveTo(hw / 2 + 8, hh / 2 - 30, hw / 2 - 2, hh / 2 - 40);
    c.quadraticCurveTo(10, hh / 2 - 8, -hw / 2 - 8, hh / 2 - 34); c.closePath(); blob(c, '#2a2630', 7);
    c.lineWidth = 6; for (let i = 0; i < 4; i++) { const hx = -50 + i * 34; c.beginPath(); c.moveTo(hx, hh / 2 + 16);
      c.quadraticCurveTo(hx + 14 - p.hair * 10, hh / 2 + 34 + p.hair * 26, hx + 30 - p.hair * 26, hh / 2 + 26 + p.hair * 44 + (i % 2) * 6); c.stroke(); }
    // eyes, lids, pupils, brows
    for (let i = 0; i < 2; i++) {
      const sx = i ? 1 : -1, ex = sx * 38, ey = 8, lid = Math.max(p.lid[i], 0), ew = 27, eh = 21 * Math.min(Math.max(lid, 0.06), 1.2);
      c.save(); c.beginPath(); c.ellipse(ex, ey, ew, eh, 0, 0, 7); blob(c, '#fff', 6);
      if (lid > 0.1) { c.clip(); c.fillStyle = INK; c.beginPath(); c.arc(ex + p.look[0] * 13, ey - p.look[1] * 9, 8.5 * p.pupil, 0, 7); c.fill();
        if (lid < 0.95) { c.fillStyle = SKIN; c.fillRect(ex - ew - 4, ey + eh * (2 * lid - 1) + 2, ew * 2 + 8, 60); } }
      c.restore();
      if (lid > 0.1 && lid < 0.95) { c.lineWidth = 6; c.beginPath(); c.moveTo(ex - ew * 0.96, ey + eh * (2 * lid - 1) + 2); c.lineTo(ex + ew * 0.96, ey + eh * (2 * lid - 1) + 2); c.stroke(); }
      c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 16, ey - eh - 9); c.quadraticCurveTo(ex, ey - eh - 14, ex + 16, ey - eh - 9); c.globalAlpha = 0.45; c.stroke(); c.globalAlpha = 1;   // eye bag
      const [br, ba] = p.brow[i]; c.save(); c.translate(ex, ey + 33 + br); c.rotate(sx * ba);
      c.lineWidth = 15; c.beginPath(); c.moveTo(-27, 0); c.quadraticCurveTo(0, 5, 27, 0); c.stroke(); c.restore();
    }
    // nose + mouth
    c.lineWidth = 6; c.beginPath(); c.moveTo(2, 2); c.lineTo(8, -18); c.lineTo(-2, -20); c.stroke();
    const my = -48, mw = 44 * p.mw, o = p.open; c.lineWidth = 7;
    const teeth = (h) => { c.fillStyle = '#fff'; c.fill(); c.stroke(); c.save(); c.clip(); c.lineWidth = 3; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(k * mw / 3.2, my - h - 40); c.lineTo(k * mw / 3.2, my + 40); c.stroke(); } c.beginPath(); c.moveTo(-mw - 9, my - h * 0.5 + 0); c.lineTo(mw + 9, my - h * 0.5); c.stroke(); c.restore(); };
    c.beginPath();
    switch (p.mouth) {
      case 'smirk': c.moveTo(-mw * 0.7, my - 2); c.quadraticCurveTo(mw * 0.2, my - 10, mw * 0.9, my + 12); c.stroke(); c.beginPath(); c.arc(mw * 0.9 + 3, my + 15, 4, 0, 7); c.fillStyle = INK; c.fill(); break;
      case 'frown': c.moveTo(-mw * 0.75, my - 12); c.quadraticCurveTo(0, my + 8, mw * 0.75, my - 12); c.stroke(); break;
      case 'side': c.moveTo(-mw * 0.1, my); c.lineTo(mw * 0.85, my + 3); c.stroke(); break;
      case 'o': c.ellipse(0, my - 4, 11 + o * 4, 9 + o * 12, 0, 0, 7); blob(c, '#3a1620', 7); break;
      case 'grin': c.moveTo(-mw, my + 8); c.quadraticCurveTo(0, my + 2, mw, my + 8); c.quadraticCurveTo(mw * 0.7, my - 22 - o * 22, 0, my - 24 - o * 24); c.quadraticCurveTo(-mw * 0.7, my - 22 - o * 22, -mw, my + 8); c.closePath(); teeth(24 + o * 24); break;
      case 'teeth': rr(c, -mw, my - 20, mw * 2, 26, 9); teeth(26); break;
      case 'scream': rr(c, -mw * 0.8, my - 30 - o * 22, mw * 1.6, 40 + o * 22, [14, 14, 24, 24]); blob(c, '#3a1620', 7);
        c.save(); c.clip(); c.fillStyle = '#fff'; c.fillRect(-mw, my - 2, mw * 2, 20); c.fillStyle = '#d0584e'; c.beginPath(); c.ellipse(4, my - 34 - o * 22, 24, 15, 0, 0, 7); c.fill(); c.restore();
        rr(c, -mw * 0.8, my - 30 - o * 22, mw * 1.6, 40 + o * 22, [14, 14, 24, 24]); c.stroke(); break;
      default: c.moveTo(-mw * 0.7, my); c.lineTo(mw * 0.7, my); c.stroke();
    }
    for (let k = 0; k < Math.round(p.sweat * 3); k++) { const dx = hw / 2 + 20 + k * 20, dy = 44 - k * 30; c.beginPath(); c.moveTo(dx, dy + 16); c.quadraticCurveTo(dx + 13, dy - 8, dx, dy - 12); c.quadraticCurveTo(dx - 13, dy - 8, dx, dy + 16); blob(c, '#9fd8f0', 4); }
    c.restore();
    // near arm + hands (drawn last so gestures cross the body)
    limb(c, hipX + lx * 0.8 + 44, shY, p.handR[0], p.handR[1], 235, -0.55, L);
    for (const h of [p.handL, p.handR]) { c.beginPath(); c.arc(h[0], h[1], 17, 0, 7); blob(c, SKIN, 7); }
    c.restore();
  }
  g.Stick = { draw, pose, mix, EXPR, BASE };
})(typeof window !== 'undefined' ? window : globalThis);
