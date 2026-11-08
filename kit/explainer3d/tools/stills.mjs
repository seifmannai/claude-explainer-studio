// Cloud preview: render chosen frames of a page with SwiftShader (slow but needs no GPU) -> JPEGs.
//   node stills.mjs <repo-root> <page> <outdir> <f1,f2,...> [scale]
//   node stills.mjs <repo-root> <page> <outdir> events      -> outdir/events.json (sound cues from window.events())
import { chromium } from 'playwright-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [root, page, out, list, scale = '1'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.otf': 'font/otf', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: Number(scale) });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLE', m.text().slice(0, 300)); });
await p.goto(`http://127.0.0.1:${srv.address().port}/${page}`);
await p.waitForFunction('window.done === true', null, { timeout: 600000 });
console.log('frames in video:', await p.evaluate(() => window.frames));
if (list === 'events') { fs.writeFileSync(path.join(out, 'events.json'), JSON.stringify(await p.evaluate(() => window.events()))); console.log('events ->', out); await b.close(); srv.close(); process.exit(0); }
for (const f of list.split(',').map(Number)) {
  const t0 = Date.now(); await p.evaluate((x) => window.renderFrame(x), f);
  const u = await p.evaluate(() => { const c = document.getElementById('c'); const d = document.createElement('canvas'); d.width = 1080; d.height = 1920; const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, 1080, 1920); return d.toDataURL('image/jpeg', 0.9); });
  fs.writeFileSync(path.join(out, `f${String(f).padStart(4, '0')}.jpg`), Buffer.from(u.split(',')[1], 'base64')); console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(1), 's');
}
await b.close(); srv.close();
