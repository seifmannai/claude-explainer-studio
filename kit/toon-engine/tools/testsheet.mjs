import { chromium } from 'playwright'; import { serve } from './serve.mjs';
const s = await serve('web'); const port = s.address().port;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1800, height: 1200 } });
pg.on('console', m => console.log('console:', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://127.0.0.1:${port}/${process.argv[2] || 'test.html'}`);
await pg.waitForFunction('window.done === true', null, { timeout: 60000 });
await pg.screenshot({ path: process.argv[3] || 'stills/cast.png' });
await b.close(); s.close();
