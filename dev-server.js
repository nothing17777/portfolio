// Local-only dev server: serves the static site and wires POST /api/chat
// to the same handler Vercel would run. Not part of the deployed site —
// Vercel's own zero-config handling of api/ takes over in production.
const fs = require('fs');
const path = require('path');
const http = require('http');

try {
  require('dotenv').config({ path: path.join(__dirname, '.env.local') });
} catch (e) {
  // no dotenv package available; fall back to a tiny manual .env.local parser
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
  }
}

const chatHandler = require('./api/chat.js');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.pdf': 'application/pdf', '.ipynb': 'application/json',
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch (e) { /* leave empty */ }
      const fakeReq = { method: 'POST', body: parsed };
      const fakeRes = {
        status(code) { this._status = code; return this; },
        json(obj) {
          res.writeHead(this._status || 200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(obj));
        },
      };
      chatHandler(fakeReq, fakeRes);
    });
    return;
  }

  let filePath = path.join(__dirname, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Dev server with /api/chat running at http://localhost:${PORT}/`);
  console.log(`OPENROUTER_API_KEY set: ${Boolean(process.env.OPENROUTER_API_KEY)}`);
});
