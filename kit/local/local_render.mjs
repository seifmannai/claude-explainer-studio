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
const GPU_ARGS = ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11'];
const OFFSCREEN = ['--window-position=-32000,-32000', '--window-size=600,1000', '--start-minimized'];
const isCpu = (g) => /swiftshader|basic render|llvmpipe|software/i.test(g);
async function open(how) {
  const b = how === 'cloud' ? await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
    : await chromium.launch({ channel: 'msedge', headless: how === 'headless', args: how === 'headless' ? GPU_ARGS : [...GPU_ARGS, ...OFFSCREEN] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: mode === 'still' ? 2 : 1 });
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/${page}`);
  await p.waitForFunction('window.done === true', null, { timeout: 300000 });
  return { b, p, gpu: await p.evaluate(() => window.glInfo || 'unknown') };
}
const t0 = Date.now();
let { b, p, gpu } = await open(process.env.CLOUD_TEST ? 'cloud' : 'headless');
if (!process.env.CLOUD_TEST && isCpu(gpu)) { console.log('headless used the CPU, switching to a hidden window'); await b.close(); ({ b, p, gpu } = await open('offscreen')); }
console.log('GPU:', gpu, '| first frame (load + compile):', ((Date.now() - t0) / 1000).toFixed(1), 's');
const grab = async (fn) => { const u = await p.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', 0.95)); fs.writeFileSync(fn, Buffer.from(u.split(',')[1], 'base64')); };
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
  const [a, z] = arg.split('-').map(Number); const t1 = Date.now();
  for (let f = a; f <= z; f++) { const fn = path.join(out, `f${String(f).padStart(4, '0')}.jpg`); if (process.env.RESUME && fs.existsSync(fn)) continue; await p.evaluate((x) => window.renderFrame(x), f); await grab(fn); if (f % 50 === 0) console.log('frame', f, ((Date.now() - t1) / (f - a + 1) / 1000).toFixed(3), 's/frame'); }
  console.log('DONE', ((Date.now() - t1) / 1000).toFixed(0), 's');
}
await b.close(); srv.close();
