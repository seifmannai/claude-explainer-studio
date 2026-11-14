// kit/fx/oldfilm.js - "old times" look and a time-travel transition, for flashbacks to real history. Canvas 2D.
//   OldFilm.apply(g, src, f, k, W, H)        draws canvas src onto g as old film: sepia, flicker, gate weave, grain,
//                                             scratches, dust, hair, burnt vignette. k = amount 0..1, f = frame index.
//   OldFilm.rewind(g, from, to, u, f, W, H, years, dir)  transition 0..1 between two finished pictures:
//        zoom-spin tunnel, colour drains, tracking tear, a clock spinning backwards (dir=-1) or forwards (dir=1),
//        a year counter (e.g. [2026, 1854]), white flash at the swap. Never a still frame: everything moves.
(function (g0) {
  const h = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
  let GR = null;
  const grains = () => GR || (GR = [0, 1, 2, 3].map(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const d = x.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 230; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); return c; }));

  function apply(g, src, f, k, W, H) {
    const S = W / 1080;
    const fl = 1 + (h(f * 1.7) - 0.5) * 0.12 * k;                                   // flicker
    const jump = h(Math.floor(f / 9) * 3.3) > 0.94 ? 14 : 0;                          // rare frame jump
    const wx = (h(f * 3.1) - 0.5) * 5 * S * k, wy = ((h(f * 5.3) - 0.5) * 7 + jump) * S * k;   // gate weave
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#1a120a'; g.fillRect(0, 0, W, H);
    g.filter = `sepia(${0.9 * k}) saturate(${1 - 0.3 * k}) contrast(${1 + 0.1 * k}) brightness(${fl})`;
    g.drawImage(src, wx - 4 * S * k, wy - 4 * S * k, W + 8 * S * k, H + 8 * S * k); g.filter = 'none';
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.28 * k;                // grain
    const pat = g.createPattern(grains()[f % 4], 'repeat'); g.translate(-h(f) * 256, -h(f + 9) * 256); g.scale(S * 1.4, S * 1.4); g.fillStyle = pat; g.fillRect(0, 0, W / S + 512, H / S + 512);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // scratches: live a few frames each, wander a little
    for (let i = 0; i < 3; i++) { const life = Math.floor(f / 6) + i * 17; if (h(life * 1.9) > 0.55 * (2 - k)) continue;
      const x = (h(life * 7.7) * 0.9 + 0.05) * W + (h(f * 2.1 + i) - 0.5) * 6 * S, light = h(life * 4.1) > 0.4;
      g.strokeStyle = light ? `rgba(255,244,220,${0.35 * k})` : `rgba(30,20,10,${0.4 * k})`; g.lineWidth = (1 + h(life) * 1.6) * S;
      g.beginPath(); g.moveTo(x, h(life * 3) * H * 0.3); g.bezierCurveTo(x + 4 * S, H * 0.4, x - 5 * S, H * 0.7, x + 2 * S, H * (0.7 + 0.3 * h(life * 5))); g.stroke(); }
    // dust specks + a hair now and then (one frame each, like real dirt on a print)
    const n = Math.floor(h(f * 2.3) * 5 * k);
    for (let i = 0; i < n; i++) { const x = h(f * 9.1 + i) * W, y = h(f * 4.7 + i * 3) * H, r = (1.5 + h(f + i * 7) * 5) * S;
      g.fillStyle = h(f * 1.3 + i) > 0.3 ? `rgba(25,16,8,${0.7 * k})` : `rgba(255,248,230,${0.6 * k})`;
      g.beginPath(); g.ellipse(x, y, r, r * (0.5 + h(i + f) * 0.6), h(f + i) * 3, 0, 7); g.fill(); }
    if (h(f * 0.77) > 0.9) { const x = h(f * 3.9) * W, y = h(f * 6.1) * H; g.strokeStyle = `rgba(20,14,8,${0.6 * k})`; g.lineWidth = 1.6 * S;
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40 * S, y - 30 * S, x + 10 * S, y + 50 * S, x + 60 * S, y + 40 * S); g.stroke(); }
    // burnt vignette
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.72);
    v.addColorStop(0, 'rgba(40,24,8,0)'); v.addColorStop(1, `rgba(40,24,8,${0.75 * k})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.restore();
  }

  function clock(g, cx, cy, R, ang, a) {
    g.save(); g.globalAlpha = a; g.translate(cx, cy);
    g.fillStyle = 'rgba(245,232,200,0.92)'; g.strokeStyle = '#2a1c10'; g.lineWidth = R * 0.07;
    g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill(); g.stroke();
    g.lineWidth = R * 0.035; for (let i = 0; i < 12; i++) { const q = i / 12 * Math.PI * 2; g.beginPath(); g.moveTo(Math.cos(q) * R * 0.78, Math.sin(q) * R * 0.78); g.lineTo(Math.cos(q) * R * 0.9, Math.sin(q) * R * 0.9); g.stroke(); }
    g.lineCap = 'round'; g.lineWidth = R * 0.07; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ang / 12) * R * 0.5, -Math.cos(ang / 12) * R * 0.5); g.stroke();
    g.lineWidth = R * 0.045; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ang) * R * 0.75, -Math.cos(ang) * R * 0.75); g.stroke();
    g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(0, 0, R * 0.06, 0, 7); g.fill(); g.restore();
  }

  function rewind(g, from, to, u, f, W, H, years = [2026, 1854], dir = -1) {
    const S = W / 1080, e = sm(u / 0.62), swap = sm((u - 0.5) / 0.2);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#120c06'; g.fillRect(0, 0, W, H);
    const img = swap < 1 ? from : to;
    const layer = (src, alpha, ee) => {   // zoom-spin tunnel: stacked copies, each a bit bigger and more turned
      for (let i = 4; i >= 0; i--) { const sc = 1 + ee * (0.05 + i * 0.07), rot = dir * ee * (0.06 + i * 0.05);
        g.save(); g.globalAlpha = alpha * (i === 0 ? 1 : 0.22 * ee); g.translate(W / 2, H / 2); g.rotate(rot); g.scale(sc, sc);
        g.filter = `sepia(${dir < 0 ? ee : 1 - ee}) brightness(${1 + 0.25 * ee})`; g.drawImage(src, -W / 2, -H / 2, W, H); g.filter = 'none'; g.restore(); } };
    layer(from, 1 - swap, e);
    if (swap > 0) layer(to, swap, 1 - sm((u - 0.6) / 0.4));
    // tracking tear: horizontal bands slide sideways
    for (let b = 0; b < 4; b++) { const y = ((h(b * 3.3) + u * (1.5 + b)) % 1) * H, bh = (20 + 50 * h(b)) * S, dx = (h(f + b) - 0.5) * 120 * S * Math.sin(Math.PI * u);
      g.drawImage(g.canvas, 0, y, W, bh, dx, y, W, bh); }
    // white flash at the swap
    const fl = Math.exp(-Math.pow((u - 0.58) / 0.07, 2)); if (fl > 0.01) { g.fillStyle = `rgba(255,246,225,${0.85 * fl})`; g.fillRect(0, 0, W, H); }
    // clock + year counter (fade in, spin, fade out)
    const a = sm(u / 0.15) * (1 - sm((u - 0.78) / 0.2));
    const ang = dir * Math.pow(u, 1.6) * Math.PI * 2 * 9;
    clock(g, W / 2, H * 0.42, 190 * S * (0.9 + 0.15 * Math.sin(Math.PI * u)), ang, a);
    const yr = Math.round(years[0] + (years[1] - years[0]) * sm((u - 0.08) / 0.7));
    g.globalAlpha = a; g.font = `900 ${150 * S}px Georgia, 'Times New Roman', serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 16 * S; g.strokeStyle = '#2a1c10'; g.strokeText(String(yr), W / 2, H * 0.62); g.fillStyle = '#f3e3c3'; g.fillText(String(yr), W / 2, H * 0.62);
    g.restore();
  }
  g0.OldFilm = { apply, rewind };
})(typeof window !== 'undefined' ? window : globalThis);
