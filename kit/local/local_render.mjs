// Render on the user's Windows PC with the real GPU (Microsoft Edge via playwright-core, no Chromium download).
// node local_render.mjs speedtest <root> <page> <outdir> [n]
// node local_render.mjs frames <root> <page> <outdir> <first-last>   (page must expose window.renderFrame(f))
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [mode, root, page, out, arg] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.otf': 'font/otf', '.ttf': 'font/ttf', '.css': 'text/css', '.hdr': 'application/octet-stream' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
// CLOUD_TEST=1: same script in the cloud workspace (Playwright Chromium + SwiftShader) to catch bugs before sending jobs to the PC.
// On the PC Edge runs hidden: first headless (no window). If headless falls back to the CPU, reopen it as a window parked off-screen.
// Fake media devices: Edge never touches the real webcam/mic (her laptop light flashed at each Edge start).
const GPU_ARGS = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11', '--use-fake-device-for-media-stream', '--deny-permission-prompts', '--disable-features=MediaFoundationVideoCapture'];
const OFFSCREEN = ['--window-position=-32000,-32000', '--window-size=600,1000', '--start-minimized'];
const SCALE = Math.min(2, Math.max(1, Number(process.env.SCALE || 1))); // 1 = Full HD, 2 = 4K internal; frames are always saved at 1080x1920
const isCpu = (g) => /swiftshader|basic render|llvmpipe|software/i.test(g);
async function open(how) {
  const b = how === 'cloud' ? await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
    : await chromium.launch({ channel: 'msedge', headless: how === 'headless', args: how === 'headless' ? GPU_ARGS : [...GPU_ARGS, ...OFFSCREEN] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: mode === 'still' ? 2 : SCALE });
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}`);
  await p.waitForFunction('window.done === true', null, { timeout: 300000 });
  return { b, p, gpu: await p.evaluate(() => window.glInfo || 'unknown') };
}
const t0 = Date.now();
let { b, p, gpu } = await open(process.env.CLOUD_TEST ? 'cloud' : 'headless');
if (!process.env.CLOUD_TEST && isCpu(gpu)) { console.log('headless used the CPU, switching to a hidden window'); await b.close(); ({ b, p, gpu } = await open('offscreen')); }
console.log('GPU:', gpu, '| first frame (load + compile):', ((Date.now() - t0) / 1000).toFixed(1), 's');
const grab = async (fn) => { const u = await p.evaluate(() => { const c = document.getElementById('c'); if (c.width === 1080) return c.toDataURL('image/jpeg', 0.95); const d = document.createElement('canvas'); d.width = 1080; d.height = 1920; const x = d.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, 1080, 1920); return d.toDataURL('image/jpeg', 0.95); }); fs.writeFileSync(fn + '.tmp', Buffer.from(u.split(',')[1], 'base64')); fs.renameSync(fn + '.tmp', fn); };
// Live progress page: out\progress.html (opened by "3-VIEW PROGRESS.bat"), refreshes every 2 s.
const PROG = path.join(path.dirname(out), 'progress.html');
const fmt = (s) => s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`;
function progress(done, total, sec, last, finished) {
  const per = done ? sec / done : 0, left = per * (total - done), pct = total ? Math.round(done / total * 100) : 0;
  const end = new Date(Date.now() + left * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const rel = last ? path.relative(path.dirname(out), last).split(path.sep).join('/') : '';
  const html = `<!doctype html><meta charset="utf-8">${finished ? '' : '<meta http-equiv="refresh" content="2">'}<title>${finished ? 'DONE' : pct + '%'} - render</title>
<body style="margin:0;background:#0b1220;color:#f2f6fa;font:600 18px Segoe UI,sans-serif;display:flex;gap:28px;padding:24px">
<div style="min-width:340px"><div style="font-size:14px;color:#9fb2c8">HOW IT REALLY WORKS - RENDER</div><h2 style="margin:6px 0 18px">${path.basename(out)}</h2>
<div style="font-size:44px;font-weight:800;color:${finished ? '#3fe0e8' : '#ffb547'}">${finished ? 'DONE' : pct + ' %'}</div>
<div style="height:12px;background:#14233a;border-radius:6px;margin:10px 0 20px"><div style="height:12px;width:${pct}%;background:#3fe0e8;border-radius:6px"></div></div>
<p>Frame <b>${done}</b> / ${total}</p><p>Speed: <b>${per.toFixed(2)} s</b> per frame</p><p>Quality: <b>${SCALE}x</b> (${Math.round(1080 * SCALE)}x${Math.round(1920 * SCALE)} inside, saved 1080x1920)</p>
<p>Elapsed: <b>${fmt(sec)}</b></p>${finished ? '' : `<p>Time left: <b>${fmt(left)}</b> (done about ${end})</p>`}</div>
${rel ? `<img src="${rel}" style="height:calc(100vh - 48px);border-radius:10px">` : ''}</body>`;
  try { fs.writeFileSync(PROG + '.tmp', html); fs.renameSync(PROG + '.tmp', PROG); } catch (e) { /* page open in the browser; try again next frame */ }
}
if (mode === 'still') {
  const t1 = Date.now(); await p.evaluate(() => window.renderFrame(12)); const hd = await p.evaluate(() => (window.hdriUsed ? window.hdriUsed() : 'n/a'));
  await p.screenshot({ path: path.join(out, (arg || 'still') + '.png') });
  const msg = `GPU: ${gpu}\nenvironment: ${hd}\nstill (2x supersampled 2160x3840) render seconds: ${((Date.now() - t1) / 1000).toFixed(2)}\n`; fs.writeFileSync(path.join(out, (arg || 'still') + '.txt'), msg); console.log(msg);
} else if (mode === 'speedtest') {
  const n = Number(arg || 30); const t1 = Date.now();
  for (let i = 0; i < n; i++) { await p.evaluate((f) => window.renderFrame(f), i); await grab(path.join(out, `speed_${i}.jpg`)); }
  const per = (Date.now() - t1) / n / 1000;
  await p.screenshot({ path: path.join(out, 'speedtest_full.png') });
  const msg = `GPU: ${gpu}\nframes: ${n}\nseconds per frame (render + save): ${per.toFixed(3)}\n65 s Short (1950 frames) estimate: ${(per * 1950 / 60).toFixed(1)} min\n`;
  fs.writeFileSync(path.join(out, 'speedtest.txt'), msg); console.log(msg);
} else {
  const [a, z] = arg.split('-').map(Number); const t1 = Date.now(); let n = 0, last = '';
  for (let f = a; f <= z; f++) {
    const fn = path.join(out, `f${String(f).padStart(4, '0')}.jpg`);
    if (!(process.env.RESUME && fs.existsSync(fn))) { await p.evaluate((x) => window.renderFrame(x), f); await grab(fn); n++; last = fn; }
    if (f % 5 === 0 || f === z) progress(f - a + 1, z - a + 1, (Date.now() - t1) / 1000 * (f - a + 1) / Math.max(1, n), last, false);
    if (f % 50 === 0) console.log('frame', f, ((Date.now() - t1) / Math.max(1, n) / 1000).toFixed(3), 's/frame');
  }
  progress(z - a + 1, z - a + 1, (Date.now() - t1) / 1000, last, true);
  console.log('SCALE', SCALE, '|', n, 'frames |', ((Date.now() - t1) / Math.max(1, n) / 1000).toFixed(3), 's/frame');
  console.log('DONE', ((Date.now() - t1) / 1000).toFixed(0), 's');
}
await b.close(); srv.close();
