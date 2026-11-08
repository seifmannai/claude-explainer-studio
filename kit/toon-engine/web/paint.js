// Painted canvas textures: flat colour + dark seams, cartoon style. Each painter returns a canvas.
const cv = (w, h = w) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const hexMul = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), c = (v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
  return '#' + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255);
};

/** sea: base blue with lighter wave dashes and darker troughs (tileable) */
export const sea = (base = '#3f86b8') => {
  const c = cv(512), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const x = rnd(i) * 512, y = rnd(i + 50) * 512, w = 30 + rnd(i + 9) * 70, dark = i % 3 === 0;
    g.strokeStyle = dark ? hexMul(base, 0.86) : hexMul(base, 1.22); g.lineWidth = dark ? 5 : 4;
    for (const dx of [0, -512, 512]) for (const dy of [0, -512, 512]) {
      g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + w / 2, y + dy - 7, x + dx + w, y + dy); g.stroke();
    }
  }
  return c;
};

/** steel hull plates: flat colour, faint horizontal + vertical plate seams, optional porthole row */
export const steel = (base, ports = false, seed = 1) => {
  const c = cv(512), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6; i++) { g.fillStyle = hexMul(base, 0.96 + 0.08 * rnd(seed + i)); g.fillRect(0, i * 85, 512, 85); }
  g.strokeStyle = hexMul(base, 0.78); g.lineWidth = 3;
  for (let y = 0; y <= 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let r = 0; r < 4; r++) for (let x = (r % 2) * 90; x < 512; x += 180) { g.beginPath(); g.moveTo(x, r * 128); g.lineTo(x, r * 128 + 128); g.stroke(); }
  if (ports) for (let x = 32; x < 512; x += 64) { g.fillStyle = '#20222a'; g.beginPath(); g.arc(x, 96, 9, 0, 7); g.fill(); g.strokeStyle = hexMul(base, 1.25); g.lineWidth = 3; g.stroke(); }
  return c;
};

/** wooden planks (deck, plank, bench) */
export const planks = (base = '#b58353', n = 6, seed = 3) => {
  const c = cv(512), g = c.getContext('2d'), h = 512 / n;
  for (let i = 0; i < n; i++) { g.fillStyle = hexMul(base, 0.9 + 0.18 * rnd(seed + i)); g.fillRect(0, i * h, 512, h); }
  g.strokeStyle = hexMul(base, 0.55); g.lineWidth = 4;
  for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(0, i * h); g.lineTo(512, i * h); g.stroke(); }
  for (let i = 0; i < n; i++) { const x = rnd(seed + i * 7) * 512; g.beginPath(); g.moveTo(x, i * h); g.lineTo(x, i * h + h); g.stroke(); }
  g.strokeStyle = hexMul(base, 0.78); g.lineWidth = 2;
  for (let i = 0; i < 14; i++) { const y = rnd(i + 40) * 512, x = rnd(i + 80) * 400; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60 + rnd(i) * 80, y + 2); g.stroke(); }
  return c;
};

/** flight deck: dark grey panels, white centre dashes + edge lines (UV u along length) */
export const flightDeck = () => {
  const c = cv(1024, 256), g = c.getContext('2d');
  g.fillStyle = '#5b6068'; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 16; i++) { g.fillStyle = hexMul('#5b6068', 0.94 + 0.1 * rnd(i)); g.fillRect(i * 64, 0, 64, 256); }
  g.strokeStyle = '#474b52'; g.lineWidth = 2;
  for (let x = 0; x <= 1024; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.fillStyle = '#eeeae0';
  for (let x = 20; x < 1000; x += 90) g.fillRect(x, 124, 50, 8);
  g.fillRect(0, 14, 1024, 6); g.fillRect(0, 236, 1024, 6);
  return c;
};

export const stone = (base = '#a99f92', seed = 5) => {
  const c = cv(512), g = c.getContext('2d');
  g.fillStyle = hexMul(base, 0.62); g.fillRect(0, 0, 512, 512);
  const rows = 6, rh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    let x = -rnd(seed + r) * 80;
    while (x < 512) {
      const w = 70 + rnd(seed + r * 13 + x) * 70;
      g.fillStyle = hexMul(base, 0.88 + 0.22 * rnd(seed + x + r));
      g.beginPath(); g.roundRect(x + 4, r * rh + 4, w - 8, rh - 8, 10); g.fill();
      x += w;
    }
  }
  return c;
};

export const plaster = (base = '#efe2c6') => {
  const c = cv(512), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 40; i++) { g.fillStyle = hexMul(base, 0.93 + 0.06 * rnd(i)); g.beginPath(); g.ellipse(rnd(i + 3) * 512, rnd(i + 7) * 512, 30 + rnd(i) * 50, 14 + rnd(i + 1) * 20, 0, 0, 7); g.fill(); }
  return c;
};

export const roofTiles = (base = '#b5523a') => {
  const c = cv(512), g = c.getContext('2d');
  g.fillStyle = hexMul(base, 0.7); g.fillRect(0, 0, 512, 512);
  for (let r = 0; r < 8; r++) for (let i = -1; i < 9; i++) {
    const x = i * 64 + (r % 2) * 32, y = r * 64;
    g.fillStyle = hexMul(base, 0.9 + 0.2 * rnd(r * 9 + i));
    g.beginPath(); g.moveTo(x + 3, y); g.lineTo(x + 61, y); g.lineTo(x + 61, y + 44); g.quadraticCurveTo(x + 32, y + 66, x + 3, y + 44); g.closePath(); g.fill();
  }
  return c;
};

/** signboard text (never mirrored: drawn left-to-right on the canvas, plane faces +normal with standard UVs) */
export const sign = (text, w = 1024, h = 256, bg = '#2f4f7a', fg = '#f6e7b8') => {
  const c = cv(w, h), g = c.getContext('2d');
  g.fillStyle = '#241726'; g.beginPath(); g.roundRect(0, 0, w, h, 26); g.fill();
  g.fillStyle = bg; g.beginPath(); g.roundRect(12, 12, w - 24, h - 24, 18); g.fill();
  let fs = Math.round(h * 0.5); g.font = `900 ${fs}px Georgia, 'DejaVu Serif', serif`;
  while (g.measureText(text).width > w - 90 && fs > 10) { fs -= 4; g.font = `900 ${fs}px Georgia, 'DejaVu Serif', serif`; }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  return c;
};

export const window4 = () => {
  const c = cv(256), g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#2b3550'; g.fillRect(22, 22, 212, 212);
  g.fillStyle = '#4c6a92'; g.fillRect(30, 30, 92, 92); g.fillRect(134, 30, 92, 92); g.fillRect(30, 134, 92, 92); g.fillRect(134, 134, 92, 92);
  g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(40, 110); g.lineTo(100, 40); g.lineTo(115, 40); g.lineTo(55, 110); g.fill();
  return c;
};

export const door = () => {
  const c = cv(256, 512), g = c.getContext('2d');
  g.fillStyle = '#2f5c46'; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = '#1f3d2f'; g.lineWidth = 10;
  g.strokeRect(30, 30, 196, 200); g.strokeRect(30, 260, 196, 220);
  g.fillStyle = '#e8c45a'; g.beginPath(); g.arc(205, 280, 12, 0, 7); g.fill();
  return c;
};

/** ship bridge windows strip */
export const bridgeWin = (base) => {
  const c = cv(512, 128), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 512, 128);
  g.fillStyle = '#1d2230';
  for (let x = 16; x < 512; x += 56) g.fillRect(x, 40, 38, 30);
  return c;
};
