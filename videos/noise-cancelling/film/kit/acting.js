// kit/char2d/acting.js - the acting + camera helpers for 2D Stick films (from video 4, touchscreen; see
// skills/ours/character-acting). Classic script: window.Acting. Needs kit/char2d/stick.js and cast/dave.js.
//   Acting.camera(g, t, keys)   keys [[t, cx, cy, zoom, rot]] eased, plus a constant handheld drift and Acting.KICK hits
//   Acting.acting(keys, t, X, Y, s, base?, calm?)  keys [t, poseName, over, frames]; over: at/atL (hand ON a screen point),
//                                lookAt (eyes + head turn), any pose field. base = a costume for non-Dave characters.
//   Acting.drawChar(g, t, x, y, s, pose, walker?)  draws and records the head band in window.__HEADS (captions avoid it)
//   Acting.walker(t, [[t, x], ...])  walk cycle between marks (characters never slide)
(function (g0) {
  const W = 1080, H = 1920, cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, k) => a + (b - a) * k;
  const sm = (x) => { x = cl(x); return x * x * (3 - 2 * x); };
  const eio = (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const A = { KICK: [], shake: 1 };
  A.camera = function (g, t, keys, hand = 1) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    const a = keys[i], b = keys[i + 1] || a, u = b === a ? 0 : eio((t - a[0]) / (b[0] - a[0]));
    const cx = lerp(a[1], b[1], u), cy = lerp(a[2], b[2], u), z = lerp(a[3], b[3], u), r = lerp(a[4] || 0, b[4] || 0, u);
    hand *= A.shake;
    let hx = hand * (9 * Math.sin(t * 0.9) + 5 * Math.sin(t * 2.3 + 1)), hy = hand * (7 * Math.sin(t * 0.7 + 2) + 4 * Math.sin(t * 1.9)), hr = hand * 0.006 * Math.sin(t * 0.5 + 1);
    for (const [kt, amp] of A.KICK) { const d = t - kt; if (d >= 0 && d < 0.6) { const e = Math.exp(-d * 9) * amp; hx += e * 40 * Math.sin(d * 70); hy += e * 30 * Math.cos(d * 55); hr += e * 0.03 * Math.sin(d * 60); } }
    g.setTransform(1, 0, 0, 1, 0, 0); g.translate(W / 2 + hx, H / 2 + hy); g.rotate(r + hr); g.scale(z, z); g.translate(-cx, -cy);
    return { cx, cy, z };
  };
  A.headOf = (X, Y, s, p) => [X + (p.hip[0] - p.lean * 150 - p.tilt * 40) * s, Y - (200 + p.hip[1] + 150 + 100 + (p.bob || 0)) * s];
  function resolve(k, X, Y, s, base) {
    const over = Object.assign({}, k[2] || {}), at = over.at, atL = over.atL, lookAt = over.lookAt;
    delete over.at; delete over.atL; delete over.lookAt;
    const p = base ? Stick.pose(k[1], Object.assign({}, base, over)) : Dave.pose(k[1], over);
    if (at) p.handR = Stick.reach(X, Y, s, p, at[0], at[1], 'R').hand;
    if (atL) p.handL = Stick.reach(X, Y, s, p, atL[0], atL[1], 'L').hand;
    if (lookAt) { const h = A.headOf(X, Y, s, p), dx = lookAt[0] - h[0], dy = lookAt[1] - h[1];
      p.look = [cl(dx / 260, -1, 1) * 0.95, cl(dy / 260, -1, 1) * 0.8]; p.turn = cl(dx / 700, -0.45, 0.45); }
    return p;
  }
  A.acting = function (keys, t, X, Y, s, base, calm) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1][0] <= t) i++;
    let p = resolve(keys[i], X, Y, s, base);
    if (i > 0 && t >= keys[i][0]) p = Stick.act(resolve(keys[i - 1], X, Y, s, base), p, t - keys[i][0], keys[i][3] || 9);
    return Stick.alive(p, t, (base && base.seed) || 3, calm || Dave.CALM);
  };
  g0.__HEADS = [];
  A.drawChar = function (g, t, x, y, s, p, w) {
    if (w && w.k > 0) p = Stick.walk(p, w.ph, w.dir, w.k);
    Stick.draw(g, x, y, s, p, t);
    const h = A.headOf(x, y, s, p), m = g.getTransform(), sy = m.b * h[0] + m.d * h[1] + m.f, r = 92 * s * Math.hypot(m.c, m.d);
    g0.__HEADS.push([sy - r, sy + r]); return p;
  };
  A.handAt = (x, y, s, p, side = 'R') => { const h = side === 'R' ? p.handR : p.handL; return [x + h[0] * s, y - h[1] * s]; };
  A.walker = function (t, path) {
    let i = 0; while (i + 1 < path.length && path[i + 1][0] <= t) i++;
    const a = path[i], b = path[i + 1];
    if (!b || t < a[0]) return { x: a[1], ph: 0, k: 0, dir: 0 };
    const dur = Math.max(0.35, Math.abs(b[1] - a[1]) / 520), u = (t - b[0] + dur) / dur;
    if (u <= 0) return { x: a[1], ph: 0, k: 0, dir: 0 };
    if (u >= 1) return { x: b[1], ph: 0, k: 0, dir: 0 };
    return { x: lerp(a[1], b[1], sm(u)), ph: u * dur * 2.6, k: Math.min(1, Math.sin(Math.PI * u) * 2), dir: Math.sign(b[1] - a[1]) };
  };
  g0.Acting = A;
})(window);
