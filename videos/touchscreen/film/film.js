// film.js - "Dave builds a touchscreen" (How It Really Works, video 4). VideoHub project contract:
//   window.renderOut(t) draws second t on the 1080x1920 canvas #c, synchronously, as a pure function of t;
//   window.READY = true once loaded; window.VH_SCENES = the shots (VideoHub timeline).
// Parts: kit/ (Stick character, OldFilm, Words), words-data.js (voice word times), cues.js (events on words),
// props.js (sets/props), shots.js (every shot). This file: eras, time-travel transitions, old film, badges, captions.
(function () {
  'use strict';
  const W = 1080, H = 1920, FPS = 30;
  const cv = document.getElementById('c'), g = cv.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const A = mk(), B = mk(), TMP = mk(), ga = A.getContext('2d'), gb = B.getContext('2d'), gt = TMP.getContext('2d');
  const { cl, eo, back, hs, text } = P;
  const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const seg = (t, a, b) => cl((t - a) / (b - a));

  const WORDS = window.WORDS, C = makeCues(WORDS), DUR = C.DUR;
  const SHOTS = Shots.build(C);
  const ERAS = [
    { name: 'Now: Dave\'s workshop' }, { name: '1965: radar room', year: '1965', film: 0.85 }, { name: '1977: pressure screen', year: '1977' },
    { name: '1983: light beams', year: '1983' }, { name: '1996: the pen', year: '1996' }, { name: '2007: multi-touch', year: '2007' },
    { name: '2009: grease', year: '2009' }, { name: 'Today', year: 'TODAY' },
  ];
  const TR = [
    { a: C.rw0, b: C.rw1, kind: 'rewind', years: [2026, 1965], dir: -1 },
    { a: C.ff1a, b: C.ff1b, kind: 'rewind', years: [1965, 1977], dir: 1 },
    { a: C.wp1a, b: C.wp1b, kind: 'whip', years: [1977, 1983] },
    { a: C.wp2a, b: C.wp2b, kind: 'whip', years: [1983, 1996] },
    { a: C.wp3a, b: C.wp3b, kind: 'whip', years: [1996, 2007] },
    { a: C.wp4a, b: C.wp4b, kind: 'whip', years: [2007, 2009] },
    { a: C.wp5a, b: C.wp5b, kind: 'whip', years: [2009, 2026] },
    { a: C.loopA, b: DUR + 1e-6, kind: 'whip', years: null, loop: true },   // the end whips back into the first frame: a seamless loop
  ];
  const eraStart = ERAS.map((e, i) => (i === 0 ? 0 : TR[i - 1].b));
  window.VH_SCENES = SHOTS.map((s, i) => ({ name: s.name, t0: +s.t0.toFixed(3), t1: +((SHOTS[i + 1] ? SHOTS[i + 1].t0 : DUR)).toFixed(3) }));

  const shotAt = (t) => { let s = SHOTS[0]; for (const x of SHOTS) if (x.t0 <= t) s = x; return s; };

  // year badge: pops in when an era starts, wobbles while it stays (never still)
  function badge(c, t, era, i) {
    if (!era.year) return; const u = seg(t, eraStart[i], eraStart[i] + 0.35); if (u <= 0) return;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(190, 180); c.rotate(-0.08 + 0.025 * Math.sin(t * 2.1)); const s = back(u) * (1 + 0.02 * Math.sin(t * 3)); c.scale(s, s);
    const k = Stick.sketchCtx(c, t, 900 + i); k.strokeStyle = '#16161c'; k.lineWidth = 9; k.beginPath(); k.roundRect(-150, -62, 300, 124, 22); k.fillStyle = era.film ? '#efe1bf' : '#ffb547'; k.fill(); k.stroke();
    text(c, era.year, 0, 6, era.year.length > 4 ? 76 : 92, '#16161c', { stroke: 0 }); c.restore();
  }
  // one finished frame of a shot (set + characters + era look + badge) into context c
  function drawShot(c, sh, t) {
    const era = ERAS[sh.era], f = Math.round(t * FPS);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none';
    const film = sh.film ?? era.film;
    if (film) { gt.setTransform(1, 0, 0, 1, 0, 0); gt.fillStyle = '#000'; gt.fillRect(0, 0, W, H); sh.fn(gt, t); gt.setTransform(1, 0, 0, 1, 0, 0); OldFilm.apply(c, TMP, f, film, W, H); }
    else { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); sh.fn(c, t); }
    if (sh.over) { c.save(); sh.over(c, t); c.restore(); }   // drawn over the old film: the science keeps its colour
    c.setTransform(1, 0, 0, 1, 0, 0); badge(c, t, era, sh.era);
  }
  // fast-forward whip: both pictures slide with motion blur, speed lines, a year counter and a flash at the swap
  function whip(c, a, b, u, years, t) {
    const e = eio(u), off = e * W * 1.15, bl = Math.round(36 * Math.sin(Math.PI * u));
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#0b1220'; c.fillRect(0, 0, W, H);
    c.filter = bl > 0 ? `blur(${bl}px)` : 'none'; c.drawImage(a, -off, 0); c.drawImage(b, W * 1.15 - off, 0); c.filter = 'none';
    const s = Math.sin(Math.PI * u);
    c.strokeStyle = `rgba(255,255,255,${0.7 * s})`; for (let i = 0; i < 26; i++) { const y = hs(i) * H, x = ((hs(i + 5) * W * 2 - u * W * 3) % (W * 1.5)) + W * 0.2, L = 200 + 500 * hs(i + 9);
      c.lineWidth = 3 + 8 * hs(i + 2); c.beginPath(); c.moveTo(x, y); c.lineTo(x + L, y); c.stroke(); }
    const fl = Math.exp(-Math.pow((u - 0.5) / 0.08, 2)); if (fl > 0.01) { c.fillStyle = `rgba(255,255,255,${0.6 * fl})`; c.fillRect(0, 0, W, H); }
    if (!years) return;
    const yr = Math.round(years[0] + (years[1] - years[0]) * eio(seg(u, 0.1, 0.8)));
    c.save(); c.globalAlpha = cl(s * 1.6); c.translate(W / 2, H * 0.42); c.rotate(-0.06); const sc = 0.8 + 0.4 * s; c.scale(sc, sc);
    text(c, String(yr), 0, 0, 220, '#ffb547', { lw: 30 }); text(c, '▶▶', 0, 190, 110, '#fff', { lw: 22 }); c.restore();
  }

  // captions (STYLE.md): 3 words max, active word orange, y = 1400
  const CHUNKS = [];
  for (const s of WORDS.sentences) { const ws = WORDS.words.filter((w) => w.s === s.s); for (let i = 0; i < ws.length; i += 3) CHUNKS.push({ s: s.s, ws: ws.slice(i, i + 3), t0: ws[i].t, end: s.end }); }
  for (let i = 0; i < CHUNKS.length; i++) CHUNKS[i].t1 = CHUNKS[i + 1] && CHUNKS[i + 1].s === CHUNKS[i].s ? CHUNKS[i + 1].t0 : CHUNKS[i].end + 0.2;
  function captions(c, t) {
    const ch = CHUNKS.find((k) => t >= k.t0 - 0.05 && t < k.t1); if (!ch) return;
    // captions sit at y=1400 (STYLE.md) unless a character's head is there: then they drop to 1640
    const heads = window.__HEADS || [], y0 = heads.some(([a, b]) => b > 1320 && a < 1480) ? 1640 : 1400;
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const size = 86, font = `900 ${size}px "Inter Display", "Inter", "Segoe UI Black", "Arial Black", sans-serif`; c.font = font;
    const parts = ch.ws.map((w) => w.w.replace(/[^\w'’-]/g, '').toUpperCase()), sp = size * 0.3, widths = parts.map((p) => c.measureText(p).width);
    let total = widths.reduce((a, b) => a + b, 0) + sp * (parts.length - 1); const sc = Math.min(1, 980 / total);
    const pop = back(seg(t, ch.t0 - 0.05, ch.t0 + 0.12));
    c.translate(W / 2, y0); c.scale(sc * (0.85 + 0.15 * pop), sc * (0.85 + 0.15 * pop)); c.rotate(-0.02 + 0.01 * Math.sin(t * 2));
    let x = -total / 2; c.textBaseline = 'middle'; c.textAlign = 'left'; c.lineJoin = 'round';
    parts.forEach((p, i) => { const w = ch.ws[i], act = t >= w.t - 0.03 && (t < w.end + 0.05 || i === parts.length - 1), lift = act ? -8 : 0;
      c.lineWidth = 18; c.strokeStyle = '#0b1220'; c.strokeText(p, x, lift); c.fillStyle = act ? '#ffb547' : '#f2f6fa'; c.fillText(p, x, lift); x += widths[i] + sp; });
    c.restore();
  }

  window.renderOut = function (t) {
    t = cl(+t || 0, 0, DUR);
    const tr = TR.find((r) => t >= r.a && t < r.b);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    window.__HEADS = [];
    if (tr) {
      drawShot(ga, shotAt(tr.a - 1e-3), t); if (tr.loop) drawShot(gb, SHOTS[0], 0); else drawShot(gb, shotAt(tr.b), t);
      window.__HEADS = [];
      const u = (t - tr.a) / (tr.b - tr.a), f = Math.round(t * FPS);
      if (tr.kind === 'rewind') OldFilm.rewind(g, A, B, u, f, W, H, tr.years, tr.dir); else whip(g, A, B, u, tr.years, t);
    } else drawShot(g, shotAt(t), t);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    captions(g, t);
  };

  (async () => {
    try { await document.fonts.ready; } catch (e) { /* no fonts API: fine */ }
    window.renderOut(0);
    window.READY = true;
  })();
})();
