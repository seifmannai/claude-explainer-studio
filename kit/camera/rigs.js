// kit/camera/rigs.js - camera moves for the studio renderers. A camera is {p:[x,y,z], q:[x,y,z] (look-at), f: fov degrees, roll}.
// All moves take u = 0..1 (progress through the shot) or t (seconds) and return a new camera. See skills/ours/cinematic-camera.
(function (g) {
  const cl = (x) => Math.min(1, Math.max(0, x));
  const ease = { smooth: (x) => { x = cl(x); return x * x * x * (x * (6 * x - 15) + 10); }, inOut: (x) => { x = cl(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    out: (x) => 1 - Math.pow(1 - cl(x), 3), over: (x) => { x = cl(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); } };
  const L = (a, b, u) => a + (b - a) * u, LV = (a, b, u) => a.map((v, i) => L(v, b[i], u));
  const cam = (p, q, f = 40, roll = 0, base = null) => Object.assign({}, base || {}, { p, q, f, roll });   // base keeps extra fields (aperture a)
  const Cam = {
    ease, cam,
    // circle around `c` at radius r and height h above c, angle from a0 to a1 (radians), eased
    orbit(c, r, h, a0, a1, u, f = 40, e = ease.smooth) { const a = L(a0, a1, e(u)); return cam([c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r], c.slice(), f); },
    // rise from y0 to y1 while looking at a target that rises from ty0 to ty1 (scale reveals)
    crane(c, r, ang, y0, y1, ty0, ty1, u, f = 40, e = ease.inOut) { const k = e(u); return cam([c[0] + Math.sin(ang) * r, L(y0, y1, k), c[2] + Math.cos(ang) * r], [c[0], L(ty0, ty1, k), c[2]], f); },
    // straight move between two cameras
    dolly(a, b, u, e = ease.inOut) { const k = e(u); return cam(LV(a.p, b.p, k), LV(a.q, b.q, k), L(a.f, b.f, k), L(a.roll || 0, b.roll || 0, k)); },
    // move the camera along its view line by `amount` (0.2 = 20 % closer)
    push(c, amount, u, e = ease.smooth) { const k = amount * e(u); return cam(LV(c.p, c.q, k), c.q.slice(), c.f, c.roll, c); },
    // follow a moving target with lag: pass target(t) as a function; the camera keeps `off` from where the target WAS `lag` s ago
    follow(target, off, t, lag = 0.25, f = 40) { const a = target(t - lag), b = target(t); return cam([a[0] + off[0], a[1] + off[1], a[2] + off[2]], b, f); },
    // whip: from camera A to B in u (use over 6-8 frames); look-at swings, slight overshoot on arrival
    whip(a, b, u) { const k = ease.over(u); return cam(LV(a.p, b.p, ease.inOut(u)), LV(a.q, b.q, k), L(a.f, b.f, ease.inOut(u)), Math.sin(Math.PI * cl(u)) * 0.08); },
    // dolly zoom: keep the subject size while the fov widens and the camera moves in (one per film)
    dollyZoom(c, f0, f1, u, e = ease.inOut) { const k = e(u), f = L(f0, f1, k), d0 = Math.hypot(...c.p.map((v, i) => v - c.q[i])),
      d = d0 * Math.tan(f0 * Math.PI / 360) / Math.tan(f * Math.PI / 360), dir = c.p.map((v, i) => (v - c.q[i]) / d0); return cam(c.q.map((v, i) => v + dir[i] * d), c.q.slice(), f, c.roll, c); },
    // always-on breath + optional handheld; amp in degrees-ish (0.15 calm, 0.8 panic)
    handheld(c, t, amp = 0.15, seed = 0) { const n = (k) => Math.sin(t * (1.3 + k) + seed * 3.1 + k) * 0.6 + Math.sin(t * (3.7 + k * 1.7) + seed + k * 2) * 0.4;
      const d = Math.hypot(...c.p.map((v, i) => v - c.q[i])) * amp * 0.0175; return cam(c.p.slice(), [c.q[0] + n(0) * d, c.q[1] + n(1) * d, c.q[2] + n(2) * d], c.f, (c.roll || 0) + n(3) * amp * 0.004, c); },
    // impact kick at time t0: decays over ~7 frames
    kick(c, t, t0, amp = 0.05) { if (t < t0 || t > t0 + 0.6) return c; const k = Math.exp(-(t - t0) / 0.09) * Math.sin((t - t0) * 70) * amp; return cam([c.p[0], c.p[1] + k, c.p[2]], [c.q[0], c.q[1] + k * 1.5, c.q[2]], c.f, c.roll, c); },
    // a shot list: [{a: start s, b: end s, cam: (u, t) => camera, blend: frames to blend from the previous shot (0 = hard cut)}]
    shots(list, t, fps = 24) {
      let i = list.findIndex((s) => t >= s.a && t < s.b); if (i < 0) i = t < list[0].a ? 0 : list.length - 1;
      const s = list[i], c = s.cam(cl((t - s.a) / (s.b - s.a)), t);
      if (s.blend && i > 0 && t < s.a + s.blend / fps) { const p = list[i - 1], cp = p.cam(1, t); return Cam.dolly(cp, c, (t - s.a) / (s.blend / fps)); }
      return c;
    },
  };
  g.Cam = Cam;
})(typeof window !== 'undefined' ? window : globalThis);
