import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
export const serve = (root, port = 0) => new Promise((res) => {
  const s = http.createServer((req, rsp) => {
    const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, u === '/' ? 'index.html' : u);
    fs.readFile(f, (e, d) => { if (e) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); rsp.end(d); });
  });
  s.listen(port, '127.0.0.1', () => res(s));
});
