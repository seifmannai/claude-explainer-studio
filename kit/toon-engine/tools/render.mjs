// node render.mjs <outdir> "0-1508" | "5,40,90"   (RESUME=1 skips frames already on disk)
import { chromium } from 'playwright'; import fs from 'node:fs'; import { serve } from './serve.mjs';
const [out, spec] = process.argv.slice(2);
const frames = spec.split(',').flatMap((p) => { if (p.includes('-')) { const [a, b] = p.split('-').map(Number); return Array.from({ length: b - a + 1 }, (_, i) => a + i); } return [Number(p)]; });
fs.mkdirSync(out, { recursive: true });
const s = await serve('web'); const port = s.address().port;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-sandbox'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', (e) => console.log('PAGEERROR', e.message));
pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 300)); });
await pg.goto(`http://127.0.0.1:${port}/index.html`);
await pg.waitForFunction('window.ready === true', null, { timeout: 120000 });
const t0 = Date.now(); let n = 0;
for (const f of frames) {
  const fn = `${out}/f${String(f).padStart(4, '0')}.jpg`;
  if (process.env.RESUME && fs.existsSync(fn) && fs.statSync(fn).size > 1000) continue;
  const url = await pg.evaluate((f) => { window.renderFrame(f); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, f);
  fs.writeFileSync(fn + '.tmp', Buffer.from(url.split(',')[1], 'base64')); fs.renameSync(fn + '.tmp', fn);
  n++; if (n % 10 === 0 || n === 1) console.log(`frame ${f} done (${n}/${frames.length}) ${((Date.now() - t0) / n / 1000).toFixed(2)} s/frame`);
}
console.log('DONE', n, 'frames', ((Date.now() - t0) / 1000).toFixed(0), 's');
await b.close(); s.close();
