// props.js - sets and props for the touchscreen film, drawn with the kit's boiling ink (Stick.sketchCtx) so the world
// and Dave look drawn by the same hand. Every function is a pure function of its arguments (t = film time).
(function (g0) {
  const INK = '#16161c';
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const eo = (x) => 1 - Math.pow(1 - cl(x), 3);
  const back = (x) => { x = cl(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const hs = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const bump = (t, a, d) => (t < a || t > a + d ? 0 : Math.sin(Math.PI * (t - a) / d));
  const sk = (g, t, seed) => Stick.sketchCtx(g, t, seed);
  const FONT = '"Segoe UI", "Inter", Arial, sans-serif';
  const HAND = '"Segoe Print", "Comic Sans MS", "Segoe UI", sans-serif';

  function text(g, s, x, y, size, fill, o = {}) {
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.scale) g.scale(o.scale, o.scale);
    g.font = `${o.weight || 900} ${size}px ${o.font || FONT}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    g.globalAlpha *= o.alpha ?? 1;
    if (o.stroke !== 0) { g.lineJoin = 'round'; g.lineWidth = o.lw || size * 0.18; g.strokeStyle = o.stroke || INK; g.strokeText(s, 0, 0); }
    g.fillStyle = fill; g.fillText(s, 0, 0); g.restore();
  }

  // ------------------------------------------------------------ rooms
  // pal: {wall, wall2, floor, wood, kind: 'workshop'|'radar'|'seventies'|'eighties'|'nineties'|'modern'|'kitchen'|'night'}
  function room(g, t, pal) {
    const k = sk(g, t, 11);
    g.fillStyle = pal.wall; g.fillRect(-400, -400, 1880, 2700);
    // wallpaper / planks
    g.save(); g.globalAlpha = 0.5;
    if (pal.kind === 'seventies') { for (let i = -4; i < 14; i++) { g.fillStyle = i % 2 ? pal.wall2 : '#d98c3a'; g.fillRect(i * 110, -400, 46, 1900); } }
    else if (pal.kind === 'nineties') { g.fillStyle = pal.wall2; for (let i = 0; i < 60; i++) { const x = hs(i) * 1500 - 200, y = hs(i + 50) * 1500 - 100; g.save(); g.translate(x, y); g.rotate(hs(i + 3) * 6); g.fillRect(-30, -6, 60, 12); g.restore(); } }
    else if (pal.kind === 'kitchen') { g.strokeStyle = pal.wall2; g.lineWidth = 3; for (let x = -400; x < 1500; x += 90) { g.beginPath(); g.moveTo(x, 600); g.lineTo(x, 1200); g.stroke(); } for (let y = 600; y < 1200; y += 90) { g.beginPath(); g.moveTo(-400, y); g.lineTo(1500, y); g.stroke(); } }
    else { k.strokeStyle = pal.wall2; k.lineWidth = 4; for (let x = -320; x < 1500; x += 150) { k.beginPath(); k.moveTo(x, -300); k.lineTo(x + 6, 1250); k.stroke(); } }
    g.restore();
    // window with moving clouds (or night sky)
    const wx = 690, wy = 150, ww = 300, wh = 250;
    g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
    g.fillStyle = pal.sky || '#9fd3f0'; g.fillRect(wx, wy, ww, wh);
    if (pal.snow) { g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { const x = wx + ((hs(i) * ww + t * 20 * (0.5 + hs(i + 9))) % ww), y = wy + ((hs(i + 4) * wh + t * 60 * (0.6 + hs(i + 2))) % wh); g.beginPath(); g.arc(x, y, 3 + 3 * hs(i + 7), 0, 7); g.fill(); } }
    else for (let i = 0; i < 3; i++) { const x = wx - 120 + ((t * (14 + i * 6) + i * 140) % (ww + 240)), y = wy + 50 + i * 60; g.fillStyle = 'rgba(255,255,255,.9)';
      g.beginPath(); g.ellipse(x, y, 60, 20, 0, 0, 7); g.ellipse(x + 34, y - 12, 34, 22, 0, 0, 7); g.ellipse(x - 30, y - 6, 28, 16, 0, 0, 7); g.fill(); }
    g.restore();
    k.beginPath(); k.rect(wx, wy, ww, wh); k.lineWidth = 12; k.strokeStyle = INK; k.stroke();
    k.beginPath(); k.moveTo(wx + ww / 2, wy); k.lineTo(wx + ww / 2, wy + wh); k.moveTo(wx, wy + wh / 2); k.lineTo(wx + ww, wy + wh / 2); k.lineWidth = 8; k.stroke();
    // shelf with jars / gadgets on the left
    k.beginPath(); k.rect(40, 330, 360, 22); k.fillStyle = pal.wood; k.fill(); k.lineWidth = 7; k.stroke();
    const jarC = ['#7fb2c9', '#e3b55c', '#b6d39a', '#d98a8a'];
    for (let i = 0; i < 4; i++) { const x = 70 + i * 85, hh = 70 + 30 * hs(i + 2); k.beginPath(); k.roundRect(x, 330 - hh, 60, hh, 10); k.fillStyle = jarC[i]; k.fill(); k.lineWidth = 6; k.stroke(); }
    // pegboard tools swinging a little
    for (let i = 0; i < 3; i++) { const x = 90 + i * 120, y = 470, a = 0.06 * Math.sin(t * 1.3 + i * 2);
      g.save(); g.translate(x, y); g.rotate(a); const kk = sk(g, t, 30 + i); kk.lineWidth = 7; kk.strokeStyle = INK;
      if (i === 0) { kk.beginPath(); kk.roundRect(-10, 0, 20, 130, 8); kk.fillStyle = '#9aa3ad'; kk.fill(); kk.stroke(); kk.beginPath(); kk.arc(0, 140, 26, 0, 7); kk.fill(); kk.stroke(); }
      else if (i === 1) { kk.beginPath(); kk.roundRect(-14, 0, 28, 70, 8); kk.fillStyle = '#c8452f'; kk.fill(); kk.stroke(); kk.beginPath(); kk.rect(-5, 70, 10, 90); kk.fillStyle = '#cfd5dc'; kk.fill(); kk.stroke(); }
      else { kk.beginPath(); kk.moveTo(0, 0); kk.lineTo(0, 150); kk.lineWidth = 10; kk.stroke(); kk.beginPath(); kk.roundRect(-40, 130, 80, 40, 8); kk.fillStyle = '#8a5a32'; kk.fill(); kk.lineWidth = 7; kk.stroke(); }
      g.restore(); }
    // floor
    g.fillStyle = pal.floor; g.fillRect(-400, 1180, 1880, 1200);
    k.strokeStyle = 'rgba(0,0,0,.25)'; k.lineWidth = 4; for (let i = -6; i < 10; i++) { k.beginPath(); k.moveTo(540 + i * 60, 1180); k.lineTo(540 + i * 260, 2300); k.stroke(); }
  }
  // hanging lamp: swings; warm light cone
  function lamp(g, t, x, y0, col = 'rgba(255,214,140,') {
    const a = 0.09 * Math.sin(t * 1.1) + 0.03 * Math.sin(t * 2.7), L = 300;
    g.save(); g.translate(x, y0); g.rotate(a);
    const grd = g.createLinearGradient(0, L, 0, L + 1100); grd.addColorStop(0, col + '0.42)'); grd.addColorStop(1, col + '0)');
    g.fillStyle = grd; g.beginPath(); g.moveTo(-60, L + 40); g.lineTo(60, L + 40); g.lineTo(420, L + 1150); g.lineTo(-420, L + 1150); g.closePath(); g.fill();
    const k = sk(g, t, 41); k.strokeStyle = INK; k.lineWidth = 6; k.beginPath(); k.moveTo(0, -200); k.lineTo(0, L); k.stroke();
    k.beginPath(); k.moveTo(-90, L + 50); k.quadraticCurveTo(0, L - 60, 90, L + 50); k.closePath(); k.fillStyle = '#2f6f7e'; k.fill(); k.lineWidth = 8; k.stroke();
    g.fillStyle = '#fff4c8'; g.beginPath(); g.ellipse(0, L + 50, 34, 14, 0, 0, 7); g.fill();
    g.restore();
  }
  function dustMotes(g, t, n = 26, col = 'rgba(255,240,200,.55)') {
    g.fillStyle = col; for (let i = 0; i < n; i++) { const x = (hs(i) * 1200 + Math.sin(t * 0.4 + i) * 40 + t * 9 * (hs(i + 3) - 0.5)) % 1200 - 60, y = (hs(i + 20) * 1500 + t * 14 * (0.3 + hs(i + 5))) % 1500 + 150;
      g.beginPath(); g.arc(x, y, 2 + 3 * hs(i + 40), 0, 7); g.fill(); }
  }
  function bench(g, t, x0, x1, y, wood = '#b9834f') {
    const k = sk(g, t, 51); k.strokeStyle = INK; k.lineWidth = 9;
    for (const lx of [x0 + 40, x1 - 70]) { k.beginPath(); k.rect(lx, y + 40, 30, 380); k.fillStyle = '#7a5230'; k.fill(); k.stroke(); }
    k.beginPath(); k.rect(x0, y, x1 - x0, 48); k.fillStyle = wood; k.fill(); k.stroke();
    k.lineWidth = 3; k.beginPath(); k.moveTo(x0 + 20, y + 18); k.lineTo(x1 - 30, y + 20); k.stroke();
  }
  function stool(g, t, x, y) {   // y = seat top (Dave's feet)
    const k = sk(g, t, 61); k.strokeStyle = INK; k.lineWidth = 8;
    for (const d of [-70, 50]) { k.beginPath(); k.moveTo(x + d + 10, y + 20); k.lineTo(x + d * 1.25 + 10, y + 230); k.lineWidth = 16; k.stroke(); }
    k.lineWidth = 8; k.beginPath(); k.roundRect(x - 100, y, 200, 34, 12); k.fillStyle = '#c8452f'; k.fill(); k.stroke();
  }

  // ------------------------------------------------------------ screens
  // kind: 'radar' (round scope in a console), 'terminal' (beige CRT box), 'flat' (thin monitor). content(g, gx, gy, gw, gh)
  function monitor(g, t, x, y, w, h, o = {}) {
    const k = sk(g, t, 71); k.strokeStyle = INK; k.lineWidth = 10;
    const dent = o.dent || 0, shake = o.shake || 0;
    g.save(); g.translate(x + w / 2 + shake * Math.sin(t * 90), y + h); g.scale(1 + dent * 0.03, 1 - dent * 0.05); g.translate(-(x + w / 2), -(y + h));
    let gx, gy, gw, gh, round = 0;
    if (o.kind === 'radar') {
      k.beginPath(); k.roundRect(x - 30, y - 40, w + 60, h + 80, 24); k.fillStyle = o.body || '#7d8b80'; k.fill(); k.stroke();
      for (let i = 0; i < 6; i++) { const bx = x + 20 + i * (w - 40) / 5, on = hs(Math.floor(t * 3) + i) > 0.5; g.fillStyle = on ? '#ffd35a' : '#5c4a2a'; g.beginPath(); g.arc(bx, y + h + 10, 11, 0, 7); g.fill(); }
      const r = Math.min(w, h) / 2 - 30; gx = x + w / 2 - r; gy = y + h / 2 - r - 20; gw = gh = 2 * r; round = r;
    } else if (o.kind === 'terminal') {
      k.beginPath(); k.roundRect(x, y, w, h, 34); k.fillStyle = o.body || '#e8dcc0'; k.fill(); k.stroke();
      k.beginPath(); k.roundRect(x + w * 0.3, y + h, w * 0.4, 60, 10); k.fill(); k.stroke();
      gx = x + 50; gy = y + 50; gw = w - 100; gh = h - 110;
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 30, y + h - 46, w - 60, 10);
    } else {
      k.beginPath(); k.roundRect(x + w * 0.42, y + h, w * 0.16, 90, 6); k.fillStyle = '#9aa3ad'; k.fill(); k.stroke();
      k.beginPath(); k.roundRect(x + w * 0.25, y + h + 80, w * 0.5, 26, 10); k.fill(); k.stroke();
      k.beginPath(); k.roundRect(x, y, w, h, 20); k.fillStyle = o.body || '#20232b'; k.fill(); k.stroke();
      gx = x + 22; gy = y + 22; gw = w - 44; gh = h - 44;
    }
    g.save(); g.beginPath(); if (round) g.arc(gx + round, gy + round, round, 0, 7); else g.roundRect(gx, gy, gw, gh, 14); g.clip();
    g.fillStyle = o.glass || '#1b2a24'; g.fillRect(gx, gy, gw, gh);
    if (o.content) o.content(g, gx, gy, gw, gh);
    // glass reflection
    const rg = g.createLinearGradient(gx, gy, gx + gw, gy + gh); rg.addColorStop(0, 'rgba(255,255,255,.16)'); rg.addColorStop(0.45, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(255,255,255,.05)');
    g.fillStyle = rg; g.fillRect(gx, gy, gw, gh);
    if (o.crack) cracks(g, t, gx + gw * 0.42, gy + gh * 0.5, Math.max(gw, gh) * 0.7 * eo(o.crack));
    g.restore();
    k.beginPath(); if (round) k.arc(gx + round, gy + round, round, 0, 7); else k.roundRect(gx, gy, gw, gh, 14); k.lineWidth = 7; k.stroke();
    g.restore();
    return { gx, gy, gw, gh, cx: gx + gw / 2, cy: gy + gh / 2 };
  }
  function cracks(g, t, cx, cy, R) {
    g.save(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4;
    for (let i = 0; i < 11; i++) { let a = i / 11 * 6.28 + hs(i) * 0.4, x = cx, y = cy; g.beginPath(); g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { const d = R / 5 * (0.6 + hs(i * 7 + s) * 0.8); a += (hs(i * 3 + s) - 0.5) * 0.7; x += Math.cos(a) * d; y += Math.sin(a) * d; g.lineTo(x, y); } g.stroke(); }
    for (let r = 1; r <= 3; r++) { g.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * 6.28, rr = R * r * 0.18 * (0.8 + hs(i + r * 20) * 0.4); i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.stroke(); }
    g.restore();
  }
  // a phone held upright; content draws the glass. kind: 'pda' | 'phone' | 'thin'
  function phone(g, t, x, y, w, h, o = {}) {
    const k = sk(g, t, 81); k.strokeStyle = INK; k.lineWidth = 9;
    let gx, gy, gw, gh;
    if (o.kind === 'pda') {
      k.beginPath(); k.roundRect(x, y, w, h, 40); k.fillStyle = '#6d7480'; k.fill(); k.stroke();
      gx = x + 50; gy = y + 70; gw = w - 100; gh = h * 0.58;
      for (let i = 0; i < 4; i++) { k.beginPath(); k.arc(x + w * (0.2 + i * 0.2), y + h - 90, 26, 0, 7); k.fillStyle = '#3a3f48'; k.fill(); k.lineWidth = 6; k.stroke(); }
    } else {
      k.beginPath(); k.roundRect(x, y, w, h, o.kind === 'thin' ? 60 : 70); k.fillStyle = o.body || '#1c1e24'; k.fill(); k.stroke();
      gx = x + 26; gy = y + 70; gw = w - 52; gh = h - 140;
      g.fillStyle = '#444'; g.beginPath(); g.roundRect(x + w / 2 - 50, y + 30, 100, 14, 7); g.fill();
    }
    g.save(); g.beginPath(); g.roundRect(gx, gy, gw, gh, 18); g.clip();
    g.fillStyle = o.glass || '#0e1422'; g.fillRect(gx, gy, gw, gh); if (o.content) o.content(g, gx, gy, gw, gh);
    const rg = g.createLinearGradient(gx, gy, gx + gw, gy + gh); rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(gx, gy, gw, gh);
    g.restore();
    return { gx, gy, gw, gh, cx: gx + gw / 2, cy: gy + gh / 2 };
  }

  // ------------------------------------------------------------ the big finger (inserts). tip = fingertip point, ang = direction
  // the finger POINTS (radians, 0 = right, -PI/2 = up), press 0..1 squashes the pad. o.glove = red puffy glove
  function bigFinger(g, t, tip, ang, o = {}) {
    const k = sk(g, t, o.seed || 91), L = o.len || 520, Wd = o.w || 120, press = o.press || 0;
    const skin = o.skin || '#f3dcc0';
    g.save(); g.translate(tip[0], tip[1]); g.rotate(ang + Math.PI); // +x now runs from the tip back to the hand
    k.strokeStyle = INK; k.lineWidth = 9;
    if (o.glove) {
      k.beginPath(); k.ellipse(L * 0.95, 0, 300, 230, 0, 0, 7); k.fillStyle = '#d23b3b'; k.fill(); k.stroke();
      k.beginPath(); k.roundRect(-Wd * 0.2, -Wd * 0.75, L * 0.9, Wd * 1.5, Wd * 0.75); k.fill(); k.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(L * 0.2 + i * 70, -Wd * 0.3 + 18 * Math.sin(i), 9, 0, 7); g.fill(); }
      k.beginPath(); k.rect(L * 1.25, -260, 120, 520); k.fillStyle = '#f2f2f2'; k.fill(); k.stroke();
    } else {
      k.beginPath(); k.roundRect(L * 0.75, -260, L * 1.2, 380, 120); k.fillStyle = o.sleeve || '#e8762d'; k.fill(); k.stroke();   // sleeve
      k.beginPath(); k.roundRect(L * 0.55, -250, 360, 330, 110); k.fillStyle = skin; k.fill(); k.stroke();                       // fist
      for (let i = 0; i < 3; i++) { k.beginPath(); k.arc(L * 0.62 + i * 70, 72, 46, Math.PI * 0.1, Math.PI * 0.95); k.lineWidth = 6; k.stroke(); }
      const sq = 1 + press * 0.18;
      k.beginPath(); k.moveTo(L * 0.7, -Wd / 2); k.lineTo(Wd * 0.45, -Wd / 2 * sq); k.quadraticCurveTo(-Wd * 0.12 * (1 - press), -Wd / 2 * sq, -Wd * 0.12 * (1 - press * 0.6), 0);
      k.quadraticCurveTo(-Wd * 0.12 * (1 - press), Wd / 2 * sq, Wd * 0.45, Wd / 2 * sq); k.lineTo(L * 0.7, Wd / 2); k.fillStyle = skin; k.fill(); k.lineWidth = 9; k.stroke();
      k.beginPath(); k.roundRect(Wd * 0.08, -Wd * 0.42, Wd * 0.62, Wd * 0.5, 20); k.fillStyle = '#f9e9dc'; k.fill(); k.lineWidth = 5; k.stroke();   // nail
      k.lineWidth = 4; for (const d of [L * 0.3, L * 0.48]) { k.beginPath(); k.moveTo(d, -Wd * 0.3); k.quadraticCurveTo(d + 10, 0, d, Wd * 0.3); k.stroke(); }
    }
    g.restore();
  }
  // charge dots (little + signs) flowing along a path from a to b, u = 0..1 how far the stream has gone
  function chargeFlow(g, t, a, b, n, k = 1, col = '#5fd0ff') {
    for (let i = 0; i < n; i++) { const ph = ((t * 0.9 + i / n) % 1), u = ph; if (u > k) continue;
      const x = a[0] + (b[0] - a[0]) * u + Math.sin(t * 6 + i) * 14 * (1 - u), y = a[1] + (b[1] - a[1]) * u + Math.cos(t * 5 + i * 2) * 14 * (1 - u), r = 16 * (1 - 0.5 * u);
      g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#0b1220'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - r * 0.5, y); g.lineTo(x + r * 0.5, y); g.moveTo(x, y - r * 0.5); g.lineTo(x, y + r * 0.5); g.stroke(); }
  }
  // an electric field over a rect: shimmering cells + sparkles; k = coverage 0..1 (spreads from the edges in)
  function field(g, t, x, y, w, h, k, col = [95, 208, 255]) {
    if (k <= 0) return;
    const cs = 54;
    for (let i = 0; i < w / cs + 1; i++) for (let j = 0; j < h / cs + 1; j++) {
      const cx = x + i * cs, cy = y + j * cs, edge = Math.min(i * cs, w - i * cs, j * cs, h - j * cs) / (Math.min(w, h) / 2);
      if (edge > k * 1.05) continue;
      const a = 0.14 + 0.12 * Math.sin(t * 5 + i * 0.7 + j * 1.1);
      g.fillStyle = `rgba(${col},${a})`; g.fillRect(cx + 3, cy + 3, cs - 6, cs - 6);
    }
    g.save(); g.strokeStyle = `rgba(${col},.9)`; g.lineWidth = 3;
    for (let i = 0; i < 18; i++) { const sx = x + hs(i + Math.floor(t * 8) * 31) * w, sy = y + hs(i * 3 + Math.floor(t * 8) * 17) * h;
      const e = Math.min(sx - x, x + w - sx, sy - y, y + h - sy) / (Math.min(w, h) / 2); if (e > k) continue;
      g.beginPath(); g.moveTo(sx - 12, sy); g.lineTo(sx + 12, sy); g.moveTo(sx, sy - 12); g.lineTo(sx, sy + 12); g.stroke(); }
    g.restore();
  }

  // ------------------------------------------------------------ gags
  function bubble(g, t, x, y, w, h, tail, content) {
    const k = sk(g, t, 101); k.strokeStyle = INK; k.lineWidth = 8; k.fillStyle = '#fffdf6';
    for (let i = 0; i < 3; i++) { const u = (i + 1) / 4, r = 14 + i * 9; k.beginPath(); k.arc(tail[0] + (x + w / 2 - tail[0]) * u * 0.7, tail[1] + (y + h - tail[1]) * u * 0.9, r, 0, 7); k.fill(); k.stroke(); }
    k.beginPath(); const n = 12; for (let i = 0; i <= n; i++) { const a = i / n * 6.283, px = x + w / 2 + Math.cos(a) * w / 2, py = y + h / 2 + Math.sin(a) * h / 2;
      if (!i) k.moveTo(px, py); else { const am = (i - 0.5) / n * 6.283; k.quadraticCurveTo(x + w / 2 + Math.cos(am) * w * 0.62, y + h / 2 + Math.sin(am) * h * 0.62, px, py); } }
    k.closePath(); k.fill(); k.stroke();
    if (content) { g.save(); g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w * 0.45, h * 0.42, 0, 0, 7); g.clip(); content(g); g.restore(); }
  }
  function stamp(g, s, x, y, u, col = '#d6332b', rot = -0.18) {
    if (u <= 0) return; const sc = 2.4 - 1.4 * back(u * 1.6);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); g.globalAlpha = cl(u * 4);
    g.strokeStyle = col; g.lineWidth = 12; g.beginPath(); g.roundRect(-230, -80, 460, 160, 18); g.stroke();
    text(g, s, 0, 6, 110, col, { stroke: 0 }); g.restore();
  }
  function stars(g, t, x, y, k = 1) {
    for (let i = 0; i < 4; i++) { const a = t * 4 + i * 1.57, px = x + Math.cos(a) * 90, py = y + Math.sin(a) * 28;
      g.save(); g.translate(px, py); g.rotate(t * 6 + i); g.globalAlpha = k; g.fillStyle = '#ffd35a'; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath();
      for (let j = 0; j < 10; j++) { const r = j % 2 ? 9 : 22, aa = j / 10 * 6.283; j ? g.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : g.moveTo(Math.cos(aa) * r, Math.sin(aa) * r); } g.closePath(); g.fill(); g.stroke(); g.restore(); }
  }
  function puff(g, t, x, y, u, s = 1) {   // dust puff 0..1
    if (u <= 0 || u >= 1) return; g.save(); g.globalAlpha = 1 - u;
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283 + hs(i), d = (40 + 160 * eo(u)) * s * (0.7 + hs(i + 3) * 0.6), r = (30 + 40 * u) * s * (0.6 + hs(i + 8) * 0.6);
      g.fillStyle = i % 2 ? '#e9e1d2' : '#d3c8b4'; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - 30 * u * s, r, 0, 7); g.fill(); }
    g.restore();
  }
  function shards(g, t, x, y, u) {
    if (u <= 0 || u >= 1.6) return; g.save();
    for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (hs(i) - 0.5) * 2.6, v = 500 + 700 * hs(i + 5), tt = u;
      const px = x + Math.cos(a) * v * tt, py = y + Math.sin(a) * v * tt + 1400 * tt * tt;
      g.save(); g.translate(px, py); g.rotate(tt * 10 * (hs(i + 2) - 0.5)); g.fillStyle = 'rgba(190,230,255,.85)'; g.strokeStyle = INK; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-16, -10); g.lineTo(18, -16); g.lineTo(6, 20); g.closePath(); g.fill(); g.stroke(); g.restore(); }
    g.restore();
  }
  function fly(g, t, x, y, s = 1, landed = 0) {
    const k = sk(g, t, 111); g.save(); g.translate(x, y); g.scale(s, s);
    const wing = landed ? 0.2 * Math.sin(t * 8) : Math.sin(t * 90);
    k.strokeStyle = INK; k.lineWidth = 5; k.fillStyle = 'rgba(220,240,255,.75)';
    for (const sd of [-1, 1]) { k.beginPath(); k.ellipse(sd * 22, -26 - 10 * wing, 26, 13, sd * (0.5 + 0.5 * wing), 0, 7); k.fill(); k.stroke(); }
    k.beginPath(); k.ellipse(0, 0, 30, 22, 0, 0, 7); k.fillStyle = '#2b2f36'; k.fill(); k.stroke();
    k.beginPath(); k.arc(-26, -6, 16, 0, 7); k.fillStyle = '#b8323a'; k.fill(); k.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-31, -10, 5, 0, 7); g.fill();
    for (let i = 0; i < 3; i++) { k.beginPath(); k.moveTo(-10 + i * 12, 18); k.lineTo(-18 + i * 14, 34 + 3 * Math.sin(t * 20 + i)); k.lineWidth = 3; k.stroke(); }
    g.restore();
  }
  function cat(g, t, x, y, o = {}) {
    const k = sk(g, t, 121), br = Math.sin(t * 2.2) * 4; g.save(); g.translate(x, y);
    k.strokeStyle = INK; k.lineWidth = 7; k.fillStyle = '#f0a54a';
    k.beginPath(); k.moveTo(70, -20); k.quadraticCurveTo(170 + 20 * Math.sin(t * 2), -60, 150, -150 + 20 * Math.sin(t * 1.7)); k.lineWidth = 16; k.stroke(); k.lineWidth = 7;   // tail
    k.beginPath(); k.ellipse(0, -60 - br, 90, 70 + br, 0, 0, 7); k.fill(); k.stroke();
    k.beginPath(); k.arc(-40, -150 - br, 60, 0, 7); k.fill(); k.stroke();
    for (const sd of [-1, 1]) { k.beginPath(); k.moveTo(-40 + sd * 22, -196 - br); k.lineTo(-40 + sd * 50, -230 - br); k.lineTo(-40 + sd * 56, -176 - br); k.fill(); k.stroke(); }
    const blink = (t % 3.1) < 0.12;
    g.fillStyle = INK; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(-40 + sd * 22, -158 - br, 8, blink ? 1.5 : 12, 0, 0, 7); g.fill(); }
    if (o.pen) { g.save(); g.translate(-40, -122 - br); g.rotate(-0.15); g.fillStyle = '#e3e6ea'; g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.roundRect(-90, -7, 180, 14, 7); g.fill(); g.stroke(); g.restore(); }
    else { g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(-50, -126 - br); g.quadraticCurveTo(-40, -118 - br, -30, -126 - br); g.stroke(); }
    g.restore();
  }
  function snow(g, t, k = 1, n = 90) {
    if (k <= 0) return; g.save(); g.globalAlpha = k; g.fillStyle = '#fff';
    for (let i = 0; i < n; i++) { const sp = 90 + 120 * hs(i + 3), x = (hs(i) * 1300 + Math.sin(t * 1.3 + i) * 30) % 1300 - 100, y = (hs(i + 9) * 2100 + t * sp) % 2100 - 100, r = 4 + 7 * hs(i + 17);
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.restore();
  }
  function hammer(g, t, hand, ang, s = 1) {
    const k = sk(g, t, 131); g.save(); g.translate(hand[0], hand[1]); g.rotate(ang); g.scale(s, s); k.strokeStyle = INK; k.lineWidth = 8;
    k.beginPath(); k.roundRect(-20, -14, 260, 28, 12); k.fillStyle = '#a0683a'; k.fill(); k.stroke();
    k.beginPath(); k.roundRect(200, -70, 70, 140, 12); k.fillStyle = '#8f98a3'; k.fill(); k.stroke();
    g.restore();
  }
  function glove(g, t, p, s = 1) { const k = sk(g, t, 141); k.strokeStyle = INK; k.lineWidth = 6; k.fillStyle = '#d23b3b'; k.beginPath(); k.arc(p[0], p[1], 40 * s, 0, 7); k.fill(); k.stroke();
    k.beginPath(); k.ellipse(p[0] - 30 * s, p[1] - 14 * s, 16 * s, 24 * s, -0.5, 0, 7); k.fill(); k.stroke(); }
  // motion lines / shake marks around a point
  function buzzLines(g, t, x, y, R, k = 1) {
    if (k <= 0) return; g.save(); g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.globalAlpha = k;
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + 0.3, j = Math.sin(t * 40 + i) * 8; g.beginPath(); g.moveTo(x + Math.cos(a) * (R + j), y + Math.sin(a) * (R + j)); g.lineTo(x + Math.cos(a) * (R + 50 + j), y + Math.sin(a) * (R + 50 + j)); g.stroke(); }
    g.restore();
  }
  // background for close-ups: radial gradient + drifting soft dots + a faint grid
  function insertBg(g, t, c0, c1) {
    const rg = g.createRadialGradient(540, 820, 100, 540, 900, 1300); rg.addColorStop(0, c0); rg.addColorStop(1, c1);
    g.fillStyle = rg; g.fillRect(-400, -400, 1880, 2700);
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2; const off = (t * 18) % 90;
    for (let x = -400 + off; x < 1500; x += 90) { g.beginPath(); g.moveTo(x, -400); g.lineTo(x, 2300); g.stroke(); }
    for (let y = -400 + off; y < 2300; y += 90) { g.beginPath(); g.moveTo(-400, y); g.lineTo(1500, y); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 14; i++) { const x = (hs(i) * 1100 + t * 20 * (hs(i + 1) - 0.5)) % 1100, y = (hs(i + 30) * 1900 - t * 25 * hs(i + 2)) % 1900 + 0; g.beginPath(); g.arc(x, y < 0 ? y + 1900 : y, 20 + 60 * hs(i + 4), 0, 7); g.fill(); }
  }
  // a handwritten label with an arrow
  function note(g, t, s, x, y, ax, ay, u = 1, col = '#ffd35a') {
    if (u <= 0) return; g.save(); g.globalAlpha = cl(u * 3);
    const k = sk(g, t, 151); k.strokeStyle = col; k.lineWidth = 7; k.beginPath(); k.moveTo(x, y + 30); k.quadraticCurveTo((x + ax) / 2 + 40, (y + ay) / 2, ax, ay); k.stroke();
    const a = Math.atan2(ay - ((y + ay) / 2), ax - ((x + ax) / 2 + 40)); k.beginPath(); k.moveTo(ax - Math.cos(a - 0.5) * 30, ay - Math.sin(a - 0.5) * 30); k.lineTo(ax, ay); k.lineTo(ax - Math.cos(a + 0.5) * 30, ay - Math.sin(a + 0.5) * 30); k.stroke();
    text(g, s, x, y, 64, col, { font: HAND, weight: 700, scale: back(u * 2) }); g.restore();
  }

  g0.P = { INK, cl, sm, eo, back, hs, bump, text, room, lamp, dustMotes, bench, stool, monitor, cracks, phone, bigFinger, chargeFlow, field,
    bubble, stamp, stars, puff, shards, fly, cat, snow, hammer, glove, buzzLines, insertBg, note, FONT, HAND };
})(window);
