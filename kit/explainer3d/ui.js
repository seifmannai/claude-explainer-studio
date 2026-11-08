// UI layer drawn on the 2D canvas over the 3D frame (crisp text at any render scale, saved in every frame).
// Coordinates are 1080x1920. Shorts safe zone: keep text inside x 60..900 and y 240..1500
// (the platform puts the title/channel at the bottom and the like/comment buttons on the right).
import { PAL, clamp, easeOut, smooth, ramp, lerp } from './core.js';

const F = { body: 'Inter, sans-serif', disp: '"Inter Display", Inter, sans-serif' };
const font = (size, weight = 800, fam = 'body') => `${weight} ${size}px ${F[fam]}`;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

export function createUI(st) {
  const g = st.ctx;
  const ui = {
    g, PAL,
    /** text with optional outline; returns width */
    text(s, x, y, { size = 48, weight = 800, fam = 'body', color = PAL.white, align = 'center', a = 1, stroke = 0, strokeColor = PAL.navy, shadow = 0, base = 'middle' } = {}) {
      if (a <= 0) return 0; g.save(); g.globalAlpha = clamp(a); g.font = font(size, weight, fam); g.textAlign = align; g.textBaseline = base;
      if (shadow) { g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = shadow; g.shadowOffsetY = shadow / 4; }
      if (stroke) { g.lineJoin = 'round'; g.lineWidth = stroke; g.strokeStyle = strokeColor; g.strokeText(s, x, y); }
      g.fillStyle = color; g.fillText(s, x, y); const w = g.measureText(s).width; g.restore(); return w;
    },
    measure(s, size, weight = 800, fam = 'body') { g.save(); g.font = font(size, weight, fam); const w = g.measureText(s).width; g.restore(); return w; },
    /** one centred line made of coloured spans [{t, c}], each span can pop in at its own time */
    spans(list, cx, y, { size = 90, weight = 900, fam = 'disp', a = 1, stroke = 12, t = 1e9 } = {}) {
      const ws = list.map((s) => ui.measure(s.t, size, weight, fam)); let x = cx - ws.reduce((p, q) => p + q, 0) / 2;
      list.forEach((s, i) => {
        const k = s.at === undefined ? 1 : easeOut(ramp(t, s.at, s.at + 0.18));
        if (k > 0) { g.save(); const sc = lerp(0.6, 1, k); g.translate(x + ws[i] / 2, y); g.scale(sc, sc);
          ui.text(s.t, 0, 0, { size, weight, fam, color: s.c || PAL.white, a: a * k, stroke, shadow: 24 }); g.restore(); }
        x += ws[i];
      });
    },
    pill(s, x, y, { on = false, a = 1, size = 28, sc = 1 } = {}) {
      if (a <= 0) return; const w = ui.measure(s, size, 800) + 44, h = size + 26; g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(sc, sc);
      rr(g, -w / 2, -h / 2, w, h, h / 2); g.fillStyle = on ? PAL.orange : 'rgba(11,18,32,0.75)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = on ? PAL.orange : '#2a3f5f'; g.stroke();
      g.restore(); ui.text(s, x, y + 1, { size: size * sc, weight: 800, color: on ? PAL.navy : '#7d93b0', a });
      return w;
    },
    /** row of pills, `active` index (or -1); `glow` 0..1 pulses the active pill */
    pills(list, active, y, { a = 1, size = 27, gap = 12, glow = 0 } = {}) {
      const ws = list.map((s) => ui.measure(s, size, 800) + 44); let x = W2 - (ws.reduce((p, q) => p + q, 0) + gap * (list.length - 1)) / 2;
      list.forEach((s, i) => { ui.pill(s, x + ws[i] / 2, y, { on: i === active, a, size, sc: i === active ? 1 + 0.06 * glow : 1 }); x += ws[i] + gap; });
    },
    /** label box at (bx, by) with a leader line to a 3D anchor; k = 0..1 reveal (line draws, then box pops) */
    label(s, anchor, bx, by = null, { k = 1, hot = false, size = 34 } = {}) {
      if (k <= 0) return; const [px, py] = st.project(anchor); by = by === null ? clamp(py, 260, 1480) : by;
      const col = hot ? PAL.orange : PAL.cyan, lk = easeOut(ramp(k, 0, 0.6)), bk = easeOut(ramp(k, 0.35, 1));
      g.save(); g.globalAlpha = clamp(k * 3); g.strokeStyle = col; g.lineWidth = 3.5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, bx, lk), lerp(py, by, lk)); g.stroke();
      g.fillStyle = col; g.beginPath(); g.arc(px, py, 9 * Math.min(1, k * 4), 0, Math.PI * 2); g.fill();
      g.fillStyle = rgba(PAL.navy, 0.6); g.beginPath(); g.arc(px, py, 4, 0, Math.PI * 2); g.fill(); g.restore();
      if (bk > 0) {
        const w = ui.measure(s, size, 700) + 40, h = size + 24; g.save(); g.globalAlpha = bk; g.translate(bx, by); g.scale(lerp(0.7, 1, bk), lerp(0.7, 1, bk));
        rr(g, -w / 2, -h / 2, w, h, 13); g.fillStyle = 'rgba(11,18,32,0.82)'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = col; g.stroke(); g.restore();
        ui.text(s, bx, by + 1, { size, weight: 700, a: bk });
      }
    },
    /** big number callout: value (huge) + caption (small) */
    callout(big, small, x, y, { a = 1, color = PAL.orange, size = 120, t0 = null, t = 0 } = {}) {
      if (a <= 0) return; const k = t0 === null ? 1 : easeOut(ramp(t, t0, t0 + 0.3)); g.save(); g.translate(x, y); const sc = lerp(0.5, 1, k); g.scale(sc, sc);
      ui.text(big, 0, 0, { size, weight: 900, fam: 'disp', color, a: a * k, stroke: 14, shadow: 30 });
      if (small) ui.text(small, 0, size * 0.62, { size: size * 0.3, weight: 800, color: PAL.white, a: a * k, stroke: 8 });
      g.restore();
    },
    /** word-by-word captions from timed words [{w, t, end}], chunks of up to `max` words */
    captions(words, t, { y = 1390, size = 72, max = 3, from = 0, until = 1e9, a = 1 } = {}) {
      if (!words || t < from || t > until) return;
      const chunks = ui._chunks || (ui._chunks = chunkWords(words, max));
      const i = chunks.findIndex((c, j) => t >= c.t && (j === chunks.length - 1 || t < chunks[j + 1].t));
      if (i < 0) return; const c = chunks[i]; if (t > c.end + 0.6) return;
      const k = easeOut(ramp(t, c.t, c.t + 0.12)), parts = c.words.map((w) => w.w), sp = ui.measure(' ', size, 900, 'disp');
      const ws = parts.map((p) => ui.measure(p, size, 900, 'disp')); let x = W2 - (ws.reduce((p, q) => p + q, 0) + sp * (parts.length - 1)) / 2;
      g.save(); g.translate(W2, y); g.scale(lerp(0.88, 1, k), lerp(0.88, 1, k)); g.translate(-W2, -y);
      c.words.forEach((w, j) => {
        const on = t >= w.t && (j === c.words.length - 1 || t < c.words[j + 1].t);
        ui.text(w.w, x + ws[j] / 2, y, { size, weight: 900, fam: 'disp', color: on ? PAL.orange : PAL.white, a: a * k, stroke: 13, shadow: 20 });
        x += ws[j] + sp;
      });
      g.restore();
    },
    /** horizontal split bar, e.g. energy: [{v:0.33, c, label}, ...], k = 0..1 grow */
    splitBar(parts, x, y, w, h, { k = 1, a = 1 } = {}) {
      if (a <= 0) return; g.save(); g.globalAlpha = a; rr(g, x, y, w, h, h / 2); g.fillStyle = 'rgba(11,18,32,0.8)'; g.fill(); g.clip();
      let cx = x; for (const p of parts) { const pw = w * p.v * smooth(k); g.fillStyle = p.c; g.fillRect(cx, y, pw, h); cx += pw; } g.restore();
      g.save(); g.globalAlpha = a; rr(g, x, y, w, h, h / 2); g.lineWidth = 3; g.strokeStyle = '#2a3f5f'; g.stroke(); g.restore();
      cx = x; for (const p of parts) { const pw = w * p.v; if (p.label) ui.text(p.label, cx + pw / 2, y + h + 44, { size: 34, weight: 800, color: p.c, a: a * ramp(k, 0.6, 1), stroke: 8 }); cx += pw; }
    },
    /** small logo + channel name, top-left */
    brand(img, { a = 0.9, x = 64, y = 130 } = {}) {
      if (a <= 0) return; g.save(); g.globalAlpha = a; if (img) { g.beginPath(); g.arc(x + 24, y, 24, 0, Math.PI * 2); g.clip(); g.drawImage(img, x, y - 24, 48, 48); } g.restore();
      ui.text('How It Really Works', x + 62, y + 1, { size: 26, weight: 700, color: PAL.muted, align: 'left', a });
    },
    /** tiny footnote (fact context) */
    note(s, y, a = 1) { ui.text(s, W2, y, { size: 26, weight: 700, color: PAL.muted, a, stroke: 6 }); },
  };
  return ui;
}
const W2 = 540;

/** group timed words into caption chunks: break after punctuation or at `max` words */
export function chunkWords(words, max = 3) {
  const out = []; let cur = null;
  words.forEach((w, i) => {
    if (!cur) { cur = { t: w.t, end: w.end, words: [] }; out.push(cur); }
    cur.words.push(w); cur.end = w.end;
    const brk = /[.,!?:;]$/.test(w.w) || cur.words.length >= max || (words[i + 1] && words[i + 1].t - w.end > 0.35);
    if (brk) cur = null;
  });
  out.forEach((c) => c.words.forEach((w) => { w.w = w.w.replace(/[,;:]$/, ''); }));
  return out;
}
